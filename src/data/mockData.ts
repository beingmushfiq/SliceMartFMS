// ─────────────────────────────────────────────────────────────
// MOCK DATA — Slice Mart Factory Management System
// Realistic Bangladesh / manufacturing data
// ─────────────────────────────────────────────────────────────

import type {
  Product, RawMaterial, Employee, Customer, Supplier,
  Warehouse, InventoryItem, StockMovement, ProductionOrder,
  ProductionEntry, QCRecord, PurchaseOrder, Sale, Delivery,
  Account, Transaction, Expense, Notification, AuditLog,
  BOM, WarehouseTransfer,
} from '../types';

// ── Warehouses ────────────────────────────────────────────────
export const WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-A',
    name: 'Warehouse A — Main Store',
    shortName: 'WH-A',
    description: 'Primary raw materials and components storage',
    location: 'Factory Floor, Building 1',
    isActive: true,
  },
  {
    id: 'WH-B',
    name: 'Warehouse B — Finished Goods',
    shortName: 'WH-B',
    description: 'Finished product storage and dispatch area',
    location: 'Factory Floor, Building 2',
    isActive: true,
  },
];

// ── Raw Materials ─────────────────────────────────────────────
export const RAW_MATERIALS: RawMaterial[] = [
  { id: 'RM-001', sku: 'RM-HE-001', name: 'Infrared Heating Element (2200W)', unit: 'pcs', category: 'Electrical', costPrice: 320, sellingPrice: 480, minStock: 200, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-002', sku: 'RM-GT-001', name: 'Toughened Glass Top (30cm)', unit: 'pcs', category: 'Glass & Ceramic', costPrice: 185, sellingPrice: 300, minStock: 150, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-003', sku: 'RM-BS-001', name: 'Steel Body Panel (Powder Coated)', unit: 'pcs', category: 'Metal', costPrice: 220, minStock: 200, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-004', sku: 'RM-KN-001', name: 'Temperature Control Knob', unit: 'pcs', category: 'Mechanical', costPrice: 35, minStock: 500, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-005', sku: 'RM-SW-001', name: 'Power Switch (15A)', unit: 'pcs', category: 'Electrical', costPrice: 45, minStock: 400, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-006', sku: 'RM-EW-001', name: 'Electrical Wire Harness', unit: 'set', category: 'Electrical', costPrice: 68, minStock: 300, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-007', sku: 'RM-PC-001', name: 'PCB Control Board', unit: 'pcs', category: 'Electronics', costPrice: 145, minStock: 200, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-008', sku: 'RM-RG-001', name: 'Heat Regulator (Bi-metal)', unit: 'pcs', category: 'Mechanical', costPrice: 92, minStock: 200, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-009', sku: 'RM-SV-001', name: 'Safety Thermal Cutoff', unit: 'pcs', category: 'Safety', costPrice: 55, minStock: 300, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-010', sku: 'RM-BX-001', name: 'Packaging Box (Corrugated)', unit: 'pcs', category: 'Packaging', costPrice: 28, minStock: 500, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-011', sku: 'RM-MN-001', name: 'User Manual (Printed)', unit: 'pcs', category: 'Packaging', costPrice: 8, minStock: 500, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-012', sku: 'RM-LG-001', name: 'Rubber Leg / Foot Pad (set of 4)', unit: 'set', category: 'Mechanical', costPrice: 18, minStock: 400, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-013', sku: 'RM-IS-001', name: 'Thermal Insulation Sheet', unit: 'pcs', category: 'Insulation', costPrice: 42, minStock: 200, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-014', sku: 'RM-PS-001', name: 'Power Cord (3-pin, 1.5m)', unit: 'pcs', category: 'Electrical', costPrice: 52, minStock: 300, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'RM-015', sku: 'RM-SC-001', name: 'Screw Set (M4 Stainless)', unit: 'set', category: 'Hardware', costPrice: 12, minStock: 1000, status: 'active', createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
];

// ── Products (Finished Goods) ─────────────────────────────────
export const PRODUCTS: Product[] = [
  { id: 'PRD-001', sku: 'IR-C-101', name: 'Infrared Cooker IR-101', model: 'IR-101', category: 'infrared_cooker', type: 'finished_good', unit: 'pcs', sellingPrice: 1850, wholesalePrice: 1650, costPrice: 1180, minStock: 50, barcode: '8801234567001', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-002', sku: 'IR-C-102', name: 'Infrared Cooker IR-102 (Premium)', model: 'IR-102', category: 'infrared_cooker', type: 'finished_good', unit: 'pcs', sellingPrice: 2250, wholesalePrice: 1980, costPrice: 1420, minStock: 40, barcode: '8801234567002', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-003', sku: 'IR-C-103', name: 'Infrared Cooker IR-103 (Double Burner)', model: 'IR-103', category: 'infrared_cooker', type: 'finished_good', unit: 'pcs', sellingPrice: 3200, wholesalePrice: 2850, costPrice: 2100, minStock: 30, barcode: '8801234567003', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-004', sku: 'IR-S-201', name: 'Infrared Stove IS-201', model: 'IS-201', category: 'infrared_stove', type: 'finished_good', unit: 'pcs', sellingPrice: 2100, wholesalePrice: 1850, costPrice: 1300, minStock: 40, barcode: '8801234567011', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-005', sku: 'IR-S-202', name: 'Infrared Stove IS-202 (Glass Top)', model: 'IS-202', category: 'infrared_stove', type: 'finished_good', unit: 'pcs', sellingPrice: 2650, wholesalePrice: 2350, costPrice: 1680, minStock: 30, barcode: '8801234567012', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-006', sku: 'IR-S-203', name: 'Infrared Stove IS-203 (Touch)', model: 'IS-203', category: 'infrared_stove', type: 'finished_good', unit: 'pcs', sellingPrice: 3450, wholesalePrice: 3100, costPrice: 2350, minStock: 20, barcode: '8801234567013', status: 'active', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-007', sku: 'IR-C-104', name: 'Infrared Cooker IR-104 (Economy)', model: 'IR-104', category: 'infrared_cooker', type: 'finished_good', unit: 'pcs', sellingPrice: 1450, wholesalePrice: 1250, costPrice: 950, minStock: 60, barcode: '8801234567004', status: 'active', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'PRD-008', sku: 'IR-C-105', name: 'Infrared Cooker IR-105 (Digital)', model: 'IR-105', category: 'infrared_cooker', type: 'finished_good', unit: 'pcs', sellingPrice: 2800, wholesalePrice: 2450, costPrice: 1850, minStock: 25, barcode: '8801234567005', status: 'active', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
];

// ── BOMs ──────────────────────────────────────────────────────
export const BOMS: BOM[] = [
  {
    id: 'BOM-001', productId: 'PRD-001', version: 2,
    items: [
      { materialId: 'RM-001', materialName: 'Infrared Heating Element (2200W)', requiredQty: 1, unit: 'pcs', wastagePercent: 2 },
      { materialId: 'RM-002', materialName: 'Toughened Glass Top (30cm)', requiredQty: 1, unit: 'pcs', wastagePercent: 3 },
      { materialId: 'RM-003', materialName: 'Steel Body Panel (Powder Coated)', requiredQty: 1, unit: 'pcs', wastagePercent: 1 },
      { materialId: 'RM-004', materialName: 'Temperature Control Knob', requiredQty: 1, unit: 'pcs', wastagePercent: 0 },
      { materialId: 'RM-005', materialName: 'Power Switch (15A)', requiredQty: 1, unit: 'pcs', wastagePercent: 1 },
      { materialId: 'RM-006', materialName: 'Electrical Wire Harness', requiredQty: 1, unit: 'set', wastagePercent: 2 },
      { materialId: 'RM-007', materialName: 'PCB Control Board', requiredQty: 1, unit: 'pcs', wastagePercent: 1 },
      { materialId: 'RM-008', materialName: 'Heat Regulator (Bi-metal)', requiredQty: 1, unit: 'pcs', wastagePercent: 1 },
      { materialId: 'RM-009', materialName: 'Safety Thermal Cutoff', requiredQty: 1, unit: 'pcs', wastagePercent: 0 },
      { materialId: 'RM-010', materialName: 'Packaging Box (Corrugated)', requiredQty: 1, unit: 'pcs', wastagePercent: 0 },
      { materialId: 'RM-011', materialName: 'User Manual (Printed)', requiredQty: 1, unit: 'pcs', wastagePercent: 0 },
      { materialId: 'RM-012', materialName: 'Rubber Leg / Foot Pad (set of 4)', requiredQty: 1, unit: 'set', wastagePercent: 0 },
      { materialId: 'RM-014', materialName: 'Power Cord (3-pin, 1.5m)', requiredQty: 1, unit: 'pcs', wastagePercent: 0 },
      { materialId: 'RM-015', materialName: 'Screw Set (M4 Stainless)', requiredQty: 1, unit: 'set', wastagePercent: 5 },
    ],
    createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-06-15T08:00:00Z',
  },
];

// ── Employees ─────────────────────────────────────────────────
export const EMPLOYEES: Employee[] = [
  { id: 'EMP-001', employeeId: 'SM-001', name: 'Md. Abdur Rahim', phone: '01711-234567', designation: 'Senior Production Worker', department: 'Production', shift: 'morning', joinDate: '2024-03-15', salary: 18000, status: 'active', address: 'Mirpur-12, Dhaka', createdAt: '2024-03-15T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-002', employeeId: 'SM-002', name: 'Md. Karim Hossain', phone: '01812-345678', designation: 'Production Worker', department: 'Production', shift: 'morning', joinDate: '2024-05-01', salary: 15000, status: 'active', address: 'Pallabi, Dhaka', createdAt: '2024-05-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-003', employeeId: 'SM-003', name: 'Meshkat Afrose', phone: '01912-456789', designation: 'QC Inspector', department: 'Quality Control', shift: 'morning', joinDate: '2024-06-10', salary: 20000, status: 'active', address: 'Uttara, Dhaka', createdAt: '2024-06-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-004', employeeId: 'SM-004', name: 'Rima Begum', phone: '01611-567890', designation: 'Assembly Worker', department: 'Production', shift: 'morning', joinDate: '2025-01-15', salary: 14000, status: 'active', address: 'Mirpur-10, Dhaka', createdAt: '2025-01-15T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-005', employeeId: 'SM-005', name: 'Mushfiqur Rahman', phone: '01511-678901', designation: 'Production Supervisor', department: 'Production', shift: 'morning', joinDate: '2023-11-01', salary: 25000, status: 'active', address: 'Gazipur Sadar', createdAt: '2023-11-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-006', employeeId: 'SM-006', name: 'Nasrin Akter', phone: '01311-789012', designation: 'Packing Worker', department: 'Production', shift: 'afternoon', joinDate: '2025-03-20', salary: 13000, status: 'active', address: 'Dhanmondi, Dhaka', createdAt: '2025-03-20T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-007', employeeId: 'SM-007', name: 'Rakib Hassan', phone: '01411-890123', designation: 'Production Worker', department: 'Production', shift: 'afternoon', joinDate: '2025-06-01', salary: 14500, status: 'active', address: 'Tongi, Gazipur', createdAt: '2025-06-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-008', employeeId: 'SM-008', name: 'Rasel Ahmed', phone: '01711-901234', designation: 'Storekeeper', department: 'Warehouse', shift: 'morning', joinDate: '2024-08-15', salary: 16000, status: 'active', address: 'Savar, Dhaka', createdAt: '2024-08-15T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-009', employeeId: 'SM-009', name: 'Liton Kumar Das', phone: '01811-012345', designation: 'Electrical Technician', department: 'Production', shift: 'morning', joinDate: '2024-02-10', salary: 22000, status: 'active', address: 'Narsingdi Sadar', createdAt: '2024-02-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'EMP-010', employeeId: 'SM-010', name: 'Salma Khatun', phone: '01611-123456', designation: 'Assembly Worker', department: 'Production', shift: 'morning', joinDate: '2025-09-01', salary: 13500, status: 'active', address: 'Mirpur-13, Dhaka', createdAt: '2025-09-01T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
];

// ── Suppliers ─────────────────────────────────────────────────
export const SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', supplierNo: 'S-0001', name: 'Electro Parts BD Ltd.', contactPerson: 'Md. Shafiqul Islam', phone: '02-9123456', email: 'sales@electropartsbd.com', address: '45/B, Nawabpur Road', area: 'Old Dhaka', paymentTerms: 'Net 30', creditLimit: 500000, balance: 85000, status: 'active', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'SUP-002', supplierNo: 'S-0002', name: 'Glass & Steel Traders', contactPerson: 'Kabir Ahmed', phone: '01711-345678', address: '12, Gulshan-1', area: 'Gulshan, Dhaka', paymentTerms: 'Net 15', creditLimit: 300000, balance: 42000, status: 'active', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'SUP-003', supplierNo: 'S-0003', name: 'Bangla Electronics Components', contactPerson: 'Rina Begum', phone: '01811-456789', email: 'info@bec.com.bd', address: '78, Motijheel C/A', area: 'Motijheel, Dhaka', paymentTerms: 'Cash on Delivery', creditLimit: 200000, balance: 0, status: 'active', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'SUP-004', supplierNo: 'S-0004', name: 'Prime Packaging Solutions', contactPerson: 'Nasir Uddin', phone: '01912-567890', address: '23, Tejgaon I/A', area: 'Tejgaon, Dhaka', paymentTerms: 'Net 7', creditLimit: 150000, balance: 18000, status: 'active', createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'SUP-005', supplierNo: 'S-0005', name: 'Dhaka Metal Works', contactPerson: 'Jahangir Alam', phone: '01611-678901', address: '56, Shyampur', area: 'Shyampur, Dhaka', paymentTerms: 'Net 30', creditLimit: 400000, balance: 95000, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
];

// ── Customers ─────────────────────────────────────────────────
export const CUSTOMERS: Customer[] = [
  { id: 'CUS-001', customerNo: 'C-0001', name: 'Rahman Electronics & Hardware', type: 'b2b', phone: '01711-111222', email: 'rahman.elec@gmail.com', address: '34, Elephant Road', area: 'New Market, Dhaka', creditLimit: 500000, balance: 125000, totalPurchases: 1850000, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'CUS-002', customerNo: 'C-0002', name: 'Karim Trading Corporation', type: 'b2b', phone: '01811-222333', email: 'karim.trading@bd.com', address: '12, Gulshan Avenue', area: 'Gulshan, Dhaka', creditLimit: 1000000, balance: 280000, totalPurchases: 3200000, status: 'active', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'CUS-003', customerNo: 'C-0003', name: 'Akter Home Appliances', type: 'b2b', phone: '01912-333444', address: '78, Banani, Block B', area: 'Banani, Dhaka', creditLimit: 300000, balance: 45000, totalPurchases: 980000, status: 'active', createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
  { id: 'CUS-004', customerNo: 'C-0004', name: 'Md. Shahidul Islam', type: 'b2c', phone: '01611-444555', address: 'House 5, Road 3, Mirpur-12', area: 'Mirpur, Dhaka', creditLimit: 0, balance: 0, totalPurchases: 5400, status: 'active', createdAt: '2026-03-15T08:00:00Z', updatedAt: '2026-08-05T08:00:00Z' },
  { id: 'CUS-005', customerNo: 'C-0005', name: 'Nargis Begum', type: 'b2c', phone: '01511-555666', address: 'Flat 4B, Badda', area: 'Badda, Dhaka', creditLimit: 0, balance: 0, totalPurchases: 3200, status: 'active', createdAt: '2026-04-20T08:00:00Z', updatedAt: '2026-08-01T08:00:00Z' },
  { id: 'CUS-006', customerNo: 'C-0006', name: 'Sylhet Traders Ltd.', type: 'b2b', phone: '01411-666777', email: 'sylhet.traders@mail.com', address: 'Zindabazar, Sylhet', area: 'Sylhet City', creditLimit: 700000, balance: 185000, totalPurchases: 2450000, status: 'active', createdAt: '2026-01-25T08:00:00Z', updatedAt: '2026-08-10T08:00:00Z' },
];

// ── Accounts ──────────────────────────────────────────────────
export const ACCOUNTS: Account[] = [
  { id: 'ACC-001', name: 'Cash — Factory', type: 'cash', balance: 285000, isActive: true, createdAt: '2026-01-01T08:00:00Z' },
  { id: 'ACC-002', name: 'Dutch-Bangla Bank — Business', type: 'bank', accountNo: '1051202345678', bankName: 'Dutch-Bangla Bank Ltd.', balance: 1850000, isActive: true, createdAt: '2026-01-01T08:00:00Z' },
  { id: 'ACC-003', name: 'bKash — Business Account', type: 'mobile_banking', accountNo: '01711-000000', balance: 45000, isActive: true, createdAt: '2026-01-01T08:00:00Z' },
  { id: 'ACC-004', name: 'Nagad — Business Account', type: 'mobile_banking', accountNo: '01711-111111', balance: 22000, isActive: true, createdAt: '2026-01-01T08:00:00Z' },
];

// ── Inventory ─────────────────────────────────────────────────
export const INVENTORY_ITEMS: InventoryItem[] = [
  // Raw Materials in WH-A
  { id: 'INV-RM-001-A', itemId: 'RM-001', itemType: 'material', itemName: 'Infrared Heating Element (2200W)', warehouseId: 'WH-A', qty: 320, unit: 'pcs', avgCost: 320, totalValue: 102400, minStock: 200, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-002-A', itemId: 'RM-002', itemType: 'material', itemName: 'Toughened Glass Top (30cm)', warehouseId: 'WH-A', qty: 45, unit: 'pcs', avgCost: 185, totalValue: 8325, minStock: 150, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-003-A', itemId: 'RM-003', itemType: 'material', itemName: 'Steel Body Panel (Powder Coated)', warehouseId: 'WH-A', qty: 280, unit: 'pcs', avgCost: 220, totalValue: 61600, minStock: 200, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-004-A', itemId: 'RM-004', itemType: 'material', itemName: 'Temperature Control Knob', warehouseId: 'WH-A', qty: 680, unit: 'pcs', avgCost: 35, totalValue: 23800, minStock: 500, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-005-A', itemId: 'RM-005', itemType: 'material', itemName: 'Power Switch (15A)', warehouseId: 'WH-A', qty: 520, unit: 'pcs', avgCost: 45, totalValue: 23400, minStock: 400, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-006-A', itemId: 'RM-006', itemType: 'material', itemName: 'Electrical Wire Harness', warehouseId: 'WH-A', qty: 380, unit: 'set', avgCost: 68, totalValue: 25840, minStock: 300, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-007-A', itemId: 'RM-007', itemType: 'material', itemName: 'PCB Control Board', warehouseId: 'WH-A', qty: 0, unit: 'pcs', avgCost: 145, totalValue: 0, minStock: 200, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-008-A', itemId: 'RM-008', itemType: 'material', itemName: 'Heat Regulator (Bi-metal)', warehouseId: 'WH-A', qty: 85, unit: 'pcs', avgCost: 92, totalValue: 7820, minStock: 200, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-009-A', itemId: 'RM-009', itemType: 'material', itemName: 'Safety Thermal Cutoff', warehouseId: 'WH-A', qty: 420, unit: 'pcs', avgCost: 55, totalValue: 23100, minStock: 300, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-010-A', itemId: 'RM-010', itemType: 'material', itemName: 'Packaging Box (Corrugated)', warehouseId: 'WH-A', qty: 650, unit: 'pcs', avgCost: 28, totalValue: 18200, minStock: 500, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-011-A', itemId: 'RM-011', itemType: 'material', itemName: 'User Manual (Printed)', warehouseId: 'WH-A', qty: 750, unit: 'pcs', avgCost: 8, totalValue: 6000, minStock: 500, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-012-A', itemId: 'RM-012', itemType: 'material', itemName: 'Rubber Leg / Foot Pad (set of 4)', warehouseId: 'WH-A', qty: 480, unit: 'set', avgCost: 18, totalValue: 8640, minStock: 400, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-013-A', itemId: 'RM-013', itemType: 'material', itemName: 'Thermal Insulation Sheet', warehouseId: 'WH-A', qty: 150, unit: 'pcs', avgCost: 42, totalValue: 6300, minStock: 200, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-014-A', itemId: 'RM-014', itemType: 'material', itemName: 'Power Cord (3-pin, 1.5m)', warehouseId: 'WH-A', qty: 410, unit: 'pcs', avgCost: 52, totalValue: 21320, minStock: 300, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-RM-015-A', itemId: 'RM-015', itemType: 'material', itemName: 'Screw Set (M4 Stainless)', warehouseId: 'WH-A', qty: 1200, unit: 'set', avgCost: 12, totalValue: 14400, minStock: 1000, updatedAt: '2026-08-16T10:00:00Z' },
  // Finished Goods in WH-B
  { id: 'INV-PRD-001-B', itemId: 'PRD-001', itemType: 'product', itemName: 'Infrared Cooker IR-101', warehouseId: 'WH-B', qty: 120, unit: 'pcs', avgCost: 1180, totalValue: 141600, minStock: 50, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-002-B', itemId: 'PRD-002', itemType: 'product', itemName: 'Infrared Cooker IR-102 (Premium)', warehouseId: 'WH-B', qty: 68, unit: 'pcs', avgCost: 1420, totalValue: 96560, minStock: 40, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-003-B', itemId: 'PRD-003', itemType: 'product', itemName: 'Infrared Cooker IR-103 (Double Burner)', warehouseId: 'WH-B', qty: 22, unit: 'pcs', avgCost: 2100, totalValue: 46200, minStock: 30, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-004-B', itemId: 'PRD-004', itemType: 'product', itemName: 'Infrared Stove IS-201', warehouseId: 'WH-B', qty: 85, unit: 'pcs', avgCost: 1300, totalValue: 110500, minStock: 40, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-005-B', itemId: 'PRD-005', itemType: 'product', itemName: 'Infrared Stove IS-202 (Glass Top)', warehouseId: 'WH-B', qty: 34, unit: 'pcs', avgCost: 1680, totalValue: 57120, minStock: 30, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-006-B', itemId: 'PRD-006', itemType: 'product', itemName: 'Infrared Stove IS-203 (Touch)', warehouseId: 'WH-B', qty: 8, unit: 'pcs', avgCost: 2350, totalValue: 18800, minStock: 20, updatedAt: '2026-08-16T10:00:00Z' },
  { id: 'INV-PRD-007-B', itemId: 'PRD-007', itemType: 'product', itemName: 'Infrared Cooker IR-104 (Economy)', warehouseId: 'WH-B', qty: 145, unit: 'pcs', avgCost: 950, totalValue: 137750, minStock: 60, updatedAt: '2026-08-16T10:00:00Z' },
];

// ── Production Orders ─────────────────────────────────────────
export const PRODUCTION_ORDERS: ProductionOrder[] = [
  { id: 'PO-001', orderNo: 'PO-00125', productId: 'PRD-001', productName: 'Infrared Cooker IR-101', model: 'IR-101', targetQty: 50, producedQty: 48, passedQty: 46, failedQty: 2, reworkQty: 2, status: 'qc_pending', assignedEmployees: ['EMP-001', 'EMP-002', 'EMP-004'], productionDate: '2026-08-17', expectedCompletion: '2026-08-17', createdBy: 'Mushfiqur Rahman', createdAt: '2026-08-17T07:00:00Z', updatedAt: '2026-08-17T14:30:00Z' },
  { id: 'PO-002', orderNo: 'PO-00124', productId: 'PRD-004', productName: 'Infrared Stove IS-201', model: 'IS-201', targetQty: 40, producedQty: 40, passedQty: 38, failedQty: 0, reworkQty: 2, status: 'completed', assignedEmployees: ['EMP-001', 'EMP-009'], productionDate: '2026-08-16', expectedCompletion: '2026-08-16', createdBy: 'Mushfiqur Rahman', createdAt: '2026-08-16T07:00:00Z', updatedAt: '2026-08-16T16:45:00Z' },
  { id: 'PO-003', orderNo: 'PO-00126', productId: 'PRD-007', productName: 'Infrared Cooker IR-104 (Economy)', model: 'IR-104', targetQty: 60, producedQty: 0, passedQty: 0, failedQty: 0, reworkQty: 0, status: 'ready', assignedEmployees: ['EMP-002', 'EMP-004', 'EMP-010'], productionDate: '2026-08-18', expectedCompletion: '2026-08-18', createdBy: 'Mushfiqur Rahman', createdAt: '2026-08-17T09:00:00Z', updatedAt: '2026-08-17T09:00:00Z' },
  { id: 'PO-004', orderNo: 'PO-00123', productId: 'PRD-002', productName: 'Infrared Cooker IR-102 (Premium)', model: 'IR-102', targetQty: 30, producedQty: 30, passedQty: 29, failedQty: 0, reworkQty: 1, status: 'completed', assignedEmployees: ['EMP-009', 'EMP-001'], productionDate: '2026-08-15', expectedCompletion: '2026-08-15', createdBy: 'Mushfiqur Rahman', createdAt: '2026-08-15T07:00:00Z', updatedAt: '2026-08-15T16:30:00Z' },
];

// ── QC Records ────────────────────────────────────────────────
export const QC_RECORDS: QCRecord[] = [
  { id: 'QC-001', qcNo: 'QC-00125', productionOrderId: 'PO-001', orderNo: 'PO-00125', productId: 'PRD-001', productName: 'Infrared Cooker IR-101', inspectedQty: 48, passedQty: 0, failedQty: 0, reworkQty: 0, status: 'pending', inspectedBy: 'Meshkat Afrose', inspectedAt: '2026-08-17T15:00:00Z', createdAt: '2026-08-17T15:00:00Z' },
  { id: 'QC-002', qcNo: 'QC-00124', productionOrderId: 'PO-002', orderNo: 'PO-00124', productId: 'PRD-004', productName: 'Infrared Stove IS-201', inspectedQty: 40, passedQty: 38, failedQty: 2, reworkQty: 2, status: 'passed', failureReason: 'Glass top minor scratch on 2 units', inspectedBy: 'Meshkat Afrose', inspectedAt: '2026-08-16T15:30:00Z', reworkCompletedAt: '2026-08-16T17:00:00Z', retestStatus: 'passed', createdAt: '2026-08-16T15:30:00Z' },
  { id: 'QC-003', qcNo: 'QC-00123', productionOrderId: 'PO-004', orderNo: 'PO-00123', productId: 'PRD-002', productName: 'Infrared Cooker IR-102 (Premium)', inspectedQty: 30, passedQty: 29, failedQty: 1, reworkQty: 1, status: 'retested', failureReason: 'PCB board heating issue on 1 unit', remarks: 'PCB replaced and retested — OK', inspectedBy: 'Meshkat Afrose', inspectedAt: '2026-08-15T14:00:00Z', retestStatus: 'passed', createdAt: '2026-08-15T14:00:00Z' },
];

// ── Production Entries ────────────────────────────────────────
export const PRODUCTION_ENTRIES: ProductionEntry[] = [
  { id: 'PE-001', productionOrderId: 'PO-001', orderNo: 'PO-00125', productId: 'PRD-001', productName: 'Infrared Cooker IR-101', employeeId: 'EMP-001', employeeName: 'Md. Abdur Rahim', date: '2026-08-17', targetQty: 18, producedQty: 17, defectiveQty: 1, reworkQty: 1, shift: 'morning', createdAt: '2026-08-17T14:30:00Z' },
  { id: 'PE-002', productionOrderId: 'PO-001', orderNo: 'PO-00125', productId: 'PRD-001', productName: 'Infrared Cooker IR-101', employeeId: 'EMP-002', employeeName: 'Md. Karim Hossain', date: '2026-08-17', targetQty: 16, producedQty: 16, defectiveQty: 1, reworkQty: 0, shift: 'morning', createdAt: '2026-08-17T14:30:00Z' },
  { id: 'PE-003', productionOrderId: 'PO-001', orderNo: 'PO-00125', productId: 'PRD-001', productName: 'Infrared Cooker IR-101', employeeId: 'EMP-004', employeeName: 'Rima Begum', date: '2026-08-17', targetQty: 16, producedQty: 15, defectiveQty: 0, reworkQty: 1, shift: 'morning', createdAt: '2026-08-17T14:30:00Z' },
];

// ── Purchase Orders ────────────────────────────────────────────
export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PUR-001', poNo: 'PUR-0045', supplierId: 'SUP-001', supplierName: 'Electro Parts BD Ltd.',
    items: [
      { materialId: 'RM-007', materialName: 'PCB Control Board', qty: 300, unit: 'pcs', unitPrice: 140, discount: 0, total: 42000, receivedQty: 300 },
      { materialId: 'RM-005', materialName: 'Power Switch (15A)', qty: 500, unit: 'pcs', unitPrice: 42, discount: 0, total: 21000, receivedQty: 500 },
    ],
    status: 'received', paymentStatus: 'partial',
    subtotal: 63000, discount: 0, tax: 0, total: 63000, paid: 40000, due: 23000,
    warehouseId: 'WH-A', paymentMethod: 'bank_transfer', accountId: 'ACC-002',
    createdBy: 'Rasel Ahmed', createdAt: '2026-08-10T10:00:00Z', updatedAt: '2026-08-12T14:00:00Z',
    receivedAt: '2026-08-12T14:00:00Z',
  },
  {
    id: 'PUR-002', poNo: 'PUR-0046', supplierId: 'SUP-002', supplierName: 'Glass & Steel Traders',
    items: [
      { materialId: 'RM-002', materialName: 'Toughened Glass Top (30cm)', qty: 200, unit: 'pcs', unitPrice: 182, discount: 0, total: 36400, receivedQty: 0 },
    ],
    status: 'ordered', paymentStatus: 'unpaid',
    subtotal: 36400, discount: 0, tax: 0, total: 36400, paid: 0, due: 36400,
    warehouseId: 'WH-A', createdBy: 'Rasel Ahmed', createdAt: '2026-08-16T11:00:00Z', updatedAt: '2026-08-16T11:00:00Z',
  },
];

// ── Sales ─────────────────────────────────────────────────────
export const SALES: Sale[] = [
  {
    id: 'SAL-001', invoiceNo: 'INV-0215', customerId: 'CUS-001', customerName: 'Rahman Electronics & Hardware',
    saleType: 'b2b', status: 'delivered', paymentStatus: 'partial',
    items: [
      { itemId: 'PRD-001', itemType: 'product', itemName: 'Infrared Cooker IR-101', qty: 20, unit: 'pcs', unitPrice: 1650, discount: 0, total: 33000 },
      { itemId: 'PRD-004', itemType: 'product', itemName: 'Infrared Stove IS-201', qty: 10, unit: 'pcs', unitPrice: 1850, discount: 0, total: 18500 },
    ],
    subtotal: 51500, discount: 2500, total: 49000, paid: 25000, due: 24000,
    paymentMethod: 'bank_transfer', accountId: 'ACC-002', warehouseId: 'WH-B',
    saleDate: '2026-08-15', createdBy: 'Sales Officer', createdAt: '2026-08-15T10:00:00Z', updatedAt: '2026-08-16T09:00:00Z',
  },
  {
    id: 'SAL-002', invoiceNo: 'INV-0216', customerId: 'CUS-004', customerName: 'Md. Shahidul Islam',
    customerPhone: '01611-444555', saleType: 'b2c', status: 'delivered', paymentStatus: 'paid',
    items: [
      { itemId: 'PRD-001', itemType: 'product', itemName: 'Infrared Cooker IR-101', qty: 1, unit: 'pcs', unitPrice: 1850, discount: 0, total: 1850 },
    ],
    subtotal: 1850, discount: 0, total: 1850, paid: 1850, due: 0,
    paymentMethod: 'bkash', accountId: 'ACC-003', warehouseId: 'WH-B',
    saleDate: '2026-08-17', createdBy: 'Sales Officer', createdAt: '2026-08-17T11:00:00Z', updatedAt: '2026-08-17T11:00:00Z',
  },
  {
    id: 'SAL-003', invoiceNo: 'INV-0217', customerId: 'CUS-002', customerName: 'Karim Trading Corporation',
    saleType: 'b2b', status: 'confirmed', paymentStatus: 'unpaid',
    items: [
      { itemId: 'PRD-007', itemType: 'product', itemName: 'Infrared Cooker IR-104 (Economy)', qty: 50, unit: 'pcs', unitPrice: 1250, discount: 0, total: 62500 },
    ],
    subtotal: 62500, discount: 3000, total: 59500, paid: 0, due: 59500,
    warehouseId: 'WH-B', saleDate: '2026-08-17',
    createdBy: 'Sales Officer', createdAt: '2026-08-17T13:00:00Z', updatedAt: '2026-08-17T13:00:00Z',
  },
];

// ── Deliveries ────────────────────────────────────────────────
export const DELIVERIES: Delivery[] = [
  {
    id: 'DEL-001', deliveryNo: 'DEL-0201', saleId: 'SAL-001', invoiceNo: 'INV-0215',
    customerId: 'CUS-001', customerName: 'Rahman Electronics & Hardware',
    customerAddress: '34, Elephant Road, New Market, Dhaka',
    customerPhone: '01711-111222',
    items: [
      { itemId: 'PRD-001', itemName: 'Infrared Cooker IR-101', qty: 20, unit: 'pcs' },
      { itemId: 'PRD-004', itemName: 'Infrared Stove IS-201', qty: 10, unit: 'pcs' },
    ],
    status: 'delivered', assignedTo: 'Md. Alam (Driver)',
    scheduledDate: '2026-08-16', deliveredAt: '2026-08-16T14:00:00Z',
    totalAmount: 49000, paymentStatus: 'partial',
    createdAt: '2026-08-15T12:00:00Z', updatedAt: '2026-08-16T14:00:00Z',
  },
  {
    id: 'DEL-002', deliveryNo: 'DEL-0202', saleId: 'SAL-003', invoiceNo: 'INV-0217',
    customerId: 'CUS-002', customerName: 'Karim Trading Corporation',
    customerAddress: '12, Gulshan Avenue, Gulshan, Dhaka',
    customerPhone: '01811-222333',
    items: [{ itemId: 'PRD-007', itemName: 'Infrared Cooker IR-104 (Economy)', qty: 50, unit: 'pcs' }],
    status: 'pending', totalAmount: 59500, paymentStatus: 'unpaid',
    createdAt: '2026-08-17T13:30:00Z', updatedAt: '2026-08-17T13:30:00Z',
  },
];

// ── Stock Movements ───────────────────────────────────────────
export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'SM-001', itemId: 'RM-007', itemType: 'material', itemName: 'PCB Control Board', warehouseId: 'WH-A', movementType: 'purchase', qty: 300, qtyBefore: 0, qtyAfter: 300, unit: 'pcs', referenceId: 'PUR-001', referenceType: 'purchase_order', createdBy: 'Rasel Ahmed', createdAt: '2026-08-12T14:00:00Z' },
  { id: 'SM-002', itemId: 'RM-007', itemType: 'material', itemName: 'PCB Control Board', warehouseId: 'WH-A', movementType: 'production_consumption', qty: -300, qtyBefore: 300, qtyAfter: 0, unit: 'pcs', referenceId: 'PO-004', referenceType: 'production_order', createdBy: 'Mushfiqur Rahman', createdAt: '2026-08-15T09:00:00Z' },
  { id: 'SM-003', itemId: 'PRD-001', itemType: 'product', itemName: 'Infrared Cooker IR-101', warehouseId: 'WH-B', movementType: 'production_output', qty: 46, qtyBefore: 94, qtyAfter: 140, unit: 'pcs', referenceId: 'PO-002', referenceType: 'production_order', createdBy: 'Meshkat Afrose', createdAt: '2026-08-16T17:00:00Z' },
  { id: 'SM-004', itemId: 'PRD-001', itemType: 'product', itemName: 'Infrared Cooker IR-101', warehouseId: 'WH-B', movementType: 'sale', qty: -20, qtyBefore: 140, qtyAfter: 120, unit: 'pcs', referenceId: 'SAL-001', referenceType: 'sale', createdBy: 'Sales Officer', createdAt: '2026-08-15T10:30:00Z' },
];

// ── Expenses ──────────────────────────────────────────────────
export const EXPENSES: Expense[] = [
  { id: 'EXP-001', expenseNo: 'EXP-0145', category: 'Utilities', amount: 18500, accountId: 'ACC-002', accountName: 'Dutch-Bangla Bank — Business', paymentMethod: 'bank_transfer', date: '2026-08-05', referenceNo: 'DESCO-AUG-2026', notes: 'Electricity bill — August 2026', createdBy: 'Accounts Officer', createdAt: '2026-08-05T10:00:00Z' },
  { id: 'EXP-002', expenseNo: 'EXP-0146', category: 'Salaries', amount: 195000, accountId: 'ACC-002', accountName: 'Dutch-Bangla Bank — Business', paymentMethod: 'bank_transfer', date: '2026-08-01', notes: 'Staff salaries — August 2026', createdBy: 'Accounts Officer', createdAt: '2026-08-01T10:00:00Z' },
  { id: 'EXP-003', expenseNo: 'EXP-0147', category: 'Transport', amount: 4500, accountId: 'ACC-001', accountName: 'Cash — Factory', paymentMethod: 'cash', date: '2026-08-16', notes: 'Delivery fuel and driver allowance', createdBy: 'Accounts Officer', createdAt: '2026-08-16T16:00:00Z' },
  { id: 'EXP-004', expenseNo: 'EXP-0148', category: 'Maintenance', amount: 8200, accountId: 'ACC-001', accountName: 'Cash — Factory', paymentMethod: 'cash', date: '2026-08-14', notes: 'Workshop equipment repair', createdBy: 'Accounts Officer', createdAt: '2026-08-14T11:00:00Z' },
];

// ── Notifications ─────────────────────────────────────────────
export const NOTIFICATIONS: Notification[] = [
  { id: 'NTF-001', type: 'low_stock', priority: 'critical', title: 'Out of Stock — PCB Control Board', message: 'PCB Control Board (RM-007) is out of stock in Warehouse A. 200 units required for upcoming production.', isRead: false, relatedModule: 'inventory', relatedId: 'RM-007', createdAt: '2026-08-17T08:30:00Z' },
  { id: 'NTF-002', type: 'low_stock', priority: 'high', title: 'Low Stock — Toughened Glass Top', message: 'Toughened Glass Top has only 45 units remaining (minimum: 150). Consider placing a purchase order.', isRead: false, relatedModule: 'inventory', relatedId: 'RM-002', createdAt: '2026-08-17T08:30:00Z' },
  { id: 'NTF-003', type: 'low_stock', priority: 'high', title: 'Low Stock — Heat Regulator', message: 'Heat Regulator (Bi-metal) has only 85 units (minimum: 200). Production may be affected.', isRead: false, relatedModule: 'inventory', createdAt: '2026-08-17T08:30:00Z' },
  { id: 'NTF-004', type: 'qc_failure', priority: 'medium', title: 'QC — 2 Units Failed (IR-101)', message: 'Production Order PO-00125: 2 units of Infrared Cooker IR-101 failed QC. Rework has been initiated.', isRead: false, relatedModule: 'qc', relatedId: 'QC-001', createdAt: '2026-08-17T15:05:00Z' },
  { id: 'NTF-005', type: 'payment_due', priority: 'medium', title: 'Payment Due — Electro Parts BD', message: 'Purchase Order PUR-0045: ৳23,000 payment due to Electro Parts BD Ltd.', isRead: true, relatedModule: 'procurement', relatedId: 'PUR-001', createdAt: '2026-08-14T09:00:00Z' },
  { id: 'NTF-006', type: 'pending_delivery', priority: 'medium', title: 'Delivery Pending — Karim Trading', message: 'Delivery DEL-0202 for Karim Trading Corporation (50 units) is awaiting dispatch.', isRead: true, relatedModule: 'delivery', relatedId: 'DEL-002', createdAt: '2026-08-17T13:35:00Z' },
];

// ── Audit Log ─────────────────────────────────────────────────
export const AUDIT_LOGS: AuditLog[] = [
  { id: 'AUD-001', userId: 'USR-001', userName: 'Mushfiqur Rahman', action: 'create', module: 'Production', entityId: 'PO-001', entityType: 'ProductionOrder', description: 'Created Production Order PO-00125 for Infrared Cooker IR-101 (50 units)', createdAt: '2026-08-17T07:00:00Z' },
  { id: 'AUD-002', userId: 'USR-002', userName: 'Rasel Ahmed', action: 'update', module: 'Inventory', entityId: 'INV-RM-007-A', entityType: 'InventoryItem', description: 'Stock adjustment — PCB Control Board from 300 to 0 pcs (consumed in production)', previousValue: { qty: 300 }, newValue: { qty: 0 }, createdAt: '2026-08-15T09:05:00Z' },
  { id: 'AUD-003', userId: 'USR-003', userName: 'Meshkat Afrose', action: 'approve', module: 'QC', entityId: 'QC-002', entityType: 'QCRecord', description: 'QC passed for PO-00124 — 38 units passed, 2 units sent for rework', createdAt: '2026-08-16T15:30:00Z' },
  { id: 'AUD-004', userId: 'USR-004', userName: 'Sales Officer', action: 'create', module: 'Sales', entityId: 'SAL-001', entityType: 'Sale', description: 'Created Invoice INV-0215 for Rahman Electronics — ৳49,000', createdAt: '2026-08-15T10:00:00Z' },
];

// ── Warehouse Transfers ────────────────────────────────────────
export const WAREHOUSE_TRANSFERS: WarehouseTransfer[] = [
  {
    id: 'TRF-001', transferNo: 'TRF-0012',
    fromWarehouseId: 'WH-B', toWarehouseId: 'WH-A',
    items: [{ itemId: 'PRD-007', itemType: 'product', itemName: 'Infrared Cooker IR-104 (Economy)', qty: 30, unit: 'pcs' }],
    status: 'received', requestedBy: 'Rasel Ahmed', approvedBy: 'Mushfiqur Rahman',
    notes: 'Transfer 30 units IR-104 for B2B order fulfillment',
    createdAt: '2026-08-14T09:00:00Z', updatedAt: '2026-08-14T11:00:00Z',
  },
];

// ── Transactions ──────────────────────────────────────────────
export const TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', transactionNo: 'TXN-0201', accountId: 'ACC-002', accountName: 'Dutch-Bangla Bank — Business', type: 'income', category: 'Sales', amount: 25000, description: 'Partial payment — INV-0215 Rahman Electronics', referenceId: 'SAL-001', referenceType: 'sale', paymentMethod: 'bank_transfer', date: '2026-08-15', createdBy: 'Accounts Officer', createdAt: '2026-08-15T12:00:00Z' },
  { id: 'TXN-002', transactionNo: 'TXN-0202', accountId: 'ACC-002', accountName: 'Dutch-Bangla Bank — Business', type: 'expense', category: 'Salaries', amount: 195000, description: 'Staff salaries — August 2026', paymentMethod: 'bank_transfer', date: '2026-08-01', createdBy: 'Accounts Officer', createdAt: '2026-08-01T10:00:00Z' },
  { id: 'TXN-003', transactionNo: 'TXN-0203', accountId: 'ACC-003', accountName: 'bKash — Business Account', type: 'income', category: 'Sales', amount: 1850, description: 'Payment — INV-0216 Md. Shahidul Islam', referenceId: 'SAL-002', referenceType: 'sale', paymentMethod: 'bkash', date: '2026-08-17', createdBy: 'Sales Officer', createdAt: '2026-08-17T11:00:00Z' },
  { id: 'TXN-004', transactionNo: 'TXN-0204', accountId: 'ACC-002', accountName: 'Dutch-Bangla Bank — Business', type: 'expense', category: 'Purchase', amount: 40000, description: 'Partial payment — PUR-0045 Electro Parts BD', referenceId: 'PUR-001', referenceType: 'purchase', paymentMethod: 'bank_transfer', date: '2026-08-12', createdBy: 'Accounts Officer', createdAt: '2026-08-12T15:00:00Z' },
];

// ── Production Trend (chart data) ─────────────────────────────
export const PRODUCTION_TREND_7D = [
  { date: 'Aug 11', target: 200, produced: 195, passed: 192 },
  { date: 'Aug 12', target: 200, produced: 210, passed: 206 },
  { date: 'Aug 13', target: 200, produced: 198, passed: 194 },
  { date: 'Aug 14', target: 200, produced: 185, passed: 181 },
  { date: 'Aug 15', target: 200, produced: 202, passed: 199 },
  { date: 'Aug 16', target: 200, produced: 220, passed: 218 },
  { date: 'Aug 17', target: 200, produced: 48,  passed: 0   },
];

// ── Sales Trend (chart data) ───────────────────────────────────
export const SALES_TREND_7D = [
  { date: 'Aug 11', b2b: 85000,  b2c: 12000 },
  { date: 'Aug 12', b2b: 120000, b2c: 9500  },
  { date: 'Aug 13', b2b: 0,      b2c: 5500  },
  { date: 'Aug 14', b2b: 49000,  b2c: 8200  },
  { date: 'Aug 15', b2b: 95000,  b2c: 11000 },
  { date: 'Aug 16', b2b: 62000,  b2c: 7800  },
  { date: 'Aug 17', b2b: 59500,  b2c: 1850  },
];

// ── Finance Trend (chart data) ────────────────────────────────
export const FINANCE_TREND_7D = [
  { date: 'Aug 11', income: 97000,  expenses: 42000 },
  { date: 'Aug 12', income: 129500, expenses: 18000 },
  { date: 'Aug 13', income: 5500,   expenses: 12000 },
  { date: 'Aug 14', income: 57200,  expenses: 20700 },
  { date: 'Aug 15', income: 106000, expenses: 195000 },
  { date: 'Aug 16', income: 69800,  expenses: 12700 },
  { date: 'Aug 17', income: 61350,  expenses: 8200  },
];

// ── Expense Categories ────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  'Utilities', 'Salaries', 'Transport', 'Maintenance',
  'Raw Material Purchase', 'Office & Admin', 'Marketing',
  'Rent', 'Insurance', 'Miscellaneous',
] as const;


// ── Attendance Records ─────────────────────────────────────────
export const ATTENDANCE_RECORDS: import('../types').AttendanceRecord[] = [
  { id: 'ATT-001', employeeId: 'EMP-001', employeeName: 'Md. Karim Uddin',    date: '2026-08-17', checkIn: '2026-08-17T08:02:00Z', checkOut: '2026-08-17T17:05:00Z', status: 'present',  shift: 'morning',   createdAt: '2026-08-17T08:02:00Z' },
  { id: 'ATT-002', employeeId: 'EMP-002', employeeName: 'Rina Begum',          date: '2026-08-17', checkIn: '2026-08-17T08:10:00Z', checkOut: '2026-08-17T17:00:00Z', status: 'present',  shift: 'morning',   createdAt: '2026-08-17T08:10:00Z' },
  { id: 'ATT-003', employeeId: 'EMP-003', employeeName: 'Md. Jahirul Islam',  date: '2026-08-17', checkIn: '2026-08-17T08:35:00Z', checkOut: '2026-08-17T17:00:00Z', status: 'late',     shift: 'morning',   notes: 'Traffic delay', createdAt: '2026-08-17T08:35:00Z' },
  { id: 'ATT-004', employeeId: 'EMP-004', employeeName: 'Fatema Khatun',      date: '2026-08-17', checkIn: '2026-08-17T08:00:00Z', checkOut: '2026-08-17T17:00:00Z', status: 'present',  shift: 'morning',   createdAt: '2026-08-17T08:00:00Z' },
  { id: 'ATT-005', employeeId: 'EMP-005', employeeName: 'Md. Nazmul Hossain', date: '2026-08-17',                                                                    status: 'absent',   shift: 'morning',   notes: 'Unscheduled absence', createdAt: '2026-08-17T09:00:00Z' },
  { id: 'ATT-006', employeeId: 'EMP-006', employeeName: 'Mushfiqur Rahman',   date: '2026-08-17', checkIn: '2026-08-17T07:45:00Z', checkOut: '2026-08-17T18:00:00Z', status: 'present',  shift: 'morning',   createdAt: '2026-08-17T07:45:00Z' },
  { id: 'ATT-007', employeeId: 'EMP-007', employeeName: 'Rasel Ahmed',        date: '2026-08-17', checkIn: '2026-08-17T08:05:00Z',                                   status: 'present',  shift: 'morning',   createdAt: '2026-08-17T08:05:00Z' },
  { id: 'ATT-008', employeeId: 'EMP-008', employeeName: 'Meshkat Afrose',     date: '2026-08-17', checkIn: '2026-08-17T08:00:00Z',                                   status: 'present',  shift: 'morning',   createdAt: '2026-08-17T08:00:00Z' },
  { id: 'ATT-009', employeeId: 'EMP-009', employeeName: 'Nasrin Akter',       date: '2026-08-17',                                                                    status: 'on_leave', shift: 'morning',   notes: 'Annual leave', createdAt: '2026-08-17T09:00:00Z' },
  { id: 'ATT-010', employeeId: 'EMP-010', employeeName: 'Md. Rafiqul Islam',  date: '2026-08-17', checkIn: '2026-08-17T14:00:00Z',                                   status: 'present',  shift: 'afternoon', createdAt: '2026-08-17T14:00:00Z' },
];
