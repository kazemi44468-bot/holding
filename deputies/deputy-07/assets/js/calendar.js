(()=> {
 const root=document.querySelector("[data-org-calendar]");
 if(!root)return;
 const fmt=n=>Number(n||0).toLocaleString("fa-IR");
 const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 const departments={"1":"اداره اداری و پشتیبانی","2":"اداره تحقیق و توسعه","3":"اداره پارک بان و معبربانان","4":"اداره تأسیسات فنی و امور نگهداری","6":"اداره فاوا و خدمات فنی","7":"اداره جمع‌آوری، نگهداری و بازیافت پسماند","8":"اداره بازرسی و تحقیقات محلی"};
 const events=[
  {date:"2026-11-22",type:"meeting",dept:"all",title:"نشست راهبری و مرور اولویت‌های معاونت ۷",detail:"بررسی وضعیت اقدامات جاری، موانع اجرایی و تصمیم‌های بین‌اداره‌ای",time:"۰۹:۰۰",place:"اتاق جلسات ستاد"},
  {date:"2026-11-04",type:"meeting",dept:"1",title:"جلسه بررسی امور پرسنلی",detail:"بررسی درخواست‌ها و برنامه‌های امور اداری",time:"۱۰:۰۰",place:"اداره اداری و پشتیبانی"},
  {date:"2026-11-06",type:"session",dept:"2",title:"نشست بررسی طرح‌های پژوهشی",detail:"ارزیابی پیشرفت طرح‌ها و تعیین گام‌های بعدی",time:"۱۱:۰۰",place:"اداره تحقیق و توسعه"},
  {date:"2026-11-05",type:"meeting",dept:"3",title:"جلسه هماهنگی عملیات میدانی",detail:"هماهنگی سرپرستان و برنامه عملیات مناطق",time:"۰۸:۳۰",place:"اداره پارک بان و معبربانان"},
  {date:"2026-11-07",type:"meeting",dept:"4",title:"جلسه برنامه نگهداری تأسیسات",detail:"مرور برنامه تعمیرات و اولویت‌بندی تجهیزات",time:"۰۹:۳۰",place:"اداره تأسیسات فنی"},
  {date:"2026-11-08",type:"meeting",dept:"6",title:"جلسه پایش زیرساخت و سامانه‌ها",detail:"بررسی پایداری خدمات و برنامه ارتقای زیرساخت",time:"۱۰:۰۰",place:"اداره فاوا"},
  {date:"2026-11-09",type:"meeting",dept:"7",title:"جلسه هماهنگی عملیات پسماند",detail:"هماهنگی برنامه جمع‌آوری و مدیریت مسیرها",time:"۰۸:۰۰",place:"اداره پسماند"},
  {date:"2026-11-11",type:"action",dept:"1",title:"کارگاه آموزش و توسعه کارکنان",detail:"اجرای برنامه آموزشی دوره و ثبت حضور کارکنان",time:"۰۹:۰۰",place:"سالن آموزش"},
  {date:"2026-11-10",type:"session",dept:"3",title:"نشست سرپرستان مناطق",detail:"بررسی گزارش‌های میدانی و هماهنگی عملیات",time:"۰۹:۰۰",place:"اداره پارک بان و معبربانان"},
  {date:"2026-11-12",type:"action",dept:"4",title:"بازدید فنی دوره‌ای",detail:"کنترل وضعیت تجهیزات و ثبت موارد نیازمند اقدام",time:"۰۸:۰۰",place:"محدوده عملیاتی"},
  {date:"2026-11-13",type:"meeting",dept:"2",title:"جلسه شورای تحقیق و توسعه",detail:"ارائه نتایج مطالعات و تعیین اولویت‌های پژوهشی",time:"۱۱:۰۰",place:"اداره تحقیق و توسعه"},
  {date:"2026-11-14",type:"session",dept:"6",title:"نشست امنیت و پایداری خدمات",detail:"مرور رخدادها و برنامه تداوم خدمت",time:"۱۰:۳۰",place:"اداره فاوا"},
  {date:"2026-11-15",type:"session",dept:"7",title:"نشست ارزیابی مسیرهای جمع‌آوری",detail:"بررسی ظرفیت ناوگان و اصلاح برنامه مسیرها",time:"۰۹:۰۰",place:"اداره پسماند"},
  {date:"2026-11-16",type:"action",dept:"3",title:"پایش برنامه ساماندهی معابر",detail:"بازبینی نقاط پرتردد و ثبت نتیجه اقدامات",time:"۰۷:۳۰",place:"محدوده عملیاتی"},
  {date:"2026-11-17",type:"action",dept:"1",title:"بازبینی پرونده‌های استخدامی",detail:"کنترل و تکمیل سوابق اداری",time:"۰۹:۰۰",place:"اداره اداری و پشتیبانی"},
  {date:"2026-11-18",type:"action",dept:"6",title:"اجرای برنامه ارتقای تجهیزات",detail:"به‌روزرسانی و تحویل تجهیزات برنامه‌ریزی‌شده",time:"۰۸:۳۰",place:"اداره فاوا"},
  {date:"2026-11-19",type:"action",dept:"2",title:"ارائه نتایج مطالعات دوره‌ای",detail:"جمع‌بندی گزارش پژوهشی و ارائه به مدیریت",time:"۱۱:۰۰",place:"اداره تحقیق و توسعه"},
  {date:"2026-11-20",type:"action",dept:"4",title:"کنترل وضعیت تجهیزات و تأسیسات",detail:"بازبینی فنی و ثبت گزارش نگهداری",time:"۰۸:۰۰",place:"اداره تأسیسات فنی"},
  {date:"2026-11-21",type:"action",dept:"7",title:"پایش برنامه تفکیک و بازیافت",detail:"ارزیابی شاخص‌های اجرایی و ثبت گزارش",time:"۰۷:۰۰",place:"اداره پسماند"},
  {date:"2026-11-03",type:"resolution",dept:"1",orderId:"R-1405-021",title:"مصوبه یکپارچه‌سازی گزارش عملکرد ماهانه",detail:"",time:"",place:""},
  {date:"2026-11-06",type:"resolution",dept:"4",orderId:"R-1405-022",title:"مصوبه اولویت‌بندی تعمیرات تجهیزات",detail:"",time:"",place:""},
  {date:"2026-11-07",type:"resolution",dept:"7",orderId:"R-1405-025",title:"مصوبه بازنگری مسیرهای جمع‌آوری پسماند",detail:"",time:"",place:""}
 ];
 events.push(
  /* برنامه جلسات ریاست با مدیران ادارات و برنامه‌های تکمیلی زمان‌دار */
  {date:"2026-11-10",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره اداری و پشتیبانی",detail:"مرور وضعیت نیروی انسانی، مکاتبات، پشتیبانی و تصمیم‌گیری درباره درخواست‌های ارجاعی",time:"۰۸:۳۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-11",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره تحقیق و توسعه",detail:"ارائه گزارش طرح‌های پژوهشی، اولویت‌بندی مطالعات و تعیین خروجی‌های قابل تحویل",time:"۰۹:۰۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-12",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره پارکبان و معبربانان",detail:"بررسی پوشش مناطق، وضعیت نیروهای میدانی، انضباط عملیاتی و نیازهای تجهیزاتی",time:"۰۸:۳۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-15",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره تأسیسات فنی و امور نگهداری",detail:"بررسی خرابی‌های باز، برنامه نگهداری پیشگیرانه و اولویت تعمیرات",time:"۰۹:۰۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-16",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره فاوا و خدمات فنی",detail:"مرور پایداری سامانه‌ها، امنیت اطلاعات، پشتیبانی کاربران و برنامه توسعه زیرساخت",time:"۰۹:۰۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-17",type:"meeting",dept:"all",title:"جلسه ریاست معاونت ۷ با اداره جمع‌آوری و بازیافت پسماند",detail:"ارزیابی ناوگان، مسیرهای جمع‌آوری، شاخص‌های پاکیزگی و برنامه بازیافت",time:"۰۸:۳۰",place:"اتاق جلسات ریاست"},
  {date:"2026-11-18",type:"meeting",dept:"all",title:"جلسه شورای مدیران و جمع‌بندی عملکرد ادارات",detail:"ارائه گزارش هفت اداره، بررسی انحراف برنامه‌ها و تصویب اقدامات اصلاحی",time:"۱۰:۰۰",place:"سالن جلسات مرکزی"},
  {date:"2026-11-19",type:"meeting",dept:"1",title:"جلسه هفتگی هماهنگی اداره اداری و پشتیبانی",detail:"تقسیم کار هفتگی، وضعیت درخواست‌ها و مرور پرونده‌های دارای مهلت",time:"۰۹:۰۰",place:"اتاق اداره"},
  {date:"2026-11-19",type:"meeting",dept:"2",title:"جلسه هفتگی شورای پژوهش",detail:"کنترل نقاط عطف طرح‌ها و بررسی مستندات مطالعاتی",time:"۱۱:۰۰",place:"اتاق اداره"},
  {date:"2026-11-20",type:"meeting",dept:"3",title:"جلسه هفتگی سرپرستان مناطق",detail:"توزیع برنامه شیفت‌ها، مرور گزارش‌های میدانی و رفع موانع",time:"۰۸:۰۰",place:"اتاق عملیات"},
  {date:"2026-11-21",type:"meeting",dept:"4",title:"جلسه کنترل برنامه نگهداری پیشگیرانه",detail:"بررسی چک‌لیست تجهیزات و زمان‌بندی تعمیرات هفته آینده",time:"۰۹:۳۰",place:"کارگاه فنی"},
  {date:"2026-11-22",type:"meeting",dept:"6",title:"جلسه تغییرات و انتشار سامانه‌ها",detail:"بررسی درخواست‌های تغییر، پنجره‌های نگهداری و برنامه پشتیبان‌گیری",time:"۱۰:۰۰",place:"اتاق فاوا"},
  {date:"2026-11-23",type:"meeting",dept:"7",title:"جلسه برنامه‌ریزی ناوگان و مسیرها",detail:"تنظیم برنامه خودروها، مسیرهای پرتردد و شیفت‌های عملیاتی",time:"۰۸:۰۰",place:"اتاق عملیات پسماند"},
  {date:"2026-11-10",type:"training",dept:"1",title:"دوره آموزش مکاتبات و اتوماسیون اداری",detail:"آموزش گردش مکاتبات، ثبت سوابق و استانداردهای بایگانی",time:"۱۰:۰۰",place:"سالن آموزش"},
  {date:"2026-11-13",type:"training",dept:"3",title:"دوره ایمنی و مدیریت عملیات میدانی",detail:"مرور اصول ایمنی، ارتباطات میدانی و مدیریت شرایط غیرعادی",time:"۰۸:۰۰",place:"سالن آموزش"},
  {date:"2026-11-18",type:"training",dept:"6",title:"کارگاه امنیت اطلاعات و حفاظت داده",detail:"آشنایی با کنترل دسترسی، گذرواژه امن و گزارش رخدادهای امنیتی",time:"۱۳:۰۰",place:"آزمایشگاه فاوا"},
  {date:"2026-11-24",type:"training",dept:"4",title:"آموزش نگهداری ایمن تجهیزات فنی",detail:"چک‌لیست بازدید، ثبت خرابی و اصول ایمنی کارگاه",time:"۰۹:۰۰",place:"کارگاه فنی"},
  {date:"2026-11-26",type:"training",dept:"7",title:"کارگاه مدیریت پسماند و تفکیک در مبدأ",detail:"آموزش روش‌های اجرایی، کنترل کیفیت و ثبت شاخص‌های بازیافت",time:"۰۹:۰۰",place:"سالن آموزش"},
  {date:"2026-11-25",type:"action",dept:"1",title:"مهلت نهایی جمع‌بندی گزارش ماهانه ادارات",detail:"دریافت و کنترل گزارش‌ها و آماده‌سازی بسته مدیریتی",time:"۱۴:۰۰",place:"دبیرخانه ریاست"},
  {date:"2026-11-27",type:"action",dept:"4",title:"بازدید مشترک ایمنی و تأسیسات",detail:"ثبت نواقص، تعیین مسئول رفع و زمان‌بندی اقدام اصلاحی",time:"۰۸:۰۰",place:"محدوده عملیاتی"},
  {date:"2026-11-28",type:"session",dept:"all",title:"نشست هماهنگی برنامه هفته آینده",detail:"تطبیق تقویم ادارات، جلسات ریاست، آموزش‌ها و مأموریت‌های میدانی",time:"۱۰:۳۰",place:"دبیرخانه مدیریت"},
  {date:"2026-11-30",type:"meeting",dept:"all",title:"جلسه ماهانه پایش تعهدات و مصوبات",detail:"بررسی وضعیت مصوبات، موارد معوق و تعیین برنامه پیگیری ماه بعد",time:"۰۹:۰۰",place:"اتاق جلسات مرکزی"}
 );
 const hrEventNames={birthday:"تولد",marriage:"ازدواج","marriage-anniversary":"سالگرد ازدواج",promotion:"ترفیع و ارتقا",appointment:"انتصاب یا تغییر سمت",contract:"تمدید قرارداد یا حکم",evaluation:"ارزیابی عملکرد",training:"آموزش و گواهی",leave:"مرخصی و بازگشت به کار",retirement:"بازنشستگی",award:"تقدیر و مناسبت سازمانی",other:"سایر رویدادها"};
 const localToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
 const hrActionLabel=e=>!e.actionRequired?"اقدامی تعریف نشده":e.actionStatus==="done"?"انجام شده":e.actionDue&&e.actionDue<localToday()?"معوق · موعد گذشته":e.actionDue===localToday()?"موعد امروز":e.actionStatus==="in-progress"?"در حال انجام":"انجام نشده";
 const hrEvents=[];
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key||!key.startsWith("city-person-events-"))continue;try{const personnelCode=key.slice("city-person-events-".length);if(!/^\d{4}$/.test(personnelCode)||Number(personnelCode)<1000||Number(personnelCode)>1249)continue;const rows=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(rows))rows.forEach(e=>hrEvents.push({...e,type:"personal",personnelCode,dept:String(e.dept||"").replace(/^d/,""),hrEventType:e.eventType||"other",actionLabel:hrActionLabel(e),personName:e.personName||""}));}catch(e){}}
 events.push(...hrEvents.map(e=>({...e,detail:[e.detail||"",e.personName||"",e.actionRequired?"اقدام: "+e.actionLabel:""].filter(Boolean).join(" · ")})));
 const shared=window.CITY_ORG_DATA;
 if(shared)events.forEach(e=>{if(e.orderId){const o=shared.orders.find(x=>x.id===e.orderId);if(o){e.title=o.title;e.detail="مخاطب اجرا: "+shared.byId(o.dept).name+" · مسئول: "+o.owner+" · پرونده "+o.id;e.place="مهلت "+o.deadline+" · "+o.status;}}});
 const typeNames={meeting:"جلسه",session:"نشست",action:"اقدام",mission:"مأموریت",training:"آموزش",personal:"مناسبت پرسنلی",resolution:"مصوبه ریاست"};
 const countType=type=>{const rows=events.filter(e=>e.type===type);return type==="mission"?new Set(rows.map(e=>e.missionCode||e.title)).size:rows.length;};
 const countAll=()=>events.filter(e=>e.type!=="mission").length+countType("mission");
 const fa=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{day:"numeric"});
 const fullDate=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const monthTitle=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{month:"long",year:"numeric"});
 const keyOf=d=>{const p=new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"numeric"}).formatToParts(d);return p.find(x=>x.type==="year").value+"/"+p.find(x=>x.type==="month").value};
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 const fromIso=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d,12)};
 const dayNumber=d=>fa.format(d);
 const typeFilter=root.querySelector("[data-calendar-type]");
 const deptFilter=root.querySelector("[data-calendar-dept]");
 const grid=root.querySelector("[data-calendar-grid]");
 const list=root.querySelector("[data-calendar-events]");
 const selectedTitle=root.querySelector("[data-selected-title]");
 const monthLabel=root.querySelector("[data-calendar-month]");
 const personalList=root.querySelector("[data-personal-events]");
 let selected=new Date();selected.setHours(12,0,0,0);
 let monthStart=startOfMonth(selected);
 function startOfMonth(d){const x=new Date(d);x.setHours(12,0,0,0);const k=keyOf(x);while(true){const p=new Date(x);p.setDate(p.getDate()-1);if(keyOf(p)!==k)break;x.setTime(p.getTime());}return x;}
 function monthDays(first){const k=keyOf(first);let n=0;const x=new Date(first);while(keyOf(x)===k){n++;x.setDate(x.getDate()+1);}return n;}
 function filtered(){return events.filter(e=>(typeFilter.value==="all"||e.type===typeFilter.value)&&(deptFilter.value==="all"||e.dept==="all"||e.dept===deptFilter.value));}
 function card(e){const d=fromIso(e.date);const hr=e.hrEventType?'<span>'+hrEventNames[e.hrEventType]+'</span><span>'+esc(e.actionLabel)+'</span>'+(e.actionDue?'<span>مهلت اقدام: '+new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"medium"}).format(fromIso(e.actionDue))+'</span>':''):'';return '<article class="calendar-event"><div class="calendar-event-date"><b>'+dayNumber(d)+'</b><span>'+new Intl.DateTimeFormat("fa-IR-u-ca-persian",{month:"short"}).format(d)+'</span></div><div class="calendar-event-content"><b>'+esc(e.title)+'</b><p>'+esc(e.detail)+'</p><div class="calendar-event-meta"><span>'+typeNames[e.type]+'</span><span>'+ (e.dept==="all"?"ستاد معاونت ۷":departments[e.dept]||"")+'</span>'+hr+(e.time?'<span>'+esc(e.time)+'</span>':'')+(e.place?'<span>'+esc(e.place)+'</span>':'')+'</div></div></article>';}
 function renderGrid(){
  monthLabel.textContent=monthTitle.format(monthStart);
  const first=new Date(monthStart);const offset=(first.getDay()+1)%7;const total=monthDays(first);const rows=Math.ceil((offset+total)/7);const today=iso(new Date());
  const all=filtered();let html="";
  for(let i=0;i<rows*7;i++){const d=new Date(first);d.setDate(d.getDate()-offset+i);const date=iso(d);const dayEvents=all.filter(e=>e.date===date);const outside=keyOf(d)!==keyOf(first);const classes=["calendar-day",outside?"outside":"",date===iso(selected)?"selected":"",date===today?"today":""].filter(Boolean).join(" ");const dots=dayEvents.slice(0,4).map(e=>'<em class="'+e.type+'"></em>').join("");html+='<button type="button" class="'+classes+'" data-day="'+date+'"><b>'+dayNumber(d)+'</b><i>'+dots+'</i></button>';}
  grid.innerHTML=html;
  grid.querySelectorAll("[data-day]").forEach(b=>b.addEventListener("click",()=>{selected=fromIso(b.dataset.day);if(keyOf(selected)!==keyOf(monthStart))monthStart=startOfMonth(selected);render();}));
 }
 function renderList(){
  const day=iso(selected);const matches=filtered().filter(e=>e.date===day).sort((a,b)=>a.type.localeCompare(b.type));
  selectedTitle.textContent=fullDate.format(selected);
  if(matches.length)list.innerHTML=matches.map(card).join("");
  else{const upcoming=filtered().filter(e=>e.date>day).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);list.innerHTML='<div class="calendar-empty">برای این روز رویدادی ثبت نشده است.</div>'+(upcoming.length?'<h3 class="calendar-selected-title">رویدادهای نزدیک</h3>'+upcoming.map(card).join(""):"");}
 }
 function renderPersonal(){const p=events.filter(e=>e.type==="personal").sort((a,b)=>a.date.localeCompare(b.date));personalList.innerHTML=p.map(card).join("");}
 function render(){renderGrid();renderList();}
 root.querySelector("[data-cal-prev]").addEventListener("click",()=>{const p=new Date(monthStart);p.setDate(p.getDate()-1);monthStart=startOfMonth(p);selected=new Date(monthStart);render();});
 root.querySelector("[data-cal-next]").addEventListener("click",()=>{const n=new Date(monthStart);n.setDate(n.getDate()+monthDays(monthStart));monthStart=startOfMonth(n);selected=new Date(monthStart);render();});
 typeFilter.addEventListener("change",render);deptFilter.addEventListener("change",render);
 root.querySelectorAll("[data-calendar-count]").forEach(n=>{n.textContent=new Intl.NumberFormat("fa-IR").format(countType(n.dataset.calendarCount));});
 const totalNode=root.querySelector("[data-calendar-total]");if(totalNode)totalNode.textContent=fmt(countAll());
 const personSummary=root.querySelector("[data-calendar-person-summary]");
 const summary=root.querySelector("[data-calendar-department-summary]");
 let centralPeople=[];
 function renderPersonnelSummary(){
  if(!personSummary)return;
  const people=centralPeople;
  personSummary.innerHTML=people.map(p=>{
   const code=p.code||p.id,name=p.name||((p.profile?.firstName||"")+" "+(p.profile?.lastName||"")).trim(),dept=String(p.profile?.departmentId||p.dept||"").replace(/^d/,"");
   const personalEvents=events.filter(e=>String(e.personnelCode||e.personId||"")===String(code));
   const assigned=[];
   const meetings=personalEvents.filter(e=>e.type==="meeting"||e.type==="session").length,trainings=personalEvents.filter(e=>e.type==="training").length,actions=assigned.length+personalEvents.filter(e=>e.type==="action"||e.type==="resolution").length,milestones=personalEvents.filter(e=>e.type==="personal").length;
   return "<tr><td>"+esc(name)+" · "+esc(code)+"</td><td>"+esc(departments[dept]||"—")+"</td><td>"+fmt(meetings)+"</td><td>"+fmt(trainings)+"</td><td>"+fmt(actions)+"</td><td>"+fmt(milestones)+"</td><td>"+fmt(meetings+trainings+actions+milestones)+"</td></tr>";
  }).join("");
 }
 function renderDepartmentSummary(){
  if(!summary)return;
  const staff=Object.fromEntries(Object.keys(departments).map(id=>[id,centralPeople.filter(p=>String(p.profile?.departmentId||p.dept||"").replace(/^d/,"")===id).length]));
  summary.innerHTML=Object.entries(departments).map(([id,name])=>{
   const list=events.filter(e=>e.dept===id||(e.dept==="all"&&e.personnelCode&&centralPeople.some(p=>p.code===e.personnelCode&&String(p.profile?.departmentId)===id)));
   const sessions=list.filter(e=>e.type==="meeting"||e.type==="session").length,trainings=list.filter(e=>e.type==="training").length,actions=list.filter(e=>e.type==="action"||e.type==="resolution").length,milestones=list.filter(e=>e.type==="personal").length;
   return "<tr><td>"+name+"</td><td>"+fmt(staff[id]||0)+"</td><td>"+fmt(list.length)+"</td><td>"+fmt(sessions)+"</td><td>"+fmt(trainings)+"</td><td>"+fmt(actions)+"</td><td>"+fmt(milestones)+"</td></tr>";
  }).join("");
 }
 window.setPersonnelCalendarData=(people,personalEvents)=>{
  centralPeople=people||[];
  events.splice(0,events.length,...events.filter(e=>e.source!=="personnel-registry"),...(personalEvents||[]));
  root.querySelectorAll("[data-calendar-count]").forEach(n=>n.textContent=fmt(events.filter(e=>e.type===n.dataset.calendarCount).length));
  const total=root.querySelector("[data-calendar-total]");if(total)total.textContent=fmt(countAll());
  render();renderPersonal();renderPersonnelSummary();renderDepartmentSummary();
 };
 window.addEventListener("deputy7:mission-calendar",event=>{
  const incoming=Array.isArray(event.detail)?event.detail:[];
  incoming.forEach(item=>{if(item.dept&&item.departmentName)departments[String(item.dept)]=item.departmentName;});
  events.splice(0,events.length,...events.filter(item=>item.source!=="mission-vault"),...incoming.map(item=>({...item,source:"mission-vault"})));
  root.querySelectorAll("[data-calendar-count]").forEach(node=>node.textContent=fmt(events.filter(item=>item.type===node.dataset.calendarCount).length));
  const total=root.querySelector("[data-calendar-total]");if(total)total.textContent=fmt(events.length);
  render();renderPersonal();renderPersonnelSummary();renderDepartmentSummary();
 });
 render();renderPersonal();renderPersonnelSummary();renderDepartmentSummary();
})();
