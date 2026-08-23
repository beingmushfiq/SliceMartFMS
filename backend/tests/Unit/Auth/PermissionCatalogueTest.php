<?php

declare(strict_types=1);

namespace Tests\Unit\Auth;

use App\Core\Auth\PermissionCatalogue;
use InvalidArgumentException;
use Tests\TestCase;

class PermissionCatalogueTest extends TestCase
{
    public function test_valid_three_segment_permission_parses_cleanly(): void
    {
        $parsed = PermissionCatalogue::parse('production.batch.create');

        $this->assertSame('production', $parsed['module']);
        $this->assertSame('batch', $parsed['resource']);
        $this->assertSame('create', $parsed['action']);
    }

    public function test_two_segment_permission_throws_invalid_argument_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid permission format 'production.create'");

        PermissionCatalogue::parse('production.create');
    }

    public function test_invalid_action_throws_invalid_argument_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid action 'hack'");

        PermissionCatalogue::parse('production.batch.hack');
    }

    public function test_perm_version_is_deterministic(): void
    {
        $perms1 = ['sales.invoice.view', 'inventory.stock.view', 'production.batch.create'];
        $perms2 = ['production.batch.create', 'sales.invoice.view', 'inventory.stock.view'];

        $hash1 = PermissionCatalogue::computePermVersion($perms1);
        $hash2 = PermissionCatalogue::computePermVersion($perms2);

        $this->assertSame($hash1, $hash2);
        $this->assertSame(12, strlen($hash1));
    }
}
