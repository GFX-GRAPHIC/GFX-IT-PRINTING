import React, { useState, useEffect } from 'react';
import { Lock, User, Key, ArrowRight, ShieldCheck, ShieldAlert, Eye, EyeOff, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { LicenseModal } from '../components/layout/LicenseModal';
import {
  sanitizeUsername,
  sanitizePin,
  getLoginSecurityState,
  recordFailedLoginAttempt,
  resetLoginSecurityState,
  logAuditAction,
  LoginSecurityState,
} from '../utils/security';

interface LoginPageProps {
  onSuccess: (user: any) => void;
  dbConnected: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, dbConnected }) => {
  const { loginWithCredentials, users } = useAuth();
  const { storeSettings } = useApp();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secState, setSecState] = useState<LoginSecurityState>(() => getLoginSecurityState());
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const checkLicense = async () => {
    try {
      if ((window as any).electronAPI?.licenseGetStatus) {
        const status = await (window as any).electronAPI.licenseGetStatus();
        setLicenseStatus(status);
        if (status.isBlocked || (!status.isLicensed && !status.isTrial)) {
          setShowLicenseModal(true);
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkLicense();
    if ((window as any).electronAPI?.onLicenseBlocked) {
      (window as any).electronAPI.onLicenseBlocked((data: any) => {
        setLicenseStatus({
          isBlocked: true,
          isLicensed: false,
          isTrial: false,
          status: 'BLOCKED',
          message: data?.reason || 'Lisensi komputer ini telah dinonaktifkan oleh Administrator.'
        });
        setShowLicenseModal(true);
      });
    }
  }, []);

  // Lockout live countdown timer
  useEffect(() => {
    if (!secState.isLocked) return;

    const interval = setInterval(() => {
      const updated = getLoginSecurityState();
      setSecState(updated);
      if (!updated.isLocked) {
        setError('');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secState.isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Live License Status First
    let currentLiveStatus = licenseStatus;
    if ((window as any).electronAPI?.licenseGetStatus) {
      try {
        currentLiveStatus = await (window as any).electronAPI.licenseGetStatus();
        setLicenseStatus(currentLiveStatus);
      } catch {}
    }

    if (currentLiveStatus?.isBlocked) {
      setError(`⛔ Komputer ini sedang dinonaktifkan (BLOCKED) oleh Administrator!\nAlasan: ${currentLiveStatus.message || 'Penangguhan lisensi'}`);
      setShowLicenseModal(true);
      return;
    }

    if (currentLiveStatus && !currentLiveStatus.isLicensed && !currentLiveStatus.isTrial) {
      setError('Aplikasi belum diaktivasi! Harap aktivasi lisensi resmi terlebih dahulu.');
      setShowLicenseModal(true);
      return;
    }

    // Check lockout
    const currentSec = getLoginSecurityState();
    if (currentSec.isLocked) {
      setError(`⛔ Terlalu banyak percobaan gagal! Akun terkunci sementara. Harap tunggu ${currentSec.remainingLockoutSeconds} detik.`);
      return;
    }

    const cleanUsername = sanitizeUsername(username);
    const cleanPin = sanitizePin(pin);

    if (!cleanUsername) {
      setError('Username login wajib diisi!');
      return;
    }

    if (!cleanPin) {
      setError('Password / PIN wajib diisi!');
      return;
    }

    setLoading(true);
    setError('');

    const loggedUser = await loginWithCredentials(cleanUsername, cleanPin);
    setLoading(false);

    if (loggedUser) {
      resetLoginSecurityState();
      logAuditAction('LOGIN_SUCCESS', `User "${loggedUser.name}" (@${loggedUser.username}) berhasil login ke sistem`);
      onSuccess(loggedUser);
    } else {
      const updatedSec = recordFailedLoginAttempt(cleanUsername);
      setSecState(updatedSec);

      if (updatedSec.isLocked) {
        setError(`⛔ Terlalu banyak percobaan salah! Sistem mengunci login sementara selama ${updatedSec.remainingLockoutSeconds} detik untuk keamanan.`);
      } else {
        setError(
          `Username atau Password / PIN salah! Sisa percobaan: ${updatedSec.remainingAttempts} kali.`
        );
      }
    }
  };

  const isUnlicensed = licenseStatus && !licenseStatus.isLicensed && !licenseStatus.isTrial;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#f1f5f9] font-sans">
      {/* Login Card Box */}
      <div className="w-full max-w-sm bg-white border border-[#cbd5e1] rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e40af] text-white p-4 text-center">
          {storeSettings?.appIcon && (storeSettings.appIcon.startsWith('data:image') || storeSettings.appIcon.startsWith('http')) ? (
            <div className="w-12 h-12 bg-white/10 rounded-md border border-white/20 flex items-center justify-center mx-auto mb-2 p-1 overflow-hidden">
              <img
                src={storeSettings.appIcon}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : storeSettings?.appIcon && storeSettings.appIcon.trim() !== '' ? (
            <div className="w-10 h-10 bg-white/10 rounded-md border border-white/20 flex items-center justify-center mx-auto mb-2 text-2xl">
              {storeSettings.appIcon}
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/10 rounded-md border border-white/20 flex items-center justify-center mx-auto mb-2 p-1 overflow-hidden">
              <img
                src="./favicon.ico"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="text-sm font-bold tracking-tight uppercase">
            {storeSettings?.appName || 'GFX IT PRINTING'}
          </h1>
          <p className="text-[11px] text-blue-100 mt-0.5">
            {storeSettings?.appSubtitle || 'Sistem Kasir & SPK Digital Produksi'}
          </p>
        </div>

        {/* License Warning Banner */}
        {isUnlicensed && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs flex items-center justify-between text-amber-900">
            <div>
              <p className="font-bold text-[11.5px]">Aplikasi Belum Teraktivasi</p>
              <p className="text-[10.5px] text-amber-800">Hubungi Admin: 0851-6359-4245</p>
            </div>
            <button
              type="button"
              onClick={() => setShowLicenseModal(true)}
              className="px-2.5 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded font-bold text-[11px] cursor-pointer"
            >
              Aktivasi
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px]">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#334155] mb-1">Username Login</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: owner / kasir / designer"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className="w-full pl-3 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[#334155]">Password / PIN (4 Digit)</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#64748b] hover:text-[#1e40af] flex items-center gap-1 focus:outline-none cursor-pointer"
                title={showPassword ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3 h-3 text-[#64748b]" />
                    <span>Sembunyikan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-[#1e40af]" />
                    <span>Lihat</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••"
                value={pin}
                disabled={secState.isLocked}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full pl-3 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#0f172a] font-mono focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] ${
                  secState.isLocked ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || secState.isLocked}
            className={`w-full py-2 px-4 font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 ${
              secState.isLocked
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-[#1e40af] hover:bg-[#1d4ed8] text-white cursor-pointer'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>
              {loading
                ? 'Memeriksa...'
                : secState.isLocked
                ? `Terkunci (${secState.remainingLockoutSeconds}s)`
                : 'Masuk ke Sistem'}
            </span>
            {!secState.isLocked && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Footer info */}
        <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-6 py-3 text-[11px] flex items-center justify-between text-[#64748b]">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Brute Force Aktif</span>
          </div>
          <span>Database: {dbConnected ? 'MySQL Aktif' : 'Local Fallback'}</span>
        </div>
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onSuccess={() => {
          checkLicense();
        }}
      />
    </div>
  );
};
