window.BANCA = window.BANCA || {};
/* ============================================================================
 * ORG UNIT MODEL (2026-07-22) — hierarchy render từ dữ liệu, KHÔNG hard-code cấp.
 * OrgUnit { id, name, type, parentId, managerId, source, attrs{branch/team/region/dept} }
 * Partner khác nhau dùng cấp khác nhau → chỉ cần đổi seed, UI render theo tree.
 * ==========================================================================*/
BANCA.ORG_UNITS = [
  { id:'U-HCM',        name:'Khu vực HCM',              type:'REGION', parentId:null,           managerId:null,   source:'MANUAL', attrs:{region:'HCM'} },
  { id:'U-HCM01',      name:'Chi nhánh HCM01',          type:'BRANCH', parentId:'U-HCM',        managerId:'BM-01',source:'MANUAL', attrs:{branch:'HCM01'} },
  { id:'U-HCM01-KHCN', name:'Phòng Khách hàng cá nhân', type:'DEPT',   parentId:'U-HCM01',      managerId:'TL-01',source:'MANUAL', attrs:{branch:'HCM01',dept:'Phòng KHCN'} },
  { id:'U-TEAM-A',     name:'TEAM-A',                   type:'TEAM',   parentId:'U-HCM01-KHCN', managerId:'TL-01',source:'MANUAL', attrs:{branch:'HCM01',dept:'Phòng KHCN',team:'TEAM-A'} },
  { id:'U-TEAM-B',     name:'TEAM-B',                   type:'TEAM',   parentId:'U-HCM01-KHCN', managerId:null,   source:'MANUAL', attrs:{branch:'HCM01',dept:'Phòng KHCN',team:'TEAM-B'} },
  { id:'U-HCM01-KHDN', name:'Phòng Khách hàng doanh nghiệp', type:'DEPT', parentId:'U-HCM01',  managerId:null,   source:'MANUAL', attrs:{branch:'HCM01',dept:'Phòng KHDN'} },
  { id:'U-TEAM-C',     name:'TEAM-C',                   type:'TEAM',   parentId:'U-HCM01-KHDN', managerId:null,   source:'MANUAL', attrs:{branch:'HCM01',dept:'Phòng KHDN',team:'TEAM-C'} },
  { id:'U-HCM02',      name:'Chi nhánh HCM02',          type:'BRANCH', parentId:'U-HCM',        managerId:null,   source:'MANUAL', attrs:{branch:'HCM02'} },
  { id:'U-CALL',       name:'Call Center',              type:'BRANCH', parentId:'U-HCM',        managerId:null,   source:'MANUAL', attrs:{branch:'CALL'} }
];
// Nhân viên hỗ trợ đơn vị khác (assignment phụ, không đổi đơn vị chính). Demo: RM-01 hỗ trợ TEAM-B.
BANCA.SUPPORT_ASSIGNMENTS = { 'RM-01':['TEAM-B'] };
BANCA.supportUnitsOf = id => BANCA.SUPPORT_ASSIGNMENTS[id] || [];
BANCA.orgUnitById = id => BANCA.ORG_UNITS.find(u=>u.id===id);
BANCA.orgChildren = id => BANCA.ORG_UNITS.filter(u=>u.parentId===id);
BANCA.orgUnitLabelType = t => ({REGION:'Khu vực',BRANCH:'Chi nhánh',DEPT:'Phòng',TEAM:'Đội'}[t]||t);

// Đơn vị TEAM của 1 persona.
BANCA.unitOfPersona = function(per){
  if(!per) return null;
  if(per.team) return BANCA.ORG_UNITS.find(u=>u.type==='TEAM'&&u.attrs.team===per.team) || null;
  return BANCA.ORG_UNITS.find(u=>u.type==='BRANCH'&&u.attrs.branch===per.branch) || null;
};
// Persona có thuộc unit (hoặc unit con) không?
BANCA.personaInUnit = function(per, unitId){
  const u=BANCA.orgUnitById(unitId); if(!u||!per) return false;
  switch(u.type){
    case 'TEAM':   return per.team===u.attrs.team;
    case 'DEPT':   return per.branch===u.attrs.branch && (BANCA.deptOfTeam?BANCA.deptOfTeam(per.team):null)===u.attrs.dept;
    case 'BRANCH': return per.branch===u.attrs.branch;
    case 'REGION': return (BANCA.regionOf?BANCA.regionOf(per.branch):'HCM')===u.attrs.region;
    default: return false;
  }
};
// Unit gốc theo scope level của manager (để mở drawer).
BANCA.rootUnitForScope = function(scope, meObj){
  if(scope==='REGION') return BANCA.ORG_UNITS.find(u=>u.type==='REGION'&&u.attrs.region===BANCA.regionOf(meObj.branch));
  if(scope==='BRANCH'||scope==='ORG_SUBTREE') return BANCA.ORG_UNITS.find(u=>u.type==='BRANCH'&&u.attrs.branch===meObj.branch);
  if(scope==='TEAM') return BANCA.ORG_UNITS.find(u=>u.type==='TEAM'&&u.attrs.team===meObj.team);
  return null;
};
// Cây con của 1 unit (đệ quy) — dùng render drawer.
BANCA.orgSubtree = function(id){
  const node=BANCA.orgUnitById(id); if(!node) return null;
  return { unit:node, children:BANCA.orgChildren(id).map(c=>BANCA.orgSubtree(c.id)) };
};
