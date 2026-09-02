import React, { useState } from 'react';
import {
  Building,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Sparkles,
} from 'lucide-react';
import { StoreSettings as StoreSettingsType } from '../../types';
import { useApp } from '../../context/AppContext';

export const StoreSettings: React.FC = () => {
  const { storeSettings, updateStoreSettings, resetToDefaultData } = useApp();

  const [form, setForm] = useState<StoreSettingsType>({ ...storeSettings });
  const [isSaved, setIsSaved] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    try {
      if ((window as any).electronAPI?.updaterCheck) {
        const res = await (window as any).electronAPI.updaterCheck();
        if (res.success) {
          if (res.updateInfo?.version) {
            setUpdateMsg(`Versi baru v${res.updateInfo.version} ditemukan dan sedang diunduh di latar belakang!`);
          } else {
            setUpdateMsg('Aplikasi Anda sudah menggunakan versi terbaru (v1.0.0).');
          }
        } else {
          setUpdateMsg(res.message || 'Tidak dapat terhubung ke server update.');
        }
      } else {
        setUpdateMsg('Pemeriksaan pembaruan hanya aktif di aplikasi desktop Windows.');
      }
    } catch {
      setUpdateMsg('Gagal memeriksa pembaruan. Pastikan komputer terhubung ke internet.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddBank = () => {
    setForm({
      ...form,
      bankAccounts: [
        ...form.bankAccounts,
        { bankName: 'BCA', accountNumber: '', accountHolder: form.storeName },
      ],
    });
  };

  const handleRemoveBank = (idx: number) => {
    setForm({
      ...form,
      bankAccounts: form.bankAccounts.filter((_, i) => i !== idx),
    });
  };

  const handleBankChange = (idx: number, field: string, val: string) => {
    const updated = [...form.bankAccounts];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm({ ...form, bankAccounts: updated });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* General Store Information */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-brand-400" />
          <span>Profil Toko & Informasi Nota Percetakan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Percetakan *</label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Slogan / Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">No. WhatsApp Resmi *</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email Bisnis</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Alamat Workshop</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Kota & Provinsi</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Official Bank Accounts */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Rekening Pembayaran Bank (Tampil di Nota & Faktur)
            </h3>
            <p className="text-[11px] text-slate-400">Digunakan untuk informasi transfer pelanggan</p>
          </div>
          <button
            type="button"
            onClick={handleAddBank}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs border border-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Rekening</span>
          </button>
        </div>

        <div className="space-y-3">
          {form.bankAccounts.map((b, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <input
                type="text"
                placeholder="Nama Bank (BCA/Mandiri)"
                value={b.bankName}
                onChange={(e) => handleBankChange(idx, 'bankName', e.target.value)}
                className="w-36 text-xs bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200"
              />
              <input
                type="text"
                placeholder="Nomor Rekening"
                value={b.accountNumber}
                onChange={(e) => handleBankChange(idx, 'accountNumber', e.target.value)}
                className="flex-1 text-xs bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
              />
              <input
                type="text"
                placeholder="Atas Nama (Pemilik Rekening)"
                value={b.accountHolder}
                onChange={(e) => handleBankChange(idx, 'accountHolder', e.target.value)}
                className="flex-1 text-xs bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-slate-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveBank(idx)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Printing & Struk Footer Notes */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Catatan Kaki Struk Kasir & Syarat Cetak (Footer Notes)
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Catatan Kaki Struk Thermal Kasir
            </label>
            <textarea
              rows={2}
              value={form.footerReceiptNotes}
              onChange={(e) => setForm({ ...form, footerReceiptNotes: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Catatan Kaki Lembar SPK Produksi
            </label>
            <textarea
              rows={2}
              value={form.footerSpkNotes}
              onChange={(e) => setForm({ ...form, footerSpkNotes: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-750 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Auto-Updater & Version Management */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Informasi Versi & Pembaruan Sistem (Auto-Updater)</span>
        </h3>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>Versi Aplikasi Saat Ini:</span>
              <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded text-[11px] font-mono">
                v1.0.0
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Sistem terhubung ke server GitHub Release untuk pembaruan fitur & keamanan otomatis.
            </p>
            {updateMsg && (
              <p className="text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 p-2 rounded mt-2">
                {updateMsg}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{checkingUpdate ? 'Memeriksa...' : 'Periksa Update Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Save Action & Reset Demo Data */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('Yakin ingin mereset seluruh data ke data demo awal? Semua perubahan akan dikembalikan.')) {
              resetToDefaultData();
              setForm({ ...storeSettings });
            }
          }}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Data Demo Awal</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Berhasil Disimpan!' : 'Simpan Perubahan'}</span>
        </button>
      </div>
    </form>
  );
};
