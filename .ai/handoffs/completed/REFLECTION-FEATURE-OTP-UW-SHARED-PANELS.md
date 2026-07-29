# Reflection report

Feature: FEATURE-OTP-UW-SHARED-PANELS
Outcome: VALIDATED

## Root-cause trace

- Trigger: browser QC trên Health member đang `IN_UW`.
- Proximate defect: adapter map mọi `underwriting.conditions[]` sang
  `conditionAcceptance`, không xét decision.
- Enabling process gap: test ban đầu xác nhận component adoption nhưng chưa phân biệt
  semantics của cùng field `conditions[]` giữa trạng thái đang xử lý và quyết định đã duyệt.
- Root cause: thiếu decision gate tại page adapter làm sai actor và next action.
- Falsifiable hypothesis: chỉ cho phép customer-condition block ở nhóm quyết định đã
  chấp thuận có điều kiện/phụ phí/loại trừ sẽ loại CTA sai mà không ảnh hưởng STP,
  need-more-info hoặc payment gate.
- Result: hypothesis confirmed; browser reproduction hết lỗi và regression PASS.

## Preventive control

- Mapping từ domain data sang shared panel phải gate theo decision semantics, không
  chỉ theo tên field.
- Mọi actionable condition phải kiểm tra đúng actor trước khi render CTA.
- Deterministic test phải có một case `IN_UW` chứa operational note và khẳng định
  không render customer-condition acceptance.

## Learning state

- Ledger record: `2e3b6391-6776-484a-8223-133f72ae3f46`.
- Rule: `UNDERWRITING_OPERATIONAL_NOTES_MUST_NOT_BECOME_CUSTOMER_CONDITIONS`.
- State: `VALIDATED`.
- Không tự động thay đổi business rule, state model hoặc UX architecture.
