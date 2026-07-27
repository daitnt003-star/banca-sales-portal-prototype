# Deliverable E — Component Registry (design system) — 2026-07-27

> Nguyên tắc bắt buộc: **nghiệp vụ/tương tác giống nhau = 1 component dùng chung**. Khi cần thì **gọi `BANCA.ui.*` / `BANCA.*`**, truyền props/mode/variant — **KHÔNG dựng inline mới** trong page. Style đặc thù = variant/token, không viết CSS rời theo màn hình.
>
> Vị trí: JS shared ở `shared/components/*.js` + `shared/js/*.js`; CSS **một nguồn** ở `shared/styles/components.css` (đã dọn trùng 2026-07-27); tokens ở `shared/styles/tokens.css`. Nạp qua `head-loader.js` (bump `V` khi sửa).

## Trạng thái: ✅ đã đóng gói & dùng chung · 🟡 đã có, đang adopt-on-touch · 🔴 chưa gói

## 1. Nền tảng / state / input

| Component | Call | Nơi dùng | TT |
|---|---|---|---|
| **searchBar** | `BANCA.ui.searchBar({mode:'submit'\|'live', name, value, placeholder, hidden{}, oninput, enter, block, id})` | Bản chào, Hợp đồng, Tư vấn nhanh, Đội nhóm ×2, Advisory ×2 | ✅ (7 chỗ đã gom) |
| **statusBadge** (quote 16 status) | `BANCA.ui.statusBadge(statusKey)` | list/detail | ✅ |
| **caseStatusBadge** (view-state) | `BANCA.caseStatusBadge(app)` | QuoteDataTable, workspace tracking | ✅ |
| **emptyState / errorState / loadingState / skeletonRows** | `BANCA.ui.emptyState(msg, actionHtml)` … | mọi list | ✅ helper (adopt-on-touch cho inline cũ dùng `.empty-state`) |
| **filterDrawer** (advanced filter) | `filterDrawer(fields, hidden)` → `{button,tags,drawer}` | Bản chào, Hợp đồng | ✅ |
| **DataSourceBadge / ConsentStatus / SensitiveDataNotice / CustomerContextCard** | `BANCA.ui.*` | entry/consent/offer stage | ✅ |
| **ChannelSwitcher** | `BANCA.ui.channelSwitcher()` | auth, state-gallery, header demo tool | ✅ |
| Modal / Toast / ConfirmDialog | `BANCA.modal/toast` (shared/components) | toàn hệ | ✅ (giữ nguyên) |

## 2. Danh sách Bản chào (unified shell)

| Component | Call | TT |
|---|---|---|
| **QuoteListShell** (layout cố định 5 lifecycle) | `BANCA.ui.quoteListShell(cfg)` | ✅ |
| **QuoteDataTable** (column preset theo lifecycle+scope) | `BANCA.ui.quoteDataTable(apps,{lifecycle,scope,me,r})` | ✅ |
| **DataScopeSelector** (dropdown Phạm vi + Đơn vị) | `BANCA.ui.dataScopeSelector(me, scope, unit, r)` | Bản chào ✅ · **Hợp đồng ✅ (gom 2026-07-27)** |
| **offerGroupBar** (lifecycle tabs + count) | render trong shell | ✅ |
| **offerQuickFilters** (quick filter theo lifecycle) | `BANCA.ui.offerQuickFilters(g5, qs, r)` | ✅ |
| **offerCta** (CTA theo nextActor) | `BANCA.ui.offerCta(app)` | ✅ |
| **customerTaskCell** (gộp status+việc tiếp theo) | `BANCA.ui.customerTaskCell(app)` | ✅ |

## 3. Offer/Quote stage (workspace)

| Component | Call | TT |
|---|---|---|
| SalesSourceBar | `BANCA.ui.salesSourceBar(app)` | ✅ |
| OfferSelectionWorkspace (package/addon/compare/alt) | `BANCA.ui.offerSelectionWorkspace(app)` + `BANCA.offer.*` | ✅ |
| QuoteVersion model | `BANCA.quoteVersion.*` | ✅ |

## 4. Config tập trung (không hard-code trong page)

`channel-profiles.js` · `customer-data-access.js` · `status-mappings.js` · `quote-version.js` · `offer-filters.js` (lifecycle/nextActor/quick filters/scope) · `navigation-config.js` · `journey-registry.js`.

## 5. Đã đóng gói thêm (đồng nhất triệt để — 2026-07-27)

| Component | Call | Nơi đã adopt | TT |
|---|---|---|---|
| **statCard / statGrid** | `BANCA.ui.statCard({label,value,delta,deltaTone,tone,hint,onclick})` · `BANCA.ui.statGrid(cards,cols)` | team-workspace (KPI chính + summary tiles) | ✅ |
| **tabBar** (variant underline/pill) | `BANCA.ui.tabBar(items,activeId,{variant})` | team (space pill + action-center + member/perf underline), quick-advisory, seller (space toggle) | ✅ |
| **dataTable** (builder bảng list) | `BANCA.ui.dataTable(columns,rows,{rowClick,empty})` | có sẵn cho bảng list mới; bảng phức tạp dùng chung class `.dtable` (đã hợp nhất = `.offer-table`) | ✅ |
| **Table CSS** | `.dtable` == `.offer-table` (một ngôn ngữ) | toàn hệ | ✅ |

## 6. Còn nợ có chủ đích (Phase 7 rework, KHÔNG deep-refactor sớm để tránh double-work)
| Pattern | Lý do giữ |
|---|---|
| team-workspace **selfTab/mgmtTab + scope dropdown** (region manager ≥3 cấp) | Space-nav phức tạp; Phase 7 chuẩn hoá bằng `OrganizationScopeFilter` (§13). |
| team-workspace **pipeline cells** (badge tồn/SLA overlay) | Viz chuyên biệt, không phải KPI phẳng. |
| `uxListHeader` vs QuoteListShell `qls-top` | 2 pattern có chủ đích (trang thường vs list-shell). |

## 6. Quy tắc khi phát triển tiếp (để hệ thống luôn đồng nhất)
1. Trước khi viết UI: tra registry này. Có component → gọi ra. Chưa có nhưng lặp ≥2 nơi → gói vào `shared/components` rồi mới dùng.
2. CSS: sửa **tại chỗ** trong `components.css`, không append block trùng selector.
3. Verify: browser ở **1360px** + kiểm contrast/đọc được, không chỉ console error.
4. Đổi nav/route → kiểm **active sidebar** + trang chi tiết.
5. Cùng status = cùng badge component + màu ở mọi nơi.
