<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TaxProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<TaxProfile> */
final class TaxProfileFactory extends Factory
{
    /** @var class-string<TaxProfile> */
    protected $model = TaxProfile::class;

    /** @return array<model-property<TaxProfile>, mixed> */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'code' => 'TX'.fake()->unique()->numberBetween(1000, 9999),
            'name' => ucfirst(fake()->unique()->word()),
            'rate' => '15.0000',
            'type' => 'exclusive',
            'is_compound' => false,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
