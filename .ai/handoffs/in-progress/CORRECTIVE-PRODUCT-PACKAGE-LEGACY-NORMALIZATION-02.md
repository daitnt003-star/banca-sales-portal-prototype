# Corrective handoff

Status: RECURRING_BLOCKER
Owner: Codex
Implementer: Claude
Parent: FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY
Attempt: 2

## Repeated failure fingerprint

Rule: `PACKAGE_SELECTION_MUST_RESOLVE_FIRST_VALID_CANONICAL_CANDIDATE`
Module: application-workspace / sales-context-offer
Component: package selection adapter
Cause hypothesis: precedence stops at first non-empty legacy value even when it
cannot normalize.

## Evidence after attempt 1

Browser reload trên `DRAFT-2026-NEW&step=PACKAGE_AND_QUOTE&new=1` vẫn cho:

- `pkg-primary = 0`
- `pkg-alternatives = 0`
- ba package cùng có CTA `Chọn gói`

Header vẫn có `app.package = Standard`. Code `sel(app)` chọn một giá trị duy nhất
theo `o.packageCode || o.package || o.selectedPackageId || app...`; nếu overlay
candidate legacy đầu tiên không resolve, adapter trả `null` và không thử
`app.package`.

## Required correction

- Tạo resolver nhận danh sách candidate theo thứ tự:
  overlay canonical/legacy fields, app canonical/legacy fields.
- Normalize từng candidate; chọn **candidate đầu tiên resolve thành canonical**.
- Không dừng tại candidate non-empty nhưng invalid.
- Không default nếu không candidate nào resolve.
- Cả customer selector và quote page phải dùng cùng resolver.
- Test phải tạo:
  - overlay có `packageCode`/`selectedPackageId` legacy hoặc unknown;
  - app có `package = Standard`;
  - kết quả PA là `PA_STD`;
  - primary = 1, alternatives = 1 và đủ bốn content groups.

## Files allowed

- `shared/components/sales-context-offer.js`
- `modules/application-workspace/app-workspace.js`
- `scripts/test-product-package-quote-continuity.js`
- `.ai/handoffs/in-progress/CORRECTIVE-PRODUCT-PACKAGE-LEGACY-NORMALIZATION-02.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-PRODUCT-PACKAGE-LEGACY-NORMALIZATION-02.md`

## Files prohibited

- Seeds, rating, journey, payment, CSS/token và mọi file ngoài allowlist.

## Validation

- Declared feature tests and core regression.
- Browser exact route must show:
  `pkg-primary = 1`, `pkg-alternatives = 1`, selected `PA Tiêu chuẩn`,
  four content groups and zero technical alerts.

## Stop rule

Nếu exact browser reproduction vẫn fail sau attempt 2, trả
`RECURRING_BLOCKER`; không áp dụng patch thứ ba theo giả thuyết này.
