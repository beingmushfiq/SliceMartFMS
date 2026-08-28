<?php

declare(strict_types=1);

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ChartOfAccount::query()->with('parent');

        if ($request->filled('account_type')) {
            $query->where('account_type', $request->query('account_type'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $accounts = $query->orderBy('account_code')->get();

        return response()->json([
            'data' => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'account_code' => 'required|string|max:64',
            'name' => 'required|string|max:255',
            'account_type' => 'required|string|in:asset,liability,equity,income,expense',
            'account_subtype' => 'required|string|max:64',
            'parent_id' => 'nullable|integer',
            'is_group' => 'nullable|boolean',
            'normal_balance' => 'nullable|string|in:debit,credit',
            'is_active' => 'nullable|boolean',
        ]);

        $account = ChartOfAccount::create([
            ...$validated,
            'is_group' => $validated['is_group'] ?? false,
            'normal_balance' => $validated['normal_balance'] ?? ($validated['account_type'] === 'asset' || $validated['account_type'] === 'expense' ? 'debit' : 'credit'),
            'is_active' => $validated['is_active'] ?? true,
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $account,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $account = ChartOfAccount::with(['parent', 'children'])->findOrFail($id);

        return response()->json([
            'data' => $account,
        ]);
    }
}
