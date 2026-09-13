<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Auth\PermissionCatalogue;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class SystemPermissionsSeeder extends Seeder
{
    /**
     * Seed all system-level permissions defined in PermissionCatalogue.
     * Platform-level and universal; strictly independent of any tenant.
     */
    public function run(): void
    {
        foreach (PermissionCatalogue::ALL_PERMISSIONS as $permName) {
            $parts = explode('.', $permName);
            $module = $parts[0];
            $resource = $parts[1] ?? 'general';
            $action = $parts[2] ?? $parts[1] ?? 'view';

            Permission::firstOrCreate(
                ['name' => $permName],
                [
                    'uuid' => (string) Str::uuid(),
                    'module' => $module,
                    'resource' => $resource,
                    'action' => $action,
                    'description' => "Grants {$action} on {$module} {$resource}",
                ]
            );
        }
    }
}
