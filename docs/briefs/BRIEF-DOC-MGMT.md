# BRIEF — Quản lý tài liệu trên Chi tiết hợp đồng — Banca Sales Portal

Bạn là Senior BA + UI/UX Designer + Front-end Engineer bảo hiểm. Cập nhật chức năng quản lý tài liệu trên trang **Chi tiết hợp đồng**. Prototype HTML/CSS/JS thuần, mock localStorage overlay.

## FILE & ANCHORS (đã khảo sát)
- `modules/policies/index.html` (~361 dòng): render Policy Detail. Có 2 nhánh renderer:
  - **PA** (paPolicyDetail): mảng tài liệu ~dòng 39-40 (`['Certificate PDF',...]`, `['Policy wording',...]`).
  - **Motor/shared**: `const docLinks = [...]` ~dòng 175-181, render `docRows` ~182 (section "Tài liệu liên quan").
  - **actionBar** dùng chung ~dòng 162-174: hiện có `<button>Tải GCN</button>`, `Gửi khách`, (Tạo bồi thường/tái tục), `Khác ▾` dropdown. Tất cả dùng `alert(... demo)`.
  - Timeline: `historyTree` đọc `pol.audit` (mảng {action, at, by}).
- `shared/mock/seed/policies.js`: seed hợp đồng (có PA `JB-PA-2026-1201` + nhiều Motor). Thêm data model tài liệu vào đây nếu cần.
- `shared/js/head-loader.js`: cache-bust `const V='v=20260723q'` — **BUMP lên r** khi sửa xong.
- `scripts/validate-terminology.js`: chạy `node scripts/validate-terminology.js` phải PASS.

## ⚠️ CẢNH BÁO QUAN TRỌNG (lần trước Codex gây lỗi)
KHÔNG thay chuỗi tiếng Anh lọt vào **CODE**: tên biến, tham số hàm, object key, query param key (`?tab=`, `&id=`, `qs.get('...')`), tên class CSS, tên hàm, enum value dùng để so sánh. CHỈ đổi **chuỗi hiển thị (display string)** trong UI. Sau khi sửa PHẢI:
1. `node --check` mọi file .js đã sửa.
2. Parse mọi `<script>` inline trong HTML đã sửa (dùng `new Function(code)`), không lỗi.
3. `node scripts/validate-terminology.js` PASS.
Nếu bất kỳ bước nào fail → sửa cho tới khi sạch.

## YÊU CẦU

### 1. Action bar
Thay 4 action (Tải GCN, Gửi khách, Khai báo tổn thất, Khác) bằng:
- **Tài liệu & gửi khách** (PRIMARY, wording chính xác vậy — KHÔNG "Tải GCN"/"Gửi khách"/"Tải tài liệu & gửi khách")
- Khai báo tổn thất (giữ, secondary)
- Khác (giữ dropdown)
Chỉ TỐI ĐA 1 nút primary. Action "Tài liệu & gửi khách" KHÔNG tải/gửi ngay — nó điều hướng đến khu quản lý tài liệu.

### 2. Hành vi khi click "Tài liệu & gửi khách"
(1) chuyển sang tab/section "Tài liệu"; (2) scroll đến section "Tài liệu liên quan" (id `related-documents`); (3) highlight nhẹ section 1-2s; (4) bật chế độ chọn tài liệu; (5) KHÔNG tự tải/gửi; (6) KHÔNG tự chọn tài liệu.
Hỗ trợ deep link `?tab=documents#related-documents`: sau reload/mở link → tab Tài liệu active + scroll đúng section + không mất dữ liệu hợp đồng. (Policy detail hiện là cockpit sections — có thể coi "tab Tài liệu" = anchor section; nếu bổ sung tab thật thì giữ tương thích route cũ.)

### 3. Section tài liệu (dạng danh sách chọn được)
Header: "Tài liệu liên quan". Điều khiển: `[ ] Chọn tất cả` · "Đã chọn: N tài liệu" · nút **Tải xuống** / **Gửi cho khách** / **Bỏ chọn** (Tải xuống & Gửi disabled khi chưa chọn).
Mỗi dòng: checkbox · tên tài liệu · mã/file name · loại · phiên bản · ngày phát hành · ngày hiệu lực (nếu có) · nguồn · trạng thái · [Xem trước].

### 4. Chuẩn hóa thuật ngữ (display only)
GCN PDF→**Giấy chứng nhận bảo hiểm**; Policy wording→**Điều khoản bảo hiểm**; Hồ sơ gốc→**Yêu cầu bảo hiểm nguồn**; Application nguồn→**Yêu cầu bảo hiểm đã phát hành hợp đồng này**; Decision/UW letter→**Thư kết quả thẩm định**. Không hiển thị tiếng Anh nếu đã có tiếng Việt. Tên file kỹ thuật giữ nguyên.

### 5. Quy tắc chọn
Chọn 1 hoặc nhiều. "Chọn tất cả" chỉ chọn tài liệu user có quyền tải/gửi. KHÔNG chọn mặc định. Tài liệu hạn chế: disable checkbox + tooltip. Bản cũ không chọn mặc định; ưu tiên hiển thị bản hiện hành; cho mở nhóm "Phiên bản trước". Permission per-doc: `canView`, `canDownload`, `canSendToCustomer`. VD: Thư thẩm định nội bộ xem được nhưng KHÔNG gửi; Ghi chú nội bộ KHÔNG xuất hiện trong danh sách gửi khách; tài liệu hết hiệu lực có cảnh báo.

### 6. Tải xuống
1 tài liệu → tải trực tiếp (Blob demo). Nhiều → ZIP tên `POL-<polId>-documents-YYYYMMDD.zip` (mô phỏng OK). Trạng thái: Đang chuẩn bị / Thành công / Không thể tải một số. 1 file lỗi không làm fail toàn bộ; hiển thị danh sách lỗi. Audit: người tải, thời gian, policyId, documentIds, session (nếu có).

### 7. Gửi cho khách (modal xác nhận)
Tiêu đề "Gửi tài liệu cho khách hàng". Nội dung: danh sách tài liệu đã chọn; thông tin người nhận (họ tên, SĐT, email); kênh gửi (Email, SMS chứa link tải, Sao chép liên kết, partner nếu có); field: người nhận, email/phone, thời hạn link, nội dung tin nhắn, consent liên hệ, ngôn ngữ tài liệu (nếu hỗ trợ). CTA: Gửi tài liệu / Hủy. KHÔNG gửi ngay khi mở modal.

### 8. Validation khi gửi
Đã chọn ≥1; tất cả được phép gửi; recipient hợp lệ; email/phone đúng định dạng; consent còn hiệu lực; link có thời hạn; không gửi tài liệu nội bộ; không gửi bản cũ khi có bản hiện hành (trừ khi chủ động chọn + được phép). Nếu có tài liệu không được gửi: hiện "Thư thẩm định không được phép gửi cho khách hàng." + cho bỏ tài liệu đó, tiếp tục gửi phần còn lại.

### 9. Kết quả sau gửi
Toast "Đã gửi N tài liệu cho <tên> qua <kênh>." Section cập nhật: Gửi gần nhất (thời gian), Kênh, Người nhận, Trạng thái, Người thực hiện. Gửi lỗi: hiện lý do + cho gửi lại, KHÔNG tạo bản ghi "Đã gửi" giả.

### 10. Lịch sử
Timeline ghi event tải/gửi: VD "23/07/2026 15:10 — Nguyễn Văn An tải 2 tài liệu: ...", "15:20 — gửi 3 tài liệu cho khách qua email". KHÔNG ghi nội dung nhạy cảm của link tải.

### 11. Responsive
Màn nhỏ: checkbox dễ chọn; action bar chọn tài liệu sticky đáy màn hình ("Đã chọn 2" · Tải xuống · Gửi); nút không xuống nhiều dòng; modal gửi → full-screen sheet nếu cần.

## ACCEPTANCE CRITERIA
AC01 hết 2 action riêng Tải GCN/Gửi khách. AC02 header có "Tài liệu & gửi khách". AC03 click → tab Tài liệu + scroll đúng section. AC04 mỗi tài liệu có checkbox. AC05 chọn 1 hoặc nhiều. AC06 nút Tải/Gửi disabled khi chưa chọn. AC07 1 tài liệu tải trực tiếp. AC08 nhiều tài liệu tải ZIP. AC09 gửi qua modal xác nhận recipient/kênh/danh sách. AC10 tài liệu nội bộ/không quyền không chọn để gửi. AC11 audit cho tải & gửi. AC12 timeline ghi đúng. AC13 deep link tab Tài liệu sống sau reload. AC14 hết "GCN PDF"/"Policy wording"/"Application nguồn" trên UI seller.

## RÀNG BUỘC
- Áp dụng cho CẢ PA và Motor renderer (dùng chung 1 component tài liệu để không lệch). Data model docs có permission per-doc; seed vài tài liệu mẫu (GCN, điều khoản, yêu cầu nguồn, hóa đơn VAT, thư thẩm định [nội bộ, canSendToCustomer=false], ghi chú nội bộ [không hiện trong danh sách gửi]).
- Vanilla JS/HTML/CSS, giữ token style hiện có, tiếng Việt UI.
- KHÔNG dùng alert cho luồng mới (dùng toast/modal/inline).
- BUMP head-loader V. Chạy node --check + parse inline + validate-terminology tới khi PASS.
- Ghi `docs/reports/DOC-MGMT-REPORT.md`: file đã sửa + data model tài liệu & permission + root cause + remaining issues. KHÔNG chạy server/browser (orchestrator retest).
- Khi xong chạy: openclaw system event --text "Codex done: doc mgmt" --mode now
