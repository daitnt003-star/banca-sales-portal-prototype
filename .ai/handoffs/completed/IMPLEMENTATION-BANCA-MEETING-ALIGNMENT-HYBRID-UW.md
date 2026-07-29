# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: FEATURE-BANCA-MEETING-ALIGNMENT-HYBRID-UW (corrective attempt 1)
Implementer: Claude

## Context

Corrective attempt 1. Codex đã review dependency và bổ sung
`shared/mock/seed/status-mappings.js` vào allowlist để cổng thanh toán canonical
hỗ trợ `APPROVED_WITH_LOADING` và `APPROVED_WITH_EXCLUSION`. Tiếp tục từ các thay đổi
sẵn có trong workspace (engine layer CP1/CP4 + gating), hoàn thiện các checkpoint còn
lại (đặc biệt CP2 Quick Advice và CP3/CP5 hợp đồng–callback), giữ nguyên mọi thay đổi
không liên quan.

## Files changed

Thuộc allowlist. Các file engine/shared đã có sẵn thay đổi từ trước, phiên này bổ sung:

- `shared/mock/seed/status-mappings.js` — (dependency được duyệt) gating dùng `isApprovedDecision`/`isApprovedWithTerms` → LOADING/EXCLUSION là nhóm "duyệt kèm điều kiện", chặn thanh toán tới khi khách xác nhận; đọc trực tiếp trạng thái version báo giá (re-rate không lọt cổng).
- `shared/mock/seed/case-state-resolver.js` — enum quyết định thêm `APPROVED_WITH_LOADING`/`APPROVED_WITH_EXCLUSION`; nhóm quyết định `UW_APPROVED_*` + helper `isApprovedDecision`/`isApprovedWithTerms` (1 nguồn).
- `shared/mock/seed/product-schemas.js` — Health HYBRID underwriting (STP_PASS / MORE_INFORMATION_REQUIRED / MANUAL_REVIEW / DECLINED) + routing contract đầy đủ cho Motor/PA/Health.
- `shared/mock/seed/journey-registry.js` — routing contract canonical; `makePayment` suy `payerType` (`SELLER_OR_AGENT` cho thu hộ, `CUSTOMER` cho QR/link); `makePolicy` giữ `quoteId/quoteVersion/approvedQuoteSnapshot`; thêm `policyQuoteRef` + `makeBankCallback` (contract callback ngân hàng).
- `shared/mock/seed/customer-data-access.js` — `fetchCustomerPII` FAIL-CLOSED (không fallback pool[0]); `makeConsentRecord` (consent audit contract đầy đủ).
- `shared/components/foundation-components.js` — `grantConsent`/`ensureIdentifiedPrefill` fail-closed + ghi consent audit.
- `shared/components/confirm-payment.js` — panel dùng `isApprovedWithTerms` để hiện khối điều kiện cho CONDITION/LOADING/EXCLUSION.
- `shared/mock/seed/advice-sessions.js` — **CP2**: bỏ trạng thái/nhóm `SAVED`; thêm 4 outcome chuẩn `CUSTOMER_ACCEPTED`/`FOLLOW_UP`/`NOT_INTERESTED`/`SHARED_WITH_CUSTOMER` + `BANCA.ADVICE_OUTCOMES`; giữ alias cũ cho seed.
- `modules/quick-advisory/index.html` — **CP2**: bỏ tab "Đã lưu", thêm tab "Đã gửi khách"; `adviceActions` lọc theo nhóm.
- `modules/advisory-workspace/index.html` — **CP2**: xóa `advSaveSession` (dead code SAVED); "Gửi bản tư vấn" → outcome `SHARED_WITH_CUSTOMER`; follow-up → `FOLLOW_UP`; convert → `CUSTOMER_ACCEPTED`; cập nhật điều kiện khoá/banner.
- `modules/application-workspace/app-workspace.js` — **CP5/CP3**: intent thu hộ ghi `payerType` canonical; issue gắn `policyQuoteRef` (HĐ trỏ version duyệt) + phát `makeBankCallback` (external ref + quote version + policy/GCN).
- `scripts/test-payment-gate.js` — cập nhật substring khớp copy mới (CONDITION/LOADING/EXCLUSION), không nới lỏng kiểm thử.
- `scripts/test-privacy-consent.js`, `scripts/test-underwriting-routing.js` — (đã có) CP1/CP4.
- `scripts/test-advice-outcome.js` (mới) — CP2.
- `scripts/test-quote-payment-issue.js` (mới) — CP3/CP5.
- `scripts/test-demo-stories.js` (mới) — CP6 ba story end-to-end.

Không chạm file cấm (`tokens.css`, `app-shell.js`, `app-manifest.json`, governance, AGENTS.md, CLAUDE.md) và không sửa/xóa các thay đổi working-tree không liên quan (`.gitignore`, `index.html`, `showcase*`, các báo cáo gốc đã xóa).

## Acceptance criteria evidence

### Privacy (CP1)
- PII ẩn trước consent; unknown ref không trả PII khách khác; consent audit đầy đủ; recovery khi mã sai → `test-privacy-consent.js` (29/29).

### Quick Advice (CP2)
- Không còn status/tab/action `SAVED`; 4 outcome chuẩn hoạt động + đúng nhóm; autosave không đổi outcome; convert mang đúng 1 `selectedOffer` → `test-advice-outcome.js` (21/21). Protection-gap/recommendation không hồi quy → `test-advisory-context.js` (51), `test-advisory-recommendation.js` (40).

### Quote (CP3)
- Approved immutable; re-rate tạo version mới + supersede + reset UW; cấm sửa phí tay; Policy trỏ `quoteId/quoteVersion/approvedQuoteSnapshot` → `test-quote-payment-issue.js` (mục 1–3).

### Underwriting (CP4)
- Motor STP/referral; Health clean→STP (không manual queue), thiếu info→MORE_INFORMATION_REQUIRED, review→MANUAL_REVIEW, hard-decline→DECLINED; nhãn nghiệp vụ (không raw enum) → `test-underwriting-routing.js` (42/42).

### Confirmation/payment/issue (CP5)
- Manual/declined không thanh toán trước duyệt; CONDITION/LOADING/EXCLUSION phải xác nhận trước khi thu; 3 phương thức + quyền thu hộ; thu hộ ghi `SELLER_OR_AGENT`; success chỉ từ callback; issue kèm Policy/GCN + callback đúng ref → `test-quote-payment-issue.js` (mục 4–6), `test-payment-gate.js` (26/26), `test-post-submit.js` (16/16).

### CP6
- Ba story bắt buộc pass end-to-end → `test-demo-stories.js` (16/16).

## Validation results

Toàn bộ exit 0:

- test-advisory-context 51 · test-advisory-recommendation 40 · test-foundation 58 · test-manager-commission 35 · test-payment-gate 26 · test-post-submit 16 · test-privacy-consent 29 · test-underwriting-routing 42 · test-advice-outcome 21 · test-quote-payment-issue 39 · test-demo-stories 16 (tất cả FAIL:0).
- validate-manifest / validate-modules / validate-manifest-sync / detect-duplicate-components: PASS.
- validate-terminology: PASS (scanned 93 files) — không lộ nhãn cũ, không raw enum.
- validate-design-tokens: exit 0 (report mode); không thêm vi phạm token mới ở file thay đổi.
- `node --check modules/application-workspace/app-workspace.js`: OK.

## UI/UX safety check

- Tái dùng page-shell, tab, badge, card, drawer, modal, sticky footer hiện có; không copy shared component vào module; không thêm màu/spacing/radius/shadow/z-index/motion tùy tiện (dòng style thêm mới duy nhất giữ nguyên `margin-bottom:12px` on-scale).
- Nhãn tiếng Việt; trạng thái không chỉ mã hoá bằng màu (kèm text/label).
- CP2 chỉ đổi nhãn/tab/logic outcome, không đổi navigation/IA/breakpoint.
- Health STP không hiển thị queue/officer/SLA; Manual làm rõ điều kiện + hành động khách.

## Assumptions used

- Yêu cầu trực tiếp của user (Health HYBRID) supersede docs "luôn manual/luôn STP".
- `CONVERTED_TO_SALE`/`FOLLOW_UP_LATER` giữ làm alias tương thích seed cũ; logic mới ghi outcome canonical.
- STP sạch: OTP là xác thực tại cổng thanh toán (khách tự nhập), success chỉ từ callback — nhất quán hành vi/kiểm thử hiện có; xác nhận trước thanh toán chỉ bắt buộc cho quyết định kèm điều kiện/phụ phí/loại trừ.

## Errors encountered and resolved

- `test-payment-gate.js` fail do copy gating đổi "điều kiện/loại trừ" → "điều kiện/phụ phí/loại trừ" (bao trùm LOADING/EXCLUSION). Sửa substring khớp copy nghiệp vụ mới, giữ nguyên độ chặt kiểm thử (không nới lỏng). Sau sửa: 26/26.
- Test demo-story ban đầu over-assert "STP trước OTP → khoá"; chỉnh theo thiết kế đã kiểm thử (STP sạch payable, OTP tại cổng, success chỉ từ callback).

## Remaining risks

- Browser smoke (desktop/tablet/mobile + keyboard) chưa chạy trong môi trường này; logic đã phủ bằng test tất định. Đề nghị Codex chạy smoke UI khi QC.
- `payerType='SELLER_OR_AGENT'` chỉ set ở đường intent runtime + builder; seed fixtures lịch sử giữ `CUSTOMER` (backward-compat, không thuộc scope sửa dữ liệu cũ).
