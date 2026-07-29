# Implementation report — Corrective legacy package normalization 01

Status: IMPLEMENTED_PENDING_QC
Parent: FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY
Attempt: 1
Implementer: Claude

## Corrective outcome

- Added a product-scoped package normalization adapter that resolves canonical
  codes, canonical names, generic legacy labels and legacy selector ids.
- PA mappings include Basic/Cơ bản, Standard/Tiêu chuẩn and Premium/Plus/Nâng cao
  to `PA_BASIC`, `PA_STD` and `PA_PLUS`.
- Equivalent Motor and Health aliases resolve to their actual canonical catalogs.
- Customer-stage selection and quote-stage primary selection use the same adapter.
- `null`, empty and unknown values remain unselected; no recommended/default package
  is silently persisted or rendered as selected.
- No seed, rating, journey, payment, CSS or token source changed.

## Exact regression

The deterministic case uses:

- `productId = "pa"`
- `app.package = "Standard"`

It verifies that the selected customer-stage radio is canonical `PA_STD`, the quote
workspace normalizes before selecting its primary card, alternatives remain under
the existing disclosure and the four quote content groups remain present.

## Validation

- Runtime syntax checks: PASS.
- Product/package/quote continuity: PASS, 17/17.
- Advice outcome: PASS, 21/21.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Design tokens: 1,153 errors / 685 warnings, within baseline.
- `git diff --check`: PASS.

## Browser/QC handoff

The exact shared browser draft context is intentionally left for independent QC
because recreating `app.package = "Standard"` through production UI would first
canonicalize it and no longer reproduce the legacy payload. QC should reopen the
reported existing route:

`DRAFT-2026-NEW&step=PACKAGE_AND_QUOTE&new=1`

Expected result: one `.pkg-primary`, one `.pkg-alternatives`, selected
`PA Tiêu chuẩn`, and all four content groups.

No commit was created.
