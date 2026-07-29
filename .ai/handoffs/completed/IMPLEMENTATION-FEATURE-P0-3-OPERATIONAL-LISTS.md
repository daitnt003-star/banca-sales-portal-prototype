# Implementation report — P0.3 Operational Lists

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Handoff: `.ai/handoffs/ready/FEATURE-P0-3-OPERATIONAL-LISTS.md`

## Business outcome

- Quick Advice now uses the approved six-column scan order. Advice ID, version,
  customer/source context, advisor and indicative premium remain available as
  primary or secondary metadata.
- Quick Advice preserves its tabs, search, data merge and deep links. Each row has
  one main action; delete and additional navigation move under the keyboard-native
  `Khác` disclosure.
- Policy list now uses six columns. Policy/certificate, product/asset, status/next
  step, effective period, premium and actions remain visible in the approved order.
- Policy ID remains a direct detail link. The state-derived main action is limited
  to one per row; lower-priority and destructive/context actions are under `Khác`.
- Non-SELF policy participant/owner context remains available as secondary metadata.
- Bản chào retains its domain renderer and PREPARING/SELF six-column behavior.
  QuoteListShell only receives the structural class, scoped headers and a direct
  keyboard-accessible Bản chào ID link.
- No generic business renderer was created. No filter, data scope, permission,
  state resolver, detail/workspace or submitted-list behavior was changed.

## Files changed

- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html` (loader query only)
- `modules/policies/index.html`
- `shared/components/quote-list-shell.js`
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-operational-lists.js`
- `scripts/test-p0-page-header-next-action.js` (cache assertions only)
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-3-OPERATIONAL-LISTS.md`

## Cache compatibility

- Three pilot pages now use `head-loader.js?v=46`.
- Shared loader assets now use deterministic version `v=20260728t`.
- Focused tests assert both versions to prevent a loader/shared-style mismatch.

## Deterministic validation

- P0.3 operational-list test: PASS, 46/46.
- P0.1 PageHeader/NextAction regression: PASS, 30/30.
- Quick Advice navigation regression: PASS, 13/13.
- Inline syntax checks for all three pilot pages: PASS.
- QuoteListShell syntax check: PASS.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- `git diff --check` for allowed files: PASS.
- Design-token report: 1,140 errors / 682 warnings, below the approved baseline
  of 1,141 / 682.

## Browser and keyboard smoke status

- Browser smoke could not run in this implementation environment. A prior attempt
  in the same active environment established that the sandbox blocks local ports,
  and escalation to serve the project root was rejected due to exposure risk. No
  workaround was attempted.
- Codex QC should inspect all three SELF lists and one available manager scope,
  verify `Khác` using keyboard, and check desktop plus tablet horizontal overflow.

## Next action

Codex should run browser/accessibility QC and the final reflection gate. No commit
was created.
