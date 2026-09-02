const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile, exec } = require('child_process');
const { autoUpdater } = require('electron-updater');
const licenseEngine = require('./licenseEngine.cjs');

// Auto-Updater Configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdaterStatus(status, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { status, ...data });
  }
}

autoUpdater.on('checking-for-update', () => sendUpdaterStatus('checking'));
autoUpdater.on('update-available', (info) => sendUpdaterStatus('available', { version: info.version }));
autoUpdater.on('update-not-available', () => sendUpdaterStatus('not-available'));
autoUpdater.on('error', (err) => sendUpdaterStatus('error', { error: err?.message || 'Gagal update' }));
autoUpdater.on('download-progress', (progressObj) => {
  sendUpdaterStatus('downloading', {
    percent: Math.round(progressObj.percent || 0),
    transferred: progressObj.transferred,
    total: progressObj.total,
  });
});
autoUpdater.on('update-downloaded', (info) => sendUpdaterStatus('downloaded', { version: info.version }));

// Auto-Updater IPC Handlers
ipcMain.handle('updater:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (err) {
    return { success: false, message: err?.message || 'Gagal memeriksa update' };
  }
});

ipcMain.handle('updater:quit-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// License Management IPC Handlers
ipcMain.handle('license:get-status', () => {
  return licenseEngine.getLicenseStatus();
});

ipcMain.handle('license:get-hwid', () => {
  return licenseEngine.getHardwareId();
});

ipcMain.handle('license:activate', (_event, key) => {
  return licenseEngine.activateLicenseKey(key);
});

let mainWindow = null;
let corelCompanionWindow = null;
let corelNumeratorWindow = null;
let activeJerseySessionData = {
  teamName: 'GFX IT PRINTING',
  players: [],
  groups: [],
  summary: null,
};


function getAppIcon() {
  const candidates = [
    path.join(__dirname, '../public/favicon.ico'),
    path.join(app.getAppPath(), 'public/favicon.ico'),
    path.join(process.resourcesPath, 'public/favicon.ico'),
    path.join(__dirname, '../public/extracted_icon.png'),
    path.join(app.getAppPath(), 'public/extracted_icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0f172a',
    show: false,
    title: 'GFX IT PRINTING',
    autoHideMenuBar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => mainWindow.loadURL(devUrl), 1500);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (mainWindow.webContents) {
      mainWindow.webContents.focus();
    }
    // Check remote license kill-switch status asynchronously
    setTimeout(async () => {
      try {
        const killCheck = await licenseEngine.checkRemoteKillSwitch();
        if (killCheck && killCheck.blocked && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('license:blocked', { reason: killCheck.reason });
        }
      } catch {}
    }, 2000);

    // Check for updates automatically in production
    if (app.isPackaged) {
      setTimeout(() => {
        try {
          autoUpdater.checkForUpdates();
        } catch {}
      }, 6000);
    }
  });

  mainWindow.on('focus', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F5' || input.key === 'F6' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
        event.preventDefault();
      }
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: false });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (corelCompanionWindow) {
      corelCompanionWindow.close();
      corelCompanionWindow = null;
    }
    if (corelNumeratorWindow) {
      corelNumeratorWindow.close();
      corelNumeratorWindow = null;
    }
  });
}

function createCorelCompanionWindow() {
  if (corelCompanionWindow) {
    corelCompanionWindow.focus();
    return corelCompanionWindow;
  }

  corelCompanionWindow = new BrowserWindow({
    width: 410,
    height: 590,
    minWidth: 380,
    minHeight: 520,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    backgroundColor: '#0f172a',
    title: 'GFX IT PRINTING — Corel Auto-Layout',
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  corelCompanionWindow.loadFile(path.join(__dirname, 'corel-companion.html'));

  corelCompanionWindow.on('closed', () => {
    corelCompanionWindow = null;
  });

  return corelCompanionWindow;
}

function createCorelNumeratorWindow() {
  if (corelNumeratorWindow) {
    corelNumeratorWindow.focus();
    return corelNumeratorWindow;
  }

  corelNumeratorWindow = new BrowserWindow({
    width: 430,
    height: 640,
    minWidth: 400,
    minHeight: 560,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    backgroundColor: '#0f172a',
    title: 'GFX IT PRINTING — Numerator Machine',
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  corelNumeratorWindow.loadFile(path.join(__dirname, 'corel-numerator.html'));

  corelNumeratorWindow.on('closed', () => {
    corelNumeratorWindow = null;
  });

  return corelNumeratorWindow;
}


// Window control IPC
ipcMain.on('window-reload', () => {
  if (mainWindow) mainWindow.reload();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-unmaximize', () => {
  if (mainWindow && mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Printing Handlers
ipcMain.handle('print-thermal', async (_event, _options) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      deviceName: '',
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('print-document', async (_event, _options) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: 'A4',
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// CorelDRAW Automation Handlers
ipcMain.handle('corel:open-companion-tool', async (_event, data) => {
  if (data) {
    activeJerseySessionData = data;
  }
  const win = createCorelCompanionWindow();
  if (win) {
    win.show();
    win.focus();
  }
  return { success: true };
});

ipcMain.handle('corel:get-active-order-data', async () => {
  return activeJerseySessionData;
});

// Check CorelDRAW Status (Ultra fast and reliable process detection)
ipcMain.handle('corel:check-status', async () => {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$proc = Get-Process -Name 'CorelDRW','CorelDRAW' -ErrorAction SilentlyContinue; if ($proc) { $t = ($proc | Where-Object { $_.MainWindowTitle } | Select-Object -First 1).MainWindowTitle; if (-not $t) { $t = 'CorelDRAW 2021 (64-Bit)' }; @{ connected = $true; version = $t; hasSelection = $true } | ConvertTo-Json -Compress } else { @{ connected = $false; error = 'CorelDRAW belum dibuka' } | ConvertTo-Json -Compress }"`;

    exec(cmd, { timeout: 4000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve({ connected: false, error: 'CorelDRAW belum terbuka' });
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        resolve({ connected: true, version: 'CorelDRAW 2021 (64-Bit)' });
      }
    });
  });
});

// Execute Auto-Layout in CorelDRAW with Zero-Lag Optimization & Precise Relative Duplicate(dx, dy)
ipcMain.handle('corel:execute-layout', async (_event, payload) => {
  return new Promise((resolve) => {
    const { targetSize, players, spacingCm = 1.0, limitCopy = 4, direction = 'vertical', maxNameWidthCm = 27.0 } = payload || {};

    if (!players || players.length === 0) {
      resolve({ success: false, message: 'Daftar pemain kosong.' });
      return;
    }

    const tempDir = app.getPath('temp');
    const timestamp = Date.now();
    const tempJsonPath = path.join(tempDir, `corel_data_${timestamp}.json`);
    const tempPs1Path = path.join(tempDir, `corel_exec_${timestamp}.ps1`);

    const dataPayload = {
      targetSize,
      players,
      spacingCm: parseFloat(spacingCm) || 1.0,
      limitCopy: parseInt(limitCopy, 10) || 4,
      direction: direction || 'vertical',
      maxNameWidthCm: parseFloat(maxNameWidthCm) || 27.0,
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(dataPayload, null, 2), 'utf-8');

    // Create high-performance PowerShell automation script
    const psScript = `
$ErrorActionPreference = 'Stop'
$result = @{ success = $false; message = ''; count = 0 }

try {
    # 1. Connect to active CorelDRAW COM instance (Supporting Corel X7 to 2024 seamlessly)
    $corel = $null
    for ($v = 26; $v -ge 14; $v--) {
        try {
            $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
            if ($c) {
                if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                    $corel = $c
                    break
                } elseif (-not $corel) {
                    $corel = $c
                }
            }
        } catch {}
    }

    if (-not $corel) {
        $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
        if ($curVer) {
            try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {}
        }
    }
    if (-not $corel) {
        try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {}
    }

    if (-not $corel) {
        throw "Tidak dapat terhubung ke CorelDRAW. Pastikan CorelDRAW sedang dibuka."
    }

    $doc = $null
    try { $doc = $corel.ActiveDocument } catch {}
    if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
        try {
            $doc = $corel.Documents.Item(1)
            $doc.Activate()
        } catch {}
    }

    if (-not $doc) {
        throw "Tidak ada file/dokumen yang sedang terbuka di CorelDRAW. Silakan buka file pola di CorelDRAW."
    }

    $doc.Unit = 3 # cdrCentimeter

    function Get-RangeCount($r) {
        if (-not $r) { return 0 }
        try { if ($r.Count -ne $null) { return [int]$r.Count } } catch {}
        try { if ($r.Shapes -and $r.Shapes.Count -ne $null) { return [int]$r.Shapes.Count } } catch {}
        return 0
    }

    function Get-RangeItem($r, [int]$idx) {
        if (-not $r) { return $null }
        try { $it = $r.Item($idx); if ($it) { return $it } } catch {}
        try { $it = $r.Shapes.Item($idx); if ($it) { return $it } } catch {}
        try { $it = $r[$idx]; if ($it) { return $it } } catch {}
        return $null
    }

    $selection = $null
    try { $selection = $corel.ActiveSelection } catch {}
    if (-not $selection -or (Get-RangeCount $selection) -eq 0) {
        try { $selection = $doc.Selection } catch {}
    }
    $selCount = Get-RangeCount $selection
    if ($selCount -eq 0) {
        throw "Silakan pilih (seleksi/blok) 1 grup master pola jersey di CorelDRAW terlebih dahulu."
    }

    # Read data JSON
    $jsonFile = $args[0]
    $data = Get-Content -Path $jsonFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $playerList = $data.players
    $spacing = [double]$data.spacingCm
    $limit = [int]$data.limitCopy
    if ($limit -lt 1) { $limit = 4 }
    $dir = $data.direction
    $maxW = if ($data.maxNameWidthCm) { [double]$data.maxNameWidthCm } else { 27.0 }

    # Master shape
    $masterShape = $null
    if ($selCount -gt 1) {
        $masterShape = $selection.Group()
    } else {
        $masterShape = Get-RangeItem $selection 1
    }

    $width  = [double]$masterShape.SizeWidth
    $height = [double]$masterShape.SizeHeight

    # Fast Text Update function with Auto-Center Lock & Auto-Fit Width Constraint
    function UpdateTextsInShape($shapeItem, $nameText, $numText, $maxNameLimit) {
        try {
            $textShapes = $shapeItem.Shapes.FindShapes($null, 6, $true)
            if ($textShapes.Count -gt 0) {
                for ($t = 1; $t -le $textShapes.Count; $t++) {
                    $ts = $textShapes.Item($t)
                    $origCenterX = [double]$ts.CenterX
                    $origCenterY = [double]$ts.CenterY
                    $origW       = [double]$ts.SizeWidth

                    $story = $ts.Text.Story
                    $curr = $story.Text.Trim()

                    try { $story.Alignment = 3 } catch {}

                    if ($curr -match '^\\d+$' -or $curr -match '(?i)^(#|00|99|0|no|no\\.)$') {
                        # --- NUMBER SHAPE ---
                        $story.Text = [string]$numText
                        if ($origW -gt 0 -and $ts.SizeWidth -gt ($origW * 1.25)) {
                            $ts.SizeWidth = $origW * 1.25
                        }
                        $ts.CenterX = $origCenterX
                        $ts.CenterY = $origCenterY
                    } else {
                        # --- PLAYER NAME SHAPE ---
                        $story.Text = [string]$nameText
                        $capW = [math]::Max($origW, $maxNameLimit)
                        if ($ts.SizeWidth -gt $capW) {
                            $ts.SizeWidth = $capW
                        }
                        $ts.CenterX = $origCenterX
                        $ts.CenterY = $origCenterY
                    }
                }
            } elseif ($shapeItem.Type -eq 6) {
                $ts = $shapeItem
                $origCenterX = [double]$ts.CenterX
                $origCenterY = [double]$ts.CenterY
                $origW       = [double]$ts.SizeWidth

                $story = $ts.Text.Story
                $curr = $story.Text.Trim()

                try { $story.Alignment = 3 } catch {}

                if ($curr -match '^\\d+$' -or $curr -match '(?i)^(#|00|99|0|no|no\\.)$') {
                    $story.Text = [string]$numText
                    if ($origW -gt 0 -and $ts.SizeWidth -gt ($origW * 1.25)) {
                        $ts.SizeWidth = $origW * 1.25
                    }
                    $ts.CenterX = $origCenterX
                    $ts.CenterY = $origCenterY
                } else {
                    $story.Text = [string]$nameText
                    $capW = [math]::Max($origW, $maxNameLimit)
                    if ($ts.SizeWidth -gt $capW) {
                        $ts.SizeWidth = $capW
                    }
                    $ts.CenterX = $origCenterX
                    $ts.CenterY = $origCenterY
                }
            }
        } catch {}
    }

    # CRITICAL OPTIMIZATION: Disable redraw & undo logging for lightning-fast batch processing
    $corel.Optimization = $true
    $corel.EventsEnabled = $false
    $doc.BeginCommandGroup("GFX IT PRINTING Auto-Layout")

    $created = 0

    # Player 0: Update master shape directly in place
    if ($playerList.Count -gt 0) {
        $p0 = $playerList[0]
        $p0Name = if ($p0.name) { $p0.name.ToString().ToUpper() } else { "PEMAIN" }
        $p0Num = if ($p0.number -and $p0.number -ne '-') { $p0.number.ToString() } else { "" }
        UpdateTextsInShape $masterShape $p0Name $p0Num $maxW
        $created++
    }

    # Players 1..N: Duplicate with exact delta offset (dx, dy)
    for ($i = 1; $i -lt $playerList.Count; $i++) {
        $p = $playerList[$i]
        $pName = if ($p.name) { $p.name.ToString().ToUpper() } else { "PEMAIN" }
        $pNum = if ($p.number -and $p.number -ne '-') { $p.number.ToString() } else { "" }

        $dx = 0.0
        $dy = 0.0

        if ($dir -eq 'horizontal') {
            $col = $i % $limit
            $row = [math]::Floor($i / $limit)
            $dx = $col * ($width + $spacing)
            $dy = -($row * ($height + $spacing))
        } else {
            # Vertical layout: move downward per row, wrap to next column on the right
            $row = $i % $limit
            $col = [math]::Floor($i / $limit)
            $dx = $col * ($width + $spacing)
            $dy = -($row * ($height + $spacing))
        }

        # Native relative duplicate at (dx, dy)
        $dup = $masterShape.Duplicate($dx, $dy)
        UpdateTextsInShape $dup $pName $pNum $maxW
        $created++
    }

    # Finalize optimizations & refresh screen
    $doc.EndCommandGroup()
    $corel.Optimization = $false
    $corel.EventsEnabled = $true
    $corel.Refresh()
    if ($corel.ActiveWindow) {
        $corel.ActiveWindow.Refresh()
    }

    $result.success = $true
    $result.count = $created
    $result.message = "Berhasil menata $created pola jersey di CorelDRAW!"
} catch {
    # Ensure optimization is restored even on error
    try {
        if ($corel) {
            $corel.Optimization = $false
            $corel.EventsEnabled = $true
            if ($doc) { $doc.EndCommandGroup() }
            $corel.Refresh()
        }
    } catch {}

    $result.success = $false
    $result.message = $_.Exception.Message
}

$result | ConvertTo-Json -Compress
`;

    fs.writeFileSync(tempPs1Path, psScript, 'utf-8');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs1Path, tempJsonPath],
      { timeout: 45000 },
      (err, stdout, stderr) => {
        try {
          if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
          if (fs.existsSync(tempPs1Path)) fs.unlinkSync(tempPs1Path);
        } catch {}

        if (err && !stdout) {
          resolve({ success: false, message: stderr || err?.message || 'Gagal menjalankan otomasi CorelDRAW' });
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch {
          resolve({ success: false, message: stdout.trim() || stderr || 'Gagal memproses respon CorelDRAW' });
        }
      }
    );
  });
});

// Toggle CorelDRAW Dark Mode (Canvas & Page Background)
ipcMain.handle('corel:toggle-dark-mode', async (_event, targetMode) => {
  return new Promise((resolve) => {
    const tempDir = app.getPath('temp');
    const tempPs1Path = path.join(tempDir, `corel_darkmode_${Date.now()}.ps1`);

    const psScript = `
$ErrorActionPreference = 'Stop'
$result = @{ success = $false; message = ''; mode = '${targetMode || 'dark'}' }

try {
    $corel = $null
    $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
    if ($curVer) {
        try { $corel = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer) } catch {
            try { $corel = New-Object -ComObject $curVer } catch {}
        }
    }
    if (-not $corel) {
        try { $corel = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application") } catch {
            try { $corel = New-Object -ComObject "CorelDRAW.Application" } catch {}
        }
    }

    if (-not $corel) {
        throw "CorelDRAW tidak terdeteksi. Silakan buka CorelDRAW terlebih dahulu."
    }

    $doc = $corel.ActiveDocument
    if (-not $doc) {
        throw "Tidak ada file/dokumen yang sedang terbuka di CorelDRAW."
    }

    $mode = "${targetMode || 'dark'}"

    if ($mode -eq 'dark') {
        for ($p = 1; $p -le $doc.Pages.Count; $p++) {
            $page = $doc.Pages.Item($p)
            $page.Background = 2 # cdrPageBackgroundSolid
            $page.Color.RGBAssign(30, 41, 59) # Dark Slate #1e293b
            $page.Bleed = 0
            try { $page.Printable = $false } catch {}
        }
        try {
            $doc.MasterPage.Background = 2
            $doc.MasterPage.Color.RGBAssign(30, 41, 59)
            $doc.MasterPage.Printable = $false
        } catch {}
        $result.message = "Mode Gelap (Dark Mode) CorelDRAW Berhasil Diaktifkan!"
    } else {
        for ($p = 1; $p -le $doc.Pages.Count; $p++) {
            $page = $doc.Pages.Item($p)
            $page.Background = 1 # cdrPageBackgroundNone / Default White
            $page.Color.RGBAssign(255, 255, 255)
        }
        try {
            $doc.MasterPage.Background = 1
            $doc.MasterPage.Color.RGBAssign(255, 255, 255)
        } catch {}
        $result.message = "Mode Terang CorelDRAW Kembali Aktif."
    }

    $corel.Refresh()
    if ($corel.ActiveWindow) { $corel.ActiveWindow.Refresh() }

    $result.success = $true
} catch {
    $result.success = $false
    $result.message = $_.Exception.Message
}

$result | ConvertTo-Json -Compress
`;

    fs.writeFileSync(tempPs1Path, psScript, 'utf-8');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs1Path],
      { timeout: 15000 },
      (err, stdout, stderr) => {
        try {
          if (fs.existsSync(tempPs1Path)) fs.unlinkSync(tempPs1Path);
        } catch {}

        if (err && !stdout) {
          resolve({ success: false, message: stderr || err?.message || 'Gagal mengubah tema CorelDRAW' });
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch {
          resolve({ success: false, message: stdout.trim() || stderr || 'Gagal memproses respon CorelDRAW' });
        }
      }
    );
  });
});

// Convert All Text Shapes to Curves (Ctrl+Q Massal pada Halaman Aktif)
ipcMain.handle('corel:convert-all-curves', async () => {
  return new Promise((resolve) => {
    const tempDir = app.getPath('temp');
    const tempPs1Path = path.join(tempDir, `corel_curves_${Date.now()}.ps1`);

    const psScript = `
$ErrorActionPreference = 'Stop'
$result = @{ success = $false; message = ''; count = 0 }

try {
    $corel = $null
    for ($v = 26; $v -ge 14; $v--) {
        try {
            $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
            if ($c) {
                if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                    $corel = $c
                    break
                } elseif (-not $corel) {
                    $corel = $c
                }
            }
        } catch {}
    }

    if (-not $corel) {
        $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
        if ($curVer) {
            try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {}
        }
    }
    if (-not $corel) {
        try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {}
    }

    if (-not $corel) {
        throw "CorelDRAW tidak terdeteksi. Silakan buka CorelDRAW terlebih dahulu."
    }

    $doc = $null
    try { $doc = $corel.ActiveDocument } catch {}
    if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
        try {
            $doc = $corel.Documents.Item(1)
            $doc.Activate()
        } catch {}
    }

    if (-not $doc) {
        throw "Tidak ada file/dokumen yang sedang terbuka di CorelDRAW."
    }

    $page = $doc.ActivePage
    if (-not $page) { $page = $doc.Pages.Item(1) }

    $corel.Optimization = $true
    $corel.EventsEnabled = $false
    $doc.BeginCommandGroup("Convert All Text to Curves")

    # Find all text shapes on active page (type 6 = cdrTextShape, recursive = true)
    $textShapes = $page.Shapes.FindShapes($null, 6, $true)
    $convertedCount = $textShapes.Count

    if ($convertedCount -gt 0) {
        for ($i = $convertedCount; $i -ge 1; $i--) {
            try {
                $ts = $textShapes.Item($i)
                $ts.ConvertToCurves()
            } catch {}
        }
    }

    $doc.EndCommandGroup()
    $corel.Optimization = $false
    $corel.EventsEnabled = $true
    $corel.Refresh()
    if ($corel.ActiveWindow) { $corel.ActiveWindow.Refresh() }

    $result.success = $true
    $result.count = $convertedCount
    $result.message = "Berhasil mengonversi $convertedCount objek teks menjadi kurva vektor (Curves)!"
} catch {
    try {
        if ($corel) {
            $corel.Optimization = $false
            $corel.EventsEnabled = $true
            if ($doc) { $doc.EndCommandGroup() }
            $corel.Refresh()
        }
    } catch {}

    $result.success = $false
    $result.message = $_.Exception.Message
}

$result | ConvertTo-Json -Compress
`;

    fs.writeFileSync(tempPs1Path, psScript, 'utf-8');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs1Path],
      { timeout: 25000 },
      (err, stdout, stderr) => {
        try {
          if (fs.existsSync(tempPs1Path)) fs.unlinkSync(tempPs1Path);
        } catch {}

        if (err && !stdout) {
          resolve({ success: false, message: stderr || err?.message || 'Gagal convert teks ke kurva' });
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch {
          resolve({ success: false, message: stdout.trim() || stderr || 'Gagal memproses respon CorelDRAW' });
        }
      }
    );
  });
});

// Select Folder Dialog for Batch Export
ipcMain.handle('dialog:select-export-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Pilih Folder Penyimpanan Hasil Export',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (canceled || filePaths.length === 0) {
    return { canceled: true, folderPath: null };
  }
  return { canceled: false, folderPath: filePaths[0] };
});

// Batch Export Selected Shapes in CorelDRAW
ipcMain.handle('corel:batch-export-selection', async (_event, payload) => {
  return new Promise((resolve) => {
    const {
      exportDir,
      format = 'jpg',
      colorMode = 'rgb',
      resolutionDpi = 300,
      quality = 100,
      transparent = false,
      antiAliased = true,
    } = payload || {};

    if (!exportDir) {
      return resolve({ success: false, message: 'Silakan pilih folder tujuan ekspor terlebih dahulu.' });
    }

    const cleanExportDir = path.normalize(exportDir).replace(/[\/\\]+$/, '');

    let filterId = 774; // cdrJPEG
    let ext = 'jpg';
    if (format === 'png') {
      filterId = 777; // cdrPNG
      ext = 'png';
    } else if (format === 'tif') {
      filterId = 788; // cdrTIFF
      ext = 'tif';
    } else if (format === 'pdf') {
      filterId = 1297; // cdrPDF
      ext = 'pdf';
    }

    let imgType = 5; // cdrRGBColorImage
    if (colorMode === 'cmyk') {
      imgType = 4; // cdrCMYKColorImage
    } else if (colorMode === 'grayscale') {
      imgType = 2; // cdrGrayscaleImage
    }

    const isTrans = transparent ? '$true' : '$false';
    const antiVal = antiAliased ? 1 : 0;
    const qual = Math.max(1, Math.min(100, parseInt(quality, 10) || 100));
    const dpi = Math.max(50, Math.min(2400, parseInt(resolutionDpi, 10) || 300));

    const ps = `
$ErrorActionPreference = 'SilentlyContinue'

$csharpCode = @"
using System;
using System.IO;

public class DlrExporter {
    public static bool ExportShape(object docObj, object shpObj, string outPath, int filterId, int imgType, int dpi, int qual, bool isTrans, int antiVal) {
        try {
            dynamic shp = shpObj;
            shp.CreateSelection();
            
            dynamic doc = docObj;
            dynamic exp = doc.ExportBitmap(outPath, filterId, 1, imgType, 0, 0, dpi, dpi, antiVal, false, isTrans, true, false, 100 - qual);
            if (exp != null) {
                exp.Finish();
            }
            return File.Exists(outPath);
        } catch {
            return false;
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies "Microsoft.CSharp.dll", "System.Core.dll" -ErrorAction SilentlyContinue | Out-Null
} catch {}

$corel = $null
for ($v = 26; $v -ge 14; $v--) {
    try {
        $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
        if ($c) {
            if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                $corel = $c
                break
            } elseif (-not $corel) {
                $corel = $c
            }
        }
    } catch {}
}
if (-not $corel) {
    $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
    if ($curVer) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {} }
}
if (-not $corel) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {} }

if (-not $corel) {
  @{ success = $false; message = "CorelDRAW tidak terdeteksi. Silakan buka file pola di CorelDRAW." } | ConvertTo-Json -Compress
  exit
}

$doc = $null
try { $doc = $corel.ActiveDocument } catch {}
if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
    try {
        $doc = $corel.Documents.Item(1)
        $doc.Activate()
    } catch {}
}

if (-not $doc) {
  @{ success = $false; message = "Tidak ada file/dokumen yang sedang terbuka di CorelDRAW." } | ConvertTo-Json -Compress
  exit
}

function Get-RangeCount($r) {
    if (-not $r) { return 0 }
    try { if ($r.Count -ne $null) { return [int]$r.Count } } catch {}
    try { if ($r.Shapes -and $r.Shapes.Count -ne $null) { return [int]$r.Shapes.Count } } catch {}
    return 0
}

function Get-RangeItem($r, [int]$idx) {
    if (-not $r) { return $null }
    try { $it = $r.Item($idx); if ($it) { return $it } } catch {}
    try { $it = $r.Shapes.Item($idx); if ($it) { return $it } } catch {}
    try { $it = $r[$idx]; if ($it) { return $it } } catch {}
    return $null
}

$sel = $null
try { $sel = $corel.ActiveSelection } catch {}
if (-not $sel -or (Get-RangeCount $sel) -eq 0) {
  try { $sel = $doc.Selection } catch {}
}
$selCount = Get-RangeCount $sel
if ($selCount -eq 0) {
  @{ success = $false; message = "Silakan seleksi (blok) seluruh grup pola baju di CorelDRAW." } | ConvertTo-Json -Compress
  exit
}

$outDir = @'
${cleanExportDir}
'@.Trim()

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$shapesList = @()
for ($s = 1; $s -le $selCount; $s++) {
  $itShp = Get-RangeItem $sel $s
  if ($itShp) { $shapesList += $itShp }
}

$exportedCount = 0

for ($idx = 0; $idx -lt $shapesList.Count; $idx++) {
  $shp = $shapesList[$idx]

  $nameFound = ""
  $numFound = ""
  try {
    if ($shp.Type -eq 6) {
      $txt = $shp.Text.Story.Text.Trim()
      if ($txt -match '^\\d+$') { $numFound = $txt } else { $nameFound = $txt }
    }
  } catch {}

  $cleanName = if ($nameFound) { $nameFound -replace '[\\\\/:*?"<>|\\r\\n]', '_' } else { "" }
  $cleanNum = if ($numFound) { $numFound -replace '[\\\\/:*?"<>|\\r\\n]', '_' } else { "" }

  $prefix = ($idx + 1).ToString("D2")
  $fileName = if ($cleanName -and $cleanNum) {
    "$($prefix)_$($cleanName)_$($cleanNum).${ext}"
  } elseif ($cleanName) {
    "$($prefix)_$($cleanName).${ext}"
  } else {
    "$($prefix)_Pola_Baju_$($prefix).${ext}"
  }

  $outFilePath = Join-Path -Path $outDir -ChildPath $fileName
  if (Test-Path $outFilePath) {
    Remove-Item -Path $outFilePath -Force -ErrorAction SilentlyContinue
  }

  $ok = [DlrExporter]::ExportShape($doc, $shp, $outFilePath, [int]${filterId}, [int]${imgType}, [int]${dpi}, [int]${qual}, [bool]${isTrans}, [int]${antiVal})
  if ($ok -or (Test-Path $outFilePath)) {
    $exportedCount++
  }
}

$sel.CreateSelection()

if ($exportedCount -gt 0) {
  @{ success = $true; count = $exportedCount; folder = $outDir; message = "Berhasil mengekspor $exportedCount file gambar ke folder tujuan!" } | ConvertTo-Json -Compress
} else {
  @{ success = $false; message = "Gagal menyimpan file gambar ke: $outDir" } | ConvertTo-Json -Compress
}
`;

    const tempDir = app.getPath('temp');
    const tempPs = path.join(tempDir, `corel_batch_${Date.now()}.ps1`);
    fs.writeFileSync(tempPs, ps, 'utf-8');

    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs], { timeout: 60000 }, (err, stdout) => {
      try { if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs); } catch {}
      try {
        const cleanJson = stdout.trim().split('\n').pop().trim();
        const res = JSON.parse(cleanJson);
        resolve(res);
      } catch (e) {
        resolve({ success: false, message: stdout.trim() || 'Gagal membaca respon CorelDRAW' });
      }
    });
  });
});

// Step-by-Step Native CorelDRAW Export Dialog (^e Trigger) with StaticIDs preservation
ipcMain.handle('corel:export-next-selection', async (_event, payload) => {
  return new Promise((resolve) => {
    const targetIdx = parseInt(payload?.index || 0, 10);
    const reset = targetIdx === 0;
    const passedIds = Array.isArray(payload?.shapeIds) ? payload.shapeIds.join(',') : '';

    const ps = `
      $ErrorActionPreference = 'SilentlyContinue'
      $corel = $null
      for ($v = 26; $v -ge 14; $v--) {
          try {
              $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
              if ($c) {
                  if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                      $corel = $c
                      break
                  } elseif (-not $corel) {
                      $corel = $c
                  }
              }
          } catch {}
      }
      if (-not $corel) {
          $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
          if ($curVer) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {} }
      }
      if (-not $corel) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {} }

      if (-not $corel) {
        @{ success = $false; message = "CorelDRAW tidak terdeteksi. Silakan buka CorelDRAW." } | ConvertTo-Json -Compress
        exit
      }

      $doc = $null
      try { $doc = $corel.ActiveDocument } catch {}
      if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
          try {
              $doc = $corel.Documents.Item(1)
              $doc.Activate()
          } catch {}
      }

      if (-not $doc) {
        @{ success = $false; message = "Tidak ada dokumen yang sedang terbuka di CorelDRAW." } | ConvertTo-Json -Compress
        exit
      }

      $idx = ${targetIdx}
      $reset = $${reset ? 'true' : 'false'}
      $passedIds = '${passedIds}'

      $idList = @()
      if ($passedIds) {
        $idList = @($passedIds.Split(',') | Where-Object { $_ -match '^\\d+$' } | ForEach-Object { [int]$_ })
      }

      function Get-RangeCount($r) {
          if (-not $r) { return 0 }
          try { if ($r.Count -ne $null) { return [int]$r.Count } } catch {}
          try { if ($r.Shapes -and $r.Shapes.Count -ne $null) { return [int]$r.Shapes.Count } } catch {}
          return 0
      }

      function Get-RangeItem($r, [int]$idx) {
          if (-not $r) { return $null }
          try { $it = $r.Item($idx); if ($it) { return $it } } catch {}
          try { $it = $r.Shapes.Item($idx); if ($it) { return $it } } catch {}
          try { $it = $r[$idx]; if ($it) { return $it } } catch {}
          return $null
      }

      if ($reset -or $idList.Count -eq 0) {
        $sel = $null
        try { $sel = $corel.ActiveSelection } catch {}
        if (-not $sel -or (Get-RangeCount $sel) -eq 0) {
          try { $sel = $doc.Selection } catch {}
        }
        $selCount = Get-RangeCount $sel
        if ($selCount -eq 0) {
          @{ success = $false; message = "Silakan seleksi (blok) seluruh grup pola baju di CorelDRAW terlebih dahulu." } | ConvertTo-Json -Compress
          exit
        }
        $idList = @()
        for ($s = 1; $s -le $selCount; $s++) {
          $itShp = Get-RangeItem $sel $s
          if ($itShp) {
            $idList += [int]$itShp.StaticID
          }
        }
      }

      $total = $idList.Count
      if ($idx -lt $total) {
        $targetId = $idList[$idx]
        $targetShp = $doc.ActivePage.Shapes.ItemByStaticID($targetId)
        if (-not $targetShp) {
          for ($s = 1; $s -le $doc.ActivePage.Shapes.Count; $s++) {
            if ($doc.ActivePage.Shapes.Item($s).StaticID -eq $targetId) {
              $targetShp = $doc.ActivePage.Shapes.Item($s)
              break
            }
          }
        }

        if ($targetShp) {
          $targetShp.CreateSelection()
        }

        $wsh = New-Object -ComObject WScript.Shell
        [void]$wsh.AppActivate("CorelDRAW")
        Start-Sleep -Milliseconds 200
        $wsh.SendKeys("^e")

        @{
          success = $true
          current = ($idx + 1)
          total = $total
          hasNext = (($idx + 1) -lt $total)
          shapeIds = $idList
          message = "Membuka dialog Export CorelDRAW untuk Pola $($idx + 1) dari $total..."
        } | ConvertTo-Json -Compress
      } else {
        @{ success = $true; finished = $true; message = "Semua pola telah selesai diproses!" } | ConvertTo-Json -Compress
      }
    `;

    const tempDir = app.getPath('temp');
    const tempPs = path.join(tempDir, `corel_step_${Date.now()}.ps1`);
    fs.writeFileSync(tempPs, ps, 'utf-8');

    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs], { timeout: 15000 }, (err, stdout) => {
      try { if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs); } catch {}
      try {
        const cleanJson = stdout.trim().split('\n').pop().trim();
        const res = JSON.parse(cleanJson);
        resolve(res);
      } catch (e) {
        resolve({ success: false, message: stdout.trim() || 'Gagal memicu ekspor CorelDRAW' });
      }
    });
  });
});

// Get Selection Dimensions & Info for Transformation Panel
ipcMain.handle('corel:get-selection-info', async () => {
  return new Promise((resolve) => {
    const tempDir = app.getPath('temp');
    const psFile = path.join(tempDir, `corel_sel_${Date.now()}.ps1`);
    const script = `
$ErrorActionPreference = 'SilentlyContinue'
$result = @{ success = $false; count = 0; widthCm = 0; heightCm = 0 }
try {
    $corel = $null
    for ($v = 26; $v -ge 14; $v--) {
        try {
            $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
            if ($c) {
                if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                    $corel = $c
                    break
                } elseif (-not $corel) {
                    $corel = $c
                }
            }
        } catch {}
    }
    if (-not $corel) {
        $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
        if ($curVer) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {} }
    }
    if (-not $corel) { try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {} }
    
    if ($corel) {
        $doc = $null
        try { $doc = $corel.ActiveDocument } catch {}
        if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
            try { $doc = $corel.Documents.Item(1); $doc.Activate() } catch {}
        }

        if ($doc) {
            $doc.Unit = 3 # cdrCentimeter
            $sel = $null
            try { $sel = $corel.ActiveSelection } catch {}
            if (-not $sel -or $sel.Shapes.Count -eq 0) {
                try { $sel = $doc.Selection } catch {}
            }

            if ($sel -and $sel.Shapes.Count -gt 0) {
                $w = [math]::Round([double]$sel.SizeWidth, 3)
                $h = [math]::Round([double]$sel.SizeHeight, 3)
                $result.success = $true
                $result.count = $sel.Shapes.Count
                $result.widthCm = $w
                $result.heightCm = $h
            } else {
                $result.success = $true
            }
        }
    }
} catch {}
$result | ConvertTo-Json -Compress
`;
    fs.writeFileSync(psFile, script, 'utf-8');
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile],
      { timeout: 4000 },
      (err, stdout) => {
        try {
          if (fs.existsSync(psFile)) fs.unlinkSync(psFile);
        } catch {}
        if (err || !stdout) {
          resolve({ success: false, count: 0, widthCm: 0, heightCm: 0 });
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch {
          resolve({ success: false, count: 0, widthCm: 0, heightCm: 0 });
        }
      }
    );
  });
});

// Open Numerator Companion Tool Window
ipcMain.handle('corel:open-numerator-tool', async () => {
  const win = createCorelNumeratorWindow();
  if (win) {
    win.show();
    win.focus();
  }
  return { success: true };
});

// Execute Numerator in CorelDRAW (Supporting CorelDRAW X7 up to 2024 seamlessly)
ipcMain.handle('corel:execute-numerator', async (_event, payload) => {
  return new Promise((resolve) => {
    const {
      start = 1,
      end = 100,
      step = 1,
      digits = 4,
      prefix = '',
      suffix = '',
      mode = 'page',
      cols = 2,
      rows = 5,
      spacingX = 0.5,
      spacingY = 0.5,
      gridOrder = 'cut_stack',
      autoCurves = true,
      doubleNumber = true,
    } = payload || {};

    const tempDir = app.getPath('temp');
    const tempPs1Path = path.join(tempDir, `corel_num_${Date.now()}.ps1`);

    const psScript = `
$ErrorActionPreference = 'Stop'
$result = @{ success = $false; message = ''; count = 0; totalPages = 0 }

trap {
    $errLine = $_.InvocationInfo.ScriptLineNumber
    $errMsg = $_.Exception.Message
    if (-not $errMsg) { $errMsg = "$_" }
    $res = @{
        success = $false
        message = "CorelDRAW Error (Line $errLine): $errMsg"
    }
    $res | ConvertTo-Json -Compress
    exit 0
}

try {
    $start = [int]${start || 1}
    $end = [int]${end || 1}
    $step = [int]${step || 1}
    $digits = [int]${digits || 0}
    $prefix = "${(prefix || '').replace(/"/g, '`"')}"
    $suffix = "${(suffix || '').replace(/"/g, '`"')}"
    $mode = "${mode || 'page'}"
    $cols = [int]${cols || 2}
    $rows = [int]${rows || 5}
    $spacingX = [double]${spacingX || 0.5}
    $spacingY = [double]${spacingY || 0.5}
    $gridOrder = "${gridOrder || 'cut_stack'}"
    $autoCurves = [bool]${autoCurves ? '$true' : '$false'}
    $doubleNumber = [bool]${doubleNumber ? '$true' : '$false'}

    # 1. Connect to active CorelDRAW COM instance (Supporting Corel X7 to 2024 seamlessly)
    $corel = $null
    for ($v = 26; $v -ge 14; $v--) {
        try {
            $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application.$v")
            if ($c) {
                if ($c.ActiveDocument -or ($c.Documents -and $c.Documents.Count -gt 0)) {
                    $corel = $c
                    break
                } elseif (-not $corel) {
                    $corel = $c
                }
            }
        } catch {}
    }

    if (-not $corel) {
        $curVer = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\\CorelDRAW.Application\\CurVer" -ErrorAction SilentlyContinue).'(default)'
        if ($curVer) {
            try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject($curVer); if ($c) { $corel = $c } } catch {}
        }
    }
    if (-not $corel) {
        try { $c = [System.Runtime.InteropServices.Marshal]::GetActiveObject("CorelDRAW.Application"); if ($c) { $corel = $c } } catch {}
    }

    if (-not $corel) {
        throw "Tidak dapat terhubung ke CorelDRAW. Pastikan CorelDRAW sedang terbuka."
    }

    $doc = $null
    try { $doc = $corel.ActiveDocument } catch {}
    if (-not $doc -and $corel.Documents -and $corel.Documents.Count -gt 0) {
        try {
            $doc = $corel.Documents.Item(1)
            $doc.Activate()
        } catch {}
    }

    if (-not $doc) {
        throw "Tidak ada file/dokumen yang sedang terbuka di CorelDRAW. Silakan buka file desain di CorelDRAW."
    }
    $doc.Unit = 3 # cdrCentimeter

    function Get-FormattedNum([int]$val, [int]$dig, [string]$pfx, [string]$sfx) {
        $numPart = [string]$val
        if ($dig -gt 0) {
            $numPart = $numPart.PadLeft($dig, '0')
        }
        return "$pfx$numPart$sfx"
    }

    function Is-NumberPlaceholder([string]$txt) {
        if ([string]::IsNullOrWhiteSpace($txt)) { return $false }
        $t = $txt.Trim()
        if ($t -match '^\\d+$') { return $true }
        if ($t -match '^(no|no\\.|kpn|vcr|id|tiket|kupon|#|numb|num)?\\s*[:.-]?\\s*\\d+\\s*[a-z0-9/-]*$' -and $t.Length -le 18) { return $true }
        if ($t -match '\\d+' -and $t.Length -le 10) { return $true }
        return $false
    }

    function Set-ShapeNumberText($targetShape, [string]$textVal, [bool]$allowMulti) {
        if (-not $targetShape) { return 0 }
        $c = 0
        try {
            if ($targetShape.Type -eq 6) {
                $targetShape.Text.Story.Text = $textVal
                return 1
            }
            $textShapes = $targetShape.Shapes.FindShapes($null, 6, $true)
            if ($textShapes -and $textShapes.Count -gt 0) {
                for ($k = 1; $k -le $textShapes.Count; $k++) {
                    $ts = $textShapes.Item($k)
                    $rawText = ""
                    try { $rawText = $ts.Text.Story.Text } catch {}
                    if (Is-NumberPlaceholder $rawText) {
                        try {
                            $ts.Text.Story.Text = $textVal
                            $c++
                            if (-not $allowMulti) { break }
                        } catch {}
                    }
                }
                if ($c -eq 0) {
                    for ($k = 1; $k -le $textShapes.Count; $k++) {
                        $ts = $textShapes.Item($k)
                        try {
                            $ts.Text.Story.Text = $textVal
                            $c++
                            if (-not $allowMulti) { break }
                        } catch {}
                    }
                }
            }
        } catch {}
        return $c
    }

    function Get-RangeCount($r) {
        if (-not $r) { return 0 }
        try { if ($r.Count -ne $null) { return [int]$r.Count } } catch {}
        try { if ($r.Shapes -and $r.Shapes.Count -ne $null) { return [int]$r.Shapes.Count } } catch {}
        return 0
    }

    function Get-RangeItem($r, [int]$idx) {
        if (-not $r) { return $null }
        try { $it = $r.Item($idx); if ($it) { return $it } } catch {}
        try { $it = $r.Shapes.Item($idx); if ($it) { return $it } } catch {}
        try { $it = $r[$idx]; if ($it) { return $it } } catch {}
        return $null
    }

    $numList = @()
    for ($n = $start; $n -le $end; $n += $step) {
        $numList += $n
    }
    $totalNumbers = $numList.Count
    if ($totalNumbers -eq 0) { throw "Jumlah nomor yang dihasilkan adalah 0." }

    $doc.BeginCommandGroup("GFX IT PRINTING Numerator Machine")

    $sel = $null
    try { $sel = $corel.ActiveSelection } catch {}
    if (-not $sel -or (Get-RangeCount $sel) -eq 0) {
        try { $sel = $doc.Selection } catch {}
    }
    $selCount = Get-RangeCount $sel

    if ($mode -eq 'inplace' -or ($selCount -gt 1 -and $mode -ne 'grid')) {
        $shapeList = @()
        for ($i = 1; $i -le $selCount; $i++) {
            $s = Get-RangeItem $sel $i
            if ($s) {
                $shapeList += [PSCustomObject]@{
                    Shape = $s
                    PosX = [double]$s.PositionX
                    PosY = [double]$s.PositionY
                    Height = [double]$s.SizeHeight
                }
            }
        }

        $rowTol = 1.0
        if ($shapeList.Count -gt 0 -and $shapeList[0].Height -gt 0) {
            $rowTol = [math]::Max(0.2, $shapeList[0].Height * 0.35)
        }

        $sorted = $shapeList | Sort-Object -Property @{ Expression = { [math]::Round($_.PosY / $rowTol) }; Descending = $true }, @{ Expression = { $_.PosX }; Descending = $false }

        $countToUpdate = [math]::Min($sorted.Count, $totalNumbers)
        for ($i = 0; $i -lt $countToUpdate; $i++) {
            $formattedNum = Get-FormattedNum $numList[$i] $digits $prefix $suffix
            $targetShp = $sorted[$i].Shape
            Set-ShapeNumberText $targetShp $formattedNum $doubleNumber | Out-Null
        }
        $result.count = $countToUpdate
        $result.totalPages = 1
    }
    elseif ($mode -eq 'page') {
        $masterPage = $doc.ActivePage
        if (-not $masterPage) { $masterPage = $doc.Pages.Item(1) }

        $masterTexts = $masterPage.Shapes.FindShapes($null, 6, $true)
        $textList = @()
        if ($masterTexts -and $masterTexts.Count -gt 0) {
            for ($k = 1; $k -le $masterTexts.Count; $k++) {
                $t = $masterTexts.Item($k)
                $rawText = ""
                try { $rawText = $t.Text.Story.Text } catch {}
                if (Is-NumberPlaceholder $rawText) {
                    $textList += [PSCustomObject]@{
                        Shape = $t
                        PosX = [double]$t.PositionX
                        PosY = [double]$t.PositionY
                        Height = [double]$t.SizeHeight
                    }
                }
            }
            if ($textList.Count -eq 0) {
                for ($k = 1; $k -le $masterTexts.Count; $k++) {
                    $t = $masterTexts.Item($k)
                    $textList += [PSCustomObject]@{
                        Shape = $t
                        PosX = [double]$t.PositionX
                        PosY = [double]$t.PositionY
                        Height = [double]$t.SizeHeight
                    }
                }
            }
        }

        $itemsPerPage = [math]::Max(1, $textList.Count)
        if ($textList.Count -gt 0) {
            $rowTol = [math]::Max(0.2, $textList[0].Height * 0.35)
            $sortedTexts = $textList | Sort-Object -Property @{ Expression = { [math]::Round($_.PosY / $rowTol) }; Descending = $true }, @{ Expression = { $_.PosX }; Descending = $false }
            $textList = $sortedTexts
        }

        $totalPages = [math]::Ceiling($totalNumbers / $itemsPerPage)

        $countPage1 = [math]::Min($itemsPerPage, $totalNumbers)
        for ($i = 0; $i -lt $countPage1; $i++) {
            $numVal = Get-FormattedNum $numList[$i] $digits $prefix $suffix
            $textList[$i].Shape.Text.Story.Text = $numVal
        }

        if ($totalPages -gt 1) {
            [void]$masterPage.Shapes.All().Copy()
            for ($p = 2; $p -le $totalPages; $p++) {
                $newPage = $doc.AddPages(1)
                $newPage.Activate()
                [void]$doc.ActiveLayer.Paste()

                $newTexts = $newPage.Shapes.FindShapes($null, 6, $true)
                $newTextList = @()
                if ($newTexts -and $newTexts.Count -gt 0) {
                    for ($k = 1; $k -le $newTexts.Count; $k++) {
                        $t = $newTexts.Item($k)
                        $rawText = ""
                        try { $rawText = $t.Text.Story.Text } catch {}
                        if (Is-NumberPlaceholder $rawText) {
                            $newTextList += [PSCustomObject]@{
                                Shape = $t
                                PosX = [double]$t.PositionX
                                PosY = [double]$t.PositionY
                                Height = [double]$t.SizeHeight
                            }
                        }
                    }
                    if ($newTextList.Count -eq 0) {
                        for ($k = 1; $k -le $newTexts.Count; $k++) {
                            $t = $newTexts.Item($k)
                            $newTextList += [PSCustomObject]@{
                                Shape = $t
                                PosX = [double]$t.PositionX
                                PosY = [double]$t.PositionY
                                Height = [double]$t.SizeHeight
                            }
                        }
                    }
                    $rowTol = [math]::Max(0.2, $newTextList[0].Height * 0.35)
                    $sortedNew = $newTextList | Sort-Object -Property @{ Expression = { [math]::Round($_.PosY / $rowTol) }; Descending = $true }, @{ Expression = { $_.PosX }; Descending = $false }
                    $newTextList = $sortedNew
                }

                $startIndex = ($p - 1) * $itemsPerPage
                $countThisPage = [math]::Min($itemsPerPage, $totalNumbers - $startIndex)
                for ($i = 0; $i -lt $countThisPage; $i++) {
                    $numVal = Get-FormattedNum $numList[$startIndex + $i] $digits $prefix $suffix
                    if ($i -lt $newTextList.Count) {
                        $newTextList[$i].Shape.Text.Story.Text = $numVal
                    }
                }
            }
        }

        $result.count = $totalNumbers
        $result.totalPages = $totalPages
    }
    elseif ($mode -eq 'grid') {
        if ($selCount -eq 0) {
            throw "Silakan seleksi (blok) 1 desain master voucher/tiket di CorelDRAW terlebih dahulu."
        }

        $masterShape = if ($selCount -gt 1) { $sel.Group() } else { Get-RangeItem $sel 1 }
        if (-not $masterShape) {
            throw "Gagal membaca objek seleksi master di CorelDRAW."
        }

        $w = [double]$masterShape.SizeWidth
        $h = [double]$masterShape.SizeHeight
        $origX = [double]$masterShape.PositionX
        $origY = [double]$masterShape.PositionY

        $perPage = $cols * $rows
        $totalPages = [math]::Ceiling($totalNumbers / $perPage)
        $masterPage = $doc.ActivePage
        if (-not $masterPage) { $masterPage = $doc.Pages.Item(1) }

        # 1. Tata susunan grid lengkap di Halaman 1
        $page1Shapes = @()
        for ($r = 0; $r -lt $rows; $r++) {
            for ($c = 0; $c -lt $cols; $c++) {
                $targetPosX = $origX + ($c * ($w + $spacingX))
                $targetPosY = $origY - ($r * ($h + $spacingY))

                if ($r -eq 0 -and $c -eq 0) {
                    $masterShape.PositionX = $targetPosX
                    $masterShape.PositionY = $targetPosY
                    $page1Shapes += $masterShape
                } else {
                    $dup = $masterShape.Duplicate()
                    $dup.PositionX = $targetPosX
                    $dup.PositionY = $targetPosY
                    $page1Shapes += $dup
                }
            }
        }

        # 2. Isi nomor urut pada Halaman 1 per grup voucher (semua nomor di 1 kupon bernomor sama)
        for ($s = 0; $s -lt $perPage; $s++) {
            $itemIdx = if ($gridOrder -eq 'cut_stack') { ($s * $totalPages) } else { $s }
            if ($itemIdx -lt $totalNumbers) {
                $formattedNum = Get-FormattedNum $numList[$itemIdx] $digits $prefix $suffix
                Set-ShapeNumberText $page1Shapes[$s] $formattedNum $true | Out-Null
            } else {
                try { $page1Shapes[$s].Delete() } catch {}
            }
        }

        # 3. Duplicate Page 1 to Pages 2..TotalPages dan isi semua nomor per grup voucher
        if ($totalPages -gt 1) {
            $masterPage.Activate()
            [void]$doc.ActiveLayer.Shapes.All().Copy()

            for ($p = 2; $p -le $totalPages; $p++) {
                $newPage = $doc.AddPages(1)
                $newPage.Activate()
                $pIdx = $p - 1

                [void]$doc.ActiveLayer.Paste()

                $newShapes = @()
                for ($k = 1; $k -le $newPage.Shapes.Count; $k++) {
                    $shp = $newPage.Shapes.Item($k)
                    $newShapes += [PSCustomObject]@{
                        Shape = $shp
                        PosX = [double]$shp.PositionX
                        PosY = [double]$shp.PositionY
                        Height = [double]$shp.SizeHeight
                    }
                }

                $rowTol = [math]::Max(0.2, $h * 0.35)
                $sortedVouchers = $newShapes | Sort-Object -Property @{ Expression = { [math]::Round($_.PosY / $rowTol) }; Descending = $true }, @{ Expression = { $_.PosX }; Descending = $false }

                for ($s = 0; $s -lt $sortedVouchers.Count; $s++) {
                    $itemIdx = if ($gridOrder -eq 'cut_stack') { ($s * $totalPages) + $pIdx } else { ($pIdx * $perPage) + $s }
                    if ($itemIdx -lt $totalNumbers) {
                        $formattedNum = Get-FormattedNum $numList[$itemIdx] $digits $prefix $suffix
                        Set-ShapeNumberText $sortedVouchers[$s].Shape $formattedNum $true | Out-Null
                    } else {
                        try { $sortedVouchers[$s].Shape.Delete() } catch {}
                    }
                }
            }
        }

        $result.count = $totalNumbers
        $result.totalPages = $totalPages
    }

    if ($autoCurves) {
        for ($p = 1; $p -le $doc.Pages.Count; $p++) {
            try {
                $pageObj = $doc.Pages.Item($p)
                $allTexts = $pageObj.Shapes.FindShapes($null, 6, $true)
                if ($allTexts -and $allTexts.Count -gt 0) {
                    for ($k = $allTexts.Count; $k -ge 1; $k--) {
                        try {
                            $allTexts.Item($k).ConvertToCurves()
                        } catch {}
                    }
                }
            } catch {}
        }
    }

    $doc.EndCommandGroup()
    try { $corel.Refresh() } catch {}
    try { if ($corel.ActiveWindow) { $corel.ActiveWindow.Refresh() } } catch {}

    $result.success = $true
    $result.message = "Berhasil membuat $($result.count) nomorator pada $($result.totalPages) halaman di CorelDRAW!"
}
catch {
    try {
        if ($doc) { $doc.EndCommandGroup() }
        try { $corel.Refresh() } catch {}
        try { if ($corel.ActiveWindow) { $corel.ActiveWindow.Refresh() } } catch {}
    } catch {}
    $result.success = $false
    $result.message = "$($_.Exception.Message)"
}

$result | ConvertTo-Json -Compress
`;

    fs.writeFileSync(tempPs1Path, psScript, 'utf-8');

    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempPs1Path],
      { timeout: 300000 },
      (err, stdout, stderr) => {
        try {
          if (fs.existsSync(tempPs1Path)) fs.unlinkSync(tempPs1Path);
        } catch {}

        if (err && !stdout) {
          const cleanErr = (stderr || err?.message || 'Gagal menjalankan penomoran di CorelDRAW')
            .replace(/Command failed:.*?\n/, '')
            .trim();
          resolve({ success: false, message: cleanErr || 'Gagal menjalankan penomoran di CorelDRAW' });
          return;
        }

        try {
          const raw = (stdout || '').trim();
          const jsonMatch = raw.match(/\{"success":[\s\S]*\}$/);
          if (jsonMatch) {
            return resolve(JSON.parse(jsonMatch[0]));
          }
          const lines = raw.split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              return resolve(JSON.parse(line));
            }
          }
          resolve(JSON.parse(raw));
        } catch {
          resolve({ success: false, message: stdout.trim() || stderr || 'Gagal memproses respon CorelDRAW' });
        }
      }
    );
  });
});

app.whenReady().then(() => {


  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
