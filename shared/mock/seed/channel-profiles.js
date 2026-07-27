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
  AGENT_BROKER: {
    id: 'AGENT_BROKER',
    label: 'Đại lý / Môi giới',
    short: 'Agent/Broker',
    entryModes: ['NEW_PROSPECT', 'PRODUCT_FIRST', 'REFERRAL', 'RENEWAL', 'QUICK_ADVICE_CONVERSION'],
    defaultEntryMode: 'NEW_PROSPECT',
    showCustomerList: true,            // có customer & prospect list
    allowCreateCustomer: true,
    allowBrowsePortfolio: true,
    requiresExternalCustomerRef: false,
    initialDataAccessStage: 'IDENTIFIED_CONTEXT', // agent tự tạo KH nên có PII sớm hơn
    prefillSource: 'MANUAL',
    ctaPrimary: 'Tư vấn và bán bảo hiểm'
  }
};

BANCA.CHANNEL_ENUM = ['BANCA_INTEGRATED', 'BANCA_STANDALONE', 'AGENT_BROKER'];
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
  return BANCA.CHANNEL_PROFILES[id || BANCA.channel()] || BANCA.CHANNEL_PROFILES[BANCA.DEFAULT_CHANNEL];
};
// Helper: happy path có được phép hiển thị danh sách khách hàng không?
BANCA.channelShowsCustomerList = function () { return !!BANCA.channelProfile().showCustomerList; };
