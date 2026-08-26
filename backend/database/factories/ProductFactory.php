<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
final class ProductFactory extends Factory
{
    /** @var class-string<Product> */
    protected $model = Product::class;

    /** @return array<model-property<Product>, mixed> */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'sku' => 'SKU-'.fake()->unique()->numberBetween(10000, 99999),
            'barcode' => null,
            'name' => ucfirst(fake()->unique()->word()),
            'type' => 'finished',
            'base_unit_id' => 1,
            'is_stock_tracked' => true,
            'tracking_mode' => 'none',
            'standard_cost' => '0.0000',
            'default_sale_price' => '0.0000',
            'status' => 'draft',
        ];
    }
}
