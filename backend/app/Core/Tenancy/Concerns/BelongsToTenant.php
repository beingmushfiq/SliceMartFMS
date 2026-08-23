<?php

declare(strict_types=1);

namespace App\Core\Tenancy\Concerns;

use App\Core\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Eloquent trait for every tenant-scoped model (ARCHITECTURE §3.1).
 *
 * Enforces three of the five tenancy layers:
 *
 *   Layer 2 — Query: GlobalScope automatically appends `WHERE tenant_id = ?`
 *             to every Eloquent query, so rows from other tenants are invisible.
 *
 *   Layer 3 — Write: A `creating` hook stamps `tenant_id` from TenantContext
 *             before the INSERT. The column is guarded so a mass-assignment
 *             attempt from untrusted input is silently ignored.
 *
 *             Logging: withoutTenantScope() emits a Log::warning() on every
 *             call (ARCHITECTURE §3.2). Platform-scope routes are the only
 *             caller permitted to use it; any unexpected use is auditable.
 *
 * Usage:
 *
 *     final class Company extends Model
 *     {
 *         use BelongsToTenant;
 *     }
 *
 * The model MUST declare `tenant_id` as guarded (or use `$guarded = ['*']`
 * and explicitly fill everything else) to prevent mass-assignment override.
 *
 * @mixin Model
 */
trait BelongsToTenant
{
    /**
     * Boot the trait: register the global scope and the creating hook.
     */
    public static function bootBelongsToTenant(): void
    {
        // Layer 2 — Query: add a global WHERE tenant_id = current tenant.
        static::addGlobalScope('tenant', static function (Builder $builder): void {
            // Only apply the scope if a context is currently bound. Platform
            // routes call withoutTenantScope() to suppress it; queue jobs must
            // bind their own context before any query runs.
            if (TenantContext::isBound()) {
                // qualifyColumn() returns "table.tenant_id", accepted by larastan
                // as a valid where() column argument.
                $builder->where(
                    $builder->getModel()->qualifyColumn('tenant_id'),
                    TenantContext::current()->tenantId()
                );
            }
        });

        // Layer 3 — Write: stamp tenant_id on every new row.
        static::creating(static function (Model $model): void {
            if (TenantContext::isBound() && $model->getAttribute('tenant_id') === null) {
                // setAttribute bypasses mass-assignment; $guarded protects this
                // column from user input regardless.
                $model->setAttribute('tenant_id', TenantContext::current()->tenantId());
            }
        });
    }

    /**
     * Scope a query to remove the tenant global scope.
     *
     * Permitted ONLY on platform-scope routes (ARCHITECTURE §3.2).
     * Every call is logged so that an unexpected bypass is auditable.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        // debug_backtrace with limit=2 always returns at least frame 0 (this
        // function). Frame 1 is the direct caller and always has a 'function'
        // key (it may lack 'class' for a global function call, hence the ?? below).
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);

        $caller = isset($trace[1])
            ? ($trace[1]['class'] ?? '(global)').'::'.$trace[1]['function']
            : '(unknown)';

        Log::warning('withoutTenantScope() called — platform-scope routes only.', [
            'model' => static::class,
            'caller' => $caller,
            'tenant_bound' => TenantContext::isBound()
                ? TenantContext::current()->tenantId()
                : null,
        ]);

        return $query->withoutGlobalScope('tenant');
    }
}
