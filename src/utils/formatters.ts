import { OrderStatus, PaymentStatus, UserRole } from '../types';

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatInvoiceDate(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function getStatusBadge(status: OrderStatus): { label: string; bg: string; text: string; border: string; icon: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'Menunggu Antrean',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        icon: 'Clock'
      };
    case 'design':
      return {
        label: 'Proses Desain',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        icon: 'Palette'
      };
    case 'production':
      return {
        label: 'Proses Cetak',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        icon: 'Printer'
      };
    case 'finishing':
      return {
        label: 'Finishing / QC',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20',
        icon: 'Scissors'
      };
    case 'ready':
      return {
        label: 'Siap Diambil',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        icon: 'PackageCheck'
      };
    case 'completed':
      return {
        label: 'Selesai',
        bg: 'bg-teal-500/10',
        text: 'text-teal-400',
        border: 'border-teal-500/20',
        icon: 'CheckCircle2'
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        icon: 'XCircle'
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
        icon: 'HelpCircle'
      };
  }
}

export function getPaymentStatusBadge(status: PaymentStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', bg: 'bg-emerald-500/15', text: 'text-emerald-400' };
    case 'dp':
      return { label: 'DP (Uang Muka)', bg: 'bg-amber-500/15', text: 'text-amber-400' };
    case 'unpaid':
      return { label: 'Belum Bayar', bg: 'bg-rose-500/15', text: 'text-rose-400' };
    default:
      return { label: status, bg: 'bg-slate-500/15', text: 'text-slate-400' };
  }
}

export function getRoleBadge(role: UserRole): { label: string; bg: string; text: string } {
  switch (role) {
    case 'owner':
      return { label: 'Owner / Direktur', bg: 'bg-purple-500/20', text: 'text-purple-300' };
    case 'admin':
      return { label: 'Admin / Kasir', bg: 'bg-blue-500/20', text: 'text-blue-300' };
    case 'designer':
      return { label: 'Designer Grafis', bg: 'bg-pink-500/20', text: 'text-pink-300' };
    case 'operator':
      return { label: 'Operator Produksi', bg: 'bg-amber-500/20', text: 'text-amber-300' };
    default:
      return { label: role, bg: 'bg-slate-500/20', text: 'text-slate-300' };
  }
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number (replace leading 0 with 62)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateOrderNumber(lastSeq: number): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `INV-${yearMonth}-${String(lastSeq).padStart(4, '0')}`;
}

export function generateSpkNumber(lastSeq: number): string {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `SPK-${yearMonth}-${String(lastSeq).padStart(4, '0')}`;
}
