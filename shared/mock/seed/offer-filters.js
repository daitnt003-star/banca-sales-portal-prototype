// ============================================================
// Quote List filter + lifecycle configuration (§ correction 2026-07-27) — filter/CTA KHÔNG hard-code.
// 5 lifecycle dùng chung QuoteListShell. Scope/lifecycle/status/responsibility/stage/SLA độc lập.
// ============================================================
window.BANCA = window.BANCA || {};

// Data scope (dropdown) — chỉ hiện scope user có quyền.
BANCA.DATA_SCOPES = [
  { id: 'SELF', label: 'Của tôi', unitType: null },
  { id: 'TEAM', label: 'Đội nhóm', unitType: 'TEAM' },
  { id: 'BRANCH', label: 'Chi nhánh', unitType: 'BRANCH' },
  { id: 'REGION', label: 'Khu vực', unitType: 'REGION' }
];

// 5 lifecycle (thứ tự cố định). g5 giữ tương thích URL param.
BANCA.QUOTE_LIFECYCLES = [
  { id: 'PREPARING',        label: 'Đang chuẩn bị',   page: 'unsubmitted-applications', g5: null },
  { id: 'PROCESSING',       label: 'Đang xử lý',      page: 'submitted-applications',   g5: 'PROCESSING' },
  { id: 'CUSTOMER_WAITING', label: 'Chờ khách hàng',  page: 'submitted-applications',   g5: 'WAIT_CUST' },
  { id: 'ISSUED',           label: 'Đã phát hành',    page: 'submitted-applications',   g5: 'ISSUED' },
  { id: 'UNSUCCESSFUL',     label: 'Không thành công', page: 'submitted-applications',  g5: 'FAILED' }
];
BANCA.G5_TO_LIFECYCLE = { PROCESSING: 'PROCESSING', WAIT_CUST: 'CUSTOMER_WAITING', ISSUED: 'ISSUED', FAILED: 'UNSUCCESSFUL' };

// Nhãn stage rút gọn cho PREPARING (list) — không đổi journey engine.
BANCA.PREP_STAGE_LABELS = {
  CUSTOMER_INFO: 'Khách hàng & phương án',
  RISK_OBJECT: 'Đối tượng bảo hiểm',
  INSURED_PARTY: 'Đối tượng bảo hiểm',
  RISK_DECLARATION: 'Khai báo rủi ro',
  PACKAGE_AND_QUOTE: 'Phí & điều kiện',
  DOCUMENTS: 'Tài liệu',
  REVIEW_AND_SUBMIT: 'Kiểm tra & gửi'
};
BANCA.PREP_STAGE_ORDER = ['CUSTOMER_INFO', 'RISK_OBJECT', 'RISK_DECLARATION', 'PACKAGE_AND_QUOTE', 'DOCUMENTS', 'REVIEW_AND_SUBMIT'];

// phase (deriveCaseViewState) → lifecycle. "Chờ phát hành/đang phát hành" thuộc PROCESSING; ISSUED chỉ POLICY_ISSUED.
BANCA.LIFECYCLE_OF_PHASE = {
  UNDERWRITING_PENDING: 'PROCESSING', NEED_MORE_INFORMATION: 'PROCESSING', PAYMENT_PROCESSING: 'PROCESSING',
  POLICY_ISSUING: 'PROCESSING', READY_TO_ISSUE: 'PROCESSING', POLICY_ISSUE_FAILED: 'PROCESSING', PROCESSING: 'PROCESSING',
  CUSTOMER_CONFIRMATION_REQUIRED: 'CUSTOMER_WAITING', PAYMENT_METHOD_REQUIRED: 'CUSTOMER_WAITING',
  PAYMENT_PENDING: 'CUSTOMER_WAITING', PAYMENT_FAILED: 'CUSTOMER_WAITING',
  POLICY_ISSUED: 'ISSUED',
  CANCELLED: 'UNSUCCESSFUL', DECLINED: 'UNSUCCESSFUL'
};
BANCA.lifecycleOf = function (app) {
  var ph = (BANCA.deriveCaseViewState ? BANCA.deriveCaseViewState(app).phase : null);
  return BANCA.LIFECYCLE_OF_PHASE[ph] || 'PROCESSING';
};

// Ai là người phải hành động tiếp theo.
BANCA.nextActor = function (app) {
  var ph = (BANCA.deriveCaseViewState ? BANCA.deriveCaseViewState(app).phase : null);
  if (['NEED_MORE_INFORMATION', 'PAYMENT_METHOD_REQUIRED', 'PAYMENT_FAILED', 'POLICY_ISSUE_FAILED'].indexOf(ph) >= 0) return 'CURRENT_USER';
  if (['CUSTOMER_CONFIRMATION_REQUIRED', 'PAYMENT_PENDING'].indexOf(ph) >= 0) return 'CUSTOMER';
  if (['UNDERWRITING_PENDING', 'PAYMENT_PROCESSING', 'POLICY_ISSUING', 'READY_TO_ISSUE', 'PROCESSING'].indexOf(ph) >= 0) return 'SYSTEM';
  return 'CURRENT_USER';
};

// SLA
BANCA.slaHours = function (app) {
  if (!app || !app.sla) return null;
  return (new Date(String(app.sla).replace(' ', 'T')) - new Date('2026-07-20T15:30:00')) / 3600000;
};
BANCA.isSlaSoon = function (app, h) { var x = BANCA.slaHours(app); return x != null && x <= (h || 24); };
BANCA.isSlaOver = function (app) { var x = BANCA.slaHours(app); return x != null && x < 0; };

// Quick filter mỗi lifecycle (1 hàng chip; chi tiết đẩy vào advanced).
BANCA.OFFER_GROUP_FILTERS = {
  PROCESSING: { filters: [
    { param: 'resp', label: 'Trách nhiệm', options: [
      { v: 'ME', label: 'Cần tôi xử lý', actor: 'CURRENT_USER' },
      { v: 'OTHER', label: 'Chờ bên khác', actorNot: 'CURRENT_USER' },
      { v: 'SLA', label: 'Quá SLA', slaOver: true }
    ] }
  ] },
  WAIT_CUST: { filters: [
    { param: 'cact', label: 'Khách cần làm', options: [
      { v: 'CONFIRM', label: 'Chờ xác nhận', phases: ['CUSTOMER_CONFIRMATION_REQUIRED'] },
      { v: 'OTP', label: 'Chờ OTP', phases: ['CUSTOMER_CONFIRMATION_REQUIRED'] },
      { v: 'PAY', label: 'Chờ thanh toán', phases: ['PAYMENT_METHOD_REQUIRED', 'PAYMENT_PENDING'] },
      { v: 'PAYFAIL', label: 'Thanh toán thất bại', phases: ['PAYMENT_FAILED'] },
      { v: 'EXPIRING', label: 'Sắp hết hạn', sla: true }
    ] }
  ] },
  ISSUED: { filters: [
    { param: 'iss', label: 'Sau phát hành', options: [
      { v: 'NEW', label: 'Mới phát hành', recentIssue: true },
      { v: 'NODOC', label: 'Chưa gửi tài liệu', flagFalse: 'docsSent' },
      { v: 'CBFAIL', label: 'Callback lỗi', flagTrue: 'callbackFailed' }
    ] }
  ] },
  FAILED: { filters: [
    { param: 'fail', label: 'Lý do', options: [
      { v: 'REJECTED', label: 'Bị từ chối', phases: ['DECLINED'] },
      { v: 'CANCELLED', label: 'Đã hủy', phases: ['CANCELLED'] }
    ] }
  ] }
};

BANCA.applyGroupFilters = function (apps, groupId, qs, me) {
  var gf = BANCA.OFFER_GROUP_FILTERS[groupId];
  if (!gf || !gf.filters) return apps;
  gf.filters.forEach(function (f) {
    var val = qs.get(f.param); if (!val) return;
    var opt = (f.options || []).find(function (o) { return o.v === val; }); if (!opt) return;
    apps = apps.filter(function (a) {
      if (opt.actor && BANCA.nextActor(a) !== opt.actor) return false;
      if (opt.actorNot && BANCA.nextActor(a) === opt.actorNot) return false;
      if (opt.phases) { var ph = (BANCA.deriveCaseViewState ? BANCA.deriveCaseViewState(a).phase : null); if (opt.phases.indexOf(ph) < 0) return false; }
      if (opt.sla && !BANCA.isSlaSoon(a)) return false;
      if (opt.slaOver && !BANCA.isSlaOver(a)) return false;
      if (opt.recentIssue && !a.recentlyIssued) return false;
      if (opt.flagFalse && a[opt.flagFalse] !== false) return false;
      if (opt.flagTrue && !a[opt.flagTrue]) return false;
      return true;
    });
  });
  return apps;
};

BANCA.applyUnitFilter = function (apps, unitId) {
  if (!unitId) return apps;
  var u = BANCA.orgUnitById ? BANCA.orgUnitById(unitId) : null; if (!u) return apps;
  var at = u.attrs || {};
  return apps.filter(function (a) {
    var per = (BANCA.personas || {})[a.owner] || {};
    if (at.team && per.team !== at.team) return false;
    if (at.branch && per.branch !== at.branch) return false;
    return true;
  });
};

// Đếm số quote theo từng lifecycle (cho tab count).
BANCA.quoteLifecycleCounts = function (me, scope, unit) {
  function base(state) {
    var list = (scope === 'SELF' || !scope)
      ? (BANCA.myApps ? BANCA.myApps(state).filter(function (a) { return a.owner === me; }) : [])
      : ((BANCA.appsForScope ? BANCA.appsForScope(scope, me) : (BANCA.myApps ? BANCA.myApps(state) : [])).filter(function (a) { return a.submissionState === state; }));
    return BANCA.applyUnitFilter(list, unit);
  }
  var c = { PREPARING: base('NOT_SUBMITTED').length, PROCESSING: 0, CUSTOMER_WAITING: 0, ISSUED: 0, UNSUCCESSFUL: 0 };
  base('SUBMITTED').forEach(function (a) { var lc = BANCA.lifecycleOf(a); if (c[lc] != null) c[lc]++; });
  return c;
};
