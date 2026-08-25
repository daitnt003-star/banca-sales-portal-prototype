// Declaration reconfirm test suite.
// Chạy: node scripts/test-declaration-reconfirm.js
// Nền nghiệp vụ: CII IF3 ch.1 mục C3C / C3D.
//   C3C — sửa hồ sơ giữa kỳ: "the duty is revived as if a new contract is formed"
//   C3D — tái tục: phải kéo lại câu trả lời cũ và hỏi khách "còn đúng không"
// Cặp song song của quoteVersion.reRate: reRate lo TIỀN, cờ này lo BẢN KHAI.
// Ý nghĩa: thu tiền trên một bản khai đã hết giá trị là chỗ hỏng đắt nhất
// khi có tranh chấp khai sai (IF3 1/8–1/9 phân nhánh hậu quả theo người khai).
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/status-mappings.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/case-state-resolver.js');
require('../shared/mock/seed/payment-method-config.js');
require('../shared/mock/seed/products.js');
require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/manager-profiles.js');
require('../shared/mock/seed/handoffs.js');
const B = global.BANCA;
B.current = () => 'RM-01';
B.readinessFor = () => ({ ready:true, state:'READY', caps:['can_advise','can_quote','can_submit','can_bind','can_collect_payment'] });

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

// Hồ sơ đã duyệt, khách đã OTP, báo giá hợp lệ → đủ điều kiện thu tiền.
function payable(over) {
  return Object.assign({
    id:'APP-D1', owner:'RM-01', productId:'motor', submissionState:'SUBMITTED',
    status:'PAYMENT_METHOD_REQUIRED', underwritingStatus:'DECIDED',
    underwritingDecision:'APPROVED_STP', paymentStatus:'METHOD_REQUIRED',
    premium:5000000, quote:{ premium:5000000, quoteStatus:'VALID' },
    confirm:{ otp:'VERIFIED', confirmedAt:'2026-07-25 09:00' }
  }, over || {});
}

/* 1. Cờ có trong từ điển ---------------------------------------------- */
grp('1. Cờ nằm trong từ điển cảnh báo, có nhãn tiếng Việt');
ok('WARNING_FLAGS có DECLARATION_NEEDS_RECONFIRM', !!B.WARNING_FLAGS.DECLARATION_NEEDS_RECONFIRM);
ok('  …có nhãn ra UI, không lộ SNAKE_CASE',
  B.WARNING_FLAGS.DECLARATION_NEEDS_RECONFIRM.label === 'Cần xác nhận lại khai báo',
  B.WARNING_FLAGS.DECLARATION_NEEDS_RECONFIRM.label);
ok('  …badge render được', /Cần xác nhận lại khai báo/.test(B.warnBadge('DECLARATION_NEEDS_RECONFIRM')));

/* 2. Đặt cờ / gỡ cờ ---------------------------------------------------- */
grp('2. Đặt cờ và gỡ cờ');
const a1 = payable();
ok('hồ sơ sạch → chưa cần xác nhận lại', B.declaration.needsReconfirm(a1) === false);

B.declaration.markNeedsReconfirm(a1, 'Sửa giữa kỳ: đổi mục đích sử dụng xe');
ok('sau khi đánh dấu → needsReconfirm=true', B.declaration.needsReconfirm(a1) === true);
ok('  …ghi lại LÝ DO (không chỉ bật cờ trống)',
  /Sửa giữa kỳ/.test((a1.declarationReconfirm || {}).reason || ''), JSON.stringify(a1.declarationReconfirm));
ok('  …có mốc thời gian raisedAt', !!(a1.declarationReconfirm || {}).raisedAt);
ok('  …không đặt cờ trùng khi gọi 2 lần',
  (B.declaration.markNeedsReconfirm(a1, 'x'), a1.warningFlags.filter(w => w === 'DECLARATION_NEEDS_RECONFIRM').length === 1),
  JSON.stringify(a1.warningFlags));

B.declaration.confirmed(a1, 'CUSTOMER', 'motorDeclaration@1');
ok('khách xác nhận lại → gỡ cờ', B.declaration.needsReconfirm(a1) === false);
ok('  …ghi AI xác nhận, LÚC NÀO, trên SCHEMA NÀO',
  (a1.declarationReconfirm.confirmedBy === 'CUSTOMER'
   && !!a1.declarationReconfirm.confirmedAt
   && a1.declarationReconfirm.schemaId === 'motorDeclaration@1'),
  JSON.stringify(a1.declarationReconfirm));

/* 3. Cổng thanh toán phải chặn ---------------------------------------- */
grp('3. Cổng thanh toán chặn khi bản khai chưa được xác nhận lại');
const clean = payable();
ok('hồ sơ sạch → cho thanh toán', B.paymentEnableRule(clean).enabled === true, JSON.stringify(B.paymentEnableRule(clean).reasons));

const stale = B.declaration.markNeedsReconfirm(payable(), 'Đã đổi khách hàng');
const g = B.paymentEnableRule(stale);
ok('bản khai cần xác nhận lại → CHẶN thu tiền', g.enabled === false, JSON.stringify(g.reasons));
ok('  …lý do phát ra thành chữ (§15.3), không chỉ disable',
  g.reasons.some(r => /chưa xác nhận lại nội dung khai báo/i.test(r)), JSON.stringify(g.reasons));
ok('  …lý do kèm nguyên nhân cụ thể',
  g.reasons.some(r => /Đã đổi khách hàng/.test(r)), JSON.stringify(g.reasons));

const fixed = B.declaration.confirmed(stale, 'CUSTOMER');
ok('khách xác nhận lại → mở lại thu tiền', B.paymentEnableRule(fixed).enabled === true, JSON.stringify(B.paymentEnableRule(fixed).reasons));

/* 4. Độc lập với cờ tính lại phí -------------------------------------- */
grp('4. Độc lập với QUOTE_NEED_RERATE — hai việc khác nhau');
const onlyRerate = payable();
B.quoteVersion.init(onlyRerate, 5000000);
B.quoteVersion.active(onlyRerate).status = 'APPROVED';
B.quoteVersion.reRate(onlyRerate, 5300000, 'Đổi mức khấu trừ');
ok('đổi mức khấu trừ → cần tính phí lại', (onlyRerate.warningFlags || []).indexOf('QUOTE_NEED_RERATE') >= 0);
ok('  …nhưng KHÔNG buộc khai báo lại (chỉ đổi tiền, không đổi rủi ro đã khai)',
  B.declaration.needsReconfirm(onlyRerate) === false, JSON.stringify(onlyRerate.warningFlags));

/* 5. Đổi khách hàng trên bàn giao -------------------------------------- */
grp('5. Đổi khách hàng trên bàn giao → bản khai cũ hết giá trị');
const ho = B.handoffs.find(h => h.customerId);
if (ho) {
  B.changeCustomer(ho.id, 'CUS-999', 'Khách Hàng Mới', 'Nhầm khách', 'TL-01');
  const h2 = B.handoffById(ho.id);
  ok('handoff bị đánh dấu cần khai báo lại', B.declaration.needsReconfirm(h2) === true, JSON.stringify(h2.warningFlags));
  ok('  …báo giá cũng phải tính lại (hành vi cũ giữ nguyên)', h2.quoteStatus === 'RE_RATING_REQUIRED', h2.quoteStatus);
  ok('  …lý do nói rõ là do đổi khách',
    /đổi khách hàng/i.test((h2.declarationReconfirm || {}).reason || ''), JSON.stringify(h2.declarationReconfirm));
} else console.log('  (bỏ qua — seed không có handoff)');

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
