import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, X, Check, Printer, FileText, Package, Layers } from 'lucide-react';
import { Customer, OrderItem, Order, ProductSizeVariant } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { apiSaveSpk } from '../../services/api';
import { sounds } from '../../utils/soundEffects';
import { formatRupiah } from '../../utils/formatters';
import { sanitizeText, sanitizeCode, sanitizePhone, sanitizeDimension } from '../../utils/security';

interface SpkRowItem {
  id: string;
  kode: string;
  item: string;
  file: string;
  byk: number | string;
  p: string; // Panjang (meter)
  l: string; // Lebar (meter)
  catatan: string;
  unit?: string;
  unitPrice?: number;
  variant?: string;
}

// Helper untuk mengecek apakah item bertipe banner / meteran (wajib input P dan L)
export const checkIfMeterItem = (itemName: string, groupItem?: string, rowUnit?: string): boolean => {
  if (rowUnit === 'm²' || rowUnit === 'meter') return true;
  if (rowUnit && rowUnit !== 'm²' && rowUnit !== 'meter' && rowUnit !== '') return false;
  const lower = (itemName || '').toLowerCase();
  if (
    lower.includes('a3+') ||
    lower.includes('stiker cromo') ||
    lower.includes('kartu nama') ||
    lower.includes('id card') ||
    lower.includes('jersey') ||
    lower.includes('jaket') ||
    lower.includes('kaos') ||
    lower.includes('[ukuran:') ||
    lower.includes('[size:')
  ) {
    return false;
  }
  if (groupItem === 'OUTDOOR') return true;
  if (
    lower.includes('banner') ||
    lower.includes('spanduk') ||
    lower.includes('flexi') ||
    lower.includes('backlite') ||
    lower.includes('oneway') ||
    lower.includes('ritrama') ||
    lower.includes('luster') ||
    lower.includes('canvas') ||
    lower.includes('meteran') ||
    lower.includes('bendera')
  ) {
    if (lower.includes('x-banner') || lower.includes('y-banner') || lower.includes('roll up')) {
      return false;
    }
    return true;
  }
  return false;
};

interface ProductCatalogItem {
  id: string;
  kode: string;
  name: string;
  unit: string;
  price: number;
  hasVariants?: boolean;
  variantTitle?: string;
  sizeVariants?: ProductSizeVariant[];
}


interface InputSpkFormProps {
  editingOrder?: Order | null;
  importedItems?: Array<{ item: string; file: string; p: string; l: string; byk: number; catatan: string }> | null;
  onClearImportedItems?: () => void;
  onPrintSpk?: (spkData: any) => void;
  onExit?: () => void;
}

export const InputSpkForm: React.FC<InputSpkFormProps> = ({
  editingOrder,
  importedItems,
  onClearImportedItems,
  onPrintSpk,
  onExit,
}) => {
  const { customers, materials, categories, addOrder, updateOrder } = useApp();
  const { currentUser } = useAuth();

  // 1. Top Left Header Form
  const [tglSpk, setTglSpk] = useState<string>(() => {
    return editingOrder ? editingOrder.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
  });

  const [designPic, setDesignPic] = useState(() => {
    if (editingOrder?.designerName) return editingOrder.designerName.toUpperCase();
    return currentUser?.name ? currentUser.name.toUpperCase() : 'DESIGNER';
  });

  const [groupItem, setGroupItem] = useState(() => {
    return categories[0]?.name || 'INDOOR';
  });

  // Ensure groupItem stays in sync if categories change
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.name === groupItem)) {
      setGroupItem(categories[0].name);
    }
  }, [categories, groupItem]);

  // 2. Top Right Konsumen Group Box
  const [kodeKonsumen, setKodeKonsumen] = useState(() => {
    return editingOrder ? editingOrder.customerId.replace('CUST-', '') : '';
  });
  const [namaKonsumen, setNamaKonsumen] = useState(() => {
    return editingOrder ? editingOrder.customerName : '';
  });
  const [telpKonsumen, setTelpKonsumen] = useState(() => {
    return editingOrder ? editingOrder.customerPhone : '';
  });

  // 3. Customer Search Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // 4. Product Double-Click Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeRowIdForProduct, setActiveRowIdForProduct] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // 5. Initial rows
  const [items, setItems] = useState<SpkRowItem[]>(() => {
    if (editingOrder && editingOrder.items.length > 0) {
      const loaded = editingOrder.items.map((it: OrderItem, idx: number) => ({
        id: it.id || `ITEM-${idx}`,
        kode: `00${idx + 10}`.slice(-4),
        item: it.productName,
        file: it.fileName || '',
        byk: it.qty,
        p: it.lengthM ? it.lengthM.toString() : '',
        l: it.widthM ? it.widthM.toString() : '',
        catatan: it.notes || '',
      }));
      // Add one empty row at the end
      loaded.push({
        id: Date.now().toString(),
        kode: '',
        item: '',
        file: '',
        byk: 1,
        p: '',
        l: '',
        catatan: '',
      });
      return loaded;
    }
    return [
      {
        id: '1',
        kode: '',
        item: '',
        file: '',
        byk: 1,
        p: '',
        l: '',
        catatan: '',
      },
    ];
  });

  // Load importedItems if coming from Jersey Organizer
  useEffect(() => {
    if (importedItems && importedItems.length > 0) {
      const loaded: SpkRowItem[] = importedItems.map((it, idx) => ({
        id: `IMP-${idx}-${Date.now()}`,
        kode: `00${idx + 1}`.slice(-4),
        item: it.item,
        file: it.file,
        byk: it.byk,
        p: it.p || '',
        l: it.l || '',
        catatan: it.catatan || '',
      }));
      loaded.push({
        id: Date.now().toString(),
        kode: '',
        item: '',
        file: '',
        byk: 1,
        p: '',
        l: '',
        catatan: '',
      });
      setItems(loaded);
      if (onClearImportedItems) onClearImportedItems();
    }
  }, [importedItems]);

  // Load editingOrder if prop updates
  useEffect(() => {
    if (editingOrder) {
      setTglSpk(editingOrder.createdAt.split('T')[0]);
      setDesignPic(editingOrder.designerName ? editingOrder.designerName.toUpperCase() : (currentUser?.name ? currentUser.name.toUpperCase() : 'DESIGNER'));
      setKodeKonsumen(editingOrder.customerId.replace('CUST-', ''));
      setNamaKonsumen(editingOrder.customerName);
      setTelpKonsumen(editingOrder.customerPhone);
      if (editingOrder.items.length > 0) {
        const loaded = editingOrder.items.map((it: OrderItem, idx: number) => ({
          id: it.id || `ITEM-${idx}`,
          kode: `00${idx + 10}`.slice(-4),
          item: it.productName,
          file: it.fileName || '',
          byk: it.qty,
          p: it.lengthM ? it.lengthM.toString() : '',
          l: it.widthM ? it.widthM.toString() : '',
          catatan: it.notes || '',
        }));
        loaded.push({
          id: Date.now().toString(),
          kode: '',
          item: '',
          file: '',
          byk: 1,
          p: '',
          l: '',
          catatan: '',
        });
        setItems(loaded);
      }
    }
  }, [editingOrder]);

  const [notification, setNotification] = useState('');

  // Sync designer name strictly with active logged in user if not editing old order
  useEffect(() => {
    if (!editingOrder && currentUser?.name) {
      setDesignPic(currentUser.name.toUpperCase());
    }
  }, [currentUser, editingOrder]);

  // Filter products directly and strictly from Master Produk (materials) matching current groupItem
  const availableProducts = useMemo(() => {
    const activeGroup = (groupItem || 'INDOOR').toUpperCase().trim();

    // Strict direct match with Master Produk (materials)
    const matchedMaterials = materials.filter((m) => {
      const matCat = (m.category || '').toUpperCase().trim();
      if (matCat === activeGroup) return true;
      if (activeGroup === 'OUTDOOR' && (matCat.includes('OUTDOOR') || matCat === 'LARGE_FORMAT')) return true;
      if (activeGroup === 'INDOOR' && matCat.includes('INDOOR')) return true;
      return false;
    });

    const productList: ProductCatalogItem[] = matchedMaterials.map((m, idx) => ({
      id: m.id,
      kode: `00${idx + 10}`.slice(-4),
      name: m.name,
      unit: m.unit || 'm²',
      price: m.sellingPrice || 0,
      hasVariants: m.hasVariants,
      variantTitle: m.variantTitle,
      sizeVariants: m.sizeVariants,
    }));

    return productList.filter((p) => {
      if (!productSearch) return true;
      const s = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.kode.includes(s);
    });
  }, [groupItem, materials, productSearch]);

  // Check if a row has any content
  const isRowFilled = (r: SpkRowItem) => {
    return r.item.trim() !== '' || r.kode.trim() !== '' || r.file.trim() !== '';
  };

  // Automatically append a new row if the last row is filled
  const checkAutoAddNextRow = (currentRows: SpkRowItem[]) => {
    const lastRow = currentRows[currentRows.length - 1];
    if (lastRow && isRowFilled(lastRow)) {
      const newBlankRow: SpkRowItem = {
        id: Date.now().toString(),
        kode: '',
        item: '',
        file: '',
        byk: 1,
        p: '',
        l: '',
        catatan: '',
      };
      return [...currentRows, newBlankRow];
    }
    return currentRows;
  };

  // Handlers for Row Updates
  const handleUpdateRow = (id: string, field: keyof SpkRowItem, value: any) => {
    setItems((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, [field]: value } : row));
      return checkAutoAddNextRow(updated);
    });
  };

  // Handle Double Click to Open Product Catalog Modal
  const handleItemDoubleClick = (rowId: string) => {
    setActiveRowIdForProduct(rowId);
    setProductSearch('');
    setShowProductModal(true);
  };

  // When User Selects a Product from the Modal
  const handleSelectProduct = (
    product: ProductCatalogItem,
    selectedVariant?: ProductSizeVariant
  ) => {
    if (!activeRowIdForProduct) return;

    const finalItemName = selectedVariant
      ? `${product.name} [${product.variantTitle || 'Ukuran'}: ${selectedVariant.size}]`
      : product.name;
    const finalPrice = selectedVariant ? selectedVariant.sellingPrice : product.price;

    setItems((prev) => {
      const updated = prev.map((row) => {
        if (row.id === activeRowIdForProduct) {
          return {
            ...row,
            kode: product.kode,
            item: finalItemName,
            unit: product.unit,
            unitPrice: finalPrice,
            variant: selectedVariant ? selectedVariant.size : undefined,
          };
        }
        return row;
      });

      return checkAutoAddNextRow(updated);
    });

    setShowProductModal(false);
    setActiveRowIdForProduct(null);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) {
      setItems([
        {
          id: Date.now().toString(),
          kode: '',
          item: '',
          file: '',
          byk: 1,
          p: '',
          l: '',
          catatan: '',
        },
      ]);
      return;
    }
    setItems(items.filter((r) => r.id !== id));
  };

  const handleSelectCustomer = (cust: Customer) => {
    setKodeKonsumen(cust.phone.slice(-4) || '0001');
    setNamaKonsumen(cust.name);
    setTelpKonsumen(cust.phone);
    setShowCustomerModal(false);
  };

  const handleNewSpk = () => {
    setKodeKonsumen('');
    setNamaKonsumen('');
    setTelpKonsumen('');
    setDesignPic(currentUser?.name ? currentUser.name.toUpperCase() : 'DESIGNER');
    setItems([
      {
        id: Date.now().toString(),
        kode: '',
        item: '',
        file: '',
        byk: 1,
        p: '',
        l: '',
        catatan: '',
      },
    ]);
    setNotification('Form SPK baru siap diisi');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSaveSpk = async () => {
    if (!namaKonsumen.trim()) {
      alert('Nama Konsumen wajib diisi!');
      return;
    }

    const validRows = items.filter((it) => it.item.trim() !== '');
    if (validRows.length === 0) {
      alert('Isi minimal 1 baris item cetakan!');
      return;
    }

    // 1. Validasi Item Banner / Meteran: Wajib mengisi Panjang (P) dan Lebar (L) dalam meter
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const isMeter = checkIfMeterItem(row.item, groupItem, row.unit);
      if (isMeter) {
        const pNum = parseFloat(row.p);
        const lNum = parseFloat(row.l);
        if (!pNum || pNum <= 0 || !lNum || lNum <= 0 || isNaN(pNum) || isNaN(lNum)) {
          alert(
            `Perhatian pada Baris ${i + 1} (${row.item}):\n\n` +
            `Produk bertipe BANNER / PER METER WAJIB mengisi kolom Panjang (P) dan Lebar (L) dalam satuan meter!\n` +
            `Contoh: P = 3, L = 1 (untuk ukuran spanduk 3x1 meter).`
          );
          return;
        }
      }
    }

    const nextSeq = Math.floor(Math.random() * 9000) + 1000;
    const noSpk = editingOrder ? editingOrder.spkNumber : `SPK-${tglSpk.replace(/-/g, '')}-${nextSeq}`;
    const noFaktur = editingOrder ? editingOrder.orderNumber : `INV-${tglSpk.replace(/-/g, '')}-${nextSeq}`;

    // Map rows to standard order items dengan hitungan per meter atau satuan (pcs)
    const orderItems: OrderItem[] = validRows.map((it, idx) => {
      const isMeter = checkIfMeterItem(it.item, groupItem, it.unit);
      const pNum = it.p ? parseFloat(it.p) : undefined;
      const lNum = it.l ? parseFloat(it.l) : undefined;
      const area = isMeter && pNum && lNum ? Number((pNum * lNum).toFixed(2)) : undefined;

      // Cari harga dan satuan dari katalog
      let price = it.unitPrice;
      let unit = it.unit;
      if (!price) {
        const found = availableProducts.find(
          (p) => p.kode === it.kode || p.name.toLowerCase() === it.item.toLowerCase()
        );
        price = found?.price;
        unit = found?.unit;
      }

      const unitPrice = price || (isMeter ? 20000 : 25000);
      const finalUnit = unit || (isMeter ? 'm²' : 'pcs');
      const qty = typeof it.byk === 'number' ? it.byk : parseInt(it.byk) || 1;

      // RUMUS PERHITUNGAN:
      // - JIKA BANNER / PER METER: Subtotal = (Panjang × Lebar) × Qty × Harga/m²
      // - JIKA SATUAN / PCS: Subtotal = Qty × Harga Satuan
      let subtotal = 0;
      if (isMeter && area && area > 0) {
        subtotal = Math.round(area * qty * unitPrice);
      } else {
        subtotal = Math.round(qty * unitPrice);
      }

      return {
        id: `ITEM-${Date.now()}-${idx}`,
        category: groupItem.toLowerCase() as any,
        productName: it.item || 'Item Cetak',
        materialName: it.item || 'Standar',
        lengthM: pNum,
        widthM: lNum,
        areaM2: area,
        qty,
        unit: finalUnit,
        variant: it.variant,
        unitPrice,
        subtotal,
        finishingNames: [],
        finishingCost: 0,
        designFee: 0,
        designType: 'ready_to_print',
        fileName: it.file,
        notes: it.catatan,
      };
    });

    const totalCalculated = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);

    const cleanCustomerName = sanitizeText(namaKonsumen || 'Pelanggan Walk-in', 100);
    const cleanCustomerKode = sanitizeCode(kodeKonsumen || '0000', 20);
    const cleanCustomerPhone = sanitizePhone(telpKonsumen || '-');

    if (editingOrder) {
      updateOrder(
        {
          ...editingOrder,
          customerId: `CUST-${cleanCustomerKode}`,
          customerName: cleanCustomerName,
          customerPhone: cleanCustomerPhone,
          designerName: designPic,
          items: orderItems,
          subtotal: totalCalculated,
          total: totalCalculated,
          balance: Math.max(0, totalCalculated - (editingOrder.paidAmount || 0)),
        },
        currentUser,
        'Update SPK dari Form'
      );
    } else {
      // Save to Local AppContext
      addOrder(
        {
          customerId: `CUST-${cleanCustomerKode}`,
          customerName: cleanCustomerName,
          customerPhone: cleanCustomerPhone,
          customerType: 'regular',
          items: orderItems,
          subtotal: totalCalculated,
          discount: 0,
          tax: 0,
          total: totalCalculated,
          paidAmount: 0,
          balance: totalCalculated,
          paymentStatus: 'unpaid',
          paymentMethod: 'cash',
          status: 'pending',
          priority: 'normal',
          deadline: new Date(Date.now() + 86400000).toISOString(),
          createdBy: currentUser?.name || 'Designer',
          designerName: designPic,
          designStatus: 'waiting', // Wajib menunggu approval admin!
          pickupType: 'pickup',
        },
        currentUser
      );
    }

    // Save to MySQL Server
    await apiSaveSpk({
      no_spk: noSpk,
      no_faktur: noFaktur,
      tgl_spk: tglSpk,
      design_pic: designPic,
      group_item: groupItem,
      customer_kode: cleanCustomerKode,
      customer_nama: cleanCustomerName,
      customer_telp: cleanCustomerPhone,
      total: totalCalculated,
      bayar: editingOrder ? editingOrder.paidAmount : 0,
      sisa: editingOrder ? Math.max(0, totalCalculated - editingOrder.paidAmount) : totalCalculated,
      payment_status: editingOrder ? editingOrder.paymentStatus : 'unpaid',
      work_status: editingOrder ? editingOrder.status : 'pending',
      created_by: currentUser?.name || 'Designer',
      items: validRows.map((it) => ({
        kode: sanitizeCode(it.kode, 20),
        item_name: sanitizeText(it.item, 150),
        file_name: sanitizeText(it.file, 255),
        qty: typeof it.byk === 'number' ? it.byk : parseInt(it.byk) || 1,
        p: it.p ? parseFloat(sanitizeDimension(it.p)) : null,
        l: it.l ? parseFloat(sanitizeDimension(it.l)) : null,
        catatan: sanitizeText(it.catatan, 255),
      })),
    });

    sounds.playSuccess();
    setNotification(
      editingOrder
        ? `✓ SPK ${noSpk} berhasil diperbarui! Mengalihkan ke Rekap SPK...`
        : `✓ SPK ${noSpk} berhasil disimpan!`
    );

    setTimeout(() => {
      if (editingOrder && onExit) {
        onExit(); // Otomatis kembali ke halaman Rekap SPK setelah edit
      } else {
        handleNewSpk();
      }
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar (Presisi Sesuai Gambar) */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-start justify-between gap-4">
        {/* Left Form Controls: Tgl SPK, Design, Group Item, Cetak SPK */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          {/* Tgl SPK */}
          <div className="flex items-center gap-2">
            <label className="w-20 font-medium text-[#334155] dark:text-slate-200 shrink-0">Tgl SPK</label>
            <input
              type="date"
              value={tglSpk}
              onChange={(e) => setTglSpk(e.target.value)}
              className="bg-white dark:bg-[#162035] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs text-[#0f172a] dark:text-slate-100 font-sans w-36 shadow-inner focus:outline-none focus:border-[#1e40af] dark:focus:border-blue-400"
            />
          </div>

          {/* Design / Penginput: Otomatis Terkunci Sesuai Akun Login */}
          <div className="flex items-center gap-2">
            <label className="w-20 font-medium text-[#334155] dark:text-slate-200 shrink-0">Design</label>
            <input
              type="text"
              value={designPic}
              readOnly
              disabled
              title="Nama design otomatis terkunci sesuai akun yang sedang login"
              className="bg-[#f1f5f9] dark:bg-[#141c2e] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs font-bold text-[#1e40af] dark:text-blue-400 w-36 shadow-inner uppercase cursor-not-allowed select-none focus:outline-none"
            />
          </div>

          {/* Group Item (Sinkron Penuh dengan Master Kategori) */}
          <div className="flex items-center gap-2">
            <label className="w-20 font-medium text-[#334155] dark:text-slate-200 shrink-0">Group Item</label>
            <select
              value={groupItem}
              onChange={(e) => setGroupItem(e.target.value)}
              className="bg-white dark:bg-[#162035] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs text-[#0f172a] dark:text-slate-100 font-bold w-36 shadow-inner focus:outline-none focus:border-[#1e40af] dark:focus:border-blue-400"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Button: Cetak SPK (Hanya untuk Admin / Owner, disembunyikan untuk Designer) */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
            <div className="pt-1">
              <button
                onClick={() => {
                  if (onPrintSpk) {
                    onPrintSpk({
                      spkNumber: `SPK-${tglSpk.replace(/-/g, '')}`,
                      orderNumber: `INV-${tglSpk.replace(/-/g, '')}`,
                      customerName: namaKonsumen || 'Pelanggan Walk-in',
                      customerPhone: telpKonsumen || '-',
                      customerType: 'regular',
                      priority: 'normal',
                      deadline: new Date().toISOString(),
                      designerName: designPic,
                      items: items
                        .filter((it) => it.item.trim() !== '')
                        .map((it) => {
                          const isMeter = checkIfMeterItem(it.item, groupItem, it.unit);
                          const pNum = parseFloat(it.p) || undefined;
                          const lNum = parseFloat(it.l) || undefined;
                          const area = isMeter && pNum && lNum ? Number((pNum * lNum).toFixed(2)) : undefined;
                          const qty = typeof it.byk === 'number' ? it.byk : parseInt(it.byk) || 1;
                          const price = it.unitPrice || (isMeter ? 20000 : 25000);
                          const subtotal = isMeter && area ? Math.round(area * qty * price) : Math.round(qty * price);

                          return {
                            id: it.id,
                            productName: it.item || 'Item Cetak',
                            materialName: it.item || 'Standar',
                            fileName: it.file,
                            qty,
                            unit: it.unit || (isMeter ? 'm²' : 'pcs'),
                            unitPrice: price,
                            subtotal,
                            finishingNames: [],
                            lengthM: pNum,
                            widthM: lNum,
                            areaM2: area,
                            notes: it.catatan,
                          };
                        }),
                    });
                  }
                }}
                className="px-4 py-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] border border-[#94a3b8] rounded-sm font-medium shadow-sm transition-colors"
              >
                Cetak SPK
              </button>
            </div>
          )}
        </div>

        {/* Center/Right: Group Box Konsumen */}
        <fieldset className="border border-[#94a3b8] dark:border-[#334155] rounded-sm px-3 py-2 flex flex-col gap-1.5 bg-white/80 dark:bg-[#131b2e] w-full max-w-sm">
          <legend className="px-1 text-[11px] font-bold text-[#475569] dark:text-blue-300">Konsumen</legend>

          {/* Kode */}
          <div className="flex items-center gap-2">
            <label className="w-12 font-medium text-[#475569] dark:text-slate-200">Kode</label>
            <input
              type="text"
              placeholder="0000"
              value={kodeKonsumen}
              onChange={(e) => setKodeKonsumen(e.target.value)}
              className="bg-white dark:bg-[#162035] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs text-[#0f172a] dark:text-slate-100 font-mono w-24 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="px-3 py-0.5 bg-[#e2e8f0] dark:bg-[#1e293b] hover:bg-[#cbd5e1] dark:hover:bg-[#334155] border border-[#94a3b8] dark:border-[#334155] text-[#0f172a] dark:text-slate-100 rounded-sm text-xs font-medium"
            >
              Cari
            </button>
          </div>

          {/* Nama */}
          <div className="flex items-center gap-2">
            <label className="w-12 font-medium text-[#475569] dark:text-slate-200">Nama</label>
            <input
              type="text"
              value={namaKonsumen}
              onChange={(e) => setNamaKonsumen(e.target.value)}
              placeholder="Ketik nama konsumen..."
              className="flex-1 bg-white dark:bg-[#162035] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs text-[#0f172a] dark:text-slate-100 font-semibold shadow-inner"
            />
          </div>

          {/* Telp */}
          <div className="flex items-center gap-2">
            <label className="w-12 font-medium text-[#475569] dark:text-slate-200">Telp</label>
            <input
              type="text"
              value={telpKonsumen}
              onChange={(e) => setTelpKonsumen(e.target.value)}
              placeholder="08123456789"
              className="flex-1 bg-white dark:bg-[#162035] border border-[#94a3b8] dark:border-[#334155] rounded-sm px-2 py-0.5 text-xs text-[#0f172a] dark:text-slate-100 font-mono shadow-inner"
            />
          </div>
        </fieldset>

        {/* Far Right: Action Buttons [Save], [New], [Exit] */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleSaveSpk}
            className="px-5 py-1.5 bg-[#e2e8f0] dark:bg-[#1e293b] hover:bg-[#cbd5e1] dark:hover:bg-[#334155] text-[#0f172a] dark:text-slate-100 font-semibold border border-[#94a3b8] dark:border-[#334155] rounded-sm shadow-sm transition-colors active:translate-y-0.5"
          >
            Save
          </button>

          <button
            type="button"
            onClick={handleNewSpk}
            className="px-5 py-1.5 bg-[#e2e8f0] dark:bg-[#1e293b] hover:bg-[#cbd5e1] dark:hover:bg-[#334155] text-[#0f172a] dark:text-slate-100 font-semibold border border-[#94a3b8] dark:border-[#334155] rounded-sm shadow-sm transition-colors active:translate-y-0.5"
          >
            New
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-5 py-1.5 bg-[#e2e8f0] dark:bg-[#1e293b] hover:bg-[#cbd5e1] dark:hover:bg-[#334155] text-[#0f172a] dark:text-slate-100 font-semibold border border-[#94a3b8] dark:border-[#334155] rounded-sm shadow-sm transition-colors active:translate-y-0.5"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-[#eff6ff] dark:bg-blue-950 border-b border-[#bfdbfe] dark:border-blue-800 text-[#1e40af] dark:text-blue-300 px-4 py-1 text-xs font-semibold">
          {notification}
        </div>
      )}

      {/* 2. Data Grid Table (Spreadsheet Style dengan Double Click Produk & Auto Row Add) */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0b0f19] p-2">
        <table className="w-full border-collapse border border-[#cbd5e1] dark:border-[#243048] text-xs">
          <thead>
            {/* Header row 1 */}
            <tr className="bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] dark:from-[#1e293b] dark:to-[#0f172a] text-[#0f172a] dark:text-slate-100 text-[11px] font-bold border-b border-[#cbd5e1] dark:border-[#243048]">
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1.5 text-left w-20">Kode</th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-3 py-1.5 text-left">
                Item <span className="font-normal text-[10px] text-[#1e40af] dark:text-blue-300">(Double Click utk Pilih Produk)</span>
              </th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-3 py-1.5 text-left w-32">File</th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1.5 text-center w-14">Byk</th>
              <th colSpan={2} className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1 text-center w-28">
                Ukuran (m)
              </th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1 text-center w-24">
                Luas / Tipe
              </th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-3 py-1.5 text-left">Catatan</th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1.5 text-center w-12">Aksi</th>
            </tr>
            {/* Sub-header for Ukuran (P, L) */}
            <tr className="bg-[#f1f5f9] dark:bg-[#141c2e] text-[#475569] dark:text-slate-200 text-[10px] font-bold border-b border-[#cbd5e1] dark:border-[#243048]">
              <th colSpan={4} className="border-r border-[#cbd5e1] dark:border-[#243048] py-0.5"></th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] py-0.5 text-center w-14">P (m)</th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] py-0.5 text-center w-14">L (m)</th>
              <th className="border border-[#cbd5e1] dark:border-[#243048] py-0.5 text-center w-24">m² / Pcs</th>
              <th colSpan={2} className="border-l border-[#cbd5e1] dark:border-[#243048] py-0.5"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e2e8f0]">
            {items.map((row, idx) => {
              const isMeter = checkIfMeterItem(row.item, groupItem, row.unit);
              const pNum = parseFloat(row.p);
              const lNum = parseFloat(row.l);
              const rowArea = isMeter && pNum && lNum ? Number((pNum * lNum).toFixed(2)) : null;
              const isMissingDimensions = isMeter && row.item.trim() !== '' && (!pNum || !lNum);

              return (
                <tr key={row.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#162035] transition-colors">
                  {/* Kode */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5">
                    <input
                      type="text"
                      value={row.kode}
                      placeholder="0000"
                      onChange={(e) => handleUpdateRow(row.id, 'kode', e.target.value)}
                      className="w-full px-1.5 py-1 text-xs text-[#0f172a] dark:text-slate-100 font-mono border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent"
                    />
                  </td>

                  {/* Item (Double Click to Open Group-Filtered Products Modal) */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5">
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={row.item}
                        onDoubleClick={() => handleItemDoubleClick(row.id)}
                        onChange={(e) => handleUpdateRow(row.id, 'item', e.target.value)}
                        placeholder={`Double click untuk pilih produk [${groupItem}]...`}
                        title="Double click untuk membuka daftar produk sesuai Group Item"
                        className="flex-1 px-1.5 py-1 text-xs text-[#0f172a] dark:text-slate-100 font-semibold border-0 cursor-pointer hover:bg-[#eff6ff] dark:hover:bg-[#1a2742] focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      {row.variant && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
                          {row.variant}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* File */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5">
                    <input
                      type="text"
                      value={row.file}
                      onChange={(e) => handleUpdateRow(row.id, 'file', e.target.value)}
                      placeholder="Nama file / link..."
                      className="w-full px-1.5 py-1 text-xs text-[#0f172a] dark:text-slate-100 border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </td>

                  {/* Byk */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.byk}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        handleUpdateRow(row.id, 'byk', clean === '' ? '' : parseInt(clean));
                      }}
                      className="w-full px-1 py-1 text-xs text-center text-[#0f172a] dark:text-slate-100 font-bold font-mono border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent select-text cursor-text"
                    />
                  </td>

                  {/* Ukuran P (Meter) */}
                  <td className={`border border-[#cbd5e1] dark:border-[#243048] p-0.5 ${isMissingDimensions && !pNum ? 'bg-amber-100/70 dark:bg-amber-950/50' : ''}`}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.p}
                      onFocus={(e) => e.target.select()}
                      disabled={!isMeter && row.item.trim() !== '' && Boolean(row.unit && row.unit !== 'm²')}
                      placeholder={isMeter ? 'P (m)' : '-'}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9.]/g, '');
                        handleUpdateRow(row.id, 'p', clean);
                      }}
                      className={`w-full px-1 py-1 text-xs text-center font-mono border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent select-text cursor-text ${
                        isMeter ? 'text-[#0f172a] dark:text-slate-100 font-bold' : 'text-[#94a3b8] dark:text-slate-600 bg-slate-50 dark:bg-slate-900/40'
                      }`}
                      title={isMeter ? 'Wajib diisi dalam meter untuk banner/spanduk' : 'Produk satuan (pcs)'}
                    />
                  </td>

                  {/* Ukuran L (Meter) */}
                  <td className={`border border-[#cbd5e1] dark:border-[#243048] p-0.5 ${isMissingDimensions && !lNum ? 'bg-amber-100/70 dark:bg-amber-950/50' : ''}`}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.l}
                      onFocus={(e) => e.target.select()}
                      disabled={!isMeter && row.item.trim() !== '' && Boolean(row.unit && row.unit !== 'm²')}
                      placeholder={isMeter ? 'L (m)' : '-'}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9.]/g, '');
                        handleUpdateRow(row.id, 'l', clean);
                      }}
                      className={`w-full px-1 py-1 text-xs text-center font-mono border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent select-text cursor-text ${
                        isMeter ? 'text-[#0f172a] dark:text-slate-100 font-bold' : 'text-[#94a3b8] dark:text-slate-600 bg-slate-50 dark:bg-slate-900/40'
                      }`}
                      title={isMeter ? 'Wajib diisi dalam meter untuk banner/spanduk' : 'Produk satuan (pcs)'}
                    />
                  </td>

                  {/* Luas / Tipe Perhitungan */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] px-2 py-1 text-center font-mono">
                    {isMeter ? (
                      rowArea ? (
                        <span className="font-bold text-[#1e40af] dark:text-blue-300 text-[11px] bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 block">
                          {rowArea} m²
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-1 py-0.5 rounded border border-amber-300 dark:border-amber-700 block animate-pulse">
                          ⚠️ Wajib P×L
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-[#64748b] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded block">
                        Satuan ({row.unit || 'pcs'})
                      </span>
                    )}
                  </td>

                  {/* Catatan */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5">
                    <input
                      type="text"
                      value={row.catatan}
                      onChange={(e) => handleUpdateRow(row.id, 'catatan', e.target.value)}
                      placeholder="Keterangan finishing / format..."
                      className="w-full px-1.5 py-1 text-xs text-[#0f172a] dark:text-slate-100 border-0 focus:outline-none focus:bg-[#eff6ff] dark:focus:bg-[#1a2742] bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </td>

                  {/* Actions */}
                  <td className="border border-[#cbd5e1] dark:border-[#243048] p-0.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1 text-[#94a3b8] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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

        {/* Footer Info: Baris Otomatis Bertambah & Total Akurat */}
        <div className="mt-2.5 px-3 py-1.5 bg-[#f1f5f9] dark:bg-[#141c2e] border border-[#cbd5e1] dark:border-[#243048] rounded-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[#1e40af] dark:text-blue-300 font-medium text-[11px]">
            <span>💡 Tips: Double-click pada kolom <b>Item</b> untuk memilih produk kategori <b>[{groupItem}]</b>.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#64748b] dark:text-slate-300 text-[11px] font-mono">
              {items.filter((r) => r.item.trim() !== '').length} baris terisi • Baris baru bertambah otomatis
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-1 rounded border border-[#94a3b8] dark:border-[#334155] shadow-xs">
              <span className="font-bold text-[#334155] dark:text-slate-200 text-[11px]">Total Estimasi SPK:</span>
              <span className="font-mono font-bold text-sm text-[#1e40af] dark:text-blue-400">
                {formatRupiah(
                  items
                    .filter((it) => it.item.trim() !== '')
                    .reduce((acc, it) => {
                      const isMeter = checkIfMeterItem(it.item, groupItem, it.unit);
                      const pNum = it.p ? parseFloat(it.p) : 0;
                      const lNum = it.l ? parseFloat(it.l) : 0;
                      const area = isMeter && pNum && lNum ? Number((pNum * lNum).toFixed(2)) : 0;
                      const qty = typeof it.byk === 'number' ? it.byk : parseInt(it.byk) || 1;
                      let price = it.unitPrice;
                      if (!price) {
                        const found = availableProducts.find(
                          (p) => p.kode === it.kode || p.name.toLowerCase() === it.item.toLowerCase()
                        );
                        price = found?.price || (isMeter ? 20000 : 25000);
                      }
                      const subtotal = isMeter && area > 0 ? Math.round(area * qty * price) : Math.round(qty * price);
                      return acc + subtotal;
                    }, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modal: Pilih Produk Berdasarkan Group Item (Double Click) */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-lg p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Pilih Produk Kategori: <span className="text-[#1e40af] uppercase">[{groupItem}]</span>
                </h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Tabs inside Modal */}
            <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded border border-[#cbd5e1]">
              <span className="text-[11px] font-bold text-[#475569] px-1">Kategori:</span>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setGroupItem(c.name)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                    groupItem === c.name
                      ? 'bg-[#1e40af] text-white shadow-xs'
                      : 'bg-white text-[#475569] hover:bg-slate-200 border border-[#cbd5e1]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Quick Search inside Product Modal */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari nama atau kode produk ${groupItem}...`}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#94a3b8] rounded text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
              />
            </div>

            {/* Product Table Grid */}
            <div className="max-h-72 overflow-y-auto border border-[#cbd5e1] rounded bg-white">
              {availableProducts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#475569]">
                    Tidak ada produk untuk kategori <span className="text-[#1e40af]">[{groupItem}]</span> di Master Produk
                  </p>
                  <p className="text-[11px] text-[#64748b] max-w-xs mx-auto">
                    {productSearch
                      ? `Tidak ditemukan produk dengan kata kunci "${productSearch}".`
                      : `Data produk sinkron 100% dengan Master Produk. Silakan tambahkan produk baru pada menu Master ➡️ Master Produk & Stok.`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-[#f1f5f9] text-[#475569] text-[10px] font-bold border-b border-[#cbd5e1] sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left w-20">Kode</th>
                      <th className="px-3 py-1.5 text-left">Nama Produk / Bahan</th>
                      <th className="px-2 py-1.5 text-center w-16">Satuan</th>
                      <th className="px-3 py-1.5 text-right w-28">Harga</th>
                      <th className="px-2 py-1.5 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {availableProducts.map((prod) => {
                      const hasVars =
                        prod.hasVariants && prod.sizeVariants && prod.sizeVariants.length > 0;

                      return (
                        <tr
                          key={prod.kode}
                          onClick={() => handleSelectProduct(prod)}
                          className="hover:bg-[#eff6ff] cursor-pointer transition-colors"
                        >
                          <td className="px-2.5 py-2 font-mono font-bold text-[#1e40af] align-top">
                            {prod.kode}
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-[#0f172a]">{prod.name}</div>
                            {hasVars && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  Pilih {prod.variantTitle || 'Ukuran'}:
                                </span>
                                {prod.sizeVariants!.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectProduct(prod, v);
                                    }}
                                    className="px-2 py-0.5 bg-white hover:bg-purple-600 hover:text-white text-purple-800 border border-purple-300 rounded text-[10px] font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                                    title={`Pilih ${v.size} - ${formatRupiah(v.sellingPrice)}`}
                                  >
                                    <span>{v.size}</span>
                                    <span className="font-mono text-[9px] opacity-80">
                                      ({formatRupiah(v.sellingPrice)})
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 text-center text-[#64748b] font-mono text-[10px] align-top">
                            {prod.unit}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-[#0f172a] align-top">
                            {hasVars ? (
                              <span className="text-[#1e40af] text-[11px]">
                                {formatRupiah(
                                  Math.min(...prod.sizeVariants!.map((v) => v.sellingPrice))
                                )}{' '}
                                -{' '}
                                {formatRupiah(
                                  Math.max(...prod.sizeVariants!.map((v) => v.sellingPrice))
                                )}
                              </span>
                            ) : (
                              formatRupiah(prod.price)
                            )}
                          </td>
                          <td className="px-2 py-2 text-center align-top">
                            <span className="text-[10px] uppercase font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Pilih
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Customer Search Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a]">Pilih Data Konsumen</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau no. telepon konsumen..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#e2e8f0] border border-[#cbd5e1] rounded">
              {customers
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone.includes(customerSearch)
                )
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2 hover:bg-[#eff6ff] cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0f172a]">{c.name}</div>
                      <div className="text-[11px] text-[#64748b]">{c.phone}</div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Pilih
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
