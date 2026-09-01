# GFX IT PRINTING — Enterprise Print Shop Management & Corel Automation Suite

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011%20(x64)-0078D6.svg?style=flat-square&logo=windows)](https://github.com/GFX-GRAPHIC/GFX-IT-PRINTING)
[![Framework: Electron](https://img.shields.io/badge/Engine-Electron%2034%20%7C%20Node.js-47848F.svg?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![UI: React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Security: HMAC-SHA256](https://img.shields.io/badge/Licensing-HMAC--SHA256%20Cryptographic-10B981.svg?style=flat-square)](https://github.com/GFX-GRAPHIC/GFX-IT-PRINTING)
[![CorelDRAW Compatibility](https://img.shields.io/badge/CorelDRAW-X7%20to%202024%20Compatible-059669.svg?style=flat-square)](https://www.coreldraw.com/)

**GFX IT PRINTING** adalah sistem workstation desktop terintegrasi yang dirancang khusus untuk industri percetakan, konveksi sublimasi, dan digital printing komersial. Sistem ini menggabungkan manajemen Point of Sale (POS) kasir percetakan, penerbitan Surat Perintah Kerja (SPK) digital terstruktur, pembukuan arus kas, serta modul otomasi grafis CorelDRAW (COM Interop) berkecepatan tinggi dalam satu ekosistem tunggal.

---

## 🛠️ Modul Sistem & Kapabilitas Teknis

### 1. Point of Sale (POS) & SPK Digital Produksi
* **Manajemen Kasir & Shift Kerja:** Sistem pembukaan dan penutupan shift kasir dengan rekonsiliasi kas riil, pelacakan selisih kas, dan pencatatan audit log operator.
* **Kalkulator Biaya Cetak Dinamis:** Perhitungan otomatis pesanan cetak berbasis luas area (meter persegi / sentimeter), quantity tier, finishing tambahan, dan jenis bahan.
* **Penerbitan SPK Produksi Digital:** Alur kerja pesanan dari kasir langsung masuk ke antrean operator mesin (Printing, Press, Cutting, Jahit, QC) lengkap dengan QR Code tracking nota.
* **Pencetakan Nota Thermal & Dokumen:** Dukungan driver ESC/POS thermal printer 58mm/80mm dan direct print dokumen ukuran A4/A5/Continuous Form.
* **Manajemen Keuangan & Piutang:** Pencatatan uang muka (DP), pelunasan bertahap, buku kas pengeluaran operasional toko, dan rekapitulasi laba rugi berkala.

### 2. CorelDRAW Automation Engine (COM Interop Architecture)
* **Modul Otomasi Jersey Printing (Jersey Pattern Layouter):**
  * Auto-duplikasi master pola pakaian ke layout kerja CorelDRAW.
  * Parser data nama pemain, nomor punggung, dan ukuran secara otomatis dari teks tabel maupun OCR gambar WhatsApp.
  * Algoritma *Auto-Center Lock & Dynamic Width Constraint* untuk memastikan nama dan nomor selalu simetris di tengah pola tanpa keluar batas toleransi jahitan.
* **Modul Nomorator Kupon & Tiket Multi-Stempel:**
  * Penomoran serial otomatis hingga ribuan nomor dalam hitungan detik.
  * Pemrosesan berbasis kelompok objek (`Group Shape Identification`) yang menjamin nomor badan tiket, sobekan panitia, dan kupon doorprize selalu sinkron bernomor identik.
  * Optimasi rendering multi-halaman berkecepatan tinggi tanpa resiko memory leak atau crash COM.
* **Tool Utilitas Desainer:**
  * Konversi massal seluruh teks ke kurva (*Convert All to Curves*) sebelum cetak untuk mencegah error missing font di mesin RIP.
  * Batch export seleksi objek terpisah ke format TIFF / PDF / EPS.

### 3. Mesin Kriptografi Lisensi (Workstation-Bound Security)
* **Hardware ID Generation (HWID):** Algoritma identifikasi mesin berbasis kombinasi Windows MachineGuid, UUID motherboard, dan CPU serial key format `GFX-XXXX-XXXX-XXXX`.
* **Digital Signature Verification:** Validasi serial key menggunakan algoritma HMAC-SHA256 digital envelope terenkripsi.
* **Zero Cloud Dependency Activation:** Validasi lisensi dapat berjalan 100% offline di lokasi workshop tanpa mewajibkan koneksi server setiap saat.
* **Skema Fleksibel:** Mendukung lisensi Beli Putus (*Lifetime Workstation License*), Berlangganan 1 Tahun (*Annual Subscription*), dan Masa Percobaan Khusus (*Admin-Controlled Trial Period*).

### 4. Cloud Auto-Updater (GitHub Releases Integration)
* Sistem pembaruan aplikasi otomatis berbasis modul `electron-updater`.
* Aplikasi memeriksa rilis resmi dari GitHub Releases di latar belakang tanpa mengganggu alur kerja kasir.
* Pengunduhan pembaruan berjalan di *background worker*, dilanjutkan dengan penggantian *atomic binary* saat aplikasi di-restart.

---

## 💻 Persyaratan Sistem (System Requirements)

| Komponen | Spesifikasi Minimum | Rekomendasi Workstation |
| :--- | :--- | :--- |
| **Sistem Operasi** | Windows 10 (64-bit) | Windows 10 / Windows 11 (64-bit) |
| **Processor (CPU)** | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 ke atas |
| **Memori (RAM)** | 4 GB RAM | 8 GB – 16 GB RAM (untuk file grafis besar) |
| **Penyimpanan** | 500 MB ruang kosong (SSD) | 1 GB ruang kosong (NVMe SSD) |
| **CorelDRAW** | CorelDRAW X7 (64-bit) | CorelDRAW 2019 / 2020 / 2021 / 2022 / 2024 |
| **Printer Nota** | Thermal Printer 58mm / 80mm | Thermal Printer USB / Ethernet / Bluetooth |

---

## 📦 Panduan Instalasi & Penggunaan

### 1. Pemasangan Aplikasi Client (Toko Percetakan)
1. Unduh installer resmi terbaru `GFX IT PRINTING Setup 1.0.0.exe` dari tab [Releases](https://github.com/GFX-GRAPHIC/GFX-IT-PRINTING/releases).
2. Jalankan file installer dan ikuti instruksi pada layar hingga proses instalasi selesai.
3. Buka aplikasi dari shortcut desktop.
4. Pada jendela aktivasi, salin **Hardware ID Komputer** Anda.
5. Kirimkan Hardware ID tersebut ke IT Support untuk mendapatkan Kunci Lisensi Resmi.
6. Tempelkan kode Serial Key yang diterima pada kolom aktivasi, lalu klik **Aktivasi Lisensi Sekarang**.

### 2. Pembuatan Kunci Lisensi (Khusus Administrator / Owner)
1. Buka aplikasi **`GFX License Keygen Generator.exe`** di workstation administrator.
2. Masukkan Hardware ID pelanggan dan nama toko/percetakan.
3. Pilih jenis lisensi: **Beli Putus (Lifetime)**, **Langganan 1 Tahun**, atau **Trial Custom Hari**.
4. Klik **Generate Serial Key**.
5. Klik **Salin Format Chat WhatsApp** untuk mengirimkan data lisensi siap pakai ke pelanggan.

---

## 🏗️ Struktur Arsitektur Source Code

```
GFX-IT-PRINTING/
├── electron/
│   ├── main.cjs               # Electron Main Process & Native Windows Window Manager
│   ├── preload.cjs            # Secure Context Bridge IPC Gateway
│   ├── licenseEngine.cjs      # HMAC-SHA256 Cryptographic Licensing Engine
│   ├── corelBridge.cjs        # CorelDRAW COM Automation & PowerShell Interop Pipeline
│   ├── corel-companion.html   # Floating Compact Window for Jersey Layouter
│   └── corel-numerator.html   # Floating Compact Window for Coupon Numbering
├── src/
│   ├── components/            # Reusable Enterprise UI Components (POS, SPK, Settings)
│   ├── context/               # Global Application & Auth Context Stores
│   ├── pages/                 # Full Page Layouts (Dashboard, SPK Input, Jersey OCR)
│   ├── types/                 # TypeScript Interface & Type Definitions
│   └── utils/                 # Formatters, Thermal Printers, Security & Audit Loggers
├── keygen/                    # Standalone Master Keygen & Admin Dashboard Sub-App
└── package.json               # Manifest, Build Directives & GitHub Release Config
```

---

## 🛡️ Keamanan & Kepatuhan Data
* Seluruh data transaksi, piutang, dan master produk disimpan secara terenkripsi di database lokal komputer kasir dengan opsi sinkronisasi database jaringan lokal (LAN MySQL Server).
* Proteksi anti brute-force login pada akun kasir dan desainer dengan mekanisme auto-lockdown bertahap.
* Lisensi dilindungi tanda tangan kriptografi perangkat keras sehingga tidak dapat dipindahkan atau diduplikasi secara ilegal ke perangkat lain.

---

## 📞 Layanan Bantuan & Dukungan Teknis

Untuk aktivasi lisensi resmi, pertanyaan teknis, konsultasi implementasi hardware percetakan, dan permintaan kustomisasi fitur, silakan hubungi:

* **WhatsApp Resmi:** [0851-6359-4245](https://wa.me/6285163594245)
* **Organisasi:** GFX-GRAPHIC IT Solutions
* **Repositori Resmi:** [https://github.com/GFX-GRAPHIC/GFX-IT-PRINTING](https://github.com/GFX-GRAPHIC/GFX-IT-PRINTING)

---
*© 2026 GFX IT PRINTING. Hak Cipta Dilindungi Undang-Undang.*
