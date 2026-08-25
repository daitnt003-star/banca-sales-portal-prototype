const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  for(const [u,sel] of [['/modules/policies/index.html','table.dtable'],
    ['/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment','.workspace-command-bar']]){
    await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(300);
    console.log('\n===== '+u.split('/').slice(-2)[0]+' — chuỗi cha của '+sel+' =====');
    console.log(await page.evaluate((s)=>{
      const vw=document.documentElement.clientWidth;
      let el=document.querySelector(s); const rows=[];
      while(el){
        const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
        rows.push([el.tagName.toLowerCase()+(el.id?('#'+el.id):'')+'.'+String(el.className||'').split(' ')[0],
          'w='+Math.round(r.width), 'minW='+cs.minWidth, 'ovx='+cs.overflowX,
          'display='+cs.display, r.width>vw+2?'⚠ TRÀN':''].join('  '));
        el=el.parentElement;
      }
      return 'viewport='+vw+'\n'+rows.join('\n');
    }, sel));
  }
  await ctx.close(); await b.close();
})();
