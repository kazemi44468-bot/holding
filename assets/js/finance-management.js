(()=>{'use strict';
const KEY='shahrbehesht.finance.v2';
const DEPTS={'1':'اداری و پشتیبانی','2':'تحقیق و توسعه','3':'پارک‌بان و معبربانان','4':'تأسیسات فنی و نگهداری','6':'فاوا و خدمات فنی','7':'جمع‌آوری، نگهداری و بازیافت پسماند','8':'بازرسی و تحقیقات محلی'};
const TYPES={approved:'اعتبار مصوب',allocated:'اعتبار تخصیص‌یافته',expense:'هزینه عمومی / عملیاتی',overtime:'اضافه‌کاری',performance:'کارانه',allowance:'فوق‌العاده و مزایا',invoice:'فاکتور خرید / خدمات',fuel:'سوخت و انرژی',purchase:'خرید و تدارکات',damage:'خسارت و حوادث',contract:'قرارداد و تعهدات',other:'سایر هزینه‌ها'};
const CATS={personnel:'نیروی انسانی',operations:'عملیات و خدمات شهری',fuel:'سوخت و انرژی',procurement:'خرید و تدارکات',maintenance:'تعمیرات و نگهداری',damages:'خسارت و حوادث',contracts:'قراردادها و پیمانکاران',welfare:'رفاه و پشتیبانی',technology:'فناوری و ارتباطات',other:'سایر'};
const COST_TYPES=['expense','overtime','performance','allowance','invoice','fuel','purchase','damage','contract','other'];
const $=id=>document.getElementById(id),fmt=n=>Math.round(Number(n)||0).toLocaleString('fa-IR'),pct=(a,b)=>b>0?Math.round(a/b*100):0,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records=[];
try{
 const saved=JSON.parse(localStorage.getItem(KEY)||'null');
 if(Array.isArray(saved))records=saved;
 else{
  const legacy=JSON.parse(localStorage.getItem('shahrbehesht.finance.v1')||'[]');
  const map={'اعتبار مصوب':'approved','اعتبار تخصیصی':'allocated','اعتبار تخصیص‌یافته':'allocated','هزینه و خرید':'expense','فاکتور':'invoice','اضافه‌کاری':'overtime','کارانه':'performance','تصادف و خسارت':'damage','قرارداد و تعهد':'contract'};
  records=Array.isArray(legacy)?legacy.map(x=>({id:String(x.id||Date.now()),dept:String(x.dept||'company'),type:map[x.type]||'other',category:'operations',title:x.title||'رویداد مالی منتقل‌شده',amount:Number(String(x.amount||0).replace(/[^0-9.]/g,'')),status:x.status||'ثبت اولیه',date:x.date||'',reference:'',note:x.note||'',documented:false})):[]; 
 }
}catch{records=[]}
// Remove only previously generated demo rows and obsolete non-operational categories; preserve user-entered records.
records=records.filter(x=>!String(x.id||'').startsWith('demo-')&&!['capacity','received'].includes(x.type));

// ارقام پایه صرفاً برای تکمیل اولیه داشبورد هستند؛ با برچسب نمونه نمایش داده می‌شوند و قابل ویرایش/حذف‌اند.
function sampleDate(id){
 const now=new Date();
 const fmtParts=d=>{const p=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d);return{y:Number(p.find(x=>x.type==='year').value),m:Number(p.find(x=>x.type==='month').value),d:Number(p.find(x=>x.type==='day').value)}};
 const faDate=d=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replace(/\u200e/g,'');
 const recent={'a1':1,'a2':3,'e81':1,'e82':2,'e83':3,'e84':4,'e85':5};
 if(id==='budget')return faDate(new Date(jalaliToGregorian(...(()=>{const p=fmtParts(now);return[p.y,1,1]})())));
 if(recent[id]){const d=new Date(now);d.setDate(d.getDate()-recent[id]);return faDate(d);}
 const p=fmtParts(now);let back=1;
 if(/^a/.test(id))back=Math.max(1,({a3:1,a4:3,a6:5,a7:7,a8:9}[id]||1));
 else back=1+(Number(String(id).replace(/\D/g,''))%7);
 let total=p.y*12+(p.m-1)-back, y=Math.floor(total/12), m=total%12+1;
 return faDate(new Date(jalaliToGregorian(y,m,25)));
}
function jalaliToGregorian(jy,jm,jd){
 const guess=new Date(jy+621,jm+2,jd);
 for(let offset=-40;offset<=40;offset++){
  const candidate=new Date(guess);candidate.setDate(candidate.getDate()+offset);
  const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(candidate);
  const y=Number(parts.find(x=>x.type==='year').value),m=Number(parts.find(x=>x.type==='month').value),d=Number(parts.find(x=>x.type==='day').value);
  if(y===jy&&m===jm&&d===jd)return candidate;
 }
 return null;
}
if(!localStorage.getItem(KEY+'_seeded')){
 if(records.length===0){
  const base=(id,dept,type,amount,title,category,status='پرداخت‌شده',documented=true)=>({id:'sample-'+id,dept,type,amount,title,category,status,documented,date:sampleDate(id),reference:'نمونه-'+id,note:'داده نمایشی اولیه؛ پیش از استفاده مدیریتی با اطلاعات واقعی جایگزین شود.',sample:true});
  records=[
   base('budget','company','approved',12000000000,'اعتبار مصوب اولیه کل شرکت','other','ثبت اولیه'),
   base('a1','1','allocated',1200000000,'تخصیص دوره‌ای اداره اداری و پشتیبانی','other','تأییدشده'),base('a2','2','allocated',900000000,'تخصیص دوره‌ای اداره تحقیق و توسعه','other','تأییدشده'),base('a3','3','allocated',2400000000,'تخصیص دوره‌ای اداره پارکبان و معبربانان','other','تأییدشده'),base('a4','4','allocated',1800000000,'تخصیص دوره‌ای اداره تأسیسات فنی','other','تأییدشده'),base('a6','6','allocated',1100000000,'تخصیص دوره‌ای اداره فاوا و خدمات فنی','other','تأییدشده'),base('a7','7','allocated',1700000000,'تخصیص دوره‌ای اداره پسماند','other','تأییدشده'),base('a8','8','allocated',900000000,'تخصیص دوره‌ای اداره بازرسی و تحقیقات محلی','other','تأییدشده'),
   base('e11','1','expense',520000000,'هزینه‌های جاری و پشتیبانی اداری','operations'),base('e12','1','overtime',95000000,'اضافه‌کاری کارکنان اداری','personnel'),base('e13','1','performance',85000000,'کارانه عملکرد دوره‌ای','personnel'),base('e14','1','allowance',50000000,'فوق‌العاده و مزایای پرسنلی','personnel'),base('e15','1','invoice',100000000,'فاکتور خدمات و ملزومات اداری','procurement','در انتظار پرداخت'),
   base('e21','2','expense',250000000,'هزینه مطالعات و طرح‌های توسعه','operations'),base('e22','2','invoice',160000000,'فاکتور خدمات پژوهشی و تخصصی','procurement'),base('e23','2','contract',120000000,'تعهد قرارداد مطالعاتی','contracts','در انتظار پرداخت'),base('e24','2','overtime',45000000,'اضافه‌کاری کارشناسی','personnel'),base('e25','2','performance',45000000,'کارانه پروژه‌های پژوهشی','personnel'),
   base('e31','3','expense',900000000,'هزینه عملیات و خدمات میدانی','operations'),base('e32','3','fuel',420000000,'سوخت و انرژی ناوگان عملیاتی','fuel'),base('e33','3','overtime',260000000,'اضافه‌کاری نیروهای میدانی','personnel'),base('e34','3','invoice',180000000,'فاکتور تجهیزات و ملزومات میدانی','procurement'),base('e35','3','damage',70000000,'خسارت و حوادث عملیاتی','damages','در انتظار تأیید'),base('e36','3','other',120000000,'سایر هزینه‌های خدمات شهری','other'),
   base('e41','4','expense',500000000,'هزینه تعمیرات و نگهداری تأسیسات','maintenance'),base('e42','4','purchase',280000000,'خرید قطعات و تجهیزات فنی','procurement'),base('e43','4','contract',220000000,'قرارداد سرویس و نگهداری','contracts','در انتظار پرداخت'),base('e44','4','fuel',160000000,'سوخت و انرژی تجهیزات','fuel'),base('e45','4','overtime',120000000,'اضافه‌کاری گروه فنی','personnel'),base('e46','4','invoice',140000000,'فاکتور تعمیرات تخصصی','maintenance'),
   base('e61','6','expense',210000000,'هزینه پشتیبانی فناوری و ارتباطات','technology'),base('e62','6','purchase',180000000,'خرید تجهیزات فاوا','procurement'),base('e63','6','contract',120000000,'قرارداد پشتیبانی سامانه‌ها','contracts','در انتظار پرداخت'),base('e64','6','overtime',70000000,'اضافه‌کاری خدمات فنی','personnel'),base('e65','6','allowance',60000000,'فوق‌العاده تخصصی','personnel'),base('e66','6','invoice',140000000,'فاکتور تجهیزات و خدمات فناوری','technology'),
   base('e71','7','expense',480000000,'هزینه عملیات جمع‌آوری و بازیافت','operations'),base('e72','7','fuel',350000000,'سوخت ناوگان جمع‌آوری','fuel'),base('e73','7','overtime',210000000,'اضافه‌کاری نیروهای خدماتی','personnel'),base('e74','7','purchase',150000000,'خرید لوازم و تجهیزات خدماتی','procurement'),base('e75','7','invoice',120000000,'فاکتور تعمیر و خدمات ناوگان','maintenance'),
   base('e81','8','expense',260000000,'هزینه عملیات بازرسی و تحقیقات محلی','operations'),base('e82','8','contract',120000000,'قرارداد خدمات کارشناسی','contracts','در انتظار پرداخت'),base('e83','8','purchase',80000000,'خرید تجهیزات بازرسی','procurement'),base('e84','8','overtime',50000000,'اضافه‌کاری کارشناسان','personnel'),base('e85','8','invoice',80000000,'فاکتور خدمات و ملزومات بازرسی','procurement')
  ];
 }
 localStorage.setItem(KEY+'_seeded','1');
}

function persist(){localStorage.setItem(KEY,JSON.stringify(records))}
// تاریخ نمونه‌های قدیمی که یکسان ثبت شده بودند، برای نمایش صحیح فیلتر دوره‌ای توزیع می‌شود؛ داده‌های کاربر تغییر نمی‌کند.
records=records.map(x=>x.sample?{...x,date:sampleDate(String(x.id||'').replace(/^sample-/,'')||'budget')}:x);
persist();
let visibleRecords=[];
const periodNames={year:'یک‌ساله اخیر',half:'شش‌ماهه اخیر',quarter:'سه‌ماهه اخیر',month:'یک‌ماهه اخیر',week:'هفت روز اخیر',all:'تمام سوابق'};
function normalizeDigits(s){return String(s||'').replace(/[۰-۹٠-٩]/g,ch=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)>=0?'۰۱۲۳۴۵۶۷۸۹'.indexOf(ch):'٠١٢٣٤٥٦٧٨٩'.indexOf(ch)));}
function recordDate(value){
 const s=normalizeDigits(value).trim(),m=s.match(/(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
 if(!m)return null;const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
 if(y>=1700)return new Date(y,mo-1,d);
 if(mo<1||mo>12||d<1||d>31)return null;
 return jalaliToGregorian(y,mo,d);
}
function getVisibleRecords(){
 const period=$('finance-period')?.value||'year';if(period==='all')return records.slice();
 const now=new Date();now.setHours(23,59,59,999);let start=new Date(now);
 if(period==='week'){start.setDate(start.getDate()-6);}
 else{
  const months={month:1,quarter:3,half:6,year:12}[period]||12;
  const day=start.getDate();start.setDate(1);start.setMonth(start.getMonth()-months);
  const lastDay=new Date(start.getFullYear(),start.getMonth()+1,0).getDate();start.setDate(Math.min(day,lastDay));
 }
 start.setHours(0,0,0,0);
 return records.filter(x=>{const d=recordDate(x.date);return d&&d>=start&&d<=now;});
}
const sum=fn=>visibleRecords.filter(fn).reduce((s,x)=>s+(Number(x.amount)||0),0);
const costs=()=>visibleRecords.filter(x=>COST_TYPES.includes(x.type));
const spent=()=>costs().reduce((s,x)=>s+(Number(x.amount)||0),0);
function donut(items,totalValue,label){
 const palette=['#52738b','#91a7b7','#c2cdd5','#a58d78','#718b9d','#b6a39a','#9ba9a8','#cfb98e'];
 let offset=0;const segments=items.filter(x=>x.value>0).map((x,i)=>{const start=offset;offset+=x.value/Math.max(totalValue,1)*100;return palette[i%palette.length]+' '+start+'% '+offset+'%'});
 return '<div class="finance-donut-layout"><div class="finance-donut" style="background:conic-gradient('+(segments.length?segments.join(','):'#e8edf0 0 100%')+')"><div><b>'+fmt(totalValue)+'</b><small>'+label+'</small></div></div><div class="finance-donut-legend">'+items.map((x,i)=>'<div><i style="background:'+palette[i%palette.length]+'"></i><span>'+esc(x.name)+'</span><b>'+fmt(x.value)+' تومان</b><small>'+fmt(pct(x.value,totalValue))+'٪</small></div>').join('')+'</div></div>';
}
function render(){
 visibleRecords=getVisibleRecords();
 const period=$('finance-period')?.value||'year';
 document.querySelectorAll('[data-finance-period]').forEach(button=>{const active=button.dataset.financePeriod===period;button.classList.toggle('is-active',active);button.setAttribute('aria-checked',active?'true':'false');button.tabIndex=active?0:-1;});
 const approved=records.filter(x=>x.type==='approved'&&x.dept==='company').reduce((s,x)=>s+(Number(x.amount)||0),0);
 const allocated=sum(x=>x.type==='allocated');
 const expense=spent();
 const balance=allocated-expense;
 [['f-approved',approved],['f-allocated',allocated],['f-spent',expense],['f-balance',balance]].forEach(([id,v])=>$(id).textContent=fmt(v));
 const ratios=[
  {label:'تخصیص این بازه نسبت به اعتبار مصوب سالیانه',value:pct(allocated,approved),amount:allocated,base:approved,color:'allocation'},
  {label:'هزینه‌کرد این بازه نسبت به تخصیص همین بازه',value:pct(expense,allocated),amount:expense,base:allocated,color:'spending'},
  {label:'هزینه‌کرد این بازه نسبت به اعتبار مصوب سالیانه',value:pct(expense,approved),amount:expense,base:approved,color:'approved'}
 ];
 $('finance-ratios').innerHTML=ratios.map(x=>'<article class="finance-ratio-card"><div><small>'+x.label+'</small><b>'+fmt(x.value)+'٪</b></div><div class="finance-ratio-track"><i class="'+x.color+'" style="width:'+Math.min(100,Math.max(0,x.value))+'%"></i></div><span>'+fmt(x.amount)+' از '+fmt(x.base)+' تومان</span></article>').join('');
 const alerts=[];
 if(allocated>approved&&approved>0)alerts.push('مجموع تخصیص از اعتبار مصوب بیشتر است.');
 if(expense>allocated)alerts.push('هزینه‌کرد از مجموع اعتبار تخصیص‌یافته بیشتر است.');
 if(approved===0&&allocated>0)alerts.push('برای تخصیص‌های ثبت‌شده، هنوز اعتبار مصوب کل شرکت ثبت نشده است.');
 $('finance-alerts').innerHTML=alerts.length?'<div class="finance-alert">'+alerts.map(esc).join(' ')+'</div>':'';
 const deptRows=Object.entries(DEPTS).map(([id,name])=>{
  const allocation=sum(x=>x.type==='allocated'&&x.dept===id);
  const cost=sum(x=>COST_TYPES.includes(x.type)&&x.dept===id);
  const documented=sum(x=>COST_TYPES.includes(x.type)&&x.dept===id&&x.documented);
  return{id,name,allocation,cost,documented,share:pct(cost,expense),use:pct(cost,allocation),doc:pct(documented,cost)};
 });
 const max=Math.max(1,...deptRows.flatMap(x=>[x.allocation,x.cost]));
 $('finance-dept-chart').innerHTML=deptRows.map(d=>'<div class="finance-dept-row"><div class="finance-dept-label"><b>'+esc(d.name)+'</b><span>تخصیص: '+fmt(d.allocation)+' تومان · هزینه: '+fmt(d.cost)+' تومان</span></div><div class="finance-dept-bars"><div class="finance-bar-line"><small>تخصیص</small><div><i class="allocation" style="width:'+d.allocation/max*100+'%"></i></div></div><div class="finance-bar-line"><small>هزینه‌کرد</small><div><i class="spending" style="width:'+d.cost/max*100+'%"></i></div></div></div></div>').join('');
 const allocationShares=deptRows.map(x=>({name:x.name,value:x.allocation}));
 const spendingShares=deptRows.map(x=>({name:x.name,value:x.cost}));
 $('finance-allocation-share').innerHTML=donut(allocationShares,allocated,'کل تخصیص');
 $('finance-spending-share').innerHTML=donut(spendingShares,expense,'کل هزینه‌کرد');
 const catRows=Object.entries(CATS).map(([id,name])=>({name,value:sum(x=>COST_TYPES.includes(x.type)&&x.category===id)})).filter(x=>x.value>0);
 $('finance-category-chart').innerHTML=donut(catRows,expense,'هزینه‌ها');
 const docs=sum(x=>COST_TYPES.includes(x.type)&&x.documented);
 const invoices=visibleRecords.filter(x=>x.type==='invoice'),invoiceSum=invoices.reduce((s,x)=>s+(+x.amount||0),0);
 const settled=invoices.filter(x=>x.status==='تسویه‌شده').reduce((s,x)=>s+(+x.amount||0),0);
 const paid=sum(x=>COST_TYPES.includes(x.type)&&['پرداخت‌شده','تسویه‌شده'].includes(x.status));
 const docCards=[['مبلغ دارای مستند',docs,pct(docs,expense)+'٪ از کل هزینه'],['هزینه بدون مستند',Math.max(0,expense-docs),'نیازمند تکمیل سند'],['مبلغ کل فاکتورها',invoiceSum,invoices.length.toLocaleString('fa-IR')+' فاکتور'],['فاکتورهای تسویه‌شده',settled,'از مجموع فاکتورهای ثبت‌شده'],['مبلغ پرداخت / تسویه هزینه‌ها',paid,pct(paid,expense)+'٪ از هزینه‌ها']];
 $('finance-documents').innerHTML=docCards.map(x=>'<article><small>'+x[0]+'</small><b>'+fmt(x[1])+' تومان</b><span>'+x[2]+'</span></article>').join('');
 const personnel=[['اضافه‌کاری',sum(x=>x.type==='overtime')],['کارانه',sum(x=>x.type==='performance')],['فوق‌العاده و مزایا',sum(x=>x.type==='allowance')]];
 $('finance-personnel-costs').innerHTML=personnel.map(x=>'<article><small>'+x[0]+'</small><b>'+fmt(x[1])+' تومان</b><span>سهم از هزینه کل: '+fmt(pct(x[1],expense))+'٪</span></article>').join('');
 $('finance-dept-rows').innerHTML=deptRows.map(d=>'<tr><td>'+esc(d.name)+'</td><td>'+fmt(d.allocation)+'</td><td>'+fmt(d.cost)+'</td><td>'+fmt(d.share)+'٪</td><td>'+fmt(d.use)+'٪</td><td>'+fmt(d.documented)+'</td><td>'+fmt(d.doc)+'٪</td></tr>').join('')+'<tr class="finance-total-row"><th>مجموع شرکت</th><th>'+fmt(allocated)+'</th><th>'+fmt(expense)+'</th><th>۱۰۰٪</th><th>'+fmt(pct(expense,allocated))+'٪</th><th>'+fmt(docs)+'</th><th>'+fmt(pct(docs,expense))+'٪</th></tr>';
 $('finance-count').textContent=fmt(visibleRecords.length)+' رویداد در بازه انتخابی';
 $('finance-rows').innerHTML=visibleRecords.length?visibleRecords.slice().reverse().map((x,i)=>'<tr><td>'+fmt(visibleRecords.length-i)+'</td><td>'+esc(x.dept==='company'?'ستاد / کل شرکت':DEPTS[x.dept]||'—')+'</td><td>'+esc(TYPES[x.type]||x.type)+'</td><td>'+esc(x.title)+'</td><td>'+fmt(x.amount)+'</td><td>'+esc(x.status)+'</td><td>'+(x.documented?'دارد':'ندارد')+'</td><td>'+esc(x.date||'—')+'</td><td><button type="button" class="finance-secondary-btn" data-edit="'+esc(x.id)+'">ویرایش</button> <button type="button" class="finance-delete" data-delete="'+esc(x.id)+'">حذف</button></td></tr>').join(''):'<tr><td colspan="9" class="finance-empty">هنوز رویداد مالی ثبت نشده است.</td></tr>';
}
const form=$('finance-form');
form.addEventListener('submit',ev=>{
 ev.preventDefault();const x=Object.fromEntries(new FormData(form).entries());x.id=String(Date.now())+'-'+Math.random().toString(36).slice(2,7);x.amount=Number(x.amount);x.documented=form.elements.documented.checked;x.date=x.date||new Intl.DateTimeFormat('fa-IR').format(new Date());
 if(x.type==='approved'&&x.dept!=='company'){alert('اعتبار مصوب کل شرکت باید فقط یک‌بار با انتخاب «ستاد / کل شرکت» ثبت شود.');return}
 if(x.type==='allocated'&&x.dept==='company'){alert('تخصیص اعتبار باید به نام اداره مقصد ثبت شود؛ تخصیص ستادی را به‌عنوان اعتبار مصوب ثبت نکنید.');return}
 if(!x.editId&&x.type==='approved'&&records.some(r=>r.type==='approved'&&r.dept==='company')){alert('اعتبار مصوب کل شرکت قبلاً ثبت شده است. برای اصلاح مبلغ، ابتدا ردیف قبلی را از دفتر رویدادها حذف و سپس مبلغ صحیح را ثبت کنید.');return}
 const duplicate=!x.editId&&records.some(r=>COST_TYPES.includes(x.type)&&COST_TYPES.includes(r.type)&&r.dept===x.dept&&Number(r.amount)===x.amount&&String(r.title||'').trim()===String(x.title||'').trim()&&String(r.date||'')===String(x.date||'')&&String(r.reference||'')===String(x.reference||''));
 if(duplicate){alert('رویدادی با همین اداره، مبلغ، شرح، تاریخ و شماره سند قبلاً ثبت شده است؛ برای جلوگیری از دوباره‌شماری، ثبت تکراری انجام نشد.');return}
 if(['overtime','performance','allowance'].includes(x.type))x.category='personnel';
 if(x.type==='fuel')x.category='fuel';if(x.type==='purchase')x.category='procurement';if(x.type==='damage')x.category='damages';if(x.type==='contract')x.category='contracts';
 if(x.editId){const idx=records.findIndex(r=>String(r.id)===String(x.editId));if(idx>=0){delete x.editId;x.id=records[idx].id;x.sample=false;records[idx]={...records[idx],...x};}}else{delete x.editId;x.sample=false;records.push(x)}try{persist();form.reset();$('finance-edit-id').value='';const submit=form.querySelector('[type=submit]');if(submit)submit.textContent='ثبت و محاسبه مجدد';render()}catch{alert('ذخیره اطلاعات در مرورگر ممکن نشد. فضای ذخیره‌سازی را بررسی کنید.')}
});
$('finance-rows').addEventListener('click',ev=>{const edit=ev.target.closest('[data-edit]');if(edit){const x=records.find(r=>String(r.id)===edit.dataset.edit);if(!x)return;['dept','type','category','amount','status','date','title','reference','note'].forEach(k=>{if(form.elements[k])form.elements[k].value=x[k]??''});form.elements.documented.checked=!!x.documented;$('finance-edit-id').value=x.id;const submit=form.querySelector('[type=submit]');if(submit)submit.textContent='ذخیره اصلاحات';$('finance-entry').scrollIntoView({behavior:'smooth',block:'start'});return}const b=ev.target.closest('[data-delete]');if(!b)return;if(!confirm('این رویداد مالی حذف شود؟'))return;records=records.filter(x=>String(x.id)!==b.dataset.delete);persist();render()});
$('finance-print').addEventListener('click',()=>window.print());
document.querySelectorAll('[data-finance-period]').forEach(button=>{button.addEventListener('click',()=>{const select=$('finance-period');if(!select)return;select.value=button.dataset.financePeriod;render();});button.addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight'].includes(ev.key))return;ev.preventDefault();const buttons=Array.from(document.querySelectorAll('[data-finance-period]'));const index=buttons.indexOf(button);const next=buttons[(index+(ev.key==='ArrowLeft'?1:-1)+buttons.length)%buttons.length];next.focus();next.click();});});
$('finance-period')?.addEventListener('change',render);
render();
})();