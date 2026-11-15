import { MissionStore } from "./mission-store.js?v=20261115-06";
import { ensureMissionSamples } from "./mission-samples.js?v=20261115-06";
const $=id=>document.getElementById(id);
const fa=n=>Number(n||0).toLocaleString("fa-IR");
const names={"1":"اداره ۱ · اداری و پشتیبانی","2":"اداره ۲ · تحقیق و توسعه","3":"اداره ۳ · پارکبان و معبربانان","4":"اداره ۴ · تأسیسات فنی و نگهداری","6":"اداره ۶ · فاوا و خدمات فنی","7":"اداره ۷ · جمع‌آوری و بازیافت پسماند","8":"اداره ۸ · بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const labels={draft:"پیش‌نویس",registered:"برنامه‌ریزی قبل از اجرا",referred:"ارجاع‌شده / در انتظار شروع","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"اتمام و پایان کار",closed:"مختومه",cancelled:"لغوشده"};
let missions=[];
const trackOf=(m,k)=>m.processTracks?.[k]||{};
const pct=(m,k)=>Math.max(0,Math.min(100,Number(trackOf(m,k).progress||0)));
const average=(items,k)=>items.length?Math.round(items.reduce((s,m)=>s+pct(m,k),0)/items.length):0;
function late(m){const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");return m.plannedEnd&&m.plannedEnd<today&&!["completed","closed","cancelled"].includes(m.status);}
function render(){
 const q=$("bankSearch").value.trim().toLocaleLowerCase("fa"),dept=$("bankDept").value,status=$("bankStatus").value,priority=$("bankPriority").value;
 const list=missions.filter(m=>(!q||[m.missionCode,m.missionTitle,m.missionSubject,m.directOwner,m.assignedExpert,m.processTracks?.management?.owner,m.processTracks?.office?.owner,m.processTracks?.department?.owner,names[m.executorDepartment]].join(" ").toLocaleLowerCase("fa").includes(q))&&(!dept||String(m.executorDepartment)===dept)&&(!status||m.status===status)&&(!priority||m.priority===priority));
 const done=missions.filter(m=>["completed","closed"].includes(m.status)).length,active=missions.filter(m=>["referred","in-progress","blocked","review","revision"].includes(m.status)).length,lateCount=missions.filter(late).length,avg=missions.length?Math.round(missions.reduce((a,m)=>a+Number(m.progress||0),0)/missions.length):0;
 $("bankTotal").textContent=fa(missions.length);$("bankActive").textContent=fa(active);$("bankLate").textContent=fa(lateCount);$("bankDone").textContent=fa(done);$("bankProgress").textContent=fa(avg)+"٪";
 $("missionRows").innerHTML=list.map(m=>{const status=labels[m.status]?"mission-status--"+m.status:"mission-status--unknown",progress=Math.max(0,Math.min(100,Number(m.progress||0)));return '<tr><td><b>'+esc(m.missionCode||m.id)+'</b>'+(m.isSampleData?' <small class="sample-badge">داده آزمایشی</small>':'')+'<br>'+esc(m.missionTitle||"بدون عنوان")+'<br><small>'+esc(m.priority||"عادی")+'</small></td><td>'+esc(names[m.executorDepartment]||m.executorDepartmentName||"—")+'</td><td>'+esc(m.directOwner||m.assignedExpert||"—")+'</td><td>'+esc(m.plannedEnd?new Intl.DateTimeFormat("fa-IR-u-ca-persian",{dateStyle:"medium"}).format(new Date(m.plannedEnd+"T12:00:00")):"—")+(late(m)?'<br><span class="danger">دارای تأخیر</span>':"")+'</td><td><div class="bank-days"><b>درخواستی: '+(m.missionDaysRequested==null?"—":fa(m.missionDaysRequested))+'</b><small>مصوب: '+(m.missionDaysApproved==null?"—":fa(m.missionDaysApproved))+'</small><small>انجام‌شده: '+(m.missionDaysCompleted==null?"—":fa(m.missionDaysCompleted))+'</small></div></td><td><div class="progress-track"><i style="width:'+progress+'%"></i></div><small>'+fa(progress)+'٪</small></td><td><span class="mission-status '+status+'">'+esc(labels[m.status]||"بدون وضعیت ثبت‌شده")+'</span></td><td class="bank-row-actions"><a class="bank-edit" href="mission-create.html?id='+encodeURIComponent(m.id)+'">ویرایش</a><button type="button" class="bank-delete" data-delete-id="'+esc(m.id)+'">حذف</button></td></tr>';}).join("");
 $("missionRows").querySelectorAll("[data-delete-id]").forEach(btn=>btn.addEventListener("click",async()=>{const item=missions.find(m=>String(m.id)===btn.dataset.deleteId);if(!item||!confirm("مأموریت «"+(item.missionTitle||item.missionCode||item.id)+"» از بانک حذف شود؟ این عملیات فقط پس از تأیید شما انجام می‌شود و سابقه حذف در مخزن ثبت خواهد شد."))return;try{await MissionStore.remove(item.id);await refresh()}catch(error){alert("حذف انجام نشد: "+error.message)}}));
 $("bankEmpty").hidden=list.length!==0;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function refresh(){missions=await MissionStore.list();const config=await MissionStore.config();for(const d of config?.departments||[])names[String(d.id)]=d.name;const core=config?.coreFields||{};const title=$("bankTitleHead"),deptHead=$("bankDeptHead"),owner=$("bankOwnerHead"),deadline=$("bankDeadlineHead");if(title)title.textContent=(core.missionTitle?.label||"عنوان مأموریت")+" / کد";if(deptHead)deptHead.textContent=core.executorDepartment?.label||"اداره مجری";if(owner)owner.textContent=core.directOwner?.label||"مسئول مستقیم";if(deadline)deadline.textContent=core.plannedEnd?.label||"مهلت پایان";const select=$("bankDept");for(const m of missions){const id=String(m.executorDepartment||"");if(!id)continue;if(m.executorDepartmentName)names[id]=m.executorDepartmentName;if(![...select.options].some(o=>o.value===id)){const option=document.createElement("option");option.value=id;option.textContent=names[id]||("اداره "+id);select.append(option);}}render();}
function setBackupState(message,error=false){const el=$("bankBackupState");if(el){el.textContent=message;el.classList.toggle("is-error",!!error);}}
function backupFilename(){const d=new Date(),stamp=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0"),String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join("");return "mission-bank-backup-"+stamp+".json";}
async function saveBackupFile(content,name){
 const blob=new Blob([content],{type:"application/json;charset=utf-8"});
 if(window.showSaveFilePicker){
  try{
   const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:"پشتیبان بانک مأموریت‌ها",accept:{"application/json":[".json"]}}]});
   const writable=await handle.createWritable();await writable.write(blob);await writable.close();return "saved";
  }catch(error){if(error?.name==="AbortError")return "cancelled";throw error;}
 }
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);return "downloaded";
}
$("bankBackup").addEventListener("click",async()=>{
 const button=$("bankBackup");button.disabled=true;
 try{
  const content=await MissionStore.exportBankBackup(),pkg=JSON.parse(content),name=backupFilename();
  const result=await saveBackupFile(content,name);
  if(result==="cancelled"){setBackupState("ذخیره پشتیبان لغو شد.");return;}
  setBackupState("پشتیبان بانک مأموریت‌ها آماده شد: "+fa(pkg.counts.missionChanges)+" تغییر مأموریت، "+fa(pkg.counts.attachments)+" پیوست. فایل: "+name);
 }catch(error){setBackupState("تهیه پشتیبان ناموفق بود: "+error.message,true);}
 finally{button.disabled=false;}
});
$("bankRestore").addEventListener("click",()=>$("bankBackupFile").click());
$("bankBackupFile").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 const button=$("bankRestore");button.disabled=true;
 try{
  if(file.size>100*1024*1024)throw new Error("حجم فایل پشتیبان از سقف ۱۰۰ مگابایت بیشتر است.");
  const content=await file.text(),pkg=JSON.parse(content);
  const count=pkg?.counts?.missionChanges??pkg?.payload?.changes?.length??0;
  if(!confirm("فایل «"+file.name+"» بارگذاری شود؟\n"+fa(count)+" تغییر در بانک ادغام می‌شود. اطلاعات فعلی حذف نخواهد شد."))return;
  const result=await MissionStore.importBankBackup(content);
  await refresh();
  setBackupState("بازیابی انجام شد؛ "+fa(result.added)+" تغییر جدید و "+fa(result.filesAdded)+" پیوست اضافه شد، "+fa(result.duplicates)+" مورد تکراری نادیده گرفته شد. تعداد مأموریت‌های قابل مشاهده: "+fa(result.records)+".");
 }catch(error){setBackupState("بارگذاری پشتیبان ناموفق بود: "+error.message,true);}
 finally{button.disabled=false;event.target.value="";}
});
async function initBank(){try{await MissionStore.unlock();await ensureMissionSamples();$("bankContent").hidden=false;$("bankState").textContent="اتصال خودکار برقرار شد؛ پایگاه داده بدون رمز باز است.";await refresh();}catch(e){$("bankState").textContent=e.message;$("bankContent").hidden=true;}}initBank();
$("bankRefresh").addEventListener("click",async()=>{try{await refresh();}catch(e){$("bankState").textContent=e.message;}});
["bankSearch","bankDept","bankStatus","bankPriority"].forEach(id=>$(id).addEventListener(id==="bankSearch"?"input":"change",render));
