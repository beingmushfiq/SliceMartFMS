<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BusinessType;
use Illuminate\Database\Seeder;

final class BusinessTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'key' => 'manufacturing',
                'label' => 'Manufacturing & Production',
                'description' => 'Produce, assemble, or process goods from raw materials.',
                'icon' => 'Factory',
                'sort_order' => 1,
            ],
            [
                'key' => 'wholesale',
                'label' => 'Wholesale & B2B Distribution',
                'description' => 'Bulk supply to retailers, dealers, and corporate accounts.',
                'icon' => 'Truck',
                'sort_order' => 2,
            ],
            [
                'key' => 'retail',
                'label' => 'Retail & Outlets (POS)',
                'description' => 'Physical store outlets with direct customer POS checkout.',
                'icon' => 'Store',
                'sort_order' => 3,
            ],
            [
                'key' => 'ecommerce',
                'label' => 'E-commerce & Direct-to-Consumer',
                'description' => 'Online storefronts with direct ordering and parcel delivery.',
                'icon' => 'ShoppingBag',
                'sort_order' => 4,
            ],
            [
                'key' => 'trading',
                'label' => 'Trading & Supply Chain',
                'description' => 'Buying and selling goods without in-house manufacturing.',
                'icon' => 'Coins',
                'sort_order' => 5,
            ],
            [
                'key' => 'service',
                'label' => 'Maintenance & Services',
                'description' => 'Asset servicing, maintenance, and job-order execution.',
                'icon' => 'Cpu',
                'sort_order' => 6,
            ],
            [
                'key' => 'hybrid',
                'label' => 'Hybrid Omnichannel Business',
                'description' => 'Integrated manufacturing, wholesale distribution, retail, and e-commerce.',
                'icon' => 'Layers',
                'sort_order' => 7,
            ],
        ];

        foreach ($types as $type) {
            BusinessType::updateOrCreate(
                ['key' => $type['key']],
                [
                    'label' => $type['label'],
                    'description' => $type['description'],
                    'icon' => $type['icon'],
                    'sort_order' => $type['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
