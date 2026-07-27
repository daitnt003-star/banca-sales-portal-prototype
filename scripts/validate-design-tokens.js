#!/usr/bin/env node
/**
 * validate-design-tokens.js
 *
 * Cưỡng chế tầng design token. Thang hợp lệ được ĐỌC TỪ tokens.css,
 * không hardcode trong script — sửa thang ở một chỗ, validator theo ngay.
 *
 * Dùng:
 *   node scripts/validate-design-tokens.js            # chế độ báo cáo, exit 0
 *   node scripts/validate-design-tokens.js --strict   # fail build, exit 1
 *   node scripts/validate-design-tokens.js --top 15   # liệt kê file vi phạm nhiều nhất
 *   node scripts/validate-design-tokens.js --rule OFF_SCALE_SPACING   # lọc 1 loại lỗi
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_FILE = path.join(ROOT, 'shared/styles/tokens.css');
const SCAN_ROOTS = ['modules', 'shared', 'dev', 'docs'];
const SCAN_ROOT_FILES = ['index.html', 'showcase.html', 'showcase-template.html'];

const argv = process.argv.slice(2);
const STRICT = argv.includes('--strict');
const TOP = argv.includes('--top') ? parseInt(argv[argv.indexOf('--top') + 1], 10) || 10 : 10;
const ONLY_RULE = argv.includes('--rule') ? argv[argv.indexOf('--rule') + 1] : null;

/* ------------------------------------------------------------------ */
/* 1. Đọc thang hợp lệ từ tokens.css                                    */
/* ------------------------------------------------------------------ */
if (!fs.existsSync(TOKENS_FILE)) {
  console.error(`DESIGN TOKEN VALIDATION ERROR: không tìm thấy ${path.relative(ROOT, TOKENS_FILE)}`);
  process.exit(2);
}
const tokensRaw = fs.readFileSync(TOKENS_FILE, 'utf8');
const rootBlock = (tokensRaw.match(/:root\s*\{([\s\S]*?)\n\s*\}/) || [, ''])[1];

function tokenValues(prefix) {
  const out = new Set();
  const re = new RegExp(`--${prefix}[a-z0-9-]*\\s*:\\s*([^;]+);`, 'g');
  let m;
  while ((m = re.exec(rootBlock))) out.add(m[1].trim());
  return out;
}
function pxNumbers(prefix) {
  const out = new Set();
  for (const v of tokenValues(prefix)) {
    const m = v.match(/^(-?[0-9.]+)px$/);
    if (m) out.add(m[1]);
  }
  return out;
}

const SPACING_PX = new Set([...pxNumbers('space'), '0']);
const TEXT_PX = new Set(pxNumbers('text'));
const RADIUS_PX = new Set([...pxNumbers('radius'), '0']);
const BORDER_PX = new Set([...pxNumbers('border'), '0']);
const SHELL_PX = new Set([...pxNumbers('sb1'), ...pxNumbers('sb2'), ...pxNumbers('bp')]);
const Z_VALUES = new Set([...tokenValues('z-')].map(v => v.trim()));
const DURATION_VALUES = new Set([...tokenValues('duration')].map(v => v.trim()));

const PALETTE = new Set();
{
  const re = /#[0-9a-fA-F]{3,8}\b/g;
  let m;
  while ((m = re.exec(rootBlock))) PALETTE.add(m[0].toLowerCase());
}

if (!SPACING_PX.size || !TEXT_PX.size) {
  console.error('DESIGN TOKEN VALIDATION ERROR: tokens.css chưa khai báo thang --space-* / --text-*.');
  console.error('Chạy GP1 (bổ sung thang token) trước khi dùng validator này.');
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* 2. Duyệt file                                                        */
/* ------------------------------------------------------------------ */
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

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/**
 * Bỏ qua nội dung trong <code> và <pre>: đó là ví dụ trong tài liệu,
 * không phải style được áp dụng. Trang design-reference cố tình trưng
 * ví dụ SAI để dạy — đếm nó là vi phạm sẽ làm sai chỉ số.
 */
function stripDocExamples(src) {
  return src.replace(/<(code|pre)\b[\s\S]*?<\/\1>/gi, m => m.replace(/[^\n]/g, ' '));
}

/* ------------------------------------------------------------------ */
/* 3. Luật                                                              */
/* ------------------------------------------------------------------ */
const SEVERITY = {
  FRACTIONAL_FONT_SIZE: 'error',
  OFF_SCALE_FONT_SIZE: 'error',
  OFF_SCALE_SPACING: 'error',
  OFF_SCALE_RADIUS: 'error',
  RAW_SHADOW: 'error',
  RAW_ZINDEX: 'error',
  HARDCODED_COLOR: 'error',
  OFF_SCALE_BORDER: 'warn',
  OFF_SCALE_DURATION: 'warn',
  OFF_SCALE_DIMENSION: 'warn',
  BULKY_INLINE_STYLE: 'warn'
};

const SPACING_PROPS = /^(padding|margin|gap|row-gap|column-gap|inset)(-(top|right|bottom|left|inline|block|start|end))?$/;
const DIMENSION_PROPS = /^(width|height|max-width|min-width|max-height|min-height|flex-basis|top|left|right|bottom|translate)$/;

const issues = [];
function add(rule, file, line, detail, hint) {
  if (ONLY_RULE && rule !== ONLY_RULE) return;
  issues.push({ rule, severity: SEVERITY[rule] || 'warn', file, line, detail, hint });
}

function nearest(set, value) {
  const nums = [...set].map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  return nums.reduce((best, n) =>
    Math.abs(n - value) < Math.abs(best - value) ? n : best, nums[0]);
}

for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  const isTokensFile = abs === TOKENS_FILE;
  let src = stripComments(fs.readFileSync(abs, 'utf8'));
  if (/\.html$/.test(abs)) src = stripDocExamples(src);
  const lines = src.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const ln = idx + 1;

    // Bỏ qua chính khối :root của tokens.css — đó là nguồn định nghĩa
    if (isTokensFile && /^\s*--[a-z0-9-]+\s*:/.test(line)) return;

    /* --- màu hardcode --- */
    let m;
    const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
    while ((m = hexRe.exec(line))) {
      const hex = m[0].toLowerCase();
      if (isTokensFile) continue;
      if (/^#[0-9a-f]{6}$/.test(hex) === false && /^#[0-9a-f]{3}$/.test(hex) === false
        && /^#[0-9a-f]{8}$/.test(hex) === false) continue;
      add('HARDCODED_COLOR', rel, ln, hex,
        PALETTE.has(hex) ? 'Màu này đã có token — thay bằng var(--...)' : 'Màu ngoài palette — dùng token gần nhất hoặc bổ sung token mới có lý do');
    }

    /* --- z-index thô --- */
    const zRe = /z-index\s*:\s*([^;'"`)]+)/g;
    while ((m = zRe.exec(line))) {
      const v = m[1].trim();
      if (v.includes('var(')) continue;
      if (Z_VALUES.has(v) && isTokensFile) continue;
      if (/^(auto|inherit|initial|unset|0)$/.test(v)) continue;
      add('RAW_ZINDEX', rel, ln, `z-index:${v}`, 'Dùng var(--z-sticky|--z-dropdown|--z-drawer|--z-modal|--z-toast)');
    }

    /* --- shadow thô --- */
    const shRe = /box-shadow\s*:\s*([^;'"`]+)/g;
    while ((m = shRe.exec(line))) {
      const v = m[1].trim();
      if (v.includes('var(')) continue;
      if (/^(none|inherit|initial|unset)$/.test(v)) continue;
      if (isTokensFile) continue;
      add('RAW_SHADOW', rel, ln, `box-shadow:${v.slice(0, 48)}`, 'Dùng var(--shadow-1|--shadow-2|--shadow-3|--shadow-focus)');
    }

    /* --- các thuộc tính có giá trị px --- */
    const declRe = /([a-z-]+)\s*:\s*([^;{}'"`]+)/g;
    while ((m = declRe.exec(line))) {
      const prop = m[1].toLowerCase();
      const value = m[2];
      if (value.includes('var(')) continue;

      const pxRe = /(-?[0-9]*\.?[0-9]+)px/g;
      let p;
      while ((p = pxRe.exec(value))) {
        const num = p[1];
        const asNum = parseFloat(num);

        if (prop === 'font-size') {
          if (num.includes('.')) {
            add('FRACTIONAL_FONT_SIZE', rel, ln, `font-size:${num}px`,
              `Cỡ chữ lẻ nửa pixel. Chọn ${nearest(TEXT_PX, asNum)}px trên thang --text-*`);
          } else if (!TEXT_PX.has(num)) {
            add('OFF_SCALE_FONT_SIZE', rel, ln, `font-size:${num}px`,
              `Ngoài thang chữ. Gần nhất: ${nearest(TEXT_PX, asNum)}px`);
          }
          continue;
        }
        if (SPACING_PROPS.test(prop)) {
          if (!SPACING_PX.has(num)) {
            add('OFF_SCALE_SPACING', rel, ln, `${prop}:${num}px`,
              `Ngoài thang spacing. Gần nhất: ${nearest(SPACING_PX, asNum)}px`);
          }
          continue;
        }
        if (prop.startsWith('border-radius') || prop === 'border-radius') {
          if (!RADIUS_PX.has(num)) {
            add('OFF_SCALE_RADIUS', rel, ln, `${prop}:${num}px`,
              `Ngoài thang radius. Gần nhất: ${nearest(RADIUS_PX, asNum)}px`);
          }
          continue;
        }
        if (/^border(-(top|right|bottom|left))?(-width)?$/.test(prop)) {
          if (!BORDER_PX.has(num)) {
            add('OFF_SCALE_BORDER', rel, ln, `${prop}:${num}px`,
              'Chỉ dùng --border-thin (1px) hoặc --border-strong (2px)');
          }
          continue;
        }
        if (DIMENSION_PROPS.test(prop)) {
          if (!SPACING_PX.has(num) && !SHELL_PX.has(num) && asNum > 2) {
            add('OFF_SCALE_DIMENSION', rel, ln, `${prop}:${num}px`,
              'Kích thước tự do — cân nhắc dùng thang spacing, %, hoặc token shell');
          }
          continue;
        }
      }

      /* --- thời lượng chuyển động --- */
      if (/^(transition|animation)(-duration)?$/.test(prop)) {
        const dRe = /([0-9.]+m?s)/g;
        let d;
        while ((d = dRe.exec(value))) {
          if (!DURATION_VALUES.has(d[1])) {
            add('OFF_SCALE_DURATION', rel, ln, `${prop}:${d[1]}`,
              'Dùng var(--duration-fast|--duration-base|--duration-slow)');
          }
        }
      }
    }

    /* --- inline style cồng kềnh --- */
    const inlineRe = /style\s*=\s*(["'`])([^"'`]{60,})\1/g;
    while ((m = inlineRe.exec(line))) {
      add('BULKY_INLINE_STYLE', rel, ln, `${m[2].length} ký tự`,
        'Chuyển thành class trong components.css — inline style dài không review được');
    }
  });
}

/* ------------------------------------------------------------------ */
/* 4. Báo cáo                                                           */
/* ------------------------------------------------------------------ */
const errors = issues.filter(i => i.severity === 'error');
const warns = issues.filter(i => i.severity === 'warn');

const byRule = {};
issues.forEach(i => { (byRule[i.rule] = byRule[i.rule] || []).push(i); });
const byFile = {};
issues.forEach(i => { byFile[i.file] = (byFile[i.file] || 0) + 1; });

console.log('DESIGN TOKEN VALIDATION');
console.log(`Thang đọc từ shared/styles/tokens.css — spacing:${SPACING_PX.size} bậc · chữ:${TEXT_PX.size} bậc · radius:${RADIUS_PX.size} bậc · màu:${PALETTE.size} token`);
console.log(`Quét ${files.length} file · ${errors.length} lỗi · ${warns.length} cảnh báo`);
console.log('');

if (issues.length) {
  console.log('THEO LOẠI');
  Object.entries(byRule)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([rule, list]) => {
      const sev = SEVERITY[rule] === 'error' ? 'LỖI ' : 'CẢNH';
      console.log(`  ${sev} ${rule.padEnd(24)} ${String(list.length).padStart(5)}   vd: ${list[0].file}:${list[0].line} — ${list[0].detail}`);
    });
  console.log('');
  console.log(`FILE VI PHẠM NHIỀU NHẤT (top ${TOP})`);
  Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP)
    .forEach(([f, n]) => console.log(`  ${String(n).padStart(5)}  ${f}`));
  console.log('');
}

if (STRICT) {
  if (errors.length) {
    console.log(`DESIGN TOKEN VALIDATION FAIL: ${errors.length} lỗi`);
    errors.slice(0, 200).forEach(i => console.log(`DESIGN_TOKEN_VIOLATION ${JSON.stringify(i)}`));
    if (errors.length > 200) console.log(`... và ${errors.length - 200} lỗi nữa`);
    process.exit(1);
  }
  console.log('DESIGN TOKEN VALIDATION PASS');
  process.exit(0);
}

console.log('Chế độ báo cáo (exit 0). Thêm --strict để fail build.');
console.log('Xem chi tiết 1 loại: node scripts/validate-design-tokens.js --rule OFF_SCALE_SPACING');
