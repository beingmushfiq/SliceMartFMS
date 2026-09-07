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
            $parts = explode('.', $permName);
            $module = $parts[0];
            $resource = $parts[1] ?? 'general';
            $action = $parts[2] ?? $parts[1] ?? 'view';
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
            static fn (string $k): bool => in_array($k, [
                // Production — full CRUD + workflow
                'production.plan.view', 'production.plan.create', 'production.plan.update', 'production.plan.delete', 'production.plan.approve',
                'production.batch.view', 'production.batch.create', 'production.batch.update', 'production.batch.delete', 'production.batch.approve',
                'production.material_issue.view', 'production.material_issue.create', 'production.material_issue.update',
                'production.output.view', 'production.output.create', 'production.output.update',
                'production.worker_entry.view', 'production.worker_entry.create', 'production.worker_entry.update', 'production.worker_entry.delete', 'production.worker_entry.approve',
                // QC — view + basic CRUD
                'qc.inspection.view', 'qc.inspection.create', 'qc.inspection.update', 'qc.inspection.approve',
                'qc.parameter.view', 'qc.wastage.view', 'qc.wastage.create', 'qc.wastage.update',
                // Catalog — read-only
                'catalog.product.view', 'catalog.bom.view', 'catalog.unit.view', 'catalog.party.view',
                // Inventory — read-only
                'inventory.warehouse.view', 'inventory.stock.view',
                // Org
                'org.company.view', 'org.branch.view', 'org.factory.view', 'org.production_line.view',
            ], true),
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
            static fn (string $k): bool => in_array($k, [
                'qc.inspection.view', 'qc.inspection.create', 'qc.inspection.update', 'qc.inspection.approve',
                'qc.parameter.view', 'qc.parameter.create',
                'qc.defect.view', 'qc.defect.create',
                'qc.wastage.view', 'qc.wastage.create', 'qc.wastage.update', 'qc.wastage.approve',
                'catalog.product.view', 'catalog.bom.view',
                'production.batch.view', 'production.output.view',
            ], true),
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
            static fn (string $k): bool => in_array($k, [
                'inventory.warehouse.view', 'inventory.warehouse.create', 'inventory.warehouse.update',
                'inventory.stock.view', 'inventory.stock.create', 'inventory.stock.adjust',
                'inventory.movement.view',
                'inventory.transfer.view', 'inventory.transfer.create', 'inventory.transfer.update', 'inventory.transfer.approve',
                'inventory.count.view', 'inventory.count.create', 'inventory.count.update', 'inventory.count.approve',
                'purchasing.grn.view', 'purchasing.grn.create', 'purchasing.grn.approve',
                'catalog.product.view', 'catalog.unit.view',
                'production.material_issue.view', 'production.material_issue.create',
            ], true),
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
            static fn (string $k): bool => in_array($k, [
                'sales.lead.view', 'sales.lead.create', 'sales.lead.update', 'sales.lead.delete',
                'sales.order.view', 'sales.order.create', 'sales.order.approve',
                'sales.invoice.view', 'sales.invoice.create', 'sales.invoice.approve', 'sales.invoice.print',
                'sales.return.view', 'sales.return.create',
                'pos.terminal.view', 'pos.session.view', 'pos.session.open', 'pos.session.close',
                'pos.sale.view', 'pos.sale.create',
                'pricing.price_list.view', 'pricing.discount_rule.view', 'pricing.tax_profile.view',
                'catalog.product.view',
                'catalog.party.view', 'catalog.party.create', 'catalog.party.update',
                'inventory.stock.view',
            ], true),
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
