import { MissionStore } from "./mission-store.js?v=20261115-02";

const SAMPLE_BATCH="mission-report-demo-2026-11";
const sampleDepartments={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارکبان و معبربانان","4":"تأسیسات فنی و نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
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
const sampleDeptName=id=>sampleDepartments[id]||("اداره "+id);
function sampleDate(daysAgo){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-daysAgo);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
export async function ensureMissionSamples(force=false){
 const marker=await MissionStore.getMeta("mission-samples-v1");if(marker?.done&&!force)return 0;
 const existing=await MissionStore.list(),known=new Set(existing.map(m=>String(m.id)));
 if(existing.some(m=>m.sampleBatch===SAMPLE_BATCH)&&!force){await MissionStore.saveMeta("mission-samples-v1",{done:true,batch:SAMPLE_BATCH,records:existing.filter(m=>m.sampleBatch===SAMPLE_BATCH).length});return 0;}
 let added=0;
 for(let i=0;i<sampleSpecs.length;i++){
  const [dept,title,status,progress,priority,createdAgo,startAgo,finishAgo]=sampleSpecs[i],id="sample-mission-"+String(i+1).padStart(2,"0");
  if(known.has(id))continue;
  const created=sampleDate(createdAgo),started=startAgo===null?null:sampleDate(startAgo),finished=finishAgo===null?null:sampleDate(finishAgo),plannedStart=sampleDate(createdAgo),plannedEnd=sampleDate(Math.max(0,createdAgo-14));
  const now=new Date().toISOString(),code="TST-1405-"+String(i+1).padStart(3,"0");
  const actionAt=sampleDate(Math.max(0,(startAgo??createdAgo)-1))+"T10:30:00";
  const trackStatus=status==="completed"||status==="closed"?"completed":status==="registered"?"not-started":status==="referred"||status==="review"?"waiting":status==="blocked"?"blocked":"in-progress";
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
 await MissionStore.saveMeta("mission-samples-v1",{done:true,batch:SAMPLE_BATCH,records:added,completedAt:new Date().toISOString()});
 return added;
}
export async function removeMissionSamples(){
 const records=await MissionStore.list(),samples=records.filter(m=>m.sampleBatch===SAMPLE_BATCH);
 for(const m of samples)await MissionStore.remove(m.id);
 return samples.length;
}
