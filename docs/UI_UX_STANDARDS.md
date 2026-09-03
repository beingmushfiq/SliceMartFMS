# UI/UX STANDARDS — ENTERPRISE USABILITY & STATE MATRIX

> **Status:** Canonical UX Specification  
> **Target Experience:** "This software is extremely well thought out. Everything is where I expect it to be. I never feel lost. It looks premium but is surprisingly easy to use."  

---

## 1. Core UX Laws & Principles

1. **Information Density with Breathing Room:** Operational users need high data density (compact table rows, visible metrics), but without clutter. Whitespace must be intentional, not wasteful.
2. **Never Make Users Lose Entered Data:**
   - Forms retain input in local storage drafts (`useFormDraft`).
   - Unsaved changes prompt an exit warning when navigating away.
   - If an API request fails, the modal/drawer remains open with entered values intact and error messages clearly displayed.
3. **Every Action Communicates State:**
   - Click a button ➔ Button displays an inline spinner with *"Saving..."* or *"Processing..."*.
   - Success ➔ Brief green transient toast and data grid refresh without jarring page reload.
   - Failure ➔ Meaningful error alert with action recovery. Never leave users guessing.
4. **Predictability:**
   - If "Delete" is red with a confirmation dialog in Sales, it must be red with a confirmation dialog in Inventory and HR.
   - If Search has shortcut `/` or `Ctrl+K` on Dashboard, it works everywhere.

---

## 2. The 20-Row State Matrix (`UI_SYSTEM.md` §8)

Every workspace screen, table, and data-bound component must handle all 20 operational states:

| # | State | Visual Representation & Behavior |
|---|---|---|
| 1 | **Initial Mount** | Subtle skeleton loader shimmer matching table layout. |
| 2 | **Loading (First fetch)** | Structure skeleton, disable filters. |
| 3 | **Refreshing (Background)** | Subtle top-right spinner or pulse; previous data remains visible. |
| 4 | **Success (With Data)** | Fully rendered data grid, KPI cards, active pagination. |
| 5 | **Empty (Zero Data)** | Friendly industrial illustration, clear explanation, primary CTA button (*"Create First Product"*). |
| 6 | **Empty (Search No Results)** | *"No records match '[query]' — Clear filters"*. |
| 7 | **Validation Error (Client)** | Red input border, inline error text below field, scroll to first error on submit. |
| 8 | **Validation Error (Server)** | Toast alert + mapping server field errors to corresponding form inputs. |
| 9 | **Server Error (500)** | Clean error card with incident reference code, *"Try Again"* button. |
| 10 | **Network Error / Offline** | Sticky yellow offline banner at top of viewport, retry button, queue safe actions. |
| 11 | **Unauthenticated (401)** | Auto-redirect to `/login` preserving intended redirect URL in query param. |
| 12 | **Unauthorized (403)** | *"You don't have permission to perform this action. Contact your tenant administrator."* |
| 13 | **Submitting / Saving** | Disabled action buttons, inline spinner, prevent duplicate double-clicks. |
| 14 | **Success Feedback** | Non-blocking toast notification (Sonner), auto-dismiss in 4s. |
| 15 | **Destructive Confirmation** | Modal with red accent, explicit statement of consequences (*"This cannot be undone"*). |
| 16 | **Optimistic Update** | Instant UI status badge flip; rollback with toast if backend call fails. |
| 17 | **Partial Selection** | Indeterminate checkbox state on table header when subset of rows selected. |
| 18 | **Bulk Action Active** | Sticky floating action bar at bottom showing count and available actions. |
| 19 | **Filtered State** | Active filter badges displayed above table with individual 'x' remove buttons and *"Clear all"*. |
| 20 | **Dark Mode Transition** | Smooth color transitions (150ms) across all components without white border flashes. |

---

## 3. Keyboard Navigation & Accessibility (WAI-ARIA)

- **Focus Rings:** Highly visible 2px focus ring (`var(--color-brand-focus)`) on all interactive controls.
- **Escape Key:** Universally closes open modals, drawers, popovers, and dropdowns.
- **Tab Order:** Logical left-to-right, top-to-bottom sequence through all inputs.
- **Screen Reader Semantics:** Proper `role="dialog"`, `aria-expanded`, `aria-haspopup`, `aria-describedby` on dynamic components.
