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
| 1 | Foundation: channel-profiles, customer-data-access, status-mappings, quote-version, navigation-config + shared components lõi | ⏳ chờ duyệt |
| 2 | Banca entry + anonymous context + consent | ⏳ |
| 3 | Quick Advice + recommendation cấp package | ⏳ |
| 4 | Quote/Application Workspace + versioning | ⏳ |
| 5 | Underwriting + OTP + Payment (ConfirmationPaymentPanel) | ⏳ |
| 6 | Policy Cockpit + post-sale | ⏳ |
| 7 | Dashboard/lists + Manager Workspace | ⏳ |
| 8 | Customer self-service + regression toàn hệ thống | ⏳ |
