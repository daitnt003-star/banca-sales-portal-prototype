# Reflection report

Feature: CORRECTIVE-HOME-QUOTE-TERMINOLOGY-03
Outcome: VALIDATED

## Root-cause trace

- Trigger: QC browser attempt 2 vẫn thấy copy legacy trên Home.
- Proximate defect: Home dùng “yêu cầu” làm object chính tại subtitle, action queue và
  section/table.
- Enabling process gap: validator terminology tĩnh PASS nhưng không khẳng định copy
  cuối cùng sau khi template được render theo channel.
- Root cause supported by evidence: browser acceptance coverage của Home chưa đưa
  terminology vào assertion; attempt trước chỉ bao phủ privacy và OTP.
- Smallest preventive control: thêm assertion copy trên DOM render cho cả
  `BANCA_INTEGRATED` và `AGENT_BROKER`.

## Evidence

- Browser: không còn năm cụm legacy; object Bản chào xuất hiện; không lộ customer PII.
- `test-privacy-home.js`: 28/28 PASS.
- Design-token: 1.157/689 → 1.156/687.
- Core regression: 58/58 PASS; validators manifest/modules/duplicate/terminology PASS.

## Learning state

- Ledger record: `12388818-960a-4940-b7ac-eac53de7fa62`.
- Rule: `HOME_QUOTE_TERMINOLOGY_DOM_COVERAGE`.
- State: `VALIDATED`.
- Không tự động promote thành business/terminology rule `APPROVED`; source-of-truth
  vẫn thuộc product docs và cần review nếu muốn thay đổi.
