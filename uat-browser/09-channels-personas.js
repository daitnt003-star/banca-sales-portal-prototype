const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const CHANNELS = ['BANCA_INTEGRATED','BANCA_STANDALONE','AGENT','BROKER'];
  const PERSONAS = ['RM-01','RM-02','TS-01','TL-01','BM-01','SUP-01','RM-IN'];
  const PAGES = ['/index.html','/modules/quick-advisory/index.html','/modules/policies/index.html',
                 '/modules/submitted-applications/index.html','/modules/unsubmitted-applications/index.html',
                 '/modules/seller-workspace/index.html','/modules/team-workspace/index.html'];

  L.grp('1. Mọi KÊNH × mọi màn hình — không lỗi JS, không lộ chuỗi lỗi');
  for(const ch of CHANNELS){
    const ctx = await b.newContext({ viewport:{width:1440,height:900} });
    const page = await ctx.newPage();
    const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120));});
    await page.goto(L.BASE+'/modules/policies/index.html');
    await page.evaluate(c=>localStorage.setItem('bancaChannel',c), ch);
    let bad=[], leak=[];
    for(const u of PAGES){
      errs.length=0;
      await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(150);
      const t = await page.locator('body').innerText().catch(()=>'');
      if(errs.length) bad.push(u+': '+errs[0].slice(0,70));
      const m = t.match(/undefined|\[object Object\]|NaN(?![a-z])|Cannot read/);
      if(m) leak.push(u+': '+m[0]);
    }
    L.ok(ch+' — không lỗi JS trên '+PAGES.length+' màn', bad.length===0, bad.join(' | '));
    L.ok('  …không lộ chuỗi lỗi ra màn hình', leak.length===0, leak.join(' | '));
    await ctx.close();
  }

  L.grp('2. Mọi NGƯỜI DÙNG — vào được, không lỗi, phân quyền có hiệu lực');
  for(const who of PERSONAS){
    const ctx = await b.newContext({ viewport:{width:1440,height:900} });
    const page = await ctx.newPage();
    const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    await page.goto(L.BASE+'/modules/policies/index.html');
    // khoá đúng của prototype là 'bancaPersona' (identity-service.js)
    await page.evaluate(u=>localStorage.setItem('bancaPersona',u), who);
    await page.goto(L.BASE+'/modules/policies/index.html',{waitUntil:'networkidle'}); await page.waitForTimeout(250);
    const info = await page.evaluate(()=>{
      const B=window.BANCA;
      return { me:B.current(), status:(B.persona()||{}).status, role:(B.persona()||{}).role,
               nav:(B.navFor?B.navFor(B.current()):(B.NAV_CONFIG&&B.NAV_CONFIG.primary||[])).map(x=>x.id) };
    });
    L.info(who, info.me+' · '+info.role+' · '+info.status+' · menu: '+(info.nav||[]).join(','));
    L.ok(who+' vào được, không lỗi JS', errs.length===0, errs.slice(0,1).join(''));
    if(who==='RM-IN'){
      await page.goto(L.BASE+'/modules/quick-advisory/index.html',{waitUntil:'networkidle'});
      const t = await page.locator('body').innerText();
      L.ok('  …tài khoản NGỪNG HOẠT ĐỘNG bị chặn tư vấn', /ngừng hoạt động|Không có quyền/i.test(t), t.slice(0,150));
    }
    if(who==='BM-01' || who==='TL-01'){
      await page.goto(L.BASE+'/modules/policies/index.html',{waitUntil:'networkidle'});
      const t = await page.locator('body').innerText();
      L.ok('  …quản lý chỉ xem, không có nút bán', !/Tạo bản chào/.test(t) || /Chỉ xem/.test(t), '');
    }
    await ctx.close();
  }
  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
