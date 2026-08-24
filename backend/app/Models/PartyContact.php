<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PartyContact
 *
 * A contact person at a party. Like party_addresses this table carries only
 * `timestamps()` — no `created_by`/`updated_by` and no soft delete, because
 * the row's lifecycle cascades from the parent party.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $party_id
 * @property string $name
 * @property string|null $designation
 * @property string|null $phone
 * @property string|null $email
 * @property bool $is_primary
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Party $party
 */
final class PartyContact extends Model
{
    use BelongsToTenant;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'party_id',
        'name',
        'designation',
        'phone',
        'email',
        'is_primary',
    ];

    /**
     * Owning tenant.
     *
     * @return BelongsTo<Tenant, $this>
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Party this contact belongs to. Composite FK `(tenant_id, party_id)`.
     *
     * @return BelongsTo<Party, $this>
     */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'party_id' => 'integer',
            'is_primary' => 'boolean',
        ];
    }
}
