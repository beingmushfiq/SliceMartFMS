<?php

declare(strict_types=1);

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\SalaryComponent;
use App\Modules\HR\Models\SalaryStructure;
use App\Modules\HR\Models\SalaryStructureComponent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryStructureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $structures = SalaryStructure::with(['components.component', 'employees'])
            ->when($request->boolean('active_only', true), fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $structures,
        ]);
    }

    public function components(Request $request): JsonResponse
    {
        $components = SalaryComponent::query()
            ->when($request->boolean('active_only', true), fn ($q) => $q->where('is_active', true))
            ->orderBy('component_type')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $components,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:64',
            'name' => 'required|string|max:191',
            'description' => 'nullable|string',
            'currency_code' => 'nullable|string|max:3',
            'components' => 'nullable|array',
            'components.*.salary_component_id' => 'required|integer',
            'components.*.calculation_type' => 'required|string|in:fixed,percentage',
            'components.*.value' => 'required|numeric|min:0',
            'components.*.sort_order' => 'nullable|integer',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);

        $structure = DB::transaction(function () use ($validated, $userId) {
            $structure = SalaryStructure::create([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'currency_code' => $validated['currency_code'] ?? 'BDT',
                'is_active' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            if (!empty($validated['components'])) {
                foreach ($validated['components'] as $idx => $comp) {
                    SalaryStructureComponent::create([
                        'salary_structure_id' => $structure->id,
                        'component_id' => $comp['salary_component_id'],
                        'calculation_type' => $comp['calculation_type'],
                        'amount_or_percentage' => $comp['value'],
                        'sort_order' => $comp['sort_order'] ?? ($idx + 1),
                        'is_active' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                }
            }

            return $structure->load('components.component');
        });

        return response()->json([
            'data' => $structure,
            'message' => 'Salary structure configured successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $structure = SalaryStructure::with(['components.component', 'employees.designation'])->findOrFail($id);

        return response()->json([
            'data' => $structure,
        ]);
    }
}
