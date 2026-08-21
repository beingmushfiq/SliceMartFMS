# MULTI-TENANT MANUFACTURING SaaS
## MASTER FRONTEND DEVELOPMENT PROMPT

You are acting as a Principal Product Designer, UX Architect and Senior React/TypeScript Frontend Engineer.

Build a production-grade, scalable SaaS frontend for:

"Multi-tenant Manufacturing + Inventory + Sales + Workforce + Delivery SaaS"

Slice Mart is Tenant #1.

This is NOT a demo.
This is NOT a generic ERP template.
This is NOT an AI-generated dashboard collection.
This is NOT a collection of CRUD pages.

Build a real operational product that factory owners, managers, warehouse staff, production supervisors, salespeople, accountants, HR staff and non-technical users can operate comfortably every day.

==================================================
1. PRODUCT DESIGN PHILOSOPHY
==================================================

The interface must feel:

- Fresh
- Unique
- Premium
- Industrial
- Editorial
- Data-rich
- Human-designed
- Extremely easy to understand
- Fast
- Operational
- Trustworthy
- Scalable

Visual direction:

Premium + Industrial + Editorial + Data Rich + Soft/Rounded.

Light mode is the primary experience.

Dark mode must be a first-class experience.

Do NOT create a generic "AI SaaS" visual style.

Avoid:

- Excessive gradients
- Neon blue/purple dashboards
- Excessive glassmorphism
- Huge floating cards
- Random decorative graphs
- Excessive pill-shaped UI
- Excessive rounded containers
- Gradient metric cards everywhere
- Fake 3D elements
- Decorative UI that provides no operational value
- Excessive whitespace that hides useful information
- Overly dense interfaces that feel like old ERP software

Use:

- Strong typography
- Excellent spacing
- Clear hierarchy
- Restrained color system
- High-quality tables
- Smart contextual actions
- Subtle borders
- Soft elevation
- Strong information grouping
- Meaningful status colors
- Excellent empty states
- Excellent form design
- Progressive disclosure
- Contextual navigation

==================================================
2. BRAND SYSTEM
==================================================

The platform must support tenant-specific branding.

Every tenant can configure:

- Logo
- Favicon
- Primary color
- Secondary color
- Accent color
- Invoice branding
- Document branding
- Business information
- Address
- Contact information
- Currency
- Tax settings
- Language
- Date format
- Number format

Do NOT hardcode Slice Mart branding into components.

Create a design-token architecture.

Example:

theme.primary
theme.secondary
theme.accent
theme.background
theme.surface
theme.text
theme.border
theme.success
theme.warning
theme.danger
theme.info

The entire interface must react to tenant branding.

==================================================
3. MULTI-LANGUAGE
==================================================

The system must support multilingual operation.

At minimum architect for:

- English
- Bangla

Do not hardcode UI text directly into components.

Use an internationalization architecture.

All:

- Labels
- Buttons
- Validation messages
- Notifications
- Statuses
- Reports
- Invoice templates
- Navigation
- Forms
- Help text

must be translation-ready.

Support:

LTR initially.

Architecture should not prevent future RTL support.

Users should be able to switch language without breaking layout.

==================================================
4. RESPONSIVE DESIGN
==================================================

Responsive web application.

Optimize for:

- Desktop
- Laptop
- Tablet
- Mobile browser

Primary operational environment:

Desktop/tablet.

Mobile must still support:

- Quick Sale
- Lead entry
- Sales
- Delivery
- Collection
- Notifications
- Production entry
- Worker production entry
- Dashboard

Never simply shrink desktop screens.

Create deliberate responsive workflows.

==================================================
5. GLOBAL APPLICATION STRUCTURE
==================================================

Use:

Hybrid Navigation:

LEFT SIDEBAR
+
CONTEXTUAL WORKSPACE NAVIGATION

Sidebar contains major modules.

Contextual workspace navigation changes according to the active module.

Example:

Inventory
├── Overview
├── Stock
├── Stock Ledger
├── Transfers
├── Adjustments
├── Reorder
└── Reports

Production
├── Overview
├── Production Plans
├── Production Input
├── Worker Production
├── Output
├── QC
├── Rework
└── Reports

Sales
├── Overview
├── Quick Sale
├── Orders
├── Invoices
├── Deliveries
├── Collections
└── Reports

==================================================
6. GLOBAL UX RULE
==================================================

Every page must answer:

1. What is happening?
2. What needs attention?
3. What can I do?
4. What happened previously?
5. What happens next?

Do not create screens that only display data.

Every operational screen needs appropriate:

- Primary action
- Secondary actions
- Filters
- Search
- Status
- History
- Context
- Permissions
- Feedback

==================================================
7. CUSTOM RBAC
==================================================

RBAC must be completely dynamic.

Permissions must NOT be hardcoded.

Permission structure must support:

MODULE
→ RESOURCE
→ ACTION

Actions:

- View
- Add/Create
- Edit
- Delete
- Approve
- Export
- Print
- Manage
- Configure

Example:

production.view
production.create
production.edit
production.delete
production.approve

inventory.view
inventory.create
inventory.adjust
inventory.transfer
inventory.export

sales.view
sales.create
sales.edit
sales.delete
sales.refund
sales.export

User permissions must determine:

- Sidebar visibility
- Page visibility
- Button visibility
- Action availability
- Field visibility where necessary
- Report visibility

Never rely only on frontend permission checks.
Frontend permissions are UX controls.
Backend authorization remains authoritative.

==================================================
8. DASHBOARD
==================================================

Dashboard must be configurable.

Do NOT create one universal dashboard.

Dashboard widgets can include:

- Today's Production
- Production Target
- Production Achievement
- Finished Goods
- Raw Material Stock
- Low Stock
- Today's Sales
- Monthly Sales
- Gross Profit
- Outstanding Due
- Overdue
- Purchase
- Expenses
- Production Wastage
- QC Failure
- Rework
- Employee Performance
- Salesman Performance
- Lead Conversion
- Delivery Status
- Courier COD
- Returns
- Incentive
- Alerts

Widgets should be permission-aware.

Allow future dashboard customization.

==================================================
9. PRODUCTION MANAGEMENT
==================================================

Production is a core module.

Workflow:

Production Plan
→ Production Batch
→ Total Production Input
→ Production Processing
→ Individual Worker Input
→ Production Output
→ QC
→ Rework / Defect / Wastage
→ Approved Finished Goods
→ Inventory

IMPORTANT:

TOTAL PRODUCTION INPUT and INDIVIDUAL WORKER INPUT ARE SEPARATE.

Do NOT automatically compare them at entry time.

Do NOT immediately show:

"Mismatch"
"Discrepancy"
"Error"

until the system has sufficient context.

The system must first understand:

- Production batch
- Product
- Production process
- Production date
- Shift
- Line
- Total input
- Input unit
- Input materials
- Worker participation
- Worker quantities
- Output
- Good output
- Defective output
- Rework
- Wastage
- Process loss
- QC result
- Completion status

Only then may the system calculate relevant production variance/analysis.

==================================================
10. TOTAL PRODUCTION INPUT
==================================================

Create a dedicated production input workflow.

Example:

Production Batch
Product
Batch Number
Production Line
Factory
Warehouse
Date
Shift
Planned Quantity

INPUT:

Raw Material / Component
Quantity
Unit
Source Warehouse
Reference
Notes

Allow multiple materials/components.

Do not assume every factory uses identical inputs.

Dynamic material selection based on BOM/configuration.

Allow authorized users to add actual inputs.

Record:

- Who entered
- When entered
- Batch
- Material
- Quantity
- Unit
- Warehouse
- Source transaction
- Notes

==================================================
11. INDIVIDUAL WORKER PRODUCTION
==================================================

Workers can work on:

- One product
- Multiple products
- Multiple production stages
- Multiple batches
- Different quantities on different days

Support:

Worker
Production Batch
Product
Process/Stage
Date
Shift
Quantity
Unit
Start Time
End Time
Notes

A worker may appear multiple times.

Do NOT force:

one worker = one production entry.

Allow:

Worker A → 30 units
Worker B → 45 units
Worker C → 25 units

or:

Worker A → Product X → 20
Worker A → Product Y → 15

depending on tenant configuration.

==================================================
12. PRODUCTION OUTPUT
==================================================

Output must be independently recorded.

Track:

- Total output
- Good output
- Defective output
- Rework quantity
- Wastage
- Process loss
- Scrap
- Pending QC
- Approved quantity

Only approved finished goods should move to available finished stock according to configured workflow.

==================================================
13. QC
==================================================

Current base requirement:

PASS / FAIL.

But architect the UI for future configurable QC parameters.

Workflow:

Production Output
→ QC Pending
→ PASS / FAIL

FAIL may lead to:

→ Rework
→ Scrap
→ Reject

Rework:

Rework
→ Re-test
→ PASS / FAIL

Preserve complete history.

==================================================
14. INVENTORY
==================================================

Support:

- Raw Materials
- Finished Goods
- Semi-finished Goods
- Consumables
- Packaging
- Spare Parts
- Other configurable inventory types

Multiple:

- Companies
- Branches
- Factories
- Warehouses
- Locations

Stock views:

- Current stock
- Available stock
- Reserved stock
- Damaged stock
- QC pending
- In transit
- Reorder
- Stock ledger

Never treat stock as a simple editable number.

Inventory must be transaction-driven.

==================================================
15. PURCHASE
==================================================

Workflow:

Supplier
→ Purchase Request
→ Purchase Order
→ Receipt
→ QC if applicable
→ Stock
→ Supplier Payable

Support:

- Multiple payment methods
- Multiple accounts
- Partial payment
- Due
- Advance
- Purchase return
- Discounts
- Tax
- Transport cost
- Other charges

==================================================
16. SALES
==================================================

Support:

- B2B
- B2C
- Retail
- Wholesale

Sales workflow:

Lead
→ Customer
→ Order
→ Invoice
→ Payment
→ Delivery
→ Completed

Support both:

Normal Sales

and

QUICK SALE / POS

==================================================
17. QUICK SALE / POS
==================================================

Create a genuine POS experience.

It must NOT feel like a normal sales form.

POS screen:

LEFT / MAIN AREA:
Product search
Categories
Product grid/list
Barcode scan
SKU search
Recent products
Favorites

RIGHT / SUMMARY AREA:

Cart
Quantity
Discount
Tax
Subtotal
Grand Total
Paid
Due
Payment Method
Customer
Delivery option

Actions:

Hold Sale
Resume Sale
Save Draft
Complete Sale
Print Invoice
Send Invoice
Create Customer
Apply Discount
Return

Support:

- Keyboard shortcuts
- Barcode scanner
- Product search
- Customer lookup
- Multiple payment methods
- Partial payment
- Cash
- Bank
- Mobile banking
- Configurable payment methods

POS must remain extremely fast.

==================================================
18. INVOICE BUILDER
==================================================

Invoice templates must NOT require coding to modify.

Create a configurable Invoice Template System.

Admin can configure:

- Logo
- Business name
- Address
- Contact
- Invoice title
- Invoice number
- Customer information
- Product columns
- Quantity
- Unit price
- Discount
- Tax
- Subtotal
- Total
- Paid
- Due
- Notes
- Terms
- Signature
- QR code
- Barcode
- Footer
- Colors
- Typography
- Layout

Template architecture:

Template
→ Sections
→ Components
→ Fields
→ Visibility
→ Ordering
→ Styling

Provide:

- Live preview
- Desktop preview
- Print preview
- PDF preview
- Save template
- Duplicate template
- Default template
- Template versioning

Do NOT create a full arbitrary visual website builder.

Create a controlled document builder using predefined components.

This ensures reliability.

==================================================
19. CUSTOMER MANAGEMENT
==================================================

Customer profile should show:

- Contact information
- Address
- Type
- Orders
- Invoices
- Payments
- Due
- Delivery history
- Returns
- Leads
- Notes
- Activity history

==================================================
20. CRM / LEADS
==================================================

Lead pipeline:

New
Contacted
Follow-up
Qualified
Converted
Lost
Fake

Salesman can create leads.

When converted:

Lead
→ Customer
→ Sale

Avoid duplicate customer creation.

Preserve:

- Original salesman
- Lead source
- Lead history
- Conversion date
- Sale reference

==================================================
21. SALESMAN TARGET
==================================================

Monthly target.

Dashboard:

Target
Achieved
Remaining
Achievement %
Days remaining
Required daily average
Lead count
Conversion rate
Sales value
Gross profit
Incentive

Target achievement must come from authoritative backend data.

==================================================
22. INCENTIVE
==================================================

Do not hardcode incentive rules.

Support configurable:

- Product-based incentive
- Category-based incentive
- Sales-value-based incentive
- Quantity-based incentive
- Target achievement incentive
- Slab/threshold incentive

Show:

Eligible Sales
Incentive Rate
Calculated Incentive
Approved Incentive
Paid Incentive
Pending Incentive

==================================================
23. DELIVERY MANAGEMENT
==================================================

Unified workflow:

Order
→ Invoice
→ Delivery
→ Courier / Manual Transport
→ Tracking
→ Delivered / Returned / Cancelled

Delivery methods:

1. Manual
2. Courier
3. Company transport
4. Pickup
5. Future configurable methods

Courier providers must be dynamic.

Potential providers:

- Steadfast
- Pathao
- REDX
- Paperfly
- eCourier
- Sundarban
- Other providers
- Custom API integration

DO NOT hardcode provider-specific logic into the UI.

Use:

Courier Provider
→ Integration
→ Service
→ Credentials
→ Configuration

Courier selection can support rules based on:

- Area
- Weight
- Delivery cost
- COD availability
- Service availability
- Delivery speed
- Tenant preference

==================================================
24. COURIER WORKFLOW
==================================================

Create:

Delivery Order
Courier
Service
Tracking Number
COD Amount
Delivery Charge
Customer
Address
Phone
Weight
Package Count

Statuses:

Pending
Booked
Picked Up
In Transit
Out for Delivery
Delivered
Partial Delivery
Returned
Cancelled
Failed

Support webhook/event updates where provider supports them.

Do not assume every courier supports the same features.

==================================================
25. E-COMMERCE FOUNDATION
==================================================

The platform must be ready for an integrated e-commerce platform.

Products can include:

- Raw Materials
- Finished Goods
- Accessories
- Spare Parts
- Consumables

E-commerce-ready product data:

- SKU
- Slug
- Product name
- Description
- Images
- Gallery
- Category
- Brand
- Attributes
- Variants
- Price
- Sale price
- Stock
- Warehouse availability
- SEO data
- Visibility
- Status

Do not build a separate product database for e-commerce.

Use the central product catalog.

==================================================
26. E-COMMERCE ORDER INTEGRATION
==================================================

Future-ready for:

Website orders
Marketplace orders
Social commerce
Manual orders

All orders should eventually flow through:

Order
→ Customer
→ Payment
→ Invoice
→ Inventory reservation
→ Delivery
→ Courier
→ Fulfillment

==================================================
27. HR
==================================================

Employee profile:

- Personal information
- Employee ID
- Department
- Designation
- Factory
- Branch
- Shift
- Joining date
- Salary information
- Attendance
- Production
- Sales performance
- Incentive
- Documents
- Status

==================================================
28. ASSET MANAGEMENT
==================================================

Support:

Fixed assets
Disposable/consumable assets

Track:

- Asset
- Category
- Purchase
- Cost
- Location
- Assignment
- Employee
- Condition
- Maintenance
- Expense
- Disposal
- History

==================================================
29. FINANCE
==================================================

Basic financial management:

- Accounts
- Payment methods
- Income
- Expenses
- Purchase payments
- Sales payments
- Collections
- Due
- Account transfers

Design architecture so Full Accounting can be added later.

==================================================
30. REPORTING / RMS
==================================================

Create a unified Report Center.

Reports:

Production
Inventory
Purchase
Sales
Profit
Customer
Supplier
Lead
Salesman
Target
Incentive
Collection
HR
Attendance
Employee Production
QC
Rework
Wastage
Asset
Expense
Finance
Delivery
Courier
Returns
Audit

Every report should have:

- Filter
- Date range
- Search
- Grouping
- Sort
- Pagination
- Summary
- Drill-down
- Export
- Print
- Source transaction
- Permission control

==================================================
31. NOTIFICATIONS
==================================================

Notification center.

Types:

- Low stock
- Overdue
- Production issue
- QC failure
- Rework
- Sales target gap
- Delivery failure
- Courier update
- Payment
- Approval request
- System event

In-app notification first.

Architecture must allow:

Push
Email
SMS
WhatsApp

later.

==================================================
32. AUDIT
==================================================

Important actions should show:

Who
What
When
Where
Before
After
Reference

Examples:

Invoice edited
Stock adjusted
Production changed
Payment modified
Customer changed
Permission changed
Employee changed

==================================================
33. GLOBAL SEARCH
==================================================

Create a global command/search system.

Search:

Customer
Supplier
Product
SKU
Invoice
Order
Lead
Employee
Production batch
Delivery
Tracking number

Support keyboard shortcut.

==================================================
34. UX SAFETY
==================================================

For destructive actions:

Confirm.

For irreversible financial/stock actions:

Require stronger confirmation.

For completed transactions:

Do not simply allow editing.

Use:

Correction
Reversal
Return
Adjustment
Void
Approval

according to backend business rules.

==================================================
35. EMPTY / LOADING / ERROR STATES
==================================================

Every screen must have:

Loading
Empty
Error
Success
Permission denied
Offline/network failure

Never show a blank screen.

==================================================
36. FRONTEND-BACKEND CONTRACT
==================================================

The frontend must never own authoritative business logic.

Backend owns:

- Inventory
- Profit
- Cost
- Target
- Incentive
- Due
- Permissions
- Tax
- Courier status
- Financial calculations

Frontend owns:

- Presentation
- UX
- Form interaction
- Client-side validation
- Temporary UI state

All server state uses TanStack Query.

All APIs use typed service modules.

Never scatter fetch/Axios calls throughout components.

==================================================
37. PERFORMANCE
==================================================

Use:

- Lazy routes
- Code splitting
- Pagination
- Server-side filtering
- Debounced search
- Virtualized large tables where necessary
- Optimistic updates only where safe
- Query caching
- Proper invalidation

Never load entire stock ledgers or sales history into the browser.

==================================================
38. FINAL FRONTEND QUALITY STANDARD
==================================================

Before considering a module complete, verify:

UX
Design
Responsiveness
Permissions
API integration
Validation
Loading
Empty state
Error handling
Accessibility
Dark mode
Language
Tenant branding
Audit visibility
Report integration

The frontend must feel like a mature SaaS product, not a generated admin panel.

Before coding:
Read all project documentation.
Inspect existing implementation.
Do not invent APIs.
Do not invent business rules.
Do not hardcode Slice Mart-specific assumptions.