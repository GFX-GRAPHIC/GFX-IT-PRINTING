import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { sounds } from '../utils/soundEffects';

interface ProduksiPageProps {
  onPrintSpk: (order: Order) => void;
}

export const ProduksiPage: React.FC<ProduksiPageProps> = ({ onPrintSpk }) => {
  const { orders, updateOrderStatus } = useApp();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notification, setNotification] = useState('');

  const isAdminRole = currentUser?.role === 'admin';

  const productionOrders = useMemo(() => {
    return orders.filter((o) => {
      const isApprovedOrInProd =
        o.designStatus === 'approved' ||
        ['production', 'finishing', 'ready', 'completed'].includes(o.status);

      if (!isApprovedOrInProd) return false;

      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSpk = o.spkNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchItem = o.items.some((i) => i.productName.toLowerCase().includes(q) || (i.fileName && i.fileName.toLowerCase().includes(q)));
        if (!matchSpk && !matchCust && !matchItem) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    if (isAdminRole) {
      alert('Perhatian: Akun Admin hanya memiliki hak akses memantau produksi. Pengubahan status produksi hanya dapat dilakukan oleh Operator!');
      return;
    }
    updateOrderStatus(order.id, newStatus, currentUser, `Status produksi diubah menjadi ${newStatus}`);
    sounds.playSuccess();
    setNotification(`✓ Status ${order.spkNumber} diperbarui menjadi ${newStatus.toUpperCase()}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'production':
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[10px] inline-block">
            Sedang Diproduksi
          </span>
        );
      case 'finishing':
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded font-semibold text-[10px] inline-block">
            Finishing / QC
          </span>
        );
      case 'ready':
      case 'completed':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-semibold text-[10px] inline-block">
            Selesai Cetak
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded font-semibold text-[10px] inline-block">
            Antrean Cetak
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-[#0f172a]">Antrean Produksi Workshop</span>
          <span className="text-[11px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#cbd5e1]">
            Total: <b>{productionOrders.length}</b> SPK
          </span>

          {isAdminRole && (
            <span className="bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] px-2.5 py-0.5 rounded text-[11px] font-bold">
              Mode Monitoring Admin (Hanya Melihat)
            </span>
          )}
        </div>

        <div className="w-64">
          <input
            type="text"
            placeholder="Cari No. SPK, File, Konsumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
          />
        </div>
      </div>

      <div className="bg-white border-b border-[#cbd5e1] px-3 py-1.5 flex items-center gap-1.5 text-[11px]">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-[#1e40af] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          Semua
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            statusFilter === 'pending' ? 'bg-[#1e40af] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          Antrean
        </button>

        <button
          onClick={() => setStatusFilter('production')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            statusFilter === 'production' ? 'bg-[#1e40af] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          Sedang Diproduksi
        </button>

        <button
          onClick={() => setStatusFilter('finishing')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            statusFilter === 'finishing' ? 'bg-[#1e40af] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          Finishing
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1 rounded font-medium transition-colors ${
            statusFilter === 'completed' ? 'bg-[#1e40af] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          Selesai
        </button>
      </div>

      {notification && (
        <div className="bg-[#eff6ff] border-b border-[#bfdbfe] text-[#1e40af] px-4 py-1 text-xs font-semibold">
          {notification}
        </div>
      )}

      <div className="flex-1 overflow-auto p-2 bg-white">
        {productionOrders.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-[#64748b]">
            <p className="font-bold text-xs text-[#334155]">Tidak Ada Antrean Produksi</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              Hanya SPK yang telah di-Approve oleh Admin yang akan tampil di sini.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-28">No. SPK</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-24">Tgl Dibuat</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Konsumen</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Rincian Item & Spesifikasi Cetak</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Designer</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-48">
                  {isAdminRole ? 'Status Pengerjaan' : 'Update Status Operator'}
                </th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Cetak SPK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {productionOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#f8fafc]">
                  {/* No SPK */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 font-bold font-mono text-[#1e40af]">
                    {order.spkNumber}
                  </td>

                  {/* Tgl Dibuat */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-[#64748b]">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Konsumen */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5">
                    <div className="font-bold text-[#0f172a]">{order.customerName}</div>
                    <div className="text-[10px] font-mono text-[#64748b]">{order.customerPhone}</div>
                  </td>

                  {/* Detail Item, Ukuran, File & Catatan */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#334155] space-y-1">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="border-b border-dashed border-[#e2e8f0] pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0f172a]">• {it.productName}</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-mono font-bold text-[10px] text-[#1e40af]">
                            Qty: {it.qty} {it.unit}
                          </span>
                          {it.lengthM && it.widthM && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono text-[10px]">
                              {it.lengthM}m × {it.widthM}m ({it.areaM2} m²)
                            </span>
                          )}
                        </div>

                        {it.fileName && (
                          <div className="text-[10px] text-[#64748b] font-mono pl-3">
                            File: <b className="text-[#334155]">{it.fileName}</b>
                          </div>
                        )}

                        {it.notes && (
                          <div className="text-[10px] text-[#b91c1c] pl-3 italic">
                            Catatan: {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>

                  {/* Designer PIC */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-bold text-[#475569] font-mono">
                    {order.designerName || 'MARGIN'}
                  </td>

                  {/* Current Status Badge */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    {getStatusBadge(order.status)}
                  </td>

                  {/* Operator Update Status Actions / Admin Read-Only Monitor */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    {isAdminRole ? (
                      <div className="text-[11px] text-[#64748b] bg-[#f8fafc] py-1 px-2 rounded border border-[#e2e8f0] text-center font-medium">
                        Hanya Memantau
                      </div>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order, e.target.value as OrderStatus)}
                        className="w-full bg-white border border-[#94a3b8] rounded px-2 py-1 text-xs font-bold text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                      >
                        <option value="pending">Antrean (Belum Diproduksi)</option>
                        <option value="production">Sedang Diproduksi</option>
                        <option value="finishing">Proses Finishing</option>
                        <option value="completed">Selesai Cetak</option>
                      </select>
                    )}
                  </td>

                  {/* Cetak SPK Lembar Kerja */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <button
                      onClick={() => onPrintSpk(order)}
                      className="px-3 py-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8] font-medium text-[10px] mx-auto transition-colors"
                      title="Cetak Lembar SPK Kerja (Printer Epson / A4)"
                    >
                      Cetak SPK
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
