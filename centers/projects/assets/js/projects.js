(()=>{'use strict';
const SCOPE='project-center',RECORD_ID='project-center-state',KEY='holding_project_center_v1';
const $=s=>document.querySelector(s),view=$('#view'),fa=n=>new Intl.NumberFormat('fa-IR').format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};
const isoNow=()=>new Date().toISOString();
const fmtDate=v=>{if(!v)return '—';const d=new Date(v.length===10?v+'T12:00:00':v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium'}).format(d)};
const fmtDateTime=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(d)};
const makeId=p=>p+'-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
const blank=()=>({schemaVersion:1,projects:[],tasks:[],calls:[],events:[],updatedAt:isoNow()});
let db=blank(),saving=false;
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
async function load(){
 let raw=null;
 if(window.HoldingLocalDataVault){try{const r=await window.HoldingLocalDataVault.get(RECORD_ID);if(r?.content)raw=r.content;}catch(e){}}
 if(!raw)raw=localStorage.getItem(KEY);
 if(raw){try{const parsed=JSON.parse(raw);if(parsed&&Array.isArray(parsed.projects)){db={...blank(),...parsed,projects:Array.isArray(parsed.projects)?parsed.projects:[],tasks:Array.isArray(parsed.tasks)?parsed.tasks:[],calls:Array.isArray(parsed.calls)?parsed.calls:[],events:Array.isArray(parsed.events)?parsed.events:[]};}}catch(e){notice('خواندن داده‌های قبلی ممکن نشد؛ فضای خالی نمایش داده می‌شود.','error');}}
 await save();
}
function notice(message,type='info'){const el=$('#app-status');if(!el)return;el.textContent=message;el.className='app-status show'+(type==='error'?' error':'');clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.className='app-status',5500);}
function weighted(tasks,key){
 const total=tasks.reduce((s,t)=>s+Math.max(1,Number(t.weight)||1),0);
 return total?tasks.reduce((s,t)=>s+Math.max(1,Number(t.weight)||1)*Math.max(0,Math.min(100,Number(t[key])||0)),0)/total:0;
}
function scheduledPercent(task,now=new Date()){
 if(!task.startDate||!task.dueDate)return null;
 const a=new Date(task.startDate+'T00:00:00'),b=new Date(task.dueDate+'T23:59:59');
 if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<=a)return null;
 if(now<=a)return 0;if(now>=b)return 100;
 return (now-a)/(b-a)*100;
}
function projectMetrics(p){
 const tasks=tasksOf(p.id),actual=weighted(tasks,'approvedPercent'),reported=weighted(tasks,'reportedPercent');
 const base=p.baselines?.[p.baselines.length-1]||null;
 const schedule=base?.tasks?.length?base.tasks:tasks;
 const dated=schedule.filter(t=>t.startDate&&t.dueDate);
 const plan=dated.length?weighted(dated.map(t=>({...t,plannedPercent:scheduledPercent(t)})),'plannedPercent'):null;
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
 projects:['پروژه‌ها و سبد','ثبت درخواست، تصویب، اولویت‌بندی و مدیریت پروژه‌ها'],
 tasks:['کارها و اقدامات','واگذاری، پیگیری، گزارش پیشرفت و ثبت شواهد انجام کار'],
 calls:['جمع‌سپاری سازمانی','فراخوان مشارکت، اعلام آمادگی و تخصیص مسئولیت'],
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
function stat(label,value,unit=''){const shown=typeof value==='number'?fa(value):esc(value);return '<div class="pc-stat"><small>'+esc(label)+'</small><strong>'+shown+'</strong><em>'+esc(unit)+'</em></div>';}
function eventList(items){
 if(!items.length)return empty('هنوز رویدادی ثبت نشده است','با ثبت پروژه، وظیفه یا گزارش، تاریخچه اقدامات در این قسمت نمایش داده می‌شود.');
 return '<div class="pc-timeline">'+items.slice(0,9).map(e=>'<div class="pc-event"><time>'+fmtDateTime(e.at)+'</time><div><strong>'+esc(e.title)+'</strong><p>'+esc(e.details||e.action||'')+'</p></div></div>').join('')+'</div>';
}
function projectCard(p){
 const m=projectMetrics(p);
 return '<article class="pc-project-card"><div class="pc-panel-head"><h4>'+esc(p.title)+'</h4>'+badge(p.status)+'</div><p>'+esc(p.summary||'شرح کوتاه پروژه ثبت نشده است.')+'</p><div class="pc-card-meta"><span class="pc-badge">'+esc(orgLabel(p.orgId))+'</span><span class="pc-badge">موعد: '+fmtDate(p.dueDate)+'</span><span class="pc-badge">'+fa(m.tasks.length)+' کار</span></div>'+progressBar(m.actual,'پیشرفت تأییدشده')+'<div class="pc-card-actions"><button class="pc-btn secondary" data-action="open-project" data-id="'+p.id+'">مشاهده پرونده</button>'+(p.status==='در انتظار تصویب'?'<button class="pc-btn gold" data-action="approve-project" data-id="'+p.id+'">تصویب درخواست</button>':'')+'</div></article>';
}
function renderOverview(){
 const ps=activeProjects(),ts=db.tasks.filter(t=>!t.archived),late=ts.filter(t=>t.dueDate&&t.dueDate<today()&&t.status!=='تکمیل‌شده'&&t.status!=='مختومه').length;
 const waiting=ps.filter(p=>p.status==='در انتظار تصویب').length,calls=db.calls.filter(c=>c.status==='باز').length;
 const risk=ps.filter(p=>{const m=projectMetrics(p);return m.variance!==null&&m.variance< -2;}).length;
 return '<section class="pc-hero"><div><div class="pc-kicker">مدیریت یکپارچه سبد، پروژه و کار</div><h3>از تصمیم تا نتیجه؛ با سابقه قابل پیگیری</h3><p>در این مرکز، پروژه‌ها به کارهای قابل واگذاری و سنجش تبدیل می‌شوند. برنامه مصوب، گزارش مجری، پیشرفت تأییدشده و تاریخچه تغییرات از یکدیگر تفکیک می‌شوند تا گزارش مدیریتی قابل اتکا باشد.</p></div><div class="pc-hero-side"><strong>'+fa(ps.length)+'</strong><span>پروژه ثبت‌شده در این فضای محلی</span></div></section>'+
 '<div class="pc-stats">'+stat('پروژه‌های فعال',ps.filter(p=>!['مختومه','لغوشده','بایگانی‌شده'].includes(p.status)).length,'پروژه')+stat('کل وظایف',ts.length,'کار')+stat('وظایف سررسیدگذشته',late,'نیازمند پیگیری')+stat('در انتظار تصویب',waiting,'درخواست')+stat('فراخوان‌های باز',calls,'مشارکت')+'</div>'+
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
function renderProjects(){
 const ps=activeProjects();
 return projectForm()+'<section class="pc-panel"><div class="pc-panel-head"><div><h3>فهرست پروژه‌ها و درخواست‌ها</h3><p>فهرست بر مبنای داده‌های واردشده در همین فضای محلی</p></div><span class="pc-badge">'+fa(ps.length)+' مورد</span></div>'+
 '<div class="pc-toolbar"><input id="project-search" placeholder="جست‌وجوی عنوان یا شناسه"><select id="project-filter"><option value="">همه وضعیت‌ها</option><option>در انتظار تصویب</option><option>مصوب / در اجرا</option><option>متوقف</option><option>مختومه</option></select></div>'+
 (ps.length?'<div class="pc-grid">'+ps.map(projectCard).join('')+'</div>':empty('سبد پروژه خالی است','درخواست اول را از فرم بالا ثبت کنید؛ هیچ پروژه نمونه یا رقم ساختگی در این فهرست قرار نگرفته است.'))+'</section>';
}
function taskForm(projectId=''){
 const projectOptions=activeProjects().map(p=>'<option value="'+p.id+'" '+(p.id===projectId?'selected':'')+'>'+esc(p.title)+'</option>').join('');
 return '<details class="pc-panel"><summary class="pc-section-title">＋ تعریف وظیفه یا اقدام جدید</summary><form class="pc-form" id="task-form">'+
 '<div class="pc-field full"><label>عنوان کار *</label><input name="title" required maxlength="180" placeholder="اقدام مشخص و قابل تحویل"></div>'+
 '<div class="pc-field"><label>پروژه مرتبط</label><select name="projectId"><option value="">کار مستقل / اقدام عمومی</option>'+projectOptions+'</select></div>'+
 '<div class="pc-field"><label>قلمرو سازمانی</label><select name="orgId">'+orgOptions('HOLDING')+'</select></div>'+
 '<div class="pc-field"><label>مسئول انجام</label><input name="assignee" placeholder="نام فرد یا تیم"></div>'+
 '<div class="pc-field"><label>مالک پاسخ‌گو</label><input name="owner" placeholder="مسئول پیگیری و پذیرش"></div>'+
 '<div class="pc-field"><label>شروع برنامه‌ای</label><input name="startDate" type="date"></div>'+
 '<div class="pc-field"><label>موعد انجام</label><input name="dueDate" type="date"></div>'+
 '<div class="pc-field"><label>وزن در پیشرفت پروژه</label><input name="weight" type="number" min="1" max="100" value="1"></div>'+
 '<div class="pc-field"><label>اولویت</label><select name="priority"><option>عادی</option><option>بالا</option><option>فوری</option></select></div>'+
 '<div class="pc-field full"><label>تعریف نتیجه / معیار پذیرش</label><textarea name="acceptance" placeholder="چه چیزی و با چه شاهدی تحویل می‌شود؟"></textarea></div>'+
 '<div class="pc-field full"><button class="pc-btn" type="submit">ثبت وظیفه</button></div></form></details>';
}
function taskRow(t){
 const p=projectBy(t.projectId),rp=Number(t.reportedPercent)||0,ap=Number(t.approvedPercent)||0;
 return '<tr><td><strong>'+esc(t.title)+'</strong><small>'+esc(t.id)+' · '+esc(t.assignee||'مسئول تعیین نشده')+'</small></td><td>'+esc(p?.title||'کار مستقل')+'</td><td>'+fmtDate(t.dueDate)+'</td><td>'+badge(t.status)+'</td><td>'+fa(ap)+'٪ <small>اعلامی: '+fa(rp)+'٪</small></td><td><button class="pc-btn secondary" data-action="task-report" data-id="'+t.id+'">ثبت گزارش</button>'+(rp>ap?'<button class="pc-btn gold" data-action="accept-report" data-id="'+t.id+'">تأیید گزارش</button>':'')+'</td></tr>';
}
function renderTasks(){
 const ts=db.tasks.filter(t=>!t.archived);
 return taskForm()+'<section class="pc-panel"><div class="pc-panel-head"><div><h3>کارتابل وظایف و اقدامات</h3><p>درصد اعلامی و درصد تأییدشده جداگانه نگهداری می‌شوند.</p></div><span class="pc-badge">'+fa(ts.length)+' کار</span></div>'+
 '<div class="pc-toolbar"><input id="task-search" placeholder="جست‌وجوی عنوان، مسئول یا شناسه"><select id="task-filter"><option value="">همه وضعیت‌ها</option><option>در انتظار شروع</option><option>در حال اجرا</option><option>در انتظار تأیید</option><option>تکمیل‌شده</option><option>متوقف</option></select></div>'+
 (ts.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>عنوان / مسئول</th><th>پروژه</th><th>موعد</th><th>وضعیت</th><th>پیشرفت تأییدشده</th><th>اقدام</th></tr></thead><tbody>'+ts.map(taskRow).join('')+'</tbody></table></div>':empty('هنوز کاری ثبت نشده است','کارهای مستقل یا وظایف مرتبط با پروژه را از فرم بالا تعریف کنید.'))+'</section>';
}
function renderCalls(){
 const open=db.calls.filter(c=>c.status==='باز');
 return '<section class="pc-hero"><div><div class="pc-kicker">مشارکت سازمانی و استفاده از ظرفیت خبرگان</div><h3>کار مناسب را به مشارکت‌کننده مناسب بسپارید</h3><p>فراخوان می‌تواند در سطح هلدینگ، معاونت، شرکت یا تیم منتشر شود. در این نسخه، ثبت فراخوان و اعلام آمادگی در فضای محلی انجام می‌شود؛ برای مشارکت هم‌زمان چند کاربر، اتصال سروری و هویت سازمانی لازم است.</p></div><div class="pc-hero-side"><strong>'+fa(open.length)+'</strong><span>فراخوان باز</span></div></section>'+
 '<details class="pc-panel"><summary class="pc-section-title">＋ ایجاد فراخوان مشارکت</summary><form class="pc-form" id="call-form"><div class="pc-field full"><label>عنوان فراخوان *</label><input name="title" required placeholder="عنوان کار یا بسته کاری"></div><div class="pc-field"><label>وظیفه مرتبط</label><select name="taskId"><option value="">بدون اتصال به وظیفه</option>'+db.tasks.filter(t=>!t.archived).map(t=>'<option value="'+t.id+'">'+esc(t.title)+'</option>').join('')+'</select></div><div class="pc-field"><label>قلمرو انتشار</label><select name="orgId">'+orgOptions('HOLDING')+'</select></div><div class="pc-field"><label>مهلت اعلام آمادگی</label><input name="dueDate" type="date"></div><div class="pc-field"><label>مهارت / ظرفیت موردنیاز</label><input name="skills" placeholder="تخصص، تجربه یا ظرفیت زمانی"></div><div class="pc-field full"><label>شرح کار و خروجی مورد انتظار</label><textarea name="summary"></textarea></div><div class="pc-field full"><button class="pc-btn" type="submit">انتشار فراخوان در این محیط</button></div></form></details>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>فراخوان‌ها و اعلام آمادگی‌ها</h3><p>ثبت و انتخاب مشارکت‌کننده در همین دستگاه</p></div></div>'+
 (db.calls.length?db.calls.slice().reverse().map(c=>'<article class="pc-call"><div class="pc-panel-head"><h4>'+esc(c.title)+'</h4>'+badge(c.status)+'</div><p>'+esc(c.summary||'شرح تکمیلی ثبت نشده است')+'</p><div class="pc-card-meta"><span class="pc-badge">'+esc(orgLabel(c.orgId))+'</span><span class="pc-badge">مهلت: '+fmtDate(c.dueDate)+'</span><span class="pc-badge">مهارت: '+esc(c.skills||'تعیین نشده')+'</span></div><p>اعلام آمادگی: '+fa((c.participants||[]).length)+' نفر</p>'+
 (c.participants||[]).map((v,i)=>'<div class="pc-volunteer"><span>'+esc(v.name)+' · '+esc(v.org||'')+'</span>'+badge(v.status)+(v.status!=='پذیرفته‌شده'&&c.taskId?'<button class="pc-btn secondary" data-action="assign-volunteer" data-call="'+c.id+'" data-index="'+i+'">تخصیص به کار</button>':'')+'</div>').join('')+
 (c.status==='باز'?'<form class="pc-volunteer" data-form="volunteer" data-id="'+c.id+'"><input name="name" required placeholder="نام مشارکت‌کننده"><input name="org" placeholder="واحد / تیم"><button class="pc-btn gold" type="submit">اعلام آمادگی</button></form><button class="pc-btn secondary" data-action="close-call" data-id="'+c.id+'">بستن فراخوان</button>':'')+'</article>').join(''):empty('فراخوانی ثبت نشده است','برای یک وظیفه یا نیاز تخصصی، فراخوان مشارکت ایجاد کنید.'))+'</section>';
}
function renderReports(){
 const ps=activeProjects(),ts=db.tasks.filter(t=>!t.archived);
 const orgRows=orgs().map(o=>{const projects=ps.filter(p=>p.orgId===o.id),tasks=ts.filter(t=>t.orgId===o.id||projects.some(p=>p.id===t.projectId));return {label:o.label,projects,tasks};}).filter(x=>x.projects.length||x.tasks.length);
 const bars=orgRows.length?'<div class="pc-bar-list">'+orgRows.map(x=>'<div class="pc-bar-row"><span>'+esc(x.label)+'</span><div class="pc-bar-track"><span style="width:'+Math.min(100,x.projects.length/Math.max(1,ps.length)*100)+'%"></span></div><b>'+fa(x.projects.length)+'</b></div>').join('')+'</div>':empty('داده‌ای برای تحلیل وجود ندارد','پس از ثبت پروژه و وظیفه، توزیع سازمانی نمایش داده می‌شود.');
 return '<div class="pc-stats">'+stat('پروژه‌ها',ps.length,'مورد')+stat('وظایف',ts.length,'مورد')+stat('تکمیل‌شده',ts.filter(t=>t.status==='تکمیل‌شده').length,'وظیفه')+stat('فراخوان‌ها',db.calls.length,'مورد')+'</div>'+
 '<div class="pc-grid"><section class="pc-panel"><div class="pc-panel-head"><div><h3>توزیع پروژه‌ها بر اساس قلمرو</h3><p>تعداد پروژه‌های ثبت‌شده، بدون داده نمونه</p></div></div>'+bars+'</section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>وضعیت زمان و پیشرفت پروژه‌ها</h3><p>فقط پروژه‌های دارای خط مبنا و زمان‌بندی قابل محاسبه‌اند.</p></div></div>'+
 (ps.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>پروژه</th><th>پیشرفت واقعی تأییدشده</th><th>برنامه‌ای</th><th>اختلاف زمان</th><th>پیش‌بینی پایان</th></tr></thead><tbody>'+ps.map(p=>{const m=projectMetrics(p);return '<tr><td><strong>'+esc(p.title)+'</strong><small>'+esc(p.id)+'</small></td><td>'+fa(Math.round(m.actual))+'٪</td><td>'+(m.plan===null?'—':fa(Math.round(m.plan))+'٪')+'</td><td>'+(m.variance===null?'—':(m.variance>=0?'جلوتر ':'عقب‌تر ')+fa(Math.abs(m.variance))+' روز')+'</td><td>'+fmtDate(m.forecast)+'</td></tr>';}).join('')+'</tbody></table></div>':empty('گزارش پروژه‌ای موجود نیست','ابتدا پروژه ثبت و برای وظایف آن زمان‌بندی تعریف کنید.'))+'</section></div>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>دفتر وقایع و اقدامات اخیر</h3><p>ثبت تغییرات و رویدادها با زمان وقوع</p></div><button class="pc-btn secondary" data-action="export-events">خروجی CSV وقایع</button></div>'+eventList(db.events)+'</section>';
}
function renderAbout(){
 return '<section class="pc-hero"><div><div class="pc-kicker">شناسه معماری: ۰۲-۳-۰۸</div><h3>مرجع واحد اجرای پروژه‌ها و کارهای سازمانی</h3><p>مرکز پروژه‌ها / دفتر راهبری پروژه‌ها (PMO) روش، استاندارد، کیفیت داده و گزارش تلفیقی را راهبری می‌کند؛ مالک کسب‌وکار، حامی، مدیر پروژه و واحدهای تخصصی مسئولیت‌های اجرایی و تصمیمی خود را حفظ می‌کنند.</p></div><div class="pc-hero-side"><strong>۰۲-۳-۰۸</strong><span>شناسه مرکز در طرح مادر</span></div></section>'+
 '<div class="pc-grid"><section class="pc-panel"><h3 class="pc-section-title">چرخه عمر پروژه</h3><ol class="pc-steps"><li>ثبت ایده و درخواست</li><li>غربال، ارزیابی و تصویب</li><li>منشور، محدوده و برنامه مبنا</li><li>تقسیم کار، تخصیص و اجرا</li><li>کنترل زمان، هزینه، ریسک و تغییر</li><li>تحویل، پذیرش و اختتام</li><li>سنجش منافع و ثبت درس‌آموخته</li></ol></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">مرزبندی با مراکز دیگر</h3><ul class="pc-bullets"><li><b>مرکز راهبرد:</b> مرجع هدف، راهبرد و برنامه؛ این مرکز مرجع اجرای پروژه و گزارش تحویل است.</li><li><b>مرکز دانش:</b> مرجع درس‌آموخته و محتوای دانشی؛ پروژه‌ها شواهد و تجربه را به آن ارجاع می‌دهند.</li><li><b>مرکز رصد:</b> مصرف‌کننده داده‌های تأییدشده برای نمای تلفیقی؛ ثبت اصلی اطلاعات در مرکز تخصصی باقی می‌ماند.</li><li><b>مرکز ارزیابی:</b> ارزیابی مستقل نتایج و شواهد؛ داده عملیاتی پروژه را بازنویسی نمی‌کند.</li><li><b>مرکز داده:</b> نگهداری و پشتیبان‌گیری؛ مالک چرخه عمر و قواعد کسب‌وکار پروژه نیست.</li></ul></section></div>'+
 '<section class="pc-panel"><h3 class="pc-section-title">قواعد سنجش پیشرفت و انحراف</h3><ul class="pc-bullets"><li>پیشرفت اعلامی مجری و پیشرفت تأییدشده مسئول پذیرش جدا هستند.</li><li>درصد پیشرفت پروژه از میانگین وزنی پیشرفت تأییدشده وظایف محاسبه می‌شود.</li><li>پیشرفت برنامه‌ای از زمان‌بندی خط مبنا و وزن فعالیت‌ها در تاریخ گزارش محاسبه می‌شود.</li><li>تغییر خط مبنا فقط با تصمیم مجاز ثبت می‌شود و نسخه قبلی حفظ خواهد شد.</li><li>شاخص‌های ارزش کسب‌شده مانند SPI/CPI تا زمان تعریف داده‌های معتبر و روش مصوب نمایش داده نمی‌شوند.</li></ul></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">نقشه تکمیل محصول</h3><div class="pc-grid three">'+[['MVP محلی','ثبت پروژه و کار، گزارش پیشرفت، خط مبنای اولیه، جمع‌سپاری محلی و پشتیبان'],['نسخه توسعه‌ای','WBS، گانت، تقویم کاری، وابستگی، ظرفیت، هزینه، RAID و تغییر'],['استقرار سازمانی','احراز هویت، API، پایگاه‌داده مرکزی، همکاری چندکاربره و اتصال مراکز']].map(x=>'<div class="pc-project-card"><h4>'+x[0]+'</h4><p>'+x[1]+'</p></div>').join('')+'</div></section>';
}
function renderSettings(){
 return '<section class="pc-panel"><div class="pc-panel-head"><div><h3>ذخیره‌سازی و پشتیبان‌گیری مرکز</h3><p>فضای مستقل مرکز پروژه‌ها در هسته محلی هلدینگ</p></div><span class="pc-badge blue">فضای داده: '+SCOPE+'</span></div><div class="pc-note info">داده‌ها در مرورگر فعلی و در فضای نام مستقل ذخیره می‌شوند. برای انتقال به دستگاه دیگر، خروجی پشتیبان بگیرید. این سازوکار به‌تنهایی همگام‌سازی چندکاربره یا سرور مرکزی ایجاد نمی‌کند.</div><div class="pc-toolbar"><button class="pc-btn" data-action="backup">دریافت پشتیبان کامل مرکز</button><label class="pc-btn secondary" for="restore-file">بازیابی از فایل پشتیبان</label><input id="restore-file" type="file" accept="application/json,.json" hidden><a class="pc-btn secondary" href="../../pages/local-data-vault.html">مشاهده مرکز داده هلدینگ</a></div><div class="pc-keyvals"><div class="pc-keyval"><small>آخرین ذخیره محلی</small><strong>'+fmtDateTime(db.updatedAt)+'</strong></div><div class="pc-keyval"><small>پروژه‌ها</small><strong>'+fa(db.projects.length)+'</strong></div><div class="pc-keyval"><small>وظایف</small><strong>'+fa(db.tasks.length)+'</strong></div><div class="pc-keyval"><small>رویدادهای تاریخچه</small><strong>'+fa(db.events.length)+'</strong></div></div></section>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>محدودیت‌ها و الزامات استقرار</h3><p>برای جلوگیری از برداشت نادرست از وضعیت نسخه فعلی</p></div></div><ul class="pc-bullets"><li>داده‌ها به مرورگر/دستگاه فعلی وابسته‌اند تا زمانی که نسخه پشتیبان منتقل شود.</li><li>احراز هویت و نقش‌های واقعی سازمانی هنوز به سرور متصل نشده‌اند.</li><li>فراخوان و اعلام آمادگی در این نسخه محلی است و برای مشارکت هم‌زمان به API و حساب کاربری نیاز دارد.</li><li>اتصال به مالی، منابع انسانی، قراردادها، راهبرد، دانش، رصد و ارزیابی در فازهای بعد انجام می‌شود.</li></ul></section>';
}
function renderProject(id){
 const p=projectBy(id);if(!p)return empty('پروژه پیدا نشد','ممکن است پروژه بایگانی یا شناسه آن تغییر کرده باشد.')+'<a class="pc-btn secondary" href="#projects">بازگشت به پروژه‌ها</a>';
 const m=projectMetrics(p),ts=m.tasks,base=m.baseline;
 return '<section class="pc-panel"><div class="pc-detail-head"><div><h3>'+esc(p.title)+'</h3><p>'+esc(p.id)+' · '+esc(orgLabel(p.orgId))+' · '+badge(p.status)+'</p><p>'+esc(p.summary||p.objective||'شرح پروژه ثبت نشده است.')+'</p></div><div class="pc-detail-actions"><button class="pc-btn secondary" data-action="baseline" data-id="'+p.id+'">ثبت خط مبنا</button>'+(p.status==='در انتظار تصویب'?'<button class="pc-btn gold" data-action="approve-project" data-id="'+p.id+'">تصویب پروژه</button>':'')+'<a class="pc-btn secondary" href="#tasks">افزودن وظیفه</a></div></div>'+
 '<div class="pc-keyvals"><div class="pc-keyval"><small>حامی / مالک کسب‌وکار</small><strong>'+esc(p.sponsor||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>مدیر پروژه</small><strong>'+esc(p.manager||'تعیین نشده')+'</strong></div><div class="pc-keyval"><small>شروع برنامه‌ای</small><strong>'+fmtDate(p.startDate)+'</strong></div><div class="pc-keyval"><small>پایان هدف</small><strong>'+fmtDate(p.dueDate)+'</strong></div></div>'+
 '<div class="pc-stats">'+stat('پیشرفت تأییدشده',Math.round(m.actual),'درصد')+stat('پیشرفت اعلامی',Math.round(m.reported),'درصد')+stat('وظایف',ts.length,'مورد')+stat('نسخه‌های خط مبنا',(p.baselines||[]).length,'نسخه')+stat('انحراف روزانه',m.variance===null?'—':Math.abs(m.variance),m.variance===null?'نیازمند برنامه':m.variance<0?'روز عقب':'روز جلو')+'</div>'+
 '<div class="pc-grid"><section class="pc-panel"><h3 class="pc-section-title">پیشرفت واقعی در برابر برنامه</h3>'+progressBar(m.actual,'تأییدشده')+'<div style="margin-top:12px">'+(m.plan===null?'<div class="pc-note">برای محاسبه برنامه‌ای، وظایف باید تاریخ شروع و پایان داشته باشند و خط مبنا ثبت شود.</div>':progressBar(m.plan,'برنامه‌ای تا امروز'))+'</div><p class="pc-help">پیش‌بینی پایان: '+fmtDate(m.forecast)+' · '+(m.variance===null?'انحراف زمانی قابل محاسبه نیست':(m.variance<0?'عقب‌تر از برنامه به میزان ':'جلوتر از برنامه به میزان ')+fa(Math.abs(m.variance))+' روز')+'</p></section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">خط مبنای مصوب</h3>'+(base?'<div class="pc-keyvals"><div class="pc-keyval"><small>نسخه</small><strong>'+fa(base.version)+'</strong></div><div class="pc-keyval"><small>تاریخ ثبت</small><strong>'+fmtDateTime(base.approvedAt)+'</strong></div><div class="pc-keyval"><small>شروع</small><strong>'+fmtDate(base.startDate)+'</strong></div><div class="pc-keyval"><small>پایان</small><strong>'+fmtDate(base.endDate)+'</strong></div></div><p class="pc-help">تغییرات بعدی برنامه نسخه قبلی را حذف نمی‌کند.</p>':'<div class="pc-empty">هنوز خط مبنای مصوبی ثبت نشده است.</div>')+'</section></div>'+
 '<section class="pc-panel"><div class="pc-panel-head"><div><h3>وظایف و بسته‌های اجرایی</h3><p>وزن هر وظیفه در محاسبه پیشرفت پروژه مؤثر است.</p></div><a class="pc-btn secondary" href="#tasks">مدیریت کارها</a></div>'+
 (ts.length?'<div class="pc-table-wrap"><table class="pc-table"><thead><tr><th>وظیفه</th><th>مسئول</th><th>موعد</th><th>وضعیت</th><th>پیشرفت تأییدشده</th><th>گزارش</th></tr></thead><tbody>'+ts.map(t=>'<tr><td><strong>'+esc(t.title)+'</strong><small>وزن: '+fa(t.weight)+'</small></td><td>'+esc(t.assignee||'—')+'</td><td>'+fmtDate(t.dueDate)+'</td><td>'+badge(t.status)+'</td><td>'+fa(t.approvedPercent)+'٪</td><td><button class="pc-btn secondary" data-action="task-report" data-id="'+t.id+'">ثبت گزارش</button>'+(t.reportedPercent>t.approvedPercent?'<button class="pc-btn gold" data-action="accept-report" data-id="'+t.id+'">تأیید</button>':'')+'</td></tr>').join('')+'</tbody></table></div>':empty('وظیفه‌ای به این پروژه متصل نیست','از بخش کارها، وظیفه‌ای با انتخاب این پروژه ثبت کنید.'))+'</section>'+
 '<section class="pc-panel"><h3 class="pc-section-title">تاریخچه اقدامات پروژه</h3>'+eventList(db.events.filter(e=>e.entity===p.id||ts.some(t=>t.id===e.entity)))+'</section></section>';
}
function render(){
 const r=currentRoute();setHeader(r.page);
 view.innerHTML=r.page==='overview'?renderOverview():r.page==='projects'?renderProjects():r.page==='tasks'?renderTasks():r.page==='calls'?renderCalls():r.page==='reports'?renderReports():r.page==='about'?renderAbout():r.page==='settings'?renderSettings():renderProject(r.id);
 if(r.page==='tasks')filterTasks();if(r.page==='projects')filterProjects();
 window.scrollTo({top:0,behavior:'instant'});
}
function filterProjects(){
 const search=$('#project-search'),filter=$('#project-filter');if(!search)return;
 const apply=()=>{const q=search.value.trim().toLocaleLowerCase('fa'),st=filter.value;view.querySelectorAll('.pc-project-card').forEach(card=>{const t=card.textContent.toLocaleLowerCase('fa');card.hidden=!!(q&&!t.includes(q))||!!(st&&!t.includes(st));});};
 search.addEventListener('input',apply);filter.addEventListener('change',apply);
}
function filterTasks(){
 const search=$('#task-search'),filter=$('#task-filter');if(!search)return;
 const apply=()=>{const q=search.value.trim().toLocaleLowerCase('fa'),st=filter.value;view.querySelectorAll('tbody tr').forEach(row=>{const t=row.textContent.toLocaleLowerCase('fa');row.hidden=!!(q&&!t.includes(q))||!!(st&&!t.includes(st));});};
 search.addEventListener('input',apply);filter.addEventListener('change',apply);
}
function formData(form){return Object.fromEntries(new FormData(form).entries());}
function createProject(form){
 const d=formData(form);if(!d.title.trim())return;
 const p={id:makeId('PRJ'),title:d.title.trim(),orgId:d.orgId||'HOLDING',priority:d.priority||'عادی',sponsor:d.sponsor||'',manager:d.manager||'',startDate:d.startDate||'',dueDate:d.dueDate||'',strategyRef:d.strategyRef||'',budget:Number(d.budget)||0,objective:d.objective||'',summary:d.summary||'',status:'در انتظار تصویب',createdAt:isoNow(),baselines:[],archived:false};
 db.projects.push(p);log('create-project',p.id,'ثبت درخواست پروژه: '+p.title,'درخواست جدید در وضعیت انتظار تصویب ثبت شد.');save();notice('درخواست پروژه ثبت شد و در انتظار بررسی و تصویب است.');location.hash='project/'+p.id;
}
function createTask(form){
 const d=formData(form);if(!d.title.trim())return;
 const t={id:makeId('TSK'),title:d.title.trim(),projectId:d.projectId||'',orgId:d.orgId||'HOLDING',assignee:d.assignee||'',owner:d.owner||'',startDate:d.startDate||'',dueDate:d.dueDate||'',weight:Math.max(1,Number(d.weight)||1),priority:d.priority||'عادی',acceptance:d.acceptance||'',status:'در انتظار شروع',reportedPercent:0,approvedPercent:0,history:[],archived:false,createdAt:isoNow()};
 db.tasks.push(t);log('create-task',t.id,'تعریف وظیفه: '+t.title,'مسئول: '+(t.assignee||'تعیین نشده')+'؛ موعد: '+(t.dueDate||'تعیین نشده'));save();notice('وظیفه ثبت شد.');render();
}
function createCall(form){
 const d=formData(form);if(!d.title.trim())return;
 const c={id:makeId('CAL'),title:d.title.trim(),taskId:d.taskId||'',orgId:d.orgId||'HOLDING',dueDate:d.dueDate||'',skills:d.skills||'',summary:d.summary||'',status:'باز',participants:[],createdAt:isoNow()};
 db.calls.push(c);log('create-call',c.id,'انتشار فراخوان: '+c.title,'فراخوان مشارکت در فضای محلی ایجاد شد.');save();notice('فراخوان در این محیط ثبت شد.');render();
}
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
 const tasks=tasksOf(id).map(t=>({id:t.id,title:t.title,startDate:t.startDate,dueDate:t.dueDate,weight:t.weight}));
 p.baselines.push({version:p.baselines.length+1,approvedAt:isoNow(),startDate:p.startDate,endDate:p.dueDate,tasks});
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
  window.HoldingLocalDataVault.exportData(SCOPE).then(data=>download('holding-project-center-backup-'+today()+'.json',JSON.stringify(data,null,2),'application/json')).catch(()=>download('project-center-backup-'+today()+'.json',JSON.stringify({format:'holding-project-center',schemaVersion:1,db},null,2),'application/json'));
 }else download('project-center-backup-'+today()+'.json',JSON.stringify({format:'holding-project-center',schemaVersion:1,db},null,2),'application/json');
}
function download(name,content,type){
 const blob=new Blob([content],{type:type+';charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
async function restoreFile(file){
 try{
  const payload=JSON.parse(await file.text());
  if(payload.format==='holding-local-vault'&&window.HoldingLocalDataVault){await window.HoldingLocalDataVault.importData(payload,'merge');const r=await window.HoldingLocalDataVault.get(RECORD_ID);if(r?.content)db=JSON.parse(r.content);}
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
 const f=e.target;if(f.id==='project-form'){e.preventDefault();createProject(f);}else if(f.id==='task-form'){e.preventDefault();createTask(f);}else if(f.id==='call-form'){e.preventDefault();createCall(f);}else if(f.dataset.form==='volunteer'){e.preventDefault();volunteer(f);}
});
$('#task-report-form').addEventListener('submit',e=>{e.preventDefault();submitTaskReport(e.currentTarget);});
$('#close-report-dialog').addEventListener('click',()=>$('#task-report-dialog').close());
$('#cancel-report-dialog').addEventListener('click',()=>$('#task-report-dialog').close());
view.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action,id=b.dataset.id;
 if(a==='open-project')location.hash='project/'+id;
 if(a==='approve-project')approveProject(id);
 if(a==='baseline')baseline(id);
 if(a==='task-report')taskReport(id);
 if(a==='accept-report')acceptReport(id);
 if(a==='close-call'){const c=db.calls.find(x=>x.id===id);if(c){c.status='بسته';log('close-call',c.id,'بستن فراخوان: '+c.title,'فراخوان بسته شد.');save();render();}}
 if(a==='assign-volunteer')assignVolunteer(b.dataset.call,b.dataset.index);
 if(a==='backup')exportBackup();
 if(a==='export-events')exportEvents();
});
$('#restore-file').addEventListener('change',e=>{const f=e.target.files?.[0];if(f)restoreFile(f);e.target.value='';});
window.addEventListener('hashchange',render);
$('#backTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
window.addEventListener('scroll',()=>$('#backTop').classList.toggle('visible',window.scrollY>260),{passive:true});
load().then(()=>{if(!location.hash)location.hash='overview';render();}).catch(e=>{console.error(e);notice('بارگذاری فضای داده با خطا روبه‌رو شد.','error');render();});
})();