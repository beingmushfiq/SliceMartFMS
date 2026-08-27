<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\ProductionOutput;
use App\Models\QcDefect;
use App\Models\QcInspection;
use App\Models\QcInspectionResult;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateQcInspectionAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{qcInspection: QcInspection}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        $tenantId = (int) $actor->tenant_id;

        $number = is_string($input['inspection_number']) ? $input['inspection_number'] : '';
        if (QcInspection::where('inspection_number', $number)->exists()) {
            throw new DuplicateResourceException('inspection_number', $number);
        }

        $inspectorId = $this->resolveId('employees', $input['inspector_id'], $tenantId, 'inspector_id');

        $batchId = null;
        if (! empty($input['production_batch_id'])) {
            $batchId = $this->resolveId('production_batches', $input['production_batch_id'], $tenantId, 'production_batch_id');
        }

        $outputId = null;
        if (! empty($input['production_output_id'])) {
            $outputId = $this->resolveId('production_outputs', $input['production_output_id'], $tenantId, 'production_output_id');
        }

        $inspection = DB::transaction(function () use ($input, $actor, $tenantId, $number, $inspectorId, $batchId, $outputId): QcInspection {
            $inspection = QcInspection::create([
                'uuid' => (string) Str::uuid(),
                'inspection_number' => $number,
                'production_batch_id' => $batchId,
                'production_output_id' => $outputId,
                'inspection_date' => $input['inspection_date'],
                'inspector_id' => $inspectorId,
                'sample_size' => $input['sample_size'],
                'inspected_quantity' => $input['inspected_quantity'],
                'passed_quantity' => $input['passed_quantity'],
                'failed_quantity' => $input['failed_quantity'] ?? '0.0000',
                'rework_quantity' => $input['rework_quantity'] ?? '0.0000',
                'scrap_quantity' => $input['scrap_quantity'] ?? '0.0000',
                'result' => $input['result'],
                'status' => 'draft',
                'notes' => $input['notes'] ?? null,
                'created_by' => $actor->id,
            ]);

            // Create nested results
            if (! empty($input['results']) && is_array($input['results'])) {
                /** @var array<string, mixed> $item */
                foreach ($input['results'] as $item) {
                    $paramId = $this->resolveId('qc_parameters', $item['qc_parameter_id'], $tenantId, 'qc_parameter_id');
                    QcInspectionResult::create([
                        'uuid' => (string) Str::uuid(),
                        'qc_inspection_id' => $inspection->id,
                        'qc_parameter_id' => $paramId,
                        'value_numeric' => $item['value_numeric'] ?? null,
                        'value_boolean' => isset($item['value_boolean']) ? ($item['value_boolean'] ? 1 : 0) : null,
                        'value_text' => $item['value_text'] ?? null,
                        'is_within_spec' => ($item['is_within_spec'] ?? true) ? 1 : 0,
                        'notes' => $item['notes'] ?? null,
                        'created_by' => $actor->id,
                    ]);
                }
            }

            // Create nested defects
            if (! empty($input['defects']) && is_array($input['defects'])) {
                /** @var array<string, mixed> $defect */
                foreach ($input['defects'] as $defect) {
                    $reasonId = $this->resolveId('reason_codes', $defect['defect_reason_id'], $tenantId, 'defect_reason_id');
                    QcDefect::create([
                        'uuid' => (string) Str::uuid(),
                        'qc_inspection_id' => $inspection->id,
                        'defect_reason_id' => $reasonId,
                        'quantity' => $defect['quantity'],
                        'severity' => $defect['severity'] ?? 'minor',
                        'notes' => $defect['notes'] ?? null,
                        'created_by' => $actor->id,
                    ]);
                }
            }

            // Update output QC status if linked
            if ($outputId !== null) {
                $qcStatusMap = [
                    'pass' => 'passed',
                    'fail' => 'rejected',
                    'partial' => 'partial',
                    'hold' => 'pending',
                ];
                $resKey = is_string($input['result']) ? $input['result'] : '';
                $newQcStatus = $qcStatusMap[$resKey] ?? 'pending';
                ProductionOutput::where('id', $outputId)->update([
                    'qc_status' => $newQcStatus,
                    'updated_by' => $actor->id,
                ]);
            }

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $inspection,
                after: $inspection->toArray(),
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'qc_inspection']
            );

            return $inspection;
        });

        return [
            'qcInspection' => $inspection->load(['productionBatch', 'productionOutput', 'inspector', 'results.qcParameter', 'defects.defectReason']),
        ];
    }

    private function resolveId(string $table, mixed $uuid, int $tenantId, string $field): int
    {
        $row = DB::table($table)->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}
