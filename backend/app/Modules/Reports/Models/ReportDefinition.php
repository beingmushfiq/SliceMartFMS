<?php

declare(strict_types=1);

namespace App\Modules\Reports\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ReportDefinition extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'report_definitions';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'code',
        'name',
        'module',
        'category',
        'description',
        'default_filters',
        'available_columns',
        'required_permission',
        'supports_export',
        'tier',
        'summary_table',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'default_filters' => 'array',
        'available_columns' => 'array',
        'supports_export' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function savedViews(): HasMany
    {
        return $this->hasMany(ReportSavedView::class, 'report_definition_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ReportSchedule::class, 'report_definition_id');
    }

    public function exports(): HasMany
    {
        return $this->hasMany(ReportExport::class, 'report_definition_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
