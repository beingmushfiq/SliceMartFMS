<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\User;
use App\Models\WastageRecord;
use Illuminate\Support\Facades\DB;

final class DeleteWastageRecordAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, wastageRecord: WastageRecord}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var WastageRecord $wastage */
        $wastage = $input['wastageRecord'];

        DB::transaction(function () use ($actor, $wastage): void {
            $before = $wastage->toArray();

            $wastage->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $wastage,
                before: $before,
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'wastage_record']
            );
        });
    }
}
