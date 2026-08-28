<?php

declare(strict_types=1);

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Actions\RunReportQueryAction;
use App\Modules\Reports\Models\ReportDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportDataController extends Controller
{
    public function schema(string $code): JsonResponse
    {
        $definition = ReportDefinition::where('code', $code)->firstOrFail();

        return response()->json([
            'data' => [
                'code' => $definition->code,
                'name' => $definition->name,
                'module' => $definition->module,
                'category' => $definition->category,
                'description' => $definition->description,
                'default_filters' => $definition->default_filters,
                'available_columns' => $definition->available_columns,
                'supports_export' => $definition->supports_export,
                'tier' => $definition->tier,
            ],
        ]);
    }

    public function data(string $code, Request $request, RunReportQueryAction $action): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 25);
        $filters = $request->all();

        $result = $action->execute($code, $filters, $page, $perPage);

        return response()->json($result);
    }
}
