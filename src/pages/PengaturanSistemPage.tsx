import React, { useState, useRef } from 'react';
import {
  Settings,
  Save,
  Check,
  Database,
  Upload,
  Trash2,
  Eye,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const PRESET_ICONS = [
  { id: 'printer', icon: '🖨️', label: 'Printer' },
  { id: 'palette', icon: '🎨', label: 'Desain' },
  { id: 'ruler', icon: '📐', label: 'Layout' },
  { id: 'scissors', icon: '✂️', label: 'Finishing' },
  { id: 'package', icon: '📦', label: 'Packaging' },
  { id: 'bolt', icon: '⚡', label: 'Kilat' },
  { id: 'factory', icon: '🏢', label: 'Workshop' },
  { id: 'pro', icon: '💎', label: 'Pro Edition' },
  { id: 'doc', icon: '📑', label: 'SPK Cetak' },
  { id: 'tag', icon: '🏷️', label: 'Label Stiker' },
];

export const PengaturanSistemPage: React.FC = () => {
  const { storeSettings, updateStoreSettings, orders, clearAllOrders } = useApp();
  const { isOwner } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleClearOrders = () => {
    clearAllOrders();
    setShowClearConfirm(false);
    setResetMessage('✓ Seluruh data pesanan SPK berhasil dihapus! Jumlah pesanan sekarang kembali menjadi 0.');
    setTimeout(() => setResetMessage(''), 5000);
  };

  const [form, setForm] = useState({
    ...storeSettings,
    storeName: storeSettings.storeName || 'GFX GRAPHIC',
    appName: storeSettings.appName || 'GFX GRAPHIC',
    appSubtitle: storeSettings.appSubtitle || 'Percetakan & Digital Printing',
    appIcon: storeSettings.appIcon || './favicon.ico',
    whatsapp: storeSettings.whatsapp || '085163594245',
    address: storeSettings.address || 'Dusun Ciangir, Kec. Cikoneng Kab. Ciamis Provinsi Jawa Barat Pos 4621',
    bankAccounts: (storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0)
      ? storeSettings.bankAccounts
      : [
          { bankName: 'BCA', accountNumber: '1300551272', accountHolder: 'MUHAMAD YAHYA' },
          { bankName: 'DANA', accountNumber: '085723574540', accountHolder: 'MUHAMAD YAHYA' },
        ],
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rekening Pembayaran Handlers
  const handleAddAccount = (bankName = '', accountNumber = '', accountHolder = 'MUHAMAD YAHYA') => {
    setForm((prev) => ({
      ...prev,
      bankAccounts: [
        ...(prev.bankAccounts || []),
        { bankName, accountNumber, accountHolder },
      ],
    }));
  };

  const handleUpdateAccount = (index: number, field: 'bankName' | 'accountNumber' | 'accountHolder', value: string) => {
    setForm((prev) => {
      const updated = [...(prev.bankAccounts || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, bankAccounts: updated };
    });
  };

  const handleRemoveAccount = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bankAccounts: (prev.bankAccounts || []).filter((_, i) => i !== index),
    }));
  };

  const handleApplyGfxDefaults = () => {
    setForm((prev) => ({
      ...prev,
      storeName: 'GFX GRAPHIC',
      appName: 'GFX GRAPHIC',
      appIcon: prev.appIcon || './favicon.ico',
      address: 'Dusun Ciangir, Kec. Cikoneng Kab. Ciamis Provinsi Jawa Barat Pos 4621',
      whatsapp: '085163594245',
      bankAccounts: [
        { bankName: 'BCA', accountNumber: '1300551272', accountHolder: 'MUHAMAD YAHYA' },
        { bankName: 'DANA', accountNumber: '085723574540', accountHolder: 'MUHAMAD YAHYA' },
      ],
    }));
  };

  // MySQL Settings Form state
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('root');
  const [dbName, setDbName] = useState('cetakpro_pos');

  // Handle Logo Image Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({
        ...prev,
        appIcon: base64,
        logoUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResetIcon = () => {
    setForm((prev) => ({
      ...prev,
      appIcon: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isImageIcon = form.appIcon && (form.appIcon.startsWith('data:image') || form.appIcon.startsWith('http'));
  const isEmojiIcon = form.appIcon && !isImageIcon && form.appIcon.trim() !== '';
  const monogram = (form.appName || 'CP').slice(0, 2).toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-[#0f172a] text-xs font-sans overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#f1f5f9] border-b border-[#cbd5e1] p-3 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#1e40af]" />
          <div>
            <span className="font-bold text-sm text-[#0f172a] block leading-tight">
              Pengaturan Toko & Branding Aplikasi
            </span>
            <span className="text-[10px] text-slate-500">
              Ubah nama aplikasi, icon/logo percetakan, profil nota, dan konfigurasi database MySQL
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded shadow-sm flex items-center gap-1.5 transition-all text-xs"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Tersimpan!' : 'Simpan Semua Pengaturan'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-auto p-4 space-y-5 max-w-4xl">
        {/* ================= SECTION 1: BRANDING & IDENTITAS APLIKASI ================= */}
        <fieldset className="bg-white border border-[#cbd5e1] rounded-lg p-4 space-y-4 shadow-sm">
          <legend className="px-2 text-[11px] font-bold text-[#1e40af] flex items-center gap-1.5 bg-blue-50 py-0.5 rounded border border-blue-200">
            <ImageIcon className="w-3.5 h-3.5 text-[#1e40af]" />
            <span>1. IDENTITAS & BRANDING APLIKASI (NAMA & ICON)</span>
          </legend>

          <p className="text-[11px] text-slate-500">
            Pengaturan ini langsung mengubah judul dan logo aplikasi pada <b>Titlebar Windows</b>, <b>Halaman Login</b>, serta <b>Tab Browser</b>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Nama Aplikasi */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#334155]">
                Nama Aplikasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.appName}
                onChange={(e) => setForm({ ...form, appName: e.target.value })}
                placeholder="Contoh: CetakPro POS / Mitra Advertising"
                className="w-full px-3 py-1.5 border border-[#94a3b8] rounded text-xs font-bold text-[#0f172a] focus:ring-1 focus:ring-[#1e40af] focus:border-[#1e40af] outline-none"
                required
              />
              <span className="text-[10px] text-slate-400">
                Nama yang tampil di pojok kiri atas dan header form login.
              </span>
            </div>

            {/* Input Subtitle Aplikasi */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#334155]">
                Sub-judul / Deskripsi Singkat
              </label>
              <input
                type="text"
                value={form.appSubtitle}
                onChange={(e) => setForm({ ...form, appSubtitle: e.target.value })}
                placeholder="Contoh: Sistem Kasir & SPK Digital Produksi"
                className="w-full px-3 py-1.5 border border-[#94a3b8] rounded text-xs text-[#0f172a] focus:ring-1 focus:ring-[#1e40af] focus:border-[#1e40af] outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Keterangan singkat di bawah nama aplikasi pada layar login.
              </span>
            </div>
          </div>

          {/* Pengaturan Icon / Logo Aplikasi */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <label className="block text-[11px] font-bold text-[#334155]">
              Icon / Logo Aplikasi
            </label>

            <div className="flex flex-wrap items-start gap-4">
              {/* Current Active Icon Display Box */}
              <div className="flex flex-col items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-3 w-28 shrink-0">
                <span className="text-[10px] font-semibold text-slate-500">Icon Saat Ini:</span>
                <div className="w-14 h-14 rounded-lg bg-[#1e40af] flex items-center justify-center text-white shadow-inner overflow-hidden border border-blue-700">
                  {isImageIcon ? (
                    <img
                      src={form.appIcon}
                      alt="Logo"
                      className="w-full h-full object-contain p-1 bg-white"
                    />
                  ) : isEmojiIcon ? (
                    <span className="text-3xl leading-none">{form.appIcon}</span>
                  ) : (
                    <span className="text-xl font-black tracking-wider">{monogram}</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 text-center font-mono">
                  {isImageIcon ? 'Logo Custom' : isEmojiIcon ? 'Icon Preset' : `Inisial: ${monogram}`}
                </span>
              </div>

              {/* Upload File & Preset Options */}
              <div className="flex-1 space-y-3">
                {/* Upload Button */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-600 block">
                    Opsi A: Upload Gambar / Logo Sendiri (PNG, JPG, SVG, WebP)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload-input"
                    />
                    <label
                      htmlFor="logo-upload-input"
                      className="cursor-pointer px-3 py-1.5 bg-white border border-[#94a3b8] hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs text-[#1e293b]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>Pilih File Logo...</span>
                    </label>

                    {form.appIcon && (
                      <button
                        type="button"
                        onClick={handleResetIcon}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded text-xs flex items-center gap-1 transition-colors"
                        title="Hapus logo dan gunakan inisial default"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus / Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preset Icons Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-600 block">
                    Opsi B: Atau Pilih dari Preset Icon Cepat
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForm({ ...form, appIcon: p.icon })}
                        className={`px-2.5 py-1 rounded border text-xs flex items-center gap-1.5 transition-all ${
                          form.appIcon === p.icon
                            ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Simulasi Tampilan Langsung (Live Preview)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Windows Titlebar Mockup */}
                <div className="border border-slate-300 rounded overflow-hidden shadow-xs bg-white">
                  <div className="bg-[#e2e8f0] px-2.5 py-1.5 flex items-center justify-between border-b border-slate-300">
                    <div className="flex items-center gap-1.5">
                      {isImageIcon ? (
                        <img
                          src={form.appIcon}
                          alt="Icon"
                          className="w-3.5 h-3.5 object-contain"
                        />
                      ) : isEmojiIcon ? (
                        <span className="text-xs leading-none">{form.appIcon}</span>
                      ) : (
                        <div className="w-3.5 h-3.5 bg-[#1e40af] rounded-xs flex items-center justify-center text-white text-[8px] font-bold">
                          {monogram}
                        </div>
                      )}
                      <span className="font-bold text-[11px] text-slate-800 truncate max-w-[140px]">
                        {form.appName || 'CetakPro POS'}
                      </span>
                      <span className="text-[9px] text-slate-500 pl-1 border-l border-slate-300">
                        v1.0
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <span>🗕</span>
                      <span>🗖</span>
                      <span>✕</span>
                    </div>
                  </div>
                  <div className="p-2 text-[10px] text-slate-500 bg-slate-50 text-center">
                    Tampilan Menu Bar Windows Desktop
                  </div>
                </div>

                {/* 2. Login Page Header Mockup */}
                <div className="border border-blue-900 rounded overflow-hidden shadow-xs bg-[#1e40af] text-white p-3 text-center">
                  <div className="w-8 h-8 bg-white/10 rounded-md border border-white/20 flex items-center justify-center mx-auto mb-1 overflow-hidden">
                    {isImageIcon ? (
                      <img src={form.appIcon} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : isEmojiIcon ? (
                      <span className="text-base">{form.appIcon}</span>
                    ) : (
                      <span className="text-xs font-bold">{monogram}</span>
                    )}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-tight">
                    {form.appName || 'CetakPro POS'}
                  </div>
                  <div className="text-[9px] text-blue-100">
                    {form.appSubtitle || 'Sistem Kasir & SPK Digital Produksi'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* ================= SECTION 2: PROFIL TOKO & INFORMASI NOTA ================= */}
        <fieldset className="bg-white border border-[#cbd5e1] rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <legend className="px-2 text-[11px] font-bold text-[#334155] flex items-center gap-1.5 bg-slate-100 py-0.5 rounded border border-slate-200">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>2. PROFIL TOKO & INFORMASI NOTA PERCETAKAN</span>
            </legend>

            <button
              type="button"
              onClick={handleApplyGfxDefaults}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-xs font-bold transition-colors cursor-pointer"
              title="Isi otomatis alamat & WhatsApp GFX GRAPHIC Ciamis"
            >
              Gunakan Default GFX GRAPHIC
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Nama Percetakan / Toko</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-bold text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Slogan / Tagline Percetakan</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">No. WhatsApp Toko</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Alamat Workshop</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs text-[#0f172a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Catatan Kaki Struk Kasir / Nota (Footer)
              </label>
              <textarea
                rows={2}
                value={form.footerReceiptNotes}
                onChange={(e) => setForm({ ...form, footerReceiptNotes: e.target.value })}
                className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-[11px] text-[#0f172a]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                Catatan Kaki Lembar Kerja SPK (Footer)
              </label>
              <textarea
                rows={2}
                value={form.footerSpkNotes}
                onChange={(e) => setForm({ ...form, footerSpkNotes: e.target.value })}
                className="w-full px-2.5 py-1 border border-[#94a3b8] rounded text-[11px] text-[#0f172a]"
              />
            </div>
          </div>
        </fieldset>

        {/* ================= SECTION 3: INFORMASI REKENING PEMBAYARAN ================= */}
        <fieldset className="bg-white border border-[#cbd5e1] rounded-lg p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <legend className="px-2 text-[11px] font-bold text-[#1e40af] flex items-center gap-1.5 bg-blue-50 py-0.5 rounded border border-blue-200">
              <span>3. INFORMASI REKENING PEMBAYARAN (BANK / DANA / QRIS)</span>
            </legend>

            <button
              type="button"
              onClick={() => handleAddAccount('', '', 'MUHAMAD YAHYA')}
              className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Tambah Rekening Baru
            </button>
          </div>

          <p className="text-[11px] text-[#64748b]">
            Daftar rekening di bawah ini akan ditampilkan secara otomatis pada <b>Faktur / Nota Online (Invoice)</b> yang dikirimkan ke konsumen via WhatsApp.
          </p>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-[#64748b] font-semibold">Tambah Cepat:</span>
            <button
              type="button"
              onClick={() => handleAddAccount('BCA', '1300551272', 'MUHAMAD YAHYA')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] border border-slate-300 rounded text-[10px] font-medium"
            >
              + BCA
            </button>
            <button
              type="button"
              onClick={() => handleAddAccount('DANA', '085723574540', 'MUHAMAD YAHYA')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] border border-slate-300 rounded text-[10px] font-medium"
            >
              + DANA
            </button>
            <button
              type="button"
              onClick={() => handleAddAccount('Mandiri', '', 'MUHAMAD YAHYA')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] border border-slate-300 rounded text-[10px] font-medium"
            >
              + Mandiri
            </button>
            <button
              type="button"
              onClick={() => handleAddAccount('BRI', '', 'MUHAMAD YAHYA')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] border border-slate-300 rounded text-[10px] font-medium"
            >
              + BRI
            </button>
            <button
              type="button"
              onClick={() => handleAddAccount('QRIS', 'Scan Barcode Toko', 'GFX GRAPHIC')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-[#334155] border border-slate-300 rounded text-[10px] font-medium"
            >
              + QRIS
            </button>
          </div>

          {/* List of Accounts */}
          <div className="space-y-2 pt-2">
            {(!form.bankAccounts || form.bankAccounts.length === 0) ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-slate-500 text-xs">
                Belum ada rekening pembayaran yang ditambahkan. Klik tombol <b>+ Tambah Rekening Baru</b> di atas.
              </div>
            ) : (
              form.bankAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="bg-[#f8fafc] border border-slate-300 rounded p-2.5 flex flex-wrap items-center gap-2"
                >
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Bank / E-Wallet
                    </label>
                    <input
                      type="text"
                      placeholder="BCA / DANA / Mandiri"
                      value={acc.bankName}
                      onChange={(e) => handleUpdateAccount(idx, 'bankName', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-bold text-[#0f172a]"
                    />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Nomor Rekening / No. HP
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 1300551272"
                      value={acc.accountNumber}
                      onChange={(e) => handleUpdateAccount(idx, 'accountNumber', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-mono font-bold text-[#0f172a]"
                    />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10px] font-bold text-[#475569] uppercase mb-0.5">
                      Atas Nama (A.N.)
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Pemilik Rekening"
                      value={acc.accountHolder}
                      onChange={(e) => handleUpdateAccount(idx, 'accountHolder', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#94a3b8] rounded text-xs font-semibold text-[#0f172a]"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-bold transition-colors cursor-pointer"
                      title="Hapus rekening ini"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </fieldset>

        {/* ================= SECTION 4: KONFIGURASI SERVER MYSQL ================= */}
        <fieldset className="bg-white border border-[#cbd5e1] rounded-lg p-4 space-y-3 shadow-sm">
          <legend className="px-2 text-[11px] font-bold text-[#475569] flex items-center gap-1 bg-slate-100 py-0.5 rounded border border-slate-200">
            <Database className="w-3 h-3 text-[#1e40af]" />
            <span>4. KONFIGURASI SERVER DATABASE MYSQL</span>
          </legend>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Host MySQL</label>
              <input
                type="text"
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Port MySQL</label>
              <input
                type="text"
                value={dbPort}
                onChange={(e) => setDbPort(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Nama Database</label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Username DB</label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#94a3b8] rounded text-xs font-mono"
              />
            </div>
          </div>
        </fieldset>

        {/* ================= SECTION 5: MANAJEMEN DATA & BERSIHKAN TRANSAKSI (KHUSUS OWNER) ================= */}
        {isOwner && (
          <fieldset className="bg-white border border-rose-200 rounded-lg p-4 space-y-3 shadow-sm">
            <legend className="px-2 text-[11px] font-bold text-rose-700 flex items-center gap-1 bg-rose-50 py-0.5 rounded border border-rose-200">
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>5. BERSIHKAN DATA TRANSAKSI PESANAN (RESET KE 0 - KHUSUS OWNER)</span>
            </legend>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-rose-50/50 border border-rose-100 rounded-md">
              <div>
                <p className="font-bold text-slate-800 text-xs">
                  Kosongkan Seluruh Riwayat Pesanan SPK (Reset ke 0)
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Saat ini terdapat <b className="text-rose-700">{orders.length}</b> pesanan tersimpan di sistem. Gunakan tombol ini untuk menghapus seluruh data pesanan percobaan / SPK lama sehingga kembali bersih menjadi <b>0 pesanan</b>. Master produk, bahan, dan profil toko Anda tetap aman dan tidak terhapus.
                </p>
                {resetMessage && (
                  <p className="text-xs font-bold text-emerald-700 mt-2 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded inline-block">
                    {resetMessage}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs shrink-0 shadow-xs cursor-pointer active:translate-y-0.5 transition-colors"
              >
                Hapus Semua Pesanan (Reset ke 0)
              </button>
            </div>
          </fieldset>
        )}

        {/* Bottom Save Button */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded shadow-md flex items-center gap-1.5 transition-all text-xs"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Pengaturan Berhasil Disimpan!' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>

      {/* Modal Konfirmasi Hapus Semua Data Pesanan */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Semua Pesanan</h3>
                <p className="text-xs text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh <b className="text-rose-700">{orders.length} pesanan SPK</b> yang ada di sistem? Semua nomor SPK dan riwayat transaksi akan dikosongkan dan <b>kembali menjadi 0</b>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearOrders}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs shadow-xs cursor-pointer active:translate-y-0.5 transition-colors"
              >
                Ya, Hapus Semua Pesanan (Reset ke 0)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

