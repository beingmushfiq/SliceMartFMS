<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wave 1 — platform. DATABASE_DESIGN §13.3 `settings`.
 *
 * FINDING (raised, not silently patched) — the documented unique key
 * `(tenant_id, scope, scope_id, group, key)` cannot enforce what §13.3 needs,
 * because both `tenant_id` and `scope_id` are nullable and NULLs never collide
 * in a UNIQUE index on MySQL 8 or SQLite. As written, `(NULL, 'platform',
 * NULL, 'general', 'x')` is insertable an unlimited number of times — so the
 * platform-default row is unprotected, and so is every `scope = 'tenant'` row.
 * That breaks the §13.3 invariant that a missing setting resolves to *the*
 * platform default, since "the" default would be ambiguous.
 *
 * Resolution: the semantic columns stay nullable exactly as documented, and
 * uniqueness is enforced over two STORED generated columns that fold NULL to
 * the sentinel 0. The database computes them, so they cannot drift, and no
 * application code may write them. `tenant_id`/`scope_id` remain the columns
 * every query and FK uses.
 *
 * No soft delete: a soft-deleted setting would silently poison the resolution
 * chain the first time a caller forgot `whereNull('deleted_at')`. Settings are
 * overwritten or removed outright.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table): void {
            $table->id();

            // Nullable by design — NULL marks a platform default (§13.3).
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->uuid('uuid');

            // platform | tenant | company | branch | user (§1 enums are VARCHAR).
            $table->string('scope', 32);

            // The company/branch/user this row applies to. NULL for the
            // `platform` and `tenant` scopes, which are identified by tenant_id
            // alone. No FK: the target table varies by `scope`.
            $table->unsignedBigInteger('scope_id')->nullable();

            // general | production | inventory | sales | pos | delivery | hr |
            // finance | notifications | security | ecommerce.
            $table->string('group', 32);
            $table->string('key', 128);

            $table->json('value')->nullable();

            // string | number | boolean | json | date — drives the typed cast
            // that makes Settings::get() total.
            $table->string('value_type', 16);

            // §13.3 — encrypted values are never returned by a read API, only a
            // masked presence indicator.
            $table->boolean('is_encrypted')->default(false);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Uniqueness sentinels. Never written by application code.
            $table->unsignedBigInteger('tenant_key')->storedAs('coalesce(tenant_id, 0)');
            $table->unsignedBigInteger('scope_key')->storedAs('coalesce(scope_id, 0)');

            $table->unique('uuid', 'uq_settings_uuid');
            $table->unique(
                ['tenant_key', 'scope', 'scope_key', 'group', 'key'],
                'uq_settings_scope_key'
            );

            // §1.2 — resolution walks user → branch → company → tenant →
            // platform for one group at a time, so the read path is
            // (tenant, group, scope).
            $table->index(['tenant_id', 'group', 'scope'], 'ix_settings_tenant_group_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
