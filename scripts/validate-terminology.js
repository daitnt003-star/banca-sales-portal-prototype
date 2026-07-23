#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_ROOTS = ['modules', 'shared'];

const forbidden = [
  ['Bắt đầu bán bảo hiểm', 'Tạo yêu cầu bảo hiểm'],
  ['Bắt đầu bán hàng', 'Tạo yêu cầu bảo hiểm'],
  ['Yêu cầu chưa gửi', 'Yêu cầu bảo hiểm chưa nộp'],
  ['Yêu cầu đã gửi', 'Yêu cầu bảo hiểm đã nộp'],
  ['Hồ sơ chưa gửi', 'Yêu cầu bảo hiểm chưa nộp'],
  ['Hồ sơ đã gửi', 'Yêu cầu bảo hiểm đã nộp'],
  ['Danh sách hồ sơ chưa nộp', 'Danh sách yêu cầu bảo hiểm chưa nộp'],
  ['Mã hồ sơ', 'Mã yêu cầu'],
  ['Submit', 'Nộp yêu cầu bảo hiểm'],
  ['Submitted', 'Đã nộp'],
  ['Payment option', 'Cách thanh toán'],
  ['Seller-assisted', 'Hỗ trợ khách thanh toán trên thiết bị này'],
  ['Approved STP', 'Đã chấp thuận tự động'],
  ['UW pending', 'Chờ thẩm định'],
  ['Policy issued', 'Hợp đồng đã phát hành'],
  ['Tạo hồ sơ mới', 'Tạo yêu cầu bảo hiểm'],
  ['Lập yêu cầu mới', 'Tạo yêu cầu bảo hiểm'],
  ['Tiếp tục hồ sơ', 'Tiếp tục yêu cầu'],
  ['Xem hồ sơ', 'Xem yêu cầu'],
  ['Mở hồ sơ', 'Mở yêu cầu'],
  ['Chuyển sang bán hàng', 'Tạo yêu cầu bảo hiểm từ tư vấn này'],
  ['Đối tượng bán', 'Đối tượng bảo hiểm'],
  ['Người bán', 'Nhân viên phụ trách'],
  ['Application', 'Yêu cầu bảo hiểm'],
  ['Case', 'Yêu cầu'],
  ['Seller', 'Nhân viên tư vấn'],
  ['undefined', '—'],
  ['null', '—']
];

function walk(dir, out = []){
  for(const ent of fs.readdirSync(dir, {withFileTypes:true})){
    if(['node_modules','build','dist','.git'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if(ent.isDirectory()) walk(p, out);
    else if(/\.(html|js|json)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function stripComments(s){
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function isTechnicalLine(line, text){
  if(text === 'undefined') return /undefined|sumInsured|riskAnswers|Object\.assign/.test(line);
  if(text === 'null') return /null|localStorage|JSON|==|!=|:\s*null|\|\|null|\?null|return null|targetSeller|caseId|paymentUrl/.test(line);
  if(text === 'Application') return /owns|ApplicationRoutingResult|Application Draft|applicationId|app-manifest|externalCaseId/.test(line);
  if(text === 'Case') return /caseId|caseOwner|SalesCase|deriveCaseViewState|isReadonlyCase|caseMutability|externalCaseId|Case State|Case meta|caseMeta/.test(line);
  if(text === 'Seller') return /targetSeller|servicingSeller|sellingProducer|sellerId|Seller code|Support Seller|handoffsForSeller|Sellers trong scope/.test(line);
  return false;
}

function hasForbidden(line, text){
  if(['Application','Case','Seller','Submit','Submitted','undefined','null'].includes(text)){
    return new RegExp(`(^|[^A-Za-z0-9_])${text}([^A-Za-z0-9_]|$)`).test(line);
  }
  return line.includes(text);
}

const files = SCAN_ROOTS.flatMap(r => walk(path.join(ROOT, r)));
const issues = [];

for(const file of files){
  const rel = path.relative(ROOT, file);
  const cleaned = stripComments(fs.readFileSync(file, 'utf8'));
  const lines = cleaned.split(/\r?\n/);
  lines.forEach((line, idx) => {
    forbidden.forEach(([text, expected]) => {
      if(!hasForbidden(line, text)) return;
      if(isTechnicalLine(line, text)) return;
      issues.push({file: rel, line: idx + 1, text, expected});
    });
  });
}

if(issues.length){
  console.log(`TERMINOLOGY VALIDATION FAIL: ${issues.length} issue(s)`);
  issues.forEach(i => {
    console.log(`INVALID_TERMINOLOGY ${JSON.stringify(i)}`);
  });
  process.exit(1);
}

console.log(`TERMINOLOGY VALIDATION PASS: scanned ${files.length} files`);
