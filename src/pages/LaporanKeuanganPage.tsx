import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Clock,
  Calendar,
  History,
  Eye,
  FileText,
  TrendingUp,
  Wallet,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, formatRupiah } from '../utils/formatters';
import { CashierShift } from '../types';
import { ShiftReceiptDocument } from '../components/pos/ShiftReceiptDocument';

export const LaporanKeuanganPage: React.FC = () => {
  const { orders, expenses, shifts } = useApp();

  const [activeTab, setActiveTab] = useState<'sales' | 'shift'>('sales');

  // Filter Periode (Per Hari / Per Bulan / Per Tahun)
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  const [periodType, setPeriodType] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [filterDay, setFilterDay] = useState(todayDateStr);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterYear, setFilterYear] = useState(currentYearStr);
  const [filterCashier, setFilterCashier] = useState('all');

  const [inspectShift, setInspectShift] = useState<CashierShift | null>(null);
  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState<CashierShift | null>(null);

  const monthOptions = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearOptions = ['2024', '2025', '2026', '2027', '2028'];

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      const orderDateStr = o.createdAt.split('T')[0];
      const orderYear = String(orderDate.getFullYear());
      const orderMonth = String(orderDate.getMonth() + 1).padStart(2, '0');

      if (periodType === 'day' && orderDateStr !== filterDay) return false;
      if (periodType === 'month' && (orderYear !== filterYear || orderMonth !== filterMonth)) return false;
      if (periodType === 'year' && orderYear !== filterYear) return false;

      return true;
    });
  }, [orders, periodType, filterDay, filterMonth, filterYear]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      const expDateStr = e.date.split('T')[0];
      const expYear = String(expDate.getFullYear());
      const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');

      if (periodType === 'day' && expDateStr !== filterDay) return false;
      if (periodType === 'month' && (expYear !== filterYear || expMonth !== filterMonth)) return false;
      if (periodType === 'year' && expYear !== filterYear) return false;

      return true;
    });
  }, [expenses, periodType, filterDay, filterMonth, filterYear]);

  // Unique Cashiers
  const uniqueCashiers = useMemo(() => {
    const names = new Set<string>();
    shifts.forEach((s) => {
      if (s.cashierName) names.add(s.cashierName);
    });
    return Array.from(names);
  }, [shifts]);

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const shiftDate = new Date(s.startTime);
      const shiftDateStr = s.startTime.split('T')[0];
      const shiftYear = String(shiftDate.getFullYear());
      const shiftMonth = String(shiftDate.getMonth() + 1).padStart(2, '0');

      if (periodType === 'day' && shiftDateStr !== filterDay) return false;
      if (periodType === 'month' && (shiftYear !== filterYear || shiftMonth !== filterMonth)) return false;
      if (periodType === 'year' && shiftYear !== filterYear) return false;
      if (filterCashier !== 'all' && s.cashierName !== filterCashier) return false;

      return true;
    });
  }, [shifts, periodType, filterDay, filterMonth, filterYear, filterCashier]);

  // Financial calculations
  const totalOmset = filteredOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalTerbayar = filteredOrders.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalBiaya = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const labaBersih = totalOmset - totalBiaya;

  // Breakdown by group
  const groupTotals: Record<string, number> = {};
  filteredOrders.forEach((o) => {
    o.items.forEach((it) => {
      const g = (it.category || 'INDOOR').toUpperCase();
      groupTotals[g] = (groupTotals[g] || 0) + it.subtotal;
    });
  });

  // Shift Metrics
  const shiftMetrics = useMemo(() => {
    let totalOpeningCash = 0;
    let totalCashSales = 0;
    let totalNonCashSales = 0;
    let totalExpenses = 0;
    let totalExpectedCash = 0;
    let totalActualCash = 0;
    let totalDifference = 0;
    let closedCount = 0;

    filteredShifts.forEach((s) => {
      totalOpeningCash += s.openingCash || 0;
      totalCashSales += s.totalCashSales || 0;
      totalNonCashSales += s.totalNonCashSales || 0;
      totalExpenses += s.totalExpenses || 0;
      totalExpectedCash += s.expectedCash || 0;

      if (s.status === 'closed') {
        totalActualCash += s.actualCash || 0;
        totalDifference += s.difference || 0;
        closedCount++;
      }
    });

    return {
      totalOpeningCash,
      totalCashSales,
      totalNonCashSales,
      totalExpenses,
      totalExpectedCash,
      totalActualCash,
      totalDifference,
      closedCount,
      totalCount: filteredShifts.length,
    };
  }, [filteredShifts]);

  // Export Sales CSV
  const exportSalesCsv = () => {
    const headers = ['No. SPK', 'No. Faktur', 'Tanggal', 'Konsumen', 'Total (Rp)', 'Terbayar (Rp)', 'Status Bayar'];
    const rows = filteredOrders.map((o) => [
      o.spkNumber,
      o.orderNumber,
      o.createdAt.split('T')[0],
      `"${o.customerName}"`,
      o.total,
      o.paidAmount,
      o.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Laporan_Penjualan_${periodType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Shift CSV
  const exportShiftCsv = () => {
    const headers = [
      'No. Shift',
      'Kasir Bertugas',
      'Waktu Buka',
      'Waktu Tutup',
      'Status',
      'Modal Awal (Rp)',
      'Penjualan Kas Tunai (Rp)',
      'Penjualan Non-Tunai (Rp)',
      'Pengeluaran Kas (Rp)',
      'Ekspektasi Kas Sistem (Rp)',
      'Fisik Uang Riil Laci (Rp)',
      'Selisih Kas (Rp)',
      'Catatan Tutup Kasir',
    ];

    const rows = filteredShifts.map((s) => [
      s.shiftNumber,
      `"${s.cashierName}"`,
      s.startTime ? new Date(s.startTime).toLocaleString('id-ID') : '',
      s.endTime ? new Date(s.endTime).toLocaleString('id-ID') : 'Aktif',
      s.status === 'closed' ? 'Tutup' : 'Berjalan',
      s.openingCash,
      s.totalCashSales,
      s.totalNonCashSales,
      s.totalExpenses,
      s.expectedCash,
      s.actualCash ?? '',
      s.difference ?? 0,
      `"${(s.closingNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Laporan_Shift_${periodType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1e40af]" />
            <span className="font-bold text-sm text-[#0f172a]">Laporan Keuangan & Audit Shift Owner</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white rounded border border-slate-300 p-0.5 ml-2">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'sales' ? 'bg-[#1e40af] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penjualan & Laba Rugi
            </button>
            <button
              onClick={() => setActiveTab('shift')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'shift' ? 'bg-[#1e40af] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Shift Kasir & Uang Kas</span>
            </button>
          </div>
        </div>

        <button
          onClick={activeTab === 'sales' ? exportSalesCsv : exportShiftCsv}
          className="px-3 py-1 bg-white hover:bg-[#e2e8f0] border border-[#94a3b8] rounded-sm text-xs font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Filter Toolbar (Per Hari, Per Bulan, Per Tahun) */}
      <div className="bg-white border-b border-[#cbd5e1] p-3 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Periode Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[#475569] uppercase mr-1">Filter Periode:</span>
            <button
              type="button"
              onClick={() => setPeriodType('all')}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                periodType === 'all'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Semua Periode
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodType('day');
                setFilterDay(todayDateStr);
              }}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                periodType === 'day'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Per Hari
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodType('month');
                setFilterMonth(currentMonthStr);
                setFilterYear(currentYearStr);
              }}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                periodType === 'month'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Per Bulan
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodType('year');
                setFilterYear(currentYearStr);
              }}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                periodType === 'year'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Per Tahun
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPeriodType('all');
              setFilterCashier('all');
            }}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-medium cursor-pointer"
          >
            Reset Filter
          </button>
        </div>

        {/* Input Dinamis Periode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200">
          {periodType === 'day' && (
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Tanggal Hari:</label>
                <input
                  type="date"
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#1e40af]"
                />
              </div>
              <button
                type="button"
                onClick={() => setFilterDay(todayDateStr)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium cursor-pointer"
              >
                Hari Ini
              </button>
            </div>
          )}

          {periodType === 'month' && (
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Bulan:</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#1e40af]"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Tahun:</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#1e40af]"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {periodType === 'year' && (
            <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Pilih Tahun:</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#1e40af]"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      Tahun {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'shift' && (
            <div>
              <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Kasir Bertugas:</label>
              <select
                value={filterCashier}
                onChange={(e) => setFilterCashier(e.target.value)}
                className="w-full px-2.5 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#1e40af]"
              >
                <option value="all">-- Semua Kasir --</option>
                {uniqueCashiers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ================= TAB 1: PENJUALAN & LABA RUGI ================= */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 border border-[#cbd5e1] rounded-md shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Total Omset Penjualan</span>
                <div className="text-lg font-bold font-mono text-[#1e40af] mt-1">{formatRupiah(totalOmset)}</div>
                <span className="text-[10px] text-[#64748b]">Dari {filteredOrders.length} transaksi SPK</span>
              </div>

              <div className="bg-white p-3.5 border border-[#cbd5e1] rounded-md shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Kas Terbayar Masuk</span>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatRupiah(totalTerbayar)}</div>
                <span className="text-[10px] text-[#64748b]">Uang muka + pelunasan</span>
              </div>

              <div className="bg-white p-3.5 border border-[#cbd5e1] rounded-md shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Total Biaya Operasional</span>
                <div className="text-lg font-bold font-mono text-rose-700 mt-1">{formatRupiah(totalBiaya)}</div>
                <span className="text-[10px] text-[#64748b]">Dari {filteredExpenses.length} bukti kas keluar</span>
              </div>

              <div className="bg-white p-3.5 border border-[#cbd5e1] rounded-md shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Estimasi Laba Bersih</span>
                <div className={`text-lg font-bold font-mono mt-1 ${labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatRupiah(labaBersih)}
                </div>
                <span className="text-[10px] text-[#64748b]">Omset - Pengeluaran</span>
              </div>
            </div>

            {/* Group Item Breakdown Table */}
            <div className="bg-white border border-[#cbd5e1] rounded-md overflow-hidden shadow-2xs">
              <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#cbd5e1] font-bold text-xs text-[#0f172a] flex justify-between items-center">
                <span>Rekap Pendapatan per Kategori Produk Cetak</span>
                <span className="text-[10px] font-normal text-slate-500 font-mono">Periode Terpilih</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#475569] text-[10px] font-bold border-b border-[#cbd5e1]">
                    <th className="px-3.5 py-2 text-left">Group Kategori</th>
                    <th className="px-3.5 py-2 text-right w-48">Total Omset (Rp)</th>
                    <th className="px-3.5 py-2 text-right w-28">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {Object.keys(groupTotals).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400">
                        Tidak ada transaksi SPK pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupTotals).map(([grp, val]) => {
                      const pct = totalOmset > 0 ? Math.round((val / totalOmset) * 100) : 0;
                      return (
                        <tr key={grp} className="hover:bg-[#f8fafc]">
                          <td className="px-3.5 py-2 font-bold font-mono text-[#0f172a]">{grp}</td>
                          <td className="px-3.5 py-2 text-right font-mono font-bold text-[#1e40af]">{formatRupiah(val)}</td>
                          <td className="px-3.5 py-2 text-right font-mono text-[#475569]">{pct}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LAPORAN SHIFT KASIR & UANG KAS ================= */}
        {activeTab === 'shift' && (
          <div className="space-y-4">
            {/* Shift Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Uang Fisik Laci</span>
                <div className="text-sm font-mono font-extrabold text-[#1e40af] mt-0.5">
                  {formatRupiah(shiftMetrics.totalActualCash)}
                </div>
                <span className="text-[9px] text-slate-500">Uang riil diserahkan kasir</span>
              </div>

              <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Kas Masuk (Tunai)</span>
                <div className="text-sm font-mono font-extrabold text-emerald-700 mt-0.5">
                  +{formatRupiah(shiftMetrics.totalCashSales)}
                </div>
                <span className="text-[9px] text-slate-500">Penjualan tunai laci</span>
              </div>

              <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Penjualan Non-Tunai</span>
                <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                  +{formatRupiah(shiftMetrics.totalNonCashSales)}
                </div>
                <span className="text-[9px] text-slate-500">BCA & QRIS</span>
              </div>

              <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Pengeluaran Kas Toko</span>
                <div className="text-sm font-mono font-extrabold text-rose-600 mt-0.5">
                  -{formatRupiah(shiftMetrics.totalExpenses)}
                </div>
                <span className="text-[9px] text-slate-500">Kas keluar operasional</span>
              </div>

              <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Modal Awal</span>
                <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                  {formatRupiah(shiftMetrics.totalOpeningCash)}
                </div>
                <span className="text-[9px] text-slate-500">Uang kembalian awal</span>
              </div>

              <div className={`border rounded p-2.5 shadow-2xs ${
                shiftMetrics.totalDifference === 0
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : shiftMetrics.totalDifference < 0
                  ? 'bg-rose-50/70 border-rose-300'
                  : 'bg-amber-50/70 border-amber-300'
              }`}>
                <span className="text-[10px] font-bold uppercase text-slate-600 block">Audit Selisih Kas</span>
                <div className={`text-sm font-mono font-extrabold mt-0.5 ${
                  shiftMetrics.totalDifference === 0
                    ? 'text-emerald-700'
                    : shiftMetrics.totalDifference < 0
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}>
                  {shiftMetrics.totalDifference === 0
                    ? '✓ Pas (Rp 0)'
                    : shiftMetrics.totalDifference < 0
                    ? `Kurang ${formatRupiah(shiftMetrics.totalDifference)}`
                    : `Lebih +${formatRupiah(shiftMetrics.totalDifference)}`}
                </div>
                <span className="text-[9px] text-slate-600">{shiftMetrics.closedCount} shift ditutup</span>
              </div>
            </div>

            {/* Table of Shifts */}
            <div className="bg-white border border-[#cbd5e1] rounded-md overflow-hidden shadow-2xs">
              <div className="bg-[#f1f5f9] px-3.5 py-2 border-b border-[#cbd5e1] font-bold text-xs text-[#0f172a] flex justify-between items-center">
                <span>Daftar Riwayat Shift & Tutupan Kasir</span>
                <span className="text-[10px] font-normal text-slate-500 font-mono">
                  {filteredShifts.length} Shift Terdata
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#475569] text-[10px] font-bold border-b border-[#cbd5e1]">
                      <th className="py-2 px-2.5 text-left w-32">No. Shift</th>
                      <th className="py-2 px-2.5 text-left">Kasir Bertugas</th>
                      <th className="py-2 px-2.5 text-left w-36">Waktu Buka / Tutup</th>
                      <th className="py-2 px-2.5 text-right w-24">Modal Awal</th>
                      <th className="py-2 px-2.5 text-right w-28 text-emerald-800">Kas Tunai</th>
                      <th className="py-2 px-2.5 text-right w-24 text-blue-700">Non-Tunai</th>
                      <th className="py-2 px-2.5 text-right w-24 text-rose-700">Pengeluaran</th>
                      <th className="py-2 px-2.5 text-right w-28 text-[#1e40af]">Kas Sistem</th>
                      <th className="py-2 px-2.5 text-right w-28 font-bold">Fisik Laci</th>
                      <th className="py-2 px-2.5 text-center w-28">Status Selisih</th>
                      <th className="py-2 px-2.5 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {filteredShifts.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-slate-400">
                          Tidak ada riwayat shift pada periode yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredShifts.map((s) => {
                        const isClosed = s.status === 'closed';
                        const isZeroDiff = (s.difference || 0) === 0;
                        const isMinus = (s.difference || 0) < 0;

                        return (
                          <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2 px-2.5 font-mono font-bold text-[#1e40af]">{s.shiftNumber}</td>
                            <td className="py-2 px-2.5 font-semibold text-[#0f172a]">{s.cashierName}</td>
                            <td className="py-2 px-2.5 text-[10px] text-[#64748b] font-mono">
                              <div>{formatDate(s.startTime)}</div>
                              {s.endTime && <div className="text-slate-500 font-semibold">s/d {formatDate(s.endTime)}</div>}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-[#475569]">{formatRupiah(s.openingCash)}</td>
                            <td className="py-2 px-2.5 text-right font-mono text-emerald-700 font-bold">
                              +{formatRupiah(s.totalCashSales)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-blue-700 font-semibold">
                              +{formatRupiah(s.totalNonCashSales || 0)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-rose-700">-{formatRupiah(s.totalExpenses)}</td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-[#1e40af]">
                              {formatRupiah(s.expectedCash)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-extrabold text-[#0f172a]">
                              {isClosed ? formatRupiah(s.actualCash || 0) : <span className="text-amber-700 font-semibold">Aktif</span>}
                            </td>
                            <td className="py-2 px-2.5 text-center font-mono">
                              {!isClosed ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Berjalan
                                </span>
                              ) : isZeroDiff ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Pas (Rp 0)
                                </span>
                              ) : isMinus ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Kurang {formatRupiah(s.difference || 0)}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Lebih +{formatRupiah(s.difference || 0)}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setInspectShift(s)}
                                  className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs cursor-pointer"
                                  title="Lihat Rincian Lengkap Tutupan Shift"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-700" />
                                </button>
                                {isClosed && (
                                  <button
                                    onClick={() => setSelectedShiftForPrint(s)}
                                    className="p-1 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] rounded border border-[#bfdbfe] shadow-2xs cursor-pointer"
                                    title="Cetak Struk Z-Report Thermal"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-[#1e40af]" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Shift Modal */}
      {inspectShift && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#1e40af] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-200" />
                <span className="font-bold text-xs">
                  Detail Tutupan Shift: <b className="text-amber-200">{inspectShift.shiftNumber}</b>
                </span>
              </div>
              <button
                onClick={() => setInspectShift(null)}
                className="text-white hover:text-rose-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Kasir Bertugas:</span>
                  <span className="font-bold text-slate-900">{inspectShift.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu Buka Shift:</span>
                  <span className="font-mono text-slate-800">{formatDate(inspectShift.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Waktu Tutup Shift:</span>
                  <span className="font-mono text-slate-800">
                    {inspectShift.endTime ? formatDate(inspectShift.endTime) : 'Shift Masih Berjalan (Belum Ditutup)'}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded p-3 space-y-2 font-mono">
                <div className="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1 font-sans">
                  Rincian Aliran Uang Kas di Laci:
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>(+) Modal Kas Awal di Laci:</span>
                  <span>{formatRupiah(inspectShift.openingCash)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>(+) Penjualan Kas Tunai Masuk:</span>
                  <span>+{formatRupiah(inspectShift.totalCashSales)}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>(i) Penjualan Non-Tunai (BCA/QRIS):</span>
                  <span>+{formatRupiah(inspectShift.totalNonCashSales || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>(-) Pengeluaran Kas Toko:</span>
                  <span>-{formatRupiah(inspectShift.totalExpenses)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900">
                  <span>(=) Ekspektasi Uang Kas Sistem:</span>
                  <span className="text-[#1e40af]">{formatRupiah(inspectShift.expectedCash)}</span>
                </div>

                {inspectShift.status === 'closed' && (
                  <>
                    <div className="border-t border-dashed border-slate-300 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                      <span>Uang Fisik Dihitung Kasir:</span>
                      <span className="text-emerald-700">{formatRupiah(inspectShift.actualCash || 0)}</span>
                    </div>

                    <div className={`p-2 rounded mt-2 text-center font-bold ${
                      (inspectShift.difference || 0) === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (inspectShift.difference || 0) < 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {(inspectShift.difference || 0) === 0
                        ? '✓ KAS SEIMBANG / PAS (SELISIH: RP 0)'
                        : (inspectShift.difference || 0) < 0
                        ? `⚠️ KAS KURANG: ${formatRupiah(inspectShift.difference || 0)}`
                        : `ℹ️ KAS LEBIH: +${formatRupiah(inspectShift.difference || 0)}`}
                    </div>
                  </>
                )}
              </div>

              {inspectShift.closingNotes && (
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Catatan Kasir Saat Tutup Shift:
                  </span>
                  <p className="text-xs text-slate-700 italic">"{inspectShift.closingNotes}"</p>
                </div>
              )}
            </div>

            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-4 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInspectShift(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium cursor-pointer"
              >
                Tutup
              </button>

              {inspectShift.status === 'closed' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShiftForPrint(inspectShift);
                    setInspectShift(null);
                  }}
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk Z-Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Overlay */}
      {selectedShiftForPrint && (
        <ShiftReceiptDocument
          shift={selectedShiftForPrint}
          onClose={() => setSelectedShiftForPrint(null)}
        />
      )}
    </div>
  );
};
