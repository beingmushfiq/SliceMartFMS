<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `brands`.
 *
 * Simple master data — a tenant-scoped brand catalogue. A product references a
 * brand via `products.brand_id` (nullable), and that FK will be declared when
 * `products` is created in a later wave. This table needs `unique (tenant_id, id)`
 * as the composite FK target for those child references.
 *
 * `logo_path` is a path to a file on the configured disk, not a URL — URL
 * construction is the presentational layer's responsibility (ADR-020).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->uuid('uuid');

            $table->string('code', 32);
            $table->string('name', 191);

            // Optional. A path on the configured disk — not a URL (ADR-020).
            $table->string('logo_path', 255)->nullable();

            $table->boolean('is_active')->default(true);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('uuid', 'uq_brands_uuid');

            // §1.1 — brand codes are unique within a tenant.
            $table->unique(['tenant_id', 'code'], 'uq_brands_tenant_code');

            // Composite FK target for `products.brand_id` (Wave 5+).
            $table->unique(['tenant_id', 'id'], 'uq_brands_tenant_id');

            // §1.2 — the brand list filters active brands by name.
            $table->index(['tenant_id', 'is_active', 'name'], 'ix_brands_tenant_active_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brands');
    }
};
