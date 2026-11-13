(()=>{'use strict';
const root=document.querySelector('[data-inspection-workbench]');if(!root)return;
const KEY='shahrbehesht.inspection.department8.v1';
const labels={mission:'مأموریت بازرسی',research:'تحقیقات محلی',violation:'تخلف و نقص'};
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
const write=x=>{try{localStorage.setItem(KEY,JSON.stringify(x));return true}catch{return false}};
const localISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateFa=s=>{if(!s)return '—';const p=s.split('-');return p.length===3?new Intl.NumberFormat('fa-IR').format(Number(p[0]))+'/'+new Intl.NumberFormat('fa-IR').format(Number(p[1])).padStart(2,'۰')+'/'+new Intl.NumberFormat('fa-IR').format(Number(p[2])).padStart(2,'۰'):esc(s)};
const tbody=root.querySelector('[data-inspection-rows]'),count=root.querySelector('[data-inspection-count]');
const typeFilter=root.querySelector('[data-inspection-filter="type"]'),statusFilter=root.querySelector('[data-inspection-filter="status"]');
const render=()=>{
 const all=read(),type=typeFilter.value,status=statusFilter.value;
 const shown=all.filter(x=>(!type||x.type===type)&&(!status||x.status===status)).sort((a,b)=>b.created-a.created);
 count.textContent=fa(all.length)+' پرونده';
 tbody.innerHTML=shown.length?shown.map(x=>'<tr><td>'+labels[x.type]+'</td><td><b>'+esc(x.title)+'</b>'+(x.deadline?'<small class="inspection-subline">مهلت: '+dateFa(x.deadline)+'</small>':'')+'</td><td>'+esc(x.area||'—')+'</td><td>'+dateFa(x.date)+'</td><td><select data-record-status="'+esc(x.id)+'" aria-label="وضعیت '+esc(x.title)+'">'+['ثبت‌شده','ارجاع‌شده','در حال پیگیری','رفع‌شده','مختومه'].map(v=>'<option'+(x.status===v?' selected':'')+'>'+v+'</option>').join('')+'</select></td><td><button type="button" class="inspection-delete" data-record-delete="'+esc(x.id)+'">حذف</button></td></tr>').join(''):'<tr><td colspan="6" class="inspection-empty">پرونده‌ای مطابق فیلتر انتخاب‌شده وجود ندارد.</td></tr>';
};
root.querySelectorAll('[data-inspection-form]').forEach(form=>{
 const date=form.querySelector('[name="date"]');if(date)date.value=localISO();
 form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const d=new FormData(form),type=form.dataset.inspectionForm;
  const record={id:(window.crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)),type,title:String(d.get('title')||'').trim(),area:String(d.get('area')||'').trim(),date:String(d.get('date')||''),created:Date.now(),status:type==='violation'?String(d.get('status')||'ثبت‌شده'):'ثبت‌شده'};
  for(const k of ['assignee','priority','description','source','result','category','deadline']){const v=d.get(k);if(v)record[k]=String(v).trim()}
  const all=read();all.push(record);
  if(!write(all)){alert('فضای ذخیره‌سازی مرورگر در دسترس نیست؛ پرونده ذخیره نشد.');return}
  form.reset();if(date)date.value=localISO();render();
 });
});
typeFilter.addEventListener('change',render);statusFilter.addEventListener('change',render);
tbody.addEventListener('change',e=>{
 const sel=e.target.closest('[data-record-status]');if(!sel)return;
 const all=read(),item=all.find(x=>x.id===sel.dataset.recordStatus);if(!item)return;
 item.status=sel.value;write(all);render();
});
tbody.addEventListener('click',e=>{
 const btn=e.target.closest('[data-record-delete]');if(!btn)return;
 const all=read(),item=all.find(x=>x.id===btn.dataset.recordDelete);if(!item)return;
 if(!window.confirm('پرونده «'+item.title+'» از حافظه این مرورگر حذف شود؟'))return;
 write(all.filter(x=>x.id!==item.id));render();
});
render();
})();