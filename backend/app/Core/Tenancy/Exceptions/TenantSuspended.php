<?php

declare(strict_types=1);

namespace App\Core\Tenancy\Exceptions;

use RuntimeException;

/**
 * Thrown by EnsureTenantActive when the tenant's status is `suspended` or
 * `cancelled`. Maps to 402 TENANT_INACTIVE in the exception handler
 * (ARCHITECTURE §5.7, API_CONTRACT §3.1).
 *
 * Past-due tenants receive read-only access and do NOT trigger this exception
 * — they are passed through by EnsureTenantActive with an isReadOnly flag set
 * on the TenantContext (ARCHITECTURE §3.2).
 */
final class TenantSuspended extends RuntimeException
{
    public function __construct(
        private readonly string $tenantSlug,
        private readonly string $tenantStatus,
    ) {
        parent::__construct(
            "Tenant [{$tenantSlug}] is not accessible (status: {$tenantStatus})."
        );
    }

    public function tenantSlug(): string
    {
        return $this->tenantSlug;
    }

    public function tenantStatus(): string
    {
        return $this->tenantStatus;
    }
}
