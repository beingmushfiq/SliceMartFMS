<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PriceList;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PriceList> */
final class PriceListFactory extends Factory
{
    /** @var class-string<PriceList> */
    protected $model = PriceList::class;

    /** @return array<model-property<PriceList>, mixed> */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'code' => 'PL'.fake()->unique()->numberBetween(1000, 9999),
            'name' => ucfirst(fake()->unique()->words(2, true)),
            'currency_code' => 'BDT',
            'applies_to' => 'all',
            'channel' => null,
            'priority' => 0,
            'valid_from' => null,
            'valid_to' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
