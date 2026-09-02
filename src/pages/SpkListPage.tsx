import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  QrCode,
} from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { formatDate, formatDateTime, formatRupiah, getStatusBadge } from '../utils/formatters';

interface SpkListPageProps {
  onSelectOrder: (order: Order) => void;
  onPrintSpk: (order: Order) => void;
}

export const SpkListPage: React.FC<SpkListPageProps> = ({
  onSelectOrder,
  onPrintSpk,
}) => {
  const { orders } = useApp();
  const [search, setSearch] = useState('');
  const [machineFilter, setMachineFilter] = useState('all');

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.spkNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

    const matchMachine =
      machineFilter === 'all' ||
      o.items.some((i) => i.targetMachine?.toLowerCase().includes(machineFilter.toLowerCase()));

    return matchSearch && matchMachine;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Daftar Surat Perintah Kerja (SPK) Produksi</h2>
          <p className="text-xs text-slate-400">Lembar instruksi cetak, spesifikasi ukuran, bahan, finishing & mesin operator</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. SPK, Pelanggan, Produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* SPK Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const statusBadge = getStatusBadge(order.status);
          const isUrgent = order.priority === 'urgent' || order.priority === 'express';

          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3 cursor-pointer hover:border-brand-500/50 transition-all ${
                isUrgent ? 'border-rose-500/40' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-black font-mono text-sm text-slate-100">{order.spkNumber}</span>
                    {isUrgent && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        URGENT
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="mt-2.5">
                  <h4 className="font-bold text-sm text-slate-100">{order.customerName}</h4>
                  <p className="text-xs text-slate-400 font-mono">{order.customerPhone}</p>
                </div>

                {/* Items preview */}
                <div className="mt-3 space-y-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{it.productName}</span>
                        <span className="text-brand-300 font-mono">
                          {it.qty} {it.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">Bahan: {it.materialName}</p>
                      {it.lengthM && it.widthM && (
                        <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                          Ukuran: {it.lengthM}m × {it.widthM}m ({it.areaM2} m²)
                        </p>
                      )}
                      {it.finishingNames.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Finishing: {it.finishingNames.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline & Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-400">
                  <span>Deadline: </span>
                  <span className="font-bold font-mono text-amber-300">{formatDateTime(order.deadline)}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintSpk(order);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak SPK</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
