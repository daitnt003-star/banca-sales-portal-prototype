# Deliverable D — Updated Source of Truth Index (Rework v2)

> Cập nhật tài liệu latest + đánh dấu quyết định cũ bị SUPERSEDED (§21.D).
> Ngày: 2026-07-27.

## 1. Tài liệu quyết định (thứ tự ưu tiên)
| Tài liệu | Vai trò | Trạng thái |
|---|---|---|
| `docs/rework-v2/*` (A,B,C,D) | **NGUỒN MỚI NHẤT** cho kiến trúc rework | ✅ ACTIVE |
| `banca-sales-portal/PROJECT_OVERVIEW.md` (Spec v1) | Nghiệp vụ nền tảng Sales Portal | ✅ ACTIVE (nền) |
| `sprint1/docs/module-map.md`, `status-model.md`, `persona-and-permission.md`, `product-overview.md` | Baseline Phase 1 | 🔧 ACTIVE, bổ sung bởi rework-v2 |
| `sprint1/docs/assumptions-and-open-questions.md` | OQ-01..05 | 🔧 xem mục 3 |

## 2. Quyết định cũ bị SUPERSEDED
| Quyết định cũ | Thay bằng | Lý do |
|---|---|---|
| Nav 2 object "Hồ sơ chưa nộp" + "Hồ sơ đã nộp" | 1 object **"Bản chào"** + "Hợp đồng" (§8.1) | Bản chào là object nghiệp vụ; chưa/đã nộp chỉ là filter theo nhóm status |
| PII (customerId/Name) nằm sẵn trong draftCtx từ entry | **CustomerDataAccessStage** gate PII sau consent (§4.2) | Giá trị lõi: không lộ định danh trước khi khách đồng ý |
| Stage mô tả 2 nơi (journey-registry.js + status-model.js BANCA.STAGES) | Hợp nhất về `journey-registry.js`; status-model chỉ giữ status/label | Tránh 3 nguồn sự thật |
| Payment/OTP rải trong tracking tab | **ConfirmationPaymentPanel** dùng chung Motor+Health (§9.3) | 1 nghiệp vụ = 1 component |
| APP_STATUS 13 status (submitted-only) | Quote state model 16 status/5 nhóm bao trùm cả draft→issued (§8.2) | Một state model trung tâm xuyên suốt |
| `entry mode` là trục chính | Bổ sung trục **ChannelProfile** (INTEGRATED/STANDALONE/AGENT_BROKER) điều khiển entry behavior (§4.1) | Nhiều mô hình vận hành trên cùng nền |
| Nav khai báo trong `app-shell.js navItems()` | **`BANCA.NAV_CONFIG`** là nguồn duy nhất; shell chỉ render (2026-07-27) | §16 — không hard-code nav trong shell |
| Nav có group BÁN HÀNG/SAU BÁN/HỖ TRỢ/QUẢN LÝ + mục trùng | Nav **phẳng 5 mục** đúng §8.1; bước hành trình dùng `aliases` để highlight | Bỏ 2 mục trùng (insuranceRequest/management) |
| 2 CTA cùng cấp "Tạo yêu cầu" + "Tư vấn nhanh" | **1 CTA primary** "Tư vấn và bán bảo hiểm" (§6.1/§15.1) | Mỗi màn 1 primary; tư vấn nhanh lên đầu modal |
| `deriveCaseViewState` tự suy luận điều kiện thanh toán | **`paymentEnableRule`** là gate duy nhất, trả `reasons[]` (§9.2) | Disabled CTA luôn có lý do (AC11) |
| Payment method hard-code trong `cpMethodsSection` | **`payment-method-config.js`** (3 method §9.3) + `BANCA.ui.paymentMethodGroup` | Motor/Health dùng chung (AC02) |
| 3 cockpit hợp đồng clone theo sản phẩm + 3 khối `<style>` trùng | **`BANCA.ui.policyCockpit`** 6 tab §11, khác biệt qua cfg | §3.2/§3.3 |
| Điều hướng hợp đồng bằng anchor chip (`#benefits`…) | **6 tab chuẩn** §11 (thêm Yêu cầu dịch vụ, Tổn thất/Bồi thường) | Thiếu 2 nghiệp vụ sau bán |
| Hoa hồng gộp 1 số `commissionSummary().amount` | **`commissionSplit()`** tách `direct` / `override` (§13.3) | "Không cộng thành một số duy nhất" |
| Section "Tài liệu được OCR" riêng (2 nơi) | Tài liệu OCR nằm **cùng checklist**, khác bằng chip + khoá (§10) | "Không tạo section OCR riêng" |

## 3. Open Questions cần chốt trước Phase 2
| OQ | Câu hỏi | Đề xuất mặc định |
|---|---|---|
| OQ-R1 | Channel demo mặc định? | **BANCA_INTEGRATED** (đúng câu chuyện chính) |
| OQ-R2 | Nguồn PII sau consent: mock API cố định? | 1 mock identity-service trả PII theo externalCustomerRef |
| OQ-R3 | Health MVP: gộp 1 policy chung hay per-member? | Theo §12: **1 policy chung**, per-member declaration/doc/e-card |
| OQ-R4 | Giữ module `unsubmitted/submitted` (gộp) hay tạo `offers`? | **Gộp** vào 1 list "Bản chào", giữ file, đổi framing |
| OQ-R5 | Quote version: lưu overlay localStorage như hiện tại? | Có, thêm `versions[]` + `activeVersionId` vào application |

## 4. Kiến trúc mục tiêu (1 nền, nhiều cấu hình — §23)
```
1 design system (tokens) 
+ 1 component library (shared/components) 
+ 1 state model (status-mappings.js) 
+ 1 configurable journey engine (journey-registry.js) 
+ N product (motor/pa/health) 
+ N channel profile (channel-profiles.js)
= Motor / Health / Banca / Agent-Broker chỉ là CẤU HÌNH khác nhau.
```

## 5. Config tập trung cần bổ sung (§16)
| File mới | Nội dung |
|---|---|
| `shared/mock/seed/channel-profiles.js` | 3 channel + entry/visibility rule |
| `shared/mock/seed/customer-data-access.js` | 4 stage + field policy + mock PII fetch |
| `shared/mock/seed/status-mappings.js` | 16 quote status/5 nhóm + payment enable rule |
| `shared/mock/seed/quote-version.js` | version model + re-rate + SUPERSEDED |
| `shared/mock/seed/payment-method-config.js` | 3 method + điều kiện bật |
| `shared/js/navigation-config.js` | nav Bản chào/Hợp đồng/Đội nhóm |
| `shared/mock/seed/document-matrix.js` | requiredWhen theo product |

## 6. Lộ trình (§22) — trạng thái
| Phase | Nội dung | TT |
|---|---|---|
| 0 | Deliverables A–D (docs này) | ✅ Xong |
| 1 | Foundation: channel-profiles, customer-data-access, status-mappings, quote-version, navigation-config + shared components lõi | ✅ Xong — nav & payment gate đã **được page tiêu thụ** (trước đó config tồn tại nhưng không ai gọi) |
| 2 | Banca entry + anonymous context + consent | ✅ Xong (CustomerContextCard/consentGate; BANCA_INTEGRATED bỏ qua chọn khách hàng) |
| 3 | Quick Advice + recommendation cấp package | 🟡 Phần lớn — CTA primary + offerContextStep xong; `PackageComparison`/`FitScore` chưa đóng gói riêng |
| 4 | Quote/Application Workspace + versioning | 🟡 Model versioning + gate xong (đã sửa lỗi re-rate vẫn cho thanh toán); **UI QuoteVersionSelector/ReRateNotice chưa dựng** |
| 5 | Underwriting + OTP + Payment | 🟡 Component đã đóng gói & payment/fee/history đã dùng; **OtpVerificationPanel + UnderwritingStatusPanel chưa thay thế markup inline cũ** |
| 6 | Policy Cockpit + post-sale | ✅ Xong — 6 tab dùng chung Motor/Health/PA + Yêu cầu dịch vụ + Tổn thất/Bồi thường |
| 7 | Dashboard/lists + Manager Workspace | 🟡 Hoa hồng tách 2 loại + bảng nhân viên 16 cột xong; `OrganizationScopeFilter` chưa hợp nhất |
| 8 | Customer self-service + regression toàn hệ thống | ⏳ Chưa |

## 7. Nợ kỹ thuật đã biết (không ẩn)
| Việc | Vì sao chưa làm |
|---|---|
| `OtpVerificationPanel` / `UnderwritingStatusPanel` đã viết nhưng chưa thay markup inline trong `app-workspace.js` | Vùng xác nhận Health per-member phức tạp; thay nóng dễ vỡ luồng đã nghiệm thu. Component sẵn sàng, adopt-on-touch. |
| `QuoteVersionSelector` / `ReRateNotice` (UI) | Model + gate đã chặn đúng; phần UI chọn version cần quyết định UX (drawer hay dropdown trong case header). |
| `OrganizationScopeFilter` hợp nhất (§13.2) | team-workspace đang có selfTab/mgmtTab + scope dropdown riêng cho manager ≥3 cấp. |
| `BANCA.can('VIEW_TEAM_WORKSPACE')` đọc `persona.isManager` trong khi `manager-profiles` mới là nguồn capability | 2 nguồn sự thật về quyền quản lý — cần thống nhất, ảnh hưởng điều hướng nhiều persona. |
| RM-01 là player-coach (`availableScopes` có TEAM) nhưng không có `isManager` → không thấy "Đội nhóm" | Hệ quả của mục trên. |
