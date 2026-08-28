<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller for Master SaaS Admin Platform-Wide Audit Logs.
 */
class PlatformAuditController extends Controller
{
    /**
     * List all platform audit entries.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with(['actor:id,name,email', 'tenant:id,name,slug']);

        if ($request->filled('action')) {
            $query->where('action', (string) $request->input('action'));
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (int) $request->input('tenant_id'));
        }

        $perPage = min(max((int) $request->input('per_page', 25), 1), 100);
        $paginator = $query->latest('id')->paginate($perPage);

        $data = $paginator->getCollection()->map(fn (AuditLog $log) => [
            'id' => $log->id,
            'uuid' => $log->uuid,
            'tenant_id' => $log->tenant_id,
            'tenant_name' => $log->tenant?->name,
            'tenant_slug' => $log->tenant?->slug,
            'actor_id' => $log->actor_user_id,
            'actor_name' => $log->actor?->name ?? 'System',
            'actor_email' => $log->actor?->email,
            'action' => $log->action,
            'entity_type' => $log->entity_type,
            'entity_id' => $log->entity_id,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'before' => $log->before,
            'after' => $log->after,
            'created_at' => $log->created_at?->toIso8601String(),
        ])->values();

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'pagination' => [
                    'total' => $paginator->total(),
                    'page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total_pages' => $paginator->lastPage(),
                ],
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }
}
