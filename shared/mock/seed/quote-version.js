// ============================================================
// Quote versioning (§7.3 + §8.3) — quote đã duyệt KHÔNG mutate; clone version mới.
// Cấm sửa premium tay. Policy ref đúng version khách đã xác nhận.
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.quoteVersion = {
  // Tạo version đầu tiên cho application.
  init: function (app, premium) {
    app.quoteVersions = app.quoteVersions || [];
    if (!app.quoteVersions.length) {
      var v = BANCA.quoteVersion._make(1, premium, 'DRAFT');
      app.quoteVersions.push(v);
      app.activeQuoteVersionId = v.id;
    }
    return app;
  },
  _make: function (n, premium, status) {
    return {
      id: 'QV-' + n,
      version: n,
      status: status || 'DRAFT',          // DRAFT | APPROVED | SUPERSEDED
      premium: premium || null,
      ratedAt: new Date().toISOString(),
      approvedAt: null,
      supersededAt: null
    };
  },
  active: function (app) {
    return (app.quoteVersions || []).find(function (v) { return v.id === app.activeQuoteVersionId; }) || null;
  },
  // Data ảnh hưởng phí đổi trên quote ĐÃ DUYỆT → clone version mới, version cũ → SUPERSEDED.
  reRate: function (app, newPremium, reason) {
    app.quoteVersions = app.quoteVersions || [];
    var cur = BANCA.quoteVersion.active(app);
    if (cur && cur.status === 'APPROVED') {
      cur.status = 'SUPERSEDED';
      cur.supersededAt = new Date().toISOString();
      var n = app.quoteVersions.length + 1;
      var nv = BANCA.quoteVersion._make(n, newPremium, 'DRAFT');
      nv.reRateReason = reason || 'Thay đổi dữ liệu ảnh hưởng phí';
      app.quoteVersions.push(nv);
      app.activeQuoteVersionId = nv.id;
      // Version mới là DRAFT → phải duyệt lại trước khi thu tiền (§8.3 + §9.2).
      // Nếu không reset, quote đã SUPERSEDED vẫn cho thanh toán.
      app.activeQuoteApproved = false;
    } else if (cur) {
      // draft chưa duyệt → cập nhật tại chỗ (chưa immutable)
      cur.premium = newPremium; cur.ratedAt = new Date().toISOString();
    }
    app.warningFlags = app.warningFlags || [];
    if (app.warningFlags.indexOf('QUOTE_NEED_RERATE') < 0) app.warningFlags.push('QUOTE_NEED_RERATE');
    return app;
  },
  approve: function (app) {
    var cur = BANCA.quoteVersion.active(app);
    if (cur) { cur.status = 'APPROVED'; cur.approvedAt = new Date().toISOString(); }
    app.activeQuoteApproved = true;
    return app;
  },
  // Premium chỉ đến từ rating strategy — chặn chỉnh tay (§8.3).
  setPremiumManual: function () { throw new Error('Không cho phép chỉnh sửa phí thủ công — phí do rating engine tính.'); },

  // ĐÓNG BĂNG KHI NỘP HỒ SƠ.
  // Trước đây quoteVersions chỉ được khởi tạo trong luồng sửa nháp và không hồ sơ
  // nào mang nó, nên nhánh "phiên báo giá hiện tại chưa được duyệt" trong
  // paymentEnableRule KHÔNG BAO GIỜ chạy — chốt chặn có mà không hoạt động.
  // Nộp hồ sơ = chốt giá đã chào khách ⇒ v1 APPROVED. Về sau phí đổi (phụ phí sau
  // thẩm định, sửa dữ liệu) thì reRate đẩy sang v2 DRAFT và cổng thanh toán đóng
  // cho tới khi khách xác nhận điều kiện mới → approve lại.
  // Trả về PATCH FIELDS để gọi kèm patchApp, vì mutate object không tự lưu overlay.
  freezeOnSubmit: function (app, premium) {
    app = app || {};
    var work = {
      quoteVersions: (app.quoteVersions || []).map(function (v) { return Object.assign({}, v); }),
      activeQuoteVersionId: app.activeQuoteVersionId,
      activeQuoteApproved: app.activeQuoteApproved
    };
    if (!work.quoteVersions.length) {
      BANCA.quoteVersion.init(work, premium);
      BANCA.quoteVersion.approve(work);
    } else {
      // Hồ sơ đã có phiên từ lúc sửa nháp (init tạo ra ở trạng thái DRAFT).
      // Nếu để nguyên DRAFT sau khi nộp thì cổng §4 khoá vĩnh viễn với lý do
      // "phiên báo giá hiện tại chưa được duyệt" mà KHÔNG có nút nào duyệt được
      // — ngõ cụt. Nộp hồ sơ = chốt giá đã chào khách ⇒ duyệt phiên đang hoạt động.
      var cur = BANCA.quoteVersion.active(work);
      if (cur && cur.status === 'DRAFT') BANCA.quoteVersion.approve(work);
    }
    return {
      quoteVersions: work.quoteVersions,
      activeQuoteVersionId: work.activeQuoteVersionId,
      activeQuoteApproved: work.activeQuoteApproved
    };
  },

  // Phí đổi SAU khi đã nộp (phụ phí thẩm định…) → sang phiên mới, cổng đóng lại.
  reRateFields: function (app, newPremium, reason) {
    var work = {
      quoteVersions: (app.quoteVersions || []).map(function (v) { return Object.assign({}, v); }),
      activeQuoteVersionId: app.activeQuoteVersionId,
      activeQuoteApproved: app.activeQuoteApproved,
      warningFlags: (app.warningFlags || []).slice()
    };
    BANCA.quoteVersion.reRate(work, newPremium, reason);
    return {
      quoteVersions: work.quoteVersions,
      activeQuoteVersionId: work.activeQuoteVersionId,
      activeQuoteApproved: work.activeQuoteApproved,
      warningFlags: work.warningFlags
    };
  },

  // Khách xác nhận điều kiện/phụ phí mới → duyệt phiên hiện tại, mở cổng.
  approveFields: function (app) {
    var work = {
      quoteVersions: (app.quoteVersions || []).map(function (v) { return Object.assign({}, v); }),
      activeQuoteVersionId: app.activeQuoteVersionId,
      activeQuoteApproved: app.activeQuoteApproved
    };
    BANCA.quoteVersion.approve(work);
    return {
      quoteVersions: work.quoteVersions,
      activeQuoteVersionId: work.activeQuoteVersionId,
      activeQuoteApproved: work.activeQuoteApproved
    };
  }
};

// ============================================================
// NGHĨA VỤ KHAI BÁO SỐNG LẠI  [CII IF3 ch.1 mục C3C / C3D]
//   C3C — sửa hồ sơ giữa kỳ: "the duty is revived as if a new contract is formed"
//   C3D — tái tục: phải kéo lại câu trả lời cũ và hỏi khách "còn đúng không"
// Đây là cặp song song của quoteVersion.reRate: reRate lo TIỀN, cái này lo BẢN KHAI.
// Cùng cơ chế cờ cảnh báo, cùng cách gỡ cờ, để không đẻ khái niệm mới.
//
// Ba mốc phải gọi markNeedsReconfirm:
//   1. Đổi khách hàng trên handoff  → đã nối (handoffs.js changeCustomer)
//   2. Sửa hồ sơ giữa kỳ / endorsement → nối khi làm luồng endorsement
//   3. Tái tục                        → nối khi làm luồng tái tục
// ============================================================
BANCA.declaration = {
  FLAG: 'DECLARATION_NEEDS_RECONFIRM',

  needsReconfirm: function (app) {
    app = app || {};
    return (app.warningFlags || []).indexOf(BANCA.declaration.FLAG) >= 0
        || (app.warnings     || []).indexOf(BANCA.declaration.FLAG) >= 0;
  },

  markNeedsReconfirm: function (app, reason) {
    if (!app) return app;
    app.warningFlags = app.warningFlags || [];
    if (app.warningFlags.indexOf(BANCA.declaration.FLAG) < 0) app.warningFlags.push(BANCA.declaration.FLAG);
    app.declarationReconfirm = {
      required: true,
      reason: reason || 'Dữ liệu nền của bản khai đã thay đổi',
      raisedAt: new Date().toISOString(),
      // Bản khai cũ trả lời trên schema nào — giữ lại để đối chiếu sau.
      previousSchemaId: (app.declaration || {}).schemaId || app.declarationSchemaId || null
    };
    return app;
  },

  // Khách đã xác nhận lại → gỡ cờ. Ghi ai xác nhận, lúc nào, trên schema nào.
  confirmed: function (app, by, schemaId) {
    if (!app) return app;
    app.warningFlags = (app.warningFlags || []).filter(function (w) { return w !== BANCA.declaration.FLAG; });
    app.warnings     = (app.warnings     || []).filter(function (w) { return w !== BANCA.declaration.FLAG; });
    app.declarationReconfirm = {
      required: false,
      confirmedBy: by || 'CUSTOMER',
      confirmedAt: new Date().toISOString(),
      schemaId: schemaId || (app.declaration || {}).schemaId || null
    };
    return app;
  }
};
