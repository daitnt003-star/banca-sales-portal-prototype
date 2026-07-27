// ============================================================
// §9 §14 — Xác nhận, thẩm định & thanh toán: COMPONENT DÙNG CHUNG.
// Motor và Health gọi CÙNG các hàm dưới đây; khác biệt chỉ đến từ
// dữ liệu (app) + config (payment-method-config, journey-registry).
// KHÔNG tạo motor-payment-card / health-payment-card (§3.2).
//
// Cung cấp:
//   blockedReasons        — khối "vì sao CTA bị khoá" (§15.3, AC11)
//   paymentMethodCard     — 1 card / 1 phương thức, cùng style+icon+CTA+state
//   paymentMethodGroup    — 3 phương thức hiển thị TRỰC TIẾP, không modal chọn (§9.3)
//   feeDueSummary         — phí cần thanh toán + breakdown khớp tổng
//   paymentHistory        — lịch sử giao dịch
//   otpVerificationPanel  — 1 component, 2 mode SELLER_ASSISTED / CUSTOMER_SELF_SERVICE (§9.4)
//   underwritingStatusPanel / requirementList / conditionAcceptance (§9.1)
// ============================================================
window.BANCA = window.BANCA || {};
BANCA.ui = BANCA.ui || {};

(function () {
  var e = BANCA.ui._esc;
  function vnd(n) { return BANCA.vnd ? BANCA.vnd(n || 0) : String(n || 0); }

  // --- Lý do CTA bị khoá (§15.3) — disabled KHÔNG BAO GIỜ chỉ đổi màu xám ---
  BANCA.ui.blockedReasons = function (reasons, title) {
    reasons = (reasons || []).filter(Boolean);
    if (!reasons.length) return '';
    var items = reasons.map(function (r) { return '<li>' + e(r) + '</li>'; }).join('');
    return '<div class="alert2 warn blocked-reasons" style="margin:0 0 12px;">' +
      '<b>' + e(title || 'Chưa thể thực hiện:') + '</b>' +
      '<ul style="margin:6px 0 0;padding-left:18px;">' + items + '</ul></div>';
  };

  // --- PaymentMethodCard (§9.3) — CÙNG layout/icon/CTA/state cho mọi sản phẩm ---
  BANCA.ui.paymentMethodCard = function (m, cfg) {
    cfg = cfg || {};
    var blocked = m.blockedReason || cfg.blockedReason;
    var enabled = cfg.enabled && !blocked;
    var cls = 'pay-method' + (enabled ? '' : ' is-disabled');
    var btn = enabled
      ? '<button class="btn btn-primary btn-sm" onclick="' + (cfg.onclick || '') + '">Bắt đầu</button>'
      : '<button class="btn btn-primary btn-sm" disabled title="' + e(blocked || cfg.disabledHint || 'Chưa đủ điều kiện thanh toán') + '">Chưa khả dụng</button>';
    return '<div class="' + cls + '">' +
      '<div class="pm-icon" aria-hidden="true">' + e(m.icon) + '</div>' +
      '<b class="pm-title">' + e(m.label) + '</b>' +
      '<div class="pm-desc">' + e(m.desc) + '</div>' +
      '<div class="pm-best">Phù hợp: ' + e(m.bestFor) + '</div>' +
      (blocked ? '<div class="pm-blocked">⚠ ' + e(blocked) + '</div>' : '') +
      btn + '</div>';
  };

  // --- PaymentMethodGroup (§9.3) — 3 phương thức HIỂN THỊ TRỰC TIẾP, không mở modal để chọn ---
  BANCA.ui.paymentMethodGroup = function (app, cfg) {
    cfg = cfg || {};
    var gate = cfg.gate || (BANCA.paymentEnableRule ? BANCA.paymentEnableRule(app) : { enabled: false, reasons: [] });
    var methods = BANCA.paymentMethodsFor(app, cfg);
    var cards = methods.map(function (m) {
      return BANCA.ui.paymentMethodCard(m, {
        enabled: gate.enabled,
        onclick: cfg.onPick ? cfg.onPick(m) : "openPayFlow('" + m.experience + "')"
      });
    }).join('');
    return BANCA.ui.blockedReasons(gate.reasons) +
      '<div class="pay-method-grid">' + cards + '</div>' +
      '<div class="pm-note">Chưa tạo yêu cầu thanh toán cho tới khi xác nhận cấu hình trong từng cách.</div>';
  };

  // --- FeeDueSummary (§9.3) — tổng phí / đã trả / còn lại + breakdown ---
  // lines = [[label, amount, '+'|'−'], …]; tự chốt lệch để breakdown LUÔN khớp tổng (AC09).
  BANCA.ui.feeDueSummary = function (cfg) {
    cfg = cfg || {};
    var total = cfg.total || 0, paid = cfg.paid || 0;
    var remaining = Math.max(0, total - paid);
    var lines = (cfg.lines || []).slice();
    var sum = lines.reduce(function (a, l) { return a + (l[2] === '−' ? -l[1] : l[1]); }, 0);
    if (sum !== total) { var d = total - sum; lines.push(['Điều chỉnh', Math.abs(d), d < 0 ? '−' : '+']); }
    var lineHtml = lines.map(function (l) {
      return '<div class="fee-line' + (l[2] === '−' ? ' is-credit' : '') + '"><span>' + (l[2] === '−' ? '− ' : '+ ') + e(l[0]) + '</span><span>' + vnd(l[1]) + '</span></div>';
    }).join('');
    function chip(k, v, c) {
      return '<div class="fee-chip"><div class="fee-chip-k">' + e(k) + '</div><div class="fee-chip-v" style="color:' + c + ';">' + v + '</div></div>';
    }
    return '<div class="fee-chips">' +
      chip('Tổng phí', vnd(total), 'var(--brand-600)') +
      chip('Đã thanh toán', vnd(paid), paid > 0 ? 'var(--teal-600)' : 'var(--ink-900)') +
      chip('Còn phải thanh toán', vnd(remaining), remaining > 0 ? 'var(--amber-600)' : 'var(--teal-600)') +
      '</div>' +
      '<div class="fee-breakdown"><div class="label" style="margin-bottom:6px;">Chi tiết phí (breakdown)</div>' +
      lineHtml +
      '<div class="fee-total"><span>Tổng phí</span><span>' + vnd(total) + '</span></div>' +
      (cfg.extraHtml || '') + '</div>';
  };

  // --- PaymentHistory (§9.3) ---
  BANCA.ui.paymentHistory = function (txns, cfg) {
    cfg = cfg || {};
    txns = (txns || []).filter(Boolean);
    if (!txns.length) return BANCA.ui.emptyState('Chưa có giao dịch thanh toán.');
    var cols = [
      { label: 'Mã giao dịch', cell: function (t) { return e(t.gatewayTransactionId || t.gatewayReference || t.merchantReference || t.paymentId || '—'); } },
      { label: 'Cách thanh toán', cell: function (t) { return e(BANCA.paymentMethodLabel(t)); } },
      { label: 'Người thanh toán', cell: function (t) { return e(t.payerName || cfg.payerFallback || '—'); } },
      { label: 'Thời gian', cell: function (t) { return e(t.paidAt || t.createdAt || '—'); } },
      { label: 'Số tiền', align: 'right', cell: function (t) { return vnd(t.amount); } },
      { label: 'Trạng thái', cell: function (t) { return BANCA.paymentBadge ? BANCA.paymentBadge(t.status) : e(t.status); } },
      { label: 'Tham chiếu', cell: function (t) { return e(t.merchantReference || t.gatewayReference || '—'); } }
    ];
    return BANCA.ui.dataTable(cols, txns, { rowClick: cfg.rowClick, rowClickJs: cfg.rowClickJs });
  };

  // Nhãn phương thức — đọc từ config tập trung, không map rời trong page.
  BANCA.paymentMethodLabel = function (pay) {
    if (!pay) return '—';
    var m = (BANCA.PAYMENT_METHODS || []).find(function (x) {
      return x.experience === pay.paymentExperience || x.id === pay.paymentChannel;
    });
    if (m) return m.label;
    return (BANCA.PAYMENT_EXPERIENCES[pay.paymentExperience] || {}).label ||
      (BANCA.PAYMENT_CHANNELS[pay.paymentChannel] || {}).label || pay.paymentChannel || '—';
  };

  // --- OtpVerificationPanel (§9.4) — 1 COMPONENT, 2 MODE. Chỉ đổi ACTOR, không đổi journey.
  // mode: 'SELLER_ASSISTED'  → seller nhập OTP khách đọc; có countdown/gửi lại/số lần thử.
  //       'CUSTOMER_SELF_SERVICE' → gửi link, khách tự xác nhận, seller chỉ theo dõi.
  // TUYỆT ĐỐI không render nút "tự xác nhận thay khách" ở mode SELLER_ASSISTED.
  BANCA.ui.otpVerificationPanel = function (cfg) {
    cfg = cfg || {};
    var mode = cfg.mode || 'SELLER_ASSISTED';
    var st = cfg.status || 'PENDING';           // PENDING | SENT | VERIFIED | EXPIRED
    var done = st === 'VERIFIED';
    var head = '<div class="otp-head"><b>Xác nhận của khách hàng</b>' +
      '<span class="badge ' + (done ? 'badge-ready' : st === 'SENT' ? 'badge-pending' : 'badge-conditional') + '">' +
      e({ PENDING: 'Chưa gửi', SENT: 'Đã gửi — chờ khách', VERIFIED: 'Đã xác nhận', EXPIRED: 'Hết hạn' }[st] || st) + '</span></div>';

    var who = '<div class="otp-row"><span class="otp-k">Người xác nhận</span><span class="otp-v">' + e(cfg.customerName || '—') + '</span></div>' +
      '<div class="otp-row"><span class="otp-k">Số điện thoại</span><span class="otp-v">' + e(cfg.maskedPhone || '—') + '</span></div>';

    var body;
    if (done) {
      body = '<div class="alert2" style="margin:8px 0 0;background:var(--teal-100);color:var(--teal-600);">✓ Khách đã xác nhận lúc ' + e(cfg.confirmedAt || '—') + '</div>';
    } else if (mode === 'SELLER_ASSISTED') {
      // Seller nhập mã khách đọc — KHÔNG có nút tự xác nhận thay khách.
      body = '<div class="otp-entry">' +
        '<label class="otp-label" for="otp-code">Mã OTP khách cung cấp</label>' +
        '<input id="otp-code" class="otp-input" inputmode="numeric" maxlength="6" placeholder="______" aria-label="Mã OTP">' +
        '<button class="btn btn-primary btn-sm"' + (cfg.onSubmit ? ' onclick="' + cfg.onSubmit + '"' : ' disabled') + '>Xác nhận mã</button>' +
        '</div>' +
        '<div class="otp-meta">' +
        (cfg.countdown ? '<span>Mã còn hiệu lực ' + e(cfg.countdown) + '</span>' : '') +
        (cfg.attemptsLeft != null ? '<span>Số lần thử còn lại: ' + e(cfg.attemptsLeft) + '</span>' : '') +
        (cfg.onResend ? '<button class="btn btn-secondary btn-sm" onclick="' + cfg.onResend + '">Gửi lại mã</button>' : '') +
        '</div>' +
        '<div class="otp-note">Nhân viên tư vấn không được xác nhận thay khách hàng.</div>';
    } else {
      // Customer self-service — seller chỉ theo dõi.
      body = '<div class="otp-selfserve">' +
        (cfg.link ? '<div class="otp-link">Liên kết đã gửi: <a href="' + e(cfg.link) + '">' + e(cfg.link) + '</a></div>' : '') +
        '<div class="otp-meta">' +
        (cfg.sentAt ? '<span>Gửi lúc ' + e(cfg.sentAt) + '</span>' : '') +
        (cfg.expiry ? '<span>Hết hạn ' + e(cfg.expiry) + '</span>' : '') +
        (cfg.onResend ? '<button class="btn btn-secondary btn-sm" onclick="' + cfg.onResend + '">Gửi lại</button>' : '') +
        '</div>' +
        '<div class="otp-note">Khách tự xác nhận trên liên kết — nhân viên tư vấn chỉ theo dõi trạng thái.</div>' +
        '</div>';
    }
    return '<div class="otp-panel mode-' + e(mode) + '">' + head + who + body + '</div>';
  };

  // --- RequirementList (§9.1) — yêu cầu bổ sung từ thẩm định ---
  BANCA.ui.requirementList = function (items) {
    items = items || [];
    if (!items.length) return '';
    return '<ul class="req-list">' + items.map(function (it) {
      var st = it.status || 'PENDING';
      var cls = st === 'DONE' ? 'ok' : st === 'OVERDUE' ? 'danger' : 'wait';
      return '<li class="req-item ' + cls + '"><span class="req-t">' + e(it.label || it) + '</span>' +
        (it.due ? '<span class="req-due">hạn ' + e(it.due) + '</span>' : '') +
        (it.note ? '<div class="req-note">' + e(it.note) + '</div>' : '') + '</li>';
    }).join('') + '</ul>';
  };

  // --- ConditionAcceptance (§9.1) — điều kiện/loại trừ khách phải chấp nhận ---
  BANCA.ui.conditionAcceptance = function (cfg) {
    cfg = cfg || {};
    var conds = cfg.conditions || [];
    if (!conds.length) return '';
    var accepted = !!cfg.accepted;
    return '<div class="cond-accept' + (accepted ? ' is-accepted' : '') + '">' +
      '<div class="cond-head"><b>Điều kiện / loại trừ cần khách chấp nhận</b>' +
      (accepted ? '<span class="badge badge-ready">Khách đã chấp nhận</span>' : '<span class="badge badge-conditional">Chờ khách chấp nhận</span>') + '</div>' +
      '<ul class="cond-list">' + conds.map(function (c) {
        return '<li><b>' + e(c.type || 'Điều kiện') + ':</b> ' + e(c.text || c) + '</li>';
      }).join('') + '</ul>' +
      (!accepted && cfg.onSend ? '<button class="btn btn-primary btn-sm" onclick="' + cfg.onSend + '">Gửi khách xác nhận điều kiện</button>' : '') +
      '</div>';
  };

  // --- UnderwritingStatusPanel (§9.1) — 1 panel cho mọi UW mode ---
  // STP không hiện khối manual underwriting (§15.2 progressive disclosure).
  BANCA.ui.underwritingStatusPanel = function (app, cfg) {
    cfg = cfg || {};
    var s = BANCA.caseStates(app);
    var mode = s.underwritingMode;
    var dec = s.underwritingDecision;
    var decLabel = (BANCA.UNDERWRITING_DECISION_ENUM[dec] || {}).label || '—';
    var stLabel = (BANCA.UNDERWRITING_STATUS[s.underwritingStatus] || {}).label || s.underwritingStatus;
    var tone = dec === 'DECLINED' ? 'danger'
      : dec === 'APPROVED_WITH_CONDITION' ? 'info'
        : ['APPROVED', 'APPROVED_STP'].indexOf(dec) >= 0 ? 'ok' : 'wait';
    var toneColor = { ok: 'var(--teal-600)', wait: 'var(--amber-600)', info: 'var(--brand-600)', danger: 'var(--red-600)' }[tone];

    var head = '<div class="uw-head" style="border-left:4px solid ' + toneColor + ';">' +
      '<div><b style="color:' + toneColor + ';">' + e(stLabel) + '</b>' +
      (dec !== 'NONE' ? ' · <span>' + e(decLabel) + '</span>' : '') + '</div>' +
      '<div class="uw-mode">Chế độ thẩm định: ' + e(mode === 'STP' ? 'Tự động (STP)' : 'Thẩm định viên') + '</div></div>';

    // STP đã duyệt → không hiện khối manual UW.
    var manual = '';
    if (mode !== 'STP' || dec === 'APPROVED_WITH_CONDITION' || s.underwritingStatus === 'NEED_MORE_INFORMATION') {
      manual = (cfg.requirements && cfg.requirements.length
        ? '<div class="uw-block"><div class="label">Yêu cầu bổ sung</div>' + BANCA.ui.requirementList(cfg.requirements) + '</div>' : '') +
        BANCA.ui.conditionAcceptance({ conditions: cfg.conditions, accepted: cfg.conditionAccepted, onSend: cfg.onSendCondition });
    }
    var reason = (app.uw && app.uw.reason) ? '<div class="uw-reason">Lý do: ' + e(app.uw.reason) + '</div>' : '';
    return '<div class="uw-panel">' + head + reason + manual + '</div>';
  };
})();
