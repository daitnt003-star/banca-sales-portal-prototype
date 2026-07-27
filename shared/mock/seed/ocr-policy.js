// ============================================================
// OCR capability — config-driven theo documentType / riskObjectType.
// OCR chỉ PREFILL, KHÔNG kết luận KYC/underwriting/verification.
// State tách riêng: UPLOAD / OCR / REVIEW / VERIFICATION.
// ============================================================
window.BANCA = window.BANCA || {};

// ---- State models (tách biệt, không dùng OCR_SUCCESS thay KYC) ----
BANCA.OCR_STATE = {
  upload: {UPLOADED:'Đã tải lên', FAILED:'Tải lỗi'},
  ocr:    {NOT_REQUIRED:'Không cần', PENDING:'Chờ xử lý', PROCESSING:'Đang nhận dạng', EXTRACTED:'Đã bóc tách', LOW_CONFIDENCE:'Độ tin cậy thấp', FAILED:'OCR lỗi'},
  review: {NOT_REVIEWED:'Chưa duyệt', SELLER_REVIEWED:'Nhân viên tư vấn đã duyệt', CUSTOMER_CONFIRMED:'Khách đã xác nhận'},
  verify: {UNVERIFIED:'Chưa xác minh', VERIFIED:'Đã xác minh', REJECTED:'Bị từ chối'}
};
BANCA.ocrStateBadge = function(kind, val){
  const label = ((BANCA.OCR_STATE[kind]||{})[val])||val;
  const cls = val==='EXTRACTED'||val==='SELLER_REVIEWED'||val==='VERIFIED'||val==='UPLOADED'||val==='CUSTOMER_CONFIRMED' ? 'badge-ready'
    : val==='LOW_CONFIDENCE'||val==='PENDING'||val==='PROCESSING'||val==='NOT_REVIEWED'||val==='UNVERIFIED' ? 'badge-conditional'
    : val==='FAILED'||val==='REJECTED' ? 'badge-blocked' : 'badge-version';
  return `<span class="badge ${cls}">${label}</span>`;
};

// ---- Customer document policy theo entry mode ----
BANCA.customerDocumentPolicy = {
  BANK_CUSTOMER:         {documentType:'NATIONAL_ID', ocrEnabled:true,  ocrRequired:false, manualEntryFallback:true, confidenceThreshold:0.85, note:'KYC ngân hàng được chấp nhận — OCR chỉ để đối chiếu/bổ sung.'},
  INSURANCE_CUSTOMER:    {documentType:'NATIONAL_ID', ocrEnabled:true,  ocrRequired:false, manualEntryFallback:true, confidenceThreshold:0.85, note:'Prefill từ Insurance Customer; OCR khi thiếu/hết hạn.'},
  NEW_PROSPECT:          {documentType:'NATIONAL_ID', ocrEnabled:true,  ocrRequired:true,  manualEntryFallback:true, confidenceThreshold:0.85, note:'Khách mới: cần định danh (OCR CCCD hoặc nhập tay).'},
  CONVERTED_FROM_ADVICE: {documentType:'NATIONAL_ID', ocrEnabled:true,  ocrRequired:true,  manualEntryFallback:true, confidenceThreshold:0.85, note:'Từ tư vấn: chưa có định danh xác minh — cần bổ sung.'},
  RENEWAL:               {documentType:'NATIONAL_ID', ocrEnabled:false, ocrRequired:false, manualEntryFallback:true, confidenceThreshold:0.85, note:'Prefill từ hợp đồng cũ — xác nhận thay đổi.'}
};

// ---- OCR policy theo riskObjectType ----
BANCA.ocrPolicy = {
  VEHICLE: {
    riskObjectType:'VEHICLE',
    supportedDocuments:[
      {documentType:'VEHICLE_REGISTRATION', label:'Giấy đăng ký xe', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true,
       extractedFields:['plate','ownerName','brand','model','type','chassisNumber','engineNumber','manufactureYear','color','registrationDate']},
      {documentType:'VEHICLE_INSPECTION', label:'Giấy đăng kiểm', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true, extractedFields:['plate','inspectionExpiry']},
      {documentType:'PURCHASE_INVOICE', label:'Hóa đơn mua xe', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true, extractedFields:['vehicleValue']}
    ]
  },
  INSURED_PERSON: {riskObjectType:'INSURED_PERSON', supportedDocuments:[{documentType:'NATIONAL_ID', label:'CCCD/Hộ chiếu người được BH', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true, extractedFields:['fullName','idNumber','dob','gender']}]},
  PROPERTY:  {riskObjectType:'PROPERTY',  supportedDocuments:[{documentType:'OWNERSHIP_CERT', label:'Sổ hồng/sổ đỏ', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true, extractedFields:['ownerName','address','area','propertyType','refValue']}]},
  TRIP:      {riskObjectType:'TRIP',      supportedDocuments:[{documentType:'PASSPORT', label:'Hộ chiếu', ocrEnabled:true, ocrRequired:false, manualEntryFallback:true, extractedFields:['fullName','passportNo','nationality']}]},
  MEMBER_LIST:{riskObjectType:'MEMBER_LIST', supportedDocuments:[{documentType:'MEMBER_EXCEL', label:'File danh sách (Excel)', ocrEnabled:false, importEnabled:true, manualEntryFallback:true, extractedFields:['memberCount']}]}
};

// ---- Mock OCR extraction (giả lập) ----
BANCA.OCR_MOCK = {
  NATIONAL_ID: {
    overall:0.96,
    fields:[
      {key:'fullName', label:'Họ tên', value:'Nguyễn Văn An', confidence:0.98},
      {key:'idNumber', label:'Số CCCD', value:'079203001288', confidence:0.97},
      {key:'dob', label:'Ngày sinh', value:'12/05/1988', confidence:0.95},
      {key:'gender', label:'Giới tính', value:'Nam', confidence:0.99},
      {key:'nationality', label:'Quốc tịch', value:'Việt Nam', confidence:0.99},
      {key:'address', label:'Địa chỉ', value:'12 Nguyễn Huệ, Q.1, TP.HCM', confidence:0.82},
      {key:'issueDate', label:'Ngày cấp', value:'20/03/2021', confidence:0.9},
      {key:'expiryDate', label:'Ngày hết hạn', value:'12/05/2033', confidence:0.9}
    ]
  },
  VEHICLE_REGISTRATION: {
    overall:0.94,
    // vehicleValue KHÔNG có trên đăng ký — dùng để demo mismatch với bank asset
    ocrValue:1400000000,
    fields:[
      {key:'plate', label:'Biển số', value:'51K-123.45', confidence:0.97},
      {key:'ownerName', label:'Chủ xe', value:'Nguyễn Văn An', confidence:0.96},
      {key:'brand', label:'Hãng xe', value:'Toyota', confidence:0.98},
      {key:'model', label:'Dòng xe', value:'Camry', confidence:0.95},
      {key:'type', label:'Loại xe', value:'Sedan', confidence:0.93},
      {key:'chassisNumber', label:'Số khung (VIN)', value:'RL4ZZ29B7NC012345', confidence:0.9},
      {key:'engineNumber', label:'Số máy', value:'2AR-1234567', confidence:0.89},
      {key:'manufactureYear', label:'Năm SX', value:'2022', confidence:0.96},
      {key:'color', label:'Màu xe', value:'Đen', confidence:0.94},
      {key:'seats', label:'Số chỗ ngồi', value:'5', confidence:0.72},
      {key:'registrationDate', label:'Ngày đăng ký', value:'15/06/2022', confidence:0.92}
    ]
  }
};

// Trả về kết quả OCR mô phỏng cho 1 documentType
BANCA.mockOcr = function(documentType){
  const src = BANCA.OCR_MOCK[documentType];
  if(!src) return {overall:0, fields:[]};
  return JSON.parse(JSON.stringify(src));
};
BANCA.pctConf = c => Math.round(c*100)+'%';

// ============================================================
// UNIFIED DOCUMENT ITEM — OCR là capability của document item, KHÔNG phải section riêng.
// Một record tài liệu (vd Giấy đăng ký xe) dùng chung ở Risk Object tab + Documents tab,
// không upload lại, không tạo bản trùng. Mỗi item có 4 status độc lập.
// ============================================================
BANCA.__docDefs = BANCA.__docDefs || {};
BANCA.docKey = id => 'banca_docstore_'+id;
BANCA.docAll = id => { try{ return JSON.parse(localStorage.getItem(BANCA.docKey(id))||'{}'); }catch(e){ return {}; } };
BANCA.docGet = (id,code) => (BANCA.docAll(id))[code] || {};
BANCA.docPatch = (id,code,patch) => { const s=BANCA.docAll(id); s[code]=Object.assign(s[code]||{}, patch); localStorage.setItem(BANCA.docKey(id), JSON.stringify(s)); };

// def: {code,name,sub,ocr:'enabled'|'optional'|'none',required,docType}
BANCA.docItemHtml = function(appId, def){
  BANCA.__docDefs[def.code] = def; // registry để re-render sau upload
  const rec = BANCA.docGet(appId, def.code);
  // "Đã có" = có file thật (dataUrl/fileName) HOẶC hệ thống đã ghi nhận tài liệu này được cung cấp (def.uploaded,
  // vd CCCD đã bóc tách OCR ở bước Khách hàng). Tránh cảnh "đã có hình mà vẫn hiện Tải lên".
  const hasFile = !!(rec.dataUrl||rec.fileName||def.uploaded);
  const ocrOn = def.ocr==='enabled'||def.ocr==='optional';
  const upStatus = hasFile?'UPLOADED':(def.required?'MISSING':'NONE');
  const ocrStatus = !ocrOn?'NOT_REQUIRED':(hasFile?(rec.ocrStatus||'EXTRACTED'):'PENDING');
  const revStatus = rec.reviewStatus||'NOT_REVIEWED';
  const verStatus = rec.verificationStatus||'UNVERIFIED';
  const dot = def.required?['●','var(--red-600)','#fdecec']:def.ocr==='optional'?['◐','var(--amber-600)','#fdf3e3']:['○','var(--ink-300)','var(--paper)'];
  // status chips (chỉ hiện cái có nghĩa)
  const chips=[];
  chips.push(hasFile?'<span class="badge badge-ready">Đã tải</span>':(def.required?'<span class="badge badge-blocked">Còn thiếu</span>':'<span class="badge badge-version">Tùy chọn</span>'));
  if(ocrOn && hasFile) chips.push(BANCA.ocrStateBadge('ocr', ocrStatus));
  // Bỏ chip trạng thái duyệt của nhân viên tư vấn (không còn hành động duyệt ở bước tải tài liệu).
  if(hasFile && def.locked && revStatus && revStatus!=='NOT_REVIEWED') chips.push(BANCA.ocrStateBadge('review', revStatus));
  if(hasFile && verStatus!=='UNVERIFIED') chips.push(BANCA.ocrStateBadge('verify', verStatus));
  // Thumbnail: có ảnh → ảnh; đã cung cấp nhưng không có ảnh (vd bóc tách OCR) → icon tài liệu; chưa có → chấm trạng thái.
  const thumb = rec.dataUrl
    ? `<img class="doc-item-thumb" src="${rec.dataUrl}" alt="">`
    : (hasFile
      ? `<span style="display:inline-flex;width:40px;height:40px;border-radius:8px;align-items:center;justify-content:center;background:#eaf1fe;color:#2563eb;font-size:18px;">📄</span>`
      : `<span style="display:inline-flex;width:40px;height:40px;border-radius:8px;align-items:center;justify-content:center;font-weight:800;background:${dot[2]};color:${dot[1]};">${dot[0]}</span>`);
  const fid='docf-'+def.code;
  let actions;
  if(def.locked){
    // Section "Tài liệu được OCR" — chỉ đọc, không cho thay thế
    actions = hasFile ? `<button class="btn btn-secondary btn-sm" onclick="docPreview('${appId}','${def.code}')">Xem</button>` : '<span style="font-size:11px;color:var(--ink-300);">Chưa có</span>';
  } else if(!hasFile){
    actions = `<input type="file" id="${fid}" accept="image/*" style="display:none" onchange="docUpload('${appId}','${def.code}','${def.docType||''}',this)">`
      +`<button class="btn ${def.required?'btn-primary':'btn-secondary'} btn-sm" onclick="document.getElementById('${fid}').click()">Tải lên</button>`
      +(ocrOn?`<input type="file" id="${fid}c" accept="image/*" capture="environment" style="display:none" onchange="docUpload('${appId}','${def.code}','${def.docType||''}',this)"><button class="btn btn-secondary btn-sm" onclick="document.getElementById('${fid}c').click()">📷</button>`:'');
  } else {
    // Nhân viên tư vấn chỉ tải/thay thế; việc duyệt thuộc thẩm định (UW) — bỏ nút "Duyệt" thừa ở đây.
    actions = `<button class="btn btn-secondary btn-sm" onclick="docPreview('${appId}','${def.code}')">Xem</button>`
      +`<input type="file" id="${fid}" accept="image/*" style="display:none" onchange="docUpload('${appId}','${def.code}','${def.docType||''}',this)"><button class="btn btn-secondary btn-sm" onclick="document.getElementById('${fid}').click()">Thay thế</button>`;
  }
  return `<div class="doc-item" id="docitem-${def.code}">
    <div>${thumb}</div>
    <div><div style="font-weight:600;font-size:13px;">${def.name}</div><div style="font-size:12px;color:var(--ink-500);">${def.sub||''}</div><div class="doc-item-statuses">${chips.join(' ')}</div>${rec.fileName?`<div style="font-size:11px;color:var(--ink-300);margin-top:2px;">${rec.fileName}</div>`:''}</div>
    <div class="doc-item-actions">${actions}</div>
  </div>`;
};
// Auto-fill field theo label (dùng chung, không phụ thuộc tab)
BANCA.docAutoFill = function(docType, res){
  const g = k => ((res.fields.find(f=>f.key===k)||{}).value)||'';
  const byId = (id,v)=>{ const el=document.getElementById(id); if(el&&v) el.value=v; };
  const byLabel = (re,v)=>{ const el=[...document.querySelectorAll('.field')].find(fd=>re.test((fd.querySelector('label')||{}).textContent||'')); if(el){ const inp=el.querySelector('input'); if(inp&&v) inp.value=v; } };
  if(docType==='NATIONAL_ID'){ byId('cf-name',g('fullName')); byId('cf-dob',g('dob')); byId('cf-id',g('idNumber')); byId('cf-address',g('address')); }
  if(docType==='VEHICLE_REGISTRATION'){ byId('vm-brand',g('brand')); byId('vm-model',g('model')); byId('vm-type',g('type')); byLabel(/Số khung|VIN/,g('chassisNumber')); byLabel(/Số máy/,g('engineNumber')); byLabel(/Năm sản xuất/,g('manufactureYear')); byLabel(/Biển số/,g('plate')); }
};
window.docUpload = function(appId, code, docType, inputEl){
  const file = inputEl.files && inputEl.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    const patch = {fileName:file.name, dataUrl:e.target.result, uploadStatus:'UPLOADED'};
    if(docType && BANCA.OCR_MOCK[docType]){
      const res = BANCA.mockOcr(docType);
      patch.ocrStatus = res.overall<0.85?'LOW_CONFIDENCE':'EXTRACTED';
      patch.extracted = res;
      patch.reviewStatus = 'NOT_REVIEWED';
      BANCA.docAutoFill(docType, res);
    }
    BANCA.docPatch(appId, code, patch);
    const def = BANCA.__docDefs[code];
    const el = document.getElementById('docitem-'+code);
    if(def && el) el.outerHTML = BANCA.docItemHtml(appId, def);
    if(window.__docRefresh) window.__docRefresh();
  };
  reader.readAsDataURL(file);
};
window.docReview = function(appId, code){ BANCA.docPatch(appId, code, {reviewStatus:'SELLER_REVIEWED', verificationStatus:'VERIFIED'}); const def=BANCA.__docDefs[code]; const el=document.getElementById('docitem-'+code); if(def&&el) el.outerHTML=BANCA.docItemHtml(appId, def); };
window.docPreview = function(appId, code){ const rec=BANCA.docGet(appId,code); if(!rec.dataUrl){ return; } const root=document.getElementById('start-sale-root')||document.body; const d=document.createElement('div'); d.className='modal-overlay2 open'; d.onclick=function(ev){ if(ev.target===d) d.remove(); };
 const ex=rec.extracted;
 const ocrBlock = ex? `<div style="margin-top:10px;"><div style="font-size:12px;color:var(--ink-500);margin-bottom:4px;">Kết quả OCR · tin cậy ${BANCA.pctConf(ex.overall)}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;">${ex.fields.slice(0,6).map(f=>`<div><span style="color:var(--ink-500);">${f.label}:</span> <b>${f.value}</b></div>`).join('')}</div></div>`:'';
 const verHist = `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);"><div style="font-size:12px;color:var(--ink-500);margin-bottom:4px;">Lịch sử phiên bản</div><div style="font-size:12px;">V1 <span class="badge badge-blocked" style="font-size:9px;">Bị từ chối</span> → V2 <span class="badge badge-ready" style="font-size:9px;">Đã chấp nhận</span></div></div>`;
 const meta=`<div style="margin-top:10px;font-size:11px;color:var(--ink-300);">Tải bởi: Nhân viên tư vấn · ${rec.fileName||'—'} · Nguồn: ${ex?'OCR':'Upload'} · Trạng thái: ${(BANCA.OCR_STATE.verify[rec.verificationStatus]||'Chưa xác minh')}</div>`;
 d.innerHTML=`<div class="modal2" style="max-width:600px;" onclick="event.stopPropagation()"><div class="modal2-head"><b>${(BANCA.__docDefs[code]||{}).name||'Tài liệu'}</b><span class="modal2-close" onclick="this.closest('.modal-overlay2').remove()">&times;</span></div><div class="modal2-body"><img src="${rec.dataUrl}" style="width:100%;border-radius:8px;">${ocrBlock}${verHist}${meta}</div></div>`; root.appendChild(d); };
