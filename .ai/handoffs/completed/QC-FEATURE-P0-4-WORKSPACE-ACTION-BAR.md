# QC report

Feature: P0.4 Workspace Action Bar
Reviewer: Codex
Result: PASS

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| 1 | PASS | Draft Review at desktop renders previous and submit controls in the same grid; both measure 164.875 × 40px. |
| 2 | PASS | Runtime CSS contains the approved `@media (max-width: 960px)` one-column/full-width rules; focused deterministic assertion passes. |
| 3 | PASS | Browser and deterministic test find exactly one `#submit-btn`, located in the action bar. |
| 4 | PASS | Submit starts disabled with “Cần tick đủ 2 xác nhận”, enables after both checks, and restores the disabled reason when one is unchecked. |
| 5 | PASS | Submitted states render at most one primary action and a native `details/summary` “Khác”. |
| 6 | PASS | Existing `getSubmittedCaseActions()` remains the source; continuity/UW/payment regressions pass. |
| 7 | PASS | Issued seller keeps contract actions; BM-01 has zero primary action and only “Xem hợp đồng” under “Khác”. |
| 8 | PASS | Browser smoke renders Motor, PA and Health draft, plus Motor/Health submitted records, without error. |
| 9 | PASS | “Khác” opens, remains focused on `SUMMARY`, and exposes “Xem lịch sử”. Existing focus ring is retained. |
| 10 | PASS | Token report is 1139 errors / 681 warnings, below baseline 1140 / 682. |
| 11 | PASS | Implementation report and diff inspection show runtime/test changes confined to the corrected allowlist. |

## Regression results

- `node scripts/test-p0-workspace-action-bar.js`: 29/29 PASS.
- `node scripts/test-p0-page-header-next-action.js`: 30/30 PASS.
- `node scripts/test-product-package-quote-continuity.js`: 17/17 PASS.
- `node scripts/test-underwriting-routing.js`: 42/42 PASS.
- `node scripts/test-payment-gate.js`: 32/32 PASS.
- `node scripts/test-privacy-consent.js`: 29/29 PASS.
- Module, terminology (93 files) and duplicate-component validation: PASS.

## UI/UX and accessibility

- Desktop draft controls measured equal width and height.
- Submitted command groups measured equal width and 34px height across pending, conditional, payment and issued states.
- Native disclosure opens and keeps keyboard focus.
- Responsive behavior is covered by the live stylesheet rule and deterministic validation. Direct narrow-viewport resizing was unavailable in the connected browser surface.
- Screenshot inspected against the existing enterprise shell: primary action is singular and visually dominant; command row remains compact under the case summary.

## Scope conformance

- No business resolver, seed, product, journey, pricing, underwriting, confirmation, payment or API contract was changed by P0.4.
- Corrective allowlist expansion affected only the P0.1 shared-cache-version assertion.

## Failures for corrective handoff

None.

## Reflection record

See `.ai/handoffs/completed/REFLECTION-FEATURE-P0-4-WORKSPACE-ACTION-BAR.md`.

