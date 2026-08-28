<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\TenantUsageCounter
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $metric
 * @property string $period
 * @property int $value
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 */
class TenantUsageCounter extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'uuid',
        'metric',
        'period',
        'value',
    ];

    /**
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'integer',
        ];
    }
}
