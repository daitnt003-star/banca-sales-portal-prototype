# Deliverable G — Test Report (Rework v2, đợt 2026-07-27)

> Phạm vi đợt này: **đóng nốt các phần đã có config nhưng chưa ai gọi** + Phase 6 (Policy Cockpit)
> + Phase 7 (hoa hồng/bảng nhân viên) + §10 (tài liệu/OCR).
> Không rebuild hệ thống; chỉ sửa module thực sự bị ảnh hưởng (§3.1).

## 1. Kết luận audit đầu vào (phần nào đã làm / chưa)

Trước khi sửa đã rà toàn bộ source. Ba nhóm phát hiện:

| Nhóm | Phát hiện |
|---|---|
| ✅ Đã làm tốt | journey engine config-driven, 16 status/5 nhóm, QuoteListShell/QuoteDataTable, searchBar/statCard/tabBar/dataTable, CustomerContextCard + consent gate, `BANCA_INTEGRATED` **không** hiện danh sách khách hàng (§5.2 đã đúng) |
| ⚠️ Config có nhưng **chết** (không page nào gọi) | `BANCA.NAV_CONFIG`, `BANCA.paymentEnableRule`, `BANCA.quoteVersion.reRate/approve` |
| ❌ Chưa làm | Policy Cockpit 6 tab (thiếu hẳn Yêu cầu dịch vụ + Tổn thất/Bồi thường), tách hoa hồng §13.3, bảng nhân viên §13.2, gói component §9 (payment/OTP/UW), §10 OCR còn section riêng |

## 2. Scenario đã test

### 2.1 Automated (node) — 125 assertion, PASS 125 / FAIL 0

| Suite | Assert | Bao phủ |
|---|---|---|
| `test-foundation.js` | 58 | cross-product contamination, journey stages, rating, backward-compat |
| `test-post-submit.js` | 16 | post-submit state machine, PA không map Motor UW |
| `test-payment-gate.js` **(mới)** | 26 | §9.2 mọi điều kiện chặn thanh toán + §8.3 quote version + §9.3 payment method |
| `test-manager-commission.js` **(mới)** | 25 | §13.3 tách hoa hồng, phạm vi override, §13.2 trường persona |

Chi tiết 2 suite mới:

**`test-payment-gate.js`** — mỗi điều kiện chặn phải phát ra **lý do bằng chữ** (AC11):
UW đang xử lý · cần bổ sung · từ chối · duyệt-có-điều-kiện chưa xác nhận · quote hết hạn ·
chưa có phí · thiếu tài liệu bắt buộc · đã thanh toán · đang có phiên thanh toán ·
case của seller khác · không có `can_collect_payment` · quote version chưa duyệt · case đã huỷ.
Có assert "gộp ≥4 lý do cùng lúc" (không dừng ở lý do đầu tiên) và
"Motor/Health dùng CÙNG bộ 3 phương thức" (AC02).

**`test-manager-commission.js`** — assert **`commissionSplit` cố ý KHÔNG có field tổng**
(`total`/`amount` undefined), override chỉ đến từ nhân viên trong đúng `managerScope`,
manager không tự override chính mình, KPI tách `commission` vs `commissionOverride`.

### 2.2 Manual/headless (Chrome headless, dump-DOM + bắt console error)

| Scenario | Kết quả |
|---|---|
| Nav 5 mục §8.1 trên 5 trang chính | ✅ Trang chủ · Bản chào · Hợp đồng · (Đội nhóm theo quyền) · Trợ giúp |
| Active nav khi ở bước hành trình (advisory, quick-advisory) | ✅ highlight "Bản chào" qua `aliases` |
| Payment gate — APP-101/102 (UW đang xử lý), 104 (cần bổ sung), 105 (duyệt có điều kiện) | ✅ 3 phương thức hiện đủ, disabled, **kèm lý do đúng theo từng case** |
| Policy Cockpit × 3 sản phẩm (Motor 0207, Health 0311, PA 0322) × 6 tab | ✅ 6 tab đồng nhất, 0 console error |
| Tab Yêu cầu dịch vụ (Motor 0207) | ✅ 2 yêu cầu + badge trạng thái + "cần bổ sung" |
| Tab Tổn thất/Bồi thường (Motor 0184) | ✅ CLM-2026-0119 + tiến trình giám định |
| Manager persona TL-01 — KPI | ✅ "Hoa hồng trực tiếp 0 ₫" và "Hoa hồng thứ cấp 1.224.806 ₫" **tách riêng** |
| Manager — bảng hiệu suất thành viên | ✅ đủ 16 cột §13.2, dữ liệu thật (RM001 · Retail RM · HCM · HCM01 · KHCN · TEAM-A · 3R/0C/0B …) |
| Bước Tài liệu (edit mode) | ✅ 1 danh sách 5 item, **0 heading "Tài liệu được OCR"** |
| Tab Tài liệu (tracking mode) | ✅ 4 item + 2 chip "Đã bóc tách" trong cùng danh sách |

### 2.3 Validator repo
`validate-terminology` PASS (93 file) · `detect-duplicate-components` OK · `validate-modules` VALID.

## 3. Lỗi THẬT phát hiện & đã sửa

| # | Lỗi | Ảnh hưởng | Sửa |
|---|---|---|---|
| 1 | `quoteVersion.reRate()` không reset `activeQuoteApproved` | Quote đã **SUPERSEDED** vẫn cho thanh toán — vi phạm §8.3/§9.2 | reset cờ + gate đọc **trực tiếp** status của version active |
| 2 | `paymentEnableRule` định nghĩa nhưng **không ai gọi**; resolver tự suy luận song song | 2 nguồn sự thật cho điều kiện thanh toán; nút disabled không nêu lý do | resolver gọi lại chính gate đó; UI hiện đủ `reasons[]` |
| 3 | `NAV_CONFIG` không ai đọc; `app-shell` tự khai báo menu, có 2 mục trùng | Nav lệch §8.1, sửa nav phải sửa 2 nơi | shell chỉ render từ config |
| 4 | `diag.slice(0,4)` ở team-workspace | Thêm ô hoa hồng thứ 5 sẽ **nuốt mất** "Việc cần xử lý" | bỏ slice |
| 5 | `test-post-submit` vỡ do resolver phụ thuộc config mới | CI đỏ | thêm require + resolver **fail-closed** khi thiếu config |
| 6 | `cellOf`/`fileOf`/`docRow` — bảng tài liệu legacy | Code chết ~18 dòng | xoá |
| 7 | Seed chỉ có hợp đồng Motor | 2 nhánh cockpit Health/PA **không thể kiểm chứng** | thêm policy Health (3 người được BH) + PA |

## 4. Hạn chế prototype / còn tồn tại

1. **`OtpVerificationPanel` + `UnderwritingStatusPanel` đã đóng gói nhưng chưa thay markup inline**
   trong `app-workspace.js`. Vùng xác nhận Health per-member phức tạp; thay nóng rủi ro vỡ luồng
   đã nghiệm thu → để adopt-on-touch. **§9.4 chưa đóng hoàn toàn.**
2. **UI `QuoteVersionSelector` / `ReRateNotice` chưa dựng** — model + gate đã chặn đúng
   (có test), nhưng người dùng chưa chọn/xem version trên màn hình. **§7.3 chỉ đóng phần logic.**
3. **`OrganizationScopeFilter` chưa hợp nhất** (§13.2) — team-workspace vẫn dùng scope dropdown riêng.
4. **2 nguồn sự thật về quyền quản lý**: `BANCA.can('VIEW_TEAM_WORKSPACE')` đọc `persona.isManager`
   trong khi `manager-profiles.js` mới là nơi khai báo capability. Hệ quả: RM-01 là player-coach
   (`availableScopes` có TEAM) nhưng **không thấy mục "Đội nhóm"**. Chưa sửa vì ảnh hưởng điều hướng
   nhiều persona — cần chốt nguồn chuẩn trước.
5. Hoa hồng override dùng **tỷ lệ phẳng theo `managerScope`** (mock). Thực tế theo scheme nhiều bậc.
6. Yêu cầu dịch vụ / khai báo tổn thất mới ở mức **khởi tạo + theo dõi** (đúng §11: portal không
   sửa hợp đồng, không xử lý bồi thường); CTA tạo mới hiện là demo `alert`.
7. Vi phạm design-token còn 1.161 (chủ yếu `app-workspace.js` 610 — inline style cũ).
   Đợt này **giảm** `policies/index.html` 167 → 119 nhờ bỏ 3 khối `<style>` trùng.

## 5. File đã thay đổi

**Mới**
`shared/components/confirm-payment.js` · `shared/components/policy-cockpit.js` ·
`shared/mock/seed/payment-method-config.js` · `shared/mock/seed/post-sale.js` ·
`scripts/test-payment-gate.js` · `scripts/test-manager-commission.js` ·
`docs/rework-v2/G-test-report.md`

**Sửa**
`shared/js/app-shell.js` (nav + CTA) · `shared/js/navigation-config.js` · `shared/js/terminology.js` ·
`shared/js/head-loader.js` · `shared/mock/seed/status-mappings.js` (gate) ·
`shared/mock/seed/case-state-resolver.js` · `shared/mock/seed/quote-version.js` ·
`shared/mock/seed/commission.js` · `shared/mock/seed/sellers.js` (department) ·
`shared/mock/seed/policies.js` (Health/PA demo) · `shared/components/foundation-components.js` (rowClickJs) ·
`shared/styles/components.css` · `modules/policies/index.html` (3 cockpit → 1) ·
`modules/team-workspace/index.html` · `modules/application-workspace/app-workspace.js` ·
`scripts/test-post-submit.js` · `docs/rework-v2/D-…md` · `docs/rework-v2/E-…md`
