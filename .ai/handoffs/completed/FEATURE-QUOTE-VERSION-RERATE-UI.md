# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Priority: P1

## Goal

Giúp nhân viên tư vấn tại Quote/Application Workspace:

1. Nhận biết rõ phiên bản Bản chào đang hiện hành.
2. Xem được lịch sử phiên bản khi có từ hai phiên bản.
3. Hiểu vì sao cần tính phí lại, hậu quả đối với duyệt/thanh toán và hành động tiếp theo.

Không tạo drawer và không mở rộng sang thay đổi nghiệp vụ thẩm định, OTP, thanh toán
hoặc phát hành hợp đồng.

## Actor and permissions

- Actor chính: Retail RM/Telesales có quyền xem Bản chào.
- Chủ hồ sơ có quyền chỉnh sửa: được thực hiện action tính phí lại hiện có.
- Manager/read-only: xem được phiên bản và cảnh báo nhưng không có CTA chỉnh sửa.
- Phiên bản `SUPERSEDED` chỉ xem; không kích hoạt lại, chỉnh sửa, thanh toán hoặc phát hành.
- Không thay đổi privacy/PII behavior hiện hành.

## Source-of-truth references

1. Yêu cầu user đã duyệt: dropdown phiên bản tại header + cảnh báo tính phí lại inline,
   không drawer, không mở rộng payment/underwriting.
2. `docs/rework-v2/C-state-transition-map.md` § Quote versioning.
3. `docs/rework-v2/B-component-reuse-matrix.md` §5.
4. `docs/rework-v2/D-source-of-truth-index.md` Phase 4.
5. `.ai/governance/uiux-safety-contract.md`.

## Scope in

### A. Quote version selector

- Hiển thị tại sticky header của edit Quote Workspace, cạnh mã Bản chào/badge.
- Một phiên bản: hiển thị badge `Phiên bản Vn`.
- Từ hai phiên bản: hiển thị native `<select>` có accessible label.
- Option dùng tiếng Việt:
  - `Phiên bản V2 · Đang soạn · Hiện tại`
  - `Phiên bản V1 · Đã duyệt`
  - `Phiên bản V1 · Đã thay thế`
- Chọn phiên bản cũ chỉ thay vùng preview/tóm tắt lịch sử; không đổi
  `activeQuoteVersionId`, không ghi dữ liệu, không reload sang phiên bản cũ.
- Nếu prototype chưa có snapshot đầy đủ, preview tối thiểu gồm phiên bản, phí, thời
  điểm tạo/tính phí, người thực hiện, trạng thái và lý do tính lại nếu có.
- Hỗ trợ cả dữ liệu hiện hành `app.quote.versions[]` và canonical
  `app.quoteVersions[]`; canonical ưu tiên khi có. Không migration phá dữ liệu cũ.

### B. Re-rate notice

- Hiển thị inline ngay dưới header khi:
  - có `QUOTE_NEED_RERATE` trong `warnings` hoặc `warningFlags`; hoặc
  - active canonical version là `DRAFT` sau khi version cũ đã `SUPERSEDED`; hoặc
  - quote status là stale/expired theo helper hiện hành.
- Copy chuẩn:
  - Title: `Bản chào cần tính phí lại`
  - Body khi có lý do:
    `Dữ liệu ảnh hưởng phí đã thay đổi: {reason}. Phiên bản hiện tại chưa được duyệt nên thanh toán đang tạm khóa.`
  - Body fallback:
    `Dữ liệu ảnh hưởng phí đã thay đổi. Phiên bản hiện tại chưa được duyệt nên thanh toán đang tạm khóa.`
  - Next action editable: `Tính phí lại để cập nhật phí và tiếp tục quy trình duyệt.`
  - Next action read-only: `Liên hệ người phụ trách để tính phí lại và gửi duyệt.`
- Editable có CTA `Tính phí lại` dẫn đúng bước `PACKAGE_AND_QUOTE` hoặc gọi action
  tính phí hiện có khi đã ở bước này.
- Read-only không render CTA thay đổi.
- Sau khi tính phí thành công và warning stale/rerate được xóa, notice không còn.

### C. Version integrity

- Re-rate tiếp tục tạo version mới theo behavior hiện hành; version trước thành
  `SUPERSEDED`.
- Nếu app có canonical `quoteVersions`, re-rate phải giữ đồng bộ canonical contract.
- Không cho sửa phí tay.
- Không nới payment gate; active version chưa duyệt vẫn khóa thanh toán.
- Policy/callback tiếp tục trỏ phiên bản đã duyệt mà khách xác nhận.

### D. Deterministic UI coverage

- Thêm test cho:
  - single version badge;
  - multi-version select;
  - Vietnamese status labels;
  - superseded read-only behavior;
  - canonical + legacy compatibility;
  - warning visible/hidden;
  - editable/read-only CTA;
  - selection preview không mutate active version;
  - accessible label và keyboard-native select.

## Scope out

- Không tạo drawer/modal lịch sử phiên bản mới.
- Không redesign sticky header, stepper hoặc Quote page.
- Không thay rating formula, underwriting routing, OTP, payment method, payment callback,
  policy issue hoặc quote approval rules.
- Không migrate toàn bộ seed sang schema mới.
- Không cleanup markup/token debt ngoài phần được chạm.
- Không xử lý `OtpVerificationPanel`, `UnderwritingStatusPanel`,
  `OrganizationScopeFilter` hoặc backlog UX khác.

## Business rules and state transitions

```text
DRAFT v1 --approve--> APPROVED v1
APPROVED v1 --data affecting premium changes/re-rate-->
  SUPERSEDED v1 + DRAFT v2 active + payment locked
DRAFT v2 --approve--> APPROVED v2 + payment may continue when other gates pass
```

- `SUPERSEDED` là immutable/read-only.
- Chọn version trong UI là thao tác xem, không phải state transition.
- Chỉ active approved version được dùng cho payment/policy theo gate hiện hành.

## Data contract

Canonical:

```text
app.quoteVersions[]:
  id, version, status, premium, ratedAt, approvedAt, supersededAt, reRateReason?
app.activeQuoteVersionId
app.activeQuoteApproved
```

Legacy compatibility:

```text
app.quote.versions[]:
  version, premium, createdAt, createdBy, status
```

UI adapter được phép normalize để render nhưng không được ghi đè/migrate destructive.

## UI/UX specification

- Pattern: native select/badge + existing `alert2 warn` hoặc shared equivalent.
- Placement: version control trong hàng title của sticky header; notice ngay sau header.
- Không dùng màu làm tín hiệu duy nhất; luôn có nhãn `Hiện tại`, `Đã duyệt`,
  `Đã thay thế`, `Đang soạn`.
- Select có `<label>` hoặc `aria-label="Chọn phiên bản Bản chào"`.
- Focus browser mặc định/shared focus phải nhìn thấy; không custom select.
- Desktop/tablet: không làm header overflow ngang.
- Mobile/narrow: control wrap theo header hiện có, CTA vẫn đạt vùng chạm hiện hành.
- Loading: action tính phí dùng loading state hiện có.
- Empty/legacy: không có version array thì suy ra một version từ `app.quote.version`;
  không có quote thì không render selector/notice version.
- Recovery: reload/deep-link luôn quay về active version; preview cũ không được persist.

### Visual tokens

- Chỉ dùng token hiện có trong `shared/styles/tokens.css`.
- Spacing: `--space-2xs`, `--space-sm`, `--space-md`.
- Text: `--text-2xs`, `--text-xs`, `--text-sm`.
- Radius: `--radius-sm`, `--radius-md`.
- Border/shadow/z-index: dùng component/header hiện có; không thêm giá trị raw.
- Không đổi palette, breakpoint hoặc motion.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `shared/components/foundation-components.js` nếu tạo/reuse shared renderer
- `shared/mock/seed/quote-version.js` chỉ khi cần adapter/read-only helper
- `scripts/test-quote-version-ui.js` (new)
- `scripts/test-quote-payment-issue.js` nếu cần bổ sung regression contract
- `.ai/handoffs/in-progress/FEATURE-QUOTE-VERSION-RERATE-UI.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-QUOTE-VERSION-RERATE-UI.md`

## Files prohibited

- `shared/styles/tokens.css`
- `shared/js/app-shell.js`
- `shared/js/app-manifest.js`
- product/rating/underwriting/payment config
- module khác ngoài Application Workspace
- active product docs và governance

Không mở rộng allowlist nếu chưa có Codex impact decision.

## Components and tokens to reuse

- Sticky `ws-summary` header.
- Native select pattern đang dùng trong tracking header.
- `badge-version`, status badge và `alert2 warn`.
- Existing `rerate()` / `autoRerate()` behavior.
- `BANCA.quoteVersion` canonical engine.
- Existing button/focus/responsive patterns.

## Acceptance criteria

1. Single-version quote hiển thị đúng badge phiên bản.
2. Multi-version quote hiển thị native select với nhãn tiếng Việt và active version.
3. Xem version superseded không mutate active version hoặc dữ liệu.
4. Warning rerate hiển thị đủ: nguyên nhân, hệ quả khóa thanh toán, next action.
5. Warning biến mất khi trạng thái không còn stale/rerate.
6. Read-only không có CTA thay đổi; editable có đúng CTA.
7. Canonical và legacy seed đều render không lỗi; data cũ thiếu version vẫn recovery.
8. Payment gate trước/sau re-rate không regression; policy ref vẫn đúng approved version.
9. Desktop/tablet/mobile và keyboard browser smoke PASS; không horizontal overflow mới.
10. Design-token không tăng so với baseline 1.156 errors / 687 warnings; file bị chạm
    không tăng relevant violation.
11. Không thay đổi ngoài allowlist.

## Validation commands

```text
node scripts/test-quote-version-ui.js
node scripts/test-quote-payment-issue.js
node scripts/test-payment-gate.js
node scripts/test-demo-stories.js
node scripts/validate-manifest.js
node scripts/validate-modules.js
node scripts/validate-terminology.js
node scripts/detect-duplicate-components.js
node scripts/test-foundation.js
node scripts/validate-design-tokens.js
git diff --check
```

Browser smoke:

- DRAFT-2026-005: multi-version.
- DRAFT-2026-007: rerate warning.
- Single-version Bản chào.
- Owner editable và manager/read-only.
- Desktop, tablet, narrow/mobile; Tab/Shift+Tab/select keyboard.

## Assumptions and open questions

- Assumption: xem lịch sử là read-only preview, không “rollback” version.
- Assumption: action duyệt lại tiếp tục qua quy trình submit/approval hiện hành; P1 không
  tạo approval endpoint/CTA giả.
- Không có open question có thể làm đổi behavior, permission, state hoặc UX flow.
