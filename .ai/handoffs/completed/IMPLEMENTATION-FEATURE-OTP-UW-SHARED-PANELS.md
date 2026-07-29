# Implementation report — Shared OTP & Underwriting panels

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Handoff: `.ai/handoffs/in-progress/FEATURE-OTP-UW-SHARED-PANELS.md`

## Business outcome

- Application Workspace now uses the shared OTP panel for pending, sent, verified,
  expired and blocked presentations instead of maintaining page-local status markup.
- Health keeps one confirmation panel per insured unit. A child continues to show
  the guardian as confirmer.
- Mutation actions are available only to the case owner when the current
  underwriting state permits them. Read-only/manager access has no send/resend CTA.
- The underwriting tab now uses the shared underwriting panel for general products
  and for every active Health insured unit.
- STP presentation is separated from manual operational metadata. Requirements,
  conditions and exclusions continue to be read from the existing application data.
- No state resolver, transition, payment gate, OTP handler or policy issuance rule
  was changed.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `shared/components/confirm-payment.js` (presentation adapter only)
- `scripts/test-otp-underwriting-panels.js`
- `.ai/handoffs/in-progress/FEATURE-OTP-UW-SHARED-PANELS.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-OTP-UW-SHARED-PANELS.md`

## Deterministic validation

- JavaScript syntax checks: PASS.
- `test-otp-underwriting-panels.js`: PASS, 19/19.
- `test-underwriting-routing.js`: PASS, 42/42.
- `test-payment-gate.js`: PASS, 32/32.
- `test-quote-payment-issue.js`: PASS, 39/39.
- `test-demo-stories.js`: PASS, 18/18.
- `test-foundation.js`: PASS, 58/58.
- Manifest, module, terminology and duplicate-component validators: PASS.
- `git diff --check`: PASS.
- Design-token report: 1,154 errors / 685 warnings, below the approved baseline
  of 1,156 / 687.

## Browser smoke evidence

- Health `APP-2026-HLT3`, owner RM-01, confirmation/payment deep-link:
  3 shared OTP panels rendered for 3 insured units; send/resend presentation matched
  the stored member state.
- The same Health case under TL-01 read-only access rendered 3 OTP panels and
  zero mutation buttons.
- Health `APP-2026-HLT2`, underwriting deep-link: 3 shared underwriting panels
  rendered, one per active insured unit; no panel overflow at 768/1280.
- Motor `APP-2026-101`, underwriting deep-link: shared manual-underwriting panel
  rendered with its existing operational routing data.
- At 768 and 1280, shared panels introduced no horizontal overflow. At 390, the
  existing legacy Application Workspace shell collapses the content column to zero
  and produces page-level overflow. This is an existing shell/mobile constraint
  explicitly outside this handoff; no shell or breakpoint was changed.
- Viewport override was reset and demo persona restored to RM-01 after testing.

## QC focus

- Confirm the 390px legacy-shell baseline is accepted as out of scope.
- Recheck one PA submitted/STP case when a submitted PA fixture is available; the
  repository currently contains only the unsubmitted PA draft fixture. STP adoption
  is covered by deterministic component and source-adoption tests.
- Verify the STP panel does not expose queue/officer/SLA and that payment block
  reasons remain unchanged.

## Next action

Codex QC should review this implementation report and execute the final QC gate.
No commit was created.
