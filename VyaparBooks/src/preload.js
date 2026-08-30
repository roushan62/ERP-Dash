'use strict';

/**
 * Preload script - secure bridge between renderer and main process.
 * The renderer never gets direct Node.js access. Only the safe API below
 * is exposed as window.vyapar.
 */
const { contextBridge, ipcRenderer } = require('electron');

function invoke(module, action, payload) {
  return ipcRenderer.invoke('vyapar:invoke', module, action, payload || {}).then((res) => {
    if (!res) throw new Error('No response from main process.');
    if (!res.ok) throw new Error(res.error || 'Operation failed.');
    return res.result;
  });
}

contextBridge.exposeInMainWorld('vyapar', {
  invoke,
  version: '1.0.0',
  platform: process.platform,
  exportPdf: (payload) => ipcRenderer.invoke('vyapar:export-pdf', payload || {}),
  exportExcel: (payload) => ipcRenderer.invoke('vyapar:export-excel', payload || {}),
  saveFile: (opts) => ipcRenderer.invoke('vyapar:save-file', opts || {}),
  openFile: (opts) => ipcRenderer.invoke('vyapar:open-file', opts || {}),
  backup: () => ipcRenderer.invoke('vyapar:backup'),
  restore: () => ipcRenderer.invoke('vyapar:restore'),
  getUserDataDir: () => ipcRenderer.invoke('vyapar:get-user-data'),
  onMenu: (cb) => ipcRenderer.on('app:menu', (_event, message) => cb(message)),
});
