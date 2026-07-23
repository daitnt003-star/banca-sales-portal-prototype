// Customer context snapshot — Portal KHÔNG quản lý Customer Master.
// scope: PORTFOLIO | ASSIGNED | CONTEXT_GRANTED | PROSPECT (khách mới do seller tạo)
window.BANCA = window.BANCA || {};
BANCA.customers = [
  {id:'CUS-001', cif:'JB0012345', name:'Lê Hoàng Nam',    dob:'1985-04-12', phone:'0905121234', email:'nam.le@example.com',   segment:'Priority', idNumber:'079085004321', address:'12 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM', branch:'HCM01', ownerRM:'RM-01', scope:{'RM-01':'PORTFOLIO'}, loanRef:'LN-2024-8891 (Vay mua ô tô 720tr)', existingInsurance:['Nhân thọ Janus Life']},
  {id:'CUS-002', cif:'JB0023456', name:'Phạm Thu Hà',     dob:'1990-09-30', phone:'0915435678', email:'ha.pham@example.com',  segment:'Mass', idNumber:'079095006666', address:'45 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM', branch:'HCM01', ownerRM:'RM-01', scope:{'RM-01':'PORTFOLIO'}, loanRef:null, existingInsurance:[]},
  {id:'CUS-003', cif:'JB0034567', name:'Võ Minh Trí',     dob:'1978-01-22', phone:'0935439012', email:'tri.vo@example.com',   segment:'Priority', idNumber:'001078009999', address:'21 Trần Duy Hưng, Cầu Giấy, Hà Nội', branch:'HCM02', ownerRM:'RM-02', scope:{'RM-02':'PORTFOLIO','RM-01':'CONTEXT_GRANTED'}, loanRef:'LN-2025-1102 (Vay thế chấp nhà)', existingInsurance:[]},
  {id:'CUS-004', cif:'JB0045678', name:'Đặng Kim Oanh',   dob:'1995-07-15', phone:'0945433456', email:'oanh.dang@example.com',segment:'Mass',      branch:'HCM01', ownerRM:'RM-01', scope:{'RM-01':'PORTFOLIO'}, loanRef:'LN-2025-3320 (Vay mua ô tô 540tr)', existingInsurance:[]},
  {id:'CUS-005', cif:'JB0056789', name:'Bùi Văn Sơn',     dob:'1982-11-03', phone:'0975437890', email:'son.bui@example.com',  segment:'Mass', idNumber:'079082007777', address:'17 Nguyễn Văn Cừ, Q.5, TP.HCM', branch:'HCM02', ownerRM:'RM-02', scope:{'RM-02':'PORTFOLIO'}, loanRef:null, existingInsurance:['Motor TNDS (hết hạn 08/2026)']},
  {id:'CUS-006', cif:null,        name:'Ngô Thanh Tùng',  dob:'1993-02-18', phone:'0985432244', email:'tung.ngo@example.com', segment:'Prospect', idNumber:'079098001111', address:'Chưa xác minh — prospect', branch:null,    ownerRM:'RM-01', scope:{'RM-01':'PROSPECT'}, loanRef:null, existingInsurance:[]},
  {id:'CUS-007', cif:'JB0067890', name:'Trịnh Mỹ Linh',   dob:'1988-06-25', phone:'0965438899', email:'linh.trinh@example.com',segment:'Priority', idNumber:'079088003333', address:'99 Pasteur, Q.3, TP.HCM', branch:'HCM01', ownerRM:'RM-01', scope:{'RM-01':'PORTFOLIO','TS-01':'ASSIGNED'}, loanRef:null, existingInsurance:[]},
  {id:'CUS-008', cif:'JB0078901', name:'Hoàng Đức Long',  dob:'1975-12-08', phone:'0925435511', email:'long.hoang@example.com',segment:'Mass', idNumber:'079075002222', address:'Tân Bình, TP.HCM', branch:'CALL',  ownerRM:'TS-01', scope:{'TS-01':'ASSIGNED'}, loanRef:'LN-2025-4471 (Vay tiêu dùng)', existingInsurance:[]},
  {id:'CUS-009', cif:null,        name:'Mai Xuân Phúc',   dob:'1998-03-11', phone:'0905436677', email:'phuc.mai@example.com', segment:'Prospect',  branch:null,    ownerRM:'RM-02', scope:{'RM-02':'PROSPECT'}, loanRef:null, existingInsurance:[]},
  {id:'CUS-010', cif:'JB0089012', name:'Lý Thu Trang',    dob:'1991-08-19', phone:'0955433322', email:'trang.ly@example.com', segment:'Priority',  branch:'HCM01', ownerRM:'RM-01', scope:{'RM-01':'SERVICING'}, loanRef:null, existingInsurance:['Motor Comprehensive JB-POL-2025-0102']}
];
BANCA.customerById = id => BANCA.customers.find(c=>c.id===id);
// Danh sách khách trong scope của persona hiện tại (không cho search toàn hàng)
BANCA.myCustomers = (p = BANCA.current()) => BANCA.customers.filter(c => c.scope[p]);
