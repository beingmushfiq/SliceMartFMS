<?php

declare(strict_types=1);

namespace App\Modules\QC\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\QcParameter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateQcParameterAction extends Action
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
        /** @var QcParameter $param */
        $param = $input['qcParameter'];
        $tenantId = (int) $actor->tenant_id;

        $param = DB::transaction(function () use ($input, $actor, $param, $tenantId): QcParameter {
            $before = $param->toArray();
            $data = [];

            if (isset($input['name'])) {
                $data['name'] = $input['name'];
            }
            if (isset($input['type'])) {
                $data['type'] = $input['type'];
            }
            if (array_key_exists('product_id', $input)) {
                $data['product_id'] = ! empty($input['product_id'])
                    ? $this->resolveId('products', $input['product_id'], $tenantId, 'product_id')
                    : null;
            }
            if (array_key_exists('unit_id', $input)) {
                $data['unit_id'] = ! empty($input['unit_id'])
                    ? $this->resolveId('units', $input['unit_id'], $tenantId, 'unit_id')
                    : null;
            }
            if (array_key_exists('min_value', $input)) {
                $data['min_value'] = $input['min_value'];
            }
            if (array_key_exists('max_value', $input)) {
                $data['max_value'] = $input['max_value'];
            }
            if (array_key_exists('options', $input)) {
                $data['options'] = $input['options'];
            }
            if (isset($input['is_mandatory'])) {
                $data['is_mandatory'] = $input['is_mandatory'] ? 1 : 0;
            }
            if (isset($input['sort_order'])) {
                $data['sort_order'] = $input['sort_order'];
            }

            $data['updated_by'] = $actor->id;

            $param->update($data);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $param,
                before: $before,
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
