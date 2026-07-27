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

// ============================================================
// §A — KHOẢNG TRỐNG BẢO VỆ: config versioned + hàm tính.
// KHÔNG hard-code số trong hàm tính — mọi giả định đọc từ config này.
// Thiếu input → dùng "Kịch bản minh họa" và hiển thị toàn bộ giả định;
// KHÔNG gọi kết quả minh họa là kết quả cá nhân hóa.
// ============================================================
BANCA.PROTECTION_GAP_CONFIG = {
  version: 'GAP-2026.07',
  illustrativeLabel: 'Kịch bản minh họa',
  personalizedLabel: 'Ước tính theo thông tin đã nhập',
  disclaimer: 'Ước tính minh họa để giải thích vì sao nên có bảo hiểm — không phải con số cam kết.',
  // Thu nhập/tháng suy ra từ dải ngân sách (dùng cho nhu cầu thu nhập).
  incomeByBand: {UNDER_500K:15000000,'500K_1M':30000000,'1M_2M':45000000,OVER_2M:70000000,_default:30000000},
  health: {
    icon:'🏥', title:'Khoảng trống chi phí điều trị',
    // Kịch bản điều trị minh họa (estimatedTreatment gốc, trước hệ số bệnh viện).
    scenario: {label:'Đợt điều trị nội trú lớn', base:80000000},
    // Ưu tiên bệnh viện làm THAY ĐỔI chi phí điều trị ước tính.
    hospitalFactor: {'Công':1.0, 'Tư':1.8, 'Quốc tế':3.2, _default:1.0},
    hospitalDefault: 'Công',
    // BHYT: benefitRate × routeFactor (routeFactor thấp dần Công→Tư→Quốc tế).
    bhyt: {benefitRate:0.8, routeFactor:{'Công':0.5, 'Tư':0.25, 'Quốc tế':0, _default:0.5}},
    bhytDefault: true,
    // Bảo hiểm hiện có còn dùng được (existingRemaining) theo câu trả lời.
    existingRemaining: {'Chưa':0, 'Có (cơ bản)':30000000, 'Có (đầy đủ)':80000000, _default:0},
    reserveDefault: 0
  },
  income: {
    icon:'💼', title:'Khoảng trống bảo vệ thu nhập',
    protectMonths:12, replaceRate:0.3,
    reserveByAnswer:{'<1 tháng':10000000, '1–3 tháng':40000000, '>3 tháng':90000000, _default:20000000}
  },
  family: {icon:'👨‍👩‍👧', title:'Khoảng trống bảo vệ gia đình', familyCost:150000000, existing:30000000},
  loan:   {icon:'🏦', title:'Khoảng trống bảo vệ khoản vay', familyCost:150000000, loanBalance:200000000, existing:30000000},
  motor:  {icon:'🚗', title:'Rủi ro tài sản xe',
    carValueByAnswer:{'<600tr':500000000, '600tr–1 tỷ':800000000, '>1 tỷ':1200000000, _default:800000000},
    existingCover:0}
};

// protectionGap(state) — tính khoảng trống bảo vệ TỪ input + config.
// Trả: {icon,title,personalized,scenarioLabel,assumptions[],breakdown[],gap,gapPct,disclaimer, rows,pct(compat)}
BANCA.protectionGap = function(state){
  state = state || {};
  const cfg = BANCA.PROTECTION_GAP_CONFIG;
  const dyn = state.dynAnswers || {};
  const need = state.primaryNeed;
  const R = n => Math.round(n||0);
  const pick = (map, k) => (map && (k in map)) ? map[k] : (map ? map._default : 0);
  const finish = (base) => {
    const gap = Math.max(0, base.gap);
    const denom = base.denom>0 ? base.denom : (base.breakdown[0] ? base.breakdown[0].amount : 0);
    const gapPct = denom>0 ? Math.min(100, R(gap/denom*100)) : 0;
    return {
      icon:base.icon, title:base.title,
      personalized:base.personalized,
      scenarioLabel: base.personalized ? cfg.personalizedLabel : cfg.illustrativeLabel,
      assumptions:base.assumptions, breakdown:base.breakdown,
      gap, gapPct, disclaimer:cfg.disclaimer,
      // ---- backward-compat cho financialGapByNeed cũ ----
      rows: base.breakdown.map(b=>[b.label, b.amount, b.tone]),
      pct: gapPct
    };
  };

  if(need==='HEALTH' || BANCA.NEED_COVERAGE && (BANCA.needCoverage(need).groups||[]).includes('HEALTH') && need!=='FAMILY_HEALTH'){
    const h = cfg.health;
    let personalized = true;
    const assumptions = [];
    const hospInput = dyn.hospital;               if(hospInput===undefined) personalized=false;
    const hosp = hospInput || h.hospitalDefault;
    const hFactor = pick(h.hospitalFactor, hosp);
    const estimatedTreatment = R(h.scenario.base * hFactor);
    assumptions.push({label:'Kịch bản điều trị', value:h.scenario.label+' · '+BANCA.vnd(h.scenario.base), provided:true});
    assumptions.push({label:'Ưu tiên bệnh viện', value:hosp+' (×'+hFactor+')', provided:hospInput!==undefined});
    const bhytInput = dyn.bhyt;                    if(bhytInput===undefined) personalized=false;
    const hasBhyt = bhytInput!==undefined ? bhytInput==='Có' : h.bhytDefault;
    const routeFactor = pick(h.bhyt.routeFactor, hosp);
    const bhytContribution = hasBhyt ? R(estimatedTreatment * h.bhyt.benefitRate * routeFactor) : 0;
    assumptions.push({label:'BHYT', value: hasBhyt ? ('Có · chi trả ~'+R(h.bhyt.benefitRate*routeFactor*100)+'% ('+hosp+')') : 'Không', provided:bhytInput!==undefined});
    const exInput = dyn.insured_before;            if(exInput===undefined) personalized=false;
    const existingRemaining = pick(h.existingRemaining, exInput);
    const existingContribution = Math.min(existingRemaining, Math.max(0, estimatedTreatment - bhytContribution));
    assumptions.push({label:'Bảo hiểm hiện có', value:(exInput||'Chưa xác định')+' · còn dùng '+BANCA.vnd(existingRemaining), provided:exInput!==undefined});
    const reserve = h.reserveDefault;
    if(reserve) assumptions.push({label:'Quỹ dự phòng dùng cho y tế', value:BANCA.vnd(reserve), provided:false});
    const gap = estimatedTreatment - bhytContribution - existingContribution - reserve;
    const breakdown = [
      {label:'Chi phí điều trị ước tính', amount:estimatedTreatment, tone:'ink', op:''},
      {label:'BHYT chi trả', amount:bhytContribution, tone:'teal', op:'−'},
      {label:'Bảo hiểm hiện có', amount:existingContribution, tone:'teal', op:'−'}
    ];
    if(reserve) breakdown.push({label:'Quỹ dự phòng', amount:reserve, tone:'teal', op:'−'});
    breakdown.push({label:'Khoảng trống', amount:Math.max(0,gap), tone:'red', op:'='});
    return finish({icon:h.icon, title:h.title, personalized, assumptions, breakdown, gap, denom:estimatedTreatment});
  }

  if(need==='INCOME'){
    const c = cfg.income;
    const income = pick(cfg.incomeByBand, state.budgetBand);
    const annualNeed = income * c.protectMonths * c.replaceRate;
    const reserveInput = dyn.reserve;
    const personalized = state.budgetBand!=null && reserveInput!==undefined;
    const reserve = pick(c.reserveByAnswer, reserveInput);
    const gap = annualNeed - reserve;
    const assumptions = [
      {label:'Thu nhập/tháng (theo ngân sách)', value:BANCA.vnd(income), provided:state.budgetBand!=null},
      {label:'Thời gian cần bù đắp', value:c.protectMonths+' tháng × '+R(c.replaceRate*100)+'% thu nhập', provided:true},
      {label:'Quỹ dự phòng hiện có', value:(reserveInput||'Chưa xác định')+' · '+BANCA.vnd(reserve), provided:reserveInput!==undefined}
    ];
    const breakdown = [
      {label:'Thu nhập cần bảo vệ', amount:R(annualNeed), tone:'ink', op:''},
      {label:'Quỹ dự phòng', amount:reserve, tone:'teal', op:'−'},
      {label:'Khoảng trống', amount:Math.max(0,R(gap)), tone:'red', op:'='}
    ];
    return finish({icon:c.icon, title:c.title, personalized, assumptions, breakdown, gap, denom:annualNeed});
  }

  if(need==='FAMILY_HEALTH' || need==='LOAN' || need==='HOME'){
    const isLoan = need==='LOAN';
    const c = isLoan ? cfg.loan : cfg.family;
    const loan = isLoan ? c.loanBalance : 0;
    const total = c.familyCost + loan;
    const gap = total - c.existing;
    const assumptions = [
      {label:'Chi phí bảo vệ gia đình', value:BANCA.vnd(c.familyCost), provided:false},
      isLoan ? {label:'Dư nợ khoản vay', value:BANCA.vnd(loan), provided:false} : null,
      {label:'Bảo vệ hiện có', value:BANCA.vnd(c.existing), provided:false}
    ].filter(Boolean);
    const breakdown = [
      {label:'Chi phí gia đình/năm', amount:c.familyCost, tone:'ink', op:''},
      isLoan ? {label:'Dư nợ khoản vay', amount:loan, tone:'amber', op:'+'} : null,
      {label:'Bảo vệ hiện có', amount:c.existing, tone:'teal', op:'−'},
      {label:'Khoảng trống', amount:Math.max(0,gap), tone:'red', op:'='}
    ].filter(Boolean);
    return finish({icon:c.icon, title:c.title, personalized:false, assumptions, breakdown, gap, denom:total});
  }

  if(need==='MOTOR'){
    const c = cfg.motor;
    const carInput = dyn.car_value;
    const carVal = pick(c.carValueByAnswer, carInput);
    const gap = carVal - c.existingCover;
    const assumptions = [
      {label:'Giá trị xe ước tính', value:(carInput||'Chưa xác định')+' · '+BANCA.vnd(carVal), provided:carInput!==undefined},
      {label:'Đang được bảo vệ', value:BANCA.vnd(c.existingCover), provided:false}
    ];
    const breakdown = [
      {label:'Giá trị xe', amount:carVal, tone:'ink', op:''},
      {label:'Đang được bảo vệ', amount:c.existingCover, tone:'teal', op:'−'},
      {label:'Cần bảo vệ', amount:Math.max(0,gap), tone:'red', op:'='}
    ];
    return finish({icon:c.icon, title:c.title, personalized:carInput!==undefined, assumptions, breakdown, gap, denom:carVal});
  }

  // Nhu cầu chưa có mô hình gap riêng → fallback health illustrative.
  return BANCA.protectionGap(Object.assign({}, state, {primaryNeed:'HEALTH'}));
};

// Backward-compat: giữ chữ ký cũ {icon,title,rows,gap,pct} cho nơi còn gọi.
BANCA.financialGapByNeed = function(state){
  const g = BANCA.protectionGap(state);
  return {icon:g.icon, title:g.title, rows:g.rows, gap:g.gap, pct:g.gapPct};
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

// ============================================================
// §B — GỢI Ý NHIỀU NHU CẦU / NHIỀU SẢN PHẨM.
// Trọng số & điểm số đọc từ RECOMMENDATION_CONFIG (không hard-code).
// Loại sản phẩm KHÔNG đủ eligibility TRƯỚC khi chấm điểm.
//  - 1 nhu cầu : tương thích hành vi cũ (một phương án).
//  - 2 nhu cầu : một sản phẩm hoặc bundle tối đa 2.
//  - >=3 nhu cầu: BUDGET_FIT (trong ngân sách) + FULLER_COVERAGE (đầy đủ hơn).
// ============================================================
BANCA.RECOMMENDATION_CONFIG = {
  version: BANCA.RECOMMENDATION_VERSION,
  weights: {primary:5, HIGH:3, MEDIUM:2, LOW:1, relatedConcernBonus:1},
  score:   {needCoverage:0.6, budgetFit:0.2, eligibility:0.1, simplicity:0.1},
  budgetMax: {UNDER_500K:500000,'500K_1M':1000000,'1M_2M':2000000,OVER_2M:9000000,_default:9000000},
  maxBundle: 3,
  // mối lo ngại → nhu cầu liên quan (dùng cho related concern bonus)
  concernToNeed: {TREATMENT_COST:'HEALTH', INCOME_LOSS:'INCOME', LOAN:'LOAN', DEPENDENTS:'FAMILY_HEALTH', CHILDREN:'FAMILY_HEALTH'},
  planTypes: {
    BUDGET_FIT:      {label:'Trong ngân sách',   desc:'Ưu tiên chi phí thấp, tập trung nhu cầu quan trọng nhất.'},
    FULLER_COVERAGE: {label:'Bảo vệ đầy đủ hơn', desc:'Thêm sản phẩm bổ trợ để phủ nhiều nhu cầu hơn.'},
    SINGLE:          {label:'Phương án đề xuất',  desc:'Một sản phẩm phù hợp nhu cầu chính.'}
  }
};
// Nhóm sản phẩm của một offer (để biết offer phủ nhu cầu nào).
BANCA.PRODUCT_GROUP = {health:'HEALTH', motor:'MOTOR', pa:'ACCIDENT'};

// Chuẩn hóa phí/tháng minh họa về số VND (xử lý 'K' và 'triệu'/'tỷ').
BANCA.advMonthlyVnd = function(str){
  const s = String(str==null?'':str);
  const m = s.match(/([0-9]+(?:[.,][0-9]+)?)/);
  if(!m) return 0;
  const num = parseFloat(m[1].replace(',','.'));
  if(/tỷ/i.test(s)) return Math.round(num*1e9);
  if(/tri[ệe]u|\btr\b/i.test(s)) return Math.round(num*1e6);
  if(/k/i.test(s)) return Math.round(num*1000);
  return Math.round(num);
};

// Trọng số từng nhu cầu: primary=5, còn lại theo mức ưu tiên, +bonus nếu khớp mối lo ngại.
BANCA.advNeedWeights = function(state){
  const cfg = BANCA.RECOMMENDATION_CONFIG;
  const profile = state.needProfile || [];
  const concerns = state.concerns || [];
  const related = new Set(concerns.map(c=>cfg.concernToNeed[c]).filter(Boolean));
  return profile.map(function(n){
    const nid = n.needId;
    let w = (state.primaryNeed===nid) ? cfg.weights.primary
          : (cfg.weights[(state.priorities&&state.priorities[nid])||n.weight||'MEDIUM'] || cfg.weights.MEDIUM);
    if(related.has(nid)) w += cfg.weights.relatedConcernBonus;
    return {needId:nid, weight:w, served:BANCA.needCoverage(nid).served};
  }).sort((a,b)=>b.weight-a.weight);
};

// Offer đủ điều kiện bán cho một nhu cầu (LỌC eligibility TRƯỚC scoring).
BANCA.advEligibleOffers = function(need, me){
  return (BANCA.adviceOffersFor(need)||[]).filter(function(o){
    if(!BANCA.readinessFor) return true;
    const rd = BANCA.readinessFor(o.productRef, me);
    return rd.ready || rd.canQuote;
  });
};

// Một nhu cầu được phủ bởi tập offer nếu có offer thuộc nhóm phục vụ nhu cầu đó.
BANCA._needCoveredBy = function(need, offers){
  const groups = BANCA.needCoverage(need).groups || [];
  return (offers||[]).some(o=>groups.includes(BANCA.PRODUCT_GROUP[o.productRef]));
};

// Dựng một plan từ danh sách offer + tập nhu cầu yêu cầu (kèm trọng số).
BANCA._buildPlan = function(id, offers, weighted, state){
  const cfg = BANCA.RECOMMENDATION_CONFIG;
  offers = (offers||[]).filter(Boolean);
  const pt = cfg.planTypes[id] || cfg.planTypes.SINGLE;
  const requested = weighted.map(w=>w.needId);
  const covered = requested.filter(n=>BANCA._needCoveredBy(n, offers));
  const gaps    = requested.filter(n=>covered.indexOf(n)<0);
  const totalMonthly = offers.reduce((s,o)=>s+BANCA.advMonthlyVnd(o.premiumMonthly),0);
  const budget = (cfg.budgetMax[state.budgetBand]!=null) ? cfg.budgetMax[state.budgetBand] : cfg.budgetMax._default;
  const within = totalMonthly<=budget;
  // ---- score ----
  const totW = weighted.reduce((s,w)=>s+w.weight,0) || 1;
  const covW = weighted.filter(w=>covered.indexOf(w.needId)>=0).reduce((s,w)=>s+w.weight,0);
  const nc = covW/totW;
  const bf = within ? 1 : Math.max(0, 1-(totalMonthly-budget)/(budget||1));
  const el = 1; // offer đã lọc eligibility trước
  const sp = 1/Math.max(1, offers.length);
  const s = cfg.score;
  const score = Math.round(100*(nc*s.needCoverage + bf*s.budgetFit + el*s.eligibility + sp*s.simplicity));
  const verify = Array.from(new Set(offers.reduce((a,o)=>a.concat(o.verify||[]),[])));
  const why = (id==='BUDGET_FIT'
      ? 'Tập trung nhu cầu quan trọng nhất với chi phí thấp'+(within?', trong ngân sách':', gần ngân sách')+'.'
      : id==='FULLER_COVERAGE'
      ? 'Phủ '+covered.length+'/'+requested.length+' nhu cầu bằng '+offers.length+' sản phẩm — bảo vệ rộng hơn.'
      : 'Phù hợp nhu cầu chính với '+offers.length+' sản phẩm.');
  return {
    id, type:id, label:pt.label, desc:pt.desc,
    primaryOffer: offers[0]||null, addOns: offers.slice(1), offers,
    totalMonthly, totalMonthlyLabel: BANCA.vnd(totalMonthly)+'/tháng',
    coveredNeeds: covered, remainingGaps: gaps,
    within, score, why, verify
  };
};

// recommendPlans(state) → {plans[], requested[], budget, needCount, eligibleServedCount}
BANCA.recommendPlans = function(state){
  state = state || {};
  const cfg = BANCA.RECOMMENDATION_CONFIG;
  const me = (BANCA.current && BANCA.current()) || state.createdBy;
  const weighted = BANCA.advNeedWeights(state);
  const requested = weighted.map(w=>w.needId);
  const needCount = requested.length;
  const budget = (cfg.budgetMax[state.budgetBand]!=null) ? cfg.budgetMax[state.budgetBand] : cfg.budgetMax._default;
  const servedWeighted = weighted.filter(w=>w.served && BANCA.advEligibleOffers(w.needId, me).length>0);
  const out = {plans:[], requested, budget, needCount, eligibleServedCount:servedWeighted.length};
  if(!servedWeighted.length) return out;

  const cheapest = need => BANCA.advEligibleOffers(need, me).slice().sort((a,b)=>BANCA.advMonthlyVnd(a.premiumMonthly)-BANCA.advMonthlyVnd(b.premiumMonthly));
  const richest  = need => BANCA.advEligibleOffers(need, me).slice().sort((a,b)=>(b.fit||0)-(a.fit||0));
  const topNeed  = servedWeighted[0].needId;

  // BUDGET_FIT: một sản phẩm — rẻ nhất cho nhu cầu quan trọng nhất, ưu tiên trong ngân sách.
  const topCheap = cheapest(topNeed);
  const budgetOffer = topCheap.find(o=>BANCA.advMonthlyVnd(o.premiumMonthly)<=budget) || topCheap[0];
  const budgetPlan = BANCA._buildPlan('BUDGET_FIT', [budgetOffer], weighted, state);

  // FULLER_COVERAGE: bundle — gói fit cao cho nhu cầu chính + thêm sản phẩm cho nhu cầu chưa phủ.
  const cap = (needCount>=3) ? cfg.maxBundle : 2;
  const bundle = [];
  const usedGroups = new Set();
  const pushOffer = o => { if(o){ const g=BANCA.PRODUCT_GROUP[o.productRef]; if(!usedGroups.has(g)){ bundle.push(o); usedGroups.add(g); } } };
  pushOffer(richest(topNeed)[0]);
  for(const w of servedWeighted){
    if(bundle.length>=cap) break;
    if(w.needId===topNeed) continue;
    if(BANCA._needCoveredBy(w.needId, bundle)) continue;
    pushOffer(richest(w.needId)[0]);
  }
  const fullerPlan = BANCA._buildPlan('FULLER_COVERAGE', bundle, weighted, state);

  if(needCount<=1){
    // Tương thích 1 nhu cầu: một phương án duy nhất.
    out.plans = [BANCA._buildPlan('SINGLE', [richest(topNeed)[0]], weighted, state)];
    return out;
  }
  const sameSet = a => a.offers.map(o=>o.productRef+':'+o.packageRef).sort().join('|');
  out.plans = [budgetPlan];
  if(sameSet(fullerPlan)!==sameSet(budgetPlan)) out.plans.push(fullerPlan);
  return out;
};
