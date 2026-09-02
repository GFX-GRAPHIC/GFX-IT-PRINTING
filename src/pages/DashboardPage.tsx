import React from 'react';
import {
  TrendingUp,
  Clock,
  Palette,
  Printer,
  PackageCheck,
  AlertCircle,
  FileText,
  Plus,
  ArrowRight,
  Eye,
  MessageSquare,
  DollarSign,
  Layers,
} from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatRupiah, generateWhatsAppUrl, getPaymentStatusBadge, getStatusBadge } from '../utils/formatters';
import { RevenueCharts } from '../components/reports/RevenueCharts';

interface DashboardPageProps {
  onOpenNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onNavigate: (page: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenNewOrder,
  onSelectOrder,
  onNavigate,
}) => {
  const { orders, storeSettings } = useApp();
  const { currentUser, isOwner, canCreateOrder } = useAuth();

  // Calculations
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((acc, curr) => acc + curr.total, 0);

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const designCount = orders.filter((o) => o.status === 'design').length;
  const printCount = orders.filter((o) => o.status === 'production' || o.status === 'finishing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const unpaidTotal = orders.filter((o) => o.status !== 'cancelled').reduce((acc, curr) => acc + curr.balance, 0);

  const urgentOrders = orders.filter(
    (o) => (o.priority === 'urgent' || o.priority === 'express') && o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Welcome & Quick Action Banner */}
      <div className="bg-gradient-to-r from-brand-950/80 via-slate-900 to-slate-950 border border-brand-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100">
              Selamat Bertugas, {currentUser.name}! 👋
            </h2>
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {storeSettings.storeName} — Pantau pesanan cetak masuk, alur produksi SPK, dan ringkasan keuangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {canCreateOrder && (
            <button
              onClick={onOpenNewOrder}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Pesanan Masuk (F1)</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('pipeline')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-750 transition-all"
          >
            <span>Alur Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Urgent Orders Alert Banner */}
      {urgentOrders.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-200">
                Perhatian: {urgentOrders.length} Pesanan Prioritas Urgent / Express!
              </h4>
              <p className="text-[11px] text-rose-300/80">
                {urgentOrders.map((u) => `${u.spkNumber} (${u.customerName})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('pipeline')}
            className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow"
          >
            Tinjau Sekarang
          </button>
        </div>
      )}

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Omset Hari Ini (Owner only) */}
        {isOwner ? (
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Omset Hari Ini</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              {formatRupiah(todayRevenue)}
            </div>
            <p className="text-[10px] text-slate-500">{todayOrders.length} pesanan baru</p>
          </div>
        ) : (
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pesanan Hari Ini</span>
              <Layers className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-lg font-black text-brand-400 font-mono">
              {todayOrders.length} Order
            </div>
            <p className="text-[10px] text-slate-500">Tercatat di sistem</p>
          </div>
        )}

        {/* Antrean Aktif */}
        <div
          onClick={() => onNavigate('pipeline')}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pesanan Aktif</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {activeOrders.length} Order
          </div>
          <p className="text-[10px] text-slate-500">Dalam proses pengerjaan</p>
        </div>

        {/* Antrean Desain */}
        <div
          onClick={() => onNavigate('designer_workspace')}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Antrean Desain</span>
            <Palette className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400 font-mono">
            {designCount} Desain
          </div>
          <p className="text-[10px] text-slate-500">Pre-press & approval</p>
        </div>

        {/* Antrean Cetak & Finishing */}
        <div
          onClick={() => onNavigate('operator_workspace')}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Antrean Produksi</span>
            <Printer className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-black text-blue-400 font-mono">
            {printCount} SPK
          </div>
          <p className="text-[10px] text-slate-500">Mesin & Finishing</p>
        </div>

        {/* Siap Diambil */}
        <div
          onClick={() => onNavigate('pos_orders')}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Siap Diambil</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {readyCount} Order
          </div>
          <p className="text-[10px] text-slate-500">Menunggu customer/kirim</p>
        </div>
      </div>

      {/* Revenue Trends Chart (Owner only) */}
      {isOwner && <RevenueCharts orders={orders} />}

      {/* Recent Orders Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-2">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Pesanan Terbaru & Status Pengerjaan SPK
            </h3>
            <p className="text-[11px] text-slate-400">Klik baris pesanan untuk melihat detail spesifikasi</p>
          </div>

          <button
            onClick={() => onNavigate('pos_orders')}
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Lihat Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">No. SPK / Faktur</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3">Item Cetakan</th>
                <th className="p-3">Deadline</th>
                <th className="p-3 text-right">Nilai Order</th>
                <th className="p-3 text-center">Status Bayar</th>
                <th className="p-3 text-center">Status Alur Kerja</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {orders.slice(0, 7).map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const payBadge = getPaymentStatusBadge(order.paymentStatus);

                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-100 font-mono">{order.spkNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{order.orderNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-200">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300 font-medium truncate max-w-[200px]">
                        {order.items.map((i) => i.productName).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {order.items.length} item ({order.items.reduce((a, c) => a + c.qty, 0)} total)
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[11px]">
                      {formatDateTime(order.deadline)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${payBadge.bg} ${payBadge.text}`}>
                        {payBadge.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-brand-300 text-[11px] font-semibold border border-slate-800 transition-colors"
                      >
                        Buka SPK
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
