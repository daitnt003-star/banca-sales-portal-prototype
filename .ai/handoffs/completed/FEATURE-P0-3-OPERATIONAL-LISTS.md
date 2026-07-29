# Feature handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude

## Goal

Chuẩn hóa khả năng quét mắt, action hierarchy và accessibility cho ba danh sách Tư vấn nhanh, Bản chào và Hợp đồng theo anatomy sáu cột, trong khi giữ renderer và business contract riêng của từng nghiệp vụ.

## Actor and permissions

- Seller/RM sees own records and allowed actions.
- Wider organizational scopes keep existing permission/data-scope behavior.
- Management-only and disabled seller behavior remain unchanged.
- PII rendering continues to follow current channel/data-access behavior.

## Source-of-truth references

- User approval 2026-07-28: P0.3 six-column operational list structure.
- `shared/components/quote-list-shell.js` as the current Bản chào reference structure.
- P0 UX audit screenshots and metrics.
- `.ai/governance/uiux-safety-contract.md`.

## Scope in

- Shared operational-list anatomy/styles only; no generic business renderer.
- Quick Advice list reduced from eleven to six columns.
- Bản chào retains its six-column reference anatomy; normalize styling/accessibility only where required.
- Policy list reduced to six columns and one primary action.
- Secondary actions use a consistent `Khác` disclosure pattern.
- Record identifiers remain explicit keyboard-accessible links.
- Shared CSS and pilot loader cache versions are updated deterministically.
- Focused deterministic tests plus browser/keyboard smoke.

## Scope out

- No detail screens, Application Workspace, Advice Workspace or Policy Cockpit changes.
- No business status, permission, pricing, underwriting, payment, API or seed changes.
- No generic data-table engine or cross-domain renderer.
- No mobile card redesign; tablet horizontal overflow remains supported.
- No submitted Bản chào renderer behavior change unless strictly necessary for shared style compatibility.

## Standard anatomy

Logical scan order:

1. Object and customer/context.
2. Product/need/plan.
3. Status and next action.
4. Due/update/effective period.
5. Value/linked object.
6. Action.

Every table:

- uses an `.operational-list` class;
- has scoped column headers;
- aligns monetary values right;
- keeps the final action column visible where the existing sticky pattern supports it;
- exposes one primary action maximum per row;
- places secondary/destructive actions in a `Khác` disclosure;
- does not rely on row click as the only navigation mechanism.

## Quick Advice columns

1. `Phiên tư vấn & khách hàng`
   - advice ID link, version, customer/reference and source metadata.
2. `Nhu cầu & phương án`
   - primary need, selected product/package and indicative premium as secondary metadata.
3. `Trạng thái & việc tiếp theo`
   - status badge plus action-oriented next-step copy derived from the existing status group.
4. `Bản chào liên kết`
   - converted case link or em dash.
5. `Cập nhật`
   - update timestamp and advisor metadata.
6. `Hành động`
   - one primary/secondary main action; delete draft or additional navigation under `Khác`.

No source, advisor or premium standalone columns.

## Bản chào columns

Retain reference columns:

1. Bản chào & khách hàng.
2. Phương án.
3. Trạng thái & việc tiếp theo.
4. Phí.
5. Cập nhật.
6. Hành động.

For non-self scope, owner metadata may remain according to the existing preset. Do not alter lifecycle/status logic or CTA resolver.

## Policy columns

1. `Khách hàng & hợp đồng`
   - customer context, policy ID/certificate.
2. `Sản phẩm`
   - product/package and insured asset metadata.
3. `Trạng thái & việc tiếp theo`
   - status badges plus state-derived next step such as Gửi GCN, Tái tục, Xem lý do hủy or Theo dõi.
4. `Hiệu lực`
   - effective range and days remaining.
5. `Phí`
   - right aligned.
6. `Hành động`
   - one state-derived primary action; Detail is the policy ID link; remaining actions under `Khác`.

Owner/participants appear as secondary metadata only when scope is not SELF.

## Action rules

1. Quick Advice:
   - ACTIVE → `Tiếp tục tư vấn`;
   - FOLLOW_UP/SHARED with offer → `Tạo bản chào từ tư vấn này`;
   - CONVERTED with case → `Mở bản chào`;
   - other view-only → `Xem bản tư vấn`;
   - delete draft is always secondary/destructive.
2. Policy:
   - new/certificate-required → `Gửi GCN`;
   - renewal due → `Tái tục`;
   - claim-capable without higher-priority action → `Tạo bồi thường`;
   - cancelled/expired without operation → no forced primary; record link remains navigation.
3. `Khác` must be keyboard accessible and communicate expanded state.
4. Existing permission/state functions remain the source for whether an action is available.

## Accessibility

- Do not use `<tr onclick>` as the sole navigation method; policy ID/advice ID/application ID links must work independently.
- If row click remains as a pointer convenience, it must not swallow nested controls and must have an equivalent keyboard link.
- Table header cells use `scope="col"`.
- Visible focus and accessible names for action disclosures.
- New action targets: minimum 32×32px desktop, 44×44px coarse pointer.
- Status always includes text.

## Visual specification

- Reuse PageHeader, search, tabs, filters, dtable/offer-table, badge and button tokens.
- Add only operational-list structural classes to `shared/styles/components.css`.
- Use token-based spacing, typography, border, focus and breakpoint values.
- No new raw palette, shadow, radius or z-index.
- Quick Advice and Policy tables use controlled minimum width with horizontal scrolling at tablet.

## Files allowed

- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html` only for operational-list opt-in/class if needed.
- `modules/policies/index.html`
- `shared/components/quote-list-shell.js` only for non-behavioral anatomy/accessibility class/header scope if needed.
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-operational-lists.js`
- Existing focused navigation/header tests only if cache-version assertions require updates.
- Implementation report.

## Files prohibited

- `modules/submitted-applications/**`
- Advice/Application workspaces and Policy detail behavior.
- Shell, navigation, state resolver, permission and seed files.
- Blocked continuity handoffs and unrelated dirty changes.

## Acceptance criteria

1. Quick Advice renders exactly six headers in the approved order.
2. Policy list renders exactly six headers in the approved order.
3. Bản chào SELF/PREPARING remains six logical columns and current filter/CTA behavior passes regression.
4. Each Quick Advice and Policy row has at most one primary CTA.
5. Secondary/destructive actions are reachable through keyboard-accessible `Khác`.
6. Advice/policy record IDs remain direct links.
7. Quick Advice source, advisor and premium information is preserved as metadata, not lost.
8. Policy owner/participant data is preserved for non-SELF scope.
9. Existing filters, counts, deep links and permission behavior remain unchanged.
10. Header cells have `scope="col"` and status is not color-only.
11. No new token violations; pilot cache keys load compatible shared CSS.
12. Browser smoke confirms no column/action overlap at desktop and usable horizontal overflow at tablet-sized viewport.

## Validation commands

- `node scripts/test-p0-operational-lists.js`
- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/test-quick-advice-navigation.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/detect-duplicate-components.js`
- `node scripts/validate-design-tokens.js`
- Browser/keyboard smoke on three lists, SELF and one manager scope where available.

## Baseline

- Quick Advice: eleven columns.
- Policy: seven columns.
- Bản chào SELF/PREPARING: six columns.
- Design token: 1,141 errors / 682 warnings.

## Cache requirement

- Increment the deterministic shared asset version once because `components.css` changes.
- Increment the loader query on the three pilot pages consistently.
- Extend focused assertions so cache-version mismatch cannot recur.

## Assumptions and open questions

- “Ba danh sách” refers to Quick Advice, Bản chào and Policy list views, not their detail/workspace screens.
- Bản chào remains the reference implementation; avoid changing its renderer unless required for semantic classes.
