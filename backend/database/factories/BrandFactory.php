<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Brand>
 */
final class BrandFactory extends Factory
{
    /** @var class-string<Brand> */
    protected $model = Brand::class;

    /**
     * @return array<model-property<Brand>, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'code' => 'B'.fake()->unique()->numberBetween(1000, 9999),
            'name' => ucfirst(fake()->unique()->company()),
            'logo_path' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
