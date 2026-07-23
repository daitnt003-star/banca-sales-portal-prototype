# Product Overview — Banca Sales Portal

**Phase:** PHASE 1 — Audit & Requirement Baseline
**Status:** Baseline — pending user confirmation before Phase 2 (UX Architecture)
**Source of truth:** `projects/banca-sales-portal/PROJECT_OVERVIEW.md` (Prototype Specification v1, 2026-07-20) — supersedes earlier `BANCA-SALES-PORTAL-FINAL-SCOPE.md` / `FEATURE-CHECKLIST.md` where they conflict.
**Continuation base:** `projects/sales-service-prototype/prototype/sprint1/` (57 files, validated, `skeleton+functional-mock`)

---

## 1. What this product is

Banca Sales Portal (Tầng 3 — Sales Satellite) là **Insurance Sales Execution Workspace** cho RM/seller ngân hàng, giúp:

- Nhận diện đúng hồ sơ nhân viên và quyền bán.
- Bắt đầu bán cho đúng khách hàng (ngân hàng, mới, referral, tái tục).
- Tư vấn nhanh sản phẩm/gói bảo hiểm.
- Lập và tiếp tục HSYCBH theo hành trình từng sản phẩm.
- Theo dõi hồ sơ sau nộp: thẩm định, xác nhận khách hàng, thanh toán, phát hành.
- Tra cứu hợp đồng đã bán và hợp đồng sắp tái tục.
- Biết công việc cần xử lý tiếp theo (Work Queue).
- Xem kết quả bán hàng cá nhân.
- (Manager) Xem và điều hành hoạt động team/branch theo hierarchy.

## 2. What this product is NOT

Portal **KHÔNG**:

- Thay thế Bank CRM (không quản lý Customer Master, không Lead Management đầy đủ).
- Tạo/sửa sản phẩm, biểu phí, underwriting rule (thuộc Core — Tầng 1).
- Cấu hình partner/channel, seller hierarchy, license/training, product authorization (thuộc Distribution — Tầng 2).
- Xử lý reconciliation, settlement, commission plan.
- Có Admin Portal riêng (Partner Admin/Distribution Admin không đăng nhập portal này).

## 3. Kiến trúc 3 tầng (bối cảnh)

```text
Tầng 1 — Core Insurance Platform
  Product config, rating, underwriting, policy admin, billing/payment, claims, commission

Tầng 2 — Distribution Platform
  Partner/channel, seller hierarchy, license/training, product authorization, journey/branding config

Tầng 3 — Sales Satellites  ← BANCA SALES PORTAL (dự án này)
  Banca Sales Portal, Agent/Broker Portal, Mobile Banking/Mini App, Customer App
```

Portal nhận cấu hình/dữ liệu từ Tầng 1–2, thực thi và theo dõi hành trình bán bảo hiểm.

## 4. Scope P0 vs P1 (đã chốt trong yêu cầu mới nhất)

### P0 — bắt buộc cho prototype lần này

- Persona: Retail RM/Bank Sales Staff, Banca Telesales (chỉ khi mock cần minh họa).
- Menu: Trang chủ, Bán bảo hiểm (Hồ sơ chưa nộp/đã nộp), Hợp đồng, Trợ giúp, Hồ sơ nhân viên (avatar).
- Nút "Bắt đầu bán hàng" với 5 entry mode.
- Application Workspace cho **Motor/Car Insurance** (vertical slice duy nhất cho journey chi tiết).
- Đội nhóm (Manager Workspace) — hiện với Team Leader/Branch Manager.

### P1 — chưa làm trong prototype này, ghi nhận nhưng không build

- Corporate RM / SME/Group product.
- Renewal chi tiết (chỉ cần entry point "Tái tục từ hợp đồng cũ" trong Start Sale, chưa cần đầy đủ).
- Health/PA journey đầy đủ (chỉ Motor P0; các sản phẩm khác ghi nhận trong status model để không hard-code).
- Endorsement, Cancellation, Claim, Service Request đầy đủ.
- Help module chi tiết (có thể để P1 nếu ưu tiên transaction flow — theo PROJECT_OVERVIEW.md v1 mục 12).

### Explicitly out of scope (mọi phase)

- Support Seller như một role riêng (dùng case delegation).
- Partner Admin, Distribution Admin, Product Admin, Underwriter, Commission Admin, Payment/Reconciliation Ops.
- Lead scoring/routing/campaign builder đầy đủ.
- Customer Master editing.

## 5. Mission — 6 câu hỏi Home phải trả lời

| Mission | Câu hỏi |
|---|---|
| Sẵn sàng bán | Tôi có được phép bán sản phẩm này không? |
| Bắt đầu đúng | Tôi đang bán cho khách hàng nào, từ nguồn nào? |
| Tư vấn đúng | Sản phẩm và gói nào phù hợp? |
| Hoàn thành giao dịch | Tôi phải đi qua bước nào để phát hành hợp đồng? |
| Theo dõi công việc | Hồ sơ đang ở đâu và cần làm gì tiếp? |
| Quản lý kết quả | Tôi/đội nhóm đang đạt kết quả thế nào? |

## 6. Điểm chốt quan trọng khác biệt so với tài liệu cũ trong `sales-service-prototype/`

| Chủ đề | Tài liệu cũ (FINAL-SCOPE/FEATURE-CHECKLIST, 2026-07-19) | Quyết định mới nhất (PROJECT_OVERVIEW.md v1, 2026-07-20) |
|---|---|---|
| Menu Báo giá | Có menu "Tư vấn & Báo giá" riêng với "Báo giá đang xử lý", "Tất cả báo giá" | **Bỏ hẳn** — báo giá là bước trong hành trình Hồ sơ chưa nộp; lịch sử quote xem qua drawer |
| Menu Sản phẩm | Có menu chính "Sản phẩm được phép bán" | **Gộp vào Hồ sơ nhân viên** (avatar dropdown, tab 3), không ở menu chính |
| Hồ sơ/Readiness/Product access | 3 module riêng trong navGroup "business" (menu chính): `seller-profile`, `seller-readiness`, `product-access` | Gộp thành **1 trang "Hồ sơ nhân viên"** 3 tab, chỉ mở từ avatar |
| HSYCBH | Gọi là "Flexible Application Journey" | Giữ nguyên khái niệm, wording UI: "Hồ sơ chưa nộp" / "Hồ sơ đã nộp" |
| Corporate RM | Trong danh sách login được phép (P0/P1 không phân định rõ) | **Không thuộc P0**, chỉ đưa vào P1 khi có SME/Group |
| Sprint roadmap | 10 sprint | Sprint 0–5 (rút gọn, tập trung transaction flow trước dashboard) |

**Quyết định xử lý:** dùng PROJECT_OVERVIEW.md v1 làm nguồn sự thật. Tài liệu cũ giữ làm tham khảo lịch sử/BA reasoning, không dùng để cãi lại quyết định mới.

## 7. Liên kết tài liệu

- Nguồn quyết định mới nhất: `projects/banca-sales-portal/PROJECT_OVERVIEW.md`
- BA reasoning gốc (tham khảo): `projects/sales-service-prototype/BANCA-SALES-PORTAL-FINAL-SCOPE.md`, `BANCA-SALES-PORTAL-FEATURE-CHECKLIST.md`, `BANCA-SALES-PORTAL-PERMISSION-MATRIX.md`
- Kiến trúc prototype hiện có: `projects/sales-service-prototype/SPRINT1-SITEMAP.md`, `prototype/sprint1/app-manifest.json`
- Skill áp dụng: `requirement-ba-skill`, `enterprise-uiux-skill`, `portal-prototype-builder-skill`
