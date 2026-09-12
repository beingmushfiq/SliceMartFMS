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

---

## 4. ERP Workspace Data Tables & Row Actions Standard

Reference implementation rule: `.agents/rules/erp_table_and_action_standards.md`

1. **Zero Horizontal Overflow Principle:**
   - Total intrinsic width across all table columns must sum to **≤ 1030px** to ensure zero horizontal scrolling on 1280px–1440px viewports with open sidebars.
   - Use `px-2` (8px padding) for compact columns (Code, Phone, Status, Type, Actions) and `px-2.5` (10px padding) for text-rich columns. Never use indiscriminate `px-3` or `px-4`.
   - "Don't borderize": Avoid harsh vertical grid column lines (`border-l`, `border-r`); use soft horizontal row dividers (`divide-y divide-default/40`).

2. **Actions Column & Button Architecture:**
   - Constrain Actions column to `w-36 px-2 text-right whitespace-nowrap` (144px).
   - Only **two** primary buttons per row:
     - Direct primary trigger (`Profile` or `View`): `px-2.5 py-1 text-xs rounded-lg border font-medium`.
     - Explicit dropdown trigger (`Actions ▾` with `ChevronDown`): Never use a bare, unlabeled 3-dot icon.
   - Secondary actions (e.g. `Print ID Badge`, `Download PDF`) belong inside the `Actions ▾` dropdown menu, not repeated directly on the table row.

3. **Dropdown Menu Architecture:**
   - Container: `absolute right-0 z-50 mt-1.5 w-52 rounded-xl bg-surface border border-default p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-left`.
   - Click-outside handling via document listener with `target.closest('[data-action-menu]')`.
   - Destructive action (`Delete ...`): Separated by `<div className="my-1 border-t border-default/50" />`, styled in bold red (`text-rose-600 font-semibold hover:bg-rose-50`), with a confirmation safety modal before API execution.

