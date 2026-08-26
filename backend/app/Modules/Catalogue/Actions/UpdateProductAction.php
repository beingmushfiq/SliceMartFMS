<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\TaxProfile;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateProductAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{product: Product}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Product $product */
        $product = $input['product'];
        if (isset($input['sku']) && $input['sku'] !== $product->sku && Product::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('sku', $input['sku'])->where('id', '!=', $product->getKey())->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'sku', value: is_string($input['sku']) ? $input['sku'] : '');
        }
        $before = $product->toArray();
        DB::transaction(function () use ($input, $actor, $product, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'product']));
            foreach (['category_id' => Category::class, 'brand_id' => Brand::class, 'base_unit_id' => Unit::class, 'purchase_unit_id' => Unit::class, 'sales_unit_id' => Unit::class, 'tax_profile_id' => TaxProfile::class] as $field => $modelClass) {
                if (array_key_exists($field, $payload)) {
                    $payload[$field] = $this->resolveUuid($modelClass, $payload[$field], (int) $actor->tenant_id, $field);
                }
            }
            /** @phpstan-ignore argument.type */
            $product->update([...$payload, 'updated_by' => $actor->getKey()]);
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $product, before: $before, after: $product->fresh()?->toArray() ?? $product->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'product']);
        });

        return ['product' => $product->refresh()];
    }

    private function resolveUuid(string $modelClass, mixed $uuid, int $tenantId, string $field): ?int
    {
        if ($uuid === null) {
            return null;
        }
        $row = $modelClass::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->getKey();
    }
}
