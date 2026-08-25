// KHÔNG NGÕ CỤT — mọi trạng thái phải có việc tiếp theo làm được, và mọi lần bị
// chặn phải có đường ra. Chạy: node scripts/test-flow-no-deadend.js
//
// Vì sao cần bộ này: cổng thanh toán càng nhiều chốt thì càng dễ tạo trạng thái
// "bị khoá mà không biết làm gì". Hai lỗi đã bắt được khi viết bộ này:
//   · nộp hồ sơ mà phiên báo giá còn DRAFT → khoá vĩnh viễn, không nút nào duyệt
//   · đang bị chặn nhưng dòng "việc tiếp theo" vẫn ghi "Khởi tạo thanh toán"
//     — bảo người dùng làm đúng thứ duy nhất họ không bấm được (§15.3)
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

const TERMINAL = ['POLICY_ISSUED','CANCELLED','DECLINED'];

/* 1. Mọi hồ sơ seed đều có việc tiếp theo + nút bấm ------------------ */
grp('1. Mọi hồ sơ đều có "việc tiếp theo" và một nút để bấm');
const apps = (B.applications||[]).filter(a => String(a.id).indexOf('APP-') === 0);
const noLabel = apps.filter(a => !((B.deriveCaseViewState(a).nextActionLabel)||'').trim());
const noBtn = apps.filter(a => { const v = B.deriveCaseViewState(a); return !v.primaryAction && TERMINAL.indexOf(v.phase) < 0; });
ok('không hồ sơ nào thiếu "việc tiếp theo"', noLabel.length === 0, noLabel.map(a=>a.id).join(','));
ok('không hồ sơ nào thiếu nút hành động', noBtn.length === 0, noBtn.map(a=>a.id).join(','));

/* 2. Nhánh xấu vẫn có đường đi ---------------------------------------- */
grp('2. Nhánh xấu (thanh toán lỗi / phát hành lỗi / từ chối) vẫn có đường');
const src = B.appById('APP-2026-107');
function mk(o){ return Object.assign({ id:'S', owner:ME, customerId:'CUS-001', productId:'motor',
  productName:'X', package:'Standard', premium:12000000, riskAnswers:src.riskAnswers,
  answeredBy:src.answeredBy, statementOfFact:src.statementOfFact, quote:{premium:12000000},
  applicationStatus:'PROCESSING', confirm:{otp:'VERIFIED'} }, o); }
[
  ['thanh toán thất bại', {status:'PENDING_PAYMENT',underwritingStatus:'DECIDED',underwritingDecision:'APPROVED',paymentStatus:'FAILED',payment:{status:'FAILED',amount:12000000}}],
  ['yêu cầu thanh toán hết hạn', {status:'PENDING_PAYMENT',underwritingStatus:'DECIDED',underwritingDecision:'APPROVED',paymentStatus:'EXPIRED',payment:{status:'EXPIRED',amount:12000000}}],
  ['đã thu tiền nhưng phát hành lỗi', {status:'PENDING_ISSUE',underwritingStatus:'DECIDED',underwritingDecision:'APPROVED',paymentStatus:'SUCCESS',policyStatus:'ISSUE_FAILED',payment:{status:'SUCCESS',amount:12000000}}],
  ['thẩm định từ chối', {status:'REJECTED',underwritingStatus:'DECIDED',underwritingDecision:'DECLINED'}],
  ['yêu cầu đã huỷ', {status:'CANCELLED',applicationStatus:'CANCELLED'}]
].forEach(function(row){
  const v = B.deriveCaseViewState(mk(row[1]));
  ok(row[0] + ' → có lối đi', !!((v.nextActionLabel||'').trim()) && !!v.primaryAction, v.nextActionLabel);
});

/* 3. Nộp hồ sơ không bao giờ để phiên báo giá kẹt ở DRAFT ------------- */
grp('3. Nộp hồ sơ KHÔNG để phiên báo giá kẹt ở nháp (ngõ cụt không nút gỡ)');
const a1 = mk({ status:'PENDING_PAYMENT', underwritingStatus:'DECIDED', underwritingDecision:'APPROVED',
  paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED' });
Object.assign(a1, B.quoteVersion.freezeOnSubmit(a1, a1.premium));
ok('hồ sơ chưa có phiên → nộp là sinh v1 ĐÃ DUYỆT',
  B.quoteVersion.active(a1).status === 'APPROVED');
// hồ sơ đã có phiên nháp từ lúc sửa nháp
const a2 = mk({ status:'PENDING_PAYMENT', underwritingStatus:'DECIDED', underwritingDecision:'APPROVED',
  paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED', quoteVersions:[] });
B.quoteVersion.init(a2, a2.premium);              // init tạo ra ở trạng thái DRAFT
ok('  …trước khi nộp: phiên đang là nháp', B.quoteVersion.active(a2).status === 'DRAFT');
Object.assign(a2, B.quoteVersion.freezeOnSubmit(a2, a2.premium));
ok('  …nộp xong: phiên nháp được DUYỆT, không kẹt',
  B.quoteVersion.active(a2).status === 'APPROVED');
ok('  …và cổng thanh toán mở được', B.paymentEnableRule(a2, {me:ME}).enabled,
  (B.paymentEnableRule(a2, {me:ME}).reasons||[]).join(' | '));

/* 4. Bị chặn thì "việc tiếp theo" phải nói ĐÚNG việc phải làm --------- */
grp('4. Bị chặn → "việc tiếp theo" nêu việc phải xử lý, không bảo đi thu tiền');
function blockedView(mut){
  const a = mk({ status:'PAYMENT_METHOD_REQUIRED', underwritingStatus:'DECIDED',
    underwritingDecision:'APPROVED', paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED' });
  Object.assign(a, B.quoteVersion.freezeOnSubmit(a, a.premium));
  mut(a);
  return { a: a, v: B.deriveCaseViewState(a), g: B.paymentEnableRule(a, {me:ME}) };
}
const blocks = [
  ['phí bị tính lại', function(a){ Object.assign(a, B.quoteVersion.reRateFields(a, a.premium+1500000, 'Phụ phí')); },
                      function(a){ Object.assign(a, B.quoteVersion.approveFields(a)); }],
  ['khai báo cần xác nhận lại', function(a){ B.declaration.markNeedsReconfirm(a, 'Đổi khách hàng'); },
                      function(a){ delete a.declarationReconfirm; a.warningFlags=(a.warningFlags||[]).filter(function(f){return f!=='DECLARATION_NEEDS_RECONFIRM';}); }],
  ['bản khai chưa ai xác nhận', function(a){ delete a.statementOfFact; },
                      function(a){ B.statementOfFact.confirm(a, {by:'CUSTOMER'}); }],
  ['thiếu tài liệu bắt buộc', function(a){ a.missingRequiredDocument = true; },
                      function(a){ a.missingRequiredDocument = false; }]
];
blocks.forEach(function(row){
  const r = blockedView(row[1]);
  ok(row[0] + ' → cổng đóng', !r.g.enabled);
  ok('  …"việc tiếp theo" nêu việc phải xử lý, KHÔNG bảo khởi tạo thanh toán',
    /Cần xử lý trước khi thu tiền/.test(r.v.nextActionLabel||''), r.v.nextActionLabel);
  ok('  …vẫn vào được màn thanh toán để đọc lý do', r.v.paymentAccessible === true);
  row[2](r.a);
  ok('  …xử lý xong thì MỞ LẠI', B.paymentEnableRule(r.a, {me:ME}).enabled,
    (B.paymentEnableRule(r.a, {me:ME}).reasons||[]).join(' | '));
});

/* 5. Không chặn oan khi đã đủ điều kiện -------------------------------- */
grp('5. Đủ điều kiện thì KHÔNG đổi câu chữ (không chặn oan)');
const okCase = blockedView(function(){});
ok('cổng mở', okCase.g.enabled, (okCase.g.reasons||[]).join(' | '));
ok('  …và "việc tiếp theo" vẫn là khởi tạo thanh toán',
  /Khởi tạo thanh toán/.test(okCase.v.nextActionLabel||''), okCase.v.nextActionLabel);

/* 6. Phiên tư vấn: mọi trạng thái nằm trong một nhóm có lối đi --------- */
grp('6. Phiên tư vấn: mọi trạng thái thuộc nhóm có hành động');
const GROUPS = ['ACTIVE','FOLLOW_UP','SHARED','CONVERTED','CLOSED'];
const orphan = Object.keys(B.ADVICE_STATUS).filter(function(s){
  return GROUPS.indexOf((B.ADVICE_STATUS[s]||{}).group) < 0;
});
ok('không trạng thái tư vấn nào lạc nhóm', orphan.length === 0, orphan.join(','));

console.log('\n' + (fail ? ('✗ FAIL ' + fail + ' / PASS ' + pass) : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
