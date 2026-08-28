<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Resources;

use App\Modules\Delivery\Models\CourierShipment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CourierShipment
 */
class CourierShipmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'delivery_order_id' => $this->delivery_order_id,
            'delivery_number' => $this->deliveryOrder?->delivery_number,
            'courier_provider_id' => $this->courier_provider_id,
            'provider_name' => $this->provider?->name,
            'consignment_id' => $this->consignment_id,
            'awb_number' => $this->awb_number,
            'label_path' => $this->label_path,
            'tracking_url' => $this->tracking_url,
            'status' => $this->status,
            'provider_status_raw' => $this->provider_status_raw,
            'charge_amount' => $this->charge_amount,
            'cod_amount' => $this->cod_amount,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'confirmed_at' => $this->confirmed_at?->toIso8601String(),
            'last_synced_at' => $this->last_synced_at?->toIso8601String(),
            'error_message' => $this->error_message,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
