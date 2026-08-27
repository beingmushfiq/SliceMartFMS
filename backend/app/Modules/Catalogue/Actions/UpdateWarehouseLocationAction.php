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
use Illuminate\Validation\ValidationException;

final class UpdateWarehouseLocationAction extends Action
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
        /** @var WarehouseLocation $location */
        $location = $input['location'];

        if (isset($input['code']) && $input['code'] !== $location->code && WarehouseLocation::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('warehouse_id', $warehouse->getKey())->where('code', $input['code'])->where('id', '!=', $location->id)->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }

        $before = $location->toArray();
        DB::transaction(function () use ($input, $actor, $location, $warehouse, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'warehouse', 'location']));
            if (array_key_exists('parent_id', $payload) && ($payload['parent_id'] === null || $payload['parent_id'] === '')) {
                $payload['parent_id'] = null;
            }

            if (isset($payload['parent_id']) && is_string($payload['parent_id'])) {
                $parent = WarehouseLocation::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('warehouse_id', $warehouse->getKey())->where('uuid', $payload['parent_id'])->first();
                if ($parent === null) {
                    throw ValidationException::withMessages(['parent_id' => 'The selected parent location is invalid.']);
                }
                $payload['parent_id'] = $parent->id;
            }

            /** @phpstan-ignore argument.type */
            $location->update([...$payload, 'updated_by' => $actor->id]);
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $location, before: $before, after: $location->fresh()?->toArray() ?? $location->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse_location']);
        });

        return ['location' => $location->refresh()];
    }
}
