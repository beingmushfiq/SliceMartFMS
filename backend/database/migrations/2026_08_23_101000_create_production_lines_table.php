<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 2 — org. DATABASE_DESIGN §2 `production_lines`.
 *
 * This table is why Generation A's "1 production line" is dead (C4): a tenant
 * may run any number of lines per factory.
 *
 * FINDING — `capacity_unit_id` references `units`, which §16 places in **Wave
 * 5**, and §16 also states a wave may only reference tables from an earlier
 * wave or its own. The foreign key therefore cannot be declared here. §16.1
 * rule 2 covers exactly this ("a nullable FK added later is correct; a missing
 * FK is not") but lists only waves 9 and 25 as closure waves, neither of which
 * mentions this column. The column is created nullable and unconstrained now,
 * and the foreign key is added in the Wave 5 migration that creates `units`;
 * §16 has been amended to record the obligation so it cannot be forgotten.
 *
 * `capacity_per_shift` and `capacity_unit_id` are both nullable and must be set
 * together — a capacity of 500 with no unit is unusable. This is *not* enforced
 * by a CHECK constraint on purpose: SQLite cannot add one through ALTER TABLE,
 * so the constraint would exist in production and be absent from the test
 * database, and a constraint the suite cannot exercise is worse than one
 * enforced by an Action with a test behind it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->unsignedBigInteger('factory_id');

            $table->string('code', 32);
            $table->string('name', 191);

            // §1 — quantity is DECIMAL(18,4). Nullable: capacity planning is
            // optional, and a line may be registered before it is measured.
            $table->decimal('capacity_per_shift', 18, 4)->nullable();
            // FK deferred to Wave 5 (`units`) — see the class docblock.
            $table->unsignedBigInteger('capacity_unit_id')->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_production_lines_uuid');
            // §1.1 — scoped to the factory as well as the tenant, because two
            // factories in one tenant may each name a line `L1`.
            $table->unique(['tenant_id', 'factory_id', 'code'], 'uq_production_lines_tenant_factory_code');
            // Composite foreign key target for Wave 10's production batches.
            $table->unique(['tenant_id', 'id'], 'uq_production_lines_tenant_id');

            $table->foreign(['tenant_id', 'factory_id'], 'fk_production_lines_tenant_factory')
                ->references(['tenant_id', 'id'])
                ->on('factories')
                ->restrictOnDelete();

            // §1.2 — the line list is always read per factory, filtered active.
            $table->index(['tenant_id', 'factory_id', 'is_active'], 'ix_production_lines_tenant_factory_active');
            // Indexed now so the deferred Wave 5 foreign key needs no ALTER on
            // a populated table (§16.1 rule 5).
            $table->index(['tenant_id', 'capacity_unit_id'], 'ix_production_lines_tenant_capacity_unit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_lines');
    }
};
