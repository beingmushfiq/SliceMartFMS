<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Tenant
 *
 * @property int $id
 * @property string $uuid
 * @property int $plan_id
 * @property string $name
 * @property string $slug
 * @property string|null $domain
 * @property string $status
 * @property string $currency
 * @property string $timezone
 * @property string $locale
 * @property string|null $logo_path
 * @property array<string, mixed>|null $branding
 * @property CarbonInterface|null $trial_ends_at
 * @property CarbonInterface|null $grace_period_ends_at
 * @property CarbonInterface|null $suspended_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Collection<int, User> $users
 */
class Tenant extends Model
{
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'plan_id',
        'name',
        'slug',
        'status',
        'currency_code',
        'timezone',
        'locale',
        'date_format',
        'number_format',
        'settings',
        'branding',
        'trial_ends_at',
        'activated_at',
        'suspended_at',
    ];

    /**
     * Users associated with this tenant.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'tenant_id');
    }

    /**
     * Check if tenant is in an active state.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' || $this->status === 'trialing';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'branding' => 'array',
            'trial_ends_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }
}
