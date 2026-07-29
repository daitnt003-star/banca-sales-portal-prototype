// Privacy DOM test — Trang chủ (seller-workspace) theo kênh (§corrective §1 / §5).
// Chạy: node scripts/test-privacy-home.js
// Mục tiêu: BẮT ĐƯỢC lỗi lộ PII trên Home.
//  - Kênh ẩn danh (Banca tích hợp, showCustomerList=false): DOM KHÔNG chứa tên khách / CIF;
//    chỉ hiện case/external ref + ngữ cảnh nghiệp vụ.
//  - Agent/Broker (showCustomerList=true): DOM VẪN hiển thị khách hàng (regression giữ nguyên).
// Cách test: nạp channel-profiles thật, trích inline <script> của Home, render với stub,
// bắt tham số body truyền vào shell() rồi kiểm tra chuỗi.
const fs = require('fs');
const path = require('path');

global.window = global;
global.location = { pathname: '/modules/seller-workspace/', search: '', reload: function () {}, replace: function () {} };
global.localStorage = { _s: {}, getItem: function (k) { return this._s[k] || null; }, setItem: function (k, v) { this._s[k] = v; } };
global.document = {
  getElementById: function () { return null; },
  createElement: function () { return { style: {}, appendChild: function () {} }; },
  body: { appendChild: function () {} }
};

require('../shared/mock/seed/channel-profiles.js'); // BANCA.channel / channelShowsCustomerList thật
const B = global.BANCA;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

// ---- Markers PII: nếu xuất hiện trong DOM Banca ẩn danh → lộ định danh (FAIL) ----
const PII_NAME = 'Nguyễn Văn PIIMARKER';
const PII_CIF = 'CIF-PIITEST-777';

// ---- Stub dữ liệu Home (đủ để render nhánh nhân viên ACTIVE, không phải manager) ----
B.persona = function () { return { status: 'ACTIVE', name: 'RM Demo', role: 'Nhân viên tư vấn', branch: 'CN Test', team: 'Team 1' }; };
B.current = function () { return 'RM-01'; };
B.isManagerProfile = function () { return false; };
B.myApps = function (kind) {
  return kind === 'NOT_SUBMITTED'
    ? [{ id: 'DRAFT-2026-003', owner: 'RM-01', customerId: 'C1', externalCustomerRef: 'EXT-CASE-9', productName: 'Bảo hiểm sức khỏe', currentStage: 'REVIEW_AND_SUBMIT', progress: 100, warnings: [], updatedAt: '2026-07-20 10:00' }]
    : [{ id: 'APP-100', owner: 'RM-01', customerId: 'C1', externalCustomerRef: 'EXT-CASE-1', status: 'NEED_MORE_INFO', productName: 'Bảo hiểm xe', supplement: { type: 'DOCUMENT', items: ['CMND'] }, deadline: '2026-07-25' }];
};
B.myPolicies = function () { return [{ id: 'POL-1', owner: 'RM-01', customerId: 'C1', isNew: true, renewalStatus: 'RENEWAL_DUE', productName: 'Bảo hiểm xe', effectiveTo: '2026-08-01', vehicle: null, package: 'Gói A' }]; };
B.notifications = { 'RM-01': [] };
B.kpi = { 'RM-01': { premium: 1000000, policies: 1, conversion: '10%', target: '50%' } };
B.commissionSummary = function () { return { amount: 1, count: 1 }; };
B.commissionVisible = function () { return false; };
B.stageLabel = function () { return 'Bước hiện tại'; };
B.vnd = function (n) { return String(n || 0); };
B.handoffsForSeller = function () {
  return [{ id: 'HO-1', type: 'SALES_HANDOFF', priority: 'HIGH', customerName: PII_NAME, cif: PII_CIF, externalCustomerRef: 'EXT-HO-1', leadRef: 'LEAD-1', productName: 'Sức khỏe', packageName: 'Gói A', needSummary: 'Nhu cầu bảo vệ', acceptBy: '2026-07-23', sourceSystem: 'BANK_CRM', source: 'BANK_CRM', consent: 'VALID' }];
};
B.handoffTypeLabel = function () { return 'Bàn giao'; };
B.handoffById = function () { return B.handoffsForSeller()[0]; };
B.participantName = function () { return '—'; };
B.quoteStatus = function () { return 'VALID'; };
B.partnerConfig = { syncAt: '2026-07-22' };

// ---- Trích inline <script> của Home ----
const html = fs.readFileSync(path.join(__dirname, '..', 'modules', 'seller-workspace', 'index.html'), 'utf8');
const m = html.match(/<body><script>([\s\S]*?)<\/script>/);
if (!m) { console.error('Không trích được inline script của Home'); process.exit(1); }
const src = m[1];

function renderForChannel(ch) {
  localStorage.setItem('bancaChannel', ch);
  let body = '';
  const shellStub = function (active, title, b) { body = String(b || ''); };
  const relStub = function () { return ''; };
  const custNameStub = function () { return PII_NAME; };
  const warnBadgesStub = function () { return ''; };
  // eslint-disable-next-line no-new-func
  const fn = new Function('BANCA', 'shell', 'rel', 'custName', 'warnBadges', src);
  fn(B, shellStub, relStub, custNameStub, warnBadgesStub);
  return body;
}

function assertHomeTerminology(profile, dom) {
  const normalized = dom.toLocaleLowerCase('vi');
  [
    'yêu cầu chưa nộp',
    'yêu cầu cần bổ sung',
    'yêu cầu có thể nộp',
    'mã yêu cầu',
    'yêu cầu bảo hiểm chưa nộp'
  ].forEach(function (legacy) {
    ok(profile + ': DOM không chứa "' + legacy + '"', normalized.indexOf(legacy) < 0);
  });
  ok(profile + ': DOM dùng object "Bản chào"', normalized.indexOf('bản chào') >= 0);
  ok(profile + ': hàng chờ dùng "Bản chào cần bổ sung"', normalized.indexOf('bản chào cần bổ sung') >= 0);
  ok(profile + ': hàng chờ dùng "Bản chào có thể nộp"', normalized.indexOf('bản chào có thể nộp') >= 0);
  ok(profile + ': bảng gần đây dùng "Mã bản chào"', normalized.indexOf('mã bản chào') >= 0);
  ok(profile + ': theo dõi dùng "bản chào đã nộp"', normalized.indexOf('bản chào đã nộp') >= 0);
}

/* ============ Banca tích hợp (ẩn danh) ============ */
grp('1. Banca tích hợp (BANCA_INTEGRATED) — Home ẩn danh KHÔNG lộ PII');
const banca = renderForChannel('BANCA_INTEGRATED');
ok('showCustomerList = false', B.channelShowsCustomerList() === false);
ok('DOM KHÔNG chứa tên khách hàng', banca.indexOf(PII_NAME) < 0);
ok('DOM KHÔNG chứa CIF khách hàng', banca.indexOf(PII_CIF) < 0 && banca.indexOf('CIF ') < 0);
ok('Work item hiển thị external/case ref ẩn danh', banca.indexOf('EXT-CASE-9') >= 0 && banca.indexOf('🔒') >= 0);
ok('Cột danh sách đổi nhãn thành "Tham chiếu"', banca.indexOf('Tham chiếu') >= 0);
assertHomeTerminology('BANCA_INTEGRATED', banca);

/* ============ Agent/Broker (regression: vẫn có khách) ============ */
grp('2. Agent/Broker (AGENT_BROKER) — vẫn hiển thị khách hàng (không regression)');
const agent = renderForChannel('AGENT_BROKER');
ok('showCustomerList = true', B.channelShowsCustomerList() === true);
ok('DOM CÓ tên khách hàng', agent.indexOf(PII_NAME) >= 0);
ok('DOM CÓ CIF (bàn giao)', agent.indexOf(PII_CIF) >= 0);
assertHomeTerminology('AGENT_BROKER', agent);

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
