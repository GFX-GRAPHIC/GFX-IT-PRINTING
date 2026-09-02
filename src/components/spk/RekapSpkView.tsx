import React, { useState, useMemo } from 'react';
import { X, ChevronDown, FileText, Printer, Receipt, MessageSquare, Trash2, Eye } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatRupiah, generateWhatsAppUrl } from '../../utils/formatters';
import { sounds } from '../../utils/soundEffects';
import { InvoicePrintView } from '../pos/InvoicePrintView';

interface RekapSpkViewProps {
  onOpenSpk: (order: Order) => void;
  onPrintSpk: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  onPrintInvoice?: (order: Order) => void;
  onNewSpk: () => void;
}

export const RekapSpkView: React.FC<RekapSpkViewProps> = ({
  onOpenSpk,
  onPrintSpk,
  onPrintReceipt,
  onPrintInvoice,
  onNewSpk,
}) => {
  const { orders, storeSettings, updateOrder, deleteOrder, clearAllOrders } = useApp();
  const { currentUser, isOwner } = useAuth();

  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 1. Filter States
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [designerFilter, setDesignerFilter] = useState(() => {
    if (currentUser?.role === 'designer' && currentUser?.name) {
      return currentUser.name.split(' ')[0].toUpperCase();
    }
    return 'all';
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'dp' | 'paid'>('all');
  const [keyword, setKeyword] = useState('');

  // 2. Detail & Approval Modal State (Double click on row)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('nominal');
  const [discountVal, setDiscountVal] = useState<string>('0');
  const [payAmount, setPayAmount] = useState<string>('0');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [notification, setNotification] = useState('');

  // 3. Quick Payment Modal State (Pelunasan Cepat)
  const [payModalOrder, setPayModalOrder] = useState<Order | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<string>('');
  const [quickPayMethod, setQuickPayMethod] = useState<PaymentMethod>('cash');

  // Parsed numeric values
  const numericDiscountVal = useMemo(() => {
    return parseFloat(discountVal.replace(/[^0-9.]/g, '')) || 0;
  }, [discountVal]);

  const numericPayAmount = useMemo(() => {
    return parseFloat(payAmount.replace(/[^0-9.]/g, '')) || 0;
  }, [payAmount]);

  // Extract unique designer names from orders
  const uniqueDesigners = useMemo(() => {
    const list = new Set<string>(['MARGIN', 'DIMAS', 'SINTA']);
    orders.forEach((o) => {
      if (o.designerName) list.add(o.designerName.toUpperCase());
    });
    return Array.from(list);
  }, [orders]);

  // Hitung jumlah status pembayaran untuk filter tab
  const paymentCounts = useMemo(() => {
    let unpaid = 0;
    let dp = 0;
    let paid = 0;
    orders.forEach((o) => {
      if (o.paymentStatus === 'paid') paid++;
      else if (o.paymentStatus === 'dp') dp++;
      else unpaid++;
    });
    return { all: orders.length, unpaid, dp, paid };
  }, [orders]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tanggal Filter
      const orderDate = o.createdAt.split('T')[0];
      if (dateFrom && orderDate < dateFrom) return false;
      if (dateTo && orderDate > dateTo) return false;

      // 2. Designer Filter
      if (designerFilter !== 'all') {
        const dName = (o.designerName || '').toUpperCase();
        if (!dName.includes(designerFilter.toUpperCase())) return false;
      }

      // 3. Status Pengerjaan Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && o.status !== 'pending') return false;
        if (statusFilter === 'design' && o.status !== 'design') return false;
        if (statusFilter === 'approved' && o.designStatus !== 'approved') return false;
        if (statusFilter === 'production' && o.status !== 'production') return false;
        if (statusFilter === 'completed' && o.status !== 'completed') return false;
      }

      // 3b. Status Pembayaran Filter (Hanya untuk Admin & Owner - Designer di-bypass)
      if (currentUser?.role !== 'designer' && paymentFilter !== 'all') {
        if (o.paymentStatus !== paymentFilter) return false;
      }

      // 4. Group Filter
      if (groupFilter !== 'all') {
        const hasGroup = o.items.some(
          (it) => it.category && it.category.toUpperCase().includes(groupFilter.toUpperCase())
        );
        if (!hasGroup) return false;
      }

      // 5. Keyword search
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        const matchSpk = o.spkNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.includes(q);
        if (!matchSpk && !matchCust && !matchPhone) return false;
      }

      return true;
    });
  }, [orders, dateFrom, dateTo, designerFilter, statusFilter, paymentFilter, groupFilter, keyword, currentUser]);

  // Open Detail Modal
  const handleOpenDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setDiscountType(order.discountType || 'nominal');
    const dVal =
      order.discountType === 'percent'
        ? (order.discountPercent || 0).toString()
        : (order.discount || 0).toString();
    setDiscountVal(dVal);
    setPayAmount((order.paidAmount || 0).toString());
    setPayMethod(order.paymentMethod || 'cash');
  };

  // Live Dynamic Discount & Total Calculation
  const calculation = useMemo(() => {
    if (!selectedOrder) {
      return { subtotal: 0, discountNominal: 0, total: 0, balance: 0 };
    }
    const subtotal = selectedOrder.subtotal || selectedOrder.items.reduce((a, c) => a + c.subtotal, 0);

    let discountNominal = 0;
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, numericDiscountVal));
      discountNominal = Math.round((subtotal * pct) / 100);
    } else {
      discountNominal = Math.min(subtotal, Math.max(0, numericDiscountVal));
    }

    const total = Math.max(0, subtotal - discountNominal);
    const balance = Math.max(0, total - numericPayAmount);

    return { subtotal, discountNominal, total, balance };
  }, [selectedOrder, discountType, numericDiscountVal, numericPayAmount]);

  // Approve SPK by Admin
  const handleApproveSpk = () => {
    if (!selectedOrder || selectedOrder.designStatus === 'approved') return;

    const { total, discountNominal, balance } = calculation;
    const paymentStatus = balance === 0 ? 'paid' : numericPayAmount > 0 ? 'dp' : 'unpaid';

    const updated: Order = {
      ...selectedOrder,
      subtotal: calculation.subtotal,
      discount: discountNominal,
      discountType,
      discountPercent: discountType === 'percent' ? numericDiscountVal : undefined,
      total,
      paidAmount: numericPayAmount,
      balance,
      paymentStatus,
      paymentMethod: payMethod,
      designStatus: 'approved',
      status: selectedOrder.status === 'pending' ? 'pending' : selectedOrder.status,
    };

    updateOrder(updated, currentUser, `Disetujui & diverifikasi oleh Admin ${currentUser.name}`);
    sounds.playSuccess();
    setNotification(`✓ SPK ${selectedOrder.spkNumber} berhasil di-Approve dan diteruskan ke bagian Produksi!`);
    setSelectedOrder(null);
    setTimeout(() => setNotification(''), 4000);
  };

  // Handler untuk memperbarui pembayaran saat SPK sudah di-approve dari modal detail
  const handleUpdatePaymentOnly = () => {
    if (!selectedOrder) return;
    const { total } = calculation;
    const newPaid = numericPayAmount;
    const newBal = Math.max(0, total - newPaid);
    const newPayStatus = newBal === 0 ? 'paid' : newPaid > 0 ? 'dp' : 'unpaid';

    const updated: Order = {
      ...selectedOrder,
      discount: calculation.discountNominal,
      discountType,
      discountPercent: discountType === 'percent' ? numericDiscountVal : undefined,
      total,
      paidAmount: newPaid,
      balance: newBal,
      paymentStatus: newPayStatus,
      paymentMethod: payMethod,
    };

    updateOrder(
      updated,
      currentUser,
      `Pembayaran diperbarui oleh Admin ${currentUser.name}: Terbayar Rp ${newPaid.toLocaleString('id-ID')} (${newPayStatus === 'paid' ? 'LUNAS' : 'DP'})`
    );
    sounds.playSuccess();
    setNotification(
      `✓ Pembayaran SPK ${selectedOrder.spkNumber} berhasil diperbarui menjadi ${newPayStatus === 'paid' ? 'LUNAS' : `Sisa Rp ${newBal.toLocaleString('id-ID')}`}!`
    );
    setSelectedOrder(null);
    setTimeout(() => setNotification(''), 4000);
  };

  // Buka Modal Pelunasan Cepat dari tabel
  const handleOpenPaymentModal = (order: Order) => {
    setPayModalOrder(order);
    // Isi otomatis sisa tagihan untuk pelunasan pas
    setQuickPayAmount(order.balance > 0 ? order.balance.toString() : '0');
    setQuickPayMethod(order.paymentMethod || 'cash');
  };

  // Simpan Pelunasan Cepat
  const handleSaveQuickPayment = (openInvoiceAfter = false) => {
    if (!payModalOrder) return;
    const additionalPay = parseFloat(quickPayAmount.replace(/[^0-9]/g, '')) || 0;
    const newPaidAmount = Math.min(payModalOrder.total, payModalOrder.paidAmount + additionalPay);
    const newBalance = Math.max(0, payModalOrder.total - newPaidAmount);
    const newStatus = newBalance === 0 ? 'paid' : newPaidAmount > 0 ? 'dp' : 'unpaid';

    const updated: Order = {
      ...payModalOrder,
      paidAmount: newPaidAmount,
      balance: newBalance,
      paymentStatus: newStatus,
      paymentMethod: quickPayMethod,
    };

    updateOrder(
      updated,
      currentUser,
      `Pembayaran diperbarui oleh Admin ${currentUser.name}: Tambah bayar Rp ${additionalPay.toLocaleString('id-ID')} (${newStatus === 'paid' ? 'LUNAS' : 'DP'})`
    );
    sounds.playSuccess();
    setNotification(
      `✓ Pembayaran SPK ${payModalOrder.spkNumber} berhasil diperbarui: ${newStatus === 'paid' ? 'LUNAS' : `Sisa Rp ${newBalance.toLocaleString('id-ID')}`}!`
    );

    const savedOrder = updated;
    setPayModalOrder(null);

    if (openInvoiceAfter) {
      setActiveInvoiceOrder(savedOrder);
      onPrintInvoice?.(savedOrder);
    }

    setTimeout(() => setNotification(''), 4000);
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setDesignerFilter('all');
    setStatusFilter('all');
    setPaymentFilter('all');
    setGroupFilter('all');
    setKeyword('');
  };

  const handleQuickFilterToday = () => {
    setDateFrom(todayStr);
    setDateTo(todayStr);
  };

  const sendWhatsApp = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Halo Kak ${order.customerName},\n\nUpdate dari *${storeSettings.storeName}*:\nNo. SPK: *${order.spkNumber}*\nStatus: *${order.status.toUpperCase()}*\nTotal: ${formatRupiah(order.total)}\nStatus Bayar: *${
      order.paymentStatus === 'paid' ? 'LUNAS' : `Sisa ${formatRupiah(order.balance)}`
    }*\n\nTerima kasih! 🙏`;
    window.open(generateWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Bar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#0f172a]">
            {currentUser?.role === 'admin' ? 'Rekapitulasi & Verifikasi SPK' : 'Rekapitulasi SPK Percetakan'}
          </span>
          <span className="text-[11px] font-mono text-[#475569] bg-white px-2 py-0.5 rounded border border-[#cbd5e1]">
            Total: <b>{filteredOrders.length}</b> SPK
          </span>

          {/* Tombol Reset Semua SPK: KHUSUS ROLE OWNER ONLY (Admin & Designer tidak bisa) */}
          {isOwner && orders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`PERINGATAN (Khusus Owner): Apakah Anda yakin ingin menghapus seluruh ${orders.length} data pesanan SPK agar kembali bersih menjadi 0? Tindakan ini tidak dapat dibatalkan!`)) {
                  clearAllOrders();
                  setNotification('✓ Seluruh data pesanan SPK berhasil dikosongkan dan kembali menjadi 0!');
                  setTimeout(() => setNotification(''), 5000);
                }
              }}
              className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-[11px] font-bold transition-colors cursor-pointer ml-1"
              title="Khusus Owner: Kosongkan seluruh riwayat pesanan SPK agar kembali ke 0"
            >
              Reset Semua SPK (0)
            </button>
          )}
        </div>

        {currentUser?.role !== 'admin' && (
          <button
            onClick={onNewSpk}
            className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-semibold rounded text-xs shadow-xs transition-colors"
          >
            + Input SPK Baru
          </button>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border-b border-[#cbd5e1] p-3 shadow-xs space-y-2">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser?.role === 'designer' ? 'md:grid-cols-5' : 'md:grid-cols-6'} gap-2.5`}>
          {/* Dari Tanggal */}
          <div>
            <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            />
          </div>

          {/* Designer PIC */}
          <div>
            <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Designer PIC</label>
            <select
              value={designerFilter}
              onChange={(e) => setDesignerFilter(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            >
              <option value="all">-- Semua Designer --</option>
              {uniqueDesigners.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Approval / Pengerjaan */}
          <div>
            <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Status Pengerjaan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            >
              <option value="all">-- Semua Status --</option>
              <option value="pending">Masih Pending / Antrean</option>
              <option value="approved">Desain ACC / Approval</option>
              <option value="production">Proses Naik Cetak</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          {/* Group Item */}
          <div>
            <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Group Item</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            >
              <option value="all">-- Semua Group --</option>
              <option value="INDOOR">INDOOR</option>
              <option value="OUTDOOR">OUTDOOR</option>
              <option value="DIGITAL">DIGITAL A3+</option>
              <option value="MERCHANDISE">MERCHANDISE</option>
              <option value="OFFSET">OFFSET & NOTA</option>
            </select>
          </div>

          {/* Status Pembayaran (Khusus Admin & Owner - Designer tidak melihat filter pembayaran) */}
          {currentUser?.role !== 'designer' && (
            <div>
              <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">Status Pembayaran</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs font-semibold text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
              >
                <option value="all">-- Semua Pembayaran --</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="dp">DP (Uang Muka)</option>
                <option value="paid">Lunas</option>
              </select>
            </div>
          )}
        </div>

        {/* Quick Filter Tabs: Filter Status Bayar (DP / Belum Bayar / Lunas) - Khusus Admin & Owner */}
        {currentUser?.role !== 'designer' && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200">
            <span className="text-[10px] font-bold text-[#475569] uppercase mr-1">Filter Pembayaran:</span>
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                paymentFilter === 'all'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-[#334155] border-slate-300 hover:bg-slate-50'
              }`}
            >
              Semua ({paymentCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('unpaid')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                paymentFilter === 'unpaid'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-[#334155] border-slate-300 hover:bg-slate-50'
              }`}
            >
              Belum Bayar ({paymentCounts.unpaid})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('dp')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                paymentFilter === 'dp'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-[#334155] border-slate-300 hover:bg-slate-50'
              }`}
            >
              DP ({paymentCounts.dp})
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('paid')}
              className={`px-2.5 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                paymentFilter === 'paid'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white text-[#334155] border-slate-300 hover:bg-slate-50'
              }`}
            >
              Lunas ({paymentCounts.paid})
            </button>
          </div>
        )}

        {/* Search Bar & Action Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-[#f1f5f9] gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari No. SPK, Nama Konsumen, No. Telepon..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full px-3 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded-sm text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickFilterToday}
              className="px-3 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] border border-[#cbd5e1] rounded text-[11px] font-medium"
            >
              Hari Ini
            </button>
            <button
              onClick={handleResetFilter}
              className="px-3 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] border border-[#cbd5e1] rounded text-[11px] font-medium"
              title="Bersihkan seluruh filter"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-[#eff6ff] border-b border-[#bfdbfe] text-[#1e40af] px-4 py-1.5 text-xs font-semibold">
          {notification}
        </div>
      )}

      {/* 3. Table Data Grid */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        {filteredOrders.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[#64748b]">
            <p className="font-bold text-xs text-[#334155]">Tidak Ada Data SPK yang Sesuai Filter</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              Ubah kriteria tanggal, nama designer, atau klik <b>Reset Filter</b> untuk melihat data.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-32">No. SPK</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-24">Tanggal</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Konsumen</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Item Cetakan</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-24">Design PIC</th>
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-36">Status Approval Admin</th>
                {currentUser?.role !== 'designer' && (
                  <>
                    <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-28">Total (Rp)</th>
                    <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Bayar</th>
                  </>
                )}
                <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onDoubleClick={() => {
                    if (currentUser?.role === 'admin' || currentUser?.role === 'owner') {
                      handleOpenDetailModal(order);
                    }
                  }}
                  title={
                    currentUser?.role === 'admin' || currentUser?.role === 'owner'
                      ? 'Double-click baris ini untuk buka Detail & Approval Kasir'
                      : ''
                  }
                  className="hover:bg-[#eff6ff] cursor-pointer transition-colors"
                >
                  {/* No SPK */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 font-bold font-mono text-[#1e40af]">
                    {order.spkNumber}
                  </td>

                  {/* Tanggal */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-[#64748b]">
                    {formatDate(order.createdAt)}
                  </td>

                  {/* Nama Konsumen */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-semibold text-[#0f172a]">
                    {order.customerName}
                    <span className="block text-[10px] text-[#64748b] font-mono font-normal">
                      {order.customerPhone}
                    </span>
                  </td>

                  {/* Item Cetakan */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#334155]">
                    <div className="truncate max-w-xs font-medium">
                      {order.items.map((i) => i.productName).join(', ')}
                    </div>
                    <span className="text-[10px] text-[#64748b]">
                      {order.items.length} item ({order.items.reduce((a, c) => a + c.qty, 0)} pcs)
                    </span>
                  </td>

                  {/* Design PIC */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-bold text-[#475569] font-mono">
                    {order.designerName || order.createdBy || '-'}
                  </td>

                  {/* Status Approval Admin */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    {order.designStatus === 'approved' ? (
                      <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#0f172a] border border-[#94a3b8] rounded-sm font-semibold text-[10px] inline-block">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white text-[#64748b] border border-[#cbd5e1] rounded-sm font-semibold text-[10px] inline-block">
                        Menunggu Approval
                      </span>
                    )}
                  </td>

                  {/* Total & Bayar (Hanya untuk Non-Designer / Kasir & Owner) */}
                  {currentUser?.role !== 'designer' && (
                    <>
                      {/* Total */}
                      <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-[#0f172a]">
                        {formatRupiah(order.total)}
                      </td>

                      {/* Bayar */}
                      <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${
                            order.paymentStatus === 'paid'
                              ? 'bg-[#f1f5f9] text-[#0f172a] border-[#94a3b8]'
                              : order.paymentStatus === 'dp'
                              ? 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]'
                              : 'bg-white text-[#64748b] border-[#cbd5e1]'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? 'LUNAS' : order.paymentStatus === 'dp' ? 'DP' : 'BELUM BAYAR'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Actions */}
                  <td className="border border-[#cbd5e1] px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {/* Designer: Hanya tombol Edit */}
                      {currentUser?.role === 'designer' && (
                        <button
                          onClick={() => onOpenSpk(order)}
                          className="px-3 py-0.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-[11px] font-semibold shadow-xs transition-colors w-full"
                          title="Edit SPK ini"
                        >
                          Edit
                        </button>
                      )}

                      {/* Admin & Owner: Tombol Detail/Approve, Cetak SPK, Cetak Struk */}
                      {currentUser?.role !== 'designer' && (
                        <>
                          {/* Tombol Approval / Pelunasan: Jika sudah di-approve, sediakan tombol perbarui pembayaran / lunas! */}
                          {order.designStatus === 'approved' ? (
                            <>
                              <span
                                className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] rounded-sm text-[10px] font-semibold select-none"
                                title="SPK ini sudah di-approve oleh Admin"
                              >
                                Approved
                              </span>

                              {/* Tombol Bayar / Pelunasan jika belum lunas */}
                              {order.paymentStatus === 'paid' ? (
                                <span className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1] rounded-sm text-[10px] font-bold select-none">
                                  ✓ Lunas
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenPaymentModal(order)}
                                  className="px-2 py-0.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-[10px] font-bold shadow-2xs cursor-pointer active:translate-y-0.5 transition-colors"
                                  title={`Klik untuk memperbarui pembayaran / pelunasan (Sisa: ${formatRupiah(order.balance)})`}
                                >
                                  {order.paymentStatus === 'dp' ? 'Pelunasan' : 'Bayar/Lunas'}
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenDetailModal(order)}
                              className="px-2 py-0.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-sm text-[10px] font-bold shadow-2xs cursor-pointer active:translate-y-0.5 transition-colors"
                              title="Buka untuk Approve SPK ini"
                            >
                              Approve
                            </button>
                          )}

                          {/* Dropdown Menu Terpadu (Invoice, SPK, Detail, Struk, WA, Hapus) */}
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === order.id ? null : order.id);
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-slate-100 text-[#1e293b] border border-[#94a3b8] rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              title="Pilihan Aksi (Invoice, SPK, Detail, Struk, WA)"
                            >
                              <span>Aksi</span>
                              <ChevronDown className="w-3 h-3 text-[#64748b]" />
                            </button>

                            {openDropdownId === order.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20 cursor-default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-[#cbd5e1] rounded-md shadow-xl z-30 py-1 text-left text-xs divide-y divide-[#f1f5f9] animate-in fade-in zoom-in-95">
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        handleOpenDetailModal(order);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#64748b]" />
                                      <span>Detail SPK & Harga</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setActiveInvoiceOrder(order);
                                        onPrintInvoice?.(order);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-[#1e40af]" />
                                      <span className="font-semibold text-[#1e40af]">Nota / Invoice Online</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        onPrintSpk(order);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-[#64748b]" />
                                      <span>Cetak Dokumen SPK</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        onPrintReceipt(order);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-[#334155] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-[#64748b]" />
                                      <span>Cetak Struk Kasir</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        sendWhatsApp(order, e);
                                      }}
                                      className="w-full px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="font-semibold">Kirim WhatsApp</span>
                                    </button>
                                  </div>

                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        if (window.confirm(`Hapus pesanan ${order.spkNumber} (${order.customerName})?`)) {
                                          deleteOrder(order.id);
                                          setNotification(`✓ Pesanan ${order.spkNumber} berhasil dihapus.`);
                                          setTimeout(() => setNotification(''), 4000);
                                        }
                                      }}
                                      className="w-full px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Hapus Pesanan</span>
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. MODAL: DETAIL SPK, HARGA, DISKON DINAMIS (% & NOMINAL) & APPROVAL KASIR */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#1e40af] text-white p-3 flex items-center justify-between">
              <span className="font-bold text-xs">
                Verifikasi, Harga, Diskon & Approval SPK: <b className="text-amber-200">{selectedOrder.spkNumber}</b>
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:text-rose-200 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {selectedOrder.designStatus === 'approved' && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-xs font-semibold flex items-center justify-between">
                  <span>Status: <b>SUDAH DI-APPROVE ADMIN</b> — SPK ini telah masuk antrean produksi.</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">Terkunci (Read-Only)</span>
                </div>
              )}
              {/* Konsumen Info Bar */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-2.5 grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-[#64748b] block font-bold">KONSUMEN:</span>
                  <span className="font-bold text-[#0f172a] text-xs">{selectedOrder.customerName}</span>
                  <span className="block text-[10px] font-mono text-[#64748b]">{selectedOrder.customerPhone}</span>
                </div>

                <div>
                  <span className="text-[10px] text-[#64748b] block font-bold">DESIGNER PIC:</span>
                  <span className="font-bold font-mono text-[#1e40af]">{selectedOrder.designerName || 'MARGIN'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-[#64748b] block font-bold">TANGGAL SPK:</span>
                  <span className="font-mono text-[#0f172a]">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Tabel Rincian Item Cetak */}
              <div>
                <span className="font-bold text-[11px] text-[#334155] block mb-1">
                  Rincian Item yang Dipesan:
                </span>
                <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
                  <thead className="bg-[#f1f5f9] text-[#475569] text-[10px] font-bold">
                    <tr>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-left">Item / Media</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-left">Nama File</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-center w-14">Qty</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-center w-24">Ukuran</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-right w-24">Harga Satuan</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-right w-24">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {selectedOrder.items.map((it, idx) => {
                      const isMeter = Boolean(it.lengthM && it.widthM && (it.unit === 'm²' || it.unit === 'meter' || it.areaM2));
                      const area = isMeter && it.lengthM && it.widthM ? Number((it.lengthM * it.widthM).toFixed(2)) : undefined;
                      const totalArea = isMeter && area ? Number((area * it.qty).toFixed(2)) : undefined;

                      return (
                        <tr key={idx}>
                          <td className="border border-[#cbd5e1] px-2 py-1 font-semibold text-[#0f172a]">
                            {it.productName}
                            {it.notes && (
                              <span className="block text-[10px] text-[#b91c1c] font-normal italic">
                                Ket: {it.notes}
                              </span>
                            )}
                          </td>
                          <td className="border border-[#cbd5e1] px-2 py-1 font-mono text-[#475569] text-[11px]">
                            {it.fileName || '-'}
                          </td>
                          <td className="border border-[#cbd5e1] px-2 py-1 text-center font-bold font-mono">
                            {it.qty} {isMeter ? 'lbr' : it.unit}
                          </td>
                          <td className="border border-[#cbd5e1] px-2 py-1 text-center font-mono text-[10px]">
                            {isMeter && it.lengthM && it.widthM ? (
                              <div>
                                <span className="font-bold text-[#1e40af]">{it.lengthM}m × {it.widthM}m</span>
                                <span className="block text-[9px] text-[#64748b]">({area} m² / lbr)</span>
                              </div>
                            ) : (
                              <span className="text-[#64748b]">Satuan ({it.unit})</span>
                            )}
                          </td>
                          <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono">
                            {formatRupiah(it.unitPrice)}
                            <span className="block text-[9px] text-[#64748b]">
                              /{isMeter ? 'm²' : it.unit}
                            </span>
                          </td>
                          <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono font-bold text-[#0f172a]">
                            {formatRupiah(it.subtotal)}
                            {isMeter && totalArea && (
                              <span className="block text-[9px] text-emerald-700 font-normal">
                                ({totalArea} m² × {it.unitPrice.toLocaleString()})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Panel Kalkulasi Diskon Fleksibel (% / Nominal) & Total Otomatis */}
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded p-3 space-y-2.5">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-[#334155]">Subtotal Kotor:</span>
                  <span className="font-mono font-bold text-[#0f172a] text-sm">
                    {formatRupiah(calculation.subtotal)}
                  </span>
                </div>

                {/* Input Pilihan Diskon */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#bfdbfe]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1e40af] mb-1">
                      Tipe Diskon:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('nominal');
                          setDiscountVal('0');
                        }}
                        className={`flex-1 py-1 px-2 text-xs font-bold rounded border ${
                          discountType === 'nominal'
                            ? 'bg-[#1e40af] text-white border-[#1e40af]'
                            : 'bg-white text-[#334155] border-[#cbd5e1]'
                        }`}
                      >
                        Nominal (Rp)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscountVal('0');
                        }}
                        className={`flex-1 py-1 px-2 text-xs font-bold rounded border ${
                          discountType === 'percent'
                            ? 'bg-[#1e40af] text-white border-[#1e40af]'
                            : 'bg-white text-[#334155] border-[#cbd5e1]'
                        }`}
                      >
                        Persen (%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#1e40af] mb-1">
                      Nilai Diskon {discountType === 'percent' ? '(%)' : '(Rp)'} — <span className="font-normal text-[#64748b]">Bisa Diketik Langsung</span>:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={discountVal}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          // Hanya izinkan angka dan titik
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setDiscountVal(val);
                        }}
                        placeholder="Ketik angka..."
                        className="w-full pl-3 pr-8 py-1.5 bg-white border border-[#1e40af] rounded text-sm font-mono font-bold text-[#1e40af] focus:outline-none focus:ring-1 focus:ring-[#1e40af] select-text cursor-text"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b] pointer-events-none">
                        {discountType === 'percent' ? '%' : 'Rp'}
                      </span>
                    </div>
                    {discountType === 'percent' && numericDiscountVal > 0 && (
                      <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
                        = Potongan: {formatRupiah(calculation.discountNominal)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Total Bersih Otomatis Berubah */}
                <div className="pt-2 border-t border-[#bfdbfe] flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0f172a]">TOTAL SETELAH DISKON:</span>
                  <span className="font-mono font-extrabold text-base text-[#1e40af]">
                    {formatRupiah(calculation.total)}
                  </span>
                </div>
              </div>

              {/* Form Pembayaran Kasir */}
              <div className="grid grid-cols-3 gap-3 bg-white border border-[#cbd5e1] p-2.5 rounded">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Nominal Dibayar (Rp):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={payAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPayAmount(val);
                    }}
                    placeholder="Ketik nominal..."
                    className="w-full px-2 py-1.5 border border-[#94a3b8] rounded text-sm font-mono font-bold text-emerald-700 select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmount(calculation.total.toString())}
                    className="text-[10px] text-[#1e40af] font-bold mt-1 underline block hover:text-[#1d4ed8]"
                  >
                    Bayar Lunas (Pas)
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2 py-1 border border-[#94a3b8] rounded text-xs font-semibold"
                  >
                    <option value="cash">Kas Tunai</option>
                    <option value="transfer_bca">Transfer BCA</option>
                    <option value="transfer_mandiri">Transfer Mandiri</option>
                    <option value="qris">QRIS Standar</option>
                    <option value="tempo">Tempo / Piutang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#475569] mb-1">
                    Sisa Tagihan:
                  </label>
                  <div className={`font-mono font-bold text-sm mt-1 ${calculation.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {calculation.balance > 0 ? formatRupiah(calculation.balance) : 'LUNAS (0)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Print Buttons & Approve Button */}
            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-2">
              {/* Tombol Cetak Langsung */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPrintSpk(selectedOrder)}
                  className="px-3 py-1.5 bg-white hover:bg-[#e2e8f0] text-[#0f172a] border border-[#94a3b8] rounded text-xs font-medium shadow-xs transition-colors"
                  title="Cetak Lembar Dokumen SPK ke Printer Epson atau A4/A5"
                >
                  Cetak SPK (A4/A5)
                </button>

                <button
                  type="button"
                  onClick={() => onPrintReceipt(selectedOrder)}
                  className="px-3 py-1.5 bg-white hover:bg-[#e2e8f0] text-[#0f172a] border border-[#94a3b8] rounded text-xs font-medium shadow-xs transition-colors"
                  title="Cetak Struk Kasir ke Printer Thermal Resi Kecil (58mm / 80mm)"
                >
                  Cetak Struk (Thermal)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveInvoiceOrder(selectedOrder);
                    onPrintInvoice?.(selectedOrder);
                  }}
                  className="px-3 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  title="Buka Nota Online / Invoice untuk dikirim via WhatsApp"
                >
                  Nota Online (WA)
                </button>
              </div>

              {/* Tombol Aksi Approval & Simpan */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155]"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus pesanan ${selectedOrder.spkNumber} (${selectedOrder.customerName})?`)) {
                      deleteOrder(selectedOrder.id);
                      setSelectedOrder(null);
                      setNotification(`✓ Pesanan ${selectedOrder.spkNumber} berhasil dihapus.`);
                      setTimeout(() => setNotification(''), 4000);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-semibold cursor-pointer"
                  title="Hapus pesanan ini secara permanen"
                >
                  Hapus SPK
                </button>

                {selectedOrder.designStatus === 'approved' ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-500 border border-slate-300 rounded text-xs font-semibold select-none"
                      title="Status desain sudah disetujui"
                    >
                      ✓ Desain Approved
                    </span>

                    <button
                      type="button"
                      onClick={handleUpdatePaymentOnly}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs active:translate-y-0.5 transition-colors cursor-pointer"
                      title="Simpan pembaruan status & nominal pembayaran"
                    >
                      {selectedOrder.paymentStatus === 'paid' ? 'Simpan Perubahan Bayar' : 'Perbarui Pembayaran / Simpan Lunas'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleApproveSpk}
                    className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded text-xs font-bold shadow-xs active:translate-y-0.5 transition-colors cursor-pointer"
                  >
                    Setujui SPK (Approve & Kirim ke Produksi)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: NOTA ONLINE / INVOICE DIGITAL (KIRIM KE WA) */}
      {activeInvoiceOrder && (
        <InvoicePrintView
          order={activeInvoiceOrder}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}

      {/* 6. MODAL: PELUNASAN / UPDATE PEMBAYARAN CEPAT */}
      {payModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-[#1e40af] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-bold text-xs">
                Perbarui Pembayaran / Pelunasan: <b className="text-amber-200">{payModalOrder.spkNumber}</b>
              </span>
              <button
                onClick={() => setPayModalOrder(null)}
                className="text-white hover:text-rose-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Info Pelanggan & Tagihan */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pelanggan:</span>
                  <span className="font-bold text-slate-900 uppercase">{payModalOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(payModalOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Terbayar Sebelumnya:</span>
                  <span className="font-mono text-emerald-700 font-semibold">{formatRupiah(payModalOrder.paidAmount)}</span>
                </div>
                <div className="border-t border-slate-300 pt-1.5 flex justify-between items-center">
                  <span className="font-bold text-slate-700">Sisa Kekurangan:</span>
                  <span className="font-mono font-extrabold text-base text-rose-600">
                    {payModalOrder.balance > 0 ? formatRupiah(payModalOrder.balance) : 'LUNAS (Rp 0)'}
                  </span>
                </div>
              </div>

              {/* Form Input Pembayaran Tambahan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#1e40af]">
                    Nominal Tambahan Bayar Sekarang (Rp):
                  </label>
                  {payModalOrder.balance > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuickPayAmount(payModalOrder.balance.toString())}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded cursor-pointer"
                    >
                      ✓ Set Lunas Pas ({formatRupiah(payModalOrder.balance)})
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={quickPayAmount}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setQuickPayAmount(val);
                  }}
                  placeholder="Ketik nominal bayar..."
                  className="w-full px-3 py-2 border-2 border-[#1e40af] rounded text-base font-mono font-extrabold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />

                {/* Simulasi Status setelah bayar */}
                {(() => {
                  const addVal = parseFloat(quickPayAmount.replace(/[^0-9]/g, '')) || 0;
                  const newPaid = Math.min(payModalOrder.total, payModalOrder.paidAmount + addVal);
                  const rem = Math.max(0, payModalOrder.total - newPaid);
                  return (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] flex justify-between items-center font-medium">
                      <span>Total Akan Terbayar: <b className="font-mono text-emerald-700">{formatRupiah(newPaid)}</b></span>
                      <span className={rem === 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {rem === 0 ? '✓ MENJADI LUNAS' : `Sisa: ${formatRupiah(rem)} (DP)`}
                      </span>
                    </div>
                  );
                })()}

                {/* Pilihan Metode Bayar */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={quickPayMethod}
                    onChange={(e) => setQuickPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-semibold"
                  >
                    <option value="cash">Kas Tunai (Cash)</option>
                    <option value="transfer_bca">Transfer BCA</option>
                    <option value="transfer_mandiri">Transfer Mandiri</option>
                    <option value="qris">QRIS Toko</option>
                    <option value="tempo">Tempo / Piutang</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] px-4 py-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPayModalOrder(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium cursor-pointer"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuickPayment(true)}
                  className="px-3 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] rounded text-xs font-bold shadow-xs cursor-pointer active:translate-y-0.5 transition-colors"
                  title="Simpan lalu langsung buka Nota Online WA"
                >
                  Simpan & Buka Nota WA
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuickPayment(false)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer active:translate-y-0.5 transition-colors"
                >
                  ✓ Simpan Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
