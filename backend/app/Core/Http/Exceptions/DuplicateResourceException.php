<?php

declare(strict_types=1);

namespace App\Core\Http\Exceptions;

use RuntimeException;

/**
 * Thrown when a tenant-scoped uniqueness rule is violated — a duplicate
 * `(tenant_id, code)`, SKU, invoice number, email, etc. Maps to
 * `409 DUPLICATE` in the exception handler (API_CONTRACT §3.5).
 *
 * The `details` payload is the contract's `{ field, value, existing_id }`.
 * `existing_id` is the public uuid of the row that already owns the value, so
 * the client can link to it; it is nullable because the caller does not always
 * have it cheaply to hand.
 */
final class DuplicateResourceException extends RuntimeException
{
    public function __construct(
        private readonly string $field,
        private readonly string $value,
        private readonly ?string $existingId = null,
    ) {
        parent::__construct("A record with {$field} '{$value}' already exists.");
    }

    public function field(): string
    {
        return $this->field;
    }

    public function value(): string
    {
        return $this->value;
    }

    public function existingId(): ?string
    {
        return $this->existingId;
    }

    /**
     * @return array{field: string, value: string, existing_id: string|null}
     */
    public function details(): array
    {
        return [
            'field' => $this->field,
            'value' => $this->value,
            'existing_id' => $this->existingId,
        ];
    }
}
