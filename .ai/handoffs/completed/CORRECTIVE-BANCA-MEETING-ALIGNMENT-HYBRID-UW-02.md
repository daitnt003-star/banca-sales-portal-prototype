# Feature handoff

Status: READY_FOR_IMPLEMENTATION
Owner: Codex
Implementer: Claude
Priority: P0
Attempt: 2

## Goal

Sửa đúng năm failure có bằng chứng trong
`.ai/handoffs/completed/QC-FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`.
Không mở rộng sang feature khác.

## Actor and permissions

- Retail RM/Telesales trong `BANCA_INTEGRATED`.
- Trước consent không được render PII/customer browse.
- Khách phải OTP/xác nhận trước khi bất kỳ payment method nào accessible, kể cả STP.

## Source-of-truth references

- Yêu cầu trực tiếp user: Health hybrid, sạch thì STP auto-pass.
- `.ai/handoffs/completed/FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
- `.ai/handoffs/completed/QC-FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
- `.ai/governance/uiux-safety-contract.md`

## Scope in

### 1. Privacy UI

- Thêm channel/data-access guard thật sự vào `seller-workspace/index.html`.
- Banca anonymous Home:
  - không tên khách/CIF/customer list;
  - không action chọn/đổi customer;
  - work item chỉ hiển thị case/external ref và anonymous business context.
- Không ẩn tên người dùng đang đăng nhập; seller name không phải customer PII.
- Agent/Broker regression phải giữ customer UI.
- Thêm deterministic DOM/render test hoặc browser test có thể bắt lỗi này.

### 2. Quote IA và terminology

- Header/breadcrumb dùng Bản chào/Quote Workspace, không “Lập yêu cầu bảo hiểm”.
- Không render badge/copy “Chưa nộp/Đã nộp” trong Non-life workspace.
- Reorder stage registry thật sự:
  - Customer
  - Risk object/insured
  - Risk declaration
  - Final package/premium
  - Documents
  - Review
- Back/next links và resume logic phải theo order mới.

### 3. Selected package hierarchy

- Selected package là primary summary/card.
- Alternatives nằm sau CTA `Xem phương án khác`/`Thay đổi gói`.
- Không hiển thị ba package ngang hàng mặc định.
- Đổi package vẫn re-rate/version/reset UW như contract hiện tại.

### 4. OTP before payment

- `APPROVED_STP` không tự đồng nghĩa customer confirmation complete.
- Trước OTP/confirmation: payment gate disabled với lý do tiếng Việt.
- Sau OTP/confirmation hợp lệ: payment methods accessible nếu các gate khác pass.
- Áp dụng Motor STP, Health STP và PA STP.
- Manual approved/condition/loading/exclusion tiếp tục giữ gate hiện hành.

### 5. Tests

- Sửa `test-demo-stories.js` theo source-of-truth:
  - STP trước OTP → payment locked.
  - STP sau OTP → payment enabled.
- Thêm/đổi test để bắt DOM/render privacy Home.
- Không được đổi test expectation để hợp thức hóa behavior cũ.

## Scope out

- Không đổi Health routing engine đã PASS.
- Không đổi recommendation/protection gap.
- Không làm Customer Self-service đầy đủ.
- Không sửa Manager/hierarchy.
- Không bulk design-token cleanup.
- Không sửa unrelated working-tree changes.

## Business rules and state transitions

```text
APPROVED_STP
→ CUSTOMER_CONFIRMATION_PENDING
→ OTP_VERIFIED / CUSTOMER_CONFIRMED
→ PAYMENT_METHOD_REQUIRED
```

```text
BANCA_INTEGRATED + ANONYMOUS_CONTEXT
→ anonymous Home/Quote context only
→ consent/grant
→ IDENTIFIED_CONTEXT
→ customer PII allowed
```

## Data contract

Reuse current canonical consent, routing, quote-version and payment contracts.
Không tạo alias business rule mới.

## UI/UX specification

- Reuse current shell/card/badge/disclosure/button patterns and tokens.
- Không redesign unrelated Home sections.
- Selected package primary, alternatives collapsed/secondary.
- Có loading/empty/error/recovery cho privacy reference mismatch.
- Preserve keyboard focus and responsive behavior for package disclosure.

## Files allowed

- `modules/seller-workspace/index.html`
- `modules/application-workspace/index.html`
- `modules/application-workspace/app-workspace.js`
- `shared/mock/seed/journey-registry.js`
- `shared/mock/seed/case-state-resolver.js`
- `shared/mock/seed/status-mappings.js`
- `shared/components/foundation-components.js`
- `shared/components/confirm-payment.js`
- `scripts/test-payment-gate.js`
- `scripts/test-post-submit.js`
- `scripts/test-demo-stories.js`
- `scripts/test-privacy-consent.js`
- New focused test under `scripts/test-*.js`
- `.ai/handoffs/in-progress/CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02.md`
- `.ai/handoffs/completed/CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02.md`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02.md`
- `.ai/learning/error-ledger.jsonl` via reflection tooling only

## Files prohibited

- `shared/styles/tokens.css`
- `shared/js/app-shell.js`
- `app-manifest.json`
- Governance files
- Quick Advice/recommendation files
- Product underwriting rules already passing
- Unrelated modified/deleted files

## Components and tokens to reuse

- Current page shell and Home work-item patterns.
- Current package card and disclosure/button patterns.
- `BANCA.dataAccess`, `BANCA.channel`, `BANCA.resolveCaseState`,
  `BANCA.paymentEnableRule`, quote-version helpers.

## Acceptance criteria

- [ ] Browser Home Banca anonymous contains no customer name, CIF, phone, email, ID or customer picker.
- [ ] Browser Agent/Broker still shows allowed customer context.
- [ ] Quote header contains Bản chào/Quote Workspace and no “Lập yêu cầu bảo hiểm”.
- [ ] Quote workspace does not render “Chưa nộp/Đã nộp”.
- [ ] Risk declaration precedes final package/premium in stage order and navigation.
- [ ] Only selected package is primary by default; alternatives require secondary action.
- [ ] Motor/Health/PA STP before OTP cannot initiate payment.
- [ ] Motor/Health/PA STP after OTP can initiate payment if other gates pass.
- [ ] Manual/condition/loading/exclusion gates do not regress.
- [ ] Automated tests and validators pass.
- [ ] Browser smoke evidence is recorded; failures are not relabeled PASS.

## Validation commands

Run all existing suites plus focused tests:

```text
node scripts/test-payment-gate.js
node scripts/test-post-submit.js
node scripts/test-demo-stories.js
node scripts/test-privacy-consent.js
node scripts/test-underwriting-routing.js
node scripts/test-foundation.js
node scripts/validate-terminology.js
node scripts/detect-duplicate-components.js
node scripts/validate-design-tokens.js
```

Required browser smoke:

- `modules/seller-workspace/index.html` in Banca anonymous.
- Same Home in Agent/Broker.
- Motor draft Quote stage order and selected package disclosure.
- Motor STP before/after OTP.
- Health STP before/after OTP.

## Assumptions and open questions

- No blocking question remains.
- Current user instruction explicitly requires Health clean-case STP, but STP does not waive OTP.
- This is attempt 2. A third matching failure under the same hypothesis must become `RECURRING_BLOCKER`.
