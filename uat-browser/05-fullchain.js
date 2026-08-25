const L = require('./lib');
const ID = 'DRAFT-2026-006';
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  page.on('dialog', d => d.accept());
  const shot = n => page.screenshot({ path: __dirname+'/shot-'+n+'.png' });
  const st = () => page.evaluate((id)=>{
    const B=window.BANCA, a=B.appById(id)||{};
    const g=B.paymentEnableRule(a,{me:B.current()});
    const v=B.deriveCaseViewState(a);
    return {status:a.status, uw:a.underwritingDecision, pay:a.paymentStatus, pol:a.policyStatus,
            policyId:a.policyId, gate:g.enabled, reasons:g.reasons, next:v.nextActionLabel};
  }, ID);

  L.grp('1. Hoàn tất bản nháp và nộp');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&step=RISK_DECLARATION');
  const rad = page.locator('input[type=radio]');
  for(let i=0;i<await rad.count();i+=2) await rad.nth(i+1).check().catch(()=>{});
  const nums = page.locator('input[type=number]');
  for(let i=0;i<await nums.count();i++){ await nums.nth(i).fill('0').catch(()=>{}); await nums.nth(i).dispatchEvent('change').catch(()=>{}); }
  await page.waitForTimeout(400);
  await page.locator('.decl-source-picker button', { hasText:'Khách tự trả lời' }).first().click();
  await page.waitForTimeout(500);
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&step=REVIEW_AND_SUBMIT');
  let txt = await L.bodyText(page);
  const blocked = /🚫 Chưa thể gửi/.test(txt);
  L.info('còn chặn?', blocked ? (txt.match(/🚫[\s\S]{0,250}/)||[''])[0].split('\n').slice(1,5).join(' | ') : 'không');
  if(!blocked){
    await page.locator('#c1').check(); await page.locator('#c2').check();
    await page.waitForTimeout(200);
    await page.locator('#submit-btn').click();
    await page.waitForTimeout(900);
  }
  let s = await st();
  L.ok('nộp xong, trạng thái đầy đủ', !!s.uw && !!s.pay, JSON.stringify(s));
  L.info('sau nộp', JSON.stringify({status:s.status,uw:s.uw,pay:s.pay,next:s.next}));

  L.grp('2. Gửi khách xác nhận → khách nhập OTP');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&stage=confirmation-payment');
  page.__errs.length=0;
  let sent = await L.clickText(page, 'Gửi khách xác nhận');
  if(sent!==true) sent = await L.clickText(page, 'Gửi xác nhận');
  L.info('bấm gửi xác nhận', String(sent));
  await page.waitForTimeout(700);
  let otp = await L.clickText(page, 'Khách xác nhận OTP tại quầy');
  if(otp!==true) otp = await L.clickText(page, 'Khách đã xác nhận');
  L.info('mở xác nhận OTP', String(otp));
  const otpInput = page.locator('input[inputmode=numeric]').first();
  if(await otpInput.count()){
    await otpInput.fill('123456');
    await L.clickText(page, 'Khách gửi OTP xác nhận');
    await page.waitForTimeout(800);
  }
  // Hồ sơ TÁI TỤC bị đánh dấu cần rà lại khai báo kỳ trước (IF3 1/7 C3D) —
  // phải xác nhận lại thì mới thu được phí. Đây là hành vi ĐÚNG, không phải lỗi.
  const reBtn = page.locator('button').filter({ hasText:'Khách xác nhận lại nội dung khai báo' }).first();
  if(await reBtn.count()){
    L.info('hồ sơ tái tục', 'cần xác nhận lại khai báo → bấm xác nhận');
    await reBtn.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
  }
  s = await st();
  L.info('sau xác nhận', JSON.stringify({status:s.status, gate:s.gate, next:s.next}));
  L.ok('khách xác nhận xong thì cổng MỞ', s.gate === true, (s.reasons||[]).join(' | '));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));
  await shot('08-confirmed');

  L.grp('3. Khởi tạo thanh toán');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&stage=confirmation-payment');
  const payBtn = page.locator('.pay-method-btn:not([disabled])').first();
  L.ok('có cách thanh toán bấm được', await payBtn.count() > 0);
  if(await payBtn.count()){
    await payBtn.click();
    await page.waitForTimeout(600);
    const create = await L.clickText(page, 'Tạo mã QR thanh toán') || await L.clickText(page, 'Tạo phiên thanh toán');
    L.info('tạo yêu cầu thanh toán', String(create));
    await page.waitForTimeout(900);
  }
  s = await st();
  L.info('sau khi tạo', JSON.stringify({status:s.status, pay:s.pay, next:s.next}));
  L.ok('đã tạo được yêu cầu thanh toán', s.pay === 'PENDING', JSON.stringify(s));
  await shot('09-payintent');

  L.grp('4. Cổng thanh toán trả kết quả THÀNH CÔNG → phát hành');
  await L.go(page, '/modules/application-workspace/index.html?id='+ID+'&stage=confirmation-payment');
  page.__errs.length=0;
  const ok1 = await L.clickText(page, 'Thành công');
  L.info('mô phỏng callback thành công', String(ok1));
  await page.waitForTimeout(1200);
  s = await st();
  L.info('sau thanh toán', JSON.stringify({status:s.status, pay:s.pay, pol:s.pol, policyId:s.policyId}));
  L.ok('thanh toán ghi nhận THÀNH CÔNG', s.pay === 'SUCCESS', JSON.stringify(s));
  L.ok('  …hợp đồng được phát hành', s.pol === 'ISSUED' && !!s.policyId, JSON.stringify(s));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));
  await shot('10-issued');

  L.grp('5. Hợp đồng mới: snapshot kênh + hoa hồng ổn định');
  if(s.policyId){
    const c = await page.evaluate((pid)=>{
      const B=window.BANCA;
      const pol=B.policyById(pid);
      const d=B.policyDistributionOf(pid, pol&&pol.owner);
      const at=(ch)=>{ localStorage.setItem('bancaChannel',ch); const x=B.commissionOfPolicy(pol); return x.noRate?'—':x.amount; };
      const a1=at('BANCA_INTEGRATED'), a2=at('AGENT'); localStorage.setItem('bancaChannel','BANCA_INTEGRATED');
      return {found:!!pol, fallback:!!d._fallback, channel:d.channel, banca:a1, agent:a2};
    }, s.policyId);
    L.info('hợp đồng', s.policyId + ' · kênh ' + c.channel);
    L.ok('tra được hợp đồng vừa phát hành', c.found);
    L.ok('  …có snapshot kênh bán (không fallback)', !c.fallback);
    L.ok('  …đổi kênh xem KHÔNG đổi hoa hồng', String(c.banca) === String(c.agent),
      'banca=' + c.banca + ' agent=' + c.agent);
    await L.go(page, '/modules/policies/index.html?view=detail&id='+s.policyId);
    txt = await L.bodyText(page);
    L.ok('mở được chi tiết hợp đồng vừa tạo', txt.includes(s.policyId), txt.slice(0,150));
    await shot('11-policy-detail');
  }

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
