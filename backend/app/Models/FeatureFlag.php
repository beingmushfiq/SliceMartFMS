<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\FeatureFlag
 *
 * Feature flag for staged rollout or global/tenant capabilities gating.
 *
 * @property int $id
 * @property int|null $tenant_id
 * @property string $uuid
 * @property string $key
 * @property bool $enabled
 * @property string|null $rollout_percentage
 * @property array|null $conditions
 * @property string $description
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant|null $tenant
 */
class FeatureFlag extends Model
{
    protected $fillable = [
        'tenant_id',
        'uuid',
        'key',
        'enabled',
        'rollout_percentage',
        'conditions',
        'description',
        'created_by',
        'updated_by',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'rollout_percentage' => 'decimal:4',
            'conditions' => 'array',
        ];
    }
}
