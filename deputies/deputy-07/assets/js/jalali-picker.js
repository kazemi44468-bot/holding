(()=>{
 "use strict";
 const persian=new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:"UTC"});
 const monthNames=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"],weekdays=["ش","ی","د","س","چ","پ","ج"],cache=new Map();
 const pad=n=>String(n).padStart(2,"0"),fa=n=>Number(n).toLocaleString("fa-IR");
 const parts=d=>{const p=persian.formatToParts(d);return {y:Number(p.find(x=>x.type==="year").value),m:Number(p.find(x=>x.type==="month").value),d:Number(p.find(x=>x.type==="day").value)};};
 const utc=(y,m,d)=>new Date(Date.UTC(y,m-1,d,12));
 function jalaliToDate(y,m,d){const key=[y,m,d].join("/");if(cache.has(key))return new Date(cache.get(key));const start=Date.UTC(y+621,0,1,12),end=Date.UTC(y+623,0,1,12);for(let t=start;t<end;t+=86400000){const date=new Date(t),p=parts(date);if(p.y===y&&p.m===m&&p.d===d){cache.set(key,t);return date;}}throw new Error("تبدیل تاریخ شمسی ناموفق بود.");}
 function parseIso(value){if(!value)return null;const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?utc(+m[1],+m[2],+m[3]):null;}
 const iso=d=>[d.getUTCFullYear(),pad(d.getUTCMonth()+1),pad(d.getUTCDate())].join("-");
 const dateLabel=value=>{const d=parseIso(value);if(!d)return "انتخاب تاریخ";const p=parts(d);return fa(p.y)+"/"+fa(p.m).padStart(2,"۰")+"/"+fa(p.d).padStart(2,"۰");};
 function attach(input){
  if(!input||input.dataset.jalaliPicker==="ready")return;const type=input.type;if(type!=="date"&&type!=="datetime-local")return;
  input.dataset.jalaliPicker="ready";input.dataset.jalaliOriginalType=type;
  const required=input.required,wrapper=document.createElement("div");wrapper.className="jalali-picker";input.insertAdjacentElement("afterend",wrapper);wrapper.append(input);input.classList.add("jalali-source");
  const trigger=document.createElement("button");trigger.type="button";trigger.className="jalali-date-trigger";trigger.textContent="انتخاب تاریخ";trigger.setAttribute("aria-label","انتخاب تاریخ شمسی");wrapper.append(trigger);
  let hour=null,minute=null;
  if(type==="datetime-local"){const timeBox=document.createElement("div");timeBox.className="jalali-time";hour=document.createElement("select");minute=document.createElement("select");hour.setAttribute("aria-label","ساعت");minute.setAttribute("aria-label","دقیقه");const h0=document.createElement("option");h0.value="";h0.textContent="ساعت";hour.append(h0);const m0=document.createElement("option");m0.value="";m0.textContent="دقیقه";minute.append(m0);for(let i=0;i<24;i++){const o=document.createElement("option");o.value=pad(i);o.textContent=fa(i).padStart(2,"۰");hour.append(o);}for(let i=0;i<60;i++){const o=document.createElement("option");o.value=pad(i);o.textContent=fa(i).padStart(2,"۰");minute.append(o);}timeBox.append(hour,minute);wrapper.append(timeBox);}
  const panel=document.createElement("div");panel.className="jalali-calendar-popup";panel.hidden=true;wrapper.append(panel);let shown=null;
  function sync(){const value=input.value||"",date=parseIso(value);trigger.textContent=date?dateLabel(value):"انتخاب تاریخ";if(type==="datetime-local"){const t=value.split("T")[1]||"";hour.value=t.slice(0,2);minute.value=t.slice(3,5);}trigger.classList.toggle("has-value",!!date);}
  function setValue(date){const dateValue=iso(date);if(type==="date")input.value=dateValue;else input.value=dateValue+"T"+(hour.value||"00")+":"+(minute.value||"00");sync();input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));panel.hidden=true;}
  function render(){
   if(!shown)shown=parts(parseIso(input.value)||new Date());const y=shown.y,m=shown.m,first=jalaliToDate(y,m,1),offset=(first.getUTCDay()+1)%7,next=m===12?jalaliToDate(y+1,1,1):jalaliToDate(y,m+1,1),days=Math.round((next-first)/86400000),current=parts(parseIso(input.value)||new Date());
   let html='<div class="jp-head"><button type="button" data-jp-prev aria-label="ماه قبل">‹</button><b>'+monthNames[m-1]+' '+fa(y)+'</b><button type="button" data-jp-next aria-label="ماه بعد">›</button></div><div class="jp-week">'+weekdays.map(x=>'<span>'+x+'</span>').join("")+'</div><div class="jp-days">';
   for(let i=0;i<42;i++){const day=i-offset+1;if(day<1||day>days){html+='<span class="jp-empty"></span>';continue;}const selected=current.y===y&&current.m===m&&current.d===day;html+='<button type="button" data-jp-day="'+day+'" class="'+(selected?"selected":"")+'">'+fa(day)+'</button>';}
   html+='</div><div class="jp-foot"><button type="button" data-jp-today>امروز</button><button type="button" data-jp-clear>پاک‌کردن</button></div>';panel.innerHTML=html;
   panel.querySelector("[data-jp-prev]").addEventListener("click",()=>{shown=m===1?{y:y-1,m:12,d:1}:{y:y,m:m-1,d:1};render();});
   panel.querySelector("[data-jp-next]").addEventListener("click",()=>{shown=m===12?{y:y+1,m:1,d:1}:{y:y,m:m+1,d:1};render();});
   panel.querySelectorAll("[data-jp-day]").forEach(btn=>btn.addEventListener("click",()=>setValue(jalaliToDate(y,m,Number(btn.dataset.jpDay)))));
   panel.querySelector("[data-jp-today]").addEventListener("click",()=>{const d=new Date();setValue(utc(d.getFullYear(),d.getMonth()+1,d.getDate()));});
   panel.querySelector("[data-jp-clear]").addEventListener("click",()=>{input.value="";sync();input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));panel.hidden=true;});
  }
  trigger.addEventListener("click",()=>{shown=parts(parseIso(input.value)||new Date());panel.hidden=!panel.hidden;if(!panel.hidden)render();});
  const setTime=()=>{if(input.value){input.value=input.value.split("T")[0]+"T"+(hour.value||"00")+":"+(minute.value||"00");input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));}};
  if(hour)hour.addEventListener("change",setTime);if(minute)minute.addEventListener("change",setTime);
  if(required){trigger.setAttribute("aria-required","true");input.addEventListener("invalid",()=>trigger.classList.add("invalid"));}sync();
 }
 function init(root=document){root.querySelectorAll('input[type="date"],input[type="datetime-local"]').forEach(attach);}
 document.addEventListener("click",e=>{document.querySelectorAll(".jalali-calendar-popup:not([hidden])").forEach(panel=>{if(!panel.parentElement.contains(e.target))panel.hidden=true;});});
 window.JalaliPicker={init,format:dateLabel,toGregorian:jalaliToDate,toJalali:parts};init();
 new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.matches?.('input[type="date"],input[type="datetime-local"]'))attach(n);init(n);}}))).observe(document.documentElement,{childList:true,subtree:true});
})();