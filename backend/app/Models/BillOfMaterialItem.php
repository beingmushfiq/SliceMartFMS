<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\BillOfMaterialItem
 *
 * One component (input material) line of a recipe. A leaf table: no `uuid` and
 * no soft delete — recipe changes produce a new BoM version instead.
 *
 * `wastage_allowance_percentage` is the planned waste factor (DECIMAL(8,4)),
 * not the actual wastage measured during a batch.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $bill_of_material_id
 * @property int $product_id
 * @property string $quantity
 * @property int $unit_id
 * @property string $wastage_allowance_percentage
 * @property bool $is_optional
 * @property int $sort_order
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read BillOfMaterial $billOfMaterial
 * @property-read Product $product
 * @property-read Unit $unit
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class BillOfMaterialItem extends Model
{
    use BelongsToTenant;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'bill_of_material_id',
        'product_id',
        'quantity',
        'unit_id',
        'wastage_allowance_percentage',
        'is_optional',
        'sort_order',
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
     * Parent recipe. Composite FK `(tenant_id, bill_of_material_id)`, CASCADE.
     *
     * @return BelongsTo<BillOfMaterial, $this>
     */
    public function billOfMaterial(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class, 'bill_of_material_id');
    }

    /**
     * The input material consumed by this line.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Unit in which `quantity` is expressed.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
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
            'bill_of_material_id' => 'integer',
            'product_id' => 'integer',
            'quantity' => 'decimal:4',
            'unit_id' => 'integer',
            'wastage_allowance_percentage' => 'decimal:4',
            'is_optional' => 'boolean',
            'sort_order' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
