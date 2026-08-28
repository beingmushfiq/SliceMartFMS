<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Branch extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'branches';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'company_id',
        'code',
        'name',
        'type',
        'address',
        'phone',
        'is_default',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (Branch $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }
}
