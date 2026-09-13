export interface TutorialPipelineNode {
  label: string;
  desc: string;
  status: 'start' | 'process' | 'check' | 'end';
}

export interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  category: 'admin' | 'factory' | 'inventory' | 'sales' | 'finance';
  estimatedMinutes: number;
  targetRoute: string;
  routeLabel: string;
  overview: string;
  keyTakeaways: string[];
  pipeline: TutorialPipelineNode[];
  interactiveType:
    | 'overview'
    | 'role_cockpit'
    | 'bom_calculator'
    | 'grn_receiving'
    | 'stock_transfer'
    | 'batch_runner'
    | 'qc_inspector'
    | 'pos_checkout'
    | 'courier_dispatch'
    | 'accounting_flow'
    | 'payroll_calculator'
    | 'storefront_preview';
  tips: string[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Logging In & Understanding Your Role Cockpit',
    subtitle: 'Master the dynamic role switcher, live operational telemetry, and navigation',
    category: 'admin',
    estimatedMinutes: 2,
    targetRoute: '/dashboard',
    routeLabel: 'Open Executive Cockpit',
    overview:
      'The ERP platform adapts to your role. As a Super Administrator or Manager, you can toggle between 9 specialized operational perspectives (Executive, Production, Inventory, QC, Sales, Finance, HR, Procurement, Logistics) in real time without signing out.',
    keyTakeaways: [
      'The top role card displays your active identity and real-time live sync pulse.',
      'Clicking any perspective tab instantly swaps metrics, recent items, and priority actions.',
      'Use Ctrl + K anywhere in the platform to jump to any invoice, product, batch, or setting in seconds.',
    ],
    pipeline: [
      { label: 'Login Authentication', desc: 'JWT Session Verified', status: 'start' },
      { label: 'Role Resolution', desc: 'Permissions Evaluated', status: 'process' },
      { label: 'Cockpit View Loaded', desc: 'Live Telemetry Active', status: 'end' },
    ],
    interactiveType: 'role_cockpit',
    tips: [
      'Seeded test demo admin login: admin@slicemart.test / Password123!',
      'Press Ctrl+K at any moment to search across the entire ERP.',
    ],
  },
  {
    id: 2,
    title: 'Initial Setup & Master Configuration',
    subtitle: 'Configure company profile, facilities, currencies, and tax rules',
    category: 'admin',
    estimatedMinutes: 3,
    targetRoute: '/settings',
    routeLabel: 'Open Settings Center',
    overview:
      'Before processing live transactions, the system requires baseline parameters: legal tax identity, primary raw material and finished goods warehouses, production lines, and accounting currencies.',
    keyTakeaways: [
      'Your uploaded company logo automatically appears on invoices, receipts, and challans.',
      'Configure operating branches and factory line capacities.',
      'Ensure the default currency (e.g. ৳ BDT, $ USD) and tax rates are properly set.',
    ],
    pipeline: [
      { label: 'Company Profile', desc: 'Legal Name & Tax ID', status: 'start' },
      { label: 'Warehouses & Lines', desc: 'Physical Storage Hubs', status: 'process' },
      { label: 'Currencies & COA', desc: 'Ledger Accounts Active', status: 'end' },
    ],
    interactiveType: 'overview',
    tips: [
      'The platform includes 30 settings domains grouped neatly in the Settings Center.',
      'Mobile view provides a quick grouped selector to jump between settings.',
    ],
  },
  {
    id: 3,
    title: 'Defining Products, Units & Bills of Materials (BOM)',
    subtitle: 'Set up raw materials, finished products, and manufacturing recipes',
    category: 'factory',
    estimatedMinutes: 3,
    targetRoute: '/catalogue',
    routeLabel: 'Open Product Catalog',
    overview:
      'In manufacturing ERP, a Finished Good consists of a Recipe / Bill of Materials (BOM). When a production batch runs, the system automatically calculates and deducts raw materials based on this BOM formula.',
    keyTakeaways: [
      'Raw Materials are items purchased from suppliers (e.g. Flour, Sugar, Foil packaging).',
      'Finished Goods are items manufactured and sold to clients or consumers.',
      'The BOM Recipe defines exact ingredient proportions required per unit produced.',
    ],
    pipeline: [
      { label: 'Create Raw Material', desc: 'RM SKU + Unit (kg/pcs)', status: 'start' },
      { label: 'Create Finished Good', desc: 'FG SKU + Sales Price', status: 'process' },
      { label: 'Link BOM Recipe', desc: 'Ingredients Ratio Defined', status: 'end' },
    ],
    interactiveType: 'bom_calculator',
    tips: [
      'Always specify minimum stock alert thresholds on raw materials to get automated low-stock warnings.',
      'You can print barcode shelf labels directly from the product catalog.',
    ],
  },
  {
    id: 4,
    title: 'Procurement & Purchasing Raw Materials',
    subtitle: 'Create purchase orders, receive goods (GRN), and update stock balances',
    category: 'inventory',
    estimatedMinutes: 3,
    targetRoute: '/purchasing',
    routeLabel: 'Open Procurement Hub',
    overview:
      'Stock never appears by magic. When raw materials run low, the purchasing team generates a Purchase Order (PO) to a supplier. When the goods arrive, confirming a Goods Received Note (GRN) automatically logs inward stock into the warehouse ledger.',
    keyTakeaways: [
      'PO tracks vendor contract terms, agreed unit pricing, and expected delivery date.',
      'Receiving via GRN immediately increases physical stock and creates an Accounts Payable bill.',
      'Partial deliveries and damaged goods can be recorded with debit notes / returns.',
    ],
    pipeline: [
      { label: 'Create Purchase PO', desc: 'Order Placed with Vendor', status: 'start' },
      { label: 'Physical Receiving', desc: 'Truck Arrives at Dock', status: 'process' },
      { label: 'Confirm GRN', desc: 'Stock Ledger Credited', status: 'end' },
    ],
    interactiveType: 'grn_receiving',
    tips: [
      'Use the PO approval workflow to ensure multi-tier purchase authorization before orders are dispatched to suppliers.',
    ],
  },
  {
    id: 5,
    title: 'Warehouse & Stock Inventory Management',
    subtitle: 'Immutable movement ledger, bin tracking, and inter-warehouse transfers',
    category: 'inventory',
    estimatedMinutes: 3,
    targetRoute: '/inventory',
    routeLabel: 'Open Warehouse Ledger',
    overview:
      'The platform operates on an append-only stock movement ledger. Every single quantity change is backed by an immutable transaction record (Purchase GRN, Sales Delivery, Production Issue, Transfer, or Physical Audit).',
    keyTakeaways: [
      'Stock states: Available (ready to use), Reserved (locked for orders), In-Transit (on transfer), Quarantine (in QC).',
      'Inter-warehouse transfers use dual-stage dispatch and receive confirmation.',
      'Cycle counts and physical audits generate automated variance write-offs with audit logs.',
    ],
    pipeline: [
      { label: 'Transfer Request', desc: 'Origin Warehouse Dispatch', status: 'start' },
      { label: 'In-Transit State', desc: 'Locked Between Hubs', status: 'process' },
      { label: 'Destination Receipt', desc: 'Stock Added to Target', status: 'end' },
    ],
    interactiveType: 'stock_transfer',
    tips: [
      'Click any product in the inventory ledger to see its full audit trail showing exact user timestamps and reference documents.',
    ],
  },
  {
    id: 6,
    title: 'Factory Production & Manufacturing (FMS)',
    subtitle: 'Batch planning, raw material issues, machine line logs, and kiosk mode',
    category: 'factory',
    estimatedMinutes: 4,
    targetRoute: '/production',
    routeLabel: 'Open Production Floor',
    overview:
      'The manufacturing pipeline transforms raw materials into finished, packaged goods. Operators create a batch, issue ingredients from warehouse storage, and track live progress using the touch-friendly Factory Floor Kiosk.',
    keyTakeaways: [
      'Independent logging: Warehouse issue, machine floor input, and worker output are logged separately.',
      'Zero Phantom Variance: Discrepancy metrics remain neutral until the full batch context is completed.',
      'Touch-friendly Kiosk mode is optimized for rugged factory floor tablet displays.',
    ],
    pipeline: [
      { label: 'Schedule Batch', desc: 'Target Output Defined', status: 'start' },
      { label: 'Issue Materials', desc: 'Ingredients Moved to WIP', status: 'process' },
      { label: 'Complete Run', desc: 'Forwarded to QC Inspection', status: 'end' },
    ],
    interactiveType: 'batch_runner',
    tips: [
      'Operators can hit Escape or click Exit in Kiosk mode to return to standard management view.',
    ],
  },
  {
    id: 7,
    title: 'Quality Assurance & Inspections (QC)',
    subtitle: 'Parameter testing checklists, pass/fail thresholds, rework, and scrap',
    category: 'factory',
    estimatedMinutes: 3,
    targetRoute: '/qc',
    routeLabel: 'Open Quality Control',
    overview:
      'Every completed factory batch undergoes QA inspection before entering sellable inventory. QA inspectors grade physical items against strict tolerance parameters.',
    keyTakeaways: [
      'Passed units immediately enter the Finished Goods warehouse ready for sale.',
      'Rework units are routed to a secondary rectification run.',
      'Scrap/Wastage units are written off to loss ledgers with mandatory reason codes.',
    ],
    pipeline: [
      { label: 'Batch Intake', desc: 'Pending Inspection Queue', status: 'start' },
      { label: 'Parameter Tests', desc: 'Weight, Visual, Integrity', status: 'process' },
      { label: 'QA Certificate', desc: 'Passed to Finished Stock', status: 'end' },
    ],
    interactiveType: 'qc_inspector',
    tips: [
      'Inspectors can generate printable Certificates of Analysis (COA) directly for commercial clients.',
    ],
  },
  {
    id: 8,
    title: 'Omnichannel Sales Orders & B2B Invoicing',
    subtitle: 'Customer CRM, quotations, tax invoices, and stock reservations',
    category: 'sales',
    estimatedMinutes: 3,
    targetRoute: '/sales',
    routeLabel: 'Open Sales & CRM',
    overview:
      'From corporate B2B wholesale orders to dealer distribution, the system tracks client leads, generates formal quotations, reserves stock automatically, and prints professional tax invoices with QR codes.',
    keyTakeaways: [
      'Confirming a Sales Order immediately marks stock as "Reserved" to prevent overselling.',
      'Generate Invoices with flexible payment terms (Immediate, Net 15, Net 30, Partial).',
      'Print Delivery Challans and Invoices with QR code verification and brand logos.',
    ],
    pipeline: [
      { label: 'Sales Order', desc: 'Stock Reserved Automatically', status: 'start' },
      { label: 'Tax Invoice', desc: 'Accounts Receivable Logged', status: 'process' },
      { label: 'Dispatch Challan', desc: 'Handover to Logistics', status: 'end' },
    ],
    interactiveType: 'overview',
    tips: [
      'Use the CRM Leads tab to track prospective deals through Qualified, Negotiation, and Won stages.',
    ],
  },
  {
    id: 9,
    title: 'High-Speed POS Counter Terminal',
    subtitle: 'Barcode scanning, split payments, thermal receipts, and shift reconciliation',
    category: 'sales',
    estimatedMinutes: 3,
    targetRoute: '/pos',
    routeLabel: 'Launch POS Terminal',
    overview:
      'Engineered for retail counters, bakeries, and retail storefronts. Features fast keyboard-driven checkout, barcode scanning, split payments (Cash, Card, MFS bKash/Nagad), offline transaction queueing, and shift closing.',
    keyTakeaways: [
      'Cashiers open a shift with an opening float and close with a blind count cash reconciliation.',
      'Scan barcodes or use quick-touch visual tiles; press F12 for instant checkout.',
      'Offline Resilience: Continues operating even during internet dropouts and syncs automatically.',
    ],
    pipeline: [
      { label: 'Open Shift Float', desc: 'Opening Drawer Verified', status: 'start' },
      { label: 'Scan & Checkout', desc: 'Instant Receipt (80mm)', status: 'process' },
      { label: 'Blind Count Close', desc: 'Cash Variance Reconciled', status: 'end' },
    ],
    interactiveType: 'pos_checkout',
    tips: [
      'Press F1 inside the POS terminal to view the full keyboard shortcut keymap.',
      'Supports standard 80mm and 58mm thermal receipt printers without page dialog delays.',
    ],
  },
  {
    id: 10,
    title: 'Logistics, Delivery & Courier Dispatch',
    subtitle: 'Integrated couriers (RedX, Steadfast, Pathao), rider run sheets, and COD reconciliation',
    category: 'sales',
    estimatedMinutes: 3,
    targetRoute: '/delivery',
    routeLabel: 'Open Delivery Hub',
    overview:
      'Fulfill orders via your internal fleet or third-party courier APIs. Group deliveries onto Rider Run Sheets, book automated courier consignments, and reconcile collected Cash on Delivery (COD) cash directly into your bank account.',
    keyTakeaways: [
      'One-click consignment booking with automated parcel weight and COD collection data.',
      'Rider Run Sheets group stops by route with printable dispatch challans.',
      'COD Cash Reconciliation matches courier remittance statements against invoice balances.',
    ],
    pipeline: [
      { label: 'Book Consignment', desc: 'API Transmits Parcel Data', status: 'start' },
      { label: 'In-Transit Tracking', desc: 'Webhooks Update Status', status: 'process' },
      { label: 'COD Cash Settled', desc: 'Funds Deposited into Bank', status: 'end' },
    ],
    interactiveType: 'courier_dispatch',
    tips: [
      'Configure webhook URLs in Settings > Logistics to receive live parcel status updates from Steadfast, Pathao, and RedX.',
    ],
  },
  {
    id: 11,
    title: 'Finance, General Ledger & Operational Expenses',
    subtitle: 'Automated double-entry journals, chart of accounts, and AR aging',
    category: 'finance',
    estimatedMinutes: 3,
    targetRoute: '/finance',
    routeLabel: 'Open Finance & Accounts',
    overview:
      'A continuous double-entry accounting engine runs in the background. Sales, procurement receipts, and inventory dispatches automatically generate balanced debit and credit journal entries.',
    keyTakeaways: [
      'Automatic COGS and revenue posting removes manual bookkeeping burden.',
      'Record operational expenses (rent, utilities, machine repairs) with receipt attachments.',
      'Monitor Accounts Receivable (AR) Aging risk buckets: 0-30d, 31-60d, 61-90d, 90d+ critical.',
    ],
    pipeline: [
      { label: 'Business Event', desc: 'Sale, PO, or Expense', status: 'start' },
      { label: 'Double-Entry Journal', desc: 'Balanced Debit & Credit', status: 'process' },
      { label: 'Financial Statements', desc: 'Real-Time P&L & Balance Sheet', status: 'end' },
    ],
    interactiveType: 'accounting_flow',
    tips: [
      'Export financial ledgers and trial balances to Excel or PDF for auditors with one click.',
    ],
  },
  {
    id: 12,
    title: 'Workforce, Attendance & Factory Payroll',
    subtitle: 'Employee profiles, daily attendance, piece-rate incentives, and payslips',
    category: 'admin',
    estimatedMinutes: 3,
    targetRoute: '/hr',
    routeLabel: 'Open Workforce & HR',
    overview:
      'Manage factory floor and office personnel. Track daily attendance, log piece-rate production bonuses, manage salary advances, and generate monthly payslips with statutory deductions.',
    keyTakeaways: [
      'Supports both fixed monthly salaried staff and factory piece-rate workers.',
      'Emergency salary advances are automatically tracked and deducted from the next payroll run.',
      'Immutable payslips lock source production and attendance records upon manager approval.',
    ],
    pipeline: [
      { label: 'Daily Attendance', desc: 'Clock-In / Shift Logs', status: 'start' },
      { label: 'Output Incentives', desc: 'Piece-Rate Bonus Added', status: 'process' },
      { label: 'Payroll Disbursement', desc: 'Immutable Payslip Issued', status: 'end' },
    ],
    interactiveType: 'payroll_calculator',
    tips: [
      'Workers can scan their barcode employee badge on factory floor kiosks to log attendance.',
    ],
  },
  {
    id: 13,
    title: 'Online Storefront & E-Commerce CMS',
    subtitle: 'Public e-commerce storefront, visual page builder, and live customer order tracking',
    category: 'sales',
    estimatedMinutes: 3,
    targetRoute: '/storefront',
    routeLabel: 'Open Storefront CMS',
    overview:
      'The platform includes a public-facing e-commerce storefront connected directly to your warehouse stock. Customize banners, flash sales, and carousels with the visual page builder while customers browse and track orders live.',
    keyTakeaways: [
      'Toggle "Show in Storefront" on any product to publish it online with rich photos and badges.',
      'Visual Page Builder allows drag-and-drop customization of homepage hero sections and banners.',
      'Online web orders appear immediately in your Sales pipeline for packaging and fulfillment.',
    ],
    pipeline: [
      { label: 'Catalog Published', desc: 'Live On E-Commerce Web', status: 'start' },
      { label: 'Customer Order', desc: 'Online Payment / COD Cart', status: 'process' },
      { label: 'Live Order Tracking', desc: 'Customer Tracks at /track', status: 'end' },
    ],
    interactiveType: 'storefront_preview',
    tips: [
      'Customers can track their delivery status live at /track using their phone number or Order ID without needing to log in.',
    ],
  },
];
