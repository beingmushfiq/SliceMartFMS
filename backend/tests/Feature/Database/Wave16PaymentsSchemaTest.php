<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 16 — Payments & Collections schema contracts.
 *
 * Implements DATABASE_DESIGN.md §8 and §16.
 *
 * Tables:
 *   - payments
 *   - payment_allocations
 *   - sales_order_payments
 */
class Wave16PaymentsSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'payments',
        'payment_allocations',
        'sales_order_payments',
    ];

    /** @test */
    public function test_all_wave_16_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 16 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_16_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_all_wave_16_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_16_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_111*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 16 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── payments ──────────────────────────────────────────────────────────

    /** @test */
    public function test_payments_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertPayment($tid, ['payment_number' => 'PAY-2026-0001']);

        $this->assertInsertRejected(
            'payments',
            $this->paymentAttributes($tid, ['payment_number' => 'PAY-2026-0001']),
            'Duplicate payment_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_payments_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'payments',
            $this->paymentAttributes($tid1, ['party_id' => $party2]),
            'Cross-tenant party_id on payments must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_payments_composite_fk_rejects_cross_tenant_company(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);

        $this->assertInsertRejected(
            'payments',
            $this->paymentAttributes($tid1, ['company_id' => $comp2]),
            'Cross-tenant company_id on payments must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_payments_composite_fk_rejects_cross_tenant_branch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $comp1 = $this->insertCompany($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);

        $this->assertInsertRejected(
            'payments',
            $this->paymentAttributes($tid1, ['company_id' => $comp1, 'branch_id' => $branch2]),
            'Cross-tenant branch_id on payments must be rejected.',
            'foreign'
        );
    }

    // ─── payment_allocations ───────────────────────────────────────────────

    /** @test */
    public function test_payment_allocations_cascade_deletes_when_payment_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $payId = $this->insertPayment($tid);
        $invId = $this->insertInvoice($tid);

        $allocId = $this->insertPaymentAllocation($tid, $payId, 'invoice', $invId, ['amount' => '150.0000']);

        self::assertNotNull(DB::table('payment_allocations')->where('id', $allocId)->first());

        // Hard delete parent payment
        DB::table('payments')->where('id', $payId)->delete();

        self::assertNull(
            DB::table('payment_allocations')->where('id', $allocId)->first(),
            'payment_allocations row must cascade-delete with parent payment.'
        );
    }

    /** @test */
    public function test_payment_allocations_inserts_cleanly(): void
    {
        $tid = $this->insertTenantWithPlan();
        $payId = $this->insertPayment($tid, ['amount' => '500.0000']);
        $invId = $this->insertInvoice($tid, ['total_amount' => '300.0000']);

        $allocId = $this->insertPaymentAllocation($tid, $payId, 'invoice', $invId, ['amount' => '300.0000']);

        $row = DB::table('payment_allocations')->where('id', $allocId)->first();
        self::assertNotNull($row);
        self::assertSame('invoice', $row->allocatable_type);
        self::assertSame($invId, (int) $row->allocatable_id);
        self::assertSame(300.0, (float) $row->amount);
    }

    // ─── sales_order_payments ──────────────────────────────────────────────

    /** @test */
    public function test_sales_order_payments_cascade_deletes_when_sales_order_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $soId = $this->insertSalesOrder($tid);

        $sopId = $this->insertSalesOrderPayment($tid, $soId, [
            'method' => 'cash',
            'amount' => '210.0000',
        ]);

        self::assertNotNull(DB::table('sales_order_payments')->where('id', $sopId)->first());

        // Hard delete parent sales order
        DB::table('sales_orders')->where('id', $soId)->delete();

        self::assertNull(
            DB::table('sales_order_payments')->where('id', $sopId)->first(),
            'sales_order_payments row must cascade-delete with parent sales order.'
        );
    }

    /** @test */
    public function test_sales_order_payments_composite_fk_rejects_cross_tenant_payment(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $so1 = $this->insertSalesOrder($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $pay2 = $this->insertPayment($tid2);

        $this->assertInsertRejected(
            'sales_order_payments',
            $this->salesOrderPaymentAttributes($tid1, $so1, ['payment_id' => $pay2]),
            'Cross-tenant payment_id on sales_order_payments must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_payments_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $so = $this->insertSalesOrder($tid);
        $inv = $this->insertInvoice($tid);

        $pay = $this->insertPayment($tid, [
            'party_id' => $party,
            'amount' => '1234.5678',
            'allocated_amount' => '1000.1234',
            'unallocated_amount' => '234.4444',
        ]);

        $alloc = $this->insertPaymentAllocation($tid, $pay, 'invoice', $inv, [
            'amount' => '1000.1234',
        ]);

        $sop = $this->insertSalesOrderPayment($tid, $so, [
            'payment_id' => $pay,
            'amount' => '1000.1234',
            'change_given' => '15.5000',
        ]);

        $payRow = DB::table('payments')->where('id', $pay)->first();
        $allocRow = DB::table('payment_allocations')->where('id', $alloc)->first();
        $sopRow = DB::table('sales_order_payments')->where('id', $sop)->first();

        self::assertNotNull($payRow);
        self::assertNotNull($allocRow);
        self::assertNotNull($sopRow);

        self::assertSame(1234.5678, (float) $payRow->amount);
        self::assertSame(1000.1234, (float) $payRow->allocated_amount);
        self::assertSame(234.4444, (float) $payRow->unallocated_amount);

        self::assertSame(1000.1234, (float) $allocRow->amount);

        self::assertSame(1000.1234, (float) $sopRow->amount);
        self::assertSame(15.5, (float) $sopRow->change_given);
    }
}
