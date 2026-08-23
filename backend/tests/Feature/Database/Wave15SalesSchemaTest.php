<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 15 — Sales & Invoicing schema contracts.
 *
 * Implements DATABASE_DESIGN.md §8 and §16.
 *
 * Tables:
 *   - crm_leads
 *   - crm_activities
 *   - sales_orders
 *   - sales_order_items
 *   - invoice_templates
 *   - invoices
 *   - invoice_items
 *   - sales_returns
 *   - sales_return_items
 */
class Wave15SalesSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'crm_leads',
        'crm_activities',
        'sales_orders',
        'sales_order_items',
        'invoice_templates',
        'invoices',
        'invoice_items',
        'sales_returns',
        'sales_return_items',
    ];

    /** @test */
    public function test_all_wave_15_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 15 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_15_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_all_wave_15_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_15_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_110*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 15 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── crm_leads & activities ────────────────────────────────────────────

    /** @test */
    public function test_crm_leads_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertCrmLead($tid, ['lead_number' => 'LEAD-2026-0001']);

        $this->assertInsertRejected(
            'crm_leads',
            $this->crmLeadAttributes($tid, ['lead_number' => 'LEAD-2026-0001']),
            'Duplicate lead_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_crm_leads_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'crm_leads',
            $this->crmLeadAttributes($tid1, ['converted_party_id' => $party2]),
            'Cross-tenant converted_party_id on crm_leads must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_crm_leads_composite_fk_rejects_cross_tenant_lost_reason(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'cancellation']);

        $this->assertInsertRejected(
            'crm_leads',
            $this->crmLeadAttributes($tid1, ['lost_reason_id' => $rc2]),
            'Cross-tenant lost_reason_id on crm_leads must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_crm_activities_inserts_cleanly(): void
    {
        $tid = $this->insertTenantWithPlan();
        $lead = $this->insertCrmLead($tid);

        $actId = $this->insertCrmActivity($tid, 'lead', $lead, [
            'type' => 'call',
            'title' => 'Initial pitch call',
        ]);

        $row = DB::table('crm_activities')->where('id', $actId)->first();
        self::assertNotNull($row);
        self::assertSame('call', $row->type);
        self::assertSame('lead', $row->subject_type);
        self::assertSame($lead, (int) $row->subject_id);
    }

    // ─── sales_orders & items ──────────────────────────────────────────────

    /** @test */
    public function test_sales_orders_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertSalesOrder($tid, ['order_number' => 'SO-2026-0001']);

        $this->assertInsertRejected(
            'sales_orders',
            $this->salesOrderAttributes($tid, ['order_number' => 'SO-2026-0001']),
            'Duplicate order_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_sales_orders_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'sales_orders',
            $this->salesOrderAttributes($tid1, ['party_id' => $party2]),
            'Cross-tenant party_id on sales_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_orders_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'sales_orders',
            $this->salesOrderAttributes($tid1, ['warehouse_id' => $wh2]),
            'Cross-tenant warehouse_id on sales_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_orders_composite_fk_rejects_cross_tenant_price_list(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $pl2 = $this->insertPriceList($tid2);

        $this->assertInsertRejected(
            'sales_orders',
            $this->salesOrderAttributes($tid1, ['price_list_id' => $pl2]),
            'Cross-tenant price_list_id on sales_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_order_items_cascade_deletes_when_sales_order_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $soId = $this->insertSalesOrder($tid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertSalesOrderItem($tid, $soId, $pid, $uid);

        self::assertNotNull(DB::table('sales_order_items')->where('id', $itemId)->first());

        // Hard delete parent sales order
        DB::table('sales_orders')->where('id', $soId)->delete();

        self::assertNull(
            DB::table('sales_order_items')->where('id', $itemId)->first(),
            'sales_order_items row must cascade-delete with parent sales order.'
        );
    }

    /** @test */
    public function test_sales_order_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $so1 = $this->insertSalesOrder($tid1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'sales_order_items',
            $this->salesOrderItemAttributes($tid1, $so1, $pid2, $uid1),
            'Cross-tenant product_id on sales_order_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_order_items_composite_fk_rejects_cross_tenant_tax_profile(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $so1 = $this->insertSalesOrder($tid1);
        $uid1 = $this->insertUnit($tid1);
        $pid1 = $this->insertProduct($tid1, $uid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $tax2 = $this->insertTaxProfile($tid2);

        $this->assertInsertRejected(
            'sales_order_items',
            $this->salesOrderItemAttributes($tid1, $so1, $pid1, $uid1, ['tax_profile_id' => $tax2]),
            'Cross-tenant tax_profile_id on sales_order_items must be rejected.',
            'foreign'
        );
    }

    // ─── invoice_templates ─────────────────────────────────────────────────

    /** @test */
    public function test_invoice_templates_type_name_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertInvoiceTemplate($tid, ['type' => 'invoice', 'name' => 'Standard A4']);

        $this->assertInsertRejected(
            'invoice_templates',
            $this->invoiceTemplateAttributes($tid, ['type' => 'invoice', 'name' => 'Standard A4']),
            'Duplicate type + name within the same tenant must be rejected.',
            'unique'
        );
    }

    // ─── invoices & items ──────────────────────────────────────────────────

    /** @test */
    public function test_invoices_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertInvoice($tid, ['invoice_number' => 'INV-2026-0001']);

        $this->assertInsertRejected(
            'invoices',
            $this->invoiceAttributes($tid, ['invoice_number' => 'INV-2026-0001']),
            'Duplicate invoice_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_invoices_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'invoices',
            $this->invoiceAttributes($tid1, ['party_id' => $party2]),
            'Cross-tenant party_id on invoices must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_invoices_composite_fk_rejects_cross_tenant_sales_order(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $so2 = $this->insertSalesOrder($tid2);

        $this->assertInsertRejected(
            'invoices',
            $this->invoiceAttributes($tid1, ['sales_order_id' => $so2]),
            'Cross-tenant sales_order_id on invoices must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_invoice_items_cascade_deletes_when_invoice_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $invId = $this->insertInvoice($tid);

        $itemId = $this->insertInvoiceItem($tid, $invId);

        self::assertNotNull(DB::table('invoice_items')->where('id', $itemId)->first());

        // Hard delete parent invoice
        DB::table('invoices')->where('id', $invId)->delete();

        self::assertNull(
            DB::table('invoice_items')->where('id', $itemId)->first(),
            'invoice_items row must cascade-delete with parent invoice.'
        );
    }

    /** @test */
    public function test_invoice_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $inv1 = $this->insertInvoice($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'invoice_items',
            $this->invoiceItemAttributes($tid1, $inv1, ['product_id' => $pid2, 'unit_id' => $uid2]),
            'Cross-tenant product_id on invoice_items must be rejected.',
            'foreign'
        );
    }

    // ─── sales_returns & items ─────────────────────────────────────────────

    /** @test */
    public function test_sales_returns_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'sales_return']);

        $this->insertSalesReturn($tid, $wh, $rc, ['return_number' => 'SRTN-2026-0001']);

        $this->assertInsertRejected(
            'sales_returns',
            $this->salesReturnAttributes($tid, $wh, $rc, ['return_number' => 'SRTN-2026-0001']),
            'Duplicate return_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_sales_returns_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'sales_return']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'sales_returns',
            $this->salesReturnAttributes($tid1, $wh2, $rc1),
            'Cross-tenant warehouse_id on sales_returns must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_returns_composite_fk_rejects_cross_tenant_reason_code(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'sales_return']);

        $this->assertInsertRejected(
            'sales_returns',
            $this->salesReturnAttributes($tid1, $wh1, $rc2),
            'Cross-tenant reason_code_id on sales_returns must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_return_items_cascade_deletes_when_sales_return_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'sales_return']);
        $retId = $this->insertSalesReturn($tid, $wh, $rc);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertSalesReturnItem($tid, $retId, $pid, $uid);

        self::assertNotNull(DB::table('sales_return_items')->where('id', $itemId)->first());

        // Hard delete parent sales return
        DB::table('sales_returns')->where('id', $retId)->delete();

        self::assertNull(
            DB::table('sales_return_items')->where('id', $itemId)->first(),
            'sales_return_items row must cascade-delete with parent sales return.'
        );
    }

    /** @test */
    public function test_sales_return_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'sales_return']);
        $ret1 = $this->insertSalesReturn($tid1, $wh1, $rc1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'sales_return_items',
            $this->salesReturnItemAttributes($tid1, $ret1, $pid2, $uid1),
            'Cross-tenant product_id on sales_return_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_sales_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'sales_return']);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $lead = $this->insertCrmLead($tid, [
            'expected_value' => '9999.8765',
        ]);

        $so = $this->insertSalesOrder($tid, [
            'party_id' => $party,
            'subtotal' => '2345.6789',
            'tax_amount' => '234.5678',
            'shipping_amount' => '50.1234',
            'round_off' => '-0.0001',
            'total_amount' => '2630.3700',
            'paid_amount' => '1000.0000',
            'due_amount' => '1630.3700',
        ]);
        $soItem = $this->insertSalesOrderItem($tid, $so, $pid, $uid, [
            'quantity' => '50.1234',
            'unit_price' => '46.8000',
            'discount_percentage' => '10.5000',
            'discount_amount' => '246.3064',
            'tax_amount' => '210.0000',
            'line_total' => '2309.4735',
            'delivered_quantity' => '25.0000',
        ]);

        $inv = $this->insertInvoice($tid, [
            'sales_order_id' => $so,
            'party_id' => $party,
            'subtotal' => '2345.6789',
            'total_amount' => '2630.3700',
            'paid_amount' => '1000.0000',
        ]);
        $invItem = $this->insertInvoiceItem($tid, $inv, [
            'sales_order_item_id' => $soItem,
            'product_id' => $pid,
            'quantity' => '25.0000',
            'unit_id' => $uid,
            'unit_price' => '46.8000',
            'line_total' => '1170.0000',
        ]);

        $ret = $this->insertSalesReturn($tid, $wh, $rc, [
            'invoice_id' => $inv,
            'sales_order_id' => $so,
            'party_id' => $party,
            'subtotal' => '93.6000',
            'tax_amount' => '9.3600',
            'total_amount' => '102.9600',
        ]);
        $retItem = $this->insertSalesReturnItem($tid, $ret, $pid, $uid, [
            'invoice_item_id' => $invItem,
            'quantity' => '2.0000',
            'unit_price' => '46.8000',
            'line_total' => '93.6000',
        ]);

        $leadRow = DB::table('crm_leads')->where('id', $lead)->first();
        $soRow = DB::table('sales_orders')->where('id', $so)->first();
        $soItemRow = DB::table('sales_order_items')->where('id', $soItem)->first();
        $invRow = DB::table('invoices')->where('id', $inv)->first();
        $invItemRow = DB::table('invoice_items')->where('id', $invItem)->first();
        $retRow = DB::table('sales_returns')->where('id', $ret)->first();
        $retItemRow = DB::table('sales_return_items')->where('id', $retItem)->first();

        self::assertNotNull($leadRow);
        self::assertNotNull($soRow);
        self::assertNotNull($soItemRow);
        self::assertNotNull($invRow);
        self::assertNotNull($invItemRow);
        self::assertNotNull($retRow);
        self::assertNotNull($retItemRow);

        self::assertSame(9999.8765, (float) $leadRow->expected_value);
        self::assertSame(2345.6789, (float) $soRow->subtotal);
        self::assertSame(50.1234, (float) $soItemRow->quantity);
        self::assertSame(10.5, (float) $soItemRow->discount_percentage);

        self::assertSame(2345.6789, (float) $invRow->subtotal);
        self::assertSame(25.0, (float) $invItemRow->quantity);

        self::assertSame(93.6, (float) $retRow->subtotal);
        self::assertSame(2.0, (float) $retItemRow->quantity);
    }
}
