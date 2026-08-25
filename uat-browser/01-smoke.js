const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);

  L.grp('0. Mọi màn hình mở được, không lỗi JS');
  const PAGES = [
    ['/index.html','Trang chủ'],
    ['/modules/quick-advisory/index.html','Tư vấn nhanh'],
    ['/modules/advisory-workspace/index.html?id=ADV-2026-001','Phiên tư vấn'],
    ['/modules/unsubmitted-applications/index.html','Bản chào nháp'],
    ['/modules/submitted-applications/index.html','Hồ sơ đã nộp'],
    ['/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment','Hồ sơ · thanh toán'],
    ['/modules/application-workspace/index.html?id=DRAFT-2026-HLT2&step=RISK_DECLARATION','Nháp · khai báo'],
    ['/modules/policies/index.html','Hợp đồng'],
    ['/modules/policies/index.html?view=detail&id=JB-POL-2026-0207','Chi tiết hợp đồng'],
    ['/modules/seller-workspace/index.html','Bàn giao'],
    ['/modules/team-workspace/index.html','Nhóm'],
    ['/modules/employee-profile/index.html','Hồ sơ nhân viên'],
    ['/modules/help/index.html','Trợ giúp']
  ];
  for(const [u,label] of PAGES){
    page.__errs.length = 0;
    const r = await L.go(page, u);
    const txt = await L.bodyText(page);
    const status = r ? r.status() : 0;
    L.ok(label + ' mở được (HTTP ' + status + ', ' + txt.length + ' ký tự)',
      status === 200 && txt.length > 200, 'nội dung quá ngắn hoặc lỗi tải');
    L.ok('  …không lỗi JS', page.__errs.length === 0, page.__errs.slice(0,2).join(' | '));
    L.ok('  …không lộ chuỗi lỗi ra màn hình',
      !/undefined|NaN|\[object Object\]|Cannot read/.test(txt),
      (txt.match(/undefined|NaN|\[object Object\]|Cannot read[^\n]{0,60}/g)||[]).slice(0,3).join(' | '));
  }
  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
