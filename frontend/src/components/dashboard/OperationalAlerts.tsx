// ─────────────────────────────────────────────────────────────
// OPERATIONAL ALERTS BAR — Graceful, executive attention center
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, AlertTriangle, ArrowRight,
  ChevronDown, ChevronUp, ShoppingCart, Eye,
  CheckCircle2, X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { InventoryItem } from '../../types';

interface OperationalAlertsProps {
  outOfStockItems: InventoryItem[];
  lowStockItems: InventoryItem[];
}

export function OperationalAlerts({
  outOfStockItems,
  lowStockItems,
}: OperationalAlertsProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const totalAlerts = outOfStockItems.length + lowStockItems.length;

  if (totalAlerts === 0 || dismissed) {
    return null;
  }

  const criticalCount = outOfStockItems.length;
  const warningCount  = lowStockItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Top Accent Gradient Line */}
      <div
        className={`h-1 w-full ${
          criticalCount > 0
            ? 'bg-linear-to-r from-error-500 via-amber-500 to-blue-500'
            : 'bg-linear-to-r from-amber-400 via-amber-500 to-blue-400'
        }`}
      />

      {/* Main Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Pulsing Alert Indicator */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              criticalCount > 0
                ? 'bg-error-50 text-error-600 border border-error-200/60'
                : 'bg-amber-50 text-amber-600 border border-amber-200/60'
            }`}
          >
            {criticalCount > 0 ? (
              <AlertCircle className="w-4 h-4 animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-700 uppercase tracking-wider text-slate-900">
                Operational Attention Required
              </h3>
              <div className="flex items-center gap-1.5">
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 text-2xs font-700 bg-error-100 text-error-800 rounded-full border border-error-200">
                    {criticalCount} Critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2 py-0.5 text-2xs font-700 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {warningCount} Low Stock
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">
              Production materials below minimum threshold in Warehouse A
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setCollapsed(c => !c)}
            leftIcon={collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            className="text-slate-600 hover:text-slate-900 text-2xs font-600"
          >
            {collapsed ? `Show Details (${totalAlerts})` : 'Hide'}
          </Button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Dismiss alert bar"
            title="Dismiss from dashboard view"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Alert Cards Grid */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100 bg-white p-3.5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Out of Stock Critical Items */}
              {outOfStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-error-200/80
                             bg-linear-to-br from-error-50/40 to-white hover:border-error-300 transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error-600" />
                      <span className="text-2xs font-700 uppercase tracking-wider text-error-700">
                        Out of Stock
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">· {item.warehouseId}</span>
                    </div>
                    <h4 className="text-xs font-700 text-slate-900 truncate" title={item.itemName}>
                      {item.itemName}
                    </h4>
                    <p className="text-2xs text-slate-500 mt-0.5 font-mono">
                      Current: <span className="font-700 text-error-600">0 {item.unit}</span> (Min: {item.minStock})
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => navigate('/procurement/orders')}
                    leftIcon={<ShoppingCart className="w-3 h-3" />}
                    className="shrink-0 bg-error-600 hover:bg-error-700 active:bg-error-800 text-2xs py-1 px-2.5 shadow-none"
                  >
                    Order PO
                  </Button>
                </div>
              ))}

              {/* Low Stock Warning Items */}
              {lowStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-amber-200/80
                             bg-linear-to-br from-amber-50/40 to-white hover:border-amber-300 transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-2xs font-700 uppercase tracking-wider text-amber-700">
                        Low Stock
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">· {item.warehouseId}</span>
                    </div>
                    <h4 className="text-xs font-700 text-slate-900 truncate" title={item.itemName}>
                      {item.itemName}
                    </h4>
                    <p className="text-2xs text-slate-500 mt-0.5 font-mono">
                      Current: <span className="font-700 text-amber-600">{item.qty} {item.unit}</span> (Min: {item.minStock})
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => navigate('/inventory/materials')}
                    leftIcon={<Eye className="w-3 h-3" />}
                    className="shrink-0 text-2xs py-1 px-2.5 border-amber-300 hover:bg-amber-50"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>

            {/* Bottom Footer Tip */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                Raw materials can be requisitioned or ordered directly via Procurement.
              </span>
              <button
                onClick={() => navigate('/inventory/materials')}
                className="text-blue-600 hover:text-blue-800 font-600 flex items-center gap-0.5 cursor-pointer"
              >
                View Full Inventory Ledger <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
