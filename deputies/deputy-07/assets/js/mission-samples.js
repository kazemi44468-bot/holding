import { MissionStore } from "./mission-store.js?v=20261115-05";

const SAMPLE_BATCH="mission-report-demo-2026-11-v2";
const LEGACY_BATCH="mission-report-demo-2026-11";
const SAMPLE_META_KEY="mission-samples-v2";
const sampleDepartments={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارکبان و معبربانان","4":"تأسیسات فنی و امور نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری، نگهداری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی","HQ":"ستاد معاونت ۷"};
const sampleSpecs=[
 {dept:"1",title:"تکمیل پرونده‌های پشتیبانی نیروی انسانی",status:"completed",progress:100,priority:"important",createdAgo:28,startAgo:27,finishAgo:25,scope:"inside-province",shift:"daytime",continuity:"continuous"},
 {dept:"2",title:"ارزیابی شاخص‌های کیفیت خدمات شهری",status:"in-progress",progress:65,priority:"important",createdAgo:25,startAgo:23,finishAgo:null,scope:"inside-province",shift:"daytime",continuity:"intermittent"},
 {dept:"3",title:"بازدید و پایش پاکیزگی محورهای اصلی",status:"in-progress",progress:48,priority:"urgent",createdAgo:22,startAgo:20,finishAgo:null,scope:"inside-province",shift:"continuous-24h",continuity:"continuous"},
 {dept:"4",title:"تعمیر و آماده‌سازی تجهیزات روشنایی",status:"blocked",progress:30,priority:"critical",createdAgo:19,startAgo:18,finishAgo:null,scope:"outside-province",shift:"daytime",continuity:"intermittent"},
 {dept:"6",title:"به‌روزرسانی زیرساخت شبکه و ارتباطات",status:"completed",progress:100,priority:"important",createdAgo:16,startAgo:15,finishAgo:12,scope:"inside-province",shift:"continuous-24h",continuity:"continuous"},
 {dept:"7",title:"ساماندهی مسیرهای جمع‌آوری پسماند خشک",status:"referred",progress:15,priority:"urgent",createdAgo:13,startAgo:null,finishAgo:null,plannedStartAgo:10,plannedEndAgo:-1,scope:"inside-province",shift:"daytime",continuity:"continuous"},
 {dept:"8",title:"بررسی میدانی درخواست‌های ثبت‌شده شهروندان",status:"registered",progress:0,priority:"normal",createdAgo:10,startAgo:null,finishAgo:null,plannedStartAgo:-2,plannedEndAgo:-9,scope:"inside-province",shift:"daytime",continuity:"intermittent"},
 {dept:"HQ",title:"تهیه گزارش تجمیعی عملکرد اداره‌ها",status:"review",progress:90,priority:"important",createdAgo:7,startAgo:6,finishAgo:null,plannedStartAgo:6,plannedEndAgo:-7,scope:"inside-province",shift:"daytime",continuity:"intermittent"},
 {dept:"3",title:"برنامه‌ریزی شیفت‌های عملیاتی مناطق",status:"in-progress",progress:75,priority:"normal",createdAgo:4,startAgo:3,finishAgo:null,plannedStartAgo:3,plannedEndAgo:-10,scope:"outside-province",shift:"continuous-24h",continuity:"continuous"},
 {dept:"7",title:"رفع نقاط انباشت پسماند در محدوده‌های منتخب",status:"closed",progress:100,priority:"urgent",createdAgo:1,startAgo:0,finishAgo:0,plannedStartAgo:0,plannedEndAgo:-13,scope:"inside-province",shift:"continuous-24h",continuity:"intermittent"}
];
const sampleDeptName=id=>sampleDepartments[id]||("اداره "+id);
function sampleDate(daysAgo){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-daysAgo);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function phaseOf(status){return ["completed","closed"].includes(status)?"completed":["in-progress","blocked","review","revision"].includes(status)?"active":"planned"}
export async function ensureMissionSamples(force=false){
 const marker=await MissionStore.getMeta(SAMPLE_META_KEY);
 if(marker?.done&&marker.batch===SAMPLE_BATCH&&!force){
  const current=await MissionStore.list();let migrated=0;
  for(let i=0;i<sampleSpecs.length;i++){
   const id="sample-mission-"+String(i+1).padStart(2,"0"),record=current.find(m=>String(m.id)===id);if(!record)continue;
   const approved=4+(i%5),patch={};
   if(record.missionDaysRequested==null)patch.missionDaysRequested=5+(i%5);
   if(record.missionDaysApproved==null)patch.missionDaysApproved=approved;
   if(record.missionDaysCompleted==null)patch.missionDaysCompleted=record.actualEnd?approved:Math.floor(approved*Number(record.progress||0)/100);
   const destinations=["کرج، محدوده مرکزی","قزوین، محدوده صنعتی","تهران، منطقه ۲۲","شهریار، محدوده خدماتی","رشت، محدوده مرکزی","هشتگرد، محدوده عملیاتی","تهران، منطقه ۵","ورامین، محدوده شهری","نظرآباد، محدوده پشتیبانی","پردیس، محدوده شرقی"],modes=["خودروی سازمانی","اتوبوس","خودروی سازمانی","قطار","خودروی شخصی","خودروی سازمانی","تاکسی / تاکسی اینترنتی","اتوبوس","موتورسیکلت سازمانی","خودروی سازمانی"],days=Number(record.missionDaysCompleted||record.missionDaysApproved||record.missionDaysRequested||1),rate=650000+(i%4)*100000;
   const demo={destination:destinations[i],destinationAddress:"نشانی نمونه مأموریت شماره "+String(i+1),travelMode:modes[i],transportDetails:"مسیر و جزئیات رفت‌وآمد نمونه؛ صرفاً برای آزمایش گزارش‌ها و فرم.",participantCount:2+(i%4),missionAllowanceRate:rate,missionAllowanceAmount:days*rate,lodgingCost:i%3===0?1800000:0,mealCost:450000+(i%3)*150000,fuelCost:modes[i].includes("خودروی")?900000+(i*75000):0,tollCost:120000+(i*15000),otherMissionCost:100000, paymentStatus:record.actualEnd?"پرداخت کامل":"در انتظار پرداخت",paymentReference:"SAMPLE-PAY-"+String(i+1).padStart(3,"0")};
   for(const [key,value] of Object.entries(demo))if(record[key]===undefined||record[key]===null||record[key]==="")patch[key]=value;
   if((record.actualCost===undefined||record.actualCost===null||record.actualCost==="")&&patch.actualCost===undefined)patch.actualCost=Number(patch.lodgingCost??record.lodgingCost??0)+Number(patch.mealCost??record.mealCost??0)+Number(patch.fuelCost??record.fuelCost??0)+Number(patch.tollCost??record.tollCost??0)+Number(patch.otherMissionCost??record.otherMissionCost??0);
   if((record.totalPaid===undefined||record.totalPaid===null||record.totalPaid==="")&&patch.totalPaid===undefined)patch.totalPaid=record.actualEnd?Number(patch.missionAllowanceAmount??record.missionAllowanceAmount??0)+Number(patch.actualCost??record.actualCost??0):0;
   if(Object.keys(patch).length){await MissionStore.save({...record,...patch},id);migrated++;}
  }
  return 0;
}
 const existing=await MissionStore.list();
 const oldSamples=existing.filter(m=>m.isSampleData||m.sampleBatch===LEGACY_BATCH||m.sampleBatch===SAMPLE_BATCH||String(m.id).startsWith("sample-mission-"));
 for(const item of oldSamples)await MissionStore.remove(item.id);
 let added=0;
 for(let i=0;i<sampleSpecs.length;i++){
  const spec=sampleSpecs[i],id="sample-mission-"+String(i+1).padStart(2,"0");
  const created=sampleDate(spec.createdAgo),started=spec.startAgo===null?null:sampleDate(spec.startAgo),finished=spec.finishAgo===null?null:sampleDate(spec.finishAgo);
  const plannedStart=sampleDate(spec.plannedStartAgo??Math.max(0,spec.createdAgo-1));
  const plannedEnd=sampleDate(spec.plannedEndAgo??(spec.createdAgo-14));
  const now=new Date().toISOString(),code="TST-1405-"+String(i+1).padStart(3,"0");
  const actionAt=sampleDate(Math.max(0,(spec.startAgo??spec.createdAgo)-1))+"T10:30:00";
  const deptName=sampleDeptName(spec.dept),owner="مسئول نمونه اداره "+spec.dept,expert="کارشناس آزمایشی "+String(1000+i);
  const trackStatus=["completed","closed"].includes(spec.status)?"completed":spec.status==="registered"?"not-started":spec.status==="referred"||spec.status==="review"?"waiting":spec.status==="blocked"?"blocked":"in-progress";
  const record={
   id,missionCode:code,missionTitle:spec.title,missionSubject:"پرونده آزمایشی برای نمایش و ارزیابی بانک مأموریت، گزارش‌های زمانی، نمودار پیشرفت و برنامه زمان‌بندی.",expectedPurpose:"نمایش چرخه کامل ثبت، ارجاع، اجرا، پایش و خاتمه مأموریت.",
   communicationType:"گزارش یا اعلام نیاز",requestNumber:"DEMO-"+String(i+1).padStart(3,"0"),requestDate:created,requestChannel:"ارجاع مستقیم",
   executorDepartment:spec.dept,executorDepartmentName:deptName,executorSubunit:"واحد تخصصی نمونه",missionType:i%3===0?"اجرایی":i%3===1?"نظارتی و بازرسی":"فنی و تعمیراتی",workNature:"پروژه‌ای",priority:spec.priority,confidentiality:"داخلی",
   status:spec.status,executionStatus:spec.status,missionPhase:phaseOf(spec.status),progress:spec.progress,missionDaysRequested:5+(i%5),missionDaysApproved:4+(i%5),missionDaysCompleted:spec.finishAgo!==null?(4+(i%5)):Math.floor((4+(i%5))*spec.progress/100),qualityScore:spec.progress===100?92:72+i%5,goalAchievement:spec.progress===100?100:Math.min(100,spec.progress+8),
   scheduleStatus:spec.status==="blocked"?"متوقف به علت مانع":spec.finishAgo!==null?"مطابق برنامه":spec.status==="in-progress"&&spec.createdAgo>15?"دارای تأخیر":"مطابق برنامه",
   plannedStart,plannedEnd,actualStart:started,actualEnd:finished,coordinationAt:sampleDate(Math.max(0,(spec.startAgo??spec.createdAgo)-2))+"T09:30:00",
   deputyApproval:"approved",deputyReferralDepartment:spec.dept,deputyReferralPerson:owner,deputyReferralAt:created+"T10:00:00",referredAt:created+"T10:00:00",
   locationScope:spec.scope,workSchedule:spec.shift,continuityType:spec.continuity,
   createdAt:created+"T09:00:00",updatedAt:now,isSampleData:true,sampleBatch:SAMPLE_BATCH,sampleLabel:"داده آزمایشی",
   directOwner:owner,assignedExpert:expert,teamLead:owner,supervisor:"ناظر آزمایشی معاونت",progressDescription:"داده نمونه؛ برای آزمون نمایش وضعیت و نمودارها.",
   workflow:{stage:spec.status,assignedDepartment:spec.dept,assignedManager:owner,assignedExpert:expert,updatedAt:now},
   workflowLog:[
    {id:id+"-w1",at:created+"T09:00:00",action:"ثبت مأموریت آزمایشی",stage:"registered",department:deptName,owner},
    {id:id+"-w2",at:created+"T10:00:00",action:"تأیید معاون و ارجاع به اداره",stage:"referred",department:deptName,owner},
    ...(started?[{id:id+"-w3",at:started+"T10:00:00",action:"شروع عملیات",stage:"in-progress",department:deptName,owner:expert}]:[]),
    ...(finished?[{id:id+"-w4",at:finished+"T16:00:00",action:"اتمام و تأیید مأموریت",stage:spec.status,department:deptName,owner}]:[])
   ],
   progressLog:[
    {id:id+"-p1",at:created+"T09:30:00",progress:0,note:"ثبت اولیه",by:"داده آزمایشی"},
    {id:id+"-p2",at:(started||created)+"T14:00:00",progress:Math.max(5,Math.round(spec.progress*.55)),note:"گزارش میانی پیشرفت",by:expert},
    {id:id+"-p3",at:(finished||sampleDate(0))+"T15:00:00",progress:spec.progress,note:"به‌روزرسانی پیشرفت",by:expert}
   ],
   processLog:[{id:id+"-a1",at:actionAt,action:"بررسی و ثبت اقدام اجرایی",note:"اقدام نمونه برای نمایش در نمودار فعالیت",by:expert}],
   processTracks:{
    management:{status:trackStatus,progress:Math.min(100,spec.progress+8),owner,dueDate:plannedEnd,actions:[{id:id+"-ma",title:"بررسی مدیریتی و تعیین اولویت",status:"تکمیل‌شده",createdAt:created+"T11:00:00",owner}]},
    office:{status:trackStatus,progress:Math.max(0,spec.progress-4),owner:"دفتر معاون",dueDate:plannedEnd,actions:[{id:id+"-oa",title:"پیگیری و هماهنگی بین واحدی",status:spec.progress>=70?"تکمیل‌شده":"در حال انجام",createdAt:actionAt,owner:"دفتر معاون",dueDate:plannedEnd}]},
    department:{status:trackStatus,progress:spec.progress,owner:expert,dueDate:plannedEnd,actions:[{id:id+"-da",title:"اجرای اقدام تخصصی اداره",status:finished?"تکمیل‌شده":"در حال انجام",createdAt:(started||created)+"T12:00:00",owner:expert,dueDate:plannedEnd}]}
   },
   milestones:[
    {id:id+"-m1",title:"آماده‌سازی و هماهنگی",weight:25,progress:100,dueDate:plannedStart},
    {id:id+"-m2",title:"اجرای عملیات اصلی",weight:50,progress:spec.progress,dueDate:plannedEnd},
    {id:id+"-m3",title:"تحویل و ارزیابی",weight:25,progress:finished?100:0,dueDate:plannedEnd}
   ]
  };
  await MissionStore.save(record,id);added++;
 }
 await MissionStore.saveMeta(SAMPLE_META_KEY,{done:true,batch:SAMPLE_BATCH,records:added,completedAt:new Date().toISOString()});
 return added;
}
export async function removeMissionSamples(){
 const records=await MissionStore.list(),samples=records.filter(m=>m.isSampleData||m.sampleBatch===LEGACY_BATCH||m.sampleBatch===SAMPLE_BATCH||String(m.id).startsWith("sample-mission-"));
 for(const m of samples)await MissionStore.remove(m.id);
 await MissionStore.saveMeta(SAMPLE_META_KEY,{done:false,batch:SAMPLE_BATCH,records:0,removedAt:new Date().toISOString()});
 return samples.length;
}
