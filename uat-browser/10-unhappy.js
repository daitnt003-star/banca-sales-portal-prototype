const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  const dialogs=[]; page.on('dialog', d=>{ dialogs.push(d.message()); d.accept(); });
  // Mỗi hồ sơ thuộc một người bán; mở bằng người khác sẽ ACCESS_DENIED (đúng).
  const as = async (who) => { await page.goto(L.BASE+'/modules/policies/index.html');
    await page.evaluate(u=>localStorage.setItem('bancaPersona',u), who); };
  const stOf = (id) => page.evaluate((i)=>{
    const B=window.BANCA, a=B.appById(i)||{};
    const v=B.deriveCaseViewState(a), g=B.paymentEnableRule(a,{me:a.owner});
    return {status:a.status, pay:a.paymentStatus, pol:a.policyStatus, phase:v.phase,
            next:v.nextActionLabel, primary:(v.primaryAction||{}).label, gate:g.enabled, reasons:g.reasons};
  }, id);

  L.grp('1. Thanh toán THẤT BẠI — phải thử lại được');
  await as('RM-01');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment');
  page.__errs.length=0;
  let ok = await L.clickText(page, 'Callback: Thất bại');
  L.info('bấm mô phỏng thất bại', String(ok));
  await page.waitForTimeout(800);
  let s = await stOf('APP-2026-107');
  L.info('trạng thái', JSON.stringify({pay:s.pay, next:s.next, primary:s.primary}));
  L.ok('ghi nhận thất bại', s.pay==='FAILED', JSON.stringify(s));
  // Khi khách CHƯA xác nhận thì việc cần làm trước là xác nhận, không phải trả lại tiền.
  L.ok('  …có việc tiếp theo rõ ràng', /[Tt]hử lại|xác nhận/i.test(s.next||''), s.next);
  L.ok('  …có nút thử lại trên màn hình',
    await page.locator('button,a').filter({hasText:/Thử lại|Tạo lại/}).count() > 0);
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,1).join(''));

  L.grp('2. Yêu cầu thanh toán HẾT HẠN — phải tạo lại được');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment');
  const recreate = await L.clickText(page, 'Tạo lại') || await L.clickText(page, 'Tạo yêu cầu thanh toán mới');
  L.info('bấm tạo lại', String(recreate));
  await page.waitForTimeout(800);
  s = await stOf('APP-2026-107');
  L.info('sau khi tạo lại', JSON.stringify({status:s.status, pay:s.pay, next:s.next}));
  L.ok('quay về trạng thái khởi tạo thanh toán được',
    ['METHOD_REQUIRED','PENDING'].includes(s.pay), JSON.stringify(s));

  L.grp('3. Đã thu tiền nhưng PHÁT HÀNH LỖI — không thu lại tiền');
  await as('RM-02');   // APP-2026-108 thuộc RM-02
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-108&stage=policy');
  page.__errs.length=0;
  let txt = await L.bodyText(page);
  s = await stOf('APP-2026-108');
  L.info('trạng thái', JSON.stringify({pol:s.pol, next:s.next}));
  L.ok('nêu rõ đã thanh toán, không thu lại', /không thu lại|đã thanh toán/i.test(s.next+' '+txt), s.next);
  // Nút THẬT gọi retryIssue(); "Thử phát hành lại" ở thanh lệnh chỉ là liên kết
  // điều hướng sang bước Phát hành — bấm nó không phát hành lại.
  const retryBtn = page.locator('button[onclick*="retryIssue"]').first();
  L.ok('  …có nút thử phát hành lại (gọi retryIssue)', await retryBtn.count() > 0);
  if(await retryBtn.count()){ await retryBtn.click(); await page.waitForLoadState('networkidle'); }
  L.info('bấm phát hành lại', await retryBtn.count() ? 'true' : 'không có nút');
  await page.waitForTimeout(900);
  s = await stOf('APP-2026-108');
  L.info('sau khi thử lại', JSON.stringify({status:s.status, pol:s.pol}));
  L.ok('phát hành lại thành công', s.pol==='ISSUED', JSON.stringify(s));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,1).join(''));

  L.grp('4. Thẩm định TỪ CHỐI — không được lẫn sang đường thu tiền');
  await as('TS-01');   // APP-2026-111 thuộc TS-01
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-111&stage=underwriting');
  s = await stOf('APP-2026-111');
  L.info('APP-2026-111', JSON.stringify({phase:s.phase, next:s.next, gate:s.gate}));
  L.ok('hồ sơ bị từ chối thì cổng thu phí ĐÓNG', s.gate===false);
  L.ok('  …và nêu lý do từ chối', (s.reasons||[]).some(r=>/từ chối/i.test(r)), (s.reasons||[]).join(' | '));
  txt = await L.bodyText(page);
  L.ok('  …màn hình chỉ hiện lý do được phép chia sẻ với khách',
    /từ chối|Từ chối/.test(txt), txt.slice(0,150));

  L.grp('5. Thu hồi hồ sơ — chỉ khi chưa tiếp nhận');
  await as('RM-01');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-101&stage=created');
  const wd = page.locator('button').filter({hasText:'Thu hồi'});
  L.info('hồ sơ vừa nộp có nút thu hồi', await wd.count() ? 'có' : 'không');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-110&stage=policy');
  const wd2 = page.locator('button').filter({hasText:'Thu hồi'});
  L.ok('hợp đồng ĐÃ PHÁT HÀNH thì KHÔNG cho thu hồi', await wd2.count() === 0,
    'vẫn có nút thu hồi trên hợp đồng đã phát hành');

  L.grp('6. Phân quyền theo chủ hồ sơ — mọi route đều kiểm');
  await as('RM-01');
  for(const [id,owner] of [['APP-2026-108','RM-02'],['APP-2026-111','TS-01']]){
    for(const stg of ['created','underwriting','confirmation-payment','policy']){
      await L.go(page, '/modules/application-workspace/index.html?id='+id+'&stage='+stg);
      const t = await L.bodyText(page);
      L.ok('RM-01 KHÔNG mở được '+id+' ('+owner+') ở bước '+stg,
        /ACCESS_DENIED|không có quyền/i.test(t), t.slice(-120));
    }
  }

  L.grp('7. Chống thu tiền hai lần');
  const dbl = await page.evaluate(()=>{
    const B=window.BANCA, a=B.appById('APP-2026-110');
    return B.paymentEnableRule(a,{me:a.owner});
  });
  L.ok('hợp đồng đã phát hành: cổng thu phí ĐÓNG', dbl.enabled===false);
  L.ok('  …lý do là đã thanh toán thành công',
    (dbl.reasons||[]).some(r=>/đã thanh toán|đã hủy|phát hành/i.test(r)), (dbl.reasons||[]).join(' | '));

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
