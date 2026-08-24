// Statement of Fact test suite.
// Chạy: node scripts/test-statement-of-fact.js
// Nền nghiệp vụ: CII IF3 2/3 mục B (bản khai phải được người đề nghị ký),
// 2/2 mục A (statement of fact xác nhận MỌI câu hỏi và câu trả lời),
// 2/4 (đọc lại cho khách nghe; CẤM câu trả lời giả định),
// 1/8–1/9 D1 (hậu quả phân nhánh theo trạng thái tinh thần NGƯỜI KHAI).
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/channel-profiles.js');
require('../shared/mock/seed/customer-data-access.js');
require('../shared/mock/seed/status-mappings.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
require('../shared/mock/seed/statement-of-fact.js');
require('../shared/mock/seed/case-state-resolver.js');
require('../shared/mock/seed/payment-method-config.js');
const B = global.BANCA;
B.current = () => 'RM-01';
B.readinessFor = () => ({ ready:true, state:'READY', caps:['can_advise','can_quote','can_submit','can_bind','can_collect_payment'] });

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

function motorApp(over) {
  return Object.assign({
    id:'APP-SOF', owner:'RM-01', productId:'motor', customerId:'CUS-001',
    submissionState:'SUBMITTED', status:'PAYMENT_METHOD_REQUIRED',
    underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_STP',
    paymentStatus:'METHOD_REQUIRED', premium:5000000,
    quote:{ premium:5000000, quoteStatus:'VALID' }, confirm:{ otp:'VERIFIED' },
    riskAnswers:{ claimCount:0, commercialUse:false, floodExposure:false, modifiedVehicle:false, previousLossAmount:0 },
    answeredBy:{ claimCount:'CUSTOMER', commercialUse:'CUSTOMER', floodExposure:'CUSTOMER', modifiedVehicle:'CUSTOMER', previousLossAmount:'CUSTOMER' }
  }, over || {});
}

/* 1. Dựng bản khai để đọc lại cho khách ------------------------------- */
grp('1. Dựng bản khai — đọc lại được từng câu (IF3 2/4 "repeated back")');
const sof = B.statementOfFact.build(motorApp());
ok('trả về từng câu, không phải một cục JSON', Array.isArray(sof.lines) && sof.lines.length === 5, JSON.stringify(sof.lines.length));
ok('mỗi dòng có câu hỏi + câu trả lời + AI trả lời',
  sof.lines.every(l => l.label && 'answer' in l && l.answeredBy), JSON.stringify(sof.lines[0]));
ok('gắn nhãn tiếng Việt cho nguồn trả lời', sof.lines[0].answeredByLabel === 'Khách tự trả lời', sof.lines[0].answeredByLabel);
ok('gắn schema có version (biết khách trả lời bản nào)', sof.schemaId === 'motorDeclaration@1', sof.schemaId);

/* 2. Không cho phép câu trả lời vô chủ -------------------------------- */
grp('2. Cấm câu trả lời không rõ ai trả lời (IF3 2/4 cấm assumptive answer)');
const noBy = motorApp({ answeredBy:{ claimCount:'CUSTOMER' } });
const s2 = B.statementOfFact.build(noBy);
ok('thiếu answeredBy → liệt kê vào unattributed', s2.unattributed.length === 4, JSON.stringify(s2.unattributed));
ok('trạng thái NOT_READY', B.statementOfFact.status(noBy) === 'NOT_READY', B.statementOfFact.status(noBy));
ok('  …lý do nói rõ là thiếu người trả lời',
  // Lý do phải phân biệt RÕ "thiếu người trả lời" với "chưa trả lời" — người bán
  // vừa khai xong mà đọc nhầm là bị bắt khai lại (phản hồi thật 2026-08-24).
  /NGƯỜI trả lời/.test(B.statementOfFact.blockingReason(noBy) || '')
    && !/^Bản khai còn \d+ câu chưa trả lời/.test(B.statementOfFact.blockingReason(noBy) || ''),
  B.statementOfFact.blockingReason(noBy));

let threw = false;
try { B.statementOfFact.confirm(noBy, {}); } catch (e) { threw = /chưa ghi nhận ai trả lời/.test(e.message); }
ok('không cho xác nhận khi còn câu vô chủ', threw);

const missing = motorApp({ riskAnswers:{ claimCount:0 } });
ok('thiếu câu trả lời → NOT_READY', B.statementOfFact.status(missing) === 'NOT_READY');
ok('  …lý do đếm đúng số câu còn thiếu',
  /còn 4 câu chưa trả lời/.test(B.statementOfFact.blockingReason(missing) || ''), B.statementOfFact.blockingReason(missing));

/* 3. Xác nhận & phát hiện sửa sau khi xác nhận ------------------------ */
grp('3. Xác nhận rồi sửa câu trả lời → phát hiện được (answersHash)');
const a3 = motorApp();
ok('chưa gửi khách → PENDING', B.statementOfFact.status(a3) === 'PENDING');
B.statementOfFact.confirm(a3, { by:'CUSTOMER', channel:'PORTAL', otp:'VERIFIED' });
ok('khách xác nhận → CONFIRMED', B.statementOfFact.status(a3) === 'CONFIRMED');
ok('  …bản ghi dùng chung khuôn consent, đủ trường đối soát',
  !!(a3.statementOfFact.consentId && a3.statementOfFact.consentTimestamp && a3.statementOfFact.consentStatus),
  JSON.stringify(Object.keys(a3.statementOfFact)));
ok('  …consentType riêng, không lẫn với consent chia sẻ dữ liệu',
  a3.statementOfFact.consentType === 'DECLARATION_ACCURACY', a3.statementOfFact.consentType);
ok('  …ghi lại schema + hash nội dung đã xác nhận',
  !!(a3.statementOfFact.declarationSchemaId && a3.statementOfFact.answersHash));

a3.riskAnswers.claimCount = 3;   // sửa lén sau khi khách đã xác nhận
ok('sửa câu trả lời sau xác nhận → STALE', B.statementOfFact.status(a3) === 'STALE', B.statementOfFact.status(a3));
ok('  …lý do nói rõ nội dung đã đổi',
  /đã thay đổi sau khi khách xác nhận/.test(B.statementOfFact.blockingReason(a3) || ''), B.statementOfFact.blockingReason(a3));

/* 4. Câu hỏi có điều kiện không bị đếm nhầm --------------------------- */
grp('4. Câu hỏi có điều kiện (branchOn) không bị tính là chưa trả lời');
const h1 = { id:'APP-H', owner:'RM-01', productId:'health', customerId:'CUS-001',
  riskAnswers:{ preExistingCondition:false, hospitalizedLast12Months:false, seriousIllness:false, smoker:false, truthDeclaration:true },
  answeredBy:{ preExistingCondition:'CUSTOMER', hospitalizedLast12Months:'CUSTOMER', seriousIllness:'CUSTOMER', smoker:'CUSTOMER', truthDeclaration:'CUSTOMER' } };
const sh = B.statementOfFact.build(h1);
ok('không khai bệnh có sẵn → câu chi tiết bệnh KHÔNG áp dụng',
  sh.lines.find(l => l.code === 'preExistingDetail').applicable === false);
ok('  …và không bị tính là chưa trả lời', sh.unanswered.length === 0, JSON.stringify(sh.unanswered));
ok('  …bản khai đủ điều kiện xác nhận', B.statementOfFact.status(h1) === 'PENDING', B.statementOfFact.status(h1));

const h2 = JSON.parse(JSON.stringify(h1));
h2.riskAnswers.preExistingCondition = true;   // bật nhánh
const sh2 = B.statementOfFact.build(h2);
ok('khai CÓ bệnh có sẵn → câu chi tiết bệnh trở thành bắt buộc',
  sh2.lines.find(l => l.code === 'preExistingDetail').applicable === true && sh2.unanswered.indexOf('preExistingDetail') >= 0,
  JSON.stringify(sh2.unanswered));

/* 5. Cổng thanh toán ------------------------------------------------- */
grp('5. Cổng thanh toán chặn khi bản khai chưa xong');
const good = motorApp();
B.statementOfFact.confirm(good, { by:'CUSTOMER' });
ok('bản khai đã xác nhận → cho thanh toán', B.paymentEnableRule(good).enabled === true, JSON.stringify(B.paymentEnableRule(good).reasons));

const g2 = B.paymentEnableRule(motorApp());   // PENDING, chưa xác nhận
ok('chưa xác nhận bản khai → CHẶN', g2.enabled === false, JSON.stringify(g2.reasons));
ok('  …lý do phát ra thành chữ (§15.3)',
  g2.reasons.some(r => /bản khai/i.test(r)), JSON.stringify(g2.reasons));

const g3 = B.paymentEnableRule(motorApp({ productId:'pa', riskAnswers:{}, answeredBy:{} }));
ok('sản phẩm khác cũng áp dụng (không hard-code motor)',
  g3.reasons.some(r => /bản khai/i.test(r)), JSON.stringify(g3.reasons));

/* 6. Phân biệt khách khai vs nhân viên nhập hộ ------------------------ */
grp('6. Phân biệt "khách khai sai" với "nhân viên gõ sai" (IF3 1/8–1/9)');
const onBehalf = motorApp({ answeredBy:{ claimCount:'SELLER_ON_BEHALF', commercialUse:'CUSTOMER',
  floodExposure:'CUSTOMER', modifiedVehicle:'CUSTOMER', previousLossAmount:'CUSTOMER' } });
const sb = B.statementOfFact.build(onBehalf);
const line = sb.lines.find(l => l.code === 'claimCount');
ok('ghi được câu nào do nhân viên nhập hộ', line.answeredBy === 'SELLER_ON_BEHALF', line.answeredBy);
ok('  …có nhãn hiển thị', line.answeredByLabel === 'Nhân viên nhập hộ', line.answeredByLabel);
ok('  …vẫn xác nhận được (nhập hộ là hợp lệ, chỉ cần GHI LẠI)',
  (B.statementOfFact.confirm(onBehalf, { by:'CUSTOMER' }), B.statementOfFact.status(onBehalf) === 'CONFIRMED'));
ok('nguồn prefill được đánh dấu KHÔNG quy trách nhiệm cho khách',
  B.ANSWER_SOURCE.PREFILLED_FROM_BANK.attributable === false && B.ANSWER_SOURCE.CUSTOMER.attributable === true);

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
