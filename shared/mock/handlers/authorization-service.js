window.BANCA = window.BANCA || {};
BANCA.can = permission => {
  const p = BANCA.persona();
  if (permission === 'PUBLIC') return true;
  if (p.status !== 'ACTIVE') return false;
  if (p.serviceError) return permission === 'VIEW_WORKSPACE';
  if (permission === 'VIEW_TEAM_WORKSPACE') return !!p.isManager;
  return true;
};
BANCA.isManager = () => !!BANCA.persona().isManager;
BANCA.alerts = {
  'RM-01':['Motor và PA sẵn sàng bán.','APP-2026-104 cần bổ sung tài liệu trước 22/07.'],
  'RM-02':['Motor conditional: license còn 12 ngày.','Health blocked: cần hoàn thành training.','DRAFT-2026-007 cần tính phí lại (báo giá hết hạn).'],
  'TS-01':['Telesales không có quyền bind/payment.','REF-2026-016: lead mới chưa xử lý, SLA 25/07.'],
  'TL-01':['TEAM-A: 1 hồ sơ sắp quá hạn bổ sung (APP-2026-104).','RM-02 license Motor còn 12 ngày.'],
  'BM-01':['HCM01: 2 hồ sơ cần chú ý SLA.','Đạt 82% target premium tháng 7.'],
  'SUP-01':['Chỉ xem delegated case được giao.'],
  'RM-IN':['Tài khoản đã ngừng hoạt động từ 30/06/2026. Liên hệ quản trị Distribution.'],
  'SVC-ERR':['Không default READY khi service lỗi; CTA bị khóa.']
};
