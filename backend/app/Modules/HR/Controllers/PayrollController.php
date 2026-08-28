<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Actions\ProcessPayrollRunAction;
use App\Modules\HR\Models\PayrollPeriod;
use App\Modules\HR\Models\Payslip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function __construct(
        private readonly ProcessPayrollRunAction $processPayrollRunAction
    ) {}

    public function periods(Request $request): JsonResponse
    {
        $periods = PayrollPeriod::query()->orderByDesc('period_start')->paginate(20);

        return response()->json($periods);
    }

    public function storePeriod(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'period_code' => 'required|string|max:64',
            'pay_frequency' => 'required|string|in:monthly,weekly,daily,piece_rate',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'payment_date' => 'required|date',
        ]);

        $period = PayrollPeriod::create([
            ...$validated,
            'status' => 'open',
            'total_gross' => '0.0000',
            'total_deductions' => '0.0000',
            'total_net' => '0.0000',
            'employee_count' => 0,
            'created_by' => $request->user()?->id ?? 1,
            'updated_by' => $request->user()?->id ?? 1,
        ]);

        return response()->json([
            'data' => $period,
            'message' => 'Payroll period created successfully.',
        ], 201);
    }

    public function process(int $id, Request $request): JsonResponse
    {
        $userId = (int) ($request->user()?->id ?? 1);
        $period = $this->processPayrollRunAction->execute($id, $userId);

        return response()->json([
            'data' => $period,
            'message' => 'Payroll processed successfully. Payslips generated and period locked.',
        ], 200);
    }

    public function payslips(Request $request): JsonResponse
    {
        $query = Payslip::query()->with(['employee.department', 'payrollPeriod', 'items']);

        if ($request->filled('payroll_period_id')) {
            $query->where('payroll_period_id', $request->query('payroll_period_id'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->query('employee_id'));
        }

        $payslips = $query->orderByDesc('id')->paginate(20);

        return response()->json($payslips);
    }

    public function showPayslip(int $id): JsonResponse
    {
        $payslip = Payslip::with(['employee.department', 'payrollPeriod', 'items.component'])->findOrFail($id);

        return response()->json([
            'data' => $payslip,
        ]);
    }
}
