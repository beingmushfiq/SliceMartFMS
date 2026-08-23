<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Core\Auth\JwtService;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserScope;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class PreferencesTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private JwtService $jwtService;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('plans')->insert([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise Plan',
            'price' => '10000.0000',
            'billing_period' => 'monthly',
            'is_active' => true,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $this->tenant = Tenant::query()->create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Acme Foods Ltd',
            'slug' => 'acme-foods',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        $this->user = User::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Jane Operator',
            'email' => 'jane@acme.com',
            'password' => Hash::make('OldPassword123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->jwtService = app(JwtService::class);
    }

    public function test_update_preferences_updates_user_attributes(): void
    {
        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->patchJson('/api/v1/auth/preferences', [
                'locale' => 'bn',
                'theme' => 'dark',
                'reduced_motion' => true,
                'density' => 'compact',
                'landing_page' => '/production/batches',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.locale', 'bn');
        $response->assertJsonPath('data.theme', 'dark');
        $response->assertJsonPath('data.reduced_motion', true);
        $response->assertJsonPath('data.density', 'compact');
        $response->assertJsonPath('data.landing_page', '/production/batches');

        $this->user->refresh();
        $this->assertSame('bn', $this->user->locale);
    }

    public function test_switch_branch_succeeds_when_within_scope(): void
    {
        UserScope::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'scope_type' => 'branch',
            'scope_id' => 50,
        ]);

        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->postJson('/api/v1/auth/switch-branch', [
                'branch_id' => 50,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.active_branch_id', 50);
    }

    public function test_switch_branch_fails_when_outside_scope(): void
    {
        UserScope::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'scope_type' => 'branch',
            'scope_id' => 50,
        ]);

        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->postJson('/api/v1/auth/switch-branch', [
                'branch_id' => 999,
            ]);

        $response->assertStatus(422);
    }

    public function test_get_permissions_catalogue_returns_all_canonical_permissions(): void
    {
        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->getJson('/api/v1/auth/permissions');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        /** @var list<string> $permissions */
        $permissions = is_array($response->json('data.permissions')) ? array_values($response->json('data.permissions')) : [];
        $this->assertNotEmpty($permissions);
        $this->assertContains('production.batch.create', $permissions);
    }

    public function test_change_password_updates_hash_and_invalidates_current_session(): void
    {
        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->patchJson('/api/v1/auth/change-password', [
                'current_password' => 'OldPassword123!',
                'new_password' => 'BrandNewPassword999!',
            ]);

        $response->assertStatus(200);

        // Verification: previous JWT is revoked (token_version was incremented)
        $subsequentResponse = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->getJson('/api/v1/auth/me');
        $subsequentResponse->assertStatus(401);

        // Login with new password succeeds
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'jane@acme.com',
            'password' => 'BrandNewPassword999!',
        ]);
        $loginResponse->assertStatus(200);
    }
}
