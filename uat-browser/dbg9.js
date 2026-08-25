const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const page = await L.newPage(b);
  for(const [id,stage] of [['APP-2026-108','policy'],['APP-2026-111','underwriting'],['APP-2026-107','confirmation-payment']]){
    await L.go(page, '/modules/application-workspace/index.html?id='+id+'&stage='+stage);
    const t = await L.bodyText(page);
    console.log('\n===== '+id+' · '+stage+' =====');
    console.log('độ dài nội dung:', t.length);
    console.log('NÚT: ' + (await page.locator('button, a.btn').evaluateAll(es=>es.map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(x=>x&&x.length<45))).join(' · '));
    console.log('TAB: ' + (await page.locator('[class*=stepper] a, [class*=stage] a, nav a[href*=stage]').evaluateAll(es=>es.map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean))).join(' · '));
    console.log('THÂN: ' + t.split('\n').filter(x=>x.trim()).slice(12).join(' | ').slice(0,400));
  }
  await b.close();
})();
