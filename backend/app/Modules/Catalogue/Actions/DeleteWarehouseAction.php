<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Support\Facades\DB;

final class DeleteWarehouseAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */ $actor = $input['user'];
        /** @var Warehouse $warehouse */ $warehouse = $input['warehouse'];
        $blockingCount = WarehouseLocation::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('warehouse_id', $warehouse->id)->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'inventory', blockingCount: $blockingCount);
        }
        DB::transaction(function () use ($warehouse, $actor): void {
            $warehouse->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $warehouse, before: $warehouse->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse']);
        });

        return ['deleted' => true];
    }
}
