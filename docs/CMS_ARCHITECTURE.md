# CMS ARCHITECTURE — MODULAR STOREFRONT PAGE BUILDER

> **Status:** Canonical CMS Specification  
> **Application:** Tenant Storefront Content Management  
> **Rule:** Storefront layouts must be dynamically editable by non-technical tenant managers without deploying code.  

---

## 1. Modular Block-Based Architecture

The Storefront CMS utilizes a block-based component architecture where pages are composed of ordered sections:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STOREFRONT PAGE CANVAS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Header Section]       │ Tenant Logo, Search Bar, Cart Trigger, Nav Links   │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Hero Slider Block]    │ High-impact banner, headline, CTA button, autoplay │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Category Grid Block]  │ Visual categories with icon or circular image      │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Product Carousel]     │ Dynamic query: "Featured", "Best Sellers", "Sale"  │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Editorial Text+Image] │ Brand story, quality promise, factory footage      │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Trust Signals Banner] │ Free Delivery, Certified Halal/ISO, Secure Payment │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Custom HTML / CSS]    │ Isolated script or embed container with sanitizer  │
├────────────────────────┼────────────────────────────────────────────────────┤
│ [Footer Section]       │ Columns, Policy Links, Social Media, Copyright     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Block Definition Schema

Every block is stored in `storefront_pages.blocks` as JSON:
```json
{
  "id": "blk_hero_01",
  "type": "hero_slider",
  "order": 1,
  "is_visible": true,
  "settings": {
    "slides": [
      {
        "image_url": "https://cdn.devcenterpoint.com/tenants/slicemart/hero1.webp",
        "heading": "Fresh Factory Artisan Crust",
        "subheading": "Direct from our oven to your commercial kitchen",
        "cta_text": "Explore Wholesale Packs",
        "cta_url": "/collections/breads"
      }
    ],
    "autoplay_interval": 5000
  }
}
```

---

## 3. Revision Workflow (Draft vs. Live)

1. **Working Draft:** All edits made in the visual Page Builder are saved to `draft_content` and `draft_blocks`.
2. **Preview Mode:** Tenant managers can preview changes in an isolated iframe with device viewport toggles (Desktop, Tablet, Mobile) without altering public visitor traffic.
3. **Publishing:** Clicking *"Publish Page"* updates `live_content`, increments `version`, and clears the edge cache.
4. **Rollback:** Managers can review previous published versions in the *Revision History* drawer and restore any prior state with one click.

---

## 4. Default Provisioned Storefront Pages

When a new tenant is created, the system auto-provisions:
1. `home` — Primary landing page with Hero, Featured Categories, and Best Sellers.
2. `about` — Company history, factory hygiene, and quality credentials.
3. `contact` — Address, Google Maps embed, phone numbers, and direct contact form.
4. `faq` — Frequently Asked Questions on ordering, wholesale, and delivery.
5. `terms-and-conditions` — Legal terms of service.
6. `privacy-policy` — Data privacy policy.
7. `shipping-policy` — Delivery schedules and shipping charges.
8. `refund-policy` — Return, refund, and replacement conditions.
