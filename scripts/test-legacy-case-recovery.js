// HỒ SƠ ĐÃ NỘP TRƯỚC KHI CÓ PHẦN GHI NHẬN "AI TRẢ LỜI" PHẢI GỠ ĐƯỢC.
// Chạy: node scripts/test-legacy-case-recovery.js
//
// Bối cảnh (phản hồi thật 2026-08-24): người bán tạo bản chào, TRẢ LỜI ĐỦ câu
// khai báo, nộp hồ sơ. Sau đó cổng bản khai được bổ sung. Hồ sơ đã nộp không còn
// bước "Khai báo rủi ro" (submitted mode chỉ có created/underwriting/
// confirmation-payment/policy) ⇒ bị khoá thu phí mà KHÔNG chỗ nào gỡ.
//
// Nguyên tắc: lý do chặn phải đi kèm PHƯƠNG TIỆN gỡ, ngay trên màn hình đang
// chặn (§15.3). Và KHÔNG tự điền "khách đã trả lời" — đó là "assumptive answer"
// mà CII IF3 2/4 cấm; phải hỏi người bán.
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

// Hồ sơ kiểu CŨ: trả lời đủ, KHÔNG có answeredBy, KHÔNG có statementOfFact.
function legacyCase(){
  const a = { id:'DRAFT-2026-NEW', owner:ME, customerId:'CUS-001', productId:'motor',
    productName:'Bảo hiểm vật chất xe', package:'STANDARD', premium:9000000,
    submissionState:'SUBMITTED', status:'PAYMENT_METHOD_REQUIRED', applicationStatus:'PROCESSING',
    underwritingStatus:'DECIDED', underwritingDecision:'APPROVED_STP',
    paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED',
    confirm:{ otp:'VERIFIED' }, quote:{ premium:9000000 }, riskAnswers:{} };
  (B.riskQuestionsFor('motor')||[]).forEach(function(q){
    if (q.branchOn) return;
    a.riskAnswers[q.code] = q.type === 'number' ? 0 : (q.triggers === 'consent' ? true : false);
  });
  Object.assign(a, B.quoteVersion.freezeOnSubmit(a, a.premium));
  return a;
}

grp('1. Hồ sơ cũ: đã trả lời đủ nhưng chưa ghi ai trả lời');
const a = legacyCase();
const sof = B.statementOfFact.build(a);
ok('nội dung khai báo KHÔNG thiếu câu nào', sof.unanswered.length === 0, sof.unanswered.join(','));
ok('  …chỉ thiếu ghi nhận người trả lời', sof.unattributed.length > 0);
const g0 = B.paymentEnableRule(a, { me:ME });
ok('cổng thanh toán đang khoá', !g0.enabled);

grp('2. Lý do chặn phải nói ĐÚNG cái thiếu, không đọc nhầm thành "chưa trả lời"');
const reason = B.statementOfFact.blockingReason(a);
console.log('     lý do: ' + reason);
ok('nêu rõ đã trả lời đủ', /Đã trả lời đủ/.test(reason), reason);
ok('  …và cái thiếu là NGƯỜI trả lời', /NGƯỜI trả lời/.test(reason), reason);
ok('  …chỉ chỗ để xử lý', /Xác nhận & thanh toán/.test(reason), reason);

grp('3. Gỡ được NGAY tại màn Xác nhận & thanh toán (không cần quay lại bước nháp)');
const ws = fs.readFileSync(path.join(ROOT, 'modules/application-workspace/app-workspace.js'), 'utf8');
ok('màn thanh toán có khối xử lý bản khai', /declarationFixPanel/.test(ws));
ok('  …được gắn vào đúng màn Xác nhận & thanh toán',
  /return declarationFixPanel\(app\) \+ BANCA\.ui\.confirmationPaymentPanel/.test(ws));
ok('  …có hành động ghi nhận người trả lời', /submittedSetDeclarationSource/.test(ws));
ok('  …có hành động ghi nhận khách xác nhận', /submittedConfirmDeclaration/.test(ws));
ok('  …và đọc lại bản khai cho khách ngay tại đó', /BANCA\.ui\.declarationReadBack\(a\)/.test(ws));
// Gọi thật: khối phải DỰNG RA HTML, không chỉ được nhắc tên trong file.
ok('  …khối gỡ dựng ra HTML thật cho hồ sơ đã nộp',
  B.ui.declarationSourcePicker(a, { handler:'submittedSetDeclarationSource', bare:true }).length > 0
  && B.ui.declarationReadBack(a).length > 0);

grp('4. Người bán chọn nguồn → gỡ được, KHÔNG cần khai lại câu nào');
const before = JSON.stringify(a.riskAnswers);
a.answeredBy = a.answeredBy || {};
Object.keys(a.riskAnswers).forEach(function(k){ if(!a.answeredBy[k]) a.answeredBy[k] = 'CUSTOMER'; });
a.declarationAnsweredBy = 'CUSTOMER';
ok('nội dung câu trả lời KHÔNG bị đụng vào', JSON.stringify(a.riskAnswers) === before);
ok('  …hết thiếu quy kết', B.statementOfFact.build(a).unattributed.length === 0);
ok('  …trạng thái chuyển sang chờ khách xác nhận', B.statementOfFact.status(a) === 'PENDING');
B.statementOfFact.confirm(a, { by:'CUSTOMER', channel:'PORTAL' });
ok('khách xác nhận → CONFIRMED', B.statementOfFact.status(a) === 'CONFIRMED');
const g1 = B.paymentEnableRule(a, { me:ME });
ok('  …thu được phí', g1.enabled, (g1.reasons||[]).join(' | '));

grp('5. KHÔNG được tự đoán hộ (IF3 2/4)');
const b = legacyCase();
ok('hệ thống KHÔNG tự điền quy kết khi chỉ dựng lại bản khai',
  B.statementOfFact.build(b).unattributed.length > 0);
ok('  …và confirm() từ chối khi chưa có quy kết', (function(){
  try { B.statementOfFact.confirm(b, {}); return false; }
  catch (e) { return /ai trả lời/.test(e.message); }
})());

console.log('\n' + (fail ? ('✗ FAIL ' + fail + ' / PASS ' + pass) : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
