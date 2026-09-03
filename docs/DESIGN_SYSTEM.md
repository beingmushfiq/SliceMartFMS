# DESIGN SYSTEM — ENTERPRISE TOKEN CASCADE & COMPONENT TOKENS

> **Status:** Canonical Design System Specification  
> **Philosophy:** Industrial, Modern, Editorial, Data-Rich, Calm, Accessible, 100% Dark Mode Parity  
> **Core Rule:** ZERO hardcoded colors. Zero random gradients. Zero generic AI blobs. Beauty must serve operational clarity.  

---

## 1. Design Tokens Architecture

SliceMart uses a **Three-Tier Design Token Cascade** implemented via CSS Custom Properties:

```
Tier 1: PRIMITIVE TOKENS (tokens.primitive.css)
        Palette raw values: Slate, Emerald, Crimson, Amber, Indigo, Violet
        ↓
Tier 2: SEMANTIC TOKENS (tokens.semantic.css & tokens.semantic.dark.css)
        Functional meaning: surface, text, border, status, action
        ↓
Tier 3: COMPONENT TOKENS (tokens.component.css)
        Element bindings: table-header-bg, modal-backdrop, input-focus-ring
```

### 1.1 Semantic Color Tokens

```css
:root {
  /* Surfaces */
  --color-surface-canvas: #f8fafc;
  --color-surface-panel: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-surface-subtle: #f1f5f9;

  /* Borders */
  --color-border-default: #e2e8f0;
  --color-border-subtle: #edf2f7;
  --color-border-strong: #cbd5e1;

  /* Typography */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Status Colors */
  --color-status-success: #10b981;
  --color-status-warning: #f59e0b;
  --color-status-error: #ef4444;
  --color-status-info: #0ea5e9;

  /* Brand Accents */
  --color-brand-primary: #3b82f6;
  --color-brand-hover: #2563eb;
  --color-brand-focus: rgba(59, 130, 246, 0.25);
}

.dark {
  /* Intentional Dark Mode Surfaces (Never inverted black/white) */
  --color-surface-canvas: #0b0f19;
  --color-surface-panel: #111827;
  --color-surface-elevated: #1f2937;
  --color-surface-subtle: #1e293b;

  --color-border-default: #1f2937;
  --color-border-subtle: #192231;
  --color-border-strong: #374151;

  --color-text-primary: #f9fafb;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;
  --color-text-inverse: #0b0f19;

  --color-status-success: #34d399;
  --color-status-warning: #fbbf24;
  --color-status-error: #f87171;
  --color-status-info: #38bdf8;
}
```

---

## 2. Typography & Density Scale

- **Primary Font Family:** Inter, system-ui, -apple-system, sans-serif
- **Monospace Family (for SKUs, Batches, UUIDs, Barcodes):** JetBrains Mono, Fira Code, monospace
- **Information Density:** Compact, crisp, engineered for 8–12 hour operational shifts without eye fatigue.

| Style Name | Font Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `display` | 32px (2.0rem) | 1.2 | 700 Bold | Hero headers, Platform landing |
| `h1` | 24px (1.5rem) | 1.25 | 600 SemiBold | Primary Workspace titles |
| `h2` | 18px (1.125rem) | 1.3 | 600 SemiBold | Section headings, Card headers |
| `h3` | 15px (0.9375rem) | 1.35 | 600 SemiBold | Modal headers, group titles |
| `body` | 13px (0.8125rem) | 1.45 | 400 Regular | Primary table rows, form inputs |
| `body-sm` | 12px (0.75rem) | 1.4 | 400 Regular | Metadata, helper texts |
| `caption` | 11px (0.6875rem) | 1.35 | 500 Medium | Badge labels, table column headers |
| `mono` | 12px (0.75rem) | 1.4 | 500 Medium | Order numbers, UUIDs, IPs |

---

## 3. Standardized Component Library Specifications

1. **Button:** Variants (`primary`, `secondary`, `destructive`, `ghost`, `outline`), Sizes (`xs`, `sm`, `md`, `lg`), with loading spinner and disabled focus ring.
2. **Dropdown / Select:** Simple, Searchable, Async (paginated), Multi-select with chips, Viewport collision detection, Keyboard Arrow/Enter navigation.
3. **Form Elements:** Input, Textarea, NumberInput, CurrencyInput (with dynamic tenant symbol), PhoneInput, DatePicker, Switch, Checkbox, RadioGroup.
4. **Data Grid (Table):** Server-side pagination, sticky headers, multi-column sort, filter flyout, column visibility toggle, row selection checkboxes, row action menu, CSV export.
5. **Feedback & Overlays:** Modal with focus trap, ConfirmDialog with explicit destructive consequences, Drawer (slide-out panel), Popover, Tooltip, Sonner Toast (deduplicated).
6. **State Placeholders:** Shimmer Skeletons, Empty State with contextual action trigger, Error Card with retry button, Offline banner.
