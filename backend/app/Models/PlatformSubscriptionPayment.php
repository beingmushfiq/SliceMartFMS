<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PlatformSubscriptionPayment
 *
 * SaaS platform billing payment transaction record.
 *
 * @property int $id
 * @property string $uuid
 * @property int $tenant_id
 * @property int|null $subscription_id
 * @property string $invoice_reference
 * @property string $amount
 * @property string $currency_code
 * @property string|null $payment_method
 * @property string|null $transaction_reference
 * @property CarbonInterface $payment_date
 * @property CarbonInterface|null $billing_period_start
 * @property CarbonInterface|null $billing_period_end
 * @property string $status
 * @property string|null $notes
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Tenant $tenant
 * @property-read TenantSubscription|null $subscription
 * @property-read User|null $creator
 */
class PlatformSubscriptionPayment extends Model
{
    protected $fillable = [
        'uuid',
        'tenant_id',
        'subscription_id',
        'invoice_reference',
        'amount',
        'currency_code',
        'payment_method',
        'transaction_reference',
        'payment_date',
        'billing_period_start',
        'billing_period_end',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'subscription_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:4',
            'payment_date' => 'date',
            'billing_period_start' => 'date',
            'billing_period_end' => 'date',
        ];
    }
}
