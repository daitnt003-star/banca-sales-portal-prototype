# Corrective handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Feature: FEATURE-QUOTE-VERSION-RERATE-UI
Attempt: 1

## Evidenced failure

Browser QC tại viewport 390×844, route:

```text
modules/application-workspace/index.html?id=DRAFT-2026-005&step=PACKAGE_AND_QUOTE
```

Đo được:

- `clientWidth = 382`
- `ws-summary.right = 354`
- `quote-version-select.right = 391.58`
- select vượt mép header khoảng 37.6 px và vượt viewport khoảng 9.6 px.

Trang có overflow hẹp pre-existing (`scrollWidth = 495`), nhưng control mới tự vượt
container nên vẫn FAIL acceptance “control wrap, không tạo overflow mới”.

## Required correction

- Chỉ sửa layout của label/select version trong header.
- Native select phải nằm hoàn toàn trong `ws-summary` tại 390×844 và 768×1024.
- Giữ accessible label, option text, native keyboard, single-version badge và mọi
  behavior/version integrity hiện tại.
- Dùng flex/min-width/max-width và token hiện có; không thêm breakpoint, raw pixel,
  drawer hoặc component mới.
- Không che/cắt option text bằng fixed width không responsive.
- Không xử lý overflow pre-existing ở block khác.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `scripts/test-quote-version-ui.js`
- `.ai/handoffs/in-progress/CORRECTIVE-QUOTE-VERSION-RESPONSIVE-01.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-QUOTE-VERSION-RESPONSIVE-01.md`

## Acceptance evidence

1. `select.right <= ws-summary.right` tại 390×844 và 768×1024.
2. Select vẫn có `aria-label="Chọn phiên bản Bản chào"`.
3. Multi-version preview/reload và single-version badge không regression.
4. `test-quote-version-ui.js` và toàn bộ validation P1 PASS.
5. Design-token không tăng trên baseline 1.156/687.
