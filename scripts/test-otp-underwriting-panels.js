#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { getItem: function () { return null; }, setItem: function () {} };

require('../shared/mock/seed/case-state-resolver.js');
const B = global.BANCA;
B.ui = B.ui || {};
B.ui._esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
  });
};
B.vnd = function (n) { return String(n || 0); };
B.isApprovedWithTerms = function (d) {
  return ['APPROVED_WITH_CONDITION', 'APPROVED_WITH_LOADING', 'APPROVED_WITH_EXCLUSION'].indexOf(d) >= 0;
};
require('../shared/components/confirm-payment.js');

let pass = 0;
let fail = 0;
function ok(name, condition, detail) {
  if (condition) { pass += 1; console.log('  ✓ ' + name); }
  else { fail += 1; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}
function group(name) { console.log('\n' + name); }
const src = fs.readFileSync(path.join(__dirname, '../modules/application-workspace/app-workspace.js'), 'utf8');

group('1. Shared OTP panel — đầy đủ trạng thái');
const pendingOwner = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'PENDING', customerName: 'Khách A',
  maskedPhone: '09******01', onSend: "sendConfirm()"
});
ok('pending có title và CTA chuẩn', pendingOwner.includes('Xác nhận của khách hàng') && pendingOwner.includes('Chưa gửi') && pendingOwner.includes('Gửi yêu cầu xác nhận'));
const pendingReadOnly = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'PENDING', customerName: 'Khách A',
  maskedPhone: '09******01'
});
ok('read-only pending không có mutation CTA', !pendingReadOnly.includes('<button'));
const sent = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'SENT', customerName: 'Khách A',
  maskedPhone: '09******01', onResend: "resend()"
});
ok('sent có nhãn chờ khách và gửi lại', sent.includes('Đã gửi — chờ khách') && sent.includes('Gửi lại'));
const verified = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'VERIFIED', customerName: 'Khách A',
  maskedPhone: '09******01', confirmedAt: '2026-07-28 10:00'
});
ok('verified có nhãn và timestamp', verified.includes('Đã xác nhận') && verified.includes('2026-07-28 10:00'));
const expired = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'EXPIRED', customerName: 'Khách A',
  maskedPhone: '09******01', onResend: "resend()"
});
ok('expired có recovery CTA', expired.includes('Hết hạn') && expired.includes('Gửi lại yêu cầu xác nhận'));
const blocked = B.ui.otpVerificationPanel({
  mode: 'CUSTOMER_SELF_SERVICE', status: 'PENDING', customerName: 'Khách A',
  maskedPhone: '09******01', blockedReasons: ['Chờ kết quả thẩm định.']
});
ok('blocked nêu lý do bằng chữ', blocked.includes('Chưa thể gửi xác nhận') && blocked.includes('Chờ kết quả thẩm định.'));

group('2. Shared underwriting panel — state isolation');
const stp = B.ui.underwritingStatusPanel({}, {
  state: { underwritingMode: 'STP', underwritingStatus: 'DECIDED', underwritingDecision: 'APPROVED_STP' }
});
ok('STP dùng shared panel', stp.includes('uw-panel') && stp.includes('Chấp thuận tự động'));
ok('STP không lộ requirement/manual block', !stp.includes('Yêu cầu bổ sung') && !stp.includes('req-list'));
const manual = B.ui.underwritingStatusPanel({}, {
  state: { underwritingMode: 'MANUAL_UNDERWRITING', underwritingStatus: 'IN_REVIEW', underwritingDecision: 'NONE' }
});
ok('manual/in-progress có nhãn tiếng Việt', manual.includes('Đang thẩm định') && manual.includes('Thẩm định viên'));
const moreInfo = B.ui.underwritingStatusPanel({}, {
  state: { underwritingMode: 'MANUAL_UNDERWRITING', underwritingStatus: 'NEED_MORE_INFORMATION', underwritingDecision: 'NONE' },
  requirements: [{ label: 'Hồ sơ bệnh án', status: 'PENDING' }]
});
ok('need-more-info render requirement list', moreInfo.includes('Yêu cầu bổ sung') && moreInfo.includes('Hồ sơ bệnh án'));
const conditional = B.ui.underwritingStatusPanel({}, {
  state: { underwritingMode: 'MANUAL_UNDERWRITING', underwritingStatus: 'DECIDED', underwritingDecision: 'APPROVED_WITH_CONDITION' },
  conditions: [{ type: 'Điều kiện', text: 'Theo dõi 30 ngày' }], conditionAccepted: false
});
ok('conditional nêu chờ khách chấp nhận', conditional.includes('Chấp thuận có điều kiện') && conditional.includes('Chờ khách chấp nhận'));
const declined = B.ui.underwritingStatusPanel({ uw: { reason: 'Ngoài phạm vi nhận bảo hiểm' } }, {
  state: { underwritingMode: 'MANUAL_UNDERWRITING', underwritingStatus: 'DECIDED', underwritingDecision: 'DECLINED' }
});
ok('declined có nhãn tiếng Việt và lý do', declined.includes('Từ chối') && declined.includes('Ngoài phạm vi nhận bảo hiểm'));

group('3. Application Workspace adoption');
ok('OTP panel dùng cho Health per-member', src.includes("customerName: u.isChild?(u.guardianName||'Người đại diện chưa được khai báo')") && src.includes('onSend: canSend'));
ok('OTP panel dùng cho general pending/sent/verified/expired', src.includes("const otpSt = cState==='CONFIRMED'?'VERIFIED':cState==='SENT'?'SENT':cState==='EXPIRED'?'EXPIRED':'PENDING'"));
ok('read-only được loại khỏi OTP mutation CTA', src.includes("const canSend=!readOnly&&app.owner===me&&cState==='PENDING'"));
ok('Health UW dùng shared panel theo thành viên', src.includes('const memberPanels =') && src.includes('BANCA.ui.underwritingStatusPanel(app,{'));
ok('IN_UW không map ghi chú vận hành thành điều kiện khách chấp nhận',
  src.includes("const isConditionDecision=['CONDITIONAL','LOADING','EXCLUSION','REDUCED','MEDICAL_EXAM'].includes(uw.decision)") &&
  src.includes('const conditions=isConditionDecision') &&
  src.includes('onSendCondition:(isConditionDecision&&!readOnly'));
ok('need-more-info ưu tiên tài liệu và chỉ fallback nội dung bổ sung đúng trạng thái',
  src.includes('const moreInfoItems=(uw.additionalDocuments&&uw.additionalDocuments.length)') &&
  src.includes(': (isMoreInfoDecision?(uw.conditions||[]).concat(uw.exclusions||[]):[])'));
ok('general/STP UW dùng shared panel', src.includes('const sharedUwPanel=BANCA.ui.underwritingStatusPanel(app,{'));
ok('payment gate không được tái tạo trong patch', src.includes('BANCA.ui.paymentMethodGroup(app, {me:me})') && src.includes('BANCA.paymentEnableRule'));
ok('demo callback vẫn được nhận diện rõ', src.includes('Demo Tools — không thuộc UI production'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
