<?php

declare(strict_types=1);

namespace App\Modules\Sales\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncentivePolicyRule extends Model
{
    use BelongsToTenant;

    protected $table = 'incentive_policy_rules';

    protected $fillable = [
        'tenant_id',
        'incentive_policy_id',
        'min_pct',
        'max_pct',
        'incentive_type',
        'incentive_value',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'min_pct' => 'decimal:2',
        'max_pct' => 'decimal:2',
        'incentive_value' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(IncentivePolicy::class, 'incentive_policy_id');
    }
}
