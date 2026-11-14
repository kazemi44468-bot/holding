import {getPersonnel,ensurePersonnelUnlocked,normalizePersonnelCode} from "../../local-data/assets/personnel-registry.js?v=personnel-registry-20261114-6";
(()=>{"use strict";
const $=id=>document.getElementById(id),button=$("userPersonnelLookup"),form=$("userForm");
async function resolveCode(showMessage=false){
 const code=normalizePersonnelCode($("userPersonnelCode").value);if(!code)throw Error("کد پرسنلی را وارد کنید.");
 $("userPersonnelCode").value=code;
 if(!/^\d{4}$/.test(code)||Number(code)<1000||Number(code)>1249)throw Error("کد پرسنلی باید بین ۱۰۰۰ تا ۱۲۴۹ باشد.");
 if(!await ensurePersonnelUnlocked())throw Error("بانک پرسنل بازگشایی نشد.");
 const r=await getPersonnel(code);
 if(!r)throw Error("این کد در بانک مرکزی تعریف نشده است.");
 if(r.status==="moved")throw Error("این کد بازنشسته شده است؛ کد جایگزین: "+r.replacedBy);
 if(r.status!=="active")throw Error("برای این کد پرونده فعال و تکمیل‌شده وجود ندارد.");
 const p=r.profile||{};
 $("userPersonnelCode").value=r.code;
 $("userName").value=(p.firstName+" "+p.lastName).trim();
 $("userTitle").value=p.jobTitle||"";
 $("userUnit").value=p.unit||"";
 const dep=$("userDepartments");[...dep.options].forEach(o=>o.selected=o.value===String(p.departmentId));
 if(showMessage)alert("مشخصات فرد از بانک مرکزی فراخوانی شد.");
 return r;
}
if(button)button.addEventListener("click",async()=>{try{await resolveCode(true);}catch(e){alert(e.message);}});
if(form){
 let bypass=false;
 form.addEventListener("submit",async e=>{
  if(bypass){bypass=false;return;}
  if(!normalizePersonnelCode($("userPersonnelCode").value))return;
  e.preventDefault();e.stopImmediatePropagation();
  try{await resolveCode(false);bypass=true;form.requestSubmit();}
  catch(err){alert(err.message);}
 },true);
}
})();