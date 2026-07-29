# Corrective handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Parent: FEATURE-OTP-UW-SHARED-PANELS
Attempt: 1

## Evidenced failure

Browser QC tại `APP-2026-HLT2&tab=uw`, insured unit `IU-2`:

- State thực tế: `underwriting.decision = IN_UW`, `paymentAllowed = false`.
- Dữ liệu `conditions[]` chứa ghi chú vận hành
  `Cần hồ sơ y tế bệnh có sẵn (đã nộp) — chờ thẩm định viên`.
- UI lại render dưới `Điều kiện / loại trừ cần khách chấp nhận`, trạng thái
  `Chờ khách chấp nhận` và CTA gửi khách.

Vi phạm acceptance criterion 6 và actor/next-action rule.

## Required correction

- Chỉ map `conditions[]`/`exclusions[]` sang `conditionAcceptance` khi quyết định
  thuộc nhóm đã chấp thuận có điều kiện/phụ phí/loại trừ.
- `IN_UW` phải chỉ hiển thị `Đang thẩm định`; không có condition-acceptance CTA.
- `NEED_MORE_INFO`/`REFERRED` phải map nội dung cần bổ sung sang `requirementList`
  (ưu tiên `additionalDocuments`; dùng dữ liệu bổ sung hiện có nếu đúng semantics).
- `DECLINED` không có CTA gửi điều kiện.
- Bổ sung deterministic assertion cho chính failure này.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `scripts/test-otp-underwriting-panels.js`
- `.ai/handoffs/in-progress/CORRECTIVE-OTP-UW-SEMANTIC-MAPPING-01.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-OTP-UW-SEMANTIC-MAPPING-01.md`

## Files prohibited

- Shared component, seed, resolver, payment gate, handler và mọi file ngoài allowlist.

## Validation

- `node --check modules/application-workspace/app-workspace.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-demo-stories.js`
- `node scripts/validate-design-tokens.js`
- `git diff --check`
- Browser lại `APP-2026-HLT2&tab=uw`: IU-2 không có
  `Chờ khách chấp nhận`/CTA gửi; STP panels không có metadata manual.
