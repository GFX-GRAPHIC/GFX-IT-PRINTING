-- Database Schema for CetakPro POS & SPK Percetakan
CREATE DATABASE IF NOT EXISTS `cetakpro_pos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cetakpro_pos`;

-- 1. Users & Staff Roles
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `pin` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('owner', 'admin', 'designer', 'operator') NOT NULL DEFAULT 'admin',
  `phone` VARCHAR(25) DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- 3. Customers / Konsumen
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `company` VARCHAR(150) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `type` ENUM('regular', 'reseller', 'corporate') DEFAULT 'regular',
  `unpaid_balance` DECIMAL(15,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Materials & Products (Master Bahan & Produk)
CREATE TABLE IF NOT EXISTS `materials` (
  `id` VARCHAR(36) PRIMARY KEY,
  `kode` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `group_item` VARCHAR(50) NOT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'm²',
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `selling_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `stock` INT DEFAULT 100,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Printing Machines (Master Mesin)
CREATE TABLE IF NOT EXISTS `machines` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `brand` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('idle', 'running', 'maintenance') DEFAULT 'idle'
) ENGINE=InnoDB;

-- 6. SPK Orders (Surat Perintah Kerja & Transaksi Masuk)
CREATE TABLE IF NOT EXISTS `spk_orders` (
  `id` VARCHAR(36) PRIMARY KEY,
  `no_spk` VARCHAR(50) NOT NULL UNIQUE,
  `no_faktur` VARCHAR(50) NOT NULL UNIQUE,
  `tgl_spk` DATE NOT NULL,
  `design_pic` VARCHAR(100) DEFAULT 'MARGIN',
  `operator_pic` VARCHAR(100) DEFAULT NULL,
  `group_item` VARCHAR(50) NOT NULL DEFAULT 'INDOOR',
  `customer_kode` VARCHAR(20) NOT NULL DEFAULT '0000',
  `customer_nama` VARCHAR(150) NOT NULL,
  `customer_telp` VARCHAR(30) DEFAULT '-',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `diskon` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `ppn` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `bayar` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `sisa` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `payment_status` ENUM('paid', 'dp', 'unpaid') DEFAULT 'paid',
  `payment_method` VARCHAR(30) DEFAULT 'cash',
  `work_status` ENUM('pending', 'design', 'production', 'finishing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
  `priority` ENUM('normal', 'urgent', 'express') DEFAULT 'normal',
  `deadline` DATETIME DEFAULT NULL,
  `catatan_umum` TEXT DEFAULT NULL,
  `created_by` VARCHAR(100) DEFAULT 'Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. SPK Items (Detail Baris Item Cetakan)
CREATE TABLE IF NOT EXISTS `spk_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `spk_id` VARCHAR(36) NOT NULL,
  `kode` VARCHAR(30) DEFAULT '0000',
  `item_name` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `p` DECIMAL(8,2) DEFAULT NULL,
  `l` DECIMAL(8,2) DEFAULT NULL,
  `area_m2` DECIMAL(10,2) DEFAULT NULL,
  `unit_price` DECIMAL(15,2) DEFAULT 0,
  `subtotal` DECIMAL(15,2) DEFAULT 0,
  `catatan` TEXT DEFAULT NULL,
  CONSTRAINT `fk_spk_items_spk` FOREIGN KEY (`spk_id`) REFERENCES `spk_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Expenses (Buku Kas & Biaya Operasional)
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(36) PRIMARY KEY,
  `no_bukti` VARCHAR(50) NOT NULL UNIQUE,
  `kategori` VARCHAR(50) NOT NULL,
  `deskripsi` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `tgl` DATE NOT NULL,
  `created_by` VARCHAR(100) DEFAULT 'Owner',
  `payment_method` VARCHAR(20) DEFAULT 'cash',
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Store Settings
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `store_name` VARCHAR(150) NOT NULL DEFAULT 'CetakPro Percetakan',
  `tagline` VARCHAR(255) DEFAULT 'Digital Printing & Offset',
  `phone` VARCHAR(30) DEFAULT '022-7201999',
  `whatsapp` VARCHAR(30) DEFAULT '081234567890',
  `email` VARCHAR(100) DEFAULT 'info@cetakpro.com',
  `address` VARCHAR(255) DEFAULT 'Jl. Riau No. 108',
  `city` VARCHAR(100) DEFAULT 'Bandung',
  `bank_accounts` JSON DEFAULT NULL,
  `footer_receipt` VARCHAR(255) DEFAULT NULL,
  `footer_spk` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

INSERT INTO `users` (`id`, `username`, `password`, `pin`, `name`, `role`, `phone`, `active`) VALUES
('USR-001', 'owner', '1234', '1234', 'Yahya (Owner)', 'owner', '0812-8888-9999', 1),
('USR-002', 'kasir', '1111', '1111', 'Sinta (Kasir / Admin)', 'admin', '0813-1111-2222', 1),
('USR-003', 'designer', '2222', '2222', 'Dimas (Designer Grafis)', 'designer', '0815-3333-4444', 1),
('USR-004', 'operator', '3333', '3333', 'Budi (Operator Cetak)', 'operator', '0817-5555-6666', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
('CAT-001', 'INDOOR', 'Cetak indoor foto, albatros, sticker vinyl halus'),
('CAT-002', 'OUTDOOR', 'Cetak spanduk banner, flexi outdoor tahan cuaca'),
('CAT-003', 'DIGITAL A3+', 'Cetak lembaran A3+ kartu nama, brosur, sticker label'),
('CAT-004', 'MERCHANDISE', 'Sablon kaos DTF, mug keramik, pin, lanyard'),
('CAT-005', 'OFFSET & NOTA', 'Nota NCR 2-3 ply, buku, amplop, map')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `customers` (`id`, `kode`, `name`, `phone`, `company`, `address`, `type`, `unpaid_balance`) VALUES
('CUST-001', '0000', 'SHPGC-COBA1/SHPNJ-', '081234567890', 'Toko Kopi Senja', 'Jl. Pemuda No. 12, Bandung', 'reseller', 0),
('CUST-002', 'C001', 'PT Maju Bersama Advertising', '081987654321', 'PT Maju Bersama', 'Kawasan Industri Cikarang Blok C-4', 'corporate', 1200000),
('CUST-003', 'C002', 'Ibu Ratna Dewi (Catering)', '085712345678', 'Dapur Mama Ratna', 'Komplek Antapani Indah No. 5', 'regular', 0),
('CUST-004', 'C003', 'Sekolah Bintang Harapan', '081399887766', 'Yayasan Bintang Harapan', 'Jl. Pendidikan No. 45', 'corporate', 500000)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `materials` (`id`, `kode`, `name`, `group_item`, `unit`, `cost_price`, `selling_price`, `stock`, `description`) VALUES
('MAT-001', '0026', 'Serena Pendek S', 'MERCHANDISE', 'pcs', 25000, 45000, 150, 'Bahan serena sublim kaos'),
('MAT-002', '0468', 'Waffle Panjang M+Kplk', 'MERCHANDISE', 'pcs', 35000, 65000, 80, 'Bahan waffle jersey hoodie'),
('MAT-003', '0010', 'Flexi China 280gr', 'OUTDOOR', 'm²', 8000, 16000, 500, 'Spanduk banner standar'),
('MAT-004', '0012', 'Flexi Korea 440gr', 'OUTDOOR', 'm²', 16000, 28000, 300, 'Billboard tebal premium'),
('MAT-005', '0020', 'Albatros Matte + Standing X-Banner', 'INDOOR', 'pcs', 40000, 75000, 70, 'Indoor halus 60x160cm'),
('MAT-006', '0030', 'Sticker Vinyl Ritrama + Cutting', 'INDOOR', 'm²', 35000, 65000, 120, 'Stiker vinyl outdoor waterproof'),
('MAT-007', '0040', 'Art Paper 150gr A3+ (Brosur)', 'DIGITAL A3+', 'lembar', 2000, 4500, 2000, 'Brosur promosi kilap'),
('MAT-008', '0042', 'Sticker Chromo A3+ Kiss Cut', 'DIGITAL A3+', 'lembar', 3500, 10000, 900, 'Stiker label kemasan'),
('MAT-009', '0050', 'Nota 2 Ply NCR (Per Buku)', 'OFFSET & NOTA', 'buku', 6500, 14000, 250, 'Surat jalan / kwitansi')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `machines` (`id`, `name`, `type`, `brand`, `status`) VALUES
('MCH-001', 'Galaxy Konica 512i (Outdoor 3.2m)', 'OUTDOOR', 'Galaxy', 'running'),
('MCH-002', 'Epson SureColor S80670 (Indoor 9C)', 'INDOOR', 'Epson', 'idle'),
('MCH-003', 'Konica Minolta AccurioPress C4065 A3+', 'DIGITAL A3+', 'Konica Minolta', 'running'),
('MCH-004', 'Rhinotec DTF 60cm Double Head', 'MERCHANDISE', 'Rhinotec', 'idle')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `store_settings` (`id`, `store_name`, `tagline`, `phone`, `whatsapp`, `email`, `address`, `city`, `bank_accounts`, `footer_receipt`, `footer_spk`) VALUES
(1, 'CetakPro Digital & Offset', 'Solusi Cepat Kebutuhan Cetak Anda', '022-7201999', '081234567890', 'info@cetakpro.com', 'Jl. R.E. Martadinata No. 108, Riau', 'Bandung, Jawa Barat', 
'[{"bankName":"BCA","accountNumber":"8105-9988-77","accountHolder":"CetakPro Mandiri"},{"bankName":"Bank Mandiri","accountNumber":"131-00-1928374-1","accountHolder":"CetakPro Mandiri"}]',
'Barang yang sudah dicetak tidak dapat ditukar. Harap simpan bukti nota ini.',
'Pastikan resolusi file & ukuran sesuai sebelum naik cetak.')
ON DUPLICATE KEY UPDATE `store_name`=VALUES(`store_name`);
