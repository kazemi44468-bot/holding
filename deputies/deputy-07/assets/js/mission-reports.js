import { MissionStore } from "./mission-store.js?v=20261115-02";
import { ensureMissionSamples, removeMissionSamples } from "./mission-samples.js?v=20261115-04";
const $=id=>document.getElementById(id),fa=n=>Number(n||0).toLocaleString("fa-IR");
const depts={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارکبان و معبربانان","4":"تأسیسات فنی و نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const statuses={draft:"پیش‌نویس",registered:"برنامه‌ریزی قبل از اجرا",referred:"ارجاع‌شده / در انتظار شروع","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"اتمام و پایان کار",closed:"مختومه",cancelled:"لغوشده"};
let all=[];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const date=v=>{if(!v)return null;const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);const d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date(v);return isNaN(d)?null:d};
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const jalaliFormatter=new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"numeric",day:"numeric"});
function jalaliParts(value){const p=Object.fromEntries(jalaliFormatter.formatToParts(value).map(x=>[x.type,x.value]));return {year:Number(p.year),month:Number(p.month),day:Number(p.day)}}
function jalaliMonthStart(value){const d=new Date(value),p=jalaliParts(d);return new Date(d.getFullYear(),d.getMonth(),d.getDate()-p.day+1)}
function jalaliStartOffset(value,months){let d=jalaliMonthStart(value);for(let i=0;i<months;i++)d=jalaliMonthStart(plus(d,-1));return d}
function jalaliYearStart(value){let d=jalaliMonthStart(value),guard=0;while(jalaliParts(d).month!==1&&guard++<12)d=jalaliMonthStart(plus(d,-1));return d}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusDone=m=>["completed","closed"].includes(m.status);
const isLate=m=>m.plannedEnd&&m.plannedEnd<today()&&!statusDone(m)&&m.status!=="cancelled";
const track=(m,k)=>m.processTracks?.[k]||{};
const pct=(m,k)=>Math.max(0,Math.min(100,Number(track(m,k).progress||0)));
const avg=(arr,k)=>arr.length?Math.round(arr.reduce((s,m)=>s+pct(m,k),0)/arr.length):0;
function range(){
 const n=new Date(),p=$("reportPeriod").value;let from,to=new Date(n.getFullYear(),n.getMonth(),n.getDate());
 if(p==="day")from=to;
 else if(p==="week"){from=new Date(to);from.setDate(from.getDate()-((from.getDay()+1)%7))}
 else if(p==="month")from=jalaliMonthStart(n);
 else if(p==="quarter")from=jalaliStartOffset(n,2);
 else if(p==="year")from=jalaliYearStart(n);
 else if(p==="custom"){from=date($("reportFrom").value);to=date($("reportTo").value);if(!from||!to||from>to)return {from:null,to:null,label:"تاریخ شروع و پایان را انتخاب کنید"}}
 else if(p==="all"){const dates=eventList(rowsForDept()).map(e=>date(e.at)).filter(Boolean);from=dates.length?jalaliMonthStart(new Date(Math.min(...dates))):jalaliStartOffset(n,11);to=new Date(n.getFullYear(),n.getMonth(),n.getDate())}
 else return {from:null,to:null,label:"کل سوابق موجود"};
 return {from,to,label:from.toLocaleDateString("fa-IR")+" تا "+to.toLocaleDateString("fa-IR")}
}
function inside(v,r){if(!r.from&&!r.to)return true;const d=date(v);return !!d&&(!r.from||d>=r.from)&&(!r.to||d<plus(r.to,1))}
function rowsForDept(){const d=$("reportDept").value;return all.filter(m=>!d||String(m.executorDepartment)===d)}
function eventList(rows){const out=[],add=(m,type,at,label)=>{if(at)out.push({m,type,at:String(at),label})};for(const m of rows){add(m,"created",m.createdAt,"ایجاد");add(m,"started",m.actualStart,"شروع");add(m,"finished",m.actualEnd,"خاتمه");const w=m.workflowLog||[];if(!m.actualStart){const x=w.find(e=>e.stage==="in-progress");if(x)add(m,"started",x.at,"شروع از گردش کار")}if(!m.actualEnd&&statusDone(m)){const x=w.find(e=>["completed","closed"].includes(e.stage));add(m,"finished",x?.at||m.updatedAt,"خاتمه")};w.forEach(x=>add(m,"status",x.at,x.action||"تغییر وضعیت"));(m.progressLog||[]).forEach(x=>add(m,"action",x.at,"گزارش پیشرفت"));(m.processLog||[]).forEach(x=>add(m,"action",x.at,x.action||"اقدام"));Object.values(m.processTracks||{}).forEach(t=>(t.actions||[]).forEach(x=>add(m,"action",x.createdAt,"اقدام: "+(x.title||"ثبت‌شده"))))}
const seen=new Set();return out.filter(e=>{const k=[e.m.id,e.type,e.at.slice(0,10),e.label].join("|");if(seen.has(k))return false;seen.add(k);return true})}
function drawBars(id,items,percent=false,column=false){
 const host=$(id),max=Math.max(1,...items.map(x=>x.value));
 if(!items.length){host.innerHTML='<span class="profile-hint">در این بازه داده‌ای برای نمایش وجود ندارد.</span>';return}
 if(column){
  host.innerHTML='<div class="report-column-chart">'+items.map(x=>'<div class="report-column" title="'+esc(x.label)+': '+fa(x.value)+(percent?"٪":"")+(x.detail?" · "+esc(x.detail):"")+'"><b>'+fa(x.value)+(percent?"٪":"")+'</b><div class="report-column-track"><i style="height:'+Math.max(x.value?3:0,x.value/max*100)+'%"></i></div><span>'+esc(x.label)+'</span>'+(x.detail?'<small class="report-chart-detail">'+esc(x.detail)+'</small>':"")+'</div>').join("")+'</div>';
  return;
 }
 host.innerHTML=items.map(x=>'<div class="report-bar" title="'+esc(x.label)+': '+fa(x.value)+(percent?"٪":"")+(x.detail?" · "+esc(x.detail):"")+'"><span>'+esc(x.label)+'</span><span class="report-track"><i style="width:'+Math.max(0,x.value/max*100)+'%"></i></span><b>'+fa(x.value)+(percent?"٪":"")+'</b>'+(x.detail?'<small class="report-chart-detail">'+esc(x.detail)+'</small>':"")+'</div>').join("");
}
function buckets(r){
 const p=$("reportPeriod").value,n=new Date(),out=[];
 if(p==="day"){out.push({from:new Date(n.getFullYear(),n.getMonth(),n.getDate()),to:plus(new Date(n.getFullYear(),n.getMonth(),n.getDate()),1),label:"امروز"})}
 else if(p==="week"||p==="month"){
  let d=r.from||jalaliMonthStart(n);const end=r.to||n;
  while(d<=end&&out.length<35){out.push({from:new Date(d),to:plus(d,1),label:fa(jalaliParts(d).day)+" "+d.toLocaleDateString("fa-IR",{month:"short"})});d=plus(d,1)}
 }else if(p==="quarter"){
  let d=r.from||jalaliStartOffset(n,2);const end=r.to||n;
  while(d<=end&&out.length<16){out.push({from:new Date(d),to:plus(d,7),label:d.toLocaleDateString("fa-IR",{day:"numeric",month:"short"})});d=plus(d,7)}
 }else if(p==="custom"&&r.from&&r.to){
  const span=Math.ceil((r.to-r.from)/86400000)+1;
  if(span<=31){let d=new Date(r.from);while(d<=r.to){out.push({from:new Date(d),to:plus(d,1),label:d.toLocaleDateString("fa-IR",{day:"numeric",month:"short"})});d=plus(d,1)}}
  else if(span<=120){let d=new Date(r.from);while(d<=r.to){out.push({from:new Date(d),to:plus(d,7),label:d.toLocaleDateString("fa-IR",{day:"numeric",month:"short"})});d=plus(d,7)}}
  else{let d=jalaliMonthStart(r.from);while(d<=r.to&&out.length<120){const z=jalaliMonthStart(plus(d,35));out.push({from:new Date(d),to:z,label:d.toLocaleDateString("fa-IR",{month:"short",year:"2-digit"})});d=z}}
 }else{
  let d=r.from?jalaliMonthStart(r.from):jalaliStartOffset(n,11),end=r.to||n;
  while(d<=end&&out.length<120){const z=jalaliMonthStart(plus(d,35));out.push({from:new Date(d),to:z,label:d.toLocaleDateString("fa-IR",{month:"short",year:"2-digit"})});d=z}
 }
 return out
}
function renderTimeline(rows,r){
 const host=$("timelineChart");
 if($("reportPeriod").value==="custom"&&!r.from){host.textContent=r.label;return}
 const ev=eventList(rows).filter(x=>inside(x.at,r)),types=["created","started","finished","action"],labels={created:"ایجاد",started:"شروع",finished:"خاتمه",action:"اقدامات"},bs=buckets(r);
 const vals=bs.map(b=>({b,c:Object.fromEntries(types.map(t=>[t,ev.filter(e=>{const d=date(e.at);return e.type===t&&d&&d>=b.from&&d<b.to}).length]))}));
 const max=Math.max(1,...vals.flatMap(x=>types.map(t=>x.c[t]))),ticks=[max,Math.ceil(max/2),0];
 const axis='<div class="report-timeline-axis">'+ticks.map(v=>'<span>'+fa(v)+'</span>').join("")+'</div>';
 host.innerHTML='<div class="report-timeline-wrap">'+axis+'<div class="report-timeline-scroll"><div class="report-timeline-bars">'+vals.map(x=>'<div class="report-timeline-group"><div class="report-timeline-columns">'+types.map(t=>'<div class="report-timeline-col '+t+'" title="'+labels[t]+' · '+fa(x.c[t])+' مورد"><b>'+fa(x.c[t])+'</b><i style="height:'+Math.max(x.c[t]?3:0,x.c[t]/max*112)+'px"></i></div>').join("")+'</div><small>'+esc(x.b.label)+'</small></div>').join("")+'</div></div></div><p class="report-chart-caption">محور افقی: روز / هفته / ماه در بازه انتخابی · محور عمودی: تعداد رویداد · هر ستون تعداد رویداد همان نوع را نشان می‌دهد.</p>';
 $("rCreated").textContent=fa(ev.filter(x=>x.type==="created").length);$("rStarted").textContent=fa(ev.filter(x=>x.type==="started").length);$("rFinished").textContent=fa(ev.filter(x=>x.type==="finished").length);$("rActions").textContent=fa(ev.filter(x=>x.type==="action").length);$("rStatusChanges").textContent=fa(ev.filter(x=>x.type==="status").length);$("reportRangeLabel").textContent=r.label;
}
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

function chartRange(period,id){
 const now=new Date(),end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
 if(period==="all")return {from:null,to:end,label:"کل سوابق"};
 let from,to=end;
 if(period==="day")from=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 else if(period==="week"){from=new Date(now.getFullYear(),now.getMonth(),now.getDate());from.setDate(from.getDate()-((from.getDay()+1)%7))}
 else if(period==="month")from=jalaliMonthStart(now);
 else if(period==="previous"){from=jalaliStartOffset(now,1);to=jalaliMonthStart(now)}
 else if(period==="quarter")from=jalaliStartOffset(now,2);
 else if(period==="half")from=jalaliStartOffset(now,5);
 else if(period==="year")from=jalaliYearStart(now);
 else if(period==="custom"){
  from=date($("chartFrom-"+id)?.value);const endDate=date($("chartTo-"+id)?.value);
  if(!from||!endDate||from>endDate)return {from:null,to:null,label:"تاریخ شروع و پایان را انتخاب کنید",invalid:true};
  to=plus(endDate,1);
 }else return {from:null,to:end,label:"کل سوابق"};
 return {from,to,label:from.toLocaleDateString("fa-IR")+" تا "+new Date(to.getTime()-86400000).toLocaleDateString("fa-IR")};
}
function chartRows(rows,id){
 const r=chartRange($("chartPeriod-"+id)?.value||"all",id);
 if(r.invalid)return [];
 if(!r.from)return rows;
 if(id==="gantt")return rows.filter(m=>{const a=date(m.plannedStart)||date(m.createdAt),b=date(m.plannedEnd)||date(m.actualEnd)||a;return a&&b&&a<r.to&&b>=r.from});
 return rows.filter(m=>{const d=date(m.createdAt)||date(m.actualStart)||date(m.plannedStart)||date(m.updatedAt);return d&&d>=r.from&&d<r.to});
}
function drawDonut(id,items){
 const host=$(id),valid=items.filter(x=>x.value>0),total=valid.reduce((sum,x)=>sum+x.value,0),colors=["#79b9a8","#82afd2","#e4bf72","#b6a6d8","#d9a1a1","#a8b8c4","#8fc6cb"];
 if(!total){host.innerHTML='<span class="profile-hint">داده‌ای برای نمایش وجود ندارد.</span>';return}
 let cursor=0;const parts=valid.map((x,i)=>{const start=cursor;cursor+=x.value/total*100;return { ...x,color:colors[i%colors.length],start,end:cursor}});
 const gradient=parts.map(x=>x.color+" "+x.start+"% "+x.end+"%").join(",");
 host.innerHTML='<div class="mission-donut-layout"><div class="mission-donut" style="background:conic-gradient('+gradient+')"><span>'+fa(total)+'<small>مورد در مجموع</small></span></div><div class="mission-donut-legend">'+parts.map(x=>'<div><i style="background:'+x.color+'"></i><span>'+esc(x.label)+'</span><b>'+fa(x.value)+' · '+fa(Math.round(x.value/total*100))+'٪</b></div>').join("")+'</div></div>';
}
function renderIndependentTimeline(rows){
 const r=chartRange($("chartPeriod-timeline")?.value||"all","timeline"),now=new Date(),ids=["rCreated","rStarted","rFinished","rActions","rStatusChanges","reportRangeLabel"],saved=ids.map(id=>$(id).textContent);
 if(r.invalid){$("timelineChart").textContent=r.label;return}
 const events=eventList(rows).map(e=>date(e.at)).filter(Boolean),earliest=events.length?new Date(Math.min(...events)):new Date(now.getFullYear(),now.getMonth()-11,1);
 const rangeValue=r.from?{from:r.from,to:new Date(r.to.getTime()-86400000),label:r.label}:{from:new Date(earliest.getFullYear(),earliest.getMonth(),1),to:now,label:"کل سوابق"};
 const control=$("reportPeriod"),old=control.value;control.value="custom";renderTimeline(rows,rangeValue);control.value=old;ids.forEach((id,i)=>$(id).textContent=saved[i]);
}
function setupComparisonMonths(){
 const sel=$("comparisonMonths"),now=new Date();sel.replaceChildren();let cursor=jalaliMonthStart(now);const months=[];
 for(let i=0;i<12;i++){months.unshift(new Date(cursor));cursor=jalaliMonthStart(plus(cursor,-1))}
 months.forEach((d,i)=>{const o=document.createElement("option");o.value=iso(d);o.textContent=d.toLocaleDateString("fa-IR",{month:"long",year:"numeric"});if(i>=9)o.selected=true;sel.append(o)})
}
function monthStats(rows,month){
 const from=date(month),to=jalaliMonthStart(plus(from,35)),events=eventList(rows);
 const created=events.filter(e=>e.type==="created"&&date(e.at)>=from&&date(e.at)<to).length;
 const started=events.filter(e=>e.type==="started"&&date(e.at)>=from&&date(e.at)<to).length;
 const finished=events.filter(e=>e.type==="finished"&&date(e.at)>=from&&date(e.at)<to).length;
 const snapshots=rows.filter(x=>{const c=date(x.createdAt);return c&&c<to}).map(x=>{
  const logs=(x.progressLog||[]).filter(z=>date(z.at)&&date(z.at)<to).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  if(logs.length)return Number(logs[0].progress||0);
  const updated=date(x.updatedAt);return updated&&updated<to?Number(x.progress||0):0;
 });
 return {month,created,started,finished,progress:snapshots.length?Math.round(snapshots.reduce((a,b)=>a+b,0)/snapshots.length):0}
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
 $("comparisonChart").innerHTML='<div class="comparison-month-grid">'+stats.map(x=>'<section><b class="comparison-month-title">'+date(x.month).toLocaleDateString("fa-IR",{month:"short",year:"numeric"})+'</b>'+keys.map(([k,label])=>{const max=Math.max(1,...stats.map(z=>z[k]));return '<div class="comparison-value"><span>'+label+'</span><i><em style="width:'+Math.max(x[k]?2:0,x[k]/max*100)+'%"></em></i><b>'+fa(x[k])+(k==="progress"?"٪":"")+'</b></div>'}).join("")+'</section>').join("")+'</div>';
}
function applyChartFilters(){
 const rows=rowsForDept();
 renderIndependentTimeline(rows);
 const a=chartRows(rows,"dept"),b=chartRows(rows,"progress"),c=chartRows(rows,"status"),d=chartRows(rows,"priority"),e=chartRows(rows,"tracks"),g=chartRows(rows,"gantt"),scopeRows=chartRows(rows,"scope"),scheduleRows=chartRows(rows,"schedule"),continuityRows=chartRows(rows,"continuity"),phaseRows=chartRows(rows,"phase");
 drawBars("deptBars",Object.entries(depts).map(([id,label])=>({label,value:a.filter(m=>String(m.executorDepartment)===id).length})).filter(x=>x.value),false,true);
 drawBars("deptProgressBars",Object.entries(depts).map(([id,label])=>{const q=b.filter(m=>String(m.executorDepartment)===id);return {label,value:q.length?Math.round(q.reduce((s,m)=>s+Number(m.progress||0),0)/q.length):0,detail:q.length?fa(q.length)+" مأموریت مبنای محاسبه":"بدون مأموریت"}}).filter(x=>b.some(m=>depts[String(m.executorDepartment)]===x.label)),true);
 drawDonut("statusBars",Object.entries(statuses).map(([id,label])=>({label,value:c.filter(m=>m.status===id).length})).filter(x=>x.value));
 const pn={critical:"بحرانی",urgent:"فوری",important:"مهم",normal:"عادی"};
 drawBars("priorityBars",Object.entries(pn).map(([id,label])=>({label,value:d.filter(m=>m.priority===id).length})).filter(x=>x.value));
 drawBars("trackBars",[{label:"مدیریتی معاون",value:avg(e,"management")},{label:"دفتر معاون",value:avg(e,"office")},{label:"اجرای اداره",value:avg(e,"department")}],true);
 drawDonut("scopeBars",[{label:"داخل استان",value:scopeRows.filter(m=>m.locationScope==="inside-province").length},{label:"خارج از استان",value:scopeRows.filter(m=>m.locationScope==="outside-province").length}]);
 drawBars("scheduleBars",[{label:"روزانه",value:scheduleRows.filter(m=>m.workSchedule==="daytime").length},{label:"شبانه‌روزی",value:scheduleRows.filter(m=>m.workSchedule==="continuous-24h").length}],false,true);
 drawBars("continuityBars",[{label:"پیوسته و مستمر",value:continuityRows.filter(m=>m.continuityType==="continuous").length},{label:"ناپیوسته / مقطعی",value:continuityRows.filter(m=>m.continuityType==="intermittent").length}],false,true);
 const phaseOf=m=>m.missionPhase||(["completed","closed"].includes(m.status)?"completed":["in-progress","blocked","review","revision"].includes(m.status)?"active":"planned");
 drawDonut("phaseBars",[{label:"برنامه‌ریزی قبل از اجرا",value:phaseRows.filter(m=>phaseOf(m)==="planned").length},{label:"در حال اجرا",value:phaseRows.filter(m=>phaseOf(m)==="active").length},{label:"اتمام و پایان کار",value:phaseRows.filter(m=>phaseOf(m)==="completed").length}]);
 renderGantt(g);
}

async function refresh(){all=await MissionStore.list();const cfg=await MissionStore.config();for(const d of cfg?.departments||[])depts[String(d.id)]=d.name;const sel=$("reportDept");for(const m of all){const id=String(m.executorDepartment||"");if(id&&m.executorDepartmentName)depts[id]=m.executorDepartmentName;if(id&&![...sel.options].some(o=>o.value===id)){const o=document.createElement("option");o.value=id;o.textContent=depts[id]||"اداره "+id;sel.append(o)}}render()}
async function init(){try{await MissionStore.unlock();$("reportContent").hidden=false;$("reportState").textContent="اتصال برقرار است؛ داده‌ها مستقیماً از بانک مأموریت‌های معاونت ۷ خوانده می‌شوند.";const t=today();$("reportFrom").value=t;$("reportTo").value=t;setupComparisonMonths();await refresh();const seeded=await ensureMissionSamples();$("sampleDataState").textContent=seeded?fa(seeded)+" مأموریت نمونه به بانک اضافه شد.":"مأموریت‌های نمونه قبلاً ثبت شده‌اند.";await refresh()}catch(e){$("reportState").textContent=e.message;$("reportContent").hidden=true}}
init();$("seedMissionSamples").addEventListener("click",async()=>{try{const n=await ensureMissionSamples(true);await refresh();$("sampleDataState").textContent=n?fa(n)+" مأموریت نمونه ثبت شد.":"داده‌های نمونه قبلاً ثبت شده‌اند."}catch(e){$("sampleDataState").textContent="خطا: "+e.message}});$("removeMissionSamples").addEventListener("click",async()=>{try{const n=await removeMissionSamples();await refresh();$("sampleDataState").textContent=n?fa(n)+" مأموریت نمونه حذف شد.":"داده نمونه‌ای برای حذف وجود ندارد."}catch(e){$("sampleDataState").textContent="خطا: "+e.message}});$("reportRefresh").addEventListener("click",()=>refresh().catch(e=>$("reportState").textContent=e.message));$("reportPeriod").addEventListener("change",()=>{const x=$("reportPeriod").value==="custom";$("reportFrom").disabled=!x;$("reportTo").disabled=!x;render()});$("reportDept").addEventListener("change",render);$("reportFrom").addEventListener("change",render);$("reportTo").addEventListener("change",render);$("missionDetailSelect").addEventListener("change",renderDetail);document.querySelectorAll("[id^=chartPeriod-]").forEach(x=>{const id=x.id.slice("chartPeriod-".length),dates=$("chartDates-"+id),toggle=()=>{if(dates)dates.hidden=x.value!=="custom";applyChartFilters()};x.addEventListener("change",toggle);["chartFrom-"+id,"chartTo-"+id].forEach(k=>$(k)?.addEventListener("change",applyChartFilters));toggle()});$("comparisonMonths").addEventListener("change",renderComparison);
