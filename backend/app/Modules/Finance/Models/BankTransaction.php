<?php

declare(strict_types=1);

namespace App\Modules\Finance\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class BankTransaction extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'bank_transactions';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'company_id',
        'bank_account_id',
        'transaction_date',
        'transaction_type',
        'amount',
        'balance_after',
        'reference_number',
        'description',
        'reconciled',
        'reconciled_at',
        'journal_entry_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transaction_date' => 'date:Y-m-d',
        'amount' => 'string',
        'balance_after' => 'string',
        'reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (BankTransaction $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return BelongsTo<BankAccount, $this>
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }

    /**
     * @return BelongsTo<JournalEntry, $this>
     */
    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
