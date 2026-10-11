'use strict';

const fs = require('fs');
const path = require('path');

const soapPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'sonos-discovery',
  'lib',
  'helpers',
  'soap.js'
);

if (!fs.existsSync(soapPath)) {
  console.warn(`[sonos-discovery patch] ${soapPath} not found; skipping`);
  process.exit(0);
}

const original = fs.readFileSync(soapPath, 'utf8');
const patched = original
  .replace(/new Buffer\(0\)/g, 'Buffer.alloc(0)')
  .replace(/new Buffer\(soapBody, ['"]utf8['"]\)/g, "Buffer.from(soapBody, 'utf8')");

if (patched === original) {
  console.log('[sonos-discovery patch] Buffer calls already fixed; no changes needed');
  process.exit(0);
}

fs.writeFileSync(soapPath, patched, 'utf8');
console.log('[sonos-discovery patch] replaced deprecated Buffer constructors in soap.js');
