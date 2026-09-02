import React, { useState } from 'react';
import {
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  FileText,
  Upload,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, generateWhatsAppUrl } from '../../utils/formatters';

interface DesignerWorkspaceProps {
  onSelectOrder: (order: Order) => void;
  onOpenSpkPrint: (order: Order) => void;
}

export const DesignerWorkspace: React.FC<DesignerWorkspaceProps> = ({
  onSelectOrder,
  onOpenSpkPrint,
}) => {
  const { orders, updateOrder, updateOrderStatus, storeSettings } = useApp();
  const { currentUser } = useAuth();

  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [designNotesInput, setDesignNotesInput] = useState('');

  // Orders currently needing design or in design phase
  const designOrders = orders.filter(
    (o) => o.status === 'design' || o.items.some((i) => i.designType !== 'ready_to_print' && o.status === 'pending')
  );

  const handleStartDesign = (order: Order) => {
    updateOrder(
      {
        ...order,
        status: 'design',
        designerId: currentUser.id,
        designerName: currentUser.name,
        designStatus: 'in_progress',
      },
      currentUser,
      `Designer ${currentUser.name} mulai mengerjakan desain`
    );
  };

  const handleSaveProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProofOrder) return;
    updateOrder(
      {
        ...selectedProofOrder,
        proofPreviewUrl: proofUrlInput || selectedProofOrder.proofPreviewUrl,
        designNotes: designNotesInput || selectedProofOrder.designNotes,
      },
      currentUser,
      'Proof mockup desain diunggah'
    );
    setSelectedProofOrder(null);
  };

  const handleAccDesign = (order: Order) => {
    updateOrder(
      {
        ...order,
        designStatus: 'approved',
        status: 'production',
      },
      currentUser,
      `Desain telah di-ACC. Pesanan dialihkan ke Antrean Cetak Produksi`
    );
  };

  const handleSendProofWa = (order: Order) => {
    const msg = `Halo Kak ${order.customerName},\n\nDesain pesanan Anda (*${order.spkNumber}*) sudah selesai kami siapkan!\n\nLink Preview / Mockup: ${
      order.proofPreviewUrl || 'Sedang dikirimkan lampiran'
    }\n\nMohon konfirmasi jika sudah sesuai (ACC Cetak) agar segera kami cetak ya. Terima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Workspace Designer & Pre-press</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {designOrders.length} Tugas Desain
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola antrean tugas desain, penyesuaian file cetak, kirim approval mockup ke pelanggan & ACC cetak.
            </p>
          </div>
        </div>
      </div>

      {/* Design Tasks Grid */}
      {designOrders.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">Semua Tugas Desain Selesai!</h3>
          <p className="text-xs text-slate-500">Tidak ada antrean desain baru atau pending approval saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designOrders.map((order) => {
            const isUrgent = order.priority === 'urgent' || order.priority === 'express';

            return (
              <div
                key={order.id}
                className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3 ${
                  isUrgent ? 'border-rose-500/40' : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div>
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

                  {/* Customer */}
                  <div className="mt-2.5">
                    <h4 className="font-bold text-sm text-slate-100">{order.customerName}</h4>
                    <p className="text-xs text-slate-400 font-mono">{order.customerPhone}</p>
                  </div>

                  {/* Items list */}
                  <div className="mt-3 space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex justify-between font-semibold text-slate-200">
                          <span>{it.productName}</span>
                          <span className="text-purple-400 font-mono capitalize">
                            {it.designType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{it.materialName}</p>
                        {it.lengthM && it.widthM && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            Ukuran: {it.lengthM}m × {it.widthM}m
                          </p>
                        )}
                        {it.fileUrl && (
                          <a
                            href={it.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Download Bahan Desain</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Proof Preview if available */}
                  {order.proofPreviewUrl && (
                    <div className="mt-3 bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-purple-300 font-semibold text-[11px]">
                        <span>Mockup / Preview Diunggah</span>
                        <a
                          href={order.proofPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Lihat Full</span>
                        </a>
                      </div>
                      <img
                        src={order.proofPreviewUrl}
                        alt="Proof Preview"
                        className="w-full h-28 object-cover rounded-lg border border-purple-500/30"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedProofOrder(order);
                        setProofUrlInput(order.proofPreviewUrl || '');
                        setDesignNotesInput(order.designNotes || '');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors"
                    >
                      <Upload className="w-3 h-3 text-purple-400" />
                      <span>Upload Preview</span>
                    </button>

                    <button
                      onClick={() => handleSendProofWa(order)}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1 border border-emerald-500/30 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Kirim Approval</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleAccDesign(order)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACC Desain & Kirim ke Cetak</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Upload Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Upload Mockup Preview ({selectedProofOrder.spkNumber})</h3>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProof} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  URL Gambar Preview / Mockup (Direct Image URL / Cloud Link)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... atau https://drive.google.com/..."
                  value={proofUrlInput}
                  onChange={(e) => setProofUrlInput(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Catatan Desain & Revisi
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan dari designer untuk operator atau pelanggan..."
                  value={designNotesInput}
                  onChange={(e) => setDesignNotesInput(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProofOrder(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg"
                >
                  Simpan Mockup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
