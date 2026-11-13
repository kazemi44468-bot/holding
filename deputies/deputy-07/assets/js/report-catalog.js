(()=> {
 const root=document.getElementById("catalog-document");
 if(!root)return;
 const data=window.CITY_ORG_DATA;
 if(!data)return;
 const $=id=>document.getElementById(id);
 const fmt=n=>Number(n||0).toLocaleString("fa-IR");
 const sum=k=>data.departments.reduce((n,d)=>n+(Number(d[k])||0),0);
 const labels={month:"گزارش ماهانه",quarter:"گزارش فصلی",half:"گزارش شش‌ماهه",year:"گزارش سالانه",custom:"گزارش بازه دلخواه"};
 const scopes={all:"کل شرکت",operations:"عملکرد و عملیات",hr:"سرمایه انسانی",assets:"اموال و تجهیزات",executive:"دستورات و مصوبات"};
 const latin=s=>String(s||"").replace(/[۰-۹]/g,ch=>"۰۱۲۳۴۵۶۷۸۹".indexOf(ch)).replace(/-/g,"/");
 const dateKey=s=>latin(s).split("/").map(x=>x.padStart(2,"0")).join("/");
 function selectedOrders(from,to){
  const a=dateKey(from),b=dateKey(to);
  return data.orders.filter(o=>{const d=dateKey(o.date);return d>=a&&d<=b;});
 }
 function render(){
  const period=$("catalog-period").value,from=$("catalog-from").value.trim(),to=$("catalog-to").value.trim(),scope=$("catalog-scope").value;
  const invalid=!from||!to||dateKey(from)>dateKey(to);
  const orders=invalid?[]:selectedOrders(from,to);
  $("catalog-period-label").textContent=(labels[period]||labels.custom)+" · "+from+" تا "+to;
  $("catalog-generated").textContent="تاریخ تولید: "+new Intl.DateTimeFormat("fa-IR",{dateStyle:"long"}).format(new Date());
  const reportCode="SHB-"+dateKey(from).replaceAll("/","")+"-"+dateKey(to).replaceAll("/","");
  const code=$("catalog-report-id");if(code)code.textContent="شناسه گزارش: "+reportCode;
  const scopeNode=$("catalog-scope-label");if(scopeNode)scopeNode.textContent="دامنه گزارش: "+(scopes[scope]||scopes.all);
  const done=orders.filter(o=>o.status==="تکمیل‌شده").length;
  const late=orders.filter(o=>o.status==="معوق").length;
  const active=orders.length-done-late;
  const assetRows=data.departments.map(d=>{const a=data.inventories[d.code]||data.inventories[String(Number(d.code))]||[];return {name:d.name,rows:a,total:a.reduce((n,x)=>n+x[1],0),issued:a.reduce((n,x)=>n+(x[3]||0),0),available:a.reduce((n,x)=>n+(x[4]||0),0),repair:a.reduce((n,x)=>n+(x[5]||0),0),out:a.reduce((n,x)=>n+(x[6]||0),0)};});
  $("catalog-kpis").innerHTML=[["نیروی انسانی",fmt(sum("staff"))+" نفر"],["اقدامات ثبت‌شده","۷۷۸ مورد"],["دستورهای این بازه",fmt(orders.length)+" مورد"],["تکمیل‌شده",fmt(done)+" مورد"],["معوق",fmt(late)+" مورد"],["ساعات اضافه‌کاری",fmt(sum("ot"))+" ساعت · تجمیعی"]].map(x=>"<article><small>"+x[0]+"</small><b>"+x[1]+"</b></article>").join("");
  $("catalog-executive-summary").innerHTML=invalid?"<p>بازه تاریخ معتبر نیست. تاریخ شروع باید قبل از تاریخ پایان باشد.</p>":
   "<p>این گزارش، وضعیت شش اداره را در کنار ارجاعات دارای تاریخ در بازه انتخابی ارائه می‌کند. تعداد کارکنان شرکت "+fmt(sum("staff"))+" نفر و ساعات اضافه‌کاری تجمیعی "+fmt(sum("ot"))+" ساعت است.</p>"+
   "<p>در بازه انتخاب‌شده "+fmt(orders.length)+" دستور و پیگیری ثبت شده است؛ "+fmt(done)+" مورد تکمیل‌شده، "+fmt(active)+" مورد در جریان یا ابلاغ‌شده و "+fmt(late)+" مورد معوق است.</p>"+
   "<p>این گزارش، شاخص‌های منابع انسانی، اقدامات و دستورهای ثبت‌شده در بازه انتخابی را در کنار یکدیگر نمایش می‌دهد.</p>";
  $("catalog-departments").innerHTML=data.departments.map(d=>"<tr><td>"+d.code+" · "+d.name+"</td><td>"+fmt(d.staff)+"</td><td>"+fmt(d.records||0)+"</td><td>"+fmt(Math.round((d.records||0)*(d.completion||0)/100))+"</td><td>"+fmt(d.ot)+"</td><td>"+fmt(d.training)+"</td></tr>").join("");
  $("catalog-dept-notes").innerHTML=["برای سنجش عملکرد، کمیت اقدامات باید در کنار کیفیت، زمان پاسخ و میزان تحقق تعهدات ارزیابی شود.","مقایسه نهایی ادارات باید بر اساس داده‌های هم‌دوره و تعاریف شاخص یکسان انجام شود.","تغییرات شاخص‌ها در گزارش‌های دوره‌ای با شناسه گزارش و تاریخ ثبت نگهداری می‌شود."].map(x=>"<li>"+x+"</li>").join("");
  $("catalog-hr-kpis").innerHTML=[["کل کارکنان",fmt(sum("staff"))+" نفر"],["آموزش",fmt(sum("training"))+" ساعت"],["مرخصی",fmt(sum("leave"))+" روز"],["تشویق",fmt(sum("reward"))+" مورد"],["تذکر",fmt(sum("discipline"))+" مورد"],["رفاهیات",fmt(sum("benefits"))+" مورد"]].map(x=>"<article><small>"+x[0]+"</small><b>"+x[1]+"</b></article>").join("");
  $("catalog-hr-table").innerHTML=data.departments.map(d=>"<tr><td>"+d.name+"</td><td>"+fmt(d.staff)+"</td><td>"+fmt(d.ot)+"</td><td>"+fmt(d.training)+"</td><td>"+fmt(d.leave)+"</td><td>"+fmt(d.reward)+"</td><td>"+fmt(d.discipline)+"</td></tr>").join("");
  $("catalog-assets").innerHTML=assetRows.map(x=>"<tr><td>"+x.name+"</td><td>"+fmt(x.rows[0]?.[1]||0)+"</td><td>"+fmt(x.rows[1]?.[1]||0)+"</td><td>"+fmt(x.rows[2]?.[1]||0)+"</td><td>"+fmt(x.rows[3]?.[1]||0)+"</td><td>"+fmt(x.total)+"</td></tr>").join("");
  const assetStatus=$("catalog-asset-status");if(assetStatus)assetStatus.innerHTML=assetRows.map(x=>"<tr><td>"+x.name+"</td><td>"+fmt(x.issued)+"</td><td>"+fmt(x.available)+"</td><td>"+fmt(x.repair)+"</td><td>"+fmt(x.out)+"</td></tr>").join("");
  const assetsSummary=$("catalog-assets-summary");if(assetsSummary)assetsSummary.innerHTML=[["کل اقلام",assetRows.reduce((n,x)=>n+x.total,0)],["تحویل‌شده",assetRows.reduce((n,x)=>n+x.issued,0)],["موجودی آزاد",assetRows.reduce((n,x)=>n+x.available,0)],["در تعمیر",assetRows.reduce((n,x)=>n+x.repair,0)]].map(x=>"<article><small>"+x[0]+"</small><b>"+fmt(x[1])+" قلم</b></article>").join("");
  $("catalog-order-kpis").innerHTML=[["کل ارجاعات",orders.length],["تکمیل‌شده",done],["در جریان / ابلاغ",active],["معوق",late]].map(x=>"<article><small>"+x[0]+"</small><b>"+fmt(x[1])+" مورد</b></article>").join("");
  $("catalog-orders").innerHTML=orders.map(o=>"<tr><td>"+o.id+"</td><td>"+o.title+"</td><td>"+o.owner+" · "+data.byId(o.dept).name+"</td><td>"+o.date+"</td><td>"+o.deadline+"</td><td>"+fmt(o.progress)+"٪</td><td>"+o.status+"</td></tr>").join("")||"<tr><td colspan='7'>دستوری در بازه انتخاب‌شده ثبت نشده است.</td></tr>";
  const urgent=orders.filter(o=>o.status==="معوق"||o.status==="ابلاغ‌شده").map(o=>o.title+"؛ مخاطب: "+o.owner+"؛ مهلت: "+o.deadline);
  $("catalog-actions").innerHTML=(urgent.length?urgent:["ادامه پایش شاخص‌های کلیدی و ثبت گزارش‌های دوره‌ای"]).map(x=>"<li>"+x+"</li>").join("");
  const groups={all:[],operations:["catalog-departments","catalog-dept-notes","catalog-orders","catalog-order-kpis"],hr:["catalog-hr-kpis","catalog-hr-table"],assets:["catalog-assets","catalog-assets-summary","catalog-asset-status"],executive:["catalog-orders","catalog-order-kpis","catalog-actions"]};
  root.querySelectorAll(".catalog-page").forEach(page=>{page.classList.remove("catalog-hide");if(scope!=="all"){const ids=[...page.querySelectorAll("[id]")].map(n=>n.id);if(!ids.some(id=>(groups[scope]||[]).includes(id)))page.classList.add("catalog-hide");}});
 }
 $("catalog-period").addEventListener("change",()=>{const p=$("catalog-period").value;if(p==="month"){$("catalog-from").value="۱۴۰۵/۰۸/۰۱";$("catalog-to").value="۱۴۰۵/۰۸/۳۰";}if(p==="quarter"){$("catalog-from").value="۱۴۰۵/۰۷/۰۱";$("catalog-to").value="۱۴۰۵/۰۹/۳۰";}if(p==="half"){$("catalog-from").value="۱۴۰۵/۰۷/۰۱";$("catalog-to").value="۱۴۰۵/۱۲/۲۹";}if(p==="year"){$("catalog-from").value="۱۴۰۵/۰۱/۰۱";$("catalog-to").value="۱۴۰۵/۱۲/۲۹";}render();});
 $("catalog-generate").addEventListener("click",render);
 $("catalog-scope").addEventListener("change",render);
 $("catalog-print").addEventListener("click",()=>{render();window.print();});
 render();
})();