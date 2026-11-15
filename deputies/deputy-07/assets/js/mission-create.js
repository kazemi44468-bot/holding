import { MissionStore, MissionVault } from "./mission-store.js";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const editingId = params.get("id");
const sections = [...document.querySelectorAll("[data-section]")];
const tabs = [...document.querySelectorAll("[data-tab]")];
let activeStep = 0, unlocked = false, currentMission = null, schema = null;
const departmentDraftValues = {};
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
 schemaId:"mission-form", version:1, coreFields:{}, extraFields:[], options:{
  communicationType:["نامه رسمی","درخواست شفاهی","مکاتبه داخلی","صورتجلسه","دستور مقام مافوق","گزارش یا اعلام نیاز"],
  requestChannel:["دبیرخانه","سامانه مکاتبات","ارجاع مستقیم","جلسه","تماس یا اعلام شفاهی","سایر"],
  requesterType:["ریاست معاونت","معاونت","مرکز","اداره","مدیریت","واحد یا شخص","سازمان بیرونی"],
  priority:["normal|عادی","important|مهم","urgent|فوری","critical|بحرانی"],
  confidentiality:["عادی","داخلی","محرمانه","محدود به مدیران"],
  missionType:["اجرایی","مطالعاتی و پژوهشی","نظارتی و بازرسی","فنی و تعمیراتی","پشتیبانی","برنامه‌ریزی و هماهنگی","خدماتی و عملیاتی","اصلاحی و رفع نقص","توسعه‌ای / پروژه‌ای","سایر"],
  workNature:["مستمر","مقطعی","مرحله‌ای","پروژه‌ای","اضطراری"],
  reportFrequency:["روزانه","هفتگی","دو هفته یک‌بار","ماهانه","در نقاط عطف"],
  costStatus:["بدون هزینه مستقیم","نیازمند برآورد","در انتظار تأمین اعتبار","اعتبار تخصیص‌یافته","دارای هزینه قطعی"],
  costCurrency:["تومان","ریال"],
  deliverableType:["گزارش مکتوب","خدمت انجام‌شده","تعمیر / تجهیز آماده بهره‌برداری","سامانه یا قابلیت نرم‌افزاری","طرح و پیشنهاد","داده و مستندات","عملیات میدانی تکمیل‌شده","سایر"],
  executionStatus:["draft|پیش‌نویس","registered|ثبت‌شده","referred|ارجاع‌شده","in-progress|در حال اجرا","blocked|متوقف / دارای مانع","review|در انتظار بررسی نتیجه","revision|نیازمند اصلاح","completed|تکمیل‌شده","closed|مختومه","cancelled|لغوشده"],
  scheduleStatus:["مطابق برنامه","جلوتر از برنامه","دارای تأخیر","متوقف به علت مانع","تمدید مهلت"],
  riskLevel:["بدون مانع","کم","متوسط","زیاد","بحرانی"],
  calendarReminder:["بدون یادآوری","یک روز قبل","سه روز قبل","یک هفته قبل"]
 }, departments:[
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
 "receivedAt","deliveredToDeputyAt","deputyApproval","deputyReferralDepartment","deputyReferralPerson","deputyReferralAt","referredAt","coordinationAt","plannedStart","actualStart","plannedEnd","actualEnd","locationScope","workSchedule","continuityType","reportFrequency","durationEstimate","missionDaysRequested","missionDaysApproved","missionDaysCompleted","milestones",
 "previousMissionCode","previousMissionTitle","previousPeriod","previousNotes",
 "costStatus","costCurrency","estimatedCost","approvedBudget","actualCost","costCenter","costBreakdown","financialNotes",
 "teamLead","supervisor","teamMembers","externalParticipants","responsibilityMatrix",
 "deliverableType","deliveryDate","expectedDeliverables","actualResults","handoverTo","handoverNotes",
 "progress","executionStatus","qualityScore","goalAchievement","scheduleStatus","riskLevel","progressDescription","obstacles","evaluationNotes",
 "documentRegister","meetingMinutes","meetingActions",
 "headOfDepartmentOrder","headOfDepartmentBy","headOfDepartmentAt","deputyOrder","deputyBy","deputyAt","calendarTitle","calendarStart","calendarEnd","calendarReminder","calendarDescription"
];
const initialCoreFieldTypes=Object.fromEntries(fieldIds.map(id=>{const el=$(id);return [id,!el?"text":el.tagName==="TEXTAREA"?"textarea":el.tagName==="SELECT"?"select":el.type||"text"];}));
function readControl(el,type){if(!el)return null;if(type==="checkbox")return !!el.checked;if(type==="yesno")return el.value===""?null:el.value==="true";if(type==="checklist")return [...el.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);if(type==="number")return el.value===""?null:Number(el.value);return typeof el.value==="string"?el.value.trim():null;}
function writeControl(el,value,type){if(!el||value===undefined||value===null)return;if(type==="checkbox"){el.checked=value===true||["true","1","yes","بله","checked"].includes(String(value).toLowerCase());return;}if(type==="yesno"){el.value=value===true||["true","1","yes","بله"].includes(String(value).toLowerCase())?"true":value===false||["false","0","no","خیر"].includes(String(value).toLowerCase())?"false":"";return;}if(type==="checklist"){const values=Array.isArray(value)?value:[String(value)];el.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=values.includes(x.value));return;}if(type==="date"&&String(value).includes("T"))el.value=String(value).slice(0,10);else if(type==="datetime-local"&&/^\d{4}-\d{2}-\d{2}$/.test(String(value)))el.value=String(value)+"T00:00";else el.value=Array.isArray(value)?value.join("، "):typeof value==="boolean"?(value?"بله":"خیر"):String(value);}
const readField=id=>readControl($(id),schema?.coreFields?.[id]?.type||fieldControlType($(id)));
const writeField=(id,value)=>writeControl($(id),value,schema?.coreFields?.[id]?.type||fieldControlType($(id)));
const selectedRadio = name => document.querySelector('input[name="'+name+'"]:checked')?.value || "";
const setRadio = (name,value) => { const el=document.querySelector('input[name="'+name+'"][value="'+value+'"]');if(el)el.checked=true; };
const dateNow = () => {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const localDateTimeNow=()=>{const d=new Date();return dateNow()+"T"+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
const toFa = value => Number(value||0).toLocaleString("fa-IR");
const safe = value => String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function makeCode(){const d=new Date(),stamp=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("");return "M7-"+stamp+"-"+(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)).slice(0,8).toUpperCase();}
function statusLabel(status){return ({draft:"پیش‌نویس",registered:"برنامه‌ریزی قبل از اجرا",referred:"ارجاع‌شده / در انتظار شروع","in-progress":"در حال اجرا",blocked:"متوقف / دارای مانع",review:"در انتظار بررسی",revision:"نیازمند اصلاح",completed:"اتمام و پایان کار",closed:"مختومه",cancelled:"لغوشده"})[status]||"برنامه‌ریزی قبل از اجرا";}
function missionPhase(status){return status==="in-progress"?"active":["completed","closed"].includes(status)?"completed":["draft","cancelled"].includes(status)?"other":"planned";}
function updateMissionStatusIndicator(){const host=$("missionStatusIndicator");if(!host)return;const status=$("executionStatus")?.value||"registered";const phase=missionPhase(status);const icons={planned:"🗓️",active:"🔄",completed:"✅",other:"📄"};host.dataset.phase=phase;host.querySelector(".status-icon").textContent=icons[phase]||"🗓️";host.querySelector(".status-text").textContent=statusLabel(status);}
function defaultConfig(){return structuredClone(baseSchema);}

function prepareWorkflowSchema(){
 const sectionNames={"general":"اطلاعات عمومی","origin":"مبدأ درخواست","deputy":"دستور معاونت","routing":"دسته‌بندی و ارجاع","action":"گزارش اقدام اداره","response":"پاسخ‌گویی و ابلاغ","evaluation":"چک‌لیست ارزیابی","knowledge":"دانش و تجربه‌نگاری","costs":"هزینه‌ها و منابع","rewards":"تشویقات و تنبیهات","paraphs":"پاراف‌ها و نظرات مدیریتی"};
 const fieldSections={"communicationType":"general","requestNumber":"general","requestDate":"general","requestChannel":"general","missionTitle":"general","missionSubject":"general","expectedPurpose":"general","priority":"general","confidentiality":"general","requesterType":"origin","requesterName":"origin","requesterPerson":"origin","requesterContact":"origin","executorDepartment":"routing","executorSubunit":"routing","directOwner":"routing","assignedExpert":"routing","missionType":"routing","workNature":"routing","routingNote":"routing","receivedAt":"deputy","deliveredToDeputyAt":"deputy","deputyApproval":"deputy","deputyReferralDepartment":"deputy","deputyReferralPerson":"deputy","deputyReferralAt":"deputy","coordinationAt":"action","calendarTitle":"deputy","calendarStart":"deputy","calendarEnd":"deputy","calendarReminder":"deputy","calendarDescription":"deputy","referredAt":"routing","plannedStart":"action","actualStart":"action","plannedEnd":"action","actualEnd":"action","locationScope":"action","workSchedule":"action","continuityType":"action","reportFrequency":"action","durationEstimate":"action","missionDaysRequested":"action","missionDaysApproved":"action","missionDaysCompleted":"action","milestones":"action","teamLead":"action","supervisor":"action","teamMembers":"action","externalParticipants":"action","responsibilityMatrix":"action","progress":"action","executionStatus":"action","scheduleStatus":"action","riskLevel":"action","progressDescription":"action","obstacles":"action","deliverableType":"response","deliveryDate":"response","expectedDeliverables":"response","actualResults":"response","handoverTo":"response","handoverNotes":"response","qualityScore":"evaluation","goalAchievement":"evaluation","evaluationNotes":"evaluation","previousMissionCode":"knowledge","previousMissionTitle":"knowledge","previousPeriod":"knowledge","previousNotes":"knowledge","documentRegister":"knowledge","meetingMinutes":"knowledge","meetingActions":"knowledge","costStatus":"costs","costCurrency":"costs","estimatedCost":"costs","approvedBudget":"costs","actualCost":"costs","costCenter":"costs","costBreakdown":"costs","financialNotes":"costs","headOfDepartmentOrder":"paraphs","headOfDepartmentBy":"paraphs","headOfDepartmentAt":"paraphs","deputyOrder":"paraphs","deputyBy":"paraphs","deputyAt":"paraphs"};
 const defaults=[{"id":"referralIssuedAt","label":"تاریخ و ساعت صدور ارجاع","type":"datetime-local","required":false,"section":"routing","order":1,"active":true},{"id":"referralDeliveredAt","label":"تاریخ و ساعت تحویل به اداره","type":"datetime-local","required":false,"section":"routing","order":2,"active":true},{"id":"referralReceivedAt","label":"تاریخ و ساعت تأیید دریافت توسط اداره","type":"datetime-local","required":false,"section":"routing","order":3,"active":true},{"id":"referralReceiptBy","label":"تأییدکننده دریافت ارجاع","type":"text","required":false,"section":"routing","order":4,"active":true},{"id":"referralScope","label":"شرح دقیق مأموریت و خروجی مورد انتظار اداره","type":"textarea","required":false,"section":"routing","order":5,"active":true,"full":true},{"id":"deputyReview","label":"نظر و جمع‌بندی معاون","type":"textarea","required":false,"section":"deputy","order":1,"active":true,"full":true},{"id":"deputyDecision","label":"تصمیم معاون","type":"select","options":["تأیید و صدور دستور","رد درخواست","عودت برای تکمیل اطلاعات","ارجاع برای بررسی کارشناسی","توقف تا تصمیم بعدی"],"required":false,"section":"deputy","order":2,"active":true},{"id":"deputyDeadline","label":"مهلت موردنظر معاون","type":"date","required":false,"section":"deputy","order":3,"active":true},{"id":"deputyConstraints","label":"ملاحظات و محدودیت‌های دستور","type":"textarea","required":false,"section":"deputy","order":4,"active":true,"full":true},{"id":"actionLog","label":"گزارش اقدامات انجام‌شده به تفکیک تاریخ","type":"textarea","required":false,"section":"action","order":1,"active":true,"full":true},{"id":"actionProgressUpdatedAt","label":"آخرین زمان به‌روزرسانی پیشرفت","type":"datetime-local","required":false,"section":"action","order":2,"active":true},{"id":"actionStartActual","label":"تاریخ شروع واقعی عملیات","type":"date","required":false,"section":"action","order":3,"active":true},{"id":"actionFinishActual","label":"تاریخ پایان واقعی عملیات","type":"date","required":false,"section":"action","order":4,"active":true},{"id":"actionExtensionReason","label":"علت درخواست تمدید مهلت","type":"textarea","required":false,"section":"action","order":5,"active":true,"full":true},{"id":"responseStatus","label":"وضعیت پاسخ‌گویی","type":"select","options":["تهیه‌نشده","در حال تهیه","در انتظار تأیید معاونت","آماده ابلاغ","ابلاغ‌شده","وصول پاسخ تأیید شده","نیازمند پیگیری"],"required":false,"section":"response","order":1,"active":true},{"id":"responseNumber","label":"شماره نامه یا شناسه پاسخ","type":"text","required":false,"section":"response","order":2,"active":true},{"id":"responsePreparedAt","label":"تاریخ تهیه پاسخ","type":"date","required":false,"section":"response","order":3,"active":true},{"id":"responseSentAt","label":"تاریخ ابلاغ به مرجع درخواست‌کننده","type":"date","required":false,"section":"response","order":4,"active":true},{"id":"responseMethod","label":"روش ابلاغ / اطلاع‌رسانی","type":"select","options":["نامه رسمی","سامانه مکاتبات","پست الکترونیکی","تماس یا اطلاع شفاهی","جلسه","سایر"],"required":false,"section":"response","order":5,"active":true},{"id":"responseReceipt","label":"وصول پاسخ توسط درخواست‌کننده تأیید شده است؟","type":"yesno","required":false,"section":"response","order":6,"active":true},{"id":"evaluationChecklist","label":"چک‌لیست کنترل کیفیت و انطباق","type":"checklist","options":["تحقق هدف مأموریت","انطباق با دستور معاونت","رعایت زمان‌بندی","کیفیت اجرای کار","کفایت مستندات","هماهنگی بین واحدها","رعایت ضوابط و مقررات","رضایت درخواست‌کننده"],"required":false,"section":"evaluation","order":1,"active":true,"full":true},{"id":"evaluationBy","label":"ارزیابی‌کننده","type":"text","required":false,"section":"evaluation","order":2,"active":true},{"id":"evaluationAt","label":"تاریخ ارزیابی","type":"date","required":false,"section":"evaluation","order":3,"active":true},{"id":"lessonLearned","label":"درس‌آموخته‌ها و تجربه‌های مأموریت","type":"textarea","required":false,"section":"knowledge","order":1,"active":true,"full":true},{"id":"knowledgeReusable","label":"قابلیت استفاده مجدد از این تجربه","type":"yesno","required":false,"section":"knowledge","order":2,"active":true},{"id":"knowledgeRecommendation","label":"پیشنهاد برای مأموریت‌های مشابه","type":"textarea","required":false,"section":"knowledge","order":3,"active":true,"full":true},{"id":"knowledgeReviewedBy","label":"تأییدکننده ثبت دانش","type":"text","required":false,"section":"knowledge","order":4,"active":true},{"id":"financialDocumentStatus","label":"وضعیت اسناد و مدارک هزینه","type":"select","options":["بدون سند هزینه","در انتظار دریافت اسناد","اسناد تکمیل‌شده","در انتظار تأیید مالی","تأیید نهایی مالی"],"required":false,"section":"costs","order":8,"active":true},{"id":"incentiveType","label":"نوع اقدام تشویقی","type":"select","options":["تقدیر کتبی","تشویق مالی","امتیاز عملکردی","معرفی برای تقدیر بالاتر","سایر"],"required":false,"section":"rewards","order":1,"active":true},{"id":"incentivePerson","label":"فرد یا واحد پیشنهادشده برای تشویق","type":"text","required":false,"section":"rewards","order":2,"active":true},{"id":"incentiveReason","label":"علت و مستندات پیشنهاد تشویق","type":"textarea","required":false,"section":"rewards","order":3,"active":true,"full":true},{"id":"incentiveDecision","label":"وضعیت تصمیم تشویقی","type":"select","options":["ثبت پیشنهاد","در حال بررسی","تصویب‌شده","ردشده","اجراشده"],"required":false,"section":"rewards","order":4,"active":true},{"id":"disciplinaryType","label":"نوع مورد قابل رسیدگی","type":"select","options":["بدون مورد","تذکر اصلاحی","قصور احتمالی","تخلف احتمالی","عدم رعایت زمان‌بندی","سایر"],"required":false,"section":"rewards","order":5,"active":true},{"id":"disciplinaryPerson","label":"فرد یا واحد مرتبط با موضوع","type":"text","required":false,"section":"rewards","order":6,"active":true},{"id":"disciplinaryDescription","label":"شرح موضوع، مستندات و توضیحات","type":"textarea","required":false,"section":"rewards","order":7,"active":true,"full":true},{"id":"disciplinaryDecision","label":"نتیجه رسیدگی مرجع مجاز","type":"select","options":["در انتظار بررسی","مختومه بدون اقدام","تذکر ثبت‌شده","اقدام مصوب","ارجاع به مرجع ذی‌صلاح"],"required":false,"section":"rewards","order":8,"active":true},{"id":"rewardApprovedBy","label":"مرجع تصویب یا رسیدگی","type":"text","required":false,"section":"rewards","order":9,"active":true},{"id":"rewardDecisionAt","label":"تاریخ تصمیم","type":"date","required":false,"section":"rewards","order":10,"active":true},{"id":"departmentParaphLog","label":"فهرست پاراف‌ها و نظرات مدیر اداره","type":"textarea","required":false,"section":"paraphs","order":7,"active":true,"full":true},{"id":"deputyParaphLog","label":"فهرست پاراف‌ها و نظرات معاون","type":"textarea","required":false,"section":"paraphs","order":8,"active":true,"full":true}];
 const currentVersion=Number(schema?.version||1);
 if(currentVersion<19){
  schema.coreFields=schema.coreFields||{};
  for(const [id,section] of Object.entries(fieldSections)){
   const meta=schema.coreFields[id]||fieldMeta(id,$(id)?.closest('.field'));
   meta.section=section;meta.order=meta.order||1;meta.active=meta.active!==false;schema.coreFields[id]=meta;
  const generalOrder={"communicationType":1,"requestNumber":2,"requestDate":3,"requestChannel":4,"missionTitle":5,"missionSubject":6,"expectedPurpose":7,"priority":8,"confidentiality":9};
  if(Object.prototype.hasOwnProperty.call(generalOrder,id)){meta.section="general";meta.order=generalOrder[id];}
  const generalLabels={"communicationType":"نوع اعلام / مکاتبه","requestNumber":"شماره درخواست / نامه","requestDate":"تاریخ دریافت به معاونت","requestChannel":"نحوه وصول","missionTitle":"نام و عنوان مأموریت","missionSubject":"شرح موضوع، ضرورت و مسئله اصلی","expectedPurpose":"هدف و نتیجه مورد انتظار","priority":"اولویت","confidentiality":"سطح دسترسی"};
  if(generalLabels[id])meta.label=generalLabels[id];
  if(id==="confidentiality")meta.required=true;
  if(["communicationType","requestNumber","requestDate","requestChannel","missionTitle","missionSubject","expectedPurpose","priority","confidentiality"].includes(id))meta.options=fieldOptions($(id));
  }
  schema.extraFields=Array.isArray(schema.extraFields)?schema.extraFields:[];
  const existing=new Set(schema.extraFields.map(x=>x.id));
  defaults.forEach(field=>{if(!existing.has(field.id))schema.extraFields.push(field);});
  schema.sectionLabels={...sectionNames};
  const legacyExtraSections={general:"general",routing:"routing",schedule:"action",history:"knowledge",costs:"costs",people:"action",outputs:"response",evaluation:"evaluation",documents:"knowledge",approvals:"paraphs"};
  schema.extraFields.forEach(field=>{if(legacyExtraSections[field.section])field.section=legacyExtraSections[field.section];});
  schema.version=20;
 }else{
  schema.sectionLabels={...sectionNames,...(schema.sectionLabels||{})};
  schema.extraFields=Array.isArray(schema.extraFields)?schema.extraFields:[];
 }
}
async function loadSchema(){const saved=await MissionStore.config();schema=saved?{...defaultConfig(),...saved,coreFields:{...(saved.coreFields||{})},extraFields:Array.isArray(saved.extraFields)?saved.extraFields:[],options:{...baseSchema.options,...(saved.options||{})}}:defaultConfig();prepareWorkflowSchema();$("schemaJson").value=JSON.stringify(schema,null,2);applySchemaOptions();applyCoreFields();renderDepartmentFields();renderExtraFields();decorateFormFields();sortMissionFields();applyFieldConditions();}
function applySchemaOptions(){const fixedNativeOptions=new Set(["communicationType","requestChannel","priority","confidentiality","deputyApproval","deputyReferralDepartment","locationScope","workSchedule","continuityType"]);for(const [id,values] of Object.entries(schema?.options||{})){if(fixedNativeOptions.has(id))continue;const select=$(id);if(!select||select.tagName!=="SELECT"||!Array.isArray(values))continue;const current=select.value;const keepBlank=id==="communicationType";select.replaceChildren();if(keepBlank){const empty=document.createElement("option");empty.value="";empty.textContent="انتخاب کنید";select.append(empty);}for(const item of values){const option=document.createElement("option");const parts=String(item).split("|");option.value=parts.length>1?parts[0]:item;option.textContent=parts.length>1?parts.slice(1).join("|"):item;select.append(option);}if([...select.options].some(o=>o.value===current))select.value=current;}const deptSelect=$("executorDepartment"),selected=deptSelect.value;deptSelect.replaceChildren();const blank=document.createElement("option");blank.value="";blank.textContent="انتخاب اداره";deptSelect.append(blank);for(const d of schema?.departments||[]){departmentNames[String(d.id)]=d.name;const option=document.createElement("option");option.value=String(d.id);option.textContent=d.name;deptSelect.append(option);}if([...deptSelect.options].some(o=>o.value===selected))deptSelect.value=selected;}
function renderDepartmentFields(){
 const host=$("departmentFields"),dept=$("executorDepartment").value,priorDept=host.dataset.activeDepartment;
 if(priorDept)departmentDraftValues[priorDept]={...(departmentDraftValues[priorDept]||{}),...readCustom()};
 host.querySelectorAll(".generated-field").forEach(x=>x.remove());host.dataset.activeDepartment=dept;
 const definition=(schema?.departments||[]).find(x=>String(x.id)===String(dept));
 const heading=host.querySelector("h3");
 heading.textContent=definition?.name ? "اطلاعات اختصاصی · "+definition.name : "اطلاعات اختصاصی اداره انتخاب‌شده";
 if(!definition?.fields?.length){const p=document.createElement("p");p.className="hint generated-field";p.textContent="برای این واحد هنوز فیلد اختصاصی تعریف نشده است.";host.append(p);return;}
 for(const field of definition.fields.filter(item=>item.active!==false).sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999))){
  const wrap=document.createElement("div");wrap.className="field generated-field";
  const label=document.createElement("label");label.htmlFor="custom_"+field.id;label.textContent=field.label+(field.unit?" ("+field.unit+")":"")+(field.required?" *":"");
  const input=buildFieldControl(field,"custom_"+field.id,departmentDraftValues[dept]?.[field.id]??currentMission?.departmentFields?.[field.id]??"");
  input.dataset.customId=field.id;input.dataset.customType=field.type;input.classList.add("custom-field-control");wrap.append(label,input);applyConditionToWrap(wrap,field.condition);
  addInlineFieldEditor(label,()=>openFieldEditor({kind:"dept",id:field.id,departmentId:dept}));host.append(wrap);
 }
}

function fieldControlType(el){if(!el)return "text";if(el.dataset?.fieldType)return el.dataset.fieldType;if(el.dataset?.jalaliOriginalType)return el.dataset.jalaliOriginalType;if(el.tagName==="TEXTAREA")return "textarea";if(el.tagName==="SELECT")return "select";return ["number","date","datetime-local","checkbox"].includes(el.type)?el.type:"text";}
function buildFieldControl(meta,id,value=""){
 const type=meta.type||"text";let el;
 if(type==="textarea"){el=document.createElement("textarea");el.rows=3;}
 else if(type==="select"||type==="yesno"){el=document.createElement("select");const empty=document.createElement("option");empty.value="";empty.textContent="انتخاب کنید";el.append(empty);const opts=type==="yesno"?[{value:"true",label:"بله"},{value:"false",label:"خیر"}]:(meta.options||[]).map(v=>({value:String(v),label:String(v)}));opts.forEach(x=>{const o=document.createElement("option");o.value=x.value;o.textContent=x.label;el.append(o);});}
 else if(type==="checklist"){el=document.createElement("div");el.className="field-checklist";(meta.options||[]).forEach(v=>{const l=document.createElement("label"),c=document.createElement("input"),s=document.createElement("span");c.type="checkbox";c.value=String(v);s.textContent=String(v);l.append(c,s);el.append(l);});}
 else{el=document.createElement("input");el.type=type==="checkbox"?"checkbox":type;}
 el.id=id;el.dataset.fieldType=type;el.required=!!meta.required;el.placeholder=meta.placeholder||"";
 
 if(type==="checklist"&&Array.isArray(value))el.querySelectorAll('input[type="checkbox"]').forEach(c=>c.checked=value.includes(c.value));else writeControl(el,value,type);return el;
}
function applyConditionToWrap(wrap,condition){if(condition?.fieldKey){wrap.dataset.conditionField=condition.fieldKey;wrap.dataset.conditionOperator=condition.operator||"equals";wrap.dataset.conditionValue=condition.value??"";}else{delete wrap.dataset.conditionField;delete wrap.dataset.conditionOperator;delete wrap.dataset.conditionValue;}}
function fieldDefinitions(){const defs=[];document.querySelectorAll("#missionForm .field label[for]").forEach(l=>{const id=l.htmlFor;if($(id)&&$(id).type!=="file")defs.push({key:"core:"+id,label:fieldMeta(id,l.closest(".field")).label});});const dept=String($("executorDepartment")?.value||"");(schema?.departments||[]).filter(d=>String(d.id)===dept).forEach(d=>(d.fields||[]).filter(f=>f.active!==false).forEach(f=>defs.push({key:"dept:"+dept+":"+f.id,label:f.label})));(schema?.extraFields||[]).filter(f=>f.active!==false).forEach(f=>defs.push({key:"extra:"+f.id,label:f.label}));return defs;}
function valueForFieldKey(key){const p=String(key||"").split(":");if(p[0]==="core")return readField(p[1]);if(p[0]==="extra")return readExtraFields()[p[1]];if(p[0]==="dept")return readCustom()[p[2]];return null;}

function conditionOptionsFor(key){
 const p=String(key||"").split(":");let field;
 if(p[0]==="core"){const id=p[1];field=schema.coreFields?.[id]||{type:initialCoreFieldTypes[id],options:fieldOptions($(id))};}
 else if(p[0]==="extra")field=(schema.extraFields||[]).find(f=>f.id===p[1]);
 else if(p[0]==="dept")field=(schema.departments||[]).find(d=>String(d.id)===p[1])?.fields?.find(f=>f.id===p[2]);
 if(!field)return [];
 if(["checkbox","yesno"].includes(field.type))return [{value:"true",label:"بله"},{value:"false",label:"خیر"}];
 return (field.options||[]).map(v=>({value:String(v),label:String(v)}));
}
function refreshConditionSuggestions(){
 const list=$("fieldEditorConditionSuggestions");if(!list)return;list.replaceChildren();
 conditionOptionsFor($("fieldEditorConditionField").value).forEach(x=>{const o=document.createElement("option");o.value=x.value;o.label=x.label;list.append(o);});
 const type=String($("fieldEditorConditionField").value).split(":")[0];
 $("fieldEditorConditionValue").placeholder=type==="core"?"مقدار دقیق؛ برای بله/خیر true یا false":"مقدار دقیق گزینه انتخابی";
}
function applyFieldConditions(){document.querySelectorAll("#missionForm .field[data-condition-field]").forEach(w=>{const a=valueForFieldKey(w.dataset.conditionField),v=w.dataset.conditionValue||"",op=w.dataset.conditionOperator||"equals";let show=true;if(op==="not-empty")show=a!==null&&a!==undefined&&a!==""&&a!==false&&(!Array.isArray(a)||a.length>0);else if(op==="equals")show=Array.isArray(a)?a.includes(v):String(a??"")===v;else if(op==="not-equals")show=Array.isArray(a)?!a.includes(v):String(a??"")!==v;w.hidden=!show;w.querySelectorAll("input,select,textarea").forEach(e=>{if(e.dataset.conditionRequired===undefined)e.dataset.conditionRequired=String(e.required);e.required=show&&e.dataset.conditionRequired==="true";});});}
function fieldOptions(el){return el&&el.tagName==="SELECT"?[...el.options].filter(o=>o.value!=="").map(o=>o.textContent):[];}
function fieldMeta(id,wrap){
 const label=wrap?.querySelector("label[for]"),control=$(id);
 const old=schema.coreFields?.[id]||{};
 return {...old,id,label:old.label||label?.textContent?.replace(/\*/g,"").trim()||id,type:old.type||fieldControlType(control),required:old.required??!!control?.required,placeholder:old.placeholder??control?.placeholder??"",options:old.options||fieldOptions(control),section:old.section||wrap?.closest(".mission-section")?.dataset.section||"general",order:old.order??[...(wrap?.parentElement?.children||[])].indexOf(wrap)+1,active:old.active!==false};
}
function applyCoreFields(){
 document.querySelectorAll("#missionForm .field label[for]").forEach(label=>{
  const id=label.htmlFor,wrap=label.closest(".field"),el=$(id);if(!wrap||wrap.classList.contains("extra-field")||wrap.classList.contains("generated-field")||!el||el.type==="file")return;
  const meta=fieldMeta(id,wrap),oldValue=readControl(el,fieldControlType(el));wrap.hidden=meta.active===false;wrap.dataset.fieldOrder=String(meta.order||9999);label.textContent=meta.label+(meta.required?" *":"");const next=buildFieldControl(meta,id,oldValue);next.name=el.name||id;if(el.parentElement?.classList.contains("jalali-picker"))el.parentElement.replaceWith(next);else el.replaceWith(next);const target=document.querySelector('.mission-section[data-section="'+CSS.escape(meta.section||"general")+'"] .form-grid');if(target&&wrap.parentElement!==target)target.append(wrap);applyConditionToWrap(wrap,meta.condition);
 });
}
function sortMissionFields(){document.querySelectorAll("#missionForm .mission-section .form-grid").forEach(grid=>{const fields=[...grid.children].filter(el=>el.classList.contains("field")&&el.dataset.fieldOrder);fields.sort((a,b)=>(Number(a.dataset.fieldOrder)||9999)-(Number(b.dataset.fieldOrder)||9999));fields.forEach(el=>grid.append(el));});}
function pencilIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';}
function addInlineFieldEditor(label,onClick){
 const edit=document.createElement("button");edit.type="button";edit.className="field-edit-btn";edit.innerHTML=pencilIcon();edit.setAttribute("aria-label","ویرایش عنوان و مشخصات فیلد");edit.title="ویرایش";edit.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();onClick();});label.append(edit);
}
function decorateFormFields(){
 document.querySelectorAll("#missionForm .field").forEach(wrap=>{
  const label=wrap.querySelector(":scope > label[for]");if(!label||label.querySelector(".field-edit-btn"))return;
  const id=label.htmlFor;if(!$(id)||$(id).type==="file")return;
  addInlineFieldEditor(label,()=>openFieldEditor({kind:"core",id,wrap}));
 });
 document.querySelectorAll("#missionForm .mission-section").forEach(section=>{
  const head=section.querySelector(".section-head");if(!head||head.querySelector(".section-add-btn"))return;
  const title=head.querySelector("h2");
  if(title&&!title.querySelector(".section-title-edit"))addSectionTitleEditor(title,section.dataset.section);
  const btn=document.createElement("button");btn.type="button";btn.className="section-add-btn";btn.textContent="＋ افزودن فیلد";
  btn.addEventListener("click",()=>openFieldEditor({kind:"new",section:section.dataset.section}));head.append(btn);
 });
 sortMissionFields();applySectionLabels();
}
function addSectionTitleEditor(title,key){
 const edit=document.createElement("span");edit.className="section-title-edit";edit.setAttribute("role","button");edit.setAttribute("tabindex","0");edit.setAttribute("aria-label","ویرایش عنوان بخش");edit.title="ویرایش عنوان";
 edit.innerHTML=pencilIcon();
 const run=()=>renameSection(key);
 edit.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();run();});
 edit.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();run();}});
 title.append(edit);
}
async function renameSection(key){
 if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"})){alert("دسترسی ویرایش ساختار فرم برای این حساب فعال نیست.");return;}
 const current=(schema.sectionLabels||{})[key]||document.querySelector('.mission-section[data-section="'+CSS.escape(key)+'"] .section-head h2')?.childNodes[0]?.textContent?.trim()||"";
 const value=window.prompt("عنوان جدید بخش را وارد کنید:",current);
 if(value===null)return;
 const label=value.trim();if(!label){alert("عنوان بخش نمی‌تواند خالی باشد.");return;}
 schema.sectionLabels=schema.sectionLabels||{};schema.sectionLabels[key]=label;
 try{await persistFieldSchema();applySectionLabels();}catch(error){alert(error.message);}
}
function applySectionLabels(){
 if(!schema)return;
 document.querySelectorAll("#missionForm .mission-section").forEach(section=>{
  const key=section.dataset.section,label=(schema.sectionLabels||{})[key];
  const title=section.querySelector(".section-head h2");
  if(title){
   const edit=title.querySelector(".section-title-edit");
   const original=[...title.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(" ");
   title.textContent=label||original;
   if(edit)title.append(edit);
  }
  const tab=document.querySelector('.mission-tab[data-tab="'+CSS.escape(key)+'"]');
  if(tab){
   let span=tab.querySelector(".mission-tab-label");
   const original=[...tab.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(" ");
   if(!span){span=document.createElement("span");span.className="mission-tab-label";tab.append(span);}
   if(original)[...tab.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());
   span.textContent=label||span.textContent||original;
   if(!tab.querySelector(".section-title-edit")){
    const edit=document.createElement("span");edit.className="section-title-edit";edit.setAttribute("role","button");edit.setAttribute("tabindex","0");edit.setAttribute("aria-label","ویرایش عنوان بخش");edit.title="ویرایش عنوان";edit.innerHTML=pencilIcon();
    const run=()=>renameSection(key);
    edit.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();run();});
    edit.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();event.stopPropagation();run();}});
    tab.append(edit);
   }
  }
 });
}
function renderExtraFields(values){document.querySelectorAll(".extra-field").forEach(el=>el.remove());const savedValues=values||currentMission?.extraFields||{};
 (schema.extraFields||[]).filter(f=>f.active!==false).sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999)).forEach(field=>{const section=document.querySelector('.mission-section[data-section="'+CSS.escape(field.section||"general")+'"] .form-grid');if(!section)return;const wrap=document.createElement("div");wrap.className="field extra-field"+(field.full?" full":"");wrap.dataset.fieldOrder=String(field.order||9999);const label=document.createElement("label");label.htmlFor="extra_"+field.id;label.textContent=field.label+(field.required?" *":"");const el=buildFieldControl(field,"extra_"+field.id,savedValues[field.id]??"");el.dataset.extraFieldId=field.id;el.dataset.extraFieldControl="true";wrap.append(label,el);applyConditionToWrap(wrap,field.condition);addInlineFieldEditor(label,()=>openFieldEditor({kind:"extra",id:field.id,section:field.section}));section.append(wrap);});applyFieldConditions();}
function readExtraFields(){const out={...(currentMission?.extraFields||{})};document.querySelectorAll("[data-extra-field-id]").forEach(el=>out[el.dataset.extraFieldId]=readControl(el,el.dataset.fieldType||"text"));return out;}
let editingField=null;
function openFieldEditor(target){
 editingField=target;let meta;
 if(target.kind==="core"){const wrap=target.wrap||$(target.id)?.closest(".field");meta=fieldMeta(target.id,wrap);}
 else if(target.kind==="extra"){meta=(schema.extraFields||[]).find(f=>f.id===target.id)||{};}
 else if(target.kind==="dept"){const fields=schema.departments.find(d=>String(d.id)===String(target.departmentId))?.fields||[],index=fields.findIndex(f=>f.id===target.id);meta={...(fields[index]||{}),section:"routing",order:(fields[index]||{}).order??index+1};}
 else meta={label:"",type:"text",required:false,placeholder:"",options:[],section:target.section};
 $("fieldEditorHeading").textContent=target.kind==="new"?"افزودن فیلد جدید":"ویرایش فیلد";
 const destination=$("fieldEditorDestination");if(destination){destination.value=meta.section||target.section||"general";if(![...destination.options].some(o=>o.value===destination.value))destination.value="general";}
 $("fieldEditorOrder").value=String(meta.order||1);
 $("fieldEditorLabel").value=meta.label||"";$("fieldEditorType").value=meta.type||"text";$("fieldEditorPlaceholder").value=meta.placeholder||"";
 $("fieldEditorOptions").value=(meta.options||[]).join("\n");$("fieldEditorRequired").checked=!!meta.required;
 $("fieldEditorOptionsWrap").hidden=!["select","checklist"].includes(meta.type||"text");$("fieldEditorDelete").hidden=target.kind==="new";$("fieldEditorCopy").hidden=target.kind==="new";
  const defs=fieldDefinitions().filter(x=>x.key!==(target.kind==="core"?"core:"+target.id:target.kind==="extra"?"extra:"+target.id:target.kind==="dept"?"dept:"+target.departmentId+":"+target.id:""));
  $("fieldEditorConditionField").replaceChildren();const none=document.createElement("option");none.value="";none.textContent="بدون شرط";$("fieldEditorConditionField").append(none);defs.forEach(x=>{const o=document.createElement("option");o.value=x.key;o.textContent=x.label;$("fieldEditorConditionField").append(o);});
  const cond=meta.condition||{};$("fieldEditorConditionEnabled").checked=!!cond.fieldKey;$("fieldEditorConditionField").value=cond.fieldKey||"";$("fieldEditorConditionOperator").value=cond.operator||"equals";$("fieldEditorConditionValue").value=cond.value??"";$("fieldEditorConditionFields").hidden=!cond.fieldKey;refreshConditionSuggestions();
 $("fieldEditorStatus").textContent="";$("fieldEditor").hidden=false;$("fieldEditor").scrollIntoView({behavior:"smooth",block:"center"});
}
$("fieldEditorType").addEventListener("change",()=>{$("fieldEditorOptionsWrap").hidden=!["select","checklist"].includes($("fieldEditorType").value);});
$("fieldEditorConditionEnabled").addEventListener("change",()=>{$("fieldEditorConditionFields").hidden=!$("fieldEditorConditionEnabled").checked;});
$("fieldEditorConditionField").addEventListener("change",refreshConditionSuggestions);
$("fieldEditorCancel").addEventListener("click",()=>{$("fieldEditor").hidden=true;editingField=null;});
async function persistFieldSchema(){
 if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"}))throw new Error("برای تغییر ساختار فرم، دسترسی مدیریت ساختار لازم است.");
 schema=await MissionStore.saveConfig(schema);$("schemaJson").value=JSON.stringify(schema,null,2);
}
$("fieldEditorSave").addEventListener("click",async()=>{
 try{
  if(!editingField)throw new Error("فیلدی انتخاب نشده است.");
  const label=$("fieldEditorLabel").value.trim(),type=$("fieldEditorType").value,required=$("fieldEditorRequired").checked,placeholder=$("fieldEditorPlaceholder").value.trim(),options=$("fieldEditorOptions").value.split("\n").map(x=>x.trim()).filter(Boolean);
  if(!label)throw new Error("عنوان فیلد را وارد کنید.");if(type==="select"&&!options.length)throw new Error("برای فهرست انتخابی حداقل یک گزینه وارد کنید.");
  const condition=$("fieldEditorConditionEnabled").checked?{fieldKey:$("fieldEditorConditionField").value,operator:$("fieldEditorConditionOperator").value,value:$("fieldEditorConditionValue").value.trim()}:null;
   if(condition&&!condition.fieldKey)throw new Error("فیلد مرجع شرط را انتخاب کنید.");if(condition&&condition.operator!=="not-empty"&&!condition.value)throw new Error("مقدار شرط را وارد کنید.");
   const section=$("fieldEditorDestination").value||editingField.section||"general",order=Math.max(1,Number($("fieldEditorOrder").value||1));
  const meta={label,type,required,placeholder,options,condition,section,order,active:true};
  const extraValues=readExtraFields(),departmentValues=readCustom();
  if(editingField.kind==="core"){schema.coreFields=schema.coreFields||{};schema.coreFields[editingField.id]={...fieldMeta(editingField.id,editingField.wrap),...meta};}
  else if(editingField.kind==="extra"){const f=schema.extraFields.find(x=>x.id===editingField.id);Object.assign(f,meta);}
  else if(editingField.kind==="dept"){
   const sourceDept=schema.departments.find(d=>String(d.id)===String(editingField.departmentId)),fields=sourceDept?.fields||[],f=fields.find(x=>x.id===editingField.id);
   if(section==="routing"){Object.assign(f,meta);}
   else{const id="f_"+(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)).replace(/-/g,"").slice(0,12);schema.extraFields=schema.extraFields||[];schema.extraFields.push({id,section,...meta,full:false});extraValues[id]=departmentValues[editingField.id]??"";sourceDept.fields=fields.filter(x=>x.id!==editingField.id);}
  }
  else{schema.extraFields=schema.extraFields||[];const id="f_"+(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)).replace(/-/g,"").slice(0,12);schema.extraFields.push({id,section,...meta,full:false});}
  await persistFieldSchema();applyCoreFields();renderDepartmentFields();writeCustom(departmentValues);renderExtraFields(extraValues);decorateFormFields();applyFieldConditions();$("fieldEditor").hidden=true;editingField=null;$("fieldEditorStatus").textContent="";$("schemaResult").textContent="تغییر ساختار فرم ذخیره شد.";
 }catch(e){$("fieldEditorStatus").textContent=e.message;}
});
$("fieldEditorCopy").addEventListener("click",async()=>{
 try{
  if(!editingField||editingField.kind==="new")return;
  const extraValues=readExtraFields(),departmentValues=readCustom();let source={};
  if(editingField.kind==="core")source=fieldMeta(editingField.id,editingField.wrap);
  else if(editingField.kind==="extra")source={...(schema.extraFields||[]).find(x=>x.id===editingField.id)};
  else source={...(schema.departments.find(d=>String(d.id)===String(editingField.departmentId))?.fields||[]).find(x=>x.id===editingField.id)};
  const id="f_"+(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)).replace(/-/g,"").slice(0,12),section=$("fieldEditorDestination").value||source.section||"general";
  const clone={...source,id,section,order:Math.max(1,Number($("fieldEditorOrder").value||1))+1,active:true,condition:source.condition?{...source.condition}:null,options:[...(source.options||[])]};
  delete clone.unit;delete clone.departmentId;schema.extraFields=schema.extraFields||[];schema.extraFields.push(clone);
  if(editingField.kind==="core")extraValues[id]=readField(editingField.id);
  else if(editingField.kind==="dept")extraValues[id]=departmentValues[editingField.id]??"";
  await persistFieldSchema();renderExtraFields(extraValues);decorateFormFields();applyFieldConditions();
  $("fieldEditor").hidden=true;editingField=null;$("schemaResult").textContent="یک کپی مستقل از فیلد در تب انتخاب‌شده ساخته شد.";
 }catch(e){$("fieldEditorStatus").textContent=e.message;}
});
$("fieldEditorDelete").addEventListener("click",async()=>{
 try{
  if(!editingField||editingField.kind==="new")return;
  if(!confirm("این فیلد از فرم‌های جدید و ویرایش حذف شود؟ مقدارهای ذخیره‌شده قبلی پاک نمی‌شوند."))return;
  if(editingField.kind==="core"){schema.coreFields=schema.coreFields||{};schema.coreFields[editingField.id]={...fieldMeta(editingField.id,$(editingField.id)?.closest(".field")),active:false};}
  else if(editingField.kind==="extra"){const f=schema.extraFields.find(x=>x.id===editingField.id);if(f)f.active=false;}
  else if(editingField.kind==="dept"){const f=(schema.departments.find(d=>String(d.id)===String(editingField.departmentId))?.fields||[]).find(x=>x.id===editingField.id);if(f)f.active=false;}
  const extraValues=readExtraFields(),departmentValues=readCustom();await persistFieldSchema();applyCoreFields();renderDepartmentFields();writeCustom(departmentValues);renderExtraFields(extraValues);$("fieldEditor").hidden=true;editingField=null;$("schemaResult").textContent="فیلد از فرم پنهان شد؛ داده‌های قبلی حفظ شدند.";
 }catch(e){$("fieldEditorStatus").textContent=e.message;}
});
function addMilestoneRow(item={}){
 const host=$("milestoneRows"),row=document.createElement("div");row.className="milestone-row";
 const make=(type,placeholder,value)=>{const el=document.createElement("input");el.type=type;el.placeholder=placeholder;if(value!==undefined&&value!==null)el.value=value;if(type==="number"){el.min="0";el.max="100";}return el;};
 const title=make("text","عنوان نقطه عطف",item.title||"");
 const due=make("date","موعد",item.due||"");
 const owner=make("text","مسئول / کد پرسنلی",item.owner||"");
 const weight=make("number","وزن",item.weight??1);weight.title="وزن در محاسبه پیشرفت";
 const progress=make("number","درصد",item.progress??0);progress.title="درصد پیشرفت نقطه عطف";
 const status=document.createElement("select");["در انتظار","در حال اجرا","تکمیل‌شده","متوقف"].forEach(label=>{const o=document.createElement("option");o.value=label;o.textContent=label;status.append(o);});status.value=item.status||"در انتظار";
 const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.title="حذف نقطه عطف";remove.addEventListener("click",()=>row.remove());
 row.append(title,due,owner,status,weight,progress,remove);host.append(row);
}
function renderMilestones(rows){
 const host=$("milestoneRows");if(!host)return;host.replaceChildren();
 if(typeof rows==="string"&&rows.trim())rows=rows.split("\n").map(line=>({title:line.split("|")[0].trim()}));
 (Array.isArray(rows)?rows:[]).forEach(item=>addMilestoneRow(item));
}
function readMilestones(){return [...document.querySelectorAll("#milestoneRows .milestone-row")].map(row=>{const inputs=row.querySelectorAll("input");return {title:inputs[0].value.trim(),due:inputs[1].value,owner:inputs[2].value.trim(),status:row.querySelector("select").value,weight:Number(inputs[3].value||1),progress:Math.max(0,Math.min(100,Number(inputs[4].value||0))) };}).filter(item=>item.title);}
function validateDynamicRequired(){const wrappers=[...document.querySelectorAll("#missionForm .field")].filter(w=>!w.hidden);for(const wrap of wrappers){const el=wrap.querySelector("[data-field-type]");if(!el||!el.required)continue;const value=readControl(el,el.dataset.fieldType);const empty=value===null||value===undefined||value===""||(Array.isArray(value)&&!value.length)||(el.dataset.fieldType==="checkbox"&&!value);if(empty){el.scrollIntoView({behavior:"smooth",block:"center"});throw new Error("فیلد الزامی را تکمیل کنید: "+(wrap.querySelector("label")?.textContent||""));}}}
function readCustom(){const out={};document.querySelectorAll("[data-custom-id]").forEach(el=>out[el.dataset.customId]=readControl(el,el.dataset.fieldType||el.dataset.customType||"text"));return out;}
function writeCustom(values){Object.entries(values||{}).forEach(([id,value])=>{const el=document.querySelector('[data-custom-id="'+CSS.escape(id)+'"]');if(el)writeControl(el,value,el.dataset.fieldType||el.dataset.customType||"text");});applyFieldConditions();}
function goStep(index){activeStep=Math.max(0,Math.min(sections.length-1,index));sections.forEach((s,i)=>s.classList.toggle("active",i===activeStep));tabs.forEach((t,i)=>t.setAttribute("aria-selected",String(i===activeStep)));$("prevStep").disabled=activeStep===0;$("nextStep").classList.toggle("hidden",activeStep===sections.length-1);$("saveMission").innerHTML=(editingId?'<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-4px;margin-left:6px;fill:none;stroke:currentColor;stroke-width:1.8"><path d="M4 4h13l3 3v13H4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/></svg>ذخیره تغییرات':'<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" style="vertical-align:-4px;margin-left:6px;fill:none;stroke:currentColor;stroke-width:1.8"><path d="M5 3h12l4 4v14H3V3z"/><path d="M7 3v6h10V3M7 21v-7h10v7"/></svg>ثبت و ذخیره مأموریت');if(document.body.classList.contains("mission-edit-mode"))sections[activeStep].scrollIntoView({block:"start",behavior:"smooth"});else tabs[activeStep].scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});}
function updateProgress(){const value=Math.max(0,Math.min(100,Number($("progress").value||0)));$("progressBar").style.width=value+"%";$("progressText").textContent="پیشرفت ثبت‌شده: "+toFa(value)+"٪ · وضعیت: "+statusLabel($("executionStatus").value);updateMissionStatusIndicator();}
function archiveChangedFieldValues(data){
 if(!currentMission)return;
 const prior=currentMission.schemaHistory?.slice(-1)[0]?.snapshot||currentMission.schemaSnapshot||{},history={...(currentMission.fieldHistory||{})};
 const add=(key,oldType,newType,value)=>{if(oldType&&newType&&oldType!==newType&&value!==undefined&&value!==null){history[key]=[...(history[key]||[]),{type:oldType,schemaVersion:Number(currentMission.schemaVersion||1),value,archivedAt:new Date().toISOString()}];}};
 for(const id of fieldIds){if(!$(id))continue;const oldType=prior.coreFields?.[id]?.type||initialCoreFieldTypes[id],newType=schema.coreFields?.[id]?.type||initialCoreFieldTypes[id];add("core:"+id,oldType,newType,currentMission[id]);}
 for(const oldDept of prior.departments||[]){const nextDept=(schema.departments||[]).find(d=>String(d.id)===String(oldDept.id));for(const oldField of oldDept.fields||[]){const nextField=(nextDept?.fields||[]).find(f=>f.id===oldField.id);if(nextField)add("dept:"+oldDept.id+":"+oldField.id,oldField.type,nextField.type,currentMission.departmentFields?.[oldField.id]);}}
 for(const oldField of prior.extraFields||[]){const nextField=(schema.extraFields||[]).find(f=>f.id===oldField.id);if(nextField)add("extra:"+oldField.id,oldField.type,nextField.type,currentMission.extraFields?.[oldField.id]);}
 data.fieldHistory=history;
}

const processTrackLabels={management:"چرخه مدیریتی معاون",office:"چرخه دفتر معاون و مسئول پیگیری",department:"چرخه اجرایی اداره"};let processTrackDraft={};
function renderProcessTrackActions(){document.querySelectorAll(".process-track-card").forEach(card=>{const host=card.querySelector("[data-track-actions]"),items=processTrackDraft[card.dataset.processTrack]?.actions||[];host.innerHTML=items.length?items.slice().reverse().map(a=>'<div class="process-track-action"><b>'+safe(a.title||"اقدام ثبت‌شده")+'</b><div>'+safe(a.note||"بدون شرح")+'</div><small>'+safe(a.owner||"بدون مسئول")+' · '+safe(a.dueDate||"بدون مهلت")+' · '+safe(a.status||"ثبت‌شده")+' · '+safe(new Date(a.createdAt).toLocaleString("fa-IR"))+'</small></div>').join(""):"<small>هنوز اقدامی در این چرخه ثبت نشده است.</small>";});}
function renderProcessTrackHistory(log=[]){const host=$("processTrackHistory");if(!host)return;host.innerHTML=log.length?log.slice().reverse().map(item=>'<div><b>'+safe(processTrackLabels[item.track]||item.track||"چرخه")+'</b> · '+safe(item.action||"به‌روزرسانی")+' · '+safe(new Date(item.at).toLocaleString("fa-IR"))+'<br>'+safe(item.note||"بدون توضیح")+' <small>('+safe(item.by||"ثبت‌کننده")+')</small></div>').join(""):"هنوز تغییری در چرخه‌های پیگیری ثبت نشده است.";}
function renderProcessTracks(saved={}){processTrackDraft={};document.querySelectorAll(".process-track-card").forEach(card=>{const key=card.dataset.processTrack,track=saved[key]||{status:key==="department"?(currentMission?.status==="referred"?"in-progress":"not-started"):"in-progress",progress:0};processTrackDraft[key]={...track,actions:Array.isArray(track.actions)?track.actions.slice():[]};card.querySelectorAll("[data-track-field]").forEach(el=>{const prop=el.dataset.trackField;el.value=track[prop]??(prop==="status"?"not-started":prop==="progress"?0:"");});});renderProcessTrackActions();}
function readProcessTracks(){const out={};document.querySelectorAll(".process-track-card").forEach(card=>{const key=card.dataset.processTrack,track={...(processTrackDraft[key]||{}),actions:(processTrackDraft[key]?.actions||[]).slice()};card.querySelectorAll("[data-track-field]").forEach(el=>{track[el.dataset.trackField]=el.type==="number"?Math.max(0,Math.min(100,Number(el.value||0))):el.value;});out[key]=track;});return out;}
function recordProcessTrackChanges(data){const prior=currentMission?.processTracks||{},next=data.processTracks||{},log=[...(currentMission?.processLog||[])],now=new Date().toISOString();for(const key of Object.keys(processTrackLabels)){const old=prior[key]||{},fresh=next[key]||{};if(Number(old.progress||0)!==Number(fresh.progress||0)||String(old.status||"not-started")!==String(fresh.status||"not-started")||String(old.owner||"")!==String(fresh.owner||"")||String(old.dueDate||"")!==String(fresh.dueDate||""))log.push({id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),track:key,at:now,action:"به‌روزرسانی وضعیت چرخه",progress:Number(fresh.progress||0),status:fresh.status,owner:fresh.owner,dueDate:fresh.dueDate,by:fresh.owner||"ثبت‌کننده",note:"وضعیت، مسئول، مهلت یا درصد تکمیل تغییر کرد."});const oldIds=new Set((old.actions||[]).map(a=>a.id));for(const action of fresh.actions||[])if(!oldIds.has(action.id))log.push({id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),track:key,at:action.createdAt||now,action:"ثبت اقدام جدید: "+action.title,by:action.owner||"ثبت‌کننده",note:action.note||""});}data.processLog=log;}

function collect(){
 const data={...(currentMission||{})};fieldIds.forEach(id=>{if($(id))data[id]=readField(id);});
 data.hasPrevious=selectedRadio("hasPrevious")==="yes";
 data.calendarEnabled=selectedRadio("calendarEnabled")!=="no";
 data.departmentFields=readCustom();
 data.executorDepartmentName=departmentNames[data.executorDepartment]||"";
 data.status=data.executionStatus||"registered";
 data.missionPhase=missionPhase(data.status);
 data.progress=Number(data.progress||0);
 data.workflow={stage:data.status,assignedDepartment:data.executorDepartment,assignedManager:data.directOwner,assignedExpert:data.assignedExpert,updatedAt:new Date().toISOString()};
 data.calendarEvent=data.calendarEnabled?{
  id:"mission-event:"+ (currentMission?.missionCode||data.missionCode||"new"),type:"mission",missionCode:currentMission?.missionCode||data.missionCode||"",title:data.calendarTitle||data.missionTitle,
  start:data.calendarStart||data.plannedStart||dateNow(),end:data.calendarEnd||data.plannedEnd||data.calendarStart||data.plannedStart||dateNow(),
  dept:data.executorDepartment||"all",description:data.calendarDescription||data.missionSubject||"",reminder:data.calendarReminder||"بدون یادآوری"
 }:null;
 data.milestones=readMilestones();
 data.processTracks=readProcessTracks();
 data.departmentFields={...(currentMission?.departmentFields||{}),...(departmentDraftValues[data.executorDepartment]||{}),...readCustom()};
 data.extraFields={...(currentMission?.extraFields||{}),...readExtraFields()};
 data.schemaSnapshot=currentMission?.schemaSnapshot||structuredClone(schema||defaultConfig());
 data.schemaVersion=Number(schema?.version||1);
 data.schemaHistory=currentMission?.schemaHistory||[{version:data.schemaVersion,at:new Date().toISOString(),snapshot:structuredClone(schema||defaultConfig())}];
 if(currentMission&&Number(currentMission.schemaVersion||1)!==data.schemaVersion)data.schemaHistory=[...data.schemaHistory,{version:data.schemaVersion,at:new Date().toISOString(),snapshot:structuredClone(schema||defaultConfig())}];
 archiveChangedFieldValues(data);
  return data;
}
function fill(data){
 fieldIds.forEach(id=>writeField(id,data[id]));
 setRadio("hasPrevious",data.hasPrevious?"yes":"no");
 setRadio("calendarEnabled",data.calendarEnabled===false?"no":"yes");
 $("previousFields").classList.toggle("hidden",!data.hasPrevious);
 renderDepartmentFields();writeCustom(data.departmentFields);renderMilestones(data.milestones||[]);renderExtraFields(data.extraFields);renderProcessTracks(data.processTracks||{});applyFieldConditions();
}
function renderWorkflowHistory(log=[]){
 const host=$("workflowHistory");if(!host)return;
 host.innerHTML=log.length?log.slice().reverse().map(item=>'<div style="padding:7px 0;border-bottom:1px solid #e2eaf0"><b>'+safe(item.action||"تغییر گردش")+'</b> · '+safe(new Date(item.at).toLocaleString("fa-IR"))+'<div>'+safe(statusLabel(item.stage))+' · '+safe(item.department||"بدون اداره")+' · '+safe(item.owner||"بدون مسئول")+'</div></div>').join(""):"تاریخچه گردش هنوز ثبت نشده است.";
}
function renderProgressHistory(log=[]){
 $("progressHistory").innerHTML=log.length?log.slice().reverse().map(item=>'<div style="padding:8px 0;border-bottom:1px solid #e3ebf0"><b>'+safe(toFa(item.progress??0))+'٪</b> · '+safe(new Date(item.at).toLocaleString("fa-IR"))+'<div>'+safe(item.note||"بدون توضیح")+'</div><small>'+safe(item.by||"ثبت‌کننده")+'</small></div>').join(""):"هنوز گزارشی در تاریخچه پیشرفت ثبت نشده است.";
}
async function saveMission(asDraft=false){
 const required=asDraft?["missionTitle"]:["missionTitle","missionSubject","executorDepartment","plannedEnd"];
 for(const id of required){const el=$(id);if(!el.value.trim()){el.focus();throw new Error(asDraft?"برای ذخیره پیش‌نویس، عنوان مأموریت را وارد کنید.":"فیلدهای عنوان، شرح موضوع، اداره مجری و مهلت اتمام الزامی هستند.");}}
 for(const id of ["missionDaysRequested","missionDaysApproved","missionDaysCompleted"]){const raw=$(id)?.value;if(raw!==""&&raw!=null&&(!Number.isInteger(Number(raw))||Number(raw)<0))throw new Error("تعداد روزهای مأموریت باید عدد صحیح و صفر یا بیشتر باشد.");}
 if(!asDraft){validateDynamicRequired();if(!$("missionForm").reportValidity())throw new Error("لطفاً فیلدهای الزامی را تکمیل کنید.");}
 if(!asDraft&&$("plannedStart").value&&$("plannedEnd").value&&$("plannedStart").value>$("plannedEnd").value)throw new Error("تاریخ شروع برنامه‌ای نمی‌تواند بعد از مهلت پایان باشد.");
 if(!asDraft&&$("actualStart").value&&$("actualEnd").value&&$("actualStart").value>$("actualEnd").value)throw new Error("تاریخ اتمام واقعی نمی‌تواند قبل از تاریخ شروع واقعی باشد.");
 if(!asDraft&&$("deputyApproval").value==="approved"&&(!$("deputyReferralDepartment").value||!$("deputyReferralPerson").value.trim()||!$("deputyReferralAt").value))throw new Error("پس از تأیید معاون، اداره مقصد، نفر مسئول و تاریخ ارجاع را تکمیل کنید.");
 if(selectedRadio("calendarEnabled")!=="no"&&$("calendarStart").value&&$("calendarEnd").value&&$("calendarStart").value>$("calendarEnd").value)throw new Error("پایان بازه رویداد تقویم نمی‌تواند قبل از شروع آن باشد.");
 const data=collect();data.attachments=currentMission?.attachments||[];if(window.Deputy7Access?.isReady()){const permission=currentMission?"edit":"create";if(!window.Deputy7Access.canCurrent(permission,{departmentId:String(data.executorDepartment||"")}))throw new Error("حساب کاربری شما برای این عملیات در اداره انتخاب‌شده مجوز ندارد.");}if(asDraft&&data.status==="draft")data.status="draft";else if(data.status==="draft")data.status="registered";
 data.missionPhase=missionPhase(data.status);
 data.executionStatus=data.status;data.workflow.stage=data.status;
 data.processTracks=data.processTracks||readProcessTracks();if(data.status==="referred"&&data.processTracks.department?.status==="not-started"){data.processTracks.department.status="in-progress";data.processTracks.department.owner=data.processTracks.department.owner||data.directOwner||data.assignedExpert||"";data.processTracks.department.dueDate=data.processTracks.department.dueDate||data.plannedEnd||"";}recordProcessTrackChanges(data);
 const now=new Date().toISOString();
 if(!currentMission){data.missionCode=makeCode();data.createdAt=now;data.progressLog=[{id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),at:now,progress:data.progress,note:"ثبت اولیه مأموریت",by:"ثبت‌کننده"}];data.workflowLog=[{id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),at:now,action:data.status==="referred"?"ثبت و ارجاع اولیه":"ثبت اولیه",stage:data.status,department:data.executorDepartmentName,owner:data.directOwner||data.assignedExpert||""}];if(data.calendarEvent){data.calendarEvent.id="mission-event:"+data.missionCode;data.calendarEvent.missionCode=data.missionCode;}}
 else{data.missionCode=currentMission.missionCode;data.createdAt=currentMission.createdAt;data.isSampleData=!!currentMission.isSampleData;data.sampleBatch=currentMission.sampleBatch||"";data.sampleLabel=currentMission.sampleLabel||"";data.progressLog=currentMission.progressLog||[];data.workflowLog=currentMission.workflowLog||[];const priorWorkflow=currentMission.workflow||{};if(priorWorkflow.stage!==data.workflow.stage||String(priorWorkflow.assignedDepartment)!==String(data.workflow.assignedDepartment)||String(priorWorkflow.assignedManager||"")!==String(data.workflow.assignedManager||"")||String(priorWorkflow.assignedExpert||"")!==String(data.workflow.assignedExpert||"")){data.workflowLog=[...data.workflowLog,{id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),at:now,action:data.status==="review"?"ارسال نتیجه برای بررسی":data.status==="closed"?"تأیید نهایی و مختومه":data.status==="referred"?"ارجاع به اداره مجری":data.status==="revision"?"بازگشت برای اصلاح":"به‌روزرسانی گردش کار",stage:data.status,department:data.executorDepartmentName,owner:data.directOwner||data.assignedExpert||""}];}if(Number(data.progress)!==Number(currentMission.progress)){data.progressLog=[...data.progressLog,{id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),at:now,progress:Number(data.progress||0),note:data.progressDescription||"به‌روزرسانی درصد پیشرفت",by:data.assignedExpert||data.directOwner||"ثبت‌کننده"}];}data.updatedAt=now;}
 const id=await MissionStore.save(data,currentMission?.id);
 currentMission={...data,id};renderProcessTrackHistory(currentMission.processLog||[]);
 const files=[...($("missionFiles").files||[])];
 const attached=[];
 for(const file of files){attached.push(await MissionVault.addAttachment(file,"mission",id));}
 if(attached.length){currentMission.attachments=[...(currentMission.attachments||[]),...attached];await MissionStore.save(currentMission,id);}
 $("missionFiles").value="";await renderAttachments(id);
 $("missionMeta").textContent="کد مأموریت: "+currentMission.missionCode+" · آخرین ذخیره: "+new Date().toLocaleString("fa-IR");
 $("statusLabel").textContent=statusLabel(currentMission.status);renderWorkflowHistory(currentMission.workflowLog||[]);
 $("saveResult").textContent="مأموریت با موفقیت در بانک مرکزی معاونت ۷ ذخیره شد. "+(attached.length?toFa(attached.length)+" پیوست نیز ذخیره شد.":"");
 $("pageTitle").textContent="ویرایش مأموریت · "+currentMission.missionCode;
 $("progressBar").style.width=Number(currentMission.progress||0)+"%";updateProgress();renderProgressHistory(currentMission.progressLog);
 history.replaceState(null,"",location.pathname+"?id="+encodeURIComponent(id));
 return id;
}
async function renderAttachments(recordId){
 const host=$("missionAttachmentList");if(!host)return;
 const files=(await MissionVault.listAttachments()).filter(file=>file.meta?.entity==="mission"&&String(file.meta?.recordId||"")===String(recordId));
 host.replaceChildren();
 if(!files.length){host.textContent="برای این مأموریت پیوستی ثبت نشده است.";return;}
 for(const file of files){const row=document.createElement("div");row.style.cssText="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #e2eaf0";
 const name=document.createElement("span");name.textContent=file.meta.name+" · "+toFa(Math.round((file.meta.size||0)/1024))+" کیلوبایت";
 const button=document.createElement("button");button.type="button";button.textContent="دریافت فایل";button.disabled=!!file.corrupt;
 button.addEventListener("click",async()=>{try{const item=await MissionVault.downloadAttachment(file.attachmentId),url=URL.createObjectURL(item.blob),a=document.createElement("a");a.href=url;a.download=item.meta.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}catch(e){$("saveResult").textContent=e.message;}});
 row.append(name,button);host.append(row);
 }
}
async function loadMission(id){
 const mission=await MissionStore.get(id);if(!mission)throw new Error("مأموریت موردنظر در بانک پیدا نشد.");if(window.Deputy7Access?.isReady()&&!window.Deputy7Access.canCurrent("edit",{departmentId:String(mission.executorDepartment||"")}))throw new Error("مجوز ویرایش این مأموریت برای حساب کاربری شما صادر نشده است.");
 currentMission=mission;document.body.classList.add("mission-edit-mode");fill(mission);
 await renderAttachments(id);document.title="ویرایش مأموریت "+mission.missionCode+" | معاونت ۷";$("pageTitle").textContent="ویرایش مأموریت · "+mission.missionCode;
 $("missionMeta").textContent="کد مأموریت: "+mission.missionCode+" · تاریخ ثبت: "+new Date(mission.createdAt).toLocaleDateString("fa-IR");
 $("statusLabel").textContent=statusLabel(mission.status);
 updateProgress();renderProgressHistory(mission.progressLog||[]);renderWorkflowHistory(mission.workflowLog||[]);
}
async function unlock(){
 await MissionStore.unlock();
 const storageCheck=await MissionVault.healthCheck();
 unlocked=true;$("workArea").classList.remove("hidden");$("authState").textContent="پایگاه داده محلی آماده است؛ آزمون نوشتن و خواندن موفق بود."+(storageCheck.persistent?" ماندگاری فضای ذخیره‌سازی نیز تأیید شد.":" مرورگر ماندگاری ویژه را تضمین نکرد؛ از پوشه داده‌ها پشتیبان منظم بگیرید.");
 $("unlockVault").disabled=true;const canManageSchema=!!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"});$("schemaAdmin").hidden=!canManageSchema;$("schemaAdmin").classList.toggle("hidden",!canManageSchema);
 await loadSchema();
 if(editingId)await loadMission(editingId);
 else{$("executionStatus").value="registered";writeField("requestDate",dateNow());writeField("receivedAt",localDateTimeNow());renderProcessTracks({});updateProgress();}
}
$("unlockVault").hidden=true;$("authState").textContent="در حال آماده‌سازی ذخیره‌سازی محلی…";unlock().catch(e=>{$("authState").textContent="خطا در آماده‌سازی مخزن محلی: "+e.message;});
$("executorDepartment").addEventListener("change",()=>{renderDepartmentFields();applyFieldConditions();});
$("missionForm").addEventListener("input",applyFieldConditions);$("missionForm").addEventListener("change",applyFieldConditions);
document.querySelectorAll('input[name="hasPrevious"]').forEach(el=>el.addEventListener("change",()=>$("previousFields").classList.toggle("hidden",selectedRadio("hasPrevious")!=="yes")));
$("progress").addEventListener("input",updateProgress);$("executionStatus").addEventListener("change",updateProgress);
$("actualStart").addEventListener("change",()=>{if($("actualStart").value&&["draft","registered","referred"].includes($("executionStatus").value))$("executionStatus").value="in-progress";updateProgress();});
$("actualEnd").addEventListener("change",()=>{if($("actualEnd").value)$("executionStatus").value="completed";updateProgress();});
$("deputyApproval").addEventListener("change",()=>{applyFieldConditions();if($("deputyApproval").value==="approved"&&!$("deputyReferralAt").value)$("deputyReferralAt").value=localDateTimeNow();});
$("deputyReferralDepartment").addEventListener("change",()=>{if($("deputyApproval").value==="approved"&&$("deputyReferralDepartment").value)$("executorDepartment").value=$("deputyReferralDepartment").value;renderDepartmentFields();applyFieldConditions();});
$("deputyReferralPerson").addEventListener("input",()=>{if($("deputyApproval").value==="approved")$("assignedExpert").value=$("deputyReferralPerson").value;});
$("addMilestone").addEventListener("click",()=>addMilestoneRow());
$("calculateMilestoneProgress").addEventListener("click",()=>{const rows=readMilestones();const weight=rows.reduce((s,x)=>s+Math.max(0,x.weight),0);if(!weight){$("saveResult").textContent="برای محاسبه، وزن نقاط عطف را وارد کنید.";return;}const value=Math.round(rows.reduce((s,x)=>s+Math.max(0,x.weight)*x.progress,0)/weight);$("progress").value=value;updateProgress();$("saveResult").textContent="پیشرفت وزنی نقاط عطف محاسبه شد: "+toFa(value)+"٪";});

tabs.forEach((tab,index)=>tab.addEventListener("click",()=>goStep(index)));
$("prevStep").addEventListener("click",()=>goStep(activeStep-1));
$("nextStep").addEventListener("click",()=>goStep(activeStep+1));
$("missionForm").addEventListener("submit",async e=>{e.preventDefault();try{await saveMission(false);}catch(err){$("saveResult").textContent=err.message;$("saveResult").classList.add("danger");}});
$("saveDraft").addEventListener("click",async()=>{try{if(!$("missionTitle").value.trim())throw new Error("برای ذخیره پیش‌نویس، حداقل عنوان مأموریت را وارد کنید.");$("executionStatus").value="draft";await saveMission(true);}catch(e){$("saveResult").textContent=e.message;}});
$("returnForReview").addEventListener("click",async()=>{try{if(!currentMission)throw new Error("ابتدا مأموریت را ذخیره کنید.");if(!$("actualResults").value.trim())throw new Error("پیش از ارسال برای بررسی، نتایج و محصولات واقعی را تکمیل کنید.");if(window.Deputy7Access?.isReady()&&!window.Deputy7Access.canCurrent("approve",{departmentId:String($("executorDepartment").value)}))throw new Error("مجوز ارسال نتیجه برای بررسی در این اداره برای شما صادر نشده است.");$("executionStatus").value="review";await saveMission(false);$("saveResult").textContent="نتیجه مأموریت برای بررسی مقام ارجاع‌دهنده ارسال شد.";}catch(e){$("saveResult").textContent=e.message;}});
$("closeMission").addEventListener("click",async()=>{try{if(!currentMission)throw new Error("ابتدا مأموریت را ذخیره کنید.");if(Number($("progress").value||0)<100)throw new Error("برای مختومه‌کردن، ابتدا پیشرفت را به ۱۰۰٪ برسانید.");if(window.Deputy7Access?.isReady()&&!window.Deputy7Access.canCurrent("approve",{departmentId:String($("executorDepartment").value)}))throw new Error("مجوز تأیید نهایی این مأموریت برای شما صادر نشده است.");$("executionStatus").value="closed";await saveMission(false);$("saveResult").textContent="مأموریت با تأیید نهایی مختومه شد.";}catch(e){$("saveResult").textContent=e.message;}});
$("referMission").addEventListener("click",async()=>{try{if(!$("executorDepartment").value)throw new Error("ابتدا اداره مجری را انتخاب کنید.");if(window.Deputy7Access?.isReady()&&!window.Deputy7Access.canCurrent("assign",{departmentId:String($("executorDepartment").value)}))throw new Error("مجوز ارجاع مأموریت در این اداره برای شما صادر نشده است.");if(!$("directOwner").value&&!$("assignedExpert").value)throw new Error("برای ارجاع، مدیر اداره یا کارشناس مسئول را مشخص کنید.");$("executionStatus").value="referred";if(!$("referredAt").value)$("referredAt").value=localDateTimeNow();await saveMission(false);$("saveResult").textContent="مأموریت با وضعیت ارجاع‌شده به اداره مجری ثبت شد. مسئول و مهلت در پرونده مأموریت درج شده‌اند."; }catch(e){$("saveResult").textContent=e.message;}});

document.querySelectorAll("[data-add-track-action]").forEach(button=>button.addEventListener("click",()=>{const card=button.closest(".process-track-card"),key=card.dataset.processTrack,title=card.querySelector('[data-action-field="title"]').value.trim();if(!title){$("saveResult").textContent="عنوان اقدام را وارد کنید.";return;}const action={id:(crypto.randomUUID ? crypto.randomUUID() : "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)),title,owner:card.querySelector('[data-action-field="owner"]').value.trim(),dueDate:card.querySelector('[data-action-field="dueDate"]').value,status:card.querySelector('[data-action-field="status"]').value,note:card.querySelector('[data-action-field="note"]').value.trim(),createdAt:new Date().toISOString()};processTrackDraft[key].actions.push(action);card.querySelectorAll("[data-action-field]").forEach(el=>el.value="");renderProcessTrackActions();$("saveResult").textContent="اقدام به چرخه مربوط اضافه شد؛ برای ثبت نهایی، تغییرات مأموریت را ذخیره کنید.";}));
$("addProgress").addEventListener("click",async()=>{try{if(!currentMission)throw new Error("ابتدا مأموریت را ذخیره کنید.");const note=$("progressDescription").value.trim();await MissionStore.addProgress(currentMission.id,{progress:Number($("progress").value||0),note,by:$("assignedExpert").value||$("directOwner").value||"ثبت‌کننده",status:$("executionStatus").value});currentMission=await MissionStore.get(currentMission.id);renderProgressHistory(currentMission.progressLog||[]);$("saveResult").textContent="گزارش پیشرفت در تاریخچه مأموریت ثبت شد.";}catch(e){$("saveResult").textContent=e.message;}});
$("loadSchema").addEventListener("click",()=>{try{$("schemaJson").value=JSON.stringify(schema,null,2);$("schemaResult").textContent="ساختار فعال بارگذاری شد.";}catch(e){$("schemaResult").textContent=e.message;}});
$("resetSchema").addEventListener("click",()=>{$("schemaJson").value=JSON.stringify(defaultConfig(),null,2);});
$("saveSchema").addEventListener("click",async()=>{try{if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"}))throw new Error("حساب کاربری شما مجوز مدیریت ساختار فرم مأموریت را ندارد.");const next=JSON.parse($("schemaJson").value);if(!Array.isArray(next.departments))throw new Error("آرایه departments الزامی است.");const departmentIds=new Set();for(const d of next.departments){if(!d.id||!d.name||!Array.isArray(d.fields))throw new Error("هر اداره باید شناسه، نام و آرایه fields داشته باشد.");if(departmentIds.has(String(d.id)))throw new Error("شناسه اداره تکراری است: "+d.id);departmentIds.add(String(d.id));const fieldIds=new Set();for(const f of d.fields){if(!f.id||!f.label||!["text","textarea","number","date","datetime-local","select","checkbox","yesno","checklist"].includes(f.type))throw new Error("هر فیلد باید id، label و نوع معتبر داشته باشد.");if(fieldIds.has(String(f.id)))throw new Error("شناسه فیلد در اداره "+d.name+" تکراری است: "+f.id);fieldIds.add(String(f.id));if(f.type==="select"&&(!Array.isArray(f.options)||!f.options.length))throw new Error("برای فیلد انتخابی "+f.label+" باید گزینه تعریف کنید.");}}if(next.options&&Object.values(next.options).some(v=>!Array.isArray(v)))throw new Error("گزینه‌های دسته‌بندی باید به‌صورت آرایه تعریف شوند.");schema=await MissionStore.saveConfig({...next,schemaId:"mission-form"});$("schemaJson").value=JSON.stringify(schema,null,2);applySchemaOptions();renderDepartmentFields();$("schemaResult").textContent="نسخه "+toFa(schema.version)+" از ساختار فرم ذخیره شد. مأموریت‌های قبلی تعریف نسخه زمان ثبت خود را حفظ می‌کنند.";}catch(e){$("schemaResult").textContent="خطا: "+e.message;}});

function validateImportedSchema(next){
 if(!next||typeof next!=="object"||!Array.isArray(next.departments))throw new Error("فایل انتخاب‌شده ساختار معتبر فرم مأموریت نیست.");
 if(next.schemaId&&next.schemaId!=="mission-form")throw new Error("این فایل مربوط به ساختار فرم مأموریت نیست.");
 if(next.coreFields!==undefined&&(typeof next.coreFields!=="object"||Array.isArray(next.coreFields)))throw new Error("ساختار coreFields معتبر نیست.");
 if(next.extraFields!==undefined&&!Array.isArray(next.extraFields))throw new Error("ساختار extraFields معتبر نیست.");
 if(next.options!==undefined&&(!next.options||typeof next.options!=="object"||Object.values(next.options).some(v=>!Array.isArray(v))))throw new Error("گزینه‌های فرم باید به‌صورت فهرست تعریف شده باشند.");
 const deptIds=new Set();
 for(const d of next.departments){
  if(!d?.id||!d.name||!Array.isArray(d.fields))throw new Error("هر اداره باید شناسه، عنوان و فهرست فیلد معتبر داشته باشد.");
  if(deptIds.has(String(d.id)))throw new Error("شناسه اداره تکراری است: "+d.id);
  deptIds.add(String(d.id));const fieldIds=new Set();
  for(const field of d.fields){
   if(!field?.id||!field.label||!["text","textarea","number","date","datetime-local","select","checkbox","yesno","checklist"].includes(field.type))throw new Error("یکی از فیلدهای اداره "+d.name+" مشخصات معتبر ندارد.");
   if(fieldIds.has(String(field.id)))throw new Error("شناسه فیلد تکراری است: "+field.id);
   fieldIds.add(String(field.id));
   if(field.type==="select"&&(!Array.isArray(field.options)||!field.options.length))throw new Error("برای فیلد انتخابی «"+field.label+"» گزینه تعریف نشده است.");
  }
 }
 return {...next,schemaId:"mission-form",coreFields:next.coreFields||{},extraFields:Array.isArray(next.extraFields)?next.extraFields:[],options:next.options||{}};
}
$("exportSchemaConfig")?.addEventListener("click",()=>{
 try{
  if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"}))throw new Error("مجوز مدیریت ساختار فرم برای این حساب فعال نیست.");
  const payload={...schema,schemaId:"mission-form",exportedAt:new Date().toISOString(),exportFormat:"deputy7-mission-form-schema"};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="mission-form-schema.json";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  $("schemaTransferStatus").textContent="فایل ساختار فعال دریافت شد. برای انتقال، همین فایل را در سامانه مقصد بارگذاری کنید.";
 }catch(error){$("schemaTransferStatus").textContent=error.message;}
});
$("chooseSchemaConfigFile")?.addEventListener("click",()=>{
 if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"})){$("schemaTransferStatus").textContent="مجوز مدیریت ساختار فرم برای این حساب فعال نیست.";return;}
 $("importSchemaConfigFile").click();
});
$("importSchemaConfigFile")?.addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(!window.Deputy7Access?.canCurrent("manageSchema",{kind:"configuration"}))throw new Error("مجوز مدیریت ساختار فرم برای این حساب فعال نیست.");
  const parsed=JSON.parse(await file.text()),next=validateImportedSchema(parsed);
  if(!confirm("ساختار فرم فعلی با ساختار موجود در فایل جایگزین شود؟ اطلاعات مأموریت‌های ثبت‌شده قبلی حذف نخواهد شد."))return;
  schema=await MissionStore.saveConfig(next);await loadSchema();
  $("schemaTransferStatus").textContent="ساختار نسخه "+toFa(schema.version)+" با موفقیت در پایگاه داده این سامانه بارگذاری و فعال شد.";
  $("schemaResult").textContent="ساختار فرم از فایل بارگذاری و فعال شد.";
 }catch(error){$("schemaTransferStatus").textContent="بارگذاری انجام نشد: "+error.message;}
 finally{event.target.value="";}
});

goStep(0);updateProgress();
