import React, { useRef } from 'react';
import { Printer, X, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime, formatRupiah, getPaymentStatusBadge } from '../../utils/formatters';

interface ReceiptPrintViewProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({ order, onClose }) => {
  const { storeSettings } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (window.electronAPI) {
      window.electronAPI.printThermal({});
    } else {
      window.print();
    }
  };

  const paymentBadge = getPaymentStatusBadge(order.paymentStatus);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-100">Pratinjau Struk Kasir (Thermal)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt */}
        <div className="p-6 overflow-y-auto bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="bg-white text-black p-5 font-mono text-[11px] leading-tight w-[300px] shadow-lg rounded-sm print:w-full print:p-0 print:shadow-none"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="font-bold text-sm tracking-wider uppercase">{storeSettings.storeName}</h2>
              <p className="text-[10px] text-gray-700 mt-0.5">{storeSettings.tagline}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">{storeSettings.address}</p>
              <p className="text-[9px] text-gray-600">Telp/WA: {storeSettings.whatsapp}</p>
            </div>

            {/* Order Info */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>No. SPK:</span>
                <span>{order.spkNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold truncate max-w-[150px]">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Bayar:</span>
                <span className="font-bold uppercase">
                  [{order.paymentStatus === 'paid' ? 'LUNAS' : order.paymentStatus === 'dp' ? 'DP / TITIP' : 'TEMPO'}]
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold flex justify-between">
                    <span className="truncate max-w-[200px]">{item.productName}</span>
                  </div>
                  <div className="text-[9px] text-gray-700">
                    {item.materialName}
                    {item.lengthM && item.widthM && ` (${item.lengthM}x${item.widthM}m = ${item.areaM2}m²)`}
                  </div>
                  {item.finishingNames.length > 0 && (
                    <div className="text-[9px] text-gray-600">
                      Finishing: {item.finishingNames.join(', ')}
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span>
                      {item.qty} {item.unit} x {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span>PPN:</span>
                  <span>+{formatRupiah(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-dotted border-gray-300">
                <span>TOTAL:</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar ({order.paymentMethod.toUpperCase()}):</span>
                <span>{formatRupiah(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Sisa Tagihan:</span>
                <span>{formatRupiah(order.balance)}</span>
              </div>
            </div>

            {/* QR Code & Pickup Note */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center">
                <QRCodeSVG value={order.spkNumber} size={64} />
              </div>
              <div className="text-[9px] font-bold tracking-widest">{order.spkNumber}</div>
              <p className="text-[8px] text-gray-600 leading-tight italic">
                {storeSettings.footerReceiptNotes}
              </p>
              <p className="text-[9px] font-bold uppercase mt-1">*** TERIMA KASIH ***</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-3 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Thermal (Ctrl+P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
