# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Biến “Việc cần làm ngay” thành Work Queue duy nhất trên Trang chủ, loại bỏ khu vực bàn giao bị lặp nhưng bảo toàn đầy đủ thao tác tiếp nhận, xem ngữ cảnh, yêu cầu bổ sung và từ chối.

## Actor and permissions

- RM/seller đang hoạt động và có selling profile.
- Manager-only tiếp tục redirect sang Team Workspace; không dùng personal queue.
- Handoff action chỉ khả dụng cho target seller và state hiện hành theo service đang có.
- Banca integrated không hiển thị PII trước consent; Agent/Broker giữ behavior hiện hành.

## Source-of-truth references

- User approval 2026-07-28: P0.2 Unified Home Work Queue.
- `modules/seller-workspace/index.html` current `collectActionItems()`, `actionQueueBlock()` and `handoffInbox()`.
- `.ai/governance/uiux-safety-contract.md`.
- P0 UX audit: home duplicates handoffs in queue and separate cards.

## Scope in

- One visible Work Queue containing handoffs, supplement tasks, quote re-rate tasks and submit-ready tasks.
- Remove the separate rendered “Bàn giao mới” section from Home.
- Add clickable queue category filters.
- Preserve one primary action per row.
- Provide secondary handoff actions through an existing modal/drawer/menu pattern.
- Default top eight items; explicit in-place “Xem tất cả/Thu gọn”.
- Loading/empty/error/filter-empty behavior.
- Deterministic regression tests for order, dedupe, privacy and actions.

## Scope out

- No new task database/model/API.
- No changes to handoff state transitions or services.
- No changes to Application Workspace, Team Workspace, Bản chào, Hợp đồng or shared shell.
- No changes to SLA calculation or priority ordering in this slice.
- No changes to seed dates/data.

## Work item contract

Each collected item must provide:

- stable `key` (`HANDOFF:<id>`, `SUPPLEMENT:<id>`, `QUOTE:<id>`, `SUBMIT:<id>`);
- `category`: `HANDOFF|SUPPLEMENT|QUOTE|SUBMIT`;
- `severity`: `HIGH|MED|LOW`;
- due display from existing `relDue`;
- safe customer/reference display;
- kind and supporting description;
- record/case reference;
- one primary action;
- optional secondary actions.

## Business and UX rules

1. Deduplicate by stable key before sorting/rendering.
2. Preserve current priority sort: overdue → severity → due.
3. Default render limit is eight; “Xem tất cả” expands in place and “Thu gọn” returns to eight.
4. Category summary chips act as filters and show counts.
5. Active filter is communicated by text/style, not color alone.
6. Filter `ALL` is always available. Filter with no records renders a filter-specific empty state and recovery to ALL.
7. Handoff primary action remains:
   - Sales handoff: `Tiếp nhận & bán hàng`;
   - Case reassignment: `Tiếp nhận & xử lý`;
   - Delegation: `Bắt đầu công việc`.
8. Handoff secondary actions remain: `Xem ngữ cảnh/khách hàng`, `Cần bổ sung` when allowed, and `Từ chối`.
9. Secondary actions must use existing modal functions; do not duplicate handoff transition logic.
10. Supplement, quote and submit items retain their current primary deep links.
11. Removing the separate handoff cards must not remove any information/action needed to decide whether to accept.
12. Banca integrated item and review modal remain PII-safe.
13. Agent/Broker continues to display permitted customer data.
14. Queue interaction must be keyboard reachable with visible focus.

## UI specification

- Reuse existing `dtable`, badge, button, modal and filter chip language.
- Queue columns: `Ưu tiên | Hạn/SLA | Tham chiếu/Khách hàng | Việc tiếp theo | Hồ sơ | Hành động`.
- Primary action remains visible in the row.
- Secondary handoff action trigger uses `Khác` or `Xem thêm`, at least 32×32px desktop and 44×44px at touch breakpoint.
- Filter chips appear above the table and wrap at narrower widths.
- No new raw color, spacing, radius, shadow or z-index.

## Files allowed

- `modules/seller-workspace/index.html`
- `scripts/test-home-work-queue.js`
- `scripts/test-privacy-home.js` only for regression assertion updates.
- Implementation report for this feature.

## Files prohibited

- Shared components/styles/shell.
- Handoff seed/service files.
- Application, team, advice, quote, policy, payment and underwriting modules.
- Blocked continuity handoffs and unrelated dirty files.

## Acceptance criteria

1. A handoff appears once on Home, inside Work Queue only.
2. All four categories appear with correct count when data exists.
3. Filters show only matching items and ALL restores the queue.
4. Default limit eight, expand/collapse works without navigation.
5. Sort order remains overdue → severity → due.
6. Each row has exactly one primary action.
7. Handoff secondary actions remain reachable and call existing handlers.
8. Banca privacy and Agent/Broker regression pass.
9. Queue empty and filter-empty states include a recovery action.
10. Existing lower Home sections remain unchanged.
11. No new design-token violations.

## Validation commands

- `node scripts/test-home-work-queue.js`
- `node scripts/test-privacy-home.js`
- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/validate-design-tokens.js`
- Browser smoke: ALL, each category, expand/collapse, handoff secondary menu, Banca and Agent/Broker.

## Baseline

- Handoff currently renders once in `actionQueueBlock()` and again in `${handoffInbox()}`.
- Design token baseline: 1,153 errors / 685 warnings.

## Assumptions and open questions

- No shared Work Queue component is created until there is a second evidenced consumer.
- Current fixed demo time in `relDue()` is preserved; time-source remediation is outside P0.2.
