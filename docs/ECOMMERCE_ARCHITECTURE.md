# E-COMMERCE ARCHITECTURE — STOREFRONT, INVENTORY SYNC & FRAUD VERIFICATION

> **Status:** Canonical E-Commerce Specification  
> **Application:** Application 3 — Tenant Public Storefront  
> **Philosophy:** Polished, Editorial, Visual-First Online Store. Integrated directly with warehouse inventory and commercial workflows.  

---

## 1. Headless Storefront Topology

The Public Storefront (`/store/:subdomain/*`) acts as an autonomous e-commerce engine operating over the central tenant catalog:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PUBLIC STOREFRONT USER EXPERIENCE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Homepage & Collections │ Dynamic CMS Hero, Featured Grid, Sliders        │
│ 2. Catalog & Filters      │ Categories, Price Range, Search, In-Stock Only  │
│ 3. Product Detail (PDP)   │ Image Gallery, Variant Picker, Add to Cart      │
│ 4. WhatsApp Direct Order  │ 1-Click pre-formatted WhatsApp chat ordering    │
│ 5. Shopping Cart & Drawer │ Real-time subtotal, discount codes, shipping fee│
│ 6. Transparent Checkout   │ Guest or customer checkout, COD / Mobile Money  │
│ 7. Token Order Tracking   │ Live status pipeline by tracking UUID / Phone   │
│ 8. Customer Self-Service  │ Order history, saved addresses, profile         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Real-Time Inventory Synchronization

To prevent overselling and inventory race conditions:
1. **Dynamic Live Availability:**
   - Catalog displays actual available stock (`on_hand - reserved`).
   - If `allow_negative_stock` is false, out-of-stock items disable the "Add to Cart" button or show "Backorder Available".
2. **Checkout Reservation Lock (15-Minute TTL):**
   - When a customer proceeds to checkout, the system places a temporary 15-minute reservation hold on the selected items.
   - If checkout is completed, the reservation converts to an allocated sales order item.
   - If checkout is abandoned, the reservation automatically expires and returns to available stock.

---

## 3. Order Fraud Verification Engine

Every online order is automatically evaluated by the `OrderFraudScorerService`:

```
Input Factors:
├── Phone Number Historical Deliveries & Return Rates
├── IP Geolocation vs Delivery City Mismatch
├── Unusually High Quantity / Order Value for First-time Buyer
└── Rapid Duplicate Orders from Same Device Fingerprint
            │
            ▼
Weighted Risk Score (0–100):
├── 0 – 29: Low Risk ➔ Auto-Confirmed & routed to packing
├── 30 – 69: Medium Risk ➔ Staff Phone Verification Queue
└── 70 – 100: High Risk ➔ Auto-Held, Requires Advance Payment
```

---

## 4. WhatsApp Direct Order Flow

For markets with high social commerce adoption:
- Product Detail and Cart provide a *"Order via WhatsApp"* button.
- Dynamically compiles a structured message with tenant hotline, product names, quantities, unit prices, total amount, and delivery address prompt.
- Saves an initial draft order in the backend with channel `'whatsapp'` for customer service agents to confirm with a single click.
