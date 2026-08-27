<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreatePriceListAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{priceList: PriceList}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        $code = is_string($input['code'] ?? null) ? $input['code'] : '';
        if (PriceList::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $code)->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $code);
        }

        $priceList = DB::transaction(function () use ($input, $actor, $code): PriceList {
            $priceList = PriceList::create([
                'uuid' => (string) Str::uuid(),
                'code' => $code,
                'name' => $input['name'],
                'currency_code' => $input['currency_code'] ?? 'BDT',
                'applies_to' => $input['applies_to'] ?? 'all',
                'channel' => $input['channel'] ?? null,
                'priority' => $input['priority'] ?? 0,
                'valid_from' => $input['valid_from'] ?? null,
                'valid_to' => $input['valid_to'] ?? null,
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
            ]);
            if (array_key_exists('items', $input)) {
                /** @var array<int, mixed> $items */
                $items = $input['items'];
                $this->replaceItems($priceList, $items, (int) $actor->tenant_id);
            }
            $this->auditLogger->record(action: AuditAction::Created, auditable: $priceList, after: $priceList->load('items')->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'price_list']);

            return $priceList;
        });

        return ['priceList' => $priceList->load('items.product', 'items.variant')];
    }

    /** @param array<int, mixed> $items */
    public function replaceItems(PriceList $priceList, array $items, int $tenantId): void
    {
        $priceList->items()->delete();
        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                throw ValidationException::withMessages(['items' => 'Each item must be an object.']);
            }
            $variantUuid = $item['variant_id'] ?? null;
            $priceList->items()->create([
                'product_id' => $this->id(Product::class, $item['product_id'] ?? null, $tenantId, "items.{$index}.product_id"),
                'variant_id' => $variantUuid === null ? null : $this->id(ProductVariant::class, $variantUuid, $tenantId, "items.{$index}.variant_id"),
                'min_quantity' => $item['min_quantity'] ?? '1.0000',
                'unit_price' => $item['unit_price'] ?? '0.0000',
                'discount_percentage' => $item['discount_percentage'] ?? '0.0000',
            ]);
        }
    }

    /**
     * @param  class-string<Product|ProductVariant>  $modelClass
     */
    private function id(string $modelClass, mixed $uuid, int $tenantId, string $field): int
    {
        /** @var Product|ProductVariant|null $row */
        $row = $modelClass::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}
