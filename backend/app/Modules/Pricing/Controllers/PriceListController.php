<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Controllers;

use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Modules\Pricing\Actions\CreatePriceListAction;
use App\Modules\Pricing\Actions\DeletePriceListAction;
use App\Modules\Pricing\Actions\UpdatePriceListAction;
use App\Modules\Pricing\Requests\StorePriceListRequest;
use App\Modules\Pricing\Requests\UpdatePriceListRequest;
use App\Modules\Pricing\Resources\PriceListResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

final class PriceListController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $allowed = ['applies_to', 'channel', 'is_active', 'q', 'sort', 'page', 'per_page'];
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'Unknown query parameter(s): '.implode(', ', $unknown), httpStatus: 422, retryable: false);
        }
        $query = PriceList::query();
        foreach (['applies_to', 'channel'] as $field) {
            $value = $request->input($field);
            if (is_string($value)) {
                $query->where($field, $value);
            }
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
        $sortRaw = $request->input('sort', 'id');
        $sort = is_string($sortRaw) ? $sortRaw : 'id';
        foreach (explode(',', $sort) as $piece) {
            $desc = str_starts_with($piece, '-');
            $field = $desc ? substr($piece, 1) : $piece;
            if (in_array($field, ['id', 'code', 'name', 'priority', 'is_active', 'created_at', 'updated_at'], true)) {
                $query->orderBy($field, $desc ? 'desc' : 'asc');
            }
        }
        $query->orderBy('id');
        $perPageRaw = $request->input('per_page', 25);
        /** @phpstan-ignore cast.int */
        $perPage = is_int($perPageRaw) ? $perPageRaw : (int) $perPageRaw;
        if ($perPage > 100) {
            return ErrorResponse::make(request: $request, code: 'VALIDATION_FAILED', message: 'per_page must not exceed 100.', httpStatus: 422, retryable: false);
        }
        $pageRaw = $request->input('page', 1);
        /** @phpstan-ignore cast.int */
        $page = is_int($pageRaw) ? $pageRaw : (int) $pageRaw;
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);
        $filters = [];
        foreach (['applies_to', 'channel', 'is_active', 'q'] as $filter) {
            if ($request->filled($filter)) {
                $filters[$filter] = $request->input($filter);
            }
        }

        return response()->json(['success' => true, 'data' => PriceListResource::collection($paginated->items()), 'meta' => [
            'correlation_id' => (string) $request->header('X-Correlation-Id', ''),
            'pagination' => ['page' => $paginated->currentPage(), 'per_page' => $paginated->perPage(), 'total' => $paginated->total(), 'total_pages' => $paginated->lastPage(), 'has_more' => $paginated->hasMorePages()],
            'applied' => ['filters' => $filters, 'sort' => $sort, 'search' => is_string($search) ? $search : null],
        ]]);
    }

    public function show(Request $request, PriceList $priceList): JsonResponse
    {
        if (TenantContext::isBound() && $priceList->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        $includeRaw = $request->query('include', '');
        $include = is_string($includeRaw) ? explode(',', $includeRaw) : [];
        if (in_array('items', $include, true)) {
            $priceList->load('items.product', 'items.variant');
        }

        return response()->json(['success' => true, 'data' => new PriceListResource($priceList), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function options(Request $request): JsonResponse
    {
        $items = PriceList::query()->where('is_active', true)->orderBy('name')->get()->map(static fn (PriceList $priceList) => ['id' => (string) $priceList->uuid, 'label' => $priceList->name.' ('.$priceList->code.')'])->values();

        /** @var Collection<int, array{id: string, label: string}> $items */
        return response()->json(['success' => true, 'data' => $items->all(), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function store(StorePriceListRequest $request, CreatePriceListAction $action): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new PriceListResource($result['priceList']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]], 201)->header('Location', '/v1/price-lists/'.$result['priceList']->uuid);
    }

    public function update(UpdatePriceListRequest $request, UpdatePriceListAction $action, PriceList $priceList): JsonResponse
    {
        if (TenantContext::isBound() && $priceList->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $result = $action->execute(['user' => $user, 'priceList' => $priceList, ...$request->validated()]);

        return response()->json(['success' => true, 'data' => new PriceListResource($result['priceList']), 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }

    public function destroy(Request $request, DeletePriceListAction $action, PriceList $priceList): JsonResponse
    {
        if (TenantContext::isBound() && $priceList->tenant_id !== TenantContext::current()->tenantId()) {
            return ErrorResponse::make(request: $request, code: 'NOT_FOUND', message: 'The requested resource was not found.', httpStatus: 404, retryable: false);
        }
        /** @var \App\Models\User $user */
        $user = $request->user();
        $action->execute(['user' => $user, 'priceList' => $priceList]);

        return response()->json(['success' => true, 'data' => null, 'meta' => ['correlation_id' => (string) $request->header('X-Correlation-Id', '')]]);
    }
}
