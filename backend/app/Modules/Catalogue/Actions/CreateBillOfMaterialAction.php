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
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateBillOfMaterialAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{billOfMaterial: BillOfMaterial}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        if (BillOfMaterial::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('product_id', $this->id(Product::class, $input['product_id'], (int) $actor->tenant_id, 'product_id'))->where('version', $input['version'])->exists()) {
            throw new DuplicateResourceException(field: 'version', value: is_string($input['version']) ? $input['version'] : '');
        }
        $bom = DB::transaction(function () use ($input, $actor): BillOfMaterial {
            $productId = $this->id(Product::class, $input['product_id'], (int) $actor->tenant_id, 'product_id');
            $outputUnitId = $this->id(Unit::class, $input['output_unit_id'], (int) $actor->tenant_id, 'output_unit_id');
            $bom = BillOfMaterial::create(['uuid' => (string) Str::uuid(), 'product_id' => $productId, 'version' => $input['version'], 'name' => $input['name'], 'output_quantity' => $input['output_quantity'], 'output_unit_id' => $outputUnitId, 'expected_yield_percentage' => $input['expected_yield_percentage'] ?? '100.0000', 'status' => $input['status'] ?? 'draft', 'effective_from' => $input['effective_from'] ?? null, 'effective_to' => $input['effective_to'] ?? null, 'created_by' => $actor->getKey()]);
            /** @var array<int, mixed> $items */
            $items = $input['items'];
            $this->replaceItems($bom, $items, (int) $actor->tenant_id, $actor->id);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $bom, after: $bom->load('items')->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'bill_of_material']);

            return $bom;
        });

        return ['billOfMaterial' => $bom->load(['product', 'outputUnit', 'items.product', 'items.unit'])];
    }

    /** @param array<int, mixed> $items */
    public function replaceItems(BillOfMaterial $bom, array $items, int $tenantId, int $actorId): void
    {
        $bom->items()->delete();
        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                throw ValidationException::withMessages(['items' => 'Each item must be an object.']);
            }
            $bom->items()->create(['product_id' => $this->id(Product::class, $item['product_id'] ?? null, $tenantId, "items.{$index}.product_id"), 'quantity' => $item['quantity'] ?? null, 'unit_id' => $this->id(Unit::class, $item['unit_id'] ?? null, $tenantId, "items.{$index}.unit_id"), 'wastage_allowance_percentage' => $item['wastage_allowance_percentage'] ?? '0.0000', 'is_optional' => $item['is_optional'] ?? false, 'sort_order' => $item['sort_order'] ?? $index, 'created_by' => $actorId]);
        }
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
