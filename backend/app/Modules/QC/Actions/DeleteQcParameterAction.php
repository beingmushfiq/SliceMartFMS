<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\QcParameter;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class DeleteQcParameterAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, qcParameter: QcParameter}  $input
     */
    public function execute(array $input): void
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var QcParameter $param */
        $param = $input['qcParameter'];

        DB::transaction(function () use ($actor, $param): void {
            $before = $param->toArray();

            $param->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $param,
                before: $before,
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'qc_parameter']
            );
        });
    }
}
