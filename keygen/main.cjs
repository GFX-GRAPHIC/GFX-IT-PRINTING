const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const MASTER_SECRET_SALT = 'GFX_IT_PRINTING_2026_MASTER_SECRET_9837429184_SECURITY';

let win = null;

function getDataFilePath() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
  const dir = path.join(appData, 'GFX_KEYGEN');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return path.join(dir, 'keygen_data.json');
}

function readKeygenData() {
  const file = getDataFilePath();
  const defaultData = {
    settings: {
      adminPhone: '085163594245',
      adminName: 'GFX IT PRINTING Support',
      appName: 'GFX IT PRINTING',
      githubToken: ''
    },
    history: [],
    blocked: []
  };

  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return {
        settings: { ...defaultData.settings, ...(parsed.settings || {}) },
        history: Array.isArray(parsed.history) ? parsed.history : [],
        blocked: Array.isArray(parsed.blocked) ? parsed.blocked : []
      };
    } catch {}
  }
  return defaultData;
}

function saveKeygenData(data) {
  try {
    fs.writeFileSync(getDataFilePath(), JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function getRootRegistryFilePath() {
  const candidates = [
    path.join(__dirname, '../license-registry.json'),
    path.join(app.getAppPath(), '../license-registry.json'),
    path.join(process.cwd(), 'license-registry.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, '../license-registry.json');
}

function syncToGitHubApi(githubToken, registryObj) {
  if (!githubToken || !githubToken.trim()) {
    return Promise.resolve({ success: false, message: 'GitHub Token belum diisi di tab Pengaturan.' });
  }

  const owner = 'GFX-GRAPHIC';
  const repo = 'GFX-IT-PRINTING';
  const filePath = 'license-registry.json';
  const contentBase64 = Buffer.from(JSON.stringify(registryObj, null, 2)).toString('base64');

  return new Promise((resolve) => {
    const getOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${filePath}`,
      method: 'GET',
      headers: {
        'User-Agent': 'GFX-License-Manager',
        'Authorization': `Bearer ${githubToken.trim()}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const getReq = https.request(getOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let currentSha = null;
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.sha) currentSha = parsed.sha;
        } catch {}

        const putPayload = JSON.stringify({
          message: 'chore: Update system telemetry manifest',
          content: contentBase64,
          ...(currentSha ? { sha: currentSha } : {})
        });

        const putOptions = {
          hostname: 'api.github.com',
          path: `/repos/${owner}/${repo}/contents/${filePath}`,
          method: 'PUT',
          headers: {
            'User-Agent': 'GFX-License-Manager',
            'Authorization': `Bearer ${githubToken.trim()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(putPayload)
          }
        };

        const putReq = https.request(putOptions, (putRes) => {
          let putData = '';
          putRes.on('data', chunk => { putData += chunk; });
          putRes.on('end', () => {
            if (putRes.statusCode >= 200 && putRes.statusCode < 300) {
              resolve({ success: true, message: '✅ Berhasil tersinkronisasi otomatis ke GitHub Cloud!' });
            } else {
              resolve({ success: false, message: `GitHub API (${putRes.statusCode}): Periksa izin Token Anda.` });
            }
          });
        });

        putReq.on('error', (err) => resolve({ success: false, message: err.message }));
        putReq.write(putPayload);
        putReq.end();
      });
    });

    getReq.on('error', (err) => resolve({ success: false, message: err.message }));
    getReq.end();
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 920,
    height: 740,
    minWidth: 840,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0f172a',
    title: 'GFX IT PRINTING — License Master & Remote Control Dashboard',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-close', () => win?.close());

// Get Keygen State (Settings + History + Stats + Blocked)
ipcMain.handle('get-keygen-data', () => {
  const data = readKeygenData();
  const total = data.history.length;
  const lifetime = data.history.filter(h => h.type === 'LIFETIME').length;
  const subscription = data.history.filter(h => h.type === 'SUBSCRIPTION_1Y').length;
  const trial = data.history.filter(h => h.type === 'TRIAL_EXT').length;
  const totalBlocked = data.blocked.length;

  return {
    settings: data.settings,
    history: data.history,
    blocked: data.blocked,
    stats: { total, lifetime, subscription, trial, totalBlocked }
  };
});

// Save Admin Settings
ipcMain.handle('save-keygen-settings', (_event, newSettings) => {
  const data = readKeygenData();
  data.settings = { ...data.settings, ...newSettings };
  const ok = saveKeygenData(data);
  return { success: ok, settings: data.settings };
});

// Generate Key + Auto Add to History
ipcMain.handle('generate-key', (_event, payload) => {
  const { hwid = '', customer = '', type = 'LIFETIME', customDays = 7 } = payload || {};
  const cleanHwid = hwid.trim().toUpperCase();
  const cleanCustomer = (customer || 'Pelanggan Percetakan').trim();
  const cleanType = type.toUpperCase();

  if (!cleanHwid || !cleanHwid.startsWith('GFX-')) {
    return { success: false, message: 'Hardware ID harus berawalan GFX- (Contoh: GFX-040D-6CCD-BDE2)' };
  }

  const issueDate = new Date().toISOString().split('T')[0];
  let expDate = 'FOREVER';
  let typeLabel = 'BELI PUTUS (Permanen Seumur Hidup)';

  if (cleanType === 'SUBSCRIPTION_1Y') {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    expDate = exp.toISOString().split('T')[0];
    typeLabel = `BERLANGGANAN 1 TAHUN (s/d ${expDate})`;
  } else if (cleanType === 'TRIAL_EXT') {
    const exp = new Date();
    const days = parseInt(customDays, 10) || 7;
    exp.setDate(exp.getDate() + days);
    expDate = exp.toISOString().split('T')[0];
    typeLabel = `MASA PERCOBAAN / TRIAL (${days} HARI s/d ${expDate})`;
  }

  const dataPayload = `${cleanHwid}|${cleanType}|${cleanCustomer}|${expDate}`;
  const hmac = crypto.createHmac('sha256', MASTER_SECRET_SALT).update(dataPayload).digest('hex').toUpperCase();

  const typeCode = cleanType === 'LIFETIME' ? 'LT' : cleanType === 'SUBSCRIPTION_1Y' ? '1Y' : 'TR';
  const sig = `${hmac.substring(0, 4)}-${hmac.substring(4, 8)}-${hmac.substring(8, 12)}-${hmac.substring(12, 16)}`;
  const fullKey = `GFX-${typeCode}-${sig}`;

  const envelope = Buffer.from(JSON.stringify({
    hwid: cleanHwid,
    customer: cleanCustomer,
    type: cleanType,
    issued: issueDate,
    expires: expDate,
    key: fullKey,
    sig: hmac.substring(0, 16)
  })).toString('base64');

  const currentData = readKeygenData();
  const adminPhone = currentData.settings?.adminPhone || '085163594245';
  const adminName = currentData.settings?.adminName || 'GFX IT PRINTING Support';

  const waTemplate = `Halo kak *${cleanCustomer}*, terima kasih telah menggunakan software *GFX IT PRINTING (POS & Corel Automation Tools)*! 🙏✨

Berikut Kunci Lisensi Resmi untuk komputer Anda:
🏢 *Toko / Percetakan:* ${cleanCustomer}
💻 *Hardware ID:* ${cleanHwid}
📜 *Tipe Lisensi:* ${typeLabel}
🔑 *SERIAL KEY LISENSI:*
\`\`\`
${envelope}
\`\`\`

*Cara Aktivasi:*
1. Buka aplikasi *GFX IT PRINTING*.
2. Tempel (Paste) kode kunci di atas pada form *Aktivasi Lisensi Software*.
3. Klik tombol *Aktivasi Lisensi Sekarang*.

Hubungi Admin / IT Support di WhatsApp: *${adminPhone}* (${adminName}).
Semoga usahanya semakin lancar dan sukses! 🚀`;

  // Save to history
  const historyItem = {
    id: `LIC-${Date.now()}`,
    hwid: cleanHwid,
    customer: cleanCustomer,
    type: cleanType,
    issued: issueDate,
    expires: expDate,
    customDays: cleanType === 'TRIAL_EXT' ? (parseInt(customDays, 10) || 7) : null,
    key: fullKey,
    envelope: envelope,
    waTemplate: waTemplate
  };

  currentData.history.unshift(historyItem);
  if (currentData.history.length > 500) currentData.history = currentData.history.slice(0, 500);
  saveKeygenData(currentData);

  return {
    success: true,
    key: fullKey,
    envelope: envelope,
    customer: cleanCustomer,
    type: cleanType,
    expires: expDate,
    hwid: cleanHwid,
    waTemplate: waTemplate,
    historyItem: historyItem
  };
});

// Delete history item
ipcMain.handle('delete-keygen-history-item', (_event, id) => {
  const data = readKeygenData();
  data.history = data.history.filter(h => h.id !== id);
  saveKeygenData(data);
  return { success: true };
});

// REMOTE KILLSWITCH: Block HWID
ipcMain.handle('block-hwid', async (_event, payload) => {
  const { hwid, customer, reason } = payload || {};
  if (!hwid) return { success: false, message: 'Hardware ID kosong' };

  const data = readKeygenData();
  const cleanHwid = hwid.trim().toUpperCase();
  const exists = data.blocked.find(b => b.hwid === cleanHwid);

  if (!exists) {
    data.blocked.unshift({
      id: `BLK-${Date.now()}`,
      hwid: cleanHwid,
      customer: customer || 'Pengguna',
      reason: reason || 'Lisensi ditangguhkan oleh Administrator.',
      blockedAt: new Date().toISOString().split('T')[0]
    });
    saveKeygenData(data);
  }

  const registryObj = {
    version: "1.0.0",
    updated_at: new Date().toISOString().split('T')[0],
    blocked_hwids: data.blocked.map(b => ({
      hwid: b.hwid,
      customer: b.customer,
      reason: b.reason,
      blocked_at: b.blockedAt
    })),
    broadcast_announcement: { enabled: false, title: "", message: "" }
  };

  // Update local file
  try {
    fs.writeFileSync(getRootRegistryFilePath(), JSON.stringify(registryObj, null, 2), 'utf-8');
  } catch {}

  // Auto-sync via GitHub API if token configured
  let syncResult = null;
  if (data.settings?.githubToken) {
    syncResult = await syncToGitHubApi(data.settings.githubToken, registryObj);
  }

  return { success: true, blocked: data.blocked, syncResult };
});

// REMOTE KILLSWITCH: Unblock HWID
ipcMain.handle('unblock-hwid', async (_event, hwid) => {
  if (!hwid) return { success: false };
  const data = readKeygenData();
  const cleanHwid = hwid.trim().toUpperCase();
  data.blocked = data.blocked.filter(b => b.hwid !== cleanHwid);
  saveKeygenData(data);

  const registryObj = {
    version: "1.0.0",
    updated_at: new Date().toISOString().split('T')[0],
    blocked_hwids: data.blocked.map(b => ({
      hwid: b.hwid,
      customer: b.customer,
      reason: b.reason,
      blocked_at: b.blockedAt
    })),
    broadcast_announcement: { enabled: false, title: "", message: "" }
  };

  try {
    fs.writeFileSync(getRootRegistryFilePath(), JSON.stringify(registryObj, null, 2), 'utf-8');
  } catch {}

  let syncResult = null;
  if (data.settings?.githubToken) {
    syncResult = await syncToGitHubApi(data.settings.githubToken, registryObj);
  }

  return { success: true, blocked: data.blocked, syncResult };
});

// Manual Sync Button
ipcMain.handle('manual-sync-github', async () => {
  const data = readKeygenData();
  const registryObj = {
    version: "1.0.0",
    updated_at: new Date().toISOString().split('T')[0],
    blocked_hwids: data.blocked.map(b => ({
      hwid: b.hwid,
      customer: b.customer,
      reason: b.reason,
      blocked_at: b.blockedAt
    })),
    broadcast_announcement: { enabled: false, title: "", message: "" }
  };

  return await syncToGitHubApi(data.settings?.githubToken, registryObj);
});

// Get formatted JSON for GitHub Sync
ipcMain.handle('get-killswitch-json', () => {
  const data = readKeygenData();
  const registryObj = {
    version: "1.0.0",
    updated_at: new Date().toISOString().split('T')[0],
    blocked_hwids: data.blocked.map(b => ({
      hwid: b.hwid,
      customer: b.customer,
      reason: b.reason,
      blocked_at: b.blockedAt
    })),
    broadcast_announcement: { enabled: false, title: "", message: "" }
  };
  return JSON.stringify(registryObj, null, 2);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
