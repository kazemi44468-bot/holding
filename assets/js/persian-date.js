(()=>{'use strict';
const faDigits=s=>String(s).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const latinDigits=s=>String(s).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
const parts=d=>{const p=Object.fromEntries(fmt.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));return {y:p.year,m:p.month,d:p.day}};
const utc=(y,m,d)=>new Date(Date.UTC(y,m-1,d,12));
const toISO=(jy,jm,jd)=>{
 if(jy<1200||jy>1600||jm<1||jm>12||jd<1||jd>31)return '';
 let start=null;
 for(let g=jy+621,day=18;day<=24&&!start;day++){const x=utc(g,3,day),p=parts(x);if(p.y===jy&&p.m===1&&p.d===1)start=x;}
 if(!start)return '';
 const offset=jm<=6?(jm-1)*31+(jd-1):186+(jm-7)*30+(jd-1);
 const result=new Date(start.getTime()+offset*86400000),p=parts(result);
 if(p.y!==jy||p.m!==jm||p.d!==jd)return '';
 return result.getUTCFullYear()+'-'+String(result.getUTCMonth()+1).padStart(2,'0')+'-'+String(result.getUTCDate()).padStart(2,'0');
};
const parse=v=>{const s=latinDigits(String(v||'').trim()).replace(/[.-]/g,'/');const m=s.match(/^(\d{4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})$/);if(!m)return '';return toISO(+m[1],+m[2],+m[3]);};
const fromISO=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';const p=parts(utc(+m[1],+m[2],+m[3]));return faDigits(p.y+'/'+String(p.m).padStart(2,'0')+'/'+String(p.d).padStart(2,'0'));};
const nowParts=()=>parts(new Date());
const months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const dayNames=['ش','ی','د','س','چ','پ','ج'];
const add=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number),x=utc(y,m,d);x.setUTCDate(x.getUTCDate()+n);return x.getUTCFullYear()+'-'+String(x.getUTCMonth()+1).padStart(2,'0')+'-'+String(x.getUTCDate()).padStart(2,'0')};
function build(input){
 let current=parse(input.value)||(()=>{const p=nowParts();return toISO(p.y,p.m,p.d)})();
 // Current date represented as Gregorian ISO, recover Jalali month/year.
 const jalali=()=>{const m=current.match(/^(\d+)-(\d+)-(\d+)$/);return parts(utc(+m[1],+m[2],+m[3]))};
 let jp=jalali(),y=jp.y,m=jp.m;
 const pop=document.createElement('div');pop.className='persian-calendar-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','انتخاب تاریخ شمسی');
 const draw=()=>{
  const first=toISO(y,m,1),days=Array.from({length:31},(_,i)=>toISO(y,m,i+1)).filter(Boolean);
  const [gy,gm,gd]=first.split('-').map(Number);const startDay=(new Date(Date.UTC(gy,gm-1,gd,12)).getUTCDay()+1)%7;
  pop.innerHTML='<div class="pc-head"><button type="button" data-step="-1" aria-label="ماه قبل">‹</button><strong>'+months[m-1]+' '+faDigits(y)+'</strong><button type="button" data-step="1" aria-label="ماه بعد">›</button></div><div class="pc-days">'+dayNames.map(x=>'<span class="pc-week">'+x+'</span>').join('')+Array(startDay).fill('<span></span>').join('')+days.map((iso,i)=>'<button type="button" data-date="'+iso+'" class="'+(iso===current?'selected':'')+'">'+faDigits(i+1)+'</button>').join('')+'</div>';
 };
 const place=()=>{const r=input.getBoundingClientRect();pop.style.position='absolute';pop.style.top=(window.scrollY+r.bottom+6)+'px';pop.style.left=Math.max(8,Math.min(window.scrollX+r.left,window.scrollX+window.innerWidth-270))+'px';};
 draw();document.body.appendChild(pop);place();
 pop.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.step){m+=Number(b.dataset.step);if(m<1){m=12;y--}if(m>12){m=1;y++}draw();place();return}if(b.dataset.date){input.value=fromISO(b.dataset.date);input.dataset.iso=b.dataset.date;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));pop.remove();}});
 const close=e=>{if(e.target!==input&&!pop.contains(e.target)){pop.remove();document.removeEventListener('pointerdown',close)}};
 setTimeout(()=>document.addEventListener('pointerdown',close),0);
}
function attach(input){
 if(input.dataset.persianReady)return;input.dataset.persianReady='1';input.type='text';input.inputMode='numeric';input.autocomplete='off';input.placeholder=input.placeholder||'۱۴۰۵/۰۸/۲۱';input.classList.add('persian-date-input');
 const initial=input.value;if(/^\d{4}-\d{2}-\d{2}$/.test(initial))input.value=fromISO(initial);
 input.dataset.iso=parse(input.value)||'';
 input.addEventListener('focus',()=>build(input));
 input.addEventListener('blur',()=>{const iso=parse(input.value);if(iso){input.dataset.iso=iso;input.value=fromISO(iso)}else if(input.value.trim()){input.setCustomValidity('تاریخ را به شکل سال/ماه/روز شمسی وارد کنید.');}else{input.dataset.iso='';input.setCustomValidity('')}});
 input.addEventListener('input',()=>{input.setCustomValidity('');const iso=parse(input.value);input.dataset.iso=iso});
}
document.querySelectorAll('input[data-jalali-date]').forEach(attach);
window.HoldingPersianDate={toISO:parse,fromISO,format:fromISO,todayISO:()=>{const p=nowParts();return toISO(p.y,p.m,p.d)},attach,faDigits};
})();