<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
final class CategoryFactory extends Factory
{
    /** @var class-string<Category> */
    protected $model = Category::class;

    /** @return array<model-property<Category>, mixed> */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'parent_id' => null,
            'code' => 'C'.fake()->unique()->numberBetween(1000, 9999),
            'name' => ucfirst(fake()->unique()->word()),
            'path' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
