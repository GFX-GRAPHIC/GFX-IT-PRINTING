import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Scissors,
  Printer,
  X,
  Check,
} from 'lucide-react';
import { FinishingItem, MaterialItem, ProductCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';

export const MasterDataPricing: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial, finishings, addFinishing, updateFinishing, deleteFinishing } = useApp();

  const [activeTab, setActiveTab] = useState<'materials' | 'finishings'>('materials');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // Material Form state
  const [matName, setMatName] = useState('');
  const [matCategory, setMatCategory] = useState<ProductCategory>('large_format');
  const [matUnit, setMatUnit] = useState('m²');
  const [matCost, setMatCost] = useState<number>(0);
  const [matSell, setMatSell] = useState<number>(0);
  const [matStock, setMatStock] = useState<number>(100);
  const [matDesc, setMatDesc] = useState('');

  const handleOpenAddMaterial = () => {
    setEditingMaterial(null);
    setMatName('');
    setMatCategory('large_format');
    setMatUnit('m²');
    setMatCost(10000);
    setMatSell(20000);
    setMatStock(100);
    setMatDesc('');
    setShowMaterialModal(true);
  };

  const handleOpenEditMaterial = (m: MaterialItem) => {
    setEditingMaterial(m);
    setMatName(m.name);
    setMatCategory(m.category);
    setMatUnit(m.unit);
    setMatCost(m.costPrice);
    setMatSell(m.sellingPrice);
    setMatStock(m.stock);
    setMatDesc(m.description || '');
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName) return;

    if (editingMaterial) {
      updateMaterial({
        ...editingMaterial,
        name: matName,
        category: matCategory,
        unit: matUnit,
        costPrice: matCost,
        sellingPrice: matSell,
        stock: matStock,
        description: matDesc,
      });
    } else {
      addMaterial({
        name: matName,
        category: matCategory,
        unit: matUnit,
        costPrice: matCost,
        sellingPrice: matSell,
        stock: matStock,
        minStock: 20,
        description: matDesc,
      });
    }
    setShowMaterialModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'materials'
                ? 'bg-brand-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Master Bahan & Tarif Media ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('finishings')}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'finishings'
                ? 'bg-brand-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Master Tarif Finishing ({finishings.length})</span>
          </button>
        </div>

        {activeTab === 'materials' && (
          <button
            onClick={handleOpenAddMaterial}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Bahan Baru</span>
          </button>
        )}
      </div>

      {/* Materials Table */}
      {activeTab === 'materials' ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama Bahan / Media</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3 text-right">HPP (Modal)</th>
                  <th className="p-3 text-right text-brand-400">Harga Jual</th>
                  <th className="p-3 text-right">Margin Laba</th>
                  <th className="p-3 text-center">Stok</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {materials.map((m) => {
                  const margin = m.sellingPrice - m.costPrice;
                  const marginPct = m.sellingPrice > 0 ? Math.round((margin / m.sellingPrice) * 100) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-100">{m.name}</div>
                        {m.description && <div className="text-[10px] text-slate-500">{m.description}</div>}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 font-mono capitalize">
                          {m.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{m.unit}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{formatRupiah(m.costPrice)}</td>
                      <td className="p-3 text-right font-mono font-bold text-brand-300 text-sm">
                        {formatRupiah(m.sellingPrice)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 text-[11px]">
                        +{formatRupiah(margin)} ({marginPct}%)
                      </td>
                      <td className="p-3 text-center font-mono text-slate-200">
                        {m.stock} {m.unit}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditMaterial(m)}
                            className="p-1 text-slate-400 hover:text-brand-400 transition-colors"
                            title="Edit Bahan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMaterial(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Finishings Table */
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama Opsi Finishing</th>
                  <th className="p-3">Kategori Produk</th>
                  <th className="p-3">Tipe Biaya</th>
                  <th className="p-3 text-right text-amber-400">Tarif Tambahan</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {finishings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3 font-bold text-slate-100">{f.name}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-850 text-slate-300 font-mono capitalize">
                        {f.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 capitalize">{f.unit.replace('_', ' ')}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-300 text-sm">
                      {f.price > 0 ? formatRupiah(f.price) : 'GRATIS'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{f.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingMaterial ? 'Edit Data Bahan' : 'Tambah Bahan Cetak Baru'}
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Bahan / Media *</label>
                <input
                  type="text"
                  placeholder="Contoh: Stiker Hologram Custom A3+"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Kategori</label>
                  <select
                    value={matCategory}
                    onChange={(e) => setMatCategory(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="large_format">Large Format (Outdoor/Indoor)</option>
                    <option value="digital_a3">Digital Print A3+</option>
                    <option value="merchandise">Merchandise & Sablon</option>
                    <option value="offset_doc">Offset & Dokumen</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Satuan Hitung</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="m²">Meter Persegi (m²)</option>
                    <option value="lembar">Lembar</option>
                    <option value="pcs">Pcs / Buah</option>
                    <option value="buku">Buku</option>
                    <option value="rim">Rim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">HPP / Modal (Rp)</label>
                  <input
                    type="number"
                    value={matCost}
                    onChange={(e) => setMatCost(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-brand-400 block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    value={matSell}
                    onChange={(e) => setMatSell(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono font-bold bg-slate-950 border border-brand-500/40 rounded-lg px-3 py-2 text-brand-300 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Keterangan Singkat</label>
                <input
                  type="text"
                  placeholder="Karakter bahan, rekomendasi penggunaan..."
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
