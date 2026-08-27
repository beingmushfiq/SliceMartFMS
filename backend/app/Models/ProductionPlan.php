<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ProductionPlan
 *
 * Production scheduling plan header (ADR-011).
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $company_id
 * @property int $factory_id
 * @property string $plan_number
 * @property CarbonInterface $plan_date
 * @property CarbonInterface $period_start
 * @property CarbonInterface $period_end
 * @property string $source
 * @property string $status
 * @property string|null $notes
 * @property int|null $approved_by
 * @property CarbonInterface|null $approved_at
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read Collection<int, ProductionPlanItem> $items
 * @property-read User|null $approver
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class ProductionPlan extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'company_id',
        'factory_id',
        'plan_number',
        'plan_date',
        'period_start',
        'period_end',
        'source',
        'status',
        'notes',
        'approved_by',
        'approved_at',
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
     * @return HasMany<ProductionPlanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(ProductionPlanItem::class, 'production_plan_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
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
            'factory_id' => 'integer',
            'plan_date' => 'date',
            'period_start' => 'date',
            'period_end' => 'date',
            'approved_at' => 'datetime',
            'approved_by' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
