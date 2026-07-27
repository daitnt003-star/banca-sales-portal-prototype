// ============================================================
// Journey Registry & Data Contracts (P0.1 + P0.2) — HARDENED
// Contract-first: mọi thứ serialize được, KHÔNG nhét executable logic
// vào definition (rating/underwriting/document dùng *strategy id* + dispatcher).
// UI slice sau CHỈ đọc ProductJourneyDefinition + ApplicationRoutingResult.
// ============================================================
window.BANCA = window.BANCA || {};

/* ---------------------------------------------------------------
 * P0.1 — SalesEntryContext (G2: giữ nguyên source payload)
 * ------------------------------------------------------------- */
// Enum chính thức 7 entry mode (không để code đoán).
BANCA.ENTRY_MODES = {
  BANK_CUSTOMER:           {label:'Khách hàng ngân hàng',   source:'BANK',     productLocked:false},
  REFERRAL:                {label:'Lead/Referral được giao', source:'REFERRAL', productLocked:false},
  RENEWAL:                 {label:'Tái tục hợp đồng',        source:'RENEWAL',  productLocked:true},
  PRODUCT_FIRST:           {label:'Chọn sản phẩm trước',     source:'PORTAL',   productLocked:true},
  NEW_PROSPECT:            {label:'Khách hàng mới',          source:'PORTAL',   productLocked:false},
  HANDOVER:                {label:'Yêu cầu bàn giao',          source:'CRM',      productLocked:false},
  QUICK_ADVICE_CONVERSION: {label:'Chuyển từ Tư vấn nhanh',  source:'ADVICE',   productLocked:false},
  // Alias tương thích code cũ (map về BANK_CUSTOMER về mặt hành vi).
  INSURANCE_CUSTOMER:      {label:'Khách bảo hiểm hiện có',  source:'BANK',     productLocked:false, alias:'BANK_CUSTOMER'}
};
// Danh sách 7 mode chính thức (không tính alias).
BANCA.ENTRY_MODE_ENUM = ['BANK_CUSTOMER','REFERRAL','RENEWAL','PRODUCT_FIRST','NEW_PROSPECT','HANDOVER','QUICK_ADVICE_CONVERSION'];

BANCA.buildSalesEntryContext = function(raw){
  raw = raw || {};
  const mode = raw.entryMode || 'NEW_PROSPECT';
  const cfg  = BANCA.ENTRY_MODES[mode] || BANCA.ENTRY_MODES.NEW_PROSPECT;
  const productId = raw.selectedProductId || raw.productId || null;
  const journey = productId ? BANCA.journeyFor(productId) : null;
  return {
    entryMode:            mode,
    sourceSystem:         raw.sourceSystem || cfg.source,
    // G2: external reference — để callback đúng & đối soát integration.
    sourceReference: {
      externalCustomerId: raw.externalCustomerId || raw.customerRef || raw.customerId || null,
      externalReferralId: raw.externalReferralId || raw.referralRef || raw.leadId || null,
      externalPolicyId:   raw.externalPolicyId || raw.renewalPolicyRef || raw.renewalPolicyId || null,
      externalCaseId:     raw.externalCaseId || raw.handoverRef || raw.handoffId || null
    },

    customerRef:          raw.customerRef || raw.customerId || null,
    referralRef:          raw.referralRef || raw.leadId || null,
    renewalPolicyRef:     raw.renewalPolicyRef || raw.renewalPolicyId || null,
    handoverRef:          raw.handoverRef || raw.handoffId || null,

    // recommended TÁCH KHỎI selected — trace được "hệ thống gợi ý X, nhân viên tư vấn chọn Y".
    selectedProductId:    productId,
    recommendedProductId: raw.recommendedProductId || null,
    recommendationReason: raw.recommendationReason || null,
    productLocked:        raw.productLocked!=null ? raw.productLocked : cfg.productLocked,

    sellerRef:            raw.sellerRef || raw.sellerId || (BANCA.current&&BANCA.current()),
    branchRef:            raw.branchRef || raw.branchId || null,
    campaignRef:          raw.campaignRef || raw.campaignId || raw.campaign || null,

    prefillData:          raw.prefillData || {},
    startStage:           raw.startStage || (journey ? journey.stages[0].id : 'CUSTOMER_INFO'),

    // G2: KHÔNG bỏ mất payload nguồn (audit/debug/đối soát/prefill provenance).
    originalPayload:      raw.originalPayload || Object.assign({}, raw),
    createdAt:            raw.createdAt || new Date().toISOString()
  };
};

/* ---------------------------------------------------------------
 * P0.2 — Product Journey Definition Registry
 * ------------------------------------------------------------- */
BANCA.JOURNEY_STAGE_CATALOG = {
  CUSTOMER_INFO:      {label:'Khách hàng'},
  INSURED_PARTY:      {label:'Đối tượng bảo hiểm'},
  RISK_OBJECT:        {label:'Đối tượng bảo hiểm'},
  PACKAGE_AND_QUOTE:  {label:'Gói & phí dự kiến'},
  RISK_DECLARATION:   {label:'Khai báo rủi ro'},
  DOCUMENTS:          {label:'Tài liệu'},
  REVIEW_AND_SUBMIT:  {label:'Kiểm tra và nộp'},
  UNDERWRITING:       {label:'Thẩm định', postSubmit:true},
  PAYMENT:            {label:'Thanh toán', postSubmit:true},
  ISSUANCE:           {label:'Phát hành', postSubmit:true}
};

function _stages(list){
  return list.map(function(x){
    if(typeof x === 'string'){
      const c = BANCA.JOURNEY_STAGE_CATALOG[x] || {label:x};
      return {id:x, label:c.label, postSubmit:!!c.postSubmit, component:x, readonlyAfterSubmit:!c.postSubmit};
    }
    const c = BANCA.JOURNEY_STAGE_CATALOG[x.id] || {};
    return {id:x.id, label:x.label || c.label || x.id, postSubmit:x.postSubmit!=null?x.postSubmit:!!c.postSubmit,
            component:x.component || x.id, readonlyAfterSubmit:x.readonlyAfterSubmit!=null?x.readonlyAfterSubmit:!c.postSubmit};
  });
}

BANCA.ProductJourneyDefinitions = {
  motor: {
    productId:        'motor',
    productVersion:   'motor@1',
    journeyVersion:   'motor-journey@1',
    customerType:     'ANY',
    riskObjectType:   'VEHICLE',
    quickRatingSchemaId:'motorQuickRating@1',
    fullRiskSchemaId:  'motorFullRisk@1',
    declarationSchemaId:'motorDeclaration@1',
    packageSchemaId:  'motorPackages@1',
    documentRuleSetId:'motorDocuments@1',
    ratingStrategy:   'MOTOR_RATING_V1',
    underwritingStrategy:'MOTOR_RULE_BASED_V1',
    underwritingMode: 'RULE_BASED',
    underwritingDefinition: {decisionSource:'RULE_ENGINE', ruleSetCode:'MOTOR_UW', ruleVersion:'2.1', manualUnit:'Motor Thẩm định', queueCode:'MOTOR_UW_QUEUE'},
    paymentMode:      'STANDARD',
    issueMode:        'STP_OR_REFERRAL',
    reviewLayout:     'motorReview',
    reviewSections:   ['customer','vehicle','package','riskDeclaration','documents','quote'],
    certificateTemplate:'motorCertificate@1',
    supportedEntryModes:['BANK_CUSTOMER','REFERRAL','RENEWAL','PRODUCT_FIRST','NEW_PROSPECT','HANDOVER','QUICK_ADVICE_CONVERSION'],
    effectiveFrom:    '2026-01-01',
    effectiveTo:      null,
    hiddenStages:     ['INSURED_PARTY'],
    stages: _stages([
      'CUSTOMER_INFO',
      {id:'RISK_OBJECT', label:'Đối tượng bảo hiểm', component:'motorVehicle'},
      {id:'PACKAGE_AND_QUOTE', label:'Gói & phí dự kiến', component:'motorPackage'},
      {id:'RISK_DECLARATION', component:'motorDeclaration'},
      {id:'DOCUMENTS', component:'motorDocuments'},
      {id:'REVIEW_AND_SUBMIT', label:'Review'},
      'UNDERWRITING',
      'PAYMENT',
      {id:'ISSUANCE', label:'Phát hành'}
    ])
  },

  pa: {
    productId:        'pa',
    productVersion:   'pa@1',
    journeyVersion:   'pa-journey@1',
    customerType:     'INDIVIDUAL',
    riskObjectType:   'INSURED_PERSON',
    quickRatingSchemaId:'paQuickRating@1',
    fullRiskSchemaId:  'paFullRisk@1',
    declarationSchemaId:'paDeclaration@1',
    packageSchemaId:  'paPackages@1',
    documentRuleSetId:'paDocuments@1',
    ratingStrategy:   'PA_TABLE_RATE_V1',
    underwritingStrategy:'PA_STP_V1',
    underwritingMode: 'STP',
    underwritingDefinition: {decisionSource:'RULE_ENGINE', ruleSetCode:'PA_BASIC_UW', ruleVersion:'1.0', manualUnit:null, queueCode:null},
    paymentMode:      'STANDARD',
    issueMode:        'AUTO_ISSUE',
    reviewLayout:     'paReview',
    reviewSections:   ['customer','insuredPerson','package','riskDeclaration','quote'],
    certificateTemplate:'paCertificate@1',
    supportedEntryModes:['PRODUCT_FIRST','NEW_PROSPECT','BANK_CUSTOMER','REFERRAL','QUICK_ADVICE_CONVERSION'],
    effectiveFrom:    '2026-01-01',
    effectiveTo:      null,
    hiddenStages:     [],
    stages: _stages([
      'CUSTOMER_INFO',
      {id:'INSURED_PARTY', label:'Đối tượng bảo hiểm', component:'paInsuredPerson'},
      {id:'PACKAGE_AND_QUOTE', label:'Gói & báo giá', component:'paPackage'},
      {id:'RISK_DECLARATION', component:'paDeclaration'},
      {id:'REVIEW_AND_SUBMIT', label:'Review'},
      'PAYMENT',
      {id:'ISSUANCE', label:'Phát hành'}
    ])
  },

  health: {
    productId:        'health',
    productVersion:   'health@1',
    journeyVersion:   'health-journey@1',
    customerType:     'INDIVIDUAL',
    riskObjectType:   'INSURED_PERSON',
    quickRatingSchemaId:'healthQuickRating@1',
    fullRiskSchemaId:  'healthFullRisk@1',
    declarationSchemaId:'healthDeclaration@1',
    packageSchemaId:  'healthPackages@1',
    documentRuleSetId:'healthDocuments@1',
    ratingStrategy:   'HEALTH_AGE_PACKAGE_RATE_V1',
    underwritingStrategy:'HEALTH_STP_REFERRAL_V1',
    underwritingMode: 'STP',
    underwritingDefinition: {decisionSource:'RULE_ENGINE', ruleSetCode:'HEALTH_BASIC_UW', ruleVersion:'1.0', manualUnit:'Health Thẩm định', queueCode:'HEALTH_UW_QUEUE'},
    paymentMode:      'STANDARD',
    issueMode:        'STP_OR_REFERRAL',
    reviewLayout:     'healthReview',
    reviewSections:   ['customer','insuredPerson','package','riskDeclaration','quote'],
    certificateTemplate:'healthCertificate@1',
    supportedEntryModes:['BANK_CUSTOMER','PRODUCT_FIRST','NEW_PROSPECT','REFERRAL','QUICK_ADVICE_CONVERSION','RENEWAL'],
    // §14 — Multi-insured (HEALTH_RETAIL_FAMILY; INDIVIDUAL = family với 1 người).
    // Đặt trong 1 object riêng để KHÔNG đụng field cấp cao đang dùng (underwritingMode STP, paymentMode STANDARD...).
    multiInsured: {
      insuredMode:       'MULTI_INSURED',
      assignment:        {productMode:'SAME_PRODUCT_LINE', packageMode:'PER_MEMBER', addOnMode:'PER_MEMBER'},
      effectiveDateMode: 'COMMON',
      termMode:          'COMMON',
      ratingMode:        'PER_MEMBER_THEN_AGGREGATE',
      questionnaireMode: 'PER_MEMBER',
      beneficiaryMode:   'PER_MEMBER_CONDITIONAL',
      documentMode:      'COMMON_AND_PER_MEMBER',
      confirmationMode:  'PER_MEMBER',
      memberUnderwritingMode:'PER_MEMBER',
      submissionMode:    'ALL_ACTIVE_MEMBERS_READY',
      consolidatedPayment:'CONSOLIDATED',
      issuePolicyMode:   'ONE_POLICY_MULTI_INSURED',
      certificateMode:   'CERTIFICATE_PER_MEMBER'
    },
    effectiveFrom:    '2026-01-01',
    effectiveTo:      null,
    hiddenStages:     [],
    stages: _stages([
      'CUSTOMER_INFO',
      {id:'INSURED_PARTY', label:'Đối tượng bảo hiểm', component:'healthInsuredPerson'},
      {id:'PACKAGE_AND_QUOTE', label:'Gói & phí', component:'healthPackage'},
      {id:'RISK_DECLARATION', component:'healthDeclaration'},
      {id:'DOCUMENTS', component:'healthDocuments'},
      {id:'REVIEW_AND_SUBMIT', label:'Review'},
      'UNDERWRITING',
      'PAYMENT',
      {id:'ISSUANCE', label:'Phát hành'}
    ])
  }
};

BANCA.journeyFor = function(productId){
  return BANCA.ProductJourneyDefinitions[productId]
      || BANCA.ProductJourneyDefinitions.motor;
};
BANCA.journeyEditStages = function(productId){
  const j = BANCA.journeyFor(productId);
  const hide = j.hiddenStages || [];
  return j.stages.filter(function(s){ return !s.postSubmit && hide.indexOf(s.id)<0; });
};
BANCA.journeyAllStages = function(productId){
  const j = BANCA.journeyFor(productId);
  const hide = j.hiddenStages || [];
  return j.stages.filter(function(s){ return hide.indexOf(s.id)<0; });
};
BANCA.journeyStageLabel = function(productId, stageId){
  const s = BANCA.journeyFor(productId).stages.find(function(x){return x.id===stageId;});
  return s ? s.label : ((BANCA.JOURNEY_STAGE_CATALOG[stageId]||{}).label || stageId);
};
// Component id để UI biết render gì cho 1 stage (thay hard-code theo productId).
BANCA.journeyStageComponent = function(productId, stageId){
  const s = BANCA.journeyFor(productId).stages.find(function(x){return x.id===stageId;});
  return s ? (s.component||s.id) : stageId;
};
// Entry mode có được sản phẩm này hỗ trợ không.
BANCA.journeySupportsEntryMode = function(productId, entryMode){
  const j = BANCA.journeyFor(productId);
  const canon = (BANCA.ENTRY_MODES[entryMode]||{}).alias || entryMode;
  return (j.supportedEntryModes||[]).indexOf(canon)>=0 || (j.supportedEntryModes||[]).indexOf(entryMode)>=0;
};

/* ---------------------------------------------------------------
 * P0.1/P0.3 — QuoteSnapshot (G1: contract đầy đủ)
 * ------------------------------------------------------------- */
BANCA.QUOTE_KIND   = { INDICATIVE:'INDICATIVE', FIRM:'FIRM' };
BANCA.QUOTE_STATUS = {
  DRAFT:      {label:'Nháp'},
  VALID:      {label:'Còn hiệu lực'},
  STALE:      {label:'Cần tính lại'},
  EXPIRED:    {label:'Hết hạn'},
  SUPERSEDED: {label:'Đã thay thế'},
  ACCEPTED:   {label:'Đã chấp nhận'},
  CANCELLED:  {label:'Đã hủy'}
};

// premiumBreakdown chuẩn — UI đọc trực tiếp, không parse text.
BANCA.makePremiumBreakdown = function(o){
  o = o || {};
  return {
    basePremium:  o.basePremium || 0,
    addOnPremium: o.addOnPremium || 0,
    loading:      o.loading || 0,
    discount:     o.discount || 0,   // số âm hoặc dương? giữ dương, ý nghĩa "được giảm"
    tax:          o.tax || 0,
    fee:          o.fee || 0,
    totalPremium: o.totalPremium || 0
  };
};

BANCA.makeQuoteSnapshot = function(o){
  o = o || {};
  return {
    quoteId:       o.quoteId || ('Q-'+Math.floor(100000+Math.random()*899999)),
    quoteVersion:  o.quoteVersion || o.version || 1,
    version:       o.quoteVersion || o.version || 1, // alias tương thích
    quoteType:     o.quoteType || o.kind || BANCA.QUOTE_KIND.INDICATIVE,
    kind:          o.quoteType || o.kind || BANCA.QUOTE_KIND.INDICATIVE, // alias
    quoteStatus:   o.quoteStatus || 'VALID',
    productId:     o.productId,
    productVersion:o.productVersion || (BANCA.journeyFor(o.productId).productVersion),
    packageId:     o.packageId || null,
    ratingInputsSnapshot: o.ratingInputsSnapshot || null,
    riskAnswersSnapshot:  o.riskAnswers || o.riskAnswersSnapshot || null,
    premiumBreakdown:     o.premiumBreakdown || BANCA.makePremiumBreakdown({basePremium:o.basePremium, totalPremium:o.premium||o.basePremium}),
    adjustments:   o.adjustments || [],       // [{code,label,amount,percentage}]
    premium:       o.premium!=null ? o.premium : (o.premiumBreakdown?o.premiumBreakdown.totalPremium:0),
    underwritingPrecheck: o.underwritingPrecheck || null,
    supersedesQuoteId: o.supersedesQuoteId || null,
    validFrom:     o.validFrom || null,
    validUntil:    o.validUntil || null,
    inputHash:     o.inputHash || null,
    note:          o.note || null,
    stale:         !!o.stale,
    createdAt:     o.createdAt || new Date().toISOString()
  };
};

/* ---------------------------------------------------------------
 * P0.1 — ApplicationRoutingResult (G1: đầy đủ + displayable)
 * ------------------------------------------------------------- */
BANCA.ROUTING = {
  APPROVED_FOR_BIND:     {label:'Đủ điều kiện phát hành', nextStage:'PAYMENT',           nextAction:'PAYMENT',            appStatus:'PENDING_PAYMENT'},
  UW_REQUIRED:           {label:'Cần thẩm định',          nextStage:'UNDERWRITING',      nextAction:'AWAIT_UNDERWRITING', appStatus:'PENDING_UW'},
  NEED_MORE_INFORMATION: {label:'Cần bổ sung',            nextStage:'REVIEW_AND_SUBMIT', nextAction:'SUPPLEMENT',         appStatus:'NEED_MORE_INFO'},
  REJECTED:              {label:'Từ chối',                nextStage:null,                nextAction:'END',               appStatus:'REJECTED'}
};

BANCA.makeRoutingResult = function(code, o){
  o = o || {};
  const base = BANCA.ROUTING[code] || BANCA.ROUTING.APPROVED_FOR_BIND;
  return {
    code:          code,
    label:         base.label,
    nextStage:     base.nextStage,
    nextAction:    base.nextAction,
    appStatus:     base.appStatus,
    // reasons: chia sẻ được cho nhân viên tư vấn (displayable=true).
    reasons:       o.reasons || [],
    blockingIssues:o.blockingIssues || [],
    requiredDocuments:o.requiredDocuments || o.requiredItems || [],
    conditions:    o.conditions || [],
    premiumChanged: !!o.premiumChanged,
    customerConfirmationRequired: !!o.customerConfirmationRequired,
    // Lý do nội bộ KHÔNG hiển thị cho nhân viên tư vấn.
    internalReasonCode: o.internalReasonCode || null,
    displayReason: o.displayReason || null,
    displayable:   o.displayable!=null ? o.displayable : true,
    generatedAt:   o.generatedAt || new Date().toISOString()
  };
};

/* ---------------------------------------------------------------
 * P0.1 — Payment (G1: contract đầy đủ)
 * ------------------------------------------------------------- */
BANCA.PAYMENT_STATUS = {
  NOT_CREATED:     {label:'Chưa tạo thanh toán',     cls:'badge-pending'},
  METHOD_REQUIRED: {label:'Chờ chọn cách thanh toán',cls:'badge-conditional'},
  PENDING:         {label:'Chờ thanh toán',          cls:'badge-conditional'},
  PROCESSING:      {label:'Đang xử lý',              cls:'badge-conditional'},
  SUCCESS:         {label:'Thành công',              cls:'badge-ready'},
  FAILED:          {label:'Thất bại',                cls:'badge-blocked'},
  EXPIRED:         {label:'Hết hạn',                 cls:'badge-blocked'},
  CANCELLED:       {label:'Đã hủy',                  cls:'badge-blocked'}
};
// paymentChannel + paymentExperience (spec §4).
BANCA.PAYMENT_CHANNELS = {
  QR:           {label:'QR chuyển khoản'},
  PAYMENT_LINK: {label:'Payment link'},
  CARD:         {label:'Thẻ ngân hàng'},
  BANK_ACCOUNT: {label:'Trích nợ tài khoản'},
  BANK_TRANSFER:{label:'Chuyển khoản ngân hàng'}
};
BANCA.PAYMENT_EXPERIENCES = {
  CUSTOMER_REMOTE:  {label:'Khách thanh toán từ xa'},
  CUSTOMER_PRESENT: {label:'Khách quét QR tại quầy'},
  CUSTOMER_PRESENT_QR: {label:'Khách quét QR tại quầy'},
  SELLER_ASSISTED:  {label:'Thanh toán trên thiết bị này'},
  SELLER_DEVICE_ASSISTED: {label:'Thanh toán trên thiết bị này'}
};
BANCA.PAYMENT_INSTRUMENTS = {
  QR:{label:'QR'}, CARD:{label:'Thẻ'}, BANK_ACCOUNT:{label:'Tài khoản ngân hàng'}, BANK_TRANSFER:{label:'Chuyển khoản ngân hàng'}
};
BANCA.DELIVERY_CHANNELS = {
  SMS:{label:'SMS'}, EMAIL:{label:'Email'}, COPY_LINK:{label:'Copy link'}, NONE:{label:'Không gửi'}
};
BANCA.PAYMENT_METHODS = BANCA.PAYMENT_CHANNELS; // alias tương thích
// Payment intent — CHỈ tạo sau khi nhân viên tư vấn chọn phương thức (§3).
BANCA.makePayment = function(o){
  o = o || {};
  return {
    paymentId:      o.paymentId || ('PAY-'+Math.floor(100000+Math.random()*899999)),
    applicationId:  o.applicationId || null,
    amount:         o.amount || 0,
    currency:       o.currency || 'VND',
    paymentChannel: o.paymentChannel || o.method || null,
    paymentInstrument: o.paymentInstrument || o.paymentChannel || o.method || null,
    paymentExperience: o.paymentExperience || null,
    paymentInitiator: o.paymentInitiator || null,   // SELLER / CUSTOMER
    payerType:      o.payerType || null,            // CUSTOMER
    payerName:      o.payerName || null,
    recipientPhone: o.recipientPhone || null,
    recipientEmail: o.recipientEmail || null,
    deliveryChannel:o.deliveryChannel || o.deliveryMethod || null,
    paymentUrl:     o.paymentUrl || null,
    qrPayload:      o.qrPayload || null,
    expiresAt:      o.expiresAt || null,
    status:         o.status || 'METHOD_REQUIRED',
    merchantReference: o.merchantReference || null,
    gatewayReference: o.gatewayReference || null,
    gatewayTransactionId: o.gatewayTransactionId || null,
    idempotencyKey: o.idempotencyKey || ('idem-'+(o.applicationId||'x')+'-'+(o.amount||0)),
    createdAt:      o.createdAt || new Date().toISOString(),
    paidAt:         o.paidAt || null,
    // alias tương thích code cũ
    method:         o.paymentChannel || o.method || null,
    reference:      o.merchantReference || o.gatewayReference || o.reference || null
  };
};
// §V — underwritingDefinition theo product. KHÔNG fallback Motor. Thiếu def → config error.
BANCA.underwritingDefinitionFor = function(productId){
  const j = BANCA.ProductJourneyDefinitions[productId];
  if(!j || !j.underwritingDefinition){
    return {error:true, code:'PRODUCT_UW_DEFINITION_MISSING', productId:productId,
            message:'Thiếu cấu hình thẩm định cho sản phẩm "'+productId+'". Vui lòng cấu hình ProductJourneyDefinition.underwritingDefinition.'};
  }
  return Object.assign({error:false, underwritingMode:j.underwritingMode}, j.underwritingDefinition);
};

// STP underwriting decision (§1/§IV) — record đầy đủ theo spec.
BANCA.makeStpDecision = function(productId, o){
  o = o || {};
  const def = BANCA.underwritingDefinitionFor(productId);
  if(def.error) return {error:true, configError:def};
  return {
    underwritingDecisionId: 'UWD-'+Math.floor(100000+Math.random()*899999),
    decisionCode:  'UWD-'+Math.floor(100000+Math.random()*899999),
    applicationId: o.applicationId || null,
    productId:     productId,
    underwritingMode:'STRAIGHT_THROUGH',
    mode:          'STRAIGHT_THROUGH',
    decision:      'APPROVED_STP',
    decisionSource:def.decisionSource,
    ruleSetCode:   def.ruleSetCode,
    ruleVersion:   def.ruleVersion,
    decidedAt:     o.decidedAt || new Date().toISOString(),
    additionalPremium: o.additionalPremium || 0,
    exclusions:    o.exclusions || [],
    conditions:    o.conditions || [],
    additionalDocuments: o.additionalDocuments || [],
    customerConfirmationRequired: false,
    paymentAllowed: true,
    automated:     true,
    // alias tương thích UI cũ
    unitName:      def.manualUnit || 'Thẩm định tự động (STP Engine)',
    ruleSet:       def.ruleSetCode, ruleSetVersion:def.ruleVersion, loading:null
  };
};
BANCA.paymentBadge = function(s){
  const m = BANCA.PAYMENT_STATUS[s] || {label:s, cls:'badge-pending'};
  return '<span class="badge '+m.cls+'">'+m.label+'</span>';
};
// Chỉ được tạo/mở payment khi routing cho phép.
BANCA.canCreatePayment = function(routingCode){
  return routingCode === 'APPROVED_FOR_BIND';
};

/* ---------------------------------------------------------------
 * P0.1 — IssueResult (G1: TÁCH khỏi Policy) + Policy
 * ------------------------------------------------------------- */
BANCA.ISSUE_STATUS = {
  PENDING_ISSUE:{label:'Chờ phát hành', cls:'badge-pending'},
  ISSUING:      {label:'Đang phát hành',cls:'badge-conditional'},
  ISSUED:       {label:'Đã phát hành',  cls:'badge-ready'},
  ISSUE_FAILED: {label:'Phát hành lỗi', cls:'badge-blocked'}
};
BANCA.issueBadge = function(s){
  const m = BANCA.ISSUE_STATUS[s] || {label:s, cls:'badge-pending'};
  return '<span class="badge '+m.cls+'">'+m.label+'</span>';
};
BANCA.makeIssueResult = function(o){
  o = o || {};
  return {
    status:         o.status || 'PENDING_ISSUE',   // PENDING_ISSUE|ISSUING|ISSUED|ISSUE_FAILED
    policyNumber:   o.policyNumber || null,
    certificateNumber:o.certificateNumber || null,
    issuedAt:       o.issuedAt || null,
    errorCode:      o.errorCode || null
  };
};
// Policy chỉ tồn tại SAU khi IssueResult=ISSUED.
BANCA.makePolicy = function(o){
  o = o || {};
  return {
    policyId:      o.policyId || ('POL-'+Math.floor(100000+Math.random()*899999)),
    policyNumber:  o.policyNumber || null,
    certificateNumber: o.certificateNumber || null,
    applicationId: o.applicationId || null,
    productId:     o.productId,
    packageId:     o.packageId || null,
    customerRef:   o.customerRef || null,
    customerName:  o.customerName || null,
    premium:       o.premium || 0,
    effectiveFrom: o.effectiveFrom || null,
    effectiveTo:   o.effectiveTo || null,
    status:        o.status || 'ACTIVE',
    documentRefs:  o.documentRefs || []
  };
};
BANCA.genPolicyNo = function(productId){
  const pre = productId==='pa' ? 'PA' : 'MT';
  return 'JB-'+pre+'-2026-'+Math.floor(1000 + Math.random()*9000);
};
BANCA.genCertNo = function(productId){
  const pre = productId==='pa' ? 'GCN-PA' : 'GCN-MT';
  return pre+'-'+Math.floor(100000 + Math.random()*899999);
};

/* ---------------------------------------------------------------
 * demoMode — CHỈ điều khiển tooltip/shortcut. KHÔNG đổi business logic.
 * ------------------------------------------------------------- */
// §14 — tooltip ⓘ kịch bản demo (chỉ hiện khi demoMode). demoMeta={title,currentPoint,expectedFlow}.
BANCA.demoMetaTooltip = function(app){
  if(!BANCA.demoMode() || !app || !app.demoMeta) return '';
  const m = app.demoMeta;
  const body = [m.currentPoint?('Hiện tại: '+m.currentPoint):'', m.expectedFlow?('Tiếp theo: '+m.expectedFlow):''].filter(Boolean).join('<br>');
  const tip = '<b>'+(m.title||'Kịch bản demo')+'</b>'+(body?'<br>'+body:'');
  return '<span class="demo-info" tabindex="0" role="button" aria-label="'+((m.title||'Kịch bản demo').replace(/"/g,''))+'" '+
    'style="display:inline-flex;width:15px;height:15px;border-radius:50%;background:var(--brand-100);color:var(--brand-700);font-size:10px;align-items:center;justify-content:center;cursor:help;margin-left:5px;position:relative;" '+
    'onmouseover="this.querySelector(\'.demo-tip\').style.display=\'block\'" onmouseout="this.querySelector(\'.demo-tip\').style.display=\'none\'" '+
    'onfocus="this.querySelector(\'.demo-tip\').style.display=\'block\'" onblur="this.querySelector(\'.demo-tip\').style.display=\'none\'">ⓘ'+
    '<span class="demo-tip" style="display:none;position:absolute;bottom:130%;left:0;width:300px;background:var(--ink-900);color:#fff;padding:9px 11px;border-radius:8px;font-size:11.5px;line-height:1.5;font-weight:400;z-index:50;box-shadow:0 4px 14px rgba(0,0,0,.25);">'+tip+'</span></span>';
};

BANCA.demoMode = function(){
  try{
    const q = new URLSearchParams(location.search);
    if(q.get('demo')==='1') return true;
    if(q.get('demo')==='0') return false;
    return localStorage.getItem('banca_demo_mode')==='1';
  }catch(e){ return false; }
};
