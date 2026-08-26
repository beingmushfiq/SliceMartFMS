<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Warehouse
 *
 * A physical storage location. `company_id`, `branch_id` and `factory_id` are
 * all optional composite FKs — NULL means the warehouse is tenant-wide rather
 * than scoped to one org unit. No relation methods are declared for them
 * because the corresponding models are owned by the organisation module.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int|null $company_id
 * @property int|null $branch_id
 * @property int|null $factory_id
 * @property string $code
 * @property string $name
 * @property string $type
 * @property string|null $address
 * @property bool $is_default
 * @property bool $allows_negative_stock
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read Collection<int, WarehouseLocation> $locations
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class Warehouse extends Model
{
    use BelongsToTenant;

    /** @use HasFactory<\Database\Factories\WarehouseFactory> */
    use HasFactory;
    use SoftDeletes;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'company_id',
        'branch_id',
        'factory_id',
        'code',
        'name',
        'type',
        'address',
        'is_default',
        'allows_negative_stock',
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
     * Locations (zones, racks, shelves, bins) inside this warehouse.
     *
     * @return HasMany<WarehouseLocation, $this>
     */
    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class, 'warehouse_id');
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
            'company_id' => 'integer',
            'branch_id' => 'integer',
            'factory_id' => 'integer',
            'type' => 'string',
            'is_default' => 'boolean',
            'allows_negative_stock' => 'boolean',
            'is_active' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
