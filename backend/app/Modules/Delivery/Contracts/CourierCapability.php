<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Contracts;

enum CourierCapability: string
{
    case CREATE_SHIPMENT = 'create_shipment';
    case CANCEL_SHIPMENT = 'cancel_shipment';
    case GET_STATUS = 'get_status';
    case GET_LABEL = 'get_label';
    case CALCULATE_RATE = 'calculate_rate';
    case SCHEDULE_PICKUP = 'schedule_pickup';
    case WEBHOOKS = 'webhooks';
    case COD_COLLECTION = 'cod_collection';
    case TRACKING_URL = 'tracking_url';
}
