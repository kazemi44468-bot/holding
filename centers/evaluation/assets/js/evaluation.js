(function(){
'use strict';
const SCOPE='holding:evaluation:020304';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const page=document.body.dataset.page||'overview';
let records=[],assessors=[];
const units=['شرکت راهبردی زمین و ملک ایرانیان','شرکت زیست‌بوم هوشمند فناوری ایرانیان','معاونت راهبرد و برنامه‌ریزی','معاونت سرمایه انسانی','مرکز خدمات شهری'];
const domains=['سازمانی','کانون','عملکرد'];
const statuses=['در حال اجرا','تکمیل‌شده','نیازمند اقدام','ثبت اولیه'];
const demo=Array.from({length:36},(_,i)=>{
 const d=new Date();d.setMonth(d.getMonth()-(i%12));d.setDate(5+(i*7)%22);
 return {id:'DEMO-'+i,kind:'assessment-case',title:['ارزیابی بلوغ سازمانی','کانون شایستگی مدیران','ارزشیابی عملکرد دوره‌ای','ارزیابی فرایندهای کلیدی','کانون استعدادهای تخصصی','ارزیابی اثربخشی برنامه‌ها'][i%6],domain:domains[i%3],scope:units[(i*3+i%4)%units.length],status:statuses[(i*5+i%3)%4],score:58+((i*13)%39),createdAt:d.toISOString(),period:'۱۴۰۵',level:['نیازمند بهبود','قابل قبول','خوب','بسیار خوب'][i%4],sample:true};
});
const demoAssessors=[
 {id:'DA-1',kind:'assessor',title:'دکتر نرگس شریفی',role:'ارزیاب ارشد',specialty:'رهبری و شایستگی‌های مدیریتی',qualification:'تأییدشده',createdAt:'2026-09-18'},
 {id:'DA-2',kind:'assessor',title:'مهندس آرمان راد',role:'ارزیاب تخصصی',specialty:'فرایند و بهره‌وری سازمانی',qualification:'تأییدشده',createdAt:'2026-08-11'},
 {id:'DA-3',kind:'assessor',title:'دکتر مریم بهرامی',role:'ناظر کانون',specialty:'ارزشیابی عملکرد و توسعه منابع انسانی',qualification:'در حال بررسی',createdAt:'2026-10-02'},
 {id:'DA-4',kind:'assessor',title:'مهندس سروش کیانی',role:'ارزیاب تخصصی',specialty:'فناوری و تحول دیجیتال',qualification:'تأییدشده',createdAt:'2026-07-23'}
];
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>{try{return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch(e){return '—'}};
function status(msg,bad=false){const el=$('#app-status');if(!el)return;el.textContent=msg;el.className='app-status '+(bad?'bad':'');el.hidden=false;}
async function load(){
 try{
  if(window.HoldingLocalDataVault){const all=await HoldingLocalDataVault.all(SCOPE);records=all.filter(x=>x.kind==='assessment-case');assessors=all.filter(x=>x.kind==='assessor');}
  else{const all=JSON.parse(localStorage.getItem(SCOPE)||'[]');records=all.filter(x=>x.kind==='assessment-case');assessors=all.filter(x=>x.kind==='assessor');}
 }catch(e){records=[];assessors=[];status('بازیابی داده‌های محلی با خطا مواجه شد: '+e.message,true);}
 render();
}
async function persist(item){
 if(window.HoldingLocalDataVault) await HoldingLocalDataVault.put(SCOPE,item);
 else{const all=JSON.parse(localStorage.getItem(SCOPE)||'[]');localStorage.setItem(SCOPE,JSON.stringify([...all.filter(x=>x.id!==item.id),item]));}
 if(item.kind==='assessor')assessors=[...assessors.filter(x=>x.id!==item.id),item];
 else records=[...records.filter(x=>x.id!==item.id),item];
}
function filtered(){
 const p=$('#filter-period')?.value||'12',domain=$('#filter-domain')?.value||'all',unit=$('#filter-unit')?.value||'all';
 const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-Number(p));
 return [...demo,...records].filter(x=>new Date(x.createdAt)>=cutoff&&(domain==='all'||x.domain===domain)&&(unit==='all'||x.scope===unit));
}
function stat(id,n){const el=$('#'+id);if(el)el.textContent=fa(n);}
function render(){
 const data=filtered(),all=[...demo,...records];
 stat('metric-total',data.length);stat('metric-org',data.filter(x=>x.domain==='سازمانی').length);stat('metric-center',data.filter(x=>x.domain==='کانون').length);stat('metric-perf',data.filter(x=>x.domain==='عملکرد').length);stat('metric-assessors',demoAssessors.length+assessors.length);
 stat('recent-count',all.length);
 renderCharts(data);
 renderTables(all);
}
function renderTables(all){
 const body=$('#case-rows');
 if(body){const sorted=all.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));body.innerHTML=sorted.slice(0,9).map(x=>'<tr><td>'+esc(x.title)+(x.sample?' <small class="sample-label">نمونه</small>':'')+'</td><td>'+esc(x.domain)+'</td><td>'+esc(x.scope)+'</td><td><span class="tag">'+esc(x.status)+'</span></td><td>'+fmtDate(x.createdAt)+'</td></tr>').join('');}
 const ab=$('#assessor-rows');
 if(ab){const people=[...demoAssessors,...assessors];ab.innerHTML=people.map(x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(x.role)+'</td><td>'+esc(x.specialty)+'</td><td><span class="tag">'+esc(x.qualification)+'</span></td><td>'+fmtDate(x.createdAt)+'</td></tr>').join('');}
}
const colors=['#2e8191','#b99568','#82729c','#d17e69','#6c9c80'];
function horizontalBars(data){
 const names=['سازمانی','کانون','عملکرد'],counts=names.map(n=>data.filter(x=>x.domain===n).length),max=Math.max(1,...counts);
 return '<div class="chart-bars">'+names.map((n,i)=>'<div class="chart-bar-row"><span>'+n+'</span><div class="chart-bar-track"><span style="width:'+(counts[i]/max*100)+'%;background:'+colors[i]+'"></span></div><b>'+fa(counts[i])+'</b></div>').join('')+'</div>';
}
function verticalBars(data){
 const names=['سازمانی','کانون','عملکرد'],counts=names.map(n=>data.filter(x=>x.domain===n).length),max=Math.max(1,...counts);
 return '<div class="vertical-bars">'+names.map((n,i)=>'<div class="vbar"><b>'+fa(counts[i])+'</b><i style="height:'+Math.max(5,counts[i]/max*100)+'%;background:'+colors[i]+'"></i><span>'+n+'</span></div>').join('')+'</div>';
}
function donut(data,key,labels){
 const nums=labels.map(l=>data.filter(x=>x[key]===l).length),total=nums.reduce((a,b)=>a+b,0)||1;let angle=0;
 const stops=nums.map((n,i)=>{const start=angle;angle+=n/total*100;return colors[i]+' '+start+'% '+angle+'%'}).join(',');
 return '<div class="donut-wrap"><div class="donut" style="background:conic-gradient('+stops+')"><div class="donut-center"><strong>'+fa(data.length)+'</strong><small>پرونده</small></div></div><div class="chart-legend">'+labels.map((l,i)=>'<div class="legend-item"><i class="legend-dot" style="background:'+colors[i]+'"></i>'+l+' · '+fa(nums[i])+'</div>').join('')+'</div></div>';
}
function trend(data){
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({label:new Intl.DateTimeFormat('fa-IR',{month:'short'}).format(d),m:d.getMonth(),y:d.getFullYear()});}
 const vals=months.map(m=>{const arr=data.filter(x=>{const d=new Date(x.createdAt);return d.getMonth()===m.m&&d.getFullYear()===m.y&&Number(x.score)>0});return arr.length?Math.round(arr.reduce((a,b)=>a+Number(b.score),0)/arr.length):0});
 const max=100,min=0,w=560,h=170,p=28;const pts=vals.map((v,i)=>[p+i*(w-2*p)/(vals.length-1),h-p-(v-min)/(max-min)*(h-2*p)]);
 const poly=pts.map(x=>x.join(',')).join(' ');
 return '<svg class="trend-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="روند امتیاز میانگین"><line x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'" stroke="#dce5eb"/><line x1="'+p+'" y1="'+(h/2)+'" x2="'+(w-p)+'" y2="'+(h/2)+'" stroke="#edf1f4" stroke-dasharray="4 4"/><polyline points="'+poly+'" fill="none" stroke="#2e8191" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map((pt,i)=>'<circle cx="'+pt[0]+'" cy="'+pt[1]+'" r="4" fill="#b99568"/><text x="'+pt[0]+'" y="'+(pt[1]-9)+'" text-anchor="middle">'+(vals[i]?fa(vals[i]):'—')+'</text><text x="'+pt[0]+'" y="'+(h-4)+'" text-anchor="middle">'+months[i].label+'</text>').join('')+'</svg>';
}
function renderCharts(data){
 const bars=horizontalBars(data),vbars=verticalBars(data),statusChart=donut(data,'status',['در حال اجرا','تکمیل‌شده','نیازمند اقدام','ثبت اولیه']),levelChart=donut(data,'level',['نیازمند بهبود','قابل قبول','خوب','بسیار خوب']);
 ['domain-bars','report-domain-bars'].forEach(id=>{const el=$('#'+id);if(el)el.innerHTML=bars;});
 ['status-donut','report-status-donut'].forEach(id=>{const el=$('#'+id);if(el)el.innerHTML=statusChart;});
 ['score-trend','report-score-trend'].forEach(id=>{const el=$('#'+id);if(el)el.innerHTML=trend(data);});
 ['level-donut','report-level-donut'].forEach(id=>{const el=$('#'+id);if(el)el.innerHTML=levelChart;});
 const v=$('#domain-vertical-bars');if(v)v.innerHTML=vbars;
}
$('#case-form')?.addEventListener('submit',async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 const item={id:'EVCASE-'+Date.now(),kind:'assessment-case',title:String(f.get('title')||'').trim(),domain:f.get('domain'),scope:String(f.get('scope')||'').trim(),status:f.get('status'),period:f.get('period'),description:String(f.get('description')||'').trim(),createdAt:new Date().toISOString(),score:0};
 try{await persist(item);render();e.currentTarget.reset();status('پرونده ارزیابی ثبت شد.')}catch(err){status('ثبت پرونده ناموفق بود: '+err.message,true);}
});
$('#assessor-form')?.addEventListener('submit',async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 const item={id:'EVASSESSOR-'+Date.now(),kind:'assessor',title:String(f.get('name')||'').trim(),role:f.get('role'),specialty:String(f.get('specialty')||'').trim(),qualification:f.get('qualification'),createdAt:new Date().toISOString()};
 try{await persist(item);render();e.currentTarget.reset();status('اطلاعات ارزیاب ثبت شد.')}catch(err){status('ثبت ارزیاب ناموفق بود: '+err.message,true);}
});
$('#backup-export')?.addEventListener('click',async()=>{
 try{let payload;if(window.HoldingLocalDataVault)payload=await HoldingLocalDataVault.exportData(SCOPE);else payload={format:'holding-evaluation-export',exportedAt:new Date().toISOString(),records:[...records,...assessors]};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='evaluation-center-backup.json';a.click();URL.revokeObjectURL(a.href);status('فایل پشتیبان آماده شد.')}catch(e){status('تهیه پشتیبان ناموفق بود: '+e.message,true);}
});
$('#backup-import')?.addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data.records)?data.records:[];for(const item of incoming)await persist(item);render();status(fa(incoming.length)+' رکورد بازیابی شد.');}catch(err){status('بازیابی ناموفق: '+err.message,true);}e.target.value='';
});
$$('[data-view]').forEach(a=>{a.addEventListener('click',()=>{const menu=$('.nav-group');if(menu)menu.removeAttribute('open');});});

$('#backTop')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
$$('#filter-period,#filter-domain,#filter-unit').forEach(el=>el.addEventListener('change',render));
load();
})();