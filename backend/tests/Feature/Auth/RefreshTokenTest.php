<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

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

class RefreshTokenTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

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

    public function test_refresh_token_rotation_issues_new_token_and_revokes_old(): void
    {
        $initial = $this->refreshService->createRefreshToken($this->user);

        $response = $this->postWithRefreshToken('/api/v1/auth/refresh', $initial['token']);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure([
            'success',
            'data' => ['access_token', 'token_type', 'expires_in'],
            'meta' => ['correlation_id'],
        ]);

        $response->assertCookie('slicemart_refresh_token');

        // Verify old token is revoked
        $oldToken = RefreshToken::query()->find($initial['model']->id);
        $this->assertNotNull($oldToken?->revoked_at);
        $this->assertNotNull($oldToken?->replaced_by_id);

        // Verify new token exists in same family
        $newToken = RefreshToken::query()->find($oldToken?->replaced_by_id);
        $this->assertNotNull($newToken);
        $this->assertSame($initial['model']->family_id, $newToken->family_id);
        $this->assertNull($newToken->revoked_at);
    }

    public function test_reused_revoked_token_triggers_full_family_revocation(): void
    {
        // 1. Issue initial token T1
        $t1 = $this->refreshService->createRefreshToken($this->user);
        $familyId = $t1['model']->family_id;

        // 2. Rotate T1 -> T2
        $rotateResponse = $this->postWithRefreshToken('/api/v1/auth/refresh', $t1['token']);
        $rotateResponse->assertStatus(200);

        // T2 is active in database
        $activeTokensCount = RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->count();
        $this->assertSame(1, $activeTokensCount);

        // 3. Stolen token scenario: Attacker presents already-rotated T1 again
        $reusedResponse = $this->postWithRefreshToken('/api/v1/auth/refresh', $t1['token']);

        $reusedResponse->assertStatus(401);
        $reusedResponse->assertJsonPath('error.code', 'REFRESH_REUSED');

        // 4. Verify ALL tokens in this family are now revoked
        $remainingActiveCount = RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->count();
        $this->assertSame(0, $remainingActiveCount, 'All tokens in compromised family must be revoked.');
    }

    public function test_expired_refresh_token_is_rejected(): void
    {
        $t = $this->refreshService->createRefreshToken($this->user);
        $t['model']->update([
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->postWithRefreshToken('/api/v1/auth/refresh', $t['token']);

        $response->assertStatus(401);
        $response->assertJsonPath('error.code', 'REFRESH_EXPIRED');
    }
}
