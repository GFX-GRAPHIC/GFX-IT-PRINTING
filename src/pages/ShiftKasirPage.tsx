import React, { useState, useMemo } from 'react';
import {
  Clock,
  DollarSign,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Printer,
  History,
  TrendingUp,
  ArrowDownRight,
  Calculator,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  Download,
  FileText,
  Search,
  Eye,
} from 'lucide-react';
import { CashierShift } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDate } from '../utils/formatters';
import { ShiftReceiptDocument } from '../components/pos/ShiftReceiptDocument';

const CASH_DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000];

export const ShiftKasirPage: React.FC = () => {
  const { shifts, currentShift, startShift, closeShift, expenses } = useApp();
  const { currentUser, isOwner } = useAuth();

  // Filter Periode & Laporan Shift (Per Hari / Per Bulan / Per Tahun)
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(now.getFullYear());

  const [periodType, setPeriodType] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [filterDay, setFilterDay] = useState(todayDateStr);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterYear, setFilterYear] = useState(currentYearStr);
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'closed' | 'open'>('all');

  // Detail Modal Tutupan Shift (Z-Report Inspector)
  const [inspectShift, setInspectShift] = useState<CashierShift | null>(null);

  // Month options (1-12)
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

  // Year options (last 3 years and next 2 years)
  const yearOptions = ['2024', '2025', '2026', '2027', '2028'];

  // Unique Cashiers
  const uniqueCashiers = useMemo(() => {
    const names = new Set<string>();
    shifts.forEach((s) => {
      if (s.cashierName) names.add(s.cashierName);
    });
    return Array.from(names);
  }, [shifts]);

  // Filtered shifts based on period, cashier, status
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const shiftDate = new Date(s.startTime);
      const shiftDateStr = s.startTime.split('T')[0];
      const shiftYear = String(shiftDate.getFullYear());
      const shiftMonth = String(shiftDate.getMonth() + 1).padStart(2, '0');

      // 1. Period Filter
      if (periodType === 'day') {
        if (shiftDateStr !== filterDay) return false;
      } else if (periodType === 'month') {
        if (shiftYear !== filterYear || shiftMonth !== filterMonth) return false;
      } else if (periodType === 'year') {
        if (shiftYear !== filterYear) return false;
      }

      // 2. Cashier Filter
      if (filterCashier !== 'all') {
        if (s.cashierName !== filterCashier) return false;
      }

      // 3. Status Filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'closed' && s.status !== 'closed') return false;
        if (filterStatus === 'open' && s.status !== 'open') return false;
      }

      return true;
    });
  }, [shifts, periodType, filterDay, filterMonth, filterYear, filterCashier, filterStatus]);

  // Summary Metrics of filtered shifts
  const shiftMetrics = useMemo(() => {
    let totalOpeningCash = 0;
    let totalCashSales = 0;
    let totalNonCashSales = 0;
    let totalExpenses = 0;
    let totalExpectedCash = 0;
    let totalActualCash = 0;
    let totalDifference = 0;
    let closedCount = 0;
    let openCount = 0;

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
      } else {
        openCount++;
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
      openCount,
      totalCount: filteredShifts.length,
    };
  }, [filteredShifts]);

  // Export CSV
  const handleExportShiftCsv = () => {
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

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute(
      'download',
      `Laporan_Shift_Kasir_${periodType}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Shift Form State
  const [openingCashStr, setOpeningCashStr] = useState('200000');
  const [startNotes, setStartNotes] = useState('');

  // Close Shift Modal State
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCashStr, setActualCashStr] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [showDenomCalculator, setShowDenomCalculator] = useState(false);
  const [denomCounts, setDenomCounts] = useState<Record<number, string>>({
    100000: '0',
    50000: '0',
    20000: '0',
    10000: '0',
    5000: '0',
    2000: '0',
    1000: '0',
  });

  // Receipt Print Modal
  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState<CashierShift | null>(null);

  // Quick select opening cash
  const quickCashOptions = [100000, 200000, 300000, 500000];

  // Handle Start Shift
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCash = parseFloat(openingCashStr.replace(/[^0-9.]/g, '')) || 0;
    startShift(cleanCash, currentUser, startNotes || 'Modal uang laci kasir awal');
    setStartNotes('');
  };

  // Calculate sum from denomination calculator
  const calculatedDenomTotal = useMemo(() => {
    return CASH_DENOMINATIONS.reduce((acc, rate) => {
      const count = parseInt(denomCounts[rate] || '0') || 0;
      return acc + rate * count;
    }, 0);
  }, [denomCounts]);

  const handleApplyDenomTotal = () => {
    setActualCashStr(calculatedDenomTotal.toString());
    setShowDenomCalculator(false);
  };

  // Open Close Shift Modal
  const handleOpenCloseModal = () => {
    if (!currentShift) return;
    setActualCashStr(isOwner ? currentShift.expectedCash.toString() : '');
    setClosingNotes('');
    setShowDenomCalculator(false);
    setShowCloseModal(true);
  };

  // Calculations inside Close Shift Modal
  const numericActualCash = parseFloat(actualCashStr.replace(/[^0-9.]/g, '')) || 0;
  const currentExpected = currentShift?.expectedCash || 0;
  const modalDifference = numericActualCash - currentExpected;

  // Handle Submit Close Shift
  const handleSubmitCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    const closed = closeShift(currentShift.id, numericActualCash, closingNotes);
    setShowCloseModal(false);
    // Directly open receipt print preview
    setSelectedShiftForPrint(closed);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1e40af] rounded-sm flex items-center justify-center text-white">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#0f172a] leading-tight">
                {isOwner ? 'Pemantauan Shift Kasir & Laporan Uang Kas' : 'Informasi Kasir Bertugas'}
              </span>
              {currentShift ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Shift Aktif: {currentShift.cashierName}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full font-bold text-[10px]">
                  Shift Belum Dibuka
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#64748b]">
              {isOwner
                ? 'Pemantauan kasir bertugas, rekonsiliasi uang fisik laci, dan laporan audit kas per shift'
                : 'Pemantauan kasir yang sedang aktif bertugas'}
            </span>
          </div>
        </div>

        {currentShift && (
          <button
            onClick={handleOpenCloseModal}
            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Tutup Shift Kasir (Settlement)</span>
          </button>
        )}
      </div>

      {/* 2. Main Content */}
      {!isOwner ? (
        /* ================= TAMPILAN KHUSUS ADMIN (KASIR BERTUGAS & TUTUP SHIFT BLIND SETTLEMENT) ================= */
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-[#cbd5e1] rounded-lg p-6 shadow-sm space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#1e40af] mx-auto flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-[#1e40af]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Status Operasional Kasir
              </span>
              <h2 className="text-base font-bold text-[#0f172a] mt-0.5">
                Kasir yang Sedang Bertugas
              </h2>
            </div>

            {currentShift ? (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-left text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600">Status Shift:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Aktif / Bertugas
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Nama Kasir:</span>
                    <span className="font-bold text-slate-900 text-sm">{currentShift.cashierName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">No. Shift:</span>
                    <span className="font-mono font-bold text-[#1e40af]">{currentShift.shiftNumber}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Mulai Bertugas:</span>
                    <span className="font-mono text-slate-800">{formatDate(currentShift.startTime)}</span>
                  </div>

                  {currentShift.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 text-[10px] block font-semibold uppercase">Catatan:</span>
                      <p className="text-slate-700 italic text-[11px] mt-0.5">"{currentShift.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Tombol Tutup Shift Kasir untuk Admin */}
                <button
                  type="button"
                  onClick={handleOpenCloseModal}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Tutup Shift Kasir (Cocokkan Uang & Buat Z-Report)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center space-y-1">
                  <span className="text-xs font-bold text-amber-800 block">
                    Belum Ada Shift Kasir yang Dibuka
                  </span>
                  <p className="text-[11px] text-amber-700">
                    Silakan buka shift baru untuk memulai pencatatan kasir bertugas.
                  </p>
                </div>

                {/* Form Buka Shift Kasir Baru untuk Admin */}
                <form onSubmit={handleStartShift} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0f172a] mb-1">
                      Modal Kas Awal di Laci (Rp):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={openingCashStr}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setOpeningCashStr(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-2.5 py-1.5 border border-[#1e40af] rounded text-sm font-mono font-bold text-[#1e40af] select-text focus:outline-none"
                      required
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {quickCashOptions.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setOpeningCashStr(amt.toString())}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 text-[10px] font-mono cursor-pointer"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Catatan Pembukaan (Opsional):
                    </label>
                    <input
                      type="text"
                      value={startNotes}
                      onChange={(e) => setStartNotes(e.target.value)}
                      placeholder="Contoh: Pecahan kecil lengkap"
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs select-text"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Buka Shift Kasir Sekarang</span>
                  </button>
                </form>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded text-[11px] text-[#1e40af] text-center leading-relaxed">
              <span className="font-semibold">Ketentuan Shift:</span> Saat menutup shift, kasir memasukkan jumlah uang fisik di laci. Setelah diselesaikan, sistem akan menerbitkan <b>Struk Z-Report</b> untuk dicetak dan diserahkan bersama fisik uang.
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAMPILAN KHUSUS OWNER (DATA UANG KAS, TUTUPAN SHIFT & LAPORAN LENGKAP) ================= */
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* IF SHIFT IS OPEN: Show Live Reconciliation Dashboard */}
          {currentShift ? (
          <div className="space-y-4">
            {/* Shift Info Header Card */}
            <div className="bg-white border border-[#cbd5e1] rounded-md p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                    <span>Kasir Bertugas: <b className="text-[#1e40af]">{currentShift.cashierName}</b></span>
                    <span className="font-mono text-[#64748b]">({currentShift.shiftNumber})</span>
                  </div>
                  <span className="text-[11px] text-[#64748b] block mt-0.5">
                    Dibuka pada: <b>{formatDate(currentShift.startTime)}</b>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#64748b] block font-semibold uppercase">
                  Ekspektasi Uang Tunai di Laci Saat Ini:
                </span>
                <span className="text-xl font-extrabold font-mono text-emerald-700">
                  {formatRupiah(currentShift.expectedCash)}
                </span>
              </div>
            </div>

            {/* 4 Cards: Cash Drawer Flow (Formula POS Retail) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Card 1: Modal Awal */}
              <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-[#475569] block">
                  (+) Modal Kas Awal
                </span>
                <span className="text-base font-extrabold font-mono text-[#1e40af] block mt-1">
                  {formatRupiah(currentShift.openingCash)}
                </span>
                <span className="text-[10px] text-[#64748b] block mt-0.5">Uang kembalian di laci</span>
              </div>

              {/* Card 2: Penjualan Kas Tunai */}
              <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                  (+) Penjualan Kas Tunai
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-800 block mt-1">
                  +{formatRupiah(currentShift.totalCashSales)}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Pembayaran SPK tunai</span>
              </div>

              {/* Card 3: Pengeluaran Kasir */}
              <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-rose-700 block">
                  (-) Pengeluaran Operasional
                </span>
                <span className="text-base font-extrabold font-mono text-rose-800 block mt-1">
                  -{formatRupiah(currentShift.totalExpenses)}
                </span>
                <span className="text-[10px] text-[#64748b] block mt-0.5">Operasional toko dari laci</span>
              </div>

              {/* Card 4: Penjualan Non-Tunai */}
              <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                  (ℹ️) Non-Tunai (Bank / QRIS)
                </span>
                <span className="text-base font-extrabold font-mono text-indigo-800 block mt-1">
                  {formatRupiah(currentShift.totalNonCashSales)}
                </span>
                <span className="text-[10px] text-[#64748b] block mt-0.5">Tidak masuk laci fisik</span>
              </div>
            </div>
          </div>
        ) : (
          /* Status Jika Belum Ada Shift Aktif (Khusus Owner: Tanpa Form Buka Shift) */
          <div className="bg-white border border-[#cbd5e1] rounded-md p-4 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
                  <span>Status Kasir: <b className="text-amber-700">Belum Ada Shift yang Sedang Berjalan</b></span>
                </div>
                <span className="text-[11px] text-[#64748b] block mt-0.5">
                  Kasir bertugas belum membuka shift kasir saat ini. Seluruh riwayat dan laporan tutupan shift sebelumnya dapat Anda audit pada tabel laporan di bawah.
                </span>
              </div>
            </div>

            <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded text-[11px] font-semibold text-amber-800 shrink-0">
              Shift Menunggu Kasir
            </div>
          </div>
        )}

        {/* 3. Laporan & Riwayat Shift Kasir (Dengan Filter Per Hari, Bulan, Tahun) */}
        <div className="bg-white border border-[#cbd5e1] rounded-md p-3.5 shadow-xs space-y-3.5">
          {/* Header & Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#1e40af]/10 border border-[#1e40af]/20 flex items-center justify-center text-[#1e40af]">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#0f172a] leading-tight">
                  Laporan Shift Kasir, Uang Kas & Rekonsiliasi Tutup Laci
                </h3>
                <p className="text-[10px] text-[#64748b]">
                  {isOwner ? 'Audit Owner: Pantau fisik uang laci, arus kas masuk/keluar, dan selisih per shift' : 'Riwayat penutupan dan rekonsiliasi kasir'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-[#475569] bg-slate-100 px-2 py-1 rounded border border-slate-200">
                Total: <b>{filteredShifts.length}</b> Shift Terfilter
              </span>

              <button
                type="button"
                onClick={handleExportShiftCsv}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-[#94a3b8] rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:translate-y-0.5 transition-colors"
                title="Unduh laporan shift kasir ke format Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Baris Filter Periode (Per Hari, Per Bulan, Per Tahun, Kasir, Status) */}
          <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Tabs Mode Periode: Semua, Per Hari, Per Bulan, Per Tahun */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#475569] uppercase mr-1">Periode:</span>
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

              {/* Reset Filter Cepat */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('all');
                    setFilterCashier('all');
                    setFilterStatus('all');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-medium"
                >
                  Reset Filter
                </button>
              </div>
            </div>

            {/* Kontrol Input Dinamis Sesuai Mode Periode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200">
              {/* Opsi jika PER HARI */}
              {periodType === 'day' && (
                <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Pilih Tanggal Hari:
                    </label>
                    <input
                      type="date"
                      value={filterDay}
                      onChange={(e) => setFilterDay(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterDay(todayDateStr)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setFilterDay(yest);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium"
                  >
                    Kemarin
                  </button>
                </div>
              )}

              {/* Opsi jika PER BULAN */}
              {periodType === 'month' && (
                <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Pilih Bulan:
                    </label>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                    >
                      {monthOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Tahun:
                    </label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMonth(currentMonthStr);
                      setFilterYear(currentYearStr);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium"
                  >
                    Bulan Ini
                  </button>
                </div>
              )}

              {/* Opsi jika PER TAHUN */}
              {periodType === 'year' && (
                <div className="col-span-1 sm:col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Pilih Tahun:
                    </label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          Tahun {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterYear(currentYearStr)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium"
                  >
                    Tahun Ini
                  </button>
                </div>
              )}

              {/* Filter Nama Kasir */}
              <div>
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                  Kasir Bertugas:
                </label>
                <select
                  value={filterCashier}
                  onChange={(e) => setFilterCashier(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                >
                  <option value="all">-- Semua Kasir --</option>
                  {uniqueCashiers.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status Shift */}
              <div>
                <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                  Status Shift:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                >
                  <option value="all">-- Semua Status --</option>
                  <option value="closed">✓ Sudah Ditutup (Rekonsiliasi)</option>
                  <option value="open">⏳ Masih Aktif / Berjalan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kotak Ringkasan Data Uang Kas (Summary KPI Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Total Fisik Uang Laci */}
            <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Uang Fisik Laci</span>
              <div className="text-sm font-mono font-extrabold text-[#1e40af] mt-0.5">
                {formatRupiah(shiftMetrics.totalActualCash)}
              </div>
              <span className="text-[9px] text-slate-500">Uang riil dihitung kasir</span>
            </div>

            {/* Total Penjualan Tunai */}
            <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Kas Masuk (Tunai)</span>
              <div className="text-sm font-mono font-extrabold text-emerald-700 mt-0.5">
                +{formatRupiah(shiftMetrics.totalCashSales)}
              </div>
              <span className="text-[9px] text-slate-500">Penjualan tunai laci</span>
            </div>

            {/* Total Penjualan Non-Tunai */}
            <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Penjualan Non-Tunai</span>
              <div className="text-sm font-mono font-bold text-blue-700 mt-0.5">
                +{formatRupiah(shiftMetrics.totalNonCashSales)}
              </div>
              <span className="text-[9px] text-slate-500">Transfer & QRIS</span>
            </div>

            {/* Total Pengeluaran Kas */}
            <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Pengeluaran Kas Toko</span>
              <div className="text-sm font-mono font-extrabold text-rose-600 mt-0.5">
                -{formatRupiah(shiftMetrics.totalExpenses)}
              </div>
              <span className="text-[9px] text-slate-500">Kas keluar operasional</span>
            </div>

            {/* Total Modal Awal */}
            <div className="bg-white border border-slate-300 rounded p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Modal Kas Awal</span>
              <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                {formatRupiah(shiftMetrics.totalOpeningCash)}
              </div>
              <span className="text-[9px] text-slate-500">Uang kembalian awal</span>
            </div>

            {/* Audit Selisih Kas */}
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

          {/* Tabel Riwayat & Tutupan Shift */}
          <div className="overflow-x-auto border border-[#cbd5e1] rounded">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] text-[#334155] text-[10px] font-bold border-b border-[#cbd5e1]">
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
                  <th className="py-2 px-2.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-400">
                      Tidak ada riwayat shift yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((s) => {
                    const isClosed = s.status === 'closed';
                    const isZeroDiff = (s.difference || 0) === 0;
                    const isMinus = (s.difference || 0) < 0;

                    return (
                      <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2 px-2.5 font-mono font-bold text-[#1e40af]">
                          {s.shiftNumber}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-[#0f172a]">{s.cashierName}</div>
                          {s.notes && <div className="text-[10px] text-slate-500 italic truncate max-w-[140px]">{s.notes}</div>}
                        </td>
                        <td className="py-2 px-2.5 text-[10px] text-[#64748b] font-mono">
                          <div>{formatDate(s.startTime)}</div>
                          {s.endTime ? (
                            <div className="text-slate-700 font-semibold">s/d {formatDate(s.endTime)}</div>
                          ) : (
                            <span className="text-emerald-700 font-bold">Sedang Berjalan</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-[#475569]">
                          {formatRupiah(s.openingCash)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-emerald-700 font-bold">
                          +{formatRupiah(s.totalCashSales)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-blue-700 font-semibold">
                          +{formatRupiah(s.totalNonCashSales || 0)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-rose-700">
                          -{formatRupiah(s.totalExpenses)}
                        </td>
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
                            {/* Tombol Detail Tutupan Shift */}
                            <button
                              onClick={() => setInspectShift(s)}
                              className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs cursor-pointer"
                              title="Lihat Rincian Lengkap Tutupan Shift"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-700" />
                            </button>

                            {/* Tombol Cetak Struk Z-Report */}
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

      {/* 4. Modal Tutup Shift Kasir (Rekonsiliasi Fisik Uang POS) */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-lg my-auto p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-700" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Tutup Shift Kasir: <b>{currentShift.shiftNumber}</b>
                </h3>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-[#64748b] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCloseShift} className="space-y-3">
              {/* Rekap Arus Kas Sistem: Ditampilkan untuk Owner, atau Ringkasan Kasir untuk Admin */}
              {isOwner ? (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#475569]">(+) Modal Kas Awal di Laci:</span>
                    <span className="font-bold">{formatRupiah(currentShift.openingCash)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>(+) Penjualan Kas Tunai Masuk:</span>
                    <span className="font-bold">+{formatRupiah(currentShift.totalCashSales)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>(-) Pengeluaran Kas Toko:</span>
                    <span className="font-bold">-{formatRupiah(currentShift.totalExpenses)}</span>
                  </div>
                  <div className="border-t border-[#cbd5e1] pt-1 flex justify-between font-extrabold text-sm text-[#0f172a]">
                    <span>(=) EKSPEKTASI UANG KAS:</span>
                    <span className="text-[#1e40af]">{formatRupiah(currentShift.expectedCash)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#eff6ff] border border-[#bfdbfe] p-3 rounded space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Kasir Bertugas:</span>
                    <span className="font-bold text-[#0f172a]">{currentShift.cashierName}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Nomor Shift:</span>
                    <span className="font-mono font-bold text-[#1e40af]">{currentShift.shiftNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Waktu Mulai Bertugas:</span>
                    <span className="font-mono text-slate-900">{formatDate(currentShift.startTime)}</span>
                  </div>
                  <div className="border-t border-[#bfdbfe] pt-1.5 text-[11px] text-[#1e40af] font-medium leading-relaxed">
                    ℹ️ Silakan hitung fisik uang di laci dan masukkan totalnya di bawah. Setelah Anda klik tombol selesai, <b>Laporan Z-Report</b> akan langsung terbit untuk dicetak.
                  </div>
                </div>
              )}

              {/* Input Uang Fisik Hasil Hitungan Kasir */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0f172a]">
                    Uang Fisik di Laci Hasil Hitungan Kasir (Rp) *:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDenomCalculator(!showDenomCalculator)}
                    className="text-[11px] text-[#1e40af] font-bold hover:underline flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showDenomCalculator ? 'Tutup Hitung Pecahan' : 'Hitung Lembar Pecahan'}</span>
                  </button>
                </div>

                {/* Optional Denomination Calculator */}
                {showDenomCalculator && (
                  <div className="bg-[#eff6ff] border border-[#bfdbfe] p-2.5 rounded mb-2 space-y-2">
                    <div className="text-[11px] font-bold text-[#1e40af]">
                      Kalkulator Hitung Lembaran Uang Kertas:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {CASH_DENOMINATIONS.map((rate) => (
                        <div key={rate} className="flex items-center gap-1">
                          <span className="w-20 font-mono text-[10px]">{formatRupiah(rate)}:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={denomCounts[rate] || '0'}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setDenomCounts((prev) => ({ ...prev, [rate]: val }));
                            }}
                            className="w-16 px-1.5 py-0.5 border border-[#94a3b8] rounded text-center font-mono font-bold select-text"
                          />
                          <span className="text-[10px] text-[#64748b]">lbr</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-[#bfdbfe] flex items-center justify-between">
                      <span className="font-bold text-xs">Total Pecahan: {formatRupiah(calculatedDenomTotal)}</span>
                      <button
                        type="button"
                        onClick={handleApplyDenomTotal}
                        className="px-2 py-0.5 bg-[#1e40af] text-white font-bold rounded text-[10px]"
                      >
                        Gunakan Nominal Ini
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  value={actualCashStr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setActualCashStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ketik total uang fisik di laci..."
                  className="w-full px-3 py-2 border-2 border-emerald-600 rounded text-base font-mono font-extrabold text-emerald-800 select-text cursor-text focus:outline-none"
                  required
                />
              </div>

              {/* Status Pencocokan / Selisih: Owner melihat live audit, Kasir/Admin melihat nominal terinput */}
              {isOwner ? (
                <div
                  className={`p-2.5 rounded border text-xs font-bold text-center ${
                    modalDifference === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : modalDifference < 0
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {modalDifference === 0 ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>✓ KAS COCOK & SEIMBANG (Selisih: Rp 0)</span>
                    </div>
                  ) : modalDifference < 0 ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>⚠️ KAS KURANG SEBESAR: {formatRupiah(modalDifference)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>ℹ️ KAS LEBIH SEBESAR: +{formatRupiah(modalDifference)}</span>
                    </div>
                  )}
                </div>
              ) : (
                numericActualCash > 0 && (
                  <div className="p-2.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Total Uang Fisik Diinput: {formatRupiah(numericActualCash)}</span>
                  </div>
                )
              )}

              {/* Catatan Penutupan */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Catatan Penyerahan Uang ke Owner / Supervisor:
                </label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Contoh: Uang fisik diserahkan tunai ke Pak Yahya (Owner)"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3.5 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Selesaikan & Terbitkan Laporan Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Struk Tutup Shift Thermal View */}
      {selectedShiftForPrint && (
        <ShiftReceiptDocument
          shift={selectedShiftForPrint}
          onClose={() => setSelectedShiftForPrint(null)}
        />
      )}

      {/* 6. Modal Detail Tutupan Shift (Z-Report Inspector untuk Owner) */}
      {isOwner && inspectShift && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
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

            {/* Content */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Info Kasir & Waktu */}
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
                <div className="flex justify-between">
                  <span className="text-slate-600">Status Shift:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    inspectShift.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {inspectShift.status === 'closed' ? '✓ DITUTUP & DIREKONSILIASI' : 'SEDANG AKTIF'}
                  </span>
                </div>
              </div>

              {/* Rincian Arus Kas & Rekonsiliasi */}
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

              {/* Catatan Kasir */}
              {inspectShift.closingNotes && (
                <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Catatan Kasir Saat Tutup Shift:
                  </span>
                  <p className="text-xs text-slate-700 italic">"{inspectShift.closingNotes}"</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
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
    </div>
  );
};
