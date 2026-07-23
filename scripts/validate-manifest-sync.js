const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const json = JSON.parse(fs.readFileSync(path.join(root, 'app-manifest.json'), 'utf8'));
const js = fs.readFileSync(path.join(root, 'shared/js/app-manifest.js'), 'utf8');
const m = js.match(/BANCA\.manifest = ([\s\S]*);\s*$/);
if (!m) { console.error('NO_GENERATED_MANIFEST_OBJECT'); process.exit(1); }
const generated = JSON.parse(m[1]);
const same = JSON.stringify(json) === JSON.stringify(generated);
console.log(same ? 'VALID_MANIFEST_SYNC' : 'INVALID_MANIFEST_SYNC');
process.exit(same ? 0 : 1);
