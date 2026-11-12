(()=>{'use strict';
const SCOPE='legal-center',STATE_ID='legal-center-state',KEY='holding_legal_center_v1';
const $=s=>document.querySelector(s),app=$('#legal-app');
if(!app)return;
const fa=n=>new Intl.NumberFormat('fa-IR').format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toISOString();
const today=()=>{const d=new Date(),z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};
const fmtDate=v=>{if(!v)return '—';const d=new Date(v.length===10?v+'T12:00:00':v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium'}).format(d)};
const makeId=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const blank=()=>({schemaVersion:1,requests:[],cases:[],contracts:[],advice:[],experts:[],risks:[],events:[],updatedAt:now()});
let db=blank(),tab='overview',editing=null,query='',busy=false;
const defs={
 requests:{label:'درخواست‌های حقوقی',singular:'درخواست حقوقی',prefix:'REQ',fields:[
 {name:'title',label:'عنوان درخواست',required:true},{name:'serviceType',label:'نوع خدمت',type:'select',options:['مشاوره و اعلام نظر','بررسی قرارداد','پیگیری دعوا','امور ثبتی و شرکتی','حقوق کار و بیمه','املاک و دارایی','خدمات حمایتی کارکنان','سایر']},
 {name:'requester',label:'درخواست‌کننده',required:true},{name:'org',label:'واحد / شرکت مربوط'},
 {name:'urgency',label:'فوریت',type:'select',options:['عادی','مهم','فوری','بحرانی']},
 {name:'confidentiality',label:'سطح محرمانگی',type:'select',options:['عادی','محرمانه','محرمانه ویژه']},
 {name:'status',label:'وضعیت',type:'select',options:['ثبت‌شده','در حال بررسی','نیازمند تکمیل مدارک','ارجاع به متخصص','پاسخ داده‌شده','مختومه']},
 {name:'dueDate',label:'مهلت پاسخ',type:'date'},{name:'description',label:'شرح درخواست و مستندات موردنیاز',type:'textarea',full:true}
 ]},
 cases:{label:'پرونده‌ها و دعاوی',singular:'پرونده حقوقی',prefix:'CASE',fields:[
 {name:'title',label:'عنوان پرونده',required:true},{name:'caseNumber',label:'شماره پرونده / کلاسه'},
 {name:'org',label:'شخصیت حقوقی ذی‌نفع',required:true},{name:'caseType',label:'نوع پرونده',type:'select',options:['حقوقی','کیفری','اداری و دیوان عدالت','کار و تأمین اجتماعی','ثبتی','ملکی','داوری و میانجیگری','مطالبه وجه','سایر']},
 {name:'forum',label:'مرجع رسیدگی / شعبه'},{name:'opposingParty',label:'طرف مقابل'},
 {name:'lawyer',label:'وکیل / متخصص مسئول'},{name:'owner',label:'مسئول پیگیری داخلی'},
 {name:'status',label:'وضعیت پرونده',type:'select',options:['در حال بررسی اولیه','آماده‌سازی و ثبت','در جریان رسیدگی','در انتظار اقدام مرجع','در مرحله اجرا','در حال مذاکره / سازش','متوقف','مختومه']},
 {name:'priority',label:'اولویت',type:'select',options:['عادی','مهم','فوری','بحرانی']},
 {name:'nextDate',label:'نزدیک‌ترین مهلت / جلسه',type:'date'},{name:'claimValue',label:'ارزش خواسته / مبلغ (تومان)',type:'number'},
 {name:'confidentiality',label:'سطح محرمانگی',type:'select',options:['عادی','محرمانه','محرمانه ویژه']},
 {name:'summary',label:'خلاصه موضوع، آخرین اقدام و راهبرد',type:'textarea',full:true}
 ]},
 contracts:{label:'قراردادها و تعهدات',singular:'قرارداد',prefix:'CTR',fields:[
 {name:'title',label:'عنوان قرارداد',required:true},{name:'contractNo',label:'شماره قرارداد'},
 {name:'org',label:'شرکت / واحد ذی‌نفع',required:true},{name:'party',label:'طرف قرارداد'},
 {name:'contractType',label:'نوع قرارداد',type:'select',options:['پیمانکاری','خدماتی','مشارکت','خرید و فروش','اجاره','سرمایه‌گذاری','مشاوره','تفاهم‌نامه','سایر']},
 {name:'status',label:'وضعیت',type:'select',options:['پیش‌نویس','در بررسی حقوقی','در انتظار تصویب','آماده امضا','فعال','در حال اجرا','دارای اختلاف','خاتمه‌یافته','فسخ‌شده']},
 {name:'startDate',label:'تاریخ شروع',type:'date'},{name:'endDate',label:'تاریخ پایان / سررسید',type:'date'},
 {name:'amount',label:'مبلغ قرارداد (تومان)',type:'number'},{name:'owner',label:'مسئول قرارداد'},
 {name:'obligations',label:'تعهدات کلیدی، تضامین و هشدارها',type:'textarea',full:true}
 ]},
 advice:{label:'مشاوره‌ها و نظریات حقوقی',singular:'درخواست مشاوره',prefix:'ADV',fields:[
 {name:'title',label:'موضوع مشاوره',required:true},{name:'requester',label:'درخواست‌کننده',required:true},
 {name:'org',label:'واحد / شرکت مربوط'},{name:'subject',label:'حوزه تخصصی',type:'select',options:['قراردادها','شرکت‌ها و حاکمیت شرکتی','کار و تأمین اجتماعی','املاک و دارایی‌ها','مالی و مطالبات','مقررات و تطبیق','دعاوی و دادرسی','سایر']},
 {name:'urgency',label:'فوریت',type:'select',options:['عادی','مهم','فوری','بحرانی']},
 {name:'status',label:'وضعیت',type:'select',options:['دریافت‌شده','در حال بررسی','نیازمند اطلاعات تکمیلی','نظر تهیه‌شده','تأیید و ابلاغ','مختومه']},
 {name:'dueDate',label:'مهلت پاسخ',type:'date'},
 {name:'question',label:'شرح پرسش و مستندات',type:'textarea',full:true},
 {name:'response',label:'خلاصه نظر / نتیجه بررسی',type:'textarea',full:true}
 ]},
 experts:{label:'شبکه متخصصان حقوقی',singular:'متخصص حقوقی',prefix:'EXP',fields:[
 {name:'name',label:'نام و نام خانوادگی',required:true},{name:'specialty',label:'تخصص اصلی',type:'select',options:['دعاوی و دادرسی','قراردادها و بازرگانی','شرکت‌ها و ثبت','کار و تأمین اجتماعی','املاک و اراضی','مالی و مالیاتی','داوری و میانجیگری','حقوق عمومی و اداری','مالکیت فکری و فناوری','سایر']},
 {name:'licenseNo',label:'شماره پروانه / شناسه صلاحیت'},{name:'expertise',label:'تجربه و حوزه‌های تکمیلی',type:'textarea',full:true},
 {name:'phone',label:'تلفن'},{name:'email',label:'رایانامه'},
 {name:'status',label:'وضعیت همکاری',type:'select',options:['در انتظار احراز','فعال','غیرفعال','تعلیق همکاری']},
 {name:'conflictStatus',label:'وضعیت بررسی تعارض منافع',type:'select',options:['بررسی نشده','بدون تعارض اعلام‌شده','دارای تعارض / محدودیت','نیازمند بررسی مجدد']},
 {name:'notes',label:'یادداشت ارزیابی و سوابق همکاری',type:'textarea',full:true}
 ]},
 risks:{label:'ریسک‌ها و مهلت‌های حقوقی',singular:'ریسک حقوقی',prefix:'RSK',fields:[
 {name:'title',label:'عنوان ریسک / تعهد',required:true},{name:'org',label:'شرکت / واحد مربوط'},
 {name:'category',label:'حوزه',type:'select',options:['قراردادی','دعاوی و مطالبات','شرکتی و ثبتی','کار و بیمه','املاک و دارایی','مقررات و انطباق','محرمانگی و داده','سایر']},
 {name:'probability',label:'احتمال وقوع',type:'select',options:['کم','متوسط','زیاد']},
 {name:'impact',label:'شدت اثر',type:'select',options:['کم','متوسط','زیاد','بحرانی']},
 {name:'owner',label:'مسئول کنترل'},{name:'dueDate',label:'مهلت اقدام / بازبینی',type:'date'},
 {name:'status',label:'وضعیت',type:'select',options:['شناسایی‌شده','در حال کنترل','نیازمند تصمیم','رفع‌شده','پذیرفته‌شده با مجوز']},
 {name:'mitigation',label:'اقدام پیشگیرانه / اصلاحی',type:'textarea',full:true}
 ]}
};
const tabs=[['overview','نمای کلی'],['requests','درخواست‌ها'],['cases','پرونده‌ها'],['contracts','قراردادها'],['advice','مشاوره‌ها'],['experts','شبکه متخصصان'],['risks','ریسک و مهلت‌ها'],['backup','پشتیبان‌گیری']];
const rows=key=>db[key]||[];
function toast(msg,type='ok'){const el=$('#lw-status');if(!el)return;el.textContent=msg;el.className='lw-alert'+(type==='warn'?' warn':'');el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},5500)}
async function load(){
 try{if(window.HoldingLocalDataVault){const list=await window.HoldingLocalDataVault.all(SCOPE),rec=list.find(x=>x.id===STATE_ID);if(rec?.content){db={...blank(),...JSON.parse(rec.content)};return;}}}catch(e){console.warn('Legal vault read failed',e)}
 try{const raw=localStorage.getItem(KEY);if(raw)db={...blank(),...JSON.parse(raw)}}catch(e){console.warn(e)}
}
async function save(){
 db.updatedAt=now();localStorage.setItem(KEY,JSON.stringify(db));
 if(window.HoldingLocalDataVault)await window.HoldingLocalDataVault.put(SCOPE,{id:STATE_ID,kind:'application-state',title:'داده عملیاتی مرکز حقوقی',content:JSON.stringify(db),schemaVersion:1});
 await syncCalendar();
}
async function syncCalendar(){
 if(!window.HoldingLocalDataVault)return;
 const scope='holding-calendar-events',existing=await window.HoldingLocalDataVault.all(scope),owned=existing.filter(x=>x.sourceCenter==='legal'),desired=[];
 const add=(record,date,title,type,description,status)=>{if(!date)return;desired.push({id:'CAL-LEGAL-'+record.id+'-'+type,title,type:'deadline',scope:record.org||'HOLDING',date,time:'09:00',priority:record.urgency==='بحرانی'||record.priority==='بحرانی'?'high':'normal',status,owner:record.owner||record.requester||record.lawyer||'',reminder:'1440',sourceCenter:'legal',linkedLegalRecordId:record.id,description});};
 db.cases.filter(x=>x.status!=='مختومه').forEach(x=>add(x,x.nextDate,'مهلت / جلسه پرونده حقوقی: '+x.title,'case','پرونده '+x.id+' · '+(x.caseNumber||'بدون شماره')+' · '+(x.summary||''),'planned'));
 db.contracts.filter(x=>!['خاتمه‌یافته','فسخ‌شده'].includes(x.status)).forEach(x=>add(x,x.endDate,'سررسید قرارداد: '+x.title,'contract','قرارداد '+(x.contractNo||x.id)+' · '+(x.obligations||''),'planned'));
 db.requests.filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ درخواست حقوقی: '+x.title,'request','درخواست '+x.id+' · '+(x.description||''),'planned'));
 db.advice.filter(x=>!['تأیید و ابلاغ','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ مشاوره حقوقی: '+x.title,'advice','مشاوره '+x.id+' · '+(x.question||''),'planned'));
 db.risks.filter(x=>!['رفع‌شده','پذیرفته‌شده با مجوز'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت کنترل ریسک حقوقی: '+x.title,'risk','ریسک '+x.id+' · '+(x.mitigation||''),'planned'));
 const keep=new Set(desired.map(x=>x.id));
 for(const old of owned)if(!keep.has(old.id))await window.HoldingLocalDataVault.remove(old.id);
 for(const item of desired)await window.HoldingLocalDataVault.put(scope,item);
}
function countOpen(key,closed){return rows(key).filter(x=>!closed.includes(x.status)).length}
function dateOverdue(x){return x&&x<today()}
function upcoming(){
 const out=[];
 for(const [key,label,dateKey] of [['cases','پرونده','nextDate'],['contracts','قرارداد','endDate'],['requests','درخواست','dueDate'],['advice','مشاوره','dueDate'],['risks','ریسک','dueDate']]){
  for(const r of rows(key))if(r[dateKey]&&r[dateKey]>=today()&&!(r.status==='مختومه'||r.status==='خاتمه‌یافته'||r.status==='رفع‌شده'||r.status==='پاسخ داده‌شده'||r.status==='تأیید و ابلاغ'))out.push({title:r.title||r.name,date:r[dateKey],label,id:r.id,key});
  for(const r of rows(key))if(r[dateKey]&&r[dateKey]<today()&&!(r.status==='مختومه'||r.status==='خاتمه‌یافته'||r.status==='رفع‌شده'||r.status==='پاسخ داده‌شده'||r.status==='تأیید و ابلاغ'))out.push({title:r.title||r.name,date:r[dateKey],label:'معوق · '+label,id:r.id,key,late:true});
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12);
}
function metric(label,value,sub){return '<div class="lw-metric"><small>'+esc(label)+'</small><strong>'+fa(value)+'</strong><em>'+esc(sub||'')+'</em></div>'}
function badge(status){let cls='';if(['بحرانی','فوری','معوق'].some(x=>(status||'').includes(x)))cls='red';else if(['در انتظار','نیازمند','مهم','شناسایی‌شده'].some(x=>(status||'').includes(x)))cls='gold';else if(['فعال','در جریان','در حال'].some(x=>(status||'').includes(x)))cls='blue';else if(['مختومه','رفع‌شده','پاسخ داده‌شده','خاتمه‌یافته','تأیید و ابلاغ'].some(x=>(status||'').includes(x)))cls='green';return '<span class="lw-badge '+cls+'">'+esc(status||'—')+'</span>'}
function overview(){
 const events=upcoming(),overdue=events.filter(x=>x.late).length;
 return '<div class="lw-toolbar"><button class="lw-btn" data-action="new" data-key="requests">＋ ثبت درخواست حقوقی</button><button class="lw-btn light" data-action="new" data-key="cases">＋ ثبت پرونده</button><button class="lw-btn light" data-action="new" data-key="contracts">＋ ثبت قرارداد</button></div><div class="lw-metrics">'+metric('درخواست‌های باز',countOpen('requests',['پاسخ داده‌شده','مختومه']),'در صف رسیدگی')+metric('پرونده‌های فعال',countOpen('cases',['مختومه']),'دعاوی و اختلافات')+metric('قراردادهای جاری',countOpen('contracts',['خاتمه‌یافته','فسخ‌شده']),'دارای تعهد فعال')+metric('مشاوره‌های باز',countOpen('advice',['تأیید و ابلاغ','مختومه']),'در انتظار پاسخ')+metric('ریسک‌های باز',countOpen('risks',['رفع‌شده','پذیرفته‌شده با مجوز']),'نیازمند کنترل')+'</div>'+
 '<div class="lw-grid"><section class="lw-panel"><h3>مهلت‌ها و رویدادهای نزدیک</h3>'+(events.length?'<div class="lw-list">'+events.map(x=>'<div class="lw-row"><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.label)+' · '+fmtDate(x.date)+'</small></div>'+badge(x.late?'معوق': 'سررسید')+'</div>').join('')+'</div>':'<div class="lw-empty"><strong>مهلت ثبت‌شده‌ای وجود ندارد</strong>با ثبت تاریخ در پرونده، قرارداد یا درخواست، این بخش به‌روز می‌شود.</div>')+'</section>'+
 '<section class="lw-panel"><h3>نمای وضعیت اطلاعات ثبت‌شده</h3><div class="lw-list">'+[['پرونده‌ها',rows('cases').length],['درخواست‌ها',rows('requests').length],['قراردادها',rows('contracts').length],['متخصصان',rows('experts').length],['ریسک‌ها',rows('risks').length]].map(x=>'<div class="lw-row"><strong>'+x[0]+'</strong><span class="lw-badge">'+fa(x[1])+'</span></div>').join('')+'</div><p>شاخص‌ها فقط از اطلاعات ثبت‌شده در همین مرورگر محاسبه می‌شوند؛ داده نمونه در سامانه درج نشده است.</p></section></div>'+
 '<div class="lw-alert warn">این نسخه روی همین مرورگر و دستگاه ذخیره می‌شود. تا زمان استقرار سرور، احراز هویت و کنترل دسترسی سازمانی، اطلاعات واقعی محرمانه یا اسناد حساس قضایی را در این نسخه وارد نکنید.</div>';
}
function fieldHtml(f,value){
 const val=value??'',req=f.required?'required':'',full=f.full?' full':'';
 if(f.type==='textarea')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><textarea name="'+f.name+'" '+req+'>'+esc(val)+'</textarea></div>';
 if(f.type==='select')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="'+f.name+'">'+(f.options||[]).map(x=>'<option '+(x===val?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
 return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><input name="'+f.name+'" type="'+(f.type||'text')+'" value="'+esc(val)+'" '+req+' '+(f.type==='number'?'min="0" step="any"':'')+'></div>';
}
function attachmentList(rec){
 if(!rec?.attachments?.length)return '';
 return '<div class="lw-field full"><label>پیوست‌های ثبت‌شده</label>'+rec.attachments.map(a=>'<div class="lw-attachment"><span>'+esc(a.name)+' · '+fa(Math.ceil((a.size||0)/1024))+' کیلوبایت</span><button class="lw-btn light" type="button" data-action="download-file" data-file="'+esc(a.id)+'">دریافت</button></div>').join('')+'</div>';
}
function formHtml(key,id){
 const def=defs[key],old=id?rows(key).find(x=>x.id===id):null;
 return '<div class="lw-form-wrap"><div class="lw-form-head"><h3>'+(old?'ویرایش ':'ثبت ')+esc(def.singular)+'</h3><button class="lw-btn light" data-action="cancel-form">بستن</button></div><form class="lw-form" id="lw-record-form" data-key="'+key+'" data-id="'+(old?esc(old.id):'')+'">'+def.fields.map(f=>fieldHtml(f,old?.[f.name])).join('')+
 '<div class="lw-field full"><label>پیوست‌ها و مستندات</label><input type="file" name="attachments" multiple><span class="lw-help">فایل‌ها در مخزن محلی مرورگر نگهداری می‌شوند. برای پرونده‌های حساس، تا زمان استقرار امنیت سازمانی از بارگذاری سند محرمانه خودداری کنید.</span></div>'+attachmentList(old)+
 '<div class="lw-field full"><label>یادداشت داخلی / سابقه اقدام</label><textarea name="note" placeholder="شرح اقدام، تصمیم، تماس یا تغییر مهم؛ در تاریخچه ثبت می‌شود.">'+esc(old?.note||'')+'</textarea></div>'+
 '<div class="lw-field full lw-form-actions"><button class="lw-btn" type="submit">ذخیره اطلاعات</button><button class="lw-btn light" type="button" data-action="cancel-form">انصراف</button></div></form></div>';
}
function tableHtml(key){
 const def=defs[key],items=rows(key).filter(x=>!query||JSON.stringify(x).toLowerCase().includes(query.toLowerCase()));
 if(!items.length)return '<div class="lw-empty"><strong>موردی برای نمایش وجود ندارد</strong>برای شروع، اطلاعات واقعی را با دکمه ثبت وارد کنید؛ هیچ پرونده یا مبلغ نمونه‌ای درج نشده است.</div>';
 const titleField=key==='experts'?'name':'title';
 const subField={requests:'serviceType',cases:'caseNumber',contracts:'contractNo',advice:'subject',experts:'specialty',risks:'category'}[key];
 const statusField=key==='experts'?'status':'status';
 const dateField={requests:'dueDate',cases:'nextDate',contracts:'endDate',advice:'dueDate',experts:'',risks:'dueDate'}[key];
 return '<div class="lw-table-wrap"><table class="lw-table"><thead><tr><th>عنوان / شناسه</th><th>حوزه / مرجع</th><th>واحد / مسئول</th><th>وضعیت</th><th>تاریخ مهم</th><th>عملیات</th></tr></thead><tbody>'+items.map(x=>'<tr><td><strong>'+esc(x[titleField])+'</strong><small>'+esc(x.id)+'</small></td><td>'+esc(x[subField]||x.caseType||x.contractType||'—')+'</td><td>'+esc(x.org||x.requester||x.owner||x.name||'—')+'</td><td>'+badge(x[statusField])+'</td><td>'+fmtDate(x[dateField])+'</td><td><div class="lw-actions"><button data-action="edit" data-key="'+key+'" data-id="'+esc(x.id)+'">ویرایش</button><button class="delete" data-action="delete" data-key="'+key+'" data-id="'+esc(x.id)+'">حذف</button></div></td></tr>').join('')+'</tbody></table></div>';
}
function listView(key){
 const def=defs[key];
 return '<div class="lw-toolbar"><input id="lw-search" type="search" placeholder="جست‌وجو در اطلاعات..." value="'+esc(query)+'"><span class="lw-spacer"></span><button class="lw-btn" data-action="new" data-key="'+key+'">＋ ثبت '+esc(def.singular)+'</button></div>'+tableHtml(key);
}
function backupView(){
 return '<div class="lw-grid"><section class="lw-panel"><h3>خروجی و نسخه پشتیبان</h3><p>تمام داده‌های مرکز حقوقی و پیوست‌های ثبت‌شده را در قالب JSON صادر کنید. فایل خروجی را در محل امن نگهداری کنید.</p><button class="lw-btn" data-action="export">تهیه نسخه پشتیبان</button></section><section class="lw-panel"><h3>بازیابی نسخه پشتیبان</h3><p>بازیابی می‌تواند داده‌های فعلی همین مرکز را جایگزین کند. پیش از بازیابی، از اطلاعات فعلی خروجی بگیرید.</p><input id="lw-import-file" type="file" accept=".json,application/json"><div style="margin-top:9px"><button class="lw-btn gold" data-action="import">بررسی و بازیابی فایل</button></div></section></div><div class="lw-alert warn">فایل پشتیبان حاوی داده‌ها و پیوست‌های مرکز است؛ آن را مانند اسناد محرمانه نگهداری کنید. بازیابی، فقط قلمرو مرکز حقوقی را جایگزین می‌کند و داده مراکز دیگر را دست‌کاری نمی‌کند.</div>';
}
function render(){
 const title=tab==='overview'?'نمای کلی مرکز حقوقی':tab==='backup'?'پشتیبان‌گیری و بازیابی':defs[tab]?.label||'مرکز حقوقی';
 app.innerHTML='<div class="lw-head"><div><h2>میزکار اجرایی مرکز حقوقی</h2><p>مدیریت درخواست‌های حقوقی، پرونده‌ها، قراردادها، مشاوره‌ها، متخصصان، ریسک‌ها و مهلت‌ها در یک محیط یکپارچه.</p></div><div class="lw-head-side"><span class="lw-tag">طرح ۰۲-۳-۱۰</span><span class="lw-tag">نسخه اجرایی اولیه · محلی</span></div></div><div class="lw-privacy">محرمانگی: این نسخه برای ثبت اولیه و آزمایش گردش کار است؛ تا زمان استقرار احراز هویت و دسترسی سازمانی، اطلاعات حساس واقعی را وارد نکنید.</div><div class="lw-tabs" role="tablist">'+tabs.map(([k,l])=>'<button class="lw-tab '+(tab===k?'active':'')+'" role="tab" aria-selected="'+(tab===k)+'" data-tab="'+k+'">'+l+'</button>').join('')+'</div><div class="lw-content"><div id="lw-status" class="lw-alert" hidden></div><h3 style="font-size:12px;color:#355b77;margin:0 0 11px">'+title+'</h3><div id="lw-view">'+(tab==='overview'?overview():tab==='backup'?backupView():listView(tab))+'</div></div><div class="lw-footer"><span>ذخیره‌سازی محلی · شناسه مستقل مرکز حقوقی</span><span>آخرین به‌روزرسانی: '+fmtDate(db.updatedAt)+'</span></div>';
}
function openForm(key,id){editing={key,id:id||null};query='';const view=$('#lw-view');view.innerHTML=formHtml(key,id);const el=$('#lw-record-form');if(el)el.querySelector('input:not([type=file]),textarea,select')?.focus();}
async function addFiles(record,files){
 if(!window.HoldingLocalDataVault||!files.length)return record;
 const attachments=[...(record.attachments||[])];
 for(const file of files){if(file.size>12*1024*1024)throw new Error('حجم هر پیوست باید کمتر از ۱۲ مگابایت باشد.');const id=makeId('FILE');await window.HoldingLocalDataVault.put(SCOPE,{id,kind:'attachment',title:file.name,fileName:file.name,mimeType:file.type,file,relatedRecordId:record.id});attachments.push({id,name:file.name,type:file.type,size:file.size});}
 record.attachments=attachments;return record;
}
async function saveForm(form){
 const key=form.dataset.key,id=form.dataset.id,def=defs[key],fd=new FormData(form),old=id?rows(key).find(x=>x.id===id):null;
 const record={...(old||{}),id:id||makeId(def.prefix),createdAt:old?.createdAt||now(),updatedAt:now()};
 for(const f of def.fields)record[f.name]=String(fd.get(f.name)||'').trim();
 record.note=String(fd.get('note')||'').trim();
 const files=[...(form.querySelector('input[name="attachments"]')?.files||[])];
 await addFiles(record,files);
 const list=rows(key),ix=list.findIndex(x=>x.id===record.id);if(ix>=0)list[ix]=record;else list.unshift(record);
 db.events.unshift({id:makeId('EVT'),at:now(),key,recordId:record.id,action:old?'ویرایش':'ثبت',title:record.title||record.name||'',note:record.note});
 db.events=db.events.slice(0,600);await save();editing=null;render();toast('اطلاعات با موفقیت ذخیره شد.');
}
async function downloadFile(id){
 if(!window.HoldingLocalDataVault)throw new Error('مخزن پیوست در دسترس نیست.');
 const file=await window.HoldingLocalDataVault.get(id);if(!file?.file)throw new Error('فایل پیوست پیدا نشد.');
 const blob=file.file instanceof Blob?file.file:window.HoldingLocalDataVault.objectToBlob(file.file),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.fileName||'attachment';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function exportBackup(){
 if(window.HoldingLocalDataVault){const pack=await window.HoldingLocalDataVault.createBackup(SCOPE);downloadJson(pack.data,'holding-legal-center-backup-'+today()+'.json');}
 else downloadJson({format:'holding-legal-center',schemaVersion:1,state:db},'holding-legal-center-backup-'+today()+'.json');
}
function downloadJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function importBackup(){
 const input=$('#lw-import-file'),file=input?.files?.[0];if(!file)throw new Error('ابتدا فایل پشتیبان را انتخاب کنید.');
 const payload=JSON.parse(await file.text());
 if(!confirm('بازیابی، اطلاعات فعلی مرکز حقوقی را جایگزین می‌کند. ادامه می‌دهید؟'))return;
 if(payload.format==='holding-local-vault'&&window.HoldingLocalDataVault){await window.HoldingLocalDataVault.importData(payload,'replace-scope');}
 else if(payload.format==='holding-legal-center'&&payload.state){db={...blank(),...payload.state};await save();}
 else throw new Error('ساختار فایل پشتیبان معتبر نیست.');
 await load();render();toast('بازیابی اطلاعات مرکز حقوقی انجام شد.');
}
app.addEventListener('click',async e=>{
 const t=e.target.closest('[data-tab],[data-action]');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;query='';editing=null;render();return;}
 const action=t.dataset.action;
 try{
 if(action==='new')openForm(t.dataset.key);
 if(action==='edit')openForm(t.dataset.key,t.dataset.id);
 if(action==='cancel-form'){editing=null;render();}
 if(action==='delete'){const key=t.dataset.key,id=t.dataset.id;if(!confirm('این رکورد حذف شود؟'))return;const item=rows(key).find(x=>x.id===id);if(item?.attachments&&window.HoldingLocalDataVault)for(const a of item.attachments)await window.HoldingLocalDataVault.remove(a.id);db[key]=rows(key).filter(x=>x.id!==id);db.events.unshift({id:makeId('EVT'),at:now(),key,recordId:id,action:'حذف',title:item?.title||item?.name||''});await save();render();toast('رکورد حذف شد.');}
 if(action==='download-file')await downloadFile(t.dataset.file);
 if(action==='export')await exportBackup();
 if(action==='import')await importBackup();
 }catch(err){console.error(err);toast(err.message||'عملیات انجام نشد.','warn');}
});
app.addEventListener('submit',async e=>{if(e.target.id!=='lw-record-form')return;e.preventDefault();if(!e.target.reportValidity())return;const btn=e.target.querySelector('[type=submit]');btn.disabled=true;try{await saveForm(e.target)}catch(err){console.error(err);toast(err.message||'ذخیره اطلاعات انجام نشد.','warn');btn.disabled=false;}});
app.addEventListener('input',e=>{if(e.target.id==='lw-search'){query=e.target.value;const old=$('#lw-view');if(old)old.innerHTML=tableHtml(tab)}});
(async()=>{await load();try{await syncCalendar()}catch(e){console.warn('Calendar sync skipped',e)}render();})();
})();