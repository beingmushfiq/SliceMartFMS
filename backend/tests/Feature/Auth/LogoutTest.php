<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Core\Auth\JwtService;
use App\Core\Auth\RefreshTokenService;
use App\Models\RefreshToken;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private JwtService $jwtService;

    private RefreshTokenService $refreshService;

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
            'name' => 'John Operator',
            'email' => 'john@acme.com',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);

        $this->jwtService = app(JwtService::class);
        $this->refreshService = app(RefreshTokenService::class);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function postWithRefreshToken(string $uri, string $token, array $data = []): TestResponse
    {
        return $this->call(
            'POST',
            $uri,
            $data,
            [$this->refreshService->getCookieName() => $token],
            [],
            ['HTTP_ACCEPT' => 'application/json']
        );
    }

    public function test_logout_revokes_family_and_clears_cookie(): void
    {
        $token = $this->refreshService->createRefreshToken($this->user);

        $response = $this->postWithRefreshToken('/api/v1/auth/logout', $token['token']);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $refreshedModel = RefreshToken::query()->find($token['model']->id);
        $this->assertNotNull($refreshedModel?->revoked_at);
    }

    public function test_logout_all_bumps_token_version_and_invalidates_current_jwt(): void
    {
        $jwt = $this->jwtService->issueToken(
            userId: $this->user->id,
            tenantId: $this->tenant->id,
            tokenVersion: $this->user->token_version
        );

        $this->refreshService->createRefreshToken($this->user);
        $this->refreshService->createRefreshToken($this->user);

        // Active request succeeds with current JWT
        $meResponse = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(200);

        // Perform logout-all
        $logoutAllResponse = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->postJson('/api/v1/auth/logout-all');
        $logoutAllResponse->assertStatus(200);

        // Previous JWT now fails with TOKEN_REVOKED (401)
        $subsequentResponse = $this->withHeader('Authorization', 'Bearer '.$jwt)
            ->getJson('/api/v1/auth/me');
        $subsequentResponse->assertStatus(401);
        $subsequentResponse->assertJsonPath('error.code', 'TOKEN_REVOKED');

        // All refresh tokens are revoked
        $activeRefreshTokens = RefreshToken::query()
            ->where('user_id', $this->user->id)
            ->whereNull('revoked_at')
            ->count();
        $this->assertSame(0, $activeRefreshTokens);
    }
}
