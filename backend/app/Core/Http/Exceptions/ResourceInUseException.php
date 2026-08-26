<?php

declare(strict_types=1);

namespace App\Core\Http\Exceptions;

use RuntimeException;

/**
 * Thrown when a soft delete is refused because the record is still referenced
 * by another module (a unit used by products, a category with children, a
 * brand on a product, …). Maps to `409 IN_USE` in the exception handler
 * (API_CONTRACT §3.5).
 *
 * The `details` payload is the contract's `{ blocking_module, blocking_count }`:
 * which module holds the references and how many, so the UI can tell the
 * operator where to look before retrying the delete.
 */
final class ResourceInUseException extends RuntimeException
{
    public function __construct(
        private readonly string $blockingModule,
        private readonly int $blockingCount,
    ) {
        parent::__construct(
            "This record is still referenced by {$blockingCount} {$blockingModule} record(s) and cannot be deleted."
        );
    }

    public function blockingModule(): string
    {
        return $this->blockingModule;
    }

    public function blockingCount(): int
    {
        return $this->blockingCount;
    }

    /**
     * @return array{blocking_module: string, blocking_count: int}
     */
    public function details(): array
    {
        return [
            'blocking_module' => $this->blockingModule,
            'blocking_count' => $this->blockingCount,
        ];
    }
}
