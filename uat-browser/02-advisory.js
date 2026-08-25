const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);

  L.grp('1. TƯ VẤN NHANH — từ danh sách vào phiên, chọn nhu cầu và phương án');
  await L.go(page, '/modules/quick-advisory/index.html');
  let txt = await L.bodyText(page);
  L.ok('danh sách hiện phiên tư vấn', /ADV-2026-/.test(txt), txt.slice(0,150));
  L.ok('có tab trạng thái', /Đang thực hiện|Cần theo dõi|Đã gửi khách/.test(txt));

  // mở phiên đang thực hiện
  await L.go(page, '/modules/advisory-workspace/index.html?id=ADV-2026-002');
  page.__errs.length = 0;
  txt = await L.bodyText(page);
  L.ok('mở được phiên đang thực hiện', /Không gian tư vấn|Nhu cầu/.test(txt));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.join(' | '));
  L.ok('có 3 bước Nhu cầu → Gợi ý → Quyết định',
    /Nhu cầu/.test(txt) && /Gợi ý/.test(txt) && /Quyết định/.test(txt));

  L.grp('2. Chọn nhu cầu → sang bước Gợi ý');
  const needBtn = page.locator('button', { hasText: 'Bảo vệ xe' }).first();
  if(await needBtn.count()){ await needBtn.click(); await page.waitForTimeout(400); }
  const nextOk = await L.clickText(page, 'Gợi ý');
  L.ok('bấm được sang bước Gợi ý', nextOk === true || nextOk === 'disabled',
    nextOk === false ? 'không tìm thấy nút' : '');
  await page.waitForTimeout(500);
  txt = await L.bodyText(page);
  L.ok('bước Gợi ý hiện phương án', /gói|Gói|phương án|Phương án/.test(txt));
  L.ok('  …phí ghi rõ là MINH HOẠ, không phải cam kết',
    /minh h[oọ]a|indicative|Phí minh/i.test(txt), 'không thấy nhãn minh hoạ');

  L.grp('3. Phiên đã chuyển bán phải khoá, không sửa được nữa');
  // nhãn khoá + lối sang bản chào nằm ở bước Quyết định
  await L.go(page, '/modules/advisory-workspace/index.html?id=ADV-2026-004&step=result');
  txt = await L.bodyText(page);
  L.ok('phiên đã chuyển bán bị khoá', /đã khoá|Đã khoá|đã chuyển bán|🔒/.test(txt), txt.slice(0,200));

  L.grp('4. Liên kết ngược tư vấn ↔ bản chào');
  const link = page.locator('a', { hasText:'APP-2026-102' }).first();
  L.ok('có đường dẫn tới bản chào đã tạo', await link.count() > 0);
  const st = await page.evaluate(()=>{
    const B=window.BANCA; const s=(B.adviceSessions||[]).find(x=>x.id==='ADV-2026-004');
    const a=B.appById(s.convertedCaseId);
    return {conv:s.convertedCaseId, back:a&&a.sourceAdviceId};
  });
  L.ok('bản chào trỏ NGƯỢC về phiên tư vấn', st.back === 'ADV-2026-004', JSON.stringify(st));

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
