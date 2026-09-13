<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\PlatformSupportTicket
 *
 * @property int $id
 * @property string $uuid
 * @property string $ticket_number
 * @property int $tenant_id
 * @property string $title
 * @property string $description
 * @property string $category
 * @property string $priority
 * @property string $status
 * @property int|null $assigned_to
 * @property int|null $created_by
 * @property CarbonInterface|null $resolved_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read User|null $assignee
 * @property-read User|null $creator
 * @property-read \Illuminate\Database\Eloquent\Collection<int, PlatformSupportTicketNote> $notes
 */
class PlatformSupportTicket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'ticket_number',
        'tenant_id',
        'title',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'created_by',
        'resolved_at',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(PlatformSupportTicketNote::class, 'ticket_id')->latest();
    }

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }
}
