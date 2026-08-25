// Bán MỚI: tải tài liệu thật + thanh bước phải nói đúng sự thật.
// Chạy: node uat-browser/13-new-sale-documents.js      (BASE=http://localhost:8899)
// Bắt lại đúng lỗi người dùng báo 2026-08-25 trên bản GitHub Pages:
//   · mở thẳng ?step=REVIEW_AND_SUBMIT trên hồ sơ trống → 5 bước hiện "✓ Hoàn tất"
//   · tải đủ tài liệu → cổng chặn nộp vẫn báo thiếu (hai kho tài liệu song song)
const { chromium } = (function(){const fs=require('fs'),path=require('path'),os=require('os');
 const n=path.join(os.homedir(),'.npm','_npx'); const t=['playwright'];
 if(fs.existsSync(n)) for(const d of fs.readdirSync(n)){const c=path.join(n,d,'node_modules','playwright'); if(fs.existsSync(c)) t.push(c);}
 for(const x of t){try{return require(x)}catch(e){}} process.exit(2);})();
const PORT=(process.env.BASE||'http://localhost:8899').split(':').pop();
const S=u=>'http://localhost:'+PORT+'/modules/application-workspace/index.html'+u;
let pass=0,fail=0;
const ok=(n,c,x)=>{c?(pass++,console.log('  ✓ '+n)):(fail++,console.log('  ✗ '+n+'   → '+(x||'')));};
const steps=p=>p.$$eval('.progress-stepper__step',ns=>Array.from(ns).map(n=>{
  const l=n.querySelector('.progress-stepper__label'),s=n.querySelector('.progress-stepper__status');
  return{label:l?l.innerText.trim():'?',status:s?s.innerText.trim():'?'};}));
const os=require('os'),pathm=require('path'),fsm=require('fs');
const FAKE=pathm.join(os.tmpdir(),'uat-fake-doc.png');
fsm.writeFileSync(FAKE,'demo');

(async()=>{
 const b=await chromium.launch();

 console.log('\nA. Thanh bước KHÔNG được báo "Hoàn tất" trên hồ sơ trống');
 {
  const p=await(await b.newContext()).newPage();
  await p.goto(S('?id=DRAFT-2026-NEW&step=REVIEW_AND_SUBMIT&new=1'),{waitUntil:'networkidle'});
  await p.waitForTimeout(700);
  const st=await steps(p);
  const done=st.filter(s=>s.status==='Hoàn tất');
  ok('mở thẳng vào Review trên hồ sơ trống → 0 bước "Hoàn tất"',done.length===0,
     'vẫn báo hoàn tất: '+done.map(d=>d.label).join(', '));
  await p.screenshot({path:pathm.join(os.tmpdir(),'uat13-review.png'),fullPage:true});
  await p.close();
 }

 console.log('\nB. Upload tài liệu thật → cổng chặn nộp phải THẤY');
 {
  const p=await(await b.newContext()).newPage();
  p.on('dialog',d=>d.accept());
  await p.goto(S('?id=DRAFT-2026-NEW&new=1&product=motor&customer=CUS-001'),{waitUntil:'networkidle'});
  await p.goto(S('?id=DRAFT-2026-NEW&step=DOCUMENTS&new=1'),{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  const before=await p.evaluate(()=>BANCA.uploadedDocCodes(BANCA.appById?BANCA.appById('DRAFT-2026-NEW')||{id:'DRAFT-2026-NEW'}:{id:'DRAFT-2026-NEW'}));
  ok('trước khi tải: chưa ghi nhận tài liệu nào',before.length===0,JSON.stringify(before));
  for(const id of ['docf-REG','docf-INSPECT','docf-PHOTOS','docf-ID','docf-VALUE_PROOF']){
    const el=await p.$('#'+id); if(el){await el.setInputFiles(FAKE);await p.waitForTimeout(600);}
  }
  await p.waitForTimeout(1000);
  const after=await p.evaluate(()=>BANCA.uploadedDocCodes({id:'DRAFT-2026-NEW'}));
  ok('sau khi tải 5 tệp: hệ thống ghi nhận đủ 5',after.length===5,JSON.stringify(after));

  await p.goto(S('?id=DRAFT-2026-NEW&step=REVIEW_AND_SUBMIT&new=1'),{waitUntil:'networkidle'});
  await p.waitForTimeout(700);
  const txt=await p.evaluate(()=>document.body.innerText);
  ok('bước Review KHÔNG còn báo thiếu tài liệu',!/Thiếu tài liệu bắt buộc/.test(txt),
     (txt.match(/Thiếu tài liệu bắt buộc[^\n]*/)||[''])[0]);
  const st=await steps(p);
  const doc=st.find(s=>/Tài liệu/.test(s.label));
  ok('bước "Tài liệu" nay mới hiện Hoàn tất',doc&&doc.status==='Hoàn tất',JSON.stringify(doc));
  const veh=st.find(s=>/Đối tượng/.test(s.label));
  ok('bước chưa nhập xe VẪN không hiện Hoàn tất',veh&&veh.status!=='Hoàn tất',JSON.stringify(veh));
  // Thanh bước và dòng tóm tắt phải KHỚP nhau — trước đây tóm tắt vẫn hiện "—"
  ok('dòng tóm tắt "Tài liệu" hiện số lượng, không còn "—"',/\d+\s*tài liệu đã tải/.test(txt),
     (txt.match(/Tài liệu[^\n]{0,40}/)||[''])[0]);
  await p.screenshot({path:pathm.join(os.tmpdir(),'uat13-after-upload.png'),fullPage:true});
  await p.close();
 }

 console.log('\nC. Hồ sơ mẫu đã đủ dữ liệu vẫn phải hiện Hoàn tất (không hồi quy)');
 {
  const p=await(await b.newContext()).newPage();
  await p.goto(S('?id=DRAFT-2026-006&step=REVIEW_AND_SUBMIT'),{waitUntil:'networkidle'});
  await p.waitForTimeout(700);
  const st=await steps(p);
  const done=st.filter(s=>s.status==='Hoàn tất');
  ok('DRAFT-2026-006 (đủ tài liệu trong seed) vẫn hiện các bước Hoàn tất',done.length>=3,
     JSON.stringify(st.map(x=>x.label+'='+x.status)));
  await p.close();
 }


 console.log('\nD. Sức khoẻ: KHÔNG có ma trận tài liệu → không được tự nhận Hoàn tất');
 {
  const p=await(await b.newContext()).newPage();
  await p.goto(S('?id=DRAFT-2026-NEW&new=1&product=health&customer=CUS-001'),{waitUntil:'networkidle'});
  await p.goto(S('?id=DRAFT-2026-NEW&step=REVIEW_AND_SUBMIT&new=1'),{waitUntil:'networkidle'});
  await p.waitForTimeout(700);
  const st=await steps(p);
  const doc=st.find(s=>/Tài liệu/.test(s.label));
  ok('hồ sơ sức khoẻ TRỐNG: bước Tài liệu không hiện Hoàn tất',
     !doc||doc.status!=='Hoàn tất',JSON.stringify(doc));
  await p.close();
 }

 console.log('\n───────────────\nPASS '+pass+' · FAIL '+fail);
 await b.close();
 process.exit(fail?1:0);
})();
