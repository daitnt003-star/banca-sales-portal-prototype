// Application Workspace — 1 module duy nhất: Edit Mode (draft, ?step=) + Tracking Mode (submitted, ?tab=)
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
     productId: off.productRef||'motor', productName: off.productName||'Motor Comprehensive', packageName: off.packageName||null,
     sourceAdviceId:adviceId, sourceAdviceVersion:(sourceAdvice&&sourceAdvice.version)||1,
     adviceNeed:(sourceAdvice&&sourceAdvice.primaryNeed)||null, adviceBudget:(sourceAdvice&&sourceAdvice.budgetBand)||null,
     adviceNote:(sourceAdvice&&sourceAdvice.advisorNote)||null, adviceSessionId:adviceId,
     leadId:(sourceAdvice&&sourceAdvice.leadId)||null, campaign:(sourceAdvice&&sourceAdvice.campaign)||null };
  } else {
   const prodId=qs.get('product')||(ctx&&ctx.productId)||'motor';
   const prodRec=(BANCA.products||[]).find(x=>x.id===prodId)||{name:'Motor Comprehensive'};
   const lead = qs.get('lead')? (BANCA.referrals||[]).find(rr=>rr.id===qs.get('lead')) : null;
   ctx = { mode:qs.get('mode')||(ctx&&ctx.mode)||'BANK_CUSTOMER',
     customerId:qs.get('customer')||(ctx&&ctx.customerId)||null,
     customerName: qs.get('pname')?decodeURIComponent(qs.get('pname')):((ctx&&ctx.customerName)||null),
     productId:prodId, productName:prodRec.name, packageName:(ctx&&ctx.packageName)||null,
     leadId: (lead&&lead.id)||(ctx&&ctx.leadId)||null, campaign:(lead&&lead.source)||(ctx&&ctx.campaign)||null,
     leadNeed:(lead&&lead.productInterest)||(ctx&&ctx.leadNeed)||null };
  }
  saveDraftCtx(ctx);
 }
 const prodRec=(BANCA.products||[]).find(x=>x.id===ctx.productId)||{name:ctx.productName||'Motor Comprehensive'};
 const firstStage = ctx.sourceAdviceId ? (ctx.productId==='motor'?'RISK_OBJECT':'CUSTOMER_INFO') : 'CUSTOMER_INFO';
 app = { id:'DRAFT-2026-NEW', submissionState:'NOT_SUBMITTED', owner:me,
   customerId:ctx.customerId||null, customerName:ctx.customerName||null,
   productId:ctx.productId||'motor', productName:prodRec.name||ctx.productName, package:ctx.packageName||null,
   currentStage: qs.get('step')||firstStage, progress:12, warnings:[], updatedAt:'vừa tạo',
   source: ctx.sourceAdviceId?'ADVICE':(ctx.mode||'BANK_CUSTOMER'), vehicle:null, quote:null, isNewDemo:true,
   sourceAdviceId:ctx.sourceAdviceId||null, sourceAdviceVersion:ctx.sourceAdviceVersion,
   adviceNeed:ctx.adviceNeed, adviceBudget:ctx.adviceBudget, adviceNote:ctx.adviceNote, adviceSessionId:ctx.adviceSessionId, leadId:ctx.leadId, campaign:ctx.campaign, leadNeed:ctx.leadNeed };
 if(ctx.sourceAdviceId && !sourceAdvice) sourceAdvice=(BANCA.adviceById&&BANCA.adviceById(ctx.sourceAdviceId))||null;
} else {
 app = BANCA.appById(appId);
}

if(!app){
 shell('Application Workspace','Không tìm thấy hồ sơ',`<div class="card"><div class="empty-state">Hồ sơ không tồn tại hoặc đã bị xóa. <a href="${r}modules/unsubmitted-applications/index.html">Về danh sách</a></div></div>`,{startSale:false});
 return;
}

const per = BANCA.personas[app.owner]||{};
const canView = app.owner===me
 || (p.managerScope==='TEAM' && per.team===p.team)
 || (p.managerScope==='BRANCH' && per.branch===p.branch);
if(!canView || p.status!=='ACTIVE'){
 shell('Application Workspace','ACCESS_DENIED',`<div class="card"><div class="alert2 danger"><b>ACCESS_DENIED</b><br>Persona <b>${me}</b> không có quyền truy cập hồ sơ <b>${app.id}</b> (owner: ${app.owner}). Data scope + trạng thái tài khoản được kiểm tra trên mọi route.</div></div>`,{startSale:false});
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
if(app.quote && app.quote.inputsSnapshot && app.quote.subtotal==null){
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
   <button class="btn btn-primary btn-sm" onclick="this.parentNode.innerHTML='<span class=\\'badge badge-ready\\'>Seller đã duyệt</span> <span class=\\'badge badge-conditional\\'>Chờ khách xác nhận</span>'">Xác nhận đã duyệt</button>
   <span style="font-size:11px;color:var(--ink-300);">OCR chỉ prefill — không thay cho KYC/xác minh.</span>
  </div>
 </div>`;
}
function attachedDocCard(dataUrl, name){
 return `<div class="card" style="padding:12px 14px;margin-bottom:12px;">
   <div style="font-size:12px;color:var(--ink-500);margin-bottom:8px;">📎 Tài liệu đã đính kèm hồ sơ (mục Tài liệu)</div>
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
      <div style="font-size:12.5px;color:var(--ink-500);margin:6px 0 10px;">Giá trị tính phí có 2 nguồn khác nhau. Chọn giá trị cho hồ sơ này (không ghi đè dữ liệu gốc).</div>
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
  d.innerHTML=`<div class="modal2" style="max-width:480px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Ngữ cảnh nguồn</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body"><table class="dtable"><tbody>${rows.map(([k,v])=>`<tr><td style="color:var(--ink-500);width:45%;">${k}</td><td><b>${v}</b></td></tr>`).join('')}</tbody></table><div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Truy vết: ${app.leadId?'Lead → ':''}${app.sourceAdviceId?'Tư vấn → ':''}Sales Session → Application.</div></div></div>`;
  root.appendChild(d);
};
const phoneCell=(c,idx)=> c? `<span id="ph-${idx}">${BANCA.maskPhone(c.phone)} <a href="javascript:revealPhone('ph-${idx}','${c.id}')" style="font-size:11px;">Hiện số</a></span>` : '—';
const idCell=(c,idx)=> c? `<span id="id-${idx}">${BANCA.maskId(c.idNumber)} ${c.idNumber?`<a href="javascript:revealId('id-${idx}','${c.id}')" style="font-size:11px;">Hiện CCCD</a>`:''}</span>` : '—';

// ===== P0-9/GCN helper (dùng chung tracking + policy preview) =====
function gcnPanel(a){
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
 // 2026-07-20 16:35 (user chốt): bước NĐBH tự động → ẨN HẲN khỏi stepper. Motor còn 6 bước hiển thị.
 const AUTO_STAGES = ['INSURED_PARTY'];
 const steps = BANCA.STAGES.filter(s=>!AUTO_STAGES.includes(s.id));
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
    stepBody = modeHead + `<div class="alert2 warn" style="margin-bottom:12px;">Khách hàng mới${app.sourceAdviceId?' (từ tư vấn)':''}: cần <b>consent</b> và định danh trước khi tạo hồ sơ chính thức. Tải/chụp CCCD ở mục Giấy tờ định danh để tự điền, hoặc nhập thủ công. OCR chỉ bóc tách dữ liệu, không thay cho KYC.</div>
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
 } else if(cur.id==='RISK_OBJECT'){
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
    <div style="font-size:12.5px;color:var(--ink-500);margin:4px 0 12px;">Chọn cách nhập. OCR KHÔNG lấy: giá trị xe · mục đích sử dụng · tình trạng thế chấp · lịch sử tổn thất (các mục này từ ngân hàng / định giá / seller nhập).</div>
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
    <div style="font-size:12.5px;color:var(--ink-500);margin:6px 0 10px;">Nguồn ngân hàng và OCR khác nhau. Chọn giá trị dùng cho hồ sơ (không ghi đè master).</div>
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
    <div style="font-size:10.5px;color:var(--ink-300);">Bên thụ hưởng nhập độc lập — không suy ra từ kênh bán (Seller).</div>
   </div>
   ${app.source==='RENEWAL'?'<div style="font-size:11px;color:var(--amber-600);margin-top:6px;">⚠ Hồ sơ tái tục: câu hỏi này PHẢI hỏi lại — không kế thừa từ kỳ trước.</div>':''}
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
 } else if(cur.id==='RISK_DECLARATION'){
  // Câu hỏi thế chấp ĐÃ GỠ khỏi đây (single source of truth ở bước Đối tượng bảo hiểm) — chỉ còn dòng derived read-only
  const mgD = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id]&&BANCA.overlay.applications[app.id].mortgage)||app.mortgage||{mortgaged:false};
  stepBody = `<div class="alert2 info" style="margin-bottom:12px;">Câu hỏi động theo sản phẩm (visibleWhen/requiredWhen) — chỉ gồm yếu tố ảnh hưởng xác suất tổn thất & định phí. Đổi câu trả lời có thể kích hoạt referral hoặc yêu cầu tài liệu — và làm báo giá cần tính lại.</div>
  <div class="card" style="padding:10px 14px;margin-bottom:8px;background:var(--paper);">
   <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;color:var(--ink-500);">
    <span>Tình trạng thế chấp <span class="chip" style="font-size:9px;">suy ra từ bước Đối tượng bảo hiểm</span></span>
    <b style="color:var(--ink-700);">${mgD.mortgaged?('Có — '+(mgD.bank||'')+' (bên thụ hưởng)'):'Không'}</b>
   </div>
  </div>
  ${[['Xe đã từng bị tai nạn / claim trong 24 tháng?','Có — 2 claim (kích hoạt UW loading)','warn'],['Xe dùng cho mục đích kinh doanh vận tải?','Không',''],['Khu vực đỗ xe thường xuyên có nguy cơ ngập?','Không','']].map(([q2,a2,k])=>`<div class="card" style="padding:12px 14px;margin-bottom:8px;"><div style="font-size:13px;color:var(--ink-900);">${q2}</div><div style="display:flex;gap:14px;margin-top:8px;font-size:12.5px;">
    <label><input type="radio" name="q${q2.length}" ${a2.startsWith('Có')?'checked':''} ${readOnly?'disabled':''} onchange="markStale()"> Có</label>
    <label><input type="radio" name="q${q2.length}" ${a2.startsWith('Không')?'checked':''} ${readOnly?'disabled':''} onchange="markStale()"> Không</label>
    ${k?`<span class="badge ${k==='warn'?'badge-conditional':'badge-pending'}" style="margin-left:auto;">${a2}</span>`:''}
   </div></div>`).join('')}`;
 } else if(cur.id==='DOCUMENTS'){
  // Ma trận tài liệu ●◐↻○ (doc 2026-07-20) — phân biệt bắt buộc / có điều kiện / kế thừa / không cần
  const ovA = (BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{};
  const mgDoc = ovA.mortgage||app.mortgage||{mortgaged:false};
  const uploaded = [...new Set([...(app.docsUploaded||[]),...(ovA.__docsUploaded||[])])];
  const ctx = {source:app.source, vehicleAgeYears:(app.quote&&app.quote.inputsSnapshot&&app.quote.inputsSnapshot.vehicleAgeYears)||(app.vehicle? 2026-(app.vehicle.year||2024):0), idv:(app.vehicle&&app.vehicle.value)||0, mortgage:mgDoc};
  const req = BANCA.docRequirements(ctx);
  const cellOf = r => r.status==='REQUIRED'? ['●','var(--red-600)','#fdecec','Bắt buộc']
   : r.status==='INHERITED'? ['↻','#2563eb','#eaf1fe','Kế thừa kỳ trước']
   : r.active? ['◐','var(--amber-600)','#fdf3e3','Bắt buộc (điều kiện đã kích hoạt)']
   : ['○','var(--ink-300)','var(--paper)','Không cần cho hồ sơ này'];
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
  const toDef = d => { const rr=req[d.code]; const need=rr.status==='REQUIRED'||(rr.status==='CONDITIONAL'&&rr.active); const om=ocrMap[d.code]||['none',null]; return {code:d.code, name:d.name, sub:(d.sub||'')+(rr.note?' · '+rr.note:''), ocr:om[0], required:need, docType:om[1]}; };
  const storeAll = BANCA.docAll(app.id);
  const isUploaded = code => !!(storeAll[code] && (storeAll[code].dataUrl||storeAll[code].fileName));
  const isOcr = code => !!(storeAll[code] && storeAll[code].ocrStatus);   // đã bóc tách OCR (CCCD, đăng ký xe)
  const requiredDone = needDocs.filter(d=>isUploaded(d.code)).length;
  const blocking = needDocs.filter(d=>!isUploaded(d.code));
  // Section "Tài liệu được OCR" — chỉ đọc, không cho thay thế
  const ocrDocs = BANCA.DOC_CATALOG.filter(d=>isOcr(d.code));
  const ocrSection = ocrDocs.length? `<div class="section-title" style="margin-top:0;"><h2>Tài liệu được OCR</h2><span class="subtitle">Bóc tách ở bước Khách hàng / Đối tượng bảo hiểm — chỉ xem, không thay thế tại đây</span></div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:8px;">${ocrDocs.map(d=>BANCA.docItemHtml(app.id, Object.assign(toDef(d),{locked:true}))).join('')}</div>` : '';
  const legendNote = `<div class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ink-500);">
    <div>Tài liệu bắt buộc: <b style="color:${blocking.length?'var(--red-600)':'var(--teal-600)'};">${requiredDone}/${needDocs.length}</b>${blocking.length?' · còn thiếu: '+blocking.map(d=>d.name).join(', '):' · đã đủ'}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;"><span><b style="color:var(--red-600);">●</b> Bắt buộc</span><span><b style="color:var(--amber-600);">◐</b> Có điều kiện</span><span><b style="color:var(--ink-300);">○</b> Không cần</span></div>
  </div>`;
  const reqRender = needDocs.filter(d=>!isOcr(d.code));   // OCR docs hiển thị ở section riêng
  const otherRender = otherDocs.filter(d=>!isUploaded(d.code) && !isOcr(d.code));
  stepBody = legendNote + ocrSection
   + `<div class="section-title" ${ocrDocs.length?'':'style="margin-top:0;"'}><h2>Tài liệu bắt buộc cho hồ sơ này</h2><span class="subtitle">Tài liệu đã tải hiển thị nút Xem / Thay thế; dòng còn thiếu ưu tiên xử lý trước khi nộp.</span></div>
      <div class="card" style="padding:0;overflow:hidden;">${reqRender.map(d=>BANCA.docItemHtml(app.id, toDef(d))).join('')||'<div class="empty-state" style="padding:20px;">Không có tài liệu bắt buộc.</div>'}</div>
      ${otherRender.length?`<div class="section-title"><h2>Tài liệu khác</h2><span class="subtitle">Không bắt buộc / kế thừa / bổ sung nếu cần</span></div>
      <div class="card" style="padding:0;overflow:hidden;">${otherRender.map(d=>BANCA.docItemHtml(app.id, toDef(d))).join('')}</div>`:''}
      <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">Chấp nhận PDF/JPG/PNG ≤ 10MB. OCR là capability của từng tài liệu; trạng thái upload/OCR/duyệt/xác minh tách riêng.${mgDoc.mortgaged?' <b style="color:var(--amber-600);">Xe thế chấp — bên thụ hưởng là bắt buộc.</b>':''}</div>`;
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
  const blockers=[];
  if(!cust) blockers.push({t:'Thông tin khách hàng chưa đủ', fix:'Bổ sung khách hàng', step:'CUSTOMER_INFO'});
  if(!app.vehicle) blockers.push({t:'Chưa nhập thông tin xe', fix:'Nhập thông tin xe', step:'RISK_OBJECT'});
  if(!q) blockers.push({t:'Chưa có báo giá', fix:'Tạo báo giá', step:'PACKAGE_AND_QUOTE'});
  else if(effQStatus==='EXPIRED') blockers.push({t:'Báo giá đã hết hạn — phải tính phí lại', fix:'Tính phí lại', step:'PACKAGE_AND_QUOTE'});
  else if(effQStatus==='STALE') blockers.push({t:'Thông tin thay đổi — phải tính phí lại', fix:'Tính phí lại', step:'PACKAGE_AND_QUOTE'});
  if(missingDocs.length) blockers.push({t:'Thiếu tài liệu bắt buộc: '+missingDocs.map(d=>d.name).join(', '), fix:'Bổ sung tài liệu', step:'DOCUMENTS'});
  if(mgR.mortgaged && !(mgR.bank&&mgR.creditContract)) blockers.push({t:'Xe thế chấp — thiếu thông tin bên thụ hưởng (ngân hàng + số HĐ tín dụng)', fix:'Bổ sung bên thụ hưởng', step:'RISK_OBJECT'});
  if(!caps.includes('can_submit')) blockers.push({t:'Bạn không có quyền nộp hồ sơ sản phẩm này', fix:'', step:''});
  const missing=blockers.map(b=>b.t);
  const okData = missing.length===0;
  const blockerBanner = blockers.length
   ? `<div class="card" style="padding:16px;margin-bottom:12px;border:1.5px solid var(--red-600);background:#fdecec;">
       <div style="font-size:15px;font-weight:800;color:var(--red-600);">🚫 Chưa thể nộp hồ sơ</div>
       <div style="font-size:12.5px;color:#8a2a2a;margin-top:2px;">Xử lý các mục dưới đây rồi quay lại bước này để nộp:</div>
       <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px;">
        ${blockers.map(b=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #f2c9c9;border-radius:8px;padding:9px 12px;"><div style="font-size:12.5px;color:var(--ink-700);">${b.t}</div>${b.fix?`<a class="btn btn-primary btn-sm" href="${stepLink(b.step)}">${b.fix} &rarr;</a>`:'<span style="font-size:11px;color:var(--ink-300);">Cần cấp quyền</span>'}</div>`).join('')}
       </div></div>`
   : `<div class="card" style="padding:12px 14px;margin-bottom:12px;border:1.5px solid var(--teal-600);background:#eefaf7;font-size:13px;color:var(--teal-600);font-weight:600;">✓ Hồ sơ đủ điều kiện nộp — chỉ cần tick 2 xác nhận bên dưới.</div>`;
  stepBody = blockerBanner + `<div class="card" style="padding:16px;">
   <div class="label">Tóm tắt hồ sơ</div>
   <table class="dtable"><tbody>
    <tr><td style="width:220px;color:var(--ink-500);font-size:12.5px;">Khách hàng</td><td>${cust?cust.name+' · '+(cust.cif||'prospect')+' · người được BH: chính chủ':'—'}</td></tr>
    <tr><td style="color:var(--ink-500);font-size:12.5px;">Sản phẩm / Gói</td><td>${app.productName}${app.package?' · '+app.package:''}</td></tr>
    <tr><td style="color:var(--ink-500);font-size:12.5px;">Xe</td><td>${app.vehicle?`${app.vehicle.brand} ${app.vehicle.model} ${app.vehicle.year} · ${app.vehicle.plate||'chưa có biển'} · ${app.vehicle.seats||5} chỗ · ${BANCA.vnd(app.vehicle.value)}`:'—'}</td></tr>
    <tr><td style="color:var(--ink-500);font-size:12.5px;">Phí bảo hiểm</td><td>${q?`${BANCA.vnd(q.adjustedPremium)}/năm (base ${BANCA.vnd(q.basePremium)} · ${q.id} v${q.version}) ${BANCA.quoteStatusBadge(effQStatus)}`:'—'}</td></tr>
    <tr><td style="color:var(--ink-500);font-size:12.5px;">Khai báo</td><td>4/4 câu hỏi đã trả lời · 1 câu kích hoạt lưu ý UW</td></tr>
   </tbody></table>
  </div>
  <div class="card" style="padding:16px;margin-top:12px;">
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;"><input type="checkbox" id="c1" ${readOnly?'disabled':''} onchange="refreshSubmitBtn()"> Khách hàng xác nhận thông tin kê khai là đúng và đầy đủ.</label>
   <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin-top:8px;"><input type="checkbox" id="c2" ${readOnly?'disabled':''} onchange="refreshSubmitBtn()"> Tôi (seller) xác nhận đã tư vấn đầy đủ quyền lợi, điều khoản loại trừ.</label>
   ${!readOnly?`<button class="btn btn-primary" id="submit-btn" style="margin-top:14px;opacity:.5;" disabled data-okdata="${okData?'1':'0'}" title="${missing.length?('Chưa thể nộp: '+missing.join(' · ')):'Cần tick đủ 2 xác nhận'}" onclick="submitApp('${app.id}')">Nộp hồ sơ</button>`:''}
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
   <div style="font-weight:700;color:var(--purple-600);">💡 Hồ sơ tạo từ Tư vấn nhanh ${app.sourceAdviceId}</div>
   <div style="font-size:13px;color:var(--ink-700);margin-top:4px;line-height:1.7;">
    Đã prefill <b>${app.productName}${app.package?' · '+app.package:''}</b>${app.adviceNeed?` · nhu cầu <b>${BANCA.needLabel(app.adviceNeed)}</b>`:''}${app.adviceBudget?` · ngân sách <b>${BANCA.budgetLabel(app.adviceBudget)}</b>`:''}${app.adviceSessionId?` · session <b>${app.adviceSessionId}</b>`:''} (tham chiếu).<br>
    ${app.adviceNote?`<span style="color:var(--ink-500);">Advisor note: <i>${app.adviceNote}</i></span><br>`:''}
    ⚠️ Không dùng phí minh họa làm phí chính thức — cần xác minh tuổi/nghề/giá trị tài sản và <b>tính lại phí</b> ở bước Gói &amp; phí. Không lặp lại bước khảo sát nhu cầu.
    <a href="${r}modules/advisory-workspace/index.html?id=${app.sourceAdviceId}&step=result" style="color:var(--purple-600);margin-left:4px;">Xem bản tư vấn →</a>
   </div>
  </div>` : '';
 shell('Hồ sơ chưa nộp','Lập hồ sơ yêu cầu bảo hiểm', hdr + adviceRefBanner + stepper + stepBody + `
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
  if(ok) b.title='Sẵn sàng nộp hồ sơ';
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
  BANCA.patchApp(id,{submissionState:'SUBMITTED',status:'PENDING_RECEIPT',submittedAt:'2026-07-20 '+new Date().toTimeString().slice(0,5),todo:'Chờ hệ thống tiếp nhận',premium:(app.quote&&app.quote.adjustedPremium)||app.premium,sla:'2026-07-21'});
  alert('Đã nộp hồ sơ '+id+' — trạng thái "Chờ tiếp nhận". Theo dõi tại Hồ sơ đã nộp.');
  location.href=r+'modules/submitted-applications/index.html';
 };
 return;
}

// ================================================================ TRACKING MODE
const st = app.status;
const activeTab = qs.get('tab')||'overview';
const tabs=[['overview','Tổng quan'],['customer','Khách hàng'],['quote','Gói & phí'],['declaration','Khai báo'],['documents','Tài liệu'],['uw','Thẩm định'],['confirm','Xác nhận KH'],['payment','Thanh toán'],['policy','Hợp đồng'],['history','Lịch sử']];
if(st==='NEED_MORE_INFO') tabs.splice(1,0,['supplement','⚠ Bổ sung']);

// ---- Submitted Case Workspace: status → phase / actions / next-action (view-only) ----
function casePhase(status){
 return ({PENDING_RECEIPT:'PENDING_INTAKE', PENDING_UW:'UW_PENDING', IN_UW:'UW_IN_PROGRESS',
  NEED_MORE_INFO:'NEED_MORE_INFORMATION', UW_DECIDED:'APPROVED_WITH_CONDITION',
  PENDING_CUSTOMER_CONFIRM:'CUSTOMER_RECONFIRMATION', PENDING_PAYMENT:'PAYMENT_PENDING',
  PAID:'PAID', PENDING_ISSUE:'PENDING_ISSUE', ISSUED:'ISSUED', REJECTED:'REJECTED', CANCELLED:'CANCELLED'})[status]||status;
}
const casePh = casePhase(st);
const supCount = (app.supplement&&app.supplement.items||[]).length;
function caseNextAction(){
 const M={
  PENDING_INTAKE:['Hồ sơ đang chờ đơn vị bảo hiểm tiếp nhận'+(app.sla?'. Dự kiến tiếp nhận trước '+app.sla:'')+'. Hiện chưa cần thao tác thêm.','wait'],
  UW_PENDING:['Hồ sơ đã tiếp nhận, đang chờ thẩm định.','wait'],
  UW_IN_PROGRESS:['Đang thẩm định — không cần hành động từ seller.','wait'],
  NEED_MORE_INFORMATION:['Cần bổ sung '+(supCount?('0'+supCount).slice(-2)+' nội dung':'thông tin')+(app.deadline?' trước '+app.deadline:'')+'.','danger'],
  APPROVED_WITH_CONDITION:['Duyệt có điều kiện — cần khách xác nhận lại trước khi thanh toán.','info'],
  CUSTOMER_RECONFIRMATION:['Chờ khách hàng xác nhận lại nội dung.','info'],
  PAYMENT_PENDING:['Khách cần hoàn tất thanh toán.','info'],
  PAID:['Đã thanh toán — chờ phát hành.','wait'],
  PENDING_ISSUE:['Core đang xử lý phát hành hợp đồng.','wait'],
  ISSUED:['Hợp đồng đã phát hành.','ok'],
  REJECTED:['Hồ sơ bị từ chối.','danger'],
  CANCELLED:['Hồ sơ đã hủy.','danger']
 };
 return M[casePh]||['Đang xử lý — theo dõi trạng thái.','wait'];
}
function getSubmittedCaseActions(){
 const A={
  view:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=customer">Xem hồ sơ đã nộp</a>`,
  pdf:`<button class="btn btn-secondary btn-sm" onclick="alert('Tải bản PDF hồ sơ (demo)')">Tải PDF</button>`,
  hist:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=history">Xem lịch sử</a>`,
  support:`<button class="btn btn-secondary btn-sm" onclick="alert('Yêu cầu hỗ trợ (demo)')">Yêu cầu hỗ trợ</button>`,
  withdraw:`<button class="btn btn-secondary btn-sm" style="color:var(--red-600);" onclick="withdrawCase('${app.id}')">Thu hồi hồ sơ</button>`,
  supplement:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=supplement">Bổ sung hồ sơ</a>`,
  seeReq:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=supplement">Xem yêu cầu</a>`,
  seeStatus:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=uw">Xem trạng thái</a>`,
  seeCond:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=uw">Xem điều kiện</a>`,
  sendConfirm:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=confirmpay">Gửi khách xác nhận</a>`,
  sendPay:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=confirmpay">Gửi link thanh toán</a>`,
  trackPay:`<a class="btn btn-secondary btn-sm" href="?id=${app.id}&tab=confirmpay">Theo dõi thanh toán</a>`,
  policy:`<a class="btn btn-primary btn-sm" href="?id=${app.id}&tab=policy">Xem hợp đồng</a>`,
  resend:`<button class="btn btn-secondary btn-sm" onclick="alert('Gửi lại cho khách (demo)')">Gửi lại cho khách</button>`
 };
 const P={
  PENDING_INTAKE:[A.view,A.pdf,A.hist,A.withdraw,A.support],
  UW_PENDING:[A.seeStatus,A.view,A.support], UW_IN_PROGRESS:[A.seeStatus,A.view,A.support],
  NEED_MORE_INFORMATION:[A.supplement,A.seeReq],
  APPROVED_WITH_CONDITION:[A.seeCond,A.sendConfirm], CUSTOMER_RECONFIRMATION:[A.seeCond,A.sendConfirm],
  PAYMENT_PENDING:[A.sendPay,A.trackPay], PAID:[A.view,A.hist],
  PENDING_ISSUE:[A.view,A.hist], ISSUED:[A.policy,A.pdf,A.resend],
  REJECTED:[A.seeStatus,A.view,A.hist], CANCELLED:[A.view,A.hist]
 };
 return P[casePh]||[A.view,A.hist,A.support];
}

// ---- 7-tab nav (Submitted Case Workspace) ----
const SNAP_SUB=[['customer','Thông tin khách hàng'],['quote','Gói & phí'],['declaration','Nội dung khai báo'],['documents','Tài liệu đã nộp']];
const CONFIRMPAY_SUB=[['confirm','Xác nhận khách hàng'],['payment','Thanh toán'],['comm','Liên hệ']];
const snapIds=SNAP_SUB.map(x=>x[0]);
const showSupTab = supCount>0 || casePh==='NEED_MORE_INFORMATION';
const topActive = activeTab==='overview'?'overview' : snapIds.includes(activeTab)?'snapshot' : (['confirm','payment','comm'].includes(activeTab))?'confirmpay' : activeTab;
const topTabs=[
 ['overview','Tổng quan xử lý','overview'],
 ['snapshot','Hồ sơ đã nộp','customer'],
 ...(showSupTab?[['supplement','Yêu cầu bổ sung'+(supCount?` <span class="badge badge-blocked" style="font-size:9px;">${supCount}</span>`:''),'supplement']]:[]),
 ['uw','Thẩm định','uw'],
 ['confirmpay','Xác nhận & thanh toán','confirm'],
 ['policy','Hợp đồng','policy'],
 ['history','Lịch sử','history']
];
const topLink=([key,label,target])=>`<a href="?id=${app.id}&tab=${target}" class="tab" style="text-decoration:none;display:inline-block;padding:9px 13px;font-size:13px;${topActive===key?'border-bottom:2px solid var(--brand-600);color:var(--brand-600);font-weight:600;':'color:var(--ink-500);'}">${label}</a>`;
const subLink=([id,label])=>`<a href="?id=${app.id}&tab=${id}" style="text-decoration:none;padding:6px 11px;border-radius:7px;font-size:12.5px;${activeTab===id?'background:var(--brand-600);color:#fff;font-weight:600;':'background:var(--paper-card);color:var(--ink-500);border:1px solid var(--line);'}">${label}</a>`;
const subSet = topActive==='snapshot'?SNAP_SUB : topActive==='confirmpay'?CONFIRMPAY_SUB : null;
const subNav = subSet ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${subSet.map(subLink).join('')}</div>` : '';
const viewOnlyBanner = (topActive==='snapshot') ? `<div class="alert2 info" style="margin-bottom:12px;">🔒 <b>Bản hồ sơ đã nộp — chỉ xem.</b> Dữ liệu dưới đây là snapshot tại thời điểm nộp; chỉ chỉnh khi có yêu cầu bổ sung.</div>` : '';
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
  ['Nộp hồ sơ','done',app.submittedAt],
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
const nthText = mgTrack.mortgaged ? `<b style="color:var(--amber-600);">${mgTrack.bank||'—'}</b>${mgTrack.lenderType?' ('+mgTrack.lenderType+')':''}${mgTrack.branch?' · '+mgTrack.branch:''} · HĐ ${mgTrack.creditContract||'—'} <span style="font-size:10.5px;color:var(--ink-300);">(NTH nhập độc lập, không suy từ Seller)</span>` : 'Chủ xe (xe không thế chấp)';
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
   + `<div class="section-title" ${ocrDocs.length?'':'style="margin-top:0;"'}><h2>Thư viện tài liệu hồ sơ</h2><span class="subtitle">Cùng nguồn trạng thái với tab Bổ sung</span></div>
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
 ev.push(['21/07 09:40','SMS','📱','Gửi thông báo nộp hồ sơ','Đã gửi','ok']);
 if(app.confirm){ ev.push([app.confirm.sentAt||'21/07 10:20','Email','✉️','Link xác nhận hồ sơ','Đã gửi → Đã mở','ok']); }
 if(st==='PENDING_PAYMENT'||app.payment){ ev.push([app.payment&&app.payment.paidAt||'21/07 11:00','SMS','📱','Link thanh toán','Đã gửi → Đã xem'+(app.payment&&app.payment.status==='SUCCESS'?' → Đã thanh toán':''),app.payment&&app.payment.status==='SUCCESS'?'ok':'wait']); }
 if(st==='NEED_MORE_INFO'){ ev.push([app.supplement&&app.supplement.requestedAt||'—','Notification','🔔','Yêu cầu bổ sung hồ sơ','Đã gửi','warn']); }
 if(st==='ISSUED'){ ev.push([app.updatedAt||'—','Email','✉️','Gửi hợp đồng & chứng nhận','Đã gửi','ok']); }
 const tone={ok:'var(--teal-600)',warn:'var(--amber-600)',wait:'var(--brand-600)'};
 return `<div class="card" style="padding:0;overflow:hidden;"><div style="padding:12px 16px;border-bottom:1px solid var(--line);font-weight:700;font-size:14px;">Nhật ký liên hệ khách hàng</div>${ev.map(e=>`<div style="display:flex;gap:12px;padding:11px 16px;border-bottom:1px solid var(--line);align-items:flex-start;font-size:12.5px;"><span style="font-size:16px;">${e[2]}</span><div style="flex:1;"><b>${e[3]}</b> <span class="chip" style="font-size:9px;">${e[1]}</span><div style="font-size:11.5px;color:${tone[e[5]]};margin-top:2px;">${e[4]}</div></div><span style="color:var(--ink-300);white-space:nowrap;">${e[0]}</span></div>`).join('')}</div>`;
}

// ---- Customer reconfirmation rule (rule-based, không cho seller chọn) ----
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
   <div style="font-size:11.5px;color:var(--ink-300);margin-bottom:10px;">Chỉ các mục được yêu cầu mở để chỉnh sửa — phần còn lại của hồ sơ ở chế độ chỉ xem.</div>
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
 const uwOrg = (app.uw&&app.uw.officer)? 'ABC Insurance — Motor UW' : 'ABC Insurance — Motor Underwriting';
 const card1=c5('Trạng thái xử lý', kvO('Trạng thái',BANCA.appStatusBadge(st))+kvO('Việc cần làm','<b>'+naO[0]+'</b>')+(app.sla?kvO('SLA / deadline',slaHtml(app.sla)):'')+kvO('Case owner hiện tại',['NEED_MORE_INFORMATION'].includes(casePh)?'Seller':'Đơn vị bảo hiểm')+kvO('Đơn vị xử lý',uwOrg)+kvO('Cập nhật gần nhất',app.updatedAt||'—'), {danger:'var(--red-600)',ok:'var(--teal-600)',info:'var(--brand-600)',wait:'var(--amber-600)'}[naO[1]]);
 const card2=`<section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Tiến trình</div>${timeline()}</section>`;
 const card3=c5('Tóm tắt bảo hiểm', kvO('Số tiền bảo hiểm (SI/IDV)','<b>'+BANCA.vnd(idvTrack)+'</b>')+kvO('Mức khấu trừ',dedTrack?BANCA.vnd(dedTrack)+'/vụ':'—')+kvO('Tổng phí',BANCA.vnd(app.uw&&app.uw.newPremium||app.premium))+kvO('Quyền lợi bổ sung',addOnsTrack.length?addOnsTrack.join(', '):'Không')+kvO('Thời hạn','12 tháng')+kvO('Ngày hiệu lực dự kiến',(app.policyId&&BANCA.policyById(app.policyId)||{}).effectiveFrom||'Sau phát hành'));
 const card4=c5('Đối tượng bảo hiểm', app.vehicle?(kvO('Biển số',app.vehicle.plate||'—')+kvO('Hãng / dòng',app.vehicle.brand+' '+app.vehicle.model)+kvO('Năm sản xuất',app.vehicle.year||'—')+kvO('Số khung (VIN)',app.vehicle.vin||'—')+kvO('Số máy',app.vehicle.engineNo||'—')+kvO('Giá trị xe',BANCA.vnd(app.vehicle.value||idvTrack))+kvO('Tình trạng thế chấp',mgTrack.mortgaged?'Có':'Không')+kvO('Bên thụ hưởng',mgTrack.mortgaged?(mgTrack.bank||'—'):'Chủ xe')):'<div style="font-size:12.5px;color:var(--ink-500);">—</div>');
 const _pa = BANCA.participantsOf ? BANCA.participantsOf(app.id, app.owner) : {referrer:app.owner,advisor:app.owner,sellingProducer:app.owner,caseOwner:app.owner};
 const _pRow = (label,uid)=> kvO(label, uid?`${BANCA.pName(uid)} <span style="font-size:11px;color:var(--ink-300);">${BANCA.pLine(uid)}</span>`:'—');
 const card5=c5('Nguồn bán & người tham gia',
   _pRow('Người giới thiệu', _pa.referrer)+_pRow('Người tư vấn', _pa.advisor)+_pRow('Người bán', _pa.sellingProducer)+_pRow('Người phụ trách hiện tại', _pa.caseOwner||app.owner)
   +kvO('Partner / Chi nhánh · Team', 'Janus Bank · '+(_pa.branch||(cust&&cust.branch)||'HCM01')+(_pa.team?' · '+_pa.team:''))
   +kvO('Source system',srcLabelOverview())+kvO('External referral',_pa.leadRef||app.leadId||'—')+kvO('Campaign',_pa.campaign||app.campaign||'—')
   +(_pa._fallback?'<div style="font-size:11px;color:var(--ink-300);grid-column:1/-1;">Chưa có snapshot participant — hiển thị theo người phụ trách.</div>':''));
 // Epic 5: Business vs Integration status
 const intg=BANCA.integrationStatus(app);
 const intDot=t=>({ok:'var(--teal-600)',wait:'var(--amber-600)',idle:'var(--ink-300)',bad:'var(--red-600)'}[t]||'var(--ink-300)');
 const cardStatus=`<section class="card" style="padding:16px;"><div class="label" style="margin-bottom:10px;">Trạng thái nghiệp vụ & tích hợp</div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
     <div><div style="font-size:12px;color:var(--ink-500);margin-bottom:6px;">Nghiệp vụ</div>${['Thẩm định','Chờ khách','Thanh toán','Phát hành'].map((b,i)=>{const done=[['UW_DECIDED','PENDING_CUSTOMER_CONFIRM','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'],['PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'],['PAID','PENDING_ISSUE','ISSUED'],['ISSUED']][i].includes(st);return `<div style="font-size:12.5px;padding:3px 0;">${done?'✓':'○'} ${b}</div>`;}).join('')}</div>
     <div><div style="font-size:12px;color:var(--ink-500);margin-bottom:6px;">Tích hợp hệ thống</div>${intg.map(([k,v,t])=>`<div style="font-size:12.5px;padding:3px 0;display:flex;justify-content:space-between;"><span>${k}</span><span style="color:${intDot(t)};font-weight:600;">${v}</span></div>`).join('')}</div>
   </div></section>`;
 // Epic 9: Case Health widget
 const h=BANCA.caseHealth(app);
 const hColor={ok:'var(--teal-600)',warn:'var(--amber-600)',bad:'var(--red-600)'}[h.overall];
 const cardHealth=`<section class="card" style="padding:16px;border-top:4px solid ${hColor};"><div class="label" style="margin-bottom:8px;">Case Health <span style="color:${hColor};font-weight:800;">${h.overall==='ok'?'Tốt':h.overall==='warn'?'Cần chú ý':'Có vấn đề'}</span></div>${h.items.map(([k,v,t])=>`<div style="display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;border-bottom:1px dashed var(--line);"><span style="color:var(--ink-500);">${k}</span><span style="color:${intDot(t)};font-weight:600;">${v}</span></div>`).join('')}</section>`;
 body=`<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start;">
  <div style="display:grid;gap:14px;">${card1}${cardStatus}${card3}${card4}${card5}</div>
  <aside style="position:sticky;top:76px;display:grid;gap:14px;">${cardHealth}${card2}</aside>
 </div>`;
} else if(activeTab==='supplement'){
 body=supplementWorkspace();
} else if(activeTab==='customer'){
 body=`<div class="card" style="padding:16px;"><table class="dtable"><tbody>${cust?[row('Họ tên',cust.name),row('CIF',cust.cif||'— (prospect)'),row('CCCD/MST',idCell(cust,'t-cid')),row('Địa chỉ',cust.address||'Chưa có trong mock KYC'),row('Điện thoại',phoneCell(cust,'t1')),row('Email',cust.email),row('Segment',cust.segment),row('Người được BH','Chính chủ (Motor cá nhân)'),row('Bên thụ hưởng (NTH)',nthText)].join(''):row('Khách hàng','—')}</tbody></table></div>
 <div style="font-size:11.5px;color:var(--ink-300);margin-top:8px;">KYC chỉ đọc từ Bank/CRM snapshot. Seller/kênh bán không được dùng để suy ra bên thụ hưởng.</div>`;
} else if(activeTab==='quote'){
 const q=qTrack||{};
 const snap=snapTrack||{};
 const pkgName=app.package||((BANCA.motorPackages[snap.packageCode]||{}).name)||'—';
 const pkgCode=snap.packageCode||(pkgName||'').toUpperCase();
 const packageDef=BANCA.motorPackages[pkgCode]||{};
 const quoteState=BANCA.quoteStatus(q,null)||'ACTIVE';
 const needRerate=['STALE','EXPIRED'].includes(quoteState)||(app.warnings||[]).includes('QUOTE_NEED_RERATE');
 const canChange=false; // Submitted Case Workspace — snapshot đã nộp, chỉ xem (không đổi gói/add-on/tính lại phí)
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
   <section><div class="section-title" style="margin-top:0;"><h2>Quyền lợi bảo hiểm</h2><span class="subtitle">Nhóm theo mức độ quan trọng</span></div>${benefitGroup('Bắt buộc',[['TNDS — người','150.000.000 ₫/người/vụ'],['TNDS — tài sản','100.000.000 ₫/vụ']],true)}${benefitGroup('Vật chất xe',[['Số tiền BH (IDV)',BANCA.vnd(idvTrack)],['Khấu trừ',dedTrack?BANCA.vnd(dedTrack)+'/vụ':'—'],['Garage',packageDef.garage||'Theo gói']],true)}${benefitGroup('Quyền lợi bổ sung',addOnsTrack.length?addOnsTrack.map(x=>[x,'Có — theo điều khoản gói '+pkgName]):[['Không có','—']],false)}${benefitGroup('Điều kiện và giới hạn',[['Hiệu lực báo giá',q.validUntil||'—'],['Gói không còn hiệu lực',quoteState==='EXPIRED'?'Có — cần tính lại':'Không'],['Quyền chỉnh sửa',canChange?'Seller được đổi gói/add-on':'Chỉ xem / không có quyền thay đổi']],false)}</section>
   <details class="quote-card"><summary style="cursor:pointer;font-weight:800;color:var(--brand-600);">Xem chi tiết cách tính phí</summary><table class="dtable" style="margin-top:12px;"><thead><tr><th>Thành phần</th><th>Cơ sở tính</th><th>Tỷ lệ</th><th>Thành tiền</th></tr></thead><tbody>${detailRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td style="font-weight:700;">${r[3]}</td></tr>`).join('')}</tbody></table></details>
  </main>
  <aside class="quote-side">
   <section class="quote-card" style="border-top:4px solid ${needRerate?'var(--red-600)':'var(--brand-600)'};"><div class="label">Chi tiết phí</div>${needRerate?'<div class="alert2 warn" style="margin:10px 0;">Dữ liệu đã thay đổi / báo giá không còn hiệu lực. Phí cũ không được coi là phí hiện tại.</div>':''}${feeLine('TNDS bắt buộc',BANCA.vnd(q.tplPremium||0))}${feeLine('Phí vật chất xe',BANCA.vnd(q.odBase||0))}${feeLine('Tổng phí add-on','+'+BANCA.vnd(odAddOnTotal))}${feeLine('Tạm tính',BANCA.vnd(q.subtotal||0))}${feeLine('Giảm phí',discount?'−'+BANCA.vnd(discount):'—')}${feeLine('VAT','+'+BANCA.vnd(q.vatAmount||0))}${feeLine('Tổng phí cuối cùng',BANCA.vnd(q.totalPremium||app.premium||0),true)}<div style="display:grid;gap:8px;margin-top:12px;"><button class="btn btn-secondary" onclick="document.querySelector('details.quote-card') && document.querySelector('details.quote-card').setAttribute('open','')">Xem cách tính phí</button><button class="btn btn-secondary" onclick="alert('Tải bảng minh họa phí (demo)')">Tải bảng minh họa</button></div><div style="font-size:11px;color:var(--ink-300);margin-top:8px;">Bản phí đã nộp — chỉ xem. Không đổi gói/add-on hay tính lại phí trên hồ sơ đã nộp.</div></section>
   <section class="quote-card"><div class="label">Trạng thái hệ thống</div><div style="display:grid;gap:7px;margin-top:8px;font-size:12px;color:var(--ink-500);"><div>Loading phí: hiển thị khi gọi rating engine</div><div>Tính phí thành công: ${!needRerate?'đang áp dụng':'sau khi re-rate'}</div><div>Tính phí lỗi: hiển thị alert lỗi retry</div><div>Dữ liệu thay đổi cần re-rate: ${needRerate?'đang có':'không'}</div><div>Seller không có quyền thay đổi: ${canChange?'không':'có'}</div></div></section>
  </aside>
 </div>`;
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
 const custConfirmed = !!app.confirm || ['PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st);
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
} else if(activeTab==='uw'){
 // Underwriting Workspace detail (Epic 3) — status/owner/queue/priority + timeline SLA
 const uwState = app.uw?(['REJECTED'].includes(st)?'Từ chối':(app.uw.decision==='APPROVED'?'Đã duyệt':'Duyệt có điều kiện')):(st==='NEED_MORE_INFO'?'Chờ phản hồi seller':(st==='IN_UW'?'Đang thẩm định':(st==='PENDING_UW'?'Đã tiếp nhận':'Chờ tiếp nhận')));
 const uwStateTone = app.uw?(['REJECTED'].includes(st)?'danger':'ok'):'wait';
 const received=app.submittedAt||'—', started=st==='PENDING_RECEIPT'?'—':((app.submittedAt||'—')), expected=app.sla||'—';
 const wsCard=`<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">Trạng thái thẩm định</div>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
     ${[['Trạng thái',uwState],['Đơn vị xử lý','Motor UW Team'],['Hàng chờ (queue)','Motor'],['Ưu tiên',app.uw?'Bình thường':(app.sla&&new Date(app.sla.replace(' ','T'))<new Date('2026-07-21T15:30:00')?'Cao':'Bình thường')],['Tiếp nhận lúc',received],['Bắt đầu',started],['Dự kiến xong',expected],['SLA còn lại',app.sla?slaHtml(app.sla):'—']].map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:8px;padding:9px;"><div style="font-size:10px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:12.5px;font-weight:700;margin-top:2px;">${v}</div></div>`).join('')}
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
   <div style="font-size:11px;color:var(--ink-300);margin-top:6px;">Chỉ hiển thị thông tin được phép chia sẻ với seller/khách — không gồm ghi chú UW nội bộ, fraud flag hay risk score.</div>
 </div>`:'';
 const decCard = app.uw?`<div class="card" style="padding:16px;"><table class="dtable"><tbody>
   ${row('Kết quả',BANCA.uwBadge(app.uw.decision))}
   ${row('Thẩm định viên',app.uw.officer||'—')}
   ${row('Quyết định lúc',app.uw.decidedAt)}
   ${row('Thư thẩm định',`<a href="javascript:alert('Mở PDF demo: ${app.uw.letter}')" style="color:var(--brand-600);">${app.uw.letter}</a>`)}
   ${row('Khách đã xem',app.uw.customerViewed?'<span class="badge badge-ready">Đã xem</span>':'<span class="badge badge-pending">Chưa xem</span>')}
  </tbody></table>
  ${['UW_DECIDED'].includes(st)&&app.owner===me?'<button class="btn btn-primary" style="margin-top:12px;" onclick="sendConfirm()">Gửi khách xác nhận</button>':''}
 </div>` : emptyIllu('📋','Chưa có kết quả thẩm định',['PENDING_RECEIPT','PENDING_UW','IN_UW'].includes(st)?'Hồ sơ đang trong hàng chờ / đang thẩm định. Bạn chưa cần thao tác thêm.':'—');
 body = wsCard + condCard + decCard;
} else if(activeTab==='confirm'){
 // State model xác nhận khách hàng
 const needConfirm = (app.uw&&['APPROVED_WITH_LOADING','APPROVED_WITH_EXCLUSION','APPROVED_WITH_CONDITION'].includes(app.uw.decision))||['PENDING_CUSTOMER_CONFIRM','UW_DECIDED'].includes(st);
 let cState;
 if(app.confirm && ['PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st)) cState='CONFIRMED';
 else if(app.confirm) cState='SENT';
 else if(needConfirm) cState='PENDING';
 else if(['PENDING_RECEIPT','PENDING_UW','IN_UW','NEED_MORE_INFO'].includes(st)) cState='NOT_READY';
 else cState='NOT_APPLICABLE';
 const cLabel={CONFIRMED:['Đã xác nhận','ok'],SENT:['Đã gửi — chờ khách xác nhận','wait'],PENDING:['Cần gửi yêu cầu xác nhận','info'],NOT_READY:['Chưa thể gửi xác nhận','wait'],NOT_APPLICABLE:['Không yêu cầu xác nhận','ok']}[cState];
 let cfBody;
 if(cState==='NOT_APPLICABLE') cfBody=emptyIllu('✅','Không yêu cầu xác nhận khách hàng','Hồ sơ đã được xác nhận trong quá trình nộp — không cần bước xác nhận riêng.');
 else if(cState==='NOT_READY') cfBody=emptyIllu('⏳','Chưa thể gửi xác nhận khách hàng','Hồ sơ đang chờ kết quả thẩm định.');
 else if(cState==='PENDING') cfBody=`<div class="card" style="padding:16px;"><div style="font-size:13px;color:var(--ink-700);">Kết quả thẩm định có điều chỉnh (phụ phí/điều kiện) — khách cần xác nhận lại trước khi thanh toán.</div>${app.owner===me?'<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="sendConfirm()">Gửi yêu cầu xác nhận</button>':''}</div>`;
 else cfBody=`<div class="card" style="padding:16px;"><table class="dtable"><tbody>
   ${row('Loại xác nhận', app.uw&&app.uw.decision!=='APPROVED'?'Xác nhận lại (có điều chỉnh)':'Xác nhận thông tin')}
   ${row('Phiên bản hồ sơ','Phiên bản '+(app.version||1))}
   ${row('Kênh gửi', BANCA.label('delivery',app.confirm.delivery)||'SMS + Email')}
   ${row('Người nhận', (cust?cust.name:'—')+' · '+(cust?BANCA.maskPhone(cust.phone):''))}
   ${row('Gửi lúc',app.confirm.sentAt)} ${row('Hết hạn',app.confirm.expiry)}
   ${row('Trạng thái OTP', BANCA.label('otp',app.confirm.otp)||'—')}
   ${row('Xác nhận lúc', cState==='CONFIRMED'?(app.confirm.confirmedAt||app.updatedAt):'—')}
   ${row('Lịch sử gửi lại', (app.confirm.resends||0)+' lần')}
  </tbody></table>
  ${app.owner===me&&cState==='SENT'?'<button class="btn btn-secondary btn-sm" style="margin-top:10px;" onclick="alert(\'Đã gửi lại link (demo)\')">Gửi lại link</button>':''}
 </div>`;
 body = statusBanner(cLabel[1], cLabel[0], cState==='SENT'?`Đã gửi lúc ${app.confirm.sentAt||'—'} · hết hạn ${app.confirm.expiry||'—'}.`:'', '') + cfBody;
} else if(activeTab==='payment'){
 // ===== P0-8: payment mô phỏng theo phương thức (user chốt): QR→success, Thẻ→fail rồi retry success, CK→timeout =====
 const pay=app.payment;
 const payStatusBadge = s2 => ({SUCCESS:'<span class="badge badge-ready">Thành công</span>',PENDING:'<span class="badge badge-pending">Chờ thanh toán</span>',FAILED:'<span class="badge badge-blocked">Thất bại</span>',TIMEOUT:'<span class="badge badge-blocked">Quá thời gian chờ</span>',EXPIRED:'<span class="badge badge-blocked">Hết hạn</span>'}[s2]||s2);
 const q=app.quote;
 const breakdown = q? (q.subtotal!=null? `<div style="border:1px solid var(--line);border-radius:9px;padding:12px;margin-top:10px;">
  <div class="label" style="margin-bottom:6px;">Breakdown phí (thác nước)</div>
  <div style="font-size:12.5px;display:flex;justify-content:space-between;"><span>TNDS bắt buộc</span><span>${BANCA.vnd(q.tplPremium)}</span></div>
  <div style="font-size:12.5px;display:flex;justify-content:space-between;color:var(--ink-500);"><span>Phí gốc vật chất</span><span>${BANCA.vnd(q.odBase)}</span></div>
  ${(q.lines||[]).map(l=>`<div style="font-size:12.5px;display:flex;justify-content:space-between;color:var(--ink-500);"><span>${l.amount<0?'−':'+'} ${l.label}</span><span>${BANCA.vnd(Math.abs(l.amount))}</span></div>`).join('')}
  <div style="font-size:12.5px;display:flex;justify-content:space-between;border-top:1px dashed var(--line);margin-top:4px;padding-top:4px;"><span>= Tạm tính (Subtotal)</span><span>${BANCA.vnd(q.subtotal)}</span></div>
  ${q.ncdAmount?`<div style="font-size:12.5px;display:flex;justify-content:space-between;color:var(--teal-600);"><span>− NCD ${q.ncdPct}%</span><span>−${BANCA.vnd(q.ncdAmount)}</span></div>`:''}
  <div style="font-size:12.5px;display:flex;justify-content:space-between;color:var(--amber-600);"><span>+ VAT ${BANCA.VAT_PCT}% (vật chất)</span><span>+${BANCA.vnd(q.vatAmount)}</span></div>
  ${app.uw&&app.uw.newPremium?`<div style="font-size:12.5px;display:flex;justify-content:space-between;color:var(--amber-600);"><span>Điều chỉnh UW</span><span>${BANCA.vnd(app.uw.newPremium-(q.totalPremium||app.premium))}</span></div>`:''}
  <div style="font-size:13px;display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--line);margin-top:6px;padding-top:6px;"><span>Tổng thanh toán</span><span>${BANCA.vnd((app.uw&&app.uw.newPremium)||q.totalPremium||app.premium)}</span></div>
 </div>` : `<div style="border:1px solid var(--line);border-radius:9px;padding:12px;margin-top:10px;">
  <div class="label" style="margin-bottom:6px;">Breakdown phí</div>
  <div style="font-size:12.5px;display:flex;justify-content:space-between;"><span>Phí cơ bản</span><span>${BANCA.vnd(q.basePremium)}</span></div>
  <div style="font-size:13px;display:flex;justify-content:space-between;font-weight:700;border-top:1px solid var(--line);margin-top:6px;padding-top:6px;"><span>Tổng thanh toán</span><span>${BANCA.vnd((app.uw&&app.uw.newPremium)||q.adjustedPremium||app.premium)}</span></div>
 </div>`):'';
 // Nghĩa vụ thanh toán + danh sách giao dịch
 const totalDue=(app.uw&&app.uw.newPremium)||(q&&(q.totalPremium||q.adjustedPremium))||app.premium||0;
 const paidAmt=(pay&&pay.status==='SUCCESS')?pay.amount:0;
 const payOwner='Khách hàng';
 const obligationCard=`<div class="card" style="padding:16px;margin-bottom:12px;"><div class="label" style="margin-bottom:10px;">Nghĩa vụ thanh toán</div>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
     ${[['Tổng phí',BANCA.vnd(totalDue)],['Đã thanh toán',BANCA.vnd(paidAmt)],['Còn lại',BANCA.vnd(Math.max(0,totalDue-paidAmt))],['Hạn thanh toán',(pay&&pay.status==='PENDING')?(app.sla||'—'):'—'],['Người thanh toán',payOwner],['Phương thức hỗ trợ','QR · Thẻ · Chuyển khoản']].map(([k,v])=>`<div style="border:1px solid var(--line);border-radius:9px;padding:10px;"><div style="font-size:10.5px;color:var(--ink-300);text-transform:uppercase;">${k}</div><div style="font-size:14px;font-weight:700;margin-top:3px;">${v}</div></div>`).join('')}
   </div></div>`;
 const txns=[]; if(pay){ txns.push({id:pay.txnRef||pay.reference||('TXN-'+String(app.id).slice(-3)), method:BANCA.label('paymentMethod',pay.method), at:pay.paidAt||(pay.status==='PENDING'?'—':app.updatedAt), amount:pay.amount, status:pay.status, ref:pay.reference||'—', fail:['FAILED','TIMEOUT','EXPIRED'].includes(pay.status)?'Giao dịch không thành công — cần thử lại':''}); }
 const txStatusBadge=s2=>({SUCCESS:'<span class="badge badge-ready">Thành công</span>',PENDING:'<span class="badge badge-pending">Chờ</span>',PROCESSING:'<span class="badge badge-pending">Đang xử lý</span>',FAILED:'<span class="badge badge-blocked">Thất bại</span>',TIMEOUT:'<span class="badge badge-blocked">Quá giờ</span>',EXPIRED:'<span class="badge badge-blocked">Hết hạn</span>',REFUNDED:'<span class="badge badge-version">Đã hoàn</span>'}[s2]||s2);
 const txnCard=`<div class="card" style="padding:0;margin-bottom:12px;overflow:hidden;"><div style="padding:12px 16px;border-bottom:1px solid var(--line);font-weight:700;font-size:14px;">Danh sách giao dịch</div>${txns.length?`<table class="dtable"><thead><tr><th>Mã GD</th><th>Phương thức</th><th>Thời gian</th><th>Số tiền</th><th>Trạng thái</th><th>Reference</th></tr></thead><tbody>${txns.map(tx=>`<tr><td style="font-size:12px;">${tx.id}</td><td style="font-size:12.5px;">${tx.method}</td><td style="font-size:12px;color:var(--ink-500);">${tx.at}</td><td style="font-size:12.5px;">${BANCA.vnd(tx.amount)}</td><td>${txStatusBadge(tx.status)}${tx.fail?`<div style="font-size:11px;color:var(--red-600);">${tx.fail}</div>`:''}</td><td style="font-size:11.5px;color:var(--ink-500);">${tx.ref}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-state" style="padding:20px;">Chưa có giao dịch.</div>'}</div>`;
 if(pay){
  const failed=['FAILED','TIMEOUT','EXPIRED'].includes(pay.status);
  body=obligationCard+txnCard+`<div class="card" style="padding:16px;"><table class="dtable"><tbody>
   ${row('Phương thức',BANCA.label('paymentMethod',pay.method))}
   ${row('Payment reference',pay.reference)}
   ${row('Số tiền',BANCA.vnd(pay.amount))}
   ${row('Trạng thái',payStatusBadge(pay.status))}
   ${pay.status==='PENDING'?row('Hạn thanh toán',slaHtml(app.sla||'2026-07-24 11:30')):''}
   ${pay.paidAt?row('Thanh toán lúc',pay.paidAt):''}
   ${pay.txnRef?row('Transaction ref',pay.txnRef):''}
  </tbody></table>
  ${breakdown}
  ${st==='PENDING_PAYMENT'&&app.owner===me&&!failed?`
   <div style="margin-top:14px;">
    <div class="label" style="margin-bottom:6px;">Chọn phương thức & gửi thanh toán</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
     <button class="btn btn-primary btn-sm" onclick="payDemo('QR')">QR Code</button>
     <button class="btn btn-secondary btn-sm" onclick="payDemo('CARD')">Thẻ ngân hàng</button>
     <button class="btn btn-secondary btn-sm" onclick="payDemo('BANK_TRANSFER')">Chuyển khoản</button>
    </div>
    <div style="font-size:10.5px;color:var(--ink-300);margin-top:6px;">Demo scenario: QR → thành công · Thẻ → thất bại lần đầu, retry thành công · Chuyển khoản → timeout</div>
   </div>`:''}
  ${failed&&app.owner===me?`<button class="btn btn-primary" style="margin-top:12px;" onclick="payRetry()">Thử lại (Retry)</button>`:''}
  ${app.owner===me&&pay.status!=='SUCCESS'?(()=>{ // SMS nhắc thanh toán (yêu cầu 16:35)
   const smsLog=((BANCA.overlay.applications&&BANCA.overlay.applications[app.id])||{}).__smsLog||[];
   return `<div style="margin-top:16px;border-top:1px dashed var(--line);padding-top:12px;">
    <div class="label" style="margin-bottom:6px;">Nhắn tin nhắc khách hàng</div>
    <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">
     <textarea id="sms-text" style="flex:1;min-width:280px;padding:8px;border:1px solid var(--line);border-radius:7px;font-size:12.5px;font-family:inherit;" rows="3">[JanusBank] Kinh gui Quy khach ${(cust||{}).name||''}: Ho so bao hiem ${app.id} da san sang thanh toan. So tien: ${BANCA.vnd(pay.amount)}. Han: ${(app.sla||'').slice(0,10)}. Thanh toan tai: https://portal.janus.vn/pay/${app.id.toLowerCase()}</textarea>
     <button class="btn btn-primary btn-sm" onclick="sendSms()">📱 Gửi SMS</button>
    </div>
    ${smsLog.length?`<div style="margin-top:8px;font-size:11.5px;color:var(--ink-500);">${smsLog.map(x=>`<div>✓ Đã gửi SMS tới ${(cust||{}).phone||''} lúc ${x}</div>`).join('')}</div>`:''}
   </div>`;
  })():''}
  </div><div id="pay-toast"></div>`;
 } else {
  const uwOk=!!app.uw&&!['REJECTED'].includes(st);
  const confirmed=!!app.confirm||['PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st);
  body=obligationCard+emptyIllu('💳','Chưa hiển thị thanh toán', !uwOk?'Hồ sơ cần được duyệt thẩm định trước.':(!confirmed?'Khách cần hoàn tất xác nhận bắt buộc trước khi thanh toán.':'Đang chờ khởi tạo thanh toán.'));
 }
} else if(activeTab==='comm'){
 body=`<div class="alert2 info" style="margin-bottom:12px;">Nhật ký các kênh liên hệ với khách (SMS · Email · Notification · Điện thoại) — theo dõi trạng thái gửi/mở/hành động.</div>`+communicationLog();
} else if(activeTab==='policy'){
 const polRec = app.policyId?BANCA.policyById(app.policyId):null;
 const effFrom = polRec&&polRec.effectiveFrom||'—', effTo = polRec&&polRec.effectiveTo||'—';
 const issuedHead = `<div class="card" style="padding:18px;border-left:4px solid var(--teal-600);margin-bottom:12px;">
   <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-start;">
    <div>
     <div style="font-size:19px;font-weight:700;color:var(--teal-600);">✓ Hợp đồng đã phát hành thành công</div>
     <div style="font-size:14px;color:var(--ink-700);margin-top:4px;">Số HĐ <b>${app.policyId}</b> · Hiệu lực ${effFrom} → ${effTo}</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
     <button class="btn btn-primary btn-sm" onclick="alert('Tải hợp đồng PDF (demo)')">Tải hợp đồng</button>
     <button class="btn btn-secondary btn-sm" onclick="alert('Đã gửi cho khách (demo)')">Gửi cho khách</button>
    </div>
   </div>
   <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:12.5px;color:var(--ink-500);">
    <div><b style="color:var(--ink-700);">Ngày hiệu lực</b><br>${effFrom}</div>
    <div><b style="color:var(--ink-700);">Hotline hỗ trợ</b><br>1900 1234 (24/7)</div>
    <div><b style="color:var(--ink-700);">Yêu cầu bồi thường</b><br>Gọi hotline hoặc app trong 5 ngày</div>
    <div><b style="color:var(--ink-700);">Dự kiến tái tục</b><br>${effTo}</div>
   </div>
  </div>`;
 body = app.policyId? issuedHead + gcnPanel(app)+`
 ${BANCA.commissionVisible('policy')?(()=>{const pol=BANCA.policyById(app.policyId); const cm=pol?BANCA.commissionOfPolicy(pol):null; return cm?`<div class="card" style="padding:14px;margin-top:12px;border-left:3px solid var(--teal-600);"><div class="label">Hoa hồng dự kiến</div><div style="font-size:13px;color:var(--ink-700);margin-top:4px;"><b>${BANCA.vnd(cm.amount)}</b> · trạng thái ${cm.stateLabel} · cơ sở tính HH ${BANCA.vnd(cm.base)} · tỷ lệ ${(cm.rate*100).toFixed(0)}%</div><div style="font-size:11px;color:var(--ink-300);margin-top:3px;">Read-only · cập nhật theo sync ${cm.syncAt}; clawback/đối soát xử lý ở màn admin đối tác.</div></div>`:''})():''}
 <div style="display:flex;gap:8px;margin-top:12px;">
  <a class="btn btn-secondary btn-sm" href="${r}modules/policies/index.html?view=detail&id=${app.policyId}">Mở Policy Detail</a>
  <button class="btn btn-secondary btn-sm" onclick="alert('Tải certificate PDF (demo)')">Tải PDF</button>
  <button class="btn btn-secondary btn-sm" onclick="alert('Đã gửi lại cho khách (demo)')">Gửi lại khách</button>
 </div>` : (()=>{
   const ck=(done,label)=>`<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13px;"><span style="width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:${done?'var(--teal-600)':'var(--line)'};color:${done?'#fff':'var(--ink-500)'};">${done?'✓':'○'}</span><span style="${done?'':'color:var(--ink-500);'}">${label}</span></div>`;
   const uwOk = !!app.uw && !['REJECTED'].includes(st);
   const confirmed = !!app.confirm && ['PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st);
   const paid = app.payment&&app.payment.status==='SUCCESS' || ['PAID','PENDING_ISSUE','ISSUED'].includes(st);
   const issued = st==='ISSUED';
   return `<div class="card" style="padding:18px;">
     <div style="font-size:16px;font-weight:700;margin-bottom:4px;">Hợp đồng chưa được phát hành</div>
     <div style="font-size:12.5px;color:var(--ink-500);margin-bottom:12px;">Cần hoàn tất các điều kiện sau trước khi phát hành:</div>
     ${ck(uwOk,'Hồ sơ đã duyệt (thẩm định)')}
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
 ev.push([app.submittedAt||'—','Nộp hồ sơ',per,'STATUS','READY_TO_SUBMIT','SUBMITTED']);
 ev.push([app.submittedAt||'—','Đồng bộ hồ sơ sang hệ thống bảo hiểm','Hệ thống','INTEGRATION','','Đã gửi']);
 if(['PENDING_UW','IN_UW','NEED_MORE_INFO','UW_DECIDED','PENDING_CUSTOMER_CONFIRM','PENDING_PAYMENT','PAID','PENDING_ISSUE','ISSUED'].includes(st))
   ev.push([app.submittedAt||'—','Đơn vị bảo hiểm tiếp nhận hồ sơ','ABC Insurance','INTEGRATION','SUBMITTED','UW_PENDING']);
 if(app.supplement) ev.push([app.supplement.requestedAt||'—','Yêu cầu bổ sung ('+(app.supplement.items||[]).length+' nội dung)',app.supplement.requestedBy||'Thẩm định viên','STATUS','UW_IN_PROGRESS','NEED_MORE_INFORMATION']);
 if(app.uw) ev.push([app.uw.decidedAt||'—','Kết quả thẩm định: '+((BANCA.UW_DECISIONS&&BANCA.UW_DECISIONS[app.uw.decision]||{}).label||app.uw.decision),app.uw.officer||'Thẩm định viên','STATUS','UW_IN_PROGRESS','UW_DECIDED']);
 if(app.confirm) ev.push([app.confirm.sentAt||'—','Gửi yêu cầu khách xác nhận',per,'STATUS','','SENT']);
 if(app.payment&&app.payment.paidAt) ev.push([app.payment.paidAt,'Thanh toán thành công ('+BANCA.label('paymentMethod',app.payment.method)+')','Cổng thanh toán','PAYMENT','PENDING','SUCCESS']);
 else if(st==='PENDING_PAYMENT') ev.push([app.updatedAt||'—','Khởi tạo thanh toán',per,'PAYMENT','','PENDING']);
 if(st==='ISSUED'){ ev.push([app.updatedAt||'—','Phát hành hợp đồng '+(app.policyId||''),'Core bảo hiểm','STATUS','PENDING_ISSUE','ISSUED']); ev.push([app.updatedAt||'—','Gửi callback kết quả về ngân hàng','Hệ thống','INTEGRATION','','Thành công']); }
 if(st==='CANCELLED') ev.push([app.updatedAt||'—','Hủy hồ sơ: '+(app.cancelReason||''),'—','STATUS','','CANCELLED']);
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

// Header enriched + status-driven action bar (Submitted Case Workspace — view-only)
const na = caseNextAction();
const naTone = {danger:'var(--red-600)',ok:'var(--teal-600)',info:'var(--brand-600)',wait:'var(--amber-600)'}[na[1]]||'var(--amber-600)';
const cmeta = BANCA.caseMeta(app.id);
const caseVer = cmeta.currentVersion;
const quoteRef = app.quote? (app.quote.id+(app.quote.version?'-V'+app.quote.version:'')) : '—';
const uwRef = (app.uw&&app.uw.ref)|| (['PENDING_INTAKE'].includes(casePh)?'—':'UW-2026-008'+(String(app.id).slice(-2)));
const submittedBy = (BANCA.personas[app.owner]||{}).name||app.owner;
const srcLabel = app.source==='ADVICE'?'Tư vấn nhanh':(app.leadId?'Referral':(BANCA.label&&BANCA.label('source',app.source))||'Janus Bank CRM');
const metaChip = (k,v)=>`<span style="font-size:12px;color:var(--ink-500);">${k}: <b style="color:var(--ink-700);">${v}</b></span>`;
const roleName=(BANCA.personas[me]||{}).role||'Seller';
const permLabel = readOnly?'Chỉ xem' : (casePh==='NEED_MORE_INFORMATION'?'Được bổ sung':'Chỉ xem (đã nộp)');
// Version selector
const verSelect = cmeta.versions.length>1
 ? `<select onchange="viewVersion(this.value)" style="font-size:12px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;">${cmeta.versions.slice().reverse().map(v=>`<option value="${v.v}" ${v.v===caseVer?'selected':''}>V${v.v}${v.v===caseVer?' (Current)':''} · ${v.status}</option>`).join('')}</select>${cmeta.compare.length?` <button class="btn btn-secondary btn-sm" onclick="compareVersions('${app.id}')">Compare V1↔V${caseVer}</button>`:''}`
 : `<span class="badge badge-version">Phiên bản ${caseVer}</span>`;
// Notification banner (Epic 12)
function caseNotification(){
 if(casePh==='NEED_MORE_INFORMATION') return ['var(--amber-600)','var(--amber-100)','🟡','Cần bổ sung',supCount+' nội dung'+(app.deadline?' · hạn '+app.deadline:'')];
 if(casePh==='ISSUED') return ['var(--teal-600)','var(--teal-100)','🟢','Hợp đồng đã phát hành thành công',''];
 if(casePh==='REJECTED') return ['var(--red-600)','var(--red-100)','🔴','Hồ sơ bị từ chối',''];
 if(casePh==='PAYMENT_PENDING') return ['var(--brand-600)','var(--brand-100)','💳','Chờ khách thanh toán',''];
 if(casePh==='APPROVED_WITH_CONDITION') return ['var(--brand-600)','var(--brand-100)','📝','Duyệt có điều kiện — cần khách xác nhận lại',''];
 return null;
}
const noti=caseNotification();
const notiBanner = noti?`<div style="display:flex;gap:10px;align-items:center;background:${noti[1]};border-radius:10px;padding:10px 14px;margin-bottom:12px;"><span style="font-size:16px;">${noti[2]}</span><b style="color:${noti[0]};">${noti[3]}</b>${noti[4]?`<span style="font-size:12.5px;color:var(--ink-500);">· ${noti[4]}</span>`:''}</div>`:'';
// Dashboard summary chips (Epic 15)
const stageLbl={PENDING_INTAKE:'Chờ tiếp nhận',UW_PENDING:'Chờ thẩm định',UW_IN_PROGRESS:'Đang thẩm định',NEED_MORE_INFORMATION:'Cần bổ sung',APPROVED_WITH_CONDITION:'Duyệt có điều kiện',CUSTOMER_RECONFIRMATION:'Chờ khách xác nhận',PAYMENT_PENDING:'Chờ thanh toán',PAID:'Đã thanh toán',PENDING_ISSUE:'Chờ phát hành',ISSUED:'Đã phát hành',REJECTED:'Từ chối',CANCELLED:'Đã hủy'}[casePh]||casePh;
const caseOwner=casePh==='NEED_MORE_INFORMATION'?'Seller':(casePh==='PENDING_INTAKE'?'Chờ tiếp nhận':'Đơn vị bảo hiểm');
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
   <div style="text-align:right;"><div style="font-size:12px;color:var(--ink-500);font-weight:600;text-transform:uppercase;letter-spacing:.03em;">Trạng thái xử lý</div><div style="margin-top:3px;">${BANCA.appStatusBadge(st)}</div></div>
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

shell('Hồ sơ đã nộp','Submitted Case Workspace', hdr+tabBar+notiBanner+body, {startSale:false});

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
// Thu hồi hồ sơ — modal in-page (chỉ cho phép khi vừa nộp, chưa tiếp nhận/UW/payment/issue)
window.withdrawCase = function(id){
 const root=document.getElementById('start-sale-root')||document.body;
 const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 d.innerHTML=`<div class="modal2" style="max-width:480px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>Thu hồi hồ sơ ${id}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body">
   <div style="font-size:13px;color:var(--ink-700);margin-bottom:8px;">Chỉ thu hồi được khi hồ sơ chưa được đơn vị bảo hiểm tiếp nhận. Hồ sơ sẽ chuyển <b>WITHDRAWN</b>, giữ nguyên lịch sử; có thể tạo bản nháp mới từ snapshot.</div>
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
 const amount=(app.uw&&app.uw.newPremium)||app.premium;
 if(method==='QR'){
  const polId='JB-POL-2026-0'+Math.floor(Math.random()*900+100);
  BANCA.patchApp(app.id,{status:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:'2026-07-20 15:40',
   payment:{method,reference:'PAY-2026-'+Math.floor(Math.random()*9000+1000),amount,status:'SUCCESS',paidAt:'2026-07-20 15:40',txnRef:'TXN-'+Math.floor(Math.random()*90000+10000)}});
  BANCA.addPolicyDemo({id:polId,certificate:'CERT-'+polId.slice(7),owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:amount,issueDate:'2026-07-20',effectiveFrom:'2026-07-20',effectiveTo:'2027-07-19',status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:app.vehicle||{},billing:[{date:'2026-07-20',amount,method,ref:'TXN-demo',status:'SUCCESS'}]});
  alert('✅ Thanh toán QR thành công — hợp đồng '+polId+' đã phát hành (demo gộp PAID→PENDING_ISSUE→ISSUED).');
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
 alert('📱 Đã gửi SMS nhắc thanh toán tới '+((cust||{}).phone||'khách hàng')+' (demo — nội dung log lại trong hồ sơ).');
 location.reload();
};
window.payRetry = function(){
 const amount=(app.uw&&app.uw.newPremium)||app.premium;
 const polId='JB-POL-2026-0'+Math.floor(Math.random()*900+100);
 BANCA.patchApp(app.id,{status:'ISSUED',policyId:polId,todo:'Xem hợp đồng',updatedAt:'2026-07-20 15:45',
  payment:{status:'SUCCESS',paidAt:'2026-07-20 15:45',txnRef:'TXN-'+Math.floor(Math.random()*90000+10000)}});
 BANCA.addPolicyDemo({id:polId,certificate:'CERT-'+polId.slice(7),owner:app.owner,customerId:app.customerId,productName:app.productName,package:app.package,premium:amount,issueDate:'2026-07-20',effectiveFrom:'2026-07-20',effectiveTo:'2027-07-19',status:'ACTIVE',renewalStatus:null,isNew:true,appId:app.id,vehicle:app.vehicle||{},billing:[{date:'2026-07-20',amount,method:'CARD',ref:'TXN-retry',status:'SUCCESS'}]});
 alert('✅ Retry thành công — hợp đồng '+polId+' đã phát hành.');
 location.href='?id='+app.id+'&tab=policy';
};
})();
