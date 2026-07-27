function rel(){return location.pathname.includes('/modules/')?'../../':location.pathname.includes('/dev/')?'../':''}
// Privacy helpers — mặc định che PII, reveal là hành động chủ động có audit demo tại từng màn.
BANCA.maskPhone = BANCA.maskPhone || function(v){ v=String(v||''); return v.length>=9 ? v.slice(0,3)+' *** '+v.slice(-3) : (v||'—'); };
BANCA.maskId = BANCA.maskId || function(v){ v=String(v||''); return v.length>=6 ? v.slice(0,3)+' ****** '+v.slice(-3) : (v||'—'); };

const FPT_LOGO_SVG = `<svg viewBox="0 0 50.3 25" xmlns="http://www.w3.org/2000/svg">
  <g>
    <polygon fill="#fff" points="18.9,10.1 23,10.1 22.7,11.5 18.5,11.5 "/>
    <path fill="#fff" d="M21.7,0c-2.5,0-4.6,1.7-5.2,4.1L11.7,25h6.9c2.5,0,4.6-1.7,5.2-4.1L28.7,0H21.7L21.7,0z M24.6,11.6
      c-0.3,1.1-1.2,1.8-2.3,1.8h-4.2l-0.3,1.5c-0.3,1.1-1.2,1.9-2.4,1.9l2-8.7h6.2c0.9,0,1.6,0.9,1.4,1.8L24.6,11.6L24.6,11.6z"/>
    <path fill="#fff" d="M8.2,3.8c-2.5,0-4.6,1.7-5.2,4.1L0,21.2h6.9c2.5,0,4.6-1.7,5.2-4.1l3.1-13.2L8.2,3.8L8.2,3.8z M10.6,10.1H6.3
      L6,11.5H11c-0.3,1.1-1.3,1.9-2.4,1.9H5.5L5.2,15c-0.3,1.1-1.2,1.9-2.4,1.9l1.6-6.8C4.7,9,5.6,8.2,6.8,8.2H13
      C12.7,9.3,11.7,10.1,10.6,10.1L10.6,10.1z"/>
    <path fill="#fff" d="M33.4,3.8c-2.5,0-4.6,1.7-5.2,4.1l-3.1,13.2h6.9c2.5,0,4.6-1.7,5.2-4.1l3.1-13.2C40.4,3.8,33.4,3.8,33.4,3.8z
      M37.5,10.1h-3.2L33.2,15c-0.2,1.1-1.2,1.8-2.3,1.8h-0.1l1.6-6.7H31c-0.9,0-1.6-0.9-1.4-1.8l0-0.2h6.5c0.9,0,1.6,0.9,1.4,1.8
      C37.5,9.9,37.5,10.1,37.5,10.1z"/>
  </g>
  <g>
    <path fill="#fff" d="M39.9,18.3c-0.8,0-1.4,0.6-1.4,1.4c0,0.8,0.6,1.4,1.4,1.4s1.4-0.6,1.4-1.4C41.4,18.9,40.7,18.3,39.9,18.3
      L39.9,18.3z M39.9,20.8c-0.6,0-1.1-0.5-1.1-1.1s0.5-1.1,1.1-1.1c0.6,0,1.1,0.5,1.1,1.1S40.5,20.8,39.9,20.8L39.9,20.8z"/>
    <path fill="#fff" d="M40,19.9h-0.2v0.5h-0.3V19H40c0.2,0,0.3,0,0.4,0.1c0.1,0.1,0.1,0.2,0.1,0.3c0,0.1,0,0.2-0.1,0.2
      s-0.1,0.1-0.2,0.2l0.3,0.6v0h-0.3C40.2,20.4,40,19.9,40,19.9z M39.7,19.7H40c0.1,0,0.1,0,0.2-0.1c0,0,0.1-0.1,0.1-0.2
      c0-0.1,0-0.1-0.1-0.2c0,0-0.1-0.1-0.2-0.1h-0.2L39.7,19.7L39.7,19.7z"/>
  </g>
  <g>
    <path fill="#fff" d="M44.8,16.8v-6.6h1v6.6H44.8z"/>
    <path fill="#fff" d="M49.7,16.3c-0.4,0.4-0.9,0.5-1.6,0.5c-0.7,0-1.2-0.1-1.6-0.3l0.4-0.9c0.4,0.2,0.8,0.3,1.2,0.3
      c0.4,0,0.7-0.1,0.9-0.3c0.2-0.2,0.3-0.4,0.3-0.7c0-0.4-0.4-0.8-1.1-1.1c-0.5-0.2-0.9-0.5-1.1-0.7c-0.4-0.3-0.6-0.8-0.6-1.3
      c0-0.6,0.2-1,0.6-1.4c0.4-0.3,0.9-0.5,1.5-0.5s1.1,0.1,1.5,0.3l-0.3,0.8C49.4,11.1,49,11,48.6,11c-0.3,0-0.6,0.1-0.8,0.2
      s-0.3,0.4-0.3,0.7c0,0.4,0.4,0.8,1.1,1.1c0.5,0.2,0.9,0.5,1.1,0.7c0.4,0.3,0.5,0.8,0.5,1.3C50.3,15.5,50.1,16,49.7,16.3L49.7,16.3z"/>
  </g>
</svg>`;

// Menu chính theo Spec v1 mục 3.1 — [label, url, icon, group, permission]
function navItems(){
 const T=BANCA.t;
 const GRP={sales:T('sales'),after:T('afterSale'),support:T('support'),manage:T('management')};
 // IA theo glossary: Bán hàng → Sau bán → Hỗ trợ → Quản lý.
 const items=[
  [T('home'),'modules/seller-workspace/index.html','home',null,'VIEW_WORKSPACE'],
  [T('quickAdvisory'),'modules/quick-advisory/index.html','advise',GRP.sales,'VIEW_WORKSPACE'],
  [T('insuranceRequest'),'modules/unsubmitted-applications/index.html','draft',GRP.sales,'VIEW_WORKSPACE', true],
  [T('unsubmitted'),'modules/unsubmitted-applications/index.html','draft',GRP.sales,'VIEW_WORKSPACE'],
  [T('submitted'),'modules/submitted-applications/index.html','sent',GRP.sales,'VIEW_WORKSPACE'],
  [T('policy'),'modules/policies/index.html','doc',GRP.after,'VIEW_WORKSPACE'],
  [T('help'),'modules/help/index.html','help',GRP.support,'VIEW_WORKSPACE'],
  [T('management'),'modules/team-workspace/index.html','team',GRP.manage,'VIEW_TEAM_WORKSPACE', true],
  [T('Đội nhóm'),'modules/team-workspace/index.html','team',GRP.manage,'VIEW_TEAM_WORKSPACE'],
 ];
 // Nhóm BÁN HÀNG (tư vấn/tạo yêu cầu) là hoạt động bán cá nhân → ẩn với persona không bán (quản lý thuần).
 const _mp = BANCA.resolveManagerProfile ? BANCA.resolveManagerProfile(BANCA.current()) : {sellingEnabled:true};
 const canSell = _mp.sellingEnabled!==false;
 return items.filter(i=>BANCA.can(i[4]) && !(i[3]===GRP.sales && !canSell) && !i[5]);
}

function navIcon(k){
 const icons={
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  draft:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  sent:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  doc:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  team:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.8.3 5 2 5 4.9"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5.1.8c0 1.7-2.6 2.2-2.6 3.6"/><circle cx="12" cy="17" r=".5"/>',
  advise:'<path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.2V17h6v-1.3c0-.8.4-1.6 1-2.2A6 6 0 0 0 12 3z"/><path d="M9 21h6M10 19h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
 };
 return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[k]||icons.home}</svg>`;
}

function shell(active,title,body,opts){
 opts=opts||{};
 const r=rel();
 const personas=Object.keys(BANCA.personas).map(p=>`<option ${BANCA.current()===p?'selected':''}>${p}</option>`).join('');
 let nav='',lastGroup=null;
 navItems().forEach(([n,u,icon,group])=>{
  if(group!==lastGroup){ if(group) nav+=`<div class="sb1-group-label" style="padding:14px 18px 4px;font-size:10px;letter-spacing:.08em;color:#7f97c4;">${group}</div>`; lastGroup=group; }
  nav+=`<div class="sb1-overview-item${active===n?' active':''}" onclick="window.location.assign('${r}${u}')">${navIcon(icon)}<span class="txt">${n}</span></div>`;
 });
 const p=BANCA.persona();
 const initials=(p&&p.name)?p.name.split(' ').map(w=>w[0]).slice(-2).join('').toUpperCase():BANCA.current().slice(0,2);
 const _mp = BANCA.resolveManagerProfile ? BANCA.resolveManagerProfile(BANCA.current()) : {sellingEnabled:true};
 const canSell = p.status==='ACTIVE' && !p.serviceError && _mp.sellingEnabled!==false;
 // CTA header phân cấp rõ nghĩa (bản đánh giá P0-3):
 //  · "Tư vấn nhanh" = khi khách CHƯA chắc nhu cầu/gói.
 //  · "Tạo yêu cầu bảo hiểm" = khi đã biết khách + sản phẩm (mở modal chọn ngữ cảnh).
 //  · "Tiếp tục yêu cầu gần nhất" = nếu đang có nháp dang dở (giảm thao tác).
 const startBtn = canSell ? `<button class="btn btn-primary" onclick="openStartSale()" style="white-space:nowrap;">+ ${BANCA.t('createInsuranceRequest')}</button>` : '';
 const adviseBtn = canSell ? `<button class="btn btn-secondary" onclick="location.href='${r}modules/advisory-workspace/index.html?new=1'" style="white-space:nowrap;">💡 ${BANCA.t('quickAdvisory')}</button>` : '';
 let resumeBtn='';
 if(canSell){
   try{ const _me=BANCA.current();
     const _drafts=(BANCA.myApps?BANCA.myApps('NOT_SUBMITTED'):[]).filter(a=>a.owner===_me).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
     if(_drafts.length){ const d=_drafts[0]; resumeBtn=`<button class="btn btn-secondary" onclick="location.href='${r}modules/application-workspace/index.html?id=${d.id}'" style="white-space:nowrap;" title="Yêu cầu ${d.id} · ${custName?custName(d.customerId):''}">↩ ${BANCA.t('continueLatestRequest')}</button>`; }
   }catch(e){}
 }

 document.body.innerHTML=`
<a href="#main-content" class="skip-link">Bỏ qua tới nội dung chính</a>
<div class="shell">
  <nav class="sb1" id="sb1" aria-label="Điều hướng chính">
    <div class="sb1-header">
      <div class="fpt-logo-svg">${FPT_LOGO_SVG}</div>
      <div class="sys-name">BANCA SALES PORTAL</div>
    </div>
    <div class="sb1-scroll">${nav}</div>
    <div class="sb1-footer">
      <div class="sb1-user" onclick="toggleAvatarMenu(event)" style="cursor:pointer;position:relative;">
        <div class="avatar">${initials}</div>
        <div class="uinfo"><div class="uname">${(p&&p.name)||BANCA.current()}</div><div class="urole">${(p&&p.role)||BANCA.t('seller')}</div></div>
        <div id="avatar-menu" style="display:none;position:absolute;bottom:52px;left:8px;right:8px;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(10,25,60,.25);overflow:hidden;z-index:60;">
          <div onclick="event.stopPropagation();location.href='${r}modules/employee-profile/index.html'" style="padding:10px 14px;font-size:13px;color:#1c2b4a;cursor:pointer;" onmouseover="this.style.background='#f2f6ff'" onmouseout="this.style.background='#fff'">Hồ sơ nhân viên</div>
          <div style="padding:10px 14px;font-size:13px;color:#8b98b0;">Thiết lập cá nhân</div>
          <div onclick="event.stopPropagation();location.href='${r}modules/auth/index.html'" style="padding:10px 14px;font-size:13px;color:#c22;cursor:pointer;border-top:1px solid #eef1f6;" onmouseover="this.style.background='#fff5f5'" onmouseout="this.style.background='#fff'">Đăng xuất</div>
        </div>
      </div>
    </div>
  </nav>
  <div class="content">
    <div class="topbar">
      <div class="tb-titles">
        <div class="crumb-row"><span>Banca Sales Portal</span><span>/</span><b>${active}</b></div>
        <div class="tb-main">${title}</div>
      </div>
      <div class="spacer"></div>
      ${resumeBtn}
      ${adviseBtn}
      ${startBtn}
      <button onclick="BANCA.setLang('${BANCA.lang==='en'?'vi':'en'}')" title="${BANCA.t('Chuyển sang tiếng Anh','Switch to Vietnamese')}" style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:7px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;">🌐 ${BANCA.lang==='en'?'EN':'VI'}</button>
      <div style="position:relative;">
        <button onclick="var p=document.getElementById('demo-persona-pop');p.style.display=p.style.display==='none'?'block':'none';" title="Công cụ demo — đổi persona" style="background:rgba(255,255,255,.08);color:#a9bdde;border:1px solid rgba(255,255,255,.18);border-radius:7px;padding:5px 9px;font-size:13px;cursor:pointer;">🧪</button>
        <div id="demo-persona-pop" style="display:none;position:absolute;right:0;top:110%;background:#1c2b4a;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:10px;z-index:80;box-shadow:0 8px 24px rgba(0,0,0,.35);min-width:170px;">
          <div style="font-size:10.5px;color:#a9bdde;margin-bottom:6px;letter-spacing:.05em;">CÔNG CỤ THỬ NGHIỆM</div>
          <div style="font-size:10px;color:#8ea3c8;margin-bottom:3px;">Persona</div>
          <select onchange="BANCA.setPersona(this.value)" style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:12px;padding:4px 6px;width:100%;">${personas}</select>
          <div style="font-size:10px;color:#8ea3c8;margin:8px 0 3px;">Channel (§4.1)</div>
          <select onchange="BANCA.setChannel(this.value)" style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.25);font-size:12px;padding:4px 6px;width:100%;">${(BANCA.CHANNEL_ENUM||[]).map(id=>`<option value="${id}" ${BANCA.channel()===id?'selected':''}>${BANCA.CHANNEL_PROFILES[id].short}</option>`).join('')}</select>
          <div style="font-size:9.5px;color:#8ea3c8;margin-top:5px;line-height:1.4;">${BANCA.channelShowsCustomerList()?'Có list KH':'Ẩn list KH'} · ${BANCA.channelProfile().defaultEntryMode}</div>
        </div>
      </div>
    </div>
    <main class="page-body" id="main-content" tabindex="-1" role="main">
      <div class="pmax">
        ${body}
      </div>
    </main>
  </div>
</div>
<div id="start-sale-root"></div>`;
 // innerHTML KHÔNG chạy <script> — re-execute các script được nhúng trong body (vd doc-mgmt Policy Detail).
 try{
  document.querySelectorAll('main#main-content script').forEach(function(old){
   const s=document.createElement('script');
   for(let i=0;i<old.attributes.length;i++){ s.setAttribute(old.attributes[i].name, old.attributes[i].value); }
   s.textContent=old.textContent;
   old.parentNode.replaceChild(s, old);
  });
 }catch(e){}
}

function toggleAvatarMenu(e){
 e.stopPropagation();
 const m=document.getElementById('avatar-menu');
 m.style.display=m.style.display==='none'?'block':'none';
 document.addEventListener('click',()=>{m.style.display='none';},{once:true});
}

// ================= START SALE — Sales Entry Orchestrator =================
// KHÔNG tạo Application Draft ngay khi chọn entry. Mỗi mode → context/selection review
// → Common Sales Entry Review → chỉ khi đó mới tạo Sales Session + Draft.
let __ssCtx = {};
function openStartSale(){
 // (correction 2026-07-27 §5 AC01/AC02) Banca Integrated: ngân hàng đã truyền context →
 // KHÔNG popup, tạo Sales Session & đi thẳng stage "Khách hàng & phương án".
 if(BANCA.channel && BANCA.channel()==='BANCA_INTEGRATED'){
  const me=BANCA.current();
  const list=(BANCA.myCustomers?BANCA.myCustomers().filter(c=>c.scope[me]!=='PROSPECT'):[]);
  const c=list[0];
  location.href=rel()+'modules/application-workspace/index.html?new=1&mode=BANK_CUSTOMER'+(c?'&customer='+encodeURIComponent(c.id)+'&pname='+encodeURIComponent(c.name):'')+'&product=motor';
  return;
 }
 const root=document.getElementById('start-sale-root');
 const groups=[
  {label:'CÓ SẴN NGỮ CẢNH', items:[
    {id:'BANK_CUSTOMER', icon:'🏦', t:'Khách hàng ngân hàng', d:'Xem ngữ cảnh & đề xuất trước khi tạo yêu cầu', badge:'CRM'},
    {id:'REFERRAL',      icon:'📨', t:'Lead / Referral được giao', d:'Bắt đầu từ lead — có thể kèm sản phẩm hoặc nhu cầu', badge:'REFERRAL'},
    {id:'RENEWAL',       icon:'🔄', t:'Tái tục hợp đồng', d:'Xem hợp đồng cũ trước khi tạo yêu cầu tái tục', badge:'RENEWAL'}
  ]},
  {label:'BẮT ĐẦU TỪ SẢN PHẨM', items:[
    {id:'PRODUCT_FIRST', icon:'📦', t:'Sản phẩm được phép bán', d:'Xem tóm tắt sản phẩm rồi chọn khách hàng', badge:'PORTAL'}
  ]},
  {label:'CHƯA CÓ NGỮ CẢNH', items:[
    {id:'NEW_PROSPECT',  icon:'🆕', t:'Khách hàng mới', d:'Định danh tối thiểu + consent, rồi chọn sản phẩm', badge:'PORTAL'}
  ]}
 ];
 root.innerHTML=`<div class="modal-overlay2 open" onclick="closeStartSale(event)">
  <div class="modal2" style="max-width:560px;" onclick="event.stopPropagation()">
    <div class="modal2-head"><b>Tạo yêu cầu bảo hiểm — chọn ngữ cảnh</b><span class="modal2-close" onclick="closeStartSale()">&times;</span></div>
    <div class="modal2-body" id="ss-body">
      ${groups.map(g=>`<div class="label" style="margin:6px 0 8px;">${g.label}</div>${g.items.map(m=>`<div class="card" style="display:flex;gap:12px;align-items:center;cursor:pointer;margin-bottom:10px;padding:14px;" onclick="startSaleMode('${m.id}')">
        <div style="font-size:22px;">${m.icon}</div>
        <div style="flex:1;"><div style="font-weight:600;font-size:13.5px;color:var(--ink-900);">${m.t} ${BANCA.sourceBadge(m.badge)}</div><div style="font-size:12px;color:var(--ink-500);margin-top:2px;">${m.d}</div></div>
        <span style="color:var(--ink-300);">›</span>
      </div>`).join('')}`).join('')}
      <div style="border-top:1px dashed var(--line);margin-top:6px;padding-top:12px;font-size:12.5px;color:var(--ink-500);">
        Khách chưa xác định được sản phẩm phù hợp? <a href="javascript:closeStartSale();location.href=rel()+'modules/advisory-workspace/index.html?new=1'" style="color:var(--brand-600);font-weight:600;">Mở Tư vấn nhanh →</a>
      </div>
    </div>
  </div></div>`;
}
// ---- Common building blocks ----
function ssBack(target){ return `<div style="margin-bottom:12px;"><a href="javascript:${target}" style="font-size:12px;color:var(--brand-600);">&larr; Quay lại</a></div>`; }
function readinessLine(productId){
 const rd=BANCA.readinessFor(productId);
 return rd.ready
  ? `<span class="badge badge-ready">Đủ điều kiện bán (READY)</span>`
  : `<span class="badge badge-conditional">Readiness: ${rd.state}</span>${rd.reason?` <span style="font-size:11.5px;color:var(--ink-500);">${rd.reason}</span>`:''}`;
}
function kv(k,v){ return `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed var(--line);font-size:13px;"><span style="color:var(--ink-500);">${k}</span><span style="text-align:right;font-weight:600;">${v}</span></div>`; }
function closeStartSale(e){ if(e&&e.target!==e.currentTarget)return; document.getElementById('start-sale-root').innerHTML=''; }

function startSaleMode(mode){
 const body=document.getElementById('ss-body'); const me=BANCA.current();
 __ssCtx = {mode};
 if(mode==='BANK_CUSTOMER'){
  const list=BANCA.myCustomers().filter(c=>c.scope[me]!=='PROSPECT');
  body.innerHTML=ssBack("openStartSale()")+`<div class="label" style="margin-bottom:8px;">Khách hàng trong phạm vi của bạn (không tìm toàn hàng)</div>`+
   (list.length? list.map(c=>`<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:12px 14px;">
     <div><b style="font-size:13px;">${c.name}</b> <span class="chip">${c.scope[me]}</span><div style="font-size:11.5px;color:var(--ink-500);">CIF ${c.cif||'—'} · ${c.segment}${c.loanRef?' · '+c.loanRef:''}</div></div>
     <button class="btn btn-primary btn-sm" onclick="ssBankContext('${c.id}')">Xem ngữ cảnh</button></div>`).join('')
   : `<div class="empty-state">Không có khách hàng trong scope.</div>`);
 } else if(mode==='PRODUCT_FIRST'){
  ssProductList('PRODUCT_FIRST', null);
 } else if(mode==='NEW_PROSPECT'){
  body.innerHTML=ssBack("openStartSale()")+`<div class="label" style="margin-bottom:8px;">Khách hàng mới — định danh tối thiểu + consent (chưa tạo yêu cầu)</div>
   <div class="card" style="padding:14px;">
    <div class="field"><label style="font-size:12px;">Họ tên *</label><input id="np-name" placeholder="VD: Nguyễn Văn A" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;"></div>
    <div class="field" style="margin-top:8px;"><label style="font-size:12px;">Số điện thoại / Email *</label><input id="np-phone" placeholder="09xx xxx xxx" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;"></div>
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;color:var(--ink-700);margin-top:10px;"><input type="checkbox" id="np-consent"> Khách hàng đồng ý cung cấp & xử lý dữ liệu cá nhân cho mục đích bảo hiểm.</label>
    <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="prospectNext()">Tiếp tục chọn sản phẩm →</button>
    <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Kiểm tra trùng (dedup) khi lưu; nếu trùng khách có sẵn sẽ dùng record đó, không tạo CIF giả. OCR định danh đầy đủ nằm trong bước Thông tin khách hàng.</div>
   </div>`;
 } else if(mode==='REFERRAL'){
  const refs=BANCA.myReferrals();
  body.innerHTML=ssBack("openStartSale()")+`<div class="label" style="margin-bottom:8px;">Lead / Referral được giao cho bạn</div>`+
   (refs.length? refs.map(x=>{
     const kind = x.productInterest? 'LEAD_WITH_PRODUCT' : (x.need? 'LEAD_WITH_NEED' : 'LEAD_NONE');
     return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:12px 14px;">
     <div><b style="font-size:13px;">${x.customerName}</b> ${BANCA.sourceBadge(/Campaign/i.test(x.source)?'CAMPAIGN':'REFERRAL')}<div style="font-size:11.5px;color:var(--ink-500);">${x.id} · ${x.source} · ${x.productInterest||x.need||'chưa có sản phẩm/nhu cầu'} · SLA ${x.sla}</div></div>
     ${x.draftId?`<a class="btn btn-secondary btn-sm" href="${rel()}modules/application-workspace/index.html?id=${x.draftId}">Tiếp tục</a>`:`<button class="btn btn-primary btn-sm" onclick="ssLeadContext('${x.id}')">Xem ngữ cảnh</button>`}</div>`;
   }).join('')
   : `<div class="empty-state">Chưa có lead nào được giao.</div>`);
 } else if(mode==='RENEWAL'){
  const soon=BANCA.myPolicies().filter(p=>p.renewalStatus==='RENEWAL_DUE');
  body.innerHTML=ssBack("openStartSale()")+`<div class="label" style="margin-bottom:8px;">Hợp đồng sắp hết hạn (renewal window)</div>`+
   (soon.length? soon.map(p=>`<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:12px 14px;">
     <div><b style="font-size:13px;">${p.id}</b> ${BANCA.sourceBadge('RENEWAL')}<div style="font-size:11.5px;color:var(--ink-500);">${(BANCA.customerById(p.customerId)||{}).name} · ${p.vehicle?(p.vehicle.brand+' '+p.vehicle.model+' '+p.vehicle.plate):(p.productName||p.package||'')} · hết hạn ${p.effectiveTo}</div></div>
     ${p.renewalDraftId?`<a class="btn btn-secondary btn-sm" href="${rel()}modules/application-workspace/index.html?id=${p.renewalDraftId}">Mở yêu cầu tái tục</a>`:`<button class="btn btn-primary btn-sm" onclick="ssRenewalContext('${p.id}')">Xem ngữ cảnh</button>`}</div>`).join('')
   : `<div class="empty-state">Không có hợp đồng trong renewal window.</div>`);
 }
}
// ---- Quay lại đúng màn context theo __ssCtx (tránh nested quote) ----
function ssBackToContext(){
 const c=__ssCtx||{};
 if(c.mode==='BANK_CUSTOMER' && c.customerId) return ssBankContext(c.customerId);
 if(c.mode==='REFERRAL' && c.refId) return ssLeadContext(c.refId);
 if(c.mode==='RENEWAL' && c.policyId) return ssRenewalContext(c.policyId);
 return startSaleMode(c.mode||'BANK_CUSTOMER');
}
// ---- Product list (chọn sản phẩm được phép bán) ----
function ssProductList(mode, customerId){
 const body=document.getElementById('ss-body'); const me=BANCA.current();
 __ssCtx=Object.assign(__ssCtx||{}, {mode, customerId: customerId||__ssCtx.customerId||null});
 const sellable=(BANCA.products||[]).filter(p=>{
  const st=(p.state||{})[me]; const caps=(p.caps||{})[st]||[];
  return (p.visible||[]).includes(me) && st && st!=='SERVICE_UNVERIFIED' && (caps.includes('can_advise')||caps.includes('can_quote'));
 });
 body.innerHTML=ssBack("ssBackToContext()")+`<div class="label" style="margin-bottom:8px;">Chọn sản phẩm được phép bán</div>`+
  (sellable.length? sellable.map(p=>{
    const st=(p.state||{})[me]; const cond=st!=='READY';
    return `<div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:12px 14px;">
     <div><b style="font-size:13px;">${p.name}</b> ${cond?`<span class="chip" style="background:var(--amber-100);color:var(--amber-600);">${st}</span>`:'<span class="chip" style="background:var(--teal-100);color:var(--teal-600);">READY</span>'}<div style="font-size:11.5px;color:var(--ink-500);">${p.line} · ${p.branding}${p.reason&&p.reason[me]?' · '+p.reason[me]:''}</div></div>
     ${mode==='PRODUCT_FIRST'?`<button class="btn btn-primary btn-sm" onclick="ssProductSummary('${p.id}')">Xem</button>`:`<button class="btn btn-primary btn-sm" onclick="ssPickProduct('${mode}','${customerId||''}','${p.id}')">Chọn</button>`}</div>`;
  }).join('')
  : `<div class="empty-state">Bạn chưa được cấp quyền bán sản phẩm nào. Liên hệ quản trị Distribution.</div>`);
}
// ---- BANK CUSTOMER: Customer Context Review ----
function ssBankContext(custId){
 const body=document.getElementById('ss-body'); const c=BANCA.customerById(custId); const me=BANCA.current();
 const rec=BANCA.recommendForCustomer(c);
 const recProd = rec? (BANCA.products||[]).find(p=>p.id===rec.productId) : null;
 __ssCtx={mode:'BANK_CUSTOMER', customerId:custId, product: rec?rec.productId:null, source:'CRM', reason: rec?rec.reason:null};
 body.innerHTML=ssBack("startSaleMode('BANK_CUSTOMER')")+`
  <div class="card" style="padding:16px;">
   <div style="display:flex;justify-content:space-between;align-items:center;"><b style="font-size:15px;">${c.name}</b> ${BANCA.sourceBadge('CRM')}</div>
   ${kv('CIF', c.cif||'—')}${kv('Segment', c.segment)}${kv('Chi nhánh', c.branch||'—')}${kv('RM phụ trách', c.ownerRM)}
   ${kv('Khoản vay / tài sản', c.loanRef||'—')}${kv('Bảo hiểm hiện có', (c.existingInsurance||[]).join(', ')||'Không')}
  </div>
  ${rec? `<div class="card" style="padding:16px;margin-top:10px;border-left:4px solid var(--brand-600);">
    <div style="font-size:12px;color:var(--ink-500);">Sản phẩm đề xuất ${BANCA.sourceBadge(rec.source)}</div>
    <div style="font-weight:700;font-size:15px;margin:2px 0;">${recProd?recProd.name:rec.productId}</div>
    <div style="font-size:13px;color:var(--ink-700);"><b>Lý do:</b> ${rec.reason}</div>
    <div style="margin-top:8px;">${readinessLine(rec.productId)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
      <button class="btn btn-primary btn-sm" onclick="ssPickProduct('BANK_CUSTOMER','${custId}','${rec.productId}')">Tiếp tục với ${recProd?recProd.name:rec.productId}</button>
      <button class="btn btn-secondary btn-sm" onclick="ssProductList('BANK_CUSTOMER','${custId}')">Chọn sản phẩm khác</button>
    </div>
   </div>`
  : `<div class="card" style="padding:16px;margin-top:10px;border-left:4px solid var(--amber-600);">
    <b style="color:var(--amber-600);">Chưa xác định được sản phẩm phù hợp</b>
    <div style="font-size:13px;color:var(--ink-500);margin:6px 0 10px;">Không đủ tín hiệu từ CRM để đề xuất. Chọn sản phẩm thủ công hoặc mở Tư vấn nhanh.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="ssProductList('BANK_CUSTOMER','${custId}')">Chọn sản phẩm</button>
      <button class="btn btn-secondary btn-sm" onclick="closeStartSale();location.href=rel()+'modules/advisory-workspace/index.html?new=1'">Mở Tư vấn nhanh</button>
    </div>
   </div>`}`;
}
// ---- LEAD / REFERRAL context ----
function ssLeadContext(refId){
 const body=document.getElementById('ss-body'); const x=(BANCA.referrals||[]).find(r=>r.id===refId);
 const kind = x.productInterest? 'LEAD_WITH_PRODUCT' : (x.need? 'LEAD_WITH_NEED' : 'LEAD_NONE');
 const prodId = x.productInterest && /motor/i.test(x.productInterest)?'motor':(x.productInterest&&/health/i.test(x.productInterest)?'health':null);
 __ssCtx={mode:'REFERRAL', refId:refId, customerId:x.customerId, customerName:x.customerName, product:prodId, source:'REFERRAL', reason:'Lead từ '+x.source};
 body.innerHTML=ssBack("startSaleMode('REFERRAL')")+`
  <div class="card" style="padding:16px;">
   <div style="display:flex;justify-content:space-between;align-items:center;"><b style="font-size:15px;">${x.customerName}</b> ${BANCA.sourceBadge(/Campaign/i.test(x.source)?'CAMPAIGN':'REFERRAL')}</div>
   ${kv('Lead', x.id)}${kv('Nguồn', x.source)}${kv('Sản phẩm quan tâm', x.productInterest||'—')}${kv('Nhu cầu', x.need||'—')}${kv('SLA', x.sla)}${kv('Khách hàng', x.customerId?(BANCA.customerById(x.customerId)||{}).cif||x.customerId:'Chưa gắn CIF (prospect)')}
  </div>
  ${kind==='LEAD_WITH_PRODUCT'? `<div class="card" style="padding:16px;margin-top:10px;border-left:4px solid var(--brand-600);">
    <div style="font-size:13px;">Lead đã kèm sản phẩm <b>${x.productInterest}</b> — không cần chọn lại.</div>
    <div style="margin-top:8px;">${readinessLine(prodId)}</div>
    <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="ssPickProduct('REFERRAL','${x.customerId||''}','${prodId}')">Tiếp tục với ${x.productInterest}</button>
   </div>`
  : `<div class="card" style="padding:16px;margin-top:10px;border-left:4px solid var(--amber-600);">
    <b style="color:var(--amber-600);">Lead chưa có sản phẩm xác định</b>
    <div style="font-size:13px;color:var(--ink-500);margin:6px 0 10px;">${x.need?('Nhu cầu ghi nhận: '+x.need+'. '):''}Chọn sản phẩm phù hợp hoặc mở Tư vấn nhanh trước khi tạo yêu cầu.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="ssProductList('REFERRAL','${x.customerId||''}')">Chọn sản phẩm</button>
      <button class="btn btn-secondary btn-sm" onclick="closeStartSale();location.href=rel()+'modules/advisory-workspace/index.html?new=1'">Mở Tư vấn nhanh</button>
    </div>
   </div>`}`;
}
// ---- PRODUCT-FIRST: Product Summary → chọn khách ----
function ssProductSummary(prodId){
 const body=document.getElementById('ss-body'); const p=(BANCA.products||[]).find(x=>x.id===prodId);
 __ssCtx={mode:'PRODUCT_FIRST', product:prodId, source:'PORTAL'};
 const cover={motor:'TNDS + vật chất xe, thủy kích, mất cắp, cứu hộ', health:'Nội trú, ngoại trú, tai nạn', pa:'Tử vong/thương tật do tai nạn'}[prodId]||'—';
 const prem={motor:'8–13 triệu/năm', health:'6–20 triệu/năm', pa:'1–3 triệu/năm'}[prodId]||'—';
 const docs={motor:'Đăng ký xe, đăng kiểm, ảnh xe, CCCD', health:'CCCD, kê khai sức khỏe', pa:'CCCD'}[prodId]||'—';
 body.innerHTML=ssBack("startSaleMode('PRODUCT_FIRST')")+`
  <div class="card" style="padding:16px;">
   <div style="display:flex;justify-content:space-between;align-items:center;"><b style="font-size:15px;">${p.name}</b> ${BANCA.sourceBadge('PORTAL')}</div>
   ${kv('Khách hàng mục tiêu', p.line==='Motor'?'Chủ xe ô tô':'Cá nhân')}${kv('Quyền lợi chính', cover)}${kv('Phí minh họa', prem)}${kv('Tài liệu cần', docs)}${kv('Kênh phân phối', p.branding)}
   <div style="margin-top:8px;">${readinessLine(prodId)}</div>
  </div>
  <div class="card" style="padding:16px;margin-top:10px;">
   <div class="label" style="margin-bottom:8px;">Chọn khách hàng cho sản phẩm này</div>
   ${BANCA.myCustomers().filter(c=>c.scope[BANCA.current()]!=='PROSPECT').slice(0,6).map(c=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line);"><div style="font-size:13px;">${c.name} <span style="font-size:11.5px;color:var(--ink-500);">· CIF ${c.cif||'—'}</span></div><button class="btn btn-secondary btn-sm" onclick="ssPickProduct('PRODUCT_FIRST','${c.id}','${prodId}')">Chọn</button></div>`).join('')}
   <button class="btn btn-secondary btn-sm" style="margin-top:10px;" onclick="startSaleMode('NEW_PROSPECT')">+ Khách hàng mới</button>
  </div>`;
}
// ---- RENEWAL context ----
function ssRenewalContext(polId){
 const body=document.getElementById('ss-body'); const p=BANCA.myPolicies().find(x=>x.id===polId); const c=BANCA.customerById(p.customerId)||{};
 __ssCtx={mode:'RENEWAL', customerId:p.customerId, product:'motor', source:'RENEWAL', reason:'Tái tục hợp đồng '+p.id, policyId:p.id};
 body.innerHTML=ssBack("startSaleMode('RENEWAL')")+`
  <div class="card" style="padding:16px;">
   <div style="display:flex;justify-content:space-between;align-items:center;"><b style="font-size:15px;">${p.id}</b> ${BANCA.sourceBadge('RENEWAL')}</div>
   ${kv('Khách hàng', c.name||'—')}${p.vehicle?kv('Xe', p.vehicle.brand+' '+p.vehicle.model+' · '+p.vehicle.plate):kv('Đối tượng', p.productName||p.package||'—')}${kv('Gói hiện tại', p.package||'—')}${kv('Phí kỳ trước', p.premium?BANCA.vnd(p.premium):'—')}${kv('Hết hạn', p.effectiveTo)}
   <div style="font-size:12.5px;color:var(--ink-500);margin-top:8px;">Đề xuất tái tục cùng gói; kiểm tra thay đổi dữ liệu KH/rủi ro (khoản vay, giá trị xe) ở bước Thông tin & Đối tượng.</div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
   <button class="btn btn-primary btn-sm" onclick="ssPickProduct('RENEWAL','${p.customerId}','motor')">Tái tục cùng gói</button>
   <button class="btn btn-secondary btn-sm" onclick="ssProductList('RENEWAL','${p.customerId}')">Chọn gói khác</button>
   <button class="btn btn-secondary btn-sm" onclick="closeStartSale()" style="color:var(--red-600);">Không tái tục</button>
  </div>`;
}
// ---- NEW PROSPECT ----
let __prospectDraft = null;
function prospectNext(){
 const name=(document.getElementById('np-name').value||'').trim();
 const contact=(document.getElementById('np-phone').value||'').trim();
 const consent=document.getElementById('np-consent').checked;
 if(!name||!contact){ alert('Nhập tối thiểu Họ tên và Số điện thoại/Email.'); return; }
 if(!consent){ alert('Cần khách hàng đồng ý (consent) trước khi tiếp tục.'); return; }
 __prospectDraft={name, contact};
 ssProductList('NEW_PROSPECT', null);
}
// ---- Chọn product → set context → Sales Entry Review ----
function ssPickProduct(mode, customerId, productId){
 __ssCtx = Object.assign(__ssCtx||{}, {mode, customerId: customerId||__ssCtx.customerId||null, product:productId});
 ssEntryReview();
}
// ---- COMMON SALES ENTRY REVIEW (bắt buộc trước khi tạo draft) ----
function ssEntryReview(){
 const body=document.getElementById('ss-body'); const ctx=__ssCtx; const me=BANCA.current();
 const cust = ctx.customerId? BANCA.customerById(ctx.customerId) : null;
 const prod = ctx.product? (BANCA.products||[]).find(p=>p.id===ctx.product) : null;
 const rd = ctx.product? BANCA.readinessFor(ctx.product) : {ready:false};
 const custLabel = cust? (cust.name+(cust.cif?' · CIF '+cust.cif:'')) : (ctx.customerName? ctx.customerName+' (prospect)' : (__prospectDraft? __prospectDraft.name+' (prospect mới)' : 'Chưa gắn khách hàng'));
 const missing=[];
 if(!cust && !ctx.customerName && !__prospectDraft) missing.push('Khách hàng / prospect');
 if(!prod) missing.push('Sản phẩm / offer');
 if(ctx.product && !rd.ready && !rd.canQuote) missing.push('Quyền bán sản phẩm ('+rd.state+')');
 const firstStep = (ctx.product==='motor' && (cust||ctx.mode==='RENEWAL')) ? 'Đối tượng bảo hiểm (Xe)' : 'Thông tin khách hàng';
 const sourceKind = ctx.source||'PORTAL';
 body.innerHTML=ssBack("startSaleMode('"+ctx.mode+"')")+`
  <div class="label" style="margin-bottom:8px;">Xác nhận trước khi tạo yêu cầu</div>
  <div class="card" style="padding:16px;">
   ${kv('Nguồn vào', ctx.mode+' '+BANCA.sourceBadge(sourceKind))}
   ${kv('Khách hàng', custLabel)}
   ${kv('Sản phẩm / offer', prod?prod.name:'—')}
   ${kv('Lý do đề xuất / chọn', ctx.reason||'Nhân viên tư vấn chọn thủ công')}
   ${kv('Nguồn dữ liệu', {CRM:'Bank CRM',REFERRAL:'Referral',RENEWAL:'Hợp đồng cũ',ADVICE:'Tư vấn nhanh',PORTAL:'Portal',CAMPAIGN:'Campaign'}[sourceKind]||sourceKind)}
   ${kv('Điều kiện được phép bán', rd.ready?'READY':(rd.state||'—'))}
   ${kv('Bước bắt đầu', firstStep)}
   ${missing.length?`<div class="alert2 warn" style="margin-top:10px;"><b>Còn thiếu:</b> ${missing.join(', ')}</div>`:''}
  </div>
  <button class="btn btn-primary" style="margin-top:12px;width:100%;" ${missing.length?'disabled style="opacity:.5;width:100%;"':''} onclick="ssCreateDraft()">Tạo yêu cầu và tiếp tục →</button>
  <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Chỉ khi bấm nút này hệ thống mới tạo Sales Session + Yêu cầu bảo hiểm chưa nộp. Phí/định danh xử lý trong Sales Process.</div>`;
}
function ssCreateDraft(){
 const ctx=__ssCtx;
 const cust = ctx.customerId? BANCA.customerById(ctx.customerId):null;
 const hasCustomer = !!cust || ctx.mode==='RENEWAL';
 const firstStep = (ctx.product==='motor' && hasCustomer) ? 'RISK_OBJECT' : 'CUSTOMER_INFO';
 let url=rel()+'modules/application-workspace/index.html?new=1&mode='+ctx.mode+'&step='+firstStep;
 if(ctx.customerId) url+='&customer='+ctx.customerId;
 if(ctx.product) url+='&product='+ctx.product;
 const pname = ctx.customerName || (__prospectDraft&&__prospectDraft.name);
 if(pname) url+='&pname='+encodeURIComponent(pname);
 location.href=url;
}

// ---- Filter drawer (2026-07-20 17:04): ngoài chỉ giữ pills + search; filter khác trong drawer; active filter hiện tag × bỏ nhanh ----
// fields: [{name,label,type:'select'|'date',options?:[[value,label]],value}] ; hidden: obj các param giữ nguyên
function filterDrawer(fields, hidden){
 const active = fields.filter(f=>f.value && f.value!=='ALL');
 const tags = active.map(f=>{
  const lbl = f.type==='select' ? ((f.options.find(o=>String(o[0])===String(f.value))||[])[1]||f.value) : f.value;
  const qs2=new URLSearchParams(location.search); qs2.delete(f.name);
  return `<a href="?${qs2.toString()}" class="chip" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px;background:var(--brand-100);color:var(--brand-700);padding:5px 10px;font-size:12px;" title="Bỏ lọc ${f.label}">${f.label}: <b>${lbl}</b> <span style="font-weight:800;">×</span></a>`;
 }).join(' ');
 const drawerFields = fields.map(f=>{
  if(f.type==='select') return `<div style="margin-bottom:14px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:4px;">${f.label}</label>
   <select name="${f.name}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;font-size:12.5px;">${f.options.map(([v,l])=>`<option value="${v}" ${String(f.value)===String(v)?'selected':''}>${l}</option>`).join('')}</select></div>`;
  return `<div style="margin-bottom:14px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:4px;">${f.label}</label>
   <input type="date" name="${f.name}" value="${f.value||''}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;font-size:12.5px;"></div>`;
 }).join('');
 const hiddenInputs = Object.entries(hidden||{}).filter(([k,v])=>v&&v!=='ALL').map(([k,v])=>`<input type="hidden" name="${k}" value="${v}">`).join('');
 return {
  button: `<button class="btn btn-secondary btn-sm" onclick="document.getElementById('filter-drawer').style.display='flex'" style="position:relative;">⚙ Bộ lọc${active.length?` <span style="background:var(--brand-600);color:#fff;border-radius:9px;padding:0 6px;font-size:10.5px;margin-left:3px;">${active.length}</span>`:''}</button>`,
  tags: active.length? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:12px;"><span style="font-size:11.5px;color:var(--ink-300);">Đang lọc:</span>${tags}<a href="?${Object.entries(hidden||{}).filter(([k,v])=>v&&v!=='ALL').map(([k,v])=>k+'='+v).join('&')}" style="font-size:11.5px;color:var(--red-600);margin-left:4px;">Bỏ tất cả</a></div>` : '',
  drawer: `<div id="filter-drawer" style="display:none;position:fixed;inset:0;z-index:80;background:rgba(10,20,45,.35);justify-content:flex-end;" onclick="if(event.target===this)this.style.display='none'">
   <form method="get" style="width:340px;max-width:90vw;background:#fff;height:100%;padding:20px;overflow-y:auto;box-shadow:-8px 0 30px rgba(10,25,60,.2);display:flex;flex-direction:column;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
     <b style="font-size:15px;color:var(--ink-900);">Bộ lọc</b>
     <span style="cursor:pointer;font-size:20px;color:var(--ink-300);" onclick="document.getElementById('filter-drawer').style.display='none'">×</span>
    </div>
    ${hiddenInputs}
    ${drawerFields}
    <div style="margin-top:auto;display:flex;gap:8px;">
     <button class="btn btn-primary" type="submit" style="flex:1;">Áp dụng</button>
     <a class="btn btn-secondary" href="?" style="flex:1;text-align:center;">Xóa hết</a>
    </div>
   </form>
  </div>`
 };
}

// ---- content helpers (dùng chung) ----
function badge(state){
 const cls={READY:'badge-ready',CONDITIONAL:'badge-conditional',BLOCKED:'badge-blocked',PENDING:'badge-pending',SERVICE_UNVERIFIED:'badge-pending'}[state]||'badge-pending';
 const label={READY:'Có thể bán',CONDITIONAL:'Bán có điều kiện',BLOCKED:'Chưa thể bán',PENDING:'Chưa xác minh',SERVICE_UNVERIFIED:'Chưa xác minh'}[state]||state;
 return `<span class="badge ${cls}">${label}</span>`;
}
function lineTag(line){
 const cls={Motor:'line-motor',Health:'line-health',SME:'line-sme'}[line]||'line-default';
 return `<span class="tag-pill ${cls}">${line}</span>`;
}
function alerts(){
 return (BANCA.alerts[BANCA.current()]||[]).map(a=>{
  const kind=a.includes('blocked')||a.includes('lỗi')||a.includes('ngừng')?'danger':(a.includes('conditional')||a.includes('cần')||a.includes('còn'))?'warn':'info';
  return `<div class="alert2 ${kind}">${a}</div>`;
 }).join('');
}
function warnBadges(w){ return (w||[]).map(f=>BANCA.warnBadge(f)).join(' '); }
function custName(id){ return (BANCA.customerById(id)||{name:'—'}).name; }

// 2026-07-21 Layout consistency helpers
BANCA.uxListHeader = function(title, sub, metaHtml, toolsHtml){
 return `<div class="ux-list-header"><div class="ux-list-header-main"><div><div class="ux-list-title">${title}</div><div class="ux-list-sub">${sub||''}</div></div><div style="font-size:12px;color:var(--ink-500);text-align:right;">${metaHtml||''}</div></div>${toolsHtml||''}</div>`;
};
BANCA.uxDocRow = function(d, rr, uploaded, opts){
 opts=opts||{};
 const icon = rr.status==='REQUIRED'?['●','var(--red-600)','#fdecec']:rr.status==='INHERITED'?['↻','#2563eb','#eaf1fe']:rr.active?['◐','var(--amber-600)','#fdf3e3']:['○','var(--ink-300)','var(--paper)'];
 const need = rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active);
 const file = (opts.fileOf||{})[d.code]||'—';
 // Rich verification state (optional): MISSING/UPLOADED/CHECKING/ACCEPTED/REJECTED/REPLACE
 const ds = (opts.stateOf||{})[d.code] || (uploaded?'UPLOADED':(need?'MISSING':'NA'));
 const STATE={
  MISSING:['Còn thiếu','badge-blocked'],
  UPLOADED:['Đã tải lên','badge-ready'],
  CHECKING:['Đang kiểm tra','badge-pending'],
  ACCEPTED:['Đã chấp nhận','badge-ready'],
  REJECTED:['Bị từ chối','badge-blocked'],
  REPLACE:['Cần thay thế','badge-conditional']
 };
 let status;
 if(STATE[ds]) status=`<span class="badge ${STATE[ds][1]}">${STATE[ds][0]}</span>`;
 else status = rr.status==='INHERITED'?'<span class="badge badge-conditional">Kế thừa</span>':'<span style="color:var(--ink-300);font-size:12px;">Không cần</span>';
 const hasFile = ['UPLOADED','CHECKING','ACCEPTED','REJECTED','REPLACE'].includes(ds) || uploaded;
 const actions = ds==='REJECTED'||ds==='REPLACE'
   ? '<button class="btn btn-primary btn-sm">Tải lại</button> <button class="btn btn-secondary btn-sm">Xem</button>'
   : hasFile
     ? '<button class="btn btn-secondary btn-sm">Xem</button> <button class="btn btn-secondary btn-sm">Thay thế</button>'
     : (need?'<button class="btn btn-primary btn-sm">Tải lên</button>':'<button class="btn btn-secondary btn-sm">Tải lên</button>');
 return `<div class="ux-doc-row"><div><span style="display:inline-flex;width:24px;height:24px;border-radius:7px;align-items:center;justify-content:center;font-weight:800;background:${icon[2]};color:${icon[1]};">${icon[0]}</span></div><div><div class="ux-doc-name">${d.name}</div><div class="ux-doc-sub">${d.sub}${rr.note?' · '+rr.note:''}</div></div><div>${status}</div><div style="font-size:12px;color:var(--ink-500);">${hasFile?file:'—'}</div><div class="ux-action-links">${actions}</div></div>`;
};
