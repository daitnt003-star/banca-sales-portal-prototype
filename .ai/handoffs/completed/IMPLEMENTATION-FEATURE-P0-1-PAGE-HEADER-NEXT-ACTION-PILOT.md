# Implementation report — P0.1 PageHeader & NextAction pilot

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Handoff: `.ai/handoffs/ready/FEATURE-P0-1-PAGE-HEADER-NEXT-ACTION-PILOT.md`

## Business outcome

- Added opt-in shared `PageHeader` and `NextActionPanel` presentation contracts.
  Both components escape user-facing text, accept explicitly trusted action markup,
  and do not infer permission or workflow state.
- Added shell `headerActionMode` resolution with deterministic `DEFAULT`,
  `QUICK_ADVICE`, `OFFERS` and `POLICIES` modes. Missing or unknown values preserve
  the existing default; management-only users continue to see no sales shortcuts.
- Migrated only the three approved pilot list surfaces:
  - Tư vấn nhanh: one semantic page title and only the quick-advice topbar shortcut.
  - Bản chào: one semantic page title; create/resume actions remain in the topbar.
  - Hợp đồng: one semantic list title and no sales shortcuts in the topbar.
- Detail routes and non-pilot pages retain their existing rendering. The
  `QuoteListShell` legacy header remains the default unless a page explicitly opts in.
- No business transition, permission, product, routing, storage or fixture rule was
  changed.

## Files changed

- `shared/components/foundation-components.js`
- `shared/styles/components.css`
- `shared/js/app-shell.js`
- `shared/components/quote-list-shell.js`
- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html`
- `modules/policies/index.html`
- `scripts/test-p0-page-header-next-action.js`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-1-PAGE-HEADER-NEXT-ACTION-PILOT.md`

## Deterministic validation

- `test-p0-page-header-next-action.js`: PASS, 28/28.
- `test-quick-advice-navigation.js`: PASS, 13/13.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- `git diff --check` for implementation files: PASS.
- Inline JavaScript syntax checks for all three pilot pages: PASS.
- Design-token report: 1,153 errors / 685 warnings, exactly the approved baseline.
  During implementation, one duplicate responsive breakpoint temporarily added one
  warning; its rules were merged into the existing breakpoint before handoff.

## UI safety

- Every normal pilot list rendering owns exactly one `h1`.
- Disabled, blocked and loading next-action states are non-actionable and expose
  visible explanatory text.
- New layout, spacing, typography, colors and responsive rules use the existing
  design tokens. Existing button target-size behavior is preserved.
- Pilot adoption is explicit. Submitted applications and all other non-pilot
  consumers continue through the legacy/default shell path.

## Remaining QC

- Browser and keyboard smoke remain for Codex final QC because no accessible local
  runtime was available in this implementation pass. Verify desktop/mobile layout,
  focus order and topbar action combinations for owner, seller and management-only
  personas.
- Reflection is owned by the final QC workflow and was not written outside the
  implementation allowlist.

## Next action

Codex QC should review this report, run the final browser/keyboard smoke and close
the gate. No commit was created.
