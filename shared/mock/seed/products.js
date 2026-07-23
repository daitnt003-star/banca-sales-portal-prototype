window.BANCA = window.BANCA || {};
// OQ-04: CRM-01 removed. TL-01/BM-01 vẫn có quyền bán (manager dùng chung portal). RM-IN inactive → không thấy sản phẩm.
BANCA.products = [
  {id:'motor',name:'Motor Comprehensive',line:'Motor',branding:'Janus white-label',visible:['RM-01','RM-02','TS-01','TL-01','BM-01','SVC-ERR'],state:{'RM-01':'READY','RM-02':'CONDITIONAL','TS-01':'CONDITIONAL','TL-01':'READY','BM-01':'READY','SVC-ERR':'SERVICE_UNVERIFIED'},reason:{'RM-02':'License còn 12 ngày; bind cần Senior RM','TS-01':'Telesales được quote/gửi link, không bind/payment','SVC-ERR':'Readiness service chưa xác thực'},caps:{READY:['can_advise','can_quote','can_submit','can_bind','can_collect_payment'],CONDITIONAL:['can_advise','can_quote','can_submit'],SERVICE_UNVERIFIED:[]}},
  {id:'pa',name:'Personal Accident',line:'PA',branding:'ABC standard',visible:['RM-01','TS-01','TL-01'],state:{'RM-01':'READY','TS-01':'READY','TL-01':'READY'},reason:{},caps:{READY:['can_advise','can_quote','can_submit','can_bind']}},
  {id:'health',name:'Health Individual',line:'Health',branding:'Janus co-brand',visible:['RM-01','RM-02','TL-01','SVC-ERR'],state:{'RM-01':'READY','RM-02':'BLOCKED','TL-01':'READY','SVC-ERR':'SERVICE_UNVERIFIED'},reason:{'RM-02':'Thiếu mandatory health training','SVC-ERR':'Training/LMS service unavailable'},caps:{READY:['can_advise','can_quote','can_submit','can_bind'],BLOCKED:[],SERVICE_UNVERIFIED:[]}},
  {id:'travel',name:'Travel Plus Hidden',line:'Travel',branding:'ABC standard',visible:[],state:{},reason:{},caps:{}}
];
