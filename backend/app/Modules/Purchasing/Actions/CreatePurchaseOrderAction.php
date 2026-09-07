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

            /** @var numeric-string $grossSubtotal */
            $grossSubtotal = '0.0000';
            $processedItems = [];

            // Pass 1: compute line gross and line discounts
            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity'] ?? null) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price'] ?? null) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $lineGross */
                $lineGross = bcmul($qty, $price, 4);

                $discType = $item['discount_type'] ?? 'flat';
                $discVal = is_numeric($item['discount_value'] ?? null) ? (string) $item['discount_value'] : (is_numeric($item['discount_amount'] ?? null) ? (string) $item['discount_amount'] : '0.0000');
                $discPct = is_numeric($item['discount_percentage'] ?? null) ? (string) $item['discount_percentage'] : '0.0000';

                /** @var numeric-string $lineDisc */
                if ($discType === 'percentage' || (bccomp($discPct, '0.0000', 4) > 0 && bccomp($discVal, '0.0000', 4) === 0)) {
                    $pct = bccomp($discPct, '0.0000', 4) > 0 ? $discPct : $discVal;
                    $lineDisc = bcmul($lineGross, bcdiv($pct, '100.0000', 6), 4);
                    $discPct = $pct;
                } else {
                    $lineDisc = $discVal;
                    $discPct = bccomp($lineGross, '0.0000', 4) > 0 ? bcmul(bcdiv($lineDisc, $lineGross, 6), '100.0000', 4) : '0.0000';
                }

                if (bccomp($lineDisc, $lineGross, 4) > 0) {
                    $lineDisc = $lineGross;
                }

                /** @var numeric-string $lineNet */
                $lineNet = bcsub($lineGross, $lineDisc, 4);
                $grossSubtotal = bcadd($grossSubtotal, $lineGross, 4);

                $processedItems[] = [
                    'item' => $item,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'line_gross' => $lineGross,
                    'line_disc' => $lineDisc,
                    'disc_pct' => $discPct,
                    'line_net' => $lineNet,
                ];
            }

            // Net subtotal before order discount
            /** @var numeric-string $netSubtotalBeforeOrderDisc */
            $netSubtotalBeforeOrderDisc = '0.0000';
            foreach ($processedItems as $pi) {
                $netSubtotalBeforeOrderDisc = bcadd($netSubtotalBeforeOrderDisc, $pi['line_net'], 4);
            }

            // Total line discounts sum
            $totalLineDiscounts = '0.0000';
            foreach ($processedItems as $pi) {
                $totalLineDiscounts = bcadd($totalLineDiscounts, $pi['line_disc'], 4);
            }

            // Order-level discount
            $orderDiscType = $data['order_discount_type'] ?? 'flat';
            $orderDiscountAmount = '0.0000';

            if ($orderDiscType === 'percentage') {
                $orderPct = is_numeric($data['order_discount_value'] ?? null)
                    ? (string) $data['order_discount_value']
                    : (is_numeric($data['order_discount_percentage'] ?? null) ? (string) $data['order_discount_percentage'] : '0.0000');
                $orderDiscountAmount = bcmul($netSubtotalBeforeOrderDisc, bcdiv($orderPct, '100.0000', 6), 4);
            } elseif (isset($data['order_discount_value']) && is_numeric($data['order_discount_value'])) {
                $orderDiscountAmount = (string) $data['order_discount_value'];
            } elseif (isset($data['discount_amount']) && is_numeric($data['discount_amount'])) {
                // If only total discount_amount is provided, subtract line discounts so line discounts are never double-counted!
                $orderDiscountAmount = bcsub((string) $data['discount_amount'], $totalLineDiscounts, 4);
                if (bccomp($orderDiscountAmount, '0.0000', 4) < 0) {
                    $orderDiscountAmount = '0.0000';
                }
            }

            if (bccomp($orderDiscountAmount, $netSubtotalBeforeOrderDisc, 4) > 0) {
                $orderDiscountAmount = $netSubtotalBeforeOrderDisc;
            }

            // Pass 2: Allocate order discount proportionally
            /** @var numeric-string $totalDiscount */
            $totalDiscount = '0.0000';
            /** @var numeric-string $totalTax */
            $totalTax = '0.0000';
            $finalItems = [];

            foreach ($processedItems as $pi) {
                $allocatedOrderDisc = '0.0000';
                if (bccomp($netSubtotalBeforeOrderDisc, '0.0000', 4) > 0 && bccomp($orderDiscountAmount, '0.0000', 4) > 0) {
                    $ratio = bcdiv($pi['line_net'], $netSubtotalBeforeOrderDisc, 6);
                    $allocatedOrderDisc = bcmul($orderDiscountAmount, $ratio, 4);
                }

                $totalLineDisc = bcadd($pi['line_disc'], $allocatedOrderDisc, 4);
                if (bccomp($totalLineDisc, $pi['line_gross'], 4) > 0) {
                    $totalLineDisc = $pi['line_gross'];
                }

                $lineNetAfterAllDisc = bcsub($pi['line_gross'], $totalLineDisc, 4);

                /** @var numeric-string $taxR */
                $taxR = isset($pi['item']['tax_rate']) && is_numeric($pi['item']['tax_rate']) ? (string) $pi['item']['tax_rate'] : '0.0000';
                /** @var numeric-string $lineTax */
                $lineTax = bcmul($lineNetAfterAllDisc, bcdiv($taxR, '100.0000', 6), 4);
                /** @var numeric-string $lineTotal */
                $lineTotal = bcadd($lineNetAfterAllDisc, $lineTax, 4);

                $totalDiscount = bcadd($totalDiscount, $totalLineDisc, 4);
                $totalTax = bcadd($totalTax, $lineTax, 4);

                $finalItems[] = array_merge($pi, [
                    'allocated_order_disc' => $allocatedOrderDisc,
                    'total_line_disc' => $totalLineDisc,
                    'line_net_final' => $lineNetAfterAllDisc,
                    'line_tax' => $lineTax,
                    'line_total' => $lineTotal,
                ]);
            }

            /** @var numeric-string $grandTotal */
            $grandTotal = bcadd(bcsub($grossSubtotal, $totalDiscount, 4), $totalTax, 4);

            $order = PurchaseOrder::create([
                'tenant_id' => $data['tenant_id'],
                'po_number' => $poNumber,
                'party_id' => $data['party_id'],
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? $data['expected_delivery_date'] ?? null,
                'status' => 'draft',
                'currency_code' => $data['currency_code'] ?? 'BDT',
                'subtotal' => $grossSubtotal,
                'tax_amount' => $totalTax,
                'discount_amount' => $totalDiscount,
                'total_amount' => $grandTotal,
                'received_value' => '0.0000',
                'billed_value' => '0.0000',
                'notes' => $data['notes'] ?? null,
                'terms' => $data['terms'] ?? $data['terms_and_conditions'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            foreach ($finalItems as $fi) {
                PurchaseOrderItem::create([
                    'tenant_id' => $data['tenant_id'],
                    'purchase_order_id' => $order->id,
                    'product_id' => $fi['item']['product_id'],
                    'variant_id' => $fi['item']['variant_id'] ?? null,
                    'quantity' => $fi['quantity'],
                    'received_quantity' => '0.0000',
                    'billed_quantity' => '0.0000',
                    'unit_id' => $fi['item']['unit_id'],
                    'unit_price' => $fi['unit_price'],
                    'discount_percentage' => $fi['disc_pct'],
                    'discount_amount' => $fi['total_line_disc'],
                    'tax_profile_id' => $fi['item']['tax_profile_id'] ?? null,
                    'tax_amount' => $fi['line_tax'],
                    'line_total' => $fi['line_total'],
                    'created_by' => $data['created_by'] ?? null,
                ]);
            }

            return $order->load(['items.product', 'items.unit', 'supplier', 'warehouse']);
        });
    }
}
