<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Contracts\DTOs;

final readonly class LabelFile
{
    public function __construct(
        public bool $success,
        public ?string $url = null,
        public ?string $contentBase64 = null,
        public string $mimeType = 'application/pdf',
        public ?string $errorMessage = null
    ) {}
}
