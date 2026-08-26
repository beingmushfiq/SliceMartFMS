<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BillOfMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BillOfMaterial> */
final class BillOfMaterialFactory extends Factory
{
    /** @var class-string<BillOfMaterial> */
    protected $model = BillOfMaterial::class;

    /** @return array<model-property<BillOfMaterial>, mixed> */
    public function definition(): array
    {
        return ['uuid' => (string) Str::uuid(), 'product_id' => 1, 'version' => '1', 'name' => 'Default recipe', 'output_quantity' => '1.0000', 'output_unit_id' => 1, 'expected_yield_percentage' => '100.0000', 'status' => 'draft'];
    }
}
