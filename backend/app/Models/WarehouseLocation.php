<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\WarehouseLocation
 *
 * A named position inside a warehouse. Locations form a self-referencing tree
 * (zone → rack → bin) via the nullable `parent_id`, constrained by the
 * composite FK `(tenant_id, parent_id)`. No soft delete: lifecycle is managed
 * through `is_active` so historical stock rows keep resolving.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $warehouse_id
 * @property int|null $parent_id
 * @property string $code
 * @property string $name
 * @property string $type
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Warehouse $warehouse
 * @property-read WarehouseLocation|null $parent
 * @property-read Collection<int, WarehouseLocation> $children
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class WarehouseLocation extends Model
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
        'warehouse_id',
        'parent_id',
        'code',
        'name',
        'type',
        'is_active',
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
     * Warehouse this location belongs to.
     *
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    /**
     * Immediate parent location. NULL for a root zone.
     *
     * @return BelongsTo<WarehouseLocation, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Immediate child locations.
     *
     * @return HasMany<WarehouseLocation, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
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
            'warehouse_id' => 'integer',
            'parent_id' => 'integer',
            'type' => 'string',
            'is_active' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
