import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  X,
  Key,
  Check,
  UserCheck,
  Search,
  Lock,
  Eye,
  EyeOff,
  Database,
  RefreshCw,
  Activity,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiGetUsers, apiCreateUser, apiUpdateUser, apiDeleteUser } from '../services/api';
import {
  sanitizeText,
  sanitizeUsername,
  sanitizePin,
  sanitizePhone,
  logAuditAction,
  getAuditLogs,
  AuditLogEntry,
} from '../utils/security';
import { formatDateTime } from '../utils/formatters';

export const ManajemenUserPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'security_logs'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  // UI state
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [formPinVisible, setFormPinVisible] = useState(false);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch from MySQL if online
  const refreshUsersFromDb = async () => {
    setLoading(true);
    const dbUsers = await apiGetUsers();
    if (dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
      // Sync into state
      dbUsers.forEach((u) => {
        const existing = users.find((x) => x.id === u.id || x.username === u.username);
        if (existing) {
          updateUser({
            id: u.id,
            username: u.username,
            pin: u.pin,
            name: u.name,
            role: u.role,
            phone: u.phone,
            active: Boolean(u.active),
          });
        } else {
          addUser({
            username: u.username,
            pin: u.pin,
            name: u.name,
            role: u.role,
            phone: u.phone,
            active: Boolean(u.active),
          });
        }
      });
      setNotification('Data user berhasil disinkronkan dengan MySQL');
      setTimeout(() => setNotification(''), 3000);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUsersFromDb();
  }, []);

  const togglePinVisibility = (id: string) => {
    setShowPin((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPin('');
    setRole('designer');
    setPhone('');
    setActive(true);
    setFormPinVisible(false);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPin(u.pin);
    setRole(u.role);
    setPhone(u.phone || '');
    setActive(u.active !== undefined ? u.active : true);
    setFormPinVisible(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    const cleanUsername = sanitizeUsername(username);
    const cleanPin = sanitizePin(pin);
    const cleanPhone = sanitizePhone(phone);

    if (!cleanName || !cleanUsername || !cleanPin) {
      alert('Nama, Username, dan PIN wajib diisi!');
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: cleanName,
        username: cleanUsername,
        pin: cleanPin,
        role,
        phone: cleanPhone,
        active,
      };

      // 1. Update in local AuthContext
      updateUser(updated);

      // 2. Persist to MySQL
      await apiUpdateUser(editingUser.id, updated);

      logAuditAction('USER_UPDATED', `Akun "${updated.name}" (@${updated.username}) diperbarui oleh ${currentUser.name}`);
      setNotification(`✓ Akun "${updated.name}" berhasil diperbarui.`);
    } else {
      // Check duplicate username
      if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
        alert(`Username "${cleanUsername}" sudah digunakan! Gunakan username lain.`);
        return;
      }

      const newUser = {
        name: cleanName,
        username: cleanUsername,
        pin: cleanPin,
        password: cleanPin,
        role,
        phone: cleanPhone,
        active: true,
      };

      // 1. Add to local AuthContext
      addUser(newUser);

      // 2. Persist to MySQL
      await apiCreateUser(newUser);

      logAuditAction('USER_CREATED', `User baru "${newUser.name}" (@${newUser.username} - Role: ${newUser.role}) ditambahkan oleh ${currentUser.name}`);
      setNotification(`✓ User baru "${newUser.name}" berhasil ditambahkan.`);
    }

    setAuditLogs(getAuditLogs());
    setShowModal(false);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan untuk login!');
      return;
    }
    if (confirm(`Yakin ingin menghapus user "${u.name}" (@${u.username})?`)) {
      deleteUser(u.id);
      await apiDeleteUser(u.id);
      logAuditAction('USER_DELETED', `Akun "${u.name}" (@${u.username}) dihapus oleh ${currentUser.name}`);
      setAuditLogs(getAuditLogs());
      setNotification(`✓ User "${u.name}" telah dihapus.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1e40af]" />
            <span className="font-bold text-sm text-[#0f172a]">Master User & Hak Akses Staf</span>
          </div>

          {/* Sub-Tabs: Users vs Security Logs */}
          <div className="flex items-center bg-[#e2e8f0] p-0.5 rounded border border-[#cbd5e1]">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              👥 Daftar Pengguna ({users.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('security_logs');
                setAuditLogs(getAuditLogs());
              }}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'security_logs'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Log Keamanan & Audit ({auditLogs.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            {/* Refresh DB Button */}
            <button
              onClick={refreshUsersFromDb}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-[#e2e8f0] text-[#334155] border border-[#94a3b8] rounded-sm text-xs font-medium flex items-center gap-1 shadow-sm transition-colors"
              title="Sinkronkan dengan Database MySQL"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Sinkron MySQL</span>
            </button>

            {/* Add User Button */}
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded-sm flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah User Baru</span>
            </button>
          </div>
        )}

        {activeTab === 'security_logs' && (
          <button
            onClick={() => setAuditLogs(getAuditLogs())}
            className="px-3 py-1 bg-white hover:bg-[#e2e8f0] text-[#334155] border border-[#94a3b8] rounded-sm text-xs font-medium flex items-center gap-1 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Segarkan Log</span>
          </button>
        )}
      </div>

      {activeTab === 'security_logs' ? (
        /* Log Keamanan & Audit Trail */
        <div className="flex-1 overflow-auto p-3 bg-white">
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-[#1e40af] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <b>Proteksi Keamanan Sistem Aktif:</b> Pembatasan brute-force maksimal 5 percobaan, sanitasi input XSS/SQL Injection, dan pencatatan audit log otomatis.
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#64748b]">Total {auditLogs.length} Catatan</span>
          </div>

          <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-40">Waktu Kejadian</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Jenis Aksi</th>
                <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Rincian & Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-[#94a3b8]">
                    Belum ada riwayat aktivitas keamanan tercatat.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
                  if (log.action.includes('SUCCESS')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                  if (log.action.includes('FAILED') || log.action.includes('LOCKED')) badgeColor = 'bg-rose-50 text-rose-700 border-rose-300';
                  if (log.action.includes('CREATED') || log.action.includes('UPDATED')) badgeColor = 'bg-blue-50 text-blue-700 border-blue-300';

                  return (
                    <tr key={log.id} className="hover:bg-[#f8fafc]">
                      <td className="border border-[#cbd5e1] px-3 py-1.5 font-mono text-[#64748b] text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="border border-[#cbd5e1] px-3 py-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="border border-[#cbd5e1] px-3 py-1.5 text-[#334155] font-medium">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tab User Management */
        <>
          {/* 2. Filter & Search Controls */}
          <div className="bg-white border-b border-[#cbd5e1] p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, username, atau no. HP staf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-[#f8fafc] border border-[#94a3b8] rounded-sm text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-[#475569]">Filter Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#f8fafc] border border-[#94a3b8] rounded-sm px-2 py-1 text-xs text-[#0f172a] focus:bg-white focus:outline-none focus:border-[#1e40af]"
              >
                <option value="all">-- Semua Role --</option>
                <option value="owner">👑 Owner</option>
                <option value="admin">💼 Kasir / Admin</option>
                <option value="designer">🎨 Designer Grafis</option>
                <option value="operator">🖨️ Operator Cetak</option>
              </select>
            </div>
          </div>

          {/* Notification Banner */}
          {notification && (
            <div className="bg-[#eff6ff] border-b border-[#bfdbfe] text-[#1e40af] px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#1e40af]" />
              <span>{notification}</span>
            </div>
          )}

          {/* 3. User Table Data Grid */}
          <div className="flex-1 overflow-auto p-2 bg-white">
            <table className="w-full border-collapse border border-[#cbd5e1] text-xs">
              <thead>
                <tr className="bg-[#f1f5f9] text-[#0f172a] text-[11px] font-bold border-b border-[#cbd5e1]">
                  <th className="border border-[#cbd5e1] px-3 py-1.5 text-left">Nama Staf</th>
                  <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Username Login</th>
                  <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-28">PIN Login</th>
                  <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">Role Akses</th>
                  <th className="border border-[#cbd5e1] px-3 py-1.5 text-left w-36">No. WhatsApp</th>
                  <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-24">Status</th>
                  <th className="border border-[#cbd5e1] px-2 py-1.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
            {filteredUsers.map((u) => {
              const isCurrentMe = u.id === currentUser.id;
              const isPinRevealed = showPin[u.id];

              return (
                <tr key={u.id} className="hover:bg-[#f8fafc]">
                  {/* Nama Staf */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#0f172a]">
                    <div className="flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {isCurrentMe && (
                        <span className="text-[10px] bg-blue-50 text-[#1e40af] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                          Anda
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Username */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-mono text-[#475569]">
                    @{u.username}
                  </td>

                  {/* PIN */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center font-mono font-bold text-[#0f172a]">
                    <div className="flex items-center justify-center gap-1">
                      <span>{isPinRevealed ? u.pin : '••••'}</span>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(u.id)}
                        className="text-[#94a3b8] hover:text-[#0f172a] p-0.5"
                        title={isPinRevealed ? 'Sembunyikan PIN' : 'Lihat PIN'}
                      >
                        {isPinRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Role Akses */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        u.role === 'owner'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : u.role === 'admin'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : u.role === 'designer'
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}
                    >
                      {u.role === 'owner'
                        ? '👑 Owner'
                        : u.role === 'admin'
                        ? '💼 Kasir / Admin'
                        : u.role === 'designer'
                        ? '🎨 Designer Grafis'
                        : '🖨️ Operator Cetak'}
                    </span>
                  </td>

                  {/* No. HP */}
                  <td className="border border-[#cbd5e1] px-3 py-1.5 font-mono text-[#475569]">
                    {u.phone || '-'}
                  </td>

                  {/* Status */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        u.active !== false
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-slate-500 bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {u.active !== false ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="border border-[#cbd5e1] px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] rounded border border-[#94a3b8] transition-colors"
                        title="Edit Data User"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {users.length > 1 && !isCurrentMe && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded border border-[#fca5a5] transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}

      {/* 4. Modal: Tambah / Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xl w-full max-w-sm p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
              <h3 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>{editingUser ? 'Edit Data User' : 'Tambah User & Staf Baru'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Nama Lengkap Staf *
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Dimas Wahyu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              {/* Username Login */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: dimas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                  required
                />
              </div>

              {/* Role & PIN in 2 Columns */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    Role Hak Akses
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2 py-1.5 border border-[#94a3b8] rounded text-xs text-[#0f172a] font-semibold focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="owner">👑 Owner</option>
                    <option value="admin">💼 Kasir / Admin</option>
                    <option value="designer">🎨 Designer Grafis</option>
                    <option value="operator">🖨️ Operator Cetak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                    PIN Login (4 Digit) *
                  </label>
                  <div className="relative">
                    <input
                      type={formPinVisible ? 'text' : 'password'}
                      maxLength={6}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono font-bold text-center text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormPinVisible(!formPinVisible)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                    >
                      {formPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* No. WhatsApp */}
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  No. WhatsApp / HP (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono text-[#0f172a] focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Active Toggle */}
              {editingUser && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-[#1e40af]"
                  />
                  <label htmlFor="userActive" className="text-xs text-[#334155] font-medium">
                    Status Akun Aktif
                  </label>
                </div>
              )}

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
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-sm"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
