import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { JerseyPlayerItem, JerseySizeGroup, JerseyMatrixSummary, JerseySleeveType, JerseyRoleType } from '../types';
import {
  parseRawJerseyList,
  groupJerseyListBySize,
  formatJerseyWhatsAppText,
  generateJerseyCsvContent,
  normalizeJerseySize,
} from '../utils/jerseyParser';
import { extractTextFromImage, OcrProgressInfo } from '../utils/ocrService';
import { formatRupiah } from '../utils/formatters';
import { sanitizeText } from '../utils/security';

interface PerapihJerseyPageProps {
  onImportToSpk?: (items: Array<{ item: string; file: string; p: string; l: string; byk: number; catatan: string }>) => void;
}

export const PerapihJerseyPage: React.FC<PerapihJerseyPageProps> = ({ onImportToSpk }) => {
  // 1. Order / Team Info
  const [teamName, setTeamName] = useState('FC GARUDA NUSANTARA');
  const [jerseyFabric, setJerseyFabric] = useState('Dryfit Milano');
  const [printType, setPrintType] = useState('Full Printing Sublimasi');
  const [unitPrice, setUnitPrice] = useState<number>(125000);

  // 2. Input Mode ('text' or 'ocr')
  const [inputMode, setInputMode] = useState<'text' | 'ocr'>('text');
  const [rawText, setRawText] = useState(`Budi 10 L Pendek
Doni 7 XL Panjang
Bayu 1 (GK) XXL Lengan Panjang
Rian 23 M Pendek
Ahmad 9 S Pendek
Eko 14 L Pendek
Siti 8 M Hijab/Tunik
Daffa 12 Size 8 Anak
Yoga 33 M Pendek
Reza 99 M Pendek
Dimas 17 XL Panjang
Bambang 5 L Pendek`);

  // OCR state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgressInfo | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // 3. Parsed Data
  const [players, setPlayers] = useState<JerseyPlayerItem[]>([]);
  const [groups, setGroups] = useState<JerseySizeGroup[]>([]);
  const [summary, setSummary] = useState<JerseyMatrixSummary>({
    totalPlayers: 0,
    totalPcs: 0,
    sizeCounts: {},
    sleeveCounts: { pendek: 0, panjang: 0, other: 0 },
    roleCounts: { pemain: 0, kiper: 0, official: 0, other: 0 },
  });

  // UI States
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [activeTabSize, setActiveTabSize] = useState<string | 'all'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run initial parse on mount
  useEffect(() => {
    handleProcessParse(rawText);
  }, []);

  // Handle parse trigger
  const handleProcessParse = (inputString: string) => {
    const parsedList = parseRawJerseyList(inputString);
    setPlayers(parsedList);
    const { groups: grps, summary: sum } = groupJerseyListBySize(parsedList);
    setGroups(grps);
    setSummary(sum);
  };

  // Re-calculate groups whenever players array is edited manually
  useEffect(() => {
    const { groups: grps, summary: sum } = groupJerseyListBySize(players);
    setGroups(grps);
    setSummary(sum);
  }, [players]);

  // Handle OCR file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setOcrError(null);
    }
  };

  // Handle Clipboard Paste (Ctrl+V) for image anywhere on page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (inputMode !== 'ocr') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setSelectedImage(file);
            const url = URL.createObjectURL(file);
            setImagePreviewUrl(url);
            setOcrError(null);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [inputMode]);

  // Execute OCR scan
  const handleRunOcr = async () => {
    if (!selectedImage && !imagePreviewUrl) {
      setOcrError('Silakan pilih foto/gambar list jersey terlebih dahulu.');
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    try {
      const recognized = await extractTextFromImage(selectedImage || imagePreviewUrl!, (info) => {
        setOcrProgress(info);
      });

      setRawText(recognized);
      handleProcessParse(recognized);
      setInputMode('text');
    } catch (err: any) {
      setOcrError(err?.message || 'Gagal mengenali teks dari gambar.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(null);
    }
  };

  // Player Row Inline Edit
  const handleUpdatePlayer = (id: string, field: keyof JerseyPlayerItem, value: any) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (field === 'size') {
            return { ...p, [field]: normalizeJerseySize(value) };
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // Delete Player
  const handleDeletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  // Add New Player Row
  const handleAddNewPlayer = (defaultSize: string = 'L') => {
    const newPlayer: JerseyPlayerItem = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: 'PEMAIN BARU',
      number: '99',
      size: defaultSize,
      sleeve: 'pendek',
      role: 'pemain',
      qty: 1,
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  // Export: Copy to WhatsApp
  const handleCopyWhatsApp = () => {
    const formatted = formatJerseyWhatsAppText(teamName, groups, summary);
    navigator.clipboard.writeText(formatted);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Export: Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Daftar Pemain
      const playersData: any[] = [];
      let no = 1;
      for (const grp of groups) {
        for (const p of grp.players) {
          playersData.push({
            No: no++,
            'Ukuran (Size)': grp.size,
            'Nama Punggung': p.name,
            'Nomor Punggung': p.number,
            'Model Lengan': p.sleeve.toUpperCase(),
            Peran: p.role.toUpperCase(),
            Keterangan: p.notes || '-',
          });
        }
      }
      const wsPlayers = XLSX.utils.json_to_sheet(playersData);
      XLSX.utils.book_append_sheet(wb, wsPlayers, 'Daftar Pemain');

      // Sheet 2: Rekap Matriks Ukuran
      const matrixData = Object.entries(summary.sizeCounts).map(([sz, count]) => ({
        'Ukuran (Size)': sz,
        'Jumlah (Pcs)': count,
      }));
      matrixData.push({
        'Ukuran (Size)': 'TOTAL PCS',
        'Jumlah (Pcs)': summary.totalPcs,
      });
      const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Rekap Ukuran');

      const fileName = `Rekap_Jersey_${teamName.replace(/[^a-zA-Z0-9]/g, '_') || 'CetakPro'}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Export Excel Error:', err);
      const csv = generateJerseyCsvContent(teamName, groups, summary);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekap_Jersey_${teamName || 'CetakPro'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Export: Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Transfer to Input SPK
  const handleTransferToSpk = () => {
    if (onImportToSpk) {
      const spkItems = groups.map((grp) => {
        const playerSummary = grp.players
          .map((p) => `${p.name} #${p.number}${p.sleeve === 'panjang' ? ' (Pjg)' : ''}`)
          .join(', ');

        return {
          item: `Jersey ${teamName || 'Custom'} [Size: ${grp.size}] - ${jerseyFabric}`,
          file: `${teamName || 'Jersey'}_Size_${grp.size}`,
          p: '0',
          l: '0',
          byk: grp.totalQty,
          catatan: `Size ${grp.size} (${grp.totalQty} pcs): ${playerSummary}`,
        };
      });

      onImportToSpk(spkItems);
    }
  };

  // Open CorelDRAW Auto-Layout Companion Tool
  const handleOpenCorelTool = async () => {
    try {
      if ((window as any).electronAPI && (window as any).electronAPI.corelOpenCompanionTool) {
        await (window as any).electronAPI.corelOpenCompanionTool({
          teamName: teamName || 'GFX IT PRINTING',
          players,
          groups,
          summary,
        });
      } else {
        alert('Fitur koneksi CorelDRAW hanya dapat dijalankan di aplikasi desktop Windows.');
      }
    } catch (err: any) {
      alert(`Gagal membuka tool CorelDRAW: ${err?.message || err}`);
    }
  };

  // Filtered players for table view
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSize = activeTabSize === 'all' || p.size === activeTabSize;

    return matchesSearch && matchesSize;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0f19] text-[#0f172a] dark:text-[#f8fafc] overflow-y-auto print:bg-white print:text-black">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-[#0f172a] border-b border-[#cbd5e1] dark:border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#0f172a] dark:text-slate-100 tracking-tight">
              Perapih List Pesanan & Ukuran Jersey
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#eff6ff] dark:bg-slate-800 text-[#1e40af] dark:text-slate-300 rounded border border-[#cbd5e1] dark:border-slate-700">
              Modul Desain
            </span>
          </div>
          <p className="text-[11px] text-[#64748b] dark:text-slate-400 mt-0.5">
            Penyusun otomatis daftar nama, nomor, dan size jersey dari chat atau scan gambar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-[#eff6ff] text-[#1e40af] dark:text-slate-200 border border-[#cbd5e1] dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedNotification ? 'Tersalin ke Clipboard!' : 'Salin Teks WA'}
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-[#eff6ff] text-[#1e40af] dark:text-slate-200 border border-[#cbd5e1] dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Export Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-8 px-3 rounded bg-white dark:bg-slate-800 hover:bg-[#eff6ff] text-[#334155] dark:text-slate-200 border border-[#cbd5e1] dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Cetak / PDF
          </button>

          <button
            type="button"
            onClick={handleOpenCorelTool}
            className="h-8 px-3.5 rounded bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Buka Aplikasi Khusus Tata Pola CorelDRAW Otomatis"
          >
            Tata di CorelDRAW
          </button>

          {onImportToSpk && (
            <button
              type="button"
              onClick={handleTransferToSpk}
              className="h-8 px-3.5 rounded bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Impor ke SPK
            </button>
          )}
        </div>
      </div>

      <div className="p-5 max-w-7xl mx-auto w-full space-y-4">
        {/* 2. Order Metadata Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-[#cbd5e1] dark:border-slate-800 p-3.5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 print:border-none print:p-0">
          <div>
            <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-400 mb-1">
              Nama Tim / Artikel Jersey
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(sanitizeText(e.target.value, 60))}
              placeholder="Contoh: FC GARUDA NUSANTARA"
              className="w-full h-8 px-2.5 text-xs font-bold text-[#0f172a] dark:text-slate-100 bg-[#f8fafc] dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1e40af] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-400 mb-1">
              Bahan Kain Jersey
            </label>
            <input
              type="text"
              value={jerseyFabric}
              onChange={(e) => setJerseyFabric(sanitizeText(e.target.value, 40))}
              placeholder="Contoh: Dryfit Milano / Benzema"
              className="w-full h-8 px-2.5 text-xs text-[#0f172a] dark:text-slate-100 bg-[#f8fafc] dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1e40af] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-400 mb-1">
              Jenis Sablon / Cetak
            </label>
            <input
              type="text"
              value={printType}
              onChange={(e) => setPrintType(sanitizeText(e.target.value, 40))}
              placeholder="Contoh: Full Printing Sublimasi"
              className="w-full h-8 px-2.5 text-xs text-[#0f172a] dark:text-slate-100 bg-[#f8fafc] dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1e40af] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#475569] dark:text-slate-400 mb-1">
              Harga Satuan (Rp)
            </label>
            <input
              type="number"
              value={unitPrice || ''}
              onChange={(e) => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="125000"
              className="w-full h-8 px-2.5 text-xs font-mono font-bold text-[#1e40af] dark:text-blue-400 bg-[#f8fafc] dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded focus:ring-1 focus:ring-[#1e40af] focus:outline-hidden"
            />
          </div>
        </div>

        {/* 3. Input Mode Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-[#cbd5e1] dark:border-slate-800 shadow-xs overflow-hidden print:hidden">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] dark:border-slate-800 px-3 pt-2 bg-[#f8fafc] dark:bg-[#0f172a]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  inputMode === 'text'
                    ? 'border-[#1e40af] text-[#1e40af] dark:text-blue-400 bg-white dark:bg-[#0b0f19]'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a] dark:hover:text-slate-200'
                }`}
              >
                1. Input Teks / Paste List
              </button>

              <button
                type="button"
                onClick={() => setInputMode('ocr')}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  inputMode === 'ocr'
                    ? 'border-[#1e40af] text-[#1e40af] dark:text-blue-400 bg-white dark:bg-[#0b0f19]'
                    : 'border-transparent text-[#64748b] hover:text-[#0f172a] dark:hover:text-slate-200'
                }`}
              >
                2. Scan Gambar / Foto Catatan
              </button>
            </div>

            {inputMode === 'text' && (
              <div className="flex items-center gap-2 pb-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const sample = `Size S: Budi (10), Andi (11)\nSize M: Rian 23, Yoga 33, Reza 99\nSize L (Pendek): Doni 7, Eko 14, Fajar 21\nSize XL (Panjang): Bayu 1 Kiper, Dimas 17\nSize XXL: Bambang 5`;
                    setRawText(sample);
                    handleProcessParse(sample);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-[#1e40af] dark:text-slate-300 hover:bg-[#eff6ff] dark:hover:bg-slate-800 rounded border border-[#cbd5e1] dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Contoh Format List
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setPlayers([]);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-[#64748b] hover:text-rose-600 rounded border border-transparent hover:border-[#cbd5e1] transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            )}
          </div>

          <div className="p-3.5">
            {inputMode === 'text' ? (
              <div className="space-y-2.5">
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    handleProcessParse(e.target.value);
                  }}
                  placeholder="Paste daftar chat pesanan jersey di sini...&#10;Contoh:&#10;Budi 10 L Pendek&#10;Doni 7 XL Panjang&#10;Bayu 1 (GK) XXL Lengan Panjang&#10;Rian 23 M Pendek&#10;Daffa 12 Size 8 Anak"
                  className="w-full p-2.5 text-xs font-mono bg-[#f8fafc] dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded text-[#0f172a] dark:text-slate-100 focus:ring-1 focus:ring-[#1e40af] focus:outline-hidden leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between text-xs text-[#64748b] dark:text-slate-400">
                  <span>
                    Format otomatis mendeteksi nama, nomor, size, dan model lengan.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleProcessParse(rawText)}
                    className="h-7 px-3 bg-[#1e40af] hover:bg-blue-800 text-white rounded font-bold text-xs transition-colors cursor-pointer"
                  >
                    Susun Ulang
                  </button>
                </div>
              </div>
            ) : (
              // OCR Mode Tab
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#cbd5e1] dark:border-slate-700 hover:border-[#1e40af] rounded p-5 text-center cursor-pointer bg-[#f8fafc] dark:bg-[#0b0f19] transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <p className="text-xs font-bold text-[#0f172a] dark:text-slate-200">
                    Klik untuk Pilih Foto / Gambar Catatan Jersey
                  </p>
                  <p className="text-[11px] text-[#64748b] dark:text-slate-400 mt-1">
                    Atau tekan <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl + V</kbd> untuk menempelkan gambar dari clipboard
                  </p>
                </div>

                {imagePreviewUrl && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-28 h-28 object-cover rounded border border-slate-300 dark:border-slate-700"
                    />
                    <div className="flex-1 space-y-2 text-left">
                      <p className="text-xs font-bold text-[#0f172a] dark:text-slate-200">
                        Foto Dipilih: {selectedImage?.name || 'Gambar Clipboard'}
                      </p>

                      {ocrProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-[#1e40af] dark:text-blue-400">
                            <span>{ocrProgress.status}</span>
                            <span>{ocrProgress.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded overflow-hidden">
                            <div
                              className="bg-[#1e40af] h-full transition-all duration-200"
                              style={{ width: `${ocrProgress.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {ocrError && (
                        <p className="text-rose-600 text-xs font-semibold">{ocrError}</p>
                      )}

                      <button
                        type="button"
                        disabled={ocrLoading}
                        onClick={handleRunOcr}
                        className="h-8 px-4 bg-[#1e40af] hover:bg-blue-800 disabled:bg-slate-400 text-white rounded font-bold text-xs transition-colors cursor-pointer"
                      >
                        {ocrLoading ? 'Sedang Memproses...' : 'Proses Scan Gambar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Matriks Rekapitulasi Ukuran */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-[#475569] dark:text-slate-400 tracking-wide">
              Matriks Ukuran & Rekapitulasi Pesanan
            </h2>
            <span className="text-xs font-mono font-bold text-[#1e40af] dark:text-blue-400">
              Total: {summary.totalPcs} Pcs | Estimasi: {formatRupiah(summary.totalPcs * unitPrice)}
            </span>
          </div>

          {/* Size Pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTabSize('all')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer border ${
                activeTabSize === 'all'
                  ? 'bg-[#1e40af] text-white border-[#1e40af]'
                  : 'bg-white dark:bg-[#0f172a] text-[#475569] dark:text-slate-300 border-[#cbd5e1] dark:border-slate-800 hover:bg-[#eff6ff]'
              }`}
            >
              Semua Size ({summary.totalPcs})
            </button>

            {Object.entries(summary.sizeCounts).map(([sz, count]) => (
              <button
                key={sz}
                type="button"
                onClick={() => setActiveTabSize(sz === activeTabSize ? 'all' : sz)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer border ${
                  activeTabSize === sz
                    ? 'bg-[#1e40af] text-white border-[#1e40af]'
                    : 'bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-slate-200 border-[#cbd5e1] dark:border-slate-800 hover:border-[#1e40af]'
                }`}
              >
                Size {sz} ({count})
              </button>
            ))}
          </div>

          {/* Simple Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-[#0f172a] p-2.5 rounded border border-[#cbd5e1] dark:border-slate-800">
              <p className="text-[10px] text-[#64748b] dark:text-slate-400 font-bold uppercase">Lengan Pendek</p>
              <p className="text-sm font-bold text-[#0f172a] dark:text-slate-100 font-mono mt-0.5">
                {summary.sleeveCounts.pendek} Pcs
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-2.5 rounded border border-[#cbd5e1] dark:border-slate-800">
              <p className="text-[10px] text-[#64748b] dark:text-slate-400 font-bold uppercase">Lengan Panjang</p>
              <p className="text-sm font-bold text-[#1e40af] dark:text-blue-400 font-mono mt-0.5">
                {summary.sleeveCounts.panjang} Pcs
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-2.5 rounded border border-[#cbd5e1] dark:border-slate-800">
              <p className="text-[10px] text-[#64748b] dark:text-slate-400 font-bold uppercase">Kiper (GK)</p>
              <p className="text-sm font-bold text-[#0f172a] dark:text-slate-100 font-mono mt-0.5">
                {summary.roleCounts.kiper} Pcs
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f172a] p-2.5 rounded border border-[#cbd5e1] dark:border-slate-800">
              <p className="text-[10px] text-[#64748b] dark:text-slate-400 font-bold uppercase">Pemain Lapangan</p>
              <p className="text-sm font-bold text-[#0f172a] dark:text-slate-100 font-mono mt-0.5">
                {summary.roleCounts.pemain} Pcs
              </p>
            </div>
          </div>
        </div>

        {/* 5. Results Content */}
        <div className="bg-white dark:bg-[#0f172a] rounded-lg border border-[#cbd5e1] dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-[#cbd5e1] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-[#f8fafc] dark:bg-[#0f172a]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-[#0f172a] dark:text-slate-100">
                Daftar Pemain ({players.length})
              </span>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-white dark:bg-[#0f172a] text-[#1e40af] dark:text-slate-100 shadow-xs'
                      : 'text-[#64748b]'
                  }`}
                >
                  Kelompok Ukuran
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-[#0f172a] text-[#1e40af] dark:text-slate-100 shadow-xs'
                      : 'text-[#64748b]'
                  }`}
                >
                  Tabel Rinci
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama, no, size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 h-7 px-2.5 text-xs bg-white dark:bg-[#0b0f19] border border-[#cbd5e1] dark:border-slate-700 rounded focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => handleAddNewPlayer('L')}
                className="h-7 px-2.5 bg-white dark:bg-slate-800 text-[#1e40af] dark:text-slate-200 hover:bg-[#eff6ff] rounded font-bold text-xs border border-[#cbd5e1] dark:border-slate-700 transition-colors cursor-pointer"
              >
                + Tambah Pemain
              </button>
            </div>
          </div>

          {/* Grouped View */}
          {viewMode === 'grouped' ? (
            <div className="p-3.5 space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-8 text-[#94a3b8] text-xs">
                  Belum ada daftar pesanan jersey.
                </div>
              ) : (
                groups
                  .filter((grp) => activeTabSize === 'all' || grp.size === activeTabSize)
                  .map((grp) => (
                    <div
                      key={grp.size}
                      className="rounded border border-[#cbd5e1] dark:border-slate-800 overflow-hidden"
                    >
                      {/* Group Header */}
                      <div className="bg-[#f1f5f9] dark:bg-slate-800/80 px-3 py-2 border-b border-[#cbd5e1] dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0f172a] dark:text-slate-100">
                            Size {grp.size}
                          </span>
                          <span className="text-[11px] text-[#64748b] dark:text-slate-400">
                            ({grp.totalQty} Pcs)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#64748b] dark:text-slate-400">
                          {grp.sleeveBreakdown.pendek > 0 && (
                            <span>{grp.sleeveBreakdown.pendek} Pendek</span>
                          )}
                          {grp.sleeveBreakdown.panjang > 0 && (
                            <span>{grp.sleeveBreakdown.panjang} Panjang</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddNewPlayer(grp.size)}
                            className="px-1.5 py-0.5 bg-white dark:bg-slate-700 text-[#1e40af] dark:text-slate-200 rounded border border-[#cbd5e1] dark:border-slate-600 text-[10px] font-bold cursor-pointer"
                          >
                            + Tambah
                          </button>
                        </div>
                      </div>

                      {/* Players Grid */}
                      <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {grp.players
                          .filter((p) => {
                            if (!searchQuery) return true;
                            return (
                              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.number.includes(searchQuery) ||
                              (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
                            );
                          })
                          .map((p) => (
                            <div
                              key={p.id}
                              className="bg-white dark:bg-[#0b0f19] p-2 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs text-[#1e40af] dark:text-blue-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                  {p.number && p.number !== '-' ? p.number : '-'}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#0f172a] dark:text-slate-100 truncate">
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] text-[#64748b] dark:text-slate-400 capitalize">
                                    {p.sleeve} {p.role === 'kiper' ? '(GK)' : ''} {p.notes ? `- ${p.notes}` : ''}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeletePlayer(p.id)}
                                className="text-slate-400 hover:text-rose-600 text-xs px-1"
                                title="Hapus"
                              >
                                Hapus
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            // Detailed Table View
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8fafc] dark:bg-[#0b0f19] border-b border-[#cbd5e1] dark:border-slate-800 text-[#475569] dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">No</th>
                    <th className="py-2 px-3 w-28">Ukuran (Size)</th>
                    <th className="py-2 px-3">Nama Punggung</th>
                    <th className="py-2 px-3 w-24 text-center">No Punggung</th>
                    <th className="py-2 px-3 w-32">Model Lengan</th>
                    <th className="py-2 px-3 w-28">Peran</th>
                    <th className="py-2 px-3">Catatan Khusus</th>
                    <th className="py-2 px-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                  {filteredPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[#94a3b8]">
                        Tidak ada data pemain.
                      </td>
                    </tr>
                  ) : (
                    filteredPlayers.map((p, index) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[#f1f5f9] dark:hover:bg-slate-800/40"
                      >
                        <td className="py-1.5 px-3 text-center text-[#64748b] font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={p.size}
                            onChange={(e) => handleUpdatePlayer(p.id, 'size', e.target.value)}
                            className="w-full h-7 px-2 font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[#1e40af] dark:text-blue-400 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdatePlayer(p.id, 'name', e.target.value.toUpperCase())}
                            className="w-full h-7 px-2 font-bold text-xs bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded text-[#0f172a] dark:text-slate-100 focus:outline-hidden"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={p.number}
                            onChange={(e) => handleUpdatePlayer(p.id, 'number', e.target.value)}
                            className="w-full h-7 px-2 font-mono font-bold text-xs bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded text-center focus:outline-hidden"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <select
                            value={p.sleeve}
                            onChange={(e) => handleUpdatePlayer(p.id, 'sleeve', e.target.value as JerseySleeveType)}
                            className="w-full h-7 px-2 text-xs bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden"
                          >
                            <option value="pendek">Pendek</option>
                            <option value="panjang">Panjang</option>
                            <option value="manset">Manset</option>
                            <option value="tunik">Tunik/Hijab</option>
                            <option value="tanpa_lengan">Tanpa Lengan</option>
                          </select>
                        </td>
                        <td className="py-1 px-2">
                          <select
                            value={p.role}
                            onChange={(e) => handleUpdatePlayer(p.id, 'role', e.target.value as JerseyRoleType)}
                            className="w-full h-7 px-2 text-xs bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden"
                          >
                            <option value="pemain">Pemain</option>
                            <option value="kiper">Kiper (GK)</option>
                            <option value="official">Official</option>
                            <option value="anak">Anak</option>
                          </select>
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={p.notes || ''}
                            onChange={(e) => handleUpdatePlayer(p.id, 'notes', e.target.value)}
                            placeholder="Catatan..."
                            className="w-full h-7 px-2 text-xs bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded focus:outline-hidden"
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p.id)}
                            className="text-slate-400 hover:text-rose-600 text-xs font-semibold"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
