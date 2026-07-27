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
