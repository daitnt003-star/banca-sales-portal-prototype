// BÁN MỚI PHẢI THU ĐƯỢC TIỀN. Chạy: node scripts/test-new-sale-declaration.js
//
// Lỗi đã xảy ra 2026-08-24: cổng bản khai (statement of fact) được nối vào
// paymentEnableRule nhưng KHÔNG màn hình nào ghi được `answeredBy`, và cũng
// không màn hình nào gọi statementOfFact.confirm(). Hệ quả: mọi hồ sơ bán MỚI
// bị khoá thanh toán vĩnh viễn, không nút nào gỡ. Hồ sơ seed không lộ vì đã
// được backfill sẵn — nên bộ test cũ xanh hết.
//
// Bộ này đi từ hồ sơ TRỐNG như người bán thật, cho cả 3 sản phẩm, gồm cả
// sức khoẻ (khai báo theo TỪNG NGƯỜI — questionnaireMode PER_MEMBER).
//
// Nền nghiệp vụ: CII IF3 2/4 (đọc lại cho khách, cấm "assumptive answer"),
//                CII IF3 2/3 mục B (bản khai là cơ sở chấp nhận rủi ro)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = global;
let LS = {};
global.localStorage = { getItem:k=>(k in LS?LS[k]:null), setItem:(k,v)=>{LS[k]=String(v);},
  removeItem:k=>{delete LS[k];}, get length(){return Object.keys(LS).length;}, key:i=>Object.keys(LS)[i] };
global.document = { getElementById:()=>null, querySelector:()=>null,
  createElement:()=>({style:{},classList:{add(){},remove(){}}}), addEventListener(){}, head:{appendChild(){}}, body:{} };
global.location = { search:'', href:'', reload(){}, pathname:'/' };
global.navigator = { userAgent:'node' };
global.alert = () => {};
const loader = fs.readFileSync(path.join(ROOT, 'shared/js/head-loader.js'), 'utf8');
[...new Set([...loader.matchAll(/['"]((?:shared|modules)\/[^'"]+\.js)(?:\?[^'"]*)?['"]/g)].map(m => m[1]))]
  .forEach(f => { const p = path.join(ROOT, f); if (fs.existsSync(p)) { try { (0,eval)(fs.readFileSync(p,'utf8')); } catch (e) {} } });
const B = global.BANCA;
LS['bancaChannel'] = 'BANCA_INTEGRATED';
const ME = 'RM-01';
B.current = () => ME;

let pass = 0, fail = 0;
function ok(n, c, x){ if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.log('  ✗ '+n+(x?('  → '+x):''));} }
function grp(t){ console.log('\n' + t); }

const PRODUCTS = [
  { id:'motor',  pkg:'STANDARD', members:false },
  { id:'pa',     pkg:'PA_STD',   members:false },
  { id:'health', pkg:'STANDARD', members:true  }
];

function newSale(P){
  const a = { id:'DRAFT-2026-NEW', submissionState:'NOT_SUBMITTED', owner:ME, customerId:'CUS-001',
    productId:P.id, productName:'X', package:P.pkg, premium:9000000,
    quote:{premium:9000000}, riskAnswers:{} };
  if (P.members) a.insuredMembers = [
    { insuredUnitId:'IU-1', name:'Nguyễn Văn Minh', active:true, riskAnswers:{} },
    { insuredUnitId:'IU-2', name:'Trần Thị Mai',    active:true, riskAnswers:{} }
  ];
  return a;
}
// Mô phỏng đúng setRiskAnswer / healthUnitSetRisk: ghi câu trả lời + quy kết theo
// lựa chọn "ai trả lời" mà người bán đã khai ở đầu bước.
function answerAll(a, source){
  a.declarationAnsweredBy = source || null;
  const qs = B.riskQuestionsFor(a.productId) || [];
  function fill(ans, by){
    qs.forEach(function(q){
      if (q.branchOn) return;                       // câu nhánh: chưa kích hoạt
      ans[q.code] = q.type === 'number' ? 0 : (q.triggers === 'consent' ? true : false);
      if (a.declarationAnsweredBy) by[q.code] = a.declarationAnsweredBy;
    });
  }
  if (B.statementOfFact.perMember(a) && a.insuredMembers) {
    a.insuredMembers.forEach(function(m){ m.answeredBy = m.answeredBy || {}; fill(m.riskAnswers, m.answeredBy); });
  } else {
    a.answeredBy = a.answeredBy || {}; fill(a.riskAnswers, a.answeredBy);
  }
}
// Mô phỏng submitApp: ô tick "khách xác nhận kê khai" ⇒ ghi bản ghi bản khai.
function submit(a){
  try {
    if ((B.riskQuestionsFor(a.productId)||[]).length)
      B.statementOfFact.confirm(a, { by:a.declarationAnsweredBy || null, channel:'PORTAL' });
  } catch (e) { a.__blocked = e.message; return a; }
  Object.assign(a, { submissionState:'SUBMITTED', applicationStatus:'PROCESSING',
    status:'PAYMENT_METHOD_REQUIRED', underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_STP',
    paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED', confirm:{otp:'VERIFIED'} });
  Object.assign(a, B.quoteVersion.freezeOnSubmit(a, a.premium));
  return a;
}

/* 1 — chưa khai ai trả lời thì chặn NGAY LÚC NỘP -------------------- */
grp('1. Chưa khai "ai trả lời" → chặn ngay lúc NỘP, không để lòi ra ở bước thu tiền');
PRODUCTS.forEach(function(P){
  const a = newSale(P); answerAll(a, null); submit(a);
  ok(P.id + ': chặn ở bước nộp', !!a.__blocked && /ai trả lời/.test(a.__blocked), a.__blocked || 'KHÔNG chặn');
});

/* 2 — khai xong thì bán được, cả 3 sản phẩm ------------------------- */
grp('2. Khai "Khách tự trả lời" → hồ sơ bán MỚI thu được tiền');
PRODUCTS.forEach(function(P){
  const a = newSale(P); answerAll(a, 'CUSTOMER'); submit(a);
  ok(P.id + ': nộp được', !a.__blocked, a.__blocked);
  ok('  …bản khai CONFIRMED', B.statementOfFact.status(a) === 'CONFIRMED', B.statementOfFact.status(a));
  const g = B.paymentEnableRule(a, { me:ME });
  ok('  …cổng thanh toán MỞ', g.enabled, (g.reasons||[]).join(' | '));
});

/* 3 — sức khoẻ đọc đúng chỗ lưu câu trả lời -------------------------- */
grp('3. Sức khoẻ khai theo TỪNG NGƯỜI — cổng phải đọc đúng chỗ');
const h = newSale(PRODUCTS[2]);
ok('nhận diện được bản khai theo từng người', B.statementOfFact.perMember(h) === true);
answerAll(h, 'CUSTOMER');
const sofH = B.statementOfFact.build(h);
ok('bản khai gộp đủ các thành viên đang hoạt động',
  sofH.lines.filter(function(l){ return l.memberId === 'IU-1'; }).length > 0 &&
  sofH.lines.filter(function(l){ return l.memberId === 'IU-2'; }).length > 0);
ok('  …mỗi dòng ghi rõ của ai', sofH.lines.every(function(l){ return !!l.memberLabel; }));
ok('  …không còn câu nào thiếu trả lời/quy kết',
  sofH.unanswered.length === 0 && sofH.unattributed.length === 0,
  sofH.unanswered.concat(sofH.unattributed).join(','));
// thành viên bị loại thì không tính vào bản khai
h.insuredMembers[1].active = false;
ok('thành viên đã loại KHÔNG bị tính vào bản khai',
  B.statementOfFact.build(h).lines.every(function(l){ return l.memberId !== 'IU-2'; }));

/* 4 — nhập hộ vẫn hợp lệ, chỉ khác quy kết --------------------------- */
grp('4. Nhân viên nhập hộ là hợp lệ — chỉ cần GHI LẠI (IF3 2/4)');
const onBehalf = newSale(PRODUCTS[0]); answerAll(onBehalf, 'SELLER_ON_BEHALF'); submit(onBehalf);
ok('nhập hộ vẫn bán được', B.paymentEnableRule(onBehalf, { me:ME }).enabled);
ok('  …và ghi rõ là nhân viên nhập hộ, không nhận vơ cho khách',
  B.statementOfFact.build(onBehalf).lines.every(function(l){ return l.answeredBy === 'SELLER_ON_BEHALF'; }));
ok('  …bản ghi xác nhận lưu đúng người bấm xác nhận',
  onBehalf.statementOfFact && onBehalf.statementOfFact.confirmedBy === 'SELLER_ON_BEHALF',
  JSON.stringify((onBehalf.statementOfFact||{}).confirmedBy));

/* 5 — sửa câu trả lời sau khi khách xác nhận → phải khai lại --------- */
grp('5. Sửa bản khai sau khi khách đã xác nhận → phải xác nhận lại');
const m2 = newSale(PRODUCTS[0]); answerAll(m2, 'CUSTOMER'); submit(m2);
ok('trước khi sửa: CONFIRMED', B.statementOfFact.status(m2) === 'CONFIRMED');
m2.riskAnswers.claimCount = 3;
ok('sau khi sửa: STALE', B.statementOfFact.status(m2) === 'STALE');
ok('  …cổng đóng lại', !B.paymentEnableRule(m2, { me:ME }).enabled);

/* 6 — giao diện có đủ chỗ để làm hai việc trên ----------------------- */
grp('6. Giao diện PHẢI có chỗ làm hai việc đó (nếu không là ngõ cụt)');
const ws = fs.readFileSync(path.join(ROOT, 'modules/application-workspace/app-workspace.js'), 'utf8');
// GỌI THẬT hàm dựng HTML, không grep chuỗi. Bài học 2026-08-24: assertion cũ chỉ
// kiểm "có nhắc tên hàm trong file" nên vẫn xanh trong khi khối KHÔNG BAO GIỜ
// hiện — hàm được gán bằng `window.x = function` ở đoạn NẰM SAU chỗ dựng HTML,
// lúc render vẫn undefined, guard `window.x ? ... : ''` âm thầm trả rỗng.
const hlt = B.appById('DRAFT-2026-HLT2');
const pickerHtml = B.ui.declarationSourcePicker(hlt, { readOnly:false, handler:'setDeclarationSource' });
ok('khối chọn "ai trả lời" DỰNG RA HTML thật', pickerHtml.length > 0, 'rỗng — khối không bao giờ hiện');
ok('  …có đủ hai lựa chọn và gắn đúng hàm xử lý',
  /Khách tự trả lời/.test(pickerHtml) && /Nhân viên nhập hộ/.test(pickerHtml)
  && /setDeclarationSource\('DRAFT-2026-HLT2'/.test(pickerHtml));
ok('  …dựng được cho cả hồ sơ nháp lẫn hồ sơ đã nộp (khối dùng chung, không nằm trong 1 nhánh)',
  B.ui.declarationSourcePicker(B.appById('APP-2026-107'), { handler:'submittedSetDeclarationSource', bare:true }).length > 0);
const readBackHtml = B.ui.declarationReadBack(hlt);
ok('bảng đọc lại bản khai DỰNG RA HTML thật', readBackHtml.length > 0, 'rỗng');
ok('  …liệt kê đúng câu của thành viên (sức khoẻ khai theo từng người)',
  /Trịnh Mỹ Linh/.test(readBackHtml), 'không thấy tên thành viên');
ok('app-workspace gọi khối dùng chung ở CẢ hai bước khai báo',
  (ws.match(/BANCA\.ui\.declarationSourcePicker\(app/g) || []).length >= 2);
ok('setRiskAnswer ghi lại ai trả lời', /answeredBy\[code\]\s*=\s*app\.declarationAnsweredBy/.test(ws));
ok('sức khoẻ ghi quy kết theo từng người', /m\.answeredBy\[code\]=app\.declarationAnsweredBy/.test(ws));
ok('có đọc lại bản khai cho khách trước khi nộp (IF3 2/4)', /BANCA\.ui\.declarationReadBack\(app\)/.test(ws));
ok('nộp hồ sơ thì GHI bản ghi bản khai', /statementOfFact\.confirm\(app/.test(ws));

console.log('\n' + (fail ? ('✗ FAIL ' + fail + ' / PASS ' + pass) : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
