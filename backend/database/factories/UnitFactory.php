<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Unit;
use App\Modules\Catalogue\Enums\UnitType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Unit>
 */
final class UnitFactory extends Factory
{
    /** @var class-string<Unit> */
    protected $model = Unit::class;

    /**
     * Default state for a tenant-scoped unit.
     *
     * `tenant_id` is intentionally omitted: it is guarded on the model and
     * stamped by BelongsToTenant from the bound TenantContext, so tests must
     * bind a context (or the row is created within a request that has one).
     *
     * @return array<model-property<Unit>, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'code' => 'U'.fake()->unique()->numberBetween(1000, 9999),
            'name' => ucfirst(fake()->unique()->word()),
            'type' => fake()->randomElement(UnitType::values()),
            'is_base' => false,
            'precision' => 2,
            'is_active' => true,
        ];
    }

    /**
     * A base unit for its measurement family.
     */
    public function base(): static
    {
        return $this->state(static fn (): array => ['is_base' => true]);
    }

    /**
     * A soft-disabled unit (still visible, not selectable for new records).
     */
    public function inactive(): static
    {
        return $this->state(static fn (): array => ['is_active' => false]);
    }
}
