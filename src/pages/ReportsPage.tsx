import React, { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { RevenueCharts } from '../components/reports/RevenueCharts';
import { ReceivablesReport } from '../components/reports/ReceivablesReport';
import { ExpenseManager } from '../components/reports/ExpenseManager';
import { formatRupiah } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { orders, expenses } = useApp();
  const { isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'receivables' | 'expenses'>('analytics');

  const exportCsv = () => {
    const headers = ['No. Faktur', 'No. SPK', 'Pelanggan', 'No. HP', 'Tanggal', 'Total (Rp)', 'Status Bayar', 'Status Alur'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.spkNumber,
      `"${o.customerName}"`,
      o.customerPhone,
      o.createdAt.split('T')[0],
      o.total,
      o.paymentStatus,
      o.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_Percetakan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Laporan Keuangan & Analitik Percetakan</span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Khusus Owner
            </span>
          </h2>
          <p className="text-xs text-slate-400">Analisis omset harian, piutang tempo pelanggan, dan pencatatan laba bersih usaha</p>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Omset & Analisis Penjualan</span>
        </button>

        <button
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'receivables'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>2. Laporan Piutang & Tagihan</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>3. Pengeluaran Kas & Laba Rugi</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'analytics' && <RevenueCharts orders={orders} />}
      {activeTab === 'receivables' && <ReceivablesReport orders={orders} />}
      {activeTab === 'expenses' && <ExpenseManager />}
    </div>
  );
};
