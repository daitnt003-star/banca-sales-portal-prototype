// Tuyến Tư vấn nhanh → Bàn giao → Hồ sơ → Thanh toán → Hợp đồng → Hoa hồng.
// Chạy: node scripts/test-advice-to-policy-chain.js
//
// Bộ này bảo vệ 6 chỗ đã hỏng phát hiện ngày 2026-08-24. Nó nạp ĐỦ chuỗi file
// theo head-loader chứ không require lẻ — vì bài học cũ: test require lẻ không
// bắt được lỗi do guard `if(BANCA.X && ...)` âm thầm bỏ qua.
//
// Nền nghiệp vụ:
//   CII IF1 3/12–3/13 tr.96–97 G3 — hoa hồng theo hợp đồng đại lý lúc BÁN
//   CII IF1 tr.212 mục H5        — phải nêu lý do cho mọi lời tư vấn
//   CII IF3 2/9–2/10 mục D2      — cover note bị thay thế khi cấp đơn chính thức
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};
global.document = { getElementById: () => null, querySelector: () => null,
  createElement: () => ({ style:{}, classList:{ add(){}, remove(){} } }),
  addEventListener(){}, head:{ appendChild(){} }, body:{} };
global.location = { search:'', href:'', reload(){}, pathname:'/' };
global.navigator = { userAgent:'node' };
global.alert = () => {};

const loader = fs.readFileSync(path.join(ROOT, 'shared/js/head-loader.js'), 'utf8');
const files = [...new Set([...loader.matchAll(/['"]((?:shared|modules)\/[^'"]+\.js)(?:\?[^'"]*)?['"]/g)].map(m => m[1]))];
files.forEach(f => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) { try { (0, eval)(fs.readFileSync(p, 'utf8')); } catch (e) {} }
});
const B = global.BANCA;
LS['bancaChannel'] = 'BANCA_INTEGRATED';
const ME = 'RM-01';
B.current = () => ME;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* 1 — cơ sở khuyến nghị phải đi cùng phương án --------------------- */
grp('1. Lý do tư vấn được LƯU, không chỉ hiện rồi mất (IF1 tr.212 H5)');
const st = { id:'ADV-T', primaryNeed:'MOTOR', budgetBand:'1M_2M' };
st.selectedProductId = B.adviceSelection.productsForNeed('MOTOR')[0].productRef;
const pkgs = B.adviceSelection.packagesForProduct('MOTOR', st.selectedProductId);
const sel = B.adviceSelection.selectPackage(st, (pkgs.find(x => x.packageRef === 'STANDARD') || pkgs[0]).packageRef);
ok('phương án đã chọn giữ lý do đề xuất', !!sel.why, JSON.stringify(sel.why));
ok('  …kèm cơ sở khuyến nghị có ưu/nhược', !!sel.adviceBasis && Array.isArray(sel.adviceBasis.pros));
ok('  …ghi lại điểm phù hợp và ngân sách đã dùng để cân nhắc',
  sel.adviceBasis.fit === sel.fit && sel.adviceBasis.budgetBand === '1M_2M');

/* 2 — đồng ý của khách: ba mức ------------------------------------- */
grp('2. Đồng ý suy từ trạng thái dữ liệu thật, KHÔNG gán cứng');
ok('phiên ẩn danh → chưa có đồng ý',
  B.adviceConsentForHandoff({ dataAccessStage:'ANONYMOUS_CONTEXT' }).consent === 'PENDING');
const bySource = B.adviceConsentForHandoff({ dataAccessStage:'IDENTIFIED_CONTEXT' });
ok('banca truyền ngữ cảnh đã định danh → hợp lệ THEO HỆ NGUỒN',
  bySource.consent === 'VALID' && bySource.consentBasis === 'SOURCE_SYSTEM');
ok('  …portal nói rõ mình không giữ bản ghi',
  /không giữ bản ghi/.test(B.CONSENT_BASIS_LABEL[bySource.consentBasis] || ''));
ok('có bản ghi thật mới là CUSTOMER_RECORD',
  B.adviceConsentForHandoff({ dataAccessStage:'VERIFIED_CUSTOMER', consent:{ consentId:'CNST-1' } }).consentBasis === 'CUSTOMER_RECORD');

/* 3 — snapshot kênh đóng băng lúc phát hành ------------------------ */
grp('3. Hợp đồng đã phát hành: kênh bán ĐÓNG BĂNG (IF1 tr.96–97 G3)');
const pol = { id:B.genPolicyNo('motor'), certificate:B.genCertNo('motor'), owner:ME, customerId:'CUS-001',
  productName:'Bảo hiểm vật chất xe', package:'Standard', premium:12000000,
  issueDate:'2026-07-23', effectiveFrom:'2026-07-23', effectiveTo:'2027-07-22', status:'ACTIVE', appId:'APP-2026-107' };
B.addPolicyDemo(pol);
const dist = B.policyDistributionOf(pol.id, ME);
ok('hợp đồng mới phát hành CÓ snapshot phân phối', !dist._fallback);
ok('  …ghi rõ nguồn là snapshot lúc phát hành', dist.source === 'ISSUE_TIME_SNAPSHOT', dist.source);
const amounts = ['BANCA_INTEGRATED','AGENT','BROKER','BANCA_STANDALONE'].map(function (ch) {
  LS['bancaChannel'] = ch; return String(B.commissionOfPolicy(pol).amount);
});
LS['bancaChannel'] = 'BANCA_INTEGRATED';
ok('đổi kênh ĐANG XEM không làm đổi hoa hồng', new Set(amounts).size === 1, amounts.join(' / '));
const polTS = Object.assign({}, pol, { id:B.genPolicyNo('motor'), owner:'TS-01', appId:null });
B.addPolicyDemo(polTS);
ok('người bán thuộc Telesales → kênh ghi Telesales, không gộp thành Bancassurance',
  B.policyDistributionOf(polTS.id, 'TS-01').channel === 'Telesales');
ok('phát hành lại KHÔNG viết đè snapshot cũ (bằng chứng lịch sử)',
  B.registerPolicyDistribution(pol.id, { channel:'BROKER' }).channel === dist.channel);

/* 4 — cover note ---------------------------------------------------- */
grp('4. Cấp đơn chính thức thu hồi giấy tạm (IF3 2/9–2/10 D2)');
B.issueCoverNote({ caseId:'APP-CHAIN', productId:'motor', reason:'AWAITING_ISSUE', expiresAt:'2026-12-31T23:59:59.000Z' });
ok('trước khi cấp đơn: giấy tạm đang hiệu lực', !!B.coverNoteFor('APP-CHAIN'));
B.supersedeCoverNote('APP-CHAIN', 'JB-MT-2026-9999');
ok('sau khi cấp đơn: giấy tạm bị thay thế', B.coverNoteFor('APP-CHAIN') === null);

/* 5 — cổng phiên báo giá đã sống ------------------------------------ */
grp('5. Chốt "phí đã tính lại thì không thu tiền" phải HOẠT ĐỘNG');
const src107 = B.appById('APP-2026-107');
const t = { id:'T', owner:ME, productId:'motor', package:'Standard', premium:5000000,
  status:'PENDING_PAYMENT', applicationStatus:'PROCESSING', underwritingStatus:'DECIDED',
  underwritingDecision:'APPROVED', paymentStatus:'METHOD_REQUIRED', policyStatus:'NOT_STARTED',
  confirm:{ otp:'VERIFIED', confirmedAt:'2026-07-23 10:00' },
  riskAnswers:src107.riskAnswers, answeredBy:src107.answeredBy,
  statementOfFact:src107.statementOfFact, quote:{ premium:5000000 } };
Object.assign(t, B.quoteVersion.freezeOnSubmit(t, t.premium));
ok('nộp hồ sơ → sinh phiên v1 và duyệt luôn',
  B.quoteVersion.active(t) && B.quoteVersion.active(t).status === 'APPROVED');
ok('  …cổng thanh toán MỞ', B.paymentEnableRule(t, { me:ME }).enabled,
  (B.paymentEnableRule(t, { me:ME }).reasons || []).join(' | '));
Object.assign(t, B.quoteVersion.reRateFields(t, 6200000, 'Phụ phí sau thẩm định'));
const gate = B.paymentEnableRule(t, { me:ME });
ok('phụ phí sau thẩm định → cổng ĐÓNG', !gate.enabled);
ok('  …và nêu lý do bằng chữ (§15.3)',
  (gate.reasons || []).some(function (r) { return /phiên báo giá/i.test(r); }), (gate.reasons || []).join(' | '));
ok('  …phiên cũ chuyển SUPERSEDED, không mutate tại chỗ',
  t.quoteVersions[0].status === 'SUPERSEDED' && t.quoteVersions.length === 2);
Object.assign(t, B.quoteVersion.approveFields(t));
ok('khách xác nhận phí mới → cổng MỞ lại', B.paymentEnableRule(t, { me:ME }).enabled);

/* 6 — mã khách ngân hàng + liên kết ngược --------------------------- */
grp('6. Mắt xích banca: mã khách ngân hàng và truy vết ngược');
const apps = (B.applications || []).filter(function (a) { return String(a.id).indexOf('APP-') === 0; });
const bankable = apps.filter(function (a) {
  const c = (B.customers || []).find(function (x) { return x.id === a.customerId; });
  return c && c.cif;
});
ok('mọi hồ sơ của khách CÓ CIF đều mang mã tham chiếu',
  bankable.every(function (a) { return !!a.externalCustomerRef; }),
  bankable.filter(function (a) { return !a.externalCustomerRef; }).map(function (a) { return a.id; }).join(','));
ok('khách KHÔNG có CIF thì để trống, không bịa mã',
  apps.filter(function (a) {
    const c = (B.customers || []).find(function (x) { return x.id === a.customerId; });
    return !(c && c.cif);
  }).every(function (a) { return !a.externalCustomerRef; }));
const issuedApp = apps.find(function (a) { return a.status === 'ISSUED'; });
const cb = B.makeBankCallback({ app:issuedApp, policyNumber:issuedApp.policyId, certificateNumbers:['C'],
  issueStatus:'ISSUED', effectiveFrom:'2026-07-01', effectiveTo:'2027-06-30', paymentStatus:'SUCCESS' });
ok('callback phát hành trả về ngân hàng CÓ mã khách để đối chiếu',
  !!cb.externalCustomerRef, JSON.stringify(cb.externalCustomerRef));
(B.adviceSessions || []).filter(function (s) { return s.convertedCaseId; }).forEach(function (s) {
  const a = B.appById(s.convertedCaseId);
  ok('hồ sơ ' + s.convertedCaseId + ' trỏ NGƯỢC về phiên tư vấn ' + s.id,
    !!a && a.sourceAdviceId === s.id, a ? String(a.sourceAdviceId) : 'không thấy hồ sơ');
});
ok('bàn giao có caseId thì hồ sơ nối ngược được',
  (B.handoffs || []).filter(function (h) { return h.caseId; })
    .every(function (h) { const a = B.appById(h.caseId); return !a || a.handoffId === h.id; }));

/* 7 — mã chết đã gỡ -------------------------------------------------- */
grp('7. Đường thanh toán cũ bỏ qua cổng đã bị gỡ');
const ws = fs.readFileSync(path.join(ROOT, 'modules/application-workspace/app-workspace.js'), 'utf8');
ok('không còn payDemo()/payRetry()', !/window\.payDemo\s*=|window\.payRetry\s*=/.test(ws));
ok('đường thanh toán đang dùng vẫn nguyên vẹn',
  /window\.createPaymentIntent\s*=/.test(ws) && /window\.settlePayment\s*=/.test(ws));
ok('phát hành có gọi thu hồi giấy tạm', /supersedeCoverNote\(app\.id/.test(ws));

console.log('\n' + (fail ? ('✗ FAIL ' + fail + ' / PASS ' + pass) : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
