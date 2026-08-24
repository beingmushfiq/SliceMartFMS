<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Party
 *
 * Any external actor the tenant transacts with. The four role flags are
 * independent, so one row may be supplier and customer simultaneously.
 *
 * `opening_balance` and `current_balance` are DECIMAL(18,4) money columns cast
 * to `decimal:4` so they stay strings end-to-end. `current_balance` is a
 * read-optimised cache maintained by the ledger actions, not by party edits.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $code
 * @property string $name
 * @property string|null $legal_name
 * @property bool $is_supplier
 * @property bool $is_customer
 * @property bool $is_dealer
 * @property bool $is_agent
 * @property string $type
 * @property string|null $tax_identifier
 * @property string|null $phone
 * @property string|null $email
 * @property string $credit_limit
 * @property int $credit_days
 * @property int|null $price_list_id
 * @property int|null $tax_profile_id
 * @property string $opening_balance
 * @property string $current_balance
 * @property int|null $assigned_to
 * @property string $status
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read PriceList|null $priceList
 * @property-read TaxProfile|null $taxProfile
 * @property-read User|null $assignee
 * @property-read Collection<int, PartyAddress> $addresses
 * @property-read Collection<int, PartyContact> $contacts
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
final class Party extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    /**
     * `tenant_id` is deliberately absent: it is stamped by BelongsToTenant and
     * must never be mass-assignable (ARCHITECTURE §3.1 layer 3).
     *
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'code',
        'name',
        'legal_name',
        'is_supplier',
        'is_customer',
        'is_dealer',
        'is_agent',
        'type',
        'tax_identifier',
        'phone',
        'email',
        'credit_limit',
        'credit_days',
        'price_list_id',
        'tax_profile_id',
        'opening_balance',
        'current_balance',
        'assigned_to',
        'status',
        'created_by',
        'updated_by',
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
     * Default price list for this party, if any. The composite FK is added by
     * the Wave 7 deferred closure migration because `price_lists` is created
     * after `parties`.
     *
     * @return BelongsTo<PriceList, $this>
     */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class, 'price_list_id');
    }

    /**
     * Default tax profile for this party, if any.
     *
     * @return BelongsTo<TaxProfile, $this>
     */
    public function taxProfile(): BelongsTo
    {
        return $this->belongsTo(TaxProfile::class, 'tax_profile_id');
    }

    /**
     * CRM owner — the user who manages this party.
     *
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Structured addresses for this party.
     *
     * @return HasMany<PartyAddress, $this>
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(PartyAddress::class, 'party_id');
    }

    /**
     * Contact persons for this party.
     *
     * @return HasMany<PartyContact, $this>
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(PartyContact::class, 'party_id');
    }

    /**
     * User who created the row.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated the row.
     *
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'is_supplier' => 'boolean',
            'is_customer' => 'boolean',
            'is_dealer' => 'boolean',
            'is_agent' => 'boolean',
            'type' => 'string',
            'credit_limit' => 'decimal:4',
            'credit_days' => 'integer',
            'price_list_id' => 'integer',
            'tax_profile_id' => 'integer',
            'opening_balance' => 'decimal:4',
            'current_balance' => 'decimal:4',
            'assigned_to' => 'integer',
            'status' => 'string',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
