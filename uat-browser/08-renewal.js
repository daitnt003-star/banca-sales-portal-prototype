const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  page.on('dialog', d => d.accept());

  L.grp('1. Hồ sơ tái tục được nhận diện đúng');
  await L.go(page, '/modules/application-workspace/index.html?id=DRAFT-2026-006');
  page.__errs.length=0;
  let txt = await L.bodyText(page);
  const d = await page.evaluate(()=>{
    const B=window.BANCA, a=B.appById('DRAFT-2026-006')||{};
    return { ref:a.renewalPolicyRef, of:a.renewalOf, needs:B.declaration.needsReconfirm(a), flags:a.warningFlags||[] };
  });
  L.info('hồ sơ tái tục', JSON.stringify(d));
  L.ok('nhận diện là TÁI TỤC (renewalPolicyRef)', d.ref === 'JB-POL-2025-0102', JSON.stringify(d));
  L.ok('  …hiện băng tái tục trên màn hình', /[Tt]ái tục/.test(txt), txt.slice(0,150));
  L.ok('  …ĐÁNH DẤU cần rà lại khai báo kỳ trước (IF3 1/7 C3D)', d.needs === true);
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));

  L.grp('2. Hợp đồng CHƯA có hồ sơ tái tục — nút không được đứng im');
  await L.go(page, '/modules/policies/index.html');
  const row = page.locator('tr', { hasText:'JB-POL-2025-0088' }).first();
  const btn = row.locator('a, button').filter({ hasText:'Tái tục' }).first();
  L.ok('có nút Tái tục', await btn.count() > 0);
  if(await btn.count()){
    const tag = await btn.evaluate(e=>e.tagName+' · '+(e.getAttribute('href')||e.getAttribute('onclick')||''));
    L.info('nút', tag.slice(0,90));
    L.ok('  …là đường dẫn thật, không phải alert demo', /^A/.test(tag) && /renew=/.test(tag), tag);
    await btn.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(900);
    txt = await L.bodyText(page);
    L.ok('  …mở được luồng tái tục', /[Tt]ái tục/.test(txt), txt.slice(0,150));
    // Hồ sơ nháp mới dựng trong bộ nhớ; ngữ cảnh lưu ở banca_draftctx, chưa vào
    // overlay cho tới khi có thao tác ghi. Kiểm bằng ngữ cảnh + thứ HIỆN trên màn.
    const d2 = await page.evaluate(()=>{
      try { return JSON.parse(localStorage.getItem('banca_draftctx')||'{}'); } catch(e){ return {}; }
    });
    L.info('ngữ cảnh hồ sơ mới', JSON.stringify({mode:d2.mode, ref:d2.renewalPolicyRef, prev:(d2.renewPrefill||{}).prevPremium}));
    L.ok('  …gắn về hợp đồng kỳ trước', d2.renewalPolicyRef === 'JB-POL-2025-0088', JSON.stringify(d2.renewalPolicyRef));
    L.ok('  …hiện băng tái tục kèm mã hợp đồng cũ',
      /Tái tục từ hợp đồng JB-POL-2025-0088/.test(txt), '');
    L.ok('  …nói rõ khai báo kỳ trước PHẢI hỏi lại (IF3 1/7 C3D)',
      /PHẢI hỏi lại|không kế thừa từ kỳ trước/i.test(txt), '');
    L.ok('  …prefill phí kỳ trước để khách so sánh', /phí kỳ trước/i.test(txt), '');
  }

  L.grp('3. Cờ "cần xác nhận lại khai báo" PHẢI gỡ được (không kẹt vĩnh viễn)');
  await page.evaluate(()=>{
    const B=window.BANCA; const a=B.appById('APP-2026-107');
    B.declaration.markNeedsReconfirm(a,'Thử nghiệm UAT');
    B.patchApp('APP-2026-107',{warningFlags:a.warningFlags, declarationReconfirm:a.declarationReconfirm});
  });
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('màn thanh toán báo cần xác nhận lại', /xác nhận LẠI|xác nhận lại/i.test(txt), txt.slice(0,200));
  const reBtn = page.locator('button').filter({ hasText:'Khách xác nhận lại nội dung khai báo' }).first();
  L.ok('  …CÓ nút để gỡ ngay tại đó', await reBtn.count() > 0, 'không có nút — kẹt vĩnh viễn');
  if(await reBtn.count()){
    await reBtn.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(900);
    const g = await page.evaluate(()=>{
      const B=window.BANCA, a=B.appById('APP-2026-107');
      return { needs:B.declaration.needsReconfirm(a), sof:B.statementOfFact.status(a),
               reasons:B.paymentEnableRule(a,{me:B.current()}).reasons };
    });
    L.info('sau khi xác nhận lại', JSON.stringify(g));
    L.ok('  …cờ được gỡ', g.needs === false, JSON.stringify(g));
    L.ok('  …bản khai đóng dấu lại theo nội dung hiện tại', g.sof === 'CONFIRMED', g.sof);
    L.ok('  …không còn lý do chặn liên quan khai báo',
      !(g.reasons||[]).some(r=>/khai báo|bản khai/i.test(r)), (g.reasons||[]).join(' | '));
  }
  L.ok('không lỗi JS', page.__errs.length===0, page.__errs.slice(0,2).join(' | '));

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
