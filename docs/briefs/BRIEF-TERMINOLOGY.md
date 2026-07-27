# BRIEF — Chuẩn hóa thuật ngữ tiếng Việt — Banca Sales Portal

Bạn là Senior BA + UX Writer + Front-end Architect. Chuẩn hóa TOÀN BỘ thuật ngữ tiếng Việt trong portal theo glossary thống nhất. Không chỉ sửa màn hình hiện tại — tìm & thay trên toàn source dùng chung + mọi module.

## NGUYÊN TẮC GLOSSARY TRUNG TÂM
- "Yêu cầu bảo hiểm" = đối tượng nghiệp vụ trung tâm (từ lúc bắt đầu đến khi phát hành). Dùng cho navigation, page title, danh sách, mã định danh, CTA tạo mới/tiếp tục, trạng thái trước & sau nộp, notification, work queue, dashboard, breadcrumb.
- "Hồ sơ" CHỈ dùng khi nói về tập hợp thông tin/tài liệu của yêu cầu — KHÔNG làm tên chính của record. (Sai: "Danh sách hồ sơ chưa nộp", "Mã hồ sơ", "Tạo hồ sơ mới", "Tiếp tục hồ sơ gần nhất" → phải dùng "Yêu cầu".)
- "Hợp đồng bảo hiểm" chỉ dùng SAU khi đã chấp thuận + thanh toán + phát hành.
- "Giấy chứng nhận bảo hiểm" riêng cho certificate. Không dùng lẫn "hợp đồng"/"giấy chứng nhận".

## CTA CHUẨN (thay tất cả)
- "Bắt đầu bán bảo hiểm" / "Bắt đầu bán hàng" / "Lập yêu cầu mới" / "Tạo hồ sơ mới" → **Tạo yêu cầu bảo hiểm**
- "Tiếp tục hồ sơ gần nhất" → **Tiếp tục yêu cầu gần nhất**; "Tiếp tục hồ sơ" → **Tiếp tục yêu cầu**
- "Xem hồ sơ" → **Xem yêu cầu**; "Mở hồ sơ" → **Mở yêu cầu**
- "Gửi hồ sơ" / "Gửi yêu cầu" / "Submit hồ sơ" / "Gửi sang thẩm định" → **Nộp yêu cầu bảo hiểm**
- "Yêu cầu đã được gửi" / "Hồ sơ đã submit" → **Yêu cầu bảo hiểm đã được nộp**
- Từ Tư vấn nhanh: "Chuyển sang bán hàng" → **Tạo yêu cầu bảo hiểm từ tư vấn này**; "Bắt đầu bán từ kết quả tư vấn" → **Tạo yêu cầu bảo hiểm**

## SIDEBAR BẮT BUỘC
TRANG CHỦ: Trang chủ | BÁN HÀNG: Tư vấn nhanh, Yêu cầu bảo hiểm (con: Chưa nộp, Đã nộp) | SAU BÁN: Hợp đồng | HỖ TRỢ: Trợ giúp | (Manager) QUẢN LÝ: Đội nhóm.
Bỏ hẳn: "Yêu cầu chưa gửi", "Yêu cầu đã gửi", "Hồ sơ chưa/đã gửi", "Bắt đầu bán bảo hiểm".
Menu ngắn: "Chưa nộp" / "Đã nộp". Page title đầy đủ: "Yêu cầu bảo hiểm chưa nộp" / "Yêu cầu bảo hiểm đã nộp".

## MÀN HÌNH CHƯA NỘP
- Breadcrumb: "Banca Sales Portal / Yêu cầu bảo hiểm / Chưa nộp"
- Page title: "Yêu cầu bảo hiểm chưa nộp"
- Primary CTA: "Tạo yêu cầu bảo hiểm"; Secondary: "Tiếp tục yêu cầu gần nhất"
- Card title: "Danh sách yêu cầu bảo hiểm chưa nộp"; description: "Theo dõi các yêu cầu đang được hoàn thiện trước khi nộp"
- Table column "Mã hồ sơ" → "Mã yêu cầu"
- Footer: "Click vào dòng để mở yêu cầu"; "Yêu cầu chưa nộp được lọc theo bước của hành trình"
- Action theo record: "Tiếp tục nhập khách hàng" → "Tiếp tục thông tin khách hàng"; "Tiếp tục thông tin xe" → "Tiếp tục đối tượng bảo hiểm"; "Tiếp tục khai báo" → "Tiếp tục khai báo rủi ro"; "Bổ sung tài liệu" & "Tính phí lại" GIỮ NGUYÊN.

## VÒNG ĐỜI
- Trước nộp: nhóm "Yêu cầu bảo hiểm chưa nộp". Các bước: Thông tin khách hàng, Đối tượng bảo hiểm, Sản phẩm và gói bảo hiểm, Báo giá, Khai báo rủi ro, Tài liệu, Kiểm tra và nộp.
- Sau nộp: nhóm "Yêu cầu bảo hiểm đã nộp". Trạng thái hiển thị: Chờ tiếp nhận, Đang thẩm định, Cần bổ sung, Chờ khách hàng xác nhận, Chờ chọn cách thanh toán, Chờ thanh toán, Đã thanh toán, Đang phát hành hợp đồng, Đã phát hành, Bị từ chối, Đã hủy. (Không "Đã gửi/Submitted/Completed request khi HĐ chưa phát hành".)
- Sau phát hành: đối tượng "Hợp đồng bảo hiểm". Trạng thái: Có hiệu lực, Chưa hiệu lực, Sắp hết hiệu lực, Hết hiệu lực, Đã hủy, Đang tái tục.

## THUẬT NGỮ SẢN PHẨM/NGHIỆP VỤ (UI)
Personal Accident→Bảo hiểm tai nạn cá nhân; Motor Comprehensive→Bảo hiểm vật chất xe; Health Insurance→Bảo hiểm sức khỏe; Product→Sản phẩm; Package→Gói bảo hiểm; Coverage→Quyền lợi bảo hiểm; Benefit→Quyền lợi; Premium→Phí bảo hiểm; Quote→Báo giá; Risk object→Đối tượng bảo hiểm; Risk declaration→Khai báo rủi ro; Underwriting→Thẩm định; STP→Thẩm định tự động; Approved STP→Đã chấp thuận tự động; Manual underwriting→Thẩm định thủ công; Referral→Chuyển thẩm định; Need More Information→Cần bổ sung thông tin; Approved With Condition→Chấp thuận có điều kiện; Declined→Từ chối; Payment Method Required→Chờ chọn cách thanh toán; Payment Pending→Chờ thanh toán; Payment Processing→Đang xử lý thanh toán; Payment Success→Thanh toán thành công; Policy Issuing→Đang phát hành hợp đồng; Policy Issued→Hợp đồng đã phát hành.
Mã kỹ thuật (STP, APPROVED_STP, PAYMENT_PENDING...) GIỮ trong code + khu debug, KHÔNG hiển thị trực tiếp cho seller.

## VAI TRÒ (UI)
Seller→Nhân viên tư vấn; Assigned seller→Nhân viên phụ trách; Seller profile→Hồ sơ nhân viên; Seller readiness→Điều kiện được phép bán; Product authorization→Sản phẩm được phép bán. Cột danh sách "Người bán"→"Nhân viên phụ trách" (cột attribution doanh số có thể dùng "Nhân viên tư vấn"). Không lẫn Seller/Producer/Agent/Người bán/Nhân viên bán hàng.

## THANH TOÁN
"Chọn phương thức thanh toán"→"Chọn cách thanh toán". 3 trải nghiệm: Quét QR tại quầy / Gửi yêu cầu thanh toán cho khách hàng / Hỗ trợ khách thanh toán trên thiết bị này. Kênh gửi: SMS, Email, Sao chép liên kết. Phương thức thực tế: QR, Thẻ ngân hàng, Tài khoản ngân hàng, Chuyển khoản. Không dùng "Payment option", "Seller thanh toán", "Gửi payment".

## TỪ CẤM TRÊN UI PRODUCTION (chỉ được xuất hiện trong source/Demo Tools)
Bắt đầu bán bảo hiểm; Bắt đầu bán hàng; Yêu cầu chưa gửi; Yêu cầu đã gửi; Hồ sơ chưa gửi; Hồ sơ đã gửi; Danh sách hồ sơ chưa nộp; Mã hồ sơ; Submit; Submitted; Application; Case; Payment option; Seller-assisted; Approved STP; UW pending; Policy issued; undefined; null.

## TRIỂN KHAI KỸ THUẬT
1. Tạo nguồn thuật ngữ dùng chung: `shared/js/terminology.js` (object `BANCA.T = {...}` + helper `BANCA.t(key)`), map các key ví dụ: insuranceRequest, createInsuranceRequest, continueLatestRequest, unsubmitted, submitted, unsubmittedRequestTitle, submittedRequestTitle, requestCode, submitRequest, v.v. Nạp trong head-loader (trước app-shell). BUMP version cache-bust trong head-loader (v=... tăng 1 bậc).
2. Sửa shell/nav/breadcrumb/header/page-title/CTA/table/modal/toast/timeline/notification/dashboard/mobile nav/empty-state + mock/seed labels để lấy từ terminology (hoặc thay chuỗi trực tiếp nếu không thể tham chiếu). Quét các file: shared/js/app-shell.js, app-manifest.js, modules/*/index.html, modules/*/module.json, shared/mock/seed/*.js (status labels), submitted-applications, unsubmitted-applications, seller-workspace, team-workspace, policies, help, advisory/quick-advisory.
3. GIỮ NGUYÊN technical ID/enum/route (applicationId, submitted-case, PAYMENT_PENDING...) — chỉ đổi LABEL hiển thị. Nếu buộc đổi route thì cập nhật nav/deep-link/breadcrumb/back/redirect.
4. Tạo `scripts/validate-terminology.js` (chạy bằng node): scan .html/.js/.json trong modules + shared (bỏ node_modules, build, comments nếu cấu hình, technical enums, negative-test fixtures). Báo INVALID_TERMINOLOGY {file, text, expected} nếu tìm thấy TỪ CẤM trong visible label. In tổng kết PASS/FAIL. Phải chạy PASS.
5. Ghi `docs/reports/TERMINOLOGY-REPORT.md`: glossary cuối, bảng trước/sau, danh sách file đã sửa, kết quả validate, thuật ngữ chưa chắc cần BA xác nhận.

## RÀNG BUỘC
- Không phá PA overhaul vừa làm (giữ các label PA mới: "Đối tượng bán"→lưu ý: task này quy định "Đối tượng bảo hiểm" cho risk object; nếu xung đột, ưu tiên glossary task này = "Đối tượng bảo hiểm" cho step label, GHI CHÚ vào report để BA xác nhận).
- Vanilla JS/HTML/CSS. Không chạy server/browser.
- KHÔNG kết luận PASS nếu còn visible label chứa "Bắt đầu bán bảo hiểm", "Yêu cầu chưa gửi", "Yêu cầu đã gửi".
