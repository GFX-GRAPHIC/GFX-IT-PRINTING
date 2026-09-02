/**
 * CetakPro POS - Security & Input Sanitization Suite
 * Comprehensive defense against XSS, SQL Injection payloads, Brute Force, and Invalid Data.
 */

// ============================================================================
// 1. INPUT SANITIZATION & VALIDATION
// ============================================================================

/**
 * Strips HTML tags, script injection patterns, and trims dangerous characters
 */
export function sanitizeText(input: any, maxLength: number = 255): string {
  if (input === null || input === undefined) return '';
  let str = String(input);
  
  // Remove script tags, iframe, object, embed, event handlers
  str = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // strip all remaining HTML tags
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // remove onclick=, onload=, etc.
    .trim();

  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  return str;
}

/**
 * Sanitizes alphanumeric codes like Product Codes, SPK No, Customer Codes
 */
export function sanitizeCode(input: any, maxLength: number = 50): string {
  if (!input) return '';
  return String(input)
    .replace(/[^a-zA-Z0-9\-_./]/g, '')
    .trim()
    .substring(0, maxLength);
}

/**
 * Sanitizes usernames (lowercase alphanumeric, dots, underscores, hyphens)
 */
export function sanitizeUsername(input: any): string {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .trim()
    .substring(0, 30);
}

/**
 * Sanitizes numeric PINs or passwords
 */
export function sanitizePin(input: any): string {
  if (!input) return '';
  return String(input).trim().substring(0, 30);
}

/**
 * Sanitizes price, currency, or monetary amounts ensuring safe non-negative numeric value
 */
export function sanitizePrice(input: any, defaultValue: number = 0, maxVal: number = 10000000000): number {
  if (input === null || input === undefined || input === '') return defaultValue;
  
  let num = typeof input === 'number' ? input : parseFloat(String(input).replace(/[^0-9.-]/g, ''));
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return defaultValue;
  }
  
  if (num > maxVal) {
    num = maxVal;
  }
  
  return Math.round(num);
}

/**
 * Sanitizes length and width dimensions in meters (P and L)
 */
export function sanitizeDimension(input: any): string {
  if (!input && input !== 0) return '';
  const str = String(input).replace(/[^0-9.]/g, '');
  
  // Guard multiple decimal points
  const parts = str.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  
  const num = parseFloat(str);
  if (num > 500) return '500'; // max 500 meters banner sanity limit
  return str;
}

/**
 * Sanitizes phone numbers for WhatsApp / SMS
 */
export function sanitizePhone(input: any): string {
  if (!input) return '';
  const cleaned = String(input).replace(/[^0-9+]/g, '').trim();
  return cleaned.substring(0, 20);
}

// ============================================================================
// 2. ANTI-BRUTE FORCE & LOGIN RATE LIMITING
// ============================================================================

const SECURITY_STORAGE_KEY = 'cetakpro_auth_security';
const AUDIT_LOG_STORAGE_KEY = 'cetakpro_audit_logs';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_SECONDS = 30;

export interface LoginSecurityState {
  isLocked: boolean;
  remainingLockoutSeconds: number;
  failedAttempts: number;
  remainingAttempts: number;
}

export function getLoginSecurityState(): LoginSecurityState {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) {
      return {
        isLocked: false,
        remainingLockoutSeconds: 0,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
      };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingLockoutSeconds: remainingSeconds,
        failedAttempts: data.failedAttempts || MAX_FAILED_LOGIN_ATTEMPTS,
        remainingAttempts: 0,
      };
    }

    // If lockout expired, reset
    if (data.lockedUntil && data.lockedUntil <= now) {
      resetLoginSecurityState();
      return {
        isLocked: false,
        remainingLockoutSeconds: 0,
        failedAttempts: 0,
        remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
      };
    }

    const attempts = data.failedAttempts || 0;
    return {
      isLocked: false,
      remainingLockoutSeconds: 0,
      failedAttempts: attempts,
      remainingAttempts: Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - attempts),
    };
  } catch {
    return {
      isLocked: false,
      remainingLockoutSeconds: 0,
      failedAttempts: 0,
      remainingAttempts: MAX_FAILED_LOGIN_ATTEMPTS,
    };
  }
}

export function recordFailedLoginAttempt(username: string): LoginSecurityState {
  const current = getLoginSecurityState();
  const newAttempts = current.failedAttempts + 1;
  const now = Date.now();

  let lockedUntil: number | null = null;
  let isLocked = false;
  let remainingSeconds = 0;

  if (newAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_SECONDS * 1000;
    isLocked = true;
    remainingSeconds = LOCKOUT_DURATION_SECONDS;
    logAuditAction('LOGIN_LOCKED', `Akun ${username || 'Anonim'} terkunci sementara karena ${newAttempts}x gagal login berturut-turut`);
  } else {
    logAuditAction('LOGIN_FAILED', `Percobaan login gagal untuk username: ${username || 'Anonim'} (Percobaan ${newAttempts}/${MAX_FAILED_LOGIN_ATTEMPTS})`);
  }

  const payload = {
    failedAttempts: newAttempts,
    lockedUntil,
    lastAttemptTime: now,
  };

  localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(payload));

  return {
    isLocked,
    remainingLockoutSeconds: remainingSeconds,
    failedAttempts: newAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_LOGIN_ATTEMPTS - newAttempts),
  };
}

export function resetLoginSecurityState(): void {
  try {
    localStorage.removeItem(SECURITY_STORAGE_KEY);
  } catch {}
}

// ============================================================================
// 3. SECURITY AUDIT LOGGING
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export function logAuditAction(action: string, details: string): void {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];

    const entry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
    };

    // Keep latest 100 entries
    const updated = [entry, ...logs.slice(0, 99)];
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to record security audit log:', e);
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
