(()=>{"use strict";
const KEY="deputy7.commandCenter.v1",id=(location.pathname.match(/department-(\d+)\.html/)||[])[1];if(!id)return;
const names={"1":"اداره اداری و پشتیبانی","2":"اداره تحقیق و توسعه","3":"اداره پارکبان و معبربانان","4":"اداره تأسیسات فنی و امور نگهداری","5":"اداره پنجم","6":"اداره فاوا و خدمات فنی","7":"اداره جمع‌آوری، نگهداری و بازیافت پسماند","8":"اداره بازرسی و تحقیقات محلی"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}},write=db=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){alert("ذخیره گزارش به مرکز اشراف ممکن نشد.");return false}};
const matches=x=>String(x.department||"")===id||String(x.department||"").includes(names[id])||String(x.partners||"").split(/[،,;؛]/).some(p=>p.trim()===id||p.trim()===names[id]||p.trim().includes("اداره "+id));
const open=x=>!["تکمیل‌شده","مختومه","پاسخ داده شد","بسته"].includes(x.status||"");
const db=read(),items=[...(db.directives||[]).filter(x=>matches(x)&&open(x)).map(x=>({...x,_kind:"دستور اقدام"})),...(db.requests||[]).filter(x=>matches(x)&&open(x)).map(x=>({...x,_kind:"درخواست اطلاعات"}))];
if(!items.length)return;
const host=document.querySelector(".d1-main,.dept2-main,.ops-main");if(!host)return;
const panel=document.createElement("section");panel.className="cc-inbox-panel";panel.innerHTML='<div class="cc-inbox-head"><div><small>ابلاغ‌ها و درخواست‌های بین‌اداره‌ای</small><b>موارد ارجاع‌شده از مرکز اشراف و بهبود عملکرد</b></div><a href="../pages/command-center.html">ورود به مرکز ←</a></div><div class="cc-inbox-list">'+items.map(x=>'<article class="cc-inbox-item" data-id="'+esc(x.id)+'" data-kind="'+(x._kind==="دستور اقدام"?"directives":"requests")+'"><div><span>'+x._kind+'</span><b>'+esc(x.title)+'</b><small>مهلت: '+esc(x.deadline||"تعیین نشده")+' · اولویت: '+esc(x.priority||"عادی")+'</small><p>'+esc(x.description||"")+'</p></div><div class="cc-inbox-actions"><button data-progress>ثبت گزارش پیشرفت</button><button data-complete>اعلام اتمام</button></div></article>').join("")+'</div>';
const title=host.querySelector(".dept2-page-head,.ops-intro");if(title)title.insertAdjacentElement("afterend",panel);else host.prepend(panel);
panel.addEventListener("click",e=>{const btn=e.target.closest("button");if(!btn)return;const row=btn.closest("[data-id]"),type=row.dataset.kind,record=(db[type]||[]).find(x=>String(x.id)===row.dataset.id);if(!record)return;
 if(btn.hasAttribute("data-progress")){const note=prompt("شرح اقدام انجام‌شده یا میزان پیشرفت را وارد کنید:");if(!note)return;record.updates=Array.isArray(record.updates)?record.updates:[];record.updates.push({date:new Date().toISOString(),department:names[id],note});record.status="در حال اجرا"}
 if(btn.hasAttribute("data-complete")){const note=prompt("خلاصه نتیجه و مستند انجام کار را وارد کنید:");if(!note)return;record.updates=Array.isArray(record.updates)?record.updates:[];record.updates.push({date:new Date().toISOString(),department:names[id],note});record.status="تکمیل‌شده"}
 record.updatedAt=new Date().toISOString();if(write(db))location.reload();
});
})();