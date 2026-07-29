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

// --- Loại tổn thất khai báo được, theo sản phẩm (config, không hard-code trong page).
BANCA.CLAIM_TYPES = [
  { id: 'COLLISION',   label: 'Va chạm giao thông',      products: ['motor'], docs: ['Ảnh hiện trường', 'Biên bản/khai báo sự việc'] },
  { id: 'THEFT',       label: 'Mất cắp / mất bộ phận',   products: ['motor'], docs: ['Đơn trình báo công an'] },
  { id: 'FLOOD',       label: 'Ngập nước / thiên tai',   products: ['motor'], docs: ['Ảnh hiện trường'] },
  { id: 'HOSPITAL',    label: 'Nằm viện / điều trị nội trú', products: ['health'], docs: ['Giấy ra viện', 'Hoá đơn viện phí'] },
  { id: 'OUTPATIENT',  label: 'Điều trị ngoại trú',      products: ['health'], docs: ['Đơn thuốc', 'Hoá đơn'] },
  { id: 'ACCIDENT',    label: 'Tai nạn',                 products: ['health', 'pa'], docs: ['Biên bản tai nạn', 'Hồ sơ y tế'] },
  { id: 'DEATH',       label: 'Tử vong do tai nạn',      products: ['pa'], docs: ['Giấy chứng tử', 'Biên bản tai nạn'] },
  { id: 'DISABILITY',  label: 'Thương tật do tai nạn',   products: ['pa'], docs: ['Kết luận giám định y khoa'] },
  { id: 'OTHER',       label: 'Tổn thất khác',           products: null,   docs: [] }
];
BANCA.claimTypesFor = function (productId) {
  return BANCA.CLAIM_TYPES.filter(function (t) { return !t.products || t.products.indexOf(productId) >= 0; });
};

// ============================================================
// Ghi nhận yêu cầu sau bán (demo, localStorage).
// Portal CHỈ tạo ticket + theo dõi trạng thái do hệ thống nghiệp vụ trả về;
// KHÔNG tự đổi nội dung hợp đồng, KHÔNG tự duyệt/chi trả bồi thường.
// ============================================================
BANCA.POST_SALE_KEY = 'banca_post_sale';
// Nhãn thời gian dùng chung cho các bản ghi tạo tại portal (YYYY-MM-DD HH:MM).
BANCA.nowLabel = BANCA.nowLabel || function () {
  var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
};
BANCA.postSale = {
  load: function () {
    try {
      var d = JSON.parse(localStorage.getItem(BANCA.POST_SALE_KEY) || 'null') || {};
      d.serviceRequests = d.serviceRequests || [];
      d.claims = d.claims || [];
      d.contactLogs = d.contactLogs || [];
      return d;
    }
    catch (e) { return { serviceRequests: [], claims: [], contactLogs: [] }; }
  },
  save: function (data) {
    try { localStorage.setItem(BANCA.POST_SALE_KEY, JSON.stringify(data)); } catch (e) { }
  },
  // Mã ticket demo: SR-YYYY-#### / CLM-YYYY-####, kèm mã tham chiếu bên hệ thống xử lý.
  nextId: function (prefix, list) {
    var year = (BANCA.TODAY || '2026-07-28').slice(0, 4);
    var max = 0;
    (list || []).forEach(function (x) {
      var m = String(x.id || '').match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return prefix + '-' + year + '-' + String(max + 1).padStart(4, '0');
  },
  addServiceRequest: function (rec) {
    var store = BANCA.postSale.load();
    var all = (BANCA.serviceRequests || []).concat(store.serviceRequests || []);
    var now = BANCA.nowLabel();
    var item = Object.assign({
      id: BANCA.postSale.nextId('SR', all),
      status: 'SUBMITTED',
      createdAt: now, updatedAt: now,
      createdBy: BANCA.current && BANCA.current(),
      externalRef: 'CORE-SR-' + (90000 + all.length + 1),
      history: [{ at: now, text: 'Ghi nhận yêu cầu tại Sales Portal và gửi sang hệ thống xử lý', by: BANCA.current && BANCA.current() }]
    }, rec || {});
    store.serviceRequests = (store.serviceRequests || []).concat([item]);
    BANCA.postSale.save(store);
    BANCA.serviceRequests = (BANCA.serviceRequests || []).concat([item]);
    return item;
  },
  addClaim: function (rec) {
    var store = BANCA.postSale.load();
    var all = (BANCA.claims || []).concat(store.claims || []);
    var now = BANCA.nowLabel();
    var item = Object.assign({
      id: BANCA.postSale.nextId('CLM', all),
      status: 'NOTIFIED',
      notifiedAt: now, notifiedBy: BANCA.current && BANCA.current(),
      externalRef: 'CORE-CLM-' + (5000 + all.length + 1),
      timeline: [{ at: now, text: 'Khai báo tổn thất từ Sales Portal — chuyển hệ thống bồi thường' }]
    }, rec || {});
    store.claims = (store.claims || []).concat([item]);
    BANCA.postSale.save(store);
    BANCA.claims = (BANCA.claims || []).concat([item]);
    return item;
  },
  // Trạng thái do hệ thống xử lý trả về — portal chỉ ghi nhận lại (demo: mô phỏng callback).
  setStatus: function (kind, id, status, note) {
    var now = BANCA.nowLabel();
    var store = BANCA.postSale.load();
    var listName = kind === 'claim' ? 'claims' : 'serviceRequests';
    var apply = function (x) {
      if (x.id !== id) return x;
      x.status = status; x.updatedAt = now;
      if (kind === 'claim') x.timeline = (x.timeline || []).concat([{ at: now, text: note || ((BANCA.CLAIM_STATUS[status] || {}).label || status) }]);
      else x.history = (x.history || []).concat([{ at: now, text: note || ((BANCA.SERVICE_REQUEST_STATUS[status] || {}).label || status) }]);
      if (status !== 'NEED_INFO') x.missing = [];
      return x;
    };
    store[listName] = (store[listName] || []).map(apply);
    BANCA.postSale.save(store);
    BANCA[listName] = (BANCA[listName] || []).map(apply);
  },
  // Nhật ký chăm sóc của RM — LƯU TRONG PORTAL, không ghi Customer Master.
  // Chỉ ghi lại tương tác (gọi/hẹn/nhắc), không đụng danh tính/hồ sơ khách ở tầng dưới.
  addContactLog: function (rec) {
    var store = BANCA.postSale.load();
    var all = (BANCA.contactLogs || []).concat(store.contactLogs || []);
    var now = BANCA.nowLabel();
    var item = Object.assign({
      id: BANCA.postSale.nextId('CT', all),
      at: now, by: BANCA.current && BANCA.current()
    }, rec || {});
    store.contactLogs = (store.contactLogs || []).concat([item]);
    BANCA.postSale.save(store);
    BANCA.contactLogs = (BANCA.contactLogs || []).concat([item]);
    return item;
  }
};
// Ticket đã ghi nhận ở phiên trước được nạp lại cùng dữ liệu mẫu.
(function () {
  var store = BANCA.postSale.load();
  var seen = {};
  BANCA.serviceRequests = (BANCA.serviceRequests || []).concat(store.serviceRequests || [])
    .filter(function (x) { if (seen['s' + x.id]) return false; seen['s' + x.id] = 1; return true; });
  BANCA.claims = (BANCA.claims || []).concat(store.claims || [])
    .filter(function (x) { if (seen['c' + x.id]) return false; seen['c' + x.id] = 1; return true; });
  BANCA.contactLogs = (BANCA.contactLogs || []).concat(store.contactLogs || [])
    .filter(function (x) { if (seen['t' + x.id]) return false; seen['t' + x.id] = 1; return true; });
})();

BANCA.contactLogsOf = function (policyId) {
  return (BANCA.contactLogs || []).filter(function (c) { return c.policyId === policyId; })
    .sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
};

BANCA.serviceRequestsOf = function (policyId) {
  return (BANCA.serviceRequests || []).filter(function (s) { return s.policyId === policyId; });
};
BANCA.claimsOf = function (policyId) {
  return (BANCA.claims || []).filter(function (c) { return c.policyId === policyId; });
};
