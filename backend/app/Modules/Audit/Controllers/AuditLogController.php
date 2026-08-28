<?php

declare(strict_types=1);

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', $request->query('auditable_type'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->query('end_date'));
        }

        $logs = $query->paginate((int) $request->query('per_page', 25));

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'total' => $logs->total(),
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
