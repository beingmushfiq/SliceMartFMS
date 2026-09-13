<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PlatformErrorLog
 *
 * Central persistent error monitoring log for backend exceptions and frontend boundary errors.
 *
 * @property int $id
 * @property string $uuid
 * @property string $fingerprint
 * @property int|null $tenant_id
 * @property int|null $user_id
 * @property string $error_type
 * @property string $message
 * @property string|null $stack_trace
 * @property string $severity
 * @property string|null $module
 * @property string|null $route
 * @property string|null $request_id
 * @property string|null $correlation_id
 * @property string|null $ip
 * @property string|null $user_agent
 * @property string|null $browser
 * @property string $environment
 * @property string $status
 * @property int|null $resolved_by
 * @property CarbonInterface|null $resolved_at
 * @property string|null $resolution_note
 * @property int $occurrence_count
 * @property CarbonInterface $first_seen_at
 * @property CarbonInterface $last_seen_at
 * @property CarbonInterface $created_at
 * @property-read Tenant|null $tenant
 * @property-read User|null $user
 * @property-read User|null $resolver
 */
class PlatformErrorLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'uuid',
        'fingerprint',
        'tenant_id',
        'user_id',
        'error_type',
        'message',
        'stack_trace',
        'severity',
        'module',
        'route',
        'request_id',
        'correlation_id',
        'ip',
        'user_agent',
        'browser',
        'environment',
        'status',
        'resolved_by',
        'resolved_at',
        'resolution_note',
        'occurrence_count',
        'first_seen_at',
        'last_seen_at',
        'created_at',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    protected function casts(): array
    {
        return [
            'occurrence_count' => 'integer',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'resolved_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
