# Design Critique: Bản chào đã nộp

Date: 2026-07-28
Stage: Refinement
Actor: RM/seller and read-only manager

## Overall impression

Màn hình có đủ dữ liệu và hành động đúng trạng thái, nhưng phần đầu trang gộp quá nhiều lớp chức năng. Identity, lifecycle, next action và command controls cùng nằm trong một card cao khoảng 243px; tab bắt đầu sau mốc 341px tại viewport 1920×878.

## Usability

| Finding | Severity | Recommendation |
|---|---|---|
| Identity, lifecycle và action cùng một bề mặt | Moderate | Tách thành identity header, next-action command bar và lifecycle strip. |
| “Trạng thái xử lý” xuất hiện trong header và Overview | Moderate | Header/next-action là nguồn trạng thái hiện tại; Overview không lặp card này. |
| Timeline Overview lặp ý nghĩa với lifecycle stepper | Moderate | Giữ lifecycle stepper cho tiến độ hiện tại; lịch sử chi tiết tiếp tục ở tab Lịch sử. |
| Tab được dựng bằng inline styles dù có shared `TabBar` | Moderate | Dùng `BANCA.ui.tabBar`, giữ nguyên ID/deep-link/conditional visibility. |
| Nội dung tab không có heading/mục đích nhất quán | Moderate | Thêm content header theo active tab, không lặp page identity. |
| Read-only state nằm lẫn trong metadata | Minor | Giữ badge permission trong identity header, đồng thời command bar chỉ render action được phép. |

## Visual hierarchy

- What draws the eye first: ID và premium, đúng về nhận diện; nhưng stepper và command bar cạnh tranh ngay trong cùng card.
- Reading flow hiện tại: identity → metadata → status/premium → stepper → action → tabs → trạng thái lặp lại.
- Reading flow mục tiêu: identity → việc cần làm → lifecycle → navigation → nội dung tab.

## Consistency

| Element | Issue | Recommendation |
|---|---|---|
| Top tabs | Inline styling và custom active state | Shared underline `TabBar`. |
| Snapshot sub-tabs | Custom buttons | Shared pill `TabBar`. |
| Page surfaces | Header chứa ba vai trò | Mỗi surface chỉ có một vai trò. |
| Overview | Card status/timeline trùng top context | Thay bằng summary/content và context rail không trùng lặp. |

## Accessibility

- Tab links phải giữ deep-link thật, focus ring và `aria-current="page"` ở active tab.
- Tab overflow phải cuộn ngang, không wrap thành nhiều hàng trên màn hình hẹp.
- Không encode status chỉ bằng màu; giữ badge label.
- Primary action tối đa một, tiếp tục dùng P0.4 action hierarchy.

## What works well

- Canonical next action và permission đã tồn tại.
- Lifecycle stepper thể hiện trạng thái nghiệp vụ rõ.
- P0.4 command group đã cân bằng kích thước và keyboard disclosure.
- Overview đã có các khối sức khỏe yêu cầu và trạng thái tích hợp hữu ích.

## Priority recommendations

1. Tách ba vai trò khỏi header nhưng giữ identity header compact/sticky.
2. Loại phần trình bày trùng khỏi Overview; không xóa dữ liệu nghiệp vụ khỏi hệ thống.
3. Chuyển top/sub navigation sang shared `TabBar`.
4. Bổ sung content header và stable content grid cho mọi tab.

