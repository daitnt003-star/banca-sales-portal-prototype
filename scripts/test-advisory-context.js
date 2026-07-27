// Quick Advice — banking context + recommendation cấp package (§6.2 / §6.3).
// Chạy: node scripts/test-advisory-context.js
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { getItem: function () { return null; }, setItem: function () { } };

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/products.js');
require('../shared/mock/seed/customers.js');
require('../shared/mock/seed/applications.js');
require('../shared/mock/seed/sales-entry.js');      // readinessFor
require('../shared/mock/seed/advice-sessions.js');
const B = global.BANCA;
B.current = function () { return 'RM-01'; };

let pass = 0, fail = 0;
function ok(n, c, e) { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (e ? '  → ' + e : '')); } }
function grp(t) { console.log('\n' + t); }

/* 1. §6.2 — đủ 7 banking context ------------------------------------ */
grp('1. Banking context (§6.2)');
const want = ['Vay mua ô tô', 'Vay mua nhà', 'Vay phục vụ sản xuất kinh doanh',
  'Bảo vệ sức khỏe cá nhân', 'Bảo vệ gia đình', 'Bảo vệ nhân viên doanh nghiệp', 'Nhu cầu khác'];
const got = B.BANKING_CONTEXTS.map(c => c.label);
ok('đủ 7 ngữ cảnh', B.BANKING_CONTEXTS.length === 7, got.join(' | '));
want.forEach(w => ok('có "' + w + '"', got.indexOf(w) >= 0));

grp('2. Context điều khiển sản phẩm/gói đề xuất');
[['LOAN_AUTO', 'motor'], ['LOAN_HOME', 'pa'], ['PROTECT_HEALTH', 'health'],
 ['PROTECT_FAMILY', 'health'], ['PROTECT_EMPLOYEE', 'health'], ['LOAN_BUSINESS', 'health']]
  .forEach(function (p) {
    const c = B.bankingContextById(p[0]);
    const offers = B.adviceOffersFor(c.primaryNeed);
    ok(p[0] + ' → sản phẩm ' + p[1], offers[0].productRef === p[1],
      offers[0].productRef);
  });
ok('OTHER không ép nhu cầu (primaryNeed=null)', B.bankingContextById('OTHER').primaryNeed === null);

grp('3. Context có nội dung giải thích + cross-sell');
B.BANKING_CONTEXTS.forEach(function (c) {
  ok(c.id + ' có explain', !!c.explain && c.explain.length > 20);
});
ok('ngữ cảnh vay có cross-sell', B.bankingContextById('LOAN_AUTO').crossSell.length > 0);

grp('4. Lọc theo sản phẩm seller ĐƯỢC QUYỀN bán (§6.2)');
const needsRM01 = B.contextNeedsFor('PROTECT_FAMILY', 'RM-01');
ok('RM-01 (health READY) có nhu cầu gợi ý', needsRM01.length > 0, JSON.stringify(needsRM01));
// TS-01 không được bán health → nhu cầu health bị loại khỏi gợi ý
const needsTS = B.contextNeedsFor('PROTECT_FAMILY', 'TS-01');
ok('TS-01 (health không khả dụng) bị lọc bớt', needsTS.length < needsRM01.length,
  'RM-01=' + JSON.stringify(needsRM01) + ' TS-01=' + JSON.stringify(needsTS));

/* 5. §6.3 — recommendation cấp package ------------------------------ */
grp('5. Recommendation đủ field (§6.3)');
const all = Object.keys(B.ADVICE_OFFERS).reduce((a, k) => a.concat(B.ADVICE_OFFERS[k]), []);
[['productName', 'Sản phẩm'], ['packageName', 'Package'], ['premiumBand', 'Phí ước tính'],
 ['fit', 'Mức độ phù hợp'], ['meets', 'Nhu cầu được đáp ứng'], ['why', 'Lý do đề xuất'],
 ['verify', 'Điều kiện cần xác minh'], ['issueTime', 'Thời gian phát hành dự kiến']]
  .forEach(function (f) {
    ok('mọi offer có "' + f[0] + '" (' + f[1] + ')',
      all.every(o => o[f[0]] !== undefined && o[f[0]] !== null && o[f[0]] !== ''),
      all.filter(o => !o[f[0]]).map(o => o.packageName).join(','));
  });
ok('gói có thẩm định → issueTime khác STP',
  all.filter(o => o.packageRef === 'PREMIUM').every(o => /thẩm định/.test(o.issueTime)));

grp('6. Bộ khoá lưu khi khách chọn phương án (§6.3)');
// mô phỏng đúng logic advSelectOffer
const offers = B.adviceOffersFor('MOTOR');
const o = offers.find(x => x.packageRef === 'STANDARD');
const st = {};
st.selectedProductId = o.productRef;
st.selectedPackageId = o.packageRef;
st.recommendationVersion = B.RECOMMENDATION_VERSION;
st.estimatedPremium = o.premiumBand;
st.adviceOutcome = 'OFFER_SELECTED';
['selectedProductId', 'selectedPackageId', 'recommendationVersion', 'estimatedPremium', 'adviceOutcome']
  .forEach(k => ok('lưu "' + k + '"', !!st[k], String(st[k])));
ok('recommendationVersion có định dạng REC-*', /^REC-/.test(B.RECOMMENDATION_VERSION), B.RECOMMENDATION_VERSION);
ok('selectedProductId trỏ đúng product thật',
  (B.products || []).some(p => p.id === st.selectedProductId), st.selectedProductId);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
