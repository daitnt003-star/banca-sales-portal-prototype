// ============================================================
// Offer list filter configuration (§ correction 2026-07-27) — filter/CTA KHÔNG hard-code trong page.
// Scope / lifecycle / detail-status / responsibility / stage / SLA là thuộc tính dữ liệu độc lập.
// Mỗi nhóm lifecycle có 1 bộ quick-filter RIÊNG (không dùng chung 1 danh sách cho mọi tab).
// ============================================================
window.BANCA = window.BANCA || {};

// Data scope (thay 4 tab cứng) — chỉ hiển thị scope user có quyền.
BANCA.DATA_SCOPES = [
  { id: 'SELF', label: 'Của tôi', unitType: null },
  { id: 'TEAM', label: 'Đội nhóm', unitType: 'TEAM' },
  { id: 'BRANCH', label: 'Chi nhánh', unitType: 'BRANCH' },
  { id: 'REGION', label: 'Khu vực', unitType: 'REGION' }
];

// 5 nhóm lifecycle → bộ quick-filter riêng (config-driven). Không tái sử dụng cùng 1 list.
BANCA.OFFER_GROUP_FILTERS = {
  // Đang chuẩn bị → filter theo current journey stage (page render pills từ BANCA.STAGES).
  PREPARING: { kind: 'stage', label: 'Bước hành trình' },

  // Đang xử lý → responsibility + processing status.
  PROCESSING: {
    kind: 'chips', filters: [
      { param: 'resp', label: 'Trách nhiệm', options: [
        { v: 'ME', label: 'Cần tôi xử lý', own: true },
        { v: 'SYSTEM', label: 'Chờ hệ thống / UW', statuses: ['PENDING_UW', 'IN_UW'] }
      ] },
      { param: 'pstatus', label: 'Trạng thái xử lý', options: [
        { v: 'UW', label: 'Thẩm định', statuses: ['PENDING_UW', 'IN_UW', 'UW_DECIDED'] },
        { v: 'SUPPLEMENT', label: 'Cần bổ sung', statuses: ['NEED_MORE_INFO'] }
      ] }
    ]
  },

  // Chờ khách hàng → customer action.
  WAIT_CUST: {
    kind: 'chips', filters: [
      { param: 'cact', label: 'Khách cần làm', options: [
        { v: 'CONFIRM', label: 'Chờ xác nhận (OTP)', statuses: ['PENDING_CUSTOMER_CONFIRM'] },
        { v: 'PAY', label: 'Chờ thanh toán', statuses: ['PAYMENT_METHOD_REQUIRED', 'PENDING_PAYMENT'] }
      ] }
    ]
  },

  // Đã phát hành → issue follow-up.
  ISSUED: {
    kind: 'chips', filters: [
      { param: 'issue', label: 'Phát hành', options: [
        { v: 'PENDING_ISSUE', label: 'Chờ phát hành', statuses: ['PAID', 'PENDING_ISSUE'] },
        { v: 'ISSUED', label: 'Đã phát hành', statuses: ['ISSUED'] }
      ] }
    ]
  },

  // Không thành công → failure reason.
  FAILED: {
    kind: 'chips', filters: [
      { param: 'fail', label: 'Lý do', options: [
        { v: 'REJECTED', label: 'Bị từ chối', statuses: ['REJECTED'] },
        { v: 'CANCELLED', label: 'Đã hủy', statuses: ['CANCELLED'] }
      ] }
    ]
  }
};

// Áp các quick-filter của 1 nhóm lên danh sách app (generic, page không hard-code).
BANCA.applyGroupFilters = function (apps, groupId, qs, me) {
  var gf = BANCA.OFFER_GROUP_FILTERS[groupId];
  if (!gf || !gf.filters) return apps;
  gf.filters.forEach(function (f) {
    var val = qs.get(f.param); if (!val) return;
    var opt = (f.options || []).find(function (o) { return o.v === val; }); if (!opt) return;
    apps = apps.filter(function (a) {
      if (opt.own && a.owner !== me) return false;
      if (opt.statuses && opt.statuses.indexOf(a.status) < 0) return false;
      return true;
    });
  });
  return apps;
};
