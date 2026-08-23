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
        Schema::create('pos_terminals', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('branch_id');
            $table->string('code', 64);
            $table->string('name', 255);
            $table->unsignedBigInteger('default_warehouse_id')->nullable();

            $table->json('printer_config')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_pos_terminals_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_pos_terminals_code');
            $table->index(['tenant_id', 'branch_id'], 'ix_pos_terminals_branch');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_pos_terminals_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'default_warehouse_id'], 'fk_pos_terminals_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_pos_terminals_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_pos_terminals_updated_by')
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
        Schema::dropIfExists('pos_terminals');
    }
};
