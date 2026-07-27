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

## 5. Còn nợ — ADOPT-ON-TOUCH (gói khi chạm module, tránh mass-regression)

| Pattern | Hiện trạng | Kế hoạch |
|---|---|---|
| **Data table** | `.dtable` (policies/team/seller/advisory) vs `.offer-table` (Bản chào) | Gói `BANCA.ui.dataTable(cols,rows,cfg)`; adopt khi làm Policy Cockpit (Phase 6) & Manager (Phase 7). Hiện dùng chung class CSS `.dtable`/`.offer-table` — thống nhất token sau. |
| **Stat/KPI card** | inline ở team/seller/advisory (5 nơi) | Gói `BANCA.ui.statCard({label,value,delta,tone,hint})`; adopt ở Phase 7 (Manager KPI). |
| **Tab bar** | inline `.tab` ở 6 nơi (policies filter tabs, team space tabs, employee-profile, workspace tracking) | Gói `BANCA.ui.tabBar(items,active)`; adopt-on-touch. |
| **PageHeader / list header** | `uxListHeader()` (shared) vs `qls-top` (shell) | Hợp nhất: list dùng QuoteListShell; các trang khác dùng `uxListHeader`. OK, 2 pattern có chủ đích (list-shell vs trang thường). |
| **Manager scope UI** | team-workspace dùng space-nav (Cá nhân/Quản lý + scope pill) — **KHÁC** DataScopeSelector | Đúng chủ đích (§13 Manager Workspace = điều hướng không gian, không phải filter data-scope). Sẽ chuẩn hoá bằng `OrganizationScopeFilter` ở Phase 7, KHÔNG ép về dataScopeSelector. |

## 6. Quy tắc khi phát triển tiếp (để hệ thống luôn đồng nhất)
1. Trước khi viết UI: tra registry này. Có component → gọi ra. Chưa có nhưng lặp ≥2 nơi → gói vào `shared/components` rồi mới dùng.
2. CSS: sửa **tại chỗ** trong `components.css`, không append block trùng selector.
3. Verify: browser ở **1360px** + kiểm contrast/đọc được, không chỉ console error.
4. Đổi nav/route → kiểm **active sidebar** + trang chi tiết.
5. Cùng status = cùng badge component + màu ở mọi nơi.
