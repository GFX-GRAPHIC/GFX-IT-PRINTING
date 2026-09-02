import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Scissors,
  Layers,
  ArrowRightLeft,
  MessageSquare,
  Trash2,
  X,
  FileText,
  AlertCircle,
  User,
  Phone,
  Ruler,
  Calculator,
  History,
  BookOpen,
  CreditCard,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductionBillItem, WorkerDebtItem, PrintPressRowItem } from '../types';
import { formatRupiah } from '../utils/formatters';
import { sanitizeText, sanitizePrice, sanitizePhone, sanitizeDimension } from '../utils/security';

interface PrintPressDraftRow {
  id: string;
  name: string;
  lengthM: string;
  widthM: string;
  qty: string;
}

export const TagihanBiayaProduksiPage: React.FC = () => {
  const {
    productionBills,
    workerDebts,
    addProductionBill,
    deleteProductionBill,
    payProductionBill,
    addWorkerDebt,
    deleteWorkerDebt,
    deductBillFromDebt,
    storeSettings,
  } = useApp();

  // Tab: 'bills' | 'debts'
  const [activeTab, setActiveTab] = useState<'bills' | 'debts'>('bills');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'deducted'>('all');

  // Modals
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [payModalBill, setPayModalBill] = useState<ProductionBillItem | null>(null);
  const [viewHistoryDebt, setViewHistoryDebt] = useState<WorkerDebtItem | null>(null);
  const [viewDetailBill, setViewDetailBill] = useState<ProductionBillItem | null>(null);

  // Form State: Add Bill
  const [billTitle, setBillTitle] = useState('');
  const [billWorkerName, setBillWorkerName] = useState('');
  const [billWorkerPhone, setBillWorkerPhone] = useState('');
  const [billType, setBillType] = useState<'meter' | 'satuan'>('meter');
  const [billStatus, setBillStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [billNotes, setBillNotes] = useState('');

  // Form State: Print Press (Meteran) - Satu harga terpusat & baris bertambah dinamis
  const [pressUnitPriceStr, setPressUnitPriceStr] = useState('5000');
  const [pressRows, setPressRows] = useState<PrintPressDraftRow[]>([
    { id: '1', name: 'Badan Depan', lengthM: '0.8', widthM: '0.6', qty: '10' },
    { id: '2', name: 'Badan Belakang', lengthM: '0.8', widthM: '0.6', qty: '10' },
  ]);

  // Form State: Satuan (tetap sederhana, tidak banyak input otomatis)
  const [satuanQtyStr, setSatuanQtyStr] = useState('10');
  const [satuanPriceStr, setSatuanPriceStr] = useState('35000');

  // Form State: Add Debt
  const [debtWorkerName, setDebtWorkerName] = useState('');
  const [debtPhone, setDebtPhone] = useState('');
  const [debtAmountStr, setDebtAmountStr] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // State inside Pay Modal
  const [payMethodTab, setPayMethodTab] = useState<'debt' | 'cash'>('cash');
  const [paySelectedDebtId, setPaySelectedDebtId] = useState<string>('');
  const [payDeductAmountStr, setPayDeductAmountStr] = useState<string>('');
  const [payCashMethod, setPayCashMethod] = useState<'cash' | 'transfer'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');

  // 1. Perhitungan Live Print Press (Meteran)
  const calculatedPressTotal = useMemo(() => {
    const unitPrice = parseFloat(pressUnitPriceStr.replace(/[^0-9.]/g, '')) || 0;
    let totalAreaAll = 0;

    const items: PrintPressRowItem[] = pressRows.map((r, idx) => {
      const p = parseFloat(r.lengthM.replace(/[^0-9.]/g, '')) || 0;
      const l = parseFloat(r.widthM.replace(/[^0-9.]/g, '')) || 0;
      const q = parseFloat(r.qty.replace(/[^0-9.]/g, '')) || 0;
      const area = Number((p * l * q).toFixed(3));
      const subtotal = Math.round(area * unitPrice);
      totalAreaAll += area;

      return {
        id: r.id || String(idx + 1),
        name: r.name.trim() || `Bagian ${idx + 1}`,
        lengthM: p,
        widthM: l,
        qty: q,
        areaM2: area,
        subtotal,
      };
    });

    return {
      items,
      totalArea: Number(totalAreaAll.toFixed(2)),
      unitPrice,
      totalPrice: Math.round(totalAreaAll * unitPrice),
    };
  }, [pressUnitPriceStr, pressRows]);

  // 2. Perhitungan Live Satuan
  const calculatedSatuanTotal = useMemo(() => {
    const q = parseFloat(satuanQtyStr.replace(/[^0-9.]/g, '')) || 0;
    const p = parseFloat(satuanPriceStr.replace(/[^0-9.]/g, '')) || 0;
    return {
      qty: q,
      unitPrice: p,
      totalPrice: Math.round(q * p),
    };
  }, [satuanQtyStr, satuanPriceStr]);

  // Total Akhir Bill yang sedang diinput
  const currentTotalAmount = billType === 'meter' ? calculatedPressTotal.totalPrice : calculatedSatuanTotal.totalPrice;

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return productionBills.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(s) ||
        b.workerName.toLowerCase().includes(s) ||
        b.billNumber.toLowerCase().includes(s) ||
        (b.workerPhone && b.workerPhone.includes(s))
      );
    });
  }, [productionBills, statusFilter, search]);

  // Filtered Debts
  const filteredDebts = useMemo(() => {
    return workerDebts.filter((d) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        d.workerName.toLowerCase().includes(s) ||
        d.debtNumber.toLowerCase().includes(s) ||
        (d.phone && d.phone.includes(s))
      );
    });
  }, [workerDebts, search]);

  // Metrics
  const metrics = useMemo(() => {
    const totalBills = productionBills.reduce((acc, b) => acc + b.totalAmount, 0);
    const unpaidBills = productionBills
      .filter((b) => b.status === 'unpaid')
      .reduce((acc, b) => acc + b.totalAmount, 0);
    const paidBills = productionBills
      .filter((b) => b.status === 'paid')
      .reduce((acc, b) => acc + b.totalAmount, 0);
    const deductedBills = productionBills
      .filter((b) => b.status === 'deducted')
      .reduce((acc, b) => acc + (b.deductedAmount || b.totalAmount), 0);

    const totalActiveDebts = workerDebts.reduce((acc, d) => acc + d.remainingAmount, 0);
    const totalInitialDebts = workerDebts.reduce((acc, d) => acc + d.initialAmount, 0);

    return {
      totalBills,
      unpaidBills,
      paidBills,
      deductedBills,
      totalActiveDebts,
      totalInitialDebts,
    };
  }, [productionBills, workerDebts]);

  // Open Add Bill
  const handleOpenAddBill = () => {
    setBillTitle('');
    setBillWorkerName('');
    setBillWorkerPhone('');
    setBillType('meter');
    setPressUnitPriceStr('5000');
    setPressRows([
      { id: '1', name: 'Badan Depan', lengthM: '0.8', widthM: '0.6', qty: '10' },
      { id: '2', name: 'Badan Belakang', lengthM: '0.8', widthM: '0.6', qty: '10' },
    ]);
    setSatuanQtyStr('10');
    setSatuanPriceStr('35000');
    setBillStatus('unpaid');
    setBillNotes('');
    setShowAddBillModal(true);
  };

  // Add Print Press Row
  const handleAddPressRow = () => {
    setPressRows((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', lengthM: '', widthM: '', qty: '1' },
    ]);
  };

  // Remove Print Press Row
  const handleRemovePressRow = (index: number) => {
    if (pressRows.length <= 1) {
      alert('Minimal harus ada 1 baris produk print press!');
      return;
    }
    setPressRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Print Press Row field
  const handleUpdatePressRow = (index: number, field: keyof PrintPressDraftRow, val: string) => {
    setPressRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Open Add Debt
  const handleOpenAddDebt = () => {
    setDebtWorkerName('');
    setDebtPhone('');
    setDebtAmountStr('');
    setDebtNotes('');
    setShowAddDebtModal(true);
  };

  // Save Bill
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(billTitle, 100);
    const cleanWorkerName = sanitizeText(billWorkerName, 100);
    const cleanWorkerPhone = sanitizePhone(billWorkerPhone);
    const cleanNotes = sanitizeText(billNotes, 255);

    if (!cleanTitle || !cleanWorkerName) {
      alert('Judul tagihan dan nama pekerja/vendor wajib diisi!');
      return;
    }

    if (billType === 'meter') {
      const unitPrice = sanitizePrice(pressUnitPriceStr, 0);
      if (unitPrice <= 0) {
        alert('Harga ongkos per meter harus lebih dari 0!');
        return;
      }
      if (calculatedPressTotal.totalPrice <= 0) {
        alert('Mohon lengkapi panjang, lebar, dan jumlah pada baris produk!');
        return;
      }

      addProductionBill({
        title: cleanTitle,
        workerName: cleanWorkerName,
        workerPhone: cleanWorkerPhone || '-',
        type: 'meter',
        pricePerMeter: unitPrice,
        printPressItems: calculatedPressTotal.items,
        qty: calculatedPressTotal.items.reduce((sum, item) => sum + item.qty, 0),
        unitPrice,
        totalAmount: calculatedPressTotal.totalPrice,
        status: billStatus,
        notes: cleanNotes || undefined,
      });
    } else {
      const q = sanitizePrice(satuanQtyStr, 0);
      const p = sanitizePrice(satuanPriceStr, 0);
      if (q <= 0 || p <= 0) {
        alert('Jumlah pcs dan harga satuan harus lebih dari 0!');
        return;
      }

      addProductionBill({
        title: cleanTitle,
        workerName: cleanWorkerName,
        workerPhone: cleanWorkerPhone || '-',
        type: 'satuan',
        qty: q,
        unitPrice: p,
        totalAmount: calculatedSatuanTotal.totalPrice,
        status: billStatus,
        notes: cleanNotes || undefined,
      });
    }

    setShowAddBillModal(false);
  };

  // Save Debt
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWorker = sanitizeText(debtWorkerName, 100);
    const amount = sanitizePrice(debtAmountStr, 0);
    const cleanPhone = sanitizePhone(debtPhone);
    const cleanNotes = sanitizeText(debtNotes, 255);

    if (!cleanWorker || amount <= 0) {
      alert('Nama pekerja dan jumlah hutang/kasbon harus diisi valid!');
      return;
    }

    addWorkerDebt({
      workerName: cleanWorker,
      phone: cleanPhone || '-',
      initialAmount: amount,
      remainingAmount: amount,
      notes: cleanNotes || undefined,
    });

    setShowAddDebtModal(false);
  };

  // Open Integrated Pay Modal
  const handleOpenPayModal = (bill: ProductionBillItem) => {
    setPayModalBill(bill);
    setPayNotes('');
    setPayCashMethod('cash');

    // Auto-detect matching debt
    const matched = workerDebts.find(
      (d) =>
        d.remainingAmount > 0 &&
        d.workerName.toLowerCase().trim() === bill.workerName.toLowerCase().trim()
    );

    if (matched) {
      setPaySelectedDebtId(matched.id);
      const defDeduct = Math.min(matched.remainingAmount, bill.totalAmount);
      setPayDeductAmountStr(defDeduct.toString());
      setPayMethodTab('debt');
    } else {
      const anyActive = workerDebts.find((d) => d.remainingAmount > 0);
      if (anyActive) {
        setPaySelectedDebtId(anyActive.id);
        setPayDeductAmountStr(Math.min(anyActive.remainingAmount, bill.totalAmount).toString());
      } else {
        setPaySelectedDebtId('');
        setPayDeductAmountStr('0');
      }
      setPayMethodTab('cash');
    }
  };

  // Execute Payment
  const handleConfirmPayment = () => {
    if (!payModalBill) return;

    if (payMethodTab === 'debt') {
      if (!paySelectedDebtId) {
        alert('Pilih data buku kasbon yang ingin dipotong!');
        return;
      }
      const amount = parseFloat(payDeductAmountStr.replace(/[^0-9.]/g, '')) || 0;
      if (amount <= 0) {
        alert('Nominal pemotongan kasbon harus lebih dari 0!');
        return;
      }

      const res = deductBillFromDebt(payModalBill.id, paySelectedDebtId, amount);
      if (!res.success) {
        alert(res.message);
        return;
      }
      alert(res.message);
      setPayModalBill(null);
    } else {
      payProductionBill(
        payModalBill.id,
        payCashMethod,
        payNotes ? `Dibayar via ${payCashMethod === 'cash' ? 'Tunai/Kas Toko' : 'Transfer'} (${payNotes})` : undefined
      );
      alert(`Tagihan ${payModalBill.billNumber} berhasil dibayar Lunas via ${payCashMethod === 'cash' ? 'Tunai Kasir' : 'Transfer Bank'}!`);
      setPayModalBill(null);
    }
  };

  // Helper WhatsApp format for Bill
  const getWhatsAppBillUrl = (bill: ProductionBillItem) => {
    const rawPhone = (bill.workerPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const storeName = storeSettings?.appName || 'Percetakan Digital';

    let detailStr = '';
    if (bill.type === 'meter' && bill.printPressItems && bill.printPressItems.length > 0) {
      detailStr = bill.printPressItems
        .map(
          (it, i) =>
            `${i + 1}. ${it.name}: ${it.lengthM}m x ${it.widthM}m x ${it.qty} lembar (${it.areaM2} m²) = ${formatRupiah(it.subtotal)}`
        )
        .join('\n');
    } else if (bill.type === 'meter') {
      detailStr = `Rincian: ${bill.lengthM}m x ${bill.widthM}m x ${bill.qty} lembar @ ${formatRupiah(bill.unitPrice)}/m`;
    } else {
      detailStr = `Rincian: ${bill.qty} pcs @ ${formatRupiah(bill.unitPrice)}`;
    }

    const text =
      `*RINCIAN TAGIHAN BIAYA PRODUKSI - ${storeName}*\n` +
      `----------------------------------------\n` +
      `No. Tagihan : ${bill.billNumber}\n` +
      `Pekerja/Vendor : ${bill.workerName}\n` +
      `Judul : ${bill.title}\n` +
      `Tipe Hitung : ${bill.type === 'meter' ? 'Print Press (Meteran)' : 'Produk Satuan'}\n\n` +
      `*DAFTAR RINCIAN:*\n${detailStr}\n\n` +
      `*TOTAL TAGIHAN : ${formatRupiah(bill.totalAmount)}*\n` +
      `Status : ${bill.status === 'deducted' ? 'LUNAS (Dipotong dari Kasbon)' : bill.status === 'paid' ? 'LUNAS (Dibayar Tunai/Kas)' : 'BELUM DIBAYAR'}\n` +
      (bill.notes ? `Catatan : ${bill.notes}\n` : '') +
      `----------------------------------------\n` +
      `Terima kasih atas kerja samanya! 🙏`;

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  // Helper WhatsApp format for Debt
  const getWhatsAppDebtUrl = (debt: WorkerDebtItem) => {
    const rawPhone = (debt.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;
    const storeName = storeSettings?.appName || 'Percetakan Digital';

    const text =
      `*RINCIAN BUKU KASBON / HUTANG PEKERJA - ${storeName}*\n` +
      `----------------------------------------\n` +
      `No. Kasbon : ${debt.debtNumber}\n` +
      `Nama Pekerja : ${debt.workerName}\n` +
      `Kasbon Awal : ${formatRupiah(debt.initialAmount)}\n` +
      `Sudah Terpotong : ${formatRupiah(debt.initialAmount - debt.remainingAmount)}\n` +
      `*Sisa Kasbon Saat Ini : ${formatRupiah(debt.remainingAmount)}*\n` +
      `----------------------------------------\n` +
      `Catatan : ${debt.notes || 'Kasbon operasional'}\n\n` +
      `Dicatat otomatis oleh sistem keuangan ${storeName}. 🙏`;

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const selectedDebtObject = workerDebts.find((d) => d.id === paySelectedDebtId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#1e40af]" />
          <div>
            <h1 className="font-bold text-sm text-[#0f172a] leading-tight">
              Tagihan Biaya Produksi & Manajemen Kasbon Pekerja
            </h1>
            <p className="text-[11px] text-[#64748b]">
              Print Press multi-produk otomatis bertambah, terhubung langsung dengan buku kasbon pekerja
            </p>
          </div>
        </div>

        {/* Tab Buttons & Add Actions (Unified 2-Color Scheme: Navy Blue + Neutral Slate) */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-[#cbd5e1] rounded-sm p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('bills')}
              className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bills'
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tagihan Biaya ({productionBills.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('debts')}
              className={`px-3 py-1 rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'debts'
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Kasbon / Hutang ({workerDebts.length})</span>
            </button>
          </div>

          {activeTab === 'bills' ? (
            <button
              type="button"
              onClick={handleOpenAddBill}
              className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tagihan Biaya</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddDebt}
              className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Hutang / Kasbon</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top KPI Summary Cards (Clean Professional 2-Tone Theme: No Rainbow Colors) */}
      <div className="bg-white border-b border-[#cbd5e1] px-4 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2.5">
          <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block">
            Total Tagihan Biaya
          </span>
          <span className="font-mono font-bold text-sm text-[#1e40af] block mt-0.5">
            {formatRupiah(metrics.totalBills)}
          </span>
          <span className="text-[10px] text-[#64748b] block">{productionBills.length} Tagihan</span>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2.5">
          <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block">
            Sudah Dibayar Tunai
          </span>
          <span className="font-mono font-bold text-sm text-[#0f172a] block mt-0.5">
            {formatRupiah(metrics.paidBills)}
          </span>
          <span className="text-[10px] text-[#64748b] block">Lunas Kasir</span>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2.5">
          <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block">
            Dipotong dari Kasbon
          </span>
          <span className="font-mono font-bold text-sm text-[#0f172a] block mt-0.5">
            {formatRupiah(metrics.deductedBills)}
          </span>
          <span className="text-[10px] text-[#64748b] block">Kompensasi Hutang</span>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2.5">
          <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block">
            Belum Dibayar
          </span>
          <span className="font-mono font-bold text-sm text-[#1e40af] block mt-0.5">
            {formatRupiah(metrics.unpaidBills)}
          </span>
          <span className="text-[10px] text-[#64748b] block">Menunggu Bayar / Potong</span>
        </div>

        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-2.5">
          <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider block">
            Total Kasbon Pekerja
          </span>
          <span className="font-mono font-bold text-sm text-[#0f172a] block mt-0.5">
            {formatRupiah(metrics.totalActiveDebts)}
          </span>
          <span className="text-[10px] text-[#64748b] block">
            Sisa dari {metrics.totalInitialDebts > 0 ? formatRupiah(metrics.totalInitialDebts) : 'Rp 0'}
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#f8fafc] border-b border-[#cbd5e1] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'bills'
                  ? 'Cari tagihan, pekerja, no tagihan...'
                  : 'Cari nama pekerja, nomor kasbon...'
              }
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
            />
          </div>

          {activeTab === 'bills' && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#64748b] font-semibold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs font-semibold"
              >
                <option value="all">Semua Status</option>
                <option value="unpaid">Belum Lunas</option>
                <option value="paid">Lunas (Tunai)</option>
                <option value="deducted">Lunas (Potong Kasbon)</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-[11px] text-[#64748b]">
          Menampilkan{' '}
          <b className="text-[#0f172a]">
            {activeTab === 'bills' ? filteredBills.length : filteredDebts.length}
          </b>{' '}
          data
        </div>
      </div>

      {/* 4. Table Area */}
      <div className="flex-1 overflow-auto p-3 bg-white">
        {activeTab === 'bills' ? (
          /* ================= TABEL TAGIHAN BIAYA ================= */
          <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                <th className="border border-[#cbd5e1] px-2 py-2 text-left w-28">No. Tagihan</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left">Judul Biaya Produksi</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left w-44">Pekerja / Vendor</th>
                <th className="border border-[#cbd5e1] px-2 py-2 text-center w-28">Tipe Hitung</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left w-52">Rincian Volume & Harga</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-right w-32 text-[#1e40af]">
                  Total Biaya
                </th>
                <th className="border border-[#cbd5e1] px-2 py-2 text-center w-32">Status</th>
                <th className="border border-[#cbd5e1] px-2 py-2 text-center w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada tagihan biaya produksi. Klik tombol <b>+ Tambah Tagihan Biaya</b> di atas.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  const isMeter = bill.type === 'meter';
                  const hasPressItems = bill.printPressItems && bill.printPressItems.length > 0;
                  const matchedDebt = workerDebts.find(
                    (d) =>
                      d.remainingAmount > 0 &&
                      d.workerName.toLowerCase().trim() === bill.workerName.toLowerCase().trim()
                  );

                  return (
                    <tr key={bill.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="border border-[#cbd5e1] px-2 py-2 font-mono font-bold text-[#1e40af] align-top">
                        {bill.billNumber}
                        <span className="block text-[10px] font-normal text-[#64748b]">
                          {bill.createdAt.split('T')[0]}
                        </span>
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top">
                        <div className="font-bold text-[#0f172a]">{bill.title}</div>
                        {hasPressItems ? (
                          <div className="text-[10px] text-[#1e40af] mt-0.5">
                            Memuat <b>{bill.printPressItems?.length} baris produk</b> print press (
                            <button
                              type="button"
                              onClick={() => setViewDetailBill(bill)}
                              className="underline hover:text-blue-800 cursor-pointer font-semibold"
                            >
                              Lihat Rincian
                            </button>
                            )
                          </div>
                        ) : bill.notes ? (
                          <div className="text-[11px] text-[#64748b] mt-0.5 italic leading-relaxed">
                            {bill.notes}
                          </div>
                        ) : null}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top">
                        <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#64748b]" />
                          <span>{bill.workerName}</span>
                        </div>
                        {bill.workerPhone && bill.workerPhone !== '-' && (
                          <div className="text-[10px] text-[#64748b] flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-[#1e40af]" />
                            <span>{bill.workerPhone}</span>
                          </div>
                        )}
                        {matchedDebt && (
                          <div className="mt-1 text-[10px] text-[#0f172a] bg-[#f1f5f9] px-1.5 py-0.5 rounded-sm border border-[#cbd5e1] inline-block font-semibold">
                            Kasbon Aktif: {formatRupiah(matchedDebt.remainingAmount)}
                          </div>
                        )}
                      </td>

                      <td className="border border-[#cbd5e1] px-2 py-2 text-center align-top">
                        {isMeter ? (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] inline-flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            <span>Print Press (m²)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1] inline-flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            <span>Satuan</span>
                          </span>
                        )}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top font-mono text-[11px]">
                        {hasPressItems ? (
                          <div>
                            <div>
                              <b>{bill.printPressItems?.reduce((s, it) => s + it.qty, 0)} lembar</b> (
                              {bill.printPressItems?.reduce((s, it) => s + it.areaM2, 0).toFixed(2)} m²)
                            </div>
                            <div className="text-[#64748b] text-[10px]">
                              @ {formatRupiah(bill.pricePerMeter || bill.unitPrice)}/m
                            </div>
                          </div>
                        ) : isMeter ? (
                          <div>
                            <div>
                              P: <b>{bill.lengthM}m</b> × L: <b>{bill.widthM}m</b> ({bill.qty} lembar)
                            </div>
                            <div className="text-[#64748b] text-[10px]">
                              = {Number(((bill.lengthM || 0) * (bill.widthM || 0) * bill.qty).toFixed(2))} m² @ {formatRupiah(bill.unitPrice)}/m
                            </div>
                          </div>
                        ) : (
                          <div>
                            <b>{bill.qty} pcs</b> @ {formatRupiah(bill.unitPrice)}
                          </div>
                        )}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 text-right align-top font-mono font-bold text-[#1e40af] text-[12px]">
                        {formatRupiah(bill.totalAmount)}
                      </td>

                      <td className="border border-[#cbd5e1] px-2 py-2 text-center align-top">
                        {bill.status === 'unpaid' ? (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-white text-[#475569] border border-[#cbd5e1] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#64748b]" />
                            <span>Belum Lunas</span>
                          </span>
                        ) : bill.status === 'deducted' ? (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] inline-flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3 text-[#1e40af]" />
                            <span>Potong Kasbon</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#f1f5f9] text-[#0f172a] border border-[#94a3b8] inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-[#0f172a]" />
                            <span>Lunas Tunai</span>
                          </span>
                        )}
                      </td>

                      <td className="border border-[#cbd5e1] px-2 py-2 text-center align-top">
                        <div className="flex flex-col gap-1 items-stretch">
                          {bill.status === 'unpaid' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(bill)}
                              className="px-2 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                              title="Bayar tagihan ini (bisa potong kasbon atau bayar lunas)"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar Tagihan</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#0f172a] font-bold py-0.5 bg-[#f1f5f9] rounded-sm border border-[#cbd5e1] text-center">
                              ✓ Tagihan Selesai
                            </span>
                          )}

                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (matchedDebt) {
                                  setViewHistoryDebt(matchedDebt);
                                } else {
                                  setActiveTab('debts');
                                  setSearch(bill.workerName);
                                }
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0f172a] border border-[#cbd5e1] rounded-sm text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Cek buku kasbon pekerja ini"
                            >
                              <BookOpen className="w-3 h-3 text-[#1e40af]" />
                              <span>Cek Kasbon</span>
                            </button>

                            {bill.workerPhone && bill.workerPhone !== '-' && (
                              <a
                                href={getWhatsAppBillUrl(bill)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0f172a] border border-[#cbd5e1] rounded-sm text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                title="Kirim rincian ke WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-[#1e40af]" />
                                <span>WA</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus tagihan "${bill.title}" (${bill.billNumber})?`)) {
                                  deleteProductionBill(bill.id);
                                }
                              }}
                              className="p-1 bg-white hover:bg-slate-100 text-[#64748b] hover:text-rose-600 rounded-sm border border-[#cbd5e1] transition-colors"
                              title="Hapus Tagihan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* ================= TABEL BUKU KASBON / HUTANG PEKERJA ================= */
          <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                <th className="border border-[#cbd5e1] px-2 py-2 text-left w-28">No. Kasbon</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left">Nama Pekerja / Vendor</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left w-36">No. WhatsApp</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-right w-32">Kasbon Awal</th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-right w-32 text-[#64748b]">
                  Sudah Terpotong
                </th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-right w-36 text-[#0f172a]">
                  Sisa Kasbon Saat Ini
                </th>
                <th className="border border-[#cbd5e1] px-3 py-2 text-left">Catatan / Keperluan</th>
                <th className="border border-[#cbd5e1] px-2 py-2 text-center w-36">Aksi & Riwayat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Belum ada data kasbon pekerja. Klik tombol <b>+ Tambah Hutang / Kasbon</b> di atas.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const totalPaid = debt.initialAmount - debt.remainingAmount;
                  const isSettled = debt.remainingAmount <= 0;

                  return (
                    <tr key={debt.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="border border-[#cbd5e1] px-2 py-2 font-mono font-bold text-[#1e40af] align-top">
                        {debt.debtNumber}
                        <span className="block text-[10px] font-normal text-[#64748b]">
                          {debt.createdAt.split('T')[0]}
                        </span>
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top">
                        <div className="font-bold text-[#0f172a] text-xs">{debt.workerName}</div>
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top font-mono text-[#475569]">
                        {debt.phone}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 text-right align-top font-mono">
                        {formatRupiah(debt.initialAmount)}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 text-right align-top font-mono text-[#64748b]">
                        {formatRupiah(totalPaid)}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 text-right align-top font-mono font-bold text-xs text-[#0f172a]">
                        {isSettled ? (
                          <span className="text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 rounded-sm border border-[#cbd5e1]">
                            LUNAS (Rp 0)
                          </span>
                        ) : (
                          formatRupiah(debt.remainingAmount)
                        )}
                      </td>

                      <td className="border border-[#cbd5e1] px-3 py-2 align-top text-[#64748b]">
                        {debt.notes || '-'}
                      </td>

                      <td className="border border-[#cbd5e1] px-2 py-2 text-center align-top">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewHistoryDebt(debt)}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0f172a] rounded-sm border border-[#cbd5e1] text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Lihat riwayat pemotongan kasbon"
                          >
                            <History className="w-3 h-3 text-[#1e40af]" />
                            <span>Riwayat</span>
                          </button>

                          {debt.phone && debt.phone !== '-' && (
                            <a
                              href={getWhatsAppDebtUrl(debt)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#0f172a] rounded-sm border border-[#cbd5e1] text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              title="Kirim status sisa kasbon via WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-[#1e40af]" />
                              <span>WA</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus data kasbon untuk "${debt.workerName}"?`)) {
                                deleteWorkerDebt(debt.id);
                              }
                            }}
                            className="p-1 bg-white hover:bg-slate-100 text-[#64748b] hover:text-rose-600 rounded-sm border border-[#cbd5e1] transition-colors"
                            title="Hapus Kasbon"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL 1: TAMBAH TAGIHAN BIAYA ================= */}
      {showAddBillModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">Tambah Tagihan Biaya Produksi Baru</h3>
              </div>
              <button onClick={() => setShowAddBillModal(false)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Judul & Kategori Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Judul / Deskripsi Tagihan *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    placeholder="Contoh: Ongkos Print Press Sublim Jersey Tim Garuda"
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Kategori Tipe:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBillType('meter')}
                      className={`py-1.5 px-2 rounded-sm border text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        billType === 'meter'
                          ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs'
                          : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-slate-50'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Print Press (m²)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBillType('satuan')}
                      className={`py-1.5 px-2 rounded-sm border text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        billType === 'satuan'
                          ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs'
                          : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-slate-50'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Satuan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pekerja & No WA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Nama Pekerja / Tukang / Vendor *
                  </label>
                  <input
                    type="text"
                    list="worker-list"
                    value={billWorkerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBillWorkerName(val);
                      const match = workerDebts.find(
                        (d) => d.workerName.toLowerCase() === val.toLowerCase()
                      );
                      if (match && match.phone) {
                        setBillWorkerPhone(match.phone);
                      }
                    }}
                    placeholder="Ketik nama atau pilih pekerja kasbon"
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                    required
                  />
                  <datalist id="worker-list">
                    {workerDebts.map((d) => (
                      <option key={d.id} value={d.workerName}>
                        Kasbon Aktif: {formatRupiah(d.remainingAmount)}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Nomor WhatsApp Pekerja
                  </label>
                  <input
                    type="text"
                    value={billWorkerPhone}
                    onChange={(e) => setBillWorkerPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs font-mono select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              {/* ================= SECTION TIPE PRINT PRESS (METERAN) ================= */}
              {billType === 'meter' && (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded-sm space-y-3">
                  {/* 1 Input Biaya Per Meter Terpusat */}
                  <div className="bg-white p-2.5 rounded-sm border border-[#cbd5e1] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-[#0f172a] text-xs block">
                        Harga Ongkos Print Press per Meter (Rp):
                      </span>
                      <span className="text-[10px] text-[#64748b]">
                        Harga ini otomatis diterapkan untuk seluruh baris produk di bawah
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#1e40af]">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pressUnitPriceStr}
                        onChange={(e) => setPressUnitPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="5000"
                        className="w-32 px-2.5 py-1 bg-white border border-[#1e40af] rounded-sm font-mono font-bold text-sm text-[#1e40af] text-right"
                        required
                      />
                      <span className="text-[#64748b] text-[11px]">/ m²</span>
                    </div>
                  </div>

                  {/* Tabel Baris Produk Print Press - Bertambah Otomatis */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-[#0f172a]">
                        Daftar Produk / Bagian Print Press (Panjang & Lebar Berbeda-beda):
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPressRow}
                        className="px-2.5 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Tambah Baris Produk</span>
                      </button>
                    </div>

                    <div className="border border-[#cbd5e1] rounded-sm bg-white overflow-hidden">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1]">
                            <th className="p-1.5 text-left w-6">#</th>
                            <th className="p-1.5 text-left">Nama Bagian / Produk</th>
                            <th className="p-1.5 text-center w-20">Panjang (m)</th>
                            <th className="p-1.5 text-center w-20">Lebar (m)</th>
                            <th className="p-1.5 text-center w-20">Jumlah (Qty)</th>
                            <th className="p-1.5 text-right w-24">Luas Subtotal</th>
                            <th className="p-1.5 text-right w-28 text-[#1e40af]">Subtotal (Rp)</th>
                            <th className="p-1.5 text-center w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                          {pressRows.map((row, idx) => {
                            const p = parseFloat(row.lengthM.replace(/[^0-9.]/g, '')) || 0;
                            const l = parseFloat(row.widthM.replace(/[^0-9.]/g, '')) || 0;
                            const q = parseFloat(row.qty.replace(/[^0-9.]/g, '')) || 0;
                            const rowArea = Number((p * l * q).toFixed(3));
                            const unitPrice = parseFloat(pressUnitPriceStr) || 0;
                            const rowSubtotal = Math.round(rowArea * unitPrice);

                            return (
                              <tr key={row.id} className="hover:bg-[#f8fafc]">
                                <td className="p-1.5 text-center text-[#64748b]">{idx + 1}</td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={row.name}
                                    onChange={(e) => handleUpdatePressRow(idx, 'name', e.target.value)}
                                    placeholder="Contoh: Badan Depan"
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded-sm text-[11px]"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={row.lengthM}
                                    onChange={(e) => handleUpdatePressRow(idx, 'lengthM', e.target.value)}
                                    placeholder="0.8"
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded-sm font-mono text-center text-[11px]"
                                    required
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={row.widthM}
                                    onChange={(e) => handleUpdatePressRow(idx, 'widthM', e.target.value)}
                                    placeholder="0.6"
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded-sm font-mono text-center text-[11px]"
                                    required
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={row.qty}
                                    onChange={(e) => handleUpdatePressRow(idx, 'qty', e.target.value)}
                                    placeholder="10"
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded-sm font-mono text-center font-bold text-[11px]"
                                    required
                                  />
                                </td>
                                <td className="p-1.5 text-right font-mono text-[11px]">
                                  {rowArea} m²
                                </td>
                                <td className="p-1.5 text-right font-mono font-bold text-[#1e40af] text-[11px]">
                                  {formatRupiah(rowSubtotal)}
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePressRow(idx)}
                                    className="text-[#64748b] hover:text-rose-600 p-0.5 cursor-pointer"
                                    title="Hapus Baris"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#f1f5f9] border-t-2 border-[#cbd5e1] font-bold">
                            <td colSpan={4} className="p-2 text-right text-[#475569]">
                              TOTAL KESELURUHAN PRINT PRESS:
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-[#0f172a]">
                              {calculatedPressTotal.items.reduce((s, it) => s + it.qty, 0)} lembar
                            </td>
                            <td className="p-2 text-right font-mono text-[#1e40af]">
                              {calculatedPressTotal.totalArea} m²
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-sm text-[#1e40af]">
                              {formatRupiah(calculatedPressTotal.totalPrice)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= SECTION TIPE SATUAN (TETAP SEDERHANA) ================= */}
              {billType === 'satuan' && (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded-sm space-y-2">
                  <span className="font-bold text-[#0f172a] text-xs block">
                    Hitungan Produk Satuan:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#334155] mb-0.5">
                        Jumlah Pcs (Qty):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={satuanQtyStr}
                        onChange={(e) => setSatuanQtyStr(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder="10"
                        className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded-sm font-mono font-bold text-center text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#1e40af] mb-0.5">
                        Harga Ongkos per Pcs (Rp):
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={satuanPriceStr}
                        onChange={(e) => setSatuanPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Contoh: 35000"
                        className="w-full px-2 py-1 bg-white border border-[#1e40af] rounded-sm font-mono font-bold text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-sm border border-[#cbd5e1] flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-[#0f172a]">
                      Kalkulasi Total Satuan ({satuanQtyStr} pcs @ {formatRupiah(parseFloat(satuanPriceStr) || 0)}):
                    </span>
                    <span className="font-mono font-bold text-sm text-[#1e40af]">
                      {formatRupiah(calculatedSatuanTotal.totalPrice)}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Pembayaran Awal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Status Pembayaran Awal:
                  </label>
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs font-bold"
                  >
                    <option value="unpaid">Belum Lunas (Bisa Dipotong Kasbon / Dibayar Nanti)</option>
                    <option value="paid">Sudah Dibayar Tunai Kasir Langsung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    placeholder="Contoh: Sublim roll-to-roll bahan dryfit"
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs select-text cursor-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-sm text-xs font-medium text-[#334155] cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Simpan Tagihan ({formatRupiah(currentTotalAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: TAMBAH HUTANG / KASBON ================= */}
      {showAddDebtModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-2xl w-full max-w-sm p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">Tambah Pinjaman / Kasbon Pekerja</h3>
              </div>
              <button onClick={() => setShowAddDebtModal(false)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                  Nama Pekerja / Penjahit / Tukang *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={debtWorkerName}
                  onChange={(e) => setDebtWorkerName(e.target.value)}
                  placeholder="Contoh: Pak Joko (Penjahit)"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="text"
                  value={debtPhone}
                  onChange={(e) => setDebtPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs font-mono select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#0f172a] mb-1">
                  Jumlah Pinjaman / Kasbon (Rp) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={debtAmountStr}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDebtAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 500000"
                  className="w-full px-2.5 py-1.5 border border-[#1e40af] rounded-sm text-xs font-mono font-bold text-[#1e40af] select-text cursor-text focus:outline-none"
                  required
                />
                <span className="text-[10px] text-[#64748b] mt-0.5 block font-mono font-semibold">
                  = {formatRupiah(parseFloat(debtAmountStr) || 0)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                  Catatan Kasbon (Opsional)
                </label>
                <input
                  type="text"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="Contoh: Kasbon operasional mingguan"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded-sm text-xs select-text cursor-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-sm text-xs font-medium text-[#334155] cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BAYAR TAGIHAN (DENGAN CEK BUKU KASBON) ================= */}
      {payModalBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-2xl w-full max-w-md p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Bayar Tagihan: {payModalBill.billNumber}
                </h3>
              </div>
              <button onClick={() => setPayModalBill(null)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Tagihan */}
            <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 rounded-sm text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Judul Tagihan:</span>
                <span className="font-bold text-[#0f172a]">{payModalBill.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Pekerja / Vendor:</span>
                <span className="font-bold text-[#0f172a]">{payModalBill.workerName}</span>
              </div>
              <div className="flex justify-between border-t border-[#cbd5e1] pt-1.5">
                <span className="text-[#64748b]">Total yang Harus Dibayar:</span>
                <span className="font-mono font-bold text-sm text-[#1e40af]">
                  {formatRupiah(payModalBill.totalAmount)}
                </span>
              </div>
            </div>

            {/* Box Cek Buku Kasbon Otomatis */}
            <div className="bg-[#f1f5f9] border border-[#cbd5e1] p-2.5 rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#0f172a] flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span>Status Buku Kasbon Pekerja:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const found = workerDebts.find(
                      (d) => d.workerName.toLowerCase().trim() === payModalBill.workerName.toLowerCase().trim()
                    );
                    if (found) {
                      setViewHistoryDebt(found);
                    } else {
                      alert(`Tidak ada data kasbon untuk "${payModalBill.workerName}"`);
                    }
                  }}
                  className="text-[10px] text-[#1e40af] underline hover:text-blue-800 cursor-pointer"
                >
                  Lihat Riwayat Kasbon
                </button>
              </div>

              {selectedDebtObject && selectedDebtObject.remainingAmount > 0 ? (
                <div className="bg-white border border-[#cbd5e1] p-2 rounded-sm text-[11px] text-[#0f172a] flex items-center justify-between">
                  <span>
                    Ditemukan sisa kasbon <b>{selectedDebtObject.workerName}</b>:
                  </span>
                  <b className="font-mono font-bold text-[#1e40af]">
                    {formatRupiah(selectedDebtObject.remainingAmount)}
                  </b>
                </div>
              ) : (
                <div className="bg-white border border-[#cbd5e1] p-2 rounded-sm text-[11px] text-[#475569] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#1e40af] shrink-0" />
                  <span>Pekerja ini tidak memiliki tunggakan kasbon aktif (Rp 0).</span>
                </div>
              )}
            </div>

            {/* Pilihan Metode Pembayaran: Potong Kasbon vs Bayar Lunas Tunai */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[#334155]">
                Pilih Opsi Pembayaran Tagihan:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethodTab('cash')}
                  className={`p-2 rounded-sm border text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    payMethodTab === 'cash'
                      ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs'
                      : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Bayar Lunas (Tunai / Kas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethodTab('debt')}
                  className={`p-2 rounded-sm border text-xs font-bold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                    payMethodTab === 'debt'
                      ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs'
                      : 'bg-white text-[#334155] border-[#cbd5e1] hover:bg-slate-50'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Potong dari Kasbon</span>
                </button>
              </div>

              {/* Tampilan Tab 1: Bayar Lunas Langsung */}
              {payMethodTab === 'cash' && (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0f172a]">Metode Pelunasan:</span>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cashMethod"
                          checked={payCashMethod === 'cash'}
                          onChange={() => setPayCashMethod('cash')}
                        />
                        <span className="text-xs">Tunai (Kas Toko)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="cashMethod"
                          checked={payCashMethod === 'transfer'}
                          onChange={() => setPayCashMethod('transfer')}
                        />
                        <span className="text-xs">Transfer Bank</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                      Catatan Pembayaran (Opsional):
                    </label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="Contoh: Diserahkan tunai oleh kasir"
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs"
                    />
                  </div>

                  <div className="text-[11px] text-[#475569] bg-white p-2 rounded-sm border border-[#cbd5e1]">
                    Status tagihan akan langsung berubah menjadi <b>LUNAS (Dibayar Langsung)</b> dan tidak mengurangi saldo buku kasbon.
                  </div>
                </div>
              )}

              {/* Tampilan Tab 2: Potong dari Kasbon */}
              {payMethodTab === 'debt' && (
                <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-sm p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0f172a] mb-1">
                      Pilih Buku Kasbon yang Dipotong:
                    </label>
                    <select
                      value={paySelectedDebtId}
                      onChange={(e) => {
                        setPaySelectedDebtId(e.target.value);
                        const d = workerDebts.find((x) => x.id === e.target.value);
                        if (d) {
                          setPayDeductAmountStr(Math.min(d.remainingAmount, payModalBill.totalAmount).toString());
                        }
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-[#94a3b8] rounded-sm font-semibold text-xs"
                    >
                      <option value="">-- Pilih Buku Kasbon --</option>
                      {workerDebts.map((d) => (
                        <option key={d.id} value={d.id} disabled={d.remainingAmount <= 0}>
                          {d.workerName} — Sisa: {formatRupiah(d.remainingAmount)}{' '}
                          {d.remainingAmount <= 0 ? '(LUNAS)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDebtObject && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-[#0f172a] mb-1">
                          Nominal yang Dipotong dari Kasbon (Rp):
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={payDeductAmountStr}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setPayDeductAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-2 py-1 bg-white border border-[#1e40af] rounded-sm font-mono font-bold text-[#1e40af] text-xs"
                        />
                      </div>

                      {/* Simulasi */}
                      <div className="pt-2 border-t border-[#cbd5e1] space-y-1 text-[10px]">
                        <div className="flex justify-between">
                          <span>Sisa Kasbon {selectedDebtObject.workerName} Sesudah Potong:</span>
                          <b className="font-mono text-[#0f172a]">
                            {formatRupiah(
                              Math.max(
                                0,
                                selectedDebtObject.remainingAmount -
                                  (parseFloat(payDeductAmountStr.replace(/[^0-9.]/g, '')) || 0)
                              )
                            )}
                          </b>
                        </div>
                        <div className="flex justify-between">
                          <span>Sisa Tagihan yang Belum Tercover:</span>
                          <b className="font-mono text-[#1e40af]">
                            {formatRupiah(
                              Math.max(
                                0,
                                payModalBill.totalAmount -
                                  (parseFloat(payDeductAmountStr.replace(/[^0-9.]/g, '')) || 0)
                              )
                            )}
                          </b>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Aksi Final */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#cbd5e1]">
              <button
                type="button"
                onClick={() => setPayModalBill(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-sm text-xs font-medium text-[#334155] cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className={`px-4 py-1.5 rounded-sm text-xs font-bold shadow-xs transition-colors text-white ${
                  payMethodTab === 'cash'
                    ? 'bg-[#1e40af] hover:bg-[#1d4ed8] cursor-pointer'
                    : selectedDebtObject && selectedDebtObject.remainingAmount > 0
                    ? 'bg-[#1e40af] hover:bg-[#1d4ed8] cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {payMethodTab === 'cash' ? '✓ Bayar Lunas Tagihan' : '⚡ Konfirmasi Potong Kasbon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: RIWAYAT PEMOTONGAN KASBON ================= */}
      {viewHistoryDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-2xl w-full max-w-md p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Buku Kasbon: {viewHistoryDebt.workerName}
                </h3>
              </div>
              <button onClick={() => setViewHistoryDebt(null)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-2.5 rounded-sm text-xs space-y-1">
              <div className="flex justify-between">
                <span>No. Kasbon:</span>
                <b className="font-mono text-[#1e40af]">{viewHistoryDebt.debtNumber}</b>
              </div>
              <div className="flex justify-between">
                <span>Pinjaman Kasbon Awal:</span>
                <b className="font-mono">{formatRupiah(viewHistoryDebt.initialAmount)}</b>
              </div>
              <div className="flex justify-between">
                <span>Sisa Kasbon Saat Ini:</span>
                <b className="font-mono text-[#0f172a]">{formatRupiah(viewHistoryDebt.remainingAmount)}</b>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#334155] block">Riwayat Pemotongan & Pinjaman:</span>
              <div className="max-h-56 overflow-y-auto border border-[#cbd5e1] rounded-sm divide-y divide-[#e2e8f0] text-[11px]">
                {viewHistoryDebt.history && viewHistoryDebt.history.length > 0 ? (
                  viewHistoryDebt.history.map((h, i) => (
                    <div key={i} className="p-2 hover:bg-slate-50 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0f172a]">{h.description}</div>
                        <div className="text-[10px] text-[#64748b]">{h.date.split('T')[0]}</div>
                      </div>
                      <div className="font-mono font-bold text-[#1e40af] shrink-0">
                        - {formatRupiah(h.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-[11px]">
                    Belum ada riwayat pemotongan.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#cbd5e1]">
              <button
                type="button"
                onClick={() => setViewHistoryDebt(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-sm text-xs font-bold text-[#334155] cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: DETAIL ITEM PRINT PRESS ================= */}
      {viewDetailBill && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-sm shadow-2xl w-full max-w-lg p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Rincian Print Press: {viewDetailBill.billNumber} ({viewDetailBill.title})
                </h3>
              </div>
              <button onClick={() => setViewDetailBill(null)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-[#cbd5e1] rounded-sm overflow-hidden">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1]">
                    <th className="p-1.5 text-left w-6">#</th>
                    <th className="p-1.5 text-left">Bagian / Produk</th>
                    <th className="p-1.5 text-center w-24">Ukuran (P × L)</th>
                    <th className="p-1.5 text-center w-16">Jumlah</th>
                    <th className="p-1.5 text-right w-20">Luas (m²)</th>
                    <th className="p-1.5 text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {viewDetailBill.printPressItems?.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-1.5 text-center text-[#64748b]">{idx + 1}</td>
                      <td className="p-1.5 font-semibold text-[#0f172a]">{it.name}</td>
                      <td className="p-1.5 text-center font-mono">
                        {it.lengthM}m × {it.widthM}m
                      </td>
                      <td className="p-1.5 text-center font-mono">{it.qty} pcs</td>
                      <td className="p-1.5 text-right font-mono">{it.areaM2} m²</td>
                      <td className="p-1.5 text-right font-mono font-bold text-[#1e40af]">
                        {formatRupiah(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f1f5f9] border-t border-[#cbd5e1] font-bold">
                    <td colSpan={4} className="p-2 text-right">
                      TOTAL:
                    </td>
                    <td className="p-2 text-right font-mono text-[#1e40af]">
                      {viewDetailBill.printPressItems?.reduce((s, it) => s + it.areaM2, 0).toFixed(2)} m²
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-sm text-[#1e40af]">
                      {formatRupiah(viewDetailBill.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#cbd5e1]">
              <button
                type="button"
                onClick={() => setViewDetailBill(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-sm text-xs font-bold text-[#334155] cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
