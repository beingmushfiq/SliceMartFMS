<?php

declare(strict_types=1);

namespace App\Modules\Finance\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class BankAccount extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'bank_accounts';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'company_id',
        'account_name',
        'account_number',
        'bank_name',
        'branch_name',
        'routing_number',
        'swift_code',
        'chart_of_account_id',
        'currency_code',
        'opening_balance',
        'current_balance',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'opening_balance' => 'string',
        'current_balance' => 'string',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (BankAccount $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return BelongsTo<ChartOfAccount, $this>
     */
    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'chart_of_account_id');
    }

    /**
     * @return HasMany<BankTransaction, $this>
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class, 'bank_account_id');
    }
}
