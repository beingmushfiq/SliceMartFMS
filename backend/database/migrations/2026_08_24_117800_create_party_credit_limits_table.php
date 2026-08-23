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
        Schema::create('party_credit_limits', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('party_id');
            $table->decimal('credit_limit', 18, 4)->default('0.0000');
            $table->unsignedBigInteger('payment_term_id')->nullable();

            $table->decimal('current_outstanding', 18, 4)->default('0.0000'); // cache
            $table->boolean('blocked')->default(false);
            $table->text('blocked_reason')->nullable();

            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_party_credit_limits_tenant_id');
            $table->unique(['tenant_id', 'party_id'], 'uq_party_credit_limits_party');

            $table->foreign(['tenant_id', 'party_id'], 'fk_party_credit_limits_party')
                ->references(['tenant_id', 'id'])
                ->on('parties')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'payment_term_id'], 'fk_party_credit_limits_term')
                ->references(['tenant_id', 'id'])
                ->on('payment_terms')
                ->restrictOnDelete();

            $table->foreign('reviewed_by', 'fk_party_credit_limits_reviewed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('created_by', 'fk_party_credit_limits_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_party_credit_limits_updated_by')
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
        Schema::dropIfExists('party_credit_limits');
    }
};
