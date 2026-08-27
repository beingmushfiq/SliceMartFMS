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
 * @property int $qc_inspection_id
 * @property int $defect_reason_id
 * @property string $quantity
 * @property string $severity
 * @property string|null $notes
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read QcInspection $qcInspection
 * @property-read ReasonCode $defectReason
 */
final class QcDefect extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'qc_defects';

    protected $fillable = [
        'uuid',
        'qc_inspection_id',
        'defect_reason_id',
        'quantity',
        'severity',
        'notes',
        'created_by',
        'updated_by',
    ];

    /**
     * @return BelongsTo<QcInspection, $this>
     */
    public function qcInspection(): BelongsTo
    {
        return $this->belongsTo(QcInspection::class, 'qc_inspection_id');
    }

    /**
     * @return BelongsTo<ReasonCode, $this>
     */
    public function defectReason(): BelongsTo
    {
        return $this->belongsTo(ReasonCode::class, 'defect_reason_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'string',
        ];
    }
}
