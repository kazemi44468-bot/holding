(()=>{"use strict";
const modules=[
{id:"guides",title:"بانک شیوه‌نامه‌ها",desc:"ثبت، طبقه‌بندی، جست‌وجو و نگهداری نسخه‌های شیوه‌نامه",subs:[["bank","مشاهده بانک"],["new","ثبت شیوه‌نامه جدید"]]},
{id:"processes",title:"بانک فرایندهای کاری",desc:"مستندسازی فرایندها، مراحل اجرا و مسئولیت‌ها",subs:[["bank","مشاهده فرایندها"],["new","ثبت فرایند جدید"]]},
{id:"training",title:"مرکز آموزش",desc:"برنامه دوره‌ها، کارگاه‌ها و سوابق آموزشی",subs:[["bank","برنامه‌ها و دوره‌ها"],["new","ثبت دوره یا کارگاه"]]},
{id:"actions",title:"اقدامات جاری و پیگیری دستورات",desc:"ثبت اقدام، تعیین مسئول، مهلت و پایش وضعیت اجرا",subs:[["bank","فهرست اقدامات"],["new","ثبت اقدام جدید"]]},
{id:"calendar",title:"تقویم",desc:"جلسات، رویدادها و برنامه‌های زمان‌بندی‌شده اداره",subs:[["bank","مشاهده رویدادها"],["new","ثبت رویداد"]]},
{id:"knowledge",title:"ثبت دانش و تجربه‌نگاری‌ها",desc:"ثبت تجربه‌ها، درس‌آموخته‌ها و دانش سازمانی",subs:[["bank","بانک دانش و تجربه‌ها"],["new","ثبت تجربه جدید"]]},
{id:"worksheets",title:"کاربرگ‌ها",desc:"بانک فرم‌ها و کاربرگ‌های تخصصی و سوابق تکمیل",subs:[["bank","بانک کاربرگ‌ها"],["new","ثبت کاربرگ"]]}
];
const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const path=(file)=>new URL(file,document.baseURI).href;
const current=new URL(location.href),isModule=current.pathname.endsWith("department-2-module.html");
const moduleId=current.searchParams.get("module")||"guides",view=current.searchParams.get("view")||"bank",mod=modules.find(m=>m.id===moduleId)||modules[0];
const root=document.querySelector(".ops-main")||document.querySelector("main");
if(!root)return;
const nav=()=>'<aside class="dept2-sidebar"><div class="dept2-side-brand"><small>معاونت ۷ · اداره ۰۲</small><b>تحقیق و توسعه</b></div><a class="dept2-side-home" href="department-2.html">⌂　نمای کلی اداره</a>'+modules.map(m=>'<details class="dept2-side-group" '+(m.id===moduleId?'open':'')+'><summary>'+m.title+'</summary><div class="dept2-side-sub">'+m.subs.map(([v,t])=>'<a class="'+(m.id===moduleId&&view===v&&isModule?'active':'')+'" href="department-2-module.html?module='+m.id+'&view='+v+'">'+t+'</a>').join('')+'</div></details>').join('')+'<a class="dept2-side-link" href="../dashboard.html">بازگشت به ورود معاونت ۷</a></aside>';
let layout=document.querySelector(".dept2-layout");
if(!layout){layout=document.createElement("div");layout.className="dept2-layout";root.parentNode.insertBefore(layout,root);layout.append(nav());layout.append(root);root.classList.add("dept2-main");}
if(isModule)renderModule();else renderDashboard();
function read(id){try{return JSON.parse(localStorage.getItem("deputy7.dept2.module."+id)||"[]")}catch{return[]}}
function write(id,rows){localStorage.setItem("deputy7.dept2.module."+id,JSON.stringify(rows))}
function renderDashboard(){
 const old=document.getElementById("dept2-overview");if(old)old.remove();
 const box=document.createElement("section");box.id="dept2-overview";box.innerHTML='<div class="dept2-page-head"><div><span class="dept2-kicker">محیط تخصصی اداره · کد ۰۲</span><h1>نمای کلی تحقیق و توسعه</h1><p>وضعیت بانک‌ها، برنامه‌ها، اقدامات و دانش ثبت‌شده اداره</p></div><a class="dept2-btn" href="../dashboard.html">ورود به معاونت ۷</a></div><div class="dept2-stat-grid">'+[
["شیوه‌نامه‌ها","guides"],["فرایندهای کاری","processes"],["دوره‌های آموزشی","training"],["اقدامات جاری","actions"],["رویدادهای تقویم","calendar"],["دانش و تجربه‌ها","knowledge"],["کاربرگ‌ها","worksheets"]].map(([t,id])=>'<div class="dept2-stat"><small>'+t+'</small><b data-count="'+id+'">'+read(id).length.toLocaleString("fa-IR")+'</b><span>رکورد ذخیره‌شده در این مرورگر</span></div>').join("")+'</div><div class="dept2-page-head"><div><span class="dept2-kicker">دسترسی به بخش‌ها</span><h2>ماژول‌های اداره</h2></div></div><div class="dept2-module-grid">'+modules.map(m=>'<a class="dept2-module-card" href="department-2-module.html?module='+m.id+'&view=bank"><small>بخش تخصصی</small><b>'+m.title+'</b><span>'+m.desc+'</span><em>'+read(m.id).length.toLocaleString("fa-IR")+' رکورد · مشاهده بانک ←</em></a>').join("")+'</div><div class="dept2-note">آمار ماژول‌های بالای صفحه از داده‌های ذخیره‌شده در همین مرورگر محاسبه می‌شود. شاخص‌ها و سوابق ثابت بخش‌های قدیمی‌تر صفحه، محتوای نمونه اولیه‌اند و هنوز به بانک‌های جدید متصل نشده‌اند.</div>';
 root.insertBefore(box,root.firstChild);
}
function renderModule(){
 const legacy=[...root.children];legacy.forEach(n=>n.remove());
 root.innerHTML='<section class="dept2-page-head"><div><span class="dept2-kicker">تحقیق و توسعه · ماژول تخصصی</span><h1>'+mod.title+'</h1><p>'+mod.desc+'</p></div><a class="dept2-btn" href="department-2.html">نمای کلی اداره</a></section><div class="dept2-stat-grid"><div class="dept2-stat"><small>کل رکوردها</small><b id="m-total">۰</b><span>ذخیره‌شده در این مرورگر</span></div><div class="dept2-stat"><small>در حال اجرا / فعال</small><b id="m-active">۰</b><span>بر اساس وضعیت رکوردها</span></div><div class="dept2-stat"><small>تکمیل‌شده</small><b id="m-done">۰</b><span>رکوردهای خاتمه‌یافته</span></div><div class="dept2-stat"><small>آخرین ثبت</small><b id="m-last">—</b><span>تاریخ ثبت محلی</span></div></div><div class="dept2-toolbar"><div class="dept2-module-actions"><a class="dept2-btn '+(view==="bank"?"primary":"")+'" href="?module='+mod.id+'&view=bank">مشاهده بانک</a><a class="dept2-btn '+(view==="new"?"primary":"")+'" href="?module='+mod.id+'&view=new">ثبت جدید</a></div><input id="m-search" type="search" placeholder="جست‌وجو در عنوان، مسئول یا شرح..."></div><div id="m-content"></div>';
 const rows=read(mod.id),content=$("#m-content");
 if(view==="new")form();else list();
 stats();
 $("#m-search").addEventListener("input",()=>list($("#m-search").value));
 function stats(){const all=read(mod.id);$("#m-total").textContent=all.length.toLocaleString("fa-IR");$("#m-active").textContent=all.filter(x=>!["تکمیل‌شده","مختومه","غیرفعال"].includes(x.status)).length.toLocaleString("fa-IR");$("#m-done").textContent=all.filter(x=>["تکمیل‌شده","مختومه"].includes(x.status)).length.toLocaleString("fa-IR");$("#m-last").textContent=all[0]?.date||"—";}
 function form(edit){
 const old=edit||{};
 content.innerHTML='<div class="dept2-form-card"><h2>'+ (edit?"ویرایش رکورد":"ثبت مورد جدید")+'</h2><form class="dept2-form" id="module-form"><label>عنوان<input name="title" required maxlength="140" value="'+esc(old.title)+'" placeholder="عنوان را وارد کنید"></label><label>دسته‌بندی / نوع<input name="category" maxlength="80" value="'+esc(old.category)+'" placeholder="نوع یا دسته‌بندی"></label><label>مسئول پیگیری<input name="owner" maxlength="80" value="'+esc(old.owner)+'" placeholder="نام مسئول"></label><label>وضعیت<select name="status">'+["در انتظار","در حال اجرا","تکمیل‌شده","مختومه","غیرفعال"].map(s=>'<option '+(old.status===s?'selected':'')+'>'+s+'</option>').join("")+'</select></label><label>تاریخ شمسی<input name="date" value="'+esc(old.date||"")+'" placeholder="۱۴۰۵/۰۹/۰۱"></label><label>مهلت / تاریخ اجرا<input name="due" value="'+esc(old.due||"")+'" placeholder="۱۴۰۵/۰۹/۱۵"></label><label class="wide">شرح و توضیحات<textarea name="description" maxlength="3000" placeholder="شرح، مراحل، نتیجه یا نکات مرتبط">'+esc(old.description)+'</textarea></label><div class="wide dept2-module-actions"><button class="dept2-btn primary" type="submit">'+(edit?"ذخیره تغییرات":"ثبت در بانک")+'</button><a class="dept2-btn" href="?module='+mod.id+'&view=bank">انصراف</a></div></form></div>';
 $("#module-form").addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const all=read(mod.id);if(edit){const i=all.findIndex(x=>x.id===edit.id);if(i>=0)all[i]={...all[i],...data,updated:new Date().toLocaleDateString("fa-IR")};}else all.unshift({...data,id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),date:data.date||new Date().toLocaleDateString("fa-IR"),created:new Date().toLocaleDateString("fa-IR")});write(mod.id,all);location.href="?module="+mod.id+"&view=bank";});
 }
 function list(q=""){
 const all=read(mod.id).filter(x=>!q||[x.title,x.category,x.owner,x.description].join(" ").toLocaleLowerCase("fa").includes(q.toLocaleLowerCase("fa")));
 content.innerHTML=all.length?'<div class="dept2-table-wrap"><table class="dept2-table"><thead><tr><th>عنوان</th><th>دسته‌بندی</th><th>مسئول</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>'+all.map(x=>'<tr><td><b>'+esc(x.title)+'</b>'+(x.description?'<div>'+esc(x.description.slice(0,100))+'</div>':'')+'</td><td>'+esc(x.category||"—")+'</td><td>'+esc(x.owner||"—")+'</td><td><span class="dept2-badge">'+esc(x.status)+'</span></td><td>'+esc(x.date||"—")+'</td><td><div class="dept2-module-actions"><button class="dept2-btn" data-edit="'+x.id+'">ویرایش</button><button class="dept2-btn danger" data-delete="'+x.id+'">حذف</button></div></td></tr>').join("")+'</tbody></table></div>':'<div class="dept2-empty">موردی در این بانک ثبت نشده است. برای شروع از گزینه «ثبت جدید» استفاده کنید.</div>';
 content.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>form(read(mod.id).find(x=>x.id===b.dataset.edit))));
 content.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{if(!confirm("این رکورد حذف شود؟"))return;write(mod.id,read(mod.id).filter(x=>x.id!==b.dataset.delete));stats();list($("#m-search").value)}));
 }
}
})();