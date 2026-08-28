<?php

declare(strict_types=1);

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Actions\CreateExpenseAction;
use App\Modules\Finance\Actions\RollupProductionCostAction;
use App\Modules\Finance\Models\BankAccount;
use App\Modules\Finance\Models\Expense;
use App\Modules\Finance\Models\ExpenseCategory;
use App\Modules\Finance\Models\ProductCost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = BankAccount::query()->with('chartOfAccount')->orderBy('account_name')->get();

        return response()->json([
            'data' => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:128',
            'bank_name' => 'required|string|max:255',
            'branch_name' => 'nullable|string|max:255',
            'chart_of_account_id' => 'required|integer',
            'currency_code' => 'nullable|string|size:3',
            'opening_balance' => 'nullable|numeric',
        ]);

        $account = BankAccount::create([
            ...$validated,
            'currency_code' => $validated['currency_code'] ?? 'BDT',
            'opening_balance' => (string) ($validated['opening_balance'] ?? '0.0000'),
            'current_balance' => (string) ($validated['opening_balance'] ?? '0.0000'),
            'is_active' => true,
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $account,
        ], 201);
    }
}
