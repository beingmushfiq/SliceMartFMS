<?php

declare(strict_types=1);

namespace App\Modules\Assets\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Actions\CreateAssetAction;
use App\Modules\Assets\Models\Asset;
use App\Modules\Assets\Models\AssetCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function __construct(
        private readonly CreateAssetAction $createAssetAction
    ) {}

    public function categories(Request $request): JsonResponse
    {
        $categories = AssetCategory::query()->where('is_active', true)->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:64',
            'name' => 'required|string|max:255',
            'default_depreciation_method' => 'nullable|string|in:none,straight_line,declining_balance',
            'default_useful_life_months' => 'nullable|integer|min:1',
            'default_salvage_percentage' => 'nullable|numeric|min:0',
        ]);

        $category = AssetCategory::create([
            ...$validated,
            'is_active' => true,
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $category,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Asset::query()->with(['category', 'branch', 'assignedEmployee']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('asset_category_id', $request->query('category_id'));
        }

        $assets = $query->orderBy('name')->paginate(20);

        return response()->json($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_code' => 'nullable|string|max:64',
            'name' => 'required|string|max:255',
            'asset_category_id' => 'required|integer',
            'company_id' => 'required|integer',
            'branch_id' => 'required|integer',
            'purchase_cost' => 'required|numeric|min:0',
            'salvage_value' => 'nullable|numeric|min:0',
            'useful_life_months' => 'nullable|integer|min:1',
            'depreciation_method' => 'nullable|string|in:none,straight_line,declining_balance',
            'purchase_date' => 'nullable|date',
            'serial_number' => 'nullable|string|max:128',
            'assigned_employee_id' => 'nullable|integer',
            'status' => 'nullable|string',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $asset = $this->createAssetAction->execute($validated, $userId);

        return response()->json([
            'data' => $asset->load(['category', 'branch', 'assignedEmployee']),
            'message' => 'Asset registered successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $asset = Asset::with(['category', 'branch', 'assignedEmployee', 'depreciationEntries', 'maintenanceOrders'])->findOrFail($id);

        return response()->json([
            'data' => $asset,
        ]);
    }
}
