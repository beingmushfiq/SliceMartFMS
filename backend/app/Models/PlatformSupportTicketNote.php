<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PlatformSupportTicketNote
 *
 * @property int $id
 * @property int $ticket_id
 * @property string $note
 * @property bool $is_internal
 * @property int|null $created_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read PlatformSupportTicket $ticket
 * @property-read User|null $author
 */
class PlatformSupportTicketNote extends Model
{
    protected $fillable = [
        'ticket_id',
        'note',
        'is_internal',
        'created_by',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(PlatformSupportTicket::class, 'ticket_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
        ];
    }
}
