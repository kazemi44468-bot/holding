import { MissionStore } from "./mission-store.js";
const $=id=>document.getElementById(id),fa=n=>Number(n||0).toLocaleString("fa-IR");
const depts={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارکبان و معبربانان","4":"تأسیسات فنی و نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const statuses={draft:"پیش‌نویس",registered:"ثبت‌شده",referred:"ارجاع‌شده","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"تکمیل‌شده",closed:"مختومه",cancelled:"لغوشده"};
let all=[];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const date=v=>{if(!v)return null;const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);const d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date(v);return isNaN(d)?null:d};
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusDone=m=>["completed","closed"].includes(m.status);
const isLate=m=>m.plannedEnd&&m.plannedEnd<today()&&!statusDone(m)&&m.status!=="cancelled";
const track=(m,k)=>m.processTracks?.[k]||{};
const pct=(m,k)=>Math.max(0,Math.min(100,Number(track(m,k).progress||0)));
const avg=(arr,k)=>arr.length?Math.round(arr.reduce((s,m)=>s+pct(m,k),0)/arr.length):0;
function range(){const n=new Date(),p=$("reportPeriod").value;let from,to=new Date(n.getFullYear(),n.getMonth(),n.getDate());if(p==="day")from=to;else if(p==="week"){from=new Date(to);from.setDate(from.getDate()-((from.getDay()+6)%7));}else if(p==="month")from=new Date(n.getFullYear(),n.getMonth(),1);else if(p==="quarter")from=new Date(n.getFullYear(),n.getMonth()-2,1);else if(p==="year")from=new Date(n.getFullYear(),0,1);else if(p==="custom"){from=date($("reportFrom").value);to=date($("reportTo").value);if(!from||!to||from>to)return {from:null,to:null,label:"تاریخ شروع و پایان را انتخاب کنید"};}else return {from:null,to:null,label:"کل سوابق موجود"};return {from,to,label:iso(from)+" تا "+iso(to)}}
function inside(v,r){if(!r.from&&!r.to)return true;const d=date(v);return !!d&&(!r.from||d>=r.from)&&(!r.to||d<plus(r.to,1))}
function rowsForDept(){const d=$("reportDept").value;return all.filter(m=>!d||String(m.executorDepartment)===d)}
function eventList(rows){const out=[],add=(m,type,at,label)=>{if(at)out.push({m,type,at:String(at),label})};for(const m of rows){add(m,"created",m.createdAt,"ایجاد");add(m,"started",m.actualStart,"شروع");add(m,"finished",m.actualEnd,"خاتمه");const w=m.workflowLog||[];if(!m.actualStart){const x=w.find(e=>e.stage==="in-progress");if(x)add(m,"started",x.at,"شروع از گردش کار")}if(!m.actualEnd&&statusDone(m)){const x=w.find(e=>["completed","closed"].includes(e.stage));add(m,"finished",x?.at||m.updatedAt,"خاتمه")};w.forEach(x=>add(m,"status",x.at,x.action||"تغییر وضعیت"));(m.progressLog||[]).forEach(x=>add(m,"action",x.at,"گزارش پیشرفت"));(m.processLog||[]).forEach(x=>add(m,"action",x.at,x.action||"اقدام"));Object.values(m.processTracks||{}).forEach(t=>(t.actions||[]).forEach(x=>add(m,"action",x.createdAt,"اقدام: "+(x.title||"ثبت‌شده"))))}
const seen=new Set();return out.filter(e=>{const k=[e.m.id,e.type,e.at.slice(0,10),e.label].join("|");if(seen.has(k))return false;seen.add(k);return true})}
function drawBars(id,items,percent=false,column=false){const host=$(id),max=Math.max(1,...items.map(x=>x.value));if(!items.length){host.innerHTML='<span class="profile-hint">داده‌ای برای نمایش وجود ندارد.</span>';return}if(column){host.innerHTML='<div class="report-column-chart">'+items.map(x=>'<div class="report-column"><b>'+fa(x.value)+'</b><div class="report-column-track"><i style="height:'+Math.max(x.value?3:0,x.value/max*100)+'%"></i></div><span>'+esc(x.label)+'</span></div>').join("")+'</div>';return}host.innerHTML=items.map(x=>'<div class="report-bar"><span>'+esc(x.label)+'</span><span class="report-track"><i style="width:'+Math.max(0,x.value/max*100)+'%"></i></span><b>'+fa(x.value)+(percent?"٪":"")+'</b></div>').join("")}
function buckets(r){const p=$("reportPeriod").value,n=new Date(),out=[];if(p==="day"){out.push({from:new Date(n.getFullYear(),n.getMonth(),n.getDate()),to:new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),label:"امروز"})}else if(p==="week"||p==="month"){let d=r.from||new Date(n.getFullYear(),n.getMonth(),1);const end=r.to||n;while(d<=end&&out.length<35){out.push({from:new Date(d),to:plus(d,1),label:fa(d.getDate())+" "+d.toLocaleDateString("fa-IR",{month:"short"})});d=plus(d,1)}}else if(p==="quarter"){let d=r.from||new Date(n.getFullYear(),n.getMonth()-2,1);for(let i=0;i<13;i++){out.push({from:new Date(d),to:plus(d,7),label:fa(d.getDate())+"/"+fa(d.getMonth()+1)});d=plus(d,7)}}else if(p==="custom"&&r.from&&r.to){const span=Math.ceil((r.to-r.from)/86400000)+1;if(span<=31){let d=new Date(r.from);while(d<=r.to){out.push({from:new Date(d),to:plus(d,1),label:fa(d.getDate())+"/"+fa(d.getMonth()+1)});d=plus(d,1)}}else if(span<=120){let d=new Date(r.from);while(d<=r.to){out.push({from:new Date(d),to:plus(d,7),label:fa(d.getDate())+"/"+fa(d.getMonth()+1)});d=plus(d,7)}}else{let d=new Date(r.from.getFullYear(),r.from.getMonth(),1);while(d<=r.to){const z=new Date(d.getFullYear(),d.getMonth()+1,1);out.push({from:new Date(d),to:z,label:d.toLocaleDateString("fa-IR",{month:"short",year:"2-digit"})});d=z}}}else{let d=r.from?new Date(r.from.getFullYear(),r.from.getMonth(),1):new Date(n.getFullYear(),n.getMonth()-11,1);for(let i=0;i<12;i++){const z=new Date(d.getFullYear(),d.getMonth()+1,1);out.push({from:new Date(d),to:z,label:d.toLocaleDateString("fa-IR",{month:"short"})});d=z}}return out}
function renderTimeline(rows,r){const host=$("timelineChart");if($("reportPeriod").value==="custom"&&!r.from){host.textContent=r.label;return}const ev=eventList(rows).filter(x=>inside(x.at,r)),types=["created","started","finished","action"],labels={created:"ایجاد",started:"شروع",finished:"خاتمه",action:"اقدامات"},bs=buckets(r),vals=bs.map(b=>({b,c:Object.fromEntries(types.map(t=>[t,ev.filter(e=>{const d=date(e.at);return e.type===t&&d&&d>=b.from&&d<b.to}).length]))})),max=Math.max(1,...vals.flatMap(x=>types.map(t=>x.c[t])));host.innerHTML='<div class="report-timeline-scroll"><div class="report-timeline-bars">'+vals.map(x=>'<div class="report-timeline-group"><div class="report-timeline-columns">'+types.map(t=>'<div class="report-timeline-col '+t+'" title="'+labels[t]+' '+fa(x.c[t])+'"><i style="height:'+Math.max(x.c[t]?3:0,x.c[t]/max*112)+'px"></i></div>').join("")+'</div><small>'+esc(x.b.label)+'</small></div>').join("")+'</div></div>';$("rCreated").textContent=fa(ev.filter(x=>x.type==="created").length);$("rStarted").textContent=fa(ev.filter(x=>x.type==="started").length);$("rFinished").textContent=fa(ev.filter(x=>x.type==="finished").length);$("rActions").textContent=fa(ev.filter(x=>x.type==="action").length);$("rStatusChanges").textContent=fa(ev.filter(x=>x.type==="status").length);$("reportRangeLabel").textContent=r.label}
const fd=v=>{const d=date(v);return d?d.toLocaleDateString("fa-IR"):"—"},fdt=v=>{const d=date(v);return d?d.toLocaleString("fa-IR"):"—"};
function renderGantt(rows){
 const host=$("missionGantt"),list=rows.filter(m=>m.plannedStart&&m.plannedEnd).sort((a,b)=>String(a.plannedStart).localeCompare(String(b.plannedStart))).slice(0,100);
 if(!list.length){host.innerHTML='<p class="mission-detail-empty">برای نمایش گانت، تاریخ شروع و پایان برنامه‌ای مأموریت‌ها را ثبت کنید.</p>';return}
 const ds=list.flatMap(m=>[date(m.plannedStart),date(m.plannedEnd),date(m.actualStart),date(m.actualEnd)]).filter(Boolean),min=new Date(Math.min(...ds)),max=new Date(Math.max(...ds));max.setDate(max.getDate()+1);
 const span=Math.max(1,max-min),pos=d=>Math.max(0,Math.min(100,(d-min)/span*100)),width=(x,z)=>Math.max(1,Math.min(100,pos(z)-pos(x)));
 const ticks=Array.from({length:5},(_,i)=>{const d=new Date(min.getTime()+span*i/4);return '<small>'+d.toLocaleDateString("fa-IR",{month:"short",day:"numeric"})+'</small>'}).join("");
 const bars=list.map(m=>{
  const x=date(m.plannedStart),z=date(m.plannedEnd),p=Math.min(100,Math.max(0,Number(m.progress||0))),sx=pos(x),sw=width(x,z),actualStart=date(m.actualStart),actualEnd=date(m.actualEnd)||new Date(),hasActual=!!actualStart;
  const ax=hasActual?pos(actualStart):0,az=hasActual?pos(actualEnd):0,aw=hasActual?Math.max(1,az-ax):0,status=String(m.status||"registered").replace(/[^a-z-]/g,""),late=isLate(m);
  return '<button type="button" class="gantt-row '+(late?"is-late":"")+'" data-id="'+esc(m.id)+'"><span><b>'+esc(m.missionTitle||m.missionCode||"مأموریت")+'</b><small>'+esc(depts[String(m.executorDepartment)]||m.executorDepartmentName||"")+' · '+esc(m.missionCode||"")+' · '+fd(m.plannedStart)+' تا '+fd(m.plannedEnd)+'</small></span><span class="gantt-track"><i class="gantt-planned status-'+status+'" style="right:'+sx+'%;width:'+sw+'%"><em style="width:'+p+'%"></em></i>'+(hasActual?'<b class="gantt-actual" title="زمان واقعی" style="right:'+ax+'%;width:'+aw+'%"></b>':"")+'</span><b class="gantt-percent">'+fa(p)+'٪</b></button>'
 }).join("");
 host.innerHTML='<div class="gantt-axis"><span>مأموریت / اداره</span><div>'+ticks+'</div><span>پیشرفت</span></div>'+bars+'<div class="gantt-legend"><span><i class="planned-key"></i>برنامه زمان‌بندی</span><span><i class="actual-key"></i>بازه اجرای واقعی</span><span><i class="late-key"></i>دارای تأخیر</span></div>';
 host.querySelectorAll("[data-id]").forEach(btn=>btn.addEventListener("click",()=>{$("missionDetailSelect").value=btn.dataset.id;renderDetail();$("missionDetail").scrollIntoView({behavior:"smooth",block:"nearest"})}))
}
function renderDetail(){const m=rowsForDept().find(x=>String(x.id)===$("missionDetailSelect").value),host=$("missionDetail");if(!m){host.className="mission-detail-empty";host.textContent="برای مشاهده جزئیات، یک مأموریت را انتخاب کنید.";return}host.className="mission-detail";const tr=[["management","مدیریت معاون"],["office","دفتر معاون"],["department","اجرای اداره"]].map(([k,l])=>'<div><span>'+l+'</span><b>'+fa(pct(m,k))+'٪</b><i><em style="width:'+pct(m,k)+'%"></em></i></div>').join("");const hist=[...(m.workflowLog||[]).map(x=>({at:x.at,title:x.action||"گردش کار",note:x.department||x.owner||""})),...(m.progressLog||[]).map(x=>({at:x.at,title:"ثبت پیشرفت "+fa(x.progress)+"٪",note:x.note||""})),...(m.processLog||[]).map(x=>({at:x.at,title:x.action||"اقدام",note:x.note||""}))].filter(x=>x.at).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,12);host.innerHTML='<div class="mission-detail-head"><div><b>'+esc(m.missionTitle||"بدون عنوان")+'</b><small>'+esc(m.missionCode||"بدون کد")+' · '+esc(depts[String(m.executorDepartment)]||m.executorDepartmentName||"")+'</small></div><strong>'+fa(m.progress)+'٪</strong></div><div class="mission-detail-progress"><i style="width:'+Math.max(0,Math.min(100,Number(m.progress||0)))+'%"></i></div><div class="mission-detail-meta"><span>وضعیت: <b>'+esc(statuses[m.status]||m.status||"—")+'</b></span><span>شروع برنامه‌ای: <b>'+fd(m.plannedStart)+'</b></span><span>پایان برنامه‌ای: <b>'+fd(m.plannedEnd)+'</b></span><span>شروع واقعی: <b>'+fd(m.actualStart)+'</b></span><span>پایان واقعی: <b>'+fd(m.actualEnd)+'</b></span></div><h3>پیشرفت چرخه‌های مسئولیت</h3><div class="mission-detail-tracks">'+tr+'</div><h3>آخرین سوابق</h3><div class="mission-detail-history">'+(hist.length?hist.map(x=>'<div><b>'+esc(x.title)+'</b><small>'+fdt(x.at)+' · '+esc(x.note)+'</small></div>').join(""):"<p>سابقه‌ای ثبت نشده است.</p>")+'</div>'}
function render(){const rows=rowsForDept(),done=rows.filter(statusDone),active=rows.filter(m=>["referred","in-progress","blocked","review","revision"].includes(m.status)),late=rows.filter(isLate),mean=rows.length?Math.round(rows.reduce((s,m)=>s+Number(m.progress||0),0)/rows.length):0,goal=rows.filter(m=>m.goalAchievement!==""&&m.goalAchievement!=null),quality=rows.filter(m=>m.qualityScore!==""&&m.qualityScore!=null);$("rTotal").textContent=fa(rows.length);$("rDone").textContent=fa(done.length);$("rActive").textContent=fa(active.length);$("rLate").textContent=fa(late.length);$("rProgress").textContent=fa(mean)+"٪";$("rGoal").textContent=goal.length?fa(Math.round(goal.reduce((s,m)=>s+Number(m.goalAchievement),0)/goal.length))+"٪":"—";$("rManagement").textContent=fa(avg(rows,"management"))+"٪";$("rOffice").textContent=fa(avg(rows,"office"))+"٪";$("rDepartment").textContent=fa(avg(rows,"department"))+"٪";$("rOfficeLate").textContent=fa(rows.reduce((s,m)=>s+(track(m,"office").actions||[]).filter(a=>a.status!=="تکمیل‌شده"&&a.dueDate&&a.dueDate<today()).length,0));$("rQuality").textContent=quality.length?fa(Math.round(quality.reduce((s,m)=>s+Number(m.qualityScore),0)/quality.length))+"٪":"—";const r=range();renderTimeline(rows,r);
drawBars("deptBars",Object.entries(depts).map(([id,label])=>({label,value:rows.filter(m=>String(m.executorDepartment)===id).length})).filter(x=>x.value),false,true);
drawBars("deptProgressBars",Object.entries(depts).map(([id,label])=>{const a=rows.filter(m=>String(m.executorDepartment)===id);return {label,value:a.length?Math.round(a.reduce((s,m)=>s+Number(m.progress||0),0)/a.length):0}}).filter(x=>rows.some(m=>depts[String(m.executorDepartment)]===x.label)) ,true);
drawBars("statusBars",Object.entries(statuses).map(([id,label])=>({label,value:rows.filter(m=>m.status===id).length})).filter(x=>x.value));
const pn={critical:"بحرانی",urgent:"فوری",important:"مهم",normal:"عادی"};drawBars("priorityBars",Object.entries(pn).map(([id,label])=>({label,value:rows.filter(m=>m.priority===id).length})).filter(x=>x.value));
drawBars("trackBars",[{label:"مدیریتی معاون",value:avg(rows,"management")},{label:"دفتر معاون",value:avg(rows,"office")},{label:"اجرای اداره",value:avg(rows,"department")}],true);
const lateDone=done.filter(m=>m.plannedEnd&&m.actualEnd&&m.actualEnd>m.plannedEnd).length,noEnd=rows.filter(m=>!m.plannedEnd).length,durations=rows.filter(m=>m.plannedStart&&m.plannedEnd).map(m=>(date(m.plannedEnd)-date(m.plannedStart))/86400000),cost=rows.reduce((s,m)=>s+Number(m.actualCost||0),0),budget=rows.reduce((s,m)=>s+Number(m.estimatedCost||0),0),milestones=rows.reduce((s,m)=>s+(m.milestones||[]).length,0);$("timeSummary").innerHTML='<div>دارای مهلت برنامه‌ای: <b>'+fa(rows.length-noEnd)+'</b></div><div>فاقد تاریخ پایان: <b>'+fa(noEnd)+'</b></div><div>تکمیل‌شده با تأخیر: <b>'+fa(lateDone)+'</b></div><div>میانگین مدت برنامه: <b>'+fa(durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0)+' روز</b></div><div>دارای مانع: <b>'+fa(rows.filter(m=>m.status==="blocked").length)+'</b></div><div>برآورد هزینه: <b>'+fa(budget)+' تومان</b></div><div>هزینه واقعی: <b>'+fa(cost)+' تومان</b></div><div>نقاط عطف: <b>'+fa(milestones)+'</b></div>';
$("deptReportRows").innerHTML=Object.entries(depts).map(([id,name])=>{const a=rows.filter(m=>String(m.executorDepartment)===id),d=a.filter(statusDone).length,p=a.length?Math.round(a.reduce((s,m)=>s+Number(m.progress||0),0)/a.length):0;return '<tr><td>'+esc(name)+'</td><td>'+fa(a.length)+'</td><td>'+fa(d)+'</td><td>'+fa(a.filter(m=>active.includes(m)).length)+'</td><td>'+fa(a.filter(isLate).length)+'</td><td>'+fa(p)+'٪</td><td>'+fa(avg(a,"management"))+'٪</td><td>'+fa(avg(a,"office"))+'٪</td><td>'+fa(avg(a,"department"))+'٪</td></tr>'}).join("");
const sel=$("missionDetailSelect"),old=sel.value;sel.innerHTML='<option value="">انتخاب کنید</option>'+rows.map(m=>'<option value="'+esc(m.id)+'">'+esc((m.missionCode||"بدون کد")+" · "+(m.missionTitle||"بدون عنوان"))+'</option>').join("");sel.value=rows.some(m=>String(m.id)===old)?old:"";renderGantt(rows);renderDetail();applyChartFilters();renderComparison()}

const SAMPLE_BATCH="mission-report-demo-2026-11";
const sampleSpecs=[
 ["1","تکمیل پرونده‌های پشتیبانی نیروی انسانی","completed",100,"critical",350,343,336],
 ["2","ارزیابی شاخص‌های کیفیت خدمات شهری","in-progress",68,"important",320,313,null],
 ["3","بازدید و پایش پاکیزگی محورهای اصلی","in-progress",54,"urgent",290,283,null],
 ["4","تعمیر و آماده‌سازی تجهیزات روشنایی","blocked",35,"critical",260,253,null],
 ["6","به‌روزرسانی زیرساخت شبکه و ارتباطات","completed",100,"important",230,223,216],
 ["7","ساماندهی مسیرهای جمع‌آوری پسماند خشک","in-progress",76,"urgent",200,193,null],
 ["8","بررسی میدانی درخواست‌های ثبت‌شده شهروندان","review",92,"normal",170,163,null],
 ["HQ","تهیه گزارش تجمیعی عملکرد اداره‌ها","referred",42,"important",140,null,null],
 ["3","برنامه‌ریزی شیفت‌های عملیاتی مناطق","registered",10,"normal",110,null,null],
 ["4","بازدید دوره‌ای تأسیسات و تجهیزات","in-progress",61,"normal",80,73,null],
 ["7","رفع نقاط انباشت پسماند در محدوده‌های منتخب","closed",100,"urgent",50,43,36],
 ["2","طراحی الگوی سنجش رضایت از خدمات","in-progress",27,"normal",20,13,null]
];
const sampleDeptName=id=>depts[id]||("اداره "+id);
function sampleDate(daysAgo){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-daysAgo);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
async function seedMissionSamples(){
 const existing=await MissionStore.list(),known=new Set(existing.map(m=>String(m.id))),batch=sampleSpecs.filter((_,i)=>!known.has("sample-mission-"+String(i+1).padStart(2,"0")));
 let added=0;
 for(let i=0;i<sampleSpecs.length;i++){
  const [dept,title,status,progress,priority,createdAgo,startAgo,finishAgo]=sampleSpecs[i],id="sample-mission-"+String(i+1).padStart(2,"0");
  if(known.has(id))continue;
  const created=sampleDate(createdAgo),started=startAgo===null?null:sampleDate(startAgo),finished=finishAgo===null?null:sampleDate(finishAgo),plannedStart=sampleDate(createdAgo),plannedEnd=sampleDate(Math.max(0,createdAgo-14));
  const now=new Date().toISOString(),code="TST-1405-"+String(i+1).padStart(3,"0");
  const actionAt=sampleDate(Math.max(0,(startAgo??createdAgo)-1))+"T10:30:00";
  const trackStatus=status==="completed"||status==="closed"?"completed":status==="registered"?"not-started":status==="referred"?"pending":"in-progress";
  const record={
   id,missionCode:code,missionTitle:title,missionSubject:"پرونده نمونه برای ارزیابی گزارش‌های زمانی، نمودار پیشرفت و برنامه زمان‌بندی.",executorDepartment:dept,executorDepartmentName:sampleDeptName(dept),missionType:"اجرایی",workNature:"پروژه‌ای",priority,confidentiality:"داخلی",status,executionStatus:status,progress,qualityScore:status==="completed"||status==="closed"?90:70+i%4,goalAchievement:status==="completed"||status==="closed"?100:Math.min(100,progress+5),scheduleStatus:finishAgo!==null&&finishAgo>Math.max(0,createdAgo-14)?"دارای تأخیر":"مطابق برنامه",plannedStart,plannedEnd,actualStart:started,actualEnd:finished,createdAt:created+"T09:00:00",updatedAt:now,isSampleData:true,sampleBatch:SAMPLE_BATCH,sampleLabel:"داده آزمایشی",
   directOwner:"مسئول نمونه",assignedExpert:"کارشناس آزمایشی",progressDescription:"ثبت آزمایشی برای ارزیابی صفحه گزارش.",
   workflow:{stage:status,assignedDepartment:dept,assignedManager:"مسئول نمونه",assignedExpert:"کارشناس آزمایشی",updatedAt:now},
   workflowLog:[{id:id+"-w1",at:created+"T09:00:00",action:"ثبت مأموریت آزمایشی",stage:"registered",department:sampleDeptName(dept),owner:"مسئول نمونه"},...(started?[{id:id+"-w2",at:started+"T10:00:00",action:"شروع عملیات",stage:"in-progress",department:sampleDeptName(dept),owner:"کارشناس آزمایشی"}]:[]),...(finished?[{id:id+"-w3",at:finished+"T16:00:00",action:"اتمام و تأیید مأموریت",stage:status,department:sampleDeptName(dept),owner:"مسئول نمونه"}]:[])],
   progressLog:[{id:id+"-p1",at:created+"T09:30:00",progress:0,note:"ثبت اولیه",by:"داده آزمایشی"},{id:id+"-p2",at:(started||created)+"T14:00:00",progress:Math.max(5,Math.round(progress*.55)),note:"گزارش میانی پیشرفت",by:"داده آزمایشی"},{id:id+"-p3",at:(finished||sampleDate(0))+"T15:00:00",progress,note:"به‌روزرسانی پیشرفت",by:"داده آزمایشی"}],
   processLog:[{id:id+"-a1",at:actionAt,action:"بررسی و ثبت اقدام اجرایی",note:"اقدام نمونه برای نمایش در نمودار فعالیت",by:"کارشناس آزمایشی"}],
   processTracks:{
    management:{status:trackStatus,progress:Math.min(100,progress+8),owner:"مسئول نمونه",dueDate:plannedEnd,actions:[{id:id+"-ma",title:"بررسی مدیریتی و تعیین اولویت",status:"تکمیل‌شده",createdAt:created+"T11:00:00",owner:"مسئول نمونه"}]},
    office:{status:trackStatus,progress:Math.max(0,progress-4),owner:"دفتر معاون",dueDate:plannedEnd,actions:[{id:id+"-oa",title:"پیگیری و هماهنگی بین واحدی",status:progress>=70?"تکمیل‌شده":"در حال انجام",createdAt:actionAt,owner:"دفتر معاون",dueDate:plannedEnd}]},
    department:{status:trackStatus,progress,owner:"کارشناس آزمایشی",dueDate:plannedEnd,actions:[{id:id+"-da",title:"اجرای اقدام تخصصی اداره",status:finished?"تکمیل‌شده":"در حال انجام",createdAt:(started||created)+"T12:00:00",owner:"کارشناس آزمایشی",dueDate:plannedEnd}]}
   },
   milestones:[{id:id+"-m1",title:"آماده‌سازی و هماهنگی",weight:25,progress:100,dueDate:plannedStart},{id:id+"-m2",title:"اجرای عملیات اصلی",weight:50,progress, dueDate:plannedEnd},{id:id+"-m3",title:"تحویل و ارزیابی",weight:25,progress:finished?100:0,dueDate:plannedEnd}]
  };
  await MissionStore.save(record,id);added++;
 }
 await refresh();
 $("sampleDataState").textContent=added?fa(added)+" مأموریت نمونه اضافه شد.": "۱۲ مأموریت نمونه از قبل در بانک وجود دارند.";
}
async function removeMissionSamples(){
 const records=await MissionStore.list(),samples=records.filter(m=>m.sampleBatch===SAMPLE_BATCH);
 for(const m of samples)await MissionStore.remove(m.id);
 await refresh();
 $("sampleDataState").textContent=samples.length?fa(samples.length)+" مأموریت آزمایشی حذف شد.":"داده آزمایشی برای حذف وجود نداشت.";
}


function chartRange(period){
 const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
 if(period==="all")return {from:null,to:end,label:"کل سوابق"};
 let from;
 if(period==="month")from=new Date(now.getFullYear(),now.getMonth(),1);
 else if(period==="previous") {from=new Date(now.getFullYear(),now.getMonth()-1,1);return {from,to:new Date(now.getFullYear(),now.getMonth(),1),label:from.toLocaleDateString("fa-IR",{month:"long",year:"numeric"})};}
 else if(period==="quarter")from=new Date(now.getFullYear(),now.getMonth()-2,1);
 else if(period==="half")from=new Date(now.getFullYear(),now.getMonth()-5,1);
 else if(period==="year")from=new Date(now.getFullYear(),0,1);
 else return {from:null,to:end,label:"کل سوابق"};
 return {from,to:end,label:from.toLocaleDateString("fa-IR")+" تا امروز"};
}
function chartRows(rows,id){
 const r=chartRange($("chartPeriod-"+id)?.value||"all");
 if(!r.from)return rows;
 return rows.filter(m=>{const d=date(m.createdAt)||date(m.actualStart)||date(m.plannedStart)||date(m.updatedAt);return d&&d>=r.from&&d<r.to});
}
function renderIndependentTimeline(rows){
 const r=chartRange($("chartPeriod-timeline")?.value||"all"),now=new Date(),ids=["rCreated","rStarted","rFinished","rActions","rStatusChanges","reportRangeLabel"],saved=ids.map(id=>$(id).textContent);
 const rangeValue=r.from?{from:r.from,to:new Date(r.to.getTime()-86400000),label:r.label}:{from:new Date(now.getFullYear(),now.getMonth()-11,1),to:now,label:"۱۲ ماه اخیر"};
 const control=$("reportPeriod"),old=control.value;control.value="custom";renderTimeline(rows,rangeValue);control.value=old;ids.forEach((id,i)=>$(id).textContent=saved[i]);
}
function setupComparisonMonths(){
 const sel=$("comparisonMonths"),now=new Date();sel.replaceChildren();
 for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),v=iso(d).slice(0,7),o=document.createElement("option");o.value=v;o.textContent=d.toLocaleDateString("fa-IR",{month:"long",year:"numeric"});if(i<=2)o.selected=true;sel.append(o)}
}
function monthStats(rows,month){
 const [y,m]=month.split("-").map(Number),from=new Date(y,m-1,1),to=new Date(y,m,1),events=eventList(rows);
 const created=events.filter(e=>e.type==="created"&&date(e.at)>=from&&date(e.at)<to).length;
 const started=events.filter(e=>e.type==="started"&&date(e.at)>=from&&date(e.at)<to).length;
 const finished=events.filter(e=>e.type==="finished"&&date(e.at)>=from&&date(e.at)<to).length;
 const snapshots=rows.filter(x=>{const c=date(x.createdAt);return c&&c<to}).map(x=>{
  const logs=(x.progressLog||[]).filter(z=>date(z.at)&&date(z.at)<to).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  if(logs.length)return Number(logs[0].progress||0);
  const updated=date(x.updatedAt);return updated&&updated<to?Number(x.progress||0):0;
 });
 return {month,created,started,finished,progress:snapshots.length?Math.round(snapshots.reduce((a,b)=>a+b,0)/snapshots.length):0};
}
function changeText(first,last){
 const delta=last-first;
 if(first===0)return delta===0?"بدون تغییر":"مبنای مقایسه صفر";
 const pctChange=Math.round(delta/Math.abs(first)*100);
 return (delta>0?"+":"")+fa(delta)+" · "+(pctChange>0?"+":"")+fa(pctChange)+"٪";
}
function renderComparison(){
 const sel=$("comparisonMonths"),chosen=[...sel.selectedOptions].map(o=>o.value).sort();
 if(chosen.length<2){$("comparisonMetrics").innerHTML='<div class="comparison-note">برای مقایسه، حداقل دو ماه انتخاب کنید.</div>';$("comparisonChart").innerHTML="";return}
 const rows=rowsForDept(),stats=chosen.map(m=>monthStats(rows,m)),first=stats[0],last=stats[stats.length-1];
 const metrics=[["مأموریت ایجادشده",first.created,last.created],["شروع مأموریت",first.started,last.started],["خاتمه مأموریت",first.finished,last.finished],["میانگین پیشرفت",first.progress,last.progress]];
 $("comparisonMetrics").innerHTML=metrics.map(([label,a,b])=>'<div><small>'+label+'</small><b>'+changeText(a,b)+'</b><span>از '+fa(a)+(label==="میانگین پیشرفت"?"٪":"")+' به '+fa(b)+(label==="میانگین پیشرفت"?"٪":"")+'</span></div>').join("");
 const keys=[["created","ایجاد"],["started","شروع"],["finished","خاتمه"],["progress","میانگین پیشرفت"]];
 $("comparisonChart").innerHTML='<div class="comparison-month-grid">'+stats.map(x=>'<section><b class="comparison-month-title">'+new Date(Number(x.month.slice(0,4)),Number(x.month.slice(5,7))-1,1).toLocaleDateString("fa-IR",{month:"short",year:"numeric"})+'</b>'+keys.map(([k,label])=>{const max=Math.max(1,...stats.map(z=>z[k]));return '<div class="comparison-value"><span>'+label+'</span><i><em style="width:'+Math.max(x[k]?2:0,x[k]/max*100)+'%"></em></i><b>'+fa(x[k])+(k==="progress"?"٪":"")+'</b></div>'}).join("")+'</section>').join("")+'</div>';
}
function applyChartFilters(){
 const rows=rowsForDept();
 renderIndependentTimeline(rows);
 const a=chartRows(rows,"dept"),b=chartRows(rows,"progress"),c=chartRows(rows,"status"),d=chartRows(rows,"priority"),e=chartRows(rows,"tracks"),g=chartRows(rows,"gantt");
 drawBars("deptBars",Object.entries(depts).map(([id,label])=>({label,value:a.filter(m=>String(m.executorDepartment)===id).length})).filter(x=>x.value),false,true);
 drawBars("deptProgressBars",Object.entries(depts).map(([id,label])=>{const q=b.filter(m=>String(m.executorDepartment)===id);return {label,value:q.length?Math.round(q.reduce((s,m)=>s+Number(m.progress||0),0)/q.length):0}}).filter(x=>b.some(m=>depts[String(m.executorDepartment)]===x.label)),true);
 drawBars("statusBars",Object.entries(statuses).map(([id,label])=>({label,value:c.filter(m=>m.status===id).length})).filter(x=>x.value));
 const pn={critical:"بحرانی",urgent:"فوری",important:"مهم",normal:"عادی"};
 drawBars("priorityBars",Object.entries(pn).map(([id,label])=>({label,value:d.filter(m=>m.priority===id).length})).filter(x=>x.value));
 drawBars("trackBars",[{label:"مدیریتی معاون",value:avg(e,"management")},{label:"دفتر معاون",value:avg(e,"office")},{label:"اجرای اداره",value:avg(e,"department")}],true);
 renderGantt(g);
}

async function refresh(){all=await MissionStore.list();const cfg=await MissionStore.config();for(const d of cfg?.departments||[])depts[String(d.id)]=d.name;const sel=$("reportDept");for(const m of all){const id=String(m.executorDepartment||"");if(id&&m.executorDepartmentName)depts[id]=m.executorDepartmentName;if(id&&![...sel.options].some(o=>o.value===id)){const o=document.createElement("option");o.value=id;o.textContent=depts[id]||"اداره "+id;sel.append(o)}}render()}
async function init(){try{await MissionStore.unlock();$("reportContent").hidden=false;$("reportState").textContent="اتصال برقرار است؛ داده‌ها مستقیماً از بانک مأموریت‌های معاونت ۷ خوانده می‌شوند.";const t=today();$("reportFrom").value=t;$("reportTo").value=t;setupComparisonMonths();await refresh();await seedMissionSamples()}catch(e){$("reportState").textContent=e.message;$("reportContent").hidden=true}}
init();$("seedMissionSamples").addEventListener("click",()=>seedMissionSamples().catch(e=>$("sampleDataState").textContent="خطا: "+e.message));$("removeMissionSamples").addEventListener("click",()=>removeMissionSamples().catch(e=>$("sampleDataState").textContent="خطا: "+e.message));$("reportRefresh").addEventListener("click",()=>refresh().catch(e=>$("reportState").textContent=e.message));$("reportPeriod").addEventListener("change",()=>{const x=$("reportPeriod").value==="custom";$("reportFrom").disabled=!x;$("reportTo").disabled=!x;render()});$("reportDept").addEventListener("change",render);$("reportFrom").addEventListener("change",render);$("reportTo").addEventListener("change",render);$("missionDetailSelect").addEventListener("change",renderDetail);document.querySelectorAll("[id^=chartPeriod-]").forEach(x=>x.addEventListener("change",applyChartFilters));$("comparisonMonths").addEventListener("change",renderComparison);
