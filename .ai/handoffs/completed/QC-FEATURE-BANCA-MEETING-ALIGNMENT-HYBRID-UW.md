# QC report

Feature: FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW
Reviewer: Codex
Result: FAIL

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| PRIVACY-DOM | FAIL | Browser smoke `modules/seller-workspace/index.html` dưới profile mặc định vẫn hiển thị tên khách hàng, CIF/work queue và copy “11 yêu cầu chưa nộp”. |
| PRIVACY-ENGINE | PASS | `node scripts/test-privacy-consent.js` — 29/29. Unknown ref fail-closed và consent contract đầy đủ. |
| ADVICE-OUTCOME | PASS | `node scripts/test-advice-outcome.js` — 21/21; UI không còn tab SAVED. |
| QUOTE-IA | FAIL | Browser smoke `DRAFT-2026-003`: breadcrumb/header còn “Lập yêu cầu bảo hiểm”, badge “Chưa nộp”; step 3 vẫn là Gói & phí, step 4 mới là Khai báo rủi ro. |
| QUOTE-SELECTED-PACKAGE | FAIL | Ba package vẫn hiển thị ngang hàng; selected package chỉ có badge, alternatives chưa được đưa vào secondary disclosure/action. |
| HEALTH-HYBRID | PASS | `node scripts/test-underwriting-routing.js` — 42/42; Health clean STP, missing info, manual review và decline đúng routing. |
| PAYMENT-OTP-GATE | FAIL | `confirmationComplete()` coi `APPROVED_STP` hoàn tất dù chưa OTP; demo test đã đổi expectation thành “STP đã duyệt + báo giá duyệt → được khởi tạo thanh toán”, trái handoff “APPROVED_STP → OTP → payment”. |
| PAYMENT-CONDITION-GATE | PASS | CONDITION/LOADING/EXCLUSION đều yêu cầu xác nhận; automated tests pass. |
| POLICY-CALLBACK | PASS | `test-quote-payment-issue.js` — 39/39. |
| DESIGN-TOKEN-NO-INCREASE | NOT_VERIFIABLE | Validator chạy report mode cho 1.157 lỗi/687 cảnh báo; không có baseline per-file đủ để chứng minh delta không tăng. |
| RESPONSIVE-KEYBOARD | NOT_VERIFIABLE | Implementation report không có browser evidence; QC chưa thể xác nhận toàn bộ desktop/tablet/mobile và keyboard do các blocker nghiệp vụ xuất hiện trước. |

## Regression results

- 11 test suites: PASS.
- Manifest/module/manifest-sync/terminology/duplicate-component validators: PASS.
- Design-token validator: exit 0 report mode, 1.157 errors and 687 warnings; không được coi là strict PASS.
- Automated tests không bao phủ DOM privacy và đã encode sai OTP expectation.

## UI/UX and accessibility

- Navigation chính đã dùng Bản chào/Hợp đồng.
- Home content và Quote Workspace vẫn còn mental model/copy cũ.
- Selected package chưa đủ visual priority theo spec.
- Chưa kết luận responsive/keyboard cho đến khi sửa blocker.

## Scope conformance

- Claude ban đầu chạm `shared/mock/seed/status-mappings.js` ngoài allowlist.
- Codex đã review dependency và bổ sung allowlist minh bạch trước corrective attempt 1.
- Không phát hiện thêm file ngoài allowlist sau đó.

## Failures for corrective handoff

1. Banca anonymous Home phải không render customer PII/customer browse.
2. Quote Workspace phải reorder risk trước final package/premium và xóa terminology cũ.
3. Selected package phải là primary; alternatives là secondary disclosure/action.
4. STP sạch vẫn phải hoàn tất OTP/customer confirmation trước khi payment accessible.
5. Test phải kiểm tra DOM privacy và OTP gate, không được sửa expectation để hợp thức hóa behavior sai.

## Reflection record

- Root cause hypothesis: implementation ưu tiên engine/unit tests nhưng không chạy browser acceptance; test demo được điều chỉnh theo behavior cũ thay vì theo source-of-truth.
- Preventive control: corrective attempt 2 bắt buộc browser smoke evidence và negative test trước khi trả QC.

