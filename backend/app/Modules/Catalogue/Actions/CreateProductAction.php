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
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateProductAction extends Action
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
        if (Product::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('sku', $input['sku'])->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'sku', value: is_string($input['sku']) ? $input['sku'] : '');
        }
        $product = DB::transaction(function () use ($input, $actor): Product {
            $payload = $this->resolveReferences($input, (int) $actor->tenant_id);
            unset($payload['user']);
            /** @phpstan-ignore argument.type */
            $product = Product::create(['uuid' => (string) Str::uuid(), ...$payload, 'created_by' => $actor->getKey()]);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $product, after: $product->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'product']);

            return $product;
        });

        return ['product' => $product->refresh()];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function resolveReferences(array $input, int $tenantId): array
    {
        foreach ([
            'category_id' => Category::class, 'brand_id' => Brand::class, 'base_unit_id' => Unit::class,
            'purchase_unit_id' => Unit::class, 'sales_unit_id' => Unit::class, 'tax_profile_id' => TaxProfile::class,
        ] as $field => $modelClass) {
            if (array_key_exists($field, $input)) {
                $input[$field] = $this->resolveUuid($modelClass, $input[$field], $tenantId, $field);
            }
        }

        return $input;
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
