import React, { useState } from 'react';
import {
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  Key,
  Phone,
  UserCheck,
  X,
  Check,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadge } from '../../utils/formatters';

export const UserManager: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [phone, setPhone] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPin('1234');
    setRole('admin');
    setPhone('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPin(user.pin);
    setRole(user.role);
    setPhone(user.phone || '');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    if (editingUser) {
      updateUser({
        ...editingUser,
        name,
        username,
        pin,
        role,
        phone,
      });
    } else {
      addUser({
        name,
        username,
        pin,
        role,
        phone,
        active: true,
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Manajemen Akun Staf & Hak Akses Role
          </h3>
          <p className="text-[11px] text-slate-400">
            Atur staf kasir, desainer grafis, operator produksi, dan owner
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Staf Baru</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map((user) => {
          const roleBadge = getRoleBadge(user.role);
          const isMe = user.id === currentUser.id;

          return (
            <div
              key={user.id}
              className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3 ${
                isMe ? 'border-brand-500/50 shadow-brand-500/10' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-200 text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge.bg} ${roleBadge.text}`}>
                    {roleBadge.label}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {isMe && (
                      <span className="text-[9px] font-bold px-1 rounded bg-brand-500/20 text-brand-300">
                        (Anda)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">@{user.username}</p>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-500" />
                      <span>PIN Akses:</span>
                    </span>
                    <span className="font-mono text-slate-200 font-bold">{user.pin}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>No. HP:</span>
                      </span>
                      <span className="font-mono text-slate-300">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-brand-400 transition-colors"
                  title="Edit Staf"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {users.length > 1 && !isMe && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus Akun"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {editingUser ? 'Edit Data Pengguna' : 'Tambah Staf Pengguna Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Dimas (Designer)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Username Login *</label>
                <input
                  type="text"
                  placeholder="dimas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Peran / Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="owner">Owner (Semua Akses)</option>
                    <option value="admin">Admin / Kasir</option>
                    <option value="designer">Designer Grafis</option>
                    <option value="operator">Operator Produksi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">PIN Akses (4 Digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-center bg-slate-950 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
