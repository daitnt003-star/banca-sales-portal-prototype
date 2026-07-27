// ============================================================
// CustomerDataAccessStage (§4.2) — kiểm soát PII theo consent.
// Giá trị lõi #1: KHÔNG hiển thị định danh khách hàng trước khi khách đồng ý.
// Page đọc BANCA.dataAccess.* — KHÔNG hard-code field nào được hiện.
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.DATA_ACCESS_STAGES = {
  ANONYMOUS_CONTEXT: { id: 'ANONYMOUS_CONTEXT', order: 1, label: 'Chưa chia sẻ định danh', pii: false },
  CONSENT_PENDING:   { id: 'CONSENT_PENDING',   order: 2, label: 'Chờ khách đồng ý',      pii: false },
  IDENTIFIED_CONTEXT:{ id: 'IDENTIFIED_CONTEXT', order: 3, label: 'Đã lấy thông tin',      pii: true  },
  VERIFIED_CUSTOMER: { id: 'VERIFIED_CUSTOMER', order: 4, label: 'Đã xác minh KYC',        pii: true  }
};

// Field được phép hiển thị ở ANONYMOUS_CONTEXT (§4.2 — chỉ context nghiệp vụ, KHÔNG PII).
BANCA.ANONYMOUS_ALLOWED_FIELDS = [
  'customerRef', 'ageBand', 'age', 'gender', 'occupationGroup', 'incomeBand',
  'loanType', 'loanAmount', 'loanTerm', 'relatedAsset', 'insuranceNeed', 'branch', 'rm'
];
// Field PII — TUYỆT ĐỐI ẩn trước IDENTIFIED_CONTEXT. Không dùng tên giả/masking (§4.2).
BANCA.PII_FIELDS = ['fullName', 'phone', 'email', 'nationalId', 'address', 'bankAccount'];

BANCA.dataAccess = {
  stageOrder: function (s) { return (BANCA.DATA_ACCESS_STAGES[s] || {}).order || 0; },
  // PII chỉ hiện từ IDENTIFIED_CONTEXT trở lên.
  canShowPII: function (stage) { return BANCA.dataAccess.stageOrder(stage) >= 3; },
  isFieldVisible: function (field, stage) {
    if (BANCA.PII_FIELDS.indexOf(field) >= 0) return BANCA.dataAccess.canShowPII(stage);
    return true; // context ẩn danh + field thường luôn hiện
  },
  // Ghi nhận consent: version + timestamp (§4.2 IDENTIFIED_CONTEXT).
  recordConsent: function (ctx, consentVersion) {
    ctx = ctx || {};
    ctx.consent = {
      version: consentVersion || 'CONSENT_BANCA_v1',
      grantedAt: new Date().toISOString(),
      channel: (BANCA.channel && BANCA.channel()) || null
    };
    ctx.dataAccessStage = 'IDENTIFIED_CONTEXT';
    return ctx;
  }
};

// Mock PII fetch (§4.2) — gọi bằng externalCustomerRef SAU consent, gắn source cho từng field.
// Trả {fields:{k:{value, source, readonly}}} để UI gắn DataSourceBadge + ReadOnlyField.
BANCA.fetchCustomerPII = function (externalCustomerRef) {
  var pool = (BANCA.customers || []);
  var c = pool.find(function (x) {
    return x.id === externalCustomerRef || x.customerRef === externalCustomerRef || x.externalCustomerId === externalCustomerRef;
  }) || pool[0] || {};
  function f(value, source, readonly) { return { value: value != null ? value : null, source: source || 'BANK', readonly: readonly !== false }; }
  return {
    externalCustomerRef: externalCustomerRef || (c && c.id) || null,
    fetchedAt: new Date().toISOString(),
    source: 'BANK',
    fields: {
      fullName:   f(c.name || c.fullName, 'BANK', true),
      phone:      f(c.phone, 'BANK', false),
      email:      f(c.email, 'BANK', false),
      nationalId: f(c.nationalId || c.cccd, 'BANK', true),
      address:    f(c.address, 'BANK', false),
      dob:        f(c.dob, 'BANK', true),
      gender:     f(c.gender, 'BANK', true)
    }
  };
};

// Nguồn dữ liệu → nhãn cho DataSourceBadge (§4.2).
BANCA.DATA_SOURCES = {
  BANK:   { label: 'Ngân hàng', cls: 'src-bank' },
  OCR:    { label: 'OCR tài liệu', cls: 'src-ocr' },
  MANUAL: { label: 'Nhập tay', cls: 'src-manual' },
  PORTAL: { label: 'Hệ thống', cls: 'src-portal' }
};
