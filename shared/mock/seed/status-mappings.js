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

// ============================================================
// §9.2 — RULE DUY NHẤT quyết định có được thanh toán hay không.
// Trả {enabled, reasons:[]} — nút disabled LUÔN kèm lý do đọc được (§15.3, AC11).
// Đọc state từ resolver canonical (caseStates/confirmationComplete) để KHÔNG tạo
// nhánh suy luận trạng thái thứ hai. deriveCaseViewState gọi lại hàm này
// → 1 cổng gate, dùng chung Motor/Health/mọi màn hình.
// ============================================================
BANCA.paymentEnableRule = function (app, opts) {
  app = app || {}; opts = opts || {};
  var s = BANCA.caseStates ? BANCA.caseStates(app) : {};
  var reasons = [];

  // 1. Quyền sở hữu case + phải còn ít nhất MỘT cách thanh toán khả dụng (§17).
  // Thiếu quyền thu hộ chỉ khoá phương thức "RM/Đại lý thu hộ"; QR và link thanh toán là
  // khách tự trả nên vẫn phải dùng được — không khoá toàn bộ bước thanh toán.
  var me = opts.me || (BANCA.current && BANCA.current());
  if (app.owner && me && app.owner !== me) reasons.push('Chỉ nhân viên phụ trách case được khởi tạo thanh toán');
  var rd = (opts.readiness !== undefined) ? opts.readiness
    : (BANCA.readinessFor ? BANCA.readinessFor(app.productId, me) : null);
  if (BANCA.paymentMethodsFor) {
    var mopts = { me: me };
    if (opts.readiness !== undefined) mopts.readiness = opts.readiness;
    var methods = BANCA.paymentMethodsFor(app, mopts);
    var usable = methods.filter(function (m) { return !m.blockedReason; });
    if (!methods.length) reasons.push('Sản phẩm chưa được cấu hình cách thanh toán');
    else if (!usable.length) {
      reasons.push('Bạn không có cách thanh toán khả dụng cho sản phẩm này' + (rd && rd.reason ? ' (' + rd.reason + ')' : ''));
    }
  } else {
    // Fail-safe: thiếu cấu hình phương thức → khoá kèm lý do, không mở nhầm.
    reasons.push('Chưa nạp cấu hình cách thanh toán');
  }

  // 2. Kết quả thẩm định phải thuộc nhóm cho phép.
  var dec = s.underwritingDecision;
  var uwOk = BANCA.isApprovedDecision ? BANCA.isApprovedDecision(dec)
    : ['APPROVED', 'APPROVED_STP', 'APPROVED_WITH_CONDITION'].indexOf(dec) >= 0;
  if (s.underwritingStatus === 'NEED_MORE_INFORMATION') reasons.push('Cần bổ sung thông tin/tài liệu trước khi thanh toán');
  else if (dec === 'DECLINED') reasons.push('Hồ sơ đã bị từ chối thẩm định');
  else if (!uwOk) reasons.push(s.underwritingStatus === 'NOT_STARTED' ? 'Hồ sơ chưa được thẩm định' : 'Thẩm định đang xử lý');

  // 3. Xác nhận khách hàng (OTP / điều kiện–loại trừ). Health: theo từng thành viên.
  if (uwOk && !(BANCA.confirmationComplete && BANCA.confirmationComplete(app))) {
    if (app.productId === 'health' && Array.isArray(app.insuredMembers)) {
      var miss = app.insuredMembers.filter(function (m) {
        return m.active !== false && (m.confirmation || {}).status !== 'CONFIRMED';
      }).map(function (m) { return m.name || '—'; });
      if (miss.length) reasons.push('Còn ' + miss.length + ' người được bảo hiểm chưa xác nhận (' + miss.join(', ') + ')');
      else reasons.push('Khách chưa xác nhận');
    } else if (BANCA.isApprovedWithTerms && BANCA.isApprovedWithTerms(dec)) {
      reasons.push('Khách chưa xác nhận điều kiện/phụ phí/loại trừ sau thẩm định');
    } else {
      reasons.push('Khách chưa xác nhận (OTP)');
    }
  }

  // 4. Báo giá còn hiệu lực + version hiện tại đã duyệt (§8.3).
  var amount = BANCA._payAmount ? BANCA._payAmount(app) : 0;
  var q = app.quote || {};
  if (['EXPIRED', 'INVALID'].indexOf(q.quoteStatus) >= 0 || app.quoteExpired) reasons.push('Báo giá đã hết hạn — cần tính phí lại');
  if (!amount) reasons.push('Chưa có số phí hợp lệ để thu');
  // Version hiện tại phải ở trạng thái APPROVED. Ưu tiên đọc TRỰC TIẾP từ model version
  // (nguồn sự thật) thay vì cờ rời, để re-rate không thể lọt qua cổng.
  var av = BANCA.quoteVersion ? BANCA.quoteVersion.active(app) : null;
  if (av) {
    if (av.status === 'SUPERSEDED') reasons.push('Phiên báo giá hiện tại đã bị thay thế — cần dùng phiên mới nhất');
    else if (av.status !== 'APPROVED') reasons.push('Phiên báo giá hiện tại chưa được duyệt');
  } else if (app.activeQuoteApproved === false) {
    reasons.push('Phiên báo giá hiện tại chưa được duyệt');
  }

  // 5. Tài liệu bắt buộc.
  if (app.missingRequiredDocument) reasons.push('Thiếu tài liệu bắt buộc');

  // 6. Không thanh toán 2 lần / đang có phiên chạy (§17).
  if (s.paymentStatus === 'SUCCESS') reasons.push('Yêu cầu đã thanh toán thành công');
  else if (['PENDING', 'PROCESSING'].indexOf(s.paymentStatus) >= 0) reasons.push('Đang có phiên thanh toán chờ xử lý');

  // 7. Case đã đóng.
  if (s.applicationStatus === 'CANCELLED') reasons.push('Yêu cầu đã hủy');

  return { enabled: reasons.length === 0, reasons: reasons };
};
