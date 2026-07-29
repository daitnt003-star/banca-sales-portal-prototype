# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Chuẩn hóa cách hiển thị xác nhận khách hàng (OTP) và trạng thái thẩm định trong
Application Workspace bằng các shared component đã tồn tại, để cùng trạng thái có
cùng cấu trúc, thuật ngữ và hành động tiếp theo giữa Motor, PA và Health.

## Actor and permissions

- Nhân viên tư vấn là chủ hồ sơ: thấy hành động gửi/gửi lại xác nhận khi business
  state cho phép.
- Người chỉ xem/manager: thấy trạng thái và hướng dẫn, không có CTA làm thay đổi hồ sơ.
- Health: xác nhận và kết quả thẩm định vẫn thuộc từng người được bảo hiểm; trẻ em do
  người đại diện xác nhận.
- Nhân viên tư vấn không được tự xác nhận thay khách; demo callback phải tiếp tục được
  nhận diện là công cụ mô phỏng, không phải hành động production.

## Source-of-truth references

- `docs/rework-v2/C-state-transition-map.md`, mục 2–4.
- `docs/rework-v2/B-component-reuse-matrix.md`, mục 8–9.
- `docs/rework-v2/E-component-registry.md`, mục 7.
- `docs/rework-v2/D-source-of-truth-index.md`, Phase 5.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Dùng `BANCA.ui.otpVerificationPanel` cho toàn bộ trạng thái OTP áp dụng:
  chưa gửi, đã gửi/chờ khách, đã xác nhận và hết hạn nếu dữ liệu có trạng thái này.
- Dùng `BANCA.ui.underwritingStatusPanel` tại khu vực/tab thẩm định thay cho phần
  trạng thái inline tương ứng.
- Map dữ liệu trang hiện hành vào component, bao gồm yêu cầu bổ sung, điều kiện/loại
  trừ và trạng thái khách đã chấp nhận.
- Giữ progressive disclosure: STP đã duyệt không hiển thị thông tin hàng chờ/thẩm
  định viên thủ công.
- Chuẩn hóa UX copy và bảo toàn responsive/accessibility.
- Thêm deterministic tests cho adoption, permission, product/state isolation và
  payment-gate regression.

## Scope out

- Không thay state model, transition, resolver, payment gate hoặc điều kiện phát hành.
- Không thay cách sinh/gửi/xác thực OTP, không tạo API, countdown hoặc backend mới.
- Không thay underwriting engine, routing, seed decision hoặc handler mô phỏng.
- Không thay navigation, tab structure, confirmation-payment ordering hoặc visual
  design system.
- Không chỉnh shell mobile legacy hoặc nợ design-token ngoài delta của thay đổi.

## Business rules and state transitions

- OTP: `NOT_STARTED → OTP_SENT → VERIFIED`; sai/hết hạn vẫn ở luồng resend hiện hành.
- Hai mode dùng cùng component; mode chỉ đổi actor, không tạo journey khác.
- Payment chỉ được bật từ `BANCA.paymentEnableRule(app)`; page không được tái tạo gate.
- Health yêu cầu từng insured unit đủ xác nhận; không dùng một OTP chung.
- STP không có manual queue/officer/SLA; manual/more-info/approved-with-condition/
  declined hiển thị đúng dữ liệu hiện có.
- Điều kiện/loại trừ chưa được khách chấp nhận phải tiếp tục khóa thanh toán.

## Data contract

- Đọc dữ liệu hiện hành từ `BANCA.caseStates(app)`, `app.uw`, `app.stpDecision`,
  `app.confirm`, `insuredMembers[].confirmation`, `insuredMembers[].underwriting`.
- Không thêm nguồn trạng thái song song và không migration.
- Component shared là owner của markup/presentation; resolver và
  `paymentEnableRule` tiếp tục là owner của trạng thái/gate.

## UI/UX specification

- OTP title: `Xác nhận của khách hàng`.
- Pending CTA: `Gửi yêu cầu xác nhận`; sent status: `Đã gửi — chờ khách`;
  verified status: `Đã xác nhận`; expired: `Hết hạn`.
- Khi chưa thể gửi: nêu lý do và hành động tiếp theo, không chỉ disable.
- Underwriting dùng nhãn tiếng Việt từ status/decision config; không lộ raw enum.
- Status không truyền đạt chỉ bằng màu; giữ native focus/semantic input/button.
- Reuse `otp-panel`, `uw-panel`, badge, alert, button và token hiện có; không thêm
  màu, spacing, breakpoint hoặc component mới.
- Desktop/tablet/mobile: panel không tạo overflow mới; nội dung dài wrap được.
- Recovery: reload/deep-link phải render lại đúng từ stored data hiện hành.

## Files allowed

- `modules/application-workspace/app-workspace.js`
- `shared/components/confirm-payment.js` chỉ khi cần adapter nhỏ để component hiện có
  nhận đúng trạng thái/permission; không đổi business rule.
- `scripts/test-otp-underwriting-panels.js`
- `.ai/handoffs/in-progress/FEATURE-OTP-UW-SHARED-PANELS.md`
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-OTP-UW-SHARED-PANELS.md`

## Files prohibited

- `shared/mock/seed/status-mappings.js`
- `shared/mock/seed/case-state-resolver.js`
- `shared/mock/seed/journey-registry.js`
- `shared/mock/seed/applications.js`
- navigation, shell, product rating, policy and payment-method configuration files.
- Mọi file ngoài allowlist nếu chưa được Codex mở rộng bằng corrective handoff.

## Components and tokens to reuse

- `BANCA.ui.otpVerificationPanel`
- `BANCA.ui.underwritingStatusPanel`
- `BANCA.ui.requirementList`
- `BANCA.ui.conditionAcceptance`
- `BANCA.paymentEnableRule`
- Badge/alert/button/card patterns và token từ `shared/styles/tokens.css`.

## Acceptance criteria

1. Motor/PA/Health dùng shared OTP panel cho mọi trạng thái áp dụng, bao gồm pending.
2. Health vẫn render một phiên xác nhận riêng cho từng insured unit; trẻ em hiển thị
   người đại diện; không có CTA xác nhận thay khách.
3. Owner chỉ thấy CTA gửi/gửi lại khi được phép; read-only không có mutation CTA.
4. Tab thẩm định dùng shared underwriting panel cho STP, manual/in-progress,
   need-more-info, approved-with-condition và declined.
5. STP approved không hiển thị queue/officer/SLA thủ công.
6. Yêu cầu bổ sung và điều kiện/loại trừ đọc từ dữ liệu hiện hành, có trạng thái và
   next action bằng tiếng Việt.
7. Không thay state transition, handler, payment gate hoặc policy issuance behavior.
8. Motor/PA/Health và Health per-member regression đều PASS; payment block reasons
   không đổi.
9. Keyboard/focus, responsive 390/768/1280 và reload/deep-link không phát sinh lỗi.
10. Design-token errors/warnings không vượt baseline 1.156/687; không tạo shared
    component trùng.

## Validation commands

- `node --check modules/application-workspace/app-workspace.js`
- `node --check shared/components/confirm-payment.js`
- `node scripts/test-otp-underwriting-panels.js`
- `node scripts/test-underwriting-routing.js`
- `node scripts/test-payment-gate.js`
- `node scripts/test-quote-payment-issue.js`
- `node scripts/test-demo-stories.js`
- `node scripts/test-foundation.js`
- `node scripts/validate-manifest.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- `git diff --check`
- Browser smoke tại 390, 768 và 1280 px cho Motor, PA, Health; owner và read-only.

## Assumptions and open questions

- `CUSTOMER_SELF_SERVICE` tiếp tục là mode đang dùng tại tracking; không bổ sung
  experience mới trong đợt này.
- Component hiện có đủ để đáp ứng; adapter nhỏ được phép nhưng không được đổi state.
- Không còn open question có thể làm thay đổi behavior, permission, state hoặc UX flow.
