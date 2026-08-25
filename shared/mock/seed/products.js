window.BANCA = window.BANCA || {};

/* =========================================================
 * HẠN MỨC THẨM QUYỀN CẤP ĐƠN  [CPCU 520 A4, tr.4.12–4.13]
 *
 * "specify in the underwriting guidelines the POLICY LIMITS at which the
 *  accounts must be submitted to a higher authority."
 *
 * Trước đây can_bind là BẬT/TẮT, còn điều kiện nâng cấp duyệt chỉ nằm trong
 * chuỗi text (reason['RM-02']='… bind cần Senior RM') — máy không đọc được.
 * Nay khai thành số để cổng thẩm định tự chuyển referral khi vượt.
 *
 * ⚠️ Con số dưới đây là GIẢ ĐỊNH DEMO, không phải hạn mức nghiệp vụ thật.
 * Hệ thật lấy từ Distribution Platform (Tầng 2) theo hợp đồng đại lý/TOBA.
 * ========================================================= */
BANCA.AUTHORITY_SOURCE = 'DEMO_ASSUMPTION';
BANCA.bindAuthorityDefaults = {
  READY:       {maxSumInsured: 2000000000, maxPremium: 60000000},
  CONDITIONAL: {maxSumInsured:  500000000, maxPremium: 15000000},
  BLOCKED:     {maxSumInsured: 0, maxPremium: 0},
  SERVICE_UNVERIFIED: {maxSumInsured: 0, maxPremium: 0}
};

// Hạn mức hiệu lực của 1 người bán trên 1 sản phẩm.
// Sản phẩm có thể ghi đè bằng p.bindAuthority[state].
BANCA.bindAuthorityFor = function(productId, me){
  me = me || (BANCA.current && BANCA.current());
  const p  = (BANCA.products||[]).find(x=>x.id===productId) || {};
  const st = (p.state||{})[me] || 'N/A';
  const base = BANCA.bindAuthorityDefaults[st] || {maxSumInsured:0, maxPremium:0};
  const over = (p.bindAuthority||{})[st] || {};
  return Object.assign({state:st, source:BANCA.AUTHORITY_SOURCE}, base, over);
};

// Vượt hạn mức thì KHÔNG chặn hẳn — chuyển cấp duyệt cao hơn (CPCU tr.4.12).
// Trả breaches dạng chữ để cổng nêu lý do, không chỉ disable (§15.3).
BANCA.checkBindAuthority = function(app, me){
  app = app || {};
  me = me || app.owner || (BANCA.current && BANCA.current());
  const lim = BANCA.bindAuthorityFor(app.productId, me);
  const breaches = [];
  const si = Number(app.sumInsured || (app.vehicle&&app.vehicle.value) || 0);
  const pr = Number(app.premium || (app.quote&&app.quote.totalPremium) || 0);
  if(lim.maxSumInsured && si > lim.maxSumInsured)
    breaches.push({code:'SI_OVER_AUTHORITY',
      msg:'Số tiền bảo hiểm '+BANCA.vnd(si)+' vượt hạn mức cấp đơn '+BANCA.vnd(lim.maxSumInsured)+' — chuyển cấp duyệt cao hơn'});
  if(lim.maxPremium && pr > lim.maxPremium)
    breaches.push({code:'PREMIUM_OVER_AUTHORITY',
      msg:'Phí '+BANCA.vnd(pr)+' vượt hạn mức cấp đơn '+BANCA.vnd(lim.maxPremium)+' — chuyển cấp duyệt cao hơn'});
  (lim.excludedClasses||[]).forEach(function(c){
    if(app.riskClass === c) breaches.push({code:'CLASS_EXCLUDED', msg:'Nhóm rủi ro '+c+' ngoài thẩm quyền cấp đơn — chuyển cấp duyệt cao hơn'});
  });
  return {within: breaches.length===0, mustRefer: breaches.length>0, limit: lim, breaches: breaches};
};
// OQ-04: CRM-01 removed. TL-01/BM-01 vẫn có quyền bán (manager dùng chung portal). RM-IN inactive → không thấy sản phẩm.
BANCA.products = [
  {id:'motor',name:'Bảo hiểm vật chất xe',line:'Motor',branding:'Janus white-label',visible:['RM-01','RM-02','TS-01','TL-01','BM-01','SVC-ERR'],state:{'RM-01':'READY','RM-02':'CONDITIONAL','TS-01':'CONDITIONAL','TL-01':'READY','BM-01':'READY','SVC-ERR':'SERVICE_UNVERIFIED'},reason:{'RM-02':'License còn 12 ngày; bind cần Senior RM','TS-01':'Telesales được quote/gửi link, không bind/payment','SVC-ERR':'Readiness service chưa xác thực'},caps:{READY:['can_advise','can_quote','can_submit','can_bind','can_collect_payment'],CONDITIONAL:['can_advise','can_quote','can_submit'],SERVICE_UNVERIFIED:[]}},
  {id:'pa',name:'Bảo hiểm tai nạn cá nhân',line:'PA',branding:'ABC standard',visible:['RM-01','TS-01','TL-01'],state:{'RM-01':'READY','TS-01':'READY','TL-01':'READY'},reason:{},caps:{READY:['can_advise','can_quote','can_submit','can_bind']}},
  {id:'health',name:'Bảo hiểm sức khỏe',line:'Health',branding:'Janus co-brand',visible:['RM-01','RM-02','TL-01','SVC-ERR'],state:{'RM-01':'READY','RM-02':'BLOCKED','TL-01':'READY','SVC-ERR':'SERVICE_UNVERIFIED'},reason:{'RM-02':'Thiếu mandatory health training','SVC-ERR':'Training/LMS service unavailable'},caps:{READY:['can_advise','can_quote','can_submit','can_bind'],BLOCKED:[],SERVICE_UNVERIFIED:[]}},
  {id:'travel',name:'Travel Plus Hidden',line:'Travel',branding:'ABC standard',visible:[],state:{},reason:{},caps:{}}
];
