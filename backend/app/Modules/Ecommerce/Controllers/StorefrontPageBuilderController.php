<?php

declare(strict_types=1);

namespace App\Modules\Ecommerce\Controllers;

use App\Core\Audit\AuditAction;
use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Storefront;
use App\Models\StorefrontPage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class StorefrontPageBuilderController extends Controller
{
    private function getTenantStorefront(int $tenantId): Storefront
    {
        $tenant = TenantContext::current()->tenant();
        return Storefront::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'uuid' => (string) Str::uuid(),
                'name' => $tenant['name'] ?? 'Storefront',
                'subdomain' => $tenant['slug'] ?? 'store-' . $tenantId,
                'status' => 'live',
                'currency' => $tenant['currency_code'] ?? 'USD',
            ]
        );
    }

    /**
     * Tenant Admin: List all CMS pages
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storefront = $this->getTenantStorefront($tenantId);

        $pages = StorefrontPage::where('tenant_id', $tenantId)
            ->where('storefront_id', $storefront->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        if ($pages->isEmpty()) {
            $this->seedDefaultPages($tenantId, $storefront->id);
            $pages = StorefrontPage::where('tenant_id', $tenantId)
                ->where('storefront_id', $storefront->id)
                ->orderBy('sort_order')
                ->orderBy('title')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $pages,
        ]);
    }

    /**
     * Seed standard default CMS pages for storefront
     */
    public function seedDefaultPages(int $tenantId, int $storefrontId): void
    {
        $defaultPages = [
            [
                'title' => 'About Our Factory',
                'slug' => 'about-us',
                'page_type' => 'content',
                'meta_title' => 'About Our Manufacturing Heritage & Precision Engineering',
                'meta_description' => 'SliceMart manufactures energy-efficient infrared cookers and heavy-duty gas stoves with industrial-grade microcrystalline glass technology.',
                'status' => 'published',
                'sort_order' => 1,
                'blocks' => [
                    [
                        'id' => 'b1',
                        'type' => 'hero_banner',
                        'title' => 'Precision Engineering & Thermal Innovation',
                        'subtitle' => 'High-efficiency infrared cookers, induction surfaces, and precision gas stoves direct from our ISO-certified factory.',
                        'cta_text' => 'Explore Product Catalog',
                        'cta_url' => '/store/slicemart',
                    ],
                    [
                        'id' => 'b2',
                        'type' => 'rich_text',
                        'title' => 'Our Manufacturing Heritage',
                        'content' => 'Founded with a dedication to energy efficiency and culinary reliability, SliceMart produces appliances with A-grade microcrystalline ceramic glass, precision thermocouples, and pure copper heating cores. Every unit undergoes rigorous 5-stage quality assurance before leaving our assembly floor.',
                    ],
                    [
                        'id' => 'b3',
                        'type' => 'features',
                        'title' => 'Why Choose SliceMart Appliances',
                        'subtitle' => 'Quality and safety standards built into every single unit.',
                    ],
                ],
            ],
            [
                'title' => 'Help & FAQ',
                'slug' => 'faq',
                'page_type' => 'faq',
                'meta_title' => 'Frequently Asked Questions & Support',
                'meta_description' => 'Find answers to common questions regarding SliceMart infrared cookers, gas stoves, warranty, delivery, and spare parts.',
                'status' => 'published',
                'sort_order' => 2,
                'blocks' => [
                    [
                        'id' => 'b1',
                        'type' => 'faq',
                        'title' => 'Frequently Asked Questions',
                        'subtitle' => 'Everything you need to know about our products, orders, and warranty coverage.',
                        'faqs' => [
                            [
                                'q' => 'What cookware is compatible with SliceMart Infrared Cookers?',
                                'a' => 'All flat-bottom cookware works seamlessly on SliceMart infrared cookers, including stainless steel, cast iron, ceramic, tempered glass, and aluminum. Unlike induction, no magnetic base is required.',
                            ],
                            [
                                'q' => 'What warranty is provided with appliances?',
                                'a' => 'All SliceMart infrared cookers and gas stoves include a 1-year comprehensive replacement and service warranty backed by nationwide authorized service centers.',
                            ],
                            [
                                'q' => 'How long does nationwide delivery take?',
                                'a' => 'Orders within the metropolitan area arrive within 24 to 48 hours. Nationwide district deliveries typically arrive in 3 to 4 business days via Steadfast or Pathao Express.',
                            ],
                            [
                                'q' => 'Is Cash on Delivery (COD) available?',
                                'a' => 'Yes! We offer nationwide Cash on Delivery with parcel unboxing inspection permitted before final payment.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Return & Warranty Policy',
                'slug' => 'return-policy',
                'page_type' => 'policy',
                'meta_title' => 'Return, Replacement & 1-Year Warranty Policy',
                'meta_description' => 'Learn about our 7-day hassle-free replacement guarantee and nationwide 1-year product warranty.',
                'status' => 'published',
                'sort_order' => 3,
                'blocks' => [
                    [
                        'id' => 'b1',
                        'type' => 'rich_text',
                        'title' => 'SliceMart 7-Day Replacement Guarantee',
                        'content' => 'If your product arrives damaged, defective, or does not match specifications, contact our customer support within 7 days of delivery for an immediate free doorstep replacement.',
                    ],
                    [
                        'id' => 'b2',
                        'type' => 'rich_text',
                        'title' => '1-Year Official Manufacturer Warranty',
                        'content' => 'Every appliance is registered automatically for our 1-year factory warranty. We guarantee authentic spare parts, free diagnostic service, and dedicated technician assistance.',
                    ],
                ],
            ],
        ];

        foreach ($defaultPages as $pageData) {
            StorefrontPage::firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'storefront_id' => $storefrontId,
                    'slug' => $pageData['slug'],
                ],
                [
                    'uuid' => (string) Str::uuid(),
                    'title' => $pageData['title'],
                    'page_type' => $pageData['page_type'],
                    'meta_title' => $pageData['meta_title'],
                    'meta_description' => $pageData['meta_description'],
                    'status' => $pageData['status'],
                    'published_at' => now(),
                    'blocks' => $pageData['blocks'],
                    'sort_order' => $pageData['sort_order'],
                ]
            );
        }
    }

    /**
     * Tenant Admin: Seed or reset standard preset pages
     */
    public function seedDefaults(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storefront = $this->getTenantStorefront($tenantId);

        $this->seedDefaultPages($tenantId, $storefront->id);

        $pages = StorefrontPage::where('tenant_id', $tenantId)
            ->where('storefront_id', $storefront->id)
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Default storefront pages seeded successfully.',
            'data' => $pages,
        ]);
    }

    /**
     * Tenant Admin: Create a new page
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storefront = $this->getTenantStorefront($tenantId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:128',
            'page_type' => 'nullable|string|in:home,content,policy,contact,faq,custom',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'status' => 'nullable|string|in:draft,published',
            'blocks' => 'nullable|array',
        ]);

        $slug = !empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['title']);

        // Prevent duplicate slugs
        $existing = StorefrontPage::where('tenant_id', $tenantId)
            ->where('storefront_id', $storefront->id)
            ->where('slug', $slug)
            ->first();

        if ($existing) {
            $slug .= '-' . Str::random(4);
        }

        $page = StorefrontPage::create([
            'tenant_id' => $tenantId,
            'uuid' => (string) Str::uuid(),
            'storefront_id' => $storefront->id,
            'title' => $validated['title'],
            'slug' => $slug,
            'page_type' => $validated['page_type'] ?? 'custom',
            'meta_title' => $validated['meta_title'] ?? $validated['title'],
            'meta_description' => $validated['meta_description'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'published_at' => ($validated['status'] ?? 'draft') === 'published' ? now() : null,
            'blocks' => $validated['blocks'] ?? [],
            'sort_order' => StorefrontPage::where('tenant_id', $tenantId)->count() + 1,
            'created_by' => $request->user()?->id,
        ]);

        $audit = new AuditLog();
        $audit->uuid = (string) Str::uuid();
        $audit->tenant_id = $tenantId;
        $audit->user_id = $request->user()?->id;
        $audit->action = AuditAction::Created;
        $audit->auditable_type = StorefrontPage::class;
        $audit->auditable_id = $page->id;
        $audit->after = ['title' => $page->title, 'slug' => $page->slug];
        $audit->created_at = now();
        $audit->save();

        return response()->json([
            'success' => true,
            'message' => 'Storefront page created successfully.',
            'data' => $page,
        ], 201);
    }

    /**
     * Tenant Admin: Get single page with blocks
     */
    public function show(Request $request, string|int $idOrSlug): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $storefront = $this->getTenantStorefront($tenantId);

        $query = StorefrontPage::where('tenant_id', $tenantId)
            ->where('storefront_id', $storefront->id);

        if (is_numeric($idOrSlug)) {
            $query->where('id', (int) $idOrSlug);
        } else {
            $query->where('slug', $idOrSlug);
        }

        $page = $query->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $page,
        ]);
    }

    /**
     * Tenant Admin: Update page details & content blocks
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $page = StorefrontPage::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:128',
            'page_type' => 'sometimes|string|in:home,content,policy,contact,faq,custom',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'status' => 'sometimes|string|in:draft,published',
            'blocks' => 'sometimes|array',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        if (isset($validated['status'])) {
            if ($validated['status'] === 'published' && $page->status !== 'published') {
                $page->published_at = now();
            } elseif ($validated['status'] === 'draft') {
                $page->published_at = null;
            }
        }

        $page->update($validated);

        $audit = new AuditLog();
        $audit->uuid = (string) Str::uuid();
        $audit->tenant_id = $tenantId;
        $audit->user_id = $request->user()?->id;
        $audit->action = AuditAction::Updated;
        $audit->auditable_type = StorefrontPage::class;
        $audit->auditable_id = $page->id;
        $audit->after = ['title' => $page->title, 'status' => $page->status];
        $audit->created_at = now();
        $audit->save();

        return response()->json([
            'success' => true,
            'message' => 'Page updated successfully.',
            'data' => $page,
        ]);
    }

    /**
     * Tenant Admin: Delete page
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $page = StorefrontPage::where('tenant_id', $tenantId)->findOrFail($id);

        $page->delete();

        return response()->json([
            'success' => true,
            'message' => 'Page deleted successfully.',
        ]);
    }

    /**
     * Public Storefront: Get published page by slug for customer website
     */
    public function getPublicPage(Request $request, string $slug): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();
        $page = StorefrontPage::where('tenant_id', $tenantId)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => "Page '{$slug}' not found or not published.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'title' => $page->title,
                'slug' => $page->slug,
                'page_type' => $page->page_type,
                'meta_title' => $page->meta_title ?? $page->title,
                'meta_description' => $page->meta_description,
                'blocks' => $page->blocks ?? [],
                'published_at' => $page->published_at,
            ],
        ]);
    }
}
