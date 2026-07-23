// P1-5: Master data hãng/dòng xe + P0-1: cấu hình gói/add-on/deductible theo CODE.
// Combobox đọc từ đây; "tạo mới" thêm in-session (production cần luồng duyệt Distribution).
window.BANCA = window.BANCA || {};

BANCA.vehicleMaster = {
  brands: {
    'Toyota':   ['Vios G','Vios E','Raize','Wigo','Corolla Cross','Fortuner','Camry'],
    'Honda':    ['City','Civic','CR-V','HR-V','Accord'],
    'Mazda':    ['Mazda 2','Mazda 3','CX-5','CX-8'],
    'Hyundai':  ['i10','Accent','Elantra','Tucson','Santa Fe'],
    'Kia':      ['Morning','K3','Seltos','Sonet','Carnival'],
    'Ford':     ['Ranger','Everest','Territory','Explorer'],
    'VinFast':  ['VF 3','VF 5','VF 6','VF 7','VF 8','VF 9'],
    'Mitsubishi':['Xpander','Attrage','Outlander'],
    'Suzuki':   ['XL7','Ertiga','Swift'],
    'Mercedes': ['C200','C300','GLC200','E200'],
    'BMW':      ['320i','X1','X3','X5'],
    'Daewoo':   ['Lacetti','Gentra']
  },
  types: ['Ô tô con','Ô tô bán tải','Ô tô khách (< 9 chỗ)','Ô tô tải nhẹ'],
  usages: ['Cá nhân','Kinh doanh vận tải','Cơ quan/doanh nghiệp (không KD vận tải)'],
  seats: [2,4,5,7,9,16]
};
// In-session thêm mới (không persist qua reset)
BANCA.addBrand = b => { if(!BANCA.vehicleMaster.brands[b]) BANCA.vehicleMaster.brands[b]=[]; };
BANCA.addModel = (b,m) => { BANCA.addBrand(b); if(!BANCA.vehicleMaster.brands[b].includes(m)) BANCA.vehicleMaster.brands[b].push(m); };

// ===== Package config theo CODE (P0-1). coverageList = quyền lợi lõi; add-on tách riêng =====
BANCA.motorPackages = {
  BASIC:    {code:'BASIC',    name:'Basic',    rate:0.011, defaultDeductible:2000000,
             coverageList:['TPL','OD'], defaultAddOns:[],
             desc:'TNDS bắt buộc + vật chất cơ bản'},
  STANDARD: {code:'STANDARD', name:'Standard', rate:0.013, defaultDeductible:1000000,
             coverageList:['TPL','OD','THEFT_PART'], defaultAddOns:['HYDRO_LOCK'],
             desc:'+ mất cắp bộ phận, mặc định kèm thủy kích'},
  PREMIUM:  {code:'PREMIUM',  name:'Premium',  rate:0.015, defaultDeductible:500000,
             coverageList:['TPL','OD','THEFT_PART','NEW_FOR_OLD','ROADSIDE_24_7'], defaultAddOns:['HYDRO_LOCK','GLASS','FLOOD'],
             desc:'+ thay mới không khấu hao, cứu hộ 24/7, đủ add-on'}
};
BANCA.coverageLabels = {
  TPL:'TNDS bắt buộc', OD:'Vật chất xe', THEFT_PART:'Mất cắp bộ phận',
  NEW_FOR_OLD:'Thay mới không khấu hao', ROADSIDE_24_7:'Cứu hộ 24/7'
};
BANCA.motorAddOns = {
  GLASS:      {code:'GLASS',      name:'Vỡ kính',            ratePct:4},
  HYDRO_LOCK: {code:'HYDRO_LOCK', name:'Thủy kích',          ratePct:6},
  FLOOD:      {code:'FLOOD',      name:'Thiên tai / ngập lụt',ratePct:5}
};
BANCA.deductibleOptions = [500000, 1000000, 2000000, 5000000];
BANCA.termOptions = [{months:12, label:'12 tháng'}];

// ===== Rating engine v2 — công thức "thác nước" (chốt 2026-07-20 16:35) =====
// KHỐI 1: TNDS bắt buộc — phí luật cố định, không add-on/NCD/giảm.
// KHỐI 2: Vật chất = gốc OD + add-on (tiền) + điều chỉnh khấu trừ/tuổi xe = SUBTOTAL
//         → trừ NCD (áp TRÊN SUBTOTAL đã gồm add-on — user chốt) → +VAT 10% → Phí phải đóng.
BANCA.TPL_PREMIUM = 480700; // TNDS ô tô con < 6 chỗ không KD (theo biểu phí luật, gồm VAT)
BANCA.VAT_PCT = 10;
BANCA.rateMotor = function(inputs){
  const pkg = BANCA.motorPackages[inputs.packageCode];
  if(!pkg) return null;
  const tplPremium = BANCA.TPL_PREMIUM;
  const odBase = Math.round(inputs.sumInsured * pkg.rate);
  // Dòng cộng phí vật chất (add-on + điều chỉnh) — mỗi dòng hiện % và TIỀN
  const lines = [];
  (inputs.addOns||[]).forEach(c=>{
    const a=BANCA.motorAddOns[c];
    if(a) lines.push({code:c, label:'Add-on: '+a.name, type:'loading', pct:a.ratePct, amount:Math.round(odBase*a.ratePct/100)});
  });
  if(inputs.deductible > pkg.defaultDeductible) lines.push({code:'DEDUCT_HIGH', label:'Khấu trừ cao hơn chuẩn gói', type:'discount', pct:5, amount:-Math.round(odBase*5/100)});
  else if(inputs.deductible < pkg.defaultDeductible) lines.push({code:'DEDUCT_LOW', label:'Khấu trừ thấp hơn chuẩn gói', type:'loading', pct:5, amount:Math.round(odBase*5/100)});
  if(inputs.vehicleAgeYears > 10) lines.push({code:'OLD_VEHICLE', label:'Xe trên 10 năm tuổi', type:'loading', pct:10, amount:Math.round(odBase*10/100)});
  const subtotal = odBase + lines.reduce((s,l)=>s+l.amount,0);
  const ncdPct = inputs.ncdPercent||0;
  const ncdAmount = Math.round(subtotal * ncdPct/100); // NCD trên subtotal gồm add-on
  const odAfterNcd = subtotal - ncdAmount;
  const vatAmount = Math.round(odAfterNcd * BANCA.VAT_PCT/100);
  const odTotal = odAfterNcd + vatAmount;
  const totalPremium = tplPremium + odTotal;
  return {
    tplPremium, odBase, lines, subtotal, ncdPct, ncdAmount, odAfterNcd, vatAmount, odTotal, totalPremium,
    // alias tương thích ngược (list/home/payment cũ đọc basePremium/adjustedPremium/adjustments)
    basePremium: odBase,
    adjustedPremium: totalPremium,
    adjustments: lines.map(l=>({code:l.code,label:l.label,type:l.type,pct:l.pct}))
  };
};
BANCA.inputHashOf = inputs => JSON.stringify([inputs.packageCode,inputs.sumInsured,inputs.termMonths,(inputs.addOns||[]).slice().sort(),inputs.deductible,inputs.ncdPercent||0]);

// ===== Quote status computed (P0-4) — giờ Asia/Saigon =====
// EXPIRED nếu quá validUntil; EXPIRING_SOON nếu còn ≤2 ngày; STALE nếu inputHash lệch; else ACTIVE
BANCA.quoteStatus = function(quote, currentInputs){
  if(!quote) return null;
  if(currentInputs && quote.inputHash && BANCA.inputHashOf(currentInputs)!==quote.inputHash) return 'STALE';
  const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Saigon'}));
  const vu = new Date(quote.validUntil+'T23:59:59');
  if(now > vu) return 'EXPIRED';
  if((vu - now) <= 2*24*3600*1000) return 'EXPIRING_SOON';
  return 'ACTIVE';
};
// ===== Ma trận tài liệu (rule engine) — theo tài liệu 2026-07-20 =====
// status ∈ REQUIRED (●) | CONDITIONAL (◐, kèm active true/false + lý do) | INHERITED (↻) | OPTIONAL (○)
// context: {source ('RENEWAL'|khác), vehicle, mortgage, idv, vehicleAgeYears}
BANCA.DOC_CATALOG = [
 {code:'REG',            name:'Giấy đăng ký xe',                sub:'Xác định xe & chủ xe'},
 {code:'INSPECT',        name:'Giấy đăng kiểm còn hiệu lực',    sub:'Xác nhận xe đủ điều kiện lưu hành'},
 {code:'PHOTOS',         name:'Ảnh hiện trạng xe',              sub:'4 góc + đồng hồ km + số khung/số máy'},
 {code:'ID',             name:'CMND/CCCD chủ xe',               sub:'Cá nhân: CCCD · Tổ chức: ĐKKD + MST'},
 {code:'DRIVER_LICENSE', name:'Giấy phép lái xe (GPLX)',        sub:'Chủ yếu cần ở khâu bồi thường'},
 {code:'VALUE_PROOF',    name:'Chứng từ giá trị xe',            sub:'Hóa đơn VAT / HĐ mua bán — xác định IDV'},
 {code:'AUTHORIZATION',  name:'Giấy ủy quyền / HĐ thuê xe',     sub:'Khi người mua ≠ chủ xe đăng ký'},
 {code:'BENEFICIARY',    name:'Thông tin bên thụ hưởng',        sub:'Xe đang thế chấp / trả góp ngân hàng'},
 {code:'SURVEY',         name:'Biên bản giám định / khảo sát',  sub:'Đánh giá rủi ro trước khi cấp'}
];
BANCA.docRequirements = function(ctx){
 ctx = ctx||{};
 const renewal = ctx.source==='RENEWAL';
 const age = ctx.vehicleAgeYears||0;
 const highValue = (ctx.idv||0) >= 1200000000;
 const mortgaged = !!(ctx.mortgage && ctx.mortgage.mortgaged);
 const newCar = age<=0;
 const res = {};
 res.REG            = renewal? {status:'INHERITED', note:'Dùng lại kỳ trước nếu còn hợp lệ'} : {status:'REQUIRED'};
 res.INSPECT        = {status:'REQUIRED', note: renewal?'Không kế thừa — kiểm tra hạn đăng kiểm ≥ ngày hiệu lực':''};
 res.PHOTOS         = renewal? {status:'CONDITIONAL', active:false, note:'Chỉ khi gián đoạn BH / chuyển công ty / kỳ trước có claim'} : {status:'REQUIRED'};
 res.ID             = renewal? {status:'INHERITED', note:'Dùng lại kỳ trước nếu còn hợp lệ'} : {status:'REQUIRED'};
 res.DRIVER_LICENSE = {status:'CONDITIONAL', active:false, note:'Không bắt buộc khi cấp đơn yêu cầu chuẩn — luôn bắt buộc ở khâu bồi thường'};
 res.VALUE_PROOF    = highValue? {status:'REQUIRED', note:'Xe giá trị cao — bắt buộc chứng từ IDV'} : {status:'CONDITIONAL', active:newCar, note: newCar?'Xe mới 100% — dùng hóa đơn chốt IDV':'Chỉ khi IDV lệch bảng giá ±10%'};
 res.AUTHORIZATION  = {status:'CONDITIONAL', active:false, note:'Khi bên mua ≠ chủ xe đăng ký'};
 res.BENEFICIARY    = mortgaged? {status:'CONDITIONAL', active:true, note:'Xe thế chấp — cần văn bản NH xác nhận bên thụ hưởng'} : {status:'CONDITIONAL', active:false, note:'Chỉ khi xe thế chấp / trả góp'};
 res.SURVEY         = (age>10||highValue)? {status:'CONDITIONAL', active:true, note: age>10?'Xe trên 10 năm tuổi':'IDV vượt ngưỡng phân cấp'} : {status:'CONDITIONAL', active:false, note:'Xe >10 năm tuổi / tiền sử tổn thất / IDV vượt ngưỡng'};
 return res;
};
// Tài liệu đang THIẾU chặn nộp: ● hoặc ◐-đã-kích-hoạt mà chưa upload
BANCA.missingRequiredDocs = function(ctx, uploadedCodes){
 const req = BANCA.docRequirements(ctx);
 return BANCA.DOC_CATALOG.filter(d=>{
  const r=req[d.code];
  const need = r.status==='REQUIRED' || (r.status==='CONDITIONAL' && r.active);
  return need && !(uploadedCodes||[]).includes(d.code);
 });
};

BANCA.quoteStatusBadge = function(st){
  const m={
    ACTIVE:['badge-ready','Báo giá còn hiệu lực'],
    EXPIRING_SOON:['badge-conditional','Báo giá sắp hết hạn – cần tính phí lại trước khi nộp'],
    EXPIRED:['badge-blocked','Báo giá đã hết hạn – phải tính phí lại'],
    STALE:['badge-blocked','Thông tin đã thay đổi – phải tính phí lại']
  }[st]||['badge-pending',st];
  return `<span class="badge ${m[0]}">${m[1]}</span>`;
};
