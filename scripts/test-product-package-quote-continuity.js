#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
global.window = global;
global.document = { getElementById: function () { return null; } };
global.location = { href: '' };
global.confirm = function () { return true; };
global.BANCA = {
  ui: {},
  products: [
    { id:'motor', name:'Bảo hiểm vật chất xe' },
    { id:'pa', name:'Bảo hiểm tai nạn cá nhân' },
    { id:'health', name:'Bảo hiểm sức khỏe' }
  ],
  applications: [],
  current: function () { return 'RM-01'; },
  capabilities: function () { return ['can_quote']; },
  vnd: function (n) { return String(n || 0) + 'đ'; },
  motorPackages: {
    BASIC:{code:'BASIC',name:'Basic',coverageList:['TPL'],defaultAddOns:[],defaultDeductible:2000000},
    STANDARD:{code:'STANDARD',name:'Standard',coverageList:['TPL','OD'],defaultAddOns:['HYDRO_LOCK'],defaultDeductible:1000000}
  },
  coverageLabels:{TPL:'TNDS bắt buộc',OD:'Vật chất xe'},
  motorAddOns:{HYDRO_LOCK:{code:'HYDRO_LOCK',name:'Thủy kích',ratePct:6}},
  paPackages:{
    PA_BASIC:{code:'PA_BASIC',name:'PA Cơ bản',sumInsured:100000000,coverageList:['DEATH_PA']},
    PA_STD:{code:'PA_STD',name:'PA Tiêu chuẩn',sumInsured:300000000,coverageList:['DEATH_PA','MEDICAL_EXPENSE']}
  },
  paCoverageLabels:{DEATH_PA:'Tử vong do tai nạn',MEDICAL_EXPENSE:'Chi phí y tế'},
  healthPackages:{
    HEALTH_BASIC:{code:'HEALTH_BASIC',name:'Sức khỏe Cơ bản',inpatientLimit:100000000,outpatientLimit:0},
    HEALTH_STD:{code:'HEALTH_STD',name:'Sức khỏe Tiêu chuẩn',inpatientLimit:250000000,outpatientLimit:20000000}
  },
  rateMotor:function () { return {totalPremium:1000}; },
  ratePA:function () { return {totalPremium:2000}; },
  rateHealth:function () { return {totalPremium:3000}; },
  patchApp:function (id, patch) { global.lastPatch = {id:id, patch:patch}; }
};

require('../shared/components/sales-context-offer.js');
const src = fs.readFileSync(path.join(__dirname, '../modules/application-workspace/app-workspace.js'), 'utf8');
let pass=0, fail=0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}
function group(name) { console.log('\n' + name); }

group('1. Canonical package continuity');
const pa={id:'D-PA',owner:'RM-01',submissionState:'NOT_SUBMITTED',productId:'pa',productName:'PA',package:'PA_STD'};
BANCA.applications=[pa];
const paHtml=BANCA.ui.offerSelectionWorkspace(pa);
ok('PA selector dùng canonical code', paHtml.includes('PA_BASIC') && paHtml.includes('PA_STD') && !paHtml.includes('PA_10'));
const legacyPa={id:'D-PA-LEGACY',owner:'RM-01',submissionState:'NOT_SUBMITTED',productId:'pa',productName:'PA',package:'Standard'};
BANCA.applications=[legacyPa];
BANCA.overlay={applications:{'D-PA-LEGACY':{packageCode:'UNKNOWN_PACKAGE',selectedPackageId:'PA_OLD'}}};
const legacyPaHtml=BANCA.ui.offerSelectionWorkspace(legacyPa);
ok('overlay invalid không chặn app Standard resolve đúng PA_STD',
  /name="pkg" checked onchange="[^"]+PA_STD/.test(legacyPaHtml) &&
  BANCA.offer.resolvePackageCode(legacyPa)==='PA_STD' &&
  BANCA.offer.normalizePackageCode(legacyPa,'Standard')==='PA_STD' &&
  BANCA.offer.normalizePackageCode(Object.assign({},legacyPa,{package:null}),null)===null);
BANCA.overlay={applications:{}};
ok('legacy generic labels resolve theo từng product',
  BANCA.offer.normalizePackageCode({productId:'motor'},'Premium')==='PREMIUM' &&
  BANCA.offer.normalizePackageCode({productId:'health'},'Tiêu chuẩn')==='HEALTH_STD');
BANCA.applications=[pa];
BANCA.offer.selectPackage(pa.id,'PA_BASIC');
ok('chọn gói persist đủ ba canonical field', lastPatch.patch.package==='PA_BASIC' && lastPatch.patch.packageCode==='PA_BASIC' && lastPatch.patch.selectedPackageId==='PA_BASIC');

const health={id:'D-H',owner:'RM-01',submissionState:'NOT_SUBMITTED',productId:'health',productName:'Health',
  insuredMembers:[{insuredUnitId:'IU-1',package:null},{insuredUnitId:'IU-2',package:'HEALTH_BASIC'}]};
BANCA.applications=[health];
BANCA.offer.selectPackage(health.id,'HEALTH_STD');
ok('Health dùng lựa chọn làm default nhưng giữ per-member override',
  lastPatch.patch.insuredMembers[0].package==='HEALTH_STD' && lastPatch.patch.insuredMembers[1].package==='HEALTH_BASIC');

group('2. Safe product switch/reset');
const motor={id:'D-M',owner:'RM-01',submissionState:'NOT_SUBMITTED',productId:'motor',productName:'Motor',
  customerId:'CUS-1',source:'BANK_CUSTOMER',dataSharingGrantStatus:'GRANTED_BY_SOURCE',
  package:'STANDARD',quote:{id:'Q1'},riskAnswers:{claims:2},vehicle:{plate:'51A'},payment:{status:'PENDING'}};
BANCA.applications=[motor];
global.confirm=function(){return false;}; global.lastPatch=null;
BANCA.offer.switchProduct(motor.id,'pa');
ok('cancel giữ nguyên dữ liệu', lastPatch===null && motor.productId==='motor');
global.confirm=function(){return true;};
BANCA.offer.switchProduct(motor.id,'pa');
ok('confirm đổi product và quay CUSTOMER_INFO', lastPatch.patch.productId==='pa' && lastPatch.patch.currentStage==='CUSTOMER_INFO');
ok('reset dữ liệu phụ thuộc sản phẩm', lastPatch.patch.package===null && lastPatch.patch.quote===null && lastPatch.patch.vehicle===null && lastPatch.patch.payment===null && Array.isArray(lastPatch.patch.quoteVersions));
ok('customer/source/consent không nằm trong reset patch', !Object.prototype.hasOwnProperty.call(lastPatch.patch,'customerId') && !Object.prototype.hasOwnProperty.call(lastPatch.patch,'source') && !Object.prototype.hasOwnProperty.call(lastPatch.patch,'dataSharingGrantStatus'));
const submitted={id:'S1',owner:'RM-01',submissionState:'SUBMITTED',productId:'motor',productName:'Motor'};
BANCA.applications=[submitted]; global.lastPatch=null;
BANCA.offer.switchProduct(submitted.id,'pa');
ok('submitted không thể đổi sản phẩm', lastPatch===null);

group('3. Quote workspace presentation contract');
ok('primary và alternatives dùng progressive disclosure', src.includes('<h2>Phương án đã chọn</h2>') && src.includes('class="pkg-alternatives"'));
ok('có secondary CTA đổi sản phẩm với permission gate', src.includes('function productChangeAction()') && src.includes("caps.includes('can_quote')") && src.includes('>Đổi sản phẩm</a>'));
ok('PA hiển thị đủ nhóm nội dung', src.includes('Chi tiết phí') && src.includes('Quyền lợi và hạn mức') && src.includes('Điều khoản và loại trừ') && src.includes('Tác động từ khai báo rủi ro'));
ok('referral note không bịa phí sau thẩm định', src.includes('Cần thẩm định trước khi chốt phí. Phí hiện tại chưa bao gồm điều chỉnh sau thẩm định.'));
ok('không còn technical alert được chỉ định',
  !src.includes('journey riêng, không dùng lại field/tài liệu xe') &&
  !src.includes('Câu hỏi động theo sản phẩm (') &&
  !src.includes('packageMode PER_MEMBER') &&
  !src.includes('Chọn gói để tính phí dự kiến.'));
ok('Motor/Health đọc canonical selected package',
  src.includes('const sel = resolvePackageCode(app, unit ? [unit.package] : [])') &&
  src.includes('const curPkgCode = resolvePackageCode(app, [snap.packageCode])'));
ok('quote workspace normalize legacy trước khi xác định primary',
  src.includes('const resolvePackageCode =') &&
  src.includes('const sel = resolvePackageCode(app);') &&
  src.includes('const curPkgCode = resolvePackageCode(app, [snap.packageCode])'));

console.log('\n===================================');
console.log('  PASS: '+pass+'   FAIL: '+fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
