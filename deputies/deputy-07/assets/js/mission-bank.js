import { MissionStore, MissionVault } from "./mission-store.js";
const $=id=>document.getElementById(id);
const fa=n=>Number(n||0).toLocaleString("fa-IR");
const names={"1":"اداره ۱ · اداری و پشتیبانی","2":"اداره ۲ · تحقیق و توسعه","3":"اداره ۳ · پارکبان و معبربانان","4":"اداره ۴ · تأسیسات فنی و نگهداری","6":"اداره ۶ · فاوا و خدمات فنی","7":"اداره ۷ · جمع‌آوری و بازیافت پسماند","8":"اداره ۸ · بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const labels={draft:"پیش‌نویس",registered:"ثبت‌شده",referred:"ارجاع‌شده","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"تکمیل‌شده",closed:"مختومه",cancelled:"لغوشده"};
let missions=[];
function late(m){return m.plannedEnd&&m.plannedEnd<new Date().toISOString().slice(0,10)&&!["completed","closed","cancelled"].includes(m.status);}
function render(){
 const q=$("bankSearch").value.trim().toLocaleLowerCase("fa"),dept=$("bankDept").value,status=$("bankStatus").value,priority=$("bankPriority").value;
 const list=missions.filter(m=>(!q||[m.missionCode,m.missionTitle,m.missionSubject,m.directOwner,m.assignedExpert,names[m.executorDepartment]].join(" ").toLocaleLowerCase("fa").includes(q))&&(!dept||String(m.executorDepartment)===dept)&&(!status||m.status===status)&&(!priority||m.priority===priority));
 const done=missions.filter(m=>["completed","closed"].includes(m.status)).length,active=missions.filter(m=>["referred","in-progress","blocked","review","revision"].includes(m.status)).length,lateCount=missions.filter(late).length,avg=missions.length?Math.round(missions.reduce((a,m)=>a+Number(m.progress||0),0)/missions.length):0;
 $("bankTotal").textContent=fa(missions.length);$("bankActive").textContent=fa(active);$("bankLate").textContent=fa(lateCount);$("bankDone").textContent=fa(done);$("bankProgress").textContent=fa(avg)+"٪";
 $("missionRows").innerHTML=list.map(m=>'<tr><td><b>'+esc(m.missionCode||m.id)+'</b><br>'+esc(m.missionTitle||"بدون عنوان")+'<br><small>'+esc(m.priority||"عادی")+'</small></td><td>'+esc(names[m.executorDepartment]||m.executorDepartmentName||"—")+'</td><td>'+esc(m.directOwner||m.assignedExpert||"—")+'</td><td>'+esc(m.plannedEnd||"—")+(late(m)?'<br><span class="danger">دارای تأخیر</span>':"")+'</td><td><div class="progress-track"><i style="width:'+Math.max(0,Math.min(100,Number(m.progress||0)))+'%"></i></div><small>'+fa(m.progress||0)+'٪</small></td><td><span class="state">'+esc(labels[m.status]||"ثبت‌شده")+'</span></td><td><a href="mission-create.html?id='+encodeURIComponent(m.id)+'">مشاهده / ویرایش</a></td></tr>').join("");
 $("bankEmpty").hidden=list.length!==0;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function refresh(){missions=await MissionStore.list();const select=$("bankDept");for(const m of missions){const id=String(m.executorDepartment||"");if(!id)continue;if(m.executorDepartmentName)names[id]=m.executorDepartmentName;if(![...select.options].some(o=>o.value===id)){const option=document.createElement("option");option.value=id;option.textContent=names[id]||("اداره "+id);select.append(option);}}render();}
$("bankUnlock").addEventListener("click",async()=>{try{const status=await MissionVault.status();if(status.exists)await MissionStore.unlock($("bankPass").value);else throw new Error("هنوز پایگاه داده ایجاد نشده است؛ ابتدا از صفحه ایجاد مأموریت یا مرکز داده آن را راه‌اندازی کنید.");$("bankPass").value="";$("bankPass").disabled=true;$("bankUnlock").disabled=true;$("bankContent").hidden=false;$("bankState").textContent="اتصال برقرار شد.";await refresh();}catch(e){$("bankState").textContent=e.message;}});
$("bankRefresh").addEventListener("click",async()=>{try{await refresh();}catch(e){$("bankState").textContent=e.message;}});
["bankSearch","bankDept","bankStatus","bankPriority"].forEach(id=>$(id).addEventListener(id==="bankSearch"?"input":"change",render));
