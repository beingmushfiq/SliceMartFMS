<?php

declare(strict_types=1);

namespace App\Modules\Purchasing\Actions;

use App\Modules\Purchasing\Models\PurchaseBill;
use App\Modules\Purchasing\Models\PurchaseBillItem;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\PurchaseOrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreatePurchaseBillAction
{
    /**
     * @param array{
     *     tenant_id: int,
     *     party_id: int,
     *     bill_date: string,
     *     due_date?: string|null,
     *     supplier_invoice_number?: string|null,
     *     supplier_bill_number?: string|null,
     *     bill_number?: string,
     *     purchase_order_id?: int|null,
     *     goods_receipt_id?: int|null,
     *     created_by?: int|null,
     *     items: list<array{
     *         product_id: int,
     *         quantity: numeric-string|string,
     *         unit_id: int,
     *         unit_price: numeric-string|string,
     *         purchase_order_item_id?: int|null,
     *         goods_receipt_item_id?: int|null,
     *         tax_profile_id?: int|null,
     *         tax_rate?: numeric-string|string,
     *         discount_amount?: numeric-string|string,
     *         description?: string|null
     *     }>
     * } $data
     */
    public function execute(array $data): PurchaseBill
    {
        return DB::transaction(function () use ($data): PurchaseBill {
            $billNumber = $data['bill_number'] ?? ('BILL-' . date('Ymd') . '-' . strtoupper(Str::random(6)));
            $invoiceNumber = $data['supplier_bill_number'] ?? $data['supplier_invoice_number'] ?? ('INV-' . strtoupper(Str::random(8)));
            $dueDate = $data['due_date'] ?? $data['bill_date'];

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

            $bill = PurchaseBill::create([
                'tenant_id' => $data['tenant_id'],
                'bill_number' => $billNumber,
                'supplier_bill_number' => $invoiceNumber,
                'purchase_order_id' => $data['purchase_order_id'] ?? null,
                'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
                'party_id' => $data['party_id'],
                'bill_date' => $data['bill_date'],
                'due_date' => $dueDate,
                'status' => 'draft',
                'subtotal' => $subtotal,
                'discount_amount' => $totalDiscount,
                'tax_amount' => $totalTax,
                'other_charges' => '0.0000',
                'total_amount' => $grandTotal,
                'paid_amount' => '0.0000',
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

                PurchaseBillItem::create([
                    'tenant_id' => $data['tenant_id'],
                    'purchase_bill_id' => $bill->id,
                    'goods_receipt_item_id' => $item['goods_receipt_item_id'] ?? null,
                    'product_id' => $item['product_id'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $qty,
                    'unit_id' => $item['unit_id'],
                    'unit_price' => $price,
                    'tax_profile_id' => $item['tax_profile_id'] ?? null,
                    'tax_amount' => $lineTax,
                    'line_total' => $lineTotal,
                    'created_by' => $data['created_by'] ?? null,
                ]);

                // Update PO Item billed quantity if linked
                if (! empty($item['purchase_order_item_id'])) {
                    /** @var PurchaseOrderItem|null $poItem */
                    $poItem = PurchaseOrderItem::where('tenant_id', $data['tenant_id'])
                        ->where('id', $item['purchase_order_item_id'])
                        ->first();
                    if ($poItem instanceof PurchaseOrderItem) {
                        /** @var numeric-string $currentBilled */
                        $currentBilled = is_numeric($poItem->billed_quantity) ? (string) $poItem->billed_quantity : '0.0000';
                        $poItem->billed_quantity = bcadd($currentBilled, $qty, 4);
                        $poItem->save();
                    }
                }
            }

            // If linked to a PO, update PO billed_value
            if (! empty($data['purchase_order_id'])) {
                /** @var PurchaseOrder|null $po */
                $po = PurchaseOrder::where('tenant_id', $data['tenant_id'])
                    ->where('id', $data['purchase_order_id'])
                    ->first();
                if ($po instanceof PurchaseOrder) {
                    /** @var numeric-string $currentBilledVal */
                    $currentBilledVal = is_numeric($po->billed_value) ? (string) $po->billed_value : '0.0000';
                    $po->billed_value = bcadd($currentBilledVal, $grandTotal, 4);
                    $po->save();
                }
            }

            return $bill->load(['items.product', 'items.unit', 'supplier', 'purchaseOrder']);
        });
    }
}
