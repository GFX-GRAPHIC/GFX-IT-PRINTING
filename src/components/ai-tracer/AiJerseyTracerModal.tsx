import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  Download,
  Eye,
  EyeOff,
  Layers,
  Shirt,
  ExternalLink,
  Cpu,
  Check,
  Crop,
} from 'lucide-react';

interface AiJerseyTracerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiJerseyTracerModal: React.FC<AiJerseyTracerModalProps> = ({ isOpen, onClose }) => {
  // 1. API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gfx_gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ valid?: boolean; message?: string } | null>(null);

  // 2. Input Image State
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [mockupMime, setMockupMime] = useState<string>('image/png');
  const [mockupFileName, setMockupFileName] = useState<string>('');

  // 3. Prompt & Settings State
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Flat continuous 2D jersey sublimation pattern background texture, front view, no mockup, no collar, no sleeves, no folds, no fabric texture, no text, no logos, ultra-high resolution vector-style artwork, seamless symmetry, bleed ready for cutting pattern'
  );
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [upscale4k, setUpscale4k] = useState(true);
  const [bleedCm, setBleedCm] = useState(1.5);
  const [extractLogo, setExtractLogo] = useState(true);

  // 4. Processing & Output State
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [resultPatternBase64, setResultPatternBase64] = useState<string | null>(null);
  const [resultPatternPath, setResultPatternPath] = useState<string | null>(null);
  const [resultLogoBase64, setResultLogoBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pattern' | 'logo' | 'compare'>('pattern');

  // Applying to Corel State
  const [applyingToCorel, setApplyingToCorel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save API key to localStorage
  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('gfx_gemini_api_key', val.trim());
    setKeyStatus(null);
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      setKeyStatus({ valid: false, message: 'Masukkan API Key terlebih dahulu.' });
      return;
    }
    setKeyValidating(true);
    setKeyStatus(null);
    try {
      if ((window as any).electronAPI?.aiTracerValidateKey) {
        const res = await (window as any).electronAPI.aiTracerValidateKey(apiKey.trim());
        setKeyStatus(res);
      } else {
        setKeyStatus({ valid: true, message: 'Mode Web: API Key tersimpan di peramban.' });
      }
    } catch (e: any) {
      setKeyStatus({ valid: false, message: e?.message || 'Gagal memvalidasi API Key.' });
    } finally {
      setKeyValidating(false);
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMockupFileName(file.name);
    setMockupMime(file.type || 'image/png');

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setMockupImage(b64);
      setError('');
      // Auto extract logo from chest area
      if (extractLogo) {
        extractLogoFromMockup(b64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Extract logo/text from upper chest with background removal on HTML5 canvas
  const extractLogoFromMockup = (imgDataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop center-upper chest area (approx 18% to 52% from top, 20% to 80% from left)
        const cropX = Math.round(img.width * 0.20);
        const cropY = Math.round(img.height * 0.25);
        const cropW = Math.round(img.width * 0.60);
        const cropH = Math.round(img.height * 0.25);

        canvas.width = cropW;
        canvas.height = cropH;

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Pixel manipulation: remove dark/black jersey background to keep bright text/logos
        const imgData = ctx.getImageData(0, 0, cropW, cropH);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate perceived brightness
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

          // If dark jersey background (black, dark charcoal grey < 45) -> transparent
          if (brightness < 45) {
            data[i + 3] = 0; // Alpha 0
          } else if (brightness < 70) {
            // Smooth edge feathering
            data[i + 3] = Math.round(((brightness - 45) / 25) * 255);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentLogoB64 = canvas.toDataURL('image/png');
        setResultLogoBase64(transparentLogoB64);
      } catch {}
    };
    img.src = imgDataUrl;
  };

  // Run AI Tracing
  const handleProcess = async () => {
    if (!apiKey.trim()) {
      setError('Harap masukkan Google Gemini API Key terlebih dahulu.');
      return;
    }
    if (!mockupImage) {
      setError('Harap pilih atau unggah foto mockup jersey terlebih dahulu.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccessMsg('');
    setProcessStep('Menganalisis mockup dengan Gemini Vision...');

    try {
      if ((window as any).electronAPI?.aiTracerProcess) {
        setProcessStep('Menghilangkan kerah, lipatan & membuat motif flat 2D...');
        const res = await (window as any).electronAPI.aiTracerProcess({
          apiKey: apiKey.trim(),
          mockupBase64: mockupImage,
          mimeType: mockupMime,
          customPrompt: customPrompt,
          upscale4k: upscale4k,
          aspectRatio: '3:4',
        });

        if (res?.success) {
          setResultPatternBase64(res.patternBase64);
          setResultPatternPath(res.patternPath);
          setSuccessMsg('Motif flat 2D dan logo transparan berhasil di-generate!');
          setActiveTab('pattern');
        } else {
          setError(res?.message || 'Gagal memproses gambar dengan AI.');
        }
      } else {
        setError('Fitur otomasi CorelDRAW & AI hanya tersedia di aplikasi desktop Windows.');
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memproses gambar.');
    } finally {
      setProcessing(false);
      setProcessStep('');
    }
  };

  // Apply to CorelDRAW
  const handleApplyToCorel = async () => {
    if (!resultPatternPath) {
      setError('Belum ada motif yang dihasilkan untuk dikirim ke CorelDRAW.');
      return;
    }

    setApplyingToCorel(true);
    setError('');
    setSuccessMsg('');

    try {
      if ((window as any).electronAPI?.corelApplyAiPattern) {
        const res = await (window as any).electronAPI.corelApplyAiPattern({
          patternPath: resultPatternPath,
          logoBase64: resultLogoBase64,
          bleedCm: Number(bleedCm) || 1.5,
        });

        if (res?.success) {
          setSuccessMsg(res.message || 'Berhasil diterapkan ke CorelDRAW!');
        } else {
          setError(res?.message || 'Gagal menerapkan ke CorelDRAW.');
        }
      } else {
        setError('Fitur CorelDRAW hanya aktif di aplikasi desktop Windows.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke CorelDRAW.');
    } finally {
      setApplyingToCorel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white border border-[#94a3b8] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#1e40af] text-white px-5 py-3 flex items-center justify-between border-b border-[#1d4ed8]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center border border-blue-300/30">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight uppercase">
                  AI Jersey Tracer & Pattern Extractor
                </h3>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                  GEMINI + IMAGEN 3
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-normal">
                Ubah mockup 3D AI menjadi motif flat siap cetak sublim & PowerClip otomatis ke pola CorelDRAW
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Jendela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 bg-[#f8fafc] flex-1 text-xs text-[#1e293b]">
          {/* Section 1: API Key Config Box */}
          <div className="bg-white border border-[#cbd5e1] rounded-lg p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#334155]">
                <Key className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>GOOGLE GEMINI API KEY</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                  Gratis di Google AI Studio
                </span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#1e40af] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Dapatkan API Key Gratis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Tempel Google Gemini API Key di sini (contoh: AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded px-3 py-1.5 text-xs font-mono text-[#0f172a] focus:outline-none focus:border-[#1e40af] focus:bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
                  title={showApiKey ? 'Sembunyikan' : 'Lihat Kunci'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleValidateKey}
                disabled={keyValidating || !apiKey.trim()}
                className="px-3 py-1.5 rounded font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-[#334155] border border-[#cbd5e1] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {keyValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                <span>{keyValidating ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>
            </div>

            {keyStatus && (
              <div
                className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5 font-medium ${
                  keyStatus.valid
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {keyStatus.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                <span>{keyStatus.message}</span>
              </div>
            )}
          </div>

          {/* Section 2: Main Workflow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Upload & Options (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              {/* Upload Mockup Box */}
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#334155] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#1e40af]" />
                    <span>FOTO MOCKUP JERSEY KONSUMEN</span>
                  </span>
                  {mockupImage && (
                    <button
                      onClick={() => {
                        setMockupImage(null);
                        setResultLogoBase64(null);
                        setResultPatternBase64(null);
                      }}
                      className="text-[10px] text-rose-600 hover:underline font-semibold"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {mockupImage ? (
                  <div className="relative group border border-[#e2e8f0] rounded-lg overflow-hidden bg-slate-900/5 flex flex-col items-center justify-center p-2">
                    <img
                      src={mockupImage}
                      alt="Mockup Konsumen"
                      className="max-h-56 object-contain rounded shadow-xs"
                    />
                    <div className="mt-2 text-center text-[10px] text-[#64748b] truncate w-full">
                      {mockupFileName || 'Gambar Mockup Terpilih'}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 text-[11px] font-semibold text-[#1e40af] hover:underline"
                    >
                      Ganti Gambar Lain
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#cbd5e1] hover:border-[#1e40af] rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-[#f8fafc] hover:bg-[#eff6ff] transition-colors cursor-pointer text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1e40af]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#1e293b]">
                        Klik atau Tarik Foto Mockup ke Sini
                      </p>
                      <p className="text-[10px] text-[#64748b]">
                        Mendukung format PNG, JPG, WEBP dari Midjourney / ChatGPT / HP
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Extraction Options */}
              <div className="bg-white border border-[#cbd5e1] rounded-lg p-3.5 shadow-xs space-y-2.5">
                <span className="font-bold text-[#334155] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#1e40af]" />
                  <span>PENGATURAN EKSTRAKSI & CETAK</span>
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extractLogo}
                      onChange={(e) => {
                        setExtractLogo(e.target.checked);
                        if (e.target.checked && mockupImage) {
                          extractLogoFromMockup(mockupImage);
                        } else if (!e.target.checked) {
                          setResultLogoBase64(null);
                        }
                      }}
                      className="mt-0.5 rounded border-[#cbd5e1] text-[#1e40af] focus:ring-[#1e40af]"
                    />
                    <div>
                      <span className="font-bold text-[11px] text-[#1e293b]">
                        Pisahkan Logo / Tulisan Dada (PNG Transparan)
                      </span>
                      <p className="text-[10px] text-[#64748b]">
                        Ekstrak teks sponsor & logo agar bisa diedit/digeser mandiri di CorelDRAW.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={upscale4k}
                      onChange={(e) => setUpscale4k(e.target.checked)}
                      className="mt-0.5 rounded border-[#cbd5e1] text-[#1e40af] focus:ring-[#1e40af]"
                    />
                    <div>
                      <span className="font-bold text-[11px] text-[#1e293b]">
                        Auto-Upscale Resolusi Cetak (300 DPI)
                      </span>
                      <p className="text-[10px] text-[#64748b]">
                        Meningkatkan ketajaman matriks gambar agar tidak pecah saat disublim.
                      </p>
                    </div>
                  </label>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#475569] font-medium">Lebihan Jahit / Bleed:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={bleedCm}
                        onChange={(e) => setBleedCm(parseFloat(e.target.value) || 1.5)}
                        className="w-16 bg-[#f1f5f9] border border-[#cbd5e1] rounded px-2 py-0.5 text-center font-bold text-xs"
                      />
                      <span className="text-[10px] text-[#64748b]">cm</span>
                    </div>
                  </div>
                </div>

                {/* Prompt Customization Accordion */}
                <div className="pt-1 border-t border-[#f1f5f9]">
                  <button
                    type="button"
                    onClick={() => setShowPromptSettings(!showPromptSettings)}
                    className="w-full flex items-center justify-between text-[11px] font-semibold text-[#1e40af] hover:underline"
                  >
                    <span>Kustomisasi Prompt AI (Opsional)</span>
                    <span>{showPromptSettings ? '▲ Tutup' : '▼ Edit Prompt'}</span>
                  </button>

                  {showPromptSettings && (
                    <div className="mt-2 space-y-1 animate-in fade-in">
                      <textarea
                        rows={3}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded p-2 text-[10px] font-mono focus:outline-none focus:border-[#1e40af]"
                        placeholder="Instruksi prompt untuk Gemini..."
                      />
                      <p className="text-[9px] text-[#94a3b8]">
                        Tip: Biarkan default untuk hasil motif kotak simetris tanpa kerah/lipatan.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Process Trigger Button */}
              <button
                type="button"
                onClick={handleProcess}
                disabled={processing || !mockupImage || !apiKey.trim()}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  processing || !mockupImage || !apiKey.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white'
                }`}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{processStep || 'Sedang Memproses...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mulai Proses AI Tracer 🚀</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="leading-tight">{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-start gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="leading-tight">{successMsg}</div>
                </div>
              )}
            </div>

            {/* Right Column: Preview & Apply to Corel (7 cols) */}
            <div className="md:col-span-7 flex flex-col space-y-3">
              <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-xs flex-1 flex flex-col overflow-hidden">
                {/* Preview Tabs */}
                <div className="px-4 py-2 border-b border-[#e2e8f0] bg-[#f1f5f9] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('pattern')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'pattern'
                          ? 'bg-white text-[#1e40af] shadow-xs'
                          : 'text-[#64748b] hover:text-[#1e293b]'
                      }`}
                    >
                      🎨 Motif Flat 2D (Siap Pola)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('logo')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        activeTab === 'logo'
                          ? 'bg-white text-[#1e40af] shadow-xs'
                          : 'text-[#64748b] hover:text-[#1e293b]'
                      }`}
                    >
                      ✂️ Logo Dada Transparan
                    </button>
                    {mockupImage && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('compare')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          activeTab === 'compare'
                            ? 'bg-white text-[#1e40af] shadow-xs'
                            : 'text-[#64748b] hover:text-[#1e293b]'
                        }`}
                      >
                        ⚖️ Bandingkan Mockup
                      </button>
                    )}
                  </div>

                  {resultPatternBase64 && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                      300 DPI PRINT READY
                    </span>
                  )}
                </div>

                {/* Preview Viewport */}
                <div className="p-4 flex-1 flex items-center justify-center bg-slate-900/5 min-h-[340px] max-h-[460px] overflow-hidden">
                  {processing ? (
                    <div className="flex flex-col items-center justify-center gap-3 text-center p-6">
                      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin flex items-center justify-center"></div>
                      <div>
                        <p className="font-bold text-sm text-[#0f172a]">AI Sedang Bekerja...</p>
                        <p className="text-xs text-[#64748b] mt-1">{processStep}</p>
                      </div>
                    </div>
                  ) : activeTab === 'pattern' ? (
                    resultPatternBase64 ? (
                      <div className="relative group max-h-full flex items-center justify-center">
                        <img
                          src={resultPatternBase64}
                          alt="Motif Flat Hasil AI"
                          className="max-h-[420px] rounded shadow-md border border-[#cbd5e1] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-[#94a3b8] space-y-1">
                        <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                        <p className="font-bold text-xs text-[#64748b]">Belum Ada Hasil Motif</p>
                        <p className="text-[11px]">Unggah foto mockup dan tekan tombol "Mulai Proses AI Tracer"</p>
                      </div>
                    )
                  ) : activeTab === 'logo' ? (
                    resultLogoBase64 ? (
                      <div className="flex flex-col items-center justify-center gap-2 p-4 w-full h-full">
                        {/* Checkerboard container for transparency */}
                        <div
                          className="p-4 rounded border border-[#cbd5e1] shadow-xs max-h-[380px] flex items-center justify-center"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                            backgroundColor: '#f8fafc',
                          }}
                        >
                          <img
                            src={resultLogoBase64}
                            alt="Logo Dada Transparan"
                            className="max-h-[320px] object-contain drop-shadow-md"
                          />
                        </div>
                        <p className="text-[10px] text-[#64748b]">
                          Lapisan logo PNG transparan otomatis diimpor di atas dada pola CorelDRAW.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-[#94a3b8] space-y-1">
                        <Crop className="w-10 h-10 mx-auto opacity-40" />
                        <p className="font-bold text-xs text-[#64748b]">Logo Belum Diekstrak</p>
                        <p className="text-[11px]">Pastikan opsi "Pisahkan Logo Dada" aktif saat memproses gambar</p>
                      </div>
                    )
                  ) : (
                    // Compare Tab
                    <div className="grid grid-cols-2 gap-3 w-full h-full items-center p-2">
                      <div className="text-center flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-[#64748b] mb-1">1. MOCKUP ASLI KONSUMEN</span>
                        <img
                          src={mockupImage!}
                          alt="Original"
                          className="max-h-[360px] object-contain rounded border border-[#cbd5e1]"
                        />
                      </div>
                      <div className="text-center flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-emerald-700 mb-1">2. MOTIF FLAT 2D HASIL AI</span>
                        {resultPatternBase64 ? (
                          <img
                            src={resultPatternBase64}
                            alt="Result"
                            className="max-h-[360px] object-contain rounded border border-emerald-400 shadow-sm"
                          />
                        ) : (
                          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                            Belum diproses
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action: Apply to CorelDRAW */}
                <div className="p-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-[#64748b]">
                    <span>Target: </span>
                    <b className="text-[#0f172a]">CorelDRAW Aktif (X7 - 2025)</b>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Manual Download Pattern Button */}
                    {resultPatternBase64 && (
                      <a
                        href={resultPatternBase64}
                        download={`motif_flat_${Date.now()}.png`}
                        className="px-2.5 py-1.5 rounded font-semibold text-xs bg-white hover:bg-slate-100 text-[#334155] border border-[#cbd5e1] flex items-center gap-1 transition-colors"
                        title="Unduh file gambar motif ke komputer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Simpan PNG</span>
                      </a>
                    )}

                    {/* Apply to Corel Button */}
                    <button
                      type="button"
                      onClick={handleApplyToCorel}
                      disabled={applyingToCorel || !resultPatternPath}
                      className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                        applyingToCorel || !resultPatternPath
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="Pastikan kurva pola badan jersey sedang dipilih/diseleksi di CorelDRAW"
                    >
                      {applyingToCorel ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengirim ke Corel...</span>
                        </>
                      ) : (
                        <>
                          <Shirt className="w-3.5 h-3.5" />
                          <span>Terapkan ke Pola CorelDRAW (Auto-PowerClip)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
