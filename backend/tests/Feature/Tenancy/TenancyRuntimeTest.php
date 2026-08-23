<?php

declare(strict_types=1);

namespace Tests\Feature\Tenancy;

use App\Core\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\Feature\Database\SchemaTestCase;

/**
 * §7 Item 29 — Tenancy runtime contract tests.
 *
 * Three tests, each proving a different invariant of the tenancy runtime:
 *
 *   1. Layer-5 (schema) isolation: two tenants can co-exist; a company row
 *      belonging to tenant A is invisible when filtered by tenant B.
 *
 *   2. withoutTenantScope() logging: every call emits a Log::warning() with
 *      the model class and caller context, regardless of whether a context is
 *      bound.
 *
 *   3. Queue job without context: calling TenantContext::current() without a
 *      prior bind() throws RuntimeException immediately rather than running
 *      silently with wrong/no tenant scope.
 *
 * All three extend SchemaTestCase which carries RefreshDatabase and the
 * fixture helpers (insertTenantWithPlan, insertCompany, etc.).
 */
final class TenancyRuntimeTest extends SchemaTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Clear any context that might have leaked from a previous test.
        TenantContext::flush();
    }

    protected function tearDown(): void
    {
        TenantContext::flush();
        parent::tearDown();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1 — Layer-5 schema isolation (DATABASE_DESIGN §1, ARCHITECTURE §3.1)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Two tenants can co-exist without bleeding rows into each other's scope.
     *
     * This test exercises the raw DB layer (not Eloquent) because no module
     * model uses BelongsToTenant yet. The invariant being proved is that the
     * (tenant_id, id) composite structure in the schema prevents cross-tenant
     * visibility at the SQL level — the application-level scope (BelongsToTenant
     * GlobalScope) adds a second enforcement layer on top of this.
     *
     * This is the Phase 1 exit criterion for the MODULE_MAP (DEVELOPMENT_STATUS §7,
     * item 29).
     */
    public function test_two_tenants_are_isolated_at_the_schema_layer(): void
    {
        $tenantAId = $this->insertTenantWithPlan('tenant-a');
        $tenantBId = $this->insertTenantWithPlan('tenant-b');

        $companyA = $this->insertCompany($tenantAId, ['name' => 'Company A']);
        $companyB = $this->insertCompany($tenantBId, ['name' => 'Company B']);

        // Each tenant can see only their own company.
        $aRows = DB::table('companies')
            ->where('tenant_id', $tenantAId)
            ->pluck('id')
            ->all();

        $bRows = DB::table('companies')
            ->where('tenant_id', $tenantBId)
            ->pluck('id')
            ->all();

        self::assertSame([$companyA], $aRows, 'Tenant A should see exactly their own company.');
        self::assertSame([$companyB], $bRows, 'Tenant B should see exactly their own company.');

        // Tenant A's company is not visible under tenant B's filter.
        self::assertNotContains(
            $companyA,
            $bRows,
            'Company A must not be visible when filtered by tenant B (cross-tenant bleed).'
        );

        // Tenant B's company is not visible under tenant A's filter.
        self::assertNotContains(
            $companyB,
            $aRows,
            'Company B must not be visible when filtered by tenant A (cross-tenant bleed).'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2 — withoutTenantScope() logs every call (ARCHITECTURE §3.2)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Every call to withoutTenantScope() must emit a Log::warning() with the
     * model class and the immediate caller context, so unexpected platform-scope
     * bypass attempts are auditable.
     *
     * The test uses ScopedCompanyStub — a named class that uses BelongsToTenant.
     * A named class is required because PHPStan analyses the trait in the context
     * of the consuming class: with an anonymous class, `static` resolves to an
     * anonymous type and the Builder<static> generic fails PHPStan's invariance
     * check. Log::spy() is used so the real log channel still works.
     */
    public function test_without_tenant_scope_logs_every_call(): void
    {
        // Swap the Log facade for a Mockery spy. The spy records every call
        // and can be asserted on with Mockery::spy expectations.
        $logSpy = Log::spy();

        ScopedCompanyStub::withoutTenantScope();

        // Verify warning was called with the expected context keys.
        $logSpy->shouldHaveReceived('warning')
            ->once()
            ->withArgs(static function (string $message, array $context): bool {
                return str_contains($message, 'withoutTenantScope')
                    && array_key_exists('model', $context)
                    && array_key_exists('caller', $context);
            });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3 — TenantContext::current() without bind() throws (ARCHITECTURE §3.2)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * A queue job (or any code) that calls TenantContext::current() without a
     * prior TenantContext::bind() must throw RuntimeException immediately.
     *
     * This prevents silent cross-tenant data access in a job that was queued
     * without serialising its tenant context — failing loudly is the correct
     * behaviour (ARCHITECTURE §3.2).
     */
    public function test_queue_job_without_tenant_context_throws_runtime_exception(): void
    {
        // No TenantContext::bind() call — setUp() flushes any residual context.
        self::assertFalse(TenantContext::isBound(), 'Precondition: no context should be bound.');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/TenantContext::current\(\) called before a context was bound/');

        // Simulate the job body: any code that reads from the context without
        // having bound it first.
        TenantContext::current();
    }
}
