// ============================================================
// ChannelProfile (§4.1) — 1 nền tảng, nhiều mô hình vận hành.
// Điều khiển ENTRY BEHAVIOR + customer-selection visibility bằng CONFIG,
// KHÔNG clone 3 portal. Page chỉ đọc BANCA.channel()/BANCA.channelProfile().
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.CHANNEL_PROFILES = {
  BANCA_INTEGRATED: {
    id: 'BANCA_INTEGRATED',
    label: 'Banca — Tích hợp Bank CRM',
    short: 'Banca tích hợp',
    // Entry: mở từ hệ thống ngân hàng (embed/deep link/new tab)
    entryModes: ['BANK_CUSTOMER', 'HANDOVER', 'QUICK_ADVICE_CONVERSION'],
    defaultEntryMode: 'BANK_CUSTOMER',
    // §5.2 — happy path KHÔNG có customer selection
    showCustomerList: false,
    allowCreateCustomer: false,
    allowBrowsePortfolio: false,
    requiresExternalCustomerRef: true,   // giữ externalCustomerRef xuyên suốt
    // §4.2 — bắt đầu ẩn danh, chỉ lấy PII sau consent
    initialDataAccessStage: 'ANONYMOUS_CONTEXT',
    prefillSource: 'BANK',
    ctaPrimary: 'Tư vấn và bán bảo hiểm'
  },
  BANCA_STANDALONE: {
    id: 'BANCA_STANDALONE',
    label: 'Banca — Standalone',
    short: 'Banca standalone',
    entryModes: ['BANK_CUSTOMER', 'REFERRAL', 'NEW_PROSPECT', 'PRODUCT_FIRST', 'QUICK_ADVICE_CONVERSION'],
    defaultEntryMode: 'NEW_PROSPECT',
    showCustomerList: true,            // standalone fallback được chọn KH
    allowCreateCustomer: true,
    allowBrowsePortfolio: false,
    requiresExternalCustomerRef: false,
    initialDataAccessStage: 'ANONYMOUS_CONTEXT',
    prefillSource: 'BANK_OR_MANUAL',
    ctaPrimary: 'Tư vấn và bán bảo hiểm'
  },
  // ── ĐẠI LÝ và MÔI GIỚI TÁCH LÀM HAI ─────────────────────────────────────
  // Trước đây gộp làm một profile 'AGENT_BROKER'. Ở mức HÀNH VI VÀO MÀN HÌNH
  // hai bên thật sự giống nhau (đều tự tạo KH, đều có portfolio, đều nhập tay)
  // — nên gộp không lộ vấn đề. Nhưng bốn thứ dưới đây khác hẳn nhau:
  //   · tư cách pháp lý khi tư vấn/thu xếp   [IF1 3/9 tr.94 F3A/F3B]
  //   · quyền bind mặc định                   [CPCU tr.3.20]
  //   · sở hữu sổ khách khi chấm dứt          [CPCU tr.3.20, 3.24]
  //   · ai gánh hậu quả khi khai sai          [IF3 1/8 C4 · IF1 3/13 tr.97 G4]
  //
  // ⚠️ Bẫy ②: CPCU tr.3.20 cảnh báo "the same person can act as an agent in one
  // transaction and as a broker in another" ⇒ ĐỪNG suy quyền bind từ nhãn kênh.
  // Quyền bind vẫn phải tra hạn mức thật (BANCA.bindAuthorityFor).
  AGENT: {
    id: 'AGENT',
    label: 'Đại lý',
    short: 'Đại lý',
    entryModes: ['NEW_PROSPECT', 'PRODUCT_FIRST', 'REFERRAL', 'RENEWAL', 'QUICK_ADVICE_CONVERSION'],
    defaultEntryMode: 'NEW_PROSPECT',
    showCustomerList: true,
    allowCreateCustomer: true,
    allowBrowsePortfolio: true,
    requiresExternalCustomerRef: false,
    initialDataAccessStage: 'IDENTIFIED_CONTEXT',
    prefillSource: 'MANUAL',
    ctaPrimary: 'Tư vấn và bán bảo hiểm',
    intermediaryKind: 'AGENT'
  },
  BROKER: {
    id: 'BROKER',
    label: 'Môi giới',
    short: 'Môi giới',
    entryModes: ['NEW_PROSPECT', 'PRODUCT_FIRST', 'REFERRAL', 'RENEWAL', 'QUICK_ADVICE_CONVERSION'],
    defaultEntryMode: 'NEW_PROSPECT',
    showCustomerList: true,
    allowCreateCustomer: true,
    allowBrowsePortfolio: true,
    requiresExternalCustomerRef: false,
    initialDataAccessStage: 'IDENTIFIED_CONTEXT',
    prefillSource: 'MANUAL',
    ctaPrimary: 'Tư vấn và bán bảo hiểm',
    intermediaryKind: 'BROKER'
  }
};

// Tên cũ vẫn nhận, quy về Đại lý — để link/demo cũ không vỡ.
BANCA.CHANNEL_ALIAS = { AGENT_BROKER: 'AGENT' };
BANCA.CHANNEL_ENUM = ['BANCA_INTEGRATED', 'BANCA_STANDALONE', 'AGENT', 'BROKER'];
BANCA.DEFAULT_CHANNEL = 'BANCA_INTEGRATED';

// Demo switch (§ user: switch account để demo Banca ↔ Agent) — lưu localStorage.
BANCA.channel = function () {
  try { return localStorage.getItem('bancaChannel') || BANCA.DEFAULT_CHANNEL; }
  catch (e) { return BANCA.DEFAULT_CHANNEL; }
};
BANCA.setChannel = function (id) {
  if (!BANCA.CHANNEL_PROFILES[id]) return;
  try { localStorage.setItem('bancaChannel', id); } catch (e) {}
  if (typeof location !== 'undefined') location.reload();
};
BANCA.channelProfile = function (id) {
  id = id || BANCA.channel();
  id = BANCA.CHANNEL_ALIAS[id] || id;
  return BANCA.CHANNEL_PROFILES[id] || BANCA.CHANNEL_PROFILES[BANCA.DEFAULT_CHANNEL];
};

/* ============================================================
 * TƯ CÁCH PHÁP LÝ GẮN VÀO HÀNH ĐỘNG, KHÔNG GẮN VÀO TÀI KHOẢN
 *
 * [CII IF1 ch.3 mục F3A/F3B, tr.94] — trung gian độc lập là đại lý CỦA KHÁCH
 * khi (a) tư vấn phạm vi bảo hiểm hoặc thu xếp bảo hiểm, (b) tư vấn/hỗ trợ
 * khách làm hồ sơ bồi thường; và là đại lý CỦA DNBH khi nhận giấy yêu cầu thay
 * DNBH & xác nhận cover, khảo sát tài sản, thu phí, trả bồi thường.
 *
 * ⇒ Cùng một người, cùng một màn hình, tư cách ĐỔI THEO TỪNG THAO TÁC.
 *   Đây là lý do KHÔNG gắn tư cách vào profile hay vào role đăng nhập.
 *
 * PARTICIPATION_ROLE (handoffs.js) là vai trò GHI NHẬN DOANH SỐ — khác hẳn.
 * Hai thứ trùng nhau ở banca (nên chưa lộ) và TÁCH HẲN ở môi giới.
 *
 * [VN] ⚠️ Bảng dưới đây theo luật ANH. Đại lý ở Việt Nam về nguyên tắc đại diện
 *      DNBH — KHÁC mô hình này. PHẢI đối chiếu Luật KDBH 2022 trước khi dùng
 *      để phân quyền thật. Giá trị 'UNDETERMINED' là mặc định có chủ ý:
 *      thà nói "chưa xác định" còn hơn khẳng định sai.
 * ============================================================ */
BANCA.LEGAL_CAPACITY_SOURCE = 'CII_IF1_UK — cần đối chiếu Luật KDBH 2022';

BANCA.ACTION_CAPACITY = {
  // hành động → tư cách, theo từng loại trung gian
  ADVISE_COVER:      { label:'Tư vấn phạm vi bảo hiểm',        BROKER:'CUSTOMER', AGENT:'UNDETERMINED' },
  PLACE_INSURANCE:   { label:'Thu xếp/đặt bảo hiểm',           BROKER:'CUSTOMER', AGENT:'UNDETERMINED' },
  ASSIST_CLAIM:      { label:'Hỗ trợ khách làm hồ sơ bồi thường', BROKER:'CUSTOMER', AGENT:'UNDETERMINED' },
  RECEIVE_PROPOSAL:  { label:'Nhận giấy yêu cầu thay DNBH',    BROKER:'INSURER',  AGENT:'INSURER' },
  CONFIRM_COVER:     { label:'Xác nhận hiệu lực bảo hiểm',     BROKER:'INSURER',  AGENT:'INSURER' },
  SURVEY_RISK:       { label:'Khảo sát/mô tả tài sản thay DNBH', BROKER:'INSURER', AGENT:'INSURER' },
  COLLECT_PREMIUM:   { label:'Thu phí',                        BROKER:'INSURER',  AGENT:'INSURER' },
  PAY_CLAIM:         { label:'Trả bồi thường',                 BROKER:'INSURER',  AGENT:'INSURER' }
};

BANCA.CAPACITY_LABEL = {
  CUSTOMER:     'Đang đại diện KHÁCH HÀNG',
  INSURER:      'Đang đại diện DOANH NGHIỆP BẢO HIỂM',
  UNDETERMINED: 'Chưa xác định — cần đối chiếu Luật KDBH 2022',
  NA:           'Không áp dụng cho kênh này'
};

// Tư cách khi thực hiện `action` ở kênh hiện hành.
// Banca (nhân viên ngân hàng bán dưới tư cách tổ chức) KHÔNG dùng trục này.
BANCA.capacityFor = function (action, channelId) {
  var prof = BANCA.channelProfile(channelId);
  var kind = prof.intermediaryKind;
  var row = BANCA.ACTION_CAPACITY[action];
  if (!row) return { capacity:'NA', label:BANCA.CAPACITY_LABEL.NA, action:action };
  if (!kind) return { capacity:'NA', label:BANCA.CAPACITY_LABEL.NA, action:action, actionLabel:row.label };
  var cap = row[kind] || 'UNDETERMINED';
  return {
    action: action, actionLabel: row.label, intermediaryKind: kind,
    capacity: cap, label: BANCA.CAPACITY_LABEL[cap],
    needsVietnamCheck: cap === 'UNDETERMINED',
    source: BANCA.LEGAL_CAPACITY_SOURCE
  };
};
// Helper: happy path có được phép hiển thị danh sách khách hàng không?
BANCA.channelShowsCustomerList = function () { return !!BANCA.channelProfile().showCustomerList; };
