<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionOutput;
use App\Models\QcInspection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateQcInspectionAction extends Action
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
        /** @var QcInspection $inspection */
        $inspection = $input['qcInspection'];

        if ($inspection->status === 'approved') {
            throw ValidationException::withMessages([
                'status' => 'Cannot update an approved QC inspection.',
            ]);
        }

        $inspection = DB::transaction(function () use ($input, $actor, $inspection): QcInspection {
            $before = $inspection->toArray();
            $data = [];

            foreach (['sample_size', 'inspected_quantity', 'passed_quantity', 'failed_quantity', 'rework_quantity', 'scrap_quantity', 'result', 'notes'] as $field) {
                if (array_key_exists($field, $input)) {
                    $data[$field] = $input[$field];
                }
            }

            $data['updated_by'] = $actor->id;
            $inspection->update($data);

            // Update output QC status if result changed and output is linked
            if (isset($input['result']) && $inspection->production_output_id !== null) {
                $qcStatusMap = [
                    'pass' => 'passed',
                    'fail' => 'rejected',
                    'partial' => 'partial',
                    'hold' => 'pending',
                ];
                $resKey = is_string($input['result']) ? $input['result'] : '';
                $newQcStatus = $qcStatusMap[$resKey] ?? 'pending';
                ProductionOutput::where('id', $inspection->production_output_id)->update([
                    'qc_status' => $newQcStatus,
                    'updated_by' => $actor->id,
                ]);
            }

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $inspection,
                before: $before,
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
}
