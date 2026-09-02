/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    unmaximizeWindow: () => void;
    closeWindow: () => void;
    isMaximized: () => Promise<boolean>;
    printThermal: (options?: any) => Promise<{ success: boolean; error?: string }>;
    printDocument: (options?: any) => Promise<{ success: boolean; error?: string }>;
    reloadWindow: () => void;
    onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => void;
    // Corel & Licensing
    corelOpenCompanionTool?: (data?: any) => Promise<any>;
    corelGetActiveOrderData?: () => Promise<any>;
    corelCheckStatus?: () => Promise<any>;
    corelGetSelectionInfo?: () => Promise<any>;
    corelExecuteLayout?: (payload?: any) => Promise<any>;
    corelToggleDarkMode?: (mode?: any) => Promise<any>;
    corelConvertAllCurves?: () => Promise<any>;
    dialogSelectExportFolder?: () => Promise<any>;
    corelBatchExportSelection?: (payload?: any) => Promise<any>;
    corelExportNextSelection?: (payload?: any) => Promise<any>;
    corelOpenNumeratorTool?: () => Promise<any>;
    corelExecuteNumerator?: (payload?: any) => Promise<any>;
    licenseGetStatus?: () => Promise<any>;
    licenseActivate?: (key: string) => Promise<any>;
    licenseGetHwid?: () => Promise<any>;
    onLicenseBlocked?: (callback: (data: { reason: string }) => void) => void;
    // Auto-Updater
    onUpdaterStatus?: (callback: (data: { status: string; version?: string; percent?: number; error?: string }) => void) => void;
    updaterCheck?: () => Promise<any>;
    updaterInstall?: () => Promise<void>;
  };
}


