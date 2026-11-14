(()=>{"use strict";
const KEY="deputy7.identity-access.v1",ACTIONS=[["view","مشاهده"],["create","ایجاد"],["edit","ویرایش"],["delete","حذف"],["approve","تأیید"],["export","خروجی"],["manage","مدیریت صفحه"]];
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function read(){try{return JSON.parse(localStorage.getItem(KEY))||{version:1,users:[],roles:[]};}catch{return {version:1,users:[],roles:[]};}}
function pages(){return window.Deputy7Pages?.all()||[];}
function defaultActions(role,page){
 if(role.id==="super-admin"||role.superAdmin)return ACTIONS.map(x=>x[0]);
 if(role.id==="chair")return ["view","approve","export"];
 if(role.id==="technical-admin")return ["view","manage"].filter(x=>page.category==="پیکربندی"||page.category==="امنیت"||page.id==="personnel-registry");
 if(role.id==="department-manager")return ["view","create","edit","delete","approve","export"];
 if(role.id==="expert")return ["view","create","edit"];
 if(role.id==="operator")return ["view","create"];
 if(role.id==="observer"||role.id==="auditor")return ["view","export"];
 const grants=role.grants||[];return ["view","create","edit","delete","approve","export","manage"].filter(a=>grants.includes(a)||a==="view"&&grants.includes("view"));
}
function init(){
 const host=$("pageAccessHost");if(!host)return;
 let state=read(),selectedRole=state.roles[0]?.id||"";
 if(!state.roles.length){host.innerHTML='<div class="um-empty show">ابتدا نقش‌های سازمانی را تعریف کنید.</div>';return;}
 state.pageGrants=state.pageGrants||{};
 for(const role of state.roles){state.pageGrants[role.id]=state.pageGrants[role.id]||{};for(const page of pages())if(!Array.isArray(state.pageGrants[role.id][page.id]))state.pageGrants[role.id][page.id]=defaultActions(role,page);}
 localStorage.setItem(KEY,JSON.stringify(state));
 const roleSelect=$("pageAccessRole");roleSelect.innerHTML=state.roles.map(r=>'<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>').join("");roleSelect.value=selectedRole;
 function render(){
  state=read();selectedRole=roleSelect.value;
  const role=state.roles.find(r=>r.id===selectedRole);if(!role)return;
  const q=$("pageAccessSearch").value.trim().toLocaleLowerCase("fa");
  const list=pages().filter(p=>!q||(p.title+" "+p.category+" "+p.path).toLocaleLowerCase("fa").includes(q));
  $("pageAccessRows").innerHTML=list.map(p=>{const granted=state.pageGrants?.[role.id]?.[p.id]||[];return '<tr><td><b>'+esc(p.title)+'</b><small>'+esc(p.path)+'</small></td><td>'+esc(p.category||"—")+'</td>'+ACTIONS.map(([id,label])=>'<td><label class="page-access-check" title="'+label+'"><input type="checkbox" data-page="'+esc(p.id)+'" data-action="'+id+'" '+(granted.includes(id)?"checked":"")+'><span>'+label+'</span></label></td>').join("")+'</tr>';}).join("")||'<tr><td colspan="9">صفحه‌ای با این عبارت پیدا نشد.</td></tr>';
  $("pageAccessSummary").textContent=list.length.toLocaleString("fa-IR")+" صفحه برای نقش «"+role.name+"»";
 }
 function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
 $("pageAccessRows").addEventListener("change",e=>{const el=e.target;if(!el.matches("[data-page][data-action]"))return;const pageId=el.dataset.page,action=el.dataset.action;state=read();state.pageGrants=state.pageGrants||{};state.pageGrants[selectedRole]=state.pageGrants[selectedRole]||{};const arr=new Set(state.pageGrants[selectedRole][pageId]||[]);el.checked?arr.add(action):arr.delete(action);state.pageGrants[selectedRole][pageId]=[...arr];persist();});
 roleSelect.addEventListener("change",render);$("pageAccessSearch").addEventListener("input",render);
 $("pageAccessReset").addEventListener("click",()=>{if(!confirm("مجوزهای این نقش به الگوی پایه بازگردد؟"))return;state=read();const role=state.roles.find(r=>r.id===roleSelect.value);if(!role)return;state.pageGrants[role.id]={};for(const p of pages())state.pageGrants[role.id][p.id]=defaultActions(role,p);persist();render();});
 window.addEventListener("deputy7:pages-changed",render);
 render();
}
document.addEventListener("DOMContentLoaded",init);
})();