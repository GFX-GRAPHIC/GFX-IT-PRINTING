import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Palette,
  Scissors,
  PackageCheck,
  ChevronRight,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatDate,
  formatDateTime,
  formatRupiah,
  generateWhatsAppUrl,
  getPaymentStatusBadge,
  getStatusBadge,
} from '../../utils/formatters';

interface SpkModalProps {
  order: Order;
  onClose: () => void;
  onPrintSpk: () => void;
  onPrintReceipt: () => void;
  onPrintInvoice: () => void;
}

export const SpkModal: React.FC<SpkModalProps> = ({
  order,
  onClose,
  onPrintSpk,
  onPrintReceipt,
  onPrintInvoice,
}) => {
  const { updateOrderStatus, addPaymentToOrder, storeSettings } = useApp();
  const { currentUser, isOwner, isAdmin, isDesigner, isOperator } = useAuth();

  const [noteInput, setNoteInput] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(order.balance);

  const statusBadge = getStatusBadge(order.status);
  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus, currentUser, noteInput || undefined);
    setNoteInput('');
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    addPaymentToOrder(order.id, paymentAmount, 'cash', currentUser);
    setShowPaymentInput(false);
  };

  const handleWhatsApp = () => {
    const statusText =
      order.status === 'ready'
        ? 'sudah SELESAI dan siap diambil / dikirim'
        : order.status === 'production'
        ? 'sedang dalam proses CETAK'
        : order.status === 'design'
        ? 'sedang dalam proses DESAIN & APPROVAL'
        : 'telah kami terima dan masuk antrean';

    const msg = `Halo Kak ${order.customerName},\n\nUpdate dari *${storeSettings.storeName}* untuk pesanan:\nNo. SPK: *${order.spkNumber}*\nStatus: *${statusText}*\n\nTotal: ${formatRupiah(order.total)}\nStatus Bayar: *${order.paymentStatus === 'paid' ? 'LUNAS' : `Sisa ${formatRupiah(order.balance)}`}*\n\nTerima kasih! 🙏`;

    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  const workflowSteps: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'pending', label: 'Antrean', icon: Clock },
    { status: 'design', label: 'Desain', icon: Palette },
    { status: 'production', label: 'Cetak', icon: Printer },
    { status: 'finishing', label: 'Finishing', icon: Scissors },
    { status: 'ready', label: 'Siap Ambil', icon: PackageCheck },
    { status: 'completed', label: 'Selesai', icon: CheckCircle2 },
  ];

  const currentStepIdx = workflowSteps.findIndex((s) => s.status === order.status);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-mono font-bold text-xs">
              SPK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">{order.spkNumber}</h2>
                <span className="text-[11px] font-mono text-slate-400">({order.orderNumber})</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Pelanggan: {order.customerName} ({order.customerPhone})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
              title="Kirim Notifikasi WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="bg-slate-950/90 px-6 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx <= currentStepIdx;
              const isCurrent = step.status === order.status;

              return (
                <React.Fragment key={step.status}>
                  <button
                    onClick={() => handleStatusChange(step.status)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-105'
                        : isPassed
                        ? 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.label}</span>
                  </button>
                  {idx < workflowSteps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer & Delivery */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Info Pelanggan
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-200">{order.customerName}</p>
                <p className="text-slate-400 font-mono">{order.customerPhone}</p>
                <p className="text-slate-400">Tipe: <span className="text-slate-200 capitalize">{order.customerType}</span></p>
                <p className="text-slate-400">
                  Pengambilan:{' '}
                  <span className="font-semibold text-brand-300">
                    {order.pickupType === 'delivery' ? '🚚 Kirim Kurir' : '🏪 Ambil di Toko'}
                  </span>
                </p>
                {order.deliveryAddress && (
                  <p className="text-[11px] text-slate-400">Alamat: {order.deliveryAddress}</p>
                )}
              </div>
            </div>

            {/* Timing & Assignment */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Penugasan & Waktu
              </span>
              <div className="text-xs space-y-1">
                <p className="text-slate-400">
                  Prioritas:{' '}
                  <span className={`font-bold uppercase ${
                    order.priority === 'urgent' ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {order.priority}
                  </span>
                </p>
                <p className="text-slate-400">
                  Deadline: <span className="font-bold text-amber-300 font-mono">{formatDateTime(order.deadline)}</span>
                </p>
                <p className="text-slate-400">
                  Designer PIC: <span className="text-purple-300 font-medium">{order.designerName || '-'}</span>
                </p>
                <p className="text-slate-400">
                  Operator PIC: <span className="text-blue-300 font-medium">{order.operatorName || '-'}</span>
                </p>
              </div>
            </div>

            {/* Financial Status */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Status Pembayaran
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${paymentBadge.bg} ${paymentBadge.text}`}>
                  {paymentBadge.label}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Grand Total:</span>
                  <span className="font-mono font-bold text-slate-100">{formatRupiah(order.total)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Telah Dibayar:</span>
                  <span className="font-mono text-emerald-400">{formatRupiah(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold border-t border-slate-800 pt-1">
                  <span>Sisa Tagihan:</span>
                  <span className="font-mono text-rose-400">{formatRupiah(order.balance)}</span>
                </div>
              </div>

              {order.balance > 0 && (
                <button
                  onClick={() => setShowPaymentInput(!showPaymentInput)}
                  className="w-full py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold transition-colors mt-1"
                >
                  + Pelunasan / Tambah Bayar
                </button>
              )}
            </div>
          </div>

          {/* Add Payment Form Drawer */}
          {showPaymentInput && (
            <form onSubmit={handleAddPayment} className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-bold text-emerald-300">Input Pembayaran Tambahan (Kasir)</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Nominal bayar..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                  className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                />
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </form>
          )}

          {/* Items Specs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Item & Spesifikasi Cetak ({order.items.length})
            </h3>
            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-100 text-xs">{item.productName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.materialName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-brand-300">
                        {item.qty} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">{formatRupiah(item.subtotal)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Ukuran:</span>
                      <span className="font-mono text-slate-300">
                        {item.lengthM && item.widthM ? `${item.lengthM}m × ${item.widthM}m (${item.areaM2} m²)` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Mesin:</span>
                      <span className="text-blue-300 font-medium">{item.targetMachine || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Finishing:</span>
                      <span className="text-amber-300">
                        {item.finishingNames.length > 0 ? item.finishingNames.join(', ') : 'Standard Potong'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Status Desain:</span>
                      <span className="text-purple-300 capitalize">{item.designType.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {item.fileUrl && (
                    <div className="text-[11px] flex items-center gap-2 bg-slate-900/80 p-2 rounded border border-slate-800 text-blue-400">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {item.fileUrl}
                      </a>
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                      <b>Catatan:</b> {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Riwayat Aktivitas & Timeline ({order.timeline.length})
            </h3>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 max-h-44 overflow-y-auto space-y-2">
              {order.timeline.map((tl) => (
                <div key={tl.id} className="text-xs flex items-start gap-2.5 pb-2 border-b border-slate-900 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{tl.user} ({tl.userRole})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(tl.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{tl.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="h-16 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrintReceipt}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Struk Kasir</span>
            </button>
            <button
              onClick={onPrintInvoice}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Faktur A4</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrintSpk}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar SPK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
