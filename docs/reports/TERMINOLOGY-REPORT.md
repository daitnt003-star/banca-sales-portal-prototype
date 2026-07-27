# Terminology Report — Banca Sales Portal

Ngày thực hiện: 2026-07-23

## Glossary cuối

| Key | Thuật ngữ chuẩn |
| --- | --- |
| Đối tượng nghiệp vụ trung tâm | Yêu cầu bảo hiểm |
| Trước nộp | Yêu cầu bảo hiểm chưa nộp |
| Sau nộp | Yêu cầu bảo hiểm đã nộp |
| Sau phát hành | Hợp đồng bảo hiểm |
| Certificate | Giấy chứng nhận bảo hiểm |
| Product | Sản phẩm |
| Package | Gói bảo hiểm |
| Coverage | Quyền lợi bảo hiểm |
| Premium | Phí bảo hiểm |
| Quote | Báo giá |
| Risk object | Đối tượng bảo hiểm |
| Risk declaration | Khai báo rủi ro |
| Underwriting | Thẩm định |
| Seller | Nhân viên tư vấn |
| Assigned seller | Nhân viên phụ trách |
| Seller profile | Hồ sơ nhân viên |
| Payment method | Cách thanh toán |

## Bảng trước/sau chính

| Trước | Sau |
| --- | --- |
| Bắt đầu bán bảo hiểm / Bắt đầu bán hàng / Tạo hồ sơ mới | Tạo yêu cầu bảo hiểm |
| Tiếp tục hồ sơ gần nhất | Tiếp tục yêu cầu gần nhất |
| Hồ sơ chưa nộp / Yêu cầu chưa gửi | Yêu cầu bảo hiểm chưa nộp |
| Hồ sơ đã nộp / Yêu cầu đã gửi | Yêu cầu bảo hiểm đã nộp |
| Danh sách hồ sơ chưa nộp | Danh sách yêu cầu bảo hiểm chưa nộp |
| Mã hồ sơ / Mã HSYCBH | Mã yêu cầu |
| Gửi hồ sơ / Gửi yêu cầu / Submit hồ sơ | Nộp yêu cầu bảo hiểm |
| Chuyển sang bán hàng | Tạo yêu cầu bảo hiểm từ tư vấn này |
| Người bán | Nhân viên phụ trách |
| Personal Accident | Bảo hiểm tai nạn cá nhân |
| Motor Comprehensive | Bảo hiểm vật chất xe |
| Health Individual / Health Insurance | Bảo hiểm sức khỏe |
| Chọn phương thức thanh toán | Chọn cách thanh toán |

## File đã sửa

- `shared/js/terminology.js`: thêm `BANCA.T` và `BANCA.t(key)`.
- `shared/js/head-loader.js`: nạp terminology trước seed/app-shell và bump cache-bust lên `v=20260723p`.
- `shared/js/app-shell.js`, `shared/js/app-manifest.js`, `app-manifest.json`: chuẩn hóa shell/nav/header/CTA/avatar/menu title.
- `modules/*/index.html`, `modules/*/module.json`: chuẩn hóa page title, breadcrumb, CTA, table, modal, timeline, notification, dashboard/mobile/team labels.
- `shared/mock/seed/*.js`, `shared/mock/handlers/*.js`, `shared/mock/scenarios/*.js`: chuẩn hóa seed/product/status/notification labels hiển thị; giữ nguyên enum/ID/route/field kỹ thuật.
- `scripts/validate-terminology.js`: validator Node cho thuật ngữ production UI.

## Kết quả validate

```text
TERMINOLOGY VALIDATION PASS: scanned 79 files
```

Đã chạy thêm `node --check` cho các file JS chính vừa chạm. Không chạy server/browser.

## Cần BA xác nhận

- PA overhaul từng dùng “Đối tượng bán”; task này ưu tiên glossary mới nên step/risk object đã chuẩn hóa thành “Đối tượng bảo hiểm”.
- “Hồ sơ nhân viên” được giữ cho employee profile vì glossary cho phép “Hồ sơ” khi nói về tập hợp thông tin của nhân viên, không phải record yêu cầu bảo hiểm.
