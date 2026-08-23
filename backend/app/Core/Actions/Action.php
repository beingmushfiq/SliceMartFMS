<?php

declare(strict_types=1);

namespace App\Core\Actions;

/**
 * Abstract base class that documents the Action contract (ARCHITECTURE §5.2).
 *
 * One Action = one business operation with one transaction boundary.
 *
 * Concrete classes MUST:
 *   - Declare all dependencies in the constructor (constructor injection only).
 *   - Accept the actor explicitly in execute() — never read it from Auth::user().
 *   - Wrap all mutations in DB::transaction().
 *   - Emit domain events inside the transaction; listeners handle them after
 *     commit (synchronous for atomic work, queued for audit/notifications).
 *
 * Concrete classes MUST NOT:
 *   - Contain routing, response-formatting or request-parsing logic.
 *   - Call another module's Eloquent models directly (use the module's public
 *     service interface).
 *   - Execute raw SQL outside a repository/reporting class.
 *
 * This base class is intentionally thin — it exists to document the contract
 * and give PHPStan a single type to assert against in tests.
 *
 * @see ARCHITECTURE.md §5.2
 */
abstract class Action
{
    // Subclasses have no shared state — they are constructed per-request by the
    // IoC container and receive everything they need through their constructor.
}
