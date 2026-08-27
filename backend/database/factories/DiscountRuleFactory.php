<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\DiscountRule;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<DiscountRule> */
final class DiscountRuleFactory extends Factory
{
    /** @var class-string<DiscountRule> */
    protected $model = DiscountRule::class;

    /** @return array<model-property<DiscountRule>, mixed> */
    public function definition(): array
    {
        $words = fake()->unique()->words(2);
        $name = is_array($words) ? implode(' ', $words) : (string) $words;

        return [
            'uuid' => (string) Str::uuid(),
            'name' => ucfirst($name),
            'scope' => 'order',
            'scope_id' => null,
            'condition' => null,
            'discount_type' => 'percentage',
            'value' => '10.0000',
            'valid_from' => null,
            'valid_to' => null,
            'priority' => 0,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
