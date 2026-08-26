<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

final class UpdateWarehouseAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{warehouse: Warehouse}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */ $actor = $input['user'];
        /** @var Warehouse $warehouse */ $warehouse = $input['warehouse'];
        if (isset($input['code']) && $input['code'] !== $warehouse->code && Warehouse::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->where('id', '!=', $warehouse->id)->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }
        $before = $warehouse->toArray();
        DB::transaction(function () use ($input, $actor, $warehouse, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'warehouse']));
            /** @phpstan-ignore argument.type */ $warehouse->update([...$payload, 'updated_by' => $actor->id]);
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $warehouse, before: $before, after: $warehouse->fresh()?->toArray() ?? $warehouse->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse']);
        });

        return ['warehouse' => $warehouse->refresh()];
    }
}
