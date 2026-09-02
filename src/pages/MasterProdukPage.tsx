import React, { useState, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Download,
  Upload,
  Layers,
  CheckSquare,
  Square,
  Sliders,
  Check,
  Info,
} from 'lucide-react';
import { MaterialItem, ProductSizeVariant } from '../types';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/formatters';
import { sounds } from '../utils/soundEffects';
import { sanitizeText, sanitizePrice } from '../utils/security';

export const MasterProdukPage: React.FC = () => {
  const {
    materials,
    categories,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    bulkUpdateMaterials,
    bulkAddMaterials,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Selection states for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Add / Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MaterialItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('INDOOR');
  const [unit, setUnit] = useState('pcs');
  const [costPriceStr, setCostPriceStr] = useState('10000');
  const [sellingPriceStr, setSellingPriceStr] = useState('20000');
  const [stockStr, setStockStr] = useState('100');
  const [minStockStr, setMinStockStr] = useState('20');
  const [description, setDescription] = useState('');

  // Shopee-style Variation States
  const [hasVariants, setHasVariants] = useState(false);
  const [variantTitle, setVariantTitle] = useState('Ukuran');
  const [sizeVariants, setSizeVariants] = useState<ProductSizeVariant[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [quickVariantPrice, setQuickVariantPrice] = useState('');
  const [quickVariantCost, setQuickVariantCost] = useState('');
  const [quickVariantStock, setQuickVariantStock] = useState('');

  // Bulk Edit Form States
  const [bulkSellingPriceMode, setBulkSellingPriceMode] = useState<'none' | 'set' | 'inc_nom' | 'dec_nom' | 'inc_pct' | 'dec_pct'>('none');
  const [bulkSellingPriceVal, setBulkSellingPriceVal] = useState('');
  const [bulkCostPriceMode, setBulkCostPriceMode] = useState<'none' | 'set' | 'inc_nom' | 'dec_nom' | 'inc_pct' | 'dec_pct'>('none');
  const [bulkCostPriceVal, setBulkCostPriceVal] = useState('');
  const [bulkStockMode, setBulkStockMode] = useState<'none' | 'set' | 'add'>('none');
  const [bulkStockVal, setBulkStockVal] = useState('');
  const [bulkMinStockVal, setBulkMinStockVal] = useState('');

  // Mass Upload States
  const [uploadPreview, setUploadPreview] = useState<Omit<MaterialItem, 'id'>[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeCategory = (cat: string): string => {
    const upper = (cat || '').toUpperCase().trim();
    if (upper === 'OUTDOOR' || upper === 'LARGE_FORMAT') return 'OUTDOOR';
    if (upper === 'INDOOR') return 'INDOOR';
    if (upper.includes('OUTDOOR')) return 'OUTDOOR';
    if (upper.includes('INDOOR')) return 'INDOOR';
    return upper || 'INDOOR';
  };

  const isMeterUnit = (u: string) => {
    const lower = (u || '').toLowerCase().trim();
    return lower === 'm²' || lower === 'meter' || lower === 'm2';
  };

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const normCat = normalizeCategory(m.category);
      if (
        categoryFilter !== 'all' &&
        normCat !== categoryFilter &&
        (m.category || '').toUpperCase() !== categoryFilter
      )
        return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [materials, categoryFilter, search]);

  // Selected Products Info & Unit Validation
  const selectedProducts = useMemo(() => {
    return materials.filter((m) => selectedIds.includes(m.id));
  }, [materials, selectedIds]);

  const unitValidation = useMemo(() => {
    if (selectedProducts.length <= 1) return { isValid: true, type: 'any', message: '' };
    const hasMeter = selectedProducts.some((m) => isMeterUnit(m.unit));
    const hasSatuan = selectedProducts.some((m) => !isMeterUnit(m.unit));

    if (hasMeter && hasSatuan) {
      return {
        isValid: false,
        type: 'mixed',
        message:
          '⚠️ Tipe Satuan Berbeda! Terdapat produk bertipe Meteran (m²/meter) dan produk bertipe Satuan (pcs/lembar/setel). Sesuai aturan, Edit Massal hanya dapat dilakukan pada produk dengan tipe satuan yang sejenis.',
      };
    }

    return {
      isValid: true,
      type: hasMeter ? 'meter' : 'satuan',
      message: hasMeter ? 'Semua produk bertipe Meteran (m²)' : 'Semua produk bertipe Satuan (pcs / lbr / setel)',
    };
  }, [selectedProducts]);

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Add Product
  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    const defaultCat = categories[0]?.name || 'INDOOR';
    setCategory(defaultCat);
    setUnit(defaultCat === 'OUTDOOR' ? 'm²' : 'pcs');
    setCostPriceStr('50000');
    setSellingPriceStr('85000');
    setStockStr('100');
    setMinStockStr('20');
    setDescription('');
    setHasVariants(false);
    setVariantTitle('Ukuran');
    setSizeVariants([]);
    setShowModal(true);
  };

  // Open Edit Product
  const handleOpenEdit = (m: MaterialItem) => {
    setEditing(m);
    setName(m.name);
    setCategory(normalizeCategory(m.category));
    setUnit(m.unit || 'pcs');
    setCostPriceStr((m.costPrice || 0).toString());
    setSellingPriceStr((m.sellingPrice || 0).toString());
    setStockStr((m.stock || 0).toString());
    setMinStockStr((m.minStock || 20).toString());
    setDescription(m.description || '');

    if (m.hasVariants && m.sizeVariants && m.sizeVariants.length > 0) {
      setHasVariants(true);
      setVariantTitle(m.variantTitle || 'Ukuran');
      setSizeVariants(m.sizeVariants);
    } else {
      setHasVariants(false);
      setVariantTitle('Ukuran');
      setSizeVariants([]);
    }
    setShowModal(true);
  };

  // Preset Size Adder
  const handleAddPresetSize = (sizeName: string) => {
    if (sizeVariants.some((v) => v.size.toLowerCase() === sizeName.toLowerCase())) return;
    const baseSell = parseFloat(sellingPriceStr) || 85000;
    const baseCost = parseFloat(costPriceStr) || 50000;
    const baseStock = Math.round((parseFloat(stockStr) || 100) / 4);

    let priceAdj = 0;
    let costAdj = 0;
    if (sizeName === 'S') {
      priceAdj = -5000;
      costAdj = -2000;
    } else if (sizeName === 'L') {
      priceAdj = 5000;
      costAdj = 3000;
    } else if (sizeName === 'XL') {
      priceAdj = 10000;
      costAdj = 6000;
    } else if (sizeName === 'XXL') {
      priceAdj = 15000;
      costAdj = 10000;
    }

    setSizeVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        size: sizeName,
        sellingPrice: Math.max(1000, baseSell + priceAdj),
        costPrice: Math.max(1000, baseCost + costAdj),
        stock: baseStock,
      },
    ]);
  };

  // Add custom option
  const handleAddCustomOption = () => {
    if (!newOptionName.trim()) return;
    if (sizeVariants.some((v) => v.size.toLowerCase() === newOptionName.trim().toLowerCase())) {
      alert('Nama opsi variasi ini sudah ada!');
      return;
    }
    const baseSell = parseFloat(sellingPriceStr) || 85000;
    const baseCost = parseFloat(costPriceStr) || 50000;
    const baseStock = 25;

    setSizeVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        size: newOptionName.trim(),
        sellingPrice: baseSell,
        costPrice: baseCost,
        stock: baseStock,
      },
    ]);
    setNewOptionName('');
  };

  // Apply to all variations (Quick Fill ala Shopee)
  const handleApplyToAllVariants = () => {
    const p = parseFloat(quickVariantPrice.replace(/[^0-9]/g, ''));
    const c = parseFloat(quickVariantCost.replace(/[^0-9]/g, ''));
    const s = parseFloat(quickVariantStock.replace(/[^0-9]/g, ''));

    if (isNaN(p) && isNaN(c) && isNaN(s)) {
      alert('Isi minimal salah satu kolom harga atau stok untuk diterapkan ke semua variasi!');
      return;
    }

    setSizeVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sellingPrice: !isNaN(p) ? p : v.sellingPrice,
        costPrice: !isNaN(c) ? c : v.costPrice,
        stock: !isNaN(s) ? s : v.stock,
      }))
    );
    sounds.playClick();
  };

  // Update specific variant field
  const handleUpdateVariant = (
    id: string,
    field: 'size' | 'sellingPrice' | 'costPrice' | 'stock',
    value: any
  ) => {
    setSizeVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Remove variant option
  const handleRemoveVariant = (id: string) => {
    setSizeVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Save Add/Edit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 120);
    if (!cleanName) return;

    const costPrice = sanitizePrice(costPriceStr, 0);
    const sellingPrice = sanitizePrice(sellingPriceStr, 0);
    const stock = sanitizePrice(stockStr, 0);
    const minStock = sanitizePrice(minStockStr, 10);

    const payload: Omit<MaterialItem, 'id'> = {
      name: cleanName,
      category: category as any,
      unit,
      costPrice,
      sellingPrice,
      stock,
      minStock,
      description: sanitizeText(description, 255) || undefined,
      hasVariants: hasVariants && sizeVariants.length > 0,
      variantTitle: hasVariants ? sanitizeText(variantTitle, 50) || 'Ukuran' : undefined,
      sizeVariants: hasVariants && sizeVariants.length > 0 ? sizeVariants : undefined,
    };

    if (editing) {
      updateMaterial({
        ...editing,
        ...payload,
      });
    } else {
      addMaterial(payload);
    }
    sounds.playSuccess();
    setShowModal(false);
  };

  // Save Bulk Edit (Only Price and Stock)
  const handleSaveBulkEdit = () => {
    if (!unitValidation.isValid) {
      alert('Tipe satuan harus sejenis! Batalkan centang pada item yang berbeda jenis.');
      return;
    }

    const updates: {
      id: string;
      costPrice?: number;
      sellingPrice?: number;
      stock?: number;
      minStock?: number;
    }[] = [];

    selectedProducts.forEach((m) => {
      let newSellingPrice = m.sellingPrice;
      let newCostPrice = m.costPrice;
      let newStock = m.stock;
      let newMinStock = m.minStock;

      // 1. Selling Price
      const sellNum = parseFloat(bulkSellingPriceVal.replace(/[^0-9.]/g, '')) || 0;
      if (bulkSellingPriceMode === 'set' && sellNum > 0) {
        newSellingPrice = sellNum;
      } else if (bulkSellingPriceMode === 'inc_nom') {
        newSellingPrice += sellNum;
      } else if (bulkSellingPriceMode === 'dec_nom') {
        newSellingPrice = Math.max(0, newSellingPrice - sellNum);
      } else if (bulkSellingPriceMode === 'inc_pct') {
        newSellingPrice = Math.round(newSellingPrice * (1 + sellNum / 100));
      } else if (bulkSellingPriceMode === 'dec_pct') {
        newSellingPrice = Math.round(newSellingPrice * (1 - sellNum / 100));
      }

      // 2. Cost Price
      const costNum = parseFloat(bulkCostPriceVal.replace(/[^0-9.]/g, '')) || 0;
      if (bulkCostPriceMode === 'set' && costNum > 0) {
        newCostPrice = costNum;
      } else if (bulkCostPriceMode === 'inc_nom') {
        newCostPrice += costNum;
      } else if (bulkCostPriceMode === 'dec_nom') {
        newCostPrice = Math.max(0, newCostPrice - costNum);
      } else if (bulkCostPriceMode === 'inc_pct') {
        newCostPrice = Math.round(newCostPrice * (1 + costNum / 100));
      } else if (bulkCostPriceMode === 'dec_pct') {
        newCostPrice = Math.round(newCostPrice * (1 - costNum / 100));
      }

      // 3. Stock
      const stockNum = parseFloat(bulkStockVal.replace(/[^0-9.]/g, '')) || 0;
      if (bulkStockMode === 'set') {
        newStock = stockNum;
      } else if (bulkStockMode === 'add') {
        newStock += stockNum;
      }

      // 4. Min Stock
      const minStockNum = parseFloat(bulkMinStockVal.replace(/[^0-9.]/g, ''));
      if (!isNaN(minStockNum) && minStockNum >= 0 && bulkMinStockVal.trim() !== '') {
        newMinStock = minStockNum;
      }

      updates.push({
        id: m.id,
        sellingPrice: newSellingPrice,
        costPrice: newCostPrice,
        stock: newStock,
        minStock: newMinStock,
      });
    });

    bulkUpdateMaterials(updates);
    setSelectedIds([]);
    setShowBulkEditModal(false);
  };

  // Download Excel / CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'Kode Produk',
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Harga Jual',
      'HPP Modal',
      'Stok',
      'Min Stok',
      'Deskripsi',
      'Variasi Ukuran (Contoh: S:80000;M:85000;L:90000;XL:95000)',
    ];

    const sampleRows = [
      [
        'PRD-001',
        'Banner Spanduk Flexi 280gr',
        'OUTDOOR',
        'm²',
        '20000',
        '12000',
        '250',
        '50',
        'Spanduk outdoor tebal tahan cuaca panas & hujan',
        '',
      ],
      [
        'PRD-002',
        'STIKER CROMO / STIKER KEMASAN A3+',
        'OUTDOOR',
        'lbr',
        '10000',
        '5000',
        '500',
        '50',
        'Stiker kromo kemasan produk & botol',
        '',
      ],
      [
        'PRD-003',
        'Jersey Futsal Printing Custom (Full Print)',
        'INDOOR',
        'pcs',
        '85000',
        '50000',
        '100',
        '20',
        'Bahan 100% polyester drifit sublimasi tajam',
        'S:80000;M:85000;L:90000;XL:95000',
      ],
      [
        'PRD-004',
        'Jaket Windbreaker Racing Waterproof',
        'INDOOR',
        'pcs',
        '150000',
        '95000',
        '60',
        '10',
        'Jaket taslan waterproof tahan angin & hujan',
        'S:145000;M:150000;L:155000;XL:165000',
      ],
    ];

    // Build CSV with UTF-8 BOM so Excel opens with proper Indonesian characters
    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((row) =>
          row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Format_Master_Produk_CetakPro.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playSuccess();
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Berkas kosong');

        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length <= 1) {
          throw new Error('Berkas tidak memuat baris data.');
        }

        // Header check
        const rows = lines.slice(1);
        const parsedItems: Omit<MaterialItem, 'id'>[] = [];

        rows.forEach((rowStr) => {
          // Simple CSV splitter respecting quotes
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches: string[] = [];
          let match;
          while ((match = regex.exec(rowStr)) !== null) {
            let val = match[1] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/""/g, '"');
            }
            matches.push(val.trim());
            if (regex.lastIndex >= rowStr.length) break;
          }

          if (matches.length >= 2) {
            const rawName = matches[1] || matches[0];
            if (!rawName) return;

            const rawCat = matches[2] || 'INDOOR';
            const rawUnit = matches[3] || 'pcs';
            const rawSell = parseFloat(matches[4]?.replace(/[^0-9.]/g, '')) || 20000;
            const rawCost = parseFloat(matches[5]?.replace(/[^0-9.]/g, '')) || Math.round(rawSell * 0.6);
            const rawStock = parseFloat(matches[6]?.replace(/[^0-9.]/g, '')) || 100;
            const rawMin = parseFloat(matches[7]?.replace(/[^0-9.]/g, '')) || 20;
            const rawDesc = matches[8] || '';
            const rawVariants = matches[9] || '';

            let hasVars = false;
            let sizeVars: ProductSizeVariant[] | undefined = undefined;

            if (rawVariants && rawVariants.includes(':')) {
              // Parse S:80000;M:85000
              const tokens = rawVariants.split(';').filter((t) => t.includes(':'));
              if (tokens.length > 0) {
                hasVars = true;
                sizeVars = tokens.map((t, idx) => {
                  const [sName, sPriceStr] = t.split(':');
                  const sPrice = parseFloat(sPriceStr?.replace(/[^0-9.]/g, '')) || rawSell;
                  return {
                    id: `var-${idx}-${Date.now()}`,
                    size: sName.trim().toUpperCase(),
                    sellingPrice: sPrice,
                    costPrice: Math.round(sPrice * 0.6),
                    stock: Math.round(rawStock / tokens.length),
                  };
                });
              }
            }

            parsedItems.push({
              name: rawName,
              category: normalizeCategory(rawCat) as any,
              unit: rawUnit,
              sellingPrice: rawSell,
              costPrice: rawCost,
              stock: rawStock,
              minStock: rawMin,
              description: rawDesc || undefined,
              hasVariants: hasVars,
              variantTitle: hasVars ? 'Ukuran' : undefined,
              sizeVariants: sizeVars,
            });
          }
        });

        if (parsedItems.length === 0) {
          throw new Error('Format kolom tidak cocok. Gunakan tombol Download Format Excel.');
        }

        setUploadPreview(parsedItems);
        sounds.playClick();
      } catch (err: any) {
        setUploadError(err.message || 'Gagal membaca berkas CSV / Excel.');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (uploadPreview.length === 0) return;
    bulkAddMaterials(uploadPreview);
    setUploadPreview([]);
    setShowUploadModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#1e40af]" />
          <span className="font-bold text-sm text-[#0f172a]">Master Bahan, Produk Cetak & Stok</span>
          <span className="text-[11px] text-[#64748b]">({materials.length} Item)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Kategori */}
          <div className="flex items-center bg-white border border-[#94a3b8] rounded-sm p-0.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-0.5 rounded-xs text-[11px] font-bold transition-colors cursor-pointer ${
                categoryFilter === 'all' ? 'bg-[#1e40af] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({materials.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.name)}
                className={`px-2.5 py-0.5 rounded-xs text-[11px] font-bold transition-colors cursor-pointer ${
                  categoryFilter === c.name ? 'bg-[#1e40af] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari produk / stok..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs text-[#0f172a]"
            />
          </div>

          {/* Upload Massal Button */}
          <button
            type="button"
            onClick={() => {
              setUploadPreview([]);
              setUploadError('');
              setShowUploadModal(true);
            }}
            className="px-3 py-1 bg-white hover:bg-[#e2e8f0] text-[#0f172a] border border-[#94a3b8] rounded-sm font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            title="Import produk sekaligus dari berkas Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5 text-[#1e40af]" />
            <span>Upload Massal</span>
          </button>

          {/* Tambah Produk Baru */}
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-medium rounded-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 2. Floating Action Bar when Items Selected for Bulk Edit */}
      {selectedIds.length > 0 && (
        <div className="bg-[#1e293b] text-white px-4 py-2 flex items-center justify-between border-b border-slate-700 animate-in slide-in-from-top-1 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs bg-blue-600 px-2 py-0.5 rounded text-white font-mono">
              {selectedIds.length} Produk Dipilih
            </span>
            <span className="text-[11px] text-slate-300">
              {unitValidation.isValid ? (
                <span className="text-emerald-400 font-semibold">
                  ✓ {unitValidation.message}
                </span>
              ) : (
                <span className="text-rose-400 font-bold">
                  ⚠️ {unitValidation.message}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!unitValidation.isValid) {
                  alert(unitValidation.message);
                  return;
                }
                setBulkSellingPriceMode('none');
                setBulkSellingPriceVal('');
                setBulkCostPriceMode('none');
                setBulkCostPriceVal('');
                setBulkStockMode('none');
                setBulkStockVal('');
                setBulkMinStockVal('');
                setShowBulkEditModal(true);
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>⚡ Edit Massal ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs cursor-pointer"
            >
              Batal Pilihan
            </button>
          </div>
        </div>
      )}

      {/* 3. Table Data */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] p-1.5 text-center w-8">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[#1e40af] hover:text-[#1d4ed8]"
                  title={selectedIds.length === filtered.length ? 'Batalkan semua' : 'Pilih semua'}
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="w-4 h-4 mx-auto" />
                  ) : (
                    <Square className="w-4 h-4 mx-auto text-[#94a3b8]" />
                  )}
                </button>
              </th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-16">Kode</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Bahan / Produk</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-32">Kategori</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Satuan</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-24">HPP (Modal)</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-36 text-[#1e40af]">Harga Jual</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-28">Stok Tersedia</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filtered.map((m, idx) => {
              const isSelected = selectedIds.includes(m.id);
              const isLowStock = m.stock <= (m.minStock || 10);
              const isMeter = isMeterUnit(m.unit);

              // Calculate price range if product has variants
              let priceDisplay = formatRupiah(m.sellingPrice);
              if (m.hasVariants && m.sizeVariants && m.sizeVariants.length > 0) {
                const prices = m.sizeVariants.map((v) => v.sellingPrice);
                const minP = Math.min(...prices);
                const maxP = Math.max(...prices);
                priceDisplay = minP === maxP ? formatRupiah(minP) : `${formatRupiah(minP)} - ${formatRupiah(maxP)}`;
              }

              return (
                <tr
                  key={m.id}
                  className={`hover:bg-[#f8fafc] transition-colors ${
                    isSelected ? 'bg-blue-50/70' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="border border-[#cbd5e1] p-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectOne(m.id)}
                      className="text-[#1e40af] hover:text-[#1d4ed8]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 mx-auto text-[#1e40af]" />
                      ) : (
                        <Square className="w-4 h-4 mx-auto text-[#94a3b8]" />
                      )}
                    </button>
                  </td>

                  {/* Kode */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 font-mono text-[#64748b]">
                    {`00${idx + 10}`.slice(-4)}
                  </td>

                  {/* Nama Produk & Variasi Badge */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#0f172a]">
                    <div className="flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {m.hasVariants && m.sizeVariants && m.sizeVariants.length > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200"
                          title={`Variasi: ${m.sizeVariants.map((v) => v.size).join(', ')}`}
                        >
                          {m.sizeVariants.length} Variasi ({m.sizeVariants.map((v) => v.size).join(', ')})
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <span className="text-[10px] text-[#64748b] block font-normal truncate max-w-md">
                        {m.description}
                      </span>
                    )}
                  </td>

                  {/* Kategori */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        normalizeCategory(m.category) === 'OUTDOOR'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {normalizeCategory(m.category)}
                    </span>
                  </td>

                  {/* Satuan */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-mono font-bold text-[#475569]">
                    {m.unit}
                  </td>

                  {/* HPP Modal */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono text-[#64748b]">
                    {formatRupiah(m.costPrice)}
                  </td>

                  {/* Harga Jual */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-[#1e40af]">
                    {priceDisplay}
                  </td>

                  {/* Stok */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-mono">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isLowStock
                          ? 'bg-rose-50 text-rose-700 border border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {isLowStock && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                      <span>
                        {m.stock} {isMeter ? 'm²' : m.unit}
                      </span>
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8]"
                        title="Edit Produk, Harga & Variasi Ukuran"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus produk "${m.name}"?`)) {
                            deleteMaterial(m.id);
                          }
                        }}
                        className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5]"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL TAMBAH / EDIT PRODUK (DENGAN VARIASI SHOPEE) ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  {editing ? 'Edit Bahan / Produk Cetak & Variasi' : 'Tambah Bahan / Produk Cetak Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {/* Nama */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Nama Bahan / Produk *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Jersey Futsal Printing / Banner Flexi 280gr"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              {/* Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Kategori Produk *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value === 'OUTDOOR') {
                        setUnit('m²');
                      } else {
                        setUnit('pcs');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-bold text-[#1e40af] focus:outline-none focus:border-[#1e40af]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Satuan Hitung Dasar</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#94a3b8] rounded text-xs font-semibold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="pcs">Pcs (Satuan / Baju / Jaket)</option>
                    <option value="setel">Setel (Baju + Celana)</option>
                    <option value="m²">m² (Meter Persegi - Banner)</option>
                    <option value="meter">Meter Lari (DTF)</option>
                    <option value="lbr">Lembar (Stiker A3+)</option>
                    <option value="box">Box (Kartu Nama)</option>
                  </select>
                </div>
              </div>

              {/* HPP Modal & Harga Jual Dasar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    HPP Modal Dasar (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={costPriceStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCostPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10000"
                    className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  />
                  <span className="text-[10px] text-[#64748b] mt-0.5 block">
                    {formatRupiah(parseFloat(costPriceStr) || 0)} / {unit}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1e40af] mb-1">
                    Harga Jual Dasar (Rp) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={sellingPriceStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSellingPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="20000"
                    className="w-full px-2.5 py-1.5 border-2 border-[#1e40af] rounded text-xs font-mono font-bold text-[#1e40af] select-text cursor-text focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-[#1e40af] font-semibold mt-0.5 block">
                    {formatRupiah(parseFloat(sellingPriceStr) || 0)} / {unit}
                  </span>
                </div>
              </div>

              {/* Pengelolaan Stok Dasar */}
              <div className="grid grid-cols-2 gap-3 bg-[#f8fafc] p-2.5 rounded border border-[#e2e8f0]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Stok Tersedia ({unit}):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stockStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setStockStr(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="100"
                    className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono font-bold text-[#0f172a] select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#334155] mb-1">
                    Batas Minimal Alert ({unit}):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minStockStr}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setMinStockStr(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="20"
                    className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono text-[#475569] select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              {/* ================= SHOPEE-STYLE VARIATION SECTION ================= */}
              <div className="border border-[#bfdbfe] rounded bg-[#eff6ff]/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#1e40af]" />
                    <span className="font-bold text-xs text-[#1e40af]">
                      Variasi Produk (Gaya Shopee)
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => {
                        setHasVariants(e.target.checked);
                        if (e.target.checked && sizeVariants.length === 0) {
                          // Default apparel preset
                          ['S', 'M', 'L', 'XL'].forEach((s) => handleAddPresetSize(s));
                        }
                      }}
                      className="w-4 h-4 rounded text-[#1e40af] cursor-pointer"
                    />
                    <span className="font-bold text-[11px] text-[#0f172a]">
                      {hasVariants ? '✓ Variasi Aktif' : 'Aktifkan Variasi Produk'}
                    </span>
                  </label>
                </div>

                {hasVariants && (
                  <div className="space-y-3 pt-2 border-t border-[#bfdbfe]">
                    {/* Nama Tipe Variasi & Tombol Cepat */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-[#334155]">
                          Nama Tipe Variasi:
                        </label>
                        <input
                          type="text"
                          value={variantTitle}
                          onChange={(e) => setVariantTitle(e.target.value)}
                          placeholder="Ukuran / Model / Warna"
                          className="px-2 py-0.5 bg-white border border-[#94a3b8] rounded text-xs font-bold w-32 focus:outline-none focus:border-[#1e40af]"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-[#64748b] font-medium">Tambah Cepat:</span>
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleAddPresetSize(sz)}
                            className="px-2 py-0.5 bg-white hover:bg-[#dbeafe] text-[#1e40af] font-bold border border-[#93c5fd] rounded text-[10px] shadow-2xs cursor-pointer"
                          >
                            + {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tambah Opsi Kustom */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomOption();
                          }
                        }}
                        placeholder="Ketik nama opsi kustom (contoh: 3XL, 3x1m, Merah)..."
                        className="flex-1 px-2.5 py-1 bg-white border border-[#94a3b8] rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomOption}
                        className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-xs cursor-pointer"
                      >
                        + Tambah Opsi
                      </button>
                    </div>

                    {/* Quick Fill "Terapkan ke Semua Variasi" ala Shopee */}
                    {sizeVariants.length > 0 && (
                      <div className="bg-white p-2 rounded border border-[#93c5fd] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-[#1e40af]">⚡ Terapkan Serentak:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={quickVariantPrice}
                            onChange={(e) => setQuickVariantPrice(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Harga Jual..."
                            className="w-24 px-2 py-0.5 border border-[#cbd5e1] rounded font-mono text-xs"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={quickVariantCost}
                            onChange={(e) => setQuickVariantCost(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="HPP Modal..."
                            className="w-24 px-2 py-0.5 border border-[#cbd5e1] rounded font-mono text-xs"
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={quickVariantStock}
                            onChange={(e) => setQuickVariantStock(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Stok..."
                            className="w-16 px-2 py-0.5 border border-[#cbd5e1] rounded font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleApplyToAllVariants}
                            className="px-2.5 py-1 bg-[#1e40af] text-white rounded font-bold text-[10px] hover:bg-[#1d4ed8] cursor-pointer"
                          >
                            Terapkan ke Semua
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Table of Variants */}
                    {sizeVariants.length > 0 ? (
                      <div className="overflow-x-auto border border-[#cbd5e1] rounded bg-white">
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-[#f8fafc] text-[#475569] border-b border-[#cbd5e1]">
                              <th className="p-1.5 text-left font-bold w-24">{variantTitle || 'Opsi'}</th>
                              <th className="p-1.5 text-right font-bold w-28 text-[#1e40af]">Harga Jual (Rp) *</th>
                              <th className="p-1.5 text-right font-bold w-28 text-[#475569]">HPP Modal (Rp)</th>
                              <th className="p-1.5 text-center font-bold w-20">Stok</th>
                              <th className="p-1.5 text-center w-12">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e2e8f0]">
                            {sizeVariants.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-50">
                                <td className="p-1">
                                  <input
                                    type="text"
                                    value={v.size}
                                    onChange={(e) => handleUpdateVariant(v.id, 'size', e.target.value)}
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded font-bold text-[#0f172a]"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={v.sellingPrice}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const n = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                      handleUpdateVariant(v.id, 'sellingPrice', n);
                                    }}
                                    className="w-full px-1.5 py-0.5 border border-[#93c5fd] rounded font-mono font-bold text-right text-[#1e40af]"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={v.costPrice}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const n = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                      handleUpdateVariant(v.id, 'costPrice', n);
                                    }}
                                    className="w-full px-1.5 py-0.5 border border-[#cbd5e1] rounded font-mono text-right text-[#64748b]"
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={v.stock}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const n = parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                      handleUpdateVariant(v.id, 'stock', n);
                                    }}
                                    className="w-full px-1 py-0.5 border border-[#cbd5e1] rounded font-mono text-center"
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(v.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                    title="Hapus Opsi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-slate-400 bg-white rounded border border-dashed border-slate-300 text-[11px]">
                        Belum ada opsi variasi. Klik tombol cepat <b>[+ S] [+ M] [+ L] [+ XL]</b> di atas.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Deskripsi / Catatan Produk
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan bahan, spesifikasi cetak, dll..."
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Modal Footer */}
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
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Produk & Variasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT MASSAL (BULK EDIT) ================= */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-lg p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Edit Massal {selectedProducts.length} Produk Terpilih
                </h3>
              </div>
              <button onClick={() => setShowBulkEditModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Banner */}
            {!unitValidation.isValid ? (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Validasi Gagal: Tipe Satuan Harus Sejenis!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {unitValidation.message}
                </p>
                <p className="text-[10px] text-rose-700 italic">
                  *Tips: Batalkan centang pada produk spanduk meteran jika ingin mengedit produk pakaian satuan, atau sebaliknya.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded text-[11px] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>
                  Validasi Tipe Satuan: <b>{unitValidation.message}</b>
                </span>
              </div>
            )}

            {/* Form Fields: Only Harga & Stok */}
            <div className="space-y-3 text-xs">
              {/* 1. Ubah Harga Jual */}
              <div className="border border-[#cbd5e1] rounded p-2.5 bg-slate-50 space-y-1.5">
                <label className="block font-bold text-[#1e40af]">1. Ubah Harga Jual:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bulkSellingPriceMode}
                    onChange={(e) => setBulkSellingPriceMode(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs"
                  >
                    <option value="none">-- Jangan Ubah Harga Jual --</option>
                    <option value="set">Tetapkan Nominal Baru (Rp)</option>
                    <option value="inc_nom">Naikkan Sebesar (Rp)</option>
                    <option value="dec_nom">Turunkan Sebesar (Rp)</option>
                    <option value="inc_pct">Naikkan Sebesar (%)</option>
                    <option value="dec_pct">Turunkan Sebesar (%)</option>
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={bulkSellingPriceMode === 'none'}
                    value={bulkSellingPriceVal}
                    onChange={(e) => setBulkSellingPriceVal(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder={
                      bulkSellingPriceMode.includes('pct') ? 'Contoh: 10 (%)' : 'Contoh: 85000 (Rp)'
                    }
                    className="px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono font-bold disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* 2. Ubah HPP (Harga Modal) */}
              <div className="border border-[#cbd5e1] rounded p-2.5 bg-slate-50 space-y-1.5">
                <label className="block font-bold text-[#475569]">2. Ubah HPP (Harga Modal):</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={bulkCostPriceMode}
                    onChange={(e) => setBulkCostPriceMode(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs"
                  >
                    <option value="none">-- Jangan Ubah HPP Modal --</option>
                    <option value="set">Tetapkan Nominal Baru (Rp)</option>
                    <option value="inc_nom">Naikkan Sebesar (Rp)</option>
                    <option value="dec_nom">Turunkan Sebesar (Rp)</option>
                    <option value="inc_pct">Naikkan Sebesar (%)</option>
                    <option value="dec_pct">Turunkan Sebesar (%)</option>
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={bulkCostPriceMode === 'none'}
                    value={bulkCostPriceVal}
                    onChange={(e) => setBulkCostPriceVal(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder={
                      bulkCostPriceMode.includes('pct') ? 'Contoh: 5 (%)' : 'Contoh: 50000 (Rp)'
                    }
                    className="px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* 3. Ubah Stok */}
              <div className="border border-[#cbd5e1] rounded p-2.5 bg-slate-50 space-y-1.5">
                <label className="block font-bold text-[#334155]">3. Ubah Stok & Min Stok:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#64748b] block mb-0.5">Mode Stok:</label>
                    <select
                      value={bulkStockMode}
                      onChange={(e) => setBulkStockMode(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs"
                    >
                      <option value="none">-- Jangan Ubah Stok --</option>
                      <option value="set">Tetapkan Stok Baru</option>
                      <option value="add">Tambah Stok (+Qty)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#64748b] block mb-0.5">Nilai Stok:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={bulkStockMode === 'none'}
                      value={bulkStockVal}
                      onChange={(e) => setBulkStockVal(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Contoh: 50"
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono font-bold disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="text-[10px] text-[#64748b] block mb-0.5">
                    Batas Minimal Alert Stok (Opsional):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bulkMinStockVal}
                    onChange={(e) => setBulkMinStockVal(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="Kosongkan jika tidak diubah..."
                    className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!unitValidation.isValid}
                onClick={handleSaveBulkEdit}
                className={`px-4 py-1.5 rounded text-xs font-bold shadow-sm transition-colors ${
                  unitValidation.isValid
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Terapkan Perubahan Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL UPLOAD MASSAL & DOWNLOAD EXCEL ================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] px-4 py-2.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#1e40af]" />
                <h3 className="text-xs font-bold text-[#0f172a]">
                  Upload & Import Massal Master Produk (Excel / CSV)
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Step 1: Download Format */}
              <div className="bg-[#eff6ff] border border-[#bfdbfe] p-3 rounded space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-[#1e40af] block">
                      Langkah 1: Unduh Format Excel Resmi
                    </span>
                    <p className="text-[11px] text-[#334155] mt-0.5">
                      Gunakan format ini agar kolom Kode, Nama, Kategori, Satuan, Harga Jual, HPP, Stok, dan Variasi Ukuran terbaca sempurna oleh sistem.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Format Excel (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className="space-y-2">
                <span className="font-bold text-[#334155] block">
                  Langkah 2: Pilih Berkas Excel / CSV yang Sudah Diisi
                </span>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#94a3b8] hover:border-[#1e40af] bg-slate-50 hover:bg-blue-50/50 p-6 rounded-md text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6 mx-auto text-[#1e40af] mb-1.5" />
                  <p className="font-bold text-xs text-[#0f172a]">
                    Klik di sini untuk memilih berkas (.csv)
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">
                    Mendukung berkas ekspor dari Excel atau spreadsheet lain.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3 py-1.5 rounded text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {uploadPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-800">
                      ✓ Pratinjau: {uploadPreview.length} Produk Siap Diimpor
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      Periksa data di bawah sebelum konfirmasi
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-[#cbd5e1] rounded">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#f1f5f9] text-[#475569] border-b border-[#cbd5e1]">
                          <th className="p-1.5 text-left font-bold">Nama Produk</th>
                          <th className="p-1.5 text-center font-bold">Kategori</th>
                          <th className="p-1.5 text-center font-bold">Satuan</th>
                          <th className="p-1.5 text-right font-bold">Harga Jual</th>
                          <th className="p-1.5 text-center font-bold">Stok</th>
                          <th className="p-1.5 text-left font-bold">Variasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {uploadPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-1.5 font-semibold text-[#0f172a]">{item.name}</td>
                            <td className="p-1.5 text-center font-bold uppercase">{item.category}</td>
                            <td className="p-1.5 text-center font-mono">{item.unit}</td>
                            <td className="p-1.5 text-right font-mono font-bold text-[#1e40af]">
                              {formatRupiah(item.sellingPrice)}
                            </td>
                            <td className="p-1.5 text-center font-mono">{item.stock}</td>
                            <td className="p-1.5 text-[#64748b]">
                              {item.hasVariants && item.sizeVariants
                                ? item.sizeVariants.map((v) => v.size).join(', ')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f1f5f9] border-t border-[#cbd5e1] p-3 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={uploadPreview.length === 0}
                onClick={handleConfirmImport}
                className={`px-4 py-1.5 rounded text-xs font-bold shadow-xs transition-colors ${
                  uploadPreview.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Konfirmasi & Masukkan ke Master Produk ({uploadPreview.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
