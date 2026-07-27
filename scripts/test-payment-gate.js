// Payment gate + state model test suite (§9.2 / §15.3 / §17 / AC11, AC16).
// Chạy: node scripts/test-payment-gate.js
// Bao phủ: mọi lý do chặn thanh toán đều được PHÁT RA THÀNH CHỮ (không chỉ disable),
// resolver dùng đúng 1 gate, không thanh toán 2 lần, quyền thu hộ, quote hết hạn/superseded.
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { getItem: function () { return null; }, setItem: function () { } };

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/status-mappings.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/case-state-resolver.js');
require('../shared/mock/seed/payment-method-config.js');
const B = global.BANCA;

// persona/readiness stub — mặc định RM-01 đủ quyền thu hộ.
B.current = function () { return 'RM-01'; };
B.readinessFor = function () { return { ready: true, state: 'READY', caps: ['can_advise', 'can_quote', 'can_submit', 'can_bind', 'can_collect_payment'] }; };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }
function has(gate, frag) { return gate.reasons.some(r => r.indexOf(frag) >= 0); }

// Case "sạch": Motor STP đã duyệt + khách đã xác nhận + có phí → được thanh toán.
function readyCase(over) {
  return Object.assign({
    id: 'APP-T1', owner: 'RM-01', productId: 'motor', submissionState: 'SUBMITTED',
    status: 'PAYMENT_METHOD_REQUIRED',
    underwritingStatus: 'DECIDED', underwritingDecision: 'APPROVED_STP',
    paymentStatus: 'METHOD_REQUIRED',
    premium: 5000000, quote: { premium: 5000000, quoteStatus: 'VALID' }
  }, over || {});
}

/* 1. Happy path ------------------------------------------------------ */
grp('1. Motor STP đủ điều kiện → cho phép thanh toán');
const g1 = B.paymentEnableRule(readyCase());
ok('enabled = true', g1.enabled, JSON.stringify(g1.reasons));
ok('không có lý do chặn', g1.reasons.length === 0, JSON.stringify(g1.reasons));
ok('resolver dùng chung gate (canInitiatePayment)', B.deriveCaseViewState(readyCase()).canInitiatePayment === true);

/* 2. Từng điều kiện chặn đều có LÝ DO BẰNG CHỮ (§15.3 / AC11) -------- */
grp('2. Mỗi điều kiện chặn phải phát ra lý do đọc được');

const gUw = B.paymentEnableRule(readyCase({ underwritingStatus: 'IN_REVIEW', underwritingDecision: 'NONE' }));
ok('UW đang xử lý → chặn + có lý do', !gUw.enabled && has(gUw, 'Thẩm định đang xử lý'), JSON.stringify(gUw.reasons));

const gMore = B.paymentEnableRule(readyCase({ underwritingStatus: 'NEED_MORE_INFORMATION', underwritingDecision: 'NONE' }));
ok('Cần bổ sung → chặn + có lý do', !gMore.enabled && has(gMore, 'Cần bổ sung'), JSON.stringify(gMore.reasons));

const gDec = B.paymentEnableRule(readyCase({ underwritingDecision: 'DECLINED' }));
ok('Từ chối → chặn + có lý do', !gDec.enabled && has(gDec, 'từ chối'), JSON.stringify(gDec.reasons));

const gCond = B.paymentEnableRule(readyCase({ underwritingDecision: 'APPROVED_WITH_CONDITION' }));
ok('Duyệt có điều kiện, khách chưa xác nhận → chặn', !gCond.enabled && has(gCond, 'điều kiện/loại trừ'), JSON.stringify(gCond.reasons));

const gCondOk = B.paymentEnableRule(readyCase({
  underwritingDecision: 'APPROVED_WITH_CONDITION', confirm: { otp: 'VERIFIED', confirmedAt: '2026-07-25 10:00' }
}));
ok('Duyệt có điều kiện + khách đã OTP → cho phép', gCondOk.enabled, JSON.stringify(gCondOk.reasons));

const gExp = B.paymentEnableRule(readyCase({ quote: { premium: 5000000, quoteStatus: 'EXPIRED' } }));
ok('Quote hết hạn → chặn + có lý do', !gExp.enabled && has(gExp, 'hết hạn'), JSON.stringify(gExp.reasons));

const gNoAmt = B.paymentEnableRule(readyCase({ premium: 0, quote: {} }));
ok('Không có số phí → chặn', !gNoAmt.enabled && has(gNoAmt, 'số phí'), JSON.stringify(gNoAmt.reasons));

const gDoc = B.paymentEnableRule(readyCase({ missingRequiredDocument: true }));
ok('Thiếu tài liệu bắt buộc → chặn', !gDoc.enabled && has(gDoc, 'tài liệu bắt buộc'), JSON.stringify(gDoc.reasons));

/* 3. Không thanh toán 2 lần (§17) ------------------------------------ */
grp('3. Không cho thanh toán trùng');
const gPaid = B.paymentEnableRule(readyCase({ paymentStatus: 'SUCCESS', payment: { status: 'SUCCESS', amount: 5000000 } }));
ok('Đã thanh toán thành công → chặn', !gPaid.enabled && has(gPaid, 'đã thanh toán thành công'), JSON.stringify(gPaid.reasons));
const gPending = B.paymentEnableRule(readyCase({ paymentStatus: 'PENDING', payment: { status: 'PENDING' } }));
ok('Đang có phiên thanh toán → chặn', !gPending.enabled && has(gPending, 'phiên thanh toán'), JSON.stringify(gPending.reasons));

/* 4. Permission / ownership (§17) ------------------------------------ */
grp('4. Quyền và quyền sở hữu case');
const gOwner = B.paymentEnableRule(readyCase({ owner: 'RM-02' }));
ok('Case của seller khác → chặn', !gOwner.enabled && has(gOwner, 'nhân viên phụ trách'), JSON.stringify(gOwner.reasons));

const gCap = B.paymentEnableRule(readyCase(), { readiness: { caps: ['can_advise', 'can_quote', 'can_submit'], reason: 'Telesales không được thu hộ' } });
ok('Không có can_collect_payment → chặn + nêu lý do', !gCap.enabled && has(gCap, 'quyền thu hộ'), JSON.stringify(gCap.reasons));

/* 5. Quote version (§8.3) -------------------------------------------- */
grp('5. Quote version');
const appV = readyCase();
B.quoteVersion.init(appV, 5000000);
B.quoteVersion.approve(appV);
ok('Version 1 APPROVED → vẫn thanh toán được', B.paymentEnableRule(appV).enabled);
B.quoteVersion.reRate(appV, 6000000, 'Đổi gói');
const gSup = B.paymentEnableRule(appV);
ok('Sau re-rate: version cũ SUPERSEDED', appV.quoteVersions[0].status === 'SUPERSEDED');
ok('Sau re-rate: có version mới DRAFT active', B.quoteVersion.active(appV).status === 'DRAFT');
ok('Version mới chưa duyệt → chặn thanh toán', !gSup.enabled && has(gSup, 'chưa được duyệt'), JSON.stringify(gSup.reasons));
let threw = false;
try { B.quoteVersion.setPremiumManual(appV, 1); } catch (e) { threw = true; }
ok('Cấm sửa phí thủ công (§8.3)', threw);

/* 6. Cancelled -------------------------------------------------------- */
grp('6. Case đã hủy');
const gCan = B.paymentEnableRule(readyCase({ applicationStatus: 'CANCELLED', status: 'CANCELLED' }));
ok('Đã hủy → chặn', !gCan.enabled && has(gCan, 'đã hủy'), JSON.stringify(gCan.reasons));

/* 7. Nhiều lý do cùng lúc đều được liệt kê --------------------------- */
grp('7. Liệt kê ĐỦ lý do, không dừng ở lý do đầu tiên');
const gMulti = B.paymentEnableRule(readyCase({
  owner: 'RM-09', underwritingStatus: 'IN_REVIEW', underwritingDecision: 'NONE',
  quote: { premium: 5000000, quoteStatus: 'EXPIRED' }, missingRequiredDocument: true
}));
ok('Gộp ≥4 lý do', gMulti.reasons.length >= 4, JSON.stringify(gMulti.reasons));

/* 8. Payment method config (§9.3 / §16) ------------------------------ */
grp('8. Payment method dùng chung Motor/Health');
const mMotor = B.paymentMethodsFor(readyCase());
const mHealth = B.paymentMethodsFor(readyCase({ productId: 'health' }));
ok('Motor có đúng 3 phương thức', mMotor.length === 3, JSON.stringify(mMotor.map(m => m.id)));
ok('Health dùng CÙNG bộ phương thức (AC02)',
  JSON.stringify(mMotor.map(m => m.id)) === JSON.stringify(mHealth.map(m => m.id)));
ok('Đúng 3 nhãn theo §9.3',
  mMotor.map(m => m.label).join('|') === 'Quét mã QR|Gửi link thanh toán|RM/Đại lý thu hộ',
  mMotor.map(m => m.label).join('|'));
const mNoCap = B.paymentMethodsFor(readyCase(), { readiness: { caps: ['can_quote'] } });
ok('Thiếu quyền thu hộ → method RM thu hộ bị chặn kèm lý do',
  !!mNoCap.find(m => m.id === 'SELLER_ASSISTED').blockedReason);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
