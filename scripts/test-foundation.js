// Foundation test suite (P0.1-P0.3 hardening — G4).
// Chạy: node scripts/test-foundation.js
// Bao phủ: cross-product contamination, quote versioning, no-dup version,
// resume, all entry modes, router↔payment eligibility, backward-compat.
global.window = global;
global.location = {search:'', pathname:'/'};
global.localStorage = {getItem:function(){return null;}, setItem:function(){}};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
const B = global.BANCA;

let pass=0, fail=0;
function ok(name, cond, extra){
  if(cond){ pass++; console.log('  ✓ '+name); }
  else { fail++; console.log('  ✗ '+name+(extra?('  → '+extra):'')); }
}
function grp(t){ console.log('\n'+t); }

/* 1. Cross-product contamination ------------------------------------ */
grp('1. Cross-product contamination (Motor ↔ PA)');
const motorStages = B.journeyAllStages('motor').map(function(s){return s.id;});
const paStages    = B.journeyAllStages('pa').map(function(s){return s.id;});
ok('Motor có RISK_OBJECT(xe)', motorStages.indexOf('RISK_OBJECT')>=0);
ok('PA KHÔNG có RISK_OBJECT(xe)', paStages.indexOf('RISK_OBJECT')<0);
ok('PA có INSURED_PARTY', paStages.indexOf('INSURED_PARTY')>=0);
ok('PA KHÔNG có DOCUMENTS motor', paStages.indexOf('DOCUMENTS')<0);
ok('PA KHÔNG có UNDERWRITING stage', paStages.indexOf('UNDERWRITING')<0);
ok('Motor riskObjectType=VEHICLE', B.journeyFor('motor').riskObjectType==='VEHICLE');
ok('PA riskObjectType=INSURED_PERSON', B.journeyFor('pa').riskObjectType==='INSURED_PERSON');
ok('Motor certificate ≠ PA certificate', B.journeyFor('motor').certificateTemplate!==B.journeyFor('pa').certificateTemplate);
ok('rateProduct(pa) KHÔNG gọi rateMotor (khác cấu trúc)', B.rateProduct('pa',{packageCode:'PA_STD',sumInsured:3e8,age:30}).ageBand!=null);
ok('rateProduct(motor) có odBase', B.rateProduct('motor',{packageCode:'STANDARD',sumInsured:6e8,addOns:[],deductible:1e6}).odBase!=null);
ok('PA component riêng cho INSURED_PARTY', B.journeyStageComponent('pa','INSURED_PARTY')==='paInsuredPerson');
ok('Motor component riêng cho RISK_OBJECT', B.journeyStageComponent('motor','RISK_OBJECT')==='motorVehicle');

/* 2. Quote versioning ----------------------------------------------- */
grp('2. Quote versioning (indicative → firm)');
const mInputs = {packageCode:'STANDARD',sumInsured:6e8,termMonths:12,addOns:['HYDRO_LOCK'],deductible:1e6};
const ind = B.computeIndicativeQuote('motor', mInputs);
const firmRes = B.computeFirmQuote('motor', Object.assign({}, mInputs, {riskAnswers:{claimCount:2,commercialUse:true}}), ind);
ok('indicative v1 kind INDICATIVE', ind.quoteVersion===1 && ind.quoteType==='INDICATIVE');
ok('firm v2 kind FIRM', firmRes.quote.quoteVersion===2 && firmRes.quote.quoteType==='FIRM');
ok('firm.supersedesQuoteId trỏ về indicative', firmRes.quote.supersedesQuoteId===ind.quoteId);
ok('indicative KHÔNG bị ghi đè (vẫn còn quoteId)', ind.quoteId!=null && ind.premium>0);
ok('indicative bị đánh dấu SUPERSEDED', ind.quoteStatus==='SUPERSEDED');
ok('firm premium > indicative (có loading)', firmRes.quote.premium > firmRes.diff.indicativePremium, firmRes.quote.premium+' vs '+firmRes.diff.indicativePremium);
ok('diff.adjustments structured (có amount+percentage)', firmRes.diff.adjustments.every(function(a){return a.amount!=null && a.percentage!=null;}));
ok('premiumBreakdown.totalPremium khớp premium', firmRes.quote.premiumBreakdown.totalPremium===firmRes.quote.premium);
ok('breakdown.loading > 0', firmRes.quote.premiumBreakdown.loading>0);

/* 3. No-dup version -------------------------------------------------- */
grp('3. No-duplicate version (cùng input → không tạo version mới)');
const same = B.computeFirmQuote('motor', Object.assign({}, mInputs, {riskAnswers:{claimCount:2,commercialUse:true}}), ind, firmRes.quote);
ok('cùng input → unchanged=true', same.unchanged===true);
ok('cùng input → trả lại đúng quote cũ', same.quote.quoteId===firmRes.quote.quoteId);
const changed = B.computeFirmQuote('motor', Object.assign({}, mInputs, {riskAnswers:{claimCount:0}}), ind, firmRes.quote);
ok('đổi risk answer → tạo version mới', changed.unchanged===false && changed.quote.quoteId!==firmRes.quote.quoteId);

/* 4. Resume ---------------------------------------------------------- */
grp('4. Resume đúng stage (PA draft không nhảy sang Vehicle)');
const paCtx = B.buildSalesEntryContext({entryMode:'PRODUCT_FIRST', selectedProductId:'pa', startStage:'INSURED_PARTY'});
ok('PA ctx startStage=INSURED_PARTY', paCtx.startStage==='INSURED_PARTY');
const paEdit = B.journeyEditStages('pa').map(function(s){return s.id;});
ok('resume INSURED_PARTY nằm trong PA edit stages', paEdit.indexOf('INSURED_PARTY')>=0);
ok('PA edit stages KHÔNG có RISK_OBJECT', paEdit.indexOf('RISK_OBJECT')<0);

/* 5. All entry modes ------------------------------------------------- */
grp('5. Tất cả entry mode → cùng contract, không lỗi stage');
const modeProduct = {BANK_CUSTOMER:'motor', REFERRAL:'motor', PRODUCT_FIRST:'pa', NEW_PROSPECT:'pa', RENEWAL:'motor', HANDOVER:'motor', QUICK_ADVICE_CONVERSION:'pa'};
ok('ENTRY_MODE_ENUM có đúng 7 mode', B.ENTRY_MODE_ENUM.length===7, B.ENTRY_MODE_ENUM.join(','));
Object.keys(modeProduct).forEach(function(mode){
  const ctx = B.buildSalesEntryContext({entryMode:mode, selectedProductId:modeProduct[mode]});
  const validCtx = ctx.entryMode===mode && ctx.startStage!=null && ctx.sourceReference!=null && ctx.originalPayload!=null && ctx.createdAt!=null;
  ok('mode '+mode+' → contract hợp lệ', validCtx);
});
ok('sourceReference giữ externalCustomerId', B.buildSalesEntryContext({entryMode:'BANK_CUSTOMER',customerRef:'CIF-001',selectedProductId:'motor'}).sourceReference.externalCustomerId==='CIF-001');
ok('recommended tách selected', (function(){var c=B.buildSalesEntryContext({entryMode:'BANK_CUSTOMER',recommendedProductId:'motor',selectedProductId:'pa'});return c.recommendedProductId==='motor'&&c.selectedProductId==='pa';})());
ok('originalPayload giữ payload nguồn', B.buildSalesEntryContext({entryMode:'HANDOVER',handoverRef:'CASE-9',selectedProductId:'motor'}).originalPayload.handoverRef==='CASE-9');

/* 6. Router ↔ payment eligibility ----------------------------------- */
grp('6. Router ↔ payment eligibility');
const rApproved = B.evaluateUnderwriting({productId:'motor', riskAnswers:{claimCount:0}});
const rUW       = B.evaluateUnderwriting({productId:'motor', riskAnswers:{claimCount:2, commercialUse:true}});
const rReject   = B.evaluateUnderwriting({productId:'pa', age:30, sumInsured:3e8, occupationClass:'CLASS_1', riskAnswers:{seriousIllness:true}});
const rPA       = B.evaluateUnderwriting({productId:'pa', age:30, sumInsured:3e8, occupationClass:'CLASS_1', riskAnswers:{}});
ok('APPROVED_FOR_BIND → canCreatePayment=true', B.canCreatePayment(rApproved.code)===true);
ok('UW_REQUIRED → canCreatePayment=false', B.canCreatePayment(rUW.code)===false);
ok('REJECTED → canCreatePayment=false', B.canCreatePayment(rReject.code)===false);
ok('UW nextAction=AWAIT_UNDERWRITING', rUW.nextAction==='AWAIT_UNDERWRITING');
ok('APPROVED nextAction=PAYMENT', rApproved.nextAction==='PAYMENT');
ok('UW có conditions (chia sẻ được)', rUW.conditions.length>0);
ok('REJECTED có blockingIssues + internalReasonCode', rReject.blockingIssues.length>0 && rReject.internalReasonCode!=null);
ok('PA clean → APPROVED_FOR_BIND', rPA.code==='APPROVED_FOR_BIND');
ok('PA excluded occupation CLASS_4 → REJECTED', B.evaluateUnderwriting({productId:'pa',age:30,sumInsured:3e8,occupationClass:'CLASS_4',riskAnswers:{}}).code==='REJECTED');
ok('PA age>65 → REJECTED', B.evaluateUnderwriting({productId:'pa',age:70,sumInsured:3e8,occupationClass:'CLASS_1',riskAnswers:{}}).code==='REJECTED');
ok('PA sumInsured over limit → REJECTED', B.evaluateUnderwriting({productId:'pa',age:30,sumInsured:2e9,occupationClass:'CLASS_1',riskAnswers:{}}).code==='REJECTED');
ok('modifiedVehicle → referral KHÔNG loading tự động', (function(){var uw=B.motorRiskRating({modifiedVehicle:true});return uw.flags.referral && uw.lines.filter(function(l){return l.pct!=null;}).length===0;})());

/* 7. Backward compatibility ----------------------------------------- */
grp('7. Backward compatibility (data cũ không có journey version)');
ok('journeyFor(unknown) fallback motor', B.journeyFor('unknown-product').productId==='motor');
ok('journeyFor(undefined) fallback motor', B.journeyFor(undefined).productId==='motor');
ok('draft Motor cũ (chỉ productId) vẫn có edit stages', B.journeyEditStages('motor').length===6);
ok('quote snapshot có alias version (code cũ đọc .version)', ind.version===ind.quoteVersion);
ok('quote snapshot có alias kind (code cũ đọc .kind)', ind.kind===ind.quoteType);
ok('INSURANCE_CUSTOMER alias → BANK_CUSTOMER behavior', B.journeySupportsEntryMode('motor','INSURANCE_CUSTOMER')===true);

/* 8. demoMode không đổi business logic ------------------------------ */
grp('8. demoMode không ảnh hưởng business logic');
ok('PRICING_SOURCE=DEMO_TARIFF', B.PRICING_SOURCE==='DEMO_TARIFF');
ok('PA rating có pricingSource DEMO_TARIFF', B.rateProduct('pa',{packageCode:'PA_STD',sumInsured:3e8,age:30}).pricingSource==='DEMO_TARIFF');

console.log('\n===================================');
console.log('  PASS: '+pass+'   FAIL: '+fail);
console.log('===================================');
process.exit(fail>0?1:0);
