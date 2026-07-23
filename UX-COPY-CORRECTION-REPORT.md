# UX Copy Correction Report

**Reason:** User feedback: the prior showcase still used unfriendly BA/system wording such as Sprint 1, Seller Identity, readiness, partner/channel/branch, USER_ACCOUNT/PRODUCER/EXTERNAL_IDENTITY, demo flow, etc.

---

## 1. Correction applied

Rewrote visible `showcase.html` UI copy to be seller-facing:

- `Sprint 1 · Seller Identity, Access & Readiness` → removed from visible UI
- `Biết ngay seller được bán gì...` → `Hôm nay bạn có thể bán sản phẩm nào?`
- `Readiness & next action` → `Điều kiện bán và việc cần xử lý`
- `partner/channel/branch` → `đơn vị/kênh phân phối`
- `READY / CONDITIONAL / BLOCKED / SERVICE_UNVERIFIED` → `Có thể bán / Bán có điều kiện / Chưa thể bán / Chưa xác minh`
- `USER_ACCOUNT / PRODUCER / EXTERNAL_IDENTITY` → `thông tin đăng nhập, mã RM ngân hàng và mã người bán bảo hiểm`
- `Demo flow` → `Cách hệ thống hỗ trợ bạn`
- `Giới hạn bản demo... Sprint...` → user-facing note about current scope

Also changed scope chips:

- `OWN` → `Hồ sơ của tôi`
- `ASSIGNED` → `Được giao`
- `PORTFOLIO` → `Khách hàng phụ trách`
- `SERVICING` → `Đang phục vụ`
- `DELEGATED_CASE` → `Được uỷ quyền`

---

## 2. Browser validation

Opened over HTTP:

```text
http://127.0.0.1:8790/showcase.html
```

Visible banned terms check returned empty for:

```text
Sprint 1
Seller Identity
Readiness & next action
Demo flow
USER_ACCOUNT
PRODUCER
EXTERNAL_IDENTITY
partner/channel/branch
SERVICE_UNVERIFIED
READY
CONDITIONAL
BLOCKED
Foundation
readiness
Role
Partner
Branch
white-label
```

Observed scenario matrix:

```json
{
  "RM-01": {
    "kpis": ["2", "0", "0", "4"],
    "visibleStates": ["Có thể bán", "Có thể bán", "Có thể bán"],
    "productCount": 2,
    "banned": []
  },
  "RM-02": {
    "kpis": ["0", "1", "1", "2"],
    "visibleStates": ["Bán có điều kiện", "Chưa thể bán", "Bán có điều kiện"],
    "productCount": 2,
    "banned": []
  },
  "SVC-ERR": {
    "kpis": ["0", "0", "2", "1"],
    "visibleStates": ["Chưa xác minh", "Chưa xác minh", "Chưa xác minh"],
    "productCount": 2,
    "banned": []
  }
}
```

Browser console error check returned no errors.

---

## 3. Screenshot evidence

Latest corrected screenshot:

`/Users/trixie/aicoworker/openclaw/media/browser/1739f766-c0f2-481f-aa82-381648ba6b1e.jpg`

---

## 4. Honest note

The earlier page failed because it exposed analysis/implementation language in a user interface. This correction moves technical concepts into documentation and presents only user-facing business language in the demo.
