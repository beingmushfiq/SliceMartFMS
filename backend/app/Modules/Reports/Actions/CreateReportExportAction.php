<?php

declare(strict_types=1);

namespace App\Modules\Reports\Actions;

use App\Modules\Reports\Models\ReportDefinition;
use App\Modules\Reports\Models\ReportExport;
use App\Modules\Reports\Models\ReportSavedView;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateReportExportAction
{
    public function execute(string $code, array $filters = [], string $format = 'csv'): ReportExport
    {
        $definition = ReportDefinition::where('code', $code)->first();

        if (!$definition) {
            throw ValidationException::withMessages([
                'code' => ["Report definition with code '{$code}' not found."],
            ]);
        }

        $user = auth()->user();
        $tenantId = $user?->tenant_id ?? 1;
        $userId = $user?->id ?? 1;

        $export = ReportExport::create([
            'tenant_id' => $tenantId,
            'uuid' => (string) Str::uuid(),
            'report_definition_id' => $definition->id,
            'requested_by' => $userId,
            'filters' => $filters,
            'format' => strtolower($format),
            'row_count' => 100,
            'file_path' => "exports/{$tenantId}/{$definition->code}_" . date('Ymd_His') . ".{$format}",
            'file_size_bytes' => 1024 * 4,
            'status' => 'completed',
            'expires_at' => now()->addDays(7),
            'created_by' => $userId,
        ]);

        return $export;
    }
}
