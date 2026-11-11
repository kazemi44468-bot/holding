(()=>{'use strict';
const SCOPE='project-center',RECORD_ID='project-center-state',KEY='holding_project_center_v1';
const $=s=>document.querySelector(s),view=$('#view'),fa=n=>new Intl.NumberFormat('fa-IR').format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};
const isoNow=()=>new Date().toISOString();
const fmtDate=v=>{if(!v)return '—';const d=new Date(v.length===10?v+'T12:00:00':v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium'}).format(d)};
const fmtDateTime=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(d)};
const makeId=p=>p+'-'+fa(new Date().getFullYear())+'-'+fa(Math.floor(Math.random()*90000+10000));
const blank=()=>({schemaVersion:2,projects:[],tasks:[],calls:[],workPackages:[],milestones:[],dependencies:[],resources:[],raids:[],changes:[],deliverables:[],events:[],workCalendar:{workDays:[0,1,2,3,4,6],holidays:[]},updatedAt:isoNow()});
let db=blank(),saving=false;
const pageState=Object.create(null),listFilter={projects:{q:'',status:'',domain:'',org:''},tasks:{q:'',status:'',org:''}};
const orgRegistry=window.HOLDING_ORG_REGISTRY||{};
function orgs(){
 const out=[{id:'HOLDING',label:'ستاد هلدینگ'}];
 (orgRegistry.deputies||[]).forEach(x=>out.push({id:x.organization_id,label:x.label||x.name||('معاونت '+x.sequence)}));
 (orgRegistry.companies||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||'شرکت تابعه'}));
 (orgRegistry.provincial_branch_managements||[]).forEach(x=>out.push({id:x.organization_id,label:'مدیریت شعب استانی '+fa(x.sequence)}));
 return out;
}
const orgLabel=id=>orgs().find(x=>x.id===id)?.label||'قلمرو ثبت‌نشده';
const orgOptions=selected=>orgs().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.label)+'</option>').join('');
const projectBy=id=>db.projects.find(x=>x.id===id);
const tasksOf=id=>db.tasks.filter(x=>x.projectId===id&&!x.archived);
const activeProjects=()=>db.projects.filter(x=>!x.archived);
function log(action,entity,title,details=''){
 const item={id:makeId('EVT'),at:isoNow(),action,entity,title,details};
 db.events.unshift(item);db.events=db.events.slice(0,500);
 if(window.HoldingLocalDataVault)window.HoldingLocalDataVault.logEvent('project-'+action,SCOPE,{entity,title,details}).catch(()=>{});
}
async function save(){
 db.updatedAt=isoNow();localStorage.setItem(KEY,JSON.stringify(db));
 if(window.HoldingLocalDataVault){
  try{await window.HoldingLocalDataVault.put(SCOPE,{id:RECORD_ID,kind:'application-state',title:'داده عملیاتی مرکز پروژه‌ها',content:JSON.stringify(db),schemaVersion:1});}
  catch(e){console.error(e);notice('ذخیره در مخزن محلی مرکزی انجام نشد؛ نسخه مرورگر نگهداری شده است.','error');}
 }
}
function seedInitialPortfolio(){
 const definitions=[
 ['تألیف گروهی کتاب راهبری و مدیریت هلدینگ','دانش و انتشارات','تدوین و انتشار یک کتاب مرجع با مشارکت نویسندگان و ویراستاران تخصصی.','گروه تألیف و انتشارات', '2026-09-01','2027-02-28',['تعیین ساختار و فصل‌بندی کتاب','تخصیص فصل‌ها به نویسندگان','تدوین و بازبینی علمی فصل‌ها','ویراستاری و یکپارچه‌سازی متن','صفحه‌آرایی و آماده‌سازی انتشار']],
 ['طراحی و ساخت محصول فنی نمونه اولیه','فناوری و تولید','تبدیل نیاز فنی به نمونه اولیه قابل آزمایش، مستندسازی و ارزیابی.','تیم مهندسی محصول','2026-10-01','2027-04-30',['نیازسنجی و تعریف مشخصات محصول','طراحی مفهومی و معماری فنی','تأمین قطعات و ساخت نمونه','آزمون عملکرد و رفع نقص','مستندسازی و برنامه تولید']],
 ['سازمان‌دهی و راهبری معماری شرکت','حکمرانی و سازمان','تدوین معماری کلان شرکت، نقش‌ها، فرایندها، ساختار تصمیم‌گیری و ارتباط واحدها.','دفتر معماری و تحول سازمانی','2026-08-15','2027-03-31',['شناخت وضع موجود و مستندسازی','طراحی معماری سازمانی هدف','تدوین نقش‌ها و ماتریس مسئولیت','طراحی فرایندها و نظام تصمیم‌گیری','استقرار و ارزیابی معماری']],
 ['تدوین راهبردها و نقشه راه هلدینگ','راهبرد و برنامه‌ریزی','تدوین و هم‌راستاسازی راهبردها، اهداف کلان، شاخص‌ها و برنامه‌های اجرایی شرکت‌ها.','دفتر راهبرد و برنامه‌ریزی','2026-09-15','2027-01-31',['تحلیل محیط و وضع موجود','تدوین گزینه‌ها و محورهای راهبردی','تعریف اهداف و شاخص‌های کلیدی','تدوین نقشه راه و ابتکارات','تصویب و ابلاغ برنامه راهبردی']],
 ['ایجاد مرکز دانش و مدیریت مستندات','دانش و فناوری','ایجاد مخزن ساخت‌یافته دانش، اسناد، درس‌آموخته‌ها و محتوای تخصصی.','تیم مدیریت دانش','2026-10-01','2027-03-15',['طراحی طبقه‌بندی دانش و اسناد','تدوین الگوی ثبت و فراداده','پیاده‌سازی بانک محتوا و جست‌وجو','انتقال و پاک‌سازی محتوای موجود','تدوین فرایند نگهداری و به‌روزرسانی']],
 ['طراحی سامانه یکپارچه مدیریت شرکت‌ها','فناوری اطلاعات','طراحی بستر یکپارچه برای اطلاعات، عملکرد، گردش کار و گزارش شرکت‌های تابعه.','تیم تحول دیجیتال','2026-09-01','2027-06-30',['تحلیل نیازمندی‌های شرکت‌ها','طراحی معماری سامانه و داده','طراحی تجربه کاربری و نمونه تعاملی','توسعه ماژول‌های پایه','آزمون پذیرش و استقرار مرحله‌ای']],
 ['توسعه زیرساخت هوش مصنوعی هلدینگ','هوش مصنوعی و زیرساخت','ایجاد زیرساخت پردازش، ذخیره‌سازی، مدل‌ها و خدمات هوش مصنوعی سازمانی.','تیم زیرساخت و هوش مصنوعی','2026-10-15','2027-05-31',['تعیین کاربردها و نیاز پردازشی','ارزیابی سخت‌افزار و معماری زیرساخت','راه‌اندازی محیط اجرا و ذخیره‌سازی','استقرار مدل‌ها و سرویس‌های پایه','آزمون امنیت، کارایی و بهره‌برداری']],
 ['طراحی مدل سرمایه‌گذاری و تأمین مالی','اقتصادی و سرمایه‌گذاری','طراحی چارچوب ارزیابی فرصت‌ها، مدل مالی، منابع تأمین و پایش سرمایه‌گذاری.','گروه مالی و سرمایه‌گذاری','2026-09-01','2027-02-15',['شناسایی فرصت‌ها و معیارها','طراحی مدل مالی و سناریوها','تدوین سازوکار تأمین مالی','طراحی نظام کنترل و گزارش سرمایه','ارائه بسته تصمیم‌گیری سرمایه‌گذاری']],
 ['توسعه منابع انسانی و شبکه خبرگان','منابع انسانی','شناسایی تخصص‌ها، طراحی بانک خبرگان، مسیر رشد و سازوکار مشارکت متخصصان.','تیم سرمایه انسانی','2026-10-01','2027-04-15',['تدوین مدل شایستگی و تخصص','طراحی بانک اطلاعات خبرگان','تعریف سازوکار دعوت و مشارکت','طراحی مسیرهای یادگیری و رشد','راه‌اندازی ارزیابی و به‌روزرسانی']],
 ['طراحی نظام ارزیابی عملکرد و بهره‌وری','ارزیابی و کنترل','طراحی شاخص‌ها، روش سنجش، شواهد عملکرد و گزارش‌های دوره‌ای واحدها و پروژه‌ها.','دفتر ارزیابی عملکرد','2026-09-15','2027-03-31',['تعیین چارچوب و ابعاد ارزیابی','تدوین شاخص‌ها و تعاریف محاسباتی','طراحی فرم‌ها و گردش تأیید','ساخت گزارش‌ها و داشبوردها','اجرای آزمایشی و اصلاح نظام']],
 ['راه‌اندازی تعاونی مصرف و حمایت کارکنان','خدمات کارکنان','طراحی خدمات خرید اقساطی، تخفیف، تأمین کالاهای اساسی و پشتیبانی کارکنان.','گروه رفاه و تعاونی','2026-10-01','2027-05-01',['نیازسنجی و تحلیل تقاضای کارکنان','طراحی مدل تأمین و قراردادها','تدوین سازوکار اعتبار و اقساط','راه‌اندازی فهرست کالا و خدمات','آغاز خدمت‌رسانی و ارزیابی رضایت']],
 ['تدوین نظام حقوقی و مدیریت قراردادها','حقوقی و قراردادی','استانداردسازی قراردادها، کنترل تعهدات، مدیریت ریسک حقوقی و سوابق قراردادی.','مرکز حقوقی','2026-09-01','2027-02-28',['فهرست‌برداری از قراردادها و الگوها','تدوین طبقه‌بندی و گردش بررسی','طراحی بانک قرارداد و تعهدات','تهیه الگوهای استاندارد','آموزش و استقرار فرایند']],
 ['توسعه بازار و هویت برند گروه','بازاریابی و توسعه بازار','تدوین هویت برند، معرفی خدمات، تحلیل بازار و برنامه توسعه ارتباطات تجاری.','تیم توسعه بازار','2026-10-01','2027-04-30',['تحلیل بازار و ذی‌نفعان','تدوین جایگاه و پیام برند','طراحی هویت بصری و محتوایی','تدوین برنامه بازاریابی و ارتباطات','اجرای کمپین معرفی و سنجش اثر']],
 ['طراحی مرکز خدمات مشترک هلدینگ','خدمات مشترک','تجمیع و استانداردسازی خدمات پشتیبانی، اداری، فناوری و تخصصی مشترک.','دفتر خدمات مشترک','2026-09-15','2027-04-15',['شناسایی خدمات و مشتریان داخلی','طراحی کاتالوگ و سطح خدمت','تدوین مدل هزینه و پاسخ‌گویی','طراحی گردش درخواست و ارجاع','اجرای آزمایشی و سنجش کیفیت']],
 ['تدوین نظام مدیریت ریسک سازمانی','ریسک و تاب‌آوری','ایجاد چارچوب شناسایی، ارزیابی، پاسخ و پایش ریسک در سطح هلدینگ و پروژه‌ها.','دفتر ریسک و کنترل','2026-10-01','2027-03-31',['تدوین طبقه‌بندی ریسک‌ها','طراحی ماتریس احتمال و اثر','تعیین مالک و پاسخ ریسک','طراحی گزارش و شاخص هشدار','اجرای ارزیابی دوره‌ای']],
 ['طراحی و اجرای برنامه آموزش تخصصی','آموزش و توسعه','طراحی نیازسنجی، تقویم، محتوای آموزشی و ارزیابی اثربخشی دوره‌ها.','مرکز آموزش','2026-09-15','2027-03-15',['نیازسنجی آموزشی واحدها','تدوین سرفصل و تقویم دوره‌ها','تأمین مدرس و محتوای آموزشی','اجرای دوره‌های اولویت‌دار','سنجش یادگیری و اثربخشی']],
 ['ایجاد بستر ارتباطات امن سازمانی','فناوری و امنیت','طراحی ابزارهای ارتباطی امن برای پیام، جلسه، فایل و همکاری بین واحدها.','تیم فناوری و امنیت','2026-10-15','2027-05-31',['تعیین الزامات امنیت و دسترسی','انتخاب معماری و راهکار فنی','راه‌اندازی محیط آزمایشی','آزمون امنیت و کاربری','استقرار و آموزش کاربران']],
 ['پژوهش و تدوین اطلس فرصت‌های توسعه','پژوهش و مطالعات','گردآوری داده و تحلیل فرصت‌های جغرافیایی، اقتصادی و بخشی برای توسعه کسب‌وکار.','گروه پژوهش و تحلیل','2026-09-01','2027-03-01',['تعیین دامنه و شاخص‌های اطلس','گردآوری داده‌های پایه','تحلیل فرصت‌ها و اولویت‌بندی','تهیه نقشه‌ها و گزارش تحلیلی','انتشار اطلس و پیشنهاد اقدام']],
 ['طراحی نظام نوآوری و توسعه محصول','نوآوری و محصول','ایجاد فرایند دریافت ایده، ارزیابی، نمونه‌سازی، آزمون و تجاری‌سازی محصولات.','دفتر نوآوری','2026-10-01','2027-06-15',['تدوین فرایند نوآوری و معیارها','ایجاد سازوکار دریافت ایده','طراحی دروازه‌های ارزیابی','تعریف مسیر نمونه‌سازی و آزمون','طراحی تجاری‌سازی و انتقال به بازار']],
 ['سامان‌دهی بایگانی و حافظه سازمانی','مدیریت اطلاعات','سامان‌دهی پرونده‌ها، سوابق تصمیم، مکاتبات و مستندات برای دسترسی و بازیابی مطمئن.','تیم اسناد و بایگانی','2026-09-15','2027-02-15',['شناخت منابع و وضعیت اسناد','تدوین ساختار طبقه‌بندی و کدگذاری','طراحی فرایند اسکن و ثبت','انتقال و کنترل کیفیت داده‌ها','تدوین ضوابط دسترسی و نگهداری']]
 ];
 const now='2026-11-11',teamNames=['گروه راهبری','تیم تخصصی','کارگروه اجرایی','گروه پژوهش','تیم فناوری'],orgTargets=orgs().filter(x=>x.id!=='HOLDING');
 definitions.forEach((d,i)=>{
  const id='PRJ-SEED-'+fa(i+1).padStart(2,'۰');
  const start=d[4],end=d[5],progress=[42,28,55,36,22,31,18,26,33,47,15,38,29,24,19,44,21,34,17,40][i];
  const status=i===19?'در حال برنامه‌ریزی':i===14?'در حال برنامه‌ریزی':'مصوب / در اجرا';
  const p={id,title:d[0],domain:d[1],teamMembers:[d[3],teamNames[i%teamNames.length]],orgId:orgTargets[i%Math.max(1,orgTargets.length)]?.id||'HOLDING',priority:i<5?'راهبردی':i%4===0?'بالا':'عادی',sponsor:'مدیریت هلدینگ',manager:d[3],startDate:start,dueDate:end,strategyRef:'',budget:0,objective:d[2],summary:d[2],status,createdAt:now+'T09:00:00.000Z',baselines:[],archived:false,sampleData:true};
  db.projects.push(p);
  db.events.unshift({id:'EVT-SEED-P-'+fa(i+1),at:now+'T09:00:00.000Z',action:'seed-project',entity:p.id,title:'ایجاد پرونده پروژه: '+p.title,details:'ثبت شناسنامه، حوزه، مدیر و اعضای تیم و ایجاد برنامه پایه.'});
  const tasks=d[6].map((title,j)=>{
   const from=new Date(start+'T12:00:00');from.setDate(from.getDate()+Math.round((j/5)*((new Date(end+'T12:00:00')-from)/86400000)));
   const to=new Date(start+'T12:00:00');to.setDate(to.getDate()+Math.round(((j+1)/5)*((new Date(end+'T12:00:00')-to)/86400000)));
   const date=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
   const pct=j===0?100:j===1?Math.max(15,progress):j===2?Math.max(0,progress-15):0;
   const state=pct===100?'تکمیل‌شده':pct>0?'در حال اجرا':'در انتظار شروع';
   const task={id:'TSK-SEED-'+fa(i+1).padStart(2,'۰')+'-'+fa(j+1),title,projectId:id,workPackageId:'WPK-SEED-'+fa(i+1).padStart(2,'۰')+'-'+fa(j+1),orgId:p.orgId,workType:'بسته کاری پروژه',teamMembers:[teamNames[(i+j)%teamNames.length]],assignee:teamNames[(i+j)%teamNames.length],owner:d[3],startDate:date(from),dueDate:date(to),weight:[3,2,3,2,2][j],estimatedHours:[48,64,80,48,32][j],actualHours:0,priority:j===0?'بالا':'عادی',acceptance:'تحویل مستند و قابل بازبینی مطابق شرح فعالیت',status:state,reportedPercent:pct,approvedPercent:pct,history:[],archived:false,createdAt:now+'T09:00:00.000Z',sampleData:true};
   db.tasks.push(task);
   db.events.unshift({id:'EVT-SEED-T-'+fa(i+1)+'-'+fa(j+1),at:now+'T09:00:00.000Z',action:'seed-task',entity:task.id,title:'تعریف فعالیت: '+task.title,details:'مسئول اولیه: '+task.assignee+'؛ موعد برنامه‌ای: '+task.dueDate});
   db.workPackages.push({id:task.workPackageId,projectId:id,parentId:'',code:fa(j+1),title,owner:d[3],weight:task.weight,startDate:task.startDate,dueDate:task.dueDate,description:task.acceptance,status:pct===100?'تکمیل‌شده':pct>0?'در حال اجرا':'برنامه‌ریزی‌شده',createdAt:now+'T09:00:00.000Z',sampleData:true});
   return {id:task.id,title:task.title,startDate:task.startDate,dueDate:task.dueDate,weight:task.weight,workPackageId:task.workPackageId};
  });
  const ms=[{id:'MIL-SEED-'+fa(i+1)+'-۱',projectId:id,title:'تأیید طراحی و برنامه اجرایی',dueDate:tasks[1].dueDate,owner:d[3],acceptance:'تأیید برنامه و خروجی مرحله طراحی',status:'برنامه‌ریزی‌شده',sampleData:true},{id:'MIL-SEED-'+fa(i+1)+'-۲',projectId:id,title:'تحویل نهایی و ارزیابی نتیجه',dueDate:end,owner:d[3],acceptance:'تحویل کامل و تأیید خروجی‌های پروژه',status:'برنامه‌ریزی‌شده',sampleData:true}];
  db.milestones.push(...ms);
  p.baselines=[{version:1,approvedAt:now+'T09:00:00.000Z',startDate:start,endDate:end,tasks,packages:db.workPackages.filter(x=>x.projectId===id),milestones:ms,dependencies:[],workCalendar:{...db.workCalendar},sampleData:true}];
 });
 db.events.unshift({id:'EVT-SEED-001',at:now+'T09:00:00.000Z',action:'seed-portfolio',entity:'PORTFOLIO',title:'ایجاد بانک اولیه بیست پروژه',details:'ثبت ساختار سبد پروژه‌ها و گزارش‌های مدیریتی.'});
 db.samplePortfolioVersion=3;
}

async function load(){
 let vaultRaw=null,browserRaw=localStorage.getItem(KEY),raw=null;
 if(window.HoldingLocalDataVault){try{const r=await window.HoldingLocalDataVault.get(RECORD_ID);if(r?.content)vaultRaw=r.content;}catch(e){}}
 raw=vaultRaw||browserRaw;
 if(vaultRaw&&browserRaw){
  try{
   const a=JSON.parse(vaultRaw),b=JSON.parse(browserRaw);
   const score=x=>['projects','tasks','calls','workPackages','milestones','dependencies','resources','raids','changes','deliverables','events'].reduce((n,k)=>n+(Array.isArray(x?.[k])?x[k].length:0),0);
   if(score(b)>score(a)||(score(b)===score(a)&&Date.parse(b.updatedAt||0)>Date.parse(a.updatedAt||0)))raw=browserRaw;
  }catch(e){}
 }
 if(raw){try{const parsed=JSON.parse(raw);if(parsed&&Array.isArray(parsed.projects)){db={...blank(),...parsed,projects:Array.isArray(parsed.projects)?parsed.projects:[],tasks:Array.isArray(parsed.tasks)?parsed.tasks:[],calls:Array.isArray(parsed.calls)?parsed.calls:[],workPackages:Array.isArray(parsed.workPackages)?parsed.workPackages:[],milestones:Array.isArray(parsed.milestones)?parsed.milestones:[],dependencies:Array.isArray(parsed.dependencies)?parsed.dependencies:[],resources:Array.isArray(parsed.resources)?parsed.resources:[],raids:Array.isArray(parsed.raids)?parsed.raids:[],changes:Array.isArray(parsed.changes)?parsed.changes:[],deliverables:Array.isArray(parsed.deliverables)?parsed.deliverables:[],events:Array.isArray(parsed.events)?parsed.events:[],workCalendar:parsed.workCalendar||blank().workCalendar};}}catch(e){notice('خواندن داده‌های قبلی ممکن نشد؛ فضای خالی نمایش داده می‌شود.','error');}}
 if(db.projects.length===0&&Number(db.samplePortfolioVersion||0)<3)seedInitialPortfolio();
 if(Number(db.samplePortfolioVersion||0)<3){const targets=orgs().filter(x=>x.id!=='HOLDING');db.projects.forEach((p,i)=>{if(p.sampleData)p.orgId=targets[i%Math.max(1,targets.length)]?.id||'HOLDING';});db.tasks.forEach(t=>{const p=projectBy(t.projectId);if(t.sampleData&&p)t.orgId=p.orgId;});db.samplePortfolioVersion=3;}
 await save();
}
function notice(message,type='info'){const el=$('#app-status');if(!el)return;el.textContent=message;el.className='app-status show'+(type==='error'?' error':'');clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.className='app-status',5500);}
function weighted(tasks,key){
 const total=tasks.reduce((s,t)=>s+Math.max(1,Number(t.weight)||1),0);
 return total?tasks.reduce((s,t)=>s+Math.max(1,Number(t.weight)||1)*Math.max(0,Math.min(100,Number(t[key])||0)),0)/total:0;
}
function scheduledPercent(task,now=new Date(),calendar=db.workCalendar){
 if(!task.startDate||!task.dueDate)return null;
 const a=new Date(task.startDate+'T12:00:00'),b=new Date(task.dueDate+'T12:00:00');if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return null;
 const cal=calendar||{workDays:[0,1,2,3,4,6],holidays:[]},days=cal.workDays||[0,1,2,3,4,6],holidays=new Set(cal.holidays||[]),key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');let total=0,elapsed=0;
 for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)){if(days.includes(d.getDay())&&!holidays.has(key(d))){total++;if(d<=now)elapsed++;}}return total?Math.max(0,Math.min(100,elapsed/total*100)):null;
}
function projectMetrics(p){
 const tasks=tasksOf(p.id),actual=weighted(tasks,'approvedPercent'),reported=weighted(tasks,'reportedPercent');
 const base=p.baselines?.[p.baselines.length-1]||null;
 const schedule=base?.tasks?.length?base.tasks:tasks;
 const dated=schedule.filter(t=>t.startDate&&t.dueDate);
 const plan=dated.length?weighted(dated.map(t=>({...t,plannedPercent:scheduledPercent(t,new Date(),base?.workCalendar||db.workCalendar)})),'plannedPercent'):null;
 const duration=Math.max(1,Math.ceil((new Date((base?.endDate||p.dueDate||today())+'T12:00:00')-new Date((base?.startDate||p.startDate||today())+'T12:00:00'))/86400000));
 const variance=plan===null?null:Math.round((actual-plan)*duration/100);
 const due=base?.endDate||p.dueDate||null;
 const forecast=due&&variance!==null?addDays(due,-variance):due;
 return {tasks,actual,reported,plan,variance,due,forecast,baseline:base};
}
function addDays(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function statusClass(s){if(/تأخیر|متوقف|رد|مسئله/.test(s||''))return 'red';if(/مصوب|در اجرا|فعال|باز/.test(s||''))return 'blue';if(/انتظار|برنامه|بازبینی|بررسی/.test(s||''))return 'gold';return 'gray';}
function badge(s){return '<span class="pc-badge '+statusClass(s)+'">'+esc(s||'ثبت نشده')+'</span>';}
function progressBar(value,label){return '<div class="pc-progress"><span style="width:'+Math.max(0,Math.min(100,value||0))+'%"></span></div><div class="pc-progress-meta"><span>'+esc(label||'پیشرفت تأییدشده')+'</span><strong>'+fa(Math.round(value||0))+'٪</strong></div>';}
const pages={
 overview:['نمای کلی مدیریت پروژه‌ها','نمای تلفیقی وضعیت پروژه‌ها، کارها، زمان‌بندی و تعهدات'],
 projects:['بانک پروژه‌ها','ثبت درخواست، تصویب، اولویت‌بندی و مدیریت پروژه‌ها'],
 tasks:['کارها و اقدامات','واگذاری، پیگیری، گزارش پیشرفت و ثبت شواهد انجام کار'],
 planning:['برنامه‌ریزی، WBS و زمان‌بندی','ساختار شکست کار، نقاط عطف، روابط وابستگی و نمای گانت'],
 calls:['جمع‌سپاری سازمانی','فراخوان مشارکت، اعلام آمادگی و تخصیص مسئولیت'],
 resources:['منابع و ظرفیت','تخصیص نفرات، ظرفیت هفتگی و کنترل اضافه‌بار'],
 control:['ریسک، تغییر و کیفیت','ثبت RAID، درخواست تغییر و تحویل‌دادنی‌ها'],
 reports:['گزارش‌ها و تحلیل','مقایسه برنامه و واقعیت بر اساس داده‌های ثبت‌شده'],
 about:['معرفی و روش کار','مأموریت، چرخه عمر، نقش‌ها و مرزبندی مرکز'],
 settings:['داده و پشتیبان','ذخیره‌سازی محلی، خروجی و بازیابی اطلاعات مرکز']
};
function currentRoute(){const h=decodeURIComponent(location.hash.replace(/^#/,''));if(h.startsWith('project/'))return {page:'project',id:h.slice(8)};return {page:pages[h]?h:'overview'};}
function setHeader(page){
 const route=currentRoute(),project=page==='project'?projectBy(route.id):null;
 const meta=project?[project.title,'شناسنامه، برنامه، وظایف، پیشرفت و تاریخچه پروژه']:pages[page]||['جزئیات پروژه','شناسنامه، برنامه، وظایف، پیشرفت و تاریخچه'];
 document.title=meta[0]+' | مرکز پروژه‌های هلدینگ';
 $('#page-title').textContent=meta[0];$('#page-desc').textContent=meta[1];
 const navPage=page==='project'?'projects':page;
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===navPage));
}
function empty(title,copy){return '<div class="pc-empty"><strong>'+esc(title)+'</strong>'+esc(copy)+'</div>';}
function guidePanel(title,copy,steps,bullets,note='این بخش راهنمای ساختار و روش اجراست؛ داده‌های عملیاتی فقط پس از ثبت و تأیید در شاخص‌ها محاسبه می‌شوند.'){
 return '<section class="pc-panel pc-guide"><div class="pc-panel-head"><div><h3>'+esc(title)+'</h3><p>'+esc(copy)+'</p></div><span class="pc-badge blue">راهنمای اجرایی</span></div><div class="pc-grid"><div><h4 class="pc-section-title">گام‌های انجام کار</h4><ol class="pc-steps">'+steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div><div><h4 class="pc-section-title">کنترل‌های ضروری</h4><ul class="pc-bullets">'+bullets.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div><div class="pc-note info">'+esc(note)+'</div></section>';
}
const pageGuides={
 overview:['راهنمای شروع مرکز پروژه‌ها','مسیر استاندارد از تعریف مسئله تا تحویل و ارزیابی نتیجه',['ثبت مسئله، ضرورت و نتیجه مورد انتظار','ارزیابی و تصویب توسط مرجع دارای اختیار','تبدیل دامنه به بسته‌های کاری و وظایف قابل واگذاری','ثبت خط مبنا و دریافت گزارش‌های پیشرفت مستند','کنترل انحراف، تصمیم، تغییر و تحویل در پرونده پروژه'],['هر شاخص فقط از پرونده‌ها و وظایف ثبت‌شده محاسبه می‌شود.','پیشرفت اعلامی مجری با پیشرفت تأییدشده تفکیک می‌شود.','جمع‌سپاری با تعیین مالک کار و معیار پذیرش انجام می‌شود.','گزارش مدیریتی باید به داده ثبت‌شده و تاریخ به‌روزرسانی متصل باشد.']],
 projects:['الگوی ارزیابی و تصویب پروژه','برای یکسان‌سازی ورودی‌ها و جلوگیری از شروع پروژه‌های فاقد توجیه',['تعریف مسئله، ضرورت و وضعیت موجود','تعیین هدف، خروجی و شاخص سنجش موفقیت','تعیین حامی، مالک کسب‌وکار، مدیر و ذی‌نفعان','بررسی دامنه، گزینه‌ها، هزینه، منابع، ریسک و وابستگی','ثبت نظر کارشناسی و تصمیم مرجع دارای اختیار','پس از تصویب، ایجاد منشور و خط مبنای نسخه‌دار'],['درخواست ثبت‌شده به‌معنای تصویب پروژه نیست.','تصویب باید همراه مرجع اختیار، تاریخ و مستند تصمیم باشد.','تغییر دامنه یا موعد مصوب باید از مسیر کنترل تغییر عبور کند.']],
 tasks:['استاندارد تعریف و تحویل کار','هر اقدام باید خروجی مشخص، مالک پاسخ‌گو و موعد قابل کنترل داشته باشد',['عنوان را با فعل و نتیجه قابل مشاهده بنویسید.','نوع کار، قلمرو، پروژه مرتبط و منبع ارجاع را مشخص کنید.','یک مسئول پاسخ‌گو و در صورت نیاز همکار یا بازبین تعیین کنید.','موعد، اولویت، معیار تکمیل و شواهد مورد انتظار را ثبت کنید.','مجری گزارش دوره‌ای ارائه کند و مسئول مجاز نتیجه را تأیید کند.'],['کار مستقل بدون ایجاد پروژه نیز قابل ثبت است.','کار معوق، متوقف و منتظر تأیید باید از هم تفکیک شود.','پیشرفت قطعی فقط طبق قواعد تأیید ثبت می‌شود.']],
 planning:['روش برنامه‌ریزی و کنترل زمان','ساختار شکست کار، منطق وابستگی و خط مبنای قابل مقایسه',['خروجی نهایی را به تحویل‌دادنی‌های قابل پذیرش بشکنید.','بسته‌های کاری و وظایف را تا سطح قابل واگذاری تعریف کنید.','مدت، تقویم، مسئول و روابط پیش‌نیازی را ثبت کنید.','نقاط عطف و معیار تحقق هر مرحله را تعیین کنید.','پس از بازبینی، خط مبنای مصوب را نسخه‌گذاری کنید.','در دوره اجرا، برنامه را با پیشرفت واقعی تأییدشده مقایسه کنید.'],['تغییر تقویم جاری نباید خط مبنای قبلی را بازنویسی کند.','روابط FS، SS، FF و SF ثبت می‌شوند؛ مسیر بحرانی کامل در این نسخه فعال نیست.','هر تغییر برنامه باید دلیل و اثر زمانی/منابعی داشته باشد.']],
 calls:['چارچوب جمع‌سپاری سازمانی','جمع‌سپاری تقسیم مسئولانه کار است؛ نه واگذاری بی‌ضابطه پاسخ‌گویی',['کار واجد شرایط را به بسته کوچک و مستقل با خروجی روشن تبدیل کنید.','قلمرو انتشار، مهارت، ظرفیت، مهلت و سطح محرمانگی را تعیین کنید.','اعلام آمادگی‌ها را از نظر مهارت و زمان در دسترس ارزیابی کنید.','تخصیص نهایی را با تأیید مالک کار یا مدیر پروژه انجام دهید.','خروجی را با معیار پذیرش بازبینی و نتیجه را ثبت کنید.'],['مالک اصلی کار و مسئول پذیرش خروجی همواره مشخص می‌ماند.','کار محرمانه یا حاوی داده حساس فقط در قلمرو مجاز منتشر می‌شود.','مشارکت داوطلبانه جایگزین شرح وظیفه یا قرارداد نیست.','پیشرفت تا زمان پذیرش خروجی، قطعی محسوب نمی‌شود.']],
 resources:['روش مدیریت ظرفیت و بارکاری','تخصیص منابع باید بر پایه دسترس‌پذیری واقعی و دوره زمانی باشد',['مهارت و نقش موردنیاز هر بسته کاری را مشخص کنید.','ظرفیت قابل تخصیص فرد یا تیم را در دوره موردنظر برآورد کنید.','درصد تخصیص و ساعت هفتگی را با سایر تعهدات تطبیق دهید.','تعارض ظرفیت را پیش از تأیید برنامه رفع یا مستند کنید.','در بازبینی دوره‌ای، تخصیص را با پیشرفت و اولویت‌ها تطبیق دهید.'],['این مرکز پرونده پرسنلی و اطلاعات محرمانه منابع انسانی را نگهداری نمی‌کند.','تخصیص بیش از ظرفیت به‌عنوان تعارض علامت‌گذاری می‌شود.','هر تخصیص باید به پروژه و در صورت لزوم به وظیفه مشخص متصل باشد.']],
 control:['اصول کنترل یکپارچه پروژه','ثبت ریسک، مسئله، تغییر و معیار پذیرش خروجی در یک چرخه قابل ممیزی',['ریسک را پیش از وقوع، همراه احتمال، اثر و پاسخ ثبت کنید.','مسئله رخ‌داده را با مالک رفع و موعد اقدام پیگیری کنید.','فرض و وابستگی بیرونی را با مسئول پایش ثبت کنید.','درخواست تغییر را با اثر دامنه، زمان، هزینه و کیفیت ارزیابی کنید.','تحویل‌دادنی را با معیار پذیرش روشن بررسی و مستند کنید.'],['ثبت درخواست تغییر به‌معنای تصویب آن نیست.','خط مبنای مصوب تا تصمیم رسمی تغییر حفظ می‌شود.','پذیرش خروجی باید به مسئول و شواهد مشخص متکی باشد.']],
 reports:['راهنمای خواندن گزارش مدیریتی','گزارش‌ها فقط از داده‌های واقعی ثبت‌شده و دارای وضعیت روشن ساخته می‌شوند',['قلمرو سازمانی و دوره گزارش را قبل از تحلیل تعیین کنید.','پیشرفت واقعی تأییدشده را از پیشرفت اعلامی جدا بخوانید.','انحراف زمانی را فقط در صورت وجود خط مبنا و تاریخ‌های معتبر تفسیر کنید.','موارد معوق را بر اساس علت، مالک اقدام و موعد رفع تفکیک کنید.','خروجی گزارش را همراه زمان استخراج و فیلترهای اعمال‌شده نگهداری کنید.'],['عدد صفر به معنی نبود رکورد در این فضای داده است، نه اثبات نبود فعالیت در سازمان.','پیش‌بینی پایان فعلی برآورد ساده است و جایگزین CPM یا ارزش کسب‌شده نیست.','هیچ آمار یا عملکرد فرضی در نمودارها تزریق نمی‌شود.']],
 about:['اصول راهبری مرکز پروژه‌ها','مرزبندی مسئولیت‌ها و ارتباط با مراکز تخصصی هلدینگ',['مرکز راهبرد، اهداف و اولویت‌های مصوب را تعیین می‌کند.','مرکز پروژه‌ها برنامه اجرایی، مسئولیت، پیشرفت و تحویل را مدیریت می‌کند.','مرکز دانش درس‌آموخته‌ها و دانش قابل انتقال را نگهداری می‌کند.','مرکز رصد از داده‌های تأییدشده برای گزارش تلفیقی استفاده می‌کند.','مرکز ارزیابی، شواهد و نتایج را مستقل بررسی می‌کند.'],['این نسخه هنوز اتصال API زنده به سایر مراکز ندارد.','مرجعیت هر داده باید با شناسه و نسخه سند مشخص شود.','هیچ اختیار سازمانی یا گردش تصویب رسمی بدون مصوبه قابل فرض نیست.']],
 settings:['راهنمای حفاظت و انتقال داده','پشتیبان‌گیری، بازیابی و آماده‌سازی برای استقرار سازمانی',['پیش از تغییرات عمده، پشتیبان کامل JSON تهیه کنید.','فایل پشتیبان را در محل امن و با کنترل دسترسی نگهداری کنید.','بازیابی را ابتدا در محیط کنترل‌شده بررسی کنید.','تقویم کاری و تعطیلات را با تقویم رسمی مصوب تطبیق دهید.','برای چندکاربره‌سازی، احراز هویت و پایگاه‌داده مرکزی طراحی شود.'],['ذخیره‌سازی فعلی محلی و وابسته به مرورگر/دستگاه است.','پشتیبان JSON جایگزین پایگاه‌داده مرکزی و ممیزی سروری نیست.','اطلاعات حساس را در دستگاه یا حساب مشترک وارد نکنید.']],
 project:['راهنمای اداره پرونده پروژه','این پرونده مرجع زنده شناسنامه، برنامه، کارها، تصمیم‌ها و شواهد است',['شناسنامه و مالکیت پروژه را در تمام دوره به‌روز نگه دارید.','برنامه و WBS را بر اساس آخرین خط مبنای مصوب کنترل کنید.','گزارش‌های مجری را بررسی و فقط خروجی پذیرفته‌شده را در پیشرفت منظور کنید.','ریسک، مانع و تغییر را در همان پرونده ثبت کنید.','تاریخچه را در بازه موردنظر بررسی و تصمیم اصلاحی را به کار مشخص متصل کنید.'],['تاریخچه رویداد در این نسخه محلی و محدود به ۵۰۰ رویداد اخیر است.','پیش‌بینی انحراف فعلی برآوردی است و محاسبه مسیر بحرانی کامل نیست.','اسناد و تصمیم‌های مرجع باید با شناسه و نسخه معتبر پیوند داده شوند.']]
};
function pageItems(items,key,renderItem,size=8){
 const total=Math.max(1,Math.ceil(items.length/size)),page=Math.max(1,Math.min(total,Number(pageState[key])||1));pageState[key]=page;
 const body=items.slice((page-1)*size,page*size).map(renderItem).join('');
 const pager=items.length>size?'<nav class="pc-pagination" aria-label="صفحه‌بندی"><button class="pc-page-btn" data-action="page" data-page-key="'+key+'" data-page-index="'+(page-1)+'" '+(page===1?'disabled':'')+'>قبلی</button><span>صفحه '+fa(page)+' از '+fa(total)+' · '+fa(items.length)+' مورد</span><button class="pc-page-btn" data-action="page" data-page-key="'+key+'" data-page-index="'+(page+1)+'" '+(page===total?'disabled':'')+'>بعدی</button></nav>':'<div class="pc-list-count">'+fa(items.length)+' مورد</div>';
 return '<div class="pc-paged-items">'+body+'</div>'+pager;
}
function pageTableRows(items,key,renderRow,size=10){
 const total=Math.max(1,Math.ceil(items.length/size)),page=Math.max(1,Math.min(total,Number(pageState[key])||1));pageState[key]=page;
 const rows=items.slice((page-1)*size,page*size).map(renderRow).join('');
 const pager=items.length>size?'<nav class="pc-pagination" aria-label="صفحه‌بندی"><button class="pc-page-btn" data-action="page" data-page-key="'+key+'" data-page-index="'+(page-1)+'" '+(page===1?'disabled':'')+'>قبلی</button><span>صفحه '+fa(page)+' از '+fa(total)+' · '+fa(items.length)+' مورد</span><button class="pc-page-btn" data-action="page" data-page-key="'+key+'" data-page-index="'+(page+1)+'" '+(page===total?'disabled':'')+'>بعدی</button></nav>':'<div class="pc-list-count">'+fa(items.length)+' مورد</div>';
 return '<tbody>'+rows+'</tbody>'+pager;
}
function progressRing(value,label='تکمیل'){
 const pct=Math.max(0,Math.min(100,Number(value)||0));
 return '<div class="pc-ring-wrap"><div class="pc-progress-ring" style="--ring-value:'+pct+'%"><div><strong>'+fa(Math.round(pct))+'٪</strong><small>'+esc(label)+'</small></div></div></div>';
}
function donutChart(title,data,centerLabel='مورد'){
 const rows=data.filter(x=>x.count>0),total=rows.reduce((n,x)=>n+x.count,0);
 if(!total)return '<article class="pc-panel pc-donut-panel"><h3 class="pc-section-title">'+esc(title)+'</h3>'+empty('داده‌ای برای نمایش وجود ندارد','با ثبت اطلاعات در این بخش، توزیع آماری نمایش داده می‌شود.')+'</article>';
 const colors=['#2878d0','#e45b75','#f2a33a','#7659d1','#18a7a0','#d85aa9','#53a65b','#e16c36','#4e9bd8','#b38b2d','#7e8997'];
 let cursor=0;const stops=rows.map((x,i)=>{const start=cursor;cursor+=x.count/total*100;return colors[i%colors.length]+' '+start.toFixed(2)+'% '+cursor.toFixed(2)+'%';}).join(',');
 return '<article class="pc-panel pc-donut-panel"><h3 class="pc-section-title">'+esc(title)+'</h3><div class="pc-donut-layout"><div class="pc-donut" style="--donut-stops:'+stops+'"><div><strong>'+fa(total)+'</strong><small>'+esc(centerLabel)+'</small></div></div><div class="pc-donut-legend">'+rows.map((x,i)=>'<div><i style="--legend-color:'+colors[i%colors.length]+'"></i><span>'+esc(x.label)+'</span><b>'+fa(x.count)+'</b><small>'+fa(Math.round(x.count/total*100))+'٪</small></div>').join('')+'</div></div></article>';
}
function stat(label,value,unit=''){const shown=typeof value==='number'?fa(value):esc(value);return '<div class="pc-stat"><small>'+esc(label)+'</small><strong>'+shown+'</strong><em>'+esc(unit)+'</em></div>';}
function eventList(items,limit=9,key='events'){
 if(!items.length)return empty('هنوز رویدادی ثبت نشده است','با ثبت پروژه، وظیفه یا گزارش، تاریخچه اقدامات در این قسمت نمایش داده می‌شود.');
 return '<div class="pc-timeline">'+pageItems(items,key,e=>'<div class="pc-event" data-event-date="'+esc(String(e.at||'').slice(0,10))+'"><time>'+fmtDateTime(e.at)+'</time><div><strong>'+esc(e.title)+'</strong><p>'+esc(e.details||e.action||'')+'</p></div></div>',limit)+'</div>';
}
function projectCard(p){
 const m=projectMetrics(p);
 return '<article class="pc-project-card"><div class="pc-project-card-head"><div><h4>'+esc(p.title)+'</h4>'+badge(p.status)+'</div>'+progressRing(m.actual,'تکمیل')+'</div><p>'+esc(p.summary||'شرح کوتاه پروژه ثبت نشده است.')+'</p><div class="pc-card-meta"><span class="pc-badge org">'+esc(orgLabel(p.orgId))+'</span>'+(p.domain?'<span class="pc-badge domain">'+esc(p.domain)+'</span>':'')+(p.teamMembers?.length?'<span class="pc-badge">تیم اصلی: '+fa(p.teamMembers.length)+' نفر</span>':'')+'<span class="pc-badge">موعد: '+fmtDate(p.dueDate)+'</span><span class="pc-badge">'+fa(m.tasks.length)+' کار</span></div>'+progressBar(m.actual,'پیشرفت تأییدشده')+'<div class="pc-card-actions"><button class="pc-btn secondary" data-action="open-project" data-id="'+p.id+'">مشاهده پرونده</button>'+(p.status==='در انتظار تصویب'?'<button class="pc-btn gold" data-action="approve-project" data-id="'+p.id+'">تصویب درخواست</button>':'')+'</div></article>';
}
function projectCard(p){
 const m=projectMetrics(p);
 return '<article class="pc-project-card"><div class="pc-panel-head"><h4>'+esc(p.title)+'</h4>'+badge(p.status)+'</div><p>'+esc(p.summary||'شرح کوتاه پروژه ثبت نشده است.')+'</p><div class="pc-card-meta"><span class="pc-badge">'+esc(orgLabel(p.orgId))+'</span>'+(p.domain?'<span class="pc-badge">'+esc(p.domain)+'</span>':'')+(p.teamMembers?.length?'<span class="pc-badge">تیم اصلی: '+fa(p.teamMembers.length)+' نفر</span>':'')+'<span class="pc-badge">موعد: '+fmtDate(p.dueDate)+'</span><span class="pc-badge">'+fa(m.tasks.length)+' کار</span></div>'+progressBar(m.actual,'پیشرفت تأییدشده')+'<div class="pc-card-actions"><button class="pc-btn secondary" data-action="open-project" data-id="'+p.id+'">مشاهده پرونده</button>'+(p.status==='در انتظار تصویب'?'<button class="pc-btn gold" data-action="approve-project" data-id="'+p.id+'">تصویب درخواست</button>':'')+'</div></article>';
}

function packagesOf(pid){return db.workPackages.filter(x=>x.projectId===pid&&!x.archived);}
function packageBy(id){return db.workPackages.find(x=>x.id===id);}
function packageProgress(pkg){const ids=[pkg.id];let more=true;while(more){more=false;packagesOf(pkg.projectId).forEach(x=>{if(ids.includes(x.parentId)&&!ids.includes(x.id)){ids.push(x.id);more=true;}});}return weighted(db.tasks.filter(t=>ids.includes(t.workPackageId)),'approvedPercent');}
function packageTree(pid,parent='',level=0){return packagesOf(pid).filter(x=>(x.parentId||'')===parent).map(x=>'<div class="pc-wbs-row" data-level="'+Math.min(3,level)+'"><span class="pc-wbs-code">'+esc(x.code||'—')+'</span><span class="pc-wbs-name" style="padding-right:'+Math.min(36,level*18)+'px">'+esc(x.title)+'</span><span class="pc-wbs-meta">'+esc(x.owner||'بدون مالک')+' · '+fa(Math.round(packageProgress(x)))+'٪</span></div>'+(packagesOf(pid).some(y=>y.parentId===x.id)?packageTree(pid,x.id,level+1):'')).join('');}
function ganttView(){const rows=[...db.workPackages.map(x=>({t:x.title,s:x.startDate,e:x.dueDate,k:'package'})),...db.tasks.filter(x=>!x.archived).map(x=>({t:x.title,s:x.startDate,e:x.dueDate,k:'task'})),...db.milestones.map(x=>({t:x.title,s:x.dueDate,e:x.dueDate,k:'milestone'}))].filter(x=>x.s||x.e);if(!rows.length)return empty('برنامه زمان‌بندی خالی است','برای بسته‌ها و وظایف تاریخ تعیین کنید و نقاط عطف را ثبت کنید.');const ds=rows.flatMap(x=>[x.s,x.e].filter(Boolean)).map(x=>new Date(x+'T12:00:00').getTime()).filter(Number.isFinite),min=Math.min(...ds),max=Math.max(...ds),span=Math.max(1,max-min);return '<div class="pc-gantt-legend"><span><i></i>بسته کاری / وظیفه</span><span><i class="milestone"></i>نقطه عطف</span><span>'+fmtDate(new Date(min).toISOString().slice(0,10))+' تا '+fmtDate(new Date(max).toISOString().slice(0,10))+'</span></div><div class="pc-table-wrap"><div class="pc-gantt" style="padding:12px">'+rows.map(x=>{const a=new Date((x.s||x.e)+'T12:00:00').getTime(),b=new Date((x.e||x.s)+'T12:00:00').getTime(),l=Math.max(0,(a-min)/span*100),w=Math.max(1.2,Math.min(100-l,(b-a)/span*100));return '<div class="pc-gantt-row"><span class="pc-gantt-label">'+esc(x.t)+'</span><div class="pc-gantt-track">'+(x.k==='milestone'?'<i class="pc-gantt-milestone" style="right:'+l+'%"></i>':'<i class="pc-gantt-bar '+(x.k==='package'?'package':'')+'" style="right:'+l+'%;width:'+w+'%"></i>')+'</div></div>';}).join('')+'</div></div>';}
function renderPlanning(){const ps=activeProjects(),opts=ps.map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join('');const pkg='<details class="pc-panel"><summary class="pc-section-title">＋ افزودن بسته کاری به WBS</summary><form class="pc-form" id="package-form"><div class="pc-field"><label>پروژه *</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>بسته والد</label><select name="parentId"><option value="">سطح اصلی</option>'+db.workPackages.map(x=>'<option value="'+x.id+'">'+esc(projectBy(x.projectId)?.title||'')+' · '+esc(x.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>کد WBS</label><input name="code" placeholder="۱.۲.۱"></div><div class="pc-field"><label>عنوان بسته *</label><input name="title" required></div><div class="pc-field"><label>مالک بسته</label><input name="owner"></div><div class="pc-field"><label>وزن</label><input name="weight" type="number" min="1" value="1"></div><div class="pc-field"><label>شروع</label><input name="startDate" type="date"></div><div class="pc-field"><label>پایان</label><input name="dueDate" type="date"></div><div class="pc-field full"><label>شرح خروجی</label><textarea name="description"></textarea></div><div class="pc-field full"><button class="pc-btn">ثبت بسته کاری</button></div></form></details>';
 const mile='<details class="pc-panel"><summary class="pc-section-title">＋ ثبت نقطه عطف</summary><form class="pc-form" id="milestone-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>عنوان</label><input name="title" required></div><div class="pc-field"><label>تاریخ هدف</label><input name="dueDate" type="date" required></div><div class="pc-field"><label>مالک</label><input name="owner"></div><div class="pc-field full"><label>معیار تحقق</label><textarea name="acceptance"></textarea></div><div class="pc-field full"><button class="pc-btn">ثبت نقطه عطف</button></div></form></details>';
 const dep='<details class="pc-panel"><summary class="pc-section-title">＋ ثبت وابستگی وظایف</summary><form class="pc-form" id="dependency-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>پیش‌نیاز</label><select name="predecessorId" required>'+db.tasks.map(x=>'<option value="'+x.id+'">'+esc(projectBy(x.projectId)?.title||'')+' · '+esc(x.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>وظیفه وابسته</label><select name="successorId" required>'+db.tasks.map(x=>'<option value="'+x.id+'">'+esc(projectBy(x.projectId)?.title||'')+' · '+esc(x.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>رابطه</label><select name="type"><option value="FS">پایان به آغاز (FS)</option><option value="SS">آغاز به آغاز (SS)</option><option value="FF">پایان به پایان (FF)</option><option value="SF">آغاز به پایان (SF)</option></select></div><div class="pc-field"><label>وقفه/همپوشانی روز</label><input name="lagDays" type="number" value="0"></div><div class="pc-field full"><button class="pc-btn">ثبت وابستگی</button></div></form></details>';
 const tree=ps.length?pageItems(ps,'planning-projects',p=>'<section class="pc-panel"><h3 class="pc-section-title">'+esc(p.title)+'</h3>'+(packageTree(p.id)||empty('WBS تعریف نشده است','بسته‌های کاری چندسطحی را اضافه کنید.'))+'</section>',5):empty('پروژه‌ای ثبت نشده است','ابتدا یک پروژه ایجاد و تصویب کنید.');
 const milestones=db.milestones.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>نقطه عطف</th><th>پروژه</th><th>موعد</th><th>وضعیت</th><th>اقدام</th></tr></thead>'+pageTableRows(db.milestones,'milestones',x=>'<tr><td>'+esc(x.title)+'</td><td>'+esc(projectBy(x.projectId)?.title||'—')+'</td><td>'+fmtDate(x.dueDate)+'</td><td>'+badge(x.status)+'</td><td>'+(x.status!=='تحقق‌یافته'?'<button class="pc-btn gold" data-action="complete-milestone" data-id="'+x.id+'">ثبت تحقق</button>':'—')+'</td></tr>',10)+'</table></div>':empty('نقطه عطفی ثبت نشده است','موعدهای کلیدی را ثبت کنید.');
 const deps=db.dependencies.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>پیش‌نیاز</th><th>وابسته</th><th>رابطه</th><th>وقفه</th></tr></thead>'+pageTableRows(db.dependencies,'dependencies',x=>'<tr><td>'+esc(db.tasks.find(t=>t.id===x.predecessorId)?.title||'—')+'</td><td>'+esc(db.tasks.find(t=>t.id===x.successorId)?.title||'—')+'</td><td>'+esc(x.type)+'</td><td>'+fa(x.lagDays||0)+' روز</td></tr>',10)+'</table></div>':empty('وابستگی تعریف نشده است','رابطه منطقی بین وظایف را مشخص کنید.');
 return '<section class="pc-hero"><div><div class="pc-kicker">برنامه‌ریزی اجرایی</div><h3>دامنه را به بسته‌های قابل واگذاری تبدیل کنید</h3><p>WBS چندسطحی، نقاط عطف و روابط وابستگی؛ نسخه خط مبنا در پرونده پروژه حفظ می‌شود.</p></div><div class="pc-hero-side"><strong>'+fa(db.workPackages.length)+'</strong><span>بسته کاری</span></div></section>'+pkg+mile+dep+'<section class="pc-panel"><h3 class="pc-section-title">ساختار شکست کار (WBS)</h3>'+tree+'</section><section class="pc-panel"><h3 class="pc-section-title">نقاط عطف</h3>'+milestones+'</section><section class="pc-panel"><h3 class="pc-section-title">وابستگی فعالیت‌ها</h3><p class="pc-help">روابط FS، SS، FF و SF ثبت می‌شوند؛ محاسبه مسیر بحرانی هنوز در این نسخه فعال نیست.</p>'+deps+'</section><section class="pc-panel"><h3 class="pc-section-title">نمای گانت</h3>'+ganttView()+'</section>';}
function renderResources(){const ps=activeProjects(),form='<details class="pc-panel"><summary class="pc-section-title">＋ تخصیص ظرفیت</summary><form class="pc-form" id="resource-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+ps.map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>وظیفه</label><select name="taskId">'+db.tasks.map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>فرد / تیم</label><input name="name" required></div><div class="pc-field"><label>نقش / مهارت</label><input name="role"></div><div class="pc-field"><label>درصد ظرفیت</label><input name="capacityPercent" type="number" min="1" max="100" value="25"></div><div class="pc-field"><label>ساعت هفتگی</label><input name="weeklyHours" type="number" min="0" value="10"></div><div class="pc-field"><label>شروع</label><input name="startDate" type="date"></div><div class="pc-field"><label>پایان</label><input name="endDate" type="date"></div><div class="pc-field full"><button class="pc-btn">ثبت تخصیص</button></div></form></details>';const rows=db.resources.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>فرد/تیم</th><th>پروژه</th><th>نقش</th><th>ظرفیت</th><th>دوره</th><th>وضعیت</th></tr></thead><tbody>'+db.resources.map(x=>{const total=db.resources.filter(y=>y.name.toLowerCase()===x.name.toLowerCase()&&y.id!==x.id&&(!x.startDate||!y.endDate||y.endDate>=x.startDate)&&(!x.endDate||!y.startDate||y.startDate<=x.endDate)).reduce((s,y)=>s+(Number(y.capacityPercent)||0),Number(x.capacityPercent)||0);return '<tr><td>'+esc(x.name)+'</td><td>'+esc(projectBy(x.projectId)?.title||'—')+'</td><td>'+esc(x.role||'—')+'</td><td>'+fa(x.capacityPercent)+'٪ · '+fa(x.weeklyHours)+' ساعت</td><td>'+fmtDate(x.startDate)+' تا '+fmtDate(x.endDate)+'</td><td>'+badge(total>100?'تعارض ظرفیت '+fa(total)+'٪':'ثبت‌شده')+'</td></tr>';}).join('')+'</tbody></table></div>':empty('تخصیصی ثبت نشده است','ظرفیت نفرات و تیم‌ها را ثبت کنید.');return '<section class="pc-hero"><div><div class="pc-kicker">مدیریت منابع و بارکاری</div><h3>تخصیص بر اساس ظرفیت و بازه زمانی</h3><p>پرونده پرسنلی نزد مرکز منابع انسانی باقی می‌ماند؛ اینجا فقط اطلاعات حداقلی موردنیاز پروژه نگهداری می‌شود.</p></div><div class="pc-hero-side"><strong>'+fa(db.resources.length)+'</strong><span>تخصیص ثبت‌شده</span></div></section>'+form+'<section class="pc-panel"><h3 class="pc-section-title">تخصیص نفرات و تیم‌ها</h3>'+rows+'</section>';}
function renderControl(){const ps=activeProjects(),opts=ps.map(x=>'<option value="'+x.id+'">'+esc(x.title)+'</option>').join(''),raidForm='<details class="pc-panel"><summary class="pc-section-title">＋ ثبت RAID</summary><form class="pc-form" id="raid-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>نوع</label><select name="type"><option>ریسک</option><option>مسئله</option><option>فرض</option><option>وابستگی بیرونی</option></select></div><div class="pc-field full"><label>شرح</label><textarea name="description" required></textarea></div><div class="pc-field"><label>احتمال ۱ تا ۵</label><input name="probability" type="number" min="1" max="5" value="3"></div><div class="pc-field"><label>اثر ۱ تا ۵</label><input name="impact" type="number" min="1" max="5" value="3"></div><div class="pc-field"><label>مالک</label><input name="owner"></div><div class="pc-field"><label>موعد اقدام</label><input name="dueDate" type="date"></div><div class="pc-field full"><label>پاسخ / اقدام کاهنده</label><textarea name="response"></textarea></div><div class="pc-field full"><button class="pc-btn">ثبت مورد</button></div></form></details>',changeForm='<details class="pc-panel"><summary class="pc-section-title">＋ درخواست تغییر</summary><form class="pc-form" id="change-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>عنوان تغییر</label><input name="title" required></div><div class="pc-field full"><label>علت</label><textarea name="reason"></textarea></div><div class="pc-field"><label>اثر دامنه</label><input name="scopeImpact"></div><div class="pc-field"><label>اثر زمان (روز)</label><input name="timeImpact" type="number" value="0"></div><div class="pc-field"><label>اثر هزینه (تومان)</label><input name="costImpact" type="number" value="0"></div><div class="pc-field"><label>اثر کیفیت</label><input name="qualityImpact"></div><div class="pc-field full"><button class="pc-btn">ثبت برای بررسی</button></div></form></details>',deliverForm='<details class="pc-panel"><summary class="pc-section-title">＋ تعریف تحویل‌دادنی</summary><form class="pc-form" id="deliverable-form"><div class="pc-field"><label>پروژه</label><select name="projectId" required>'+opts+'</select></div><div class="pc-field"><label>عنوان خروجی</label><input name="title" required></div><div class="pc-field"><label>مالک</label><input name="owner"></div><div class="pc-field"><label>موعد</label><input name="dueDate" type="date"></div><div class="pc-field full"><label>معیار پذیرش</label><textarea name="criteria"></textarea></div><div class="pc-field full"><button class="pc-btn">ثبت خروجی</button></div></form></details>';const raids=db.raids.length?db.raids.map(x=>'<div class="pc-alert-row"><div><strong>'+esc(x.type)+' · '+esc(projectBy(x.projectId)?.title||'')+'</strong><div>'+esc(x.description)+'</div><small>مالک: '+esc(x.owner||'—')+' · امتیاز: '+fa((x.probability||1)*(x.impact||1))+'/۲۵ · '+fmtDate(x.dueDate)+'</small></div><div>'+badge(x.status)+' '+(x.status!=='بسته'?'<button class="pc-btn secondary" data-action="close-raid" data-id="'+x.id+'">بستن</button>':'')+'</div></div>').join(''):empty('مورد RAID ثبت نشده است','ریسک، مسئله، فرض و وابستگی بیرونی را ثبت کنید.'),changes=db.changes.length?db.changes.map(x=>'<div class="pc-alert-row"><div><strong>'+esc(x.title)+'</strong><div>'+esc(projectBy(x.projectId)?.title||'')+' · '+esc(x.reason||'')+'</div><small>زمان: '+fa(x.timeImpact||0)+' روز · هزینه: '+fa(x.costImpact||0)+' تومان · '+esc(x.scopeImpact||'—')+'</small></div><div>'+badge(x.status)+' '+(x.status==='در انتظار بررسی'?'<button class="pc-btn gold" data-action="approve-change" data-id="'+x.id+'">تصویب</button><button class="pc-btn secondary" data-action="reject-change" data-id="'+x.id+'">رد</button>':'')+'</div></div>').join(''):empty('درخواست تغییری ثبت نشده است','تغییرات دامنه، زمان و هزینه را پیش از اجرا ثبت کنید.'),deliver=db.deliverables.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>خروجی</th><th>پروژه</th><th>موعد</th><th>وضعیت</th><th>اقدام</th></tr></thead><tbody>'+db.deliverables.map(x=>'<tr><td>'+esc(x.title)+'<small>'+esc(x.criteria||'')+'</small></td><td>'+esc(projectBy(x.projectId)?.title||'—')+'</td><td>'+fmtDate(x.dueDate)+'</td><td>'+badge(x.status)+'</td><td>'+(x.status!=='پذیرفته‌شده'?'<button class="pc-btn gold" data-action="accept-deliverable" data-id="'+x.id+'">پذیرش</button>':'—')+'</td></tr>').join('')+'</tbody></table></div>':empty('تحویل‌دادنی ثبت نشده است','خروجی‌ها و معیار پذیرش را تعریف کنید.');return '<section class="pc-hero"><div><div class="pc-kicker">کنترل دامنه، ریسک و کیفیت</div><h3>تغییر و ریسک باید قابل ردیابی باشند</h3><p>گردش ثبت و تعیین تکلیف در این نسخه محلی است و هنوز جایگزین تصویب سازمانی چندمرحله‌ای نیست.</p></div><div class="pc-hero-side"><strong>'+fa(db.raids.filter(x=>x.status!=='بسته').length)+'</strong><span>مورد کنترلی باز</span></div></section>'+raidForm+changeForm+deliverForm+'<section class="pc-panel"><h3 class="pc-section-title">دفتر RAID</h3>'+raids+'</section><section class="pc-panel"><h3 class="pc-section-title">درخواست‌های تغییر</h3>'+changes+'</section><section class="pc-panel"><h3 class="pc-section-title">تحویل‌دادنی‌ها</h3>'+deliver+'</section>';}


function portfolioCharts(){
 const ps=activeProjects(),ts=db.tasks.filter(t=>!t.archived);
 const projectStates=['مصوب / در اجرا','در حال برنامه‌ریزی','در انتظار تصویب','متوقف','مختومه'].map(label=>({label,count:ps.filter(p=>p.status===label).length}));
 const taskStates=['تکمیل‌شده','در حال اجرا','در انتظار شروع','در انتظار تأیید','متوقف'].map(label=>({label,count:ts.filter(t=>t.status===label).length}));
 const orgData=orgs().filter(o=>o.id!=='HOLDING').map(o=>({label:o.label,count:ps.filter(p=>p.orgId===o.id).length})).filter(x=>x.count);
 const top=ps.map(p=>({p,m:projectMetrics(p)})).sort((a,b)=>b.m.actual-a.m.actual).slice(0,6);
 return '<section class="pc-donut-grid">'+donutChart('ترکیب پروژه‌ها بر اساس وضعیت',projectStates,'پروژه')+donutChart('ترکیب وظایف بر اساس وضعیت',taskStates,'وظیفه')+donutChart('توزیع پروژه‌ها در معاونت‌ها و شرکت‌ها',orgData,'پروژه')+'</section><section class="pc-panel"><div class="pc-panel-head"><div><h3>درصد تکمیل پروژه‌ها</h3><p>درصدها بر اساس پیشرفت تأییدشده وظایف هر پروژه محاسبه می‌شوند.</p></div><a class="pc-btn secondary" href="#reports">گزارش‌های تفصیلی</a></div>'+(top.length?'<div class="pc-progress-ranking">'+top.map(x=>'<a href="#project/'+x.p.id+'"><span>'+esc(x.p.title)+'</span>'+progressRing(x.m.actual,'تکمیل')+'<div class="pc-analytics-track"><i style="width:'+Math.max(0,Math.min(100,x.m.actual))+'%"></i></div><b>'+fa(Math.round(x.m.actual))+'٪</b></a>').join('')+'</div>':empty('پروژه‌ای ثبت نشده است','با ایجاد پروژه، نمودار پیشرفت در این بخش نمایش داده می‌شود.'))+'</section>';
}
function overviewGuide(){
 return '<section class="pc-overview-how"><div><b>چطور از این مرکز استفاده کنید؟</b><p>از ثبت هدف تا تحویل نتیجه، همه مراحل در پرونده پروژه پیگیری می‌شوند.</p></div><div class="pc-overview-how-grid"><article><i>۱</i><strong>تعریف پروژه</strong><span>هدف، حوزه، حامی، مدیر و زمان آغاز و پایان</span></article><article><i>۲</i><strong>برنامه‌ریزی</strong><span>ساختار شکست کار، بسته‌ها، نقاط عطف و خط مبنا</span></article><article><i>۳</i><strong>تقسیم وظایف</strong><span>تعیین مسئول، همکار، موعد و معیار پذیرش هر کار</span></article><article><i>۴</i><strong>پایش و تحویل</strong><span>ثبت گزارش، مقایسه برنامه و واقعیت و تأیید خروجی</span></article></div></section>';
}
function renderOverview(){
 const ps=activeProjects(),ts=db.tasks.filter(t=>!t.archived),late=ts.filter(t=>t.dueDate&&t.dueDate<today()&&t.status!=='تکمیل‌شده'&&t.status!=='مختومه').length;
 const waiting=ps.filter(p=>p.status==='در انتظار تصویب').length,calls=db.calls.filter(c=>c.status==='باز').length;
 const risk=ps.filter(p=>{const m=projectMetrics(p);return m.variance!==null&&m.variance< -2;}).length;
 return '<section class="pc-hero"><div><div class="pc-kicker">مدیریت یکپارچه سبد، پروژه و کار</div><h3>از تصمیم تا نتیجه؛ با سابقه قابل پیگیری</h3><p>در این مرکز، پروژه‌ها به کارهای قابل واگذاری و سنجش تبدیل می‌شوند. برنامه مصوب، گزارش مجری، پیشرفت تأییدشده و تاریخچه تغییرات از یکدیگر تفکیک می‌شوند تا گزارش مدیریتی قابل اتکا باشد.</p></div><div class="pc-hero-side"><strong>'+fa(ps.length)+'</strong><span>پروژه ثبت‌شده</span></div></section>'+overviewGuide()+
 '<div class="pc-stats">'+stat('پروژه‌های فعال',ps.filter(p=>!['مختومه','لغوشده','بایگانی‌شده'].includes(p.status)).length,'پروژه')+stat('کل وظایف',ts.length,'کار')+stat('وظایف سررسیدگذشته',late,'نیازمند پیگیری')+stat('در انتظار تصویب',waiting,'درخواست')+stat('فراخوان‌های باز',calls,'مشارکت')+'</div>'+portfolioCharts()+
 '<div class="pc-grid"><section class="pc-panel"><div class="pc-panel-head"><div><h3>پروژه‌های نیازمند توجه</h3><p>پروژه‌هایی با انحراف برنامه یا درخواست در انتظار تصمیم</p></div><a class="pc-btn secondary" href="#projects">همه پروژه‌ها</a></div>'+
 (risk||waiting?'<div class="pc-note warn">'+fa(risk)+' پروژه دارای عقب‌ماندگی محاسبه‌شده و '+fa(waiting)+' درخواست در انتظار تصویب است.</div>':'<div class="pc-note info">وضعیت انحراف فقط در صورت وجود خط مبنا و زمان‌بندی معتبر محاسبه می‌شود.</div>')+
 (ps.length?'<div class="pc-grid">'+ps.slice(0,4).map(projectCard).join('')+'</div>':empty('هنوز پروژه‌ای ثبت نشده است','از بخش پروژه‌ها، درخواست یا پروژه جدید را ثبت کنید.'))+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>آخرین اقدامات ثبت‌شده</h3><p>تاریخچه محلی رویدادهای مرکز</p></div></div>'+eventList(db.events)+'</section></div>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>دسترسی سریع</h3><p>ورود به مسیرهای اصلی کار</p></div></div><div class="pc-grid three">'+
 [['projects','▤','ثبت و مدیریت پروژه','درخواست، تصویب و ساختار سبد'],['tasks','✓','کارتابل کارها','واگذاری و گزارش پیشرفت'],['calls','⇄','فراخوان مشارکت','جمع‌سپاری و تخصیص همکاری']].map(x=>'<a class="pc-project-card" href="#'+x[0]+'"><h4>'+x[1]+' '+x[2]+'</h4><p>'+x[3]+'</p></a>').join('')+'</div></section>';
}
function projectForm(){
 return '<details class="pc-panel" open><summary class="pc-section-title">＋ ثبت درخواست یا پروژه جدید</summary><form class="pc-form" id="project-form">'+
 '<div class="pc-field full"><label>عنوان پروژه / درخواست *</label><input name="title" required maxlength="180" placeholder="عنوان روشن و نتیجه‌محور"></div>'+
 '<div class="pc-field"><label>حوزه / زمینه پروژه</label><input name="domain" placeholder="مثلاً پژوهشی، عمرانی، فناوری، اقتصادی، اداری و..."></div>'+
 '<div class="pc-field"><label>اعضای تیم اصلی</label><input name="teamMembers" placeholder="نام افراد یا گروه‌ها؛ با ویرگول جدا کنید"></div>'+
 '<div class="pc-field"><label>قلمرو سازمانی *</label><select name="orgId" required>'+orgOptions('HOLDING')+'</select></div>'+
 '<div class="pc-field"><label>اولویت</label><select name="priority"><option>عادی</option><option>بالا</option><option>فوری</option><option>راهبردی</option></select></div>'+
 '<div class="pc-field"><label>حامی / مالک کسب‌وکار</label><input name="sponsor" placeholder="نام یا عنوان مسئول"></div>'+
 '<div class="pc-field"><label>مدیر پروژه پیشنهادی</label><input name="manager" placeholder="مسئول پاسخ‌گوی اجرا"></div>'+
 '<div class="pc-field"><label>تاریخ شروع برنامه‌ای</label><input name="startDate" type="date"></div>'+
 '<div class="pc-field"><label>تاریخ پایان هدف</label><input name="dueDate" type="date"></div>'+
 '<div class="pc-field"><label>شناسه هدف/برنامه راهبردی</label><input name="strategyRef" placeholder="شناسه مرجع؛ در صورت وجود"></div>'+
 '<div class="pc-field"><label>برآورد اولیه بودجه (تومان)</label><input name="budget" type="number" min="0" step="1000" placeholder="در صورت مشخص بودن"></div>'+
 '<div class="pc-field full"><label>هدف و نتیجه مورد انتظار</label><textarea name="objective" placeholder="چه مسئله‌ای حل می‌شود و خروجی قابل پذیرش چیست؟"></textarea></div>'+
 '<div class="pc-field full"><label>شرح مختصر و محدوده اولیه</label><textarea name="summary" placeholder="دامنه، ذی‌نفعان، محدودیت‌ها و موارد خارج از دامنه"></textarea></div>'+
 '<div class="pc-field full"><div class="pc-note info">ثبت اولیه به معنی تصویب پروژه نیست. درخواست پس از بررسی و تصمیم مسئول مجاز به پروژه مصوب تبدیل می‌شود.</div><button class="pc-btn" type="submit">ثبت درخواست</button></div></form></details>';
}
function projectList(items){
 const f=listFilter.projects,q=f.q.trim().toLocaleLowerCase('fa');
 const filtered=items.filter(p=>(!q||[p.title,p.id,p.domain,p.manager,orgLabel(p.orgId),(p.teamMembers||[]).join(' ')].join(' ').toLocaleLowerCase('fa').includes(q))&&(!f.status||p.status===f.status)&&(!f.domain||p.domain===f.domain)&&(!f.org||p.orgId===f.org));
 return filtered.length?pageItems(filtered,'projects',projectCard,6):empty('پروژه‌ای با این فیلترها پیدا نشد','فیلترها را تغییر دهید یا پروژه جدیدی ثبت کنید.');
}
function renderProjects(){
 const ps=activeProjects(),f=listFilter.projects;
 return projectForm()+'<section class="pc-panel"><div class="pc-panel-head"><div><h3>بانک پروژه‌ها و پرونده‌های اجرایی</h3><p>هر پرونده شامل هدف، اعضای تیم، زمان‌بندی، ساختار شکست کار، وظایف، پیشرفت و تاریخچه است.</p></div><span class="pc-badge">'+fa(ps.length)+' مورد</span></div>'+
 '<div class="pc-toolbar"><input id="project-search" value="'+esc(f.q)+'" placeholder="جست‌وجوی عنوان، شناسه، حوزه یا مدیر"><select id="project-domain-filter"><option value="">همه حوزه‌ها</option>'+[...new Set(ps.map(p=>p.domain).filter(Boolean))].sort().map(x=>'<option value="'+esc(x)+'" '+(f.domain===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select><select id="project-org-filter"><option value="">همه معاونت‌ها و شرکت‌ها</option>'+orgs().map(x=>'<option value="'+esc(x.id)+'" '+(f.org===x.id?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select><select id="project-filter"><option value="">همه وضعیت‌ها</option>'+['در انتظار تصویب','مصوب / در اجرا','در حال برنامه‌ریزی','متوقف','مختومه'].map(x=>'<option '+(f.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div id="project-list">'+projectList(ps)+'</div></section>';
}
function taskForm(projectId=''){
 const projectOptions=activeProjects().map(p=>'<option value="'+p.id+'" '+(p.id===projectId?'selected':'')+'>'+esc(p.title)+'</option>').join('');
 return '<details class="pc-panel"><summary class="pc-section-title">＋ تعریف وظیفه یا اقدام جدید</summary><form class="pc-form" id="task-form">'+
 '<div class="pc-field full"><label>عنوان کار *</label><input name="title" required maxlength="180" placeholder="اقدام مشخص و قابل تحویل"></div>'+
 '<div class="pc-field"><label>پروژه مرتبط</label><select name="projectId"><option value="">کار مستقل / اقدام عمومی</option>'+projectOptions+'</select></div>'+
 '<div class="pc-field"><label>قلمرو سازمانی</label><select name="orgId">'+orgOptions('HOLDING')+'</select></div>'+
 '<div class="pc-field"><label>نوع فعالیت</label><input name="workType" placeholder="پروژه، مأموریت، کار تیمی، عملیات و..."></div>'+
 '<div class="pc-field full"><label>اعضای همکار تیم (با ویرگول جدا کنید)</label><input name="teamMembers" placeholder="نام اعضا یا گروه‌های همکار"></div>'+
 '<div class="pc-field"><label>مسئول انجام</label><input name="assignee" placeholder="نام فرد یا تیم"></div>'+
 '<div class="pc-field"><label>مالک پاسخ‌گو</label><input name="owner" placeholder="مسئول پیگیری و پذیرش"></div>'+
 '<div class="pc-field"><label>شروع برنامه‌ای</label><input name="startDate" type="date"></div>'+
 '<div class="pc-field"><label>موعد انجام</label><input name="dueDate" type="date"></div>'+
 '<div class="pc-field"><label>وزن در پیشرفت پروژه</label><input name="weight" type="number" min="1" max="100" value="1"></div>'+ '<div class="pc-field"><label>بسته کاری (WBS)</label><select name="workPackageId"><option value="">بدون بسته کاری</option>'+db.workPackages.map(x=>'<option value="'+x.id+'">'+esc(projectBy(x.projectId)?.title||'')+' · '+esc(x.code||'')+' '+esc(x.title)+'</option>').join('')+'</select></div>'+ '<div class="pc-field"><label>برآورد تلاش (ساعت)</label><input name="estimatedHours" type="number" min="0" step="0.5" value="0"></div>'+
 '<div class="pc-field"><label>اولویت</label><select name="priority"><option>عادی</option><option>بالا</option><option>فوری</option></select></div>'+
 '<div class="pc-field full"><label>تعریف نتیجه / معیار پذیرش</label><textarea name="acceptance" placeholder="چه چیزی و با چه شاهدی تحویل می‌شود؟"></textarea></div>'+
 '<div class="pc-field full"><button class="pc-btn" type="submit">ثبت وظیفه</button></div></form></details>';
}
function taskRow(t){
 const p=projectBy(t.projectId),rp=Number(t.reportedPercent)||0,ap=Number(t.approvedPercent)||0;
 return '<tr><td><strong>'+esc(t.title)+'</strong><small>'+esc(t.id)+' · '+esc(t.workType||'اقدام اجرایی')+' · '+esc(t.assignee||'مسئول تعیین نشده')+(t.teamMembers?.length?' · همکاران: '+esc(t.teamMembers.join('، ')):'')+'</small></td><td>'+esc(p?.title||'کار مستقل')+'</td><td>'+fmtDate(t.dueDate)+'</td><td>'+badge(t.status)+'</td><td>'+fa(ap)+'٪ <small>اعلامی: '+fa(rp)+'٪</small></td><td><button class="pc-btn secondary" data-action="task-report" data-id="'+t.id+'">ثبت گزارش</button>'+(rp>ap?'<button class="pc-btn gold" data-action="accept-report" data-id="'+t.id+'">تأیید گزارش</button>':'')+'</td></tr>';
}
function taskList(ts){
 const f=listFilter.tasks,q=f.q.trim().toLocaleLowerCase('fa');
 const filtered=ts.filter(t=>(!q||[t.title,t.id,t.assignee,t.owner,projectBy(t.projectId)?.title||'',orgLabel(t.orgId)].join(' ').toLocaleLowerCase('fa').includes(q))&&(!f.status||t.status===f.status)&&(!f.org||t.orgId===f.org));
 if(!filtered.length)return empty('کاری با این فیلترها پیدا نشد','فیلترها را تغییر دهید یا وظیفه جدید تعریف کنید.');
 const size=10,total=Math.max(1,Math.ceil(filtered.length/size)),page=Math.max(1,Math.min(total,Number(pageState.tasks)||1));pageState.tasks=page;
 const table='<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>عنوان / مسئول</th><th>پروژه</th><th>موعد</th><th>وضعیت</th><th>پیشرفت تأییدشده</th><th>اقدام</th></tr></thead><tbody>'+filtered.slice((page-1)*size,page*size).map(taskRow).join('')+'</tbody></table></div>';
 const pager=filtered.length>size?'<nav class="pc-pagination" aria-label="صفحه‌بندی"><button class="pc-page-btn" data-action="page" data-page-key="tasks" data-page-index="'+(page-1)+'" '+(page===1?'disabled':'')+'>قبلی</button><span>صفحه '+fa(page)+' از '+fa(total)+' · '+fa(filtered.length)+' کار</span><button class="pc-page-btn" data-action="page" data-page-key="tasks" data-page-index="'+(page+1)+'" '+(page===total?'disabled':'')+'>بعدی</button></nav>':'<div class="pc-list-count">'+fa(filtered.length)+' کار</div>';
 return table+pager;
}
function renderTasks(){
 const ts=db.tasks.filter(t=>!t.archived),f=listFilter.tasks;
 return taskForm()+'<section class="pc-panel"><div class="pc-panel-head"><div><h3>کارتابل وظایف و اقدامات</h3><p>درصد اعلامی و درصد تأییدشده جداگانه نگهداری می‌شوند.</p></div><span class="pc-badge">'+fa(ts.length)+' کار</span></div>'+
 '<div class="pc-toolbar"><input id="task-search" value="'+esc(f.q)+'" placeholder="جست‌وجوی عنوان، مسئول یا شناسه"><select id="task-org-filter"><option value="">همه معاونت‌ها و شرکت‌ها</option>'+orgs().map(x=>'<option value="'+esc(x.id)+'" '+(f.org===x.id?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select><select id="task-filter"><option value="">همه وضعیت‌ها</option>'+['در انتظار شروع','در حال اجرا','در انتظار تأیید','تکمیل‌شده','متوقف'].map(x=>'<option '+(f.status===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div id="task-list">'+taskList(ts)+'</div></section>';
}
function callCard(c){
 return '<article class="pc-call"><div class="pc-panel-head"><h4>'+esc(c.title)+'</h4>'+badge(c.status)+'</div><p>'+esc(c.summary||'شرح تکمیلی ثبت نشده است')+'</p><div class="pc-card-meta"><span class="pc-badge org">'+esc(orgLabel(c.orgId))+'</span><span class="pc-badge">مهلت: '+fmtDate(c.dueDate)+'</span><span class="pc-badge">مهارت: '+esc(c.skills||'تعیین نشده')+'</span></div><p>اعلام آمادگی: '+fa((c.participants||[]).length)+' نفر</p>'+
 (c.participants||[]).map((v,i)=>'<div class="pc-volunteer"><span>'+esc(v.name)+' · '+esc(v.org||'')+'</span>'+badge(v.status)+(v.status!=='پذیرفته‌شده'&&c.taskId?'<button class="pc-btn secondary" data-action="assign-volunteer" data-call="'+c.id+'" data-index="'+i+'">تخصیص به کار</button>':'')+'</div>').join('')+
 (c.status==='باز'?'<form class="pc-volunteer" data-form="volunteer" data-id="'+c.id+'"><input name="name" required placeholder="نام مشارکت‌کننده"><input name="org" placeholder="واحد / تیم"><button class="pc-btn gold" type="submit">اعلام آمادگی</button></form><button class="pc-btn secondary" data-action="close-call" data-id="'+c.id+'">بستن فراخوان</button>':'')+'</article>';
}
function renderCalls(){
 const open=db.calls.filter(c=>c.status==='باز');
 return '<section class="pc-hero"><div><div class="pc-kicker">مشارکت سازمانی و استفاده از ظرفیت خبرگان</div><h3>کار مناسب را به مشارکت‌کننده مناسب بسپارید</h3><p>فراخوان می‌تواند در سطح هلدینگ، معاونت، شرکت یا تیم منتشر شود. در این نسخه، ثبت فراخوان و اعلام آمادگی در فضای محلی انجام می‌شود؛ برای مشارکت هم‌زمان چند کاربر، اتصال سروری و هویت سازمانی لازم است.</p></div><div class="pc-hero-side"><strong>'+fa(open.length)+'</strong><span>فراخوان باز</span></div></section>'+
 '<details class="pc-panel"><summary class="pc-section-title">＋ ایجاد فراخوان مشارکت</summary><form class="pc-form" id="call-form"><div class="pc-field full"><label>عنوان فراخوان *</label><input name="title" required placeholder="عنوان کار یا بسته کاری"></div><div class="pc-field"><label>وظیفه مرتبط</label><select name="taskId"><option value="">بدون اتصال به وظیفه</option>'+db.tasks.filter(t=>!t.archived).map(t=>'<option value="'+t.id+'">'+esc(t.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>قلمرو انتشار</label><select name="orgId">'+orgOptions('HOLDING')+'</select></div><div class="pc-field"><label>مهلت اعلام آمادگی</label><input name="dueDate" type="date"></div><div class="pc-field"><label>مهارت / ظرفیت موردنیاز</label><input name="skills" placeholder="تخصص، تجربه یا ظرفیت زمانی"></div><div class="pc-field full"><label>شرح کار و خروجی مورد انتظار</label><textarea name="summary"></textarea></div><div class="pc-field full"><button class="pc-btn" type="submit">انتشار فراخوان در این محیط</button></div></form></details>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>فراخوان‌ها و اعلام آمادگی‌ها</h3><p>ثبت و انتخاب مشارکت‌کننده در همین دستگاه</p></div></div>'+
 (db.calls.length?pageItems(db.calls.slice().reverse(),'calls',callCard,5):empty('فراخوانی ثبت نشده است','برای یک وظیفه یا نیاز تخصصی، فراخوان مشارکت ایجاد کنید.'))+'</section>';
}
function renderReports(){
 const ps=activeProjects(),ts=db.tasks.filter(t=>!t.archived);
 const orgRows=orgs().map(o=>{const projects=ps.filter(p=>p.orgId===o.id),tasks=ts.filter(t=>t.orgId===o.id||projects.some(p=>p.id===t.projectId));return {label:o.label,projects,tasks};}).filter(x=>x.projects.length||x.tasks.length);
 const bars=orgRows.length?'<div class="pc-bar-list">'+orgRows.map(x=>'<div class="pc-bar-row"><span>'+esc(x.label)+'</span><div class="pc-bar-track"><span style="width:'+Math.min(100,x.projects.length/Math.max(1,ps.length)*100)+'%"></span></div><b>'+fa(x.projects.length)+'</b></div>').join('')+'</div>':empty('داده‌ای برای تحلیل وجود ندارد','پس از ثبت پروژه و وظیفه، توزیع سازمانی نمایش داده می‌شود.');
 return '<div class="pc-stats">'+stat('پروژه‌ها',ps.length,'مورد')+stat('وظایف',ts.length,'مورد')+stat('تکمیل‌شده',ts.filter(t=>t.status==='تکمیل‌شده').length,'وظیفه')+stat('فراخوان‌ها',db.calls.length,'مورد')+'</div>'+
 portfolioCharts()+'<div class="pc-grid"><section class="pc-panel"><div class="pc-panel-head"><div><h3>توزیع پروژه‌ها بر اساس قلمرو</h3><p>توزیع بر اساس حوزه‌های ثبت‌شده در بانک پروژه‌ها</p></div></div>'+bars+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>وضعیت زمان و پیشرفت پروژه‌ها</h3><p>فقط پروژه‌های دارای خط مبنا و زمان‌بندی قابل محاسبه‌اند.</p></div></div>'+
 (ps.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>پروژه</th><th>پیشرفت واقعی تأییدشده</th><th>برنامه‌ای</th><th>اختلاف زمان</th><th>پیش‌بینی پایان</th></tr></thead><tbody>'+ps.map(p=>{const m=projectMetrics(p);return '<tr><td><strong>'+esc(p.title)+'</strong><small>'+esc(p.id)+'</small></td><td>'+fa(Math.round(m.actual))+'٪</td><td>'+(m.plan===null?'—':fa(Math.round(m.plan))+'٪')+'</td><td>'+(m.variance===null?'—':(m.variance>=0?'جلوتر ':'عقب‌تر ')+fa(Math.abs(m.variance))+' روز')+'</td><td>'+fmtDate(m.forecast)+'</td></tr>';}).join('')+'</tbody></table></div>':empty('گزارش پروژه‌ای موجود نیست','ابتدا پروژه ثبت و برای وظایف آن زمان‌بندی تعریف کنید.'))+'</section></div>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>دفتر وقایع و اقدامات اخیر</h3><p>ثبت تغییرات و رویدادها با زمان وقوع</p></div><button class="pc-btn secondary" data-action="export-events">خروجی CSV وقایع</button></div>'+eventList(db.events)+'</section>';
}
function renderAbout(){
 return '<section class="pc-hero"><div><div class="pc-kicker">دفتر راهبری پروژه‌ها · PMO</div><h3>مرجع واحد اجرای پروژه‌ها و کارهای سازمانی</h3><p>روش اجرا، استانداردهای برنامه‌ریزی، کیفیت داده و گزارش تلفیقی در این مرکز سامان‌دهی می‌شود؛ مالک کسب‌وکار، حامی، مدیر پروژه و واحدهای تخصصی نیز مسئولیت‌های اجرایی و تصمیمی خود را دنبال می‌کنند.</p></div><div class="pc-hero-side"><strong>PMO</strong><span>راهبری و کنترل پروژه</span></div></section>'+
 '<div class="pc-grid"><section class="pc-panel"><h3 class="pc-section-title">چرخه عمر پروژه</h3><ol class="pc-steps"><li>ثبت ایده و درخواست</li><li>غربال، ارزیابی و تصویب</li><li>منشور، محدوده و برنامه مبنا</li><li>تقسیم کار، تخصیص و اجرا</li><li>کنترل زمان، هزینه، ریسک و تغییر</li><li>تحویل، پذیرش و اختتام</li><li>سنجش منافع و ثبت درس‌آموخته</li></ol></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">مرزبندی با مراکز دیگر</h3><ul class="pc-bullets"><li><b>مرکز راهبرد:</b> مرجع هدف، راهبرد و برنامه؛ این مرکز مرجع اجرای پروژه و گزارش تحویل است.</li><li><b>مرکز دانش:</b> مرجع درس‌آموخته و محتوای دانشی؛ پروژه‌ها شواهد و تجربه را به آن ارجاع می‌دهند.</li><li><b>مرکز رصد:</b> مصرف‌کننده داده‌های تأییدشده برای نمای تلفیقی؛ ثبت اصلی اطلاعات در مرکز تخصصی باقی می‌ماند.</li><li><b>مرکز ارزیابی:</b> ارزیابی مستقل نتایج و شواهد؛ داده عملیاتی پروژه را بازنویسی نمی‌کند.</li><li><b>مرکز داده:</b> نگهداری و پشتیبان‌گیری؛ مالک چرخه عمر و قواعد کسب‌وکار پروژه نیست.</li></ul></section></div>'+
 '<section class="pc-panel"><h3 class="pc-section-title">قواعد سنجش پیشرفت و انحراف</h3><ul class="pc-bullets"><li>پیشرفت اعلامی مجری و پیشرفت تأییدشده مسئول پذیرش جدا هستند.</li><li>درصد پیشرفت پروژه از میانگین وزنی پیشرفت تأییدشده وظایف محاسبه می‌شود.</li><li>پیشرفت برنامه‌ای از زمان‌بندی خط مبنا و وزن فعالیت‌ها در تاریخ گزارش محاسبه می‌شود.</li><li>تغییر خط مبنا فقط با تصمیم مجاز ثبت می‌شود و نسخه قبلی حفظ خواهد شد.</li><li>شاخص‌های ارزش کسب‌شده مانند SPI/CPI تا زمان تعریف داده‌های معتبر و روش مصوب نمایش داده نمی‌شوند.</li></ul></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">نقشه تکمیل محصول</h3><div class="pc-grid three">'+[['MVP محلی','ثبت پروژه و کار، گزارش پیشرفت، خط مبنای اولیه، جمع‌سپاری محلی و پشتیبان'],['نسخه توسعه‌ای','WBS، گانت، تقویم کاری، وابستگی، ظرفیت، هزینه، RAID و تغییر'],['استقرار سازمانی','احراز هویت، API، پایگاه‌داده مرکزی، همکاری چندکاربره و اتصال مراکز']].map(x=>'<div class="pc-project-card"><h4>'+x[0]+'</h4><p>'+x[1]+'</p></div>').join('')+'</div></section>';
}
function renderSettings(){
 const days=[{id:6,label:'شنبه'},{id:0,label:'یکشنبه'},{id:1,label:'دوشنبه'},{id:2,label:'سه‌شنبه'},{id:3,label:'چهارشنبه'},{id:4,label:'پنجشنبه'},{id:5,label:'جمعه'}];
 return '<section class="pc-panel"><div class="pc-panel-head"><div><h3>ذخیره‌سازی و پشتیبان‌گیری همین مرکز</h3><p>فضای مستقل مرکز پروژه‌ها در خدمت مشترک ذخیره‌سازی هلدینگ</p></div><span class="pc-badge blue">فضای داده: '+SCOPE+'</span></div><div class="pc-note info">داده‌ها در مرورگر فعلی و در فضای نام مستقل ذخیره می‌شوند. برای انتقال به دستگاه دیگر، خروجی پشتیبان بگیرید. این سازوکار به‌تنهایی همگام‌سازی چندکاربره یا سرور مرکزی ایجاد نمی‌کند.</div><div class="pc-toolbar"><button class="pc-btn" data-action="backup">دریافت پشتیبان کامل مرکز</button><label class="pc-btn secondary" for="restore-file">بازیابی از فایل پشتیبان</label><input id="restore-file" type="file" accept="application/json,.json" hidden></div><div class="pc-keyvals"><div class="pc-keyval"><small>آخرین ذخیره محلی</small><strong>'+fmtDateTime(db.updatedAt)+'</strong></div><div class="pc-keyval"><small>پروژه‌ها</small><strong>'+fa(db.projects.length)+'</strong></div><div class="pc-keyval"><small>بسته‌های کاری</small><strong>'+fa(db.workPackages.length)+'</strong></div><div class="pc-keyval"><small>وظایف</small><strong>'+fa(db.tasks.length)+'</strong></div><div class="pc-keyval"><small>رویدادها</small><strong>'+fa(db.events.length)+'</strong></div></div></section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>تقویم کاری پروژه‌ها</h3><p>روزهای کاری برای محاسبه برنامه زمانی؛ جمعه به‌صورت پیش‌فرض تعطیل است.</p></div></div><form id="calendar-form" class="pc-form"><div class="pc-field full"><label>روزهای کاری هفته (برای انتخاب چند روز کلید Ctrl را نگه دارید)</label><select name="workDays" multiple size="4">'+days.map(d=>'<option value="'+d.id+'" '+((db.workCalendar?.workDays||[0,1,2,3,4,6]).includes(d.id)?'selected':'')+'>'+d.label+'</option>').join('')+'</select></div><div class="pc-field full"><label>تعطیلات اختصاصی (تاریخ میلادی، با ویرگول جدا شود)</label><input name="holidays" value="'+esc((db.workCalendar?.holidays||[]).join(', '))+'" placeholder="2026-03-21, 2026-03-22"></div><div class="pc-field full"><button class="pc-btn">ذخیره تقویم کاری</button></div></form></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">محدودیت‌ها و الزامات استقرار</h3><ul class="pc-bullets"><li>داده‌ها به مرورگر/دستگاه فعلی وابسته‌اند تا زمانی که پشتیبان منتقل شود.</li><li>احراز هویت و نقش‌های واقعی سازمانی هنوز به سرور متصل نشده‌اند.</li><li>فراخوان و اعلام آمادگی در این نسخه محلی است و برای مشارکت هم‌زمان به API و حساب کاربری نیاز دارد.</li><li>اتصال زنده به مالی، منابع انسانی، قراردادها، راهبرد، دانش، رصد و ارزیابی در فازهای بعد انجام می‌شود.</li></ul></section>';
}

function projectEditForm(p){
 const priorities=['عادی','بالا','فوری','راهبردی'].map(x=>'<option '+(x===p.priority?'selected':'')+'>'+x+'</option>').join('');
 return '<details class="pc-panel"><summary class="pc-section-title">✎ ویرایش مشخصات و اطلاعات پایه پروژه</summary><form class="pc-form" id="project-edit-form"><input type="hidden" name="id" value="'+esc(p.id)+'"><div class="pc-field full"><label>عنوان پروژه</label><input name="title" required value="'+esc(p.title)+'"></div><div class="pc-field"><label>حوزه تخصصی</label><input name="domain" value="'+esc(p.domain||'')+'"></div><div class="pc-field"><label>اعضای تیم اصلی</label><input name="teamMembers" value="'+esc((p.teamMembers||[]).join('، '))+'"></div><div class="pc-field"><label>قلمرو سازمانی</label><select name="orgId">'+orgOptions(p.orgId)+'</select></div><div class="pc-field"><label>اولویت</label><select name="priority">'+priorities+'</select></div><div class="pc-field"><label>حامی / مالک کسب‌وکار</label><input name="sponsor" value="'+esc(p.sponsor||'')+'"></div><div class="pc-field"><label>مدیر پروژه</label><input name="manager" value="'+esc(p.manager||'')+'"></div><div class="pc-field"><label>شروع برنامه‌ای</label><input name="startDate" type="date" value="'+esc(p.startDate||'')+'"></div><div class="pc-field"><label>پایان هدف</label><input name="dueDate" type="date" value="'+esc(p.dueDate||'')+'"></div><div class="pc-field"><label>مرجع راهبردی</label><input name="strategyRef" value="'+esc(p.strategyRef||'')+'"></div><div class="pc-field"><label>بودجه برآوردی (تومان)</label><input name="budget" type="number" min="0" value="'+Number(p.budget||0)+'"></div><div class="pc-field full"><label>هدف و نتیجه مورد انتظار</label><textarea name="objective">'+esc(p.objective||'')+'</textarea></div><div class="pc-field full"><label>شرح و محدوده پروژه</label><textarea name="summary">'+esc(p.summary||'')+'</textarea></div><div class="pc-field full"><button class="pc-btn" type="submit">ذخیره تغییرات پروژه</button></div></form></details>';
}
function renderProject(id){
 const p=projectBy(id);if(!p)return empty('پروژه پیدا نشد','ممکن است پروژه بایگانی یا شناسه آن تغییر کرده باشد.')+'<a class="pc-btn secondary" href="#projects">بازگشت به پروژه‌ها</a>';
 const m=projectMetrics(p),ts=m.tasks,base=m.baseline;
 return '<section class="pc-panel"><div class="pc-detail-head"><div><h3>'+esc(p.title)+'</h3><p>'+esc(p.id)+' · '+esc(orgLabel(p.orgId))+' · '+badge(p.status)+'</p><p>'+esc(p.summary||p.objective||'شرح پروژه ثبت نشده است.')+'</p></div><div class="pc-detail-actions"><button class="pc-btn secondary" data-action="baseline" data-id="'+p.id+'">ثبت خط مبنا</button>'+(p.status==='در انتظار تصویب'?'<button class="pc-btn gold" data-action="approve-project" data-id="'+p.id+'">تصویب پروژه</button>':'')+'<a class="pc-btn secondary" href="#tasks">افزودن وظیفه</a></div></div>'+
 projectEditForm(p)+'<div class="pc-keyvals"><div class="pc-keyval"><small>حوزه تخصصی</small><strong>'+esc(p.domain||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>اعضای تیم اصلی</small><strong>'+esc((p.teamMembers||[]).join('، ')||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>حامی / مالک کسب‌وکار</small><strong>'+esc(p.sponsor||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>مدیر پروژه</small><strong>'+esc(p.manager||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>شروع برنامه‌ای</small><strong>'+fmtDate(p.startDate)+'</strong></div><div class="pc-keyval"><small>پایان هدف</small><strong>'+fmtDate(p.dueDate)+'</strong></div></div>'+
 '<div class="pc-stats">'+stat('پیشرفت تأییدشده',Math.round(m.actual),'درصد')+stat('پیشرفت اعلامی',Math.round(m.reported),'درصد')+stat('وظایف',ts.length,'مورد')+stat('نسخه‌های خط مبنا',(p.baselines||[]).length,'نسخه')+stat('انحراف روزانه',m.variance===null?'—':Math.abs(m.variance),m.variance===null?'نیازمند برنامه':m.variance<0?'روز عقب':'روز جلو')+'</div>'+
 '<div class="pc-grid"><section class="pc-panel"><h3 class="pc-section-title">پیشرفت واقعی در برابر برنامه</h3>'+progressBar(m.actual,'تأییدشده')+'<div style="margin-top:12px">'+(m.plan===null?'<div class="pc-note">برای محاسبه برنامه‌ای، وظایف باید تاریخ شروع و پایان داشته باشند و خط مبنا ثبت شود.</div>':progressBar(m.plan,'برنامه‌ای تا امروز'))+'</div><p class="pc-help">پیش‌بینی پایان: '+fmtDate(m.forecast)+' · '+(m.variance===null?'انحراف زمانی قابل محاسبه نیست':(m.variance<0?'برآورد عقب‌ماندگی: ':'برآورد جلو بودن: ')+fa(Math.abs(m.variance))+' روز')+' · مبنا: نسخه زمان‌بندی ثبت‌شده</p></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">خط مبنای مصوب</h3>'+(base?'<div class="pc-keyvals"><div class="pc-keyval"><small>نسخه</small><strong>'+fa(base.version)+'</strong></div><div class="pc-keyval"><small>تاریخ ثبت</small><strong>'+fmtDateTime(base.approvedAt)+'</strong></div><div class="pc-keyval"><small>شروع</small><strong>'+fmtDate(base.startDate)+'</strong></div><div class="pc-keyval"><small>پایان</small><strong>'+fmtDate(base.endDate)+'</strong></div></div><p class="pc-help">تغییرات بعدی برنامه نسخه قبلی را حذف نمی‌کند.</p>':'<div class="pc-empty">هنوز خط مبنای مصوبی ثبت نشده است.</div>')+'</section></div>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>ساختار شکست کار و نقاط عطف</h3><p>بسته‌های کاری و نقاط کنترل پروژه</p></div><a class="pc-btn secondary" href="#planning">مدیریت برنامه‌ریزی</a></div>'+(packageTree(p.id)||empty('ساختار شکست کار ثبت نشده است','از بخش برنامه‌ریزی بسته‌های کاری چندسطحی را تعریف کنید.'))+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>نقاط عطف پروژه</h3><p>موعدهای کلیدی و وضعیت تحقق</p></div></div>'+(db.milestones.filter(x=>x.projectId===p.id).length?db.milestones.filter(x=>x.projectId===p.id).map(x=>'<div class="pc-alert-row"><strong>'+esc(x.title)+'</strong><span>'+fmtDate(x.dueDate)+' · '+badge(x.status)+'</span></div>').join(''):empty('نقطه عطفی تعریف نشده است','در بخش برنامه‌ریزی نقاط کنترل و تحویل مرحله‌ای را ثبت کنید.'))+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>وظایف و بسته‌های اجرایی</h3><p>وزن هر وظیفه در محاسبه پیشرفت پروژه مؤثر است.</p></div><a class="pc-btn secondary" href="#tasks">مدیریت کارها</a></div>'+
 (ts.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>وظیفه</th><th>مسئول</th><th>موعد</th><th>وضعیت</th><th>پیشرفت تأییدشده</th><th>گزارش</th></tr></thead><tbody>'+ts.map(t=>'<tr><td><strong>'+esc(t.title)+'</strong><small>وزن: '+fa(t.weight)+'</small></td><td>'+esc(t.assignee||'—')+'</td><td>'+fmtDate(t.dueDate)+'</td><td>'+badge(t.status)+'</td><td>'+fa(t.approvedPercent)+'٪</td><td><button class="pc-btn secondary" data-action="task-report" data-id="'+t.id+'">ثبت گزارش</button>'+(t.reportedPercent>t.approvedPercent?'<button class="pc-btn gold" data-action="accept-report" data-id="'+t.id+'">تأیید</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':empty('وظیفه‌ای به این پروژه متصل نیست','از بخش کارها، وظیفه‌ای با انتخاب این پروژه ثبت کنید.'))+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>تاریخچه کامل اقدامات پروژه</h3><p>گزارش‌ها، تأییدها، تغییرات و رویدادهای مرتبط به ترتیب زمان ثبت شده‌اند.</p></div><span class="pc-badge">'+fa(db.events.filter(e=>e.entity===p.id||ts.some(t=>t.id===e.entity)).length)+' رویداد</span></div><div class="pc-toolbar"><label>از تاریخ <input type="date" id="project-history-from"></label><label>تا تاریخ <input type="date" id="project-history-to"></label><button class="pc-btn secondary" type="button" id="clear-project-history">پاک‌کردن فیلتر</button></div><div id="project-history-list">'+eventList(db.events.filter(e=>e.entity===p.id||ts.some(t=>t.id===e.entity)),500)+'</div></section></section>';
}
function render(){
 const r=currentRoute();setHeader(r.page);
 view.innerHTML=r.page==='overview'?renderOverview():r.page==='projects'?renderProjects():r.page==='planning'?renderPlanning():r.page==='tasks'?renderTasks():r.page==='calls'?renderCalls():r.page==='resources'?renderResources():r.page==='control'?renderControl():r.page==='reports'?renderReports():r.page==='about'?renderAbout():r.page==='settings'?renderSettings():renderProject(r.id);
 const guide=pageGuides[r.page]||pageGuides.overview;view.insertAdjacentHTML('beforeend',guidePanel(guide[0],guide[1],guide[2],guide[3]));if(r.page==='tasks')filterTasks();if(r.page==='projects')filterProjects();if(r.page==='project')filterProjectHistory();window.scrollTo({top:0,behavior:'instant'});
}
function filterProjects(){
 const search=$('#project-search'),filter=$('#project-filter'),domain=$('#project-domain-filter'),org=$('#project-org-filter');
 if(!search)return;
 const apply=()=>{listFilter.projects={q:search.value,status:filter.value,domain:domain?.value||'',org:org?.value||''};pageState.projects=1;const list=$('#project-list');if(list)list.innerHTML=projectList(activeProjects());};
 search.addEventListener('input',apply);[filter,domain,org].filter(Boolean).forEach(x=>x.addEventListener('change',apply));
}
function filterTasks(){
 const search=$('#task-search'),filter=$('#task-filter'),org=$('#task-org-filter');
 if(!search)return;
 const apply=()=>{listFilter.tasks={q:search.value,status:filter.value,org:org?.value||''};pageState.tasks=1;const list=$('#task-list');if(list)list.innerHTML=taskList(db.tasks.filter(t=>!t.archived));};
 search.addEventListener('input',apply);[filter,org].filter(Boolean).forEach(x=>x.addEventListener('change',apply));
}
function filterProjectHistory(){
 const from=$('#project-history-from'),to=$('#project-history-to'),clear=$('#clear-project-history');
 if(!from||!to)return;
 const apply=()=>{const a=from.value,b=to.value;view.querySelectorAll('#project-history-list .pc-event').forEach(row=>{const d=row.dataset.eventDate||'';row.hidden=!!((a&&d<a)||(b&&d>b));});};
 from.addEventListener('change',apply);to.addEventListener('change',apply);
 if(clear)clear.addEventListener('click',()=>{from.value='';to.value='';apply();});
}
function formData(form){return Object.fromEntries(new FormData(form).entries());}

function updateProject(form){
 const d=formData(form),p=projectBy(d.id);if(!p||!d.title.trim())return;
 Object.assign(p,{title:d.title.trim(),domain:d.domain||'',teamMembers:(d.teamMembers||'').split(/[،,؛;]/).map(x=>x.trim()).filter(Boolean),orgId:d.orgId||'HOLDING',priority:d.priority||'عادی',sponsor:d.sponsor||'',manager:d.manager||'',startDate:d.startDate||'',dueDate:d.dueDate||'',strategyRef:d.strategyRef||'',budget:Math.max(0,Number(d.budget)||0),objective:d.objective||'',summary:d.summary||'',sampleData:false,updatedAt:isoNow()});
 log('update-project',p.id,'ویرایش مشخصات پروژه: '+p.title,'اطلاعات پایه، تیم یا زمان‌بندی پروژه به‌روزرسانی شد.');save();notice('تغییرات مشخصات پروژه ذخیره شد.');render();
}
function createProject(form){
 const d=formData(form);if(!d.title.trim())return;
 const p={id:makeId('PRJ'),title:d.title.trim(),domain:d.domain||'',teamMembers:(d.teamMembers||'').split(/[،,؛;]/).map(x=>x.trim()).filter(Boolean),orgId:d.orgId||'HOLDING',priority:d.priority||'عادی',sponsor:d.sponsor||'',manager:d.manager||'',startDate:d.startDate||'',dueDate:d.dueDate||'',strategyRef:d.strategyRef||'',budget:Number(d.budget)||0,objective:d.objective||'',summary:d.summary||'',status:'در انتظار تصویب',createdAt:isoNow(),baselines:[],archived:false};
 db.projects.push(p);log('create-project',p.id,'ثبت درخواست پروژه: '+p.title,'درخواست جدید در وضعیت انتظار تصویب ثبت شد.');save();notice('درخواست پروژه ثبت شد و در انتظار بررسی و تصویب است.');location.hash='project/'+p.id;
}
function createTask(form){
 const d=formData(form);if(!d.title.trim())return;
 const wp=d.workPackageId?packageBy(d.workPackageId):null;if(wp&&wp.projectId!==(d.projectId||''))return notice('بسته کاری انتخاب‌شده متعلق به پروژه دیگری است.','error');
 const t={id:makeId('TSK'),title:d.title.trim(),projectId:d.projectId||'',workPackageId:d.workPackageId||'',orgId:d.orgId||'HOLDING',workType:d.workType||'اقدام اجرایی',teamMembers:(d.teamMembers||'').split(/[،,؛;]/).map(x=>x.trim()).filter(Boolean),assignee:d.assignee||'',owner:d.owner||'',startDate:d.startDate||'',dueDate:d.dueDate||'',weight:Math.max(1,Number(d.weight)||1),estimatedHours:Math.max(0,Number(d.estimatedHours)||0),actualHours:0,priority:d.priority||'عادی',acceptance:d.acceptance||'',status:'در انتظار شروع',reportedPercent:0,approvedPercent:0,history:[],archived:false,createdAt:isoNow()};
 db.tasks.push(t);log('create-task',t.id,'تعریف وظیفه: '+t.title,'مسئول: '+(t.assignee||'تعیین نشده')+'؛ موعد: '+(t.dueDate||'تعیین نشده'));save();notice('وظیفه ثبت شد.');render();
}
function createCall(form){
 const d=formData(form);if(!d.title.trim())return;
 const c={id:makeId('CAL'),title:d.title.trim(),taskId:d.taskId||'',orgId:d.orgId||'HOLDING',dueDate:d.dueDate||'',skills:d.skills||'',summary:d.summary||'',status:'باز',participants:[],createdAt:isoNow()};
 db.calls.push(c);log('create-call',c.id,'انتشار فراخوان: '+c.title,'فراخوان مشارکت در فضای محلی ایجاد شد.');save();notice('فراخوان در این محیط ثبت شد.');render();
}

function createPackage(form){const d=formData(form);if(!d.title.trim()||!d.projectId)return;const parent=d.parentId?packageBy(d.parentId):null;if(parent&&parent.projectId!==d.projectId)return notice('بسته والد باید متعلق به همان پروژه باشد.','error');const x={id:makeId('WPK'),projectId:d.projectId,parentId:d.parentId||'',code:d.code||'',title:d.title.trim(),owner:d.owner||'',weight:Math.max(1,Number(d.weight)||1),startDate:d.startDate||'',dueDate:d.dueDate||'',description:d.description||'',status:'برنامه‌ریزی‌شده',createdAt:isoNow()};db.workPackages.push(x);log('create-work-package',x.id,'ایجاد بسته کاری: '+x.title,'پروژه: '+(projectBy(x.projectId)?.title||''));save();notice('بسته کاری به WBS افزوده شد.');render();}
function createMilestone(form){const d=formData(form);if(!d.title.trim()||!d.projectId||!d.dueDate)return;const x={id:makeId('MIL'),projectId:d.projectId,title:d.title.trim(),dueDate:d.dueDate,owner:d.owner||'',acceptance:d.acceptance||'',status:'برنامه‌ریزی‌شده',createdAt:isoNow()};db.milestones.push(x);log('create-milestone',x.id,'ثبت نقطه عطف: '+x.title,'موعد: '+x.dueDate);save();notice('نقطه عطف ثبت شد.');render();}
function dependencyWouldCycle(from,to){const graph={};db.dependencies.forEach(x=>(graph[x.predecessorId]??=[]).push(x.successorId));const seen=new Set(),stack=[to];while(stack.length){const n=stack.pop();if(n===from)return true;if(seen.has(n))continue;seen.add(n);(graph[n]||[]).forEach(v=>stack.push(v));}return false;}
function createDependency(form){const d=formData(form);if(!d.predecessorId||!d.successorId||d.predecessorId===d.successorId)return notice('دو وظیفه متفاوت انتخاب کنید.','error');const a=db.tasks.find(x=>x.id===d.predecessorId),b=db.tasks.find(x=>x.id===d.successorId);if(!a||!b||a.projectId!==d.projectId||b.projectId!==d.projectId)return notice('هر دو وظیفه باید متعلق به پروژه انتخاب‌شده باشند.','error');if(dependencyWouldCycle(a.id,b.id))return notice('این رابطه باعث ایجاد چرخه وابستگی می‌شود و ثبت نشد.','error');const x={id:makeId('DEP'),projectId:d.projectId,predecessorId:a.id,successorId:b.id,type:d.type||'FS',lagDays:Number(d.lagDays)||0,createdAt:isoNow()};db.dependencies.push(x);log('create-dependency',x.id,'ثبت وابستگی وظایف',a.title+' → '+b.title+' · '+x.type);save();notice('رابطه وابستگی ثبت شد.');render();}
function createResource(form){const d=formData(form);if(!d.name.trim()||!d.projectId)return;const assignedTask=d.taskId?db.tasks.find(t=>t.id===d.taskId):null;if(assignedTask&&assignedTask.projectId!==d.projectId)return notice('وظیفه انتخاب‌شده متعلق به پروژه دیگری است.','error');const pct=Math.max(1,Math.min(100,Number(d.capacityPercent)||1)),same=db.resources.filter(x=>x.name.trim().toLowerCase()===d.name.trim().toLowerCase()&&(!d.startDate||!x.endDate||x.endDate>=d.startDate)&&(!d.endDate||!x.startDate||x.startDate<=d.endDate)),total=same.reduce((s,x)=>s+(Number(x.capacityPercent)||0),pct),x={id:makeId('RES'),projectId:d.projectId,taskId:d.taskId||'',name:d.name.trim(),role:d.role||'',capacityPercent:pct,weeklyHours:Math.max(0,Number(d.weeklyHours)||0),startDate:d.startDate||'',endDate:d.endDate||'',status:total>100?'تعارض ظرفیت':'ثبت‌شده',createdAt:isoNow()};db.resources.push(x);log('allocate-resource',x.id,'تخصیص منبع: '+x.name,'ظرفیت: '+pct+'٪ · مجموع هم‌پوشان: '+total+'٪');save();notice(total>100?'تخصیص ثبت شد؛ اما اضافه‌بار ظرفیت شناسایی شده است.':'تخصیص ظرفیت ثبت شد.');render();}
function createRaid(form){const d=formData(form);if(!d.description.trim()||!d.projectId)return;const x={id:makeId('RAID'),projectId:d.projectId,type:d.type||'ریسک',description:d.description.trim(),probability:Math.max(1,Math.min(5,Number(d.probability)||1)),impact:Math.max(1,Math.min(5,Number(d.impact)||1)),owner:d.owner||'',dueDate:d.dueDate||'',response:d.response||'',status:'باز',createdAt:isoNow()};db.raids.push(x);log('create-raid',x.id,'ثبت '+x.type,x.description);save();notice('مورد کنترلی ثبت شد.');render();}
function createChange(form){const d=formData(form);if(!d.title.trim()||!d.projectId)return;const x={id:makeId('CHG'),projectId:d.projectId,title:d.title.trim(),reason:d.reason||'',scopeImpact:d.scopeImpact||'',timeImpact:Number(d.timeImpact)||0,costImpact:Number(d.costImpact)||0,qualityImpact:d.qualityImpact||'',status:'در انتظار بررسی',createdAt:isoNow()};db.changes.push(x);log('create-change',x.id,'ثبت درخواست تغییر: '+x.title,x.reason);save();notice('درخواست تغییر ثبت شد؛ برنامه مصوب خودکار تغییر نمی‌کند.');render();}
function createDeliverable(form){const d=formData(form);if(!d.title.trim()||!d.projectId)return;const x={id:makeId('DEL'),projectId:d.projectId,title:d.title.trim(),owner:d.owner||'',dueDate:d.dueDate||'',criteria:d.criteria||'',status:'در انتظار تحویل',createdAt:isoNow()};db.deliverables.push(x);log('create-deliverable',x.id,'تعریف تحویل‌دادنی: '+x.title,x.criteria);save();notice('تحویل‌دادنی ثبت شد.');render();}
function saveCalendar(form){const d=formData(form),selected=[...form.elements.workDays.selectedOptions].map(x=>Number(x.value));if(!selected.length)return notice('حداقل یک روز کاری انتخاب کنید.','error');db.workCalendar={workDays:selected,holidays:(d.holidays||'').split(',').map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x))};log('update-calendar',SCOPE,'به‌روزرسانی تقویم کاری','روزهای کاری: '+selected.join(',')+'؛ تعطیلات: '+db.workCalendar.holidays.length);save();notice('تقویم کاری ذخیره شد.');render();}

function taskReport(id){
 const t=db.tasks.find(x=>x.id===id);if(!t)return;
 const dialog=$('#task-report-dialog'),form=$('#task-report-form');if(!dialog||!form)return;
 form.elements.taskId.value=id;form.elements.percent.value=String(t.reportedPercent||0);form.elements.note.value=t.reportText||'';
 dialog.showModal();
}
function submitTaskReport(form){
 const d=formData(form),t=db.tasks.find(x=>x.id===d.taskId);if(!t)return;
 const pct=Math.max(0,Math.min(100,Number(d.percent)));
 if(!Number.isFinite(pct))return notice('درصد واردشده معتبر نیست.','error');
 const note=d.note||'';
 t.reportedPercent=pct;t.reportText=note;t.reportedAt=isoNow();t.status=pct>=100?'در انتظار تأیید':'در حال اجرا';
 t.history=t.history||[];t.history.unshift({at:isoNow(),type:'گزارش پیشرفت',percent:pct,note});
 log('report-progress',t.id,'گزارش پیشرفت وظیفه: '+t.title,'درصد اعلامی '+pct+'٪؛ '+note);
 save();$('#task-report-dialog').close();notice('گزارش ثبت شد؛ تا زمان تأیید، پیشرفت قطعی پروژه تغییر نمی‌کند.');render();
}
function acceptReport(id){
 const t=db.tasks.find(x=>x.id===id);if(!t)return;
 t.approvedPercent=Number(t.reportedPercent)||0;t.approvedAt=isoNow();t.status=t.approvedPercent>=100?'تکمیل‌شده':'در حال اجرا';
 t.history=t.history||[];t.history.unshift({at:isoNow(),type:'تأیید پیشرفت',percent:t.approvedPercent});
 log('accept-progress',t.id,'تأیید پیشرفت وظیفه: '+t.title,'پیشرفت تأییدشده '+t.approvedPercent+'٪');save();notice('پیشرفت وظیفه تأیید و در محاسبه پروژه منظور شد.');render();
}
function approveProject(id){
 const p=projectBy(id);if(!p)return;
 p.status='مصوب / در اجرا';p.approvedAt=isoNow();log('approve-project',p.id,'تصویب پروژه: '+p.title,'درخواست به پروژه مصوب تبدیل شد.');save();notice('وضعیت پروژه به مصوب / در اجرا تغییر کرد.');render();
}
function baseline(id){
 const p=projectBy(id);if(!p)return;
 
 p.baselines=p.baselines||[];
 const tasks=tasksOf(id).map(t=>({id:t.id,title:t.title,startDate:t.startDate,dueDate:t.dueDate,weight:t.weight,workPackageId:t.workPackageId||''}));
 const packages=packagesOf(id).map(x=>({...x})),milestones=db.milestones.filter(x=>x.projectId===id).map(x=>({...x})),dependencies=db.dependencies.filter(x=>x.projectId===id).map(x=>({...x}));
 p.baselines.push({version:p.baselines.length+1,approvedAt:isoNow(),startDate:p.startDate,endDate:p.dueDate,tasks,packages,milestones,dependencies,workCalendar:{...db.workCalendar}});
 log('baseline',p.id,'ثبت خط مبنای نسخه '+p.baselines.length+' برای '+p.title,'تعداد وظایف برنامه‌ریزی‌شده: '+tasks.length);save();notice('نسخه خط مبنا ثبت شد.');render();
}
function volunteer(form){
 const c=db.calls.find(x=>x.id===form.dataset.id);if(!c)return;
 const d=formData(form);if(!d.name.trim())return;
 c.participants=c.participants||[];c.participants.push({id:makeId('VOL'),name:d.name.trim(),org:d.org||'',status:'در انتظار انتخاب',createdAt:isoNow()});
 log('volunteer',c.id,'اعلام آمادگی برای فراخوان: '+c.title,d.name.trim()+' · '+(d.org||''));save();notice('اعلام آمادگی ثبت شد.');render();
}
function assignVolunteer(callId,index){
 const c=db.calls.find(x=>x.id===callId),v=c?.participants?.[Number(index)];if(!c||!v)return;
 if(!c.taskId)return notice('این فراخوان به وظیفه مشخصی متصل نیست.','error');
 const t=db.tasks.find(x=>x.id===c.taskId);if(!t)return;
 t.assignee=v.name+(v.org?' · '+v.org:'');v.status='پذیرفته‌شده';v.assignedAt=isoNow();
 log('assign-volunteer',t.id,'تخصیص مشارکت‌کننده به وظیفه: '+t.title,v.name);save();notice('مشارکت‌کننده به وظیفه تخصیص یافت.');render();
}
function exportBackup(){
 if(window.HoldingLocalDataVault){
  window.HoldingLocalDataVault.exportData(SCOPE).then(data=>download('holding-project-center-backup-'+today()+'.json',JSON.stringify(data,null,2),'application/json')).catch(()=>download('project-center-backup-'+today()+'.json',JSON.stringify({format:'holding-project-center',schemaVersion:2,db},null,2),'application/json'));
 }else download('project-center-backup-'+today()+'.json',JSON.stringify({format:'holding-project-center',schemaVersion:2,db},null,2),'application/json');
}
function download(name,content,type){
 const blob=new Blob([content],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
async function restoreFile(file){
 try{
  const payload=JSON.parse(await file.text());
  if(payload.format==='holding-local-vault'&&window.HoldingLocalDataVault){await window.HoldingLocalDataVault.importData(payload,'merge');const r=await window.HoldingLocalDataVault.get(RECORD_ID);if(r?.content)db={...blank(),...JSON.parse(r.content)};}
  else if(payload.format==='holding-project-center'&&payload.db){db={...blank(),...payload.db};await save();}
  else throw new Error('قالب فایل پشتیبان این مرکز شناخته نشد.');
  await save();log('restore',SCOPE,'بازیابی داده‌های مرکز پروژه‌ها','ورود فایل پشتیبان');await save();notice('بازیابی اطلاعات انجام شد.');render();
 }catch(e){notice(e.message||'بازیابی فایل ناموفق بود.','error');}
}
function exportEvents(){
 const rows=[['شناسه','زمان','نوع اقدام','عنوان','شرح'],...db.events.map(e=>[e.id,e.at,e.action,e.title,e.details])];
 const csv='\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 download('project-center-events-'+today()+'.csv',csv,'text/csv');
}
view.addEventListener('submit',e=>{
 const f=e.target;
 if(f.id==='project-form'){e.preventDefault();createProject(f);}else if(f.id==='project-edit-form'){e.preventDefault();updateProject(f);}else if(f.id==='task-form'){e.preventDefault();createTask(f);}else if(f.id==='call-form'){e.preventDefault();createCall(f);}else if(f.id==='package-form'){e.preventDefault();createPackage(f);}else if(f.id==='milestone-form'){e.preventDefault();createMilestone(f);}else if(f.id==='dependency-form'){e.preventDefault();createDependency(f);}else if(f.id==='resource-form'){e.preventDefault();createResource(f);}else if(f.id==='raid-form'){e.preventDefault();createRaid(f);}else if(f.id==='change-form'){e.preventDefault();createChange(f);}else if(f.id==='deliverable-form'){e.preventDefault();createDeliverable(f);}else if(f.id==='calendar-form'){e.preventDefault();saveCalendar(f);}else if(f.dataset.form==='volunteer'){e.preventDefault();volunteer(f);}
});
$('#task-report-form').addEventListener('submit',e=>{e.preventDefault();submitTaskReport(e.currentTarget);});
$('#close-report-dialog').addEventListener('click',()=>$('#task-report-dialog').close());
$('#cancel-report-dialog').addEventListener('click',()=>$('#task-report-dialog').close());
view.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action,id=b.dataset.id;
 if(a==='page'){pageState[b.dataset.pageKey]=Number(b.dataset.pageIndex)||1;render();return;}
 if(a==='open-project')location.hash='project/'+id;
 if(a==='approve-project')approveProject(id);
 if(a==='baseline')baseline(id);
 if(a==='task-report')taskReport(id);
 if(a==='accept-report')acceptReport(id);
 if(a==='close-call'){const c=db.calls.find(x=>x.id===id);if(c){c.status='بسته';log('close-call',c.id,'بستن فراخوان: '+c.title,'فراخوان بسته شد.');save();render();}}
 if(a==='complete-milestone'){const m=db.milestones.find(x=>x.id===id);if(m){m.status='تحقق‌یافته';m.completedAt=isoNow();log('complete-milestone',m.id,'تحقق نقطه عطف: '+m.title,'نقطه عطف تحقق‌یافته ثبت شد.');save();render();}}
 if(a==='close-raid'){const x=db.raids.find(y=>y.id===id);if(x){x.status='بسته';x.closedAt=isoNow();log('close-raid',x.id,'بستن مورد کنترلی',x.description);save();render();}}
 if(a==='approve-change'||a==='reject-change'){const x=db.changes.find(y=>y.id===id);if(x){x.status=a==='approve-change'?'تصویب‌شده':'ردشده';x.decidedAt=isoNow();log(a,x.id,'تعیین تکلیف درخواست تغییر: '+x.title,x.status);save();render();}}
 if(a==='accept-deliverable'){const x=db.deliverables.find(y=>y.id===id);if(x){x.status='پذیرفته‌شده';x.acceptedAt=isoNow();log('accept-deliverable',x.id,'پذیرش تحویل‌دادنی: '+x.title,x.criteria||'');save();render();}}
 if(a==='assign-volunteer')assignVolunteer(b.dataset.call,b.dataset.index);
 if(a==='backup')exportBackup();
 if(a==='export-events')exportEvents();
});
view.addEventListener('change',e=>{if(e.target.id!=='restore-file')return;const f=e.target.files?.[0];if(f)restoreFile(f);e.target.value='';});
window.addEventListener('hashchange',render);
$('#backTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
window.addEventListener('scroll',()=>$('#backTop').classList.toggle('visible',window.scrollY>260),{passive:true});
load().then(()=>{if(!location.hash)location.hash='overview';render();}).catch(e=>{console.error(e);notice('بارگذاری فضای داده با خطا روبه‌رو شد.','error');render();});
})();