// Client API bridge for MySQL Backend & Offline Storage Sync
const API_BASE_URL = 'http://localhost:3001/api';

export interface DbStatus {
  isOnline: boolean;
  message: string;
}

export async function checkDbStatus(): Promise<DbStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/status`, { signal: AbortSignal.timeout(800) });
    if (res.ok) {
      const data = await res.json();
      return { isOnline: data.success, message: data.message || 'MySQL Terhubung' };
    }
    return { isOnline: false, message: 'Server API Offline (Mode Lokal)' };
  } catch {
    return { isOnline: false, message: 'MySQL Standby (Mode Lokal Cepat)' };
  }
}

export async function apiLogin(username: string, pin: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiSaveSpk(spkData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/spk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spkData),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiGetSpkList() {
  try {
    const res = await fetch(`${API_BASE_URL}/spk`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

// User Management API
export async function apiGetUsers() {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiCreateUser(userData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiUpdateUser(id: string, userData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiDeleteUser(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}
