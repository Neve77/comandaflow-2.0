const fs = require('fs');
const os = require('os');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

// Force a writable userData folder before app ready
const forcedUserData = path.join(os.homedir(), 'AppData', 'Roaming', 'ComandaFlow');
fs.mkdirSync(forcedUserData, { recursive: true });
fs.mkdirSync(path.join(forcedUserData, 'Cache'), { recursive: true });
app.setPath('userData', forcedUserData);
app.setAppUserModelId('com.comandaflow');
app.commandLine.appendSwitch('user-data-dir', forcedUserData);
app.commandLine.appendSwitch('disk-cache-dir', path.join(forcedUserData, 'Cache'));
app.commandLine.appendSwitch('disable-features', 'ServiceWorker');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
app.disableHardwareAcceleration();

// persistent log file in userData so we capture logs when started by double-click
const logFilePath = path.join(forcedUserData, 'comandaflow.log');
let logStream = null;
try {
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
} catch (e) {
  logStream = null;
}

function writeLog(prefix, msg) {
  const line = `[${new Date().toISOString()}] ${prefix} ${msg}\n`;
  try { if (logStream) logStream.write(line); } catch (e) {}
  try { process.stdout.write(line); } catch (e) {}
}

function loadErrorPage(message) {
  if (!mainWindow) return;
  const safeHtml = `data:text/html;charset=utf-8,${encodeURIComponent(`
    <html><head><meta charset="UTF-8"><title>Erro ComandaFlow</title></head>
    <body style="background:#111;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
      <h1 style="margin:0 0 16px;font-size:28px;">Erro ao carregar o aplicativo</h1>
      <p style="max-width:500px;line-height:1.6;font-size:16px;">${message}</p>
      <p style="margin-top:24px;color:#999;font-size:14px;">Verifique se o backend e o frontend estão corretos e reinicie o aplicativo.</p>
    </body></html>
  `)}`;
  mainWindow.loadURL(safeHtml).catch(() => {});
}

function resolveIndexPath() {
  const appPath = app.isPackaged ? app.getAppPath() : __dirname;
  const candidatePaths = [
    path.join(__dirname, 'frontend', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(appPath, 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath || __dirname, 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath || __dirname, 'app', 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath || __dirname, 'app.asar', 'frontend', 'dist', 'index.html'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        writeLog('[main]', `Usando index.html em: ${p}`);
        return p;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

const backendPort = process.env.PORT || '3002';
const startUrl = process.env.ELECTRON_START_URL;
const isDev = Boolean(startUrl);
let backendProcess;

const iconPath = path.join(__dirname, 'build', 'icon.png');

// keep mainWindow reference to focus/restore when second instance launched
let mainWindow = null;

// Ensure single instance — if another instance is started, focus existing and exit
const gotLock = app.requestSingleInstanceLock && app.requestSingleInstanceLock();
if (!gotLock) {
  try { writeLog('[app]', 'Outra instância detectada — saindo.'); } catch (e) {}
  app.quit();
}

if (gotLock) {
  app.on('second-instance', (event, argv, workingDirectory) => {
    try { writeLog('[app]', 'Segunda instância solicitada — focando janela existente.'); } catch (e) {}
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const browserOptions = {
    width: 1280,
    height: 820,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };

  if (fs.existsSync(iconPath)) {
    browserOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(browserOptions);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    writeLog('[main]', 'Main window finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    writeLog('[main][err]', `Falha ao carregar URL: ${validatedURL} ${errorCode} ${errorDescription}`);
    loadErrorPage('O frontend não foi carregado corretamente. Isso pode ocorrer se o backend não estiver disponível ou se o build do frontend estiver ausente.');
  });

  if (isDev) {
    mainWindow.loadURL(startUrl).catch((err) => {
      writeLog('[main][err]', `Erro ao carregar DEV URL: ${err}`);
      loadErrorPage('Não foi possível carregar a URL de desenvolvimento do frontend.');
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexToLoad = resolveIndexPath();
    if (indexToLoad) {
      mainWindow.loadFile(indexToLoad).catch((err) => {
        writeLog('[main][err]', `Erro ao carregar arquivo index.html: ${err}`);
        loadErrorPage('Não foi possível carregar o build do frontend.');
      });
    } else {
      writeLog('[main][err]', 'index.html não encontrado em nenhum caminho candidato');
      loadErrorPage('O arquivo do frontend não foi encontrado no pacote.');
    }
  }
}

function startBackend() {
  const serverPath = path.join(__dirname, 'backend', 'src', 'server.js');
  if (!fs.existsSync(serverPath)) {
    writeLog('[backend][err]', `Arquivo do backend não encontrado: ${serverPath}`);
    if (mainWindow) {
      loadErrorPage('O backend não foi encontrado no pacote. Verifique a instalação ou o build do aplicativo.');
    }
    return;
  }

  const nodeExecutable = isDev ? 'node' : process.execPath;
  const env = {
    ...process.env,
    PORT: backendPort,
    NODE_ENV: 'production',
  };

  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  const spawnOptions = {
    env,
    windowsHide: true,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  };

  backendProcess = spawn(nodeExecutable, [serverPath], spawnOptions);

  if (backendProcess.stdout) {
    backendProcess.stdout.on('data', (chunk) => {
      writeLog('[backend]', chunk.toString());
    });
  }

  if (backendProcess.stderr) {
    backendProcess.stderr.on('data', (chunk) => {
      writeLog('[backend][err]', chunk.toString());
    });
  }

  backendProcess.on('error', (error) => {
    writeLog('[backend][err]', `Erro ao iniciar backend: ${error}`);
    if (mainWindow) {
      loadErrorPage('Falha ao iniciar o backend.');
    }
  });

  backendProcess.on('exit', (code, signal) => {
    writeLog('[backend]', `Backend finalizado com código ${code} e sinal ${signal}`);
    if (code !== 0 && mainWindow) {
      loadErrorPage('O backend foi finalizado inesperadamente.');
    }
  });
}

app.whenReady().then(() => {
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
