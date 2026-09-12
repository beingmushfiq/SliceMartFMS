---
trigger: always_on
---

# ERP Workspace Data Tables & Row Actions Standard

> **Status:** Canonical Workspace Table & Action Specification  
> **Applicability:** All workspace tables (Staff Directory, Departments & Roles, Factory Wages, Attendance, Invoices, Orders, Inventory, Catalog, etc.)  
> **Origin:** Established during the Staff Directory usability overhaul to eliminate horizontal scroll, remove redundant buttons, and replace ambiguous 3-dot icons with clear, discoverable action controls.

---

## 1. Zero-Overflow & Layout Principles

1. **Strict Zero Horizontal Scroll Guarantee:**
   - On standard desktop/laptop viewports (1280px–1440px) with the sidebar open (240px), the content area is ~1040px–1150px.
   - Total intrinsic width across all table columns must sum to **≤ 1030px**.
   - The table container must use:
     ```tsx
     <div className="bg-surface rounded-2xl shadow-2xs border border-default/70 overflow-hidden">
       <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-default/30">
         <table className="w-full text-left text-xs text-default border-collapse">
     ```

2. **Tightened Cell Padding Standard:**
   - **Never** use indiscriminate `px-3` or `px-4` on every table column (10 columns × `px-3` = 240px wasted on padding alone).
   - Use `px-2` (8px each side) for short codes, phones, types, shifts, statuses, checkboxes, and actions.
   - Use `px-2.5` (10px each side) for text-rich columns (Names, Departments, Descriptions, Emails).

3. **Column Width Budgeting:**
   - **Checkbox:** `w-9 px-2 text-center` (~36px).
   - **Code/ID:** `w-20 px-2 font-mono font-bold text-primary whitespace-nowrap` (~80px). Short IDs (`EMP-001`, `INV-102`) do not need 100px+.
   - **Status Badges:** `px-2 text-center whitespace-nowrap` (~70px).
   - **Phone / Metadata:** `px-2 font-mono text-xs text-muted whitespace-nowrap` (~95px).
   - **Actions Column:** `w-36 px-2 text-right whitespace-nowrap` (~144px).

4. **"Don't Borderize":**
   - Avoid harsh vertical dividers (`border-l`, `border-r`, boxed cells).
   - Use soft horizontal dividers (`divide-y divide-default/40`) and soft hover rows (`hover:bg-surface-sunken/40` or `bg-primary/5` when selected).

---

## 2. Row Actions Column Architecture

### Rule: Only Two Symmetrical Interactive Buttons Per Row
Do **not** place 3+ standalone action buttons directly on the table row. Having secondary buttons (e.g. `Print ID Badge`, `Download PDF`) on the row when they also exist in the dropdown is redundant visual clutter.

```tsx
<td className="w-36 px-2 py-2.5 text-right whitespace-nowrap">
  <div className="flex items-center justify-end gap-1.5 relative">
    {/* 1. Primary Direct Action Button */}
    <button
      type="button"
      onClick={() => setViewingProfile(item)}
      className="px-2.5 py-1 text-xs bg-surface border border-default hover:bg-surface-sunken text-default rounded-lg font-medium transition cursor-pointer"
      title="View complete record"
    >
      Profile
    </button>

    {/* 2. Prominent Actions Dropdown Button (Never a bare 3-dot icon!) */}
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpenActionMenuId(openActionMenuId === item.id ? null : item.id);
        }}
        className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs ${
          openActionMenuId === item.id
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-default bg-surface hover:bg-surface-sunken text-default'
        }`}
        title={`More actions for ${item.name}`}
        aria-label={`More options for ${item.name}`}
      >
        <span>Actions</span>
        <ChevronDown className="size-3 text-muted" />
      </button>

      {/* Dropdown Menu */}
      {openActionMenuId === item.id && (
        <div
          data-action-menu
          className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl bg-surface border border-default p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-left"
        >
          {/* Menu items... */}
        </div>
      )}
    </div>
  </div>
</td>
```

---

## 3. Why Naked 3-Dot Icons Are Prohibited
1. Squeezed against the far right border, a bare 20px circle with 3 faint dots looks like trailing punctuation or text truncation indicator (`...`).
2. Users fail to discover that critical actions (Security Access, Permissions, Status Toggles, Delete) exist inside it.
3. An explicit **`Actions ▾`** button (`px-2.5 py-1 text-xs rounded-lg border font-medium` with `ChevronDown`) has an unmistakable interactive visual affordance and comfortable hit-box.

---

## 4. Dropdown Menu Specification

1. **Click-Outside Architecture:**
   - Use `data-action-menu` on the dropdown container.
   - Bind a document-level mousedown/click listener:
     ```tsx
     useEffect(() => {
       const handleOutsideClick = (e: MouseEvent) => {
         const target = e.target as HTMLElement;
         if (!target.closest('[data-action-menu]')) {
           setOpenActionMenuId(null);
         }
       };
       document.addEventListener('click', handleOutsideClick);
       return () => document.removeEventListener('click', handleOutsideClick);
     }, []);
     ```
   - **Never** add `onClick={(e) => e.stopPropagation()}` to non-interactive `<div>` containers without key handlers (violates `jsx-a11y`).

2. **Menu Item Structure & Color Semantics:**
   - Standard button styling:
     ```tsx
     className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-default hover:bg-surface-sunken transition-colors cursor-pointer"
     ```
   - **Secondary Operation (e.g. Print, Export, Vault):**
     - Icon: Brand or neutral icon (`<Printer className="size-3.5 text-primary shrink-0" />`).
   - **Access / Role Management:**
     - Icon: Amber icon (`<KeyRound className="size-3.5 text-amber-500 shrink-0" />`).
   - **Status Toggle (Active/Inactive):**
     - Icon: Emerald/Amber icon (`<ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />`).
   - **Destructive Separation:**
     - Include a soft divider: `<div className="my-1 border-t border-default/50" />`.
     - Red text and icon:
       ```tsx
       <button
         type="button"
         onClick={() => {
           setOpenActionMenuId(null);
           setDeleteConfirm({ open: true, type: '...', id: item.id, name: item.name });
         }}
         className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
       >
         <Trash2 className="size-3.5 text-rose-600 shrink-0" />
         <span>Delete ...</span>
       </button>
       ```
   - **Confirmation Protection:** Destructive actions MUST trigger an explicit confirmation modal before executing API deletions.

---

## 5. Bulk Selection Toolbar Pattern

When tables support row checkboxes:
1. **Header Checkbox:**
   - Tri-state: `CheckSquare` when all selected, `MinusSquare` when some selected, `Square` when none selected.
2. **Floating Action Ribbon (`sticky top-2 z-30`):**
   - Appears dynamically when `selectedIds.length > 0`.
   - Displays selected counter pill, bulk status modification buttons (`Mark Active`, `Mark Inactive`), batch secondary actions (`Print Badges (N)`, `Export Selected`), and a high-visibility `Delete Selected (N)` with confirmation modal.
   - Includes a clear `Deselect All` button.
