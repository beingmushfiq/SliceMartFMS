<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ProductionOutput
 *
 * Production Output record (finished goods / by-products).
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $production_batch_id
 * @property int $product_id
 * @property int|null $variant_id
 * @property string $quantity
 * @property int $unit_id
 * @property string $output_type
 * @property string|null $batch_code
 * @property CarbonInterface|null $expiry_date
 * @property int $target_warehouse_id
 * @property bool $qc_required
 * @property string $qc_status
 * @property int|null $stock_movement_id
 * @property int|null $recorded_by
 * @property CarbonInterface|null $recorded_at
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionBatch $productionBatch
 * @property-read Product $product
 * @property-read ProductVariant|null $variant
 * @property-read Unit $unit
 * @property-read Warehouse $targetWarehouse
 * @property-read User|null $recorder
 */
final class ProductionOutput extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'production_batch_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_id',
        'output_type',
        'batch_code',
        'expiry_date',
        'target_warehouse_id',
        'qc_required',
        'qc_status',
        'stock_movement_id',
        'recorded_by',
        'recorded_at',
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
     * @return BelongsTo<ProductionBatch, $this>
     */
    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class, 'production_batch_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function targetWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'target_warehouse_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'production_batch_id' => 'integer',
            'product_id' => 'integer',
            'variant_id' => 'integer',
            'unit_id' => 'integer',
            'target_warehouse_id' => 'integer',
            'stock_movement_id' => 'integer',
            'quantity' => 'decimal:4',
            'expiry_date' => 'date',
            'qc_required' => 'boolean',
            'recorded_by' => 'integer',
            'recorded_at' => 'datetime',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
