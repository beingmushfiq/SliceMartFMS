# DOCUMENTATION INDEX

> **Status:** Canonical index. Start here.
>
> **Last updated:** 2026-08-28 · **Phase:** Multi-Tenant SaaS Platform, E-Commerce Storefront CMS, Courier Hub, Fraud Check & WhatsApp Engine Complete (100% Gated)

---

## 0. Read this first

This folder is the **specification of record** for a multi-tenant
Manufacturing + Inventory + Sales + Workforce + Delivery SaaS platform.

Three rules govern everything in it:

1. **The documents are binding, not advisory.** Code that contradicts them is a
   defect in the code, not a variation in style.
2. **Nothing gets built that is not documented first.** A table, an endpoint, a
   permission or a screen state that appears in code but not in these documents
   is unfinished work.
3. **When you change behaviour, you change the document in the same commit.**
   Documentation drift is treated as a broken build, because a specification
   nobody trusts is worse than none.

If a request conflicts with an accepted decision in
[DECISIONS.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/DECISIONS.md):
**stop, state the conflict, and ask for an explicit override.** Do not silently
deviate and do not quietly "improve" a decision.

---

## 1. What you are building (30 seconds)

| | |
|---|---|
| **Product** | Multi-tenant SaaS for manufacturers who also sell, deliver and employ |
| **Tenant #1** | Slice Mart — a customer, **never** a hardcoded assumption |
| **Chain** | Plan → Batch → Input + Worker Production + Material Issue → Output → QC → Pass / Rework / Scrap / Wastage |
| **Then** | Inventory ledger → Sales (counter · dealer · phone · field · online) → Delivery → Money |
| **Stack** | Laravel 13 / PHP 8.5 · MySQL 8 · React 19 · TypeScript strict · Vite · Tailwind v4 |
| **Shape** | Modular monolith, shared-schema tenancy on `tenant_id`, contract-first API |

Full context: [PROJECT_CONTEXT.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/PROJECT_CONTEXT.md).

---

## 2. Document precedence (binding)

When two documents disagree, **the higher rank wins.** This table is duplicated
in `DECISIONS.md` §0; if the two ever differ, `DECISIONS.md` is authoritative.

| Rank | Document | Owns |
|---|---|---|
| **1** | `DECISIONS.md` | Every binding architectural decision (ADR-001 … ADR-031) |
| **2** | `PROJECT_CONTEXT.md` | Product scope, domain language, business rules, UI/UX charter |
| **3** | `ARCHITECTURE.md` | Layering, tenancy enforcement, auth, request lifecycle, transactions |
| **4** | `DATABASE_DESIGN.md` · `API_CONTRACT.md` · `UI_SYSTEM.md` | Schema · wire format · interface |
| **5** | `MODULE_MAP.md` · `ROADMAP.md` · `RMS_REPORT_MATRIX.md` | Module boundaries · delivery order · report registry |
| **6** | `TASK_PROTOCOL.md` · `DEVELOPMENT_STATUS.md` | How to work · what is actually done |
| **7** | Source code | The implementation |
| **—** | `_legacy/**` | **Non-authoritative.** Historical reference only. |

Two consequences people miss:

- **Rank 7 means code loses.** If the code does something the contract does not
  describe, the code is wrong — even if it works.
- **Rank 4 is a tie.** `DATABASE_DESIGN.md`, `API_CONTRACT.md` and
  `UI_SYSTEM.md` cover disjoint concerns and must never contradict each other.
  If they do, that is a rank-1 problem: escalate to a new ADR.

---

## 3. The documents

### Canonical — the seven mandated documents

| # | Document | Read it when you need to know | Size |
|---|---|---|---|
| 1 | [DECISIONS.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/DECISIONS.md) | *Why* something is the way it is, and whether you are allowed to change it | 31 ADRs |
| 2 | [PROJECT_CONTEXT.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/PROJECT_CONTEXT.md) | What the product is, who uses it, what the words mean, what is out of scope | 12 § |
| 3 | [ARCHITECTURE.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/ARCHITECTURE.md) | Where code goes, how a request flows, how tenancy and auth are enforced | 11 § |
| 4 | [DATABASE_DESIGN.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/DATABASE_DESIGN.md) | Tables, columns, keys, the inventory ledger, migration waves | 169 tables |
| 5 | [API_CONTRACT.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/API_CONTRACT.md) | Envelope, error codes, pagination, idempotency, auth flow, endpoint families | 46 codes |
| 6 | [UI_SYSTEM.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/UI_SYSTEM.md) | Tokens, dark mode, motion, the state matrix, accessibility, tables, forms | 21 § |
| 7 | [MODULE_MAP.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/MODULE_MAP.md) | The 41 modules, their dependencies, their phase, the Definition of Done | 41 modules |

### Supporting — operational documents

| Document | Purpose |
|---|---|
| [ROADMAP.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/ROADMAP.md) | Phases 0–10, each with deliverables and a **numbered, testable exit gate** |
| [TASK_PROTOCOL.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/TASK_PROTOCOL.md) | The procedure for a single unit of work, start to merge |
| [DEVELOPMENT_STATUS.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/DEVELOPMENT_STATUS.md) | The live ledger: what is done, what is in flight, what is next |
| [RMS_REPORT_MATRIX.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/RMS_REPORT_MATRIX.md) | Every report: source of truth, filters, permission, live vs pre-aggregated |

### `_legacy/` — 14 archived files

Two earlier, mutually incompatible documentation generations plus the original
`MASTER_*` prompts. Kept **only** so decisions can be traced back to their
origin. Never cite them, never follow them, never copy from them. Every
contradiction they contained is resolved by an ADR.

---

## 4. Where to start, by what you are doing

| If you are… | Read, in this order |
|---|---|
| **New to the project** | This file → `PROJECT_CONTEXT.md` → `ARCHITECTURE.md` → `MODULE_MAP.md` |
| **Starting a task** | `TASK_PROTOCOL.md` → `DEVELOPMENT_STATUS.md` → the ADRs it names |
| **Adding a table** | `DATABASE_DESIGN.md` §§ conventions + the relevant group → then the migration wave |
| **Adding an endpoint** | `API_CONTRACT.md` §§ envelope, errors, pagination, idempotency → then the endpoint family |
| **Building a screen** | `UI_SYSTEM.md` §6 archetypes → §8 state matrix → §10 inventory → §9 accessibility |
| **Touching money or stock** | `DATABASE_DESIGN.md` ledger section → `ARCHITECTURE.md` transaction boundaries → `API_CONTRACT.md` idempotency |
| **Adding a permission** | `MODULE_MAP.md` §7 namespace registry → `ARCHITECTURE.md` RBAC |
| **Adding motion** | `UI_SYSTEM.md` §7 → ADR-031 |
| **Planning the next phase** | `ROADMAP.md` §3 for the phase → §4 for its exit gate |
| **Reviewing a PR** | `MODULE_MAP.md` §6 Definition of Done → `UI_SYSTEM.md` §18 → `ROADMAP.md` §5 |

---

## 5. The rules that are easiest to break

These are the ones that cost the most when missed, restated here so they cannot
be claimed as unknown. Each has a full treatment in the document named.

| # | Rule | Source |
|---|---|---|
| 1 | Every tenant-owned query is scoped by `tenant_id`. Cross-tenant access returns **`404`, not `403`** — existence itself is confidential. | ADR-002, `ARCHITECTURE.md` |
| 2 | Money and quantity are `DECIMAL(18,4)` in the database and **JSON strings** on the wire. Never `float`, never `parseFloat`. | ADR-009, `API_CONTRACT.md` |
| 3 | Stock changes only via an append-only ledger row. `stock_balances` is a rebuildable cache, never the truth. | ADR-013, `DATABASE_DESIGN.md` |
| 4 | Yield and variance stay `NULL` until `context_completeness = context_complete`. A wrong number is worse than no number. | ADR-012, `DATABASE_DESIGN.md` |
| 5 | Every mutating endpoint accepts `Idempotency-Key`, scoped to the **intent**, not the attempt. | ADR-016, `API_CONTRACT.md` |
| 6 | No hardcoded tenant, currency, locale, timezone, warehouse count or line count. Anywhere. | ADR-001, ADR-004 |
| 7 | Every screen implements every applicable state in the matrix — including 401, 403, `OUT_OF_SCOPE`, timeout, conflict, offline. | ADR-024, `UI_SYSTEM.md` §8 |
| 8 | Server state lives in TanStack Query. Zustand holds UI-only state. Never duplicate server data into a store. | ADR-021 |
| 9 | Components read semantic tokens only. No raw hex, no `dark:` variants, no dynamically constructed class names. | ADR-020, ADR-026 |
| 10 | Errors are never hidden, never faked into success, never shown as a stack trace. Every failure offers a next action. | ADR-024 |
| 11 | Frontend types are **generated** from the backend contract. Hand-written duplicates are forbidden. | ADR-030 |
| 12 | No placeholder pages, no mock data, no "TODO: wire up later" in a merged change. | `ROADMAP.md` §1 |

---

## 6. Conventions used across these documents

| Marker | Meaning |
|---|---|
| **Binding** / **Non-negotiable** | No deviation without a new ADR |
| **Forbidden** | Blocks merge. Not a preference. |
| **Merge gate** / **Exit gate** | A reviewer must be able to verify it mechanically |
| `ADR-0xx` | A decision in `DECISIONS.md`. Cite it rather than re-arguing it. |
| **Open question** `Qn` | Not yet decided. Has a stated default so work is never blocked. |
| **Deferred** | Deliberately out of v1 scope. Not forgotten, not sneaking in. |

Terminology is fixed in `PROJECT_CONTEXT.md`. Use the domain word the documents
use — `batch`, `issue`, `movement`, `scope`, `channel` — in code, in the UI, in
commits and in conversation. When one concept has two names, one of them is a
future bug.

---

## 7. Maintaining these documents

**Adding a decision.** Append a new ADR. Never edit an accepted one in place;
supersede it, and mark the old one `Superseded by ADR-xxx`. The history is the
point.

**Changing a schema, endpoint or screen state.** Update the rank-4 document in
the same commit as the code. `DEVELOPMENT_STATUS.md` records what shipped;
`TASK_PROTOCOL.md` describes the sequence.

**Resolving an open question.** Promote it to an ADR, then delete it from the
open-questions section of the document that raised it. An open question with an
answer somewhere else is drift.

**Every document ends with a change log.** Date it, say what changed, say what
it supersedes. If you cannot describe the change in one line, it is probably two
changes.

---

## 8. Current state

| | |
|---|---|
| **Phase 0 — Architecture & documentation** | ✅ **Closed.** The seven canonical documents plus five supporting documents (12 in total) written, 14 legacy files archived, 31 ADRs accepted. Monorepo, Laravel skeleton, token cascade, dependency reconciliation, UI primitive hardening, the §8 state-matrix reliability layer, the transport seam, tooling configuration (frontend **and** backend), test suites and CI all complete — every gate measured green in `DEVELOPMENT_STATUS.md` §3.4. |
| **Phase 1 — Auth + Tenancy + RBAC + Design System** | ✅ **Closed.** All 25 Migration Waves (169 tables + all deferred closures) written and verified. Tenancy runtime (`app/Core`, `TenantContext`, `BelongsToTenant`, `ResolveTenant`, `EnsureTenantActive`, `CorrelationId`, `ErrorResponse`) live. Full Auth & RBAC Pipeline complete: `JwtService`, `RefreshTokenService`, `PermissionCatalogue`, `AuthenticateJwt`, `AuthorizePermission`, `AuthController`, and all 12 Auth Actions (`LoginAction`, `RefreshTokenAction`, `LogoutAction`, `LogoutAllAction`, `GetAuthMeAction`, `GetPermissionsCatalogueAction`, `SelectTenantAction`, `SwitchBranchAction`, `UpdatePreferencesAction`, `ChangePasswordAction`, `ForgotPasswordAction`, `ResetPasswordAction`) wired to `api_public.php` and `api_tenant.php`. Passing 492 tests / 2575 assertions with 100% PHPStan Level 9 and Pint compliance. |
| **Phase 2 — Master data · Products · Warehouses** | 🔄 **Ready for implementation.** |
| **Code in repository** | `/frontend` — design-system foundation, all 9 UI primitives, the §8 reliability primitives and the single transport seam, with 128 passing tests. `/backend` — Laravel 13.26.1 skeleton on PHP `^8.5` with Pint + PHPStan level 9 passing, 169 migrated tables across Waves 1–25, the tenancy runtime (`app/Core`), and the full Phase 1 Auth/RBAC pipeline live (492 tests / 2575 assertions). |

Live detail: [DEVELOPMENT_STATUS.md](file:///d:/Factory%20Production,%20Inventory%20&%20Business%20Management%20System/slicemart-fms/docs/DEVELOPMENT_STATUS.md). Resuming in a new session: start at its §7 and §8.

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-08-22 | Created. Establishes the documentation index and restates the binding precedence rule. Supersedes the navigation guidance in `_legacy/AI_PROJECT_CONTEXT.md`. |
| 2026-08-22 | Consistency pass: §8 now states the document count as seven canonical plus five supporting (12 total) rather than "nine canonical". |
| 2026-08-23 | §8 corrected — it still described the code as "a frontend prototype only, at the repository root", which stopped being true when the monorepo restructure landed. |
| 2026-08-23 | **Phase 0 marked closed.** §8 had said "closeout in progress" with UI primitives, tooling and CI outstanding, and still counted "2 of 8 UI primitives" — all three now complete and verified. Records the §8 reliability layer, the transport seam, backend tooling, the test suites and the rewritten CI, and points at `DEVELOPMENT_STATUS.md` §3.4 for the measured gate results rather than restating them here. |
| 2026-08-23 | §8 updated for Phase 1 migration Waves 1 (platform) and 2 (org): ten tables now exist, 30 backend tests / 145 assertions, next action Wave 3 (identity). |
| 2026-08-23 | §8 updated for Phase 1 migration Wave 3 (identity): seventeen tables now exist, 50 backend tests / 221 assertions, next action Wave 4 (infrastructure). |
| 2026-08-23 | §8 updated for Phase 1 migration Wave 4 (infrastructure): twenty-four tables now exist, 77 backend tests / 316 assertions, next action the tenancy runtime. |
| 2026-08-23 | §8 updated for the **tenancy-runtime delivery** (§7 item 29, committed `781e4da`): `app/Core` now exists — `TenantContext`, `BelongsToTenant`, `ResolveTenant` · `EnsureTenantActive` · `CorrelationId`, `ErrorResponse`, and the three route files wired through `bootstrap/app.php`. |
| 2026-08-24 | **Phase 1 marked closed.** All 25 Migration Waves (169 tables + deferred closures), the Tenancy Runtime, and the Phase 1 Auth & RBAC Pipeline are 100% complete and passing all gates. Delivered `JwtService`, `RefreshTokenService`, `PermissionCatalogue`, `AuthenticateJwt`, `AuthorizePermission`, `AuthController`, and all 12 Auth Actions. Backend test count reaches 492 tests / 2575 assertions with 100% PHPStan Level 9 and Pint compliance. Project is ready for Phase 2 (Master data · Products · Warehouses). |

