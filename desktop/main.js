// Telar escritorio · ventana que carga la app web.
// En dev apunta al server local (npm run dev); en producción, a telar.app.
const { app, BrowserWindow, shell, Menu, nativeTheme } = require('electron');
const path = require('node:path');

const URL_APP = process.env.TELAR_URL || 'https://telar.app/app/';
const esMac = process.platform === 'darwin';

let ventana = null;

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1B1915' : '#F5F2EB',
    titleBarStyle: esMac ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'precarga.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  ventana.once('ready-to-show', () => ventana.show());
  ventana.loadURL(URL_APP);

  // Si no hay red o el server no está, mostramos algo nuestro en vez del error de Chrome.
  ventana.webContents.on('did-fail-load', (_e, code, desc, url) => {
    if (code === -3) return; // navegación abortada
    ventana.loadFile(path.join(__dirname, 'cargando.html'), {
      query: { error: `${desc} (${code})`, url: url || URL_APP }
    });
  });

  // Los links externos van al navegador del sistema, no a una ventana de Electron.
  const esNuestro = (url) => {
    try { return new URL(url).origin === new URL(URL_APP).origin; } catch { return false; }
  };
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (!esNuestro(url)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });
  ventana.webContents.on('will-navigate', (ev, url) => {
    if (!esNuestro(url)) { ev.preventDefault(); shell.openExternal(url); }
  });

  ventana.on('closed', () => { ventana = null; });
}

function menu() {
  const template = [
    ...(esMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    {
      label: 'Ver',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => ventana?.loadURL(URL_APP) },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Una sola instancia: si la abrís de nuevo, enfoca la que ya está.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); }
  });

  app.whenReady().then(() => {
    menu();
    crearVentana();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) crearVentana(); });
  });

  app.on('window-all-closed', () => { if (!esMac) app.quit(); });
}
