<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Storefront;
use App\Models\StorefrontProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class StorefrontCustomizerController extends Controller
{
    /**
     * Get or initialize storefront settings for the active tenant.
     */
    public function getSettings(): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $storefront = Storefront::where('tenant_id', $tenantId)->first();

        if (! $storefront) {
            $tenant = TenantContext::current()->tenant();
            $storefront = Storefront::create([
                'tenant_id' => $tenantId,
                'uuid' => (string) Str::uuid(),
                'name' => $tenant['name'] ?? 'Online Storefront',
                'code' => 'STORE-' . strtoupper(Str::random(4)),
                'subdomain' => $tenant['slug'] ?? 'store-' . $tenantId,
                'currency' => $tenant['currency_code'] ?? 'USD',
                'locale' => $tenant['locale'] ?? 'en',
                'theme' => [
                    'primary_color' => '#10b981',
                    'accent_color' => '#14b8a6',
                    'hero_title' => 'Factory Fresh Goods',
                    'hero_subtitle' => 'Industrial quality delivered straight to your door.',
                ],
                'meta_title' => ($tenant['name'] ?? 'Storefront') . ' - Official Store',
                'guest_checkout_enabled' => true,
                'cod_enabled' => true,
                'online_payment_enabled' => true,
                'status' => 'live',
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $storefront,
        ]);
    }

    /**
     * Update storefront customization and configuration.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storefront = Storefront::where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:128',
            'subdomain' => 'sometimes|required|string|max:64|alpha_dash',
            'domain' => 'nullable|string|max:128',
            'currency' => 'sometimes|required|string|size:3',
            'locale' => 'sometimes|required|string|max:10',
            'theme' => 'nullable|array',
            'theme.primary_color' => 'nullable|string|max:32',
            'theme.accent_color' => 'nullable|string|max:32',
            'theme.hero_title' => 'nullable|string|max:255',
            'theme.hero_subtitle' => 'nullable|string|max:500',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'guest_checkout_enabled' => 'sometimes|boolean',
            'cod_enabled' => 'sometimes|boolean',
            'online_payment_enabled' => 'sometimes|boolean',
            'whatsapp_number' => 'nullable|string|max:32',
            'whatsapp_ordering_enabled' => 'sometimes|boolean',
            'whatsapp_default_message' => 'nullable|string|max:500',
            'min_order_amount' => 'nullable|numeric|min:0',
            'status' => 'sometimes|required|in:draft,live,maintenance,suspended',
        ]);

        $storefront->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Storefront settings updated successfully.',
            'data' => $storefront->fresh(),
        ]);
    }

    /**
     * List all products with their storefront publication status.
     */
    public function getPublishedProducts(): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $products = Product::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->with(['category:id,name', 'brand:id,name'])
            ->get();

        $published = StorefrontProduct::where('tenant_id', $tenantId)
            ->get()
            ->keyBy('product_id');

        $data = $products->map(function ($prod) use ($published) {
            $pub = $published->get($prod->id);
            return [
                'id' => $prod->id,
                'sku' => $prod->sku,
                'name' => $prod->name,
                'category_name' => $prod->category?->name,
                'brand_name' => $prod->brand?->name,
                'default_sale_price' => $prod->default_sale_price,
                'is_published' => $pub ? (bool) $pub->is_available : ((bool) ($prod->is_online ?? ($prod->type === 'finished'))),
                'is_featured' => $pub ? (bool) $pub->is_featured : false,
                'price_override' => $pub?->price_override,
                'display_order' => $pub?->sort_order ?? 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Toggle or update publication status for a product.
     */
    public function togglePublishProduct(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $validated = $request->validate([
            'product_id' => 'required|integer',
            'is_published' => 'required|boolean',
            'is_featured' => 'sometimes|boolean',
            'price_override' => 'nullable|numeric|min:0',
            'display_order' => 'sometimes|integer',
        ]);

        $storefront = Storefront::where('tenant_id', $tenantId)->first();
        if (! $storefront) {
            $this->getSettings(); // Auto-initialize if missing
            $storefront = Storefront::where('tenant_id', $tenantId)->firstOrFail();
        }

        $product = Product::where('tenant_id', $tenantId)->findOrFail($validated['product_id']);

        $storefrontProduct = StorefrontProduct::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'storefront_id' => $storefront->id,
                'product_id' => $product->id,
            ],
            [
                'uuid' => (string) Str::uuid(),
                'seo_slug' => Str::slug($product->name) . '-' . strtolower($product->sku),
                'is_available' => $validated['is_published'],
                'is_featured' => $validated['is_featured'] ?? false,
                'price_override' => $validated['price_override'] ?? null,
                'sort_order' => $validated['display_order'] ?? 0,
            ]
        );

        $product->update(['is_online' => $validated['is_published']]);

        return response()->json([
            'success' => true,
            'message' => $validated['is_published'] ? 'Product published to storefront.' : 'Product unpublished from storefront.',
            'data' => $storefrontProduct,
        ]);
    }
}
