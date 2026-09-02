import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  X,
  Package,
  Truck,
  Building2,
  Phone,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDate } from '../utils/formatters';
import { PoPrintDocument } from '../components/po/PoPrintDocument';

const SUPPLIER_SUGGESTIONS = [
  { name: 'PT. Multi Visual Sinar (Distributor Flexi)', phone: '021-5591234', pic: 'Bpk. Hendra', address: 'Jakarta Barat' },
  { name: 'CV. Sumber Tinta Grafika', phone: '022-7304411', pic: 'Ibu Ratna', address: 'Bandung' },
  { name: 'PT. Aneka Kertas Nusantara (Plano & A3+)', phone: '021-6902233', pic: 'Bpk. Gunawan', address: 'Jakarta Pusat' },
  { name: 'Grosir Kaos Polos & DTF Supply', phone: '0812-3344-5566', pic: 'Mas Yanto', address: 'Bandung' },
  { name: 'Toko Hardware & Aksesoris Reklame', phone: '022-4231122', pic: 'Koh Ahok', address: 'Bandung' },
];

export const PurchaseOrderPage: React.FC = () => {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder, materials } = useApp();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Print Document Modal
  const [selectedPoToPrint, setSelectedPoToPrint] = useState<PurchaseOrder | null>(null);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  // Form States
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPic, setSupplierPic] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState<PurchaseOrder['paymentTerms']>('tempo_14');
  const [shippingCostStr, setShippingCostStr] = useState('0');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Row Items
  const [items, setItems] = useState<
    { id: string; materialId?: string; itemName: string; category: string; qty: string; unit: string; unitPrice: string }[]
  >([
    { id: '1', itemName: '', category: 'large_format', qty: '1', unit: 'roll', unitPrice: '1000000' },
  ]);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNo = po.poNumber.toLowerCase().includes(q);
        const matchSup = po.supplierName.toLowerCase().includes(q);
        const matchItem = po.items.some((it) => it.itemName.toLowerCase().includes(q));
        if (!matchNo && !matchSup && !matchItem) return false;
      }
      return true;
    });
  }, [purchaseOrders, statusFilter, search]);

  // Totals KPI
  const totalNilaiPo = useMemo(() => {
    return filteredPOs.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [filteredPOs]);

  const totalMenunggu = useMemo(() => {
    return purchaseOrders.filter((p) => p.status === 'sent' || p.status === 'partial' || p.status === 'draft').length;
  }, [purchaseOrders]);

  const totalDiterima = useMemo(() => {
    return purchaseOrders.filter((p) => p.status === 'received').length;
  }, [purchaseOrders]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setEditingPo(null);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierAddress('');
    setSupplierPic('');
    setPoDate(new Date().toISOString().split('T')[0]);
    setPaymentTerms('tempo_14');
    setShippingCostStr('0');
    setTaxPercent(0);
    setNotes('');
    setItems([
      { id: '1', itemName: '', category: 'large_format', qty: '1', unit: 'roll', unitPrice: '1000000' },
    ]);
    setShowModal(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (po: PurchaseOrder) => {
    setEditingPo(po);
    setSupplierName(po.supplierName);
    setSupplierPhone(po.supplierPhone || '');
    setSupplierAddress(po.supplierAddress || '');
    setSupplierPic(po.supplierContactPerson || '');
    setPoDate(po.date);
    setPaymentTerms(po.paymentTerms);
    setShippingCostStr((po.shippingCost || 0).toString());
    setTaxPercent(po.taxPercent || 0);
    setNotes(po.notes || '');
    setItems(
      po.items.map((it, idx) => ({
        id: (idx + 1).toString(),
        materialId: it.materialId,
        itemName: it.itemName,
        category: it.category,
        qty: it.qty.toString(),
        unit: it.unit,
        unitPrice: it.unitPrice.toString(),
      }))
    );
    setShowModal(true);
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), itemName: '', category: 'large_format', qty: '1', unit: 'roll', unitPrice: '0' },
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  // Update Item Row
  const handleUpdateItemRow = (id: string, field: string, val: string) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  // Select Material from Master
  const handleSelectMaterial = (rowId: string, matId: string) => {
    const found = materials.find((m) => m.id === matId);
    if (!found) return;
    setItems((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            materialId: found.id,
            itemName: found.name,
            category: found.category,
            unit: found.unit === 'm²' ? 'roll' : found.unit,
            unitPrice: found.costPrice.toString(),
          };
        }
        return r;
      })
    );
  };

  // Calculated PO Totals in Modal
  const modalSubtotal = useMemo(() => {
    return items.reduce((acc, curr) => {
      const q = parseFloat(curr.qty.replace(/[^0-9.]/g, '')) || 0;
      const p = parseFloat(curr.unitPrice.replace(/[^0-9.]/g, '')) || 0;
      return acc + Math.round(q * p);
    }, 0);
  }, [items]);

  const modalShipping = parseFloat(shippingCostStr.replace(/[^0-9.]/g, '')) || 0;
  const modalTax = taxPercent > 0 ? Math.round((modalSubtotal * taxPercent) / 100) : 0;
  const modalTotal = modalSubtotal + modalShipping + modalTax;

  // Save PO
  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Nama Supplier wajib diisi!');
      return;
    }

    const validItems: PurchaseOrderItem[] = items
      .filter((it) => it.itemName.trim() !== '')
      .map((it, idx) => {
        const q = parseFloat(it.qty.replace(/[^0-9.]/g, '')) || 1;
        const p = parseFloat(it.unitPrice.replace(/[^0-9.]/g, '')) || 0;
        return {
          id: `POI-${Date.now()}-${idx}`,
          materialId: it.materialId,
          itemName: it.itemName,
          category: it.category,
          qty: q,
          unit: it.unit || 'pcs',
          unitPrice: p,
          subtotal: Math.round(q * p),
        };
      });

    if (validItems.length === 0) {
      alert('Minimal masukkan 1 barang yang dipesan!');
      return;
    }

    if (editingPo) {
      updatePurchaseOrder({
        ...editingPo,
        supplierName,
        supplierPhone,
        supplierAddress,
        supplierContactPerson: supplierPic,
        date: poDate,
        paymentTerms,
        items: validItems,
        subtotal: modalSubtotal,
        shippingCost: modalShipping,
        taxPercent,
        taxAmount: modalTax,
        totalAmount: modalTotal,
        notes,
      });
    } else {
      addPurchaseOrder({
        supplierName,
        supplierPhone,
        supplierAddress,
        supplierContactPerson: supplierPic,
        date: poDate,
        paymentTerms,
        items: validItems,
        subtotal: modalSubtotal,
        shippingCost: modalShipping,
        taxPercent,
        taxAmount: modalTax,
        totalAmount: modalTotal,
        status: 'sent',
        notes,
        createdBy: currentUser.name,
        approvedBy: 'Yahya (Owner)',
      });
    }

    setShowModal(false);
  };

  // Receive PO handler (Updates Material Stock Automatically)
  const handleReceiveGoods = (po: PurchaseOrder) => {
    if (po.status === 'received') {
      alert(`PO ${po.poNumber} sudah diterima sebelumnya pada ${formatDate(po.receivedDate || po.updatedAt || '')}!`);
      return;
    }

    const confirmMsg =
      `Konfirmasi Penerimaan Barang untuk PO ${po.poNumber}?\n\n` +
      `Supplier: ${po.supplierName}\n` +
      `Total Barang: ${po.items.length} item\n\n` +
      `Stok pada Master Bahan akan otomatis bertambah sesuai kuantitas PO ini!`;

    if (confirm(confirmMsg)) {
      receivePurchaseOrder(po.id);
      alert(`✓ Sukses! Barang PO ${po.poNumber} telah diterima dan stok gudang berhasil bertambah.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1e40af] rounded-sm flex items-center justify-center text-white">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#0f172a] leading-tight block">
              Purchase Order (PO) Supplier & Pembelian Bahan
            </span>
            <span className="text-[10px] text-[#64748b]">
              Surat Pesanan Resmi Percetakan, Pengadaan Bahan Roll/Meteran & Update Stok Otomatis
            </span>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded-sm flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat PO Supplier Baru</span>
        </button>
      </div>

      {/* 2. KPI Cards */}
      <div className="p-3 bg-white border-b border-[#cbd5e1] grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-[#475569]">Total Nilai PO Diterbitkan</span>
            <span className="text-base font-extrabold font-mono text-[#1e40af] block mt-0.5">
              {formatRupiah(totalNilaiPo)}
            </span>
          </div>
          <DollarSign className="w-6 h-6 text-[#1e40af]" />
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-800">Menunggu Kiriman Barang</span>
            <span className="text-base font-extrabold font-mono text-amber-900 block mt-0.5">
              {totalMenunggu} PO Aktif
            </span>
          </div>
          <Truck className="w-6 h-6 text-amber-700" />
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-emerald-800">Sudah Diterima (Stok Masuk)</span>
            <span className="text-base font-extrabold font-mono text-emerald-900 block mt-0.5">
              {totalDiterima} PO Selesai
            </span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-700" />
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-[#f8fafc] border-b border-[#cbd5e1] px-3 py-2 flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor PO, supplier, atau nama barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs focus:outline-none focus:border-[#1e40af]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-[#475569]">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
          >
            <option value="all">Semua Status PO</option>
            <option value="sent">Terkirim (Menunggu Kiriman)</option>
            <option value="received">Diterima (Stok Masuk)</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* 4. PO Table */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-32">No. PO</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-24">Tanggal</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Supplier & Kontak</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-48">Rincian Barang yang Dipesan</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-28">Syarat Bayar</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-32">Total Nilai PO</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-28">Status</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filteredPOs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#94a3b8]">
                  Belum ada data Purchase Order (PO)
                </td>
              </tr>
            ) : (
              filteredPOs.map((po) => (
                <tr key={po.id} className="hover:bg-[#f8fafc]">
                  <td className="border border-[#cbd5e1] px-2 py-1.5 font-mono font-bold text-[#1e40af]">
                    {po.poNumber}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-[#64748b] font-mono">
                    {formatDate(po.date)}
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5">
                    <span className="font-bold text-[#0f172a] block">{po.supplierName}</span>
                    <span className="text-[10px] text-[#64748b] font-mono">
                      {po.supplierPhone || '-'} {po.supplierContactPerson ? `(Up: ${po.supplierContactPerson})` : ''}
                    </span>
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5">
                    <div className="truncate max-w-xs font-medium text-[#334155]">
                      {po.items.map((it) => `${it.itemName} (${it.qty} ${it.unit})`).join(', ')}
                    </div>
                    <span className="text-[10px] text-[#64748b]">{po.items.length} item dipesan</span>
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-mono uppercase text-[10px] font-semibold text-[#475569]">
                    {po.paymentTerms.replace('_', ' ')}
                  </td>
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-[#0f172a]">
                    {formatRupiah(po.totalAmount)}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    {po.status === 'received' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Diterima (Stok Masuk)
                      </span>
                    ) : po.status === 'sent' ? (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-300 rounded font-bold text-[10px] inline-flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Terkirim ke Supplier
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold text-[10px]">
                        {po.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Tombol Cetak PO Resmi */}
                      <button
                        onClick={() => setSelectedPoToPrint(po)}
                        className="px-2 py-0.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8] font-semibold text-[10px] flex items-center gap-1"
                        title="Cetak Surat PO Resmi A4"
                      >
                        <Printer className="w-3 h-3 text-[#1e40af]" />
                        <span>Cetak</span>
                      </button>

                      {/* Tombol Terima Barang */}
                      {po.status !== 'received' && (
                        <button
                          onClick={() => handleReceiveGoods(po)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1"
                          title="Barang Sampai & Update Stok Otomatis"
                        >
                          <Package className="w-3 h-3" />
                          <span>Terima</span>
                        </button>
                      )}

                      {/* Tombol Edit */}
                      <button
                        onClick={() => handleOpenEdit(po)}
                        className="p-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] rounded border border-[#94a3b8]"
                        title="Edit PO"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        onClick={() => {
                          if (confirm(`Hapus PO ${po.poNumber}?`)) deletePurchaseOrder(po.id);
                        }}
                        className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5]"
                        title="Hapus PO"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Modal Buat / Edit Purchase Order */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-3xl my-auto p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  {editingPo ? `Edit Purchase Order: ${editingPo.poNumber}` : 'Buat Surat Purchase Order (PO) Supplier Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="space-y-3">
              {/* Info Supplier */}
              <div className="bg-[#f8fafc] border border-[#cbd5e1] p-2.5 rounded space-y-2">
                <div className="text-[11px] font-bold text-[#1e40af] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Informasi Supplier / Vendor:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Nama Supplier *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      list="supplier-suggestions"
                      value={supplierName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSupplierName(val);
                        const match = SUPPLIER_SUGGESTIONS.find((s) => s.name.toLowerCase() === val.toLowerCase());
                        if (match) {
                          setSupplierPhone(match.phone);
                          setSupplierPic(match.pic);
                          setSupplierAddress(match.address);
                        }
                      }}
                      placeholder="Ketik / pilih supplier langganan..."
                      className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                      required
                    />
                    <datalist id="supplier-suggestions">
                      {SUPPLIER_SUGGESTIONS.map((s, i) => (
                        <option key={i} value={s.name}>
                          {s.name} - Telp: {s.phone}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Telepon / WhatsApp Supplier
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="021-5591234 / 0812xxxx"
                      className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono select-text cursor-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Nama PIC / Kontak Up
                    </label>
                    <input
                      type="text"
                      value={supplierPic}
                      onChange={(e) => setSupplierPic(e.target.value)}
                      placeholder="Bpk. Hendra / Marketing"
                      className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs select-text cursor-text"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                      Alamat Supplier / Gudang
                    </label>
                    <input
                      type="text"
                      value={supplierAddress}
                      onChange={(e) => setSupplierAddress(e.target.value)}
                      placeholder="Jl. Raya Industri Blok B No. 8"
                      className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs select-text cursor-text"
                    />
                  </div>
                </div>
              </div>

              {/* Tanggal & Ketentuan Pembayaran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Tanggal PO</label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Syarat Pembayaran (Term of Payment)
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="tempo_14">Tempo 14 Hari (Invoice Jatuh Tempo)</option>
                    <option value="tempo_30">Tempo 30 Hari</option>
                    <option value="tempo_7">Tempo 7 Hari</option>
                    <option value="cod">Cash On Delivery (COD Bayar Saat Sampai)</option>
                    <option value="cash">Tunai / Transfer di Muka (CBD)</option>
                  </select>
                </div>
              </div>

              {/* Tabel Item Pembelian Barang */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#0f172a]">
                    Rincian Barang yang Dipesan ke Supplier:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-2 py-0.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#1e40af] font-bold text-[11px] rounded border border-[#94a3b8] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Tambah Baris</span>
                  </button>
                </div>

                <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
                  <thead className="bg-[#f1f5f9] text-[#475569] text-[10px] font-bold">
                    <tr>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-left">Pilih Master Bahan / Ketik Nama Barang</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-center w-16">Qty</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-center w-20">Satuan</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-right w-28">Harga Satuan (Rp)</th>
                      <th className="border border-[#cbd5e1] px-2 py-1 text-right w-28">Subtotal</th>
                      <th className="border border-[#cbd5e1] px-1 py-1 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {items.map((row) => {
                      const q = parseFloat(row.qty.replace(/[^0-9.]/g, '')) || 0;
                      const p = parseFloat(row.unitPrice.replace(/[^0-9.]/g, '')) || 0;
                      const rowSubtotal = Math.round(q * p);

                      return (
                        <tr key={row.id}>
                          <td className="border border-[#cbd5e1] p-1">
                            <div className="flex items-center gap-1">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) handleSelectMaterial(row.id, e.target.value);
                                }}
                                className="w-32 py-1 px-1 border border-[#cbd5e1] rounded text-[10px] bg-slate-50 text-[#475569]"
                                defaultValue=""
                              >
                                <option value="">Pilih Bahan...</option>
                                {materials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={row.itemName}
                                onChange={(e) => handleUpdateItemRow(row.id, 'itemName', e.target.value)}
                                placeholder="Ketik nama bahan/spesifikasi..."
                                className="flex-1 px-2 py-1 border border-[#94a3b8] rounded text-xs select-text font-medium"
                                required
                              />
                            </div>
                          </td>

                          <td className="border border-[#cbd5e1] p-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.qty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateItemRow(row.id, 'qty', e.target.value.replace(/[^0-9.]/g, ''))}
                              className="w-full text-center px-1 py-1 border border-[#94a3b8] rounded text-xs font-mono font-bold select-text"
                            />
                          </td>

                          <td className="border border-[#cbd5e1] p-1">
                            <select
                              value={row.unit}
                              onChange={(e) => handleUpdateItemRow(row.id, 'unit', e.target.value)}
                              className="w-full py-1 px-1 border border-[#94a3b8] rounded text-xs text-center"
                            >
                              <option value="roll">Roll</option>
                              <option value="m²">m²</option>
                              <option value="meter">Meter</option>
                              <option value="pcs">Pcs</option>
                              <option value="lembar">Lembar</option>
                              <option value="box">Box / Dus</option>
                              <option value="set">Set</option>
                              <option value="liter">Liter / Galon</option>
                              <option value="rim">Rim</option>
                            </select>
                          </td>

                          <td className="border border-[#cbd5e1] p-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={row.unitPrice}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateItemRow(row.id, 'unitPrice', e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-full text-right px-2 py-1 border border-[#94a3b8] rounded text-xs font-mono select-text"
                            />
                          </td>

                          <td className="border border-[#cbd5e1] px-2 py-1 text-right font-mono font-bold text-[#0f172a]">
                            {formatRupiah(rowSubtotal)}
                          </td>

                          <td className="border border-[#cbd5e1] p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(row.id)}
                              className="text-[#94a3b8] hover:text-rose-600"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subtotal, Ongkir, Pajak, Grand Total */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#cbd5e1]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Catatan Khusus Pengiriman / Spesifikasi
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Harap kirim menggunakan Lalamove, sertakan surat jalan dan faktur pajak."
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text"
                  ></textarea>
                </div>

                <div className="space-y-1.5 bg-[#f8fafc] border border-[#cbd5e1] p-2.5 rounded font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569]">Subtotal Barang:</span>
                    <span className="font-bold">{formatRupiah(modalSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569]">Ongkos Kirim (Rp):</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={shippingCostStr}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setShippingCostStr(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-28 text-right px-1.5 py-0.5 border border-[#94a3b8] rounded text-xs select-text font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569]">Pajak PPN:</span>
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                      className="w-28 py-0.5 px-1 border border-[#94a3b8] rounded text-xs font-semibold"
                    >
                      <option value={0}>Non-PPN (0%)</option>
                      <option value={11}>PPN 11%</option>
                    </select>
                  </div>

                  <div className="border-t border-[#cbd5e1] pt-1 mt-1 flex items-center justify-between font-extrabold text-sm text-[#1e40af]">
                    <span>TOTAL PO:</span>
                    <span>{formatRupiah(modalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-sm transition-colors"
                >
                  Simpan & Terbitkan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Official PO Printable Document Modal */}
      {selectedPoToPrint && (
        <PoPrintDocument
          po={selectedPoToPrint}
          onClose={() => setSelectedPoToPrint(null)}
        />
      )}
    </div>
  );
};
