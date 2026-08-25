// Tìm playwright ở nhiều nơi: cài trong repo, cài toàn máy, hoặc bản npx đã tải sẵn.
// Không ghi cứng đường dẫn một máy cụ thể.
const { chromium } = (function () {
  const fs = require('fs'), path = require('path'), os = require('os');
  const tries = ['playwright', 'playwright-core'];
  const npxRoot = path.join(os.homedir(), '.npm', '_npx');
  if (fs.existsSync(npxRoot)) {
    for (const d of fs.readdirSync(npxRoot)) {
      const c = path.join(npxRoot, d, 'node_modules', 'playwright');
      if (fs.existsSync(c)) tries.push(c);
    }
  }
  if (process.env.PLAYWRIGHT_PATH) tries.unshift(process.env.PLAYWRIGHT_PATH);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  console.error('Không tìm thấy playwright. Cài bằng: npm i -D playwright && npx playwright install chromium');
  console.error('Hoặc trỏ thẳng: PLAYWRIGHT_PATH=/duong/dan/toi/playwright node uat-browser/01-smoke.js');
  process.exit(2);
})();
const BASE = process.env.BASE || 'http://localhost:8899';
const results = [];
let cur = null;

function grp(t){ cur = t; console.log('\n' + t); }
function ok(name, cond, extra){
  results.push({ grp:cur, name, pass:!!cond, extra: cond?'':(extra||'') });
  console.log((cond?'  ✓ ':'  ✗ ')+name+(cond?'':('   → '+(extra||''))));
}
function info(k,v){ console.log('     '+k+': '+v); }

async function newPage(browser){
  const ctx = await browser.newContext({ viewport:{width:1440,height:900} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if(m.type()==='error') errs.push('console.error: ' + m.text().slice(0,200)); });
  page.__errs = errs;
  return page;
}
async function go(page, url){
  const r = await page.goto(BASE+url, { waitUntil:'networkidle', timeout:20000 });
  await page.waitForTimeout(250);
  return r;
}
// Bấm theo CHỮ hiển thị — đúng cách người dùng thao tác.
async function clickText(page, text, opts){
  opts = opts || {};
  const loc = page.locator(opts.sel || 'button, a, summary', { hasText: text }).first();
  if(!(await loc.count())) return false;
  if(await loc.isDisabled().catch(()=>false)) return 'disabled';
  await loc.click({ timeout: 5000 });
  await page.waitForLoadState('networkidle').catch(()=>{});
  await page.waitForTimeout(250);
  return true;
}
async function visible(page, text){
  return await page.locator(`text=${text}`).first().isVisible().catch(()=>false);
}
async function bodyText(page){ return (await page.locator('body').innerText().catch(()=>'')) || ''; }

function summary(){
  const f = results.filter(r=>!r.pass);
  console.log('\n' + '═'.repeat(72));
  console.log(f.length ? ('✗ ' + f.length + '/' + results.length + ' KHÔNG ĐẠT:\n' +
    f.map(r=>'   - ['+r.grp+'] '+r.name+(r.extra?('  → '+r.extra):'')).join('\n'))
    : ('✓ TẤT CẢ ĐẠT (' + results.length + ')'));
  return f.length;
}
module.exports = { chromium, BASE, grp, ok, info, newPage, go, clickText, visible, bodyText, summary, results };
