const packager = require('electron-packager');
const path = require('path');

console.log('cwd', process.cwd());
console.log('electron module path', require.resolve('electron'));

(async () => {
  try {
    console.log('starting packager');
    const paths = await packager({
      dir: path.resolve(__dirname, '..'),
      out: path.resolve(__dirname, '..', 'dist', 'win-packager'),
      overwrite: true,
      platform: 'win32',
      arch: 'x64',
      icon: path.resolve(__dirname, '..', 'build', 'icon.ico'),
      asar: false,
      prune: true,
      name: 'ComandaFlow',
      appBundleId: 'com.comandaflow',
      appVersion: '1.0.0',
      executableName: 'ComandaFlow',
      quiet: false,
    });
    console.log('done packager', paths);
  } catch (err) {
    console.error('packager error', err);
    process.exit(1);
  }
})();
