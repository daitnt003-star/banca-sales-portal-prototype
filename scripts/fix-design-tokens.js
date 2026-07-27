#!/usr/bin/env node
/**
 * fix-design-tokens.js
 *
 * Nắn các giá trị visual lệch thang về bậc gần nhất trên thang trong tokens.css.
 * MẶC ĐỊNH LÀ DRY-RUN — không ghi file trừ khi có --apply.
 *
 * Chỉ xử lý loại lỗi có phép nắn AN TOÀN và xác định:
 *   FRACTIONAL_FONT_SIZE · OFF_SCALE_FONT_SIZE · OFF_SCALE_SPACING · OFF_SCALE_RADIUS
 *
 * KHÔNG tự sửa (cần người quyết định ngữ nghĩa):
 *   HARDCODED_COLOR  — chọn token màu nào là quyết định thiết kế
 *   RAW_SHADOW       — chọn cấp độ nâng 1/2/3 là quyết định thiết kế
 *   RAW_ZINDEX       — chọn tầng sticky/dropdown/drawer/modal/toast là quyết định kiến trúc
 *
 * Dùng:
 *   node scripts/fix-design-tokens.js                    # xem sẽ đổi gì
 *   node scripts/fix-design-tokens.js --apply            # ghi thật (tự tạo .bak)
 *   node scripts/fix-design-tokens.js --max-delta 1      # chỉ nắn khi lệch ≤1px
 *   node scripts/fix-design-tokens.js --only modules/policies
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_FILE = path.join(ROOT, 'shared/styles/tokens.css');
const SCAN_ROOTS = ['modules', 'shared', 'dev'];
const SCAN_ROOT_FILES = ['index.html', 'showcase.html', 'showcase-template.html'];

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const MAX_DELTA = argv.includes('--max-delta')
  ? parseFloat(argv[argv.indexOf('--max-delta') + 1]) : Infinity;
const ONLY = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const rootBlock = (fs.readFileSync(TOKENS_FILE, 'utf8').match(/:root\s*\{([\s\S]*?)\n\s*\}/) || [, ''])[1];
function pxScale(prefix) {
  const out = [];
  const re = new RegExp(`--${prefix}[a-z0-9-]*\\s*:\\s*(-?[0-9.]+)px\\s*;`, 'g');
  let m;
  while ((m = re.exec(rootBlock))) out.push(parseFloat(m[1]));
  return [...new Set(out)].sort((a, b) => a - b);
}
const SPACING = [0, ...pxScale('space')];
const TEXT = pxScale('text');
const RADIUS = [0, ...pxScale('radius')];

if (!TEXT.length || SPACING.length < 2) {
  console.error('Chưa có thang token trong tokens.css. Chạy GP1 trước.');
  process.exit(2);
}

function snap(scale, v) {
  return scale.reduce((best, n) => (Math.abs(n - v) < Math.abs(best - v) ? n : best), scale[0]);
}

const SPACING_PROPS = /^(padding|margin|gap|row-gap|column-gap|inset)(-(top|right|bottom|left|inline|block|start|end))?$/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'build', 'dist', '.git'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(css|js|html)$/.test(ent.name)) out.push(p);
  }
  return out;
}
const files = [];
SCAN_ROOTS.forEach(r => walk(path.join(ROOT, r), files));
SCAN_ROOT_FILES.forEach(f => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) files.push(p);
});

const changes = [];
let filesTouched = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  if (ONLY && !rel.startsWith(ONLY)) continue;

  const original = fs.readFileSync(abs, 'utf8');
  const isTokens = abs === TOKENS_FILE;
  let fileChanged = false;

  const updated = original.replace(
    /([a-z-]+)(\s*:\s*)([^;{}'"`\n]+)/g,
    (full, prop, sep, value) => {
      const p = prop.toLowerCase();
      // không đụng vào chính dòng khai báo token
      if (isTokens && /^--/.test(prop)) return full;
      if (value.includes('var(')) return full;

      let scale = null;
      if (p === 'font-size') scale = TEXT;
      else if (SPACING_PROPS.test(p)) scale = SPACING;
      else if (p === 'border-radius') scale = RADIUS;
      if (!scale) return full;

      const newValue = value.replace(/(-?[0-9]*\.?[0-9]+)px/g, (tok, num) => {
        const v = parseFloat(num);
        // 999px pill: giữ nguyên nếu nằm trên thang
        if (scale.includes(v)) return tok;
        const to = snap(scale, v);
        if (Math.abs(to - v) > MAX_DELTA) return tok;
        if (to === v) return tok;
        changes.push({ file: rel, prop: p, from: `${num}px`, to: `${to}px`, delta: +(to - v).toFixed(2) });
        fileChanged = true;
        return `${to}px`;
      });
      return prop + sep + newValue;
    }
  );

  if (fileChanged) {
    filesTouched++;
    if (APPLY) {
      fs.writeFileSync(abs + '.bak', original, 'utf8');
      fs.writeFileSync(abs, updated, 'utf8');
    }
  }
}

/* ---------------- báo cáo ---------------- */
const byProp = {};
changes.forEach(c => { (byProp[c.prop] = byProp[c.prop] || []).push(c); });
const byDelta = {};
changes.forEach(c => { const k = Math.abs(c.delta); byDelta[k] = (byDelta[k] || 0) + 1; });
const byPair = {};
changes.forEach(c => { const k = `${c.from} → ${c.to}`; byPair[k] = (byPair[k] || 0) + 1; });

console.log(APPLY ? 'FIX DESIGN TOKENS — ĐÃ GHI' : 'FIX DESIGN TOKENS — DRY RUN (chưa ghi gì)');
console.log(`Thang: spacing ${SPACING.join('/')} · chữ ${TEXT.join('/')} · radius ${RADIUS.join('/')}`);
console.log(`${changes.length} thay đổi trên ${filesTouched} file`);
console.log('');

console.log('THEO THUỘC TÍNH');
Object.entries(byProp).sort((a, b) => b[1].length - a[1].length)
  .forEach(([p, l]) => console.log(`  ${String(l.length).padStart(5)}  ${p}`));
console.log('');

console.log('THEO ĐỘ LỆCH (px) — lệch càng nhỏ, rủi ro thị giác càng thấp');
Object.entries(byDelta).sort((a, b) => Number(a[0]) - Number(b[0]))
  .forEach(([d, n]) => console.log(`  ${String(n).padStart(5)}  lệch ${d}px`));
console.log('');

console.log('PHÉP NẮN PHỔ BIẾN (top 15)');
Object.entries(byPair).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([k, n]) => console.log(`  ${String(n).padStart(5)}  ${k}`));
console.log('');

if (!APPLY) {
  console.log('Chưa ghi file nào. Chạy lại với --apply để áp dụng (mỗi file sẽ có bản .bak).');
  console.log('Muốn an toàn hơn: --max-delta 1  (chỉ nắn khi lệch ≤1px)');
} else {
  console.log('Đã ghi. Khôi phục: tìm file .bak và đổi tên lại.');
  console.log('Kiểm tra ngay: node scripts/validate-design-tokens.js');
}
