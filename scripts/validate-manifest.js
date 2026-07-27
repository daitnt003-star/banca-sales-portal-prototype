'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'app-manifest.json'), 'utf8'));
let ok = true;

const ids = new Set();
for (const mod of manifest.modules || []) {
  if (!mod.id || !mod.route) {
    console.error('Invalid module entry', mod);
    ok = false;
    continue;
  }
  if (ids.has(mod.id)) {
    console.error('Duplicate module id', mod.id);
    ok = false;
  }
  ids.add(mod.id);
  const route = path.join(root, mod.route);
  if (!fs.existsSync(route)) {
    console.error('Missing route', mod.id, mod.route);
    ok = false;
  }
  if (mod.route.startsWith('modules/')) {
    const metadata = path.join(root, 'modules', mod.id, 'module.json');
    if (!fs.existsSync(metadata)) {
      console.error('Missing module metadata', mod.id, path.relative(root, metadata));
      ok = false;
    }
  }
}

for (const removed of manifest.removedModules || []) {
  if (ids.has(removed)) {
    console.error('Removed module is still active', removed);
    ok = false;
  }
}

if (!ids.has(manifest.defaultModule)) {
  console.error('Default module is not active', manifest.defaultModule);
  ok = false;
}

console.log(ok ? 'VALID_MANIFEST' : 'INVALID_MANIFEST');
process.exit(ok ? 0 : 1);
