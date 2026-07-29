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

  // Package code/metadata chỉ được đọc từ canonical product schemas.
  function pkgList(app) {
    var source = app.productId === 'motor' ? BANCA.motorPackages
      : app.productId === 'pa' ? BANCA.paPackages : BANCA.healthPackages;
    return Object.keys(source || {}).map(function (code) {
      var p = source[code];
      var premium = 0;
      if (app.productId === 'motor' && BANCA.rateMotor && app.vehicle && app.vehicle.value) {
        var mr = BANCA.rateMotor({ packageCode:p.code, sumInsured:app.vehicle.value, termMonths:12,
          addOns:p.defaultAddOns || [], deductible:p.defaultDeductible, ncdPercent:0, vehicleAgeYears:0 });
        premium = mr ? mr.totalPremium : 0;
      } else if (app.productId === 'pa' && BANCA.ratePA) {
        var pr = BANCA.ratePA({ packageCode:p.code, sumInsured:p.sumInsured,
          age:app.insuredAge || 30, occupationClass:app.occupationClass || 'CLASS_1' });
        premium = pr && !pr.ineligible ? pr.totalPremium : 0;
      } else if (app.productId === 'health' && BANCA.rateHealth) {
        var hr = BANCA.rateHealth({ packageCode:p.code, members:[{ age:app.insuredAge || 30 }] });
        premium = hr ? hr.totalPremium : 0;
      }
      var benefits = app.productId === 'motor'
        ? (p.coverageList || []).map(function (x) { return (BANCA.coverageLabels || {})[x] || x; })
        : app.productId === 'pa'
          ? (p.coverageList || []).map(function (x) { return (BANCA.paCoverageLabels || {})[x] || x; })
          : [
            'Nội trú ' + vnd(p.inpatientLimit),
            p.outpatientLimit ? 'Ngoại trú ' + vnd(p.outpatientLimit) : 'Không có ngoại trú',
            p.dentalLimit ? 'Nha khoa ' + vnd(p.dentalLimit) : null,
            p.maternityLimit ? 'Thai sản ' + vnd(p.maternityLimit) : null
          ].filter(Boolean);
      return { id:p.code, code:p.code, name:p.name, premium:premium,
        recommended:['STANDARD','PA_STD','HEALTH_STD'].indexOf(p.code) >= 0,
        deductible:p.defaultDeductible != null ? vnd(p.defaultDeductible) : '—',
        benefits:benefits, raw:p };
    });
  }
  function addonList(app) {
    if (app.productId !== 'motor') return [];
    return Object.keys(BANCA.motorAddOns || {}).map(function (code) {
      var a = BANCA.motorAddOns[code];
      return { id:a.code, name:a.name, premium:0 };
    });
  }
  BANCA.offer.normalizePackageCode = function (app, value) {
    if (value == null || String(value).trim() === '') return null;
    var productId = app && app.productId;
    var packs = pkgList(app || {});
    var raw = String(value).trim();
    var direct = packs.find(function (p) {
      return p.code.toLowerCase() === raw.toLowerCase() || String(p.name || '').toLowerCase() === raw.toLowerCase();
    });
    if (direct) return direct.code;
    var key = raw.normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '') : raw.toLowerCase();
    var aliases = {
      pa:{basic:'PA_BASIC',coban:'PA_BASIC',pa10:'PA_BASIC',standard:'PA_STD',tieuchuan:'PA_STD',pa20:'PA_STD',premium:'PA_PLUS',plus:'PA_PLUS',nangcao:'PA_PLUS'},
      health:{basic:'HEALTH_BASIC',coban:'HEALTH_BASIC',hbasic:'HEALTH_BASIC',standard:'HEALTH_STD',tieuchuan:'HEALTH_STD',hstd:'HEALTH_STD',premium:'HEALTH_PLUS',plus:'HEALTH_PLUS',nangcao:'HEALTH_PLUS',hadv:'HEALTH_PLUS'},
      motor:{basic:'BASIC',coban:'BASIC',mtnds:'BASIC',standard:'STANDARD',tieuchuan:'STANDARD',mstd:'STANDARD',premium:'PREMIUM',plus:'PREMIUM',nangcao:'PREMIUM',madv:'PREMIUM'}
    };
    return (aliases[productId] || {})[key] || null;
  };
  BANCA.offer.resolvePackageCode = function (app, extraCandidates) {
    var o = (BANCA.overlay && BANCA.overlay.applications && BANCA.overlay.applications[app.id]) || {};
    var candidates = (extraCandidates || []).concat([
      o.packageCode, o.package, o.selectedPackageId,
      app.packageCode, app.package, app.selectedPackageId
    ]);
    for (var i = 0; i < candidates.length; i += 1) {
      var canonical = BANCA.offer.normalizePackageCode(app, candidates[i]);
      if (canonical) return canonical;
    }
    return null;
  };

  // ---- Selection state (persist qua overlay) ----
  function sel(app) {
    var o = (BANCA.overlay && BANCA.overlay.applications && BANCA.overlay.applications[app.id]) || {};
    var packs = pkgList(app);
    var pkgId = BANCA.offer.resolvePackageCode(app);
    var validAddons = addonList(app).map(function (a) { return a.id; });
    var addons = (o.selectedAddonIds || app.selectedAddonIds || []).filter(function (id) { return validAddons.indexOf(id) >= 0; });
    return { pkgId: pkgId, addons: addons };
  }
  function pkgById(app, id) { return pkgList(app).find(function (p) { return p.id === id; }) || null; }
  function total(app, s) {
    var t = (pkgById(app, s.pkgId) || {}).premium || 0;
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
    var recPkg = pkgById(app, s.pkgId) || packs.find(function (p) { return p.recommended; }) || packs[0];
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
    var summary = s.pkgId ? '<div class="ows-panel selected-offer-summary"><div class="oc-title">Phương án đã chọn</div>' + lines +
      '<div class="sos-total"><span>Phí dự kiến</span><b>' + vnd(total(app, s)) + '/năm</b></div>' +
      '<div class="sos-note">Phí chính thức được chốt ở bước “Gói, phí &amp; điều kiện” sau khai báo rủi ro.</div></div>' : '';
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
    var app = appById(appId);
    var canonical = pkgById(app, pkgId);
    if (!canonical || canonical.id !== pkgId) return;
    var validAddons = addonList(app).map(function (a) { return a.id; });
    var addons = (app.selectedAddonIds || []).filter(function (id) { return validAddons.indexOf(id) >= 0; });
    app.package = pkgId; app.packageCode = pkgId; app.selectedPackageId = pkgId; app.selectedAddonIds = addons;
    var patch = { package:pkgId, packageCode:pkgId, selectedPackageId:pkgId, selectedAddonIds:addons };
    if (app.productId === 'health' && Array.isArray(app.insuredMembers)) {
      app.insuredMembers = app.insuredMembers.map(function (m) {
        return m.package ? m : Object.assign({}, m, { package:pkgId });
      });
      patch.insuredMembers = app.insuredMembers;
    }
    persist(appId, patch);
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
    var app = appById(appId);
    var currentProduct = (BANCA.products || []).find(function (p) { return p.id === app.productId; });
    var canQuote = !BANCA.capabilities || (currentProduct && BANCA.capabilities(currentProduct).indexOf('can_quote') >= 0);
    if (app.submissionState === 'SUBMITTED' || app.productLocked || app.owner !== BANCA.current() || !canQuote) return;
    var prod = (BANCA.products || []).find(function (p) { return p.id === prodId; });
    if (!prod || prodId === app.productId) return;
    if (!confirm('Đổi sang ' + prod.name + '? Thông tin người được bảo hiểm, khai báo rủi ro, gói và báo giá hiện tại sẽ được đặt lại. Thông tin khách hàng vẫn được giữ.')) return;
    var reset = {
      productId:prodId, productName:prod.name, currentStage:'CUSTOMER_INFO',
      package:null, packageCode:null, selectedPackageId:null, selectedAddonIds:[],
      quote:null, quoteVersions:[], activeQuoteVersionId:null, activeQuoteApproved:false,
      premium:null, sumInsured:null, riskAnswers:{}, vehicle:null, mortgage:null,
      insuredMembers:[], insuredName:null, insuredDob:null, insuredAge:null,
      occupationClass:null, beneficiaries:[], docsUploaded:[], underwritingStatus:null,
      underwritingDecision:null, uw:null, stpDecision:null, confirm:null, confirmation:null,
      payment:null, paymentStatus:null, policyId:null, policyStatus:null
    };
    Object.assign(app, reset);
    persist(appId, reset);
    location.href = '?id=' + encodeURIComponent(appId) + '&step=CUSTOMER_INFO';
  };
  BANCA.offer.confirmSwitchSource = function (appId) {
    if (!confirm('Thay đổi nguồn sẽ đặt lại: thông tin khách hàng, sản phẩm đề xuất, đối tượng bảo hiểm, phí dự kiến. Bạn có muốn tiếp tục?')) return;
    // Prototype: quay lại orchestrator chọn nguồn
    if (typeof openStartSale === 'function') openStartSale();
  };
})();
