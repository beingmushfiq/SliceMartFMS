<?php

declare(strict_types=1);

namespace App\Modules\Sales\Actions;

use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateSalesOrderAction
{
    /**
     * @param array{
     *     tenant_id: int,
     *     order_date: string,
     *     channel?: string,
     *     company_id?: int|null,
     *     branch_id?: int|null,
     *     warehouse_id?: int|null,
     *     party_id?: int|null,
     *     customer_name?: string|null,
     *     customer_phone?: string|null,
     *     pos_session_id?: int|null,
     *     required_date?: string|null,
     *     price_list_id?: int|null,
     *     currency_code?: string,
     *     shipping_amount?: string,
     *     round_off?: string,
     *     delivery_type?: string,
     *     salesperson_id?: int|null,
     *     notes?: string|null,
     *     internal_notes?: string|null,
     *     created_by?: int|null,
     *     order_number?: string,
     *     items: list<array{
     *         product_id: int,
     *         quantity: string,
     *         unit_id: int,
     *         unit_price: string,
     *         variant_id?: int|null,
     *         description?: string|null,
     *         discount_percentage?: string,
     *         discount_amount?: string,
     *         tax_profile_id?: int|null,
     *         tax_amount?: string,
     *         batch_code?: string|null,
     *         sort_order?: int
     *     }>
     * } $data
     */
    public function execute(array $data): SalesOrder
    {
        return DB::transaction(function () use ($data): SalesOrder {
            $orderNumber = $data['order_number'] ?? ('SO-' . date('Ymd') . '-' . strtoupper(Str::random(6)));

            /** @var numeric-string $grossSubtotal */
            $grossSubtotal = '0.0000';
            $processedItems = [];

            // Pass 1: calculate gross line amounts and line-level discounts
            foreach ($data['items'] as $idx => $item) {
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
                    'idx' => $idx,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'line_gross' => $lineGross,
                    'line_disc' => $lineDisc,
                    'disc_pct' => $discPct,
                    'line_net' => $lineNet,
                ];
            }

            // Calculate net subtotal after item-level discounts
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

            // Calculate order-level discount
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

            // Pass 2: Allocate order discount proportionally to each item
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

                $taxAmt = isset($pi['item']['tax_amount']) && is_numeric($pi['item']['tax_amount']) ? (string) $pi['item']['tax_amount'] : '0.0000';
                $lineTotal = bcadd($lineNetAfterAllDisc, $taxAmt, 4);

                $totalDiscount = bcadd($totalDiscount, $totalLineDisc, 4);
                $totalTax = bcadd($totalTax, $taxAmt, 4);

                $finalItems[] = array_merge($pi, [
                    'allocated_order_disc' => $allocatedOrderDisc,
                    'total_line_disc' => $totalLineDisc,
                    'line_net_final' => $lineNetAfterAllDisc,
                    'tax_amount' => $taxAmt,
                    'line_total' => $lineTotal,
                ]);
            }

            /** @var numeric-string $shipping */
            $shipping = isset($data['shipping_amount']) && is_numeric($data['shipping_amount']) ? (string) $data['shipping_amount'] : '0.0000';
            /** @var numeric-string $roundOff */
            $roundOff = isset($data['round_off']) && is_numeric($data['round_off']) ? (string) $data['round_off'] : '0.0000';
            /** @var numeric-string $grandTotal */
            $grandTotal = bcadd(bcadd(bcsub(bcadd($grossSubtotal, $totalTax, 4), $totalDiscount, 4), $shipping, 4), $roundOff, 4);

            $order = SalesOrder::create([
                'tenant_id'       => $data['tenant_id'],
                'order_number'    => $orderNumber,
                'channel'         => $data['channel'] ?? 'counter',
                'company_id'      => $data['company_id'] ?? null,
                'branch_id'       => $data['branch_id'] ?? null,
                'warehouse_id'    => $data['warehouse_id'] ?? null,
                'party_id'        => $data['party_id'] ?? null,
                'customer_name'   => $data['customer_name'] ?? null,
                'customer_phone'  => $data['customer_phone'] ?? null,
                'pos_session_id'  => $data['pos_session_id'] ?? null,
                'order_date'      => $data['order_date'],
                'required_date'   => $data['required_date'] ?? null,
                'price_list_id'   => $data['price_list_id'] ?? null,
                'currency_code'   => $data['currency_code'] ?? 'BDT',
                'subtotal'        => $grossSubtotal,
                'discount_amount' => $totalDiscount,
                'tax_amount'      => $totalTax,
                'shipping_amount' => $shipping,
                'round_off'       => $roundOff,
                'total_amount'    => $grandTotal,
                'paid_amount'     => '0.0000',
                'due_amount'      => $grandTotal,
                'delivery_type'   => $data['delivery_type'] ?? 'pickup',
                'status'          => 'draft',
                'payment_status'  => 'unpaid',
                'salesperson_id'  => $data['salesperson_id'] ?? null,
                'notes'           => $data['notes'] ?? null,
                'internal_notes'  => $data['internal_notes'] ?? null,
                'created_by'      => $data['created_by'] ?? null,
            ]);

            foreach ($finalItems as $fi) {
                SalesOrderItem::create([
                    'tenant_id'           => $data['tenant_id'],
                    'sales_order_id'      => $order->id,
                    'product_id'          => $fi['item']['product_id'],
                    'variant_id'          => $fi['item']['variant_id'] ?? null,
                    'description'         => $fi['item']['description'] ?? null,
                    'quantity'            => $fi['quantity'],
                    'unit_id'             => $fi['item']['unit_id'],
                    'unit_price'          => $fi['unit_price'],
                    'discount_percentage' => $fi['disc_pct'],
                    'discount_amount'     => $fi['total_line_disc'],
                    'tax_profile_id'      => $fi['item']['tax_profile_id'] ?? null,
                    'tax_amount'          => $fi['tax_amount'],
                    'line_total'          => $fi['line_total'],
                    'delivered_quantity'  => '0.0000',
                    'returned_quantity'   => '0.0000',
                    'batch_code'          => $fi['item']['batch_code'] ?? null,
                    'sort_order'          => $fi['item']['sort_order'] ?? $fi['idx'],
                    'created_by'          => $data['created_by'] ?? null,
                ]);
            }

            return $order->load(['items.product', 'items.unit', 'customer', 'warehouse']);
        });
    }
}
