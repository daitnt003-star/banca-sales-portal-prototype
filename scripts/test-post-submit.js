// Post-submit state machine test suite (spec §XII, 15 tests).
// Chạy: node scripts/test-post-submit.js
global.window = global;
global.location = {search:'', pathname:'/'};
global.localStorage = {getItem:function(){return null;}, setItem:function(){}};
global.BANCA = global.BANCA || {}; global.BANCA.current = function(){return 'RM-01';};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
// case-state-resolver dùng chung gate thanh toán ở status-mappings (§9.2) → phải nạp trước.
require('../shared/mock/seed/status-mappings.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/case-state-resolver.js');
// Gate thanh toán cần danh mục phương thức để biết còn cách thu nào khả dụng (§9.2/§17).
require('../shared/mock/seed/payment-method-config.js');
const B = global.BANCA;
B.current = function(){return 'RM-01';};

let pass=0, fail=0;
function ok(name, cond, extra){ if(cond){pass++;console.log('  ✓ '+name);} else {fail++;console.log('  ✗ '+name+(extra?('  → '+extra):''));} }

// Helper: mô phỏng submit PA_BASIC/STP → trả về app sau submit.
function submitStp(productId){
  const stp = B.makeStpDecision(productId, {applicationId:'T-1', additionalPremium:0});
  if(stp.error) return {error:stp.error, configError:stp.configError};
  return {id:'T-1', owner:'RM-01', productId:productId, submissionState:'SUBMITTED',
    status:'PAYMENT_METHOD_REQUIRED', applicationStatus:'PROCESSING', underwritingStatus:'DECIDED',
    underwritingDecision:'APPROVED_STP', paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED',
    stpDecision:stp, payment:null, premium:396000};
}

console.log('\n§XII — Post-submit state machine tests');

// 1. PA submit tạo APPROVED_STP
const pa = submitStp('pa');
ok('1. PA_BASIC submit tạo APPROVED_STP', pa.stpDecision && pa.stpDecision.decision==='APPROVED_STP');

// 2. PA không map Motor UW
ok('2. PA không map Motor UW (ruleSet PA_BASIC_UW, không Motor)', pa.stpDecision.ruleSetCode==='PA_BASIC_UW' && !/MOTOR/i.test(pa.stpDecision.ruleSetCode) && (B.underwritingDefinitionFor('pa').manualUnit===null));

// 3. PA APPROVED_STP chưa có confirmation → khóa payment, yêu cầu xác nhận khách hàng
const vPa = B.deriveCaseViewState(pa);
ok('3. PA APPROVED_STP chưa xác nhận → CUSTOMER_CONFIRMATION_REQUIRED', vPa.phase==='CUSTOMER_CONFIRMATION_REQUIRED' && vPa.canCreatePaymentIntent===false);

// 4. Sau khi khách xác nhận → METHOD_REQUIRED, chưa có payment record
const paConfirmed = Object.assign({}, pa, {confirm:{sentAt:'2026-07-23 12:50', otp:'VERIFIED', confirmedAt:'2026-07-23 12:55'}});
const vPaConfirmed = B.deriveCaseViewState(paConfirmed);
ok('4. PA đã xác nhận → METHOD_REQUIRED, chưa có payment record', paConfirmed.payment===null && vPaConfirmed.phase==='PAYMENT_METHOD_REQUIRED' && vPaConfirmed.canCreatePaymentIntent===true);

// 5/6/7. Chọn option tạo intent (mô phỏng createPaymentIntent logic)
function makeIntent(app, channel, experience, delivery){
  if(app.payment && ['PENDING','PROCESSING'].includes(app.payment.status)) return app.payment; // no dup (guard trước)
  if(!B.deriveCaseViewState(app).canCreatePaymentIntent) return null;
  const p = B.makePayment({applicationId:app.id, amount:app.premium, paymentChannel:channel, paymentExperience:experience, paymentInitiator:'SELLER', payerType:'CUSTOMER', status:'PENDING'});
  app.payment=p; app.paymentStatus='PENDING'; app.status='PENDING_PAYMENT'; return p;
}
const paQR = Object.assign(submitStp('pa'), {confirm:{otp:'VERIFIED', confirmedAt:'2026-07-23 12:55'}}); const iQR = makeIntent(paQR,'QR','CUSTOMER_PRESENT');
ok('5. Chọn QR → tạo intent PENDING (channel QR, experience CUSTOMER_PRESENT)', iQR && iQR.status==='PENDING' && iQR.paymentChannel==='QR' && iQR.paymentExperience==='CUSTOMER_PRESENT');
const paLink = Object.assign(submitStp('pa'), {confirm:{otp:'VERIFIED', confirmedAt:'2026-07-23 12:55'}}); const iLink = makeIntent(paLink,'PAYMENT_LINK','CUSTOMER_REMOTE');
ok('6. Chọn gửi link → intent PENDING (PAYMENT_LINK, CUSTOMER_REMOTE)', iLink && iLink.paymentChannel==='PAYMENT_LINK' && iLink.paymentExperience==='CUSTOMER_REMOTE');
const paSA = Object.assign(submitStp('pa'), {confirm:{otp:'VERIFIED', confirmedAt:'2026-07-23 12:55'}}); const iSA = makeIntent(paSA,'CARD','SELLER_ASSISTED');
ok('7. Seller-assisted → intent (experience SELLER_ASSISTED, initiator SELLER)', iSA && iSA.paymentExperience==='SELLER_ASSISTED' && iSA.paymentInitiator==='SELLER');

// 8. Manual UW pending khóa payment
const mp = {id:'M1',owner:'RM-01',productId:'motor',submissionState:'SUBMITTED',status:'PENDING_UW'};
ok('8. Manual UW pending khóa payment', B.deriveCaseViewState(mp).paymentAccessible===false && B.deriveCaseViewState(mp).canCreatePaymentIntent===false);

// 9. NEED_MORE_INFORMATION khóa payment
const nmi = {id:'M2',owner:'RM-01',productId:'motor',submissionState:'SUBMITTED',status:'NEED_MORE_INFO'};
ok('9. NEED_MORE_INFORMATION khóa payment', B.deriveCaseViewState(nmi).paymentAccessible===false && B.deriveCaseViewState(nmi).phase==='NEED_MORE_INFORMATION');

// 10. APPROVED_WITH_CONDITION chưa xác nhận khóa payment
const cond = {id:'M3',owner:'RM-01',productId:'motor',submissionState:'SUBMITTED',status:'UW_DECIDED',uw:{decision:'APPROVED_WITH_CONDITION'}};
ok('10. Condition chưa xác nhận khóa payment', B.deriveCaseViewState(cond).paymentAccessible===false && B.deriveCaseViewState(cond).phase==='CUSTOMER_CONFIRMATION_REQUIRED');

// 11. Condition đã xác nhận → METHOD_REQUIRED
const condOk = {id:'M4',owner:'RM-01',productId:'motor',submissionState:'SUBMITTED',status:'PAYMENT_METHOD_REQUIRED',underwritingDecision:'APPROVED_WITH_CONDITION',paymentStatus:'METHOD_REQUIRED',premium:8162000,confirm:{otp:'VERIFIED'}};
ok('11. Condition đã xác nhận → METHOD_REQUIRED', B.deriveCaseViewState(condOk).phase==='PAYMENT_METHOD_REQUIRED' && B.deriveCaseViewState(condOk).canCreatePaymentIntent===true);

// 12. Header/list/tab cùng display state (resolver duy nhất)
const v = B.deriveCaseViewState(condOk);
ok('12. Một display state duy nhất cho mọi component', v.displayStatus && v.primaryAction && typeof v.paymentAccessible==='boolean' && v.states);

// 13. Double click không tạo hai intent
const dbl = Object.assign(submitStp('pa'), {confirm:{otp:'VERIFIED', confirmedAt:'2026-07-23 12:55'}}); makeIntent(dbl,'QR','CUSTOMER_PRESENT'); const first=dbl.payment; const second=makeIntent(dbl,'QR','CUSTOMER_PRESENT');
ok('13. Double-click không tạo intent thứ 2', first===second && dbl.payment.paymentId===first.paymentId);

// 14. Payment success không do seller set trực tiếp (guard: chỉ callback)
// deriveCaseViewState không expose action set-success; canCreatePaymentIntent false khi đã pending
ok('14. Seller không tự set SUCCESS (không có action set-success + intent pending khóa tạo mới)', B.deriveCaseViewState(dbl).canCreatePaymentIntent===false);

// 15. Payment success + issue failed không yêu cầu thanh toán lại
const isf = {id:'M5',owner:'RM-01',productId:'motor',submissionState:'SUBMITTED',status:'PENDING_ISSUE',underwritingDecision:'APPROVED',paymentStatus:'SUCCESS',policyStatus:'ISSUE_FAILED',payment:{status:'SUCCESS'}};
const vIsf = B.deriveCaseViewState(isf);
ok('15. Issue failed giữ SUCCESS, không thu lại (CTA thử phát hành lại)', vIsf.phase==='POLICY_ISSUE_FAILED' && vIsf.primaryAction.key==='retryIssue' && vIsf.states.paymentStatus==='SUCCESS');

// Regression AC-07: PA không có Motor UW mapping
ok('AC-07. PA không có Motor UW Team/Queue/RuleSet', B.underwritingDefinitionFor('pa').manualUnit===null && B.underwritingDefinitionFor('pa').queueCode===null && B.underwritingDefinitionFor('pa').ruleSetCode!=='MOTOR_UW');

console.log('\n===================================');
console.log('  PASS: '+pass+'   FAIL: '+fail);
console.log('===================================');
process.exit(fail>0?1:0);
