import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryItem } from '../types';

export const MasterKategoriPage: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDesc('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: CategoryItem) => {
    setEditingCategory(c);
    setName(c.name);
    setDesc(c.desc || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: name.toUpperCase().trim(),
        desc: desc.trim(),
      });
    } else {
      addCategory({
        name: name.toUpperCase().trim(),
        desc: desc.trim(),
      });
    }
    setShowModal(false);
    setName('');
    setDesc('');
  };

  const handleDelete = (id: string, catName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${catName}"?`)) {
      deleteCategory(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1e40af]" />
          <span className="font-bold text-sm text-[#0f172a]">Master Kategori Produk Percetakan</span>
          <span className="text-[11px] text-[#64748b]">({categories.length} Kategori)</span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-medium rounded-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Kategori</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-48">Nama Kategori</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Deskripsi & Penggunaan</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-[#f8fafc]">
                <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold font-mono text-[#1e40af]">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-extrabold uppercase ${
                      c.name === 'OUTDOOR'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {c.name}
                  </span>
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#475569]">{c.desc}</td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8] cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5] cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-sm p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a]">
                {editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Produk Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748b] hover:text-[#0f172a]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: INDOOR / OUTDOOR"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs uppercase font-bold text-[#1e40af] select-text cursor-text"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Keterangan kategori..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs select-text cursor-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] rounded text-xs font-medium text-[#334155] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
