<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\WarehouseLocation;
use Illuminate\Support\Facades\DB;

final class DeleteWarehouseLocationAction extends Action
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
        /** @var WarehouseLocation $location */
        $location = $input['location'];

        $blockingCount = WarehouseLocation::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('parent_id', $location->id)->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'inventory', blockingCount: $blockingCount);
        }

        DB::transaction(function () use ($location, $actor): void {
            $location->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $location, before: $location->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse_location']);
        });

        return ['deleted' => true];
    }
}
