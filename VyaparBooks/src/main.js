'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const services = require('./database/services');
const pdfGenerator = require('./export/pdf-generator');
const excelGenerator = require('./export/excel-generator');

let mainWindow = null;

function getUserDataDir() {
  // Keep a stable, user-owned path under the OS Application Data folder.
  return app.getPath('userData');
}

function createWindow() {
  process.env.VYAPAR_USER_DATA = getUserDataDir();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'VyaparBooks',
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function sendMenu(action, data) {
  if (mainWindow) mainWindow.webContents.send('app:menu', { action, data });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Voucher (Ctrl+N)', accelerator: 'CmdOrCtrl+N', click: () => sendMenu('new') },
        { label: 'Save (Ctrl+S)', accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
        { label: 'Print (Ctrl+P)', accelerator: 'CmdOrCtrl+P', click: () => sendMenu('print') },
        { type: 'separator' },
        { label: 'Search (Ctrl+F)', accelerator: 'CmdOrCtrl+F', click: () => sendMenu('search') },
        { role: 'close', label: 'Close' },
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
    {
      label: 'Help',
      submenu: [
        { label: 'About VyaparBooks', click: () => dialog.showMessageBox(mainWindow, { message: 'VyaparBooks 1.0.0', detail: 'Free, open-source, offline accounting for Indian MSMEs.\nMIT License.', type: 'info' }) },
        { label: 'Open Data Folder', click: () => shell.openPath(getUserDataDir()) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const IPC = {
  'vyapar:invoke': async (event, module, action, payload) => {
    try {
      const result = services.invoke(module, action, payload);
      return { ok: true, result };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  },
  'vyapar:save-file': async (event, opts) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: opts.title || 'Save',
      defaultPath: opts.defaultName || 'document',
      filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return result.canceled ? null : result.filePath;
  },
  'vyapar:open-file': async (event, opts) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: opts.title || 'Open',
      filters: opts.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  },
  'vyapar:export-pdf': async (event, opts) => {
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Export PDF',
      defaultPath: opts.defaultName || 'VyaparBooks-Report.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (savePath.canceled || !savePath.filePath) return { canceled: true };
    pdfGenerator.generate(opts.payload || {}, savePath.filePath);
    return { canceled: false, path: savePath.filePath };
  },
  'vyapar:export-excel': async (event, opts) => {
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Excel',
      defaultPath: opts.defaultName || 'VyaparBooks-Report.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (savePath.canceled || !savePath.filePath) return { canceled: true };
    excelGenerator.generate(opts.payload || {}, savePath.filePath);
    return { canceled: false, path: savePath.filePath };
  },
  'vyapar:backup': async (event) => {
    const savePath = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup VyaparBooks data',
      defaultPath: 'vyaparbooks-backup-' + new Date().toISOString().slice(0, 10) + '.backup',
      filters: [{ name: 'VyaparBooks backup', extensions: ['backup'] }],
    });
    if (savePath.canceled || !savePath.filePath) return { canceled: true };
    services.backupTo(savePath.filePath);
    return { canceled: false, path: savePath.filePath };
  },
  'vyapar:restore': async () => {
    const open = await dialog.showOpenDialog(mainWindow, {
      title: 'Restore VyaparBooks backup',
      filters: [{ name: 'VyaparBooks backup', extensions: ['backup'] }],
      properties: ['openFile'],
    });
    if (open.canceled || !open.filePaths[0]) return { canceled: true };
    services.restoreFrom(open.filePaths[0]);
    return { canceled: false, path: open.filePaths[0] };
  },
  'vyapar:get-user-data': async () => getUserDataDir(),
};

app.whenReady().then(() => {
  Object.entries(IPC).forEach(([channel, handler]) => ipcMain.handle(channel, handler));
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
