# UX Copy Rules — Seller-facing Showcase

**Reason:** User feedback: current copy sounds like BA/system documentation, not a real app.

---

## 1. User-facing language principle

The UI must speak like an RM/seller workspace, not like a project document.

Use:

- Hôm nay cần làm gì
- Sản phẩm có thể bán
- Có thể bắt đầu bán
- Có thể tư vấn / báo giá
- Chưa thể bán
- Cần hoàn tất đào tạo
- Giấy phép sắp hết hạn
- Hồ sơ người bán
- Phạm vi khách hàng được phục vụ

Avoid exposing implementation words.

---

## 2. Banned from visible UI

These may exist in docs/code but must not dominate visible app copy:

- Sprint 1
- Seller Identity, Access & Readiness
- Readiness & next action
- Demo flow
- Demo story
- USER_ACCOUNT
- PRODUCER
- EXTERNAL_IDENTITY
- partner/channel/branch
- SERVICE_UNVERIFIED
- READY / CONDITIONAL / BLOCKED as prose headings without user explanation
- Map identity
- Tính readiness
- Product authorization formula
- Không dùng một badge chung cho toàn seller
- Hành trình báo giá sẽ nằm ở sprint tiếp theo

---

## 3. Replacement language

| Technical phrase | User-facing replacement |
|---|---|
| Sprint 1 | Bản demo điều kiện bán |
| Seller Identity, Access & Readiness | Kiểm tra điều kiện bán |
| READY | Có thể bán |
| CONDITIONAL | Bán có điều kiện |
| BLOCKED | Chưa thể bán |
| SERVICE_UNVERIFIED | Chưa xác minh được |
| partner/channel/branch | đơn vị / kênh phân phối |
| USER_ACCOUNT / PRODUCER / EXTERNAL_IDENTITY | Thông tin đăng nhập / mã người bán / mã RM ngân hàng |
| Demo flow | Cách hệ thống hỗ trợ RM |
| Readiness & next action | Điều kiện bán và việc cần xử lý |

---

## 4. Layout rules from UI/UX skill

- One clear hero message.
- One primary CTA per section.
- Business nav only.
- Cards grouped by user task, not system concept.
- Avoid emoji as primary UI icon style where possible; keep icons subtle if used.
- No dense technical tables on landing.
- Preserve accessibility: readable contrast, body text >= 16px, clear button labels, no color-only status.
