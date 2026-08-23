<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * App\Models\Permission
 *
 * @property int $id
 * @property string $uuid
 * @property string $module
 * @property string $resource
 * @property string $action
 * @property string $name
 * @property string $guard_name
 * @property string|null $description
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Collection<int, Role> $roles
 */
class Permission extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'name',
        'module',
        'resource',
        'action',
        'description',
    ];

    /**
     * Roles granting this permission.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission', 'permission_id', 'role_id');
    }
}
