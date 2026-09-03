# SliceMart ERP / FMS — Multi-Tenant Enterprise Operating System

[![Build & Test Status](https://img.shields.io/badge/tests-146%20frontend%20%7C%20550%2B%20backend%20passing-emerald.svg?style=flat-square)](#automated-testing--quality-gates)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Clean-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Laravel](https://img.shields.io/badge/Laravel-11.x%20REST%20API-red.svg?style=flat-square)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-19%20%2B%20Vite-cyan.svg?style=flat-square)](https://react.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-Three--Tier%20SaaS-indigo.svg?style=flat-square)](#three-tier-system-architecture)
[![Roadmap](https://img.shields.io/badge/Roadmap-26%2F26%20Phases%20Signed%20Off-emerald.svg?style=flat-square)](docs/IMPLEMENTATION_ROADMAP.md)

---

## 📖 Executive Summary

**SliceMart ERP/FMS** is an enterprise-grade, multi-tenant Factory Management & Omnichannel Retail Operating System designed for modern manufacturing, wholesale distribution, and direct-to-consumer commerce.

Engineered under the **Master System Prompt** and the **Autonomous Implementation Protocol**, SliceMart cleanly decouples platform governance, tenant operations, and public consumer touchpoints into three unified yet strictly isolated layers.

> 🌟 **The Golden Architectural Rule:**  
> *Never hardcode Slice Mart-specific assumptions into the platform architecture. Slice Mart is Tenant #1, not the definition of the architecture. The platform architecture natively supports unlimited multi-industry, multi-currency, and multi-tenant expansion.*

---

## 🏛️ Three-Tier System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MASTER SAAS CONTROL PLANE (DevCenterPoint)                  │
│   Tenant Provisioning · Plan Limits · Global Metrics · Master Audit Trail   │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ (Tenant Scope & RBAC)
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                   TENANT MANAGEMENT APPLICATION (ERP / FMS)                 │
│  Manufacturing · Inventory Ledger · 3-Way Match · High-Speed POS · HR & CRM │
│    FIFO/AVCO Finance · 3PL Couriers · RMS Matrix · Physical Printing        │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ (Storefront API & Custom Domains)
┌───────────────────────────────────────▼─────────────────────────────────────┐
│                     PUBLIC HEADLESS E-COMMERCE STOREFRONT                   │
│   Dynamic Catalog · Shopping Bag · WhatsApp Checkout · Order Tracking · SEO │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **Master Platform (`DevCenterPoint`):** Global superadmin surface for cross-tenant provisioning, subscription plans, platform telemetry, and system-wide audit logging.
2. **Tenant Management ERP (`SliceMart`):** The primary operational hub for day-to-day business operations across manufacturing, warehousing, sales, finance, and workforce.
3. **Public Headless Storefront:** Lightning-fast, mobile-first consumer storefront featuring instant cart synchronization, direct WhatsApp order routing, order status tracking, and dynamic SEO structured data.

---

## ⚡ Core Operational Workspaces

| Workspace | Domain & Capabilities | Primary Components |
|---|---|---|
| **🏭 Manufacturing** | Multi-level Bills of Materials (BOM), batch work orders, worker piece-rate logging, and quality control (QC) inspection gates. | `ProductionWorkspace.tsx`, `WorkerProductionSection.tsx` |
| **📦 Inventory Ledger** | Perpetual FIFO/AVCO inventory ledger, multi-warehouse stock allocations, lot/batch tracking, adjustments, and safety reorder alerts. | `InventoryWorkspace.tsx`, `StockLedgerSection.tsx` |
| **🛒 Purchasing & 3-Way Match** | Vendor RFQs, purchase requisitions, PO approval workflows, Goods Receipt Notes (GRN), and 3-way discrepancy validation (PO vs. GRN vs. Bill). | `PurchasingWorkspace.tsx`, `PurchaseBillsSection.tsx` |
| **⚡ High-Speed POS Terminal** | Offline-capable dual-cashier point-of-sale terminal, barcode scanner integration, quick cash presets, and end-of-day register float reconciliation. | `POSShell.tsx`, `PosSessionsSection.tsx` |
| **🤝 CRM & Lead Pipeline** | B2B lead capture, kanban sales pipeline stages, interaction history, corporate account credit limits, and sales rep commission targets. | `SalesWorkspace.tsx`, `LeadsSection.tsx` |
| **👥 HR & Workforce** | Employee roster, biometric attendance sync, shift scheduling, piece-rate incentive calculations, and monthly salary disbursement. | `HrWorkspace.tsx` |
| **📊 Accounting & Finance** | Double-entry general ledger, automated journal generation from operational events, chart of accounts, and real-time trial balance. | `FinanceWorkspace.tsx` |
| **🚚 Delivery & Courier 3PL** | Multi-courier integration (Steadfast, Pathao, REDX), consignment creation, delivery run sheets, and automated COD reconciliation. | `DeliveryWorkspace.tsx`, `CodReconciliationSection.tsx` |
| **🛍️ Headless Storefront & CMS** | Dynamic page builder, hero sliders, collection grids, order tracking, and one-click WhatsApp order dispatch. | `StorefrontSettingsWorkspace.tsx`, `StorefrontCartDrawer.tsx` |
| **📈 RMS Reports Matrix** | 58 canonical analytical reports covering financial statements, inventory aging, sales velocity, production wastage, and courier commissions. | `ReportsWorkspace.tsx` |
| **🖨️ Document Printing** | Pixel-perfect document generation for Sales Invoices, POs, Challans, Receipts, and thermal barcode labels (A4, A5, 80mm, 58mm). | `DocumentsSection.tsx`, `BarcodeGeneratorModal.tsx` |
| **⚙️ Centralized Settings** | 16-domain configuration registry with atomic batch updates, tenant credential vault, and reset-to-default audit tracking. | `SettingsCenterWorkspace.tsx` |
| **🔔 Notification Center** | Real-time multi-channel notification dispatcher (In-app, SMS, WhatsApp, Email) with deep-link navigation to operational workspaces. | `AppHeader.tsx`, `NotificationController.php` |
| **🌐 SEO & Discoverability** | Dynamic JSON-LD structured data (Product, Organization, Breadcrumbs), IndexNow crawler pings, XML sitemaps, and robots.txt. | `SeoDiscoverabilityWorkspace.tsx`, `StructuredDataBuilder.php` |

---

## 🛠️ Technology Stack

### Backend Framework & Architecture
- **Framework:** Laravel 11.x (PHP 8.2+)
- **Architecture:** Domain-Driven Design (DDD) with modular boundaries
- **Multi-Tenancy:** Single-database multi-tenancy with tenant identification via subdomain / header and global query scopes (`TenantScope`)
- **Authentication:** Stateless JWT with rotating refresh token family tracking and automated theft detection
- **Authorization:** Strict Spatie-compatible Role-Based Access Control (RBAC) with user scope restrictions (branch, warehouse, cost-center)
- **Database:** MySQL 8.0 / SQLite with ACID transactions and compound indexing
- **Queue & Cache:** Redis-backed async job dispatching with exponential backoff retries

### Frontend Application Architecture
- **Framework:** React 19 + TypeScript (Strict Mode)
- **Build Tool:** Vite with fast HMR and tree-shaken bundling
- **State Management:** TanStack React Query v5 (server cache) + Zustand (client state)
- **Styling & Tokens:** Tailwind CSS v4 with semantic CSS design tokens supporting seamless Dark & Light theme switching
- **Component Patterns:** Hierarchical 4-Tier Error Boundaries, `useWorkspaceTab` deep-link preservation, and Universal Currency Formatter (`useCurrency()`)
- **Icons & Visuals:** Lucide React icons, Recharts interactive data visualization

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **PHP:** 8.2 or higher (Laragon or native PHP CLI)
- **Composer:** 2.x
- **Node.js:** 18.x or 20.x LTS
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/beingmushfiq/SliceMartFMS.git
cd SliceMartFMS
```

### 2. Backend Setup
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
copy .env.example .env
```

### 4. Running the Development Servers

**Option A: Start Laravel Backend Server (Port 8000)**
```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

**Option B: Start React Frontend Vite Server (Port 5173)**
```powershell
cd frontend
npm run dev
```

---

## 🌐 Application Access & Endpoints

| Portal / Surface | URL | Description |
|---|---|---|
| **Tenant ERP Workspace** | `http://localhost:5173` | Operational ERP workspace for SliceMart (Tenant #1) |
| **Public Headless Storefront** | `http://localhost:5173/store/slicemart` | Customer e-commerce catalog with WhatsApp checkout |
| **Master SaaS Control Plane** | `http://localhost:5173/admin/platform` | `DevCenterPoint` global tenant management panel |
| **Backend REST API** | `http://127.0.0.1:8000/api/v1` | Public and tenant-scoped REST API surfaces |
| **Liveness Health Probe** | `http://127.0.0.1:8000/healthz` | Container liveness check for Kubernetes/Docker |
| **Readiness Health Probe** | `http://127.0.0.1:8000/readyz` | Database & queue connectivity readiness check |

### Default Credentials (Seed Data)

- **Tenant Administrator:**  
  - Email: `admin@slicemart.test`  
  - Password: `Password123!`
- **Master Platform Superadmin:**  
  - Email: `superadmin@devcenterpoint.test`  
  - Password: `Password123!`

---

## 🧪 Automated Testing & Quality Gates

SliceMart maintains a strict 100% green test policy. No feature or refactor is complete without passing all unit, integration, and typecheck gates.

### Frontend Unit & Component Tests
```bash
cd frontend
npm run test           # 146 unit tests passing (Vitest)
npm run typecheck      # tsc -b --noEmit (Strict TypeScript zero errors)
```

### Backend Feature & Contract Tests
```bash
cd backend
php artisan test --filter=HealthCheckTest             # Health probe verification
php artisan test --filter=RateLimitingTest            # Named rate limiters
php artisan test --filter=DatabaseBackupTest          # Automated backup routine
php artisan test --filter=StorefrontSeoAndDiscoverabilityTest  # Sitemaps & robots
php artisan test --filter=Delivery                   # Courier 3PL & webhooks
php artisan test --filter=Report                     # RMS analytical matrix
php artisan test --filter=DocumentPrintingTest       # Document & thermal labels
php artisan test --filter=TenantSettingsTest         # Centralized enterprise settings
php artisan test --filter=NotificationTest           # Real-time multi-channel alerts
```

---

## 📚 Canonical Architecture Documentation

Detailed architectural blueprints and module contracts are available in the [`docs/`](docs/) directory:

- [**IMPLEMENTATION_ROADMAP.md**](docs/IMPLEMENTATION_ROADMAP.md) — 26-phase canonical delivery roadmap and sign-off status.
- [**PLATFORM_ARCHITECTURE.md**](docs/PLATFORM_ARCHITECTURE.md) — Multi-tier SaaS architecture and tenant isolation boundaries.
- [**MODULE_ARCHITECTURE.md**](docs/MODULE_ARCHITECTURE.md) — Module taxonomy, domain boundaries, and event lifecycles.
- [**DATABASE_ARCHITECTURE.md**](docs/DATABASE_ARCHITECTURE.md) — ERD definitions, composite indexing, and schema rules.
- [**API_ARCHITECTURE.md**](docs/API_ARCHITECTURE.md) — RESTful envelope standard (`RFC 7807`) and JWT authentication.
- [**DESIGN_SYSTEM.md**](docs/DESIGN_SYSTEM.md) — UI tokens, responsive layouts, and universal currency formatting.
- [**ROLE_PERMISSION_MATRIX.md**](docs/ROLE_PERMISSION_MATRIX.md) — Granular RBAC permissions catalog.
- [**QA_CHECKLIST.md**](docs/QA_CHECKLIST.md) — 10-point mandatory enterprise quality assurance gates.

---

## 🔒 Security & Data Integrity Standards

1. **Multi-Tenant Data Isolation:** Every database entity is constrained by `tenant_id` and enforced through Eloquent global query scopes (`TenantScope`).
2. **Brute-Force & Rate Limiting:** Named rate limiters for login (5 attempts / 5 mins), public storefront (120 req/min), and webhooks (600 req/min).
3. **Sensitive Data Redaction:** API credentials, webhook secrets, and private keys are encrypted at rest with AES-256 and masked in UI views.
4. **Resilient Error Handling:** 4-tier error boundary architecture catches runtime errors gracefully without white screens, maintaining state preservation and diagnostic references.

---

## 📄 License & Maintainer

Maintained by **Mushfiqur Rahman** (`beingmushfiq@gmail.com`).  
All rights reserved. Designed and developed as a modern enterprise SaaS platform.
