// Submitted detail enrichment — view-model fields for tracking tabs (2026-07-20 17:50)
window.BANCA = window.BANCA || {};
(function(){
  if(!BANCA.applications || !BANCA.rateMotor) return;
  // KYC snapshot bổ sung cho tracking view (không sửa Customer Master thật)
  const kyc={
    'CUS-001':['079085004321','12 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM'],
    'CUS-002':['079090008888','88 Lý Tự Trọng, Q.1, TP.HCM'],
    'CUS-003':['001078009999','21 Trần Duy Hưng, Cầu Giấy, Hà Nội'],
    'CUS-004':['079095006666','45 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM'],
    'CUS-005':['079082007777','17 Nguyễn Văn Cừ, Q.5, TP.HCM'],
    'CUS-006':['079093005555','Chưa xác minh — prospect'],
    'CUS-007':['079088003333','99 Pasteur, Q.3, TP.HCM'],
    'CUS-008':['079075002222','Tân Bình, TP.HCM'],
    'CUS-009':['079098001111','Chưa xác minh — prospect'],
    'CUS-010':['079091332211','120 Nguyễn Đình Chiểu, Q.3, TP.HCM']
  };
  (BANCA.customers||[]).forEach(c=>{ if(kyc[c.id]){ c.idNumber=c.idNumber||kyc[c.id][0]; c.address=c.address||kyc[c.id][1]; } });
  const pkgCodeOf = name => ({Basic:'BASIC',Standard:'STANDARD',Premium:'PREMIUM'}[name] || 'STANDARD');
  BANCA.applications.filter(a=>a.submissionState==='SUBMITTED').forEach(a=>{
    const v=a.vehicle||{};
    const idv=v.value || ({Basic:430000000,Standard:700000000,Premium:980000000}[a.package]||600000000);
    const pkgCode=pkgCodeOf(a.package);
    const pkg=BANCA.motorPackages[pkgCode]||BANCA.motorPackages.STANDARD;
    const inputs={packageCode:pkgCode,sumInsured:idv,termMonths:12,addOns:(pkg.defaultAddOns||[]).slice(),deductible:pkg.defaultDeductible,ncdPercent:a.id==='APP-2026-105'?15:(a.id==='APP-2026-111'?0:5),vehicleAgeYears:2026-(v.year||2024)};
    if(!a.quote){
      const rt=BANCA.rateMotor(inputs);
      a.quote={id:'QT-'+a.id.replace('APP-',''),version:1,ratedAt:(a.submittedAt||a.updatedAt),validUntil:'2026-08-20',inputsSnapshot:inputs,inputHash:BANCA.inputHashOf(inputs),
        basePremium:rt.basePremium,adjustedPremium:rt.adjustedPremium,adjustments:rt.adjustments,
        tplPremium:rt.tplPremium,odBase:rt.odBase,lines:rt.lines,subtotal:rt.subtotal,ncdPct:rt.ncdPct,ncdAmount:rt.ncdAmount,odAfterNcd:rt.odAfterNcd,vatAmount:rt.vatAmount,odTotal:rt.odTotal,totalPremium:rt.totalPremium,
        versions:[{version:1,premium:rt.totalPremium,createdAt:(a.submittedAt||a.updatedAt),createdBy:a.owner,status:'CURRENT'}],premium:rt.totalPremium};
    }
    a.premium=a.uw&&a.uw.newPremium ? a.premium : (a.quote.totalPremium||a.quote.adjustedPremium||a.premium);
    if(a.payment){ a.payment.amount = a.uw&&a.uw.newPremium ? a.uw.newPremium : a.premium; }
    a.declarations = [
      {q:'Xe đã từng bị tai nạn / claim trong 24 tháng?', a:(a.id==='APP-2026-105'?'Có — 2 claim trong 12 tháng':'Không'), flag:a.id==='APP-2026-105', note:a.id==='APP-2026-105'?'Kích hoạt UW loading +15%':''},
      {q:'Xe dùng cho mục đích kinh doanh vận tải?', a:'Không', flag:false},
      {q:'Khu vực đỗ xe thường xuyên có nguy cơ ngập?', a:(['APP-2026-109'].includes(a.id)?'Có':'Không'), flag:['APP-2026-109'].includes(a.id), note:'Có thể kích hoạt điều khoản loại trừ/thủy kích'},
      {q:'Người được bảo hiểm là chính chủ?', a:'Có — chính chủ', flag:false}
    ];
    if(a.uw){
      a.uw.officer = a.uw.officer || (a.id==='APP-2026-105'?'Nguyễn Thị Thẩm':'Trần Quốc UW');
      a.uw.note = a.uw.note || (a.uw.decision==='APPROVED_WITH_LOADING'?'Tăng phí do lịch sử claim; cần khách xác nhận phí mới.': a.uw.decision==='APPROVED_WITH_EXCLUSION'?'Áp điều khoản loại trừ theo khu vực/nguy cơ.': a.uw.decision==='REJECTED'?'Ngoài khẩu vị nhận bảo hiểm.':'Yêu cầu đạt điều kiện phát hành tiêu chuẩn.');
    }
  });
  // Hợp đồng phát hành TỪ một yêu cầu → phí hợp đồng, số tiền đã thu và lịch sử thu phí
  // phải BẰNG phí cuối của chính yêu cầu đó. Trước đây phí seed viết tay nên đầu trang
  // (phí bảo hiểm) lệch với breakdown rating lấy từ yêu cầu nguồn.
  (BANCA.policies||[]).forEach(function(p){
    if(!p.appId) return;
    const a=(BANCA.applications||[]).find(function(x){return x.id===p.appId;});
    if(!a) return;
    const finalPremium = (a.uw && a.uw.newPremium) || a.premium;
    if(!finalPremium) return;
    p.premium = finalPremium;
    if(p.payment) p.payment.amount = finalPremium;
    const bills = p.billing||[];
    if(bills.length===1) bills[0].amount = finalPremium;
  });

  const app103=BANCA.appById&&BANCA.appById('APP-2026-103');
  if(app103){
    app103.mortgage={mortgaged:true,lenderType:'Ngân hàng',bank:'Vietcombank',branch:'CN Tân Định',creditContract:'VCB-LOAN-2026-4431'};
    app103.vehicle.vin=app103.vehicle.vin||'RLHVCB2026DEMO103';
    app103.vehicle.engineNo=app103.vehicle.engineNo||'EG12345X';
    app103.vehicle.seats=5;
  }
})();
