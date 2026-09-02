import React from 'react';
import {
  Clock,
  Palette,
  Printer,
  Scissors,
  PackageCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, formatRupiah, generateWhatsAppUrl } from '../../utils/formatters';

interface KanbanBoardProps {
  onSelectOrder: (order: Order) => void;
  onOpenSpkPrint: (order: Order) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectOrder,
  onOpenSpkPrint,
}) => {
  const { orders, updateOrderStatus, storeSettings } = useApp();
  const { currentUser } = useAuth();

  const columns: { id: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'pending', label: '1. Antrean Baru', icon: Clock, color: 'border-amber-500/50 bg-amber-500/5 text-amber-300' },
    { id: 'design', label: '2. Desain & ACC', icon: Palette, color: 'border-purple-500/50 bg-purple-500/5 text-purple-300' },
    { id: 'production', label: '3. Proses Cetak', icon: Printer, color: 'border-blue-500/50 bg-blue-500/5 text-blue-300' },
    { id: 'finishing', label: '4. Finishing & QC', icon: Scissors, color: 'border-indigo-500/50 bg-indigo-500/5 text-indigo-300' },
    { id: 'ready', label: '5. Siap Ambil / Kirim', icon: PackageCheck, color: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-300' },
    { id: 'completed', label: '6. Selesai', icon: CheckCircle2, color: 'border-teal-500/50 bg-teal-500/5 text-teal-300' },
  ];

  const statusOrder: OrderStatus[] = ['pending', 'design', 'production', 'finishing', 'ready', 'completed'];

  const moveOrder = (order: Order, direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = statusOrder.indexOf(order.status);
    if (direction === 'next' && currentIdx < statusOrder.length - 1) {
      updateOrderStatus(order.id, statusOrder[currentIdx + 1], currentUser);
    } else if (direction === 'prev' && currentIdx > 0) {
      updateOrderStatus(order.id, statusOrder[currentIdx - 1], currentUser);
    }
  };

  const sendWhatsApp = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Halo Kak ${order.customerName},\n\nUpdate pesanan di *${storeSettings.storeName}*:\nNo. SPK: *${order.spkNumber}*\nStatus: *${
      order.status === 'ready' ? 'SUDAH SELESAI & SIAP DIAMBIL' : order.status.toUpperCase()
    }*\nTotal: ${formatRupiah(order.total)}\nSisa Bayar: ${formatRupiah(order.balance)}\n\nTerima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 flex gap-3 h-full select-none bg-slate-900/40">
      {columns.map((col) => {
        const colOrders = orders.filter((o) => o.status === col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="w-72 md:w-80 shrink-0 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col max-h-full overflow-hidden shadow-lg"
          >
            {/* Column Header */}
            <div className={`px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between ${col.color}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-bold text-xs">{col.label}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono">
                {colOrders.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {colOrders.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-600 text-xs italic">
                  <span>Tidak ada pesanan</span>
                </div>
              ) : (
                colOrders.map((order) => {
                  const isUrgent = order.priority === 'urgent' || order.priority === 'express';
                  const currentIdx = statusOrder.indexOf(order.status);

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className={`group bg-slate-900 hover:bg-slate-850 p-3 rounded-xl border transition-all cursor-pointer shadow-md hover:shadow-xl hover:border-brand-500/50 ${
                        isUrgent ? 'border-rose-500/40' : 'border-slate-800'
                      }`}
                    >
                      {/* Card Header: SPK No & Priority */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-slate-200">{order.spkNumber}</span>
                          {isUrgent && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Urgent
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatDateTime(order.createdAt).split(' ')[0]}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="mt-2">
                        <h4 className="font-bold text-xs text-slate-100 truncate">{order.customerName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</p>
                      </div>

                      {/* Items preview */}
                      <div className="mt-2 space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-850 text-[11px]">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300">
                            <span className="truncate max-w-[170px]">{it.productName}</span>
                            <span className="font-mono text-slate-400 text-[10px] shrink-0">
                              {it.qty} {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial & Deadline Badge */}
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <div>
                          <span className="text-slate-400">Total: </span>
                          <span className="font-bold font-mono text-slate-200">{formatRupiah(order.total)}</span>
                        </div>
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'LUNAS' : `Sisa ${formatRupiah(order.balance)}`}
                        </span>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => sendWhatsApp(order, e)}
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Kirim WA Pelanggan"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSpkPrint(order);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-brand-600/20 text-slate-400 hover:text-brand-400 transition-colors"
                            title="Cetak SPK"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Prev & Next Pipeline Advance */}
                        <div className="flex items-center gap-1">
                          {currentIdx > 0 && (
                            <button
                              onClick={(e) => moveOrder(order, 'prev', e)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-0.5"
                              title="Kembalikan ke status sebelumnya"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {currentIdx < statusOrder.length - 1 && (
                            <button
                              onClick={(e) => moveOrder(order, 'next', e)}
                              className="px-2 py-1 rounded bg-brand-600/20 hover:bg-brand-600 hover:text-white text-brand-300 text-[10px] font-semibold flex items-center gap-0.5 border border-brand-500/30 transition-all"
                              title="Majukan ke status berikutnya"
                            >
                              <span>Lanjut</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
