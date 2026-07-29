// Three mandatory demo stories — end-to-end contract test (Checkpoint 6).
// Chạy: node scripts/test-demo-stories.js
// Story 1: Motor anonymous → STP → OTP → QR → issue → bank callback.
// Story 2: Health clean → APPROVED_STP (không manual queue) → OTP → payment link → issue.
// Story 3: Health rule-hit → Manual UW → condition → khách xác nhận → OTP → payment → issue.
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
B.readinessFor = function () { return { ready: true, caps: ['can_advise','can_quote','can_submit','can_bind','can_collect_payment'] }; };
B.vnd = B.vnd || function (n) { return String(n || 0); };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

// Dựng app đã duyệt + báo giá approved để test cổng thanh toán/phát hành.
function approvedApp(over) {
  const a = Object.assign({ id:'D', owner:'RM-01', productId:'motor', submissionState:'SUBMITTED',
    underwritingStatus:'DECIDED', paymentStatus:'METHOD_REQUIRED',
    premium:5000000, quote:{ quoteId:'Q-D', quoteVersion:1, quoteStatus:'VALID', premium:5000000 } }, over || {});
  B.quoteVersion.init(a, a.premium); B.quoteVersion.approve(a);
  return a;
}

/* ============ STORY 1 — Motor STP ============ */
grp('STORY 1 — Motor anonymous → STP → OTP → QR → issue → callback');
const s1uw = B.evaluateUnderwriting({ productId:'motor', riskAnswers:{ claimCount:0 } });
ok('Motor sạch → STP_PASS / APPROVED_STP', s1uw.routingResult === 'STP_PASS' && s1uw.decision === 'APPROVED_STP');
// STP sạch KHÔNG miễn OTP: trước xác nhận khách → payment khóa; sau OTP → mở.
// payment success CHỈ đến từ callback (seller không tự đánh dấu).
const s1 = approvedApp({ id:'S1', productId:'motor', underwritingDecision:'APPROVED_STP' });
ok('Motor STP trước OTP → payment KHÓA + lý do xác nhận',
   B.paymentEnableRule(s1).enabled === false && B.paymentEnableRule(s1).reasons.some(r => /xác nhận/.test(r)),
   JSON.stringify(B.paymentEnableRule(s1).reasons));
s1.confirm = { otp:'VERIFIED', confirmedAt:'2026-07-27 09:30' };
ok('Motor STP sau OTP + báo giá duyệt → payment mở', B.paymentEnableRule(s1).enabled === true, JSON.stringify(B.paymentEnableRule(s1).reasons));
// Báo giá chưa duyệt → khoá (chứng minh gate vẫn chặn khi thiếu điều kiện).
const s1draft = approvedApp({ id:'S1d', productId:'motor', underwritingDecision:'NONE' }); s1draft.underwritingStatus='IN_REVIEW';
ok('chưa duyệt thẩm định → payment khoá', B.paymentEnableRule(s1draft).enabled === false);
const s1pay = B.makePayment({ applicationId:s1.id, amount:s1.premium, paymentChannel:'QR', paymentExperience:'CUSTOMER_PRESENT_QR', paymentInitiator:'SELLER' });
ok('QR → payerType CUSTOMER, chưa SUCCESS (chờ callback)', s1pay.payerType === 'CUSTOMER' && s1pay.status !== 'SUCCESS');
const s1cb = B.makeBankCallback({ app: Object.assign({ externalCustomerRef:'EXT-M1', policyId:'JB-MT-2026-0001' }, s1), policyNumber:'JB-MT-2026-0001', certificateNumbers:['GCN-MT-1'], paymentStatus:'SUCCESS', issueStatus:'ISSUED' });
ok('bank callback trỏ đúng external ref + quote version + policy', s1cb.externalCustomerRef === 'EXT-M1' && s1cb.quoteVersion === 1 && s1cb.policyNumber === 'JB-MT-2026-0001');

/* ============ STORY 2 — Health clean STP ============ */
grp('STORY 2 — Health clean → APPROVED_STP (không manual queue) → OTP → link → issue');
const s2uw = B.evaluateUnderwriting({ productId:'health', age:30, riskAnswers:{ truthDeclaration:true } });
ok('Health sạch → STP_PASS / APPROVED_STP', s2uw.routingResult === 'STP_PASS' && s2uw.decision === 'APPROVED_STP');
ok('Health STP KHÔNG tạo queue/officer/manual SLA (mode STP)', s2uw.underwritingMode === 'STP');
ok('Health STP không kèm requiredDocuments/conditions', (s2uw.requiredDocuments||[]).length === 0 && (s2uw.conditions||[]).length === 0);
const s2 = approvedApp({ id:'S2', productId:'health', underwritingDecision:'APPROVED_STP', premium:5775000, quote:{quoteId:'Q-H2',quoteVersion:1,quoteStatus:'VALID',premium:5775000} });
ok('Health STP trước OTP → payment KHÓA', B.paymentEnableRule(s2).enabled === false, JSON.stringify(B.paymentEnableRule(s2).reasons));
s2.confirm = { otp:'VERIFIED', confirmedAt:'2026-07-27 10:00' };
ok('Health STP sau OTP → payment mở', B.paymentEnableRule(s2).enabled === true, JSON.stringify(B.paymentEnableRule(s2).reasons));
const s2pay = B.makePayment({ applicationId:s2.id, amount:s2.premium, paymentChannel:'PAYMENT_LINK', paymentExperience:'CUSTOMER_REMOTE', paymentInitiator:'SELLER' });
ok('payment link → payerType CUSTOMER', s2pay.payerType === 'CUSTOMER');

/* ============ STORY 3 — Health Manual UW ============ */
grp('STORY 3 — Health rule-hit → Manual UW → condition → xác nhận → OTP → payment → issue');
const s3uw = B.evaluateUnderwriting({ productId:'health', age:40, riskAnswers:{ preExistingCondition:true, preExistingDetail:'Tiểu đường type 2', truthDeclaration:true } });
ok('Health chạm rule → MANUAL_REVIEW / mode MANUAL', s3uw.routingResult === 'MANUAL_REVIEW' && s3uw.underwritingMode === 'MANUAL');
ok('Manual review yêu cầu khách xác nhận', s3uw.customerConfirmationRequired === true);
// Manual decision: APPROVED_WITH_CONDITION → cần xác nhận trước khi thanh toán.
const s3 = approvedApp({ id:'S3', productId:'health', underwritingDecision:'APPROVED_WITH_CONDITION', premium:6200000, quote:{quoteId:'Q-H3',quoteVersion:1,quoteStatus:'VALID',premium:6200000} });
const g3a = B.paymentEnableRule(s3);
ok('có điều kiện, chưa xác nhận → payment khoá kèm lý do', g3a.enabled === false && g3a.reasons.some(r => /xác nhận/.test(r)), JSON.stringify(g3a.reasons));
s3.confirm = { otp:'VERIFIED', confirmedAt:'2026-07-27 10:00' };
ok('khách xác nhận điều kiện + OTP → payment mở', B.paymentEnableRule(s3).enabled === true, JSON.stringify(B.paymentEnableRule(s3).reasons));
// LOADING → re-rate/version mới trước khi thu.
const s3L = approvedApp({ id:'S3L', productId:'health', underwritingDecision:'APPROVED_WITH_LOADING', premium:6200000, quote:{quoteId:'Q-H3L',quoteVersion:1,quoteStatus:'VALID',premium:6200000} });
B.quoteVersion.reRate(s3L, 7100000, 'Phụ phí sau thẩm định');
ok('LOADING → version mới DRAFT → payment khoá tới khi duyệt lại', B.paymentEnableRule(s3L).enabled === false);
B.quoteVersion.approve(s3L); s3L.confirm = { otp:'VERIFIED', confirmedAt:'2026-07-27 10:05' };
ok('duyệt version mới + xác nhận phụ phí → payment mở', B.paymentEnableRule(s3L).enabled === true, JSON.stringify(B.paymentEnableRule(s3L).reasons));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
