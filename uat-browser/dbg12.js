const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  for(const u of ['/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment',
                  '/modules/application-workspace/index.html?id=DRAFT-2026-006&step=RISK_DECLARATION']){
    await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(300);
    console.log('\n===== '+(u.includes('stage=')?'THANH TOÁN':'KHAI BÁO')+' =====');
    console.log(await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth, out=[];
      document.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width<=vw+2) return;
        // bỏ qua phần tử nằm trong khung cuộn ngang (đó là hành vi đúng)
        let p=el.parentElement, inScroll=false;
        while(p && p!==document.body){ const ox=getComputedStyle(p).overflowX;
          if(ox==='auto'||ox==='scroll'){inScroll=true;break;} p=p.parentElement; }
        if(inScroll) return;
        const cs=getComputedStyle(el);
        out.push(el.tagName.toLowerCase()+'.'+String(el.className||'').split(' ').slice(0,2).join('.')
          +' w='+Math.round(r.width)+' minW='+cs.minWidth+' grid='+cs.gridTemplateColumns.slice(0,40)+' ws='+cs.whiteSpace);
      });
      return out.slice(0,10).join('\n') || '(không còn phần tử nào tràn ngoài khung cuộn)';
    }));
  }
  await ctx.close(); await b.close();
})();
