(()=> {
 const roots=document.querySelectorAll("[data-dept-calendar]");
 if(!roots.length)return;
 const parts=d=>new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"numeric"}).formatToParts(d);
 const key=d=>{const p=parts(d);return p.find(x=>x.type==="year").value+"/"+p.find(x=>x.type==="month").value;};
 const firstOf=d=>{const x=new Date(d);x.setHours(12,0,0,0);const k=key(x);while(true){const p=new Date(x);p.setDate(p.getDate()-1);if(key(p)!==k)break;x.setTime(p.getTime());}return x;};
 const daysIn=(d)=>{const k=key(d),x=new Date(d);let n=0;while(key(x)===k){n++;x.setDate(x.getDate()+1);}return n;};
 const dayText=d=>new Intl.DateTimeFormat("fa-IR-u-ca-persian",{day:"numeric"}).format(d);
 const monthText=d=>new Intl.DateTimeFormat("fa-IR-u-ca-persian",{month:"long",year:"numeric"}).format(d);
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 roots.forEach(root=>{
  const grid=root.querySelector("[data-mini-grid]"),label=root.querySelector("[data-mini-month]");
  const cards=[...root.querySelectorAll(".dept-calendar-event[data-date]")];
  const prev=root.querySelector("[data-mini-prev]"),next=root.querySelector("[data-mini-next]"),reset=root.querySelector("[data-mini-reset]"),status=root.querySelector("[data-mini-status]");
  if(!grid||!label)return;
  let selected="",month=firstOf(new Date());
  function render(){
   label.textContent=monthText(month);
   const offset=(month.getDay()+1)%7,total=daysIn(month),rows=Math.ceil((offset+total)/7),today=iso(new Date());
   let html="";
   for(let i=0;i<rows*7;i++){
    const d=new Date(month);d.setDate(d.getDate()-offset+i);
    const date=iso(d),has=cards.some(card=>card.dataset.date===date);
    const outside=key(d)!==key(month);
    const cls=["calendar-day",outside?"outside":"",selected===date?"selected":"",today===date?"today":""].filter(Boolean).join(" ");
    html+='<button type="button" class="'+cls+'" data-mini-day="'+date+'"><b>'+dayText(d)+'</b><i>'+(has?'<em class="action"></em>':"")+'</i></button>';
   }
   grid.innerHTML=html;
   grid.querySelectorAll("[data-mini-day]").forEach(button=>button.addEventListener("click",()=>{
    selected=button.dataset.miniDay;
    const d=new Date(selected+"T12:00:00");
    if(key(d)!==key(month))month=firstOf(d);
    const found=cards.filter(card=>card.dataset.date===selected);
    cards.forEach(card=>card.hidden=selected!==""&&card.dataset.date!==selected);
    status.textContent=found.length?found.length+" برنامه در این تاریخ ثبت شده است.":"برای این تاریخ برنامه‌ای ثبت نشده است.";
    render();
   }));
  }
  prev?.addEventListener("click",()=>{const d=new Date(month);d.setDate(d.getDate()-1);month=firstOf(d);render();});
  next?.addEventListener("click",()=>{const d=new Date(month);d.setDate(d.getDate()+daysIn(month));month=firstOf(d);render();});
  reset?.addEventListener("click",()=>{selected="";cards.forEach(card=>card.hidden=false);status.textContent="روزهای دارای برنامه با نشان مشخص شده‌اند.";render();});
  render();
 });
})();