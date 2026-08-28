<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Storefront;
use App\Models\StorefrontProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StorefrontCatalogController extends Controller
{
    /**
     * Get storefront configuration and branding.
     */
    public function config(Request $request): JsonResponse
    {
        /** @var Storefront $storefront */
        $storefront = $request->attributes->get('storefront');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $storefront->id,
                'uuid' => $storefront->uuid,
                'name' => $storefront->name,
                'code' => $storefront->code,
                'domain' => $storefront->domain,
                'subdomain' => $storefront->subdomain,
                'currency' => $storefront->currency,
                'locale' => $storefront->locale,
                'theme' => $storefront->theme ?? [
                    'primary_color' => '#10b981',
                    'accent_color' => '#065f46',
                    'hero_title' => 'Direct from the Factory',
                    'hero_subtitle' => 'Premium products manufactured to perfection',
                ],
                'meta_title' => $storefront->meta_title ?? $storefront->name,
                'meta_description' => $storefront->meta_description,
                'guest_checkout_enabled' => $storefront->guest_checkout_enabled,
                'cod_enabled' => $storefront->cod_enabled,
                'online_payment_enabled' => $storefront->online_payment_enabled,
                'whatsapp_number' => $storefront->whatsapp_number,
                'whatsapp_ordering_enabled' => $storefront->whatsapp_ordering_enabled ?? true,
                'whatsapp_default_message' => $storefront->whatsapp_default_message,
                'min_order_amount' => $storefront->min_order_amount,
                'status' => $storefront->status,
            ],
        ]);
    }

    /**
     * List products available in the storefront catalog.
     */
    public function products(Request $request): JsonResponse
    {
        /** @var Storefront $storefront */
        $storefront = $request->attributes->get('storefront');

        $query = Product::query()
            ->where('status', 'active')
            ->where('type', '!=', 'raw_material')
            ->with(['category:id,name,code', 'brand:id,name,code', 'baseUnit:id,name,code', 'variants']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('q')) {
            $searchTerm = trim((string) $request->query('q'));
            $query->where(function ($q) use ($searchTerm): void {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('sku', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'pagination' => [
                    'total' => $products->total(),
                    'per_page' => $products->perPage(),
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Get a single product by ID or SKU.
     */
    public function product(Request $request, string $idOrSku): JsonResponse
    {
        $product = Product::query()
            ->where('status', 'active')
            ->where(function ($q) use ($idOrSku): void {
                if (is_numeric($idOrSku)) {
                    $q->where('id', $idOrSku);
                } else {
                    $q->where('sku', $idOrSku)->orWhere('online_slug', $idOrSku);
                }
            })
            ->with(['category', 'brand', 'baseUnit', 'variants'])
            ->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PRODUCT_NOT_FOUND',
                    'message' => 'Product not found in this catalog.',
                ],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * List categories available in storefront.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'parent_id']);

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}
