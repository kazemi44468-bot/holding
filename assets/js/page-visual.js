(function(){
  "use strict";
  function addVisualPlaceholder(){
    var pageKind=document.body&&document.body.getAttribute("data-sidebar-page");
    if(pageKind==="home"||pageKind==="intro")return;
    var hero=document.querySelector("main .hero, .wrap .hero, .hero");
    if(!hero||hero.querySelector("img, picture, video, .hero-logo, .hero-media, .page-visual-slot"))return;
    var title=hero.querySelector("h1");
    if(!title)return;
    var content=document.createElement("div");
    content.className="page-visual-content";
    while(hero.firstChild)content.appendChild(hero.firstChild);
    var slot=document.createElement("div");
    slot.className="page-visual-slot";
    slot.setAttribute("role","img");
    slot.setAttribute("aria-label","قاب تصویر شاخص برای "+title.textContent.trim());
    slot.innerHTML='<span class="page-visual-slot__mark" aria-hidden="true"><svg viewBox="0 0 64 64"><rect x="7" y="7" width="50" height="50" rx="9"/><circle cx="23" cy="23" r="5"/><path d="m12 48 15-15 9 9 7-7 9 13"/></svg></span>';
    hero.appendChild(content);
    hero.appendChild(slot);
    hero.classList.add("has-visual-placeholder");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addVisualPlaceholder,{once:true});else addVisualPlaceholder();
})();