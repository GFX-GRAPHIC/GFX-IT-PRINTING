import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Receipt,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';
import { Expense } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRupiah } from '../../utils/formatters';

export const ExpenseManager: React.FC = () => {
  const { expenses, addExpense, deleteExpense, orders } = useApp();
  const { currentUser, isOwner } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<Expense['category']>('bahan_baku');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [receiptNote, setReceiptNote] = useState('');

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
  const netProfit = totalRevenue - totalExpense;

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      alert('Deskripsi dan nominal pengeluaran wajib diisi!');
      return;
    }

    addExpense({
      category,
      description,
      amount,
      date: new Date().toISOString(),
      createdBy: currentUser.name,
      paymentMethod,
      receiptNote,
    });

    setShowAddModal(false);
    setDescription('');
    setAmount(0);
    setReceiptNote('');
  };

  const categoryLabels: Record<Expense['category'], { label: string; color: string }> = {
    bahan_baku: { label: 'Bahan Baku (Flexi/Kertas/Kaos)', color: 'text-blue-400 bg-blue-500/10' },
    tinta: { label: 'Tinta & Toner Cetak', color: 'text-purple-400 bg-purple-500/10' },
    sparepart_mesin: { label: 'Sparepart & Servis Mesin', color: 'text-amber-400 bg-amber-500/10' },
    listrik_utilitas: { label: 'Listrik, Air & Internet', color: 'text-yellow-400 bg-yellow-500/10' },
    gaji_bonus: { label: 'Gaji & Bonus Karyawan', color: 'text-emerald-400 bg-emerald-500/10' },
    operasional_lain: { label: 'Operasional Lain-lain', color: 'text-slate-400 bg-slate-500/10' },
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Omset */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Pendapatan (Omset)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Akumulasi pesanan tercatat</p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Pengeluaran Kas
            </span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">
            {formatRupiah(totalExpense)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Bahan, tinta, listrik & operasional</p>
        </div>

        {/* Estimasi Laba Bersih */}
        <div className="bg-gradient-to-br from-brand-950/60 to-slate-950 border border-brand-500/40 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
              Estimasi Laba Kas Usaha
            </span>
            <Wallet className="w-4 h-4 text-brand-400" />
          </div>
          <div className={`text-xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-brand-300' : 'text-rose-400'}`}>
            {formatRupiah(netProfit)}
          </div>
          <p className="text-[10px] text-brand-300/70 mt-0.5">Omset - Pengeluaran Tercatat</p>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Buku Kas Pengeluaran Operasional
            </h3>
            <p className="text-[11px] text-slate-400">Catat semua pembelian bahan, tinta, listrik, dan biaya operasional</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <span>Belum ada pengeluaran kas yang dicatat.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">No. Bukti</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kategori Biaya</th>
                  <th className="p-3">Deskripsi & Keperluan</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3">Dicatat Oleh</th>
                  <th className="p-3 text-right">Nominal (Rp)</th>
                  {isOwner && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {expenses.map((exp) => {
                  const cat = categoryLabels[exp.category];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 font-mono font-semibold text-slate-300">{exp.expenseNumber}</td>
                      <td className="p-3 text-slate-400">{formatDate(exp.date)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{exp.description}</div>
                        {exp.receiptNote && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">{exp.receiptNote}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono uppercase text-[11px] text-slate-400">
                        {exp.paymentMethod}
                      </td>
                      <td className="p-3 text-slate-300">{exp.createdBy}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400 text-sm">
                        {formatRupiah(exp.amount)}
                      </td>
                      {isOwner && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus Pengeluaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Catat Pengeluaran Kas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Kategori Biaya *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="bahan_baku">Bahan Baku (Flexi / Kertas / Kaos)</option>
                  <option value="tinta">Tinta & Toner Mesin</option>
                  <option value="sparepart_mesin">Sparepart & Servis Mesin</option>
                  <option value="listrik_utilitas">Listrik, Air & Internet</option>
                  <option value="gaji_bonus">Gaji / Bonus Staf</option>
                  <option value="operasional_lain">Operasional Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Deskripsi & Keperluan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli 2 roll Flexi 280gr 3.2m x 50m"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min="1000"
                    placeholder="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-rose-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="cash">Kas Tunai</option>
                    <option value="transfer">Transfer Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  No. Nota Suplier / Catatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Supplier Jaya Grafika Nota #998"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
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
