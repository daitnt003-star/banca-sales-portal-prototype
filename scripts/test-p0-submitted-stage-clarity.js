#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'modules/application-workspace/app-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared/styles/components.css'), 'utf8');
let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}
function group(title) { console.log('\n' + title); }

group('1. Connected process and independent semantics');
ok('Business-current stage is derived separately', app.includes('const businessCurrentSubmittedStage='));
ok('Issued has no in-progress node', app.includes('caseFlow.issued?null:'));
ok('Terminal or incomplete UW stays current at Underwriting', app.includes("caseFlow.dead||!caseFlow.uwDecided?'underwriting'"));
ok('Approved unpaid stays current at Confirmation/payment', app.includes("!caseFlow.paySuccess?'confirmation-payment':'policy'"));
ok('Selected content stage is independent', app.includes('stage.selected=stage.id===activeSubmittedStage'));
ok('Business-current maps to shared current state', app.includes("state:stage.current?'current'"));
ok('Selected view remains a separate shared prop', app.includes('selected:stage.selected') && app.includes("selectedLabel:'Đang xem'"));
ok('Shared renderer owns approved business-current copy', fs.readFileSync(path.join(root, 'shared/components/foundation-components.js'), 'utf8').includes("'Đang thực hiện'"));
ok('Custom connector line is removed', !css.includes('.submitted-stage-stepper ol::before'));
ok('Completed and current nodes use separate shared token states', css.includes('.progress-stepper__step.is-complete') && css.includes('.progress-stepper__step.is-current'));
ok('Selected completed node keeps complete state independently', css.includes('.progress-stepper__step.is-selected') && app.includes("stage.complete?'complete'"));
ok('Locked stage maps to disabled shared state', app.includes("stage.enabled?'available':'disabled'"));

group('2. Insured-owned package and fee');
ok('Approved section heading is present', app.includes("stageSection('Gói và phí theo Người được bảo hiểm'"));
ok('Health uses active insured units', app.includes("BANCA.healthUnitsOf(app).filter(function(unit){return unit.active!==false;})"));
ok('Presentation view has stable insuredUnitId', app.includes('insuredUnitId:unit.insuredUnitId'));
ok('Unselected insured keeps a native link to its package', app.includes('<a class="submitted-insured-card__more"'));
ok('Selected insured card exposes aria-current', app.includes('aria-current="true"'));
ok('Canonical selection uses insured query', app.includes("'&stage=created&insured='"));
ok('Invalid insured falls back to first active unit', app.includes("||submittedInsuredUnits[0]||null"));
ok('Canonical URL recovers invalid insured selection', app.includes("canonical.searchParams.set('insured',selectedSubmittedInsured.insuredUnitId)"));
ok('One card carries insured, product, package and fee together', app.includes('${unit.productName||\'—\'} · ${unit.packageLabel}')
  && app.includes('submitted-insured-card__fee') && !app.includes('submitted-insured-detail__summary'));
ok('Package and benefits render inside the selected insured card', app.includes('submitted-insured-card__body') && app.includes('submittedInsuredCardBody(unit)'));
ok('Unavailable member premium is explicit', app.includes("'Chưa tách phí theo người'"));
ok('Health member premium is not recomputed from family total', !/memberPremium:line&&line\.eligible/.test(app));
ok('Family total is rendered separately', app.includes('submitted-family-total') && app.includes('Tổng gia đình được trình bày riêng'));
ok('Motor and PA derive one insured presentation unit', app.includes("insuredUnitId:'insured-1'"));
ok('Insured cards and their links retain visible focus', css.includes('.submitted-insured-card__more:focus-visible,.submitted-insured-card:focus-visible'));

group('3. Underwriting clarity');
ok('Purpose appears first', app.indexOf('Mục đích thẩm định') < app.indexOf('Tình trạng hiện tại'));
ok('Current status precedes next action and member results', app.indexOf('Tình trạng hiện tại') < app.indexOf('Việc cần thực hiện')
  && app.indexOf('Việc cần thực hiện') < app.indexOf('Kết quả theo Người được bảo hiểm'));
ok('Pending member prevents all-approved wording', app.includes("hasPending?'Đang thẩm định':'Đã chấp thuận'"));
ok('Need-more case/member produces business wording', app.includes("phase==='NEED_MORE_INFORMATION'") && app.includes("hasMore?'Cần bổ sung'"));
ok('REFERRED member is presented as Cần bổ sung', app.includes("if(['NEED_MORE_INFO','REFERRED'].includes(decision)) return 'Cần bổ sung';"));
ok('Declined member is explicit', app.includes("hasDeclined?'Có Người được bảo hiểm không được chấp thuận'"));
ok('Next actions use approved business copy', app.includes('Bổ sung hồ sơ theo yêu cầu.') && app.includes('Chưa cần thao tác; theo dõi kết quả thẩm định.')
  && app.includes('Gửi khách xác nhận.') && app.includes('Tiếp tục xác nhận & thanh toán.'));
ok('Member results use one card per insured view', app.includes("submittedInsuredUnits.map(function(view){return `<article class=\"submitted-uw-member\""));
ok('Supplement/history section is composed once', (app.match(/stageSection\('Yêu cầu bổ sung và lịch sử bổ sung'/g)||[]).length === 1);
ok('Operational support is collapsed', app.includes('<details class="submitted-uw-support">'));
ok('Stage guidance uses business wording before active content', app.includes('submitted-stage-guidance')
  && app.includes('Kiểm tra hồ sơ đã nộp')
  && app.includes('Hoàn tất xác nhận và thu phí')
  && app.includes('Theo dõi phát hành hợp đồng'));
ok('Active clarity renderer contains no technical heading', !/renderSubmittedUnderwritingClarity[\s\S]*Trạng thái tổng \(derive\)/.test(app));
const summaryStart = app.indexOf('function submittedUnderwritingSummary(');
const summaryEnd = app.indexOf('function renderSubmittedUnderwritingClarity()', summaryStart);
const fixtureContext = { caseFlow: { confirmComplete: false }, result: null };
vm.runInNewContext(app.slice(summaryStart, summaryEnd)
  + "\nresult=submittedUnderwritingSummary('NEED_MORE_INFORMATION',['Đang thẩm định']);", fixtureContext);
ok('HLT6 fixture prioritizes case need-more-info over pending wording',
  fixtureContext.result.current === 'Cần bổ sung'
  && fixtureContext.result.next === 'Bổ sung hồ sơ theo yêu cầu.');
ok('Active supplement copy removes technical request IDs and wording',
  !app.includes('<b>${rq.id}</b>')
  && !app.includes('Bổ sung mang tính kỹ thuật/tài liệu'));

group('4. Responsive and scope safety');
ok('Narrow stepper remains one horizontal row', css.includes('.progress-stepper ol{min-width:max-content;flex-wrap:nowrap;}'));
ok('Insured cards stack vertically at every width', css.includes('.submitted-insured-list{display:grid;gap:var(--space-sm);}'));
ok('Card head and status stack at existing breakpoint', css.includes('.submitted-insured-card__head,.submitted-uw-current{grid-template-columns:minmax(0,1fr);}'));
ok('No resolver or gate implementation added', !app.includes('P0_8_STAGE_RESOLVER') && !app.includes('P0_8_PAYMENT_GATE'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
