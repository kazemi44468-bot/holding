(()=>{"use strict";
const core=window.Deputy7Pages;if(!core)return;
const pathname=decodeURI(location.pathname);
const clean=value=>{let s=String(value||"");while(s.startsWith("../"))s=s.slice(3);if(s.startsWith("./"))s=s.slice(2);while(s.startsWith("/"))s=s.slice(1);return s;};
const page=core.all().filter(p=>p.kind==="static").sort((a,b)=>clean(b.path).length-clean(a.path).length).find(p=>pathname.endsWith("/"+clean(p.path))||clean(p.path).startsWith("pages/")&&pathname.endsWith("/"+clean(p.path).split("/").pop()));
if(!page||page.kind!=="static")return;
if(page.title)document.title=page.title+" | معاونت ۷";
const main=document.querySelector("main");if(!main)return;
if(page.contentMode==="replace"){
 [...main.children].forEach(node=>{node.hidden=true;});
 const hero=document.createElement("section");hero.className="page-studio-replacement-hero";
 const h=document.createElement("h1");h.textContent=page.title||"صفحه سازمانی";hero.append(h);
 if(page.description){const p=document.createElement("p");p.textContent=page.description;hero.append(p);}
 main.append(hero);
}else{
 if(page.title){document.title=page.title+" | معاونت ۷";const h=main.querySelector("h1");if(h)h.textContent=page.title;}
 if(page.description){const intro=main.querySelector("h1")?.parentElement;const p=intro?.querySelector("p");if(p)p.textContent=page.description;}
}
const sections=(page.sections||[]).filter(s=>s&&((s.title||"").trim()||(s.body||"").trim()));if(!sections.length)return;
const host=document.createElement("section");host.className="page-studio-extra";host.setAttribute("aria-label","بخش‌های تکمیلی صفحه");
sections.forEach(s=>{
 const card=document.createElement("article");card.className="page-studio-block"+(s.type==="note"?" is-note":"");
 if(s.title){const h=document.createElement("h2");h.textContent=s.title;card.append(h);}
 if(s.type==="list"){
  const ul=document.createElement("ul");String(s.body||"").split(String.fromCharCode(10)).map(x=>x.trim()).filter(Boolean).forEach(x=>{const li=document.createElement("li");li.textContent=x;ul.append(li);});card.append(ul);
 }else{const p=document.createElement("p");p.textContent=s.body||"";card.append(p);}
 host.append(card);
});
main.append(host);
})();