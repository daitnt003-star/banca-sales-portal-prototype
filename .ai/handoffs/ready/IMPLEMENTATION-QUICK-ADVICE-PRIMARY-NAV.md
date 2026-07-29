# Implementation handoff

Status: READY_FOR_IMPLEMENTATION
Owner: Codex
Implementer: Claude

## Goal

Khôi phục điểm truy cập trực tiếp tới danh sách record Tư vấn nhanh bằng một menu cấp một, đặt trước Bản chào, không thêm CTA bắt đầu tư vấn mới trong trang danh sách.

## Decision references

- User approval 2026-07-28: menu `Tư vấn nhanh > Bản chào > Hợp đồng`; trong Tư vấn nhanh không cần nút bắt đầu tư vấn mới.
- User approval 2026-07-28: chọn A — triển khai cấu trúc mới.
- Current explicit instruction supersedes `docs/rework-v2/D-source-of-truth-index.md` rule “nav phẳng 5 mục”.

## Source references

- `shared/js/navigation-config.js`
- `shared/js/app-shell.js`
- `modules/quick-advisory/index.html`
- `.ai/governance/uiux-safety-contract.md`

## Files allowed

- `shared/js/navigation-config.js`
- `scripts/test-quick-advice-navigation.js` if a focused deterministic regression test is needed.
- This implementation report/handoff only.

## Files prohibited

- `modules/quick-advisory/index.html` (already has no duplicate start button; do not add one).
- `modules/advisory-workspace/index.html`
- Application, quote, product, pricing, underwriting, payment, policy, and team modules.
- Unrelated dirty-worktree files.

## Requirements

1. Primary nav order for selling-enabled persona:
   `Trang chủ → Tư vấn nhanh → Bản chào → Hợp đồng → Đội nhóm → Trợ giúp`.
2. `Tư vấn nhanh` routes to `modules/quick-advisory/index.html`.
3. `Tư vấn nhanh` uses `VIEW_WORKSPACE`, is `sellingOnly: true`, and is hidden for management-only personas just like Bản chào.
4. Both the list shell active label `Tư vấn nhanh` and the advisory workspace active label `Tư vấn nhanh` highlight the new nav item, not Bản chào.
5. Remove `Tư vấn nhanh` from Bản chào aliases; keep only aliases belonging to the sales/application workspace.
6. Do not add a “Bắt đầu tư vấn mới” CTA to the list page. The existing global header shortcut remains unchanged.
7. Preserve centralized navigation config; do not hard-code a second nav source.
8. Use existing icon mapping only; if no semantically suitable key exists, reuse an existing supported icon rather than edit `app-shell.js`.

## Acceptance criteria

- RM-01 sees six primary items in the approved order.
- A management-only persona does not see selling-only Tư vấn nhanh/Bản chào.
- Opening the list and an individual advice workspace highlights Tư vấn nhanh.
- Opening application workspace highlights Bản chào.
- Quick Advice list contains no local “Bắt đầu tư vấn mới” button.
- Existing permissions and routes remain functional.

## Validation

- Focused static/deterministic test of nav order, route, permission and aliases.
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/validate-design-tokens.js` and verify no relevant count increase.
- Browser smoke if the local server is available: list route, workspace route, application workspace, RM-01 and a management-only persona.

## Assumptions

- “Tư vấn nhanh > Bản chào > Hợp đồng” means these three appear consecutively after Trang chủ; Đội nhóm and Trợ giúp retain their relative order.
- No runtime module change is required outside centralized navigation configuration.
