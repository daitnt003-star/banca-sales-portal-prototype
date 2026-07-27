// ============================================================
// Quick Advisory (Tư vấn nhanh) — seed & config
// Luồng ĐỘC LẬP với bán hàng. KHÔNG tạo Sales Session/Quote/HSYCBH
// khi tư vấn. Chỉ nối sang bán qua hành động "Tạo bản chào từ tư vấn này".
// Phí ở đây LUÔN là minh họa (illustrative band), không phải phí chính thức.
// ============================================================
window.BANCA = window.BANCA || {};

// ---- Advisory status model (riêng, KHÔNG tái dùng status HSYCBH) ----
BANCA.ADVICE_STATUS = {
  IN_PROGRESS:       {label:'Đang thực hiện',  badge:'badge-base',        group:'ACTIVE'},
  RECOMMENDED:       {label:'Đã gợi ý',        badge:'badge-base',        group:'ACTIVE'},
  COMPARING:         {label:'Đang so sánh',    badge:'badge-pending',     group:'ACTIVE'},
  SAVED:             {label:'Đã lưu',          badge:'badge-ready',       group:'SAVED'},
  FOLLOW_UP_LATER:   {label:'Cần theo dõi',    badge:'badge-conditional', group:'FOLLOW_UP'},
  NOT_INTERESTED:    {label:'Chưa quan tâm',   badge:'badge-blocked',     group:'CLOSED'},
  CONVERTED_TO_SALE: {label:'Đã chuyển bán',   badge:'badge-ready',       group:'CONVERTED'},
  ABANDONED:         {label:'Đã hủy',          badge:'badge-blocked',     group:'CLOSED'},
  EXPIRED:           {label:'Hết hạn',         badge:'badge-version',     group:'CLOSED'}
};
BANCA.adviceStatusBadge = function(s){
  const m = BANCA.ADVICE_STATUS[s] || {label:s, badge:'badge-version'};
  return `<span class="badge ${m.badge}">${m.label}</span>`;
};

// ---- Danh mục nhu cầu (need signals) ----
BANCA.NEED_CATALOG = [
  {id:'HEALTH',        icon:'🩺', label:'Sức khỏe / viện phí',      desc:'Chi phí nằm viện, phẫu thuật, ngoại trú'},
  {id:'ACCIDENT',      icon:'🦺', label:'Tai nạn cá nhân',          desc:'Trợ cấp thương tật, tử vong do tai nạn'},
  {id:'LOAN',          icon:'🏦', label:'Bảo vệ khoản vay',         desc:'Dư nợ được bảo hiểm khi rủi ro'},
  {id:'MOTOR',         icon:'🚗', label:'Bảo vệ xe',                desc:'Vật chất xe, TNDS, phụ kiện'},
  {id:'HOME',          icon:'🏠', label:'Nhà / tài sản',            desc:'Cháy nổ, thiên tai, trộm cắp'},
  {id:'TRAVEL',        icon:'✈️', label:'Du lịch',                  desc:'Y tế khẩn cấp, trễ/hủy chuyến'},
  {id:'INCOME',        icon:'💼', label:'Bảo vệ thu nhập',          desc:'Trợ cấp khi mất khả năng lao động'},
  {id:'FAMILY_HEALTH', icon:'👨‍👩‍👧', label:'Sức khỏe gia đình',    desc:'Gói sức khỏe cho cả gia đình'},
  {id:'BUSINESS',      icon:'🏢', label:'Doanh nghiệp / nhân viên',  desc:'Bảo hiểm nhóm cho nhân viên'}
];
BANCA.needLabel = id => (BANCA.NEED_CATALOG.find(n=>n.id===id)||{}).label || id;

// ============================================================
// §6.2 — BANKING CONTEXT: ngữ cảnh ngân hàng truyền sang (deep link) hoặc seller chọn.
// Context điều khiển: bộ câu hỏi (qua primaryNeed) · nhu cầu gợi ý · sản phẩm/gói đề xuất
// · nội dung giải thích · cross-sell · sản phẩm seller được quyền bán (lọc qua readiness).
// KHÔNG hard-code trong page — advisory chỉ đọc config này.
// ============================================================
BANCA.BANKING_CONTEXTS = [
  { id:'LOAN_AUTO', icon:'🚗', label:'Vay mua ô tô', kind:'LOAN',
    desc:'Khoản vay có tài sản bảo đảm là xe',
    primaryNeed:'MOTOR', suggestedNeeds:['MOTOR','LOAN'], crossSell:['ACCIDENT'],
    explain:'Xe là tài sản bảo đảm cho khoản vay — ngân hàng thường yêu cầu bảo hiểm vật chất xe trong suốt thời gian vay. Gợi ý ưu tiên gói bảo vệ xe, kèm tai nạn cho lái/phụ xe.' },
  { id:'LOAN_HOME', icon:'🏠', label:'Vay mua nhà', kind:'LOAN',
    desc:'Khoản vay có tài sản bảo đảm là bất động sản',
    // primaryNeed để ĐÚNG bản chất là HOME. Nhu cầu này hiện chưa có sản phẩm
    // (khai báo ở NEED_COVERAGE) → engine tự lọc và hạ xuống nhu cầu bán được,
    // KHÔNG hard-code workaround ở đây.
    primaryNeed:'HOME', suggestedNeeds:['HOME','LOAN','INCOME'], crossSell:['HEALTH'],
    explain:'Nhà là tài sản bảo đảm dài hạn. Ưu tiên bảo hiểm tài sản (cháy nổ, thiên tai) và bảo vệ khả năng trả nợ khi mất thu nhập.' },
  { id:'LOAN_BUSINESS', icon:'🏭', label:'Vay phục vụ sản xuất kinh doanh', kind:'LOAN',
    desc:'Khoản vay vốn lưu động / đầu tư SXKD',
    primaryNeed:'BUSINESS', suggestedNeeds:['BUSINESS','LOAN','ACCIDENT'], crossSell:['HEALTH'],
    explain:'Rủi ro gián đoạn kinh doanh ảnh hưởng trực tiếp khả năng trả nợ. Ưu tiên bảo hiểm nhóm cho nhân viên và bảo vệ người điều hành chính.' },
  { id:'PROTECT_HEALTH', icon:'🩺', label:'Bảo vệ sức khỏe cá nhân', kind:'PROTECTION',
    desc:'Không gắn khoản vay',
    primaryNeed:'HEALTH', suggestedNeeds:['HEALTH'], crossSell:['ACCIDENT','INCOME'],
    explain:'Nhu cầu bảo vệ chi phí y tế cho cá nhân. Ưu tiên gói sức khỏe theo mức đồng chi trả và quyền lợi ngoại trú.' },
  { id:'PROTECT_FAMILY', icon:'👨‍👩‍👧', label:'Bảo vệ gia đình', kind:'PROTECTION',
    desc:'Nhiều người được bảo hiểm trong một hợp đồng',
    primaryNeed:'FAMILY_HEALTH', suggestedNeeds:['FAMILY_HEALTH','HEALTH'], crossSell:['ACCIDENT'],
    explain:'Bảo vệ cho cả gia đình trong một hành trình — mỗi thành viên có kê khai sức khỏe và GCNBH riêng, phí tính theo nhóm tuổi.' },
  { id:'PROTECT_EMPLOYEE', icon:'🏢', label:'Bảo vệ nhân viên doanh nghiệp', kind:'PROTECTION',
    desc:'Khách hàng doanh nghiệp',
    primaryNeed:'BUSINESS', suggestedNeeds:['BUSINESS','ACCIDENT'], crossSell:['HEALTH'],
    explain:'Phúc lợi bảo hiểm nhóm cho nhân viên. Cần danh sách người được bảo hiểm và quy mô nhóm để tính phí.' },
  { id:'OTHER', icon:'✳️', label:'Nhu cầu khác', kind:'OTHER',
    desc:'Chưa xác định — hỏi nhu cầu chung',
    primaryNeed:null, suggestedNeeds:[], crossSell:[],
    explain:'Chưa có ngữ cảnh từ ngân hàng — chọn nhu cầu bảo vệ trực tiếp bên dưới.' }
];
BANCA.bankingContextById = id => (BANCA.BANKING_CONTEXTS||[]).find(c=>c.id===id) || null;

// Nhu cầu gợi ý theo context, ĐÃ LỌC theo sản phẩm seller được quyền bán (§6.2 gạch đầu dòng cuối).
BANCA.contextNeedsFor = function(ctxId, me){
  const c = BANCA.bankingContextById(ctxId); if(!c) return [];
  return (c.suggestedNeeds||[]).filter(function(n){
    if(!BANCA.needCoverage(n).served) return false;       // chưa có sản phẩm → không gợi ý
    const pid = (BANCA.adviceOffersFor(n)[0]||{}).productRef;
    if(!pid || !BANCA.readinessFor) return true;
    const rd = BANCA.readinessFor(pid, me);
    return rd.state !== 'HIDDEN' && rd.state !== 'N/A';   // không gợi ý sản phẩm seller không được bán
  });
};

// Phiên bản bộ quy tắc gợi ý — lưu kèm phương án khách chọn (§6.3) để truy vết về sau.
BANCA.RECOMMENDATION_VERSION = 'REC-2026.07';

BANCA.BUDGET_BANDS = [
  {id:'UNDER_500K',   label:'Dưới 500K/tháng'},
  {id:'500K_1M',      label:'500K – 1 triệu/tháng'},
  {id:'1M_2M',        label:'1 – 2 triệu/tháng'},
  {id:'OVER_2M',      label:'Trên 2 triệu/tháng'}
];
BANCA.budgetLabel = id => (BANCA.BUDGET_BANDS.find(b=>b.id===id)||{}).label || id;

// ---- Recommendation config (KHÔNG hard-code trong HTML) ----
// Mỗi option map tới product/package thật, có fit theo need + phí minh họa (band).
BANCA.ADVICE_OFFERS = {
  HEALTH: [
    {tier:'SAVE',    badge:'Tiết kiệm nhất',  productRef:'health', productName:'Bảo hiểm sức khỏe', packageRef:'BASIC',    packageName:'Basic',    fit:72, premiumBand:'6–7 triệu/năm',  premiumMonthly:'~550K/tháng', meets:['HEALTH'], gaps:['FAMILY_HEALTH'], why:'Đáp ứng viện phí cơ bản với chi phí thấp nhất.', verify:['Tuổi','Tiền sử bệnh'], issueTime:'Tức thời (STP)'},
    {tier:'BALANCE', badge:'Phù hợp nhất',    productRef:'health', productName:'Bảo hiểm sức khỏe', packageRef:'STANDARD', packageName:'Standard', fit:90, premiumBand:'9–11 triệu/năm', premiumMonthly:'~830K/tháng', meets:['HEALTH','ACCIDENT'], gaps:['FAMILY_HEALTH'], why:'Cân bằng giữa quyền lợi nội trú, ngoại trú và mức phí.', verify:['Tuổi','Tiền sử bệnh','Nghề nghiệp'], issueTime:'Tức thời (STP)'},
    {tier:'PROTECT', badge:'Bảo vệ cao nhất', productRef:'health', productName:'Bảo hiểm sức khỏe', packageRef:'PREMIUM',  packageName:'Premium',  fit:84, premiumBand:'16–20 triệu/năm', premiumMonthly:'~1.5 triệu/tháng', meets:['HEALTH','ACCIDENT','FAMILY_HEALTH'], gaps:[], why:'Quyền lợi cao nhất, gồm ngoại trú và nha khoa.', verify:['Tuổi','Tiền sử bệnh','Nghề nghiệp'], issueTime:'Trong ngày (có thẩm định)'}
  ],
  MOTOR: [
    {tier:'SAVE',    badge:'Tiết kiệm nhất',  productRef:'motor', productName:'Bảo hiểm vật chất xe', packageRef:'BASIC',    packageName:'Cơ bản',   fit:70, premiumBand:'6–7 triệu/năm',  premiumMonthly:'~550K/tháng', meets:['MOTOR'], gaps:[], why:'TNDS + vật chất cơ bản, phí thấp.', verify:['Giá trị xe','Năm SX'], issueTime:'Tức thời (STP)'},
    {tier:'BALANCE', badge:'Phù hợp nhất',    productRef:'motor', productName:'Bảo hiểm vật chất xe', packageRef:'STANDARD', packageName:'Tiêu chuẩn', fit:88, premiumBand:'8–10 triệu/năm', premiumMonthly:'~750K/tháng', meets:['MOTOR'], gaps:[], why:'Thêm quyền lợi thủy kích, mất cắp bộ phận.', verify:['Giá trị xe','Năm SX','Mục đích sử dụng'], issueTime:'Tức thời (STP)'},
    {tier:'PROTECT', badge:'Bảo vệ cao nhất', productRef:'motor', productName:'Bảo hiểm vật chất xe', packageRef:'PREMIUM',  packageName:'Nâng cao', fit:82, premiumBand:'11–13 triệu/năm', premiumMonthly:'~1 triệu/tháng', meets:['MOTOR','ACCIDENT'], gaps:[], why:'Bảo vệ toàn diện + PA lái phụ xe, cứu hộ mở rộng.', verify:['Giá trị xe','Năm SX','Mục đích sử dụng'], issueTime:'Trong ngày (có thẩm định)'}
  ],
  ACCIDENT: [
    {tier:'SAVE',    badge:'Tiết kiệm nhất',  productRef:'pa', productName:'Bảo hiểm tai nạn cá nhân', packageRef:'BASIC',    packageName:'Basic',    fit:78, premiumBand:'1–2 triệu/năm', premiumMonthly:'~150K/tháng', meets:['ACCIDENT'], gaps:['INCOME'], why:'Trợ cấp tai nạn cơ bản, phí rất thấp.', verify:['Nghề nghiệp'], issueTime:'Tức thời (STP)'},
    {tier:'BALANCE', badge:'Phù hợp nhất',    productRef:'pa', productName:'Bảo hiểm tai nạn cá nhân', packageRef:'STANDARD', packageName:'Standard', fit:85, premiumBand:'2–3 triệu/năm', premiumMonthly:'~230K/tháng', meets:['ACCIDENT','INCOME'], gaps:[], why:'Bổ sung trợ cấp thu nhập khi nằm viện.', verify:['Nghề nghiệp'], issueTime:'Tức thời (STP)'}
  ]
};
// ============================================================
// ĐỘ PHỦ SẢN PHẨM theo nhu cầu — khai báo TƯỜNG MINH nhu cầu nào danh mục
// thực sự phục vụ được.
// Trước đây map 1:1 kèm fallback `|| 'HEALTH'` → nhu cầu KHÔNG có sản phẩm vẫn bị
// gán bừa sang nhóm khác (HOME→MOTOR: "vay mua nhà" lại gợi ý bảo hiểm ô tô;
// TRAVEL→ACCIDENT; nhu cầu lạ → HEALTH). Gợi ý sai còn tệ hơn không gợi ý.
// Nay: không phục vụ được thì TRẢ RỖNG kèm lý do, UI nói thẳng (§15.3).
//   groups   : nhóm sản phẩm phục vụ được nhu cầu này (rỗng = chưa có)
//   note     : giải thích khi phục vụ GIÁN TIẾP (không phải sản phẩm đúng tên nhu cầu)
//   unserved : lý do chưa phục vụ được — hiển thị cho seller
// ============================================================
BANCA.NEED_COVERAGE = {
  HEALTH:        {groups:['HEALTH'],   note:null},
  FAMILY_HEALTH: {groups:['HEALTH'],   note:'Dùng gói sức khỏe, khai báo nhiều người được bảo hiểm trong cùng hợp đồng.'},
  BUSINESS:      {groups:['HEALTH'],   note:'Phục vụ bằng bảo hiểm sức khỏe nhóm cho nhân viên.'},
  ACCIDENT:      {groups:['ACCIDENT'], note:null},
  LOAN:          {groups:['ACCIDENT'], note:'Bảo vệ khả năng trả nợ bằng bảo hiểm tai nạn con người (chưa có sản phẩm tín dụng chuyên biệt).'},
  INCOME:        {groups:['ACCIDENT'], note:'Trợ cấp thu nhập nằm trong quyền lợi của gói tai nạn.'},
  MOTOR:         {groups:['MOTOR'],    note:null},
  HOME:          {groups:[], unserved:'Danh mục hiện chưa có bảo hiểm tài sản/nhà (cháy nổ, thiên tai).'},
  TRAVEL:        {groups:[], unserved:'Danh mục hiện chưa có bảo hiểm du lịch.'}
};
// {served, groups, note, reason} — nguồn sự thật cho mọi nơi cần biết "bán được gì cho nhu cầu này".
BANCA.needCoverage = function(need){
  const c = BANCA.NEED_COVERAGE[need];
  if(!c) return {served:false, groups:[], note:null, reason:'Nhu cầu chưa được cấu hình trong danh mục sản phẩm.'};
  return {served:(c.groups||[]).length>0, groups:c.groups||[], note:c.note||null, reason:c.unserved||null};
};
// Giữ tên cũ cho code cũ — nhưng KHÔNG fallback bừa nữa: không phục vụ được thì null.
BANCA.needToOfferGroup = function(need){ return BANCA.needCoverage(need).groups[0] || null; };

// Trả RỖNG khi nhu cầu chưa có sản phẩm — không thay bằng nhóm khác.
BANCA.adviceOffersFor = function(primaryNeed){
  const g = BANCA.needToOfferGroup(primaryNeed);
  return g ? (BANCA.ADVICE_OFFERS[g] || []) : [];
};
// Nhu cầu ĐANG bán được (dùng để gợi ý thay thế khi nhu cầu chính chưa có sản phẩm).
BANCA.servedNeeds = function(){
  return (BANCA.NEED_CATALOG||[]).filter(n=>BANCA.needCoverage(n.id).served).map(n=>n.id);
};

// ---- Bảng so sánh (giá trị cụ thể, không chỉ tick/cross) ----
BANCA.ADVICE_COMPARE = {
  health: {
    BASIC:    {noitru:'100 triệu/năm', ngoaitru:'Không bao gồm', nhakhoa:'Không', tainan:'50 triệu', waiting:'30 ngày', copay:'20%', exclude:'Bệnh có sẵn 24 tháng', docs:'CCCD, kê khai sức khỏe', issue:'Tức thời (STP)'},
    STANDARD: {noitru:'200 triệu/năm', ngoaitru:'10 triệu/năm', nhakhoa:'Không', tainan:'100 triệu', waiting:'30 ngày', copay:'10%', exclude:'Bệnh có sẵn 12 tháng', docs:'CCCD, kê khai sức khỏe', issue:'Tức thời (STP)'},
    PREMIUM:  {noitru:'500 triệu/năm', ngoaitru:'20 triệu/năm', nhakhoa:'5 triệu/năm', tainan:'200 triệu', waiting:'30 ngày', copay:'0%', exclude:'Bệnh có sẵn 12 tháng', docs:'CCCD, kê khai sức khỏe', issue:'Có thẩm định'}
  },
  motor: {
    BASIC:    {vatchat:'Theo giá trị xe', tnds:'Bắt buộc', thuykich:'Không', mattcap:'Toàn bộ xe', cuuho:'2 lần/năm', pa:'10 triệu/người', khautru:'500K/vụ', docs:'Đăng ký, đăng kiểm', issue:'Tức thời'},
    STANDARD: {vatchat:'Theo giá trị xe', tnds:'Bắt buộc', thuykich:'Có', mattcap:'Toàn bộ + bộ phận', cuuho:'4 lần/năm', pa:'10 triệu/người', khautru:'500K/vụ', docs:'Đăng ký, đăng kiểm, ảnh xe', issue:'Tức thời'},
    PREMIUM:  {vatchat:'Theo giá trị xe', tnds:'Bắt buộc', thuykich:'Có', mattcap:'Toàn bộ + bộ phận', cuuho:'Không giới hạn', pa:'20 triệu/người', khautru:'0đ', docs:'Đăng ký, đăng kiểm, ảnh xe', issue:'Có thẩm định'}
  },
  pa: {
    BASIC:    {tuvong:'200 triệu', thuongtat:'200 triệu', vienphi:'Không', trocap:'Không', waiting:'Không', docs:'CCCD', issue:'Tức thời'},
    STANDARD: {tuvong:'500 triệu', thuongtat:'500 triệu', vienphi:'2 triệu/ngày', trocap:'300K/ngày', waiting:'Không', docs:'CCCD', issue:'Tức thời'}
  }
};
BANCA.COMPARE_ROWS = {
  health: [['noitru','Nội trú'],['ngoaitru','Ngoại trú'],['nhakhoa','Nha khoa'],['tainan','Tai nạn'],['waiting','Thời gian chờ'],['copay','Đồng chi trả'],['exclude','Loại trừ nổi bật'],['docs','Tài liệu dự kiến'],['issue','Hình thức cấp đơn']],
  motor:  [['vatchat','Vật chất xe'],['tnds','TNDS'],['thuykich','Thủy kích'],['mattcap','Mất cắp'],['cuuho','Cứu hộ'],['pa','PA lái/phụ xe'],['khautru','Khấu trừ'],['docs','Tài liệu dự kiến'],['issue','Hình thức cấp đơn']],
  pa:     [['tuvong','Tử vong'],['thuongtat','Thương tật'],['vienphi','Trợ cấp viện phí'],['trocap','Trợ cấp/ngày'],['waiting','Thời gian chờ'],['docs','Tài liệu dự kiến'],['issue','Hình thức cấp đơn']]
};

// ---- Seed advice sessions (demo) ----
BANCA.adviceSessions = [
  {
    id:'ADV-2026-010', version:1, mode:'ANONYMOUS', status:'COMPARING',
    customerRef:null, customerName:null,
    needProfile:[{needId:'HEALTH', label:'Chi phí nằm viện', weight:'HIGH'},{needId:'ACCIDENT', label:'Tai nạn', weight:'MEDIUM'}],
    primaryNeed:'HEALTH', budgetBand:'500K_1M', desiredTerm:'1 năm',
    compareSet:['BASIC','STANDARD'], selectedOffer:null,
    createdBy:'RM-01', updatedAt:'2026-07-21 11:52', expiresAt:'2026-08-20 23:59'
  },
  {
    id:'ADV-2026-008', version:1, mode:'BANK_CUSTOMER', status:'FOLLOW_UP_LATER',
    customerRef:'JANUS-001288', customerName:'Phạm Thu Hà',
    needProfile:[{needId:'FAMILY_HEALTH', label:'Sức khỏe gia đình', weight:'HIGH'}],
    primaryNeed:'HEALTH', budgetBand:'1M_2M', desiredTerm:'1 năm',
    compareSet:['STANDARD','PREMIUM'],
    selectedOffer:{productRef:'health', productName:'Bảo hiểm sức khỏe', packageRef:'STANDARD', packageName:'Standard', premiumBand:'9–11 triệu/năm'},
    followUpDate:'2026-07-25', createdBy:'RM-01', updatedAt:'2026-07-20 16:10', expiresAt:'2026-08-19 23:59'
  },
  {
    id:'ADV-2026-004', version:2, mode:'BANK_CUSTOMER', status:'CONVERTED_TO_SALE',
    customerRef:'JANUS-001033', customerName:'Lê Hoàng Nam',
    needProfile:[{needId:'MOTOR', label:'Bảo vệ xe', weight:'HIGH'}],
    primaryNeed:'MOTOR', budgetBand:'1M_2M', desiredTerm:'1 năm',
    compareSet:['STANDARD','PREMIUM'],
    selectedOffer:{productRef:'motor', productName:'Bảo hiểm vật chất xe', packageRef:'PREMIUM', packageName:'Nâng cao', premiumBand:'11–13 triệu/năm'},
    convertedCaseId:'APP-2026-102', createdBy:'RM-01', updatedAt:'2026-07-19 09:30', expiresAt:'2026-08-18 23:59'
  },
  {
    id:'ADV-2026-002', version:1, mode:'ANONYMOUS', status:'IN_PROGRESS',
    customerRef:null, customerName:null,
    needProfile:[{needId:'MOTOR', label:'Bảo vệ xe', weight:'HIGH'}],
    primaryNeed:'MOTOR', budgetBand:'500K_1M', desiredTerm:'1 năm',
    compareSet:[], selectedOffer:null,
    createdBy:'RM-01', updatedAt:'2026-07-21 10:05', expiresAt:'2026-08-20 23:59'
  }
];

// ---- Helpers ----
BANCA.adviceById = function(id){
  const seed=(BANCA.adviceSessions||[]).find(a=>a.id===id)||null;
  try{ const live=JSON.parse(localStorage.getItem('banca_advice_'+id)||'null'); if(live) return Object.assign({}, seed||{}, live); }catch(e){}
  return seed;
};
BANCA.myAdvice = function(){
  const me = BANCA.current();
  return (BANCA.adviceSessions||[]).filter(a=>a.createdBy===me);
};
// Sinh mã advice mới (demo)
BANCA.newAdviceId = function(){
  const n = 900 + Math.floor(Math.random()*99);
  return 'ADV-2026-'+n;
};

// ---- Financial Advisory Workspace helpers (P0/P1) ----
// Điều khiến khách lo lắng nhất (theo mục tiêu bảo vệ, không dùng ngôn ngữ bảo hiểm)
BANCA.CONCERN_CATALOG = [
  {id:'TREATMENT_COST', icon:'🏥', label:'Chi phí điều trị'},
  {id:'INCOME_LOSS',    icon:'💸', label:'Thu nhập bị gián đoạn'},
  {id:'CHILDREN',       icon:'👶', label:'Con cái'},
  {id:'LOAN',           icon:'🏦', label:'Khoản vay'},
  {id:'DEPENDENTS',     icon:'👨‍👩‍👧', label:'Người phụ thuộc'}
];
BANCA.concernLabel = id => (BANCA.CONCERN_CATALOG.find(c=>c.id===id)||{}).label||id;

// Explainable Recommendation — lý do đề xuất / không đề xuất (dẫn xuất từ offer + ngân sách)
BANCA.explainOffer = function(offer, budgetBand){
  const budgetMax = {UNDER_500K:500000,'500K_1M':1000000,'1M_2M':2000000,OVER_2M:9000000}[budgetBand]||9000000;
  const monthly = parseInt(String(offer.premiumMonthly||'').replace(/\D/g,''))*1000 || 0;
  const within = monthly<=budgetMax;
  const pros=[]; const cons=[];
  if(within) pros.push('Phù hợp ngân sách ('+(offer.premiumMonthly||'')+')'); else cons.push('Vượt ngân sách dự kiến');
  if((offer.meets||[]).includes('HEALTH')) pros.push('Đáp ứng nhu cầu chi phí nằm viện');
  if(offer.fit>=85) pros.push('Không vượt mức chi trả kỳ vọng'); 
  if(offer.tier!=='PROTECT') pros.push('Thẩm định đơn giản (ít yêu cầu)'); else cons.push('Có thể cần thẩm định thêm');
  if((offer.meets||[]).includes('ACCIDENT')) pros.push('Có quyền lợi tai nạn');
  (offer.gaps||[]).forEach(g=>cons.push('Chưa đủ: '+BANCA.needLabel(g)));
  return {recommended: offer.fit>=80 && within, pros, cons};
};

// Dynamic follow-up questions theo mục tiêu (chỉ nhóm, không PII)
BANCA.NEED_QUESTIONS = {
  HEALTH: [
    {k:'insured_before', q:'Đã có bảo hiểm sức khỏe chưa?', opts:['Chưa','Có (cơ bản)','Có (đầy đủ)']},
    {k:'bhyt', q:'Có BHYT không?', opts:['Có','Không']},
    {k:'hospital', q:'Ưu tiên bệnh viện', opts:['Công','Tư','Quốc tế']}
  ],
  FAMILY_HEALTH: [
    {k:'members', q:'Số thành viên muốn bảo vệ', opts:['2','3–4','5+']},
    {k:'children', q:'Có con nhỏ?', opts:['Có','Không']}
  ],
  INCOME: [
    {k:'income_type', q:'Nguồn thu nhập chính', opts:['Lương','Kinh doanh','Hỗn hợp']},
    {k:'reserve', q:'Quỹ dự phòng hiện có', opts:['<1 tháng','1–3 tháng','>3 tháng']}
  ],
  MOTOR: [
    {k:'car_value', q:'Giá trị xe ước tính', opts:['<600tr','600tr–1 tỷ','>1 tỷ']},
    {k:'car_use', q:'Mục đích sử dụng', opts:['Cá nhân','Kinh doanh']}
  ],
  ACCIDENT: [
    {k:'occupation', q:'Nhóm nghề', opts:['Văn phòng','Kỹ thuật','Lao động']}
  ]
};
BANCA.needQuestionsFor = need => BANCA.NEED_QUESTIONS[need] || BANCA.NEED_QUESTIONS.HEALTH;

// Financial Gap ĐỘNG theo need (info card, không table)
BANCA.financialGapByNeed = function(state){
  const income = {UNDER_500K:15000000,'500K_1M':30000000,'1M_2M':45000000,OVER_2M:70000000}[state.budgetBand]||30000000;
  const need = state.primaryNeed;
  if(need==='INCOME'){
    const reserve=20000000; const annual=income*12; const gap=Math.max(0, annual*0.3 - reserve);
    return {icon:'💼', title:'Khoảng trống bảo vệ thu nhập', rows:[['Thu nhập/năm',income*12,'ink'],['Quỹ dự phòng',reserve,'teal'],['Khoảng trống',gap,'red']], gap, pct:Math.min(100,Math.round(gap/(annual*0.3)*100))};
  }
  if(need==='FAMILY_HEALTH'||need==='HOME'||need==='LOAN'){
    const familyCost=150000000; const loan=(need==='LOAN')?200000000:0; const existing=30000000; const gap=familyCost+loan-existing;
    return {icon:'👨‍👩‍👧', title:'Khoảng trống bảo vệ gia đình', rows:[['Chi phí gia đình/năm',familyCost,'ink'],(loan?['Dư nợ khoản vay',loan,'amber']:['Bảo vệ hiện có',existing,'teal']),['Khoảng trống',gap,'red']].filter(Boolean), gap, pct:80};
  }
  if(need==='MOTOR'){
    const carVal=800000000; const cover=0; const gap=carVal;
    return {icon:'🚗', title:'Rủi ro tài sản xe', rows:[['Giá trị xe',carVal,'ink'],['Đang được bảo vệ',cover,'teal'],['Cần bảo vệ',gap,'red']], gap, pct:100};
  }
  // HEALTH default
  const treatment=80000000; const bhyt=20000000; const gap=treatment-bhyt;
  return {icon:'🏥', title:'Khoảng trống chi phí điều trị', rows:[['Chi phí điều trị ước tính',treatment,'ink'],['BHYT chi trả',bhyt,'teal'],['Khoảng trống',gap,'red']], gap, pct:Math.round(gap/treatment*100)};
};

// Upsell riders (gợi ý — không tự thêm)
BANCA.RIDER_CATALOG = [
  {id:'ACCIDENT', label:'Tai nạn', addMonthly:80000},
  {id:'DENTAL',   label:'Nha khoa', addMonthly:50000},
  {id:'CI',       label:'Bệnh hiểm nghèo', addMonthly:120000}
];

// Decision Support — why not other + budget upgrade
BANCA.decisionSupport = function(offers, selectedPkg){
  const sel = offers.find(o=>o.packageRef===selectedPkg) || offers.find(o=>o.tier==='BALANCE') || offers[0];
  const premium = offers.find(o=>o.tier==='PROTECT');
  const basic = offers.find(o=>o.tier==='SAVE');
  const out=[];
  if(premium && sel && premium.packageRef!==sel.packageRef){
    const diff = (parseInt(String(premium.premiumMonthly||'').replace(/\D/g,''))-parseInt(String(sel.premiumMonthly||'').replace(/\D/g,'')))*1000;
    out.push(['Nếu tăng ngân sách ~'+(diff>0?BANCA.vnd(diff):'200.000')+'/tháng','Có thể nâng lên '+premium.packageName+' — thêm '+ (premium.meets||[]).filter(m=>!(sel.meets||[]).includes(m)).map(m=>BANCA.needLabel(m)).join(', ')||'quyền lợi mở rộng']);
    out.push(['Vì sao không chọn '+premium.packageName+'?','Phí cao hơn, có thể vượt ngân sách hiện tại của khách.']);
  }
  if(basic && sel && basic.packageRef!==sel.packageRef){
    out.push(['Vì sao không chọn '+basic.packageName+'?','Tiết kiệm hơn nhưng thiếu một số quyền lợi khách đang ưu tiên.']);
  }
  return out;
};
