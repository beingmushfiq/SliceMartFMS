<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PartyAddress
 *
 * Structured address rows required by courier integrations — individual fields
 * rather than one free-text blob. This table carries only `timestamps()`: it
 * has no `created_by`/`updated_by` audit columns and no soft delete, because
 * its lifecycle cascades from the parent party.
 *
 * `latitude` and `longitude` are DECIMAL(10,7), so they are cast to
 * `decimal:7` — not `decimal:4` like the money columns elsewhere.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property int $party_id
 * @property string $type
 * @property string|null $label
 * @property string|null $contact_name
 * @property string|null $phone
 * @property string $line1
 * @property string|null $line2
 * @property string|null $area
 * @property string $city
 * @property string|null $district
 * @property string|null $postal_code
 * @property string $country_code
 * @property string|null $latitude
 * @property string|null $longitude
 * @property bool $is_default
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read Party $party
 */
final class PartyAddress extends Model
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
        'type',
        'label',
        'contact_name',
        'phone',
        'line1',
        'line2',
        'area',
        'city',
        'district',
        'postal_code',
        'country_code',
        'latitude',
        'longitude',
        'is_default',
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
     * Party this address belongs to. Composite FK `(tenant_id, party_id)`.
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
            'type' => 'string',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_default' => 'boolean',
        ];
    }
}
