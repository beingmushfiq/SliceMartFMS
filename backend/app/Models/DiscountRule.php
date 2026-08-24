<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\DiscountRule
 *
 * A conditional discount applied by the pricing engine. `scope_id` is a
 * polymorphic reference (product, category or party id, NULL when
 * scope = `order`) with no database FK, so no relation method is declared for
 * it — resolving it is the engine's job.
 *
 * `condition` is a schemaless JSON blob evaluated by the discount engine.
 * `value` is DECIMAL(18,4) covering both percentage and fixed-amount discounts.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $name
 * @property string $scope
 * @property int|null $scope_id
 * @property array<string, mixed>|null $condition
 * @property string $discount_type
 * @property string $value
 * @property CarbonInterface|null $valid_from
 * @property CarbonInterface|null $valid_to
 * @property int $priority
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class DiscountRule extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'name',
        'scope',
        'scope_id',
        'condition',
        'discount_type',
        'value',
        'valid_from',
        'valid_to',
        'priority',
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
            'scope' => 'string',
            'scope_id' => 'integer',
            'condition' => 'array',
            'discount_type' => 'string',
            'value' => 'decimal:4',
            'valid_from' => 'date',
            'valid_to' => 'date',
            'priority' => 'integer',
            'is_active' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
