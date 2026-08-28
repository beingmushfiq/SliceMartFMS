<?php

declare(strict_types=1);

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reports\Models\ReportDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportRegistryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ReportDefinition::where('is_active', true);

        if ($request->filled('module')) {
            $query->where('module', $request->query('module'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $definitions = $query->orderBy('name')->get();

        // Filter definitions by user permissions if authenticated with RBAC
        if ($user && method_exists($user, 'hasPermission')) {
            $effective = $user->getEffectivePermissions();
            if (!empty($effective) && !in_array('*', $effective, true)) {
                $definitions = $definitions->filter(function ($def) use ($user) {
                    return empty($def->required_permission) || $user->hasPermission($def->required_permission);
                })->values();
            }
        }

        return response()->json([
            'data' => $definitions,
            'meta' => [
                'count' => $definitions->count(),
            ],
        ]);
    }
}
