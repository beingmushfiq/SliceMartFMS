# UI SYSTEM

> **Rank 4 canonical.** Binding for every screen, component and pixel in this
> platform. Where this document and a Figma file, a screenshot, an old prototype
> or a personal preference disagree, this document wins. Where this document and
> `DECISIONS.md` disagree, `DECISIONS.md` wins.

**Status:** Canonical · **Last updated:** 2026-08-22 · **Supersedes:**
`docs/_legacy/LEGACY_UIUX_FRONTEND_PROMPT.md`,
`docs/_legacy/MASTER_FRONTEND_DEVELOPMENT_PROMPT.md`

---

## 0. What this document is for

A design system is not a folder of components. It is a set of decisions that have
already been made, so that nobody has to make them again at 11pm under deadline
pressure. This document exists so that:

- No developer ever picks a colour.
- No developer ever picks a duration.
- No developer ever invents a fifth way to show a loading state.
- No screen ships without every applicable state designed.
- No feature ships that is unusable with a keyboard, at 200% zoom, or with
  motion disabled.

Everything below is derived from the mandates in `PROJECT_CONTEXT.md` §8 and the
architectural decisions ADR-020 (tokens), ADR-023 (accessibility), ADR-024
(state matrix), ADR-026 (dark mode) and ADR-031 (motion and craft).

### 0.1 The product this is for

This is a dense operational system. The people using it are not browsing. They
are:

- A **POS operator** ringing up the 240th sale of the day, one hand on a barcode
  scanner, never touching the mouse.
- A **production supervisor** on a factory floor tablet with wet hands, entering
  worker output for 40 workers.
- A **warehouse clerk** on a mid-range Android phone with two bars of signal.
- An **accountant** reconciling a 3,000-row ledger on a 1080p monitor.
- A **tenant owner** looking at a dashboard for 30 seconds on a phone in a car.

The design consequence: **information density is a feature, not a flaw.** Airy
marketing-site whitespace is wrong here. But density is not the same as clutter —
density is achieved with typographic hierarchy, alignment and restraint, not by
removing padding until things touch.

### 0.2 The three sentences every screen must answer

Taken directly from the UI/UX mandate. Every screen, at every moment, answers:

1. **What happened?**
2. **What is happening?**
3. **What do I do next?**

If a screen state cannot answer all three, it is not finished. This is the single
test applied in design review.

---

## 1. Design principles

These are ordered. When two principles conflict, the higher one wins.

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **Truthful** | The UI never claims something that has not happened. No optimistic "Saved!" before the server confirmed. No fake progress bars. No fabricated numbers. An aggregate without a timestamp is not shown. |
| 2 | **Legible before beautiful** | Contrast, size and hierarchy are non-negotiable. A beautiful screen that a 45-year-old accountant cannot read at arm's length has failed. |
| 3 | **Dense but ordered** | Show the operator everything they need without scrolling. Achieve calm through alignment and type scale, not emptiness. |
| 4 | **Fast perceived, fast actual** | Skeletons that match final layout. No layout shift. Route-level code splitting. Motion never delays input. |
| 5 | **Keyboard-first for operators** | POS and production entry are fully operable without a mouse. Everything else is fully operable without a mouse too, just less optimised for it. |
| 6 | **Consistent to the point of boring** | The same action looks the same everywhere. A destructive button is the same red in every module. Surprise is a bug. |
| 7 | **Purposeful motion** | Motion explains a relationship, a transition or a state change. Motion that only decorates is deleted. (ADR-031) |
| 8 | **Memorable in the details** | Character lives in the loader, the empty states, the micro-interactions and the copy — not in gradients and glass. (ADR-031) |
| 9 | **Recoverable** | Every error state offers a next action. Every destructive action is confirmable or undoable. Unsaved work is never lost silently. |

### 1.1 The visual direction, stated plainly

- **Foundation:** a deep navy/slate neutral spine, one confident blue as primary,
  a single warm accent used sparingly, and a disciplined status palette.
- **Type:** Inter for UI, Fira Code for numbers that must align (ledgers, SKUs,
  IDs, correlation references).
- **Surfaces:** flat with a single hairline border and one low-elevation shadow
  tier. No stacked shadows, no heavy glassmorphism, no neon glow.
- **Radii:** small and consistent (6–10px on controls, 12px on cards). Nothing
  fully rounded except avatars, pills and the loader.
- **Character:** comes from the type ramp, the tabular-number alignment, the
  loader, the empty-state illustrations, the transitions between related views,
  and copy that sounds like it was written by a person who understands the
  factory.

**Explicitly rejected:** purple-to-pink gradients, floating 3D blobs,
glassmorphic cards over photographs, generic hero illustrations of people
pointing at charts, animated backgrounds, and any element whose only purpose is
to look "AI-generated modern".

---

## 2. Token architecture (ADR-020)

Three layers. A component may only reference layer 2 and layer 3. This is the
rule that makes dark mode and tenant branding possible without touching a single
component file.

```
Layer 1  primitive   raw values, mode-agnostic     --navy-800  --blue-500  --space-4
             │        never referenced by a component
             ▼
Layer 2  semantic    role-based, mode-aware        --color-surface  --color-danger
             │        the layer components use
             ▼
Layer 3  component   per-component knobs           --btn-height-md  --table-row-h
                      built from layer 2
```

### 2.1 Where tokens live

```
frontend/src/styles/
├── tokens.primitive.css     Layer 1  — raw scales
├── tokens.semantic.css      Layer 2  — light mode role mapping
├── tokens.semantic.dark.css Layer 2  — dark mode role re-mapping
├── tokens.component.css     Layer 3  — component knobs
├── tokens.motion.css        motion durations, easings, distances (§7)
├── base.css                 resets, focus-visible, scrollbars, print base
└── index.css                @import order + Tailwind v4 @theme bridge
```

`tailwind.config.js` **does not exist**. Tailwind CSS v4 is configured CSS-first
through `@theme` in `index.css`, which maps the semantic layer into Tailwind's
utility namespace. Deleting the JS config was a deliberate act (ADR-020) — two
config sources for one design system is how drift starts.

### 2.2 Layer 1 — primitives

Raw, mode-agnostic values. Named for what they **are**, never for what they are
used for.

**Neutrals — the spine of the product.**

```css
--navy-50   --navy-100  --navy-200  --navy-300  --navy-400
--navy-500  --navy-600  --navy-700  --navy-800  --navy-900  --navy-950
--slate-50  … --slate-950     /* cooler neutral for borders and muted text */
```

**Chromatics.** Full 50→950 ramps for each: `--blue-*` (primary),
`--amber-*` (accent + warning), `--green-*` (success), `--red-*` (danger),
`--cyan-*` (info), plus a dedicated `--chart-1 … --chart-8` categorical series.

> **Naming note (binding).** The primitive layer keeps physical colour names
> (`--red-600`). The semantic layer uses role names (`--color-danger`). We say
> `danger`, never `error`, at the semantic layer — because a validation *warning*
> and a failed *request* are different roles that both used to get called
> "error", and that ambiguity produced inconsistent UI.

**Spacing** — 4px base, no arbitrary values:

```css
--space-0:0  --space-px:1px --space-0_5:2px --space-1:4px  --space-1_5:6px
--space-2:8px --space-2_5:10px --space-3:12px --space-4:16px --space-5:20px
--space-6:24px --space-8:32px --space-10:40px --space-12:48px --space-16:64px
--space-20:80px --space-24:96px
```

**Radii:**

```css
--radius-xs:4px --radius-sm:6px --radius-md:8px --radius-lg:10px
--radius-xl:12px --radius-2xl:16px --radius-full:9999px
```

**Type ramp** — a real ramp, not eleven sizes that all look the same. `--text-2xs`
exists specifically for table meta rows and badge text, and is inherited from the
prototype:

```css
--text-2xs:0.625rem  --text-xs:0.75rem  --text-sm:0.8125rem
--text-base:0.875rem --text-md:1rem     --text-lg:1.125rem
--text-xl:1.25rem    --text-2xl:1.5rem  --text-3xl:1.875rem --text-4xl:2.25rem
```

Note the deliberate choice: **`--text-base` is 14px, not 16px.** This is an
operational back-office product; 14px body with a 16px `--text-md` for prose is
the density this product needs. Inputs are exempt and use 16px on mobile
breakpoints to prevent iOS zoom-on-focus.

**Weights** (`--font-weight-400` … `--font-weight-800`), **shadows** (`--shadow-xs`,
`-sm`, `-md`, `-lg`, `-overlay` only — five tiers, no more), **z-index scale**
(`--z-base:0`, `--z-sticky:100`, `--z-dropdown:200`, `--z-overlay:300`,
`--z-modal:400`, `--z-toast:500`, `--z-tooltip:600`, `--z-boot:700`), and
**fonts**:

```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace;
```

**Layout constants** (inherited from the prototype, kept):

```css
--sidebar-width: 256px;  --sidebar-collapsed-width: 64px;  --header-height: 56px;
```

### 2.3 Layer 2 — semantic tokens

**This is the only layer a component may reference for colour.** The complete,
closed set:

| Token | Role |
|---|---|
| `--color-bg` | Application background, behind all surfaces |
| `--color-surface` | Default card / panel / table background |
| `--color-surface-raised` | Popovers, dropdowns, modals — one step above surface |
| `--color-surface-sunken` | Table headers, inset wells, code blocks |
| `--color-border` | Default hairline border |
| `--color-border-strong` | Input borders, dividers that must read clearly |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary text, labels, help text |
| `--color-text-subtle` | Tertiary text, placeholders, disabled |
| `--color-primary` | Primary action, active nav, focus accents |
| `--color-primary-hover` | Primary hover/active |
| `--color-primary-fg` | Text/icon on primary |
| `--color-primary-subtle` | Primary-tinted background (selected rows, active tab) |
| `--color-accent` | The single warm accent — used for emphasis, never for status |
| `--color-accent-fg` / `--color-accent-subtle` | Accent pair |
| `--color-success` / `-fg` / `-subtle` | Posted, passed QC, delivered, paid |
| `--color-warning` / `-fg` / `-subtle` | Low stock, pending approval, stale data |
| `--color-danger` / `-fg` / `-subtle` | Failed, rejected, overdue, destructive |
| `--color-info` / `-fg` / `-subtle` | Neutral informational, draft, hints |
| `--color-focus-ring` | Focus ring — one colour, everywhere, both modes |
| `--color-overlay` | Modal/drawer scrim |
| `--color-selection` | Text selection background |

Rules:

1. **No raw hex, `rgb()`, `oklch()` or `--navy-*` in any component file.** Lint
   rule `no-raw-color-in-components` fails the build.
2. Every `--color-x` that can carry text has a matching `--color-x-fg`
   guaranteed to meet 4.5:1 against it in both modes. Contrast pairs are unit
   tested (§9.4).
3. `-subtle` variants are background-only and must reach 4.5:1 against
   `--color-text`.
4. The accent is **never** used to convey status. Status has exactly four
   colours: success, warning, danger, info.

### 2.4 Layer 3 — component tokens

Per-component knobs so a component's proportions can be tuned without editing
its class strings. Built only from layer 1 and layer 2.

```css
--btn-height-sm / -md / -lg      --btn-px-sm / -md / -lg    --btn-radius
--input-height  --input-px  --input-radius  --input-border  --input-border-focus
--card-padding  --card-radius  --card-border  --card-shadow
--table-row-height  --table-row-height-compact  --table-header-bg
--table-border  --table-stripe  --table-hover
--modal-width-sm / -md / -lg / -xl   --modal-radius   --modal-shadow
--toast-width  --badge-height  --badge-px  --nav-item-height  --tooltip-bg
```

### 2.5 Density modes

Two densities, user-selectable, persisted server-side via
`PATCH /auth/preferences` (`density: "comfortable" | "compact"`). Density changes
**only** layer 3 tokens — row heights, control heights, paddings. It never
changes font sizes, colours or layout structure.

| | Comfortable (default) | Compact |
|---|---|---|
| `--table-row-height` | 44px | 34px |
| `--input-height` | 38px | 32px |
| `--btn-height-md` | 36px | 30px |
| `--card-padding` | `--space-5` | `--space-3` |

Compact is what the accountant and the warehouse clerk switch to on day two.
Comfortable is what makes the product feel considered on day one.

---

## 3. Dark mode (ADR-026)

### 3.1 Mechanism

`class="dark"` on `<html>`. Three user-facing modes: `light`, `dark`, `system`.
Persisted server-side in user preferences with a `localStorage` mirror.

**Applied before first paint.** A tiny inline script in `index.html` reads the
mirror and sets the class before React mounts. A flash of the wrong theme is a
bug, not a cosmetic nitpick — on a factory floor at night it is genuinely
unpleasant.

```html
<script>
  try {
    var m = localStorage.getItem('ui.theme') || 'system';
    var d = m === 'dark' || (m === 'system' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch (e) {}
</script>
```

### 3.2 Dark mode is a re-mapping, not a variant

`dark:` utility variants are **forbidden** in component files. Dark mode is
achieved entirely by re-declaring the semantic layer inside `.dark { … }`. This
means a component written once is correct in both modes, forever.

```css
/* tokens.semantic.css */
:root {
  --color-bg:              var(--slate-50);
  --color-surface:         #ffffff;
  --color-surface-raised:  #ffffff;
  --color-surface-sunken:  var(--slate-100);
  --color-border:          var(--slate-200);
  --color-text:            var(--navy-900);
}

/* tokens.semantic.dark.css */
.dark {
  --color-bg:              var(--navy-950);
  --color-surface:         var(--navy-900);
  --color-surface-raised:  var(--navy-800);  /* lighter = higher, not shadow */
  --color-surface-sunken:  var(--navy-950);
  --color-border:          rgb(255 255 255 / 0.08);
  --color-text:            var(--slate-100);
}
```

### 3.3 Dark mode is not inverted light mode

Four things change beyond swapping values:

1. **Elevation is expressed by lightness, not shadow.** Shadows are nearly
   invisible on dark backgrounds. `--color-surface-raised` is *lighter* than
   `--color-surface`; shadow tiers reduce to a subtle ring.
2. **Status colours are re-tuned, not reused.** `--red-600` on navy is harsh and
   vibrates. Dark mode uses lighter, slightly desaturated status hues
   (`--red-400`) with darker `-subtle` backgrounds.
3. **Borders gain opacity, not hue.** `rgb(255 255 255 / 0.08)` reads as a
   hairline at any surface lightness; a fixed grey does not.
4. **Charts get their own palette.** `--chart-1…8` are re-declared in `.dark`
   with adjusted luminance so an 8-series line chart stays distinguishable.

### 3.4 Surfaces that ignore theme

- **Print and PDF output** is always light. `@media print` forces the light token
  set. Nobody prints a navy invoice.
- **Barcode and QR renderings** are always pure black on pure white regardless
  of theme — scanners are not aesthetically flexible.
- **Tenant logo** is provided in two variants (light-surface and dark-surface);
  if only one is uploaded it is rendered on a neutral chip so it never
  disappears.

---

## 4. Tenant branding (bounded)

Tenants are a business requirement; unbounded theming is a support nightmare. The
whitelist is exactly three things (ADR-020):

| Overridable | Not overridable |
|---|---|
| `--color-primary` (hover/fg/subtle derived server-side) | Neutrals, surfaces, borders |
| `--color-accent` | Status colours (success/warning/danger/info) |
| Logo (light + dark variants) | Fonts, type ramp, spacing, radii, shadows |
| | Layout, navigation structure, component shapes |

Enforcement:

- Overrides are injected as a single `<style>` block of custom properties on
  `:root`, generated from the tenant record. No per-tenant CSS files, no
  arbitrary CSS.
- **Contrast is validated server-side on save.** A tenant cannot save a primary
  colour that fails 4.5:1 against its derived foreground. The API returns
  `422 VALIDATION_FAILED` with `fields: { primary_color: ["Contrast ratio 2.9:1 is below the required 4.5:1."] }`.
- Derived tokens (`-hover`, `-fg`, `-subtle`) are computed by the backend, not
  guessed in CSS, so the whole family stays accessible together.

---

## 5. Typography and numbers

### 5.1 The ramp in use

| Role | Token | Weight | Notes |
|---|---|---|---|
| Page title | `--text-2xl` | 700 | One per screen. Never wraps on desktop. |
| Section heading | `--text-lg` | 600 | Card and panel titles |
| Subsection | `--text-base` | 600 | Fieldset legends, table group headers |
| Body | `--text-base` | 400 | Default |
| Prose / help | `--text-md` | 400 | Long-form only (settings descriptions, docs) |
| Label | `--text-xs` | 500 | Uppercase tracking-wide for form labels |
| Meta / caption | `--text-xs` | 400 | `--color-text-muted` |
| Micro | `--text-2xs` | 500 | Badges, table sub-rows, chart axis ticks |

Line heights: `1.25` for headings, `1.5` for body, `1.6` for prose. Measure is
capped at `72ch` for any paragraph.

### 5.2 Numbers are a first-class typographic concern

This is a financial and manufacturing system. Numbers get rules:

1. All numeric table columns are **right-aligned** and use
   `font-variant-numeric: tabular-nums`.
2. Money, quantity, SKU, batch number, invoice number, IDs and correlation
   references use `--font-mono`. Columns of monospaced digits align without
   effort, and a mis-typed digit is visible.
3. Money is **never** formatted with `parseFloat`. The API transports
   `DECIMAL(18,4)` as a JSON string (`"1234.5000"`, `API_CONTRACT.md` §1.5); the
   frontend keeps it a string through a `Decimal` branded type and formats via a
   single `formatMoney(value, currency, locale)` helper.
4. Currency symbol, decimal count, thousands separator and negative style come
   from **tenant settings**, never from a hardcoded locale. The prototype's
   hardcoded `'en-BD'` in `src/lib/utils.ts` is a defect to be removed.
5. Negative money is shown as `-৳1,200.00` in red-ish `--color-danger` text, and
   in parentheses in printed documents.
6. Zero and null are visually different. `0.0000` means measured zero. `—` in
   `--color-text-subtle` means "no value". Confusing these in a variance report
   causes real arguments.

### 5.3 Localisation

`i18next`, English and Bengali at launch. Consequences that affect design, not
just strings:

- Every string comes from a resource bundle. No literal user-facing text in JSX.
- Bengali text runs ~15–30% longer. **No fixed-width buttons or labels.** Layouts
  are tested with a pseudo-locale that inflates every string by 40%.
- Bengali numerals are a **display** concern only; stored and transported values
  stay Western Arabic.
- Dates render in the tenant's timezone with an explicit format helper. A bare
  `new Date().toLocaleString()` anywhere is a bug.
- The layout is LTR-only at launch, but no component hardcodes `left`/`right`
  where a logical property (`inline-start`) works, so RTL stays cheap later.

---

## 6. Layout, navigation and shell

### 6.1 The application shell

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOPBAR  h=56px  sticky  z=100                                          │
│ ┌──────────────┬──────────────────────┬──────────────────────────────┐ │
│ │ logo · tenant│ ⌘K command palette   │ branch │ ? │ 🔔 │ theme │ 👤 │ │
│ └──────────────┴──────────────────────┴──────────────────────────────┘ │
├──────────────┬─────────────────────────────────────────────────────────┤
│ SIDEBAR      │ CONTENT                                                 │
│ w=256 / 64   │ ┌─────────────────────────────────────────────────────┐ │
│              │ │ breadcrumb                                          │ │
│ ▸ Dashboard  │ │ Page title            [secondary] [PRIMARY ACTION]  │ │
│ ▾ Production │ │ subtitle / freshness stamp                          │ │
│   · Plans    │ ├─────────────────────────────────────────────────────┤ │
│   · Batches  │ │ filter bar (sticky when the table scrolls)          │ │
│   · QC       │ ├─────────────────────────────────────────────────────┤ │
│ ▸ Inventory  │ │                                                     │ │
│ ▸ Sales      │ │ page body — the only scroll container               │ │
│ ▸ Delivery   │ │                                                     │ │
│              │ └─────────────────────────────────────────────────────┘ │
│ ── footer ── │                                                         │
│ user · ver   │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

Rules:

- **One scroll container.** The page body scrolls; the topbar, sidebar and page
  header do not. Nested scroll areas are permitted only inside a table's
  horizontal overflow and inside a modal body.
- The **primary action** for a screen lives top-right of the page header, always,
  and there is at most one.
- The **freshness stamp** (`meta.freshness.as_of`, `API_CONTRACT.md` §15.2) renders
  under the title on any screen showing aggregated numbers.
- Breadcrumbs reflect the tenancy path when relevant
  (`Company › Branch › Factory › Line`), because in a multi-branch tenant "which
  branch am I looking at" is the most common question.

### 6.2 Navigation model

Sidebar groups map 1:1 to the module groups in `MODULE_MAP.md`. Not negotiable —
if the module map has ten groups, the sidebar has ten groups, in the same order,
with the same names.

- **Permission-filtered.** A nav item the user cannot access is **not rendered**.
  It is never rendered-and-disabled, and never hidden with CSS
  (`API_CONTRACT.md` §18). If a group has zero permitted children, the group
  disappears.
- **Collapsed state** (64px) shows icons only with tooltips on hover and focus.
  Collapse preference persists per user.
- **Active state** is a `--color-primary-subtle` background plus a 2px
  `--color-primary` inline-start rail, plus `aria-current="page"`.
- **Deep sections auto-expand** to the active route on load; manual expansion
  state persists for the session.
- **Command palette (⌘K / Ctrl+K)** searches navigation, records and actions.
  This is the power-user path and the fastest route to any screen. It respects
  permissions identically.

### 6.3 Responsive strategy

Breakpoints (Tailwind defaults, used as-is): `sm 640` `md 768` `lg 1024`
`xl 1280` `2xl 1536`.

| Range | Shell | Tables | Forms |
|---|---|---|---|
| `< 768` | Sidebar becomes a drawer; bottom action bar for the primary action | Card list, not a squeezed grid | Single column, sticky footer actions |
| `768–1023` | Sidebar auto-collapses to icons | Priority columns only + row expand | Single column, wider fields |
| `≥ 1024` | Full sidebar | Full table with column visibility control | Two columns where fields are related |
| `≥ 1536` | Content max-width `1600px`, centred | Table gains optional detail side-panel | Two/three columns |

**Mobile is not a shrunken desktop.** Three surfaces are designed
mobile-first because that is where they are actually used: **worker production
entry**, **stock count / stock take**, and **delivery status update**. These get
large touch targets (min 44×44px), numeric keypads, and one-thumb reachable
primary actions.

**POS is designed for a fixed landscape tablet or desktop first.** It is
explicitly not responsive down to a phone; a phone-sized POS is a different
product and is out of scope.

### 6.4 Page archetypes

Every screen is one of nine archetypes. Inventing a tenth requires a note in
`DECISIONS.md`.

| Archetype | Used for | Must include |
|---|---|---|
| **List / index** | Every master and transactional collection | Filter bar, table, pagination, empty + filtered-empty states, row actions |
| **Detail / record** | One entity with tabs | Header summary strip, status badge, lifecycle actions, activity/audit tab |
| **Document editor** | Sales order, purchase order, invoice, production batch | Line-item grid, running totals, draft/save/submit, unsaved-changes guard, `If-Match` conflict panel |
| **Wizard** | Onboarding, month-end close, bulk import | Step rail with validation per step, no forward jump past an invalid step |
| **Dashboard** | Role landing pages | KPI row, chart grid, freshness stamp, per-widget error isolation |
| **Report** | RMS surfaces | Parameter panel, run button, result table/chart, export, freshness |
| **Operator console** | POS, production entry, QC entry | Keyboard-first, minimal chrome, large targets, offline queue indicator |
| **Settings** | Tenant/user configuration | Sectioned form, per-section save, description text, dangerous-zone block |
| **Auth / public** | Login, reset, storefront | No shell, centred card, brand loader, no navigation leakage |

---

## 7. Motion and craft (ADR-031)

> Motion is a communication tool in this product, not a decoration budget. It is
> used to explain **where something came from**, **where it went**, **what
> changed** and **that the system is alive**. Everything else is deleted.

### 7.1 The two-library boundary

Two libraries, with a hard, non-overlapping division of labour. Using the wrong
one for a job is a review rejection.

| Library | Owns | Examples |
|---|---|---|
| **Framer Motion** | Component-level, state-driven, lifecycle motion. Anything tied to React mount/unmount or a state change. | Modal/drawer enter-exit, toast stack, accordion, tab panel crossfade, list item add/remove, `AnimatePresence` route fade, layout shifts via `layout` prop |
| **GSAP** (+ `ScrollTrigger`, `Flip`) | Imperative, timeline-orchestrated, scroll-linked, or multi-element choreography that React state cannot express cleanly. | Boot brand loader, dashboard KPI staggered reveal, number count-up, scroll-linked storefront sections, `Flip`-based table row reorder / card-to-detail transition, POS receipt print sequence |

Rules:

1. **Never animate the same property on the same element with both libraries.**
2. GSAP is **lazy-loaded per route**, never in the critical bundle. A route that
   does not use GSAP does not download it. `ScrollTrigger` and `Flip` are separate
   dynamic imports.
3. All GSAP work goes through one hook, so cleanup is impossible to forget:

```ts
// frontend/src/lib/motion/useGsap.ts
export function useGsap(
  factory: (ctx: { gsap: GSAP; scope: HTMLElement }) => void,
  deps: unknown[] = [],
) {
  const scope = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!scope.current) return;
    let ctx: gsap.Context | undefined;
    let cancelled = false;
    void import('gsap').then(({ gsap }) => {
      if (cancelled || !scope.current) return;
      ctx = gsap.context(() => factory({ gsap, scope: scope.current! }), scope.current);
    });
    return () => { cancelled = true; ctx?.revert(); };   // revert, not kill
  }, deps);
  return scope;
}
```

`ctx.revert()` — not `kill()` — so every property GSAP touched is restored. A
GSAP tween that leaves an inline `opacity: 0` behind after unmount is the classic
"my page went blank on back navigation" bug, and this hook makes it structurally
impossible.

### 7.2 Motion tokens

Durations and easings are tokens. A developer never types a number.

```css
/* tokens.motion.css */
--motion-duration-instant:   80ms;   /* colour/opacity on hover, checkbox tick   */
--motion-duration-fast:     150ms;   /* tooltip, dropdown, small reveals         */
--motion-duration-base:     240ms;   /* modal, drawer, tab panel, toast          */
--motion-duration-slow:     380ms;   /* page/route transition, large panel       */
--motion-duration-deliberate: 600ms; /* onboarding, empty-state, celebratory     */

--motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);      /* both ends visible    */
--motion-ease-entrance: cubic-bezier(0.05, 0.7, 0.1, 1); /* decelerate in        */
--motion-ease-exit:     cubic-bezier(0.3, 0, 0.8, 0.15); /* accelerate out       */
--motion-ease-emphasis: cubic-bezier(0.3, 0, 0, 1);      /* attention, count-up  */

--motion-distance-xs: 2px;  --motion-distance-sm: 4px;
--motion-distance-md: 8px;  --motion-distance-lg: 16px;

--motion-stagger: 40ms;     /* between siblings in a staggered reveal            */
```

Binding constraints:

- **Entrances are slower than exits.** Arriving deserves attention; leaving must
  not cost time. Enter with `--motion-ease-entrance`, exit with
  `--motion-ease-exit`, at one duration tier faster.
- **Hard ceiling: 400ms for anything that blocks interaction.** Only the
  `deliberate` tier may exceed it, and only on non-blocking, non-repeating
  surfaces.
- **No bounce, no elastic, no spring overshoot on functional UI.** Overshoot is
  permitted only on the boot loader and on a genuine success celebration.
- **Transform and opacity only.** Animating `width`, `height`, `top`, `left`,
  `margin` or `box-shadow` is forbidden (use `transform` + `Flip`, or
  `clip-path`). No layout-triggering animation on a table with 500 rows.

### 7.3 Where motion is required

Eleven surfaces where motion is not optional, because its absence makes the
interface harder to understand.

| # | Surface | Motion | Token |
|---|---|---|---|
| 1 | Route change | Content crossfade + `4px` rise; sidebar and topbar never move | `slow` / entrance |
| 2 | Modal / drawer | Scrim fade + panel scale `0.98→1` (modal) or slide from edge (drawer) | `base` / entrance, exit at `fast` |
| 3 | Toast | Slide-in from the top-right edge, stack reflow via `layout` | `base` |
| 4 | Dropdown / popover / tooltip | Fade + `2px` rise, transform-origin at the trigger | `fast` |
| 5 | Skeleton → content | Skeleton fades out as content fades in, **no layout shift** | `fast` |
| 6 | Table row add / remove / reorder | `Flip` — the row visibly moves to its new position | `base` |
| 7 | KPI / dashboard load | Staggered reveal (`--motion-stagger`) + honest number count-up from 0 to the real value | `slow` / emphasis |
| 8 | Validation error | Field border colour transition + message reveal. A short 2px shake **only** on submit-level failure, never per keystroke | `instant` / `fast` |
| 9 | Status change | Badge crossfades between colours so a `draft → posted` transition is noticed | `fast` |
| 10 | Expand / collapse | Height animated via `Framer Motion` `layout`, chevron rotates | `base` |
| 11 | Boot | The brand loader (§7.5) | see §7.5 |

### 7.4 Permitted craft, and forbidden craft

**Permitted — the details that make it feel human-designed:**

- Hover: `1px` lift plus border-colour warmth on cards; icon buttons scale to
  `1.04`; table rows tint with `--table-hover`.
- Press: scale to `0.98` on buttons — the cheapest, most satisfying feedback in
  UI design.
- Focus: the ring animates in over `instant`, so keyboard navigation feels
  tracked rather than teleported.
- Number count-up on dashboard KPIs — **from 0 to the true value, once, on first
  load only.** Never on refetch (numbers jumping around during polling is
  nauseating).
- Scroll-linked reveals on the **public storefront and marketing surfaces only**.
  Never inside the operational app — an operator scrolling a 200-row ledger does
  not want each row to fade in.
- Copy-to-clipboard: the icon morphs to a check, then back after 1.2s.
- Saving indicator on document editors: a small inline pulse next to
  "Saved 2s ago", not a blocking overlay.
- `Flip`-based card→detail transition on dashboards, so a KPI card visibly
  becomes the report it opened.
- Empty states with a small, custom, geometric line illustration — drawn from the
  same visual language as the loader, animated once on entry.

**Forbidden:**

- Any animation on every keystroke.
- Animated page backgrounds, parallax inside the app, floating decorative shapes.
- Spinners that spin for more than a moment with no accompanying explanation.
- Motion that delays the first input — the shell is interactive before decorative
  motion completes, always.
- Staggered reveals on lists longer than 12 items (stagger the first 12, show the
  rest).
- Animating a value change the user did not cause, without also saying why.
- Motion used to disguise slowness. Fix the slowness.
- **Fake progress.** A progress bar reflects a real percentage from a real
  transport or a real `job.progress_percent`, or it is not a progress bar.

### 7.5 The loading model — three tiers, and only three

Full-screen spinners are **banned** outside the boot tier.

**Tier 1 — The boot loader (once per session, the brand moment).**

- Rendered by `index.html` before React parses, so it appears in the first frame.
- **Budget: < 4KB total.** Inline SVG plus inline CSS. It cannot import GSAP,
  React, or a font — it must work before anything has loaded.
- Design: the mark draws itself via `stroke-dasharray` over ~900ms, then holds
  with a slow 2s breathing pulse. A single hairline progress rail beneath it
  advances on real milestones — `html parsed → js loaded → auth resolved →
  tenant resolved → first route mounted` — not on a timer.
- **Honest escalation:**
  - `0–8s`: mark and rail only. No text.
  - `8s`: "Still loading…" appears beneath.
  - `20s`: it becomes an error state — "This is taking longer than expected." with
    a **Retry** button and the correlation reference. It never spins forever.
- It fades out over `--motion-duration-base` as the shell fades in. It is removed
  from the DOM, not hidden.

**Tier 2 — Skeletons (the default for everything).**

- Any content region that fetches gets a skeleton that **matches the final layout
  in structure and dimension**. Same row count (up to the page size), same column
  widths, same card grid. The measured CLS contribution of a
  skeleton→content swap must be `0`.
- Shimmer is a slow, low-contrast gradient sweep, ~1.4s, `--color-surface-sunken`
  to `--color-surface`. It is disabled entirely under `prefers-reduced-motion`
  (the skeleton stays as a static block).
- Skeletons appear only after a **120ms delay**. A request that resolves in 60ms
  should never flash a skeleton — that flash reads as jank, not speed.

**Tier 3 — Inline spinner (scoped, small, in place).**

- For an action inside an already-rendered surface: a button submitting, a select
  loading options, a cell saving, a report re-running.
- The spinner replaces the icon **inside** the button; the button keeps its width
  (no layout jump) and its label changes to the present participle ("Saving…").
- Never covers content the user is reading.

**Also specified:**

- **Refetch of already-visible data** never shows a skeleton. It shows a subtle
  2px top progress bar and keeps the stale data visible, dimmed to 60% only if
  the refetch exceeds 1s.
- **Optimistic UI** is used only where rollback is trivial and visible (toggles,
  reorder, mark-as-read). It is **never** used for money, stock or production
  writes.

### 7.6 Accessibility and performance contract for motion

1. **`prefers-reduced-motion` is handled once, globally**, at the provider level —
   `MotionConfig reducedMotion="user"` for Framer Motion, and
   `gsap.defaults({ duration: 0 })` behind a matchMedia check for GSAP. Individual
   components do not each re-check.
2. A stored **`reduced_motion` user preference** (`PATCH /auth/preferences`)
   overrides the OS setting in both directions, because factory-floor shared
   devices have OS settings nobody controls.
3. **Reduced motion removes movement, never information.** A transition becomes
   an instant state change or a ≤80ms opacity fade. Nothing disappears, no
   affordance is lost, no state becomes ambiguous.
4. Count-up becomes the final number, immediately. Stagger becomes simultaneous.
   `Flip` becomes an instant reposition. Shimmer becomes a static block.
5. **60fps on a mid-range Android device** is the target. Motion is profiled on
   real hardware, not on a developer's laptop.
6. **Zero critical-bundle cost.** GSAP and its plugins are dynamic imports.
   Framer Motion is imported through the components that need it, and the
   `LazyMotion` + `domAnimation` feature subset is used rather than the full
   bundle.
7. **Every screen is verified with motion fully disabled** before merge. If a
   screen is confusing without motion, the motion was carrying meaning it should
   have communicated structurally.
8. Motion never traps focus, never delays a focus change, and never animates an
   element that is receiving focus in a way that moves it away from the cursor.

---

## 8. The state matrix (ADR-024)

> **This is the most important section in this document.** A screen is not
> "done" when the happy path renders. It is done when every applicable row below
> has a designed, implemented, reviewable state.

### 8.1 The eighteen states

Every screen declares which rows apply and demonstrates each one. "Not
applicable" is a valid answer; "we didn't get to it" is not.

| # | State | Trigger | Required treatment | Next action offered |
|---|---|---|---|---|
| 1 | **Loading (initial)** | First fetch, no cached data | Skeleton matching final layout, after 120ms | — (cancel on navigate) |
| 2 | **Loading (background)** | Refetch with data present | 2px top progress bar, data stays visible | — |
| 3 | **Empty — no data** | Query succeeded, zero rows, no filters | Illustration + explanation of what this screen is for + **primary create action** | "Create your first product" |
| 4 | **Empty — filtered to zero** | Zero rows **because of filters** | Visually distinct from #3: no illustration, echo the applied filters, no create CTA | "Clear filters" / "Clear search" |
| 5 | **Success** | Mutation returned `2xx` | Toast (transient) or inline confirmation (in-place). State updated from the server response, not from optimistic guesses | Contextual: "View invoice", "Add another" |
| 6 | **Validation error** | `422 VALIDATION_FAILED` | Inline per-field messages from `error.fields`, dot paths mapped to RHF, summary at the top if >3 fields, **focus first invalid control** | "Fix and resubmit" — nothing to retry |
| 7 | **Business rule violation** | `422 BUSINESS_RULE_VIOLATED`, `INSUFFICIENT_STOCK`, `CREDIT_LIMIT_EXCEEDED`, `PERIOD_CLOSED`, `QC_REQUIRED`, `PRODUCTION_CONTEXT_INCOMPLETE` | Explanatory panel (not a toast) using `error.details` to state the actual numbers — "Requested 150.0000, available 92.5000 in Central Warehouse" | The specific remedy: "Reduce quantity", "Request approval", "Complete QC" |
| 8 | **Warning** | Non-blocking risk: low stock, stale price, unapproved doc, approaching credit limit | Amber inline banner or badge. Does **not** block submit. Never a toast (toasts vanish; warnings must persist) | Optional acknowledge / "Review" |
| 9 | **API / network failure** | `5xx`, `UPSTREAM_FAILED`, `SERVICE_UNAVAILABLE` | Scoped error panel in the failed region only — the rest of the page keeps working. Safe message + correlation reference | **Retry** (`error.retryable === true`) |
| 10 | **Session expiry (401)** | `TOKEN_EXPIRED` after refresh fails, `TOKEN_REVOKED`, `REFRESH_REUSED` | Full-screen modal, **not** a redirect that discards work. Unsaved form state preserved in memory. Re-login in place, then resume | "Sign in again" |
| 11 | **Forbidden (403)** | `FORBIDDEN`, `PLATFORM_ONLY` | Clear "You don't have permission to do this" with the permission name in dev builds, generic in prod. No taunting UI — the button should not have existed | "Go back" / "Request access" |
| 12 | **Out of scope (403)** | `OUT_OF_SCOPE` | **Distinct from #11.** "This record belongs to Dhaka Branch. You're currently in Chittagong Branch." | **"Switch branch"** — it is fixable |
| 13 | **Not found (404)** | `NOT_FOUND`, `ROUTE_NOT_FOUND`, `RESOURCE_GONE` | In-shell not-found panel (keeps navigation), never a bare white page. Cross-tenant records land here by design | "Back to list" / "Search" |
| 14 | **Server error (500)** | `INTERNAL_ERROR` | Error boundary at the appropriate level. Says **what happened to their data**. Correlation reference copyable | "Retry" / "Reload page" / "Report" |
| 15 | **Timeout** | `REQUEST_TIMEOUT` (client), `UPSTREAM_TIMEOUT` (server) | "This took too long." For a mutation, add the critical sentence: **"Your data may have been saved — check before retrying."** | "Check status" / "Retry" |
| 16 | **Duplicate submission** | `409 DUPLICATE`, `IDEMPOTENT_KEY_CONFLICT`, `LOCKED`, or an idempotent replay | Replay renders as plain success (the user's intent happened once). True conflict explains the existing record and links to it | "Open existing" |
| 17 | **Unsaved changes** | Navigate / close / reload with a dirty form | Blocking confirm dialog naming what is lost. Router-level guard **and** `beforeunload`. Draft-capable documents offer "Save as draft" | "Stay" / "Discard" / "Save draft" |
| 18 | **Offline** | `navigator.onLine === false` or `NETWORK_OFFLINE` | Persistent topbar banner. Reads become cache-served and visibly marked stale. Writes are blocked except on offline-capable surfaces, where they queue with a visible count | "Retry now" / "View 3 queued" |

Two additional rows carried from ADR-024, applicable to composite screens:

| # | State | Trigger | Required treatment |
|---|---|---|---|
| 19 | **Partial failure** | Dashboard where 5 widgets load and 1 fails; bulk action where 8 of 10 succeed | Per-item outcome. **Never** fail the whole screen for one widget. Bulk results show a per-row list with reasons and a "Retry failed only" action |
| 20 | **Stale data** | `meta.freshness.stale === true`, or a cached read while offline | Amber "As of 14:05 · 40 minutes old" chip next to the number. A stale number is never presented as current |

### 8.2 Where these states live in code

They are not re-implemented per screen. Four shared primitives cover all of it,
and screens compose them:

```
<QueryBoundary>          loading skeleton | error panel | empty | children
<AsyncButton>            idle | submitting | success flash | error (inline)
<StateView>              the canonical renderer for rows 3,4,9,11,12,13,14,15
<ErrorBoundary>          rows 14 + any render-time crash (§8.4)
```

`StateView` takes an `error.code` and resolves the correct illustration, heading,
body copy, and action set from a single registry. **Adding a new error code to
the API means adding a row to that registry** — and `API_CONTRACT.md` §18 makes
shipping a code without a designed state a contract violation.

### 8.3 Copy rules for states

Bad error copy is a design defect, not a content afterthought.

| Rule | Bad | Good |
|---|---|---|
| Say what happened | "Error 500" | "We couldn't save this batch." |
| Say what it means for their data | "Request failed" | "Nothing was saved. Your entries are still here." |
| Say what to do | "An error occurred." | "Try again. If it keeps happening, share reference `6c1e…`." |
| Never blame the user | "You entered invalid data" | "Quantity must be greater than 0." |
| Never expose internals | "SQLSTATE[23000] Duplicate entry…" | "An invoice with this number already exists." |
| Never be cute about failure | "Oops! Something went wrong 🙈" | "We couldn't load your sales data." |
| Be specific with numbers | "Not enough stock" | "Central Warehouse has 92.5 kg; this needs 150 kg." |

### 8.4 Error boundaries — four levels (ADR-024, ARCHITECTURE.md)

```
① App boundary          catches everything; full-page recovery screen; the app
                        never shows a blank white page
   └─ ② Route boundary   one screen crashes → shell, sidebar and navigation
                        survive; user can navigate away
        └─ ③ Section     a dashboard widget, a chart, a tab panel fails in
                        isolation; siblings keep rendering
             └─ ④ Widget smallest recoverable unit; renders a compact
                        "Couldn't load" tile with retry
```

Rules:

- Every boundary **logs** (correlation id, route, user id, tenant id, component
  stack) before rendering its fallback.
- A boundary fallback always offers a real recovery path — retry the query, reload
  the route, or navigate away. A dead end is not a fallback.
- **Stack traces are never rendered in production.** In development they are shown
  behind a collapsed `<details>`.
- Boundaries catch **render** errors. Async failures are handled by TanStack Query
  error states, not by boundaries — mixing the two produces boundaries that never
  fire and errors nobody sees.
- The existing prototype `src/components/ErrorBoundary.tsx` (390 lines) is kept
  and extended to this four-level model rather than rewritten.

### 8.5 Forbidden, restated

Directly from the mandate. Each of these is a merge blocker:

1. **Faking success.** Showing "Saved" before a `2xx`.
2. **Hiding errors.** `catch {}`, or a console log with no UI change.
3. **Exposing stack traces, SQL, class names, file paths or internal IDs.**
4. **Buttons with no handler**, or that lead to a dead route.
5. **Fabricated / placeholder / demo data** in any shipped screen.
6. **Misleading copy** — a warning styled as an error, a partial success reported
   as a success.
7. **A crash that takes down the whole app** because a boundary was missing.
8. **Silently discarding user input** on navigation, error, or session expiry.
9. **A screen with no empty state**, so an empty account looks broken.
10. **Motion used to mask a missing state.**

---

## 9. Accessibility (ADR-023)

**WCAG 2.2 Level AA is a merge requirement, not a later phase.** A pull request
that regresses accessibility does not merge.

### 9.1 The non-negotiables

| Requirement | Standard |
|---|---|
| Text contrast | ≥ 4.5:1 in **both** light and dark modes |
| UI component / graphic contrast | ≥ 3:1 (borders, icons, focus ring, chart series) |
| Focus visible | Always. A visible `2px` ring with `2px` offset in `--color-focus-ring`. `outline: none` without a replacement is forbidden |
| Keyboard operable | Every interactive element reachable and operable by keyboard, in a logical order |
| Target size | ≥ 24×24px (AA minimum), ≥ 44×44px on mobile and operator surfaces |
| Zoom | Usable at 200% zoom and at 320px effective width without loss of function |
| Motion | Respects `prefers-reduced-motion` (§7.6) |
| Semantics | Real elements — `<button>`, `<a>`, `<table>`, `<label>`. A `<div onClick>` is a defect |
| Labels | Every input has a programmatically associated `<label>`. Placeholder-as-label is forbidden |
| Colour independence | Status is never conveyed by colour alone — always colour **plus** icon, text or shape |
| Language | `<html lang>` reflects the active locale |

### 9.2 Patterns that must be implemented correctly

The prototype has three known defects, recorded here so they are fixed rather
than copied:

1. **Modal (`src/components/ui/Modal.tsx`).** Currently has no focus trap and
   uses a hardcoded `id="modal-title"` (which breaks the moment two modals exist).
   Required: `role="dialog"` + `aria-modal="true"`, a real focus trap, focus moved
   to the dialog on open, focus **restored to the trigger** on close, `Escape` to
   close, scrim click to close (except on dirty forms), a generated unique id for
   `aria-labelledby`, and background content `aria-hidden` while open.
2. **Tabs (`src/components/ui/Tabs.tsx`).** Currently missing arrow-key
   navigation. Required: the full WAI-ARIA tabs pattern — `role="tablist"`,
   `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with
   `aria-labelledby`, `ArrowLeft`/`ArrowRight`/`Home`/`End`, and a single tab stop
   in the tab list.
3. **Skeleton (`SkeletonLine`).** Currently builds a class name dynamically
   (`` `h-${height}` ``), which Tailwind's compiler never sees, so the height
   silently never applies. **Rule: no dynamically constructed utility class names,
   anywhere.** Variants are selected from a static map.

Additional required patterns:

- **Form errors:** `aria-invalid` on the control, `aria-describedby` pointing at
  the message, and an `aria-live="polite"` region announcing the error count on
  submit failure.
- **Toasts:** rendered into an `aria-live="polite"` region (`assertive` for
  errors), never auto-dismissing an error the user has not seen.
- **Tables:** `<caption>` or an `aria-label`, `scope` on headers, sortable headers
  as `<button>` with `aria-sort`, and full keyboard navigation for editable grids.
- **Async regions:** `aria-busy` while loading; the result is announced, not just
  rendered.
- **Skip link** to main content as the first focusable element.
- **Icon-only buttons:** always an `aria-label`; a tooltip is not an accessible
  name.

### 9.3 Operator surfaces are keyboard-complete

POS and production entry must be fully operable with **zero mouse contact** —
this is an operational requirement, not an accessibility nicety, because a POS
operator's hands are on a scanner and a keypad.

| Surface | Keys |
|---|---|
| POS | `F2` product search · barcode scan → auto-add · `+`/`-` quantity · `F4` discount · `F8` hold · `F9` payment · `Enter` complete · `Esc` cancel line |
| Production entry | `Tab` down the worker grid · numeric entry · `Enter` next row · `Ctrl+S` save · `Ctrl+Enter` submit |
| Any list | `/` focus search · `↑`/`↓` rows · `Enter` open · `Space` select · `Shift+↑↓` range select |
| Global | `⌘K`/`Ctrl+K` palette · `?` shortcut sheet · `g` then a letter for module jumps |

A discoverable shortcut sheet (`?`) is mandatory. Shortcuts nobody can find do
not exist.

### 9.4 How this is enforced

- `eslint-plugin-jsx-a11y` at **error** level in CI.
- `@axe-core/react` in development, logging violations to the console.
- `vitest-axe` assertions in every component test.
- **Automated contrast tests** over the token pairs (every `--color-x` /
  `--color-x-fg` and every `-subtle` / `--color-text` pair) in both modes, run in
  CI. A token change that breaks contrast fails the build.
- A keyboard-only pass and a screen-reader spot-check on each phase's exit gate.
- Automated tooling catches roughly half of real problems; the manual pass is not
  optional.

---

## 10. Component inventory

### 10.1 Ownership and location

```
frontend/src/components/
├── ui/            primitives — no business logic, no data fetching, no imports
│                  from features. Fully controlled. Fully typed.
├── patterns/      composed, still generic: DataTable, FormLayout, PageHeader,
│                  StateView, QueryBoundary, ConfirmDialog, FilterBar
├── layout/        AppShell, Sidebar, Topbar, Breadcrumbs, CommandPalette
└── (features)/    module-specific components live in the feature folder,
                   never in ui/
```

Hard rule: **`ui/` never imports from `features/`.** A dependency-cruiser rule
enforces it. The day a primitive knows about a sales order is the day the design
system stops being reusable.

### 10.2 Primitives (`ui/`)

Kept from the prototype and hardened: `Button`, `Badge`, `Modal`, `Tabs`,
`FormElements`, `Feedback`, `KPICard`, `PWAInstallBanner`.

The full required set:

| Group | Components |
|---|---|
| **Actions** | `Button` (variants: `primary` `secondary` `ghost` `danger` `link`; sizes `sm` `md` `lg`; states `loading` `disabled`; optional leading/trailing icon), `IconButton`, `ButtonGroup`, `SplitButton`, `AsyncButton` |
| **Inputs** | `Input`, `NumberInput` (decimal-safe, string-valued), `MoneyInput`, `Textarea`, `Select`, `Combobox` (async, server-searched via `/options`), `MultiSelect`, `Checkbox`, `Radio`, `Switch`, `DatePicker`, `DateRangePicker`, `TimePicker`, `FileUpload` (real progress), `QuantityStepper`, `BarcodeInput` |
| **Form scaffolding** | `Field` (label + control + help + error, wires `aria-describedby`/`aria-invalid`), `Fieldset`, `FormGrid`, `FormActions`, `ErrorSummary` |
| **Data display** | `Table` primitives, `DataTable` (pattern), `Badge`, `StatusBadge` (maps a domain status to token + icon + label), `Tag`, `Avatar`, `KPICard`, `Stat`, `DescriptionList`, `Timeline` (audit trail), `EmptyState`, `Money`, `Quantity`, `DateTime`, `CodeRef` (copyable correlation id) |
| **Feedback** | `Toast` (Sonner-backed), `Alert` (inline, 4 tones), `Skeleton` (static variant map), `Spinner`, `ProgressBar` (real values only), `BootLoader`, `ConfirmDialog`, `ConflictPanel` (`VERSION_CONFLICT`) |
| **Overlay** | `Modal`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `ContextMenu`, `CommandPalette` |
| **Navigation** | `Tabs`, `Breadcrumbs`, `Pagination`, `Stepper`, `NavItem`, `SegmentedControl` |
| **Charts** | `LineChart`, `BarChart`, `AreaChart`, `PieChart`, `Sparkline` — all Recharts wrappers with the shared token palette, tooltip, empty state and freshness stamp baked in |

### 10.3 Rules every primitive obeys

1. **Controlled.** Value in, change out. No internal source of truth for data.
2. **Forwards `ref`** and spreads unknown props onto the underlying element.
3. **Never fetches.** Data comes in as props. `Combobox` is the one exception and
   it takes a fetcher function, not a URL.
4. **Token-only styling.** No hex, no arbitrary Tailwind values, no dynamic class
   name construction.
5. **Every state in one file** — default, hover, active, focus-visible, disabled,
   loading, error, read-only.
6. **A story per variant** (Storybook), including the error and loading states.
   A component whose error state has never been rendered does not have one.
7. **Typed discriminated props** — impossible combinations are impossible to
   express (`variant="link"` cannot take `loading`).
8. **`data-testid`** only where a stable semantic query is genuinely unavailable.

### 10.4 Status badge registry

Domain statuses are not free text. One registry maps every status in the system
to a token, an icon and a translated label, so `draft` looks identical on a
purchase order and a production batch.

| Status family | Token | Icon |
|---|---|---|
| `draft`, `new` | `info-subtle` | `FileEdit` |
| `pending`, `awaiting_approval`, `submitted` | `warning-subtle` | `Clock` |
| `approved`, `confirmed`, `posted`, `completed`, `passed`, `delivered`, `paid` | `success-subtle` | `CheckCircle2` |
| `in_progress`, `processing`, `in_transit` | `primary-subtle` | `Loader` (static under reduced motion) |
| `rejected`, `failed`, `cancelled`, `returned`, `overdue` | `danger-subtle` | `XCircle` |
| `on_hold`, `partial`, `rework` | `warning-subtle` | `PauseCircle` |
| `closed`, `archived`, `inactive` | `surface-sunken` | `Archive` |

Colour is always paired with an icon and a label (§9.1, colour independence).

---

## 11. Tables — the most-used surface in the product

Most of this application is a table. It gets its own section.

### 11.1 Standard capabilities

Built once in `DataTable` (TanStack Table v8 headless + our own markup):

- Server-side pagination, sorting, filtering and search — the table sends
  `page`, `per_page`, `sort`, `search` and whitelisted filters exactly as
  `API_CONTRACT.md` §5 defines them, and never filters client-side over a
  paginated set.
- URL as the source of truth for table state. A filtered, sorted, paginated view
  is a shareable link and survives reload and back-navigation.
- Column visibility, ordering and width persisted per user per table.
- Sticky header; optional sticky first column (SKU / name) on horizontal scroll.
- Row selection with a header checkbox, an indeterminate state, and a **selection
  action bar** that appears above the table (not a floating pill).
- Row actions in a `DropdownMenu`, with the one or two most common actions
  surfaced as icon buttons.
- Density follows the global preference (§2.5).
- Export current view — respects filters, and routes through the async job
  contract (`202` + poll) when over the row cap.
- Empty, filtered-empty, loading, background-refetch, error and partial-error
  states, all from §8.

### 11.2 Column rules

| Type | Alignment | Font | Notes |
|---|---|---|---|
| Text / name | start | sans | Truncate with a tooltip; never wrap in a dense table |
| Code / SKU / doc no. | start | **mono** | Copy-on-click |
| Quantity | end | **mono, tabular** | Unit shown in the header, not repeated per row |
| Money | end | **mono, tabular** | Currency symbol in the header; negatives in `danger` |
| Date / time | start | sans | Tenant timezone, relative for < 24h with an absolute tooltip |
| Status | start | sans | `StatusBadge` |
| Actions | end | — | Fixed width, never scrolls out on sticky-column tables |

Column headers state the unit and currency **once**, in the header. Repeating
"kg" 200 times down a column is noise.

### 11.3 Large data

- Virtualisation (`@tanstack/react-virtual`) engages above 200 rendered rows.
- Ledger-style surfaces (`stock_movements`, `audit_logs`, `notifications`,
  `webhook_deliveries`) use **cursor pagination** and an infinite-scroll list, and
  render `total` as "many" rather than forcing an expensive count
  (`API_CONTRACT.md` §5.1).
- No table ever requests more than 100 rows per page. "Load all" is an export,
  not a fetch.

### 11.4 Editable grids

Production entry, sales order lines, purchase order lines, stock count.

- Cell edit commits on blur or `Enter`; `Escape` reverts that cell.
- Validation is per-cell **and** per-row; an invalid row cannot be submitted but
  does not block editing other rows.
- Running totals live in a **sticky footer row**, recomputed with decimal-safe
  string arithmetic — never `parseFloat`.
- Add-row is the last row, focusable, and `Enter` on the final field creates the
  next row.
- Row removal animates via `Flip` so the user sees which row went.
- The whole grid is one form submission with one idempotency key per intent.

---

## 12. Forms

### 12.1 Stack

React Hook Form + Zod, with schemas **generated from the API contract types**
wherever possible so client and server validation cannot drift.

### 12.2 Rules

1. **Validate on blur, re-validate on change once a field has errored.** Never
   validate on the first keystroke — telling someone their email is invalid after
   they typed "a" is hostile.
2. Server validation always wins. `error.fields` dot paths map directly onto
   `setError()` (`API_CONTRACT.md` §4), including array paths like
   `items.0.quantity`.
3. **Submit is disabled while submitting**, never while merely invalid — a
   permanently disabled button with no explanation is a dead end. Invalid submit
   shows the errors.
4. `_form`-level errors render in an `ErrorSummary` above the actions.
5. **The idempotency key is generated when the form opens**, not per attempt
   (`API_CONTRACT.md` §6.2), so a double-click or a retry after a timeout cannot
   create two records.
6. Dirty-state tracking drives the unsaved-changes guard (state #17).
7. Required fields are marked on the label. Optional fields are not marked. Do not
   mark both.
8. Help text sits **under** the label, above the control, and is permanent —
   never a tooltip on a `?` icon for information the user needs to fill the field.
9. One column by default. Two columns only for genuinely related short fields
   (city/postcode, from/to). Never three.
10. Actions are bottom-right, primary rightmost, and **sticky** on long forms.
11. Long forms are sectioned with a summary rail, and save per section where the
    domain allows it.
12. Autofocus the first empty field on create; do not autofocus on edit (it
    scrolls the page and steals the reading position).

### 12.3 Decimal input

`NumberInput` and `MoneyInput` hold **strings**, not JS numbers, end to end.

- Value in state is the raw string; display formatting is applied on blur.
- Precision is clamped to the field's scale (money `4`, most quantities `4`,
  counts `0`).
- Paste is sanitised (thousands separators stripped, unicode minus normalised).
- The value sent to the API is the unformatted decimal string
  (`"1234.5000"`).
- **`type="number"` is not used** — its browser behaviours (scroll-wheel
  increment, locale-dependent parsing, silent value loss on invalid input) are
  wrong for money. `inputMode="decimal"` plus a pattern is used instead.

---

## 13. Charts and dashboards

- **Recharts**, wrapped. A feature never imports Recharts directly; it imports our
  chart components, so the palette, tooltip, legend, axis formatting, empty state
  and freshness stamp are consistent everywhere.
- Categorical series use `--chart-1…8`, which are **colourblind-checked** and have
  separate dark-mode values. Series are also distinguished by dash pattern or
  marker shape, so a chart is readable in greyscale and by a colourblind user.
- Every chart has: a title, an explicit unit, a legend when >1 series, a
  **freshness stamp**, an empty state ("No sales in this period"), an error state
  (§8 row 9) and a loading skeleton the same height as the final chart.
- Axis labels never rotate past 45°. If labels do not fit, the chart becomes
  horizontal bars.
- **No 3D, no donut with more than 5 slices, no dual y-axis** (dual axes
  manufacture correlations that are not there).
- Tooltips show the exact value with full precision and the unit; the axis may be
  abbreviated (`1.2M`), the tooltip never is.
- Dashboards are widget grids where **each widget is its own boundary and its own
  query** — one failing widget shows a compact error tile while its neighbours
  render (§8 row 19). Widgets the user lacks permission for are **not fetched and
  not returned** by the API (`API_CONTRACT.md` §15.2).
- Every dashboard number is clickable and drills through to the rows behind it. A
  KPI you cannot interrogate is decoration.

---

## 14. Documents, print and PDF

Invoices, delivery challans, purchase orders, salary slips, production reports and
POS receipts are **products**, not afterthoughts. A tenant's customers see the
invoice more often than they see the app.

- **One source of truth.** The `print-preview` endpoint returns template JSON
  (`API_CONTRACT.md` §12.2); the on-screen preview and the server-rendered PDF
  consume the same payload, so what is previewed is what prints.
- The **invoice builder** offers structured, bounded customisation — logo, header
  block, column selection, footer terms, signature block, paper size — not
  free-form HTML.
- Print styles are a first-class stylesheet: forced light tokens, no shell, no
  navigation, no interactive affordances, page-break control on line-item groups,
  repeated table headers across pages, and `page N of M`.
- Amounts appear in words where the document type requires it, in the tenant's
  locale.
- POS receipts target 58mm and 80mm thermal widths, monospace, no images except a
  1-bit logo.
- Any document longer than one page, or a batch export, goes through the async job
  contract rather than blocking the request.

---

## 15. Notifications and feedback hierarchy

Choosing the wrong feedback channel is the most common UX mistake in admin
software. The rule is mechanical:

| Channel | Use when | Never use for |
|---|---|---|
| **Inline (in place)** | The feedback belongs to a specific control or region — field errors, a saved indicator, a row result | Anything the user must act on elsewhere |
| **Toast** | Transient confirmation of a completed action the user just took, and they have moved on | Errors requiring action; warnings that must persist; anything with a form in it |
| **Alert banner (inline)** | Persistent state of the current screen — a warning, a blocking business rule, offline, stale data | Momentary success |
| **Modal** | A decision is required before continuing — confirm destructive, resolve a conflict, session expiry | Information that could be a banner |
| **Notification centre** | Asynchronous events not tied to the current screen — a job finished, an approval arrived, a webhook failed | Immediate feedback for a local action |
| **Badge / count** | Ambient awareness — unread count, queued offline writes | Anything urgent on its own |

Additional rules:

- Toasts: max **3** visible, stacked, auto-dismiss at 4s for success and **never**
  for errors. Every toast with a consequence carries an action ("Undo", "View").
- Destructive confirmation names the object ("Delete product *Kimchi 500g*?") and
  states the consequence. For irreversible, high-impact actions the user types the
  object name to confirm.
- **Undo is preferred over confirm** wherever a soft delete or reversal exists —
  it is faster for the 99% and safer for the 1%.
- Success does not always need a toast. A row appearing in a table, correctly, is
  its own confirmation.

---

## 16. Performance budget (UI side)

From `ARCHITECTURE.md`, restated as design constraints:

| Metric | Budget |
|---|---|
| Initial JS (gzipped, critical path) | ≤ 200KB |
| Route chunk | ≤ 100KB |
| LCP on 4G, mid-range Android | ≤ 2.5s |
| INP | ≤ 200ms |
| CLS | ≤ 0.05 (skeletons contribute `0`) |
| Time to interactive shell | ≤ 3s |
| Table with 100 rows, sort/filter | ≤ 100ms perceived |
| Motion frame rate | 60fps on mid-range Android |

Enforced by: route-level code splitting, lazy GSAP and lazy chart imports, no
moment/lodash, tree-shaken Lucide icons, self-hosted subset fonts with
`font-display: swap` and preloaded weights, `bundlesize` in CI, and Lighthouse CI
budgets on the phase exit gate.

---

## 17. Prototype migration

The existing prototype at the repository root moves to `/frontend` and is
triaged, not adopted wholesale.

| Asset | Decision |
|---|---|
| `src/index.css` (717 lines) | **Keep, refactor** — split into the five token files of §2.1; existing scales are the seed of layer 1 |
| `src/components/ui/*` | **Keep, harden** — fix the Modal focus trap, Tabs arrow keys and Skeleton dynamic class defects (§9.2); re-point all colours to semantic tokens |
| `src/components/ErrorBoundary.tsx` (390 lines) | **Keep, extend** to the four-level model (§8.4) |
| `src/lib/utils.ts` | **Keep, delocalise** — remove the hardcoded `'en-BD'`; formatting reads tenant settings |
| `src/components/modals/QuickEntryModals.tsx` | **Refactor** onto real forms and real endpoints |
| `tailwind.config.js` | **Delete** — Tailwind v4 CSS-first (ADR-020) |
| `src/pages/PlaceholderPage.tsx` (~1,706 lines) | **Delete** — placeholder screens are forbidden |
| `src/data/mockData.ts` (374 lines) | **Delete** — fake data is forbidden in the app; fixtures live in MSW handlers generated from the contract |
| `src/store/useAppStore.ts` | **Retire the pattern** — server state moves to TanStack Query; Zustand keeps UI-only state (ADR-013) |
| `src/router/index.tsx` | **Rebuild** — route-level code splitting, boundaries, permission guards |

---

## 18. Definition of done for any UI work

A screen or component is not done until every box is checked. This is the
checklist used in review.

- [ ] Every applicable state from §8 implemented and demonstrable
- [ ] Light and dark mode both correct, verified visually
- [ ] Keyboard-only operable end to end; focus order logical; focus visible
- [ ] `axe` clean; contrast verified in both modes
- [ ] Verified with motion disabled — nothing confusing, nothing lost
- [ ] Verified at 320px, 768px, 1280px and 200% zoom
- [ ] No raw colour values; no dynamic utility class names; no `dark:` variants
- [ ] All copy from i18n bundles; tested with a 40%-inflated pseudo-locale
- [ ] Money and quantity handled as decimal strings; tabular mono alignment
- [ ] Loading skeleton matches final layout; measured CLS contribution `0`
- [ ] Mutations carry an idempotency key generated per intent
- [ ] Every error code the endpoint can return has a designed state
- [ ] `AbortSignal` wired; navigating away produces no error toast
- [ ] Freshness stamp rendered wherever aggregates appear
- [ ] Permission-gated elements are absent, not disabled or CSS-hidden
- [ ] Unsaved-changes guard present on any form that can lose work
- [ ] Storybook stories for every variant including error and loading
- [ ] No placeholder text, no lorem ipsum, no mock data, no dead buttons

---

## 19. Forbidden — the consolidated list

1. Raw hex, `rgb()` or primitive tokens in a component file.
2. `dark:` utility variants.
3. Dynamically constructed Tailwind class names.
4. A `tailwind.config.js`.
5. Arbitrary durations or easings not from `tokens.motion.css`.
6. Animating layout properties (`width`, `height`, `top`, `left`, `margin`).
7. Full-screen spinners outside the boot loader.
8. Fake progress bars or fake percentages.
9. Skeletons that do not match the final layout.
10. A screen without an empty state, or with the same empty state for "no data"
    and "filtered to zero".
11. Mock, demo or placeholder data in a shipped screen.
12. Placeholder pages, dead buttons, or links to unimplemented routes.
13. `catch {}` — swallowing an error without a UI consequence.
14. Stack traces, SQL, class names, file paths or internal integer IDs in the UI.
15. `<div onClick>` in place of a `<button>`.
16. `outline: none` without a visible replacement.
17. Placeholder text used as the only label.
18. `type="number"` for money.
19. `parseFloat` on a money or quantity value.
20. A hardcoded locale, currency, timezone or date format.
21. Hardcoded "Slice Mart" anywhere — it is tenant #1, not the product.
22. Client-side filtering or sorting across a server-paginated set.
23. Server data stored in Zustand.
24. A widget hidden with CSS instead of not being fetched.
25. An aggregate number without a freshness stamp.
26. A new error code with no corresponding designed state.

---

## 20. Open questions

| # | Question | Current default |
|---|---|---|
| Q10 | Storybook or Ladle for the component workshop? | Storybook — better a11y and interaction-test addons, accepted build cost |
| Q11 | Do we ship a public design-token package for tenant white-label portals? | No in v1; revisit if a tenant needs an embedded surface |
| Q12 | Is there a third density ("ultra-compact") for the accounting ledger screens? | No — compact plus virtualisation should be enough; measure first |
| Q13 | Does the storefront (Phase 9) share this token system or get its own? | Shares layer 1 and layer 2; adds a storefront-only layer 3 and its own motion budget |

---

## 21. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Initial canonical UI system. Three-layer tokens (ADR-020), dark mode by token re-mapping (ADR-026), the 20-row state matrix (ADR-024), accessibility contract (ADR-023), and the full motion and craft chapter incl. the two-library boundary, motion tokens, three-tier loading model and reduced-motion contract (ADR-031). Supersedes all UI guidance in `docs/_legacy/**`. |
