import {Vault} from "./engine.js";
const ENTITY="personnel",MIN_CODE=1000,SLOT_COUNT=250,REF_KEYS=new Set(["personnelCode","staffCode","employeeCode","personnelId","supervisorCode","managerPersonnelCode","ownerCode","assigneeCode"]);
const blank=(code)=>({code:String(code),status:"empty",profile:{firstName:"",lastName:"",nationalCode:"",birthDate:"",gender:"",mobile:"",phone:"",email:"",address:"",departmentId:"",unit:"",jobTitle:"",employmentType:"",hireDate:"",contractEnd:"",education:"",fieldOfStudy:"",specialty:"",supervisorCode:"",workLocation:"",notes:""},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),revision:1});
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fa=n=>Number(n||0).toLocaleString("fa-IR");
async function ensureUnlocked(){
 try{Vault.ensure();return true;}catch{}
 const s=await Vault.status();
 let pass=prompt(s.exists?"برای دسترسی به بانک رمزگذاری‌شده پرسنل، گذرواژه اصلی مخزن را وارد کنید:":"برای ایجاد بانک رمزگذاری‌شده پرسنل، یک گذرواژه اصلی حداقل ۱۲ نویسه‌ای تعیین کنید:");
 if(!pass)return false;
 try{await Vault.unlock(pass);return true;}catch(e){alert(e.message);return false;}
}
async function list(){
 Vault.ensure();const snap=await Vault.snapshot();
 return snap.records.filter(r=>r.entity===ENTITY).map(r=>r.data).sort((a,b)=>Number(a.code)-Number(b.code));
}
async function get(code){return (await list()).find(x=>String(x.code)===String(code))||null;}
async function initialize(){
 Vault.ensure();const current=await list(),have=new Set(current.map(x=>String(x.code))),missing=[];
 for(let i=0;i<SLOT_COUNT;i++){const code=String(MIN_CODE+i);if(!have.has(code))missing.push(code);}
 for(const code of missing)await Vault.add(ENTITY,code,"upsert",blank(code));
 return {total:SLOT_COUNT,created:missing.length,records:await list()};
}
async function save(code,profile){
 Vault.ensure();code=String(code).trim();if(!/^\d{4,}$/.test(code)||Number(code)<MIN_CODE)throw Error("کد پرسنلی باید عددی و از ۱۰۰۰ به بالا باشد.");
 const prior=await get(code);if(!prior)throw Error("کد پرسنلی در بانک رزروشده پیدا نشد.");
 if(!String(profile.firstName||"").trim()||!String(profile.lastName||"").trim())throw Error("نام و نام خانوادگی الزامی است.");
 const nationalCode=String(profile.nationalCode||"").trim();if(nationalCode&&nationalCode.length!==10)throw Error("کد ملی باید ۱۰ رقم باشد.");if(nationalCode&&(await list()).some(r=>r.code!==code&&r.profile?.nationalCode===nationalCode))throw Error("این کد ملی قبلاً در پرونده دیگری ثبت شده است.");
 const clean={...blank(code),...prior,profile:{...blank(code).profile,...(prior.profile||{}),...profile},status:profile.recordStatus==="inactive"?"inactive":(profile.firstName||profile.lastName)?"active":(prior.status==="inactive"?"inactive":"empty"),updatedAt:new Date().toISOString(),revision:(prior.revision||0)+1};
 await Vault.add(ENTITY,code,"upsert",clean);
 try{const key="deputy7.identity-access.v1",s=JSON.parse(localStorage.getItem(key)||"null");if(s?.users){s.users=s.users.map(u=>u.personnelCode===code?{...u,name:(clean.profile.firstName+" "+clean.profile.lastName).trim()||u.name,title:clean.profile.jobTitle||u.title,unit:clean.profile.unit||u.unit,departments:clean.profile.departmentId?[clean.profile.departmentId]:u.departments}:u);localStorage.setItem(key,JSON.stringify(s));}}catch{}
 await Vault.add("personnel-audit",crypto.randomUUID(),"upsert",{action:"save",code,at:new Date().toISOString()});
 return clean;
}
function replaceRefs(value,oldCode,newCode,key=""){
 if(Array.isArray(value))return value.map(v=>replaceRefs(v,oldCode,newCode,key));
 if(value&&typeof value==="object"){const out={};for(const [k,v] of Object.entries(value))out[k]=REF_KEYS.has(k)&&String(v)===String(oldCode)?String(newCode):replaceRefs(v,oldCode,newCode,k);return out;}
 return value;
}
async function changeCode(oldCode,newCode){
 Vault.ensure();oldCode=String(oldCode);newCode=String(newCode).trim();
 if(!/^\d{4,}$/.test(newCode)||Number(newCode)<MIN_CODE||Number(newCode)>=MIN_CODE+SLOT_COUNT)throw Error("کد جدید باید در بازه ۱۰۰۰ تا ۱۲۴۹ باشد.");
 if(oldCode===newCode)return await get(oldCode);
 const source=await get(oldCode);if(!source)throw Error("کد فعلی پیدا نشد.");
 const target=await get(newCode);if(target&&target.status!=="empty")throw Error("کد جدید قبلاً به فرد دیگری تخصیص یافته است.");if(target)await Vault.add(ENTITY,newCode,"delete",target);
 const snap=await Vault.snapshot();
 for(const r of snap.records){
  if(r.entity===ENTITY&&String(r.recordId)===oldCode)continue;
  const updated=replaceRefs(r.data,oldCode,newCode);
  if(JSON.stringify(updated)!==JSON.stringify(r.data))await Vault.add(r.entity,r.recordId,"upsert",updated);
 }
 for(let i=0;i<localStorage.length;i++){
  const key=localStorage.key(i);if(!key)continue;const raw=localStorage.getItem(key);if(!raw)continue;
  try{const parsed=JSON.parse(raw),updated=replaceRefs(parsed,oldCode,newCode);if(JSON.stringify(updated)!==JSON.stringify(parsed))localStorage.setItem(key,JSON.stringify(updated));}catch{}
 }
 const moved={...source,code:newCode,profile:replaceRefs(source.profile,oldCode,newCode),updatedAt:new Date().toISOString(),revision:(source.revision||0)+1};
 await Vault.add(ENTITY,newCode,"upsert",moved);
 await Vault.add(ENTITY,oldCode,"delete",{...source,code:oldCode,replacedBy:newCode,updatedAt:new Date().toISOString()});
 await Vault.add("personnel-audit",crypto.randomUUID(),"upsert",{action:"recode",oldCode,newCode,at:new Date().toISOString()});
 return moved;
}
function canManagePersonnel(){try{const s=JSON.parse(localStorage.getItem("deputy7.identity-access.v1")||"null"),u=(s?.users||[]).find(x=>x.username==="alikazemi"&&x.status==="active"),r=(s?.roles||[]).find(x=>x.id===u?.roleId);return !!(u?.isSuperAdmin||r?.superAdmin||r?.id==="technical-admin"||r?.grants?.includes("managePersonnel"));}catch{return false;}}
function initRegistryPage(){
 const root=document.querySelector("[data-personnel-registry]");if(!root)return;
 const $=s=>root.querySelector(s);let rows=[],page=1,editing=null;
 const pageSize=20,form=$("[data-personnel-form]"),tbody=$("[data-personnel-rows]");
 const field=(name)=>form.elements.namedItem(name);
 const departments=[["1","اداری و پشتیبانی"],["2","تحقیق و توسعه"],["3","پارک‌بان و معبربانان"],["4","تأسیسات فنی و امور نگهداری"],["6","فاوا و خدمات فنی"],["7","جمع‌آوری و بازیافت پسماند"],["8","بازرسی و تحقیقات محلی"]];
 function render(){
  const q=$("[data-personnel-search]").value.trim().toLocaleLowerCase("fa"),status=$("[data-personnel-status]").value,dep=$("[data-personnel-department]").value;
  const filtered=rows.filter(r=>{const p=r.profile||{},name=(p.firstName+" "+p.lastName+" "+p.nationalCode+" "+p.mobile+" "+r.code).toLocaleLowerCase("fa");return (!q||name.includes(q))&&(!status||r.status===status)&&(!dep||p.departmentId===dep);});
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);const slice=filtered.slice((page-1)*pageSize,page*pageSize);
  tbody.innerHTML=slice.map(r=>{const p=r.profile||{},name=(p.firstName+" "+p.lastName).trim()||"پرونده تکمیل نشده";return '<tr><td><b class="pr-code">'+fa(r.code)+'</b></td><td>'+esc(name)+'</td><td>'+esc(departments.find(d=>d[0]===p.departmentId)?.[1]||"—")+'</td><td>'+esc(p.jobTitle||"—")+'</td><td><span class="pr-status '+r.status+'">'+(r.status==="active"?"فعال":r.status==="inactive"?"غیرفعال":"تکمیل‌نشده")+'</span></td><td><button type="button" class="pr-row-action" data-edit="'+esc(r.code)+'">ویرایش پرونده</button></td></tr>';}).join("")||'<tr><td colspan="6" class="pr-empty">رکوردی با این فیلتر پیدا نشد.</td></tr>';
  $("[data-pr-count]").textContent=fa(filtered.length)+" پرونده از "+fa(rows.length);
  $("[data-pr-pages]").textContent=fa(page)+" / "+fa(pages);
  $("[data-pr-prev]").disabled=page<=1;$("[data-pr-next]").disabled=page>=pages;
  $("[data-pr-active]").textContent=fa(rows.filter(r=>r.status==="active").length);
  $("[data-pr-empty]").textContent=fa(rows.filter(r=>r.status==="empty").length);
  $("[data-pr-inactive]").textContent=fa(rows.filter(r=>r.status==="inactive").length);
 }
 function setForm(r){
  editing=r;const p=r?.profile||blank("1000").profile;
  field("code").value=r?.code||"";field("recordStatus").value=r?.status==="inactive"?"inactive":"active";field("firstName").value=p.firstName||"";field("lastName").value=p.lastName||"";field("nationalCode").value=p.nationalCode||"";
  field("birthDate").value=p.birthDate||"";field("gender").value=p.gender||"";field("mobile").value=p.mobile||"";field("phone").value=p.phone||"";field("email").value=p.email||"";field("address").value=p.address||"";
  field("departmentId").value=p.departmentId||"";field("unit").value=p.unit||"";field("jobTitle").value=p.jobTitle||"";field("employmentType").value=p.employmentType||"";field("hireDate").value=p.hireDate||"";field("contractEnd").value=p.contractEnd||"";
  field("education").value=p.education||"";field("fieldOfStudy").value=p.fieldOfStudy||"";field("specialty").value=p.specialty||"";field("supervisorCode").value=p.supervisorCode||"";field("workLocation").value=p.workLocation||"";field("notes").value=p.notes||"";
  field("code").readOnly=true; $("[data-pr-dialog-title]").textContent=r?"ویرایش پرونده پرسنلی":"تکمیل پرونده پرسنلی";$("[data-pr-recode]").hidden=!r||r.status==="empty"||!canManagePersonnel();
  $("[data-pr-dialog]").showModal();
 }
 async function reload(){if(!await ensureUnlocked())return;const result=await initialize();rows=result.records;render();$("[data-pr-vault]").textContent="مخزن رمزگذاری‌شده باز است · "+fa(result.created)+" کد جدید رزرو شد";}
 $("[data-pr-unlock]").addEventListener("click",reload);
 $("[data-personnel-search]").addEventListener("input",()=>{page=1;render();});
 $("[data-personnel-status]").addEventListener("change",()=>{page=1;render();});
 $("[data-personnel-department]").addEventListener("change",()=>{page=1;render();});
 $("[data-pr-prev]").onclick=()=>{page--;render();};$("[data-pr-next]").onclick=()=>{page++;render();};
 $("[data-pr-new]").hidden=!canManagePersonnel();
 $("[data-pr-new]").onclick=()=>{if(!canManagePersonnel())return alert("برای ویرایش بانک پرسنل، مجوز مدیر فنی لازم است.");const empty=rows.find(r=>r.status==="empty");if(!empty){alert("همه کدهای رزروشده تکمیل شده‌اند.");return;}setForm(empty);};
 tbody.addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(b)setForm(rows.find(r=>r.code===b.dataset.edit));});
 $("[data-pr-close]").onclick=()=>{$("[data-pr-dialog]").close();};
 $("[data-pr-recode]").onclick=async()=>{const old=field("code").value,newCode=prompt("کد جدید را وارد کنید. این تغییر در ارجاعات شناخته‌شده تمام رکوردهای مخزن اعمال می‌شود:",old);if(!newCode||newCode===old)return;if(!confirm("کد "+old+" به "+newCode+" تغییر کند؟ ارجاعات پرسنلی ثبت‌شده در مخزن نیز به‌روزرسانی می‌شوند."))return;try{const moved=await changeCode(old,newCode);await initialize();rows=await list();setForm(moved);render();alert("کد و ارجاعات ثبت‌شده به‌روزرسانی شد.");}catch(e){alert(e.message);}};
 form.addEventListener("submit",async e=>{e.preventDefault();if(!canManagePersonnel())return alert("برای ثبت یا ویرایش پرونده، مجوز مدیریت بانک پرسنل لازم است.");try{let code=field("code").value.trim();const profile={};for(const name of ["recordStatus","firstName","lastName","nationalCode","birthDate","gender","mobile","phone","email","address","departmentId","unit","jobTitle","employmentType","hireDate","contractEnd","education","fieldOfStudy","specialty","supervisorCode","workLocation","notes"])profile[name]=field(name).value.trim();const saved=await save(code,profile);rows=await list();$("[data-pr-dialog]").close();render();alert("پرونده "+saved.code+" ذخیره شد.");}catch(err){alert(err.message);}});
 render();
}
function initProfileBridge(){
 const root=document.querySelector("[data-personnel-profile]");if(!root)return;
 const input=root.querySelector("[data-personnel-id]"),search=root.querySelector("[data-personnel-search]");if(!input||!search)return;
 const oldDirectory=root.querySelector(".profile-directory-panel");if(oldDirectory)oldDirectory.hidden=true;
 const oldResult=root.querySelector("[data-personnel-result]");if(oldResult)oldResult.hidden=true;
 const host=document.createElement("section");host.className="dept-panel pr-profile-lookup";host.innerHTML='<div class="dept-panel-head"><div><span class="eyebrow">بانک مرکزی پرسنل</span><h2>پرونده متصل به کد پرسنلی</h2><p data-pr-profile-status>برای جست‌وجو، مخزن رمزگذاری‌شده را بازگشایی کنید.</p></div><button type="button" class="pr-row-action" data-pr-profile-unlock>بازگشایی بانک</button></div><div data-pr-profile-result class="pr-profile-result">کد پرسنلی را وارد کنید.</div>';
 root.insertBefore(host,root.querySelector("[data-personnel-empty]"));
 async function find(){const code=input.value.trim();if(!code)return;const status=host.querySelector("[data-pr-profile-status]"),result=host.querySelector("[data-pr-profile-result]");try{if(!await ensureUnlocked())return;await initialize();const r=await get(code);if(!r){result.textContent="این کد در بانک پرسنل تعریف نشده است.";return;}const p=r.profile||{};result.innerHTML='<div class="pr-profile-head"><b>'+esc((p.firstName+" "+p.lastName).trim()||"پرونده تکمیل نشده")+'</b><span>کد '+esc(r.code)+'</span><span>'+esc(departments.find(d=>d[0]===p.departmentId)?.[1]||"اداره تعیین نشده")+'</span><span>'+esc(p.jobTitle||"سمت ثبت نشده")+'</span></div><div class="pr-profile-grid">'+[["وضعیت",r.status==="active"?"فعال":r.status==="inactive"?"غیرفعال":"تکمیل‌نشده"],["شماره همراه",p.mobile],["نوع همکاری",p.employmentType],["تاریخ شروع خدمت",p.hireDate],["تحصیلات",p.education],["واحد",p.unit]].map(([k,v])=>'<div><small>'+k+'</small><b>'+esc(v||"—")+'</b></div>').join("")+'</div>';status.textContent="اطلاعات از بانک مرکزی پرسنل فراخوانی شد.";}catch(e){status.textContent=e.message;}}
 search.addEventListener("click",find);host.querySelector("[data-pr-profile-unlock]").addEventListener("click",find);
 input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();find();}});
}
window.PersonnelRegistry=Object.freeze({ensureUnlocked,initialize,list,get,save,changeCode,initRegistryPage,initProfileBridge,escape:esc});
export const getPersonnel=get,ensurePersonnelUnlocked=ensureUnlocked;
document.addEventListener("DOMContentLoaded",()=>{initRegistryPage();initProfileBridge();});
