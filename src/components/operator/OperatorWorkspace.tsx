import React, { useState } from 'react';
import {
  Printer,
  Scissors,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Play,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';

interface OperatorWorkspaceProps {
  onSelectOrder: (order: Order) => void;
  onOpenSpkPrint: (order: Order) => void;
}

export const OperatorWorkspace: React.FC<OperatorWorkspaceProps> = ({
  onSelectOrder,
  onOpenSpkPrint,
}) => {
  const { orders, machines, updateOrderStatus, updateMachine } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'production' | 'finishing'>('production');

  const printQueue = orders.filter((o) => o.status === 'production');
  const finishingQueue = orders.filter((o) => o.status === 'finishing');

  const handleStartFinishing = (order: Order) => {
    updateOrderStatus(order.id, 'finishing', currentUser, `Cetak selesai oleh operator ${currentUser.name}. Mulai tahap finishing`);
  };

  const handleFinishJob = (order: Order) => {
    updateOrderStatus(order.id, 'ready', currentUser, `Finishing & QC selesai. Pesanan siap diambil/dikirim`);
  };

  const handleToggleMachineStatus = (machineId: string) => {
    const target = machines.find((m) => m.id === machineId);
    if (!target) return;
    const nextStatus = target.status === 'running' ? 'idle' : target.status === 'idle' ? 'running' : 'idle';
    updateMachine({
      ...target,
      status: nextStatus,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Workspace Produksi & Operator Cetak</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {printQueue.length + finishingQueue.length} Antrean Mesin
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Antrean cetak per mesin, eksekusi SPK, dan konfirmasi pengerjaan finishing pasca-cetak.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Status Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <span>Status Armada Mesin Cetak Workshop</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {machines.map((m) => (
            <div
              key={m.id}
              onClick={() => handleToggleMachineStatus(m.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none bg-slate-950 ${
                m.status === 'running'
                  ? 'border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : m.status === 'maintenance'
                  ? 'border-rose-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">{m.type}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    m.status === 'running'
                      ? 'bg-emerald-500 animate-pulse'
                      : m.status === 'maintenance'
                      ? 'bg-rose-500'
                      : 'bg-slate-600'
                  }`}
                ></span>
              </div>
              <h4 className="font-bold text-xs text-slate-200 mt-1.5 truncate">{m.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                {m.status === 'running' ? '⚡ Sedang Beroperasi' : m.status === 'maintenance' ? '🛠️ Maintenance' : 'Standby / Siaga'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('production')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'production'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>1. Antrean Cetak ({printQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finishing')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'finishing'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>2. Antrean Finishing & QC ({finishingQueue.length})</span>
        </button>
      </div>

      {/* Active Queue Display */}
      {activeTab === 'production' ? (
        printQueue.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">Tidak Ada Antrean Cetak</h3>
            <p className="text-xs text-slate-500">Semua pesanan yang siap cetak telah diproses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printQueue.map((order) => {
              const isUrgent = order.priority === 'urgent' || order.priority === 'express';

              return (
                <div
                  key={order.id}
                  className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3 ${
                    isUrgent ? 'border-rose-500/40' : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-slate-200 text-xs">{order.spkNumber}</span>
                        {isUrgent && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(order.deadline)}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h4 className="font-bold text-sm text-slate-100">{order.customerName}</h4>
                    </div>

                    {/* Items */}
                    <div className="mt-3 space-y-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{it.productName}</span>
                            <span className="text-blue-400 font-mono">
                              {it.qty} {it.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium mt-0.5">Bahan: {it.materialName}</p>
                          {it.lengthM && it.widthM && (
                            <p className="text-[11px] text-amber-300 font-mono font-bold mt-0.5">
                              Ukuran: {it.lengthM}m × {it.widthM}m ({it.areaM2} m²)
                            </p>
                          )}
                          {it.targetMachine && (
                            <p className="text-[10px] text-blue-400 mt-1">Mesin: {it.targetMachine}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <button
                      onClick={() => onOpenSpkPrint(order)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-400" />
                      <span>Cetak Lembar SPK Cetak</span>
                    </button>

                    <button
                      onClick={() => handleStartFinishing(order)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cetak Selesai & Lanjut Finishing</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : finishingQueue.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">Tidak Ada Antrean Finishing</h3>
          <p className="text-xs text-slate-500">Semua pesanan telah diproses ke tahap siap diambil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {finishingQueue.map((order) => (
            <div
              key={order.id}
              className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold font-mono text-slate-200 text-xs">{order.spkNumber}</span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Tahap Finishing</span>
                </div>

                <div className="mt-2.5">
                  <h4 className="font-bold text-sm text-slate-100">{order.customerName}</h4>
                </div>

                {/* Finishing specifications */}
                <div className="mt-3 space-y-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/20 text-xs">
                      <div className="font-bold text-slate-200">{it.productName}</div>
                      <div className="mt-1.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">Instruksi Finishing:</span>
                        {it.finishingNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {it.finishingNames.map((f, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[10px] border border-indigo-500/30"
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Potong Rapi Standard Sesuai Ukuran</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleFinishJob(order)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finishing Selesai (Siap Diambil / Kirim)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
