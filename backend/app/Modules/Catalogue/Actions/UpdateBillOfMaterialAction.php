<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\BillOfMaterial;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateBillOfMaterialAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param array<string, mixed> $input
     * @return array{billOfMaterial: BillOfMaterial}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var BillOfMaterial $bom */
        $bom = $input['billOfMaterial'];
        $productId = array_key_exists('product_id', $input) ? $this->id(Product::class, $input['product_id'], (int) $actor->tenant_id, 'product_id') : $bom->product_id;
        $version = array_key_exists('version', $input) ? $input['version'] : $bom->version;
        if (($productId !== $bom->product_id || $version !== $bom->version) && BillOfMaterial::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('product_id', $productId)->where('version', $version)->where('id', '!=', $bom->getKey())->exists()) {
            throw new DuplicateResourceException(field: 'version', value: is_string($version) ? $version : '');
        }
        $before = $bom->toArray();
        DB::transaction(function () use ($input, $actor, $bom, $before, $productId): void {
            $payload = array_diff_key($input, array_flip(['user', 'billOfMaterial', 'items']));
            $payload['product_id'] = $productId;
            if (array_key_exists('output_unit_id', $payload)) {
                $payload['output_unit_id'] = $this->id(Unit::class, $payload['output_unit_id'], (int) $actor->tenant_id, 'output_unit_id');
            }
            /** @phpstan-ignore argument.type */
            $bom->update([...$payload, 'updated_by' => $actor->getKey()]);
            if (array_key_exists('items', $input)) {
                /** @var array<int, mixed> $items */
                $items = $input['items'];
                (new CreateBillOfMaterialAction($this->auditLogger))->replaceItems($bom, $items, (int) $actor->tenant_id, $actor->id);
            }
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $bom, before: $before, after: $bom->load('items')->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'bill_of_material']);
        });
        return ['billOfMaterial' => $bom->load(['product', 'outputUnit', 'items.product', 'items.unit'])];
    }

    private function id(string $modelClass, mixed $uuid, int $tenantId, string $field): int
    {
        $row = $modelClass::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }
        return (int) $row->getKey();
    }
}
