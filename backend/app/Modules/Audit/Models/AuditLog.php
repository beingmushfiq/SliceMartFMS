<?php

declare(strict_types=1);

namespace App\Modules\Audit\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AuditLog extends Model
{
    use BelongsToTenant;

    protected $table = 'audit_logs';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
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

    protected $casts = [
        'before' => 'array',
        'after' => 'array',
        'changed_fields' => 'array',
        'context' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->created_at)) {
                $model->created_at = now();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
