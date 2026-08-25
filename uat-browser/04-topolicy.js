const L = require('./lib');
const ID = 'DRAFT-2026-006';
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  page.on('dialog', d => d.accept());
  const shot = n => page.screenshot({ path: __dirname+'/shot-'+n+'.png' });
  const state = () => page.evaluate((id)=>{
    const o=JSON.parse(localStorage.getItem('bancaDemoOverlay')||'{}');
    const a=(o.applications||{})[id]||{};
    return {status:a.status, uw:a.underwritingDecision, pay:a.paymentStatus, pol:a.policyStatus, policyId:a.policyId};
  }, ID);

  // --- đưa hồ sơ về trạng thái đã nộp (lặp lại 03) ---
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&step=RISK_DECLARATION');
  const rad = page.locator('input[type=radio]');
  for(let i=0;i<await rad.count();i+=2) await rad.nth(i+1).check().catch(()=>{});
  const nums = page.locator('input[type=number]');
  for(let i=0;i<await nums.count();i++){ await nums.nth(i).fill('0').catch(()=>{}); await nums.nth(i).dispatchEvent('change').catch(()=>{}); }
  await page.waitForTimeout(400);
  await page.locator('.decl-source-picker button', { hasText:'Khách tự trả lời' }).first().click();
  await page.waitForTimeout(500);
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&step=REVIEW_AND_SUBMIT');
  await page.locator('#c1').check(); await page.locator('#c2').check();
  await page.waitForTimeout(200);
  await page.locator('#submit-btn').click();
  await page.waitForTimeout(900);

  L.grp('1. Sau khi nộp — hồ sơ vào không gian theo dõi');
  let st = await state();
  L.info('trạng thái', JSON.stringify(st));
  L.ok('hồ sơ đã nộp và có định tuyến', !!st.status, JSON.stringify(st));
  let txt = await L.bodyText(page);
  L.ok('có thanh "Việc tiếp theo"', /Việc tiếp theo/.test(txt), txt.slice(0,200));
  const nextLabel = (txt.match(/Việc tiếp theo:\s*([^\n]+)/)||[])[1] || '';
  L.info('việc tiếp theo', nextLabel);
  await shot('05-after-submit');

  L.grp('2. Thẩm định — mô phỏng kết quả');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&stage=underwriting');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('mở được màn thẩm định', /Thẩm định/.test(txt));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  let done = await L.clickText(page, 'Duyệt');
  L.info('bấm nút duyệt', String(done));
  await page.waitForTimeout(800);
  st = await state();
  L.info('sau thẩm định', JSON.stringify(st));

  L.grp('3. Xác nhận khách & thanh toán');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&stage=confirmation-payment');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('mở được màn xác nhận & thanh toán', /[Tt]hanh toán/.test(txt));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  L.ok('KHÔNG còn kẹt vì bản khai', !/chưa ghi nhận ai trả lời|thiếu ghi nhận AI trả lời/.test(txt),
    (txt.match(/[^\n]*ai trả lời[^\n]*/)||[''])[0]);
  const gate = await page.evaluate((id)=>{
    const B=window.BANCA; const a=B.appById(id); const g=B.paymentEnableRule(a,{me:B.current()});
    return {enabled:g.enabled, reasons:g.reasons};
  }, ID);
  L.info('cổng thanh toán', gate.enabled ? 'MỞ' : ('KHOÁ — ' + (gate.reasons||[]).join(' | ')));
  await shot('06-payment');

  L.grp('4. Có nút khởi tạo thanh toán dùng được không');
  const payBtns = page.locator('.pay-method-btn');
  const nPay = await payBtns.count();
  L.info('số cách thanh toán hiện ra', nPay);
  let usable = 0;
  for(let i=0;i<nPay;i++) if(!(await payBtns.nth(i).isDisabled())) usable++;
  L.ok('có ít nhất 1 cách thanh toán bấm được', gate.enabled ? usable>0 : true,
    'cổng mở nhưng mọi nút đều xám');
  if(!gate.enabled){
    L.ok('cổng khoá thì phải nêu lý do thành CHỮ trên màn hình',
      /Chưa thể|chưa đủ điều kiện|Cần xử lý/i.test(txt), 'không thấy lý do nào');
  }

  L.grp('5. Hợp đồng đã phát hành (dùng hồ sơ mẫu đã ISSUED)');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-110&stage=policy');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('màn hợp đồng mở được', /JB-POL-2026-0207/.test(txt), txt.slice(0,200));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  L.ok('  …có lối mở chi tiết hợp đồng',
    await page.locator('a[href*="policies/index.html"]').count() > 0);
  await shot('07-policy');

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
