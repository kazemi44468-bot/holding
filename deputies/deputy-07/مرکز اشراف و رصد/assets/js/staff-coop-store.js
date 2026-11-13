(()=>{'use strict';
const KEY='shahrbehesht.coop.performance.v1';
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(Number(n)||0).toLocaleString('fa-IR');
const money=n=>fmt(n)+' تومان';
const cats={food:'کالاهای اساسی',support:'سبد حمایتی',home:'لوازم خانگی',auto:'خودرویی',care:'بهداشت و خانه'};
const products=[
 {id:'p1',category:'food',name:'سبد خواربار خانوار',base:4200000,price:3850000,discount:8,installments:'۳ قسط',desc:'برنج، روغن، حبوبات، چای، قند و اقلام پرمصرف'},
 {id:'p2',category:'food',name:'بسته پروتئینی خانوار',base:2850000,price:2650000,discount:7,installments:'۲ قسط',desc:'ترکیب اقلام پروتئینی با مقدار قابل تنظیم'},
 {id:'p3',category:'support',name:'سبد حمایتی معیشت',base:2500000,price:2100000,discount:16,installments:'یارانه‌ای / مرحله‌ای',desc:'بسته هدفمند برای حمایت از خانوارهای مشمول'},
 {id:'p4',category:'support',name:'بسته مناسبتی کارکنان',base:1900000,price:1720000,discount:9,installments:'نقدی / ۲ قسط',desc:'اقلام منتخب مناسبتی و خانوادگی'},
 {id:'p5',category:'home',name:'ماشین لباس‌شویی',base:21500000,price:19800000,discount:8,installments:'۶ تا ۱۲ قسط',desc:'نمونه کالای بادوام با خرید گروهی'},
 {id:'p6',category:'home',name:'یخچال و فریزر',base:34800000,price:32500000,discount:7,installments:'۶ تا ۱۲ قسط',desc:'امکان قرارداد تأمین و پرداخت اقساطی'},
 {id:'p7',category:'home',name:'جاروبرقی خانگی',base:7800000,price:7200000,discount:8,installments:'۳ تا ۶ قسط',desc:'کالای ضروری منزل با قیمت ویژه عضو'},
 {id:'p8',category:'auto',name:'باتری خودرو',base:4650000,price:4250000,discount:9,installments:'۳ قسط',desc:'تأمین از فروشندگان دارای ضمانت معتبر'},
 {id:'p9',category:'auto',name:'لاستیک خودرو (یک جفت)',base:9400000,price:8800000,discount:6,installments:'۳ تا ۶ قسط',desc:'قیمت بر اساس سایز و برند نهایی می‌شود'},
 {id:'p10',category:'auto',name:'بسته روغن و فیلتر',base:1850000,price:1690000,discount:9,installments:'نقدی / ۲ قسط',desc:'اقلام مصرفی سرویس دوره‌ای خودرو'},
 {id:'p11',category:'care',name:'بسته شوینده و بهداشتی',base:1180000,price:1050000,discount:11,installments:'نقدی',desc:'شوینده، بهداشت فردی و ملزومات نظافت'},
 {id:'p12',category:'care',name:'بسته کودک و مدرسه',base:2650000,price:2390000,discount:10,installments:'۳ قسط',desc:'نوشت‌افزار و اقلام پایه کودک و نوجوان'}
];
const seed={stats:{orders:286,members:142,sales:86450000,discounts:7820000,installments:34600000,delivery:93,paid:19400000,suppliers:18,agreements:12,salesBy:{food:34000000,support:14500000,home:22000000,auto:10500000,care:5450000}},orders:[
 {date:'۱۴۰۵/۰۸/۱۵',title:'سبد معیشتی خانوار',category:'support',amount:12600000,discount:980000,payment:'support',status:'تحویل‌شده',installment:0,members:6},
 {date:'۱۴۰۵/۰۸/۱۴',title:'تأمین اقلام خواربار',category:'food',amount:8450000,discount:620000,payment:'cash',status:'تحویل‌شده',installment:0,members:9},
 {date:'۱۴۰۵/۰۸/۱۳',title:'خرید گروهی باتری خودرو',category:'auto',amount:12750000,discount:1100000,payment:'installment',status:'در حال آماده‌سازی',installment:4800000,members:3},
 {date:'۱۴۰۵/۰۸/۱۲',title:'طرح لوازم خانگی کارکنان',category:'home',amount:28900000,discount:2100000,payment:'installment',status:'در انتظار تأمین',installment:17600000,members:2},
 {date:'۱۴۰۵/۰۸/۱۰',title:'بسته بهداشت و نظافت',category:'care',amount:3250000,discount:390000,payment:'cash',status:'تحویل‌شده',installment:0,members:5},
 {date:'۱۴۰۵/۰۸/۰۸',title:'سبد کالاهای اساسی',category:'food',amount:7400000,discount:540000,payment:'cash',status:'تحویل‌شده',installment:0,members:7}
]};
let data;try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
if(!data||!data.stats){data=seed;localStorage.setItem(KEY,JSON.stringify(data))}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function render(){
 const s=data.stats;
 $('coop-sales').textContent=fmt(s.sales);$('coop-members').textContent=fmt(s.members);$('coop-discounts').textContent=fmt(s.discounts);$('coop-installments').textContent=fmt(s.installments);$('coop-orders').textContent=fmt(s.orders);$('coop-delivery').textContent=fmt(s.delivery)+'٪';
 const salesBy=s.salesBy||{food:34000000,support:14500000,home:22000000,auto:10500000,care:5450000};
 const max=Math.max(...Object.values(salesBy));
 $('coop-category-chart').innerHTML=Object.entries(salesBy).map(([k,v])=>'<div class="coop-bar-row"><span>'+cats[k]+'</span><div class="coop-bar-track"><i style="width:'+(v/max*100)+'%"></i></div><b>'+fmt(v/1000000)+' م.ت</b></div>').join('');
 $('coop-support-metrics').innerHTML=[
 ['مبلغ تخفیف اعطاشده',money(s.discounts)],['نرخ صرفه‌جویی نسبت به فروش',fmt(s.sales?Math.round(s.discounts/(s.sales+s.discounts)*100):0)+'٪'],['مبلغ اقساط وصول‌شده',money(s.paid)],['تأمین‌کنندگان فعال',fmt(s.suppliers)+' مجموعه'],['توافق‌نامه‌های تخفیفی',fmt(s.agreements)+' قرارداد']
 ].map(x=>'<div class="coop-metric"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join('');
 $('coop-products').innerHTML=products.filter(p=>!window.coopFilter||window.coopFilter==='all'||p.category===window.coopFilter).map(p=>'<article class="coop-product"><small>'+cats[p.category]+'</small><h3>'+p.name+'</h3><div class="coop-price">'+money(p.price)+' <del>'+fmt(p.base)+'</del></div><p>'+p.desc+'</p><div class="coop-product-foot"><span class="coop-chip gold">'+p.discount+'٪ تخفیف</span><span class="coop-chip">'+p.installments+'</span></div></article>').join('');
 $('coop-order-count').textContent=fmt(data.orders.length)+' ردیف اخیر';
 $('coop-order-rows').innerHTML=data.orders.slice().reverse().map(o=>'<tr><td>'+o.date+'</td><td>'+o.title+'</td><td>'+cats[o.category]+'</td><td>'+fmt(o.amount)+'</td><td>'+fmt(o.discount)+'</td><td>'+(o.payment==='cash'?'نقدی':o.payment==='installment'?'اقساطی':'حمایتی')+'</td><td><span class="coop-status '+(o.status==='تحویل‌شده'?'':'wait')+'">'+o.status+'</span></td></tr>').join('');
 const f=$('coop-base-form');['orders','members','sales','discounts','installments','delivery'].forEach(k=>{if(f.elements[k]&&document.activeElement!==f.elements[k])f.elements[k].value=s[k]});
}
window.coopFilter='all';
$('coop-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;window.coopFilter=b.dataset.filter;$('coop-filters').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render()});
$('coop-order-form').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,x=Object.fromEntries(new FormData(f));x.amount=Number(x.amount);x.discount=Number(x.discount);x.installment=Number(x.installment);x.members=Number(x.members);x.date=x.date||new Intl.DateTimeFormat('fa-IR').format(new Date());data.orders.push(x);data.stats.orders+=1;data.stats.members+=x.members;data.stats.sales+=x.amount;data.stats.discounts+=x.discount;data.stats.installments+=x.installment;data.stats.salesBy=data.stats.salesBy||{};data.stats.salesBy[x.category]=(data.stats.salesBy[x.category]||0)+x.amount;save();f.reset();render()});
$('coop-base-form').addEventListener('submit',e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.currentTarget));Object.keys(x).forEach(k=>data.stats[k]=Number(x[k]));save();render();alert('ارقام پایه تعاونی ذخیره شد.')});
render();
})();