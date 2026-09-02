import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  X,
  Search,
  Filter,
  ArrowDownRight,
  TrendingDown,
  Building2,
  Users,
  Wrench,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatRupiah } from '../utils/formatters';
import { sanitizeText, sanitizePrice } from '../utils/security';

const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; description: string }[] = [
  {
    key: 'operasional',
    label: 'Biaya Operasional Toko',
    description: 'Listrik PLN, Air PDAM, Wifi Internet, Sewa Ruko/Tempat, Kebersihan & Keamanan',
  },
  {
    key: 'bahan_baku',
    label: 'Pembelian Bahan Baku',
    description: 'Bahan banner flexi, stiker roll, kertas A3, kaos polos, kain spanduk',
  },
  {
    key: 'tinta',
    label: 'Tinta & Toner Cetak',
    description: 'Tinta solvent outdoor, eco-solvent, UV, DTF, toner digital',
  },
  {
    key: 'perlengkapan',
    label: 'Perlengkapan & Finishing',
    description: 'Mata ayam banner, lem korea/aibon, lakban, cutter, packaging, kardus',
  },
  {
    key: 'gaji_karyawan',
    label: 'Gaji & Konsumsi Karyawan',
    description: 'Gaji bulanan, uang lembur, uang makan staf desainer & operator',
  },
  {
    key: 'maintenance',
    label: 'Perawatan & Service Mesin',
    description: 'Service teknisi, ganti printhead, damper, capping, pompa tinta, oli mesin',
  },
  {
    key: 'lain_lain',
    label: 'Pengeluaran Lain-lain (DLL)',
    description: 'Biaya promosi, konsumsi tamu, parkir, retribusi, pengeluaran darurat',
  },
];

export const KasBiayaPage: React.FC = () => {
  const { expenses, addExpense, deleteExpense, orders } = useApp();
  const { currentUser, isOwner } = useAuth();

  // Role Category Restriction:
  // Admin hanya untuk biaya operasional toko & perlengkapan toko
  // Owner bisa semua kategori termasuk Gaji Staf, PO Bahan, dan Pengeluaran DLL
  const availableCategories = useMemo(() => {
    if (currentUser?.role === 'admin') {
      return EXPENSE_CATEGORIES.filter((c) => c.key === 'operasional' || c.key === 'perlengkapan');
    }
    return EXPENSE_CATEGORIES;
  }, [currentUser]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [kategori, setKategori] = useState<ExpenseCategory>('operasional');
  const [deskripsi, setDeskripsi] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [receiptNote, setReceiptNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Category Filter
      if (selectedCategory !== 'all') {
        if (exp.category !== selectedCategory) return false;
      }

      // 2. Date Filter
      const expDate = exp.date.split('T')[0];
      if (dateFrom && expDate < dateFrom) return false;
      if (dateTo && expDate > dateTo) return false;

      // 3. Search Keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchNo = exp.expenseNumber.toLowerCase().includes(q);
        const matchCreator = exp.createdBy.toLowerCase().includes(q);
        if (!matchDesc && !matchNo && !matchCreator) return false;
      }

      return true;
    });
  }, [expenses, selectedCategory, dateFrom, dateTo, search]);

  // Summaries
  const totalPengeluaran = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const totalOperasional = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'operasional')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const totalBahanTinta = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'bahan_baku' || e.category === 'tinta' || e.category === 'perlengkapan')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const totalGaji = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'gaji_karyawan')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const totalLainLain = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.category === 'lain_lain' || e.category === 'maintenance')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const handleOpenAdd = () => {
    setKategori('operasional');
    setDeskripsi('');
    setAmountStr('');
    setPaymentMethod('cash');
    setReceiptNote('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDeskripsi = sanitizeText(deskripsi, 200);
    const cleanAmount = sanitizePrice(amountStr, 0);
    const cleanReceiptNote = sanitizeText(receiptNote, 100);

    if (!cleanDeskripsi || cleanAmount <= 0) {
      alert('Deskripsi dan nominal pengeluaran wajib diisi valid!');
      return;
    }

    addExpense({
      category: kategori,
      description: cleanDeskripsi,
      amount: cleanAmount,
      date: new Date(expenseDate).toISOString(),
      createdBy: currentUser.name,
      paymentMethod,
      receiptNote: cleanReceiptNote || undefined,
    });

    setShowModal(false);
  };

  const getCategoryLabel = (cat: string) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.key === cat);
    return found ? found.label : cat.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1e40af] rounded-sm flex items-center justify-center text-white">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#0f172a] leading-tight block">
              {currentUser?.role === 'admin'
                ? 'Pencatatan Biaya Operasional Toko (Admin / Kasir)'
                : 'Buku Kas & Pengeluaran Toko Percetakan'}
            </span>
            <span className="text-[10px] text-[#64748b]">
              {currentUser?.role === 'admin'
                ? 'Pencatatan Biaya Operasional Toko (Listrik, Air/PDAM, Wifi, Keperluan Perlengkapan Toko)'
                : 'Pencatatan Biaya Operasional, Bahan, Gaji Staf, dan Pengeluaran DLL'}
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded-sm flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="p-3 bg-white border-b border-[#cbd5e1] grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0">
        {/* Card 1: Total Pengeluaran */}
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pengeluaran</span>
            <TrendingDown className="w-3.5 h-3.5 text-[#1e40af]" />
          </div>
          <span className="text-base font-extrabold font-mono text-[#1e40af] block mt-1">
            {formatRupiah(totalPengeluaran)}
          </span>
          <span className="text-[9px] text-[#64748b] block">{filteredExpenses.length} transaksi</span>
        </div>

        {/* Card 2: Operasional */}
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Biaya Operasional</span>
            <Building2 className="w-3.5 h-3.5 text-[#475569]" />
          </div>
          <span className="text-base font-extrabold font-mono text-[#0f172a] block mt-1">
            {formatRupiah(totalOperasional)}
          </span>
          <span className="text-[9px] text-[#64748b] block">Listrik, Air, Wifi, Sewa</span>
        </div>

        {/* Card 3: Bahan & Tinta */}
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bahan, Tinta & Alat</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#475569]" />
          </div>
          <span className="text-base font-extrabold font-mono text-[#0f172a] block mt-1">
            {formatRupiah(totalBahanTinta)}
          </span>
          <span className="text-[9px] text-[#64748b] block">Flexi, Tinta, Mata Ayam</span>
        </div>

        {/* Card 4: Gaji & Staf */}
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gaji & Staf</span>
            <Users className="w-3.5 h-3.5 text-[#475569]" />
          </div>
          <span className="text-base font-extrabold font-mono text-[#0f172a] block mt-1">
            {formatRupiah(totalGaji)}
          </span>
          <span className="text-[9px] text-[#64748b] block">Gaji, Lembur, Makan</span>
        </div>

        {/* Card 5: DLL / Lain-lain */}
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2">
          <div className="flex items-center justify-between text-[#475569]">
            <span className="text-[10px] font-bold uppercase tracking-wider">DLL & Service Mesin</span>
            <HelpCircle className="w-3.5 h-3.5 text-[#475569]" />
          </div>
          <span className="text-base font-extrabold font-mono text-[#0f172a] block mt-1">
            {formatRupiah(totalLainLain)}
          </span>
          <span className="text-[9px] text-[#64748b] block">Maintenance, Promosi, DLL</span>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-[#f8fafc] border-b border-[#cbd5e1] px-3 py-2 flex flex-wrap items-center gap-2 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari deskripsi, no bukti, dicatat oleh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
          />
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-[#475569]">Kategori:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
          >
            <option value="all">Semua Kategori</option>
            {availableCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tanggal */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-[#475569]">Dari:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-0.5 bg-white border border-[#94a3b8] rounded-sm text-xs font-mono"
          />
          <label className="text-[11px] font-semibold text-[#475569]">S/d:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-0.5 bg-white border border-[#94a3b8] rounded-sm text-xs font-mono"
          />
        </div>

        {(search || selectedCategory !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-2 py-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] rounded-sm text-[11px] font-medium"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 4. Table of Expenses */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-32">No. Bukti</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-24">Tanggal</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-44">Kategori Pengeluaran</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Deskripsi / Keperluan</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Metode</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-32">Dicatat Oleh</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-32 text-rose-700">Nominal (Rp)</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-14">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#94a3b8]">
                  Tidak ada data pengeluaran kas yang sesuai dengan filter
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#f8fafc]">
                  <td className="border border-[#cbd5e1] px-2 py-1.5 font-mono text-[#1e40af] font-bold">
                    {exp.expenseNumber}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-[#64748b] font-mono">
                    {formatDate(exp.date)}
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#334155] border border-slate-200 block truncate">
                      {getCategoryLabel(exp.category)}
                    </span>
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-medium text-[#0f172a]">
                    {exp.description}
                    {exp.receiptNote && (
                      <span className="block text-[10px] text-[#64748b] font-normal italic">
                        Ket: {exp.receiptNote}
                      </span>
                    )}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center uppercase font-mono text-[10px] text-[#475569]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        exp.paymentMethod === 'cash'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-[#1e40af] border border-blue-200'
                      }`}
                    >
                      {exp.paymentMethod}
                    </span>
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#475569] font-medium">
                    {exp.createdBy}
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-rose-700">
                    {formatRupiah(exp.amount)}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus pengeluaran "${exp.description}"?`)) {
                          deleteExpense(exp.id);
                        }
                      }}
                      className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5]"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Modal Catat Pengeluaran Baru */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-md p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">Catat Pengeluaran Kas Baru</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Tanggal & Metode Bayar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="cash">Kas Tunai Kasir</option>
                    <option value="transfer">Transfer Bank (BCA / Mandiri)</option>
                  </select>
                </div>
              </div>

              {/* Kategori Pengeluaran */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {currentUser?.role === 'admin' ? 'Kategori Biaya Operasional Toko *' : 'Kategori Pengeluaran *'}
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as ExpenseCategory)}
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                >
                  {availableCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} ({c.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Deskripsi / Rincian Pengeluaran *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Contoh: Beli token listrik 11.000 VA / Beli lem aibon 2 kaleng"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              {/* Nominal (Bisa Diketik Langsung) */}
              <div>
                <label className="block text-[11px] font-bold text-rose-700 mb-1">
                  Nominal Pengeluaran (Rp) * — <span className="font-normal text-[10px] text-[#64748b]">Ketik Bebas</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 150000"
                    className="w-full pl-3 pr-3 py-1.5 border-2 border-rose-300 rounded text-sm font-mono font-bold text-rose-700 select-text cursor-text focus:outline-none focus:border-rose-600"
                    required
                  />
                </div>
                {amountStr && (
                  <span className="text-[11px] font-mono font-bold text-rose-700 mt-1 block">
                    = {formatRupiah(parseFloat(amountStr) || 0)}
                  </span>
                )}
              </div>

              {/* Catatan Tambahan / Nomor Nota */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  No. Nota / Kwitansi / Keterangan Toko (Opsional)
                </label>
                <input
                  type="text"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  placeholder="Contoh: Toko Bangunan Berkah / Nota #889"
                  className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs select-text cursor-text"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
