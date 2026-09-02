<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantNotFoundLog extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $table = 'tenant_not_found_logs';

    protected $fillable = [
        'tenant_id',
        'path',
        'referrer',
        'user_agent',
        'ip_address',
        'hit_count',
        'first_seen_at',
        'last_seen_at',
        'is_resolved',
        'resolved_redirect_id',
    ];

    protected $casts = [
        'hit_count' => 'integer',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'is_resolved' => 'boolean',
    ];

    public function resolvedRedirect(): BelongsTo
    {
        return $this->belongsTo(TenantRedirect::class, 'resolved_redirect_id');
    }
}
