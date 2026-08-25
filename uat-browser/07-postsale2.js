const L = require('./lib');
const POL='JB-POL-2026-0207';
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  const dialogs=[]; page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
  const shot = n => page.screenshot({ path: __dirname+'/shot-'+n+'.png' });
  const M = () => page.locator('#post-sale-modal');

  L.grp('1. Tạo yêu cầu dịch vụ');
  await L.go(page, '/modules/policies/index.html?view=detail&id='+POL+'&tab=service');
  page.__errs.length=0;
  const before = await page.evaluate(()=> (window.BANCA.serviceRequests||[]).length);
  await page.locator('button').filter({ hasText:'Tạo yêu cầu bổ sung' }).first().click();
  await page.waitForTimeout(600);
  L.ok('modal mở', await M().isVisible());
  const types = await M().locator('select').first().locator('option').evaluateAll(o=>o.map(x=>x.textContent.trim()));
  L.info('loại yêu cầu cho XE', types.join(' · '));
  L.ok('  …không có loại của sức khoẻ', !types.some(t=>/Thêm người được bảo hiểm|thụ hưởng/i.test(t)));
  await M().locator('select').first().selectOption({ label:'Cấp lại GCNBH / thẻ điện tử' }).catch(()=>{});
  await M().locator('textarea').first().fill('Khách yêu cầu cấp lại giấy chứng nhận bản điện tử.');
  await M().locator('button').filter({ hasText:'Ghi nhận & gửi xử lý' }).first().click();
  await page.waitForTimeout(900);
  const after = await page.evaluate(()=> (window.BANCA.serviceRequests||[]).length);
  L.info('số yêu cầu', before+' → '+after);
  L.ok('tạo được yêu cầu dịch vụ', after > before, 'không tăng');
  const sr = await page.evaluate(()=>{ const a=(window.BANCA.serviceRequests||[]); return a[a.length-1]; });
  L.ok('  …trạng thái khởi tạo là ĐÃ GỬI, không tự nhảy sang hoàn tất',
    sr && ['SUBMITTED','DRAFT','IN_PROGRESS'].includes(sr.status), JSON.stringify(sr&&sr.status));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));
  await shot('14-sr-created');

  L.grp('2. Khai báo tổn thất NGOÀI thời hạn bảo hiểm — phải chặn');
  await L.go(page, '/modules/policies/index.html?view=detail&id='+POL);
  dialogs.length=0;
  const nBefore = await page.evaluate(()=> (window.BANCA.claims||[]).length);
  await page.locator('button, a').filter({ hasText:'Khai báo tổn thất' }).first().click();
  await page.waitForTimeout(600);
  const period = await M().innerText();
  const eff = (period.match(/(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/)||[]);
  L.info('thời hạn hợp đồng', eff[1]+' → '+eff[2]);
  await M().locator('input[type=date]').fill('2020-01-01');
  await M().locator('textarea').first().fill('Thử ngày ngoài thời hạn.');
  await M().locator('button').filter({ hasText:'Ghi nhận & gửi bồi thường' }).first().click();
  await page.waitForTimeout(800);
  const nMid = await page.evaluate(()=> (window.BANCA.claims||[]).length);
  const blockedMsg = dialogs.join(' | ') + ' ' + (await M().innerText().catch(()=>''));
  L.ok('KHÔNG tạo hồ sơ bồi thường cho ngày ngoài hiệu lực', nMid === nBefore,
    'đã tạo dù ngoài thời hạn: ' + nBefore + ' → ' + nMid);
  L.ok('  …và nói rõ lý do', /hiệu lực|ngoài|không hợp lệ/i.test(blockedMsg), blockedMsg.slice(0,160));
  await shot('15-claim-outside');

  L.grp('3. Khai báo tổn thất TRONG thời hạn — phải tạo được');
  dialogs.length=0;
  // modal có thể đã đóng sau lần gửi bị chặn → mở lại
  if(!(await M().isVisible().catch(()=>false))){
    await L.go(page, '/modules/policies/index.html?view=detail&id='+POL);
    await page.locator('button, a').filter({ hasText:'Khai báo tổn thất' }).first().click();
    await page.waitForTimeout(600);
    await M().locator('textarea').first().fill('Va chạm tại ngã tư, xe hư cản trước.');
  }
  await M().locator('input[type=date]').fill('2026-07-20');
  await M().locator('input[placeholder*="Tên người khai"]').fill('Nguyễn Văn Minh · 0909123456').catch(()=>{});
  await M().locator('button').filter({ hasText:'Ghi nhận & gửi bồi thường' }).first().click();
  await page.waitForTimeout(900);
  const nAfter = await page.evaluate(()=> (window.BANCA.claims||[]).length);
  L.info('số hồ sơ bồi thường', nBefore+' → '+nAfter);
  L.ok('tạo được hồ sơ bồi thường', nAfter > nBefore, dialogs.join(' | '));
  const c = await page.evaluate(()=>{ const a=(window.BANCA.claims||[]); return a[a.length-1]; });
  L.ok('  …trạng thái ban đầu là ĐÃ KHAI BÁO, portal không tự duyệt',
    c && ['NOTIFIED','ASSESSING'].includes(c.status), JSON.stringify(c&&c.status));
  await shot('16-claim-created');

  L.grp('4. Tái tục hợp đồng sắp hết hạn');
  await L.go(page, '/modules/policies/index.html');
  page.__errs.length=0;
  const row = page.locator('tr', { hasText:'JB-POL-2025-0102' }).first();
  const renBtn = row.locator('a, button').filter({ hasText:'Tái tục' }).first();
  L.ok('hợp đồng RENEWAL_DUE có nút Tái tục', await renBtn.count() > 0);
  if(await renBtn.count()){
    await renBtn.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(1000);
    L.info('đi tới', decodeURIComponent(page.url().split('?')[1]||'').slice(0,80));
    const txt = await L.bodyText(page);
    L.ok('mở được hồ sơ tái tục', /[Tt]ái tục/.test(txt), txt.slice(0,180));
    L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));
    const d = await page.evaluate(()=>{
      const B=window.BANCA;
      const id=new URLSearchParams(location.search).get('id')||'DRAFT-2026-NEW';
      const a=B.appById(id)||{};
      return { id:id, ref:a.renewalPolicyRef||a.renewalOf, prev:a.renewPrevPremium,
               needs:B.declaration?B.declaration.needsReconfirm(a):null,
               flags:a.warningFlags||[] };
    });
    L.info('hồ sơ tái tục', JSON.stringify(d));
    L.ok('  …gắn về hợp đồng kỳ trước', d.ref === 'JB-POL-2025-0102', JSON.stringify(d));
    L.ok('  …ĐÁNH DẤU cần rà lại khai báo kỳ trước (IF3 1/7 C3D)', d.needs === true,
      'không có cờ — khai báo kỳ trước bị kế thừa mù sang kỳ mới');
    await shot('17-renewal');
  }
  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
