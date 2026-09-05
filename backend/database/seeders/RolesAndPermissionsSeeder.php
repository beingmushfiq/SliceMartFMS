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
        $superAdminRole = Role::firstOrCreate(
            ['tenant_id' => $tenantId, 'slug' => 'super_admin'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Super Administrator',
                'description' => 'Unrestricted access to all tenant functions and configurations',
                'is_system' => true,
            ]
        );
        $superAdminRole->permissions()->sync(array_values($permissionModelMap));

        // 3. Production Manager Role
        $productionManagerRole = Role::firstOrCreate(
            ['tenant_id' => $tenantId, 'slug' => 'production_manager'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Production Manager',
                'description' => 'Manages cooker & stove assembly BOMs, production schedules, shift logs, and assembly floor output',
                'is_system' => false,
            ]
        );
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
        $qcRole = Role::firstOrCreate(
            ['tenant_id' => $tenantId, 'slug' => 'qc_inspector'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'QC Inspector',
                'description' => 'Executes quality parameters inspection, logs defects and wastage',
                'is_system' => false,
            ]
        );
        $qcPerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'qc.')
                || in_array($key, ['catalog.product.view', 'catalog.bom.view', 'production.batch.view', 'production.output.view'], true),
            ARRAY_FILTER_USE_KEY
        );
        $qcRole->permissions()->sync(array_values($qcPerms));

        // 5. Storekeeper / Warehouse Officer Role
        $storekeeperRole = Role::firstOrCreate(
            ['tenant_id' => $tenantId, 'slug' => 'storekeeper'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Warehouse Storekeeper',
                'description' => 'Manages stock movements, transfers, receipts, and material issues',
                'is_system' => false,
            ]
        );
        $storePerms = array_filter(
            $permissionModelMap,
            static fn (string $key): bool => str_starts_with($key, 'inventory.')
                || str_starts_with($key, 'purchasing.grn.')
                || in_array($key, ['catalog.product.view', 'catalog.unit.view', 'production.material_issue.view', 'production.material_issue.create'], true),
            ARRAY_FILTER_USE_KEY
        );
        $storekeeperRole->permissions()->sync(array_values($storePerms));

        // 6. Sales Officer Role
        $salesRole = Role::firstOrCreate(
            ['tenant_id' => $tenantId, 'slug' => 'sales_officer'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Sales Officer',
                'description' => 'Manages CRM leads, orders, invoices, and retail counter operations',
                'is_system' => false,
            ]
        );
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

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@slicemart.test'],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => 'System Administrator',
                'password' => $defaultPassword,
                'phone' => '+8801700000001',
                'status' => 'active',
                'locale' => 'en',
                'token_version' => 1,
                'perm_version' => 1,
            ]
        );
        $adminUser->roles()->syncWithoutDetaching([$superAdminRole->id]);

        $prodUser = User::firstOrCreate(
            ['email' => 'production@slicemart.test'],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => 'Hasan Production Lead',
                'password' => $defaultPassword,
                'phone' => '+8801700000002',
                'status' => 'active',
                'locale' => 'en',
                'token_version' => 1,
                'perm_version' => 1,
            ]
        );
        $prodUser->roles()->syncWithoutDetaching([$productionManagerRole->id]);

        $qcUser = User::firstOrCreate(
            ['email' => 'qc@slicemart.test'],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => 'Farhana QC Lead',
                'password' => $defaultPassword,
                'phone' => '+8801700000003',
                'status' => 'active',
                'locale' => 'en',
                'token_version' => 1,
                'perm_version' => 1,
            ]
        );
        $qcUser->roles()->syncWithoutDetaching([$qcRole->id]);

        $storeUser = User::firstOrCreate(
            ['email' => 'store@slicemart.test'],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => 'Rafiq Store In-Charge',
                'password' => $defaultPassword,
                'phone' => '+8801700000004',
                'status' => 'active',
                'locale' => 'en',
                'token_version' => 1,
                'perm_version' => 1,
            ]
        );
        $storeUser->roles()->syncWithoutDetaching([$storekeeperRole->id]);

        $salesUser = User::firstOrCreate(
            ['email' => 'sales@slicemart.test'],
            [
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'name' => 'Kamal Sales Officer',
                'password' => $defaultPassword,
                'phone' => '+8801700000005',
                'status' => 'active',
                'locale' => 'en',
                'token_version' => 1,
                'perm_version' => 1,
            ]
        );
        $salesUser->roles()->syncWithoutDetaching([$salesRole->id]);

        // 8. Seed Platform Super Administrator (DevCenterPoint Staff - tenant_id = null)
        if (!User::where('email', 'admin@devcenterpoint.com')->exists()) {
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
}
