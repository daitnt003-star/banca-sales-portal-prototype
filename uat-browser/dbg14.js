const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  await page.goto(L.BASE+'/modules/application-workspace/index.html?id=DRAFT-2026-006&step=RISK_DECLARATION',{waitUntil:'networkidle'});
  await page.waitForTimeout(300);
  console.log(await page.evaluate(()=>{
    const ol=[...document.querySelectorAll('ol')].find(o=>o.getBoundingClientRect().width>500);
    if(!ol) return 'không tìm thấy ol rộng';
    const chain=[]; let el=ol;
    while(el && el!==document.body){
      const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
      chain.push(el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+'.'+String(el.className||'').split(' ').filter(Boolean).join('.')
        +'  w='+Math.round(r.width)+' minW='+cs.minWidth+' maxW='+cs.maxWidth+' ovx='+cs.overflowX);
      el=el.parentElement;
    }
    return chain.join('\n');
  }));
  await ctx.close(); await b.close();
})();
