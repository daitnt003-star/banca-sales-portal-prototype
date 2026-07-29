#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'modules/application-workspace/app-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared/styles/components.css'), 'utf8');

let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}
function group(title) { console.log('\n' + title); }

group('1. Four-stage model and canonical navigation');
ok('Exactly four canonical stage IDs', app.includes("const SUBMITTED_STAGE_IDS=['created','underwriting','confirmation-payment','policy']"));
[
  "label:'Bản chào đã tạo'",
  "label:'Thẩm định',completedLabel:'Đã thẩm định'",
  "label:'Xác nhận & thanh toán',completedLabel:'Đã xác nhận & thanh toán'",
  "label:'Phát hành hợp đồng',completedLabel:'Đã phát hành hợp đồng'"
].forEach(function (copy) { ok('Approved stage copy: ' + copy, app.includes(copy)); });
ok('Stepper calls shared semantic renderer', app.includes("BANCA.ui.progressStepper(submittedStageModel.map") && app.includes("ariaLabel:'Tiến trình Bản chào đã nộp'"));
ok('Current step maps to shared current state', app.includes("state:stage.current?'current'"));
ok('Locked step maps to shared disabled state', app.includes("stage.enabled?'available':'disabled'"));
ok('Generated links use canonical stage query', app.includes("'&stage='+stage.id"));
ok('Legacy tab query is removed from canonical URL', app.includes("canonical.searchParams.delete('tab')") && app.includes("canonical.searchParams.set('stage',activeSubmittedStage)"));

group('2. Canonical business gates');
ok('Stage model reads canonical resolver states', app.includes('const s = caseView.states;'));
ok('Underwriting complete uses caseFlow.uwDecided', app.includes("complete:caseFlow.uwDecided"));
ok('Confirmation/payment unlock requires approved non-terminal UW', app.includes("enabled:caseFlow.approved&&!caseFlow.dead"));
ok('Confirmation/payment completion is monotonic from canonical downstream success',
  app.includes("complete:caseFlow.paySuccess||caseFlow.issued"));
ok('Legacy issued record displays prior combined stage as completed',
  app.includes("complete:caseFlow.paySuccess||caseFlow.issued")
  && app.includes("complete:caseFlow.issued")
  && app.includes("stage.complete&&!stage.current?stage.completedLabel:stage.label"));
ok('Policy unlock requires payment success', app.includes("enabled:caseFlow.paySuccess&&!caseFlow.dead"));
ok('Policy completion requires issued state', app.includes("complete:caseFlow.issued"));
ok('Terminal flow resolves to Underwriting', /function latestEnabledSubmittedStage\(\)\{[\s\S]*return 'underwriting';/.test(app));
ok('Locked deep link falls back to latest enabled stage', app.includes("requestedStageModel&&requestedStageModel.enabled)?requestedStage:latestEnabledSubmittedStage()"));
ok('Locked recovery reason is visible', app.includes('submitted-stage-recovery') && app.includes('Đã chuyển về bước khả dụng gần nhất.'));

group('3. Stage content composition');
const createdOrder = [
  "stageSection('Thông tin khách hàng'",
  "stageSection('Gói và phí theo Người được bảo hiểm'",
  "stageSection('Nội dung khai báo'",
  "stageSection('Tài liệu đã nộp'"
].map(function (needle) { return app.indexOf(needle); });
ok('Created contains four sections in approved order', createdOrder.every(function (i) { return i >= 0; })
  && createdOrder.every(function (i, n) { return n === 0 || i > createdOrder[n - 1]; }));
ok('Underwriting composes clarity renderer and supplement/history', app.includes('renderSubmittedUnderwritingClarity()+supplement') && app.includes("stageSection('Yêu cầu bổ sung và lịch sử bổ sung'"));
ok('Confirmation/payment reuses existing vertical renderer', app.includes("renderSubmittedStagePart('confirmpay')"));
ok('Policy reuses existing issuance renderer', app.includes("renderSubmittedStageGuidance('policy')+renderSubmittedStagePart('policy')"));
ok('Every canonical stage starts with guidance copy', app.includes('function renderSubmittedStageGuidance(stageId)')
  && app.includes("renderSubmittedStageGuidance('created')")
  && app.includes("renderSubmittedStageGuidance('underwriting')")
  && app.includes("renderSubmittedStageGuidance('confirmation-payment')")
  && app.includes("renderSubmittedStageGuidance('policy')"));
ok('Policy detail route remains available', app.includes("modules/policies/index.html?view=detail&id=${app.policyId}"));
ok('Assisted and self-service confirmation choices are explicit', app.includes('Hỗ trợ khách xác nhận OTP tại quầy') && app.includes('Gửi link để khách tự xác nhận'));
ok('Customer remains OTP actor', app.includes('Khách hàng trực tiếp cung cấp và nhập OTP'));
ok('Assisted and self-service use distinct handlers',
  app.includes("onclick=\"openAssistedCustomerOtp('${app.id}','')\"")
  && app.includes('onclick="sendConfirm()">Gửi link để khách tự xác nhận'));
ok('Assisted session renders a customer-controlled OTP input',
  app.includes('window.openAssistedCustomerOtp = function(id, unitId)')
  && app.includes('inputmode="numeric" autocomplete="one-time-code"')
  && app.includes('Khách hàng nhập OTP'));
ok('Confirmation completes only through explicit customer OTP submit',
  app.includes('window.submitCustomerAssistedOtp = function(id, unitId, inputId)')
  && app.includes("if(!/^\\d{6}$/.test(otp))")
  && app.includes("if(unitId) healthMemberConfirm(id,unitId,'verify');")
  && app.includes('else simConfirm();'));
ok('Health assisted sessions are per member, not bulk',
  app.includes("openAssistedCustomerOtp('${app.id}','${u.insuredUnitId}')")
  && app.includes("healthMemberConfirm('${app.id}','${u.insuredUnitId}','send')")
  && !app.includes("onclick=\"healthMemberConfirmAll('${app.id}')\">Hỗ trợ khách xác nhận OTP tại quầy"));

group('4. Legacy compatibility and removed navigation');
['overview','customer','quote','declaration','documents'].forEach(function (tab) {
  ok('Legacy ' + tab + ' maps to Created', app.includes(tab + ":'created'"));
});
['supplement','uw'].forEach(function (tab) {
  ok('Legacy ' + tab + ' maps to Underwriting', app.includes(tab + ":'underwriting'"));
});
['confirmpay','confirm','payment','comm'].forEach(function (tab) {
  ok('Legacy ' + tab + ' maps to Confirmation/payment', app.includes(tab + ":'confirmation-payment'"));
});
ok('Legacy history resolves to latest enabled stage', app.includes("legacyTabRequest==='history'"));
ok('Submitted lifecycle strip is no longer rendered', !app.includes('class="submitted-lifecycle"'));
ok('Submitted TabBar navigation is no longer rendered', !app.includes('class="submitted-navigation"') && !app.includes('BANCA.ui.tabBar(topTabs.map'));
ok('Output order is identity, command, summary, stepper, content', app.includes("hdr+commandBar+submittedBusinessSummary+stageStepper+contentShell"));

group('5. Responsive and accessibility styling');
ok('Desktop stepper uses compact shared row', css.includes('.progress-stepper ol{display:flex;'));
ok('Responsive stepper remains one horizontal track', css.includes('.progress-stepper ol{min-width:max-content;flex-wrap:nowrap;}'));
ok('Responsive track is horizontally scrollable', css.includes('.progress-stepper{margin-bottom:var(--space-md);overflow-x:auto;}'));
ok('Enabled steps retain visible focus', css.includes('.progress-stepper a:focus-visible'));
ok('No new stage motion is introduced', !css.includes('.progress-stepper__step{transition:'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
