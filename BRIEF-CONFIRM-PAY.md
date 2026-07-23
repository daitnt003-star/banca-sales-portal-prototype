# BRIEF — Thiết kế lại tab "Xác nhận & thanh toán" (Submitted Case Workspace) — Motor + Health

Bạn là Senior BA + Product Engineer + UI/UX bảo hiểm. Thiết kế lại tab **"Xác nhận & thanh toán"** trong Submitted Case Workspace cho CẢ Motor và Health, siết business gating, migrate demo data sai trạng thái. Prototype vanilla HTML/CSS/JS, mock localStorage overlay.

## FILE & ANCHORS (đã khảo sát)
- `modules/application-workspace/app-workspace.js`:
  - topTabs ~L1807: `['confirmpay','Xác nhận & thanh toán','confirm']`. Sub-tabs `CONFIRMPAY_SUB` (confirm/payment/comm) — **BỎ sub-tab, gộp 1 view dọc, bỏ 'comm' (Liên hệ)**. `topActive` gồm `['confirm','payment','comm']`→confirmpay (~L1801).
  - Render các tab `tab==='confirm'` / `'payment'` / `'comm'` — gộp thành 1 render tuần tự.
  - Payment modal 2-bước hiện có (window.createPaymentIntent / experience cards) — chuyển 3 card experience HIỂN THỊ TRỰC TIẾP trong tab, bỏ bước "Chọn cách thanh toán".
  - Nhiều `alert()` ở payment/issue (~L2620-2900) — thay bằng trạng thái/inline, seller KHÔNG tự mark success.
  - `getSubmittedCaseActions` (~L1752), header actions.
- `shared/mock/seed/case-state-resolver.js`: `BANCA.deriveCaseViewState(app)` (~L114) — **source-of-truth chung** cho list/dashboard/queue/header/next-action. Có `canCreatePaymentIntent` (~L168). **Sửa gating ở đây** (đổi/thêm `canInitiatePayment`).
- `shared/mock/seed/applications.js`: seed apps Motor + Health (bao gồm family multi-insured `insuredMembers` với insuredUnitId, confirm/payment/uw state). **Migrate combo state sai.**
- `shared/js/head-loader.js`: cache-bust `const V='v=20260723v'` → BUMP lên w.
- Health multi-insured: member confirmation per insuredUnitId (đã có seed `insuredMembers`, guardian cho <18).

## MỤC TIÊU: 1 tab dọc, thứ tự section
1. **Trạng thái xử lý** (process progress: APPROVED→CONFIRMATION_REQUIRED→...→POLICY_ISSUED).
2. **Xác nhận khách hàng**.
3. **Phí cần thanh toán**.
4. **Ba cách thanh toán** (hiển thị trực tiếp).
5. **Trạng thái thanh toán hiện tại**.
6. **Lịch sử thanh toán**.
Bỏ hoàn toàn tab "Liên hệ".

## 1. BUSINESS GATING (cốt lõi — sửa deriveCaseViewState)
State flow: APPROVED → CONFIRMATION_REQUIRED → CONFIRMATION_IN_PROGRESS → CONFIRMED → PAYMENT_REQUIRED → PAYMENT_PENDING → PAYMENT_PROCESSING → PAYMENT_SUCCESS → POLICY_ISSUING → POLICY_ISSUED.
- KHÔNG khởi tạo payment khi confirmation chưa hoàn tất.
- KHÔNG phát hành policy khi payment chưa success.
- KHÔNG hiển thị banner "Hợp đồng đã phát hành thành công" nếu policyStatus ≠ ISSUED.
- `canInitiatePayment` chỉ true khi: UW đã chấp thuận + tất cả confirmation bắt buộc xong + tài liệu bắt buộc đủ + quote còn hiệu lực + amount>0 + không có blocking condition. Health: cần TẤT CẢ member bắt buộc confirmed.

## 2. SHARED LAYOUT (Motor + Health chung)
Chung: page shell, process progress, section card, fee summary, payment experience cards, current payment status, payment history table. KHÔNG tạo layout riêng Health — chỉ khác renderer dữ liệu theo ProductJourneyDefinition.

## 3. CONFIRMATION
- **Motor**: 1 confirmation package (người xác nhận, vai trò, SĐT, nội dung, trạng thái, nút Gửi/Gửi lại/Xem evidence).
- **Health**: confirmation theo từng insuredUnitId. ≥18 tự xác nhận qua SĐT riêng; <18 người đại diện xác nhận; mỗi member session+evidence riêng; nút "Gửi xác nhận hàng loạt" nhưng KHÔNG dùng 1 OTP chung.
- Khi chưa hoàn tất: payment section VẪN hiển thị nhưng 3 action **disabled**, hiển thị rõ ai còn thiếu xác nhận.

## 4. PHÍ CẦN THANH TOÁN
Card: Tổng phí / Đã thanh toán / Còn phải thanh toán / Breakdown. Motor breakdown: phí vật chất xe, TNDS, add-on, discount, tax/fee. Health breakdown: phí từng member, loading từng member, add-on, family discount, tax/fee. **Tổng breakdown = tổng phí** (bắt buộc khớp).

## 5. BA CÁCH THANH TOÁN (trực tiếp)
Hiển thị trực tiếp 3 action: Quét QR tại quầy / Gửi yêu cầu thanh toán từ xa / Thanh toán trên thiết bị này. **KHÔNG có bước "Chọn cách thanh toán"**, không modal chọn. Click từng card mở thẳng flow tương ứng (QR / remote với SMS/Email/Copy / seller-device với OTP khách). 3 action disabled nếu confirmation chưa xong. KHÔNG tạo payment intent trước khi seller xác nhận cấu hình trong flow.

## 6. TRẠNG THÁI THANH TOÁN
Chỉ hiển thị current payment khi ĐÃ tạo intent. Wording VN: Chưa khởi tạo / Đang chờ thanh toán / Đang xử lý / Thành công / Thất bại / Hết hạn / Đã hủy. KHÔNG hiển thị trực tiếp SUCCESS/Experience/Instrument/Delivery Channel (tiếng Anh) trong UI seller — đưa vào vùng "Chi tiết kỹ thuật" thu gọn (collapsible).

## 7. LỊCH SỬ THANH TOÁN
Bảng: Mã giao dịch / Cách thanh toán / Người thanh toán / Thời gian / Số tiền / Trạng thái / Tham chiếu. Click row → chi tiết giao dịch (modal/expand). KHÔNG lặp lại bảng key-value dài ngay dưới.

## 8. POLICY ISSUANCE
Sau PAYMENT_SUCCESS: "Đã thanh toán, đang phát hành hợp đồng" → POLICY_ISSUING; không hiển thị hợp đồng trước khi Core trả kết quả. Sau POLICY_ISSUED: hiển thị số HĐ, bật tab Hợp đồng, hiển thị tài liệu đã phát hành. Seller KHÔNG tự mark payment success — chỉ gateway callback (giữ nút mô phỏng callback trong khu Demo Tools).

## 9. DEMO DATA MIGRATION (sửa source-of-truth, KHÔNG che UI)
Rà toàn bộ demo Motor + Health. KHÔNG cho tồn tại: (confirmation incomplete + payment success), (confirmation incomplete + policy issued), (payment incomplete + policy issued). Cập nhật đồng bộ: mock data, shared store, localStorage, request list, dashboard, work queue, badges, next action, timeline, payment history, policy records. Tất cả derive từ deriveCaseViewState.

## 10. ACCEPTANCE CRITERIA (18) — bám sát:
AC01 hết tab Liên hệ. AC02 confirmation+payment cùng trang dọc. AC03 chưa xác nhận→không khởi tạo payment. AC04 3 cách thanh toán trực tiếp. AC05 hết nút/modal "Chọn cách thanh toán". AC06 Motor package chung. AC07 Health per member. AC08 Health chỉ mở payment khi tất cả member confirmed. AC09 breakdown khớp tổng. AC10 history không lặp detail. AC11 seller không tự mark success. AC12 chỉ gateway callback đổi SUCCESS. AC13 chỉ phát hành sau confirmation+payment hợp lệ. AC14 không banner phát hành sai trạng thái. AC15 demo cũ migrate hợp lệ. AC16 list/dashboard/next-action cùng source-of-truth. AC17 reload/deep-link không đổi state. AC18 Motor+Health chung layout, chỉ khác dữ liệu.

## RÀNG BUỘC KỸ THUẬT (BẮT BUỘC — bài học nhiều lần)
- CHỈ đổi chuỗi hiển thị; KHÔNG thay token tiếng Anh trong code (biến/tham số/object key/query param/class CSS/enum).
- GUARD mọi `.vehicle.*` (Health/PA không có vehicle).
- KHÔNG regression Motor/PA/Health/home. deriveCaseViewState dùng chung — test kỹ list/dashboard/queue sau khi sửa gating.
- `shell()` set body qua innerHTML (đã có patch re-exec `<script>` trong main#main-content) — ưu tiên inline onclick / hàm global.
- Sau khi sửa PHẢI: `node --check` mọi .js; parse mọi inline `<script>` bằng `new Function()`; `node scripts/validate-terminology.js` PASS. Sửa tới khi sạch.
- Vanilla JS/HTML/CSS, tiếng Việt UI, giữ token style. BUMP head-loader V lên w.
- Ghi `CONFIRM-PAY-REPORT.md`: file đã sửa + thay đổi deriveCaseViewState/gating + danh sách demo app đã migrate (before/after state) + root cause + remaining issues.
- Không chạy server/browser (orchestrator retest). Khi xong chạy: openclaw system event --text "Claude done: confirm-pay redesign" --mode now
- Đảm bảo có seed để retest: 1 Motor app ở PAYMENT_REQUIRED (confirmation chưa xong → 3 action disabled), 1 Motor confirmed→payment pending, 1 Health family confirmation dở (1 member chưa xác nhận → payment disabled), 1 Health đủ điều kiện.
