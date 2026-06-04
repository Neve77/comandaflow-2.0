const { downloadArtifact } = require('@electron/get');
const path = require('path');
console.log('starting');
downloadArtifact({
  version: '26.2.0',
  artifactName: 'electron',
  platform: 'win32',
  arch: 'x64',
  checksums: require('../node_modules/electron/checksums.json'),
}).then((p) => {
  console.log('downloaded', p);
}).catch((err) => {
  console.error('ERR', err);
  process.exit(1);
});
