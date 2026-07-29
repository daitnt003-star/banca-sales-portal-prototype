# Reflection report

Feature: FEATURE-QUOTE-VERSION-RERATE-UI
Outcome: VALIDATED

## Root-cause trace

- Trigger: QC responsive lần đầu phát hiện dropdown phiên bản tràn khỏi header tại 390 px.
- Corrective attempt 1: control đã nằm trong header nhưng chiều rộng co còn 22 px, đạt containment nhưng không đạt usability.
- Root cause: tiêu chí kiểm tra ban đầu chỉ đo tọa độ containment, chưa đặt ngưỡng chiều rộng đọc/thao tác tối thiểu.
- Corrective attempt 2: dùng spacing token hiện có để bảo đảm control rộng tối thiểu tương đương 160 px; kết quả thực đo 162 px.
- Smallest preventive control: mọi control responsive phải đồng thời đạt containment và readable/operable size; không chấp nhận chỉ vì không vượt biên.

## Evidence

- Browser 390×844: attempt 1 = 22 px (FAIL usability); attempt 2 = 162 px (PASS), nằm trong header.
- Browser 768×1024 và 1280×800: nằm trong header, không phát sinh document overflow.
- `test-quote-version-ui.js`: 32/32 PASS sau corrective attempt 2.
- Core/payment regressions và repo validators: PASS.

## Learning state

- Ledger record: `3cbdfbab-95c7-4101-8780-856ccf4ed075`.
- Rule: `RESPONSIVE_CONTROL_MUST_BE_READABLE_NOT_JUST_CONTAINED`.
- State: `VALIDATED`.
- Bài học thuộc UI/UX QC; không thay đổi business rule hoặc source of truth.
