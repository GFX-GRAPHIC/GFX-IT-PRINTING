import React from 'react';
import { Printer, X } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface PoPrintDocumentProps {
  po: PurchaseOrder;
  onClose: () => void;
}

// Helper untuk terbilang rupiah
const terbilangRupiah = (nominal: number): string => {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  const konversi = (n: number): string => {
    if (n < 12) return bilangan[n];
    if (n < 20) return konversi(n - 10) + ' Belas';
    if (n < 100) return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    if (n < 200) return 'Seratus ' + konversi(n - 100);
    if (n < 1000) return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    if (n < 2000) return 'Seribu ' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    return konversi(Math.floor(n / 1000000000)) + ' Milyar ' + konversi(n % 1000000000);
  };

  if (nominal === 0) return 'Nol Rupiah';
  return `${konversi(Math.floor(nominal)).trim()} Rupiah`;
};

export const PoPrintDocument: React.FC<PoPrintDocumentProps> = ({ po, onClose }) => {
  const { storeSettings } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const getPaymentTermLabel = (term: string) => {
    if (term === 'cash') return 'Tunai / Cash Before Delivery';
    if (term === 'cod') return 'Cash On Delivery (COD)';
    if (term === 'tempo_7') return 'Tempo 7 Hari';
    if (term === 'tempo_14') return 'Tempo 14 Hari';
    if (term === 'tempo_30') return 'Tempo 30 Hari';
    return term.toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex justify-center p-4 print:p-0 print:bg-white print:static print:h-auto">
      {/* Container A4 Sheet */}
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 my-auto shadow-2xl flex flex-col justify-between text-black font-sans print:shadow-none print:m-0 print:p-6 print:w-full">
        {/* Floating Print Toolbar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#1e40af]" />
            <span className="font-bold text-sm text-[#0f172a]">
              Pratinjau Cetak Surat Purchase Order Resmi: <b>{po.poNumber}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PO (Printer A4)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#334155] font-medium rounded text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* ================= OFFICIAL PO HEADER (KOP SURAT) ================= */}
        <div>
          <div className="border-b-2 border-black pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-extrabold tracking-wider uppercase text-black">
                  {storeSettings.storeName || 'CETAKPRO DIGITAL & OFFSET PRINTING'}
                </h1>
                <p className="text-xs text-gray-700 font-medium">
                  {storeSettings.tagline || 'Spesialis Percetakan Outdoor, Indoor, Digital A3+, Merchandise & Offset'}
                </p>
                <p className="text-xs text-gray-600">
                  {storeSettings.address || 'Jl. R.E. Martadinata No. 108'}, {storeSettings.city || 'Bandung'}
                </p>
                <p className="text-xs text-gray-600 font-mono">
                  Telp: {storeSettings.phone || '022-7201999'} | WA: {storeSettings.whatsapp || '081234567890'} | Email: {storeSettings.email || 'purchasing@cetakpro.com'}
                </p>
              </div>

              <div className="text-right">
                <div className="bg-black text-white px-3 py-1 font-bold text-sm tracking-widest uppercase inline-block">
                  PURCHASE ORDER
                </div>
                <div className="mt-2 text-xs font-mono font-bold">
                  <div>NO. PO: <span className="text-base text-[#1e40af]">{po.poNumber}</span></div>
                  <div className="text-gray-600 font-normal">Tgl: {formatDate(po.date)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= SUPPLIER & PO INFO BOXES ================= */}
          <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
            {/* Left: Supplier Info */}
            <div className="border border-black p-3 rounded-xs">
              <span className="font-bold uppercase tracking-wider block text-gray-700 border-b border-gray-300 pb-1 mb-1.5 text-[11px]">
                KEPADA YTH. (SUPPLIER / VENDOR):
              </span>
              <div className="font-extrabold text-sm text-black">{po.supplierName}</div>
              {po.supplierContactPerson && (
                <div className="text-gray-700 font-medium">Up / PIC: {po.supplierContactPerson}</div>
              )}
              {po.supplierPhone && (
                <div className="text-gray-700 font-mono">Telp / WA: {po.supplierPhone}</div>
              )}
              {po.supplierAddress && (
                <div className="text-gray-600 mt-1 leading-snug">{po.supplierAddress}</div>
              )}
            </div>

            {/* Right: Terms & Delivery Info */}
            <div className="border border-black p-3 rounded-xs space-y-1.5 bg-gray-50/50">
              <span className="font-bold uppercase tracking-wider block text-gray-700 border-b border-gray-300 pb-1 mb-1 text-[11px]">
                KETENTUAN PEMBELIAN:
              </span>
              <div className="flex justify-between">
                <span className="text-gray-600">Syarat Pembayaran:</span>
                <span className="font-bold text-black font-mono">{getPaymentTermLabel(po.paymentTerms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat Kirim:</span>
                <span className="font-bold text-black text-right">Workshop {storeSettings.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diterbitkan Oleh:</span>
                <span className="font-mono text-black">{po.createdBy || 'Bagian Pembelian'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status Dokumen:</span>
                <span className="font-bold uppercase text-black font-mono">
                  {po.status === 'received' ? '✓ DITERIMA' : po.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ================= ITEMS TABLE ================= */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-200 text-black font-bold uppercase text-[11px] border-b border-black">
                  <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
                  <th className="border border-black px-3 py-1.5 text-left">Deskripsi Bahan / Barang & Spesifikasi</th>
                  <th className="border border-black px-2 py-1.5 text-center w-16">Qty</th>
                  <th className="border border-black px-2 py-1.5 text-center w-16">Satuan</th>
                  <th className="border border-black px-3 py-1.5 text-right w-28">Harga Satuan</th>
                  <th className="border border-black px-3 py-1.5 text-right w-32">Subtotal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {po.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-black px-2 py-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black px-3 py-2">
                      <span className="font-bold text-black block">{item.itemName}</span>
                      {item.notes && (
                        <span className="text-[10px] text-gray-600 italic block">{item.notes}</span>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold font-mono text-sm">
                      {item.qty}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-semibold uppercase text-gray-700">
                      {item.unit}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-mono">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-mono font-bold">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}

                {/* Empty filler rows if items are few */}
                {po.items.length < 4 &&
                  Array.from({ length: 4 - po.items.length }).map((_, i) => (
                    <tr key={`fill-${i}`}>
                      <td className="border border-black py-3 text-center">&nbsp;</td>
                      <td className="border border-black py-3">&nbsp;</td>
                      <td className="border border-black py-3">&nbsp;</td>
                      <td className="border border-black py-3">&nbsp;</td>
                      <td className="border border-black py-3">&nbsp;</td>
                      <td className="border border-black py-3">&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ================= TOTALS & NOTES ================= */}
          <div className="grid grid-cols-12 gap-4 mb-6 text-xs">
            {/* Left: Terbilang & Catatan */}
            <div className="col-span-7 space-y-2">
              <div className="bg-gray-50 border border-gray-300 p-2.5 rounded-xs">
                <span className="font-bold text-[10px] text-gray-600 uppercase block">TERBILANG:</span>
                <span className="italic font-bold text-black">
                  # {terbilangRupiah(po.totalAmount)} #
                </span>
              </div>

              {po.notes && (
                <div className="border border-gray-300 p-2 rounded-xs">
                  <span className="font-bold text-[10px] text-gray-600 uppercase block">CATATAN PENGIRIMAN:</span>
                  <p className="text-gray-800 text-[11px] leading-snug">{po.notes}</p>
                </div>
              )}

              <div className="text-[10px] text-gray-500 leading-tight">
                * Harap cantumkan Nomor PO ini pada Surat Jalan dan Faktur Pengiriman Barang.
                <br />
                * Barang yang dikirim harus sesuai dengan spesifikasi dan standar kualitas yang tertera.
              </div>
            </div>

            {/* Right: Subtotal, Ongkir, PPN, Grand Total */}
            <div className="col-span-5 border border-black p-3 space-y-1 bg-gray-50 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-gray-700">Subtotal Barang:</span>
                <span className="font-bold">{formatRupiah(po.subtotal)}</span>
              </div>
              {po.shippingCost ? (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700">Ongkos Kirim:</span>
                  <span className="font-bold">{formatRupiah(po.shippingCost)}</span>
                </div>
              ) : null}
              {po.taxAmount ? (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700">PPN ({po.taxPercent || 11}%):</span>
                  <span className="font-bold">{formatRupiah(po.taxAmount)}</span>
                </div>
              ) : null}
              <div className="border-t-2 border-black pt-1.5 mt-1.5 flex justify-between items-center text-sm font-extrabold">
                <span className="text-black uppercase">TOTAL NILAI PO:</span>
                <span className="text-base text-black">{formatRupiah(po.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= OFFICIAL SIGNATURES ================= */}
        <div className="border-t-2 border-black pt-4 mt-6">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            {/* Signature 1: Dibuat Oleh */}
            <div>
              <span className="text-gray-700 block mb-1">Dibuat Oleh,</span>
              <span className="font-bold block text-[10px] text-gray-500 uppercase">Bagian Purchasing / Admin</span>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-black w-36 font-bold pb-0.5 font-mono">
                  {po.createdBy || '( Sinta / Admin )'}
                </span>
              </div>
            </div>

            {/* Signature 2: Disetujui Oleh */}
            <div>
              <span className="text-gray-700 block mb-1">Disetujui Oleh,</span>
              <span className="font-bold block text-[10px] text-gray-500 uppercase">Pimpinan / Direktur</span>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-black w-36 font-bold pb-0.5 font-mono">
                  {po.approvedBy || '( Yahya - Owner )'}
                </span>
              </div>
            </div>

            {/* Signature 3: Diterima Supplier */}
            <div>
              <span className="text-gray-700 block mb-1">Konfirmasi Penerimaan,</span>
              <span className="font-bold block text-[10px] text-gray-500 uppercase">Pihak Supplier / Vendor</span>
              <div className="h-16 flex items-end justify-center">
                <span className="border-b border-black w-36 font-bold pb-0.5 font-mono">
                  ( Tanda Tangan & Cap )
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
