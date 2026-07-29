---
name: banca-change-decision-review
description: Phản biện tính đúng đắn, cần thiết và phù hợp của mọi yêu cầu thay đổi Banca Sales Portal sau khi đã phân tích impact, rồi dừng để xin người dùng phê duyệt. Dùng cho mọi yêu cầu tạo, sửa, xóa, đổi, refactor, fix hoặc triển khai code, UI/UX, business rule, state, permission, data, API, cấu hình, tài liệu nguồn, test hay kiến trúc; bắt buộc trước khi đề xuất skill, tạo handoff hoặc thực thi thay đổi.
---

# Banca Change Decision Review

Đóng vai trò decision owner. Tôn trọng mục tiêu của người dùng nhưng không mặc định giải pháp họ nêu là đúng hoặc bắt buộc phải triển khai.

## Đầu vào bắt buộc

Đọc kết quả từ `banca-change-impact-gate`, source of truth liên quan và bằng chứng trong repository. Nếu impact gate chưa chạy, dừng và chạy gate đó trước.

## Phản biện yêu cầu

Kiểm tra:

1. Vấn đề có thật và có bằng chứng hay chỉ là giả định?
2. Outcome có phù hợp source of truth, actor và hành trình nghiệp vụ?
3. Thay đổi có cần thiết, đúng thời điểm và đúng phạm vi?
4. Giải pháp được yêu cầu có xử lý nguyên nhân gốc hay chỉ che triệu chứng?
5. Có làm sai business rule, permission, state, data ownership, UX hoặc kiến trúc không?
6. Có tạo trùng lặp, coupling, ngoại lệ riêng, nợ kỹ thuật hoặc regression không?
7. Có phương án nhỏ hơn, cấu hình hóa, tái sử dụng hoặc không cần thay đổi nào tốt hơn không?

Tách rõ:

- `facts`: được source of truth hoặc code chứng minh;
- `assumptions`: hợp lý nhưng chưa được chứng minh;
- `conflicts`: mâu thuẫn cần xử lý;
- `unknowns`: thiếu thông tin có thể đổi quyết định.

Không tạo phản biện giả để hợp thức hóa yêu cầu. Không bác bỏ chỉ vì implementation khó.

## So sánh phương án

Luôn xem xét ít nhất:

- phương án người dùng đề xuất;
- phương án thay đổi tối thiểu hoặc tái sử dụng;
- phương án không thay đổi, nếu khả thi.

So sánh theo: mức đáp ứng outcome, tính đúng nghiệp vụ, tác động UX, rủi ro, phạm vi regression, chi phí duy trì, reversibility và bằng chứng kiểm thử. Chỉ đề xuất thêm phương án khi nó thực sự khác biệt.

## Ra quyết định

Chọn một:

- `ACCEPT`: giải pháp đúng và cân bằng nhất;
- `ACCEPT_WITH_CHANGES`: giữ mục tiêu nhưng sửa phạm vi hoặc cách làm;
- `RECOMMEND_ALTERNATIVE`: chọn phương án khác và giải thích trade-off;
- `REJECT`: không nên thực hiện, kèm bằng chứng và tác hại;
- `NEEDS_DECISION`: có lựa chọn business, legal, permission, data hoặc UX mà Codex không được tự quyết.

Ưu tiên recommendation rõ ràng, không chỉ liệt kê lựa chọn. Nếu quyết định khác yêu cầu ban đầu, nêu phần vẫn giữ, phần thay đổi và lý do.

Không chuyển trực tiếp sang requirement gate, handoff hoặc implementation, kể cả khi verdict là `ACCEPT`.

Xuất: verdict, facts/assumptions/conflicts/unknowns, bảng so sánh phương án, recommendation, điều kiện chấp thuận và acceptance evidence. Sau đó:

1. Đặt trạng thái `AWAITING_USER_APPROVAL`.
2. Yêu cầu người dùng approve rõ recommendation hoặc chỉ định phương án khác.
3. Kết thúc lượt; không đề xuất skill thực hiện, không tạo handoff và không chỉnh runtime.

Chỉ công nhận approval khi người dùng phản hồi sau bản phân tích và chỉ rõ chấp thuận recommendation hoặc một phương án xác định. Không dùng yêu cầu ban đầu, sự im lặng hoặc một approval cho tác vụ cũ làm approval hiện tại.

Với `REJECT`, chỉ tiếp tục nếu người dùng cung cấp source of truth mới hoặc thay đổi mục tiêu; không biến approval thành quyền bỏ qua governance.
