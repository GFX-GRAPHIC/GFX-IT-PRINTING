import React from 'react';
import { Search, Plus, Printer, RefreshCw, Bell, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewOrder: () => void;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  title,
  subtitle,
}) => {
  const { canCreateOrder } = useAuth();
  const { storeSettings, orders } = useApp();

  // Check for urgent / pending items
  const urgentOrders = orders.filter(
    (o) => o.priority === 'urgent' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Title & Shop Info */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>{title}</span>
          {urgentOrders.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
              <AlertCircle className="w-3 h-3" />
              {urgentOrders.length} Pesanan Urgent
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-400">
          {subtitle || `${storeSettings.storeName} — ${storeSettings.city}`}
        </p>
      </div>

      {/* Global Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-72 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Order, SPK, Pelanggan... (F2)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-sans"
          />
        </div>

        {/* Quick Add Order */}
        {canCreateOrder && (
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Order Baru</span>
          </button>
        )}
      </div>
    </header>
  );
};
