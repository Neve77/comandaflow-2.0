const fs = require('fs');
const os = require('os');
const path = require('path');
const { app, BrowserWindow } = require('electron');

// Force a writable userData folder for logging and Chromium storage
const userDataPath = path.join(app.getPath('appData'), 'ComandaFlow');
const cachePath = path.join(userDataPath, 'Cache');

// Apply command line switches BEFORE require('electron') code may try to access them
process.env.ELECTRON_DISABLE_GPU = '1';
process.env.ELECTRON_OZONE_PLATFORM_HINT = 'auto';

try {
  fs.mkdirSync(userDataPath, { recursive: true });
  console.error(`[STARTUP] Created userData dir: ${userDataPath}`);
} catch (err) {
  console.error(`[STARTUP] ERROR creating userData dir: ${err.message}`);
}

try {
  fs.mkdirSync(cachePath, { recursive: true });
  console.error(`[STARTUP] Created cache dir: ${cachePath}`);
} catch (err) {
  console.error(`[STARTUP] ERROR creating cache dir: ${err.message}`);
}

app.setPath('userData', userDataPath);
app.commandLine.appendSwitch('cache-dir', cachePath);
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

app.setAppUserModelId('com.comandaflow');

console.error(`[STARTUP] userData: ${userDataPath}`);
console.error(`[STARTUP] cachePath: ${cachePath}`);
console.error(`[STARTUP] resourcesPath: ${process.resourcesPath}`);
console.error(`[STARTUP] cwd: ${process.cwd()}`);

// Log with console before anything else
console.error(`[STARTUP] App starting... pid=${process.pid}`);
console.error(`[STARTUP] userData: ${userDataPath}`);
console.error(`[STARTUP] cachePath: ${cachePath}`);
console.error(`[STARTUP] GPU disabled via env`);

app.disableHardwareAcceleration();

// persistent log file in userData so we capture logs when started by double-click
const logFilePath = path.join(userDataPath, 'comandaflow.log');
let logStream = null;
try {
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  console.error(`[STARTUP] Log stream created at ${logFilePath}`);
} catch (e) {
  console.error(`[STARTUP] ERROR creating log stream: ${e.message}`);
  logStream = null;
}

function writeLog(prefix, msg) {
  const line = `[${new Date().toISOString()}] ${prefix} ${msg}\n`;
  try { if (logStream) logStream.write(line); } catch (e) {}
  try { process.stdout.write(line); } catch (e) {}
}

function cleanupLegacyCacheDirectories() {
  const cleanupFolders = ['GPUCache', 'Code Cache', 'Service Worker', 'Cache'];
  const basePath = app.getPath('userData');
  for (const folder of cleanupFolders) {
    const candidate = path.join(basePath, folder);
    try {
      if (fs.existsSync(candidate)) {
        fs.rmSync(candidate, { recursive: true, force: true });
        writeLog('[cleanup]', `Removed legacy folder: ${candidate}`);
      }
    } catch (err) {
      writeLog('[cleanup][err]', `Failed to remove ${candidate}: ${err.message}`);
    }
  }
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
    // Dev paths
    path.join(__dirname, 'frontend', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    // electron-builder paths (files under resources/app/)
    path.join(process.resourcesPath || __dirname, 'app', 'frontend', 'dist', 'index.html'),
    // electron-packager paths (files directly under resources/)
    path.join(process.resourcesPath || __dirname, 'frontend', 'dist', 'index.html'),
    // Fallback paths
    path.join(appPath, 'frontend', 'dist', 'index.html'),
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
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    writeLog('[main]', 'Main window finished loading');
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    writeLog('[renderer]', `[console:${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('crashed', () => {
    writeLog('[renderer][err]', 'Renderer process crashed');
  });

  mainWindow.webContents.on('unresponsive', () => {
    writeLog('[renderer][warn]', 'Renderer unresponsive');
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
  const appBasePath = __dirname;
  
  // When packaged with electron-builder, files are under resources/app/
  // When packaged with electron-packager, files are at resources/
  // In dev, files are in __dirname
  let serverPath;
  let backendNodeModules;
  
  if (app.isPackaged) {
    // electron-builder: app files under resources/app/, node_modules at resources/app/backend/
    const builderServerPath = path.join(process.resourcesPath, 'app', 'backend', 'src', 'server.js');
    if (fs.existsSync(builderServerPath)) {
      serverPath = builderServerPath;
      backendNodeModules = path.join(process.resourcesPath, 'app', 'backend', 'node_modules');
    } else {
      // electron-packager: both under resources/
      serverPath = path.join(process.resourcesPath, 'backend', 'src', 'server.js');
      backendNodeModules = path.join(process.resourcesPath, 'backend', 'node_modules');
    }
  } else {
    // Development mode
    serverPath = path.join(appBasePath, 'backend', 'src', 'server.js');
    backendNodeModules = path.join(appBasePath, 'backend', 'node_modules');
  }

  console.error(`[BACKEND] app.isPackaged=${app.isPackaged}`);
  console.error(`[BACKEND] Using server path: ${serverPath}`);
  console.error(`[BACKEND] Using node_modules path: ${backendNodeModules}`);
  console.error(`[BACKEND] Server exists: ${fs.existsSync(serverPath)}`);
  console.error(`[BACKEND] node_modules exists: ${fs.existsSync(backendNodeModules)}`);

  if (!fs.existsSync(serverPath)) {
    console.error('[BACKEND] ERROR: server.js not found!');
    writeLog('[backend][err]', `Arquivo do backend não encontrado: ${serverPath}`);
    if (mainWindow) {
      loadErrorPage('O backend não foi encontrado no pacote. Verifique a instalação ou o build do aplicativo.');
    }
    return;
  }

  try {
    if (fs.existsSync(backendNodeModules)) {
      // Prepend to both require.main.paths and Module.globalPaths
      const Module = require('module');
      if (!require.main.paths.includes(backendNodeModules)) {
        require.main.paths.unshift(backendNodeModules);
      }
      if (!Module.globalPaths.includes(backendNodeModules)) {
        Module.globalPaths.unshift(backendNodeModules);
      }
      console.error(`[BACKEND] Added node_modules to module search paths`);
    } else {
      console.error(`[BACKEND] WARNING: backend node_modules not found at ${backendNodeModules}`);
    }

    process.env.PORT = backendPort;
    console.error('[BACKEND] Loading server.js...');
    require(serverPath);
    console.error('[BACKEND] Server loaded successfully!');
    writeLog('[backend]', 'Backend iniciado no mesmo processo Electron.');
  } catch (error) {
    console.error(`[BACKEND] ERROR: ${error.message}`);
    console.error(error.stack);
    writeLog('[backend][err]', `Erro ao iniciar backend: ${error}`);
    if (mainWindow) {
      loadErrorPage('Falha ao iniciar o backend.');
    }
  }
}

console.error('[STARTUP] Adding app event listeners...');

app.whenReady().then(() => {
  console.error('[STARTUP] App is ready!');
  cleanupLegacyCacheDirectories();
  startBackend();
  console.error('[STARTUP] Backend startup complete, creating window...');
  createWindow();
  console.error('[STARTUP] Window created');
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
