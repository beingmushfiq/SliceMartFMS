<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Storefront extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use SoftDeletes;

    protected $table = 'storefronts';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'code',
        'name',
        'domain',
        'subdomain',
        'company_id',
        'default_branch_id',
        'default_warehouse_id',
        'price_list_id',
        'currency',
        'locale',
        'theme',
        'logo_attachment_id',
        'favicon_attachment_id',
        'meta_title',
        'meta_description',
        'guest_checkout_enabled',
        'cod_enabled',
        'online_payment_enabled',
        'whatsapp_number',
        'whatsapp_ordering_enabled',
        'whatsapp_default_message',
        'min_order_amount',
        'status',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'theme' => 'array',
        'guest_checkout_enabled' => 'boolean',
        'cod_enabled' => 'boolean',
        'online_payment_enabled' => 'boolean',
        'whatsapp_ordering_enabled' => 'boolean',
        'min_order_amount' => 'decimal:4',
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Storefront $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'default_branch_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'default_warehouse_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(StorefrontProduct::class);
    }

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }
}
