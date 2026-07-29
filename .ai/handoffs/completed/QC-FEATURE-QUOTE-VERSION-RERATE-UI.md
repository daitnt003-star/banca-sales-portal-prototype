# QC report

Feature: FEATURE-QUOTE-VERSION-RERATE-UI
Reviewer: Codex
Result: PASS

## Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| VERSION-CURRENT | PASS | Bản chào một phiên bản hiển thị badge; nhiều phiên bản hiển thị dropdown và đánh dấu phiên bản hiện tại. |
| VERSION-HISTORY | PASS | Chọn phiên bản cũ chỉ mở bản xem lịch sử; không ghi dữ liệu, không đổi `activeQuoteVersionId`; tải lại trở về phiên bản hiện tại. |
| RERATE-NOTICE | PASS | Cảnh báo inline nêu lý do cần tính phí lại, hệ quả khóa thanh toán và hành động tiếp theo. |
| PERMISSION | PASS | Người có quyền sửa thấy CTA `Tính phí lại`; người chỉ xem vẫn thấy lịch sử nhưng không có hành động làm thay đổi hồ sơ. |
| DATA-COMPATIBILITY | PASS | Ưu tiên `app.quoteVersions[]`, tương thích `app.quote.versions[]` và dữ liệu một phiên bản legacy. |
| PAYMENT-INTEGRITY | PASS | Luồng tính phí lại dùng nguồn chuẩn; không mở rộng hoặc nới lỏng gate thanh toán/thẩm định. |
| ACCESSIBILITY | PASS | Native select giữ accessible name, focus bàn phím và trạng thái được diễn đạt bằng chữ. |
| RESPONSIVE | PASS | 390 px: select rộng 162 px, nằm trong header; 768 px và 1280 px không phát sinh overflow mới. |

## Regression results

- `node --check modules/application-workspace/app-workspace.js`: PASS.
- `node scripts/test-quote-version-ui.js`: 32/32 PASS.
- `node scripts/test-quote-payment-issue.js`: 39/39 PASS.
- `node scripts/test-payment-gate.js`: 32/32 PASS.
- `node scripts/test-demo-stories.js`: 18/18 PASS.
- `node scripts/test-foundation.js`: 58/58 PASS.
- Validators manifest/modules/terminology/duplicate components: PASS.
- `git diff --check`: PASS.
- Design-token report giữ nguyên baseline: 1.156 errors / 687 warnings.

## Browser/UI evidence

- `DRAFT-2026-005`: dropdown V2 hiện tại/V1 đã thay thế; xem V1 chỉ đọc; reload trở về V2.
- `DRAFT-2026-004`: chỉ có badge V1, không hiện dropdown dư thừa.
- Mobile 390×844: lần sửa đầu giữ control trong header nhưng co còn 22 px; lần sửa thứ hai đạt 162 px, đọc và thao tác được.
- Tablet/desktop: control nằm trong header, không tạo overflow tài liệu.

## Residual risk

- Shell mobile legacy vẫn có canvas ngang rộng hơn viewport; control phiên bản mới không phải nguồn gây tràn. Đây là backlog responsive độc lập.
- Design-token validator đang ở report mode với nợ baseline lớn; thay đổi này không làm tăng nợ.

