import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Printer, Shield, User as UserIcon, Clock, ChevronDown, Check, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadge } from '../../utils/formatters';

export const TitleBar: React.FC = () => {
  const { currentUser, users, switchUser } = useAuth();
  const [isMaximized, setIsMaximized] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [pinModalUser, setPinModalUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
      window.electronAPI.onWindowStateChange((state) => {
        setIsMaximized(state.isMaximized);
      });
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  };

  const handleSelectUser = (user: { id: string; name: string; role: string; pin: string }) => {
    if (user.id === currentUser.id) {
      setShowUserDropdown(false);
      return;
    }
    // If user has PIN, prompt for PIN
    if (user.pin) {
      setPinModalUser(user);
      setPinInput('');
      setPinError('');
      setShowUserDropdown(false);
    } else {
      switchUser(user.id);
      setShowUserDropdown(false);
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;
    const success = switchUser(pinModalUser.id, pinInput);
    if (success) {
      setPinModalUser(null);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN salah! Coba lagi.');
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <>
      <header
        className="h-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-300 flex items-center justify-between px-3 text-xs select-none z-50 sticky top-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: App Branding */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
            <Printer className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 tracking-tight">
            <span>CetakPro</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Desktop POS
            </span>
          </div>
          <div className="hidden md:flex items-center text-[11px] text-slate-500 ml-2 pl-2 border-l border-slate-800">
            <span>Sistem Percetakan & SPK Digital</span>
          </div>
        </div>

        {/* Center: Live Time & Status */}
        <div className="hidden lg:flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Lokal Offline Siap</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Right: User Switcher & Window Controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* User Profile & Quick Switch */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 transition-colors text-left"
              title="Klik untuk ganti user (Owner, Admin, Designer, Operator)"
            >
              <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-200 leading-none">{currentUser.name.split(' ')[0]}</span>
                <span className={`text-[9px] font-semibold leading-none mt-0.5 ${roleBadge.text}`}>
                  {roleBadge.label.split('/')[0].trim()}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Ganti Pengguna / Role
                </div>
                <div className="py-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    const uRole = getRoleBadge(u.role);
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                          isSelected ? 'bg-brand-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-slate-200 font-medium text-xs flex items-center gap-1.5">
                              {u.name}
                              {isSelected && <Check className="w-3 h-3 text-brand-400" />}
                            </div>
                            <div className={`text-[10px] font-medium ${uRole.text}`}>{uRole.label}</div>
                          </div>
                        </div>
                        {u.pin && (
                          <span title="Dilindungi PIN">
                            <Key className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-brand-400" />
                  <span>Role menentukan hak akses menu</span>
                </div>
              </div>
            )}
          </div>

          {/* Window Control Buttons (Minimize, Maximize/Restore, Close) */}
          <div className="flex items-center pl-2 ml-1 border-l border-slate-800">
            <button
              onClick={handleMinimize}
              className="h-8 w-9 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title="Minimize (Perkecil ke Taskbar)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="h-8 w-9 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
              title={isMaximized ? 'Restore Window' : 'Maximize Window (Layar Penuh)'}
            >
              {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
            </button>
            <button
              onClick={handleClose}
              className="h-8 w-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
              title="Tutup Aplikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* PIN Prompt Modal */}
      {pinModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Masukkan PIN</h3>
              <p className="text-xs text-slate-400 mt-1">
                Akses untuk <b>{pinModalUser.name}</b> ({pinModalUser.role})
              </p>
              <div className="text-[11px] text-brand-400 bg-brand-500/10 py-1 px-2.5 rounded-md mt-2 inline-block">
                Demo PIN: {pinModalUser.role === 'owner' ? '1234' : pinModalUser.role === 'admin' ? '1111' : pinModalUser.role === 'designer' ? '2222' : '3333'}
              </div>
            </div>

            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  autoFocus
                  placeholder="••••"
                  className="w-full text-center tracking-[1em] text-2xl font-mono py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
                />
                {pinError && <p className="text-xs text-rose-400 mt-1.5 text-center">{pinError}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalUser(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30"
                >
                  Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
