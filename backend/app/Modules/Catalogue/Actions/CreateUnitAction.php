<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateUnitAction extends Action
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {}

    /**
     * @param  array{user: \App\Models\User, code: string, name: string, type: string, is_base?: bool, precision?: int, is_active?: bool}  $input
     * @return array{unit: Unit}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];

        $code = $input['code'];

        // Duplicate check must include trashed records (DB unique constraint is NOT soft-delete-aware)
        $exists = Unit::withoutGlobalScope('tenant')
            ->where('tenant_id', $actor->tenant_id)
            ->where('code', $code)
            ->withTrashed()
            ->exists();

        if ($exists) {
            throw new DuplicateResourceException(field: 'code', value: $code);
        }

        /** @var Unit $unit */
        $unit = DB::transaction(function () use ($input, $actor): Unit {
            $unit = Unit::create([
                'uuid' => (string) Str::uuid(),
                'code' => $input['code'],
                'name' => $input['name'],
                'type' => $input['type'],
                'is_base' => $input['is_base'] ?? false,
                'precision' => $input['precision'] ?? 2,
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $unit,
                after: $unit->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'unit'],
            );

            return $unit;
        });

        return ['unit' => $unit];
    }
}
