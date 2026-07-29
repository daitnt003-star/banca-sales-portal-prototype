# Reflection report

Feature: P0.8 Submitted Stage Clarity
Outcome: COMPLETED_AFTER_ONE_CORRECTIVE_ATTEMPT

## Observed error

A Health member with decision `REFERRED` and an active medical-record request was
presented as `Đang thẩm định`, causing the summary to instruct the RM that no
action was required.

## Fingerprint

`b3578f3f6ececf90`

## Root cause and evidence

- Trigger: browser smoke on a real need-more-information Health fixture.
- Proximate defect: `REFERRED` was grouped with generic pending.
- Enabling gap: initial tests asserted the existence of a need-more branch but did
  not bind it to the actual HLT6 data combination.
- Root cause: presentation normalization evaluated member decision wording without
  giving priority to case-level supplement evidence.

## Attempts

1. Prioritised canonical case need-more-information and member supplement evidence,
   mapped the affected member to `Cần bổ sung`, and added HLT6-specific regression.

## Successful prevention

- HLT6 now asserts current state, next action and affected-member state.
- Active supplement UI no longer exposes request IDs or “technical supplement”
  wording.
- Browser and deterministic regression both passed after correction.
- Learning store validation passed; no matching recurring fingerprint exists.

## Lesson status

VALIDATED
