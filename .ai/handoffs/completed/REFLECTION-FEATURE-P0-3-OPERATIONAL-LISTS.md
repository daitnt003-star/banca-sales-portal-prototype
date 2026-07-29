# Reflection — P0.3 Operational Lists

Date: 2026-07-28
Outcome: PASS

## What worked

- A shared visual anatomy improved cross-module scanning while each domain retained its own renderer and business rules.
- Limiting each row to one primary action clarified operational priority without removing valid secondary actions.
- Native `details/summary` supplied a compact, keyboard-accessible disclosure with little implementation risk.
- Explicit record links protected keyboard navigation and made the destination observable.

## Learning

Cross-domain consistency should be enforced through anatomy, tokens and acceptance tests, not through a generic renderer that erases domain differences.

Browser QC must use a fresh cache-busting query after loader-version changes; otherwise a correct implementation can appear stale and produce false negatives.

## Prevention

- Keep deterministic assertions for exact column labels, header scope, direct links and maximum primary-action count.
- Require a loader/cache-version check in every shared UI rollout.
- Continue measuring design-token totals so a UX cleanup cannot silently add inline-style debt.

