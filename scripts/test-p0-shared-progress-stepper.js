#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const foundation = fs.readFileSync(path.join(root, 'shared/components/foundation-components.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'modules/application-workspace/app-workspace.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'shared/styles/components.css'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'docs/rework-v2/E-component-registry.md'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'shared/js/head-loader.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'modules/application-workspace/index.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name); }
}

console.log('\n1. Shared renderer contract');
ok('Exactly one renderer owns step markup', (foundation.match(/BANCA\.ui\.progressStepper\s*=/g) || []).length === 1);
ok('Renderer accepts items and cfg', foundation.includes('BANCA.ui.progressStepper = function (items, cfg)'));
ok('Renderer supports all four states', ['complete', 'current', 'available', 'disabled'].every(s => foundation.includes("'" + s + "'")));
ok('Renderer supports brand and warning current tones', foundation.includes("cfg.currentTone === 'warning'") && css.includes('.progress-stepper--brand') && css.includes('.progress-stepper--warning'));
ok('Disabled output is non-link and aria-disabled', foundation.includes("return '<li><span class=\"' + cls + '\" aria-disabled=\"true\">"));
ok('Enabled output is a native link', foundation.includes("return '<li><a class=\"' + cls + '\" href=\"'"));
ok('Current and selected semantics are independent', foundation.includes('state === \'current\' ? \' aria-current="step"\'') && foundation.includes('data-selected="true"'));
ok('Supplied presentation values are escaped', foundation.includes("_esc(item.href || '#')") && foundation.includes("_esc(item.label || '')") && foundation.includes('_esc(item.helper)'));

const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
sandbox.window.BANCA = {};
sandbox.BANCA = sandbox.window.BANCA;
vm.runInNewContext(foundation, sandbox);
const html = sandbox.BANCA.ui.progressStepper([
  { label: 'Xong', href: '?x=1&y=2', state: 'complete', selected: true },
  { label: 'Hiện tại', href: '?x=2', state: 'current' },
  { label: 'Chưa mở', state: 'disabled', helper: 'Cần hoàn tất trước' }
], { ariaLabel: 'Tiến trình thử', currentTone: 'warning' });
ok('Rendered complete state has check and selected marker', html.includes('is-complete is-selected') && html.includes('>✓</span>') && html.includes('data-selected="true"'));
ok('Rendered current state exposes aria-current', html.includes('is-current') && html.includes('aria-current="step"'));
ok('Rendered disabled state has no disabled link', html.includes('is-disabled" aria-disabled="true"') && !/<a[^>]+is-disabled/.test(html));
ok('Rendered href is escaped', html.includes('?x=1&amp;y=2'));

console.log('\n2. Draft and Submitted adoption');
ok('Draft calls shared renderer with brand tone', app.includes("BANCA.ui.progressStepper(steps.map") && app.includes("currentTone:'brand'"));
ok('Submitted calls shared renderer with warning tone', app.includes('BANCA.ui.progressStepper(submittedStageModel.map') && app.includes("currentTone:'warning'"));
ok('No inline Draft step anchor renderer remains', !app.includes('const stepLink ='));
ok('No custom Submitted markup remains', !app.includes('class="submitted-stage-stepper"') && !app.includes('submitted-stage-step__'));
ok('No custom Submitted CSS or connector remains', !css.includes('.submitted-stage-stepper') && !css.includes('.submitted-stage-step') && !css.includes('ol::before'));
ok('Draft derives complete/current/available without changing stage rules', app.includes("state:active?'current':done?'complete':'available'"));
ok('Submitted keeps selected independent from state', app.includes('selected:stage.selected') && app.includes("state:stage.current?'current':stage.complete?'complete':stage.enabled?'available':'disabled'"));

console.log('\n3. Shared compact responsive anatomy');
ok('Stepper uses compact inline chips', css.includes('.progress-stepper__step{display:flex;align-items:center') && css.includes('padding:var(--space-xs) var(--space-md)'));
ok('Completed is teal, current tones are distinct, disabled is grey', css.includes('.progress-stepper__step.is-complete{color:var(--teal-600)') && css.includes('background:var(--amber-600)') && css.includes('.progress-stepper__step.is-disabled{color:var(--ink-300)'));
ok('Status is represented by check/ordinal and text', foundation.includes("stateLabel = state === 'complete'") && foundation.includes("state === 'complete' ? '✓'") && foundation.includes('progress-stepper__status'));
ok('Narrow layout remains one scrollable row', css.includes('.progress-stepper{margin-bottom:var(--space-md);overflow-x:auto;}') && css.includes('.progress-stepper ol{min-width:max-content;flex-wrap:nowrap;}'));
ok('Links retain visible focus', css.includes('.progress-stepper a:focus-visible'));
ok('Registry lists the shared component', registry.includes('**progressStepper**') && registry.includes('Draft + Submitted'));

console.log('\n4. Cache');
ok('Shared cache bumped once', loader.includes("const V = 'v=20260729a'"));
ok('Application loader and runtime cache bumped', index.includes('head-loader.js?v=47') && index.includes('app-workspace.js?v=20260728m'));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
