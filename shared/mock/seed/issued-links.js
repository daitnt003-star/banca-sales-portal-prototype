// ============================================================
// LINK/QR ĐÃ PHÁT RA NGOÀI — thu hồi khi người phát mất thẩm quyền.
//
// Nền nghiệp vụ  [CII IF1 ch.3 mục F8, tr.96]
//   "It is important that a principal notifies ALL RELEVANT PARTIES when an
//    agency is terminated. THE RULE OF APPARENT AUTHORITY CAN APPLY FOR SOME
//    TIME AFTER TERMINATION and unscrupulous former agents may continue to
//    commit their principal to further agreements. INSURERS MAY FIND THEMSELVES
//    BOUND TO CONTRACTS entered into by an agent who no longer has any authority."
//
//   IF1 3/11 tr.96 Example 3.3 — trung gian cấp cover note VƯỢT hạn mức được
//   uỷ quyền: hợp đồng VẪN CÓ HIỆU LỰC với DNBH vì thẩm quyền biểu kiến;
//   DNBH chỉ được đòi lại từ trung gian SAU ĐÓ.
//
// Vì sao banca không lộ vấn đề này: nhân viên ngân hàng nghỉ việc KHÔNG ràng
// buộc được DNBH — họ chưa từng có thẩm quyền đứng tên riêng, khoá tài khoản
// là đủ. Đại lý bị chấm dứt thì VẪN TRÔNG NHƯ CÒN THẨM QUYỀN với khách bên ngoài.
//
// Trạng thái trước bản vá: RM-IN có status:'INACTIVE' + scopes:[] → chặn ĐĂNG
// NHẬP. Nhưng link thanh toán và link xác nhận đã phát ra ngoài VẪN SỐNG.
//
// [VN] Chế định thẩm quyền biểu kiến của Anh KHÔNG áp thẳng cho Việt Nam.
//      Phải đối chiếu Luật KDBH 2022 và BLDS về đại diện trước khi chốt.
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.ISSUED_LINK_KINDS = {
  PAYMENT_LINK:   {code:'PAYMENT_LINK',   label:'Link thanh toán'},
  CONFIRM_LINK:   {code:'CONFIRM_LINK',   label:'Link xác nhận của khách'},
  QUOTE_QR:       {code:'QUOTE_QR',       label:'Mã QR báo giá'}
};
BANCA.LINK_STATUS = {
  ACTIVE:  {label:'Còn hiệu lực',      cls:'badge-ready'},
  USED:    {label:'Đã sử dụng',        cls:'badge-pending'},
  EXPIRED: {label:'Hết hạn',           cls:'badge-pending'},
  REVOKED: {label:'Đã thu hồi',        cls:'badge-blocked'}
};

BANCA.issuedLinks = BANCA.issuedLinks || [];

// Phát link. Ghi AI PHÁT — không có người phát thì không thu hồi được về sau.
BANCA.issueLink = function (o) {
  o = o || {};
  var rec = {
    id: o.id || ('LNK-' + (BANCA.issuedLinks.length + 1001)),
    kind: o.kind || 'PAYMENT_LINK',
    caseId: o.caseId || null,
    customerRef: o.customerRef || null,
    issuedBy: o.issuedBy || (BANCA.current && BANCA.current()),
    issuedAt: o.issuedAt || new Date().toISOString(),
    expiresAt: o.expiresAt || null,
    status: 'ACTIVE',
    revokedAt: null, revokedReason: null
  };
  BANCA.issuedLinks.push(rec);
  return rec;
};

// Link còn dùng được không. Kiểm CẢ hiệu lực thẩm quyền của NGƯỜI PHÁT
// tại thời điểm dùng — không phải tại thời điểm phát.
BANCA.linkUsable = function (link, opts) {
  opts = opts || {};
  if (!link) return { usable:false, reason:'Link không tồn tại' };
  if (link.status === 'REVOKED') return { usable:false, reason:'Link đã bị thu hồi' + (link.revokedReason ? ' (' + link.revokedReason + ')' : '') };
  if (link.status === 'USED')    return { usable:false, reason:'Link đã được sử dụng' };
  if (link.expiresAt && (opts.now || new Date().toISOString()) > link.expiresAt)
    return { usable:false, reason:'Link đã hết hạn' };
  var issuer = (BANCA.personas || {})[link.issuedBy];
  if (issuer && issuer.status !== 'ACTIVE')
    return { usable:false, reason:'Người phát link không còn hoạt động — link không còn giá trị' };
  return { usable:true, reason:null };
};

// Thu hồi hàng loạt khi chấm dứt người bán. Đây là bước IF1 3/12 gọi là
// "notifies all relevant parties" — làm ở tầng hệ thống thay vì trông chờ con người.
BANCA.revokeLinksOf = function (sellerId, reason) {
  var n = 0;
  (BANCA.issuedLinks || []).forEach(function (l) {
    if (l.issuedBy === sellerId && l.status === 'ACTIVE') {
      l.status = 'REVOKED';
      l.revokedAt = new Date().toISOString();
      l.revokedReason = reason || 'Người phát không còn thẩm quyền';
      n++;
    }
  });
  BANCA.audit && BANCA.audit({ action:'REVOKE_LINKS', seller:sellerId, count:n, reason:reason||null });
  return n;
};

// Chấm dứt người bán = khoá đăng nhập + THU HỒI phương tiện tạo thẩm quyền biểu kiến.
BANCA.deactivateSeller = function (sellerId, reason) {
  var p = (BANCA.personas || {})[sellerId];
  if (!p) return { ok:false, reason:'Không tìm thấy người bán' };
  p.status = 'INACTIVE';
  p.scopes = [];
  p.inactiveSince = (new Date().toISOString()).slice(0, 10);
  var revoked = BANCA.revokeLinksOf(sellerId, reason || 'Chấm dứt người bán');
  return { ok:true, sellerId:sellerId, revokedLinks:revoked };
};

// Seed demo: RM-IN đã nghỉ nhưng link cũ vẫn còn — dựng đúng tình huống IF1 cảnh báo.
(function () {
  if (BANCA.issuedLinks.length) return;
  BANCA.issueLink({ id:'LNK-DEMO-1', kind:'PAYMENT_LINK', caseId:'APP-2026-104', issuedBy:'RM-01', expiresAt:'2026-12-31T23:59:59.000Z' });
  BANCA.issueLink({ id:'LNK-DEMO-2', kind:'CONFIRM_LINK', caseId:'APP-2026-110', issuedBy:'RM-01', expiresAt:'2026-12-31T23:59:59.000Z' });
  BANCA.issueLink({ id:'LNK-DEMO-3', kind:'PAYMENT_LINK', caseId:'APP-2026-113', issuedBy:'RM-IN', expiresAt:'2026-12-31T23:59:59.000Z' });
})();
