// Quote versioning + payment + issue contract test suite (Checkpoints 3 & 5).
// Chạy: node scripts/test-quote-payment-issue.js
// Bao phủ: quote đã duyệt immutable · re-rate tạo version mới + supersede + reset UW
// · cấm sửa phí tay · Policy trỏ đúng approved quote version · seller-assisted payerType
// SELLER_OR_AGENT · 3 payment method + quyền thu hộ · bank callback đúng external ref + version.
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
B.readinessFor = function (p, me) { return { ready: true, caps: ['can_advise','can_quote','can_submit','can_bind','can_collect_payment'] }; };
B.vnd = B.vnd || function (n) { return String(n || 0); };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* ---- CP3: quote versioning ---- */
grp('1. Quote versioning — immutable + re-rate + reset UW');
const app = {};
B.quoteVersion.init(app, 5000000);
ok('init tạo version 1 DRAFT active', app.quoteVersions.length === 1 && app.quoteVersions[0].status === 'DRAFT');
B.quoteVersion.approve(app);
ok('approve → version APPROVED + activeQuoteApproved=true', B.quoteVersion.active(app).status === 'APPROVED' && app.activeQuoteApproved === true);

B.quoteVersion.reRate(app, 6200000, 'Thay đổi khai báo rủi ro');
const cur = B.quoteVersion.active(app);
ok('re-rate tạo version mới DRAFT active', cur.version === 2 && cur.status === 'DRAFT');
ok('re-rate → version cũ SUPERSEDED', app.quoteVersions[0].status === 'SUPERSEDED');
ok('re-rate RESET duyệt (activeQuoteApproved=false)', app.activeQuoteApproved === false);
ok('re-rate gắn cờ QUOTE_NEED_RERATE', (app.warningFlags || []).indexOf('QUOTE_NEED_RERATE') >= 0);
ok('re-rate giữ lý do', cur.reRateReason === 'Thay đổi khai báo rủi ro');
let threw = false; try { B.quoteVersion.setPremiumManual(); } catch (e) { threw = true; }
ok('cấm chỉnh phí thủ công (setPremiumManual ném lỗi)', threw);

grp('2. Payment gate chặn khi version chưa duyệt (re-rate pending)');
const gate1 = B.paymentEnableRule({ id:'A1', owner:'RM-01', productId:'motor', submissionState:'SUBMITTED',
  underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_STP', paymentStatus:'METHOD_REQUIRED',
  premium:6200000, quote:{premium:6200000, quoteStatus:'VALID'}, quoteVersions: app.quoteVersions, activeQuoteVersionId: app.activeQuoteVersionId });
ok('version DRAFT sau re-rate → payment bị khoá', gate1.enabled === false);
ok('lý do nêu phiên báo giá chưa duyệt', gate1.reasons.some(r => /chưa được duyệt|thay thế/.test(r)), JSON.stringify(gate1.reasons));

grp('3. Policy trỏ đúng approved quote version');
const issuedApp = { id:'A2', productId:'motor', quote:{ quoteId:'Q-777', quoteVersion:1, quoteStatus:'VALID', premium:5000000 },
  quoteVersions:[{id:'QV-1',version:1,status:'APPROVED'}], activeQuoteVersionId:'QV-1' };
const qref = B.policyQuoteRef(issuedApp);
ok('policyQuoteRef.quoteId đúng', qref.quoteId === 'Q-777');
ok('policyQuoteRef.quoteVersion theo version approved', qref.quoteVersion === 1);
ok('policyQuoteRef có approvedQuoteSnapshot', !!qref.approvedQuoteSnapshot && qref.approvedQuoteSnapshot.premium === 5000000);
const pol = B.makePolicy(Object.assign({ productId:'motor', premium:5000000 }, qref));
ok('makePolicy giữ quoteId', pol.quoteId === 'Q-777');
ok('makePolicy giữ quoteVersion', pol.quoteVersion === 1);
ok('makePolicy giữ approvedQuoteSnapshot', !!pol.approvedQuoteSnapshot);

/* ---- CP5: payment methods + payerType + bank callback ---- */
grp('4. Payment methods + seller-assisted payerType SELLER_OR_AGENT');
const methods = B.paymentMethodsFor({ productId:'motor' });
ok('đủ 3 phương thức (QR, link, thu hộ)', methods.length === 3, methods.map(m=>m.id).join(','));
const sa = methods.find(m => m.id === 'SELLER_ASSISTED');
ok('thu hộ yêu cầu quyền can_collect_payment', sa && sa.requiresCap === 'can_collect_payment');
const noPerm = B.paymentMethodsFor({ productId:'motor' }, { readiness: { caps: ['can_advise'] } }).find(m => m.id === 'SELLER_ASSISTED');
ok('thiếu quyền thu hộ → method thu hộ bị chặn kèm lý do', noPerm && !!noPerm.blockedReason);

const payQR = B.makePayment({ applicationId:'A3', amount:5000000, paymentChannel:'QR', paymentExperience:'CUSTOMER_PRESENT_QR', paymentInitiator:'SELLER' });
ok('QR (khách tự trả) → payerType CUSTOMER', payQR.payerType === 'CUSTOMER', payQR.payerType);
const payLink = B.makePayment({ applicationId:'A3', amount:5000000, paymentChannel:'PAYMENT_LINK', paymentExperience:'CUSTOMER_REMOTE', paymentInitiator:'SELLER' });
ok('Payment link → payerType CUSTOMER', payLink.payerType === 'CUSTOMER', payLink.payerType);
const paySA = B.makePayment({ applicationId:'A3', amount:5000000, paymentChannel:'CARD', paymentExperience:'SELLER_ASSISTED', paymentInitiator:'SELLER' });
ok('Seller-assisted → payerType SELLER_OR_AGENT', paySA.payerType === 'SELLER_OR_AGENT', paySA.payerType);
const paySA2 = B.makePayment({ applicationId:'A3', amount:5000000, paymentExperience:'SELLER_DEVICE_ASSISTED', paymentInitiator:'SELLER' });
ok('Seller-device-assisted → payerType SELLER_OR_AGENT', paySA2.payerType === 'SELLER_OR_AGENT', paySA2.payerType);

grp('5. Payment intent không tự thành công (callback-only)');
ok('makePayment mặc định KHÔNG phải SUCCESS', payQR.status !== 'SUCCESS', payQR.status);

grp('6. Bank callback đúng external ref + quote version');
const cb = B.makeBankCallback({ app: Object.assign({ externalCustomerRef:'EXT-9001', adviceId:'ADV-1', policyId:'JB-MT-2026-1234' }, issuedApp),
  policyNumber:'JB-MT-2026-1234', certificateNumbers:['GCN-MT-1'], effectiveFrom:'2026-07-23', effectiveTo:'2027-07-22', paymentStatus:'SUCCESS' });
['externalCustomerRef','externalJourneyRef','quoteId','quoteVersion','policyNumber','certificateNumbers','issueStatus','effectiveFrom','effectiveTo','paymentStatus','callbackTimestamp']
  .forEach(f => ok('bank callback có trường ' + f, cb[f] !== undefined, JSON.stringify(cb[f])));
ok('callback externalCustomerRef đúng', cb.externalCustomerRef === 'EXT-9001');
ok('callback quoteVersion đúng approved version', cb.quoteVersion === 1);
ok('callback policyNumber đúng', cb.policyNumber === 'JB-MT-2026-1234');
ok('callback certificateNumbers không rỗng', Array.isArray(cb.certificateNumbers) && cb.certificateNumbers.length === 1);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
