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
        Schema::create('pos_offline_queue', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('terminal_id');
            $table->unsignedBigInteger('user_id');
            $table->string('idempotency_key', 128);

            $table->json('payload');
            $table->timestamp('client_created_at');
            $table->timestamp('synced_at')->nullable();

            $table->string('status', 32)->default('pending'); // pending, synced, rejected
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_pos_offline_queue_tenant_id');
            $table->unique(['tenant_id', 'idempotency_key'], 'uq_pos_offline_queue_idempotency');
            $table->index(['tenant_id', 'terminal_id', 'status'], 'ix_pos_offline_queue_term_status');

            $table->foreign(['tenant_id', 'terminal_id'], 'fk_pos_offline_queue_terminal')
                ->references(['tenant_id', 'id'])
                ->on('pos_terminals')
                ->restrictOnDelete();

            $table->foreign('user_id', 'fk_pos_offline_queue_user')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_pos_offline_queue_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_pos_offline_queue_updated_by')
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
        Schema::dropIfExists('pos_offline_queue');
    }
};
