<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\ProductImage
 *
 * A leaf table: no `uuid`, no `updated_by` and no soft delete. `path` is a
 * storage-disk path, `alt_key` is an i18n translation key rather than raw alt
 * text. An image with `variant_id = NULL` applies to the product in general.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $product_id
 * @property int|null $variant_id
 * @property string $path
 * @property string|null $alt_key
 * @property int $sort_order
 * @property bool $is_primary
 * @property int|null $created_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Product $product
 * @property-read ProductVariant|null $variant
 * @property-read User|null $creator
 */
final class ProductImage extends Model
{
    use BelongsToTenant;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'variant_id',
        'path',
        'alt_key',
        'sort_order',
        'is_primary',
        'created_by',
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
     * Product this image belongs to. Composite FK `(tenant_id, product_id)`.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Variant this image is specific to, if any.
     *
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
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
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'product_id' => 'integer',
            'variant_id' => 'integer',
            'sort_order' => 'integer',
            'is_primary' => 'boolean',
            'created_by' => 'integer',
        ];
    }
}
