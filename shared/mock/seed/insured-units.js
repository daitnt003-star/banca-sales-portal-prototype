// ============================================================
// Multi-insured (Health family) — InsuredCoverageUnit model + helpers.
// Mỗi người được bảo hiểm = 1 InsuredCoverageUnit độc lập:
//   thông tin cá nhân · gói riêng · phí riêng · câu hỏi sức khỏe riêng ·
//   tài liệu riêng · người thụ hưởng riêng · xác nhận/OTP riêng · thẩm định riêng.
// KHÔNG chia sẻ câu trả lời sức khỏe / tài liệu y tế / người thụ hưởng /
//   kết quả thẩm định giữa các thành viên.
// Lưu trong app.insuredMembers[] (overlay draft), autosave qua điều hướng member.
// ============================================================
window.BANCA = window.BANCA || {};

// Giới hạn tuổi nhận bảo hiểm sức khỏe (prototype).
BANCA.HEALTH_MIN_AGE = 0;
BANCA.HEALTH_MAX_AGE = 65;
BANCA.HEALTH_CHILD_MAX_AGE = 17;         // dưới 18: cần người đại diện + bộ câu hỏi trẻ em
BANCA.HEALTH_MAX_MEMBERS = 8;            // số thành viên tối đa 1 yêu cầu
BANCA.HEALTH_CHILD_NEEDS_ADULT = true;  // trẻ cần có ít nhất 1 người lớn cùng yêu cầu

// Quan hệ hợp lệ trong 1 yêu cầu gia đình.
BANCA.HEALTH_RELATIONSHIPS = ['Bản thân','Vợ/Chồng','Con','Cha','Mẹ','Anh/Chị/Em','Khác'];

// Tuổi tại ngày hiệu lực (không nhập tay).
BANCA.healthAgeAt = function(dob, eff){
  if(!dob) return null;
  const b=new Date(dob+'T00:00:00'), e=new Date((eff||'2026-07-23')+'T00:00:00');
  if(isNaN(b)||isNaN(e)) return null;
  let age=e.getFullYear()-b.getFullYear();
  const m=e.getMonth()-b.getMonth();
  if(m<0 || (m===0 && e.getDate()<b.getDate())) age--;
  return age>=0 ? age : null;
};

// insuredUnitId ổn định theo index nếu seed chưa có.
BANCA.healthUnitId = function(m, idx){ return m && m.insuredUnitId ? m.insuredUnitId : ('IU-'+(idx+1)); };

// Chuẩn hoá 1 member seed → InsuredCoverageUnit hydrated (age, id, active, gói mặc định).
BANCA.hydrateInsuredUnit = function(app, m, idx){
  const eff = app.effectiveDate || '2026-07-23';
  const age = BANCA.healthAgeAt(m.dob, eff);
  const isChild = age!=null && age<=BANCA.HEALTH_CHILD_MAX_AGE;
  return Object.assign({}, m, {
    insuredUnitId: BANCA.healthUnitId(m, idx),
    index: idx,
    age: age,
    isChild: isChild,
    active: m.active!==false,                       // mặc định active; loại trừ là chủ động
    // gói/phí per-member — mặc định kế thừa gói chung của yêu cầu (SAME_PRODUCT_LINE)
    package: m.package || app.package || null,
    unitQuote: m.unitQuote || null,
    riskAnswers: m.riskAnswers || {},               // câu hỏi sức khỏe RIÊNG
    docs: m.docs || {},                             // {DOC_CODE:'UPLOADED'|'MISSING'|...}
    beneficiaries: m.beneficiaries || [],           // người thụ hưởng RIÊNG
    confirmation: m.confirmation || null,           // xác nhận/OTP RIÊNG
    underwriting: m.underwriting || null,           // kết quả thẩm định RIÊNG
    certificateNumber: m.certificateNumber || null  // GCN per-member (certificateMode PER_MEMBER)
  });
};

// Danh sách InsuredCoverageUnit của yêu cầu (migrate từ insuredMembers).
BANCA.healthUnitsOf = function(app){
  const eff = app.effectiveDate || '2026-07-23';
  let raw = (app.insuredMembers && app.insuredMembers.length) ? app.insuredMembers.slice() : null;
  if(!raw){
    const c = (BANCA.customerById && BANCA.customerById(app.customerId)) || {};
    const dob = (app.buyerIsInsured!==false) ? (c.dob||app.insuredDob) : app.insuredDob;
    raw = [{name: app.insuredName||c.name||'', dob: dob||'', relationship: (app.buyerIsInsured===false?(app.relationship||'Khác'):'Bản thân')}];
  }
  return raw.map(function(m, idx){ return BANCA.hydrateInsuredUnit(app, m, idx); });
};

BANCA.healthUnitById = function(app, unitId){
  const units = BANCA.healthUnitsOf(app);
  return units.find(function(u){ return u.insuredUnitId===unitId; }) || units[0] || null;
};

// Eligibility sơ bộ NGAY theo tuổi/quan hệ/nghề (báo lỗi tuổi ngay, không chờ khai báo).
BANCA.healthUnitEligibility = function(app, unit){
  const errors=[], warnings=[];
  const age = unit.age;
  if(age==null){
    warnings.push({code:'AGE_MISSING', msg:'Chưa có ngày sinh — chưa tính được tuổi bảo hiểm.'});
  } else if(age < BANCA.HEALTH_MIN_AGE || age > BANCA.HEALTH_MAX_AGE){
    errors.push({code:'AGE_OUT_OF_RANGE', msg:'Tuổi '+age+' ngoài phạm vi nhận bảo hiểm ('+BANCA.HEALTH_MIN_AGE+'–'+BANCA.HEALTH_MAX_AGE+').'});
  }
  if(unit.isChild && BANCA.HEALTH_CHILD_NEEDS_ADULT){
    const anyAdult = BANCA.healthUnitsOf(app).some(function(u){ return u.active!==false && u.age!=null && u.age>BANCA.HEALTH_CHILD_MAX_AGE; });
    if(!anyAdult) errors.push({code:'CHILD_NEEDS_ADULT', msg:'Thành viên dưới 18 tuổi cần có người lớn (cha/mẹ) cùng tham gia.'});
    if(!unit.guardianName) warnings.push({code:'CHILD_GUARDIAN', msg:'Thành viên dưới 18 tuổi cần người đại diện để xác nhận.'});
  }
  const ra = unit.riskAnswers || {};
  if(ra.seriousIllness) errors.push({code:'SERIOUS_ILLNESS', msg:'Bệnh nghiêm trọng — dừng phát hành tự động, chuyển quy trình riêng.'});
  if(ra.preExistingCondition) warnings.push({code:'PRE_EXISTING', msg:'Có bệnh có sẵn — cần chi tiết và chuyển thẩm định.'});
  if(ra.hospitalizedLast12Months) warnings.push({code:'RECENT_HOSPITAL', msg:'Có điều trị/nhập viện gần đây — cần hồ sơ y tế.'});
  if(ra.smoker) warnings.push({code:'SMOKER', msg:'Hút thuốc — có thể áp dụng phụ phí.'});
  return {eligible: errors.length===0, errors:errors, warnings:warnings};
};

// Bộ câu hỏi NGƯỜI LỚN vs TRẺ EM — KHÁC nhau (không dùng bộ người lớn cho trẻ).
BANCA.HEALTH_ADULT_QUESTIONS = [
  {code:'preExistingCondition', label:'Có bệnh có sẵn hoặc đang điều trị định kỳ?', type:'boolean', triggers:'referral'},
  {code:'preExistingDetail', label:'Chi tiết bệnh có sẵn/điều trị', type:'text', branchOn:'preExistingCondition', triggers:'referral'},
  {code:'hospitalizedLast12Months', label:'Có nhập viện hoặc phẫu thuật trong 12 tháng gần nhất?', type:'boolean', triggers:'referral'},
  {code:'seriousIllness', label:'Đã/đang mắc bệnh nghiêm trọng (ung thư, suy thận, bệnh tim nặng...)?', type:'boolean', triggers:'eligibility'},
  {code:'smoker', label:'Có hút thuốc lá hoặc sản phẩm nicotine?', type:'boolean', triggers:'loading'},
  {code:'truthDeclaration', label:'Khách xác nhận khai báo trung thực và đồng ý xử lý dữ liệu sức khỏe.', type:'boolean', triggers:'consent'}
];
BANCA.HEALTH_CHILD_QUESTIONS = [
  {code:'birthComplication', label:'Trẻ có bất thường/biến chứng khi sinh cần theo dõi?', type:'boolean', triggers:'referral'},
  {code:'congenitalCondition', label:'Trẻ có bệnh bẩm sinh hoặc dị tật đã chẩn đoán?', type:'boolean', triggers:'referral'},
  {code:'congenitalDetail', label:'Chi tiết bệnh bẩm sinh/dị tật', type:'text', branchOn:'congenitalCondition', triggers:'referral'},
  {code:'hospitalizedLast12Months', label:'Trẻ có nhập viện/phẫu thuật trong 12 tháng gần nhất?', type:'boolean', triggers:'referral'},
  {code:'seriousIllness', label:'Trẻ đã/đang mắc bệnh nghiêm trọng cần điều trị dài hạn?', type:'boolean', triggers:'eligibility'},
  {code:'guardianTruthDeclaration', label:'Người đại diện (cha/mẹ/giám hộ) xác nhận khai báo trung thực thay cho trẻ.', type:'boolean', triggers:'consent'}
];
BANCA.healthUnitQuestions = function(unit){
  return unit.isChild ? BANCA.HEALTH_CHILD_QUESTIONS : BANCA.HEALTH_ADULT_QUESTIONS;
};
// Câu xác nhận trung thực khác nhau adult/child.
BANCA.healthUnitConsentKey = function(unit){ return unit.isChild ? 'guardianTruthDeclaration' : 'truthDeclaration'; };

// Rating PER_MEMBER: phí 1 thành viên theo gói của chính họ (không chia sẻ).
BANCA.rateHealthUnit = function(unit){
  const code = unit.package;
  if(!code || unit.age==null) return null;
  const rt = BANCA.rateHealth({packageCode:code, members:[{name:unit.name, age:unit.age, relationship:unit.relationship}]});
  return rt;
};

// PER_MEMBER_THEN_AGGREGATE: phí từng người → chiết khấu gia đình → tổng.
BANCA.healthFamilyRating = function(app){
  const units = BANCA.healthUnitsOf(app).filter(function(u){ return u.active!==false; });
  const lines = [];
  let subtotalPre = 0;   // trước chiết khấu, chưa VAT (base cho từng người)
  let taxSum = 0;
  units.forEach(function(u){
    const rt = BANCA.rateHealthUnit(u);
    const memberBase = rt ? (rt.subtotal||0) : 0;      // base trước VAT
    const memberTax = rt ? (rt.vatAmount||0) : 0;
    const memberTotal = rt ? (rt.totalPremium||0) : 0;
    subtotalPre += memberBase; taxSum += memberTax;
    lines.push({insuredUnitId:u.insuredUnitId, name:u.name||('Thành viên '+(u.index+1)),
      package:u.package, base:memberBase, tax:memberTax, premium:memberTotal, eligible: !!rt && memberTotal>0});
  });
  // Chiết khấu gia đình ≥3 thành viên đủ điều kiện (5%).
  const eligibleCount = lines.filter(function(l){ return l.eligible; }).length;
  let familyDiscount = 0;
  if(eligibleCount>=3){ familyDiscount = Math.round(subtotalPre*0.05); }
  const netBase = subtotalPre - familyDiscount;
  const total = lines.reduce(function(s,l){ return s+l.premium; }, 0) - familyDiscount;
  return {lines:lines, subtotalPre:subtotalPre, familyDiscount:familyDiscount, netBase:netBase, tax:taxSum, total: total, eligibleCount:eligibleCount, memberCount:units.length};
};

// Gói có quyền lợi tử vong? → beneficiary section có điều kiện (health packages hiện KHÔNG có).
BANCA.healthPackageHasDeathBenefit = function(code){
  const pk = (BANCA.healthPackages||{})[code] || {};
  return !!(pk.deathSumInsured || pk.coverageList && pk.coverageList.indexOf('DEATH')>=0);
};

// Trạng thái hoàn tất 1 InsuredCoverageUnit ở EDIT mode (✓ / ! / ×).
BANCA.healthUnitStatus = function(app, unit){
  const elig = BANCA.healthUnitEligibility(app, unit);
  const missing = [];
  if(!elig.eligible){
    return {code:'ineligible', label:'Không đủ điều kiện', tone:'danger', icon:'×',
      missing: elig.errors.map(function(e){return e.msg;}), warnings: elig.warnings, eligibility:elig};
  }
  if(!unit.package) missing.push({t:'Chưa chọn gói', step:'PACKAGE_AND_QUOTE'});
  const consentKey = BANCA.healthUnitConsentKey(unit);
  const ra = unit.riskAnswers || {};
  const qs = BANCA.healthUnitQuestions(unit);
  const answeredCore = qs.filter(function(q){ return q.type==='boolean' && !q.branchOn && q.code!==consentKey; }).every(function(q){ return ra[q.code]!=null; });
  if(!answeredCore) missing.push({t:'Chưa hoàn tất khai báo sức khỏe', step:'RISK_DECLARATION'});
  if(ra[consentKey]!==true) missing.push({t:'Chưa xác nhận khai báo trung thực', step:'RISK_DECLARATION'});
  // Tài liệu per-member: nếu khai báo phát sinh → cần hồ sơ y tế.
  const needsMedical = !!(ra.preExistingCondition || ra.hospitalizedLast12Months || ra.congenitalCondition || ra.birthComplication);
  if(needsMedical && unit.docs && unit.docs.MEDICAL_RECORD!=='UPLOADED') missing.push({t:'Thiếu hồ sơ y tế', step:'DOCUMENTS'});
  if(unit.isChild && (!unit.docs || unit.docs.BIRTH_CERT!=='UPLOADED')) missing.push({t:'Thiếu giấy khai sinh', step:'DOCUMENTS'});
  // Người thụ hưởng: chỉ khi gói có quyền lợi tử vong.
  if(BANCA.healthPackageHasDeathBenefit(unit.package)){
    const share = (unit.beneficiaries||[]).reduce(function(s,b){ return s+(Number(b.share)||0); }, 0);
    if(!(unit.beneficiaries||[]).length) missing.push({t:'Chưa có người thụ hưởng', step:'PACKAGE_AND_QUOTE'});
    else if(share!==100) missing.push({t:'Tỷ lệ thụ hưởng phải bằng 100%', step:'PACKAGE_AND_QUOTE'});
  }
  if(missing.length){
    return {code:'incomplete', label:'Còn thiếu', tone:'warn', icon:'!', missing: missing.map(function(m){return m.t;}), missingSteps:missing, warnings: elig.warnings, eligibility:elig};
  }
  return {code:'complete', label:'Hoàn tất', tone:'ok', icon:'✓', missing:[], warnings: elig.warnings, eligibility:elig};
};

// Điều kiện nộp: ALL_ACTIVE_MEMBERS_READY.
BANCA.healthSubmitReadiness = function(app){
  const units = BANCA.healthUnitsOf(app).filter(function(u){ return u.active!==false; });
  const blockers = [];
  if(!units.length) blockers.push({name:'—', missing:['Chưa có người được bảo hiểm active'], step:'INSURED_PARTY'});
  units.forEach(function(u){
    const stt = BANCA.healthUnitStatus(app, u);
    if(stt.code!=='complete'){
      blockers.push({unitId:u.insuredUnitId, name:u.name||('Thành viên '+(u.index+1)), code:stt.code,
        missing: stt.missing, step: (stt.missingSteps&&stt.missingSteps[0]&&stt.missingSteps[0].step) || (stt.code==='ineligible'?'INSURED_PARTY':'RISK_DECLARATION')});
    }
  });
  return {ready: blockers.length===0, blockers:blockers, activeCount:units.length};
};

// Thẩm định per-member — DERIVE trạng thái tổng.
BANCA.HEALTH_UW_MEMBER = {
  APPROVED_STP:   {label:'Chấp thuận tự động', tone:'ok'},
  IN_UW:          {label:'Đang thẩm định', tone:'wait'},
  NEED_MORE_INFO: {label:'Cần bổ sung', tone:'warn'},
  CONDITIONAL:    {label:'Chấp thuận có điều kiện', tone:'warn'},
  LOADING:        {label:'Phụ phí', tone:'warn'},
  EXCLUSION:      {label:'Loại trừ', tone:'warn'},
  REDUCED:        {label:'Giảm quyền lợi', tone:'warn'},
  MEDICAL_EXAM:   {label:'Cần khám bổ sung', tone:'warn'},
  REJECTED:       {label:'Từ chối', tone:'danger'}
};
BANCA.healthDeriveOverallUw = function(app){
  const units = BANCA.healthUnitsOf(app).filter(function(u){ return u.active!==false; });
  const decs = units.map(function(u){ return (u.underwriting&&u.underwriting.decision)||null; });
  if(!decs.length) return {code:'PENDING', label:'Chờ thẩm định', tone:'wait'};
  if(decs.some(function(d){ return d==='NEED_MORE_INFO'; })) return {code:'NEED_MORE_INFO', label:'Cần bổ sung', tone:'warn'};
  if(decs.some(function(d){ return d==null || d==='IN_UW'; })) return {code:'IN_UW', label:'Đang thẩm định', tone:'wait'};
  if(decs.every(function(d){ return d==='APPROVED_STP' || d==='CONDITIONAL' || d==='LOADING' || d==='EXCLUSION' || d==='REDUCED'; }))
    return {code:'READY_PAYMENT', label:'Chờ chọn cách thanh toán', tone:'ok'};
  if(decs.some(function(d){ return d==='REJECTED'; }) && decs.some(function(d){ return d!=='REJECTED'; }))
    return {code:'PARTIAL', label:'Có thành viên bị từ chối — cần loại & tính lại', tone:'warn'};
  return {code:'IN_UW', label:'Đang thẩm định', tone:'wait'};
};

// §10 — Quick Advice Health: ước tính phí theo nhóm tuổi + tổng gia đình (KHÔNG thu khai báo/OTP/tài liệu y tế).
BANCA.HEALTH_ADVICE_PKG = {BASIC:'HEALTH_BASIC', STANDARD:'HEALTH_STD', PREMIUM:'HEALTH_PLUS'};
BANCA.healthQuickAdviceEstimate = function(opts){
  opts = opts||{};
  const pkgCode = opts.packageCode || 'HEALTH_STD';
  const groups = [
    {key:'adults',   label:'Người lớn (18–55)', age:38, count:opts.adults!=null?opts.adults:2},
    {key:'children', label:'Trẻ em (0–17)',      age:8,  count:opts.children!=null?opts.children:1},
    {key:'seniors',  label:'Cao tuổi (56–65)',   age:60, count:opts.seniors!=null?opts.seniors:0}
  ];
  const lines=[]; let subtotal=0, members=0;
  groups.forEach(function(g){
    if(g.count<=0) return;
    const rt = BANCA.rateHealth({packageCode:pkgCode, members:[{age:g.age}]});
    const per = rt ? rt.totalPremium : 0;
    lines.push({label:g.label, count:g.count, per:per, sub:per*g.count});
    subtotal += per*g.count; members += g.count;
  });
  const discount = members>=3 ? Math.round(subtotal*0.05) : 0;
  const pk = (BANCA.healthPackages||{})[pkgCode] || {};
  return {lines:lines, members:members, subtotal:subtotal, discount:discount, total:subtotal-discount, packageCode:pkgCode,
    waiting:'Thời gian chờ chung 30 ngày; bệnh có sẵn/thai sản tới 12 tháng.',
    verify:['Tuổi từng thành viên tại ngày hiệu lực','Tiền sử bệnh/khai báo sức khỏe','Quan hệ với bên mua'],
    maternity: pk.maternityLimit? ('Thai sản '+BANCA.vnd(pk.maternityLimit)) : 'Không bao gồm thai sản'};
};

// Tóm tắt member-centric cho danh sách (list/submitted).
BANCA.healthMemberSummary = function(app){
  const units = BANCA.healthUnitsOf(app);
  const active = units.filter(function(u){ return u.active!==false; });
  const rating = BANCA.healthFamilyRating(app);
  let done=0, incomplete=0, ineligible=0;
  const warns=[];
  active.forEach(function(u){
    const s = BANCA.healthUnitStatus(app, u);
    if(s.code==='complete') done++; else if(s.code==='ineligible'){ ineligible++; warns.push(u.name+': không đủ điều kiện'); }
    else { incomplete++; if(s.missing[0]) warns.push(u.name+': '+s.missing[0]); }
  });
  return {
    memberCount: units.length,
    activeCount: active.length,
    brief: active.map(function(u){ return (u.name||'—')+' ('+(u.relationship||'—')+(u.age!=null?' · '+u.age+'t':'')+')'; }).join(', '),
    done: done, incomplete: incomplete, ineligible: ineligible,
    total: rating.total,
    warnings: warns,
    progress: active.length? Math.round(done/active.length*100) : 0
  };
};
