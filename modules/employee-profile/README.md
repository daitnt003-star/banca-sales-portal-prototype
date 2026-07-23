# employee-profile

Hồ sơ nhân viên — mở từ avatar dropdown (không nằm menu chính). Merge 3 module cũ: seller-profile, seller-readiness, product-access (OQ-01 chốt xóa thẳng route cũ).

- Tab `info`: thông tin nhân viên (read-only, nguồn Distribution)
- Tab `certs`: chứng chỉ & đào tạo (`BANCA.certifications`)
- Tab `products`: sản phẩm bán hàng — readiness + capability + lý do hạn chế

Route: `index.html?tab=info|certs|products`
