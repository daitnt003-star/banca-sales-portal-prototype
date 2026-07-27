// Status model chuẩn theo PROJECT_OVERVIEW.md v1 (2026-07-20)
window.BANCA = window.BANCA || {};

// 7 bước journey chuẩn hóa (unsubmitted filter theo current_stage)
BANCA.STAGES = [
  {id:'CUSTOMER_INFO',      label:'Thông tin khách hàng'},
  {id:'INSURED_PARTY',      label:'Đối tượng bảo hiểm'},
  {id:'RISK_OBJECT',        label:'Đối tượng bảo hiểm'},
  {id:'PACKAGE_AND_QUOTE',  label:'Gói bảo hiểm & báo giá'},
  {id:'RISK_DECLARATION',   label:'Khai báo rủi ro'},
  {id:'DOCUMENTS',          label:'Tài liệu'},
  {id:'REVIEW_AND_SUBMIT',  label:'Kiểm tra & nộp'}
];
BANCA.stageLabel = id => (BANCA.STAGES.find(s=>s.id===id)||{}).label || id;
BANCA.stageIndex = id => BANCA.STAGES.findIndex(s=>s.id===id);

// Lifecycle status sau khi nộp (submitted filter theo application_status)
BANCA.APP_STATUS = {
  PENDING_RECEIPT:          {label:'Chờ tiếp nhận',            group:'UW',       cls:'badge-pending'},
  PENDING_UW:               {label:'Chờ thẩm định',            group:'UW',       cls:'badge-pending'},
  IN_UW:                    {label:'Đang thẩm định',           group:'UW',       cls:'badge-conditional'},
  NEED_MORE_INFO:           {label:'Cần bổ sung',              group:'SUPPLEMENT',cls:'badge-blocked'},
  UW_DECIDED:               {label:'Đã có kết quả thẩm định',  group:'UW',       cls:'badge-conditional'},
  PENDING_CUSTOMER_CONFIRM: {label:'Chờ khách xác nhận',       group:'CONFIRM',  cls:'badge-conditional'},
  PAYMENT_METHOD_REQUIRED:  {label:'Chờ chọn cách thanh toán', group:'PAYMENT',  cls:'badge-conditional'},
  PENDING_PAYMENT:          {label:'Chờ thanh toán',           group:'PAYMENT',  cls:'badge-conditional'},
  PAID:                     {label:'Đã thanh toán',            group:'PAYMENT',  cls:'badge-ready'},
  PENDING_ISSUE:            {label:'Chờ phát hành hợp đồng',   group:'ISSUE',    cls:'badge-pending'},
  ISSUED:                   {label:'Đã phát hành',             group:'DONE',     cls:'badge-ready'},
  REJECTED:                 {label:'Bị từ chối',               group:'FAILED',   cls:'badge-blocked'},
  CANCELLED:                {label:'Đã hủy',                   group:'FAILED',   cls:'badge-blocked'}
};
BANCA.STATUS_GROUPS = [
  {id:'ALL',        label:'Tất cả'},
  {id:'UW',         label:'Thẩm định'},
  {id:'SUPPLEMENT', label:'Cần bổ sung'},
  {id:'CONFIRM',    label:'Chờ khách xác nhận'},
  {id:'PAYMENT',    label:'Thanh toán'},
  {id:'ISSUE',      label:'Phát hành'},
  {id:'DONE',       label:'Đã hoàn tất'},
  {id:'FAILED',     label:'Không thành công'}
];

// Warning flags — badge, KHÔNG phải status chính
BANCA.WARNING_FLAGS = {
  MISSING_INFORMATION:            {label:'Thiếu thông tin',        cls:'badge-blocked'},
  MISSING_DOCUMENT:               {label:'Thiếu tài liệu',         cls:'badge-blocked'},
  QUOTE_NEED_RERATE:              {label:'Cần tính phí lại',       cls:'badge-conditional'},
  QUOTE_EXPIRING:                 {label:'Báo giá sắp hết hạn',    cls:'badge-conditional'},
  PRODUCT_AUTH_CHANGED:           {label:'Quyền sản phẩm thay đổi',cls:'badge-blocked'},
  CUSTOMER_CONFIRMATION_REQUIRED: {label:'Cần khách xác nhận',     cls:'badge-conditional'}
};

// Thẩm định decision (model riêng, không phải application_status)
BANCA.UW_DECISIONS = {
  APPROVED:                {label:'Chấp thuận',                 cls:'badge-ready'},
  APPROVED_WITH_LOADING:   {label:'Chấp thuận có tăng phí',     cls:'badge-conditional'},
  APPROVED_WITH_EXCLUSION: {label:'Chấp thuận có loại trừ',     cls:'badge-conditional'},
  APPROVED_WITH_CONDITION: {label:'Chấp thuận có điều kiện',    cls:'badge-conditional'},
  REJECTED:                {label:'Từ chối',                    cls:'badge-blocked'}
};

// Policy status tối giản (OQ-05 chốt)
BANCA.POLICY_STATUS = {
  ACTIVE:    {label:'Đang hiệu lực', cls:'badge-ready'},
  EXPIRED:   {label:'Hết hiệu lực',  cls:'badge-pending'},
  CANCELLED: {label:'Đã hủy',        cls:'badge-blocked'}
};

// Helpers
// P1-3: nhãn tiếng Việt cho mọi enum ra UI — không hiển thị SNAKE_CASE thô
BANCA.LABELS = {
  paymentMethod: {QR:'QR Code', CARD:'Thẻ ngân hàng', BANK_TRANSFER:'Chuyển khoản ngân hàng', CASH:'Tiền mặt'},
  paymentStatus: {PENDING:'Chờ thanh toán', SUCCESS:'Thành công', FAILED:'Thất bại', EXPIRED:'Hết hạn thanh toán', TIMEOUT:'Quá thời gian chờ'},
  source: {BANK_CUSTOMER:'Khách hàng ngân hàng', NEW_PROSPECT:'Khách hàng mới', QUICK_ADVISE:'Tư vấn nhanh', REFERRAL:'Lead/Referral', RENEWAL:'Tái tục'},
  delivery: {DELIVERED:'Đã gửi tới khách', PENDING:'Đang gửi', FAILED:'Gửi thất bại'},
  otp: {PENDING:'Chưa xác thực', VERIFIED:'Đã xác thực'},
  scope: {OWN:'Của tôi', ASSIGNED:'Được giao', PORTFOLIO:'Danh mục', SERVICING:'Đang phục vụ', CONTEXT_GRANTED:'Theo ngữ cảnh', PROSPECT:'Prospect', TEAM:'Đội nhóm', BRANCH:'Chi nhánh', DELEGATED_CASE:'Ủy quyền'}
};
BANCA.label = (group,key) => (BANCA.LABELS[group]||{})[key] || key;
BANCA.appStatusBadge = s => {const m=BANCA.APP_STATUS[s]||{label:s,cls:'badge-pending'};return `<span class="badge ${m.cls}">${m.label}</span>`;};
BANCA.warnBadge = f => {const m=BANCA.WARNING_FLAGS[f]||{label:f,cls:'badge-pending'};return `<span class="badge ${m.cls}" style="font-size:10.5px;">${m.label}</span>`;};
BANCA.uwBadge = d => {const m=BANCA.UW_DECISIONS[d]||{label:d,cls:'badge-pending'};return `<span class="badge ${m.cls}">${m.label}</span>`;};
BANCA.policyBadge = s => {const m=BANCA.POLICY_STATUS[s]||{label:s,cls:'badge-pending'};return `<span class="badge ${m.cls}">${m.label}</span>`;};
BANCA.vnd = n => (n||0).toLocaleString('vi-VN') + ' ₫';
