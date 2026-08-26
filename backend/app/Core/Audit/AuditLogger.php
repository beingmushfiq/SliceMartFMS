<?php

declare(strict_types=1);

namespace App\Core\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Writes an append-only audit row for a mutation (ADR-027).
 *
 * MUST be called INSIDE the same DB::transaction() as the mutation it records
 * (ADR-027, ADR-028): if the mutation rolls back, the audit row rolls back with
 * it, and there is no way to record one without the other. The caller supplies
 * the actor and request context explicitly — this service never reads Auth or
 * the request — so it is safe to call from an Action (ARCHITECTURE §3.1 layer 5).
 *
 * `tenant_id` is stamped by BelongsToTenant from the bound TenantContext; `uuid`
 * is generated here because the trait does not stamp it; `created_at` is the
 * business moment, defaulting to now() but overridable so a retried job records
 * when the event happened, not when the row was finally written.
 */
final class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $before  Redacted snapshot before the mutation (null on create).
     * @param  array<string, mixed>|null  $after  Redacted snapshot after the mutation (null on delete).
     * @param  array<string, mixed>|null  $context  Module, route, and any operator reason text.
     */
    public function record(
        AuditAction $action,
        ?Model $auditable = null,
        ?array $before = null,
        ?array $after = null,
        ?User $actor = null,
        ?array $context = null,
        ?string $correlationId = null,
        ?string $ip = null,
        ?string $userAgent = null,
        ?CarbonInterface $at = null,
    ): AuditLog {
        $auditLog = new AuditLog;

        $auditLog->fill([
            'uuid' => (string) Str::uuid(),
            'user_id' => $actor?->getKey(),
            'action' => $action,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'before' => $before,
            'after' => $after,
            'changed_fields' => $this->changedFields($before, $after),
            'context' => $context,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'correlation_id' => $correlationId,
            'created_at' => $at ?? Carbon::now(),
        ]);

        $auditLog->save();

        return $auditLog;
    }

    /**
     * Derive the changed-field list from the before/after snapshots so that
     * "which rows touched price?" is an indexable question rather than a
     * full-table JSON scan (DATABASE_DESIGN §3). Returns null when there is
     * nothing to diff — a pure create (no before) or a delete (no after).
     *
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     * @return list<string>|null
     */
    private function changedFields(?array $before, ?array $after): ?array
    {
        if ($before === null || $after === null) {
            return null;
        }

        $changed = [];

        foreach ($after as $key => $value) {
            if (! array_key_exists($key, $before) || $before[$key] !== $value) {
                $changed[] = $key;
            }
        }

        return $changed === [] ? null : $changed;
    }
}
