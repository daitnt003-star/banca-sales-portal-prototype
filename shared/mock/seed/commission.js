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
BANCA.commissionRateFor = function(policy){
  const pkg=policy.package||'Standard';
  const r=(BANCA.commissionRates||[]).find(x=>x.product===policy.productName && x.package===pkg && x.channel==='BANCA');
  return r || {rate:0, product:policy.productName, package:pkg, channel:'BANCA'};
};
BANCA.commissionOfPolicy = function(policy){
  const rt=BANCA.commissionRateFor(policy);
  const base=BANCA.netCommissionBase(policy);
  const amount=Math.round(base*rt.rate);
  const cancelled=policy.status==='CANCELLED';
  return {
    policyId:policy.id, appId:policy.appId, owner:policy.owner, customerId:policy.customerId,
    productName:policy.productName, package:policy.package, premium:policy.premium,
    base, rate:rt.rate, amount:cancelled?0:amount,
    state:cancelled?'CLAWED_BACK':'ACCRUED',
    stateLabel:cancelled?'Thu hồi':'Dự kiến',
    issueDate:policy.issueDate, syncAt:(BANCA.partnerConfig||{}).syncAt||'20/07/2026 11:30',
    clawback:cancelled? amount : 0
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
  const rows=BANCA.commissionRows(ownerOrScope).filter(x=>x.state==='ACCRUED');
  const amount=rows.reduce((s,x)=>s+x.amount,0);
  const base=rows.reduce((s,x)=>s+x.base,0);
  return {amount, base, count:rows.length, rows, syncAt:(BANCA.partnerConfig||{}).syncAt||'20/07/2026 11:30'};
};

// ============================================================
// §13.3 — HOA HỒNG TRỰC TIẾP vs THỨ CẤP (override) PHẢI TÁCH RIÊNG.
// Không được cộng thành một con số duy nhất. Portal chỉ ĐỌC, không cấu hình scheme.
//  · Trực tiếp  = hợp đồng do CHÍNH người đó bán.
//  · Thứ cấp    = % override trên hợp đồng của cấp dưới trong phạm vi quản lý.
// ============================================================
BANCA.overrideRates = { TEAM: 0.015, BRANCH: 0.008, REGION: 0.004 };

// Người này có quản lý owner kia không (theo managerScope).
BANCA._managesOwner = function(managerId, ownerId){
  if(managerId===ownerId) return false;
  const mgr=BANCA.personas[managerId]||{}, sp=BANCA.personas[ownerId]||{};
  if(!mgr.isManager) return false;
  if(mgr.managerScope==='TEAM')   return sp.team===mgr.team;
  if(mgr.managerScope==='BRANCH') return sp.branch===mgr.branch;
  if(mgr.managerScope==='REGION') return BANCA.regionOf && BANCA.regionOf(sp.branch)===BANCA.regionOf(mgr.branch);
  return false;
};

BANCA.commissionSplit = function(userId){
  const all=(BANCA.policies||[]).filter(p=>p.status!=='EXPIRED').map(BANCA.commissionOfPolicy)
    .filter(x=>x.state==='ACCRUED');
  const per=BANCA.personas[userId]||{};
  const rate=BANCA.overrideRates[per.managerScope]||0;

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
  const rate=BANCA.overrideRates[(BANCA.personas[managerId]||{}).managerScope]||0;
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
