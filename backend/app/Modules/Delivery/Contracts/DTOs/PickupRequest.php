<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Contracts\DTOs;

final readonly class PickupRequest
{
    public function __construct(
        public string $storeId,
        public string $pickupAddress,
        public string $pickupPhone,
        public string $scheduledDate,
        public string $scheduledTimeSlot = '',
        public int $itemCount = 1
    ) {}
}
