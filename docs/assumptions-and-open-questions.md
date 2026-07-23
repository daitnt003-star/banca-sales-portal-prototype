# Assumptions & Open Questions — Baseline

**Phase:** PHASE 1 — Audit & Requirement Baseline

Theo nguyên tắc BA Skill: không tự suy diễn nghiệp vụ quan trọng; ghi rõ assumption khi không chặn prototype, chỉ hỏi khi thiếu thông tin làm thay đổi kiến trúc/flow cốt lõi.

---

## 1. Assumptions (không chặn, tiếp tục với giả định này)

| ID | Assumption | Lý do |
|---|---|---|
| A-01 | Motor/Car Insurance là sản phẩm duy nhất có journey chi tiết ở P0; Health/SME chỉ tồn tại dưới dạng entry trong seed data để chứng minh journey không hard-code, không cần UI đầy đủ | PROJECT_OVERVIEW.md v1 chỉ mô tả chi tiết Motor ở mục 3.8/VII |
| A-02 | "Policy status thật" (ACTIVE/EXPIRED/CANCELLED) đọc từ Core — dùng enum tối giản 3 giá trị cho mock, không cần đầy đủ enum Policy Core thật | Core system chưa có trong scope portal này |
| A-03 | `Help` module có thể làm cuối (P1) nếu ưu tiên transaction flow, theo đúng gợi ý trong PROJECT_OVERVIEW.md v1 mục 12 | User spec ghi rõ "Có thể để P1 nếu cần ưu tiên transaction flow" |
| A-04 | Existing seed data (RM-01, RM-02, TS-01, CRM-01, SUP-01) giữ nguyên ID, chỉ bổ sung Team Leader-01, Branch Manager-01, 1 account inactive mới | Tuân thủ "Do not replace existing mock IDs when adding new data" |
| A-05 | `policy-detail` có thể triển khai như view của module `policies` (`?view=detail&id=`) thay vì module riêng, theo convention "one HTML entry, multiple views via query param" đã dùng cho `product-access` | Giảm số module, đúng pattern đã có trong sprint1 (`product-access?view=detail&productId=`) |
| A-06 | Renewal ("Tái tục từ hợp đồng cũ") ở P0 chỉ cần entry point trong Start Sale Modal (chọn policy sắp hết hạn → prefill → tạo case mới), KHÔNG cần luồng renewal-specific đầy đủ (so sánh với policy cũ, renewal-specific document...) | User spec P0 liệt kê 5 entry mode ngang hàng, không tách riêng renewal thành flow phức tạp hơn |
| A-07 | "Đang hiệu lực" trong filter Hợp đồng dùng rule `effective_date ≤ today ≤ expiry_date AND policy_status = ACTIVE` — áp dụng nguyên văn công thức trong PROJECT_OVERVIEW.md v1 mục 8 | Đã có công thức rõ trong nguồn |

## 2. Open questions — CẦN hỏi user trước khi ảnh hưởng kiến trúc/flow cốt lõi

| ID | Câu hỏi | Vì sao chặn kiến trúc |
|---|---|---|
| OQ-01 | Merge 3 module `seller-profile` + `seller-readiness` + `product-access` thành `employee-profile` — có cần giữ lại route cũ (`modules/seller-profile/...`) redirect sang route mới để tránh broken link nếu có nơi khác đang trỏ tới, hay xóa thẳng? | Ảnh hưởng `app-manifest.json` + navigation, cần xác nhận trước khi patch |
| OQ-02 | `application-workspace` là module quan trọng nhất — Edit Mode và Tracking Mode dùng CHUNG 1 module theo đúng spec, nhưng đây là module phức tạp nhất trong toàn bộ prototype. Có nên tách `application-workspace` thành module riêng lớn với sub-view, hay giữ 1 module như spec yêu cầu? (Spec đã nói rõ "vẫn dùng chung, không tạo trang detail trùng lặp" — đây là XÁC NHẬN, không phải hỏi mới, nhưng cần confirm trước khi build vì đây là module tốn effort nhất) | Quyết định ảnh hưởng toàn bộ Sprint 2–4 |
| OQ-03 | Sprint plan mới (Sprint 0–5 theo PROJECT_OVERVIEW.md v1) và Sprint cũ (Sprint 1–10 theo FEATURE-CHECKLIST.md) đang chạy song song. Sprint 1 cũ = tương đương "Sprint 0 Foundation" mới? Hay tính sprint1 hiện tại đã là 1 sprint hoàn chỉnh và ta bắt đầu "Sprint 2" mới cho phần còn lại? | Ảnh hưởng cách đặt tên thư mục/sprint tiếp theo — có nên tạo `sprint2/` mới hay tiếp tục thêm module vào `sprint1/`? |
| OQ-04 | Persona Corporate RM (CRM-01) đã có sẵn trong scenario/seed cũ nhưng bị loại khỏi P0 theo spec mới. Giữ nguyên seed (không dùng trong demo P0) hay xóa hẳn khỏi persona switcher để tránh gây nhầm lẫn khi demo? | Ảnh hưởng `auth` module (persona switcher) + `app-manifest.json` `personas[]` |
| OQ-05 | Chưa có định nghĩa enum Policy status thật từ Policy Core — dùng enum tối giản (A-02) có đủ cho mục đích demo/prototype, hay cần enum chi tiết hơn (ví dụ thêm `LAPSED`, `SURRENDERED`) để chuẩn bị cho tích hợp thật sau này? | Ảnh hưởng data model `policies` mock — quyết định trước khi viết `seed/policies.js` |

## 2.1. Quyết định đã chốt (2026-07-20, 11:xx)

| ID | Quyết định |
|---|---|
| OQ-01 | **Xóa thẳng route cũ** (`modules/seller-profile`, `seller-readiness`, `product-access`), dùng route mới `employee-profile` — không giữ redirect. |
| OQ-02 | Xác nhận: `application-workspace` là 1 module duy nhất cho cả Edit Mode và Tracking Mode, đúng theo spec. |
| OQ-03 | **Thêm module mới trực tiếp vào `sprint1/modules/`** — không tạo `sprint2/` riêng. `sprint1` là nền tảng liên tục duy nhất. |
| OQ-04 | **Xóa hẳn Corporate RM (CRM-01)** khỏi persona switcher và seed. Chỉ thêm lại khi thực sự triển khai P1 Corporate/SME. |
| OQ-05 | Giữ enum Policy status tối giản (ACTIVE/EXPIRED/CANCELLED) theo A-02, không mở rộng thêm cho tới khi có yêu cầu tích hợp Policy Core thật. |

## 3. Known gaps / chưa quyết (không chặn, ghi nhận để theo dõi)

- Chưa có UX wireframe cụ thể (Phase 2 sẽ làm).
- Chưa có wireframe cho `start-sale-modal` step 2 (chọn sản phẩm/gói) — cần Phase 2 UX Architecture.
- Chưa rõ format PDF policy trong prototype (dùng placeholder PDF hay chỉ mock link) — không chặn, làm ở Phase 4 khi build `policy-detail`.
- Chưa có device breakpoint cụ thể cho tablet (chỉ ghi "responsive tối thiểu desktop và tablet" — cần Phase 2 định nghĩa breakpoint chính xác).

## 4. Traceability check (yêu cầu → màn hình → hành động → mock data)

| Yêu cầu | Màn hình | Hành động | Mock data cần |
|---|---|---|---|
| "Biết công việc cần làm hôm nay" | `seller-workspace` (Home) | Click Work Queue item → mở đúng record | `sales-cases.js`, `applications.js` |
| "Bắt đầu bán cho đúng khách hàng" | `start-sale-modal` | Chọn entry mode → tạo sales case | `customers.js`, `referrals.js`, `sales-cases.js` |
| "Lập và tiếp tục HSYCBH" | `application-workspace` (Edit Mode) | Autosave, Submit | `applications.js`, `journey-config.mock.js` |
| "Theo dõi hồ sơ sau nộp" | `application-workspace` (Tracking Mode), `submitted-applications` | Xem tiến độ, Bổ sung, Gửi lại link | `applications.js`, `notifications.js` |
| "Tra cứu hợp đồng" | `policies`, `policy-detail` | Xem/tải PDF/gửi lại | `policies.js` |
| "Quản lý team" (Manager) | `team-workspace` | Giao task/delegate | `sales-cases.js` + delegation object |

Baseline này sẽ được cập nhật lại (patch, không tạo file trùng) khi Phase 2/3/4 phát sinh thêm quyết định.
