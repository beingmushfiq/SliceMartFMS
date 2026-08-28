<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourierWebhookEvent extends Model
{
    protected $table = 'courier_webhook_events';

    protected $fillable = [
        'tenant_id',
        'courier_provider_id',
        'provider_event_id',
        'signature_valid',
        'payload',
        'processed_at',
        'status',
        'error_message',
    ];

    protected $casts = [
        'signature_valid' => 'boolean',
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<CourierProvider, $this>
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(CourierProvider::class, 'courier_provider_id');
    }
}
