# QC — P0.3 Operational Lists

Status: PASS
Date: 2026-07-28
Owner: Codex

## Business acceptance

- Tư vấn nhanh uses the approved six-column scan order and keeps the selected need, proposal, linked offer, update context and next action visible.
- Bản chào uses six operational columns for the active self scope and retains lifecycle, filter and permission behavior.
- Hợp đồng uses the approved six-column scan order with customer/contract, product, status/next action, effective period, premium and action.
- Every rendered row has at most one primary action.
- Secondary actions are disclosed through the keyboard-operable native `Khác` control where applicable.
- Every record remains reachable through an explicit link; row click is not the only navigation path.
- All table headers use `scope="col"`.

## Automated verification

- `node scripts/test-p0-operational-lists.js`: 46/46 PASS.
- `node scripts/test-p0-page-header-next-action.js`: 30/30 PASS.
- `node scripts/test-quick-advice-navigation.js`: 13/13 PASS.
- Module smoke, terminology (93 assertions), duplicate and diff checks: PASS.
- Design-token audit: 1140 errors / 682 warnings; no increase from the 1141 / 682 baseline.

## Browser verification

Fresh cache-busted pages were checked at the local runtime:

- Tư vấn nhanh: 5 rows, six approved headers, 5/5 direct record links, 3 `Khác` disclosures.
- Bản chào: 11 rows, six approved headers, 11/11 direct record links.
- Hợp đồng: 10 rows, six approved headers, 10/10 direct record links, 8 `Khác` disclosures.
- Native `Khác` disclosure was opened successfully and exposed its secondary action.
- Horizontal overflow remains contained for the wider Tư vấn nhanh table; Bản chào and Hợp đồng fit their holders at the tested desktop viewport.

## Regression boundary

No pricing, underwriting, payment, permission, status, API, seed-data, detail-screen or product/package-continuity rule was changed.

