// Không gian xử lý yêu cầu — 1 module duy nhất: Edit Mode (draft, ?step=) + Tracking Mode (submitted, ?tab=)
// Backlog 2026-07-20: P0-2..P0-10, P1-2, P1-4, P2-1, P2-2, P2-3 áp dụng tại đây.
(function(){
const p = BANCA.persona(), me = BANCA.current(), r = rel();
const qs = new URLSearchParams(location.search);
const fromAdvice = qs.get('entry')==='CONVERTED_FROM_ADVICE';
const adviceId = qs.get('adviceId');
const appId = qs.get('id');
const isNew = qs.get('new')==='1' || fromAdvice || (appId && appId.indexOf('DRAFT-2026-NEW')===0);

// ---- Customer/Sales Context Snapshot (persist qua điều hướng giữa các tab) ----
const DRAFTCTX_KEY = 'banca_draftctx';
function loadDraftCtx(){ try{ return JSON.parse(localStorage.getItem(DRAFTCTX_KEY)||'null'); }catch(e){ return null; } }
function saveDraftCtx(c){ localStorage.setItem(DRAFTCTX_KEY, JSON.stringify(c)); }

let app, sourceAdvice=null;
if(isNew){
 let ctx = loadDraftCtx();
 const hasNewParams = qs.get('customer')||qs.get('product')||qs.get('mode')||qs.get('pname')||qs.get('lead')||fromAdvice;
 if(hasNewParams || !ctx){
  if(fromAdvice){
   sourceAdvice = (BANCA.adviceById && BANCA.adviceById(adviceId)) || null;
   const off = sourceAdvice && sourceAdvice.selectedOffer || {};
   ctx = { mode:'ADVICE', customerId:(sourceAdvice&&sourceAdvice.customerRef)||null, customerName:(sourceAdvice&&sourceAdvice.customerName)||null,
     productId: off.productRef||'motor', productName: off.productName||'Bảo hiểm vật chất xe', packageName: off.packageName||null,
     sourceAdviceId:adviceId, sourceAdviceVersion:(sourceAdvice&&sourceAdvice.version)||1,
     adviceNeed:(sourceAdvice&&sourceAdvice.primaryNeed)||null, adviceBudget:(sourceAdvice&&sourceAdvice.budgetBand)||null,
     adviceNote:(sourceAdvice&&sourceAdvice.advisorNote)||null, adviceSessionId:adviceId,
     leadId:(sourceAdvice&&sourceAdvice.leadId)||null, campaign:(sourceAdvice&&sourceAdvice.campaign)||null };
  } else if(qs.get('renew')){
   // §12 — Tái tục: prefill từ policy kỳ trước (customer/risk object/package/premium/nhân viên tư vấn).
   const pol = (BANCA.policies||[]).find(p=>p.id===qs.get('renew')) || {};
   const prodId = pol.productId || pol.productType || (pol.productName && /sức khỏe|health/i.test(pol.productName) ? 'health' : (pol.productName && /accident|pa/i.test(pol.productName) ? 'pa' : 'motor'));
   ctx = { mode:'RENEWAL', renewalPolicyRef:pol.id||null,
     customerId:pol.customerId||null, customerName:pol.customerName||null,
     productId:prodId, productName:pol.productName||'Bảo hiểm vật chất xe', packageName:pol.package||null,
     renewPrefill:{ vehicle:pol.vehicle||null, idv:pol.idv||null, deductible:pol.deductible||null,
       addOns:pol.addOns||[], mortgage:pol.mortgage||null, prevPremium:pol.premium||null,
       package:pol.package||null, effectiveTo:pol.effectiveTo||null } };
  } else {
   const prodId=qs.get('product')||(ctx&&ctx.productId)||'motor';
   const prodRec=(BANCA.products||[]).find(x=>x.id===prodId)||{name:'Bảo hiểm vật chất xe'};
   const lead = qs.get('lead')? (BANCA.referrals||[]).find(rr=>rr.id===qs.get('lead')) : null;
   ctx = { mode:qs.get('mode')||(ctx&&ctx.mode)||'BANK_CUSTOMER',
     customerId:qs.get('customer')||(ctx&&ctx.customerId)||null,
     customerName: qs.get('pname')?decodeURIComponent(qs.get('pname')):((ctx&&ctx.customerName)||null),
     productId:prodId, productName:prodRec.name, packageName:(ctx&&ctx.packageName)||null,
     leadId: (lead&&lead.id)||(ctx&&ctx.leadId)||null, campaign:(lead&&lead.source)||(ctx&&ctx.campaign)||null,
     leadNeed:(lead&&lead.productInterest)||(ctx&&ctx.leadNeed)||null };
  }
  saveDraftCtx(ctx);
  // Phiên bán MỚI (ctx mới) → xóa overlay draft cũ để không dính dữ liệu phiên trước.
  if(BANCA.overlay && BANCA.overlay.applications && BANCA.overlay.applications['DRAFT-2026-NEW']){
   delete BANCA.overlay.applications['DRAFT-2026-NEW'];
   try{ localStorage.setItem('bancaDemoOverlay', JSON.stringify(BANCA.overlay)); }catch(e){}
  }
 }
 const prodRec=(BANCA.products||[]).find(x=>x.id===ctx.productId)||{name:ctx.productName||'Bảo hiểm vật chất xe'};
 const rp = ctx.renewPrefill || null;
 // §12 — Tái tục: mở ngay ở bước Đối tượng bảo hiểm (xác nhận thay đổi), không nhập lại từ đầu.
 const firstStage = rp ? (ctx.productId==='motor'?'RISK_OBJECT':'INSURED_PARTY') : (ctx.sourceAdviceId ? (ctx.productId==='motor'?'RISK_OBJECT':'CUSTOMER_INFO') : 'CUSTOMER_INFO');
 app = { id:'DRAFT-2026-NEW', submissionState:'NOT_SUBMITTED', owner:me,
   customerId:ctx.customerId||null, customerName:ctx.customerName||null,
   productId:ctx.productId||'motor', productName:prodRec.name||ctx.productName, package:ctx.packageName||null,
   currentStage: qs.get('step')||firstStage, progress:rp?55:12, warnings:[], updatedAt:'vừa tạo',
   source: ctx.sourceAdviceId?'ADVICE':(ctx.mode||'BANK_CUSTOMER'),
   vehicle: ctx.productId==='motor'&&rp&&rp.vehicle?Object.assign({value:rp.idv}, rp.vehicle):null,
   mortgage: rp?rp.mortgage:null,
   renewalPolicyRef: ctx.renewalPolicyRef||null, renewPrevPremium: rp?rp.prevPremium:null,
   quote:null, isNewDemo:true,
   sourceAdviceId:ctx.sourceAdviceId||null, sourceAdviceVersion:ctx.sourceAdviceVersion,
   adviceNeed:ctx.adviceNeed, adviceBudget:ctx.adviceBudget, adviceNote:ctx.adviceNote, adviceSessionId:ctx.adviceSessionId, leadId:ctx.leadId, campaign:ctx.campaign, leadNeed:ctx.leadNeed };
 if(ctx.sourceAdviceId && !sourceAdvice) sourceAdvice=(BANCA.adviceById&&BANCA.adviceById(ctx.sourceAdviceId))||null;
 // FIX (13:52): merge overlay đã patch (chọn gói/quote/risk answers…) vào draft mới —
 // trước đây app dựng literal nên mọi patchApp bị MẤT sau mỗi reload (không chọn được gói).
 const __ov = BANCA.overlay && BANCA.overlay.applications && BANCA.overlay.applications[app.id];
 if(__ov) Object.assign(app, __ov);
} else {
 app = BANCA.appById(appId);
}

if(!app){
 shell('Không gian xử lý yêu cầu','Không tìm thấy hồ sơ',`<div class="card"><div class="empty-state">Yêu cầu không tồn tại hoặc đã bị xóa. <a href="${r}modules/unsubmitted-applications/index.html">Về danh sách</a></div></div>`,{startSale:false});
 return;
}

const per = BANCA.personas[app.owner]||{};
const canView = app.owner===me
 || (p.managerScope==='TEAM' && per.team===p.team)
 || (p.managerScope==='BRANCH' && per.branch===p.branch);
if(!canView || p.status!=='ACTIVE'){
 shell('Không gian xử lý yêu cầu','ACCESS_DENIED',`<div class="card"><div class="alert2 danger"><b>ACCESS_DENIED</b><br>Persona <b>${me}</b> không có quyền truy cập yêu cầu <b>${app.id}</b> (owner: ${app.owner}). Data scope + trạng thái tài khoản được kiểm tra trên mọi route.</div></div>`,{startSale:false});
 return;
}
const readOnly = app.owner!==me;

const cust = BANCA.customerById(app.customerId);
const prod = BANCA.products.find(x=>x.id===app.productId);

// ---- Sales Entry Orchestrator (nhẹ): xác định customer entry mode + nhãn nguồn ----
function resolveEntryMode(){
  if(app.source==='ADVICE'||app.sourceAdviceId) return 'CONVERTED_FROM_ADVICE';
  if(app.source==='RENEWAL') return 'RENEWAL';
  if(cust && cust.cif) return 'BANK_CUSTOMER';
  if(cust && !cust.cif) return 'INSURANCE_CUSTOMER';
  return 'NEW_PROSPECT';
}
const entryMode = resolveEntryMode();
const entrySourceLabel = {BANK_CUSTOMER:'Janus Bank', INSURANCE_CUSTOMER:'Insurance Customer', NEW_PROSPECT:'Khách hàng mới', CONVERTED_FROM_ADVICE:'Tư vấn nhanh'+(app.sourceAdviceId?' '+app.sourceAdviceId:''), RENEWAL:'Hợp đồng cũ'}[entryMode];
const custDocPolicy = (BANCA.customerDocumentPolicy||{})[entryMode] || {};
const caps = prod?BANCA.capabilities(prod):[];

// Hydrate quote thác nước: seed cũ chỉ có base/adjusted — tính lại các dòng waterfall từ inputsSnapshot
if(app.productId==='motor' && app.quote && app.quote.inputsSnapshot && app.quote.subtotal==null){
 const rtH = BANCA.rateMotor(app.quote.inputsSnapshot);
 if(rtH) Object.assign(app.quote, {tplPremium:rtH.tplPremium, odBase:rtH.odBase, lines:rtH.lines, subtotal:rtH.subtotal, ncdPct:rtH.ncdPct, ncdAmount:rtH.ncdAmount, odAfterNcd:rtH.odAfterNcd, vatAmount:rtH.vatAmount, odTotal:rtH.odTotal, totalPremium:rtH.totalPremium});
}

// ===== P1-2: SĐT mask + reveal có kiểm soát =====
window.revealPhone = function(elId, custId2){
 const c=BANCA.customerById(custId2)||{};
 console.log('[AUDIT] reveal phone', custId2, 'by', me, new Date().toISOString());
 document.getElementById(elId).innerHTML=`${(c.phone||'—')} <a href="javascript:alert('Gọi khách (demo) — hành động được log')" style="font-size:11px;">📞 Gọi</a>`;
};
window.revealId = function(elId, custId2){
 const c=BANCA.customerById(custId2)||{};
 console.log('[AUDIT] reveal idNumber', custId2, 'by', me, new Date().toISOString());
 document.getElementById(elId).innerHTML=`${c.idNumber||'—'}`;
};
// ===== OCR capability (mock) — upload/chụp ảnh → tài liệu + auto-fill =====
// Lưu tài liệu đã chụp/upload theo app id (localStorage) để hiển thị ở mục Tài liệu
function docStoreKey(){ return 'banca_docs_'+app.id; }
function loadCapturedDocs(){ try{ return JSON.parse(localStorage.getItem(docStoreKey())||'[]'); }catch(e){ return []; } }
function saveCapturedDoc(doc){ const arr=loadCapturedDocs(); arr.push(doc); localStorage.setItem(docStoreKey(), JSON.stringify(arr)); }

function ocrResultCard(res, opts){
 opts=opts||{};
 const thr = opts.threshold||0.85;
 const rows = res.fields.map(f=>{
  const low = f.confidence < thr;
  return `<div style="display:grid;grid-template-columns:150px 1fr 90px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px dashed var(--line);">
   <div style="color:var(--ink-500);font-size:12.5px;">${f.label}</div>
   <div style="font-size:13px;${low?'color:var(--amber-600);font-weight:600;':''}">${f.value}${low?' <span class="badge badge-conditional" style="font-size:9px;">Cần kiểm tra</span>':''}</div>
   <div style="text-align:right;font-size:12px;color:${low?'var(--amber-600)':'var(--teal-600)'};">${BANCA.pctConf(f.confidence)}</div>
  </div>`;
 }).join('');
 return `<div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--teal-600);">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
   <div><b style="font-size:15px;">${opts.title||'Kết quả OCR'}</b> <span style="font-size:12px;color:var(--ink-500);">· nguồn ${opts.source||'OCR'} · độ tin cậy tổng ${BANCA.pctConf(res.overall)}</span></div>
   <div>${BANCA.ocrStateBadge('ocr', res.overall<thr?'LOW_CONFIDENCE':'EXTRACTED')}</div>
  </div>
  <div style="display:flex;gap:8px;align-items:center;font-size:12px;color:var(--teal-600);margin-bottom:8px;">✓ Đã tự động điền các trường bên dưới từ ảnh</div>
  <div style="display:grid;grid-template-columns:150px 1fr 90px;gap:10px;font-size:11px;color:var(--ink-300);text-transform:uppercase;padding-bottom:4px;border-bottom:1px solid var(--line);"><span>Trường</span><span>Giá trị bóc tách</span><span style="text-align:right;">Tin cậy</span></div>
  ${rows}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center;">
   ${BANCA.ocrStateBadge('review','NOT_REVIEWED')}
   <button class="btn btn-primary btn-sm" onclick="this.parentNode.innerHTML='<span class=\\'badge badge-ready\\'>Nhân viên tư vấn đã duyệt</span> <span class=\\'badge badge-conditional\\'>Chờ khách xác nhận</span>'">Xác nhận đã duyệt</button>
   <span style="font-size:11px;color:var(--ink-300);">OCR chỉ prefill — không thay cho KYC/xác minh.</span>
  </div>
 </div>`;
}
function attachedDocCard(dataUrl, name){
 return `<div class="card" style="padding:12px 14px;margin-bottom:12px;">
   <div style="font-size:12px;color:var(--ink-500);margin-bottom:8px;">📎 Tài liệu đã đính kèm yêu cầu (mục Tài liệu)</div>
   <div style="display:flex;gap:12px;align-items:center;">
     <img src="${dataUrl}" alt="${name}" style="width:120px;height:78px;object-fit:cover;border-radius:8px;border:1px solid var(--line);">
     <div><div style="font-weight:600;font-size:13px;">${name}</div><div style="font-size:12px;color:var(--ink-500);">${BANCA.ocrStateBadge('upload','UPLOADED')}</div></div>
   </div>
 </div>`;
}
// map documentType → mảng [ocrKey, inputId] để auto-fill
const OCR_FILL = {
 NATIONAL_ID: [['fullName','cf-name'],['dob','cf-dob'],['idNumber','cf-id'],['address','cf-address']],
 VEHICLE_REGISTRATION: [['brand','vm-brand'],['model','vm-model'],['type','vm-type'],['chassisNumber',null],['engineNumber',null],['manufactureYear',null]]
};
function autoFill(docType, res){
 (OCR_FILL[docType]||[]).forEach(([k,id])=>{ if(!id) return; const el=document.getElementById(id); const f=res.fields.find(x=>x.key===k); if(el&&f) el.value=f.value; });
 // các field xe theo label (vin/số máy/năm)
 if(docType==='VEHICLE_REGISTRATION'){
  const g=k=>((res.fields.find(f=>f.key===k)||{}).value)||'';
  const byLabel=(re,val)=>{ const el=[...document.querySelectorAll('.field')].find(fd=>re.test((fd.querySelector('label')||{}).textContent||'')); if(el){ const inp=el.querySelector('input'); if(inp&&val) inp.value=val; } };
  byLabel(/Số khung|VIN/, g('chassisNumber')); byLabel(/Số máy/, g('engineNumber')); byLabel(/Năm sản xuất/, g('manufactureYear')); byLabel(/Biển số/, g('plate'));
 }
}
// Đọc file ảnh (upload/chụp) → lưu tài liệu → OCR mock → auto-fill
window.ocrFromFile = function(inputEl, docType, target){
 const file = inputEl.files && inputEl.files[0];
 const box = document.getElementById('ocr-'+target); if(!box) return;
 if(!file){ return; }
 const reader = new FileReader();
 box.innerHTML=`<div class="card" style="padding:16px;margin-bottom:12px;"><b>📷 Đang xử lý ảnh & nhận dạng…</b> <span style="font-size:12px;color:var(--ink-500);">(OCR mô phỏng)</span><div class="ux-doc-progress" style="margin-top:8px;"><span style="width:45%"></span></div></div>`;
 reader.onload = function(e){
  const dataUrl = e.target.result;
  const docName = (docType==='NATIONAL_ID'?'CCCD/Hộ chiếu':'Giấy đăng ký xe')+' — '+(file.name||'ảnh chụp');
  saveCapturedDoc({type:docType, name:docName, dataUrl:dataUrl, at:(new Date()).toTimeString().slice(0,5)});
  setTimeout(()=>{
   const res=BANCA.mockOcr(docType);
   autoFill(docType, res);
   let html = attachedDocCard(dataUrl, docName) + ocrResultCard(res,{title:docType==='NATIONAL_ID'?'OCR CCCD':'OCR đăng ký xe', source:docType==='NATIONAL_ID'?'CCCD':'Đăng ký xe', threshold:(custDocPolicy&&custDocPolicy.confidenceThreshold)||0.85});
   if(docType==='VEHICLE_REGISTRATION'){
    const bankVal=1450000000, ocrVal=res.ocrValue||1400000000;
    html += `<div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--amber-600);">
      <b style="color:var(--amber-600);">⚠️ Cần xác nhận giá trị xe để tính phí</b>
      <div style="font-size:12.5px;color:var(--ink-500);margin:6px 0 10px;">Giá trị tính phí có 2 nguồn khác nhau. Chọn giá trị cho yêu cầu này (không ghi đè dữ liệu gốc).</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <label style="border:1px solid var(--line);border-radius:9px;padding:12px;cursor:pointer;display:flex;gap:8px;"><input type="radio" name="vehval" value="${bankVal}" checked><div><div style="font-size:12px;color:var(--ink-500);">Nguồn ngân hàng</div><b>${BANCA.vnd(bankVal)}</b></div></label>
        <label style="border:1px solid var(--line);border-radius:9px;padding:12px;cursor:pointer;display:flex;gap:8px;"><input type="radio" name="vehval" value="${ocrVal}"><div><div style="font-size:12px;color:var(--ink-500);">OCR / khai báo</div><b>${BANCA.vnd(ocrVal)}</b></div></label>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="confirmVehicleSnapshot()">Xác nhận & lưu Vehicle Snapshot</button>
      <div id="veh-snap-msg" style="font-size:12px;color:var(--teal-600);margin-top:8px;"></div>
    </div>`;
   }
   box.innerHTML = html;
  }, 650);
 };
 reader.readAsDataURL(file);
};
window.confirmVehicleSnapshot = function(){
 const sel=document.querySelector('input[name=vehval]:checked');
 const val = sel? parseInt(sel.value):0;
 const el=document.getElementById('veh-snap-msg');
 if(el) el.innerHTML=`✓ Đã lưu Vehicle Snapshot · giá trị dùng tính phí: <b>${BANCA.vnd(val)}</b>. ${BANCA.ocrStateBadge('verify','VERIFIED')} — sang bước Gói &amp; phí để tính phí chính thức.`;
 const vv=[...document.querySelectorAll('.field')].find(fd=>/Giá trị xe/.test((fd.querySelector('label')||{}).textContent||'')); if(vv){ const inp=vv.querySelector('input'); if(inp) inp.value=val.toLocaleString('vi-VN'); }
};
window.viewSourceContext = function(){
  const c = BANCA.customerById(app.customerId);
  const rows=[];
  rows.push(['Nguồn vào', app.source==='ADVICE'?'Tư vấn nhanh':(app.leadId?'Lead/Referral':(entryMode||'Portal'))]);
  if(c){ rows.push(['Khách hàng', c.name]); rows.push(['CIF', c.cif||'— (prospect)']); rows.push(['Segment', c.segment||'—']); rows.push(['Chi nhánh', c.branch||'—']); rows.push(['RM', c.ownerRM||'—']); rows.push(['KYC source', c.cif?'Bank KYC':'Chưa xác minh']); }
  else if(app.customerName){ rows.push(['Khách hàng', app.customerName+' (prospect)']); rows.push(['Trạng thái match', 'UNMATCHED_PROSPECT — chưa thành Customer Master']); }
  if(app.leadId){ rows.push(['Lead', app.leadId]); rows.push(['Campaign/Nguồn', app.campaign||'—']); rows.push(['Nhu cầu ghi nhận', app.leadNeed||'—']); }
  if(app.sourceAdviceId){ rows.push(['Tư vấn', app.sourceAdviceId+' v'+(app.sourceAdviceVersion||1)]); rows.push(['Nhu cầu', app.adviceNeed?BANCA.needLabel(app.adviceNeed):'—']); rows.push(['Ngân sách', app.adviceBudget?BANCA.budgetLabel(app.adviceBudget):'—']); }
  const root=document.getElementById('start-sale-root')||document.body;
  const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
  d.innerHTML=`<div class="modal2" style="max-width:480px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Ngữ cảnh nguồn</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body"><table class="dtable"><tbody>${rows.map(([k,v])=>`<tr><td style="color:var(--ink-500);width:45%;">${k}</td><td><b>${v}</b></td></tr>`).join('')}</tbody></table><div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Truy vết: ${app.leadId?'Lead → ':''}${app.sourceAdviceId?'Tư vấn → ':''}Sales Session → Yêu cầu bảo hiểm.</div></div></div>`;
  root.appendChild(d);
};
const phoneCell=(c,idx)=> c? `<span id="ph-${idx}">${BANCA.maskPhone(c.phone)} <a href="javascript:revealPhone('ph-${idx}','${c.id}')" style="font-size:11px;">Hiện số</a></span>` : '—';
const idCell=(c,idx)=> c? `<span id="id-${idx}">${BANCA.maskId(c.idNumber)} ${c.idNumber?`<a href="javascript:revealId('id-${idx}','${c.id}')" style="font-size:11px;">Hiện CCCD</a>`:''}</span>` : '—';
const dateOnly = v => (v||'').slice(0,10);
const addMonths = function(iso, months){
 const d = iso ? new Date(iso+'T00:00:00') : new Date('2026-07-23T00:00:00');
 d.setMonth(d.getMonth()+months);
 d.setDate(d.getDate()-1);
 return d.toISOString().slice(0,10);
};
const ageOnDate = function(dob, eff){
 if(!dob) return null;
 const b=new Date(dob+'T00:00:00'), e=new Date((eff||dateOnly(new Date().toISOString()))+'T00:00:00');
 if(isNaN(b)||isNaN(e)) return null;
 let age=e.getFullYear()-b.getFullYear();
 const m=e.getMonth()-b.getMonth();
 if(m<0 || (m===0 && e.getDate()<b.getDate())) age--;
 return age>=0 ? age : null;
};
const paPkg = code => (BANCA.paPackages||{})[code] || {};
const paPkgName = code => (paPkg(code).name || code || '—');
const paBenefitRows = function(code){
 const pk=paPkg(code);
 return [
  ['Tử vong do tai nạn', pk.deathSumInsured?BANCA.vnd(pk.deathSumInsured):'—'],
  ['Thương tật toàn bộ vĩnh viễn', pk.permanentDisability?BANCA.vnd(pk.permanentDisability):'—'],
  ['Thương tật bộ phận vĩnh viễn', pk.permanentPartialDisability||'Theo tỷ lệ thương tật'],
  ['Chi phí y tế do tai nạn', pk.medicalExpenseLimit?BANCA.vnd(pk.medicalExpenseLimit):'Không bao gồm'],
  ['Trợ cấp nằm viện/ngày', pk.dailyHospitalAllowance?BANCA.vnd(pk.dailyHospitalAllowance):'Không bao gồm']
 ];
};
const healthPkg = code => (BANCA.healthPackages||{})[code] || {};
const healthPkgName = code => (healthPkg(code).name || code || '—');
const healthMembersOf = function(a){
 const c=BANCA.customerById(a.customerId)||{};
 const eff=a.effectiveDate||dateOnly(new Date().toISOString());
 let members=(a.insuredMembers&&a.insuredMembers.length)?a.insuredMembers.slice():null;
 if(!members){
  const dob=(a.buyerIsInsured!==false)?(c.dob||a.insuredDob):a.insuredDob;
  members=[{name:a.insuredName||c.name||'', dob:dob||'', relationship:(a.buyerIsInsured===false?(a.relationship||'Khác'):'Bản thân')}];
 }
 return members.map(function(m, idx){
  return Object.assign({}, m, {age:ageOnDate(m.dob, eff), index:idx});
 });
};
const healthBenefitRows = function(code){
 const pk=healthPkg(code);
 return [
  ['Quyền lợi nội trú', pk.inpatientLimit?BANCA.vnd(pk.inpatientLimit):'Không bao gồm'],
  ['Quyền lợi ngoại trú', pk.outpatientLimit?BANCA.vnd(pk.outpatientLimit):'Không bao gồm'],
  ['Nha khoa', pk.dentalLimit?BANCA.vnd(pk.dentalLimit):'Không bao gồm'],
  ['Thai sản', pk.maternityLimit?BANCA.vnd(pk.maternityLimit):'Không bao gồm'],
  ['Giới hạn/năm', pk.annualLimit?BANCA.vnd(pk.annualLimit):'—'],
  ['Đồng chi trả', pk.copayPercent!=null?pk.copayPercent+'%':'—'],
  ['Thời hạn', (pk.termMonths||12)+' tháng'],
  ['Lãnh thổ', pk.territory||'Việt Nam']
 ];
};

// ===== Multi-insured (Health family) — Member Navigator + sticky summary =====
// Unit hiện tại theo ?unit= (fallback: thành viên active đầu tiên).
const healthCurUnit = function(a){
 const uid = qs.get('unit');
 const units = BANCA.healthUnitsOf(a);
 const found = uid && units.find(function(u){return u.insuredUnitId===uid;});
 return found || units.filter(function(u){return u.active!==false;})[0] || units[0] || null;
};
// Member Navigator: danh sách thành viên + trạng thái + gói/phí + sticky summary.
const healthNavigatorHtml = function(a, curUnitId, stepId){
 const units = BANCA.healthUnitsOf(a);
 const fam = BANCA.healthFamilyRating(a);
 const rd = BANCA.healthSubmitReadiness(a);
 const memberList = units.map(function(u){
  const s = BANCA.healthUnitStatus(a, u);
  const rt = BANCA.rateHealthUnit(u);
  const dot = {ok:['var(--teal-600)','#eefaf7'],warn:['var(--amber-600)','#fdf3e3'],danger:['var(--red-600)','#fdecec']}[s.tone]||['var(--ink-300)','var(--paper)'];
  const isCur = u.insuredUnitId===curUnitId;
  const inactive = u.active===false;
  return `<a href="?id=${a.id}&step=${stepId}&unit=${u.insuredUnitId}${isNew?'&new=1':''}" style="text-decoration:none;display:block;border:1.5px solid ${isCur?'var(--brand-600)':'var(--line)'};border-radius:9px;padding:9px 11px;margin-bottom:7px;background:${isCur?'var(--brand-100)':(inactive?'var(--paper)':'#fff')};${inactive?'opacity:.65;':''}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
     <span style="font-weight:700;font-size:12.5px;color:var(--ink-900);">${inactive?'∅':s.icon} ${u.name||('Thành viên '+(u.index+1))}</span>
     <span class="badge" style="background:${dot[1]};color:${dot[0]};font-size:9px;">${inactive?'Đã loại':s.label}</span>
    </div>
    <div style="font-size:11px;color:var(--ink-500);margin-top:3px;">${u.relationship||'—'}${u.age!=null?' · '+u.age+' tuổi':''}${u.isChild?' · trẻ em':''}${u.package?' · '+healthPkgName(u.package):' · chưa chọn gói'}</div>
    <div style="font-size:11px;color:var(--ink-700);margin-top:2px;">${rt&&!inactive?BANCA.vnd(rt.totalPremium)+'/năm':(inactive?'không tính phí':'—')}${(!inactive&&s.missing&&s.missing.length)?` · <span style="color:${dot[0]};">${s.missing[0]}</span>`:''}</div>
   </a>`;
 }).join('');
 const cur = units.find(function(u){return u.insuredUnitId===curUnitId;});
 const rowS=(k,v)=>`<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:3px 0;"><span style="color:var(--ink-500);">${k}</span><b>${v}</b></div>`;
 const summary = `<div class="card" style="padding:12px 13px;margin-top:4px;">
   <div class="label" style="margin-bottom:8px;">Tóm tắt gia đình</div>
   ${rowS('Số thành viên', fam.memberCount+' · active '+fam.lines.length)}
   ${rowS('Thành viên hiện tại', cur?(cur.name||'—'):'—')}
   ${rowS('Chiết khấu gia đình', fam.familyDiscount?('−'+BANCA.vnd(fam.familyDiscount)):'—')}
   <div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:6px 0 3px;border-top:1px solid var(--line);margin-top:4px;"><span style="font-weight:700;">Tổng phí gia đình</span><b style="color:var(--brand-600);">${BANCA.vnd(fam.total)}</b></div>
   <div style="font-size:11px;color:var(--ink-500);margin-top:4px;">Tiến độ: <b style="color:${rd.ready?'var(--teal-600)':'var(--amber-600)'};">${units.filter(function(u){return u.active!==false&&BANCA.healthUnitStatus(a,u).code==='complete';}).length}/${fam.lines.length} hoàn tất</b></div>
   ${rd.ready?'<div class="alert2 info" style="margin:8px 0 0;padding:7px 9px;font-size:11.5px;">✓ Mọi thành viên active đủ điều kiện nộp.</div>':`<div class="alert2 warn" style="margin:8px 0 0;padding:7px 9px;font-size:11.5px;">Còn chặn: ${rd.blockers.map(function(b){return (b.name||'')+' — '+((b.missing||[])[0]||b.code);}).slice(0,3).join('; ')}</div>`}
  </div>`;
 return `<aside style="width:272px;flex-shrink:0;">
   <div style="font-size:13px;font-weight:700;margin-bottom:8px;">Người được bảo hiểm</div>
   ${memberList}
   ${!readOnly?`<button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px;" onclick="healthAddUnit('${a.id}')">+ Thêm người được bảo hiểm</button>`:''}
   ${summary}
  </aside>`;
};
// Bọc nội dung chính + navigator (2 cột) — dùng cho stage 3..6 của health.
const healthWithNav = function(a, curUnitId, stepId, mainHtml){
 return `<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;"><main style="flex:1;min-width:340px;">${mainHtml}</main>${healthNavigatorHtml(a, curUnitId, stepId)}</div>`;
};

// ===== P0-9/GCN helper (dùng chung tracking + policy preview) =====
function gcnPanel(a){
 if(a.productId==='health'){
  const c=BANCA.customerById(a.customerId)||{};
  const pol=a.policyId ? (BANCA.policyById(a.policyId)||{}) : {};
  const holder=pol.policyholder||c;
  const members=(pol.insuredMembers&&pol.insuredMembers.length)?pol.insuredMembers:healthMembersOf(a);
  const pkgCode=pol.packageCode||a.package;
  const pkg=healthPkg(pkgCode);
  const prem=(a.payment&&a.payment.amount)||(a.uw&&a.uw.newPremium)||a.premium||0;
  const row=(k,val)=>`<tr><td style="width:220px;color:var(--ink-500);font-size:12px;">${k}</td><td style="font-size:12.5px;">${val}</td></tr>`;
  return `<div class="card" style="padding:0;overflow:hidden;">
   <div style="background:var(--brand-900);color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
    <div><div style="font-size:10px;letter-spacing:.1em;color:#9db6e0;">GIẤY CHỨNG NHẬN BẢO HIỂM SỨC KHỎE (PREVIEW)</div>
    <b style="font-size:14px;">${a.policyId||'—'} · ${pol.certificate||pol.certificateNumber||'—'}</b></div>
    <div style="font-size:11px;color:#9db6e0;">Janus Bank × ABC Insurance</div>
   </div>
   <div style="padding:14px 16px;">
    <table class="dtable"><tbody>
     ${row('Bên mua bảo hiểm', (holder.name||c.name||'—')+' · '+(holder.cif||c.cif||'prospect'))}
     ${row('Người được bảo hiểm (GCN riêng từng người)', members.map(function(m,mi){return (m.name||'—')+' · '+(m.relationship||'—')+' · GCN '+(m.certificateNumber||((pol.certificate||pol.certificateNumber||'GCN')+'-'+String(mi+1).padStart(2,'0')));}).join('<br>'))}
     ${row('Gói / thời hạn', `${pkg.name||healthPkgName(pkgCode)} · ${(pkg.termMonths||12)} tháng`)}
     ${row('Thời hạn bảo hiểm', (pol.effectiveFrom||'2026-07-23')+' → '+(pol.effectiveTo||addMonths('2026-07-23',12)))}
     ${row('Số hợp đồng chung / GCN mỗi người', `1 số HĐ <b>${a.policyId||'—'}</b> · ${members.length} GCN thành viên`)}
     ${row('Tổng phí', `<b>${BANCA.vnd(prem)}</b>/năm`)}
    </tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
     ${healthBenefitRows(pkgCode).map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:9px;padding:12px;"><div class="label" style="margin-bottom:6px;">${k}</div><div style="font-size:12px;color:var(--ink-700);font-weight:700;">${v}</div></div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--ink-300);margin-top:10px;">Loại trừ chính: ${(pkg.exclusions||['Theo quy tắc bảo hiểm sức khỏe']).join('; ')}.</div>
   </div>
  </div>`;
 }
 if(a.productId==='pa'){
  const c=BANCA.customerById(a.customerId)||{};
  const pol=a.policyId ? (BANCA.policyById(a.policyId)||{}) : {};
  const insured=pol.insuredPerson||{};
  const holder=pol.policyholder||c;
  const pkgCode=pol.packageCode||a.package;
  const pkg=paPkg(pkgCode);
  const prem=(a.payment&&a.payment.amount)||(a.uw&&a.uw.newPremium)||a.premium||0;
  const row=(k,val)=>`<tr><td style="width:220px;color:var(--ink-500);font-size:12px;">${k}</td><td style="font-size:12.5px;">${val}</td></tr>`;
  return `<div class="card" style="padding:0;overflow:hidden;">
   <div style="background:var(--brand-900);color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
    <div><div style="font-size:10px;letter-spacing:.1em;color:#9db6e0;">GIẤY CHỨNG NHẬN BẢO HIỂM TAI NẠN CON NGƯỜI (PREVIEW)</div>
    <b style="font-size:14px;">${a.policyId||'—'} · ${pol.certificate||pol.certificateNumber||'—'}</b></div>
    <div style="font-size:11px;color:#9db6e0;">Janus Bank × ABC Insurance</div>
   </div>
   <div style="padding:14px 16px;">
    <table class="dtable"><tbody>
     ${row('Bên mua bảo hiểm', (holder.name||c.name||'—')+' · '+(holder.cif||c.cif||'prospect'))}
     ${row('Người được bảo hiểm', (insured.name||a.insuredName||c.name||'—')+' · DOB '+(insured.dob||c.dob||'—'))}
     ${row('Số định danh', insured.identityNumber||c.idNumber||'—')}
     ${row('Nhóm nghề nghiệp', (BANCA.paOccupationClasses&&BANCA.paOccupationClasses[insured.occupationClass||a.occupationClass]||{}).label||insured.occupationClass||a.occupationClass||'—')}
     ${row('Gói / thời hạn', `${pkg.name||paPkgName(pkgCode)} · ${(pkg.termMonths||12)} tháng`)}
     ${row('Thời hạn bảo hiểm', (pol.effectiveFrom||'2026-07-23')+' → '+(pol.effectiveTo||addMonths('2026-07-23',12)))}
     ${row('Tổng phí', `<b>${BANCA.vnd(prem)}</b>/năm`)}
    </tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
     ${paBenefitRows(pkgCode).map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:9px;padding:12px;"><div class="label" style="margin-bottom:6px;">${k}</div><div style="font-size:12px;color:var(--ink-700);font-weight:700;">${v}</div></div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--ink-300);margin-top:10px;">Loại trừ chính: ${(pkg.exclusions||['Theo quy tắc bảo hiểm PA']).join('; ')}.</div>
   </div>
  </div>`;
 }
 const v=a.vehicle||{};
 const c=BANCA.customerById(a.customerId)||{};
 const snap=(a.quote&&a.quote.inputsSnapshot)||{};
 const pkg=BANCA.motorPackages[snap.packageCode]||BANCA.motorPackages[(a.package||'').toUpperCase()]||{};
 const addOns=(snap.addOns||pkg.defaultAddOns||[]).map(x=>(BANCA.motorAddOns[x]||{}).name||x).join(', ')||'Không';
 const prem=(a.uw&&a.uw.newPremium)||a.premium;
 const eff=a.policyId? (BANCA.policyById(a.policyId)||{}) : {};
 const row=(k,val)=>`<tr><td style="width:220px;color:var(--ink-500);font-size:12px;">${k}</td><td style="font-size:12.5px;">${val}</td></tr>`;
 return `<div class="card" style="padding:0;overflow:hidden;">
  <div style="background:var(--brand-900);color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
   <div><div style="font-size:10px;letter-spacing:.1em;color:#9db6e0;">GIẤY CHỨNG NHẬN BẢO HIỂM (PREVIEW)</div>
   <b style="font-size:14px;">${a.policyId||'—'}</b></div>
   <div style="font-size:11px;color:#9db6e0;">Janus Bank × FPT IS Insurance</div>
  </div>
  <div style="padding:14px 16px;">
   <table class="dtable"><tbody>
    ${row('Chủ xe / Người được BH', (c.name||'—')+' · '+(c.cif||'prospect'))}
    ${row('Xe', `${v.brand||''} ${v.model||''} ${v.year||''}`)}
    ${row('Biển số / Số khung / Số máy', `${v.plate||'—'} · ${v.vin||'—'} · ${v.engineNo||'—'}`)}
    ${row('Thời hạn bảo hiểm', (eff.effectiveFrom||'2026-07-20')+' → '+(eff.effectiveTo||'2027-07-19'))}
    ${row('Tổng phí', `<b>${BANCA.vnd(prem)}</b>/năm`)}
   </tbody></table>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
    <div style="border:1px solid var(--line);border-radius:9px;padding:12px;">
     <div class="label" style="margin-bottom:6px;">PHẦN 1 — TNDS BẮT BUỘC</div>
     <div style="font-size:12px;color:var(--ink-700);">Về người: <b>150.000.000 ₫</b>/người/vụ</div>
     <div style="font-size:12px;color:var(--ink-700);">Về tài sản: <b>100.000.000 ₫</b>/vụ</div>
    </div>
    <div style="border:1px solid var(--line);border-radius:9px;padding:12px;">
     <div class="label" style="margin-bottom:6px;">PHẦN 2 — VẬT CHẤT XE (${pkg.name||a.package||''})</div>
     <div style="font-size:12px;color:var(--ink-700);">Số tiền BH (IDV): <b>${BANCA.vnd(snap.sumInsured||v.value||0)}</b></div>
     <div style="font-size:12px;color:var(--ink-700);">Khấu trừ: <b>${BANCA.vnd(snap.deductible||pkg.defaultDeductible||0)}</b>/vụ</div>
     <div style="font-size:12px;color:var(--ink-700);">Add-on: ${addOns}</div>
     <div style="font-size:12px;color:var(--ink-700);">PA lái/phụ xe: <b>10.000.000 ₫</b>/người</div>
    </div>
   </div>
   ${(()=>{ // Điều khoản thụ hưởng — khi xe thế chấp (luồng NTH)
    const ovG=(BANCA.overlay.applications&&BANCA.overlay.applications[a.id])||{};
    const mgG=ovG.mortgage||a.mortgage;
    if(!(mgG&&mgG.mortgaged)) return '';
    return `<div style="border:1px solid var(--amber-600);background:#fdf3e3;border-radius:9px;padding:12px;margin-top:12px;">
     <div class="label" style="margin-bottom:6px;color:var(--amber-600);">ĐIỀU KHOẢN THỤ HƯỞNG (xe thế chấp)</div>
     <div style="font-size:12px;color:var(--ink-700);">Bên thụ hưởng: <b>${mgG.bank||'—'}</b>${mgG.lenderType?' ('+mgG.lenderType+')':''}${mgG.branch?' · '+mgG.branch:''} · HĐ tín dụng <b>${mgG.creditContract||'—'}</b></div>
     <div style="font-size:12px;color:var(--ink-700);margin-top:4px;">Quyền lợi bồi thường <b>tổn thất toàn bộ / vượt ngưỡng lớn</b> được chi trả cho <b>bên thụ hưởng (${mgG.bank||'—'})</b> trước để cấn trừ dư nợ; phần chênh lệch (nếu có) trả chủ xe. Tổn thất bộ phận nhỏ chi trả chủ xe/garage theo thông lệ.</div>
    </div>`;
   })()}
  </div>
 </div>`;
}

// ================================================================ EDIT MODE
if(app.submissionState==='NOT_SUBMITTED'){
 // 2026-07-23: stepper REGISTRY-DRIVEN theo Product Journey Definition.
 // Motor vẫn ẩn INSURED_PARTY (định nghĩa trong journey.hiddenStages) → 6 bước hiển thị như cũ.
 // PA/sản phẩm khác có stepper riêng theo registry, không hard-code.
 const AUTO_STAGES = (BANCA.journeyFor(app.productId).hiddenStages)||['INSURED_PARTY'];
 const steps = (BANCA.journeyEditStages ? BANCA.journeyEditStages(app.productId) : BANCA.STAGES.filter(s=>!AUTO_STAGES.includes(s.id)));
 let reqStep = qs.get('step')||app.currentStage;
 if(AUTO_STAGES.includes(reqStep)) reqStep='CUSTOMER_INFO';
 let curIdx = steps.findIndex(s=>s.id===reqStep); if(curIdx<0) curIdx=0;
 const cur = steps[curIdx];
 const doneIdx = steps.findIndex(s=>s.id===app.currentStage);

 const stepLink = (s,i)=>{
  const done = doneIdx>=0 && i < doneIdx;
  const active = i===curIdx;
  return `<a href="?id=${app.id}&step=${s.id}${isNew?'&new=1':''}" style="text-decoration:none;display:flex;align-items:center;gap:6px;padding:7px 11px;border-radius:8px;font-size:12px;${active?'background:var(--brand-600);color:#fff;font-weight:600;':done?'background:var(--teal-100);color:var(--teal-600);':'background:var(--paper-card);color:var(--ink-500);border:1px solid var(--line);'}"><span style="width:17px;height:17px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;${active?'background:rgba(255,255,255,.25);':done?'background:var(--teal-600);color:#fff;':'background:var(--line);'}">${done?'✓':i+1}</span>${s.label}</a>`;
 };
 const stepper = `<div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">${steps.map(stepLink).join('')}</div>`;

 const input=(l,v,ro,extra)=>`<div class="field" style="margin-bottom:10px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:3px;">${l}${ro?' <span class="chip" style="font-size:9px;">Ngân hàng</span>':''}</label><input value="${v==null?'':v}" ${ro||readOnly?'readonly style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink-500);"':'style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;" onblur="autosave()"'}>${extra?`<div style="font-size:10.5px;color:var(--ink-300);margin-top:3px;">${extra}</div>`:''}</div>`;
 const inputId=(id,l,v,extra)=>`<div class="field" style="margin-bottom:10px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:3px;">${l}</label><input id="${id}" value="${v==null?'':v}" ${readOnly?'readonly':''} style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;" onblur="autosave()">${extra?`<div style="font-size:10.5px;color:var(--ink-300);margin-top:3px;">${extra}</div>`:''}</div>`;

 // 2026-07-20 16:35 (user chốt): select-tag search — input + datalist; search ra option sẵn có,
 // gõ giá trị mới rồi Enter/blur là tự nhận (insert in-session), KHÔNG cần nút "Tạo mới".
 const combo=(id,label,options,value,extra)=>`<div class="field" style="margin-bottom:10px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:3px;">${label}</label>
  <input id="${id}" list="${id}-list" value="${value==null?'':value}" ${readOnly?'readonly style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink-500);"':`placeholder="Gõ để tìm hoặc nhập mới rồi Enter…" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;" onchange="comboChanged('${id}')"`}>
  <datalist id="${id}-list">${options.map(o=>`<option value="${o}">`).join('')}</datalist>
  ${extra?`<div style="font-size:10.5px;color:var(--ink-300);margin-top:3px;">${extra}</div>`:''}</div>`;

 let stepBody='';
 if(cur.id==='CUSTOMER_INFO'){
  const bankFed = entryMode==='BANK_CUSTOMER' || entryMode==='INSURANCE_CUSTOMER' || entryMode==='RENEWAL';
  // Header: nguồn + phương thức nhập (config-driven theo customerDocumentPolicy)
  const srcKind = app.sourceAdviceId?'ADVICE':app.leadId?'REFERRAL':entryMode==='BANK_CUSTOMER'?'BANK':entryMode==='INSURANCE_CUSTOMER'?'BANK':'PORTAL';
  const idDoc = {code:'ID', name:'CCCD / Hộ chiếu', sub:'Định danh khách — OCR tự động điền', ocr:'enabled', required:!bankFed, docType:'NATIONAL_ID'};
  const modeHead = `<div class="card" style="padding:12px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
    <div><div style="font-size:12px;color:var(--ink-500);">Nguồn khách hàng</div><div style="font-weight:700;">${BANCA.sourceBadge?BANCA.sourceBadge(srcKind):''} <span class="chip" style="background:var(--brand-100);color:var(--brand-700);">${entrySourceLabel}</span></div>
     <div style="font-size:12px;color:var(--ink-500);margin-top:4px;">${custDocPolicy.note||''}</div></div>
    <button class="btn btn-secondary btn-sm" onclick="viewSourceContext()">Xem ngữ cảnh nguồn</button>
  </div>`;

  if(bankFed && cust){
    stepBody = modeHead + `<div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px;">
     ${input('Họ tên', cust.name, !!cust.cif)}${input('Ngày sinh', cust.dob, !!cust.cif)}
     ${input('CIF', cust.cif||'— (prospect)', true)}
     <div class="field" style="margin-bottom:10px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:3px;">Điện thoại</label><div style="padding:8px;border:1px solid var(--line);border-radius:7px;font-size:13px;">${phoneCell(cust,'c1')}</div></div>
     ${input('Email', cust.email, false)}${input('Segment', cust.segment, true)}
     ${input('Khoản vay / tài sản liên quan', cust.loanRef||'Không', true)}${input('Bảo hiểm hiện có', (cust.existingInsurance||[]).join(', ')||'Không', true)}
    </div>
    <div class="alert2 info" style="margin-top:4px;">Người được bảo hiểm: <b>chính chủ</b> (${cust.name}) · KYC ngân hàng được chấp nhận — trường đã xác minh chỉ đọc, trường thiếu cho phép bổ sung.</div>
    <div class="section-title" style="margin-top:16px;"><h2>Giấy tờ định danh</h2><span class="subtitle">Tùy chọn — đối chiếu/bổ sung khi cần</span></div>
    <div class="card" style="padding:0;overflow:hidden;">${BANCA.docItemHtml(app.id, idDoc)}</div>`;
  } else {
    stepBody = modeHead + `<div class="alert2 warn" style="margin-bottom:12px;">Khách hàng mới${app.sourceAdviceId?' (từ tư vấn)':''}: cần <b>consent</b> và định danh trước khi tạo yêu cầu chính thức. Tải/chụp CCCD ở mục Giấy tờ định danh để tự điền, hoặc nhập thủ công. OCR chỉ bóc tách dữ liệu, không thay cho KYC.</div>
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink-700);margin-bottom:12px;"><input type="checkbox" id="prospect-consent" ${readOnly?'disabled':''}> Khách hàng đồng ý cung cấp và xử lý dữ liệu cá nhân cho mục đích bảo hiểm.</label>
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px;">
     ${inputId('cf-name','Họ tên', app.customerName||'')}${inputId('cf-dob','Ngày sinh','')}
     ${inputId('cf-id','Số CCCD/Hộ chiếu','')}${inputId('cf-phone','Điện thoại','')}
     ${inputId('cf-email','Email','')}${inputId('cf-address','Địa chỉ','')}
    </div>
    <div class="section-title" style="margin-top:16px;"><h2>Giấy tờ định danh</h2><span class="subtitle">Tải/chụp CCCD để tự động điền các trường trên</span></div>
    <div class="card" style="padding:0;overflow:hidden;">${BANCA.docItemHtml(app.id, idDoc)}</div>
    <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Kiểm tra trùng (dedup) khi lưu; nếu trùng khách có sẵn sẽ dùng record đó, không tạo CIF giả.</div>`;
  }
 } else if(cur.id==='INSURED_PARTY' && BANCA.journeyStageComponent(app.productId,'INSURED_PARTY')==='healthInsuredPerson'){
  const buyerIsInsured = app.buyerIsInsured!==false;
  const effDate = app.effectiveDate || dateOnly(new Date().toISOString());
  const units = BANCA.healthUnitsOf(app);
  const relOpts = (BANCA.HEALTH_RELATIONSHIPS||['Bản thân','Vợ/Chồng','Con','Cha','Mẹ','Khác']);
  const memberRows = units.map(function(u){
    const idx=u.index, uid=u.insuredUnitId;
    const elig = BANCA.healthUnitEligibility(app, u);
    const inactive = u.active===false;
    const eligBanner = !inactive ? (elig.errors.length
      ? `<div class="alert2 danger" style="margin-top:10px;padding:8px 10px;font-size:12px;">🚫 ${elig.errors.map(function(e){return e.msg;}).join(' · ')}</div>`
      : (elig.warnings.length? `<div class="alert2 warn" style="margin-top:10px;padding:8px 10px;font-size:12px;">⚠ ${elig.warnings.map(function(w){return w.msg;}).join(' · ')}</div>`
      : `<div class="alert2 info" style="margin-top:10px;padding:8px 10px;font-size:12px;">✓ Đủ điều kiện tuổi/quan hệ sơ bộ.</div>`)) : '';
    const guardianCandidates = units.filter(function(x){ return x.insuredUnitId!==uid && x.active!==false && !x.isChild && (x.name||'').trim(); });
    const guardianOptions = guardianCandidates.map(function(x){ return '<option value="'+x.insuredUnitId+'" '+(u.guardianUnitId===x.insuredUnitId?'selected':'')+'>'+esc(x.name)+' · '+esc(x.relationship||'Thành viên hồ sơ')+'</option>'; }).join('');
    const guardianChoice = u.guardianUnitId || '__new';
    const guardianBlock = (u.isChild && !inactive) ? `<div style="display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:10px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);">
        <div><label style="font-size:11px;color:var(--ink-500);">Chọn người đại diện</label><select ${readOnly?'disabled':''} onchange="healthUnitSetGuardianChoice('${app.id}','${uid}',this.value)" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"><option value="__new" ${guardianChoice==='__new'?'selected':''}>+ Thêm người đại diện mới</option>${guardianOptions}</select></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Tên người đại diện</label><input value="${u.guardianName||''}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','guardianName',this.value)" placeholder="Nhập mới hoặc chọn từ hồ sơ" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Quan hệ đại diện</label><input value="${u.guardianRelationship||'Cha/Mẹ'}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','guardianRelationship',this.value)" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div style="grid-column:1/-1;"><label style="font-size:11px;color:var(--ink-500);">SĐT người đại diện</label><input value="${u.guardianPhone||''}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','guardianPhone',this.value)" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div class="alert2 info" style="grid-column:1/-1;margin:0;padding:7px 9px;font-size:12px;">Có thể chọn người lớn đã có trong hồ sơ để tự điền tên/SĐT, hoặc chọn “Thêm người đại diện mới” để nhập tay.</div>
      </div>` : '';
    return `<div class="card" style="padding:13px;margin-bottom:9px;${inactive?'opacity:.6;':''}border-left:3px solid ${inactive?'var(--ink-300)':(elig.errors.length?'var(--red-600)':'var(--brand-600)')};">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
       <b style="font-size:13px;">${u.name||('Người được BH '+(idx+1))} <span class="chip" style="font-size:9px;">${uid}</span>${u.isChild?'<span class="chip" style="font-size:9px;background:var(--purple-100);color:var(--purple-600);">Trẻ em</span>':''}${inactive?'<span class="chip" style="font-size:9px;background:#fdecec;color:var(--red-600);">Đã loại</span>':''}</b>
       <div style="display:flex;gap:6px;">
        ${!readOnly?`<button class="btn btn-secondary btn-sm" onclick="healthToggleActive('${app.id}','${uid}',${inactive})">${inactive?'Khôi phục':'Loại khỏi yêu cầu'}</button>`:''}
        ${idx>0&&!readOnly?`<button class="btn btn-secondary btn-sm" onclick="healthRemoveUnit('${app.id}','${uid}')">Xóa</button>`:''}
       </div>
      </div>
      <div style="display:grid;grid-template-columns:1.3fr 130px 120px 110px 80px;gap:10px;align-items:end;">
        <div><label style="font-size:11px;color:var(--ink-500);">Họ tên</label><input value="${u.name||''}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','name',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Ngày sinh</label><input type="date" value="${u.dob||''}" ${readOnly||(idx===0&&buyerIsInsured)?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','dob',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Quan hệ</label><select ${readOnly||(idx===0&&buyerIsInsured)?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','relationship',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;">${relOpts.map(function(rl){return '<option '+(u.relationship===rl?'selected':'')+'>'+rl+'</option>';}).join('')}</select></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Giới tính</label><select ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','gender',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"><option value="">—</option><option ${u.gender==='Nam'?'selected':''}>Nam</option><option ${u.gender==='Nữ'?'selected':''}>Nữ</option></select></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Tuổi BH</label><input readonly value="${u.age!=null?u.age:'—'}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;background:var(--paper);color:var(--ink-500);"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:9px;">
        <div><label style="font-size:11px;color:var(--ink-500);">Giấy tờ (CCCD/khai sinh)</label><input value="${u.identityNumber||''}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','identityNumber',this.value)" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
        <div><label style="font-size:11px;color:var(--ink-500);">Nghề nghiệp</label><input value="${u.occupation||''}" ${readOnly?'disabled':''} onchange="healthUnitSetField('${app.id}','${uid}','occupation',this.value)" placeholder="VD: Nhân viên văn phòng" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
      </div>
      ${guardianBlock}${eligBanner}
    </div>`;
  }).join('');
  const dupWarn = (function(){
    const seen={}, dups=[];
    units.forEach(function(u){ const k=(u.identityNumber||'').trim()||((u.name||'')+'|'+(u.dob||'')); if(k && k!=='|' && seen[k]) dups.push(u.name||u.insuredUnitId); else seen[k]=1; });
    return dups.length? `<div class="alert2 warn" style="margin-bottom:12px;">Nghi trùng người được bảo hiểm: ${dups.join(', ')}. Không tự động gộp (gia đình có thể chung SĐT) — kiểm tra CIF → giấy tờ → tên+DOB.</div>`:'';
  })();
  stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Người được bảo hiểm sức khỏe (gia đình) — mỗi người là 1 đơn vị bảo hiểm độc lập. Tuổi tính từ ngày sinh & ngày hiệu lực; eligibility kiểm tra ngay.</div>
   <div class="card" style="padding:16px;margin-bottom:12px;">
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink-700);margin-bottom:12px;">
     <input type="checkbox" ${buyerIsInsured?'checked':''} ${readOnly?'disabled':''} onchange="healthSetField('${app.id}','buyerIsInsured',this.checked)"> Bên mua đồng thời là người được bảo hiểm chính
    </label>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
     <div><label style="font-size:11.5px;color:var(--ink-500);">Ngày hiệu lực (chung)</label><input type="date" value="${effDate}" ${readOnly?'disabled':''} onchange="healthSetField('${app.id}','effectiveDate',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Số thành viên</label><input readonly value="${units.length}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;background:var(--paper);color:var(--ink-500);"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Đủ điều kiện sơ bộ</label><input readonly value="${units.filter(function(u){return u.active!==false && BANCA.healthUnitEligibility(app,u).eligible;}).length}/${units.filter(function(u){return u.active!==false;}).length}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;background:var(--paper);color:var(--ink-500);"></div>
    </div>
    ${!buyerIsInsured?`<div class="alert2 warn" style="margin-top:12px;">Bên mua khác người được bảo hiểm chính — cần consent của người được bảo hiểm khi nộp yêu cầu.</div>`:''}
   </div>
   ${dupWarn}
   <div class="section-title"><h2>Danh sách người được bảo hiểm</h2><span class="subtitle">Thêm/loại thành viên; trẻ &lt;18 cần người đại diện</span></div>
   ${memberRows}
   ${!readOnly?`<button class="btn btn-primary btn-sm" onclick="healthAddUnit('${app.id}')">+ Thêm người được bảo hiểm</button>`:''}`;
 } else if(cur.id==='INSURED_PARTY'){
  // P0.5 — PA: form NGƯỜI ĐƯỢC BẢO HIỂM (không field xe). Component từ registry.
  const occOpts = Object.keys(BANCA.paOccupationClasses||{}).map(function(k){
    const o=BANCA.paOccupationClasses[k]; return `<option value="${k}" ${app.occupationClass===k?'selected':''}>${o.label}</option>`;
  }).join('');
  const buyerIsInsured = app.buyerIsInsured!==false;
  const effDate = app.effectiveDate || dateOnly(new Date().toISOString());
  const insuredDob = buyerIsInsured ? ((cust&&cust.dob)||app.insuredDob||'') : (app.insuredDob||'');
  const insuredAge = ageOnDate(insuredDob, effDate);
  const occ = (BANCA.paOccupationClasses||{})[app.occupationClass||'CLASS_1']||{};
  const eligibilityTone = occ.eligibility==='BLOCKED'?'danger':(occ.eligibility==='REFERRED'?'warn':'info');
  const eligibilityText = occ.eligibility==='BLOCKED'?'Không đủ điều kiện STP do nhóm nghề bị loại trừ.':(occ.eligibility==='REFERRED'?'Cần chuyển thẩm định do nhóm nghề rủi ro.':'Đủ điều kiện STP theo nhóm nghề.');
  stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Người được bảo hiểm (Bảo hiểm tai nạn cá nhân) — journey riêng, không dùng lại field/tài liệu xe.</div>
   <div class="card" style="padding:16px;">
    <div class="label" style="margin-bottom:10px;">Thông tin người được bảo hiểm</div>
    <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink-700);margin-bottom:12px;">
     <input type="checkbox" ${buyerIsInsured?'checked':''} ${readOnly?'disabled':''} onchange="paSetField('${app.id}','buyerIsInsured',this.checked)"> Bên mua đồng thời là người được bảo hiểm
    </label>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">
     <div><label style="font-size:11.5px;color:var(--ink-500);">Họ tên</label>
      <input value="${app.insuredName||(cust?cust.name:'')||''}" ${readOnly?'disabled':''} onchange="paSetField('${app.id}','insuredName',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Ngày sinh người được BH</label>
      <input type="date" value="${insuredDob||''}" ${buyerIsInsured||readOnly?'disabled':''} onchange="paSetField('${app.id}','insuredDob',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Ngày hiệu lực dự kiến</label>
      <input type="date" value="${effDate}" ${readOnly?'disabled':''} onchange="paSetField('${app.id}','effectiveDate',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Tuổi bảo hiểm</label>
      <input readonly value="${insuredAge!=null?insuredAge:'Chưa có DOB'}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;background:var(--paper);color:var(--ink-500);"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Mã nghề nghiệp</label>
      <input value="${app.occupationCode||''}" ${readOnly?'disabled':''} onchange="paSetField('${app.id}','occupationCode',this.value)" placeholder="VD: OFFICE_ADMIN" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Nhóm nghề nghiệp</label>
      <select ${readOnly?'disabled':''} onchange="paSetField('${app.id}','occupationClass',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;">${occOpts}</select></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Quan hệ với bên mua</label>
      <input value="${buyerIsInsured?'Bản thân':(app.relationship||'')}" ${buyerIsInsured||readOnly?'disabled':''} onchange="paSetField('${app.id}','relationship',this.value)" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
    </div>
    ${!buyerIsInsured?`<div class="alert2 warn" style="margin-top:12px;">Bên mua khác người được bảo hiểm — cần consent của người được bảo hiểm trước khi nộp yêu cầu bảo hiểm.</div>`:''}
    <div class="alert2 ${eligibilityTone}" style="margin-top:12px;">${eligibilityText} Tuổi được tính từ DOB đến ngày hiệu lực dự kiến; không nhập tay.</div>
   </div>`;
 } else if(cur.id==='PACKAGE_AND_QUOTE' && BANCA.journeyStageComponent(app.productId,'PACKAGE_AND_QUOTE')==='healthPackage'){
  const unit = healthCurUnit(app);
  const curUnitId = unit ? unit.insuredUnitId : null;
  const sel = unit ? unit.package : null;
  const inactive = unit && unit.active===false;
  const cards = Object.values(BANCA.healthPackages||{}).map(function(pk){
    const rt = unit && unit.age!=null ? BANCA.rateHealth({packageCode:pk.code, members:[{name:unit.name, age:unit.age, relationship:unit.relationship}]}) : null;
    const isSel = sel===pk.code;
    const benefits = healthBenefitRows(pk.code).map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:3px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${k}</span><b style="text-align:right;">${v}</b></div>`).join('');
    return `<div class="card" style="margin:0;padding:14px;${isSel?'border:2px solid var(--brand-600);':''}">
     <div style="display:flex;justify-content:space-between;"><b style="font-size:13.5px;">${pk.name}</b>${isSel?'<span class="badge badge-ready">Đã chọn</span>':''}</div>
     <div style="font-size:11.5px;color:var(--ink-500);margin:6px 0;">${pk.desc}</div>
     <div style="font-size:11px;color:var(--ink-300);">Thời hạn ${(pk.termMonths||12)} tháng · Phạm vi ${pk.territory||'Việt Nam'}</div>
     <div style="margin-top:8px;">${benefits}</div>
     <div style="font-size:11px;color:var(--ink-500);margin-top:8px;">Loại trừ chính: ${(pk.exclusions||[]).slice(0,2).join('; ')}</div>
     <div style="font-size:14.5px;font-weight:700;color:var(--brand-600);margin-top:6px;">${rt?BANCA.vnd(rt.totalPremium):'—'}<span style="font-size:11px;color:var(--ink-300);font-weight:400;">/năm (phí thành viên)</span></div>
     <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
      ${!readOnly&&!inactive?`<button class="btn ${isSel?'btn-secondary':'btn-primary'} btn-sm" onclick="healthUnitPickPackage('${app.id}','${curUnitId}','${pk.code}')" ${isSel?'disabled':''}>${isSel?'Đang chọn':'Chọn cho thành viên này'}</button>`:''}
      <button class="btn btn-secondary btn-sm" onclick="showHealthPackageDetail('${pk.code}')">Xem quyền lợi chi tiết</button>
     </div>
    </div>`;
  }).join('');
  const fam = BANCA.healthFamilyRating(app);
  const famRows = fam.lines.map(function(l){return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${l.name} · ${healthPkgName(l.package)}</span><b>${l.eligible?BANCA.vnd(l.premium):'—'}</b></div>`;}).join('');
  const famBlock = `<div class="card" style="padding:14px;">
    <div class="label" style="margin-bottom:8px;">Báo giá gia đình (phí từng người → chiết khấu → tổng)</div>
    ${famRows}
    ${fam.familyDiscount?`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;color:var(--teal-600);"><span>Chiết khấu gia đình (≥3 thành viên)</span><b>−${BANCA.vnd(fam.familyDiscount)}</b></div>`:''}
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;padding:8px 0 0;border-top:1px solid var(--line);margin-top:4px;color:var(--brand-600);"><span>Tổng phí gia đình</span><span>${BANCA.vnd(fam.total)}</span></div>
    <div style="font-size:10.5px;color:var(--ink-300);margin-top:6px;">Mỗi thành viên có quote riêng theo insuredUnitId. Biểu phí minh họa.</div>
   </div>`;
  // Beneficiary — section CÓ ĐIỀU KIỆN: chỉ khi gói có quyền lợi tử vong.
  const beneBlock = (sel && BANCA.healthPackageHasDeathBenefit(sel)) ? (function(){
    const bs = unit.beneficiaries||[];
    const total = bs.reduce(function(s,b){return s+(Number(b.share)||0);},0);
    const rows = bs.map(function(b,bi){return `<div style="display:grid;grid-template-columns:1.4fr 1fr 90px 60px;gap:8px;margin-bottom:6px;align-items:end;">
       <div><input value="${b.name||''}" ${readOnly?'disabled':''} onchange="healthUnitBeneSet('${app.id}','${curUnitId}',${bi},'name',this.value)" placeholder="Họ tên" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;"></div>
       <div><input value="${b.relationship||''}" ${readOnly?'disabled':''} onchange="healthUnitBeneSet('${app.id}','${curUnitId}',${bi},'relationship',this.value)" placeholder="Quan hệ" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;"></div>
       <div><input type="number" value="${b.share||''}" ${readOnly?'disabled':''} onchange="healthUnitBeneSet('${app.id}','${curUnitId}',${bi},'share',this.value)" placeholder="%" style="width:100%;padding:7px;border:1px solid var(--line);border-radius:7px;"></div>
       <div>${!readOnly?`<button class="btn btn-secondary btn-sm" onclick="healthUnitBeneRemove('${app.id}','${curUnitId}',${bi})">Xóa</button>`:''}</div>
      </div>`;}).join('');
    return `<div class="card" style="padding:14px;margin-top:12px;"><div class="label" style="margin-bottom:8px;">Người thụ hưởng của ${unit.name||'thành viên'} <span class="chip" style="font-size:9px;">tổng phải = 100%</span></div>
      ${rows||'<div style="font-size:12px;color:var(--ink-300);margin-bottom:6px;">Chưa có người thụ hưởng.</div>'}
      <div style="font-size:12px;color:${total===100?'var(--teal-600)':'var(--amber-600)'};margin:4px 0 8px;">Tổng tỷ lệ: <b>${total}%</b> ${total===100?'✓':'(mỗi thành viên tính riêng, không cộng chéo)'}</div>
      ${!readOnly?`<button class="btn btn-secondary btn-sm" onclick="healthUnitBeneAdd('${app.id}','${curUnitId}')">+ Thêm người thụ hưởng</button>`:''}
     </div>`;
  })() : `<div class="alert2 info" style="margin-top:12px;font-size:12px;">Gói sức khỏe đang chọn không có quyền lợi tử vong — không cần khai người thụ hưởng (section có điều kiện).</div>`;
  const header = unit ? `<div class="card" style="padding:11px 14px;margin-bottom:12px;background:var(--brand-100);border-color:transparent;">
     <span style="font-size:12px;color:var(--ink-500);">Đang cấu hình gói cho</span> <b style="font-size:13.5px;">${unit.name||'—'} · ${unit.age!=null?unit.age+' tuổi':'chưa có DOB'} · ${unit.relationship||'—'}</b>${inactive?' <span class="chip" style="background:#fdecec;color:var(--red-600);">Đã loại</span>':''}
    </div>` : '';
  const applyAll = (sel && !readOnly && !inactive) ? `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
     <button class="btn btn-secondary btn-sm" onclick="showHealthCompare()">So sánh gói</button>
     <button class="btn btn-secondary btn-sm" onclick="healthApplyPackageToAll('${app.id}','${sel}')">Áp dụng gói này cho thành viên đủ điều kiện</button>
    </div>` : `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;"><button class="btn btn-secondary btn-sm" onclick="showHealthCompare()">So sánh gói</button></div>`;
  const main = `<div class="alert2 info" style="margin-bottom:12px;">Gói Bảo hiểm sức khỏe theo từng thành viên (${(BANCA.journeyFor('health').packageSchemaId)}) — packageMode PER_MEMBER, phí tổng hợp sau (PER_MEMBER_THEN_AGGREGATE).</div>
   ${header}${applyAll}
   <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">${cards}</div>${famBlock}${beneBlock}`;
  stepBody = healthWithNav(app, curUnitId, 'PACKAGE_AND_QUOTE', main);
 } else if(cur.id==='PACKAGE_AND_QUOTE' && BANCA.journeyStageComponent(app.productId,'PACKAGE_AND_QUOTE')==='paPackage'){
  // P0.5 — PA package & báo giá (ratePA). Dispatch theo component id trong registry (không hard-code productId).
  const sel = app.package || null;
  const cards = Object.values(BANCA.paPackages).map(function(pk){
    const c0=BANCA.customerById(app.customerId)||{};
    const calcAge=ageOnDate((app.buyerIsInsured!==false)?c0.dob:app.insuredDob, app.effectiveDate||dateOnly(new Date().toISOString()));
    const rt = BANCA.ratePA({packageCode:pk.code, sumInsured:pk.sumInsured, age:calcAge||app.insuredAge||30, occupationClass:app.occupationClass||'CLASS_1'});
    const isSel = sel===pk.code;
    const prem = rt&&!rt.ineligible ? BANCA.vnd(rt.totalPremium) : '—';
    const benefits = paBenefitRows(pk.code).map(([k,v])=>`<div style="display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:3px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${k}</span><b style="text-align:right;">${v}</b></div>`).join('');
    return `<div class="card" style="margin:0;padding:14px;${isSel?'border:2px solid var(--brand-600);':''}">
     <div style="display:flex;justify-content:space-between;"><b style="font-size:13.5px;">${pk.name}</b>${isSel?'<span class="badge badge-ready">Đã chọn</span>':''}</div>
     <div style="font-size:11.5px;color:var(--ink-500);margin:6px 0;">${pk.desc}</div>
     <div style="font-size:11px;color:var(--ink-300);">Thời hạn ${(pk.termMonths||12)} tháng · Phạm vi ${pk.territory||'Việt Nam'}</div>
     <div style="margin-top:8px;">${benefits}</div>
     <div style="font-size:11px;color:var(--ink-500);margin-top:8px;">Loại trừ chính: ${(pk.exclusions||[]).slice(0,2).join('; ')}</div>
     <div style="font-size:14.5px;font-weight:700;color:var(--brand-600);margin-top:6px;">${prem}<span style="font-size:11px;color:var(--ink-300);font-weight:400;">/năm (phí dự kiến)</span></div>
     <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
      ${!readOnly?`<button class="btn ${isSel?'btn-secondary':'btn-primary'} btn-sm" onclick="paPickPackage('${app.id}','${pk.code}')" ${isSel?'disabled':''}>${isSel?'Đang chọn':'Chọn gói'}</button>`:''}
      <button class="btn btn-secondary btn-sm" onclick="showPaPackageDetail('${pk.code}')">Xem quyền lợi chi tiết</button>
     </div>
    </div>`;
  }).join('');
  const q = app.quote;
  const quoteBlock = q ? `<div class="card" style="padding:14px;">
    <div class="label">Báo giá — ${q.quoteId||q.id||''} <span class="chip" style="font-size:9px;">${q.quoteType||'INDICATIVE'}</span></div>
    <div style="font-size:18px;font-weight:700;color:var(--brand-600);margin-top:6px;">${BANCA.vnd(q.premium||q.adjustedPremium)}<span style="font-size:12px;color:var(--ink-300);font-weight:400;">/năm</span></div>
    <div style="font-size:10.5px;color:var(--ink-300);margin-top:6px;">Biểu phí minh họa (DEMO_TARIFF). Phí có thể đổi sau khai báo rủi ro.</div>
   </div>` : '<div class="alert2 info">Chọn gói để tính phí dự kiến.</div>';
  stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Gói Bảo hiểm tai nạn cá nhân theo số tiền bảo hiểm — phí tính theo tuổi × nhóm nghề (${(BANCA.journeyFor('pa').packageSchemaId)}).</div>
   <div style="display:flex;justify-content:flex-end;margin-bottom:10px;"><button class="btn btn-secondary btn-sm" onclick="showPaCompare()">So sánh các gói</button></div>
   <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">${cards}</div>${quoteBlock}`;
 } else if(cur.id==='RISK_OBJECT' && BANCA.journeyStageComponent(app.productId,'RISK_OBJECT')==='motorVehicle'){
  const v=app.vehicle||{};
  const brands=Object.keys(BANCA.vehicleMaster.brands);
  const models=BANCA.vehicleMaster.brands[v.brand]||BANCA.vehicleMaster.brands[brands[0]]||[];
  // Luồng xe thế chấp (doc 2026-07-20): single source of truth TẠI ĐÂY — không hỏi lại ở Khai báo rủi ro
  const mg = app.mortgage||{mortgaged:false};
  const ovMg = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id]&&BANCA.overlay.applications[app.id].mortgage);
  const mgCur = ovMg||mg;
  const bankFedCust = (entryMode==='BANK_CUSTOMER'||entryMode==='INSURANCE_CUSTOMER'||entryMode==='RENEWAL') && cust;
  const regRec = BANCA.docGet(app.id,'REG');
  const ex = regRec.extracted;
  const scanned = !!(regRec.dataUrl||regRec.fileName);
  const regDef = {code:'REG', name:'Giấy đăng ký xe', sub:'OCR tự động điền thông tin xe — KHÔNG lấy giá trị xe', ocr:'enabled', required:true, docType:'VEHICLE_REGISTRATION'};
  const gx = k => ex ? ((ex.fields.find(f=>f.key===k)||{}).value)||'' : '';
  const ownerConflict = !!(ex && bankFedCust && gx('ownerName') && gx('ownerName')!==cust.name);
  const vOwner = ownerConflict ? cust.name : (ex? gx('ownerName') : (v.owner||(cust&&cust.name)||''));
  const vPlate = ex? gx('plate') : (v.plate||'');
  const vVin   = ex? gx('chassisNumber') : (v.vin||'');
  const vEngine= ex? gx('engineNumber') : (v.engineNo||'');
  const vYear  = ex? gx('manufactureYear') : (v.year||'');
  const vColor = ex? gx('color') : (v.color||'');
  const vBrand = ex? gx('brand') : (v.brand||'');
  const vModel = ex? gx('model') : (v.model||'');
  const vType  = ex? gx('type') : (v.type||'');
  const vSeats = ex? (gx('seats')||5) : (v.seats||5);
  const bankAssetValue = (bankFedCust && /ô ?tô|oto|xe/i.test(cust.loanRef||'')) ? 1450000000 : null;
  const vValue = bankAssetValue || v.value || 0;

  window.__docRefresh = function(){ location.reload(); };

  const inputMethods = `<div class="card" style="padding:14px 16px;margin-bottom:12px;">
    <div style="font-weight:700;">🚗 Thông tin xe (VEHICLE)</div>
    <div style="font-size:12.5px;color:var(--ink-500);margin:4px 0 12px;">Chọn cách nhập. OCR KHÔNG lấy: giá trị xe · mục đích sử dụng · tình trạng thế chấp · lịch sử tổn thất (các mục này từ ngân hàng / định giá / nhân viên tư vấn nhập).</div>
    ${!scanned ? `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <input type="file" id="docf-REG" accept="image/*" style="display:none" onchange="docUpload('${app.id}','REG','VEHICLE_REGISTRATION',this)">
      <input type="file" id="docf-REGc" accept="image/*" capture="environment" style="display:none" onchange="docUpload('${app.id}','REG','VEHICLE_REGISTRATION',this)">
      <button class="btn btn-primary" onclick="document.getElementById('docf-REG').click()">📷 Quét đăng ký xe</button>
      <button class="btn btn-secondary" onclick="document.getElementById('docf-REGc').click()">Chụp ảnh</button>
      <span style="color:var(--ink-300);">— hoặc —</span>
      <button class="btn btn-secondary" onclick="var e=document.getElementById('vm-plate'); if(e) e.focus();">✍️ Nhập thủ công</button>
    </div>` : `<div class="card" style="padding:0;overflow:hidden;">${BANCA.docItemHtml(app.id, regDef)}</div>`}
  </div>`;

  const OCR_SHOW = ['ownerName','plate','brand','model','type','chassisNumber','engineNumber','manufactureYear','color','seats'];
  const extractedPanel = ex? `<div class="card" style="padding:14px 16px;margin-bottom:12px;border-left:4px solid var(--teal-600);">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <b>Dữ liệu bóc tách từ Giấy đăng ký xe</b>
      <span style="font-size:12px;color:var(--ink-500);">Nguồn: Đăng ký xe · tin cậy tổng ${BANCA.pctConf(ex.overall)} · ${BANCA.ocrStateBadge('review', regRec.reviewStatus||'NOT_REVIEWED')}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px;">
      ${ex.fields.filter(f=>OCR_SHOW.includes(f.key)).map(f=>{const low=f.confidence<0.85;return `<div style="font-size:12.5px;padding:8px;border:1px solid ${low?'var(--amber-600)':'var(--line)'};border-radius:8px;${low?'background:#fdf7ec;':''}"><div style="color:var(--ink-500);font-size:11px;">${f.label} · ${BANCA.pctConf(f.confidence)}${low?' <span class="badge badge-conditional" style="font-size:9px;">Cần kiểm tra</span>':''}</div><div style="font-weight:600;">${f.value}</div></div>`;}).join('')}
    </div>
    <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">Giá trị đã điền vào form bên dưới — rà soát & sửa nếu cần. Trường tin cậy thấp cần kiểm tra trước khi tiếp tục.</div>
  </div>` : '';

  const conflictCard = ownerConflict ? `<div class="card" style="padding:14px 16px;margin-bottom:12px;border-left:4px solid var(--red-600);">
    <b style="color:var(--red-600);">⚠️ Xung đột dữ liệu — Chủ xe (Data conflict)</b>
    <div style="font-size:12.5px;color:var(--ink-500);margin:6px 0 10px;">Nguồn ngân hàng và OCR khác nhau. Chọn giá trị dùng cho yêu cầu (không ghi đè master).</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <label style="border:1px solid var(--line);border-radius:9px;padding:10px;cursor:pointer;"><input type="radio" name="ownconf" value="bank" checked onchange="var e=document.getElementById('vm-owner'); if(e)e.value='${cust.name}';"> <b>${cust.name}</b><div style="font-size:11px;color:var(--ink-500);">Nguồn ngân hàng (CIF ${cust.cif||'—'})</div></label>
      <label style="border:1px solid var(--line);border-radius:9px;padding:10px;cursor:pointer;"><input type="radio" name="ownconf" value="ocr" onchange="var e=document.getElementById('vm-owner'); if(e)e.value='${gx('ownerName')}';"> <b>${gx('ownerName')}</b><div style="font-size:11px;color:var(--ink-500);">OCR đăng ký xe</div></label>
    </div>
  </div>` : '';

  const g1 = `<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">1 · Nhận dạng xe</div><div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px;">
    ${inputId('vm-plate','Biển số', vPlate)}${inputId('vm-owner','Chủ xe (theo đăng ký)', vOwner)}
    ${combo('vm-brand','Hãng xe',brands,vBrand)}${combo('vm-model','Dòng xe',models,vModel)}
    ${combo('vm-type','Loại xe',BANCA.vehicleMaster.types,vType)}
  </div></div>`;
  const g2 = `<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">2 · Thông tin kỹ thuật</div><div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px;">
    ${inputId('vm-vin','Số khung (VIN)', vVin)}${inputId('vm-engine','Số máy', vEngine)}
    ${inputId('vm-year','Năm sản xuất', vYear)}${inputId('vm-color','Màu xe', vColor)}
    ${combo('vm-seats','Số chỗ ngồi',BANCA.vehicleMaster.seats,vSeats)}
  </div></div>`;
  const g3 = `<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">3 · Sử dụng & định giá <span style="font-weight:400;color:var(--ink-300);font-size:10.5px;">(không lấy từ OCR)</span></div><div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 18px;">
    ${combo('vm-usage','Mục đích sử dụng',BANCA.vehicleMaster.usages,v.usage)}
    ${inputId('vm-value','Giá trị xe (VNĐ)', vValue?vValue.toLocaleString('vi-VN'):'', bankAssetValue?'Nguồn: Janus Loan System (asset context) — có thể chỉnh theo định giá':'Giá trị thị trường — nhập tay hoặc từ dịch vụ định giá')}
  </div>${bankAssetValue?'<div style="font-size:11.5px;color:var(--ink-500);margin-top:2px;">'+BANCA.sourceBadge('BANK')+' Giá trị tài sản lấy từ Janus Loan System.</div>':''}</div>`;

  const g4 = `<div class="card" style="padding:16px;margin-bottom:12px;border-left:3px solid ${mgCur.mortgaged?'var(--amber-600)':'var(--line)'};">
   <div class="label" style="margin-bottom:8px;">4 · Sở hữu & khoản vay <span style="font-weight:400;color:var(--ink-300);font-size:10.5px;">(nguồn duy nhất quyết định bên thụ hưởng — không lấy từ OCR)</span></div>
   ${bankFedCust&&cust.loanRef?`<div style="font-size:12px;color:var(--ink-500);margin-bottom:8px;">${BANCA.sourceBadge('BANK')} Ngữ cảnh khoản vay (Janus Loan System): <b>${cust.loanRef}</b> — không cần nhập lại.</div>`:''}
   <div class="field" style="max-width:480px;"><label style="font-size:11.5px;color:var(--ink-500);">Chiếc xe này có đang được dùng làm tài sản thế chấp/bảo đảm cho khoản vay không?</label>
    <select id="mg-flag" ${readOnly?'disabled':''} onchange="mortgageChanged()" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;">
     <option value="0" ${mgCur.mortgaged?'':'selected'}>Không</option>
     <option value="1" ${mgCur.mortgaged?'selected':''}>Có — xe là tài sản thế chấp/bảo đảm</option>
    </select></div>
   <div id="mg-block" style="display:${mgCur.mortgaged?'block':'none'};margin-top:10px;">
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px;">
     <div class="field" style="margin-bottom:10px;"><label style="font-size:11.5px;color:var(--ink-500);display:block;margin-bottom:3px;">Loại bên thụ hưởng</label>
      <select id="mg-type" ${readOnly?'disabled':''} onchange="mortgageChanged()" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;">
       <option ${(mgCur.lenderType||'Ngân hàng')==='Ngân hàng'?'selected':''}>Ngân hàng</option>
       <option ${mgCur.lenderType==='Công ty tài chính'?'selected':''}>Công ty tài chính</option>
       <option ${mgCur.lenderType==='Công ty cho thuê tài chính'?'selected':''}>Công ty cho thuê tài chính</option>
      </select></div>
     ${combo('mg-bank','Tên bên cho vay / bên nhận thế chấp',['Janus Bank','Vietcombank','BIDV','Techcombank','VPBank','FE Credit','HD Saison','Chailease','VietinBank Leasing'],mgCur.bank||'')}
     ${input('Chi nhánh', mgCur.branch||'')}
     ${input('Số hợp đồng tín dụng', mgCur.creditContract||v.loanRef||'')}
    </div>
    <div style="font-size:10.5px;color:var(--ink-300);">Bên thụ hưởng nhập độc lập — không suy ra từ kênh bán (Nhân viên tư vấn).</div>
   </div>
   ${app.source==='RENEWAL'?'<div style="font-size:11px;color:var(--amber-600);margin-top:6px;">⚠ Yêu cầu tái tục: câu hỏi này PHẢI hỏi lại — không kế thừa từ kỳ trước.</div>':''}
  </div>`;

  stepBody = inputMethods + conflictCard + extractedPanel + g1 + g2 + g3 + g4;
 } else if(cur.id==='PACKAGE_AND_QUOTE'){
  // ===== Công thức thác nước (chốt 16:35): TNDS tách riêng · Vật chất: gốc + add-on(tiền) = Subtotal − NCD(trên subtotal) + VAT = Phí phải đóng =====
  const q=app.quote;
  const snap=(q&&q.inputsSnapshot)||{};
  const val=(app.vehicle&&app.vehicle.value)||600000000;
  const curPkgCode = snap.packageCode || (app.package||'').toUpperCase() || null;
  const qStatus = q? BANCA.quoteStatus(q, null) : null;
  const pkg = BANCA.motorPackages[curPkgCode]||null;
  // "(đã tùy chỉnh)" khi add-on/khấu trừ lệch mặc định gói
  const customized = pkg && ( JSON.stringify((snap.addOns||[]).slice().sort())!==JSON.stringify(pkg.defaultAddOns.slice().sort()) || snap.deductible!==pkg.defaultDeductible );

  const pkgCards = Object.values(BANCA.motorPackages).map(pk=>{
   const rt=BANCA.rateMotor({packageCode:pk.code,sumInsured:val,termMonths:12,addOns:pk.defaultAddOns,deductible:pk.defaultDeductible,ncdPercent:snap.ncdPercent||0,vehicleAgeYears:snap.vehicleAgeYears||0});
   const isSel=curPkgCode===pk.code;
   return `<div class="card" style="margin:0;padding:14px;${isSel?'border:2px solid var(--brand-600);':''}">
    <div style="display:flex;justify-content:space-between;"><b style="font-size:13.5px;">${pk.name}${isSel&&customized?' <span style="font-size:10px;color:var(--amber-600);font-weight:600;">(đã tùy chỉnh)</span>':''}</b>${isSel?'<span class="badge badge-ready">Đã chọn</span>':''}</div>
    <div style="font-size:11.5px;color:var(--ink-500);margin:6px 0;">${pk.desc}</div>
    <div style="font-size:11px;color:var(--ink-300);">Quyền lợi lõi: ${pk.coverageList.map(c=>BANCA.coverageLabels[c]).join(', ')}</div>
    <div style="font-size:14.5px;font-weight:700;color:var(--brand-600);margin-top:6px;">${BANCA.vnd(rt.totalPremium)}<span style="font-size:11px;color:var(--ink-300);font-weight:400;">/năm (tham khảo, mặc định gói)</span></div>
    ${!readOnly&&caps.includes('can_quote')?`<button class="btn ${isSel?'btn-secondary':'btn-primary'} btn-sm" style="margin-top:8px;" onclick="pickPackage('${pk.code}')" ${isSel?'disabled style="margin-top:8px;opacity:.6;"':''}>${isSel?'Đang chọn':'Chọn gói'}</button>`:''}
   </div>`;
  }).join('');

  const dedSel = BANCA.deductibleOptions.map(d=>`<option value="${d}" ${(snap.deductible||2000000)===d?'selected':''}>${BANCA.vnd(d)}/vụ</option>`).join('');
  // Add-on: hiện SỐ TIỀN (không chỉ %) — tính trên OD base hiện tại
  const odBaseNow = pkg? Math.round(val*pkg.rate) : 0;
  const addOnToggles = Object.values(BANCA.motorAddOns).map(a=>{
   const on=(snap.addOns||[]).includes(a.code);
   const amt=odBaseNow? Math.round(odBaseNow*a.ratePct/100) : 0;
   return `<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding:7px 10px;border:1px solid ${on?'var(--brand-600)':'var(--line)'};border-radius:8px;cursor:pointer;${on?'background:var(--brand-100);':''}"><input type="checkbox" class="addon-cb" data-code="${a.code}" ${on?'checked':''} ${readOnly?'disabled':''} onchange="autoRerate()"> ${a.name} <b style="font-size:11.5px;">+${amt?BANCA.vnd(amt):a.ratePct+'%'}</b> <span style="color:var(--ink-300);font-size:10px;">(bỏ chọn để không mua)</span></label>`;
  }).join('');

  // Khối báo giá THÁC NƯỚC
  const wfRow=(label,amount,opts)=>{
   opts=opts||{};
   return `<tr style="${opts.rule?'border-top:1px solid var(--line);':''}"><td style="padding:${opts.bold?'6px':'3px'} 14px 3px 0;color:${opts.muted?'var(--ink-300)':opts.bold?'var(--ink-900)':'var(--ink-500)'};${opts.bold?'font-weight:700;':''}">${label}</td><td style="text-align:right;${opts.bold?'font-weight:700;font-size:14px;color:var(--brand-600);':''}color:${opts.neg?'var(--teal-600)':opts.pos?'var(--amber-600)':'inherit'};">${amount}</td></tr>`;
  };
  const quoteBlock = q&&q.subtotal!=null? (()=>{
   const effStatus = qStatus;
   const stale = effStatus==='STALE'||effStatus==='EXPIRED';
   return `<div class="card" style="padding:14px;" id="quote-block">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
     <div style="flex:1;min-width:340px;">
      <div class="label">Báo giá — ${q.id} (v${q.version}) <span id="q-badge">${BANCA.quoteStatusBadge(effStatus)}</span></div>
      <div id="q-table-wrap" style="transition:opacity .2s;">
      <table style="margin-top:8px;font-size:12.5px;border-collapse:collapse;width:100%;max-width:520px;">
       ${wfRow('<b>Khối 1 — TNDS bắt buộc</b> <span style="font-size:10.5px;color:var(--ink-300);">(phí luật cố định, không add-on/NCD)</span>', BANCA.vnd(q.tplPremium))}
       ${wfRow('<b style="padding-top:6px;display:inline-block;">Khối 2 — Vật chất xe</b>','',{rule:true})}
       ${wfRow('Phí gốc vật chất ('+((BANCA.motorPackages[snap.packageCode]||{}).name||app.package)+' · IDV '+BANCA.vnd(snap.sumInsured||val)+')', BANCA.vnd(q.odBase))}
       ${(q.lines||[]).map(l=>wfRow((l.amount<0?'− ':'+ ')+l.label+' ('+l.pct+'%)', (l.amount<0?'−':'+')+BANCA.vnd(Math.abs(l.amount)), {neg:l.amount<0,pos:l.amount>0})).join('')}
       ${wfRow('= Tạm tính trước giảm phí (Subtotal)', BANCA.vnd(q.subtotal), {rule:true})}
       ${q.ncdAmount?wfRow('− NCD '+q.ncdPct+'% <span style="font-size:10.5px;color:var(--ink-300);">(trên subtotal đã gồm add-on)</span>','−'+BANCA.vnd(q.ncdAmount),{neg:true}):''}
       ${q.ncdAmount?wfRow('= Phí vật chất sau giảm', BANCA.vnd(q.odAfterNcd), {rule:true}):''}
       ${wfRow('+ VAT '+BANCA.VAT_PCT+'% (phần vật chất)','+'+BANCA.vnd(q.vatAmount),{pos:true})}
       ${wfRow('<span id="q-total-label">= PHÍ PHẢI ĐÓNG (TNDS + Vật chất)</span>', '<span id="q-total">'+BANCA.vnd(q.totalPremium)+'</span>', {rule:true,bold:true})}
      </table>
      </div>
      <div id="q-dirty-note" style="display:none;font-size:12px;color:var(--red-600);font-weight:600;margin-top:6px;">Phí sẽ thay đổi — bấm "Tính phí" để cập nhật.</div>
      <div style="font-size:11.5px;color:${stale?'var(--red-600)':'var(--ink-500)'};margin-top:6px;">Hiệu lực đến ${q.validUntil} · rated ${q.ratedAt}</div>
     </div>
     <div style="display:flex;flex-direction:column;gap:6px;">
      ${!readOnly&&caps.includes('can_quote')&&effStatus!=='ACTIVE'?`<button class="btn btn-primary btn-sm" id="rate-btn" onclick="rerate()">Tính phí lại</button>`:''}
      ${!readOnly&&caps.includes('can_quote')?`<button class="btn btn-secondary btn-sm" onclick="restoreDefaults()" title="Đưa add-on & khấu trừ về đúng cấu hình gốc của gói đang chọn">Khôi phục mặc định gói</button>`:''}
      <button class="btn btn-secondary btn-sm" onclick="showQuoteHistory()">Lịch sử báo giá</button>
     </div>
    </div>
   </div><div id="quote-history"></div>`;
  })() : '<div class="alert2 info" id="quote-block">Chưa có báo giá — chọn gói, chỉnh tùy chọn và bấm "Tính phí".'+((!readOnly&&caps.includes('can_quote'))?' <button class="btn btn-primary btn-sm" onclick="rerate()">Tính phí</button>':'')+'</div>';

  stepBody = `
  <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">${pkgCards}</div>
  <div class="card" style="padding:14px;margin-bottom:12px;">
   <div class="label" style="margin-bottom:10px;">Tùy chọn báo giá</div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
    <div><label style="font-size:11.5px;color:var(--ink-500);">Thời hạn bảo hiểm</label>
     <select ${readOnly?'disabled':''} style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;" onchange="autoRerate()"><option>12 tháng (20/07/2026 → 19/07/2027)</option></select></div>
    <div><label style="font-size:11.5px;color:var(--ink-500);">Mức khấu trừ</label>
     <select id="opt-ded" ${readOnly?'disabled':''} style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;" onchange="autoRerate()">${dedSel}</select></div>
    <div><label style="font-size:11.5px;color:var(--ink-500);">Sum insured (IDV)</label>
     <div style="padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;background:var(--paper);font-size:13px;">${BANCA.vnd(snap.sumInsured||val)}</div></div>
   </div>
   <div style="margin-top:12px;"><label style="font-size:11.5px;color:var(--ink-500);">Add-on <span style="color:var(--ink-300);">— tick sẵn = mặc định gói, bỏ được (phí đổi sau khi Tính phí lại)</span></label>
    <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">${addOnToggles}</div></div>
  </div>
  ${quoteBlock}`;
 } else if(cur.id==='RISK_DECLARATION' && app.productId==='health'){
  // Khai báo sức khỏe PER MEMBER — bộ câu hỏi người lớn vs trẻ em khác nhau; câu trả lời RIÊNG từng insuredUnitId.
  const unit = healthCurUnit(app);
  const curUnitId = unit ? unit.insuredUnitId : null;
  const inactive = unit && unit.active===false;
  const ra = (unit && unit.riskAnswers) || {};
  const qs2 = unit ? BANCA.healthUnitQuestions(unit) : [];
  const qHtml = qs2.map(function(q){
    const v = ra[q.code];
    if(q.branchOn && ra[q.branchOn]!==true) return '';
    if(q.type==='text'){
     return `<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q.label} <span class="chip" style="font-size:9px;">${q.triggers||'detail'}</span></div>
      <textarea ${readOnly||inactive?'disabled':''} onchange="healthUnitSetRisk('${app.id}','${curUnitId}','${q.code}',this.value,'text')" style="width:100%;min-height:64px;margin-top:8px;padding:8px;border:1px solid var(--line);border-radius:7px;font-family:inherit;font-size:12.5px;">${v||''}</textarea></div>`;
    }
    const yes=v===true, no=v===false;
    return `<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q.label} <span class="chip" style="font-size:9px;">${q.triggers}</span></div>
     <div style="display:flex;gap:14px;margin-top:8px;font-size:12.5px;">
      <label><input type="radio" name="hq_${curUnitId}_${q.code}" ${yes?'checked':''} ${readOnly||inactive?'disabled':''} onchange="healthUnitSetRisk('${app.id}','${curUnitId}','${q.code}',true,'bool')"> Có</label>
      <label><input type="radio" name="hq_${curUnitId}_${q.code}" ${no?'checked':''} ${readOnly||inactive?'disabled':''} onchange="healthUnitSetRisk('${app.id}','${curUnitId}','${q.code}',false,'bool')"> Không</label>
     </div></div>`;
  }).join('');
  const elig = unit ? BANCA.healthUnitEligibility(app, unit) : {errors:[],warnings:[]};
  const branchNote = (elig.errors.length||elig.warnings.length) ? `<div class="alert2 ${elig.errors.length?'danger':'warn'}" style="margin-top:8px;">${elig.errors.concat(elig.warnings).map(function(e){return (elig.errors.indexOf(e)>=0?'🚫 ':'⚠ ')+e.msg;}).join('<br>')}</div>` : `<div class="alert2 info" style="margin-top:8px;">Chưa phát sinh yếu tố cần thẩm định cho thành viên này.</div>`;
  const header = unit ? `<div class="card" style="padding:11px 14px;margin-bottom:12px;background:var(--brand-100);border-color:transparent;">
     <span style="font-size:12px;color:var(--ink-500);">Khai báo sức khỏe cho</span> <b style="font-size:13.5px;">${unit.name||'—'} · ${unit.age!=null?unit.age+' tuổi':'?'} · ${unit.isChild?'bộ câu hỏi TRẺ EM':'bộ câu hỏi NGƯỜI LỚN'}</b>${inactive?' <span class="chip" style="background:#fdecec;color:var(--red-600);">Đã loại</span>':''}
    </div>` : '';
  const main = `<div class="alert2 info" style="margin-bottom:12px;">Khai báo sức khỏe theo từng người (questionnaireMode PER_MEMBER). Câu trả lời không dùng chung giữa các thành viên; đổi câu trả lời có thể kích hoạt thẩm định/phụ phí/loại trừ.</div>
   ${header}${inactive?'<div class="alert2 warn">Thành viên đã bị loại khỏi yêu cầu — không cần khai báo.</div>':qHtml+branchNote}`;
  stepBody = healthWithNav(app, curUnitId, 'RISK_DECLARATION', main);
 } else if(cur.id==='RISK_DECLARATION'){
  // P0.3/P0.4 — Câu hỏi rủi ro REGISTRY-DRIVEN theo declarationSchema của journey.
  // Câu trả lời được LƯU vào app.riskAnswers và THỰC SỰ tham gia rating (firm quote).
  const mgD = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id]&&BANCA.overlay.applications[app.id].mortgage)||app.mortgage||{mortgaged:false};
  const rQs = (BANCA.riskQuestionsFor?BANCA.riskQuestionsFor(app.productId):BANCA.motorRiskQuestions)||[];
  const ra = app.riskAnswers || {};
  const isMotor = app.productId==='motor';
  const mgLine = isMotor ? `<div class="card" style="padding:10px 14px;margin-bottom:8px;background:var(--paper);">
   <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--ink-500);">
    <span>Tình trạng thế chấp <span class="chip" style="font-size:9px;">suy ra từ bước Đối tượng bảo hiểm</span></span>
    <b style="color:var(--ink-700);">${mgD.mortgaged?('Có — '+(mgD.bank||'')+' (bên thụ hưởng)'):'Không'}</b>
   </div></div>` : '';
  const qHtml = rQs.map(function(q){
   const v = ra[q.code];
   if(q.branchOn && ra[q.branchOn]!==true) return '';
   if(q.type==='number'){
    return `<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q.label}</div>
     <input type="number" min="0" value="${v==null?'':v}" ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','${q.code}',this.value,'number')" style="width:140px;margin-top:8px;padding:7px;border:1px solid var(--line);border-radius:7px;"></div>`;
   }
   if(q.type==='text'){
    return `<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q.label} <span class="chip" style="font-size:9px;">${q.triggers||'detail'}</span></div>
     <textarea ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','${q.code}',this.value,'text')" style="width:100%;min-height:70px;margin-top:8px;padding:8px;border:1px solid var(--line);border-radius:7px;font-family:inherit;font-size:12.5px;">${v||''}</textarea></div>`;
   }
   const yes=v===true, no=v===false;
   return `<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q.label} <span class="chip" style="font-size:9px;">${q.triggers}</span></div>
    <div style="display:flex;gap:14px;margin-top:8px;font-size:12.5px;">
     <label><input type="radio" name="rq_${q.code}" ${yes?'checked':''} ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','${q.code}',true,'bool')"> Có</label>
     <label><input type="radio" name="rq_${q.code}" ${no?'checked':''} ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','${q.code}',false,'bool')"> Không</label>
    </div></div>`;
  }).join('');
  const paBranch = app.productId==='pa' && ra.hazardousActivity===true ? `<div class="card" style="padding:14px;margin-bottom:8px;border-left:4px solid var(--amber-600);">
    <div class="label" style="margin-bottom:8px;color:var(--amber-600);">Thông tin bổ sung cho hoạt động nguy hiểm</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
     <div><label style="font-size:11.5px;color:var(--ink-500);">Loại hoạt động</label><input value="${ra.activityType||''}" ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','activityType',this.value,'text')" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Tần suất</label><select ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','frequency',this.value,'text')" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"><option value="">Chọn</option><option ${ra.frequency==='OCCASIONAL'?'selected':''} value="OCCASIONAL">Thỉnh thoảng</option><option ${ra.frequency==='MONTHLY'?'selected':''} value="MONTHLY">Hàng tháng</option><option ${ra.frequency==='WEEKLY'?'selected':''} value="WEEKLY">Hàng tuần</option></select></div>
     <div><label style="font-size:11.5px;color:var(--ink-500);">Tính chất</label><select ${readOnly?'disabled':''} onchange="setRiskAnswer('${app.id}','professionalOrRecreational',this.value,'text')" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;margin-top:3px;"><option value="">Chọn</option><option ${ra.professionalOrRecreational==='RECREATIONAL'?'selected':''} value="RECREATIONAL">Giải trí</option><option ${ra.professionalOrRecreational==='PROFESSIONAL'?'selected':''} value="PROFESSIONAL">Chuyên nghiệp/nghề nghiệp</option></select></div>
    </div>
    <div class="alert2 warn" style="margin-top:10px;">Khai báo này kích hoạt referral/loading result. Nếu là hoạt động chuyên nghiệp hoặc tần suất cao, yêu cầu chuyển thẩm định.</div>
   </div>` : '';
  stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Câu hỏi động theo sản phẩm (${(BANCA.journeyFor(app.productId).declarationSchemaId)||'schema'}). Chỉ gồm yếu tố ảnh hưởng xác suất tổn thất & định phí. Đổi câu trả lời có thể kích hoạt <b>referral/thẩm định</b> và <b>tính lại phí chính thức</b>.</div>
  ${mgLine}${qHtml}${paBranch}
 <div id="firm-quote-panel" style="margin-top:6px;">${window.firmQuotePanelHtml?window.firmQuotePanelHtml(app):''}</div>`;
 } else if(cur.id==='DOCUMENTS'){
  if(app.productId==='health'){
   const bankKyc = ['BANK_CUSTOMER','INSURANCE_CUSTOMER'].includes(entryMode) || !!((cust||{}).cif);
   const unit = healthCurUnit(app);
   const curUnitId = unit ? unit.insuredUnitId : null;
   const units = BANCA.healthUnitsOf(app);
   // Nhóm 1 — CHUNG (định danh bên mua, consent, eKYC, biên bản tư vấn).
   const commonDocs = [
     {code:'BUYER_ID', name:'Định danh bên mua (CCCD/Hộ chiếu)', done: bankKyc, note: bankKyc?'Bank KYC accepted (CIF)':'Cần đối chiếu'},
     {code:'CONSENT', name:'Consent xử lý dữ liệu cá nhân & sức khỏe', done: true, note:'Đã ghi nhận khi tạo yêu cầu'},
     {code:'ADVISORY_MINUTES', name:'Biên bản tư vấn', done: true, note:'Bản ghi tư vấn gói sức khỏe'}
   ];
   const commonRows = commonDocs.map(function(d){return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);">
     <div style="font-size:12.5px;">${d.name}<div style="font-size:11px;color:var(--ink-300);">${d.note}</div></div>
     ${d.done?'<span class="badge badge-ready">Đã có</span>':'<span class="badge badge-blocked">Còn thiếu</span>'}</div>`;}).join('');
   // Nhóm 2 — THEO NGƯỜI (khai sinh trẻ, hồ sơ y tế phát sinh từ khai báo).
   const unitDocRows = units.filter(function(u){return u.active!==false;}).map(function(u){
     const ra=u.riskAnswers||{};
     const needsMedical = !!(ra.preExistingCondition || ra.hospitalizedLast12Months || ra.congenitalCondition || ra.birthComplication);
     const items=[];
     if(u.isChild) items.push({code:'BIRTH_CERT', name:'Giấy khai sinh', required:true});
     if(needsMedical) items.push({code:'MEDICAL_RECORD', name:'Hồ sơ y tế (theo khai báo)', required:true});
     if(!items.length) items.push({code:'NONE', name:'Không yêu cầu tài liệu bổ sung', required:false});
     const isCur = u.insuredUnitId===curUnitId;
     const itemRows = items.map(function(it){
       const st = it.code==='NONE' ? 'na' : ((u.docs&&u.docs[it.code]==='UPLOADED')?'up':'missing');
       return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed var(--line);">
         <div style="font-size:12.5px;">${it.name}</div>
         <div>${st==='up'?'<span class="badge badge-ready">Đã tải lên</span>':st==='na'?'<span style="font-size:11.5px;color:var(--ink-300);">—</span>':`<span class="badge badge-blocked">Còn thiếu</span>${!readOnly?` <button class="btn btn-primary btn-sm" onclick="healthUnitDoc('${app.id}','${u.insuredUnitId}','${it.code}')">Tải lên</button>`:''}`}</div>
       </div>`;
     }).join('');
     return `<div class="card" style="padding:13px;margin-bottom:8px;${isCur?'border:1.5px solid var(--brand-600);':''}"><b style="font-size:12.5px;">${u.name||'—'} <span class="chip" style="font-size:9px;">${u.insuredUnitId}</span>${u.isChild?' · trẻ em':''}</b>${itemRows}</div>`;
   }).join('');
   const main = `<div class="alert2 info" style="margin-bottom:12px;">Tài liệu Bảo hiểm sức khỏe (documentMode COMMON_AND_PER_MEMBER) — không dùng checklist xe. OCR dùng chung layout tài liệu.</div>
    <div class="section-title" style="margin-top:0;"><h2>Nhóm 1 — Tài liệu chung</h2><span class="subtitle">Bên mua · consent · eKYC · biên bản tư vấn</span></div>
    <div class="card" style="padding:14px 16px;margin-bottom:12px;">${commonRows}</div>
    <div class="section-title"><h2>Nhóm 2 — Tài liệu theo người được bảo hiểm</h2><span class="subtitle">Sinh từ tuổi/quan hệ/khai báo từng thành viên</span></div>
    ${unitDocRows}`;
   stepBody = healthWithNav(app, curUnitId, 'DOCUMENTS', main);
  } else if(app.productId==='pa'){
   const bankKyc = ['BANK_CUSTOMER','INSURANCE_CUSTOMER'].includes(entryMode) || !!((cust||{}).cif);
   const stpOk = app.stpDecision && app.stpDecision.paymentAllowed!==false;
   stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Giấy tờ Bảo hiểm tai nạn cá nhân — không dùng checklist xe.</div>
    <div class="card" style="padding:16px;">
     <div class="label" style="margin-bottom:10px;">Định danh khách hàng</div>
     ${bankKyc?`<div class="alert2 info">Đã xác minh từ Janus Bank. Không yêu cầu upload CCCD/CMND cho yêu cầu này.</div>`:`<div class="alert2 warn">Khách hàng mới cần đối chiếu giấy tờ định danh trước khi nộp.</div>`}
     ${stpOk?`<div class="alert2 info">Không yêu cầu tài liệu bổ sung sau STP.</div>`:`<div style="font-size:12.5px;color:var(--ink-500);">Nếu STP yêu cầu bổ sung, tài liệu sẽ hiển thị tại đây theo decision result.</div>`}
    </div>`;
  } else {
  // Ma trận tài liệu ●◐↻○ (doc 2026-07-20) — phân biệt bắt buộc / có điều kiện / kế thừa / không cần
  const ovA = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{};
  const mgDoc = ovA.mortgage||app.mortgage||{mortgaged:false};
  const uploaded = [...new Set([...(app.docsUploaded||[]),...(ovA.__docsUploaded||[])])];
  const ctx = {source:app.source, vehicleAgeYears:(app.quote&&app.quote.inputsSnapshot&&app.quote.inputsSnapshot.vehicleAgeYears)||(app.vehicle? 2026-(app.vehicle.year||2024):0), idv:(app.vehicle&&app.vehicle.value)||0, mortgage:mgDoc};
  const req = BANCA.docRequirements(ctx);
  const cellOf = r => r.status==='REQUIRED'? ['●','var(--red-600)','#fdecec','Bắt buộc']
   : r.status==='INHERITED'? ['↻','#2563eb','#eaf1fe','Kế thừa kỳ trước']
   : r.active? ['◐','var(--amber-600)','#fdf3e3','Bắt buộc (điều kiện đã kích hoạt)']
   : ['○','var(--ink-300)','var(--paper)','Không cần cho yêu cầu này'];
  const needDocs = BANCA.DOC_CATALOG.filter(d=>{const rr=req[d.code];return rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active);});
  const otherDocs = BANCA.DOC_CATALOG.filter(d=>!needDocs.includes(d));
  const fileOf = {REG:'dang-ky-xe.pdf',INSPECT:'dang-kiem.pdf',PHOTOS:'anh-xe.zip',ID:'cccd.pdf',DRIVER_LICENSE:'gplx.pdf',VALUE_PROOF:'hoa-don-vat.pdf',AUTHORIZATION:'uy-quyen.pdf',BENEFICIARY:'xac-nhan-nth.pdf',SURVEY:'bien-ban-giam-dinh.pdf'};
  const docRow = d => {
   const rr=req[d.code]; const [ic,fg,bg,tip]=cellOf(rr);
   const up=uploaded.includes(d.code);
   const need = rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active);
   return `<tr>
    <td><span title="${tip}" style="display:inline-flex;width:24px;height:24px;border-radius:7px;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:${bg};color:${fg};">${ic}</span></td>
    <td style="font-size:13px;">${d.name}<div style="font-size:11px;color:var(--ink-300);">${d.sub}${rr.note?' · '+rr.note:''}</div></td>
    <td>${up?'<span class="badge badge-ready">Đã tải lên</span>': need?'<span class="badge badge-blocked">Còn thiếu — chặn nộp</span>': rr.status==='INHERITED'?'<span class="badge badge-conditional">Dùng bản kỳ trước</span>':'<span style="color:var(--ink-300);font-size:11.5px;">—</span>'}</td>
    <td style="font-size:12px;color:var(--ink-500);">${up?fileOf[d.code]:'—'}</td>
    <td>${readOnly?'':up?'<button class="btn btn-secondary btn-sm">Xem</button> <button class="btn btn-secondary btn-sm">Thay thế</button>': (need||rr.status==='CONDITIONAL')?`<button class="btn ${need?'btn-primary':'btn-secondary'} btn-sm" onclick="uploadDoc('${d.code}')">Tải lên</button>`:''}</td>
   </tr>`;
  };
  // Unified Document Item — OCR là capability; đọc chung store với bước Đối tượng bảo hiểm
  const ocrMap = {REG:['enabled','VEHICLE_REGISTRATION'], INSPECT:['optional',null], VALUE_PROOF:['optional',null], ID:['enabled','NATIONAL_ID']};
  const toDef = d => { const rr=req[d.code]; const need=rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active); const om=ocrMap[d.code]||['none',null]; return {code:d.code, name:d.name, sub:(d.sub||'')+(rr.note?' · '+rr.note:''), ocr:om[0], required:need, docType:om[1], uploaded:uploaded.includes(d.code)}; };
  const storeAll = BANCA.docAll(app.id);
  const isUploaded = code => !!(storeAll[code] && (storeAll[code].dataUrl||storeAll[code].fileName));
  const isOcr = code => !!(storeAll[code] && storeAll[code].ocrStatus);   // đã bóc tách OCR (CCCD, đăng ký xe)
  const requiredDone = needDocs.filter(d=>isUploaded(d.code)).length;
  const blocking = needDocs.filter(d=>!isUploaded(d.code));
  // Section "Tài liệu được OCR" — chỉ đọc, không cho thay thế
  const ocrDocs = BANCA.DOC_CATALOG.filter(d=>isOcr(d.code));
  const ocrSection = ocrDocs.length? `<div class="section-title" style="margin-top:0;"><h2>Tài liệu được OCR</h2><span class="subtitle">Bóc tách ở bước Khách hàng / Đối tượng bảo hiểm — chỉ xem, không thay thế tại đây</span></div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:8px;">${ocrDocs.map(d=>BANCA.docItemHtml(app.id, Object.assign(toDef(d),{locked:true}))).join('')}</div>` : '';
  const legendInner = (done,blk)=>`<div>Tài liệu bắt buộc: <b style="color:${blk.length?'var(--red-600)':'var(--teal-600)'};">${done}/${needDocs.length}</b>${blk.length?' · còn thiếu: '+blk.map(d=>d.name).join(', '):' · đã đủ'}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;"><span><b style="color:var(--red-600);">●</b> Bắt buộc</span><span><b style="color:var(--amber-600);">◐</b> Có điều kiện</span><span><b style="color:var(--ink-300);">○</b> Không cần</span></div>`;
  const legendNote = `<div id="doc-legend" class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ink-500);">${legendInner(requiredDone, blocking)}</div>`;
  // FIX: bước Tài liệu trước đây thiếu __docRefresh → upload xong bộ đếm "x/y" và cờ chặn nộp không cập nhật
  // (nhìn như "tải lên không hoạt động"). Định nghĩa lại để refresh legend theo store thật sau mỗi upload.
  window.__docRefresh = function(){
    const fresh = BANCA.docAll(app.id);   // đọc store tươi, KHÔNG dùng snapshot cũ
    const up = code => !!(fresh[code] && (fresh[code].dataUrl||fresh[code].fileName));
    const done = needDocs.filter(d=>up(d.code)).length;
    const blk  = needDocs.filter(d=>!up(d.code));
    const el = document.getElementById('doc-legend');
    if(el) el.innerHTML = legendInner(done, blk);
  };
  // Gửi khách tự tải lên / chụp tài liệu còn thiếu (demo)
  window.docSendToCustomer = function(){
    const blk = needDocs.filter(d=>!isUploaded(d.code));
    const custNm = (cust&&cust.name)||'khách hàng';
    const custPh = (cust&&cust.phone)||'';
    const token = 'UPL-'+Math.random().toString(36).slice(2,8).toUpperCase();
    const link = location.origin + r + 'modules/application-workspace/customer-upload.html?token=' + token;
    const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent(link);
    const root = document.getElementById('start-sale-root')||document.body;
    const d = document.createElement('div'); d.className='modal-overlay2 open';
    d.onclick=function(ev){ if(ev.target===d) d.remove(); };
    const list = (blk.length?blk:needDocs).map(x=>`<li style="margin:2px 0;">${x.name}</li>`).join('');
    d.innerHTML = `<div class="modal2" style="max-width:520px;" onclick="event.stopPropagation()">
      <div class="modal2-head"><b>📤 Gửi khách tự tải / chụp tài liệu</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div>
      <div class="modal2-body">
        <div style="font-size:12.5px;color:var(--ink-500);margin-bottom:10px;">Gửi liên kết an toàn cho <b>${custNm}</b>${custPh?` (${custPh})`:''} để khách tự chụp/tải lên các tài liệu còn thiếu. File khách nộp sẽ tự đồng bộ về yêu cầu này.</div>
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
          <img src="${qr}" alt="QR" style="width:120px;height:120px;border:1px solid var(--line);border-radius:8px;background:#fff;">
          <div style="flex:1;min-width:200px;">
            <div style="font-size:11.5px;color:var(--ink-500);margin-bottom:3px;">Liên kết cho khách</div>
            <div style="display:flex;gap:6px;">
              <input id="cust-upl-link" value="${link}" readonly style="flex:1;padding:8px;border:1px solid var(--line);border-radius:7px;font-size:12px;">
              <button class="btn btn-secondary btn-sm" onclick="var i=document.getElementById('cust-upl-link');i.select();document.execCommand('copy');this.textContent='Đã copy';">Copy</button>
            </div>
            <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">Cần khách nộp:</div>
            <ul style="margin:4px 0 0;padding-left:18px;font-size:12px;color:var(--ink-700);">${list}</ul>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="this.closest('.modal2-body').querySelector('#send-note').textContent='✓ Đã gửi qua Zalo cho khách (demo). Chờ khách tải lên.';">💬 Gửi Zalo</button>
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal2-body').querySelector('#send-note').textContent='✓ Đã gửi SMS kèm liên kết (demo).';">✉️ Gửi SMS</button>
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal2-body').querySelector('#send-note').textContent='✓ Đã gửi email kèm liên kết (demo).';">📧 Gửi Email</button>
        </div>
        <div id="send-note" style="font-size:12px;color:var(--teal-600);margin-top:10px;"></div>
      </div></div>`;
    root.appendChild(d);
  };
  const reqRender = needDocs.filter(d=>!isOcr(d.code));   // OCR docs hiển thị ở section riêng
  const otherRender = otherDocs.filter(d=>!isUploaded(d.code) && !isOcr(d.code));
  stepBody = legendNote + ocrSection
   + `<div class="section-title" ${ocrDocs.length?'':'style="margin-top:0;"'} style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;"><div><h2>Tài liệu bắt buộc cho yêu cầu này</h2><span class="subtitle">Tài liệu đã tải hiển thị nút Xem / Thay thế; dòng còn thiếu ưu tiên xử lý trước khi nộp.</span></div>${readOnly?'':`<button class="btn btn-secondary btn-sm" onclick="docSendToCustomer()" style="white-space:nowrap;">📤 Gửi khách tự tải</button>`}</div>
      <div class="card" style="padding:0;overflow:hidden;">${reqRender.map(d=>BANCA.docItemHtml(app.id, toDef(d))).join('')||'<div class="empty-state" style="padding:20px;">Không có tài liệu bắt buộc.</div>'}</div>
      ${otherRender.length?`<div class="section-title"><h2>Tài liệu khác</h2><span class="subtitle">Không bắt buộc / kế thừa / bổ sung nếu cần</span></div>
      <div class="card" style="padding:0;overflow:hidden;">${otherRender.map(d=>BANCA.docItemHtml(app.id, toDef(d))).join('')}</div>`:''}
      <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">Chấp nhận PDF/JPG/PNG ≤ 10MB. OCR là capability của từng tài liệu; trạng thái upload/OCR/duyệt/xác minh tách riêng.${mgDoc.mortgaged?' <b style="color:var(--amber-600);">Xe thế chấp — bên thụ hưởng là bắt buộc.</b>':''}</div>`;
  }
 } else if(cur.id==='REVIEW_AND_SUBMIT'){
  // Guard nộp: quote validity + ma trận tài liệu (rule engine) + NTH khi thế chấp + quyền
  const q=app.quote;
  const effQStatus = q? BANCA.quoteStatus(q,null) : null;
  const ovR = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{};
  const mgR = ovR.mortgage||app.mortgage||{mortgaged:false};
  const uploadedR = [...new Set([...(app.docsUploaded||[]),...(ovR.__docsUploaded||[])])];
  const ctxR = {source:app.source, vehicleAgeYears:(q&&q.inputsSnapshot&&q.inputsSnapshot.vehicleAgeYears)||(app.vehicle? 2026-(app.vehicle.year||2024):0), idv:(app.vehicle&&app.vehicle.value)||0, mortgage:mgR};
  const missingDocs = BANCA.missingRequiredDocs(ctxR, uploadedR);
  // P1: blocker có CTA sửa trực tiếp — mỗi blocker trỏ về đúng bước cần bổ sung.
  const stepLink=(sid)=>`?id=${app.id}&step=${sid}`;
  // Registry-driven: blocker theo journey (riskObjectType / stages), không hard-code Motor.
  const jrn = BANCA.journeyFor(app.productId);
  const jStages = BANCA.journeyAllStages(app.productId).map(s=>s.id);
  const isVehicle = jrn.riskObjectType==='VEHICLE';
  const blockers=[];
  if(!cust) blockers.push({t:'Thông tin khách hàng chưa đủ', fix:'Bổ sung khách hàng', step:'CUSTOMER_INFO'});
  if(isVehicle && !app.vehicle) blockers.push({t:'Chưa nhập thông tin xe', fix:'Nhập thông tin xe', step:'RISK_OBJECT'});
  if(jStages.indexOf('INSURED_PARTY')>=0 && !isVehicle && app.productId==='health' && healthMembersOf(app).some(function(m){return !m.name || m.age==null;})) blockers.push({t:'Chưa nhập đủ người được bảo hiểm sức khỏe', fix:'Nhập người được BH', step:'INSURED_PARTY'});
  if(jStages.indexOf('INSURED_PARTY')>=0 && !isVehicle && app.productId!=='health' && !app.insuredAge) blockers.push({t:'Chưa nhập người được bảo hiểm', fix:'Nhập người được BH', step:'INSURED_PARTY'});
  if(!q) blockers.push({t:'Chưa có báo giá', fix:'Tạo báo giá', step:'PACKAGE_AND_QUOTE'});
  else if(effQStatus==='EXPIRED') blockers.push({t:'Báo giá đã hết hạn — phải tính phí lại', fix:'Tính phí lại', step:'PACKAGE_AND_QUOTE'});
  else if(effQStatus==='STALE') blockers.push({t:'Thông tin thay đổi — phải tính phí lại', fix:'Tính phí lại', step:'PACKAGE_AND_QUOTE'});
  if(isVehicle && jStages.indexOf('DOCUMENTS')>=0 && missingDocs.length) blockers.push({t:'Thiếu tài liệu bắt buộc: '+missingDocs.map(d=>d.name).join(', '), fix:'Bổ sung tài liệu', step:'DOCUMENTS'});
  if(isVehicle && mgR.mortgaged && !(mgR.bank&&mgR.creditContract)) blockers.push({t:'Xe thế chấp — thiếu thông tin bên thụ hưởng (ngân hàng + số HĐ tín dụng)', fix:'Bổ sung bên thụ hưởng', step:'RISK_OBJECT'});
  if(app.productId==='health'){
    // §submit — ALL_ACTIVE_MEMBERS_READY: bỏ blocker generic, dùng guard per-member.
    blockers.length = 0;
    if(!cust && !app.customerName) blockers.push({t:'Thông tin khách hàng chưa đủ', fix:'Bổ sung khách hàng', step:'CUSTOMER_INFO'});
    const rdH = BANCA.healthSubmitReadiness(app);
    rdH.blockers.forEach(function(b){
      const miss=(b.missing||[])[0]||(b.code==='ineligible'?'không đủ điều kiện':'thông tin');
      blockers.push({t:(b.name?b.name+': ':'')+miss, fix:'Bổ sung "'+miss+'" cho '+(b.name||'thành viên'), step:b.step, unit:b.unitId});
    });
  } else if(jrn.underwritingMode==='STP' && BANCA.validatePA){
    const pv = BANCA.validatePA({age:app.insuredAge, occupationClass:app.occupationClass, sumInsured:app.sumInsured, riskAnswers:app.riskAnswers, buyerIsInsured:app.buyerIsInsured});
    pv.errors.forEach(function(e){ blockers.push({t:e.msg, fix:'Sửa thông tin', step:'INSURED_PARTY'}); });
  }
  if(!caps.includes('can_submit')) blockers.push({t:'Bạn không có quyền nộp yêu cầu bảo hiểm sản phẩm này', fix:'', step:''});
  const missing=blockers.map(b=>b.t);
  const okData = missing.length===0;
  const blockerBanner = blockers.length
   ? `<div class="card" style="padding:16px;margin-bottom:12px;border:1.5px solid var(--red-600);background:#fdecec;">
       <div style="font-size:15px;font-weight:800;color:var(--red-600);">🚫 Chưa thể gửi yêu cầu bảo hiểm</div>
       <div style="font-size:12.5px;color:#8a2a2a;margin-top:2px;">Xử lý các mục dưới đây rồi quay lại bước này để gửi:</div>
       <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px;">
        ${blockers.map(b=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #f2c9c9;border-radius:8px;padding:9px 12px;"><div style="font-size:12.5px;color:var(--ink-700);">${b.t}</div>${b.fix?`<a class="btn btn-primary btn-sm" href="${stepLink(b.step)}${b.unit?'&unit='+b.unit:''}">${b.fix} &rarr;</a>`:'<span style="font-size:11px;color:var(--ink-300);">Cần cấp quyền</span>'}</div>`).join('')}
       </div></div>`
   : `<div class="card" style="padding:12px 14px;margin-bottom:12px;border:1.5px solid var(--teal-600);background:#eefaf7;font-size:13px;color:var(--teal-600);font-weight:600;">✓ Yêu cầu đủ điều kiện gửi — chỉ cần tick 2 xác nhận bên dưới.</div>`;
  // Review summary REGISTRY-DRIVEN theo journey.reviewSections — không leak field sản phẩm khác.
  const secRow=(label,val)=>`<tr><td style="width:220px;color:var(--ink-500);font-size:12.5px;">${label}</td><td>${val}</td></tr>`;
  const premVal = q?`${BANCA.vnd(q.adjustedPremium||q.premium)}/năm${q.basePremium?` (base ${BANCA.vnd(q.basePremium)})`:''}${q.quoteType?' · '+q.quoteType:''}`:'—';
  const secBuilders = {
    customer:      ()=>secRow('Khách hàng', cust?cust.name+' · '+(cust.cif||'prospect'):(app.customerName||'—')),
    insuredPerson: ()=>secRow('Người được bảo hiểm', app.productId==='health'
      ? healthMembersOf(app).map(function(m){return (m.name||'—')+' · '+(m.relationship||'—')+' · '+(m.age!=null?m.age+' tuổi':'chưa có DOB');}).join('<br>')
      : (app.insuredName||cust&&cust.name||'—')+(app.insuredAge?' · '+app.insuredAge+' tuổi':'')+(app.occupationClass&&BANCA.paOccupationClasses[app.occupationClass]?' · '+BANCA.paOccupationClasses[app.occupationClass].label.split('—')[0].trim():'')+(app.buyerIsInsured===false?' · cần consent riêng':'')),
    vehicle:       ()=>secRow('Xe', app.vehicle?`${app.vehicle.brand} ${app.vehicle.model} ${app.vehicle.year||''} · ${app.vehicle.plate||'chưa có biển'} · ${BANCA.vnd(app.vehicle.value)}`:'—'),
    package:       ()=>secRow('Sản phẩm / Gói', app.productId==='health'
      ? app.productName+(app.package?' · '+healthPkgName(app.package):'')+` · Hiệu lực ${app.effectiveDate||dateOnly(new Date().toISOString())} · Thời hạn ${(healthPkg(app.package).termMonths||12)} tháng · Loại trừ: ${(healthPkg(app.package).exclusions||[]).slice(0,2).join('; ')}`
      : app.productName+(app.package?' · '+paPkgName(app.package):'')+(app.productId==='pa'?` · Hiệu lực ${app.effectiveDate||dateOnly(new Date().toISOString())} · Thời hạn ${(paPkg(app.package).termMonths||12)} tháng · Loại trừ: ${(paPkg(app.package).exclusions||[]).slice(0,2).join('; ')}`:'')),
    riskDeclaration:()=>secRow('Khai báo rủi ro', app.riskAnswers&&Object.keys(app.riskAnswers).length?Object.keys(app.riskAnswers).length+' câu đã trả lời':'—'),
    documents:     ()=>secRow('Tài liệu', (app.docsUploaded||[]).length?(app.docsUploaded||[]).length+' tài liệu đã tải':'—'),
    quote:         ()=>secRow('Phí bảo hiểm', premVal)
  };
  const reviewRows = (jrn.reviewSections||['customer','package','quote']).map(function(k){ return secBuilders[k]?secBuilders[k]():''; }).join('');
  // §6 — Member Review Matrix (chỉ Health): thành viên | gói | phí | sức khỏe | tài liệu | thụ hưởng | xác nhận.
  const healthMatrix = app.productId==='health' ? (function(){
    const units = BANCA.healthUnitsOf(app).filter(function(u){return u.active!==false;});
    const cell=(ok,label,unitId,step)=>ok?`<span style="color:var(--teal-600);">✓</span>`:`<a href="?id=${app.id}&step=${step}&unit=${unitId}" style="color:var(--red-600);text-decoration:none;">✕ ${label} &rarr;</a>`;
    const rows = units.map(function(u){
      const s = BANCA.healthUnitStatus(app, u);
      const consentKey = BANCA.healthUnitConsentKey(u);
      const ra=u.riskAnswers||{};
      const qsList = BANCA.healthUnitQuestions(u);
      const healthOk = s.code!=='ineligible' && qsList.filter(function(q){return q.type==='boolean'&&!q.branchOn;}).every(function(q){return ra[q.code]!=null;}) && ra[consentKey]===true;
      const needsMedical = !!(ra.preExistingCondition||ra.hospitalizedLast12Months||ra.congenitalCondition||ra.birthComplication);
      const docOk = (!needsMedical || (u.docs&&u.docs.MEDICAL_RECORD==='UPLOADED')) && (!u.isChild || (u.docs&&u.docs.BIRTH_CERT==='UPLOADED'));
      const hasDeath = BANCA.healthPackageHasDeathBenefit(u.package);
      const beneOk = !hasDeath || ((u.beneficiaries||[]).reduce(function(t,b){return t+(Number(b.share)||0);},0)===100);
      const rt = BANCA.rateHealthUnit(u);
      return `<tr>
        <td><b>${u.name||'—'}</b><div style="font-size:11px;color:var(--ink-300);">${u.relationship||'—'}${u.age!=null?' · '+u.age+'t':''}${s.code==='ineligible'?' · <span style="color:var(--red-600);">không đủ điều kiện</span>':''}</div></td>
        <td>${u.package?healthPkgName(u.package):cell(false,'chọn gói',u.insuredUnitId,'PACKAGE_AND_QUOTE')}</td>
        <td>${rt?BANCA.vnd(rt.totalPremium):'—'}</td>
        <td>${cell(healthOk,'khai báo',u.insuredUnitId,'RISK_DECLARATION')}</td>
        <td>${cell(docOk,'tài liệu',u.insuredUnitId,'DOCUMENTS')}</td>
        <td>${hasDeath?cell(beneOk,'thụ hưởng',u.insuredUnitId,'PACKAGE_AND_QUOTE'):'<span style="color:var(--ink-300);">N/A</span>'}</td>
        <td><span style="color:var(--ink-300);font-size:11.5px;">Sau khi nộp (OTP)</span></td>
      </tr>`;
    }).join('');
    return `<div class="card" style="padding:16px;margin-top:12px;">
      <div class="label" style="margin-bottom:8px;">Ma trận rà soát thành viên (Member Review Matrix)</div>
      <table class="dtable"><thead><tr><th>Thành viên</th><th>Gói</th><th>Phí</th><th>Sức khỏe</th><th>Tài liệu</th><th>Thụ hưởng</th><th>Xác nhận</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Bấm ô lỗi để mở đúng thành viên + đúng mục cần bổ sung. Xác nhận/OTP thực hiện per-member sau khi nộp.</div>
     </div>`;
  })() : '';
  stepBody = blockerBanner + `<div class="card" style="padding:16px;">
   <div class="label">Tóm tắt yêu cầu <span class="chip" style="font-size:9px;">${jrn.reviewLayout||'review'}</span></div>
   <table class="dtable"><tbody>${reviewRows}</tbody></table>
  </div>` + healthMatrix + `
  <div class="card" style="padding:16px;margin-top:12px;">
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;"><input type="checkbox" id="c1" ${readOnly?'disabled':''} onchange="refreshSubmitBtn()"> Khách hàng xác nhận thông tin kê khai là đúng và đầy đủ.</label>
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin-top:8px;"><input type="checkbox" id="c2" ${readOnly?'disabled':''} onchange="refreshSubmitBtn()"> Tôi (nhân viên tư vấn) xác nhận đã tư vấn đầy đủ quyền lợi, điều khoản loại trừ.</label>
   ${!readOnly?`<button class="btn btn-primary" id="submit-btn" style="margin-top:14px;opacity:.5;" disabled data-okdata="${okData?'1':'0'}" title="${missing.length?('Chưa thể nộp: '+missing.join(' · ')):'Cần tick đủ 2 xác nhận'}" onclick="submitApp('${app.id}')">Nộp yêu cầu bảo hiểm</button>`:''}
  </div>`;
 }

 const hdr = `<div class="card" id="ws-summary" style="padding:14px 18px;margin-bottom:14px;position:sticky;top:0;z-index:20;box-shadow:0 2px 10px rgba(10,25,60,.06);">
  <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;">
   <div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span style="font-size:22px;font-weight:700;color:var(--ink-900);line-height:1.15;">${app.id}</span><span class="badge badge-draft">Chưa nộp</span>${warnBadges(app.warnings)}${app.sourceAdviceId?`<a href="${r}modules/advisory-workspace/index.html?id=${app.sourceAdviceId}&step=result" class="chip" style="text-decoration:none;background:var(--purple-100);color:var(--purple-600);">💡 Từ tư vấn ${app.sourceAdviceId}</a>`:''}</div>
    <div style="font-size:13.5px;color:var(--ink-500);margin-top:3px;">${cust?cust.name:(app.customerName||'—')} · ${app.productName}${app.package?' · '+app.package:''} · Nguồn ${app.source==='ADVICE'?'Tư vấn nhanh':BANCA.label('source',app.source)}</div>
   </div>
   <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-left:auto;">
    <div style="text-align:right;"><div style="font-size:12px;color:var(--ink-500);font-weight:600;text-transform:uppercase;letter-spacing:.03em;">Phí tạm tính</div><b style="font-size:22px;color:var(--brand-600);display:block;margin-top:1px;">${app.quote?BANCA.vnd(app.quote.adjustedPremium||app.quote.premium):'—'}</b></div>
    <div style="display:flex;gap:8px;align-items:center;">
     <span id="save-state" style="font-size:12px;color:var(--teal-600);white-space:nowrap;">✓ Đã lưu ${app.updatedAt}</span>
     ${!readOnly?`<button class="btn btn-secondary btn-sm" onclick="autosave(true)">Lưu</button>`:'<span class="chip">Chỉ xem (manager)</span>'}
    </div>
   </div>
  </div>
 </div>`;

 const adviceRefBanner = app.sourceAdviceId ? `<div class="card" style="padding:14px 16px;border-left:4px solid var(--purple-600);margin-bottom:14px;background:var(--purple-100);border-color:transparent;">
   <div style="font-weight:700;color:var(--purple-600);">💡 Yêu cầu tạo từ Tư vấn nhanh ${app.sourceAdviceId}</div>
   <div style="font-size:13px;color:var(--ink-700);margin-top:4px;line-height:1.7;">
    Đã prefill <b>${app.productName}${app.package?' · '+app.package:''}</b>${app.adviceNeed?` · nhu cầu <b>${BANCA.needLabel(app.adviceNeed)}</b>`:''}${app.adviceBudget?` · ngân sách <b>${BANCA.budgetLabel(app.adviceBudget)}</b>`:''}${app.adviceSessionId?` · session <b>${app.adviceSessionId}</b>`:''} (tham chiếu).<br>
    ${app.adviceNote?`<span style="color:var(--ink-500);">Advisor note: <i>${app.adviceNote}</i></span><br>`:''}
    ⚠️ Không dùng phí minh họa làm phí chính thức — cần xác minh tuổi/nghề/giá trị tài sản và <b>tính lại phí</b> ở bước Gói &amp; phí. Không lặp lại bước khảo sát nhu cầu.
    <a href="${r}modules/advisory-workspace/index.html?id=${app.sourceAdviceId}&step=result" style="color:var(--purple-600);margin-left:4px;">Xem bản tư vấn →</a>
   </div>
  </div>` : '';
 const renewalBanner = app.renewalPolicyRef ? `<div class="card" style="padding:14px 16px;border-left:4px solid var(--amber-600);margin-bottom:14px;background:#fdf3e3;border-color:transparent;">
   <div style="font-weight:700;color:var(--amber-600);">♻ Tái tục từ hợp đồng ${app.renewalPolicyRef}</div>
   <div style="font-size:12.5px;color:var(--ink-700);margin-top:4px;line-height:1.6;">
    Đã prefill: <b>${app.productName}${app.package?' · '+app.package:''}</b>${app.vehicle?' · xe '+(app.vehicle.brand||'')+' '+(app.vehicle.model||''):''}${app.renewPrevPremium?' · phí kỳ trước <b>'+BANCA.vnd(app.renewPrevPremium)+'</b>':''}.<br>
    Chỉ cần <b>xác nhận phần thay đổi</b> rồi <b>tính lại phí (re-rate)</b> — không nhập lại toàn bộ thông tin.
   </div>
  </div>` : '';
 shell('Yêu cầu bảo hiểm chưa nộp','Lập yêu cầu yêu cầu bảo hiểm', hdr + adviceRefBanner + renewalBanner + stepper + stepBody + `
  <div class="ux-bottom-actions">
   ${(()=>{ // P0-7: điều hướng bỏ qua bước auto
    const visible = steps.filter(s=>!AUTO_STAGES.includes(s.id));
    const vIdx = visible.findIndex(s=>s.id===cur.id);
    const prev = vIdx>0? visible[vIdx-1]:null;
    const next = vIdx<visible.length-1? visible[vIdx+1]:null;
    return `${prev?`<a class="btn btn-secondary" href="?id=${app.id}&step=${prev.id}${isNew?'&new=1':''}">&larr; ${prev.label}</a>`:'<span></span>'}
     ${next?`<a class="btn btn-primary" href="?id=${app.id}&step=${next.id}${isNew?'&new=1':''}">${next.label} &rarr;</a>`:''}`;
   })()}
  </div>`, {startSale:false});

 window.autosave = function(manual){
  const el=document.getElementById('save-state');
  if(!el) return;
  el.textContent='Đang lưu…'; el.style.color='var(--amber-600)';
  setTimeout(()=>{el.textContent='✓ Đã lưu vừa xong'; el.style.color='var(--teal-600)';}, 500);
 };
 window.refreshSubmitBtn = function(){
  const b=document.getElementById('submit-btn'); if(!b) return;
  const c1=document.getElementById('c1'), c2=document.getElementById('c2');
  const ok = b.dataset.okdata==='1' && c1.checked && c2.checked;
  b.disabled=!ok; b.style.opacity=ok?'1':'.5';
  if(ok) b.title='Sẵn sàng nộp yêu cầu bảo hiểm';
 };
 // Dirty state (chốt 16:35): vừa chỉnh add-on/khấu trừ/gói → quote cũ MỜ + GẠCH tổng cũ + dòng nhắc + nút Tính phí nổi bật. KHÔNG reload.
 window.markStale = function(){
  window.__staleFlag = true;
  const wrap=document.getElementById('q-table-wrap');
  if(wrap){ wrap.style.opacity='.45'; }
  const tot=document.getElementById('q-total');
  if(tot){ tot.style.textDecoration='line-through'; tot.style.color='var(--ink-300)'; }
  const note=document.getElementById('q-dirty-note');
  if(note) note.style.display='block';
  const badge=document.getElementById('q-badge');
  if(badge) badge.innerHTML=BANCA.quoteStatusBadge('STALE');
  const rb=document.getElementById('rate-btn');
  if(rb){ rb.textContent='Tính phí'; rb.style.background='var(--red-600)'; rb.style.borderColor='var(--red-600)'; rb.style.boxShadow='0 0 0 3px rgba(220,38,38,.2)'; }
  window.autosave();
 };
 // Đọc state hiện tại từ DOM (add-on checkbox + khấu trừ) — dùng cho rerate
 function currentInputsFromDOM(pkgCode){
  const pk=BANCA.motorPackages[pkgCode];
  const val=(app.vehicle&&app.vehicle.value)||600000000;
  const cbs=[...document.querySelectorAll('.addon-cb')];
  const addOns=cbs.length? cbs.filter(c=>c.checked).map(c=>c.dataset.code) : pk.defaultAddOns.slice();
  const dedEl=document.getElementById('opt-ded');
  const deductible=dedEl? parseInt(dedEl.value) : pk.defaultDeductible;
  const oldSnap=(app.quote&&app.quote.inputsSnapshot)||{};
  return {packageCode:pkgCode,sumInsured:val,termMonths:12,addOns,deductible,ncdPercent:oldSnap.ncdPercent||0,vehicleAgeYears:oldSnap.vehicleAgeYears||2};
 }
 function saveQuote(inputs, note){
  const rt=BANCA.rateMotor(inputs);
  const now='2026-07-20 '+new Date().toTimeString().slice(0,5);
  const oldQ=app.quote;
  const newVer=(oldQ?oldQ.version:0)+1;
  const versions=[{version:newVer,premium:rt.totalPremium,createdAt:now,createdBy:me,status:'CURRENT'},...((oldQ&&oldQ.versions)||[]).map(v=>({...v,status:'SUPERSEDED'}))];
  BANCA.patchApp(app.id,{package:BANCA.motorPackages[inputs.packageCode].name,
   quote:{id:(oldQ&&oldQ.id)||('QT-2026-'+Math.floor(Math.random()*9000+1000)),version:newVer,ratedAt:now,validUntil:'2026-07-23',
    inputsSnapshot:inputs,inputHash:BANCA.inputHashOf(inputs),
    basePremium:rt.basePremium,adjustedPremium:rt.adjustedPremium,adjustments:rt.adjustments,
    tplPremium:rt.tplPremium,odBase:rt.odBase,lines:rt.lines,subtotal:rt.subtotal,ncdPct:rt.ncdPct,ncdAmount:rt.ncdAmount,odAfterNcd:rt.odAfterNcd,vatAmount:rt.vatAmount,odTotal:rt.odTotal,totalPremium:rt.totalPremium,
    versions,premium:rt.totalPremium},
   warnings:(app.warnings||[]).filter(w=>!['QUOTE_NEED_RERATE','QUOTE_EXPIRING'].includes(w))});
  if(note) alert(note);
  location.reload();
 }
 // Quy tắc đổi gói (chốt): add-on RESET về mặc định gói mới + thông báo cho user
 // P0.3/P0.4 — lưu câu trả lời rủi ro + cập nhật báo giá chính thức realtime.
 window.setRiskAnswer = function(id, code, val, kind){
  app.riskAnswers = app.riskAnswers || {};
  app.riskAnswers[code] = (kind==='number') ? (val===''?null:Number(val)) : val;
  BANCA.patchApp(id, {riskAnswers: app.riskAnswers});
  if(app.productId==='pa' && code==='hazardousActivity'){ location.reload(); return; }
  const panel = document.getElementById('firm-quote-panel');
  if(panel && window.firmQuotePanelHtml) panel.innerHTML = window.firmQuotePanelHtml(app);
 };
 // Panel "Báo giá chính thức" — riskAnswers vào rating, hiển thị chênh lệch (structured).
 window.firmQuotePanelHtml = function(a){
  // Dispatch theo underwritingMode của journey: STP (PA) → precheck eligibility; RULE_BASED (motor) → diff phí.
  if(BANCA.journeyFor(a.productId).underwritingMode==='STP'){
    if(a.productId==='health'){
      const v = BANCA.validateHealth({members:healthMembersOf(a), riskAnswers:a.riskAnswers, buyerIsInsured:a.buyerIsInsured});
      if(v.eligible && !v.warnings.length) return '<div class="card" style="padding:12px 14px;border:1.5px solid var(--teal-600);background:#eefaf7;font-size:12.5px;color:var(--teal-600);font-weight:600;">✓ Đạt điều kiện phát hành tự động (STP) cho gói sức khỏe.</div>';
      const items = v.errors.map(e=>'🚫 '+e.msg).concat(v.warnings.map(w=>'⚠ '+w.msg));
      return '<div class="card" style="padding:12px 14px;border:1.5px solid '+(v.eligible?'var(--amber-600)':'var(--red-600)')+';background:'+(v.eligible?'#fdf3e3':'#fdecec')+';"><div style="font-weight:700;font-size:12.5px;">'+(v.eligible?'Cần thẩm định sức khỏe':'Chưa đủ điều kiện')+'</div><ul style="margin:6px 0 0;padding-left:18px;font-size:12px;">'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>';
    }
    const v = BANCA.validatePA({age:a.insuredAge, occupationClass:a.occupationClass, sumInsured:(a.quote&&a.quote.sumInsured), riskAnswers:a.riskAnswers, buyerIsInsured:a.buyerIsInsured});
    if(v.eligible && !v.warnings.length) return '<div class="card" style="padding:12px 14px;border:1.5px solid var(--teal-600);background:#eefaf7;font-size:12.5px;color:var(--teal-600);font-weight:600;">✓ Đạt điều kiện phát hành tự động (straight-through).</div>';
    const items = v.errors.map(e=>'🚫 '+e.msg).concat(v.warnings.map(w=>'⚠ '+w.msg));
    return '<div class="card" style="padding:12px 14px;border:1.5px solid '+(v.eligible?'var(--amber-600)':'var(--red-600)')+';background:'+(v.eligible?'#fdf3e3':'#fdecec')+';"><div style="font-weight:700;font-size:12.5px;">'+(v.eligible?'Cần lưu ý trước khi phát hành':'Chưa đủ điều kiện')+'</div><ul style="margin:6px 0 0;padding-left:18px;font-size:12px;">'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>';
  }
  const q = a.quote;
  if(!q || !q.inputsSnapshot) return '<div class="alert2 info">Chưa có báo giá — hoàn tất bước "Gói & phí dự kiến" trước khi khai báo rủi ro.</div>';
  const s = q.inputsSnapshot;
  const inputs = {packageCode:s.packageCode, sumInsured:s.sumInsured, termMonths:12, addOns:s.addOns||[], deductible:s.deductible, ncdPercent:s.ncdPercent||0, vehicleAgeYears:s.vehicleAgeYears||0, riskAnswers:a.riskAnswers||{}};
  const indicativePrem = q.adjustedPremium || q.premium || 0;
  const indicative = BANCA.makeQuoteSnapshot({quoteType:'INDICATIVE', productId:a.productId, premium:indicativePrem, basePremium:indicativePrem});
  const res = BANCA.computeFirmQuote(a.productId, inputs, indicative);
  const d = res.diff, uw = res.underwriting;
  const riskAdj = (d.adjustments||[]).filter(x=>['CLAIM_HIST','COMMERCIAL','FLOOD_ZONE','BIG_LOSS'].includes(x.code));
  const hasAns = a.riskAnswers && Object.keys(a.riskAnswers).length>0;
  const rows = riskAdj.map(x=>`<tr><td style="padding:3px 14px 3px 0;color:var(--amber-600);">+ ${x.label} (${x.percentage}%)</td><td style="text-align:right;color:var(--amber-600);">+${BANCA.vnd(x.amount)}</td></tr>`).join('');
  const referralNote = uw.flags.referral ? `<div style="margin-top:8px;font-size:12px;color:var(--red-600);font-weight:600;">⚠ Yếu tố rủi ro sẽ kích hoạt THẨM ĐỊNH khi gửi yêu cầu.${uw.flags.requireDoc.length?' Cần bổ sung: '+uw.flags.requireDoc.join(', ')+'.':''}</div>` : '';
  return `<div class="card" style="padding:14px;border:1.5px solid var(--brand-600);">
   <div class="label">Báo giá chính thức (sau khai báo rủi ro) <span class="chip" style="font-size:9px;">FIRM · v${res.quote.quoteVersion}</span></div>
   ${!hasAns?'<div style="font-size:12px;color:var(--ink-300);margin-top:6px;">Chưa có câu trả lời rủi ro — phí chính thức bằng phí dự kiến.</div>':`
   <table style="margin-top:8px;font-size:12.5px;width:100%;max-width:460px;">
    <tr><td style="padding:3px 14px 3px 0;color:var(--ink-500);">Phí dự kiến</td><td style="text-align:right;">${BANCA.vnd(d.indicativePremium)}</td></tr>
    ${rows}
    <tr style="border-top:1px solid var(--line);"><td style="padding:6px 14px 3px 0;font-weight:700;">Phí chính thức</td><td style="text-align:right;font-weight:700;color:var(--brand-600);">${BANCA.vnd(d.firmPremium)}</td></tr>
    ${d.delta?`<tr><td style="padding:3px 14px 3px 0;color:${d.delta>0?'var(--amber-600)':'var(--teal-600)'};">Chênh lệch</td><td style="text-align:right;color:${d.delta>0?'var(--amber-600)':'var(--teal-600)'};">${d.delta>0?'+':''}${BANCA.vnd(d.delta)} (${d.deltaPct>0?'+':''}${d.deltaPct}%)</td></tr>`:''}
   </table>`}
   ${referralNote}
   <div style="font-size:10.5px;color:var(--ink-300);margin-top:8px;">Biểu phí minh họa (DEMO_TARIFF) — không phải phí nghiệp vụ thật.</div>
  </div>`;
 };
 // P0.5 — PA field capture + package pick.
 window.paSetField = function(id, field, val, kind){
  const v = (kind==='number') ? (val===''?null:Number(val)) : val;
  app[field] = v;
  const patch = {}; patch[field] = v;
  const c0=BANCA.customerById(app.customerId)||{};
  const dob = (app.buyerIsInsured!==false) ? c0.dob : app.insuredDob;
  const eff = app.effectiveDate || dateOnly(new Date().toISOString());
  const calcAge = ageOnDate(dob, eff);
  if(calcAge!=null){ app.insuredAge=calcAge; patch.insuredAge=calcAge; }
  // Đổi tuổi/nghề → báo giá cũ cần tính lại.
  if(['insuredDob','effectiveDate','buyerIsInsured','occupationClass'].includes(field) && app.quote) app.quote.quoteStatus='STALE';
  BANCA.patchApp(id, patch);
  if(['insuredDob','effectiveDate','buyerIsInsured','occupationClass'].includes(field)) location.reload();
 };
 window.paPickPackage = function(id, code){
  const pk = BANCA.paPackages[code];
  const c0=BANCA.customerById(app.customerId)||{};
  const calcAge = ageOnDate((app.buyerIsInsured!==false)?c0.dob:app.insuredDob, app.effectiveDate||dateOnly(new Date().toISOString()));
  const snap = BANCA.computeIndicativeQuote('pa', {packageCode:code, sumInsured:pk.sumInsured, age:calcAge||app.insuredAge||30, occupationClass:app.occupationClass||'CLASS_1'});
  app.package = code; app.sumInsured = pk.sumInsured; app.quote = snap;
  BANCA.patchApp(id, {package:code, packageCode:code, sumInsured:pk.sumInsured, insuredAge:calcAge||app.insuredAge||30, quote:snap, premium:snap.premium});
  location.href='?id='+id+'&step=PACKAGE_AND_QUOTE'+(isNew?'&new=1':'');
 };
 window.healthSetField = function(id, field, val, kind){
  const v = (kind==='number') ? (val===''?null:Number(val)) : val;
  app[field] = v;
  const patch = {}; patch[field] = v;
  const members = healthMembersOf(app);
  if(members[0] && members[0].age!=null){ app.insuredAge=members[0].age; patch.insuredAge=members[0].age; }
  if(['effectiveDate','buyerIsInsured'].includes(field) && app.quote) app.quote.quoteStatus='STALE';
  BANCA.patchApp(id, patch);
  if(['effectiveDate','buyerIsInsured'].includes(field)) location.reload();
 };
 window.healthSetMember = function(id, idx, field, val){
  const members = healthMembersOf(app).map(function(m){return {name:m.name||'', dob:m.dob||'', relationship:m.relationship||''};});
  members[idx] = members[idx] || {name:'',dob:'',relationship:''};
  members[idx][field] = val;
  const hydrated = members.map(function(m){return Object.assign({}, m, {age:ageOnDate(m.dob, app.effectiveDate||dateOnly(new Date().toISOString()))});});
  app.insuredMembers = hydrated;
  if(hydrated[0] && hydrated[0].age!=null) app.insuredAge=hydrated[0].age;
  if(app.quote) app.quote.quoteStatus='STALE';
  BANCA.patchApp(id,{insuredMembers:hydrated, insuredAge:app.insuredAge, quote:app.quote});
  if(field==='dob') location.reload();
 };
 window.healthAddMember = function(id){
  const members = healthMembersOf(app).map(function(m){return {name:m.name||'', dob:m.dob||'', relationship:m.relationship||''};});
  members.push({name:'', dob:'', relationship:'Con'});
  BANCA.patchApp(id,{insuredMembers:members});
  location.href='?id='+id+'&step=INSURED_PARTY'+(isNew?'&new=1':'');
 };
 window.healthRemoveMember = function(id, idx){
  const members = healthMembersOf(app).map(function(m){return {name:m.name||'', dob:m.dob||'', relationship:m.relationship||''};});
  members.splice(idx,1);
  BANCA.patchApp(id,{insuredMembers:members});
  location.href='?id='+id+'&step=INSURED_PARTY'+(isNew?'&new=1':'');
 };
 window.healthPickPackage = function(id, code){
  const pk = healthPkg(code);
  const members = healthMembersOf(app);
  const snap = BANCA.computeIndicativeQuote('health', {packageCode:code, members:members.map(function(m){return {name:m.name, age:m.age||30, relationship:m.relationship};})});
  app.package = code; app.quote = snap;
  BANCA.patchApp(id, {package:code, packageCode:code, insuredMembers:members, insuredAge:members[0]&&members[0].age, quote:snap, premium:snap.premium, sumInsured:pk.annualLimit});
  location.href='?id='+id+'&step=PACKAGE_AND_QUOTE'+(isNew?'&new=1':'');
 };
 // ===== Multi-insured — persist InsuredCoverageUnit + recompute family quote =====
 // Chuyển units hydrated → members lưu được (giữ toàn bộ field per-member + insuredUnitId ổn định).
 function _healthPersistMembers(a){
  return BANCA.healthUnitsOf(a).map(function(u){
   return {name:u.name||'', dob:u.dob||'', relationship:u.relationship||'', insuredUnitId:u.insuredUnitId,
     gender:u.gender||null, identityNumber:u.identityNumber||null, occupation:u.occupation||null,
     guardianUnitId:u.guardianUnitId||null, guardianName:u.guardianName||null, guardianRelationship:u.guardianRelationship||null, guardianPhone:u.guardianPhone||null,
     phone:u.phone||null, active:u.active!==false, package:u.package||null,
     riskAnswers:u.riskAnswers||{}, docs:u.docs||{}, beneficiaries:u.beneficiaries||[],
     confirmation:u.confirmation||null, underwriting:u.underwriting||null, certificateNumber:u.certificateNumber||null,
     age: BANCA.healthAgeAt(u.dob, a.effectiveDate||dateOnly(new Date().toISOString()))};
  });
 }
 function _healthCommitMembers(id, members){
  app.insuredMembers = members;
  const fam = BANCA.healthFamilyRating(app);
  const firstActive = members.filter(function(m){return m.active!==false;})[0];
  app.package = (firstActive&&firstActive.package) || app.package || null;
  app.quote = BANCA.makeQuoteSnapshot({quoteType:'INDICATIVE', productId:'health', packageId:app.package,
    premium:fam.total, basePremium:fam.total,
    premiumBreakdown:BANCA.makePremiumBreakdown({basePremium:fam.subtotalPre, discount:fam.familyDiscount, tax:fam.tax, totalPremium:fam.total}),
    ratingInputsSnapshot:{packageCode:app.package, members:members.filter(function(m){return m.active!==false;}).map(function(m){return {name:m.name, age:m.age, relationship:m.relationship, package:m.package};})}});
  app.premium = fam.total;
  if(firstActive && firstActive.age!=null) app.insuredAge = firstActive.age;
  BANCA.patchApp(id, {insuredMembers:members, package:app.package, quote:app.quote, premium:fam.total, insuredAge:app.insuredAge});
 }
 // Áp patch vào 1 unit theo insuredUnitId.
 function _healthMapUnit(id, unitId, fn, reload, keepUnit){
  const members = _healthPersistMembers(app);
  const target = members.find(function(m){return m.insuredUnitId===unitId;});
  if(target) fn(target);
  _healthCommitMembers(id, members);
  if(reload) location.href='?id='+id+'&step='+(qs.get('step')||'PACKAGE_AND_QUOTE')+(keepUnit&&unitId?'&unit='+unitId:'')+(isNew?'&new=1':'');
 }
 window.healthUnitSetField = function(id, unitId, field, val){
  const reload = ['dob','relationship'].includes(field);
  _healthMapUnit(id, unitId, function(m){ m[field]=val; }, reload, true);
 };
 window.healthUnitSetGuardianChoice = function(id, unitId, selectedUnitId){
  _healthMapUnit(id, unitId, function(m){
   if(selectedUnitId==='__new'){
    m.guardianUnitId=null;
    m.guardianName=m.guardianName||'';
    m.guardianRelationship=m.guardianRelationship||'Cha/Mẹ';
    m.guardianPhone=m.guardianPhone||'';
    return;
   }
   const src = BANCA.healthUnitsOf(app).find(function(u){return u.insuredUnitId===selectedUnitId;}) || {};
   m.guardianUnitId=selectedUnitId;
   m.guardianName=src.name||m.guardianName||'';
   m.guardianPhone=src.phone||m.guardianPhone||'';
   m.guardianRelationship=m.guardianRelationship||'Cha/Mẹ';
  }, true, true);
 };

 window.healthUnitSetRisk = function(id, unitId, code, val, kind){
  _healthMapUnit(id, unitId, function(m){ m.riskAnswers=m.riskAnswers||{}; m.riskAnswers[code]=(kind==='bool')?val:(val); }, false, true);
  // branchOn / eligibility có thể đổi hiển thị → reload nhẹ để cập nhật navigator + nhánh phụ.
  location.href='?id='+id+'&step=RISK_DECLARATION&unit='+unitId+(isNew?'&new=1':'');
 };
 window.healthUnitPickPackage = function(id, unitId, code){
  _healthMapUnit(id, unitId, function(m){ m.package=code; }, true, true);
 };
 window.healthApplyPackageToAll = function(id, code){
  const members = _healthPersistMembers(app);
  members.forEach(function(m){ if(m.active!==false){ const u=BANCA.hydrateInsuredUnit(app,m,0); if(BANCA.healthUnitEligibility(app,u).eligible!==false && (BANCA.healthAgeAt(m.dob,app.effectiveDate)!=null)) m.package=code; } });
  _healthCommitMembers(id, members);
  location.href='?id='+id+'&step=PACKAGE_AND_QUOTE'+(qs.get('unit')?'&unit='+qs.get('unit'):'')+(isNew?'&new=1':'');
 };
 window.healthAddUnit = function(id){
  const members = _healthPersistMembers(app);
  const nextIdx = members.length;
  members.push({name:'', dob:'', relationship:'Con', insuredUnitId:'IU-'+(nextIdx+1), active:true, package:app.package||null, riskAnswers:{}, docs:{}, beneficiaries:[]});
  _healthCommitMembers(id, members);
  location.href='?id='+id+'&step=INSURED_PARTY&unit=IU-'+(nextIdx+1)+(isNew?'&new=1':'');
 };
 window.healthRemoveUnit = function(id, unitId){
  let members = _healthPersistMembers(app).filter(function(m){return m.insuredUnitId!==unitId;});
  // đánh lại insuredUnitId theo index để ổn định.
  members = members.map(function(m,i){ return Object.assign({}, m, {insuredUnitId:'IU-'+(i+1)}); });
  _healthCommitMembers(id, members);
  location.href='?id='+id+'&step=INSURED_PARTY'+(isNew?'&new=1':'');
 };
 window.healthToggleActive = function(id, unitId, makeActive){
  _healthMapUnit(id, unitId, function(m){ m.active = !!makeActive; }, true, true);
 };
 window.healthUnitDoc = function(id, unitId, code){
  _healthMapUnit(id, unitId, function(m){ m.docs=m.docs||{}; m.docs[code]='UPLOADED'; }, false, true);
  location.href='?id='+id+'&step=DOCUMENTS&unit='+unitId+(isNew?'&new=1':'');
 };
 window.healthUnitBeneAdd = function(id, unitId){
  _healthMapUnit(id, unitId, function(m){ m.beneficiaries=m.beneficiaries||[]; m.beneficiaries.push({name:'',relationship:'',share:0}); }, false, true);
  location.href='?id='+id+'&step=PACKAGE_AND_QUOTE&unit='+unitId+(isNew?'&new=1':'');
 };
 window.healthUnitBeneRemove = function(id, unitId, bi){
  _healthMapUnit(id, unitId, function(m){ (m.beneficiaries||[]).splice(bi,1); }, false, true);
  location.href='?id='+id+'&step=PACKAGE_AND_QUOTE&unit='+unitId+(isNew?'&new=1':'');
 };
 window.healthUnitBeneSet = function(id, unitId, bi, field, val){
  _healthMapUnit(id, unitId, function(m){ m.beneficiaries=m.beneficiaries||[]; m.beneficiaries[bi]=m.beneficiaries[bi]||{}; m.beneficiaries[bi][field]=(field==='share'?(val===''?0:Number(val)):val); }, false, true);
 };
 window.showHealthPackageDetail = function(code){
  const pk=healthPkg(code);
  const root=document.getElementById('start-sale-root')||document.body;
  const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
  d.innerHTML=`<div class="modal2" style="max-width:680px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Quyền lợi chi tiết — ${pk.name||code}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><tbody>${healthBenefitRows(code).map(([k,v])=>`<tr><td style="color:var(--ink-500);">${k}</td><td><b>${v}</b></td></tr>`).join('')}</tbody></table>
   <div class="label" style="margin:12px 0 6px;">Loại trừ chính</div>
   ${(pk.exclusions||[]).map(x=>`<div style="font-size:12.5px;padding:4px 0;color:var(--ink-700);">- ${x}</div>`).join('')}
  </div></div>`;
  root.appendChild(d);
 };
 window.showHealthCompare = function(){
  const root=document.getElementById('start-sale-root')||document.body;
  const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
  const rows=Object.values(BANCA.healthPackages||{}).map(pk=>`<tr><td><b>${pk.name}</b></td>${healthBenefitRows(pk.code).slice(0,6).map(([_,v])=>`<td>${v}</td>`).join('')}<td>${(pk.exclusions||[])[0]||'Theo quy tắc'}</td></tr>`).join('');
  d.innerHTML=`<div class="modal2" style="max-width:980px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>So sánh gói sức khỏe</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><thead><tr><th>Gói</th><th>Nội trú</th><th>Ngoại trú</th><th>Nha khoa</th><th>Thai sản</th><th>Giới hạn/năm</th><th>Đồng chi trả</th><th>Loại trừ nổi bật</th></tr></thead><tbody>${rows}</tbody></table>
  </div></div>`;
  root.appendChild(d);
 };
 window.showPaPackageDetail = function(code){
  const pk=paPkg(code);
  const root=document.getElementById('start-sale-root')||document.body;
  const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
  d.innerHTML=`<div class="modal2" style="max-width:620px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Quyền lợi chi tiết — ${pk.name||code}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><tbody>${paBenefitRows(code).map(([k,v])=>`<tr><td style="color:var(--ink-500);">${k}</td><td><b>${v}</b></td></tr>`).join('')}</tbody></table>
   <div class="label" style="margin:12px 0 6px;">Loại trừ chính</div>
   ${(pk.exclusions||[]).map(x=>`<div style="font-size:12.5px;padding:4px 0;color:var(--ink-700);">- ${x}</div>`).join('')}
  </div></div>`;
  root.appendChild(d);
 };
 window.showPaCompare = function(){
  const root=document.getElementById('start-sale-root')||document.body;
  const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
  const rows=Object.values(BANCA.paPackages||{}).map(pk=>`<tr><td><b>${pk.name}</b></td>${paBenefitRows(pk.code).map(([_,v])=>`<td>${v}</td>`).join('')}<td>${(pk.exclusions||[])[0]||'Theo quy tắc'}</td></tr>`).join('');
  d.innerHTML=`<div class="modal2" style="max-width:900px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>So sánh các gói PA</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><thead><tr><th>Gói</th><th>Tử vong</th><th>TT toàn bộ</th><th>TT bộ phận</th><th>Y tế</th><th>Nằm viện/ngày</th><th>Loại trừ nổi bật</th></tr></thead><tbody>${rows}</tbody></table>
  </div></div>`;
  root.appendChild(d);
 };
 // Panel firm-quote được build sau stepBody → điền lại khi handlers đã sẵn sàng.
 setTimeout(function(){ const p=document.getElementById('firm-quote-panel'); if(p && window.firmQuotePanelHtml) p.innerHTML=window.firmQuotePanelHtml(app); }, 0);
 window.pickPackage = function(code){
  const pk=BANCA.motorPackages[code];
  const val=(app.vehicle&&app.vehicle.value)||600000000;
  const oldSnap=(app.quote&&app.quote.inputsSnapshot)||{};
  const inputs={packageCode:code,sumInsured:val,termMonths:12,addOns:pk.defaultAddOns.slice(),deductible:pk.defaultDeductible,ncdPercent:oldSnap.ncdPercent||0,vehicleAgeYears:oldSnap.vehicleAgeYears||2};
  saveQuote(inputs,'Đã áp lại add-on & khấu trừ theo mặc định gói '+pk.name+'. Phí đã tính lại.');
 };
 window.rerate = function(){
  const code=(app.quote&&app.quote.inputsSnapshot&&app.quote.inputsSnapshot.packageCode)||(app.package||'STANDARD').toUpperCase();
  const btn=document.getElementById('rate-btn') || event&&event.target;
  if(btn){ btn.disabled=true; btn.textContent='Đang tính phí…'; }
  const st2=document.getElementById('save-state'); if(st2){ st2.textContent='Đang gọi rating engine…'; st2.style.color='var(--amber-600)'; }
  const qb=document.getElementById('quote-block'); if(qb){ qb.insertAdjacentHTML('beforeend','<div id="rating-progress" class="alert2 info" style="margin-top:10px;">Đang tính phí, vui lòng chờ…</div>'); }
  setTimeout(()=>saveQuote(currentInputsFromDOM(code)), 450);
 };
 // 17:04 (user chốt): đổi add-on/khấu trừ/thời hạn → HỆ THỐNG TỰ TÍNH LẠI PHÍ ngay, không cần bấm nút
 window.autoRerate = function(){
  const code=(app.quote&&app.quote.inputsSnapshot&&app.quote.inputsSnapshot.packageCode)||(app.package||'STANDARD').toUpperCase();
  const st2=document.getElementById('save-state');
  if(st2){ st2.textContent='Đang tính phí lại…'; st2.style.color='var(--amber-600)'; }
  const qb=document.getElementById('quote-block'); if(qb&&!document.getElementById('rating-progress')) qb.insertAdjacentHTML('beforeend','<div id="rating-progress" class="alert2 info" style="margin-top:10px;">Đang tự động tính lại phí…</div>');
  setTimeout(()=>saveQuote(currentInputsFromDOM(code)), 450);
 };
 window.restoreDefaults = function(){
  const code=(app.quote&&app.quote.inputsSnapshot&&app.quote.inputsSnapshot.packageCode)||(app.package||'STANDARD').toUpperCase();
  window.pickPackage(code);
 };
 window.uploadDoc = function(code){
  const cur=(BANCA.overlay.applications&&BANCA.overlay.applications[app.id]&&BANCA.overlay.applications[app.id].__docsUploaded)||[];
  BANCA.patchApp(app.id,{__docsUploaded:[...new Set([...cur,code])]});
  location.reload();
 };
 // Datalist: giá trị mới gõ vào tự insert danh mục in-session (không cần nút)
 window.comboChanged = function(id){
  const el=document.getElementById(id); if(!el) return;
  const v=el.value.trim(); if(!v) return;
  if(id==='vm-brand'){ if(!BANCA.vehicleMaster.brands[v]){ BANCA.addBrand(v); } 
   const ml=document.getElementById('vm-model-list'); if(ml) ml.innerHTML=(BANCA.vehicleMaster.brands[v]||[]).map(m=>`<option value="${m}">`).join('');
  } else if(id==='vm-model'){ const b=(document.getElementById('vm-brand')||{}).value||''; if(b) BANCA.addModel(b,v); }
  else if(id==='vm-type'){ if(!BANCA.vehicleMaster.types.includes(v)) BANCA.vehicleMaster.types.push(v); }
  else if(id==='vm-usage'){ if(!BANCA.vehicleMaster.usages.includes(v)) BANCA.vehicleMaster.usages.push(v); }
  window.autosave();
 };
 // Luồng thế chấp: đổi cờ → hiện/ẩn block NTH + quote STALE + re-evaluate tài liệu
 window.mortgageChanged = function(){
  const on=document.getElementById('mg-flag').value==='1';
  document.getElementById('mg-block').style.display=on?'block':'none';
  const lenderType=(document.getElementById('mg-type')||{}).value||'Ngân hàng';
  const bank=(document.getElementById('mg-bank')||{}).value||'';
  const inputs2=[...document.querySelectorAll('#mg-block input')].filter(i=>i.id!=='mg-bank');
  BANCA.patchApp(app.id,{mortgage:{mortgaged:on,lenderType:on?lenderType:null,bank:on?bank:null,branch:on?((inputs2[0]||{}).value||''):null,creditContract:on?((inputs2[1]||{}).value||''):null},
   warnings:[...new Set([...(app.warnings||[]),'QUOTE_NEED_RERATE'])]});
  window.autosave();
 };
 window.showQuoteHistory = function(){
  const q=app.quote;
  document.getElementById('quote-history').innerHTML=`<div class="card" style="padding:0;margin-top:10px;"><table class="dtable"><thead><tr><th>Version</th><th>Phí</th><th>Tạo lúc</th><th>Bởi</th><th>Trạng thái</th></tr></thead><tbody>
   ${(q.versions||[]).map(v=>`<tr><td>v${v.version}</td><td>${BANCA.vnd(v.premium)}</td><td style="font-size:12px;">${v.createdAt}</td><td style="font-size:12px;">${(BANCA.personas[v.createdBy]||{}).name||v.createdBy}</td><td>${v.status==='CURRENT'?'<span class="badge badge-ready">Hiện tại</span>':'<span class="badge badge-pending">Superseded</span>'}</td></tr>`).join('')}
  </tbody></table></div>`;
 };
 window.submitApp = function(id){
  // P0.4/P0.6 — Decision router sau submit + KHÔNG ngắt hành trình.
  // UI CHỈ đọc ApplicationRoutingResult, không tự suy luận theo productId.
  if(app.productId==='pa'){
    const c0=BANCA.customerById(app.customerId)||{};
    const calcAge=ageOnDate((app.buyerIsInsured!==false)?c0.dob:app.insuredDob, app.effectiveDate||dateOnly(new Date().toISOString()));
    if(calcAge!=null){ app.insuredAge=calcAge; BANCA.patchApp(id,{insuredAge:calcAge}); }
  } else if(app.productId==='health'){
    // §sau nộp — Thẩm định PER MEMBER: mỗi thành viên 1 kết quả riêng; trạng thái tổng DERIVE.
    const now2 = '2026-07-23 '+new Date().toTimeString().slice(0,5);
    const members = _healthPersistMembers(app);
    members.forEach(function(m){
     if(m.active===false){ m.underwriting=null; return; }
     const u = BANCA.hydrateInsuredUnit(app, m, m.index||0);
     const elig = BANCA.healthUnitEligibility(app, u);
     const ra = m.riskAnswers||{};
     let dec='APPROVED_STP';
     if(!elig.eligible) dec='REJECTED';
     else if(ra.preExistingCondition || ra.hospitalizedLast12Months || ra.congenitalCondition || ra.birthComplication) dec='IN_UW';
     else if(ra.smoker) dec='LOADING';
     const rt = BANCA.rateHealthUnit(u);
     m.underwriting = {decision:dec, decidedAt:now2, decisionSource:'RULE_ENGINE', ruleSetCode:'HEALTH_BASIC_UW', ruleVersion:'1.0',
       additionalPremium: dec==='LOADING'? Math.round((rt?rt.totalPremium:0)*0.1):0,
       conditions: dec==='LOADING'?['Phụ phí 10% do khai báo hút thuốc']:[], exclusions:[],
       label:(BANCA.HEALTH_UW_MEMBER[dec]||{}).label||dec, paymentAllowed: dec!=='REJECTED' && dec!=='IN_UW'};
     m.confirmation = m.confirmation || {status:'PENDING'};
    });
    app.insuredMembers = members;
    const overall = BANCA.healthDeriveOverallUw(app);
    const premiumH = (app.quote && (app.quote.premium || app.quote.adjustedPremium)) || app.premium;
    const now3 = now2;
    if(overall.code==='READY_PAYMENT'){
      const stpH = BANCA.makeStpDecision('health', {decidedAt:now3, applicationId:id, additionalPremium:0, exclusions:[], conditions:[], additionalDocuments:[]});
      BANCA.patchApp(id, {submissionState:'SUBMITTED', status:'PAYMENT_METHOD_REQUIRED',
        applicationStatus:'PROCESSING', underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_STP',
        paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED',
        insuredMembers:members, routing: BANCA.makeRoutingResult('APPROVED_FOR_BIND',{reasons:['Mọi thành viên active đủ điều kiện phát hành.']}),
        stpDecision: stpH.error?null:stpH, payment:null, submittedAt:now3, premium:premiumH, sla:null});
      location.href='?id='+id+'&tab=uw&routed=1'; return;
    }
    BANCA.patchApp(id, {submissionState:'SUBMITTED', status:'PENDING_UW',
      applicationStatus:'PROCESSING', underwritingStatus:'IN_PROGRESS',
      insuredMembers:members,
      routing: BANCA.makeRoutingResult('UW_REQUIRED',{reasons:['Có thành viên cần thẩm định sức khỏe — trạng thái tổng tính theo từng người.']}),
      submittedAt:now3, premium:premiumH, sla:'2026-07-25 17:00', todo:'Chờ kết quả thẩm định theo thành viên'});
    location.href='?id='+id+'&tab=uw&routed=1'; return;
  }
  const routing = BANCA.evaluateUnderwriting({
    productId: app.productId,
    riskAnswers: app.riskAnswers || (app.quote && app.quote.riskAnswersSnapshot) || {},
    age: app.insuredAge, occupationClass: app.occupationClass, insuredMembers: app.insuredMembers,
    sumInsured: (app.quote && app.quote.packageId ? undefined : undefined),
    buyerIsInsured: app.buyerIsInsured
  });
  const premium = (app.quote && (app.quote.premium || app.quote.adjustedPremium)) || app.premium;
  const jrn = BANCA.journeyFor(app.productId);
  const isStp = jrn.underwritingMode==='STP';
  const now2 = '2026-07-23 '+new Date().toTimeString().slice(0,5);

  // §1/§IV — STP: SUBMITTED → UW_PROCESSING → APPROVED_STP → PAYMENT_METHOD_REQUIRED.
  // KHÔNG tạo payment intent ở bước này.
  if(isStp && routing.code==='APPROVED_FOR_BIND'){
    const stp = BANCA.makeStpDecision(app.productId, {decidedAt:now2, applicationId:id,
      additionalPremium:0, exclusions:[], conditions:[], additionalDocuments:[]});
    if(stp.error){ // §V — thiếu cấu hình → config error, KHÔNG âm thầm map Motor.
      BANCA.patchApp(id,{submissionState:'SUBMITTED',status:'PENDING_UW',configError:stp.configError,submittedAt:now2});
      alert('Lỗi cấu hình thẩm định: '+stp.configError.message);
      location.href='?id='+id+'&tab=uw'; return;
    }
    BANCA.patchApp(id, {
      submissionState:'SUBMITTED',
      status:'PAYMENT_METHOD_REQUIRED',
      // multi-field state model (§II)
      applicationStatus:'PROCESSING',
      underwritingStatus:'DECIDED',
      underwritingDecision:'APPROVED_STP',
      paymentStatus:'METHOD_REQUIRED',
      policyStatus:'NOT_STARTED',
      routing: routing,
      stpDecision: stp,
      payment: null,                     // chưa có payment intent
      submittedAt: now2, premium: premium
    });
    location.href = '?id='+id+'&tab=uw&routed=1';
    return;
  }

  BANCA.patchApp(id, {
    submissionState:'SUBMITTED',
    status: routing.appStatus,
    routing: routing,                       // lưu để tracking mode đọc lại
    submittedAt: now2,
    premium: premium,
    sla:'2026-07-24'
  });
  // Continuity: mở đúng bước tiếp theo TRONG cùng workspace (không về danh sách).
  const tabByStage = {PAYMENT:'confirmpay', UNDERWRITING:'uw', REVIEW_AND_SUBMIT:'supplement', null:'overview'};
  const tab = tabByStage[routing.nextStage] || 'overview';
  location.href = '?id='+id+'&tab='+tab+'&routed=1';
 };
 return;
}

// ================================================================ TRACKING MODE
const st = app.status;
const activeTab = qs.get('tab')||'overview';
const tabs=[['overview','Tổng quan'],['customer','Khách hàng'],['quote','Gói & phí'],['declaration','Khai báo'],['documents','Tài liệu'],['uw','Thẩm định'],['confirm','Xác nhận KH'],['payment','Thanh toán'],['policy','Hợp đồng'],['history','Lịch sử']];
if(st==='NEED_MORE_INFO') tabs.splice(1,0,['supplement','⚠ Bổ sung']);

// ---- Không gian theo dõi yêu cầu đã nộp: status → phase / actions / next-action (view-only) ----
function casePhase(status){
 return ({PENDING_RECEIPT:'PENDING_INTAKE', PENDING_UW:'UW_PENDING', IN_UW:'UW_IN_PROGRESS',
  NEED_MORE_INFO:'NEED_MORE_INFORMATION', UW_DECIDED:'APPROVED_WITH_CONDITION',
  PENDING_CUSTOMER_CONFIRM:'CUSTOMER_RECONFIRMATION', PAYMENT_METHOD_REQUIRED:'PAYMENT_METHOD_REQUIRED', PENDING_PAYMENT:'PAYMENT_PENDING',
  PAID:'PAID', PENDING_ISSUE:'PENDING_ISSUE', ISSUED:'ISSUED', REJECTED:'REJECTED', CANCELLED:'CANCELLED'})[status]||status;
}
const casePh = casePhase(st);
const supCount = (app.supplement&&app.supplement.items||[]).length;
// §III/§X — next action từ canonical resolver (dùng chung với list/header/queue).
const caseView = BANCA.deriveCaseViewState(app);
function caseNextAction(){
 return [caseView.nextActionLabel||'Đang xử lý — theo dõi trạng thái.', caseView.statusTone||'wait'];
}
function getSubmittedCaseActions(){
 const A={
  view:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=customer">Xem yêu cầu đã nộp</a>`,
  pdf:`<button class="btn btn-secondary btn-sm" onclick="alert('Tải bản PDF yêu cầu (demo)')">Tải PDF</button>`,
  hist:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=history">Xem lịch sử</a>`,
  support:`<button class="btn btn-secondary btn-sm" onclick="alert('Yêu cầu hỗ trợ (demo)')">Yêu cầu hỗ trợ</button>`,
  withdraw:`<button class="btn btn-secondary btn-sm" style="color:var(--red-600);" onclick="withdrawCase('${app.id}')">Thu hồi yêu cầu</button>`,
  supplement:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=supplement">Bổ sung yêu cầu</a>`,
  seeReq:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=supplement">Xem yêu cầu</a>`,
  seeStatus:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=uw">Xem trạng thái</a>`,
  seeCond:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=uw">Xem điều kiện</a>`,
  sendConfirm:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=confirmpay">Gửi khách xác nhận</a>`,
  sendPay:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=confirmpay">Gửi link thanh toán</a>`,
  trackPay:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=confirmpay">Theo dõi thanh toán</a>`,
  policy:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=policy">Xem hợp đồng</a>`,
  resend:`<button class="btn btn-secondary btn-sm" onclick="alert('Gửi lại cho khách (demo)')">Gửi lại cho khách</button>`
 };
 A.chooseMethod=`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=confirmpay">Khởi tạo thanh toán</a>`;
 // §X — actions từ canonical resolver: primary + secondary theo action key.
 const btn=(act,primary)=>{
  const cls=primary?'btn-primary':'btn-secondary';
  const tab=act.tab||'overview';
  // confirm/chooseMethod mở tab confirmpay group.
  // chooseMethod/trackPay/retryPay → thẳng sub-tab PAYMENT (nơi có nút); confirm → sub-tab confirm.
  const t=(act.key==='chooseMethod'||act.key==='trackPay'||act.key==='retryPay')?'payment':(act.key==='confirm'?'confirm':tab);
  return `<a class="btn ${cls} btn-sm" href="?id=${app.id}&tab=${t}">${act.label}</a>`;
 };
 // Hợp đồng đã phát hành: gộp action ở header — "Xem hợp đồng" là hyperlink mở chi tiết hợp đồng,
 // kèm nút Tải hợp đồng + Gửi cho khách. Ẩn "Xem lịch sử" và các nhóm nút trùng trong panel.
 if(st==='ISSUED' && app.policyId){
  const detailHref=`${r}modules/policies/index.html?view=detail&id=${app.policyId}`;
  return [
   `<a href="${detailHref}" style="font-size:12.5px;color:var(--brand-600);text-decoration:underline;align-self:center;padding:6px 4px;">Xem hợp đồng</a>`,
   `<button class="btn btn-primary btn-sm" onclick="alert('Tải hợp đồng PDF (demo)')">Tải hợp đồng</button>`,
   `<button class="btn btn-secondary btn-sm" onclick="this.textContent='Đã gửi';this.disabled=true;">Gửi cho khách</button>`
  ];
 }
 const out=[];
 if(caseView.primaryAction) out.push(btn(caseView.primaryAction,true));
 (caseView.secondaryActions||[]).forEach(a2=>out.push(btn(a2,false)));
 out.push(A.hist);
 return out;
}

// ---- 7-tab nav (Không gian theo dõi yêu cầu đã nộp) ----
const SNAP_SUB=[['customer','Thông tin khách hàng'],['quote','Gói & phí'],['declaration','Nội dung khai báo'],['documents','Tài liệu đã nộp']];
// §confirmpay — GỘP 1 trang dọc: xác nhận + phí + thanh toán + lịch sử (BỎ sub-tab & tab "Liên hệ").
const CONFIRMPAY_ALIASES=['confirmpay','confirm','payment','comm'];
const snapIds=SNAP_SUB.map(x=>x[0]);
const showSupTab = supCount>0 || casePh==='NEED_MORE_INFORMATION';
const topActive = activeTab==='overview'?'overview' : snapIds.includes(activeTab)?'snapshot' : (CONFIRMPAY_ALIASES.includes(activeTab))?'confirmpay' : activeTab;
const topTabs=[
 ['overview','Tổng quan xử lý','overview'],
 ['snapshot','Yêu cầu đã nộp','customer'],
 ...(showSupTab?[['supplement','Yêu cầu bổ sung'+(supCount?` <span class="badge badge-blocked" style="font-size:9px;">${supCount}</span>`:''),'supplement']]:[]),
 ['uw','Thẩm định','uw'],
 ['confirmpay','Xác nhận & thanh toán','confirmpay'],
 ['policy','Hợp đồng','policy'],
 ['history','Lịch sử','history']
];
const topLink=([key,label,target])=>`<a href="?id=${app.id}&tab=${target}" class="tab" style="text-decoration:none;display:inline-block;padding:9px 13px;font-size:13px;${topActive===key?'border-bottom:2px solid var(--brand-600);color:var(--brand-600);font-weight:600;':'color:var(--ink-500);'}">${label}</a>`;
const subLink=([id,label])=>`<a href="?id=${app.id}&tab=${id}" style="text-decoration:none;padding:6px 11px;border-radius:7px;font-size:12.5px;${activeTab===id?'background:var(--brand-600);color:#fff;font-weight:600;':'background:var(--paper-card);color:var(--ink-500);border:1px solid var(--line);'}">${label}</a>`;
const subSet = topActive==='snapshot'?SNAP_SUB : null;
const subNav = subSet ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${subSet.map(subLink).join('')}</div>` : '';
const viewOnlyBanner = (topActive==='snapshot') ? `<div class="alert2 info" style="margin-bottom:12px;">🔒 <b>Bản yêu cầu đã nộp — chỉ xem.</b> Dữ liệu dưới đây là snapshot tại thời điểm nộp; chỉ chỉnh khi có yêu cầu bổ sung.</div>` : '';
const tabBar=`<div class="tabbar" style="margin-bottom:14px;overflow-x:auto;white-space:nowrap;display:flex;align-items:center;gap:6px;">${topTabs.map(topLink).join('')}</div>${subNav}${viewOnlyBanner}`;

// P2-3: SLA countdown màu theo mức khẩn (mốc demo NOW = 2026-07-20 15:30)
function slaHtml(sla){
 if(!sla) return '—';
 const now=new Date('2026-07-20T15:30:00'), d=new Date(sla.replace(' ','T'));
 const hrs=(d-now)/3600000;
 const color=hrs<0?'var(--red-600)':hrs<=24?'var(--red-600)':hrs<=72?'var(--amber-600)':'var(--teal-600)';
 const txt=hrs<0?'QUÁ HẠN':hrs<=24?('còn '+Math.round(hrs)+'h'):('còn '+Math.round(hrs/24)+' ngày');
 return `<span style="color:${color};font-weight:600;">${sla} · ${txt}</span>`;
}

// P0-10 + P1-4: timeline 3 trạng thái (done / waiting / auto|not-required)
function timeline(){
 const flowNeedsConfirm = !!app.confirm || ['PENDING_CUSTOMER_CONFIRM'].includes(st) || (app.uw&&['APPROVED_WITH_LOADING','APPROVED_WITH_EXCLUSION','APPROVED_WITH_CONDITION'].includes(app.uw.decision));
 const paidOrLater=['PAID','PENDING_ISSUE','ISSUED'].includes(st);
 const confirmDone = app.confirm? paidOrLater||st==='PENDING_PAYMENT' : false;
 const items=[
  ['Nộp yêu cầu bảo hiểm','done',app.submittedAt],
  ['Thẩm định', app.uw?'done':(['REJECTED','CANCELLED'].includes(st)?'na':'wait'), app.uw?app.uw.decidedAt:null],
  ['Khách xác nhận', !flowNeedsConfirm?'auto':(confirmDone?'done':(st==='PENDING_CUSTOMER_CONFIRM'||app.confirm?'wait':'wait')), app.confirm?app.confirm.sentAt:null],
  ['Thanh toán', app.payment&&app.payment.status==='SUCCESS'?'done':(paidOrLater?'done':(st==='PENDING_PAYMENT'?'wait':['REJECTED','CANCELLED'].includes(st)?'na':'wait')), app.payment&&app.payment.paidAt||null],
  ['Phát hành', st==='ISSUED'?'done':(['REJECTED','CANCELLED'].includes(st)?'na':'wait'), st==='ISSUED'?app.updatedAt:null]
 ];
 const icon={done:['✓','var(--teal-600)','#fff'],wait:['⏳','var(--amber-100)','var(--amber-600)'],auto:['⚙','var(--paper)','var(--ink-300)'],na:['—','var(--paper)','var(--ink-300)']};
 const lbl={done:'',wait:' (đang chờ)',auto:' — Không yêu cầu (auto)',na:' — Không áp dụng'};
 return `<div class="card" style="padding:16px;">${items.map(([l,s2,t])=>{
  const [ic,bg,fg]=icon[s2];
  return `<div style="display:flex;gap:12px;align-items:center;padding:7px 0;"><span style="width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:${bg};color:${fg};border:1px solid var(--line);">${ic}</span><b style="font-size:13px;width:210px;${s2==='auto'||s2==='na'?'color:var(--ink-300);font-weight:500;':''}">${l}${lbl[s2]}</b><span style="font-size:12px;color:var(--ink-500);">${t||'—'}</span></div>`;
 }).join('')}</div>`;
}

const row=(k,v)=>`<tr><td style="width:230px;color:var(--ink-500);font-size:12.5px;">${k}</td><td style="font-size:13px;">${v}</td></tr>`;
const qTrack = app.quote;
const snapTrack = (qTrack&&qTrack.inputsSnapshot)||{};
const mgTrack = ((BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{}).mortgage || app.mortgage || {mortgaged:false};
const idvTrack = snapTrack.sumInsured || (app.vehicle&&app.vehicle.value) || 0;
const dedTrack = snapTrack.deductible || 0;
const addOnsTrack = (snapTrack.addOns||[]).map(c=>(BANCA.motorAddOns[c]||{}).name||c);
const nthText = mgTrack.mortgaged ? `<b style="color:var(--amber-600);">${mgTrack.bank||'—'}</b>${mgTrack.lenderType?' ('+mgTrack.lenderType+')':''}${mgTrack.branch?' · '+mgTrack.branch:''} · HĐ ${mgTrack.creditContract||'—'} <span style="font-size:10.5px;color:var(--ink-300);">(NTH nhập độc lập, không suy từ Nhân viên tư vấn)</span>` : 'Chủ xe (xe không thế chấp)';
const waterfallHtml = qTrack&&qTrack.subtotal!=null ? `<div class="card" style="padding:14px;margin-top:12px;"><div class="label" style="margin-bottom:6px;">Breakdown phí thác nước</div>
  <div style="display:flex;justify-content:space-between;font-size:12.5px;"><span>TNDS bắt buộc</span><b>${BANCA.vnd(qTrack.tplPremium)}</b></div>
  <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-500);"><span>Phí gốc vật chất (IDV ${BANCA.vnd(idvTrack)})</span><span>${BANCA.vnd(qTrack.odBase)}</span></div>
  ${(qTrack.lines||[]).map(l=>`<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-500);"><span>${l.amount<0?'−':'+'} ${l.label} (${l.pct}%)</span><span>${l.amount<0?'−':'+'}${BANCA.vnd(Math.abs(l.amount))}</span></div>`).join('')}
  <div style="display:flex;justify-content:space-between;font-size:12.5px;border-top:1px dashed var(--line);margin-top:5px;padding-top:5px;"><span>= Tạm tính (Subtotal)</span><b>${BANCA.vnd(qTrack.subtotal)}</b></div>
  ${qTrack.ncdAmount?`<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--teal-600);"><span>− NCD ${qTrack.ncdPct}%</span><span>−${BANCA.vnd(qTrack.ncdAmount)}</span></div>`:''}
  <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--amber-600);"><span>+ VAT ${BANCA.VAT_PCT}% (vật chất)</span><span>+${BANCA.vnd(qTrack.vatAmount)}</span></div>
  ${app.uw&&app.uw.newPremium?`<div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--amber-600);"><span>Điều chỉnh UW</span><span>${BANCA.vnd(app.uw.newPremium-(qTrack.totalPremium||app.premium))}</span></div>`:''}
  <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:1px solid var(--line);margin-top:6px;padding-top:6px;color:var(--brand-600);"><span>Phí thực</span><span>${BANCA.vnd((app.uw&&app.uw.newPremium)||qTrack.totalPremium||app.premium)}</span></div>
</div>` : '';
const benefitsHtml = `<div class="card" style="padding:0;margin-top:12px;"><table class="dtable"><thead><tr><th>Quyền lợi</th><th>Số tiền / giới hạn</th></tr></thead><tbody>
<tr><td>TNDS bắt buộc — người</td><td><b>150.000.000 ₫</b>/người/vụ</td></tr>
<tr><td>TNDS bắt buộc — tài sản</td><td><b>100.000.000 ₫</b>/vụ</td></tr>
<tr><td>Số tiền BH vật chất (IDV/SI)</td><td><b>${BANCA.vnd(idvTrack)}</b></td></tr>
<tr><td>Mức khấu trừ</td><td><b>${dedTrack?BANCA.vnd(dedTrack):'—'}</b>/vụ</td></tr>
<tr><td>Add-on</td><td>${addOnsTrack.length?addOnsTrack.join(', '):'Không'}</td></tr>
<tr><td>PA lái/phụ xe (NTX)</td><td><b>10.000.000 ₫</b>/người × ${(app.vehicle&&app.vehicle.seats)||5} chỗ</td></tr>
<tr><td>Cứu hộ 24/7</td><td>Tối đa 4 lần/năm · 2.000.000 ₫/vụ</td></tr>
</tbody></table></div>`;
function submittedDocTable(){
 const ctx={source:app.source,vehicleAgeYears:snapTrack.vehicleAgeYears||(app.vehicle?2026-(app.vehicle.year||2024):0),idv:idvTrack,mortgage:mgTrack};
 const req=BANCA.docRequirements(ctx);
 const uploaded=[...new Set([...(app.docsUploaded||['REG','INSPECT','PHOTOS','ID']),...(mgTrack.mortgaged?['BENEFICIARY']:[])])];
 const docs=BANCA.DOC_CATALOG.filter(d=>{const rr=req[d.code];return rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active)||uploaded.includes(d.code);});
 const icon=r=>r.status==='REQUIRED'?['●','var(--red-600)']:r.status==='INHERITED'?['↻','#2563eb']:r.active?['◐','var(--amber-600)']:['○','var(--ink-300)'];
 const requiredCount=docs.filter(d=>{const rr=req[d.code];return rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active)}).length;
 const uploadedRequired=docs.filter(d=>{const rr=req[d.code];return uploaded.includes(d.code)&&(rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active))}).length;
 const fileOf={REG:'dang-ky-xe.pdf',INSPECT:'dang-kiem.pdf',PHOTOS:'anh-xe.zip',ID:'cccd.pdf',DRIVER_LICENSE:'gplx.pdf',VALUE_PROOF:'hoa-don-vat.pdf',AUTHORIZATION:'uy-quyen.pdf',BENEFICIARY:'xac-nhan-nth.pdf',SURVEY:'bien-ban-giam-dinh.pdf'};
 // Doc item view-only (tracking) — cùng layout .doc-item với các tab khác
 const ocrCodes = {REG:1, ID:1};
 const st = c => (app.docStates||{})[c];
 const trackItem = d => {
  const rr=req[d.code]; const need=rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active);
  const up=uploaded.includes(d.code);
  const dot = rr.status==='REQUIRED'?['●','var(--red-600)','#fdecec']:rr.status==='INHERITED'?['↻','#2563eb','#eaf1fe']:rr.active?['◐','var(--amber-600)','#fdf3e3']:['○','var(--ink-300)','var(--paper)'];
  const chips=[];
  chips.push(up?'<span class="badge badge-ready">Đã nộp</span>':(need?'<span class="badge badge-blocked">Còn thiếu</span>':'<span class="badge badge-version">Tùy chọn</span>'));
  if(ocrCodes[d.code]&&up) chips.push('<span class="badge badge-ready">Đã bóc tách</span>');
  const stv=st(d.code); if(stv==='REJECTED') chips.push('<span class="badge badge-blocked">Bị từ chối</span>'); else if(stv==='CHECKING') chips.push('<span class="badge badge-pending">Đang kiểm tra</span>');
  return `<div class="doc-item">
    <div><span style="display:inline-flex;width:40px;height:40px;border-radius:8px;align-items:center;justify-content:center;font-weight:800;background:${dot[2]};color:${dot[1]};">${dot[0]}</span></div>
    <div><div style="font-weight:600;font-size:13.5px;">${d.name}</div><div style="font-size:12px;color:var(--ink-500);">${d.sub||''}${rr.note?' · '+rr.note:''}</div><div class="doc-item-statuses">${chips.join(' ')}</div>${up?`<div style="font-size:11.5px;color:var(--ink-300);margin-top:3px;">${fileOf[d.code]||''}</div>`:''}</div>
    <div class="doc-item-actions">${up?'<button class="btn btn-secondary btn-sm" onclick="alert(\'Xem tài liệu (demo)\')">Xem</button>':'<span style="font-size:11.5px;color:var(--ink-300);">Chưa nộp</span>'}</div>
  </div>`;
 };
 const ocrDocs = docs.filter(d=>ocrCodes[d.code] && uploaded.includes(d.code));
 const restDocs = docs.filter(d=>!(ocrCodes[d.code] && uploaded.includes(d.code)));
 const legend = `<div class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ink-500);">
   <div>Tài liệu bắt buộc: <b style="color:${uploadedRequired>=requiredCount?'var(--teal-600)':'var(--red-600)'};">${uploadedRequired}/${requiredCount}</b> đã nộp/đối chiếu</div>
   <div style="display:flex;gap:10px;flex-wrap:wrap;"><span><b style="color:var(--red-600);">●</b> Bắt buộc</span><span><b style="color:var(--amber-600);">◐</b> Có điều kiện</span><span><b style="color:var(--ink-300);">○</b> Không cần</span></div>
 </div>`;
 return legend
   + (ocrDocs.length?`<div class="section-title" style="margin-top:0;"><h2>Tài liệu được OCR</h2><span class="subtitle">Bóc tách ở bước Khách hàng / Đối tượng bảo hiểm — chỉ xem</span></div><div class="card" style="padding:0;overflow:hidden;margin-bottom:8px;">${ocrDocs.map(trackItem).join('')}</div>`:'')
   + `<div class="section-title" ${ocrDocs.length?'':'style="margin-top:0;"'}><h2>Thư viện tài liệu yêu cầu</h2><span class="subtitle">Cùng nguồn trạng thái với tab Bổ sung</span></div>
      <div class="card" style="padding:0;overflow:hidden;">${restDocs.length?restDocs.map(trackItem).join(''):'<div class="empty-state" style="padding:24px;">Chưa có tài liệu tại bước này.</div>'}</div>`;
}
// P1: status summary banner — dẫn dắt màn bằng trạng thái + việc cần làm
function statusBanner(tone,title,sub,cta){
 const c={ok:['var(--teal-600)','var(--teal-100)'],wait:['var(--amber-600)','var(--amber-100)'],danger:['var(--red-600)','var(--red-100)'],info:['var(--brand-600)','var(--brand-100)']}[tone]||['var(--brand-600)','var(--brand-100)'];
 return `<div class="card" style="padding:16px 18px;border-left:4px solid ${c[0]};display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
  <div><div style="font-size:17px;font-weight:700;color:${c[0]};">${title}</div><div style="font-size:13.5px;color:var(--ink-500);margin-top:3px;">${sub}</div></div>
  ${cta?`<div style="display:flex;gap:8px;flex-wrap:wrap;">${cta}</div>`:''}
 </div>`;
}
function srcLabelOverview(){ return app.source==='ADVICE'?'Advisory':(app.leadId?'Bank CRM (Referral)':'Janus Bank CRM'); }
// Empty-state illustration (Epic 11)
function emptyIllu(icon,title,sub){ return `<div class="card"><div style="text-align:center;padding:34px 20px;"><div style="font-size:40px;opacity:.7;">${icon}</div><div style="font-size:15px;font-weight:700;margin-top:8px;color:var(--ink-700);">${title}</div>${sub&&sub!=='—'?`<div style="font-size:12.5px;color:var(--ink-500);margin-top:4px;max-width:420px;margin-left:auto;margin-right:auto;">${sub}</div>`:''}</div></div>`; }
// Communication log (Epic 13)
function communicationLog(){
 const ev=[];
 ev.push(['21/07 09:40','SMS','📱','Gửi thông báo nộp yêu cầu bảo hiểm','Đã gửi','ok']);
 if(app.confirm){ ev.push([app.confirm.sentAt||'21/07 10:20','Email','✉️','Link xác nhận yêu cầu','Đã gửi → Đã mở','ok']); }
 if(st==='PENDING_PAYMENT'||app.payment){ ev.push([app.payment&&app.payment.paidAt||'21/07 11:00','SMS','📱','Link thanh toán','Đã gửi → Đã xem'+(app.payment&&app.payment.status==='SUCCESS'?' → Đã thanh toán':''),app.payment&&app.payment.status==='SUCCESS'?'ok':'wait']); }
 if(st==='NEED_MORE_INFO'){ ev.push([app.supplement&&app.supplement.requestedAt||'—','Notification','🔔','Yêu cầu bổ sung yêu cầu','Đã gửi','warn']); }
 if(st==='ISSUED'){ ev.push([app.updatedAt||'—','Email','✉️','Gửi hợp đồng & chứng nhận','Đã gửi','ok']); }
 const tone={ok:'var(--teal-600)',warn:'var(--amber-600)',wait:'var(--brand-600)'};
 return `<div class="card" style="padding:0;overflow:hidden;"><div style="padding:12px 16px;border-bottom:1px solid var(--line);font-weight:700;font-size:14px;">Nhật ký liên hệ khách hàng</div>${ev.map(e=>`<div style="display:flex;gap:12px;padding:11px 16px;border-bottom:1px solid var(--line);align-items:flex-start;font-size:12.5px;"><span style="font-size:16px;">${e[2]}</span><div style="flex:1;"><b>${e[3]}</b> <span class="chip" style="font-size:9px;">${e[1]}</span><div style="font-size:11.5px;color:${tone[e[5]]};margin-top:2px;">${e[4]}</div></div><span style="color:var(--ink-300);white-space:nowrap;">${e[0]}</span></div>`).join('')}</div>`;
}

// ================================================================
// §confirmpay — 1 TRANG DỌC 6 SECTION (Motor + Health chung layout).
// Chỉ khác renderer dữ liệu; KHÔNG tạo layout riêng cho Health.
// ================================================================
// Số tiền cần thanh toán (dùng chung render + handler).
function cpAmount(){ return BANCA._payAmount(app); }
// Trạng thái thanh toán → chữ tiếng Việt (KHÔNG hiện enum tiếng Anh ngoài vùng kỹ thuật).
function cpStatusVN(s2){
 return ({METHOD_REQUIRED:'Chưa khởi tạo', PENDING:'Đang chờ thanh toán', PROCESSING:'Đang xử lý',
  SUCCESS:'Thành công', FAILED:'Thất bại', TIMEOUT:'Hết hạn', EXPIRED:'Hết hạn', CANCELLED:'Đã hủy'})[s2]||s2||'—';
}
// Cách thanh toán → nhãn tiếng Việt.
function cpMethodVN(pay){
 if(!pay) return '—';
 return (BANCA.PAYMENT_EXPERIENCES[pay.paymentExperience]||{}).label
   || (BANCA.PAYMENT_CHANNELS[pay.paymentChannel]||{}).label || pay.paymentChannel || '—';
}
function cpCard(num,title,inner,sub){
 return `<section class="card" style="padding:16px 18px;margin-bottom:14px;">
   <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
     <span style="width:22px;height:22px;border-radius:50%;background:var(--brand-600);color:#fff;font-size:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">${num}</span>
     <b style="font-size:15px;color:var(--ink-900);">${title}</b>${sub?`<span style="font-size:12px;color:var(--ink-500);">· ${sub}</span>`:''}
   </div>
   ${inner}
 </section>`;
}
// ---- Section 1: Trạng thái xử lý (process progress) ----
function cpProcessSection(){
 const s=caseView.states;
 const approved = ['APPROVED_STP','APPROVED'].includes(s.underwritingDecision) || s.underwritingDecision==='APPROVED_WITH_CONDITION';
 const confirmed = BANCA.confirmationComplete(app);
 const steps=['Chấp thuận','Xác nhận khách hàng','Chờ thanh toán','Đang xử lý','Thanh toán thành công','Phát hành hợp đồng'];
 let active;
 if(s.policyStatus==='ISSUED') active=6;
 else if(s.policyStatus==='ISSUING'||s.paymentStatus==='SUCCESS') active=5;
 else if(s.paymentStatus==='PROCESSING') active=3;
 else if(['PENDING','FAILED','EXPIRED'].includes(s.paymentStatus)) active=2;
 else if(approved && confirmed) active=2;
 else if(approved) active=1;
 else active=0;
 const nodes=steps.map(function(l,i){
  const state = i<active?'done':(i===active?'active':'todo');
  const bg = state==='done'?'var(--teal-600)':state==='active'?'var(--brand-600)':'var(--paper)';
  const fg = state==='todo'?'var(--ink-300)':'#fff';
  const ic = state==='done'?'✓':(i+1);
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:82px;text-align:center;">
    <span style="width:24px;height:24px;border-radius:50%;background:${bg};color:${fg};border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${ic}</span>
    <span style="font-size:10.5px;color:${state==='todo'?'var(--ink-300)':'var(--ink-700)'};font-weight:${state==='active'?'700':'500'};line-height:1.2;">${l}</span>
   </div>`;
 }).join('<div style="height:1px;background:var(--line);flex:0 0 12px;margin-top:12px;"></div>');
 // Thông báo phát hành (đúng trạng thái — KHÔNG banner sai).
 let issueNote='';
 if(s.paymentStatus==='SUCCESS' && s.policyStatus==='ISSUING') issueNote=`<div class="alert2 info" style="margin:12px 0 0;">Đã thanh toán — đang phát hành hợp đồng. Chờ Core trả kết quả.</div>`;
 else if(s.policyStatus==='ISSUED' && app.policyId) issueNote=`<div class="alert2" style="margin:12px 0 0;background:var(--teal-100);color:var(--teal-600);">✓ Hợp đồng đã phát hành · Số HĐ <b>${app.policyId}</b> — <a href="?id=${app.id}&tab=policy" style="color:var(--teal-600);text-decoration:underline;">xem hợp đồng</a>.</div>`;
 else if(s.policyStatus==='ISSUE_FAILED') issueNote=`<div class="alert2 danger" style="margin:12px 0 0;">Đã thanh toán nhưng phát hành lỗi — không thu lại tiền. <a href="?id=${app.id}&tab=policy" style="color:var(--red-600);text-decoration:underline;">Xử lý phát hành</a>.</div>`;
 return cpCard(1,'Trạng thái xử lý', `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:2px;flex-wrap:nowrap;overflow-x:auto;">${nodes}</div>${issueNote}`, caseView.displayStatus);
}
// ---- Section 2: Xác nhận khách hàng ----
function cpConfirmSection(){
 const isMemberHealth = app.productId==='health' && Array.isArray(app.insuredMembers) && app.insuredMembers.some(function(m){return m.confirmation||m.underwriting;});
 let inner;
 if(isMemberHealth){
  const units = BANCA.healthUnitsOf(app).filter(function(u){return u.active!==false;});
  const cards = units.map(function(u){
   const cf=u.confirmation||{status:'PENDING'};
   const badge = cf.status==='CONFIRMED'?'<span class="badge badge-ready">Đã xác nhận</span>':cf.status==='SENT'?'<span class="badge badge-pending">Đã gửi — chờ khách</span>':'<span class="badge badge-conditional">Chưa gửi</span>';
   const who = u.isChild ? `Người đại diện: <b>${u.guardianName||'(chưa nhập)'}</b> (${u.guardianRelationship||'cha/mẹ'}) · ${u.guardianPhone||'—'}` : `SĐT thành viên: <b>${u.phone||(cust&&u.relationship==='Bản thân'?BANCA.maskPhone(cust.phone):'—')}</b>`;
   return `<div class="card" style="padding:14px;margin-bottom:10px;border-left:3px solid ${cf.status==='CONFIRMED'?'var(--teal-600)':'var(--brand-600)'};">
     <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><b>${u.name||'—'} <span class="chip" style="font-size:9px;">${u.insuredUnitId}</span>${u.isChild?' · trẻ em':''}</b>${badge}</div>
     <div style="font-size:12px;color:var(--ink-500);margin-top:5px;">Gói: ${healthPkgName(u.package)} · vai trò: ${u.relationship||'—'}</div>
     <div style="font-size:12px;color:var(--ink-500);margin-top:3px;">${who}</div>
     ${cf.status==='SENT'?`<div style="font-size:11.5px;color:var(--ink-300);margin-top:3px;">Gửi lúc ${cf.sentAt||'—'} · OTP ${cf.otp||'PENDING'} · <a href="javascript:alert('Xem evidence phiên xác nhận (demo)')" style="color:var(--brand-600);">Xem evidence</a></div>`:''}
     ${app.owner===me?`<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">${cf.status==='PENDING'?`<button class="btn btn-primary btn-sm" onclick="healthMemberConfirm('${app.id}','${u.insuredUnitId}','send')">Gửi xác nhận</button>`:''}${cf.status==='SENT'?`<button class="btn btn-secondary btn-sm" onclick="healthMemberConfirm('${app.id}','${u.insuredUnitId}','send')">Gửi lại</button><button class="btn btn-primary btn-sm" onclick="healthMemberConfirm('${app.id}','${u.insuredUnitId}','verify')">✓ Khách đã xác nhận (demo)</button>`:''}</div>`:''}
    </div>`;
  }).join('');
  const allConfirmed = units.every(function(u){return (u.confirmation||{}).status==='CONFIRMED';});
  inner = `<div class="alert2 info" style="margin:0 0 12px;">Xác nhận theo từng người được bảo hiểm. Người ≥18 tự xác nhận bằng SĐT + OTP riêng; trẻ &lt;18 do người đại diện xác nhận — mỗi người 1 phiên/evidence riêng (KHÔNG dùng 1 OTP chung).</div>
    ${app.owner===me&&!allConfirmed?`<div style="margin-bottom:12px;"><button class="btn btn-secondary btn-sm" onclick="healthMemberConfirmAll('${app.id}')">Gửi xác nhận hàng loạt (mỗi người 1 phiên)</button></div>`:''}
    ${cards}
    ${allConfirmed?'<div class="alert2" style="margin-top:8px;background:var(--teal-100);color:var(--teal-600);">✓ Tất cả thành viên đã xác nhận — đủ điều kiện thanh toán tổng.</div>':'<div class="alert2 warn" style="margin-top:8px;">Còn thành viên chưa xác nhận — chưa thể khởi tạo thanh toán.</div>'}`;
 } else {
  const needConfirm = (app.uw&&['APPROVED_WITH_LOADING','APPROVED_WITH_EXCLUSION','APPROVED_WITH_CONDITION'].includes(app.uw.decision))||['PENDING_CUSTOMER_CONFIRM','UW_DECIDED'].includes(st);
  let cState;
  if(app.confirm && ['PAYMENT_METHOD_REQUIRED','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st)) cState='CONFIRMED';
  else if(app.confirm) cState='SENT';
  else if(needConfirm) cState='PENDING';
  else if(['PENDING_RECEIPT','PENDING_UW','IN_UW','NEED_MORE_INFO'].includes(st)) cState='NOT_READY';
  else cState='NOT_APPLICABLE';
  const cLabel={CONFIRMED:['Đã xác nhận','ok'],SENT:['Đã gửi — chờ khách xác nhận','wait'],PENDING:['Cần gửi yêu cầu xác nhận','info'],NOT_READY:['Chưa thể gửi xác nhận','wait'],NOT_APPLICABLE:['Không yêu cầu xác nhận riêng','ok']}[cState];
  let cfBody;
  if(cState==='NOT_APPLICABLE') cfBody=`<div class="alert2 info" style="margin:0;">Yêu cầu đã được xác nhận khi nộp — không cần bước xác nhận riêng trước khi thanh toán.</div>`;
  else if(cState==='NOT_READY') cfBody=`<div class="alert2 info" style="margin:0;">Yêu cầu đang chờ kết quả thẩm định — chưa thể gửi xác nhận.</div>`;
  else if(cState==='PENDING') cfBody=`<div class="card" style="padding:16px;"><div style="font-size:13px;color:var(--ink-700);">Kết quả thẩm định có điều chỉnh (phụ phí/điều kiện) — khách cần xác nhận trước khi thanh toán.</div>${app.owner===me?'<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="sendConfirm()">Gửi khách xác nhận</button>':''}</div>`;
  else cfBody=`<div class="card" style="padding:16px;"><table class="dtable"><tbody>
    ${row('Người xác nhận', (cust?cust.name:'—'))}
    ${row('Vai trò','Bên mua bảo hiểm')}
    ${row('Số điện thoại', cust?BANCA.maskPhone(cust.phone):'—')}
    ${row('Nội dung', app.uw&&app.uw.decision!=='APPROVED'?'Xác nhận lại điều kiện/phí điều chỉnh':'Xác nhận thông tin yêu cầu')}
    ${row('Kênh gửi', BANCA.label('delivery',app.confirm.delivery)||'SMS + Email')}
    ${row('Gửi lúc',app.confirm.sentAt)} ${row('Hết hạn',app.confirm.expiry||'—')}
    ${row('Trạng thái', cState==='CONFIRMED'?'<span class="badge badge-ready">Đã xác nhận</span>':'<span class="badge badge-pending">Chờ khách xác nhận</span>')}
    ${row('Xác nhận lúc', cState==='CONFIRMED'?(app.confirm.confirmedAt||app.updatedAt):'—')}
   </tbody></table>
   ${app.confirm.link?`<div style="font-size:11.5px;margin-top:8px;"><a href="javascript:alert('Xem evidence xác nhận (demo)')" style="color:var(--brand-600);">Xem evidence</a></div>`:''}
   ${app.owner===me&&cState==='SENT'?'<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;"><button class="btn btn-secondary btn-sm" onclick="alert(\'Đã gửi lại link (demo)\')">Gửi lại</button> <button class="btn btn-primary btn-sm" onclick="simConfirm()">✓ Khách đã xác nhận (demo)</button></div>':''}
  </div>`;
  inner = statusBanner(cLabel[1], cLabel[0], '', '') + cfBody;
 }
 return cpCard(2,'Xác nhận khách hàng', inner);
}
// ---- Section 3: Phí cần thanh toán (breakdown khớp tổng phí) ----
function cpFeeSection(){
 const total = cpAmount();
 const pay = app.payment;
 const paid = (pay && pay.status==='SUCCESS') ? (pay.amount||total) : 0;
 const remaining = Math.max(0, total - paid);
 let lines=[], memberHtml='';
 if(app.productId==='health'){
  const q=app.quote||{}; const b=q.premiumBreakdown||{};
  if(b.totalPremium){
   if(b.basePremium) lines.push(['Phí cơ bản (các thành viên)', b.basePremium, '+']);
   if(b.addOnPremium) lines.push(['Quyền lợi bổ sung', b.addOnPremium, '+']);
   if(b.loading) lines.push(['Phụ phí thẩm định', b.loading, '+']);
   if(b.discount) lines.push(['Giảm phí gia đình', b.discount, '−']);
   if(b.tax) lines.push(['Thuế (VAT)', b.tax, '+']);
   if(b.fee) lines.push(['Phí khác', b.fee, '+']);
  } else lines.push(['Phí bảo hiểm sức khỏe', total, '+']);
  try{
   const fr=BANCA.healthFamilyRating(app);
   if(fr && fr.lines && fr.lines.length){
    memberHtml = `<div style="margin-top:12px;"><div class="label" style="margin-bottom:4px;">Phí theo thành viên (tham khảo)</div>`+fr.lines.map(function(l){return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${l.name||'—'} · ${healthPkgName(l.package)}</span><b>${l.eligible?BANCA.vnd(l.premium):'—'}</b></div>`;}).join('')+`</div>`;
   }
  }catch(e){}
 } else {
  if(app.uw && app.uw.newPremium){
   lines.push(['Phí bảo hiểm gốc', app.premium||0, '+']);
   const adj=(app.uw.newPremium)-(app.premium||0);
   if(adj) lines.push(['Điều chỉnh sau thẩm định', Math.abs(adj), adj<0?'−':'+']);
  } else if(app.quote && app.quote.subtotal!=null){
   const q=app.quote;
   if(q.tplPremium) lines.push(['TNDS bắt buộc', q.tplPremium, '+']);
   if(q.odBase) lines.push(['Phí vật chất xe', q.odBase, '+']);
   (q.lines||[]).forEach(function(l){ lines.push([l.label, Math.abs(l.amount), l.amount<0?'−':'+']); });
   if(q.ncdAmount) lines.push(['Giảm phí không tổn thất (NCD)', q.ncdAmount, '−']);
   if(q.vatAmount) lines.push(['Thuế (VAT)', q.vatAmount, '+']);
  } else lines.push(['Phí bảo hiểm', total, '+']);
 }
 // Reconcile — bảo đảm tổng breakdown KHỚP tổng phí (AC09).
 const sum = lines.reduce(function(a,l){ return a + (l[2]==='−'? -l[1] : l[1]); }, 0);
 if(sum!==total){ const dlt=total-sum; lines.push(['Điều chỉnh', Math.abs(dlt), dlt<0?'−':'+']); }
 const lineHtml = lines.map(function(l){return `<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;${l[2]==='−'?'color:var(--teal-600);':''}"><span>${l[2]==='−'?'− ':'+ '}${l[0]}</span><span>${BANCA.vnd(l[1])}</span></div>`;}).join('');
 const chip=(k,v,c)=>`<div style="border:1px solid var(--line);border-radius:9px;padding:10px;"><div style="font-size:10.5px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:16px;font-weight:800;margin-top:3px;color:${c||'var(--ink-900)'};">${v}</div></div>`;
 const inner=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
    ${chip('Tổng phí',BANCA.vnd(total),'var(--brand-600)')}
    ${chip('Đã thanh toán',BANCA.vnd(paid),paid>0?'var(--teal-600)':'var(--ink-900)')}
    ${chip('Còn phải thanh toán',BANCA.vnd(remaining),remaining>0?'var(--amber-600)':'var(--teal-600)')}
   </div>
   <div style="border:1px solid var(--line);border-radius:9px;padding:12px;margin-top:12px;">
    <div class="label" style="margin-bottom:6px;">Chi tiết phí (breakdown)</div>
    ${lineHtml}
    <div style="display:flex;justify-content:space-between;font-size:13.5px;font-weight:800;border-top:1px solid var(--line);margin-top:6px;padding-top:6px;"><span>Tổng phí</span><span>${BANCA.vnd(total)}</span></div>
    ${memberHtml}
   </div>`;
 return cpCard(3,'Phí cần thanh toán', inner);
}
// ---- Section 4: Ba cách thanh toán (hiển thị trực tiếp) ----
function cpMethodsSection(){
 const cv=caseView; const s=cv.states; const pay=app.payment;
 const payDone = pay && pay.status==='SUCCESS';
 const payActive = pay && ['PENDING','PROCESSING'].includes(pay.status);
 let inner;
 if(payDone) inner=`<div class="alert2" style="margin:0;background:var(--teal-100);color:var(--teal-600);">✓ Đã thanh toán thành công — xem chi tiết ở mục "Trạng thái thanh toán".</div>`;
 else if(payActive) inner=`<div class="alert2 info" style="margin:0;">Đã khởi tạo yêu cầu thanh toán — theo dõi ở mục "Trạng thái thanh toán".</div>`;
 else if(s.policyStatus==='ISSUED') inner=`<div class="alert2 info" style="margin:0;">Yêu cầu đã hoàn tất thanh toán và phát hành.</div>`;
 else {
  const enabled = cv.canInitiatePayment && app.owner===me;
  let reason='';
  if(app.owner!==me) reason='Chỉ nhân viên phụ trách được khởi tạo thanh toán.';
  else if(!cv.canInitiatePayment){
   if(!BANCA.confirmationComplete(app)){
    if(app.productId==='health' && Array.isArray(app.insuredMembers)){
     const miss=app.insuredMembers.filter(function(m){return m.active!==false && (m.confirmation||{}).status!=='CONFIRMED';}).map(function(m){return m.name||'—';});
     reason='Chưa thể thanh toán: còn '+miss.length+' thành viên chưa xác nhận'+(miss.length?' ('+miss.join(', ')+')':'')+'.';
    } else reason='Chưa thể thanh toán: khách chưa xác nhận.';
   } else reason = cv.nextActionLabel || 'Chưa đủ điều kiện khởi tạo thanh toán.';
  }
  const mcard=(exp,icon,title,desc,best)=>{
   const style = enabled ? 'cursor:pointer;background:#fff;border:1px solid var(--line);' : 'background:var(--paper);border:1px dashed var(--line);opacity:.6;';
   const btn = enabled ? `<button class="btn btn-primary btn-sm" style="margin-top:4px;" onclick="openPayFlow('${exp}')">Bắt đầu</button>` : `<button class="btn btn-primary btn-sm" style="margin-top:4px;" disabled>Chưa khả dụng</button>`;
   return `<div style="border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px;min-height:158px;${style}">
     <div style="font-size:22px;">${icon}</div><b style="font-size:13.5px;">${title}</b>
     <div style="font-size:11.5px;color:var(--ink-500);line-height:1.4;flex:1;">${desc}</div>
     <div style="font-size:11px;color:var(--ink-300);">Phù hợp: ${best}</div>${btn}
    </div>`;
  };
  inner=`${reason?`<div class="alert2 warn" style="margin:0 0 12px;">${reason}</div>`:''}
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
    ${mcard('CUSTOMER_PRESENT_QR','▦','Quét QR tại quầy','Hiển thị mã QR, số tiền, mã tham chiếu, hạn thanh toán.','Khách đang có mặt tại quầy')}
    ${mcard('CUSTOMER_REMOTE','✉','Gửi yêu cầu thanh toán từ xa','Gửi liên kết thanh toán qua SMS/Email hoặc sao chép liên kết sau khi khách đồng ý.','Khách không có mặt / thanh toán sau')}
    ${mcard('SELLER_DEVICE_ASSISTED','⌁','Thanh toán trên thiết bị này','Khách tự nhập dữ liệu nhạy cảm và OTP trên cổng thanh toán.','Khách có mặt nhưng không quét QR')}
   </div>
   <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Chưa tạo yêu cầu thanh toán cho tới khi nhân viên tư vấn xác nhận cấu hình trong từng cách.</div>`;
 }
 return cpCard(4,'Cách thanh toán', inner);
}
// ---- Section 5: Trạng thái thanh toán hiện tại ----
function cpCurrentSection(){
 const pay=app.payment;
 if(!pay) return cpCard(5,'Trạng thái thanh toán', `<div class="alert2 info" style="margin:0;">Chưa khởi tạo thanh toán.</div>`);
 const s2=pay.status;
 const tone={SUCCESS:'ok',PENDING:'wait',PROCESSING:'wait',FAILED:'danger',TIMEOUT:'danger',EXPIRED:'danger',CANCELLED:'danger'}[s2]||'wait';
 const toneColor={ok:'var(--teal-600)',wait:'var(--amber-600)',danger:'var(--red-600)'}[tone];
 const facts=[['Số tiền',BANCA.vnd(pay.amount)],['Cách thanh toán',cpMethodVN(pay)],['Người thanh toán',(pay.payerName||(cust&&cust.name)||'—')+(pay.payerType==='CUSTOMER'?' · Khách hàng':'')],['Thời gian', pay.paidAt||pay.createdAt||'—']];
 if(s2==='PENDING'&&pay.expiresAt) facts.push(['Hết hạn',pay.expiresAt]);
 const factHtml=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">${facts.map(function(f){return `<div style="border:1px solid var(--line);border-radius:9px;padding:9px;"><div style="font-size:10.5px;color:var(--ink-300);text-transform:uppercase;">${f[0]}</div><div style="font-size:13px;font-weight:700;margin-top:2px;">${f[1]}</div></div>`;}).join('')}</div>`;
 // QR / link preview khi đang chờ
 let preview='';
 if(s2==='PENDING'&&pay.paymentChannel==='QR') preview=`<div style="margin-top:12px;border:1px dashed var(--line);border-radius:9px;padding:12px;text-align:center;"><div style="font-size:12px;color:var(--ink-500);margin-bottom:6px;">Khách quét mã QR để thanh toán</div><div style="width:120px;height:120px;margin:0 auto;background:repeating-linear-gradient(45deg,#111,#111 6px,#fff 6px,#fff 12px);border-radius:6px;"></div><div style="font-size:10.5px;color:var(--ink-300);margin-top:6px;">Hết hạn ${pay.expiresAt||'—'}</div></div>`;
 else if(s2==='PENDING'&&pay.paymentChannel==='PAYMENT_LINK') preview=`<div style="margin-top:12px;border:1px dashed var(--line);border-radius:9px;padding:12px;"><div style="font-size:12.5px;">Liên kết đã gửi: <a href="${pay.paymentUrl}" style="color:var(--brand-600);">${pay.paymentUrl}</a></div><div style="font-size:11.5px;color:var(--ink-500);margin-top:4px;">Người nhận: ${pay.recipientPhone||pay.recipientEmail||'—'} · Đã gửi · Hết hạn ${pay.expiresAt||'—'}</div></div>`;
 // Vùng kỹ thuật thu gọn (English tokens ở đây, KHÔNG ngoài).
 const rowT=(k,v)=>`<tr><td style="color:var(--ink-500);width:180px;font-size:12px;">${k}</td><td style="font-size:12.5px;"><span class="code">${v}</span></td></tr>`;
 const tech=`<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:12px;color:var(--ink-500);">Chi tiết kỹ thuật</summary><table class="dtable"><tbody>
   ${rowT('Payment ID',pay.paymentId||'—')}${rowT('Experience',pay.paymentExperience||'—')}${rowT('Payment instrument',pay.paymentInstrument||'—')}${rowT('Delivery channel',pay.deliveryChannel||'NONE')}${rowT('Merchant reference',pay.merchantReference||'—')}${rowT('Gateway reference',pay.gatewayReference||'—')}${rowT('Gateway transaction ID',pay.gatewayTransactionId||'—')}${rowT('Status',pay.status)}
  </tbody></table></details>`;
 // Demo tools — chỉ callback gateway đổi SUCCESS; nhân viên tư vấn KHÔNG tự mark success.
 let tools='';
 if(s2==='PENDING'&&app.owner===me) tools=`<div style="margin-top:14px;border-top:1px dashed var(--line);padding-top:12px;">
    <div class="label" style="margin-bottom:6px;">Demo Tools — không thuộc UI production</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
     <button class="btn btn-primary btn-sm" onclick="settlePayment('SUCCESS')">Mô phỏng callback: Thành công</button>
     <button class="btn btn-secondary btn-sm" onclick="settlePayment('FAILED')">Callback: Thất bại</button>
     <button class="btn btn-secondary btn-sm" onclick="settlePayment('EXPIRED')">Callback: Hết hạn</button>
    </div>
    <div style="font-size:10.5px;color:var(--ink-300);margin-top:6px;">Nhân viên tư vấn KHÔNG tự đánh dấu đã thanh toán — kết quả chỉ đến từ callback cổng thanh toán.</div>
   </div>`;
 else if(['FAILED','EXPIRED','TIMEOUT'].includes(s2)&&app.owner===me) tools=`<div style="margin-top:12px;"><button class="btn btn-primary btn-sm" onclick="recreatePaymentIntent()">Tạo lại yêu cầu thanh toán</button></div>`;
 const inner=`<div class="card" style="padding:14px;border-left:4px solid ${toneColor};">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><b style="font-size:14px;color:${toneColor};">${cpStatusVN(s2)}</b>${BANCA.paymentBadge?BANCA.paymentBadge(s2):''}</div>
    ${factHtml}${preview}${tech}${tools}
   </div>`;
 return cpCard(5,'Trạng thái thanh toán', inner);
}
// ---- Section 6: Lịch sử thanh toán (row → chi tiết, KHÔNG lặp key-value dưới bảng) ----
function cpHistorySection(){
 const pay=app.payment;
 const txns=[];
 if(pay) txns.push(pay);
 let inner;
 if(!txns.length) inner=`<div class="empty-state" style="padding:18px;">Chưa có giao dịch thanh toán.</div>`;
 else {
  const rows=txns.map(function(t){
   const id=t.gatewayTransactionId||t.gatewayReference||t.merchantReference||t.paymentId||'—';
   const ref=t.merchantReference||t.gatewayReference||'—';
   return `<tr style="cursor:pointer;" onclick="openTxnDetail()"><td style="font-size:12px;">${id}</td><td style="font-size:12.5px;">${cpMethodVN(t)}</td><td style="font-size:12.5px;">${(t.payerName||(cust&&cust.name)||'—')}</td><td style="font-size:12px;color:var(--ink-500);">${t.paidAt||t.createdAt||'—'}</td><td style="font-size:12.5px;">${BANCA.vnd(t.amount)}</td><td>${BANCA.paymentBadge?BANCA.paymentBadge(t.status):cpStatusVN(t.status)}</td><td style="font-size:11.5px;color:var(--ink-500);">${ref}</td></tr>`;
  }).join('');
  inner=`<div class="card" style="padding:0;overflow:hidden;"><table class="dtable"><thead><tr><th>Mã giao dịch</th><th>Cách thanh toán</th><th>Người thanh toán</th><th>Thời gian</th><th>Số tiền</th><th>Trạng thái</th><th>Tham chiếu</th></tr></thead><tbody>${rows}</tbody></table></div><div style="font-size:11px;color:var(--ink-300);margin-top:6px;">Bấm vào dòng giao dịch để xem chi tiết.</div>`;
 }
 return cpCard(6,'Lịch sử thanh toán', inner);
}
function renderConfirmPay(){
 return cpProcessSection()+cpConfirmSection()+cpFeeSection()+cpMethodsSection()+cpCurrentSection()+cpHistorySection();
}

// ---- Customer reconfirmation rule (rule-based, không cho nhân viên tư vấn chọn) ----
function getCustomerReconfirmationRequirement(changeCodes){
 const RISK=['policyholder','insured','risk','declaration','package','coverage','premium','deductible','effectiveDate','loading','exclusion','consent'];
 const requiresReconfirm = (changeCodes||[]).some(c=>RISK.includes(c));
 const requiresRerate = (changeCodes||[]).some(c=>['risk','package','coverage','deductible','value'].includes(c));
 return {requires_customer_reconfirmation:requiresReconfirm, requires_rerate:requiresRerate, requires_underwriting_resubmission:requiresReconfirm};
}

// ---- Supplement Workspace (3 phần) ----
function supplementWorkspace(){
 const s=app.supplement||{items:[],requestedBy:'Thẩm định viên',requestedAt:app.updatedAt};
 // Type hóa từng yêu cầu
 const reqs=(s.items||[]).map((txt,i)=>{
  const isDoc=/ảnh|đăng ký|tài liệu|chứng từ|hình/i.test(txt);
  return {id:'SUP-'+String(i+1).padStart(2,'0'), type:isDoc?'DOCUMENT':'FIELD', text:txt,
   changeCode:isDoc?'document':(/số máy|vin|biển/i.test(txt)?'technical':'field'),
   deadline:app.deadline, priority:i===0?'Cao':'Trung bình', status:'Chưa bổ sung'};
 });
 const owner=app.owner===me;
 // Phần 1 — Yêu cầu từ đơn vị xử lý
 const part1=`<div class="card" style="padding:16px;border-left:4px solid var(--red-600);margin-bottom:12px;">
   <div style="font-weight:700;margin-bottom:2px;">Yêu cầu từ đơn vị xử lý</div>
   <div style="font-size:12.5px;color:var(--ink-500);margin-bottom:10px;">Yêu cầu bởi <b>${s.requestedBy||'Thẩm định viên'}</b> · ${s.requestedAt||'—'}${app.deadline?' · hạn '+app.deadline:''}</div>
   ${reqs.map(rq=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);flex-wrap:wrap;">
     <div style="font-size:13px;"><b>${rq.id}</b> · ${rq.type==='DOCUMENT'?'Tài liệu':rq.type==='CONFIRMATION'?'Xác nhận KH':'Thông tin'} <span class="badge badge-conditional" style="font-size:9px;">${rq.priority}</span><div style="color:var(--ink-500);margin-top:2px;">${rq.text}</div></div>
     <div><span class="badge badge-blocked">${rq.status}</span></div>
   </div>`).join('')}
 </div>`;
 // Phần 2 — Nội dung cần bổ sung (chỉ mục được yêu cầu editable)
 const part2Items=reqs.map(rq=>{
  if(rq.type==='DOCUMENT'){
   return `<div style="padding:4px 0;">${BANCA.docItemHtml(app.id,{code:'SUP_'+rq.id, name:rq.text, sub:'Tài liệu được yêu cầu bổ sung', ocr:'optional', required:true, docType:null})}</div>`;
  }
  return `<div class="field" style="margin-bottom:10px;"><label style="font-size:12px;color:var(--ink-500);">${rq.text} ${owner?'':'<span class="chip">chỉ xem</span>'}</label><input id="sup-${rq.id}" ${owner?'':'readonly'} placeholder="Nhập giá trị bổ sung…" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:7px;"></div>`;
 }).join('');
 const part2=`<div class="card" style="padding:16px;margin-bottom:12px;">
   <div class="label" style="margin-bottom:8px;">Nội dung cần bổ sung</div>
   <div style="font-size:11.5px;color:var(--ink-300);margin-bottom:10px;">Chỉ các mục được yêu cầu mở để chỉnh sửa — phần còn lại của yêu cầu ở chế độ chỉ xem.</div>
   ${part2Items}
 </div>`;
 // Phần 3 — Xem lại thay đổi (before/after demo)
 const changeCodes=reqs.map(r=>r.changeCode);
 const rc=getCustomerReconfirmationRequirement(changeCodes);
 const beforeAfter=reqs.map(rq=>`<tr><td style="color:var(--ink-500);">${rq.text}</td><td>${rq.type==='DOCUMENT'?'Thiếu':'—'}</td><td><span style="color:var(--teal-600);">Sẽ cập nhật khi bổ sung</span></td></tr>`).join('');
 const part3=`<div class="card" style="padding:16px;margin-bottom:12px;">
   <div class="label" style="margin-bottom:8px;">Xem lại thay đổi (trước / sau)</div>
   <table class="dtable"><thead><tr><th>Trường / tài liệu</th><th>Bản đã nộp</th><th>Sau bổ sung</th></tr></thead><tbody>${beforeAfter}</tbody></table>
   <div style="margin-top:10px;font-size:12.5px;">${rc.requires_customer_reconfirmation
     ? '<span class="badge badge-conditional">Cần khách xác nhận lại</span> Thay đổi ảnh hưởng nội dung/phí — sẽ yêu cầu khách xác nhận lại trước khi tiếp tục.'
     : '<span class="badge badge-ready">Không cần khách xác nhận lại</span> Bổ sung mang tính kỹ thuật/tài liệu — không ảnh hưởng nội dung khai báo.'}
     ${rc.requires_rerate?' <span class="badge badge-blocked">Cần tính lại phí</span>':''}</div>
 </div>`;
 const actions=owner?`<div style="display:flex;gap:8px;flex-wrap:wrap;">
   <button class="btn btn-secondary" onclick="alert('Đã lưu nháp bổ sung (demo)')">Lưu nháp</button>
   <button class="btn btn-secondary" onclick="alert('Xem lại thay đổi (demo)')">Xem lại thay đổi</button>
   <button class="btn btn-primary" onclick="alert('Đã gửi bổ sung (demo). Tạo version mới, giữ nguyên bản đã nộp cũ${rc.requires_customer_reconfirmation?'; đánh dấu cần khách xác nhận lại':''}.')">Gửi bổ sung</button>
 </div>`:'<div class="chip">Chỉ xem (manager)</div>';
 return part1+part2+part3+actions;
}

let body='';
if(activeTab==='overview'){
 const naO=caseNextAction();
 const c5=(title,inner,accent)=>`<section class="card" style="padding:16px;${accent?'border-left:4px solid '+accent+';':''}"><div class="label" style="margin-bottom:10px;">${title}</div>${inner}</section>`;
 const kvO=(k,v)=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed var(--line);font-size:13px;"><span style="color:var(--ink-500);">${k}</span><span style="text-align:right;font-weight:600;">${v}</span></div>`;
 const uwOrg = app.productId==='health' ? 'ABC Insurance — Health Thẩm định' : ((app.uw&&app.uw.officer)? 'ABC Insurance — Motor UW' : 'ABC Insurance — Motor Thẩm định');
 const card1=c5('Trạng thái xử lý', kvO('Trạng thái',BANCA.caseStatusBadge(app))+kvO('Việc cần làm','<b>'+naO[0]+'</b>')+(app.sla?kvO('SLA / deadline',slaHtml(app.sla)):'')+kvO('Người phụ trách yêu cầu hiện tại',['NEED_MORE_INFORMATION'].includes(casePh)?'Nhân viên tư vấn':'Đơn vị bảo hiểm')+kvO('Đơn vị xử lý',uwOrg)+kvO('Cập nhật gần nhất',app.updatedAt||'—'), {danger:'var(--red-600)',ok:'var(--teal-600)',info:'var(--brand-600)',wait:'var(--amber-600)'}[naO[1]]);
 const card2=`<section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Tiến trình</div>${timeline()}</section>`;
 const healthOvPkg=healthPkg(app.package);
 const card3=app.productId==='health'
  ? c5('Tóm tắt bảo hiểm', kvO('Gói',healthOvPkg.name||app.package||'—')+kvO('Giới hạn/năm',healthOvPkg.annualLimit?BANCA.vnd(healthOvPkg.annualLimit):'—')+kvO('Nội trú',healthOvPkg.inpatientLimit?BANCA.vnd(healthOvPkg.inpatientLimit):'—')+kvO('Ngoại trú',healthOvPkg.outpatientLimit?BANCA.vnd(healthOvPkg.outpatientLimit):'Không bao gồm')+kvO('Đồng chi trả',healthOvPkg.copayPercent!=null?healthOvPkg.copayPercent+'%':'—')+kvO('Tổng phí',BANCA.vnd(app.uw&&app.uw.newPremium||app.premium))+kvO('Thời hạn','12 tháng'))
  : c5('Tóm tắt bảo hiểm', kvO('Số tiền bảo hiểm (SI/IDV)','<b>'+BANCA.vnd(idvTrack)+'</b>')+kvO('Mức khấu trừ',dedTrack?BANCA.vnd(dedTrack)+'/vụ':'—')+kvO('Tổng phí',BANCA.vnd(app.uw&&app.uw.newPremium||app.premium))+kvO('Quyền lợi bổ sung',addOnsTrack.length?addOnsTrack.join(', '):'Không')+kvO('Thời hạn','12 tháng')+kvO('Ngày hiệu lực dự kiến',(app.policyId&&BANCA.policyById(app.policyId)||{}).effectiveFrom||'Sau phát hành'));
 const card4=app.productId==='health'
  ? c5('Người được bảo hiểm ('+BANCA.healthUnitsOf(app).filter(function(u){return u.active!==false;}).length+' người)', BANCA.healthUnitsOf(app).filter(function(u){return u.active!==false;}).map(function(u){const uw=u.underwriting?(' · '+((BANCA.HEALTH_UW_MEMBER[u.underwriting.decision]||{}).label||u.underwriting.decision)):'';return kvO(u.name||'—',(u.relationship||'—')+' · '+(u.age!=null?u.age+' tuổi':'chưa có DOB')+' · '+healthPkgName(u.package)+uw);}).join(''))
  : c5('Đối tượng bảo hiểm', app.vehicle?(kvO('Biển số',app.vehicle.plate||'—')+kvO('Hãng / dòng',app.vehicle.brand+' '+app.vehicle.model)+kvO('Năm sản xuất',app.vehicle.year||'—')+kvO('Số khung (VIN)',app.vehicle.vin||'—')+kvO('Số máy',app.vehicle.engineNo||'—')+kvO('Giá trị xe',BANCA.vnd(app.vehicle.value||idvTrack))+kvO('Tình trạng thế chấp',mgTrack.mortgaged?'Có':'Không')+kvO('Bên thụ hưởng',mgTrack.mortgaged?(mgTrack.bank||'—'):'Chủ xe')):'<div style="font-size:12.5px;color:var(--ink-500);">—</div>');
 const _pa = BANCA.participantsOf ? BANCA.participantsOf(app.id, app.owner) : {referrer:app.owner,advisor:app.owner,sellingProducer:app.owner,caseOwner:app.owner};
 const _pRow = (label,uid)=> kvO(label, uid?`${BANCA.pName(uid)} <span style="font-size:11px;color:var(--ink-300);">${BANCA.pLine(uid)}</span>`:'—');
 const card5=c5('Nguồn bán & người tham gia',
   _pRow('Người giới thiệu', _pa.referrer)+_pRow('Người tư vấn', _pa.advisor)+_pRow('Nhân viên phụ trách', _pa.sellingProducer)+_pRow('Người phụ trách hiện tại', _pa.caseOwner||app.owner)
   +kvO('Partner / Chi nhánh · Team', 'Janus Bank · '+(_pa.branch||(cust&&cust.branch)||'HCM01')+(_pa.team?' · '+_pa.team:''))
   +kvO('Source system',srcLabelOverview())+kvO('External referral',_pa.leadRef||app.leadId||'—')+kvO('Campaign',_pa.campaign||app.campaign||'—')
   +(_pa._fallback?'<div style="font-size:11px;color:var(--ink-300);grid-column:1/-1;">Chưa có snapshot participant — hiển thị theo người phụ trách.</div>':''));
 // Epic 5: Business vs Integration status
 const intg=BANCA.integrationStatus(app);
 const intDot=t=>({ok:'var(--teal-600)',wait:'var(--amber-600)',idle:'var(--ink-300)',bad:'var(--red-600)'}[t]||'var(--ink-300)');
 const cardStatus=`<section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Trạng thái nghiệp vụ & tích hợp</div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
     <div><div style="font-size:12px;color:var(--ink-500);margin-bottom:6px;">Nghiệp vụ</div>${['Thẩm định','Chờ khách','Thanh toán','Phát hành'].map((b,i)=>{const done=[['UW_DECIDED','PENDING_CUSTOMER_CONFIRM','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'],['PAYMENT_METHOD_REQUIRED','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'],['PAID','PENDING_ISSUE','ISSUED'],['ISSUED']][i].includes(st);return `<div style="font-size:12.5px;padding:3px 0;">${done?'✓':'○'} ${b}</div>`;}).join('')}</div>
     <div><div style="font-size:12px;color:var(--ink-500);margin-bottom:6px;">Tích hợp hệ thống</div>${intg.map(([k,v,t])=>`<div style="font-size:12.5px;padding:3px 0;display:flex;justify-content:space-between;"><span>${k}</span><span style="color:${intDot(t)};font-weight:600;">${v}</span></div>`).join('')}</div>
   </div></section>`;
 // Epic 9: Sức khỏe yêu cầu widget
 const h=BANCA.caseHealth(app);
 const hColor={ok:'var(--teal-600)',warn:'var(--amber-600)',bad:'var(--red-600)'}[h.overall];
 const cardHealth=`<section class="card" style="padding:16px;border-top:4px solid ${hColor};"><div class="label" style="margin-bottom:8px;">Sức khỏe yêu cầu <span style="color:${hColor};font-weight:800;">${h.overall==='ok'?'Tốt':h.overall==='warn'?'Cần chú ý':'Có vấn đề'}</span></div>${h.items.map(([k,v,t])=>`<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${k}</span><span style="color:${intDot(t)};font-weight:600;">${v}</span></div>`).join('')}</section>`;
 body=`<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start;">
  <div style="display:grid;gap:14px;">${card1}${cardStatus}${card3}${card4}${card5}</div>
  <aside style="position:sticky;top:76px;display:grid;gap:14px;">${cardHealth}${card2}</aside>
 </div>`;
} else if(activeTab==='supplement'){
 body=supplementWorkspace();
} else if(activeTab==='customer'){
 const insuredCustomerText = app.productId==='health' ? healthMembersOf(app).map(function(m){return (m.name||'—')+' · '+(m.relationship||'—');}).join('<br>') : (app.productId==='pa' ? (app.insuredName||cust&&cust.name||'—') : 'Chính chủ (Motor cá nhân)');
 body=`<div class="card" style="padding:16px;"><table class="dtable"><tbody>${cust?[row('Họ tên',cust.name),row('CIF',cust.cif||'— (prospect)'),row('CCCD/MST',idCell(cust,'t-cid')),row('Địa chỉ',cust.address||'Chưa có trong mock KYC'),row('Điện thoại',phoneCell(cust,'t1')),row('Email',cust.email),row('Segment',cust.segment),row('Người được BH',insuredCustomerText),...(app.productId==='motor'?[row('Bên thụ hưởng (NTH)',nthText)]:[])].join(''):row('Khách hàng','—')}</tbody></table></div>
 <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">KYC chỉ đọc từ Bank/CRM snapshot. Nhân viên tư vấn/kênh bán không được dùng để suy ra bên thụ hưởng.</div>`;
} else if(activeTab==='quote'){
 if(app.productId==='health'){
 const q=qTrack||{};
 const pkg=healthPkg(app.package||q.packageId);
 const members=healthMembersOf(app);
 const benefitCards=healthBenefitRows(app.package||q.packageId).map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:10px;padding:12px;"><div style="font-size:12px;color:var(--ink-500);">${k}</div><b style="display:block;margin-top:4px;font-size:13px;">${v}</b></div>`).join('');
 const memberRows=members.map(function(m){return `<tr><td>${m.name||'—'}</td><td>${m.dob||'—'}</td><td>${m.age!=null?m.age:'—'}</td><td>${m.relationship||'—'}</td></tr>`;}).join('');
 const bd=q.premiumBreakdown||{};
 body=`<div class="card" style="padding:16px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div class="label">Gói sức khỏe đang chọn</div><h2 style="margin:5px 0 2px;font-size:18px;color:var(--ink-900);">${pkg.name||app.package||'—'}</h2><div style="font-size:12px;color:var(--ink-500);">Thời hạn ${(pkg.termMonths||12)} tháng · ${pkg.territory||'Việt Nam'}</div></div><div style="text-align:right;"><div class="label">Tổng phí</div><b style="font-size:22px;color:var(--brand-600);">${BANCA.vnd(q.premium||app.premium||0)}</b></div></div></div>
 <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start;">
  <main style="display:grid;gap:14px;">
   <section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Người được bảo hiểm</div><table class="dtable"><thead><tr><th>Họ tên</th><th>DOB</th><th>Tuổi BH</th><th>Quan hệ</th></tr></thead><tbody>${memberRows}</tbody></table></section>
   <section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Quyền lợi sức khỏe</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">${benefitCards}</div><div style="font-size:11.5px;color:var(--ink-500);margin-top:10px;">Loại trừ chính: ${(pkg.exclusions||[]).join('; ')||'Theo quy tắc bảo hiểm sức khỏe'}.</div></section>
  </main>
  <aside class="card" style="padding:16px;position:sticky;top:84px;"><div class="label" style="margin-bottom:10px;">Breakdown phí</div>
   <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line);"><span>Phí cơ bản</span><b>${BANCA.vnd(bd.basePremium||0)}</b></div>
   <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line);"><span>Giảm phí</span><b>${bd.discount?'-'+BANCA.vnd(bd.discount):'—'}</b></div>
   <div style="display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line);"><span>Thuế</span><b>${BANCA.vnd(bd.tax||0)}</b></div>
   <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;padding:9px 0;color:var(--brand-600);"><span>Tổng phí cuối cùng</span><span>${BANCA.vnd(q.premium||app.premium||0)}</span></div>
   <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Snapshot đã nộp — chỉ xem, không đổi gói hoặc tính lại phí tại tracking.</div>
  </aside>
 </div>`;
 } else {
 const q=qTrack||{};
 const snap=snapTrack||{};
 const pkgName=app.package||((BANCA.motorPackages[snap.packageCode]||{}).name)||'—';
 const pkgCode=snap.packageCode||(pkgName||'').toUpperCase();
 const packageDef=BANCA.motorPackages[pkgCode]||{};
 const quoteState=BANCA.quoteStatus(q,null)||'ACTIVE';
 const needRerate=['STALE','EXPIRED'].includes(quoteState)||(app.warnings||[]).includes('QUOTE_NEED_RERATE');
 const canChange=false; // Không gian theo dõi yêu cầu đã nộp — snapshot đã nộp, chỉ xem (không đổi gói/add-on/tính lại phí)
 const odAddOnTotal=(q.lines||[]).filter(l=>l.amount>0).reduce((sum,l)=>sum+l.amount,0);
 const discount=q.ncdAmount||0;
 const feeLine=(label,val,strong)=>`<div style="display:flex;justify-content:space-between;align-items:baseline;padding:${strong?'9px 0':'5px 0'};border-bottom:1px dashed var(--line);font-size:${strong?'15px':'12.5px'};font-weight:${strong?'800':'500'};color:${strong?'var(--ink-900)':'var(--ink-700)'};"><span>${label}</span><span style="color:${strong?'var(--brand-600)':'inherit'};">${val}</span></div>`;
 const detailRows=[
  ['TNDS bắt buộc','Theo biểu phí luật','Cố định',BANCA.vnd(q.tplPremium||0)],
  ['Phí gốc vật chất','IDV '+BANCA.vnd(idvTrack),((packageDef.rate||0)*100).toFixed(2)+'%',BANCA.vnd(q.odBase||0)],
  ...(q.lines||[]).map(l=>[l.label,'Trên phí gốc vật chất',l.pct+'%',(l.amount<0?'−':'+')+BANCA.vnd(Math.abs(l.amount))]),
  ['Tạm tính','OD base + add-on','—',BANCA.vnd(q.subtotal||0)],
  ['Giảm phí NCD','Trên subtotal',q.ncdPct? q.ncdPct+'%':'—',discount?'−'+BANCA.vnd(discount):'—'],
  ['VAT','Phần vật chất',BANCA.VAT_PCT+'%','+'+BANCA.vnd(q.vatAmount||0)],
  ['Tổng phí cuối cùng','TNDS + vật chất sau VAT','—',BANCA.vnd(q.totalPremium||app.premium||0)]
 ];
 const addOnCards=Object.values(BANCA.motorAddOns).map(a=>{const on=(snap.addOns||[]).includes(a.code); const line=(q.lines||[]).find(l=>l.code===a.code||l.label===a.name); const amt=line?Math.abs(line.amount):Math.round((q.odBase||0)*(a.ratePct||0)/100); return `<div style="border:1px solid ${on?'var(--brand-600)':'var(--line)'};border-radius:10px;padding:12px 14px;background:${on?'var(--brand-100)':'#fff'};display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;"><div><div style="font-size:13px;font-weight:800;color:var(--ink-900);">${a.name}</div><div style="font-size:11.5px;color:var(--ink-500);margin-top:3px;">Tỷ lệ phí ${a.ratePct}% · phần phí tăng thêm ${BANCA.vnd(amt)}</div></div><div style="text-align:right;">${on?'<span class="badge badge-ready">Đang chọn</span>':'<span class="badge badge-pending">Không chọn</span>'}${canChange?`<div style="margin-top:6px;"><button class="btn btn-secondary btn-sm" onclick="alert('Toggle add-on demo — sau khi đổi sẽ cần tính lại phí')">${on?'Bỏ chọn':'Chọn'}</button></div>`:''}</div></div>`}).join('');
 const benefitGroup=(title,items,open)=>`<details ${open?'open':''} class="card" style="padding:14px 16px;margin:0 0 10px;"><summary style="cursor:pointer;font-weight:800;color:var(--ink-900);">${title}</summary><div style="display:grid;gap:8px;margin-top:10px;">${items.map(([a,b])=>`<div style="display:grid;grid-template-columns:220px 1fr;gap:12px;font-size:12.5px;border-bottom:1px dashed var(--line);padding-bottom:7px;"><span style="color:var(--ink-500);">${a}</span><b>${b}</b></div>`).join('')}</div></details>`;
 body=`<style>
  .quote-layout{display:grid;grid-template-columns:minmax(0,68fr) minmax(320px,32fr);gap:16px;align-items:start;}
  .quote-main{display:grid;gap:14px;}
  .quote-side{position:sticky;top:84px;display:grid;gap:12px;}
  .quote-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(10,25,60,.04);} 
  @media(max-width:1100px){.quote-layout{grid-template-columns:1fr}.quote-side{position:static}}
 </style>
 <div class="quote-layout">
  <main class="quote-main">
   <section class="quote-card"><div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;"><div><div class="label">Gói đang chọn</div><h2 style="margin:5px 0 2px;font-size:18px;color:var(--ink-900);">${app.productName}</h2><div style="font-size:14px;font-weight:800;color:var(--brand-600);">${pkgName}</div></div><div style="display:flex;gap:8px;">${canChange?'<button class="btn btn-secondary btn-sm" onclick="alert(\'Đổi gói demo\')">Đổi gói</button><button class="btn btn-secondary btn-sm" onclick="alert(\'So sánh gói demo\')">So sánh gói</button>':'<span class="chip">Không có quyền thay đổi</span>'}</div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px;">${[['Số tiền BH',BANCA.vnd(idvTrack)],['Giá trị xe tham chiếu',app.vehicle&&app.vehicle.value?BANCA.vnd(app.vehicle.value):'—'],['Mức khấu trừ',dedTrack?BANCA.vnd(dedTrack)+'/vụ':'—'],['Trạng thái phí',needRerate?'<span class="badge badge-blocked">Cần tính lại phí</span>':BANCA.quoteStatusBadge(quoteState)]].map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:9px;padding:10px;"><div style="font-size:10.5px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:13px;font-weight:800;margin-top:4px;">${v}</div></div>`).join('')}</div></section>
   <section class="quote-card"><div class="label" style="margin-bottom:10px;">Add-on</div><div style="display:grid;gap:10px;">${addOnCards}</div></section>
   <section><div class="section-title" style="margin-top:0;"><h2>Quyền lợi bảo hiểm</h2><span class="subtitle">Nhóm theo mức độ quan trọng</span></div>${benefitGroup('Bắt buộc',[['TNDS — người','150.000.000 ₫/người/vụ'],['TNDS — tài sản','100.000.000 ₫/vụ']],true)}${benefitGroup('Vật chất xe',[['Số tiền BH (IDV)',BANCA.vnd(idvTrack)],['Khấu trừ',dedTrack?BANCA.vnd(dedTrack)+'/vụ':'—'],['Garage',packageDef.garage||'Theo gói']],true)}${benefitGroup('Quyền lợi bổ sung',addOnsTrack.length?addOnsTrack.map(x=>[x,'Có — theo điều khoản gói '+pkgName]):[['Không có','—']],false)}${benefitGroup('Điều kiện và giới hạn',[['Hiệu lực báo giá',q.validUntil||'—'],['Gói không còn hiệu lực',quoteState==='EXPIRED'?'Có — cần tính lại':'Không'],['Quyền chỉnh sửa',canChange?'Nhân viên tư vấn được đổi gói/add-on':'Chỉ xem / không có quyền thay đổi']],false)}</section>
   <details class="quote-card"><summary style="cursor:pointer;font-weight:800;color:var(--brand-600);">Xem chi tiết cách tính phí</summary><table class="dtable" style="margin-top:12px;"><thead><tr><th>Thành phần</th><th>Cơ sở tính</th><th>Tỷ lệ</th><th>Thành tiền</th></tr></thead><tbody>${detailRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td style="font-weight:700;">${r[3]}</td></tr>`).join('')}</tbody></table></details>
  </main>
  <aside class="quote-side">
   <section class="quote-card" style="border-top:4px solid ${needRerate?'var(--red-600)':'var(--brand-600)'};"><div class="label">Chi tiết phí</div>${needRerate?'<div class="alert2 warn" style="margin:10px 0;">Dữ liệu đã thay đổi / báo giá không còn hiệu lực. Phí cũ không được coi là phí hiện tại.</div>':''}${feeLine('TNDS bắt buộc',BANCA.vnd(q.tplPremium||0))}${feeLine('Phí vật chất xe',BANCA.vnd(q.odBase||0))}${feeLine('Tổng phí add-on','+'+BANCA.vnd(odAddOnTotal))}${feeLine('Tạm tính',BANCA.vnd(q.subtotal||0))}${feeLine('Giảm phí',discount?'−'+BANCA.vnd(discount):'—')}${feeLine('VAT','+'+BANCA.vnd(q.vatAmount||0))}${feeLine('Tổng phí cuối cùng',BANCA.vnd(q.totalPremium||app.premium||0),true)}<div style="display:grid;gap:8px;margin-top:12px;"><button class="btn btn-secondary" onclick="document.querySelector('details.quote-card') && document.querySelector('details.quote-card').setAttribute('open','')">Xem cách tính phí</button><button class="btn btn-secondary" onclick="alert('Tải bảng minh họa phí (demo)')">Tải bảng minh họa</button></div><div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Bản phí đã nộp — chỉ xem. Không đổi gói/add-on hay tính lại phí trên yêu cầu đã nộp.</div></section>
   <section class="quote-card"><div class="label">Trạng thái hệ thống</div><div style="display:grid;gap:7px;margin-top:8px;font-size:12px;color:var(--ink-500);"><div>Loading phí: hiển thị khi gọi rating engine</div><div>Tính phí thành công: ${!needRerate?'đang áp dụng':'sau khi re-rate'}</div><div>Tính phí lỗi: hiển thị alert lỗi retry</div><div>Dữ liệu thay đổi cần re-rate: ${needRerate?'đang có':'không'}</div><div>Nhân viên tư vấn không có quyền thay đổi: ${canChange?'không':'có'}</div></div></section>
  </aside>
 </div>`;
 }
} else if(activeTab==='declaration'){
 // Read-only, nhóm theo section + metadata từng câu (người cung cấp / nguồn / thời điểm / khách xác nhận / ảnh hưởng)
 const decl=(app.declarations||[]);
 const sectionOf=d=>{
  if(/tổn thất|claim|tai nạn/i.test(d.q)) return 'Lịch sử tổn thất';
  if(/kinh doanh|vận tải|mục đích|sử dụng/i.test(d.q)) return 'Thông tin sử dụng xe';
  if(/ngập|kỹ thuật|camera|lắp/i.test(d.q)) return 'Tình trạng kỹ thuật';
  return 'Khai báo pháp lý';
 };
 const impactOf=d=>{ const a=[]; if(d.flag) a.push('UW'); if(/tổn thất|kinh doanh/i.test(d.q)) a.push('Phí'); return a.length?a.join(' · '):'—'; };
 const groups={};
 decl.forEach(d=>{ const s=sectionOf(d); (groups[s]=groups[s]||[]).push(d); });
 const custConfirmed = !!app.confirm || ['PAYMENT_METHOD_REQUIRED','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st);
 const declTime = app.submittedAt||'—';
 const rowDecl=d=>`<div style="padding:12px 14px;border-bottom:1px solid var(--line);">
   <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="font-size:13px;font-weight:600;flex:1;">${d.q}</div>${d.flag?'<span class="badge badge-conditional" style="font-size:9px;">Kích hoạt UW</span>':''}</div>
   <div style="font-size:13px;margin-top:4px;">Trả lời: <b>${d.a}</b></div>
   <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:11.5px;color:var(--ink-500);">
     <span>Người cung cấp: <b style="color:var(--ink-700);">Khách hàng</b></span>
     <span>Nguồn: <b style="color:var(--ink-700);">Kê khai khi nộp</b></span>
     <span>Thời điểm: ${declTime}</span>
     <span>Khách xác nhận: ${custConfirmed?'<span class="badge badge-ready" style="font-size:9px;">Đã xác nhận</span>':'<span class="badge badge-pending" style="font-size:9px;">Chưa</span>'}</span>
     <span>Ảnh hưởng: ${impactOf(d)}</span>
   </div>
   ${d.note?`<div style="font-size:11.5px;color:var(--ink-300);margin-top:3px;">${d.note}</div>`:''}
 </div>`;
 body=`<div class="alert2 info" style="margin-bottom:12px;">Nội dung khai báo tại thời điểm nộp — <b>chỉ xem</b>.</div>`
  + Object.keys(groups).map(sec=>`<div class="section-title" style="margin-top:0;"><h2>${sec}</h2></div><div class="card" style="padding:0;overflow:hidden;margin-bottom:12px;">${groups[sec].map(rowDecl).join('')}</div>`).join('')
  + `<div class="section-title" style="margin-top:0;"><h2>Tình trạng thế chấp (suy ra)</h2></div><div class="card" style="padding:12px 14px;"><div style="font-size:13px;">${mgTrack.mortgaged?`<b>Có</b> — ${mgTrack.bank||'—'}`:'<b>Không</b>'} <span class="chip">Derived</span></div><div style="font-size:11.5px;color:var(--ink-300);margin-top:3px;">Suy ra từ tab Đối tượng bảo hiểm/NTH — không nhập hai lần.</div></div>`;
} else if(activeTab==='documents'){
 body=submittedDocTable();
} else if(activeTab==='uw' && app.productId==='health' && (app.insuredMembers||[]).some(function(m){return m.underwriting;})){
 // §sau nộp — Thẩm định member matrix (Health family). Trạng thái tổng DERIVE, không hiện "Đã chấp thuận tự động" nếu chỉ 1 người duyệt.
 const overall = BANCA.healthDeriveOverallUw(app);
 const oTone = {ok:['var(--teal-600)','#eefaf7'],wait:['var(--amber-600)','#fdf3e3'],warn:['var(--amber-600)','#fdf3e3'],danger:['var(--red-600)','#fdecec']}[overall.tone]||['var(--brand-600)','var(--brand-100)'];
 const units = BANCA.healthUnitsOf(app);
 const rows = units.filter(function(u){return u.active!==false;}).map(function(u){
  const uw=u.underwriting||{decision:'IN_UW'};
  const meta=BANCA.HEALTH_UW_MEMBER[uw.decision]||{label:uw.decision,tone:'wait'};
  const t={ok:'var(--teal-600)',wait:'var(--amber-600)',warn:'var(--amber-600)',danger:'var(--red-600)'}[meta.tone]||'var(--ink-500)';
  const canSim = app.owner===me && uw.decision==='IN_UW';
  return `<tr>
    <td><b>${u.name||'—'}</b><div style="font-size:11px;color:var(--ink-300);">${u.relationship||'—'}${u.age!=null?' · '+u.age+'t':''} · ${healthPkgName(u.package)}</div></td>
    <td><span style="color:${t};font-weight:700;">${meta.label}</span></td>
    <td>${uw.additionalPremium?('+'+BANCA.vnd(uw.additionalPremium)):'—'}</td>
    <td style="font-size:12px;color:var(--ink-500);">${(uw.conditions&&uw.conditions.length)?uw.conditions.join('; '):(uw.decision==='REJECTED'?'Không đủ điều kiện':'—')}</td>
    <td>${canSim?`<div style="display:flex;gap:4px;flex-wrap:wrap;"><button class="btn btn-secondary btn-sm" onclick="healthMemberUw('${app.id}','${u.insuredUnitId}','APPROVED_STP')">Duyệt</button><button class="btn btn-secondary btn-sm" onclick="healthMemberUw('${app.id}','${u.insuredUnitId}','NEED_MORE_INFO')">Cần bổ sung</button><button class="btn btn-secondary btn-sm" style="color:var(--red-600);" onclick="healthMemberUw('${app.id}','${u.insuredUnitId}','REJECTED')">Từ chối</button></div>`:'<span style="font-size:11px;color:var(--ink-300);">—</span>'}</td>
   </tr>`;
 }).join('');
 body = `<div class="card" style="padding:14px 16px;margin-bottom:12px;border-left:4px solid ${oTone[0]};background:${oTone[1]};">
    <b style="color:${oTone[0]};font-size:14px;">Trạng thái tổng (derive): ${overall.label}</b>
    <div style="font-size:12px;color:var(--ink-500);margin-top:3px;">Trạng thái tổng suy ra từ kết quả từng thành viên — không hiển thị "Đã chấp thuận tự động" cho toàn yêu cầu nếu chỉ một phần thành viên được duyệt.</div>
   </div>
   <div class="card" style="padding:16px;">
    <div class="label" style="margin-bottom:8px;">Ma trận thẩm định theo thành viên</div>
    <table class="dtable"><thead><tr><th>Thành viên</th><th>Kết quả</th><th>Phụ phí</th><th>Điều kiện</th><th>Mô phỏng</th></tr></thead><tbody>${rows}</tbody></table>
    ${overall.code==='READY_PAYMENT'&&app.owner===me?`<a class="btn btn-primary btn-sm" style="margin-top:12px;" href="?id=${app.id}&tab=confirmpay">Khởi tạo thanh toán (tổng) →</a>`:''}
    ${overall.code==='PARTIAL'?`<div class="alert2 warn" style="margin-top:12px;">Có thành viên bị từ chối — loại thành viên đó (chủ động) rồi tính lại tổng phí trước khi mở thanh toán.</div>`:''}
   </div>`;
} else if(activeTab==='uw'){
 // Thẩm định Workspace detail (Epic 3) — status/owner/queue/priority + timeline SLA
 const uwState = app.uw?(['REJECTED'].includes(st)?'Từ chối':(app.uw.decision==='APPROVED'?'Đã duyệt':'Duyệt có điều kiện')):(st==='NEED_MORE_INFO'?'Chờ phản hồi nhân viên tư vấn':(st==='IN_UW'?'Đang thẩm định':(st==='PENDING_UW'?'Đã tiếp nhận':'Chờ tiếp nhận')));
 const uwStateTone = app.uw?(['REJECTED'].includes(st)?'danger':'ok'):'wait';
 const received=app.submittedAt||'—', started=st==='PENDING_RECEIPT'?'—':((app.submittedAt||'—')), expected=app.sla||'—';
 // DEF-002 — đơn vị/queue theo underwritingDefinition của SẢN PHẨM (không hard-code Motor).
 const _uwDef=BANCA.underwritingDefinitionFor(app.productId);
 const _unitName=_uwDef.error?'—':(_uwDef.manualUnit||'—');
 const _queueName=_uwDef.error?'—':(_uwDef.queueCode||'—');
 const wsCard=(_uwDef.error?`<div class="card" style="padding:14px;margin-bottom:12px;border:1.5px solid var(--red-600);background:#fdecec;"><b style="color:var(--red-600);">⚠ Lỗi cấu hình thẩm định</b><div style="font-size:12.5px;margin-top:4px;">${_uwDef.message}</div></div>`:'')+`<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">Trạng thái thẩm định</div>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
     ${[['Trạng thái',uwState],['Đơn vị xử lý',_unitName],['Hàng chờ (queue)',_queueName],['Ưu tiên',app.uw?'Bình thường':(app.sla&&new Date(app.sla.replace(' ','T'))<new Date('2026-07-21T15:30:00')?'Cao':'Bình thường')],['Tiếp nhận lúc',received],['Bắt đầu',started],['Dự kiến xong',expected],['SLA còn lại',app.sla?slaHtml(app.sla):'—']].map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:8px;padding:9px;"><div style="font-size:10px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:12.5px;font-weight:700;margin-top:2px;">${v}</div></div>`).join('')}
   </div></div>`;
 // Condition detail (chỉ khi duyệt có điều kiện) — không lộ note nội bộ/fraud/risk score
 const condCard = (app.uw&&['APPROVED_WITH_LOADING','APPROVED_WITH_EXCLUSION','APPROVED_WITH_CONDITION'].includes(app.uw.decision))?`<div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--amber-600);">
   <div class="label" style="margin-bottom:10px;color:var(--amber-600);">Điều kiện thẩm định</div>
   <table class="dtable"><tbody>
    ${app.uw.loading?row('Phụ phí thẩm định',app.uw.loading):''}
    ${app.uw.condition?row('Điều kiện',app.uw.condition):''}
    ${app.uw.exclusion?row('Loại trừ',app.uw.exclusion):''}
    ${row('Lý do được phép chia sẻ',app.uw.reason||'—')}
    ${row('Phí trước',BANCA.vnd(app.premium))}
    ${app.uw.newPremium?row('Phí sau',`<b style="color:var(--amber-600);">${BANCA.vnd(app.uw.newPremium)}</b>`):''}
    ${row('Khách cần xác nhận lại','<span class="badge badge-conditional">Bắt buộc</span>')}
    ${app.deadline?row('Deadline phản hồi',app.deadline):''}
   </tbody></table>
   <div style="font-size:11px;color:var(--ink-300);margin-top:6px;">Chỉ hiển thị thông tin được phép chia sẻ với nhân viên tư vấn/khách — không gồm ghi chú UW nội bộ, fraud flag hay risk score.</div>
 </div>`:'';
 const decCard = app.uw?`<div class="card" style="padding:16px;"><table class="dtable"><tbody>
   ${row('Kết quả',BANCA.uwBadge(app.uw.decision))}
   ${row('Thẩm định viên',app.uw.officer||'—')}
   ${row('Quyết định lúc',app.uw.decidedAt)}
   ${row('Thư thẩm định',`<a href="javascript:alert('Mở PDF demo: ${app.uw.letter}')" style="color:var(--brand-600);">${app.uw.letter}</a>`)}
   ${row('Khách đã xem',app.uw.customerViewed?'<span class="badge badge-ready">Đã xem</span>':'<span class="badge badge-pending">Chưa xem</span>')}
  </tbody></table>
  ${['UW_DECIDED'].includes(st)&&app.owner===me?'<button class="btn btn-primary" style="margin-top:12px;" onclick="sendConfirm()">Gửi khách xác nhận</button>':''}
 </div>` : emptyIllu('📋','Chưa có kết quả thẩm định',['PENDING_RECEIPT','PENDING_UW','IN_UW'].includes(st)?'Yêu cầu đang trong hàng chờ / đang thẩm định. Bạn chưa cần thao tác thêm.':'—');
 // P0.4b — Panel mô phỏng kết quả thẩm định (nút demo từng bước) cho yêu cầu router-created chưa có kết quả.
 const canSimUw = !app.uw && ['PENDING_RECEIPT','PENDING_UW','IN_UW'].includes(st) && app.owner===me;
 const simUwPanel = canSimUw ? `<div class="card" style="padding:16px;margin-bottom:12px;border:1.5px dashed var(--brand-600);background:var(--brand-100);">
   <div class="label" style="color:var(--brand-700);">🎬 Mô phỏng kết quả thẩm định (demo)</div>
   <div style="font-size:12px;color:var(--ink-500);margin:6px 0 10px;">Chỉ dùng để trình diễn luồng. Bấm để đơn vị thẩm định "trả kết quả":</div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;">
     <button class="btn btn-secondary btn-sm" onclick="simulateUw('APPROVED')">✓ Duyệt</button>
     <button class="btn btn-primary btn-sm" onclick="simulateUw('APPROVED_WITH_CONDITION')">◐ Duyệt có điều kiện</button>
     <button class="btn btn-secondary btn-sm" style="color:var(--red-600);" onclick="simulateUw('REJECTED')">✕ Từ chối</button>
   </div>
   ${(app.routing&&app.routing.conditions&&app.routing.conditions.length)?`<div style="font-size:11.5px;color:var(--ink-500);margin-top:8px;">Yếu tố rủi ro khai báo: ${app.routing.conditions.join(' · ')}</div>`:''}
 </div>` : '';
 // §1 — STP: hiển thị kết quả thẩm định thẳng, KHÔNG queue/officer/SLA thủ công/Motor UW Team.
 if(app.stpDecision){
  const d=app.stpDecision;
  const fmtTs = ts => { try{ return new Date(ts).toLocaleString('vi-VN',{timeZone:'Asia/Saigon'}); }catch(e){ return ts; } };
  const stpCard = `<div class="card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--teal-600);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span class="badge badge-ready">Đã chấp thuận tự động</span>
      <span style="font-size:12px;color:var(--ink-500);">Phương thức: <b>Thẩm định thẳng (STP)</b></span>
    </div>
    <table class="dtable"><tbody>
      ${row('Kết quả', '<span class="badge badge-ready">Chấp thuận</span>')}
      ${row('Mã quyết định', d.decisionCode||d.underwritingDecisionId)}
      ${row('Nguồn quyết định', d.decisionSource||'RULE_ENGINE')}
      ${row('Bộ quy tắc', (d.ruleSetCode||d.ruleSet)+' · v'+(d.ruleVersion||d.ruleSetVersion))}
      ${row('Thời điểm quyết định', fmtTs(d.decidedAt))}
      ${row('Phụ phí', (d.additionalPremium||d.loading)?BANCA.vnd(d.additionalPremium||d.loading):'Không')}
      ${row('Loại trừ', (d.exclusions&&d.exclusions.length)?d.exclusions.join('; '):'Không')}
      ${row('Điều kiện bổ sung', (d.conditions&&d.conditions.length)?d.conditions.join('; '):'Không')}
      ${row('Tài liệu cần bổ sung', (d.additionalDocuments&&d.additionalDocuments.length)?d.additionalDocuments.join('; '):'Không')}
      ${row('Khách cần xác nhận điều kiện', d.customerConfirmationRequired?'Có':'Không')}
      ${row('Quyền tiếp tục thanh toán', d.paymentAllowed!==false?'<span class="badge badge-ready">Được phép</span>':'<span class="badge badge-blocked">Chưa</span>')}
    </tbody></table>
    <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Yêu cầu đủ điều kiện phát hành tự động theo bộ quy tắc STP — không qua hàng chờ/thẩm định viên thủ công.</div>
    ${app.status==='PAYMENT_METHOD_REQUIRED'&&app.owner===me?`<a class="btn btn-primary btn-sm" style="margin-top:12px;" href="?id=${app.id}&tab=confirmpay">Khởi tạo thanh toán →</a>`:''}
  </div>`;
  body = stpCard;
 } else {
  body = simUwPanel + wsCard + condCard + decCard;
 }
} else if(CONFIRMPAY_ALIASES.includes(activeTab)){
 body = renderConfirmPay();
} else if(activeTab==='policy' && caseView.phase==='POLICY_ISSUE_FAILED'){
 // §IX — phát hành lỗi: payment giữ SUCCESS, KHÔNG thu lại tiền, CTA thử lại/hỗ trợ.
 body=`<div class="card" style="padding:18px;border-left:4px solid var(--red-600);background:#fdecec;">
   <div style="font-size:17px;font-weight:800;color:var(--red-600);">⚠ Phát hành hợp đồng lỗi</div>
   <div style="font-size:13px;color:var(--ink-700);margin-top:6px;">Thanh toán đã <b>thành công</b> (${BANCA.vnd((app.payment&&app.payment.amount)||app.premium)}) — <b>không</b> yêu cầu khách thanh toán lại. Core phát hành gặp lỗi, thử phát hành lại hoặc chuyển hỗ trợ.</div>
   <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
    ${app.owner===me?`<button class="btn btn-primary btn-sm" onclick="retryIssue()">Thử phát hành lại</button>`:''}
    <button class="btn btn-secondary btn-sm" onclick="alert('Chuyển hỗ trợ (demo)')">Chuyển hỗ trợ</button>
    <a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=payment">Xem thanh toán</a>
   </div>
  </div>`;
} else if(activeTab==='policy'){
 const polRec = app.policyId?BANCA.policyById(app.policyId):null;
 const effFrom = polRec&&polRec.effectiveFrom||'—', effTo = polRec&&polRec.effectiveTo||'—';
 const issuedHead = `<div class="card" style="padding:18px;border-left:4px solid var(--teal-600);margin-bottom:12px;">
   <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start;">
    <div>
     <div class="alert2 info" style="margin:0 0 8px;">Đã nhận thanh toán</div>
     <div style="font-size:12.5px;color:var(--ink-500);margin-bottom:4px;">Đang phát hành hợp đồng → <b style="color:var(--teal-600);">Hợp đồng đã phát hành</b></div>
     <div style="font-size:19px;font-weight:700;color:var(--teal-600);">✓ Hợp đồng đã phát hành thành công</div>
     <div style="font-size:14px;color:var(--ink-700);margin-top:4px;">Số HĐ <b>${app.policyId}</b> · Hiệu lực ${effFrom} → ${effTo}</div>
    </div>
    <!-- Nút Tải hợp đồng/Gửi cho khách đã chuyển lên header (getSubmittedCaseActions) -->
   </div>
   <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:12.5px;color:var(--ink-500);">
    <div><b style="color:var(--ink-700);">Ngày hiệu lực</b><br>${effFrom}</div>
    <div><b style="color:var(--ink-700);">Hotline hỗ trợ</b><br>1900 1234 (24/7)</div>
    <div><b style="color:var(--ink-700);">Yêu cầu bồi thường</b><br>Gọi hotline hoặc app trong 5 ngày</div>
    <div><b style="color:var(--ink-700);">Dự kiến tái tục</b><br>${effTo}</div>
   </div>
  </div>`;
 body = (app.policyId && caseView.states.policyStatus==='ISSUED')? issuedHead + gcnPanel(app)+`
 ${BANCA.commissionVisible('policy')?(()=>{const pol=BANCA.policyById(app.policyId); const cm=pol?BANCA.commissionOfPolicy(pol):null; return cm?`<div class="card" style="padding:14px;margin-top:12px;border-left:3px solid var(--teal-600);"><div class="label">Hoa hồng dự kiến</div><div style="font-size:13px;color:var(--ink-700);margin-top:4px;"><b>${BANCA.vnd(cm.amount)}</b> · trạng thái ${cm.stateLabel} · cơ sở tính HH ${BANCA.vnd(cm.base)} · tỷ lệ ${(cm.rate*100).toFixed(0)}%</div><div style="font-size:11px;color:var(--ink-300);margin-top:3px;">Read-only · cập nhật theo sync ${cm.syncAt}; clawback/đối soát xử lý ở màn admin đối tác.</div></div>`:''})():''}
 ` : (()=>{
   const ck=(done,label)=>`<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13px;"><span style="width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:${done?'var(--teal-600)':'var(--line)'};color:${done?'#fff':'var(--ink-500)'};">${done?'✓':'○'}</span><span style="${done?'':'color:var(--ink-500);'}">${label}</span></div>`;
   const uwOk = !!app.uw && !['REJECTED'].includes(st);
   const confirmed = !!app.confirm && ['PAYMENT_METHOD_REQUIRED','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st);
   const paid = app.payment&&app.payment.status==='SUCCESS' || ['PAID','PENDING_ISSUE','ISSUED'].includes(st);
   const issued = st==='ISSUED';
   return `<div class="card" style="padding:18px;">
     <div style="font-size:16px;font-weight:700;margin-bottom:4px;">Hợp đồng chưa được phát hành</div>
     <div style="font-size:12.5px;color:var(--ink-500);margin-bottom:12px;">Cần hoàn tất các điều kiện sau trước khi phát hành:</div>
     ${ck(uwOk,'Yêu cầu đã duyệt (thẩm định)')}
     ${ck(confirmed,'Khách hàng đã xác nhận')}
     ${ck(paid,'Đã thanh toán')}
     ${ck(issued,'Đã nhận kết quả phát hành từ Core')}
   </div>`;
  })();
} else { // history — business + audit timeline
 const fCat=qs.get('hcat')||'ALL';
 // ev: [time, event, actor, cat, before, after]
 const ev=[];
 const per=(BANCA.personas[app.owner]||{}).name||app.owner;
 ev.push([app.submittedAt||'—','Nộp yêu cầu bảo hiểm',per,'STATUS','READY_TO_SUBMIT','SUBMITTED']);
 ev.push([app.submittedAt||'—','Đồng bộ yêu cầu sang hệ thống bảo hiểm','Hệ thống','INTEGRATION','','Đã gửi']);
 if(['PENDING_UW','IN_UW','NEED_MORE_INFO','UW_DECIDED','PENDING_CUSTOMER_CONFIRM','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st))
   ev.push([app.submittedAt||'—','Đơn vị bảo hiểm tiếp nhận hồ sơ','ABC Insurance','INTEGRATION','SUBMITTED','UW_PENDING']);
 if(app.supplement) ev.push([app.supplement.requestedAt||'—','Yêu cầu bổ sung ('+(app.supplement.items||[]).length+' nội dung)',app.supplement.requestedBy||'Thẩm định viên','STATUS','UW_IN_PROGRESS','NEED_MORE_INFORMATION']);
 if(app.uw) ev.push([app.uw.decidedAt||'—','Kết quả thẩm định: '+((BANCA.UW_DECISIONS&&BANCA.UW_DECISIONS[app.uw.decision]||{}).label||app.uw.decision),app.uw.officer||'Thẩm định viên','STATUS','UW_IN_PROGRESS','UW_DECIDED']);
 if(app.confirm) ev.push([app.confirm.sentAt||'—','Nộp yêu cầu bảo hiểm khách xác nhận',per,'STATUS','','SENT']);
 if(app.stpDecision) ev.push([app.stpDecision.decidedAt||app.submittedAt||'—','Chấp thuận tự động (STP) · '+app.stpDecision.decisionCode,app.stpDecision.unitName,'STATUS','UW_PROCESSING','APPROVED_STP']);
 if(st==='PAYMENT_METHOD_REQUIRED') ev.push([app.updatedAt||'—','Chờ nhân viên tư vấn chọn cách thanh toán',per,'PAYMENT','APPROVED','METHOD_REQUIRED']);
 // Chỉ log "Khởi tạo thanh toán" khi payment intent ĐÃ được tạo (đã chọn phương thức).
 if(app.payment && app.paymentInitAt) ev.push([app.paymentInitAt,'Khởi tạo yêu cầu thanh toán ('+((BANCA.PAYMENT_CHANNELS[app.payment.paymentChannel]||{}).label||app.payment.paymentChannel||'')+')',per,'PAYMENT','METHOD_REQUIRED','PENDING']);
 if(app.payment&&app.payment.paidAt) ev.push([app.payment.paidAt,'Thanh toán thành công ('+((BANCA.PAYMENT_CHANNELS[app.payment.paymentChannel]||{}).label||app.payment.paymentChannel||app.payment.method||'')+')','Cổng thanh toán','PAYMENT','PENDING','SUCCESS']);
 if(st==='ISSUED'){ ev.push([app.updatedAt||'—','Phát hành hợp đồng '+(app.policyId||''),'Core bảo hiểm','STATUS','PENDING_ISSUE','ISSUED']); ev.push([app.updatedAt||'—','Gửi callback kết quả về ngân hàng','Hệ thống','INTEGRATION','','Thành công']); }
 if(st==='CANCELLED') ev.push([app.updatedAt||'—','Hủy yêu cầu: '+(app.cancelReason||''),'—','STATUS','','CANCELLED']);
 const CATS=[['ALL','Tất cả'],['STATUS','Trạng thái nghiệp vụ'],['DATA','Thay đổi dữ liệu'],['DOCUMENT','Tài liệu'],['INTEGRATION','Tích hợp'],['PAYMENT','Thanh toán']];
 const catBadge={STATUS:['Trạng thái','badge-base'],DATA:['Dữ liệu','badge-conditional'],DOCUMENT:['Tài liệu','badge-version'],INTEGRATION:['Tích hợp','badge-pending'],PAYMENT:['Thanh toán','badge-ready']};
 const chips=CATS.map(([v,l])=>`<a href="?id=${app.id}&tab=history&hcat=${v}" class="tab" style="text-decoration:none;padding:6px 11px;border-radius:20px;font-size:12px;${fCat===v?'background:var(--brand-600);color:#fff;':'background:var(--paper-card);color:var(--ink-500);border:1px solid var(--line);'}">${l}</a>`).join(' ');
 const shown=ev.filter(e=>fCat==='ALL'||e[3]===fCat);
 body=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${chips}</div>
  <div class="card" style="padding:16px;">${shown.length?shown.map(e=>{const cb=catBadge[e[3]]||['','badge-version'];return `<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px dashed var(--line);font-size:12.5px;align-items:flex-start;">
   <span style="color:var(--ink-300);width:130px;flex-shrink:0;">${e[0]}</span>
   <div style="flex:1;"><b>${e[1]}</b> <span class="badge ${cb[1]}" style="font-size:9px;">${cb[0]}</span>${(e[4]||e[5])?`<div style="font-size:11.5px;color:var(--ink-500);margin-top:2px;">${e[4]?e[4]+' → ':''}${e[5]||''}</div>`:''}</div>
   <span style="color:var(--ink-500);white-space:nowrap;">${e[2]}</span>
  </div>`;}).join(''):'<div class="empty-state" style="padding:20px;">Không có sự kiện ở nhóm này.</div>'}</div>
  <div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Sự kiện tích hợp hiển thị thân thiện (không lộ log kỹ thuật thô).</div>`;
}

// Header enriched + status-driven action bar (Không gian theo dõi yêu cầu đã nộp — view-only)
const na = caseNextAction();
const naTone = {danger:'var(--red-600)',ok:'var(--teal-600)',info:'var(--brand-600)',wait:'var(--amber-600)'}[na[1]]||'var(--amber-600)';
const cmeta = BANCA.caseMeta(app.id);
const caseVer = cmeta.currentVersion;
const quoteRef = app.quote? ((app.quote.id||app.quote.quoteId||'BÁO GIÁ')+((app.quote.version||app.quote.quoteVersion)?'-V'+(app.quote.version||app.quote.quoteVersion):'')) : '—';
const uwRef = (app.uw&&app.uw.ref)|| (['PENDING_INTAKE'].includes(casePh)?'—':'UW-2026-008'+(String(app.id).slice(-2)));
const submittedBy = (BANCA.personas[app.owner]||{}).name||app.owner;
const srcLabel = app.source==='ADVICE'?'Tư vấn nhanh':(app.leadId?'Referral':(BANCA.label&&BANCA.label('source',app.source))||'Janus Bank CRM');
const metaChip = (k,v)=>`<span style="font-size:12px;color:var(--ink-500);">${k}: <b style="color:var(--ink-700);">${v}</b></span>`;
const roleName=(BANCA.personas[me]||{}).role||'Nhân viên tư vấn';
const permLabel = readOnly?'Chỉ xem' : (casePh==='NEED_MORE_INFORMATION'?'Được bổ sung':'Chỉ xem (đã nộp)');
// Version selector
const verSelect = cmeta.versions.length>1
 ? `<select onchange="viewVersion(this.value)" style="font-size:12px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;">${cmeta.versions.slice().reverse().map(v=>`<option value="${v.v}" ${v.v===caseVer?'selected':''}>V${v.v}${v.v===caseVer?' (Current)':''} · ${v.status}</option>`).join('')}</select>${cmeta.compare.length?` <button class="btn btn-secondary btn-sm" onclick="compareVersions('${app.id}')">Compare V1↔V${caseVer}</button>`:''}`
 : `<span class="badge badge-version">Phiên bản ${caseVer}</span>`;
// Notification banner (Epic 12)
function caseNotification(){
 if(casePh==='NEED_MORE_INFORMATION') return ['var(--amber-600)','var(--amber-100)','🟡','Cần bổ sung',supCount+' nội dung'+(app.deadline?' · hạn '+app.deadline:'')];
 if(casePh==='ISSUED' && caseView.states.policyStatus==='ISSUED') return ['var(--teal-600)','var(--teal-100)','🟢','Hợp đồng đã phát hành thành công',''];
 if(casePh==='REJECTED') return ['var(--red-600)','var(--red-100)','🔴','Yêu cầu bị từ chối',''];
 if(casePh==='PAYMENT_PENDING') return ['var(--brand-600)','var(--brand-100)','💳','Chờ khách thanh toán',''];
 if(casePh==='APPROVED_WITH_CONDITION') return ['var(--brand-600)','var(--brand-100)','📝','Duyệt có điều kiện — cần khách xác nhận lại',''];
 return null;
}
const noti=caseNotification();
const notiBanner = noti?`<div style="display:flex;gap:10px;align-items:center;background:${noti[1]};border-radius:10px;padding:10px 14px;margin-bottom:12px;"><span style="font-size:16px;">${noti[2]}</span><b style="color:${noti[0]};">${noti[3]}</b>${noti[4]?`<span style="font-size:12.5px;color:var(--ink-500);">· ${noti[4]}</span>`:''}</div>`:'';
// Dashboard summary chips (Epic 15)
const stageLbl={PENDING_INTAKE:'Chờ tiếp nhận',UW_PENDING:'Chờ thẩm định',UW_IN_PROGRESS:'Đang thẩm định',NEED_MORE_INFORMATION:'Cần bổ sung',APPROVED_WITH_CONDITION:'Duyệt có điều kiện',CUSTOMER_RECONFIRMATION:'Chờ khách xác nhận',PAYMENT_PENDING:'Chờ thanh toán',PAID:'Đã thanh toán',PENDING_ISSUE:'Chờ phát hành',ISSUED:'Đã phát hành',REJECTED:'Từ chối',CANCELLED:'Đã hủy'}[casePh]||casePh;
const caseOwner=casePh==='NEED_MORE_INFORMATION'?'Nhân viên tư vấn':(casePh==='PENDING_INTAKE'?'Chờ tiếp nhận':'Đơn vị bảo hiểm');
const dashChip=(k,v)=>`<div style="border:1px solid var(--line);border-radius:8px;padding:7px 11px;"><div style="font-size:10px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:12.5px;font-weight:700;margin-top:2px;">${v}</div></div>`;
const dashStrip=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">${dashChip('Giai đoạn',stageLbl)}${dashChip('Việc tiếp theo',na[0].length>28?na[0].slice(0,28)+'…':na[0])}${dashChip('SLA',app.sla?slaHtml(app.sla):'—')}${dashChip('Phiên bản','V'+caseVer)}${dashChip('Owner',caseOwner)}</div>`;

const hdr=`<div class="card" style="padding:14px 18px;margin-bottom:14px;position:sticky;top:0;z-index:20;box-shadow:0 2px 10px rgba(10,25,60,.06);">
 <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;">
  <div>
   <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;"><span style="font-size:22px;font-weight:700;color:var(--ink-900);line-height:1.15;">${app.id}</span>${verSelect}</div>
   <div style="font-size:13.5px;color:var(--ink-500);margin-top:2px;">${cust?cust.name:'—'} · ${app.productName}${app.package?' · '+app.package:''}</div>
   <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;">${metaChip('Nộp lúc',(app.submittedAt||'—')+' · '+submittedBy)}${metaChip('Nguồn',srcLabel)}${metaChip('Quote',quoteRef)}${metaChip('Mã xử lý',uwRef)}<span class="chip" style="background:#eef0f4;color:var(--ink-500);">${roleName} · ${permLabel}</span></div>
  </div>
  <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;margin-left:auto;">
   <div style="text-align:right;"><div style="font-size:12px;color:var(--ink-500);font-weight:600;text-transform:uppercase;letter-spacing:.03em;">Trạng thái xử lý</div><div style="margin-top:3px;">${BANCA.caseStatusBadge(app)}</div></div>
   <div style="text-align:right;"><div style="font-size:12px;color:var(--ink-500);font-weight:600;text-transform:uppercase;letter-spacing:.03em;">Tổng phí</div><b style="font-size:24px;color:var(--brand-600);display:block;margin-top:1px;">${BANCA.vnd((app.uw&&app.uw.newPremium)||app.premium)}</b></div>
  </div>
 </div>
 ${dashStrip}
 <div style="display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--line);">
  <div style="font-size:13.5px;max-width:56%;"><span style="color:var(--ink-500);">Việc tiếp theo:</span> <b style="color:${naTone};">${na[0]}</b></div>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
   ${getSubmittedCaseActions().join('')}
   ${readOnly?'<span class="chip">Chỉ xem (manager)</span>':''}
  </div>
 </div>
</div>`;

// P0.6 — Banner continuity: vừa submit → hiển thị kết quả decision router + next action (không quay về list).
const routedBanner = (qs.get('routed')==='1' && app.routing) ? (function(){
 const R=app.routing; const tone = R.code==='REJECTED'?'var(--red-600)':R.code==='APPROVED_FOR_BIND'?'var(--teal-600)':'var(--amber-600)';
 const bg = R.code==='REJECTED'?'#fdecec':R.code==='APPROVED_FOR_BIND'?'#eefaf7':'#fdf3e3';
 const nextLabel = {PAYMENT:'Thanh toán phí bảo hiểm', UNDERWRITING:'Theo dõi thẩm định', REVIEW_AND_SUBMIT:'Bổ sung thông tin', null:'Kết thúc'}[R.nextStage]||'Bước tiếp theo';
 return `<div class="card" style="padding:14px 16px;margin-bottom:14px;border:1.5px solid ${tone};background:${bg};">
   <div style="font-weight:800;color:${tone};font-size:14px;">✓ Đã gửi yêu cầu bảo hiểm — kết quả: ${R.label}</div>
   ${R.reasons&&R.reasons.length?`<div style="font-size:12.5px;color:var(--ink-700);margin-top:4px;">${R.reasons.join(' · ')}</div>`:''}
   ${R.conditions&&R.conditions.length?`<ul style="margin:6px 0 0;padding-left:18px;font-size:12px;color:var(--ink-700);">${R.conditions.map(function(c){return '<li>'+c+'</li>';}).join('')}</ul>`:''}
   ${R.nextStage?`<div style="font-size:12.5px;color:var(--ink-500);margin-top:6px;">Hành trình tiếp tục ngay tại đây — bước tiếp theo: <b style="color:${tone};">${nextLabel}</b>. Không cần tìm lại yêu cầu trong danh sách.</div>`:''}
  </div>`;
})() : '';

shell('Yêu cầu bảo hiểm đã nộp','Không gian theo dõi yêu cầu đã nộp', hdr+tabBar+notiBanner+routedBanner+body, {startSale:false});

window.viewVersion=function(v){ if(String(v)!==String(caseVer)) alert('Xem snapshot phiên bản V'+v+' (demo). Bản đã nộp cũ được giữ nguyên.'); };
window.compareVersions=function(id){
 const m=BANCA.caseMeta(id); const root=document.getElementById('start-sale-root')||document.body;
 const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 d.innerHTML=`<div class="modal2" style="max-width:560px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>So sánh phiên bản — ${id}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><thead><tr><th>Trường</th><th>V1</th><th>V${m.currentVersion}</th></tr></thead><tbody>${m.compare.map(c=>`<tr><td style="color:var(--ink-500);">${c.field}</td><td>${c.v1}</td><td style="color:var(--teal-600);font-weight:600;">${c.v2}</td></tr>`).join('')}</tbody></table>
   <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">Bản V1 đã nộp được giữ nguyên; V${m.currentVersion} là bản bổ sung. Thay đổi có version + actor + timestamp.</div>
 </div></div>`;
 root.appendChild(d);
};

// ===== P0-8 handlers =====
function toastPay(msg, ok){
 const t=document.getElementById('pay-toast');
 if(t) t.innerHTML=`<div class="alert2 ${ok?'info':'danger'}" style="margin-top:10px;">${msg}</div>`;
}
window.sendConfirm = function(){
 BANCA.patchApp(app.id,{status:'PENDING_CUSTOMER_CONFIRM',todo:'Theo dõi khách xác nhận (link đã gửi)',updatedAt:'2026-07-20 15:35',
  confirm:{link:'https://portal.janus.vn/c/'+app.id.toLowerCase(),sentAt:'2026-07-20 15:35',expiry:'2026-07-27 15:35',delivery:'DELIVERED',otp:'PENDING'}});
 alert('Đã gửi link xác nhận cho khách. Trạng thái → Chờ khách xác nhận.');
 location.href='?id='+app.id+'&tab=confirm';
};
// P0.4b — mô phỏng kết quả thẩm định (nút demo từng bước). Kết quả đến từ risk answers, KHÔNG từ demoMode.
window.simulateUw = function(decision){
 const officer='UW '+['An','Bình','Chi'][Math.floor(Math.random()*3)];
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const letter='UW-LETTER-'+app.id;
 if(decision==='REJECTED'){
  BANCA.patchApp(app.id,{status:'REJECTED',todo:'Yêu cầu bị từ chối',updatedAt:now,
   uw:{decision:'REJECTED',officer,decidedAt:now,letter,customerViewed:false,reason:'Yêu cầu không đạt điều kiện thẩm định theo yếu tố rủi ro.'}});
  alert('Kết quả thẩm định: TỪ CHỐI (demo). Chỉ hiển thị lý do được phép chia sẻ với khách.');
  location.href='?id='+app.id+'&tab=uw'; return;
 }
 if(decision==='APPROVED'){
  BANCA.patchApp(app.id,{status:'PAYMENT_METHOD_REQUIRED',todo:'Khởi tạo thanh toán',updatedAt:now,
   uw:{decision:'APPROVED',officer,decidedAt:now,letter,customerViewed:true,reason:'Đủ điều kiện, không điều chỉnh phí.'}});
  alert('Kết quả: DUYỆT — không điều chỉnh. Chuyển sang chọn cách thanh toán.');
  location.href='?id='+app.id+'&tab=payment'; return;
 }
 // APPROVED_WITH_CONDITION — tính phí mới từ risk answers (firm quote).
 const uw=BANCA.motorRiskRating(app.riskAnswers||{});
 let newPremium=app.premium;
 if(app.quote && app.quote.inputsSnapshot){
  const s=app.quote.inputsSnapshot;
  const res=BANCA.computeFirmQuote('motor',{packageCode:s.packageCode,sumInsured:s.sumInsured,termMonths:12,addOns:s.addOns||[],deductible:s.deductible,ncdPercent:s.ncdPercent||0,vehicleAgeYears:s.vehicleAgeYears||0,riskAnswers:app.riskAnswers||{}},
    BANCA.makeQuoteSnapshot({quoteType:'INDICATIVE',productId:'motor',premium:app.premium,basePremium:app.premium}));
  newPremium=res.quote.premium;
 }
 const loadingAmt=newPremium-app.premium;
 BANCA.patchApp(app.id,{status:'UW_DECIDED',todo:'Gửi khách xác nhận điều kiện',updatedAt:now,
  uw:{decision:'APPROVED_WITH_CONDITION',officer,decidedAt:now,letter,customerViewed:false,
      loading: loadingAmt>0?BANCA.vnd(loadingAmt):null,
      condition:(uw.flags.conditions||[]).join(' '),
      reason:'Chấp thuận có điều kiện theo yếu tố rủi ro khai báo.',
      newPremium:newPremium}});
 alert('Kết quả: DUYỆT CÓ ĐIỀU KIỆN (demo). Phí điều chỉnh '+BANCA.vnd(newPremium)+' — cần gửi khách xác nhận trước khi thanh toán.');
 location.href='?id='+app.id+'&tab=uw';
};
// P0.4b — mô phỏng khách xác nhận điều kiện → mở Thanh toán.
window.simConfirm = function(){
 BANCA.patchApp(app.id,{status:'PAYMENT_METHOD_REQUIRED',todo:'Khởi tạo thanh toán',updatedAt:'2026-07-23 '+new Date().toTimeString().slice(0,5),
  confirm:Object.assign({},app.confirm||{},{otp:'VERIFIED',confirmedAt:'2026-07-23 '+new Date().toTimeString().slice(0,5)})});
 alert('Khách đã xác nhận điều kiện (demo) → chọn cách thanh toán.');
 location.href='?id='+app.id+'&tab=payment';
};
// §sau nộp — mô phỏng kết quả thẩm định 1 thành viên; đổi dữ liệu 1 người chỉ ảnh hưởng người đó.
window.healthMemberUw = function(id, unitId, decision){
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const members=(app.insuredMembers||[]).map(function(m){return Object.assign({},m);});
 const t=members.find(function(m){return m.insuredUnitId===unitId;});
 if(t){ t.underwriting=Object.assign({}, t.underwriting||{}, {decision:decision, decidedAt:now, label:(BANCA.HEALTH_UW_MEMBER[decision]||{}).label||decision, paymentAllowed: decision!=='REJECTED'&&decision!=='IN_UW'&&decision!=='NEED_MORE_INFO'}); }
 app.insuredMembers=members;
 const overall=BANCA.healthDeriveOverallUw(app);
 const patch={insuredMembers:members, updatedAt:now};
 if(overall.code==='READY_PAYMENT'){ patch.status='PAYMENT_METHOD_REQUIRED'; patch.underwritingStatus='DECIDED'; patch.paymentStatus='METHOD_REQUIRED'; patch.underwritingDecision='APPROVED_STP'; patch.todo='Khởi tạo thanh toán'; if(!app.stpDecision){ const s=BANCA.makeStpDecision('health',{decidedAt:now,applicationId:id}); if(!s.error) patch.stpDecision=s; } }
 else if(overall.code==='NEED_MORE_INFO'){ patch.status='NEED_MORE_INFO'; patch.todo='Bổ sung theo yêu cầu thẩm định'; }
 else { patch.status='PENDING_UW'; }
 BANCA.patchApp(id, patch);
 location.href='?id='+id+'&tab=uw';
};
// §OTP — Member Confirmation Package: gửi xác nhận per-member (mỗi người 1 session).
window.healthMemberConfirm = function(id, unitId, action){
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const members=(app.insuredMembers||[]).map(function(m){return Object.assign({},m);});
 const t=members.find(function(m){return m.insuredUnitId===unitId;});
 if(t){ t.confirmation=Object.assign({}, t.confirmation||{}, action==='send'?{status:'SENT',sentAt:now,otp:'PENDING'}:{status:'CONFIRMED',otp:'VERIFIED',confirmedAt:now}); }
 app.insuredMembers=members;
 BANCA.patchApp(id, {insuredMembers:members, updatedAt:now});
 location.href='?id='+id+'&tab=confirm';
};
window.healthMemberConfirmAll = function(id){
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const members=(app.insuredMembers||[]).map(function(m){ if(m.active===false) return m; const c=Object.assign({},m); c.confirmation=Object.assign({},c.confirmation||{},{status:'SENT',sentAt:now,otp:'PENDING'}); return c; });
 BANCA.patchApp(id, {insuredMembers:members, updatedAt:now});
 alert('Đã gửi gói xác nhận cho từng thành viên (mỗi người 1 phiên OTP/e-sign riêng).');
 location.href='?id='+id+'&tab=confirm';
};
// §5 — 3 cách thanh toán HIỂN THỊ TRỰC TIẾP: click 1 card → mở THẲNG flow tương ứng (KHÔNG có bước "Chọn cách thanh toán").
// Payment intent chỉ được tạo khi nhân viên tư vấn xác nhận cấu hình trong flow (nút "Tạo…").
window.openPayFlow = function(experience){
 // §III/AC-09 — chỉ mở khi resolver cho phép khởi tạo thanh toán.
 if(!BANCA.deriveCaseViewState(app).canInitiatePayment){ alert('Chưa đủ điều kiện khởi tạo thanh toán (chưa xác nhận đủ / chưa được duyệt / đã có yêu cầu thanh toán).'); return; }
 const amount=cpAmount();
 const c=BANCA.customerById(app.customerId)||{};
 const root=document.getElementById('start-sale-root')||document.body;
 const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 const heads={CUSTOMER_PRESENT_QR:'Quét QR tại quầy', CUSTOMER_REMOTE:'Gửi yêu cầu thanh toán từ xa', SELLER_DEVICE_ASSISTED:'Thanh toán trên thiết bị này'};
 let inner;
 if(experience==='CUSTOMER_PRESENT_QR'){
  inner=`<div class="card" style="padding:14px;"><table class="dtable"><tbody><tr><td>Số tiền</td><td><b>${BANCA.vnd(amount)}</b></td></tr><tr><td>Mã tham chiếu</td><td class="code">MR-${app.id}</td></tr><tr><td>Hết hạn</td><td>2026-07-24 11:30</td></tr></tbody></table><div style="font-size:11.5px;color:var(--ink-500);margin-top:8px;">Sau khi tạo, hệ thống hiển thị mã QR để khách quét. Kết quả thanh toán do cổng thanh toán trả về.</div><button class="btn btn-primary" style="margin-top:12px;" onclick="createPaymentIntent({experience:'CUSTOMER_PRESENT_QR',instrument:'QR',delivery:'NONE'})">Tạo mã QR thanh toán</button></div>`;
 } else if(experience==='CUSTOMER_REMOTE'){
  inner=`<div class="card" style="padding:14px;"><div style="display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;margin-top:2px;"><label>Kênh gửi</label><select id="pay-delivery" onchange="document.getElementById('pay-recipient').value=this.value==='EMAIL'?'${c.email||'khach@email.vn'}':'${c.phone||''}'" style="padding:8px;border:1px solid var(--line);border-radius:7px;"><option value="SMS">SMS</option><option value="EMAIL">Email</option><option value="COPY_LINK">Sao chép liên kết</option></select><label>Người nhận</label><input id="pay-recipient" value="${c.phone||''}" style="padding:8px;border:1px solid var(--line);border-radius:7px;"><label>Đồng ý</label><label style="font-size:12.5px;"><input id="pay-consent" type="checkbox"> Khách đồng ý nhận yêu cầu thanh toán</label><label>Liên kết hết hạn</label><input value="2026-07-24 11:30" readonly style="padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);"><label>Xem trước tin nhắn</label><textarea readonly style="padding:8px;border:1px solid var(--line);border-radius:7px;font-family:inherit;">Janus Bank: Yeu cau ${app.id} can thanh toan ${BANCA.vnd(amount)}. Link het han 2026-07-24 11:30.</textarea></div><button class="btn btn-primary" style="margin-top:12px;" onclick="if(!document.getElementById('pay-consent').checked){document.getElementById('pay-consent').focus();return;}createPaymentIntent({experience:'CUSTOMER_REMOTE',instrument:'BANK_TRANSFER',delivery:document.getElementById('pay-delivery').value,recipient:document.getElementById('pay-recipient').value})">Tạo và gửi yêu cầu thanh toán</button></div>`;
 } else {
  inner=`<div class="card" style="padding:14px;"><div style="display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:center;margin-top:2px;"><label>Người thanh toán</label><input id="payer-name" value="${c.name||''}" style="padding:8px;border:1px solid var(--line);border-radius:7px;"><label>Quan hệ</label><input id="payer-rel" value="Bên mua bảo hiểm" style="padding:8px;border:1px solid var(--line);border-radius:7px;"><label>Hình thức</label><select id="pay-instrument" style="padding:8px;border:1px solid var(--line);border-radius:7px;"><option value="CARD">Thẻ</option><option value="BANK_ACCOUNT">Tài khoản ngân hàng</option></select><label>Dữ liệu nhạy cảm</label><div class="alert2 warn" style="margin:0;">Khách tự nhập trên cổng thanh toán. Nhân viên tư vấn không nhìn thấy số thẻ/tài khoản và không được tự xác nhận thành công.</div><label>Mã OTP</label><div class="alert2 info" style="margin:0;">Khách xác nhận OTP trên cổng thanh toán.</div></div><button class="btn btn-primary" style="margin-top:12px;" onclick="createPaymentIntent({experience:'SELLER_DEVICE_ASSISTED',instrument:document.getElementById('pay-instrument').value,delivery:'NONE',payerName:document.getElementById('payer-name').value,payerRelationship:document.getElementById('payer-rel').value})">Tạo phiên thanh toán</button></div>`;
 }
 d.innerHTML=`<div class="modal2" style="max-width:620px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>${heads[experience]||'Thanh toán'} — ${BANCA.vnd(amount)}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">${inner}<div style="margin-top:10px;text-align:right;"><button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay2').remove()">Hủy</button></div></div></div>`;
 root.appendChild(d);
};
// Chi tiết 1 giao dịch trong lịch sử thanh toán (row → modal, KHÔNG lặp bảng key-value dưới bảng).
window.openTxnDetail = function(){
 const pay=app.payment; if(!pay) return;
 const root=document.getElementById('start-sale-root')||document.body;
 const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 const rowT=(k,v)=>`<tr><td style="color:var(--ink-500);width:180px;font-size:12.5px;">${k}</td><td style="font-size:13px;">${v}</td></tr>`;
 const techRows=[['Payment ID',pay.paymentId||'—'],['Experience',pay.paymentExperience||'—'],['Payment instrument',pay.paymentInstrument||'—'],['Delivery channel',pay.deliveryChannel||'NONE'],['Merchant reference',pay.merchantReference||'—'],['Gateway reference',pay.gatewayReference||'—'],['Gateway transaction ID',pay.gatewayTransactionId||'—'],['Status',pay.status]].map(function(x){return rowT(x[0],'<span class="code">'+x[1]+'</span>');}).join('');
 d.innerHTML=`<div class="modal2" style="max-width:560px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Chi tiết giao dịch — ${pay.gatewayTransactionId||pay.gatewayReference||pay.merchantReference||pay.paymentId}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <table class="dtable"><tbody>
     ${rowT('Số tiền', BANCA.vnd(pay.amount)+' '+(pay.currency||'VND'))}
     ${rowT('Cách thanh toán', cpMethodVN(pay))}
     ${rowT('Người thanh toán', (pay.payerName||(cust&&cust.name)||'—')+(pay.payerType==='CUSTOMER'?' · Khách hàng':''))}
     ${rowT('Trạng thái', BANCA.paymentBadge?BANCA.paymentBadge(pay.status):cpStatusVN(pay.status))}
     ${rowT('Thời gian', pay.paidAt||pay.createdAt||'—')}
     ${pay.expiresAt?rowT('Hết hạn', pay.expiresAt):''}
   </tbody></table>
   <details style="margin-top:10px;"><summary style="cursor:pointer;font-size:12px;color:var(--ink-500);">Chi tiết kỹ thuật</summary><table class="dtable"><tbody>${techRows}</tbody></table></details>
 </div></div>`;
 root.appendChild(d);
};
window.createPaymentIntent = function(cfg){
 // AC-13/§VIII — chống tạo nhiều active payment intent cho cùng application.
 if(app.payment && ['PENDING','PROCESSING'].includes(app.payment.status)){
  alert('Đã có yêu cầu thanh toán đang xử lý — không tạo trùng. Theo dõi hoặc hủy trước khi tạo mới.');
  location.href='?id='+app.id+'&tab=payment'; return;
 }
 if(app.payment && app.payment.status==='SUCCESS'){ alert('Yêu cầu đã thanh toán.'); return; }
 // AC-09 — chỉ tạo khi đủ điều kiện.
 if(!BANCA.deriveCaseViewState(app).canCreatePaymentIntent){ alert('Chưa đủ điều kiện tạo yêu cầu thanh toán.'); return; }
 const amount=(app.uw&&app.uw.newPremium)||(app.quote&&(app.quote.premium||app.quote.adjustedPremium||app.quote.totalPremium))||app.premium||0;
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const channel = cfg.instrument==='QR' ? 'QR' : (cfg.experience==='CUSTOMER_REMOTE' ? 'PAYMENT_LINK' : cfg.instrument);
 const merchantReference='MR-'+app.id+'-'+Math.floor(1000+Math.random()*9000);
 const intent = BANCA.makePayment({
   applicationId:app.id, amount:amount, paymentChannel:channel, paymentInstrument:cfg.instrument, paymentExperience:cfg.experience,
   paymentInitiator:'SELLER', payerType:'CUSTOMER', payerName:cfg.payerName||(cust||{}).name||app.customerName||null,
   payerRelationship:cfg.payerRelationship||null,
   recipientPhone: (cfg.experience==='CUSTOMER_REMOTE'&&cfg.delivery!=='EMAIL'&&cfg.delivery!=='COPY_LINK')?(cfg.recipient||((cust||{}).phone||null)):null,
   recipientEmail: (cfg.experience==='CUSTOMER_REMOTE'&&cfg.delivery==='EMAIL')?(cfg.recipient||((cust||{}).email||'khach@email.vn')):null,
   deliveryChannel: cfg.delivery||'NONE',
   paymentUrl: (channel==='PAYMENT_LINK')?('https://pay.janus.vn/'+String(app.id).toLowerCase()):null,
   qrPayload: (cfg.instrument==='QR')?('00020101021238570010A0000007270127...'+String(app.id).slice(-4)):null,
   merchantReference:merchantReference,
   gatewayReference:null,
   expiresAt:'2026-07-24 11:30', status:'PENDING', createdAt:now
 });
 BANCA.patchApp(app.id,{status:'PENDING_PAYMENT', paymentStatus:'PENDING', payment:intent, todo:'Khách hoàn tất thanh toán',
   paymentInitAt:now, updatedAt:now});
 location.href='?id='+app.id+'&tab=payment';
};
// §6 — mô phỏng callback thanh toán (SUCCESS/FAILED/EXPIRED). Không phải nhân viên tư vấn tự đánh dấu.
window.settlePayment = function(result){
 if(!app.payment || app.payment.status!=='PENDING'){ alert('Không có yêu cầu thanh toán đang chờ.'); return; }
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const pay=Object.assign({}, app.payment);
 if(result==='FAILED' || result==='EXPIRED'){
  pay.status=result;
  BANCA.patchApp(app.id,{payment:pay,paymentStatus:result,updatedAt:now,todo:result==='EXPIRED'?'Yêu cầu thanh toán hết hạn — tạo lại':'Thanh toán thất bại — thử lại'});
  alert(result==='EXPIRED'?'Yêu cầu thanh toán đã hết hạn (demo).':'Thanh toán thất bại (demo).');
  location.href='?id='+app.id+'&tab=payment'; return;
 }
 // §IX — SUCCESS → POLICY_ISSUING → POLICY_ISSUED (payment giữ SUCCESS).
 pay.status='SUCCESS'; pay.paidAt=now; pay.gatewayTransactionId=pay.gatewayTransactionId||('GTW-'+Math.floor(100000+Math.random()*899999)); pay.gatewayReference=pay.gatewayReference||('AUTH-'+Math.floor(10000+Math.random()*89999));
 const polId=BANCA.genPolicyNo?BANCA.genPolicyNo(app.productId):('JB-POL-2026-0'+Math.floor(Math.random()*900+100));
 const certNo=BANCA.genCertNo?BANCA.genCertNo(app.productId):('CERT-'+polId.slice(7));
 const effFrom=app.effectiveDate||'2026-07-23';
 const termMonths=(app.productId==='health'?(healthPkg(app.package).termMonths||12):(paPkg(app.package).termMonths||12));
 const effTo=(app.productId==='pa'||app.productId==='health')?addMonths(effFrom,termMonths):'2027-07-22';
 const c0=BANCA.customerById(app.customerId)||{};
 const paPolicyFields = app.productId==='pa' ? {
   productType:'pa', productId:'pa', packageCode:app.package, productName:app.productName,
   policyholder:{name:c0.name,cif:c0.cif,phone:c0.phone,email:c0.email,identityNumber:c0.idNumber},
   insuredPerson:{name:app.insuredName||c0.name,dob:(app.buyerIsInsured!==false?c0.dob:app.insuredDob),identityNumber:app.insuredIdentityNumber||c0.idNumber,occupationCode:app.occupationCode||'OFFICE_ADMIN',occupationClass:app.occupationClass||'CLASS_1',contact:c0.phone,relationship:app.buyerIsInsured===false?(app.relationship||'Khác'):'Bản thân'},
   beneficiary:app.beneficiary||null,
   coverage:Object.assign({},paPkg(app.package),{packageCode:app.package}),
   exclusions:(paPkg(app.package).exclusions||[]),
   specialConditions:(app.stpDecision&&app.stpDecision.conditions)||[],
   territorialScope:(paPkg(app.package).territory||'Việt Nam')
 } : {};
 const healthPolicyFields = app.productId==='health' ? {
   productType:'health', productId:'health', packageCode:app.package, productName:app.productName,
   policyholder:{name:c0.name,cif:c0.cif,phone:c0.phone,email:c0.email,identityNumber:c0.idNumber},
   insuredMembers:BANCA.healthUnitsOf(app).filter(function(m){return m.active!==false;}).map(function(m,mi){return {name:m.name,dob:m.dob,age:m.age,relationship:m.relationship,identityNumber:m.identityNumber||null,package:m.package,isChild:m.isChild,guardianName:m.guardianName||null,underwriting:m.underwriting||null,certificateNumber:'GCN-'+String(certNo).slice(-4)+'-'+String(mi+1).padStart(2,'0')};}),
   coverage:Object.assign({},healthPkg(app.package),{packageCode:app.package}),
   exclusions:(healthPkg(app.package).exclusions||[]),
   specialConditions:(app.stpDecision&&app.stpDecision.conditions)||[],
   territorialScope:(healthPkg(app.package).territory||'Việt Nam')
 } : {};
 // Bước 1: thanh toán thành công + bắt đầu phát hành.
 BANCA.patchApp(app.id,{paymentStatus:'SUCCESS',policyStatus:'ISSUING',status:'PENDING_ISSUE',payment:pay,todo:'Đang phát hành',updatedAt:now});
 if(BANCA.addPolicyDemo) BANCA.addPolicyDemo(Object.assign({id:polId,certificate:certNo,owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:pay.amount,issueDate:'2026-07-23',effectiveFrom:effFrom,effectiveTo:effTo,status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:(app.productId==='pa'||app.productId==='health')?null:(app.vehicle||{}),payment:Object.assign({},pay),billing:[{date:'2026-07-23',amount:pay.amount,method:pay.paymentInstrument||pay.paymentChannel,ref:pay.gatewayTransactionId||pay.gatewayReference,status:'SUCCESS'}]}, paPolicyFields, healthPolicyFields));
 // Bước 2: hoàn tất phát hành (mock core).
 BANCA.patchApp(app.id,{status:'ISSUED',policyStatus:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:now});
 location.href='?id='+app.id+'&tab=policy';
};
// §IX — thử phát hành lại (payment giữ SUCCESS, không thu lại tiền).
window.retryIssue = function(){
 if(!(app.payment&&app.payment.status==='SUCCESS')){ alert('Chưa có thanh toán thành công.'); return; }
 const now='2026-07-23 '+new Date().toTimeString().slice(0,5);
 const polId=BANCA.genPolicyNo?BANCA.genPolicyNo(app.productId):('JB-POL-2026-0'+Math.floor(Math.random()*900+100));
 const certNo=BANCA.genCertNo?BANCA.genCertNo(app.productId):('CERT-'+polId.slice(7));
 const effFrom=app.effectiveDate||'2026-07-23';
 const effTo=(app.productId==='pa'||app.productId==='health')?addMonths(effFrom,(app.productId==='health'?(healthPkg(app.package).termMonths||12):(paPkg(app.package).termMonths||12))):'2027-07-22';
 const c0=BANCA.customerById(app.customerId)||{};
 const paPolicyFields = app.productId==='pa' ? {
   productType:'pa', productId:'pa', packageCode:app.package, policyholder:{name:c0.name,cif:c0.cif,phone:c0.phone,email:c0.email,identityNumber:c0.idNumber},
   insuredPerson:{name:app.insuredName||c0.name,dob:(app.buyerIsInsured!==false?c0.dob:app.insuredDob),identityNumber:app.insuredIdentityNumber||c0.idNumber,occupationCode:app.occupationCode||'OFFICE_ADMIN',occupationClass:app.occupationClass||'CLASS_1',contact:c0.phone,relationship:app.buyerIsInsured===false?(app.relationship||'Khác'):'Bản thân'},
   coverage:Object.assign({},paPkg(app.package),{packageCode:app.package}), exclusions:(paPkg(app.package).exclusions||[]), specialConditions:(app.stpDecision&&app.stpDecision.conditions)||[], territorialScope:(paPkg(app.package).territory||'Việt Nam')
 } : {};
 const healthPolicyFields = app.productId==='health' ? {
   productType:'health', productId:'health', packageCode:app.package, productName:app.productName,
   policyholder:{name:c0.name,cif:c0.cif,phone:c0.phone,email:c0.email,identityNumber:c0.idNumber},
   insuredMembers:BANCA.healthUnitsOf(app).filter(function(m){return m.active!==false;}).map(function(m,mi){return {name:m.name,dob:m.dob,age:m.age,relationship:m.relationship,identityNumber:m.identityNumber||null,package:m.package,isChild:m.isChild,guardianName:m.guardianName||null,underwriting:m.underwriting||null,certificateNumber:'GCN-'+String(certNo).slice(-4)+'-'+String(mi+1).padStart(2,'0')};}),
   coverage:Object.assign({},healthPkg(app.package),{packageCode:app.package}), exclusions:(healthPkg(app.package).exclusions||[]), specialConditions:(app.stpDecision&&app.stpDecision.conditions)||[], territorialScope:(healthPkg(app.package).territory||'Việt Nam')
 } : {};
 BANCA.patchApp(app.id,{status:'ISSUED',policyStatus:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:now});
 if(BANCA.addPolicyDemo) BANCA.addPolicyDemo(Object.assign({id:polId,certificate:certNo,owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:app.payment.amount,issueDate:'2026-07-23',effectiveFrom:effFrom,effectiveTo:effTo,status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:(app.productId==='pa'||app.productId==='health')?null:(app.vehicle||{}),payment:Object.assign({},app.payment),billing:[]}, paPolicyFields, healthPolicyFields));
 location.href='?id='+app.id+'&tab=policy';
};
// Tạo lại yêu cầu thanh toán khi hết hạn/hủy.
window.recreatePaymentIntent = function(){
 BANCA.patchApp(app.id,{status:'PAYMENT_METHOD_REQUIRED',paymentStatus:'METHOD_REQUIRED',payment:null,todo:'Khởi tạo thanh toán',updatedAt:'2026-07-23 '+new Date().toTimeString().slice(0,5)});
 location.href='?id='+app.id+'&tab=payment';
};
// Thu hồi yêu cầu — modal in-page (chỉ cho phép khi vừa nộp, chưa tiếp nhận/UW/payment/issue)
window.withdrawCase = function(id){
 const root=document.getElementById('start-sale-root')||document.body;
 const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 d.innerHTML=`<div class="modal2" style="max-width:480px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Thu hồi yêu cầu ${id}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <div style="font-size:13px;color:var(--ink-700);margin-bottom:8px;">Chỉ thu hồi được khi yêu cầu chưa được đơn vị bảo hiểm tiếp nhận. Yêu cầu sẽ chuyển <b>WITHDRAWN</b>, giữ nguyên lịch sử; có thể tạo bản nháp mới từ snapshot.</div>
   <div class="field"><label style="font-size:12px;color:var(--ink-500);">Lý do thu hồi *</label><textarea id="wd-reason" style="width:100%;min-height:70px;padding:9px;border:1px solid var(--line);border-radius:8px;font-family:inherit;font-size:13px;" placeholder="VD: Khách đổi ý / nhập sai thông tin xe…"></textarea></div>
   <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;"><button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay2').remove()">Hủy</button><button class="btn btn-primary btn-sm" style="background:var(--red-600);" onclick="withdrawConfirm('${id}',this)">Xác nhận thu hồi</button></div>
 </div></div>`;
 root.appendChild(d);
};
window.withdrawConfirm = function(id, btn){
 const reason=(document.getElementById('wd-reason').value||'').trim();
 if(!reason){ document.getElementById('wd-reason').style.borderColor='var(--red-600)'; return; }
 const modal=btn.closest('.modal-overlay2');
 modal.querySelector('.modal2-body').innerHTML=`<div style="text-align:center;padding:14px;">
   <div style="font-size:15px;font-weight:700;color:var(--teal-600);">✓ Đã thu hồi hồ sơ</div>
   <div style="font-size:12.5px;color:var(--ink-500);margin:8px 0;">${id} · Phiên bản 1 → <b>WITHDRAWN</b><br>Lịch sử được giữ nguyên. Có thể tạo bản nháp mới (Phiên bản 2 · DRAFT) từ snapshot cũ.</div>
   <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay2').remove()">Đóng</button>
   <button class="btn btn-primary btn-sm" onclick="alert('Tạo bản nháp mới từ snapshot (demo)')">Tạo bản nháp mới</button>
 </div>`;
};
window.payDemo = function(method){
 // §10 — chống thanh toán trùng (idempotency): đã SUCCESS/ISSUED thì không cho thanh toán lại.
 if(app.status==='ISSUED' || (app.payment && app.payment.status==='SUCCESS')){
  alert('Yêu cầu đã thanh toán/đã phát hành — không thể thanh toán lại (chống trùng).'); return;
 }
 // §10 — chỉ cho thanh toán khi đủ điều kiện (APPROVED_FOR_BIND / đã duyệt). Nhân viên tư vấn không tự đánh dấu.
 if(!['PENDING_PAYMENT','PAID'].includes(app.status)){
  alert('Chưa đủ điều kiện thanh toán — yêu cầu phải được duyệt phát hành trước.'); return;
 }
 const amount=(app.uw&&app.uw.newPremium)||app.premium;
 if(method==='QR'){
  const polId=BANCA.genPolicyNo?BANCA.genPolicyNo(app.productId):('JB-POL-2026-0'+Math.floor(Math.random()*900+100));
  const certNo=BANCA.genCertNo?BANCA.genCertNo(app.productId):('CERT-'+polId.slice(7));
  BANCA.patchApp(app.id,{status:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:'2026-07-20 15:40',
   payment:{method,reference:'PAY-2026-'+Math.floor(Math.random()*9000+1000),amount,status:'SUCCESS',paidAt:'2026-07-20 15:40',txnRef:'TXN-'+Math.floor(Math.random()*90000+10000)}});
  BANCA.addPolicyDemo({id:polId,certificate:certNo,owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:amount,issueDate:'2026-07-20',effectiveFrom:'2026-07-20',effectiveTo:'2027-07-19',status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:app.vehicle||{},billing:[{date:'2026-07-20',amount,method,ref:'TXN-demo',status:'SUCCESS'}]});
  location.href='?id='+app.id+'&tab=policy';
 } else if(method==='CARD'){
  BANCA.patchApp(app.id,{updatedAt:'2026-07-20 15:40',payment:{method,reference:'PAY-2026-'+Math.floor(Math.random()*9000+1000),amount,status:'FAILED'}});
  alert('❌ Thanh toán thẻ thất bại (demo scenario) — bấm "Thử lại (Retry)" để thanh toán thành công.');
  location.reload();
 } else {
  BANCA.patchApp(app.id,{updatedAt:'2026-07-20 15:40',payment:{method,reference:'PAY-2026-'+Math.floor(Math.random()*9000+1000),amount,status:'TIMEOUT'}});
  alert('⏱ Chuyển khoản quá thời gian chờ (demo scenario) — có thể Retry.');
  location.reload();
 }
};
window.sendSms = function(){
 const cur=((BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{}).__smsLog||[];
 const now='2026-07-20 '+new Date().toTimeString().slice(0,5);
 BANCA.patchApp(app.id,{__smsLog:[...cur,now]});
 location.reload();
};
window.payRetry = function(){
 if(app.status==='ISSUED' || (app.payment && app.payment.status==='SUCCESS')){
  alert('Yêu cầu đã thanh toán/đã phát hành — không thể thanh toán lại (chống trùng).'); return;
 }
 const amount=(app.uw&&app.uw.newPremium)||app.premium;
 const polId=BANCA.genPolicyNo?BANCA.genPolicyNo(app.productId):('JB-POL-2026-0'+Math.floor(Math.random()*900+100));
 const certNo=BANCA.genCertNo?BANCA.genCertNo(app.productId):('CERT-'+polId.slice(7));
 BANCA.patchApp(app.id,{status:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:'2026-07-20 15:45',
  payment:{status:'SUCCESS',paidAt:'2026-07-20 15:45',txnRef:'TXN-'+Math.floor(Math.random()*90000+10000)}});
 BANCA.addPolicyDemo({id:polId,certificate:certNo,owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:amount,issueDate:'2026-07-20',effectiveFrom:'2026-07-20',effectiveTo:'2027-07-19',status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:app.vehicle||{},billing:[{date:'2026-07-20',amount,method:'CARD',ref:'TXN-retry',status:'SUCCESS'}]});
 location.href='?id='+app.id+'&tab=policy';
};
})();
