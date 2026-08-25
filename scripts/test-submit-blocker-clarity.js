// NỘP HỒ SƠ: lý do chặn phải nói ĐÚNG cái thiếu và cho xử lý TẠI CHỖ.
// Chạy: node scripts/test-submit-blocker-clarity.js
//
// Phản hồi thật 2026-08-25: "không tạo được bản chào, cứ báo chưa khai báo rủi ro
// trong khi đã trả lời hết rồi". Nguyên nhân: thiếu NGƯỜI trả lời (attribution)
// bị báo bằng alert SAU khi bấm Nộp, với câu 'Quay lại bước "Khai báo rủi ro"'
// — đọc y như "bạn chưa trả lời". Người bán vừa trả lời đủ nên tưởng hệ thống lỗi.
//
// Nguyên tắc: (a) chặn phải HIỆN TRƯỚC khi bấm, (b) nói đúng cái thiếu,
// (c) cho xử lý ngay tại chỗ đang đứng.  [CII IF3 2/4 · §15.3]
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
B.current = () => 'RM-01';

let pass = 0, fail = 0;
function ok(n, c, x){ if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.log('  ✗ '+n+(x?('  → '+x):''));} }
function grp(t){ console.log('\n' + t); }

const ws = fs.readFileSync(path.join(ROOT, 'modules/application-workspace/app-workspace.js'), 'utf8');

/* 1 — chặn phải HIỆN TRƯỚC, không phải alert sau khi bấm ------------- */
grp('1. Thiếu bản khai phải thành BLOCKER hiện trước, không phải alert sau khi bấm Nộp');
ok('bước Rà soát tính blocker từ bản khai', /BANCA\.statementOfFact\.build\(app\)/.test(ws)
  && /blockers\.push\(\{t:'Bản khai còn '/.test(ws));
ok('  …tách RIÊNG "thiếu câu trả lời" và "thiếu người trả lời"',
  /Bản khai còn '\+sofR\.unanswered\.length\+' câu chưa trả lời/.test(ws)
  && /Đã trả lời đủ — còn thiếu ghi nhận AI trả lời/.test(ws));

/* 2 — nói đúng cái thiếu ------------------------------------------- */
grp('2. Câu chữ không được để người bán hiểu nhầm là chưa trả lời');
const a = { id:'T1', owner:'RM-01', customerId:'CUS-001', productId:'motor', package:'STANDARD', riskAnswers:{} };
(B.riskQuestionsFor('motor')||[]).forEach(function(q){
  if (q.branchOn) return;
  a.riskAnswers[q.code] = q.type === 'number' ? 0 : (q.triggers === 'consent' ? true : false);
});
const sof = B.statementOfFact.build(a);
ok('tình huống: trả lời đủ nhưng chưa ghi ai trả lời',
  sof.unanswered.length === 0 && sof.unattributed.length > 0);
const reason = B.statementOfFact.blockingReason(a);
ok('lý do KHÔNG mở đầu bằng "còn N câu chưa trả lời"',
  !/^Bản khai còn \d+ câu chưa trả lời/.test(reason), reason);
ok('  …nói rõ đã trả lời đủ', /Đã trả lời đủ/.test(reason), reason);

/* 3 — alert dự phòng đưa về ĐÚNG chỗ -------------------------------- */
grp('3. Lưới an toàn khi bấm Nộp: đưa về đúng chỗ xử lý');
ok('thiếu NGƯỜI trả lời → giữ ở bước Rà soát (nơi có khối chọn)',
  /_needAnswers\?'RISK_DECLARATION':'REVIEW_AND_SUBMIT'/.test(ws));
ok('  …và nói rõ "Không phải khai lại câu nào"', /Không phải khai lại câu nào/.test(ws));
ok('thiếu CÂU TRẢ LỜI → mới đưa về bước Khai báo rủi ro',
  /_needAnswers = \/chưa trả lời\/\.test\(e\.message\)/.test(ws));

/* 4 — xử lý được TẠI CHỖ ------------------------------------------- */
grp('4. Bước Rà soát cho chọn người trả lời ngay tại đó');
ok('bước Rà soát có khối chọn khi còn thiếu quy kết',
  /unattributed\.length\)\s*\r?\n?\s*\? BANCA\.ui\.declarationSourcePicker\(app/.test(ws)
  || /\.unattributed\.length\)[\s\S]{0,80}declarationSourcePicker\(app/.test(ws));
const picker = B.ui.declarationSourcePicker(a, { readOnly:false, handler:'setDeclarationSource' });
ok('  …khối đó DỰNG RA HTML thật', picker.length > 0 && /Khách tự trả lời/.test(picker));

/* 5 — chọn xong là nộp được, không phải khai lại -------------------- */
grp('5. Chọn xong → nộp được, nội dung câu trả lời không bị đụng');
const before = JSON.stringify(a.riskAnswers);
a.declarationAnsweredBy = 'CUSTOMER';
a.answeredBy = {};
Object.keys(a.riskAnswers).forEach(function(k){ a.answeredBy[k] = 'CUSTOMER'; });
ok('nội dung câu trả lời giữ nguyên', JSON.stringify(a.riskAnswers) === before);
ok('  …hết blocker bản khai', B.statementOfFact.build(a).unattributed.length === 0);
B.statementOfFact.confirm(a, { by:'CUSTOMER', channel:'PORTAL' });
ok('  …bản khai CONFIRMED, nộp được', B.statementOfFact.status(a) === 'CONFIRMED');

console.log('\n' + (fail ? ('✗ FAIL ' + fail + ' / PASS ' + pass) : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
