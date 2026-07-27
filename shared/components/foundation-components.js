// ============================================================
// Foundation render helpers (§14 §3.2) — component DÙNG CHUNG, khác nhau qua props/variant.
// Trả về HTML string; page nhúng vào chỗ cần. KHÔNG clone theo tên sản phẩm.
// Cung cấp: CustomerContextCard, DataSourceBadge, ConsentStatus,
// SensitiveDataNotice, ChannelSwitcher, StatusBadge (nâng cấp central).
// ============================================================
window.BANCA = window.BANCA || {};
BANCA.ui = BANCA.ui || {};

function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
BANCA.ui._esc = _esc;

// --- StatusBadge (central §19.1) — dùng chung Dashboard/List/Detail ---
BANCA.ui.statusBadge = function (statusKey) {
  var s = (BANCA.quoteStatus && BANCA.quoteStatus(statusKey)) || { label: statusKey, cls: 'badge-pending', icon: '' };
  return '<span class="badge ' + s.cls + '" data-status="' + _esc(statusKey) + '">' +
    (s.icon ? '<span class="badge-ic">' + s.icon + '</span> ' : '') + _esc(s.label) + '</span>';
};

// --- DataSourceBadge (§4.2) ---
BANCA.ui.dataSourceBadge = function (source) {
  var m = (BANCA.DATA_SOURCES && BANCA.DATA_SOURCES[source]) || { label: source, cls: 'src-portal' };
  return '<span class="src-badge ' + m.cls + '" title="Nguồn: ' + _esc(m.label) + '">' + _esc(m.label) + '</span>';
};

// --- SensitiveDataNotice (§4.2 anonymous) ---
BANCA.ui.sensitiveDataNotice = function (customerRef) {
  return '<div class="sensitive-notice">' +
    '<div class="sn-row"><span class="sn-k">Khách hàng tham chiếu</span><span class="sn-v mono">' + _esc(customerRef || '—') + '</span></div>' +
    '<div class="sn-lock">🔒 Dữ liệu định danh chưa được chia sẻ</div>' +
    '<div class="sn-hint">Thông tin khách hàng chỉ được lấy sau khi khách hàng đồng ý</div>' +
    '</div>';
};

// --- ConsentStatus (§4.2) ---
BANCA.ui.consentStatus = function (ctx) {
  ctx = ctx || {};
  if (ctx.consent && ctx.consent.grantedAt) {
    var d = new Date(ctx.consent.grantedAt);
    return '<div class="consent-status granted">✅ Khách đã đồng ý chia sẻ dữ liệu ' +
      '<span class="cs-meta">(' + _esc(ctx.consent.version) + ' · ' + d.toLocaleString('vi-VN') + ')</span></div>';
  }
  return '<div class="consent-status pending">⏳ Chờ khách đồng ý chia sẻ dữ liệu</div>';
};

// --- CustomerContextCard (§4.2) variants: anonymous | identified | bank-prefilled | manually-entered ---
BANCA.ui.customerContextCard = function (ctx) {
  ctx = ctx || {};
  var stage = ctx.dataAccessStage || 'ANONYMOUS_CONTEXT';
  var showPII = BANCA.dataAccess ? BANCA.dataAccess.canShowPII(stage) : false;
  var head = '<div class="cc-head"><span class="cc-title">Khách hàng</span>' +
    '<span class="cc-stage stage-' + _esc(stage.toLowerCase()) + '">' +
    _esc((BANCA.DATA_ACCESS_STAGES[stage] || {}).label || stage) + '</span></div>';
  var body;
  if (!showPII) {
    // Anonymous — chỉ context nghiệp vụ, KHÔNG PII, KHÔNG tên giả.
    body = BANCA.ui.sensitiveDataNotice(ctx.customerRef || ctx.externalCustomerRef) +
      '<div class="cc-ctx">' +
      (ctx.ageBand ? BANCA.ui._kv('Nhóm tuổi', ctx.ageBand) : '') +
      (ctx.incomeBand ? BANCA.ui._kv('Thu nhập', ctx.incomeBand) : '') +
      (ctx.loanType ? BANCA.ui._kv('Loại khoản vay', ctx.loanType) : '') +
      (ctx.loanAmount ? BANCA.ui._kv('Số tiền vay', ctx.loanAmount) : '') +
      (ctx.insuranceNeed ? BANCA.ui._kv('Nhu cầu', ctx.insuranceNeed) : '') +
      '</div>' + BANCA.ui.consentStatus(ctx);
  } else {
    // Identified — hiện PII + DataSourceBadge từng field.
    var flds = (ctx.piiFields) || {};
    body = '<div class="cc-pii">' +
      BANCA.ui._piiRow('Họ tên', flds.fullName) +
      BANCA.ui._piiRow('Số điện thoại', flds.phone) +
      BANCA.ui._piiRow('Email', flds.email) +
      BANCA.ui._piiRow('CCCD', flds.nationalId) +
      '</div>' + BANCA.ui.consentStatus(ctx);
  }
  return '<div class="customer-context-card variant-' + (showPII ? 'identified' : 'anonymous') + '">' + head + body + '</div>';
};
BANCA.ui._kv = function (k, v) { return '<div class="cc-row"><span class="cc-k">' + _esc(k) + '</span><span class="cc-v">' + _esc(v) + '</span></div>'; };
BANCA.ui._piiRow = function (k, f) {
  f = f || {};
  return '<div class="cc-row"><span class="cc-k">' + _esc(k) + '</span><span class="cc-v">' +
    _esc(f.value) + ' ' + (f.source ? BANCA.ui.dataSourceBadge(f.source) : '') +
    (f.readonly ? '<span class="ro-tag">chỉ đọc</span>' : '') + '</span></div>';
};

// --- ChannelSwitcher (demo switch §4.1) — switch account Banca ↔ Agent ---
BANCA.ui.channelSwitcher = function () {
  var cur = BANCA.channel();
  var opts = BANCA.CHANNEL_ENUM.map(function (id) {
    var p = BANCA.CHANNEL_PROFILES[id];
    return '<option value="' + id + '"' + (id === cur ? ' selected' : '') + '>' + _esc(p.short) + '</option>';
  }).join('');
  return '<label class="channel-switcher">Channel: <select onchange="BANCA.setChannel(this.value)">' + opts + '</select></label>';
};

// --- Phase 2 hooks: data-access stage resolver + consent action (§4.2) ---
// Stage của 1 application: ưu tiên field đã lưu, fallback theo channel profile.
BANCA.appDataAccessStage = function (app) {
  app = app || {};
  if (app.dataAccessStage) return app.dataAccessStage;
  // (correction 2026-07-27) Grant từ nguồn (ngân hàng/khách) → IDENTIFIED ngay (thao tác hệ thống).
  if (app.dataSharingGrantStatus && BANCA.stageFromGrant) return BANCA.stageFromGrant(app.dataSharingGrantStatus);
  // Anonymous CHỈ khi phiên chưa định danh (Quick Advice) đánh dấu tường minh.
  if (app.anonymousEntry) return 'ANONYMOUS_CONTEXT';
  return 'IDENTIFIED_CONTEXT';
};
// Thao tác HỆ THỐNG: khi đã IDENTIFIED mà chưa có PII → tự prefill từ nguồn (không phải bước seller, không reload).
BANCA.ensureIdentifiedPrefill = function (app) {
  if (!app || app.piiFields) return app;
  if (BANCA.appIsAnonymous(app)) return app;
  var ref = app.externalCustomerRef || app.customerId || (app.sourceReference && app.sourceReference.externalCustomerId);
  if (!ref || !BANCA.fetchCustomerPII) return app;
  var pii = BANCA.fetchCustomerPII(ref);
  app.piiFields = pii.fields;
  if (!app.customerName && pii.fields.fullName) app.customerName = pii.fields.fullName.value;
  // Đồng bộ customerId với record đã match để form Section 2 (customerById) resolve đúng, không hiện "Khách hàng mới".
  if (pii.externalCustomerRef && (!app.customerId || app.customerId !== pii.externalCustomerRef)) {
    var matched = (BANCA.customers || []).find(function (c) { return c.id === pii.externalCustomerRef; });
    if (matched) app.customerId = matched.id;
  }
  app.dataSourceOrigin = pii.source;
  return app;
};
BANCA.appIsAnonymous = function (app) { return !BANCA.dataAccess.canShowPII(BANCA.appDataAccessStage(app)); };

// Khách đồng ý chia sẻ dữ liệu → fetch PII → IDENTIFIED_CONTEXT → persist → reload.
BANCA.grantConsent = function (appId) {
  var apps = (BANCA.applications || []);
  var app = apps.find(function (a) { return a.id === appId; }) || {};
  var ref = app.externalCustomerRef || app.customerId || (app.sourceReference && app.sourceReference.externalCustomerId) || appId;
  var pii = BANCA.fetchCustomerPII(ref);
  var patch = {
    dataAccessStage: 'IDENTIFIED_CONTEXT',
    consent: { version: 'CONSENT_BANCA_v1', grantedAt: new Date().toISOString(), channel: BANCA.channel() },
    piiFields: pii.fields,
    customerName: (pii.fields.fullName && pii.fields.fullName.value) || app.customerName || null
  };
  if (BANCA.patchApp) BANCA.patchApp(appId, patch);
  if (typeof location !== 'undefined') location.reload();
};

// Banner consent dùng chung (anonymous context + CTA đồng ý). Chỉ hiện khi anonymous.
BANCA.ui.consentGate = function (app) {
  if (!BANCA.appIsAnonymous(app)) return '';
  var ctx = {
    customerRef: app.externalCustomerRef || app.customerId || app.id,
    dataAccessStage: 'ANONYMOUS_CONTEXT',
    ageBand: app.ageBand, incomeBand: app.incomeBand,
    loanType: app.loanType || (app.adviceNeed ? null : null),
    loanAmount: app.loanAmount, insuranceNeed: app.insuranceNeed || app.adviceNeed
  };
  return '<div class="card consent-gate" style="margin-bottom:14px;border-left:4px solid var(--amber-600);">' +
    BANCA.ui.customerContextCard(ctx) +
    '<button class="btn btn-primary" style="margin-top:12px;" onclick="BANCA.grantConsent(\'' + _esc(app.id) + '\')">Khách đồng ý chia sẻ dữ liệu → lấy thông tin</button>' +
    '</div>';
};

// ============================================================
// OFFER_CONTEXT step (correction 2026-07-27 §2) — "Ngữ cảnh & phương án bảo hiểm".
// 1 STEP trong journey (không phải popup). Part A context bank-prefill + Part B recommendation
// tới cấp package. Dùng cùng component embed/new-tab (khác layout variant qua CSS).
// ============================================================
BANCA.ui.offerContextStep = function (app, opts) {
  app = app || {}; opts = opts || {};
  var e = _esc;
  var pii = app.piiFields || {};
  var identified = !BANCA.appIsAnonymous(app);
  // Part A — Ngữ cảnh khách hàng (bank prefill, read-only + DataSourceBadge)
  function row(k, v, source, ro) {
    if (v == null || v === '') return '';
    return '<div class="oc-row"><span class="oc-k">' + e(k) + '</span><span class="oc-v">' + e(v) +
      (source ? ' ' + BANCA.ui.dataSourceBadge(source) : '') + (ro ? '<span class="ro-tag">chỉ đọc</span>' : '') + '</span></div>';
  }
  var name = identified ? ((pii.fullName && pii.fullName.value) || app.customerName || '—') : ('🔒 ' + (app.externalCustomerRef || app.customerId || app.id));
  var partA = '<div class="oc-panel"><div class="oc-title">A · Ngữ cảnh khách hàng</div>' +
    row('Khách hàng', name, identified ? 'BANK' : null, true) +
    row('CIF / Mã tham chiếu', app.cif || app.externalCustomerRef || app.customerId, 'BANK', true) +
    row('Phân khúc', app.segment, 'BANK', true) +
    row('Chi nhánh', app.branch, 'BANK', true) +
    row('RM phụ trách', app.rm || app.owner, 'BANK', true) +
    row('Loại nhu cầu', app.insuranceNeed || (BANCA.needLabel ? BANCA.needLabel(app.adviceNeed) : app.adviceNeed), 'BANK') +
    row('Khoản vay', app.loanType, 'BANK', true) +
    row('Số tiền vay', app.loanAmount && BANCA.vnd ? BANCA.vnd(app.loanAmount) : app.loanAmount, 'BANK', true) +
    row('Kỳ hạn vay', app.loanTerm, 'BANK', true) +
    row('Tài sản liên quan', app.relatedAsset, 'BANK', true) +
    (app.recommendReason ? '<div class="oc-why">💡 ' + e(app.recommendReason) + '</div>' : '') +
    '</div>';

  // Part B — Sản phẩm & package đề nghị (preselect nếu bank truyền; productLocked xử lý)
  var locked = !!app.productLocked;
  var prem = app.estimatedPremium || (app.quote && (app.quote.adjustedPremium || app.quote.premium));
  var offer = '<div class="oc-offer selected">' +
    '<div class="oc-offer-head"><span class="oc-badge-primary">Phương án đề nghị</span>' +
    (opts.readiness ? '<span class="chip">' + e(opts.readiness) + '</span>' : '') + '</div>' +
    '<div class="oc-prod">' + e(app.productName || 'Sản phẩm') + (app.package ? ' · <b>' + e(app.package) + '</b>' : '') + '</div>' +
    (prem ? '<div class="oc-prem">Phí ước tính: <b>' + e(BANCA.vnd ? BANCA.vnd(prem) : prem) + '</b></div>' : '') +
    (app.recommendReason ? '<div class="oc-reason">Lý do phù hợp: ' + e(app.recommendReason) + '</div>' : '') +
    (opts.benefits ? '<ul class="oc-benefits">' + opts.benefits.map(function (b) { return '<li>' + e(b) + '</li>'; }).join('') + '</ul>' : '') +
    (opts.verifyNote ? '<div class="oc-verify">⚠️ Cần xác minh: ' + e(opts.verifyNote) + '</div>' : '') +
    '</div>';
  var alts = (locked || !opts.alternatives || !opts.alternatives.length) ? '' :
    '<details class="oc-alts"><summary>Xem phương án khác (' + opts.alternatives.length + ') · So sánh</summary>' +
    opts.alternatives.map(function (a) { return '<div class="oc-alt">' + e(a.name) + (a.premium ? ' · ' + e(BANCA.vnd ? BANCA.vnd(a.premium) : a.premium) : '') + '</div>'; }).join('') + '</details>';
  var lockNote = locked ? '<div class="oc-lock">🔒 Sản phẩm đã được khóa từ hệ thống nguồn — không đổi phương án.</div>' : '';

  var partB = '<div class="oc-panel"><div class="oc-title">B · Sản phẩm & phương án đề nghị</div>' + offer + lockNote + alts + '</div>';

  var cta = opts.nextHref ? '<div class="oc-actions"><a class="btn btn-primary" href="' + e(opts.nextHref) + '">Chọn phương án & tiếp tục →</a></div>' : '';
  return '<div class="offer-context-step">' + partA + partB + cta + '</div>';
};

// --- BancaOfferGroupBar (§8.1/§8.2) — "Bản chào" là 1 object, 5 nhóm status hiển thị ---
// Nhóm 1 (Đang chuẩn bị) = danh sách chưa nộp; 4 nhóm còn lại = đã nộp lọc theo g5.
BANCA.ui.offerGroupBar = function (activeGroup, r) {
  r = r || '';
  var groups = [
    { id: 'PREPARING', label: 'Đang chuẩn bị', href: r + 'modules/unsubmitted-applications/index.html' },
    { id: 'PROCESSING', label: 'Đang xử lý', href: r + 'modules/submitted-applications/index.html?g5=PROCESSING' },
    { id: 'WAIT_CUST', label: 'Chờ khách hàng', href: r + 'modules/submitted-applications/index.html?g5=WAIT_CUST' },
    { id: 'ISSUED', label: 'Đã phát hành', href: r + 'modules/submitted-applications/index.html?g5=ISSUED' },
    { id: 'FAILED', label: 'Không thành công', href: r + 'modules/submitted-applications/index.html?g5=FAILED' }
  ];
  return '<div class="offer-group-bar">' + groups.map(function (g) {
    var on = g.id === activeGroup;
    return '<a href="' + g.href + '" class="ogb-tab' + (on ? ' on' : '') + '">' + g.label + '</a>';
  }).join('') + '</div>';
};
// Map nhóm hiển thị 5-group → nhóm nội bộ APP_STATUS của trang đã nộp.
BANCA.OFFER_G5_MAP = {
  PROCESSING: ['UW', 'SUPPLEMENT'],
  WAIT_CUST: ['CONFIRM', 'PAYMENT'],
  ISSUED: ['ISSUE', 'DONE'],
  FAILED: ['FAILED']
};

// --- DataScopeSelector (§ correction 2026-07-27) — bộ CHỌN PHẠM VI DỮ LIỆU, không phải nav tab ---
// Chỉ hiện scope user có quyền; scope quản lý nhiều đơn vị → kèm unit selector.
BANCA.ui.dataScopeSelector = function (me, activeScope, activeUnit, r) {
  r = r || '';
  var avail = (BANCA.availableScopes ? BANCA.availableScopes(me) : ['SELF']);
  if (avail.indexOf('SELF') < 0) avail = ['SELF'].concat(avail);
  var defs = (BANCA.DATA_SCOPES || []).filter(function (d) { return avail.indexOf(d.id) >= 0; });
  function href(scope, unit) {
    var o = new URLSearchParams(location.search);
    if (scope === 'SELF') o.delete('scope'); else o.set('scope', scope);
    o.delete('unit'); if (unit) o.set('unit', unit);
    return '?' + o.toString();
  }
  // AC01 — scope là DROPDOWN (không còn 4 tab ngang).
  var scopeSel = '<label class="dss-field"><span class="dss-label">Phạm vi</span>' +
    '<select class="dss-select" onchange="(function(v){var o=new URLSearchParams(location.search); if(v===\'SELF\')o.delete(\'scope\'); else o.set(\'scope\',v); o.delete(\'unit\'); location.search=o.toString();})(this.value)">' +
    defs.map(function (d) { return '<option value="' + d.id + '"' + (d.id === activeScope ? ' selected' : '') + '>' + _esc(d.label) + '</option>'; }).join('') +
    '</select></label>';
  // OrganizationUnitSelector khi scope quản nhiều đơn vị.
  var unitSel = '';
  var cur = (BANCA.DATA_SCOPES || []).find(function (d) { return d.id === activeScope; });
  if (cur && cur.unitType) {
    var units = (BANCA.ORG_UNITS || []).filter(function (u) { return u.type === cur.unitType; });
    if (units.length > 1) {
      unitSel = '<label class="dss-field"><span class="dss-label">Đơn vị</span>' +
        '<select class="dss-select" onchange="(function(v){var o=new URLSearchParams(location.search); if(v)o.set(\'unit\',v); else o.delete(\'unit\'); location.search=o.toString();})(this.value)">' +
        '<option value="">Tất cả ' + _esc((BANCA.orgUnitLabelType ? BANCA.orgUnitLabelType(cur.unitType) : cur.unitType)).toLowerCase() + '</option>' +
        units.map(function (u) { return '<option value="' + u.id + '"' + (u.id === activeUnit ? ' selected' : '') + '>' + _esc(u.name) + '</option>'; }).join('') +
        '</select></label>';
    }
  }
  return '<div class="data-scope-selector">' + scopeSel + unitSel + '</div>';
};
// Lọc theo đơn vị đã chọn (khớp branch/team của owner).
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

// --- offerQuickFilters (§ correction) — render bộ quick-filter RIÊNG theo nhóm lifecycle từ config ---
BANCA.ui.offerQuickFilters = function (groupId, qs, r) {
  var gf = (BANCA.OFFER_GROUP_FILTERS || {})[groupId];
  if (!gf || !gf.filters) return '';
  function href(param, v) {
    var o = new URLSearchParams(location.search);
    if (v == null || o.get(param) === v) o.delete(param); else o.set(param, v);
    return '?' + o.toString();
  }
  function clearHref(param) { var o = new URLSearchParams(location.search); o.delete(param); return '?' + o.toString(); }
  return '<div class="offer-quick-filters">' + gf.filters.map(function (f) {
    var cur = qs.get(f.param);
    var all = '<a href="' + clearHref(f.param) + '" class="oqf-chip' + (!cur ? ' on' : '') + '">Tất cả</a>';
    return '<div class="oqf-row"><span class="oqf-label">' + _esc(f.label) + ':</span>' + all +
      f.options.map(function (o) {
        var on = cur === o.v;
        return '<a href="' + href(f.param, o.v) + '" class="oqf-chip' + (on ? ' on' : '') + '">' + _esc(o.label) + '</a>';
      }).join('') + '</div>';
  }).join('') + '</div>';
};

// --- Formatters (§ correction AC09) — ngày dd/MM/yyyy · HH:mm, tiền x.xxx.xxx ₫, không xuống dòng vụn ---
BANCA.fmtDateTime = function (v) {
  if (!v) return '—';
  var d = (v instanceof Date) ? v : new Date(String(v).replace(' ', 'T'));
  if (isNaN(d)) return String(v);
  var p = function (n) { return (n < 10 ? '0' : '') + n; };
  return '<span class="nowrap">' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes()) + '</span>';
};
BANCA.money = function (n) {
  var s = (BANCA.vnd ? BANCA.vnd(n) : ((n || 0).toLocaleString('vi-VN') + ' ₫'));
  return '<span class="nowrap">' + s + '</span>';
};

// --- Task-oriented cells (§ correction AC04/AC06/AC07) ---
// Cột "Khách cần thực hiện": status badge (central) + mô tả ngắn (gộp Việc cần làm/Trạng thái/điều kiện UW).
BANCA.ui.customerTaskCell = function (app) {
  var v = BANCA.deriveCaseViewState ? BANCA.deriveCaseViewState(app) : {};
  var badge = BANCA.caseStatusBadge ? BANCA.caseStatusBadge(app) : '';
  var desc = v.nextActionLabel || '';
  // Điều kiện thẩm định cần KHÁCH chấp nhận → đưa vào cột này (không cột KQ thẩm định riêng).
  if (app.uw && app.uw.decision === 'APPROVED_WITH_CONDITION') desc += (desc ? ' · ' : '') + 'có điều kiện/loại trừ cần khách chấp nhận';
  return '<div class="task-cell">' + badge + (desc ? '<span class="task-desc">' + _esc(desc) + '</span>' : '') + '</div>';
};
// CTA sinh từ nextAction; PRIMARY chỉ khi nextActor = CURRENT_USER (AC). Không cho seller xác nhận thay khách.
BANCA.ui.offerCta = function (app) {
  // Draft (chưa nộp) → seller tiếp tục hoàn thiện (primary).
  if (app.submissionState === 'NOT_SUBMITTED') {
    var warn = (app.warnings || []).some(function (w) { return ['QUOTE_EXPIRING', 'QUOTE_NEED_RERATE'].indexOf(w) >= 0; });
    return { label: warn ? 'Tính phí lại' : 'Tiếp tục', tab: null, primary: true };
  }
  var v = BANCA.deriveCaseViewState ? BANCA.deriveCaseViewState(app) : {};
  var pa = v.primaryAction || { label: 'Mở', tab: 'overview', key: 'open' };
  var label = pa.label, tab = pa.tab || 'overview', key = pa.key;
  if (key === 'confirm') { label = (app.confirm && app.confirm.requested) ? 'Theo dõi xác nhận' : 'Gửi yêu cầu xác nhận'; tab = 'confirm'; }
  if (key === 'retryPay') { label = 'Gửi lại thanh toán'; }
  if (key === 'viewPolicy') { label = 'Xem hợp đồng'; }
  // View/track = terminal/secondary; primary chỉ khi user phải HÀNH ĐỘNG.
  var viewKeys = ['viewPolicy', 'viewReason', 'viewHist', 'trackUw', 'trackPay', 'trackIssue', 'open'];
  var primary = (BANCA.nextActor ? BANCA.nextActor(app) : 'CURRENT_USER') === 'CURRENT_USER' && viewKeys.indexOf(key) < 0;
  return { label: label, tab: tab, primary: primary };
};
