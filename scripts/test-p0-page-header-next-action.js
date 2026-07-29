#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

global.window = global;
global.location = { pathname: '/', search: '' };
global.document = {};
global.BANCA = {};
require('../shared/components/foundation-components.js');
require('../shared/js/app-shell.js');
const B = global.BANCA;

let pass = 0;
let fail = 0;
function ok(name, condition) {
  if (condition) {
    pass++;
    console.log('  ✓ ' + name);
  } else {
    fail++;
    console.log('  ✗ ' + name);
  }
}
function group(title) { console.log('\n' + title); }
function count(text, pattern) { return (text.match(pattern) || []).length; }

group('1. PageHeader contract and semantics');
const header = B.ui.pageHeader({
  title: '<Trang & "test">',
  description: '<Mô tả>',
  metaHtml: '<span class="badge">3 mục</span>',
  primaryActionHtml: '<button class="btn btn-primary">Tiếp tục</button>',
  secondaryActionsHtml: '<button class="btn btn-secondary">Phụ</button>'
});
ok('PageHeader render đúng một h1', count(header, /<h1\b/g) === 1);
ok('PageHeader escape title', header.includes('&lt;Trang &amp; &quot;test&quot;&gt;') && !header.includes('<Trang'));
ok('PageHeader escape description', header.includes('&lt;Mô tả&gt;'));
ok('PageHeader giữ trusted meta/action HTML',
  header.includes('<span class="badge">3 mục</span>') && header.includes('btn-primary') && header.includes('btn-secondary'));
ok('PageHeader không đọc permission/global state', !/BANCA\.(can|persona|current)/.test(String(B.ui.pageHeader)));

group('2. NextActionPanel states');
const defaultPanel = B.ui.nextActionPanel({
  label: '<Việc tiếp theo>',
  description: '<Mô tả>',
  state: 'default',
  actionHtml: '<button class="btn btn-primary">Làm ngay</button>'
});
ok('Default action khả dụng và text được escape',
  defaultPanel.includes('Làm ngay') && defaultPanel.includes('&lt;Việc tiếp theo&gt;') && defaultPanel.includes('&lt;Mô tả&gt;'));
['disabled', 'blocked'].forEach(function (state) {
  const panel = B.ui.nextActionPanel({
    label: 'Tiếp tục',
    state: state,
    actionHtml: '<button>KHÔNG ĐƯỢC RENDER</button>'
  });
  ok(state + ' không render action', !panel.includes('KHÔNG ĐƯỢC RENDER'));
  ok(state + ' có lý do nhìn thấy được', panel.includes('next-action-panel__reason') && panel.includes('role="status"'));
});
const loading = B.ui.nextActionPanel({ label: 'Đang tạo', state: 'loading', actionHtml: '<button>Gửi lặp</button>' });
ok('Loading không actionable và có trạng thái text', !loading.includes('Gửi lặp') && loading.includes('Đang xử lý'));
const error = B.ui.nextActionPanel({
  label: 'Không thành công', state: 'error', reason: 'Không kết nối được.',
  recoveryHtml: '<button class="btn btn-secondary">Thử lại</button>'
});
ok('Error có reason và recovery', error.includes('Không kết nối được.') && error.includes('Thử lại'));
ok('NextActionPanel không suy permission/business state', !/BANCA\.(can|persona|current)/.test(String(B.ui.nextActionPanel)));

group('3. Shell header-action modes');
const normal = B.resolveHeaderActions('DEFAULT', true, true);
ok('DEFAULT giữ quick/create/resume hiện hành', normal.quickAdvice && normal.createOffer && normal.resumeOffer);
const quick = B.resolveHeaderActions('QUICK_ADVICE', true, true);
ok('QUICK_ADVICE chỉ giữ shortcut tư vấn', quick.quickAdvice && !quick.createOffer && !quick.resumeOffer);
const offers = B.resolveHeaderActions('OFFERS', true, true);
ok('OFFERS giữ create + resume, ẩn quick', !offers.quickAdvice && offers.createOffer && offers.resumeOffer);
const policies = B.resolveHeaderActions('POLICIES', true, true);
ok('POLICIES ẩn toàn bộ sales shortcut', !policies.quickAdvice && !policies.createOffer && !policies.resumeOffer);
const unknown = B.resolveHeaderActions('UNKNOWN', true, true);
ok('Unknown mode fallback DEFAULT', unknown.mode === 'DEFAULT' && unknown.quickAdvice && unknown.createOffer && unknown.resumeOffer);
const manager = B.resolveHeaderActions('OFFERS', false, true);
ok('Management-only không thấy action bán hàng', !manager.quickAdvice && !manager.createOffer && !manager.resumeOffer);

group('4. Pilot adoption and non-pilot safety');
const root = path.resolve(__dirname, '..');
const read = function (file) { return fs.readFileSync(path.join(root, file), 'utf8'); };
const quickPage = read('modules/quick-advisory/index.html');
const offerPage = read('modules/unsubmitted-applications/index.html');
const policyPage = read('modules/policies/index.html');
const headLoader = read('shared/js/head-loader.js');
const submittedPage = read('modules/submitted-applications/index.html');
const quoteShell = read('shared/components/quote-list-shell.js');
const css = read('shared/styles/components.css');
const tokens = read('shared/styles/tokens.css');

ok('Quick Advice dùng PageHeader + QUICK_ADVICE mode',
  quickPage.includes('BANCA.ui.pageHeader') && quickPage.includes("headerActionMode:'QUICK_ADVICE'"));
ok('Quick Advice không có local start-new CTA', !/>[^<]*Bắt đầu tư vấn mới[^<]*</i.test(quickPage));
ok('Bản chào dùng PageHeader opt-in + OFFERS mode',
  offerPage.includes('BANCA.ui.pageHeader') && offerPage.includes('pageHeaderHtml:pageHeader')
  && offerPage.includes("headerActionMode:'OFFERS'"));
ok('Bản chào không dựng create action cục bộ', !offerPage.includes('openStartSale()'));
ok('Hợp đồng list dùng PageHeader + POLICIES mode',
  policyPage.includes('BANCA.ui.pageHeader') && policyPage.includes("headerActionMode:'POLICIES'"));
const loaderVersion = '46';
const sharedAssetVersion = '20260729a';
ok('Ba pilot page dùng cùng loader cache version mới',
  [quickPage, offerPage, policyPage].every(function (page) {
    return page.includes('shared/js/head-loader.js?v=' + loaderVersion);
  }));
ok('Head loader phát shared asset cache version mới',
  headLoader.includes("const V = 'v=" + sharedAssetVersion + "'")
  && headLoader.includes("components.css?'+V")
  && headLoader.includes("f+'?'+V"));
ok('QuoteListShell chỉ thay legacy title/action khi opt-in',
  quoteShell.includes('cfg.pageHeaderHtml != null') && quoteShell.includes('qls-title'));
ok('Submitted non-pilot không opt-in PageHeader/header mode',
  !submittedPage.includes('pageHeaderHtml') && !submittedPage.includes('headerActionMode'));
ok('Component có responsive/focus-compatible classes', css.includes('.page-header') && css.includes('.next-action-panel'));
ok('Action target giữ desktop/coarse minimum hiện hành',
  tokens.includes('.btn{ min-height:40px;') && tokens.includes('@media (pointer:coarse){ .btn-sm{ min-height:44px;'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
