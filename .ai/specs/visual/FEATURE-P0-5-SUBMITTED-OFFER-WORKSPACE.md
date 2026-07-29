# Visual Spec — P0.5 Submitted Offer Workspace

**Nhận từ:** `.ai/design/CRITIQUE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`
**Bàn giao cho:** Claude implementation
**Nguồn token:** `shared/styles/tokens.css` · tham chiếu: `dev/design-reference.html`

## 1. Mật độ và nhịp

| Hạng mục | Quyết định | Token |
|---|---|---|
| Mật độ | compact enterprise | existing component density |
| Khoảng cách section | 16px | `--space-lg` |
| Padding identity/content card | 16px | `--space-lg` |
| Gap trong metadata/action | 8px | `--space-sm` |
| Gap giữa content và rail | 16px | `--space-lg` |

## 2. Thang chữ

| Vùng | Size | Weight | Leading |
|---|---|---|---|
| Case ID | `--text-xl` | `--weight-bold` | `--leading-tight` |
| Premium | `--text-2xl` | `--weight-bold` | `--leading-tight` |
| Tab content title | `--text-lg` | `--weight-bold` | `--leading-tight` |
| Body | `--text-sm` | `--weight-regular` | `--leading-normal` |
| Metadata | `--text-xs` | `--weight-regular` | `--leading-snug` |

## 3. Bề mặt và độ nâng

| Lớp | Nền | Viền | Bo góc | Độ nâng |
|---|---|---|---|---|
| Identity header | `--paper-card` | `--line` | `--radius-lg` | `--shadow-1` |
| Next action | existing P0.4 surface | `--line` | `--radius-md` | none |
| Lifecycle strip | `--paper-card` | `--line` | `--radius-md` | none |
| Content card/rail | `--paper-card` | `--line` | `--radius-md` | none |

## 4. Layering

- Identity header alone may remain sticky at `--z-sticky`.
- Command bar, lifecycle strip and tab navigation are not independently sticky.
- “Khác” continues to use `--z-dropdown`.

## 5. Page anatomy

1. `.submitted-case-header`: identity, customer/product/version, permission, status, premium.
2. Existing `.workspace-command-bar`: next action, SLA context, one primary and “Khác”.
3. `.submitted-lifecycle`: canonical case stepper only.
4. Shared top `TabBar`; shared pill sub-tabs only for snapshot.
5. `.submitted-content-header`: active-tab title and description.
6. `.submitted-content-layout`: main content plus optional context rail.

## 6. Responsive

| Breakpoint | Behavior |
|---|---|
| `< --bp-lg` | Content/rail becomes one column; header metadata wraps. |
| `< --bp-md` | Identity status/premium stacks below identity; command bar uses P0.4 column behavior. |
| `< --bp-sm` | Tab navigation remains one horizontal scroll row; no multi-row wrap. |

## 7. Interaction and states

- Top/sub tabs are links with visible focus and `aria-current`.
- Active content title changes with active top/sub tab.
- Conditional Supplement tab remains absent when not applicable.
- Permission/read-only badge remains visible; mutation actions remain absent.
- Existing tab-specific empty, error, loading, retry and permission UI is preserved inside content.

## 8. Visual acceptance

- Header no longer contains lifecycle or action controls.
- “Trạng thái xử lý” is not duplicated as an Overview card.
- Detailed timeline is not duplicated in Overview; History remains the detailed event source.
- At most one primary action in the workspace.
- Token totals do not exceed baseline 1139 errors / 681 warnings.
- Browser screenshot is compared with the pre-change 1920×878 reference and `dev/design-reference.html`.

