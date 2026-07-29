# QC report

Feature: P0.6 Unified Table Action Column
Reviewer: Codex
Result: PASS

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| 1 | PASS | Quick, Quote, Policy, Seller and Team browser pages expose shared `.table-action-cell` and `.table-action-stack`. |
| 2 | PASS | Every sampled visible direct control measured 144×34px at desktop; existing coarse-pointer CSS retains 44px minimum. |
| 3 | PASS | Multi-action stacks render at distinct vertical Y positions with equal 144×34 geometry; main action precedes “Khác”. |
| 4 | PASS | Quick and Policy row height remains 95px before/after opening native disclosure; Team row also remains 95px. |
| 5 | PASS | Quick/Policy/Team menus compute `position:absolute`; document scroll height does not change for native menus. |
| 6 | PASS | Quote rows use 144×34 controls and retain existing CTA labels/destinations through unchanged action resolution. |
| 7 | PASS | Seller work queue/recent drafts and Team member/case/risk/task outputs use the shared vertical stack. |
| 8 | PASS | Formal action headers are visible; focused test confirms audit-event “Hành động” remains data. |
| 9 | PASS | Operational List last columns retain sticky behavior; Seller/Team were not made sticky. |
| 10 | PASS | Static/deterministic tests and implementation diff confirm no action, permission, label or destination change. |
| 11 | PASS | Browser and tests cover single, main+more, only-more and empty fixed-width states without fabricated actions. |
| 12 | PASS | Native Summary and Team button receive focus and open/close their overlays. |
| 13 | PASS | Table overflow remains contained; controls do not wrap or vary by label. |
| 14 | PASS | P0.3, P0.1, Home Work Queue and privacy regressions pass. |
| 15 | PASS | Token result 1119 errors / 669 warnings, below baseline 1122 / 670. |
| 16 | PASS | Implementation report and diff inspection show changes confined to the corrected allowlist. |

## Regression results

- P0.6 focused test: 17/17 PASS.
- P0.3 Operational Lists: 46/46 PASS.
- P0.1 PageHeader/NextAction: 30/30 PASS.
- Home Work Queue: 34/34 PASS.
- Privacy Home: 28/28 PASS.
- Privacy/consent: 29/29 PASS.
- Module, terminology (93 files), duplicate-component and diff checks: PASS.

## UI/UX and accessibility

- All five page families compute a one-column grid of 144px.
- Direct controls share 34px height and visible focus behavior.
- Quick/Policy native `details/summary` and Team overflow trigger open without changing row height.
- Screenshot reviewed on Team member table with an open overlay menu; action controls remain aligned and the menu does not push adjacent rows.
- Existing Operational List sticky action-column behavior remains intact.

## Scope conformance

- No Application Workspace, document/OCR action, modal/form/card action bar, business resolver, permission, state, data, pricing, underwriting, payment, API or seed change.

## Failures for corrective handoff

None.

## Reflection record

See `.ai/handoffs/completed/REFLECTION-FEATURE-P0-6-UNIFIED-TABLE-ACTION-COLUMN.md`.

