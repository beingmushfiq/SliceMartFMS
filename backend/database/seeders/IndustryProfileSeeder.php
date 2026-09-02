<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\IndustryProfile;
use Illuminate\Database\Seeder;

final class IndustryProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'key' => 'general_manufacturing',
                'label' => 'General Manufacturing & Assembly',
                'business_type_keys' => ['manufacturing', 'wholesale'],
                'description' => 'Standard discrete or process manufacturing with multi-stage assembly and QC checks.',
                'icon' => 'Factory',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'finance', 'assets', 'reports', 'hr'],
                'default_terminology' => [
                    'raw_material' => 'Raw Material',
                    'finished_good' => 'Finished Good',
                    'production' => 'Production',
                    'bom' => 'Bill of Materials',
                    'warehouse' => 'Warehouse',
                    'worker' => 'Worker / Operator',
                ],
                'default_production_stages' => [
                    ['key' => 'material_prep', 'label' => 'Material Preparation', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'assembly', 'label' => 'Assembly & Fabrication', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'finishing', 'label' => 'Finishing & Treatment', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'qc_inspection', 'label' => 'Quality Inspection', 'sort_order' => 4, 'is_qc_stage' => true],
                    ['key' => 'packaging', 'label' => 'Packaging & Boxing', 'sort_order' => 5, 'is_qc_stage' => false],
                ],
                'default_units' => ['PCS', 'KG', 'BOX', 'SET'],
                'qc_template_config' => [
                    ['name' => 'Visual Inspection', 'input_type' => 'pass_fail', 'is_required' => true],
                    ['name' => 'Dimensional Check', 'input_type' => 'measurement', 'is_required' => true],
                    ['name' => 'Packaging Integrity', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'material', 'label' => 'Primary Material', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'dimensions', 'label' => 'Dimensions (L×W×H)', 'field_type' => 'text'],
                ],
                'sort_order' => 1,
            ],
            [
                'key' => 'food_production',
                'label' => 'Food Processing & Beverages',
                'business_type_keys' => ['manufacturing', 'wholesale', 'retail'],
                'description' => 'Recipe-based process manufacturing with strict batch tracking, expiry dates, and food safety QC.',
                'icon' => 'Utensils',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'finance', 'delivery', 'reports'],
                'default_terminology' => [
                    'raw_material' => 'Ingredient',
                    'finished_good' => 'Packaged Food',
                    'production' => 'Processing / Batching',
                    'bom' => 'Recipe / Formulation',
                    'warehouse' => 'Cold Storage / Pantry',
                    'worker' => 'Food Operator',
                ],
                'default_production_stages' => [
                    ['key' => 'prep_mixing', 'label' => 'Preparation & Mixing', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'processing', 'label' => 'Cooking / Processing', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'cooling', 'label' => 'Cooling & Stabilization', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'lab_qc', 'label' => 'Food Safety & Hygiene QC', 'sort_order' => 4, 'is_qc_stage' => true],
                    ['key' => 'packaging_labeling', 'label' => 'Packaging & Batch Labeling', 'sort_order' => 5, 'is_qc_stage' => false],
                ],
                'default_units' => ['KG', 'GM', 'LTR', 'ML', 'PACK', 'CARTON'],
                'qc_template_config' => [
                    ['name' => 'Temperature Check (°C)', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'Taste & Aroma Evaluation', 'input_type' => 'pass_fail', 'is_required' => true],
                    ['name' => 'Seal & Expiry Label Check', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'initial_stock', 'label' => 'Opening / Initial Stock', 'field_type' => 'number'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'storage_temperature', 'label' => 'Storage Temp (°C)', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'allergens', 'label' => 'Allergen Warning', 'field_type' => 'text'],
                ],
                'sort_order' => 2,
            ],
            [
                'key' => 'bakery',
                'label' => 'Bakery & Confectionery',
                'business_type_keys' => ['manufacturing', 'retail', 'pos'],
                'description' => 'High-velocity daily batches, oven schedules, fresh delivery, and direct POS outlet counters.',
                'icon' => 'Cake',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'pos', 'qc', 'finance', 'delivery'],
                'default_terminology' => [
                    'raw_material' => 'Baking Ingredient',
                    'finished_good' => 'Baked Good',
                    'production' => 'Baking Batch',
                    'bom' => 'Baking Formula',
                    'warehouse' => 'Store / Kitchen',
                    'worker' => 'Baker',
                ],
                'default_production_stages' => [
                    ['key' => 'dough_mixing', 'label' => 'Ingredient Scaling & Mixing', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'fermentation', 'label' => 'Proofing / Fermentation', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'baking', 'label' => 'Baking / Oven Processing', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'finishing_icing', 'label' => 'Cooling & Decoration', 'sort_order' => 4, 'is_qc_stage' => false],
                    ['key' => 'packing', 'label' => 'Packaging & Counter Dispatch', 'sort_order' => 5, 'is_qc_stage' => true],
                ],
                'default_units' => ['PCS', 'KG', 'PACK', 'DOZEN'],
                'qc_template_config' => [
                    ['name' => 'Crust & Color Bake Check', 'input_type' => 'pass_fail', 'is_required' => true],
                    ['name' => 'Weight Verification (g)', 'input_type' => 'numeric', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'flavor', 'label' => 'Flavor', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'dietary_flags', 'label' => 'Dietary (Veg/Eggless/Sugar-free)', 'field_type' => 'text'],
                ],
                'sort_order' => 3,
            ],
            [
                'key' => 'garments',
                'label' => 'Garments, Apparel & Textile',
                'business_type_keys' => ['manufacturing', 'wholesale', 'ecommerce'],
                'description' => 'Piece-rate production, line worker efficiency tracking, fabric rolls, cutting, sewing, and size/color matrices.',
                'icon' => 'Shirt',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'hr', 'finance', 'ecommerce', 'reports'],
                'default_terminology' => [
                    'raw_material' => 'Fabric & Trims',
                    'finished_good' => 'Garment / Apparel',
                    'production' => 'Sewing Floor',
                    'bom' => 'Style Tech Pack / BOM',
                    'warehouse' => 'Fabric Godown / Finished Store',
                    'worker' => 'Sewing Operator',
                ],
                'default_production_stages' => [
                    ['key' => 'cutting', 'label' => 'Pattern Cutting', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'sewing', 'label' => 'Sewing & Assembly', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'washing', 'label' => 'Washing / Dyeing', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'ironing_finishing', 'label' => 'Ironing & Thread Trimming', 'sort_order' => 4, 'is_qc_stage' => false],
                    ['key' => 'qc_audit', 'label' => '100% Quality Inspection', 'sort_order' => 5, 'is_qc_stage' => true],
                    ['key' => 'poly_packing', 'label' => 'Polybag Packing & Tagging', 'sort_order' => 6, 'is_qc_stage' => false],
                ],
                'default_units' => ['PCS', 'DOZEN', 'METER', 'YARD', 'ROLL', 'SET'],
                'qc_template_config' => [
                    ['name' => 'Measurement Tolerance (cm)', 'input_type' => 'measurement', 'is_required' => true],
                    ['name' => 'Stitch Density & Seam Integrity', 'input_type' => 'pass_fail', 'is_required' => true],
                    ['name' => 'Stain & Shade Variation Check', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'gsm', 'label' => 'Fabric GSM', 'field_type' => 'number'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'fabric_composition', 'label' => 'Fabric Composition', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'color_shade', 'label' => 'Color Code / Shade', 'field_type' => 'text'],
                ],
                'sort_order' => 4,
            ],
            [
                'key' => 'electronics_assembly',
                'label' => 'Electronics & Electrical Hardware',
                'business_type_keys' => ['manufacturing', 'wholesale', 'ecommerce'],
                'description' => 'Component level BOMs, serial number tracking, voltage/power bench testing, and warranty management.',
                'icon' => 'Cpu',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'assets', 'finance', 'ecommerce', 'reports'],
                'default_terminology' => [
                    'raw_material' => 'Electronic Component',
                    'finished_good' => 'Electronic Device',
                    'production' => 'SMT / Assembly Line',
                    'bom' => 'Component BOM',
                    'warehouse' => 'ESD Warehouse',
                    'worker' => 'Technician / Solderer',
                ],
                'default_production_stages' => [
                    ['key' => 'pcb_smt', 'label' => 'PCB Prep & SMT Assembly', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'housing_assembly', 'label' => 'Enclosure Assembly & Cabling', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'firmware_burn', 'label' => 'Firmware Flashing & Config', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'electrical_testing', 'label' => 'Voltage & High-Pot Test', 'sort_order' => 4, 'is_qc_stage' => true],
                    ['key' => 'burn_in', 'label' => 'Burn-In Stress Testing', 'sort_order' => 5, 'is_qc_stage' => true],
                    ['key' => 'final_pack', 'label' => 'Serial Tagging & Box Packing', 'sort_order' => 6, 'is_qc_stage' => false],
                ],
                'default_units' => ['PCS', 'SET', 'BOX', 'REEL'],
                'qc_template_config' => [
                    ['name' => 'Operating Voltage (V)', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'Current Draw (mA)', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'High-Pot Insulation Test', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'voltage_rating', 'label' => 'Voltage Rating (V)', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'power_watts', 'label' => 'Power Consumption (W)', 'field_type' => 'number'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'warranty_months', 'label' => 'Warranty Period (Months)', 'field_type' => 'number'],
                ],
                'sort_order' => 5,
            ],
            [
                'key' => 'furniture_woodworking',
                'label' => 'Furniture & Woodworking',
                'business_type_keys' => ['manufacturing', 'wholesale', 'retail', 'ecommerce'],
                'description' => 'Cutting, CNC routing, joinery, polishing, upholstery, and freight delivery logistics.',
                'icon' => 'Armchair',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'delivery', 'finance', 'ecommerce'],
                'default_terminology' => [
                    'raw_material' => 'Lumber / Hardware',
                    'finished_good' => 'Furniture Unit',
                    'production' => 'Carpentry Workshop',
                    'bom' => 'Cutting & Hardware List',
                    'warehouse' => 'Timber Yard / Showroom Store',
                    'worker' => 'Craftsman / Carpenter',
                ],
                'default_production_stages' => [
                    ['key' => 'timber_cutting', 'label' => 'Timber Sizing & CNC Cutting', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'joinery_assembly', 'label' => 'Joinery & Frame Assembly', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'sanding_polishing', 'label' => 'Sanding, Staining & Polish', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'upholstery', 'label' => 'Cushioning & Upholstery', 'sort_order' => 4, 'is_qc_stage' => false],
                    ['key' => 'qc_finish_check', 'label' => 'Structural & Finish QC', 'sort_order' => 5, 'is_qc_stage' => true],
                    ['key' => 'protective_wrapping', 'label' => 'Protective Foam Wrapping', 'sort_order' => 6, 'is_qc_stage' => false],
                ],
                'default_units' => ['PCS', 'SET', 'CFT', 'SQFT'],
                'qc_template_config' => [
                    ['name' => 'Moisture Content (%)', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'Joint Stability & Level Check', 'input_type' => 'pass_fail', 'is_required' => true],
                    ['name' => 'Lacquer Scratch Resistance', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'wood_type', 'label' => 'Wood / Material Type', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'finish_type', 'label' => 'Finish / Coating', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'assembly_required', 'label' => 'Knockdown / Assembly Required', 'field_type' => 'boolean'],
                ],
                'sort_order' => 6,
            ],
            [
                'key' => 'chemical_plastics',
                'label' => 'Chemicals, Plastics & Packaging',
                'business_type_keys' => ['manufacturing', 'wholesale'],
                'description' => 'Formula compounding, extrusion, injection molding, batch lab analysis, and material density calculations.',
                'icon' => 'FlaskConical',
                'recommended_modules' => ['production', 'inventory', 'purchasing', 'sales', 'qc', 'assets', 'finance', 'reports'],
                'default_terminology' => [
                    'raw_material' => 'Resin / Chemical Compound',
                    'finished_good' => 'Finished Mold / Polymer Product',
                    'production' => 'Extrusion / Molding Line',
                    'bom' => 'Chemical Recipe / Blend Ratio',
                    'warehouse' => 'Chemical Silo / Granule Store',
                    'worker' => 'Machine Operator',
                ],
                'default_production_stages' => [
                    ['key' => 'compounding', 'label' => 'Raw Compounding & Blending', 'sort_order' => 1, 'is_qc_stage' => false],
                    ['key' => 'heating_extrusion', 'label' => 'Heating & Extrusion / Molding', 'sort_order' => 2, 'is_qc_stage' => false],
                    ['key' => 'cooling_curing', 'label' => 'Cooling & Curing', 'sort_order' => 3, 'is_qc_stage' => false],
                    ['key' => 'lab_testing', 'label' => 'Lab Density & Tensile QC', 'sort_order' => 4, 'is_qc_stage' => true],
                    ['key' => 'palletizing', 'label' => 'Bagging / Palletizing', 'sort_order' => 5, 'is_qc_stage' => false],
                ],
                'default_units' => ['KG', 'TON', 'LTR', 'BAG', 'ROLL', 'PCS'],
                'qc_template_config' => [
                    ['name' => 'Density / Specific Gravity', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'Melt Flow Index (MFI)', 'input_type' => 'numeric', 'is_required' => true],
                    ['name' => 'Color Opacity & Clarity', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'chemical_cas_number', 'label' => 'CAS Number / Polymer Grade', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'density', 'label' => 'Density (g/cm³)', 'field_type' => 'number'],
                ],
                'sort_order' => 7,
            ],
            [
                'key' => 'trading_distribution',
                'label' => 'Trading, Wholesale & Distribution (No In-House Factory)',
                'business_type_keys' => ['wholesale', 'trading', 'ecommerce'],
                'description' => 'Fast-moving distribution without production module. Pure purchasing, stock transfers, multi-warehouse, sales orders, and logistics.',
                'icon' => 'Truck',
                'recommended_modules' => ['inventory', 'purchasing', 'sales', 'pos', 'delivery', 'finance', 'reports', 'ecommerce'],
                'default_terminology' => [
                    'raw_material' => 'Purchased Stock',
                    'finished_good' => 'Commercial Product',
                    'production' => 'N/A',
                    'bom' => 'Bundle / Kit Definition',
                    'warehouse' => 'Distribution Center',
                    'worker' => 'Warehouse Staff',
                ],
                'default_production_stages' => [],
                'default_units' => ['PCS', 'BOX', 'CARTON', 'PACK', 'DOZEN'],
                'qc_template_config' => [
                    ['name' => 'Goods Receipt Inbound QC', 'input_type' => 'pass_fail', 'is_required' => true],
                ],
                'default_custom_fields' => [
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'hs_code', 'label' => 'HS Tariff Code', 'field_type' => 'text'],
                    ['module' => 'catalogue', 'entity' => 'product', 'internal_key' => 'origin_country', 'label' => 'Country of Origin', 'field_type' => 'text'],
                ],
                'sort_order' => 8,
            ],
        ];

        foreach ($profiles as $profile) {
            IndustryProfile::updateOrCreate(
                ['key' => $profile['key']],
                [
                    'label' => $profile['label'],
                    'business_type_keys' => $profile['business_type_keys'],
                    'description' => $profile['description'],
                    'icon' => $profile['icon'],
                    'recommended_modules' => $profile['recommended_modules'],
                    'default_terminology' => $profile['default_terminology'],
                    'default_production_stages' => $profile['default_production_stages'],
                    'default_units' => $profile['default_units'],
                    'qc_template_config' => $profile['qc_template_config'],
                    'default_custom_fields' => $profile['default_custom_fields'],
                    'sort_order' => $profile['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
