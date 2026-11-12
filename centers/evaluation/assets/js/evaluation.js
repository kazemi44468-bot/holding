(function(){
'use strict';
const SCOPE='holding:evaluation:020304';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const page=document.body.dataset.page||'overview';
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>{try{return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v))}catch(e){return '—'}};
const registry=window.HOLDING_ORG_REGISTRY||{};
const deputies=(registry.deputies||[]).slice().sort((a,b)=>a.sequence-b.sequence);
const companies=registry.companies||[];
const branches=registry.provincial_branch_managements||[];
const scopes=[
 {id:'HOLDING',label:'ستاد هلدینگ',type:'ستاد هلدینگ',status:'confirmed'},
 ...deputies.map(x=>({id:x.organization_id,label:x.label,type:'معاونت',status:x.status})),
 ...companies.map(x=>({id:x.organization_id,label:x.name,type:'شرکت تابعه',status:x.status})),
 ...branches.map(x=>({id:x.organization_id,label:'مدیریت شعب استانی '+fa(x.sequence),type:'مدیریت شعب استانی',status:x.status}))
];
const scopeById=id=>scopes.find(x=>x.id===id)||{id,label:'سایر / فاقد انتساب قطعی',type:'سایر',status:'pending'};
const domainLabels=['سازمانی','کانون','عملکرد','برنامه و پروژه','خدمت و فرایند'];
const statusLabels=['در حال اجرا','تکمیل‌شده','نیازمند اقدام','ثبت اولیه'];
const titleSets={
 'سازمانی':['ارزیابی بلوغ سازمانی','ارزیابی ساختار و حکمرانی','ارزیابی فرایندهای کلیدی','ارزیابی بهره‌وری منابع','ارزیابی مدیریت ریسک','ارزیابی ظرفیت و قابلیت سازمان'],
 'کانون':['کانون شایستگی مدیران','کانون استعدادهای مدیریتی','کانون شایستگی تخصصی','ارزیابی آمادگی نقش کلیدی','کانون توسعه سرپرستان'],
 'عملکرد':['ارزشیابی عملکرد دوره‌ای','ارزیابی تحقق اهداف فردی','ارزشیابی عملکرد مدیران','ارزیابی کیفیت نتایج و رفتار حرفه‌ای'],
 'برنامه و پروژه':['ارزیابی پیشرفت برنامه راهبردی','ارزیابی اثربخشی پروژه','ارزیابی تحقق منافع پروژه','ارزیابی کیفیت تحویل‌دادنی‌ها'],
 'خدمت و فرایند':['ارزیابی کیفیت خدمت','ارزیابی زمان چرخه فرایند','ارزیابی تجربه خدمت‌گیرنده','ارزیابی انطباق سطح خدمت']
};
const demo=Array.from({length:90},(_,i)=>{
 const domain=domainLabels[i%domainLabels.length],scope=scopes[(i*7+Math.floor(i/5))%Math.max(1,scopes.length)]||{id:'HOLDING',label:'ستاد هلدینگ',type:'هلدینگ'};
 const d=new Date();d.setMonth(d.getMonth()-(i%12));d.setDate(3+(i*11)%25);
 const score=56+((i*17+9)%42);
 return {id:'DEMO-EV-'+String(i+1).padStart(3,'0'),kind:'assessment-case',title:titleSets[domain][i%titleSets[domain].length],domain,scope:scope.id,scopeLabel:scope.label,scopeType:scope.type,status:statusLabels[(i*5+Math.floor(i/3))%4],score,createdAt:d.toISOString(),period:'۱۴۰۵',level:score>=90?'بسیار خوب':score>=80?'خوب':score>=70?'قابل قبول':'نیازمند بهبود',evidence:['گزارش عملکرد و شاخص‌های مصوب','مصاحبه ساختاریافته و مستندات پشتیبان','مشاهده فرایند و نمونه خروجی','تحلیل روند و مقایسه با هدف'][i%4],assessorId:'EV-A-'+String(i%8+1).padStart(2,'0'),sample:true};
});
const competencyDimensions=[
 {name:'رهبری و راهبری',items:[['جهت‌دهی و تبیین چشم‌انداز','تبدیل جهت‌گیری کلان به اولویت‌های روشن و قابل فهم'],['تصمیم‌گیری در ابهام','سنجش گزینه‌ها، ریسک‌ها و پیامدها پیش از انتخاب'],['تفویض و توانمندسازی','واگذاری اختیار متناسب و ایجاد پاسخ‌گویی'],['توسعه افراد','بازخورد سازنده، مربی‌گری و آماده‌سازی جانشین']]},
 {name:'تفکر و حل مسئله',items:[['تفکر راهبردی و سیستمی','درک ارتباط اجزا، پیامدهای بلندمدت و منافع کلان'],['تحلیل داده و شواهد','استفاده از داده معتبر و تفکیک واقعیت از برداشت'],['حل مسئله ریشه‌ای','تشخیص علت اصلی و طراحی راه‌حل پایدار']]},
 {name:'اجرا و نتیجه‌گرایی',items:[['برنامه‌ریزی و اولویت‌بندی','تبدیل هدف به برنامه، منابع، مسئول و موعد'],['مدیریت عملکرد','پایش شاخص‌ها و اصلاح به‌موقع انحراف'],['مدیریت منابع و بهره‌وری','استفاده مؤثر از منابع و کنترل دوباره‌کاری']]},
 {name:'ارتباط و همکاری',items:[['ارتباط مؤثر و اقناع','انتقال روشن پیام و دفاع مستدل از پیشنهاد'],['مذاکره و مدیریت تعارض','شنیدن دیدگاه‌ها و دستیابی به توافق عملی'],['همکاری بین‌بخشی','هم‌افزایی با واحدها و مدیریت وابستگی‌ها']]},
 {name:'تحول و حرفه‌گرایی',items:[['رهبری تغییر و نوآوری','مدیریت مقاومت و تبدیل ایده به تغییر اجرایی'],['یادگیری و سازگاری','بازنگری دیدگاه و یادگیری از بازخورد'],['اخلاق و مسئولیت‌پذیری','امانت‌داری، انصاف، محرمانگی و اعلام تعارض منافع']]}
];
const profiles=[
 {id:'EV-P-001',name:'مدیر نمونه ۰۱',role:'مدیر ارشد / نقش راهبری',scope:scopes[0]?.label||'معاونت اول',date:'۱۴۰۵/۰۸/۱۲',overall:84,readiness:'آماده با برنامه توسعه',strengths:'جهت‌دهی، تحلیل داده و تصمیم‌گیری در شرایط پیچیده',gaps:'تفویض نظام‌مند و توسعه جانشین',recommendation:'واگذاری مسئولیت بین‌بخشی و برنامه مربی‌گری شش‌ماهه'},
 {id:'EV-P-002',name:'مدیر نمونه ۰۲',role:'مدیر میانی / نقش عملیاتی',scope:scopes[1]?.label||'معاونت دوم',date:'۱۴۰۵/۰۸/۰۹',overall:76,readiness:'آماده پس از تکمیل توسعه',strengths:'برنامه‌ریزی، پیگیری و ارتباط حرفه‌ای',gaps:'تفکر سیستمی و تحلیل ریشه‌ای مسئله',recommendation:'مشارکت در پروژه بهبود و کارگاه تحلیل مسئله'},
 {id:'EV-P-003',name:'نامزد نمونه ۰۳',role:'نامزد جانشینی / نقش تخصصی',scope:scopes[2]?.label||'معاونت سوم',date:'۱۴۰۵/۰۷/۲۸',overall:71,readiness:'نیازمند ارزیابی تکمیلی',strengths:'دانش تخصصی، یادگیری و مسئولیت‌پذیری',gaps:'نفوذ حرفه‌ای و مدیریت تعارض',recommendation:'تمرین مذاکره، ارائه مدیریتی و ارزیابی مجدد'},
 {id:'EV-P-004',name:'کارشناس نمونه ۰۴',role:'کارشناس ارشد / نقش تخصصی',scope:scopes[3]?.label||'معاونت چهارم',date:'۱۴۰۵/۰۷/۲۱',overall:89,readiness:'آماده توسعه به نقش بالاتر',strengths:'حل مسئله، کیفیت اجرا و همکاری',gaps:'تجربه محدود در مدیریت منابع',recommendation:'سرپرستی یک بسته کاری و همراهی با مدیر باتجربه'}
];
const profilesWithScores=profiles.map((p,pi)=>({...p,competencies:competencyDimensions.map((d,di)=>({...d,items:d.items.map((it,ii)=>({name:it[0],definition:it[1],score:Math.max(48,Math.min(98,p.overall+(((pi+2)*(di+3)*(ii+1))%17)-8)),evidence:['در تمرین سبد کاری، اولویت‌ها را با توجه به فوریت و اثر سازمانی تفکیک کرد.','در مصاحبه رفتاری، نمونه‌ای روشن از اقدام و نتیجه ارائه داد.','در مطالعه موردی، داده‌های ناقص را شناسایی و فرض‌ها را شفاف کرد.'][((pi+di+ii)%3)]}))}))}));
const demoAssessors=[
 {id:'EV-A-01',name:'دکتر نرگس شریفی',role:'ارزیاب ارشد و سرارزیاب',specialty:'رهبری، شایستگی‌های مدیریتی و جانشین‌پروری',education:'دکتری مدیریت منابع انسانی',experience:'۱۸ سال',qualification:'تأییدشده',level:'ارزیاب ارشد',training:'کالیبراسیون و مصاحبه رفتاری · ۱۴۰۵/۰۶',scope:'هلدینگ و معاونت‌ها',contact:'شناسه شبکه EV-A-01',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:12},
 {id:'EV-A-02',name:'مهندس آرمان راد',role:'ارزیاب تخصصی سازمان',specialty:'طراحی سازمان، فرایند و بهره‌وری',education:'کارشناسی ارشد مهندسی صنایع',experience:'۱۵ سال',qualification:'تأییدشده',level:'ارزیاب تخصصی',training:'ممیزی فرایند و تحلیل شواهد · ۱۴۰۵/۰۵',scope:'شرکت‌ها و واحدهای عملیاتی',contact:'شناسه شبکه EV-A-02',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:9},
 {id:'EV-A-03',name:'دکتر مریم بهرامی',role:'ناظر کانون و ارزیاب',specialty:'ارزشیابی عملکرد، مصاحبه و بازخورد توسعه‌ای',education:'دکتری روان‌شناسی صنعتی و سازمانی',experience:'۱۴ سال',qualification:'تأییدشده',level:'ناظر کانون',training:'طراحی تمرین و تلفیق شواهد · ۱۴۰۵/۰۷',scope:'کانون مدیران و کارشناسان',contact:'شناسه شبکه EV-A-03',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:11},
 {id:'EV-A-04',name:'مهندس سروش کیانی',role:'ارزیاب فناوری و تحول',specialty:'فناوری اطلاعات، تحول دیجیتال و بلوغ داده',education:'کارشناسی ارشد فناوری اطلاعات',experience:'۱۲ سال',qualification:'تأییدشده',level:'ارزیاب تخصصی',training:'ارزیابی بلوغ دیجیتال · ۱۴۰۵/۰۴',scope:'حوزه فناوری و شرکت‌های تابعه',contact:'شناسه شبکه EV-A-04',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:8},
 {id:'EV-A-05',name:'دکتر پیمان فرهمند',role:'ارزیاب برنامه و پروژه',specialty:'مدیریت پروژه، ریسک و تحقق منافع',education:'دکتری مدیریت پروژه',experience:'۱۶ سال',qualification:'تأییدشده',level:'ارزیاب ارشد',training:'ارزیابی منافع و کنترل پروژه · ۱۴۰۵/۰۶',scope:'پروژه‌ها و برنامه‌های هلدینگ',contact:'شناسه شبکه EV-A-05',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:10},
 {id:'EV-A-06',name:'مهندس الهام صادقی',role:'ارزیاب کیفیت خدمات',specialty:'کیفیت خدمت، تجربه مخاطب و شاخص‌های SLA',education:'کارشناسی ارشد مدیریت کیفیت',experience:'۱۱ سال',qualification:'تأییدشده',level:'ارزیاب تخصصی',training:'طراحی شاخص خدمت و تحلیل شکایت · ۱۴۰۵/۰۵',scope:'خدمات و فرایندهای مشترک',contact:'شناسه شبکه EV-A-06',conflict:'اظهارنامه تعارض منافع ثبت شده',assigned:7},
 {id:'EV-A-07',name:'دکتر سارا نیک‌پی',role:'ارزیاب رفتار سازمانی',specialty:'توسعه شایستگی، تیم‌سازی و مدیریت تغییر',education:'دکتری مدیریت رفتار سازمانی',experience:'۱۳ سال',qualification:'در حال بررسی',level:'ارزیاب همکار',training:'دوره پایه کانون ارزیابی · ۱۴۰۵/۰۸',scope:'کانون‌های تخصصی',contact:'شناسه شبکه EV-A-07',conflict:'در انتظار تکمیل اظهارنامه',assigned:3},
 {id:'EV-A-08',name:'مهندس کیوان دادگر',role:'ارزیاب عملکرد و بهره‌وری',specialty:'شاخص‌های عملکرد، بهره‌وری و تحلیل داده',education:'کارشناسی ارشد مدیریت صنعتی',experience:'۱۰ سال',qualification:'نیازمند بازآموزی',level:'ارزیاب همکار',training:'بازآموزی کالیبراسیون در برنامه',scope:'عملکرد فردی و سازمانی',contact:'شناسه شبکه EV-A-08',conflict:'اظهارنامه نیازمند بازبینی',assigned:2}
];
let records=[],assessors=[];
function status(msg,bad=false){const el=$('#app-status');if(!el)return;el.textContent=msg;el.className='app-status '+(bad?'bad':'');el.hidden=false;}
async function load(){
 try{if(window.HoldingLocalDataVault){const all=await HoldingLocalDataVault.all(SCOPE);records=all.filter(x=>x.kind==='assessment-case');assessors=all.filter(x=>x.kind==='assessor');}
 else{const all=JSON.parse(localStorage.getItem(SCOPE)||'[]');records=all.filter(x=>x.kind==='assessment-case');assessors=all.filter(x=>x.kind==='assessor');}}
 catch(e){records=[];assessors=[];status('بازیابی داده‌های محلی با خطا مواجه شد: '+e.message,true);}
 populateScopeFilters();render();
}
async function persist(item){
 if(window.HoldingLocalDataVault)await HoldingLocalDataVault.put(SCOPE,item);
 else{const all=JSON.parse(localStorage.getItem(SCOPE)||'[]');localStorage.setItem(SCOPE,JSON.stringify([...all.filter(x=>x.id!==item.id),item]));}
 if(item.kind==='assessor')assessors=[...assessors.filter(x=>x.id!==item.id),item];else records=[...records.filter(x=>x.id!==item.id),item];
}
function populateScopeFilters(){
 $$('#filter-unit').forEach(sel=>{const chosen=sel.value;sel.innerHTML='<option value="all">کل هلدینگ</option><option value="HOLDING">ستاد هلدینگ</option>'+deputies.map(x=>'<option value="'+esc(x.organization_id)+'">'+esc(x.label)+'</option>').join('')+(companies.length?'<optgroup label="شرکت‌های تابعه">'+companies.map(x=>'<option value="'+esc(x.organization_id)+'">'+esc(x.name)+'</option>').join('')+'</optgroup>':'')+(branches.length?'<optgroup label="مدیریت شعب استانی">'+branches.map(x=>'<option value="'+esc(x.organization_id)+'">مدیریت شعب استانی '+fa(x.sequence)+'</option>').join('')+'</optgroup>':'')+'<option value="unassigned">سایر / فاقد انتساب قطعی</option>';if([...sel.options].some(o=>o.value===chosen))sel.value=chosen;});
}
function filtered(){
 const p=$('#filter-period')?.value||'12',domain=$('#filter-domain')?.value||'all',unit=$('#filter-unit')?.value||'all';
 const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-Number(p));
 return [...demo,...records].filter(x=>new Date(x.createdAt)>=cutoff&&(domain==='all'||x.domain===domain)&&(unit==='all'||x.scope===unit||(unit==='unassigned'&&!x.scope)));
}
function stat(id,n){const el=$('#'+id);if(el)el.textContent=fa(n);}
function render(){
 const data=filtered(),all=[...demo,...records],people=[...demoAssessors,...assessors];
 stat('metric-total',data.length);stat('metric-org',data.filter(x=>x.domain==='سازمانی').length);stat('metric-center',data.filter(x=>x.domain==='کانون').length);stat('metric-perf',data.filter(x=>x.domain==='عملکرد').length);stat('metric-assessors',people.length);stat('recent-count',all.length);
 renderCharts(data);renderTables(all,people);renderOrganizationMap(data);renderAssessorProfiles();
}
function renderTables(all,people){
 const body=$('#case-rows');if(body){const sorted=all.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));body.innerHTML=sorted.slice(0,12).map(x=>'<tr><td>'+esc(x.title)+(x.sample?' <small class="sample-label">نمونه</small>':'')+'</td><td>'+esc(x.domain)+'</td><td>'+esc(x.scopeLabel||scopeById(x.scope).label)+'</td><td><span class="tag">'+esc(x.status)+'</span></td><td>'+fmtDate(x.createdAt)+'</td></tr>').join('');}
 const ab=$('#assessor-rows');if(ab){ab.innerHTML=people.map(x=>'<tr><td>'+esc(x.name||x.title)+'</td><td>'+esc(x.role)+'</td><td>'+esc(x.specialty)+'</td><td><span class="tag">'+esc(x.qualification)+'</span></td><td>'+esc(x.experience||'—')+'</td></tr>').join('');}
 const dr=$('#domain-record-rows');
 if(dr){
  let rows=all.slice();
  if(page==='organization')rows=rows.filter(x=>x.domain==='سازمانی');
  else if(page==='assessment')rows=rows.filter(x=>x.domain==='کانون');
  else if(page==='performance')rows=rows.filter(x=>x.domain==='عملکرد');
  else if(page==='programs')rows=rows.filter(x=>x.domain==='برنامه و پروژه');
  else if(page==='services')rows=rows.filter(x=>x.domain==='خدمت و فرایند');
  else if(page==='improvement')rows=rows.filter(x=>x.status==='نیازمند اقدام');
  else if(page==='standards')rows=rows.filter(x=>['سازمانی','کانون','عملکرد'].includes(x.domain));
  rows=rows.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,15);
  dr.innerHTML=rows.map(x=>'<tr><td>'+esc(x.id)+' <small class="sample-label">نمونه</small></td><td>'+esc(x.title)+'</td><td>'+esc(x.scopeLabel||scopeById(x.scope).label)+'</td><td>'+fa(x.score)+'</td><td><span class="tag">'+esc(x.status)+'</span></td><td>'+esc(x.evidence||'مستندات و شواهد پرونده')+'</td></tr>').join('')||'<tr><td colspan="6" class="empty-row">برای این حوزه در فیلتر انتخاب‌شده رکوردی وجود ندارد.</td></tr>';
 }
}
const colors=['#315f86','#b99568','#82729c','#d17e69','#6c9c80','#6e91a9'];
function horizontalBars(labels,values){const max=Math.max(1,...values);return '<div class="chart-bars">'+labels.map((n,i)=>'<div class="chart-bar-row"><span>'+esc(n)+'</span><div class="chart-bar-track"><span style="width:'+(values[i]/max*100)+'%;background:'+colors[i%colors.length]+'"></span></div><b>'+fa(values[i])+'</b></div>').join('')+'</div>';}
function verticalBars(labels,values){const max=Math.max(1,...values);return '<div class="vertical-bars">'+labels.map((n,i)=>'<div class="vbar"><b>'+fa(values[i])+'</b><i style="height:'+Math.max(5,values[i]/max*100)+'%;background:'+colors[i%colors.length]+'"></i><span>'+esc(n)+'</span></div>').join('')+'</div>';}
function donutCounts(labels,values){const total=values.reduce((a,b)=>a+b,0)||1;let angle=0;const stops=values.map((n,i)=>{const start=angle;angle+=n/total*100;return colors[i%colors.length]+' '+start+'% '+angle+'%'}).join(',');return '<div class="donut-wrap"><div class="donut" style="background:conic-gradient('+stops+')"><div class="donut-center"><strong>'+fa(values.reduce((a,b)=>a+b,0))+'</strong><small>مورد</small></div></div><div class="chart-legend">'+labels.map((l,i)=>'<div class="legend-item"><i class="legend-dot" style="background:'+colors[i%colors.length]+'"></i>'+esc(l)+' · '+fa(values[i])+'</div>').join('')+'</div></div>';}
function trend(data){
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({label:new Intl.DateTimeFormat('fa-IR',{month:'short'}).format(d),m:d.getMonth(),y:d.getFullYear()});}
 const vals=months.map(m=>{const a=data.filter(x=>{const d=new Date(x.createdAt);return d.getMonth()===m.m&&d.getFullYear()===m.y&&Number(x.score)>0});return a.length?Math.round(a.reduce((n,x)=>n+x.score,0)/a.length):0;});
 const w=560,h=170,p=28,pts=vals.map((v,i)=>[p+i*(w-2*p)/(vals.length-1),h-p-v/100*(h-2*p)]),poly=pts.map(x=>x.join(',')).join(' ');
 return '<svg class="trend-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="روند امتیاز میانگین"><line x1="'+p+'" y1="'+(h-p)+'" x2="'+(w-p)+'" y2="'+(h-p)+'" stroke="#dce5eb"/><line x1="'+p+'" y1="'+(h/2)+'" x2="'+(w-p)+'" y2="'+(h/2)+'" stroke="#edf1f4" stroke-dasharray="4 4"/><polyline points="'+poly+'" fill="none" stroke="#315f86" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map((pt,i)=>'<circle cx="'+pt[0]+'" cy="'+pt[1]+'" r="4" fill="#b99568"/><text x="'+pt[0]+'" y="'+(pt[1]-9)+'" text-anchor="middle">'+(vals[i]?fa(vals[i]):'—')+'</text><text x="'+pt[0]+'" y="'+(h-4)+'" text-anchor="middle">'+months[i].label+'</text>').join('')+'</svg>';
}
function renderOrganizationMap(data){
 const host=$('#holding-structure');if(!host)return;
 const count=id=>data.filter(x=>x.scope===id).length;
 const group=(title,items)=>'<section class="org-group"><div class="org-group-head"><b>'+title+'</b><span>'+fa(items.length)+' جایگاه</span></div><div class="org-tiles">'+items.map(x=>'<article class="org-tile"><div><b>'+esc(x.label)+'</b><small>'+esc(x.type)+' · '+(x.status==='confirmed'?'ثبت‌شده در ساختار':'عنوان در انتظار تکمیل')+'</small></div><strong>'+fa(count(x.id))+'</strong><em>پرونده نمونه</em></article>').join('')+'</div></section>';
 host.innerHTML=group('ستاد و مدیریت مرکزی',scopes.filter(x=>x.type==='ستاد هلدینگ'))+group('معاونت‌های هلدینگ',scopes.filter(x=>x.type==='معاونت'))+group('شرکت‌های تابعه ثبت‌شده',scopes.filter(x=>x.type==='شرکت تابعه'))+group('مدیریت‌های شعب استانی',scopes.filter(x=>x.type==='مدیریت شعب استانی'));
}
function renderCompetencyProfile(){
 const host=$('#competency-profile');if(!host)return;
 const cards=profilesWithScores.map((p,i)=>'<button type="button" class="profile-select '+(i===0?'active':'')+'" data-profile="'+i+'"><b>'+esc(p.name)+'</b><span>'+esc(p.role)+'</span><strong>'+fa(p.overall)+'/۱۰۰</strong></button>').join('');
 host.innerHTML='<div class="profile-chooser">'+cards+'</div><div id="competency-detail"></div>';
 const show=i=>{const p=profilesWithScores[i];const rows=p.competencies.flatMap(d=>d.items.map(x=>'<tr><td>'+esc(d.name)+'</td><td><b>'+esc(x.name)+'</b><small>'+esc(x.definition)+'</small></td><td><strong>'+fa(x.score)+'</strong></td><td>'+esc(x.evidence)+'</td></tr>')).join('');
 const dimNames=p.competencies.map(d=>d.name),dimValues=p.competencies.map(d=>Math.round(d.items.reduce((n,x)=>n+x.score,0)/d.items.length));$('#competency-detail').innerHTML='<div class="profile-summary"><div><small>امتیاز کل شایستگی</small><strong>'+fa(p.overall)+' از ۱۰۰</strong></div><div><small>آمادگی نقش</small><b>'+esc(p.readiness)+'</b></div><div><small>تاریخ کانون</small><b>'+esc(p.date)+'</b></div><div><small>قلمرو سازمانی</small><b>'+esc(p.scope)+'</b></div></div><div class="profile-notes"><div><b>نقاط قوت برجسته</b><p>'+esc(p.strengths)+'</p></div><div><b>شکاف‌های توسعه‌ای</b><p>'+esc(p.gaps)+'</p></div><div><b>پیشنهاد توسعه</b><p>'+esc(p.recommendation)+'</p></div></div><div class="profile-dimension-chart"><h4>نمای امتیاز خانواده‌های شایستگی</h4>'+horizontalBars(dimNames,dimValues)+'</div><div class="table-wrap"><table class="data-table competency-table"><thead><tr><th>خانواده شایستگی</th><th>شایستگی و تعریف رفتاری</th><th>امتیاز</th><th>نمونه شاهد رفتاری</th></tr></thead><tbody>'+rows+'</tbody></table></div><small class="sample-note">تمام مشخصات و امتیازهای این پرونده صرفاً نمونه نمایشی هستند؛ امتیاز واقعی باید با شواهد چندابزاری، چندارزیاب و جلسه تلفیق تعیین شود.</small>';
 $$('.profile-select',host).forEach((b,j)=>b.classList.toggle('active',j===i));};
 host.addEventListener('click',e=>{const b=e.target.closest('[data-profile]');if(b)show(Number(b.dataset.profile));});show(0);
}
const personProfiles=[
 {id:'EMP-1405-001',name:'مدیر نمونه ۰۱',role:'مدیر ارشد · راهبری و برنامه‌ریزی',unit:'ستاد هلدینگ · حوزه راهبری',photo:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&h=520&q=82',employeeNo:'نمونه ۰۰۱',education:'کارشناسی ارشد مدیریت اجرایی',field:'مدیریت راهبردی',tenure:'۱۲ سال و ۴ ماه',positionAge:'۳ سال در سمت فعلی',manager:'مدیر مافوق نمونه',overall:86,previous:80,groupAvg:78,readiness:'آماده توسعه به نقش بالاتر',strength:'رهبری، تصمیم‌گیری و تحلیل داده',gap:'تفویض اختیار و توسعه جانشین',goal:'افزایش اثربخشی تفویض و آماده‌سازی دو جانشین طی ۶ ماه',dimensions:[['رهبری و راهبری',92],['تفکر و حل مسئله',88],['اجرا و نتیجه‌گرایی',85],['ارتباط و همکاری',79],['یادگیری و تحول',86]],indicators:[['تحقق اهداف',91],['کیفیت خروجی',87],['بهره‌وری منابع',82],['همکاری بین‌بخشی',78],['نوآوری و بهبود',86]],cycles:[['ارزشیابی سالانه ۱۴۰۵',86,'بسیار خوب','تکمیل‌شده'],['ارزشیابی نیم‌سال اول ۱۴۰۵',82,'خوب','تکمیل‌شده'],['کانون شایستگی مدیران',84,'آماده توسعه','تکمیل‌شده'],['بازبینی عملکرد ۱۴۰۴',80,'خوب','تکمیل‌شده']],courses:[['رهبری راهبردی و حکمرانی','۳۲ ساعت','۱۴۰۵/۰۶','موفق'],['تحلیل داده برای مدیران','۲۴ ساعت','۱۴۰۵/۰۴','موفق'],['مربی‌گری و جانشین‌پروری','۱۶ ساعت','۱۴۰۵/۰۲','موفق']],reviews:[['۱۴۰۵/۰۸','بازخورد ۳۶۰ درجه','۸۸'],['۱۴۰۵/۰۶','مصاحبه رفتاری','۸۵'],['۱۴۰۵/۰۵','تمرین سبد کاری','۸۴']]},
 {id:'EMP-1405-002',name:'مدیر نمونه ۰۲',role:'مدیر میانی · عملیات و پشتیبانی',unit:'معاونت نمونه · حوزه عملیات',photo:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&h=520&q=82',employeeNo:'نمونه ۰۰۲',education:'کارشناسی ارشد مدیریت منابع انسانی',field:'مدیریت سازمانی',tenure:'۹ سال و ۷ ماه',positionAge:'۲ سال در سمت فعلی',manager:'معاون نمونه',overall:78,previous:73,groupAvg:76,readiness:'آماده پس از تکمیل برنامه توسعه',strength:'برنامه‌ریزی، پیگیری و ارتباط حرفه‌ای',gap:'تفکر سیستمی و تحلیل ریشه‌ای',goal:'هدایت یک پروژه بهبود بین‌بخشی و کاهش زمان چرخه ۱۵ درصد',dimensions:[['رهبری و راهبری',75],['تفکر و حل مسئله',71],['اجرا و نتیجه‌گرایی',85],['ارتباط و همکاری',82],['یادگیری و تحول',77]],indicators:[['تحقق اهداف',82],['کیفیت خروجی',79],['بهره‌وری منابع',81],['همکاری بین‌بخشی',76],['نوآوری و بهبود',72]],cycles:[['ارزشیابی سالانه ۱۴۰۵',78,'خوب','تکمیل‌شده'],['ارزشیابی نیم‌سال اول ۱۴۰۵',75,'قابل قبول','تکمیل‌شده'],['کانون شایستگی مدیران',76,'نیازمند توسعه','تکمیل‌شده'],['بازبینی عملکرد ۱۴۰۴',73,'قابل قبول','تکمیل‌شده']],courses:[['مدیریت فرایند و بهره‌وری','۲۴ ساعت','۱۴۰۵/۰۷','موفق'],['مدیریت تعارض سازمانی','۱۶ ساعت','۱۴۰۵/۰۵','موفق'],['تحلیل ریشه‌ای مسئله','۱۲ ساعت','۱۴۰۵/۰۳','موفق']],reviews:[['۱۴۰۵/۰۸','بازخورد ۳۶۰ درجه','۸۰'],['۱۴۰۵/۰۶','مصاحبه رفتاری','۷۷'],['۱۴۰۵/۰۵','تمرین شبیه‌سازی مدیریتی','۷۶']]},
 {id:'EMP-1405-003',name:'نامزد نمونه ۰۳',role:'کارشناس ارشد · نامزد جانشینی',unit:'شرکت نمونه · حوزه تخصصی',photo:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&h=520&q=82',employeeNo:'نمونه ۰۰۳',education:'کارشناسی ارشد مهندسی صنایع',field:'مدیریت پروژه و سیستم‌ها',tenure:'۷ سال و ۲ ماه',positionAge:'۴ سال در جایگاه فعلی',manager:'مدیر واحد نمونه',overall:72,previous:68,groupAvg:74,readiness:'نیازمند ارزیابی تکمیلی',strength:'دانش تخصصی، یادگیری و مسئولیت‌پذیری',gap:'نفوذ حرفه‌ای و مدیریت تعارض',goal:'تقویت مهارت مذاکره و ارائه مدیریتی؛ ارزیابی مجدد در ۴ ماه',dimensions:[['رهبری و راهبری',68],['تفکر و حل مسئله',79],['اجرا و نتیجه‌گرایی',77],['ارتباط و همکاری',65],['یادگیری و تحول',80]],indicators:[['تحقق اهداف',76],['کیفیت خروجی',81],['بهره‌وری منابع',73],['همکاری بین‌بخشی',67],['نوآوری و بهبود',70]],cycles:[['ارزشیابی سالانه ۱۴۰۵',72,'قابل قبول','تکمیل‌شده'],['ارزشیابی نیم‌سال اول ۱۴۰۵',70,'قابل قبول','تکمیل‌شده'],['کانون شایستگی تخصصی',71,'ارزیابی تکمیلی','تکمیل‌شده'],['بازبینی عملکرد ۱۴۰۴',68,'قابل قبول','تکمیل‌شده']],courses:[['ارائه و اقناع حرفه‌ای','۱۶ ساعت','۱۴۰۵/۰۸','موفق'],['مذاکره و مدیریت تعارض','۲۰ ساعت','۱۴۰۵/۰۶','موفق'],['مدیریت پروژه پیشرفته','۲۴ ساعت','۱۴۰۵/۰۲','موفق']],reviews:[['۱۴۰۵/۰۸','مصاحبه شایستگی','۷۴'],['۱۴۰۵/۰۷','تمرین ارائه مدیریتی','۶۸'],['۱۴۰۵/۰۶','مطالعه موردی','۷۵']]},
 {id:'EMP-1405-004',name:'کارشناس نمونه ۰۴',role:'کارشناس ارشد · تخصص و توسعه',unit:'معاونت نمونه · حوزه تخصصی',photo:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&h=520&q=82',employeeNo:'نمونه ۰۰۴',education:'دکتری مدیریت فناوری اطلاعات',field:'تحول دیجیتال',tenure:'۱۰ سال و ۱ ماه',positionAge:'۵ سال در سمت فعلی',manager:'مدیر تخصصی نمونه',overall:89,previous:83,groupAvg:77,readiness:'آماده توسعه به نقش بالاتر',strength:'حل مسئله، کیفیت اجرا و همکاری',gap:'تجربه محدود در مدیریت منابع',goal:'سرپرستی یک بسته کاری و مدیریت بودجه مستقل',dimensions:[['رهبری و راهبری',82],['تفکر و حل مسئله',94],['اجرا و نتیجه‌گرایی',91],['ارتباط و همکاری',87],['یادگیری و تحول',92]],indicators:[['تحقق اهداف',92],['کیفیت خروجی',94],['بهره‌وری منابع',87],['همکاری بین‌بخشی',86],['نوآوری و بهبود',93]],cycles:[['ارزشیابی سالانه ۱۴۰۵',89,'بسیار خوب','تکمیل‌شده'],['ارزشیابی نیم‌سال اول ۱۴۰۵',86,'بسیار خوب','تکمیل‌شده'],['کانون شایستگی تخصصی',90,'آماده توسعه','تکمیل‌شده'],['بازبینی عملکرد ۱۴۰۴',83,'خوب','تکمیل‌شده']],courses:[['معماری سازمانی و تحول دیجیتال','۳۰ ساعت','۱۴۰۵/۰۷','موفق'],['مدیریت مالی برای مدیران پروژه','۱۸ ساعت','۱۴۰۵/۰۵','موفق'],['مدیریت نوآوری','۲۰ ساعت','۱۴۰۵/۰۳','موفق']],reviews:[['۱۴۰۵/۰۸','بازخورد ۳۶۰ درجه','۹۱'],['۱۴۰۵/۰۷','مصاحبه تخصصی','۹۰'],['۱۴۰۵/۰۶','تمرین حل مسئله','۸۸']]}
];
function renderPersonProfiles(){
 const list=$('#person-profile-list'),detail=$('#person-profile-detail');if(!list||!detail)return;
 list.innerHTML=personProfiles.map((p,i)=>'<button type="button" class="person-profile-card '+(i===0?'active':'')+'" data-person-profile="'+i+'"><img src="'+p.photo+'" alt="تصویر نمونه '+esc(p.name)+'" loading="lazy"><span><b>'+esc(p.name)+'</b><small>'+esc(p.role)+'</small><strong>'+fa(p.overall)+' از ۱۰۰</strong></span></button>').join('');
 const show=i=>{
  const p=personProfiles[i],delta=p.overall-p.previous,deltaText=(delta>=0?'+':'')+fa(delta);
  detail.innerHTML='<div class="person-profile-hero"><img src="'+p.photo+'" alt="تصویر نمونه '+esc(p.name)+'"><div class="person-profile-identity"><span class="eyebrow">پرونده نمونه · '+esc(p.id)+'</span><h4>'+esc(p.name)+'</h4><p>'+esc(p.role)+'</p><div class="person-profile-tags"><span>'+esc(p.unit)+'</span><span>'+esc(p.readiness)+'</span></div></div><div class="person-overall"><small>امتیاز جامع شایستگی</small><strong>'+fa(p.overall)+'</strong><span>از ۱۰۰</span></div></div>'+
  '<div class="person-facts"><div><small>شناسه پرسنلی</small><b>'+esc(p.employeeNo)+'</b></div><div><small>تحصیلات</small><b>'+esc(p.education)+'</b></div><div><small>رشته تخصصی</small><b>'+esc(p.field)+'</b></div><div><small>سابقه خدمت</small><b>'+esc(p.tenure)+'</b></div><div><small>سابقه در سمت</small><b>'+esc(p.positionAge)+'</b></div><div><small>مسئول مستقیم</small><b>'+esc(p.manager)+'</b></div></div>'+
  '<div class="person-kpis"><div><small>امتیاز آخرین دوره</small><strong>'+fa(p.overall)+'</strong></div><div><small>تغییر نسبت به دوره قبل</small><strong class="'+(delta>=0?'positive':'negative')+'">'+deltaText+' امتیاز</strong></div><div><small>میانگین گروه هم‌سطح</small><strong>'+fa(p.groupAvg)+'</strong></div><div><small>اختلاف با گروه</small><strong class="'+(p.overall>=p.groupAvg?'positive':'negative')+'">'+(p.overall>=p.groupAvg?'+':'')+fa(p.overall-p.groupAvg)+'</strong></div></div>'+
  '<div class="person-chart-grid"><section class="person-subpanel"><h5>پروفایل شایستگی فرد</h5>'+horizontalBars(p.dimensions.map(x=>x[0]),p.dimensions.map(x=>x[1]))+'</section><section class="person-subpanel"><h5>شاخص‌های عملکردی و رفتاری</h5>'+verticalBars(p.indicators.map(x=>x[0]),p.indicators.map(x=>x[1]))+'</section></div>'+
  '<div class="person-subpanel person-compare"><h5>مقایسه نتیجه فرد با میانگین گروه هم‌سطح</h5><div class="person-compare-bars">'+p.dimensions.map((x,j)=>'<div><span>'+esc(x[0])+'</span><div class="compare-track"><i style="width:'+x[1]+'%"></i><em style="width:'+p.groupAvg+'%"></em></div><b>'+fa(x[1])+' <small>میانگین '+fa(p.groupAvg)+'</small></b></div>').join('')+'</div><small class="sample-note">خط نشانگر روی هر نوار، میانگین فرضی گروه هم‌سطح را نشان می‌دهد.</small></div>'+
  '<div class="person-subpanel"><h5>سوابق دوره‌های ارزشیابی و مقایسه نتایج</h5><div class="table-wrap"><table class="data-table"><thead><tr><th>دوره / ابزار</th><th>امتیاز</th><th>سطح نتیجه</th><th>وضعیت</th></tr></thead><tbody>'+p.cycles.map(x=>'<tr><td>'+esc(x[0])+'</td><td><b>'+fa(x[1])+'</b></td><td>'+esc(x[2])+'</td><td><span class="tag">'+esc(x[3])+'</span></td></tr>').join('')+'</tbody></table></div></div>'+
  '<div class="person-subpanel"><h5>دوره‌های آموزشی و توسعه‌ای گذرانده‌شده</h5><div class="table-wrap"><table class="data-table"><thead><tr><th>عنوان دوره</th><th>مدت</th><th>تاریخ</th><th>نتیجه</th></tr></thead><tbody>'+p.courses.map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td><td>'+esc(x[2])+'</td><td><span class="tag">'+esc(x[3])+'</span></td></tr>').join('')+'</tbody></table></div></div>'+
  '<div class="person-subpanel"><h5>سوابق ابزارهای ارزیابی و بازخورد</h5><div class="review-timeline">'+p.reviews.map(x=>'<div><small>'+esc(x[0])+'</small><b>'+esc(x[1])+'</b><strong>'+fa(x[2])+'</strong></div>').join('')+'</div></div>'+
  '<div class="person-development"><div><b>نقاط قوت مستند</b><p>'+esc(p.strength)+'</p></div><div><b>اولویت‌های توسعه</b><p>'+esc(p.gap)+'</p></div><div><b>هدف برنامه توسعه فردی</b><p>'+esc(p.goal)+'</p></div></div>'+
  '<div class="person-profile-foot"><span>آخرین بازبینی پرونده: ۱۴۰۵/۰۸/۱۵</span><span>وضعیت پرونده: نمونه تکمیل‌شده</span></div>';
  list.querySelectorAll('[data-person-profile]').forEach((b,j)=>b.classList.toggle('active',j===i));
 };
 list.addEventListener('click',e=>{const b=e.target.closest('[data-person-profile]');if(b)show(Number(b.dataset.personProfile));});
 show(0);
}
function renderAssessorProfiles(){
 const pageHost=$('#assessor-profiles');if(!pageHost)return;
 const people=[...demoAssessors,...assessors];
 pageHost.innerHTML=people.map(p=>'<article class="assessor-card"><div class="assessor-card-head"><div class="assessor-avatar">'+esc((p.name||p.title||'ا').slice(0,1))+'</div><div><b>'+esc(p.name||p.title)+'</b><small>'+esc(p.role||'ارزیاب همکار')+'</small></div><span class="tag">'+esc(p.qualification)+'</span></div><p class="assessor-specialty">'+esc(p.specialty||'تخصص ثبت نشده')+'</p><dl><div><dt>تحصیلات</dt><dd>'+esc(p.education||'در حال تکمیل')+'</dd></div><div><dt>سابقه</dt><dd>'+esc(p.experience||'ثبت نشده')+'</dd></div><div><dt>سطح شبکه</dt><dd>'+esc(p.level||'ارزیاب همکار')+'</dd></div><div><dt>قلمرو فعالیت</dt><dd>'+esc(p.scope||'در حال تخصیص')+'</dd></div><div><dt>آموزش و اعتبارنامه</dt><dd>'+esc(p.training||'نیازمند ثبت')+'</dd></div><div><dt>تخصیص پرونده</dt><dd>'+fa(p.assigned||0)+' پرونده</dd></div><div><dt>تعارض منافع</dt><dd>'+esc(p.conflict||'در انتظار اظهار')+'</dd></div><div><dt>شناسه ارتباط</dt><dd>'+esc(p.contact||p.id)+'</dd></div></dl></article>').join('');
}
function renderCharts(data){
 const set=(id,html)=>{const el=$('#'+id);if(el)el.innerHTML=html;};
 const domains=['سازمانی','کانون','عملکرد','برنامه و پروژه','خدمت و فرایند'],counts=domains.map(x=>data.filter(r=>r.domain===x).length);
 set('domain-bars',horizontalBars(domains,counts));set('domain-vertical-bars',verticalBars(domains,counts));set('report-domain-bars',verticalBars(domains,counts));
 const statuses=statusLabels.map(x=>data.filter(r=>r.status===x).length);set('status-donut',donutCounts(statusLabels,statuses));set('report-status-donut',donutCounts(statusLabels,statuses));
 const levels=['نیازمند بهبود','قابل قبول','خوب','بسیار خوب'];set('level-donut',donutCounts(levels,levels.map(x=>data.filter(r=>r.level===x).length)));set('report-level-donut',donutCounts(levels,levels.map(x=>data.filter(r=>r.level===x).length)));
 set('score-trend',trend(data));set('report-score-trend',trend(data));
 const org=data.filter(x=>x.domain==='سازمانی'),assess=data.filter(x=>x.domain==='کانون'),perf=data.filter(x=>x.domain==='عملکرد');
 const groupScopes=[...new Set(org.map(x=>x.scope))],names=groupScopes.map(x=>scopeById(x).label);
 set('org-unit-bars',verticalBars(names,groupScopes.map(id=>org.filter(x=>x.scope===id).length)));
 set('org-score-bars',horizontalBars(names,groupScopes.map(id=>{const a=org.filter(x=>x.scope===id);return a.length?Math.round(a.reduce((n,x)=>n+x.score,0)/a.length):0;})));
 const base=Math.round(assess.reduce((n,x)=>n+x.score,0)/(assess.length||1));
 set('competency-bars',horizontalBars(['رهبری','تصمیم‌گیری','حل مسئله','ارتباط مؤثر','مدیریت تغییر','تفکر راهبردی'],[base+5,base-3,base+2,base-6,base-1,base+3].map(n=>Math.max(0,Math.min(100,n)))));
 set('assessment-outcomes',donutCounts(['آماده توسعه','نیازمند توسعه','ارزیابی تکمیلی'],[Math.round(assess.length*.28),Math.round(assess.length*.52),Math.max(0,assess.length-Math.round(assess.length*.8))]));
 const pbase=Math.round(perf.reduce((n,x)=>n+x.score,0)/(perf.length||1));
 set('performance-bars',verticalBars(['تحقق اهداف','کیفیت','بهره‌وری','همکاری','بهبود'],[pbase+4,pbase-2,pbase+1,pbase-5,pbase-1].map(n=>Math.max(0,Math.min(100,n)))));
 set('performance-donut',donutCounts(statusLabels,statuses));
 const ap=[...demoAssessors,...assessors],specialties=['رهبری و مدیریت','فرایند و بهره‌وری','منابع انسانی','فناوری و تحول','پروژه و ریسک','کیفیت خدمات'];
 set('assessor-specialty-bars',horizontalBars(specialties,specialties.map(s=>ap.filter(a=>(a.specialty||'').includes(s.split(' ')[0])).length)));
 set('assessor-status-donut',donutCounts(['تأییدشده','در حال بررسی','نیازمند بازآموزی'],['تأییدشده','در حال بررسی','نیازمند بازآموزی'].map(s=>ap.filter(a=>a.qualification===s).length)));
 set('standards-bars',verticalBars(['رهبری','تفکر','اجرا','ارتباط','حرفه‌ای'],[82,76,79,74,88]));
 set('standards-donut',donutCounts(['مصاحبه','شبیه‌سازی','آزمون','مشاهده رفتاری'],[8,7,5,9]));
 const avg=Math.round(data.reduce((n,x)=>n+x.score,0)/(data.length||1));
 set('program-progress',verticalBars(['تحقق اهداف','پیشرفت زمانی','کیفیت تحویل','تحقق منافع'],[avg+3,avg-5,avg+2,avg-3].map(n=>Math.max(0,Math.min(100,n)))));
 set('program-status',donutCounts(['در مسیر','دارای انحراف','تکمیل‌شده'],[Math.round(data.length*.55),Math.round(data.length*.25),Math.max(0,data.length-Math.round(data.length*.8))]));
 set('service-quality',horizontalBars(['سرعت پاسخ','صحت خدمت','دسترس‌پذیری','حل درخواست','تجربه مخاطب'],[avg+2,avg+5,avg-2,avg-4,avg+1].map(n=>Math.max(0,Math.min(100,n)))));
 set('service-satisfaction',donutCounts(['رضایت بالا','رضایت متوسط','نیازمند رسیدگی'],[Math.round(data.length*.58),Math.round(data.length*.3),Math.max(0,data.length-Math.round(data.length*.88))]));
 set('improvement-status',donutCounts(['انجام‌شده','در حال اجرا','عقب‌افتاده'],[Math.round(data.length*.32),Math.round(data.length*.48),Math.max(0,data.length-Math.round(data.length*.8))]));
 set('improvement-actions',verticalBars(['اولویت بالا','اولویت متوسط','اولویت عادی'],[Math.round(data.length*.28),Math.round(data.length*.46),Math.max(0,data.length-Math.round(data.length*.74))]));
}
$('#case-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),sid=String(f.get('scope')||'');const s=scopeById(sid);const item={id:'EVCASE-'+Date.now(),kind:'assessment-case',title:String(f.get('title')||'').trim(),domain:f.get('domain'),scope:sid,scopeLabel:s.label,status:f.get('status'),period:f.get('period'),description:String(f.get('description')||'').trim(),createdAt:new Date().toISOString(),score:0,level:'ثبت اولیه'};try{await persist(item);render();e.currentTarget.reset();status('پرونده ارزیابی ثبت شد.')}catch(err){status('ثبت پرونده ناموفق بود: '+err.message,true);}});
$('#assessor-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const item={id:'EVASSESSOR-'+Date.now(),kind:'assessor',name:String(f.get('name')||'').trim(),title:String(f.get('name')||'').trim(),role:f.get('role'),specialty:String(f.get('specialty')||'').trim(),experience:String(f.get('experience')||'').trim(),education:String(f.get('education')||'').trim(),qualification:f.get('qualification'),createdAt:new Date().toISOString(),kind:'assessor'};try{await persist(item);render();renderAssessorProfiles();e.currentTarget.reset();status('اطلاعات ارزیاب ثبت شد.')}catch(err){status('ثبت ارزیاب ناموفق بود: '+err.message,true);}});
$('#backup-export')?.addEventListener('click',async()=>{try{let payload=window.HoldingLocalDataVault?await HoldingLocalDataVault.exportData(SCOPE):{format:'holding-evaluation-export',exportedAt:new Date().toISOString(),records:[...records,...assessors]};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='evaluation-center-backup.json';a.click();URL.revokeObjectURL(a.href);status('فایل پشتیبان آماده شد.')}catch(e){status('تهیه پشتیبان ناموفق بود: '+e.message,true);}});
$('#backup-import')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text()),incoming=Array.isArray(data.records)?data.records:[];for(const item of incoming)await persist(item);render();status(fa(incoming.length)+' رکورد بازیابی شد.')}catch(err){status('بازیابی ناموفق: '+err.message,true);}e.target.value='';});
$('#backTop')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
const backTop=$('#backTop');if(backTop){const syncBackTop=()=>backTop.classList.toggle('visible',window.scrollY>320);window.addEventListener('scroll',syncBackTop,{passive:true});syncBackTop();}
$$('#filter-period,#filter-domain,#filter-unit').forEach(el=>el.addEventListener('change',render));
if(page==='assessment')renderCompetencyProfile();
if(page==='profiles'||page==='performance')renderPersonProfiles();
if(page==='assessors')renderAssessorProfiles();
load();
})();