import React, { useState, useEffect } from 'react';
import { AppMenuBar, AppView } from './components/layout/AppMenuBar';
import { LoginPage } from './pages/LoginPage';
import { InputSpkForm } from './components/spk/InputSpkForm';
import { RekapSpkView } from './components/spk/RekapSpkView';
import { ProduksiPage } from './pages/ProduksiPage';
import { PerapihJerseyPage } from './pages/PerapihJerseyPage';
import { DashboardOwnerPage } from './pages/DashboardOwnerPage';

// Master Pages
import { MasterKonsumenPage } from './pages/MasterKonsumenPage';
import { MasterKategoriPage } from './pages/MasterKategoriPage';
import { MasterProdukPage } from './pages/MasterProdukPage';
import { MasterMesinPage } from './pages/MasterMesinPage';
import { TagihanBiayaProduksiPage } from './pages/TagihanBiayaProduksiPage';
import { DataPiutangPage } from './pages/DataPiutangPage';
import { KasBiayaPage } from './pages/KasBiayaPage';
import { PurchaseOrderPage } from './pages/PurchaseOrderPage';
import { ShiftKasirPage } from './pages/ShiftKasirPage';
import { LaporanKeuanganPage } from './pages/LaporanKeuanganPage';
import { PengaturanSistemPage } from './pages/PengaturanSistemPage';
import { ManajemenUserPage } from './pages/ManajemenUserPage';

// Print Modals
import { ReceiptPrintView } from './components/pos/ReceiptPrintView';
import { InvoicePrintView } from './components/pos/InvoicePrintView';
import { SpkPrintDocument } from './components/spk/SpkPrintDocument';

import { Order } from './types';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { checkDbStatus } from './services/api';
import { logAuditAction } from './utils/security';

export const App: React.FC = () => {
  const { isAuthenticated, logout, isOwner, currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { storeSettings } = useApp();

  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const saved = sessionStorage.getItem('cetakpro_active_view');
      if (saved) return saved as AppView;
    } catch {}
    return 'input_spk';
  });

  // Sync active view to sessionStorage so F5/F6/Reload stays on current page
  useEffect(() => {
    try {
      if (currentView) {
        sessionStorage.setItem('cetakpro_active_view', currentView);
      }
    } catch {}
  }, [currentView]);

  // Security Auto-Lock / Inactivity timer (30 minutes of idle -> lock screen)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 mins

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logAuditAction('AUTO_LOCK', `Sesi user "${currentUser?.name}" otomatis terkunci karena tidak ada aktivitas selama 30 menit.`);
        handleLogout();
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));

    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAuthenticated, currentUser?.name]);

  // Update browser tab title dynamically
  useEffect(() => {
    const title = storeSettings?.appName || 'CetakPro POS';
    document.title = `${title} - Sistem Kasir & SPK Digital Percetakan`;
  }, [storeSettings?.appName]);

  // CRITICAL FIX: Global listener ensuring any clicked input, textarea, or select gets instant focus
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInteractive) {
        if (document.activeElement !== target) {
          target.focus();
        }
      }
    };

    window.addEventListener('mousedown', handleGlobalMouseDown, true);
    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown, true);
    };
  }, []);

  // Global Keyboard Shortcuts (F5 / F6 / Ctrl+R for App Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || e.key === 'F6' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        if (window.electronAPI?.reloadWindow) {
          window.electronAPI.reloadWindow();
        } else {
          window.location.reload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [editingSpkOrder, setEditingSpkOrder] = useState<Order | null>(null);
  const [importedSpkItems, setImportedSpkItems] = useState<any[] | null>(null);

  // Auto-guard view based on role and enforce proper access
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    if (currentUser.role === 'designer') {
      // Designer has access to input_spk, rekap_spk, and perapih_jersey
      if (currentView !== 'input_spk' && currentView !== 'rekap_spk' && currentView !== 'perapih_jersey') {
        setCurrentView('input_spk');
      }
    } else if (currentUser.role === 'operator') {
      // Operator ONLY has access to produksi
      if (currentView !== 'produksi') {
        setCurrentView('produksi');
      }
    } else if (currentUser.role === 'admin') {
      // Admin cannot access dashboard, input_spk, purchase_order, or owner master menus
      if (
        currentView === 'dashboard' ||
        currentView === 'input_spk' ||
        currentView === 'purchase_order' ||
        currentView === 'master_kategori' ||
        currentView === 'master_produk' ||
        currentView === 'master_mesin' ||
        currentView === 'laporan' ||
        currentView === 'manajemen_user'
      ) {
        setCurrentView('rekap_spk');
      }
    }
  }, [currentUser?.id, currentUser?.role, currentView, isAuthenticated]);

  const handleLogout = () => {
    setEditingSpkOrder(null);
    setImportedSpkItems(null);
    try {
      sessionStorage.removeItem('cetakpro_active_view');
    } catch {}
    setCurrentView('input_spk');
    logout();
  };

  // Print overlays
  const [printSpkData, setPrintSpkData] = useState<any | null>(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState<Order | null>(null);
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState<Order | null>(null);

  // Check MySQL connection on mount & periodically
  useEffect(() => {
    let isMounted = true;
    const checkConnection = async () => {
      try {
        const status = await checkDbStatus();
        if (isMounted) {
          setDbConnected((prev) => (prev !== status.isOnline ? status.isOnline : prev));
        }
      } catch {
        if (isMounted) {
          setDbConnected((prev) => (prev !== false ? false : prev));
        }
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f1f5f9] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f8fafc] overflow-hidden font-sans">
      {/* 1. Classic Windows MenuBar (Disabled when not logged in) */}
      <AppMenuBar
        currentView={currentView}
        onNavigate={(v) => {
          if (v === 'input_spk') setEditingSpkOrder(null);
          setCurrentView(v);
        }}
        onLogout={handleLogout}
        dbConnected={dbConnected}
      />

      {/* 2. Main Body Content */}
      <div className="flex-1 flex overflow-hidden">
        {!isAuthenticated ? (
          // Layar Login saat belum login
          <LoginPage
            onSuccess={(loggedUser) => {
              const role = loggedUser?.role || currentUser?.role;
              let defaultView: AppView = 'input_spk';
              if (role === 'operator') {
                defaultView = 'produksi';
              } else if (role === 'admin') {
                defaultView = 'rekap_spk';
              } else if (role === 'owner') {
                defaultView = 'dashboard';
              } else {
                defaultView = 'input_spk';
              }
              setCurrentView(defaultView);
              try {
                sessionStorage.setItem('cetakpro_active_view', defaultView);
              } catch {}
            }}
            dbConnected={dbConnected}
          />
        ) : (
          // Konten Aplikasi saat sudah login
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0b0f19]">
            {/* Dashboard Eksekutif KHUSUS Owner */}
            {isOwner && currentView === 'dashboard' && <DashboardOwnerPage />}

            {/* Tools Desain: Perapih List Pesanan & Ukuran Jersey (Designer, Admin, Owner) */}
            {currentView === 'perapih_jersey' && (
              <PerapihJerseyPage
                onImportToSpk={(items) => {
                  setImportedSpkItems(items);
                  setEditingSpkOrder(null);
                  setCurrentView('input_spk');
                }}
              />
            )}

            {/* Input SPK (Khusus Designer & Owner) */}
            {currentView === 'input_spk' && (
              <InputSpkForm
                editingOrder={editingSpkOrder}
                importedItems={importedSpkItems}
                onClearImportedItems={() => setImportedSpkItems(null)}
                onPrintSpk={(spk) => setPrintSpkData(spk)}
                onExit={() => {
                  setEditingSpkOrder(null);
                  setImportedSpkItems(null);
                  setCurrentView('rekap_spk');
                }}
              />
            )}

            {/* Rekap SPK (Designer, Admin, Owner - Operator diblokir) */}
            {currentView === 'rekap_spk' && (
              <RekapSpkView
                onOpenSpk={(ord) => {
                  setEditingSpkOrder(ord);
                  setCurrentView('input_spk');
                }}
                onPrintSpk={(ord) => setPrintSpkData(ord)}
                onPrintReceipt={(ord) => setPrintReceiptOrder(ord)}
                onPrintInvoice={(ord) => setPrintInvoiceOrder(ord)}
                onNewSpk={() => {
                  setEditingSpkOrder(null);
                  setCurrentView('input_spk');
                }}
              />
            )}

            {/* Menu Baru: Antrean Produksi Workshop (Khusus Operator, Owner, Admin) */}
            {currentView === 'produksi' && (
              <ProduksiPage onPrintSpk={(ord) => setPrintSpkData(ord)} />
            )}

            {currentView === 'master_konsumen' && <MasterKonsumenPage />}
            {currentView === 'tagihan_produksi' && <TagihanBiayaProduksiPage />}
            {currentView === 'data_piutang' && <DataPiutangPage />}
            {currentView === 'kas_biaya' && <KasBiayaPage />}
            {currentView === 'shift_kasir' && <ShiftKasirPage />}

            {/* Halaman Khusus Role Owner (PO Supplier, Kategori, Produk, Mesin, Laporan, User, Pengaturan Toko & Rekening) */}
            {isOwner && (
              <>
                {currentView === 'purchase_order' && <PurchaseOrderPage />}
                {currentView === 'master_kategori' && <MasterKategoriPage />}
                {currentView === 'master_produk' && <MasterProdukPage />}
                {currentView === 'master_mesin' && <MasterMesinPage />}
                {currentView === 'laporan' && <LaporanKeuanganPage />}
                {currentView === 'manajemen_user' && <ManajemenUserPage />}
                {currentView === 'pengaturan' && <PengaturanSistemPage />}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Printable Document Overlays */}
      {printSpkData && (
        <SpkPrintDocument
          order={printSpkData}
          onClose={() => setPrintSpkData(null)}
        />
      )}

      {printReceiptOrder && (
        <ReceiptPrintView
          order={printReceiptOrder}
          onClose={() => setPrintReceiptOrder(null)}
        />
      )}

      {printInvoiceOrder && (
        <InvoicePrintView
          order={printInvoiceOrder}
          onClose={() => setPrintInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
