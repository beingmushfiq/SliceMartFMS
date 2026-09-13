<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * App\Models\PlatformRole
 *
 * Master SaaS Control Panel role definition for platform-level RBAC.
 *
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property array<string> $permissions
 * @property bool $is_system
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
class PlatformRole extends Model
{
    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
        'created_by',
        'updated_by',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'platform_role_user', 'platform_role_id', 'user_id')
            ->withPivot(['granted_by', 'granted_at']);
    }

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'is_system' => 'boolean',
        ];
    }
}
