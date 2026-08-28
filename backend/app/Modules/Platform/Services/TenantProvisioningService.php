<?php

declare(strict_types=1);

namespace App\Modules\Platform\Services;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Permission;
use App\Models\Plan;
use App\Models\ReasonCode;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\TenantUsageCounter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Transactional Provisioning Engine for New Tenants (ADR-002, ADR-004, ADR-005).
 *
 * Atomically provisions a complete tenant ecosystem including organization structure,
 * owner account, RBAC assignments, usage counters, document sequences, and reason codes.
 */
class TenantProvisioningService
{
    /**
     * Provision a new tenant and all initial scaffolding.
     *
     * @param  array<string, mixed>  $input
     * @return array{
     *     tenant: Tenant,
     *     subscription: TenantSubscription,
     *     owner: User,
     *     company: Company,
     *     branch: Branch
     * }
     */
    public function provision(array $input, ?int $actorId = null): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $rawSlug = trim(strtolower((string) ($input['slug'] ?? '')));
        $slug = preg_replace('/[^a-z0-9\-]/', '', $rawSlug) ?? '';

        if ($slug === '' || in_array($slug, $this->reservedSubdomains(), true)) {
            throw ValidationException::withMessages([
                'slug' => ["The subdomain slug '{$rawSlug}' is invalid or reserved by the platform."],
            ]);
        }

        if (Tenant::where('slug', $slug)->exists()) {
            throw ValidationException::withMessages([
                'slug' => ["The subdomain '{$slug}' is already taken."],
            ]);
        }

        $planId = (int) ($input['plan_id'] ?? 1);
        $plan = Plan::find($planId);
        if ($plan === null) {
            throw ValidationException::withMessages([
                'plan_id' => ['The selected subscription plan does not exist.'],
            ]);
        }

        $ownerEmail = trim(strtolower((string) ($input['owner_email'] ?? '')));
        $ownerName = trim((string) ($input['owner_name'] ?? 'Tenant Administrator'));
        $ownerPassword = (string) ($input['password'] ?? 'Secret123!');
        $currencyCode = strtoupper(substr((string) ($input['currency_code'] ?? 'USD'), 0, 3));
        $timezone = (string) ($input['timezone'] ?? 'UTC');
        $locale = (string) ($input['locale'] ?? 'en');
        $isTrial = (bool) ($input['is_trial'] ?? false);
        $trialDays = (int) ($input['trial_days'] ?? 14);

        return DB::transaction(function () use (
            $name,
            $slug,
            $plan,
            $ownerEmail,
            $ownerName,
            $ownerPassword,
            $currencyCode,
            $timezone,
            $locale,
            $isTrial,
            $trialDays,
            $actorId,
            $input
        ) {
            $now = Carbon::now();
            $trialEndsAt = $isTrial ? $now->copy()->addDays($trialDays) : null;
            $status = $isTrial ? 'trial' : 'active';

            // 1. Create Tenant Record
            $tenant = Tenant::create([
                'uuid' => (string) Str::uuid(),
                'name' => $name,
                'slug' => $slug,
                'plan_id' => $plan->id,
                'status' => $status,
                'trial_ends_at' => $trialEndsAt,
                'activated_at' => $now,
                'locale' => $locale,
                'timezone' => $timezone,
                'currency_code' => $currencyCode,
                'date_format' => (string) ($input['date_format'] ?? 'Y-m-d'),
                'number_format' => (string) ($input['number_format'] ?? '2,.,,'),
                'settings' => $input['settings'] ?? [
                    'allow_offline_pos' => true,
                    'enforce_qc_on_output' => true,
                    'enable_worker_piece_rate' => true,
                ],
                'branding' => $input['branding'] ?? [
                    'primary_color' => '#0ea5e9',
                    'logo_url' => null,
                ],
                'created_by' => $actorId,
            ]);

            // 2. Create Initial Tenant Subscription
            $subscription = TenantSubscription::create([
                'tenant_id' => $tenant->id,
                'uuid' => (string) Str::uuid(),
                'plan_id' => $plan->id,
                'starts_at' => $now,
                'ends_at' => $isTrial ? $trialEndsAt : $now->copy()->addMonth(),
                'status' => $status,
                'amount' => $isTrial ? 0.0000 : $plan->price,
                'external_reference' => $input['payment_reference'] ?? null,
                'created_by' => $actorId,
            ]);

            // 3. Initialize Usage Counters
            $metrics = ['users', 'warehouses', 'documents_created', 'storage_bytes'];
            foreach ($metrics as $metric) {
                TenantUsageCounter::create([
                    'tenant_id' => $tenant->id,
                    'uuid' => (string) Str::uuid(),
                    'metric' => $metric,
                    'period' => 'lifetime',
                    'value' => $metric === 'users' ? 1 : 0,
                ]);
            }

            // 4. Create Default Company & Branch
            $company = Company::create([
                'tenant_id' => $tenant->id,
                'uuid' => (string) Str::uuid(),
                'code' => 'HQ',
                'name' => $name.' Head Office',
                'is_active' => true,
            ]);

            $branch = Branch::create([
                'tenant_id' => $tenant->id,
                'company_id' => $company->id,
                'uuid' => (string) Str::uuid(),
                'code' => 'MAIN',
                'name' => 'Main Operational Branch',
                'type' => 'mixed',
                'is_active' => true,
            ]);

            // 5. Create Tenant Owner User Account
            $owner = User::create([
                'tenant_id' => $tenant->id,
                'uuid' => (string) Str::uuid(),
                'name' => $ownerName,
                'email' => $ownerEmail,
                'password' => Hash::make($ownerPassword),
                'status' => 'active',
                'token_version' => 1,
                'perm_version' => 1,
            ]);

            // 6. Create Default Tenant Admin Role & Attach All Tenant Permissions
            $adminRole = Role::create([
                'tenant_id' => $tenant->id,
                'uuid' => (string) Str::uuid(),
                'name' => 'Administrator',
                'slug' => 'admin',
                'is_system' => true,
            ]);

            // Attach all tenant-scope permissions
            $tenantPermissions = Permission::where('is_platform_only', false)->pluck('id');
            if ($tenantPermissions->isNotEmpty()) {
                $adminRole->permissions()->sync($tenantPermissions);
            }

            $owner->roles()->sync([$adminRole->id]);

            // 7. Seed Default System Reason Codes
            $defaultReasons = [
                ['code' => 'RC-ADJ-DAM', 'name' => 'Damaged Goods', 'context' => 'stock_adjustment'],
                ['code' => 'RC-ADJ-CNT', 'name' => 'Stock Count Discrepancy', 'context' => 'stock_adjustment'],
                ['code' => 'RC-QC-REJ', 'name' => 'QC Dimension Mismatch', 'context' => 'qc_defect'],
                ['code' => 'RC-WST-TRM', 'name' => 'Production Trim Wastage', 'context' => 'wastage'],
            ];
            foreach ($defaultReasons as $rc) {
                $reasonCode = new ReasonCode([
                    'uuid' => (string) Str::uuid(),
                    'code' => $rc['code'],
                    'name' => $rc['name'],
                    'context' => $rc['context'],
                    'is_active' => true,
                ]);
                $reasonCode->tenant_id = $tenant->id;
                $reasonCode->save();
            }

            // 8. Seed Default Document Numbering Sequences
            $sequences = [
                ['type' => 'invoice', 'prefix' => 'INV-'],
                ['type' => 'sales_order', 'prefix' => 'SO-'],
                ['type' => 'purchase_order', 'prefix' => 'PO-'],
                ['type' => 'production_plan', 'prefix' => 'PLAN-'],
                ['type' => 'batch', 'prefix' => 'BATCH-'],
                ['type' => 'qc', 'prefix' => 'QC-'],
                ['type' => 'goods_receipt', 'prefix' => 'GRN-'],
                ['type' => 'delivery_order', 'prefix' => 'DEL-'],
                ['type' => 'payment', 'prefix' => 'PAY-'],
            ];
            foreach ($sequences as $seq) {
                DB::table('document_sequences')->insert([
                    'tenant_id' => $tenant->id,
                    'uuid' => (string) Str::uuid(),
                    'company_id' => $company->id,
                    'branch_id' => $branch->id,
                    'document_type' => $seq['type'],
                    'prefix' => $seq['prefix'],
                    'suffix' => null,
                    'padding' => 5,
                    'next_number' => 1,
                    'reset_period' => 'yearly',
                    'last_reset_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // 9. Platform Audit Log Record
            AuditLog::withoutTenantScope()->create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $actorId,
                'action' => \App\Core\Audit\AuditAction::Created,
                'auditable_type' => 'Tenant',
                'auditable_id' => $tenant->id,
                'ip' => request()->ip() ?? '127.0.0.1',
                'user_agent' => request()->userAgent() ?? 'System / Master Admin',
                'created_at' => $now,
                'after' => [
                    'tenant_id' => $tenant->id,
                    'slug' => $tenant->slug,
                    'plan' => $plan->code,
                    'owner' => $owner->email,
                    'status' => $tenant->status,
                ],
            ]);

            return [
                'tenant' => $tenant,
                'subscription' => $subscription,
                'owner' => $owner,
                'company' => $company,
                'branch' => $branch,
            ];
        });
    }

    /**
     * Reserved subdomains that cannot be registered by tenants.
     *
     * @return list<string>
     */
    public function reservedSubdomains(): array
    {
        return [
            'app',
            'admin',
            'api',
            'platform',
            'devcenterpoint',
            'mail',
            'smtp',
            'status',
            'portal',
            'store',
            'shop',
            'www',
            'root',
            'demo',
            'staging',
            'test',
            'localhost',
            'master',
        ];
    }
}
