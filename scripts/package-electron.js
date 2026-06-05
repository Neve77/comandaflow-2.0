const fs = require('fs');
const path = require('path');
const packager = require('electron-packager');
const pngToIco = require('png-to-ico');

const rootDir = path.resolve(__dirname, '..');
const iconPng = path.join(rootDir, 'build', 'icon.png');
const iconIco = path.join(rootDir, 'build', 'icon.ico');
const outDir = path.join(rootDir, 'dist', 'win-packager');

async function makeIcon() {
  if (!fs.existsSync(iconPng)) {
    throw new Error('Arquivo de ícone não encontrado em build/icon.png');
  }

  if (!fs.existsSync(iconIco)) {
    const ico = await pngToIco(iconPng);
    fs.writeFileSync(iconIco, ico);
  }
}

const ignorePath = (filePath) => {
  const relative = filePath.replace(`${rootDir}${path.sep}`, '');

  if (relative.startsWith('frontend') && !relative.startsWith('frontend' + path.sep + 'dist')) {
    return true;
  }

  if (relative.startsWith('dist')) {
    return true;
  }

  if (relative.startsWith('build') && !relative.startsWith('build' + path.sep + 'icon.png') && !relative.startsWith('build' + path.sep + 'icon.ico')) {
    return true;
  }

  if (relative.startsWith('scripts') && !relative.startsWith('scripts' + path.sep + 'package-electron.js')) {
    return true;
  }

  if (relative.startsWith('.git') || relative.startsWith('.github')) {
    return true;
  }

  if (/^(docker-compose|DEPLOYMENT|README|TROUBLESHOOTING|START_HERE|FILES_LISTING|PRODUCTION_DELIVERABLES|QUICK_START_PRODUCTION|README_PRODUCTION|00_READ_ME_FIRST)\.*/.test(relative)) {
    return true;
  }

  return false;
};

async function main() {
  console.log('[PACKAGE] Iniciando processo de empacotamento...');
  console.log('[PACKAGE] Diretório raiz:', rootDir);
  console.log('[PACKAGE] Diretório de saída:', outDir);
  
  await makeIcon();
  console.log('[PACKAGE] Ícone processado com sucesso');
  
  const rootPkg = require(path.join(rootDir, 'package.json'));
  console.log('[PACKAGE] Versão do app:', rootPkg.version || '1.0.1');

  // Criar pasta de saída se não existir
  if (!fs.existsSync(outDir)) {
    console.log('[PACKAGE] Criando diretório de saída:', outDir);
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('[PACKAGE] Iniciando electron-packager...');
  
  try {
    const appPaths = await packager({
      dir: rootDir,
      out: outDir,
      overwrite: true,
      platform: 'win32',
      arch: 'x64',
      icon: iconIco,
      asar: false,
      prune: true,
      ignore: ignorePath,
      name: 'ComandaFlow',
      appBundleId: 'com.comandaflow',
      appVersion: rootPkg.version || '1.0.1',
      executableName: 'ComandaFlow',
      quiet: false,
    });

    console.log('[PACKAGE] ✓ App empacotado com sucesso');
    console.log('[PACKAGE] Caminhos:', appPaths);
  } catch (error) {
    console.error('[PACKAGE] ✗ Erro ao empacotar:', error.message);
    throw error;
  }
}

main().catch((err) => {
  console.error('[PACKAGE] ✗ ERRO:', err.message);
  console.error('[PACKAGE] Stack:', err.stack);
  process.exit(1);
});