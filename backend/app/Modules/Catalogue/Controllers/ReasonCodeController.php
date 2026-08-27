<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Http\Controllers\Controller;
use App\Models\ReasonCode;
use App\Modules\Catalogue\Resources\ReasonCodeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class ReasonCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['context', 'is_active', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'Unknown query parameter(s): '.implode(', ', $unknown),
                httpStatus: 422,
                retryable: false
            );
        }

        $query = ReasonCode::query();

        $context = $request->input('context');
        if (is_string($context)) {
            $query->where('context', $context);
        }

        $active = $request->input('is_active');
        if (is_string($active)) {
            $query->where('is_active', filter_var($active, FILTER_VALIDATE_BOOLEAN));
        }

        $search = $request->input('q');
        if (is_string($search) && mb_strlen($search) >= 2) {
            $like = '%'.$search.'%';
            $query->where(fn ($q) => $q->where('code', 'like', $like)->orWhere('name', 'like', $like));
        }

        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */
        $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'per_page must not exceed 100.', httpStatus: 422, retryable: false);
        }

        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */
        $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;

        $paginated = $query->orderBy('code')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => ReasonCodeResource::collection($paginated->items()),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
                'pagination' => [
                    'page' => $paginated->currentPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'total_pages' => $paginated->lastPage(),
                    'has_more' => $paginated->hasMorePages(),
                ],
            ],
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $query = ReasonCode::query()->where('is_active', true);

        $context = $request->input('context');
        if (is_string($context)) {
            $query->where('context', $context);
        }

        $items = $query->orderBy('name')->get()->map(static fn (ReasonCode $rc) => [
            'id' => (string) $rc->uuid,
            'label' => $rc->code.' - '.$rc->name,
            'code' => $rc->code,
            'name' => $rc->name,
            'context' => $rc->context,
        ])->values();

        /** @var Collection<int, array{id: string, label: string, code: string, name: string, context: string}> $items */
        return response()->json([
            'success' => true,
            'data' => $items->all(),
            'meta' => [
                'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            ],
        ]);
    }
}
