import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  UserCheck,
  FileText,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Layers,
  Scissors,
  Palette,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Customer,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  ProductCategory,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string, actionType?: 'receipt' | 'spk') => void;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const { customers, materials, finishings, machines, addOrder, storeSettings } = useApp();
  const { currentUser, users } = useAuth();

  // Customer Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerType, setCustomerType] = useState<'regular' | 'reseller' | 'corporate'>('regular');
  const [pickupType, setPickupType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Items State
  const [items, setItems] = useState<OrderItem[]>([]);

  // Item Draft Form
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>('large_format');
  const [productName, setProductName] = useState('Spanduk Outdoor Flexi');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [lengthM, setLengthM] = useState<number>(2.0);
  const [widthM, setWidthM] = useState<number>(1.0);
  const [qty, setQty] = useState<number>(1);
  const [selectedFinishings, setSelectedFinishings] = useState<string[]>([]);
  const [designType, setDesignType] = useState<'ready_to_print' | 'minor_edit' | 'new_design'>('ready_to_print');
  const [designFee, setDesignFee] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [targetMachine, setTargetMachine] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Financial & Order Metadata
  const [discount, setDiscount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(storeSettings.taxEnabled);
  const [paymentType, setPaymentType] = useState<'paid' | 'dp' | 'unpaid'>('paid');
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'express'>('normal');
  const [deadlineDays, setDeadlineDays] = useState<number>(1);
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [assignedOperatorId, setAssignedOperatorId] = useState('');

  // Filtered materials by active category
  const filteredMaterials = materials.filter((m) => m.category === currentCategory);

  // Set default material when category changes
  useEffect(() => {
    if (filteredMaterials.length > 0) {
      setSelectedMaterialId(filteredMaterials[0].id);
      if (currentCategory === 'large_format') {
        setProductName('Spanduk / Banner Outdoor');
      } else if (currentCategory === 'digital_a3') {
        setProductName('Brosur / Stiker A3+');
      } else if (currentCategory === 'merchandise') {
        setProductName('Kaos DTF / Mug Custom');
      } else if (currentCategory === 'offset_doc') {
        setProductName('Nota NCR / Dokumen');
      } else {
        setProductName('Jasa Desain / Custom');
      }
    }
  }, [currentCategory]);

  // Adjust design fee default based on design type
  useEffect(() => {
    if (designType === 'ready_to_print') setDesignFee(0);
    else if (designType === 'minor_edit') setDesignFee(25000);
    else if (designType === 'new_design') setDesignFee(75000);
  }, [designType]);

  // Handle existing customer auto-fill
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerType(found.type);
    }
  };

  // Calculate area for large format
  const currentArea = currentCategory === 'large_format' ? Number((lengthM * widthM).toFixed(2)) : 0;
  const activeMaterial = materials.find((m) => m.id === selectedMaterialId) || filteredMaterials[0];
  const materialPrice = activeMaterial ? activeMaterial.sellingPrice : 0;

  // Calculate current item subtotal
  const calculateDraftSubtotal = () => {
    let base = 0;
    if (currentCategory === 'large_format') {
      base = currentArea * materialPrice * qty;
    } else {
      base = materialPrice * qty;
    }

    // Finishing total
    let finTotal = 0;
    selectedFinishings.forEach((fName) => {
      const fObj = finishings.find((f) => f.name === fName);
      if (fObj) {
        if (fObj.unit === 'per_pcs') finTotal += fObj.price * qty;
        else if (fObj.unit === 'per_meter') finTotal += fObj.price * (lengthM + widthM) * 2 * qty;
        else if (fObj.unit === 'per_lembar') finTotal += fObj.price * qty;
        else finTotal += fObj.price;
      }
    });

    return base + finTotal + designFee;
  };

  const handleAddItem = () => {
    if (!activeMaterial) return;

    let finTotal = 0;
    selectedFinishings.forEach((fName) => {
      const fObj = finishings.find((f) => f.name === fName);
      if (fObj) {
        if (fObj.unit === 'per_pcs') finTotal += fObj.price * qty;
        else if (fObj.unit === 'per_meter') finTotal += fObj.price * (lengthM + widthM) * 2 * qty;
        else if (fObj.unit === 'per_lembar') finTotal += fObj.price * qty;
        else finTotal += fObj.price;
      }
    });

    const sub = calculateDraftSubtotal();

    const newItem: OrderItem = {
      id: `ITEM-${Date.now()}`,
      category: currentCategory,
      productName: productName || activeMaterial.name,
      materialName: activeMaterial.name,
      lengthM: currentCategory === 'large_format' ? lengthM : undefined,
      widthM: currentCategory === 'large_format' ? widthM : undefined,
      areaM2: currentCategory === 'large_format' ? currentArea : undefined,
      qty,
      unit: activeMaterial.unit,
      unitPrice: materialPrice,
      subtotal: sub,
      finishingNames: [...selectedFinishings],
      finishingCost: finTotal,
      designFee,
      designType,
      fileUrl,
      fileName: fileName || (fileUrl ? 'Lampiran File Desain' : undefined),
      targetMachine: targetMachine || undefined,
      notes: itemNotes || undefined,
    };

    setItems([...items, newItem]);

    // Reset draft form
    setSelectedFinishings([]);
    setItemNotes('');
    setFileUrl('');
    setFileName('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // Grand Calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const tax = applyTax ? Math.round((subtotal - discount) * (storeSettings.taxPercent / 100)) : 0;
  const grandTotal = Math.max(0, subtotal - discount + tax);

  let calculatedPaid = 0;
  if (paymentType === 'paid') {
    calculatedPaid = grandTotal;
  } else if (paymentType === 'dp') {
    calculatedPaid = Math.min(dpAmount, grandTotal);
  } else {
    calculatedPaid = 0;
  }
  const balance = Math.max(0, grandTotal - calculatedPaid);

  const handleSubmitOrder = (actionType?: 'receipt' | 'spk') => {
    if (!customerName || !customerPhone) {
      alert('Nama dan No. WhatsApp pelanggan wajib diisi!');
      return;
    }
    if (items.length === 0) {
      alert('Tambahkan minimal 1 item cetakan ke pesanan!');
      return;
    }

    const assignedDesigner = users.find((u) => u.id === assignedDesignerId);
    const assignedOperator = users.find((u) => u.id === assignedOperatorId);

    // Initial status determination
    const hasDesignWork = items.some((i) => i.designType !== 'ready_to_print');
    const initialStatus = hasDesignWork ? 'design' : 'pending';

    const deadline = new Date(Date.now() + deadlineDays * 86400000).toISOString();

    const created = addOrder(
      {
        customerId: selectedCustomerId || `CUST-${Date.now().toString().slice(-4)}`,
        customerName,
        customerPhone,
        customerType,
        items,
        subtotal,
        discount,
        tax,
        total: grandTotal,
        paidAmount: calculatedPaid,
        balance,
        paymentStatus: paymentType as PaymentStatus,
        paymentMethod,
        status: initialStatus,
        priority,
        deadline,
        createdBy: currentUser.name,
        designerId: assignedDesigner?.id,
        designerName: assignedDesigner?.name,
        operatorId: assignedOperator?.id,
        operatorName: assignedOperator?.name,
        designStatus: hasDesignWork ? 'waiting' : 'approved',
        pickupType,
        deliveryAddress: pickupType === 'delivery' ? deliveryAddress : undefined,
      },
      currentUser
    );

    if (onOrderCreated) {
      onOrderCreated(created.id, actionType);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Input Pesanan Masuk Percetakan</h2>
              <p className="text-[11px] text-slate-400">Kalkulator otomatis meteran & lembaran, SPK & nota kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Customer Section */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-400" />
                <span>1. Data Pelanggan</span>
              </h3>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Pilih Pelanggan Terdaftar --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nama Pelanggan / Perusahaan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Rendy / Toko Kopi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  No. WhatsApp / HP *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Tipe Member
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="reseller">Reseller (Harga Khusus)</option>
                    <option value="corporate">Corporate / Instansi</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Pengambilan
                  </label>
                  <select
                    value={pickupType}
                    onChange={(e) => setPickupType(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="pickup">Ambil di Toko</option>
                    <option value="delivery">Kirim / Kurir</option>
                  </select>
                </div>
              </div>
            </div>

            {pickupType === 'delivery' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Alamat Pengiriman
                </label>
                <input
                  type="text"
                  placeholder="Masukkan alamat lengkap tujuan pengiriman..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          {/* 2. Item Builder & Printing Calculator */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>2. Tambah Item Cetak & Spesifikasi</span>
              </h3>

              {/* Category Tabs */}
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'large_format', label: 'Large Format / Outdoor' },
                    { id: 'digital_a3', label: 'Digital A3+ / Lembaran' },
                    { id: 'merchandise', label: 'Merchandise / DTF' },
                    { id: 'offset_doc', label: 'Offset & Dokumen' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCurrentCategory(tab.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      currentCategory === tab.id
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product & Material Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Produk / Job</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Pilihan Bahan / Media *</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {filteredMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {formatRupiah(m.sellingPrice)} / {m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Mesin Cetak</label>
                <select
                  value={targetMachine}
                  onChange={(e) => setTargetMachine(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Pilih Mesin (Opsional) --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dimension & Qty Calculator */}
            {currentCategory === 'large_format' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthM}
                    onChange={(e) => setLengthM(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Lebar (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthM}
                    onChange={(e) => setWidthM(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Jumlah (Qty Pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-brand-400 block mb-1">Total Luas</label>
                  <div className="text-xs bg-slate-950 border border-brand-500/40 rounded-lg px-3 py-2 text-brand-300 font-mono font-bold flex items-center justify-between">
                    <span>{currentArea} m²</span>
                    <span className="text-[10px] text-slate-400">({(currentArea * qty).toFixed(2)} m² tot)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Jumlah ({activeMaterial?.unit || 'Lembar/Pcs'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Harga Satuan</label>
                  <div className="text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-300 font-mono">
                    {formatRupiah(materialPrice)} / {activeMaterial?.unit}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-brand-400 block mb-1">Subtotal Bahan</label>
                  <div className="text-xs bg-slate-950 border border-brand-500/40 rounded-lg px-3 py-2 text-brand-300 font-mono font-bold">
                    {formatRupiah(materialPrice * qty)}
                  </div>
                </div>
              </div>
            )}

            {/* Finishing & Design Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Finishing checklist */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-brand-400" />
                  <span>Opsi Finishing Tambahan:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  {finishings
                    .filter((f) => f.category === currentCategory || f.category === 'large_format')
                    .map((f) => {
                      const isChecked = selectedFinishings.includes(f.name);
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-2 p-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                            isChecked ? 'bg-brand-500/15 text-brand-300' : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFinishings([...selectedFinishings, f.name]);
                              } else {
                                setSelectedFinishings(selectedFinishings.filter((n) => n !== f.name));
                              }
                            }}
                            className="rounded border-slate-700 text-brand-500 focus:ring-0"
                          />
                          <span className="truncate">{f.name}</span>
                          <span className="text-[9px] text-slate-500 ml-auto">
                            +{formatRupiah(f.price)}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Design Services */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Status Desain / File:</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ready_to_print', label: 'File Siap Cetak', fee: 'Rp 0' },
                    { id: 'minor_edit', label: 'Edit Ringan', fee: 'Rp 25.000' },
                    { id: 'new_design', label: 'Desain Baru', fee: 'Rp 75.000' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDesignType(d.id as any)}
                      className={`p-2 rounded-lg text-left border text-[10px] font-medium transition-all ${
                        designType === d.id
                          ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-[9px] opacity-75">{d.fee}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Link File (Google Drive / WeTransfer)..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="flex-1 text-[11px] bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Catatan SPK Khusus..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="flex-1 text-[11px] bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Add Item Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Estimasi Subtotal Item:{' '}
                <span className="font-bold text-slate-100 font-mono">
                  {formatRupiah(calculateDraftSubtotal())}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 font-semibold text-xs border border-brand-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan ke Daftar Order</span>
              </button>
            </div>

            {/* Added Items List Table */}
            {items.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Item & Spesifikasi</th>
                      <th className="p-2.5">Bahan & Ukuran</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Harga</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-200">{it.productName}</div>
                          {it.finishingNames.length > 0 && (
                            <div className="text-[10px] text-slate-400">
                              Finishing: {it.finishingNames.join(', ')}
                            </div>
                          )}
                          {it.designType !== 'ready_to_print' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                              Jasa Desain (+{formatRupiah(it.designFee)})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <div className="text-slate-300">{it.materialName}</div>
                          {it.lengthM && it.widthM && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {it.lengthM}m × {it.widthM}m ({it.areaM2} m²)
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-200">
                          {it.qty} {it.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-300">
                          {formatRupiah(it.unitPrice)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-brand-300">
                          {formatRupiah(it.subtotal)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Workflow Assignment & Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Assignment & Priority */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>3. Penugasan & Deadline SPK</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tugaskan Designer</label>
                  <select
                    value={assignedDesignerId}
                    onChange={(e) => setAssignedDesignerId(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Pilih Designer --</option>
                    {users
                      .filter((u) => u.role === 'designer' || u.role === 'owner')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tugaskan Operator</label>
                  <select
                    value={assignedOperatorId}
                    onChange={(e) => setAssignedOperatorId(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Pilih Operator --</option>
                    {users
                      .filter((u) => u.role === 'operator' || u.role === 'owner')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Prioritas Kerja</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="normal">Normal (Standar)</option>
                    <option value="urgent">Urgent (Prioritas)</option>
                    <option value="express">Express (Langsung Cetak)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Deadline Selesai</label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                    className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value={0}>Hari ini (Selesai Hari Ini)</option>
                    <option value={1}>Besok (1 Hari)</option>
                    <option value={2}>2 Hari</option>
                    <option value={3}>3 Hari</option>
                    <option value={7}>1 Minggu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment & Cashier Checkout */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>4. Pembayaran Kasir</span>
              </h3>

              {/* Pricing breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Pesanan:</span>
                  <span className="font-mono text-slate-200">{formatRupiah(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Diskon Potongan:</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-28 text-right text-xs bg-slate-900 border border-slate-750 rounded px-2 py-0.5 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-between text-slate-100 font-bold pt-1 border-t border-slate-800 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-brand-400">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Type */}
              <div className="pt-2 border-t border-slate-850 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'paid', label: 'Lunas Langsung' },
                      { id: 'dp', label: 'DP (Uang Muka)' },
                      { id: 'unpaid', label: 'Belum / Tempo' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentType(p.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                        paymentType === p.id
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {paymentType === 'dp' && (
                  <div className="flex items-center gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-[11px] text-amber-300 font-medium">Nominal DP:</span>
                    <input
                      type="number"
                      placeholder="Masukkan DP..."
                      value={dpAmount}
                      onChange={(e) => setDpAmount(parseInt(e.target.value) || 0)}
                      className="flex-1 text-xs bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-200 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      Sisa: {formatRupiah(grandTotal - dpAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-slate-400 shrink-0">Metode Bayar:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="flex-1 text-xs bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="cash">Tunai / Cash Kasir</option>
                    <option value="qris">QRIS Standar</option>
                    <option value="transfer_bca">Transfer Bank BCA</option>
                    <option value="transfer_mandiri">Transfer Bank Mandiri</option>
                    <option value="transfer_bri">Transfer Bank BRI</option>
                    <option value="tempo">Tempo / Piutang Usaha</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="h-16 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Batal
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span>Total Pesanan:</span>
              <span className="font-mono font-bold text-slate-100">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmitOrder('spk')}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 font-semibold text-xs border border-brand-500/30 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Simpan & SPK</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitOrder('receipt')}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Simpan & Struk</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitOrder()}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
