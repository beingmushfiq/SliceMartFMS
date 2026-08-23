<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 14 — Purchasing schema contracts.
 *
 * Implements DATABASE_DESIGN.md §7 and §16.
 *
 * Tables:
 *   - purchase_requisitions
 *   - purchase_requisition_items
 *   - purchase_orders
 *   - purchase_order_items
 *   - goods_receipts
 *   - goods_receipt_items
 *   - purchase_bills
 *   - purchase_bill_items
 *   - purchase_returns
 *   - purchase_return_items
 */
class Wave14PurchasingSchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'purchase_requisitions',
        'purchase_requisition_items',
        'purchase_orders',
        'purchase_order_items',
        'goods_receipts',
        'goods_receipt_items',
        'purchase_bills',
        'purchase_bill_items',
        'purchase_returns',
        'purchase_return_items',
    ];

    /** @test */
    public function test_all_wave_14_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 14 migrations."
            );
        }
    }

    /** @test */
    public function test_all_wave_14_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_all_wave_14_tables_have_soft_deletes(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }
    }

    /** @test */
    public function test_no_wave_14_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_109*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 14 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── purchase_requisitions & items ─────────────────────────────────────

    /** @test */
    public function test_purchase_requisitions_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertPurchaseRequisition($tid, ['requisition_number' => 'REQ-2026-0001']);

        $this->assertInsertRejected(
            'purchase_requisitions',
            $this->purchaseRequisitionAttributes($tid, ['requisition_number' => 'REQ-2026-0001']),
            'Duplicate requisition_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_purchase_requisition_items_cascade_deletes_when_requisition_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $reqId = $this->insertPurchaseRequisition($tid);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertPurchaseRequisitionItem($tid, $reqId, $pid, $uid);

        self::assertNotNull(DB::table('purchase_requisition_items')->where('id', $itemId)->first());

        // Hard delete parent requisition
        DB::table('purchase_requisitions')->where('id', $reqId)->delete();

        self::assertNull(
            DB::table('purchase_requisition_items')->where('id', $itemId)->first(),
            'purchase_requisition_items row must cascade-delete with parent requisition.'
        );
    }

    /** @test */
    public function test_purchase_requisition_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $req1 = $this->insertPurchaseRequisition($tid1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'purchase_requisition_items',
            $this->purchaseRequisitionItemAttributes($tid1, $req1, $pid2, $uid1),
            'Cross-tenant product_id on purchase_requisition_items must be rejected.',
            'foreign'
        );
    }

    // ─── purchase_orders & items ───────────────────────────────────────────

    /** @test */
    public function test_purchase_orders_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);

        $this->insertPurchaseOrder($tid, $party, ['po_number' => 'PO-2026-0001']);

        $this->assertInsertRejected(
            'purchase_orders',
            $this->purchaseOrderAttributes($tid, $party, ['po_number' => 'PO-2026-0001']),
            'Duplicate po_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_purchase_orders_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'purchase_orders',
            $this->purchaseOrderAttributes($tid1, $party2),
            'Cross-tenant party_id on purchase_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_purchase_order_items_cascade_deletes_when_purchase_order_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $poId = $this->insertPurchaseOrder($tid, $party);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertPurchaseOrderItem($tid, $poId, $pid, $uid);

        self::assertNotNull(DB::table('purchase_order_items')->where('id', $itemId)->first());

        // Hard delete parent purchase order
        DB::table('purchase_orders')->where('id', $poId)->delete();

        self::assertNull(
            DB::table('purchase_order_items')->where('id', $itemId)->first(),
            'purchase_order_items row must cascade-delete with parent purchase order.'
        );
    }

    /** @test */
    public function test_purchase_order_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);
        $po1 = $this->insertPurchaseOrder($tid1, $party1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'purchase_order_items',
            $this->purchaseOrderItemAttributes($tid1, $po1, $pid2, $uid1),
            'Cross-tenant product_id on purchase_order_items must be rejected.',
            'foreign'
        );
    }

    // ─── goods_receipts & items ────────────────────────────────────────────

    /** @test */
    public function test_goods_receipts_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);

        $this->insertGoodsReceipt($tid, $party, $wh, ['grn_number' => 'GRN-2026-0001']);

        $this->assertInsertRejected(
            'goods_receipts',
            $this->goodsReceiptAttributes($tid, $party, $wh, ['grn_number' => 'GRN-2026-0001']),
            'Duplicate grn_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_goods_receipts_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'goods_receipts',
            $this->goodsReceiptAttributes($tid1, $party1, $wh2),
            'Cross-tenant warehouse_id on goods_receipts must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_goods_receipt_items_cascade_deletes_when_goods_receipt_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);
        $grnId = $this->insertGoodsReceipt($tid, $party, $wh);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertGoodsReceiptItem($tid, $grnId, $pid, $uid);

        self::assertNotNull(DB::table('goods_receipt_items')->where('id', $itemId)->first());

        // Hard delete parent goods receipt
        DB::table('goods_receipts')->where('id', $grnId)->delete();

        self::assertNull(
            DB::table('goods_receipt_items')->where('id', $itemId)->first(),
            'goods_receipt_items row must cascade-delete with parent goods receipt.'
        );
    }

    /** @test */
    public function test_goods_receipt_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);
        $wh1 = $this->insertWarehouse($tid1);
        $grn1 = $this->insertGoodsReceipt($tid1, $party1, $wh1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'goods_receipt_items',
            $this->goodsReceiptItemAttributes($tid1, $grn1, $pid2, $uid1),
            'Cross-tenant product_id on goods_receipt_items must be rejected.',
            'foreign'
        );
    }

    // ─── purchase_bills & items ────────────────────────────────────────────

    /** @test */
    public function test_purchase_bills_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);

        $this->insertPurchaseBill($tid, $party, ['bill_number' => 'BILL-2026-0001']);

        $this->assertInsertRejected(
            'purchase_bills',
            $this->purchaseBillAttributes($tid, $party, ['bill_number' => 'BILL-2026-0001']),
            'Duplicate bill_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_purchase_bills_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'purchase_bills',
            $this->purchaseBillAttributes($tid1, $party2),
            'Cross-tenant party_id on purchase_bills must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_purchase_bill_items_cascade_deletes_when_purchase_bill_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $billId = $this->insertPurchaseBill($tid, $party);

        $itemId = $this->insertPurchaseBillItem($tid, $billId);

        self::assertNotNull(DB::table('purchase_bill_items')->where('id', $itemId)->first());

        // Hard delete parent purchase bill
        DB::table('purchase_bills')->where('id', $billId)->delete();

        self::assertNull(
            DB::table('purchase_bill_items')->where('id', $itemId)->first(),
            'purchase_bill_items row must cascade-delete with parent purchase bill.'
        );
    }

    // ─── purchase_returns & items ──────────────────────────────────────────

    /** @test */
    public function test_purchase_returns_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'purchase_return']);

        $this->insertPurchaseReturn($tid, $party, $wh, $rc, ['return_number' => 'PRTN-2026-0001']);

        $this->assertInsertRejected(
            'purchase_returns',
            $this->purchaseReturnAttributes($tid, $party, $wh, $rc, ['return_number' => 'PRTN-2026-0001']),
            'Duplicate return_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_purchase_returns_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'purchase_return']);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'purchase_returns',
            $this->purchaseReturnAttributes($tid1, $party1, $wh2, $rc1),
            'Cross-tenant warehouse_id on purchase_returns must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_purchase_returns_composite_fk_rejects_cross_tenant_reason_code(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);
        $wh1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $rc2 = $this->insertReasonCode($tid2, ['context' => 'purchase_return']);

        $this->assertInsertRejected(
            'purchase_returns',
            $this->purchaseReturnAttributes($tid1, $party1, $wh1, $rc2),
            'Cross-tenant reason_code_id on purchase_returns must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_purchase_return_items_cascade_deletes_when_purchase_return_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'purchase_return']);
        $retId = $this->insertPurchaseReturn($tid, $party, $wh, $rc);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $itemId = $this->insertPurchaseReturnItem($tid, $retId, $pid, $uid);

        self::assertNotNull(DB::table('purchase_return_items')->where('id', $itemId)->first());

        // Hard delete parent purchase return
        DB::table('purchase_returns')->where('id', $retId)->delete();

        self::assertNull(
            DB::table('purchase_return_items')->where('id', $itemId)->first(),
            'purchase_return_items row must cascade-delete with parent purchase return.'
        );
    }

    /** @test */
    public function test_purchase_return_items_composite_fk_rejects_cross_tenant_product(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $party1 = $this->insertParty($tid1);
        $wh1 = $this->insertWarehouse($tid1);
        $rc1 = $this->insertReasonCode($tid1, ['context' => 'purchase_return']);
        $ret1 = $this->insertPurchaseReturn($tid1, $party1, $wh1, $rc1);
        $uid1 = $this->insertUnit($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $uid2 = $this->insertUnit($tid2);
        $pid2 = $this->insertProduct($tid2, $uid2);

        $this->assertInsertRejected(
            'purchase_return_items',
            $this->purchaseReturnItemAttributes($tid1, $ret1, $pid2, $uid1),
            'Cross-tenant product_id on purchase_return_items must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_purchasing_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $party = $this->insertParty($tid);
        $wh = $this->insertWarehouse($tid);
        $rc = $this->insertReasonCode($tid, ['context' => 'purchase_return']);
        $uid = $this->insertUnit($tid);
        $pid = $this->insertProduct($tid, $uid);

        $po = $this->insertPurchaseOrder($tid, $party, [
            'subtotal' => '1234.5678',
            'tax_amount' => '123.4567',
            'total_amount' => '1358.0245',
        ]);
        $poItem = $this->insertPurchaseOrderItem($tid, $po, $pid, $uid, [
            'quantity' => '100.1234',
            'unit_price' => '12.3456',
            'discount_percentage' => '5.5000',
            'discount_amount' => '67.8912',
            'tax_amount' => '61.7280',
            'line_total' => '1230.3644',
        ]);

        $grn = $this->insertGoodsReceipt($tid, $party, $wh);
        $grnItem = $this->insertGoodsReceiptItem($tid, $grn, $pid, $uid, [
            'ordered_quantity' => '100.1234',
            'received_quantity' => '98.1234',
            'accepted_quantity' => '95.1234',
            'rejected_quantity' => '3.0000',
            'unit_cost' => '12.3456',
        ]);

        $bill = $this->insertPurchaseBill($tid, $party, [
            'subtotal' => '1234.5678',
            'total_amount' => '1358.0245',
            'paid_amount' => '500.0000',
        ]);
        $billItem = $this->insertPurchaseBillItem($tid, $bill, [
            'quantity' => '10.1234',
            'unit_price' => '123.4567',
            'tax_amount' => '61.7280',
            'line_total' => '1311.5301',
        ]);

        $ret = $this->insertPurchaseReturn($tid, $party, $wh, $rc, [
            'subtotal' => '37.0368',
            'tax_amount' => '1.8518',
            'total_amount' => '38.8886',
        ]);
        $retItem = $this->insertPurchaseReturnItem($tid, $ret, $pid, $uid, [
            'quantity' => '3.0000',
            'unit_cost' => '12.3456',
            'line_total' => '37.0368',
        ]);

        $poRow = DB::table('purchase_orders')->where('id', $po)->first();
        $poItemRow = DB::table('purchase_order_items')->where('id', $poItem)->first();
        $grnItemRow = DB::table('goods_receipt_items')->where('id', $grnItem)->first();
        $billRow = DB::table('purchase_bills')->where('id', $bill)->first();
        $billItemRow = DB::table('purchase_bill_items')->where('id', $billItem)->first();
        $retRow = DB::table('purchase_returns')->where('id', $ret)->first();
        $retItemRow = DB::table('purchase_return_items')->where('id', $retItem)->first();

        self::assertNotNull($poRow);
        self::assertNotNull($poItemRow);
        self::assertNotNull($grnItemRow);
        self::assertNotNull($billRow);
        self::assertNotNull($billItemRow);
        self::assertNotNull($retRow);
        self::assertNotNull($retItemRow);

        self::assertSame(1234.5678, (float) $poRow->subtotal);
        self::assertSame(100.1234, (float) $poItemRow->quantity);
        self::assertSame(12.3456, (float) $poItemRow->unit_price);
        self::assertSame(5.5, (float) $poItemRow->discount_percentage);

        self::assertSame(98.1234, (float) $grnItemRow->received_quantity);
        self::assertSame(95.1234, (float) $grnItemRow->accepted_quantity);
        self::assertSame(3.0, (float) $grnItemRow->rejected_quantity);

        self::assertSame(1234.5678, (float) $billRow->subtotal);
        self::assertSame(10.1234, (float) $billItemRow->quantity);

        self::assertSame(37.0368, (float) $retRow->subtotal);
        self::assertSame(3.0, (float) $retItemRow->quantity);
    }
}
