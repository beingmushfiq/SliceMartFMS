// ─────────────────────────────────────────────────────────────
// GLOBAL APP STORE — Zustand
// Manages: inventory (live), customers, suppliers, products,
// materials, employees, accounts, notifications, UI state
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  InventoryItem, Notification, ProductionOrder,
  Sale, PurchaseOrder, QCRecord, Expense, Account,
  StockMovement, Transaction, Customer, Supplier,
  Product, RawMaterial, Employee, BOM,
  MovementType, Unit,
} from '../types';
import {
  INVENTORY_ITEMS, NOTIFICATIONS, PRODUCTION_ORDERS,
  SALES, PURCHASE_ORDERS, QC_RECORDS, EXPENSES, ACCOUNTS,
  STOCK_MOVEMENTS, TRANSACTIONS, CUSTOMERS, SUPPLIERS,
  PRODUCTS, RAW_MATERIALS, EMPLOYEES, BOMS,
} from '../data/mockData';

interface AppState {
  // ── Master Entities & Instant Entry
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  products: Product[];
  addProduct: (product: Product) => void;

  rawMaterials: RawMaterial[];
  addRawMaterial: (material: RawMaterial) => void;

  employees: Employee[];
  addEmployee: (employee: Employee) => void;

  boms: BOM[];
  addBOM: (bom: BOM) => void;

  // ── Inventory (live — mutates with business ops)
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  updateStock: (itemId: string, warehouseId: string, delta: number, movement: Partial<StockMovement> & { itemId: string; itemType: 'product' | 'material'; itemName: string; movementType: MovementType; unit: Unit }) => void;
  addInventoryItem: (item: InventoryItem) => void;

  // ── Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => void;

  // ── Production Orders
  productionOrders: ProductionOrder[];
  updateProductionOrder: (id: string, updates: Partial<ProductionOrder>) => void;
  addProductionOrder: (po: ProductionOrder) => void;

  // ── QC
  qcRecords: QCRecord[];
  updateQCRecord: (id: string, updates: Partial<QCRecord>) => void;
  addQCRecord: (qc: QCRecord) => void;

  // ── Sales
  sales: Sale[];
  addSale: (sale: Sale) => void;
  updateSale: (id: string, updates: Partial<Sale>) => void;

  // ── Purchases
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;

  // ── Finance
  expenses: Expense[];
  accounts: Account[];
  transactions: Transaction[];
  addExpense: (exp: Expense) => void;
  addAccount: (acc: Account) => void;
  addTransaction: (txn: Transaction) => void;
  updateAccountBalance: (accountId: string, delta: number) => void;

  // ── UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  activeSearch: string;
  setActiveSearch: (q: string) => void;
}

let _idCounter = 3000;
const genId = (prefix: string) => `${prefix}-${(++_idCounter).toString().padStart(5, '0')}`;

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // ── Master Entities
    customers: [...CUSTOMERS],
    addCustomer: (customer) => {
      set(state => ({ customers: [customer, ...state.customers] }));
      get().addNotification({
        title: 'New Customer Created',
        message: `${customer.name} was registered into the customer ledger.`,
        type: 'info',
        priority: 'low',
        relatedModule: 'sales',
      });
    },
    updateCustomer: (id, updates) => set(state => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
    })),

    suppliers: [...SUPPLIERS],
    addSupplier: (supplier) => {
      set(state => ({ suppliers: [supplier, ...state.suppliers] }));
      get().addNotification({
        title: 'New Supplier Onboarded',
        message: `${supplier.name} was registered as an active vendor.`,
        type: 'info',
        priority: 'low',
        relatedModule: 'procurement',
      });
    },
    updateSupplier: (id, updates) => set(state => ({
      suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
    })),

    products: [...PRODUCTS],
    addProduct: (product) => {
      set(state => ({ products: [product, ...state.products] }));
      // Also register into warehouse B inventory
      get().addInventoryItem({
        id: `INV-${product.id}-B`,
        itemId: product.id,
        itemType: 'product',
        itemName: product.name,
        warehouseId: 'WH-B',
        qty: 0,
        unit: product.unit,
        avgCost: product.costPrice,
        totalValue: 0,
        minStock: product.minStock,
        updatedAt: new Date().toISOString(),
      });
    },

    rawMaterials: [...RAW_MATERIALS],
    addRawMaterial: (material) => {
      set(state => ({ rawMaterials: [material, ...state.rawMaterials] }));
      // Also register into warehouse A inventory
      get().addInventoryItem({
        id: `INV-${material.id}-A`,
        itemId: material.id,
        itemType: 'material',
        itemName: material.name,
        warehouseId: 'WH-A',
        qty: 0,
        unit: material.unit,
        avgCost: material.costPrice,
        totalValue: 0,
        minStock: material.minStock,
        updatedAt: new Date().toISOString(),
      });
    },

    employees: [...EMPLOYEES],
    addEmployee: (employee) => set(state => ({
      employees: [employee, ...state.employees]
    })),

    boms: [...BOMS],
    addBOM: (bom) => set(state => ({
      boms: [bom, ...state.boms]
    })),

    // ── Inventory
    inventory: [...INVENTORY_ITEMS],
    stockMovements: [...STOCK_MOVEMENTS],

    addInventoryItem: (item) => set(state => {
      const exists = state.inventory.some(i => i.id === item.id || (i.itemId === item.itemId && i.warehouseId === item.warehouseId));
      if (exists) return state;
      return { inventory: [item, ...state.inventory] };
    }),

    updateStock: (itemId, warehouseId, delta, movementData) => {
      const state = get();
      const currentItem = state.inventory.find(
        i => i.itemId === itemId && i.warehouseId === warehouseId
      );

      const qtyBefore = currentItem?.qty ?? 0;
      const qtyAfter  = Math.max(0, qtyBefore + delta);

      let updatedInventory: InventoryItem[];

      if (currentItem) {
        updatedInventory = state.inventory.map(i => {
          if (i.itemId === itemId && i.warehouseId === warehouseId) {
            const newQty = qtyAfter;
            return {
              ...i,
              qty: newQty,
              totalValue: newQty * i.avgCost,
              updatedAt: new Date().toISOString(),
            };
          }
          return i;
        });
      } else {
        const newItem: InventoryItem = {
          id: genId('INV'),
          itemId,
          itemType: movementData.itemType,
          itemName: movementData.itemName,
          warehouseId: warehouseId as any,
          qty: qtyAfter,
          unit: movementData.unit,
          avgCost: 0,
          totalValue: 0,
          minStock: 10,
          updatedAt: new Date().toISOString(),
        };
        updatedInventory = [...state.inventory, newItem];
      }

      const newMovement: StockMovement = {
        id: genId('SM'),
        ...movementData,
        warehouseId: warehouseId as any,
        qty: Math.abs(delta),
        qtyBefore,
        qtyAfter,
        createdAt: new Date().toISOString(),
      };

      set({
        inventory: updatedInventory,
        stockMovements: [newMovement, ...state.stockMovements],
      });

      if (qtyAfter <= (currentItem?.minStock ?? 10) && qtyAfter > 0) {
        get().addNotification({
          title: 'Low Stock Alert',
          message: `${movementData.itemName} is running low (${qtyAfter} ${movementData.unit} remaining in ${warehouseId})`,
          type: 'low_stock',
          priority: 'high',
          relatedModule: 'inventory',
        });
      } else if (qtyAfter === 0) {
        get().addNotification({
          title: 'Stock Out Alert',
          message: `${movementData.itemName} is completely out of stock in ${warehouseId}!`,
          type: 'low_stock',
          priority: 'critical',
          relatedModule: 'inventory',
        });
      }
    },

    // ── Notifications
    notifications: [...NOTIFICATIONS],
    unreadCount: NOTIFICATIONS.filter(n => !n.isRead).length,

    markAsRead: (id) => set(state => {
      const notifs = state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: notifs,
        unreadCount: notifs.filter(n => !n.isRead).length,
      };
    }),

    markAllRead: () => set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

    addNotification: (n) => set(state => {
      const newNotif: Notification = {
        id: genId('NOTIF'),
        ...n,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      const notifs = [newNotif, ...state.notifications];
      return {
        notifications: notifs,
        unreadCount: notifs.filter(x => !x.isRead).length,
      };
    }),

    // ── Production Orders
    productionOrders: [...PRODUCTION_ORDERS],

    updateProductionOrder: (id, updates) => set(state => ({
      productionOrders: state.productionOrders.map(po =>
        po.id === id ? { ...po, ...updates, updatedAt: new Date().toISOString() } : po
      ),
    })),

    addProductionOrder: (po) => set(state => ({
      productionOrders: [po, ...state.productionOrders],
    })),

    // ── QC
    qcRecords: [...QC_RECORDS],

    updateQCRecord: (id, updates) => set(state => ({
      qcRecords: state.qcRecords.map(qc =>
        qc.id === id ? { ...qc, ...updates } : qc
      ),
    })),

    addQCRecord: (qc) => set(state => ({
      qcRecords: [qc, ...state.qcRecords],
    })),

    // ── Sales
    sales: [...SALES],

    addSale: (sale) => set(state => ({
      sales: [sale, ...state.sales],
    })),

    updateSale: (id, updates) => set(state => ({
      sales: state.sales.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    })),

    // ── Purchases
    purchaseOrders: [...PURCHASE_ORDERS],

    addPurchaseOrder: (po) => set(state => ({
      purchaseOrders: [po, ...state.purchaseOrders],
    })),

    updatePurchaseOrder: (id, updates) => set(state => ({
      purchaseOrders: state.purchaseOrders.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

    // ── Finance
    expenses: [...EXPENSES],
    accounts: [...ACCOUNTS],
    transactions: [...TRANSACTIONS],

    addExpense: (exp) => set(state => ({
      expenses: [exp, ...state.expenses],
    })),

    addAccount: (acc) => set(state => ({
      accounts: [acc, ...state.accounts],
    })),

    addTransaction: (txn) => set(state => ({
      transactions: [txn, ...state.transactions],
    })),

    updateAccountBalance: (accountId, delta) => set(state => ({
      accounts: state.accounts.map(a =>
        a.id === accountId ? { ...a, balance: a.balance + delta } : a
      ),
    })),

    // ── UI
    sidebarCollapsed: false,
    toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    mobileSidebarOpen: false,
    setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    toggleMobileSidebar: () => set(state => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
    activeSearch: '',
    setActiveSearch: (q) => set({ activeSearch: q }),
  }))
);

// Ensure dark mode class is cleaned up
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark');
  localStorage.removeItem('slicemart_theme');
}
