import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  FileText,
  Kanban,
  Palette,
  Printer,
  Users,
  BarChart3,
  Receipt,
  Settings,
  Lock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export type NavPage =
  | 'dashboard'
  | 'pos_orders'
  | 'spk_list'
  | 'pipeline'
  | 'designer_workspace'
  | 'operator_workspace'
  | 'customers'
  | 'reports'
  | 'expenses'
  | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onOpenNewOrder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenNewOrder,
}) => {
  const { currentUser, isOwner, canCreateOrder } = useAuth();
  const { orders } = useApp();

  // Counts for badges
  const designCount = orders.filter((o) => o.status === 'design').length;
  const productionCount = orders.filter((o) => o.status === 'production' || o.status === 'finishing').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const activeTotal = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'admin', 'designer', 'operator'],
    },
    {
      id: 'pos_orders' as NavPage,
      label: 'Daftar Pesanan',
      icon: ClipboardList,
      roles: ['owner', 'admin'],
      badge: activeTotal > 0 ? activeTotal : undefined,
    },
    {
      id: 'pipeline' as NavPage,
      label: 'Pipeline Alur Kerja',
      icon: Kanban,
      roles: ['owner', 'admin', 'designer', 'operator'],
      badge: pendingCount > 0 ? `${pendingCount} baru` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'spk_list' as NavPage,
      label: 'Surat Perintah Kerja (SPK)',
      icon: FileText,
      roles: ['owner', 'admin', 'designer', 'operator'],
    },
    {
      id: 'designer_workspace' as NavPage,
      label: 'Antrean Desain',
      icon: Palette,
      roles: ['owner', 'designer', 'admin'],
      badge: designCount > 0 ? designCount : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
    {
      id: 'operator_workspace' as NavPage,
      label: 'Antrean Produksi & Mesin',
      icon: Printer,
      roles: ['owner', 'operator', 'admin'],
      badge: productionCount > 0 ? productionCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    {
      id: 'customers' as NavPage,
      label: 'Data Pelanggan (CRM)',
      icon: Users,
      roles: ['owner', 'admin'],
    },
    {
      id: 'expenses' as NavPage,
      label: 'Pengeluaran Kas',
      icon: Receipt,
      roles: ['owner', 'admin'],
    },
    {
      id: 'reports' as NavPage,
      label: 'Laporan & Keuangan',
      icon: BarChart3,
      roles: ['owner'],
      lockedForOthers: true,
    },
    {
      id: 'settings' as NavPage,
      label: 'Master Data & Setting',
      icon: Settings,
      roles: ['owner'],
      lockedForOthers: true,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Top Action: New Order Button */}
      <div className="p-3.5 space-y-3">
        {canCreateOrder && (
          <button
            onClick={onOpenNewOrder}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pesanan Masuk (F1)</span>
          </button>
        )}

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const hasAccess = item.roles.includes(currentUser.role);
            const isCurrent = currentPage === item.id;
            const Icon = item.icon;

            if (!hasAccess && !item.lockedForOthers) {
              return null; // hide completely for role
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (hasAccess) onNavigate(item.id);
                }}
                disabled={!hasAccess}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm'
                    : hasAccess
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    : 'text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!hasAccess && item.lockedForOthers && (
                    <span title="Khusus Owner">
                      <Lock className="w-3 h-3 text-slate-600" />
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-brand-500/20 text-brand-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Shortcuts / Status Card */}
      <div className="p-3 border-t border-slate-850">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
            <span>Shortcut Cepat</span>
            <span className="text-brand-400">Desktop Key</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Pesanan Baru:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">F1</kbd>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Cari Pesanan:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">F2</kbd>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Cetak SPK:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">F3</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
};
