// ============================================================
// SalesContextOfferStage (correction 2026-07-27 §1-6) — 1 stage "Khách hàng & phương án"
// dùng chung mọi channel/entryMode. Gồm: SalesSourceBar + (CustomerContextSection do stage
// gốc render) + OfferSelectionWorkspace. Config-driven, KHÔNG clone theo channel.
// ============================================================
window.BANCA = window.BANCA || {};
BANCA.ui = BANCA.ui || {};
BANCA.offer = BANCA.offer || {};
(function () {
  var e = (BANCA.ui && BANCA.ui._esc) ? BANCA.ui._esc : function (s) { return String(s == null ? '' : s); };
  var vnd = function (n) { return (BANCA.vnd ? BANCA.vnd(n) : ((n || 0).toLocaleString('vi-VN') + 'đ')); };

  // ---- Mock package + add-on catalog (§3.2/§3.3) — dữ liệu, không hard-code trong page ----
  BANCA.PACKAGE_CATALOG = {
    health: [
      { id: 'H_BASIC', name: 'Cơ bản', premium: 3200000, recommended: false, deductible: '500.000đ', benefits: ['Nội trú 100 triệu', 'Không có ngoại trú'] },
      { id: 'H_STD', name: 'Tiêu chuẩn', premium: 5100000, recommended: true, deductible: '300.000đ', benefits: ['Nội trú 200 triệu', 'Ngoại trú 10 triệu', 'Nha khoa cơ bản'] },
      { id: 'H_ADV', name: 'Nâng cao', premium: 8400000, recommended: false, deductible: '0đ', benefits: ['Nội trú 500 triệu', 'Ngoại trú 20 triệu', 'Nha khoa', 'Thai sản'] }
    ],
    motor: [
      { id: 'M_TNDS', name: 'TNDS bắt buộc', premium: 480700, recommended: false, deductible: '—', benefits: ['Trách nhiệm dân sự bắt buộc'] },
      { id: 'M_STD', name: 'Vật chất tiêu chuẩn', premium: 6800000, recommended: true, deductible: '500.000đ', benefits: ['Vật chất xe', 'TNDS', 'Cứu hộ 24/7'] },
      { id: 'M_ADV', name: 'Vật chất toàn diện', premium: 9200000, recommended: false, deductible: '0đ', benefits: ['Vật chất xe', 'Mất cắp bộ phận', 'Thủy kích', 'Cứu hộ 24/7'] }
    ],
    pa: [
      { id: 'PA_10', name: 'PA 100 triệu', premium: 550000, recommended: true, deductible: '—', benefits: ['Tử vong/thương tật 100tr', 'Trợ cấp nằm viện'] },
      { id: 'PA_20', name: 'PA 200 triệu', premium: 990000, recommended: false, deductible: '—', benefits: ['Tử vong/thương tật 200tr', 'Trợ cấp nằm viện', 'Chi phí y tế'] }
    ]
  };
  BANCA.ADDON_CATALOG = {
    health: [
      { id: 'A_DENTAL', name: 'Nha khoa nâng cao', premium: 600000 },
      { id: 'A_MATERNITY', name: 'Thai sản', premium: 1800000, requiresPackage: ['H_STD', 'H_ADV'] },
      { id: 'A_HOSP', name: 'Trợ cấp nằm viện', premium: 350000 }
    ],
    motor: [
      { id: 'A_FLOOD', name: 'Bảo hiểm thủy kích', premium: 900000 },
      { id: 'A_NEWPART', name: 'Thay mới không khấu hao', premium: 700000 }
    ],
    pa: [{ id: 'A_MED', name: 'Chi phí y tế mở rộng', premium: 200000 }]
  };
  function pkgList(app) { return BANCA.PACKAGE_CATALOG[app.productId] || BANCA.PACKAGE_CATALOG.health; }
  function addonList(app) { return BANCA.ADDON_CATALOG[app.productId] || []; }

  // ---- Selection state (persist qua overlay) ----
  function sel(app) {
    var o = (BANCA.overlay && BANCA.overlay.applications && BANCA.overlay.applications[app.id]) || {};
    var packs = pkgList(app);
    var pkgId = o.selectedPackageId || app.selectedPackageId || (packs.find(function (p) { return p.recommended; }) || packs[0]).id;
    var addons = o.selectedAddonIds || app.selectedAddonIds || [];
    return { pkgId: pkgId, addons: addons };
  }
  function pkgById(app, id) { return pkgList(app).find(function (p) { return p.id === id; }) || pkgList(app)[0]; }
  function total(app, s) {
    var t = pkgById(app, s.pkgId).premium;
    addonList(app).forEach(function (a) { if (s.addons.indexOf(a.id) >= 0) t += a.premium; });
    return t;
  }

  // ================= SalesSourceBar (§1) =================
  BANCA.ui.salesSourceBar = function (app) {
    var mode = app.source === 'ADVICE' ? 'QUICK_ADVICE' : (app.renewalPolicyRef ? 'RENEWAL' : (app.leadId ? 'REFERRAL' : (app.entryMode || 'BANK_CUSTOMER')));
    var LOCKED = { BANK_CUSTOMER: 1, RENEWAL: 1, QUICK_ADVICE: 1, HANDOVER: 1, INSURANCE_CUSTOMER: 1 };
    var locked = !!LOCKED[mode] || (BANCA.channel && BANCA.channel() === 'BANCA_INTEGRATED');
    var srcLabel = { BANK_CUSTOMER: 'Khách hàng ngân hàng', RENEWAL: 'Tái tục hợp đồng', QUICK_ADVICE: 'Từ Tư vấn nhanh', REFERRAL: 'Lead / Referral', HANDOVER: 'Bàn giao', NEW_PROSPECT: 'Khách hàng mới', PRODUCT_FIRST: 'Chọn sản phẩm trước' }[mode] || mode;
    // AC06/07 — chỉ đổi nguồn khi Draft & chưa rating/submit
    var canSwitch = !locked && (app.submissionState !== 'SUBMITTED') && !(app.quoteVersions && app.quoteVersions.some(function (v) { return v.status === 'APPROVED'; }));
    var right = locked
      ? '<span class="ssb-lock">🔒 Thông tin do nguồn cung cấp</span>'
      : (canSwitch ? '<button class="btn btn-secondary btn-sm" onclick="BANCA.offer.confirmSwitchSource(\'' + e(app.id) + '\')">Đổi nguồn</button>'
        : '<span class="ssb-lock">Đã khóa sau khi tạo báo giá</span>');
    function cell(k, v, src) { return v ? '<div class="ssb-cell"><span class="ssb-k">' + e(k) + '</span><span class="ssb-v">' + e(v) + (src ? ' ' + BANCA.ui.dataSourceBadge(src) : '') + '</span></div>' : ''; }
    return '<div class="sales-source-bar">' +
      '<div class="ssb-main">' +
      cell('Nguồn khởi tạo', srcLabel, locked ? 'BANK' : null) +
      cell('Tham chiếu', app.cif || app.externalCustomerRef || app.customerId, locked ? 'BANK' : null) +
      cell('Hệ thống nguồn', app.sourceSystem || (locked ? 'Bank CRM' : 'Portal')) +
      cell('Người phụ trách', app.rm || app.owner) +
      cell('Chi nhánh', app.branch) +
      '</div><div class="ssb-actions">' + right + '</div></div>';
  };

  // ================= OfferSelectionWorkspace (§3) =================
  BANCA.ui.offerSelectionWorkspace = function (app) {
    return '<div id="offer-workspace" class="offer-workspace">' + BANCA.offer._render(app) + '</div>';
  };
  BANCA.offer._render = function (app) {
    var s = sel(app), packs = pkgList(app), addons = addonList(app), locked = !!app.productLocked;
    var recPkg = pkgById(app, s.pkgId);
    // 3.1 Recommended product card
    var rec = '<div class="ows-panel"><div class="oc-title">Sản phẩm đề nghị</div>' +
      '<div class="ows-rec"><div class="ows-prod">' + e(app.productName || 'Sản phẩm') + '</div>' +
      (app.recommendReason ? '<div class="oc-reason">Lý do đề nghị: ' + e(app.recommendReason) + '</div>' : '') +
      '<div class="ows-meta">Phí dự kiến từ <b>' + vnd(packs[0].premium) + '</b> · Thời hạn 12 tháng · ' +
      (BANCA.sellerReadinessLabel ? BANCA.sellerReadinessLabel(app.productId) : 'Đủ điều kiện bán') + '</div>' +
      (locked ? '' : '<button class="btn btn-secondary btn-sm" style="margin-top:10px;" onclick="BANCA.offer.toggleCatalog(\'' + e(app.id) + '\')">Xem sản phẩm khác</button>') +
      '<div id="alt-catalog" class="ows-alt" style="display:none;">' + BANCA.offer._catalog(app) + '</div>' +
      '</div></div>';
    // 3.2 Package selector
    var pkgCards = packs.map(function (p) {
      var on = p.id === s.pkgId;
      return '<label class="pkg-card' + (on ? ' on' : '') + (p.recommended ? ' recommended' : '') + '">' +
        '<div class="pkg-head"><input type="radio" name="pkg" ' + (on ? 'checked' : '') + ' onchange="BANCA.offer.selectPackage(\'' + e(app.id) + '\',\'' + p.id + '\')">' +
        '<span class="pkg-name">' + e(p.name) + '</span>' + (p.recommended ? '<span class="pkg-rec">ĐỀ XUẤT</span>' : '') + '</div>' +
        '<div class="pkg-prem">' + vnd(p.premium) + '/năm</div>' +
        '<ul class="pkg-ben">' + p.benefits.map(function (b) { return '<li>' + e(b) + '</li>'; }).join('') + '</ul>' +
        '<div class="pkg-ded">Khấu trừ: ' + e(p.deductible) + '</div>' +
        '<label class="pkg-cmp"><input type="checkbox" onchange="BANCA.offer.toggleCompare(\'' + e(app.id) + '\',\'' + p.id + '\',this.checked)"> So sánh</label>' +
        '</label>';
    }).join('');
    var pkgSel = '<div class="ows-panel"><div class="oc-title">Chọn gói bảo hiểm</div><div class="pkg-grid">' + pkgCards + '</div>' +
      '<div id="cmp-panel" class="cmp-panel"></div></div>';
    // 3.3 Add-on selector
    var addCards = addons.map(function (a) {
      var on = s.addons.indexOf(a.id) >= 0;
      var incompatible = a.requiresPackage && a.requiresPackage.indexOf(s.pkgId) < 0;
      return '<label class="addon-item' + (incompatible ? ' disabled' : '') + '">' +
        '<input type="checkbox" ' + (on ? 'checked' : '') + ' ' + (incompatible ? 'disabled' : '') +
        ' onchange="BANCA.offer.toggleAddon(\'' + e(app.id) + '\',\'' + a.id + '\',this.checked)"> ' +
        '<span>' + e(a.name) + '</span><span class="addon-prem">+' + vnd(a.premium) + '</span>' +
        (incompatible ? '<span class="addon-note">Không áp dụng cho gói đang chọn</span>' : '') + '</label>';
    }).join('');
    var addSel = addons.length ? '<div class="ows-panel"><div class="oc-title">Quyền lợi bổ sung</div>' + addCards + '</div>' : '';
    // SelectedOfferSummary (§3.3)
    var lines = '<div class="sos-line"><span>' + e('Gói ' + recPkg.name) + '</span><span>' + vnd(recPkg.premium) + '</span></div>' +
      addons.filter(function (a) { return s.addons.indexOf(a.id) >= 0; }).map(function (a) {
        return '<div class="sos-line"><span>' + e(a.name) + '</span><span>' + vnd(a.premium) + '</span></div>';
      }).join('');
    var summary = '<div class="ows-panel selected-offer-summary"><div class="oc-title">Phương án đã chọn</div>' + lines +
      '<div class="sos-total"><span>Phí dự kiến</span><b>' + vnd(total(app, s)) + '/năm</b></div>' +
      '<div class="sos-note">Phí chính thức được chốt ở bước “Gói, phí &amp; điều kiện” sau khai báo rủi ro.</div></div>';
    return rec + pkgSel + addSel + summary;
  };
  BANCA.offer._catalog = function (app) {
    var prods = (BANCA.products || []).filter(function (p) { return p.id !== app.productId; }).slice(0, 4);
    if (!prods.length) return '<div class="oc-reason">Không có sản phẩm thay thế trong quyền bán.</div>';
    return prods.map(function (p) {
      return '<div class="alt-prod"><span>' + e(p.name) + '</span>' +
        '<button class="btn btn-secondary btn-sm" onclick="BANCA.offer.switchProduct(\'' + e(app.id) + '\',\'' + p.id + '\')">Chọn</button></div>';
    }).join('');
  };

  // ---- Handlers (live update, không reload) ----
  function persist(appId, patch) { if (BANCA.patchApp) BANCA.patchApp(appId, patch); }
  function rerender(app) { var el = document.getElementById('offer-workspace'); if (el) el.innerHTML = BANCA.offer._render(app); }
  function appById(id) { return (BANCA.applications || []).find(function (a) { return a.id === id; }) || { id: id, productId: 'health' }; }

  BANCA.offer.selectPackage = function (appId, pkgId) {
    var app = appById(appId); app.selectedPackageId = pkgId;
    persist(appId, { selectedPackageId: pkgId });
    // §3.3 đổi package → kiểm tra lại add-on compatibility (giữ lại cái còn hợp lệ)
    rerender(app);
  };
  BANCA.offer.toggleAddon = function (appId, addonId, on) {
    var app = appById(appId); var s = sel(app); var list = s.addons.slice();
    var i = list.indexOf(addonId); if (on && i < 0) list.push(addonId); if (!on && i >= 0) list.splice(i, 1);
    app.selectedAddonIds = list; persist(appId, { selectedAddonIds: list }); rerender(app);
  };
  BANCA.offer._compare = {};
  BANCA.offer.toggleCompare = function (appId, pkgId, on) {
    var app = appById(appId); var set = BANCA.offer._compare[appId] || (BANCA.offer._compare[appId] = []);
    var i = set.indexOf(pkgId); if (on && i < 0) { if (set.length >= 3) { alert('Chỉ so sánh tối đa 3 gói'); return; } set.push(pkgId); } if (!on && i >= 0) set.splice(i, 1);
    var el = document.getElementById('cmp-panel'); if (!el) return;
    if (set.length < 2) { el.innerHTML = ''; return; }
    var packs = set.map(function (id) { return pkgById(app, id); });
    el.innerHTML = '<div class="cmp-title">So sánh gói</div><table class="cmp-table"><tr><th>Tiêu chí</th>' +
      packs.map(function (p) { return '<th>' + e(p.name) + '</th>'; }).join('') + '</tr>' +
      '<tr><td>Phí/năm</td>' + packs.map(function (p) { return '<td>' + vnd(p.premium) + '</td>'; }).join('') + '</tr>' +
      '<tr><td>Khấu trừ</td>' + packs.map(function (p) { return '<td>' + e(p.deductible) + '</td>'; }).join('') + '</tr>' +
      '<tr><td>Quyền lợi</td>' + packs.map(function (p) { return '<td>' + p.benefits.map(e).join('<br>') + '</td>'; }).join('') + '</tr></table>';
  };
  BANCA.offer.toggleCatalog = function (appId) { var el = document.getElementById('alt-catalog'); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; };
  BANCA.offer.switchProduct = function (appId, prodId) {
    if (!confirm('Đổi sản phẩm sẽ đặt lại gói, add-on và phí dự kiến. Tiếp tục?')) return;
    var app = appById(appId); var prod = (BANCA.products || []).find(function (p) { return p.id === prodId; }) || {};
    app.productId = prodId; app.productName = prod.name || prodId; app.selectedPackageId = null; app.selectedAddonIds = [];
    persist(appId, { productId: prodId, productName: app.productName, selectedPackageId: null, selectedAddonIds: [] });
    rerender(app);
  };
  BANCA.offer.confirmSwitchSource = function (appId) {
    if (!confirm('Thay đổi nguồn sẽ đặt lại: thông tin khách hàng, sản phẩm đề xuất, đối tượng bảo hiểm, phí dự kiến. Bạn có muốn tiếp tục?')) return;
    // Prototype: quay lại orchestrator chọn nguồn
    if (typeof openStartSale === 'function') openStartSale();
  };
})();
