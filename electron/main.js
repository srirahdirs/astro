const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

let serverProcess = null;

function getAppDataPath() {
  const base = process.env.APPDATA || process.env.LOCALAPPDATA || 
    path.join(process.env.USERPROFILE || process.env.HOME || process.cwd(), 'AppData', 'Local');
  return path.join(base, 'wedding-horoscope');
}

function getDataPath() {
  const base = getAppDataPath();
  return path.join(base, 'data');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = `http://localhost:${PORT}`;
  win.loadURL(url);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

function startNextServer() {
  const uploadsPath = path.join(getAppDataPath(), 'uploads');
  const env = {
    ...process.env,
    DATABASE_TYPE: 'sqlite',
    SQLITE_PATH: path.join(getDataPath(), 'horoscope.db'),
    UPLOADS_DIR: uploadsPath,
    PORT: String(PORT),
  };

  const nextDir = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
  const nextBin = path.join(nextDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  const args = ['start', '-p', PORT];

  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [nextBin, ...args], {
      cwd: nextDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    serverProcess.stdout.on('data', (data) => {
      const msg = String(data);
      if (!started && (msg.includes('Ready') || msg.includes('started') || msg.includes('localhost'))) {
        started = true;
        resolve();
      }
    });
    serverProcess.stderr.on('data', (data) => {
      const msg = String(data);
      if (!started && (msg.includes('Ready') || msg.includes('started') || msg.includes('localhost'))) {
        started = true;
        resolve();
      }
    });
    serverProcess.on('error', reject);

    // Fallback: assume ready after 5 seconds
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve();
      }
    }, 5000);
  });
}

app.whenReady().then(async () => {
  await startNextServer();
  createWindow();

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
