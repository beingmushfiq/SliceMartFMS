// ─────────────────────────────────────────────────────────────
// INSTANT QUICK-ENTRY MODAL SUITE
// Enables in-context creation of Customers, Suppliers, Products,
// Raw Materials, Employees, Accounts, and BOMs during any operation.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Plus, UserPlus, Building2, Package,
  Layers, Wallet, Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type {
  Customer, Supplier, Product, RawMaterial,
  Employee, Account, Unit, ProductCategory, ShiftName
} from '../../types';

// ── Reusable Inline Trigger Button ────────────────────────────
export function QuickAddButton({
  label = 'New',
  onClick,
  className = '',
}: {
  label?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-2xs font-700 text-blue-600 bg-blue-50
                 hover:bg-blue-100 active:bg-blue-200 border border-blue-200/80 rounded-md
                 transition-all cursor-pointer shadow-2xs hover:scale-102 ${className}`}
      title={`Quick Add ${label}`}
    >
      <Plus className="w-3 h-3 text-blue-600 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

// ── 1. QUICK ADD CUSTOMER MODAL ───────────────────────────────
export function QuickAddCustomerModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (customer: Customer) => void;
}) {
  const addCustomer = useAppStore(s => s.addCustomer);
  const customers = useAppStore(s => s.customers);

  const [name, setName] = useState('');
  const [type, setType] = useState<'b2b' | 'b2c'>('b2b');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const nextNo = `C-${(customers.length + 1).toString().padStart(4, '0')}`;
    const newCustomer: Customer = {
      id: `CUS-${Date.now().toString().slice(-4)}`,
      customerNo: nextNo,
      name: name.trim(),
      type,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Dhaka, Bangladesh',
      area: area.trim() || 'Dhaka',
      creditLimit: parseFloat(creditLimit) || 0,
      balance: 0,
      totalPurchases: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCustomer(newCustomer);
    if (onCreated) onCreated(newCustomer);

    // Reset & close
    setName('');
    setPhone('');
    setEmail('');
    setArea('');
    setAddress('');
    setCreditLimit('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Customer Entry</h3>
              <p className="text-2xs text-slate-500">Register customer instantly without leaving current transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label text-2xs">Customer / Enterprise Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Dhaka Electronics Hub"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Category</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'b2b' | 'b2c')}
                className="form-select text-xs"
              >
                <option value="b2b">B2B Dealer</option>
                <option value="b2c">B2C Retail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="017XX-XXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Email (Optional)</label>
              <input
                type="email"
                placeholder="client@mail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Area / District</label>
              <input
                type="text"
                placeholder="e.g. Nawabpur, Dhaka"
                value={area}
                onChange={e => setArea(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Credit Limit (৳)</label>
              <input
                type="number"
                placeholder="0"
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="form-label text-2xs">Full Shop / Delivery Address</label>
            <input
              type="text"
              placeholder="Shop #12, Market Rd, Dhaka"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Select Customer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── 2. QUICK ADD SUPPLIER MODAL ───────────────────────────────
export function QuickAddSupplierModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (supplier: Supplier) => void;
}) {
  const addSupplier = useAppStore(s => s.addSupplier);
  const suppliers = useAppStore(s => s.suppliers);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const nextNo = `S-${(suppliers.length + 1).toString().padStart(4, '0')}`;
    const newSupplier: Supplier = {
      id: `SUP-${Date.now().toString().slice(-4)}`,
      supplierNo: nextNo,
      name: name.trim(),
      contactPerson: contactPerson.trim() || 'Manager',
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Dhaka, Bangladesh',
      area: area.trim() || 'Dhaka',
      paymentTerms,
      creditLimit: 200000,
      balance: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addSupplier(newSupplier);
    if (onCreated) onCreated(newSupplier);

    // Reset & close
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setArea('');
    setAddress('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Supplier / Vendor Onboarding</h3>
              <p className="text-2xs text-slate-500">Create vendor profile and immediately issue purchase orders</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Supplier / Company Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Apex Hardware Ltd."
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Md. Kamal"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="017XX-XXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="form-select text-xs"
              >
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Email (Optional)</label>
              <input
                type="email"
                placeholder="sales@vendor.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Area / Industrial Zone</label>
              <input
                type="text"
                placeholder="e.g. Tejgaon I/A, Dhaka"
                value={area}
                onChange={e => setArea(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="form-label text-2xs">Full Office / Factory Address</label>
            <input
              type="text"
              placeholder="Plot #45, Road #3, Dhaka"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Select Supplier
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── 3. QUICK ADD RAW MATERIAL MODAL ───────────────────────────
export function QuickAddMaterialModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (material: RawMaterial) => void;
}) {
  const addRawMaterial = useAppStore(s => s.addRawMaterial);
  const rawMaterials = useAppStore(s => s.rawMaterials);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [unit, setUnit] = useState<Unit>('pcs');
  const [costPrice, setCostPrice] = useState('');
  const [minStock, setMinStock] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nextId = `RM-${(rawMaterials.length + 1).toString().padStart(3, '0')}`;
    const newMaterial: RawMaterial = {
      id: nextId,
      sku: `RM-${name.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      unit,
      costPrice: parseFloat(costPrice) || 0,
      minStock: parseInt(minStock, 10) || 50,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addRawMaterial(newMaterial);
    if (onCreated) onCreated(newMaterial);

    setName('');
    setCostPrice('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Raw Material Entry</h3>
              <p className="text-2xs text-slate-500">Auto-adds to Warehouse A stock catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="form-label text-2xs">Material Description / Component Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Ceramic Base Plate (20cm)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-select text-xs"
              >
                <option value="Electrical">Electrical</option>
                <option value="Glass & Ceramic">Glass & Ceramic</option>
                <option value="Metal">Metal</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electronics">Electronics</option>
                <option value="Safety">Safety</option>
                <option value="Packaging">Packaging</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>
            <div>
              <label className="form-label text-2xs">Stock Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as Unit)}
                className="form-select text-xs"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="set">Set</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="roll">Roll</option>
                <option value="box">Box</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Unit Cost Price (৳)</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Min Stock Threshold</label>
              <input
                type="number"
                value={minStock}
                onChange={e => setMinStock(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Material
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── 4. QUICK ADD FINISHED PRODUCT / MODEL MODAL ───────────────
export function QuickAddProductModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (product: Product) => void;
}) {
  const addProduct = useAppStore(s => s.addProduct);
  const products = useAppStore(s => s.products);

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<ProductCategory>('infrared_cooker');
  const [sellingPrice, setSellingPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minStock, setMinStock] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nextId = `PRD-${(products.length + 1).toString().padStart(3, '0')}`;
    const modelStr = model.trim() || `SM-${Math.floor(100 + Math.random() * 900)}`;
    const newProduct: Product = {
      id: nextId,
      sku: `IR-${modelStr}`,
      name: name.trim(),
      model: modelStr,
      category,
      type: 'finished_good',
      unit: 'pcs',
      sellingPrice: parseFloat(sellingPrice) || 2000,
      wholesalePrice: parseFloat(wholesalePrice) || parseFloat(sellingPrice) * 0.85 || 1700,
      costPrice: parseFloat(costPrice) || parseFloat(sellingPrice) * 0.65 || 1300,
      minStock: parseInt(minStock, 10) || 30,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProduct(newProduct);
    if (onCreated) onCreated(newProduct);

    setName('');
    setModel('');
    setSellingPrice('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Finished Product Model</h3>
              <p className="text-2xs text-slate-500">Auto-adds to Warehouse B finished goods catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label text-2xs">Product Model Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Infrared Cooker IR-105"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Model Code</label>
              <input
                type="text"
                placeholder="IR-105"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ProductCategory)}
                className="form-select text-xs"
              >
                <option value="infrared_cooker">Infrared Cooker</option>
                <option value="infrared_stove">Infrared Stove</option>
                <option value="accessory">Accessory</option>
                <option value="spare_part">Spare Part</option>
              </select>
            </div>
            <div>
              <label className="form-label text-2xs">Retail Price (৳) *</label>
              <input
                type="number"
                required
                placeholder="2200"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label text-2xs">Wholesale Price (৳)</label>
              <input
                type="number"
                placeholder="1900"
                value={wholesalePrice}
                onChange={e => setWholesalePrice(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Estimated Cost (৳)</label>
              <input
                type="number"
                placeholder="1350"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Min Stock</label>
              <input
                type="number"
                placeholder="30"
                value={minStock}
                onChange={e => setMinStock(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Product Model
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── 5. QUICK ADD EMPLOYEE / WORKER MODAL ──────────────────────
export function QuickAddEmployeeModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (employee: Employee) => void;
}) {
  const addEmployee = useAppStore(s => s.addEmployee);
  const employees = useAppStore(s => s.employees);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Assembly Worker');
  const [department, setDepartment] = useState('Production');
  const [shift, setShift] = useState<ShiftName>('morning');
  const [salary, setSalary] = useState('14000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const nextEmpId = `SM-${(employees.length + 1).toString().padStart(3, '0')}`;
    const newEmployee: Employee = {
      id: `EMP-${(employees.length + 1).toString().padStart(3, '0')}`,
      employeeId: nextEmpId,
      name: name.trim(),
      phone: phone.trim(),
      designation,
      department,
      shift,
      salary: parseFloat(salary) || 14000,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      address: 'Dhaka, Bangladesh',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addEmployee(newEmployee);
    if (onCreated) onCreated(newEmployee);

    setName('');
    setPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Worker / Staff Onboarding</h3>
              <p className="text-2xs text-slate-500">Add operator for immediate line shift allocation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="form-label text-2xs">Worker / Employee Full Name *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Md. Tariqul Islam"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-2xs">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="017XX-XXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Designation</label>
              <select
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                className="form-select text-xs"
              >
                <option value="Assembly Worker">Assembly Worker</option>
                <option value="Senior Production Worker">Senior Production Worker</option>
                <option value="QC Inspector">QC Inspector</option>
                <option value="Packing Worker">Packing Worker</option>
                <option value="Electrical Technician">Electrical Technician</option>
                <option value="Storekeeper">Storekeeper</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label text-2xs">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="form-select text-xs"
              >
                <option value="Production">Production</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="form-label text-2xs">Assigned Shift</label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value as ShiftName)}
                className="form-select text-xs"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="form-label text-2xs">Salary (৳)</label>
              <input
                type="number"
                placeholder="14000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Worker
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── 6. QUICK ADD FINANCIAL ACCOUNT MODAL ──────────────────────
export function QuickAddAccountModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (account: Account) => void;
}) {
  const addAccount = useAppStore(s => s.addAccount);
  const accounts = useAppStore(s => s.accounts);

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'mobile_banking'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [balance, setBalance] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAccount: Account = {
      id: `ACC-${(accounts.length + 1).toString().padStart(3, '0')}`,
      name: name.trim(),
      type,
      bankName: type === 'bank' ? bankName.trim() : undefined,
      accountNo: type !== 'cash' ? accountNo.trim() : undefined,
      balance: parseFloat(balance) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    addAccount(newAccount);
    if (onCreated) onCreated(newAccount);

    setName('');
    setBankName('');
    setAccountNo('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-700 text-slate-900">Instant Payment Account Entry</h3>
              <p className="text-2xs text-slate-500">Register new Cash drawer, Bank, or Mobile Wallet (bKash/Nagad)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="form-label text-2xs">Account Display Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. City Bank - Corporate"
                value={name}
                onChange={e => setName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label text-2xs">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'cash' | 'bank' | 'mobile_banking')}
                className="form-select text-xs"
              >
                <option value="bank">Bank</option>
                <option value="mobile_banking">MFS (bKash/Nagad)</option>
                <option value="cash">Cash Box</option>
              </select>
            </div>
          </div>

          {type === 'bank' && (
            <div>
              <label className="form-label text-2xs">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. City Bank Ltd."
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="form-input text-xs"
              />
            </div>
          )}

          {type !== 'cash' && (
            <div>
              <label className="form-label text-2xs">Account / Wallet Number</label>
              <input
                type="text"
                placeholder="e.g. 110-234567890 or 017XXXXXXXX"
                value={accountNo}
                onChange={e => setAccountNo(e.target.value)}
                className="form-input text-xs font-mono"
              />
            </div>
          )}

          <div>
            <label className="form-label text-2xs">Initial Opening Balance (৳)</label>
            <input
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              className="form-input text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-600 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-600 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Account
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
