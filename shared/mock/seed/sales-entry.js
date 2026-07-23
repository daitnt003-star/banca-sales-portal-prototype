// ============================================================
// Sales Entry Orchestrator helpers — recommendation, source badge, readiness.
// Recommendation LUÔN kèm lý do + nguồn; tách khỏi product selection.
// ============================================================
window.BANCA = window.BANCA || {};

// Source badge theo nguồn dữ liệu
BANCA.SOURCE_BADGE = {
  BANK:     {label:'Bank',     bg:'var(--brand-100)',  fg:'var(--brand-700)'},
  CRM:      {label:'Bank CRM', bg:'var(--brand-100)',  fg:'var(--brand-700)'},
  REFERRAL: {label:'Referral', bg:'var(--purple-100)', fg:'var(--purple-600)'},
  ADVICE:   {label:'Tư vấn',   bg:'var(--purple-100)', fg:'var(--purple-600)'},
  PORTAL:   {label:'Portal',   bg:'#eef0f4',           fg:'var(--ink-500)'},
  RENEWAL:  {label:'Tái tục',  bg:'var(--amber-100)',  fg:'var(--amber-600)'},
  CAMPAIGN: {label:'Campaign', bg:'var(--teal-100)',   fg:'var(--teal-600)'},
  RULE:     {label:'Rule',     bg:'#eef0f4',           fg:'var(--ink-500)'}
};
BANCA.sourceBadge = function(kind){
  const b = BANCA.SOURCE_BADGE[kind] || BANCA.SOURCE_BADGE.PORTAL;
  return `<span class="chip" style="background:${b.bg};color:${b.fg};">${b.label}</span>`;
};

// Seller readiness cho 1 product theo persona hiện tại
BANCA.readinessFor = function(productId, me){
  me = me || BANCA.current();
  const p = (BANCA.products||[]).find(x=>x.id===productId);
  if(!p) return {ready:false, state:'N/A', caps:[], reason:'Sản phẩm không khả dụng.'};
  const st = (p.state||{})[me];
  const caps = (p.caps||{})[st] || [];
  const ready = st==='READY';
  return {ready, state:st||'N/A', caps, reason:(p.reason&&p.reason[me])||'', canQuote:caps.includes('can_quote')||caps.includes('can_advise')};
};

// Recommendation từ context khách hàng (rule-based, kèm lý do + nguồn)
BANCA.recommendForCustomer = function(cust){
  if(!cust) return null;
  const loan = cust.loanRef||'';
  // Vay mua ô tô → Motor
  if(/ô ?tô|oto|xe/i.test(loan)){
    const m = loan.match(/([\d.]+)\s*tr/);
    const val = m ? m[1]+' triệu' : 'giá trị xe theo khoản vay';
    return {productId:'motor', source:'CRM',
      reason:`Khách vừa có khoản vay mua ô tô (${loan}). Motor Comprehensive đang được phân phối cho kênh hiện tại và bạn được phép báo giá.`};
  }
  // Có bảo hiểm Motor sắp hết hạn → Motor (tái tục/mới)
  const exp = (cust.existingInsurance||[]).find(x=>/Motor/i.test(x)&&/hết hạn/i.test(x));
  if(exp) return {productId:'motor', source:'RULE', reason:`Khách có ${exp} — nên tư vấn gia hạn/thay thế bảo hiểm xe.`};
  // Priority chưa có bảo hiểm sức khỏe → Health
  if(cust.segment==='Priority' && !(cust.existingInsurance||[]).some(x=>/Health|sức khỏe/i.test(x))){
    return {productId:'health', source:'RULE', reason:'Khách phân khúc Priority chưa có bảo hiểm sức khỏe — phù hợp Health Individual.'};
  }
  // Không đủ tín hiệu → không recommend (đề xuất Tư vấn nhanh)
  return null;
};
