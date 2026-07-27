window.BANCA = window.BANCA || {};

BANCA.lang = (function(){
  try{ return localStorage.getItem('bancaLang')==='en'?'en':'vi'; }catch(e){ return 'vi'; }
})();

BANCA.T = {
  home: 'Trang chủ',
  sales: 'BÁN HÀNG',
  afterSale: 'SAU BÁN',
  support: 'HỖ TRỢ',
  management: 'QUẢN LÝ',
  quickAdvisory: 'Tư vấn nhanh',
  adviseAndSell: 'Tư vấn và bán bảo hiểm', // §6.1 — CTA primary duy nhất trên dashboard
  help: 'Trợ giúp',
  insuranceRequest: 'Yêu cầu bảo hiểm',
  offers: 'Bản chào',
  unsubmitted: 'Chưa nộp',
  submitted: 'Đã nộp',
  unsubmittedRequestTitle: 'Yêu cầu bảo hiểm chưa nộp',
  submittedRequestTitle: 'Yêu cầu bảo hiểm đã nộp',
  requestCode: 'Mã yêu cầu',
  createInsuranceRequest: 'Tạo yêu cầu bảo hiểm',
  createRequestFromAdvice: 'Tạo yêu cầu bảo hiểm từ tư vấn này',
  continueLatestRequest: 'Tiếp tục yêu cầu gần nhất',
  continueRequest: 'Tiếp tục yêu cầu',
  viewRequest: 'Xem yêu cầu',
  openRequest: 'Mở yêu cầu',
  submitRequest: 'Nộp yêu cầu bảo hiểm',
  submittedRequestMessage: 'Yêu cầu bảo hiểm đã được nộp',
  unsubmittedListTitle: 'Danh sách yêu cầu bảo hiểm chưa nộp',
  unsubmittedListDescription: 'Theo dõi các yêu cầu đang được hoàn thiện trước khi nộp',
  submittedListTitle: 'Danh sách yêu cầu bảo hiểm đã nộp',
  submittedListDescription: 'Theo dõi trạng thái xử lý sau khi nộp và các việc cần hành động',
  policy: 'Hợp đồng',
  insurancePolicy: 'Hợp đồng bảo hiểm',
  certificate: 'Giấy chứng nhận bảo hiểm',
  product: 'Sản phẩm',
  package: 'Gói bảo hiểm',
  coverage: 'Quyền lợi bảo hiểm',
  benefit: 'Quyền lợi',
  premium: 'Phí bảo hiểm',
  quote: 'Báo giá',
  riskObject: 'Đối tượng bảo hiểm',
  riskDeclaration: 'Khai báo rủi ro',
  underwriting: 'Thẩm định',
  stp: 'Thẩm định tự động',
  manualUnderwriting: 'Thẩm định thủ công',
  referral: 'Chuyển thẩm định',
  seller: 'Nhân viên tư vấn',
  assignedSeller: 'Nhân viên phụ trách',
  sellerProfile: 'Hồ sơ nhân viên',
  sellerReadiness: 'Điều kiện được phép bán',
  productAuthorization: 'Sản phẩm được phép bán',
  paymentMethodRequired: 'Chờ chọn cách thanh toán',
  choosePaymentMethod: 'Chọn cách thanh toán',
  paymentPending: 'Chờ thanh toán',
  paymentProcessing: 'Đang xử lý thanh toán',
  paymentSuccess: 'Thanh toán thành công',
  policyIssuing: 'Đang phát hành hợp đồng',
  policyIssued: 'Hợp đồng đã phát hành'
};

BANCA.t = function(key, fallback){
  if(Object.prototype.hasOwnProperty.call(BANCA.T, key)) return BANCA.T[key];
  return fallback || key;
};

BANCA.setLang = function(l){
  try{ localStorage.setItem('bancaLang', l==='en'?'en':'vi'); }catch(e){}
  location.reload();
};
