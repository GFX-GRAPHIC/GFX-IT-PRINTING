const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  unmaximizeWindow: () => ipcRenderer.send('window-unmaximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  printThermal: (options) => ipcRenderer.invoke('print-thermal', options),
  printDocument: (options) => ipcRenderer.invoke('print-document', options),
  reloadWindow: () => ipcRenderer.send('window-reload'),
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-change', (_event, state) => callback(state));
  },
  // CorelDRAW Automation APIs
  corelOpenCompanionTool: (data) => ipcRenderer.invoke('corel:open-companion-tool', data),
  corelGetActiveOrderData: () => ipcRenderer.invoke('corel:get-active-order-data'),
  corelCheckStatus: () => ipcRenderer.invoke('corel:check-status'),
  corelGetSelectionInfo: () => ipcRenderer.invoke('corel:get-selection-info'),
  corelExecuteLayout: (payload) => ipcRenderer.invoke('corel:execute-layout', payload),
  corelToggleDarkMode: (mode) => ipcRenderer.invoke('corel:toggle-dark-mode', mode),
  corelConvertAllCurves: () => ipcRenderer.invoke('corel:convert-all-curves'),
  dialogSelectExportFolder: () => ipcRenderer.invoke('dialog:select-export-folder'),
  corelBatchExportSelection: (payload) => ipcRenderer.invoke('corel:batch-export-selection', payload),
  corelExportNextSelection: (payload) => ipcRenderer.invoke('corel:export-next-selection', payload),
  corelOpenNumeratorTool: () => ipcRenderer.invoke('corel:open-numerator-tool'),
  corelOpenAiTracerTool: () => ipcRenderer.invoke('corel:open-ai-tracer-tool'),
  corelExecuteNumerator: (payload) => ipcRenderer.invoke('corel:execute-numerator', payload),
  // License Management APIs
  licenseGetStatus: () => ipcRenderer.invoke('license:get-status'),
  licenseActivate: (key) => ipcRenderer.invoke('license:activate', key),
  licenseGetHwid: () => ipcRenderer.invoke('license:get-hwid'),
  onLicenseBlocked: (callback) => ipcRenderer.on('license:blocked', (_event, data) => callback(data)),
  // Auto-Updater APIs
  onUpdaterStatus: (callback) => ipcRenderer.on('updater:status', (_event, data) => callback(data)),
  updaterCheck: () => ipcRenderer.invoke('updater:check'),
  updaterInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
  // AI Jersey Tracer APIs
  aiTracerValidateKey: (apiKey) => ipcRenderer.invoke('corel:ai-tracer-validate-key', apiKey),
  aiTracerProcess: (payload) => ipcRenderer.invoke('corel:ai-tracer-process', payload),
  corelApplyAiPattern: (payload) => ipcRenderer.invoke('corel:apply-ai-pattern', payload),
  copyImageToClipboard: (payload) => ipcRenderer.invoke('corel:copy-image-clipboard', payload),
  readImageFromClipboard: () => ipcRenderer.invoke('corel:read-image-clipboard'),
  savePatternImage: (payload) => ipcRenderer.invoke('corel:save-pattern-image', payload),
  openExternalUrl: (url) => ipcRenderer.invoke('corel:open-external-url', url),
  openFileInExplorer: (filePath) => ipcRenderer.invoke('corel:open-file-explorer', filePath),
  tracerToggleAlwaysOnTop: () => ipcRenderer.invoke('tracer:toggle-always-on-top'),
  onTracerClipboardReady: (callback) => {
    ipcRenderer.on('tracer:clipboard-image-ready', () => callback());
  },
});



