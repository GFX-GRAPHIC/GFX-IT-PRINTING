import React, { useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRupiah, generateWhatsAppUrl } from '../../utils/formatters';

interface ReceivablesReportProps {
  orders: Order[];
}

export const ReceivablesReport: React.FC<ReceivablesReportProps> = ({ orders }) => {
  const { addPaymentToOrder, storeSettings } = useApp();
  const { currentUser } = useAuth();

  const [settleOrder, setSettleOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Orders with unpaid balances
  const unpaidOrders = orders.filter((o) => o.balance > 0 && o.status !== 'cancelled');
  const totalReceivables = unpaidOrders.reduce((acc, curr) => acc + curr.balance, 0);

  const handleOpenSettle = (order: Order) => {
    setSettleOrder(order);
    setPayAmount(order.balance);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleOrder || payAmount <= 0) return;
    addPaymentToOrder(settleOrder.id, payAmount, 'cash', currentUser);
    setSettleOrder(null);
  };

  const handleSendReminder = (order: Order) => {
    const msg = `Halo Kak ${order.customerName},\n\nPengingat pembayaran untuk pesanan di *${storeSettings.storeName}*:\nNo. Faktur: *${order.orderNumber}*\nNo. SPK: *${order.spkNumber}*\nTotal Pesanan: ${formatRupiah(order.total)}\nTelah Dibayar: ${formatRupiah(order.paidAmount)}\n*Sisa Tagihan: ${formatRupiah(order.balance)}*\n\nPembayaran dapat ditransfer ke:\n${storeSettings.bankAccounts.map((b) => `• ${b.bankName}: ${b.accountNumber} a/n ${b.accountHolder}`).join('\n')}\n\nTerima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
            Total Piutang Belum Terbayar
          </span>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">
            {formatRupiah(totalReceivables)}
          </div>
          <p className="text-[10px] text-rose-300/70 mt-0.5">Dari {unpaidOrders.length} tagihan belum lunas</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Status Tagihan DP (Uang Muka)
          </span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            {unpaidOrders.filter((o) => o.paymentStatus === 'dp').length} Pesanan
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Menunggu pelunasan saat pengambilan</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tagihan Tempo / Corporate
          </span>
          <div className="text-xl font-black text-blue-400 font-mono mt-1">
            {unpaidOrders.filter((o) => o.paymentStatus === 'unpaid').length} Pesanan
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Sistem invoice jatuh tempo</p>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Daftar Piutang & Tagihan Pelanggan Aktif
          </h3>
          <span className="text-xs text-slate-400 font-mono">{unpaidOrders.length} Data Tagihan</span>
        </div>

        {unpaidOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span>Semua tagihan pelanggan telah lunas! Tidak ada piutang tertunda.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">No. Faktur / SPK</th>
                  <th className="p-3">Pelanggan & Kontak</th>
                  <th className="p-3">Tgl Order / Deadline</th>
                  <th className="p-3 text-right">Total Order</th>
                  <th className="p-3 text-right">Telah Dibayar</th>
                  <th className="p-3 text-right text-rose-400">Sisa Tagihan (Piutang)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {unpaidOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-200 font-mono">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{order.spkNumber}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <div>{formatDate(order.createdAt)}</div>
                      <div className="text-[10px] text-slate-500 font-mono">DL: {formatDate(order.deadline)}</div>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {formatRupiah(order.total)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {formatRupiah(order.paidAmount)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">
                      {formatRupiah(order.balance)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          order.paymentStatus === 'dp'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {order.paymentStatus === 'dp' ? 'DP (Uang Muka)' : 'Tempo / Belum'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSendReminder(order)}
                          className="py-1 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30 transition-colors"
                          title="Kirim Pesan Tagihan WA"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WA Tagihan</span>
                        </button>

                        <button
                          onClick={() => handleOpenSettle(order)}
                          className="py-1 px-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow transition-all"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Pelunasan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {settleOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Pelunasan Tagihan ({settleOrder.orderNumber})</h3>
              <button onClick={() => setSettleOrder(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p><b>Pelanggan:</b> {settleOrder.customerName}</p>
              <p><b>Total Tagihan:</b> {formatRupiah(settleOrder.total)}</p>
              <p><b>Sisa Belum Bayar:</b> <span className="font-bold text-rose-400">{formatRupiah(settleOrder.balance)}</span></p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nominal Pembayaran Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full text-sm font-mono font-bold bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-emerald-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleOrder(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
