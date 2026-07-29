#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules/application-workspace/app-workspace.js'), 'utf8');
let pass = 0;
let fail = 0;

function ok(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    console.log('  ✗ ' + name + (detail ? ' — ' + detail : ''));
  }
}
function group(name) { console.log('\n' + name); }

const helperStart = source.indexOf(' function quoteVersionStatusLabel');
const helperEnd = source.indexOf(' const quoteVersionVM=', helperStart);
const helperSource = source.slice(helperStart, helperEnd) +
  '\nthis.quoteVersionStatusLabel=quoteVersionStatusLabel;this.quoteVersionModel=quoteVersionModel;';
const sandbox = {};
vm.runInNewContext(helperSource, sandbox);

group('1. Adapter phiên bản — canonical ưu tiên, legacy tương thích');
const canonical = {
  owner: 'RM-01',
  quote: { version: 9, versions: [{ version: 9, status: 'CURRENT' }] },
  quoteVersions: [
    { id: 'QV-1', version: 1, status: 'SUPERSEDED', premium: 100, ratedAt: 't1' },
    { id: 'QV-2', version: 2, status: 'DRAFT', premium: 120, ratedAt: 't2', reRateReason: 'Đổi gói' }
  ],
  activeQuoteVersionId: 'QV-2'
};
const canonicalVM = sandbox.quoteVersionModel(canonical);
ok('canonical được ưu tiên khi đồng thời có legacy', canonicalVM.canonical && canonicalVM.versions.length === 2);
ok('active canonical đúng QV-2', canonicalVM.active && canonicalVM.active.id === 'QV-2');
ok('lý do tính lại được giữ', canonicalVM.active.reason === 'Đổi gói');

const legacy = {
  owner: 'RM-01',
  quote: {
    version: 2, totalPremium: 200, ratedAt: 'now',
    versions: [
      { version: 2, premium: 200, createdAt: 't2', createdBy: 'RM-01', status: 'CURRENT' },
      { version: 1, premium: 180, createdAt: 't1', createdBy: 'RM-01', status: 'SUPERSEDED' }
    ]
  }
};
const legacyVM = sandbox.quoteVersionModel(legacy);
ok('legacy có multi-version', !legacyVM.canonical && legacyVM.versions.length === 2);
ok('legacy CURRENT là active', legacyVM.active && legacyVM.active.version === 2);
const recovered = sandbox.quoteVersionModel({ owner: 'RM-01', quote: { version: 3, premium: 300 } });
ok('dữ liệu cũ thiếu versions recovery thành một phiên bản', recovered.versions.length === 1 && recovered.active.version === 3);

group('2. Nhãn và control tiếng Việt');
ok('DRAFT → Đang soạn', sandbox.quoteVersionStatusLabel('DRAFT') === 'Đang soạn');
ok('APPROVED → Đã duyệt', sandbox.quoteVersionStatusLabel('APPROVED') === 'Đã duyệt');
ok('SUPERSEDED → Đã thay thế', sandbox.quoteVersionStatusLabel('SUPERSEDED') === 'Đã thay thế');
ok('single-version dùng badge', source.includes('quoteVersionVM.versions.length===1') && source.includes('badge badge-version'));
ok('multi-version dùng native select', source.includes('id="quote-version-select"') && source.includes('<select'));
ok('select có accessible label', source.includes('aria-label="Chọn phiên bản Bản chào"'));
ok('option đánh dấu Hiện tại', source.includes("v.active?' · Hiện tại':''"));
ok('wrapper dành hàng riêng cho control trong header', source.includes('display:flex;flex:1 1 100%;flex-direction:column;'));
ok('native select có ngưỡng đọc được bằng token', source.includes('min-width:calc(var(--space-4xl) * 4);max-width:100%;'));
ok('header dùng ngưỡng token đủ chứa control', source.includes('min-width:calc(var(--space-4xl) * 5);'));

group('3. Preview lịch sử chỉ đọc');
const previewStart = source.indexOf(' window.previewQuoteVersion=');
const previewEnd = source.indexOf(' window.refreshSubmitBtn', previewStart);
const previewSource = source.slice(previewStart, previewEnd);
ok('chọn active sẽ đóng preview', previewSource.includes('selected.active') && previewSource.includes('box.hidden=true'));
ok('preview có phí, thời điểm, người thực hiện', previewSource.includes("'Phí: '") && previewSource.includes("' · Thời điểm: '") && previewSource.includes("' · Người thực hiện: '"));
ok('preview không ghi app/activeQuoteVersionId', !previewSource.includes('patchApp') && !previewSource.includes('activeQuoteVersionId='));
ok('preview superseded không có CTA chỉnh sửa', !previewSource.includes('<button') && !previewSource.includes('onclick='));

group('4. Re-rate notice và quyền thao tác');
ok('notice có title chuẩn', source.includes('Bản chào cần tính phí lại'));
ok('notice nêu khóa thanh toán', source.includes('Phiên bản hiện tại chưa được duyệt nên thanh toán đang tạm khóa.'));
ok('editable có CTA Tính phí lại', source.includes('id="header-rerate-btn"') && source.includes('>Tính phí lại</button>'));
ok('read-only có hướng dẫn liên hệ', source.includes('Liên hệ người phụ trách để tính phí lại và gửi duyệt.'));
ok('read-only không render action', source.includes("const action=(!readOnly&&caps.includes('can_quote'))"));
ok('warning đọc cả warnings và warningFlags', source.includes("(app.warnings||[]).concat(app.warningFlags||[])"));
ok('notice nhận stale/expired', source.includes("['STALE','EXPIRED'].includes(quoteState)"));
ok('warning được xóa sau rating thành công', source.includes("canonicalPatch.warningFlags=") && source.includes("w!=='QUOTE_NEED_RERATE'"));

group('5. Integrity canonical');
ok('saveQuote đồng bộ quoteVersions', source.includes('canonicalPatch.quoteVersions=canonicalApp.quoteVersions'));
ok('saveQuote đồng bộ activeQuoteVersionId', source.includes('canonicalPatch.activeQuoteVersionId=canonicalApp.activeQuoteVersionId'));
ok('dùng canonical reRate engine', source.includes('BANCA.quoteVersion.reRate(canonicalApp,rt.totalPremium'));
ok('không có đường sửa premium tay mới', !source.includes('setPremiumManual('));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
