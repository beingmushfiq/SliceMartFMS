<?php

declare(strict_types=1);

namespace App\Modules\Pos\Actions;

use App\Modules\Inventory\Actions\RecordStockMovementAction;
use App\Modules\Pos\Models\PosSession;
use App\Modules\Sales\Models\Invoice;
use App\Modules\Sales\Models\InvoiceItem;
use App\Modules\Sales\Models\Payment;
use App\Modules\Sales\Models\PaymentAllocation;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderItem;
use App\Modules\Sales\Models\SalesOrderPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProcessPosCheckoutAction
{
    public function __construct(
        private readonly RecordStockMovementAction $recordStockMovement
    ) {}

    /**
     * @param array{
     *     tenant_id: int,
     *     user_id: int,
     *     pos_session_id: int,
     *     party_id?: int|null,
     *     customer_name?: string|null,
     *     customer_phone?: string|null,
     *     order_date?: string|null,
     *     discount_amount?: string,
     *     round_off?: string,
     *     notes?: string|null,
     *     idempotency_key?: string|null,
     *     items: list<array{
     *         product_id: int,
     *         quantity: string,
     *         unit_id: int,
     *         unit_price: string,
     *         variant_id?: int|null,
     *         discount_amount?: string,
     *         tax_profile_id?: int|null,
     *         tax_amount?: string
     *     }>,
     *     payments: list<array{
     *         method: string,
     *         amount: string,
     *         change_given?: string
     *     }>
     * } $data
     * @return array{
     *     order: SalesOrder,
     *     invoice: Invoice,
     *     session: PosSession
     * }
     */
    public function execute(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $session = PosSession::where('tenant_id', $data['tenant_id'])
                ->where('id', $data['pos_session_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($session->status !== 'open') {
                throw new \DomainException("POS Session [{$session->session_number}] is not open.");
            }

            $orderNumber   = 'POS-SO-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $invoiceNumber = 'POS-INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $orderDate     = $data['order_date'] ?? date('Y-m-d');

            /** @var numeric-string $subtotal */
            $subtotal = '0.0000';
            /** @var numeric-string $totalTax */
            $totalTax = '0.0000';
            /** @var numeric-string $totalDiscount */
            $totalDiscount = isset($data['discount_amount']) && is_numeric($data['discount_amount'])
                ? (string) $data['discount_amount']
                : '0.0000';

            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = is_numeric($item['quantity']) ? (string) $item['quantity'] : '0.0000';
                /** @var numeric-string $price */
                $price = is_numeric($item['unit_price']) ? (string) $item['unit_price'] : '0.0000';
                /** @var numeric-string $itemTax */
                $itemTax = isset($item['tax_amount']) && is_numeric($item['tax_amount']) ? (string) $item['tax_amount'] : '0.0000';

                /** @var numeric-string $lineSub */
                $lineSub = bcmul($qty, $price, 4);
                $subtotal = bcadd($subtotal, $lineSub, 4);
                $totalTax = bcadd($totalTax, $itemTax, 4);

                if (isset($item['discount_amount']) && is_numeric($item['discount_amount'])) {
                    /** @var numeric-string $itemDisc */
                    $itemDisc = (string) $item['discount_amount'];
                    $totalDiscount = bcadd($totalDiscount, $itemDisc, 4);
                }
            }

            /** @var numeric-string $roundOff */
            $roundOff = isset($data['round_off']) && is_numeric($data['round_off']) ? (string) $data['round_off'] : '0.0000';
            /** @var numeric-string $grandTotal */
            $grandTotal = bcadd(bcsub(bcadd($subtotal, $totalTax, 4), $totalDiscount, 4), $roundOff, 4);

            // 1. Create Sales Order
            $order = SalesOrder::create([
                'tenant_id'       => $data['tenant_id'],
                'order_number'    => $orderNumber,
                'channel'         => 'counter',
                'branch_id'       => $session->branch_id,
                'warehouse_id'    => $session->warehouse_id,
                'party_id'        => $data['party_id'] ?? null,
                'customer_name'   => $data['customer_name'] ?? null,
                'customer_phone'  => $data['customer_phone'] ?? null,
                'pos_session_id'  => $session->id,
                'order_date'      => $orderDate,
                'currency_code'   => 'BDT',
                'subtotal'        => $subtotal,
                'discount_amount' => $totalDiscount,
                'tax_amount'      => $totalTax,
                'shipping_amount' => '0.0000',
                'round_off'       => $roundOff,
                'total_amount'    => $grandTotal,
                'paid_amount'     => $grandTotal,
                'due_amount'      => '0.0000',
                'status'          => 'delivered',
                'payment_status'  => 'paid',
                'notes'           => $data['notes'] ?? null,
                'created_by'      => $data['user_id'],
            ]);

            // 2. Line Items & Stock Deduction
            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = (string) $item['quantity'];
                /** @var numeric-string $price */
                $price = (string) $item['unit_price'];
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $tax */
                $tax = isset($item['tax_amount']) && is_numeric($item['tax_amount']) ? (string) $item['tax_amount'] : '0.0000';
                /** @var numeric-string $lineTotal */
                $lineTotal = bcadd(bcsub(bcmul($qty, $price, 4), $disc, 4), $tax, 4);

                SalesOrderItem::create([
                    'tenant_id'          => $data['tenant_id'],
                    'sales_order_id'     => $order->id,
                    'product_id'         => $item['product_id'],
                    'variant_id'         => $item['variant_id'] ?? null,
                    'quantity'           => $qty,
                    'unit_id'            => $item['unit_id'],
                    'unit_price'         => $price,
                    'discount_amount'    => $disc,
                    'tax_profile_id'     => $item['tax_profile_id'] ?? null,
                    'tax_amount'         => $tax,
                    'line_total'         => $lineTotal,
                    'delivered_quantity' => $qty,
                    'returned_quantity'  => '0.0000',
                ]);

                // Record stock movement (outbound POS sale)
                if ($session->warehouse_id) {
                    $this->recordStockMovement->execute([
                        'tenant_id'      => $data['tenant_id'],
                        'product_id'     => $item['product_id'],
                        'variant_id'     => $item['variant_id'] ?? null,
                        'warehouse_id'   => $session->warehouse_id,
                        'movement_type'  => 'pos_sale',
                        'direction'      => 'out',
                        'quantity'       => $qty,
                        'unit_id'        => $item['unit_id'],
                        'unit_cost'      => $price,
                        'reference_type' => 'sales_order',
                        'reference_id'   => $order->id,
                        'moved_at'       => $orderDate,
                        'created_by'     => $data['user_id'],
                    ]);
                }
            }

            // 3. Create Invoice
            $invoice = Invoice::create([
                'tenant_id'       => $data['tenant_id'],
                'invoice_number'  => $invoiceNumber,
                'sales_order_id'  => $order->id,
                'branch_id'       => $session->branch_id,
                'party_id'        => $data['party_id'] ?? null,
                'invoice_date'    => $orderDate,
                'subtotal'        => $subtotal,
                'discount_amount' => $totalDiscount,
                'tax_amount'      => $totalTax,
                'shipping_amount' => '0.0000',
                'round_off'       => $roundOff,
                'total_amount'    => $grandTotal,
                'paid_amount'     => $grandTotal,
                'status'          => 'paid',
                'created_by'      => $data['user_id'],
            ]);

            foreach ($data['items'] as $item) {
                /** @var numeric-string $qty */
                $qty = (string) $item['quantity'];
                /** @var numeric-string $price */
                $price = (string) $item['unit_price'];
                /** @var numeric-string $disc */
                $disc = isset($item['discount_amount']) && is_numeric($item['discount_amount']) ? (string) $item['discount_amount'] : '0.0000';
                /** @var numeric-string $tax */
                $tax = isset($item['tax_amount']) && is_numeric($item['tax_amount']) ? (string) $item['tax_amount'] : '0.0000';
                /** @var numeric-string $lineTotal */
                $lineTotal = bcadd(bcsub(bcmul($qty, $price, 4), $disc, 4), $tax, 4);

                InvoiceItem::create([
                    'tenant_id'       => $data['tenant_id'],
                    'invoice_id'      => $invoice->id,
                    'product_id'      => $item['product_id'],
                    'quantity'        => $qty,
                    'unit_id'         => $item['unit_id'],
                    'unit_price'      => $price,
                    'discount_amount' => $disc,
                    'tax_amount'      => $tax,
                    'line_total'      => $lineTotal,
                ]);
            }

            // 4. Payments and Shift Financial Tracking
            foreach ($data['payments'] as $paymentItem) {
                /** @var numeric-string $amt */
                $amt = (string) $paymentItem['amount'];
                /** @var numeric-string $change */
                $change = isset($paymentItem['change_given']) && is_numeric($paymentItem['change_given']) ? (string) $paymentItem['change_given'] : '0.0000';

                // Sales Order Payment record (tender)
                SalesOrderPayment::create([
                    'tenant_id'      => $data['tenant_id'],
                    'sales_order_id' => $order->id,
                    'method'         => $paymentItem['method'],
                    'amount'         => $amt,
                    'change_given'   => $change,
                ]);

                // Payment entry
                $payment = Payment::create([
                    'tenant_id'          => $data['tenant_id'],
                    'payment_number'     => 'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                    'direction'          => 'in',
                    'party_id'           => $data['party_id'] ?? null,
                    'branch_id'          => $session->branch_id,
                    'payment_date'       => $orderDate,
                    'method'             => $paymentItem['method'],
                    'amount'             => $amt,
                    'allocated_amount'   => $amt,
                    'unallocated_amount' => '0.0000',
                    'status'             => 'posted',
                    'created_by'         => $data['user_id'],
                ]);

                PaymentAllocation::create([
                    'tenant_id'        => $data['tenant_id'],
                    'payment_id'       => $payment->id,
                    'allocatable_type' => 'invoice',
                    'allocatable_id'   => $invoice->id,
                    'amount'           => $amt,
                ]);

                // Update Session totals
                if ($paymentItem['method'] === 'cash') {
                    // Subtract change given if any
                    /** @var numeric-string $netCash */
                    $netCash = bcsub($amt, $change, 4);
                    $session->expected_cash = bcadd((string) $session->expected_cash, $netCash, 4);
                } elseif ($paymentItem['method'] === 'card') {
                    $session->card_total = bcadd((string) $session->card_total, $amt, 4);
                } elseif ($paymentItem['method'] === 'mobile_banking') {
                    $session->mobile_total = bcadd((string) $session->mobile_total, $amt, 4);
                } elseif ($paymentItem['method'] === 'credit_adjustment') {
                    $session->credit_total = bcadd((string) $session->credit_total, $amt, 4);
                }
            }

            $session->sales_count += 1;
            $session->save();

            return [
                'order'   => $order->load(['items.product', 'items.unit']),
                'invoice' => $invoice->load(['items.product']),
                'session' => $session->refresh(),
            ];
        });
    }
}
