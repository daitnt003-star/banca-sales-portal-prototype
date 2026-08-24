// Commission mock/config — derived from issued policies, read-only for nhân viên tư vấn/manager.
// Rule: accrued estimate for current calendar month, synced with KPI timestamp.
window.BANCA = window.BANCA || {};
BANCA.partnerConfig = BANCA.partnerConfig || {
  commissionModule:{enabled:true},
  kpiModule:{mode:'full'}, // full | readonly-summary | off
  syncAt:'20/07/2026 11:30'
};
BANCA.commissionRates = [
  {product:'Bảo hiểm vật chất xe', package:'Basic', channel:'BANCA', rate:0.08, validFrom:'2026-01-01', validTo:'2026-12-31'},
  {product:'Bảo hiểm vật chất xe', package:'Standard', channel:'BANCA', rate:0.10, validFrom:'2026-01-01', validTo:'2026-12-31'},
  {product:'Bảo hiểm vật chất xe', package:'Premium', channel:'BANCA', rate:0.12, validFrom:'2026-01-01', validTo:'2026-12-31'},
  {product:'Motor TNDS', package:'TNDS bắt buộc', channel:'BANCA', rate:0.02, validFrom:'2026-01-01', validTo:'2026-12-31'}
];
BANCA.commissionVisible = function(layer){
  const cfg=BANCA.partnerConfig||{}, mode=(cfg.kpiModule||{}).mode||'full';
  if(!((cfg.commissionModule||{}).enabled)) return false;
  if(mode==='off') return false;
  if(mode==='readonly-summary') return layer==='policy';
  return true;
};
BANCA.netCommissionBase = function(policy){
  // Prototype assumption: premium includes VAT for OD component; use transparent 90.9% base to avoid hard-coding in rating engine.
  // Real system must use Core fee waterfall output and exclude VAT/collection pass-throughs.
  return Math.round((policy.premium||0) / 1.10);
};
// ============================================================
// Tra biểu hoa hồng — ĐỦ 4 CHIỀU: sản phẩm × gói × KÊNH × NGÀY HIỆU LỰC.
// Trước đây lọc cứng x.channel==='BANCA' nên trường `channel` trong biểu là
// trường chết: thêm dòng cho kênh đại lý cũng không bao giờ được chọn, và
// fallback trả rate:0 nên sai tiền mà không ai biết. Nay:
//   · không tìm thấy biểu  → found:false + reason (KHÔNG im lặng trả 0)
//   · biểu hết hiệu lực    → found:false + reason
// Cùng nguyên tắc §15.3 đã dùng cho thanh toán: lý do phải PHÁT RA THÀNH CHỮ.
// ============================================================

// Kênh ghi trên biểu phí ≠ id ChannelProfile ≠ nhãn kênh trên snapshot phân phối.
// Bảng quy đổi để cả ba nói cùng một thứ tiếng. Thêm kênh mới thì sửa Ở ĐÂY.
BANCA.COMMISSION_CHANNEL_OF = {
  BANCA_INTEGRATED: 'BANCA',
  BANCA_STANDALONE: 'BANCA',
  AGENT_BROKER:     'AGENT_BROKER',   // tên kênh cũ, giữ để cấu hình cũ không vỡ
  AGENT:            'AGENT',
  BROKER:           'BROKER',
  Bancassurance:    'BANCA',
  Telesales:        'BANCA'
};

// Kênh dùng để tính hoa hồng của MỘT hợp đồng.
// Ưu tiên snapshot phân phối tại thời điểm phát hành — hoa hồng ăn theo hợp đồng
// đại lý lúc BÁN, không theo kênh đang mở màn hình. Chỉ khi chưa có snapshot
// (ước tính trước phát hành) mới lấy kênh phiên hiện hành.
BANCA.commissionChannelOf = function(policy){
  policy = policy || {};
  let raw = null;
  if (BANCA.policyDistributionOf) {
    const dist = BANCA.policyDistributionOf(policy.id, policy.owner);
    if (dist && !dist._fallback) raw = dist.channel;
  }
  if (!raw) raw = BANCA.channel ? BANCA.channel() : 'BANCA_INTEGRATED';
  return BANCA.COMMISSION_CHANNEL_OF[raw] || raw;
};

BANCA._todayISO = function(){ return new Date().toISOString().slice(0,10); };

// opts.asOf: 'YYYY-MM-DD' — cho phép tra biểu tại một ngày cụ thể (test/đối soát).
BANCA.commissionRateFor = function(policy, opts){
  opts = opts || {};
  const pkg  = policy.package || 'Standard';
  const chan = opts.channel || BANCA.commissionChannelOf(policy);
  const asOf = opts.asOf || BANCA._todayISO();
  const all  = BANCA.commissionRates || [];

  const sameLine = all.filter(x => x.product === policy.productName && x.package === pkg);
  const sameChan = sameLine.filter(x => x.channel === chan);
  // Ngày dạng YYYY-MM-DD nên so chuỗi là đủ, không cần parse Date.
  const hit = sameChan.find(x => (!x.validFrom || x.validFrom <= asOf) && (!x.validTo || asOf <= x.validTo));

  if (hit) return Object.assign({}, hit, { found:true, channel:chan, asOf });

  let reason;
  if (!sameLine.length)      reason = `Chưa cấu hình biểu hoa hồng cho ${policy.productName||'sản phẩm này'} · gói ${pkg}`;
  else if (!sameChan.length) reason = `Chưa cấu hình biểu hoa hồng cho kênh ${chan}`;
  else                       reason = `Biểu hoa hồng kênh ${chan} không còn hiệu lực tại ngày ${asOf}`;
  return { found:false, reason, rate:null, product:policy.productName, package:pkg, channel:chan, asOf };
};

BANCA.commissionOfPolicy = function(policy, opts){
  const rt   = BANCA.commissionRateFor(policy, opts);
  const base = BANCA.netCommissionBase(policy);
  const cancelled = policy.status === 'CANCELLED';
  // Không tìm thấy biểu → amount = null (KHÔNG phải 0). Phân biệt được
  // "hoa hồng bằng không" với "chưa biết hoa hồng bao nhiêu".
  const amount = rt.found ? Math.round(base * rt.rate) : null;
  return {
    policyId:policy.id, appId:policy.appId, owner:policy.owner, customerId:policy.customerId,
    productName:policy.productName, package:policy.package, premium:policy.premium,
    base, rate:rt.rate, amount: rt.found ? (cancelled ? 0 : amount) : null,
    noRate: !rt.found, noRateReason: rt.found ? null : rt.reason, channel: rt.channel,
    state: !rt.found ? 'NO_RATE' : (cancelled ? 'CLAWED_BACK' : 'ACCRUED'),
    stateLabel: !rt.found ? 'Chưa có biểu' : (cancelled ? 'Thu hồi' : 'Dự kiến'),
    issueDate:policy.issueDate, syncAt:(BANCA.partnerConfig||{}).syncAt||'20/07/2026 11:30',
    clawback: (rt.found && cancelled) ? Math.round(base * rt.rate) : 0
  };
};
BANCA.commissionRows = function(ownerOrScope){
  let rows=(BANCA.policies||[]).filter(p=>p.status!=='EXPIRED').map(BANCA.commissionOfPolicy);
  if(!ownerOrScope) return rows;
  const per=BANCA.personas[ownerOrScope];
  if(!per || !per.isManager) return rows.filter(x=>x.owner===ownerOrScope);
  return rows.filter(x=>{
    const sp=BANCA.personas[x.owner]||{};
    return (per.managerScope==='TEAM' && sp.team===per.team) || (per.managerScope==='BRANCH' && sp.branch===per.branch) || x.owner===ownerOrScope;
  });
};
BANCA.commissionSummary = function(ownerOrScope){
  const all=BANCA.commissionRows(ownerOrScope);
  const rows=all.filter(x=>x.state==='ACCRUED');
  const amount=rows.reduce((s,x)=>s+x.amount,0);
  const base=rows.reduce((s,x)=>s+x.base,0);
  // Hợp đồng chưa có biểu KHÔNG được cộng 0 vào tổng — cộng vào là báo thiếu tiền
  // mà nhìn không ra. Đếm riêng để UI nói được "còn n hợp đồng chưa có biểu".
  const noRate=all.filter(x=>x.state==='NO_RATE');
  return {amount, base, count:rows.length, rows,
    noRateCount:noRate.length, noRateRows:noRate,
    noRateReason:(noRate[0]||{}).noRateReason||null,
    syncAt:(BANCA.partnerConfig||{}).syncAt||'20/07/2026 11:30'};
};

// ============================================================
// §13.3 — HOA HỒNG TRỰC TIẾP vs THỨ CẤP (override) PHẢI TÁCH RIÊNG.
// Không được cộng thành một con số duy nhất. Portal chỉ ĐỌC, không cấu hình scheme.
//  · Trực tiếp  = hợp đồng do CHÍNH người đó bán.
//  · Thứ cấp    = % override trên hợp đồng của cấp dưới trong phạm vi quản lý.
// ============================================================
// ORG_SUBTREE = quản lý theo cây tổ chức; với Giám đốc chi nhánh tương đương cấp
// chi nhánh nên dùng chung tỷ lệ BRANCH (thiếu dòng này thì hoa hồng thứ cấp = 0).
BANCA.overrideRates = { TEAM: 0.015, BRANCH: 0.008, ORG_SUBTREE: 0.008, REGION: 0.004 };

// Người này có quản lý owner kia không (theo managerScope).
// Phạm vi quản lý lấy từ HỒ SƠ TÀI KHOẢN (nguồn chuẩn), không từ cờ isManager rời —
// nếu 2 chỗ dùng 2 nguồn thì người thấy mục Đội nhóm lại không được tính hoa hồng thứ cấp.
BANCA._managerScopeOf = function(id){
  if(BANCA.managerCapability) return BANCA.managerCapability(id).scope;
  return (BANCA.personas[id]||{}).managerScope || null;   // fallback khi chạy thiếu profile
};
BANCA._managesOwner = function(managerId, ownerId){
  if(managerId===ownerId) return false;
  const mgr=BANCA.personas[managerId]||{}, sp=BANCA.personas[ownerId]||{};
  const scope = BANCA._managerScopeOf(managerId);
  if(!scope) return false;
  if(scope==='TEAM')   return !!mgr.team && sp.team===mgr.team;
  if(scope==='BRANCH' || scope==='ORG_SUBTREE') return !!mgr.branch && sp.branch===mgr.branch;
  if(scope==='REGION') return BANCA.regionOf && BANCA.regionOf(sp.branch)===BANCA.regionOf(mgr.branch);
  return false;
};

BANCA.commissionSplit = function(userId){
  const all=(BANCA.policies||[]).filter(p=>p.status!=='EXPIRED').map(BANCA.commissionOfPolicy)
    .filter(x=>x.state==='ACCRUED');
  const rate=BANCA.overrideRates[BANCA._managerScopeOf(userId)]||0;

  const directRows = all.filter(x=>x.owner===userId);
  const overrideRows = all.filter(x=>BANCA._managesOwner(userId,x.owner)).map(x=>Object.assign({},x,{
    overrideRate: rate,
    overrideAmount: Math.round(x.base*rate),
    sellerName: (BANCA.personas[x.owner]||{}).name||x.owner
  }));

  return {
    direct:   {amount: directRows.reduce((s,x)=>s+x.amount,0), count: directRows.length, rows: directRows},
    override: {amount: overrideRows.reduce((s,x)=>s+x.overrideAmount,0), count: overrideRows.length, rows: overrideRows, rate: rate},
    syncAt: (BANCA.partnerConfig||{}).syncAt||'20/07/2026 11:30'
  };
};

// Hoa hồng trực tiếp của 1 nhân viên (dùng cho bảng thành viên §13.2).
BANCA.directCommissionOf = function(sellerId){
  return (BANCA.policies||[]).filter(p=>p.status!=='EXPIRED' && p.owner===sellerId)
    .map(BANCA.commissionOfPolicy).filter(x=>x.state==='ACCRUED')
    .reduce((s,x)=>s+x.amount,0);
};
// Hoa hồng thứ cấp mà 1 quản lý nhận được TỪ nhân viên cụ thể.
BANCA.overrideCommissionFrom = function(managerId, sellerId){
  if(!BANCA._managesOwner(managerId, sellerId)) return 0;
  const rate=BANCA.overrideRates[BANCA._managerScopeOf(managerId)]||0;
  return (BANCA.policies||[]).filter(p=>p.status!=='EXPIRED' && p.owner===sellerId)
    .map(BANCA.commissionOfPolicy).filter(x=>x.state==='ACCRUED')
    .reduce((s,x)=>s+Math.round(x.base*rate),0);
};

// KPI: giữ .commission (tương thích ngược) NHƯNG chỉ là hoa hồng TRỰC TIẾP,
// và bổ sung .commissionOverride tách bạch — không gộp 2 loại vào 1 số (§13.3).
Object.keys(BANCA.kpi||{}).forEach(id=>{
  const sp=BANCA.commissionSplit(id);
  BANCA.kpi[id].commission = sp.direct.amount;
  BANCA.kpi[id].commissionOverride = sp.override.amount;
});
