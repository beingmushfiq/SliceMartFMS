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
 * @property int $production_batch_id
 * @property int $employee_id
 * @property int $product_id
 * @property int|null $production_line_id
 * @property int|null $shift_id
 * @property string $work_date
 * @property string $measure_type
 * @property string $quantity
 * @property int $unit_id
 * @property string $rework_quantity
 * @property string $rejected_quantity
 * @property string|null $hours_worked
 * @property string $rate_type
 * @property string|null $rate
 * @property string|null $incentive_amount
 * @property int|null $payroll_period_id
 * @property int|null $entered_by
 * @property int|null $verified_by
 * @property \Illuminate\Support\Carbon|null $verified_at
 * @property string $status
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionBatch $productionBatch
 * @property-read Employee $employee
 * @property-read Product $product
 * @property-read Unit $unit
 * @property-read User|null $enteredByUser
 * @property-read User|null $verifiedByUser
 */
final class WorkerProductionEntry extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'worker_production_entries';

    protected $fillable = [
        'uuid',
        'production_batch_id',
        'employee_id',
        'product_id',
        'production_line_id',
        'shift_id',
        'work_date',
        'measure_type',
        'quantity',
        'unit_id',
        'rework_quantity',
        'rejected_quantity',
        'hours_worked',
        'rate_type',
        'rate',
        'incentive_amount',
        'payroll_period_id',
        'entered_by',
        'verified_by',
        'verified_at',
        'status',
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
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
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
    public function enteredByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function verifiedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'work_date' => 'date:Y-m-d',
            'quantity' => 'string',
            'rework_quantity' => 'string',
            'rejected_quantity' => 'string',
            'hours_worked' => 'string',
            'rate' => 'string',
            'incentive_amount' => 'string',
            'verified_at' => 'datetime',
        ];
    }
}
