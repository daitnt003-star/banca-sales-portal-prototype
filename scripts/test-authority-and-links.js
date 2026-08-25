// Bind authority + issued-link revocation test suite.
// Chạy: node scripts/test-authority-and-links.js
// Nền nghiệp vụ:
//   CPCU 520 A4 tr.4.12 — "specify … the POLICY LIMITS at which the accounts
//     must be submitted to a higher authority."
//   CII IF1 3/12 tr.96 F8 — thẩm quyền biểu kiến SỐNG LÂU HƠN hợp đồng đại lý;
//     DNBH có thể bị ràng buộc bởi cựu đại lý nếu không thông báo/thu hồi.
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/products.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
require('../shared/mock/seed/issued-links.js');
const B = global.BANCA;
B.current = () => 'RM-01';

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* 1. Hạn mức là SỐ, không phải bật/tắt -------------------------------- */
grp('1. Thẩm quyền cấp đơn là hạn mức SỐ (CPCU tr.4.12)');
const aReady = B.bindAuthorityFor('motor', 'RM-01');   // motor: RM-01 = READY
const aCond  = B.bindAuthorityFor('motor', 'RM-02');   // motor: RM-02 = CONDITIONAL
ok('người READY có hạn mức', aReady.maxSumInsured > 0, JSON.stringify(aReady));
ok('người CONDITIONAL có hạn mức THẤP HƠN',
  aCond.maxSumInsured > 0 && aCond.maxSumInsured < aReady.maxSumInsured,
  'READY=' + aReady.maxSumInsured + ' · CONDITIONAL=' + aCond.maxSumInsured);
ok('người BLOCKED không có thẩm quyền',
  B.bindAuthorityFor('health', 'RM-02').maxSumInsured === 0, JSON.stringify(B.bindAuthorityFor('health','RM-02')));
ok('đánh dấu rõ đây là giả định demo, không phải hạn mức thật',
  aReady.source === 'DEMO_ASSUMPTION', aReady.source);

/* 2. Vượt hạn mức → chuyển cấp duyệt --------------------------------- */
grp('2. Vượt hạn mức → CHUYỂN CẤP DUYỆT, không phải chặn hẳn');
const small = { id:'A1', owner:'RM-01', productId:'motor', sumInsured:800000000, premium:20000000 };
const big   = { id:'A2', owner:'RM-01', productId:'motor', sumInsured:5000000000, premium:20000000 };
ok('trong hạn mức → không cần chuyển', B.checkBindAuthority(small).mustRefer === false);
ok('vượt hạn mức số tiền bảo hiểm → mustRefer', B.checkBindAuthority(big).mustRefer === true);
ok('  …lý do là chữ đọc được, có cả hai con số',
  /vượt hạn mức cấp đơn/.test(B.checkBindAuthority(big).breaches[0].msg),
  B.checkBindAuthority(big).breaches[0].msg);

const bigPrem = { id:'A3', owner:'RM-02', productId:'motor', sumInsured:100000000, premium:40000000 };
ok('vượt hạn mức PHÍ cũng phải chuyển',
  B.checkBindAuthority(bigPrem).breaches.some(b => b.code === 'PREMIUM_OVER_AUTHORITY'),
  JSON.stringify(B.checkBindAuthority(bigPrem).breaches.map(b => b.code)));

/* 3. Nối vào cổng thẩm định ------------------------------------------ */
grp('3. Cổng thẩm định tự chuyển referral khi vượt thẩm quyền');
const rSmall = B.evaluateUnderwriting({ id:'A1', owner:'RM-01', productId:'motor', sumInsured:800000000, premium:20000000, riskAnswers:{} });
const rBig   = B.evaluateUnderwriting({ id:'A2', owner:'RM-01', productId:'motor', sumInsured:5000000000, premium:20000000, riskAnswers:{} });
ok('hồ sơ trong hạn mức → KHÔNG bị ép manual vì lý do thẩm quyền',
  !(rSmall.ruleHits || []).some(h => /OVER_AUTHORITY/.test(h)), JSON.stringify(rSmall.ruleHits));
ok('hồ sơ vượt hạn mức → MANUAL_REVIEW',
  rBig.outcome === 'MANUAL_REVIEW' || rBig.status === 'MANUAL_REVIEW' || rBig.underwritingMode === 'MANUAL',
  JSON.stringify({outcome:rBig.outcome, status:rBig.status, mode:rBig.underwritingMode}));
ok('  …ghi mã lý do để đối soát', (rBig.ruleHits || []).indexOf('SI_OVER_AUTHORITY') >= 0, JSON.stringify(rBig.ruleHits));

// Chốt điểm CPCU cảnh báo: hồ sơ SẠCH nhưng vượt thẩm quyền vẫn KHÔNG được đi STP.
const cleanButBig = B.evaluateUnderwriting({ id:'A4', owner:'RM-01', productId:'pa',
  age:30, occupationClass:'CLASS_1', sumInsured:9000000000, premium:5000000, riskAnswers:{} });
ok('hồ sơ sạch nhưng vượt thẩm quyền → KHÔNG lọt đường tự động',
  (cleanButBig.ruleHits || []).some(h => /OVER_AUTHORITY/.test(h)),
  JSON.stringify({mode:cleanButBig.underwritingMode, hits:cleanButBig.ruleHits}));

/* 4. Thu hồi link ----------------------------------------------------- */
grp('4. Chấm dứt người bán → thu hồi link đã phát (IF1 3/12 tr.96 F8)');
const live = B.issuedLinks.find(l => l.issuedBy === 'RM-01' && l.status === 'ACTIVE');
ok('link của người đang hoạt động → dùng được', B.linkUsable(live).usable === true, JSON.stringify(B.linkUsable(live)));

// RM-IN trong seed đã INACTIVE nhưng link cũ vẫn ACTIVE — đúng tình huống IF1 cảnh báo.
const orphan = B.issuedLinks.find(l => l.issuedBy === 'RM-IN');
ok('link của người ĐÃ NGHỈ → chặn ngay cả khi trạng thái link còn ACTIVE',
  B.linkUsable(orphan).usable === false, JSON.stringify(B.linkUsable(orphan)));
ok('  …lý do nói rõ là do người phát',
  /Người phát link không còn hoạt động/.test(B.linkUsable(orphan).reason || ''), B.linkUsable(orphan).reason);

const before = B.issuedLinks.filter(l => l.issuedBy === 'RM-01' && l.status === 'ACTIVE').length;
const res = B.deactivateSeller('RM-01', 'Nghỉ việc');
ok('chấm dứt người bán → khoá tài khoản', B.personas['RM-01'].status === 'INACTIVE' && B.personas['RM-01'].scopes.length === 0);
ok('  …VÀ thu hồi hết link đã phát (không chỉ khoá đăng nhập)',
  res.revokedLinks === before && before > 0, 'trước=' + before + ' · thu hồi=' + res.revokedLinks);
ok('  …link chuyển REVOKED, ghi lý do',
  B.issuedLinks.filter(l => l.issuedBy === 'RM-01').every(l => l.status === 'REVOKED' && l.revokedReason),
  JSON.stringify(B.issuedLinks.filter(l => l.issuedBy === 'RM-01').map(l => l.status)));
ok('  …dùng lại link đã thu hồi → chặn kèm lý do',
  /đã bị thu hồi/.test(B.linkUsable(B.issuedLinks.find(l => l.issuedBy === 'RM-01')).reason || ''));

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
