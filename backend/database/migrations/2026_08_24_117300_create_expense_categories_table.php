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
        Schema::create('expense_categories', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->string('code', 64);
            $table->string('name', 255);
            $table->unsignedBigInteger('parent_id')->nullable();

            $table->unsignedBigInteger('default_account_id')->nullable();
            $table->boolean('requires_attachment')->default(false);
            $table->decimal('approval_threshold', 18, 4)->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_expense_categories_tenant_id');
            $table->unique(['tenant_id', 'code'], 'uq_expense_categories_code');

            $table->foreign(['tenant_id', 'parent_id'], 'fk_expense_categories_parent')
                ->references(['tenant_id', 'id'])
                ->on('expense_categories')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'default_account_id'], 'fk_expense_categories_account')
                ->references(['tenant_id', 'id'])
                ->on('chart_of_accounts')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_expense_categories_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_expense_categories_updated_by')
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
        Schema::dropIfExists('expense_categories');
    }
};
