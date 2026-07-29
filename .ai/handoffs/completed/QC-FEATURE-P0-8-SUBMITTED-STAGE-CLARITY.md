# QC report

Feature: P0.8 Submitted Stage Clarity
Reviewer: Codex
Result: PASS

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| 1–4 | PASS | Browser and focused tests confirm one connected four-node process; business-current and selected-view states remain separate; P0.7 gating is unchanged. |
| 5–10 | PASS | Health renders active insured cards and stable `insured=` selection; invalid selection recovers; member premium is explicit-only with `Chưa tách phí theo người`; family total is separate; Motor renders the same one-insured pattern. |
| 11–14 | PASS | Active Underwriting renders purpose → current state → next action → member results → one supplement/history section. Browser mixed-UW and need-more-info cases contain no `derive`, queue or raw decision code. |
| 15–17 | PASS | Permission and downstream regressions pass; links/focus/aria and responsive single-row rules are present. |
| 18 | PASS | Focused 43/43 and all declared regressions pass; token report stays 1,119/669. |
| 19 | PASS | Implementation stayed inside the allowlist; prohibited resolver/shared/seed/schema files were not changed by P0.8. |

## Regression results

- P0.8 focused: 43/43 PASS.
- P0.7: 51/51 PASS.
- P0.5: 13/13 PASS.
- P0.4: 29/29 PASS.
- Underwriting: 42/42 PASS.
- Payment: 32/32 PASS.
- OTP/UW: 21/21 PASS.
- Product/package continuity: 17/17 PASS.
- Privacy: 29/29 PASS.
- Foundation: 58/58 PASS.
- Manifest, modules, terminology, duplicate components, syntax and diff check: PASS.
- Design tokens: 1,119 errors / 669 warnings; no increase.

## UI/UX and accessibility

- Browser verified:
  - Health mixed results: two approved members plus one member still underwriting;
  - Health need-more-info: correct member and next action `Bổ sung hồ sơ theo yêu cầu`;
  - card switch to `IU-2` persists in URL and updates the detail;
  - absent member premium is not replaced with the family total;
  - Motor one-insured layout omits family total;
  - viewing Created keeps Confirmation & payment as the business-current step.
- Step state includes icon and text in addition to colour.
- Completed selected stage remains completed; the business-current stage remains
  independently amber/current.

## Scope conformance

PASS. No pricing, package selection, underwriting decision, confirmation, payment,
policy, resolver, seed or persistence rule changed.

## Failures for corrective handoff

- Attempt 1: `REFERRED` member with an active supplement request initially mapped
  to generic pending, causing a false “no action” instruction.
- Corrected by prioritising case/member need-more-information evidence, hiding
  technical request IDs and rewriting technical supplement copy.
- Browser and 43/43 focused re-QC passed.

## Reflection record

`.ai/handoffs/completed/REFLECTION-FEATURE-P0-8-SUBMITTED-STAGE-CLARITY.md`

