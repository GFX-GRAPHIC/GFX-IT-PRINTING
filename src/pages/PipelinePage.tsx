import React from 'react';
import { KanbanBoard } from '../components/pipeline/KanbanBoard';
import { Order } from '../types';

interface PipelinePageProps {
  onSelectOrder: (order: Order) => void;
  onOpenSpkPrint: (order: Order) => void;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({
  onSelectOrder,
  onOpenSpkPrint,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Info */}
      <div className="px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Pipeline Alur Kerja Pesanan Percetakan</h2>
          <p className="text-[11px] text-slate-400">
            Geser atau klik tombol "Lanjut" untuk memindahkan status kerja dari Antrean hingga Selesai
          </p>
        </div>
      </div>

      {/* Board */}
      <KanbanBoard onSelectOrder={onSelectOrder} onOpenSpkPrint={onOpenSpkPrint} />
    </div>
  );
};
