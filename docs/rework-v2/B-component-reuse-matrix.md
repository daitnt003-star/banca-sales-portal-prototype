# Deliverable B — Component Reuse Matrix (Rework v2)

> Nguyên tắc (§3.2, §14, §23): 1 nghiệp vụ = 1 component, khác nhau qua props/config/variant/state — KHÔNG clone theo tên sản phẩm.
> Trạng thái: ✅ đã có · 🔧 có 1 phần, cần nâng · 🆕 tạo mới.

## 1. Layout & Shell

| Component | TT | Current (file) | Dùng bởi page | Variants | Visibility rule |
|---|---|---|---|---|---|
| AppShell | ✅ | `shared/js/app-shell.js` | tất cả | — | luôn |
| Sidebar / TopHeader | ✅ | app-shell.js | tất cả | collapsed / expanded | theo persona nav |
| PageContainer / PageHeader / SectionHeader | 🔧 | layout.css (chưa tách component) | tất cả | — | chuẩn hoá thành helper chung |
| ContentGrid | 🔧 | layout.css | tất cả | 1/2/3 col | responsive |
| StickyActionFooter | 🆕 | — | workspace, confirm-pay | primary/secondary CTA | khi có next action |

## 2. Navigation & Journey

| Component | TT | Current | Dùng bởi | Variants | Visibility |
|---|---|---|---|---|---|
| JourneyStepper / JourneyStage | 🔧 | render inline trong app-workspace.js | application-workspace, advisory | edit / tracking; per-stage | `stage.visible` theo ProductJourneyDefinition.hiddenStages |
| TabNavigation | 🔧 | inline tracking `?tab=` | app-workspace, policy cockpit | — | theo mode |
| Breadcrumb / BackLink | 🔧 | app-shell | tất cả | — | luôn |
| NextActionPanel | 🆕 | — | workspace, list detail | pending-me / pending-customer / pending-uw | luôn (chống dead-end §15.3) |

## 3. Context & Dữ liệu (PRIVACY — trọng tâm mới)

| Component | TT | Current | Dùng bởi | Variants | Visibility |
|---|---|---|---|---|---|
| ContextBanner | 🔧 | readiness-banner.js gần giống | workspace, advisory | info/warning | theo state |
| **CustomerContextCard** | 🆕 | — | advisory, quick-advice, workspace | `anonymous` / `identified` / `bank-prefilled` / `manually-entered` | dataAccessStage |
| **DataSourceBadge** | 🆕 | — | mọi field prefilled | bank / ocr / manual / portal | khi field có source |
| **ReadOnlyField** | 🆕 | — | form workspace | readonly / editable | theo permission field-config |
| **SensitiveDataNotice** | 🆕 | — | anonymous stage | — | dataAccessStage=ANONYMOUS |
| **ConsentStatus** | 🆕 | — | advisory→workspace | pending / granted / version+timestamp | luôn sau advice |
| SellerReadinessBadge | ✅ | readiness-banner.js | workspace, team | ready/blocked/conditional | theo readiness |

## 4. Tư vấn & Sản phẩm

| Component | TT | Current | Dùng bởi | Variants | Visibility |
|---|---|---|---|---|---|
| NeedQuestion / ConditionalQuestion | 🔧 | quick-advisory inline | quick-advice | single/multi | theo banking context |
| **RecommendationCard** | 🆕 | — | quick-advice | full (12 field §6.3) | sau khi có advice outcome |
| ProductOfferCard / PackageCard | 🔧 | product-schemas seed | advice, workspace | estimated/selected/final/approved | luôn |
| PackageComparison | 🆕 | — | advice, workspace | 2–4 cột | khi có ≥2 package |
| SelectedOfferSummary | 🆕 | — | workspace header | — | sau chọn package |
| FitScore / BenefitList | 🆕 | — | recommendation | — | trong card |

## 5. Báo giá (Quote)

| Component | TT | Current | Dùng bởi | Variants | Visibility |
|---|---|---|---|---|---|
| QuoteSummary / PremiumBreakdown | 🔧 | app-workspace inline | workspace, confirm-pay | estimated/final | theo stage |
| **QuoteStatusBadge** | 🔧 | dùng StatusBadge chung | list, workspace | 16 status/5 nhóm | central status-mappings |
| **QuoteVersionSelector** | 🆕 | — | workspace | active / superseded | khi có >1 version |
| TermsAndExclusions | 🆕 | — | confirm-pay, quote | có/không loại trừ | khi UW có điều kiện |
| **ReRateNotice** | 🆕 | — | workspace | — | khi data đổi ảnh hưởng phí |

## 6. Form & Đối tượng bảo hiểm

| Component | TT | Current | Variants | Visibility |
|---|---|---|---|---|
| FormSection / FormField | 🔧 layout.css | — | `visibleWhen` config |
| RepeatableGroup | 🆕 | list add/remove | product hỗ trợ multi |
| InsuredPersonCard | 🔧 insured-units seed | primary/member | health multi-insured |
| VehicleCard | 🔧 vehicle-master seed | — | motor |
| RiskQuestionnaire | 🔧 declaration schema | motor/health | theo declarationSchema |

## 7. Tài liệu (1 checklist chung — §10)

| Component | TT | Variants | Visibility |
|---|---|---|---|
| **DocumentChecklist** | 🆕 (ocr-policy seed có data) | — | luôn ở stage DOCUMENTS |
| **DocumentItem** | 🆕 | required/conditional/optional/uploaded/ocr-processing/verified/rejected | `requiredWhen` config |
| DocumentUploader | 🔧 | — | khi item chưa uploaded |
| OcrReviewPanel | 🆕 | confidence high/low | khi item có OCR |
| DocumentStatusBadge | 🔧 StatusBadge | theo trạng thái item | luôn |

## 8. Thẩm định (Underwriting)

| Component | TT | Variants | Visibility |
|---|---|---|---|
| UnderwritingStatusPanel | 🆕 | STP/manual/more-info/approved-cond/declined | postSubmit + underwritingMode |
| UnderwritingDecision | 🔧 UW_DECISIONS seed | approved/loading/exclusion/condition/rejected | khi có kết quả |
| RequirementList | 🆕 | — | MORE_INFORMATION_REQUIRED |
| ConditionAcceptance | 🆕 | — | APPROVED_WITH_CONDITION |

## 9. Xác nhận & Thanh toán (1 panel chung Motor+Health — §9.3)

| Component | TT | Variants | Visibility |
|---|---|---|---|
| **ConfirmationPaymentPanel** | 🆕 | motor / health (chỉ data khác) | mode=confirmation/payment |
| **OtpVerificationPanel** | 🆕 | `SELLER_ASSISTED` / `CUSTOMER_SELF_SERVICE` | khi cần OTP |
| **PaymentMethodGroup** | 🆕 | — | luôn (3 method inline, không modal) |
| **PaymentMethodCard** | 🆕 | `QR` / `payment-link` / `seller-assisted` | method được config bật |
| FeeDueSummary / PaymentHistory | 🆕 | — | luôn trong panel |
| PaymentStatusBadge | 🔧 StatusBadge | pending/success/failed/expired/timeout | luôn |

## 10. Hợp đồng (Policy Cockpit — §11)

| Component | TT | Dùng bởi | Visibility |
|---|---|---|---|
| PolicySummary | 🆕 | tab Tổng quan | luôn |
| PolicyTimeline | 🆕 | tab Dòng thời gian | luôn |
| BillingSchedule | 🆕 | tab Thanh toán | luôn |
| ServiceRequestList | 🆕 | tab Yêu cầu DV | luôn |
| ClaimSummary | 🆕 | tab Tổn thất | luôn |
| PolicyDocumentList | 🆕 | tab Tài liệu | luôn |

## 11. Manager (§13)

| Component | TT | Variants | Visibility |
|---|---|---|---|
| OrganizationScopeFilter | 🆕 (org-units seed có) | area/branch/dept/team/seller | manager persona |
| MemberTable | 🔧 team-workspace | — | VIEW_TEAM_WORKSPACE |
| DualCommissionView | 🆕 (commission seed có) | direct / secondary-override | manager |

## 12. Trạng thái hệ thống

| Component | TT | File |
|---|---|---|
| LoadingState / Skeleton | ✅ | loading-skeleton.js |
| EmptyState | ✅ | empty-state.js |
| ErrorState | ✅ | error-state.js |
| PermissionDenied | ✅ | permission-state.js |
| ExpiredState | 🆕 | — |
| SuccessResult | 🆕 | — |
| Toast | ✅ | toast.js |
| ConfirmDialog / Modal | ✅ | modal.js |

## Tổng kết đếm
- ✅ Có sẵn tái dùng: **12**
- 🔧 Có 1 phần, cần nâng cấp/chuẩn hoá: **20**
- 🆕 Cần tạo mới: **~30** (ưu tiên: CustomerContextCard, DataSourceBadge, ConsentStatus, ConfirmationPaymentPanel, PaymentMethodCard, OtpVerificationPanel, DocumentChecklist/Item, QuoteVersionSelector, NextActionPanel, StickyActionFooter, Policy Cockpit set)

**Không tạo:** `motor-payment-card`, `health-payment-card`, `motor-document-upload`, `health-*` clone — tất cả dùng component chung + config.
