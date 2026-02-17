const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

let serverProcess = null;
let mainWindow = null;
let lastServerOutput = '';

// Prevent multiple instances - only allow one app window
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function getAppDataPath() {
  const base = process.env.APPDATA || process.env.LOCALAPPDATA || 
    path.join(process.env.USERPROFILE || process.env.HOME || process.cwd(), 'AppData', 'Local');
  return path.join(base, 'wedding-horoscope');
}

function getDataPath() {
  const base = getAppDataPath();
  return path.join(base, 'data');
}

const LOADING_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#eee;}
  .box{text-align:center;padding:2rem;}
  .spinner{border:3px solid #333;border-top-color:#4ade80;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 1rem;}
  @keyframes spin{to{transform:rotate(360deg)}}
</style></head><body><div class="box"><div class="spinner"></div><p>Starting Wedding Horoscope Matcher...</p></div></body></html>`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow = win;

  // Show loading screen immediately so user sees something
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(LOADING_HTML));
  win.once('ready-to-show', () => win.show());

  // Open DevTools to see any console errors (helps debug blank screen)
  win.webContents.openDevTools({ mode: 'detach' });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, url) => {
    const out = lastServerOutput ? `<pre style="max-height:200px;overflow:auto;font-size:12px;">${String(lastServerOutput).replace(/</g, '&lt;')}</pre>` : '';
    const errHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:2rem;background:#1a1a2e;color:#eee;} code{background:#333;padding:0.2em;}</style></head><body><h2>Server failed to start</h2><p><strong>${errorCode}</strong>: ${String(errorDescription).replace(/</g, '&lt;')}</p><p>URL: ${String(url || '').replace(/</g, '&lt;')}</p>${out}</body></html>`;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errHtml));
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

function startNextServer() {
  const uploadsPath = path.join(getAppDataPath(), 'uploads');
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE_TYPE: 'sqlite',
    SQLITE_PATH: path.join(getDataPath(), 'horoscope.db'),
    UPLOADS_DIR: uploadsPath,
    PORT: String(PORT),
  };

  const nextDir = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
  const nextBin = path.join(nextDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  const args = ['start', '-p', PORT];

  // Use system Node (works reliably on Windows; Electron --run-as-node can fail in packaged app)
  const nodePath = 'node';
  const spawnArgs = [nextBin, ...args];

  let serverOutput = '';
  const capture = (data) => { serverOutput += String(data); };

  return new Promise((resolve, reject) => {
    serverProcess = spawn(nodePath, spawnArgs, {
      cwd: nextDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const tryResolve = () => {
      if (started) return;
      started = true;
      resolve(serverOutput);
    };

    serverProcess.stdout.on('data', (data) => {
      capture(data);
      const msg = String(data);
      if (msg.includes('Ready') || msg.includes('started') || msg.includes('localhost')) {
        waitForServer().then(tryResolve).catch(() => tryResolve());
      }
    });
    serverProcess.stderr.on('data', (data) => {
      capture(data);
      const msg = String(data);
      if (msg.includes('Ready') || msg.includes('started') || msg.includes('localhost')) {
        waitForServer().then(tryResolve).catch(() => tryResolve());
      }
    });
    serverProcess.on('error', (err) => {
      serverOutput += '\nSpawn error: ' + String(err);
      reject(err);
    });
    serverProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null && !started) {
        serverOutput += `\nServer exited: code=${code} signal=${signal}`;
      }
    });

    // Fallback: wait for server or 10 seconds
    setTimeout(() => tryResolve(), 10000);
  });
}

function waitForServer() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', () => {
        attempts++;
        if (attempts < maxAttempts) setTimeout(check, 400);
        else resolve();
      });
      req.setTimeout(600, () => {
        req.destroy();
        attempts++;
        if (attempts < maxAttempts) setTimeout(check, 400);
        else resolve();
      });
    };
    setTimeout(check, 800);
  });
}

app.whenReady().then(async () => {
  const win = createWindow();

  try {
    lastServerOutput = await startNextServer();
    win.loadURL(`http://127.0.0.1:${PORT}`);
  } catch (err) {
    const errHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:2rem;background:#1a1a2e;color:#eee;} code{background:#333;padding:0.2em;}</style></head><body><h2>Failed to start</h2><p>${String(err).replace(/</g, '&lt;')}</p><p>Try closing any other instance and run again.</p></body></html>`;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errHtml));
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});
