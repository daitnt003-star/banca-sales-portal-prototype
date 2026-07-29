// ============================================================
// Navigation config (§8.1 + §16) — nguồn nav tập trung Non-life.
// Trang chủ / Tư vấn nhanh / Bản chào / Hợp đồng / Đội nhóm (theo quyền) / Trợ giúp.
// Hồ sơ nhân viên → avatar menu. Bỏ 2 object "chưa nộp / đã nộp".
// ============================================================
window.BANCA = window.BANCA || {};

// Nav phẳng, không nhóm "BÁN HÀNG/SAU BÁN/…".
// không tách "Hồ sơ chưa nộp / đã nộp" thành 2 object.
// `icon` khớp key trong app-shell.navIcon(). `sellingOnly` ẩn với persona quản lý thuần.
BANCA.NAV_CONFIG = {
  primary: [
    { id: 'seller-workspace', label: 'Trang chủ',  route: 'modules/seller-workspace/index.html',        permission: 'VIEW_WORKSPACE', icon: 'home' },
    { id: 'quick-advisory',   label: 'Tư vấn nhanh', route: 'modules/quick-advisory/index.html',         permission: 'VIEW_WORKSPACE', icon: 'advise', sellingOnly: true },
    { id: 'offers',           label: 'Bản chào',   route: 'modules/unsubmitted-applications/index.html', permission: 'VIEW_WORKSPACE', icon: 'draft', sellingOnly: true,
      // 1 object "Bản chào" — filter theo 5 nhóm status trung tâm (§8.2), KHÔNG tách tab/status.
      filterGroups: ['PREPARING', 'PROCESSING', 'WAIT_CUST', 'ISSUED', 'FAILED'],
      // Các nhãn thuộc sales/application workspace vẫn highlight "Bản chào".
      aliases: ['Yêu cầu bảo hiểm', 'Workspace'] },
    { id: 'policies',         label: 'Hợp đồng',   route: 'modules/policies/index.html',                permission: 'VIEW_WORKSPACE', icon: 'doc' },
    { id: 'team-workspace',   label: 'Đội nhóm',   route: 'modules/team-workspace/index.html',          permission: 'VIEW_TEAM_WORKSPACE', icon: 'team' },
    { id: 'help',             label: 'Trợ giúp',   route: 'modules/help/index.html',                    permission: 'VIEW_WORKSPACE', icon: 'help' }
  ],
  avatar: [
    { id: 'employee-profile', label: 'Hồ sơ nhân viên', route: 'modules/employee-profile/index.html', permission: 'VIEW_WORKSPACE' }
  ],
  hidden: [
    { id: 'application-workspace', label: 'Không gian xử lý', route: 'modules/application-workspace/index.html', permission: 'VIEW_WORKSPACE' }
  ],
  dev: [
    { id: 'auth',          label: 'Demo setup / Persona', route: 'modules/auth/index.html', permission: 'PUBLIC' },
    { id: 'state-gallery', label: 'State Gallery',        route: 'dev/state-gallery.html',  permission: 'PUBLIC' }
  ]
};

// Migration note: object "Bản chào" tái dùng module list hiện có (unsubmitted-applications),
// chỉ đổi framing + filter theo nhóm status. Không tạo module list mới, không bỏ file cũ.
BANCA.navPrimary = function () { return BANCA.NAV_CONFIG.primary; };

// Nav đã lọc theo quyền + khả năng bán — app-shell CHỈ render, không tự khai báo item (§16).
BANCA.navResolved = function () {
  var mp = BANCA.resolveManagerProfile ? BANCA.resolveManagerProfile(BANCA.current()) : { sellingEnabled: true };
  var canSell = mp.sellingEnabled !== false;
  return BANCA.NAV_CONFIG.primary.filter(function (it) {
    if (!BANCA.can(it.permission)) return false;
    if (it.sellingOnly && !canSell) return false;
    return true;
  });
};
BANCA.navAvatar = function () {
  return BANCA.NAV_CONFIG.avatar.filter(function (it) { return BANCA.can(it.permission); });
};

// Trang gọi shell('<nhãn>') — khớp theo label hoặc alias để bước hành trình vẫn sáng đúng mục.
BANCA.navIsActive = function (item, active) {
  if (!active) return false;
  if (item.label === active) return true;
  return (item.aliases || []).indexOf(active) >= 0;
};
