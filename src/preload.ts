// Preload script for TLDraw Electron App
import { contextBridge, ipcRenderer } from 'electron';

// Expose necessary APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any electron APIs that need to be accessed from the renderer
  // For example, file system access, dialog APIs, etc.
  appVersion: process.env.npm_package_version,
  onNewWindow: (callback) => ipcRenderer.on('cb-on-new-window', (_event, value) => callback(value)),
});

console.log('Preload script has been loaded');
