# SliceMart ERP & Factory Management System (FMS) — Beginner's End-to-End Guide

Welcome to **SliceMart ERP & FMS**! This guide is designed for beginners who are taking their first steps in running or working with the platform. Whether you are an **Administrator, Operations Manager, Factory Floor Supervisor, Warehouse Lead, Sales Executive, Cashier, or Accountant**, this step-by-step tutorial will guide you through the entire operational lifecycle from start to finish.

---

## Table of Contents
1. [System Overview & Key Concepts](#1-system-overview--key-concepts)
2. [Step 1: Logging In & Understanding Your Role Cockpit](#step-1-logging-in--understanding-your-role-cockpit)
3. [Step 2: Initial Setup & Master Configuration](#step-2-initial-setup--master-configuration)
4. [Step 3: Defining Products, Units & Bills of Materials (BOM)](#step-3-defining-products-units--bills-of-materials-bom)
5. [Step 4: Procurement & Purchasing Raw Materials](#step-4-procurement--purchasing-raw-materials)
6. [Step 5: Warehouse & Stock Inventory Management](#step-5-warehouse--stock-inventory-management)
7. [Step 6: Factory Production & Manufacturing Workflow](#step-6-factory-production--manufacturing-workflow)
8. [Step 7: Quality Assurance & Inspections (QC)](#step-7-quality-assurance--inspections-qc)
9. [Step 8: Sales, Commercial Invoicing & CRM](#step-8-sales-commercial-invoicing--crm)
10. [Step 9: Point of Sale (POS) Counter Operations](#step-9-point-of-sale-pos-counter-operations)
11. [Step 10: Logistics, Delivery & Courier Dispatch](#step-10-logistics-delivery--courier-dispatch)
12. [Step 11: Finance, General Ledger & Expenses](#step-11-finance-general-ledger--expenses)
13. [Step 12: Workforce, Attendance & Factory Payroll](#step-12-workforce-attendance--factory-payroll)
14. [Step 13: Online Storefront & E-Commerce CMS](#step-13-online-storefront--e-commerce-cms)
15. [Quick Reference: Everyday Keyboard Shortcuts & Tips](#quick-reference-everyday-keyboard-shortcuts--tips)

---

## 1. System Overview & Key Concepts

SliceMart is an **all-in-one manufacturing ERP** that links your entire supply chain:

```
[Procurement] ➔ [Warehouse Storage] ➔ [Factory Production] ➔ [Quality Control] ➔ [Finished Goods] 
                                                                                        │
[Online Storefront] ◄──── [Omnichannel Sales & POS] ◄───────────────────────────────────┘
         │
         ▼
[Logistics & Couriers] ➔ [COD Settlement] ➔ [Finance & Accounting] ➔ [Payroll & Audits]
```

### Core Rules to Remember:
1. **Zero Fake Stock (Append-Only Ledger)**: Stock numbers are never typed in manually as a magic number. Every stock change is backed by an immutable ledger entry (Goods Receipt, Production Output, Sales Dispatch, or Physical Audit).
2. **Context-Complete Production**: A factory batch only computes yield and variance when all data inputs (raw material issues, machine logs, and worker piece-counts) are finished.
3. **Omnichannel Synchronicity**: Counter POS, wholesale B2B invoices, and online storefront web orders deduct from the same central inventory in real time.

---

## Step 1: Logging In & Understanding Your Role Cockpit

### 1.1 How to Log In
1. Open your browser and navigate to the application URL (e.g., `http://localhost:5173` or your production domain).
2. Enter your work email and password.
   - *Default Test Admin:* `admin@slicemart.test` / `Password123!`
3. Click **Sign In**.

### 1.2 The Role Perspective Bar
When you land on the **Executive Dashboard**, look at the top control card:
- **Left Side**: Displays your active role (e.g. `Super Administrator`, `Factory Manager`, `Sales Officer`).
- **Right Side**: 
  - **Live Sync Button**: Pulses green when live operational telemetry is active. Click to pause if you want to inspect a static view.
  - **Refresh Button**: Instantly pulls the latest metrics across all departments.
- **Perspective Switcher (Admin Only)**: If your account has permission across multiple wings, a tab bar appears allowing you to switch perspectives in one click:
  - *Executive Overview* | *Factory Production* | *Stock & Warehouse* | *Quality Control* | *Sales & POS* | *Finance & Accounts* | *Workforce & HR* | *Procurement & SCM* | *Logistics & Dispatch*

### 1.3 Quick Action Launcher
Directly under the role selector, click any quick action pill (e.g. `+ Sales Order`, `POS Register`, `Batch Plan`, `Transfer Stock`, `Purchase PO`) to start work without navigating menus.

---

## Step 2: Initial Setup & Master Configuration

*Required once when setting up a new business or branch.*

1. **Go to Settings Center**: Click **Settings** in the left sidebar (or press `Ctrl+K` and type `Settings`).
2. **Company Profile**:
   - Fill in Business Legal Name, Trade License, VAT/Tax registration number, and contact info.
   - Upload your company logo (automatically used on printed invoices, delivery challans, and receipts).
3. **Warehouses & Factory Lines**:
   - Go to **Inventory & Warehouses** ➔ Add your primary warehouse (e.g., *Main Raw Material Store*, *Finished Goods Hub*).
   - Go to **Production & Quality** ➔ Create your factory lines (e.g., *Cutting Line 1*, *Assembly Line A*, *Packaging Station*).
4. **Currencies & Localization**:
   - Set your base currency (e.g. `BDT (৳)`, `USD ($)`, `EUR (€)`), timezone, and date format (`DD-MM-YYYY`).
5. **Chart of Accounts (COA)**:
   - SliceMart comes pre-configured with standard asset, liability, equity, income, and operational expense accounts.

---

## Step 3: Defining Products, Units & Bills of Materials (BOM)

To manufacture or sell anything, the system must know what the product is made of.

### 3.1 Create Measurement Units & Categories
1. Navigate to **Product Catalog & Recipes** ➔ **Units of Measure**.
2. Ensure you have your base units: `kg`, `meter`, `pcs`, `liter`, `box`.
3. Go to **Categories** ➔ Create categories (e.g., *Raw Materials*, *Packaging Supplies*, *Finished Goods*).

### 3.2 Add Raw Materials
1. Go to **Products** ➔ Click **+ Add Product**.
2. Enter Name (e.g. *Organic Flour Grade A*), SKU (e.g. `RM-FLOUR-01`), and set Type to **Raw Material**.
3. Set primary unit (`kg`) and minimum stock alert threshold (e.g., `50`).
4. Click **Save**.

### 3.3 Add Finished Product & Bill of Materials (BOM) Recipe
1. Click **+ Add Product**.
2. Enter Name (e.g. *Artisan Sourdough Loaf 500g*), SKU (`FG-BREAD-01`), and set Type to **Finished Good**.
3. Under **Pricing**, set Cost Price and Selling Price.
4. Switch to the **BOM / Recipe** tab:
   - Add ingredient: *Organic Flour Grade A* ➔ `0.35 kg`
   - Add ingredient: *Yeast* ➔ `0.01 kg`
   - Add ingredient: *Packaging Wrapper* ➔ `1 pcs`
5. Click **Save Recipe**. Now the system knows exactly what raw materials to deduct every time a batch is baked or assembled.

---

## Step 4: Procurement & Purchasing Raw Materials

When raw materials are low, the procurement team purchases them from vendors.

1. **Add a Supplier**:
   - Navigate to **Purchasing & Sourcing** ➔ **Suppliers**.
   - Click **+ New Supplier** (e.g., *National Agro Mills Ltd.*) and enter contact & payment terms.
2. **Issue a Purchase Order (PO)**:
   - Go to **Purchase Orders** ➔ Click **+ Create PO**.
   - Select the Supplier, target delivery warehouse, and expected arrival date.
   - Add lines: *Organic Flour Grade A* (Quantity: `500 kg`, Unit Cost: `৳ 65`).
   - Click **Submit for Approval** ➔ Click **Approve**.
3. **Receive Goods via Goods Received Note (GRN)**:
   - When the truck arrives at the warehouse dock, open the PO and click **Receive Goods (GRN)**.
   - Enter delivered quantities and inspection notes.
   - Click **Confirm GRN**.
   - *Result*: The system immediately updates the stock balance for the raw materials in that warehouse, generates a printable Goods Receipt Document, and records the purchase payable in Accounts Payable.

---

## Step 5: Warehouse & Stock Inventory Management

SliceMart maintains real-time tracking across multiple facilities.

### 5.1 Checking Stock & Bin Locations
- Navigate to **Warehouse & Stock** ➔ **Inventory Ledger**.
- Filter by warehouse, category, or stock status (`available`, `reserved`, `quarantine`, `damaged`).
- Click on any product to view its immutable transaction history (every single `+` or `-`).

### 5.2 Inter-Warehouse Stock Transfers
1. Click **Transfer Stock**.
2. Select Source Warehouse (e.g. *Central Hub*) and Destination Warehouse (e.g. *Factory Store 1*).
3. Add products and quantities.
4. Click **Dispatch Transfer**. Status becomes `in_transit`.
5. Upon arrival at the receiving warehouse, click **Receive Transfer** to add it to the destination's active stock.

### 5.3 Printing Barcodes & Shelf Labels
- Click **Print Barcode Labels**.
- Select products, label layout (thermal rolls, A4 multi-label sheets), and barcode format (`Code 128`, `EAN-13`, `QR Code`).
- Preview and print directly to any office or thermal barcode printer.

---

## Step 6: Factory Production & Manufacturing Workflow

This is the core heartbeat of the Factory Management System.

### 6.1 Create a Production Batch
1. Go to **Production Lines** ➔ Click **+ New Production Batch**.
2. Select:
   - **Factory & Line**: *Bakery Line 1*
   - **Product to Produce**: *Artisan Sourdough Loaf 500g*
   - **Target Quantity**: `200 pcs`
   - **BOM Recipe**: Select active approved BOM.
3. Click **Generate Batch**. The batch is created in `Draft / Collecting` state.

### 6.2 Issue Raw Materials to Factory Floor
1. On the batch detail screen, review the required ingredients computed by the BOM.
2. Click **Issue Materials from Warehouse**.
3. Choose the source warehouse and confirm release.
4. *Result*: Raw materials are deducted from the warehouse stock ledger and assigned to the active batch WIP (Work In Progress).

### 6.3 Factory Floor Kiosk View
1. Machine operators or floor supervisors open **Kiosk Mode** (full-screen touch interface).
2. Workers log their machine line start, shift hours, and piece output.
3. The system tracks real-time progress against the 200 pcs target.

### 6.4 Closing the Batch
- When production finishes, click **Complete Production Run**.
- Enter final gross units produced.
- The system automatically triggers the **Quality Control Inspection** queue.

---

## Step 7: Quality Assurance & Inspections (QC)

Nothing enters finished goods inventory without passing QA.

1. Navigate to **Quality Control (QC)** ➔ **Pending Inspections**.
2. Select the completed batch.
3. Perform the parameter checklist:
   - *Visual Integrity & Color*: Pass / Fail
   - *Weight & Dimension Tolerance*: Pass / Fail
   - *Moisture / Temperature Test*: Pass / Fail
4. Enter quantity breakdown:
   - **Passed Quantity** (e.g. `195 pcs`): Transferred directly to *Finished Goods Warehouse* as ready-to-sell inventory.
   - **Rework Quantity** (e.g. `3 pcs`): Routed into a secondary correction job.
   - **Scrapped / Wastage Quantity** (e.g. `2 pcs`): Written off to scrap loss ledger with mandatory reason code.
5. Click **Approve Inspection**. A QA Certificate of Analysis is generated.

---

## Step 8: Sales, Commercial Invoicing & CRM

SliceMart supports both wholesale B2B distribution and fast retail sales.

### 8.1 Manage Leads & Customers
- Go to **Customer Leads & CRM** ➔ Track potential wholesale clients through stages: *New Lead ➔ Qualified ➔ Negotiation ➔ Won*.
- Go to **Customers** to configure credit limits, payment terms (e.g., Net 30), and billing addresses.

### 8.2 Create a Sales Order & Invoice
1. Go to **Sales & Invoices** ➔ Click **+ Create Sales Order**.
2. Select Customer, delivery date, and add finished goods.
3. Click **Confirm Order**. The system marks the required stock as `reserved` so it cannot be double-sold.
4. When ready to dispatch, click **Generate Invoice**.
5. Choose payment terms or record upfront payment (Cash, Bank Transfer, Cheque).
6. Click **Print Invoice / Delivery Challan** to generate professional PDF documents with QR verification.

---

## Step 9: Point of Sale (POS) Counter Operations

Designed for high-speed retail checkout counters.

### 9.1 Opening a Shift
1. Navigate to **Point of Sale (POS)**.
2. Enter your **Opening Cash Float** (e.g., `৳ 2,000` in the cash drawer).
3. Click **Open Register**.

### 9.2 Performing High-Speed Sales
1. Scan items using a USB/Bluetooth barcode scanner or use quick-touch categories on the screen.
2. Adjust quantities with `+` / `-` keys.
3. Apply customer discounts or coupons if applicable.
4. Press `F12` or click **Pay**:
   - Select payment method: **Cash**, **Card**, or **MFS / Mobile Wallet (bKash/Nagad)**.
   - Supports split payments (e.g. half cash, half card).
5. Click **Complete Sale**.
6. The receipt prints immediately on your thermal receipt printer (`80mm` or `58mm`), and the register is ready for the next customer in under 3 seconds.

### 9.3 Offline Support
If your internet connection drops, the POS continues working seamlessly in offline mode, storing sales in local browser storage. Once connection restores, it automatically syncs with the server.

### 9.4 Closing the Shift
1. At the end of the day, click **Close Register**.
2. Enter physical cash counted in the drawer (Blind Count).
3. The system generates a shift reconciliation report detailing sales totals, cash variance (if any), and transactions.

---

## Step 10: Logistics, Delivery & Courier Dispatch

Seamlessly bridge warehouse fulfillment with home delivery.

### 10.1 Rider Run Sheets (Internal Fleet)
1. Go to **Delivery & Couriers** ➔ **Run Sheets**.
2. Click **+ Create Run Sheet**, choose your driver/rider and vehicle.
3. Select the invoices to be delivered in that delivery run.
4. Print the **Rider Challan Document**.
5. Upon return, mark deliveries as `Delivered` or `Returned`, and collect Cash on Delivery (COD).

### 10.2 Third-Party Courier Integration (RedX, Steadfast, Pathao)
1. Go to **Courier Shipments** ➔ Click **Book Consignment**.
2. Select the courier partner.
3. System automatically transmits parcel weight, customer address, and COD collection amount via API.
4. Receive a live tracking ID and print the courier parcel shipping label.
5. Track courier status changes automatically via webhooks.

### 10.3 COD Cash Reconciliation
1. When the courier transfers collected cash to your bank, go to **COD Reconciliation**.
2. Match courier remittance statements against order invoice totals.
3. Click **Reconcile**. System automatically balances Accounts Receivable and deposits funds into the Bank ledger.

---

## Step 11: Finance, General Ledger & Expenses

SliceMart includes an automated **double-entry accounting engine**.

### 11.1 How Accounting Works Automatically
You don't need to be an accountant to maintain clean books:
- Receiving purchase goods automatically credits *Accounts Payable* and debits *Inventory Asset*.
- Making a sale automatically credits *Sales Revenue* and debits *Accounts Receivable / Cash*.
- Delivering goods automatically records *Cost of Goods Sold (COGS)* and reduces *Inventory Asset*.

### 11.2 Recording Operational Expenses
1. Go to **Finance & Accounts** ➔ **Expenses**.
2. Click **+ Record Expense**.
3. Select Category (e.g. *Factory Electricity*, *Factory Rent*, *Machine Maintenance*).
4. Choose paying account (e.g. *Petty Cash* or *Prime Bank Current Account*).
5. Enter amount, attach receipt voucher photo/PDF, and click **Post Expense**.

### 11.3 Viewing Reports & Overdue Invoices
- Open **Accounts Receivable (AR) Aging**: View debtors grouped by risk: `0–30 days`, `31–60 days`, `61–90 days`, and `90+ days overdue`.
- View **Profit & Loss Statement** and **Balance Sheet** in real-time.

---

## Step 12: Workforce, Attendance & Factory Payroll

Manage personnel, daily attendance, piece-rate production output, and monthly salary slips.

### 12.1 Adding Employees
1. Go to **Workforce & HR** ➔ **Employees**.
2. Click **+ Add Employee**.
3. Enter personal details, Department (e.g. *Production Floor*), Designation (e.g. *Machine Operator*), and salary structure (Fixed Monthly or Piece-Rate).

### 12.2 Daily Attendance & Salary Advances
- **Attendance**: Clock workers in/out via web interface, barcode badge scan, or biometric sync.
- **Salary Advance**: When an employee requests an emergency advance, record it under **Advances & Loans**. The system automatically deducts it from their next payslip.

### 12.3 Running Monthly Payroll
1. Go to **Payroll** ➔ Click **Generate Monthly Payroll**.
2. Select Month and Year.
3. The system automatically computes:
   $$\text{Gross Salary} + \text{Piece-rate Production Bonuses} - \text{Absences} - \text{Advance Deductions} = \text{Net Payable}$$
4. Review figures, click **Approve Payroll**, and print individual payslips with one click.

---

## Step 13: Online Storefront & E-Commerce CMS

SliceMart features a built-in public e-commerce storefront linked directly to your factory inventory.

### 13.1 Enabling Products on the Storefront
1. In **Product Catalog**, open any finished good.
2. Toggle **Show in Storefront** to ON.
3. Add high-resolution images, rich descriptions, and promotional badge (e.g. *New*, *Best Seller*).

### 13.2 Visual Page Builder
1. Navigate to **Online Store CMS** ➔ **Page Builder**.
2. Customize your Homepage:
   - Hero banner with CTA buttons.
   - Featured categories and best-selling product carousels.
   - Flash sale countdown timers.
3. Click **Publish Changes**. The public storefront updates instantly.

### 13.3 Customer Orders
- Customers browse products, add to cart, and checkout with online payment (SSLCommerz, bKash, Card) or Cash on Delivery.
- Orders appear immediately in your **Sales & POS** module with status `Storefront Web Order`.
- Customers can track their order status live at `/tracking` using their Order ID or phone number.

---

## Quick Reference: Everyday Keyboard Shortcuts & Tips

| Shortcut | Action | Where It Works |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Universal Search (Products, Orders, Modules) | Everywhere |
| `F1` | Open POS Help / Keymap | POS Terminal |
| `F2` | Quick Search Product in POS | POS Terminal |
| `F4` | Switch Customer / Add Walk-in | POS Terminal |
| `F8` | Apply Order Discount | POS Terminal |
| `F12` | Instant Checkout / Payment | POS Terminal |
| `Escape` | Close Modal / Exit Kiosk View | Everywhere |

### Pro-Tips for Beginners:
- 💡 **Use Global Search (`Ctrl+K`)**: Instead of hunting through navigation menus, press `Ctrl+K` and type what you need (e.g. `PO-1002`, `Flour`, `POS`, `RedX`).
- 💡 **Check the System Status Pill**: The green **OPERATIONAL** pill in the top header indicates your connection to the ERP backend is active and healthy.
- 💡 **Dark Mode**: Toggle the Moon/Sun icon in the top right to switch between Day Mode and High-Contrast Night Mode (ideal for factory floor and warehouse tablets).

---

*Congratulations! You now have a complete understanding of how data and products flow through SliceMart ERP & FMS. For technical API contracts or deep architecture details, refer to the other documents in the `docs/` folder.*
