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

  if (relative.startsWith('node_modules')) {
    return true;
  }

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
  await makeIcon();
  const rootPkg = require(path.join(rootDir, 'package.json'));

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

  console.log('App empacotado em:', appPaths);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});