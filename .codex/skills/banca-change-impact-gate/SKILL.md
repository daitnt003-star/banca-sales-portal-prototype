---
name: banca-change-impact-gate
description: Phân tích tác động bắt buộc trước mọi thay đổi đối với Banca Sales Portal, gồm code, UI/UX, business rule, state, permission, data, API, cấu hình, tài liệu nguồn, test, kiến trúc hoặc vận hành. Dùng ngay khi người dùng yêu cầu tạo, sửa, xóa, đổi, refactor, khắc phục lỗi hoặc triển khai bất kỳ phần nào của hệ thống; chạy trước bước phản biện, xin approval, đề xuất skill, lập handoff hay chỉnh file.
---

# Banca Change Impact Gate

Đánh giá tác động trước khi cam kết triển khai. Không sửa runtime trong bước này.

## Thiết lập baseline

1. Đọc `AGENTS.md` và các governance file được yêu cầu.
2. Kiểm tra Git status; coi mọi thay đổi không do tác vụ hiện tại tạo ra là tài sản của người dùng.
3. Xác định source of truth theo `.ai/governance/source-of-truth.md`.
4. Mô tả yêu cầu bằng outcome, actor và phạm vi; không đồng nhất giải pháp người dùng nêu với nhu cầu thật.

## Lập bản đồ tác động

Kiểm tra và ghi `có`, `không`, hoặc `chưa rõ` cho từng vùng:

- business rule, state transition và acceptance criteria;
- actor, permission, privacy và dữ liệu nhạy cảm;
- data contract, seed/mock, API, cấu hình và migration;
- module, shared component, dependency và kiến trúc;
- navigation, UI state, UX copy, accessibility và recovery;
- test, regression, demo story, tài liệu và handoff;
- compatibility, vận hành, rollback và rủi ro mất dữ liệu.

Truy vết bằng repository và tài liệu đang hoạt động. Không suy đoán một vùng là không bị ảnh hưởng chỉ vì chưa thấy file liên quan.

## Đánh giá rủi ro

Đánh giá từng tác động theo:

- mức độ: `low`, `medium`, `high`, `critical`;
- khả năng xảy ra: `unlikely`, `possible`, `likely`;
- khả năng phát hiện trước release;
- biện pháp giảm thiểu và bằng chứng kiểm chứng.

Nêu rõ phạm vi file dự kiến, validator cần chạy, regression surface và phương án rollback. Đánh dấu `BLOCKED` nếu thiếu quyết định có thể làm đổi business behavior, permission, state, data contract, kiến trúc hoặc UX flow.

## Kết luận gate

Chỉ trả một trong các quyết định:

- `PROCEED`: tác động đã đủ rõ và rủi ro có kiểm soát;
- `PROCEED_WITH_CONDITIONS`: chỉ tiếp tục khi các điều kiện được đưa vào handoff;
- `REVISE_REQUEST`: nhu cầu hợp lệ nhưng phạm vi hoặc giải pháp cần đổi;
- `DO_NOT_PROCEED`: lợi ích không bù rủi ro, xung đột source of truth, hoặc thay đổi không cần thiết;
- `BLOCKED`: cần người dùng hoặc owner quyết định vấn đề trọng yếu.

Xuất: tóm tắt yêu cầu, source of truth, impact map, rủi ro, phạm vi file, validation, rollback, giả định, câu hỏi mở và quyết định gate. Chuyển kết quả này sang `banca-change-decision-review`; không đề xuất skill thực hiện và không tự động coi `PROCEED` là phê duyệt giải pháp.
