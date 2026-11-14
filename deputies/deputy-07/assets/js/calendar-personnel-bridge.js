import {list,initialize,ensurePersonnelUnlocked} from "../../local-data/assets/personnel-registry.js?v=personnel-registry-20261114-7";
(()=>{"use strict";const root=document.querySelector("[data-org-calendar]");if(!root)return;const button=root.querySelector("[data-calendar-personnel-sync]"),status=root.querySelector("[data-calendar-personnel-status]");if(!button)return;
const departments={"1":"اداره اداری و پشتیبانی","2":"اداره تحقیق و توسعه","3":"اداره پارک‌بان و معبربانان","4":"اداره تأسیسات فنی و امور نگهداری","6":"اداره فاوا و خدمات فنی","7":"اداره جمع‌آوری، نگهداری و بازیافت پسماند","8":"اداره بازرسی و تحقیقات محلی"};
const dateFor=(raw,annual)=>{if(!raw)return"";const parts=String(raw).slice(0,10).split("-");if(parts.length!==3)return"";const year=annual?new Date().getFullYear():Number(parts[0]);return [year,parts[1],parts[2]].join("-");};
button.addEventListener("click",async()=>{button.disabled=true;button.textContent="در حال همگام‌سازی…";try{if(!await ensurePersonnelUnlocked())return;let rows=await list();if(rows.length<250)rows=(await initialize()).records;const people=rows.filter(r=>r.status==="active").map(r=>({code:r.code,profile:r.profile,name:((r.profile?.firstName||"")+" "+(r.profile?.lastName||"")).trim()}));const events=[];
for(const p of people){const profile=p.profile||{},dept=String(profile.departmentId||"");const add=(raw,annual,title,detail)=>{const date=dateFor(raw,annual);if(!date)return;events.push({date,type:"personal",source:"personnel-registry",dept,personnelCode:p.code,title,detail,personCount:1,time:"",place:profile.workLocation||departments[dept]||""});};
add(profile.birthDate,true,"زادروز · "+p.name,"کد پرسنلی "+p.code+" · "+(profile.jobTitle||""));
add(profile.marriageDate,true,"سالگرد ازدواج · "+p.name,"مناسبت ثبت‌شده در بانک مرکزی پرسنل · کد "+p.code);
add(profile.hireDate,true,"سالگرد شروع خدمت · "+p.name,"تاریخ آغاز همکاری · کد "+p.code);
add(profile.contractEnd,false,"پایان قرارداد / حکم · "+p.name,"سررسید ثبت‌شده در پرونده پرسنلی · کد "+p.code);
}
if(typeof window.setPersonnelCalendarData!=="function")throw Error("ماژول تقویم آماده نیست؛ صفحه را یک‌بار تازه‌سازی کنید.");
window.setPersonnelCalendarData(people,events);if(status)status.textContent=people.length.toLocaleString("fa-IR")+" پرونده فعال بررسی شد؛ "+events.length.toLocaleString("fa-IR")+" مناسبت و سررسید از بانک استخراج شد.";button.textContent="همگام‌سازی انجام شد";
}catch(e){if(status)status.textContent=e.message;button.textContent="تلاش دوباره";}finally{button.disabled=false;setTimeout(()=>button.textContent="همگام‌سازی از بانک پرسنل",1800);}});
})();