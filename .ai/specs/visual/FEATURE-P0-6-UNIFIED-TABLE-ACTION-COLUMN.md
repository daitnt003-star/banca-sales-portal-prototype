# Visual Spec — P0.6 Unified Table Action Column

**Nhận từ:** user approval 2026-07-28
**Bàn giao cho:** Claude implementation
**Nguồn token:** `shared/styles/tokens.css` · tham chiếu: `dev/design-reference.html`

## 1. Phạm vi component

Áp dụng cho interactive action cell ở cột cuối của business data table:

- Tư vấn nhanh.
- Bản chào.
- Hợp đồng.
- RM work queue và bảng Bản chào gần đây.
- Bảng thành viên/case/risk có CTA trong Đội nhóm.

Không áp dụng cho audit-event “Hành động”, document row, card, form, modal hoặc workspace action bar.

## 2. Kích thước và bố cục

| Hạng mục | Quyết định | Token/contract |
|---|---|---|
| Hướng | một cột dọc | CSS grid one-column |
| Control width | 144px | `calc(var(--space-5xl) * 3)` |
| Desktop height | tối thiểu 34px | existing `.btn-sm` |
| Coarse pointer height | tối thiểu 44px | existing coarse-pointer rule |
| Vertical gap | 6px | `--space-xs` |
| Cell alignment | top/right | shared action-cell class |
| Action order | primary/main → Khác | business action hierarchy |

## 3. Menu phụ

- Trigger “Khác” có cùng width/height với main action.
- Menu mở overlay tuyệt đối ở bên phải/dưới trigger.
- Menu dùng `--paper-card`, `--line`, `--radius-sm`, `--shadow-2`, `--z-dropdown`.
- Mở menu không tăng row height và không đẩy các hàng khác.
- Native `details/summary` được ưu tiên; existing Team overflow may retain behavior but must share geometry and overlay tokens.

## 4. Table behavior

- Formal action columns use `.table-action-cell`.
- Inner group uses `.table-action-stack`.
- Last action column remains sticky where the current table already supports sticky actions.
- Table may horizontally overflow; action controls must not wrap or vary by label.
- Empty/non-actionable rows keep the same column width without rendering fake controls.

## 5. States

| State | Behavior |
|---|---|
| One action | occupies the full 144px control width |
| Main + more | two equal 144px × standard-height controls stacked |
| Only more | “Khác” occupies the same width at the top of the stack |
| Disabled | retains disabled semantics and full geometry |
| Read-only | only permitted view action; no hidden mutation control |
| Focus | existing visible focus ring |

## 6. Acceptance

- No in-scope action group computes `flex-direction:row`.
- Every visible direct child control in the same action stack has equal width and height.
- Quick Advice, Quote and Policy action cells measure the same control width.
- Team and Seller action cells use the same shared class/geometry.
- Opening “Khác” does not change its table row height.
- Token totals do not exceed baseline 1122 errors / 670 warnings.

