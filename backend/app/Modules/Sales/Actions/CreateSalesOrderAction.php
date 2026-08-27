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

            /** @var numeric-string $subtotal */
            $subtotal = '0.0000';
            /** @var numeric-string $totalTax */
            $totalTax = '0.0000';
            /** @var numeric-string $totalDiscount */
            $totalDiscount = '0.0000';

            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity']) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price']) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $taxAmt */
                $taxAmt = isset($item['tax_amount']) && is_numeric($item['tax_amount']) ? (string) $item['tax_amount'] : '0.0000';

                /** @var numeric-string $lineSub */
                $lineSub = bcmul($qty, $price, 4);
                $subtotal = bcadd($subtotal, $lineSub, 4);
                $totalDiscount = bcadd($totalDiscount, $disc, 4);
                $totalTax = bcadd($totalTax, $taxAmt, 4);
            }

            /** @var numeric-string $shipping */
            $shipping = isset($data['shipping_amount']) && is_numeric($data['shipping_amount']) ? (string) $data['shipping_amount'] : '0.0000';
            /** @var numeric-string $roundOff */
            $roundOff = isset($data['round_off']) && is_numeric($data['round_off']) ? (string) $data['round_off'] : '0.0000';
            /** @var numeric-string $grandTotal */
            $grandTotal = bcadd(bcadd(bcsub(bcadd($subtotal, $totalTax, 4), $totalDiscount, 4), $shipping, 4), $roundOff, 4);

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
                'subtotal'        => $subtotal,
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

            foreach ($data['items'] as $idx => $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity']) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price']) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $discPct */
                $discPct = isset($item['discount_percentage']) && is_numeric($item['discount_percentage']) ? (string) $item['discount_percentage'] : '0.0000';
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $taxAmt */
                $taxAmt = isset($item['tax_amount']) && is_numeric($item['tax_amount']) ? (string) $item['tax_amount'] : '0.0000';

                /** @var numeric-string $lineSub */
                $lineSub = bcmul($qty, $price, 4);
                /** @var numeric-string $lineNet */
                $lineNet = bcsub($lineSub, $disc, 4);
                /** @var numeric-string $lineTotal */
                $lineTotal = bcadd($lineNet, $taxAmt, 4);

                SalesOrderItem::create([
                    'tenant_id'           => $data['tenant_id'],
                    'sales_order_id'      => $order->id,
                    'product_id'          => $item['product_id'],
                    'variant_id'          => $item['variant_id'] ?? null,
                    'description'         => $item['description'] ?? null,
                    'quantity'            => $qty,
                    'unit_id'             => $item['unit_id'],
                    'unit_price'          => $price,
                    'discount_percentage' => $discPct,
                    'discount_amount'     => $disc,
                    'tax_profile_id'      => $item['tax_profile_id'] ?? null,
                    'tax_amount'          => $taxAmt,
                    'line_total'          => $lineTotal,
                    'delivered_quantity'  => '0.0000',
                    'returned_quantity'   => '0.0000',
                    'batch_code'          => $item['batch_code'] ?? null,
                    'sort_order'          => $item['sort_order'] ?? $idx,
                    'created_by'          => $data['created_by'] ?? null,
                ]);
            }

            return $order->load(['items.product', 'items.unit', 'customer', 'warehouse']);
        });
    }
}
