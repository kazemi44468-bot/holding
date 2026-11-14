const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.dash-nav')||document.querySelector('.main-nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));}

const dateNode=document.getElementById('date')||document.getElementById('live-date');
const clockNode=document.getElementById('clock')||document.getElementById('live-clock');
function updateClock(){
 const now=new Date();
 if(dateNode)dateNode.textContent=new Intl.DateTimeFormat('fa-IR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
 if(clockNode)clockNode.textContent=new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
}
updateClock();
if(clockNode)window.setInterval(updateClock,1000);

const search=document.getElementById('department-search');
const cards=[...document.querySelectorAll('.ops-card[data-name],.department-card[data-name]')];
/* اداره‌های تازه‌تعریف‌شده کارت اختصاصی پویا می‌گیرند؛ آمار ثبت‌نشده به‌صورت صفر/خالی نمایش داده می‌شود. */
try{const cfg=JSON.parse(localStorage.getItem("deputy7.platform.config.v1")),grid=document.getElementById("department-grid"),known=new Set(["1","2","3","4","6","7","8"]);if(grid&&cfg?.departments){const activeIds=new Set(cfg.departments.filter(d=>d.status!=="inactive").map(d=>String(d.id)));grid.querySelectorAll("a.ops-card").forEach(card=>{const m=(card.getAttribute("href")||"").match(/department-(\d+)\.html/);if(m&&!activeIds.has(m[1]))card.hidden=true;});cfg.departments.forEach(d=>{if(known.has(String(d.id))){const card=grid.querySelector('a[href="pages/department-'+d.id+'.html"]');if(card){card.dataset.name=d.name;const title=card.querySelector(".ops-card-title b");if(title)title.textContent=d.name;const desc=card.querySelector(".ops-card-desc");if(desc&&d.mission)desc.textContent=d.mission;}}});cfg.departments.filter(d=>d.status!=="inactive"&&!known.has(String(d.id))).forEach(d=>{const a=document.createElement("a");a.className="ops-card";a.href="pages/department.html?dept="+encodeURIComponent(d.id);a.dataset.name=d.name;const head=document.createElement("div");head.className="ops-card-heading";const title=document.createElement("b");title.textContent=d.name;const code=document.createElement("small");code.textContent="اداره "+d.id;const titleWrap=document.createElement("span");titleWrap.className="ops-card-title";titleWrap.append(code,title);head.append(titleWrap);a.append(head);const desc=document.createElement("p");desc.className="ops-card-desc";desc.textContent=d.mission||"پرونده اداره جدید؛ شاخص‌ها و اقدامات پس از ثبت اطلاعات نمایش داده می‌شوند.";a.append(desc);const empty=document.createElement("div");empty.className="ops-common-stats";empty.textContent="هنوز داده عملیاتی برای این اداره ثبت نشده است.";a.append(empty);const foot=document.createElement("div");foot.className="ops-card-bottom";foot.textContent="ورود به پرونده اداره ←";a.append(foot);grid.append(a);cards.push(a);});}}catch(e){}

const empty=document.getElementById('no-results');
if(search){
 search.addEventListener('input',()=>{
  const q=search.value.trim().toLocaleLowerCase('fa');
  let visible=0;
  cards.forEach(card=>{
   const match=(card.dataset.name||card.textContent).toLocaleLowerCase('fa').includes(q);
   card.hidden=!match;
   if(match)visible++;
  });
  if(empty)empty.hidden=visible!==0;
 });
}

/* دکمه بازگشت به بالا بنا به درخواست حذف شده است؛ نمونه‌های قدیمی نیز پاک می‌شوند. */
document.querySelectorAll('.back-to-top').forEach(node=>node.remove());


/* ناوبری یکپارچه و منوی دسته‌بندی‌شده موبایل */
(()=>{
 const body=document.body;
 if(!body.classList.contains('ops-page'))return;
 if(!body.classList.contains("control-page"))try{const cfg=JSON.parse(localStorage.getItem("deputy7.platform.config.v1"))?.theme||JSON.parse(localStorage.getItem("deputy7.identity-access.v1"))?.theme||{};const p={navy:["#55a8d1","#398fbd","#eaf7fc"],sky:["#55a8d1","#398fbd","#eaf7fc"],slate:["#6e91a5","#52758a","#eff7fa"],sand:["#b58b59","#927044","#faf4e9"]};const v=p[cfg.palette||cfg.preset]||p.sky;document.documentElement.style.setProperty("--deputy-primary",v[0]);document.documentElement.style.setProperty("--deputy-deep",v[1]);document.documentElement.style.setProperty("--deputy-soft",v[2]);document.documentElement.style.setProperty("--green",v[0]);document.documentElement.style.setProperty("--green2",v[0]);document.documentElement.style.setProperty("--green-dark",v[1]);document.documentElement.dataset.density=cfg.density||"comfortable";document.documentElement.dataset.corners=cfg.radius||cfg.corners||"soft";document.documentElement.dataset.width=cfg.width||"wide";const ts=document.createElement("style");ts.textContent="html[data-density=compact] .ops-card,html[data-density=compact] .analytics-panel{padding:14px}html[data-corners=square] .ops-card,html[data-corners=square] .analytics-panel,html[data-corners=square] .report-box{border-radius:5px}html[data-corners=soft] .ops-card,html[data-corners=soft] .analytics-panel,html[data-corners=soft] .report-box{border-radius:14px}html[data-width=normal] .ops-main{max-width:1180px}";document.head.appendChild(ts);}catch(e){}
const inPages=location.pathname.includes('/pages/');
 const prefix=inPages?'':'pages/';
 const inLocalData=location.pathname.includes('/local-data/');
 const home=(inPages||inLocalData)?'../dashboard.html':((location.pathname.endsWith('/users.html')||location.pathname.endsWith('/control-center.html'))?'dashboard.html':'#overview');
 const localData=inPages?'../local-data/index.html':(inLocalData?'index.html':'local-data/index.html');
  const brand=document.querySelector('.ops-brand');
  if(brand)brand.href=home;
 const liveDepartments=(()=>{try{return JSON.parse(localStorage.getItem('deputy7.platform.config.v1'))?.departments||[]}catch{return[]}})();
 const deptMenu=liveDepartments.length?liveDepartments.filter(d=>d.status!=='inactive'):null;
 const urls={
  departments:(deptMenu||[{id:'1'},{id:'2'},{id:'3'},{id:'4'},{id:'6'},{id:'7'},{id:'8'}]).map(d=>prefix+(['1','2','3','4','6','7','8'].includes(String(d.id))?'department-'+d.id+'.html':'department.html?dept='+encodeURIComponent(d.id))),
  finance:prefix+'finance-management.html',workforce:prefix+'workforce.html',profile:prefix+'personnel-profile.html',evaluation:prefix+'performance-evaluation.html',
  followups:prefix+'special-followups.html',notices:prefix+'notifications-center.html',calendar:prefix+'calendar.html',
  catalog:prefix+'report-catalog.html',archive:prefix+'report-archive.html',reports:prefix+'department-reports.html',participation:prefix+'participation.html',
  localData:localData,services:prefix+'company-services.html',communications:prefix+'internal-communications.html',welfare:prefix+'welfare-center.html',
  coop:prefix+'staff-coop-store.html',economic:prefix+'employee-economic-center.html',retirees:prefix+'retiree-center.html',personnel:(inLocalData?'../pages/personnel-registry.html':prefix+'personnel-registry.html'),users:(inPages||inLocalData)?'../users.html':'users.html',control:(inPages||inLocalData)?'../control-center.html':'control-center.html'
 };
 const escapeNav=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const customPages=(()=>{try{const x=JSON.parse(localStorage.getItem("deputy7.page-registry.v1"));return (x?.pages||[]).filter(p=>p.kind==="custom"&&p.status==="published").map(p=>({...p,href:(inPages?"custom-page.html?id="+encodeURIComponent(p.id):inLocalData?"../pages/custom-page.html?id="+encodeURIComponent(p.id):"pages/custom-page.html?id="+encodeURIComponent(p.id)),safeTitle:escapeNav(p.title)}));}catch{return[]}})();
 const customMenuLinks=menu=>customPages.filter(p=>p.menu===menu).map(p=>[p.href,p.safeTitle]);
 const otherCustomPages=customMenuLinks("سایر صفحات");
 const pageCatalog=(()=>{try{return JSON.parse(localStorage.getItem("deputy7.page-registry.v1"))?.pages||[]}catch{return[]}})();
 const normalizePagePath=value=>String(value||"").split("?")[0].replace(/^\\.\\.\\//,"").replace(/^\\.\\//,"").replace(/^\\//,"");
 const pageMeta=path=>{const raw=normalizePagePath(path),exact=pageCatalog.find(p=>p.kind==="static"&&normalizePagePath(p.path)===raw);if(exact)return exact;const base=raw.split("/").pop();return pageCatalog.find(p=>p.kind==="static"&&String(p.path||"").split("/").pop()===base&&(String(p.path||"").startsWith("pages/")||!inPages));};
 const registeredPageHref=p=>{const path=String(p.path||"");return inPages?(path.startsWith("pages/")?path.slice(6):"../"+path):inLocalData?"../"+path:path;};
 const nav=document.querySelector('.ops-nav');
 /* داخل سامانه، نشان و پیوندهای خانه باید به نمای اصلی سامانه برگردند، نه درگاه معرفی. */
 document.querySelectorAll('a[href="../index.html"],a[href="index.html"]').forEach(link=>{link.href=home;});
 /* Enforce mobile header-menu removal in the primary navigation controller. */
 if(nav){
  const mobileNavQuery=window.matchMedia('(max-width: 900px)');
  const syncHeaderNav=()=>{
   if(mobileNavQuery.matches){
    nav.style.setProperty('display','none','important');
    nav.setAttribute('aria-hidden','true');
    nav.querySelectorAll('a,summary').forEach(item=>item.setAttribute('tabindex','-1'));
   }else{
    nav.style.removeProperty('display');
    nav.removeAttribute('aria-hidden');
    nav.querySelectorAll('a,summary').forEach(item=>item.removeAttribute('tabindex'));
   }
  };
  syncHeaderNav();
  if(mobileNavQuery.addEventListener)mobileNavQuery.addEventListener('change',syncHeaderNav);
  else mobileNavQuery.addListener(syncHeaderNav);
 }
 if(nav){
  nav.innerHTML='<a href="'+home+'">نمای کلان</a><details class="nav-dropdown"><summary>ادارات کل</summary><div class="nav-menu">'+
   ['اداره اداری و پشتیبانی','اداره تحقیق و توسعه','اداره پارکبان و معبربانان','اداره تأسیسات فنی و امور نگهداری','اداره فاوا و خدمات فنی','اداره جمع‌آوری و بازیافت پسماند','اداره بازرسی و تحقیقات محلی'].map((n,i)=>'<a href="'+urls.departments[i]+'">'+n+'</a>').join('')+
   '</div></details><details class="nav-dropdown"><summary>مدیریت</summary><div class="nav-menu">'+
   [[urls.users,'کاربران و سطح دسترسی'],[urls.control,'مرکز کنترل و پیکربندی'],[urls.personnel,'بانک مرکزی پرسنل'],[urls.localData,'مرکز داده و پشتیبان‌گیری'],[urls.finance,'مدیریت مالی'],[urls.workforce,'سرمایه انسانی'],[urls.profile,'پرونده پرسنلی'],[urls.evaluation,'ارزیابی عملکرد'],...customMenuLinks("مدیریت")].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('')+
   '</div></details><details class="nav-dropdown"><summary>اقدامات</summary><div class="nav-menu">'+
   [[urls.followups,'پیگیری دستورات'],[urls.notices,'اعلانات ریاست'],[urls.calendar,'تقویم شرکت'],...customMenuLinks("اقدامات")].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('')+
   '</div></details><details class="nav-dropdown"><summary>مرکز خدمات</summary><div class="nav-menu">'+
   [[urls.services,'نمای کلی خدمات'],[urls.communications,'ارتباطات کارکنان'],[urls.welfare,'خدمات رفاهی'],[urls.coop,'فروشگاه تعاونی'],[urls.economic,'برنامه‌ریزی اقتصادی'],[urls.retirees,'خدمات بازنشستگان'],...customMenuLinks("خدمات")].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('')+
   '</div></details><details class="nav-dropdown"><summary>گزارش‌ها</summary><div class="nav-menu">'+
   [[urls.reports,'گزارش تلفیقی'],[urls.participation,'نظرسنجی'],...customMenuLinks("گزارش‌ها")].map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('')+
   '</div></details>'+(otherCustomPages.length?'<details class="nav-dropdown"><summary>سایر صفحات</summary><div class="nav-menu">'+otherCustomPages.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</div></details>':'');
  const navPathKey=href=>normalizePagePath(href).split("/").pop();
  pageCatalog.filter(p=>p.kind==="static"&&p.id!=="entry"&&p.status==="published").forEach(p=>{
   const href=registeredPageHref(p),key=navPathKey(href);
   if([...nav.querySelectorAll("a")].some(a=>navPathKey(a.getAttribute("href"))===key))return;
   const menuName=p.menu==="ادارات"?"ادارات کل":(p.menu||"مدیریت");
   let dropdown=[...nav.querySelectorAll(".nav-dropdown")].find(d=>d.querySelector("summary")?.textContent.trim()===menuName);
   if(!dropdown&&menuName==="سایر صفحات"){dropdown=document.createElement("details");dropdown.className="nav-dropdown";const summary=document.createElement("summary");summary.textContent=menuName;const box=document.createElement("div");box.className="nav-menu";dropdown.append(summary,box);nav.append(dropdown);}
   const box=dropdown?.querySelector(".nav-menu");if(box){const a=document.createElement("a");a.href=href;a.textContent=p.title;box.append(a);}
  });
  nav.querySelectorAll('a').forEach(a=>{const meta=pageMeta(a.getAttribute('href'));if(meta){a.textContent=meta.title||a.textContent;if(meta.status!=="published")a.hidden=true;}});
  nav.classList.add('ops-nav-framed');
  const current=location.pathname.split('/').pop();
  nav.querySelectorAll('.nav-dropdown').forEach(menu=>{if(menu.querySelector('a[href$="'+current+'"]'))menu.querySelector('summary').classList.add('active')});
  nav.querySelectorAll('a').forEach(a=>{if(a.getAttribute('href').split('#')[0].split('/').pop()===current)a.classList.add('active')});
  nav.querySelectorAll('.nav-dropdown').forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)nav.querySelectorAll('.nav-dropdown').forEach(other=>{if(other!==menu)other.open=false})}));
  document.addEventListener('click',event=>{if(!nav.contains(event.target))nav.querySelectorAll('.nav-dropdown').forEach(d=>d.open=false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')nav.querySelectorAll('.nav-dropdown').forEach(d=>d.open=false)});
 }
 const current=location.pathname.split('/').pop();
 const groups=[
  {id:'departments',label:'ادارات',icon:'▦',links:urls.departments.map((href,i)=>[href,['اداره اداری و پشتیبانی','اداره تحقیق و توسعه','اداره پارکبان و معبربانان','اداره تأسیسات فنی و امور نگهداری','اداره فاوا و خدمات فنی','اداره جمع‌آوری و بازیافت پسماند','اداره بازرسی و تحقیقات محلی'][i]])},
  {id:'management',label:'مدیریت',icon:'▤',links:[[urls.users,'کاربران و سطح دسترسی'],[urls.control,'مرکز کنترل و پیکربندی'],[urls.personnel,'بانک مرکزی پرسنل'],[urls.localData,'مرکز داده و پشتیبان‌گیری'],[urls.finance,'مدیریت مالی'],[urls.workforce,'سرمایه انسانی'],[urls.profile,'پرونده پرسنلی'],[urls.evaluation,'ارزیابی عملکرد'],...customMenuLinks("مدیریت")]},
  {id:'actions',label:'اقدامات',icon:'✓',links:[[urls.followups,'پیگیری دستورات ریاست'],[urls.notices,'مرکز اعلانات ریاست'],[urls.calendar,'تقویم شرکت'],...customMenuLinks("اقدامات")]},
  {id:'services',label:'خدمات',icon:'◇',links:[[urls.services,'نمای کلی مرکز خدمات'],[urls.communications,'ارتباطات کارکنان'],[urls.welfare,'خدمات رفاهی'],[urls.coop,'فروشگاه و تعاونی مصرف'],[urls.economic,'برنامه‌ریزی اقتصادی'],[urls.retirees,'خدمات بازنشستگان'],...customMenuLinks("خدمات")]},
  {id:'reports',label:'گزارش‌ها',icon:'▥',links:[[urls.reports,'گزارش تلفیقی ادارات'],[urls.catalog,'کاتالوگ گزارش‌ها'],[urls.archive,'آرشیو گزارش‌ها'],[urls.participation,'نظرسنجی'],...customMenuLinks("گزارش‌ها")]},
  ...(otherCustomPages.length?[{id:'custom-pages',label:'سایر صفحات',icon:'▣',links:otherCustomPages}]:[])
 ];
 const groupForMenu={"ادارات":"departments","مدیریت":"management","اقدامات":"actions","خدمات":"services","گزارش‌ها":"reports"};
 pageCatalog.filter(p=>p.kind==="static"&&p.id!=="entry"&&p.status==="published").forEach(p=>{
  const group=groups.find(g=>g.id===groupForMenu[p.menu]);if(!group)return;
  const href=registeredPageHref(p),key=href.split("?")[0].split("/").pop();
  if(!group.links.some(([existing])=>existing.split("?")[0].split("/").pop()===key))group.links.push([href,p.title]);
 });
 groups.forEach(g=>{g.links=g.links.filter(([href])=>{const meta=pageMeta(href);return !meta||meta.status==="published";});});
 const dock=document.createElement('nav');
 dock.className='mobile-dock';
 dock.setAttribute('aria-label','منوی اصلی موبایل');
 const homeLink=document.createElement('a');
 homeLink.className='dock-home';homeLink.href=home;homeLink.innerHTML='<span class="dock-icon" aria-hidden="true">⌂</span><span>خانه</span>';
 if(current==='index.html'||current==='')homeLink.classList.add('active');
 dock.appendChild(homeLink);
 const panel=document.createElement('div');panel.className='mobile-dock-panel';panel.id='mobile-dock-panel';panel.hidden=true;
 const panelTitle=document.createElement('div');panelTitle.className='mobile-dock-panel-title';
 const panelLinks=document.createElement('div');panelLinks.className='mobile-dock-panel-links';
 panel.append(panelTitle,panelLinks);
 groups.forEach(group=>{
  const button=document.createElement('button');button.type='button';button.className='dock-group';button.dataset.group=group.id;
  button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);
  button.innerHTML='<span class="dock-icon" aria-hidden="true">'+group.icon+'</span><span>'+group.label+'</span>';
  if(group.links.some(x=>x[0].split('/').pop()===current))button.classList.add('has-current');
  button.addEventListener('click',()=>{
   const already=button.getAttribute('aria-expanded')==='true';
   dock.querySelectorAll('.dock-group').forEach(b=>{b.setAttribute('aria-expanded','false');b.classList.remove('selected')});
   if(already){panel.hidden=true;return}
   button.setAttribute('aria-expanded','true');button.classList.add('selected');
   panelTitle.textContent=group.label;
   panelLinks.innerHTML=group.links.map(([href,label])=>'<a href="'+href+'"'+(href.split('/').pop()===current?' aria-current="page"':'')+'>'+label+'</a>').join('');
   panel.hidden=false;
  });
  dock.appendChild(button);
 });
 dock.appendChild(panel);body.appendChild(dock);
 document.addEventListener('click',event=>{if(!dock.contains(event.target)){panel.hidden=true;dock.querySelectorAll('.dock-group').forEach(b=>{b.setAttribute('aria-expanded','false');b.classList.remove('selected')})}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){panel.hidden=true;dock.querySelectorAll('.dock-group').forEach(b=>{b.setAttribute('aria-expanded','false');b.classList.remove('selected')})}});
})();

/* گزارش‌ساز تعاملی و نمودارهای متحرک */
(()=> {
 const root=document.querySelector('[data-report-builder]');
 if(!root)return;
 const departments=[
  {id:'d1',name:'اداری و پشتیبانی',staff:24,ot:186,bonus:148,skill:8,reward:6,discipline:1,actions:38,done:33},
  {id:'d2',name:'تحقیق و توسعه',staff:12,ot:92,bonus:96,skill:9,reward:4,discipline:0,actions:21,done:18},
  {id:'d3',name:'پارکبان و معبربانان',staff:86,ot:1240,bonus:420,skill:18,reward:12,discipline:7,actions:246,done:199},
  {id:'d4',name:'تأسیسات فنی و نگهداری',staff:31,ot:540,bonus:265,skill:11,reward:7,discipline:3,actions:94,done:77},
  {id:'d6',name:'فاوا و خدمات فنی',staff:17,ot:214,bonus:185,skill:10,reward:5,discipline:1,actions:67,done:58},
  {id:'d7',name:'جمع‌آوری و بازیافت پسماند',staff:78,ot:1080,bonus:390,skill:15,reward:9,discipline:8,actions:312,done:249},
  {id:'d8',name:'بازرسی و تحقیقات محلی',staff:0,ot:0,bonus:0,skill:0,reward:0,discipline:0,actions:0,done:0}
 ];
 const metrics={
  actions:{label:'اقدامات ثبت‌شده',unit:'مورد',key:'actions'},
  staff:{label:'نیروی انسانی',unit:'نفر',key:'staff'},
  ot:{label:'ساعات اضافه‌کاری',unit:'ساعت',key:'ot'},
  bonus:{label:'مبالغ کارانه',unit:'میلیون تومان',key:'bonus'},
  skill:{label:'نیروهای دارای مهارت تخصصی',unit:'نفر',key:'skill'},
  reward:{label:'تشویقات ثبت‌شده',unit:'مورد',key:'reward'},
  discipline:{label:'تنبیهات و تذکرات',unit:'مورد',key:'discipline'},
  done:{label:'اقدامات تکمیل‌شده',unit:'مورد',key:'done'}
 };
 const $=s=>root.querySelector(s);
 const fmt=n=>Number(n).toLocaleString('fa-IR');
 const chosen=()=>[...root.querySelectorAll('[data-dept]:checked')].map(x=>departments.find(d=>d.id===x.dataset.dept)).filter(Boolean);
 const periodFactor=()=>({week:.22,month:.42,quarter:.72,half:1,year:1.85})[$('[name=period]').value]||1;
 const periodLabel=()=>({week:'هفتگی',month:'ماهانه',quarter:'فصلی',half:'شش‌ماهه',year:'سالانه'})[$('[name=period]').value];
 function values(list,key){return list.map(d=>Math.round(d[key]*periodFactor()));}
 function render(){
  const list=chosen(), key=$('[name=topic]').value, meta=metrics[key], vals=values(list,key), total=vals.reduce((a,b)=>a+b,0);
  const allStaff=list.reduce((a,d)=>a+d.staff,0);
  const totalActions=list.reduce((a,d)=>a+d.actions,0);
  const done=list.reduce((a,d)=>a+d.done,0);
  $('#report-selected-count').textContent=fmt(list.length)+' اداره انتخاب‌شده';
  $('#report-period-label').textContent='بازه '+periodLabel();
  $('#report-metric-label').textContent=meta.label;
  $('#report-metric-total').textContent=fmt(total);
  $('#report-metric-unit').textContent=meta.unit;
  $('#report-staff-total').textContent=fmt(allStaff);
  $('#report-actions-total').textContent=fmt(Math.round(totalActions*periodFactor()));
  $('#report-completion').textContent=(totalActions?Math.round(done/totalActions*100):0).toLocaleString('fa-IR')+'٪';
  $('#report-chart-title').textContent='مقایسه '+meta.label+' بین ادارات';
  $('#report-chart-sub').textContent='مقادیر بر اساس '+periodLabel()+' و ادارات انتخاب‌شده';
  const max=Math.max(1,...vals);
  $('#report-bars').innerHTML=list.length?list.map((d,i)=>'<div class="report-bar-item" title="'+d.name+' · '+fmt(vals[i])+'"><b>'+fmt(vals[i])+'</b><i style="--bar:'+Math.max(5,vals[i]/max*100)+'%"></i><small>'+d.name+'</small></div>').join(''):'<p class="report-empty-state">برای نمایش نمودار، حداقل یک اداره را انتخاب کنید.</p>';
  const series=list.map((d,i)=>({name:d.name,value:vals[i]}));
  const sum=series.reduce((a,x)=>a+x.value,0)||1;
  let cursor=0; const colors=['#477b59','#c2a36a','#789b83','#8d9d91','#6a8b9a','#b58a70'];
  const stops=series.map((x,i)=>{const start=cursor;cursor+=x.value/sum*100;return colors[i%colors.length]+' '+start+'% '+cursor+'%'}).join(',');
  $('#report-donut').style.background=series.length?'conic-gradient('+stops+')':'#e6ece4';
  $('#report-donut-total').textContent=fmt(sum);
  $('#report-legend').innerHTML=series.map((x,i)=>'<span><i style="background:'+colors[i%colors.length]+'"></i>'+x.name+' · '+fmt(x.value)+'</span>').join('');
  const trendMonths={week:['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه'],month:['هفته ۱','هفته ۲','هفته ۳','هفته ۴','هفته ۵','هفته ۶'],quarter:['ماه ۱','ماه ۲','ماه ۳','ماه ۴','ماه ۵','ماه ۶'],half:['ماه ۱','ماه ۲','ماه ۳','ماه ۴','ماه ۵','ماه ۶'],year:['فصل ۱','فصل ۲','فصل ۳','فصل ۴','فصل ۵','فصل ۶']}[$('[name=period]').value];
  const trend=list.map((d,i)=>{const base=d[key];return trendMonths.map((m,j)=>Math.round(base*periodFactor()*(.48+j*.105+(i%3)*.018)))});
  const width=680,height=190,pad=28,maxTrend=Math.max(1,...trend.flat());
  const paths=trend.map((arr,i)=>{const pts=arr.map((v,j)=>[pad+j*(width-2*pad)/5,height-pad-v/maxTrend*(height-2*pad)]);return '<polyline class="trend-series" style="--series-delay:'+i*.12+'s;stroke:'+colors[i%colors.length]+'" points="'+pts.map(p=>p.join(',')).join(' ')+'"/>'+pts.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+colors[i%colors.length]+'"/>').join('')}).join('');
  $('#report-trend').innerHTML='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="نمودار روند متحرک">'+[35,75,115,155].map(y=>'<path d="M20 '+y+'H660" class="trend-grid"/>').join('')+paths+'</svg><div class="trend-labels">'+trendMonths.map(m=>'<span>'+m+'</span>').join('')+'</div>';
  $('#report-trend-legend').innerHTML=series.map((x,i)=>'<span><i style="background:'+colors[i%colors.length]+'"></i>'+x.name+'</span>').join('');
  $('#report-comparison-table tbody').innerHTML=list.map((d,i)=>'<tr><td>'+d.name+'</td><td>'+fmt(vals[i])+'</td><td>'+fmt(d.staff)+'</td><td>'+fmt(Math.round(d.actions*periodFactor()))+'</td><td>'+fmt(Math.round(d.done/Math.max(1,d.actions)*100))+'٪</td></tr>').join('');
 }
 root.querySelectorAll('input,select').forEach(el=>el.addEventListener('change',render));
 $('#select-all-depts').addEventListener('click',()=>{root.querySelectorAll('[data-dept]').forEach(x=>x.checked=true);render()});
 $('#clear-depts').addEventListener('click',()=>{root.querySelectorAll('[data-dept]').forEach(x=>x.checked=false);render()});
 render();
})();

/* فارسی‌سازی یکپارچه ارقام در محتوای ثابت و محتوای پویا */
(()=> {
 const digits={'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹','٠':'۰','١':'۱','٢':'۲','٣':'۳','٤':'۴','٥':'۵','٦':'۶','٧':'۷','٨':'۸','٩':'۹'};
 const localize=value=>String(value).replace(/[0-9٠-٩]/g,ch=>digits[ch]||ch);
 const process=node=>{
  if(node.nodeType===Node.TEXT_NODE){if(/[0-9٠-٩]/.test(node.nodeValue))node.nodeValue=localize(node.nodeValue);return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  ['placeholder','title','aria-label'].forEach(attr=>{const value=node.getAttribute(attr);if(value&&/[0-9٠-٩]/.test(value))node.setAttribute(attr,localize(value));});
  if(node.matches('input[readonly],input[disabled],output')){if(/[0-9٠-٩]/.test(node.value))node.value=localize(node.value);}
  node.childNodes.forEach(process);
 };
 if(document.body){process(document.body);new MutationObserver(records=>records.forEach(record=>{record.addedNodes.forEach(process);if(record.type==='characterData')process(record.target)})).observe(document.body,{subtree:true,childList:true,characterData:true});}
 document.body.dataset.page=location.pathname.split('/').pop().replace('.html','')||'home';
})();


/* هدر در اسکرول بدون تغییر اندازه و حالت باقی می‌ماند؛ تغییرات فقط برای دکمه بازگشت به بالا است. */


/* فوتر کاملاً خالی؛ انتقال به بیرون از محتوای اصلی برای پوشش تمام عرض */
(()=>{
 const footer=document.querySelector('.ops-footer,.site-footer');
 if(!footer)return;
 footer.className='ops-footer';
 footer.replaceChildren();
 if(footer.parentElement!==document.body)document.body.appendChild(footer);
})();


/* دکمه بازگشت به بالای صفحه؛ فعال در تمام صفحات سامانه */
(()=> {
 if(!document.body.classList.contains('ops-page')||document.getElementById('ops-back-to-top'))return;
 const button=document.createElement('button');
 button.type='button';
 button.id='ops-back-to-top';
 button.setAttribute('aria-label','بازگشت به بالای صفحه');
 button.title='بازگشت به بالای صفحه';
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>';
 document.body.appendChild(button);
 const update=()=>button.classList.toggle('is-visible',window.scrollY>320);
 window.addEventListener('scroll',update,{passive:true});
 button.addEventListener('click',()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
 });
 update();
})();


/* بارگذاری نسخه تازه استایل مشترک در همه صفحات */
(()=> {
 const link=[...document.querySelectorAll('link[rel="stylesheet"]')].find(el=>/assets\/css\/style\.css(?:\?|$)/.test(el.getAttribute('href')||''));
 if(!link)return;
 const url=new URL(link.href,document.baseURI);
 url.searchParams.set('v','page-studio-20261114-5');
 if(link.href!==url.href)link.href=url.href;
})();

/* صفحه‌های ثابت نیز از بلوک‌های تکمیلی ثبت‌شده در مدیریت صفحه‌ها استفاده می‌کنند. */
(()=> {
 const nested=location.pathname.includes("/pages/")||location.pathname.includes("/local-data/");
 const base=nested?"../assets/js/":"assets/js/";
 const load=src=>new Promise((resolve,reject)=>{
  const existing=[...document.scripts].find(s=>s.src&&s.src.includes(src.split("?")[0]));
  if(existing){if(existing.dataset.loaded==="true"||existing.readyState==="complete")return resolve();existing.addEventListener("load",resolve,{once:true});existing.addEventListener("error",reject,{once:true});return;}
  const s=document.createElement("script");s.src=base+src;s.defer=true;s.onload=()=>{s.dataset.loaded="true";resolve();};s.onerror=reject;document.head.append(s);
 });
 const bridge=()=>load("page-content-bridge.js?v=page-studio-20261114-5").catch(()=>{});
 if(window.Deputy7Pages)bridge();else load("page-registry-core.js?v=page-studio-20261114-5").then(bridge).catch(()=>{});
})();
