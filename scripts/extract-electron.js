const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const root = path.resolve(__dirname, '..');
const electronDist = path.join(root, 'node_modules', 'electron', 'dist');
const zipPath = path.join(process.env.USERPROFILE || process.env.HOME, 'AppData', 'Local', 'electron', 'Cache');

function findZip(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile() && file.name.endsWith('electron-v26.2.0-win32-x64.zip')) {
      return path.join(dir, file.name);
    }
    if (file.isDirectory()) {
      const found = findZip(path.join(dir, file.name));
      if (found) return found;
    }
  }
  return null;
}

(async function () {
  const cacheRoot = path.join(process.env.USERPROFILE || process.env.HOME, 'AppData', 'Local', 'electron', 'Cache');
  const zip = findZip(cacheRoot);
  if (!zip) {
    console.error('Zip not found in electron cache', cacheRoot);
    process.exit(1);
  }
  if (fs.existsSync(electronDist)) {
    fs.rmSync(electronDist, { recursive: true, force: true });
  }
  fs.mkdirSync(electronDist, { recursive: true });
  console.log('extracting', zip, 'to', electronDist);
  await extract(zip, { dir: electronDist });
  console.log('done');
})();
