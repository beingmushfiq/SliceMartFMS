<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Warehouse> */
final class WarehouseFactory extends Factory
{
    /** @var class-string<Warehouse> */
    protected $model = Warehouse::class;

    /** @return array<model-property<Warehouse>, mixed> */
    public function definition(): array
    {
        return ['uuid' => (string) Str::uuid(), 'code' => 'WH-'.fake()->unique()->numberBetween(100, 999), 'name' => 'Warehouse '.fake()->unique()->numberBetween(1, 999), 'type' => 'general', 'address' => null, 'is_default' => false, 'allows_negative_stock' => false, 'is_active' => true];
    }
}
