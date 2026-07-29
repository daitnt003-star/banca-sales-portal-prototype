#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const root = path.resolve(__dirname, '..');
const navSource = fs.readFileSync(path.join(root, 'shared/js/navigation-config.js'), 'utf8');
const context = { console: console };
context.window = context;
vm.runInNewContext(navSource, context, { filename: 'shared/js/navigation-config.js' });
const B = context.BANCA;

B.current = function () { return 'RM-01'; };
B.can = function () { return true; };
B.resolveManagerProfile = function () { return { sellingEnabled: true }; };

const expectedOrder = ['Trang chủ', 'Tư vấn nhanh', 'Bản chào', 'Hợp đồng', 'Đội nhóm', 'Trợ giúp'];
const rmNav = B.navResolved();
const quick = B.NAV_CONFIG.primary.find(function (item) { return item.id === 'quick-advisory'; });
const offers = B.NAV_CONFIG.primary.find(function (item) { return item.id === 'offers'; });

console.log('\n1. Selling-enabled primary navigation');
ok('RM-01 thấy đúng 6 mục theo thứ tự đã duyệt',
  JSON.stringify(rmNav.map(function (item) { return item.label; })) === JSON.stringify(expectedOrder));
ok('Tư vấn nhanh dùng route danh sách chuẩn', quick.route === 'modules/quick-advisory/index.html');
ok('Tư vấn nhanh dùng VIEW_WORKSPACE', quick.permission === 'VIEW_WORKSPACE');
ok('Tư vấn nhanh là sellingOnly', quick.sellingOnly === true);
ok('Tư vấn nhanh dùng icon mapping đã hỗ trợ', quick.icon === 'advise');

console.log('\n2. Management-only filtering');
B.resolveManagerProfile = function () { return { sellingEnabled: false }; };
const managerNav = B.navResolved();
ok('Quản lý thuần không thấy Tư vấn nhanh', !managerNav.some(function (item) { return item.id === 'quick-advisory'; }));
ok('Quản lý thuần không thấy Bản chào', !managerNav.some(function (item) { return item.id === 'offers'; }));

console.log('\n3. Active navigation ownership');
ok('Danh sách Tư vấn nhanh highlight nav mới', B.navIsActive(quick, 'Tư vấn nhanh'));
ok('Advisory workspace highlight nav mới', B.navIsActive(quick, 'Tư vấn nhanh'));
ok('Tư vấn nhanh không còn highlight Bản chào', !B.navIsActive(offers, 'Tư vấn nhanh'));
ok('Application workspace vẫn highlight Bản chào', B.navIsActive(offers, 'Bản chào'));
ok('Aliases Bản chào chỉ còn sales/application workspace',
  JSON.stringify(Array.from(offers.aliases)) === JSON.stringify(['Yêu cầu bảo hiểm', 'Workspace']));

console.log('\n4. Quick Advice list CTA regression');
const quickList = fs.readFileSync(path.join(root, 'modules/quick-advisory/index.html'), 'utf8');
ok('Danh sách không có CTA "Bắt đầu tư vấn mới"', !/>[^<]*Bắt đầu tư vấn mới[^<]*</i.test(quickList));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
