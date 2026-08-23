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
        Schema::create('dashboard_widgets', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->uuid('uuid');

            $table->unsignedBigInteger('user_id')->nullable(); // null = role default
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('widget_code', 64);
            $table->string('title_override', 255)->nullable();

            $table->unsignedSmallInteger('grid_x')->default(0);
            $table->unsignedSmallInteger('grid_y')->default(0);
            $table->unsignedSmallInteger('grid_w')->default(4);
            $table->unsignedSmallInteger('grid_h')->default(3);

            $table->json('config')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->unique(['tenant_id', 'id'], 'uq_dashboard_widgets_tenant_id');
            $table->index(['tenant_id', 'user_id'], 'ix_dashboard_widgets_user');
            $table->index(['tenant_id', 'role_id'], 'ix_dashboard_widgets_role');

            $table->foreign(['tenant_id', 'user_id'], 'fk_dash_widgets_user')
                ->references(['tenant_id', 'id'])
                ->on('users')
                ->restrictOnDelete();

            $table->foreign(['tenant_id', 'role_id'], 'fk_dash_widgets_role')
                ->references(['tenant_id', 'id'])
                ->on('roles')
                ->restrictOnDelete();

            $table->foreign('created_by', 'fk_dash_widgets_created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'fk_dash_widgets_updated_by')
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
        Schema::dropIfExists('dashboard_widgets');
    }
};
