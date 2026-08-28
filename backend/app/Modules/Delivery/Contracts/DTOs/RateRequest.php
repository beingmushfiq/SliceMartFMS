<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Contracts\DTOs;

final readonly class RateRequest
{
    public function __construct(
        public string $recipientCity,
        public string $recipientZone,
        public float $weightKg,
        public float $itemPrice = 0.0,
        public string $deliveryType = 'normal'
    ) {}
}
