(()=>{"use strict";
const overlay=document.getElementById("login-overlay");
if(!overlay)return;
const form=document.getElementById("gateway-login");
const user=document.getElementById("gateway-username");
const pass=document.getElementById("gateway-password");
const role=document.getElementById("gateway-role");
let previousFocus=null;
function openLogin(){previousFocus=document.activeElement;overlay.hidden=false;document.body.style.overflow="hidden";window.setTimeout(()=>user.focus(),40)}
function closeLogin(){overlay.hidden=true;document.body.style.overflow="";if(previousFocus)previousFocus.focus()}
document.querySelectorAll("[data-open-login]").forEach(el=>el.addEventListener("click",openLogin));
document.querySelectorAll("[data-close-login]").forEach(el=>el.addEventListener("click",closeLogin));
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!overlay.hidden)closeLogin()});
const toggle=document.querySelector("[data-toggle-password]");
toggle?.addEventListener("click",()=>{const visible=pass.type==="password";pass.type=visible?"text":"password";toggle.textContent=visible?"پنهان":"نمایش";toggle.setAttribute("aria-label",visible?"پنهان کردن رمز عبور":"نمایش رمز عبور")});
form.addEventListener("submit",event=>{
 event.preventDefault();
 if(!role.value){role.focus();return}
 // ورود نمایشی: هر نام کاربری و رمز عبوری پذیرفته می‌شود.
 // اعتبارسنجی و مجوزدهی واقعی در مرحله اتصال بک‌اند اضافه خواهد شد.
 window.location.href="dashboard.html";
});
})();