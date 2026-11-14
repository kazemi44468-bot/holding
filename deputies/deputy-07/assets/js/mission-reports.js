import { MissionStore, MissionVault } from "./mission-store.js";
const $=id=>document.getElementById(id),fa=n=>Number(n||0).toLocaleString("fa-IR");
const depts={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارکبان و معبربانان","4":"تأسیسات فنی و نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const statuses={draft:"پیش‌نویس",registered:"ثبت‌شده",referred:"ارجاع‌شده","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"تکمیل‌شده",closed:"مختومه",cancelled:"لغوشده"};
let all=[];
function dateCutoff(period){const d=new Date();if(period==="month")d.setMonth(d.getMonth()-1);if(period==="quarter")d.setMonth(d.getMonth()-3);if(period==="year")d.setFullYear(d.getFullYear(),0,1);return period==="all"?null:d;}
function filtered(){const cutoff=dateCutoff($("reportPeriod").value),dept=$("reportDept").value;return all.filter(m=>(!dept||String(m.executorDepartment)===dept)&&(!cutoff||new Date(m.createdAt)>=cutoff));}
function late(m){return m.plannedEnd&&m.plannedEnd<new Date().toISOString().slice(0,10)&&!["completed","closed","cancelled"].includes(m.status);}
function bars(id,entries){const max=Math.max(1,...entries.map(x=>x.value));$(id).innerHTML=entries.length?entries.map(x=>'<div class="report-bar"><span>'+esc(x.label)+'</span><span class="report-track"><i style="width:'+Math.max(0,x.value/max*100)+'%"></i></span><b>'+fa(x.value)+'</b></div>').join(""):'<span class="profile-hint">داده‌ای برای نمایش وجود ندارد.</span>';}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
 const rows=filtered(),done=rows.filter(m=>["completed","closed"].includes(m.status)),active=rows.filter(m=>["referred","in-progress","blocked","review"].includes(m.status)),lateRows=rows.filter(late),avg=rows.length?Math.round(rows.reduce((s,m)=>s+Number(m.progress||0),0)/rows.length):0,goal=rows.filter(m=>m.goalAchievement!==null&&m.goalAchievement!==undefined&&m.goalAchievement!=="");
 $("rTotal").textContent=fa(rows.length);$("rDone").textContent=fa(done.length);$("rActive").textContent=fa(active.length);$("rLate").textContent=fa(lateRows.length);$("rProgress").textContent=fa(avg)+"٪";$("rGoal").textContent=goal.length?fa(Math.round(goal.reduce((s,m)=>s+Number(m.goalAchievement),0)/goal.length))+"٪":"—";
 const statusEntries=Object.entries(statuses).map(([id,label])=>({label,value:rows.filter(m=>m.status===id).length})).filter(x=>x.value);
 bars("statusBars",statusEntries);
 const deptEntries=Object.entries(depts).map(([id,label])=>({label,value:rows.filter(m=>String(m.executorDepartment)===id).length})).filter(x=>x.value);
 bars("deptBars",deptEntries);
 const priorities=["critical","urgent","important","normal"],priorityNames={critical:"بحرانی",urgent:"فوری",important:"مهم",normal:"عادی"};
 bars("priorityBars",priorities.map(p=>({label:priorityNames[p],value:rows.filter(m=>m.priority===p).length})).filter(x=>x.value));
 const completedLate=done.filter(m=>m.plannedEnd&&m.actualEnd&&m.actualEnd>m.plannedEnd).length;
 const noDeadline=rows.filter(m=>!m.plannedEnd).length;
 const days=rows.filter(m=>m.plannedStart&&m.plannedEnd).map(m=>Math.max(0,(new Date(m.plannedEnd)-new Date(m.plannedStart))/86400000));
 const actualCosts=rows.reduce((sum,m)=>sum+Number(m.actualCost||0),0),estimatedCosts=rows.reduce((sum,m)=>sum+Number(m.estimatedCost||0),0);
 const milestones=rows.reduce((sum,m)=>sum+(Array.isArray(m.milestones)?m.milestones.length:0),0);
 const teamRows=rows.reduce((sum,m)=>sum+(typeof m.teamMembers==="string"?m.teamMembers.split(/\r?\n/).filter(Boolean).length:Array.isArray(m.teamMembers)?m.teamMembers.length:0),0);
 $("timeSummary").innerHTML='<div>مأموریت‌های دارای مهلت: <b>'+fa(rows.length-noDeadline)+'</b></div><div>فاقد تاریخ پایان: <b>'+fa(noDeadline)+'</b></div><div>تکمیل‌شده با تأخیر: <b>'+fa(completedLate)+'</b></div><div>میانگین بازه برنامه‌ای: <b>'+fa(days.length?Math.round(days.reduce((a,b)=>a+b,0)/days.length):0)+' روز</b></div><div>دارای مانع اجرایی: <b>'+fa(rows.filter(m=>m.status==="blocked").length)+'</b></div><div>برآورد کل هزینه‌ها: <b>'+fa(estimatedCosts)+' تومان</b></div><div>هزینه واقعی ثبت‌شده: <b>'+fa(actualCosts)+' تومان</b></div><div>نقاط عطف تعریف‌شده: <b>'+fa(milestones)+'</b></div><div>ردیف‌های اعضای تیم: <b>'+fa(teamRows)+'</b></div>';
 $("deptReportRows").innerHTML=Object.entries(depts).map(([id,name])=>{const list=rows.filter(m=>String(m.executorDepartment)===id),d=list.filter(m=>["completed","closed"].includes(m.status)).length,a=list.filter(m=>["referred","in-progress","blocked","review"].includes(m.status)).length,l=list.filter(late).length,p=list.length?Math.round(list.reduce((s,m)=>s+Number(m.progress||0),0)/list.length):0;return "<tr><td>"+name+"</td><td>"+fa(list.length)+"</td><td>"+fa(d)+"</td><td>"+fa(a)+"</td><td>"+fa(l)+"</td><td>"+fa(p)+"٪</td></tr>";}).join("");
}
async function refresh(){all=await MissionStore.list();const select=$("reportDept");for(const m of all){const id=String(m.executorDepartment||"");if(!id)continue;if(m.executorDepartmentName)depts[id]=m.executorDepartmentName;if(![...select.options].some(o=>o.value===id)){const option=document.createElement("option");option.value=id;option.textContent=depts[id]||("اداره "+id);select.append(option);}}render();}
$("reportUnlock").addEventListener("click",async()=>{try{const status=await MissionVault.status();if(!status.exists)throw new Error("پایگاه داده هنوز ایجاد نشده است.");await MissionStore.unlock($("reportPass").value);$("reportPass").value="";$("reportPass").disabled=true;$("reportUnlock").disabled=true;$("reportContent").hidden=false;$("reportState").textContent="گزارش‌ها از داده‌های واقعی بانک مأموریت‌ها بارگذاری شدند.";await refresh();}catch(e){$("reportState").textContent=e.message;}});
$("reportRefresh").addEventListener("click",async()=>{try{await refresh();}catch(e){$("reportState").textContent=e.message;}});
$("reportPeriod").addEventListener("change",render);$("reportDept").addEventListener("change",render);
