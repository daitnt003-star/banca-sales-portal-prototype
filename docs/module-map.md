# Module Map — Verified Implementation Inventory

**Reconciled:** 2026-07-30 (against actual `sprint1/` source)
**Status:** Implementation inventory / navigation reference — reflects the built baseline.

> **Reconciliation note (2026-07-30).** The previous version of this file (preserved below from
> "§ Historical Phase-1 plan") was an **outdated pre-implementation KEEP/PATCH/NEW plan** written
> before code existed. It no longer matched the built baseline. This top section replaces it as the
> **verified inventory** of what is actually implemented.
>
> - **`BUILD-SPECIFICATION.md` remains the build contract** (what must be built + acceptance).
> - **This file is an implementation inventory / navigation reference only** — it describes what
>   currently exists, not what is contractually required.
> - Where the two disagree, see "§ Contradictions vs build contract" — those are reported, NOT
>   silently reconciled, and the build spec is left unchanged pending user decision.

---

## A. Verified module inventory (12 module folders)

**Authoritative nav source at runtime = `shared/js/navigation-config.js`** (`BANCA.NAV_CONFIG`).
`app-manifest.json` is **stale** (older labels, missing `quick-advisory`/`advisory-workspace`) — see
contradiction C5.

Status legend: **IMPLEMENTED** (functional-mock, renders via shared `shell()`/`BANCA.ui.*`) ·
**SUPERSEDED** (folder removed) · **PLACEHOLDER** · **P1** (deferred by build contract).

| # | Module (folder) | Status | Nav placement (live config) | Route / entry | Notes |
|---|---|---|---|---|---|
| 1 | `auth` | IMPLEMENTED | `dev` — "Demo setup / Persona" | `modules/auth/index.html` (+auth.js/.css/.mock.js) | Persona + channel switcher, access validation, demo-state reset. `status: skeleton+functional-mock`. |
| 2 | `seller-workspace` | IMPLEMENTED | `primary` — "Trang chủ" (`defaultModule`) | `modules/seller-workspace/index.html` (+js/css/mock) | Home: KPI strip, offers-recent, need-more-info, processing, policies, notifications. |
| 3 | `quick-advisory` | IMPLEMENTED | `primary` — "Tư vấn nhanh" (`sellingOnly`) | `modules/quick-advisory/index.html` | **Not in `app-manifest.json`.** Standalone advisory entry (see C3). |
| 4 | `advisory-workspace` | IMPLEMENTED | **none** (not in nav-config nor manifest) | `modules/advisory-workspace/index.html` | Deep advisory flow (1202 lines, inline styles). Reached from `app-shell.js` / quick-advisory (see C3). |
| 5 | `unsubmitted-applications` | IMPLEMENTED | `primary` as **"Bản chào"** (id `offers`), PREPARING lifecycle | `modules/unsubmitted-applications/index.html` | Thin wrapper over `quote-list-shell`. Filter by `currentStage`. |
| 6 | `submitted-applications` | IMPLEMENTED | under **"Bản chào"** (PROCESSING/WAIT_CUST/ISSUED/FAILED lifecycles) | `modules/submitted-applications/index.html` | Thin wrapper over `quote-list-shell`. Not a separate primary nav item. |
| 7 | `application-workspace` | IMPLEMENTED | `hidden` | `modules/application-workspace/index.html` (+app-workspace.js) | Core Edit/Tracking workspace; Motor journey, rating, docs, payment, timeline. `owns: Application/Quote/SalesCase`. |
| 8 | `policies` | IMPLEMENTED | `primary` — "Hợp đồng" | `modules/policies/index.html` | **Policy list + Policy Detail (Policy Cockpit) merged in one module** (`?view/id`). No separate `policy-detail` folder. |
| 9 | `team-workspace` | IMPLEMENTED | `primary` — "Đội nhóm" (`VIEW_TEAM_WORKSPACE`) | `modules/team-workspace/index.html` | Manager overview/pipeline/seller-perf/needs-help + commission KPIs. |
| 10 | `help` | IMPLEMENTED | `primary` — "Trợ giúp" | `modules/help/index.html` | FAQ + contact. **Exists in P0 baseline** — contradicts build contract OQ-BUILD-03 (see C4). |
| 11 | `employee-profile` | IMPLEMENTED | `avatar` — "Hồ sơ nhân viên" | `modules/employee-profile/index.html` | **Merge DONE**: seller-profile + seller-readiness + product-access → 3 tabs (info/certs/products). |
| — | `seller-profile`, `seller-readiness`, `product-access` | **SUPERSEDED** | removed | — | Folders deleted; listed in `app-manifest.json.removedModules`. Merged into `employee-profile`. |

**Component (not a page):** Start-Sale = `shared/components/sales-context-offer.js` (entry-mode/offer
context). Build spec calls this `start-sale-modal` — implemented as a shared component, as intended.

**Dev tooling:** `dev/state-gallery.html`, `dev/design-reference.html` (token reference).

## B. Shared layer (verified present)

- `shared/js/`: `app-manifest.js, app-shell.js, formatters.js, head-loader.js, mock-store.js,
  navigation-config.js, navigation.js, permissions.js, router.js, session-guard.js, terminology.js`.
- `shared/components/`: `confirm-payment, empty-state, error-state, foundation-components,
  loading-skeleton, modal, notification-drawer, permission-state, policy-cockpit, quote-list-shell,
  readiness-banner, sales-context-offer, status-badge, toast`.
- `shared/styles/`: `tokens.css, globals.css, layout.css, components.css` (+ `.bak`).

## C. Contradictions vs build contract (REPORTED — build spec left unchanged)

These are real divergences between the **built baseline** and `BUILD-SPECIFICATION.md` /
`PROJECT_OVERVIEW.md`. Per task constraint, they are reported here and **not** auto-reconciled; the
build spec is untouched pending user decision.

| ID | Baseline reality | Build-contract expectation | Type |
|---|---|---|---|
| **C1** | Single **"Bản chào" (Offers)** nav object with 5 status-group filters (PREPARING/PROCESSING/WAIT_CUST/ISSUED/FAILED); unsubmitted+submitted are lifecycle views under it. | Two separate menu items **"Hồ sơ chưa nộp"** + **"Hồ sơ đã nộp"** (BUILD-SPEC §2 M04/M05, PROJECT_OVERVIEW §II). | Navigation model |
| **C2** | Terminology = **"Bản chào / Yêu cầu bảo hiểm"** (via `terminology.js`, `BRIEF-TERMINOLOGY.md`). | Terminology = **"Hồ sơ / HSYCBH"**. | Wording |
| **C3** | **`quick-advisory`** is a primary nav item + **`advisory-workspace`** deep flow exist as modules. | "Tư vấn nhanh" is only entry-mode #3 inside the Start-Sale modal, not standalone nav. | Scope/structure |
| **C4** | **`help`** fully implemented and in primary nav in P0. | Standalone Help **deferred to P1** (OQ-BUILD-03); P0 = in-context help only. | Scope/phase |
| **C5** | Two nav sources disagree: `navigation-config.js` (live) vs stale `app-manifest.json`. | Single coherent nav registry. | Source inconsistency |
| **C6** | Baseline already includes commission/KPI, channel switcher, NTH/mortgage flow, document matrix. | These are beyond the documented P0 build-spec module scope. | Scope-ahead |

> **Action required from user:** decide per-contradiction whether the build spec should be updated to
> match the baseline, or the baseline realigned to the spec. Until then, BUILD-SPECIFICATION.md is
> unchanged (task constraint: report contradictions, do not modify the contract).

---

## § Historical Phase-1 plan (SUPERSEDED — kept for provenance)

> The content below is the original pre-implementation KEEP/PATCH/NEW plan and the 2026-07-20/21
> batch changelog. Retained as history. For current state use §A–§C above.

## 1. Module hiện có trong `sprint1/modules/`

| Module | Trạng thái hiện tại | Quyết định | Việc cần làm (Phase 4, chưa làm ở Phase 1) |
|---|---|---|---|
| `auth` | skeleton+functional-mock | **KEEP** | Không đổi. Có thể cần thêm persona Team Leader/Branch Manager/inactive vào switcher. |
| `seller-workspace` | skeleton+functional-mock — chỉ có readiness summary, chưa có Work Queue/hồ sơ/hợp đồng | **EXTEND** (đổi tên nghiệp vụ → "Trang chủ") | Bổ sung: Hồ sơ chưa nộp gần đây, Hồ sơ cần bổ sung, Theo dõi xử lý, Hợp đồng, Thông báo, Hiệu suất nhanh, nút "Bắt đầu bán hàng". Giữ phần readiness summary hiện có nếu còn phù hợp làm 1 khối nhỏ, hoặc chuyển nội dung đó vào Employee Profile. |
| `seller-profile` | skeleton+functional-mock, đứng riêng trong navGroup "business" | **MERGE → employee-profile** | Gộp cùng seller-readiness + product-access thành 1 module `employee-profile` với 3 tab. Route: chỉ mở từ avatar dropdown, KHÔNG còn ở menu chính. |
| `seller-readiness` | skeleton+functional-mock, đứng riêng | **MERGE → employee-profile** (tab "Chứng chỉ & đào tạo") | Như trên. |
| `product-access` | skeleton+functional-mock, đứng riêng | **MERGE → employee-profile** (tab "Sản phẩm bán hàng") | Như trên. |

> ⚠️ Đây là thay đổi kiến trúc thật (3 module → 1), không phải patch nhỏ. Theo Mode D (Change Shared Foundation) của Portal Prototype Builder: cần xác nhận trước khi merge vì ảnh hưởng `app-manifest.json` navigation + có thể có link trỏ tới 3 route cũ.

## 2. Module cần tạo mới (NEW) — theo P0 spec v1

| Module mới | Tương ứng trong PROJECT_OVERVIEW.md v1 | Ghi chú |
|---|---|---|
| `start-sale` (component, không phải page riêng) | Mục III/VII | Modal/side-panel dùng chung, gọi từ Home, Hồ sơ chưa nộp, Hồ sơ đã nộp, Hợp đồng, Manager Workspace |
| `unsubmitted-applications` | Hồ sơ chưa nộp | List + filter theo `current_stage` |
| `application-workspace` | Application Workspace (2 mode: Edit/Tracking) | Module trọng tâm nhất, chứa journey stepper Motor P0 |
| `submitted-applications` | Hồ sơ đã nộp | List + filter theo `application_status` |
| `policies` | Hợp đồng | List + quick filter Mới phát hành/Đang hiệu lực/Sắp tái tục |
| `policy-detail` | Chi tiết hợp đồng | Có thể gộp view vào `policies` bằng `?view=detail&id=` theo convention Portal Prototype Builder, cân nhắc ở Phase 3 |
| `team-workspace` | Đội nhóm (Manager) | Chỉ hiện Team Leader/Branch Manager |
| `help` | Trợ giúp | P1 nếu cần ưu tiên transaction flow trước (theo PROJECT_OVERVIEW.md v1 mục 12) |

## 3. Shared components cần thêm (chưa có trong `shared/components/`)

Hiện có: `notification-drawer, status-badge, readiness-banner, permission-state, empty-state, error-state, loading-skeleton, modal, toast`.

Cần thêm cho P0 mới:

| Component mới | Dùng cho |
|---|---|
| `start-sale-modal.js` | 5 entry mode + product/offer selection |
| `data-table.js` | Hồ sơ chưa nộp/đã nộp, Hợp đồng, Team seller list |
| `filter-bar.js` | Primary/secondary filter tất cả list page |
| `journey-stepper.js` | Application Workspace — left stepper |
| `document-uploader.js` | Bước Tài liệu trong journey |
| `timeline.js` | Tracking Mode — tab Lịch sử |
| `drawer.js` | Lịch sử báo giá (quote version), requested changes |

> Kiểm tra lại `modal.js` hiện có trước khi tạo `drawer.js` — nếu modal đã đủ generic có thể tái dùng, tránh trùng component (nguyên tắc "check existing component system before creating new").

## 4. Shared mock cần thêm (`shared/mock/`)

Hiện có seed: `sellers.js, products.js, licenses.js, trainings.js, authorizations.js` + scenarios theo persona readiness.

Cần thêm mock domain mới:

```text
seed/customers.js
seed/referrals.js
seed/sales-cases.js
seed/applications.js
seed/policies.js
seed/notifications.js
handlers/sales-case-service.js
handlers/application-service.js
handlers/policy-service.js
```

Nguyên tắc: seller/product canonical records giữ nguyên ID hiện có (RM-01, RM-02...), không tạo bản sao trùng.

## 5. `app-manifest.json` — thay đổi cần Phase 3 áp dụng

- Xóa 3 entry `seller-profile`, `seller-readiness`, `product-access` khỏi `navGroup: "business"`.
- Thêm 1 entry `employee-profile` với `navGroup: "avatar"` (route mới, không hiện sidebar chính).
- Thêm entry mới: `unsubmitted-applications`, `submitted-applications`, `application-workspace`, `policies`, `team-workspace` (permission `VIEW_TEAM_WORKSPACE`, chỉ Team Leader/Branch Manager), `help`.
- Cập nhật `defaultModule` nếu Home (`seller-workspace`) đổi nội dung đáng kể — có thể giữ nguyên default.

(Chỉ liệt kê ở đây — KHÔNG sửa file thật trong Phase 1.)

---

## Update 2026-07-20 15:xx — Backlog hoàn thiện (P0-1..P0-12, P1, P2)

**Data layer:**
- `seed/vehicle-master.js` (MỚI): master hãng/dòng/loại xe + `motorPackages` (BASIC/STANDARD/PREMIUM theo code, coverageList lõi) + `motorAddOns` (GLASS/HYDRO_LOCK/FLOOD) + `deductibleOptions` + `rateMotor()` (base→adjustments→adjusted) + `quoteStatus()` computed (ACTIVE/EXPIRING_SOON/EXPIRED/STALE, giờ Asia/Saigon) + `inputHashOf()`.
- `applications.js`: quote nâng shape P0-1 (`inputsSnapshot`, `inputHash`, `basePremium`, `adjustedPremium`, `adjustments[]`, `versions[]`); vehicle thêm `engineNo`, `seats`. Premium seed đồng bộ với rating engine (card = báo giá).
- `status-model.js`: thêm `BANCA.LABELS` + `BANCA.label()` (P1-3 — không còn enum SNAKE_CASE trên UI).
- `shared/js/mock-store.js` (MỚI): localStorage overlay (`patchApp`, `addPolicyDemo`, `resetDemo`) — thao tác demo persist qua reload; Reset ở trang Demo setup.

**Workspace (application-workspace):**
- P0-2 combobox master data + "Tạo mới" in-session, engineNo/seats, hint giá trị xe.
- P0-3 controls thời hạn/khấu trừ/add-on/IDV; khối phí base→lý do điều chỉnh→adjusted; card gói = giá tham khảo khớp engine.
- P0-4 quote.status computed + markStale + Tính phí lại (version mới, cũ SUPERSEDED, validUntil +3 ngày, xóa cờ).
- P0-5 GPLX (DRIVER_LICENSE) bắt buộc. P0-6 disable Nộp + tooltip lý do.
- P0-7 (user chốt): INSURED_PARTY thu gọn thành dòng "chính chủ" ở bước KH; stepper hiển thị "(tự động)"; điều hướng bỏ qua.
- P0-8 (user chốt): payment theo phương thức — QR→success (gộp PAID→ISSUED, sinh policy), Thẻ→FAILED rồi Retry success, CK→TIMEOUT; Retry chỉ hiện sau fail; breakdown phí; hạn thanh toán.
- P0-9 GCN preview inline 2 phần (TNDS 150tr/100tr + vật chất IDV/khấu trừ/add-on/PA) tab Hợp đồng.
- P0-10 + P1-4 timeline 4 trạng thái icon/màu: done ✓ / waiting ⏳ / auto ⚙ "Không yêu cầu (auto)" / na —.
- P1-2 SĐT mask + "Hiện số"/"Gọi" (log console). P2-1 sticky summary header. P2-2 empty state có CTA. P2-3 SLA màu.

**Lists:** P0-11 (chưa nộp): search KH/SĐT/mã + filter sản phẩm + date range + cột SĐT + bỏ nút Xem + click dòng mở. P0-12 (đã nộp): + filter UW decision. P2-4 badge Janus Bank.

**Home:** P1-1 khối "Báo giá sắp/đã hết hạn" với CTA Tính phí lại → thẳng step PACKAGE_AND_QUOTE.

---

## Update 2026-07-20 16:xx — Batch v3 (NĐBH ẩn, waterfall phí, ma trận tài liệu, thế chấp/NTH, SMS)

- **Stepper**: INSURED_PARTY ẨN HẲN (user đổi quyết định P0-7) — Motor còn 6 bước; dòng "Người được bảo hiểm: chính chủ (tên KH)" trong bước KH (đã rút gọn).
- **Combobox → input+datalist**: Hãng/Dòng (lọc theo hãng)/Loại/Mục đích/Số chỗ — search ra option, gõ mới + Enter tự insert in-session, bỏ nút "Tạo mới".
- **Công thức thác nước** (`rateMotor` v2): Khối 1 TNDS cố định (BANCA.TPL_PREMIUM=480.700đ) tách riêng · Khối 2 Vật chất: OD gốc + add-on (TIỀN từng dòng) + điều chỉnh = **Subtotal** − **NCD (trên subtotal gồm add-on — user chốt)** + **VAT 10%** = Phí phải đóng. Alias basePremium/adjustedPremium giữ tương thích. Seed resync. Hydrate on-load cho quote cũ.
- **Add-on UX**: hiện số tiền + "(bỏ chọn để không mua)" · dirty state KHÔNG reload (quote mờ 45%, tổng gạch ngang, badge STALE, dòng "Phí sẽ thay đổi — bấm Tính phí", nút Tính phí đỏ nổi bật) · nút "Khôi phục mặc định gói" · đổi gói reset add-on theo gói mới + alert thông báo · tên gói "(đã tùy chỉnh)" khi lệch default.
- **Ma trận tài liệu ●◐↻○** (`BANCA.DOC_CATALOG` + `docRequirements(ctx)` + `missingRequiredDocs`): 9 tài liệu, resolve theo source (cấp mới/tái tục), tuổi xe, IDV, thế chấp. GPLX hạ xuống ◐ không kích hoạt (chỉ bắt buộc ở claim — theo ma trận, thay P0-5 cũ). Tab Tài liệu chia 2 bảng: "Bắt buộc cho hồ sơ này (x/y)" + "Tài liệu khác"; legend 4 trạng thái.
- **Luồng xe thế chấp/NTH** (single source of truth): field duy nhất ở RISK_OBJECT (select Có/Không + block NTH: ngân hàng/chi nhánh/số HĐ tín dụng + cảnh báo hệ quả) · câu hỏi trùng ở Khai báo rủi ro GỠ BỎ → dòng derived read-only · BENEFICIARY ◐→active khi thế chấp (chặn nộp nếu thiếu) · guard nộp thêm check đủ thông tin NTH · GCN in điều khoản thụ hưởng (tổn thất toàn bộ trả ngân hàng trước) · đổi cờ → QUOTE_NEED_RERATE · renewal có nhắc "hỏi lại, không kế thừa". Seed: DRAFT-2026-002/007 có mortgage object.
- **SMS**: tab thanh toán (chưa SUCCESS) có textarea nội dung prefill + nút Gửi SMS; log persist overlay (__smsLog).
- **Payment breakdown** cập nhật theo waterfall (TNDS/OD/add-on/Subtotal/NCD/VAT).

---

## Update 2026-07-20 17:xx — Batch v4

- **Filter drawer** (shared `filterDrawer()` trong app-shell): 2 list ngoài chỉ giữ pills + search + nút "⚙ Bộ lọc" (badge số filter active); các filter khác trong drawer phải; filter active hiện tag × bỏ nhanh + "Bỏ tất cả".
- **Policy detail v2** theo docs/policy-screen-spec.md: A1-A9 đủ (NTH, VIN/số máy/số chỗ, IDV/khấu trừ/NTX kèm số tiền, loại trừ + wording ref, breakdown thác nước từ hồ sơ gốc, NCD tier, endorsement/claim/audit history, hóa đơn VAT) + action bar 4 nhóm (Chính/Vòng đời/Liên kết/Vận hành) hiện theo trạng thái — Tái tục disabled ngoài renewal window, mô tả nghiệp vụ đúng (tái tục=đơn mới, endorsement=cùng số đơn, hủy=cần đồng ý NTH).
- **Auto-rerate**: đổi add-on/khấu trừ/thời hạn → tự tính phí lại ngay (autoRerate), nút "Tính phí lại" chỉ hiện khi quote EXPIRED/STALE từ seed.
- **NTH rework** theo docs/nth-mortgage-flow.md bản sửa 17:04: câu hỏi mới "xe làm tài sản thế chấp/bảo đảm" + note tín chấp; field Loại bên thụ hưởng đứng đầu; danh mục bên cho vay gồm cty tài chính/leasing; note leasing + note cấm derive từ Seller; GCN "trả bên thụ hưởng (...) trước"; bỏ dòng cảnh báo hệ quả ①②③.
- **Cache-bust**: head-loader thêm ?v= + module html trỏ head-loader.js?v=2 (fix browser cache seed cũ).
- Policies seed enrich: JB-POL-2026-0207 + JB-POL-2025-0102 có idv/deductible/addOns/ntx/ncdTier/exclusions/endorsements/claims/audit/vatInvoice.

---

## Update 2026-07-20 17:50 — Batch v5 (Submitted detail + Policy detail UX)

### Submitted application tracking detail
- Added `shared/mock/seed/submitted-enrichment.js` loaded by head-loader after base seed.
- Enrichment adds: submitted quote waterfall (rateMotor) for all submitted apps; KYC idNumber/address to customers; declaration answers; UW officer/note; NTH demo case `APP-2026-103` with `Vietcombank` (different from Seller Janus Bank) to demonstrate independent beneficiary.
- `application-workspace` tracking tabs updated:
  - Overview: SI/IDV, deductible, add-ons, vehicle/VIN/engine/seats, source/seller, NTH, full read-only case summary.
  - Customer: CCCD/MST + address + NTH; explicit note Seller/channel must not derive NTH.
  - Quote: IDV separated from vehicle value, deductible, add-ons, waterfall breakdown, benefits with amounts.
  - Declaration: all questions + answers + UW flag badges + derived mortgage/NTH row.
  - Documents: rule-engine matrix classification + Open/Download actions + verification status.
  - Underwriting: officer, note, loading/exclusion/condition, new premium.

### Policy detail UI redesign
- Added top summary card strip: Total premium/year, IDV, deductible, days remaining.
- Added sticky anchor nav to sections: parties, vehicle, benefits, terms, fees, related docs, history.
- Rebuilt action area using status/action matrix: primary/secondary/more/conditional/hidden by status bucket (active, near expiry, expired, cancelled), with expandable matrix table.
- Replaced quick links with section `Tài liệu liên quan`: GCN PDF, policy wording, source application, VAT invoice, UW letter; each has Open/Download/Send customer actions.
- Existing A1-A9 policy fields retained.
- Cache-bust bumped: module pages `head-loader.js?v=3`, internal `V='v=20260720e'`.

### Update 2026-07-20 18:15 — Policy Detail layout refinement
- Reordered detail screen: top action row (`← Danh sách hợp đồng` + status-driven actions) → policy identity card → summary cards → sticky section tabs.
- Section tabs now show hint “Click từng mục để cuộn nhanh…” and use equal-width grid layout.
- Removed visible action matrix table; actionRules remain internal mapping only.
- “Khác” now opens an absolute dropdown menu.
- Fees/payment section merged into one card: premium breakdown followed by payment history.
- Related documents now render as hyperlinks only: page links navigate; file links use `download` semantics with demo alert. Open/Download buttons removed.
- Cache-bust bumped to `v=20260720f`.

### Update 2026-07-20 18:15 — Policy detail layout refinement
- Detail top order changed to: Back/action row → Policy identity header → Summary cards → sticky section nav → sections.
- Action buttons are same level as back link; `Khác` is dropdown. Visible matrix removed; action matrix remains internal mapping only.
- Section nav shows hint and evenly distributed tabs.
- `Phí & thanh toán` merged into one card containing fee breakdown and payment history.
- `Tài liệu liên quan` now renders hyperlinks: page links navigate; file links use download behavior. Open/Download buttons removed.

---

## Update 2026-07-21 09:45 — PO review fixes + Commission visibility

### P0/P1 review fixes
- Fixed APP-2026-104 source/seller fallback so UI does not leak `undefined`.
- Synchronized supplement vs documents for APP-2026-104: supplement now asks only for photos; document tab shows REG/INSPECT/ID submitted and PHOTOS missing/not verified.
- Removed `RLxxxx-demo` as a real VIN value; empty VIN field now shows instructional hint instead.
- KPI contrast improved via token override for `.kpi-strip .kpi` and `.hero .kpi-strip`.
- Sidebar navigation now uses `window.location.assign(...)` for robust high-level route changes.
- PII masking restored by default: phone and CCCD/MST masked; explicit reveal links log demo audit to console.
- Quote rating now shows loading/progress text and disables button before saving/reloading.

### Commission model and UI
- Added `shared/mock/seed/commission.js` and loaded it from `head-loader.js`.
- Commission is read-only accrued estimate for current calendar month, synced to `partnerConfig.syncAt = 20/07/2026 11:30`.
- Rates are configurable by `product × package × channel` with validity period; not hard-coded in rating engine.
- Commission base uses transparent prototype assumption excluding VAT; real system should use Core fee waterfall.
- Feature flags: `commissionModule.enabled` and `kpiModule.mode = full | readonly-summary | off`.
- Home KPI row now has five cards: Premium tháng này → Hoa hồng dự kiến tháng này → Policy issued → Conversion → Target. Commission card links to contributing policy list context.
- Team quick view adds `Hoa hồng đội/chi nhánh dự kiến`.
- Application Workspace tab Hợp đồng shows `Hoa hồng dự kiến` after policy issuance.
- Manager Workspace adds commission KPI, seller table column, and a `Hoa hồng` table by seller.

### Cache/validation
- Module pages now load `head-loader.js?v=6`; internal cache-bust is `v=20260721b`.
- Syntax checks passed for changed JS and inline scripts.
- Browser smoke passed for Home, APP-2026-104 overview/documents/customer, DRAFT RISK_OBJECT, APP-2026-110 policy tab, Team Workspace.

---

## Update 2026-07-21 11:12 — Policy Detail UX redesign (Policy Cockpit)

User requested using UI/UX/design skill because the previous Policy Detail layout was information-heavy and not user-friendly.

### UX artefacts
- Added/updated canonical UX docs:
  - `docs/ux/document-registry.json`
  - `docs/ux/pages/policy-detail-page-spec.md`
  - `docs/ux/ux-change-log.md`

### UI implementation
- Refactored `modules/policies/index.html` Policy Detail from long stacked tables into a **Policy Cockpit** layout:
  - top command row: back + status-driven actions + dropdown `Khác`;
  - policy hero: policy id/status/GCN/product/customer/vehicle;
  - five summary cards: premium, IDV, deductible, days remaining, commission;
  - sticky section nav;
  - main content column: benefits, fees/payment, related documents, terms, history;
  - sticky side rail: parties, vehicle/term, NTH, commission, operational note.
- Related documents remain hyperlink-on-name; no `Liên kết` column.
- Commission is visible both in summary and side rail.
- Dense endorsement/claim details moved under details disclosure inside timeline section.
- Responsive fallback stacks side rail below main content on narrower viewport.

### Cache/validation
- Module pages load `head-loader.js?v=8`; internal cache-bust is `v=20260721d`.
- Syntax check passed; browser smoke confirmed `.policy-cockpit`, `.pc-grid`, `.pc-rail`, 5 summary cards, commission, benefit section, and document name links on `JB-POL-2026-0207`.

### Update 2026-07-21 11:44 — Layout consistency continuation
- Application Workspace submitted Overview: moved `Tiến trình` from below the summary table into a right sticky column parallel to `Tổng quan hồ sơ`.
- Submitted list render regression fixed (`all.length` instead of undefined `base.length`).
- Cache-bust bumped to `head-loader.js?v=10` / `v=20260721f`.
