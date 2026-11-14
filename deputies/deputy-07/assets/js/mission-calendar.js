import { MissionStore, MissionVault } from "./mission-store.js";
const status=await MissionVault.status();
if(!status.exists) {
  window.dispatchEvent(new CustomEvent("deputy7:mission-calendar",{detail:[]}));
} else {
  try {
    await MissionVault.counts();
  } catch {
    const pass=prompt("برای نمایش مأموریت‌های محرمانه در تقویم مرکزی، رمز امنیتی پایگاه داده معاونت ۷ را وارد کنید:");
    if(!pass)throw new Error("نمایش مأموریت‌ها بدون بازگشایی مخزن امکان‌پذیر نیست.");
    await MissionStore.unlock(pass);
  }
  const missions=await MissionStore.list();
  const events=[];
  for(const mission of missions){
    const source=mission.calendarEvent;
    if(!source||mission.calendarEnabled===false)continue;
    const start=source.start||mission.plannedStart||mission.plannedEnd;
    const end=source.end||mission.plannedEnd||start;
    if(!start)continue;
    const cursor=new Date(start+"T12:00:00"),last=new Date((end||start)+"T12:00:00");
    if(Number.isNaN(cursor.getTime())||Number.isNaN(last.getTime()))continue;
    let count=0;
    while(cursor<=last&&count<366){
      const date=[cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,"0"),String(cursor.getDate()).padStart(2,"0")].join("-");
      events.push({date,type:"mission",dept:String(mission.executorDepartment||"all"),title:source.title||mission.missionTitle||"مأموریت",detail:[source.description||mission.missionSubject||"", "کد مأموریت: "+(mission.missionCode||mission.id), "پیشرفت: "+Number(mission.progress||0)+"٪", "وضعیت: "+(mission.status||"ثبت‌شده")].filter(Boolean).join(" · "),time:"",place:"بازه اجرای مأموریت",missionCode:mission.missionCode});
      cursor.setDate(cursor.getDate()+1);count++;
    }
  }
  window.dispatchEvent(new CustomEvent("deputy7:mission-calendar",{detail:events}));
}
