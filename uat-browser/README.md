# UAT trình duyệt thật (Playwright)

Bộ kiểm tầng logic **không** bắt được lỗi tầng hiển thị. Bốn lỗi thật đã lọt qua
41 test script rồi mới bị người dùng phát hiện:

- khối chọn "ai trả lời" gán bằng `window.x = function` SAU chỗ dựng HTML → lúc
  render vẫn `undefined`, guard `window.x ? … : ''` âm thầm trả rỗng
- cùng khối đó khai trong nhánh hồ sơ nháp (kết thúc bằng `return`) → màn hồ sơ
  đã nộp không thấy
- lý do chặn đọc y như "bạn chưa trả lời" trong khi đã trả lời đủ
- nút vẫn ghi "Khởi tạo thanh toán" khi cổng đang khoá

Bộ này mở Chromium thật, bấm đúng chữ hiển thị, và kiểm **thứ người dùng nhìn thấy**.

## Chạy

```bash
python3 scripts/serve.py 8899 &        # phục vụ tĩnh
BASE=http://localhost:8899 node uat-browser/01-smoke.js
```

Chạy tuần tự: `01` → `08`. Mỗi file độc lập, dùng context trình duyệt sạch.

| File | Phạm vi |
|---|---|
| `01-smoke` | 13 màn hình: mở được · không lỗi JS · không lộ `undefined`/`NaN` ra màn |
| `02-advisory` | Tư vấn nhanh: danh sách → phiên → nhu cầu → gợi ý · phiên đã chuyển bán bị khoá |
| `03-newsale` | Bản chào nháp: khai báo rủi ro → ghi nhận ai trả lời → rà soát → nộp |
| `04-topolicy` | Sau nộp: thẩm định → xác nhận & thanh toán → màn hợp đồng |
| `05-fullchain` | Trọn tuyến tới HỢP ĐỒNG: nộp → OTP → tạo yêu cầu thu phí → callback thành công → phát hành → hoa hồng |
| `06-postsale` | Danh sách/chi tiết hợp đồng · loại yêu cầu dịch vụ theo sản phẩm · tái tục |
| `07-postsale2` | Bấm thật: tạo yêu cầu dịch vụ · khai tổn thất trong/ngoài thời hạn · tái tục |
| `08-renewal` | Tái tục nhận diện đúng · nút không đứng im · gỡ được cờ "cần xác nhận lại khai báo" |
| `09-channels-personas` | 4 kênh × 7 màn · 7 người dùng · tài khoản ngừng hoạt động bị chặn |
| `10-unhappy` | Thanh toán lỗi/hết hạn · phát hành lỗi → thử lại · từ chối · thu hồi · phân quyền theo chủ hồ sơ · chống thu tiền 2 lần |
| `11-health-pa` | Sức khoẻ khai theo TỪNG NGƯỜI · PA nhánh hoạt động nguy hiểm · GCN mỗi người |
| `12-responsive` | Điện thoại/máy tính bảng/laptop: không tràn ngang · nút không bị cắt · chữ ≥10px · bảng cuộn trong khung riêng |
| `13-new-sale-documents` | Bán MỚI: tải tài liệu THẬT bằng `setInputFiles` · thanh bước phải nói đúng sự thật về dữ liệu |

## Nguyên tắc viết assertion

1. **Gọi thật, đừng grep chuỗi.** Có tên hàm trong file không có nghĩa nó chạy.
2. **Bấm theo chữ hiển thị**, không theo selector nội bộ — người dùng đọc chữ.
3. **Chữ bị CSS viết hoa** (`text-transform`) → so khớp không phân biệt hoa thường.
4. **Chọn đúng dữ liệu mẫu.** Nháp thiếu tài liệu bị chặn là ĐÚNG, không phải lỗi.
   `DRAFT-2026-006` là bản đủ điều kiện nộp (và là hồ sơ TÁI TỤC).
5. **Sai của bộ kiểm phải sửa ở bộ kiểm**, không nới lỏng để lấy màu xanh.
6. **Mỗi hồ sơ có chủ.** Mở bằng người khác sẽ `ACCESS_DENIED` — đó là ĐÚNG.
   Đổi người dùng bằng `localStorage.bancaPersona` trước khi mở.
7. **Nút ở thanh lệnh là ĐIỀU HƯỚNG**, không phải hành động. Nút thật nằm trong
   thân bước (ví dụ `button[onclick*="retryIssue"]`).
8. **Phần tử trong khung cuộn ngang bị "cắt" là bình thường** — chỉ tính nút bị
   cắt khi nằm ngoài mọi khung cuộn.
9. **Tải tệp phải dùng `setInputFiles` vào `<input type=file>`.** Bấm nút "Tải lên"
   chỉ mở hộp thoại của hệ điều hành — Playwright chặn, và KHÔNG có tệp nào được
   nạp. Bấm nút rồi tưởng đã tải là cách bỏ sót lỗi tài liệu suốt 259 ca đầu.
10. **Đừng chỉ kiểm hồ sơ MẪU.** Seed có sẵn `docsUploaded`, nên hồ sơ mẫu che mất
   lỗi của hồ sơ bán MỚI. Mọi cổng chặn phải được kiểm bằng hồ sơ tạo từ đầu.
11. **Thanh bước và banner chặn phải khớp nhau.** Nếu thanh bước báo "Hoàn tất" mà
   banner báo còn thiếu thì một trong hai nói dối — kiểm cả hai trong cùng một ca.
12. **Mỗi lần chạy ghi ảnh ra đường dẫn RIÊNG.** Hai lần chạy trên hai cổng khác
   nhau mà ghi đè cùng một tệp ảnh sẽ dẫn tới đọc nhầm kết quả bản chưa sửa.
