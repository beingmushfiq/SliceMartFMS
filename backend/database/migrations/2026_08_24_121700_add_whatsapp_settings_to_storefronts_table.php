<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table): void {
            $table->string('whatsapp_number', 32)->nullable()->after('online_payment_enabled');
            $table->boolean('whatsapp_ordering_enabled')->default(true)->after('whatsapp_number');
            $table->text('whatsapp_default_message')->nullable()->after('whatsapp_ordering_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $table): void {
            $table->dropColumn(['whatsapp_number', 'whatsapp_ordering_enabled', 'whatsapp_default_message']);
        });
    }
};
