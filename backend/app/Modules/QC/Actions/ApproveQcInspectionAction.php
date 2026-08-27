<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\QcInspection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ApproveQcInspectionAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, qcInspection: QcInspection}  $input
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
                'status' => 'The QC inspection is already approved.',
            ]);
        }

        $inspection = DB::transaction(function () use ($actor, $inspection): QcInspection {
            $before = $inspection->toArray();

            $inspection->update([
                'status' => 'approved',
                'approved_by' => $actor->id,
                'approved_at' => now(),
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Approved,
                auditable: $inspection,
                before: $before,
                after: $inspection->toArray(),
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'qc_inspection', 'event' => 'approved']
            );

            return $inspection;
        });

        return [
            'qcInspection' => $inspection->load(['productionBatch', 'productionOutput', 'inspector', 'results.qcParameter', 'defects.defectReason', 'approvedByUser']),
        ];
    }
}
