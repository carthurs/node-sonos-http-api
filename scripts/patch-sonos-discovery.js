'use strict';

// Resolve from this package: npm may nest or hoist the dependency.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const packagePath = require.resolve('sonos-discovery/package.json', {
  paths: [path.resolve(__dirname, '..')]
});
const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (metadata.version !== '1.7.3') {
  throw new Error('Expected pinned sonos-discovery 1.7.3, got ' + metadata.version);
}
const soapPath = path.join(path.dirname(packagePath), 'lib/helpers/soap.js');
const original = fs.readFileSync(soapPath, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const pristineHash = 'fc56123b8f95fd4504c8e075424fc416e338ed2c8ebd4213276b1207cbe03f6e';
const patchedHash = '8c9d153bed11e3e8cfd40c83fc0fcdb5328e298d1386e75c2cea2df06e61894e';
if (hash(original) === patchedHash) {
  console.log('[sonos-discovery] verified existing Buffer patch: ' + soapPath);
} else {
  if (hash(original) !== pristineHash) {
    throw new Error('Unexpected soap.js contents; refusing to patch ' + soapPath);
  }
  const patched = original
    .replace('new Buffer(0)', 'Buffer.alloc(0)')
    .replace("new Buffer(soapBody, 'utf8')", "Buffer.from(soapBody, 'utf8')");
  if (hash(patched) !== patchedHash) {
    throw new Error('Buffer patch verification failed');
  }
  fs.writeFileSync(soapPath, patched, 'utf8');
  console.log('[sonos-discovery] applied verified Buffer patch: ' + soapPath);
}
