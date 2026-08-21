You are now acting as the Principal Software Architect, Product Architect, UX Architect, Database Architect, and Senior Full-Stack Engineer for this project.

DO NOT START RANDOM FEATURE DEVELOPMENT.

DO NOT immediately build individual screens.

DO NOT generate a generic ERP/admin dashboard.

DO NOT make assumptions about business logic.

Your first responsibility is to understand, structure, and establish the foundation of the entire application before implementing modules.

============================================================
PROJECT
============================================================

Project Name:
Multi-Tenant Manufacturing + Inventory + Sales + Workforce + Delivery SaaS

Initial Client / Tenant:
Slice Mart

Product Vision:

Build a production-grade, scalable, multi-tenant business management SaaS platform primarily designed for manufacturing/factory-based businesses.

The platform must eventually support:

- Manufacturing
- Production
- Production Planning
- Total Production Input
- Individual Worker Production
- Production Output
- QC
- Rework
- Wastage
- Inventory
- Warehouse
- Purchase
- Supplier Management
- Sales
- B2B
- B2C
- Wholesale
- Retail
- POS / Quick Sale
- CRM / Leads
- Salesman Target
- Salesman Incentive
- Customer Management
- Invoice
- Payment
- Collection
- Delivery
- Courier Integration
- E-commerce
- HR
- Attendance
- Employee Performance
- Asset Management
- Expense Management
- Basic Financial Management
- Notifications
- Reports
- Audit Trail
- Custom RBAC
- Multi-language
- Multi-company
- Multi-branch
- Multi-factory
- Multi-warehouse
- Multi-production-line
- Multi-currency
- Configurable tax
- Tenant-specific settings
- Tenant-specific branding

Slice Mart is ONLY the first tenant.

The architecture must NOT be hardcoded around Slice Mart.

The system must be capable of supporting many similar businesses in the future.

============================================================
IMPORTANT BUSINESS PRINCIPLE
============================================================

This is a SaaS platform.

Therefore:

NEVER hardcode:

- Slice Mart
- Number of factories
- Number of warehouses
- Number of production lines
- Number of products
- Number of workers
- Number of salespeople
- Currency
- Tax
- Invoice format
- Courier
- Payment method
- Production workflow
- QC parameters
- Incentive rules
- Sales target rules
- User roles
- Permissions

Everything that can reasonably vary between tenants must be configurable.

============================================================
CURRENT INITIAL FACTORY CONTEXT
============================================================

Slice Mart currently manufactures products such as:

- Cooker
- Stove
- Infrared Cooker
- Similar products

Approximate initial context:

- 25–30 product models
- Approximately 200–250 units/day
- 1 production line/section currently
- Approximately 7–10 production workers
- Approximately 12–15 types of raw materials
- 2 warehouses
- Raw materials and finished goods can both be sold
- B2B + B2C
- Retail + Wholesale
- Existing data may exist in Excel/digital format
- Current operations may include manual processes

IMPORTANT:

These are initial tenant configuration values.

Do NOT encode them as application-level assumptions.

============================================================
TECHNOLOGY DIRECTION
============================================================

Frontend:

React
TypeScript
Vite
Tailwind CSS

Backend:

Laravel 13
PHP 8.5+

Authentication:

JWT

Production Database:

MySQL 8.x

Local Development Database:

SQLite

API:

REST API

Architecture:

Modular Monolith

The frontend and backend must be cleanly separated.

============================================================
DATABASE RULE
============================================================

Development:

SQLite

Production:

MySQL

The application must remain compatible with both.

Do not design business logic around SQLite limitations.

Do not use SQLite-specific functionality that makes MySQL migration difficult.

All migrations must be Laravel migrations.

Production database is MySQL.

============================================================
FRONTEND PRODUCT DIRECTION
============================================================

The UI/UX must feel:

- Fresh
- Unique
- Premium
- Industrial
- Editorial
- Data-rich
- Modern
- Human-designed
- Extremely easy to use
- Fast
- Professional
- Operational

Visual direction:

Premium + Industrial + Editorial + Data Rich + Soft/Rounded.

Light mode first.

Dark mode must be fully supported.

Dark mode must NOT be an afterthought.

Every piece of information must remain clearly visible in both modes.

Avoid the generic AI-generated SaaS aesthetic.

DO NOT use:

- Excessive gradients
- Neon blue/purple dashboards
- Excessive glassmorphism
- Random gradient cards
- Huge decorative charts
- Excessive floating cards
- Excessive pills
- Generic dashboard templates
- Unnecessary animations
- Decorative UI without purpose

Prioritize:

- Typography
- Hierarchy
- Information density
- Clear spacing
- Excellent tables
- Strong forms
- Contextual actions
- Subtle borders
- Controlled elevation
- Meaningful status colors
- Clear feedback
- Excellent empty states
- Excellent loading states
- Excellent error states

The interface must feel like a carefully designed premium commercial product.

============================================================
UX PRINCIPLE
============================================================

The primary users are NOT necessarily technical people.

A factory owner, manager, salesman, warehouse employee, production supervisor or accountant should be able to understand the application without technical knowledge.

Use simple terminology.

Provide contextual help where necessary.

Avoid unnecessary complexity.

Progressive disclosure should be used.

Do not expose advanced functionality to users who do not have permission or need for it.

============================================================
NAVIGATION
============================================================

Use:

HYBRID NAVIGATION

LEFT SIDEBAR
+
CONTEXTUAL WORKSPACE NAVIGATION

Primary sidebar modules should eventually include:

Dashboard
Production
Inventory
Purchase
Sales
POS
CRM
Delivery
E-commerce
HR
Assets
Finance
Reports
Settings

The sidebar must be permission-aware.

Contextual navigation should change according to the active module.

Example:

Production

Overview
Production Plans
Production Batches
Total Input
Worker Production
Output
QC
Rework
Wastage
Reports

============================================================
CUSTOM RBAC
============================================================

RBAC must be completely dynamic.

Permissions must support:

View
Add/Create
Edit
Delete
Approve
Export
Print
Manage
Configure

Permission model should conceptually support:

module.resource.action

Examples:

production.batch.view
production.batch.create
production.batch.edit
production.batch.delete

inventory.stock.view
inventory.stock.adjust

sales.invoice.view
sales.invoice.create

delivery.order.view
delivery.order.create

Frontend permission checks are for UX.

Backend authorization is authoritative.

Never rely solely on frontend permissions for security.

============================================================
MULTI-TENANCY
============================================================

Design the system around:

Platform
→ Tenant
→ Company
→ Branch
→ Factory
→ Production Line
→ Warehouse

Support:

Multiple tenants
Multiple companies
Multiple branches
Multiple factories
Multiple warehouses
Multiple production lines
Tenant-specific users
Tenant-specific roles
Tenant-specific settings
Tenant-specific branding

Never allow cross-tenant data access.

Tenant isolation is a fundamental architectural requirement.

============================================================
PRODUCTION ARCHITECTURE
============================================================

Production is a core system.

DO NOT create one giant "Production Entry" concept.

Separate:

Production Plan
Production Batch
Total Production Input
Individual Worker Production
Production Output
QC
Rework
Wastage
Scrap
Finished Goods

Conceptually:

Production Plan
        ↓
Production Batch
        ↓
 ┌───────────────┐
 │               │
 ▼               ▼
TOTAL INPUT   WORKER PRODUCTION
 │               │
 └───────┬───────┘
         ↓
 PRODUCTION OUTPUT
         ↓
       QC
    ┌────┴────┐
    ↓         ↓
  PASS       FAIL
    ↓         ↓
 STOCK      REWORK /
            SCRAP

============================================================
CRITICAL PRODUCTION RULE
============================================================

TOTAL PRODUCTION INPUT and INDIVIDUAL WORKER PRODUCTION are SEPARATE records.

DO NOT immediately compare them.

DO NOT immediately show:

"Mismatch"
"Discrepancy"
"Error"

when only partial data exists.

The system must first understand the full production context:

- Batch
- Product
- Process
- Production date
- Shift
- Line
- Total input
- Material input
- Worker participation
- Worker quantities
- Production output
- Good output
- Defective output
- Rework
- Wastage
- Scrap
- QC
- Completion state

Only after sufficient context exists should the system calculate:

- Variance
- Yield
- Production efficiency
- Worker contribution
- Process loss
- Wastage
- Rework
- Productivity

============================================================
WORKER PRODUCTION
============================================================

A worker can:

- Work on multiple products
- Work on multiple batches
- Work on multiple production stages
- Have multiple entries per day

Never assume:

one worker = one product = one day.

Worker production must be independently recorded.

============================================================
INVENTORY
============================================================

Inventory must be transaction/ledger driven.

Do NOT treat stock quantity as a simple editable number.

Support:

Raw Materials
Finished Goods
Semi-Finished Goods
Consumables
Packaging
Spare Parts
Other configurable inventory types

Support:

Available
Reserved
Damaged
QC Pending
In Transit

Stock movements must be traceable.

============================================================
SALES
============================================================

Support:

B2B
B2C
Retail
Wholesale

Workflow:

Lead
→ Customer
→ Order
→ Invoice
→ Payment
→ Delivery

============================================================
POS / QUICK SALE
============================================================

Create a genuine POS experience.

It must be fast and operational.

Support:

Product search
Barcode
SKU
Categories
Cart
Quantity
Discount
Tax
Customer
Walk-in customer
Multiple payment methods
Partial payment
Hold sale
Resume sale
Complete sale
Print invoice
Return

POS transactions must ultimately use the same central sales/inventory architecture.

Do NOT create a completely separate sales database for POS.

============================================================
INVOICE SYSTEM
============================================================

Invoice templates must be editable WITHOUT CODE.

Do not create a completely free-form Canva clone.

Build a controlled visual invoice template engine.

Support:

Logo
Business information
Invoice number
Customer
Items
Quantity
Unit price
Discount
Tax
Subtotal
Total
Paid
Due
Notes
Terms
Signature
QR
Barcode
Footer

Allow:

Show/hide
Reorder
Style
Typography
Spacing
Brand colors
Logo
Sections
Columns

Provide:

Preview
Print preview
PDF preview
Duplicate template
Default template
Template versioning

============================================================
DELIVERY
============================================================

Unified workflow:

Order
→ Invoice
→ Delivery
→ Courier / Transport
→ Tracking
→ Delivered / Returned / Cancelled

Delivery can be:

Manual
Company Transport
Courier
Customer Pickup
Future configurable methods

============================================================
COURIER INTEGRATION
============================================================

Nothing should be hardcoded.

Architecture must support:

Steadfast
Pathao
REDX
Paperfly
eCourier
Sundarban
Future providers
Custom providers

Use an adapter/provider architecture.

Potential capabilities:

Create Shipment
Cancel Shipment
Track Shipment
Get Rates
Check Coverage
COD
Label
Webhook
Return

Not every courier supports every capability.

The system must support multiple courier accounts per tenant.

Courier selection should eventually support rules based on:

Area
Weight
Cost
COD
Availability
Speed
Tenant preference

============================================================
E-COMMERCE
============================================================

The system will eventually include an integrated e-commerce platform.

IMPORTANT:

Do NOT create a separate product database for e-commerce.

Use the central Product Catalog.

A product should be usable across:

Manufacturing
Inventory
POS
Sales
E-commerce

Product architecture must support:

SKU
Slug
Category
Brand
Images
Variants
Attributes
Price
Sale price
Stock
Warehouse
SEO
Visibility

============================================================
CRM / SALESMAN
============================================================

Support:

Lead creation
Lead assignment
Lead status
Fake lead
Follow-up
Conversion
Customer creation
Sale conversion

Lead conversion should preserve:

Salesman
Source
Lead history
Conversion date

Salesmen have monthly targets.

Dashboard should support:

Target
Achieved
Remaining
Achievement %
Lead count
Conversion rate
Sales value
Gross profit
Incentive

============================================================
INCENTIVE
============================================================

Do NOT hardcode incentive rules.

Support configurable:

Product-based
Category-based
Quantity-based
Sales-value-based
Target-based
Slab-based

Historical incentive calculations must remain reproducible.

============================================================
HR
============================================================

Full HR architecture should eventually support:

Employees
Departments
Designations
Attendance
Shift
Salary
Production performance
Sales performance
Incentive
Employee documents

============================================================
ASSET MANAGEMENT
============================================================

Support:

Fixed assets
Disposable/consumable assets

Track:

Purchase
Cost
Location
Assignment
Employee
Maintenance
Expense
Disposal
History

============================================================
FINANCE
============================================================

Initial scope:

Basic financial management.

Support:

Accounts
Payment methods
Income
Expenses
Payments
Collections
Due
Account transfers

Architecture must remain compatible with a future Full Accounting module.

============================================================
REPORTING
============================================================

Create a centralized Report Center.

Relevant reports should eventually include:

Production
Worker Production
Production Output
Production Efficiency
Inventory
Stock Ledger
Low Stock
Purchase
Supplier
Sales
POS
Invoice
Profit
Customer
Lead
Lead Conversion
Salesman Target
Salesman Performance
Incentive
Collection
Due
Overdue
HR
Attendance
Employee Production
QC
Rework
Wastage
Assets
Expenses
Delivery
Courier
Returns
Finance
Audit

Every report must support appropriate:

Filters
Date range
Search
Sorting
Grouping
Pagination
Summary
Drill-down
Export
Print
Permissions

Reports must use authoritative transactional data.

============================================================
NOTIFICATIONS
============================================================

Initial notification channel:

In-App / Push Notification

Architecture must be ready for:

Email
SMS
WhatsApp

Potential events:

Low stock
Production issue
QC failure
Rework
Sales target gap
Due date
Overdue
Delivery failure
Courier update
Payment
Approval
System alerts

============================================================
AUDIT TRAIL
============================================================

Sensitive actions must be auditable.

Record:

Who
What
When
Entity
Before
After
IP
User Agent
Reference

Examples:

Stock adjustment
Invoice modification
Payment modification
Production modification
Permission modification
Customer modification
Employee modification

============================================================
MULTI-LANGUAGE
============================================================

Minimum:

English
Bangla

Do NOT hardcode UI text.

All frontend text must be translation-ready.

Support tenant/user language preferences.

============================================================
BRANDING
============================================================

Tenant-specific:

Logo
Favicon
Primary color
Secondary color
Accent
Invoice branding
Documents
Business information

No Slice Mart branding should be hardcoded into reusable components.

============================================================
DEVELOPMENT RULES
============================================================

Before writing code:

1. Inspect the entire existing repository.
2. Identify existing architecture.
3. Identify existing dependencies.
4. Identify current routes.
5. Identify current components.
6. Identify current API structure.
7. Identify current database structure.
8. Identify reusable code.
9. Identify technical debt.
10. Identify conflicts with this architecture.

DO NOT rewrite existing working functionality unnecessarily.

DO NOT create duplicate components.

DO NOT create duplicate services.

DO NOT create duplicate models.

============================================================
FIRST TASK — DO NOT BUILD FEATURES YET
============================================================

Your FIRST task is ARCHITECTURAL DISCOVERY.

Perform the following:

STEP 1
Inspect the complete project structure.

STEP 2
Create:

/docs

STEP 3
Create/update:

/docs/PROJECT_CONTEXT.md

This document must contain:

- Product vision
- Business context
- Tenant model
- Modules
- User types
- RBAC philosophy
- Production architecture
- Inventory architecture
- Sales architecture
- Delivery architecture
- E-commerce architecture
- Technology stack
- Database strategy
- UI/UX principles
- Non-negotiable rules
- Known assumptions
- Open questions

STEP 4
Create:

/docs/ARCHITECTURE.md

Document:

Frontend architecture
Backend architecture
API architecture
Database architecture
Authentication
Authorization
Tenancy
State management
File storage
Notifications
Queue
Integrations
Reporting
Audit
Testing

STEP 5
Create:

/docs/MODULE_MAP.md

Map every module and dependency.

Example:

Production
→ Products
→ BOM
→ Inventory
→ Employees
→ QC
→ Reports

Sales
→ Products
→ Customers
→ Inventory
→ Payments
→ Delivery
→ Reports

STEP 6
Create:

/docs/DATABASE_DESIGN.md

Document the proposed entities and relationships BEFORE implementing migrations.

STEP 7
Create:

/docs/API_CONTRACT.md

Define API conventions.

STEP 8
Create:

/docs/UI_SYSTEM.md

Define:

Typography
Spacing
Color tokens
Components
Tables
Forms
Status system
Dark mode
Responsive behavior
Navigation
Accessibility
Design principles

STEP 9
Create:

/docs/DECISIONS.md

Use this as the permanent Architecture Decision Record.

Every major architectural decision must be recorded here.

============================================================
MEMORY / CONTEXT PROTECTION
============================================================

The project documentation is the source of truth.

Do NOT rely on conversational memory.

Before implementing any module:

Read:

/docs/PROJECT_CONTEXT.md
/docs/ARCHITECTURE.md
/docs/MODULE_MAP.md
/docs/DATABASE_DESIGN.md
/docs/API_CONTRACT.md
/docs/UI_SYSTEM.md
/docs/DECISIONS.md

If the current request conflicts with documentation:

STOP.

Explain the conflict.

Do not silently change architecture.

============================================================
FEATURE DEVELOPMENT PROTOCOL
============================================================

After architecture discovery, development must happen module-by-module.

For each module:

1. Understand requirements.
2. Check dependencies.
3. Update documentation if necessary.
4. Design database.
5. Design API contract.
6. Design frontend workflow.
7. Implement backend.
8. Implement frontend.
9. Add validation.
10. Add authorization.
11. Add audit.
12. Add tests.
13. Verify responsive UI.
14. Verify dark mode.
15. Verify multilingual support.
16. Verify tenant isolation.
17. Verify reports.
18. Update documentation.

Never build frontend against imaginary APIs.

Never build backend against imaginary frontend assumptions.

============================================================
QUALITY STANDARD
============================================================

This is a real production SaaS.

Code must be:

- Maintainable
- Modular
- Typed
- Testable
- Secure
- Scalable
- Documented
- Tenant-safe
- API-consistent
- Database-consistent

UI must be:

- Premium
- Unique
- Easy
- Responsive
- Accessible
- Data-rich
- Fast
- Consistent
- Light-mode polished
- Dark-mode polished

============================================================
CRITICAL RULE
============================================================

DO NOT START BUILDING THE DASHBOARD.

DO NOT START BUILDING CRUD MODULES.

DO NOT START GENERATING RANDOM UI.

DO NOT CREATE FAKE DATA AS A SUBSTITUTE FOR ARCHITECTURE.

FIRST:

UNDERSTAND
→ DOCUMENT
→ ARCHITECT
→ PLAN
→ VALIDATE
→ THEN IMPLEMENT

============================================================
EXPECTED RESPONSE AFTER THIS PROMPT
============================================================

Do NOT immediately start coding.

First respond with:

1. Current project architecture summary
2. Existing technology assessment
3. What can be reused
4. What must be changed
5. Proposed final architecture
6. Proposed module dependency map
7. Proposed database domains
8. Proposed frontend architecture
9. Proposed API architecture
10. Potential architectural risks
11. Missing requirements you discovered
12. Recommended development phases
13. Documentation files you will create
14. Questions requiring clarification, ONLY if genuinely blocking

Then create the documentation foundation.

Only after the architecture is approved should implementation begin.