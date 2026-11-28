(()=>{"use strict";
const $=s=>document.querySelector(s),fa=n=>Number(n||0).toLocaleString("fa-IR");
const depts=[
 ["1","اداره اداری و پشتیبانی","امور اداری، سرمایه انسانی و پشتیبانی سازمان"],
 ["2","اداره تحقیق و توسعه","پژوهش، نوآوری و توسعه راهکارهای سازمانی"],
 ["3","اداره پارکبان و معبربانان","ساماندهی و نظارت بر خدمات میدانی"],
 ["4","اداره تأسیسات فنی و امور نگهداری","نگهداری زیرساخت‌ها و خدمات فنی"],
 ["5","اداره پنجم","فضای مستقل اداره"],
 ["6","اداره فاوا و خدمات فنی","فناوری اطلاعات و خدمات فنی"],
 ["7","اداره جمع‌آوری، نگهداری و بازیافت پسماند","مدیریت عملیات پسماند"],
 ["8","اداره بازرسی و تحقیقات محلی","بازرسی عملکرد و تحقیقات میدانی"]
];
function scan(){
 const out=depts.map(([id,name])=>({id,name,banks:0,records:0}));
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i)||"";
  if(key==="deputy7_dept2_training_v1"){try{const v=JSON.parse(localStorage.getItem(key)||"{}"),d=out.find(x=>x.id==="2");d.banks++;d.records+=(Array.isArray(v.courses)?v.courses.length:0)}catch(e){}continue}
  const m=key.match(/^deputy7\.dept(\d+)\.(.+)$/);if(!m)continue;
  const d=out.find(x=>x.id===m[1]);if(!d)continue;
  try{const v=JSON.parse(localStorage.getItem(key));const rows=Array.isArray(v)?v:(Array.isArray(v?.records)?v.records:null);if(rows){d.banks++;d.records+=rows.length}}catch(e){}
 }
 return out;
}
function render(){
 const rows=scan(),connected=rows.filter(x=>x.banks>0).length,total=rows.reduce((a,x)=>a+x.records,0);
 let cc={directives:[],issues:[],analyses:[],requests:[],objectives:[]};
 try{cc={...cc,...JSON.parse(localStorage.getItem("deputy7.commandCenter.v1")||"{}")}}catch(e){}
 const all=[...(cc.directives||[]),...(cc.issues||[]),...(cc.requests||[])];
 const closed=["تکمیل‌شده","مختومه","پاسخ داده شد","بسته"];
 const active=all.filter(x=>!closed.includes(x.status)).length;
 const overdue=all.filter(x=>x.deadline&&!closed.includes(x.status)&&new Date(x.deadline+"T23:59:59")<new Date()).length;
 $("#executive-date").textContent=new Date().toLocaleDateString("fa-IR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 $("#executive-kpis").innerHTML=[
  ["ادارات دارای داده",fa(connected)+" از ۸","بر اساس بانک‌های محلی شناسایی‌شده"],
  ["سوابق قابل مشاهده",fa(total),"مجموع سوابق بانک‌های متصل"],
  ["موضوعات و اقدامات باز",fa(active),"ثبت‌شده در مرکز اشراف"],
  ["موارد دارای مهلت گذشته",fa(overdue),"نیازمند بررسی و تعیین تکلیف"]
 ].map(x=>'<article class="executive-kpi"><small>'+x[0]+'</small><b>'+x[1]+'</b><span>'+x[2]+'</span></article>').join("");
 $("#executive-dept-summary").innerHTML=rows.map(d=>'<div class="executive-dept-row"><div><b>'+d.name+'</b><small>'+fa(d.banks)+' بانک · '+fa(d.records)+' سابقه</small></div><span class="'+(d.banks?"connected":"disconnected")+'">'+(d.banks?"دارای داده":"داده متصل نیست")+'</span></div>').join("");
 $("#executive-attention").innerHTML=[
  ["وضعیت اتصال اطلاعات","اطلاعات این نما از بانک‌های محلی قابل شناسایی در همین مرورگر خوانده می‌شود؛ نبود داده به معنی صفر بودن عملکرد اداره نیست."],
  ["پیگیری‌های مدیریتی",active?fa(active)+" موضوع باز در مرکز اشراف ثبت شده است.":"هنوز موضوع بازی در بانک مرکز اشراف ثبت نشده است."],
  ["مهلت‌های گذشته",overdue?fa(overdue)+" مورد از مهلت تعیین‌شده عبور کرده است.":"موردی با مهلت گذشته در داده‌های فعلی شناسایی نشد."]
 ].map(x=>'<article><b>'+x[0]+'</b><p>'+x[1]+'</p></article>').join("");
 $("#executive-departments").innerHTML=rows.map(d=>'<a class="executive-department" href="pages/department-'+d.id+'.html"><small>اداره '+fa(d.id)+'</small><b>'+d.name+'</b><p>'+depts.find(x=>x[0]===d.id)[2]+'</p><footer><span>'+(d.banks?fa(d.records)+" سابقه قابل مشاهده":"هنوز داده‌ای متصل نیست")+'</span><strong>ورود ←</strong></footer></a>').join("");
}
render();
window.addEventListener("storage",render);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
})();