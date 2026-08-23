<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `reason_codes`.
 *
 * One table for every mandatory-reason field in the system — QC defects, stock
 * adjustments, wastage causes, returns, cancellations. Rather than a separate
 * "defect reasons" table, "wastage reasons" table and so on, `context` partitions
 * a single tenant-configurable catalogue. A UI picking a reason for a QC defect
 * filters `WHERE context = 'qc_defect'`; the guarantee that such a reason cannot
 * appear on a stock adjustment is in the Action, not the schema.
 *
 * `context` vocabulary (§4):
 * `qc_defect` `wastage` `stock_adjustment` `sales_return` `purchase_return`
 * `cancellation` `rework`
 *
 * `requires_note` — when `1`, the Action that records a reason-coded event must
 * collect a free-text note. Enforced in the Action, not the schema, for the same
 * reason `capacity_per_shift` + `capacity_unit_id` are not CHECK-constrained
 * (SQLite cannot add a CHECK through ALTER TABLE).
 *
 * `sort_order` — `UNSIGNED SMALLINT` (0–65535). The reason picker renders codes
 * in this order, and a sub-zero position has no meaning. `TINYINT` (0–255) is
 * too narrow for a fully loaded catalogue; `INT` is unnecessarily wide.
 *
 * **Leaf table** — nothing in this wave references `reason_codes` by composite FK
 * yet, so this table does NOT carry `unique (tenant_id, id)`. That key is added
 * when the first child table (`wastage_records`, `stock_movements`, `qc_defects`)
 * is created in a later wave.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reason_codes', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            // §1 — VARCHAR(32), never MySQL ENUM.
            // Vocabulary: qc_defect | wastage | stock_adjustment |
            //             sales_return | purchase_return | cancellation | rework
            $table->string('context', 32);
            $table->string('code', 32);
            $table->string('name', 191);

            // Whether the Action must collect a free-text note alongside this
            // reason. Enforced in the Action, not a CHECK constraint.
            $table->boolean('requires_note')->default(false);

            $table->boolean('is_active')->default(true);

            // Display ordering within a context. UNSIGNED SMALLINT: 0–65535.
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'id'], 'uq_reason_codes_tenant_id');
            $table->unique('uuid', 'uq_reason_codes_uuid');

            // §1.1 — a code is unique within a (tenant, context) pair. Two
            // contexts in one tenant may share the same code (`ADJ-01` for both
            // `stock_adjustment` and `wastage` are different reasons).
            $table->unique(['tenant_id', 'context', 'code'], 'uq_reason_codes_tenant_context_code');

            // §1.2 — the reason picker always filters by tenant, context, and
            // active flag.
            $table->index(
                ['tenant_id', 'context', 'is_active', 'sort_order'],
                'ix_reason_codes_tenant_context_active_sort'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reason_codes');
    }
};
