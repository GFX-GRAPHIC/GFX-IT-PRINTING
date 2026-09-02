export type UserRole = 'owner' | 'admin' | 'designer' | 'operator';

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  active: boolean;
}

export type OrderStatus =
  | 'pending'      // Menunggu Antrean
  | 'design'       // Proses Desain / Approval
  | 'production'   // Proses Cetak / Produksi
  | 'finishing'    // Finishing / Pasca Cetak
  | 'ready'        // Siap Diambil / Dikirim
  | 'completed'    // Selesai / Terkirim
  | 'cancelled';   // Dibatalkan

export type PaymentStatus = 'unpaid' | 'dp' | 'paid';

export type PaymentMethod =
  | 'cash'
  | 'transfer_bca'
  | 'transfer_mandiri'
  | 'transfer_bri'
  | 'qris'
  | 'tempo';

export type ProductCategory =
  | 'indoor'
  | 'outdoor'
  | 'INDOOR'
  | 'OUTDOOR'
  | 'large_format'  // Spanduk, Banner, Backlite, Stiker Meteran
  | 'digital_a3'    // Brosur, Stiker A3+, Kartu Nama, Sertifikat
  | 'merchandise'   // Kaos DTF, Mug, Pin, Tumbler, Topi
  | 'offset_doc'    // Nota NCR, Buku, Amplop, Kop Surat
  | 'custom'        // Jasa Desain Murni / Custom
  | (string & {});

export interface OrderItem {
  id: string;
  category: ProductCategory;
  productName: string;
  materialName: string;
  // Dimensions for large format
  lengthM?: number;
  widthM?: number;
  areaM2?: number;
  // Quantity
  qty: number;
  unit: string; // 'm²', 'lbr', 'pcs', 'rim', 'set'
  variant?: string; // e.g. 'S', 'M', 'L', 'XL'
  unitPrice: number;
  subtotal: number;
  // Finishing details
  finishingNames: string[];
  finishingCost: number;
  // Design specifications
  designFee: number;
  designType: 'ready_to_print' | 'minor_edit' | 'new_design';
  fileUrl?: string;
  fileName?: string;
  // Machine & notes
  targetMachine?: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  id: string;
  timestamp: string;
  status: OrderStatus;
  user: string;
  userRole: UserRole;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string; // INV-202608-001
  spkNumber: string;   // SPK-202608-001
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'regular' | 'reseller' | 'corporate';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType?: 'percent' | 'nominal';
  discountPercent?: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number; // Remaining balance
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  priority: 'normal' | 'urgent' | 'express';
  deadline: string; // ISO date string
  // Staff assignments
  createdBy: string;
  designerId?: string;
  designerName?: string;
  operatorId?: string;
  operatorName?: string;
  // Design details
  designStatus: 'waiting' | 'in_progress' | 'approved' | 'revision';
  designNotes?: string;
  proofPreviewUrl?: string;
  // Production / Operator details
  productionNotes?: string;
  pickupType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  // Timestamps & history
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  type: 'regular' | 'reseller' | 'corporate';
  totalOrders: number;
  totalSpent: number;
  unpaidBalance: number;
  createdAt: string;
}

export interface ProductSizeVariant {
  id: string;
  size: string; // e.g. 'S', 'M', 'L', 'XL', 'XXL', atau variasi bebas
  sellingPrice: number;
  costPrice: number;
  stock: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string; // 'm²', 'lembar', 'pcs', 'setel'
  costPrice: number;    // HPP dasar
  sellingPrice: number; // Harga Jual dasar
  stock: number;
  minStock: number;
  description?: string;
  hasVariants?: boolean;
  variantTitle?: string; // e.g. 'Ukuran', 'Model', 'Warna', dll.
  sizeVariants?: ProductSizeVariant[];
}

export interface CategoryItem {
  id: string;
  name: string;
  desc?: string;
}

export interface FinishingItem {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  unit: 'per_pcs' | 'per_meter' | 'per_lembar' | 'flat';
  description?: string;
}

export interface MachineItem {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'digital_a3' | 'dtf' | 'uv_flatbed' | 'cutting' | 'offset';
  brand: string;
  status: 'idle' | 'running' | 'maintenance';
  currentJob?: string;
}

export type ExpenseCategory =
  | 'operasional'
  | 'bahan_baku'
  | 'tinta'
  | 'perlengkapan'
  | 'gaji_karyawan'
  | 'maintenance'
  | 'lain_lain';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory | string;
  description: string;
  amount: number;
  date: string;
  createdBy: string;
  paymentMethod: 'cash' | 'transfer';
  receiptNote?: string;
}

export interface PurchaseOrderItem {
  id: string;
  materialId?: string;
  itemName: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierContactPerson?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxPercent?: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount: number;
  paymentTerms: 'cash' | 'tempo_7' | 'tempo_14' | 'tempo_30' | 'cod';
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingCash: number; // Modal Kas Awal di Laci Kasir
  totalCashSales: number; // Total Pembayaran Tunai Masuk
  totalNonCashSales: number; // Total Pembayaran Transfer / QRIS
  totalExpenses: number; // Total Pengeluaran Operasional dari Kas
  expectedCash: number; // Modal Awal + Tunai - Pengeluaran
  actualCash?: number; // Uang Riil Fisik Hasil Hitungan Kasir
  difference?: number; // Selisih Kas (actual - expected)
  notes?: string;
  closingNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  appName?: string;       // Nama Aplikasi (e.g. CetakPro POS / Mitra Advertising)
  appIcon?: string;       // Icon / Logo Aplikasi (data URL gambar atau icon preset)
  appSubtitle?: string;   // Subtitle aplikasi
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  logoUrl?: string;
  bankAccounts: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }[];
  footerReceiptNotes: string;
  footerSpkNotes: string;
  taxEnabled: boolean;
  taxPercent: number;
}

export interface PrintPressRowItem {
  id: string;
  name: string;
  lengthM: number;
  widthM: number;
  qty: number;
  areaM2: number;
  subtotal: number;
}

export interface ProductionBillItem {
  id: string;
  billNumber: string;
  title: string;
  workerName: string;
  workerPhone: string;
  type: 'meter' | 'satuan';
  pricePerMeter?: number;
  printPressItems?: PrintPressRowItem[];
  lengthM?: number;
  widthM?: number;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  status: 'unpaid' | 'paid' | 'deducted';
  paymentMethod?: 'cash' | 'transfer' | 'debt_deduction';
  deductedFromDebtId?: string;
  deductedAmount?: number;
  paidAt?: string;
  createdAt: string;
  notes?: string;
}

export interface WorkerDebtHistory {
  id: string;
  date: string;
  billId?: string;
  billTitle?: string;
  amount: number;
  description: string;
}

export interface WorkerDebtItem {
  id: string;
  debtNumber: string;
  workerName: string;
  phone: string;
  initialAmount: number;
  remainingAmount: number;
  createdAt: string;
  notes?: string;
  history: WorkerDebtHistory[];
}

export type JerseySleeveType = 'pendek' | 'panjang' | 'manset' | 'tunik' | 'tanpa_lengan' | 'other';
export type JerseyRoleType = 'pemain' | 'kiper' | 'official' | 'pelatih' | 'anak' | 'other';

export interface JerseyPlayerItem {
  id: string;
  name: string;
  number: string;
  size: string; // S, M, L, XL, XXL, 3XL, KIDS 6, etc.
  sleeve: JerseySleeveType;
  role: JerseyRoleType;
  collar?: string; // O-neck, V-neck, Polo, dll
  pantsSize?: string; // S, M, L, dll
  notes?: string;
  qty: number;
}

export interface JerseySizeGroup {
  size: string;
  totalQty: number;
  players: JerseyPlayerItem[];
  sleeveBreakdown: {
    pendek: number;
    panjang: number;
    other: number;
  };
}

export interface JerseyMatrixSummary {
  totalPlayers: number;
  totalPcs: number;
  sizeCounts: Record<string, number>;
  sleeveCounts: {
    pendek: number;
    panjang: number;
    other: number;
  };
  roleCounts: {
    pemain: number;
    kiper: number;
    official: number;
    other: number;
  };
}
