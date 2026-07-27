// ============================================================
// QuoteListShell + QuoteDataTable (§ correction 2026-07-27) — MỘT shell + MỘT table cho cả 5 lifecycle.
// Layout cố định: title+CTA → lifecycle tabs(count) → toolbar(scope/search/advanced/count) → quick filters → table.
// Đổi lifecycle KHÔNG làm nhảy layout. Column preset ẩn/hiện theo lifecycle + scope, không tạo bảng mới.
// ============================================================
window.BANCA = window.BANCA || {};
BANCA.ui = BANCA.ui || {};
(function () {
  var e = BANCA.ui._esc || function (s) { return String(s == null ? '' : s); };

  // Cột lõi dùng chung; preset chỉ ẩn/hiện.
  var COLS = {
    PREPARING:        ['offerCustomer', 'product', 'task', 'premium', 'owner', 'updated', 'action'],
    PROCESSING:       ['offerCustomer', 'product', 'task', 'due', 'premium', 'owner', 'updated', 'action'],
    CUSTOMER_WAITING: ['offerCustomer', 'product', 'task', 'due', 'premium', 'owner', 'updated', 'action'],
    ISSUED:           ['offerCustomer', 'product', 'task', 'premium', 'owner', 'updated', 'action'],
    UNSUCCESSFUL:     ['offerCustomer', 'product', 'task', 'owner', 'updated', 'action']
  };
  var HEAD = {
    offerCustomer: 'Bản chào & khách hàng', product: 'Phương án', task: 'Trạng thái & việc tiếp theo',
    due: 'Hạn xử lý', premium: 'Phí', owner: 'Người phụ trách', updated: 'Cập nhật', action: 'Hành động'
  };

  function slaCell(app) {
    var h = BANCA.slaHours ? BANCA.slaHours(app) : null;
    if (h == null) return '<span class="muted">—</span>';
    var color = h < 0 || h <= 24 ? 'var(--red-600)' : h <= 72 ? 'var(--amber-600)' : 'var(--teal-600)';
    var txt = h < 0 ? 'QUÁ HẠN' : h <= 24 ? ('còn ' + Math.round(h) + 'h') : ('còn ' + Math.round(h / 24) + 'd');
    return '<span class="nowrap" style="color:' + color + ';font-weight:600;font-size:12px;">' + txt + '</span>';
  }
  function prepTaskCell(app) {
    var stage = app.currentStage;
    var lbl = (BANCA.PREP_STAGE_LABELS && BANCA.PREP_STAGE_LABELS[stage]) || (BANCA.stageLabel ? BANCA.stageLabel(stage) : stage);
    var warn = (typeof warnBadges === 'function' && (app.warnings || []).length) ? warnBadges(app.warnings) : '';
    return '<div class="task-cell"><span class="journey-chip">' + e(lbl) + '</span>' + (warn ? '<span class="task-desc">' + warn + '</span>' : '') + '</div>';
  }

  function cell(col, a, cfg) {
    var r = cfg.r || '';
    var c = (BANCA.customerById ? BANCA.customerById(a.customerId) : null) || {};
    var per = (BANCA.personas || {})[a.owner] || {};
    switch (col) {
      case 'offerCustomer':
        return '<td class="col-id"><div class="q-id nowrap">' + e(a.id) + '</div><div class="q-cust">' + e(c.name || a.customerName || '—') + '</div></td>';
      case 'product':
        return '<td class="col-prod">' + e(a.productName || '') + (a.package ? ' · ' + e(a.package) : '') + '</td>';
      case 'task':
        return '<td class="col-task">' + (a.submissionState === 'NOT_SUBMITTED' ? prepTaskCell(a) : (BANCA.ui.customerTaskCell ? BANCA.ui.customerTaskCell(a) : '')) + '</td>';
      case 'due':
        return '<td>' + slaCell(a) + '</td>';
      case 'premium':
        return '<td style="text-align:right;">' + (BANCA.money ? BANCA.money(a.uw && a.uw.newPremium || a.premium) : (a.premium || '')) + '</td>';
      case 'owner':
        return '<td style="font-size:12px;">' + e(per.name || a.owner) + '<div class="muted" style="font-size:11px;">' + e(per.team || per.branch || '') + '</div></td>';
      case 'updated':
        return '<td>' + (BANCA.fmtDateTime ? BANCA.fmtDateTime(a.updatedAt) : e(a.updatedAt)) + '</td>';
      case 'action':
        var ct = BANCA.ui.offerCta ? BANCA.ui.offerCta(a) : { label: 'Mở', tab: 'overview', primary: false };
        var href = r + 'modules/application-workspace/index.html?id=' + a.id + (ct.tab ? '&tab=' + ct.tab : '');
        return '<td onclick="event.stopPropagation();"><a class="btn ' + (ct.primary ? 'btn-primary' : 'btn-secondary') + ' btn-sm" href="' + href + '">' + e(ct.label) + '</a></td>';
      default: return '<td></td>';
    }
  }

  // MỘT QuoteDataTable — column preset theo lifecycle + scope.
  BANCA.ui.quoteDataTable = function (apps, cfg) {
    cfg = cfg || {};
    var cols = (COLS[cfg.lifecycle] || COLS.PROCESSING).slice();
    if (cfg.scope === 'SELF') cols = cols.filter(function (c) { return c !== 'owner'; }); // AC: OWN ẩn người phụ trách
    var r = cfg.r || '';
    var thead = '<tr>' + cols.map(function (c) { return '<th' + (c === 'premium' ? ' style="text-align:right;"' : '') + '>' + (HEAD[c] || '') + '</th>'; }).join('') + '</tr>';
    var rows = apps.map(function (a) {
      return '<tr style="cursor:pointer;" onclick="location.href=\'' + r + 'modules/application-workspace/index.html?id=' + a.id + '\'">' +
        cols.map(function (c) { return cell(c, a, cfg); }).join('') + '</tr>';
    }).join('');
    return '<div class="card" style="padding:0;overflow-x:auto;"><table class="offer-table"><thead>' + thead + '</thead><tbody>' + rows + '</tbody></table></div>';
  };

  // MỘT QuoteListShell — layout cố định cho mọi lifecycle.
  BANCA.ui.quoteListShell = function (cfg) {
    cfg = cfg || {};
    var r = cfg.r || '', me = cfg.me, lifecycle = cfg.lifecycle, counts = cfg.counts || {};
    var canSell = cfg.canSell !== false;
    // 1. Title + primary CTA
    var top = '<div class="qls-top"><h1 class="qls-title">Bản chào</h1>' +
      (canSell ? '<button class="btn btn-primary" onclick="openStartSale()">+ ' + BANCA.t('createOffer') + '</button>' : '') + '</div>';
    // 2. Lifecycle tabs (count)
    var tabs = '<div class="offer-group-bar">' + (BANCA.QUOTE_LIFECYCLES || []).map(function (lc) {
      var on = lc.id === lifecycle;
      var href = r + 'modules/' + lc.page + '/index.html' + (lc.g5 ? '?g5=' + lc.g5 : '');
      var n = counts[lc.id] != null ? counts[lc.id] : 0;
      return '<a href="' + href + '" class="ogb-tab' + (on ? ' on' : '') + '">' + e(lc.label) + ' <span class="ogb-n">' + n + '</span></a>';
    }).join('') + '</div>';
    // 3. Toolbar: scope + search + advanced + result count
    var scopeSel = BANCA.ui.dataScopeSelector ? BANCA.ui.dataScopeSelector(me, cfg.scope, cfg.unit, r) : '';
    var g5 = cfg.g5;
    var search = BANCA.ui.searchBar({ mode: 'submit', name: 'q', value: cfg.q || '', placeholder: 'Tìm KH / SĐT / mã', hidden: g5 ? { g5: g5 } : {} });
    var count = '<span class="qls-count">Hiển thị <b>' + cfg.shown + '</b>/' + cfg.total + ' bản chào</span>';
    var toolbar = '<div class="qls-toolbar">' + scopeSel + '<span class="spacer"></span>' + search + (cfg.advancedBtn || '') + count + '</div>';
    // 4. Quick filters (lifecycle-specific)
    var quick = '<div class="qls-quick">' + (cfg.quickFiltersHtml || '') + '</div>';
    // 5. Table
    var table = cfg.shown ? BANCA.ui.quoteDataTable(cfg.apps, { lifecycle: lifecycle, scope: cfg.scope, me: me, r: r })
      : '<div class="card"><div class="empty-state">Không có bản chào khớp bộ lọc.</div></div>';
    return '<div class="qls">' + top + tabs + toolbar + quick + (cfg.advancedTags || '') + table + (cfg.advancedDrawer || '') + '</div>';
  };
})();
