import React, { useState } from 'react';
import { CreditCard, Search, MessageSquare, DollarSign, X } from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';

export const DataPiutangPage: React.FC = () => {
  const { orders, addPaymentToOrder, storeSettings } = useApp();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [settleOrder, setSettleOrder] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const unpaidOrders = orders.filter((o) => o.balance > 0 && o.status !== 'cancelled');
  const totalPiutang = unpaidOrders.reduce((acc, curr) => acc + curr.balance, 0);

  const filtered = unpaidOrders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.spkNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search)
  );

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
    const msg = `Halo Kak ${order.customerName},\n\nPengingat tagihan pesanan dari *${storeSettings.storeName}*:\nNo. SPK: *${order.spkNumber}*\nTotal: ${formatRupiah(order.total)}\nTelah Dibayar: ${formatRupiah(order.paidAmount)}\n*Sisa Tagihan: ${formatRupiah(order.balance)}*\n\nPembayaran via Transfer:\n${storeSettings.bankAccounts.map((b) => `• ${b.bankName}: ${b.accountNumber} a/n ${b.accountHolder}`).join('\n')}\n\nTerima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#1e40af]" />
            <span className="font-bold text-sm text-[#0f172a]">Data Piutang & Tagihan Pelanggan</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#1e40af] bg-white px-2.5 py-0.5 rounded-sm border border-[#cbd5e1]">
            Total Piutang: {formatRupiah(totalPiutang)}
          </span>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari konsumen, no. SPK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs text-[#0f172a]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-32">No. SPK / Faktur</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Konsumen</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-24">Tgl SPK</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-28">Total Order</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-28">Telah Dibayar</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-28 text-[#1e40af]">Sisa Tagihan</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-24">Status</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-[#f8fafc]">
                <td className="border border-[#cbd5e1] px-2 py-1.5 font-mono font-bold text-[#1e40af]">
                  {order.spkNumber}
                  <span className="block text-[10px] text-[#64748b] font-normal">{order.orderNumber}</span>
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#0f172a]">
                  {order.customerName}
                  <span className="block text-[10px] text-[#64748b] font-mono font-normal">
                    {order.customerPhone}
                  </span>
                </td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-[#64748b]">
                  {formatDate(order.createdAt)}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono text-[#0f172a]">
                  {formatRupiah(order.total)}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono text-[#0f172a]">
                  {formatRupiah(order.paidAmount)}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-[#1e40af]">
                  {formatRupiah(order.balance)}
                </td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm border ${
                      order.paymentStatus === 'dp'
                        ? 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]'
                        : 'bg-white text-[#64748b] border-[#cbd5e1]'
                    }`}
                  >
                    {order.paymentStatus === 'dp' ? 'DP Masuk' : 'Tempo / Belum'}
                  </span>
                </td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleSendReminder(order)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0f172a] rounded-sm border border-[#cbd5e1] flex items-center gap-0.5 text-[10px] font-semibold transition-colors"
                      title="Kirim Pesan WhatsApp Penagihan"
                    >
                      <MessageSquare className="w-3 h-3 text-[#1e40af]" />
                      <span>WA</span>
                    </button>
                    <button
                      onClick={() => handleOpenSettle(order)}
                      className="px-2 py-0.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-[10px] font-bold shadow-2xs transition-colors"
                    >
                      Pelunasan
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Settle Modal */}
      {settleOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a]">Pelunasan Tagihan ({settleOrder.spkNumber})</h3>
              <button onClick={() => setSettleOrder(null)} className="text-[#64748b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-[#f8fafc] p-2.5 rounded border border-[#cbd5e1]">
              <p>Konsumen: <b>{settleOrder.customerName}</b></p>
              <p>Total: {formatRupiah(settleOrder.total)}</p>
              <p>Sisa: <b className="text-rose-700">{formatRupiah(settleOrder.balance)}</b></p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Nominal Pembayaran Diterima (Rp)
                </label>
                <input
                  type="number"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 border border-[#1e40af] rounded text-xs font-mono font-bold text-emerald-700 select-text cursor-text"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleOrder(null)}
                  className="px-3 py-1 bg-[#e2e8f0] rounded text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#1e40af] text-white rounded text-xs font-bold"
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
