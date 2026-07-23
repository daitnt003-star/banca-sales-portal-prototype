# Persona & Permission Matrix — Baseline

**Phase:** PHASE 1 — Audit & Requirement Baseline
**Status:** Baseline — pending confirmation

---

## 1. Persona P0

| Persona | Mock ID (existing seed) | Vai trò | Ghi chú |
|---|---|---|---|
| Retail RM / Bank Sales Staff | RM-01 (Motor READY), RM-02 (Motor CONDITIONAL, Health BLOCKED) | Seller | Persona chính, dùng cho mọi happy path |
| Banca Telesales | TS-01 | Seller | Chỉ thêm khi mock cần minh họa; giới hạn quyền bind/thu tiền |
| Sales Team Leader | Team Leader-01 (mới, chưa có seed) | Manager | Dùng chung portal, mở thêm Manager Workspace |
| Branch Manager | Branch Manager-01 (mới, chưa có seed) | Manager | Dùng chung portal, phạm vi branch |
| Account inactive | (mới, chưa có seed) | — | Test Access Denied |

**Loại khỏi P0:** Corporate RM (CRM-01 — giữ trong seed cũ nhưng KHÔNG dùng cho demo P0, chỉ activate khi làm P1 SME/Corporate).

**Không tạo role riêng:** Support Seller (SUP-01 — giữ seed cũ để minh họa cơ chế `delegated_case`, không phải persona login riêng theo đúng nghĩa role).

## 2. Nguyên tắc quyền (permission formula)

```text
ALLOW = Account active
      + đúng partner
      + đúng role
      + đúng data scope
      + có quan hệ với hồ sơ (record relationship)
      + product readiness phù hợp
      + trạng thái hồ sơ cho phép hành động
```

Không được default ALLOW/READY khi một dependency chưa xác minh được (giữ nguyên nguyên tắc từ `BANCA-SALES-PORTAL-PERMISSION-MATRIX.md`).

## 3. Data scope

| Scope | Ý nghĩa | Áp dụng cho |
|---|---|---|
| `OWN` | Hồ sơ/case do chính seller tạo | Seller |
| `ASSIGNED` | Được giao (referral, task) | Seller |
| `PORTFOLIO` | Khách hàng trong portfolio được cấp | Seller |
| `SERVICING` | Đang phục vụ (hậu mãi/renewal) | Seller |
| `DELEGATED_CASE` | Được ủy quyền tạm thời trên 1 case cụ thể | Seller (support role tạm) |
| `TEAM` | Toàn bộ seller trong team | Team Leader |
| `BRANCH` | Toàn bộ seller/case trong branch | Branch Manager |

RM mặc định: `OWN + ASSIGNED + PORTFOLIO + SERVICING + DELEGATED_CASE`. **Không** được xem toàn bộ chi nhánh chỉ vì cùng ngân hàng.

## 4. Persona × Menu visibility

| Menu | Retail RM | Telesales | Team Leader | Branch Manager |
|---|---|---|---|---|
| Trang chủ | ✅ | ✅ | ✅ | ✅ |
| Bán bảo hiểm (Hồ sơ chưa nộp/đã nộp) | ✅ | ✅ (giới hạn bind/payment) | ✅ nếu vẫn có quyền bán | ✅ nếu vẫn có quyền bán |
| Hợp đồng | ✅ | ✅ | ✅ | ✅ |
| Đội nhóm | ❌ | ❌ | ✅ | ✅ |
| Trợ giúp | ✅ | ✅ | ✅ | ✅ |
| Hồ sơ nhân viên (avatar) | ✅ | ✅ | ✅ | ✅ |

## 5. Capability theo sản phẩm (per seller × product)

```text
can_view
can_advise
can_quote
can_submit
can_bind
can_collect_payment
```

Readiness:

```text
READY               — đủ điều kiện, không hạn chế
CONDITIONAL         — có thể advise/quote, hạn chế submit/bind/thu tiền
BLOCKED             — thiếu chứng chỉ/đào tạo bắt buộc, không thể advise/quote
PENDING_VERIFICATION — đang chờ xác minh, KHÔNG default sang READY
SERVICE_UNVERIFIED  — dependency (license/training service) không phản hồi được, KHÔNG default sang READY
```

(Giữ đúng nguyên tắc "never default to READY while dependency loading/unavailable" từ SPRINT1-SITEMAP.md — đây là baseline đã có, KEEP nguyên.)

## 6. Manager permission boundary

Manager (Team Leader/Branch Manager) **ĐƯỢC**:
- Xem case/seller trong phạm vi (team/branch).
- Giao task, delegation, reassign insurance case trong phạm vi.
- Coaching note.

Manager **KHÔNG ĐƯỢC**:
- Sửa seller hierarchy.
- Gán license/training.
- Bật/tắt sản phẩm hoặc đổi product authorization.
- Reassign lead/referral gốc từ Bank CRM (chỉ reassign task/case bảo hiểm).
- Sửa product/rating/UW rule.

## 7. Route/CTA guard rule

Mọi route trực tiếp (deep link) phải chạy qua permission check đầy đủ — không bypass. Route không hợp lệ → permission-denied state, không lộ dữ liệu hạn chế.

(Cơ chế `session-guard.js` + `permissions.js` đã tồn tại trong `shared/js/` — KEEP, chỉ cần extend rule cho các entity mới: sales case, application, policy, delegation.)
