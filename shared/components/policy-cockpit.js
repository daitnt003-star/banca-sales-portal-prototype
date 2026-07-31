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
    // Ô chỉ số nhận thêm dòng chú thích thứ 3 (vd: khoảng hiệu lực, nguồn cấp).
    var strip = '<div class="kpi-strip light" style="grid-template-columns:repeat(' + kpis.length + ',1fr);margin-bottom:14px;">' +
      kpis.map(function (k) {
        return '<div class="kpi"><span>' + e(k[0]) + '</span><b>' + k[1] + '</b>' +
          (k[2] ? '<small class="kpi-hint">' + e(k[2]) + '</small>' : '') + '</div>';
      }).join('') + '</div>';
    return hero + strip;
  };

  // --- PolicyOverview (§11 Tổng quan) — MỘT bố cục cho Motor/Health/PA.
  // Trang chỉ truyền DỮ LIỆU, không tự dựng HTML riêng, để 3 sản phẩm không trôi lệch bố cục.
  //   benefits : [[nhãn, giá trị, ghi chú?]]            → bảng quyền lợi
  //   insureds : [{name, badges:[], meta, facts:[[k,v]]}] → người được bảo hiểm (hiện đủ, không gập)
  //   terms    : {wordingRef, wordingOnClick, exclusions:[], special:[]}
  //   parties  : [[nhãn, giá trị, ghi chú?]]            → rail: các bên liên quan
  //   subject  : {title, rows:[[nhãn, giá trị]]}        → rail: đối tượng bảo hiểm & thời hạn
  //   railExtra: html                                    → rail: khối riêng (hoa hồng, phân phối…)
  BANCA.ui.policyOverview = function (pol, cfg) {
    cfg = cfg || {};
    function kvRow(row, small) {
      return '<div class="pc-kv' + (small ? ' sm' : '') + '"><div class="k">' + e(row[0]) + '</div>' +
        '<div class="v">' + (row[1] == null || row[1] === '' ? '—' : row[1]) +
        (row[2] ? '<span class="note">' + row[2] + '</span>' : '') + '</div></div>';
    }
    var main = '';

    var insureds = cfg.insureds || [];
    if (insureds.length) {
      // Nhãn khối do sản phẩm quyết định: xe là ĐỐI TƯỢNG bảo hiểm, người mới là NGƯỜI ĐƯỢC bảo hiểm.
      var insuredsTitle = cfg.insuredsTitle || 'Người được bảo hiểm';
      main += card(insureds.length > 1 ? insuredsTitle + ' (' + insureds.length + ')' : insuredsTitle,
        insureds.map(function (m) {
          return '<article class="pc-insured"><div class="pc-insured-head"><b>' + e(m.name || '—') + '</b>' +
            (m.badges || []).map(function (b) { return '<span class="chip">' + e(b) + '</span>'; }).join('') + '</div>' +
            (m.meta ? '<div class="pc-insured-meta">' + e(m.meta) + '</div>' : '') +
            (m.facts && m.facts.length
              ? '<div class="pc-facts">' + m.facts.map(function (f) {
                  return '<div class="pc-fact"><span>' + e(f[0]) + '</span><b>' + (f[1] == null ? '—' : f[1]) + '</b></div>';
                }).join('') + '</div>'
              : '') + '</article>';
        }).join(''));
    }

    if ((cfg.benefits || []).length) {
      main += card(cfg.benefitsTitle || 'Quyền lợi bảo hiểm',
        cfg.benefits.map(function (b) { return kvRow(b); }).join(''));
    }

    var terms = cfg.terms || {};
    if (terms.wordingRef || (terms.exclusions || []).length || (terms.special || []).length) {
      main += card('Điều khoản & loại trừ',
        (terms.wordingRef
          ? '<div class="pc-mini" style="margin:0 0 var(--space-sm);">Bộ quy tắc áp dụng: ' +
            (terms.wordingOnClick
              ? '<button class="btn btn-secondary btn-sm" type="button" onclick="' + terms.wordingOnClick + '">' + e(terms.wordingRef) + '</button>'
              : '<b>' + e(terms.wordingRef) + '</b>') + '</div>'
          : '') +
        ((terms.exclusions || []).length
          ? terms.exclusions.map(function (x) { return '<div class="pc-excl">✕ ' + e(x) + '</div>'; }).join('')
          : '<div class="pc-mini">Không có loại trừ riêng ngoài quy tắc bảo hiểm.</div>') +
        ((terms.special || []).length
          ? '<div class="pc-sub-h">Điều kiện đặc biệt</div>' +
            terms.special.map(function (x) { return '<div class="pc-excl">• ' + e(x) + '</div>'; }).join('')
          : ''));
    }

    var rail = '';
    if ((cfg.parties || []).length) rail += card('Các bên liên quan', cfg.parties.map(function (r) { return kvRow(r, true); }).join(''));
    if (cfg.subject && (cfg.subject.rows || []).length) {
      rail += card(cfg.subject.title || 'Đối tượng bảo hiểm & thời hạn', cfg.subject.rows.map(function (r) { return kvRow(r, true); }).join(''));
    }
    rail += (cfg.railExtra || '');
    return { main: main, rail: rail };
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
      ? '<button class="btn btn-primary btn-sm" disabled title="Hợp đồng không ở trạng thái cho phép tạo yêu cầu">Tạo yêu cầu bổ sung</button>'
      : '<button class="btn btn-primary btn-sm" onclick="' +
        (cfg.onCreate || "BANCA.ui.postSale.openService('" + pol.id + "','" + (cfg.productId || '') + "')") + '">Tạo yêu cầu bổ sung</button>';

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
      { label: 'Tham chiếu xử lý', cell: function (s) { return '<span class="code">' + e(s.externalRef || '—') + '</span>'; } },
      {
        label: 'Việc cần làm', cell: function (s) {
          if (s.status === 'NEED_INFO') {
            return '<button class="btn btn-secondary btn-sm" onclick="BANCA.ui.postSale.openSupplement(\'service\',\'' + s.id + '\')">Bổ sung thông tin</button>';
          }
          return '<span class="pc-mini">Theo dõi trạng thái từ hệ thống xử lý</span>';
        }
      }
    ], list, { empty: 'Chưa có yêu cầu bổ sung nào cho hợp đồng này.' });

    var avail = '<div class="pc-mini" style="margin-top:8px;">Loại yêu cầu khả dụng cho sản phẩm này: ' +
      e(types.map(function (t) { return t.label; }).join(' · ')) + '</div>';

    return note + '<div class="pc-actions">' + cta + '</div>' + table + avail +
      BANCA.ui.postSale.statusTools('service', list);
  };

  // --- ClaimSummary (§11) — khai báo + theo dõi, KHÔNG xử lý bồi thường trong portal ---
  BANCA.ui.claimSummary = function (pol, cfg) {
    cfg = cfg || {};
    var list = BANCA.claimsOf(pol.id);
    var note = '<div class="alert2 info" style="margin:0 0 12px;">Portal hỗ trợ khai báo tổn thất và theo dõi tiến trình. ' +
      'Việc giám định và chi trả bồi thường do hệ thống bồi thường thực hiện.</div>';
    var canClaim = pol.status === 'ACTIVE';
    var cta = canClaim
      ? '<button class="btn btn-primary btn-sm" onclick="' +
        (cfg.onNotify || "BANCA.ui.postSale.openClaim('" + pol.id + "','" + (cfg.productId || '') + "')") + '">Khai báo tổn thất</button>'
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
        kv('Ước tính thiệt hại', c.estimate ? vnd(c.estimate) : '—') +
        kv('Mã bồi thường bên xử lý', '<span class="code">' + e(c.externalRef || '—') + '</span>') +
        (c.description ? kv('Diễn biến', e(c.description)) : '') +
        (c.missing && c.missing.length ? kv('Cần bổ sung', e(c.missing.join(', '))) : '') +
        (c.status === 'NEED_INFO'
          ? '<div class="pc-actions" style="margin:var(--space-md) 0 0;"><button class="btn btn-secondary btn-sm" onclick="BANCA.ui.postSale.openSupplement(\'claim\',\'' + c.id + '\')">Bổ sung thông tin</button></div>'
          : '') +
        (tl ? '<div class="pc-sub-h">Tiến trình</div>' + tl : ''));
    }).join('');
    return note + '<div class="pc-actions">' + cta + '</div>' + cards +
      BANCA.ui.postSale.statusTools('claim', list);
  };

  // ============================================================
  // Ghi nhận yêu cầu sau bán: biểu mẫu + theo dõi trạng thái.
  // Portal chỉ TẠO TICKET và ghi nhận trạng thái do hệ thống xử lý trả về —
  // không sửa hợp đồng, không tự duyệt/chi trả bồi thường.
  // ============================================================
  function modal(title, bodyHtml, footerHtml) {
    var old = document.getElementById('post-sale-modal');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'post-sale-modal';
    el.className = 'modal-overlay2 open';
    el.onclick = function (ev) { if (ev.target === el) el.remove(); };
    el.innerHTML = '<div class="modal2" style="max-width:620px;" onclick="event.stopPropagation()">' +
      '<div class="modal2-head"><b>' + e(title) + '</b>' +
      '<span class="modal2-close" onclick="document.getElementById(\'post-sale-modal\').remove()">&times;</span></div>' +
      '<div class="modal2-body">' + bodyHtml + '</div>' +
      '<div class="modal2-footer">' + footerHtml + '</div></div>';
    document.body.appendChild(el);
    var first = el.querySelector('select,input,textarea');
    if (first) first.focus();
    return el;
  }
  function field(label, inner, hint) {
    return '<div class="ps-field"><label>' + e(label) + '</label>' + inner +
      (hint ? '<div class="pc-mini">' + hint + '</div>' : '') + '</div>';
  }
  function val(id) { var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; }
  function err(msg) {
    var box = document.getElementById('ps-error');
    if (box) { box.textContent = msg; box.style.display = msg ? 'block' : 'none'; }
  }
  function reloadTo(tab) {
    var o = new URLSearchParams(location.search);
    o.set('tab', tab);
    location.href = '?' + o.toString();
  }

  BANCA.ui.postSale = {
    openService: function (policyId, productId) {
      var types = BANCA.serviceRequestTypesFor(productId);
      var body = '<div class="alert2 info" style="margin:0 0 12px;">Ghi nhận yêu cầu của khách và gửi sang hệ thống xử lý. ' +
        'Nội dung hợp đồng chỉ thay đổi khi hệ thống xử lý hoàn tất yêu cầu.</div>' +
        '<div class="alert2 danger" id="ps-error" style="display:none;margin:0 0 12px;"></div>' +
        field('Loại yêu cầu', '<select id="ps-type" onchange="BANCA.ui.postSale.syncDocs()">' +
          types.map(function (t) { return '<option value="' + e(t.id) + '">' + e(t.label) + '</option>'; }).join('') + '</select>') +
        field('Kênh tiếp nhận', '<select id="ps-channel"><option value="Tại quầy">Tại quầy</option><option value="Điện thoại">Điện thoại</option><option value="Email">Email</option></select>') +
        field('Nội dung khách yêu cầu', '<textarea id="ps-note" rows="3" placeholder="Ghi lại đúng yêu cầu của khách hàng"></textarea>') +
        '<div class="ps-field"><label>Tài liệu cần kèm theo</label><div id="ps-docs" class="pc-mini"></div></div>';
      modal('Tạo yêu cầu bổ sung', body,
        '<button class="btn btn-secondary" onclick="document.getElementById(\'post-sale-modal\').remove()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="BANCA.ui.postSale.submitService(\'' + policyId + '\')">Ghi nhận & gửi xử lý</button>');
      BANCA.ui.postSale.syncDocs();
    },
    syncDocs: function () {
      var t = (BANCA.SERVICE_REQUEST_TYPES || []).find(function (x) { return x.id === val('ps-type'); }) || {};
      var box = document.getElementById('ps-docs');
      if (box) box.textContent = (t.docs && t.docs.length) ? t.docs.join(' · ') : 'Không yêu cầu tài liệu kèm theo.';
    },
    submitService: function (policyId) {
      var note = val('ps-note');
      if (!note) { err('Nhập nội dung khách yêu cầu trước khi gửi.'); return; }
      var type = val('ps-type');
      var t = (BANCA.SERVICE_REQUEST_TYPES || []).find(function (x) { return x.id === type; }) || {};
      var rec = BANCA.postSale.addServiceRequest({
        policyId: policyId, type: type, note: note,
        channel: val('ps-channel'), requiredDocs: t.docs || []
      });
      var el = document.getElementById('post-sale-modal');
      if (el) el.remove();
      modal('Đã ghi nhận yêu cầu bổ sung',
        '<div class="alert2" style="margin:0;background:var(--teal-100);color:var(--teal-600);">✓ Đã tạo yêu cầu <b>' + e(rec.id) +
        '</b> và gửi sang hệ thống xử lý.</div>' +
        '<div class="pc-kv"><div class="k">Tham chiếu bên xử lý</div><div class="v"><span class="code">' + e(rec.externalRef) + '</span></div></div>' +
        '<div class="pc-kv"><div class="k">Trạng thái</div><div class="v">Đã gửi — chờ hệ thống xử lý tiếp nhận</div></div>' +
        '<div class="pc-mini">Trạng thái tiếp theo do hệ thống xử lý cập nhật; portal chỉ theo dõi.</div>',
        '<button class="btn btn-primary" onclick="BANCA.ui.postSale.close(\'service\')">Xem danh sách yêu cầu</button>');
    },
    openClaim: function (policyId, productId) {
      var pol = BANCA.policyById ? BANCA.policyById(policyId) : null;
      var types = BANCA.claimTypesFor(productId);
      var body = '<div class="alert2 info" style="margin:0 0 12px;">Ghi nhận khai báo tổn thất và chuyển hệ thống bồi thường. ' +
        'Portal không giám định, không quyết định số tiền chi trả.</div>' +
        '<div class="alert2 danger" id="ps-error" style="display:none;margin:0 0 12px;"></div>' +
        field('Loại tổn thất', '<select id="ps-type" onchange="BANCA.ui.postSale.syncClaimDocs()">' +
          types.map(function (t) { return '<option value="' + e(t.id) + '">' + e(t.label) + '</option>'; }).join('') + '</select>') +
        field('Ngày xảy ra tổn thất', '<input id="ps-loss-date" type="date"' +
          (pol && pol.effectiveFrom ? ' min="' + e(pol.effectiveFrom) + '"' : '') +
          (pol && pol.effectiveTo ? ' max="' + e(pol.effectiveTo) + '"' : '') + '>',
          pol ? 'Phải nằm trong thời gian hiệu lực ' + e(pol.effectiveFrom || '—') + ' → ' + e(pol.effectiveTo || '—') : '') +
        field('Diễn biến sự việc', '<textarea id="ps-desc" rows="3" placeholder="Mô tả ngắn gọn: thời điểm, địa điểm, thiệt hại ghi nhận"></textarea>') +
        field('Ước tính thiệt hại (đ)', '<input id="ps-estimate" inputmode="numeric" placeholder="Có thể để trống nếu chưa xác định">') +
        field('Người khai báo & liên hệ', '<input id="ps-contact" placeholder="Tên người khai báo · số điện thoại">') +
        '<div class="ps-field"><label>Tài liệu cần chuẩn bị</label><div id="ps-docs" class="pc-mini"></div></div>';
      modal('Khai báo tổn thất', body,
        '<button class="btn btn-secondary" onclick="document.getElementById(\'post-sale-modal\').remove()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="BANCA.ui.postSale.submitClaim(\'' + policyId + '\')">Ghi nhận & gửi bồi thường</button>');
      BANCA.ui.postSale.syncClaimDocs();
    },
    syncClaimDocs: function () {
      var t = (BANCA.CLAIM_TYPES || []).find(function (x) { return x.id === val('ps-type'); }) || {};
      var box = document.getElementById('ps-docs');
      if (box) box.textContent = (t.docs && t.docs.length) ? t.docs.join(' · ') : 'Hệ thống bồi thường sẽ yêu cầu tài liệu cụ thể sau khi tiếp nhận.';
    },
    submitClaim: function (policyId) {
      var pol = BANCA.policyById ? BANCA.policyById(policyId) : null;
      var lossDate = val('ps-loss-date');
      var desc = val('ps-desc');
      if (!lossDate) { err('Chọn ngày xảy ra tổn thất.'); return; }
      if (pol && pol.effectiveFrom && lossDate < pol.effectiveFrom) { err('Ngày tổn thất trước ngày hợp đồng có hiệu lực.'); return; }
      if (pol && pol.effectiveTo && lossDate > pol.effectiveTo) { err('Ngày tổn thất sau ngày hết hiệu lực của hợp đồng.'); return; }
      if (lossDate > new Date().toISOString().slice(0, 10)) { err('Ngày tổn thất không được ở tương lai.'); return; }
      if (!desc) { err('Mô tả diễn biến sự việc trước khi gửi.'); return; }
      var t = (BANCA.CLAIM_TYPES || []).find(function (x) { return x.id === val('ps-type'); }) || {};
      var estimate = parseInt(String(val('ps-estimate')).replace(/\D/g, ''), 10) || null;
      var rec = BANCA.postSale.addClaim({
        policyId: policyId, lossDate: lossDate, lossType: t.label || val('ps-type'),
        description: desc, estimate: estimate, contact: val('ps-contact'), requiredDocs: t.docs || []
      });
      var el = document.getElementById('post-sale-modal');
      if (el) el.remove();
      modal('Đã ghi nhận khai báo tổn thất',
        '<div class="alert2" style="margin:0;background:var(--teal-100);color:var(--teal-600);">✓ Đã tạo hồ sơ <b>' + e(rec.id) + '</b> và chuyển hệ thống bồi thường.</div>' +
        '<div class="pc-kv"><div class="k">Mã bồi thường bên xử lý</div><div class="v"><span class="code">' + e(rec.externalRef) + '</span></div></div>' +
        '<div class="pc-kv"><div class="k">Trạng thái</div><div class="v">Đã khai báo — chờ giám định</div></div>' +
        '<div class="pc-mini">Kết quả giám định và số tiền chi trả do hệ thống bồi thường quyết định.</div>',
        '<button class="btn btn-primary" onclick="BANCA.ui.postSale.close(\'claims\')">Xem khai báo tổn thất</button>');
    },
    openSupplement: function (kind, id) {
      var body = '<div class="alert2 warn" style="margin:0 0 12px;">Hệ thống xử lý đang yêu cầu bổ sung. Ghi nhận nội dung đã bổ sung để gửi lại.</div>' +
        '<div class="alert2 danger" id="ps-error" style="display:none;margin:0 0 12px;"></div>' +
        field('Nội dung / tài liệu đã bổ sung', '<textarea id="ps-note" rows="3" placeholder="Ví dụ: đã gửi hoá đơn phụ kiện bản scan"></textarea>');
      modal('Bổ sung thông tin ' + id, body,
        '<button class="btn btn-secondary" onclick="document.getElementById(\'post-sale-modal\').remove()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="BANCA.ui.postSale.submitSupplement(\'' + kind + '\',\'' + id + '\')">Gửi bổ sung</button>');
    },
    submitSupplement: function (kind, id) {
      var note = val('ps-note');
      if (!note) { err('Nhập nội dung đã bổ sung.'); return; }
      BANCA.postSale.setStatus(kind, id, 'IN_PROGRESS', 'Đã gửi bổ sung: ' + note);
      reloadTo(kind === 'claim' ? 'claims' : 'service');
    },
    // Demo Tools — mô phỏng hệ thống xử lý trả trạng thái về portal.
    statusTools: function (kind, list) {
      if (!list || !list.length) return '';
      var map = kind === 'claim'
        ? [['ASSESSING', 'Đang giám định'], ['NEED_INFO', 'Cần bổ sung'], ['APPROVED', 'Đã duyệt bồi thường'], ['PAID', 'Đã chi trả'], ['REJECTED', 'Từ chối']]
        : [['IN_PROGRESS', 'Đang xử lý'], ['NEED_INFO', 'Cần bổ sung'], ['COMPLETED', 'Đã hoàn tất'], ['REJECTED', 'Từ chối']];
      return '<div class="demo-tools" style="margin-top:var(--space-lg);">' +
        '<div class="label">Demo Tools — mô phỏng phản hồi từ hệ thống xử lý</div>' +
        list.map(function (x) {
          return '<div class="ps-tool-row"><span>' + e(x.id) + '</span>' +
            map.map(function (m) {
              return '<button class="btn btn-secondary btn-sm" onclick="BANCA.ui.postSale.simulate(\'' + kind + '\',\'' + x.id + '\',\'' + m[0] + '\')">' + e(m[1]) + '</button>';
            }).join('') + '</div>';
        }).join('') +
        '<div class="pc-mini">Nhân viên bán hàng KHÔNG tự đổi trạng thái — trạng thái chỉ đến từ hệ thống xử lý.</div></div>';
    },
    simulate: function (kind, id, status) {
      var note = status === 'NEED_INFO' ? 'Hệ thống xử lý yêu cầu bổ sung thông tin' : null;
      BANCA.postSale.setStatus(kind, id, status, note);
      reloadTo(kind === 'claim' ? 'claims' : 'service');
    },
    close: function (tab) { reloadTo(tab); }
  };

  // --- PolicyDocumentList (§11 Tài liệu) — dùng renderer sẵn có của page nếu truyền vào ---
  BANCA.ui.policyDocumentList = function (html) {
    return html || BANCA.ui.emptyState('Chưa có tài liệu.');
  };

  // ============================================================
  // §12 CS WORKSPACE — tái cấu trúc trang chi tiết theo tư duy Banking Portal.
  // Gate bằng cfg.csWorkspace===true (hiện chỉ Health). Motor/PA giữ đường cũ.
  // 6 tab: Overview · Thu phí · Life Cycle · Sửa đổi bổ sung · Bồi thường · Chăm sóc KH.
  // Nguồn quyết định: docs/rework-v2/F-policy-cockpit-cs-workspace.md
  // ============================================================
  BANCA.POLICY_TABS_CS = [
    { id: 'overview',    label: 'Tổng quan' },
    { id: 'payment',     label: 'Thu phí' },
    { id: 'lifecycle',   label: 'Dòng thời gian' },
    { id: 'endorsement', label: 'Sửa đổi bổ sung' },
    { id: 'claims',      label: 'Bồi thường' },
    { id: 'care',        label: 'Chăm sóc KH' }
  ];

  // CSS token-only (không hex/px lệch thang) — nạp 1 lần.
  BANCA.ui.pcCsStyles = function () {
    if (document.getElementById('pc-cs-styles')) return '';
    return '<style id="pc-cs-styles">' +
      '.pc-qa{display:flex;flex-wrap:wrap;gap:var(--space-sm);}' +
      '.pc-benefit-chips{display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-md);}' +
      '.pc-bchip{display:inline-flex;align-items:center;gap:var(--space-2xs);padding:var(--space-2xs) var(--space-sm);border-radius:var(--radius-pill);background:var(--teal-100);color:var(--teal-600);font-size:var(--text-xs);font-weight:600;}' +
      '.pc-bchip.off{background:var(--paper-muted);color:var(--ink-300);}' +
      '.pc-paysum{display:flex;flex-wrap:wrap;gap:var(--space-2xl);align-items:center;}' +
      '.pc-paysum .n{font-size:var(--text-2xl);font-weight:800;color:var(--ink-900);}' +
      '.pc-paysum .l{font-size:var(--text-xs);color:var(--ink-500);}' +
      '.pc-expand{display:flex;align-items:center;justify-content:space-between;width:100%;cursor:pointer;padding:var(--space-md) var(--space-lg);border:1px solid var(--line);border-radius:var(--radius-md);background:var(--paper-card);font-size:var(--text-sm);font-weight:600;color:var(--ink-800);}' +
      '.pc-lcfilter{display:flex;flex-wrap:wrap;gap:var(--space-xs);margin-bottom:var(--space-md);}' +
      '.pc-drawer-ov{position:fixed;inset:0;background:rgba(15,23,42,.38);opacity:0;visibility:hidden;transition:opacity .2s;z-index:var(--z-drawer);}' +
      '.pc-drawer-ov.open{opacity:1;visibility:visible;}' +
      '.pc-drawer{position:fixed;top:0;right:0;height:100%;width:min(480px,92vw);background:var(--paper-card);box-shadow:var(--shadow-3);transform:translateX(100%);transition:transform .22s;z-index:var(--z-drawer);display:flex;flex-direction:column;}' +
      '.pc-drawer-wide{width:min(760px,96vw);}' +
      '.pc-drawer-ov.open .pc-drawer{transform:translateX(0);}' +
      '.pc-drawer-h{display:flex;align-items:center;justify-content:space-between;padding:var(--space-lg);border-bottom:1px solid var(--line);}' +
      '.pc-drawer-h b{font-size:var(--text-lg);}' +
      '.pc-drawer-b{padding:var(--space-lg);overflow:auto;}' +
      '.pc-drawer-x{cursor:pointer;font-size:var(--text-xl);color:var(--ink-500);line-height:1;background:none;border:none;}' +
      '.pc-overdue{color:var(--red-600);font-weight:700;}' +
      'tr.pc-row-overdue td{background:var(--red-100);}' +
      '.pc-nba{display:flex;gap:var(--space-sm);align-items:flex-start;padding:var(--space-md) var(--space-lg);border:1px solid var(--amber-600);border-radius:var(--radius-md);background:var(--amber-100);margin-bottom:var(--space-sm);}' +
      '.pc-nba .ic{font-size:var(--text-lg);}' +
      '.pc-ctlog{display:grid;grid-template-columns:auto 1fr;gap:var(--space-sm) var(--space-md);align-items:start;padding:var(--space-sm) 0;border-bottom:1px solid var(--line);}' +
      '.pc-top{display:flex;align-items:center;gap:var(--space-md);}' +
      '.pc-top-right{display:flex;align-items:center;gap:var(--space-md);margin-left:auto;}' +
      '.pc-sync{display:inline-flex;align-items:center;gap:var(--space-2xs);font-size:var(--text-xs);font-weight:600;color:var(--teal-600);background:var(--teal-100);padding:var(--space-2xs) var(--space-sm);border-radius:var(--radius-pill);}' +
      '.policy-cockpit .tabbar-tab{padding:var(--space-md) var(--space-lg);font-size:var(--text-md);}' +
      '.pc-renewal{display:flex;align-items:center;justify-content:space-between;padding:var(--space-md) var(--space-lg);border:1px solid var(--line);border-left:3px solid var(--brand-600);border-radius:var(--radius-md);background:var(--paper-card);margin-bottom:var(--space-md);}' +
      '.pc-renewal .big{font-size:var(--text-lg);font-weight:800;color:var(--ink-900);}' +
      '.pc-ins-compact{display:flex;align-items:center;justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--line);}' +
      '.pc-ins-compact:last-child{border-bottom:none;}' +
      '.pc-snap{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm) var(--space-lg);}' +
      '.pc-snap .row{display:flex;justify-content:space-between;padding:var(--space-2xs) 0;font-size:var(--text-sm);border-bottom:1px solid var(--line);}' +
      '.pc-snap .row .k{color:var(--ink-500);}' +
      '</style>';
  };

  BANCA.ui.pcDrawer = function (id, title, bodyHtml, opts) {
    opts = opts || {};
    return '<div class="pc-drawer-ov" id="' + id + '" onclick="if(event.target===this)this.classList.remove(\'open\')">' +
      '<div class="pc-drawer' + (opts.wide ? ' pc-drawer-wide' : '') + '"><div class="pc-drawer-h"><b>' + e(title) + '</b>' +
      '<button class="pc-drawer-x" onclick="document.getElementById(\'' + id + '\').classList.remove(\'open\')">&times;</button></div>' +
      '<div class="pc-drawer-b">' + bodyHtml + '</div></div></div>';
  };
  BANCA.ui.pcOpenDrawer = function (id) { var el = document.getElementById(id); if (el) el.classList.add('open'); };

  // Suy ra chỉ số chăm sóc từ chính hợp đồng — KHÔNG tạo nguồn dữ liệu mới.
  BANCA.ui.pcComputeCare = function (pol) {
    var today = new Date((BANCA.TODAY || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
    var effTo = new Date((pol.effectiveTo || (BANCA.TODAY || '')) + 'T00:00:00');
    var remainingDays = Math.max(0, Math.ceil((effTo - today) / 86400000));
    var bills = pol.billing || [];
    var overdue = bills.filter(function (b) { return b.status === 'OVERDUE'; });
    var paidCount = bills.filter(function (b) { return b.status === 'PAID'; }).length;
    var paidPct = bills.length ? Math.round(paidCount / bills.length * 100) : (pol.payment && pol.payment.paidAt ? 100 : 0);
    var claims = BANCA.claimsOf ? BANCA.claimsOf(pol.id) : [];
    var claimsDone = claims.filter(function (c) { return c.status === 'PAID' || c.status === 'COMPLETED'; }).length;
    var srv = BANCA.serviceRequestsOf ? BANCA.serviceRequestsOf(pol.id) : [];
    var srvOpen = srv.filter(function (s) { return s.status !== 'COMPLETED' && s.status !== 'REJECTED'; }).length;
    return {
      remainingDays: remainingDays, active: pol.status === 'ACTIVE',
      overdueDays: overdue.length ? (overdue[0].overdueDays || null) : 0, overdueCount: overdue.length,
      paidPct: paidPct,
      claimTotal: claims.length, claimDone: claimsDone, claimOpen: claims.length - claimsDone,
      srvTotal: srv.length, srvOpen: srvOpen
    };
  };

  // Next Best Action theo rule ở spec F §8.
  BANCA.ui.pcNextBestActions = function (pol, care) {
    var out = [];
    if (care.active && care.remainingDays <= 120) out.push({ ic: '🔔', text: 'Hợp đồng còn ' + care.remainingDays + ' ngày — đề nghị liên hệ khách để tái tục.' });
    if (care.claimOpen > 0) out.push({ ic: '📞', text: 'Khách có ' + care.claimOpen + ' yêu cầu bồi thường đang xử lý — đề nghị gọi hỗ trợ.' });
    if (care.overdueCount > 0) out.push({ ic: '⚠️', text: 'Có kỳ phí quá hạn — nhắc khách thanh toán để giữ hiệu lực.' });
    if (!out.length && care.paidPct === 100 && care.active) out.push({ ic: '💡', text: 'Khách đóng đủ phí, hợp đồng ổn định — cơ hội tư vấn thêm sản phẩm (cross-sell).' });
    return out;
  };

  // Tab Thu phí — bảng kỳ phí + highlight overdue.
  BANCA.ui.pcThuPhi = function (pol, extraHtml) {
    var bills = pol.billing || [];
    var head = card('Tổng quan phí',
      kv('Phí bảo hiểm', vnd(pol.premium)) +
      kv('Kỳ đóng phí', pol.paymentFrequency || 'Đóng một lần') +
      kv('Đã thu', bills.length ? (bills.filter(function (b) { return b.status === 'PAID'; }).length + '/' + bills.length + ' kỳ') : '—'));
    if (!bills.length) return head + (extraHtml || '') + BANCA.ui.emptyState('Chưa có lịch thu phí cho hợp đồng này.');
    var thead = '<tr><th>Kỳ</th><th>Đến hạn</th><th style="text-align:right">Số tiền</th><th>Phương thức</th><th>Trạng thái</th></tr>';
    var rows = bills.map(function (b) {
      var isOd = b.status === 'OVERDUE';
      var st = BANCA.paymentBadge ? BANCA.paymentBadge(b.status) : e(b.status);
      var odNote = isOd ? ' <span class="pc-overdue">Quá hạn' + (b.overdueDays ? ' ' + b.overdueDays + ' ngày' : '') + '</span>' : '';
      var method = (BANCA.PAYMENT_INSTRUMENTS && BANCA.PAYMENT_INSTRUMENTS[b.method] || {}).label || b.method || '—';
      return '<tr class="' + (isOd ? 'pc-row-overdue' : '') + '"><td>' + e(b.period || b.date || '—') + '</td>' +
        '<td>' + e(b.dueDate || b.date || '—') + '</td>' +
        '<td style="text-align:right">' + vnd(b.amount) + '</td>' +
        '<td>' + e(method) + '</td>' +
        '<td>' + st + odNote + '</td></tr>';
    }).join('');
    return head + (extraHtml || '') +
      '<div class="card" style="padding:0;overflow-x:auto;"><table class="dtable"><thead>' + thead + '</thead><tbody>' + rows + '</tbody></table></div>';
  };

  // Tab Life Cycle — timeline + filter chips.
  BANCA.ui.pcLifecycle = function (events) {
    events = (events || []).filter(Boolean);
    if (!events.length) return BANCA.ui.emptyState('Chưa có sự kiện nào trên hợp đồng.');
    function kindOf(ev) {
      if (ev.kind) return ev.kind;
      var t = (ev.text || ev.action || '').toLowerCase();
      if (/thanh toán|phí|payment/.test(t)) return 'payment';
      if (/sửa đổi|endorse|thụ hưởng|tất toán/.test(t)) return 'endorsement';
      if (/bồi thường|tổn thất|claim/.test(t)) return 'claim';
      if (/email|sms|nhắc|thông báo|notif|tái tục/.test(t)) return 'notification';
      return 'other';
    }
    var qs = new URLSearchParams(location.search);
    var f = qs.get('lcf') || 'all';
    var chips = [['all', 'Tất cả'], ['payment', 'Thanh toán'], ['endorsement', 'Sửa đổi'], ['claim', 'Bồi thường'], ['notification', 'Thông báo']];
    var bar = '<div class="pc-lcfilter">' + chips.map(function (c) {
      var o = new URLSearchParams(location.search); o.set('tab', 'lifecycle'); o.set('lcf', c[0]);
      return '<a class="tabbar-tab' + (f === c[0] ? ' on' : '') + '" style="border:1px solid var(--line);border-radius:var(--radius-pill);" href="?' + o.toString() + '">' + e(c[1]) + '</a>';
    }).join('') + '</div>';
    var shown = events.filter(function (ev) { return f === 'all' || kindOf(ev) === f; });
    var rows = shown.length ? shown.map(function (ev) {
      return '<div class="pc-tl-row"><div class="pc-tl-dot">✓</div>' +
        '<div><div class="pc-tl-t">' + e(ev.text || ev.action || '') + '</div>' +
        '<div class="pc-tl-m">' + e(ev.at || '') + (ev.by ? ' · ' + e(ev.by) : '') +
        (ev.status ? ' · ' + e(ev.status) : '') + (ev.ref ? ' · <span class="code">' + e(ev.ref) + '</span>' : '') + '</div></div></div>';
    }).join('') : '<div class="pc-mini">Không có sự kiện thuộc nhóm này.</div>';
    return '<section class="pc-card"><h2>Dòng thời gian hợp đồng</h2>' + bar + rows + '</section>';
  };

  // Tab Chăm sóc khách hàng.
  BANCA.ui.pcCare = function (pol, cfg) {
    cfg = cfg || {};
    var care = BANCA.ui.pcComputeCare(pol);
    var kpis = BANCA.ui.statGrid([
      { label: 'Tình trạng hợp đồng', value: care.active ? 'Đang hiệu lực' : 'Không hiệu lực', tone: care.active ? 'positive' : 'danger', hint: care.active ? 'Còn ' + care.remainingDays + ' ngày' : '' },
      { label: 'Thanh toán', value: care.overdueCount ? 'Quá hạn' : care.paidPct + '%', tone: care.overdueCount ? 'danger' : 'positive', hint: care.overdueCount ? care.overdueCount + ' kỳ quá hạn' : 'Đã thu' },
      { label: 'Bồi thường', value: care.claimTotal + ' yêu cầu', hint: care.claimDone + ' hoàn tất · ' + care.claimOpen + ' đang xử lý' },
      { label: 'Sửa đổi bổ sung', value: care.srvTotal + ' yêu cầu', hint: care.srvOpen + ' đang xử lý' },
      { label: 'Tái tục', value: care.remainingDays + ' ngày', tone: care.remainingDays <= 120 ? 'warning' : 'default', hint: care.remainingDays <= 120 ? 'Nên nhắc tái tục' : 'Chưa tới hạn' }
    ], 5);
    var nbas = BANCA.ui.pcNextBestActions(pol, care);
    var nbaHtml = nbas.length ? nbas.map(function (a) {
      return '<div class="pc-nba"><span class="ic">' + a.ic + '</span><span>' + e(a.text) + '</span></div>';
    }).join('') : '<div class="pc-mini">Chưa có hành động đề xuất.</div>';

    var logs = BANCA.contactLogsOf ? BANCA.contactLogsOf(pol.id) : [];
    var logHtml = logs.length ? logs.map(function (l) {
      return '<div class="pc-ctlog"><span class="chip">' + e(l.channel || 'Liên hệ') + '</span>' +
        '<div><div class="pc-tl-t">' + e(l.note || '—') + '</div>' +
        '<div class="pc-tl-m">' + e(l.at || '') + (l.by ? ' · ' + e(l.by) : '') +
        (l.followUp ? ' · Hẹn: ' + e(l.followUp) : '') + '</div></div></div>';
    }).join('') : '<div class="pc-mini">Chưa có lịch sử liên hệ. Ghi nhận lần liên hệ đầu tiên với khách.</div>';

    var note = '<div class="alert2 info" style="margin:0 0 var(--space-md);">Nhật ký chăm sóc lưu tại Sales Portal, phục vụ RM theo dõi khách — không thay đổi hồ sơ khách ở hệ thống lõi.</div>';
    var addBtn = '<div class="pc-actions" style="margin:0 0 var(--space-md);"><button class="btn btn-primary btn-sm" onclick="BANCA.ui.postSale.openContactLog(\'' + pol.id + '\')">Ghi nhận liên hệ</button></div>';

    // Customer Care Snapshot — mốc tương tác gần nhất (suy từ log + timeline hợp đồng)
    var lastCall = logs.find(function (l) { return /gọi|call/i.test(l.channel || ''); });
    var lastEmail = logs.find(function (l) { return /email/i.test(l.channel || ''); });
    var lastSms = logs.find(function (l) { return /sms|zalo/i.test(l.channel || ''); });
    var evs = (cfg.timelineEvents || []).filter(Boolean);
    var dl = evs.filter(function (ev) { return /tải|download|gcn/i.test(ev.text || ev.action || ''); }).pop();
    function snapRow(k, v) { return '<div class="row"><span class="k">' + e(k) + '</span><span>' + (v ? e(v) : '—') + '</span></div>'; }
    var nba0 = nbas[0];
    var snapshot = '<div class="pc-snap">' +
      snapRow('Lần liên hệ gần nhất', logs[0] ? logs[0].at : null) +
      snapRow('Lần gọi điện', lastCall ? lastCall.at : null) +
      snapRow('Lần gửi Email', lastEmail ? lastEmail.at : null) +
      snapRow('Lần gửi SMS', lastSms ? lastSms.at : null) +
      snapRow('Lần tải GCN', dl ? dl.at : null) +
      snapRow('Lịch hẹn kế tiếp', (logs.find(function (l) { return l.followUp; }) || {}).followUp) +
      snapRow('Nhắc tái tục', care.remainingDays <= 120 ? 'Còn ' + care.remainingDays + ' ngày' : 'Chưa tới hạn') +
      snapRow('Next Action', nba0 ? nba0.text : 'Chưa có') +
      '</div>';

    return kpis +
      card('Snapshot chăm sóc', snapshot) +
      card('Hành động đề xuất (Next Best Action)', nbaHtml) +
      card('Nhật ký chăm sóc khách hàng', note + addBtn + logHtml);
  };

  // Modal ghi nhận liên hệ (Portal store).
  BANCA.ui.postSale.openContactLog = function (policyId) {
    var body = '<div class="alert2 danger" id="ps-error" style="display:none;margin:0 0 12px;"></div>' +
      field('Kênh liên hệ', '<select id="ct-channel"><option value="Gọi điện">Gọi điện</option><option value="Gặp trực tiếp">Gặp trực tiếp</option><option value="Email">Email</option><option value="SMS/Zalo">SMS/Zalo</option></select>') +
      field('Nội dung trao đổi', '<textarea id="ct-note" rows="3" placeholder="Tóm tắt nội dung đã trao đổi với khách"></textarea>') +
      field('Lịch hẹn / nhắc lại (tuỳ chọn)', '<input id="ct-follow" type="date">');
    modal('Ghi nhận liên hệ khách hàng', body,
      '<button class="btn btn-secondary" onclick="document.getElementById(\'post-sale-modal\').remove()">Hủy</button>' +
      '<button class="btn btn-primary" onclick="BANCA.ui.postSale.submitContactLog(\'' + policyId + '\')">Lưu</button>');
  };
  BANCA.ui.postSale.submitContactLog = function (policyId) {
    var note = val('ct-note');
    if (!note) { err('Nhập nội dung trao đổi trước khi lưu.'); return; }
    BANCA.postSale.addContactLog({ policyId: policyId, channel: val('ct-channel'), note: note, followUp: val('ct-follow') });
    var el = document.getElementById('post-sale-modal'); if (el) el.remove();
    reloadTo('care');
  };

  // ============================================================
  // policyCockpit — shell 6 tab. cfg:
  //   productId, packageName, kpis, backHref, actionBar
  //   overview {main, rail}   — khối riêng theo sản phẩm
  //   timelineEvents, documentsHtml, onCreateRequest, onNotifyClaim
  // ============================================================
  // Nhánh CS Workspace (Health) — 6 tab mới. cfg.csWorkspace===true.
  //   cfg.overviewCS { benefitChips, benefitDetailHtml, productInfoHtml, quickActions, paymentSummary, main }
  BANCA.ui.policyCockpitCS = function (pol, cfg) {
    var active = new URLSearchParams(location.search).get('tab') || 'overview';
    if (!BANCA.POLICY_TABS_CS.some(function (t) { return t.id === active; })) active = 'overview';
    function href(id) { var o = new URLSearchParams(location.search); o.set('tab', id); o.delete('lcf'); return '?' + o.toString(); }
    var counts = {
      endorsement: BANCA.serviceRequestsOf(pol.id).length,
      claims: BANCA.claimsOf(pol.id).length,
      care: (BANCA.contactLogsOf ? BANCA.contactLogsOf(pol.id).length : 0) || null
    };
    var tabs = BANCA.ui.tabBar(BANCA.POLICY_TABS_CS.map(function (t) {
      return { id: t.id, label: t.label, href: href(t.id), count: counts[t.id] || null };
    }), active);

    var drawers = '';
    var body;
    var ovc = cfg.overviewCS || {};
    if (active === 'overview') {
      var sec = '';
      var careOv = BANCA.ui.pcComputeCare(pol);
      // Renewal card (RM dùng nhiều) — nổi bật ngay Overview
      sec += '<div class="pc-renewal"><div><div class="pc-mini" style="margin:0;">🔄 Tái tục</div>' +
        '<div class="big">Còn ' + careOv.remainingDays + ' ngày</div>' +
        '<div class="pc-mini" style="margin:0;">Đến ' + e(pol.effectiveTo || '—') + '</div></div>' +
        (careOv.remainingDays <= 120
          ? '<button class="btn btn-primary btn-sm" onclick="BANCA.ui.postSale.openContactLog(\'' + pol.id + '\')">Đề nghị liên hệ khách</button>'
          : '<span class="pc-mini" style="margin:0;">Chưa tới kỳ nhắc tái tục</span>') + '</div>';
      // Thanh toán (summary giàu: %/quá hạn + số tiền + ngày + phương thức + txn)
      var ps = ovc.paymentSummary;
      if (ps) {
        sec += card('Thanh toán',
          '<div class="pc-paysum"><div><div class="n' + (ps.overdueDays ? ' pc-overdue' : '') + '">' +
          (ps.overdueDays ? 'Quá hạn ' + ps.overdueDays + ' ngày' : (ps.paidPct + '%')) + '</div><div class="l">' +
          (ps.overdueDays ? 'Cần nhắc khách thanh toán' : (ps.installment ? 'Đã đóng ' + ps.installment : 'Đã thanh toán')) + '</div></div>' +
          (ps.amount ? '<div><div class="n">' + e(ps.amount) + '</div><div class="l">' + e(ps.paidAt || '') + (ps.method ? ' · ' + e(ps.method) : '') + '</div></div>' : '') +
          (ps.nextDue ? '<div><div class="n">' + e(ps.nextAmount || '—') + '</div><div class="l">Kỳ tiếp theo · ' + e(ps.nextDue) + '</div></div>' : '') +
          (ps.txn ? '<div><div class="l">Mã giao dịch</div><div><span class="code">' + e(ps.txn) + '</span></div></div>' : '') + '</div>');
      }
      // Layout A (lean): 1 drawer RỘNG gộp Tài liệu + Điều khoản + Quyền lợi. Bỏ Thao tác nhanh, bỏ Tóm tắt quyền lợi riêng.
      var docBody = (ovc.productInfoHtml || '');
      if (docBody) {
        sec += '<div style="margin-bottom:var(--space-lg);"><button class="pc-expand" onclick="BANCA.ui.pcOpenDrawer(\'pc-dw-doc\')"><span>Tài liệu & điều khoản</span><span>▸</span></button></div>';
        drawers += BANCA.ui.pcDrawer('pc-dw-doc', 'Tài liệu & điều khoản', docBody, { wide: true });
      }
      // Người được BH — thẻ gọn (tên + badge + N quyền lợi + Xem chi tiết → drawer/người)
      var insBlock = '';
      if ((ovc.insureds || []).length) {
        insBlock = card((ovc.insureds.length > 1 ? 'Người được bảo hiểm (' + ovc.insureds.length + ')' : 'Người được bảo hiểm'),
          ovc.insureds.map(function (m, i) {
            var did = 'pc-dw-ins-' + i;
            var nfacts = (m.facts || []).length;
            drawers += BANCA.ui.pcDrawer(did, m.name || 'Người được bảo hiểm',
              '<div class="pc-insured-head"><b>' + e(m.name || '—') + '</b>' +
              (m.badges || []).map(function (b) { return '<span class="chip">' + e(b) + '</span>'; }).join('') + '</div>' +
              (m.meta ? '<div class="pc-insured-meta" style="margin-bottom:var(--space-md);">' + e(m.meta) + '</div>' : '') +
              (m.facts || []).map(function (f) { return '<div class="pc-kv"><div class="k">' + e(f[0]) + '</div><div class="v">' + (f[1] == null ? '—' : f[1]) + '</div></div>'; }).join(''));
            return '<div class="pc-ins-compact"><div><div class="pc-insured-head"><b>' + e(m.name || '—') + '</b>' +
              (m.badges || []).slice(0, 2).map(function (b) { return '<span class="chip">' + e(b) + '</span>'; }).join('') + '</div>' +
              (m.meta ? '<div class="pc-tl-m">' + e(m.meta) + '</div>' : '') + '</div>' +
              '<div style="text-align:right;"><div class="pc-mini" style="margin:0;">' + nfacts + ' quyền lợi</div>' +
              '<button class="btn btn-secondary btn-sm" onclick="BANCA.ui.pcOpenDrawer(\'' + did + '\')">Xem chi tiết</button></div></div>';
          }).join(''));
      }
      var mainBlock = insBlock + (ovc.main || '') + sec;
      body = ovc.rail
        ? '<div class="pc-grid"><main class="pc-main">' + mainBlock + '</main><aside class="pc-rail">' + ovc.rail + '</aside></div>'
        : '<div class="pc-main">' + mainBlock + '</div>';
    } else if (active === 'payment') {
      body = BANCA.ui.pcThuPhi(pol, cfg.paymentExtraHtml);
    } else if (active === 'lifecycle') {
      body = BANCA.ui.pcLifecycle(cfg.timelineEvents);
    } else if (active === 'endorsement') {
      body = BANCA.ui.serviceRequestList(pol, { productId: cfg.productId, onCreate: cfg.onCreateRequest, canRequest: pol.status === 'ACTIVE' });
    } else if (active === 'claims') {
      body = BANCA.ui.claimSummary(pol, { productId: cfg.productId, onNotify: cfg.onNotifyClaim });
    } else {
      body = BANCA.ui.pcCare(pol, cfg);
    }
    // KPI hero theo tư duy Policy Management (không phải Product): Hiệu lực·Thu phí·Bồi thường·Sửa đổi·Tái tục.
    var careH = BANCA.ui.pcComputeCare(pol);
    var csCfg = Object.assign({}, cfg, {
      kpis: [
        ['🟢 Hiệu lực', careH.active ? careH.remainingDays + ' ngày' : 'Không hiệu lực', (pol.effectiveFrom || '—') + ' → ' + (pol.effectiveTo || '—')],
        ['💰 Thu phí', careH.overdueCount ? 'Quá hạn' : (careH.paidPct + '%'), careH.overdueCount ? careH.overdueCount + ' kỳ quá hạn' : 'Đã thanh toán'],
        ['🧾 Bồi thường', careH.claimTotal + ' yêu cầu', careH.claimDone + ' hoàn tất · ' + careH.claimOpen + ' đang xử lý'],
        ['📝 Sửa đổi', careH.srvTotal + ' yêu cầu', careH.srvOpen + ' đang xử lý'],
        ['🔄 Tái tục', careH.remainingDays + ' ngày', careH.remainingDays <= 120 ? 'Nên nhắc tái tục' : 'Chưa tới hạn']
      ]
    });
    var hero = cfg.heroHtml != null ? cfg.heroHtml : BANCA.ui.policySummary(pol, csCfg);
    // Badge đồng bộ Insurance Core (mock demo) — Portal chỉ hiển thị trạng thái đồng bộ, không xử lý.
    var syncBadge = '<span class="pc-sync" title="Trạng thái đồng bộ từ hệ thống bảo hiểm lõi">● Insurance Core · Đồng bộ ' + e(cfg.syncedAgo || '2 phút trước') + '</span>';
    return BANCA.ui.pcCsStyles() + '<div class="policy-cockpit">' +
      '<div class="pc-top"><a href="' + e(cfg.backHref || 'index.html') + '" class="pc-back">&larr; Danh sách hợp đồng</a>' +
      '<span class="pc-top-right">' + syncBadge + (cfg.actionBar || '') + '</span></div>' + hero + tabs + body + drawers + '</div>';
  };

  BANCA.ui.policyCockpit = function (pol, cfg) {
    cfg = cfg || {};
    if (cfg.csWorkspace) return BANCA.ui.policyCockpitCS(pol, cfg);
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
      body = BANCA.ui.claimSummary(pol, { productId: cfg.productId, onNotify: cfg.onNotifyClaim });
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
