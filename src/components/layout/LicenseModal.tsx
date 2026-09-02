import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Copy, Check, ExternalLink, AlertTriangle, Sparkles, X } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [hwid, setHwid] = useState('Memuat...');
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [serialInput, setSerialInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadStatus = async () => {
    if (window.electronAPI?.licenseGetStatus) {
      const status = await window.electronAPI.licenseGetStatus();
      setLicenseStatus(status);
      if (status?.hwid) setHwid(status.hwid);
    } else {
      setHwid('GFX-DEMO-0000-0000');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(hwid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) {
      setError('Harap masukkan Kode Lisensi / Serial Key dari Admin!');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (window.electronAPI?.licenseActivate) {
      const res = await window.electronAPI.licenseActivate(serialInput.trim());
      setLoading(false);
      if (res?.success) {
        setSuccessMsg(res.message);
        loadStatus();
        if (onSuccess) onSuccess();
      } else {
        setError(res?.message || 'Kode lisensi tidak valid!');
      }
    } else {
      setLoading(false);
      setError('Sistem lisensi hanya aktif di aplikasi desktop Windows.');
    }
  };

  const handleContactAdmin = () => {
    const text = encodeURIComponent(
      `Halo Admin / IT Support GFX IT PRINTING, saya ingin membeli / aktivasi lisensi software.\n\nBerikut Hardware ID komputer saya:\n💻 HWID: ${hwid}\n\nMohon info nomor rekening & total biayanya. Terima kasih!`
    );
    window.open(`https://wa.me/6285163594245?text=${text}`, '_blank');
  };

  const isLicensed = licenseStatus?.isLicensed;
  const isTrial = licenseStatus?.isTrial;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 font-sans select-none">
      {/* Native Windows Dialog Container */}
      <div className="w-full max-w-md bg-white border border-[#94a3b8] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Native Title Header */}
        <div className="bg-[#1e40af] text-white px-4 py-3 flex items-center justify-between border-b border-[#1d4ed8]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-bold tracking-tight uppercase">
              Aktivasi Lisensi Software
            </span>
            {isLicensed && (
              <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-bold">
                LIFETIME
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="p-5 space-y-3.5 text-xs text-[#1e293b] bg-[#f8fafc]">
          {/* Status Alert Banner */}
          {licenseStatus?.isBlocked ? (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded flex items-start gap-2.5 text-rose-950">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-rose-700">Lisensi Ditangguhkan (Suspended)</p>
                <p className="text-[11px] text-rose-800">
                  {licenseStatus.message || 'Lisensi untuk komputer ini telah dinonaktifkan oleh Administrator.'}
                </p>
              </div>
            </div>
          ) : isLicensed ? (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded flex items-start gap-2.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs">{licenseStatus.customerName}</p>
                <p className="text-[11px] text-emerald-700">{licenseStatus.message}</p>
              </div>
            </div>
          ) : isTrial ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded flex items-start gap-2.5 text-amber-900">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Masa Percobaan Resmi (Trial Mode)</p>
                <p className="text-[11px] text-amber-800">
                  Sisa waktu: <b>{licenseStatus.remainingDays} Hari</b>. Aktivasi Beli Putus untuk masa aktif permanen seumur hidup.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded flex items-start gap-2.5 text-slate-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Aplikasi Belum Teraktivasi</p>
                <p className="text-[11px] text-slate-600">
                  Silakan hubungi Admin di WhatsApp <b>0851-6359-4245</b> untuk mendapatkan Serial Key lisensi resmi.
                </p>
              </div>
            </div>
          )}

          {/* Hardware ID Box */}
          <div className="bg-white border border-[#cbd5e1] rounded p-3 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#475569]">
              <span>HARDWARE ID KOMPUTER ANDA:</span>
              <span className="text-[10px] text-[#1e40af] font-bold">Unik per PC</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={hwid}
                className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded px-2.5 py-1.5 font-mono text-[#0f172a] font-bold text-xs select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopyHwid}
                className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  copied
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Form Input Serial Key */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#334155] mb-1">
                KODE SERIAL KEY LISENSI:
              </label>
              <textarea
                rows={3}
                placeholder="Tempel (Paste) kode kunci aktivasi yang Anda terima dari Admin di sini..."
                value={serialInput}
                onChange={(e) => {
                  setSerialInput(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-white border border-[#cbd5e1] rounded p-2.5 text-xs text-[#0f172a] font-mono focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] resize-none"
              />
            </div>

            {error && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px]">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] font-semibold">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : 'Aktivasi Lisensi Sekarang'}</span>
            </button>
          </form>

          {/* Footer Contact */}
          <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
            <span>Belum memiliki lisensi?</span>
            <button
              type="button"
              onClick={handleContactAdmin}
              className="text-[#1e40af] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Hubungi Admin WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
