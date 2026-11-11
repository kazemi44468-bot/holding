(function(){
'use strict';
if(document.querySelector('.holding-masthead'))return;
var hero=document.querySelector('main .hero, main.wrap>.hero, .wrap>.hero');
var title=hero&&hero.querySelector('h1');
var pageTitle=title?title.textContent.trim():'معماری و اسناد سازمانی';
var head=document.createElement('header');
head.className='holding-masthead';
head.innerHTML='<div class="holding-masthead__inner"><div class="holding-masthead__identity"><img class="holding-masthead__flag" src="../assets/images/iran-flag.svg" alt="پرچم جمهوری اسلامی ایران"><div class="holding-masthead__copy"><span class="holding-masthead__eyebrow">هلدینگ · معماری راهبری و یکپارچگی سازمانی</span><div class="holding-masthead__title">'+pageTitle.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})+'</div><span class="holding-masthead__subtitle">سند مرجع داخلی · چارچوب طراحی و توسعه مجموعه</span></div></div><a class="holding-masthead__portal" href="../index.html">درگاه هلدینگ</a></div>';
var main=document.querySelector('main.wrap, main');
if(main)document.body.insertBefore(head,main);else document.body.insertBefore(head,document.body.firstChild);
var footer=document.createElement('footer');
footer.className='holding-reference-footer';
footer.innerHTML='<div class="holding-reference-footer__inner"><span class="holding-reference-footer__brand">هلدینگ | معماری راهبری و یکپارچگی سازمانی</span><span class="holding-reference-footer__note">سند مرجع داخلی برای طراحی، توسعه و راهبری سامانه‌های مجموعه</span><a class="holding-reference-footer__link" href="holding-tarh.html">بازگشت به معماری مادر هلدینگ</a></div>';
if(main&&main.parentNode)main.parentNode.insertBefore(footer,main.nextSibling);else document.body.appendChild(footer);
})();
