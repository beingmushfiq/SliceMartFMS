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
        Schema::create('asset_depreciation_entries', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('asset_id');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            $table->decimal('opening_book_value', 18, 4);
            $table->decimal('depreciation_amount', 18, 4);
            $table->decimal('closing_book_value', 18, 4);

            $table->unsignedBigInteger('journal_entry_id')->nullable(); // deferred FK to Wave 21 finance
            $table->timestamp('posted_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();

            $table->unique(['tenant_id', 'id'], 'uq_asset_deprec_entries_tenant_id');
            $table->unique(['tenant_id', 'asset_id', 'period_year', 'period_month'], 'uq_asset_deprec_slot');

            $table->foreign(['tenant_id', 'asset_id'], 'fk_asset_deprec_asset')
                ->references(['tenant_id', 'id'])
                ->on('assets')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_asset_deprec_created_by')
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
        Schema::dropIfExists('asset_depreciation_entries');
    }
};
