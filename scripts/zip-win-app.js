const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const candidate1 = path.join(root, 'dist', 'win-unpacked');
const candidate2 = path.join(root, 'dist', 'win-packager');
let sourceDir = null;

if (fs.existsSync(candidate1)) sourceDir = candidate1;
else if (fs.existsSync(candidate2)) sourceDir = candidate2;
else sourceDir = candidate1; // default, will error later if missing
const outZip = path.join(root, 'dist', 'ComandaFlow-win32-x64.zip');
const sevenZip = path.join(root, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

if (!fs.existsSync(sourceDir)) {
  console.error('Diretório de app não encontrado:', sourceDir);
  process.exit(1);
}

if (!fs.existsSync(sevenZip)) {
  console.error('7-Zip não encontrado em:', sevenZip);
  process.exit(1);
}

if (fs.existsSync(outZip)) {
  fs.unlinkSync(outZip);
}

console.log('Compactando', sourceDir, 'para', outZip);
const result = spawnSync(sevenZip, ['a', '-tzip', outZip, '*'], {
  cwd: sourceDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('Falha ao criar o zip.');
  process.exit(result.status);
}

console.log('Arquivo definitivo criado em:', outZip);
