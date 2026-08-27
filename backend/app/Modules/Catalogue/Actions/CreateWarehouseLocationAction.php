<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateWarehouseLocationAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{location: WarehouseLocation}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Warehouse $warehouse */
        $warehouse = $input['warehouse'];

        if (WarehouseLocation::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('warehouse_id', $warehouse->id)->where('code', $input['code'])->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }

        $tenantId = (int) ($actor->tenant_id ?? 0);
        $warehouseId = $warehouse->id;

        $location = DB::transaction(function () use ($input, $actor, $tenantId, $warehouseId): WarehouseLocation {
            $parentId = $this->resolveParentId(
                is_string($input['parent_id'] ?? null) ? $input['parent_id'] : null,
                $tenantId,
                $warehouseId
            );

            $location = WarehouseLocation::create([
                'uuid' => (string) Str::uuid(),
                'warehouse_id' => $warehouseId,
                'parent_id' => $parentId,
                'code' => $input['code'],
                'name' => $input['name'],
                'type' => $input['type'],
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
                'updated_by' => $actor->getKey(),
            ]);

            $this->auditLogger->record(action: AuditAction::Created, auditable: $location, after: $location->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse_location']);

            return $location;
        });

        return ['location' => $location->refresh()];
    }

    private function resolveParentId(?string $parentUuid, int $tenantId, int $warehouseId): ?int
    {
        if ($parentUuid === null || $parentUuid === '') {
            return null;
        }

        $parent = WarehouseLocation::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('warehouse_id', $warehouseId)
            ->where('uuid', $parentUuid)
            ->first();

        if ($parent === null) {
            throw ValidationException::withMessages(['parent_id' => 'The selected parent location is invalid.']);
        }

        return $parent->id;
    }
}
