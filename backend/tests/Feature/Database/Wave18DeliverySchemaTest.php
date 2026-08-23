<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 18 — Delivery & Logistics schema contracts.
 *
 * Implements DATABASE_DESIGN.md §9 and §16.
 *
 * Tables:
 *   - courier_providers
 *   - run_sheets
 *   - delivery_orders
 *   - delivery_order_items
 *   - delivery_status_events
 *   - courier_shipments
 *   - courier_webhook_events
 *   - cod_reconciliations
 */
class Wave18DeliverySchemaTest extends SchemaTestCase
{
    private const TABLES = [
        'courier_providers',
        'run_sheets',
        'delivery_orders',
        'delivery_order_items',
        'delivery_status_events',
        'courier_shipments',
        'courier_webhook_events',
        'cod_reconciliations',
    ];

    /** @test */
    public function test_all_wave_18_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            self::assertTrue(
                Schema::hasTable($table),
                "Expected table {$table} to exist after Wave 18 migrations."
            );
        }
    }

    /** @test */
    public function test_wave_18_tables_have_tenant_id_immediately_after_id(): void
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
    public function test_wave_18_tables_have_soft_deletes_where_required(): void
    {
        $softDeleteTables = [
            'courier_providers',
            'run_sheets',
            'delivery_orders',
            'delivery_order_items',
            'courier_shipments',
            'cod_reconciliations',
        ];

        foreach ($softDeleteTables as $table) {
            self::assertTrue(
                Schema::hasColumn($table, 'deleted_at'),
                "Table {$table} must support soft deletes."
            );
        }

        // delivery_status_events is append-only timeline (never deleted/updated)
        self::assertFalse(
            Schema::hasColumn('delivery_status_events', 'deleted_at'),
            'delivery_status_events must not have deleted_at column.'
        );

        // courier_webhook_events is raw incoming event buffer
        self::assertFalse(
            Schema::hasColumn('courier_webhook_events', 'deleted_at'),
            'courier_webhook_events must not have deleted_at column.'
        );
    }

    /** @test */
    public function test_no_wave_18_migration_contains_float_double_or_enum(): void
    {
        $files = glob(database_path('migrations/2026_08_24_113*'));
        self::assertIsArray($files);
        self::assertNotEmpty($files, 'Wave 18 migrations must exist.');

        foreach ($files as $file) {
            $content = file_get_contents($file);
            self::assertIsString($content);

            self::assertStringNotContainsString('->float(', $content, "Forbidden float in {$file}");
            self::assertStringNotContainsString('->double(', $content, "Forbidden double in {$file}");
            self::assertStringNotContainsString('->enum(', $content, "Forbidden enum in {$file}");
        }
    }

    // ─── courier_providers ─────────────────────────────────────────────────

    /** @test */
    public function test_courier_providers_code_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertCourierProvider($tid, ['code' => 'pathao']);

        $this->assertInsertRejected(
            'courier_providers',
            $this->courierProviderAttributes($tid, ['code' => 'pathao']),
            'Duplicate provider code within the same tenant must be rejected.',
            'unique'
        );
    }

    // ─── run_sheets ────────────────────────────────────────────────────────

    /** @test */
    public function test_run_sheets_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $comp = $this->insertCompany($tid);
        $branch = $this->insertBranch($tid, $comp);

        $this->insertRunSheet($tid, $branch, ['run_sheet_number' => 'RS-2026-001']);

        $this->assertInsertRejected(
            'run_sheets',
            $this->runSheetAttributes($tid, $branch, ['run_sheet_number' => 'RS-2026-001']),
            'Duplicate run_sheet_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_run_sheets_composite_fk_rejects_cross_tenant_branch(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');

        $tid2 = $this->insertTenantWithPlan('t2');
        $comp2 = $this->insertCompany($tid2);
        $branch2 = $this->insertBranch($tid2, $comp2);

        $this->assertInsertRejected(
            'run_sheets',
            $this->runSheetAttributes($tid1, $branch2),
            'Cross-tenant branch_id on run_sheets must be rejected.',
            'foreign'
        );
    }

    // ─── delivery_orders ───────────────────────────────────────────────────

    /** @test */
    public function test_delivery_orders_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);

        $this->insertDeliveryOrder($tid, $so, $wh, ['delivery_number' => 'DO-2026-001']);

        $this->assertInsertRejected(
            'delivery_orders',
            $this->deliveryOrderAttributes($tid, $so, $wh, ['delivery_number' => 'DO-2026-001']),
            'Duplicate delivery_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_delivery_orders_composite_fk_rejects_cross_tenant_sales_order(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $so2 = $this->insertSalesOrder($tid2);

        $this->assertInsertRejected(
            'delivery_orders',
            $this->deliveryOrderAttributes($tid1, $so2, $wh1),
            'Cross-tenant sales_order_id on delivery_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_delivery_orders_composite_fk_rejects_cross_tenant_warehouse(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $so1 = $this->insertSalesOrder($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $wh2 = $this->insertWarehouse($tid2);

        $this->assertInsertRejected(
            'delivery_orders',
            $this->deliveryOrderAttributes($tid1, $so1, $wh2),
            'Cross-tenant warehouse_id on delivery_orders must be rejected.',
            'foreign'
        );
    }

    /** @test */
    public function test_delivery_orders_composite_fk_rejects_cross_tenant_party(): void
    {
        $tid1 = $this->insertTenantWithPlan('t1');
        $wh1 = $this->insertWarehouse($tid1);
        $so1 = $this->insertSalesOrder($tid1);

        $tid2 = $this->insertTenantWithPlan('t2');
        $party2 = $this->insertParty($tid2);

        $this->assertInsertRejected(
            'delivery_orders',
            $this->deliveryOrderAttributes($tid1, $so1, $wh1, ['party_id' => $party2]),
            'Cross-tenant party_id on delivery_orders must be rejected.',
            'foreign'
        );
    }

    // ─── delivery_order_items ──────────────────────────────────────────────

    /** @test */
    public function test_delivery_order_items_cascade_deletes_when_delivery_order_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);
        $unit = $this->insertUnit($tid);
        $prod = $this->insertProduct($tid, $unit);

        $doId = $this->insertDeliveryOrder($tid, $so, $wh);
        $doiId = $this->insertDeliveryOrderItem($tid, $doId, $prod, $unit, ['quantity' => '10.0000']);

        self::assertNotNull(DB::table('delivery_order_items')->where('id', $doiId)->first());

        // Hard delete parent delivery order
        DB::table('delivery_orders')->where('id', $doId)->delete();

        self::assertNull(
            DB::table('delivery_order_items')->where('id', $doiId)->first(),
            'delivery_order_items row must cascade-delete with parent delivery order.'
        );
    }

    // ─── delivery_status_events ────────────────────────────────────────────

    /** @test */
    public function test_delivery_status_events_cascade_deletes_when_delivery_order_deleted(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);

        $doId = $this->insertDeliveryOrder($tid, $so, $wh);
        $evtId = $this->insertDeliveryStatusEvent($tid, $doId, 'picked_up');

        self::assertNotNull(DB::table('delivery_status_events')->where('id', $evtId)->first());

        // Hard delete parent delivery order
        DB::table('delivery_orders')->where('id', $doId)->delete();

        self::assertNull(
            DB::table('delivery_status_events')->where('id', $evtId)->first(),
            'delivery_status_events row must cascade-delete with parent delivery order.'
        );
    }

    /** @test */
    public function test_delivery_status_events_webhook_idempotency_guard(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);

        $doId = $this->insertDeliveryOrder($tid, $so, $wh);

        $this->insertDeliveryStatusEvent($tid, $doId, 'in_transit', [
            'courier_event_id' => 'PATHAO-EVT-999',
        ]);

        $this->assertInsertRejected(
            'delivery_status_events',
            $this->deliveryStatusEventAttributes($tid, $doId, 'in_transit', [
                'courier_event_id' => 'PATHAO-EVT-999',
            ]),
            'Duplicate courier_event_id for the same delivery order must be rejected by idempotency guard (ADR-017).',
            'unique'
        );
    }

    // ─── courier_shipments ─────────────────────────────────────────────────

    /** @test */
    public function test_courier_shipments_unique_consignment_per_tenant_provider(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);
        $prov = $this->insertCourierProvider($tid);

        $do1 = $this->insertDeliveryOrder($tid, $so, $wh);
        $do2 = $this->insertDeliveryOrder($tid, $so, $wh);

        $this->insertCourierShipment($tid, $do1, $prov, ['consignment_id' => 'CONS-12345']);

        $this->assertInsertRejected(
            'courier_shipments',
            $this->courierShipmentAttributes($tid, $do2, $prov, ['consignment_id' => 'CONS-12345']),
            'Duplicate consignment_id for the same courier provider within a tenant must be rejected.',
            'unique'
        );
    }

    // ─── courier_webhook_events ────────────────────────────────────────────

    /** @test */
    public function test_courier_webhook_events_unique_event_per_provider(): void
    {
        $prov = $this->insertCourierProvider();

        $this->insertCourierWebhookEvent($prov, ['provider_event_id' => 'WH-EVT-001']);

        $this->assertInsertRejected(
            'courier_webhook_events',
            $this->courierWebhookEventAttributes($prov, ['provider_event_id' => 'WH-EVT-001']),
            'Duplicate provider_event_id for the same courier provider must be rejected.',
            'unique'
        );
    }

    // ─── cod_reconciliations ───────────────────────────────────────────────

    /** @test */
    public function test_cod_reconciliations_number_unique_per_tenant(): void
    {
        $tid = $this->insertTenantWithPlan();

        $this->insertCodReconciliation($tid, 'courier_provider', 1, [
            'reconciliation_number' => 'RECON-2026-01',
        ]);

        $this->assertInsertRejected(
            'cod_reconciliations',
            $this->codReconciliationAttributes($tid, 'courier_provider', 1, [
                'reconciliation_number' => 'RECON-2026-01',
            ]),
            'Duplicate reconciliation_number within the same tenant must be rejected.',
            'unique'
        );
    }

    /** @test */
    public function test_delivery_orders_and_shipments_decimal_precision_round_trip(): void
    {
        $tid = $this->insertTenantWithPlan();
        $wh = $this->insertWarehouse($tid);
        $so = $this->insertSalesOrder($tid);
        $prov = $this->insertCourierProvider($tid);
        $unit = $this->insertUnit($tid);
        $prod = $this->insertProduct($tid, $unit);

        $doId = $this->insertDeliveryOrder($tid, $so, $wh, [
            'cod_amount' => '1500.7500',
            'cod_collected_amount' => '1500.7500',
            'delivery_charge' => '120.5000',
            'weight' => '3.4500',
        ]);

        $doiId = $this->insertDeliveryOrderItem($tid, $doId, $prod, $unit, [
            'quantity' => '12.5000',
            'delivered_quantity' => '10.0000',
            'returned_quantity' => '2.5000',
        ]);

        $shipId = $this->insertCourierShipment($tid, $doId, $prov, [
            'charge_amount' => '120.5000',
            'cod_amount' => '1500.7500',
        ]);

        $reconId = $this->insertCodReconciliation($tid, 'courier_provider', $prov, [
            'expected_amount' => '1500.7500',
            'received_amount' => '1450.7500',
            'variance_amount' => '-50.0000',
        ]);

        $doRow = DB::table('delivery_orders')->where('id', $doId)->first();
        $doiRow = DB::table('delivery_order_items')->where('id', $doiId)->first();
        $shipRow = DB::table('courier_shipments')->where('id', $shipId)->first();
        $reconRow = DB::table('cod_reconciliations')->where('id', $reconId)->first();

        self::assertNotNull($doRow);
        self::assertNotNull($doiRow);
        self::assertNotNull($shipRow);
        self::assertNotNull($reconRow);

        self::assertSame(1500.75, (float) $doRow->cod_amount);
        self::assertSame(1500.75, (float) $doRow->cod_collected_amount);
        self::assertSame(120.5, (float) $doRow->delivery_charge);
        self::assertSame(3.45, (float) $doRow->weight);

        self::assertSame(12.5, (float) $doiRow->quantity);
        self::assertSame(10.0, (float) $doiRow->delivered_quantity);
        self::assertSame(2.5, (float) $doiRow->returned_quantity);

        self::assertSame(120.5, (float) $shipRow->charge_amount);
        self::assertSame(1500.75, (float) $shipRow->cod_amount);

        self::assertSame(1500.75, (float) $reconRow->expected_amount);
        self::assertSame(1450.75, (float) $reconRow->received_amount);
        self::assertSame(-50.0, (float) $reconRow->variance_amount);
    }
}
