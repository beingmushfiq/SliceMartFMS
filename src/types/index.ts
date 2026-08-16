// ─────────────────────────────────────────────────────────────
// SLICE MART FMS — Core Type Definitions
// ─────────────────────────────────────────────────────────────

// ── Shared ───────────────────────────────────────────────────

export type ID = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  isActive: boolean;
}

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'factory_manager'
  | 'production_manager'
  | 'supervisor'
  | 'store_manager'
  | 'storekeeper'
  | 'qc_officer'
  | 'sales'
  | 'purchase'
  | 'accounts'
  | 'hr'
  | 'employee';

// ── Products ──────────────────────────────────────────────────

export type ProductCategory = 'infrared_cooker' | 'infrared_stove' | 'accessory' | 'spare_part';
export type ProductType = 'finished_good' | 'raw_material' | 'semi_finished';
export type ProductStatus = 'active' | 'inactive' | 'discontinued';
export type Unit = 'pcs' | 'kg' | 'g' | 'L' | 'mL' | 'm' | 'cm' | 'set' | 'roll' | 'box' | 'pair';

export interface Product {
  id: ID;
  sku: string;
  name: string;
  model: string;
  category: ProductCategory;
  type: ProductType;
  unit: Unit;
  sellingPrice: number;
  wholesalePrice: number;
  costPrice: number;
  minStock: number;
  barcode?: string;
  description?: string;
  status: ProductStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── BOM ───────────────────────────────────────────────────────

export interface BOMItem {
  materialId: ID;
  materialName: string;
  requiredQty: number;
  unit: Unit;
  wastagePercent: number;
}

export interface BOM {
  id: ID;
  productId: ID;
  version: number;
  items: BOMItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Raw Materials ─────────────────────────────────────────────

export interface RawMaterial {
  id: ID;
  sku: string;
  name: string;
  unit: Unit;
  category: string;
  costPrice: number;
  sellingPrice?: number;
  minStock: number;
  barcode?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ── Warehouses ────────────────────────────────────────────────

export type WarehouseId = 'WH-A' | 'WH-B';

export interface Warehouse {
  id: WarehouseId;
  name: string;
  shortName: string;
  description: string;
  location: string;
  isActive: boolean;
}

// ── Inventory ─────────────────────────────────────────────────

export interface InventoryItem {
  id: ID;
  itemId: ID;            // product or material ID
  itemType: 'product' | 'material';
  itemName: string;
  warehouseId: WarehouseId;
  qty: number;
  unit: Unit;
  avgCost: number;
  totalValue: number;
  minStock: number;
  updatedAt: string;
}

export type MovementType =
  | 'purchase'
  | 'production_consumption'
  | 'production_output'
  | 'sale'
  | 'return'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment'
  | 'damage'
  | 'wastage';

export interface StockMovement {
  id: ID;
  itemId: ID;
  itemType: 'product' | 'material';
  itemName: string;
  warehouseId: WarehouseId;
  movementType: MovementType;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  unit: Unit;
  date?: string;
  referenceId?: ID;
  referenceType?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  performedBy?: string;
  createdAt: string;
}

export interface WarehouseTransfer {
  id: ID;
  transferNo: string;
  fromWarehouseId: WarehouseId;
  toWarehouseId: WarehouseId;
  items: TransferItem[];
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferItem {
  itemId: ID;
  itemType: 'product' | 'material';
  itemName: string;
  qty: number;
  unit: Unit;
}

// ── Employees ─────────────────────────────────────────────────

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';
export type ShiftName = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Employee {
  id: ID;
  employeeId: string;
  name: string;
  phone: string;
  nid?: string;
  designation: string;
  department: string;
  shift: ShiftName;
  joinDate: string;
  salary: number;
  status: EmployeeStatus;
  address?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: ID;
  employeeId: ID;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  notes?: string;
}

// ── Production ────────────────────────────────────────────────

export type ProductionOrderStatus =
  | 'draft'
  | 'planned'
  | 'ready'
  | 'in_production'
  | 'qc_pending'
  | 'completed'
  | 'cancelled';

export interface ProductionOrder {
  id: ID;
  orderNo: string;
  productId: ID;
  productName: string;
  model: string;
  targetQty: number;
  producedQty: number;
  passedQty: number;
  failedQty: number;
  reworkQty: number;
  status: ProductionOrderStatus;
  assignedEmployees: ID[];
  productionDate: string;
  expectedCompletion: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionEntry {
  id: ID;
  productionOrderId: ID;
  orderNo: string;
  productId: ID;
  productName: string;
  employeeId: ID;
  employeeName: string;
  date: string;
  targetQty: number;
  producedQty: number;
  defectiveQty: number;
  reworkQty: number;
  shift: ShiftName;
  notes?: string;
  createdAt: string;
}

export interface ProductionPerformance {
  employeeId: ID;
  employeeName: string;
  date: string;
  target: number;
  produced: number;
  defective: number;
  rework: number;
  achievementPct: number;
}

// ── QC ────────────────────────────────────────────────────────

export type QCStatus = 'pending' | 'passed' | 'failed' | 'rework' | 'retested';

export interface QCRecord {
  id: ID;
  qcNo: string;
  productionOrderId?: ID;
  orderNo?: string;
  productId?: ID;
  productName: string;
  batchNo?: string;
  inspectionDate?: string;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  reworkQty: number;
  status: QCStatus;
  defects?: { code: string; description: string; qty: number }[];
  inspectionNotes?: string;
  failureReason?: string;
  remarks?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  reworkCompletedAt?: string;
  retestStatus?: 'passed' | 'failed';
  createdAt: string;
}

// ── Suppliers ─────────────────────────────────────────────────

export interface Supplier {
  id: ID;
  supplierNo: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  paymentTerms: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive';
  rating?: number;
  suppliedMaterials?: string[];
  leadTimeDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Purchase ──────────────────────────────────────────────────

export type PurchaseStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type ExpenseCategory =
  | 'Utilities'
  | 'Salaries'
  | 'Transport'
  | 'Maintenance'
  | 'Raw Material Purchase'
  | 'Office & Admin'
  | 'Marketing'
  | 'Rent'
  | 'Insurance'
  | 'Miscellaneous';

export interface PurchaseOrder {
  id: ID;
  poNo?: string;
  orderNo?: string;
  supplierId: ID;
  supplierName: string;
  items: PurchaseItem[];
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paid?: number;
  due?: number;
  warehouseId?: WarehouseId;
  paymentMethod?: PaymentMethodType;
  accountId?: ID;
  notes?: string;
  orderDate?: string;
  expectedDate?: string;
  expectedDelivery?: string;
  receivedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  id?: ID;
  itemId?: ID;
  itemName?: string;
  itemType?: 'material' | 'product' | 'service';
  materialId?: ID;
  materialName?: string;
  qty: number;
  unit: Unit;
  unitCost?: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  total?: number;
  receivedQty?: number;
}

// ── Customers ─────────────────────────────────────────────────

export type CustomerType = 'b2b' | 'b2c';

export interface Customer {
  id: ID;
  customerNo: string;
  name: string;
  type: CustomerType;
  phone: string;
  email?: string;
  address: string;
  area: string;
  creditLimit: number;
  balance: number;
  totalPurchases: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Sales ─────────────────────────────────────────────────────

export type SaleType = 'b2b' | 'b2c' | 'raw_material';
export type SaleStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export interface Sale {
  id: ID;
  invoiceNo: string;
  customerId?: ID;
  customerName: string;
  customerPhone?: string;
  saleType: SaleType;
  items: SaleItem[];
  status?: SaleStatus;
  deliveryStatus?: string;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  tax?: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod?: PaymentMethodType;
  accountId?: ID;
  warehouseId?: WarehouseId;
  notes?: string;
  saleDate?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  id?: ID;
  itemId?: ID;
  productId?: ID;
  itemType?: 'product' | 'material';
  itemName?: string;
  productName?: string;
  model?: string;
  qty: number;
  unit?: Unit;
  unitPrice: number;
  discount?: number;
  subtotal?: number;
  total?: number;
}

// ── Delivery ──────────────────────────────────────────────────

export type DeliveryStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface Delivery {
  id: ID;
  deliveryNo: string;
  saleId: ID;
  invoiceNo: string;
  customerId?: ID;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  assignedTo?: string;
  scheduledDate?: string;
  deliveredAt?: string;
  notes?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryItem {
  itemId: ID;
  itemName: string;
  qty: number;
  unit: Unit;
}

// ── Finance ───────────────────────────────────────────────────

export type PaymentMethodType =
  | 'cash'
  | 'bank_transfer'
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'card'
  | 'credit'
  | 'other';

export interface Account {
  id: ID;
  name: string;
  type: 'cash' | 'bank' | 'mobile_banking' | 'other';
  accountNo?: string;
  bankName?: string;
  balance: number;
  currency?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: ID;
  transactionNo?: string;
  txnNo?: string;
  accountId: ID;
  accountName?: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  referenceId?: ID;
  referenceType?: string;
  paymentMethod?: PaymentMethodType;
  date: string;
  createdBy?: string;
  performedBy?: string;
  createdAt: string;
  balanceBefore?: number;
  balanceAfter?: number;
  reference?: string;
}

export interface Expense {
  id: ID;
  expenseNo: string;
  category: string;
  description?: string;
  amount: number;
  accountId: ID;
  accountName?: string;
  paymentMode?: string;
  paymentMethod?: PaymentMethodType;
  date: string;
  status?: string;
  approvedBy?: string;
  referenceNo?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────

export type NotificationType =
  | 'low_stock'
  | 'production_delay'
  | 'qc_failure'
  | 'rework_required'
  | 'pending_delivery'
  | 'payment_due'
  | 'purchase_required'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: ID;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  relatedModule?: string;
  relatedId?: ID;
  createdAt: string;
}

// ── Audit Log ─────────────────────────────────────────────────

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'cancel' | 'adjustment' | 'payment';

export interface AuditLog {
  id: ID;
  userId: ID;
  userName: string;
  action: AuditAction;
  module: string;
  entityId: ID;
  entityType: string;
  description: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ── Attendance ────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night';

export interface AttendanceRecord {
  id: ID;
  employeeId: ID;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  shift: ShiftType;
  overtimeHours?: number;
  notes?: string;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardStats {
  production: {
    todayTarget: number;
    todayProduced: number;
    achievementPct: number;
    pendingOrders: number;
    qcPending: number;
    reworkQty: number;
  };
  inventory: {
    totalRawMaterials: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalFinishedGoods: number;
  };
  sales: {
    todaySales: number;
    monthlySales: number;
    b2bSales: number;
    b2cSales: number;
    pendingDeliveries: number;
    outstandingAmount: number;
  };
}
