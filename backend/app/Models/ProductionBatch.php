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
 * App\Models\ProductionBatch
 *
 * Production Batch tracking and execution (ADR-011, ADR-012).
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $batch_number
 * @property int|null $production_plan_item_id
 * @property int $factory_id
 * @property int|null $production_line_id
 * @property int $product_id
 * @property int $bill_of_material_id
 * @property int|null $shift_id
 * @property CarbonInterface $batch_date
 * @property CarbonInterface|null $started_at
 * @property CarbonInterface|null $completed_at
 * @property string $planned_quantity
 * @property int $output_unit_id
 * @property string $status
 * @property string $context_completeness
 * @property string $total_input_quantity
 * @property string $total_output_quantity
 * @property string $worker_reported_quantity
 * @property string|null $yield_percentage
 * @property string|null $variance_quantity
 * @property string|null $variance_percentage
 * @property array<string, mixed>|null $analysis
 * @property int|null $supervisor_id
 * @property int|null $closed_by
 * @property CarbonInterface|null $closed_at
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionPlanItem|null $productionPlanItem
 * @property-read Product $product
 * @property-read BillOfMaterial $billOfMaterial
 * @property-read Unit $outputUnit
 * @property-read User|null $supervisor
 * @property-read User|null $closedByUser
 * @property-read Collection<int, ProductionBatchInput> $inputs
 * @property-read Collection<int, ProductionOutput> $outputs
 */
final class ProductionBatch extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'batch_number',
        'production_plan_item_id',
        'factory_id',
        'production_line_id',
        'product_id',
        'bill_of_material_id',
        'shift_id',
        'batch_date',
        'started_at',
        'completed_at',
        'planned_quantity',
        'output_unit_id',
        'status',
        'context_completeness',
        'total_input_quantity',
        'total_output_quantity',
        'worker_reported_quantity',
        'yield_percentage',
        'variance_quantity',
        'variance_percentage',
        'analysis',
        'supervisor_id',
        'closed_by',
        'closed_at',
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
     * @return BelongsTo<ProductionPlanItem, $this>
     */
    public function productionPlanItem(): BelongsTo
    {
        return $this->belongsTo(ProductionPlanItem::class, 'production_plan_item_id');
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
    public function outputUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'output_unit_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * @return HasMany<ProductionBatchInput, $this>
     */
    public function inputs(): HasMany
    {
        return $this->hasMany(ProductionBatchInput::class, 'production_batch_id');
    }

    /**
     * @return HasMany<ProductionOutput, $this>
     */
    public function outputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class, 'production_batch_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'production_plan_item_id' => 'integer',
            'factory_id' => 'integer',
            'production_line_id' => 'integer',
            'product_id' => 'integer',
            'bill_of_material_id' => 'integer',
            'shift_id' => 'integer',
            'output_unit_id' => 'integer',
            'batch_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'closed_at' => 'datetime',
            'planned_quantity' => 'decimal:4',
            'total_input_quantity' => 'decimal:4',
            'total_output_quantity' => 'decimal:4',
            'worker_reported_quantity' => 'decimal:4',
            'yield_percentage' => 'decimal:4',
            'variance_quantity' => 'decimal:4',
            'variance_percentage' => 'decimal:4',
            'analysis' => 'array',
            'supervisor_id' => 'integer',
            'closed_by' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
