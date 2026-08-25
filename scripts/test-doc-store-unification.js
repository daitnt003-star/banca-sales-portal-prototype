// Hợp nhất kho tài liệu — chống tái diễn lỗi "đã upload hết rồi vẫn bị chặn nộp".
// Chạy: node scripts/test-doc-store-unification.js
//
// Bối cảnh lỗi (2026-08-25, người dùng báo trên bản GitHub Pages):
//   Nút "Tải lên" thật ghi tệp vào  localStorage['banca_docstore_<id>']
//   Cổng chặn NỘP lại đọc          app.docsUploaded + overlay.__docsUploaded
//   Hàm duy nhất ghi kho thứ hai (window.uploadDoc) KHÔNG nơi nào gọi.
//   ⇒ Hồ sơ bán MỚI tải đủ tài liệu vẫn bị chặn vĩnh viễn. Hồ sơ mẫu lọt lưới
//     vì seed có sẵn docsUploaded.
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};
global.BANCA = global.BANCA || {};
BANCA.overlay = { applications: {} };
require('../shared/mock/seed/ocr-policy.js');
const B = global.BANCA;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

grp('1. Hàm hợp nhất phải tồn tại (mọi nơi hỏi "đã nộp gì" đều gọi nó)');
ok('BANCA.docUploadedCodes có', typeof B.docUploadedCodes === 'function');
ok('BANCA.uploadedDocCodes có', typeof B.uploadedDocCodes === 'function');

grp('2. Tệp tải lên qua kho tài liệu THẬT phải được cổng chặn nhìn thấy');
const app = { id: 'DRAFT-TEST-1' };
ok('hồ sơ mới: chưa ghi nhận tài liệu nào', B.uploadedDocCodes(app).length === 0);
B.docPatch('DRAFT-TEST-1', 'REG', { fileName: 'dangky.jpg', dataUrl: 'data:,x', uploadStatus: 'UPLOADED' });
B.docPatch('DRAFT-TEST-1', 'ID', { fileName: 'cccd.jpg', dataUrl: 'data:,y', uploadStatus: 'UPLOADED' });
const got = B.uploadedDocCodes(app);
ok('tải 2 tệp → hợp nhất thấy đủ 2', got.length === 2 && got.indexOf('REG') >= 0 && got.indexOf('ID') >= 0, JSON.stringify(got));

grp('3. Bản ghi RỖNG không được tính là đã nộp');
B.docPatch('DRAFT-TEST-1', 'INSPECT', { reviewStatus: 'NOT_REVIEWED' }); // chạm vào nhưng KHÔNG có tệp
ok('chạm vào tài liệu mà không có tệp → vẫn là chưa nộp',
  B.uploadedDocCodes(app).indexOf('INSPECT') < 0, JSON.stringify(B.uploadedDocCodes(app)));

grp('4. Ba nguồn cùng gộp, không nguồn nào bị bỏ rơi');
const app2 = { id: 'DRAFT-TEST-2', docsUploaded: ['REG'] };           // nguồn seed
BANCA.overlay.applications['DRAFT-TEST-2'] = { __docsUploaded: ['ID'] }; // nguồn overlay (hồ sơ cũ)
B.docPatch('DRAFT-TEST-2', 'PHOTOS', { dataUrl: 'data:,z' });           // nguồn tệp thật
const all = B.uploadedDocCodes(app2).sort();
ok('seed + overlay + tệp thật → gộp đủ 3', all.join(',') === 'ID,PHOTOS,REG', JSON.stringify(all));
ok('không nhân bản khi một mã có ở nhiều nguồn',
  (function () { B.docPatch('DRAFT-TEST-2', 'REG', { dataUrl: 'data:,dup' });
    const r = B.uploadedDocCodes(app2); return r.filter(c => c === 'REG').length === 1; })());

grp('5. Kho tài liệu tách theo hồ sơ, không rò sang hồ sơ khác');
ok('hồ sơ khác không thấy tài liệu của hồ sơ này',
  B.uploadedDocCodes({ id: 'DRAFT-TEST-3' }).length === 0);

grp('6. Chống hồi quy: hàm ghi kho thứ hai phải KHÔNG còn tồn tại');
const src = require('fs').readFileSync(require('path').join(__dirname, '../modules/application-workspace/app-workspace.js'), 'utf8');
ok('window.uploadDoc đã bị xoá khỏi app-workspace',
  !/window\.uploadDoc\s*=\s*function/.test(src));
ok('cổng chặn nộp KHÔNG còn đọc thẳng __docsUploaded',
  !/uploadedR\s*=\s*\[\.\.\.new Set/.test(src));
ok('cổng chặn nộp gọi hàm hợp nhất', /uploadedR\s*=\s*BANCA\.uploadedDocCodes\(app\)/.test(src));
ok('bước Tài liệu cũng gọi hàm hợp nhất', /uploaded\s*=\s*BANCA\.uploadedDocCodes\(app\)/.test(src));

grp('7. Chống hồi quy: thanh bước KHÔNG được suy "hoàn tất" từ vị trí');
ok('không còn done = i < doneIdx', !/const\s+done\s*=\s*doneIdx\s*>=\s*0\s*&&\s*i\s*<\s*doneIdx/.test(src));
ok('thanh bước gọi stepIsComplete', /const\s+done\s*=\s*stepIsComplete\(s\.id\)/.test(src));
// Cắt đúng thân hàm stepIsComplete rồi soi từng nhánh — chắc hơn đo khoảng cách ký tự.
const fnStart = src.indexOf('function stepIsComplete');
const fnBody = fnStart >= 0 ? src.slice(fnStart, src.indexOf('const stepper', fnStart)) : '';
ok('cắt được thân hàm stepIsComplete', fnBody.length > 200);
ok('nhánh DOCUMENTS hỏi kho tài liệu THẬT, không hỏi vị trí bước',
  /missingRequiredDocs/.test(fnBody) && /uploadedDocCodes/.test(fnBody));
ok('nhánh CUSTOMER_INFO kiểm tra có khách hàng thật', /case 'CUSTOMER_INFO'/.test(fnBody) && /customerName/.test(fnBody));
ok('nhánh RISK_OBJECT kiểm tra đã nhập xe', /case 'RISK_OBJECT'/.test(fnBody) && /app\.vehicle/.test(fnBody));
ok('nhánh RISK_DECLARATION kiểm tra bản khai đã trả lời đủ',
  /case 'RISK_DECLARATION'/.test(fnBody) && /statementOfFact[\s\S]*unanswered/.test(fnBody));
ok('nhánh PACKAGE_AND_QUOTE loại báo giá hết hạn / lệch dữ liệu',
  /case 'PACKAGE_AND_QUOTE'/.test(fnBody) && /EXPIRED/.test(fnBody) && /STALE/.test(fnBody));
ok('nhánh REVIEW_AND_SUBMIT chỉ hoàn tất khi ĐÃ NỘP',
  /case 'REVIEW_AND_SUBMIT'/.test(fnBody) && /submissionState==='SUBMITTED'/.test(fnBody));
ok('KHÔNG nhánh nào đọc app.currentStage (thứ lấy từ URL)', !/currentStage/.test(fnBody));
ok('nhánh DOCUMENTS không trả true vô điều kiện cho sản phẩm phi-xe',
  !/riskObjectType!=='VEHICLE'\)\s*return true/.test(fnBody), 'sức khoẻ/PA vẫn tự nhận hoàn tất');
ok('sản phẩm phi-xe phải căn cứ tài liệu đã tải thật',
  /riskObjectType!=='VEHICLE'\)\s*return BANCA\.uploadedDocCodes\(app\)\.length>0/.test(fnBody));

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
