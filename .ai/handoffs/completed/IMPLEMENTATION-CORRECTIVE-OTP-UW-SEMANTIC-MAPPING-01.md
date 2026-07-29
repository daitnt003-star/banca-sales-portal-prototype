# Implementation report — Corrective OTP/UW semantic mapping 01

Status: IMPLEMENTED_PENDING_QC
Parent: FEATURE-OTP-UW-SHARED-PANELS
Attempt: 1
Implementer: Claude

## Corrective outcome

- Health member `conditions[]` and `exclusions[]` are now mapped to customer
  condition acceptance only for approved-with-condition/loading/exclusion decisions.
- `IN_UW` no longer receives customer condition content or a send CTA.
- `NEED_MORE_INFO` and `REFERRED` map `additionalDocuments` to the requirement list
  first, with existing supplementary condition/exclusion text used only as fallback
  while the decision is explicitly in the more-information state.
- Declined and unrelated decisions receive neither condition acceptance nor its CTA.
- No shared component, seed, resolver, payment gate, handler or transition changed.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `scripts/test-otp-underwriting-panels.js`
- `.ai/handoffs/in-progress/CORRECTIVE-OTP-UW-SEMANTIC-MAPPING-01.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-OTP-UW-SEMANTIC-MAPPING-01.md`

## Validation evidence

- JavaScript syntax check: PASS.
- OTP/UW deterministic suite: PASS, 21/21, including the evidenced `IN_UW`
  operational-note regression and more-information fallback boundary.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Demo stories: PASS, 18/18.
- Design-token report unchanged at 1,154 errors / 685 warnings, below baseline.
- `git diff --check`: PASS.

## Browser evidence

- Reopened `APP-2026-HLT2&tab=uw`.
- Three Health underwriting panels rendered.
- No panel rendered `Chờ khách chấp nhận`.
- No panel rendered a customer condition send CTA.
- STP panels exposed no queue/officer/SLA metadata.

## Next action

Codex should rerun independent QC against the original IU-2 failure and confirm the
semantic boundary for conditional, more-information and declined decisions.
No commit was created.
