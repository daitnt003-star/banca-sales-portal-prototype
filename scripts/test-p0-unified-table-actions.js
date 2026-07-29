const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let failures = 0;
function ok(label, condition) {
  if (condition) console.log(`✓ ${label}`);
  else {
    failures += 1;
    console.error(`✗ ${label}`);
  }
}

const css = read('shared/styles/components.css');
const quote = read('shared/components/quote-list-shell.js');
const quick = read('modules/quick-advisory/index.html');
const policies = read('modules/policies/index.html');
const seller = read('modules/seller-workspace/index.html');
const team = read('modules/team-workspace/index.html');

ok('Action cell uses the 144px token expression', /\.table-action-cell\s*\{[^}]*width:calc\(var\(--space-5xl\) \* 3\)/s.test(css));
ok('Action stack is a one-column grid', /\.table-action-stack\s*\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,1fr\);[^}]*gap:var\(--space-xs\)/s.test(css));
ok('Shared more menu is an absolute token-based overlay', /\.table-action-more__menu\s*\{[^}]*position:absolute;[^}]*z-index:var\(--z-dropdown\);[^}]*background:var\(--paper-card\);[^}]*border-radius:var\(--radius-sm\);[^}]*box-shadow:var\(--shadow-2\)/s.test(css));
ok('Operational-list sticky action behavior remains', css.includes('table.operational-list th:last-child,table.operational-list td:last-child'));

[ ['Quick Advice', quick], ['Policy', policies], ['Seller', seller], ['Team', team] ].forEach(([label, source]) => {
  ok(`${label} uses shared action cells`, source.includes('table-action-cell'));
  ok(`${label} uses shared vertical action stacks`, source.includes('table-action-stack'));
});
ok('Quote shell applies action geometry to header and rows', quote.includes("c === 'action' ? ' class=\"table-action-cell\"'") && quote.includes('<div class="table-action-stack">'));
ok('Quick and Policy use the shared overlay disclosure', quick.includes('<details class="table-action-more">') && policies.includes('<details class="table-action-more">'));
ok('Team keeps its existing overflow behavior with shared geometry', team.includes('class="ovf table-action-more"') && team.includes('class="ovf-menu"'));
ok('Audit event Hành động remains a data header', team.includes('<th>Thời điểm</th><th>Hành động</th><th>Bởi</th><th>Chi tiết</th>'));
ok('Legacy horizontal action groups are removed in scope', !quick.includes('operational-actions') && !policies.includes('operational-actions') && !seller.includes('<div style="display:flex;gap:8px;flex-wrap:wrap;">${it.primaryActionHtml}'));

if (failures) {
  console.error(`\n${failures} unified-table-action assertion(s) failed.`);
  process.exit(1);
}
console.log('\nUnified table action checks passed.');
