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
});



