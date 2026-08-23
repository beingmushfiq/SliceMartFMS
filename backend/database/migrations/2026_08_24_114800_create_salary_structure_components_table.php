<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salary_structure_components', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('salary_structure_id');
            $table->unsignedBigInteger('component_id');
            $table->string('calculation_type', 32); // fixed, percentage, formula, per_unit, per_day, per_hour
            $table->decimal('value', 18, 4);
            $table->unsignedBigInteger('base_component_id')->nullable(); // for percentage calculation
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_sal_struct_comp_tenant_id');
            $table->index(['tenant_id', 'salary_structure_id'], 'ix_sal_struct_comp_structure');

            $table->foreign(['tenant_id', 'salary_structure_id'], 'fk_sal_struct_comp_struct')
                ->references(['tenant_id', 'id'])
                ->on('salary_structures')
                ->cascadeOnDelete();

            $table->foreign(['tenant_id', 'component_id'], 'fk_sal_struct_comp_comp')
                ->references(['tenant_id', 'id'])
                ->on('salary_components')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'base_component_id'], 'fk_sal_struct_comp_base')
                ->references(['tenant_id', 'id'])
                ->on('salary_components')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_sal_struct_comp_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_sal_struct_comp_updated_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_structure_components');
    }
};
