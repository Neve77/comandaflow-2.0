const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

const backendPort = process.env.PORT || '3002';
const startUrl = process.env.ELECTRON_START_URL;
const isDev = Boolean(startUrl);
let backendProcess;

const iconPath = path.join(__dirname, 'build', 'icon.png');

function createWindow() {
  const browserOptions = {
    width: 1280,
    height: 820,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };

  if (fs.existsSync(iconPath)) {
    browserOptions.icon = iconPath;
  }

  const mainWindow = new BrowserWindow(browserOptions);

  if (isDev) {
    mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }
}

function startBackend() {
  const serverPath = path.join(__dirname, 'backend', 'src', 'server.js');
  const nodeExecutable = isDev ? 'node' : process.execPath;
  const env = {
    ...process.env,
    PORT: backendPort,
    NODE_ENV: 'production',
  };

  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  backendProcess = spawn(nodeExecutable, [serverPath], {
    env,
    stdio: 'inherit',
  });

  backendProcess.on('error', (error) => {
    console.error('Erro ao iniciar backend:', error);
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend finalizado com código ${code} e sinal ${signal}`);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
