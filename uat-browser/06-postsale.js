const L = require('./lib');
const POL = 'JB-POL-2026-0207';
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  page.on('dialog', d => d.accept());
  const shot = n => page.screenshot({ path: __dirname+'/shot-'+n+'.png' });

  L.grp('1. Danh sách hợp đồng');
  await L.go(page, '/modules/policies/index.html');
  page.__errs.length=0;
  let txt = await L.bodyText(page);
  L.ok('hiện danh sách hợp đồng', /JB-POL-/.test(txt), txt.slice(0,150));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  // Danh sách hiển thị PHÍ; hoa hồng nằm ở màn chi tiết (đúng thiết kế).
  L.ok('danh sách hiện phí hợp đồng', /ph[íÍ]/i.test(txt));
  L.ok('KHÔNG hiện "0 ₫ · 0%" cho hợp đồng chưa có biểu',
    !/0 ₫.*0%/.test(txt), (txt.match(/[^\n]*0 ₫[^\n]*/)||[''])[0]);

  L.grp('2. Chi tiết hợp đồng');
  await L.go(page, '/modules/policies/index.html?view=detail&id='+POL);
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('mở được chi tiết', txt.includes(POL));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  const sections = ['Hiệu lực','Phí','Yêu cầu dịch vụ','Bồi thường','Hoa hồng'];
  const lower = txt.toLowerCase();
  sections.forEach(sec => L.ok('có mục "'+sec+'"', lower.includes(sec.toLowerCase()), ''));
  await shot('12-policy-detail');

  L.grp('3. Yêu cầu dịch vụ — tạo mới (nằm trong tab Yêu cầu dịch vụ)');
  await L.go(page, '/modules/policies/index.html?view=detail&id='+POL+'&tab=service');
  const srBtn = page.locator('button, a').filter({ hasText: /Tạo yêu cầu bổ sung/ }).first();
  L.info('nút tạo yêu cầu dịch vụ', await srBtn.count() ? 'có' : 'KHÔNG CÓ');
  if(await srBtn.count()){
    await srBtn.click(); await page.waitForTimeout(600);
    txt = await L.bodyText(page);
    L.ok('mở được form tạo yêu cầu', /Thay đổi thông tin|Sửa đổi bổ sung|Cấp lại|chấm dứt/i.test(txt), txt.slice(-300));
    await shot('13-service-request');
  } else {
    L.ok('có đường tạo yêu cầu dịch vụ trên chi tiết hợp đồng', false, 'không tìm thấy nút nào');
  }

  L.grp('4. Loại yêu cầu phải lọc theo sản phẩm');
  const types = await page.evaluate(()=>{
    const B=window.BANCA;
    return { motor:B.serviceRequestTypesFor('motor').map(t=>t.id),
             health:B.serviceRequestTypesFor('health').map(t=>t.id),
             pa:B.serviceRequestTypesFor('pa').map(t=>t.id) };
  });
  L.info('xe', types.motor.join(', '));
  L.info('sức khoẻ', types.health.join(', '));
  L.ok('xe KHÔNG có "thêm người được bảo hiểm"', !types.motor.includes('ADD_MEMBER'));
  L.ok('sức khoẻ CÓ "thêm người được bảo hiểm"', types.health.includes('ADD_MEMBER'));
  L.ok('sức khoẻ KHÔNG có "thay đổi thông tin xe"', !types.health.includes('VEHICLE_CHANGE'));

  L.grp('5. Bồi thường');
  const clm = await page.evaluate(()=>{
    const B=window.BANCA;
    return (B.claims||[]).map(c=>c.id+' · '+c.status+' · '+c.policyId);
  });
  L.info('hồ sơ bồi thường mẫu', clm.join(' | ') || 'không có');
  L.ok('có dữ liệu bồi thường để demo', clm.length > 0);
  const clmBtn = page.locator('button, a').filter({ hasText: /Khai báo tổn thất|Bồi thường|Tạo bồi thường/ }).first();
  L.ok('có lối vào bồi thường từ hợp đồng', await clmBtn.count() > 0, 'không thấy nút');

  L.grp('6. Tái tục');
  const ren = await page.evaluate(()=>{
    const B=window.BANCA;
    const p=(B.policies||[])[0];
    const n=B.buildRenewalNotice? B.buildRenewalNotice(p,{renewalPremium:(p.premium||0)*1.1}) : null;
    return { has:!!n, reconfirm:n&&n.declarationReconfirmRequired, prev:n&&n.previousPremium, vn:n&&n.vietnamCheck };
  });
  L.ok('dựng được thông báo tái tục', ren.has);
  L.ok('  …buộc rà lại khai báo kỳ trước', ren.reconfirm === true);
  L.ok('  …ghi rõ phải đối chiếu luật VN', /KDBH 2022/.test(ren.vn||''), String(ren.vn));
  // Nút Tái tục nằm ở DANH SÁCH, chỉ hiện cho hợp đồng sắp/đã hết hạn.
  await L.go(page, '/modules/policies/index.html');
  const renBtn = page.locator('tr', { hasText:'JB-POL-2025-0102' }).first()
    .locator('a, button').filter({ hasText:'Tái tục' }).first();
  L.ok('hợp đồng sắp hết hạn có lối tái tục', await renBtn.count() > 0, 'không thấy nút tái tục');

  L.grp('7. Giấy chứng nhận tạm thời không tồn tại song song hợp đồng');
  const cn = await page.evaluate((pid)=>{
    const B=window.BANCA;
    const pol=B.policyById(pid);
    return { active: B.coverNoteFor ? !!B.coverNoteFor(pol&&pol.appId) : null };
  }, POL);
  L.ok('không còn giấy tạm hiệu lực khi đã có hợp đồng', cn.active === false || cn.active === null,
    JSON.stringify(cn));

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
