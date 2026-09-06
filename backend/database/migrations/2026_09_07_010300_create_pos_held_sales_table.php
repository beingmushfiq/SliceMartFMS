<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_held_sales', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('pos_session_id');
            $table->unsignedBigInteger('pos_terminal_id')->nullable();
            $table->unsignedBigInteger('customer_party_id')->nullable();

            $table->string('reference_note', 128)->nullable();
            $table->json('cart_payload'); // Full cart lines, discounts, customer info
            $table->decimal('subtotal', 18, 4)->default('0.0000');
            $table->decimal('tax_amount', 18, 4)->default('0.0000');
            $table->decimal('discount_amount', 18, 4)->default('0.0000');
            $table->decimal('total_amount', 18, 4)->default('0.0000');

            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'pos_session_id'], 'ix_pos_held_sales_session');

            $table->foreign(['tenant_id', 'pos_session_id'], 'fk_pos_held_sales_session')
                ->references(['tenant_id', 'id'])->on('pos_sessions')
                ->cascadeOnDelete();

            $table->foreign('created_by', 'fk_pos_held_sales_created_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_held_sales');
    }
};
