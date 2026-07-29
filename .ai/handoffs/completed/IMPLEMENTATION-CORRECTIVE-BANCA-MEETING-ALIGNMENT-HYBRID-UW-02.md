# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: CORRECTIVE-BANCA-MEETING-ALIGNMENT-HYBRID-UW-02 (attempt 2)
Implementer: Claude

Phạm vi: chỉ sửa 5 failure có bằng chứng trong
`.ai/handoffs/completed/QC-FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW.md`
(PRIVACY-DOM, QUOTE-IA, QUOTE-SELECTED-PACKAGE, PAYMENT-OTP-GATE, TEST). Không đụng
Health hybrid routing (đã PASS 42/42), không mở rộng scope.

## Files changed

Chỉ trong allowlist của corrective:

- `shared/mock/seed/case-state-resolver.js` — `confirmationComplete()`: MỌI quyết định
  chấp thuận (kể cả STP sạch APPROVED_STP/APPROVED của Motor/Health/PA) bắt buộc có OTP/
  customer confirmation trước thanh toán; giữ nguyên nhánh Health multi-insured per-member.
- `modules/application-workspace/app-workspace.js`
  - Header: bỏ badge "Chưa nộp" → "Bản chào · nháp"; tiêu đề trang "Lập yêu cầu bảo hiểm"
    → "Quote Workspace · Bản chào".
  - Document chip: "Đã nộp"/"Chưa nộp" → "Đã tải lên"/"Chưa tải lên".
  - Thêm helper `renderPackageChoice()` và áp cho 3 khối gói (motor/health/pa): gói đã chọn
    là primary; các phương án khác nằm trong `<details class="pkg-alternatives">` sau CTA
    "Xem phương án khác / thay đổi gói".
  - `caseFlow.needConfirm` gồm cả quyết định chấp thuận sạch để timeline nhất quán với gate OTP.
- `shared/mock/seed/journey-registry.js` — đảo thứ tự stage cho motor/pa/health:
  Khai báo rủi ro (RISK_DECLARATION) TRƯỚC Gói & phí (PACKAGE_AND_QUOTE); cập nhật
  `reviewSections` tương ứng. Stepper + prev/next là registry-driven nên điều hướng theo order mới.
- `modules/seller-workspace/index.html` — Privacy guard Trang chủ theo
  `BANCA.channelShowsCustomerList()`: kênh ẩn danh (Banca tích hợp) không hiện tên/CIF/PII,
  không action chọn/đổi khách; work item hiển thị case/external ref + ngữ cảnh nghiệp vụ.
  Agent/Broker giữ nguyên UI khách hàng.
- `scripts/test-payment-gate.js` — happy path yêu cầu OTP (`readyConfirmed`); thêm negative
  test STP trước OTP → khóa (Motor/Health/PA).
- `scripts/test-demo-stories.js` — Story 1 (Motor STP) và Story 2 (Health STP): assert
  trước OTP → payment khóa, sau OTP → payment mở (đúng source-of-truth, không hợp thức hóa
  behavior cũ).
- `scripts/test-privacy-home.js` — MỚI: test DOM/render bắt lỗi lộ PII trên Home theo kênh
  (đã xác minh bắt được bug cũ trên `index.html.bak`).

Pre-existing (không do attempt này, được giữ nguyên): thay đổi attempt-1 ở
`status-mappings.js`, `foundation-components.js`, `confirm-payment.js`, các file working-tree khác.

## Acceptance criteria evidence

- [x] Browser Home Banca anonymous KHÔNG có tên khách/CIF/phone/email/ID/customer picker —
  CDP smoke `01-home-banca-anonymous.png` + assert: 0 tên khách trong DOM, không nhãn CIF,
  có 🔒 + cột "Tham chiếu".
- [x] Browser Agent/Broker vẫn hiển thị khách hàng — `02-home-agent-broker.png` + assert ≥1 tên khách.
- [x] Quote header có Bản chào/Quote Workspace, không "Lập yêu cầu bảo hiểm" — smoke [3] + `03-*.png`.
- [x] Quote workspace không render "Chưa nộp/Đã nộp" — smoke [3] assert + grep 0 occurrence.
- [x] Khai báo rủi ro TRƯỚC Gói & phí trong stage order + navigation — smoke: stepper
  `journeyEditStages('motor')` risk index < package index; ảnh `03-*.png` step 3=Khai báo rủi ro, 4=Gói & phí.
- [x] Chỉ gói đã chọn là primary; phương án khác cần secondary action — `.pkg-primary` +
  `details.pkg-alternatives (2)`; ảnh `03b`/`03c`.
- [x] Motor/Health/PA STP trước OTP không thể thanh toán — smoke [4] runtime thật: pre=false,
  lý do "Khách chưa xác nhận (OTP)".
- [x] Motor/Health/PA STP sau OTP có thể thanh toán nếu các gate khác pass — smoke [4]: post=true.
- [x] Manual/condition/loading/exclusion không regress — test-underwriting-routing 42/0,
  test-post-submit 16/0, test-quote-payment-issue 39/0.
- [x] Automated tests + validators pass — xem Validation results.
- [x] Browser smoke evidence được ghi; không relabel failure thành PASS — 3 "fail" ban đầu
  là harness artifact (CSS uppercase innerText; permission gate của persona), đã sửa harness,
  không sửa behavior; kết quả 15/15.

## Validation results

Corrective required suites:
- test-payment-gate.js — PASS 32/0
- test-post-submit.js — PASS 16/0
- test-demo-stories.js — PASS 18/0
- test-privacy-consent.js — PASS 29/0
- test-privacy-home.js (mới) — PASS 8/0
- test-underwriting-routing.js — PASS 42/0
- test-foundation.js — PASS 58/0
- validate-terminology.js — PASS (93 files)
- detect-duplicate-components.js — PASS
- validate-design-tokens.js — report mode exit 0 (1157 lỗi / 689 cảnh báo)

Regression khác: test-advice-outcome 21/0, test-advisory-context 51/0,
test-advisory-recommendation 40/0, test-manager-commission 35/0, test-quote-payment-issue 39/0,
validate-manifest / validate-modules / validate-manifest-sync — PASS.

Browser smoke (Chrome headless qua CDP, phục vụ localhost:8099): 15/15 PASS. Ảnh:
`/tmp/banca-smoke/01-home-banca-anonymous.png`, `02-home-agent-broker.png`,
`03-motor-package-disclosure.png`, `03b-package-selected-primary.png`,
`03c-package-alternatives-open.png`; log `/tmp/banca-smoke/smoke-result.txt`.

## UI/UX safety check

- Tái dùng pattern hiện có: `<details>/<summary>` (đã dùng ở policies/team-workspace/
  app-workspace), `card`/`badge`/`kpi-row`/`btn`; dùng token `var(--...)` sẵn có, không thêm
  file CSS, không token màu/spacing tùy tiện mới.
- Disclosure gói dùng `<details>` native → keyboard (Tab tới summary, Enter/Space toggle),
  visible focus, reduced-motion, responsive (kpi-row repeat(3)) giữ nguyên.
- Design-token: LỖI không tăng (1157 = baseline QC); cảnh báo +2 (BULKY_INLINE_STYLE do markup
  disclosure/anon bổ sung), không có lỗi mức error mới. Không bulk cleanup (đúng scope-out).
- Status không chỉ bằng màu: badge/label đều có chữ; gate thanh toán luôn kèm lý do tiếng Việt.

## Assumptions used

- Guard privacy Home dựa trên `BANCA.channelShowsCustomerList()` (Banca tích hợp=false →
  ẩn danh; Agent/Broker/Standalone=true → hiện khách) — khớp acceptance "Banca anonymous"
  vs "Agent/Broker still shows customer".
- Tên nhân viên đăng nhập (persona) không phải customer PII → giữ hiển thị "Xin chào <RM>".
- STP KHÔNG miễn OTP: APPROVED_STP → CUSTOMER_CONFIRMATION_PENDING → OTP/CONFIRMED → PAYMENT
  (đúng handoff §4 và ăn khớp behavior PA STP đã có sẵn trong test-post-submit).

## Errors encountered and resolved

- Browser smoke ban đầu FAIL 3/15: (a) check "Tham chiếu" trên `innerText` sai do CSS
  `text-transform:uppercase` (thực tế "THAM CHIẾU"); (b) Health/PA STP sau OTP bị chặn bởi
  gate quyền thu hộ `can_collect_payment` của persona RM-01, không phải lỗi OTP. Sửa HARNESS
  (dùng innerHTML; truyền `opts.readiness` để cô lập cổng OTP), KHÔNG sửa behavior. Kết quả 15/15.

## Remaining risks

- `validate-design-tokens.js` chạy report mode; +2 cảnh báo BULKY_INLINE_STYLE. Không có lỗi
  error-level mới; cleanup ngoài scope corrective.
- Privacy guard áp cho Trang chủ (seller-workspace) theo evidence QC; PII trong workspace của
  một case cụ thể vẫn theo `appIsAnonymous(app)`/consent hiện hành (ngoài scope §1).
- Đây là attempt 2. Nếu QC lần 3 vẫn fail cùng hypothesis → chuyển RECURRING_BLOCKER về Codex.
