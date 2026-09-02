import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FileText,
  Users,
  Layers,
  Package,
  Printer,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Lock,
  Minus,
  Square,
  Copy,
  X,
  Database,
  Clock,
  DollarSign,
  Sun,
  Moon,
  RefreshCw,
  Shirt,
  Hash,
  Ticket,
  Key,
  Download,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { LicenseModal } from './LicenseModal';

export type AppView =
  | 'login'
  | 'dashboard'
  | 'shift_kasir'
  | 'input_spk'
  | 'rekap_spk'
  | 'perapih_jersey'
  | 'produksi'
  | 'purchase_order'
  | 'master_konsumen'
  | 'master_kategori'
  | 'master_produk'
  | 'master_mesin'
  | 'tagihan_produksi'
  | 'data_piutang'
  | 'kas_biaya'
  | 'laporan'
  | 'pengaturan'
  | 'manajemen_user';

interface AppMenuBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  dbConnected: boolean;
}

export const AppMenuBar: React.FC<AppMenuBarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  dbConnected,
}) => {
  const { currentUser, isAuthenticated, isOwner, isAdmin, isDesigner, isOperator } = useAuth();
  const { currentShift, storeSettings, isDarkMode, toggleDarkMode } = useApp();

  const [openDropdown, setOpenDropdown] = useState<'master' | 'spk' | 'corel' | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [corelDarkMode, setCorelDarkMode] = useState(false);
  const [corelLoading, setCorelLoading] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [updaterData, setUpdaterData] = useState<{
    status: string;
    version?: string;
    percent?: number;
    error?: string;
  }>({ status: 'idle' });

  const fetchLicenseStatus = async () => {
    try {
      if ((window as any).electronAPI?.licenseGetStatus) {
        const status = await (window as any).electronAPI.licenseGetStatus();
        setLicenseStatus(status);
      }
    } catch {}
  };

  useEffect(() => {
    fetchLicenseStatus();
    if ((window as any).electronAPI?.onUpdaterStatus) {
      (window as any).electronAPI.onUpdaterStatus((data: any) => {
        setUpdaterData(data);
      });
    }
  }, []);

  const handleInstallUpdate = () => {
    if ((window as any).electronAPI?.updaterInstall) {
      (window as any).electronAPI.updaterInstall();
    }
  };

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click ONLY when a dropdown is active
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleReload = () => {
    if (window.electronAPI?.reloadWindow) {
      window.electronAPI.reloadWindow();
    } else {
      window.location.reload();
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI) window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI) window.electronAPI.closeWindow();
    else window.close();
  };

  const handleMenuClick = (view: AppView) => {
    if (!isAuthenticated) return;
    onNavigate(view);
    setOpenDropdown(null);
  };

  // Corel Tools Handlers
  const handleToggleCorelDarkMode = async () => {
    try {
      if ((window as any).electronAPI?.corelToggleDarkMode) {
        const nextMode = !corelDarkMode ? 'dark' : 'light';
        setCorelLoading(true);
        const res = await (window as any).electronAPI.corelToggleDarkMode(nextMode);
        setCorelLoading(false);
        if (res.success) {
          setCorelDarkMode(!corelDarkMode);
          alert(res.message || 'Berhasil mengubah tema CorelDRAW!');
        } else {
          alert(res.message || 'Gagal mengubah tema CorelDRAW.');
        }
      } else {
        alert('Fitur CorelDRAW hanya tersedia di aplikasi desktop Windows.');
      }
    } catch (err: any) {
      setCorelLoading(false);
      alert(`Error: ${err?.message || err}`);
    }
    setOpenDropdown(null);
  };

  const handleConvertAllCurves = async () => {
    try {
      if ((window as any).electronAPI?.corelConvertAllCurves) {
        setCorelLoading(true);
        const res = await (window as any).electronAPI.corelConvertAllCurves();
        setCorelLoading(false);
        if (res.success) {
          alert(res.message || `Berhasil mengonversi ${res.count || 0} objek teks ke kurva!`);
        } else {
          alert(res.message || 'Gagal mengonversi teks ke kurva.');
        }
      } else {
        alert('Fitur CorelDRAW hanya tersedia di aplikasi desktop Windows.');
      }
    } catch (err: any) {
      setCorelLoading(false);
      alert(`Error: ${err?.message || err}`);
    }
    setOpenDropdown(null);
  };

  // Role permissions
  // 1. Master: Only Owner & Admin (Designer & Operator strictly blocked)
  const canAccessMaster = isAuthenticated && (isOwner || isAdmin) && currentUser?.role !== 'designer' && currentUser?.role !== 'operator';
  
  // 2. Tools Corel: Owner, Designer, Admin
  const canAccessToolsCorel = isAuthenticated && (isOwner || isDesigner || isAdmin);

  // 3. SPK: Designer, Admin, Owner (Operator strictly blocked from input/rekap spk)
  const canAccessSpk = isAuthenticated && currentUser?.role !== 'operator';
  
  // 4. Produksi: Operator, Admin, Owner (Designer strictly blocked)
  const canAccessProduksi = isAuthenticated && currentUser?.role !== 'designer';

  return (
    <div
      ref={menuRef}
      className="bg-[#f0f2f5] border-b border-[#cbd5e1] text-[#1e293b] select-none text-xs flex flex-col shrink-0"
    >
      {/* 1. Titlebar Row with App Brand & Desktop Controls */}
      <div className="h-8 bg-[#e2e8f0] border-b border-[#cbd5e1] flex items-center justify-between px-3 window-drag-region">
        {/* Left: App Title & Icon */}
        <div className="flex items-center gap-2 window-no-drag">
          {storeSettings?.appIcon && (storeSettings.appIcon.startsWith('data:image') || storeSettings.appIcon.startsWith('http')) ? (
            <img
              src={storeSettings.appIcon}
              alt="Icon"
              className="w-4 h-4 rounded-xs object-contain"
            />
          ) : storeSettings?.appIcon && storeSettings.appIcon.trim() !== '' ? (
            <span className="text-sm leading-none flex items-center justify-center w-4 h-4">
              {storeSettings.appIcon}
            </span>
          ) : (
            <img
              src="./favicon.ico"
              alt="Icon"
              className="w-4 h-4 rounded-xs object-contain"
              onError={(e) => {
                // Fallback to monogram if missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <span className="font-bold text-[#0f172a] dark:text-slate-100 tracking-tight">
            {storeSettings?.appName || 'GFX IT PRINTING'}
          </span>
          <span className="text-[10px] text-[#64748b] dark:text-slate-400 pl-2 border-l border-[#cbd5e1] dark:border-slate-700">
            v1.0 (MySQL Edition)
          </span>
        </div>

        {/* Center: DB Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#475569] dark:text-slate-300 window-no-drag">
          <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          <span>{dbConnected ? 'MySQL Terhubung' : 'Mode Offline / Standby'}</span>
        </div>

        {/* Right: Window Controls, Refresh, & Theme Toggle */}
        <div className="flex items-center gap-1 window-no-drag">
          {/* Refresh App Button */}
          <button
            type="button"
            onClick={handleReload}
            className="h-6 px-2 flex items-center gap-1 rounded text-[11px] font-semibold bg-white/70 dark:bg-slate-800 hover:bg-[#cbd5e1] dark:hover:bg-slate-700 text-[#1e40af] dark:text-blue-400 border border-[#cbd5e1] dark:border-slate-700 transition-colors cursor-pointer mr-1 shadow-xs"
            title="Segarkan / Refresh Aplikasi (Shortcut: F5 / F6 / Ctrl+R)"
          >
            <RefreshCw className="w-3 h-3 text-[#1e40af] dark:text-blue-400" />
            <span className="font-bold">Refresh (F5)</span>
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="h-6 px-2 flex items-center gap-1 rounded text-[11px] font-semibold hover:bg-[#cbd5e1] dark:hover:bg-slate-800 text-[#334155] dark:text-slate-200 transition-colors cursor-pointer mr-1 border border-transparent hover:border-[#cbd5e1]"
            title={isDarkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200">Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#1e40af]" />
                <span className="text-[#334155]">Mode Gelap</span>
              </>
            )}
          </button>

          <button
            onClick={handleMinimize}
            className="h-6 w-8 flex items-center justify-center hover:bg-[#cbd5e1] text-[#475569] transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-6 w-8 flex items-center justify-center hover:bg-[#cbd5e1] text-[#475569] transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="h-6 w-8 flex items-center justify-center hover:bg-rose-600 hover:text-white text-[#475569] transition-colors"
            title="Tutup Aplikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Classic Desktop MenuBar Row */}
      <div className="h-7 bg-[#f8fafc] flex items-center justify-between px-2 text-[11px] window-no-drag">
        <div className="flex items-center gap-0.5">
          {/* Menu Khusus Owner: Dashboard Pemantauan Bisnis */}
          {isOwner && (
            <button
              onClick={() => handleMenuClick('dashboard')}
              className={`px-3 py-1 rounded flex items-center gap-1.5 font-bold transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'text-[#1e40af] hover:bg-[#eff6ff]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Menu: Master Dropdown (Only for Owner & Admin - Disabled/Hidden for Designer & Operator) */}
          <div className="relative">
            <button
              onClick={() => {
                if (canAccessMaster) {
                  setOpenDropdown(openDropdown === 'master' ? null : 'master');
                }
              }}
              disabled={!canAccessMaster}
              title={
                !isAuthenticated
                  ? 'Silakan login terlebih dahulu'
                  : !canAccessMaster
                  ? 'Akses Master khusus Owner / Admin'
                  : 'Menu Master Data'
              }
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                !canAccessMaster
                  ? 'text-[#94a3b8] cursor-not-allowed opacity-60'
                  : openDropdown === 'master'
                  ? 'bg-[#1e40af] text-white'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <span>Master</span>
              <ChevronDown className="w-3 h-3" />
              {!canAccessMaster && <Lock className="w-2.5 h-2.5 ml-0.5 text-[#94a3b8]" />}
            </button>

            {/* Master Dropdown Menu */}
            {openDropdown === 'master' && canAccessMaster && (
              <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-[#cbd5e1] shadow-xl rounded-md py-1 z-50 animate-in fade-in zoom-in-95">
                {/* Dashboard Shortcut di Master khusus Owner */}
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleMenuClick('dashboard')}
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-[#1e40af] hover:bg-[#eff6ff] flex items-center gap-2 border-b border-[#f1f5f9]"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>Dashboard Pemantauan Owner</span>
                    </button>
                  </>
                )}

                {/* 1. Master Konsumen (Akses: Owner & Admin) */}
                <button
                  onClick={() => handleMenuClick('master_konsumen')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Master Konsumen</span>
                </button>

                {/* Fitur Khusus Owner: Kategori, Produk, Mesin */}
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleMenuClick('master_kategori')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>Master Kategori</span>
                    </button>

                    <button
                      onClick={() => handleMenuClick('master_produk')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                    >
                      <Package className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>Master Produk & Bahan</span>
                    </button>

                    <button
                      onClick={() => handleMenuClick('master_mesin')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>Master Mesin Cetak</span>
                    </button>
                  </>
                )}

                <div className="border-t border-[#e2e8f0] my-1"></div>

                {/* Tagihan Biaya Produksi & Kasbon Pekerja (Akses: Owner & Admin) */}
                <button
                  onClick={() => handleMenuClick('tagihan_produksi')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span className="font-semibold text-[#1e40af]">Tagihan Biaya Produksi & Kasbon</span>
                </button>

                {/* 2. Data Piutang & Tagihan (Akses: Owner & Admin) */}
                <button
                  onClick={() => handleMenuClick('data_piutang')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>Data Piutang & Tagihan</span>
                </button>

                {/* 3. Kas & Biaya Pengeluaran (Akses: Owner & Admin) */}
                <button
                  onClick={() => handleMenuClick('kas_biaya')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>{isAdmin ? 'Pengeluaran Operasional Toko' : 'Buku Kas & Pengeluaran'}</span>
                </button>

                {/* 4. Shift Kasir (Akses: Owner & Admin) */}
                <button
                  onClick={() => handleMenuClick('shift_kasir')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span>{isOwner ? 'Shift Kasir & Rekonsiliasi Laci' : 'Kasir yang Bertugas'}</span>
                </button>

                {/* Fitur Khusus Owner: PO Supplier, Laporan, Kelola User, Pengaturan Toko */}
                {isOwner && (
                  <>
                    <button
                      onClick={() => handleMenuClick('purchase_order')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>PO Supplier & Bahan Baku (Khusus Owner)</span>
                    </button>

                    <button
                      onClick={() => handleMenuClick('laporan')}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#64748b]" />
                      <span>Laporan Penjualan & Keuangan</span>
                    </button>

                    <div className="border-t border-[#e2e8f0] my-1"></div>

                    <button
                      onClick={() => handleMenuClick('manajemen_user')}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#1e40af] hover:bg-[#eff6ff] flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>Kelola User & Tambah Staf</span>
                    </button>

                    {/* Pengaturan Toko, Rekening & Nota (KHUSUS OWNER SAJA) */}
                    <button
                      onClick={() => handleMenuClick('pengaturan')}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-[#1e40af] hover:bg-[#eff6ff] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>Pengaturan Toko & Rekening</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Menu: Tools Corel (Owner, Designer, Admin) */}
          <div className="relative">
            <button
              onClick={() => {
                if (canAccessToolsCorel) {
                  setOpenDropdown(openDropdown === 'corel' ? null : 'corel');
                }
              }}
              disabled={!canAccessToolsCorel}
              title={
                !isAuthenticated
                  ? 'Silakan login terlebih dahulu'
                  : !canAccessToolsCorel
                  ? 'Akses Tools Corel dibatasi'
                  : 'Utilitas & Tools CorelDRAW'
              }
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                !canAccessToolsCorel
                  ? 'text-[#94a3b8] cursor-not-allowed opacity-60'
                  : openDropdown === 'corel'
                  ? 'bg-[#1e40af] text-white'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <span>Tools Corel</span>
              <ChevronDown className="w-3 h-3" />
              {!canAccessToolsCorel && <Lock className="w-2.5 h-2.5 ml-0.5 text-[#94a3b8]" />}
            </button>

            {/* Tools Corel Dropdown Menu */}
            {openDropdown === 'corel' && canAccessToolsCorel && (
              <div className="absolute left-0 top-full mt-0.5 w-64 bg-white border border-[#cbd5e1] shadow-xl rounded-md py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-[#f1f5f9] text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                  Utilitas CorelDRAW (X7 - 2025)
                </div>

                {/* 1. Sakelar Dark Mode Corel */}
                <button
                  onClick={handleToggleCorelDarkMode}
                  disabled={corelLoading}
                  className="w-full text-left px-3 py-2 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center justify-between gap-2 border-b border-[#f8fafc]"
                >
                  <div className="flex items-center gap-2">
                    {corelDarkMode ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#1e40af]" />
                    )}
                    <div>
                      <div className="font-bold">Corel Dark Mode</div>
                      <div className="text-[10px] text-[#64748b]">Ubah kanvas & desktop jadi gelap/terang</div>
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    corelDarkMode 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}>
                    {corelDarkMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 2. Convert All Text to Curves (Ctrl+Q Massal) */}
                <button
                  onClick={handleConvertAllCurves}
                  disabled={corelLoading}
                  className="w-full text-left px-3 py-2 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#1e40af]" />
                  <div>
                    <div className="font-bold">Convert ke Kurva (Ctrl+Q)</div>
                    <div className="text-[10px] text-[#64748b]">Convert semua teks di halaman aktif</div>
                  </div>
                </button>

                {/* 3. Buka Tool Auto-Layout Jersey */}
                <button
                  onClick={() => {
                    if ((window as any).electronAPI?.corelOpenCompanionTool) {
                      (window as any).electronAPI.corelOpenCompanionTool({
                        teamName: 'GFX IT PRINTING',
                        players: [],
                      });
                    }
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 border-t border-[#f8fafc]"
                >
                  <Shirt className="w-4 h-4 text-[#1e40af]" />
                  <div>
                    <div className="font-bold">Auto-Layout Jersey</div>
                    <div className="text-[10px] text-[#64748b]">Tata pola & nomor jersey dari Excel</div>
                  </div>
                </button>

                {/* 4. Buka Tool Numerator (Voucher / ID Card / Tiket) */}
                <button
                  onClick={() => {
                    if ((window as any).electronAPI?.corelOpenNumeratorTool) {
                      (window as any).electronAPI.corelOpenNumeratorTool();
                    }
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#1e293b] hover:bg-[#ecfdf5] hover:text-[#047857] flex items-center gap-2 border-t border-[#f8fafc]"
                >
                  <Ticket className="w-4 h-4 text-[#059669]" />
                  <div>
                    <div className="font-bold text-[#065f46]">🔢 Numerator Machine</div>
                    <div className="text-[10px] text-[#64748b]">Nomorator Voucher, Tiket, ID Card & Nota</div>
                  </div>
                </button>
              </div>
            )}
          </div>


          {/* Menu: Input SPK Dropdown (Designer, Admin, Owner - Operator strictly blocked) */}
          <div className="relative">
            <button
              onClick={() => {
                if (canAccessSpk) {
                  setOpenDropdown(openDropdown === 'spk' ? null : 'spk');
                }
              }}
              disabled={!canAccessSpk}
              title={
                !isAuthenticated
                  ? 'Silakan login terlebih dahulu'
                  : !canAccessSpk
                  ? 'Akses SPK dibatasi'
                  : 'Menu SPK'
              }
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                !canAccessSpk
                  ? 'text-[#94a3b8] cursor-not-allowed opacity-60'
                  : openDropdown === 'spk'
                  ? 'bg-[#1e40af] text-white'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <span>{currentUser?.role === 'admin' ? 'Rekap SPK' : 'Input SPK'}</span>
              <ChevronDown className="w-3 h-3" />
              {!canAccessSpk && <Lock className="w-2.5 h-2.5 ml-0.5 text-[#94a3b8]" />}
            </button>

            {/* SPK Dropdown Menu */}
            {openDropdown === 'spk' && canAccessSpk && (
              <div className="absolute left-0 top-full mt-0.5 w-52 bg-white border border-[#cbd5e1] shadow-xl rounded-md py-1 z-50 animate-in fade-in zoom-in-95">
                {/* Admin TIDAK BISA input SPK, hanya Designer & Owner yang bisa input */}
                {currentUser?.role !== 'admin' && (
                  <button
                    onClick={() => handleMenuClick('input_spk')}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1e40af]" />
                    <span className="font-semibold">1. Input SPK Baru</span>
                  </button>
                )}

                <button
                  onClick={() => handleMenuClick('rekap_spk')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>{currentUser?.role === 'admin' ? 'Rekap & Approval SPK' : '2. Rekap SPK'}</span>
                </button>

                <button
                  onClick={() => handleMenuClick('perapih_jersey')}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#1e293b] hover:bg-[#eff6ff] hover:text-[#1e40af] flex items-center gap-2 border-t border-[#f1f5f9]"
                >
                  <span className="font-semibold text-[#1e40af]">3. Perapih List Jersey (OCR)</span>
                </button>
              </div>
            )}
          </div>

          {/* Shortcut Cepat: Perapih Pesanan Jersey (Khusus Desainer, Admin, Owner) */}
          {canAccessSpk && (
            <button
              onClick={() => handleMenuClick('perapih_jersey')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                currentView === 'perapih_jersey'
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'text-[#1e40af] hover:bg-[#eff6ff]'
              }`}
              title="Tools Desain: Perapih List Pesanan & Ukuran Jersey (OCR)"
            >
              <span>Perapih Jersey</span>
            </button>
          )}

          {/* Menu Baru: Produksi (Khusus Operator & Owner / Admin) */}
          <button
            onClick={() => handleMenuClick('produksi')}
            disabled={!canAccessProduksi}
            title={!canAccessProduksi ? 'Akses Produksi dibatasi untuk Designer' : 'Antrean Produksi Mesin Workshop'}
            className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
              !canAccessProduksi
                ? 'text-[#94a3b8] cursor-not-allowed opacity-60'
                : currentView === 'produksi'
                ? 'bg-[#1e40af] text-white'
                : 'text-[#1e293b] hover:bg-[#e2e8f0]'
            }`}
          >
            <Printer className="w-3 h-3 text-[#64748b]" />
            <span>Produksi</span>
            {!canAccessProduksi && <Lock className="w-2.5 h-2.5 ml-0.5 text-[#94a3b8]" />}
          </button>

          {/* Shortcut PO Supplier: KHUSUS OWNER ONLY */}
          {isOwner && (
            <button
              onClick={() => handleMenuClick('purchase_order')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                currentView === 'purchase_order'
                  ? 'bg-[#1e40af] text-white'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <FileText className="w-3 h-3 text-[#64748b]" />
              <span>PO Supplier</span>
            </button>
          )}

          {/* Shortcut Shift Kasir POS (Admin & Owner) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={() => handleMenuClick('shift_kasir')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-semibold transition-colors ${
                currentView === 'shift_kasir'
                  ? 'bg-[#1e40af] text-white'
                  : currentShift
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{currentShift ? `Shift: ${currentShift.cashierName.split(' ')[0]}` : 'Shift Kasir'}</span>
            </button>
          )}

          {/* Shortcut Pengeluaran: Admin (Hanya Operasional Toko) vs Owner (Buku Kas & Pengeluaran) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={() => handleMenuClick('kas_biaya')}
              className={`px-3 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                currentView === 'kas_biaya'
                  ? 'bg-[#1e40af] text-white'
                  : 'text-[#1e293b] hover:bg-[#e2e8f0]'
              }`}
            >
              <Wallet className="w-3 h-3 text-[#64748b]" />
              <span>{isAdmin ? 'Operasional Toko' : 'Pengeluaran'}</span>
            </button>
          )}
        </div>

        {/* Right Side: Auto-Updater Status, License Status, Active User & Logout */}
        <div className="flex items-center gap-2">
          {/* Auto-Updater Badge */}
          {updaterData.status === 'downloading' && (
            <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1 animate-pulse">
              <Download className="w-2.5 h-2.5 text-blue-600 animate-bounce" />
              <span>Update: {updaterData.percent || 0}%</span>
            </div>
          )}

          {updaterData.status === 'downloaded' && (
            <button
              onClick={handleInstallUpdate}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-sm flex items-center gap-1 transition-all cursor-pointer animate-pulse"
              title="Klik untuk memasang pembaruan dan restart aplikasi"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Update Siap! [Pasang]</span>
            </button>
          )}

          {/* License Badge Button */}
          <button
            onClick={() => setShowLicenseModal(true)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
              licenseStatus?.isLicensed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : licenseStatus?.isTrial
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 animate-pulse'
            }`}
            title="Klik untuk melihat / aktivasi lisensi software"
          >
            <Key className="w-2.5 h-2.5" />
            <span>
              {licenseStatus?.isLicensed
                ? 'LIFETIME'
                : licenseStatus?.isTrial
                ? `TRIAL: ${licenseStatus.remainingDays}H`
                : 'AKTIVASI LISENSI'}
            </span>
          </button>

          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2.5">
              <span className="text-[#334155] dark:text-slate-300 font-medium">
                User: <b className="text-[#0f172a] dark:text-white font-bold">{currentUser.name}</b> ({currentUser.role})
              </span>
              <button
                onClick={onLogout}
                className="px-2 py-0.5 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] rounded font-semibold border border-[#fca5a5] flex items-center gap-1 transition-colors"
                title="Keluar dari akun"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-[#94a3b8] italic">
              Silakan login untuk membuka akses menu
            </div>
          )}
        </div>
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        onSuccess={() => {
          fetchLicenseStatus();
        }}
      />
    </div>
  );
};
