import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatInvoiceDate, generateWhatsAppUrl } from '../../utils/formatters';

interface InvoicePrintViewProps {
  order: Order;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ order, onClose }) => {
  const { storeSettings } = useApp();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Buat teks WhatsApp profesional
  const generateWhatsAppMessage = () => {
    const store = storeSettings.storeName || 'GFX GRAPHIC';
    const invoiceNo = order.orderNumber || order.spkNumber;
    const dateStr = formatInvoiceDate(order.createdAt);
    const totalStr = `Rp ${order.total.toLocaleString('id-ID')}`;
    const paidStr = `Rp ${order.paidAmount.toLocaleString('id-ID')}`;
    const balanceStr = `Rp ${order.balance.toLocaleString('id-ID')}`;
    const statusStr = order.paymentStatus === 'paid' ? 'LUNAS' : order.paymentStatus === 'dp' ? 'DP (Uang Muka)' : 'BELUM BAYAR';

    let itemsList = '';
    order.items.forEach((it, idx) => {
      const spec = it.lengthM && it.widthM ? ` (${it.lengthM}x${it.widthM}m)` : '';
      itemsList += `${idx + 1}. ${it.productName}${spec} x${it.qty} = Rp ${it.subtotal.toLocaleString('id-ID')}\n`;
    });

    const bankInfo = (storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0)
      ? storeSettings.bankAccounts.map((b) => `• ${b.bankName}: ${b.accountNumber} a.n ${b.accountHolder}`).join('\n')
      : '• BCA: 1300551272 a.n MUHAMAD YAHYA\n• DANA: 085723574540 a.n MUHAMAD YAHYA';

    return `*INVOICE PEMESANAN - ${store.toUpperCase()}*
No. Invoice: #${invoiceNo}
Kepada: *${order.customerName}*
Tanggal: ${dateStr}
----------------------------------------
*Rincian Pesanan:*
${itemsList}----------------------------------------
*Total Tagihan:* ${totalStr}
*Terbayar:* ${paidStr}
*Sisa Tagihan:* ${balanceStr}
*Status:* ${statusStr}
----------------------------------------
*Informasi Rekening Pembayaran:*
${bankInfo}

Terima kasih atas kepercayaan Anda memesan di *${store}*!`;
  };

  // Cetak dokumen
  const handlePrint = () => {
    window.print();
  };

  // Salin teks WhatsApp ke clipboard
  const handleCopyText = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setNotification('✓ Teks Invoice berhasil disalin! Anda bisa langsung tempel (Ctrl+V) di WhatsApp.');
      setTimeout(() => setNotification(''), 4000);
    } catch {
      alert('Gagal menyalin teks ke clipboard.');
    }
  };

  // Unduh Gambar Invoice (PNG) untuk dikirim via WA
  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Kualitas tajam 2x
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const filename = `Invoice_${order.orderNumber || order.spkNumber}_${order.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = dataUrl;
      link.download = filename;
      link.click();

      setNotification(`✓ Gambar Invoice berhasil diunduh sebagai ${filename}! Silakan lampirkan langsung ke chat WhatsApp.`);
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menghasilkan gambar invoice.');
    } finally {
      setIsExporting(false);
    }
  };

  // Salin Gambar langsung ke Clipboard (bisa langsung Ctrl+V di WA Web / Desktop)
  const handleCopyImage = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Gagal membuat gambar invoice.');
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setNotification('✓ Gambar Invoice berhasil disalin ke Clipboard! Buka chat WhatsApp lalu tekan Ctrl + V.');
          setTimeout(() => setNotification(''), 5000);
        } catch {
          // Jika browser membatasi direct clipboard image, tawarkan download
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // Buka WhatsApp Web / App dengan nomor pelanggan dan teks faktur
  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const url = generateWhatsAppUrl(order.customerPhone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white border border-[#cbd5e1] rounded shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="bg-[#1e40af] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs">
              Nota Online / Invoice Digital: <b className="text-amber-200">{order.spkNumber}</b> ({order.customerName})
            </span>
          </div>

          {/* Tombol Aksi Lengkap WA & Gambar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs active:translate-y-0.5 transition-colors cursor-pointer"
              title="Kirim rincian invoice ke nomor WhatsApp pelanggan"
            >
              Kirim ke WA
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#1e40af] rounded text-xs font-bold shadow-xs active:translate-y-0.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Salin gambar invoice untuk langsung di-Paste (Ctrl+V) di WhatsApp Web"
            >
              {isExporting ? 'Memproses...' : 'Salin Gambar (Ctrl+V di WA)'}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0f172a] rounded text-xs font-medium border border-slate-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Unduh file gambar PNG untuk dikirimkan ke pelanggan"
            >
              Unduh Gambar (PNG)
            </button>

            <button
              onClick={handleCopyText}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0f172a] rounded text-xs font-medium border border-slate-300 shadow-xs transition-colors cursor-pointer"
              title="Salin format teks nota ke clipboard"
            >
              Salin Teks
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Cetak langsung atau simpan sebagai PDF"
            >
              Cetak / PDF
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors cursor-pointer ml-1"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* Banner Notifikasi Sukses */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-300 text-emerald-800 px-4 py-1.5 text-xs font-semibold">
            {notification}
          </div>
        )}

        {/* Area Tampilan Invoice (Sesuai Desain di Gambar) */}
        <div className="p-4 overflow-y-auto bg-slate-200 flex justify-center">
          <div
            ref={invoiceRef}
            className="bg-white text-black p-8 w-full max-w-[860px] shadow-md text-xs font-sans select-text leading-tight"
            style={{ minHeight: '520px' }}
          >
            {/* 1. Header Bagian Atas */}
            <div className="flex justify-between items-start pb-2">
              {/* Kiri: Logo & Info Usaha Toko */}
              <div className="flex items-start gap-3 max-w-[55%]">
                <div className="shrink-0 flex items-center justify-center pt-0.5">
                  <img
                    src={storeSettings.appIcon || './favicon.ico'}
                    alt="Logo"
                    className="h-12 w-auto max-w-[140px] object-contain block"
                    style={{ maxHeight: '48px', width: 'auto', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm text-black tracking-wide uppercase">
                    {storeSettings.storeName || 'GFX GRAPHIC'}
                  </h1>
                  <p className="text-[10px] text-black mt-0.5 leading-snug">
                    {storeSettings.address || 'Dusun Ciangir, Kec. Cikoneng Kab. Ciamis Provinsi Jawa Barat Pos 4621'}
                  </p>
                  <p className="text-[10px] text-black font-medium mt-0.5">
                    WA: {storeSettings.whatsapp || '085163594245'}
                  </p>
                </div>
              </div>

              {/* Kanan: Kepada Yth, No. Invoice & Tanggal */}
              <div className="text-right text-[11px] space-y-0.5">
                <p className="text-black">Kepada Yth:</p>
                <p className="font-bold text-black text-xs uppercase">{order.customerName}</p>
                <p className="text-black font-mono text-[10px]">
                  No. Invoice: #{order.orderNumber || order.spkNumber}
                </p>
                <p className="text-black text-[10px]">
                  Tanggal: {formatInvoiceDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Garis Pembatas Horisontal */}
            <div className="border-b border-black my-2"></div>

            {/* 2. Judul Dokumen INVOICE */}
            <div className="text-center py-2.5">
              <h2 className="text-base font-extrabold tracking-[0.3em] text-black uppercase">
                INVOICE
              </h2>
            </div>

            {/* 3. Tabel Item Produk Sesuai Gambar */}
            <div className="mt-1">
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="border-b border-black font-bold text-[10px] text-black bg-[#f8fafc]">
                    <th className="border border-black py-1.5 px-2 text-center w-10">NO</th>
                    <th className="border border-black py-1.5 px-3 text-left">ITEM / PRODUK</th>
                    <th className="border border-black py-1.5 px-2 text-center w-24">MOTIF</th>
                    <th className="border border-black py-1.5 px-2 text-center w-28">UKURAN (P X L)</th>
                    <th className="border border-black py-1.5 px-2 text-center w-14">QTY</th>
                    <th className="border border-black py-1.5 px-2 text-right w-24">HARGA</th>
                    <th className="border border-black py-1.5 px-2 text-right w-28">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const motifText = item.notes || (item.finishingNames.length > 0 ? item.finishingNames.join(', ') : '-');
                    const sizeText = item.lengthM && item.widthM ? `${item.lengthM} x ${item.widthM} m` : (item.unit || '-');

                    return (
                      <tr key={idx} className="border-b border-black">
                        <td className="border border-black py-2 px-2 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-black py-2 px-3 font-medium text-black">
                          {item.productName}
                        </td>
                        <td className="border border-black py-2 px-2 text-center text-[11px]">
                          {motifText}
                        </td>
                        <td className="border border-black py-2 px-2 text-center font-mono text-[11px]">
                          {sizeText}
                        </td>
                        <td className="border border-black py-2 px-2 text-center font-mono font-medium">
                          {item.qty}
                        </td>
                        <td className="border border-black py-2 px-2 text-right font-mono">
                          {item.unitPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="border border-black py-2 px-2 text-right font-mono font-medium">
                          {item.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Bagian Informasi Pembayaran & Rincian Total */}
            <div className="grid grid-cols-2 gap-6 mt-3.5 items-start">
              {/* Kiri: Kotak Informasi Pembayaran */}
              <div className="bg-[#f8fafc] border border-slate-300 rounded p-3 text-[11px] leading-relaxed">
                <p className="font-bold text-black uppercase mb-1">INFORMASI PEMBAYARAN:</p>
                {storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0 ? (
                  storeSettings.bankAccounts.map((b, i) => (
                    <p key={i} className="text-black font-mono">
                      {b.bankName} : {b.accountNumber} a.n {b.accountHolder}
                    </p>
                  ))
                ) : (
                  <>
                    <p className="text-black font-mono">BCA : 1300551272 a.n MUHAMAD YAHYA</p>
                    <p className="text-black font-mono">DANA : 085723574540 a.n MUHAMAD YAHYA</p>
                  </>
                )}

                <div className="mt-2.5 pt-1.5 border-t border-slate-200 text-[11px]">
                  <p className="font-semibold text-black">
                    METODE: {order.paymentMethod ? order.paymentMethod.replace('_', ' ').toUpperCase() : 'TUNAI'}
                  </p>
                  <p className="font-semibold text-black">
                    STATUS: {order.paymentStatus === 'paid' ? 'LUNAS' : order.paymentStatus === 'dp' ? 'DP' : 'BELUM BAYAR'}
                  </p>
                </div>
              </div>

              {/* Kanan: Ringkasan Biaya */}
              <div className="text-xs space-y-1 pl-2">
                <div className="flex justify-between text-black">
                  <span>Sub Total</span>
                  <span className="font-mono">Rp {order.subtotal.toLocaleString('id-ID')}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-black">
                    <span>Diskon</span>
                    <span className="font-mono">-Rp {order.discount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-black text-sm pt-1 border-t border-black">
                  <span>GRAND TOTAL</span>
                  <span className="font-mono">Rp {order.total.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between text-black pt-0.5">
                  <span>DP / Terbayar</span>
                  <span className="font-mono">Rp {order.paidAmount.toLocaleString('id-ID')}</span>
                </div>

                {/* Garis Putus-putus Sesuai Gambar */}
                <div className="border-b border-dashed border-gray-400 my-1"></div>

                {/* Sisa Tagihan Warna Merah Sesuai Gambar */}
                <div className="flex justify-between font-bold text-red-600">
                  <span>Sisa Tagihan</span>
                  <span className="font-mono">Rp {order.balance.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* 5. Tanda Tangan Penerima & Hormat Kami Sesuai Gambar */}
            <div className="grid grid-cols-2 gap-8 mt-14 text-xs">
              <div className="text-center">
                <p className="text-black font-medium">Penerima,</p>
                <div className="h-16"></div>
                <p className="text-black font-medium">(                    )</p>
              </div>

              <div className="text-center">
                <p className="text-black font-medium">Hormat Kami,</p>
                <div className="h-16"></div>
                <p className="text-black font-bold uppercase">
                  {storeSettings.storeName || 'GFX GRAPHIC'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
