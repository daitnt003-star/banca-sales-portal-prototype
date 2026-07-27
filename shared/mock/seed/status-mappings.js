// ============================================================
// Central status mapping (§8.2 + §16 + §19.1) — 1 nguồn sự thật cho status.
// 16 quote status → 5 nhóm hiển thị. Dashboard/List/Detail đọc CHUNG map này
// → cùng màu/label/icon ở mọi nơi. Kèm rule enable payment (§9.2).
// ============================================================
window.BANCA = window.BANCA || {};

// 5 nhóm hiển thị (§8.2)
BANCA.QUOTE_STATUS_GROUPS = [
  { id: 'PREPARING',  label: 'Đang chuẩn bị',   cls: 'grp-preparing' },
  { id: 'PROCESSING', label: 'Đang xử lý',      cls: 'grp-processing' },
  { id: 'WAIT_CUST',  label: 'Chờ khách hàng',  cls: 'grp-wait' },
  { id: 'ISSUED',     label: 'Đã phát hành',    cls: 'grp-issued' },
  { id: 'FAILED',     label: 'Không thành công', cls: 'grp-failed' }
];

// 16 status trung tâm → group + màu (cls tái dùng badge hiện có).
BANCA.QUOTE_STATUS = {
  DRAFT:                        { label: 'Nháp',                     group: 'PREPARING',  cls: 'badge-pending', icon: '✏️' },
  INFORMATION_INCOMPLETE:       { label: 'Thiếu thông tin',          group: 'PREPARING',  cls: 'badge-blocked', icon: '⚠️' },
  DOCUMENT_PENDING:             { label: 'Chờ tài liệu',             group: 'PREPARING',  cls: 'badge-blocked', icon: '📎' },

  UW_PENDING:                   { label: 'Chờ thẩm định',            group: 'PROCESSING', cls: 'badge-conditional', icon: '🔎' },
  MORE_INFORMATION_REQUIRED:    { label: 'Cần bổ sung',              group: 'PROCESSING', cls: 'badge-blocked', icon: '📝' },
  APPROVED:                     { label: 'Đã duyệt',                 group: 'PROCESSING', cls: 'badge-ready', icon: '✅' },
  APPROVED_WITH_CONDITION:      { label: 'Duyệt có điều kiện',       group: 'PROCESSING', cls: 'badge-conditional', icon: '⚖️' },
  DECLINED:                     { label: 'Từ chối',                  group: 'PROCESSING', cls: 'badge-blocked', icon: '⛔' },

  CUSTOMER_CONFIRMATION_PENDING:{ label: 'Chờ khách xác nhận',       group: 'WAIT_CUST',  cls: 'badge-conditional', icon: '📲' },
  CUSTOMER_CONFIRMED:           { label: 'Khách đã xác nhận',        group: 'WAIT_CUST',  cls: 'badge-ready', icon: '👍' },
  PAYMENT_PENDING:              { label: 'Chờ thanh toán',           group: 'WAIT_CUST',  cls: 'badge-conditional', icon: '💳' },
  PAYMENT_FAILED:               { label: 'Thanh toán thất bại',      group: 'WAIT_CUST',  cls: 'badge-blocked', icon: '❌' },

  ISSUED:                       { label: 'Đã phát hành',             group: 'ISSUED',     cls: 'badge-ready', icon: '📄' },

  EXPIRED:                      { label: 'Hết hạn',                  group: 'FAILED',     cls: 'badge-pending', icon: '⏰' },
  CANCELLED:                    { label: 'Đã hủy',                   group: 'FAILED',     cls: 'badge-blocked', icon: '🚫' },
  SUPERSEDED:                   { label: 'Bị thay thế',              group: 'FAILED',     cls: 'badge-pending', icon: '🔁' }
};

BANCA.quoteStatus = function (s) { return BANCA.QUOTE_STATUS[s] || { label: s, group: 'PREPARING', cls: 'badge-pending', icon: '' }; };
BANCA.quoteGroupOf = function (s) { return BANCA.quoteStatus(s).group; };
BANCA.quoteGroupLabel = function (g) { return (BANCA.QUOTE_STATUS_GROUPS.find(function (x) { return x.id === g; }) || {}).label || g; };

// UW mode (§9.1)
BANCA.UW_MODES = ['STRAIGHT_THROUGH', 'MANUAL_UNDERWRITING', 'MORE_INFORMATION_REQUIRED', 'APPROVED_WITH_CONDITION', 'DECLINED'];

// §9.2 — rule enable payment. Trả {enabled, reasons:[]} để nút disabled luôn có lý do (§15.3).
BANCA.paymentEnableRule = function (app, seller) {
  app = app || {}; seller = seller || {};
  var reasons = [];
  if (app.customerConfirmation !== 'VERIFIED') reasons.push('Khách chưa xác nhận OTP');
  var uwOk = ['APPROVED', 'APPROVED_WITH_CONDITION', 'STRAIGHT_THROUGH'].indexOf(app.underwritingResult) >= 0;
  if (!uwOk) {
    if (app.underwritingResult === 'UW_PENDING') reasons.push('Thẩm định đang xử lý');
    else if (app.underwritingResult === 'MORE_INFORMATION_REQUIRED') reasons.push('Cần bổ sung thông tin/tài liệu');
    else if (app.underwritingResult === 'DECLINED') reasons.push('Hồ sơ đã bị từ chối');
    else reasons.push('Chưa có kết quả thẩm định hợp lệ');
  }
  if (app.underwritingResult === 'APPROVED_WITH_CONDITION' && !app.conditionAccepted) reasons.push('Khách chưa xác nhận điều kiện/loại trừ');
  if (app.quoteExpired) reasons.push('Báo giá đã hết hạn');
  if (app.activeQuoteApproved === false) reasons.push('Phiên báo giá hiện tại chưa được duyệt');
  if (app.missingRequiredDocument) reasons.push('Thiếu tài liệu bắt buộc');
  if (app.paymentStatus === 'SUCCESS') reasons.push('Đã thanh toán thành công');
  if (seller.can_collect_payment === false) reasons.push('Bạn không có quyền thu hộ');
  return { enabled: reasons.length === 0, reasons: reasons };
};
