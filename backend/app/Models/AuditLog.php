<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Audit\AuditAction;
use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\AuditLog
 *
 * Append-only (ADR-027, DATABASE_DESIGN §3). The table carries `created_at`
 * only — no `updated_at`, no `deleted_at` — so `$timestamps` is disabled and
 * the writing transaction stamps `created_at` explicitly. There is no UPDATE
 * and no DELETE path: a row is written once, inside the same transaction as the
 * mutation it records, and never touched again.
 *
 * @property int $id
 * @property int|null $tenant_id
 * @property string $uuid
 * @property int|null $user_id
 * @property AuditAction $action
 * @property string|null $auditable_type
 * @property int|null $auditable_id
 * @property array<string, mixed>|null $before
 * @property array<string, mixed>|null $after
 * @property list<string>|null $changed_fields
 * @property array<string, mixed>|null $context
 * @property string|null $ip
 * @property string|null $user_agent
 * @property string|null $correlation_id
 * @property CarbonInterface|null $created_at
 * @property-read Tenant|null $tenant
 * @property-read User|null $user
 */
final class AuditLog extends Model
{
    use BelongsToTenant;

    /**
     * Append-only: the table has no `updated_at`, so Eloquent's timestamp
     * maintenance is switched off and `created_at` is stamped explicitly by
     * the writing transaction (ADR-027).
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'before',
        'after',
        'changed_fields',
        'context',
        'ip',
        'user_agent',
        'correlation_id',
        'created_at',
    ];

    /**
     * Owning tenant. Null for platform-scope actions (ADR-027).
     *
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * The actor who performed the action. Null for system/queue/scheduler
     * actions; the composite FK is RESTRICT, so a referenced actor can never be
     * hard-deleted — the audit trail survives its actor (ADR-027).
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'user_id' => 'integer',
            'action' => AuditAction::class,
            'auditable_id' => 'integer',
            'before' => 'array',
            'after' => 'array',
            'changed_fields' => 'array',
            'context' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
