// ============================================================
// Post-sale (§11) — Yêu cầu dịch vụ + Tổn thất/Bồi thường.
// Portal CHỈ khởi tạo yêu cầu, upload tài liệu, gửi sang hệ thống xử lý và
// theo dõi trạng thái. Portal KHÔNG trực tiếp sửa hợp đồng, KHÔNG xử lý bồi thường.
// Dùng chung Motor/Health/PA — khác biệt chỉ ở loại yêu cầu được bật theo sản phẩm.
// ============================================================
window.BANCA = window.BANCA || {};

// --- Loại yêu cầu dịch vụ. `products` giới hạn theo sản phẩm (config, không hard-code trong page).
BANCA.SERVICE_REQUEST_TYPES = [
  { id: 'INFO_CHANGE',    label: 'Thay đổi thông tin liên hệ', docs: ['Giấy tờ tuỳ thân'],                 products: null },
  { id: 'ENDORSEMENT',    label: 'Sửa đổi bổ sung hợp đồng',   docs: ['Đơn yêu cầu sửa đổi'],              products: null },
  { id: 'BENEFICIARY',    label: 'Thay đổi người thụ hưởng',   docs: ['Đơn thay đổi', 'Giấy tờ tuỳ thân'], products: ['health', 'pa'] },
  { id: 'ADD_MEMBER',     label: 'Thêm người được bảo hiểm',   docs: ['Kê khai sức khoẻ', 'Giấy tờ tuỳ thân'], products: ['health'] },
  { id: 'VEHICLE_CHANGE', label: 'Thay đổi thông tin xe',      docs: ['Đăng ký xe mới'],                   products: ['motor'] },
  { id: 'CANCEL',         label: 'Yêu cầu chấm dứt hợp đồng',  docs: ['Đơn chấm dứt'],                     products: null },
  { id: 'REISSUE_DOC',    label: 'Cấp lại GCNBH / thẻ điện tử', docs: [],                                  products: null }
];

BANCA.SERVICE_REQUEST_STATUS = {
  DRAFT:      { label: 'Nháp',            cls: 'badge-pending' },
  SUBMITTED:  { label: 'Đã gửi',          cls: 'badge-conditional' },
  IN_PROGRESS:{ label: 'Đang xử lý',      cls: 'badge-conditional' },
  NEED_INFO:  { label: 'Cần bổ sung',     cls: 'badge-blocked' },
  COMPLETED:  { label: 'Đã hoàn tất',     cls: 'badge-ready' },
  REJECTED:   { label: 'Bị từ chối',      cls: 'badge-blocked' }
};

BANCA.CLAIM_STATUS = {
  NOTIFIED:   { label: 'Đã khai báo',     cls: 'badge-pending' },
  ASSESSING:  { label: 'Đang giám định',  cls: 'badge-conditional' },
  NEED_INFO:  { label: 'Cần bổ sung',     cls: 'badge-blocked' },
  APPROVED:   { label: 'Đã duyệt bồi thường', cls: 'badge-ready' },
  PAID:       { label: 'Đã chi trả',      cls: 'badge-ready' },
  REJECTED:   { label: 'Từ chối bồi thường', cls: 'badge-blocked' }
};

BANCA.serviceRequestTypesFor = function (productId) {
  return BANCA.SERVICE_REQUEST_TYPES.filter(function (t) {
    return !t.products || t.products.indexOf(productId) >= 0;
  });
};

// --- Seed demo (§21.F): mỗi trạng thái chính có ít nhất 1 mẫu để demo được.
BANCA.serviceRequests = [
  { id: 'SR-2026-0031', policyId: 'JB-POL-2026-0207', type: 'INFO_CHANGE', status: 'COMPLETED',
    createdAt: '2026-07-18 09:12', updatedAt: '2026-07-19 14:02', createdBy: 'RM-01',
    note: 'Đổi số điện thoại nhận thông báo.', externalRef: 'CORE-SR-88231' },
  { id: 'SR-2026-0044', policyId: 'JB-POL-2026-0207', type: 'REISSUE_DOC', status: 'IN_PROGRESS',
    createdAt: '2026-07-24 10:40', updatedAt: '2026-07-25 08:15', createdBy: 'RM-01',
    note: 'Khách yêu cầu cấp lại GCNBH bản PDF.', externalRef: 'CORE-SR-88907' },
  { id: 'SR-2026-0048', policyId: 'JB-POL-2026-0184', type: 'ENDORSEMENT', status: 'NEED_INFO',
    createdAt: '2026-07-25 16:05', updatedAt: '2026-07-26 09:30', createdBy: 'RM-01',
    note: 'Bổ sung phụ kiện lắp thêm.', missing: ['Hoá đơn phụ kiện'], externalRef: 'CORE-SR-89015' }
];

BANCA.claims = [
  { id: 'CLM-2026-0119', policyId: 'JB-POL-2026-0184', status: 'ASSESSING',
    lossDate: '2026-07-20', notifiedAt: '2026-07-21 08:30', notifiedBy: 'RM-01',
    lossType: 'Va chạm giao thông', estimate: 18000000, externalRef: 'CORE-CLM-4471',
    timeline: [
      { at: '2026-07-21 08:30', text: 'Khai báo tổn thất từ Sales Portal' },
      { at: '2026-07-21 15:10', text: 'Tiếp nhận, cấp mã hồ sơ bồi thường' },
      { at: '2026-07-23 10:00', text: 'Giám định viên khảo sát tại garage' }
    ] }
];

BANCA.serviceRequestsOf = function (policyId) {
  return (BANCA.serviceRequests || []).filter(function (s) { return s.policyId === policyId; });
};
BANCA.claimsOf = function (policyId) {
  return (BANCA.claims || []).filter(function (c) { return c.policyId === policyId; });
};
