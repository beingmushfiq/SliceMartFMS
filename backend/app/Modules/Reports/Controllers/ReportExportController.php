<?php

declare(strict_types=1);

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Actions\CreateReportExportAction;
use App\Modules\Reports\Models\ReportExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportExportController extends Controller
{
    public function export(string $code, Request $request, CreateReportExportAction $action): JsonResponse
    {
        $format = (string) $request->input('format', 'csv');
        $filters = (array) $request->input('filters', []);

        $export = $action->execute($code, $filters, $format);

        return response()->json([
            'message' => 'Export job accepted and completed successfully.',
            'data' => [
                'uuid' => $export->uuid,
                'status' => $export->status,
                'format' => $export->format,
                'file_path' => $export->file_path,
                'row_count' => $export->row_count,
                'file_size_bytes' => $export->file_size_bytes,
                'expires_at' => $export->expires_at?->toIso8601String(),
            ],
        ], 202);
    }

    public function show(string $uuid): JsonResponse
    {
        $export = ReportExport::where('uuid', $uuid)->firstOrFail();

        return response()->json([
            'data' => [
                'uuid' => $export->uuid,
                'status' => $export->status,
                'format' => $export->format,
                'file_path' => $export->file_path,
                'row_count' => $export->row_count,
                'file_size_bytes' => $export->file_size_bytes,
                'expires_at' => $export->expires_at?->toIso8601String(),
            ],
        ]);
    }
}
