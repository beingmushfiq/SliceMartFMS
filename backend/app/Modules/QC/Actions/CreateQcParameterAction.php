<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\QcParameter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateQcParameterAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{qcParameter: QcParameter}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        $tenantId = (int) $actor->tenant_id;

        $productId = null;
        if (! empty($input['product_id'])) {
            $productId = $this->resolveId('products', $input['product_id'], $tenantId, 'product_id');
        }

        $unitId = null;
        if (! empty($input['unit_id'])) {
            $unitId = $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id');
        }

        $param = DB::transaction(function () use ($input, $actor, $productId, $unitId): QcParameter {
            $param = QcParameter::create([
                'uuid' => (string) Str::uuid(),
                'product_id' => $productId,
                'name' => $input['name'],
                'type' => $input['type'],
                'unit_id' => $unitId,
                'min_value' => $input['min_value'] ?? null,
                'max_value' => $input['max_value'] ?? null,
                'options' => $input['options'] ?? null,
                'is_mandatory' => $input['is_mandatory'] ?? 1,
                'sort_order' => $input['sort_order'] ?? 0,
                'created_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $param,
                after: $param->toArray(),
                actor: $actor,
                context: ['module' => 'qc', 'resource' => 'qc_parameter']
            );

            return $param;
        });

        return [
            'qcParameter' => $param->load(['product', 'unit']),
        ];
    }

    private function resolveId(string $table, mixed $uuid, int $tenantId, string $field): int
    {
        $row = DB::table($table)->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}
