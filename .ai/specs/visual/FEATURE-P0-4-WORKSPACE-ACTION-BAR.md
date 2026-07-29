# Visual Spec — P0.4 Workspace Action Bar

**Nhận từ:** `docs/ux/reviews/cross-screen-layout-review-2026-07-21.md`
**Bàn giao cho:** Claude implementation
**Nguồn token:** `shared/styles/tokens.css` · tham chiếu: `dev/design-reference.html`

## 1. Mật độ và nhịp

| Hạng mục | Quyết định | Token |
|---|---|---|
| Mật độ | compact enterprise | existing `.btn` / `.btn-sm` |
| Khoảng cách trong nhóm | 8px | `--space-sm` |
| Khoảng cách giữa thông tin và hành động | 12px | `--space-md` |
| Padding action bar | 12px | `--space-md` |

## 2. Bề mặt và tầng

| Lớp | Nền | Viền | Bo góc | Độ nâng / tầng |
|---|---|---|---|---|
| Draft bottom action bar | `--paper-card` | `--line` | existing page pattern | `--shadow-2`, `--z-sticky` |
| Submitted command bar | `--paper-card` | `--line` | `--radius-md` | none |
| More menu | `--paper-card` | `--line` | `--radius-sm` | `--shadow-2`, `--z-dropdown` |

## 3. Phân cấp hành động

| Cấp | Quy tắc |
|---|---|
| Chính | Đúng một nút `.btn-primary` theo step/canonical resolver. |
| Phụ trực tiếp | Tối đa một nút điều hướng lùi trong draft. |
| Khác | Hành động phụ submitted nằm trong native `details/summary` “Khác”. |
| Phá hủy | Nằm cuối menu “Khác”, có nhãn chữ và màu semantic hiện có. |

## 4. Kích thước và căn chỉnh

- Button dùng chiều cao hiện có: `.btn` tối thiểu 40px; `.btn-sm` tối thiểu 34px; thiết bị cảm ứng `.btn-sm` tối thiểu 44px.
- Các control trong cùng một action group dùng CSS grid với các cột `minmax(0, 1fr)` và `width:100%`; không đặt pixel width riêng theo nhãn.
- Desktop: action group nằm theo hàng.
- Dưới breakpoint `--bp-md` tương ứng 960px: action group chuyển một cột, mỗi control rộng 100%.
- Nhãn không bị cắt; nếu không đủ chỗ thì chuyển sang layout một cột thay vì co méo nút.

## 5. Trạng thái tương tác

| Trạng thái | Quy tắc |
|---|---|
| Default / hover / active | Tái dùng `.btn-primary`, `.btn-secondary`. |
| Focus | Tái dùng focus ring toàn hệ thống; `summary` phải keyboard-focusable. |
| Disabled | Giữ `disabled`, lý do khóa và opacity hiện có; không chỉ dùng màu. |
| Loading / save | Dùng trạng thái chữ “Đang lưu…” / “Đã lưu…” hiện có. |

## 6. Responsive và permission

- Desktop/tablet rộng: metadata trái, action group phải; control trong nhóm bằng kích thước.
- Dưới 960px: metadata ở trên, action group một cột phía dưới.
- Manager/read-only: không hiện control thay đổi dữ liệu; hiển thị nhãn “Chỉ xem”.
- Không thay breakpoint toàn hệ thống.

## 7. Tiêu chí nghiệm thu thị giác

- Không tăng baseline token `1140 lỗi / 682 cảnh báo`.
- Draft và submitted đều có tối đa một primary action trong vùng command/action bar.
- Các control cùng nhóm có bounding-box width và height bằng nhau tại desktop.
- Tại viewport nhỏ, action group là một cột và từng control rộng bằng container.
- Focus `Tab` và mở/đóng “Khác” bằng bàn phím hoạt động.

