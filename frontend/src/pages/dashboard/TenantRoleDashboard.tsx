import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  ShieldCheck,
  Package,
  FileText,
  Radio,
  Download,
  Calendar,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  OrderPOModal,
  StockReviewModal,
  QCAuditModal,
  InvoiceQuickViewModal,
  CustomDateRangeModal,
  WorkerDetailModal,
  ProductionOrderDetailModal,
  type OrderPOItem,
} from './components/DashboardModals';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { promptPWAInstall, isPWAInstallable } from '../../registerSW';

// ── Types & Datasets ──────────────────────────────────────────

type TimeframeType = 'today' | '7days' | '30days' | 'custom';

interface ProductionStat {
  target: number;
  produced: number;
  pendingOrders: number;
  qcPending: number;
  reworkQty: number;
  achievement: number;
}

const TODAY_PRODUCTION_STAT: ProductionStat = {
  target: 50,
  produced: 48,
  pendingOrders: 1,
  qcPending: 1,
  reworkQty: 5,
  achievement: 96,
};

// Chart series by timeframe
const TREND_TODAY = [
  { time: '08:00', produced: 6, qcPassed: 6, target: 8 },
  { time: '10:00', produced: 18, qcPassed: 17, target: 16 },
  { time: '12:00', produced: 28, qcPassed: 27, target: 26 },
  { time: '14:00', produced: 38, qcPassed: 36, target: 36 },
  { time: '16:00', produced: 45, qcPassed: 43, target: 44 },
  { time: '18:00', produced: 48, qcPassed: 46, target: 50 },
];

const TREND_7DAYS = [
  { time: 'Aug 11', produced: 185, qcPassed: 180, target: 190 },
  { time: 'Aug 12', produced: 190, qcPassed: 188, target: 190 },
  { time: 'Aug 13', produced: 170, qcPassed: 168, target: 185 },
  { time: 'Aug 14', produced: 180, qcPassed: 177, target: 185 },
  { time: 'Aug 15', produced: 195, qcPassed: 192, target: 190 },
  { time: 'Aug 16', produced: 205, qcPassed: 200, target: 200 },
  { time: 'Aug 17', produced: 48, qcPassed: 46, target: 50 },
];

const TREND_30DAYS = [
  { time: 'Week 1', produced: 1240, qcPassed: 1215, target: 1200 },
  { time: 'Week 2', produced: 1310, qcPassed: 1285, target: 1250 },
  { time: 'Week 3', produced: 1290, qcPassed: 1260, target: 1250 },
  { time: 'Week 4', produced: 1420, qcPassed: 1390, target: 1350 },
  { time: 'Week 5', produced: 680, qcPassed: 665, target: 700 },
];

export const TenantRoleDashboard: React.FC = () => {
  // ── State variables ──────────────────────────────────────────
  const [isAlertBannerVisible, setIsAlertBannerVisible] = useState(true);
  const [isAlertBannerExpanded, setIsAlertBannerExpanded] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeType>('7days');
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [salesFilter, setSalesFilter] = useState<'all' | 'DELIVERED' | 'CONFIRMED'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'QC PENDING' | 'COMPLETED' | 'READY'>('all');

  // Helper to check whether PWA prompt is allowed to show
  const isPwaEligible = (): boolean => {
    if (typeof window === 'undefined') return false;
    const isInstalled =
      localStorage.getItem('slicemart_pwa_installed') === 'true' ||
      localStorage.getItem('pwa_installed') === 'true';
    const isDismissed =
      localStorage.getItem('slicemart_pwa_dismissed') === 'true' ||
      localStorage.getItem('pwa_dismissed') === 'true';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    return !isInstalled && !isDismissed && !isStandalone;
  };

  // Only show if eligible AND native browser install prompt is operational
  const [showPwaPrompt, setShowPwaPrompt] = useState(() => {
    return isPwaEligible() && isPWAInstallable();
  });

  React.useEffect(() => {
    if (!isPwaEligible()) {
      setShowPwaPrompt(false);
      return;
    }

    if (isPWAInstallable()) {
      setShowPwaPrompt(true);
    }

    const handleInstallAvailable = () => {
      if (isPwaEligible()) {
        setShowPwaPrompt(true);
      }
    };

    const handleBeforeInstall = () => {
      if (isPwaEligible()) {
        setShowPwaPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem('slicemart_pwa_installed', 'true');
      localStorage.setItem('slicemart_pwa_dismissed', 'true');
      localStorage.setItem('pwa_installed', 'true');
      localStorage.setItem('pwa_dismissed', 'true');
      setShowPwaPrompt(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    try {
      const accepted = await promptPWAInstall();
      if (accepted) {
        toast.success('SliceMart FMS Installed', {
          description: 'Application successfully added to your home screen.',
        });
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    } finally {
      localStorage.setItem('slicemart_pwa_installed', 'true');
      localStorage.setItem('slicemart_pwa_dismissed', 'true');
      localStorage.setItem('pwa_installed', 'true');
      localStorage.setItem('pwa_dismissed', 'true');
      setShowPwaPrompt(false);
    }
  };

  const handleDismissPwa = () => {
    localStorage.setItem('slicemart_pwa_dismissed', 'true');
    localStorage.setItem('pwa_dismissed', 'true');
    setShowPwaPrompt(false);
  };

  // Modals state
  const [orderPoItem, setOrderPoItem] = useState<OrderPOItem | null>(null);
  const [reviewStockItem, setReviewStockItem] = useState<OrderPOItem | null>(null);
  const [selectedQCItem, setSelectedQCItem] = useState<{
    id: string;
    orderNo: string;
    product: string;
    qty: number;
    status: string;
    rework?: number;
    failed?: number;
  } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    customer: string;
    type: 'B2B' | 'B2C';
    amount: string;
    status: string;
    payment: string;
  } | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<{
    initials: string;
    name: string;
    output: string;
    rate: number;
    badge: string;
    color: string;
  } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    product: string;
    target: number;
    produced: number;
    progress: number;
    status: string;
  } | null>(null);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customRangeLabel, setCustomRangeLabel] = useState<string | null>(null);

  // Production KPIs for single daily operational shift
  const currentKPIs = TODAY_PRODUCTION_STAT;

  // Chart data resolution
  const chartData = useMemo(() => {
    switch (timeframe) {
      case 'today':
        return TREND_TODAY;
      case '30days':
        return TREND_30DAYS;
      case 'custom':
        return TREND_7DAYS;
      case '7days':
      default:
        return TREND_7DAYS;
    }
  }, [timeframe]);

  // Operational Attention Items
  const attentionItems: OrderPOItem[] = [
    {
      id: 'item-pcb',
      name: 'PCB Control Board',
      sku: 'RAW-PCB-101',
      warehouse: 'WH-A',
      currentStock: 0,
      minThreshold: 200,
      unit: 'pcs',
      suggestedQty: 250,
    },
    {
      id: 'item-glass',
      name: 'Toughened Glass Top (30cm)',
      sku: 'RAW-GLS-300',
      warehouse: 'WH-A',
      currentStock: 45,
      minThreshold: 150,
      unit: 'pcs',
      suggestedQty: 150,
    },
    {
      id: 'item-regulator',
      name: 'Heat Regulator (Bi-metal)',
      sku: 'RAW-REG-202',
      warehouse: 'WH-A',
      currentStock: 85,
      minThreshold: 200,
      unit: 'pcs',
      suggestedQty: 200,
    },
  ];

  // Invoices list
  const invoices = [
    {
      id: 'INV-0715',
      customer: 'Rahman Electronics & Hardware',
      type: 'B2B' as const,
      amount: '৳ 14,000',
      status: 'DELIVERED',
      payment: 'PARTIAL',
    },
    {
      id: 'INV-0716',
      customer: 'Md. Shahidul Islam',
      type: 'B2C' as const,
      amount: '৳ 1,750',
      status: 'DELIVERED',
      payment: 'PAID',
    },
    {
      id: 'INV-0717',
      customer: 'Karim Trading Corporation',
      type: 'B2B' as const,
      amount: '৳ 59,500',
      status: 'CONFIRMED',
      payment: 'UNPAID',
    },
  ];

  const filteredInvoices = useMemo(() => {
    if (salesFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === salesFilter);
  }, [salesFilter, invoices]);

  // Production orders
  const productionOrders = [
    {
      id: 'PO-00125',
      product: 'Infrared Cooker IR-101',
      code: 'IR-101',
      target: 50,
      produced: 48,
      progress: 96,
      status: 'QC PENDING',
    },
    {
      id: 'PO-00124',
      product: 'Infrared Stove IS-201',
      code: 'IS-201',
      target: 40,
      produced: 40,
      progress: 100,
      status: 'COMPLETED',
    },
    {
      id: 'PO-00126',
      product: 'Infrared Cooker IR-104',
      code: 'IR-104',
      target: 60,
      produced: 0,
      progress: 0,
      status: 'READY',
    },
    {
      id: 'PO-00123',
      product: 'Infrared Cooker IR-102',
      code: 'IR-102',
      target: 30,
      produced: 30,
      progress: 100,
      status: 'COMPLETED',
    },
  ];

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return productionOrders;
    return productionOrders.filter((ord) => ord.status === orderFilter);
  }, [orderFilter, productionOrders]);

  // QC Items
  const qcList = [
    {
      id: 'QC-00125',
      orderNo: 'PO-00125',
      product: 'Infrared Cooker IR-101',
      qty: 48,
      status: 'PENDING',
    },
    {
      id: 'QC-00124',
      orderNo: 'PO-00124',
      product: 'Infrared Stove IS-201',
      qty: 40,
      status: 'PASSED',
      failed: 2,
      rework: 2,
    },
    {
      id: 'QC-00123',
      orderNo: 'PO-00123',
      product: 'Infrared Cooker IR-102 (Premium)',
      qty: 30,
      status: 'RE-TESTED',
      failed: 1,
      rework: 1,
    },
  ];

  // Workers
  const workers = [
    {
      initials: 'MA',
      name: 'Abdur',
      output: '125k pcs',
      rate: 94,
      badge: 'Senior',
      color: 'bg-emerald-500',
    },
    {
      initials: 'MK',
      name: 'Karim',
      output: '92k pcs',
      rate: 89,
      badge: 'Production',
      color: 'bg-amber-500',
    },
    {
      initials: 'RB',
      name: 'Begum',
      output: '105k pcs',
      rate: 81,
      badge: 'Assembly',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-5 pb-16 max-w-[1600px] mx-auto transition-token-colors">
      {/* ─────────────────────────────────────────────────────────────
          1. OPERATIONAL ATTENTION REQUIRED BANNER
      ───────────────────────────────────────────────────────────── */}
      {isAlertBannerVisible && (
        <div className="rounded-2xl border border-amber-500/30 bg-surface shadow-xs overflow-hidden transition-all duration-300">
          <div className="h-1 bg-linear-to-r from-red-500 via-amber-500 to-orange-400" />
          
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold tracking-tight text-default uppercase">
                  OPERATIONAL ATTENTION REQUIRED
                </h2>
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25 px-2 py-0.5 text-[10px] font-bold">
                    1 Critical
                  </span>
                  <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold">
                    2 Low Stock
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAlertBannerExpanded(!isAlertBannerExpanded)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                >
                  <span>{isAlertBannerExpanded ? 'Hide' : 'Show'}</span>
                  {isAlertBannerExpanded ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlertBannerVisible(false)}
                  className="rounded-lg p-1 text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                  title="Dismiss alert banner"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-muted mt-1">
              Production materials below minimum threshold in Warehouse A
            </p>

            {isAlertBannerExpanded && (
              <div className="mt-4 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {attentionItems.map((item) => {
                    const isOutOfStock = item.currentStock <= 0;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-all ${
                          isOutOfStock
                            ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                            : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                isOutOfStock ? 'text-red-500' : 'text-amber-500'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isOutOfStock ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                              />
                              {isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                            </span>
                            <span className="text-[10px] text-muted font-mono">{item.warehouse}</span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-default truncate">{item.name}</h3>
                          <p className="text-[11px] text-muted font-mono">
                            Current: <strong className={isOutOfStock ? 'text-red-500' : 'text-amber-500'}>{item.currentStock} {item.unit}</strong>{' '}
                            (Min: {item.minThreshold})
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isOutOfStock ? (
                            <button
                              type="button"
                              onClick={() => setOrderPoItem(item)}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="size-3.5" />
                              <span>Order PO</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReviewStockItem(item)}
                              className="flex items-center gap-1.5 rounded-lg border border-default bg-surface px-3 py-1.5 text-xs font-semibold text-default hover:bg-surface-sunken transition-colors cursor-pointer"
                            >
                              <Eye className="size-3.5 text-muted" />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-default text-[11px] text-muted">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Raw materials can be requisitioned or ordered directly via Procurement.</span>
                  </div>
                  <Link
                    to="/inventory"
                    className="font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Full Inventory Ledger</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. TODAY'S PRODUCTION HEADER & 6-KPI CARDS DECK
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-default">
              Today's Production
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
              <span>17 August 2026</span>
              <span>•</span>
              <span className="font-medium text-default">Daily Factory Run</span>
            </div>
          </div>

          <Link
            to="/production"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>View orders</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* 6 Metric KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: Today's Target */}
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                TODAY'S TARGET
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <FileText className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {currentKPIs.target}
            </div>
          </div>

          {/* Card 2: Produced (with green left border) */}
          <div className="rounded-2xl border-y border-r border-default border-l-4 border-l-emerald-500 bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                PRODUCED
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="size-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-default">
                {currentKPIs.produced}
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                {currentKPIs.achievement}% of target
              </span>
            </div>
          </div>

          {/* Card 3: Pending Orders */}
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                PENDING ORDERS
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-surface-sunken text-muted">
                <Package className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {currentKPIs.pendingOrders}
            </div>
          </div>

          {/* Card 4: QC Pending */}
          <div className="rounded-2xl border-y border-r border-default border-l-4 border-l-amber-500 bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                QC PENDING
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <ShieldCheck className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {currentKPIs.qcPending}
            </div>
          </div>

          {/* Card 5: Rework Qty */}
          <div className="rounded-2xl border border-default bg-surface p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                REWORK QTY
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <RotateCcw className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-default">
              {currentKPIs.reworkQty}
            </div>
          </div>

          {/* Card 6: Achievement */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-token-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ACHIEVEMENT
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {currentKPIs.achievement}%
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. PRODUCTION TREND & INVENTORY HEALTH (ROW 1)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (~65% / 8 cols): Production Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-default">Production Trend</h3>
                {isLiveTelemetry && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted">Target vs Produced vs Passed QC</p>
            </div>

            {/* Timeframe selector tabs: Today, 7 Days, 30 Days, Custom Range */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center rounded-lg border border-default bg-surface-sunken p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTimeframe('today');
                    setCustomRangeLabel(null);
                  }}
                  className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                    timeframe === 'today'
                      ? 'bg-default text-surface shadow-xs font-bold'
                      : 'text-muted hover:text-default'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeframe('7days');
                    setCustomRangeLabel(null);
                  }}
                  className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                    timeframe === '7days'
                      ? 'bg-default text-surface shadow-xs font-bold'
                      : 'text-muted hover:text-default'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeframe('30days');
                    setCustomRangeLabel(null);
                  }}
                  className={`rounded-md px-2.5 py-1 transition-all cursor-pointer ${
                    timeframe === '30days'
                      ? 'bg-default text-surface shadow-xs font-bold'
                      : 'text-muted hover:text-default'
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomDateOpen(true)}
                  className={`rounded-md px-2.5 py-1 flex items-center gap-1 transition-all cursor-pointer ${
                    timeframe === 'custom'
                      ? 'bg-default text-surface shadow-xs font-bold'
                      : 'text-muted hover:text-default'
                  }`}
                >
                  <Calendar className="size-3" />
                  <span>{customRangeLabel ?? 'Custom Range'}</span>
                </button>
              </div>

              {/* Live Telemetry Toggle */}
              <button
                type="button"
                onClick={() => setIsLiveTelemetry(!isLiveTelemetry)}
                title="Toggle Real-Time Telemetry Stream"
                className={`rounded-lg p-1.5 border transition-colors cursor-pointer ${
                  isLiveTelemetry
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600'
                    : 'border-default bg-surface text-muted hover:text-default'
                }`}
              >
                <Radio className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Recharts Area/Line Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientProduced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="var(--color-text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  stroke="var(--color-text-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const producedVal = Number(payload.find((p) => p.dataKey === 'produced')?.value ?? 0);
                      const qcVal = Number(payload.find((p) => p.dataKey === 'qcPassed')?.value ?? 0);
                      const targetVal = Number(payload.find((p) => p.dataKey === 'target')?.value ?? 0);
                      const yieldPct = producedVal > 0 ? ((qcVal / producedVal) * 100).toFixed(1) : '100';

                      return (
                        <div className="rounded-xl border border-default bg-surface-raised p-3 shadow-xl text-xs space-y-1.5">
                          <p className="font-bold text-default">{label}</p>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-4 text-blue-500">
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-blue-500" />
                                Produced:
                              </span>
                              <strong className="font-mono">{producedVal} pcs</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-emerald-500">
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                QC Passed:
                              </span>
                              <strong className="font-mono">{qcVal} pcs ({yieldPct}%)</strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-slate-400" />
                                Target:
                              </span>
                              <strong className="font-mono">{targetVal} pcs</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="produced"
                  name="Produced"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="url(#gradientProduced)"
                />
                <Line
                  type="monotone"
                  dataKey="qcPassed"
                  name="QC Passed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-muted pt-2 border-t border-default/60">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" />
              Produced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              QC Passed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 border-t border-dashed border-slate-400" />
              Target
            </span>
          </div>
        </div>

        {/* Right Column (~35% / 4 cols): Inventory Health */}
        <div className="lg:col-span-4 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-default">Inventory Health</h3>
            <Link to="/inventory" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          {/* 2 Big Stat Tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-default bg-surface-sunken p-3.5 space-y-1">
              <div className="text-2xl font-extrabold font-mono text-default">15</div>
              <div className="text-[11px] font-semibold text-muted">Raw Materials</div>
              <div className="text-xs font-bold font-mono text-default">৳ 8.5L</div>
              <div className="text-[10px] text-muted font-mono">6,370 pcs</div>
            </div>

            <div className="rounded-xl border border-default bg-surface-sunken p-3.5 space-y-1">
              <div className="text-2xl font-extrabold font-mono text-default">482</div>
              <div className="text-[11px] font-semibold text-muted">Finished Goods</div>
              <div className="text-xs font-bold font-mono text-default">৳ 6.1L</div>
              <div className="text-[10px] text-muted font-mono">7 SKUs</div>
            </div>
          </div>

          {/* Alert Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-red-500/25 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span className="font-semibold">Out of stock</span>
              </div>
              <span className="font-bold font-mono text-sm">1</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <Package className="size-4 shrink-0" />
                <span className="font-semibold">Low stock</span>
              </div>
              <span className="font-bold font-mono text-sm">5</span>
            </div>
          </div>

          {/* Warehouse Distribution Bars */}
          <div className="space-y-3 pt-1 border-t border-default/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              WAREHOUSE DISTRIBUTION
            </span>

            {/* WH-A */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-medium text-default">WH-A Raw Materials</span>
                <span className="font-mono text-muted">
                  <strong className="text-default">6,370</strong> / 5,000 pcs
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }} />
              </div>
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-amber-500">127% (Overcapacity)</span>
              </div>
            </div>

            {/* WH-B */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="font-medium text-default">WH-B Finished Goods</span>
                <span className="font-mono text-muted">
                  <strong className="text-default">482</strong> / 1,000 pcs
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '48%' }} />
              </div>
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-emerald-600">48% Utilization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SALES OVERVIEW & TODAY'S PERFORMANCE (ROW 2)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (~65% / 8 cols): Sales Overview */}
        <div className="lg:col-span-8 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <div>
              <h3 className="text-sm font-bold text-default">Sales Overview</h3>
              <p className="text-[11px] text-muted">August 2026</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-default bg-surface-sunken p-0.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSalesFilter('all')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    salesFilter === 'all' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSalesFilter('DELIVERED')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    salesFilter === 'DELIVERED' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  Delivered
                </button>
                <button
                  type="button"
                  onClick={() => setSalesFilter('CONFIRMED')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    salesFilter === 'CONFIRMED' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  Confirmed
                </button>
              </div>

              <Link to="/sales" className="text-xs font-semibold text-primary hover:underline">
                View all sales
              </Link>
            </div>
          </div>

          {/* 4 Metric Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-default">৳ 61,350</div>
              <div className="text-[11px] text-muted">Today's Sales</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-default">৳ 1.1L</div>
              <div className="text-[11px] text-muted">Monthly Revenue</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-red-500">৳ 83.5K</div>
              <div className="text-[11px] text-muted">Outstanding</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-default">1</div>
              <div className="text-[11px] text-muted">Pending Delivery</div>
            </div>
          </div>

          {/* Sales Invoices Table */}
          <div className="overflow-x-auto rounded-xl border border-default">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
                <tr>
                  <th className="px-3.5 py-2.5">INVOICE</th>
                  <th className="px-3.5 py-2.5">CUSTOMER</th>
                  <th className="px-3.5 py-2.5">TYPE</th>
                  <th className="px-3.5 py-2.5">AMOUNT</th>
                  <th className="px-3.5 py-2.5">STATUS</th>
                  <th className="px-3.5 py-2.5">PAYMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default font-sans">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-surface-sunken/60 cursor-pointer transition-colors"
                  >
                    <td className="px-3.5 py-2.5 font-mono font-bold text-primary">{inv.id}</td>
                    <td className="px-3.5 py-2.5 font-medium text-default">{inv.customer}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="rounded-md bg-blue-500/10 text-blue-500 px-1.5 py-0.5 text-[10px] font-bold">
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono font-semibold text-default">{inv.amount}</td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.status === 'DELIVERED'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-surface-sunken text-muted'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.payment === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : inv.payment === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-red-500/15 text-red-600'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {inv.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Financial Mini Strip */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="group rounded-xl border border-default bg-surface-sunken p-2.5 text-left hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
              title={showBalance ? 'Click to hide balance' : 'Click to show balance'}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-bold font-mono text-default">
                  {showBalance ? '৳ 122,000' : '৳ ••••••'}
                </span>
                {showBalance ? (
                  <Eye className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
                ) : (
                  <EyeOff className="size-3.5 text-muted group-hover:text-primary transition-colors shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-muted flex items-center justify-between mt-1">
                <span>Total Balance</span>
                <span className="text-[9px] text-muted/70">{showBalance ? 'Hide' : 'Show'}</span>
              </div>
            </button>

            <div className="rounded-xl border border-default bg-surface-sunken p-2.5 text-left flex flex-col justify-between">
              <div className="text-xs font-bold font-mono text-default">৳ 0</div>
              <div className="text-[10px] text-muted mt-1">Today's Expenses</div>
            </div>

            <Link
              to="/finance"
              className="group rounded-xl border border-default bg-surface-sunken p-2.5 text-left hover:border-primary/50 transition-all flex flex-col justify-between"
              title="View bank accounts & ledgers"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-default">4</span>
                <ArrowRight className="size-3 text-muted group-hover:text-primary transition-colors" />
              </div>
              <div className="text-[10px] text-muted group-hover:text-primary transition-colors mt-1">
                Active Accounts
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column (~35% / 4 cols): Today's Performance (Leaderboard) */}
        <div className="lg:col-span-4 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <h3 className="text-sm font-bold text-default">Today's Performance</h3>
            <Link to="/workforce" className="text-xs font-semibold text-primary hover:underline">
              Full report
            </Link>
          </div>

          {/* Worker Leaderboard */}
          <div className="space-y-4">
            {workers.map((w) => (
              <div
                key={w.name}
                onClick={() => setSelectedWorker(w)}
                className="group rounded-xl border border-transparent hover:border-default hover:bg-surface-sunken/40 p-2.5 -mx-2.5 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-surface-sunken font-bold text-xs text-default border border-default">
                      {w.initials}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-default group-hover:text-primary transition-colors">
                        {w.name}
                      </span>
                      <span className="block text-[10px] text-muted font-mono">{w.output}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-default">{w.rate}%</span>
                    <span className="block text-[9px] text-muted">{w.badge}</span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.color}`}
                    style={{ width: `${w.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-default">
            <Link
              to="/workforce"
              className="text-xs font-semibold text-muted hover:text-default flex items-center justify-center gap-1"
            >
              <span>View all 10 employees</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. ACTIVE PRODUCTION ORDERS & QUALITY CONTROL (ROW 3)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (~60% / 7 cols): Active Production Orders */}
        <div className="lg:col-span-7 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-default pb-3">
            <h3 className="text-sm font-bold text-default">Active Production Orders</h3>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-default bg-surface-sunken p-0.5 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    orderFilter === 'all' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('QC PENDING')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    orderFilter === 'QC PENDING' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  QC Pending
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('COMPLETED')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    orderFilter === 'COMPLETED' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('READY')}
                  className={`rounded-md px-2 py-0.5 transition-colors cursor-pointer ${
                    orderFilter === 'READY' ? 'bg-default text-surface font-bold' : 'text-muted hover:text-default'
                  }`}
                >
                  Ready
                </button>
              </div>

              <Link to="/production" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-default">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
                <tr>
                  <th className="px-3 py-2.5">ORDER #</th>
                  <th className="px-3 py-2.5">PRODUCT</th>
                  <th className="px-3 py-2.5">TARGET</th>
                  <th className="px-3 py-2.5">PRODUCED</th>
                  <th className="px-3 py-2.5">PROGRESS</th>
                  <th className="px-3 py-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-surface-sunken/60 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-primary">{ord.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-default">{ord.code}</div>
                      <div className="text-[10px] text-muted truncate max-w-40">{ord.product}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold">{ord.target}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold">{ord.produced}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-surface-sunken overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${ord.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted">{ord.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : ord.status === 'QC PENDING'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-blue-500/15 text-blue-600'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (~40% / 5 cols): Quality Control */}
        <div className="lg:col-span-5 rounded-2xl border border-default bg-surface p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <h3 className="text-sm font-bold text-default">Quality Control</h3>
            <Link to="/qc" className="text-xs font-semibold text-primary hover:underline">
              QC Queue
            </Link>
          </div>

          <div className="space-y-3">
            {qcList.map((qc) => (
              <div
                key={qc.id}
                onClick={() => setSelectedQCItem(qc)}
                className="group rounded-xl border border-default bg-surface-sunken/30 hover:border-primary/40 hover:bg-surface-sunken p-3 transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{qc.id}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        qc.status === 'PASSED'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : qc.status === 'PENDING'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-blue-500/15 text-blue-600'
                      }`}
                    >
                      <span className="size-1 rounded-full bg-current" />
                      {qc.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-default">{qc.qty} pcs</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-default">{qc.product}</span>
                  <span className="text-[10px] text-muted font-mono">{qc.orderNo}</span>
                </div>

                {qc.failed !== undefined && (
                  <div className="flex items-center gap-3 text-[10px] text-muted pt-1">
                    <span className="text-red-500">{qc.failed} failed</span>
                    <span className="text-amber-500">{qc.rework} rework</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 3 Summary Pill Counters */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2 text-center">
              <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">1</div>
              <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">PENDING</div>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 text-center">
              <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">1</div>
              <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">PASSED</div>
            </div>
            <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-2 text-center">
              <div className="text-base font-extrabold font-mono text-orange-600 dark:text-orange-400">1</div>
              <div className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase">REWORK</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. RECENT DELIVERIES & WORKFORCE TODAY (ROW 4)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (50% / 6 cols): Recent Deliveries */}
        <div className="lg:col-span-6 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-default">Recent Deliveries</h3>
            </div>
            <Link to="/delivery" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-default">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken text-[10px] uppercase font-bold text-muted border-b border-default">
                <tr>
                  <th className="px-3.5 py-2.5">DELIVERY #</th>
                  <th className="px-3.5 py-2.5">CUSTOMER</th>
                  <th className="px-3.5 py-2.5">ITEMS</th>
                  <th className="px-3.5 py-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                <tr className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-primary">DEL-0201</td>
                  <td className="px-3.5 py-2.5 font-medium text-default truncate max-w-44">
                    Rahman Electronics & Hardware
                  </td>
                  <td className="px-3.5 py-2.5 font-mono">30 pcs</td>
                  <td className="px-3.5 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      <span className="size-1.5 rounded-full bg-current" />
                      DELIVERED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-sunken/60 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono font-bold text-primary">DEL-0202</td>
                  <td className="px-3.5 py-2.5 font-medium text-default truncate max-w-44">
                    Karim Trading Corporation
                  </td>
                  <td className="px-3.5 py-2.5 font-mono">50 pcs</td>
                  <td className="px-3.5 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      <span className="size-1.5 rounded-full bg-current" />
                      PENDING
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (50% / 6 cols): Workforce Today */}
        <div className="lg:col-span-6 rounded-2xl border border-default bg-surface p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-default pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-default">Workforce Attendance Today</h3>
            </div>
            <Link to="/hr" className="text-xs font-semibold text-primary hover:underline">
              View all staff
            </Link>
          </div>

          {/* Single Shift Daily Attendance Counters */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">9</div>
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Present on Floor</div>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">1</div>
              <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Approved Leave</div>
            </div>
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-center">
              <div className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">10</div>
              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Total Headcount</div>
            </div>
          </div>

          {/* Present Today List */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              ACTIVE ON FLOOR TODAY
            </span>
            <div className="space-y-1.5 text-xs">
              {[
                { name: 'Md. Abdur Rahim', role: 'Senior Line Lead' },
                { name: 'Md. Karim Hossain', role: 'Assembly Operator' },
                { name: 'Meshkat Afrose', role: 'Soldering Operator' },
                { name: 'Rima Begum', role: 'Testing & QC' },
                { name: 'Mushfiqur Rahman', role: 'Factory Manager' },
              ].map((emp) => (
                <div
                  key={emp.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-sunken transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-6 items-center justify-center rounded-full bg-surface-sunken text-[10px] font-bold border border-default">
                      {emp.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="font-medium text-default">{emp.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted">{emp.role}</span>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. FLOATING PWA INSTALL PROMPT (CONDITIONAL & THEMED)
      ───────────────────────────────────────────────────────────── */}
      {showPwaPrompt && (
        <aside
          aria-label="PWA Installation Prompt"
          className="fixed bottom-5 right-5 z-40 w-80 sm:w-88 rounded-2xl border border-default bg-surface-raised p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-token-colors animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-default">Install SliceMart FMS</h4>
                <span className="text-[10px] text-muted">Factory Operations PWA</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissPwa}
              className="rounded-lg p-1 text-muted hover:text-default hover:bg-surface-sunken transition-colors cursor-pointer"
              aria-label="Dismiss prompt"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Add to your home screen for quick offline access, full-screen view & faster factory operations.
          </p>
          <div className="mt-3.5 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstallPwa}
              leftIcon={<Download className="size-3.5" />}
            >
              Install App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissPwa}
              className="text-muted hover:text-default"
            >
              Maybe Later
            </Button>
          </div>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. INTERACTIVE DRILL-DOWN MODALS
      ───────────────────────────────────────────────────────────── */}
      <OrderPOModal
        isOpen={Boolean(orderPoItem)}
        onClose={() => setOrderPoItem(null)}
        item={orderPoItem}
      />

      <StockReviewModal
        isOpen={Boolean(reviewStockItem)}
        onClose={() => setReviewStockItem(null)}
        item={reviewStockItem}
      />

      <QCAuditModal
        isOpen={Boolean(selectedQCItem)}
        onClose={() => setSelectedQCItem(null)}
        qcItem={selectedQCItem}
        onInspectDone={(_decision) => {
          // Closed and processed
        }}
      />

      <InvoiceQuickViewModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />

      <WorkerDetailModal
        isOpen={Boolean(selectedWorker)}
        onClose={() => setSelectedWorker(null)}
        worker={selectedWorker}
      />

      <ProductionOrderDetailModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      <CustomDateRangeModal
        isOpen={isCustomDateOpen}
        onClose={() => setIsCustomDateOpen(false)}
        onApply={(start, end) => {
          setTimeframe('custom');
          setCustomRangeLabel(`${start.slice(5)} - ${end.slice(5)}`);
        }}
      />
    </div>
  );
};
