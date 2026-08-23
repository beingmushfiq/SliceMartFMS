<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Core\Auth\JwtService;
use App\Core\Auth\PermissionCatalogue;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthMeTest extends TestCase
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
            'name' => 'Jane Supervisor',
            'email' => 'jane@acme.com',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->jwtService = app(JwtService::class);
    }

    public function test_auth_me_returns_identity_and_effective_permissions(): void
    {
        $perm1 = Permission::query()->create([
            'uuid' => (string) Str::uuid(),
            'module' => 'production',
            'resource' => 'batch',
            'action' => 'view',
            'name' => 'production.batch.view',
        ]);

        $perm2 = Permission::query()->create([
            'uuid' => (string) Str::uuid(),
            'module' => 'production',
            'resource' => 'batch',
            'action' => 'create',
            'name' => 'production.batch.create',
        ]);

        $role = Role::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Production Supervisor',
            'slug' => 'production-supervisor',
            'is_system' => false,
        ]);

        $role->permissions()->attach([$perm1->id, $perm2->id]);
        $this->user->roles()->attach($role->id);

        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.user.email', 'jane@acme.com');
        $response->assertJsonPath('data.tenant.name', 'Acme Foods Ltd');

        /** @var list<string> $permissions */
        $permissions = is_array($response->json('data.permissions')) ? array_values($response->json('data.permissions')) : [];
        $this->assertContains('production.batch.view', $permissions);
        $this->assertContains('production.batch.create', $permissions);

        $expectedPermVersion = PermissionCatalogue::computePermVersion($permissions);
        $this->assertSame($expectedPermVersion, $response->json('data.perm_version'));
    }
}
