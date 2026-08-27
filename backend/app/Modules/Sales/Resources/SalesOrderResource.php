<?php

declare(strict_types=1);

namespace App\Modules\Sales\Resources;

use App\Modules\Sales\Models\SalesOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SalesOrder
 */
final class SalesOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'uuid'           => $this->uuid,
            'order_number'   => $this->order_number,
            'channel'        => $this->channel,
            'party_id'       => $this->party_id,
            'customer_name'  => $this->customer_name ?? $this->customer?->name,
            'customer_phone' => $this->customer_phone,
            'warehouse_id'   => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'order_date'     => $this->order_date?->toDateString(),
            'required_date'  => $this->required_date?->toDateString(),
            'currency_code'  => $this->currency_code,
            'subtotal'       => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'tax_amount'     => $this->tax_amount,
            'shipping_amount' => $this->shipping_amount,
            'round_off'      => $this->round_off,
            'total_amount'   => $this->total_amount,
            'paid_amount'    => $this->paid_amount,
            'due_amount'     => $this->due_amount,
            'delivery_type'  => $this->delivery_type,
            'status'         => $this->status,
            'payment_status' => $this->payment_status,
            'notes'          => $this->notes,
            'confirmed_at'   => $this->confirmed_at?->toIso8601String(),
            'cancelled_at'   => $this->cancelled_at?->toIso8601String(),
            'items'          => SalesOrderItemResource::collection($this->whenLoaded('items')),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
