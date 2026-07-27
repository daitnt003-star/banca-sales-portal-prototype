// Quick Advisory — protection gap (§A) + multi-need recommendation (§B).
// Chạy: node scripts/test-advisory-recommendation.js
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
B.current = function () { return 'RM-01'; };         // RM-01 bán được health/motor/pa

let pass = 0, fail = 0;
function ok(n, c, e) { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (e ? '  → ' + e : '')); } }
function grp(t) { console.log('\n' + t); }

/* ============ §A — PROTECTION GAP ============ */
grp('A1. Config versioned + không hard-code trong hàm tính');
ok('PROTECTION_GAP_CONFIG có version', /^GAP-/.test((B.PROTECTION_GAP_CONFIG || {}).version), (B.PROTECTION_GAP_CONFIG || {}).version);
const gapSrc = B.protectionGap.toString();
ok('hàm protectionGap KHÔNG chứa 80000000', gapSrc.indexOf('80000000') < 0);
ok('hàm protectionGap KHÔNG chứa 20000000', gapSrc.indexOf('20000000') < 0);

grp('A2. Health đọc input: BHYT');
const base = { primaryNeed: 'HEALTH', budgetBand: '500K_1M', dynAnswers: { hospital: 'Công', bhyt: 'Có', insured_before: 'Chưa' } };
const withBhyt = B.protectionGap(base);
const noBhyt = B.protectionGap(Object.assign({}, base, { dynAnswers: { hospital: 'Công', bhyt: 'Không', insured_before: 'Chưa' } }));
const bhytRow = g => (g.breakdown.find(b => /BHYT/.test(b.label)) || {}).amount;
ok('có BHYT → contribution > 0', bhytRow(withBhyt) > 0, bhytRow(withBhyt));
ok('KHÔNG có BHYT → contribution = 0', bhytRow(noBhyt) === 0, bhytRow(noBhyt));
ok('không BHYT làm gap lớn hơn', noBhyt.gap > withBhyt.gap, noBhyt.gap + ' vs ' + withBhyt.gap);

grp('A3. Hospital preference thay đổi chi phí điều trị');
const cong = B.protectionGap(Object.assign({}, base, { dynAnswers: { hospital: 'Công', bhyt: 'Có', insured_before: 'Chưa' } }));
const quocte = B.protectionGap(Object.assign({}, base, { dynAnswers: { hospital: 'Quốc tế', bhyt: 'Có', insured_before: 'Chưa' } }));
const treat = g => g.breakdown[0].amount;
ok('Quốc tế > Công (estimated treatment)', treat(quocte) > treat(cong), treat(quocte) + ' vs ' + treat(cong));

grp('A4. Existing coverage / reserve giảm gap; gap không âm');
const noExist = B.protectionGap(Object.assign({}, base, { dynAnswers: { hospital: 'Công', bhyt: 'Có', insured_before: 'Chưa' } }));
const fullExist = B.protectionGap(Object.assign({}, base, { dynAnswers: { hospital: 'Công', bhyt: 'Có', insured_before: 'Có (đầy đủ)' } }));
ok('bảo hiểm hiện có làm gap nhỏ hơn', fullExist.gap < noExist.gap, fullExist.gap + ' vs ' + noExist.gap);
ok('gap không âm dù bảo hiểm rất lớn', fullExist.gap >= 0, fullExist.gap);
ok('gapPct trong [0,100]', fullExist.gapPct >= 0 && fullExist.gapPct <= 100, fullExist.gapPct);

grp('A5. Thiếu input → kịch bản minh họa + assumptions');
const noInput = B.protectionGap({ primaryNeed: 'HEALTH', budgetBand: null, dynAnswers: {} });
ok('thiếu input → personalized=false', noInput.personalized === false);
ok('thiếu input → nhãn "Kịch bản minh họa"', /minh họa/i.test(noInput.scenarioLabel), noInput.scenarioLabel);
ok('đủ input → personalized=true', withBhyt.personalized === true);
ok('luôn có danh sách assumptions', Array.isArray(noInput.assumptions) && noInput.assumptions.length > 0, (noInput.assumptions || []).length);
ok('có disclaimer minh họa', /minh họa/i.test(noInput.disclaimer));

grp('A6. Các loại gap khác cũng đọc config');
['INCOME', 'MOTOR', 'FAMILY_HEALTH', 'LOAN'].forEach(function (need) {
  const g = B.protectionGap({ primaryNeed: need, budgetBand: '1M_2M', dynAnswers: {} });
  ok(need + ' có gap >= 0 và breakdown', g.gap >= 0 && g.breakdown.length >= 2, g.gap);
});
ok('financialGapByNeed (compat) vẫn trả rows+gap+pct', (function () { const g = B.financialGapByNeed(base); return Array.isArray(g.rows) && typeof g.gap === 'number' && typeof g.pct === 'number'; })());

/* ============ §B — MULTI-NEED RECOMMENDATION ============ */
grp('B1. Config trọng số & điểm số đúng mặc định');
const rc = B.RECOMMENDATION_CONFIG;
ok('weights primary=5', rc.weights.primary === 5);
ok('weights HIGH=3 MEDIUM=2 LOW=1', rc.weights.HIGH === 3 && rc.weights.MEDIUM === 2 && rc.weights.LOW === 1);
ok('related concern bonus=1', rc.weights.relatedConcernBonus === 1);
ok('score needCoverage .6 / budget .2 / elig .1 / simplicity .1',
  rc.score.needCoverage === 0.6 && rc.score.budgetFit === 0.2 && rc.score.eligibility === 0.1 && rc.score.simplicity === 0.1);

grp('B2. Một nhu cầu — không regression');
const one = B.recommendPlans({ primaryNeed: 'HEALTH', needProfile: [{ needId: 'HEALTH', weight: 'HIGH' }], budgetBand: '500K_1M' });
ok('1 nhu cầu → đúng 1 phương án', one.plans.length === 1, one.plans.length);
ok('phương án có sản phẩm chính', !!one.plans[0].primaryOffer);
ok('primaryOffer là product thật', (B.products || []).some(p => p.id === one.plans[0].primaryOffer.productRef));

grp('B3. Hai nhu cầu — một sản phẩm hoặc bundle tối đa 2');
const two = B.recommendPlans({ primaryNeed: 'HEALTH', needProfile: [{ needId: 'HEALTH', weight: 'HIGH' }, { needId: 'MOTOR', weight: 'MEDIUM' }], budgetBand: '1M_2M' });
ok('2 nhu cầu → có phương án', two.plans.length >= 1, two.plans.length);
ok('không plan nào > 2 sản phẩm', two.plans.every(p => p.offers.length <= 2), JSON.stringify(two.plans.map(p => p.offers.length)));

grp('B4. >=3 nhu cầu → BUDGET_FIT + FULLER_COVERAGE');
const three = B.recommendPlans({
  primaryNeed: 'HEALTH',
  needProfile: [{ needId: 'HEALTH', weight: 'HIGH' }, { needId: 'MOTOR', weight: 'HIGH' }, { needId: 'ACCIDENT', weight: 'MEDIUM' }],
  budgetBand: '1M_2M', concerns: ['TREATMENT_COST']
});
const ids = three.plans.map(p => p.id);
ok('có BUDGET_FIT', ids.indexOf('BUDGET_FIT') >= 0, ids.join(','));
ok('có FULLER_COVERAGE', ids.indexOf('FULLER_COVERAGE') >= 0, ids.join(','));
const bfit = three.plans.find(p => p.id === 'BUDGET_FIT');
const full = three.plans.find(p => p.id === 'FULLER_COVERAGE');
ok('FULLER phủ >= BUDGET nhu cầu', full.coveredNeeds.length >= bfit.coveredNeeds.length, full.coveredNeeds.length + ' vs ' + bfit.coveredNeeds.length);
ok('mỗi plan có coveredNeeds/remainingGaps/total/why', three.plans.every(p =>
  Array.isArray(p.coveredNeeds) && Array.isArray(p.remainingGaps) && typeof p.totalMonthly === 'number' && !!p.why));
ok('FULLER bundle không quá maxBundle', full.offers.length <= rc.maxBundle, full.offers.length);
ok('không tự chọn sản phẩm (không có field selected trong plan)', three.plans.every(p => p.selected === undefined));

grp('B5. Loại sản phẩm không đủ eligibility TRƯỚC scoring');
B.current = function () { return 'TS-01'; };          // TS-01 KHÔNG bán được health
const ts = B.recommendPlans({ primaryNeed: 'HEALTH', needProfile: [{ needId: 'HEALTH', weight: 'HIGH' }], budgetBand: '1M_2M' });
ok('TS-01 (health cấm) → không có phương án health', ts.plans.every(p => !p.primaryOffer || p.primaryOffer.productRef !== 'health'), JSON.stringify(ts.plans.map(p => p.primaryOffer && p.primaryOffer.productRef)));
B.current = function () { return 'RM-01'; };

grp('B6. advMonthlyVnd chuẩn hóa K/triệu');
ok("'~550K/tháng' = 550000", B.advMonthlyVnd('~550K/tháng') === 550000, B.advMonthlyVnd('~550K/tháng'));
ok("'~1.5 triệu/tháng' = 1500000", B.advMonthlyVnd('~1.5 triệu/tháng') === 1500000, B.advMonthlyVnd('~1.5 triệu/tháng'));
ok("'~1 triệu/tháng' = 1000000", B.advMonthlyVnd('~1 triệu/tháng') === 1000000, B.advMonthlyVnd('~1 triệu/tháng'));

grp('B7. Không có phương án eligible → rỗng, không fallback sản phẩm cấm');
const home = B.recommendPlans({ primaryNeed: 'HOME', needProfile: [{ needId: 'HOME', weight: 'HIGH' }], budgetBand: '1M_2M' });
ok('HOME (chưa có sản phẩm) → plans rỗng', home.plans.length === 0, home.plans.length);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
