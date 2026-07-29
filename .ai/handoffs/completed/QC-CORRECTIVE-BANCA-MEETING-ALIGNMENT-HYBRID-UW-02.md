# QC report

Feature: CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02
Reviewer: Codex
Result: FAIL

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| HOME-CUSTOMER-PII | PASS | Browser Home Banca dùng cột `Tham chiếu`, không còn customer name/CIF trong work items. `test-privacy-home.js` 8/8. |
| AGENT-BROKER-REGRESSION | PASS | `test-privacy-home.js` xác nhận Agent/Broker vẫn hiển thị customer context. |
| QUOTE-HEADER | PASS | Browser hiển thị `Quote Workspace · Bản chào` và `Bản chào · nháp`. |
| QUOTE-ORDER | PASS | Browser stepper: Khai báo rủi ro trước Gói & phí. |
| SELECTED-PACKAGE | PASS | Browser chỉ hiển thị selected package ở mức primary; alternatives nằm trong disclosure `Xem phương án khác / thay đổi gói`. |
| OTP-BEFORE-PAYMENT | PASS | `test-payment-gate.js` 32/32 và `test-demo-stories.js` 18/18: Motor/Health/PA STP trước OTP bị khóa, sau OTP mở. |
| HEALTH-HYBRID-REGRESSION | PASS | `test-underwriting-routing.js` 42/42. |
| NON-LIFE-TERMINOLOGY | FAIL | Browser Home vẫn hiển thị `11 yêu cầu chưa nộp`, `yêu cầu cần bổ sung`, `yêu cầu có thể nộp`; trái source-of-truth Bản chào/Báo giá → Hợp đồng. Đây là evidence đã xuất hiện ở QC attempt trước nhưng chưa được loại bỏ. |
| DESIGN-TOKEN-DELTA | NOT_VERIFIABLE | Error count giữ 1.157; warning tăng 687 → 689 do hai `BULKY_INLINE_STYLE`. Không có error-level tăng nhưng contract yêu cầu compare baseline và không tăng relevant violations. |

## Regression results

- Focused/core tests đều PASS.
- Terminology validator PASS nhưng không bắt copy legacy trên Home, chứng tỏ validator coverage còn thiếu.
- Design-token validator report mode: 1.157 errors, 689 warnings.

## UI/UX and accessibility

- Quote selected-package disclosure dùng native `<details>`, có keyboard semantics cơ bản.
- Privacy customer PII trên Home đã sửa.
- Chưa thể duyệt toàn feature khi mental model “yêu cầu chưa nộp” vẫn hiện trên default Banca Home.

## Scope conformance

- Corrective changes nằm trong allowlist.
- Không phát hiện thay đổi mới ngoài scope.

## Failures for corrective handoff

Không phát handoff attempt 3 tự động. Cùng nhóm browser acceptance/terminology đã tồn tại qua attempt 2.

## Reflection record

- Status: `RECURRING_BLOCKER`.
- Cần human/Codex phê duyệt hypothesis mới: mở rộng terminology cleanup có kiểm soát cho Home và bổ sung DOM terminology test, thay vì lặp lại patch theo hypothesis cũ.

