<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 5 — master data A. DATABASE_DESIGN §4 `unit_conversions`.
 *
 * Stores bidirectional (or unidirectional, explicitly defined) conversion
 * factors between pairs of tenant-scoped units. Conversion is **data**, not a
 * hardcoded multiplier (ADR-002). A `factor` of 1000 on `(gram → kilogram)` is
 * wrong; the tenant defines it directly and exclusively.
 *
 * `factor` is DECIMAL(18,8) — eight decimal places rather than the §1
 * `DECIMAL(18,4)` quantity convention — because unit conversion factors often
 * require more fractional precision than measured quantities. For example,
 * 1 pound = 453.59237 grams cannot be meaningfully rounded to four places.
 * Deliberate departure from §1's quantity rule, noted here.
 *
 * Both composite FKs are `(tenant_id, *_unit_id) → units(tenant_id, id)`.
 * This is the first table in the schema where two FKs reference the same
 * parent table. Each must have a distinct constraint name.
 *
 * **Leaf table** — nothing references `unit_conversions` by composite FK, so
 * this table does NOT carry `unique (tenant_id, id)`. There is no child that
 * needs to join through it on (tenant_id, id) as a composite target.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unit_conversions', function (Blueprint $table): void {
            $table->id();
            // §1 — tenant_id is the first column after id.
            // No foreignId shorthand — the composite FK is declared explicitly.
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('from_unit_id');
            $table->unsignedBigInteger('to_unit_id');

            // Eight decimal places: conversion factors are more precise than
            // quantity measurements. See class docblock.
            $table->decimal('factor', 18, 8);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // No soft delete — a conversion is corrected by updating the factor
            // or replacing the pair, not by hiding the row.

            $table->unique('uuid', 'uq_unit_conversions_uuid');

            // §1.1 — a tenant may define only one factor per ordered unit pair.
            // The pair is ordered: (gram → kilogram) ≠ (kilogram → gram).
            $table->unique(
                ['tenant_id', 'from_unit_id', 'to_unit_id'],
                'uq_unit_conversions_tenant_from_to'
            );

            // Composite FK — proves `from_unit_id` belongs to the same tenant.
            $table->foreign(['tenant_id', 'from_unit_id'], 'fk_unit_conversions_tenant_from')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // Composite FK — same guarantee for `to_unit_id`.
            $table->foreign(['tenant_id', 'to_unit_id'], 'fk_unit_conversions_tenant_to')
                ->references(['tenant_id', 'id'])
                ->on('units')
                ->restrictOnDelete();

            // §1 — tenant_id must be indexed (it is the leading column on the
            // unique key, so those serve; a standalone index is not added).
            // §1.2 — the conversion lookup path is always (tenant, from_unit).
            $table->index(['tenant_id', 'from_unit_id'], 'ix_unit_conversions_tenant_from');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_conversions');
    }
};
