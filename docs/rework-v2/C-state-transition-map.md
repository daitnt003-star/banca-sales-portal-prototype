# Deliverable C — State Transition Map (Rework v2)

> Bao gồm 5 state machine: Quote · Underwriting · Customer Confirmation · Payment · Issue.
> Nguồn tập trung: `shared/mock/seed/status-mappings.js` (mới) — page CHỈ đọc, không hard-code (§16).

## 0. CustomerDataAccessStage (gate dữ liệu — §4.2)
```
ANONYMOUS_CONTEXT
   │ khách đồng ý chia sẻ dữ liệu
   ▼
CONSENT_PENDING ──(consent recorded: version+timestamp)──► IDENTIFIED_CONTEXT
                                                              │ KYC verify
                                                              ▼
                                                        VERIFIED_CUSTOMER
```
Rule: PII (họ tên, SĐT, email, CCCD, địa chỉ, số TK) **chỉ hiển thị từ IDENTIFIED_CONTEXT**. Trước đó chỉ context ẩn danh (mã KH tham chiếu, nhóm tuổi, income band, loại khoản vay…).

## 1. Quote (Bản chào) — state model trung tâm (§8.2)
16 status → 5 nhóm hiển thị:

| Status | Nhóm hiển thị |
|---|---|
| DRAFT, INFORMATION_INCOMPLETE, DOCUMENT_PENDING | **Đang chuẩn bị** |
| UW_PENDING, MORE_INFORMATION_REQUIRED, APPROVED, APPROVED_WITH_CONDITION, DECLINED | **Đang xử lý** |
| CUSTOMER_CONFIRMATION_PENDING, CUSTOMER_CONFIRMED, PAYMENT_PENDING, PAYMENT_FAILED | **Chờ khách hàng** |
| ISSUED | **Đã phát hành** |
| EXPIRED, CANCELLED, SUPERSEDED | **Không thành công** |

```
DRAFT ──► INFORMATION_INCOMPLETE ──► DOCUMENT_PENDING ──► (submit) ──► UW_PENDING
UW_PENDING ─► MORE_INFORMATION_REQUIRED ─► UW_PENDING
UW_PENDING ─► APPROVED | APPROVED_WITH_CONDITION | DECLINED
APPROVED(_WITH_CONDITION) ─► CUSTOMER_CONFIRMATION_PENDING ─► CUSTOMER_CONFIRMED
CUSTOMER_CONFIRMED ─► PAYMENT_PENDING ─► (fail) PAYMENT_FAILED ─► PAYMENT_PENDING (retry)
PAYMENT_PENDING ─► (paid + issue) ─► ISSUED
bất kỳ lúc nào: ─► EXPIRED | CANCELLED
clone version mới: version cũ ─► SUPERSEDED
```
**Quote versioning (§8.3):**
- Draft sửa được. Dữ liệu ảnh hưởng phí đổi → `ReRateNotice` → re-rate → version mới.
- Quote đã duyệt **không mutate**; clone → version mới, version cũ → `SUPERSEDED`.
- Policy phải ref đúng `quoteVersionId` khách đã xác nhận. Cấm sửa premium tay.

## 2. Underwriting (product-configurable — §9.1)
```
STRAIGHT_THROUGH ─► (auto) APPROVED
MANUAL_UNDERWRITING ─► UW_PENDING
UW_PENDING ─► MORE_INFORMATION_REQUIRED ─► (upload) ─► UW_PENDING
UW_PENDING ─► APPROVED | APPROVED_WITH_CONDITION | DECLINED
```
Điều khiển bởi `ProductJourneyDefinition.underwritingMode`:
- Motor STP → auto approve (không có manual block).
- Health → có thể trigger MANUAL → APPROVED_WITH_CONDITION (loại trừ).

## 3. Customer Confirmation (OTP)
```
NOT_STARTED ─► OTP_SENT ─► (đúng) VERIFIED
                       └► (sai/hết hạn) OTP_SENT (resend, đếm số lần)
```
2 mode cùng component (`OtpVerificationPanel`): `SELLER_ASSISTED` (seller nhập OTP khách đọc) / `CUSTOMER_SELF_SERVICE` (gửi link, khách tự xác nhận). Chỉ đổi actor, **không tạo journey khác**.

## 4. Payment
```
DISABLED ──(đủ điều kiện)──► ENABLED ─► PROCESSING ─► SUCCESS
                                              └► FAILED ─► ENABLED (retry)
                                              └► EXPIRED/TIMEOUT
```
**Enable payment CHỈ khi (§9.2):**
```
customerConfirmation = VERIFIED
AND underwritingResult ∈ {APPROVED, APPROVED_WITH_CONDITION(đã chấp nhận)}
AND quote còn hiệu lực
AND quote version hiện tại đã duyệt
AND payment chưa SUCCESS
AND seller.can_collect_payment = true
```
Nếu disabled → hiển thị **lý do rõ ràng** (không chỉ xám): "Chờ khách OTP", "Thiếu tài liệu bắt buộc", "Báo giá hết hạn", "Bạn không có quyền thu"…

## 5. Issue (Phát hành)
```
NOT_READY ──(payment SUCCESS)──► ISSUING ─► ISSUED (policy + GCNBH + e-card)
                                     └► ISSUE_FAILED (payment success nhưng issue lỗi → retry issue, KHÔNG thu lại tiền)
```
Edge case bắt buộc test (§20, §21.F): **payment success nhưng issue failure** → giữ tiền, cho retry issue, không duplicate payment.

## 6. Ma trận liên khoá (guard tổng hợp)
| Hành động | Điều kiện tiên quyết |
|---|---|
| Hiển thị PII | dataAccessStage ≥ IDENTIFIED_CONTEXT |
| Submit bản chào | đủ info + document required + consent granted |
| Enable payment | §9.2 (6 điều kiện) |
| Phát hành | payment SUCCESS + quote version đã confirm |
| Sửa quote đã duyệt | KHÔNG — clone version mới |
| Manager sửa case ngoài quyền | KHÔNG — read-only |

## 7. Nơi lưu (§16)
`status-mappings.js` export: `QUOTE_STATUS`, `QUOTE_STATUS_GROUP`, `UW_STATUS`, `CONFIRM_STATUS`, `PAYMENT_STATUS`, `ISSUE_STATUS`, `paymentEnableRule(app, seller)`, `groupOf(status)`. StatusBadge + list + detail đọc CHUNG map này → cùng màu/label/icon ở Dashboard/List/Detail (§19.1).
