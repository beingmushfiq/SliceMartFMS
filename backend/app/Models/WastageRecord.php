<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $wastage_number
 * @property int|null $production_batch_id
 * @property int $product_id
 * @property string $stage
 * @property string $quantity
 * @property int $unit_id
 * @property int $reason_code_id
 * @property string|null $estimated_cost
 * @property int $is_recoverable
 * @property string $recovered_quantity
 * @property int|null $warehouse_id
 * @property int|null $stock_movement_id
 * @property int|null $recorded_by
 * @property \Illuminate\Support\Carbon|null $recorded_at
 * @property string|null $notes
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionBatch|null $productionBatch
 * @property-read Product $product
 * @property-read Unit $unit
 * @property-read ReasonCode $reasonCode
 * @property-read Warehouse|null $warehouse
 * @property-read User|null $recordedByUser
 */
final class WastageRecord extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'wastage_records';

    protected $fillable = [
        'uuid',
        'wastage_number',
        'production_batch_id',
        'product_id',
        'stage',
        'quantity',
        'unit_id',
        'reason_code_id',
        'estimated_cost',
        'is_recoverable',
        'recovered_quantity',
        'warehouse_id',
        'stock_movement_id',
        'recorded_by',
        'recorded_at',
        'notes',
        'created_by',
        'updated_by',
    ];

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
     * @return BelongsTo<ReasonCode, $this>
     */
    public function reasonCode(): BelongsTo
    {
        return $this->belongsTo(ReasonCode::class, 'reason_code_id');
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'string',
            'estimated_cost' => 'string',
            'recovered_quantity' => 'string',
            'is_recoverable' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }
}
