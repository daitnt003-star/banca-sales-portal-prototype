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
  setPremiumManual: function () { throw new Error('Không cho phép chỉnh sửa phí thủ công — phí do rating engine tính.'); }
};
