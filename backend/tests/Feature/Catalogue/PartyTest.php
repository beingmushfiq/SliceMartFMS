<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogue;

use App\Core\Auth\JwtService;
use App\Core\Tenancy\TenantContext;
use App\Models\Party;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PartyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private string $jwt;

    protected function setUp(): void
    {
        parent::setUp();
        TenantContext::flush();
        DB::table('plans')->insert([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise',
            'price' => '10000.0000',
            'billing_period' => 'monthly',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->tenant = Tenant::create([
            'id' => 1,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Acme',
            'slug' => 'acme',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);
        $this->user = User::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Operator',
            'email' => 'parties@acme.test',
            'password' => Hash::make('Password123!'),
            'status' => 'active',
            'locale' => 'en',
            'token_version' => 1,
            'perm_version' => 1,
        ]);
        $this->assignOnly('catalog.party.view', 'catalog.party.manage');
    }

    public function test_index_lists_parties_with_pagination_and_filters(): void
    {
        $this->createParty(['code' => 'CUST01', 'name' => 'Alpha Customer', 'is_customer' => true]);
        $this->createParty(['code' => 'SUPP01', 'name' => 'Beta Supplier', 'is_supplier' => true]);

        $response = $this->json('GET', route('tenant.parties.index', ['is_customer' => 'true']), [], $this->headers());
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'CUST01');
    }

    public function test_options_returns_active_parties(): void
    {
        $this->createParty(['code' => 'P1', 'name' => 'Active Party', 'status' => 'active']);
        $this->createParty(['code' => 'P2', 'name' => 'Inactive Party', 'status' => 'inactive']);

        $response = $this->json('GET', route('tenant.parties.options'), [], $this->headers());
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_store_creates_party_with_nested_addresses_and_contacts(): void
    {
        $payload = [
            'code' => 'PRT-NEW',
            'name' => 'New Distributor',
            'is_customer' => true,
            'is_dealer' => true,
            'type' => 'business',
            'credit_limit' => '50000.0000',
            'credit_days' => 30,
            'addresses' => [
                [
                    'type' => 'billing',
                    'line1' => '123 Main Road',
                    'city' => 'Dhaka',
                    'is_default' => true,
                ],
            ],
            'contacts' => [
                [
                    'name' => 'John Doe',
                    'phone' => '+8801700000000',
                    'is_primary' => true,
                ],
            ],
        ];

        $response = $this->json('POST', route('tenant.parties.store'), $payload, $this->headers());
        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code', 'PRT-NEW')
            ->assertJsonCount(1, 'data.addresses')
            ->assertJsonPath('data.addresses.0.city', 'Dhaka')
            ->assertJsonCount(1, 'data.contacts')
            ->assertJsonPath('data.contacts.0.name', 'John Doe');

        $this->assertDatabaseHas('parties', ['tenant_id' => 1, 'code' => 'PRT-NEW']);
        $this->assertDatabaseHas('party_addresses', ['tenant_id' => 1, 'city' => 'Dhaka']);
        $this->assertDatabaseHas('party_contacts', ['tenant_id' => 1, 'name' => 'John Doe']);
    }

    public function test_duplicate_code_returns_conflict(): void
    {
        $this->createParty(['code' => 'DUP-CODE', 'name' => 'Original Party']);

        $response = $this->json('POST', route('tenant.parties.store'), [
            'code' => 'DUP-CODE',
            'name' => 'Duplicate Party',
        ], $this->headers());

        $response->assertStatus(409)
            ->assertJsonPath('error.code', 'DUPLICATE');
    }

    public function test_show_returns_party_details(): void
    {
        $party = $this->createParty(['code' => 'PRT-SHOW', 'name' => 'Show Party']);

        $response = $this->json('GET', route('tenant.parties.show', ['party' => $party->uuid]), [], $this->headers());
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $party->uuid)
            ->assertJsonPath('data.name', 'Show Party');
    }

    public function test_update_modifies_party_and_syncs_addresses(): void
    {
        $party = $this->createParty(['code' => 'PRT-UP', 'name' => 'Before Update']);

        $response = $this->json('PATCH', route('tenant.parties.update', ['party' => $party->uuid]), [
            'name' => 'After Update',
            'addresses' => [
                [
                    'type' => 'shipping',
                    'line1' => '456 Industrial Area',
                    'city' => 'Chittagong',
                    'is_default' => true,
                ],
            ],
        ], $this->headers());

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'After Update')
            ->assertJsonCount(1, 'data.addresses')
            ->assertJsonPath('data.addresses.0.city', 'Chittagong');

        $this->assertDatabaseHas('parties', ['id' => $party->id, 'name' => 'After Update']);
        $this->assertDatabaseHas('party_addresses', ['party_id' => $party->id, 'city' => 'Chittagong']);
    }

    public function test_destroy_soft_deletes_party(): void
    {
        $party = $this->createParty(['code' => 'PRT-DEL', 'name' => 'To Delete']);

        $response = $this->json('DELETE', route('tenant.parties.destroy', ['party' => $party->uuid]), [], $this->headers());
        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('parties', ['id' => $party->id]);
    }

    public function test_cross_tenant_isolation_returns_not_found(): void
    {
        $foreignTenant = Tenant::create([
            'id' => 999,
            'uuid' => (string) Str::uuid(),
            'plan_id' => 1,
            'name' => 'Foreign Tenant',
            'slug' => 'foreign',
            'status' => 'active',
            'currency_code' => 'BDT',
            'timezone' => 'Asia/Dhaka',
            'locale' => 'en',
            'date_format' => 'Y-m-d',
            'number_format' => 'standard',
        ]);

        $uuid = (string) Str::uuid();
        DB::table('parties')->insert([
            'tenant_id' => $foreignTenant->id,
            'uuid' => $uuid,
            'code' => 'FOREIGN-P',
            'name' => 'Foreign Party',
            'type' => 'business',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->json('GET', route('tenant.parties.show', ['party' => $uuid]), [], $this->headers())
            ->assertNotFound()
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    public function test_view_only_user_cannot_mutate(): void
    {
        $this->assignOnly('catalog.party.view');

        $this->json('POST', route('tenant.parties.store'), [
            'code' => 'NOPE',
            'name' => 'Forbidden Party',
        ], $this->headers())->assertForbidden();
    }

    /** @param array<string, mixed> $overrides */
    private function createParty(array $overrides = []): Party
    {
        TenantContext::bind($this->tenant->toArray());
        /** @var Party $party */
        /** @phpstan-ignore argument.type */
        $party = Party::create([
            'uuid' => (string) Str::uuid(),
            'code' => 'P-'.Str::random(6),
            'name' => 'Party Name',
            'type' => 'business',
            'status' => 'active',
            ...$overrides,
        ]);
        TenantContext::flush();

        return $party;
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return ['Authorization' => 'Bearer '.$this->jwt];
    }

    private function assignOnly(string ...$permissions): void
    {
        $role = Role::create([
            'uuid' => (string) Str::uuid(),
            'tenant_id' => 1,
            'name' => 'Party Role',
            'slug' => 'party-'.Str::random(6),
            'is_system' => false,
        ]);
        foreach ($permissions as $name) {
            [$module, $resource, $action] = explode('.', $name);
            $permission = Permission::firstOrCreate(
                ['name' => $name],
                ['uuid' => (string) Str::uuid(), 'module' => $module, 'resource' => $resource, 'action' => $action]
            );
            $role->permissions()->attach($permission);
        }
        $this->user->roles()->detach();
        $this->user->roles()->attach($role);
        $this->jwt = app(JwtService::class)->issueToken(userId: $this->user->id, tenantId: 1, tokenVersion: 1);
    }
}
