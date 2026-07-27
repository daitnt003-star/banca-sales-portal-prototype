// ============================================================
// Navigation config (§8.1 + §16) — nguồn nav tập trung Non-life.
// Trang chủ / Bản chào / Hợp đồng / Đội nhóm (theo quyền) / Trợ giúp.
// Hồ sơ nhân viên → avatar menu. Bỏ 2 object "chưa nộp / đã nộp".
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.NAV_CONFIG = {
  primary: [
    { id: 'seller-workspace', label: 'Trang chủ',  route: 'modules/seller-workspace/index.html',        permission: 'VIEW_WORKSPACE', icon: 'home' },
    { id: 'offers',           label: 'Bản chào',   route: 'modules/unsubmitted-applications/index.html', permission: 'VIEW_WORKSPACE', icon: 'offer',
      // 1 object "Bản chào" — filter theo 5 nhóm status trung tâm (§8.2), KHÔNG tách tab/status.
      filterGroups: ['PREPARING', 'PROCESSING', 'WAIT_CUST', 'ISSUED', 'FAILED'] },
    { id: 'policies',         label: 'Hợp đồng',   route: 'modules/policies/index.html',                permission: 'VIEW_WORKSPACE', icon: 'policy' },
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
