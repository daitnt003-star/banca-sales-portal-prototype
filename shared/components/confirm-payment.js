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

  // --- PaymentMethodCard (§9.3) — 1 NÚT / 1 phương thức, cùng nhãn + state cho mọi sản phẩm.
  // Mô tả và "phù hợp với" chuyển thành tooltip để khối thanh toán gọn, chỉ còn 3 nút.
  BANCA.ui.paymentMethodCard = function (m, cfg) {
    cfg = cfg || {};
    var blocked = m.blockedReason || cfg.blockedReason;
    var enabled = cfg.enabled && !blocked;
    var hint = enabled
      ? [m.desc, m.bestFor ? 'Phù hợp: ' + m.bestFor : ''].filter(Boolean).join(' — ')
      : (blocked || cfg.disabledHint || 'Chưa đủ điều kiện thanh toán');
    return '<button type="button" class="btn btn-primary pay-method-btn" title="' + e(hint) + '"' +
      (enabled ? ' onclick="' + (cfg.onclick || '') + '"' : ' disabled') + '>' +
      '<span aria-hidden="true">' + e(m.icon) + '</span> ' + e(m.label) +
      (enabled ? '' : ' — Chưa khả dụng') + '</button>';
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
    // Lý do khoá của TỪNG phương thức phải hiện thành chữ, không chỉ làm mờ nút (§15.3).
    var blockedNotes = methods.filter(function (m) { return m.blockedReason; })
      .map(function (m) { return m.label + ': ' + m.blockedReason; });
    return BANCA.ui.blockedReasons(gate.reasons) +
      '<div class="pay-method-grid">' + cards + '</div>' +
      (blockedNotes.length ? '<div class="pm-note pm-note--warn">⚠ ' + e(blockedNotes.join(' · ')) + '</div>' : '') +
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
      // inputId phải duy nhất khi có nhiều phiên trên cùng trang (mỗi người được bảo hiểm 1 phiên).
      var inputId = cfg.inputId || 'otp-code';
      body = '<div class="otp-entry">' +
        '<div><label class="otp-label" for="' + e(inputId) + '">Mã OTP khách cung cấp</label>' +
        '<input id="' + e(inputId) + '" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="______" aria-label="Mã OTP" aria-describedby="' + e(inputId) + '-error"></div>' +
        '<button class="btn btn-primary btn-sm"' + (cfg.onSubmit ? ' onclick="' + cfg.onSubmit + '"' : ' disabled') + '>Xác nhận mã</button>' +
        '</div>' +
        '<div class="otp-error" id="' + e(inputId) + '-error" role="alert"></div>' +
        '<div class="otp-meta">' +
        (cfg.sentAt ? '<span>Gửi lúc ' + e(cfg.sentAt) + '</span>' : '') +
        (cfg.expiry ? '<span>Hết hạn ' + e(cfg.expiry) + '</span>' : '') +
        (cfg.countdown ? '<span>Mã còn hiệu lực ' + e(cfg.countdown) + '</span>' : '') +
        (cfg.attemptsLeft != null ? '<span>Số lần thử còn lại: ' + e(cfg.attemptsLeft) + '</span>' : '') +
        (cfg.onResend ? '<button class="btn btn-secondary btn-sm" onclick="' + cfg.onResend + '">Gửi lại mã</button>' : '') +
        '</div>' +
        (cfg.link ? '<div class="otp-link">Liên kết đã gửi: <a href="' + e(cfg.link) + '">' + e(cfg.link) + '</a></div>' : '') +
        '<div class="otp-note">Khách hàng đọc mã, nhân viên tư vấn nhập giúp — không được xác nhận thay khách hàng.</div>';
    } else {
      // Customer self-service — seller chỉ theo dõi.
      body = '<div class="otp-selfserve">' +
        (cfg.link ? '<div class="otp-link">Liên kết đã gửi: <a href="' + e(cfg.link) + '">' + e(cfg.link) + '</a></div>' : '') +
        (cfg.blockedReasons && cfg.blockedReasons.length ? BANCA.ui.blockedReasons(cfg.blockedReasons, 'Chưa thể gửi xác nhận:') : '') +
        '<div class="otp-meta">' +
        (cfg.sentAt ? '<span>Gửi lúc ' + e(cfg.sentAt) + '</span>' : '') +
        (cfg.expiry ? '<span>Hết hạn ' + e(cfg.expiry) + '</span>' : '') +
        (st === 'PENDING' && cfg.onSend ? '<button class="btn btn-primary btn-sm" onclick="' + cfg.onSend + '">Gửi yêu cầu xác nhận</button>' : '') +
        (cfg.onResend ? '<button class="btn btn-secondary btn-sm" onclick="' + cfg.onResend + '">' +
          (st === 'EXPIRED' ? 'Gửi lại yêu cầu xác nhận' : 'Gửi lại') + '</button>' : '') +
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

  // ============================================================
  // ConfirmationPaymentPanel (§9.3) — MỘT thành phần cho cả Motor và Health.
  // Sở hữu THỨ TỰ và ĐÁNH SỐ của các phần bắt buộc, để 2 sản phẩm không thể
  // trôi lệch bố cục theo thời gian. Trang chỉ cung cấp nội dung từng phần.
  //   1 Thông tin khách xác nhận (gồm điều khoản/loại trừ + trạng thái OTP)
  //   2 Phí cần thanh toán + cách thanh toán; sau khi tạo yêu cầu thì chính khối này
  //     mang trạng thái của yêu cầu (mã QR / liên kết / tạo lại) — không tách mục riêng.
  //   3 Lịch sử thanh toán
  // Trạng thái phát hành KHÔNG nằm trong panel này: bước "Phát hành hợp đồng" của
  // workspace sau nộp đã sở hữu nội dung đó (quyết định user, 2026-07-28).
  // ============================================================
  BANCA.ui.cpCard = function (num, title, inner, sub) {
    return '<section class="card cp-card">' +
      '<div class="cp-card-head"><span class="cp-num">' + num + '</span>' +
      '<b class="cp-title">' + e(title) + '</b>' +
      (sub ? '<span class="cp-sub">· ' + e(sub) + '</span>' : '') + '</div>' +
      inner + '</section>';
  };

  BANCA.ui.confirmationPaymentPanel = function (app, cfg) {
    cfg = cfg || {};
    var C = BANCA.ui.cpCard;
    var out = '';
    var feeAndMethods = (cfg.feeHtml || '') +
      (cfg.methodsHtml
        ? '<div class="cp-methods"><div class="label">' + e(cfg.methodsLabel || 'Cách thanh toán') + '</div>' + cfg.methodsHtml + '</div>'
        : '');
    out += C(1, 'Xác nhận khách hàng', cfg.confirmHtml || '');
    out += C(2, 'Phí và cách thanh toán', feeAndMethods);
    out += C(3, 'Lịch sử thanh toán', cfg.historyHtml || '');
    return '<div class="confirmation-payment-panel">' + out + '</div>';
  };

  // Trạng thái phát hành rút gọn — dùng khi trang không truyền khối riêng.
  BANCA.ui.issueStatusBlock = function (app) {
    var s = BANCA.caseStates(app);
    var map = {
      NOT_STARTED: ['Chưa phát hành', 'info', 'Hợp đồng sẽ được phát hành sau khi thanh toán thành công.'],
      ISSUING: ['Đang phát hành', 'warn', 'Hệ thống nghiệp vụ đang phát hành hợp đồng và giấy chứng nhận.'],
      ISSUED: ['Đã phát hành', 'ok', 'Hợp đồng và giấy chứng nhận đã được phát hành.'],
      ISSUE_FAILED: ['Phát hành lỗi', 'danger', 'Đã thu tiền nhưng phát hành lỗi — thử lại hoặc chuyển hỗ trợ, KHÔNG thu lại của khách.']
    };
    var m = map[s.policyStatus] || map.NOT_STARTED;
    var cls = { ok: 'badge-ready', warn: 'badge-pending', danger: 'badge-blocked', info: 'badge-conditional' }[m[1]];
    return '<div class="alert2 ' + (m[1] === 'ok' ? 'info' : m[1]) + '" style="margin:0;">' +
      '<span class="badge ' + cls + '">' + e(m[0]) + '</span> ' + e(m[2]) +
      (app.policyId ? ' <b>' + e(app.policyId) + '</b>' : '') + '</div>';
  };

  // --- DocumentChecklist (§10 §14) — 1 checklist DÙNG CHUNG mọi bước/sản phẩm.
  // Bọc quanh BANCA.docItemHtml (DocumentItem chung). OCR KHÔNG có section riêng:
  // tài liệu đã bóc tách nằm cùng danh sách, chỉ khoá thay thế + có chip trạng thái OCR.
  /* ============================================================
   * BẢN KHAI — hai khối dùng CHUNG cho cả hồ sơ nháp và hồ sơ đã nộp.
   *
   * Đặt ở đây, KHÔNG đặt trong app-workspace.js: hai nhánh nháp/đã-nộp của
   * file đó tách nhau bằng `return`, nên hàm khai trong nhánh nháp thì nhánh
   * đã-nộp không thấy. Trước đó còn một lỗi nữa — hàm gán bằng
   * `window.x = function` NẰM SAU chỗ dựng HTML, nên lúc render nó vẫn
   * undefined và guard `window.x ? ... : ''` âm thầm trả về rỗng: khối không
   * bao giờ hiện, không báo lỗi gì.
   * ============================================================ */
  function _declFmt(v) {
    if (v === true) return 'Có';
    if (v === false) return 'Không';
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }

  // Đọc lại bản khai cho khách nghe trước khi xác nhận [CII IF3 2/4].
  BANCA.ui.declarationReadBack = function (app) {
    if (!BANCA.statementOfFact || !BANCA.riskQuestionsFor) return '';
    if (!((BANCA.riskQuestionsFor((app || {}).productId) || []).length)) return '';
    var sof = BANCA.statementOfFact.build(app);
    var lines = sof.lines.filter(function (l) { return l.applicable; });
    if (!lines.length) return '';
    var rows = lines.map(function (l) {
      return '<tr><td style="font-size:12px;">' + e(l.label) + '</td>' +
        '<td style="font-size:12px;font-weight:600;white-space:nowrap;">' + e(_declFmt(l.answer)) + '</td>' +
        '<td style="font-size:11px;white-space:nowrap;color:' + (l.answeredBy ? 'var(--ink-500)' : 'var(--red-600)') + ';">' +
        e(l.answeredByLabel || 'chưa ghi ai trả lời') + '</td></tr>';
    }).join('');
    var missingBy = sof.unattributed.length;
    return '<div class="card decl-readback" style="padding:16px;margin-top:12px;' +
      (missingBy ? 'border-left:4px solid var(--red-600);' : '') + '">' +
      '<div class="label" style="margin-bottom:6px;">Đọc lại bản khai cho khách xác nhận</div>' +
      '<div style="font-size:12px;color:var(--ink-500);margin-bottom:10px;">' +
      'Đây là nội dung sẽ ràng buộc hợp đồng. Đọc lại từng câu cho khách nghe trước khi ghi nhận xác nhận.</div>' +
      '<div style="overflow-x:auto;"><table class="dtable"><thead><tr><th>Câu hỏi</th><th>Trả lời</th><th>Ai trả lời</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      (missingBy ? '<div class="alert2 danger" style="margin-top:10px;">Còn ' + missingBy +
        ' câu chưa ghi nhận ai trả lời — chọn ở khối "Ai trả lời các câu khai báo này?".</div>' : '') +
      '</div>';
  };

  // Chọn NGƯỜI đưa ra câu trả lời. Hệ thống không được tự đoán [CII IF3 2/4]:
  // khách tự khai và nhân viên nhập hộ dẫn tới hậu quả khác nhau khi tranh chấp.
  // opts.handler — tên hàm window xử lý (nháp và đã-nộp dùng hai hàm khác nhau).
  // opts.bare    — chỉ render hai nút, không kèm khung giải thích.
  BANCA.ui.declarationSourcePicker = function (app, opts) {
    opts = opts || {};
    app = app || {};
    if (!BANCA.riskQuestionsFor || !((BANCA.riskQuestionsFor(app.productId) || []).length)) return '';
    var handler = opts.handler || 'setDeclarationSource';
    var cur = app.declarationAnsweredBy || null;
    var dis = opts.readOnly ? ' disabled' : '';
    function b(code, label, desc) {
      var on = cur === code;
      return '<button type="button" class="btn ' + (on ? 'btn-primary' : 'btn-secondary') + ' btn-sm"' + dis +
        ' onclick="' + handler + '(\'' + e(app.id) + '\',\'' + code + '\')"' +
        // min-width cứng 210px làm nút không co được trên điện thoại → chữ mô tả
        // tràn ra ngoài khung và đẩy cả trang. Dùng min() để nút co theo màn.
        ' style="text-align:left;flex:1 1 210px;min-width:min(210px,100%);max-width:100%;' +
        'display:block;white-space:normal;">' +
        '<b>' + label + '</b><div style="font-size:11px;font-weight:400;opacity:.85;overflow-wrap:anywhere;">' +
        desc + '</div></button>';
    }
    var buttons = '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      b('CUSTOMER', 'Khách tự trả lời', 'Khách trực tiếp đọc và trả lời từng câu') +
      b('SELLER_ON_BEHALF', 'Nhân viên nhập hộ', 'Nhân viên nhập theo lời khách, đã đọc lại cho khách nghe') +
      '</div>';
    if (opts.bare) {
      return '<div class="decl-source-picker" style="margin-top:12px;">' +
        '<div class="label" style="margin-bottom:6px;">Ai đã trả lời các câu này?</div>' + buttons + '</div>';
    }
    return '<div class="card decl-source-picker" style="padding:14px;margin-bottom:10px;' +
      (cur ? '' : 'border-left:4px solid var(--amber-600);') + '">' +
      '<div class="label" style="margin-bottom:6px;">Ai trả lời các câu khai báo này? ' +
      (cur ? '' : '<span class="badge badge-blocked">Bắt buộc</span>') + '</div>' +
      '<div style="font-size:12px;color:var(--ink-500);margin-bottom:10px;">' +
      'Bản khai là cơ sở để doanh nghiệp bảo hiểm chấp nhận rủi ro. Khi có tranh chấp, khách tự khai hay nhân viên nhập hộ ' +
      'dẫn tới hậu quả khác nhau — nên phải ghi lại, không được mặc định.</div>' + buttons +
      (cur ? '' : '<div class="alert2 warn" style="margin:10px 0 0;">Chưa chọn thì không thu được phí — bản khai không xác định được ai chịu trách nhiệm về nội dung.</div>') +
      '</div>';
  };

  BANCA.ui.documentChecklist = function (cfg) {
    cfg = cfg || {};
    var items = cfg.items || [];
    var required = items.filter(function (d) { return d.required; });
    var done = required.filter(function (d) { return d.uploaded; });
    var missing = required.filter(function (d) { return !d.uploaded; });
    var legend = '<div class="card doc-legend" id="' + (cfg.legendId || 'doc-legend') + '">' +
      '<div>Tài liệu bắt buộc: <b style="color:' + (missing.length ? 'var(--red-600)' : 'var(--teal-600)') + ';">' +
      done.length + '/' + required.length + '</b>' +
      (missing.length ? ' · còn thiếu: ' + e(missing.map(function (d) { return d.name; }).join(', ')) : ' · đã đủ') +
      '</div></div>';
    var list = items.length
      ? '<div class="card" style="padding:0;overflow:hidden;">' +
        items.map(function (d) { return BANCA.docItemHtml(cfg.appId, d); }).join('') + '</div>'
      : BANCA.ui.emptyState(cfg.empty || 'Không có tài liệu bắt buộc.');
    return (cfg.showLegend === false ? '' : legend) + (cfg.headerHtml || '') + list;
  };

  // --- UnderwritingStatusPanel (§9.1) — 1 panel cho mọi UW mode ---
  // STP không hiện khối manual underwriting (§15.2 progressive disclosure).
  BANCA.ui.underwritingStatusPanel = function (app, cfg) {
    cfg = cfg || {};
    var s = cfg.state || BANCA.caseStates(app);
    var mode = s.underwritingMode;
    var dec = s.underwritingDecision;
    var decLabel = cfg.decisionLabel || (BANCA.UNDERWRITING_DECISION_ENUM[dec] || {}).label || '—';
    var stLabel = cfg.statusLabel || (BANCA.UNDERWRITING_STATUS[s.underwritingStatus] || {}).label || 'Chờ thẩm định';
    var withTerms = BANCA.isApprovedWithTerms ? BANCA.isApprovedWithTerms(dec) : dec === 'APPROVED_WITH_CONDITION';
    var tone = dec === 'DECLINED' ? 'danger'
      : withTerms ? 'info'
        : ['APPROVED', 'APPROVED_STP'].indexOf(dec) >= 0 ? 'ok' : 'wait';
    var toneColor = { ok: 'var(--teal-600)', wait: 'var(--amber-600)', info: 'var(--brand-600)', danger: 'var(--red-600)' }[tone];

    var head = '<div class="uw-head" style="border-left:4px solid ' + toneColor + ';">' +
      '<div><b style="color:' + toneColor + ';">' + e(stLabel) + '</b>' +
      (dec !== 'NONE' ? ' · <span>' + e(decLabel) + '</span>' : '') + '</div>' +
      '<div class="uw-mode">Chế độ thẩm định: ' + e(mode === 'STP' ? 'Tự động (STP)' : 'Thẩm định viên') + '</div></div>';

    // STP đã duyệt → không hiện khối manual UW.
    var manual = '';
    if (mode !== 'STP' || withTerms || s.underwritingStatus === 'NEED_MORE_INFORMATION') {
      manual = (cfg.requirements && cfg.requirements.length
        ? '<div class="uw-block"><div class="label">Yêu cầu bổ sung</div>' + BANCA.ui.requirementList(cfg.requirements) + '</div>' : '') +
        BANCA.ui.conditionAcceptance({ conditions: cfg.conditions, accepted: cfg.conditionAccepted, onSend: cfg.onSendCondition });
    }
    var reason = (app.uw && app.uw.reason) ? '<div class="uw-reason">Lý do: ' + e(app.uw.reason) + '</div>' : '';
    return '<div class="uw-panel">' + head + reason + manual + '</div>';
  };
})();
