import React, { useState } from 'react';
import { Printer, Plus, Trash2, Edit2, X, Activity } from 'lucide-react';
import { MachineItem } from '../types';
import { useApp } from '../context/AppContext';

export const MasterMesinPage: React.FC = () => {
  const { machines, updateMachine } = useApp();
  const [localMachines, setLocalMachines] = useState<MachineItem[]>(machines);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState<any>('outdoor');
  const [brand, setBrand] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newMch: MachineItem = {
      id: `MCH-${Date.now().toString().slice(-4)}`,
      name,
      type,
      brand,
      status: 'idle',
    };
    setLocalMachines([...localMachines, newMch]);
    setShowModal(false);
    setName('');
    setBrand('');
  };

  const handleToggleStatus = (m: MachineItem) => {
    const nextStatus: MachineItem['status'] = m.status === 'running' ? 'idle' : m.status === 'idle' ? 'running' : 'idle';
    const updated: MachineItem = { ...m, status: nextStatus };
    updateMachine(updated);
    setLocalMachines(localMachines.map((item) => (item.id === m.id ? updated : item)));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Printer className="w-4 h-4 text-[#1e40af]" />
          <span className="font-bold text-sm text-[#0f172a]">Master Armada Mesin Cetak Workshop</span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-medium rounded-sm flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Mesin</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 bg-white">
        <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Mesin</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Tipe / Kategori</th>
              <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Merek / Brand</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-36">Status Operasi</th>
              <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-28">Ganti Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {localMachines.map((m) => (
              <tr key={m.id} className="hover:bg-[#f8fafc]">
                <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#0f172a]">{m.name}</td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#475569] uppercase text-[10px] font-semibold">
                  {m.type}
                </td>
                <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#475569]">{m.brand}</td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      m.status === 'running'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {m.status === 'running' ? '● Beroperasi' : 'Standby'}
                  </span>
                </td>
                <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                  <button
                    onClick={() => handleToggleStatus(m)}
                    className="px-2 py-0.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8] text-[10px] font-medium"
                  >
                    Ubah Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a]">Tambah Mesin Cetak Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Nama Mesin *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Mimaki UV Flatbed 60x90"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Tipe Mesin</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-2 py-1 border border-[#94a3b8] rounded text-xs"
                >
                  <option value="outdoor">Outdoor 3.2m</option>
                  <option value="indoor">Indoor Eco Solvent</option>
                  <option value="digital_a3">Digital A3+ Laser</option>
                  <option value="dtf">Sablon DTF</option>
                  <option value="uv_flatbed">UV Flatbed</option>
                  <option value="cutting">Cutting Plotter</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Merek / Brand</label>
                <input
                  type="text"
                  placeholder="Contoh: Mimaki / Roland / Epson"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 bg-[#e2e8f0] rounded text-xs"
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
