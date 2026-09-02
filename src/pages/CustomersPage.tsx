import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Building,
  MapPin,
  DollarSign,
  ShoppingBag,
  MessageSquare,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';
import { formatDate, formatRupiah, generateWhatsAppUrl } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, storeSettings } = useApp();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<Customer['type']>('regular');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setAddress('');
    setType('regular');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setCompany(c.company || '');
    setAddress(c.address || '');
    setType(c.type);
    setShowAddModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Nama dan No. Telepon/WA wajib diisi!');
      return;
    }

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name,
        phone,
        email,
        company,
        address,
        type,
      });
    } else {
      addCustomer({
        name,
        phone,
        email,
        company,
        address,
        type,
      });
    }

    setShowAddModal(false);
  };

  const handleChatCustomer = (cust: Customer) => {
    const msg = `Halo Kak ${cust.name}, salam dari ${storeSettings.storeName}! 🙏 Ada yang bisa kami bantu untuk kebutuhan cetak Anda?`;
    window.open(generateWhatsAppUrl(cust.phone, msg), '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Buku Data Pelanggan & CRM Percetakan</h2>
          <p className="text-xs text-slate-400">Kelola riwayat belanja pelanggan, kontak WhatsApp, dan level member</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Pelanggan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor WhatsApp, atau perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <span>Belum ada data pelanggan yang cocok.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Nama Pelanggan</th>
                  <th className="p-3">Perusahaan / Toko</th>
                  <th className="p-3">Kontak WhatsApp</th>
                  <th className="p-3">Tipe Member</th>
                  <th className="p-3 text-center">Total Order</th>
                  <th className="p-3 text-right">Total Transaksi</th>
                  <th className="p-3 text-right text-rose-400">Piutang</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{c.name}</div>
                      {c.address && <div className="text-[10px] text-slate-500">{c.address}</div>}
                    </td>
                    <td className="p-3 text-slate-300">{c.company || '-'}</td>
                    <td className="p-3 font-mono text-slate-300">{c.phone}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          c.type === 'corporate'
                            ? 'bg-purple-500/20 text-purple-300'
                            : c.type === 'reseller'
                            ? 'bg-brand-500/20 text-brand-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-200">
                      {c.totalOrders}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(c.totalSpent)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">
                      {c.unpaidBalance > 0 ? formatRupiah(c.unpaidBalance) : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleChatCustomer(c)}
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 transition-colors"
                          title="Chat WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Edit Pelanggan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {customers.length > 1 && (
                          <button
                            onClick={() => deleteCustomer(c.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Rendy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    No. WhatsApp / HP *
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Tipe Member</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="reseller">Reseller (Khusus)</option>
                    <option value="corporate">Corporate / Instansi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Perusahaan / Usaha
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Kopi Senja / PT Maju"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  placeholder="Alamat pengiriman / workshop pelanggan..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
