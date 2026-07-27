window.BANCA = window.BANCA || {};
/* ============================================================================
 * HANDOFF & PARTICIPANT MODEL (2026-07-22)
 * Luồng: Tư vấn → xác định KHÁCH HÀNG (trước nhân viên tư vấn) → participants → phân công
 *        (Direct/Team Queue/Auto) → nhân viên tư vấn tiếp nhận → Sales Session/HSYCBH.
 * Participant là VAI TRÒ THAM GIA trên từng giao dịch, KHÔNG phải role đăng nhập.
 * Referrer/Advisor/SellingProducer/CaseOwner lưu ĐỘC LẬP, không ghi đè khi chuyển giao.
 * ==========================================================================*/
BANCA.PARTICIPATION_ROLE = ['REFERRER','ADVISOR','SELLING_PRODUCER','CASE_OWNER','SERVICING_SELLER','ASSIGNMENT_ACTOR','SUPPORTER'];
BANCA.HANDOFF_TYPE = { SALES_HANDOFF:'Tạo bản chào từ tư vấn này', CASE_REASSIGNMENT:'Chuyển phụ trách', DELEGATION:'Công việc hỗ trợ' };
BANCA.HANDOFF_STATES = ['DRAFT','PENDING_ASSIGNMENT','ASSIGNED','PENDING_ACCEPTANCE','ACCEPTED','NEED_MORE_INFORMATION','DECLINED','EXPIRED','CANCELLED','UNASSIGNED_EXCEPTION'];
BANCA.ROUTING_MODE = ['DIRECT_SELLER','TEAM_QUEUE','AUTO_ROUTE'];
BANCA.DECLINE_REASONS = ['Không đúng portfolio','Không đủ readiness','Sai sản phẩm','Sai chi nhánh/team','Quá tải','Trùng cơ hội','Không liên hệ được khách','Thiếu thông tin'];
// Thứ tự xác định người giới thiệu (cấu hình theo partner, không hard-code).
BANCA.referrerResolution = ['BANK_REFERRER','LEAD_OWNER','CURRENT_ADVISOR','SELLING_PRODUCER'];

BANCA.handoffTypeLabel = t => BANCA.HANDOFF_TYPE[t] || t;
BANCA.handoffStateLabel = s => ({DRAFT:'Nháp',PENDING_ASSIGNMENT:'Chờ phân công',ASSIGNED:'Đã phân công',PENDING_ACCEPTANCE:'Chờ tiếp nhận',ACCEPTED:'Đã tiếp nhận',NEED_MORE_INFORMATION:'Cần bổ sung',DECLINED:'Đã từ chối',EXPIRED:'Quá hạn',CANCELLED:'Đã huỷ',UNASSIGNED_EXCEPTION:'Chưa phân bổ được'}[s]||s);

// ----- Seed handoff demo -----
function _p(role,userId,isPrimary,extra){ return Object.assign({participationRole:role,userId,isPrimary:!!isPrimary,status:'ACTIVE',effectiveFrom:'2026-07-22T09:00:00',effectiveTo:null},extra||{}); }
BANCA.handoffs = [
  { id:'HO-2026-001', type:'SALES_HANDOFF', state:'PENDING_ACCEPTANCE', routingMode:'DIRECT_SELLER',
    customerId:'CUS-001', customerName:'Lê Hoàng Nam', cif:'JB0012345', productRef:'health', productName:'Bảo hiểm sức khỏe', packageName:'Standard',
    source:'BANK_CRM', sourceSystem:'JANUS_CRM', leadRef:'LD-2091', campaign:'Priority Health Q3', adviceId:'ADV-2026-982',
    recommendationReason:'Khách Priority chưa có bảo hiểm sức khỏe; ngân sách phù hợp gói Standard.', needSummary:'Bảo vệ chi phí điều trị nội trú', budget:'500K–1M/tháng', consent:'VALID',
    priority:'HIGH', targetSeller:'RM-01', targetTeam:'TEAM-A', createdAt:'2026-07-22 09:15', acceptBy:'2026-07-22 16:00',
    participants:[_p('REFERRER','TS-01',true,{source:'BANK_LEAD'}), _p('ADVISOR','TS-01',true), _p('ASSIGNMENT_ACTOR','TS-01',true)],
    completeness:70 },
  { id:'HO-2026-002', type:'SALES_HANDOFF', state:'PENDING_ASSIGNMENT', routingMode:'TEAM_QUEUE',
    customerId:'CUS-004', customerName:'Phan Thị Hồng', cif:null, productRef:'motor', productName:'Bảo hiểm vật chất xe', packageName:'Comprehensive',
    source:'REFERRAL', sourceSystem:'PORTAL', leadRef:'REF-2026-017', campaign:'Motor renewal', adviceId:null,
    recommendationReason:'Xe mua qua khoản vay ngân hàng, cần bảo hiểm vật chất.', needSummary:'Bảo vệ xe ô tô', budget:'8–13 triệu/năm', consent:'VALID',
    priority:'MEDIUM', targetSeller:null, targetTeam:'TEAM-A', createdAt:'2026-07-22 10:05', acceptBy:'2026-07-22 17:00',
    participants:[_p('REFERRER','RM-02',true,{source:'BANK_LEAD'}), _p('ADVISOR','RM-02',true)],
    completeness:45 },
  { id:'HO-2026-003', type:'CASE_REASSIGNMENT', state:'PENDING_ACCEPTANCE', routingMode:'DIRECT_SELLER',
    customerId:'CUS-001', customerName:'Lê Hoàng Nam', cif:'JB0012345', productRef:'motor', productName:'Bảo hiểm vật chất xe', packageName:'Comprehensive',
    source:'PORTAL', sourceSystem:'PORTAL', caseId:'APP-2026-102', adviceId:null,
    recommendationReason:'Nhân viên tư vấn cũ nghỉ phép — chuyển tiếp để không lỡ SLA thẩm định.', needSummary:'Yêu cầu đang thẩm định', consent:'VALID',
    priority:'HIGH', targetSeller:'RM-01', targetTeam:'TEAM-A', createdAt:'2026-07-22 08:40', acceptBy:'2026-07-22 12:00',
    participants:[_p('REFERRER','RM-02',true), _p('ADVISOR','RM-02',true), _p('SELLING_PRODUCER','RM-02',true), _p('ASSIGNMENT_ACTOR','TL-01',true)],
    completeness:90 },
  { id:'HO-2026-004', type:'DELEGATION', state:'PENDING_ACCEPTANCE', routingMode:'DIRECT_SELLER',
    customerId:'CUS-001', customerName:'Lê Hoàng Nam', productRef:'health', caseId:'APP-2026-104',
    source:'PORTAL', sourceSystem:'PORTAL', taskNote:'Hỗ trợ thu thập chứng từ y tế bổ sung cho hồ sơ.', consent:'VALID',
    priority:'MEDIUM', targetSeller:'RM-01', targetTeam:'TEAM-A', createdAt:'2026-07-22 11:00', acceptBy:'2026-07-23 10:00',
    participants:[_p('CASE_OWNER','RM-02',true), _p('ASSIGNMENT_ACTOR','TL-01',true)],
    delegatedActions:['collect_document'], completeness:100 },
  { id:'HO-2026-005', type:'SALES_HANDOFF', state:'UNASSIGNED_EXCEPTION', routingMode:'AUTO_ROUTE',
    customerId:'CUS-004', customerName:'Phan Thị Hồng', productRef:'pa', productName:'Bảo hiểm tai nạn cá nhân', packageName:'Basic',
    source:'REFERRAL', sourceSystem:'PORTAL', adviceId:null,
    recommendationReason:'Auto-route không tìm được nhân viên tư vấn đủ readiness PA trong branch.', needSummary:'Bảo vệ tai nạn', consent:'PENDING',
    priority:'MEDIUM', targetSeller:null, targetTeam:'TEAM-A', createdAt:'2026-07-22 10:30', acceptBy:'2026-07-22 15:00',
    participants:[_p('REFERRER','RM-01',true), _p('ADVISOR','RM-01',true)],
    unassignedReason:'Không nhân viên tư vấn nào đủ điều kiện bán PA + còn slot workload.', completeness:40 }
];

// ----- Persistence (localStorage) -----
BANCA._handoffKey='banca_handoffs_v1';
(function(){ try{ const raw=localStorage.getItem(BANCA._handoffKey); if(raw){ const saved=JSON.parse(raw); if(Array.isArray(saved)&&saved.length){ // merge: override seed by id, add new
  const byId={}; BANCA.handoffs.forEach(h=>byId[h.id]=h); saved.forEach(h=>byId[h.id]=h); BANCA.handoffs=Object.values(byId); } } }catch(e){} })();
BANCA._persistHandoffs=function(){ try{ localStorage.setItem(BANCA._handoffKey, JSON.stringify(BANCA.handoffs)); }catch(e){} };

// ----- Getters -----
BANCA.handoffById = id => BANCA.handoffs.find(h=>h.id===id);
BANCA.participant = (h,role) => (h.participants||[]).find(p=>p.participationRole===role && p.status==='ACTIVE');
BANCA.participantName = (h,role) => { const p=BANCA.participant(h,role); return p?((BANCA.personas[p.userId]||{}).name||p.userId):null; };
// Handoff nhân viên tư vấn nhận (Bàn giao mới): đích danh + chờ tiếp nhận/đã phân công.
BANCA.handoffsForSeller = function(sellerId){
  sellerId=sellerId||BANCA.current();
  return BANCA.handoffs.filter(h=>h.targetSeller===sellerId && ['PENDING_ACCEPTANCE','ASSIGNED','NEED_MORE_INFORMATION'].includes(h.state));
};
// Handoff chờ phân công (Team Lead): trong scope, chưa có nhân viên tư vấn / cần xử lý.
BANCA.pendingAssignment = function(scope, mgrId){
  mgrId=mgrId||BANCA.current();
  const members=(BANCA.membersForScope?BANCA.membersForScope(scope,mgrId):[]).map(s=>s.id).concat([mgrId]);
  const inScope=h=> (h.targetTeam && members.some(id=>(BANCA.personas[id]||{}).team===h.targetTeam)) || members.includes((BANCA.participant(h,'ADVISOR')||{}).userId);
  return BANCA.handoffs.filter(h=>['PENDING_ASSIGNMENT','UNASSIGNED_EXCEPTION','DECLINED'].includes(h.state) && inScope(h));
};

// ----- Mutations (đều ghi audit) -----
function _addParticipant(h,role,userId,extra){ h.participants=h.participants||[]; if(!h.participants.some(p=>p.participationRole===role&&p.userId===userId&&p.status==='ACTIVE')) h.participants.push(_p(role,userId,true,extra)); }
BANCA.createHandoff = function(obj){
  const id = obj.id || ('HO-2026-'+String(900+BANCA.handoffs.length).padStart(3,'0'));
  const h = Object.assign({id, state:obj.routingMode==='DIRECT_SELLER'?'PENDING_ACCEPTANCE':(obj.routingMode==='AUTO_ROUTE'?'ASSIGNED':'PENDING_ASSIGNMENT'), createdAt:(BANCA.nowLabel?BANCA.nowLabel():'2026-07-22 12:00'), participants:[]}, obj);
  BANCA.handoffs.push(h); BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'CREATE_HANDOFF', handoff:id, type:h.type, routingMode:h.routingMode, customer:h.customerId, reason:h.recommendationReason||'', scope:h.targetTeam});
  return h;
};
BANCA.assignHandoff = function(id, sellerId, actorId){
  const h=BANCA.handoffById(id); if(!h) return; actorId=actorId||BANCA.current();
  const prev=h.targetSeller; h.targetSeller=sellerId; h.state='PENDING_ACCEPTANCE';
  _addParticipant(h,'ASSIGNMENT_ACTOR',actorId); // Team Lead CHỈ là assignment actor
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'ASSIGN_HANDOFF', handoff:id, actor:actorId, previous:prev, new:sellerId, reason:'Phân công từ Team Queue', readiness:(BANCA.products||[]).map(p=>p.state&&p.state[sellerId]).filter(Boolean).join(',')});
  return h;
};
BANCA.acceptHandoff = function(id, sellerId){
  const h=BANCA.handoffById(id); if(!h) return; sellerId=sellerId||BANCA.current();
  h.state='ACCEPTED'; h.acceptedBy=sellerId; h.acceptedAt=(BANCA.nowLabel?BANCA.nowLabel():'2026-07-22 12:30');
  if(h.type==='SALES_HANDOFF'){ _addParticipant(h,'SELLING_PRODUCER',sellerId); _addParticipant(h,'CASE_OWNER',sellerId); }
  else if(h.type==='CASE_REASSIGNMENT'){ _addParticipant(h,'CASE_OWNER',sellerId); }
  else if(h.type==='DELEGATION'){ _addParticipant(h,'SUPPORTER',sellerId); }
  // GIỮ NGUYÊN referrer/advisor — không ghi đè.
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'ACCEPT_HANDOFF', handoff:id, actor:sellerId, type:h.type, customer:h.customerId});
  return h;
};
BANCA.declineHandoff = function(id, reason, sellerId){
  const h=BANCA.handoffById(id); if(!h) return; sellerId=sellerId||BANCA.current();
  // Từ chối → nếu là team queue thì quay lại chờ phân công, nếu direct thì DECLINED.
  h.state = h.routingMode==='TEAM_QUEUE' ? 'PENDING_ASSIGNMENT' : 'DECLINED';
  h.declineReason=reason; h.targetSeller = h.routingMode==='TEAM_QUEUE' ? null : h.targetSeller;
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'DECLINE_HANDOFF', handoff:id, actor:sellerId, reason});
  return h;
};
/* ===== Participant snapshot xuyên suốt (submit → policy) ===== */
// Snapshot tại thời điểm submit (demo). Không tham chiếu record hiện tại → giữ attribution đúng.
BANCA.PARTICIPANTS_SNAPSHOT = {
  'APP-2026-101': {referrer:'RM-01', advisor:'RM-01', sellingProducer:'RM-01', caseOwner:'RM-01', source:'JANUS_CRM', leadRef:'LD-2026-0182', branch:'HCM01', team:'TEAM-A', campaign:'Priority Health Q3'},
  'APP-2026-102': {referrer:'TS-01', advisor:'TS-01', sellingProducer:'RM-01', caseOwner:'RM-01', source:'JANUS_CRM', leadRef:'LD-2091', branch:'HCM01', team:'TEAM-A', campaign:'Motor renewal'},
  'APP-2026-104': {referrer:'TS-01', advisor:'TS-01', sellingProducer:'RM-01', caseOwner:'RM-01', source:'JANUS_CRM', leadRef:'LD-2026-0182', branch:'HCM01', team:'TEAM-A', campaign:'Priority Health Q3'},
  'APP-2026-105': {referrer:'RM-02', advisor:'RM-02', sellingProducer:'RM-01', caseOwner:'RM-01', source:'PORTAL', leadRef:null, branch:'HCM01', team:'TEAM-A'},
  'APP-2026-107': {referrer:'RM-01', advisor:'RM-01', sellingProducer:'RM-01', caseOwner:'RM-01', source:'PORTAL', leadRef:null, branch:'HCM01', team:'TEAM-A'},
  'APP-2026-110': {referrer:'RM-02', advisor:'TS-01', sellingProducer:'RM-01', caseOwner:'RM-01', source:'JANUS_CRM', leadRef:'LD-2026-0090', branch:'HCM01', team:'TEAM-A', campaign:'Bancassurance H2'}
};
// Snapshot phân phối tại thời điểm phát hành (thêm servicing nhân viên tư vấn).
BANCA.POLICY_DISTRIBUTION = {
  'JB-POL-2026-0207': {referrer:'RM-02', advisor:'TS-01', sellingProducer:'RM-01', servicingSeller:'RM-01', branch:'HCM01', team:'TEAM-A', channel:'Bancassurance', campaign:'Bancassurance H2', externalRef:'JANUS/POL/0207', effectiveDate:'2026-07-01'},
  'JB-POL-2026-0184': {referrer:'RM-01', advisor:'RM-01', sellingProducer:'RM-01', servicingSeller:'RM-02', branch:'HCM01', team:'TEAM-A', channel:'Bancassurance', campaign:null, externalRef:'JANUS/POL/0184', effectiveDate:'2026-06-15'},
  'JB-POL-2025-0102': {referrer:'TS-01', advisor:'TS-01', sellingProducer:'RM-01', servicingSeller:'RM-01', branch:'HCM01', team:'TEAM-A', channel:'Telesales', campaign:'Motor 2025', externalRef:'JANUS/POL/0102', effectiveDate:'2025-11-02'}
};
// Resolve participant cho yêu cầu (snapshot hoặc fallback owner).
BANCA.participantsOf = function(id, ownerFallback){
  const s=BANCA.PARTICIPANTS_SNAPSHOT[id];
  if(s) return s;
  const o=ownerFallback||null;
  return {referrer:o, advisor:o, sellingProducer:o, caseOwner:o, source:'PORTAL', leadRef:null, branch:(BANCA.personas[o]||{}).branch, team:(BANCA.personas[o]||{}).team, _fallback:true};
};
BANCA.policyDistributionOf = function(id, ownerFallback){
  const s=BANCA.POLICY_DISTRIBUTION[id];
  if(s) return s;
  const o=ownerFallback||null;
  return {referrer:o, advisor:o, sellingProducer:o, servicingSeller:o, branch:(BANCA.personas[o]||{}).branch, team:(BANCA.personas[o]||{}).team, channel:'Bancassurance', campaign:null, externalRef:null, effectiveDate:null, _fallback:true};
};
BANCA.pName = uid => uid?((BANCA.personas[uid]||{}).name||uid):'—';
BANCA.pLine = uid => { const p=BANCA.personas[uid]||{}; return uid?(p.role||'')+(p.rm?' · '+p.rm:'')+(p.branch?' · '+p.branch:''):''; };

// Nhân viên tư vấn yêu cầu bổ sung thông tin trước khi tiếp nhận (không từ chối hẳn).
BANCA.needMoreInfo = function(id, note, sellerId){
  const h=BANCA.handoffById(id); if(!h) return; sellerId=sellerId||BANCA.current();
  h.state='NEED_MORE_INFORMATION'; h.infoRequest=note; h.infoRequestBy=sellerId;
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'HANDOFF_NEED_MORE_INFO', handoff:id, actor:sellerId, note});
  return h;
};
// Đổi khách hàng sau assign (EXCEPTION) — revalidate toàn bộ context.
BANCA.changeCustomer = function(id, newCustId, newCustName, reason, actorId){
  const h=BANCA.handoffById(id); if(!h) return; actorId=actorId||BANCA.current();
  const prev=h.customerId; h.customerId=newCustId; h.customerName=newCustName; h.consent='PENDING';
  const prod=(BANCA.products||[]).find(p=>p.id===h.productRef);
  const sellerOk = h.targetSeller && prod ? (prod.visible.includes(h.targetSeller) && ['READY','CONDITIONAL'].includes(prod.state[h.targetSeller])) : true;
  const invalidated = !sellerOk;
  if(invalidated){ h.state='PENDING_ASSIGNMENT'; h.targetSeller=null; h.assignmentInvalidated=true; }
  h.quoteStatus='RE_RATING_REQUIRED'; // không giữ quote KH cũ cho KH mới
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'CHANGE_CUSTOMER', handoff:id, actor:actorId, previous:prev, new:newCustId, reason, note:'Revalidate consent/portfolio/nhân viên tư vấn/quote'+(invalidated?' · assignment invalidated → PENDING_ASSIGNMENT':'')+' · quote RE_RATING_REQUIRED'});
  return {handoff:h, invalidated, reRating:true};
};
// Điều chỉnh ghi nhận (attribution) — TÁCH khỏi assign; không tự đổi commission đã khoá.
BANCA.reattribute = function(id, role, newUserId, reason){
  const h=BANCA.handoffById(id); if(!h) return; const p=BANCA.participant(h,role); const prev=p?p.userId:null;
  if(p){ p.userId=newUserId; } else { _addParticipant(h,role,newUserId); }
  BANCA._persistHandoffs();
  BANCA.audit&&BANCA.audit({action:'RE_ATTRIBUTION', handoff:id, role, previous:prev, new:newUserId, reason, note:'Không ảnh hưởng commission đã khoá'});
  return h;
};
