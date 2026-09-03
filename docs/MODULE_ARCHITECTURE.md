# MODULE ARCHITECTURE — THE 13-ARTEFACT MODULE STANDARD

> **Status:** Canonical Architecture Specification  
> **Rule:** Every module behaves like an independent, production-grade product with uniform anatomy, clean boundaries, and zero chaotic coupling.  

---

## 1. The Anatomy of an Enterprise Module

Every domain module in the SliceMart FMS ecosystem (Catalogue, Production, Inventory, Purchasing, Sales, POS, Delivery, HR, Finance, Assets, QC, Reports, CMS, Documents) must provide the following 10 architectural views and surfaces:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MODULE WORKSPACE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Module Dashboard      │ Domain KPIs, alerts, throughput, trends, bottlenecks│
│ 2. List View (Data Grid) │ Paginated table, server filters, search, bulk ops   │
│ 3. Detail View           │ Primary entity record, relations, status banner     │
│ 4. Create / Edit Form    │ Tokenized form, inline validation, autosave drafts  │
│ 5. Workflow Actions      │ Approve, Reject, Dispatch, Void, Recalculate        │
│ 6. Lifecycle Timeline    │ Sequential historical status transitions            │
│ 7. Audit Log / Diffs     │ Who changed what, old value vs new value, IP & user │
│ 8. Module Settings       │ Tenant-level configuration overrides for this domain│
│ 9. Permission Matrix     │ View, Create, Edit, Delete, Approve, Export, Print  │
│ 10. Dedicated Reports    │ Standardized, printable RMS reports with filters    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 13 Mandatory Definition-of-Done Artefacts

A module is **never** marked complete until all 13 artefacts exist and are verified:

1. **Migration Waves (`database/migrations/wave_XX_*`):** Relational tables with UUIDs, `tenant_id`, foreign keys, indexes, and audit columns (`created_by`, `updated_by`).
2. **Eloquent Domain Model (`app/Modules/{Module}/Models`):** Explicit `$casts`, fillables, tenant global query scope, and relational methods.
3. **Single-Responsibility Actions (`app/Modules/{Module}/Actions`):** Pure PHP invokable/execute classes encapsulating atomic business operations. No business logic in controllers!
4. **Authorization Policy (`app/Modules/{Module}/Policies`):** Fine-grained permission checks matching the RBAC registry.
5. **API Contract Definition (`docs/API_CONTRACT.md`):** Request payloads, response schema, and documented error codes.
6. **Form Request Validators (`app/Modules/{Module}/Requests`):** Strict input sanitization and type casting.
7. **API Controllers (`app/Modules/{Module}/Controllers`):** Thin HTTP adaptors invoking Actions and returning JsonResources.
8. **API Resources (`app/Modules/{Module}/Resources`):** Explicit serialization stripping internal implementation details.
9. **Automated Feature Tests (`tests/Feature/Modules/{Module}Test.php`):** Happy path, validation errors, 401/403 security, and multi-tenant cross-contamination isolation tests.
10. **Generated Frontend Types (`frontend/src/types/api/{module}.ts`):** TypeScript interfaces matching API Resource schemas 1:1.
11. **React Query Hooks (`frontend/src/lib/api/{module}.ts`):** Cached query and mutation hooks with optimistic cache updates and error handlers.
12. **UI Workspace Screen (`frontend/src/modules/{module}/{Module}Workspace.tsx`):** Tokenized view supporting all 20 UI states, light/dark parity, and keyboard accessibility.
13. **RMS Report Definition (`app/Modules/Reports/Queries/{Module}ReportQuery.php`):** Registered report query feeding the reporting engine.

---

## 3. Inter-Module Integration Protocol (No Spaghetti Code)

To prevent tight, chaotic dependencies:
1. **Never query another module's database tables directly from a controller.**
2. **Use Domain Events or Service Contracts:**
   - When a `SalesOrder` is approved, dispatch `SalesOrderApprovedEvent`.
   - The `Inventory` module listens to reserve stock.
   - The `Delivery` module listens to draft a `DeliveryOrder`.
   - The `Finance` module listens to draft an `Invoice`.
3. **Graceful Degradation When Modules Are Disabled:**
   - If a tenant has `delivery` disabled, the sales order flow simply skips courier dispatch without throwing null reference exceptions.
   - Checked via `useTenantCapabilityStore.getState().isModuleEnabled('delivery')` on frontend and `TenantCapability::isModuleEnabled($tenantId, 'delivery')` on backend.
