# AUTHORITATIVE UI/UX SPECIFICATION & INTERACTION DESIGN SYSTEM

> **Status:** Canonical UI/UX Specification.
> **Design Framework:** Tailwind CSS v4 CSS-first `@theme` + Framer Motion + GSAP.
> **Accessibility Standard:** WCAG 2.2 Level AA (Mandatory Merge Requirement).
> **Last updated:** 2026-08-27

---

## 1. Design Philosophy & Aesthetic Charter (ADR-020, ADR-031)

1. **Distinctive, Premium & Human-Designed:** Avoid generic AI-generated SaaS dashboard tropes. The UI features intentional typographic scale, curated HSL color harmonies, high-contrast borders, refined whitespace, and clear data hierarchy.
2. **Context-Driven Touch Interfaces:** Screens for factory floor supervisors, storekeepers, and delivery drivers are designed touch-first (large targets ≥ 44px, high-contrast, few inputs per step, glare tolerance) before desktop density is added.
3. **Purposeful Craft Motion:** Animations exist exclusively to guide user focus, indicate state transitions, and provide immediate physical feedback. Every motion token respects `prefers-reduced-motion: reduce`.

---

## 2. Design Token Cascade (`frontend/src/styles/`)

```text
tokens.primitive.css  ──► Raw color scales, base typography, radii, spacing
        │
tokens.semantic.css   ──► Semantic tokens for Light Mode (--bg-surface, --text-primary)
        │
tokens.semantic.dark.css► Semantic overrides for Dark Mode (Class-based dark mode)
        │
tokens.component.css  ──► Component variables (--btn-height, --modal-width-md)
        │
tokens.motion.css     ──► Durations, easings, spring curves (Mirrored in TypeScript)
        │
base.css              ──► Base resets, typography antialiasing, scrollbar styling
        │
index.css             ──► Master composition entry point
```

### 2.1 Key Semantic Tokens

| Semantic Token | Light Mode Value | Dark Mode Value | Usage / Role |
|---|---|---|---|
| `--bg-app` | `#f8fafc` | `#0f172a` | App viewport background |
| `--bg-surface` | `#ffffff` | `#1e293b` | Cards, modals, table surfaces |
| `--bg-surface-raised` | `#ffffff` | `#334155` | Elevated menus, tooltips, popovers |
| `--text-primary` | `#0f172a` | `#f8fafc` | Main headings, body copy, active labels |
| `--text-secondary` | `#475569` | `#94a3b8` | Subtitles, helper text, table headers |
| `--text-muted` | `#94a3b8` | `#64748b` | Placeholders, disabled states |
| `--border-default` | `#e2e8f0` | `#334155` | Standard structural borders (1px) |
| `--border-strong` | `#cbd5e1` | `#475569` | Input borders, active card borders |
| `--brand-primary` | `#2563eb` | `#3b82f6` | Primary action buttons, active tabs |
| `--brand-accent` | `#0284c7` | `#38bdf8` | Secondary highlights, badges |
| `--status-success` | `#16a34a` | `#22c55e` | Success states, passed QC, completed orders |
| `--status-danger` | `#dc2626` | `#ef4444` | Errors, failed inspections, scrap |
| `--status-warning` | `#d97706` | `#f59e0b` | Warnings, low stock, pending reviews |

---

## 3. The 20-Row State Matrix (ADR-024, `UI_SYSTEM.md` §8)

Every screen, table, and data widget must deterministically handle all applicable states:

| # | State Family | Visual Representation | Interaction / Recovery Action |
|---|---|---|---|
| **1** | `Initial Loading` | Custom brand spinner / pre-paint boot screen | Non-interactive. Honest escalation at 8s and 20s. |
| **2** | `Refetching (Stale Data)` | Top 2px `RefetchBar` rail; data dims to 60% after 1s | Stale data remains fully readable and interactive. |
| **3** | `Empty Data (Zero Rows)` | Centered icon, descriptive title, guidance copy | Prominent "Create New [Resource]" primary action button. |
| **4** | `Empty Filter (No Match)` | Filter icon, "No matching records found" | "Clear all filters" secondary action button. |
| **5** | `Submitting (Mutation)` | Button spinner, input fields disabled | Prevent duplicate submission; width preserved. |
| **6** | `Success (Flash)` | Transient toast / green checkmark icon badge | Auto-dismiss toast after 4s (or persist if undoable). |
| **7** | `Validation Error (422)` | Red border, error text below field, focus first error | Corrective typing immediately clears field error state. |
| **8** | `Warning State` | Amber alert box with warning details | Non-blocking guidance with acknowledgment option. |
| **9** | `Generic Error (500)` | `StateView` error card with `correlation_id` | "Try Again" retry button + copy correlation ID for support. |
| **10** | `Network Offline` | Floating offline pill banner at top of viewport | Enters offline queue mode; auto-reconnects when online. |
| **11** | `Unauthenticated (401)` | Transparent background token refresh attempt | Re-executes request; if refresh fails, shows login modal. |
| **12** | `Forbidden (403)` | Shield alert icon, "Access Denied" | "Return to Dashboard" or request access from administrator. |
| **13** | `Out of Scope (403)` | Building alert icon, "Resource outside assigned facility" | Scope switcher selector to switch active branch/factory. |
| **14** | `Resource Not Found (404)` | Magnifying glass icon, "Resource does not exist" | "Back to Resource List" button. |
| **15** | `Request Timeout (504)` | Clock alert icon, "Server took too long to respond" | "Retry Request" button with exponential backoff. |
| **16** | `Conflict / Stale Edit (409)`| Dual-version comparison dialog | "Reload latest data" or "Overwrite changes" (if permitted). |
| **17** | `Duplicate Unique (409)` | Form field highlight: "Code/Name already in use" | Focuses conflicting input field for user correction. |
| **18** | `Resource In Use (409)` | Dialog explaining blocking relations (e.g. BOMs) | Lists blocking entities with direct navigation links. |
| **19** | `Aborted / Cancelled` | Silent disposal | No visual disruption; cancels in-flight promise. |
| **20** | `Unsaved Changes Guard` | Modal warning on route change or modal dismiss | "Discard changes" (danger) vs "Keep editing" (primary). |

---

## 4. UI Primitives & Patterns

1. **`Button` (`frontend/src/components/ui/Button.tsx`):**
   * Variants: `primary`, `secondary`, `ghost`, `danger`, `link` (No `warning` variant).
   * Supports `loading` prop with width-preserving layout swapping.
2. **`Modal` & `ConfirmDialog` (`frontend/src/components/ui/Modal.tsx`):**
   * Accessible focus trap, `useId()`, Escape key listener, background `inert`.
   * `isDirty` prop suppresses accidental dismissal via backdrop scrim clicks.
3. **`QueryBoundary` (`frontend/src/components/patterns/QueryBoundary.tsx`):**
   * Declarative wrapper combining TanStack Query loading, skeletons, `RefetchBar`, errors, and empty states.
4. **`AsyncButton` (`frontend/src/components/ui/AsyncButton.tsx`):**
   * Internal state machine managing `idle → submitting → success_flash → error_alert`.
5. **`Toast` (`frontend/src/components/ui/Toast.tsx`):**
   * Sonner wrapper enforcing semantic design tokens. Pinned infinite duration for error notifications.

---

## 5. Responsive Layout Architecture

* **Desktop (≥ 1024px):** Dual-pane master-detail layouts, sticky table headers, keyboard shortcuts, dense information architecture.
* **Tablet (768px – 1023px):** Collapsible sidebar, adaptive grid, touch-friendly dropdowns, optimized for factory floor iPads/Android tablets.
* **Mobile (< 768px):** Bottom sheet drawers (`Drawer`), stacked form fields, floating action buttons (FAB), scan camera integration.
