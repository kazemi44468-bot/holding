(()=>{"use strict";
const core=window.Deputy7Pages;if(!core)return;
const pathname=decodeURI(location.pathname);
const page=core.all().find(p=>p.kind==="static"&&(pathname.endsWith("/"+String(p.path||"").replace(/^\\//,""))||pathname.endsWith("/"+String(p.path||"").split("/").pop())));
if(!page||page.kind!=="static")return;
if(page.title){document.title=page.title+" | معاونت ۷";const h=document.querySelector("main h1");if(h)h.textContent=page.title;}
if(page.description){const main=document.querySelector("main");const intro=main?.querySelector("h1")?.parentElement;const p=intro?.querySelector("p");if(p)p.textContent=page.description;}
const sections=(page.sections||[]).filter(s=>s&&((s.title||"").trim()||(s.body||"").trim()));if(!sections.length)return;
const main=document.querySelector("main");if(!main)return;
const host=document.createElement("section");host.className="page-studio-extra";host.setAttribute("aria-label","بخش‌های تکمیلی صفحه");
sections.forEach(s=>{
 const card=document.createElement("article");card.className="page-studio-block"+(s.type==="note"?" is-note":"");
 if(s.title){const h=document.createElement("h2");h.textContent=s.title;card.append(h);}
 if(s.type==="list"){
  const ul=document.createElement("ul");String(s.body||"").split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).forEach(x=>{const li=document.createElement("li");li.textContent=x;ul.append(li);});card.append(ul);
 }else{const p=document.createElement("p");p.textContent=s.body||"";card.append(p);}
 host.append(card);
});
main.append(host);
})();