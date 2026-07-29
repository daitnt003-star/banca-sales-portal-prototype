#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const quick = read('modules/quick-advisory/index.html');
const offers = read('modules/unsubmitted-applications/index.html');
const policies = read('modules/policies/index.html');
const quoteShell = read('shared/components/quote-list-shell.js');
const css = read('shared/styles/components.css');
const loader = read('shared/js/head-loader.js');

let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}
function group(title) { console.log('\n' + title); }
function headers(source) {
  const match = source.match(/<table class="[^"]*operational-list[^"]*"><thead><tr>([\s\S]*?)<\/tr><\/thead>/);
  return match ? [...match[1].matchAll(/<th\b[^>]*>(.*?)<\/th>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim()) : [];
}

group('1. Six-column anatomy');
const quickHeaders = headers(quick);
ok('Quick Advice có đúng 6 cột', quickHeaders.length === 6);
ok('Quick Advice đúng thứ tự header', JSON.stringify(quickHeaders) === JSON.stringify([
  'Phiên tư vấn & khách hàng', 'Nhu cầu & phương án', 'Trạng thái & việc tiếp theo',
  'Bản chào liên kết', 'Cập nhật', 'Hành động'
]));
const policyHeaders = headers(policies);
ok('Policy có đúng 6 cột', policyHeaders.length === 6);
ok('Policy đúng thứ tự header', JSON.stringify(policyHeaders) === JSON.stringify([
  'Khách hàng & hợp đồng', 'Sản phẩm', 'Trạng thái & việc tiếp theo',
  'Hiệu lực', 'Phí', 'Hành động'
]));
ok('Bản chào SELF/PREPARING còn 6 cột logic',
  quoteShell.includes("PREPARING:        ['offerCustomer', 'product', 'task', 'premium', 'owner', 'updated', 'action']")
  && quoteShell.includes("cfg.scope === 'SELF'") && quoteShell.includes("c !== 'owner'"));
ok('Ba renderer opt-in operational-list', quick.includes('adv-table operational-list')
  && policies.includes('dtable operational-list') && quoteShell.includes('offer-table operational-list'));
ok('Header table có scope col', quickHeaders.length === (quick.match(/<th scope="col"/g) || []).length
  && policyHeaders.length === (policies.match(/<th scope="col"/g) || []).length
  && quoteShell.includes('<th scope="col"'));

group('2. Actions and direct navigation');
['Tiếp tục tư vấn', 'Tạo bản chào từ tư vấn này', 'Mở bản chào', 'Xem bản tư vấn'].forEach(label => {
  ok('Quick action: ' + label, quick.includes(label));
});
ok('Xóa nháp nằm trong disclosure Khác', quick.includes('table-action-more') && quick.includes('Xoá nháp'));
['Gửi GCN', 'Tái tục', 'Tạo bồi thường', 'Xem lý do hủy'].forEach(label => {
  ok('Policy action: ' + label, policies.includes(label));
});
ok('Policy ưu tiên Gửi GCN trước Tái tục',
  policies.indexOf("if(x.isNew)") < policies.indexOf("if(x.renewalStatus==='RENEWAL_DUE')"));
ok('Disclosure Khác dùng details/summary keyboard-native',
  quick.includes('<details class="table-action-more"><summary') && policies.includes('<details class="table-action-more"><summary')
  && quick.includes('aria-label="Các hành động khác"') && policies.includes('aria-label="Các hành động khác"'));
ok('Advice ID là direct link', quick.includes('modules/advisory-workspace/index.html?id=${a.id}'));
ok('Policy ID là direct link', policies.includes('data-policy-link="${x.id}"'));
ok('Bản chào ID là direct link', quoteShell.includes('class="q-id nowrap" href="'));

group('3. Metadata, filters and permissions preserved');
['MODE_LABEL[a.mode]', 'personaName(a.createdBy)', 'offer.premiumBand'].forEach(marker => {
  ok('Quick metadata giữ ' + marker, quick.includes(marker));
});
ok('Policy non-SELF giữ owner/participant metadata', policies.includes('const ownerMeta=isMgr')
  && policies.includes('BANCA.sellerCell(') && policies.includes('policyDistributionOf'));
['fSearch', 'fTab', 'tabBar', 'advSearch'].forEach(marker => ok('Quick filter giữ ' + marker, quick.includes(marker)));
['fScope', 'fPart', 'fProd', 'fSt', 'fQ', 'quickFilters', 'filterDrawer'].forEach(marker => {
  ok('Policy filter giữ ' + marker, policies.includes(marker));
});
ok('Inactive permission branches giữ nguyên', quick.includes("if(p.status!=='ACTIVE')")
  && offers.includes("if(p.status!=='ACTIVE')"));
ok('Policy scope permission giữ nguyên', policies.includes('BANCA.availableScopes') && policies.includes('BANCA.policiesForScope'));

group('4. Structural CSS and cache consistency');
['table.operational-list', '.operational-list__meta', '.table-action-stack', '.table-action-more__menu'].forEach(selector => {
  ok('CSS có ' + selector, css.includes(selector));
});
ok('Monetary column right aligned', css.includes('.op-money{text-align:right'));
ok('Final action column sticky', css.includes('table.operational-list th:last-child,table.operational-list td:last-child'));
ok('Loader phát shared version mới', loader.includes("const V = 'v=20260729a'"));
ok('Ba pilot page dùng loader version mới', [quick, offers, policies].every(page => page.includes('head-loader.js?v=46')));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
