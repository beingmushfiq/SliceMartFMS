# QA CHECKLIST — THE 10-POINT ENTERPRISE QUALITY GATE

> **Status:** Canonical Quality Assurance Specification  
> **Rule:** No feature or module is marked complete until all 10 gates are verified green.  

---

## The 10 Mandatory Quality Gates

Every feature must pass:

```
[ Gate 1: Happy Path Execution ]
Verify the intended user workflow functions seamlessly end-to-end with real database writes.

[ Gate 2: Validation & Edge Cases ]
Submit invalid, empty, out-of-range, and boundary inputs. Ensure clean inline errors.

[ Gate 3: Error Recovery & Rollback ]
Simulate network timeout (500/504). Ensure UI does not crash, preserves form data, and allows retry.

[ Gate 4: Granular RBAC Permissions ]
Log in as restricted user role. Verify unauthorized actions are blocked with HTTP 403.

[ Gate 5: Cross-Tenant Isolation ]
Attempt to query or modify Tenant B's entity UUID using Tenant A's token. Verify HTTP 404.

[ Gate 6: Empty States & Zero-Data UX ]
Clear all module records. Verify friendly illustration, explanation, and primary action CTA.

[ Gate 7: High-Volume & Pagination ]
Verify table behavior with 100+ records. Check sort, filter flyout, search, and page navigation.

[ Gate 8: Responsive Layouts (Mobile, Tablet, Desktop) ]
Test at 375px (mobile), 768px (tablet), 1280px (laptop), 1920px (desktop). No horizontal overflow.

[ Gate 9: Light & Dark Theme Parity ]
Toggle theme. Verify text contrast, border visibility, chart legibility, and modal backdrops.

[ Gate 10: Keyboard & Accessibility (A11y) ]
Operate entire workflow using Tab, Shift+Tab, Enter, and Escape. Axe accessibility check clean.
```

---

## Exit-Gate Sign-off Matrix

| Gate Number | Description | Pass Criteria | Verified By |
|---|---|---|---|
| **Gate 1** | Functional Workflow | All entity transitions write to ledger atomically. | Automated Feature Test |
| **Gate 2** | Input Validation | FormRequest rules reject invalid payloads with 422. | PHPUnit Validation Suite |
| **Gate 3** | Error Recovery | UI Error Boundary catches failure without white screen. | Manual Network Throttle |
| **Gate 4** | Permissions | 403 returned on unauthorized actions. | Security Test Case |
| **Gate 5** | Tenant Isolation | Zero cross-tenant data leakage. | Isolation Test Suite |
| **Gate 6** | Empty States | Contextual CTA rendered when table empty. | Visual Inspection |
| **Gate 7** | Pagination | Paginated envelope `{ success, data, meta }`. | API Contract Test |
| **Gate 8** | Responsive | Drawer/drawer sidebar collapses on mobile viewports. | Browser Viewport Test |
| **Gate 9** | Dark Mode | All CSS variables inherit semantic dark tokens. | Visual Regression |
| **Gate 10** | Accessibility | Keyboard focus visible, Escape closes overlays. | Manual Tab Walkthrough |
