<?php

declare(strict_types=1);

namespace App\Core\Tenancy\Exceptions;

use RuntimeException;

/**
 * Thrown when the requested resource is outside the user's user_scopes set.
 * Maps to 403 OUT_OF_SCOPE in the exception handler (ARCHITECTURE §5.7,
 * API_CONTRACT §3.2).
 *
 * OUT_OF_SCOPE is deliberately distinct from FORBIDDEN: the former is fixable
 * by switching scope; the latter is a permissions problem. Collapsing them
 * produces the classic "why can't I see my own order" support ticket
 * (API_CONTRACT §3.2).
 */
final class OutOfScope extends RuntimeException
{
    public function __construct(
        private readonly string $scopeType,
        private readonly int $scopeId,
    ) {
        parent::__construct(
            "The requested resource is outside your {$scopeType} scope (id: {$scopeId})."
        );
    }

    public function scopeType(): string
    {
        return $this->scopeType;
    }

    public function scopeId(): int
    {
        return $this->scopeId;
    }
}
