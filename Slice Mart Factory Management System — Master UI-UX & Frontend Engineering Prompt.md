# MASTER PROMPT
## Slice Mart — Factory Management & Business Operations System
### UI/UX Architecture + Workflow + Production-Ready Frontend Implementation

---

## 0. YOUR ROLE

You are not being asked to create a generic ERP dashboard.

You are acting simultaneously as:

- Senior Product Designer
- Enterprise UX Architect
- Manufacturing Workflow Analyst
- Information Architect
- Design Systems Engineer
- Senior Frontend Engineer
- Usability Specialist
- Data Visualization Designer
- QA-minded Product Engineer

Your job is to design and implement the complete user interface and interaction system for:

**Slice Mart Factory Management System**

The system will be developed and delivered by:

**DevCenterPoint**

The system is for a real business and will be used for real factory operations.

Therefore:

> DO NOT create a visual mockup.
> DO NOT create a Dribbble-style concept.
> DO NOT create static dashboard screens.
> DO NOT create fake interactions.
> DO NOT fill the application with decorative UI components merely to make it look impressive.

Build a **coherent, production-oriented, fully navigable application interface with realistic workflows, meaningful states, validation, tables, forms, dialogs, drawers, filters, search, notifications, empty states, loading states, error states and confirmation flows.**

Every major screen must exist because a real business user needs it.

---

# 1. PRIMARY OBJECTIVE

Design and implement a complete Factory Management System that allows Slice Mart to digitally manage:

- Factory production
- Products
- Raw materials
- BOM / material requirements
- Inventory
- Two warehouses
- Purchase
- Suppliers
- Finished products
- B2B sales
- B2C sales
- Raw-material sales
- Delivery
- Quality control
- Rework
- Employee production performance
- Attendance / shift information
- Expenses
- Basic accounting
- Multiple accounts
- Multiple payment methods
- Notifications
- Reports
- Historical records
- Audit/history
- Barcode / QR workflows
- Cloud-based access
- CCTV integration readiness

The application must feel like a serious operational product, not an AI-generated admin template.

---

# 2. BUSINESS CONTEXT

Slice Mart manufactures:

**Infrared Cookers and Stoves**

Current scale:

- 25–30 product models
- Approximately 200–250 finished products/day
- 1 production line
- 7–10+ production workers
- Approximately 12–15 raw-material types may be required for a product
- 2 warehouses
- B2B + B2C business
- Retail + wholesale
- Both raw materials and finished products can be sold
- Current processes are partly manual / Excel-based
- Historical data needs to be preserved and migrated where possible
- Owner/management wants remote visibility
- Machine monitoring is NOT required
- Machine maintenance monitoring is NOT part of the core system
- OEE is NOT part of the core system
- CCTV integration is separate and feasibility depends on the existing CCTV/NVR infrastructure

---

# 3. NON-NEGOTIABLE DESIGN PRINCIPLES

## 3.1 NO AI-SLOPPY DESIGN

Avoid all stereotypical AI-generated SaaS patterns:

- Excessive gradients
- Purple-blue gradient backgrounds
- Giant decorative dashboard cards
- Random rounded rectangles everywhere
- Excessive glassmorphism
- Floating blobs
- Decorative charts with no business purpose
- Huge meaningless hero sections
- Excessive icons
- Rainbow KPI cards
- Random shadows
- Excessive border-radius
- Generic “Admin Dashboard” aesthetics
- Dribbble-inspired layouts that sacrifice usability
- Copy-paste shadcn-style screens without product thinking
- Tables filled with meaningless dummy columns
- Every page having the exact same layout
- Modal abuse
- Toast abuse
- Fake statistics
- “AI-looking” visual decoration

The interface must look like a **professionally commissioned enterprise product**.

---

# 4. VISUAL DIRECTION

The visual language should be:

**Premium + Industrial + Modern + Calm + Precise + Operational**

Think:

- Enterprise manufacturing software
- Modern financial software
- Premium B2B SaaS
- Professional logistics systems
- High-quality operational dashboards

NOT:

- Gaming UI
- Crypto dashboard
- Startup landing page
- AI dashboard
- Consumer social app

The UI should communicate:

**Control**
**Accuracy**
**Trust**
**Efficiency**
**Visibility**

---

# 5. BRANDING

Use the supplied **DevCenterPoint logo** appropriately.

Do not distort the logo.

Use the brand identity as a restrained visual foundation.

Primary visual direction:

- Deep navy
- Professional blue
- Controlled electric-blue accent
- Neutral whites
- Cool gray surfaces
- Strong dark text
- Muted secondary text

Use blue strategically for actions, active states and important information.

Do NOT make the entire application blue.

Do NOT use gradients as the primary visual identity.

Color should communicate meaning:

- Blue = action / information
- Green = successful / approved
- Amber = warning / pending
- Red = failed / critical
- Gray = inactive / neutral

Keep semantic colors consistent throughout the application.

---

# 6. TYPOGRAPHY

Typography must prioritize:

- Legibility
- Density control
- Data scanning
- Professional hierarchy

Use a modern UI sans-serif typeface.

Create a clear hierarchy:

- Page title
- Section title
- Supporting description
- KPI
- Table heading
- Table content
- Form label
- Helper text
- Status
- Metadata

Do not use oversized typography unnecessarily.

This is an operational application.

Information density matters.

---

# 7. LAYOUT SYSTEM

Create a consistent application shell:

### Desktop

Left navigation + main content area.

### Tablet

Adaptive navigation.

### Mobile

Responsive navigation and mobile-friendly operational views.

The application must not simply "shrink" the desktop version.

Mobile layouts should be intentionally designed.

---

# 8. APPLICATION SHELL

Create:

## Sidebar

Sections:

### Overview
- Dashboard

### Production
- Production Overview
- Production Orders
- Production Entry
- BOM / Materials
- Production History

### Inventory
- Inventory Overview
- Raw Materials
- Finished Products
- Stock Movement
- Stock Adjustment
- Warehouse Transfer

### Warehouse
- Warehouse A
- Warehouse B
- Warehouse Transfers

### Procurement
- Suppliers
- Purchase Orders
- Purchases
- Purchase History

### Sales
- Sales Overview
- New Sale
- B2B Sales
- B2C Sales
- Raw Material Sales
- Customers
- Returns

### Delivery
- Delivery Orders
- Pending Delivery
- In Transit
- Delivered
- Returned

### Quality Control
- QC Queue
- QC History
- Rework

### Workforce
- Employees
- Attendance
- Shifts
- Production Performance

### Finance
- Accounts
- Transactions
- Expenses
- Payments
- Receivables
- Payables
- Basic Profit & Loss

### Reports
- Production Reports
- Inventory Reports
- Purchase Reports
- Sales Reports
- QC Reports
- Employee Reports
- Expense Reports
- Financial Reports

### Monitoring
- Notifications
- CCTV

### Administration
- Users
- Roles & Permissions
- System Settings
- Audit Log

---

# 9. DASHBOARD

Do not make the dashboard a collection of random cards.

The dashboard must answer:

> "What is happening in the factory right now?"

Create meaningful sections.

## Header

Show:

- Current date
- Current operating status
- Notification access
- User profile
- Quick actions

## Production Summary

Show:

- Today's target
- Today's production
- Achievement %
- Pending production
- QC pending
- Rework quantity

## Production Trend

Show meaningful production trends.

Allow:

- Today
- 7 days
- 30 days

## Inventory Health

Show:

- Total raw material items
- Low-stock items
- Out-of-stock items
- Finished goods
- Warehouse distribution

## Sales Overview

Show:

- Today's sales
- Monthly sales
- B2B
- B2C
- Pending delivery
- Outstanding amount

## Employee Performance

Show:

- Top performers
- Employees below target
- Target vs actual

## Alerts

Show real operational alerts:

- Low stock
- Production below target
- QC failure
- Pending delivery
- Payment due

Every dashboard element must lead somewhere useful.

---

# 10. PRODUCTION WORKFLOW

The most important workflow.

Design the actual operational journey:

```text
Product Setup
     ↓
BOM Setup
     ↓
Production Planning
     ↓
Production Order
     ↓
Raw Material Availability Check
     ↓
Material Issue
     ↓
Production
     ↓
Employee Production Entry
     ↓
QC
   ↙   ↘
PASS   FAIL
 ↓       ↓
FG      Rework
Stock     ↓
        Re-QC
```

Do not treat production as a single form.

---

# 11. PRODUCT MANAGEMENT

Product creation should include:

- Product name
- Model
- SKU
- Category
- Product type
- Unit
- Selling price
- Wholesale price
- Minimum stock
- Barcode
- QR code
- Status

Provide:

### Product Details Page

Tabs:

- Overview
- BOM
- Inventory
- Production History
- Sales History
- Purchase History
- QC History
- Activity

---

# 12. BOM MANAGEMENT

BOM must be visually understandable.

Example:

### Product
Infrared Cooker — Model X

### Required Materials

| Material | Required Qty | Unit |
|---|---:|---|
| Material A | 1 | pcs |
| Material B | 2 | pcs |
| Material C | 0.5 | kg |

Allow:

- Add material
- Remove material
- Edit quantity
- Save BOM
- Version history

Show:

> "This product requires X materials."

When creating production:

The system should calculate required materials automatically.

---

# 13. PRODUCTION ORDER

Production Order must have:

- Order ID
- Product
- Model
- Quantity
- Target
- Assigned employees
- Production date
- Expected completion
- Required materials
- Material availability
- Status

Statuses:

- Draft
- Planned
- Ready
- In Production
- QC Pending
- Completed
- Cancelled

---

# 14. PRODUCTION ENTRY

Design this for speed.

The person entering production should NOT have to navigate through 8 screens.

Example:

### Today's Production

Product:
[ Select Product ]

Employee:
[ Select Employee ]

Target:
50 pcs

Produced:
[ 48 ]

Defective:
[ 2 ]

Rework:
[ 1 ]

Save Production

After save:

Show clear confirmation and updated stock/status.

---

# 15. EMPLOYEE PERFORMANCE

Employee dashboard:

- Target
- Actual
- Achievement
- Defective
- Rework
- Attendance

Example:

**Rahim**

Target: 50  
Produced: 48  
Achievement: 96%  
Defective: 2  
Rework: 1

Provide:

- Daily
- Weekly
- Monthly

views.

---

# 16. QC WORKFLOW

Keep QC intentionally simple.

QC Status:

- Pending
- Passed
- Failed
- Rework
- Re-tested

QC screen should be optimized for fast inspection.

Example:

### QC #QC-00125

Product: Infrared Cooker X  
Production Order: PO-00125  
Quantity: 20

[ PASS ]

[ FAIL ]

If FAIL:

Require:

- Reason
- Quantity
- Remarks

Then route to:

**Rework**

After rework:

**QC Re-test**

If PASS:

Move to Finished Goods.

---

# 17. INVENTORY

Inventory must be transaction-driven.

Never simply change stock values without creating a movement.

Every quantity change should have a reason:

- Purchase
- Production Consumption
- Production Output
- Sale
- Return
- Transfer
- Adjustment
- Damage
- Wastage

Create:

### Stock Movement Timeline

Example:

```text
+500 pcs
Purchase
Today 10:32 AM

-20 pcs
Production Consumption
Today 1:14 PM

+18 pcs
Production Output
Today 4:20 PM
```

This creates traceability.

---

# 18. TWO-WAREHOUSE SYSTEM

Support:

- Warehouse A
- Warehouse B

Warehouse dashboard:

- Total items
- Total stock value
- Low stock
- Incoming
- Outgoing

Transfer workflow:

```text
Warehouse A
     ↓
Transfer Request
     ↓
Approval
     ↓
In Transit
     ↓
Warehouse B
     ↓
Received
```

Do not simply change both stock values without maintaining transfer history.

---

# 19. PURCHASE WORKFLOW

```text
Supplier
   ↓
Purchase Order
   ↓
Receive Items
   ↓
Stock Entry
   ↓
Payment
   ↓
Purchase History
```

Purchase form:

- Supplier
- Items
- Quantity
- Unit price
- Discount
- Tax if applicable
- Total
- Payment method
- Paid
- Due
- Warehouse
- Notes

---

# 20. SALES WORKFLOW

Support both:

### B2C
Retail customer

### B2B
Wholesale customer

And:

### Product Sale
Finished goods

### Raw Material Sale
Raw materials

The sale interface should be fast.

Workflow:

```text
Customer
 ↓
Select Items
 ↓
Quantity
 ↓
Price
 ↓
Discount
 ↓
Payment
 ↓
Delivery
 ↓
Invoice
```

---

# 21. PAYMENT METHODS

System must support multiple payment methods.

Examples:

- Cash
- Bank
- bKash
- Nagad
- Card
- Credit/Due
- Other configurable methods

Payment method must be configurable.

Do NOT hard-code only one payment type.

---

# 22. MULTIPLE ACCOUNTS

Accounting architecture should support multiple accounts.

Examples:

- Cash Account
- Bank Account
- bKash Account
- Nagad Account
- Other Accounts

Each transaction must be associated with an account where applicable.

---

# 23. ACCOUNTING

Core scope:

- Accounts
- Transactions
- Income
- Expense
- Receivable
- Payable
- Payment
- Basic profit/loss

Structure the architecture so a future full accounting module can add:

- Chart of Accounts
- Ledger
- Journal
- Trial Balance
- Balance Sheet
- Income Statement

Do not overbuild full accounting in the core implementation unless explicitly required.

---

# 24. EXPENSES

Expense form:

- Category
- Amount
- Account
- Payment method
- Date
- Reference
- Notes
- Attachment if supported

Expense categories must be configurable.

---

# 25. DELIVERY

Delivery status:

- Pending
- Processing
- Ready
- Assigned
- In Transit
- Delivered
- Returned
- Cancelled

Delivery details:

- Customer
- Address
- Phone
- Order
- Items
- Amount
- Payment status
- Delivery person
- Delivery date

---

# 26. BARCODE / QR

Make the architecture barcode/QR ready.

Support:

- Product barcode
- Raw material barcode
- Warehouse scanning
- Stock lookup
- Product lookup
- Sale lookup

Scanner interaction should be fast.

---

# 27. NOTIFICATIONS

Use in-app push notifications.

Notification categories:

- Low Stock
- Production Delay
- QC Failure
- Rework Required
- Pending Delivery
- Payment Due
- Purchase Required

Create:

### Notification Center

with:

- Unread
- Read
- Mark all read
- Filter
- Timestamp
- Related module

---

# 28. REPORTING

Reports must be operationally useful.

Production:

- Daily
- Weekly
- Monthly
- Product-wise
- Employee-wise

Inventory:

- Current stock
- Stock movement
- Low stock
- Warehouse stock

Purchase:

- Supplier-wise
- Date-wise
- Outstanding

Sales:

- B2B
- B2C
- Product-wise
- Customer-wise

QC:

- Passed
- Failed
- Rework

Finance:

- Income
- Expense
- Receivable
- Payable
- Basic P&L

Every report should support:

- Date filter
- Search
- Relevant filters
- Export-ready structure

---

# 29. AUDIT LOG

Create a proper audit trail.

Example:

```text
Rahim
Updated Product

Previous Price:
৳1,250

New Price:
৳1,300

16 Aug 2026
03:42 PM
```

Track important actions:

- Create
- Update
- Delete
- Approve
- Cancel
- Stock adjustment
- Payment
- Production changes
- QC changes

---

# 30. CCTV

CCTV must be presented as a separate module.

Do not fake an integration.

Build a professional CCTV interface placeholder/integration-ready architecture.

The UI should support:

- Camera list
- Camera status
- Live view area
- Camera groups
- Fullscreen
- Connection status

Display:

> "CCTV integration feasibility depends on the existing CCTV/NVR infrastructure."

Do not claim that every CCTV system can be integrated.

---

# 31. USER ROLES

Design permission-aware UI for:

- Super Admin
- Owner
- Factory Manager
- Production Manager
- Supervisor
- Store Manager
- Storekeeper
- QC Officer
- Sales
- Purchase
- Accounts
- HR
- Employee

A user should only see modules they have permission to access.

---

# 32. SEARCH

Global search should be useful.

Search across:

- Products
- Raw Materials
- Customers
- Suppliers
- Production Orders
- Sales
- Purchases
- Employees
- Transactions

Search results should show type and context.

Example:

```text
Search: "IR-102"

Products
Infrared Cooker Model IR-102

Production Orders
PO-00124

Inventory
Warehouse A — 120 pcs
```

---

# 33. FORMS

Forms must be professional.

Rules:

- Clear labels
- Helpful placeholders
- Required field indicators
- Inline validation
- Proper error messages
- Keyboard navigation
- Logical grouping
- Save state
- Unsaved-change warning

Do not use giant forms without sections.

Use progressive disclosure where appropriate.

---

# 34. TABLES

Tables are central to this application.

Implement:

- Search
- Filters
- Sorting
- Pagination
- Column alignment
- Status badges
- Row actions
- Bulk actions where useful
- Empty state
- Loading state
- Error state

Do not put 15 unnecessary columns into every table.

Prioritize information.

---

# 35. DETAIL PAGES

Every important business entity should have a proper detail page.

Examples:

### Product
Overview / Inventory / BOM / Production / Sales / Activity

### Customer
Overview / Orders / Payments / Delivery / History

### Supplier
Overview / Purchases / Payments / History

### Production Order
Overview / Materials / Employees / QC / Output / Activity

### Employee
Overview / Attendance / Production / Performance

---

# 36. EMPTY STATES

Never show blank screens.

Create meaningful empty states.

Example:

> No production orders today.
>
> Start a production order to begin tracking today's output.

Provide the appropriate CTA.

---

# 37. LOADING STATES

Use skeleton loaders where appropriate.

Do not show generic "Loading..." everywhere.

Tables should preserve layout during loading.

---

# 38. ERROR STATES

Errors should explain:

- What happened
- What the user can do

Example:

> Unable to save production entry.
> Please check the selected employee and quantity.

Avoid:

> Something went wrong.

---

# 39. CONFIRMATION

Destructive operations must require confirmation.

Examples:

- Delete
- Cancel production
- Stock adjustment
- Remove BOM material
- Cancel purchase
- Cancel sale

Confirmation dialogs must clearly explain the consequence.

---

# 40. UX RULE: DON'T MAKE USERS THINK

For every workflow ask:

> What does the user know at this moment?

> What should they do next?

> What information do they need?

> What happens after they click?

> Can they undo or correct it?

The interface should make the next action obvious.

---

# 41. REALISTIC DATA

Do not use:

- John Doe
- Lorem Ipsum
- Product A
- Product B
- Random meaningless statistics

Use realistic Slice Mart data.

Examples:

- Infrared Cooker
- Infrared Stove
- Burner
- Heating Element
- Glass Top
- Body
- Knob
- Switch
- Packaging
- Electrical Components

Create realistic Bangladesh-oriented:

- Customer names
- Supplier names
- BDT currency
- Phone number formats
- Addresses
- Dates
- Warehouse names

The data should feel like a real system being used by Slice Mart.

---

# 42. CURRENCY

Use:

**BDT / ৳**

Do not use USD.

Format financial values consistently.

Example:

**৳125,000**

---

# 43. LANGUAGE

Primary interface language:

**English**

Architecture should remain ready for future Bangla localization.

Do not mix random Bangla and English labels in the UI.

---

# 44. RESPONSIVE DESIGN

The system must work across:

- Desktop
- Laptop
- Tablet
- Mobile

But prioritize:

### Desktop
because factory management will primarily be used from office computers.

Mobile should focus on:

- Production entry
- Notifications
- Quick stock lookup
- Employee performance
- Sales
- Approval
- Monitoring

---

# 45. ACCESSIBILITY

Follow professional accessibility practices:

- Keyboard navigation
- Visible focus states
- Proper contrast
- Semantic HTML
- Labels
- ARIA where required
- Do not rely on color alone
- Accessible dialogs
- Accessible dropdowns
- Accessible tables

---

# 46. INTERACTION QUALITY

Interactions should feel intentional.

Use subtle:

- Hover states
- Press states
- Focus states
- Transitions
- Drawer animations
- Modal animations
- Table interactions

Avoid excessive animation.

No flashy motion.

Motion should communicate state and hierarchy.

---

# 47. DESIGN SYSTEM

Before building all screens, establish a reusable design system.

Define:

### Colors
- Primary
- Secondary
- Background
- Surface
- Border
- Text
- Muted
- Success
- Warning
- Error
- Info

### Components

- Button
- Input
- Select
- Search
- Date Picker
- Dropdown
- Badge
- Tooltip
- Modal
- Drawer
- Tabs
- Table
- Pagination
- Toast
- Alert
- Card
- KPI
- Timeline
- Stepper
- Empty State
- Skeleton
- Confirmation Dialog

Do not reinvent components on every page.

---

# 48. COMPONENT QUALITY

Every component must be:

- Reusable
- Consistent
- Responsive
- Accessible
- State-aware

Avoid giant page components.

Keep business logic separated from UI where possible.

---

# 49. TECHNICAL IMPLEMENTATION

Use the project's established frontend stack.

Preferred:

- React
- TypeScript
- Vite or Next.js depending on the existing project
- Tailwind CSS
- Component architecture
- Proper state management
- Form validation
- API-ready service layer

If backend APIs are not available yet:

Create a realistic mock service/data layer.

BUT:

> The UI must behave as though it is connected to a real backend.

Do not hardcode everything directly into components.

---

# 50. MOCK DATA ARCHITECTURE

Create structured mock data for:

- Products
- BOMs
- Raw materials
- Warehouses
- Inventory
- Employees
- Production orders
- QC records
- Suppliers
- Purchases
- Customers
- Sales
- Deliveries
- Expenses
- Accounts
- Transactions
- Notifications

Relationships between data must make sense.

Example:

A production order should reference a real product.

The product should have a BOM.

The BOM should reference real materials.

Those materials should exist in inventory.

The production should affect inventory.

QC should reference the production order.

The finished goods should appear in warehouse stock.

Sales should reduce finished-goods stock.

This is essential.

---

# 51. BUSINESS LOGIC SIMULATION

Even in mock mode, simulate real operations.

Example:

If:

```text
Warehouse A:
Infrared Cooker X = 100
```

and user creates:

```text
Sale = 5
```

then the interface should reflect:

```text
Available = 95
```

Similarly:

Production:

```text
Production = 20
```

should affect:

- Material consumption
- Production output
- Employee performance
- QC queue
- Finished goods

The prototype must demonstrate workflow integrity.

---

# 52. CORE USER JOURNEYS

Before considering the application complete, implement these end-to-end journeys:

## Journey 1 — Add Product

Product → BOM → Save → Product detail

## Journey 2 — Purchase Raw Material

Supplier → Purchase → Receive → Warehouse → Inventory

## Journey 3 — Produce Product

Production Order → Material Check → Production Entry → Employee → QC

## Journey 4 — QC Pass

QC → Pass → Finished Goods → Warehouse

## Journey 5 — QC Fail

QC → Fail → Rework → Re-QC → Pass

## Journey 6 — Sell Finished Product

Customer → Sale → Payment → Stock deduction → Delivery

## Journey 7 — Sell Raw Material

Customer → Raw Material → Sale → Stock deduction → Payment

## Journey 8 — Warehouse Transfer

Warehouse A → Transfer → Warehouse B → Receive

## Journey 9 — Employee Performance

Employee → Daily Target → Production Entry → Performance Dashboard

## Journey 10 — Expense

Expense → Account → Payment → Financial summary

## Journey 11 — Low Stock

Stock falls below threshold → Notification → Inventory → Purchase

## Journey 12 — Production Alert

Actual production below target → Dashboard alert → Notification

These journeys must actually work within the frontend prototype.

---

# 53. NAVIGATION PRINCIPLE

Every workflow must have a logical entry point.

Avoid dead-end pages.

For example:

From Product:

**Product → Create Production**

From Production:

**Production → QC**

From QC:

**QC → Rework**

From Inventory:

**Low Stock → Create Purchase**

From Sale:

**Sale → Create Delivery**

From Customer:

**Customer → New Sale**

Contextual actions are critical.

---

# 54. QUICK ACTIONS

Dashboard should have useful quick actions:

- New Production
- New Purchase
- New Sale
- Add Product
- Add Raw Material
- Stock Transfer
- QC Inspection
- Add Expense

Do not add quick actions merely for decoration.

---

# 55. DESIGN REVIEW

After implementation, review every screen against:

### Visual

- Does it look professionally designed?
- Is spacing consistent?
- Is typography consistent?
- Are colors restrained?
- Is the visual hierarchy obvious?

### UX

- Is the next action obvious?
- Can users complete tasks quickly?
- Are forms understandable?
- Are errors recoverable?

### Business

- Does the workflow represent a real factory?
- Does inventory movement make sense?
- Does production connect to QC?
- Does QC connect to rework?
- Does sales affect inventory?
- Does purchase affect stock?
- Do employees connect to production?

### Technical

- No broken navigation
- No console errors
- No dead buttons
- No fake dropdowns
- No fake search
- No fake forms
- No broken responsive layouts

---

# 56. IMPORTANT SCOPE BOUNDARY

The following are NOT part of the core system unless explicitly added later:

- Automatic machine monitoring
- PLC integration
- IoT sensor integration
- OEE
- Machine maintenance management
- Predictive maintenance
- Advanced payroll
- Full accounting ERP
- Advanced CCTV integration beyond feasible existing infrastructure
- Native mobile application
- New third-party integrations
- Hardware integrations
- Major UI redesigns after approval
- New modules
- Major workflow changes

These must be architecturally possible where practical, but must not silently become part of the core scope.

---

# 57. CCTV RULE

Never pretend CCTV is integrated if the infrastructure has not been inspected.

Build the module as:

**Integration Ready**

The final implementation depends on:

- CCTV brand
- NVR/DVR
- Protocol
- Network access
- Available API/stream
- Authentication method

---

# 58. PERFORMANCE

The UI must remain fast with:

- Large tables
- Many products
- Many transactions
- Large inventory
- Historical records

Use:

- Pagination
- Lazy loading where appropriate
- Efficient rendering
- Debounced search
- Proper state updates

Do not render thousands of records unnecessarily.

---

# 59. FINAL QUALITY BAR

Before declaring the project complete, ask yourself:

> Could a real Slice Mart employee use this tomorrow?

If the answer is no, continue improving it.

The final application should feel like:

**A professionally designed factory operating system.**

Not:

**A collection of AI-generated dashboard pages.**

---

# 60. REQUIRED DELIVERY ORDER

Do NOT build pages randomly.

Follow this sequence:

### Phase 01
Information Architecture

### Phase 02
Design System

### Phase 03
Application Shell

### Phase 04
Dashboard

### Phase 05
Master Data

- Products
- Materials
- Employees
- Customers
- Suppliers
- Warehouses
- Accounts

### Phase 06
Production

### Phase 07
Inventory

### Phase 08
Purchase

### Phase 09
Sales

### Phase 10
Delivery

### Phase 11
QC & Rework

### Phase 12
Workforce

### Phase 13
Finance

### Phase 14
Reports

### Phase 15
Notifications

### Phase 16
CCTV Integration-ready module

### Phase 17
Administration & Audit

### Phase 18
Responsive Optimization

### Phase 19
End-to-End Workflow Testing

### Phase 20
Visual Polish & QA

---

# 61. FINAL INSTRUCTION

Do not ask:

> "What dashboard design do you want?"

You are responsible for determining the best UX from the business requirements.

Do not invent unnecessary functionality.

Do not simplify the workflow into generic CRUD screens.

Do not create disconnected pages.

Do not prioritize visual novelty over usability.

Do not use AI-generated design clichés.

Instead:

**Understand the factory.**

**Model the workflow.**

**Design the information architecture.**

**Build the interface.**

**Connect the workflows.**

**Simulate realistic data.**

**Validate every business transition.**

**Polish the visual system.**

**Then make it beautiful.**

The final result should be:

> **Premium enough for the owner.**
>
> **Simple enough for a factory worker.**
>
> **Powerful enough for a manager.**
>
> **Structured enough for an accountant.**
>
> **Clear enough for a storekeeper.**
>
> **Fast enough for daily operations.**
>
> **Scalable enough for future expansion.**

### The guiding principle:

# "Design for the work, not for the screenshot."

Build Slice Mart's system as a **real product**, not a visual demonstration.