import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Calendar,
  Clock,
  Printer,
  CheckCircle,
  Award,
  BarChart3,
  CreditCard,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShoppingBag,
  Cpu,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDate } from '../utils/formatters';

const PIE_COLORS = ['#1e40af', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

export const DashboardOwnerPage: React.FC = () => {
  const { orders, expenses, materials, purchaseOrders, machines } = useApp();
  const { currentUser } = useAuth();

  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'today'>('all');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<'all' | 'large_format' | 'digital_a3' | 'merchandise'>('all');

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return orders.filter((o) => {
      const orderDateStr = o.createdAt.split('T')[0];
      if (period === 'today') {
        return orderDateStr === todayStr;
      }
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return orderDateStr >= weekAgo;
      }
      if (period === 'month') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        return orderDateStr >= monthStart;
      }
      return true;
    });
  }, [orders, period]);

  // Filter expenses by selected period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((e) => {
      const expDateStr = e.date.split('T')[0];
      if (period === 'today') return expDateStr === todayStr;
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return expDateStr >= weekAgo;
      }
      if (period === 'month') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        return expDateStr >= monthStart;
      }
      return true;
    });
  }, [expenses, period]);

  // 1. Financial KPIs
  const financial = useMemo(() => {
    const totalOmset = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const totalKasMasuk = filteredOrders.reduce((acc, o) => acc + (o.paidAmount || 0), 0);
    const totalPiutang = filteredOrders.reduce((acc, o) => acc + (o.balance || 0), 0);

    // Calculate Estimated Cost of Goods (HPP Modal Bahan)
    let totalHpp = 0;
    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        const mat = materials.find((m) => m.name.toLowerCase() === it.productName.toLowerCase());
        const costPerUnit = mat?.costPrice || (it.unitPrice ? Math.round(it.unitPrice * 0.45) : 10000);
        if (it.lengthM && it.widthM) {
          const area = it.lengthM * it.widthM;
          totalHpp += area * it.qty * costPerUnit;
        } else {
          totalHpp += it.qty * costPerUnit;
        }
      });
    });

    const totalBiayaOperasional = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const labaKotor = Math.max(0, totalOmset - totalHpp);
    const labaBersih = labaKotor - totalBiayaOperasional;
    const profitMargin = totalOmset > 0 ? Math.round((labaBersih / totalOmset) * 100) : 0;
    const averageOrderValue = filteredOrders.length > 0 ? Math.round(totalOmset / filteredOrders.length) : 0;

    return {
      totalOmset,
      totalKasMasuk,
      totalPiutang,
      totalHpp,
      totalBiayaOperasional,
      labaKotor,
      labaBersih,
      profitMargin,
      averageOrderValue,
    };
  }, [filteredOrders, materials, filteredExpenses]);

  // 2. Total Warehouse Stock Valuation (Nilai Total Persediaan Bahan)
  const stockMetrics = useMemo(() => {
    let totalValuation = 0;
    let criticalStockCount = 0;
    let healthyStockCount = 0;

    materials.forEach((m) => {
      totalValuation += m.stock * m.costPrice;
      const minThreshold = m.minStock || 20;
      if (m.stock <= minThreshold) {
        criticalStockCount++;
      } else {
        healthyStockCount++;
      }
    });

    return {
      totalValuation,
      criticalStockCount,
      healthyStockCount,
      totalMaterials: materials.length,
    };
  }, [materials]);

  // 3. SPK Pipeline Stats
  const spkStats = useMemo(() => {
    const totalSpk = filteredOrders.length;
    const pendingApproval = filteredOrders.filter((o) => o.designStatus !== 'approved').length;
    const inProduction = filteredOrders.filter((o) => o.status === 'production').length;
    const inFinishing = filteredOrders.filter((o) => o.status === 'finishing').length;
    const completed = filteredOrders.filter((o) => o.status === 'completed' || o.status === 'ready').length;

    return {
      totalSpk,
      pendingApproval,
      inProduction,
      inFinishing,
      completed,
    };
  }, [filteredOrders]);

  // 4. CHART DATA 1: Daily Trend (Omset vs Kas Masuk vs HPP)
  const revenueTrendData = useMemo(() => {
    const dayMap: Record<string, { date: string; omset: number; kasMasuk: number; hpp: number }> = {};

    filteredOrders.forEach((o) => {
      const d = o.createdAt.split('T')[0];
      const label = d.slice(5); // e.g. "08-25"
      if (!dayMap[d]) {
        dayMap[d] = { date: label, omset: 0, kasMasuk: 0, hpp: 0 };
      }
      dayMap[d].omset += o.total;
      dayMap[d].kasMasuk += o.paidAmount || 0;

      let orderHpp = 0;
      o.items.forEach((it) => {
        const mat = materials.find((m) => m.name.toLowerCase() === it.productName.toLowerCase());
        const cost = mat?.costPrice || (it.unitPrice ? Math.round(it.unitPrice * 0.45) : 8000);
        const area = (it.lengthM || 1) * (it.widthM || 1);
        orderHpp += area * it.qty * cost;
      });
      dayMap[d].hpp += Math.round(orderHpp);
    });

    const result = Object.values(dayMap);
    if (result.length === 0) {
      return [
        { date: 'Hari 1', omset: 1200000, kasMasuk: 1000000, hpp: 500000 },
        { date: 'Hari 2', omset: 2400000, kasMasuk: 1800000, hpp: 950000 },
        { date: 'Hari 3', omset: 3100000, kasMasuk: 2700000, hpp: 1200000 },
        { date: 'Hari 4', omset: 2800000, kasMasuk: 2500000, hpp: 1100000 },
        { date: 'Hari 5', omset: 4200000, kasMasuk: 3900000, hpp: 1600000 },
      ];
    }
    return result;
  }, [filteredOrders, materials]);

  // 5. CHART DATA 2: INVENTORY STOCK BAR CHART (Diagram Stock Bahan Advertising)
  const stockChartData = useMemo(() => {
    return materials
      .filter((m) => {
        if (stockCategoryFilter === 'all') return true;
        return m.category === stockCategoryFilter;
      })
      .map((m) => {
        const minThresh = m.minStock || 20;
        const isCritical = m.stock <= minThresh;
        const isModerate = m.stock > minThresh && m.stock <= minThresh * 1.8;

        return {
          name: m.name.length > 18 ? m.name.slice(0, 16) + '...' : m.name,
          fullName: m.name,
          stok: m.stock,
          minStok: minThresh,
          satuan: m.unit,
          status: isCritical ? 'Kritis' : isModerate ? 'Menengah' : 'Aman',
          fillColor: isCritical ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981',
          totalNilai: m.stock * m.costPrice,
        };
      });
  }, [materials, stockCategoryFilter]);

  // 6. CHART DATA 3: Category Revenue Distribution (Donut / Pie Chart)
  const categoryPieData = useMemo(() => {
    const catMap: Record<string, number> = {};

    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        const cat = it.category || 'large_format';
        catMap[cat] = (catMap[cat] || 0) + it.subtotal;
      });
    });

    const getLabel = (k: string) => {
      if (k === 'large_format') return 'Banner Outdoor & Indoor';
      if (k === 'digital_a3') return 'Digital Print A3+';
      if (k === 'merchandise') return 'Merchandise & Sablon';
      if (k === 'offset_doc') return 'Offset & Dokumen';
      return k.toUpperCase();
    };

    const formatted = Object.entries(catMap).map(([cat, val]) => ({
      name: getLabel(cat),
      value: val,
    }));

    if (formatted.length === 0) {
      return [
        { name: 'Banner Outdoor & Indoor', value: 4500000 },
        { name: 'Digital Print A3+', value: 2100000 },
        { name: 'Merchandise & Sablon', value: 1800000 },
        { name: 'Offset & Dokumen', value: 950000 },
      ];
    }
    return formatted;
  }, [filteredOrders]);

  // 7. KINERJA DESIGNER: TOTAL SPK & OMSET YANG DIHASILKAN
  const designerStats = useMemo(() => {
    const stats: Record<
      string,
      {
        name: string;
        totalSpk: number;
        approved: number;
        pending: number;
        omset: number;
      }
    > = {};

    filteredOrders.forEach((o) => {
      let dName = 'DIMAS';
      if (o.designerName && o.designerName.trim()) {
        dName = o.designerName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      } else if (o.createdBy && o.createdBy.toLowerCase().includes('dimas')) {
        dName = 'DIMAS';
      }

      if (!stats[dName]) {
        stats[dName] = {
          name: dName,
          totalSpk: 0,
          approved: 0,
          pending: 0,
          omset: 0,
        };
      }
      stats[dName].totalSpk += 1;
      stats[dName].omset += o.total;
      if (o.designStatus === 'approved') {
        stats[dName].approved += 1;
      } else {
        stats[dName].pending += 1;
      }
    });

    const totalAllDesignerOmset = Object.values(stats).reduce((acc, curr) => acc + curr.omset, 0) || 1;

    return Object.values(stats)
      .map((d) => ({
        ...d,
        avgPerSpk: d.totalSpk > 0 ? Math.round(d.omset / d.totalSpk) : 0,
        approvalRate: d.totalSpk > 0 ? Math.round((d.approved / d.totalSpk) * 100) : 0,
        sharePercent: Math.round((d.omset / totalAllDesignerOmset) * 100),
      }))
      .sort((a, b) => b.omset - a.omset);
  }, [filteredOrders]);

  const totalAllSpkDesigner = useMemo(() => {
    return designerStats.reduce((acc, curr) => acc + curr.totalSpk, 0);
  }, [designerStats]);

  const totalAllOmsetDesigner = useMemo(() => {
    return designerStats.reduce((acc, curr) => acc + curr.omset, 0);
  }, [designerStats]);

  // 8. TOP 5 Best-Selling Advertising Products
  const topProducts = useMemo(() => {
    const map: Record<
      string,
      { name: string; qty: number; unit: string; totalOmset: number; totalAreaM2: number }
    > = {};

    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        const key = it.productName.trim() || 'Item Cetak';
        if (!map[key]) {
          map[key] = {
            name: key,
            qty: 0,
            unit: it.unit || 'pcs',
            totalOmset: 0,
            totalAreaM2: 0,
          };
        }
        map[key].qty += it.qty;
        map[key].totalOmset += it.subtotal;
        if (it.lengthM && it.widthM) {
          map[key].totalAreaM2 += it.lengthM * it.widthM * it.qty;
        }
      });
    });

    const sorted = Object.values(map).sort((a, b) => b.totalOmset - a.totalOmset);
    return sorted.slice(0, 5);
  }, [filteredOrders]);

  const maxProductOmset = topProducts.length > 0 ? topProducts[0].totalOmset : 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-slate-100 text-xs font-sans overflow-hidden">
      {/* ================= 1. ENTERPRISE HEADER ================= */}
      <div className="bg-[#1e293b] border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white tracking-wide">
              EXECUTIVE BUSINESS INTELLIGENCE DASHBOARD
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Sistem Analisis Eksekutif Perusahaan Advertising & Percetakan Digital — Khusus Owner: <b>{currentUser.name}</b>
          </span>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 p-1 rounded-md">
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              period === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua Periode
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              period === 'month'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              period === 'week'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              period === 'today'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* ================= 2. SCROLLABLE DASHBOARD BODY ================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0b0f19]">
        {/* ROW 1: 5 EXECUTIVE FINANCIAL & INVENTORY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Metric 1: Gross Revenue */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 shadow-lg relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Omset Penjualan
              </span>
              <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono text-white block">
                {formatRupiah(financial.totalOmset)}
              </span>
              <span className="text-[10px] text-blue-400 block mt-0.5">
                {spkStats.totalSpk} SPK ({formatRupiah(financial.averageOrderValue)}/order)
              </span>
            </div>
          </div>

          {/* Metric 2: Net Profit */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 shadow-lg relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Laba Bersih Estimasi
              </span>
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono text-emerald-400 block">
                {formatRupiah(financial.labaBersih)}
              </span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                Margin Profit: <b>{financial.profitMargin}%</b> (Omset - HPP - Biaya)
              </span>
            </div>
          </div>

          {/* Metric 3: Real Cash Inflow */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 shadow-lg relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Arus Kas Diterima (Real)
              </span>
              <div className="w-6 h-6 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono text-teal-300 block">
                {formatRupiah(financial.totalKasMasuk)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Masuk laci kasir & rekening
              </span>
            </div>
          </div>

          {/* Metric 4: Receivables (Piutang) */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 shadow-lg relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Piutang Konsumen
              </span>
              <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono text-amber-400 block">
                {formatRupiah(financial.totalPiutang)}
              </span>
              <span className="text-[10px] text-amber-300 block mt-0.5">
                Tagihan invoice belum lunas
              </span>
            </div>
          </div>

          {/* Metric 5: Warehouse Inventory Valuation */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 shadow-lg relative overflow-hidden backdrop-blur-xs">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Valuasi Stok Gudang
              </span>
              <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-1.5">
              <span className="text-xl font-extrabold font-mono text-indigo-300 block">
                {formatRupiah(stockMetrics.totalValuation)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stockMetrics.totalMaterials} jenis bahan baku ready
              </span>
            </div>
          </div>
        </div>

        {/* ================= CRITICAL STOCK ALERT BANNER (If any) ================= */}
        {stockMetrics.criticalStockCount > 0 && (
          <div className="bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-600/50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="font-bold text-xs text-rose-300 block">
                  PERINGATAN GUDANG: {stockMetrics.criticalStockCount} BAHAN BAKU MENDEKATI HABIS!
                </span>
                <span className="text-[10px] text-slate-300">
                  Beberapa media cetak & bahan flexi/stiker berada di bawah batas minimum (safety stock). Segera terbitkan Purchase Order (PO) ke supplier.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                ⚠️ {stockMetrics.criticalStockCount} Item Kritis
              </span>
            </div>
          </div>
        )}

        {/* ================= ROW 2: 2 PRIMARY CHARTS (REVENUE TREND & INVENTORY STOCK DIAGRAM) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT: REVENUE & CASHFLOW TREND CHART (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs text-white">
                  DIAGRAM TREN OMSET PENJUALAN & ARUS KAS HARIAN
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Omset vs Kas Masuk vs HPP Bahan
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="omset"
                    name="Omset Penjualan (Gross)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#omsetGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="kasMasuk"
                    name="Kas Diterima (Cash Inflow)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#kasGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="hpp"
                    name="HPP Modal Bahan Cetak"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: JUMLAH STOCK GUDANG BAHAN & MEDIA (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-white">
                  DIAGRAM JUMLAH STOCK BAHAN & MEDIA GUDANG
                </h3>
              </div>
              {/* Category Filter for Stock */}
              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="large_format">Outdoor / Flexi (m²)</option>
                <option value="digital_a3">Digital A3+ (Lbr)</option>
                <option value="merchandise">Merchandise / Kaos (Pcs)</option>
              </select>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 25, left: 35, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#cbd5e1"
                    tick={{ fontSize: 10 }}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} ${item.payload.satuan} (Min: ${item.payload.minStok} ${item.payload.satuan}) - Status: ${item.payload.status}`,
                      item.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="stok" name="Jumlah Stok Fisik Ready" radius={[0, 4, 4, 0]}>
                    {stockChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Indicators */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-[10px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Stok Aman
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Menengah
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Kritis (Segera PO)
                </span>
              </div>
              <span className="font-mono text-slate-400">
                Aset: <b>{formatRupiah(stockMetrics.totalValuation)}</b>
              </span>
            </div>
          </div>
        </div>

        {/* ================= ROW 3: CATEGORY PIE CHART, STAFF PERFORMANCE, & TOP 5 PRODUCTS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 1. CATEGORY SHARE DONUT CHART (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-xs text-white">
                  KOMPOSISI PENJUALAN KATEGORI
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Share Omset</span>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Omset']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Pie Legend */}
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-700/80 text-[10px]">
              {categoryPieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  ></span>
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. REKAP TOTAL SPK & OMSET YANG DIHASILKAN PER DESIGNER (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs text-white">
                  TOTAL SPK & OMSET DESIGNER
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                {totalAllSpkDesigner} SPK Dibuat
              </span>
            </div>

            {/* List Scorecards of Designers with Total SPK and Omset Dihasilkan */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-center py-1">
              {designerStats.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-xs">
                  Belum ada data SPK designer pada periode ini
                </div>
              ) : (
                designerStats.map((des, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-700/80 rounded-md p-2.5 space-y-1.5 hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white flex items-center justify-center font-extrabold text-[10px] shadow-sm">
                          {des.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block leading-tight">{des.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {des.approved} SPK Approved {des.pending > 0 && `• ${des.pending} Pending`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-emerald-400 block">
                          {formatRupiah(des.omset)}
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Rata²: {formatRupiah(des.avgPerSpk)}/SPK
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 pt-0.5 border-t border-slate-800">
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>Total SPK: <b className="text-cyan-300 font-bold">{des.totalSpk} SPK</b></span>
                        <span>Kontribusi Omset: <b className="text-emerald-400 font-bold">{des.sharePercent}%</b></span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                          style={{ width: `${des.sharePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Total Omset Seluruh Desainer:</span>
              <span className="font-bold font-mono text-emerald-400">
                {formatRupiah(totalAllOmsetDesigner)}
              </span>
            </div>
          </div>

          {/* 3. TOP 5 BEST-SELLING PRODUCTS (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs text-white">
                  5 PRODUK TERATAS YANG TERJUAL
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 font-bold">Top Revenue</span>
            </div>

            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {topProducts.map((p, idx) => {
                const percent = Math.round((p.totalOmset / maxProductOmset) * 100);
                const medalColors = [
                  'from-amber-400 to-amber-600 text-slate-900', // Gold
                  'from-slate-300 to-slate-400 text-slate-900', // Silver
                  'from-amber-700 to-amber-800 text-white',     // Bronze
                  'from-slate-700 to-slate-800 text-slate-300', // #4
                  'from-slate-700 to-slate-800 text-slate-300', // #5
                ];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-gradient-to-br ${medalColors[idx]} shrink-0`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">
                        {formatRupiah(p.totalOmset)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Volume: {p.totalAreaM2 > 0 ? `${p.totalAreaM2.toFixed(1)} m²` : `${p.qty} ${p.unit}`}</span>
                      <span>{percent}% dari #1</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-700/80 text-[10px] text-slate-400 flex justify-between">
              <span>Dominasi Omset Tertinggi</span>
              <span className="font-bold text-emerald-400">Banner & Digital A3</span>
            </div>
          </div>
        </div>

        {/* ================= ROW 4: PRINTING MACHINE UTILIZATION & SPK PIPELINE STATUS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* MACHINE FLEET MONITORING (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-xs text-white">
                  STATUS UTILISASI MESIN PERCETAKAN ADVERTISING
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Kapasitas Workshop</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {machines.map((m) => {
                const isRunning = m.status === 'running';
                const isIdle = m.status === 'idle';
                const loadPercent = isRunning ? 85 : isIdle ? 25 : 0;

                return (
                  <div key={m.id} className="bg-slate-900/70 border border-slate-700 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-white block">{m.name}</span>
                        <span className="text-[10px] text-slate-400 block">{m.brand} • {m.type}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRunning
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                            : isIdle
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isRunning ? 'RUNNING / CETAK' : isIdle ? 'READY / IDLE' : 'MAINTENANCE'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Beban Cetak Harian:</span>
                        <span className="font-mono text-slate-200">{loadPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isRunning ? 'bg-blue-500' : isIdle ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SPK PIPELINE STATUS (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-white">
                  PIPELINE STATUS PENYELESAIAN SPK
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">{spkStats.totalSpk} SPK Aktif</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/70 border border-amber-500/30 rounded p-3 text-center">
                <span className="text-[10px] font-semibold text-amber-400 uppercase block">Menunggu Approval</span>
                <span className="text-2xl font-extrabold font-mono text-amber-300 block mt-1">
                  {spkStats.pendingApproval}
                </span>
                <span className="text-[9px] text-slate-500 block">Antrean Desain</span>
              </div>

              <div className="bg-slate-900/70 border border-blue-500/30 rounded p-3 text-center">
                <span className="text-[10px] font-semibold text-blue-400 uppercase block">Dalam Produksi Cetak</span>
                <span className="text-2xl font-extrabold font-mono text-blue-300 block mt-1">
                  {spkStats.inProduction}
                </span>
                <span className="text-[9px] text-slate-500 block">Sedang Naik Mesin</span>
              </div>

              <div className="bg-slate-900/70 border border-purple-500/30 rounded p-3 text-center">
                <span className="text-[10px] font-semibold text-purple-400 uppercase block">Proses Finishing</span>
                <span className="text-2xl font-extrabold font-mono text-purple-300 block mt-1">
                  {spkStats.inFinishing}
                </span>
                <span className="text-[9px] text-slate-500 block">Mata Ayam / Lem / Potong</span>
              </div>

              <div className="bg-slate-900/70 border border-emerald-500/30 rounded p-3 text-center">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase block">Selesai / Siap Ambil</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-300 block mt-1">
                  {spkStats.completed}
                </span>
                <span className="text-[9px] text-slate-500 block">Siap Kirim / Diambil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
