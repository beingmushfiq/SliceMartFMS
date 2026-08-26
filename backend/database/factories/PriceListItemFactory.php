<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PriceListItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PriceListItem> */
final class PriceListItemFactory extends Factory
{
    /** @var class-string<PriceListItem> */
    protected $model = PriceListItem::class;

    /** @return array<model-property<PriceListItem>, mixed> */
    public function definition(): array
    {
        return ['price_list_id' => 1, 'product_id' => 1, 'variant_id' => null, 'min_quantity' => '1.0000', 'unit_price' => '10.0000', 'discount_percentage' => '0.0000'];
    }
}
