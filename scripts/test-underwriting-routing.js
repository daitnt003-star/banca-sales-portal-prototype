// Underwriting routing test suite (Checkpoint 4).
// Chạy: node scripts/test-underwriting-routing.js
// Bao phủ: canonical routing contract · Motor STP/referral · Health HYBRID
// (clean→STP_PASS không queue · thiếu info→MORE_INFORMATION_REQUIRED · review rule→MANUAL_REVIEW
//  · hard-decline→DECLINED) · PA STP · APPROVED_WITH_LOADING gating.
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/status-mappings.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/case-state-resolver.js');
require('../shared/mock/seed/payment-method-config.js');
require('../shared/mock/seed/product-schemas.js');
const B = global.BANCA;
B.current = function () { return 'RM-01'; };
B.readinessFor = function () { return { ready: true, state: 'READY', caps: ['can_advise','can_quote','can_submit','can_bind','can_collect_payment'] }; };
B.vnd = B.vnd || function (n) { return String(n || 0); };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* ---- contract shape ---- */
grp('1. Canonical routing contract shape');
const sample = B.evaluateUnderwriting({ productId: 'motor', riskAnswers: {} });
['routingResult','underwritingMode','decision','ruleHits','publicReasons','internalReasonCodes',
 'requiredDocuments','conditions','exclusions','loading','ruleSetCode','ruleVersion','evaluatedAt']
  .forEach(f => ok('routing contract có trường ' + f, sample[f] !== undefined, JSON.stringify(sample[f])));
ok('routingResult ∈ enum', ['STP_PASS','MANUAL_REVIEW','MORE_INFORMATION_REQUIRED','DECLINED'].includes(sample.routingResult));
ok('underwritingMode ∈ {STP,MANUAL}', ['STP','MANUAL'].includes(sample.underwritingMode));
ok('ruleSetCode suy từ product def (MOTOR_UW)', sample.ruleSetCode === 'MOTOR_UW', sample.ruleSetCode);

/* ---- Motor ---- */
grp('2. Motor STP / referral');
const mClean = B.evaluateUnderwriting({ productId: 'motor', riskAnswers: { claimCount: 0 } });
ok('Motor sạch → STP_PASS', mClean.routingResult === 'STP_PASS', mClean.routingResult);
ok('Motor sạch → mode STP, decision APPROVED_STP', mClean.underwritingMode === 'STP' && mClean.decision === 'APPROVED_STP');
const mRef = B.evaluateUnderwriting({ productId: 'motor', riskAnswers: { claimCount: 2 } });
ok('Motor 2 claim → MANUAL_REVIEW', mRef.routingResult === 'MANUAL_REVIEW', mRef.routingResult);
ok('Motor referral → mode MANUAL', mRef.underwritingMode === 'MANUAL');
const mMod = B.evaluateUnderwriting({ productId: 'motor', riskAnswers: { modifiedVehicle: true } });
ok('Motor xe độ kết cấu → MANUAL_REVIEW + yêu cầu giám định', mMod.routingResult === 'MANUAL_REVIEW' && mMod.requiredDocuments.indexOf('SURVEY') >= 0);

/* ---- Health HYBRID (yêu cầu trực tiếp user) ---- */
grp('3. Health HYBRID decision table');
const hClean = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: { truthDeclaration: true } });
ok('Health ca sạch → STP_PASS', hClean.routingResult === 'STP_PASS', hClean.routingResult);
ok('Health ca sạch → APPROVED_STP + mode STP (không manual)', hClean.decision === 'APPROVED_STP' && hClean.underwritingMode === 'STP');

const hMissing = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: { preExistingCondition: true, truthDeclaration: true } });
ok('Health bệnh có sẵn chưa mô tả → MORE_INFORMATION_REQUIRED', hMissing.routingResult === 'MORE_INFORMATION_REQUIRED', hMissing.routingResult);
ok('Health missing → yêu cầu MEDICAL_RECORD', hMissing.requiredDocuments.indexOf('MEDICAL_RECORD') >= 0);

const hMissingDecl = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: {} });
ok('Health chưa xác nhận khai báo trung thực → MORE_INFORMATION_REQUIRED', hMissingDecl.routingResult === 'MORE_INFORMATION_REQUIRED');

const hReview = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: { preExistingCondition: true, preExistingDetail: 'Tiểu đường type 2', truthDeclaration: true } });
ok('Health bệnh có sẵn đã mô tả → MANUAL_REVIEW', hReview.routingResult === 'MANUAL_REVIEW', hReview.routingResult);
ok('Health review → mode MANUAL + confirm required', hReview.underwritingMode === 'MANUAL' && hReview.customerConfirmationRequired === true);

const hSmoker = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: { smoker: true, truthDeclaration: true } });
ok('Health hút thuốc → MANUAL_REVIEW', hSmoker.routingResult === 'MANUAL_REVIEW');

const hDecline = B.evaluateUnderwriting({ productId: 'health', age: 30, riskAnswers: { seriousIllness: true, truthDeclaration: true } });
ok('Health bệnh nghiêm trọng → DECLINED', hDecline.routingResult === 'DECLINED', hDecline.routingResult);
ok('Health decline → decision DECLINED', hDecline.decision === 'DECLINED');

/* ---- Health STP must NOT create manual queue metadata ---- */
grp('4. Health STP không tạo queue/officer/SLA');
ok('STP_PASS không kèm requiredDocuments', (hClean.requiredDocuments || []).length === 0);
ok('STP_PASS không kèm conditions', (hClean.conditions || []).length === 0);
ok('STP_PASS không yêu cầu customer confirmation', hClean.customerConfirmationRequired === false);

/* ---- PA STP ---- */
grp('5. PA STP');
const paClean = B.evaluateUnderwriting({ productId: 'pa', age: 30, occupationClass: 'CLASS_1', sumInsured: 300000000, riskAnswers: {} });
ok('PA nhóm 1 sạch → STP_PASS', paClean.routingResult === 'STP_PASS', paClean.routingResult);
const paRef = B.evaluateUnderwriting({ productId: 'pa', age: 30, occupationClass: 'CLASS_3', sumInsured: 300000000, riskAnswers: {} });
ok('PA nhóm 3 → MANUAL_REVIEW', paRef.routingResult === 'MANUAL_REVIEW', paRef.routingResult);

/* ---- APPROVED_WITH_LOADING first-class + gating ---- */
grp('6. APPROVED_WITH_LOADING first-class');
ok('enum có APPROVED_WITH_LOADING label', (B.UNDERWRITING_DECISION_ENUM.APPROVED_WITH_LOADING || {}).label === 'Chấp thuận có phụ phí');
ok('isApprovedWithTerms nhận LOADING/EXCLUSION/CONDITION',
  B.isApprovedWithTerms('APPROVED_WITH_LOADING') && B.isApprovedWithTerms('APPROVED_WITH_EXCLUSION') && B.isApprovedWithTerms('APPROVED_WITH_CONDITION'));
// caseStates giữ decision LOADING riêng biệt (không collapse về CONDITION).
const csLoad = B.caseStates({ productId: 'health', uw: { decision: 'APPROVED_WITH_LOADING', newPremium: 6000000 } });
ok('caseStates giữ APPROVED_WITH_LOADING riêng biệt', csLoad.underwritingDecision === 'APPROVED_WITH_LOADING', csLoad.underwritingDecision);
// LOADING chưa xác nhận → khoá thanh toán kèm lý do.
const loadUnconf = { id:'H-L', owner:'RM-01', productId:'health', submissionState:'SUBMITTED',
  underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_WITH_LOADING', paymentStatus:'METHOD_REQUIRED',
  premium:6000000, quote:{premium:6000000, quoteStatus:'VALID'} };
const gLoad = B.paymentEnableRule(loadUnconf);
ok('LOADING chưa xác nhận → payment bị khoá', gLoad.enabled === false);
ok('LOADING khoá kèm lý do xác nhận điều kiện/phụ phí', gLoad.reasons.some(r => /xác nhận/.test(r)), JSON.stringify(gLoad.reasons));
// LOADING đã xác nhận + version approved → mở.
const loadConf = Object.assign({}, loadUnconf, { confirm: { otp: 'VERIFIED', confirmedAt: '2026-07-27 10:00' },
  quoteVersions: [{ id:'QV-1', version:1, status:'APPROVED' }], activeQuoteVersionId:'QV-1', activeQuoteApproved:true });
const gLoadOk = B.paymentEnableRule(loadConf);
ok('LOADING đã xác nhận + version duyệt → payment mở', gLoadOk.enabled === true, JSON.stringify(gLoadOk.reasons));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
