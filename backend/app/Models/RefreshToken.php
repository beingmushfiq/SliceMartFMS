<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\RefreshToken
 *
 * @property int $id
 * @property string $uuid
 * @property int $user_id
 * @property int|null $tenant_id
 * @property string $token_hash
 * @property string $family_id
 * @property int|null $replaced_by_id
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property CarbonInterface $expires_at
 * @property CarbonInterface|null $revoked_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read User $user
 * @property-read RefreshToken|null $replacedBy
 */
class RefreshToken extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'user_id',
        'tenant_id',
        'token_hash',
        'family_id',
        'replaced_by_id',
        'ip',
        'user_agent',
        'expires_at',
        'revoked_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /**
     * Owning user.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The successor token in rotation.
     *
     * @return BelongsTo<RefreshToken, $this>
     */
    public function replacedBy(): BelongsTo
    {
        return $this->belongsTo(RefreshToken::class, 'replaced_by_id');
    }

    /**
     * Determine if token has been revoked.
     */
    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    /**
     * Determine if token has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
