'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'app-manifest.json'), 'utf8'));
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const file = path.join(dir, entry);
    if (fs.statSync(file).isDirectory()) walk(file);
    else files.push(file);
  }
}

walk(root);
const html = files.filter(file => file.endsWith('.html')).map(file => path.relative(root, file));
console.log('FILES', files.length);
console.log('HTML_FILES');
console.log(html.join('\n'));

const required = new Set(['index.html', 'dev/state-gallery.html']);
for (const mod of manifest.modules || []) required.add(mod.route);

let ok = true;
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) {
    console.error('MISSING_HTML', relative);
    ok = false;
  }
}

for (const removed of manifest.removedModules || []) {
  const removedDir = path.join(root, 'modules', removed);
  if (fs.existsSync(removedDir)) {
    console.error('REMOVED_MODULE_DIRECTORY_PRESENT', path.relative(root, removedDir));
    ok = false;
  }
}

console.log(ok ? 'VALID_MODULES' : 'INVALID_MODULES');
process.exit(ok ? 0 : 1);
