<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\PlatformAnnouncement
 *
 * System broadcast and targeted announcement banner for tenants.
 *
 * @property int $id
 * @property string $uuid
 * @property string $title
 * @property string $body
 * @property string $target_type
 * @property array|null $target_ids
 * @property string $severity
 * @property CarbonInterface|null $publish_at
 * @property CarbonInterface|null $expires_at
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read User|null $creator
 */
class PlatformAnnouncement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'title',
        'body',
        'target_type',
        'target_ids',
        'severity',
        'publish_at',
        'expires_at',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return [
            'target_ids' => 'array',
            'is_active' => 'boolean',
            'publish_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
