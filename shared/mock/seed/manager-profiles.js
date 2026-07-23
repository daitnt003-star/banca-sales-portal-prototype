window.BANCA = window.BANCA || {};
/* ============================================================================
 * MANAGER PROFILES — Capability/Profile/Channel model (refactor 2026-07-22)
 * Nguyên tắc: KHÔNG hard-code role TEAM_LEADER/BRANCH_MANAGER thành nhiều role +
 * dashboard riêng. Một Manager Workspace dùng chung, render theo profile:
 *   sellingEnabled · homeLayout · scopeResolution · supervisoryActions ·
 *   channelMode(PORTAL/EMBED) · caseMutability(LIVE/MIRROR_READONLY) ·
 *   orgSource(MANUAL/HYBRID/SYNCED) · visibility{commission,unmaskPII,unmaskHealth}
 * "Team Lead" chỉ là 1 cấu hình phổ biến, không phải role kỹ thuật cố định.
 * ==========================================================================*/

// Nhân viên tư vấn mặc định (homeLayout PERSONAL, không supervisory action).
BANCA.DEFAULT_PROFILE = {
  label:'Nhân viên tư vấn', sellingEnabled:true, homeLayout:'PERSONAL',
  scopeResolution:'OWN', availableScopes:['SELF'], defaultScope:'SELF',
  supervisoryActions:[], underwritingAuthority:'NONE',
  channelMode:'PORTAL', caseMutability:'LIVE', orgSource:'MANUAL', syncedAt:null,
  visibility:{ commission:false, unmaskPII:false, unmaskHealth:false }
};

// 3 profile demo (map lên persona có sẵn — KHÔNG tạo role mới).
BANCA.MANAGER_PROFILES = {
  // Profile A — Player-coach Portal (vừa bán vừa quản lý)
  'RM-01': {
    label:'Player-coach · Portal', sellingEnabled:true, homeLayout:'SEGMENTED',
    scopeResolution:'TEAM', availableScopes:['SELF','TEAM','BRANCH','REGION'], defaultScope:'TEAM',
    supervisoryActions:['REASSIGN_IN','ASSIGN_TASK','COACH'],
    underwritingAuthority:'NONE', channelMode:'PORTAL', caseMutability:'LIVE',
    orgSource:'MANUAL', syncedAt:null,
    visibility:{ commission:true, unmaskPII:false, unmaskHealth:false }
  },
  // Profile B — Telesales Supervisor Portal (chỉ quản lý, không CTA bán)
  'TL-01': {
    label:'Telesales Supervisor · Portal', sellingEnabled:false, homeLayout:'MANAGER',
    scopeResolution:'TEAM', availableScopes:['TEAM'], defaultScope:'TEAM',
    supervisoryActions:['ASSIGN_TASK','COACH'],
    underwritingAuthority:'NONE', channelMode:'PORTAL', caseMutability:'LIVE',
    orgSource:'HYBRID', syncedAt:'2026-07-22 09:15',
    visibility:{ commission:true, unmaskPII:false, unmaskHealth:false }
  },
  // Profile C — Bank Manager Embed (mirror read-only, sync org)
  'BM-01': {
    label:'Bank Manager · Embed', sellingEnabled:false, homeLayout:'MANAGER',
    scopeResolution:'ORG_SUBTREE', availableScopes:['TEAM','BRANCH'], defaultScope:'BRANCH',
    supervisoryActions:['ASSIGN_TASK','COACH'],
    underwritingAuthority:'NONE', channelMode:'EMBED', caseMutability:'MIRROR_READONLY',
    orgSource:'SYNCED', syncedAt:'2026-07-22 10:32',
    visibility:{ commission:false, unmaskPII:false, unmaskHealth:false }
  }
};

// Hợp nhất default + profile theo persona.
BANCA.resolveManagerProfile = function(id){
  id = id || (BANCA.current && BANCA.current());
  const base = JSON.parse(JSON.stringify(BANCA.DEFAULT_PROFILE));
  const mp = BANCA.MANAGER_PROFILES[id];
  if(!mp) return Object.assign(base, {personaId:id});
  const merged = Object.assign(base, mp, {personaId:id});
  merged.visibility = Object.assign({}, BANCA.DEFAULT_PROFILE.visibility, mp.visibility||{});
  return merged;
};

// User có phải manager-enabled? (không kiểm role name — kiểm capability)
BANCA.isManagerProfile = function(id){
  const p = BANCA.resolveManagerProfile(id);
  return p.homeLayout !== 'PERSONAL' || (p.supervisoryActions||[]).length > 0;
};

// Kiểm tra 1 supervisory action.
BANCA.canDo = function(action, id){
  return (BANCA.resolveManagerProfile(id).supervisoryActions||[]).includes(action);
};
BANCA.channelMode   = function(id){ return BANCA.resolveManagerProfile(id).channelMode; };
BANCA.caseMutability= function(id){ return BANCA.resolveManagerProfile(id).caseMutability; };
BANCA.orgSourceOf   = function(id){ return BANCA.resolveManagerProfile(id).orgSource; };
BANCA.syncedAtOf    = function(id){ return BANCA.resolveManagerProfile(id).syncedAt; };
BANCA.isEmbed       = function(id){ return BANCA.channelMode(id)==='EMBED'; };
BANCA.isReadonlyCase= function(id){ return BANCA.caseMutability(id)==='MIRROR_READONLY'; };

// Scope resolution — 1 persona `per` có nằm trong scope quản lý của `id`?
BANCA.inManagerScope = function(per, id){
  id = id || (BANCA.current && BANCA.current());
  const p = BANCA.resolveManagerProfile(id);
  const me = (BANCA.personas||{})[id] || {};
  if(!per) return false;
  const scopes = p.availableScopes || [p.scopeResolution];
  // Trong scope nếu thuộc BẤT KỲ cấp nào user được phép xem (rộng nhất thắng).
  if(scopes.includes('REGION')) return BANCA.regionOf(per.branch) === BANCA.regionOf(me.branch);
  if(scopes.includes('BRANCH')||scopes.includes('ORG_SUBTREE')) return per.branch === me.branch;
  if(scopes.includes('TEAM')) return per.team === me.team;
  return false;
};

// Nhãn scope hiển thị header.
BANCA.scopeLabel = function(id){
  id = id || (BANCA.current && BANCA.current());
  const p = BANCA.resolveManagerProfile(id);
  const me = (BANCA.personas||{})[id] || {};
  if(p.scopeResolution==='TEAM') return me.team || 'TEAM';
  if(p.scopeResolution==='BRANCH'||p.scopeResolution==='ORG_SUBTREE') return (me.branch||'BRANCH')+' Region';
  return 'Cá nhân';
};

// Sellers trong scope quản lý (loại chính mình + manager khác).
BANCA.sellersInScope = function(id){
  id = id || (BANCA.current && BANCA.current());
  return Object.entries(BANCA.personas||{})
    .filter(([sid,per])=> sid!==id && BANCA.inManagerScope(per, id))
    .map(([sid,per])=> Object.assign({id:sid}, per));
};

// Scope tabs khả dụng của user (['SELF','TEAM','BRANCH']).
BANCA.availableScopes = function(id){ return BANCA.resolveManagerProfile(id).availableScopes || ['SELF']; };
BANCA.defaultScope   = function(id){ return BANCA.resolveManagerProfile(id).defaultScope || 'SELF'; };
BANCA.scopeTabLabel  = function(scope){ return {SELF:'Cá nhân', TEAM:'Đội nhóm', BRANCH:'Chi nhánh', REGION:'Khu vực'}[scope] || scope; };

// Bản đồ chi nhánh → khu vực (org sync demo).
BANCA.REGION_OF = { HCM01:'HCM', HCM02:'HCM', CALL:'HCM', OPS:'HCM', HCM99:'HCM' };
BANCA.regionOf = function(branch){ return BANCA.REGION_OF[branch] || 'HCM'; };
// OrgUnit hierarchy (render từ dữ liệu, không hard-code cấp). team → phòng ban.
BANCA.DEPT_OF_TEAM = { 'TEAM-A':'Phòng KHCN', 'TEAM-B':'Phòng KHCN', 'TEAM-C':'Phòng KHDN' };
BANCA.deptOfTeam = function(team){ return BANCA.DEPT_OF_TEAM[team] || (team?'Phòng KHCN':null); };
BANCA.regionName = function(region){ return 'Khu vực '+region; };
// Đường dẫn tổ chức đầy đủ của 1 persona: [ {type,name} ... ] từ khu vực → team.
BANCA.orgPath = function(per){
  const out=[];
  if(!per) return out;
  out.push({type:'REGION', name:'Khu vực '+BANCA.regionOf(per.branch)});
  out.push({type:'BRANCH', name:'Chi nhánh '+(per.branch||'—')});
  const dept=BANCA.deptOfTeam(per.team); if(dept) out.push({type:'DEPT', name:dept});
  if(per.team) out.push({type:'TEAM', name:per.team});
  return out;
};
// Độ sâu path CHUNG cho scope hiện tại (số cấp đã đồng nhất → ẩn khỏi từng dòng).
// SELF/TEAM: chung tới TEAM (ẩn hết) · BRANCH: chung tới BRANCH (hiện Dept+Team) · REGION: chung tới REGION (hiện Branch+Dept+Team).
BANCA.scopeCommonDepth = function(scope){ return {SELF:4, TEAM:4, DEPT:3, BRANCH:2, ORG_SUBTREE:2, REGION:1}[scope] || 4; };
// Org path rút gọn của 1 nhân viên theo scope (phần KHÁC path chung).
BANCA.memberOrgLabel = function(per, scope){
  const path=BANCA.orgPath(per); const keepFrom=BANCA.scopeCommonDepth(scope);
  const tail=path.slice(keepFrom).map(x=>x.name);
  return tail.join(' › ');
};

// Thành viên theo scope cụ thể (không phụ thuộc profile.scopeResolution).
BANCA.membersForScope = function(scope, id){
  id = id || (BANCA.current && BANCA.current());
  const me = (BANCA.personas||{})[id] || {};
  if(scope==='SELF') return [];
  const myRegion = BANCA.regionOf(me.branch);
  return Object.entries(BANCA.personas||{})
    .filter(([sid,per])=>{
      if(sid===id) return false;
      if(scope==='TEAM')   return per.team===me.team;
      if(scope==='BRANCH'||scope==='ORG_SUBTREE') return per.branch===me.branch;
      if(scope==='REGION') return BANCA.regionOf(per.branch)===myRegion;
      return false;
    })
    .map(([sid,per])=>Object.assign({id:sid}, per));
};
// Apps theo scope (SELF = của tôi; TEAM/BRANCH = member trong scope + của tôi).
BANCA.appsForScope = function(scope, id){
  id = id || (BANCA.current && BANCA.current());
  if(scope==='SELF') return (BANCA.applications||[]).filter(a=>a.owner===id);
  const ids = BANCA.membersForScope(scope,id).map(s=>s.id);
  return (BANCA.applications||[]).filter(a=>a.owner===id || ids.includes(a.owner));
};

// Rule hiển thị cột Khách hàng dùng CHUNG cho 3 trang danh sách (chưa nộp / đã nộp / hợp đồng):
// tên khách + SĐT (mask) + dòng 👥 người giới thiệu · tư vấn · bán.
// Cột Khách hàng: CHỈ tên + SĐT (mask). Không nhét người tham gia vào đây.
BANCA.customerCell = function(cust){
  const name=(cust&&cust.name)||'—';
  const phone=(cust&&cust.phone)?`<div style="font-size:12px;color:var(--ink-300);">${BANCA.maskPhone?BANCA.maskPhone(cust.phone):cust.phone}</div>`:'';
  return name+phone;
};
// Cột riêng "Nhân viên phụ trách": CHỈ tên người bán.
BANCA.sellerCell = function(referrer, advisor, seller){
  const sName = seller ? (BANCA.pName?BANCA.pName(seller):seller) : '—';
  return `<b style="font-weight:600;">${sName}</b>`;
};

// Hợp đồng theo phạm vi tổ chức (tương tự appsForScope). Dùng cho danh sách Hợp đồng.
BANCA.policiesForScope = function(scope, id){
  id = id || (BANCA.current && BANCA.current());
  const all = BANCA.myPolicies ? BANCA.myPolicies() : (BANCA.policies||[]);
  if(scope==='SELF') return all.filter(x=>x.owner===id);
  const ids = BANCA.membersForScope(scope,id).map(s=>s.id);
  return all.filter(x=>x.owner===id || ids.includes(x.owner));
};

// Audit log (demo, localStorage) — dùng cho unmask / reassign / re-attribution.
BANCA.auditLog = BANCA.auditLog || (function(){ try{ return JSON.parse(localStorage.getItem('banca_audit')||'[]'); }catch(e){ return []; } })();
BANCA.audit = function(ev){
  const rec = Object.assign({ at:new Date().toISOString(), by:(BANCA.current&&BANCA.current()) }, ev||{});
  BANCA.auditLog.push(rec);
  try{ localStorage.setItem('banca_audit', JSON.stringify(BANCA.auditLog.slice(-100))); }catch(e){}
  return rec;
};

// Nhãn action reassign khác nhau Portal vs Embed.
BANCA.reassignActionLabel = function(id){
  return BANCA.isEmbed(id) ? 'Điều chỉnh ghi nhận' : 'Chuyển người phụ trách';
};
