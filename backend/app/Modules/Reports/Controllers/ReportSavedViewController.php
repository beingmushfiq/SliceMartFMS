<?php

declare(strict_types=1);

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Actions\SaveReportViewAction;
use App\Modules\Reports\Models\ReportDefinition;
use App\Modules\Reports\Models\ReportSavedView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportSavedViewController extends Controller
{
    public function index(string $code): JsonResponse
    {
        $definition = ReportDefinition::where('code', $code)->firstOrFail();
        $user = auth()->user();
        $userId = $user?->id ?? 1;

        $views = ReportSavedView::where('report_definition_id', $definition->id)
            ->where(function ($q) use ($userId): void {
                $q->where('user_id', $userId)->orWhere('is_shared', true);
            })
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $views,
        ]);
    }

    public function store(string $code, Request $request, SaveReportViewAction $action): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array',
            'is_default' => 'nullable|boolean',
        ]);

        $view = $action->execute(
            $code,
            $validated['name'],
            $validated['filters'] ?? [],
            $validated['columns'] ?? [],
            $validated['is_default'] ?? false
        );

        return response()->json([
            'message' => 'Report view saved successfully.',
            'data' => $view,
        ], 201);
    }
}
