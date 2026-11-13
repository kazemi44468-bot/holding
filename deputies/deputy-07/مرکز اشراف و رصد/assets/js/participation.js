(()=>{'use strict';
const KEY='shahrbehesht.surveys.v1';
const names={'1':'اداری و پشتیبانی','2':'تحقیق و توسعه','3':'پارکبان و معبربانان','4':'تأسیسات فنی و نگهداری','6':'فاوا و خدمات فنی','7':'جمع‌آوری و بازیافت پسماند','8':'بازرسی و تحقیقات محلی',company:'ستاد / کل شرکت'};
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
let surveys=read();
const surveyForm=document.getElementById('survey-form'),resultForm=document.getElementById('result-form'),select=document.getElementById('result-survey'),archive=document.getElementById('survey-archive'),filter=document.getElementById('survey-filter');const initialDept=new URLSearchParams(location.search).get('dept');if(initialDept&&Array.from(filter.options).some(o=>o.value===initialDept))filter.value=initialDept;
function totalVotes(s){return (s.results||[]).reduce((n,r)=>n+(Number(r.count)||0),0)}
function refreshSelect(){const old=select.value;select.innerHTML='<option value="">انتخاب نظرسنجی</option>'+surveys.slice().reverse().map(s=>'<option value="'+esc(s.id)+'">'+esc(s.title)+' — '+esc(names[s.dept]||s.dept)+'</option>').join('');if(surveys.some(s=>s.id===old))select.value=old}
function render(){
 const votes=surveys.reduce((n,s)=>n+(Number(s.respondents)||0),0),depts=new Set(surveys.map(s=>s.dept));
 document.getElementById('survey-count').textContent=fa(surveys.length);
 document.getElementById('survey-total').textContent=fa(surveys.length);
 document.getElementById('survey-votes').textContent=fa(votes);
 document.getElementById('survey-depts').textContent=fa(depts.size);
 const dates=surveys.map(s=>s.date).filter(Boolean);document.getElementById('survey-last').textContent=dates.length?esc(dates[dates.length-1]):'—';
 refreshSelect();
 const chosen=filter.value,items=surveys.filter(s=>!chosen||s.dept===chosen).slice().reverse();
 archive.innerHTML=items.length?items.map(s=>{
  const total=totalVotes(s),respondents=Number(s.respondents)||0,pop=Number(s.population)||0;
  const bars=(s.results||[]).slice().sort((a,b)=>(+b.count||0)-(+a.count||0));
  const resultHtml=bars.length?'<div class="survey-chart" role="img" aria-label="نمودار نتایج '+esc(s.title)+'">'+bars.map(r=>{const pct=total?Math.round((+r.count||0)*100/total):0;return '<div class="survey-result-row"><div class="survey-result-label"><b>'+esc(r.label)+'</b><strong>'+fa(+r.count||0)+' <small>('+fa(pct)+'٪)</small></strong></div><div class="survey-bar"><span style="width:'+pct+'%"></span></div>'+(r.note?'<small class="survey-result-note">'+esc(r.note)+'</small>':'')+'</div>'}).join('')+'</div>':'<div class="survey-empty survey-empty-small"><b>نتیجه‌ای وارد نشده است</b><span>از فرم گام دوم، گزینه‌ها و تعداد پاسخ‌های هرکدام را اضافه کنید.</span></div>';
  const mismatch=total!==respondents?'<p class="survey-data-note">'+(total===0?'برای این نظرسنجی هنوز نتیجه گزینه‌ها ثبت نشده است.': 'مجموع گزینه‌های ثبت‌شده ('+fa(total)+') با تعداد پاسخ‌دهندگان ('+fa(respondents)+') برابر نیست؛ داده‌ها را بازبینی کنید.')+'</p>':'';
  return '<article class="survey-report-card"><header><div><span class="survey-topic">'+esc(s.topic)+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(names[s.dept]||s.dept)+' · '+esc(s.date)+' · '+esc(s.method||'روش ثبت نشده')+'</p></div><span class="survey-report-number">'+fa(total)+'</span></header><div class="survey-report-meta"><span>پاسخ‌دهندگان: <b>'+fa(respondents||total)+'</b></span><span>جامعه آماری: <b>'+fa(pop||0)+'</b></span><span>نرخ مشارکت: <b>'+(pop&&respondents?fa(Math.round(respondents*100/pop))+'٪':'—')+'</b></span></div>'+(s.description?'<p class="survey-description">'+esc(s.description)+'</p>':'')+'<div class="survey-chart-heading"><b>توزیع پاسخ‌ها</b><span>مبنای درصد: مجموع گزینه‌های ثبت‌شده</span></div>'+resultHtml+mismatch+'</article>'
 }).join(''):'<div class="survey-empty"><b>برای این فیلتر گزارشی وجود ندارد</b><span>با ثبت گزارش‌های نظرسنجی، آرشیو و نمودارهای این بخش تکمیل می‌شوند.</span></div>';
}
surveyForm.addEventListener('submit',ev=>{ev.preventDefault();const x=Object.fromEntries(new FormData(surveyForm).entries());x.population=Number(x.population)||0;x.respondents=Number(x.respondents)||0;if(x.population>0&&x.respondents>x.population){alert('تعداد پاسخ‌دهندگان نمی‌تواند از جامعه آماری بیشتر باشد.');return;}x.id=String(Date.now());x.results=[];surveys.push(x);save(surveys);surveyForm.reset();render();select.value=x.id;document.getElementById('result-form').scrollIntoView({behavior:'smooth',block:'center'})});
resultForm.addEventListener('submit',ev=>{ev.preventDefault();const x=Object.fromEntries(new FormData(resultForm).entries());const s=surveys.find(q=>q.id===x.surveyId);if(!s)return;if(!Number.isInteger(Number(x.count))||Number(x.count)<0){alert('تعداد پاسخ باید عدد صحیح و نامنفی باشد.');return;}s.results=s.results||[];const existing=s.results.find(r=>r.label.trim().toLocaleLowerCase()===x.label.trim().toLocaleLowerCase());if(existing){existing.count=Number(existing.count||0)+Number(x.count||0);if(x.note)existing.note=x.note}else{s.results.push({label:x.label.trim(),count:Number(x.count)||0,note:x.note||''})}save(surveys);const keep=s.id;resultForm.reset();select.value=keep;render();select.value=keep});
filter.addEventListener('change',render);
render();
})();