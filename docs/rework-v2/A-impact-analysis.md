# Deliverable A — Impact Analysis (Rework v2)

> Nguồn yêu cầu: "YÊU CẦU ĐIỀU CHỈNH BANCA SALES PORTAL" (2026-07-27).
> Base code: `projects/sales-service-prototype/prototype/sprint1` (Spec v1, manifest v0.2.0).
> Nguyên tắc: KHÔNG rebuild (§3.1) — chỉ patch module/file thực sự bị ảnh hưởng, tái sử dụng journey engine + design tokens đã có.

## 0. Kết luận audit nền tảng hiện có

| Đã có sẵn (giữ & mở rộng) | Vị trí |
|---|---|
| Design tokens (FPT IS blue), globals/layout/components CSS | `shared/styles/*.css` |
| Shared component JS (status-badge, modal, toast, empty/error/loading, permission-state, readiness-banner) | `shared/components/*.js` |
| Config-driven journey engine `ProductJourneyDefinitions` (motor/pa/health) + stage catalog | `shared/mock/seed/journey-registry.js` |
| SalesEntryContext builder + 7 ENTRY_MODES | `shared/mock/seed/journey-registry.js` |
| Status model (submitted lifecycle, warning flags, UW decisions, policy status, VI labels) | `shared/mock/seed/status-model.js` |
| App shell / router / permissions / session-guard / formatters / terminology | `shared/js/*.js` |
| Application workspace: Edit mode (`?step=`) + Tracking mode (`?tab=`) trong **1 module** | `modules/application-workspace/app-workspace.js` |
| Mock seeds: customers, applications, policies, sellers, org-units, commission, insured-units, ocr-policy… | `shared/mock/seed/*.js` |

**→ Nền tảng đã đúng hướng "1 engine + nhiều product config". Rework KHÔNG tạo engine mới; chỉ BỔ SUNG các tầng thiếu.**

## 1. Ma trận Impact theo từng yêu cầu mới

| # | Yêu cầu mới | Behavior hiện tại | Behavior cần đạt | Module/File ảnh hưởng | Reuse | Tạo mới |
|---|---|---|---|---|---|---|
| §4.1 | **ChannelProfile** (BANCA_INTEGRATED / STANDALONE / AGENT_BROKER) | Không có khái niệm channel; entry qua ENTRY_MODES | Thêm channel profile điều khiển entry behavior + customer-selection visibility | `shared/mock/seed/` (new `channel-profiles.js`), `app-shell.js`, `auth` | ENTRY_MODES, SalesEntryContext | `channel-profiles.js`, ChannelProfile resolver |
| §4.2 | **CustomerDataAccessStage** (ANONYMOUS→CONSENT→IDENTIFIED→VERIFIED) + consent gating | Draft ctx đã có `customerId/customerName` (PII lộ từ đầu) | Ẩn PII tới khi consent; anonymous context card; mock PII fetch sau consent | `app-workspace.js`, `advisory-workspace`, `quick-advisory`, new `customer-data-access.js` | draftCtx persistence | `customer-data-access.js`, `CustomerContextCard`, `DataSourceBadge`, `ConsentStatus`, `SensitiveDataNotice` |
| §5/§18 | Luồng chuẩn Banca + **no customer-selection trong happy path** | Có thể vào từ nhiều entry mode; chưa chặn list KH trong BANCA_INTEGRATED | Trong BANCA_INTEGRATED: không list KH, giữ externalCustomerRef xuyên suốt | `seller-workspace`, `advisory-workspace` | router, SalesEntryContext | Guard theo channelProfile |
| §6 | **Quick Advice là demo chính**, recommendation tới cấp package | Có `advisory-workspace` + `quick-advisory` + advice-sessions seed | CTA chính "Tư vấn và bán bảo hiểm"; RecommendationCard đủ 12 field; lưu selectedProduct/Package/version | `seller-workspace` (CTA), `quick-advisory`, `advice-sessions.js` | advice seed, product-schemas | `RecommendationCard`, `PackageCard`, `FitScore`, `SelectedOfferSummary` |
| §7 | **1 workspace xuyên suốt** + routing sau submit (STRAIGHT_THROUGH/UW/MORE_INFO/DECLINED) | app-workspace đã gộp edit+tracking; nhưng redirect list sau nộp chưa chuẩn | Sau submit chuyển MODE/tab theo routing result, không ép về list | `app-workspace.js` | mode switching hiện có | `NextActionPanel`, routing resolver |
| §7.3/§8.3 | **Quote versioning** + SUPERSEDED + re-rate | Có warning flag `QUOTE_NEED_RERATE`; chưa có version model/SUPERSEDED | Quote version selector, clone→SUPERSEDED, policy ref đúng version, cấm sửa premium tay | `app-workspace.js`, `applications.js`, `status-model.js` | WARNING_FLAGS | `QuoteVersionSelector`, `ReRateNotice`, quote-version model |
| §8.1 | **Nav: Trang chủ / Bản chào / Hợp đồng / Đội nhóm / Trợ giúp** (bỏ "chưa nộp/đã nộp" là 2 object) | Manifest có `unsubmitted-applications` + `submitted-applications` là 2 nav item nhóm "BÁN BẢO HIỂM" | Gộp thành 1 object "Bản chào" (list có filter theo nhóm status) | `app-manifest.js`, 2 module list, `app-shell.js` nav | list rendering | Nav config tập trung; gộp list |
| §8.2 | **State model bản chào trung tâm** (16 status → 5 nhóm hiển thị) | APP_STATUS 13 status + STATUS_GROUPS 8 nhóm | Map sang 16 status/5 nhóm (Đang chuẩn bị/Đang xử lý/Chờ KH/Đã phát hành/Không thành công) | `status-model.js` | STATUS_GROUPS pattern | `status-mappings.js` (central) |
| §9.3 | **ConfirmationPaymentPanel dùng chung** Motor+Health, 3 method inline | Payment labels có; UI thanh toán rải trong tracking tab | 1 panel: xác nhận + terms + OTP + fee + 3 PaymentMethodCard inline + history + issue status | `app-workspace.js` tracking | payment labels | `ConfirmationPaymentPanel`, `PaymentMethodCard`, `FeeDueSummary`, `PaymentHistory` |
| §9.4 | **OtpVerificationPanel** dual-mode (SELLER_ASSISTED / CUSTOMER_SELF_SERVICE) | otp label PENDING/VERIFIED | 1 component 2 mode, chỉ đổi actor, không tạo journey khác | `app-workspace.js` | otp labels | `OtpVerificationPanel` |
| §10 | **1 DocumentChecklist + 1 DocumentItem**, OCR cùng layout | ocr-policy seed có; upload rải theo bước | Checklist chung, OCR là trạng thái của item (không section riêng) | `app-workspace.js`, `ocr-policy.js` | ocr seed | `DocumentChecklist`, `DocumentItem`, `OcrReviewPanel`, `DocumentStatusBadge` |
| §11 | **Policy Cockpit** 6 tab chung Motor/Health | `modules/policies` list + có `policy-screen-spec.md` | Cockpit: Tổng quan/Thanh toán/Timeline/Yêu cầu DV/Tổn thất/Tài liệu | `policies` | policies seed | `PolicySummary`, `PolicyTimeline`, `BillingSchedule`, `ServiceRequestList`, `ClaimSummary`, `PolicyDocumentList` |
| §13 | **Manager Workspace**: tách Không gian của tôi/đội nhóm, OrganizationScopeFilter, 2 loại hoa hồng | `team-workspace` + commission + manager-profiles + org-units seed | Tách 2 space, scope filter chung, hoa hồng trực tiếp/thứ cấp tách biệt | `team-workspace`, `seller-workspace` | commission/org seeds | `OrganizationScopeFilter`, dual-commission view |
| §16 | **Config tập trung** (không hard-code trong page) | Journey đã config; nhưng channel/status-map/nav/permission rải rác | Tập trung: channel-profiles, status-mappings, navigation-config, document-matrix, payment-method-config | `shared/mock/seed/`, `shared/js/` | journey-registry | các file config mới |
| §17 | **Runtime permission guard** (7 chiều) | permissions.js + session-guard | Bổ sung check: readiness + product-auth + case-ownership + state + consent + data-scope | `permissions.js`, `session-guard.js`, `authorization-service.js` | có sẵn phần lớn | mở rộng guard |

## 2. Module ảnh hưởng — mức độ

| Module | Mức tác động | Ghi chú |
|---|---|---|
| `shared/mock/seed/*` (foundation) | 🔴 Cao — thêm config mới | channel-profiles, customer-data-access, status-mappings, quote-version, payment-method-config |
| `shared/components/*` | 🔴 Cao — thêm ~25 component | Xem Deliverable B |
| `application-workspace` | 🔴 Cao — thêm consent gating, ConfirmationPaymentPanel, quote version | Không tách module mới |
| `app-manifest.js` + nav | 🟡 Vừa — gộp list, rename | Bản chào/Hợp đồng |
| `unsubmitted/submitted-applications` | 🟡 Vừa — gộp thành "Bản chào" | Giữ logic filter, đổi object framing |
| `policies` | 🟡 Vừa — nâng thành Cockpit 6 tab | |
| `team-workspace` + `seller-workspace` | 🟡 Vừa — tách my/team space | |
| `quick-advisory` / `advisory-workspace` | 🟡 Vừa — RecommendationCard, consent entry | |
| `auth`, `help`, `employee-profile` | 🟢 Thấp — chỉ chỉnh channel/persona setup | |

## 3. Rủi ro & nguyên tắc chống regression
- **Không tạo module list mới** — gộp unsubmitted/submitted bằng filter, tránh page mồ côi.
- **Journey engine trùng lặp**: `journey-registry.js` (ProductJourneyDefinitions) vs `status-model.js` (BANCA.STAGES) đang mô tả stage 2 nơi → hợp nhất về journey-registry, status-model chỉ giữ status/label.
- **PII đang lộ trong draftCtx** (`customerId/customerName`) → phải bọc sau CustomerDataAccessStage, không xóa field nhưng gate hiển thị.
- **applications seed** phải thêm `quoteVersion`/`channelProfile`/`dataAccessStage` với default an toàn để list cũ không vỡ.
