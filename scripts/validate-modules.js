const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(d) {
  for (const x of fs.readdirSync(d)) {
    const p = path.join(d, x);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
}
walk(root);
const html = files.filter(f => f.endsWith('.html')).map(f => path.relative(root, f));
console.log('FILES', files.length);
console.log('HTML_FILES');
console.log(html.join('\n'));
const required = ['index.html','modules/auth/index.html','modules/seller-workspace/index.html','modules/seller-profile/index.html','modules/seller-readiness/index.html','modules/product-access/index.html','dev/state-gallery.html'];
let ok = true;
for (const r of required) {
  if (!fs.existsSync(path.join(root, r))) {
    console.error('MISSING_HTML', r);
    ok = false;
  }
}
console.log(ok ? 'VALID_MODULES' : 'INVALID_MODULES');
process.exit(ok ? 0 : 1);
