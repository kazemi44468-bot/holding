(()=>{'use strict';
const KEY='shahrbehesht.departmentItems.v1';
const fa=n=>new Intl.NumberFormat('fa-IR').format(n);
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
const today=()=>new Intl.DateTimeFormat('fa-IR').format(new Date());
document.querySelectorAll('[data-dept-items]').forEach(root=>{
 const dept=root.dataset.deptItems, form=root.querySelector('[data-item-form]'), rows=root.querySelector('[data-item-rows]'), count=root.querySelector('[data-item-count]');
 const render=()=>{const all=read().filter(x=>x.dept===dept);count.textContent=fa(all.length)+' مورد';rows.innerHTML=all.length?all.slice().reverse().map(x=>'<tr><td>'+esc(x.title)+'</td><td><b>'+esc(x.value)+(x.unit?' '+esc(x.unit):'')+'</b></td><td>'+esc(x.period)+'</td><td><span class="item-state">'+esc(x.status)+'</span></td><td>'+esc(x.date)+'</td></tr>').join(''):'<tr><td colspan="5">هنوز آیتمی ثبت نشده است.</td></tr>'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form),title=String(d.get('title')||'').trim(),value=String(d.get('value')||'').trim();if(!title||!value)return;const all=read();all.push({id:Date.now(),dept,title,unit:String(d.get('unit')||'').trim(),value,period:String(d.get('period')||'ماهانه'),note:String(d.get('note')||'').trim(),status:'پیشنهادی',date:today()});save(all);form.reset();render()});
 render();
});
})();