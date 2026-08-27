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
 * @property int $qc_parameter_id
 * @property string|null $value_numeric
 * @property int|null $value_boolean
 * @property string|null $value_text
 * @property int $is_within_spec
 * @property string|null $notes
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read QcInspection $qcInspection
 * @property-read QcParameter $qcParameter
 */
final class QcInspectionResult extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'qc_inspection_results';

    protected $fillable = [
        'uuid',
        'qc_inspection_id',
        'qc_parameter_id',
        'value_numeric',
        'value_boolean',
        'value_text',
        'is_within_spec',
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
     * @return BelongsTo<QcParameter, $this>
     */
    public function qcParameter(): BelongsTo
    {
        return $this->belongsTo(QcParameter::class, 'qc_parameter_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value_numeric' => 'string',
            'value_boolean' => 'integer',
            'is_within_spec' => 'integer',
        ];
    }
}
