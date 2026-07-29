# Implementation report — P0.2 Unified Home Work Queue

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Handoff: `.ai/handoffs/ready/FEATURE-P0-2-UNIFIED-HOME-WORK-QUEUE.md`

## Business outcome

- Home now renders handoffs, supplement requests, quote re-rate work and
  submit-ready work in one visible “Việc cần làm ngay” queue.
- The duplicate “Bàn giao mới” section was removed from rendering.
- Work items use stable category-prefixed keys, are deduplicated before rendering
  and retain the existing overdue → severity → due ordering.
- Category filters include ALL and communicate the active choice through visible
  text plus `aria-pressed`. Filter-empty state recovers to ALL.
- The queue shows eight rows by default and expands/collapses in place.
- Every row retains one visible primary action. Handoff labels remain specific to
  sales handoff, reassignment and delegation.
- Handoff context and secondary actions are available from the `Khác` modal. The
  modal calls the existing review, need-information and decline handlers; transition
  and service logic were not changed.
- Loading, whole-queue empty, filter-empty and error/retry presentations are covered.
- Banca integrated rendering remains PII-safe; Agent/Broker retains permitted
  customer name and CIF rendering.
- Lower Home sections remain unchanged.

## Files changed

- `modules/seller-workspace/index.html`
- `scripts/test-home-work-queue.js`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-2-UNIFIED-HOME-WORK-QUEUE.md`

`scripts/test-privacy-home.js` was executed unchanged.

## Deterministic validation

- Home Work Queue test: PASS, 34/34.
- Home privacy regression: PASS, 28/28.
- P0.1 PageHeader/NextAction regression: PASS, 30/30.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- Inline Home JavaScript syntax check: PASS.
- `git diff --check` for allowed implementation files: PASS.
- Design-token report: 1,141 errors / 682 warnings, below the approved baseline of
  1,153 / 685. No shared styles or arbitrary design primitives were added.

## Browser smoke status

- Browser smoke could not run in the implementation environment. The sandbox
  rejected opening a local HTTP port, and the escalation was rejected because
  serving the project root could expose unrelated project files. No workaround was
  attempted.
- Codex QC should verify ALL and each category, expand/collapse, the handoff `Khác`
  modal, keyboard focus, and Banca/Agent-Broker presentation in its existing browser
  runtime.

## Next action

Codex should execute browser/UI QC and the final reflection gate. No commit was
created.
