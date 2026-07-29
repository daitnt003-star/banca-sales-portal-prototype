# Implementation result

Status: IMPLEMENTED_PENDING_QC
Feature: QUICK-ADVICE-PRIMARY-NAV
Implementer: Claude

## Files changed

- `shared/js/navigation-config.js`
  - Thêm primary nav `Tư vấn nhanh` ngay sau `Trang chủ`.
  - Dùng route `modules/quick-advisory/index.html`, permission `VIEW_WORKSPACE`,
    `sellingOnly: true` và icon `advise` đã có trong `app-shell.js`.
  - Xóa alias `Tư vấn nhanh` khỏi `Bản chào`; giữ `Yêu cầu bảo hiểm` và
    `Workspace` cho sales/application workspace.
- `scripts/test-quick-advice-navigation.js`
  - Thêm deterministic regression cho thứ tự, route, permission, selling-only
    filtering, active nav ownership và việc không có CTA local
    “Bắt đầu tư vấn mới”.
- `.ai/handoffs/completed/IMPLEMENTATION-QUICK-ADVICE-PRIMARY-NAV.md`
  - Báo cáo implementation này.

## Acceptance criteria evidence

- RM-01 selling-enabled nhận đúng thứ tự:
  `Trang chủ → Tư vấn nhanh → Bản chào → Hợp đồng → Đội nhóm → Trợ giúp`.
- Management-only (`sellingEnabled: false`) không thấy cả `Tư vấn nhanh` và
  `Bản chào`.
- `shell('Tư vấn nhanh', ...)` của list và advisory workspace khớp trực tiếp nav
  mới; không còn khớp alias của `Bản chào`.
- `shell('Bản chào', ...)` của application workspace vẫn khớp `Bản chào`.
- Quick Advice list không có CTA local “Bắt đầu tư vấn mới”.
- Navigation tiếp tục chỉ được khai báo tại `BANCA.NAV_CONFIG`; không sửa shell hay
  module runtime khác.

## Validation results

- `node scripts/test-quick-advice-navigation.js` — PASS, 13/13.
- `node scripts/validate-modules.js` — PASS, `VALID_MODULES`.
- `node scripts/validate-terminology.js` — PASS, quét 93 files.
- `node scripts/validate-design-tokens.js` — PASS (report mode),
  1153 errors / 685 warnings, không đổi so với baseline.
- `git diff --check -- shared/js/navigation-config.js scripts/test-quick-advice-navigation.js`
  — PASS.
- Browser smoke — SKIPPED: không có local project server truy cập được trong
  sandbox; các listener phát hiện trên host không nhận kết nối localhost từ
  execution environment.

## UI/UX safety check

- Không thêm design token, CSS, layout hoặc responsive rule.
- Dùng icon `advise` hiện hữu, không sửa `app-shell.js`.
- Không thêm CTA vào Quick Advice list; global header shortcut không đổi.
- Thứ tự và active ownership được khóa bằng deterministic test.

## Assumptions used

- Hai shell call `Tư vấn nhanh` hiện hữu là nguồn active label cho list và advisory
  workspace.
- Hai aliases còn lại của `Bản chào` thuộc sales/application workspace theo
  handoff.

## Errors encountered and resolved

- Không có implementation hoặc validation failure.
- Browser smoke không chạy được vì không có local project server khả dụng trong
  sandbox; không tự khởi động server vì validation xác định smoke chỉ conditional.

## Remaining risks

- Visual browser smoke còn chờ Codex QC trên môi trường local có server.
- Reflection ledger không được sửa vì nằm ngoài file allowlist; Codex final-QC
  owner cần hoàn tất reflection theo governance.
