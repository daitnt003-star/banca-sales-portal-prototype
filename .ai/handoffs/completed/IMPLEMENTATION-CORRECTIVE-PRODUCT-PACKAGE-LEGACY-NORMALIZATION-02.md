# Implementation report — Corrective legacy package normalization 02

Status: RECURRING_BLOCKER
Parent: FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY
Attempt: 2 (final attempt under current hypothesis)
Implementer: Claude

## Implemented correction

- Added `resolvePackageCode(app, extraCandidates)` as the shared resolver.
- The resolver normalizes every overlay/app candidate in precedence order and
  returns the first candidate that resolves to a canonical package.
- Invalid non-empty overlay values no longer stop fallback to valid application
  values.
- Customer selector and Motor/PA/Health quote pages call the same resolver.
- No package is defaulted when all candidates are empty or invalid.

## Deterministic evidence

- Exact regression includes invalid overlay `packageCode`/`selectedPackageId` plus
  PA `app.package = "Standard"` and resolves to `PA_STD`.
- Product/package/quote continuity: PASS, 17/17.
- Syntax checks: PASS.
- Core regressions executed before the final small scope fix:
  advice 21/21, underwriting 42/42, payment 32/32, quote/payment/issue 39/39,
  quote-version UI 32/32, demo stories 18/18 and foundation 58/58.
- Design-token report: 1,153 errors / 685 warnings.
- `git diff --check`: PASS.

## Exact browser failure

Route:

`DRAFT-2026-NEW&step=PACKAGE_AND_QUOTE&new=1`

Observed after attempt 2:

- `.pkg-primary = 0`
- `.pkg-alternatives = 0`
- three `Chọn gói` buttons
- no selected package
- only benefit/exclusion headings from the three unselected cards; fee-detail and
  risk-impact groups absent
- technical alerts remained absent

The browser result repeats the same failure fingerprint despite the deterministic
resolver regression passing. Under the handoff stop rule, no third patch was
applied. The next investigation must use a different hypothesis, such as verifying
the effective runtime application/overlay values and loaded asset version on the
exact route before changing selection logic again.

No commit was created.
