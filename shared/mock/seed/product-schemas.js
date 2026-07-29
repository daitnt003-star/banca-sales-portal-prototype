// ============================================================
// Product Schemas + Rating Strategies (P0.2 data + P0.3 logic)
// - PA (Bảo hiểm tai nạn cá nhân) schemas: package / rating / risk / docs — MỚI.
// - Motor declaration schema (structured risk questions) thay hard-code.
// - Unified rating dispatcher: BANCA.rateProduct(productId, inputs).
// - Firm quote: riskAnswers THỰC SỰ tham gia rating (loading/deductible/referral).
// - Thẩm định router: BANCA.evaluateUnderwriting(app) → ApplicationRoutingResult.
// ============================================================
window.BANCA = window.BANCA || {};

// Phí trong prototype là biểu phí MINH HỌA — không phải tariff nghiệp vụ thật.
BANCA.PRICING_SOURCE = 'DEMO_TARIFF';

/* =========================================================
 * PA — Bảo hiểm tai nạn cá nhân schemas
 * ======================================================= */

// Gói PA — quyền lợi theo số tiền bảo hiểm (sum insured).
BANCA.paPackages = {
  PA_BASIC:  {code:'PA_BASIC',  name:'PA Cơ bản',   sumInsured:100000000,
              coverageList:['DEATH_PA','PERMANENT_DISABILITY'],
              deathSumInsured:100000000, permanentDisability:100000000, permanentPartialDisability:'Theo tỷ lệ thương tật',
              medicalExpenseLimit:0, dailyHospitalAllowance:0, termMonths:12, territory:'Việt Nam',
              exclusions:['Tai nạn do sử dụng rượu bia/chất kích thích','Tham gia hoạt động nguy hiểm không khai báo','Bệnh có sẵn không do tai nạn'],
              desc:'Tử vong & thương tật vĩnh viễn do tai nạn'},
  PA_STD:    {code:'PA_STD',    name:'PA Tiêu chuẩn',sumInsured:300000000,
              coverageList:['DEATH_PA','PERMANENT_DISABILITY','MEDICAL_EXPENSE'],
              deathSumInsured:300000000, permanentDisability:300000000, permanentPartialDisability:'Theo tỷ lệ thương tật',
              medicalExpenseLimit:30000000, dailyHospitalAllowance:0, termMonths:12, territory:'Việt Nam',
              exclusions:['Tai nạn do sử dụng rượu bia/chất kích thích','Tham gia hoạt động nguy hiểm không khai báo','Điều trị bệnh có sẵn'],
              desc:'+ Chi phí y tế do tai nạn'},
  PA_PLUS:   {code:'PA_PLUS',   name:'PA Nâng cao', sumInsured:500000000,
              coverageList:['DEATH_PA','PERMANENT_DISABILITY','MEDICAL_EXPENSE','DAILY_ALLOWANCE'],
              deathSumInsured:500000000, permanentDisability:500000000, permanentPartialDisability:'Theo tỷ lệ thương tật',
              medicalExpenseLimit:50000000, dailyHospitalAllowance:500000, termMonths:12, territory:'Việt Nam',
              exclusions:['Tai nạn do sử dụng rượu bia/chất kích thích','Nghề/hoạt động thuộc danh mục loại trừ','Điều trị không phát sinh từ tai nạn'],
              desc:'+ Trợ cấp nằm viện hàng ngày'}
};
BANCA.paCoverageLabels = {
  DEATH_PA:'Tử vong do tai nạn', PERMANENT_DISABILITY:'Thương tật vĩnh viễn',
  MEDICAL_EXPENSE:'Chi phí y tế', DAILY_ALLOWANCE:'Trợ cấp nằm viện'
};

// Nhóm nghề nghiệp → hệ số phí (occupation class). Class cao = rủi ro cao.
BANCA.paOccupationClasses = {
  CLASS_1: {code:'CLASS_1', label:'Nhóm 1 — Văn phòng / gián tiếp',  factor:1.00, eligibility:'STP'},
  CLASS_2: {code:'CLASS_2', label:'Nhóm 2 — Kỹ thuật nhẹ / bán hàng', factor:1.35, eligibility:'STP_WITH_LOADING'},
  CLASS_3: {code:'CLASS_3', label:'Nhóm 3 — Lao động chân tay',       factor:1.80, eligibility:'REFERRED'},
  CLASS_4: {code:'CLASS_4', label:'Nhóm 4 — Nghề rủi ro cao',          factor:2.60, eligibility:'BLOCKED'}
};
// Bảng tỷ lệ phí theo độ tuổi (rate = phí / 1.000.000 STBH / năm).
BANCA.paAgeBands = [
  {min:0,  max:17, rate:900,  label:'0–17'},
  {min:18, max:40, rate:1200, label:'18–40'},
  {min:41, max:55, rate:1900, label:'41–55'},
  {min:56, max:65, rate:3200, label:'56–65'}
];
BANCA.paAgeBandFor = function(age){
  return BANCA.paAgeBands.find(function(b){return age>=b.min && age<=b.max;}) || null;
};

// PA_TABLE_RATE: phí = STBH/1e6 × rate(ageBand) × occFactor.
BANCA.ratePA = function(inputs){
  const pkg = BANCA.paPackages[inputs.packageCode];
  if(!pkg) return null;
  const sumInsured = inputs.sumInsured || pkg.sumInsured;
  const age = inputs.age || 30;
  const band = BANCA.paAgeBandFor(age);
  const occ  = BANCA.paOccupationClasses[inputs.occupationClass||'CLASS_1'] || BANCA.paOccupationClasses.CLASS_1;
  if(!band) return {ineligible:true, reason:'Ngoài độ tuổi nhận bảo hiểm (0–65).', totalPremium:0};
  const base = Math.round((sumInsured/1000000) * band.rate);
  const lines = [];
  if(occ.factor !== 1){
    lines.push({code:'OCC', label:'Hệ số nghề nghiệp ('+occ.label.split('—')[0].trim()+')',
                type:'loading', pct:Math.round((occ.factor-1)*100), amount:Math.round(base*(occ.factor-1))});
  }
  const subtotal = base + lines.reduce(function(s,l){return s+l.amount;},0);
  const vatAmount = Math.round(subtotal * BANCA.VAT_PCT/100);
  const totalPremium = subtotal + vatAmount;
  return {
    base, ageBand:band.label, occFactor:occ.factor, lines, subtotal, vatAmount, totalPremium,
    basePremium:base, adjustedPremium:totalPremium, pricingSource:BANCA.PRICING_SOURCE,
    // premiumBreakdown chuẩn để UI đọc trực tiếp.
    breakdown:{basePremium:base, addOnPremium:0, loading:lines.reduce(function(s,l){return s+(l.amount>0?l.amount:0);},0),
               discount:lines.reduce(function(s,l){return s+(l.amount<0?-l.amount:0);},0), tax:vatAmount, fee:0, totalPremium:totalPremium},
    adjustments:lines.map(function(l){return {code:l.code,label:l.label,type:l.type,percentage:l.pct,amount:l.amount};})
  };
};

// PA validation riêng (KHÔNG chỉ đổi label từ vehicle → insuredPerson).
BANCA.PA_MAX_SUM_INSURED = 1000000000;      // hạn mức STBH PA
BANCA.PA_EXCLUDED_OCCUPATION = ['CLASS_4']; // nhóm nghề loại trừ trong prototype
BANCA.validatePA = function(inputs){
  inputs = inputs || {};
  const errors = [];   // chặn (eligibility)
  const warnings = []; // cảnh báo/loading
  const age = Number(inputs.age||0);
  if(!age || age < 0 || age > 65) errors.push({code:'AGE_OUT_OF_RANGE', msg:'Tuổi ngoài phạm vi nhận bảo hiểm (0–65).'});
  if(BANCA.PA_EXCLUDED_OCCUPATION.indexOf(inputs.occupationClass)>=0) errors.push({code:'OCCUPATION_EXCLUDED', msg:'Nghề thuộc nhóm loại trừ (Nhóm 4).'});
  const si = Number(inputs.sumInsured||0);
  if(si > BANCA.PA_MAX_SUM_INSURED) errors.push({code:'SUM_INSURED_OVER_LIMIT', msg:'Số tiền bảo hiểm vượt hạn mức '+BANCA.vnd(BANCA.PA_MAX_SUM_INSURED)+'.'});
  const ra = inputs.riskAnswers || {};
  if(ra.existingDisability) errors.push({code:'EXISTING_DISABILITY', msg:'Đang có thương tật vĩnh viễn — không đủ điều kiện.'});
  if(ra.seriousIllness)     errors.push({code:'SERIOUS_ILLNESS', msg:'Đang điều trị bệnh hiểm nghèo — không đủ điều kiện.'});
  if(ra.hazardousActivity)  warnings.push({code:'HAZARDOUS_ACTIVITY', msg:'Hoạt động nguy hiểm — cần tăng phí/thẩm định.'});
  // Người mua ≠ người được bảo hiểm → cần consent (không chặn, chỉ cờ).
  if(inputs.buyerIsInsured === false) warnings.push({code:'BUYER_NOT_INSURED', msg:'Người mua khác người được bảo hiểm — cần xác nhận đồng ý (consent).'});
  return {eligible: errors.length===0, errors:errors, warnings:warnings};
};

// PA risk questions (paDeclaration) — ngắn, ảnh hưởng eligibility/loading.
BANCA.paRiskQuestions = [
  {code:'hazardousActivity', label:'Có tham gia hoạt động nguy hiểm (leo núi, đua xe, lặn sâu…)?', type:'boolean', triggers:'loading'},
  {code:'existingDisability',label:'Đang có thương tật/khuyết tật vĩnh viễn?',                    type:'boolean', triggers:'eligibility'},
  {code:'seriousIllness',    label:'Đang điều trị bệnh hiểm nghèo?',                              type:'boolean', triggers:'eligibility'}
];
BANCA.paDocuments = [
  {code:'ID', name:'CMND/CCCD người được bảo hiểm', status:'REQUIRED'}
];

/* =========================================================
 * Health — Bảo hiểm sức khỏe schemas
 * ======================================================= */
BANCA.healthPackages = {
  HEALTH_BASIC: {code:'HEALTH_BASIC', name:'Sức khỏe Cơ bản', inpatientLimit:100000000, outpatientLimit:0, dentalLimit:0, maternityLimit:0, annualLimit:100000000, copayPercent:20, termMonths:12, territory:'Việt Nam',
                 exclusions:['Bệnh có sẵn chưa được chấp thuận','Điều trị thẩm mỹ','Điều trị không có chỉ định y khoa'], desc:'Bảo vệ nội trú với mức đồng chi trả thấp'},
  HEALTH_STD:   {code:'HEALTH_STD',   name:'Sức khỏe Tiêu chuẩn', inpatientLimit:250000000, outpatientLimit:20000000, dentalLimit:5000000, maternityLimit:0, annualLimit:275000000, copayPercent:10, termMonths:12, territory:'Việt Nam',
                 exclusions:['Bệnh có sẵn trong thời gian chờ','Điều trị nha khoa thẩm mỹ','Thai sản không mua kèm'], desc:'Nội trú + ngoại trú + nha khoa cơ bản'},
  HEALTH_PLUS:  {code:'HEALTH_PLUS',  name:'Sức khỏe Nâng cao', inpatientLimit:500000000, outpatientLimit:50000000, dentalLimit:15000000, maternityLimit:50000000, annualLimit:600000000, copayPercent:0, termMonths:12, territory:'Việt Nam và ASEAN',
                 exclusions:['Bệnh có sẵn chưa khai báo/chưa chấp thuận','Điều trị thử nghiệm','Thai sản trong thời gian chờ'], desc:'Quyền lợi cao, có thai sản và không đồng chi trả'}
};
BANCA.healthAgeBands = [
  {min:0,  max:17, factor:0.75, label:'0-17'},
  {min:18, max:35, factor:1.00, label:'18-35'},
  {min:36, max:45, factor:1.25, label:'36-45'},
  {min:46, max:55, factor:1.65, label:'46-55'},
  {min:56, max:65, factor:2.25, label:'56-65'}
];
BANCA.healthAgeBandFor = function(age){
  return BANCA.healthAgeBands.find(function(b){return age>=b.min && age<=b.max;}) || null;
};
BANCA.healthBaseRates = {HEALTH_BASIC:1800000, HEALTH_STD:4200000, HEALTH_PLUS:8500000};
BANCA.rateHealth = function(inputs){
  inputs = inputs || {};
  const pkg = BANCA.healthPackages[inputs.packageCode];
  if(!pkg) return null;
  const members = (inputs.members&&inputs.members.length) ? inputs.members : [{age:inputs.age||30, relationship:'Bản thân'}];
  const lines = [];
  let subtotal = 0;
  members.forEach(function(m, idx){
    const band = BANCA.healthAgeBandFor(Number(m.age||0));
    if(!band){ lines.push({code:'AGE_'+idx, label:'Ngoài độ tuổi nhận bảo hiểm: '+(m.name||('Thành viên '+(idx+1))), type:'blocked', pct:0, amount:0}); return; }
    const amount = Math.round((BANCA.healthBaseRates[pkg.code]||0) * band.factor);
    subtotal += amount;
    lines.push({code:'MEMBER_'+idx, label:(m.name||('Thành viên '+(idx+1)))+' · '+band.label, type:'base', pct:Math.round(band.factor*100), amount:amount});
  });
  if(members.length>=3){
    const discount = Math.round(subtotal*0.05);
    subtotal -= discount;
    lines.push({code:'FAMILY_DISCOUNT', label:'Giảm phí gia đình', type:'discount', pct:5, amount:-discount});
  }
  const vatAmount = Math.round(subtotal * BANCA.VAT_PCT/100);
  const totalPremium = subtotal + vatAmount;
  return {
    base:subtotal, lines:lines, subtotal:subtotal, vatAmount:vatAmount, totalPremium:totalPremium,
    basePremium:subtotal, adjustedPremium:totalPremium, pricingSource:BANCA.PRICING_SOURCE,
    breakdown:{basePremium:subtotal, addOnPremium:0, loading:0, discount:lines.filter(function(l){return l.amount<0;}).reduce(function(s,l){return s+Math.abs(l.amount);},0), tax:vatAmount, fee:0, totalPremium:totalPremium},
    adjustments:lines.map(function(l){return {code:l.code,label:l.label,type:l.type,percentage:l.pct,amount:l.amount};})
  };
};
BANCA.healthRiskQuestions = [
  {code:'preExistingCondition', label:'Có bệnh có sẵn hoặc đang điều trị định kỳ?', type:'boolean', triggers:'referral'},
  {code:'preExistingDetail', label:'Chi tiết bệnh có sẵn/điều trị', type:'text', branchOn:'preExistingCondition', triggers:'referral'},
  {code:'hospitalizedLast12Months', label:'Có nhập viện hoặc phẫu thuật trong 12 tháng gần nhất?', type:'boolean', triggers:'referral'},
  {code:'seriousIllness', label:'Đã/đang mắc bệnh nghiêm trọng (ung thư, suy thận, bệnh tim nặng...)?', type:'boolean', triggers:'eligibility'},
  {code:'smoker', label:'Có hút thuốc lá hoặc sản phẩm nicotine?', type:'boolean', triggers:'loading'},
  {code:'truthDeclaration', label:'Khách xác nhận khai báo trung thực và đồng ý xử lý dữ liệu sức khỏe.', type:'boolean', triggers:'consent'}
];
BANCA.healthDocuments = [
  {code:'ID', name:'CMND/CCCD người được bảo hiểm', status:'INHERITED', note:'Bank KYC accepted nếu khách có CIF.'},
  {code:'MEDICAL_RECORD', name:'Hồ sơ y tế theo điều kiện', status:'CONDITIONAL'}
];
BANCA.productSchemas = Object.assign({}, BANCA.productSchemas||{}, {
  'healthQuickRating@1': {schemaId:'healthQuickRating@1', fields:['packageCode','members.age','members.relationship','effectiveDate']},
  'healthFullRisk@1': {schemaId:'healthFullRisk@1', fields:['insuredMembers','healthDeclaration','effectiveDate','consent']},
  'healthDeclaration@1': {schemaId:'healthDeclaration@1', questions:BANCA.healthRiskQuestions.map(function(q){return q.code;})},
  'healthPackages@1': {schemaId:'healthPackages@1', packageCodes:Object.keys(BANCA.healthPackages)},
  'healthDocuments@1': {schemaId:'healthDocuments@1', documents:BANCA.healthDocuments.map(function(d){return d.code;})}
});
BANCA.validateHealth = function(inputs){
  inputs = inputs || {};
  const errors = [], warnings = [];
  const members = (inputs.members&&inputs.members.length) ? inputs.members : [{age:inputs.age||0}];
  members.forEach(function(m, idx){
    const age = Number(m.age||0);
    if(!age || age<0 || age>65) errors.push({code:'HEALTH_AGE_OUT_OF_RANGE', msg:'Thành viên '+(idx+1)+' ngoài phạm vi nhận bảo hiểm (0-65).'});
  });
  const ra = inputs.riskAnswers || {};
  if(ra.seriousIllness) errors.push({code:'HEALTH_SERIOUS_ILLNESS', msg:'Bệnh nghiêm trọng cần dừng phát hành tự động và chuyển quy trình riêng.'});
  if(ra.preExistingCondition) warnings.push({code:'HEALTH_PRE_EXISTING', msg:'Có bệnh có sẵn — cần chi tiết và chuyển thẩm định.'});
  if(ra.hospitalizedLast12Months) warnings.push({code:'HEALTH_RECENT_HOSPITAL', msg:'Có điều trị/nhập viện gần đây — cần hồ sơ y tế.'});
  if(ra.smoker) warnings.push({code:'HEALTH_SMOKER', msg:'Hút thuốc — có thể áp dụng phụ phí hoặc điều kiện.'});
  if(ra.truthDeclaration!==true) warnings.push({code:'HEALTH_TRUTH_DECLARATION', msg:'Cần xác nhận khai báo trung thực trước khi nộp.'});
  return {eligible:errors.length===0, errors:errors, warnings:warnings};
};

/* =========================================================
 * Motor declaration schema (structured) — thay câu hỏi hard-code.
 * riskAnswers keys khớp spec: claimCount, commercialUse, floodExposure,
 * vehicleCondition, modifiedVehicle, previousLossAmount.
 * ======================================================= */
BANCA.motorRiskQuestions = [
  {code:'claimCount',       label:'Số vụ tổn thất/claim trong 24 tháng?', type:'number',  triggers:'rating'},
  {code:'commercialUse',    label:'Xe dùng cho mục đích kinh doanh vận tải?', type:'boolean', triggers:'rating'},
  {code:'floodExposure',    label:'Khu vực đỗ xe thường xuyên có nguy cơ ngập?', type:'boolean', triggers:'rating'},
  {code:'modifiedVehicle',  label:'Xe có độ/thay đổi kết cấu so với nguyên bản?', type:'boolean', triggers:'referral'},
  {code:'previousLossAmount',label:'Tổng giá trị tổn thất kỳ trước (nếu có)?', type:'number', triggers:'rating'}
];

// Registry-driven: chọn bộ câu hỏi rủi ro theo declarationSchema của journey.
BANCA.riskQuestionsFor = function(productId){
  const j = BANCA.journeyFor(productId);
  if((j.declarationSchemaId||'').indexOf('health')===0 || productId==='health') return BANCA.healthRiskQuestions;
  if((j.declarationSchemaId||'').indexOf('pa')===0 || productId==='pa') return BANCA.paRiskQuestions;
  return BANCA.motorRiskQuestions;
};

/* =========================================================
 * P0.3 — Risk-answer rating rules
 * Nhận riskAnswers → sinh loading/discount/deductible + cờ referral/UW/doc/reject.
 * ======================================================= */
BANCA.motorRiskRating = function(riskAnswers){
  const a = riskAnswers || {};
  const lines = [];           // {label, pct, amount?, type}
  const flags = {referral:false, requireDoc:[], reject:false, conditions:[]};

  const claims = Number(a.claimCount||0);
  if(claims >= 3){
    flags.reject = false; flags.referral = true;
    lines.push({code:'CLAIM_HIST', label:'Lịch sử tổn thất nhiều ('+claims+' vụ)', type:'loading', pct:20});
    flags.conditions.push('Tăng phí 20% do '+claims+' vụ tổn thất trong 24 tháng.');
  } else if(claims === 2){
    flags.referral = true;
    lines.push({code:'CLAIM_HIST', label:'Lịch sử tổn thất ('+claims+' vụ)', type:'loading', pct:10});
    flags.conditions.push('Tăng phí 10% do 2 vụ tổn thất trong 24 tháng.');
  } else if(claims === 1){
    lines.push({code:'CLAIM_HIST', label:'Lịch sử tổn thất (1 vụ)', type:'loading', pct:5});
  }

  if(a.commercialUse){
    flags.referral = true;
    lines.push({code:'COMMERCIAL', label:'Sử dụng kinh doanh vận tải', type:'loading', pct:15});
    flags.conditions.push('Tăng phí 15% do sử dụng kinh doanh vận tải.');
    flags.requireDoc.push('AUTHORIZATION');
  }
  if(a.floodExposure){
    lines.push({code:'FLOOD_ZONE', label:'Khu vực nguy cơ ngập', type:'loading', pct:8});
  }
  if(a.modifiedVehicle){
    flags.referral = true;
    flags.requireDoc.push('SURVEY');
    flags.conditions.push('Cần giám định do xe thay đổi kết cấu.');
  }
  const prevLoss = Number(a.previousLossAmount||0);
  if(prevLoss >= 100000000){
    flags.referral = true;
    lines.push({code:'BIG_LOSS', label:'Tổn thất kỳ trước lớn', type:'loading', pct:10});
  }
  return {lines, flags};
};

/* =========================================================
 * P0.2/P0.3 — Unified rating dispatcher
 * rateProduct(productId, inputs) → dùng ratingStrategy của journey.
 * ======================================================= */
BANCA.rateProduct = function(productId, inputs){
  const j = BANCA.journeyFor(productId);
  switch(j.ratingStrategy){
    case 'MOTOR_RATING_V1':
    case 'MOTOR_RATING':   return BANCA.rateMotor(inputs);
    case 'PA_TABLE_RATE_V1':
    case 'PA_TABLE_RATE':  return BANCA.ratePA(inputs);
    case 'HEALTH_AGE_PACKAGE_RATE_V1':
    case 'HEALTH_AGE_PACKAGE_RATE': return BANCA.rateHealth(inputs);
    default:               return BANCA.rateMotor(inputs);
  }
};

// Hash input để chống tạo quote version trùng khi input không đổi.
BANCA.quoteInputHash = function(productId, inputs){
  const i = inputs || {};
  return JSON.stringify([productId, i.packageCode, i.sumInsured, i.termMonths,
    (i.addOns||[]).slice().sort(), i.deductible, i.ncdPercent||0, i.age, i.occupationClass,
    i.riskAnswers||null]);
};

/* =========================================================
 * P0.3 — Quote lifecycle: indicative → firm
 * computeIndicativeQuote: phí dự kiến từ minimal data (chưa risk answers).
 * computeFirmQuote: đưa riskAnswers vào rating, tạo version mới, tính chênh lệch.
 * ======================================================= */
BANCA.computeIndicativeQuote = function(productId, inputs){
  const rate = BANCA.rateProduct(productId, inputs) || {};
  const total = rate.totalPremium || 0;
  const bd = rate.breakdown || BANCA.makePremiumBreakdown({basePremium:rate.basePremium||total, tax:rate.vatAmount||0, totalPremium:total});
  return BANCA.makeQuoteSnapshot({
    quoteVersion:    1,
    quoteType:       BANCA.QUOTE_KIND.INDICATIVE,
    quoteStatus:     'VALID',
    productId:       productId,
    packageId:       inputs.packageCode || null,
    ratingInputsSnapshot: Object.assign({}, inputs, {riskAnswers:undefined}),
    premiumBreakdown:bd,
    premium:         total,
    basePremium:     total,
    adjustments:     rate.adjustments || [],
    inputHash:       BANCA.quoteInputHash(productId, Object.assign({}, inputs, {riskAnswers:null})),
    note:            'Phí dự kiến — có thể thay đổi sau khi hoàn tất khai báo rủi ro.'
  });
};

// Tạo firm quote từ indicative + riskAnswers. Trả {quote, diff, underwriting, unchanged}.
// No-dup guard: nếu input+riskAnswers y hệt firm quote trước → trả lại quote cũ (unchanged=true).
BANCA.computeFirmQuote = function(productId, inputs, indicativeQuote, prevFirmQuote){
  const hash = BANCA.quoteInputHash(productId, inputs);
  if(prevFirmQuote && prevFirmQuote.inputHash === hash && prevFirmQuote.quoteType==='FIRM'){
    return {quote:prevFirmQuote, diff:null, underwriting:null, unchanged:true};
  }

  const baseRate = BANCA.rateProduct(productId, inputs) || {totalPremium:0};
  const indicativePremium = indicativeQuote ? indicativeQuote.premium : baseRate.totalPremium;

  // Normalize adjustment lines từ rating về {code,label,type,percentage,amount}.
  const structuredAdj = (baseRate.lines || baseRate.adjustments || []).map(function(l){
    return {code:l.code, label:l.label, type:l.type,
            percentage: l.percentage!=null?l.percentage:l.pct, amount: l.amount!=null?l.amount:null};
  });
  let premium = baseRate.totalPremium || 0;
  let loadingSum = 0, discountSum = 0;
  let uw = {flags:{referral:false, requireDoc:[], reject:false, conditions:[]}, lines:[]};

  if(productId === 'motor'){
    uw = BANCA.motorRiskRating(inputs.riskAnswers);
    const odBase = baseRate.odBase || baseRate.basePremium || premium;
    uw.lines.forEach(function(l){
      if(l.pct==null) return; // ví dụ modifiedVehicle: chỉ referral, KHÔNG loading tự động
      const amt = Math.round(odBase * (l.pct||0)/100 * (l.type==='discount'?-1:1));
      structuredAdj.push({code:l.code, label:l.label, type:l.type, percentage:l.pct, amount:amt});
      premium += amt;
      if(amt>=0) loadingSum += amt; else discountSum += -amt;
    });
  }

  const baseBd = baseRate.breakdown || {};
  const breakdown = BANCA.makePremiumBreakdown({
    basePremium:  baseBd.basePremium || baseRate.basePremium || 0,
    addOnPremium: baseBd.addOnPremium || 0,
    loading:      (baseBd.loading||0) + loadingSum,
    discount:     (baseBd.discount||0) + discountSum,
    tax:          baseBd.tax || baseRate.vatAmount || 0,
    fee:          baseBd.fee || 0,
    totalPremium: premium
  });

  const nextVersion = indicativeQuote ? (indicativeQuote.quoteVersion||indicativeQuote.version||1)+1 : 2;
  const quote = BANCA.makeQuoteSnapshot({
    quoteVersion:   nextVersion,
    quoteType:      BANCA.QUOTE_KIND.FIRM,
    quoteStatus:    'VALID',
    productId:      productId,
    packageId:      inputs.packageCode || null,
    ratingInputsSnapshot: Object.assign({}, inputs, {riskAnswers:undefined}),
    riskAnswers:    inputs.riskAnswers || null,
    premiumBreakdown:breakdown,
    premium:        premium,
    basePremium:    baseRate.totalPremium || 0,
    adjustments:    structuredAdj,
    supersedesQuoteId: indicativeQuote ? indicativeQuote.quoteId : null,
    underwritingPrecheck: {referral:uw.flags.referral, reject:uw.flags.reject, conditions:uw.flags.conditions},
    inputHash:      hash,
    note:           'Báo giá chính thức sau khai báo rủi ro.'
  });
  // Không ghi đè indicative — chỉ đánh dấu SUPERSEDED để giữ tham chiếu.
  if(indicativeQuote) indicativeQuote.quoteStatus = 'SUPERSEDED';

  const diff = {
    indicativePremium: indicativePremium,
    firmPremium:       premium,
    delta:             premium - indicativePremium,
    deltaPct:          indicativePremium ? Math.round((premium-indicativePremium)/indicativePremium*100) : 0,
    adjustments:       structuredAdj  // structured — UI không phải parse text
  };
  return {quote:quote, diff:diff, underwriting:uw, unchanged:false};
};

/* =========================================================
 * P0.4/P0.6 — Thẩm định router (decision router sau submit)
 * evaluateUnderwriting(app) → ApplicationRoutingResult.
 * ======================================================= */
BANCA.evaluateUnderwriting = function(app){
  const productId = app.productId || 'motor';
  const j = BANCA.journeyFor(productId);

  // ---- Health HYBRID underwriting (yêu cầu trực tiếp user; supersede "luôn manual/luôn STP") ----
  // Ca sạch → APPROVED_STP (không queue/officer/SLA). Thiếu dữ liệu/tài liệu do rule →
  // MORE_INFORMATION_REQUIRED. Chạm review rule → MANUAL_REVIEW. Hard-decline → DECLINED.
  if(productId === 'health'){
    const ra = app.riskAnswers || {};
    const v = BANCA.validateHealth({
      age: app.insuredAge || app.age, members: app.insuredMembers, sumInsured: app.sumInsured,
      riskAnswers: ra, buyerIsInsured: app.buyerIsInsured
    });
    // 1) Hard-decline: bệnh nghiêm trọng / ngoài điều kiện nhận.
    if(!v.eligible){
      return BANCA.makeRoutingResult('DECLINED', {
        productId:productId, underwritingMode:'MANUAL', decision:'DECLINED',
        reasons:['Không đủ điều kiện nhận bảo hiểm sức khỏe.'],
        blockingIssues: v.errors.map(function(e){return e.msg;}),
        ruleHits: v.errors.map(function(e){return e.code;}),
        internalReasonCodes: v.errors.map(function(e){return e.code;}),
        displayable:true
      });
    }
    // 2) MORE_INFORMATION_REQUIRED: rule cần dữ liệu/tài liệu còn thiếu (không tự chuyển manual/decline).
    const missing = [];
    if(ra.preExistingCondition && !(ra.preExistingDetail && String(ra.preExistingDetail).trim()))
      missing.push({code:'PRE_EXISTING_DETAIL_MISSING', msg:'Cần mô tả chi tiết bệnh có sẵn/điều trị.', doc:'MEDICAL_RECORD'});
    if(ra.truthDeclaration !== true)
      missing.push({code:'TRUTH_DECLARATION_MISSING', msg:'Cần khách xác nhận khai báo trung thực trước khi thẩm định.'});
    if(missing.length){
      return BANCA.makeRoutingResult('MORE_INFORMATION_REQUIRED', {
        productId:productId, underwritingMode:'STP',
        reasons: missing.map(function(m){return m.msg;}),
        requiredDocuments: missing.map(function(m){return m.doc;}).filter(Boolean),
        ruleHits: missing.map(function(m){return m.code;}),
        internalReasonCodes: missing.map(function(m){return m.code;}),
        customerConfirmationRequired:false
      });
    }
    // 3) MANUAL_REVIEW: chạm review rule (bệnh có sẵn đã mô tả / nhập viện gần đây / hút thuốc).
    const reviewHits = [];
    if(ra.preExistingCondition) reviewHits.push('HEALTH_PRE_EXISTING');
    if(ra.hospitalizedLast12Months) reviewHits.push('HEALTH_RECENT_HOSPITAL');
    if(ra.smoker) reviewHits.push('HEALTH_SMOKER');
    if(reviewHits.length){
      return BANCA.makeRoutingResult('MANUAL_REVIEW', {
        productId:productId, underwritingMode:'MANUAL',
        reasons:['Yêu cầu cần thẩm định sức khỏe do khai báo rủi ro.'],
        conditions: v.warnings.map(function(w){return w.msg;}),
        requiredDocuments:(ra.preExistingCondition||ra.hospitalizedLast12Months)?['MEDICAL_RECORD']:[],
        ruleHits: reviewHits, internalReasonCodes: reviewHits,
        customerConfirmationRequired:true
      });
    }
    // 4) STP_PASS: ca sạch, đủ dữ liệu → chấp thuận tự động, KHÔNG tạo queue/officer/manual SLA.
    return BANCA.makeRoutingResult('STP_PASS', {
      productId:productId, underwritingMode:'STP', decision:'APPROVED_STP',
      reasons:['Đủ điều kiện phát hành tự động theo gói sức khỏe đã chọn.'],
      customerConfirmationRequired:false
    });
  }

  // PA STP: validatePA quyết định eligibility.
  if(j.underwritingMode === 'STP'){
    const v = BANCA.validatePA({
      age: app.insuredAge || app.age, occupationClass: app.occupationClass, sumInsured: app.sumInsured,
      riskAnswers: app.riskAnswers, buyerIsInsured: app.buyerIsInsured
    });
    if(!v.eligible){
      return BANCA.makeRoutingResult('REJECTED', {
        productId:productId, underwritingMode:'STP', decision:'DECLINED',
        reasons:['Không đủ điều kiện nhận bảo hiểm.'],
        blockingIssues: v.errors.map(function(e){return e.msg;}),
        ruleHits: v.errors.map(function(e){return e.code;}),
        internalReasonCodes: v.errors.map(function(e){return e.code;}),
        internalReasonCode: v.errors.map(function(e){return e.code;}).join(','),
        displayable:true
      });
    }
    const ra = app.riskAnswers || {};
    if(app.occupationClass==='CLASS_3' || ra.hazardousActivity || ra.professionalOrRecreational==='PROFESSIONAL' || ra.frequency==='WEEKLY'){
      return BANCA.makeRoutingResult('UW_REQUIRED', {
        productId:productId, underwritingMode:'MANUAL',
        reasons:['Yêu cầu cần thẩm định do nhóm nghề/hoạt động rủi ro.'],
        conditions:v.warnings.map(function(w){return w.msg;}),
        ruleHits:['PA_REFERRAL'], internalReasonCodes:['PA_REFERRAL'],
        customerConfirmationRequired:true,
        internalReasonCode:'PA_REFERRAL'
      });
    }
    return BANCA.makeRoutingResult('APPROVED_FOR_BIND', {
      productId:productId, underwritingMode:'STP', decision:'APPROVED_STP',
      reasons:['Đủ điều kiện phát hành tự động (straight-through).'],
      customerConfirmationRequired: v.warnings.length>0
    });
  }

  // Motor RULE_BASED: dựa risk answers.
  const uw = BANCA.motorRiskRating(app.riskAnswers);
  if(uw.flags.reject){
    return BANCA.makeRoutingResult('REJECTED', {
      productId:productId, underwritingMode:'STP', decision:'DECLINED',
      reasons:['Không đạt điều kiện thẩm định.'],
      ruleHits:['MOTOR_UW_REJECT'], internalReasonCodes:['MOTOR_UW_REJECT'],
      internalReasonCode:'MOTOR_UW_REJECT'
    });
  }
  if(uw.flags.referral){
    return BANCA.makeRoutingResult('UW_REQUIRED', {
      productId:productId, underwritingMode:'MANUAL',
      reasons:['Yêu cầu cần thẩm định do yếu tố rủi ro khai báo.'],
      conditions:uw.flags.conditions,
      requiredDocuments:uw.flags.requireDoc,
      ruleHits:(uw.lines||[]).map(function(l){return l.code;}).concat(['MOTOR_REFERRAL']),
      internalReasonCodes:['MOTOR_REFERRAL'],
      customerConfirmationRequired:true,
      internalReasonCode:'MOTOR_REFERRAL'
    });
  }
  return BANCA.makeRoutingResult('APPROVED_FOR_BIND', {
    productId:productId, underwritingMode:'STP', decision:'APPROVED_STP',
    reasons:['Đủ điều kiện phát hành.']
  });
};
