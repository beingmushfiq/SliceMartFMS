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
        Schema::create('pos_sessions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('session_number', 64);
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('terminal_id');
            $table->unsignedBigInteger('user_id');

            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();

            $table->decimal('opening_cash', 18, 4)->default('0.0000');
            $table->decimal('expected_cash', 18, 4)->default('0.0000');
            $table->decimal('counted_cash', 18, 4)->nullable();
            $table->decimal('cash_variance', 18, 4)->nullable();

            $table->decimal('card_total', 18, 4)->default('0.0000');
            $table->decimal('mobile_total', 18, 4)->default('0.0000');
            $table->decimal('credit_total', 18, 4)->default('0.0000');
            $table->unsignedInteger('sales_count')->default(0);
            $table->decimal('refund_total', 18, 4)->default('0.0000');

            $table->string('status', 32)->default('open'); // open, closing, closed, reconciled
            $table->unsignedBigInteger('closed_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_pos_sessions_tenant_id');
            $table->unique(['tenant_id', 'session_number'], 'uq_pos_sessions_number');
            $table->index(['tenant_id', 'terminal_id', 'status'], 'ix_pos_sessions_terminal_status');
            $table->index(['tenant_id', 'user_id'], 'ix_pos_sessions_user');

            $table->foreign(['tenant_id', 'branch_id'], 'fk_pos_sessions_branch')
                ->references(['tenant_id', 'id'])
                ->on('branches')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'warehouse_id'], 'fk_pos_sessions_warehouse')
                ->references(['tenant_id', 'id'])
                ->on('warehouses')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'terminal_id'], 'fk_pos_sessions_terminal')
                ->references(['tenant_id', 'id'])
                ->on('pos_terminals')
                ->restrictOnDelete();

            $table->foreign('user_id', 'fk_pos_sessions_user')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('closed_by', 'fk_pos_sessions_closed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_pos_sessions_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_pos_sessions_updated_by')
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
        Schema::dropIfExists('pos_sessions');
    }
};
