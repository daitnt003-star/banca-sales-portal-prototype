# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: FEATURE-ADVICE-PRODUCT-PACKAGE-BANCA-CONVERSION
Implementer: Claude

## Files changed

- `modules/advisory-workspace/index.html`
  - Nối màn Gợi ý sang renderer tuần tự product → package.
  - Thêm reset selection, same-product compare guard, disabled compare, product/
    package loading-empty-error-permission recovery.
  - Tách quyết định chuyển đổi theo channel; Banca integrated có context đi thẳng
    xác nhận, thiếu context bị chặn và không mở customer list.
  - Gate tên/CIF theo `CustomerDataAccessStage`.
  - Thêm attach not-found/permission recovery và chống double-submit/failure retry.
- `shared/mock/seed/advice-sessions.js`
  - Thêm pure `BANCA.adviceSelection` contract cho product/package/compare/reset và
    reload/legacy normalization.
  - Thêm `BANCA.adviceConversionDecision` để cô lập nhánh channel.
- `scripts/test-advice-product-package-hierarchy.js`
  - Regression deterministic cho hierarchy DOM, state reset, canonical offer,
    same-product compare, legacy/stale recovery và channel isolation.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-ADVICE-PRODUCT-PACKAGE-BANCA-CONVERSION.md`
  - Báo cáo implementation này.

Không sửa các blocked continuity handoff hoặc file prohibited.

## Acceptance criteria evidence

1. Rendered DOM ban đầu chỉ có “Sản phẩm phù hợp với nhu cầu”; không có Basic/Fit.
2. Sau chọn product, DOM mới có “Gói đề nghị của [sản phẩm]”, package và Fit.
3. Pure state test xác nhận dưới hai gói chưa đủ compare và cross-product ref bị từ
   chối.
4. Đổi product xóa package, selectedOffer, selectedPlan, compareSet và premium state.
5. Chọn package tạo một canonical `selectedOffer` có product/package và
   recommendationVersion.
6. `BANCA_INTEGRATED` có external/customer ref trả action `CONFIRM`; UI không gọi
   attach modal.
7. `BANCA_INTEGRATED` thiếu ref trả `BLOCK_MISSING_BANCA_CONTEXT`, có lý do và CTA
   quay lại hệ thống ngân hàng, không fallback customer list.
8. Standalone thiếu context trả `ATTACH_CUSTOMER`; attach success/cancel/
   not-found/no-permission giữ nhánh hiện hành và có recovery.
9. Kết quả và modal xác nhận chỉ render tên/CIF khi
   `BANCA.dataAccess.canShowPII(accessStage)` cho phép.
10. Legacy selectedOffer suy ra selectedProductId và giữ package; compare cũ được
    canonicalize/filter; stale selection bị loại mà không auto-map.
11. Reuse button/card/modal/drawer/focus trap hiện hành; tablet/reduced-motion CSS
    hiện hữu không đổi.
12. Design-token toàn dự án giữ baseline 1153 errors / 685 warnings; advisory
    workspace giữ 125 violations. Advice outcome PASS.
13. Product/package renderer có observable loading, empty, error, unavailable và
    retry/back recovery.
14. Submit button khóa khi request đang chạy; lần gửi lặp bị chặn; exception giữ
    selection và bật “Thử lại bàn giao”.
15. Non-Banca attachment có success, cancel, not-found/permission và create-
    permission guards.

## Validation results

- `node scripts/test-advice-product-package-hierarchy.js` — PASS, 29/29.
- `node scripts/test-advice-outcome.js` — PASS, 21/21.
- `node scripts/validate-design-tokens.js` — PASS (report mode),
  1153 errors / 685 warnings; advisory workspace 125.
- `node scripts/validate-terminology.js` — PASS, quét 93 files.
- `node scripts/detect-duplicate-components.js` — PASS,
  `DUPLICATE_COMPONENT_SCAN_OK`.
- Inline advisory script compile check — PASS,
  `ADVISORY_INLINE_SCRIPT_SYNTAX_OK`.
- `git diff --check` trên ba file implementation — PASS.
- Browser smoke — chưa chạy trong sandbox do không có project server truy cập được;
  cần Codex QC smoke các scenario được liệt kê trong ready handoff.

## UI/UX safety check

- Dùng progressive disclosure đúng user flow; không tự chọn product/package.
- Product tier không hiển thị package hoặc Fit; Fit chỉ ở package tier.
- Compare drawer/focus trap/Escape/focus return hiện hữu được tái sử dụng.
- Không thêm token hoặc giá trị thị giác mới; violation count không tăng.
- Error/empty/loading/unavailable/disabled/recovery đều có copy và action quan sát
  được.

## Assumptions used

- Customer context hợp lệ cho Banca được xác định bằng
  `externalCustomerRef || customerRef`; reference không tự cấp quyền xem PII.
- `customerName` là context đủ cho prospect ở non-Banca, nhưng không đủ để vượt
  Banca integrated missing-reference gate.
- Route thành công tiếp tục dùng application workspace hiện hành từ implementation
  cũ.
- Catalog synchronous dùng state flags để render deterministic loading/load-error
  prototype states mà không tạo API contract mới.

## Errors encountered and resolved

- Lần chạy design-token đầu sau patch tăng một `BULKY_INLINE_STYLE` warning do
  action row của missing-context modal. Đã tái dùng `adv-chips`; hậu kiểm trở về
  đúng baseline 1153/685.
- Không có failure trong regression test hoặc advice-outcome.

## Remaining risks

- Browser smoke desktop/tablet và focus behavior cần final QC trong môi trường có
  local server.
- Renderer cũ `bodyRecommend` vẫn tồn tại để tránh xóa rộng trên một file đang có
  unrelated dirty changes, nhưng không còn được `stepBody()` gọi. Runtime và test
  chỉ dùng `bodyRecommendHierarchy`.
- Reflection ledger nằm ngoài allowlist; Codex final-QC owner cần hoàn tất
  reflection theo governance.
