<?php

declare(strict_types=1);

namespace App\Modules\Documents\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int|null $tenant_id
 * @property string $uuid
 * @property string $code
 * @property string $name
 * @property string $width_mm
 * @property string|null $height_mm
 * @property string $unit
 * @property string $orientation_default
 * @property string $margin_top_mm
 * @property string $margin_bottom_mm
 * @property string $margin_left_mm
 * @property string $margin_right_mm
 * @property bool $is_builtin
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
final class PaperSize extends Model
{
    use SoftDeletes;

    protected $table = 'paper_sizes';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'uuid',
        'code',
        'name',
        'width_mm',
        'height_mm',
        'unit',
        'orientation_default',
        'margin_top_mm',
        'margin_bottom_mm',
        'margin_left_mm',
        'margin_right_mm',
        'is_builtin',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'width_mm'         => 'decimal:2',
        'height_mm'        => 'decimal:2',
        'margin_top_mm'    => 'decimal:2',
        'margin_bottom_mm' => 'decimal:2',
        'margin_left_mm'   => 'decimal:2',
        'margin_right_mm'  => 'decimal:2',
        'is_builtin'       => 'boolean',
        'is_active'        => 'boolean',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
        'deleted_at'       => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(static function (PaperSize $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
