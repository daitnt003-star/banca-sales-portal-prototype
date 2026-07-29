# F — Policy Cockpit → Customer Service Workspace (Health trước)

> Nguồn quyết định: yêu cầu user 2026-07-29 + PROJECT_OVERVIEW v1 + policy-cockpit.js hiện hành.
> Phạm vi bản này: **Health**. Motor/PA nhân ra sau khi duyệt.
> Nguyên tắc bất biến: Portal = Sales & Customer Service Workspace. Mọi xử lý nghiệp vụ (UW, endorsement processing, claim adjudication, policy update) ở Core; Portal chỉ **tạo request + theo dõi trạng thái đồng bộ về**.

---

## 0. Định hướng IA (tư duy Banking Portal)

Lớp 1 (nổi ngay) = cái RM cần để chăm sóc khách sau bán:
> Khách đóng phí chưa? → có claim không? → có endorsement không? → sắp tái tục chưa? → liên hệ khi nào?

Lớp 2 (đẩy xuống drawer/expand) = nghiệp vụ bảo hiểm chi tiết:
> Coverage detail · Clause · Exclusion · Waiting period · Deductible · Benefit table · Product document · PDF điều khoản.

---

## 1. Bộ 6 tab mới (thay 6 tab cũ)

| # | Tab mới | Tab cũ tương ứng | Bản chất thay đổi |
|---|---------|------------------|-------------------|
| 1 | **Overview** | Tổng quan | Bỏ bảng quyền lợi đầy đủ → chip tóm tắt + drawer; điều khoản/exclusion/PDF/product doc → drawer "Thông tin sản phẩm"; thêm Quick Actions + Payment summary |
| 2 | **Thu phí** | Thanh toán | Summary → bảng kỳ phí, highlight đỏ khi quá hạn |
| 3 | **Life Cycle** | Dòng thời gian | Thêm cột User/System + Reference + filter chips |
| 4 | **Sửa đổi bổ sung** | Yêu cầu dịch vụ | Đổi tên + ngôn ngữ sang Endorsement; giữ khung Service Request; tạo request trong tab |
| 5 | **Bồi thường** | Tổn thất/Bồi thường | Bảng gọn + drawer chi tiết; giữ nguyên "chỉ khai báo + theo dõi" |
| 6 | **Chăm sóc khách hàng** | *(mới)* | Renewal/claim/payment suy ra + contact log lưu Portal |

Tab **Tài liệu** cũ: bỏ khỏi thanh tab, gộp vào Overview → drawer "Thông tin sản phẩm"; "Download Policy" thành Quick Action.

---

## 2. Tab 1 — Overview

Tab mặc định. Các section theo thứ tự:

### 2.1 Header (hero)
Policy No · badge trạng thái (Đang hiệu lực) · Hiệu lực (từ) · Hết hạn (đến) · Customer · Product · Seller · Partner.

### 2.2 Người được bảo hiểm (dynamic theo product)
Health: Policy Holder + N người được BH (hiện đủ, không gập). Field: tên, quan hệ, tuổi/DOB, GCN, gói.

### 2.3 Tóm tắt quyền lợi (KHÔNG bảng đầy đủ)
Chip: tên gói + các quyền lợi bật (✔ Nội trú, ✔ Ngoại trú, ✔ Nha khoa, ✔ Thai sản...). Nút **"Xem chi tiết quyền lợi"** → drawer chứa bảng quyền lợi đầy đủ (benefitRows hiện có) + đồng chi trả + phạm vi lãnh thổ.

### 2.4 Thanh toán (summary)
% đã thanh toán · Kỳ tiếp theo (ngày + số tiền) · badge overdue nếu có.

### 2.5 Quick Action
Download Policy · Gửi lại Email · Gửi lại SMS · Yêu cầu sửa đổi (→ tab 4) · Khai báo tổn thất (→ tab 5). Là thao tác RM dùng nhiều nhất.

### 2.6 Drawer "Thông tin sản phẩm" (lớp 2)
Điều khoản · Exclusion · Điều kiện đặc biệt · Waiting period · Product document · PDF. Mở từ 1 dòng "Thông tin sản phẩm ▼".

**Acceptance:** AC-OV-1 chip quyền lợi hiển thị, không có bảng full ở màn chính. AC-OV-2 nút mở drawer quyền lợi đầy đủ. AC-OV-3 5 quick action render đúng, disable theo trạng thái hợp đồng. AC-OV-4 điều khoản/exclusion không nằm lớp 1.

---

## 3. Tab 2 — Thu phí

Bảng kỳ phí: | Kỳ | Đến hạn | Số tiền | Trạng thái |. Overdue → highlight đỏ + badge "Quá hạn N ngày". Giữ khối summary phí (phí năm, kỳ đóng, phương thức) ở đầu.

**Acceptance:** AC-PAY-1 bảng kỳ phí đúng dữ liệu billing. AC-PAY-2 kỳ OVERDUE highlight đỏ + số ngày quá hạn. AC-PAY-3 empty state khi chưa có lịch sử.

---

## 4. Tab 3 — Life Cycle

Danh sách sự kiện vòng đời: Quote Created → Application Submitted → UW Approved → Payment → Policy Issued → Customer Downloaded → Renewal Reminder → Endorsement Requested → Claim Submitted. Mỗi item: Time · Action · User/System · Status · Reference. Filter chips: All · Payment · Endorsement · Claim · Notification.

**Acceptance:** AC-LC-1 mỗi item đủ 5 trường. AC-LC-2 filter chips lọc đúng nhóm. AC-LC-3 empty state.

---

## 5. Tab 4 — Sửa đổi bổ sung (Endorsement)

Đổi tên tab "Yêu cầu dịch vụ" → "Sửa đổi bổ sung". Giữ khung Service Request. Bảng: | Request | Loại | Status |. Status endorsement: Submitted · Checking · Approved · Rejected · Completed. Tạo request ngay trong tab (giữ modal openService hiện có, đổi copy sang ngôn ngữ endorsement).

Ranh giới: Portal chỉ **Create Request · Upload Document · Tracking · Notification · View Result**. KHÔNG Approve/Reject/Premium recalculation/Policy update/Issue. Workflow: Portal → Core → Checking → Approved → Policy Updated → Callback Portal.

**Acceptance:** AC-END-1 tab tên "Sửa đổi bổ sung". AC-END-2 tạo request trong tab. AC-END-3 status theo 5 bước. AC-END-4 không có nút duyệt/từ chối trong Portal.

---

## 6. Tab 5 — Bồi thường

Bảng gọn: | Claim | Ngày | Trạng thái |. Nút "Chi tiết" → drawer: Loại tổn thất · Ngày xảy ra · Số tiền yêu cầu · Số tiền chi trả · Ngày hoàn tất. Giữ nút "Khai báo tổn thất". Portal chỉ: Khai báo → Upload ảnh → Upload chứng từ → Theo dõi → Nhận kết quả. KHÔNG assessment/survey/reserve/payment/fraud/approval.

**Acceptance:** AC-CLM-1 bảng gọn 3 cột. AC-CLM-2 drawer chi tiết 5 trường. AC-CLM-3 không lộ reserve/workflow nội bộ Core.

---

## 7. Tab 6 — Chăm sóc khách hàng (mới)

Khối highlight (KPI): Customer Health (Policy Active + N ngày còn hiệu lực) · Payment (% hoặc quá hạn N ngày) · Claim (N yêu cầu, hoàn tất/đang xử lý) · Endorsement (N yêu cầu, trạng thái) · Renewal (N ngày nữa · Nhắc tái tục).

Next Best Action gợi ý: "Khách sắp hết hạn 120 ngày → Đề nghị liên hệ"; "Khách vừa claim → Đề nghị gọi hỗ trợ". Cross-sell opportunity.

**Contact log (RM ghi được):** lần liên hệ gần nhất, ngày gọi, lịch hẹn, reminder. RM thêm bản ghi liên hệ ngay trong tab.

**Ranh giới tầng:** contact log lưu trong **post-sale interaction store của Portal** (mock, key theo policyId) — KHÔNG ghi Customer Master. KPI renewal/claim/payment **suy ra** từ policy dates + billing + claims/service, không phải nguồn mới.

**Acceptance:** AC-CARE-1 5 KPI hiển thị đúng suy luận từ policy. AC-CARE-2 Next Best Action theo rule (renewal window / vừa claim). AC-CARE-3 RM thêm được contact log, lưu Portal store, hiện lên list. AC-CARE-4 không có field ghi vào Customer Master.

---

## 8. Business rules

- **Overdue:** kỳ phí có `status==='OVERDUE'` → đỏ; số ngày quá hạn = today − dueDate.
- **Renewal window:** remainingDays ≤ 120 → hiện "Nhắc tái tục" ở Overview payment summary + tab Care.
- **Next Best Action:**
  - remainingDays ≤ 120 → "Đề nghị liên hệ tái tục".
  - có claim trạng thái ASSESSING/NEED_INFO trong 30 ngày → "Đề nghị gọi hỗ trợ khách vừa claim".
  - đã 100% paid & không claim & còn xa hạn → "Cơ hội cross-sell".
- **Quick Action disable:** Khai báo tổn thất/Yêu cầu sửa đổi disable khi `pol.status!=='ACTIVE'`.

---

## 9. Việc KHÔNG làm (giữ ranh giới)

- Không thêm nút duyệt/từ chối/chi trả/policy update trong bất kỳ tab nào.
- Không tạo/sửa Customer Master; contact log là store riêng của Portal.
- Không đổi data model tầng CORE/DISTRIBUTION.
- Không migrate Motor/PA trong bản này (chỉ Health); giữ đường cũ cho Motor/PA.
