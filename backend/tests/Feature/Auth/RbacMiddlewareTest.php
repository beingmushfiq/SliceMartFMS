<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Core\Auth\JwtService;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserScope;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

class RbacMiddlewareTest extends TestCase
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
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->jwtService = app(JwtService::class);

        // Register a test route guarded by auth.jwt and permission middleware
        Route::middleware(['api', 'auth.jwt', 'permission:production.batch.create'])
            ->post('/api/test-guarded-production-batch', function () {
                return response()->json(['success' => true, 'data' => ['created' => true]]);
            });
    }

    public function test_user_without_permission_receives_403_forbidden(): void
    {
        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->postJson('/api/test-guarded-production-batch');

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_user_with_permission_is_authorized(): void
    {
        $perm = Permission::query()->create([
            'uuid' => (string) Str::uuid(),
            'module' => 'production',
            'resource' => 'batch',
            'action' => 'create',
            'name' => 'production.batch.create',
        ]);

        $role = Role::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Batch Creator',
            'slug' => 'batch-creator',
            'is_system' => false,
        ]);

        $role->permissions()->attach($perm->id);
        $this->user->roles()->attach($role->id);

        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $response = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->postJson('/api/test-guarded-production-batch');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_user_with_permission_but_out_of_scope_receives_403_out_of_scope(): void
    {
        $perm = Permission::query()->create([
            'uuid' => (string) Str::uuid(),
            'module' => 'production',
            'resource' => 'batch',
            'action' => 'create',
            'name' => 'production.batch.create',
        ]);

        $role = Role::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Batch Creator',
            'slug' => 'batch-creator',
            'is_system' => false,
        ]);

        $role->permissions()->attach($perm->id);
        $this->user->roles()->attach($role->id);

        // User is restricted to branch 101 only
        UserScope::query()->create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'scope_type' => 'branch',
            'scope_id' => 101,
        ]);

        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        // Request targets branch 999 which is outside user scope
        $response = $this->withHeaders([
            'Authorization' => 'Bearer '.$jwt,
            'X-Branch-Id' => '999',
        ])->postJson('/api/test-guarded-production-batch');

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'OUT_OF_SCOPE');
    }
}
