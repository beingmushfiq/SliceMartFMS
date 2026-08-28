<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Actions\PlatformDashboardMetricsAction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller for Master SaaS Admin Operational Dashboard.
 */
class PlatformDashboardController extends Controller
{
    /**
     * Get operational KPIs and platform summary.
     */
    public function kpis(Request $request, PlatformDashboardMetricsAction $action): JsonResponse
    {
        $metrics = $action->execute();

        return response()->json([
            'success' => true,
            'data' => $metrics,
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'timestamp' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }
}
