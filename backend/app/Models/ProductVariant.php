<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ProductVariant
 *
 * A specific configuration of a product (e.g. Red / XL) with its own SKU and
 * barcode. `attributes` is a NOT NULL JSON bag whose keys are product-family
 * specific. `price_delta` is a signed DECIMAL(18,4) offset from the parent
 * `products.default_sale_price` and is cast to a `decimal:4` string.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $product_id
 * @property string $sku
 * @property string|null $barcode
 * @property array<string, mixed> $attributes
 * @property string $price_delta
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read Product $product
 * @property-read Collection<int, ProductImage> $images
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class ProductVariant extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'product_id',
        'sku',
        'barcode',
        'attributes',
        'price_delta',
        'is_active',
        'created_by',
        'updated_by',
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
     * Parent product. Composite FK `(tenant_id, product_id)`.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Images tied to this specific variant.
     *
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variant_id');
    }

    /**
     * User who created the row.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated the row.
     *
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'product_id' => 'integer',
            'attributes' => 'array',
            'price_delta' => 'decimal:4',
            'is_active' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
