# Feature handoff

Status: BLOCKED_QC_RECURRING
Owner: Codex
Implementer: Claude

## Goal

Đảm bảo lựa chọn sản phẩm/gói tại bước `Khách hàng & phương án` được dùng xuyên suốt
tại bước `Gói & báo giá`, nơi người dùng xem lại đầy đủ phí, quyền lợi, điều khoản,
loại trừ và tác động của khai báo rủi ro; đồng thời cho phép đổi sản phẩm bằng một
luồng reset dữ liệu an toàn.

## Actor and permissions

- Nhân viên tư vấn sở hữu Draft và có `can_quote`: được chọn/đổi sản phẩm, gói và
  tính phí.
- Read-only: chỉ xem cấu hình và báo giá; không có CTA thay đổi.
- Sản phẩm bị khóa bởi hệ thống nguồn/renewal: không có CTA đổi sản phẩm.
- Không thay capability hay permission source.

## Source-of-truth references

- `docs/rework-v2/D-source-of-truth-index.md`, Phase 3–4.
- `docs/rework-v2/B-component-reuse-matrix.md`, package comparison/quote workspace.
- `docs/rework-v2/C-state-transition-map.md`, quote version và payment gate.
- `shared/mock/seed/journey-registry.js`, journey riêng Motor/PA/Health.
- `shared/mock/seed/product-schemas.js`, canonical package/rating/risk definitions.
- `.ai/governance/uiux-safety-contract.md`.

## Root cause

`sales-context-offer.js` đang dùng `PACKAGE_CATALOG` minh họa với package id khác
canonical catalog (`PA_10` ≠ `PA_BASIC`, `H_STD` ≠ `HEALTH_STD`, ...), và
`selectPackage()` chỉ lưu `selectedPackageId`. Bước báo giá lại đọc `app.package`
và canonical package objects, nên lựa chọn ở bước trước không được kế thừa.

## Scope in

- Bước `Khách hàng & phương án` dùng canonical package code/metadata của từng sản phẩm.
- Chọn gói phải persist tối thiểu `app.package`, `packageCode`,
  `selectedPackageId` cùng canonical code; add-on chỉ giữ mục tương thích.
- PA/Motor/Health bước báo giá đọc đúng gói đã chọn:
  - gói đã chọn là primary;
  - các gói khác thu gọn trong disclosure hiện có;
  - không render ba gói ngang hàng khi đã có lựa chọn.
- Gói primary hiển thị:
  - sản phẩm/gói, thời hạn/phạm vi;
  - tổng phí và breakdown hiện có;
  - toàn bộ quyền lợi/hạn mức;
  - điều khoản, loại trừ mặc định;
  - phụ phí/chênh lệch, referral/thẩm định, điều kiện/loại trừ/yêu cầu bổ sung
    có thể suy ra trực tiếp từ canonical rating/validation/risk data.
- Không bịa phụ phí hoặc quyết định underwriting chưa tồn tại; nếu rủi ro chỉ kích
  hoạt referral thì ghi rõ `Phí hiện tại chưa bao gồm điều chỉnh sau thẩm định`.
- Thêm CTA secondary `Đổi sản phẩm` tại bước báo giá khi không bị khóa và không
  read-only; CTA quay về `CUSTOMER_INFO`, nơi catalog sản phẩm hiện có được dùng.
- Sửa `switchProduct()` thành transition có xác nhận và reset dữ liệu phụ thuộc.
- Loại bỏ các alert thuần mô tả kỹ thuật:
  - `Người được bảo hiểm (...) — journey riêng...`
  - `Câu hỏi động theo sản phẩm (...)...`
  - `Gói ... (${schemaId})...`
  - các empty info alert trùng lặp kiểu `Chọn gói...` khi CTA/card đã diễn đạt đủ.
- Giữ alert/actionable state: chưa đủ dữ liệu, quote stale/expired, referral,
  không đủ điều kiện, yêu cầu bổ sung và recovery.

## Scope out

- Không đổi tariff, benefit limit, product eligibility, underwriting rule, payment
  gate hoặc quote-version engine.
- Không tạo product/package catalog mới hay nguồn dữ liệu song song.
- Không cho đổi sản phẩm inline tại `PACKAGE_AND_QUOTE`.
- Không đổi navigation, journey stage order hoặc breakpoint.
- Không thay UI submitted application.

## Business rules and state transitions

### Package continuity

- Canonical package code là nguồn chuẩn duy nhất.
- Chọn gói tại `CUSTOMER_INFO` tạo lựa chọn ban đầu.
- PA/Motor dùng lựa chọn này làm gói hiện hành.
- Health dùng lựa chọn này làm gói mặc định; cấu hình per-member ở bước Health
  vẫn có quyền ghi đè theo từng insured unit.

### Change product

Khi người dùng xác nhận đổi từ sản phẩm A sang B:

- Giữ: application id, owner, entry/source context, customer/customer reference,
  consent/PII, advice/lead reference và metadata audit chung.
- Thay: `productId`, `productName`.
- Xóa/reset dữ liệu phụ thuộc sản phẩm:
  `package`, `packageCode`, `selectedPackageId`, `selectedAddonIds`, `quote`,
  `quoteVersions`, `activeQuoteVersionId`, `activeQuoteApproved`, `premium`,
  `sumInsured`, `riskAnswers`, `vehicle`, `mortgage`, `insuredMembers`,
  `insuredName`, `insuredDob`, `insuredAge`, `occupationClass`, `beneficiaries`,
  product documents/underwriting/confirmation/payment/policy data nếu có.
- Chỉ cho đổi khi Draft chưa nộp; dữ liệu submitted/paid/issued không được chuyển.
- Sau reset, `currentStage = CUSTOMER_INFO`; reload/deep-link phải dùng journey mới.

## Data contract

- Canonical package sources:
  - `BANCA.motorPackages`
  - `BANCA.paPackages`
  - `BANCA.healthPackages`
- Rating/validation sources:
  - `BANCA.rateMotor`, `BANCA.ratePA`, `BANCA.healthFamilyRating`
  - `BANCA.validatePA`, `BANCA.validateHealth`, `BANCA.motorRiskRating`
  - existing quote snapshots/diff/adjustments.
- Page không parse text để tạo business decision và không tạo catalog package khác.

## UX copy

- Primary heading: `Phương án đã chọn`.
- Fee labels: `Phí dự kiến` hoặc `Phí sau khai báo rủi ro`.
- Sections: `Chi tiết phí`, `Quyền lợi và hạn mức`,
  `Điều khoản và loại trừ`, `Tác động từ khai báo rủi ro`.
- Alternative disclosure: `Xem phương án khác / thay đổi gói`.
- Product action: `Đổi sản phẩm`.
- Confirmation:
  `Đổi sang {sản phẩm}? Thông tin người được bảo hiểm, khai báo rủi ro, gói và
  báo giá hiện tại sẽ được đặt lại. Thông tin khách hàng vẫn được giữ.`
- Buttons: `Đổi sản phẩm` / `Giữ sản phẩm hiện tại`.
- Referral note:
  `Cần thẩm định trước khi chốt phí. Phí hiện tại chưa bao gồm điều chỉnh sau thẩm định.`

## Visual specification

- Mode C, reuse-only; design-token baseline: 1.154 errors / 685 warnings.
- Dùng `card`, `badge`, `alert2 warn/danger`, `btn-secondary`, `details/summary`,
  data rows và spacing/type tokens hiện có.
- Một primary card duy nhất; fee là giá trị nổi bật nhất trong card.
- Các nhóm chi tiết xếp theo nhịp section hiện có, không tạo modal/drawer mới.
- CTA chính của page vẫn là tiếp tục/Review; `Đổi sản phẩm` và đổi gói là secondary.
- Không thêm raw color, spacing, font-size, radius, shadow, z-index, motion hoặc
  breakpoint.
- Status phải có chữ, không chỉ màu. Native details/button giữ focus bàn phím.
- 390/768/1280: primary content wrap, không tạo overflow mới; vùng chạm dùng button
  hiện có.

## Files allowed

- `shared/components/sales-context-offer.js`
- `modules/application-workspace/app-workspace.js`
- `scripts/test-product-package-quote-continuity.js`
- `.ai/handoffs/in-progress/FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-PRODUCT-PACKAGE-QUOTE-CONTINUITY.md`

## Files prohibited

- `shared/mock/seed/product-schemas.js`
- `shared/mock/seed/journey-registry.js`
- rating, underwriting, payment, policy, permission and navigation files.
- CSS/token files và mọi file ngoài allowlist.

## Acceptance criteria

1. Package selector tại `CUSTOMER_INFO` dùng canonical code cho Motor/PA/Health.
2. Chọn PA package ở bước trước rồi mở `PACKAGE_AND_QUOTE` hiển thị đúng một primary
   package; alternatives được thu gọn.
3. Reload/deep-link giữ đúng product/package selection.
4. Primary PA card hiển thị full fee, benefit limits, default exclusions và risk
   impact/referral từ canonical data; không lộ schema id/copy kỹ thuật.
5. Motor hiển thị breakdown/adjustments hiện có và Health hiển thị family/per-member
   fee/benefit configuration mà không mất per-member override.
6. Ba alert kỹ thuật do user chỉ ra không còn trong DOM; actionable warnings vẫn còn.
7. `Đổi sản phẩm` chỉ hiện cho editable unlocked Draft và quay về `CUSTOMER_INFO`.
8. Xác nhận đổi sản phẩm giữ customer/source/consent nhưng reset đúng dữ liệu phụ
   thuộc; journey sau reload thuộc sản phẩm mới.
9. Cancel/giữ sản phẩm không làm thay đổi dữ liệu.
10. Submitted/read-only/locked không thể đổi sản phẩm.
11. Không đổi rating, underwriting, payment gate hoặc quote-version behavior.
12. Keyboard, responsive và design-token delta đạt yêu cầu.

## Validation commands

- `node --check shared/components/sales-context-offer.js`
- `node --check modules/application-workspace/app-workspace.js`
- `node scripts/test-product-package-quote-continuity.js`
- `node scripts/test-advice-outcome.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-quote-payment-issue.js`
- `node scripts/test-quote-version-ui.js`
- `node scripts/test-demo-stories.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-manifest.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- `git diff --check`
- Browser: PA/Motor/Health, package selected/unselected, product switch confirm/cancel,
  reload/deep-link, read-only/locked và viewport 390/768/1280.

## Assumptions and open questions

- Product catalog UI hiện có tiếp tục là điểm chọn sản phẩm; không tạo route mới.
- Browser native `confirm` được giữ trong prototype, không tạo modal mới.
- Chỉ hiển thị underwriting effect có bằng chứng từ canonical validator/rating.
- Không còn open question làm thay đổi business rule, permission, state hoặc UX flow.
