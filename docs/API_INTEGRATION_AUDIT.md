# API INTEGRATION AUDIT — Forensic Route & Contract Audit (Phase 0)

> **Execution Protocol:** Master Development & System Hardening Protocol — Phase 0  
> **Evaluation Scope:** Full End-to-End Tracing (`UI Component` → `API Client` → `Laravel Route` → `FormRequest` → `Controller` → `Service` → `Database` → `Response` → `Query Cache Invalidation`).  
> **Route Registry:** `routes/api_public.php` (Public), `routes/api_tenant.php` (Tenant ERP ~1,080 lines), `routes/api_platform.php` (Platform Admin).  
> **Audit Date:** 2026-09-10  

---

## 1. Unified API Seam Verification (`frontend/src/lib/api/client.ts`)

All frontend HTTP network communication routes through a single unified API client instance.

### 1.1 Architecture & Header Pipeline
- **Base URL:** `/api/v1` (dynamically configurable via `VITE_API_BASE_URL`).
- **Correlation Header:** Generates a cryptographic UUID or preserves existing `X-Correlation-Id` on every request.
- **Tenant Context Header:** Injects `X-Tenant-Id` derived from the active `authStore` or the active subdomain.
- **Authorization Header:** Appends `Authorization: Bearer <in_memory_jwt>` whenever an access token exists.
- **Automatic Token Refresh (401 Interceptor):**
  - Catches HTTP 401 `TOKEN_EXPIRED`.
  - Queues outgoing parallel requests during token refreshing to prevent race conditions.
  - Calls `/api/v1/auth/refresh` using the secure `httpOnly` refresh token cookie.
  - Replays original requests with the newly minted access token upon successful refresh.
  - Automatically redirects to `/login` with session expiration toast if refresh fails.

### 1.2 Unified Envelope Parsing
The API client guarantees unmarshaling of the standard response envelope:
```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    correlationId: string;
    pagination?: {
      currentPage: number;
      perPage: number;
      total: number;
      lastPage: number;
    };
  };
  error: null | {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

---

## 2. Route Registry & Endpoint Mapping

### 2.1 Public Authentication Endpoints (`routes/api_public.php`)
| HTTP Method | Route URL | Controller Action | Request Validation | Status & Response Envelope |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `AuthController@login` | `LoginRequest` (email, password) | ✅ 200 OK (JWT + user + tenant) |
| `POST` | `/api/v1/auth/refresh` | `AuthController@refresh` | Refresh Cookie Present | ✅ 200 OK (New JWT + rotating cookie) |
| `POST` | `/api/v1/auth/logout` | `AuthController@logout` | JWT Claims | ✅ 200 OK (Token revoked + cookie cleared) |
| `POST` | `/api/v1/auth/forgot-password`| `AuthController@forgotPassword` | `ForgotPasswordRequest` | ✅ 200 OK (Password reset link dispatched) |
| `POST` | `/api/v1/auth/reset-password` | `AuthController@resetPassword` | `ResetPasswordRequest` | ✅ 200 OK (Password updated, sessions cleared) |
| `GET` | `/api/v1/health` | (Closure) | None | ✅ 200 OK (`{ status: "healthy", timestamp }`) |

### 2.2 Tenant ERP Workspaces Endpoints (`routes/api_tenant.php`)

#### Catalogue & BOM Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/catalogue/products` | `ProductController@index` | `catalogue.product.view` | `useProductsQuery` / `CataloguePage` | ✅ |
| `POST` | `/api/v1/catalogue/products` | `ProductController@store` | `catalogue.product.create` | `useCreateProduct` / `ProductModal` | ✅ |
| `GET` | `/api/v1/catalogue/products/:id` | `ProductController@show` | `catalogue.product.view` | `useProductDetail` / `ProductDetail` | ✅ |
| `PUT` | `/api/v1/catalogue/products/:id` | `ProductController@update`| `catalogue.product.edit` | `useUpdateProduct` / `ProductModal` | ✅ |
| `DELETE`| `/api/v1/catalogue/products/:id` | `ProductController@destroy`| `catalogue.product.delete` | `useDeleteProduct` / `ConfirmDialog` | ✅ |
| `GET` | `/api/v1/catalogue/boms` | `BillOfMaterialController@index` | `catalogue.bom.view` | `useBOMsQuery` / `BOMWorkspaceTab` | ✅ |
| `POST` | `/api/v1/catalogue/boms` | `BillOfMaterialController@store` | `catalogue.bom.create` | `useCreateBOM` / `BOMCreateDrawer` | ✅ |
| `GET` | `/api/v1/catalogue/units` | `UnitController@index` | `catalogue.unit.view` | `useUnitsQuery` / `UnitWorkspaceTab` | ✅ |
| `POST` | `/api/v1/catalogue/units` | `UnitController@store` | `catalogue.unit.create` | `useCreateUnit` / `UnitModal` | ✅ |

#### Production Operations Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/production/batches` | `ProductionBatchController@index` | `production.batch.view` | `useProductionBatches` / `ProductionWorkspace`| ✅ |
| `POST` | `/api/v1/production/batches` | `ProductionBatchController@store` | `production.batch.create` | `useCreateBatch` / `BatchModal` | ✅ |
| `POST` | `/api/v1/production/batches/:id/start` | `ProductionBatchController@start` | `production.batch.edit` | `useStartBatch` / `BatchActions` | ✅ |
| `POST` | `/api/v1/production/batches/:id/complete` | `ProductionBatchController@complete`| `production.batch.edit` | `useCompleteBatch` / `BatchReconcile` | ✅ |
| `POST` | `/api/v1/production/worker-logs` | `WorkerProductionController@store` | `production.worker.log` | `useLogWorkerTally` / `WorkerTallyModal`| ✅ |

#### Quality Control (QC) Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/qc/inspections` | `QcInspectionController@index` | `qc.inspection.view` | `useQcInspections` / `QcWorkspace` | ✅ |
| `POST` | `/api/v1/qc/inspections` | `QcInspectionController@store` | `qc.inspection.create` | `useCreateInspection` / `QcModal` | ✅ |
| `POST` | `/api/v1/qc/wastage-records` | `WastageController@store` | `qc.wastage.log` | `useLogWastage` / `WastageModal` | ✅ |
| `POST` | `/api/v1/qc/rework-orders` | `ReworkController@store` | `qc.rework.create` | `useCreateRework` / `ReworkModal` | ✅ |

#### Inventory & Warehouses Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/inventory/stock-ledger` | `StockLedgerController@index` | `inventory.stock.view` | `useStockLedger` / `InventoryWorkspace` | ✅ |
| `POST` | `/api/v1/inventory/transfers` | `StockTransferController@store`| `inventory.transfer.create` | `useCreateTransfer` / `TransferModal` | ✅ |
| `POST` | `/api/v1/inventory/adjustments` | `StockAdjustmentController@store`| `inventory.adjust.create` | `useAdjustStock` / `AdjustModal` | ✅ |
| `GET` | `/api/v1/inventory/counts` | `StockCountController@index` | `inventory.count.view` | `useStockCounts` / `CountWorkspace` | ✅ |

#### Purchasing & Procurement Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/purchasing/orders` | `PurchaseOrderController@index`| `purchasing.po.view` | `usePurchaseOrders` / `PurchasingWorkspace`| ✅ |
| `POST` | `/api/v1/purchasing/orders` | `PurchaseOrderController@store`| `purchasing.po.create` | `useCreatePO` / `POCreateDrawer` | ✅ |
| `POST` | `/api/v1/purchasing/grns` | `GoodsReceiptController@store` | `purchasing.grn.create` | `useCreateGRN` / `GRNModal` | ✅ |
| `POST` | `/api/v1/purchasing/bills` | `PurchaseBillController@store` | `purchasing.bill.create` | `useCreateBill` / `BillModal` | ✅ |

#### Omnichannel Sales & POS Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/sales/orders` | `SalesOrderController@index` | `sales.order.view` | `useSalesOrders` / `SalesWorkspace` | ✅ |
| `POST` | `/api/v1/sales/orders` | `SalesOrderController@store` | `sales.order.create` | `useCreateSO` / `SOCreateDrawer` | ✅ |
| `GET` | `/api/v1/sales/invoices` | `InvoiceController@index` | `sales.invoice.view` | `useInvoices` / `InvoicesWorkspace` | ✅ |
| `POST` | `/api/v1/pos/transactions` | `PosTransactionController@store`| `pos.terminal.transact` | `useSubmitPosSale` / `POSShell` | ✅ |
| `POST` | `/api/v1/delivery/dispatches` | `DeliveryController@store` | `delivery.dispatch.create` | `useCreateDispatch` / `DispatchModal` | ✅ |
| `POST` | `/api/v1/delivery/couriers/push` | `CourierController@pushConsignment`| `delivery.courier.push` | `usePushCourier` / `CourierModal` | ✅ |

#### General Ledger & Finance Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/finance/accounts` | `AccountController@index` | `finance.account.view` | `useAccounts` / `FinanceWorkspace` | ✅ |
| `GET` | `/api/v1/finance/journal-entries` | `JournalEntryController@index` | `finance.journal.view` | `useJournalEntries` / `JournalWorkspace` | ✅ |
| `POST` | `/api/v1/finance/journal-entries` | `JournalEntryController@store` | `finance.journal.create` | `useCreateJournal` / `JournalModal` | ✅ |
| `GET` | `/api/v1/finance/trial-balance` | `TrialBalanceController@show` | `finance.reports.view` | `useTrialBalance` / `TrialBalanceTab` | ✅ |

#### Workforce & Payroll Module
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/hr/employees` | `EmployeeController@index` | `hr.employee.view` | `useEmployees` / `HrWorkspace` | ✅ |
| `POST` | `/api/v1/hr/attendance` | `AttendanceController@store` | `hr.attendance.log` | `useLogAttendance` / `AttendanceTab` | ✅ |
| `POST` | `/api/v1/hr/payroll/run` | `PayrollController@runPayroll` | `hr.payroll.run` | `useRunPayroll` / `PayrollModal` | ✅ |

#### Document Printing Engine
| HTTP Method | Route Pattern | Controller Action | RBAC Permission Guard | Frontend Hook / Component | Status |
|---|---|---|---|---|:---:|
| `GET` | `/api/v1/documents/templates` | `DocumentTemplateController@index` | `settings.document.view`| `usePrintTemplates` / `PrintModal` | ✅ |
| `POST` | `/api/v1/documents/resolve` | `DocumentResolveController@resolve`| `settings.document.view`| `useResolveDocument` / `PrintPreview` | ✅ |

### 2.3 Master SaaS Platform Admin Routes (`routes/api_platform.php`)
| HTTP Method | Route URL | Target Controller | Current Route File Status | Impact |
|---|---|---|---|---|
| `POST` | `/api/v1/platform/auth/login` | `PlatformAuthController` | ❌ File currently empty | Platform super-admin login UI cannot authenticate |
| `GET` | `/api/v1/platform/tenants` | `TenantDirectoryController` | ❌ File currently empty | Tenant directory UI falls back to local placeholder |
| `POST` | `/api/v1/platform/tenants` | `TenantProvisioningController` | ❌ File currently empty | Tenant creation wizard cannot commit new tenant DB |
| `GET` | `/api/v1/platform/plans` | `PlanManagementController` | ❌ File currently empty | Plan manager cannot fetch/save subscription tiers |
| `GET` | `/api/v1/platform/audit-logs`| `PlatformAuditController` | ❌ File currently empty | Cross-tenant audit UI has no data feed |

---

## 3. Mock Data & Stub Detection Audit

1. **Production ERP Modules:**
   - **0% Mock Data.** All 17 ERP modules (`catalogue`, `production`, `qc`, `inventory`, `purchasing`, `sales`, `pos`, `delivery`, `finance`, `assets`, `hr`, `reports`, `settings`, `documents`, `audit`, `ecommerce`, `notifications`) connect to live backend endpoints via TanStack Query.
2. **MSW (Mock Service Worker):**
   - MSW handlers (`src/mocks/handlers.ts`) are restricted strictly to the Vitest test execution environment. They are never registered or bundled into the production Vite build (`boot.ts` skips MSW when `NODE_ENV === 'production'`).
3. **Master Platform Admin Panel:**
   - The UI components in `src/modules/platform` are fully developed with complete tables, modals, and forms, but `routes/api_platform.php` needs route definitions and controller bindings during the subsequent hardening phase.

---

## 4. Error Code Standardization & Protocol

All backend endpoints emit RFC 7807 compliant error envelopes translated cleanly in `frontend/src/lib/api/errors.ts`:

| HTTP Status | Error Code | Client Handling Strategy |
|---|---|---|
| `400` | `BAD_REQUEST` | Dispatches toast alert with the exact operational violation |
| `401` | `TOKEN_EXPIRED` / `UNAUTHORIZED` | Initiates silent refresh; redirects to `/login` if refresh fails |
| `403` | `FORBIDDEN` / `TENANT_INACTIVE` | Displays Permission Denied modal or tenant suspension screen |
| `404` | `NOT_FOUND` | Renders `StateView` zero-data illustration with back navigation |
| `409` | `STATE_CONFLICT` | Prompts user with state conflict resolution (e.g. concurrent edit) |
| `422` | `VALIDATION_FAILED` | Binds field errors directly into React Hook Form error slots |
| `429` | `TOO_MANY_REQUESTS` | Shows rate-limit countdown banner and disables retry button |
| `500` | `INTERNAL_SERVER_ERROR` | Logs correlation ID to structured telemetry, displays fallback card |
| `502/503`| `UPSTREAM_FAILED` | Activates TanStack Query exponential retry loop (1s, 2s, 4s) |
