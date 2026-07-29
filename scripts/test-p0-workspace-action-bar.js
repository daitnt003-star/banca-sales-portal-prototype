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
  else { fail++; console.log('  ✗ ' + name); }
}
function group(title) { console.log('\n' + title); }
function count(value, marker) { return value.split(marker).length - 1; }

group('1. Draft action bar and review continuity');
ok('Draft dùng workspace action bar', app.includes('ux-bottom-actions workspace-action-bar workspace-action-bar--draft'));
ok('Previous và primary cùng action group', app.includes('<div class="workspace-action-group">')
  && app.includes('reviewSubmitAction||(next?'));
ok('Review submit chỉ render đúng một lần', count(app, 'id="submit-btn"') === 1);
ok('Review content card không còn submit', !app.includes('${!readOnly?`<button class="btn btn-primary" id="submit-btn"'));
ok('Submit giữ nguyên handler', app.includes("onclick=\"submitApp('${app.id}')\""));
ok('Submit giữ okData blocker', app.includes('data-okdata="${okData?\'1\':\'0\'}"'));
ok('Submit giữ lý do disabled quan sát được', app.includes('data-disabled-reason="${submitDisabledReason}"')
  && app.includes("b.dataset.disabledReason||'Cần tick đủ 2 xác nhận'"));
ok('Hai xác nhận tiếp tục gọi refreshSubmitBtn', count(app, 'onchange="refreshSubmitBtn()"') === 2);
ok('Read-only không tạo submit action', app.includes("reviewSubmitAction=!readOnly?"));

group('2. Submitted canonical actions and disclosure');
ok('Submitted tiếp tục lấy canonical caseView', app.includes('const caseView = BANCA.deriveCaseViewState(app)'));
ok('Command bar nhận nguyên getSubmittedCaseActions', app.includes('renderSubmittedCommandBar(getSubmittedCaseActions(),na[0],'));
ok('At most one primary được tách ra', app.includes("if(!primary && html.indexOf('btn-primary')>=0) primary=html"));
ok('Primary bổ sung được hạ presentation trong menu', app.includes("html.replace('btn-primary','btn-secondary')"));
ok('Secondary actions nằm trong native details/summary', app.includes('<details class="workspace-action-more"><summary'));
ok('Khác giữ keyboard semantics', app.includes('>Khác</summary>'));
ok('Issued owner giữ destinations/effects', app.includes("alert('Tải hợp đồng PDF (demo)')")
  && app.includes("this.textContent='Đã gửi';this.disabled=true;")
  && app.includes('modules/policies/index.html?view=detail&id=${app.policyId}'));
ok('Issued read-only chỉ còn hành động xem', app.includes('if(readOnly) return [')
  && app.includes('class="btn btn-secondary btn-sm">Xem hợp đồng</a>'));

group('3. Equal sizing, responsive and focus');
ok('Action group dùng equal grid columns', css.includes('grid-auto-columns:minmax(0,1fr)'));
ok('Control cùng nhóm rộng và cao bằng group', css.includes('.workspace-action-group>.btn,.workspace-action-group>.workspace-action-more,.workspace-action-more>summary{width:100%;height:100%;}'));
ok('Draft action bar sticky bằng token', css.includes('position:sticky;bottom:0;z-index:var(--z-sticky)'));
ok('Submitted command row compact không bottom-sticky', css.includes('.workspace-command-bar{margin-top:var(--space-md);border-radius:var(--radius-md);}'));
ok('Khác dùng elevation và z-index token', css.includes('z-index:var(--z-dropdown)')
  && css.includes('box-shadow:var(--shadow-2)'));
ok('Responsive dùng breakpoint 960 đã duyệt', css.includes('@media(max-width:960px)'));
ok('Responsive stack một cột full width', css.includes('flex-direction:column')
  && css.includes('.workspace-action-bar__meta,.workspace-action-group{width:100%;}')
  && css.includes('grid-template-columns:minmax(0,1fr)'));
ok('Summary giữ focus style btn hiện hữu', app.includes('summary class="btn btn-secondary btn-sm"'));

group('4. Cache compatibility and prohibited-scope guard');
ok('Shared assets bump deterministic một lần', loader.includes("const V = 'v=20260729a'"));
ok('Application page bump loader query', index.includes('head-loader.js?v=47'));
ok('Application runtime query được bump', index.includes('app-workspace.js?v=20260728m'));
ok('Không thêm resolver/seed reference mới', !app.includes('WORKSPACE_ACTION_RESOLVER')
  && !app.includes('workspace-action-seed'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
