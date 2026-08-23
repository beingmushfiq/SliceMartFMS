<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 17 — Point of Sale (POS) schema contracts.
 *
 * Implements DATABASE_DESIGN.md §8 and §16.
 *
 * Tables:
 *   - pos_terminals
 *   - pos_sessions
 *   - pos_offline_queue
 */
class Wave17PosSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'pos_terminals',
        'pos_sessions',
        'pos_offline_queue',
    ];

    /** @test */
    public function test_all_wave_17_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 17 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_17_tables_have_tenant_id_immediately_after_id(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            self::assertSame(
                'id',
                $columns[0] ?? null,
                "Table {$table} must have 'id' as first column."
            );
            self::assertSame(
                'tenant_id',
                $columns[1] ?? null,
                "Table {$table} must have 'tenant_id' as second column."
            );
        }
    }

    /** @test */
    public function test_all_wave_17_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_17_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_112*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 17 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── pos_terminals ─────────────────────────────────────────────────────

    /** @test */
    public function test_pos_terminals_code_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $comp = $this->insertCompany($tid);
        $branch = $this->insertBranch($tid, $comp);

        $this->insertPosTerminal($tid, $branch, ['code' => 'TERM-01']);

        $this->assertInsertRejected(
            'pos_terminals',
            $this->posTerminalAttributes($tid, $branch, ['code' => 'TERM-01']),
            'Duplicate pos terminal code within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_pos_terminals_composite_fk_rejects_cross_tenant_branch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);

        $this->assertInsertRejected(
            'pos_terminals',
            $this->posTerminalAttributes($tid1, $branch2),
            'Cross-tenant branch_id on pos_terminals must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_pos_terminals_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $comp1 = $this->insertCompany($tid1);
        $branch1 = $this->insertBranch($tid1, $comp1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'pos_terminals',
            $this->posTerminalAttributes($tid1, $branch1, ['default_warehouse_id' => $wh2]),
            'Cross-tenant default_warehouse_id on pos_terminals must be rejected.',
            'foreign'
        );
    }

    // ─── pos_sessions ──────────────────────────────────────────────────────

    /** @test */
    public function test_pos_sessions_session_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $comp = $this->insertCompany($tid);
        $branch = $this->insertBranch($tid, $comp);
        $wh = $this->insertWarehouse($tid);
        $term = $this->insertPosTerminal($tid, $branch);
        $user = $this->insertUser($tid);

        $this->insertPosSession($tid, $branch, $wh, $term, $user, ['session_number' => 'SESS-2026-001']);

        $this->assertInsertRejected(
            'pos_sessions',
            $this->posSessionAttributes($tid, $branch, $wh, $term, $user, ['session_number' => 'SESS-2026-001']),
            'Duplicate session_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_pos_sessions_composite_fk_rejects_cross_tenant_branch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $comp1 = $this->insertCompany($tid1);
        $branch1 = $this->insertBranch($tid1, $comp1);
        $term1 = $this->insertPosTerminal($tid1, $branch1);
        $user = $this->insertUser($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);

        $this->assertInsertRejected(
            'pos_sessions',
            $this->posSessionAttributes($tid1, $branch2, $wh1, $term1, $user),
            'Cross-tenant branch_id on pos_sessions must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_pos_sessions_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $comp1 = $this->insertCompany($tid1);
        $branch1 = $this->insertBranch($tid1, $comp1);
        $term1 = $this->insertPosTerminal($tid1, $branch1);
        $user = $this->insertUser($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'pos_sessions',
            $this->posSessionAttributes($tid1, $branch1, $wh2, $term1, $user),
            'Cross-tenant warehouse_id on pos_sessions must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_pos_sessions_composite_fk_rejects_cross_tenant_terminal(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $comp1 = $this->insertCompany($tid1);
        $branch1 = $this->insertBranch($tid1, $comp1);
        $wh1 = $this->insertWarehouse($tid1);
        $user = $this->insertUser($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);
        $term2 = $this->insertPosTerminal($tid2, $branch2);

        $this->assertInsertRejected(
            'pos_sessions',
            $this->posSessionAttributes($tid1, $branch1, $wh1, $term2, $user),
            'Cross-tenant terminal_id on pos_sessions must be rejected.',
            'foreign'
        );
    }

    // ─── pos_offline_queue ─────────────────────────────────────────────────

    /** @test */
    public function test_pos_offline_queue_idempotency_key_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $comp = $this->insertCompany($tid);
        $branch = $this->insertBranch($tid, $comp);
        $term = $this->insertPosTerminal($tid, $branch);
        $user = $this->insertUser($tid);

        $this->insertPosOfflineQueue($tid, $term, $user, ['idempotency_key' => 'IDEMP-OFFLINE-001']);

        $this->assertInsertRejected(
            'pos_offline_queue',
            $this->posOfflineQueueAttributes($tid, $term, $user, ['idempotency_key' => 'IDEMP-OFFLINE-001']),
            'Duplicate idempotency_key in pos_offline_queue within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_pos_offline_queue_composite_fk_rejects_cross_tenant_terminal(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $user = $this->insertUser($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);
        $term2 = $this->insertPosTerminal($tid2, $branch2);

        $this->assertInsertRejected(
            'pos_offline_queue',
            $this->posOfflineQueueAttributes($tid1, $term2, $user),
            'Cross-tenant terminal_id on pos_offline_queue must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_pos_sessions_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $comp = $this->insertCompany($tid);
        $branch = $this->insertBranch($tid, $comp);
        $wh = $this->insertWarehouse($tid);
        $term = $this->insertPosTerminal($tid, $branch);
        $user = $this->insertUser($tid);

        $sessId = $this->insertPosSession($tid, $branch, $wh, $term, $user, [
            'opening_cash' => '150.2500',
            'expected_cash' => '1250.7500',
            'counted_cash' => '1250.0000',
            'cash_variance' => '-0.7500',
            'card_total' => '850.5000',
            'mobile_total' => '320.1000',
            'credit_total' => '0.0000',
            'sales_count' => 42,
            'refund_total' => '25.0000',
        ]);

        $row = DB::table('pos_sessions')->where('id', $sessId)->first();
        self::assertNotNull($row);

        self::assertSame(150.25, (float) $row->opening_cash);
        self::assertSame(1250.75, (float) $row->expected_cash);
        self::assertSame(1250.0, (float) $row->counted_cash);
        self::assertSame(-0.75, (float) $row->cash_variance);
        self::assertSame(850.5, (float) $row->card_total);
        self::assertSame(320.1, (float) $row->mobile_total);
        self::assertSame(42, (int) $row->sales_count);
        self::assertSame(25.0, (float) $row->refund_total);
    }
}
