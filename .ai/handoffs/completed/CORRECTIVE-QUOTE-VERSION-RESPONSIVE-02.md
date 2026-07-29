# Corrective handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Feature: FEATURE-QUOTE-VERSION-RERATE-UI
Attempt: 2

## Evidenced failure

Attempt 1 giữ select trong `ws-summary`, nhưng Codex browser QC tại 390×844 đo:

- `select.right <= header.right`: PASS.
- `select.width = 22 px`: FAIL usability/readability.

Option text bị co chỉ còn vùng mũi tên, trái yêu cầu “không che/cắt option text bằng
fixed width không responsive” và mục tiêu người dùng phải nhận biết phiên bản hiện hành.

## Required correction

- Tổ chức label + select thành một hàng/khối riêng có thể wrap trong title header.
- Ở 390×844, select phải:
  - nằm trong `ws-summary`;
  - hiển thị đọc được ít nhất nội dung phiên bản hiện hành, không chỉ mũi tên;
  - có rendered width tối thiểu 160 px trong browser QC.
- Ở 768×1024 và desktop, không làm header overflow.
- Được dùng layout grid/flex và token hiện có; không thêm drawer/modal, raw visual
  value vào runtime hoặc sửa overflow pre-existing ngoài control.
- Giữ nguyên toàn bộ behavior/accessibility/version integrity.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `scripts/test-quote-version-ui.js`
- `.ai/handoffs/in-progress/CORRECTIVE-QUOTE-VERSION-RESPONSIVE-02.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-QUOTE-VERSION-RESPONSIVE-02.md`

## Acceptance evidence

1. Browser 390×844: `select.width >= 160` và `select.right <= ws-summary.right`.
2. Browser 768×1024/desktop: không overflow mới.
3. Accessible label, native select, preview/reload/single badge PASS.
4. P1 regression và token baseline 1.156/687 PASS.
