# Implementation report — P0.4 Workspace Action Bar

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1
Handoff: `.ai/handoffs/ready/FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`

## Business outcome

- Draft Application Workspace now renders previous navigation and the current
  primary action in one aligned bottom action group.
- The Review step's existing “Nộp yêu cầu bảo hiểm” control moved from the content
  card into that action bar. It keeps the same ID, submit handler, `okData` gate,
  two-confirmation gate and observable disabled reason.
- The disabled title is restored whenever either acknowledgement becomes unchecked;
  no submission rule or transition changed.
- Submitted Workspace now renders a compact command row near the header. It consumes
  the existing `getSubmittedCaseActions()` output, presents at most one primary
  control, and puts every additional action in a native `details/summary` “Khác”.
- Issued owner actions retain their existing policy destination, PDF behavior and
  customer-send behavior. Issued read-only/manager mode exposes only the view action.
- Desktop action groups use equal grid columns and full-height controls. At the
  approved 960px breakpoint, metadata and controls stack in one full-width column.
- No resolver, seed, product/package continuity, payment, underwriting, journey or
  API contract was modified.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-workspace-action-bar.js`
- `scripts/test-p0-page-header-next-action.js` — only the explicitly allowlisted
  hard-coded shared-asset version expectation.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`

## Cache compatibility

- Application Workspace loader query: `v=44` → `v=45`.
- Application runtime query: `v=20260724j` → `v=20260724k`.
- Shared asset version: `v=20260728t` → `v=20260728u`.
- The P0.1 regression assertion was updated only after the ready handoff received
  the attempt-1 corrective clarification.

## Deterministic validation

- P0.4 focused test: PASS, 29/29.
- P0.1 PageHeader/NextAction regression: PASS, 30/30.
- Product/package/quote continuity: PASS, 17/17.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Privacy/consent: PASS, 29/29.
- Application Workspace JavaScript syntax: PASS.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- `git diff --check` for implementation files: PASS.
- Design-token report: 1,139 errors / 681 warnings, below the approved baseline of
  1,140 / 682.

## Browser and keyboard smoke status

- Browser smoke could not run in this implementation environment. The same active
  environment blocks local ports, and serving the project root was previously
  rejected because it could expose unrelated files. No workaround was attempted.
- Codex QC should verify Motor, PA and Health draft/review/submitted states at
  desktop and ≤960px, plus manager/read-only and issued modes. Confirm equal action
  bounding boxes and native keyboard operation of “Khác”.

## Next action

Codex should execute browser/accessibility QC and final reflection. No commit was
created.
