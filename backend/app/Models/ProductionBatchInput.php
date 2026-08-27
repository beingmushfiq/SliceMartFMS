<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ProductionBatchInput
 *
 * Production Batch Input (material consumption).
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $production_batch_id
 * @property int $product_id
 * @property string $quantity
 * @property int $unit_id
 * @property string $source
 * @property int|null $material_issue_item_id
 * @property int|null $recorded_by
 * @property CarbonInterface|null $recorded_at
 * @property string|null $notes
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionBatch $productionBatch
 * @property-read Product $product
 * @property-read Unit $unit
 * @property-read User|null $recorder
 */
final class ProductionBatchInput extends Model
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
        'quantity',
        'unit_id',
        'source',
        'material_issue_item_id',
        'recorded_by',
        'recorded_at',
        'notes',
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
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
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
            'unit_id' => 'integer',
            'material_issue_item_id' => 'integer',
            'quantity' => 'decimal:4',
            'recorded_by' => 'integer',
            'recorded_at' => 'datetime',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
