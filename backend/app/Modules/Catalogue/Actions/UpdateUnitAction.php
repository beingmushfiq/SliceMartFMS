<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;

class UpdateUnitAction extends Action
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {}

    /**
     * @param  array{user: \App\Models\User, unit: Unit, code?: string, name?: string, type?: string, is_base?: bool, precision?: int, is_active?: bool}  $input
     * @return array{unit: Unit}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];

        /** @var Unit $unit */
        $unit = $input['unit'];

        // Check duplicate if code is being changed
        if (isset($input['code']) && $input['code'] !== $unit->code) {
            $exists = Unit::withoutGlobalScope('tenant')
                ->where('tenant_id', $actor->tenant_id)
                ->where('code', $input['code'])
                ->where('id', '!=', $unit->getKey())
                ->withTrashed()
                ->exists();

            if ($exists) {
                throw new DuplicateResourceException(field: 'code', value: $input['code']);
            }
        }

        $before = $unit->toArray();

        DB::transaction(function () use ($unit, $input, $actor, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'unit']));

            /** @phpstan-ignore argument.type */
            $unit->update([
                ...$payload,
                'updated_by' => $actor->getKey(),
            ]);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $unit,
                before: $before,
                after: $unit->fresh()?->toArray() ?? $unit->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'unit'],
            );
        });

        return ['unit' => $unit->refresh()];
    }
}
