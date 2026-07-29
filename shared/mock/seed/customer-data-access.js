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
  // Ghi nhận consent: contract kiểm toán đầy đủ (§4.2 IDENTIFIED_CONTEXT).
  // KHÔNG do seller "tick" — đây là bản ghi hệ thống, giữ đủ trường để đối soát.
  recordConsent: function (ctx, consentVersion, opts) {
    ctx = ctx || {}; opts = opts || {};
    ctx.consent = BANCA.makeConsentRecord({
      consentVersion: consentVersion,
      consentChannel: opts.consentChannel,
      externalCustomerRef: ctx.externalCustomerRef || ctx.customerRef || opts.externalCustomerRef,
      customerRef: ctx.customerRef || opts.customerRef,
      dataRetrievedAt: opts.dataRetrievedAt,
      sourceSystem: opts.sourceSystem
    });
    ctx.dataAccessStage = 'IDENTIFIED_CONTEXT';
    return ctx;
  }
};

// CustomerConsent (Data contract) — NGUỒN DUY NHẤT dựng bản ghi consent kiểm toán được.
// Đủ trường contract; giữ alias `version`/`grantedAt` cho UI cũ (consentStatus) không vỡ.
BANCA.makeConsentRecord = function (o) {
  o = o || {};
  var now = new Date().toISOString();
  var version = o.consentVersion || o.version || 'CONSENT_BANCA_v1';
  var ts = o.consentTimestamp || o.grantedAt || now;
  var channel = o.consentChannel || (BANCA.channel && BANCA.channel()) || null;
  return {
    consentId:        o.consentId || ('CNST-' + Math.floor(100000 + Math.random() * 899999)),
    consentType:      o.consentType || 'DATA_SHARING_PII',
    consentVersion:   version,
    consentStatus:    o.consentStatus || 'GRANTED',
    consentTimestamp: ts,
    consentChannel:   channel,
    externalCustomerRef: o.externalCustomerRef || null,
    customerRef:      o.customerRef || o.externalCustomerRef || null,
    dataRetrievedAt:  o.dataRetrievedAt || null,   // set khi PII thực sự được lấy
    sourceSystem:     o.sourceSystem || 'BANK',
    // --- alias tương thích UI cũ (consentStatus renderer) ---
    version:          version,
    grantedAt:        ts,
    channel:          channel
  };
};

// Mock PII fetch (§4.2) — gọi bằng externalCustomerRef SAU consent, gắn source cho từng field.
// FAIL-CLOSED: không match external ref → KHÔNG trả PII khách khác (tuyệt đối không fallback pool[0]).
//   matched=false + error → caller phải xử lý như error/recovery state, KHÔNG chuyển IDENTIFIED.
// Trả {matched, fields:{k:{value, source, readonly}}|null, error} để UI gắn DataSourceBadge + ReadOnlyField.
BANCA.fetchCustomerPII = function (externalCustomerRef) {
  var pool = (BANCA.customers || []);
  var c = externalCustomerRef ? pool.find(function (x) {
    return x.id === externalCustomerRef || x.customerRef === externalCustomerRef || x.externalCustomerId === externalCustomerRef;
  }) : null;
  if (!c) {
    // Không khớp → fail-closed. Không có `fields`. Không lấy PII của bất kỳ ai.
    return {
      externalCustomerRef: externalCustomerRef || null,
      fetchedAt: new Date().toISOString(),
      source: 'BANK',
      matched: false,
      fields: null,
      error: {
        code: 'CUSTOMER_REF_NOT_FOUND',
        message: 'Không tìm thấy khách hàng khớp mã tham chiếu — không thể lấy dữ liệu định danh. Vui lòng đối soát mã với ngân hàng.'
      }
    };
  }
  function f(value, source, readonly) { return { value: value != null ? value : null, source: source || 'BANK', readonly: readonly !== false }; }
  return {
    externalCustomerRef: c.id || externalCustomerRef,
    fetchedAt: new Date().toISOString(),
    source: 'BANK',
    matched: true,
    error: null,
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

// Data-sharing grant status (correction 2026-07-27) — consent/grant KHÔNG do seller tự cấp.
// GRANTED_BY_SOURCE: ngân hàng đã xác lập căn cứ chia sẻ khi truyền context sang Portal.
BANCA.DATA_SHARING_GRANT = {
  NONE:                { id: 'NONE',                identified: false },
  GRANTED_BY_SOURCE:   { id: 'GRANTED_BY_SOURCE',   identified: true  }, // Bank CRM/Core Banking
  GRANTED_BY_CUSTOMER: { id: 'GRANTED_BY_CUSTOMER', identified: true  }  // customer session/OTP (Quick Advice convert)
};
// Stage suy ra từ grant (thao tác hệ thống, không phải bước seller bấm).
BANCA.stageFromGrant = function (grant) {
  var g = BANCA.DATA_SHARING_GRANT[grant];
  return (g && g.identified) ? 'IDENTIFIED_CONTEXT' : 'ANONYMOUS_CONTEXT';
};

// Nguồn dữ liệu → nhãn cho DataSourceBadge (§4.2).
BANCA.DATA_SOURCES = {
  BANK:   { label: 'Ngân hàng', cls: 'src-bank' },
  OCR:    { label: 'OCR tài liệu', cls: 'src-ocr' },
  MANUAL: { label: 'Nhập tay', cls: 'src-manual' },
  PORTAL: { label: 'Hệ thống', cls: 'src-portal' }
};
