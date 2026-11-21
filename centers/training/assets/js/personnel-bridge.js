(()=>{"use strict";
let api=null,connected=false,busy=false;
async function connect(){
 if(busy)throw new Error("اتصال به بانک پرسنل در حال انجام است.");
 busy=true;
 try{
  api=api||await import("../../../deputies/deputy-07/local-data/assets/personnel-registry.js?v=personnel-registry-20261114-7");
  const registry=window.PersonnelRegistry||api.PersonnelRegistry;
  if(!registry)throw new Error("ماژول بانک مرکزی پرسنل بارگذاری نشد.");
  if(!await registry.ensureUnlocked())return false;
  await registry.initialize();
  const rows=await registry.list();
  const departments={"1":"اداری و پشتیبانی","2":"تحقیق و توسعه","3":"پارک‌بان و معبربانان","4":"تأسیسات فنی و امور نگهداری","6":"فاوا و خدمات فنی","7":"جمع‌آوری، نگهداری و بازیافت پسماند","8":"بازرسی و تحقیقات محلی"};
  const people=rows.filter(r=>r.status==="active").map(r=>{
   const p=r.profile||{};
   return {id:String(r.code),personnelCode:String(r.code),name:[p.firstName,p.lastName].filter(Boolean).join(" ").trim(),unit:p.unit||departments[String(p.departmentId)]||"",departmentId:p.departmentId||"",position:p.jobTitle||"",specialty:p.specialty||"",phone:p.mobile||"",education:p.education||"",field:p.fieldOfStudy||"",status:r.status,source:"registry"};
  });
  connected=true;
  window.dispatchEvent(new CustomEvent("training:personnel-synced",{detail:{people,total:rows.length,active:people.length,at:new Date().toISOString()}}));
  return true;
 }finally{busy=false;}
}
window.TrainingPersonnelBridge=Object.freeze({connect,isConnected:()=>connected});
})();