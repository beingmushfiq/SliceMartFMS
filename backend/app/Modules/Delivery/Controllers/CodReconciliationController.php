<?php

declare(strict_types=1);

namespace App\Modules\Delivery\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Delivery\Actions\ReconcileCodAction;
use App\Modules\Delivery\Models\CodReconciliation;
use App\Modules\Delivery\Resources\CodReconciliationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CodReconciliationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = CodReconciliation::query()->with('reconciledBy');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('source_type')) {
            $query->where('source_type', (string) $request->query('source_type'));
        }

        return CodReconciliationResource::collection($query->latest()->get());
    }

    public function store(Request $request, ReconcileCodAction $action): JsonResponse
    {
        $validated = $request->validate([
            'source_type' => ['required', 'string', 'in:run_sheet,courier_provider'],
            'source_id' => ['required', 'integer'],
            'period_start' => ['sometimes', 'date'],
            'period_end' => ['sometimes', 'date'],
            'expected_amount' => ['required', 'numeric', 'min:0'],
            'received_amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $rec = $action->execute(array_merge($validated, [
            'tenant_id' => $request->user()?->tenant_id,
            'reconciled_by' => $request->user()?->id,
            'created_by' => $request->user()?->id,
        ]));

        $rec->load('reconciledBy');

        return (new CodReconciliationResource($rec))
            ->response()
            ->setStatusCode(201);
    }

    public function show(CodReconciliation $reconciliation): CodReconciliationResource
    {
        $reconciliation->load('reconciledBy');

        return new CodReconciliationResource($reconciliation);
    }
}
