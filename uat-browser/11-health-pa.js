const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  page.on('dialog', d=>d.accept());
  const stOf = (id)=>page.evaluate(i=>{
    const B=window.BANCA,a=B.appById(i)||{};
    const g=B.paymentEnableRule(a,{me:a.owner});
    return {status:a.status,pay:a.paymentStatus,pol:a.policyStatus,policyId:a.policyId,
            gate:g.enabled,reasons:g.reasons,sof:B.statementOfFact.status(a)};
  }, id);

  L.grp('1. SỨC KHOẺ — khai báo theo TỪNG NGƯỜI');
  await L.go(page, '/modules/application-workspace/index.html?id=DRAFT-2026-HLT3&step=RISK_DECLARATION');
  page.__errs.length=0;
  let txt = await L.bodyText(page);
  L.ok('mở được khai báo sức khoẻ', /sức khỏe|sức khoẻ/i.test(txt));
  L.ok('  …nói rõ khai theo từng người', /PER_MEMBER|từng người/i.test(txt));
  L.ok('  …có khối chọn ai trả lời', await page.locator('.decl-source-picker').isVisible().catch(()=>false));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,1).join(''));
  const members = await page.evaluate(()=>{
    const B=window.BANCA,a=B.appById('DRAFT-2026-HLT3');
    return B.healthUnitsOf(a).map(m=>m.name+':'+(m.active!==false?'active':'loại'));
  });
  L.info('thành viên', members.join(' · '));

  L.grp('2. Bản khai sức khoẻ gộp đủ thành viên đang tham gia');
  const sof = await page.evaluate(()=>{
    const B=window.BANCA,a=B.appById('DRAFT-2026-HLT3');
    const s=B.statementOfFact.build(a);
    return {perMember:s.perMember, lines:s.lines.length,
            byMember:[...new Set(s.lines.map(l=>l.memberLabel))],
            unanswered:s.unanswered.length, unattributed:s.unattributed.length};
  });
  L.info('bản khai', JSON.stringify(sof));
  L.ok('nhận diện khai theo từng người', sof.perMember === true);
  L.ok('  …mỗi dòng gắn tên người được bảo hiểm', sof.byMember.every(x=>!!x), JSON.stringify(sof.byMember));
  L.ok('  …thành viên đã loại KHÔNG bị tính vào bản khai',
    sof.byMember.length === members.filter(m=>/active/.test(m)).length,
    JSON.stringify({banKhai:sof.byMember.length, dangThamGia:members.filter(m=>/active/.test(m)).length}));

  L.grp('3. Chọn "ai trả lời" áp cho MỌI thành viên');
  await page.locator('.decl-source-picker button', {hasText:'Khách tự trả lời'}).first().click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(()=>{
    const B=window.BANCA,a=B.appById('DRAFT-2026-HLT3');
    const s=B.statementOfFact.build(a);
    return {unattributed:s.unattributed.length, src:a.declarationAnsweredBy,
            perMemberBy:B.healthUnitsOf(a).filter(m=>m.active!==false)
              .map(m=>Object.keys(m.answeredBy||{}).length)};
  });
  L.info('sau khi chọn', JSON.stringify(after));
  L.ok('mọi thành viên đều được quy kết', after.unattributed === 0, JSON.stringify(after));
  L.ok('  …không thành viên nào bị bỏ sót', after.perMemberBy.every(n=>n>0), JSON.stringify(after.perMemberBy));

  L.grp('4. TAI NẠN (PA) — nhánh phụ khi khai hoạt động nguy hiểm');
  await L.go(page, '/modules/application-workspace/index.html?id=DRAFT-2026-PA1&step=RISK_DECLARATION');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('mở được khai báo PA', txt.length > 500);
  L.ok('  …có khối chọn ai trả lời', await page.locator('.decl-source-picker').isVisible().catch(()=>false));
  const hz = page.locator('input[type=radio]').first();
  if(await hz.count()){ await hz.check(); await page.waitForTimeout(900); }
  txt = await L.bodyText(page);
  L.ok('khai "có hoạt động nguy hiểm" → hiện nhánh bổ sung',
    /hoạt động nguy hiểm|Loại hoạt động|Tần suất/i.test(txt), txt.slice(-200));
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,1).join(''));

  L.grp('5. Hồ sơ sức khoẻ ĐÃ NỘP — cổng thu phí nói đúng lý do');
  // HLT6 cố ý là ca "cần bổ sung" (khai có bệnh sẵn nhưng thiếu chi tiết) — chặn ĐÚNG.
  for(const id of ['APP-2026-HLT2','APP-2026-HLT3','APP-2026-HLT5','APP-2026-HLT7']){
    const s = await stOf(id);
    L.info(id, JSON.stringify({status:s.status, sof:s.sof, gate:s.gate?'MỞ':'KHOÁ'}));
    L.ok(id+': bản khai không rơi vào NOT_READY oan', s.sof !== 'NOT_READY',
      'bản khai bị coi là chưa xong dù hồ sơ đã nộp');
    if(!s.gate) L.ok('  …lý do khoá nêu thành chữ', (s.reasons||[]).length > 0, '');
  }

  L.grp('6. Hợp đồng sức khoẻ đã phát hành — GCN theo từng người');
  await L.go(page, '/modules/application-workspace/index.html?id=APP-2026-HLT1&stage=policy');
  page.__errs.length=0;
  txt = await L.bodyText(page);
  L.ok('mở được hợp đồng sức khoẻ', /JB-HEALTH/.test(txt), txt.slice(0,150));
  L.ok('  …nêu 1 số hợp đồng chung, GCN riêng từng người',
    /GCN|chứng nhận/i.test(txt), '');
  L.ok('  …không lỗi JS', page.__errs.length===0, page.__errs.slice(0,1).join(''));

  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
