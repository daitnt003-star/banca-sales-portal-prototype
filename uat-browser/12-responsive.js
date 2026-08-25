const L = require('./lib');
const SIZES = [['Điện thoại',390,844],['Máy tính bảng',820,1180],['Laptop',1440,900]];
const PAGES = [
  ['/modules/policies/index.html','Hợp đồng'],
  ['/modules/application-workspace/index.html?id=APP-2026-107&stage=confirmation-payment','Thanh toán'],
  ['/modules/application-workspace/index.html?id=DRAFT-2026-006&step=RISK_DECLARATION','Khai báo rủi ro'],
  ['/modules/quick-advisory/index.html','Tư vấn nhanh']
];
(async () => {
  const b = await L.chromium.launch();
  for(const [label,w,h] of SIZES){
    L.grp(label+' ('+w+'×'+h+')');
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    const page = await ctx.newPage();
    const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    for(const [u,name] of PAGES){
      errs.length=0;
      await page.goto(L.BASE+u,{waitUntil:'networkidle'}); await page.waitForTimeout(250);
      // 1) không tràn ngang toàn trang
      const over = await page.evaluate(()=> document.documentElement.scrollWidth - document.documentElement.clientWidth);
      L.ok(name+': không tràn ngang', over <= 2, 'tràn '+over+'px');
      // 2) nút chính không bị cắt khỏi màn hình
      const clipped = await page.evaluate(()=>{
        const vw=document.documentElement.clientWidth;
        const inScroll = el => { let p=el.parentElement;
          while(p && p!==document.body){ const ox=getComputedStyle(p).overflowX;
            if(ox==='auto'||ox==='scroll') return true; p=p.parentElement; } return false; };
        return [...document.querySelectorAll('.btn')].filter(el=>{
          const r=el.getBoundingClientRect();
          if(!(r.width>0)) return false;
          // Nút nằm TRONG khung cuộn ngang (ví dụ trong bảng rộng) là hành vi
          // đúng — người dùng cuộn khung đó để tới. Chỉ tính nút bị cắt ở
          // ngoài mọi khung cuộn.
          if(inScroll(el)) return false;
          return r.right > vw+2 || r.left < -2;
        }).map(el=>el.textContent.trim().slice(0,28)).slice(0,3);
      });
      L.ok('  …không nút nào bị cắt khỏi màn', clipped.length===0, clipped.join(' | '));
      // 3) chữ không quá nhỏ
      const tiny = await page.evaluate(()=>{
        return [...document.querySelectorAll('.btn, td, th, p, label')].filter(el=>{
          const t=(el.textContent||'').trim();
          if(!t || t.length<3) return false;
          const fs=parseFloat(getComputedStyle(el).fontSize);
          return fs && fs < 10;
        }).map(el=>Math.round(parseFloat(getComputedStyle(el).fontSize))+'px: '+el.textContent.trim().slice(0,24)).slice(0,3);
      });
      L.ok('  …không chữ nào dưới 10px', tiny.length===0, tiny.join(' | '));
      L.ok('  …không lỗi JS', errs.length===0, errs.slice(0,1).join(''));
    }
    await ctx.close();
  }

  L.grp('Bảng rộng phải cuộn trong khung riêng, không đẩy cả trang');
  const ctx = await b.newContext({ viewport:{width:390,height:844} });
  const page = await ctx.newPage();
  await page.goto(L.BASE+'/modules/policies/index.html',{waitUntil:'networkidle'});
  const tbl = await page.evaluate(()=>{
    const t=document.querySelector('table');
    if(!t) return {none:true};
    let el=t.parentElement, scrollable=false;
    while(el && el!==document.body){
      const ox=getComputedStyle(el).overflowX;
      if(ox==='auto'||ox==='scroll'){ scrollable=true; break; }
      el=el.parentElement;
    }
    return {scrollable, tableWidth:t.scrollWidth, viewport:document.documentElement.clientWidth};
  });
  L.info('bảng', JSON.stringify(tbl));
  L.ok('bảng nằm trong khung cuộn ngang riêng', tbl.none || tbl.scrollable || tbl.tableWidth <= tbl.viewport,
    'bảng rộng '+tbl.tableWidth+'px mà không có khung cuộn');
  await ctx.close();
  await b.close();
  process.exit(L.summary() ? 1 : 0);
})();
