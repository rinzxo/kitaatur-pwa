const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');

const APP_URL = 'https://kitatur.rinzgroup.web.id/login';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 650,
    title: 'KitaAtur - Absensi & Keuangan Organisasi',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0087FF',
    autoHideMenuBar: true,
    show: false, // Show when ready to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      sandbox: true,
    },
  });

  // Remove default top menu for clean native app look
  Menu.setApplicationMenu(null);

  // Modern Chrome User-Agent to prevent Google OAuth 403 (disallowed_useragent)
  const defaultUA = mainWindow.webContents.userAgent;
  const chromeUA = defaultUA
    .replace(/Electron\/[0-9\.]+\s/i, '')
    .replace(/kitaatur-desktop\/[0-9\.]+\s/i, '');

  mainWindow.webContents.setUserAgent(chromeUA);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = chromeUA;
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // Handle external link clicks (open in default OS browser)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isInternal =
      url.includes('rinzgroup.web.id') ||
      url.includes('accounts.google.com') ||
      url.includes('supabase.co');

    if (!isInternal) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Show window once DOM is loaded to look snappy
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load production URL
  mainWindow.loadURL(APP_URL);

  // Fallback offline handler
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorCode !== -3) { // Skip aborted requests
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head>
            <title>KitaAtur - Tidak Ada Koneksi</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: %23f8fafc; color: %231e293b; text-align: center; padding: 20px; }
              .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); max-width: 420px; width: 100%; }
              h2 { font-size: 22px; font-weight: 800; margin: 0 0 10px; }
              p { font-size: 14px; color: %2364748b; margin: 0 0 24px; line-height: 1.5; }
              button { background: %230087FF; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 14px; transition: opacity 0.2s; }
              button:hover { opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Gagal Memuat Halaman</h2>
              <p>Periksa koneksi internet Anda lalu coba muat ulang kembali aplikasi.</p>
              <button onclick="window.location.href='${APP_URL}'">Coba Lagi</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

