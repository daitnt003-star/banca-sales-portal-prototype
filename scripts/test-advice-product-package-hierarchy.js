#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = {
  _s: {},
  getItem: function (key) { return this._s[key] || null; },
  setItem: function (key, value) { this._s[key] = value; }
};

require('../shared/mock/seed/advice-sessions.js');
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

group('1. Product → package hierarchy');
const products = B.adviceSelection.productsForNeed('HEALTH');
ok('Tầng sản phẩm trả danh sách unique', products.length === 1 && products[0].productRef === 'health');
ok('Tầng sản phẩm không chứa package/fit', products.every(function (p) {
  return p.packageRef === undefined && p.packageName === undefined && p.fit === undefined;
}));
const initial = { primaryNeed: 'HEALTH', compareSet: [], selectedOffer: null };
B.adviceSelection.normalize(initial);
ok('Không tự chọn sản phẩm', initial.selectedProductId == null);
ok('Không tự chọn gói', initial.selectedPackageId == null && initial.selectedOffer == null);
B.adviceSelection.selectProduct(initial, 'health');
ok('Chọn sản phẩm chưa tạo selectedOffer', initial.selectedProductId === 'health' && initial.selectedOffer == null);
const packages = B.adviceSelection.packagesForProduct('HEALTH', initial.selectedProductId);
ok('Chỉ trả gói của sản phẩm đã chọn', packages.length === 3 && packages.every(function (p) { return p.productRef === 'health'; }));

group('2. Same-product comparison and reset');
const firstRef = B.adviceSelection.compareRef('health', 'BASIC');
const secondRef = B.adviceSelection.compareRef('health', 'STANDARD');
ok('Đánh dấu gói đầu tiên', B.adviceSelection.toggleCompare(initial, firstRef).count === 1);
ok('Dưới 2 gói chưa đủ mở compare', initial.compareSet.length < 2);
ok('Đánh dấu gói thứ hai cùng sản phẩm', B.adviceSelection.toggleCompare(initial, secondRef).count === 2);
const cross = B.adviceSelection.toggleCompare(initial, B.adviceSelection.compareRef('motor', 'BASIC'));
ok('Từ chối compare chéo sản phẩm', cross.changed === false && initial.compareSet.every(function (ref) { return ref.indexOf('health:') === 0; }));
B.adviceSelection.selectPackage(initial, 'STANDARD');
ok('Chọn gói tạo đúng một canonical selectedOffer',
  initial.selectedOffer && !Array.isArray(initial.selectedOffer)
  && initial.selectedOffer.productRef === 'health'
  && initial.selectedOffer.packageRef === 'STANDARD'
  && initial.selectedOffer.recommendationVersion === B.RECOMMENDATION_VERSION);
initial.selectedPlan = { id: 'OLD' };
B.adviceSelection.selectProduct(initial, 'motor');
ok('Đổi sản phẩm xóa package/offer/plan/compare',
  initial.selectedPackageId == null && initial.selectedOffer == null
  && initial.selectedPlan == null && initial.compareSet.length === 0);

group('3. Reload and legacy normalization');
const legacy = {
  primaryNeed: 'HEALTH',
  selectedOffer: { productRef: 'health', packageRef: 'STANDARD' },
  compareSet: ['BASIC', 'motor:STANDARD']
};
B.adviceSelection.normalize(legacy);
ok('Legacy suy ra selectedProductId từ offer', legacy.selectedProductId === 'health');
ok('Legacy giữ đúng gói người dùng đã chọn', legacy.selectedPackageId === 'STANDARD' && legacy.selectedOffer.packageRef === 'STANDARD');
ok('Legacy compare được chuẩn hóa và lọc cùng sản phẩm',
  JSON.stringify(legacy.compareSet) === JSON.stringify(['health:BASIC']));
const stale = {
  primaryNeed: 'HEALTH',
  selectedProductId: 'missing',
  selectedPackageId: 'OLD',
  selectedOffer: { productRef: 'missing', packageRef: 'OLD' },
  compareSet: ['missing:OLD']
};
B.adviceSelection.normalize(stale);
ok('Dữ liệu stale bị loại, không tự ánh xạ', stale.selectedProductId == null && stale.selectedOffer == null && stale.compareSet.length === 0);

group('4. Channel-isolated conversion');
ok('Banca có reference đi thẳng xác nhận',
  B.adviceConversionDecision('BANCA_INTEGRATED', { externalCustomerRef: 'EXT-1' }).action === 'CONFIRM');
ok('Banca thiếu reference bị chặn',
  B.adviceConversionDecision('BANCA_INTEGRATED', {}).action === 'BLOCK_MISSING_BANCA_CONTEXT');
ok('Banca thiếu context không fallback attach',
  B.adviceConversionDecision('BANCA_INTEGRATED', {}).action !== 'ATTACH_CUSTOMER');
ok('Standalone thiếu context dùng attach hiện hành',
  B.adviceConversionDecision('BANCA_STANDALONE', {}).action === 'ATTACH_CUSTOMER');
ok('Agent có context đi thẳng xác nhận',
  B.adviceConversionDecision('AGENT_BROKER', { customerRef: 'C-1' }).action === 'CONFIRM');

group('5. Observable UI/recovery guards');
const html = fs.readFileSync(path.join(__dirname, '..', 'modules/advisory-workspace/index.html'), 'utf8');
// Bước Gợi ý dùng chung bảng so sánh + danh sách sản phẩm ngoài gợi ý → nạp kèm các hàm đó.
function grabFn(name) {
  const m = html.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}\\n'));
  return m ? m[0] : '';
}
const hierarchySource = ['advCompareRows', 'advCompareTable', 'advOtherProducts', 'bodyRecommendHierarchy']
  .map(grabFn).join('\n');
const renderHierarchy = hierarchySource.includes('function bodyRecommendHierarchy')
  ? new Function('BANCA', 'state', 'me', 'persist', 'advCmpRef', 'tip', 'advCmpDiffOnly',
    hierarchySource + '\n return bodyRecommendHierarchy();')
  : null;
// vnd/RIDER_CATALOG chỉ dùng để render nhãn phụ trong khối gợi ý bổ sung.
B.vnd = B.vnd || function (n) { return String(n || 0) + ' đ'; };
B.RIDER_CATALOG = B.RIDER_CATALOG || [];
const productDom = renderHierarchy(B, {
  primaryNeed: 'HEALTH', status: 'RECOMMENDED', selectedProductId: null,
  compareSet: []
}, 'RM-01', function () {}, B.adviceSelection.compareRef, function () { return ''; }, false);
const packageDom = renderHierarchy(B, {
  primaryNeed: 'HEALTH', status: 'RECOMMENDED', selectedProductId: 'health',
  selectedPackageId: null, compareSet: []
}, 'RM-01', function () {}, B.adviceSelection.compareRef, function () { return ''; }, false);
ok('DOM ban đầu chỉ có tầng sản phẩm, không có package/Fit',
  productDom.includes('Sản phẩm phù hợp với nhu cầu')
  && !productDom.includes('Basic') && !productDom.includes('Fit '));
ok('DOM sau chọn sản phẩm mới có đúng tầng gói/Fit',
  packageDom.includes('Gói đề nghị của Bảo hiểm sức khỏe')
  && packageDom.includes('Basic') && packageDom.includes('Fit '));
ok('Renderer chính dùng hierarchy mới', html.includes("if(step==='recommend') return bodyRecommendHierarchy();"));
ok('Có loading/error/empty recovery cho product và package',
  ['productLoadState', 'packageLoadState', 'advRetryProducts', 'advRetryPackages', 'Chưa có sản phẩm phù hợp', 'chưa có gói khả dụng']
    .every(function (marker) { return html.includes(marker); }));
ok('Banca missing-context có recovery về hệ thống ngân hàng',
  html.includes('advMissingBancaContextModal') && html.includes('Quay lại hệ thống ngân hàng'));
ok('PII render được gate bằng data-access stage',
  html.includes('BANCA.dataAccess.canShowPII(accessStage)'));
ok('Convert có double-submit và failure recovery',
  html.includes('if(advConvertSubmitting)') && html.includes('Lựa chọn vẫn được giữ') && html.includes('Thử lại bàn giao'));
ok('Attach channel khác có not-found/permission recovery',
  html.includes('Không tìm thấy khách hàng hoặc bạn không có quyền truy cập')
  && html.includes('Không tìm thấy lead hoặc bạn không có quyền truy cập'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
