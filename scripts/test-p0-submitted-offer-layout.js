#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'modules/application-workspace/app-workspace.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'modules/application-workspace/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared/styles/components.css'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'shared/js/head-loader.js'), 'utf8');

let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}

console.log('\n1. Submitted workspace zone order');
ok('Identity → command → business summary → stage stepper → content', app.includes('hdr+commandBar+submittedBusinessSummary+stageStepper+contentShell'));
ok('Compact identity remains separate', app.includes('<header class="submitted-case-header">'));
ok('P0.4 command bar remains reused', app.includes('renderSubmittedCommandBar(getSubmittedCaseActions(),na[0],'));
ok('Business summary strip is rendered between command and stepper', app.includes('const submittedBusinessSummary=`<section class="submitted-business-summary"')
  && app.includes("submittedSummaryItem('Giai đoạn hiện tại',stageLbl,true)")
  && app.includes("submittedSummaryItem('Việc tiếp theo',na[0])"));
ok('Reference data is collapsed into supporting header details', app.includes('class="submitted-case-header__refs"')
  && app.includes("metaChip('Báo giá',quoteRef)")
  && app.includes("metaChip('Mã xử lý',uwRef)"));
ok('Exactly one submitted progress/navigation component is rendered', app.includes('renderSubmittedStageStepper()')
  && !app.includes('class="submitted-lifecycle"')
  && !app.includes('class="submitted-navigation"'));
ok('Content shell retains semantic title', app.includes('class="submitted-content-shell" aria-labelledby="submitted-content-title"'));

console.log('\n2. P0.5 safety retained');
ok('Identity is still the only submitted sticky surface', css.includes('.submitted-case-header{')
  && css.includes('position:sticky;top:0;z-index:var(--z-sticky)')
  && !css.includes('.progress-stepper{position:sticky'));
ok('Command bar remains non-sticky', !css.includes('.workspace-command-bar{position:sticky'));
ok('Content remains single-column capable', css.includes('.submitted-content-layout--single{grid-template-columns:minmax(0,1fr);}'));
ok('Header still stacks below 960px', css.includes('@media(max-width:960px)')
  && css.includes('.submitted-case-header__inner{flex-direction:column;}'));
ok('Business summary uses responsive token grid', css.includes('.submitted-business-summary{')
  && css.includes('grid-template-columns:repeat(5,minmax(0,1fr))')
  && css.includes('.submitted-business-summary{grid-template-columns:minmax(0,1fr);}'));
ok('Read-only badge and issued action guard remain', app.includes("readOnly?'<span class=\"chip\">Chỉ xem</span>'")
  && app.includes('if(readOnly) return ['));
ok('Draft workspace action bar remains', app.includes('workspace-action-bar--draft'));

console.log('\n3. Cache compatibility');
ok('Shared cache version remains deterministic', loader.includes("const V = 'v=20260729a'"));
ok('Application loader/runtime query remains compatible', index.includes('head-loader.js?v=47')
  && index.includes('app-workspace.js?v=20260728m'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
