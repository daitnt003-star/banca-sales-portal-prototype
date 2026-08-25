const L = require('./lib');
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  for(const u of process.argv.slice(2)){
    await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(300);
    console.log('\n===== '+u.slice(-46)+' =====');
    console.log(await page.evaluate(()=>{
      const cw=document.documentElement.clientWidth, out=[];
      document.querySelectorAll('*').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.right<=cw+2) return;
        let par=el.parentElement,scr=false;
        while(par&&par!==document.documentElement){const ox=getComputedStyle(par).overflowX;
          if(ox==='auto'||ox==='scroll'){scr=true;break;} par=par.parentElement;}
        if(scr) return;
        const cs=getComputedStyle(el);
        out.push({t:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+'.'+String(el.className||'').split(' ').filter(Boolean).slice(0,2).join('.'),
          right:Math.round(r.right), w:Math.round(r.width), minW:cs.minWidth, ws:cs.whiteSpace,
          txt:(el.textContent||'').trim().slice(0,40)});
      });
      out.sort((a,b)=>b.right-a.right);
      return JSON.stringify(out.slice(0,5),null,1);
    }));
  }
  await ctx.close(); await b.close();
})();
