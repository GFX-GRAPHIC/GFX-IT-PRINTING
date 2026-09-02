import React from 'react';
import { Printer, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { CashierShift } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface ShiftReceiptDocumentProps {
  shift: CashierShift;
  onClose: () => void;
}

export const ShiftReceiptDocument: React.FC<ShiftReceiptDocumentProps> = ({ shift, onClose }) => {
  const { storeSettings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const isBalanced = (shift.difference || 0) === 0;
  const isShortage = (shift.difference || 0) < 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex justify-center p-4 print:p-0 print:bg-white print:static print:h-auto">
      {/* Thermal Receipt Container (80mm standard width) */}
      <div className="bg-white w-full max-w-[95mm] min-h-[160mm] p-6 my-auto shadow-2xl flex flex-col justify-between text-black font-mono text-xs print:shadow-none print:m-0 print:p-2 print:w-full">
        {/* Floating Print Toolbar */}
        <div className="flex items-center justify-between border-b pb-3 mb-4 print:hidden font-sans">
          <div className="flex items-center gap-1 text-xs font-bold text-[#0f172a]">
            <Printer className="w-4 h-4 text-[#1e40af]" />
            <span>Struk Tutup Shift Kasir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-xs flex items-center gap-1 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-black rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= RECEIPT CONTENT ================= */}
        <div className="space-y-3">
          {/* Header */}
          <div className="text-center border-b border-dashed border-black pb-2">
            <h2 className="font-extrabold text-sm uppercase tracking-wider">
              {storeSettings.storeName || 'CETAKPRO PRINTING'}
            </h2>
            <p className="text-[10px] text-gray-600">{storeSettings.address || 'Jl. R.E. Martadinata No. 108'}</p>
            <p className="text-[10px] text-gray-600">Telp: {storeSettings.phone || '022-7201999'}</p>
            <div className="mt-2 inline-block border border-black px-2 py-0.5 font-bold text-[11px] uppercase">
              LAPORAN TUTUP SHIFT (Z-REPORT)
            </div>
          </div>

          {/* Shift Details */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-black pb-2">
            <div className="flex justify-between">
              <span>No. Shift:</span>
              <span className="font-bold">{shift.shiftNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Nama Kasir:</span>
              <span className="font-bold">{shift.cashierName}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Buka Shift:</span>
              <span>{formatDate(shift.startTime)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Tutup Shift:</span>
              <span>{shift.endTime ? formatDate(shift.endTime) : '-'}</span>
            </div>
          </div>

          {/* Rekap Arus Kas (Cash Flow Reconciliation) */}
          <div className="space-y-1 text-xs border-b border-dashed border-black pb-2">
            <div className="font-bold text-[10px] uppercase text-gray-700 mb-1">
              REKONSILIASI KAS LACI:
            </div>
            <div className="flex justify-between">
              <span>(+) Modal Kas Awal:</span>
              <span className="font-bold">{formatRupiah(shift.openingCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Penjualan Tunai:</span>
              <span className="font-bold text-emerald-800">+{formatRupiah(shift.totalCashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Pengeluaran Kas:</span>
              <span className="font-bold text-rose-700">-{formatRupiah(shift.totalExpenses)}</span>
            </div>
            <div className="border-t border-black pt-1 flex justify-between font-bold text-[12px]">
              <span>(=) Ekspektasi Kas:</span>
              <span>{formatRupiah(shift.expectedCash)}</span>
            </div>
            <div className="flex justify-between font-bold text-[12px] bg-gray-100 p-1">
              <span>Uang Fisik Dihitung:</span>
              <span>{formatRupiah(shift.actualCash || 0)}</span>
            </div>

            {/* Selisih Box */}
            <div
              className={`p-1.5 text-center font-bold text-[11px] rounded border ${
                isBalanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isShortage
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isBalanced ? (
                <span>✓ KAS SEIMBANG (SELISIH: Rp 0)</span>
              ) : isShortage ? (
                <span>⚠️ SELISIH KURANG: {formatRupiah(shift.difference || 0)}</span>
              ) : (
                <span>ℹ️ SELISIH LEBIH: +{formatRupiah(shift.difference || 0)}</span>
              )}
            </div>
          </div>

          {/* Rekap Penjualan Non-Tunai */}
          <div className="space-y-1 text-xs border-b border-dashed border-black pb-2">
            <div className="font-bold text-[10px] uppercase text-gray-700 mb-1">
              PENJUALAN NON-TUNAI (BANK / QRIS):
            </div>
            <div className="flex justify-between">
              <span>Total Non-Tunai:</span>
              <span className="font-bold">{formatRupiah(shift.totalNonCashSales)}</span>
            </div>
            <div className="border-t border-gray-300 pt-1 flex justify-between font-extrabold text-[12px]">
              <span>TOTAL OMSET SHIFT:</span>
              <span>{formatRupiah(shift.totalCashSales + shift.totalNonCashSales)}</span>
            </div>
          </div>

          {/* Catatan Shift */}
          {shift.closingNotes && (
            <div className="text-[10px] border-b border-dashed border-black pb-2">
              <span className="font-bold block">Catatan Kasir:</span>
              <p className="text-gray-700 italic">{shift.closingNotes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-2 text-center text-[10px] space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block">Kasir Bertugas,</span>
                <div className="h-10"></div>
                <span className="border-t border-black px-4 font-bold block">
                  {shift.cashierName.split(' ')[0]}
                </span>
              </div>

              <div>
                <span className="block">Owner / Penerima Kas,</span>
                <div className="h-10"></div>
                <span className="border-t border-black px-4 font-bold block">
                  ( Yahya - Owner )
                </span>
              </div>
            </div>

            <p className="text-[9px] text-gray-500 italic">
              Simpan bukti struk tutup shift ini beserta fisik uang setoran kasir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
