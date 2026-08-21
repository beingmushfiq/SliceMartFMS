# SLICE MART / MULTI-TENANT MANUFACTURING SaaS
## MASTER BACKEND DEVELOPMENT PROMPT

You are a Principal Laravel Architect and Backend Engineer.

Build a production-grade modular SaaS backend using:

Laravel 13
PHP 8.5+
MySQL 8.x Production
SQLite Local Development
REST API
JWT Authentication
Queue-ready architecture
Event-driven integrations where appropriate

The product is:

Multi-tenant Manufacturing + Inventory + Sales + Workforce + Delivery SaaS

Slice Mart = Tenant #1.

==================================================
1. CORE ARCHITECTURE
==================================================

Use a modular monolith.

Do not create an uncontrolled giant Laravel application.

Recommended domains:

Auth
Tenancy
Users
RBAC
Companies
Branches
Factories
Warehouses
Products
Catalog
BOM
Inventory
Production
QC
Rework
HR
Attendance
CRM
Sales
POS
Invoices
Payments
Collections
Targets
Incentives
Purchase
Delivery
Courier
E-commerce
Assets
Finance
Notifications
Reports
Audit
Settings

==================================================
2. MULTI-TENANCY
==================================================

Every tenant must be isolated.

Support:

Tenant
→ Companies
→ Branches
→ Factories
→ Production Lines
→ Warehouses
→ Users

Do NOT assume:

one company
one factory
one warehouse
one production line

Every relevant record must be tenant-aware.

Prevent cross-tenant access at:

- Query
- Service
- Policy
- Authorization
- API
- Report

levels.

Never trust tenant_id sent by frontend.

Resolve tenant from authenticated context/session/domain according to architecture.

==================================================
3. RBAC
==================================================

Dynamic permissions.

Permission:

module.resource.action

Examples:

production.batch.view
production.batch.create
production.batch.edit
production.batch.delete
production.batch.approve

inventory.stock.view
inventory.stock.adjust
inventory.transfer.create

sales.invoice.view
sales.invoice.create
sales.invoice.edit
sales.invoice.delete
sales.invoice.refund

delivery.order.view
delivery.order.create
delivery.order.cancel

Support:

Users
Roles
Permissions
Role assignment
Tenant roles
Custom roles

Backend authorization is authoritative.

==================================================
4. PRODUCTION
==================================================

Support:

Production Plan
Production Batch
Production Line
Production Stage
Shift
Product
BOM
Material Input
Worker Production
Output
QC
Rework
Wastage
Scrap
Finished Goods

==================================================
5. TOTAL PRODUCTION INPUT
==================================================

Create independent production input records.

Production Input:

tenant
factory
line
batch
product
material
warehouse
quantity
unit
date
shift
user
reference
notes

A batch may have multiple input records.

Do not automatically compare against worker input.

==================================================
6. INDIVIDUAL WORKER INPUT
==================================================

Separate worker production records.

worker
batch
product
stage
quantity
unit
shift
date
start_time
end_time
notes

Multiple records per worker are allowed.

A worker can work on multiple products/batches.

Do not assume:

one worker = one product = one day.

==================================================
7. PRODUCTION ANALYSIS
==================================================

Only after sufficient production context exists calculate:

Total material input
Worker production contribution
Total output
Good output
Defect
Rework
Wastage
Scrap
Process loss
Yield
Production efficiency

Do not label input differences as errors prematurely.

Create a production-analysis service that understands context.

==================================================
8. INVENTORY
==================================================

Inventory must be ledger-driven.

Every stock mutation creates:

stock_movement

Types may include:

purchase_receipt
production_input
production_output
sale
sale_return
purchase_return
transfer_out
transfer_in
adjustment
damage
wastage
scrap
rework
reservation
release

Never silently update stock.

Support:

Available
Reserved
Damaged
QC Pending
In Transit

==================================================
9. BOM
==================================================

BOM must be dynamic.

Support:

Product
Version
Components
Quantity
Unit
Waste allowance
Effective date
Status

Future-ready for:

Multiple BOM versions
Alternative materials
Process-specific BOM

==================================================
10. QC / REWORK
==================================================

Base QC:

PASS / FAIL

Architecture must support future parameters.

FAIL may result in:

Rework
Reject
Scrap

Rework:

Create rework order
Track quantity
Track reason
Track worker/process
Re-test
PASS/FAIL

Preserve complete history.

==================================================
11. SALES
==================================================

Support:

B2B
B2C
Retail
Wholesale

Sales workflow:

Lead
Customer
Order
Invoice
Payment
Delivery

==================================================
12. POS / QUICK SALE
==================================================

Backend must support high-speed POS.

Operations:

Create sale
Add items
Discount
Tax
Multiple payments
Partial payment
Customer
Walk-in customer
Stock reservation/deduction
Invoice
Print-ready data
Return

POS must not require unnecessary workflows.

==================================================
13. INVOICE PROFIT
==================================================

Invoice items must preserve historical cost.

Store or deterministically preserve:

unit selling price
quantity
discount
tax
unit cost snapshot
line revenue
line cost
line gross profit
line margin

Historical invoice profitability must not change when current product cost changes.

==================================================
14. INVOICE TEMPLATE ENGINE
==================================================

Build a configurable invoice template system.

Templates are database-driven.

Support:

Template
Sections
Fields
Ordering
Visibility
Styles
Business identity
Document numbering

Do not require source-code changes for normal invoice customization.

Provide template versioning.

==================================================
15. CRM / LEADS
==================================================

Lead belongs to:

Tenant
Salesman
Customer optionally
Source
Status

Statuses configurable.

Conversion:

Lead
→ Customer
→ Order/Sale

Must happen transactionally.

Prevent duplicate customer creation.

Preserve lead history.

==================================================
16. SALES TARGET
==================================================

Monthly target per salesman.

Store:

Target
Period
Salesman
Product/category scope if applicable
Achievement
Status

Achievement is calculated from authoritative sales.

Expose:

Target
Achieved
Remaining
Percentage
Daily required

==================================================
17. INCENTIVES
==================================================

Do NOT hardcode policy.

Support rules based on:

Product
Category
Quantity
Sales value
Profit
Target achievement
Slabs
Periods

Store finalized incentive records.

Historical incentive must not unexpectedly change when policy changes.

==================================================
18. PURCHASE
==================================================

Workflow:

Purchase Request
Purchase Order
Receipt
Stock
Supplier Payable
Payment

Support:

Partial
Advance
Due
Multiple payment methods
Multiple accounts
Purchase return
Discount
Tax
Transport
Other cost

==================================================
19. DELIVERY
==================================================

Unified delivery model.

Order
→ Invoice
→ Delivery Order
→ Fulfillment
→ Courier/Transport
→ Tracking
→ Status

Delivery methods:

Manual
Company Transport
Courier
Pickup
Future methods

==================================================
20. COURIER INTEGRATION ARCHITECTURE
==================================================

CRITICAL:

Do not hardcode Steadfast/Pathao/REDX logic into sales controllers.

Create an adapter/interface architecture.

Example conceptual interface:

CourierProviderInterface

Methods may include:

createShipment()
cancelShipment()
trackShipment()
getRates()
checkCoverage()
getStatus()
generateLabel()
getBalance()

Provider adapters:

SteadfastAdapter
PathaoAdapter
RedxAdapter
PaperflyAdapter
ECourierAdapter
CustomCourierAdapter

Do not assume all providers support all methods.

Provider capability matrix must exist.

==================================================
21. MULTIPLE COURIER ACCOUNTS
==================================================

A tenant can configure multiple courier providers/accounts.

Store securely:

provider
account
credentials
API keys
secret
environment
status
settings

Secrets must never be returned through normal APIs.

==================================================
22. COURIER SELECTION ENGINE
==================================================

Future-ready for rules:

Area
Weight
COD
Price
Speed
Availability
Tenant preference
Product type

Example:

Dhaka → Steadfast
Outside Dhaka → Pathao
Heavy parcel → Provider X

Rules must be configurable.

==================================================
23. COURIER WEBHOOKS
==================================================

Where supported:

Courier
→ Webhook
→ Validate
→ Normalize
→ Delivery Status

Store provider events.

Never blindly trust webhook payloads.

Maintain idempotency.

==================================================
24. E-COMMERCE
==================================================

Central product catalog must support:

Manufacturing
Inventory
POS
Sales
E-commerce

Do NOT create separate product records for e-commerce.

Support:

Product
Category
Brand
SKU
Slug
Images
Variants
Attributes
Price
Stock
Warehouse
SEO
Visibility

==================================================
25. ORDER ORCHESTRATION
==================================================

E-commerce order should be capable of:

Order
→ Customer
→ Payment
→ Stock Reservation
→ Invoice
→ Fulfillment
→ Delivery
→ Courier
→ Completion

Returns must flow back into inventory according to business rules.

==================================================
26. COLLECTIONS
==================================================

Support:

Invoice
Payment
Allocation
Due
Overdue
Collection

One payment may be allocated across multiple invoices if business rules permit.

Track:

Account
Payment method
Reference
Date
User

==================================================
27. FINANCE
==================================================

Basic finance:

Accounts
Payment methods
Income
Expenses
Account transactions
Transfers
Collections

Architecture must allow future:

Chart of Accounts
Journal
Ledger
Trial Balance
Profit & Loss
Balance Sheet

Do not block future accounting.

==================================================
28. HR
==================================================

Employee master.

Support:

Department
Designation
Branch
Factory
Shift
Attendance
Production
Sales
Salary
Incentive
Documents
Status

Employee must be reusable across modules.

==================================================
29. ASSETS
==================================================

Support:

Fixed
Disposable/Consumable

Track:

Acquisition
Assignment
Location
Expense
Maintenance
Disposal
History

==================================================
30. NOTIFICATIONS
==================================================

Create notification abstraction.

Channels:

In-App
Push
Email
SMS
WhatsApp

Initial implementation can prioritize in-app/push.

Events:

Low Stock
Due
Overdue
Production issue
QC failure
Rework
Target gap
Delivery status
Payment
Approval
System

==================================================
31. AUDIT
==================================================

Audit sensitive mutations.

Store:

tenant
user
module
action
entity
entity_id
before
after
IP
user agent
timestamp

Audit logs must be immutable.

==================================================
32. REPORTING
==================================================

Reports must use authoritative domain services/query objects.

Reports:

Production
Worker Production
Inventory
Stock Ledger
Purchase
Sales
Profit
CRM
Lead Conversion
Targets
Incentive
Collection
HR
Attendance
QC
Rework
Wastage
Delivery
Courier
Returns
Assets
Finance
Audit

Never duplicate business logic inside reports.

==================================================
33. API DESIGN
==================================================

Use:

/api/v1/...

Consistent:

GET
POST
PUT/PATCH
DELETE

Responses must have predictable structure.

Validation errors must be structured.

Pagination standardized.

Filtering standardized.

Sorting standardized.

Search standardized.

Authorization standardized.

==================================================
34. TRANSACTIONS
==================================================

Use database transactions for:

Invoice posting
Payment allocation
Stock transfer
Production completion
Material issue
QC transition
Rework
Lead conversion
Courier booking where local state must be atomic
Incentive finalization

==================================================
35. IDEMPOTENCY
==================================================

Required for:

Payments
Courier booking
Webhooks
Order creation where external systems are involved
Invoice posting

Never create duplicate records because a request was retried.

==================================================
36. QUEUES
==================================================

Queue appropriate tasks:

Courier API calls
Notifications
Large report generation
PDF generation
Bulk imports
Data migration
Webhook processing

==================================================
37. DATA IMPORT
==================================================

Support future:

CSV
Excel
API

Import system must provide:

Validation
Preview
Error report
Duplicate handling
Rollback strategy where practical

==================================================
38. SETTINGS
==================================================

Nothing important should be hardcoded.

Tenant settings:

Currency
Tax
Invoice numbering
Product numbering
Order numbering
Warehouse rules
Production rules
QC rules
Sales target rules
Incentive rules
Notification rules
Courier configuration
Branding
Language

==================================================
39. SECURITY
==================================================

Implement:

Authentication
Authorization
Tenant isolation
Rate limiting
Input validation
Mass assignment protection
Secure file handling
Credential encryption
Audit
CSRF strategy appropriate to architecture
Secure API tokens
Webhook verification

==================================================
40. BACKEND QUALITY
==================================================

Before completing a module:

Migration
Model
Relations
Validation
Policy
Service
API
Resource
Tests
Audit
Notifications where required
Report integration
Documentation

Do not implement only controllers + CRUD.

Read project documentation before every task.
Inspect existing code before modifying it.
Do not invent business rules.
Do not hardcode Slice Mart-specific assumptions.