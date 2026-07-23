# Status Model — Baseline

**Phase:** PHASE 1 — Audit & Requirement Baseline
**Status:** Baseline — pending confirmation
**Source:** PROJECT_OVERVIEW.md v1, mục III

---

## 1. Readiness status (đã có, KEEP)

```text
READY
CONDITIONAL
BLOCKED
PENDING_VERIFICATION
SERVICE_UNVERIFIED
```

Đã implement trong `seller-readiness` (sẽ merge vào `employee-profile` tab 2) và `product-access` (tab 3). Không đổi logic, chỉ đổi vị trí UI.

## 2. Sales case — Hồ sơ chưa nộp

```text
submission_state = NOT_SUBMITTED
```

Filter theo `current_stage` (7 bước chuẩn hóa):

```text
CUSTOMER_INFO
INSURED_PARTY
RISK_OBJECT
PACKAGE_AND_QUOTE
RISK_DECLARATION
DOCUMENTS
REVIEW_AND_SUBMIT
```

Wording UI: Thông tin khách hàng → Người được bảo hiểm → Đối tượng bảo hiểm → Gói bảo hiểm & báo giá → Khai báo rủi ro → Tài liệu → Kiểm tra & nộp hồ sơ.

Tùy sản phẩm (Motor P0 dùng thứ tự khác chút — xem `docs/module-briefs/application-workspace.md` sẽ tạo ở Phase 2):

```text
Motor: Khách hàng → Thông tin xe → Gói & báo giá → Khai báo tổn thất → Tài liệu → Kiểm tra & nộp
```

### Cờ cảnh báo (KHÔNG phải status chính — chỉ badge)

```text
MISSING_INFORMATION
MISSING_DOCUMENT
QUOTE_NEED_RERATE
QUOTE_EXPIRING
PRODUCT_AUTH_CHANGED
CUSTOMER_CONFIRMATION_REQUIRED
```

## 3. Application — Hồ sơ đã nộp

```text
submission_state = SUBMITTED
```

Filter theo `application_status`:

```text
SUBMITTED
WAITING_RECEIPT
WAITING_UNDERWRITING
UNDERWRITING_IN_PROGRESS
NEED_MORE_INFORMATION
UNDERWRITING_DECIDED
WAITING_CUSTOMER_CONFIRMATION
PAYMENT_PENDING
PAYMENT_SUCCESS
POLICY_ISSUE_PENDING
POLICY_ISSUED
REJECTED
CANCELLED
```

Wording UI: Đã nộp / Chờ tiếp nhận / Chờ thẩm định / Đang thẩm định / Cần bổ sung / Đã có kết quả thẩm định / Chờ khách xác nhận / Chờ thanh toán / Đã thanh toán / Chờ phát hành hợp đồng / Đã phát hành / Bị từ chối / Đã hủy.

Nhóm filter lớn (để UI không quá chật, dùng cho `submitted-applications` primary filter):

```text
Tất cả / Thẩm định / Cần bổ sung / Chờ khách xác nhận / Thanh toán / Phát hành / Đã hoàn tất / Không thành công
```

## 4. Underwriting decision (lưu riêng khỏi lifecycle status)

```text
APPROVED
APPROVED_WITH_LOADING
APPROVED_WITH_EXCLUSION
APPROVED_WITH_CONDITION
REJECTED
```

"Thư thẩm định" = document/result gắn với decision, KHÔNG phải status:

```text
underwriting_letter_id
letter_status
customer_viewed_at
customer_confirmed_at
```

## 5. Sales case cancel (không xóa vật lý)

```text
CANCELLED  — có actor + timestamp + lý do
```

## 6. Policy status

Primary filter (quick filter theo thời gian, KHÔNG phải policy status thật):

```text
Tất cả / Mới phát hành / Đang hiệu lực / Sắp tái tục
```

Policy status thật (đọc từ Core, không map chi tiết ở Phase 1 — cần xác nhận enum thật từ Policy Core ở Phase 2, xem Open Question OQ-05):

```text
ACTIVE (đang hiệu lực: effective_date ≤ today ≤ expiry_date)
EXPIRED
CANCELLED
```

## 7. Referral status (nếu dùng entry mode "Lead/Referral được giao")

```text
RECEIVED
VALIDATED
SALES_STARTED
QUOTE_CREATED
APPLICATION_SUBMITTED
UW_PENDING
PAYMENT_PENDING
POLICY_ISSUED
UNSUCCESSFUL
CANCELLED
```

(Kế thừa từ FEATURE-CHECKLIST.md mục 3.2 — vẫn hợp lệ, không đổi.)

## 8. Delegation (thay cho role Support Seller)

```javascript
{
  type: "DELEGATED_CASE" | "DELEGATED_TASK",
  delegated_by,
  delegated_to,
  valid_from,
  valid_to,
  allowed_actions
}
```

## 9. Traceability — status → screen → action

| Status/flag | Screen hiển thị | Action tương ứng |
|---|---|---|
| `NOT_SUBMITTED` + `current_stage` | Home (5 gần nhất) → `unsubmitted-applications` | Tiếp tục / Xem / Hủy |
| `NEED_MORE_INFORMATION` | Home ("Hồ sơ cần bổ sung") → `submitted-applications` filter | Bổ sung ngay (chỉ mở field/document được yêu cầu) |
| `WAITING_UNDERWRITING` / `UNDERWRITING_IN_PROGRESS` | Home summary card → `submitted-applications` | Xem tiến độ |
| `UNDERWRITING_DECIDED` | `submitted-applications` / Tracking Mode | Xem kết quả + thư thẩm định |
| `WAITING_CUSTOMER_CONFIRMATION` | Tracking Mode | Gửi lại link, theo dõi OTP |
| `PAYMENT_PENDING` | Home summary card + Tracking Mode | Gửi thanh toán / Retry |
| `POLICY_ISSUED` | Tracking Mode → `policies`/`policy-detail` | Xem hợp đồng, tải PDF, gửi lại khách |
