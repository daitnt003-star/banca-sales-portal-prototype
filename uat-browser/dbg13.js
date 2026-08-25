const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  await page.goto(L.BASE+'/modules/application-workspace/index.html?id=DRAFT-2026-006&step=RISK_DECLARATION',{waitUntil:'networkidle'});
  await page.waitForTimeout(300);
  console.log(await page.evaluate(()=>{
    const vw=document.documentElement.clientWidth;
    const out=[];
    document.querySelectorAll('*').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.right > vw+2){
        const cs=getComputedStyle(el);
        out.push({el:el.tagName.toLowerCase()+'#'+(el.id||'')+'.'+String(el.className||'').split(' ')[0],
          right:Math.round(r.right), w:Math.round(r.width), minW:cs.minWidth,
          pos:cs.position, ovx:cs.overflowX});
      }
    });
    return 'viewport='+vw+' scrollWidth='+document.documentElement.scrollWidth+'\n'+
      JSON.stringify(out.slice(0,8),null,1);
  }));
  await ctx.close(); await b.close();
})();
