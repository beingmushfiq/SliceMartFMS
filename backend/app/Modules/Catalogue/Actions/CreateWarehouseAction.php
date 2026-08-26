<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateWarehouseAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{warehouse: Warehouse}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        if (Warehouse::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }
        $warehouse = DB::transaction(function () use ($input, $actor): Warehouse {
            unset($input['user']);
            /** @phpstan-ignore argument.type */
            $warehouse = Warehouse::create(['uuid' => (string) Str::uuid(), ...$input, 'created_by' => $actor->id]);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $warehouse, after: $warehouse->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'warehouse']);

            return $warehouse;
        });

        return ['warehouse' => $warehouse->refresh()];
    }
}
