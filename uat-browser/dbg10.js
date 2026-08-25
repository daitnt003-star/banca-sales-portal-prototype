const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  for(const u of ['/modules/policies/index.html',
                  '/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment']){
    await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(300);
    console.log('\n===== '+u.split('/').slice(-2)[0]+' =====');
    console.log(await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth;
      const out=[];
      document.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.width>vw+2 && r.width>0){
          const cs=getComputedStyle(el);
          out.push({tag:el.tagName.toLowerCase(), cls:(el.className||'').toString().slice(0,45),
            w:Math.round(r.width), minW:cs.minWidth, ovx:cs.overflowX,
            parent:(el.parentElement&&el.parentElement.className||'').toString().slice(0,30)});
        }
      });
      // chỉ giữ phần tử NGOÀI CÙNG gây tràn
      const top=out.filter((e,i)=>i<12);
      return JSON.stringify(top,null,1);
    }));
  }
  await ctx.close(); await b.close();
})();
