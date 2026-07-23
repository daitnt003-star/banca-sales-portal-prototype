
## 2026-07-21 11:12 — Policy Detail Cockpit redesign
- Trigger: PO feedback that Policy Detail is information-heavy and not user-friendly.
- Decision: redesign as Policy Cockpit with hero, summary strip, two-column content, sticky side rail, linked documents, visible commission.

## 2026-07-21 11:26 — Cross-screen layout review
- Trigger: user reported inconsistent layout and asked to audit all screens.
- Output: docs/ux/reviews/cross-screen-layout-review-2026-07-21.md.
- Recommendation: patch Application Workspace Documents step first, then shared document row/list header/tracking tab grouping.

## 2026-07-21 11:26 — Full layout consistency patch
- Added scoped shared patterns in `tokens.css` and `app-shell.js`: `ux-list-header`, `ux-doc-review`, `ux-doc-row`, `ux-bottom-actions`, `ux-tab-group`, `ux-priority-card`.
- Patched Application Workspace Documents step and Submitted Documents tab to reuse Document Review pattern.
- Patched Unsubmitted/Submitted lists with list-filter-header pattern.
- Patched Submitted Tracking tabs with visual groups: Hồ sơ / Xử lý / Kết quả.
- Patched Home toward priority cards and Team Workspace toward Manager Cockpit hierarchy.

## 2026-07-21 11:44 — Tracking overview timeline alignment
- User requested timeline/progress to become a parallel column with content or be synchronized with other screen layouts.
- Patched submitted Application Workspace Overview: summary content is left column, `Tiến trình` is sticky right column, matching cockpit/detail layout direction.
- Fixed submitted list render issue by using `all.length` instead of undefined `base.length` in list header.
- Cache-bust bumped to module pages `head-loader.js?v=10`, internal `V='v=20260721f'`.

## 2026-07-21 11:47 — UX correction after PO critique
- User rejected prior dashboard/document layout: checklist was over-emphasized, cards had uneven heights, and action buttons were jagged.
- Correction: compressed document checklist into a compact secondary status strip; required document library is the primary visual focus.
- Standardized document row actions with fixed-size aligned buttons.
- Standardized Home priority cards to equal-height two-column cards and moved quote-expiry title inside the card.
- Cache-bust bumped to module pages `head-loader.js?v=11`, internal `V='v=20260721g'`.

## 2026-07-21 11:51 — Quote tab 2-column redesign
- User provided detailed requirements for `Gói & phí` layout.
- Patched submitted Application Workspace quote tab:
  - Stronger sticky summary header with case/customer/product left and status/total premium/actions right.
  - Journey tabs separated from result utility tabs (`Hợp đồng`, `Lịch sử`).
  - 68/32 two-column content layout.
  - Left column: selected package summary card, add-on item cards, grouped benefit accordions, detailed fee accordion.
  - Right column: sticky Fee Summary + CTA + system state notes.
  - Fee breakdown now uses table columns: Thành phần, Cơ sở tính, Tỷ lệ, Thành tiền.
- Cache-bust bumped to module pages `head-loader.js?v=12`, internal `V='v=20260721h'`.

## 2026-07-21 12:20 — P0 UI/UX Constitution batch
Applied ChatGPT P0 recommendations following new UI/UX Constitution:
- Global typography floor lifted in tokens.css: body 14px/1.5, dtable 13.5px, th 12px uppercase, .h1 25px/700, section-title 17px/600, card-head 16px/600.
- Home: replaced oversized welcome hero with slim .home-head (identity + subtitle) + two-weight CTAs [Bắt đầu bán hàng primary][💡 Tư vấn nhanh secondary]; work-queue priority first; moved KPIs to light .kpi-strip.light under new "Hiệu suất cá nhân" section.
- Application detail (tracking) header: big ID + subtitle, status badge, emphasized total premium, new "Việc tiếp theo" next-action row with primary CTA derived from business status (separate from journey step).
- Edit-mode (draft) header: same hierarchy lift (big ID + Chưa nộp badge + subtitle + phí tạm tính emphasized).
- Tracking tabs: renamed groups HÀNH TRÌNH / KẾT QUẢ, moved Tổng quan to utility, numbered journey steps (1..7).
- Lists: unsubmitted CTA now next-action by stage (Tiếp tục chọn gói / Bổ sung tài liệu / Tính phí lại / Kiểm tra & nộp); submitted CTA already next-action; bumped list metadata to 12px min.
- Cache-bust: module pages head-loader.js?v=14, internal V='v=20260721j'.
Browser smoke passed: Home, unsubmitted list, submitted list, tracking quote (APP-2026-110), draft journey (DRAFT-2026-006).

## 2026-07-21 12:45 — Home fix + P1 batch
- Home priority cards made consistent (both have title+subtitle+count badge); Hợp đồng/Thông báo cards equal-height with vertical scroll (max-height 340px).
- Doc rows: extended uxDocRow with stateOf (MISSING/UPLOADED/CHECKING/ACCEPTED/REJECTED/REPLACE) + Tải lại action; guided empty state; processing-state legend.
- Added statusBanner helper; UW and confirm tabs now lead with status summary card.
- Policy tab: issued-success header + Tải hợp đồng/Gửi cho khách CTAs + next-steps grid.
- Cache-bust: head-loader.js?v=16, V='v=20260721l'.

## 2026-07-21 13:05 — P2 polish (responsive/a11y/motion/help)
- tokens.css: tablet breakpoints (1024/768) collapsing 2-col layouts + kpi strips; :focus-visible outlines; skip-link; prefers-reduced-motion-gated transitions + fade-in; .help-hint tooltip pattern.
- app-shell.js: skip-to-content link, <main id=main-content role=main>, nav aria-label.
- Home commission KPI uses .help-hint. Tracking overview grid gets .ux-2col for responsive.
- Cache-bust: head-loader.js?v=17, V='v=20260721m'.

## 2026-07-21 13:40 — Quick Advisory (Tư vấn nhanh) capability
- New independent modules: quick-advisory (list) + advisory-workspace (5-step journey). Separate from sales/application-workspace.
- New seed advice-sessions.js (status model + need catalog + recommendation config + comparison data + 4 demo sessions).
- Sidebar TƯ VẤN group; removed Quick Advise from start-sale modal; Home secondary CTA routes to advisory list.
- Convert-to-sale → application-workspace?entry=CONVERTED_FROM_ADVICE with source chip + reference banner + recalc reminder; illustrative premium never used as official.
- products.js: health READY for RM-01/TL-01 to enable Health convert demo.
- Cache-bust: v20 / V='v=20260721q'.

## 2026-07-21 14:30 — Sales Entry Orchestrator + OCR (Motor slice)
- New ocr-policy.js seed: config-driven OCR (ocrPolicy/customerDocumentPolicy) + 4-part state model + mock extraction.
- app-workspace: lightweight entry orchestrator (entryMode + source label); config-driven Customer Info tab with mock OCR CCCD (confidence/review/disclaimer); Vehicle risk-object tab with mock OCR registration + bank-vs-OCR value mismatch compare + confirm snapshot. OCR never treated as KYC; master data not overwritten.
- Cache-bust: v23 / V='v=20260721u'.

## 2026-07-21 14:55 — OCR upload/camera + auto-fill + Start Sale routing
- OCR now upload-image / take-photo; captured image attaches to Documents (localStorage) + auto-fills fields; Vehicle keeps mismatch/snapshot.
- Start Sale: product picker after customer/prospect; NEW_PROSPECT requires consent+minimum before draft; createCase routes to first tab per context matrix.
- Cache-bust: v24 / V='v=20260721w'.

## 2026-07-21 15:20 — Start Sale = context-driven orchestrator (review-gated)
- sales-entry.js seed: source badges, readiness, rule-based recommendation (with reason+source).
- Modal grouped by intent + source badges + secondary Quick Advice link.
- Per-mode context/selection screens (Bank context+recommendation, Lead subtypes, Product-first summary, New prospect consent+min, Renewal context) → Common Sales Entry Review → gated draft creation (no draft before confirm; opens first incomplete step).
- Cache-bust: v25 / V='v=20260721x'.

## 2026-07-21 16:00 — Advisory defects P0-P3
- P0 convert: in-page modal + toast (no native dialogs), anonymous customer attach before Case, convertReady gating kept.
- P1: send-result popup (contact+consent), '+ Bắt đầu tư vấn' list CTA, null-safe rendering.
- P2: consistent 'Ẩn danh' chip, 'Issue mode'→'Hình thức cấp đơn' + term tooltips.
- P3: step1 mode content (bank CIF/context, referral) + conditional fields; step3 card authorized/issue/doc + dim ineligible; step4 compare fit/best/payment/eligibility/detail; step5 RM note; list Nguồn/Seller/Case columns.
- Cache-bust: v27 / V='v=20260721z'.

## 2026-07-21 16:40 — Unified Document Item + Customer Context persist + advisory list UX
- Customer Context Snapshot (localStorage) persists selected bank/lead/advice customer through step navigation; Customer Info prefill + source badge + View source context; unmatched prospect not promoted to Customer Master.
- Unified Document Item (docItemHtml + store): OCR is a capability of a document item; one record shared between Risk Object 'Tài liệu xe' and Documents tab (no dup upload); 4 separate statuses; removed standalone OCR section.
- Documents: removed big checklist aside → compact legend note; captured docs → 'Tài liệu được xác nhận' using same item.
- Advisory list: removed bulky section → compact toolbar; nowrap status; sticky compact action column.
- Cache-bust: v28 / V='v=20260722a'.

## 2026-07-21 17:20 — Submitted Case Workspace (foundation + deep slice)
- Tracking detail → Submitted Case Workspace: 7-tab nav, view-only banner, status-driven action bar (5 phases), enriched header, quote read-only, contract pre-issue checklist.
- Overview 5 cards; Supplement 3-part flow (only-requested editable + before/after + rule-based reconfirmation); History typed timeline + filter chips + friendly integration wording.
- Cache-bust: v34 / V='v=20260722g'.

## 2026-07-21 17:45 — Submitted Case Workspace deep (declaration/confirm/payment/withdraw)
- Declaration read-only grouped + per-answer metadata; Confirmation state model + metadata + NA/not-ready messaging; Payment obligation summary + transaction list + CTA guard; Withdraw in-page modal (reason → WITHDRAWN + version bump), gated to PENDING_INTAKE.
- Cache-bust: v35 / V='v=20260722h'.

## 2026-07-21 18:10 — Sprint 2.5 flagship (revision mgmt + status split + health + notification)
- case-meta.js seed (versions/lifecycle/compare, integrationStatus, caseHealth).
- Header: version selector + Compare V1↔V2 modal + permission chip + dashboard summary strip.
- Notification banner (status-driven); Overview business-vs-integration status split + Case Health widget.
- Cache-bust: v36 / V='v=20260722i'.

## 2026-07-21 18:35 — Sprint 2.5 optional (UW detail / comm log / empty states / doc version)
- Underwriting Workspace detail + condition (no internal fields); Communication Log tab (SMS/Email/Notification/Phone); empty-state illustrations; document version history in preview.
- Cache-bust: v37 / V='v=20260722j'.

## 2026-07-21 19:00 — Quick Advisory → Financial Advisory Workspace (P0+P1)
- Goal-based Need Discovery + concerns; Explainable Recommendation (why-recommended/why-not); Financial Gap card; Decision Support (why-not-other + budget upgrade); Advisor Note sidebar; Convert carries advisorNote+sessionId+need/budget/package (no re-entry).
- adviceById merges localStorage live sessions.
- Cache-bust: v39 / V='v=20260722l'.

## 2026-07-21 19:20 — Quick Advisory P2 (upsell / export / session)
- Upsell riders (suggest-only); Export PDF/Email/QR (in-page modal); Advisory Session card (advisor/started/saved/duration/version + anonymous note). Advisory History = quick-advisory list.
- Cache-bust: v40 / V='v=20260722m'.

## 2026-07-21 20:00 — Advisory friction fixes (need-mapping bug / CTA dedup+lock / layout / sidebar / compare-remove / list search+delete)
- D3 need→offer-group mapping (fix wrong product); D5 single convert CTA + not-interested confirm+lock; D1 stable needs layout + hint; D2 sidebar primary need; D4 compare remove-in-place; D0 list search + delete-draft.
- Cache-bust: v41 / V='v=20260722n'.

## 2026-07-21 20:40 — Financial Advisory Workspace P0 redesign
- Dynamic need questions per goal; dynamic Financial Gap per need (info card); Recommendation hero (BEST MATCH); Compare difference-only toggle; 3-tab Convert (Bank/Lead/Create) with data carry (leadId/campaign). Removed mode toggle + Save Draft/Saved badge per CR.
- Cache-bust: v42 / V='v=20260722p'.

## 2026-07-21 21:00 — Advisory P1 (UI) + P2 (business)
- Stepper relabel+icons; sidebar→dashboard (risk/gap/recommendation/fit); data completeness % + Estimate-only; eligibility suitable-vs-authorized + Transfer Seller; structured advisor note; follow-up task modal.
- Cache-bust: v42 / V='v=20260722q'.

## 2026-07-22 11:34 — Manager Workspace refactor (capability/profile/channel)
- Seed manager-profiles.js (resolveManagerProfile/canDo/scope/audit + 3 profile demo). team-workspace viết lại: home theo homeLayout (PERSONAL/MANAGER/SEGMENTED), exception-first cockpit, pipeline click-drill, seller cần chú ý, Team drill-down + Seller detail 5 tab (readiness động), Portal vs Embed (reassign vs re-attribution + reason/audit), unmask PII gated. app-shell canSell theo sellingEnabled.
- Cache: v42 / V='v=20260722v'. Smoke 4 persona PASS.

## 2026-07-22 11:51 — Home scope-tabbed + Team 6-tab
- Home render scope-tabs (availableScopes): SELF personal / TEAM+BRANCH cockpit summary (3-5 item + CTA). Team page = 6 tab detail (Tổng quan/Thành viên/Hồ sơ+filter/Năng lực bán matrix/Hiệu suất/Coaching). Deep-link Home→Team filtered. Cache v42 / V='v=20260722w'. Smoke 3 persona PASS.

## 2026-07-22 13:20 — Fix review 3 nền + polish
- Unified dataset (KPI derive từ appsOf(scope), reconcile pipeline). Home scope tab [Cá nhân][Quản lý] trên seller-workspace, bỏ Quick view/Mở Manager Workspace; manager-only redirect cockpit. Portal/Embed: embed exception + mirror case read-only + retry sync. Polish: exception cột khách/hạn, empty compact, header VN gọn, period label. Cache V='v=20260722z'.

## 2026-07-22 14:22 — Handoff/Participant/Assignment (5 slice)
- Seed handoffs.js (participant model + lifecycle 10 state + 3 loại + helpers/audit). Advisory convert customer-first 4 phần → tạo handoff (Direct/Team Queue/Auto). Seller "Bàn giao mới" (accept/decline/review). Team Lead "Chờ phân công" + assign (assignment_actor, customer read-only). Team page bỏ tab Hồ sơ. Cache V='v=20260722ze'.

## 2026-07-22 15:03 — Bỏ Coaching + refactor Đội nhóm/seller detail
- Bỏ coaching/ma trận/tab Hiệu suất-Hồ sơ. Team page = [Thành viên][Công việc] + header hierarchy; danh sách thành viên gộp cột hiệu suất/readiness/chờ nhận/cảnh báo. Seller detail = 1 trang tổng hợp (click-navigate, không lặp data). Home cockpit thêm Hiệu suất thành viên. Fix status undefined. Cache V='v=20260722zk'.

## 2026-07-22 16:02 — OrgUnit model + scope tree selector + multi-unit
- org-units.js (OrgUnit tree). Team page: scope selector cây tổ chức (drawer) + unit filter đồng bộ (members/tasks/counts/header). Nhân viên đa đơn vị: badge "Hỗ trợ từ <team>" / "+N đơn vị hỗ trợ". Cache V='v=20260722zm'.
