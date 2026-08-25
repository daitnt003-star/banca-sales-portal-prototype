const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  for(const who of ['RM-01','TL-01','BM-01','SUP-01','RM-IN']){
    const ctx = await b.newContext(); const page = await ctx.newPage();
    await page.goto(L.BASE+'/modules/policies/index.html');
    await page.evaluate(u=>localStorage.setItem('bancaPersona',u), who);
    await page.goto(L.BASE+'/modules/policies/index.html',{waitUntil:'networkidle'});
    const nav = await page.locator('nav a, aside a, .sidebar a').evaluateAll(a=>a.map(x=>x.textContent.trim()).filter(Boolean));
    const cta = await page.locator('header button, header a').evaluateAll(a=>a.map(x=>x.textContent.trim()).filter(t=>t&&t.length<30));
    console.log('\n'+who.padEnd(8)+' menu: '+[...new Set(nav)].join(' · '));
    console.log('        CTA : '+[...new Set(cta)].join(' · '));
    // người dùng NGỪNG HOẠT ĐỘNG mở thẳng workspace bán hàng thì sao?
    if(who==='RM-IN'){
      for(const u of ['/modules/application-workspace/index.html?id=DRAFT-2026-006&step=REVIEW_AND_SUBMIT',
                      '/modules/application-workspace/index.html?new=1',
                      '/modules/policies/index.html?view=detail&id=JB-POL-2026-0207']){
        await page.goto(L.BASE+u,{waitUntil:'networkidle'});
        const t=await page.locator('body').innerText();
        const blocked=/ngừng hoạt động|Không có quyền|không thể/i.test(t);
        const submitBtn=await page.locator('#submit-btn').count();
        console.log('        ['+(blocked?'CHẶN':'MỞ  ')+'] '+u.split('?')[0].split('/').slice(-2)[0]+
          (submitBtn?('  ⚠ vẫn có nút Nộp (disabled='+await page.locator('#submit-btn').isDisabled()+')'):''));
      }
    }
    await ctx.close();
  }
  await b.close();
})();
