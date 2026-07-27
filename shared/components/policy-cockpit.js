// ============================================================
// §11 Policy Cockpit — MỘT cockpit dùng chung Motor / Health / PA.
// Khác biệt sản phẩm truyền vào qua cfg.overview / cfg.rail (product definition),
// KHÔNG clone cockpit theo tên sản phẩm (§3.2), KHÔNG CSS riêng theo page (§3.3).
//
// 6 tab chuẩn: Tổng quan · Thanh toán · Dòng thời gian · Yêu cầu dịch vụ ·
//              Tổn thất/Bồi thường · Tài liệu
// ============================================================
window.BANCA = window.BANCA || {};
BANCA.ui = BANCA.ui || {};

(function () {
  var e = BANCA.ui._esc;
  function vnd(n) { return BANCA.vnd ? BANCA.vnd(n || 0) : String(n || 0); }
  function kv(k, v) { return '<div class="pc-kv"><div class="k">' + e(k) + '</div><div class="v">' + (v == null ? '—' : v) + '</div></div>'; }
  BANCA.ui.pcKv = kv;
  function card(title, body) { return '<section class="pc-card"><h2>' + e(title) + '</h2>' + body + '</section>'; }
  BANCA.ui.pcCard = card;

  BANCA.POLICY_TABS = [
    { id: 'overview',  label: 'Tổng quan' },
    { id: 'payment',   label: 'Thanh toán' },
    { id: 'timeline',  label: 'Dòng thời gian' },
    { id: 'service',   label: 'Yêu cầu dịch vụ' },
    { id: 'claims',    label: 'Tổn thất/Bồi thường' },
    { id: 'documents', label: 'Tài liệu' }
  ];

  // --- PolicySummary (§11 Tổng quan) — hero + KPI strip, giống nhau mọi sản phẩm ---
  BANCA.ui.policySummary = function (pol, cfg) {
    cfg = cfg || {};
    var badge = BANCA.policyBadge ? BANCA.policyBadge(pol.status) : '';
    var hero = '<section class="pc-hero"><div class="pc-hero-row">' +
      '<div><h1 class="pc-h1">' + e(pol.id) + '</h1>' +
      '<div class="pc-sub">Giấy chứng nhận ' + e(pol.certificate || pol.certificateNumber || '—') +
      ' · ' + e(pol.productName || '') + (cfg.packageName ? ' · ' + e(cfg.packageName) : '') + '</div></div>' +
      badge + '</div></section>';
    var kpis = cfg.kpis || [
      ['Số GCN', pol.certificate || '—'],
      ['Hiệu lực', pol.effectiveFrom || '—'],
      ['Hết hiệu lực', pol.effectiveTo || '—'],
      ['Phí năm', vnd(pol.premium)]
    ];
    var strip = '<div class="kpi-strip" style="grid-template-columns:repeat(' + kpis.length + ',1fr);margin-bottom:14px;">' +
      kpis.map(function (k) { return '<div class="kpi"><span>' + e(k[0]) + '</span><b>' + k[1] + '</b></div>'; }).join('') + '</div>';
    return hero + strip;
  };

  // --- BillingSchedule + lịch sử thu phí (§11 Thanh toán) ---
  // extraHtml: chi tiết rating riêng theo sản phẩm (vd Motor: TNDS/NCD/VAT) — nối THÊM vào
  // component chung, không thay thế bằng bảng phí riêng cho từng sản phẩm.
  BANCA.ui.billingSchedule = function (pol, extraHtml) {
    var bills = pol.billing || [];
    var payment = pol.payment || {};
    var head = card('Phí và kỳ thanh toán',
      kv('Phí bảo hiểm', vnd(pol.premium)) +
      kv('Kỳ đóng phí', pol.paymentFrequency || 'Đóng một lần') +
      kv('Ngày thanh toán', payment.paidAt || (bills[0] || {}).date || '—') +
      kv('Phương thức', (BANCA.PAYMENT_INSTRUMENTS && BANCA.PAYMENT_INSTRUMENTS[payment.paymentInstrument] || {}).label || (bills[0] || {}).method || '—') +
      kv('Mã giao dịch', payment.gatewayTransactionId || payment.gatewayReference || (bills[0] || {}).ref || '—'));

    var overdue = bills.filter(function (b) { return b.status === 'OVERDUE'; });
    var alert = overdue.length
      ? '<div class="alert2 warn" style="margin:0 0 12px;">Có ' + overdue.length + ' kỳ phí quá hạn — cần nhắc khách thanh toán.</div>' : '';

    var rows = BANCA.ui.dataTable([
      { label: 'Kỳ', cell: function (b) { return e(b.period || b.date || '—'); } },
      { label: 'Số tiền', align: 'right', cell: function (b) { return vnd(b.amount); } },
      { label: 'Phương thức', cell: function (b) { return e((BANCA.PAYMENT_INSTRUMENTS && BANCA.PAYMENT_INSTRUMENTS[b.method] || {}).label || b.method || '—'); } },
      { label: 'Tham chiếu', cell: function (b) { return e(b.ref || '—'); } },
      { label: 'Trạng thái', cell: function (b) { return BANCA.paymentBadge ? BANCA.paymentBadge(b.status) : e(b.status); } }
    ], bills, { empty: 'Chưa có lịch sử thanh toán cho hợp đồng này.' });

    return head + (extraHtml || '') + alert + card('Lịch sử thanh toán', rows);
  };

  // --- PolicyTimeline (§11 Dòng thời gian) ---
  BANCA.ui.policyTimeline = function (events) {
    events = (events || []).filter(Boolean);
    if (!events.length) return BANCA.ui.emptyState('Chưa có sự kiện nào trên hợp đồng.');
    return '<section class="pc-card"><h2>Dòng thời gian hợp đồng</h2>' +
      events.map(function (ev) {
        return '<div class="pc-tl-row"><div class="pc-tl-dot">✓</div>' +
          '<div><div class="pc-tl-t">' + e(ev.text || ev.action || '') + '</div>' +
          '<div class="pc-tl-m">' + e(ev.at || '') + (ev.by ? ' · ' + e(ev.by) : '') + '</div></div></div>';
      }).join('') + '</section>';
  };

  // --- ServiceRequestList (§11) — Portal khởi tạo & theo dõi, KHÔNG tự sửa hợp đồng ---
  BANCA.ui.serviceRequestList = function (pol, cfg) {
    cfg = cfg || {};
    var list = BANCA.serviceRequestsOf(pol.id);
    var types = BANCA.serviceRequestTypesFor(cfg.productId);
    var typeLabel = function (id) { return (BANCA.SERVICE_REQUEST_TYPES.find(function (t) { return t.id === id; }) || {}).label || id; };

    var note = '<div class="alert2 info" style="margin:0 0 12px;">Portal chỉ khởi tạo yêu cầu, đính kèm tài liệu và theo dõi trạng thái. ' +
      'Việc sửa đổi hợp đồng do hệ thống nghiệp vụ thực hiện.</div>';

    var cta = cfg.canRequest === false
      ? '<button class="btn btn-primary btn-sm" disabled title="Hợp đồng không ở trạng thái cho phép tạo yêu cầu">Tạo yêu cầu dịch vụ</button>'
      : '<button class="btn btn-primary btn-sm" onclick="' + (cfg.onCreate || 'alert(\'Tạo yêu cầu dịch vụ (demo)\')') + '">Tạo yêu cầu dịch vụ</button>';

    var table = BANCA.ui.dataTable([
      { label: 'Mã yêu cầu', cell: function (s) { return '<b>' + e(s.id) + '</b>'; } },
      { label: 'Loại', cell: function (s) { return e(typeLabel(s.type)); } },
      { label: 'Tạo lúc', cell: function (s) { return e(s.createdAt || '—'); } },
      { label: 'Cập nhật', cell: function (s) { return e(s.updatedAt || '—'); } },
      {
        label: 'Trạng thái', cell: function (s) {
          var m = BANCA.SERVICE_REQUEST_STATUS[s.status] || { label: s.status, cls: 'badge-pending' };
          return '<span class="badge ' + m.cls + '">' + e(m.label) + '</span>' +
            (s.missing && s.missing.length ? '<div class="pc-mini">Cần bổ sung: ' + e(s.missing.join(', ')) + '</div>' : '');
        }
      },
      { label: 'Tham chiếu xử lý', cell: function (s) { return '<span class="code">' + e(s.externalRef || '—') + '</span>'; } }
    ], list, { empty: 'Chưa có yêu cầu dịch vụ nào cho hợp đồng này.' });

    var avail = '<div class="pc-mini" style="margin-top:8px;">Loại yêu cầu khả dụng cho sản phẩm này: ' +
      e(types.map(function (t) { return t.label; }).join(' · ')) + '</div>';

    return note + '<div class="pc-actions">' + cta + '</div>' + table + avail;
  };

  // --- ClaimSummary (§11) — khai báo + theo dõi, KHÔNG xử lý bồi thường trong portal ---
  BANCA.ui.claimSummary = function (pol, cfg) {
    cfg = cfg || {};
    var list = BANCA.claimsOf(pol.id);
    var note = '<div class="alert2 info" style="margin:0 0 12px;">Portal hỗ trợ khai báo tổn thất và theo dõi tiến trình. ' +
      'Việc giám định và chi trả bồi thường do hệ thống bồi thường thực hiện.</div>';
    var canClaim = pol.status === 'ACTIVE';
    var cta = canClaim
      ? '<button class="btn btn-primary btn-sm" onclick="' + (cfg.onNotify || 'alert(\'Khai báo tổn thất (demo)\')') + '">Khai báo tổn thất</button>'
      : '<button class="btn btn-primary btn-sm" disabled title="Hợp đồng không còn hiệu lực — không thể khai báo tổn thất">Khai báo tổn thất</button>';

    if (!list.length) return note + '<div class="pc-actions">' + cta + '</div>' + BANCA.ui.emptyState('Chưa có khai báo tổn thất nào cho hợp đồng này.');

    var cards = list.map(function (c) {
      var m = BANCA.CLAIM_STATUS[c.status] || { label: c.status, cls: 'badge-pending' };
      var tl = (c.timeline || []).map(function (t) {
        return '<div class="pc-tl-row"><div class="pc-tl-dot">✓</div><div><div class="pc-tl-t">' + e(t.text) + '</div><div class="pc-tl-m">' + e(t.at) + '</div></div></div>';
      }).join('');
      return card('Hồ sơ ' + c.id,
        kv('Trạng thái', '<span class="badge ' + m.cls + '">' + e(m.label) + '</span>') +
        kv('Ngày tổn thất', c.lossDate || '—') +
        kv('Loại tổn thất', c.lossType || '—') +
        kv('Khai báo lúc', (c.notifiedAt || '—')) +
        kv('Ước tính bồi thường', c.estimate ? vnd(c.estimate) : '—') +
        kv('Mã bồi thường', '<span class="code">' + e(c.externalRef || '—') + '</span>') +
        (tl ? '<div class="pc-sub-h">Tiến trình</div>' + tl : ''));
    }).join('');
    return note + '<div class="pc-actions">' + cta + '</div>' + cards;
  };

  // --- PolicyDocumentList (§11 Tài liệu) — dùng renderer sẵn có của page nếu truyền vào ---
  BANCA.ui.policyDocumentList = function (html) {
    return html || BANCA.ui.emptyState('Chưa có tài liệu.');
  };

  // ============================================================
  // policyCockpit — shell 6 tab. cfg:
  //   productId, packageName, kpis, backHref, actionBar
  //   overview {main, rail}   — khối riêng theo sản phẩm
  //   timelineEvents, documentsHtml, onCreateRequest, onNotifyClaim
  // ============================================================
  BANCA.ui.policyCockpit = function (pol, cfg) {
    cfg = cfg || {};
    var qs = new URLSearchParams(location.search);
    var active = qs.get('tab') || 'overview';
    if (!BANCA.POLICY_TABS.some(function (t) { return t.id === active; })) active = 'overview';

    function href(id) {
      var o = new URLSearchParams(location.search);
      o.set('tab', id);
      return '?' + o.toString();
    }
    var counts = {
      service: BANCA.serviceRequestsOf(pol.id).length,
      claims: BANCA.claimsOf(pol.id).length
    };
    var tabs = BANCA.ui.tabBar(BANCA.POLICY_TABS.map(function (t) {
      return { id: t.id, label: t.label, href: href(t.id), count: counts[t.id] || null };
    }), active);

    var body;
    if (active === 'overview') {
      var ov = cfg.overview || {};
      body = ov.rail
        ? '<div class="pc-grid"><main class="pc-main">' + (ov.main || '') + '</main><aside class="pc-rail">' + ov.rail + '</aside></div>'
        : '<div class="pc-main">' + (ov.main || '') + '</div>';
    } else if (active === 'payment') {
      body = BANCA.ui.billingSchedule(pol, cfg.paymentExtraHtml);
    } else if (active === 'timeline') {
      body = BANCA.ui.policyTimeline(cfg.timelineEvents);
    } else if (active === 'service') {
      body = BANCA.ui.serviceRequestList(pol, { productId: cfg.productId, onCreate: cfg.onCreateRequest, canRequest: pol.status === 'ACTIVE' });
    } else if (active === 'claims') {
      body = BANCA.ui.claimSummary(pol, { onNotify: cfg.onNotifyClaim });
    } else {
      body = BANCA.ui.policyDocumentList(cfg.documentsHtml);
    }

    // heroHtml: sản phẩm có khối tóm tắt đặc thù (vd Motor: NCD/IDV/khấu trừ) thì truyền vào,
    // vẫn dùng CHUNG cockpit + 6 tab — không tách cockpit riêng (§3.2).
    var hero = cfg.heroHtml != null ? cfg.heroHtml : BANCA.ui.policySummary(pol, cfg);

    return '<div class="policy-cockpit">' +
      '<div class="pc-top">' +
      '<a href="' + e(cfg.backHref || 'index.html') + '" class="pc-back">&larr; Danh sách hợp đồng</a>' +
      (cfg.actionBar || '') + '</div>' +
      hero +
      tabs +
      body + '</div>';
  };
})();
