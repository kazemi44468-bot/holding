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
const orgRegistry=window.HOLDING_ORG_REGISTRY||{};
function orgs(){
 const out=[{id:'HOLDING',label:'ستاد هلدینگ'}];
 (orgRegistry.deputies||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||x.label||('معاونت '+fa(x.sequence))}));
 (orgRegistry.companies||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||x.label||'شرکت تابعه'}));
 (orgRegistry.provincial_branch_managements||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||('مدیریت شعب استانی '+fa(x.sequence))}));
 return out;
}
const orgLabel=id=>orgs().find(x=>x.id===id)?.label||id||'—';
const blank=()=>({schemaVersion:1,requests:[],cases:[],contracts:[],advice:[],arbitration:[],employee:[],experts:[],risks:[],compliance:[],knowledge:[],events:[],updatedAt:now()});
let db=blank(),tab=app.dataset.tab||'overview',editing=null,query='',busy=false;
const defs={
 requests:{label:'درخواست‌های حقوقی',singular:'درخواست حقوقی',prefix:'REQ',fields:[
 {name:'title',label:'عنوان درخواست',required:true},{name:'serviceType',label:'نوع خدمت',type:'select',options:['مشاوره و اعلام نظر','بررسی قرارداد','پیگیری دعوا','امور ثبتی و شرکتی','حقوق کار و بیمه','املاک و دارایی','خدمات حمایتی کارکنان','سایر']},
 {name:'requester',label:'درخواست‌کننده',required:true},{name:'org',label:'واحد / شرکت مربوط',type:'org'},
 {name:'urgency',label:'فوریت',type:'select',options:['عادی','مهم','فوری','بحرانی']},
 {name:'confidentiality',label:'سطح محرمانگی',type:'select',options:['عادی','محرمانه','محرمانه ویژه']},
 {name:'status',label:'وضعیت',type:'select',options:['ثبت‌شده','در حال بررسی','نیازمند تکمیل مدارک','ارجاع به متخصص','پاسخ داده‌شده','مختومه']},
 {name:'dueDate',label:'مهلت پاسخ',type:'date'},{name:'description',label:'شرح درخواست و مستندات موردنیاز',type:'textarea',full:true}
 ]},
 cases:{label:'پرونده‌ها و دعاوی',singular:'پرونده حقوقی',prefix:'CASE',fields:[
 {name:'title',label:'عنوان پرونده',required:true},{name:'caseNumber',label:'شماره پرونده / کلاسه'},
 {name:'org',label:'شخصیت حقوقی ذی‌نفع',type:'org',required:true},{name:'caseType',label:'نوع پرونده',type:'select',options:['حقوقی','کیفری','اداری و دیوان عدالت','کار و تأمین اجتماعی','ثبتی','ملکی','داوری و میانجیگری','مطالبه وجه','سایر']},
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
 {name:'org',label:'شرکت / واحد ذی‌نفع',type:'org',required:true},{name:'party',label:'طرف قرارداد'},
 {name:'contractType',label:'نوع قرارداد',type:'select',options:['پیمانکاری','خدماتی','مشارکت','خرید و فروش','اجاره','سرمایه‌گذاری','مشاوره','تفاهم‌نامه','سایر']},
 {name:'status',label:'وضعیت',type:'select',options:['پیش‌نویس','در بررسی حقوقی','در انتظار تصویب','آماده امضا','فعال','در حال اجرا','دارای اختلاف','خاتمه‌یافته','فسخ‌شده']},
 {name:'startDate',label:'تاریخ شروع',type:'date'},{name:'endDate',label:'تاریخ پایان / سررسید',type:'date'},
 {name:'amount',label:'مبلغ قرارداد (تومان)',type:'number'},{name:'owner',label:'مسئول قرارداد'},
 {name:'obligations',label:'تعهدات کلیدی، تضامین و هشدارها',type:'textarea',full:true}
 ]},
 advice:{label:'مشاوره‌ها و نظریات حقوقی',singular:'درخواست مشاوره',prefix:'ADV',fields:[
 {name:'title',label:'موضوع مشاوره',required:true},{name:'requester',label:'درخواست‌کننده',required:true},
 {name:'org',label:'واحد / شرکت مربوط',type:'org'},{name:'subject',label:'حوزه تخصصی',type:'select',options:['قراردادها','شرکت‌ها و حاکمیت شرکتی','کار و تأمین اجتماعی','املاک و دارایی‌ها','مالی و مطالبات','مقررات و تطبیق','دعاوی و دادرسی','سایر']},
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
 {name:'title',label:'عنوان ریسک / تعهد',required:true},{name:'org',label:'شرکت / واحد مربوط',type:'org'},
 {name:'category',label:'حوزه',type:'select',options:['قراردادی','دعاوی و مطالبات','شرکتی و ثبتی','کار و بیمه','املاک و دارایی','مقررات و انطباق','محرمانگی و داده','سایر']},
 {name:'probability',label:'احتمال وقوع',type:'select',options:['کم','متوسط','زیاد']},
 {name:'impact',label:'شدت اثر',type:'select',options:['کم','متوسط','زیاد','بحرانی']},
 {name:'owner',label:'مسئول کنترل'},{name:'dueDate',label:'مهلت اقدام / بازبینی',type:'date'},
 {name:'status',label:'وضعیت',type:'select',options:['شناسایی‌شده','در حال کنترل','نیازمند تصمیم','رفع‌شده','پذیرفته‌شده با مجوز']},
 {name:'mitigation',label:'اقدام پیشگیرانه / اصلاحی',type:'textarea',full:true}
 ]},

 arbitration:{label:'داوری و حل اختلاف',singular:'پرونده داوری',prefix:'ARB',fields:[
 {name:'title',label:'موضوع اختلاف',required:true},{name:'org',label:'شخصیت حقوقی ذی‌نفع',type:'org',required:true},
 {name:'method',label:'روش حل اختلاف',type:'select',options:['داوری','میانجیگری','مذاکره','سازش','کارشناسی توافقی']},
 {name:'otherParty',label:'طرف مقابل'},{name:'forum',label:'مرجع / نهاد داوری'},
 {name:'arbitrator',label:'داور / میانجی / متخصص'},{name:'status',label:'وضعیت',type:'select',options:['در حال ارزیابی','در حال مذاکره','در جریان داوری','در انتظار نظر کارشناس','توافق اولیه','سازش‌شده','مختومه']},
 {name:'startDate',label:'تاریخ آغاز',type:'date'},{name:'dueDate',label:'جلسه / مهلت بعدی',type:'date'},
 {name:'value',label:'ارزش مالی اختلاف (تومان)',type:'number'},{name:'owner',label:'مسئول داخلی'},
 {name:'summary',label:'شرح اختلاف، خواسته‌ها و راهبرد حل‌وفصل',type:'textarea',full:true}
 ]},
 employee:{label:'حمایت حقوقی کارکنان',singular:'درخواست حمایت حقوقی',prefix:'EMP',fields:[
 {name:'title',label:'موضوع درخواست',required:true},{name:'requester',label:'درخواست‌کننده',required:true},
 {name:'beneficiary',label:'فرد ذی‌نفع / نسبت با درخواست‌کننده'},
 {name:'org',label:'واحد سازمانی',type:'org'},
 {name:'serviceType',label:'نوع خدمت',type:'select',options:['مشاوره حقوقی','حقوق کار و بیمه','اختلافات شغلی','امور بازنشستگی','امور خانواده','املاک و مسکن','حمایت قراردادی','معرفی به متخصص','سایر']},
 {name:'confidentiality',label:'سطح محرمانگی',type:'select',options:['عادی','محرمانه','محرمانه ویژه']},
 {name:'status',label:'وضعیت',type:'select',options:['ثبت‌شده','در حال بررسی','ارجاع به متخصص','نیازمند مدرک','پاسخ داده‌شده','ارجاع بیرونی','مختومه']},
 {name:'owner',label:'مسئول رسیدگی'},{name:'dueDate',label:'مهلت پاسخ / اقدام',type:'date'},
 {name:'description',label:'شرح درخواست و نتیجه مورد انتظار',type:'textarea',full:true}
 ]},
 compliance:{label:'انطباق و مقررات',singular:'موضوع انطباق',prefix:'CMP',fields:[
 {name:'title',label:'عنوان موضوع / الزام',required:true},{name:'org',label:'واحد / شرکت مشمول',type:'org'},
 {name:'category',label:'حوزه انطباق',type:'select',options:['قوانین و مقررات','حاکمیت شرکتی','مجوزها و الزامات ثبتی','کار و تأمین اجتماعی','مالیات و امور مالی','حفاظت داده و محرمانگی','مقررات قراردادی','سایر']},
 {name:'reference',label:'مستند قانونی / مقرره'},{name:'owner',label:'مسئول انطباق'},
 {name:'status',label:'وضعیت',type:'select',options:['شناسایی‌شده','در حال ارزیابی','نیازمند اقدام','در حال اصلاح','منطبق','دارای عدم انطباق','مختومه']},
 {name:'dueDate',label:'مهلت انطباق / بازبینی',type:'date'},
 {name:'impact',label:'سطح اثر',type:'select',options:['کم','متوسط','زیاد','بحرانی']},
 {name:'actionPlan',label:'اقدامات اصلاحی و شواهد انطباق',type:'textarea',full:true}
 ]},
 knowledge:{label:'دانش و اسناد حقوقی',singular:'سند حقوقی',prefix:'DOC',fields:[
 {name:'title',label:'عنوان سند / دانش',required:true},{name:'docType',label:'نوع',type:'select',options:['قانون و مقرره','رأی و نظریه قضایی','نظریه مشورتی','الگوی قرارداد','شیوه‌نامه و دستورالعمل','نظر حقوقی داخلی','درس‌آموخته پرونده','پژوهش و یادداشت تخصصی','سایر']},
 {name:'subject',label:'حوزه تخصصی'},{name:'reference',label:'شماره / شناسه / مرجع انتشار'},
 {name:'issueDate',label:'تاریخ سند',type:'date'},{name:'reviewDate',label:'تاریخ بازبینی بعدی',type:'date'},
 {name:'status',label:'وضعیت اعتبار',type:'select',options:['پیش‌نویس','در حال بررسی','معتبر و جاری','نیازمند بازبینی','منسوخ','بایگانی']},
 {name:'owner',label:'مالک محتوا / بازبین'},
 {name:'summary',label:'خلاصه، کلیدواژه‌ها و نحوه کاربرد',type:'textarea',full:true}
 ]},
};
const tabs=[['overview','نمای کلی'],['requests','درخواست‌ها'],['cases','پرونده‌ها'],['contracts','قراردادها'],['advice','مشاوره‌ها'],['arbitration','داوری و سازش'],['employee','حمایت کارکنان'],['experts','شبکه متخصصان'],['risks','ریسک‌ها'],['compliance','انطباق'],['knowledge','دانش و اسناد'],['backup','پشتیبان‌گیری']];
const pageTabs=(app.dataset.tabs||tab).split(',').filter(Boolean);
let orgScope='all';
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
 db.cases.filter(x=>x.status!=='مختومه').forEach(x=>add(x,x.nextDate,'مهلت / جلسه پرونده حقوقی: '+x.title,'case','قلمرو: '+orgLabel(x.org)+' · پرونده '+x.id+' · '+(x.caseNumber||'بدون شماره')+' · '+(x.summary||''),'planned'));
 db.contracts.filter(x=>!['خاتمه‌یافته','فسخ‌شده'].includes(x.status)).forEach(x=>add(x,x.endDate,'سررسید قرارداد: '+x.title,'contract','قلمرو: '+orgLabel(x.org)+' · قرارداد '+(x.contractNo||x.id)+' · '+(x.obligations||''),'planned'));
 db.requests.filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ درخواست حقوقی: '+x.title,'request','قلمرو: '+orgLabel(x.org)+' · درخواست '+x.id+' · '+(x.description||''),'planned'));
 db.advice.filter(x=>!['تأیید و ابلاغ','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ مشاوره حقوقی: '+x.title,'advice','قلمرو: '+orgLabel(x.org)+' · مشاوره '+x.id+' · '+(x.question||''),'planned'));
 db.risks.filter(x=>!['رفع‌شده','پذیرفته‌شده با مجوز'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت کنترل ریسک حقوقی: '+x.title,'risk','قلمرو: '+orgLabel(x.org)+' · ریسک '+x.id+' · '+(x.mitigation||''),'planned'));
 db.arbitration.filter(x=>!['سازش‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'جلسه / مهلت حل اختلاف: '+x.title,'arbitration','قلمرو: '+orgLabel(x.org)+' · پرونده '+x.id+' · '+(x.summary||''),'planned'));
 db.employee.filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت حمایت حقوقی کارکنان: '+x.title,'employee','درخواست‌کننده: '+(x.requester||'')+' · '+(x.description||''),'planned'));
 db.compliance.filter(x=>!['منطبق','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت انطباق حقوقی: '+x.title,'compliance','مستند: '+(x.reference||'')+' · '+(x.actionPlan||''),'planned'));
 const keep=new Set(desired.map(x=>x.id));
 for(const old of owned)if(!keep.has(old.id))await window.HoldingLocalDataVault.remove(old.id);
 for(const item of desired)await window.HoldingLocalDataVault.put(scope,item);
}
function countOpen(key,closed){return rows(key).filter(x=>!closed.includes(x.status)).length}
function dateOverdue(x){return x&&x<today()}
function upcoming(){
 const out=[];
 for(const [key,label,dateKey] of [['cases','پرونده','nextDate'],['contracts','قرارداد','endDate'],['requests','درخواست','dueDate'],['advice','مشاوره','dueDate'],['risks','ریسک','dueDate'],['arbitration','داوری','dueDate'],['employee','حمایت کارکنان','dueDate'],['compliance','انطباق','dueDate']]){
  for(const r of rows(key))if(r[dateKey]&&r[dateKey]>=today()&&!(r.status==='مختومه'||r.status==='خاتمه‌یافته'||r.status==='رفع‌شده'||r.status==='پاسخ داده‌شده'||r.status==='تأیید و ابلاغ'||r.status==='منطبق'||r.status==='سازش‌شده'||r.status==='پذیرفته‌شده با مجوز'))out.push({title:r.title||r.name,date:r[dateKey],label,id:r.id,key});
  for(const r of rows(key))if(r[dateKey]&&r[dateKey]<today()&&!(r.status==='مختومه'||r.status==='خاتمه‌یافته'||r.status==='رفع‌شده'||r.status==='پاسخ داده‌شده'||r.status==='تأیید و ابلاغ'))out.push({title:r.title||r.name,date:r[dateKey],label:'معوق · '+label,id:r.id,key,late:true});
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12);
}
function metric(label,value,sub){return '<div class="lw-metric"><small>'+esc(label)+'</small><strong>'+fa(value)+'</strong><em>'+esc(sub||'')+'</em></div>'}
function badge(status){let cls='';if(['بحرانی','فوری','معوق'].some(x=>(status||'').includes(x)))cls='red';else if(['در انتظار','نیازمند','مهم','شناسایی‌شده'].some(x=>(status||'').includes(x)))cls='gold';else if(['فعال','در جریان','در حال'].some(x=>(status||'').includes(x)))cls='blue';else if(['مختومه','رفع‌شده','پاسخ داده‌شده','خاتمه‌یافته','تأیید و ابلاغ'].some(x=>(status||'').includes(x)))cls='green';return '<span class="lw-badge '+cls+'">'+esc(status||'—')+'</span>'}
function scopeRows(key){
 const items=rows(key);
 if(orgScope==='all')return items;
 const companies=orgRegistry.companies||[];
 return items.filter(r=>{
  const id=r.org||r.organization_id||orgs().find(o=>o.label===r.unit)?.id||'';
  if(orgScope==='unassigned')return !id;
  if(id===orgScope)return true;
  if((orgRegistry.deputies||[]).some(d=>d.organization_id===orgScope)){
   const company=companies.find(c=>c.organization_id===id);
   return company?.parent_organization_id===orgScope;
  }
  return false;
 });
}
function overview(){
 const keys=['requests','cases','contracts','advice','arbitration','employee','experts','risks','compliance','knowledge'];
 const labels={requests:'درخواست حقوقی',cases:'پرونده و دعوا',contracts:'قرارداد و تعهد',advice:'مشاوره حقوقی',arbitration:'داوری و سازش',employee:'حمایت کارکنان',experts:'متخصصان',risks:'ریسک حقوقی',compliance:'انطباق و مقررات',knowledge:'اسناد و دانش حقوقی'};
 const counts=keys.map(k=>[labels[k],scopeRows(k).length,k]);
 const total=counts.reduce((a,x)=>a+x[1],0);
 const openCases=scopeRows('cases').filter(x=>x.status!=='مختومه').length,closedCases=scopeRows('cases').length-openCases;
 const openRequests=scopeRows('requests').filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).length,closedRequests=scopeRows('requests').length-openRequests;
 const allScoped=keys.flatMap(k=>scopeRows(k).map(r=>({key:k,record:r})));
 const chart=(items,max)=>items.map(x=>'<div class="lw-chart-row"><span>'+esc(x[0])+'</span><div class="lw-chart-track"><span style="width:'+((max?x[1]/max*100:0))+'%"></span></div><b>'+fa(x[1])+'</b></div>').join('');
 const maxCategory=Math.max(1,...counts.map(x=>x[1]));
 const statusItems=[['پرونده‌های در جریان',openCases],['پرونده‌های مختومه',closedCases],['درخواست‌های باز',openRequests],['درخواست‌های پاسخ‌داده‌شده یا مختومه',closedRequests]];
 const statusMax=Math.max(1,...statusItems.map(x=>x[1]));
 const orgItems=orgs().map(o=>[o.label,allScoped.filter(x=>(x.record.org||x.record.organization_id||orgs().find(z=>z.label===x.record.unit)?.id||'')===o.id).length]).filter(x=>x[1]>0||orgScope==='all');
 const unassignedCount=allScoped.filter(x=>!(x.record.org||x.record.organization_id||orgs().find(z=>z.label===x.record.unit)?.id)).length;
 if(orgScope==='all')orgItems.push(['فاقد انتساب سازمانی',unassignedCount]);
 const orgMax=Math.max(1,...orgItems.map(x=>x[1]));
 const eventItems=upcoming().filter(x=>orgScope==='all'||scopeRows(x.key).some(r=>r.id===x.id)).slice(0,8);
 const orgOptions='<option value="all" '+(orgScope==='all'?'selected':'')+'>کل هلدینگ</option><option value="HOLDING" '+(orgScope==='HOLDING'?'selected':'')+'>ستاد هلدینگ</option>'+((orgRegistry.deputies||[]).map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>'+esc(x.name||x.label||'معاونت')+'</option>').join(''))+
 ((orgRegistry.companies||[]).length?'<optgroup label="شرکت‌های تابعه">'+orgRegistry.companies.map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</optgroup>':'')+
 ((orgRegistry.provincial_branch_managements||[]).length?'<optgroup label="مدیریت‌های استانی">'+orgRegistry.provincial_branch_managements.map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>مدیریت شعب استانی '+fa(x.sequence)+'</option>').join('')+'</optgroup>':'')+'<option value="unassigned" '+(orgScope==='unassigned'?'selected':'')+'>فاقد انتساب سازمانی</option>';
 return '<div class="lw-toolbar"><label class="lw-filter-label" for="legal-org-scope">دامنه گزارش</label><select id="legal-org-scope">'+orgOptions+'</select><span class="lw-spacer"></span><button class="lw-btn" data-action="new" data-key="requests">＋ ثبت درخواست</button><button class="lw-btn light" data-action="new" data-key="cases">＋ ثبت پرونده</button><button class="lw-btn light" data-action="new" data-key="contracts">＋ ثبت قرارداد</button></div>'+
 '<div class="lw-metrics">'+metric('کل فعالیت‌های ثبت‌شده',total,'همه حوزه‌های حقوقی')+metric('درخواست‌های باز',openRequests,'در صف رسیدگی')+metric('پرونده‌های فعال',openCases,'دعاوی و اختلافات')+metric('قراردادهای جاری',scopeRows('contracts').filter(x=>!['خاتمه‌یافته','فسخ‌شده'].includes(x.status)).length,'دارای تعهد فعال')+metric('مشاوره‌های باز',scopeRows('advice').filter(x=>!['تأیید و ابلاغ','مختومه'].includes(x.status)).length,'در انتظار پاسخ')+metric('ریسک‌های باز',scopeRows('risks').filter(x=>!['رفع‌شده','پذیرفته‌شده با مجوز'].includes(x.status)).length,'نیازمند کنترل')+metric('داوری و سازش',scopeRows('arbitration').filter(x=>!['سازش‌شده','مختومه'].includes(x.status)).length,'حل اختلاف جایگزین')+metric('حمایت کارکنان',scopeRows('employee').filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).length,'در حال رسیدگی')+metric('متخصصان ثبت‌شده',scopeRows('experts').length,'شبکه تخصصی')+'</div>'+
 '<div class="lw-grid"><section class="lw-panel"><h3>ترکیب فعالیت‌های حقوقی</h3><p class="lw-muted">تعداد اطلاعات ثبت‌شده در هر حوزه تخصصی</p>'+(total?'<div class="lw-chart-bars">'+chart(counts,maxCategory)+'</div>':'<div class="lw-empty"><strong>هنوز اطلاعاتی ثبت نشده است</strong>با ثبت درخواست، پرونده و سایر اطلاعات، این نمودار به‌صورت خودکار تکمیل می‌شود.</div>')+'</section>'+
 '<section class="lw-panel"><h3>وضعیت رسیدگی</h3><p class="lw-muted">تفکیک پرونده‌ها و درخواست‌ها بر اساس وضعیت جاری</p>'+(statusItems.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(statusItems,statusMax)+'</div>':'<div class="lw-empty"><strong>داده‌ای برای تحلیل وضعیت وجود ندارد</strong></div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel lw-wide"><h3>پراکندگی فعالیت در معاونت‌ها و شرکت‌ها</h3><p class="lw-muted">گزارش بر اساس انتساب سازمانی هر رکورد؛ با انتخاب دامنه از بالای صفحه قابل محدودسازی است.</p>'+(orgItems.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(orgItems,orgMax)+'</div>':'<div class="lw-empty"><strong>هنوز رکوردی به معاونت یا شرکت منتسب نشده است</strong></div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel"><h3>مهلت‌ها و رویدادهای نزدیک</h3>'+(eventItems.length?'<div class="lw-list">'+eventItems.map(x=>'<div class="lw-row"><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.label)+' · '+fmtDate(x.date)+'</small></div>'+badge(x.late?'معوق':'سررسید')+'</div>').join('')+'</div>':'<div class="lw-empty"><strong>مهلت ثبت‌شده‌ای وجود ندارد</strong></div>')+'</section><section class="lw-panel"><h3>تفکیک اطلاعات بر پایه ساختار سازمانی</h3><div class="lw-list">'+counts.map(x=>'<div class="lw-row"><strong>'+x[0]+'</strong><span class="lw-badge">'+fa(x[1])+'</span></div>').join('')+'</div></section></div>';
}
function fieldHtml(f,value){
 const val=value??'',req=f.required?'required':'',full=f.full?' full':'';
 if(f.type==='textarea')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><textarea name="'+f.name+'" '+req+'>'+esc(val)+'</textarea></div>';
 if(f.type==='select')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="'+f.name+'">'+(f.options||[]).map(x=>'<option '+(x===val?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
 if(f.type==='org')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="org">'+orgs().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===val?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></div>';
 if(f.type==='date'){const shown=window.HoldingPersianDate?.fromISO(val)||val||'';return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><input name="'+f.name+'" type="text" data-jalali-date value="'+esc(shown)+'" placeholder="۱۴۰۵/۰۸/۲۱" '+req+'></div>';}
 return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><input name="'+f.name+'" type="'+(f.type||'text')+'" value="'+esc(val)+'" '+req+' '+(f.type==='number'?'min="0" step="any"':'')+'></div>';
}
function attachmentList(rec){
 if(!rec?.attachments?.length)return '';
 return '<div class="lw-field full"><label>پیوست‌های ثبت‌شده</label>'+rec.attachments.map(a=>'<div class="lw-attachment"><span>'+esc(a.name)+' · '+fa(Math.ceil((a.size||0)/1024))+' کیلوبایت</span><button class="lw-btn light" type="button" data-action="download-file" data-file="'+esc(a.id)+'">دریافت</button></div>').join('')+'</div>';
}
function formHtml(key,id){
 const def=defs[key],old=id?rows(key).find(x=>x.id===id):null;
 return '<div class="lw-form-wrap"><div class="lw-form-head"><h3>'+(old?'ویرایش ':'ثبت ')+esc(def.singular)+'</h3><button class="lw-btn light" data-action="cancel-form">بستن</button></div><form class="lw-form" id="lw-record-form" data-key="'+key+'" data-id="'+(old?esc(old.id):'')+'">'+def.fields.map(f=>fieldHtml(f,old?.[f.name])).join('')+
 '<div class="lw-field full"><label>پیوست‌ها و مستندات</label><input type="file" name="attachments" multiple></div>'+attachmentList(old)+
 '<div class="lw-field full"><label>یادداشت داخلی / سابقه اقدام</label><textarea name="note" placeholder="شرح اقدام، تصمیم، تماس یا تغییر مهم؛ در تاریخچه ثبت می‌شود.">'+esc(old?.note||'')+'</textarea></div>'+
 '<div class="lw-field full lw-form-actions"><button class="lw-btn" type="submit">ذخیره اطلاعات</button><button class="lw-btn light" type="button" data-action="cancel-form">انصراف</button></div></form></div>';
}
function tableHtml(key){
 const def=defs[key],items=rows(key).filter(x=>!query||JSON.stringify(x).toLowerCase().includes(query.toLowerCase()));
 if(!items.length)return '<div class="lw-empty"><strong>موردی ثبت نشده است</strong></div>';
 const titleField=key==='experts'?'name':'title';
 const subField={requests:'serviceType',cases:'caseNumber',contracts:'contractNo',advice:'subject',arbitration:'method',employee:'serviceType',experts:'specialty',risks:'category',compliance:'category',knowledge:'docType'}[key];
 const statusField='status';
 const dateField={requests:'dueDate',cases:'nextDate',contracts:'endDate',advice:'dueDate',arbitration:'dueDate',employee:'dueDate',experts:'',risks:'dueDate',compliance:'dueDate',knowledge:'reviewDate'}[key];
 return '<div class="lw-table-wrap"><table class="lw-table"><thead><tr><th>عنوان / شناسه</th><th>حوزه / مرجع</th><th>واحد / مسئول</th><th>وضعیت</th><th>تاریخ مهم</th><th>عملیات</th></tr></thead><tbody>'+items.map(x=>'<tr><td><strong>'+esc(x[titleField])+'</strong><small>'+esc(x.id)+'</small></td><td>'+esc(x[subField]||x.caseType||x.contractType||'—')+'</td><td>'+esc(x.org?orgLabel(x.org):(x.requester||x.owner||'—'))+'</td><td>'+badge(x[statusField])+'</td><td>'+fmtDate(x[dateField])+'</td><td><div class="lw-actions"><button data-action="edit" data-key="'+key+'" data-id="'+esc(x.id)+'">ویرایش</button><button class="delete" data-action="delete" data-key="'+key+'" data-id="'+esc(x.id)+'">حذف</button></div></td></tr>').join('')+'</tbody></table></div>';
}
function listView(key){
 const def=defs[key];
 return '<div class="lw-toolbar"><input id="lw-search" type="search" placeholder="جست‌وجو در اطلاعات..." value="'+esc(query)+'"><span class="lw-spacer"></span><button class="lw-btn" data-action="new" data-key="'+key+'">＋ ثبت '+esc(def.singular)+'</button></div>'+tableHtml(key);
}
function backupView(){return '<div class="lw-grid"><section class="lw-panel"><h3>نسخه پشتیبان</h3><button class="lw-btn" data-action="export">دریافت نسخه پشتیبان</button></section><section class="lw-panel"><h3>بازیابی اطلاعات</h3><input id="lw-import-file" type="file" accept=".json,application/json"><div style="margin-top:9px"><button class="lw-btn gold" data-action="import">بازیابی فایل</button></div></section></div>';}
function render(){
 const title=tab==='overview'?'نمای کلی مرکز حقوقی':tab==='backup'?'پشتیبان‌گیری و بازیابی':defs[tab]?.label||'مرکز حقوقی';
 const localTabs=pageTabs.length>1?'<div class="lw-tabs">'+pageTabs.map(k=>'<button class="lw-tab '+(tab===k?'active':'')+'" data-tab="'+k+'">'+(k==='overview'?'نمای کلی':k==='backup'?'پشتیبان‌گیری':(defs[k]?.label||k))+'</button>').join('')+'</div>':'';
 app.innerHTML=localTabs+'<div class="lw-content"><div id="lw-status" class="lw-alert" hidden></div><h3 style="font-size:12px;color:#355b77;margin:0 0 11px">'+title+'</h3><div id="lw-view">'+(tab==='overview'?overview():tab==='backup'?backupView():listView(tab))+'</div></div>';
 updateCenterNav();
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
 for(const f of def.fields){const raw=String(fd.get(f.name)||'').trim();if(f.type==='date'){const iso=window.HoldingPersianDate?.toISO(raw)||'';if(raw&&!iso)throw new Error('تاریخ واردشده معتبر نیست؛ تاریخ شمسی را به شکل سال/ماه/روز وارد کنید.');record[f.name]=iso;}else record[f.name]=raw;}
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
function updateCenterNav(){}
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
app.addEventListener('change',e=>{if(e.target.id==='legal-org-scope'){orgScope=e.target.value;render();}});
(async()=>{await load();try{await syncCalendar()}catch(e){console.warn('Calendar sync skipped',e)}render();})();
})();