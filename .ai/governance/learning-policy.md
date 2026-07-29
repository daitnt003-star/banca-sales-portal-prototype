# Learning policy

The learning loop improves process controls; it does not silently change product truth.

## Evidence states

- `OBSERVED`: one occurrence.
- `CANDIDATE`: repeated or strongly evidenced.
- `VALIDATED`: prevention succeeded and regression passed.
- `APPROVED`: safe to use as an operating rule.
- `RETIRED`: superseded or no longer effective.

## Safety

- Keep the error ledger append-only.
- Never store secrets, customer PII, tokens, or full sensitive payloads.
- Redact paths or values when they reveal sensitive data.
- Do not promote a lesson from a failed attempt.
- Do not auto-edit business rules, permissions, state models, legal copy, or UX architecture.
- Stop after two unsuccessful attempts using the same hypothesis.
- Require a new hypothesis or human decision for `RECURRING_BLOCKER`.
