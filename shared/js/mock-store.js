// Demo state overlay (localStorage) — persist thao tác demo (thanh toán, tính phí lại, upload...) qua reload.
// Reset tại trang Demo setup (nút "Reset demo state"). Overlay merge NÔNG theo application id.
window.BANCA = window.BANCA || {};
(function(){
 const KEY='bancaDemoOverlay';
 const load=()=>{ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } };
 BANCA.overlay = load();

 // Áp overlay lên seed applications (deep-merge 1 cấp cho object con)
 BANCA.applyOverlay = function(){
  const ov = BANCA.overlay.applications||{};
  Object.entries(ov).forEach(([id,patch])=>{
   const a = (BANCA.applications||[]).find(x=>x.id===id);
   if(!a) return;
   Object.entries(patch).forEach(([k,v])=>{
    if(v && typeof v==='object' && !Array.isArray(v) && a[k] && typeof a[k]==='object') Object.assign(a[k],v);
    else a[k]=v;
   });
  });
  const ovp = BANCA.overlay.policies||{};
  Object.entries(ovp).forEach(([id,patch])=>{
   if(patch.__new && !(BANCA.policies||[]).find(x=>x.id===id)){ BANCA.policies.push(Object.assign({},patch.data)); return; }
   const p=(BANCA.policies||[]).find(x=>x.id===id); if(p) Object.assign(p,patch);
  });
 };

 BANCA.patchApp = function(id, patch){
  BANCA.overlay.applications = BANCA.overlay.applications||{};
  const cur = BANCA.overlay.applications[id]||{};
  Object.entries(patch).forEach(([k,v])=>{
   if(v && typeof v==='object' && !Array.isArray(v) && cur[k] && typeof cur[k]==='object') Object.assign(cur[k],v);
   else cur[k]=v;
  });
  BANCA.overlay.applications[id]=cur;
  localStorage.setItem(KEY, JSON.stringify(BANCA.overlay));
  BANCA.applyOverlay();
 };
 BANCA.addPolicyDemo = function(policy){
  BANCA.overlay.policies = BANCA.overlay.policies||{};
  BANCA.overlay.policies[policy.id]={__new:true, data:policy};
  localStorage.setItem(KEY, JSON.stringify(BANCA.overlay));
  BANCA.applyOverlay();
 };
 BANCA.resetDemo = function(){ localStorage.removeItem(KEY); BANCA.overlay={}; location.reload(); };
 // Seeds đã nạp trước file này (thứ tự trong head-loader) → áp overlay ngay
 BANCA.applyOverlay();
})();
