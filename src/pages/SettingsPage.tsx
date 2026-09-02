import React, { useState } from 'react';
import {
  Layers,
  Users,
  Building,
  Sliders,
} from 'lucide-react';
import { MasterDataPricing } from '../components/settings/MasterDataPricing';
import { UserManager } from '../components/settings/UserManager';
import { StoreSettings } from '../components/settings/StoreSettings';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'materials' | 'users' | 'store'>('materials');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-400" />
          <span>Master Data & Pengaturan Sistem</span>
        </h2>
        <p className="text-xs text-slate-400">
          Konfigurasi tarif cetak bahan, akun staf pengguna (RBAC), serta profil percetakan dan rekening nota
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'materials'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Master Tarif Bahan & Finishing</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Manajemen Akun Staf (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'store'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>3. Profil Toko & Rekening</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'materials' && <MasterDataPricing />}
      {activeTab === 'users' && <UserManager />}
      {activeTab === 'store' && <StoreSettings />}
    </div>
  );
};
