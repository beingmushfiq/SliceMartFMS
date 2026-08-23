<?php

declare(strict_types=1);

namespace Tests\Feature\Database;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;

/**
 * Wave 24: Integrations Schema Tests.
 *
 * Covers:
 *   - webhook_endpoints
 *   - webhook_deliveries
 *   - imports
 */
class Wave24IntegrationsSchemaTest extends SchemaTestCase
{
    /** @var list<string> */
    private const TABLES = [
        'webhook_endpoints',
        'webhook_deliveries',
        'imports',
    ];

    #[Test]
    public function all_wave24_tables_exist(): void
    {
        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasTable($table),
                "Failed asserting that table [{$table}] exists."
            );
        }
    }

    #[Test]
    public function every_wave24_table_has_tenant_id_in_primary_position(): void
    {
        foreach (self::TABLES as $table) {
            $columns = Schema::getColumnListing($table);
            $this->assertGreaterThanOrEqual(
                2,
                count($columns),
                "Table [{$table}] must have at least 2 columns."
            );
            $this->assertSame(
                'tenant_id',
                $columns[1],
                "Table [{$table}] must place 'tenant_id' at ordinal position 1 (second column after id)."
            );
        }
    }

    #[Test]
    public function soft_delete_and_lifecycle_compliance(): void
    {
        $this->assertTrue(
            Schema::hasColumn('webhook_endpoints', 'deleted_at'),
            'webhook_endpoints must have deleted_at.'
        );
        $this->assertTrue(
            Schema::hasColumn('imports', 'deleted_at'),
            'imports must have deleted_at.'
        );
        $this->assertFalse(
            Schema::hasColumn('webhook_deliveries', 'deleted_at'),
            'webhook_deliveries is an immutable append-only log and must not have deleted_at.'
        );

        foreach (self::TABLES as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'uuid'),
                "Table [{$table}] must have uuid."
            );
        }
    }

    #[Test]
    public function webhook_endpoints_and_deliveries_lifecycle_and_cascade(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');

        $epId = $this->insertWebhookEndpoint($t, 'https://example.com/webhook');
        $delivId = $this->insertWebhookDelivery($t, $epId, 'sales_order.created');

        $this->assertGreaterThan(0, $epId);
        $this->assertGreaterThan(0, $delivId);

        $row = DB::table('webhook_deliveries')->where('id', $delivId)->first();
        $this->assertNotNull($row);
        $this->assertSame('delivered', $row->status);
        $this->assertSame(200, (int) $row->response_status);

        // Deleting endpoint cascades to its deliveries
        DB::table('webhook_endpoints')->where('id', $epId)->delete();
        $this->assertDatabaseMissing('webhook_deliveries', ['id' => $delivId]);
    }

    #[Test]
    public function imports_status_and_dry_run(): void
    {
        $plan = $this->insertPlan();
        $t = $this->insertTenant($plan['id'], 't1');
        $user = $this->insertUser($t);

        $importId = $this->insertImport($t, $user, 'products', [
            'dry_run' => true,
            'status' => 'validated',
            'total_rows' => 500,
            'processed_rows' => 500,
            'success_rows' => 500,
            'failed_rows' => 0,
        ]);

        $this->assertGreaterThan(0, $importId);

        $row = DB::table('imports')->where('id', $importId)->first();
        $this->assertNotNull($row);
        $this->assertSame('products', $row->import_type);
        $this->assertSame('validated', $row->status);
        $this->assertSame(1, (int) $row->dry_run);
        $this->assertSame(500, (int) $row->total_rows);
    }

    #[Test]
    public function cross_tenant_references_are_rejected(): void
    {
        $plan = $this->insertPlan();
        $t1 = $this->insertTenant($plan['id'], 't1');
        $t2 = $this->insertTenant($plan['id'], 't2');

        $ep1 = $this->insertWebhookEndpoint($t1, 'https://t1.example.com/webhook');

        // Trying to record delivery for tenant 1 endpoint under tenant 2
        $this->expectException(QueryException::class);
        $this->insertWebhookDelivery($t2, $ep1);
    }
}
