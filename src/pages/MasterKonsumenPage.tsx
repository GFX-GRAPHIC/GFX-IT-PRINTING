import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, X, Users, MessageSquare } from 'lucide-react';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { formatRupiah, generateWhatsAppUrl } from '../utils/formatters';
import { sanitizeText, sanitizePhone } from '../utils/security';

export const MasterKonsumenPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, storeSettings } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<Customer['type']>('regular');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setCompany('');
    setAddress('');
    setType('regular');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setCompany(c.company || '');
    setAddress(c.address || '');
    setType(c.type);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    const cleanPhone = sanitizePhone(phone);
    const cleanCompany = sanitizeText(company, 100);
    const cleanAddress = sanitizeText(address, 255);

    if (!cleanName || !cleanPhone) return;

    if (editing) {
      updateCustomer({ ...editing, name: cleanName, phone: cleanPhone, company: cleanCompany, address: cleanAddress, type });
    } else {
      addCustomer({ name: cleanName, phone: cleanPhone, company: cleanCompany, address: cleanAddress, type });
    }
    setShowModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1e40af]" />
          <span className="font-bold text-sm text-[#0f172a]">Master Data Konsumen</span>
          <span className="text-[11px] text-[#64748b]">({filtered.length} Konsumen)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari konsumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#94a3b8] rounded-sm text-xs text-[#0f172a]"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-medium rounded-sm flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Konsumen</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-left w-20">Kode</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Konsumen</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Perusahaan / Toko</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-32">No. HP / WA</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Tipe</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-right w-28">Piutang (Rp)</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-[#f8fafc]">
                <td className="border border-[#cbd5e1] px-2 py-1.5 font-mono font-bold text-[#64748b]">
                  {c.phone.slice(-4) || '0000'}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#0f172a]">{c.name}</td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#475569]">{c.company || '-'}</td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 font-mono text-[#0f172a]">{c.phone}</td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center uppercase font-bold text-[10px] text-[#64748b]">
                  {c.type}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-right font-mono font-bold text-rose-700">
                  {c.unpaidBalance > 0 ? formatRupiah(c.unpaidBalance) : '-'}
                </td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8]"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteCustomer(c.id)}
                      className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5]"
                      title="Hapus"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a]">
                {editing ? 'Edit Konsumen' : 'Tambah Konsumen Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Nama Konsumen *</label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">No. WhatsApp / HP *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Perusahaan / Toko</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs select-text cursor-text focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 bg-[#e2e8f0] rounded text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#1e40af] text-white rounded text-xs font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
