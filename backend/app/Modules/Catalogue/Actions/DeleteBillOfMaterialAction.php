<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\BillOfMaterial;
use Illuminate\Support\Facades\DB;

final class DeleteBillOfMaterialAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var BillOfMaterial $bom */
        $bom = $input['billOfMaterial'];
        DB::transaction(function () use ($bom, $actor): void {
            $before = $bom->toArray();
            $bom->update(['status' => 'archived', 'updated_by' => $actor->getKey()]);
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $bom, before: $before, after: $bom->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'bill_of_material']);
        });

        return ['deleted' => true];
    }
}
