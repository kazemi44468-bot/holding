(function(){
'use strict';
const d=document,b=d.body;
const nav=[
{id:'portal',label:'درگاه هلدینگ',href:'index.html',icon:'۰۱'},
{id:'knowledge',label:'مرکز مدیریت دانش و درس‌آموخته‌ها',href:'centers/knowledge/',icon:'۰۲'}
];
const defaultOpen=new Set(); // فقط شاخه مرتبط با صفحه جاری باز می‌ماند؛ از اشغال فضای منو توسط شاخه‌های نامرتبط جلوگیری می‌شود.
const current=b.dataset.sidebarPage||'home';
const pathname=location.pathname;
const pagesAt=pathname.indexOf('/pages/');
const root=pagesAt>=0?pathname.slice(0,pagesAt+1):pathname.slice(0,pathname.lastIndexOf('/')+1);
const link=p=>root+p;
const has=x=>x.id===current||(x.children||[]).some(has);
const render=(items,level=0)=>items.map(x=>{
 if(level>10)return '';
 const active=current===x.id,child=Array.isArray(x.children)&&x.children.length>0,open=child&&(has(x)||defaultOpen.has(x.id));
 const itemClass=(level?'sp-subitem':'sp-item')+(active?' active':'');
 const anchor='<a class="'+itemClass+'" href="'+link(x.href)+'"'+(active?' aria-current="page"':'')+(child?' aria-expanded="'+(open?'true':'false')+'"':'')+'><span class="sp-icon" aria-hidden="true">'+x.icon+'</span><span class="sp-label">'+x.label+'</span></a>';
 return '<div class="sp-group sp-depth-'+level+' sp-cat-'+x.id+' '+(open?'has-active':'')+'"><div class="sp-item-wrap">'+anchor+'</div>'+(child?'<div class="sp-sub '+(open?'is-open':'')+'">'+render(x.children,level+1)+'</div>':'')+'</div>';
}).join('');
const side=d.createElement('aside');side.className='sp-sidebar menu-expanded';side.setAttribute('aria-label','منوی سامانه‌های هلدینگ');
side.innerHTML='<button class="sp-toggle" type="button" aria-label="جمع و باز کردن منوی کناری" aria-expanded="true"><span></span><span></span><span></span></button><div class="sp-brand"><span class="sp-mark">ط</span><div class="sp-brand-text"><strong>سامانه‌های هلدینگ</strong><small>درگاه خدمات و راهبری</small></div></div><nav class="sp-nav" aria-label="منوی اصلی هلدینگ">'+render(nav)+'</nav>';
d.body.prepend(side);d.body.classList.add('menu-body-expanded');
/* راهنمای کامل عنوان آیتم‌های بلند و دکمه یکپارچه بازگشت به بالا */
side.querySelectorAll('.sp-item,.sp-subitem').forEach(a=>{
 const label=a.querySelector('.sp-label');
 if(label&&label.textContent.trim().length>16){a.setAttribute('title',label.textContent.trim());a.setAttribute('data-long-label','true')}
});
let back=d.querySelector('.sp-back-top,.back-top');
if(!back){
 back=d.createElement('button');back.type='button';back.className='sp-back-top';back.setAttribute('aria-label','بازگشت به بالای صفحه');back.innerHTML='<span aria-hidden="true">↑</span>';d.body.appendChild(back);
}else{
 back.classList.add('sp-back-top');
 back.setAttribute('aria-label','بازگشت به بالای صفحه');
}
const tooltip=d.createElement('div');tooltip.className='sp-label-tooltip';tooltip.setAttribute('role','tooltip');d.body.appendChild(tooltip);
let tooltipTarget=null;
const hideLabelTooltip=()=>{tooltip.classList.remove('is-visible');tooltipTarget=null};
const showLabelTooltip=a=>{
 const full=a.getAttribute('title');if(!full)return;
 tooltip.textContent=full;tooltipTarget=a;tooltip.classList.add('is-visible');
 const r=a.getBoundingClientRect();const tr=tooltip.getBoundingClientRect();
 let left=r.left-tr.width-10;if(left<10)left=Math.min(window.innerWidth-tr.width-10,r.right+10);
 const top=Math.max(8,Math.min(window.innerHeight-tr.height-8,r.top+(r.height-tr.height)/2));
 tooltip.style.left=left+'px';tooltip.style.top=top+'px';
};
side.querySelectorAll('[data-long-label="true"]').forEach(a=>{
 a.addEventListener('mouseenter',()=>showLabelTooltip(a));
 a.addEventListener('mouseleave',hideLabelTooltip);
 a.addEventListener('focus',()=>showLabelTooltip(a));
 a.addEventListener('blur',hideLabelTooltip);
});
window.addEventListener('resize',hideLabelTooltip,{passive:true});
const updateBackTop=()=>back.classList.toggle('is-visible',window.scrollY>240);
back.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})});
window.addEventListener('scroll',updateBackTop,{passive:true});updateBackTop();
side.querySelectorAll('.sp-item,.sp-subitem').forEach(anchor=>anchor.addEventListener('click',e=>{
 const group=anchor.closest('.sp-group'),sub=group&&group.querySelector(':scope > .sp-sub');if(!sub)return;
 e.preventDefault();e.stopPropagation();
 const open=sub.classList.toggle('is-open');anchor.setAttribute('aria-expanded',String(open));
 group.classList.toggle('has-open',open);
}));
const toggle=side.querySelector('.sp-toggle');
toggle.onclick=()=>{const opening=!side.classList.contains('menu-expanded');side.classList.toggle('menu-collapsed',!opening);side.classList.toggle('menu-expanded',opening);d.body.classList.toggle('menu-body-expanded',opening);toggle.setAttribute('aria-expanded',String(opening))};
if(window.innerWidth<=850){
 d.body.classList.remove('menu-body-expanded');side.classList.remove('menu-expanded');side.classList.add('menu-collapsed');
 const btn=d.createElement('button');btn.className='sp-mobile-btn';btn.type='button';btn.setAttribute('aria-label','باز کردن منوی کناری');d.body.appendChild(btn);
 const ov=d.createElement('div');ov.className='sp-overlay';d.body.appendChild(ov);
 const close=()=>{side.classList.remove('is-open');ov.classList.remove('is-open')};
 btn.onclick=()=>{side.classList.add('is-open');ov.classList.add('is-open')};ov.onclick=close;
 side.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(!a.closest('.sp-group')?.querySelector(':scope > .sp-sub'))close()}));
}
})();