/* موتور گزارش تلفیقی ادارات — محاسبه از داده‌های مشترک سازمان */
(()=> {
 "use strict";
 const root=document.querySelector("[data-report-builder]");
 if(!root)return;
 const data=window.CITY_ORG_DATA;
 if(!data||!Array.isArray(data.departments)){root.querySelector(".report-data-note").textContent="داده‌های پایه سازمان بارگذاری نشدند؛ گزارش قابل محاسبه نیست.";return;}
 const {departments,fmt,pct}=data;
 const activity={
  d1:{total:38,done:33,active:4,late:1},
  d2:{total:21,done:18,active:2,late:1},
  d3:{total:246,done:199,active:33,late:14},
  d4:{total:94,done:77,active:12,late:5},
  d6:{total:67,done:58,active:7,late:2},
  d7:{total:312,done:249,active:46,late:17},
  d8:{total:0,done:0,active:0,late:0}
 };
 const topics={
  actions:{label:"اقدامات ثبت‌شده",unit:"مورد",value:d=>activity[d.id].total},
  staff:{label:"نیروی انسانی",unit:"نفر",value:d=>d.staff},
  ot:{label:"ساعات اضافه‌کاری",unit:"ساعت",value:d=>d.ot},
  bonus:{label:"مبلغ اضافه‌کاری",unit:"میلیون تومان",value:d=>d.otAmount},
  skill:{label:"نیروهای دارای تحصیلات دانشگاهی",unit:"نفر",value:d=>d.education},
  reward:{label:"تشویقات ثبت‌شده",unit:"مورد",value:d=>d.reward},
  discipline:{label:"تذکرات و تنبیهات",unit:"مورد",value:d=>d.discipline},
  done:{label:"اقدامات تکمیل‌شده",unit:"مورد",value:d=>activity[d.id].done},
  completion:{label:"نرخ تحقق برنامه",unit:"درصد",value:d=>d.completion}
 };
 const colors=["#64866c","#7898a8","#b39a6d","#8f83a5","#6c9a94","#a47f78"];
 const q=s=>root.querySelector(s);
 const topic=q('[name="topic"]'), checks=[...root.querySelectorAll('[data-dept]')];
 const selected=()=>departments.filter(d=>checks.some(c=>c.checked&&c.dataset.dept===d.id));
 const total=(arr,fn)=>arr.reduce((n,d)=>n+fn(d),0);
 const weighted=(arr,key)=>{const weight=total(arr,d=>activity[d.id]?.total||0);return weight?Math.round(total(arr,d=>(d[key]||0)*(activity[d.id]?.total||0))/weight):0;};
 const fmtValue=n=>fmt(Math.round(n*10)/10);
 const safeWidth=n=>Math.max(0,Math.min(100,Number(n)||0));
 function render(){
  const arr=selected(),t=topics[topic.value]||topics.actions;
  const values=arr.map(d=>({d,value:t.value(d)}));
  const metricTotal=total(arr,d=>t.value(d));
  const actionTotal=total(arr,d=>activity[d.id].total);
  const doneTotal=total(arr,d=>activity[d.id].done);
  const staffTotal=total(arr,d=>d.staff);
  const completion=weighted(arr,"completion");
  q("#report-selected-count").textContent=fmt(arr.length)+" اداره انتخاب‌شده";
  q("#report-metric-label").textContent=t.label;
  q("#report-metric-total").textContent=fmtValue(metricTotal)+(t.unit==="درصد"?"٪":"");
  q("#report-metric-unit").textContent=t.unit+" · مجموع ادارات انتخاب‌شده";
  q("#report-staff-total").textContent=fmt(staffTotal);
  q("#report-actions-total").textContent=fmt(actionTotal);
  q("#report-completion").textContent=pct(completion);
  q("#report-period-label").textContent="داده‌های تجمیعی موجود";
  q("#report-chart-title").textContent="مقایسه "+t.label+" بین ادارات";
  q("#report-chart-sub").textContent="مبنای مقایسه: داده‌های ثبت‌شده برای ادارات انتخاب‌شده";
  q("#report-bars").innerHTML=values.length?values.map(({d,value},i)=>{
   const max=Math.max(1,...values.map(x=>x.value));
   const width=safeWidth(value/max*100);
   return '<div class="report-bar-row"><div class="report-bar-label"><b>'+d.name+'</b><strong>'+fmtValue(value)+(t.unit==="درصد"?"٪":"")+'</strong></div><div class="report-bar-track"><i style="width:'+width+'%;background:'+colors[i%colors.length]+'"></i></div></div>';
  }).join(""):'<p class="report-empty">برای نمایش گزارش، دست‌کم یک اداره را انتخاب کنید.</p>';
  const sumValues=metricTotal||0;
  let offset=0,stops=[];
  values.forEach(({value},i)=>{const share=sumValues?value/sumValues*100:0;stops.push(colors[i%colors.length]+" "+offset+"% "+(offset+share)+"%");offset+=share;});
  q("#report-donut").style.background=values.length&&sumValues?"conic-gradient("+stops.join(",")+")":"conic-gradient(#e7ece7 0 100%)";
  q("#report-donut-total").textContent=fmtValue(sumValues)+(t.unit==="درصد"?"٪":"");
  q("#report-legend").innerHTML=values.map(({d,value},i)=>'<span><i style="background:'+colors[i%colors.length]+'"></i>'+d.name+' · '+fmtValue(value)+'</span>').join("")||'<span>داده‌ای برای نمایش نیست</span>';
  q("#report-trend").innerHTML=arr.length?arr.map(d=>{
   const metrics=[["تحقق برنامه",d.completion],["به‌موقع بودن",d.onTime],["کیفیت خدمت",d.quality],["مستندسازی",d.records]];
   return '<div class="report-profile-row"><b>'+d.name+'</b><div class="report-profile-metrics">'+metrics.map(([label,value])=>'<div><span>'+label+'</span><i><em style="width:'+safeWidth(value)+'%"></em></i><strong>'+pct(value)+'</strong></div>').join("")+'</div></div>';
  }).join(""):'<p class="report-empty">برای نمایش پروفایل، دست‌کم یک اداره را انتخاب کنید.</p>';
  q("#report-trend-legend").innerHTML='<span>مبنای شاخص‌ها: درصد</span>';
  const tbody=q("#report-comparison-table tbody");
  tbody.innerHTML=arr.map(d=>'<tr><td>'+d.code+' · '+d.name+'</td><td>'+fmtValue(t.value(d))+(t.unit==="درصد"?"٪":" "+t.unit)+'</td><td>'+fmt(d.staff)+'</td><td>'+fmt(activity[d.id].total)+'</td><td>'+fmt(activity[d.id].done)+'</td><td>'+fmt(activity[d.id].active)+'</td><td>'+fmt(activity[d.id].late)+'</td><td>'+pct(d.completion)+'</td></tr>').join("")||'<tr><td colspan="8">اداره‌ای انتخاب نشده است.</td></tr>';
 }
 const requestedDept=new URLSearchParams(window.location.search).get("dept");
 if(requestedDept&&checks.some(c=>c.dataset.dept===requestedDept)){checks.forEach(c=>c.checked=c.dataset.dept===requestedDept);}
 checks.forEach(c=>c.addEventListener("change",render));
 topic.addEventListener("change",render);
 q("#select-all-depts").addEventListener("click",()=>{checks.forEach(c=>c.checked=true);render();});
 q("#clear-depts").addEventListener("click",()=>{checks.forEach(c=>c.checked=false);render();});
 q("#print-dept-report").addEventListener("click",()=>window.print());
 render();
})();