<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformJobsController extends Controller
{
    /**
     * List queued jobs and failed jobs across the platform.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'failed'); // failed | queued

        if ($status === 'queued') {
            $jobs = DB::table('jobs')
                ->orderByDesc('id')
                ->limit(50)
                ->get()
                ->map(fn ($j) => [
                    'id' => $j->id,
                    'queue' => $j->queue,
                    'attempts' => $j->attempts,
                    'reserved_at' => $j->reserved_at ? Carbon::createFromTimestamp($j->reserved_at)->toIso8601String() : null,
                    'available_at' => Carbon::createFromTimestamp($j->available_at)->toIso8601String(),
                    'created_at' => Carbon::createFromTimestamp($j->created_at)->toIso8601String(),
                ]);

            return response()->json([
                'success' => true,
                'data' => $jobs,
                'counts' => [
                    'queued' => DB::table('jobs')->count(),
                    'failed' => DB::table('failed_jobs')->count(),
                ],
            ]);
        }

        $failed = DB::table('failed_jobs')
            ->orderByDesc('failed_at')
            ->limit(50)
            ->get()
            ->map(function ($f) {
                $payload = json_decode($f->payload, true);
                $displayName = $payload['displayName'] ?? ($payload['data']['commandName'] ?? 'Unknown Job');

                return [
                    'id' => $f->id,
                    'uuid' => $f->uuid,
                    'connection' => $f->connection,
                    'queue' => $f->queue,
                    'job_name' => $displayName,
                    'exception_summary' => Str::limit($f->exception, 250),
                    'failed_at' => $f->failed_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $failed,
            'counts' => [
                'queued' => DB::table('jobs')->count(),
                'failed' => DB::table('failed_jobs')->count(),
            ],
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Retry a specific failed job.
     */
    public function retry(Request $request, string $id): JsonResponse
    {
        $exitCode = Artisan::call('queue:retry', ['id' => [$id]]);
        $output = Artisan::output();

        AuditLog::withoutTenantScope()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $request->user()?->id,
            'action' => \App\Core\Audit\AuditAction::Updated,
            'auditable_type' => 'QueueJob',
            'auditable_id' => is_numeric($id) ? (int) $id : 0,
            'ip' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Master SaaS Admin',
            'created_at' => Carbon::now(),
            'after' => ['action' => 'retry_job', 'job_id' => $id, 'output' => trim($output)],
        ]);

        return response()->json([
            'success' => $exitCode === 0,
            'message' => trim($output) ?: "Job {$id} dispatched for retry.",
        ]);
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAll(Request $request): JsonResponse
    {
        $exitCode = Artisan::call('queue:retry', ['id' => ['all']]);
        $output = Artisan::output();

        return response()->json([
            'success' => $exitCode === 0,
            'message' => trim($output) ?: 'All failed jobs dispatched for retry.',
        ]);
    }

    /**
     * Forget/delete a failed job.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $exitCode = Artisan::call('queue:forget', ['id' => $id]);

        return response()->json([
            'success' => $exitCode === 0,
            'message' => "Failed job {$id} deleted.",
        ]);
    }
}
