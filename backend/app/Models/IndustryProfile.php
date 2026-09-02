<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndustryProfile extends Model
{
    protected $fillable = [
        'key',
        'label',
        'business_type_keys',
        'description',
        'icon',
        'recommended_modules',
        'default_terminology',
        'default_production_stages',
        'default_units',
        'qc_template_config',
        'default_custom_fields',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'business_type_keys' => 'array',
            'recommended_modules' => 'array',
            'default_terminology' => 'array',
            'default_production_stages' => 'array',
            'default_units' => 'array',
            'qc_template_config' => 'array',
            'default_custom_fields' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
