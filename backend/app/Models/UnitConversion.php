<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\UnitConversion
 *
 * `factor` is DECIMAL(18,8) — eight decimal places, a deliberate departure from
 * the DATABASE_DESIGN §1 DECIMAL(18,4) quantity convention — so it is cast to a
 * `decimal:8` string, never a float.
 *
 * The table carries no soft delete: a conversion is corrected by updating the
 * factor or replacing the pair.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $from_unit_id
 * @property int $to_unit_id
 * @property string $factor
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Unit $fromUnit
 * @property-read Unit $toUnit
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class UnitConversion extends Model
{
    use BelongsToTenant;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'from_unit_id',
        'to_unit_id',
        'factor',
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
     * Source unit of the conversion. Composite FK `(tenant_id, from_unit_id)`.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function fromUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'from_unit_id');
    }

    /**
     * Target unit of the conversion. Composite FK `(tenant_id, to_unit_id)`.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function toUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'to_unit_id');
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
            'from_unit_id' => 'integer',
            'to_unit_id' => 'integer',
            'factor' => 'decimal:8',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
