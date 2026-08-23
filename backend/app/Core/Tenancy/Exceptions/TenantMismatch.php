<?php

declare(strict_types=1);

namespace App\Core\Tenancy\Exceptions;

use RuntimeException;

/**
 * Thrown when a client-supplied `tenant_id` in the request body disagrees with
 * the tenant_id in the JWT claim. Maps to 403 TENANT_MISMATCH in the exception
 * handler, and is always logged as a security event (API_CONTRACT §1.6,
 * ARCHITECTURE §5.7).
 *
 * A body-supplied tenant_id that agrees with the token claim is silently
 * ignored (not an error); only a disagreement is suspicious.
 */
final class TenantMismatch extends RuntimeException
{
    public function __construct(
        private readonly int $tokenTenantId,
        private readonly int $bodyTenantId,
    ) {
        parent::__construct(
            "Client supplied tenant_id [{$bodyTenantId}] does not match the "
            ."authenticated tenant_id [{$tokenTenantId}] in the JWT claim."
        );
    }

    public function tokenTenantId(): int
    {
        return $this->tokenTenantId;
    }

    public function bodyTenantId(): int
    {
        return $this->bodyTenantId;
    }
}
