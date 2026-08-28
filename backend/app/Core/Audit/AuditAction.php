<?php

declare(strict_types=1);

namespace App\Core\Audit;

/**
 * The closed vocabulary for `audit_logs.action` (ADR-027, DATABASE_DESIGN §3).
 *
 * The column is a `VARCHAR(32)`, never a MySQL ENUM (migration cost), and the
 * migration deliberately omits a CHECK constraint because SQLite cannot add one
 * through ALTER TABLE. This enum is the PHP-backed validation the schema note
 * points at: the only legitimate source of an `action` value.
 */
enum AuditAction: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case Approved = 'approved';
    case Voided = 'voided';
    case Locked = 'locked';
    case Exported = 'exported';
    case LoggedIn = 'logged_in';
    case Impersonated = 'impersonated';
    case PermissionDenied = 'permission_denied';
}
