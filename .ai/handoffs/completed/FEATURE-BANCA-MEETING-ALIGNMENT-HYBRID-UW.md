# Feature handoff

Status: READY_FOR_IMPLEMENTATION
Owner: Codex
Implementer: Claude
Priority: P0

## Goal

Đưa prototype về đúng các quyết định sau meeting:

1. `BANCA_INTEGRATED` là profile mặc định và không lộ PII trước consent.
2. Quick Advice dùng banking context, tự lưu session, có outcome chuẩn và chuyển đúng một selected offer sang Quote.
3. Non-life được quản lý theo Bản chào/Báo giá → Hợp đồng, không dùng “chưa nộp/đã nộp” như object chính.
4. Quote có đúng thứ tự, selected package, re-rate và versioning UX.
5. Motor happy path đi STP.
6. Health dùng hybrid underwriting: ca sạch auto-pass STP; chỉ ca chạm rule mới đi Manual UW.
7. Confirmation, payment, issue và bank callback tuân thủ gate.
8. Không phá vỡ design language, navigation, responsive behavior và shared component hiện tại.

Triển khai theo checkpoint. Sau mỗi checkpoint phải chạy validation tương ứng và ghi evidence. Không mở rộng scope để redesign toàn portal.

## Actor and permissions

- Actor chính: Retail RM/Telesales trong `BANCA_INTEGRATED`.
- Actor phụ: Manager trong Personal/Team workspace và Agent/Broker ở profile riêng.
- Banca trước consent chỉ được thấy `externalCustomerRef` và anonymous banking context.
- Banca không được browse/chọn customer hoặc đọc PII trước `IDENTIFIED_CONTEXT`.
- Agent/Broker có thể giữ customer selection theo channel configuration.
- Seller không được tự xác nhận OTP thay khách và không được tự đánh dấu payment success.
- Manual UW decision chỉ do rule/UW simulation hợp lệ tạo ra.

## Source-of-truth references

Ưu tiên theo thứ tự:

1. Yêu cầu trực tiếp của user: Health không chạm rule thẩm định phải auto-pass STP.
2. File meeting: `/Users/trixie/.codex/attachments/01bc0135-6fa7-4fcc-9ca9-f42d1cc1f765/pasted-text.txt`
3. `docs/rework-v2/D-source-of-truth-index.md`
4. `docs/rework-v2/C-state-transition-map.md`
5. `.ai/governance/source-of-truth.md`
6. `.ai/governance/roles-and-boundaries.md`
7. `.ai/governance/change-policy.md`
8. `.ai/governance/uiux-safety-contract.md`

Nếu active docs còn ghi Health luôn Manual hoặc luôn STP, yêu cầu trực tiếp này supersede: Health là HYBRID.

## Scope in

### Checkpoint 1 — Banca entry, privacy và consent

- Áp dụng channel/data-access guard cho Home, Quick Advice list, Quote list và handoff UI.
- Trong `BANCA_INTEGRATED`, trước consent:
  - không customer picker/list;
  - không tên, điện thoại, email, CCCD, địa chỉ, CIF hoặc account;
  - hiển thị external reference, nguồn và anonymous context.
- Hoàn thiện consent audit contract.
- `fetchCustomerPII(externalCustomerRef)` phải fail-closed nếu không khớp; tuyệt đối không fallback `pool[0]`.
- Sau consent mới fetch/prefill PII, có source badge và read-only theo field.

### Checkpoint 2 — Quick Advice

- Bỏ business status/tab/action `SAVED`; autosave không đổi outcome.
- Outcome chuẩn:
  - `CUSTOMER_ACCEPTED`
  - `FOLLOW_UP`
  - `NOT_INTERESTED`
  - `SHARED_WITH_CUSTOMER`
- Giữ banking-context recommendation đến product/package, estimated premium, fit và explanation.
- Cho `Xem sản phẩm khác` nếu eligible.
- Multi-need có thể gợi ý nhiều sản phẩm nhưng convert sang sale chỉ mang một `selectedOffer`.
- Không tạo bundle Motor + Health + PA trong một issue journey.
- Giữ comparison drawer và protection-gap logic đã triển khai; không regression.

### Checkpoint 3 — Quote Workspace và versioning UX

- UI gọi là Quote Workspace/Bản chào.
- Journey:
  1. Thông tin khách hàng
  2. Đối tượng bảo hiểm
  3. Khai báo rủi ro
  4. Gói, phí và điều kiện cuối cùng
  5. Tài liệu
  6. Review và nộp
  7. Thẩm định nếu cần
  8. Xác nhận và thanh toán
  9. Phát hành
- Selected package từ Quick Advice phải được ưu tiên; package khác nằm trong secondary action.
- Dựng/reuse `ReRateNotice` và `QuoteVersionSelector`.
- Approved quote immutable; thay đổi rating/risk input tạo version mới, supersede version cũ và reset UW liên quan.
- Policy phải giữ đúng `quoteId`, `quoteVersion`, `approvedQuoteSnapshot`.
- Xóa copy “chưa nộp/đã nộp” khỏi UI Non-life được chạm.

### Checkpoint 4 — Motor STP và Health hybrid underwriting

Motor:

- No referral rule hit → `APPROVED_STP`.
- Referral rule hit → `UW_PENDING`.
- Hard-decline rule → `DECLINED`.

Health:

- Không chạm rule, đủ dữ liệu/tài liệu → `APPROVED_STP`, không tạo queue/officer/manual SLA.
- Thiếu dữ liệu/tài liệu do rule → `MORE_INFORMATION_REQUIRED`.
- Chạm review rule → `UW_PENDING` với `underwritingMode: MANUAL`.
- Manual decision có thể là `APPROVED`, `APPROVED_WITH_CONDITION`, `APPROVED_WITH_LOADING`, hoặc `DECLINED`.
- Hard-decline rule có thể đi thẳng `DECLINED`.
- Condition/exclusion/loading phải hiển thị bằng business copy, không raw enum.

Routing contract tối thiểu:

```js
{
  routingResult: 'STP_PASS' | 'MANUAL_REVIEW' | 'MORE_INFORMATION_REQUIRED' | 'DECLINED',
  underwritingMode: 'STP' | 'MANUAL',
  decision,
  ruleHits: [],
  publicReasons: [],
  internalReasonCodes: [],
  requiredDocuments: [],
  conditions: [],
  exclusions: [],
  loading: null,
  ruleSetCode,
  ruleVersion,
  evaluatedAt
}
```

### Checkpoint 5 — Confirmation, payment, issue và callback

- Reuse shared OTP/payment/UW components; không duplicate inline component.
- `APPROVED_STP` và `APPROVED` → OTP → payment.
- `APPROVED_WITH_CONDITION` → xác nhận condition → OTP → payment.
- `APPROVED_WITH_LOADING` → re-rate/version mới → xác nhận phí → OTP → payment.
- `UW_PENDING`, `MORE_INFORMATION_REQUIRED`, `DECLINED` → payment inaccessible.
- Ba payment methods hiển thị trực tiếp: QR, payment link, seller/agent-assisted.
- Seller-assisted ghi `payerType: SELLER_OR_AGENT`.
- Payment success chỉ từ callback.
- Issue tạo Policy/GCN/e-card và callback về Bank bằng đúng external reference + quote version.

### Checkpoint 6 — Regression và demo fixtures

Phải có ba story:

1. Motor anonymous context → STP → OTP → QR → issue → bank callback.
2. Health clean case → `APPROVED_STP` → OTP → payment link → issue.
3. Health rule-hit → Manual UW → condition/exclusion → customer confirmation → OTP → payment → issue.

## Scope out

- Full CRM cho ngân hàng.
- Browse customer trong Banca.
- Bundle nhiều product/policy trong một lần issue.
- Full endorsement/claim processing.
- Admin Console.
- Production API, production medical-cost data hoặc production underwriting engine.
- Redesign navigation/information architecture ngoài các label meeting đã quyết định.
- Bulk token cleanup hoặc refactor module không liên quan.
- Sửa/xóa các thay đổi working tree có sẵn không thuộc handoff.

## Business rules and state transitions

### Data access

```text
ANONYMOUS_CONTEXT
→ CONSENT_PENDING
→ IDENTIFIED_CONTEXT
→ VERIFIED_CUSTOMER
```

Không được bỏ qua consent/grant. Không match được external ref là error/recovery state, không được chọn khách khác thay thế.

### Advice

```text
IN_PROGRESS
→ recommendation generated (autosaved)
→ CUSTOMER_ACCEPTED | FOLLOW_UP | NOT_INTERESTED | SHARED_WITH_CUSTOMER
```

Mở/đóng comparison hoặc autosave không tạo business outcome.

### Hybrid underwriting

```text
READY_FOR_UW
→ rule evaluation
   ├─ STP_PASS → APPROVED_STP
   ├─ NEED_INFO → MORE_INFORMATION_REQUIRED
   ├─ MANUAL_REVIEW → UW_PENDING → manual decision
   └─ HARD_DECLINE → DECLINED
```

### Payment

Payment chỉ accessible khi:

- UW decision thuộc nhóm approved;
- condition/loading mới đã được khách xác nhận;
- OTP/customer confirmation hợp lệ;
- quote version hiện hành còn `VALID`;
- không có re-rate pending.

## Data contract

Consent:

```js
{
  consentId,
  consentType,
  consentVersion,
  consentStatus,
  consentTimestamp,
  consentChannel,
  externalCustomerRef,
  customerRef,
  dataRetrievedAt,
  sourceSystem
}
```

Selected offer:

```js
{
  productId,
  packageId,
  estimatedPremium,
  recommendationId,
  adviceSessionId
}
```

Policy reference:

```js
{
  quoteId,
  quoteVersion,
  approvedQuoteSnapshot
}
```

Bank callback:

```js
{
  externalCustomerRef,
  externalJourneyRef,
  quoteId,
  quoteVersion,
  policyNumber,
  certificateNumbers,
  issueStatus,
  effectiveFrom,
  effectiveTo,
  paymentStatus,
  callbackTimestamp
}
```

Keep existing aliases only when needed for backward compatibility; new logic must use the canonical contract.

## UI/UX specification

- Reuse current page shell, navigation, card, table, badge, drawer, modal, toast and sticky-action patterns.
- Use tokens from `shared/styles/tokens.css`; no new arbitrary visual values.
- Preserve current primary-action hierarchy.
- Vietnamese business labels; never expose raw enum.
- Status must not be communicated by color alone.
- Provide loading, empty, error, permission, disabled, success and recovery states where applicable.
- Preserve keyboard navigation, focus return, visible focus, semantic landmarks, contrast, reduced motion and responsive behavior.
- Quote selected package remains visually primary; alternatives are secondary.
- Health STP must not show manual UW queue/officer/SLA.
- Health Manual must make conditions/exclusions and required customer action obvious.
- No unrelated redesign.

## Files allowed

Claude may patch only relevant files within:

- `shared/mock/seed/channel-profiles.js`
- `shared/mock/seed/customer-data-access.js`
- `shared/mock/seed/advice-sessions.js`
- `shared/mock/seed/journey-registry.js`
- `shared/mock/seed/product-schemas.js`
- `shared/mock/seed/quote-version.js`
- `shared/mock/seed/case-state-resolver.js`
- `shared/mock/seed/status-mappings.js`
- `shared/mock/seed/payment-method-config.js`
- `shared/mock/seed/applications.js`
- `shared/mock/seed/policies.js`
- `shared/components/foundation-components.js`
- `shared/components/confirm-payment.js`
- `shared/styles/components.css` only if existing token/classes cannot satisfy the UI
- `modules/seller-workspace/index.html`
- `modules/quick-advisory/index.html`
- `modules/advisory-workspace/index.html`
- `modules/unsubmitted-applications/index.html`
- `modules/application-workspace/index.html`
- `modules/application-workspace/app-workspace.js`
- `modules/submitted-applications/index.html` if legacy copy/state mapping is present
- `modules/policies/index.html`
- `scripts/test-*.js`
- `scripts/validate-*.js` only to add genuine requirement checks, never to weaken validation
- `docs/rework-v2/D-source-of-truth-index.md`
- `docs/rework-v2/C-state-transition-map.md`
- `.ai/handoffs/in-progress/FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
- `.ai/handoffs/completed/FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
- `.ai/handoffs/completed/IMPLEMENTATION-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
- `.ai/learning/error-ledger.jsonl` only through reflection tooling

If a required runtime file is outside the allowlist, stop and report it to Codex. Do not silently broaden scope.

## Files prohibited

- `shared/styles/tokens.css`
- `shared/js/app-shell.js`
- `app-manifest.json`
- `.ai/governance/*`
- `AGENTS.md`
- `CLAUDE.md`
- Existing unrelated modified/deleted files
- Historical reports solely to make validation appear green

## Components and tokens to reuse

- `BANCA.ui.customerContextCard`
- `BANCA.ui.dataSourceBadge`
- `BANCA.ui.consentStatus`
- `BANCA.ui.otpVerificationPanel`
- `BANCA.ui.confirmationPaymentPanel`
- `BANCA.ui.underwritingStatusPanel`
- Existing card, badge, drawer, modal, toast and sticky footer patterns
- `BANCA.resolveCaseState`
- `BANCA.journeyFor`
- `BANCA.vnd`
- Tokens from `shared/styles/tokens.css`

Do not copy shared component markup into a module when the shared renderer can be extended safely.

## Acceptance criteria

### Privacy

- [ ] Banca anonymous Home/Quick Advice/Quote DOM contains no customer PII.
- [ ] Banca has no customer browse/selection before consent.
- [ ] Agent/Broker customer selection still works.
- [ ] Unknown external ref never returns another customer's PII.
- [ ] Consent audit fields are persisted and observable.
- [ ] Correct PII appears only after identified/verified stage with source labels.

### Quick Advice

- [ ] No `SAVED` business tab, action or status.
- [ ] Autosave does not change outcome.
- [ ] Four required outcomes work.
- [ ] Product/package recommendation and alternative selection work.
- [ ] Convert creates one Quote from the final selected offer.
- [ ] Existing protection-gap, multi-need and comparison drawer tests do not regress.

### Quote

- [ ] Non-life UI uses Bản chào/Báo giá → Hợp đồng terminology.
- [ ] Risk declaration precedes final package/premium.
- [ ] Selected package is primary and alternatives are secondary.
- [ ] Approved quote cannot be mutated.
- [ ] Rating/risk change creates/requires a new version and resets UW.
- [ ] Version selector and re-rate notice are visible in the required states.
- [ ] Policy points to the approved quote version.

### Underwriting

- [ ] Motor clean case reaches `APPROVED_STP`.
- [ ] Motor referral case reaches `UW_PENDING`.
- [ ] Health clean case reaches `APPROVED_STP` without manual queue UI.
- [ ] Health missing-info case reaches `MORE_INFORMATION_REQUIRED`.
- [ ] Health review-rule case reaches `UW_PENDING`.
- [ ] Manual Health supports approved, condition, loading and declined results.
- [ ] Conditions/exclusions/loading are visible with Vietnamese business labels.

### Confirmation/payment/issue

- [ ] Manual UW cannot pay before approval.
- [ ] Condition/loading must be confirmed before payment.
- [ ] Declined never exposes payment.
- [ ] Three payment methods respect state gates.
- [ ] Seller-assisted uses `SELLER_OR_AGENT`.
- [ ] Only callback can mark payment successful.
- [ ] Issue output includes Policy, GCN/e-card and correct Bank callback refs.

### UI/UX and regression

- [ ] No new design-token violation in changed files.
- [ ] No duplicated shared component.
- [ ] Keyboard and responsive smoke pass for changed flows.
- [ ] Existing test suite and validators pass.
- [ ] Three mandatory demo stories pass end-to-end.

## Validation commands

Capture baseline before code changes, then run after every checkpoint as applicable:

```text
node scripts/test-advisory-context.js
node scripts/test-advisory-recommendation.js
node scripts/test-foundation.js
node scripts/test-manager-commission.js
node scripts/test-payment-gate.js
node scripts/test-post-submit.js
node scripts/validate-manifest.js
node scripts/validate-modules.js
node scripts/validate-manifest-sync.js
node scripts/validate-terminology.js
node scripts/detect-duplicate-components.js
node scripts/validate-design-tokens.js
```

Add focused deterministic tests:

- Channel/PII privacy and unknown-ref fail-closed.
- Advice outcome/autosave.
- Quote ordering/version/re-rate.
- Motor STP/referral.
- Health STP/missing-info/manual/hard-decline decision table.
- Condition/loading confirmation/payment gate.
- Policy approved-quote reference and bank callback.

Browser smoke:

- Banca anonymous Home and Quick Advice.
- Consent then correct PII prefill.
- Agent/Broker selection regression.
- Quick Advice final selected offer conversion.
- Quote re-rate and version selection.
- Motor STP story.
- Health STP story.
- Health Manual UW story.
- Desktop/tablet/mobile plus keyboard for changed UI.

## Implementation checkpoints and reporting

After each checkpoint:

1. Run focused tests.
2. Record changed files and acceptance-criteria evidence.
3. Confirm no unrelated file was changed.
4. Continue only if the checkpoint passes.

At completion:

1. Run `banca-self-check`.
2. Write `.ai/handoffs/completed/IMPLEMENTATION-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md` from the implementation handoff template.
3. Copy the requirement handoff into `completed` with its original requirements intact.
4. Run `banca-reflection-loop`.
5. Return control to Codex for independent QC. Do not declare final product approval yourself.

## Assumptions and open questions

- No blocking questions remain.
- The user explicitly approves Health hybrid underwriting.
- Existing mock rules may be reorganized into configuration but not treated as production actuarial/UW rules.
- Family Health in the same product line remains allowed; multi-product bundle issue remains out of scope.
- Existing unrelated working-tree changes must be preserved exactly.
