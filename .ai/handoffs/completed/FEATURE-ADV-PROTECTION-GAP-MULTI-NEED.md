# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: FEATURE-ADV-PROTECTION-GAP-MULTI-NEED — Protection gap config hoá + gợi ý nhiều nhu cầu/nhiều sản phẩm + comparison drawer
Implementer: Claude

## Files changed

Chỉ chạm file trong allowlist:

- `shared/mock/seed/advice-sessions.js`
  - Thêm `BANCA.PROTECTION_GAP_CONFIG` (versioned `GAP-2026.07`) + `BANCA.protectionGap(state)`.
  - `BANCA.financialGapByNeed(state)` → wrapper tương thích, delegate sang `protectionGap`.
  - Thêm `BANCA.RECOMMENDATION_CONFIG` + `BANCA.recommendPlans(state)` và helper: `advMonthlyVnd`, `advNeedWeights`, `advEligibleOffers`, `_needCoveredBy`, `_buildPlan`, `PRODUCT_GROUP`.
- `modules/advisory-workspace/index.html`
  - Bỏ `compare` khỏi `STEPS`; coerce deep link `?step=compare` về `recommend`.
  - Chuẩn hoá `compareSet` sang khoá gộp `productRef:packageRef` (backward-compat data cũ).
  - Gap card mới: giả định → cách tính → gap → % → disclaimer, có nhãn `Kịch bản minh họa`/personalized.
  - Plan cards cho ≥2 nhu cầu (`planCard`) + CTA `Xem sản phẩm khác`.
  - Comparison drawer (`advOpenCompare`) + sticky comparison bar (`cmpBar`) + alternatives drawer (`advOpenAlternatives`).
  - Drawer infra: dialog semantics, focus trap, Escape, close button, return focus (`advDrawerOpen/Close/Keydown`).
  - `advSelectPlan`, `advSelectOfferRef`, `applySelectedOffer`, `advToggleCompareRef`, `advClearCompare`.
  - Bỏ `bodyCompare` + `advToggleDiff` (không còn bước so sánh).
  - Thêm CSS token-based cho plan-card / cmp-bar / drawer / tiện ích kv trong `<style>` module (không sửa `components.css`).
- `scripts/test-advisory-recommendation.js` (mới) — 40 test cho §A + §B.
- `.ai/handoffs/in-progress/…` (copy trạng thái, không đổi requirement).

Không chạm file prohibited (`app-manifest.json`, `app-shell.js`, `tokens.css`, module khác). Thay đổi chưa commit ngoài phạm vi của user (`index.html`, `showcase*.html`, các file `.md` bị xoá) được giữ nguyên.

## Acceptance criteria evidence

| AC | Kết quả | Bằng chứng |
|---|---|---|
| Không còn `80.000.000`/`20.000.000` hard-code trong health gap calc | PASS | test A1 (`protectionGap.toString()` không chứa 2 số); số nằm trong `PROTECTION_GAP_CONFIG.health` |
| "Không có BHYT" → BHYT contribution = 0 | PASS | test A2 |
| Hospital preference đổi estimated treatment | PASS | test A3 (Quốc tế ×3.2 > Công ×1.0) |
| Existing coverage/reserve giảm gap; gap không âm | PASS | test A4 |
| Thiếu input → `Kịch bản minh họa` + assumptions | PASS | test A5 + gap card render nhãn + list giả định |
| 1 nhu cầu không regression | PASS | test B2 + `test-advisory-context` 51/51 + offer cards giữ nguyên |
| ≥3 nhu cầu → `BUDGET_FIT` + `FULLER_COVERAGE` | PASS | test B4 |
| Mỗi plan hiện covered/remaining/total/explanation | PASS | test B4 + `planCard` |
| Không auto-select/add product | PASS | test B4 (plan không có field `selected`); `applySelectedOffer` chỉ chạy khi bấm |
| Có `Xem sản phẩm khác` + chọn eligible alternative | PASS | `advOpenAlternatives` + `advSelectOfferRef` (gate readiness); sim alt eligible=true |
| Không lộ raw package code khi có label | PASS | mọi nơi hiển thị dùng `packageName`; `packageRef` chỉ trong `onclick`, không render |
| `compare` không còn trong stepper | PASS | `STEPS` 4 mục |
| Drawer chỉ mở với ≥2, giới hạn 3 | PASS | `advOpenCompare` chặn <2; `advToggleCompareRef` cap 3; `cmpBar` chỉ hiện ≥2 |
| Đóng drawer không mất compare selection | PASS (review) | `advDrawerClose` chỉ xoá drawer root; `compareSet` lưu ở state + localStorage |
| Drawer keyboard accessible + responsive | PASS (review) | role=dialog/aria-modal/aria-labelledby, focus trap Tab, Escape, close btn, return focus; media desktop/tablet/mobile |
| Convert to sale giữ đúng lựa chọn cuối | PASS | `advSelectPlan` set `selectedOffer`=primary + `selectedProductId/PackageId`; sim convert-ready=true; `app-workspace.js` đọc `selectedOffer` |
| Không tăng design-token violations file đã sửa | PASS | advisory-workspace 125 == baseline 125 |
| Validator nền + test mới pass | PASS | xem mục dưới |

## Validation results

Baseline (trước khi sửa) đã ghi: advisory-context 51/0, foundation 58/0, terminology PASS, duplicate OK, design-tokens advisory-workspace = 125.

Sau khi sửa:

- `node --check shared/mock/seed/advice-sessions.js` → OK
- `node scripts/test-advisory-recommendation.js` → PASS 40 / FAIL 0 (mới)
- `node scripts/validate-terminology.js` → PASS (93 files)
- `node scripts/detect-duplicate-components.js` → DUPLICATE_COMPONENT_SCAN_OK
- `node scripts/test-foundation.js` → PASS 58 / FAIL 0
- `node scripts/validate-design-tokens.js` → advisory-workspace **125** (== baseline, không tăng); tổng dự án giảm (1165→1157 lỗi) do bỏ dead code `bodyCompare`
- Regression `node scripts/test-advisory-context.js` → PASS 51 / FAIL 0
- Module inline JS `node --check` (trích xuất) → OK

Smoke bằng mô phỏng Node (không có browser trong môi trường): reload seed `ADV-2026-010` (compareSet chuẩn hoá `health:BASIC/health:STANDARD`, gap 48.000.000/60% illustrative), 2 nhu cầu → BUDGET_FIT(1)+FULLER_COVERAGE(2), 3 nhu cầu trong/vượt ngân sách (within=false, score khác nhau), health có/không BHYT, hospital Công/Tư/Quốc tế, chọn alternative eligible, plan→selectedOffer convert-ready.

## UI/UX safety check

- Tái dùng page-shell, `card`, `btn`, `badge`, `cmp-table`, convention modal/drawer hiện có; không tạo page pattern mới.
- Drawer dùng token `--z-drawer`, `--shadow-3`, spacing/text/radius scale; comparison bar dùng `--z-sticky`.
- Không mã hoá trạng thái chỉ bằng màu: gap dùng nhãn `Kịch bản minh họa`/`mặc định`; drawer gaps có `⚠️` + chữ; eligible/không dùng badge chữ.
- States: loading không áp dụng (render đồng bộ); empty (no-eligible plan, alt trống), invalid/no-eligible-product (guided empty state, không fallback sản phẩm cấm), disabled (footer CTA), locked.
- Copy tiếng Việt production-like; không lộ enum/package code.
- Accessibility drawer: dialog semantics + focus trap + Escape + return focus; responsive theo `--bp-*`; tôn trọng `prefers-reduced-motion`.

## Assumptions used

- Giá trị config (chi phí điều trị, hệ số bệnh viện, benefitRate/routeFactor BHYT, existingRemaining, family/loan/motor) là **minh họa** và được gắn nhãn tương ứng — theo "Assumptions and open questions" của handoff.
- Offer catalog hiện có (`ADVICE_OFFERS`) là universe sản phẩm eligible cho prototype.
- Drawer (không phải centered modal) cho so sánh và alternatives.
- `advMonthlyVnd` chuẩn hoá phí/tháng minh họa (K/triệu/tỷ) cho scoring; không đổi `explainOffer` cũ để tránh regression hiển thị.
- Không thay đổi Application Workspace/Start Sale; `selectedOffer` giữ hợp đồng cũ nên convert không cần chọn lại.

## Errors encountered and resolved

- Lần đầu render UI làm design-token violations của module tăng 125→140 (inline style dài + off-scale px/màu + font-size 9/10px mới). Đã đưa style mới vào `<style>` module bằng token/`calc(var())` và thêm class tiện ích (`adv-kv`, `adv-sub`, `adv-hint`, `adv-th`, `adv-x`, `plan-card`, `adv-drawer*`, `badge-mini`), rewrite markup gap/plan/drawer → về đúng baseline 125.
- Deep link cũ `?step=compare` sau khi bỏ bước: thêm coercion về `recommend`.
- `compareSet` seed cũ ở dạng bare packageRef: thêm chuẩn hoá sang khoá gộp khi load để tránh nhầm giữa sản phẩm (BASIC trùng tên).

## Remaining risks

- Keyboard/focus-trap và responsive breakpoint của drawer mới được kiểm bằng review mã, chưa chạy browser thực trong môi trường này — cần Codex QC xác nhận trên trình duyệt (danh mục smoke ở handoff).
- Môi trường openclaw đang auto-commit trong lúc làm: một số thay đổi đã vào commit `f17548d`/`24e7870`; working tree on-disk là nguồn đầy đủ và đã validate. Thay đổi ngoài phạm vi của user vẫn ở trạng thái chưa commit (được bảo toàn).
- `advOfferDetail` (cũ) trở thành dead code sau khi bỏ `bodyCompare`; giữ nguyên để không mở rộng phạm vi — có thể dọn ở lần sau.
