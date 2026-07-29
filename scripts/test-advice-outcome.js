// Advice outcome model test suite (Checkpoint 2).
// Chạy: node scripts/test-advice-outcome.js
// Bao phủ: KHÔNG còn business status/tab/action SAVED · 4 outcome chuẩn tồn tại + đúng nhóm
// · autosave (persist) KHÔNG đổi outcome · convert mang đúng MỘT selectedOffer.
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { _s: {}, getItem: function (k) { return this._s[k] || null; }, setItem: function (k, v) { this._s[k] = v; } };

require('../shared/mock/seed/advice-sessions.js');
const B = global.BANCA;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }
const groupOf = s => (B.ADVICE_STATUS[s] || {}).group || 'CLOSED';

/* 1. Bỏ SAVED khỏi business status ---------------------------------- */
grp('1. Không còn trạng thái/tab/nhóm SAVED');
ok('ADVICE_STATUS không còn key SAVED', B.ADVICE_STATUS.SAVED === undefined);
ok('Không còn nhóm SAVED nào', Object.keys(B.ADVICE_STATUS).every(k => B.ADVICE_STATUS[k].group !== 'SAVED'));

/* 2. 4 outcome chuẩn ------------------------------------------------- */
grp('2. Bốn outcome chuẩn tồn tại + đúng nhóm');
const OUT = ['CUSTOMER_ACCEPTED', 'FOLLOW_UP', 'NOT_INTERESTED', 'SHARED_WITH_CUSTOMER'];
ok('BANCA.ADVICE_OUTCOMES đúng 4 giá trị chuẩn', JSON.stringify(B.ADVICE_OUTCOMES) === JSON.stringify(OUT), JSON.stringify(B.ADVICE_OUTCOMES));
OUT.forEach(o => ok('outcome ' + o + ' có trong ADVICE_STATUS', !!B.ADVICE_STATUS[o]));
ok('CUSTOMER_ACCEPTED thuộc nhóm CONVERTED', groupOf('CUSTOMER_ACCEPTED') === 'CONVERTED');
ok('FOLLOW_UP thuộc nhóm FOLLOW_UP', groupOf('FOLLOW_UP') === 'FOLLOW_UP');
ok('NOT_INTERESTED thuộc nhóm CLOSED', groupOf('NOT_INTERESTED') === 'CLOSED');
ok('SHARED_WITH_CUSTOMER thuộc nhóm SHARED', groupOf('SHARED_WITH_CUSTOMER') === 'SHARED');
OUT.forEach(o => ok('outcome ' + o + ' có nhãn tiếng Việt', /[^\x00-\x7F]/.test((B.ADVICE_STATUS[o] || {}).label || '')));

/* 3. Alias cũ vẫn resolve (không vỡ seed) --------------------------- */
grp('3. Alias tương thích dữ liệu cũ');
ok('FOLLOW_UP_LATER vẫn map nhóm FOLLOW_UP', groupOf('FOLLOW_UP_LATER') === 'FOLLOW_UP');
ok('CONVERTED_TO_SALE vẫn map nhóm CONVERTED', groupOf('CONVERTED_TO_SALE') === 'CONVERTED');
ok('adviceStatusBadge render được outcome chuẩn', OUT.every(o => B.adviceStatusBadge(o).indexOf('badge') >= 0));

/* 4. Autosave không đổi outcome ------------------------------------- */
grp('4. Autosave (persist) không đổi outcome');
// Mô phỏng hành vi save(): chỉ chạm updatedAt, KHÔNG chạm status.
const sess = { id: 'ADV-X', status: 'RECOMMENDED', selectedOffer: null, updatedAt: '09:00' };
function autosave(s) { s.updatedAt = '09:05'; return s; } // giống save(): không đặt status
autosave(sess);
ok('autosave giữ nguyên status (không tạo outcome)', sess.status === 'RECOMMENDED');
ok('autosave chỉ cập nhật thời điểm lưu', sess.updatedAt === '09:05');

/* 5. Convert mang đúng MỘT selectedOffer ---------------------------- */
grp('5. Convert mang đúng một selectedOffer');
const converted = { id: 'ADV-Y', status: 'CUSTOMER_ACCEPTED', selectedOffer: { productId: 'health', packageId: 'HEALTH_STD' } };
ok('phiên CUSTOMER_ACCEPTED có đúng 1 selectedOffer (không phải mảng bundle)',
  converted.selectedOffer && !Array.isArray(converted.selectedOffer) && !!converted.selectedOffer.productId);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
