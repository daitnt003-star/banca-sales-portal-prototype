# Màn hình Hợp đồng — Thông tin hiển thị & Nghiệp vụ Action

> Sản phẩm: Motor Comprehensive
> **Ràng buộc nền tảng:** Đây là **Sales Portal — chỉ đọc policy master** (dữ liệu đọc từ Core). Vì vậy các action **không sửa trực tiếp** hợp đồng, mà là **xem / xuất / gửi / tạo yêu cầu (request) route về Core**. Core mới là nơi thay đổi policy master và phát hành bản chính thức.

---

# PHẦN A — Thông tin cần hiển thị trong hợp đồng

> Ghi chú: **in đậm** = trường quan trọng và **đang thiếu** trên màn hình hiện tại.

## A1. Định danh hợp đồng
Số hợp đồng / đơn; số Giấy chứng nhận; sản phẩm + gói (Motor Comprehensive · Premium); trạng thái (đang hiệu lực / hết hạn / hủy); nguồn (cấp mới / tái tục) + link đơn kỳ trước; mã hồ sơ gốc (VD APP-2026-110).

## A2. Các bên liên quan
Bên mua bảo hiểm: tên, mã KH, CCCD/MST, địa chỉ, SĐT/email; người được bảo hiểm (nếu khác bên mua); **bên thụ hưởng (NTH) — ngân hàng, chi nhánh, số HĐ tín dụng (khi xe thế chấp)**; người lái được chỉ định (nếu định phí theo người lái).

## A3. Đối tượng bảo hiểm — xe
Hãng / dòng / loại xe; năm sản xuất; biển số; **số khung (VIN)**; **số máy**; số chỗ ngồi / trọng tải; mục đích sử dụng (cá nhân / kinh doanh / vận tải); tình trạng thế chấp.

## A4. Thời hạn & phát hành
Ngày phát hành; ngày hiệu lực → ngày hết hạn; thời hạn (VD 12 tháng).

## A5. Số tiền bảo hiểm & quyền lợi *(kèm số tiền / giới hạn từng cái — không chỉ "Có")*
- **Số tiền bảo hiểm vật chất (IDV) — con số cụ thể** (mức trần bồi thường).
- Điều kiện bồi thường vật chất (thay mới không khấu hao…).
- **Mức khấu trừ (deductible) / vụ.**
- TNDS bắt buộc — mức trách nhiệm người / tài sản.
- TNDS tự nguyện (nếu có) — hạn mức.
- **Quyền lợi người ngồi trên xe (NTX) — số tiền/người × số chỗ (nếu có).**
- Mở rộng: Thủy kích, Vỡ kính, Mất cắp bộ phận, Thiên tai/ngập — kèm điều kiện / giới hạn.
- Cứu hộ 24/7 — số lần / số tiền / vụ.
- Lựa chọn gara (chính hãng / thường); phạm vi lãnh thổ.

## A6. Điều khoản & loại trừ
Danh mục mã điều khoản áp dụng; **điều khoản loại trừ chính**; link / đính kèm bộ quy tắc bảo hiểm (policy wording); điều khoản đặc biệt / warranty (nếu có).

## A7. Phí & thanh toán
**Breakdown phí: phí gốc, add-on, giảm phí NCD, VAT, phí thực**; số tiền phải đóng; kỳ đóng & phương thức (một lần / trả góp); lịch sử thanh toán (ngày, số tiền, phương thức, ref, trạng thái); công nợ còn lại / kỳ tới (nếu trả góp); số hóa đơn VAT.

## A8. Kênh & bán hàng
Seller / tư vấn viên; kênh (Banca / đại lý / trực tiếp) + đối tác (VD Janus Bank); mã hồ sơ nguồn.

## A9. Lịch sử & liên kết
**Lịch sử sửa đổi bổ sung (endorsement)**; **lịch sử bồi thường (claim) dưới đơn**; chuỗi tái tục (đơn kỳ trước / kỳ sau); bậc NCD hiện tại / số năm không claim; **nhật ký thao tác (audit): ai tạo, ai duyệt, khi nào**.

> **Đối chiếu màn hình hiện tại — đang thiếu:** IDV, mức khấu trừ, bên thụ hưởng (NTH), số tiền từng quyền lợi, VIN / số máy / số chỗ, điều khoản loại trừ, endorsement, claim, và breakdown phí/NCD/VAT.

---

# PHẦN B — Nghiệp vụ các Action

## Phân biệt cốt lõi: 3 cách một hợp đồng thay đổi

| Khái niệm | Bản chất | Tạo đơn mới? | Trạng thái đơn gốc |
|---|---|---|---|
| **Tái tục (Renew)** | Gia hạn cho kỳ TIẾP THEO | ✅ Có — đơn mới, số mới | Chạy hết kỳ → **Hết hạn** (không chấm dứt sớm) |
| **Sửa đổi bổ sung (Endorsement)** | Đổi nội dung đơn ĐANG hiệu lực | ❌ Không — cùng số đơn | Giữ nguyên, thêm bản ghi endorsement |
| **Hủy đơn (Cancellation)** | Kết thúc đơn TRƯỚC hạn | ❌ Không | **Đã hủy** (chấm dứt sớm, có hoàn phí) |

➡️ "Chấm dứt" chỉ đúng với **Hủy đơn**. Tái tục KHÔNG làm đơn cũ chấm dứt — đơn cũ hết hạn tự nhiên.

---

## 1. Tải PDF / In Giấy chứng nhận

- **Mục đích:** sinh bản PDF hợp đồng / GCN chính thức để lưu, in, gửi.
- **Đầu vào:** policy hiện hành.
- **Xử lý:** render từ policy master **bản mới nhất** (đã áp mọi endorsement); đóng dấu/chữ ký số nếu áp dụng.
- **Ràng buộc:** phải lấy đúng phiên bản hiện hành — nếu có endorsement sau phát hành, PDF phải phản ánh bản sửa đổi, không phải bản gốc.

## 2. Gửi lại khách

- **Mục đích:** gửi GCN/hợp đồng tới khách qua email / Zalo / SMS link.
- **Xử lý:** đính kèm bản PDF hiện hành; **ghi log** lần gửi (ai gửi, thời điểm, kênh, người nhận).
- **Ràng buộc:** chỉ gửi bản hiện hành; không lộ dữ liệu nội bộ (hoa hồng, ghi chú nội bộ).

## 3. Xuất / Gửi hóa đơn VAT

- **Mục đích:** phát hành hóa đơn điện tử cho phần phí đã thu.
- **Xử lý:** sinh hóa đơn theo số tiền đã thanh toán (Thành công), gắn mã hóa đơn vào hồ sơ, gửi khách.
- **Điều kiện:** chỉ khi thanh toán đã ghi nhận thành công; khớp số tiền billing.

## 4. Tái tục (Renew) — tạo hợp đồng mới cho kỳ tiếp theo

- **Mục đích:** duy trì bảo hiểm liên tục sang kỳ mới bằng một đơn MỚI.
- **Khi nào hiện:** đơn trong khung tái tục (VD 30–45 ngày trước hết hạn) hoặc vừa hết hạn còn trong thời gian ân hạn.
- **Xử lý:**
  1. Clone dữ liệu đơn hiện tại → **hồ sơ (application) mới**, `Nguồn = Tái tục`, link `parent_policy` về đơn gốc.
  2. **Kế thừa (↻):** thông tin KH, xe, giấy tờ định danh còn hợp lệ.
  3. **KHÔNG kế thừa mù — hỏi lại:** tình trạng thế chấp/NTH, đăng kiểm còn hạn, cập nhật IDV theo bảng khấu hao.
  4. **Tính lại phí:** IDV giảm theo khấu hao → phí gốc mới; **áp lại NCD** (kỳ trước không claim → tăng bậc; có claim → tụt bậc).
  5. **Hiệu lực đơn mới:** từ **ngày liền sau ngày hết hạn đơn cũ** (nối tiếp, tránh gap). Nếu có gián đoạn → yêu cầu chụp lại ảnh hiện trạng (theo ma trận tài liệu).
  6. Duyệt & phát hành → **số hợp đồng mới + GCN mới**.
- **Hệ quả với đơn cũ:** **KHÔNG hủy, KHÔNG chấm dứt sớm.** Đơn cũ chạy hết kỳ, chuyển **"Hết hạn"** đúng ngày. Hai đơn tạo thành **chuỗi tái tục**.
- **Ràng buộc:** đơn mới là thực thể độc lập, vòng đời riêng; không chỉnh sửa đơn cũ.

## 5. Yêu cầu sửa đổi bổ sung (Endorsement request)

- **Mục đích:** thay đổi nội dung đơn **đang hiệu lực** mà không tạo đơn mới. VD: đổi biển số, đổi/ thêm NTH, điều chỉnh IDV, đổi người được bảo hiểm, thêm/bỏ add-on, đổi mục đích sử dụng.
- **Xử lý (read-only → qua Core):**
  1. Nhân viên tạo **yêu cầu endorsement** (loại thay đổi + giá trị mới + lý do + tài liệu kèm).
  2. Route về **Core** thẩm định.
  3. Core **tính chênh lệch phí** (tăng IDV → thu thêm; giảm → hoàn; đổi biển số → thường không đổi phí), phát hành **phụ lục/GCN sửa đổi** với `số endorsement`, `ngày hiệu lực sửa đổi`.
  4. Ghi bản ghi vào **lịch sử endorsement**; đơn **giữ nguyên số**.
- **Ràng buộc:** một số thay đổi cần điều kiện — ví dụ đổi/bỏ NTH khi xe còn thế chấp **cần đồng ý ngân hàng**; thay đổi có thể kích hoạt referral (như tăng IDV vượt ngưỡng).

## 6. Yêu cầu hủy đơn (Cancellation request)

- **Mục đích:** **chấm dứt đơn TRƯỚC hạn** (đây mới là "chấm dứt" thực sự).
- **Lý do thường gặp:** khách bán xe, tất toán, trùng bảo hiểm, không đóng phí, gian lận.
- **Xử lý (read-only → qua Core):**
  1. Tạo yêu cầu hủy + lý do + ngày hủy mong muốn.
  2. **Tính hoàn phí:** **prorata** (theo số ngày còn lại) hoặc **short-rate** (biểu phí ngắn hạn, trừ nhiều hơn) tùy chính sách & lý do; **đã có claim** → thường không hoàn hoặc theo quy tắc riêng.
  3. **Nếu có NTH (thế chấp):** thường cần **văn bản đồng ý của ngân hàng** mới được hủy.
  4. Core duyệt → ngày hủy hiệu lực, số tiền hoàn → trạng thái **"Đã hủy"**.
- **Ràng buộc:** cần quyền + phê duyệt; không thể tự hủy trên sales portal.

## 7. Xem / Tạo hồ sơ bồi thường (Claim)

- **Mục đích:** khởi tạo hoặc xem claim gắn với đơn.
- **Xử lý / kiểm tra nghiệp vụ:**
  - Xác minh đơn **đang hiệu lực tại ngày tổn thất**.
  - Áp **mức khấu trừ** (phần khách tự chịu/vụ).
  - Kiểm tra **loại trừ** (bằng lái, nồng độ cồn, add-on chưa mua…).
  - Xác định **người nhận bồi thường**: có NTH (ngân hàng) → tổn thất toàn bộ/lớn trả ngân hàng trước.
  - Claim **ảnh hưởng bậc NCD** kỳ tái tục sau.
- **Ràng buộc:** thường link sang module Claim/Core; sales portal chỉ khởi tạo/xem.

## 8. Xem lịch sử Endorsement & Audit

- **Mục đích:** minh bạch mọi thay đổi & thao tác.
- **Nội dung:** danh sách endorsement (loại, ngày, chênh phí); nhật ký audit (ai tạo/duyệt/gửi, thời điểm).
- **Tính chất:** chỉ đọc.

## 9. Xác nhận / Nhắc thanh toán

- **Mục đích:** xử lý công nợ khi trả góp hoặc chưa đóng đủ.
- **Xử lý:** hiển thị công nợ còn lại/kỳ tới; gửi nhắc khách; **xác nhận đã thu** (thường kế toán/Core chốt, cập nhật billing).
- **Điều kiện hiện:** chỉ khi còn số dư phải thu.

## 10. Ghi chú nội bộ (Internal note)

- **Mục đích:** ghi chú vận hành, không hiển thị cho khách.
- **Xử lý:** thêm note gắn user + thời gian; chỉ nội bộ thấy.

## 11. (Tùy quyền) Chuyển / gán lại Seller

- **Mục đích:** đổi tư vấn viên/kênh phụ trách.
- **Ràng buộc:** cần quyền quản lý; ghi audit; có thể ảnh hưởng hạch toán hoa hồng.

---

## Gợi ý phân nhóm nút trên màn hình

- **Chính (luôn hiện):** Tải PDF · Gửi lại khách
- **Vòng đời:** Tái tục · Yêu cầu sửa đổi (endorsement) · Yêu cầu hủy đơn
- **Liên kết:** Xem/Tạo bồi thường · Lịch sử endorsement & audit
- **Vận hành:** Xuất hóa đơn VAT · Xác nhận/nhắc thanh toán · Ghi chú nội bộ

Nút thay đổi (Tái tục / Endorsement / Hủy) nên hiển thị **có điều kiện theo trạng thái đơn** (đang hiệu lực / sắp hết hạn / hết hạn / đã hủy) và **theo quyền người dùng**.

---

*Tài liệu tham chiếu nội bộ · Cập nhật 2026-07-20*
