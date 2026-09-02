import React, { useRef } from 'react';
import { Printer, X, Download, QrCode, FileCheck, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface SpkPrintDocumentProps {
  order: Order;
  onClose: () => void;
}

export const SpkPrintDocument: React.FC<SpkPrintDocumentProps> = ({ order, onClose }) => {
  const { storeSettings } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (window.electronAPI) {
      window.electronAPI.printDocument({});
    } else {
      window.print();
    }
  };

  const isUrgent = order.priority === 'urgent' || order.priority === 'express';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top bar */}
        <div className="h-12 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-slate-100">
              Surat Perintah Kerja (SPK Produksi Percetakan)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable SPK Document */}
        <div className="p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="bg-white text-slate-900 p-8 w-full max-w-[760px] shadow-2xl rounded-sm print:shadow-none print:p-0 print:w-full text-xs font-sans"
          >
            {/* SPK Header */}
            <div className="flex justify-between items-start pb-4 border-b-4 border-slate-900">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {storeSettings.storeName}
                </h1>
                <p className="text-[11px] font-bold text-slate-600">DIVISI PRODUKSI & WORKSHOP</p>
                <p className="text-[10px] text-slate-500">{storeSettings.address}</p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-4 py-1 rounded font-black text-lg tracking-wider">
                  SPK PRODUKSI
                </div>
                <div className="mt-1.5 font-mono font-bold text-sm text-slate-900">
                  {order.spkNumber}
                </div>
                <div className="text-[10px] text-slate-600">Ref Nota: {order.orderNumber}</div>
              </div>
            </div>

            {/* Urgent / Priority Alert Banner */}
            <div className="grid grid-cols-3 gap-3 my-3">
              <div className={`p-2.5 rounded border ${
                isUrgent ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}>
                <span className="text-[9px] font-bold uppercase block tracking-wider">Prioritas Kerja:</span>
                <span className="text-sm font-black uppercase">
                  {order.priority.toUpperCase()} {isUrgent && '⚠️ CEPAT'}
                </span>
              </div>

              <div className="p-2.5 rounded border border-amber-400 bg-amber-50 text-amber-950">
                <span className="text-[9px] font-bold uppercase block tracking-wider">DEADLINE AMBIL / KIRIM:</span>
                <span className="text-sm font-black text-amber-900">
                  {formatDateTime(order.deadline)}
                </span>
              </div>

              <div className="p-2.5 rounded border border-slate-300 bg-slate-50 text-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold uppercase block tracking-wider">Status Bayar:</span>
                  <span className="text-xs font-bold uppercase">
                    {order.paymentStatus === 'paid' ? '✅ LUNAS' : order.paymentStatus === 'dp' ? '🟡 DP MASUK' : '🔴 TEMPO'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 text-right">
                  {order.pickupType === 'delivery' ? '🚚 Kirim Kurir' : '🏪 Ambil Sendiri'}
                </div>
              </div>
            </div>

            {/* Order & Customer Metadata */}
            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan:</p>
                <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                <p className="text-slate-600 font-mono text-[11px]">WA/HP: {order.customerPhone}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-100 p-2 rounded">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Designer PIC:</span>
                  <span className="font-bold text-purple-900">{order.designerName || 'Tim Desain / Siap Cetak'}</span>
                </div>
                <div className="bg-slate-100 p-2 rounded">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Operator PIC:</span>
                  <span className="font-bold text-blue-900">{order.operatorName || 'Tim Produksi Cetak'}</span>
                </div>
              </div>
            </div>

            {/* Production Specifications Table */}
            <div className="py-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2 flex items-center gap-1.5">
                <span>DETAIL PEKERJAAN & SPESIFIKASI TEKNIS</span>
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border-2 border-slate-800 rounded-lg p-3.5 bg-slate-50/50 space-y-2.5"
                  >
                    {/* Item header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-black text-sm text-slate-900 uppercase">
                          {item.productName}
                        </span>
                      </div>
                      <div className="bg-slate-900 text-white px-3 py-1 rounded font-black text-xs font-mono">
                        JUMLAH: {item.qty} {item.unit.toUpperCase()}
                      </div>
                    </div>

                    {/* Technical Grid */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {/* Material */}
                      <div className="bg-white p-2 rounded border border-slate-300">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Bahan / Media:</span>
                        <span className="font-bold text-slate-900">{item.materialName}</span>
                      </div>

                      {/* Dimension */}
                      <div className="bg-white p-2 rounded border border-slate-300">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Ukuran / Luas:</span>
                        {item.lengthM && item.widthM ? (
                          <span className="font-black text-slate-900 font-mono text-sm">
                            {item.lengthM}m × {item.widthM}m ({item.areaM2} m²)
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900 font-mono">Standar ({item.unit})</span>
                        )}
                      </div>

                      {/* Target Machine */}
                      <div className="bg-white p-2 rounded border border-slate-300">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Mesin Cetak:</span>
                        <span className="font-bold text-blue-800">{item.targetMachine || 'Mesin Standard'}</span>
                      </div>
                    </div>

                    {/* Finishing & Cut Instructions */}
                    <div className="bg-amber-50/70 p-2.5 rounded border border-amber-300 text-xs">
                      <span className="text-[10px] font-black uppercase text-amber-900 block mb-1">
                        PETUNJUK FINISHING & PASCA CETAK:
                      </span>
                      {item.finishingNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.finishingNames.map((fin, fIdx) => (
                            <span
                              key={fIdx}
                              className="bg-white px-2 py-0.5 rounded border border-amber-400 font-bold text-amber-950 text-[11px]"
                            >
                              ✓ {fin}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Tanpa Finishing Tambahan (Potong Rapi Standard)</span>
                      )}
                    </div>

                    {/* File info & Notes */}
                    {(item.fileName || item.fileUrl || item.notes) && (
                      <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-300 space-y-0.5">
                        {item.fileName && (
                          <p>
                            <span className="font-bold">File:</span> {item.fileName}
                          </p>
                        )}
                        {item.fileUrl && (
                          <p className="truncate text-blue-700">
                            <span className="font-bold text-slate-800">Link File:</span> {item.fileUrl}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-rose-700 font-bold">
                            <span className="text-slate-800">Catatan Khusus:</span> {item.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Operator QC Checkboxes & Signatures */}
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-4 gap-3 text-center text-xs">
              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">1. Desain / Prepress</span>
                <div className="my-3 font-bold text-slate-800">[ &nbsp; ] ACC Desain</div>
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-1">Paraf Designer</div>
              </div>

              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">2. Cetak / Print</span>
                <div className="my-3 font-bold text-slate-800">[ &nbsp; ] Cetak OK</div>
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-1">Paraf Operator</div>
              </div>

              <div className="border border-slate-300 p-2 rounded bg-slate-50">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">3. Finishing & QC</span>
                <div className="my-3 font-bold text-slate-800">[ &nbsp; ] QC & Packing OK</div>
                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-1">Paraf Finishing</div>
              </div>

              <div className="border border-slate-300 p-2 rounded bg-slate-50 flex flex-col items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Barcode SPK</span>
                <QRCodeSVG value={order.spkNumber} size={48} />
                <span className="text-[8px] font-mono text-slate-600">{order.spkNumber}</span>
              </div>
            </div>

            {/* Footer warning */}
            <div className="mt-4 text-center text-[9px] text-slate-500 border-t border-slate-200 pt-2 italic">
              {storeSettings.footerSpkNotes}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="h-14 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-3 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar SPK (Ctrl+P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
