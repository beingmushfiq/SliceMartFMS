<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PriceListItem
 *
 * One price break within a price list. No `uuid`, no audit columns and no soft
 * delete — the row is a line child whose lifecycle is governed by the parent
 * price list.
 *
 * `min_quantity` and `unit_price` are DECIMAL(18,4) and
 * `discount_percentage` is DECIMAL(8,4); all three are cast to a 4-place
 * decimal so they remain strings end-to-end and never become floats.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $price_list_id
 * @property int $product_id
 * @property int|null $variant_id
 * @property string $min_quantity
 * @property string $unit_price
 * @property string $discount_percentage
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read PriceList $priceList
 * @property-read Product $product
 * @property-read ProductVariant|null $variant
 */
final class PriceListItem extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<\Database\Factories\PriceListItemFactory> */
    use HasFactory;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'price_list_id',
        'product_id',
        'variant_id',
        'min_quantity',
        'unit_price',
        'discount_percentage',
    ];

    /**
     * Owning tenant.
     *
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Price list this break belongs to.
     *
     * @return BelongsTo<PriceList, $this>
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class, 'price_list_id');
    }

    /**
     * Product being priced.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Variant this break is specific to, if any.
     *
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'price_list_id' => 'integer',
            'product_id' => 'integer',
            'variant_id' => 'integer',
            'min_quantity' => 'decimal:4',
            'unit_price' => 'decimal:4',
            'discount_percentage' => 'decimal:4',
        ];
    }
}
