<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Auth\PermissionCatalogue;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;

        // 1. Seed All Canonical System Permissions
        $permissionModelMap = [];
        foreach (PermissionCatalogue::ALL_PERMISSIONS as $permName) {
            [$module, $resource, $action] = explode('.', $permName);
            /** @var Permission $permission */
            $permission = Permission::firstOrCreate(
                ['name' => $permName],
                [
                    'uuid' => (string) Str::uuid(),
                    'module' => $module,
                    'resource' => $resource,
                    'action' => $action,
                    'description' => "Grants {$action} on {$module} {$resource}",
                ]
            );
            $permissionModelMap[$permName] = $permission->id;
        }

        // 2. Super Administrator Role
        $superAdminRole = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Super Administrator',
            'slug' => 'super_admin',
            'description' => 'Unrestricted access to all tenant functions and configurations',
            'is_system' => true,
        ]);
        $superAdminRole->permissions()->sync(array_values($permissionModelMap));

        // 3. Production Manager Role
        $productionManagerRole = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Production Manager',
            'slug' => 'production_manager',
            'description' => 'Manages batch recipes, production schedules, shift logs, and factory output',
            'is_system' => false,
        ]);
        $prodPerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'production.')
                || str_starts_with($key, 'qc.')
                || str_starts_with($key, 'catalog.')
                || str_starts_with($key, 'org.')
                || str_starts_with($key, 'inventory.warehouse.view')
                || str_starts_with($key, 'inventory.stock.view'),
            ARRAY_FILTER_USE_KEY
        );
        $productionManagerRole->permissions()->sync(array_values($prodPerms));

        // 4. Quality Control Inspector Role
        $qcRole = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'QC Inspector',
            'slug' => 'qc_inspector',
            'description' => 'Executes quality parameters inspection, logs defects and wastage',
            'is_system' => false,
        ]);
        $qcPerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'qc.')
                || in_array($key, ['catalog.product.view', 'catalog.bom.view', 'production.batch.view', 'production.output.view'], true),
            ARRAY_FILTER_USE_KEY
        );
        $qcRole->permissions()->sync(array_values($qcPerms));

        // 5. Storekeeper / Warehouse Officer Role
        $storekeeperRole = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Warehouse Storekeeper',
            'slug' => 'storekeeper',
            'description' => 'Manages stock movements, transfers, receipts, and material issues',
            'is_system' => false,
        ]);
        $storePerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'inventory.')
                || str_starts_with($key, 'purchasing.grn.')
                || in_array($key, ['catalog.product.view', 'catalog.unit.view', 'production.material_issue.view', 'production.material_issue.create'], true),
            ARRAY_FILTER_USE_KEY
        );
        $storekeeperRole->permissions()->sync(array_values($storePerms));

        // 6. Sales Officer Role
        $salesRole = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Sales Officer',
            'slug' => 'sales_officer',
            'description' => 'Manages CRM leads, orders, invoices, and retail counter operations',
            'is_system' => false,
        ]);
        $salesPerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'sales.')
                || str_starts_with($key, 'pos.')
                || str_starts_with($key, 'pricing.')
                || in_array($key, ['catalog.product.view', 'catalog.party.view', 'catalog.party.manage', 'inventory.stock.view'], true),
            ARRAY_FILTER_USE_KEY
        );
        $salesRole->permissions()->sync(array_values($salesPerms));

        // 7. Seed Demo Users
        $defaultPassword = Hash::make('Password123!');

        $adminUser = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'System Administrator',
            'email' => 'admin@slicemart.test',
            'password' => $defaultPassword,
            'phone' => '+8801700000001',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $adminUser->roles()->attach($superAdminRole);

        $prodUser = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Hasan Production Lead',
            'email' => 'production@slicemart.test',
            'password' => $defaultPassword,
            'phone' => '+8801700000002',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $prodUser->roles()->attach($productionManagerRole);

        $qcUser = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Farhana QC Lead',
            'email' => 'qc@slicemart.test',
            'password' => $defaultPassword,
            'phone' => '+8801700000003',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $qcUser->roles()->attach($qcRole);

        $storeUser = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Rafiq Store In-Charge',
            'email' => 'store@slicemart.test',
            'password' => $defaultPassword,
            'phone' => '+8801700000004',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $storeUser->roles()->attach($storekeeperRole);

        $salesUser = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenantId,
            'name' => 'Tanvir Sales Lead',
            'email' => 'sales@slicemart.test',
            'password' => $defaultPassword,
            'phone' => '+8801700000005',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $salesUser->roles()->attach($salesRole);

        // 8. Seed Platform Super Administrator (DevCenterPoint Staff - tenant_id = null)
        $platformAdmin = new User([
            'uuid' => (string) Str::uuid(),
            'name' => 'Platform Super Admin',
            'email' => 'admin@devcenterpoint.com',
            'password' => Hash::make('PlatformAdmin123!'),
            'phone' => '+18005550199',
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $platformAdmin->tenant_id = null;
        $platformAdmin->save();
    }
}
