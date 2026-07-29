# Implementation report — P0.6 Unified Table Action Column

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1
Handoff: `.ai/handoffs/ready/FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`

## Business outcome

- Added the shared `table-action-cell` and one-column `table-action-stack`
  presentation contract at the approved 144px token width.
- Quick Advice, Quote, Policy, Seller work queue/recent drafts, and applicable Team
  member/case/risk/task tables now use the same top/right action geometry.
- Existing primary/main actions remain first. Existing secondary/destructive actions
  remain behind their current native `Khác` or Team overflow behavior.
- Quick Advice and Policy disclosures now open absolute, token-based overlay menus;
  opening them does not contribute menu height to the table row.
- Team retains its existing overflow toggle behavior while sharing the fixed-width
  stack and token-based overlay geometry.
- Existing Operational List sticky last-column behavior remains unchanged; no sticky
  behavior was added to Seller or Team tables.
- Empty action states retain an empty fixed-width stack without fabricated controls.
- Formal action columns now display `Hành động`. The audit-event `Hành động` data
  column remains unchanged.
- Action availability, labels, destinations, row navigation, permissions, data,
  state, resolver, pricing, underwriting, payment, documents and OCR were not changed.

## Files changed

- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `shared/components/quote-list-shell.js`
- `modules/quick-advisory/index.html`
- `modules/policies/index.html`
- `modules/seller-workspace/index.html`
- `modules/team-workspace/index.html`
- `scripts/test-p0-unified-table-actions.js`
- `scripts/test-p0-operational-lists.js`
- `scripts/test-p0-page-header-next-action.js` — shared cache assertion only.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`

## Cache compatibility

- Shared asset version: `v=20260728v` → `v=20260728w`.
- Page loader query versions were left unchanged; no page loader source changed.

## Deterministic validation

- P0.6 unified table action test: PASS, 17/17.
- P0.3 Operational Lists regression: PASS, 46/46.
- P0.1 PageHeader/NextAction regression: PASS, 30/30.
- Quick Advice navigation regression: PASS, 13/13.
- Home Work Queue regression: PASS, 34/34.
- Privacy Home regression: PASS, 28/28.
- Privacy/consent regression: PASS, 29/29.
- Shared and in-scope inline JavaScript syntax: PASS.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- `git diff --check` for implementation files: PASS.
- Design-token report: 1,119 errors / 669 warnings, within the approved baseline of
  1,122 / 670.

## Browser and keyboard smoke status

- Browser measurements/screenshots could not run in this implementation environment.
  Local-port serving is blocked and serving the project root was previously rejected
  because it could expose unrelated files. No workaround was attempted.
- Codex QC should measure the 144px controls and row height before/after opening
  Quick Advice, Policy and Team overflow menus; verify Quote, Seller and Team tables
  at desktop/tablet widths; and check RM-01, RM-02, manager/read-only personas,
  keyboard focus, disclosure open/close and horizontal overflow containment.

## Next action

Codex should execute browser/accessibility QC and final reflection. No commit was
created.
