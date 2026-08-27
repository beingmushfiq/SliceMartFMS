<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ProductionPlanItem
 *
 * Production plan line item.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $production_plan_id
 * @property int $product_id
 * @property int $bill_of_material_id
 * @property string $planned_quantity
 * @property int $unit_id
 * @property int|null $production_line_id
 * @property CarbonInterface|null $scheduled_date
 * @property string $produced_quantity
 * @property string $status
 * @property int $sort_order
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionPlan $productionPlan
 * @property-read Product $product
 * @property-read BillOfMaterial $billOfMaterial
 * @property-read Unit $unit
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class ProductionPlanItem extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'production_plan_id',
        'product_id',
        'bill_of_material_id',
        'planned_quantity',
        'unit_id',
        'production_line_id',
        'scheduled_date',
        'produced_quantity',
        'status',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * @return BelongsTo<ProductionPlan, $this>
     */
    public function productionPlan(): BelongsTo
    {
        return $this->belongsTo(ProductionPlan::class, 'production_plan_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsTo<BillOfMaterial, $this>
     */
    public function billOfMaterial(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class, 'bill_of_material_id');
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'production_plan_id' => 'integer',
            'product_id' => 'integer',
            'bill_of_material_id' => 'integer',
            'unit_id' => 'integer',
            'production_line_id' => 'integer',
            'planned_quantity' => 'decimal:4',
            'produced_quantity' => 'decimal:4',
            'scheduled_date' => 'date',
            'sort_order' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
