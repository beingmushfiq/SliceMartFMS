<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\TenantSubscription
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $plan_id
 * @property CarbonInterface $starts_at
 * @property CarbonInterface|null $ends_at
 * @property string $status
 * @property string $amount
 * @property string|null $external_reference
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Plan $plan
 */
class TenantSubscription extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'uuid',
        'plan_id',
        'starts_at',
        'ends_at',
        'status',
        'amount',
        'external_reference',
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
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'amount' => 'decimal:4',
        ];
    }
}
