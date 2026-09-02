import React, { useState } from 'react';
import {
  Printer,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Palette,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  generateWhatsAppUrl,
  getPaymentStatusBadge,
  getStatusBadge,
} from '../utils/formatters';

interface PosOrdersPageProps {
  onOpenNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onPrintSpk: (order: Order) => void;
}

export const PosOrdersPage: React.FC<PosOrdersPageProps> = ({
  onOpenNewOrder,
  onSelectOrder,
  onPrintReceipt,
  onPrintInvoice,
  onPrintSpk,
}) => {
  const { orders, storeSettings } = useApp();
  const { canCreateOrder } = useAuth();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.spkNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customerPhone.includes(searchFilter);

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const sendWhatsApp = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Halo Kak ${order.customerName},\n\nUpdate pesanan Anda di *${storeSettings.storeName}*:\nNo. SPK: *${order.spkNumber}*\nStatus: *${order.status.toUpperCase()}*\nTotal: ${formatRupiah(order.total)}\nStatus Bayar: *${
      order.paymentStatus === 'paid' ? 'LUNAS' : `Sisa ${formatRupiah(order.balance)}`
    }*\n\nTerima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  const statusChips = [
    { id: 'all', label: 'Semua Status' },
    { id: 'pending', label: 'Antrean' },
    { id: 'design', label: 'Desain' },
    { id: 'production', label: 'Cetak' },
    { id: 'finishing', label: 'Finishing' },
    { id: 'ready', label: 'Siap Ambil' },
    { id: 'completed', label: 'Selesai' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Daftar Semua Pesanan & Transaksi Kasir</h2>
          <p className="text-xs text-slate-400">Pencatatan pesanan masuk, faktur, nota kasir thermal & status pembayaran</p>
        </div>

        {canCreateOrder && (
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pesanan Masuk (F1)</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Order, SPK, Pelanggan, No. HP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Payment filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] text-slate-400 shrink-0">Pembayaran:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="paid">Lunas</option>
              <option value="dp">DP (Uang Muka)</option>
              <option value="unpaid">Belum Bayar / Tempo</option>
            </select>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-850">
          {statusChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                statusFilter === chip.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <span>Tidak ditemukan pesanan yang sesuai kriteria pencarian.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">No. Faktur / SPK</th>
                  <th className="p-3">Pelanggan</th>
                  <th className="p-3">Detail Cetakan</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3 text-right">Nilai Total</th>
                  <th className="p-3 text-center">Status Bayar</th>
                  <th className="p-3 text-center">Status Alur Kerja</th>
                  <th className="p-3 text-center">Cetak & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  const payBadge = getPaymentStatusBadge(order.paymentStatus);
                  const isUrgent = order.priority === 'urgent' || order.priority === 'express';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 font-mono">{order.orderNumber}</span>
                          {isUrgent && (
                            <span className="text-[9px] font-bold px-1 rounded bg-rose-500/20 text-rose-300">
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{order.spkNumber}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-slate-200 font-medium truncate max-w-[220px]">
                          {order.items.map((i) => i.productName).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.items.length} item ({order.items.reduce((a, c) => a + c.qty, 0)} pcs)
                        </div>
                      </td>

                      <td className="p-3 text-slate-300 font-mono text-[11px]">
                        {formatDateTime(order.deadline)}
                      </td>

                      <td className="p-3 text-right">
                        <div className="font-mono font-bold text-slate-100">{formatRupiah(order.total)}</div>
                        {order.balance > 0 && (
                          <div className="text-[10px] text-rose-400 font-mono">
                            Sisa: {formatRupiah(order.balance)}
                          </div>
                        )}
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
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrintReceipt(order)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Cetak Struk Kasir Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onPrintInvoice(order)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-950 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Cetak Faktur A4"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => sendWhatsApp(order, e)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Kirim WA Status"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
