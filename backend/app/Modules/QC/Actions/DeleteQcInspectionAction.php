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

final class DeleteQcInspectionAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, qcInspection: QcInspection}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var QcInspection $inspection */
        $inspection = $input['qcInspection'];

        if ($inspection->status === 'approved') {
            throw ValidationException::withMessages([
                'status' => 'Cannot delete an approved QC inspection.',
            ]);
        }

        DB::transaction(function () use ($actor, $inspection): void {
            $before = $inspection->toArray();

            $inspection->results()->delete();
            $inspection->defects()->delete();
            $inspection->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $inspection,
                before: $before,
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'qc_inspection']
            );
        });
    }
}
