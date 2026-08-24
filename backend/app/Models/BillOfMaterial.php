<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\BillOfMaterial
 *
 * The versioned recipe describing how a product is assembled from its inputs.
 * There is no soft delete: a recipe is retired by setting `status = 'archived'`
 * so that historical production batches can still resolve the frozen version.
 *
 * `effective_from` / `effective_to` are DATE columns — a version applies to a
 * whole calendar day — so they are cast to `date`, not `datetime`.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $product_id
 * @property string $version
 * @property string $name
 * @property string $output_quantity
 * @property int $output_unit_id
 * @property string $expected_yield_percentage
 * @property string $status
 * @property CarbonInterface|null $effective_from
 * @property CarbonInterface|null $effective_to
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Product $product
 * @property-read Unit $outputUnit
 * @property-read Collection<int, BillOfMaterialItem> $items
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class BillOfMaterial extends Model
{
    use BelongsToTenant;

    /**
     * The inflector would derive `bill_of_materials` from this class name, but
     * the singular/plural boundary is ambiguous enough to pin explicitly.
     *
     * @var string
     */
    protected $table = 'bill_of_materials';

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'product_id',
        'version',
        'name',
        'output_quantity',
        'output_unit_id',
        'expected_yield_percentage',
        'status',
        'effective_from',
        'effective_to',
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
     * The product this recipe produces. Composite FK `(tenant_id, product_id)`.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Unit in which `output_quantity` is expressed.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function outputUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'output_unit_id');
    }

    /**
     * Component lines of this recipe.
     *
     * @return HasMany<BillOfMaterialItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(BillOfMaterialItem::class, 'bill_of_material_id');
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
            'output_quantity' => 'decimal:4',
            'output_unit_id' => 'integer',
            'expected_yield_percentage' => 'decimal:4',
            'status' => 'string',
            'effective_from' => 'date',
            'effective_to' => 'date',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
