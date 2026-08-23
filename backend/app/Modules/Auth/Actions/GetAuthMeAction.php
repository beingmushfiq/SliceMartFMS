<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\PermissionCatalogue;
use App\Models\User;

/**
 * Get Authenticated User Identity Action (API_CONTRACT §8.5).
 *
 * Returns user profile, tenant details, active company/branch,
 * flat effective permissions array, user scopes, and perm_version.
 */
class GetAuthMeAction extends Action
{
    /**
     * Execute identity resolution.
     *
     * @param  array{user: User}  $input
     * @return array<string, mixed>
     */
    public function execute(array $input): array
    {
        /** @var User $user */
        $user = $input['user'];
        $user->loadMissing(['tenant', 'scopes']);

        $effectivePermissions = $user->getEffectivePermissions();
        $permVersion = PermissionCatalogue::computePermVersion($effectivePermissions);

        if ($user->perm_version !== $permVersion) {
            $user->update(['perm_version' => $permVersion]);
        }

        $scopes = $user->scopes->map(fn ($s) => [
            'type' => $s->scope_type,
            'id' => $s->scope_id,
        ])->all();

        $tenantData = null;
        if ($user->tenant !== null) {
            $tenantData = [
                'id' => $user->tenant->id,
                'uuid' => $user->tenant->uuid,
                'name' => $user->tenant->name,
                'slug' => $user->tenant->slug,
                'status' => $user->tenant->status,
                'currency' => $user->tenant->currency_code,
                'timezone' => $user->tenant->timezone,
                'locale' => $user->tenant->locale,
                'branding' => $user->tenant->branding,
            ];
        }

        return [
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'is_platform_admin' => $user->is_platform_admin,
                'locale' => $user->locale ?? 'en',
                'theme' => 'dark',
                'reduced_motion' => false,
                'density' => 'comfortable',
                'landing_page' => '/dashboard',
            ],
            'tenant' => $tenantData,
            'permissions' => $effectivePermissions,
            'scopes' => $scopes,
            'perm_version' => $permVersion,
        ];
    }
}
