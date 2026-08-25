const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  const shot = n => page.screenshot({ path: __dirname+'/shot-'+n+'.png', fullPage:false });

  L.grp('1. Mở bản chào NHÁP có sẵn (xe) và đi từng bước');
  await L.go(page, '/modules/application-workspace/index.html?id=DRAFT-2026-006&step=RISK_DECLARATION');
  page.__errs.length = 0;
  let txt = await L.bodyText(page);
  L.ok('mở được bước Khai báo rủi ro', /Khai báo rủi ro|khai báo/i.test(txt));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));

  L.grp('2. Khối "Ai trả lời các câu khai báo này?" phải HIỆN RA');
  const picker = page.locator('.decl-source-picker').first();
  L.ok('khối chọn người trả lời hiện trên màn hình', await picker.isVisible().catch(()=>false),
    'không thấy .decl-source-picker');
  L.ok('  …có nhãn Bắt buộc khi chưa chọn', /b[ắẮ]t bu[ộỘ]c/i.test(await picker.innerText()), await picker.innerText());
  const btnCustomer = page.locator('.decl-source-picker button', { hasText:'Khách tự trả lời' }).first();
  L.ok('  …có nút "Khách tự trả lời"', await btnCustomer.count() > 0);
  await shot('01-declaration');

  L.grp('3. Trả lời các câu rủi ro');
  const radios = page.locator('input[type=radio]');
  const nRadio = await radios.count();
  L.info('số ô radio', nRadio);
  for(let i=0;i<nRadio;i+=2){ await radios.nth(i+1).check().catch(()=>{}); } // chọn "Không"
  const nums = page.locator('input[type=number]');
  for(let i=0;i<await nums.count();i++){ await nums.nth(i).fill('0').catch(()=>{}); await nums.nth(i).dispatchEvent('change').catch(()=>{}); }
  await page.waitForTimeout(600);
  const answered = await page.evaluate(()=>{
    const o = JSON.parse(localStorage.getItem('bancaDemoOverlay')||'{}');
    const a = (o.applications||{})['DRAFT-2026-006']||{};
    return { ra:Object.keys(a.riskAnswers||{}).length, by:Object.keys(a.answeredBy||{}).length };
  });
  L.info('đã lưu', answered.ra + ' câu trả lời · ' + answered.by + ' quy kết');
  L.ok('câu trả lời được lưu', answered.ra > 0, JSON.stringify(answered));

  L.grp('4. Bấm "Khách tự trả lời" → quy kết được ghi lại');
  if(await btnCustomer.count()){ await btnCustomer.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500); }
  const after = await page.evaluate(()=>{
    const o = JSON.parse(localStorage.getItem('bancaDemoOverlay')||'{}');
    const a = (o.applications||{})['DRAFT-2026-006']||{};
    return { src:a.declarationAnsweredBy, by:Object.keys(a.answeredBy||{}).length, ra:Object.keys(a.riskAnswers||{}).length };
  });
  L.info('sau khi bấm', JSON.stringify(after));
  L.ok('ghi nhận nguồn trả lời', after.src === 'CUSTOMER', JSON.stringify(after));
  L.ok('  …áp cho mọi câu đã trả lời', after.by >= after.ra && after.ra > 0, JSON.stringify(after));
  L.ok('  …KHÔNG làm mất câu trả lời nào', after.ra >= answered.ra, JSON.stringify(after));
  await shot('02-attributed');

  L.grp('5. Sang bước Rà soát & nộp');
  await L.go(page, '/modules/application-workspace/index.html?id=DRAFT-2026-006&step=REVIEW_AND_SUBMIT');
  txt = await L.bodyText(page);
  L.ok('có bảng ĐỌC LẠI bản khai cho khách', await page.locator('.decl-readback').isVisible().catch(()=>false),
    'không thấy .decl-readback');
  L.ok('  …bảng ghi rõ ai trả lời', /Khách tự trả lời/.test(txt), '');
  const blockers = (txt.match(/🚫 Chưa thể gửi yêu cầu bảo hiểm[\s\S]{0,400}/)||[''])[0];
  L.info('khối chặn', blockers ? blockers.split('\n').slice(0,6).join(' | ') : '(không có — sẵn sàng nộp)');
  L.ok('KHÔNG còn báo thiếu bản khai', !/chưa ghi nhận ai trả lời|còn thiếu ghi nhận AI trả lời/.test(txt),
    'vẫn báo thiếu quy kết');
  await shot('03-review');

  L.grp('6. Nút Nộp bật lên sau khi tick 2 xác nhận');
  const submit = page.locator('#submit-btn');
  L.ok('có nút Nộp yêu cầu bảo hiểm', await submit.count() > 0);
  if(await submit.count()){
    L.ok('  …ban đầu bị khoá', await submit.isDisabled());
    await page.locator('#c1').check().catch(()=>{});
    await page.locator('#c2').check().catch(()=>{});
    await page.waitForTimeout(300);
    const en = !(await submit.isDisabled());
    L.ok('  …tick đủ 2 ô thì bật', en, 'vẫn khoá — ' + (await submit.getAttribute('title')));
    if(en){
      page.on('dialog', d => d.accept());
      await submit.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      const st = await page.evaluate(()=>{
        const o = JSON.parse(localStorage.getItem('bancaDemoOverlay')||'{}');
        const a = (o.applications||{})['DRAFT-2026-006']||{};
        return { status:a.status, sub:a.submissionState, sof: a.statementOfFact ? 'CÓ' : 'KHÔNG', qv:(a.quoteVersions||[]).length };
      });
      L.info('sau khi nộp', JSON.stringify(st));
      L.ok('hồ sơ chuyển sang ĐÃ NỘP', st.sub === 'SUBMITTED', JSON.stringify(st));
      L.ok('  …có bản ghi bản khai', st.sof === 'CÓ');
      L.ok('  …có phiên báo giá đã chốt', st.qv > 0);
      await shot('04-submitted');
    }
  }
  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
