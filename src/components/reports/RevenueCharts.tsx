import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Order } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface RevenueChartsProps {
  orders: Order[];
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ orders }) => {
  // 1. Group daily revenue for the past 7 days
  const dailyData: Record<string, { date: string; omset: number; count: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    dailyData[key] = { date: key, omset: 0, count: 0 };
  }

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    if (dailyData[key]) {
      dailyData[key].omset += o.total;
      dailyData[key].count += 1;
    }
  });

  const dailyChartData = Object.values(dailyData);

  // 2. Category distribution
  const categoryTotals: Record<string, number> = {
    'Large Format / Outdoor': 0,
    'Digital Print A3+': 0,
    'Merchandise & Sablon': 0,
    'Offset & Dokumen': 0,
    'Jasa Desain': 0,
  };

  orders.forEach((o) => {
    o.items.forEach((it) => {
      if (it.category === 'large_format') categoryTotals['Large Format / Outdoor'] += it.subtotal;
      else if (it.category === 'digital_a3') categoryTotals['Digital Print A3+'] += it.subtotal;
      else if (it.category === 'merchandise') categoryTotals['Merchandise & Sablon'] += it.subtotal;
      else if (it.category === 'offset_doc') categoryTotals['Offset & Dokumen'] += it.subtotal;
      else categoryTotals['Jasa Desain'] += it.subtotal;
    });
  });

  const categoryChartData = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Daily Revenue Bar Chart */}
      <div className="lg:col-span-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Tren Omset Penjualan (7 Hari Terakhir)
            </h3>
            <p className="text-[11px] text-slate-400">Total nilai pesanan masuk per hari</p>
          </div>
          <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
            {formatRupiah(orders.reduce((acc, curr) => acc + curr.total, 0))} Total
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: number) => [formatRupiah(val), 'Omset']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Bar dataKey="omset" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Pie Chart */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Distribusi Omset per Kategori
          </h3>
          <p className="text-[11px] text-slate-400">Porsi kontribusi pendapatan cetak</p>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatRupiah(val), 'Pendapatan']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="space-y-1 text-[11px]">
          {categoryChartData.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.name}</span>
              </div>
              <span className="font-mono text-slate-400">{formatRupiah(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
