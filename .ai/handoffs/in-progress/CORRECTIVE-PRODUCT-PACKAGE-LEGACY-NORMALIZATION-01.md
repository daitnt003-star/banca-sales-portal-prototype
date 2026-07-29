# Corrective handoff

Status: COMPLETED_NOT_ACCEPTED
Owner: Codex
Implementer: Claude
Parent: FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY
Attempt: 1

## Evidenced failure

Browser QC trên đúng route người dùng phản ánh:
`DRAFT-2026-NEW&step=PACKAGE_AND_QUOTE&new=1`.

- Hồ sơ chuyển từ Tư vấn nhanh lưu `app.package = "Standard"`.
- Canonical PA package dùng `PA_STD` / `PA Tiêu chuẩn`.
- UI không resolve legacy value, nên `selectedCards = 0`, `pkg-primary = 0`,
  alternatives disclosure = 0 và vẫn render các package ngang hàng.

Vi phạm acceptance 2, 3 và mục tiêu continuity.

## Required correction

- Thêm adapter normalize package value theo từng product từ:
  canonical code, canonical name, legacy generic label/name và
  `selectedPackageId` cũ sang canonical code.
- Tối thiểu cover:
  - PA: Basic/Cơ bản → `PA_BASIC`; Standard/Tiêu chuẩn → `PA_STD`;
    Premium/Plus/Nâng cao → `PA_PLUS`.
  - Health và Motor: resolve tương đương theo canonical catalog thực tế.
- Khi resolve thành công, render selected primary ngay; có thể persist canonical
  fields để reload tiếp theo ổn định.
- Không chọn ngầm package khi hồ sơ thật sự chưa có lựa chọn.
- Thêm deterministic regression dùng `app.package = "Standard"` cho PA và xác nhận
  primary `PA_STD`, alternatives collapsed, đủ bốn content groups.

## Files allowed

- `shared/components/sales-context-offer.js`
- `modules/application-workspace/app-workspace.js`
- `scripts/test-product-package-quote-continuity.js`
- `.ai/handoffs/in-progress/CORRECTIVE-PRODUCT-PACKAGE-LEGACY-NORMALIZATION-01.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-PRODUCT-PACKAGE-LEGACY-NORMALIZATION-01.md`

## Files prohibited

- Seeds, rating, journey, payment, CSS/token và mọi file ngoài allowlist.

## Validation

- `node --check` hai runtime files.
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-advice-outcome.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/validate-design-tokens.js`
- `git diff --check`
- Browser lại `DRAFT-2026-NEW&step=PACKAGE_AND_QUOTE&new=1`:
  một `pkg-primary`, một alternatives disclosure, selected PA Tiêu chuẩn và đủ
  bốn nhóm nội dung.
