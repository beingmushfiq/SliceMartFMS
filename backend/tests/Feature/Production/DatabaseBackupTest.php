<?php

declare(strict_types=1);

namespace Tests\Feature\Production;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DatabaseBackupTest extends TestCase
{
    public function test_database_backup_command_creates_valid_manifest(): void
    {
        $exitCode = $this->artisan('backup:database', ['--retention' => 30]);

        $exitCode->assertExitCode(0);

        $backupDir = storage_path('app/backups');
        $this->assertTrue(File::exists($backupDir));

        $files = File::files($backupDir);
        $this->assertNotEmpty($files);

        $content = json_decode(File::get($files[0]->getPathname()), true);
        $this->assertArrayHasKey('status', $content);
        $this->assertEquals('verified', $content['status']);
        $this->assertArrayHasKey('tables_count', $content);
    }
}
