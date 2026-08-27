<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $inspection_number
 * @property int|null $production_batch_id
 * @property int|null $production_output_id
 * @property int|null $goods_receipt_id
 * @property string $inspection_date
 * @property int $inspector_id
 * @property string $sample_size
 * @property string $inspected_quantity
 * @property string $passed_quantity
 * @property string $failed_quantity
 * @property string $rework_quantity
 * @property string $scrap_quantity
 * @property string $result
 * @property string $status
 * @property string|null $notes
 * @property int|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read ProductionBatch|null $productionBatch
 * @property-read ProductionOutput|null $productionOutput
 * @property-read Employee $inspector
 * @property-read User|null $approvedByUser
 * @property-read Collection<int, QcInspectionResult> $results
 * @property-read Collection<int, QcDefect> $defects
 */
final class QcInspection extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'qc_inspections';

    protected $fillable = [
        'uuid',
        'inspection_number',
        'production_batch_id',
        'production_output_id',
        'goods_receipt_id',
        'inspection_date',
        'inspector_id',
        'sample_size',
        'inspected_quantity',
        'passed_quantity',
        'failed_quantity',
        'rework_quantity',
        'scrap_quantity',
        'result',
        'status',
        'notes',
        'approved_by',
        'approved_at',
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
     * @return BelongsTo<ProductionOutput, $this>
     */
    public function productionOutput(): BelongsTo
    {
        return $this->belongsTo(ProductionOutput::class, 'production_output_id');
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'inspector_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return HasMany<QcInspectionResult, $this>
     */
    public function results(): HasMany
    {
        return $this->hasMany(QcInspectionResult::class, 'qc_inspection_id');
    }

    /**
     * @return HasMany<QcDefect, $this>
     */
    public function defects(): HasMany
    {
        return $this->hasMany(QcDefect::class, 'qc_inspection_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'inspection_date' => 'date:Y-m-d',
            'sample_size' => 'string',
            'inspected_quantity' => 'string',
            'passed_quantity' => 'string',
            'failed_quantity' => 'string',
            'rework_quantity' => 'string',
            'scrap_quantity' => 'string',
            'approved_at' => 'datetime',
        ];
    }
}
