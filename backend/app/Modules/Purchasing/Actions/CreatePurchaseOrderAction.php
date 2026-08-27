<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Actions;

use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreatePurchaseOrderAction
{
    /**
     * @param array{
     *     tenant_id: int,
     *     party_id: int,
     *     warehouse_id: int,
     *     order_date: string,
     *     po_number?: string,
     *     expected_date?: string|null,
     *     expected_delivery_date?: string|null,
     *     currency_code?: string,
     *     exchange_rate?: string,
     *     notes?: string|null,
     *     terms?: string|null,
     *     terms_and_conditions?: string|null,
     *     created_by?: int|null,
     *     items: list<array{
     *         product_id: int,
     *         quantity: string,
     *         unit_id: int,
     *         unit_price: string,
     *         variant_id?: int|null,
     *         discount_amount?: string,
     *         tax_profile_id?: int|null,
     *         tax_rate?: string,
     *         expected_date?: string|null,
     *         notes?: string|null
     *     }>
     * } $data
     */
    public function execute(array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data): PurchaseOrder {
            $poNumber = $data['po_number'] ?? ('PO-' . date('Ymd') . '-' . strtoupper(Str::random(6)));

            /** @var numeric-string $subtotal */
            $subtotal = '0.0000';
            /** @var numeric-string $totalTax */
            $totalTax = '0.0000';
            /** @var numeric-string $totalDiscount */
            $totalDiscount = '0.0000';

            // Calculate totals first
            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity']) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price']) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $taxR */
                $taxR = isset($item['tax_rate']) && is_numeric($item['tax_rate']) ? (string) $item['tax_rate'] : '0.0000';

                /** @var numeric-string $lineSub */
                $lineSub = bcmul($qty, $price, 4);
                /** @var numeric-string $lineNet */
                $lineNet = bcsub($lineSub, $disc, 4);
                /** @var numeric-string $lineTax */
                $lineTax = bcmul($lineNet, bcdiv($taxR, '100.0000', 6), 4);

                $subtotal = bcadd($subtotal, $lineSub, 4);
                $totalDiscount = bcadd($totalDiscount, $disc, 4);
                $totalTax = bcadd($totalTax, $lineTax, 4);
            }

            /** @var numeric-string $grandTotal */
            $grandTotal = bcadd(bcsub($subtotal, $totalDiscount, 4), $totalTax, 4);

            $order = PurchaseOrder::create([
                'tenant_id' => $data['tenant_id'],
                'po_number' => $poNumber,
                'party_id' => $data['party_id'],
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? $data['expected_delivery_date'] ?? null,
                'status' => 'draft',
                'currency_code' => $data['currency_code'] ?? 'BDT',
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'discount_amount' => $totalDiscount,
                'total_amount' => $grandTotal,
                'received_value' => '0.0000',
                'billed_value' => '0.0000',
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? $data['terms_and_conditions'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity']) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price']) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $taxR */
                $taxR = isset($item['tax_rate']) && is_numeric($item['tax_rate']) ? (string) $item['tax_rate'] : '0.0000';

                /** @var numeric-string $lineSub */
                $lineSub = bcmul($qty, $price, 4);
                /** @var numeric-string $lineNet */
                $lineNet = bcsub($lineSub, $disc, 4);
                /** @var numeric-string $lineTax */
                $lineTax = bcmul($lineNet, bcdiv($taxR, '100.0000', 6), 4);
                /** @var numeric-string $lineTotal */
                $lineTotal = bcadd($lineNet, $lineTax, 4);

                PurchaseOrderItem::create([
                    'tenant_id' => $data['tenant_id'],
                    'purchase_order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?? null,
                    'quantity' => $qty,
                    'received_quantity' => '0.0000',
                    'billed_quantity' => '0.0000',
                    'unit_id' => $item['unit_id'],
                    'unit_price' => $price,
                    'discount_amount' => $disc,
                    'tax_profile_id' => $item['tax_profile_id'] ?? null,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                    'created_by' => $data['created_by'] ?? null,
                ]);
            }

            return $order->load(['items.product', 'items.unit', 'supplier', 'warehouse']);
        });
    }
}
