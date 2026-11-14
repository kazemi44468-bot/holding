import { MissionStore, MissionVault } from "./mission-store.js";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const editingId = params.get("id");
const sections = [...document.querySelectorAll("[data-section]")];
const tabs = [...document.querySelectorAll("[data-tab]")];
let activeStep = 0, unlocked = false, currentMission = null, schema = null;
const departmentNames = {
 "1":"اداره ۱ · اداری و پشتیبانی",
 "2":"اداره ۲ · تحقیق و توسعه",
 "3":"اداره ۳ · پارکبان و معبربانان",
 "4":"اداره ۴ · تأسیسات فنی و امور نگهداری",
 "6":"اداره ۶ · فاوا و خدمات فنی",
 "7":"اداره ۷ · جمع‌آوری، نگهداری و بازیافت پسماند",
 "8":"اداره ۸ · بازرسی و تحقیقات محلی",
 "HQ":"ستاد معاونت ۷"
};
const baseSchema = {
 schemaId:"mission-form", version:1, departments:[
  {id:"1",name:departmentNames["1"],fields:[
   {id:"personnelNeed",label:"تعداد نیروی موردنیاز",type:"number",unit:"نفر"},
   {id:"administrativeProcess",label:"فرایند اداری مرتبط",type:"select",options:["استخدام و احکام","حضور و غیاب","آموزش","رفاه و پشتیبانی","امور دبیرخانه","سایر"]},
   {id:"serviceArea",label:"حوزه پشتیبانی",type:"text"}
  ]},
  {id:"2",name:departmentNames["2"],fields:[
   {id:"researchField",label:"حوزه پژوهش",type:"select",options:["مطالعات شهری","ارزیابی عملکرد","تحلیل داده","توسعه روش‌ها","امکان‌سنجی","سایر"]},
   {id:"researchMethod",label:"روش مطالعه",type:"text"},
   {id:"researchOutput",label:"خروجی علمی مورد انتظار",type:"textarea"}
  ]},
  {id:"3",name:departmentNames["3"],fields:[
   {id:"operationZone",label:"منطقه / محدوده عملیاتی",type:"text"},
   {id:"shiftPlan",label:"شیفت یا بازه عملیات",type:"text"},
   {id:"fieldTeamCount",label:"تعداد نیروی میدانی",type:"number",unit:"نفر"},
   {id:"equipmentNeeded",label:"تجهیزات و اقلام موردنیاز",type:"textarea"}
  ]},
  {id:"4",name:departmentNames["4"],fields:[
   {id:"facilityType",label:"نوع تأسیسات / تجهیز",type:"text"},
   {id:"assetCode",label:"کد اموال یا تجهیز",type:"text"},
   {id:"maintenanceType",label:"نوع عملیات فنی",type:"select",options:["بازدید دوره‌ای","نگهداری پیشگیرانه","تعمیر اضطراری","تعمیر اساسی","نصب و راه‌اندازی","بهسازی"]},
   {id:"technicalRisk",label:"وضعیت ایمنی و ریسک فنی",type:"select",options:["عادی","نیازمند مراقبت","خطرناک","خارج از سرویس"]}
  ]},
  {id:"6",name:departmentNames["6"],fields:[
   {id:"systemName",label:"سامانه / زیرساخت مرتبط",type:"text"},
   {id:"serviceImpact",label:"سطح اثر بر خدمت",type:"select",options:["بدون اختلال","محدود","متوسط","گسترده","توقف خدمت"]},
   {id:"technicalEnvironment",label:"محیط فنی / بستر اجرا",type:"text"},
   {id:"securityReview",label:"نیازمند بررسی امنیتی",type:"select",options:["خیر","بله"]}
  ]},
  {id:"7",name:departmentNames["7"],fields:[
   {id:"wasteStream",label:"نوع پسماند / جریان کاری",type:"select",options:["عادی","خشک","تر","قابل بازیافت","عمرانی","ویژه","سایر"]},
   {id:"operationRoute",label:"مسیر / محدوده جمع‌آوری",type:"text"},
   {id:"fleetCount",label:"تعداد خودرو یا ماشین‌آلات",type:"number",unit:"دستگاه"},
   {id:"estimatedVolume",label:"حجم برآوردی عملیات",type:"text"}
  ]},
  {id:"8",name:departmentNames["8"],fields:[
   {id:"inspectionSubject",label:"موضوع بازرسی",type:"text"},
   {id:"inspectionScope",label:"دامنه و محل بررسی",type:"textarea"},
   {id:"inspectionMethod",label:"روش بررسی",type:"select",options:["بازدید میدانی","بررسی اسناد","مصاحبه","تحلیل داده","ترکیبی"]},
   {id:"evidenceType",label:"نوع مستندات مورد انتظار",type:"textarea"}
  ]},
  {id:"HQ",name:departmentNames.HQ,fields:[
   {id:"coordinationUnits",label:"واحدهای مشارکت‌کننده",type:"textarea"},
   {id:"executiveSponsor",label:"حامی / مقام راهبر",type:"text"},
   {id:"decisionNeeded",label:"تصمیم موردنیاز ریاست",type:"textarea"}
  ]}
 ]
};
const fieldIds = [
 "communicationType","requestNumber","requestDate","requestChannel","missionTitle","missionSubject","expectedPurpose","priority","confidentiality",
 "requesterType","requesterName","requesterPerson","requesterContact","executorDepartment","executorSubunit","directOwner","assignedExpert","missionType","workNature","routingNote",
 "receivedAt","deliveredToDeputyAt","referredAt","coordinationAt","plannedStart","actualStart","plannedEnd","actualEnd","reportFrequency","durationEstimate","milestones",
 "previousMissionCode","previousMissionTitle","previousPeriod","previousNotes",
 "costStatus","costCurrency","estimatedCost","approvedBudget","actualCost","costCenter","costBreakdown","financialNotes",
 "teamLead","supervisor","teamMembers","externalParticipants","responsibilityMatrix",
 "deliverableType","deliveryDate","expectedDeliverables","actualResults","handoverTo","handoverNotes",
 "progress","executionStatus","qualityScore","goalAchievement","scheduleStatus","riskLevel","progressDescription","obstacles","evaluationNotes",
 "documentRegister","meetingMinutes","meetingActions",
 "headOfDepartmentOrder","headOfDepartmentBy","headOfDepartmentAt","deputyOrder","deputyBy","deputyAt","calendarTitle","calendarStart","calendarEnd","calendarReminder","calendarDescription"
];
const readField = id => { const el=$(id); return el ? (el.type==="number" ? (el.value===""?null:Number(el.value)) : el.value.trim()) : null; };
const writeField = (id,value) => { const el=$(id); if(el&&value!==undefined&&value!==null)el.value=value; };
const selectedRadio = name => document.querySelector('input[name="'+name+'"]:checked')?.value || "";
const setRadio = (name,value) => { const el=document.querySelector('input[name="'+name+'"][value="'+value+'"]');if(el)el.checked=true; };
const dateNow = () => new Date().toISOString().slice(0,10);
const toFa = value => Number(value||0).toLocaleString("fa-IR");
const safe = value => String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function makeCode(){const d=new Date(),stamp=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("");return "M7-"+stamp+"-"+crypto.randomUUID().slice(0,6).toUpperCase();}
function statusLabel(status){return ({draft:"پیش‌نویس",registered:"ثبت‌شده",referred:"ارجاع‌شده","in-progress":"در حال اجرا",blocked:"دارای مانع",review:"در انتظار بررسی",completed:"تکمیل‌شده",closed:"مختومه",cancelled:"لغوشده"})[status]||"ثبت‌شده";}
function defaultConfig(){return structuredClone(baseSchema);}
async function loadSchema(){schema=await MissionStore.config()||defaultConfig();$("schemaJson").value=JSON.stringify(schema,null,2);renderDepartmentFields();}
function renderDepartmentFields(){
 const host=$("departmentFields"),dept=$("executorDepartment").value;
 host.querySelectorAll(".generated-field").forEach(x=>x.remove());
 const definition=(schema?.departments||[]).find(x=>String(x.id)===String(dept));
 const heading=host.querySelector("h3");
 heading.textContent=definition?.name ? "اطلاعات اختصاصی · "+definition.name : "اطلاعات اختصاصی اداره انتخاب‌شده";
 if(!definition?.fields?.length){const p=document.createElement("p");p.className="hint generated-field";p.textContent="برای این واحد هنوز فیلد اختصاصی تعریف نشده است.";host.append(p);return;}
 for(const field of definition.fields){
  const wrap=document.createElement("div");wrap.className="field generated-field";
  const label=document.createElement("label");label.htmlFor="custom_"+field.id;label.textContent=field.label+(field.unit?" ("+field.unit+")":"");
  let input;
  if(field.type==="select"){input=document.createElement("select");const empty=document.createElement("option");empty.value="";empty.textContent="انتخاب کنید";input.append(empty);(field.options||[]).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;input.append(o);});}
  else if(field.type==="textarea"){input=document.createElement("textarea");input.rows=3;}
  else{input=document.createElement("input");input.type=["number","date"].includes(field.type)?field.type:"text";}
  input.id="custom_"+field.id;input.dataset.customId=field.id;input.dataset.customType=field.type;input.placeholder=field.placeholder||"";
  wrap.append(label,input);host.append(wrap);
 }
}
function readCustom(){const out={};document.querySelectorAll("[data-custom-id]").forEach(el=>{out[el.dataset.customId]=el.type==="number"?(el.value===""?null:Number(el.value)):el.value.trim();});return out;}
function writeCustom(values){Object.entries(values||{}).forEach(([id,value])=>{const el=document.querySelector('[data-custom-id="'+CSS.escape(id)+'"]');if(el&&value!==null&&value!==undefined)el.value=value;});}
function goStep(index){activeStep=Math.max(0,Math.min(sections.length-1,index));sections.forEach((s,i)=>s.classList.toggle("active",i===activeStep));tabs.forEach((t,i)=>t.setAttribute("aria-selected",String(i===activeStep)));$("prevStep").disabled=activeStep===0;$("nextStep").classList.toggle("hidden",activeStep===sections.length-1);$("saveMission").textContent=editingId?"ذخیره تغییرات مأموریت":"ثبت و ذخیره مأموریت";tabs[activeStep].scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});}
function updateProgress(){const value=Math.max(0,Math.min(100,Number($("progress").value||0)));$("progressBar").style.width=value+"%";$("progressText").textContent="پیشرفت ثبت‌شده: "+toFa(value)+"٪ · وضعیت: "+statusLabel($("executionStatus").value);}
function collect(){
 const data={};fieldIds.forEach(id=>data[id]=readField(id));
 data.hasPrevious=selectedRadio("hasPrevious")==="yes";
 data.calendarEnabled=selectedRadio("calendarEnabled")!=="no";
 data.departmentFields=readCustom();
 data.executorDepartmentName=departmentNames[data.executorDepartment]||"";
 data.status=data.executionStatus||"registered";
 data.progress=Number(data.progress||0);
 data.workflow={stage:data.status,assignedDepartment:data.executorDepartment,assignedManager:data.directOwner,assignedExpert:data.assignedExpert,updatedAt:new Date().toISOString()};
 data.calendarEvent=data.calendarEnabled?{
  id:"mission-event:"+ (currentMission?.missionCode||data.missionCode||"new"),type:"mission",missionCode:currentMission?.missionCode||data.missionCode||"",title:data.calendarTitle||data.missionTitle,
  start:data.calendarStart||data.plannedStart||dateNow(),end:data.calendarEnd||data.plannedEnd||data.calendarStart||data.plannedStart||dateNow(),
  dept:data.executorDepartment||"all",description:data.calendarDescription||data.missionSubject||"",reminder:data.calendarReminder||"بدون یادآوری"
 }:null;
 data.schemaSnapshot=structuredClone(schema||defaultConfig());
 data.schemaVersion=Number(schema?.version||1);
 return data;
}
function fill(data){
 fieldIds.forEach(id=>writeField(id,data[id]));
 setRadio("hasPrevious",data.hasPrevious?"yes":"no");
 setRadio("calendarEnabled",data.calendarEnabled===false?"no":"yes");
 $("previousFields").classList.toggle("hidden",!data.hasPrevious);
 renderDepartmentFields();writeCustom(data.departmentFields);
}
function renderProgressHistory(log=[]){
 $("progressHistory").innerHTML=log.length?log.slice().reverse().map(item=>'<div style="padding:8px 0;border-bottom:1px solid #e3ebf0"><b>'+safe(toFa(item.progress??0))+'٪</b> · '+safe(new Date(item.at).toLocaleString("fa-IR"))+'<div>'+safe(item.note||"بدون توضیح")+'</div><small>'+safe(item.by||"ثبت‌کننده")+'</small></div>').join(""):"هنوز گزارشی در تاریخچه پیشرفت ثبت نشده است.";
}
async function saveMission(asDraft=false){
 const required=asDraft?["missionTitle"]:["missionTitle","missionSubject","executorDepartment","plannedEnd"];
 for(const id of required){const el=$(id);if(!el.value.trim()){el.focus();throw new Error(asDraft?"برای ذخیره پیش‌نویس، عنوان مأموریت را وارد کنید.":"فیلدهای عنوان، شرح موضوع، اداره مجری و مهلت اتمام الزامی هستند.");}}
 if(!asDraft&&!$("missionForm").reportValidity())throw new Error("لطفاً فیلدهای الزامی را تکمیل کنید.");
 const data=collect();if(asDraft&&data.status==="draft")data.status="draft";else if(data.status==="draft")data.status="registered";
 data.executionStatus=data.status;data.workflow.stage=data.status;
 const now=new Date().toISOString();
 if(!currentMission){data.missionCode=makeCode();data.createdAt=now;data.progressLog=[{id:crypto.randomUUID(),at:now,progress:data.progress,note:"ثبت اولیه مأموریت",by:"ثبت‌کننده"}];if(data.calendarEvent){data.calendarEvent.id="mission-event:"+data.missionCode;data.calendarEvent.missionCode=data.missionCode;}}
 else{data.missionCode=currentMission.missionCode;data.createdAt=currentMission.createdAt;data.progressLog=currentMission.progressLog||[];data.updatedAt=now;}
 const id=await MissionStore.save(data,currentMission?.id);
 currentMission={...data,id};
 const files=[...($("missionFiles").files||[])];
 const attached=[];
 for(const file of files){attached.push(await MissionVault.addAttachment(file,"mission",id));}
 if(attached.length){currentMission.attachments=[...(currentMission.attachments||[]),...attached];await MissionStore.save(currentMission,id);}
 $("missionFiles").value="";
 $("missionMeta").textContent="کد مأموریت: "+currentMission.missionCode+" · آخرین ذخیره: "+new Date().toLocaleString("fa-IR");
 $("statusLabel").textContent=statusLabel(currentMission.status);
 $("saveResult").textContent="مأموریت با موفقیت در بانک مرکزی معاونت ۷ ذخیره شد. "+(attached.length?toFa(attached.length)+" پیوست نیز رمزگذاری شد.":"");
 $("pageTitle").textContent="ویرایش مأموریت · "+currentMission.missionCode;
 $("progressBar").style.width=Number(currentMission.progress||0)+"%";updateProgress();renderProgressHistory(currentMission.progressLog);
 history.replaceState(null,"",location.pathname+"?id="+encodeURIComponent(id));
 return id;
}
async function loadMission(id){
 const mission=await MissionStore.get(id);if(!mission)throw new Error("مأموریت موردنظر در بانک پیدا نشد.");
 currentMission=mission;fill(mission);
 $("pageTitle").textContent="ویرایش مأموریت · "+mission.missionCode;
 $("missionMeta").textContent="کد مأموریت: "+mission.missionCode+" · ایجاد: "+new Date(mission.createdAt).toLocaleString("fa-IR");
 $("statusLabel").textContent=statusLabel(mission.status);
 updateProgress();renderProgressHistory(mission.progressLog||[]);
}
async function unlock(){
 const pass=$("vaultPass").value;
 const status=await MissionVault.status();
 if(status.exists)await MissionStore.unlock(pass);
 else await MissionStore.unlock(pass);
 unlocked=true;$("vaultPass").value="";$("workArea").classList.remove("hidden");$("authState").textContent="اتصال امن برقرار شد؛ داده‌ها از مخزن رمزگذاری‌شده مشترک معاونت ۷ خوانده می‌شوند.";
 $("unlockVault").disabled=true;$("vaultPass").disabled=true;$("schemaAdmin").hidden=false;
 await loadSchema();
 if(editingId)await loadMission(editingId);
 else{writeField("requestDate",dateNow());writeField("receivedAt",new Date().toISOString().slice(0,16));writeField("calendarStart",dateNow());writeField("calendarEnd",dateNow());}
}
$("unlockVault").addEventListener("click",async()=>{try{await unlock();}catch(e){$("authState").textContent=e.message;}});
$("executorDepartment").addEventListener("change",renderDepartmentFields);
document.querySelectorAll('input[name="hasPrevious"]').forEach(el=>el.addEventListener("change",()=>$("previousFields").classList.toggle("hidden",selectedRadio("hasPrevious")!=="yes")));
$("progress").addEventListener("input",updateProgress);$("executionStatus").addEventListener("change",updateProgress);
tabs.forEach((tab,index)=>tab.addEventListener("click",()=>goStep(index)));
$("prevStep").addEventListener("click",()=>goStep(activeStep-1));
$("nextStep").addEventListener("click",()=>goStep(activeStep+1));
$("missionForm").addEventListener("submit",async e=>{e.preventDefault();try{await saveMission(false);}catch(err){$("saveResult").textContent=err.message;$("saveResult").classList.add("danger");}});
$("saveDraft").addEventListener("click",async()=>{try{if(!$("missionTitle").value.trim())throw new Error("برای ذخیره پیش‌نویس، حداقل عنوان مأموریت را وارد کنید.");$("executionStatus").value="draft";await saveMission(true);}catch(e){$("saveResult").textContent=e.message;}});
$("addProgress").addEventListener("click",async()=>{try{if(!currentMission)throw new Error("ابتدا مأموریت را ذخیره کنید.");const note=$("progressDescription").value.trim();await MissionStore.addProgress(currentMission.id,{progress:Number($("progress").value||0),note,by:$("assignedExpert").value||$("directOwner").value||"ثبت‌کننده",status:$("executionStatus").value});currentMission=await MissionStore.get(currentMission.id);renderProgressHistory(currentMission.progressLog||[]);$("saveResult").textContent="گزارش پیشرفت در تاریخچه مأموریت ثبت شد.";}catch(e){$("saveResult").textContent=e.message;}});
$("loadSchema").addEventListener("click",()=>{try{$("schemaJson").value=JSON.stringify(schema,null,2);$("schemaResult").textContent="ساختار فعال بارگذاری شد.";}catch(e){$("schemaResult").textContent=e.message;}});
$("resetSchema").addEventListener("click",()=>{$("schemaJson").value=JSON.stringify(defaultConfig(),null,2);});
$("saveSchema").addEventListener("click",async()=>{try{const next=JSON.parse($("schemaJson").value);if(!Array.isArray(next.departments))throw new Error("آرایه departments الزامی است.");for(const d of next.departments){if(!d.id||!Array.isArray(d.fields))throw new Error("هر اداره باید شناسه و آرایه fields داشته باشد.");for(const f of d.fields){if(!f.id||!f.label||!["text","textarea","number","date","select"].includes(f.type))throw new Error("هر فیلد باید id، label و نوع معتبر داشته باشد.");}}schema=await MissionStore.saveConfig({...next,schemaId:"mission-form"});$("schemaJson").value=JSON.stringify(schema,null,2);renderDepartmentFields();$("schemaResult").textContent="نسخه "+toFa(schema.version)+" از ساختار فرم ذخیره شد. مأموریت‌های قبلی تعریف نسخه زمان ثبت خود را حفظ می‌کنند.";}catch(e){$("schemaResult").textContent="خطا: "+e.message;}});
goStep(0);updateProgress();
