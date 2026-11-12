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
 (orgRegistry.deputies||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||('معاونت '+fa(x.sequence))}));
 (orgRegistry.companies||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||x.label||'شرکت تابعه'}));
 (orgRegistry.provincial_branch_managements||[]).forEach(x=>out.push({id:x.organization_id,label:x.name||('مدیریت شعب استانی '+fa(x.sequence))}));
 return out;
}
const orgLabel=id=>orgs().find(x=>x.id===id||x.label===id)?.label||id||'—';
const orgIdOf=r=>{const raw=r?.org||r?.organization_id||r?.unit||'';return orgs().find(x=>x.id===raw||x.label===raw)?.id||raw};
const blank=()=>({schemaVersion:2,requests:[],cases:[],contracts:[],advice:[],arbitration:[],employee:[],experts:[],engagements:[],payments:[],sessions:[],risks:[],compliance:[],knowledge:[],events:[],updatedAt:now()});
let db=blank(),tab=app.dataset.tab||'overview',editing=null,query='',busy=false,caseFilter='all';
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
 {name:'lawyer',label:'نام وکیل / متخصص مسئول'},{name:'expertId',label:'انتخاب متخصص از بانک',type:'expert'},{name:'owner',label:'مسئول پیگیری داخلی'},
 {name:'outcome',label:'نتیجه پرونده',type:'select',options:['در حال رسیدگی','موفقیت کامل','موفقیت نسبی','سازش مطلوب','وصول مطالبات','جلوگیری از زیان','نتیجه نامطلوب','مختومه بدون نتیجه مالی']},{name:'recoveredValue',label:'مبلغ وصول‌شده / منفعت محقق‌شده (تومان)',type:'number'},{name:'actualCost',label:'هزینه مستقیم پرونده (تومان)',type:'number'},
 {name:'status',label:'مرحله جاری پرونده',type:'select',options:['ثبت و آماده‌سازی','در جریان رسیدگی','صدور رأی / حکم','اجرای حکم','در حال مذاکره / سازش','متوقف','مختومه']},
 {name:'filedDate',label:'تاریخ ثبت / آغاز پرونده',type:'date',required:true},
 {name:'judgmentDate',label:'تاریخ صدور رأی / حکم',type:'date'},
 {name:'executionStartDate',label:'تاریخ آغاز اجرای حکم',type:'date'},
 {name:'executionEndDate',label:'تاریخ پایان اجرای حکم',type:'date'},
 {name:'closedDate',label:'تاریخ مختومه‌شدن پرونده',type:'date'},
 {name:'priority',label:'اولویت',type:'select',options:['عادی','مهم','فوری','بحرانی']},{name:'progress',label:'درصد پیشرفت ثبت‌شده (۰ تا ۱۰۰)',type:'number'},
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
 {name:'name',label:'نام و نام خانوادگی',required:true},{name:'specialty',label:'تخصص اصلی',type:'select',options:['دعاوی و دادرسی','قراردادها و بازرگانی','شرکت‌ها و ثبت','کار و تأمین اجتماعی','املاک و اراضی','مالی و مالیاتی','داوری و میانجیگری','حقوق عمومی و اداری','مالکیت فکری و فناوری','سایر']},{name:'source',label:'نوع همکاری',type:'select',options:['داخلی','بیرونی داخلی','بین‌المللی']},{name:'country',label:'کشور / حوزه قضایی'},{name:'jurisdiction',label:'صلاحیت و حوزه فعالیت'},{name:'yearsExperience',label:'سابقه حرفه‌ای (سال)',type:'number'},{name:'capacity',label:'ظرفیت پذیرش کار هم‌زمان',type:'number'},{name:'rate',label:'نرخ پایه خدمات',type:'number'},{name:'currency',label:'واحد پول',type:'select',options:['تومان','ریال','دلار آمریکا','یورو','درهم']},
 {name:'licenseNo',label:'شماره پروانه / شناسه صلاحیت'},{name:'expertise',label:'تجربه و حوزه‌های تکمیلی',type:'textarea',full:true},
 {name:'phone',label:'تلفن'},{name:'email',label:'رایانامه'},
 {name:'status',label:'وضعیت همکاری',type:'select',options:['در انتظار احراز','فعال','غیرفعال','تعلیق همکاری']},
 {name:'conflictStatus',label:'وضعیت بررسی تعارض منافع',type:'select',options:['بررسی نشده','بدون تعارض اعلام‌شده','دارای تعارض / محدودیت','نیازمند بررسی مجدد']},
 {name:'notes',label:'یادداشت ارزیابی و سوابق همکاری',type:'textarea',full:true}
 ]},
 engagements:{label:'ارجاع کار و برون‌سپاری',singular:'ارجاع کار تخصصی',prefix:'ENG',fields:[{name:'title',label:'عنوان کار / مأموریت',required:true},{name:'expertId',label:'متخصص منتخب',type:'expert',required:true},{name:'caseId',label:'شناسه پرونده مرتبط'},{name:'mode',label:'شیوه همکاری',type:'select',options:['ارجاع اختصاصی','دعوت محدود از متخصصان','فراخوان مسئله‌محور','مشاوره موردی','همکاری مستمر']},{name:'scope',label:'شرح خدمات و خروجی مورد انتظار',type:'textarea',full:true},{name:'status',label:'وضعیت مأموریت',type:'select',options:['پیشنهادی','در انتظار پذیرش','در حال انجام','تحویل‌شده','در حال بازبینی','تأییدشده','ردشده','لغوشده']},{name:'startDate',label:'تاریخ ارجاع',type:'date'},{name:'dueDate',label:'مهلت تحویل',type:'date'},{name:'agreedFee',label:'مبلغ توافق‌شده',type:'number'},{name:'currency',label:'واحد پول',type:'select',options:['تومان','ریال','دلار آمریکا','یورو','درهم']},{name:'score',label:'امتیاز ارزیابی (از ۱۰۰)',type:'number'},{name:'evaluation',label:'ارزیابی کیفیت، دقت و زمان‌بندی',type:'textarea',full:true}]},
 payments:{label:'هزینه‌ها و پرداخت متخصصان',singular:'ثبت هزینه / پرداخت',prefix:'PAY',fields:[{name:'expertId',label:'متخصص دریافت‌کننده',type:'expert',required:true},{name:'engagementId',label:'شناسه ارجاع کار'},{name:'caseId',label:'شناسه پرونده مرتبط'},{name:'description',label:'شرح هزینه / خدمت',required:true},{name:'amount',label:'مبلغ',type:'number',required:true},{name:'currency',label:'واحد پول',type:'select',options:['تومان','ریال','دلار آمریکا','یورو','درهم']},{name:'paymentType',label:'نوع پرداخت',type:'select',options:['پیش‌پرداخت','مرحله‌ای','تسویه نهایی','هزینه دادرسی','هزینه کارشناسی','هزینه سفر و مأموریت','سایر']},{name:'paymentDate',label:'تاریخ پرداخت / ثبت',type:'date'},{name:'status',label:'وضعیت مالی',type:'select',options:['درخواست پرداخت','در انتظار تأیید','تأییدشده','پرداخت‌شده','ردشده']},{name:'invoiceNo',label:'شماره صورتحساب / سند'},{name:'notes',label:'توضیحات',type:'textarea',full:true}]},
 sessions:{label:'جلسات تخصصی و مشاوره بیرونی',singular:'جلسه تخصصی',prefix:'SES',fields:[
 {name:'title',label:'موضوع جلسه',required:true},{name:'specialist',label:'وکیل / خبره مدعو',required:true},
 {name:'specialty',label:'حوزه تخصصی',type:'select',options:['دعاوی و دادرسی','قراردادها و بازرگانی','شرکت‌ها و ثبت','کار و تأمین اجتماعی','املاک و اراضی','مالی و مالیاتی','داوری و میانجیگری','حقوق عمومی و اداری','فناوری و مالکیت فکری','سایر']},
 {name:'org',label:'واحد درخواست‌کننده',type:'org'},
 {name:'sessionDate',label:'تاریخ جلسه',type:'date',required:true},{name:'sessionTime',label:'ساعت جلسه'},
 {name:'format',label:'شیوه برگزاری',type:'select',options:['حضوری','برخط','ترکیبی']},
 {name:'status',label:'وضعیت جلسه',type:'select',options:['پیشنهادی','در انتظار تأیید','برنامه‌ریزی‌شده','برگزارشده','لغوشده']},
 {name:'agenda',label:'دستور جلسه و پرسش‌های اصلی',type:'textarea',full:true},
 {name:'outcome',label:'جمع‌بندی، تصمیم‌ها و اقدامات بعدی',type:'textarea',full:true}
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
const tabs=[['overview','نمای کلی'],['requests','درخواست‌ها'],['cases','پرونده‌ها'],['contracts','قراردادها'],['advice','مشاوره‌ها'],['arbitration','داوری و سازش'],['employee','حمایت کارکنان'],['experts','بانک متخصصان'],['engagements','ارجاع کار و برون‌سپاری'],['payments','هزینه‌ها و پرداخت‌ها'],['risks','ریسک‌ها'],['compliance','انطباق'],['knowledge','دانش و اسناد'],['backup','پشتیبان‌گیری']];
const pageTabs=(app.dataset.tabs||tab).split(',').filter(Boolean);
let orgScope='all',orgPickerOpen=false,orgPickerQuery='',detailRecord=null;
const rows=key=>db[key]||[];
function toast(msg,type='ok'){const el=$('#lw-status');if(!el)return;el.textContent=msg;el.className='lw-alert'+(type==='warn'?' warn':'');el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},5500)}
async function load(){
 try{if(window.HoldingLocalDataVault){const list=await window.HoldingLocalDataVault.all(SCOPE),rec=list.find(x=>x.id===STATE_ID);if(rec?.content){db={...blank(),...JSON.parse(rec.content)};return;}}}catch(e){console.warn('Legal vault read failed',e)}
 try{const raw=localStorage.getItem(KEY);if(raw){db={...blank(),...JSON.parse(raw)};if(window.HoldingLocalDataVault)await window.HoldingLocalDataVault.put(SCOPE,{id:STATE_ID,kind:'application-state',title:'داده عملیاتی مرکز حقوقی',content:JSON.stringify(db),schemaVersion:1});}}catch(e){console.warn(e)}
}
async function save(){
 db.updatedAt=now();
 if(window.HoldingLocalDataVault)await window.HoldingLocalDataVault.put(SCOPE,{id:STATE_ID,kind:'application-state',title:'داده عملیاتی مرکز حقوقی',content:JSON.stringify(db),schemaVersion:1});
 try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){console.warn('LocalStorage mirror skipped; IndexedDB remains primary',e)}
 await syncCalendar();
 if(window.HoldingLocalDataVault)await maybeLocalSnapshot();
}
async function syncCalendar(){
 if(!window.HoldingLocalDataVault)return;
 const scope='holding-calendar-events',existing=await window.HoldingLocalDataVault.all(scope),owned=existing.filter(x=>x.sourceCenter==='legal'),desired=[];
 const add=(record,date,title,type,description,status)=>{if(!date)return;desired.push({id:'CAL-LEGAL-'+record.id+'-'+type,title,type:'deadline',scope:record.org||'HOLDING',date,time:record.sessionTime||'09:00',priority:record.urgency==='بحرانی'||record.priority==='بحرانی'?'high':'normal',status,owner:record.owner||record.requester||record.lawyer||'',reminder:'1440',sourceCenter:'legal',linkedLegalRecordId:record.id,description});};
 db.cases.filter(x=>x.status!=='مختومه').forEach(x=>add(x,x.nextDate,'مهلت / جلسه پرونده حقوقی: '+x.title,'case','قلمرو: '+orgLabel(x.org)+' · پرونده '+x.id+' · '+(x.caseNumber||'بدون شماره')+' · '+(x.summary||''),'planned'));
 db.contracts.filter(x=>!['خاتمه‌یافته','فسخ‌شده'].includes(x.status)).forEach(x=>add(x,x.endDate,'سررسید قرارداد: '+x.title,'contract','قلمرو: '+orgLabel(x.org)+' · قرارداد '+(x.contractNo||x.id)+' · '+(x.obligations||''),'planned'));
 db.requests.filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ درخواست حقوقی: '+x.title,'request','قلمرو: '+orgLabel(x.org)+' · درخواست '+x.id+' · '+(x.description||''),'planned'));
 db.advice.filter(x=>!['تأیید و ابلاغ','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت پاسخ مشاوره حقوقی: '+x.title,'advice','قلمرو: '+orgLabel(x.org)+' · مشاوره '+x.id+' · '+(x.question||''),'planned'));
 db.risks.filter(x=>!['رفع‌شده','پذیرفته‌شده با مجوز'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت کنترل ریسک حقوقی: '+x.title,'risk','قلمرو: '+orgLabel(x.org)+' · ریسک '+x.id+' · '+(x.mitigation||''),'planned'));
 db.arbitration.filter(x=>!['سازش‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'جلسه / مهلت حل اختلاف: '+x.title,'arbitration','قلمرو: '+orgLabel(x.org)+' · پرونده '+x.id+' · '+(x.summary||''),'planned'));
 db.employee.filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت حمایت حقوقی کارکنان: '+x.title,'employee','درخواست‌کننده: '+(x.requester||'')+' · '+(x.description||''),'planned'));
 db.compliance.filter(x=>!['منطبق','مختومه'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت انطباق حقوقی: '+x.title,'compliance','مستند: '+(x.reference||'')+' · '+(x.actionPlan||''),'planned'));
 db.sessions.filter(x=>!['برگزارشده','لغوشده'].includes(x.status)).forEach(x=>add(x,x.sessionDate,'جلسه تخصصی حقوقی: '+x.title,'session','مدعو: '+(x.specialist||'')+' · '+(x.agenda||''),'planned'));
 db.engagements.filter(x=>!['تأییدشده','ردشده','لغوشده'].includes(x.status)).forEach(x=>add(x,x.dueDate,'مهلت تحویل مأموریت حقوقی: '+x.title,'engagement','متخصص: '+(rows('experts').find(e=>e.id===x.expertId)?.name||'')+' · '+(x.scope||''),'planned'));
 const keep=new Set(desired.map(x=>x.id));
 for(const old of owned)if(!keep.has(old.id))await window.HoldingLocalDataVault.remove(old.id);
 for(const item of desired)await window.HoldingLocalDataVault.put(scope,item);
}
async function seedDemoCases(){
 if(db.demoSeedVersion||db.cases.length)return;
 const demo=[
 {id:'CASE-DEMO-001',demo:true,title:'اختلاف قراردادی در اجرای تعهدات پیمان',caseNumber:'نمونه-۱۴۰۵-۰۰۱',org:'CMP-01-001',caseType:'حقوقی',forum:'مرجع قضایی صالح ـ نمونه',opposingParty:'طرف قرارداد ـ نمونه',lawyer:'وکیل همکار ـ نمونه',owner:'کارشناس حقوقی مرکز',status:'در جریان رسیدگی',filedDate:'2026-03-21',judgmentDate:'',executionStartDate:'',executionEndDate:'',closedDate:'',priority:'مهم',nextDate:'2026-11-24',claimValue:'8500000000',confidentiality:'عادی',summary:'نمونه نمایشی برای نمایش مسیر ثبت، تبادل لوایح و پیگیری رسیدگی؛ اطلاعات طرفین و شماره‌ها واقعی نیست.'},
 {id:'CASE-DEMO-002',demo:true,title:'مطالبه مطالبات و خسارت تأخیر تأدیه',caseNumber:'نمونه-۱۴۰۴-۰۰۲',org:'HOLDING',caseType:'مطالبه وجه',forum:'واحد اجرای احکام ـ نمونه',opposingParty:'بدهکار تجاری ـ نمونه',lawyer:'وکیل همکار ـ نمونه',owner:'مسئول پیگیری ستاد',status:'اجرای حکم',filedDate:'2025-10-01',judgmentDate:'2026-05-20',executionStartDate:'2026-06-10',executionEndDate:'',closedDate:'',priority:'فوری',nextDate:'2026-11-20',claimValue:'4200000000',confidentiality:'محرمانه',summary:'نمونه نمایشی؛ رأی صادر شده و پرونده در مرحله اجرای حکم و وصول محکوم‌به قرار دارد.'},
 {id:'CASE-DEMO-003',demo:true,title:'اختلاف ملکی و الزام به ایفای تعهد',caseNumber:'نمونه-۱۴۰۳-۰۰۳',org:'CMP-01-001',caseType:'ملکی',forum:'شعبه حقوقی ـ نمونه',opposingParty:'مالک / متعهد ـ نمونه',lawyer:'وکیل همکار ـ نمونه',owner:'کارشناس حقوقی شرکت',status:'مختومه',filedDate:'2024-09-22',judgmentDate:'2025-02-01',executionStartDate:'2025-02-15',executionEndDate:'2025-08-30',closedDate:'2025-09-01',priority:'عادی',nextDate:'',claimValue:'12000000000',confidentiality:'عادی',summary:'نمونه نمایشی مختومه؛ اجرای مفاد حکم خاتمه یافته و مدارک اختتام در پرونده بایگانی شده است.'},
 {id:'CASE-DEMO-004',demo:true,title:'اعتراض به تصمیم اداری و درخواست ابطال',caseNumber:'نمونه-۱۴۰۵-۰۰۴',org:'HOLDING',caseType:'اداری و دیوان عدالت',forum:'دیوان عدالت اداری ـ نمونه',opposingParty:'مرجع اداری ـ نمونه',lawyer:'متخصص حقوق عمومی ـ نمونه',owner:'مسئول حقوقی ستاد',status:'ثبت و آماده‌سازی',filedDate:'2026-10-28',judgmentDate:'',executionStartDate:'',executionEndDate:'',closedDate:'',priority:'مهم',nextDate:'2026-11-29',claimValue:'0',confidentiality:'محرمانه',summary:'نمونه نمایشی؛ مدارک اولیه گردآوری شده و پرونده در مرحله تکمیل و آماده‌سازی ثبت قرار دارد.'}
 ];
 db.cases.push(...demo);db.demoSeedVersion=1;
 for(const r of demo)db.events.unshift({id:makeId('EVT'),at:now(),key:'cases',recordId:r.id,action:'ثبت نمونه نمایشی',title:r.title,note:'داده نمایشی و قابل ویرایش'});
 await save();
}

async function seedExtendedDemoData(){
 const expertSamples=[
 ['EXP-DEMO-001','وکیل نمونه ۱','دعاوی و دادرسی','ایران','دادگاه‌های عمومی و تجدیدنظر','۱۸','۴','45000000'],
 ['EXP-DEMO-002','مشاور نمونه ۲','قراردادها و بازرگانی','ایران','قراردادهای پیمان و سرمایه‌گذاری','۱۵','۳','38000000'],
 ['EXP-DEMO-003','متخصص نمونه ۳','املاک و اراضی','ایران','املاک، ثبت و اراضی','۲۰','۲','42000000'],
 ['EXP-DEMO-004','وکیل نمونه ۴','حقوق عمومی و اداری','ایران','دیوان عدالت اداری و مراجع عمومی','۱۲','۳','35000000'],
 ['EXP-DEMO-005','داور نمونه ۵','داوری و میانجیگری','ایران','داوری تجاری و حل‌وفصل اختلاف','۱۶','۳','50000000'],
 ['EXP-DEMO-006','مشاور نمونه ۶','مالی و مالیاتی','ایران','مالیات، مطالبات و امور مالی','۱۴','۲','40000000'],
 ['EXP-DEMO-007','کارشناس نمونه ۷','کار و تأمین اجتماعی','ایران','روابط کار و تأمین اجتماعی','۱۱','۴','30000000'],
 ['EXP-DEMO-008','مشاور بین‌المللی نمونه ۸','قراردادها و بازرگانی','آلمان / اتحادیه اروپا','قراردادهای فرامرزی و تطبیق حقوقی؛ نیازمند احراز صلاحیت در هر حوزه','۱۹','۲','1800']
 ];
 if(!rows('experts').some(x=>x.demo)){
  db.experts.push(...expertSamples.map((x,i)=>({id:x[0],demo:true,name:x[1],specialty:x[2],source:i<2?'داخلی':i===7?'بین‌المللی':'بیرونی داخلی',country:x[3],jurisdiction:x[4],yearsExperience:x[5],capacity:x[6],rate:x[7],currency:i===7?'یورو':'تومان',licenseNo:'شناسه نمونه ـ نیازمند راستی‌آزمایی',status:'فعال',conflictStatus:'بررسی نشده',expertise:'پروفایل نمایشی برای نمایش ظرفیت، ارجاع و ارزیابی؛ هویت و صلاحیت واقعی نیست.'})));
 }
 const demoIds=rows('cases').filter(x=>x.demo).map(x=>x.id);
 const expertIds=expertSamples.map(x=>x[0]);
 const extra=[
 ['اختلاف در تفسیر و اجرای قرارداد خدمات','قراردادها و تعهدات','در جریان رسیدگی','مهم','2026-01-14','2026-12-02','6200000000','موفقیت نسبی'],
 ['مطالبه وجه و خسارت ناشی از تأخیر','مطالبه وجه','اجرای حکم','فوری','2025-11-05','2026-11-26','3100000000','وصول مطالبات'],
 ['اعتراض به تشخیص و مطالبه مالیاتی','سایر','در حال مذاکره / سازش','مهم','2026-04-11','2026-11-30','2700000000','در حال رسیدگی'],
 ['اختلاف در مالکیت و حدود اراضی','ملکی','در جریان رسیدگی','فوری','2026-02-19','2026-12-05','9800000000','در حال رسیدگی'],
 ['اختلاف پیمانکار در تعدیل و صورت‌وضعیت','حقوقی','صدور رأی / حکم','مهم','2025-08-20','2026-12-08','5400000000','در حال رسیدگی'],
 ['درخواست ابطال تصمیم اداری','اداری و دیوان عدالت','ثبت و آماده‌سازی','عادی','2026-10-20','2026-12-10','0','در حال رسیدگی'],
 ['اختلاف در فسخ و خاتمه قرارداد','حقوقی','در حال مذاکره / سازش','مهم','2026-06-09','2026-11-28','4600000000','در حال رسیدگی'],
 ['دفاع در دعوای مطالبه خسارت','حقوقی','مختومه','عادی','2025-02-12','','1900000000','موفقیت کامل'],
 ['اختلاف کار و مطالبات بیمه‌ای','کار و تأمین اجتماعی','در جریان رسیدگی','عادی','2026-05-17','2026-12-14','850000000','در حال رسیدگی'],
 ['رسیدگی به اختلاف بین‌المللی تأمین کالا','داوری و میانجیگری','در حال مذاکره / سازش','فوری','2026-03-03','2026-12-18','12500000000','در حال رسیدگی'],
 ['اختلاف در تفسیر ضمانت‌نامه و تعهدات بانکی','حقوقی','در جریان رسیدگی','مهم','2026-04-06','2026-12-20','3300000000','در حال رسیدگی'],
 ['درخواست جبران خسارت ناشی از نقص خدمات','حقوقی','ثبت و آماده‌سازی','عادی','2026-09-16','2026-12-22','1450000000','در حال رسیدگی'],
 ['اختلاف در اجرای تعهدات مشارکت تجاری','داوری و میانجیگری','در جریان رسیدگی','فوری','2026-01-27','2026-12-24','7400000000','در حال رسیدگی'],
 ['رسیدگی به ادعای نقض حقوق مالکیت فکری','سایر','در حال مذاکره / سازش','مهم','2026-07-12','2026-12-26','2200000000','در حال رسیدگی']
 ];
 const add=[];
 for(let i=0;i<extra.length;i++){
  const n=i+1,id='CASE-DEMO-'+String(n).padStart(3,'0');if(demoIds.includes(id))continue;
  const x=extra[i],expertId=expertIds[i%expertIds.length];
  add.push({id,demo:true,title:x[0],caseNumber:'نمونه-۱۴۰۵-'+String(n).padStart(3,'0'),org:i%2?'HOLDING':'CMP-01-001',caseType:x[1],forum:'مرجع رسیدگی ـ نمونه نمایشی',opposingParty:'طرف مقابل ـ نمونه',lawyer:expertSamples[i%expertSamples.length][1],expertId,owner:'مسئول پیگیری نمونه',status:x[2],filedDate:x[4],judgmentDate:x[2]==='اجرای حکم'||x[2]==='مختومه'||x[2]==='صدور رأی / حکم'?'2026-09-10':'',executionStartDate:x[2]==='اجرای حکم'||x[2]==='مختومه'?'2026-09-25':'',executionEndDate:x[2]==='مختومه'?'2026-10-20':'',closedDate:x[2]==='مختومه'?'2026-10-22':'',priority:x[3],nextDate:x[2]==='مختومه'?'':x[5],claimValue:x[6],confidentiality:i%3===0?'محرمانه':'عادی',outcome:x[7],recoveredValue:x[7]==='وصول مطالبات'?'2100000000':'0',actualCost:String(9000000+(i*1700000)),summary:'نمونه نمایشی برای آزمون دسته‌بندی، گردش کار، ارجاع تخصصی و گزارش‌گیری؛ هیچ‌یک از اشخاص، شماره‌ها یا مبالغ، داده واقعی نیست.'});
 }
 if(add.length)db.cases.push(...add);
 rows('cases').filter(x=>x.demo).forEach((x,i)=>{if(!x.expertId)x.expertId=expertIds[i%expertIds.length];if(!x.outcome)x.outcome=x.status==='مختومه'?'موفقیت نسبی':'در حال رسیدگی';if(x.progress===undefined||x.progress==='')x.progress=x.status==='مختومه'?100:x.status==='اجرای حکم'?82:x.status==='صدور رأی / حکم'?68:x.status==='در حال مذاکره / سازش'?48:x.status==='در جریان رسیدگی'?36:18;});
 if(!rows('engagements').some(x=>x.demo)){
  const jobs=Array.from({length:14},(_,i)=>({id:'ENG-DEMO-'+String(i+1).padStart(3,'0'),demo:true,title:['بررسی و تنظیم لایحه دفاعیه','تحلیل قرارداد و ارائه نظر تخصصی','ارزیابی اسناد و سوابق ثبتی','تهیه دادخواست و پیگیری رسیدگی','ارزیابی امکان سازش و میانجیگری','بررسی مالی و محاسبه مطالبات','مشاوره روابط کار و بیمه'][i%7],expertId:expertIds[i%8],caseId:'CASE-DEMO-'+String(i+1).padStart(3,'0'),mode:['ارجاع اختصاصی','دعوت محدود از متخصصان','فراخوان مسئله‌محور'][i%3],scope:'شرح خدمات و خروجی مورد انتظار در این رکورد صرفاً نمایشی است.',status:['تأییدشده','تحویل‌شده','در حال انجام','در حال بازبینی'][i%4],startDate:'2026-08-'+String(3+i).padStart(2,'0'),dueDate:'2026-12-'+String(5+i).padStart(2,'0'),agreedFee:String(18000000+i*4200000),currency:'تومان',score:String(76+(i*7)%23),evaluation:'امتیاز و ارزیابی نمونه برای نمایش کارنامه متخصص؛ مبنای واقعی رتبه‌بندی نیست.'}));
  db.engagements.push(...jobs);
 }
 if(!rows('payments').some(x=>x.demo)){
  const pays=Array.from({length:11},(_,i)=>({id:'PAY-DEMO-'+String(i+1).padStart(3,'0'),demo:true,expertId:expertIds[i%8],engagementId:'ENG-DEMO-'+String(i+1).padStart(3,'0'),caseId:'CASE-DEMO-'+String(i+1).padStart(3,'0'),description:'حق‌الزحمه و هزینه خدمت تخصصی ـ نمونه',amount:String(9000000+i*3500000),currency:'تومان',paymentType:i%3===0?'پیش‌پرداخت':i%3===1?'مرحله‌ای':'تسویه نهایی',paymentDate:'2026-10-'+String(5+i).padStart(2,'0'),status:i<8?'پرداخت‌شده':i===8?'در انتظار تأیید':'درخواست پرداخت',invoiceNo:'سند نمونه '+(i+1),notes:'رکورد مالی نمایشی؛ برای آزمون گردش تأیید و گزارش هزینه.'}));
  db.payments.push(...pays);
 }
 if((Number(db.demoLegalExpandedVersion)||0)<2){db.demoLegalExpandedVersion=2;db.events.unshift({id:makeId('EVT'),at:now(),key:'cases',action:'تکمیل داده‌های نمایشی',title:'۱۴ پرونده نمونه و کارنامه متخصصان',note:'داده‌های نمونه برای نمایش نمودارها و گردش کار؛ قابل حذف یا جایگزینی'});await save();}
}

function countOpen(key,closed){return rows(key).filter(x=>!closed.includes(x.status)).length}
function dateOverdue(x){return x&&x<today()}
function upcoming(){
 const out=[];
 for(const [key,label,dateKey] of [['cases','پرونده','nextDate'],['sessions','جلسه تخصصی','sessionDate'],['contracts','قرارداد','endDate'],['requests','درخواست','dueDate'],['advice','مشاوره','dueDate'],['risks','ریسک','dueDate'],['arbitration','داوری','dueDate'],['employee','حمایت کارکنان','dueDate'],['compliance','انطباق','dueDate']]){
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
  const id=orgIdOf(r);
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
 const keys=['requests','cases','contracts','advice','arbitration','employee','experts','engagements','payments','sessions','risks','compliance','knowledge'];
 const labels={requests:'درخواست حقوقی',cases:'پرونده و دعوا',contracts:'قرارداد و تعهد',advice:'مشاوره حقوقی',arbitration:'داوری و سازش',employee:'حمایت کارکنان',experts:'بانک متخصصان',engagements:'ارجاع کار',payments:'هزینه و پرداخت',sessions:'جلسات تخصصی',risks:'ریسک حقوقی',compliance:'انطباق و مقررات',knowledge:'اسناد و دانش حقوقی'};
 const counts=keys.map(k=>[labels[k],scopeRows(k).length,k]);
 const total=counts.reduce((a,x)=>a+x[1],0);
 const totalCases=scopeRows('cases').length,openCases=scopeRows('cases').filter(x=>x.status!=='مختومه').length,closedCases=totalCases-openCases;
 const openRequests=scopeRows('requests').filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).length,closedRequests=scopeRows('requests').length-openRequests;
 const allScoped=keys.flatMap(k=>scopeRows(k).map(r=>({key:k,record:r})));
 const chart=(items,max,mode='horizontal')=>{
  const palette=['#287fa8','#e39a3b','#26a28a','#8b70c7','#d66d7d','#5b9dce','#9a8055','#668d9e'];
  const safe=items.map(x=>[String(x[0]),Math.max(0,Number(x[1])||0)]),peak=Math.max(1,max||0,...safe.map(x=>x[1])),sum=safe.reduce((a,x)=>a+x[1],0);
  if(mode==='column')return '<div class="lw-column-chart" role="img" aria-label="نمودار ستونی مقایسه مقادیر">'+safe.map((x,i)=>'<div class="lw-column-item" title="'+esc(x[0])+': '+fa(x[1])+'"><div class="lw-column-value">'+fa(x[1])+'</div><div class="lw-column-track"><span style="height:'+Math.max(x[1]?5:0,x[1]/peak*100)+'%;--bar-color:'+palette[i%palette.length]+'"></span></div><div class="lw-column-label">'+esc(x[0])+'</div></div>').join('')+'</div>';
  if(mode==='donut'){
   let cursor=0;const stops=safe.filter(x=>x[1]>0).map((x,i)=>{const start=cursor;cursor+=sum?x[1]/sum*100:0;return palette[i%palette.length]+' '+start.toFixed(2)+'% '+cursor.toFixed(2)+'%';}).join(',');
   return '<div class="lw-donut-layout"><div class="lw-donut" role="img" aria-label="نمودار دایره‌ای؛ مجموع '+fa(sum)+'" style="background:conic-gradient('+stops+')"><div class="lw-donut-hole"><strong>'+fa(sum)+'</strong><small>مجموع</small></div></div><div class="lw-donut-legend">'+safe.map((x,i)=>'<div><i style="--legend-color:'+palette[i%palette.length]+'"></i><span>'+esc(x[0])+'</span><b>'+fa(x[1])+'</b></div>').join('')+'</div></div>';
  }
  return safe.map(x=>'<div class="lw-chart-row"><span>'+esc(x[0])+'</span><div class="lw-chart-track"><span style="width:'+(peak?x[1]/peak*100:0)+'%"></span></div><b>'+fa(x[1])+'</b></div>').join('');
 };
 const maxCategory=Math.max(1,...counts.map(x=>x[1]));
 const caseStages=['ثبت و آماده‌سازی','در جریان رسیدگی','صدور رأی / حکم','اجرای حکم','در حال مذاکره / سازش','متوقف','مختومه'];const statusItems=caseStages.map(stage=>[stage,scopeRows('cases').filter(x=>x.status===stage).length]).concat([['درخواست‌های باز',openRequests],['درخواست‌های تعیین‌تکلیف‌شده',closedRequests]]);
 const statusMax=Math.max(1,...statusItems.map(x=>x[1]));
 const orgItems=orgs().map(o=>[o.label,allScoped.filter(x=>{const id=orgIdOf(x.record);return id===o.id||((orgRegistry.deputies||[]).some(d=>d.organization_id===o.id)&&(orgRegistry.companies||[]).some(c=>c.organization_id===id&&c.parent_organization_id===o.id))}).length]).filter(x=>x[1]>0||orgScope==='all');
 const unassignedCount=allScoped.filter(x=>!orgIdOf(x.record)).length;
 if(orgScope==='all')orgItems.push(['فاقد انتساب سازمانی',unassignedCount]);
 const orgMax=Math.max(1,...orgItems.map(x=>x[1]));
 const eventItems=upcoming().filter(x=>orgScope==='all'||scopeRows(x.key).some(r=>r.id===x.id)).slice(0,8);
 const orgChoices=[{id:'all',label:'کل هلدینگ',group:'عمومی'},{id:'HOLDING',label:'ستاد هلدینگ',group:'عمومی'},...(orgRegistry.deputies||[]).map(x=>({id:x.organization_id,label:x.name||('معاونت '+fa(x.sequence)),group:'معاونت‌ها'})),...(orgRegistry.companies||[]).map(x=>({id:x.organization_id,label:x.name,group:'شرکت‌های تابعه'})),...(orgRegistry.provincial_branch_managements||[]).map(x=>({id:x.organization_id,label:'مدیریت شعب استانی '+fa(x.sequence),group:'مدیریت‌های استانی'})),{id:'unassigned',label:'فاقد انتساب سازمانی',group:'عمومی'}];
 const activeOrg=orgChoices.find(x=>x.id===orgScope)||orgChoices[0],visibleOrgChoices=orgChoices.filter(x=>(x.label+' '+x.group).toLowerCase().includes(orgPickerQuery.toLowerCase()));
 const orgPicker='<div class="lw-org-picker"><button type="button" class="lw-org-trigger" aria-expanded="'+(orgPickerOpen?'true':'false')+'" aria-haspopup="listbox" data-action="toggle-org-picker"><span><small>دامنه گزارش</small><strong>'+esc(activeOrg.label)+'</strong></span><span class="lw-org-chevron">⌄</span></button>'+(orgPickerOpen?'<div class="lw-org-menu"><input type="search" id="lw-org-search" placeholder="جست‌وجوی معاونت یا شرکت..." value="'+esc(orgPickerQuery)+'" autocomplete="off"><div class="lw-org-options" role="listbox">'+(visibleOrgChoices.length?visibleOrgChoices.map(x=>'<button type="button" role="option" aria-selected="'+(x.id===orgScope)+'" class="lw-org-option '+(x.id===orgScope?'selected':'')+'" data-org-scope="'+esc(x.id)+'"><span>'+esc(x.label)+'</span><small>'+esc(x.group)+'</small></button>').join(''):'<div class="lw-empty">موردی با این عبارت پیدا نشد.</div>')+'</div></div>':'')+'</div>';
 const demoBanner=rows('cases').some(x=>x.demo)?'<div class="lw-alert warn">پرونده‌های دارای برچسب «نمونه نمایشی» برای نمایش چرخه کار درج شده‌اند؛ آن‌ها را با اطلاعات واقعی جایگزین یا حذف کنید.</div>':'';
 return demoBanner+'<div class="lw-toolbar lw-overview-toolbar">'+orgPicker+'<span class="lw-spacer"></span><button class="lw-btn" data-action="new" data-key="requests">＋ ثبت درخواست</button><button class="lw-btn light" data-action="new" data-key="cases">＋ ثبت پرونده</button><button class="lw-btn light" data-action="new" data-key="contracts">＋ ثبت قرارداد</button></div>'+
 '<div class="lw-metrics">'+metric('کل فعالیت‌های ثبت‌شده',total,'همه حوزه‌های حقوقی')+metric('درخواست‌های باز',openRequests,'در صف رسیدگی')+metric('کل پرونده‌ها',totalCases,'فعال و بایگانی‌شده')+metric('پرونده‌های فعال',openCases,'دعاوی و اختلافات')+metric('قراردادهای جاری',scopeRows('contracts').filter(x=>!['خاتمه‌یافته','فسخ‌شده'].includes(x.status)).length,'دارای تعهد فعال')+metric('مشاوره‌های باز',scopeRows('advice').filter(x=>!['تأیید و ابلاغ','مختومه'].includes(x.status)).length,'در انتظار پاسخ')+metric('ریسک‌های باز',scopeRows('risks').filter(x=>!['رفع‌شده','پذیرفته‌شده با مجوز'].includes(x.status)).length,'نیازمند کنترل')+metric('داوری و سازش',scopeRows('arbitration').filter(x=>!['سازش‌شده','مختومه'].includes(x.status)).length,'حل اختلاف جایگزین')+metric('حمایت کارکنان',scopeRows('employee').filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).length,'در حال رسیدگی')+metric('متخصصان ثبت‌شده',scopeRows('experts').length,'شبکه تخصصی')+'</div>'+
 '<div class="lw-grid"><section class="lw-panel"><h3>ترکیب فعالیت‌های حقوقی</h3><p class="lw-muted">تعداد اطلاعات ثبت‌شده در هر حوزه تخصصی</p>'+(total?'<div class="lw-chart-bars">'+chart(counts,maxCategory,'column')+'</div>':'<div class="lw-empty"><strong>هنوز اطلاعاتی ثبت نشده است</strong>با ثبت درخواست، پرونده و سایر اطلاعات، این نمودار به‌صورت خودکار تکمیل می‌شود.</div>')+'</section>'+
 '<section class="lw-panel"><h3>وضعیت رسیدگی</h3><p class="lw-muted">تفکیک پرونده‌ها و درخواست‌ها بر اساس وضعیت جاری</p>'+(statusItems.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(statusItems,statusMax)+'</div>':'<div class="lw-empty"><strong>داده‌ای برای تحلیل وضعیت وجود ندارد</strong></div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel lw-wide"><h3>پراکندگی فعالیت در معاونت‌ها و شرکت‌ها</h3><p class="lw-muted">گزارش بر اساس انتساب سازمانی هر رکورد؛ با انتخاب دامنه از بالای صفحه قابل محدودسازی است.</p>'+(orgItems.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(orgItems,orgMax,'column')+'</div>':'<div class="lw-empty"><strong>هنوز رکوردی به معاونت یا شرکت منتسب نشده است</strong></div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel"><h3>مهلت‌ها و رویدادهای نزدیک</h3>'+(eventItems.length?'<div class="lw-list">'+eventItems.map(x=>'<div class="lw-row"><div><strong>'+esc(x.title)+'</strong><small>'+esc(x.label)+' · '+fmtDate(x.date)+'</small></div>'+badge(x.late?'معوق':'سررسید')+'</div>').join('')+'</div>':'<div class="lw-empty"><strong>مهلت ثبت‌شده‌ای وجود ندارد</strong></div>')+'</section><section class="lw-panel"><h3>تفکیک اطلاعات بر پایه ساختار سازمانی</h3><div class="lw-list">'+counts.map(x=>'<div class="lw-row"><strong>'+x[0]+'</strong><span class="lw-badge">'+fa(x[1])+'</span></div>').join('')+'</div></section></div>';
}
function performanceView(){
 const keys=['requests','cases','contracts','advice','arbitration','employee','experts','engagements','payments','sessions','risks','compliance','knowledge'];
 const labels={requests:'درخواست‌ها',cases:'پرونده‌ها',contracts:'قراردادها',advice:'مشاوره‌ها',arbitration:'داوری و سازش',employee:'حمایت کارکنان',experts:'متخصصان',engagements:'ارجاع کار',payments:'پرداخت‌ها',sessions:'جلسات',risks:'ریسک‌ها',compliance:'انطباق',knowledge:'اسناد حقوقی'};
 const counts=keys.map(k=>[labels[k],scopeRows(k).length]);
 const total=counts.reduce((a,x)=>a+x[1],0);
 const activeCases=scopeRows('cases').filter(x=>x.status!=='مختومه').length;
 const closedCases=scopeRows('cases').filter(x=>x.status==='مختومه').length;
 const overdue=upcoming().filter(x=>x.late&&scopeRows(x.key).some(r=>r.id===x.id)).length;
 const openRequests=scopeRows('requests').filter(x=>!['پاسخ داده‌شده','مختومه'].includes(x.status)).length;
 const closedRequests=scopeRows('requests').filter(x=>['پاسخ داده‌شده','مختومه'].includes(x.status)).length;
 const status=[['درخواست‌های باز',openRequests],['درخواست‌های تعیین‌تکلیف‌شده',closedRequests],['پرونده‌های فعال',activeCases],['پرونده‌های مختومه',closedCases],['مهلت‌های معوق',overdue]];
 const caseRows=scopeRows('cases'),resolved=caseRows.filter(x=>x.status==='مختومه'&&x.outcome&&x.outcome!=='در حال رسیدگی'),positive=resolved.filter(x=>['موفقیت کامل','موفقیت نسبی','سازش مطلوب','وصول مطالبات','جلوگیری از زیان'].includes(x.outcome)),successRate=resolved.length?Math.round(positive.length/resolved.length*100):null,progressRows=caseRows.filter(x=>x.progress!==undefined&&x.progress!==''),avgProgress=progressRows.length?Math.round(progressRows.reduce((s,x)=>s+(Number(x.progress)||0),0)/progressRows.length):0,expertJobs=scopeRows('engagements'),paidItems=scopeRows('payments').filter(x=>x.status==='پرداخت‌شده'),paidTotal=paidItems.filter(x=>!x.currency||x.currency==='تومان').reduce((s,x)=>s+(Number(x.amount)||0),0),scores=expertJobs.map(x=>Number(x.score)).filter(x=>x>0),avgScore=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
 const chart=(items,mode='horizontal')=>{
  const palette=['#287fa8','#e39a3b','#26a28a','#8b70c7','#d66d7d','#5b9dce','#9a8055','#668d9e'];
  const safe=items.map(x=>[String(x[0]),Math.max(0,Number(x[1])||0)]),max=Math.max(1,...safe.map(x=>x[1])),sum=safe.reduce((a,x)=>a+x[1],0);
  if(mode==='column')return '<div class="lw-column-chart" role="img" aria-label="نمودار ستونی مقایسه مقادیر">'+safe.map((x,i)=>'<div class="lw-column-item" title="'+esc(x[0])+': '+fa(x[1])+'"><div class="lw-column-value">'+fa(x[1])+'</div><div class="lw-column-track"><span style="height:'+Math.max(x[1]?5:0,x[1]/max*100)+'%;--bar-color:'+palette[i%palette.length]+'"></span></div><div class="lw-column-label">'+esc(x[0])+'</div></div>').join('')+'</div>';
  if(mode==='donut'){let cursor=0;const stops=safe.filter(x=>x[1]>0).map((x,i)=>{const start=cursor;cursor+=sum?x[1]/sum*100:0;return palette[i%palette.length]+' '+start.toFixed(2)+'% '+cursor.toFixed(2)+'%';}).join(',');return '<div class="lw-donut-layout"><div class="lw-donut" role="img" aria-label="نمودار دایره‌ای؛ مجموع '+fa(sum)+'" style="background:conic-gradient('+stops+')"><div class="lw-donut-hole"><strong>'+fa(sum)+'</strong><small>مجموع</small></div></div><div class="lw-donut-legend">'+safe.map((x,i)=>'<div><i style="--legend-color:'+palette[i%palette.length]+'"></i><span>'+esc(x[0])+'</span><b>'+fa(x[1])+'</b></div>').join('')+'</div></div>';}
  return safe.map(x=>'<div class="lw-chart-row"><span>'+esc(x[0])+'</span><div class="lw-chart-track"><span style="width:'+(x[1]/max*100)+'%"></span></div><b>'+fa(x[1])+'</b></div>').join('');
 };
 const orgItems=orgs().map(o=>[o.label,keys.reduce((sum,k)=>sum+scopeRows(k).filter(r=>{const id=orgIdOf(r);return id===o.id||((orgRegistry.deputies||[]).some(d=>d.organization_id===o.id)&&(orgRegistry.companies||[]).some(c=>c.organization_id===id&&c.parent_organization_id===o.id))}).length,0)]).filter(x=>x[1]>0||orgScope==='all');
 const caseTypeItems=Object.entries(caseRows.reduce((a,x)=>{const k=x.caseType||'بدون دسته‌بندی';a[k]=(a[k]||0)+1;return a;},{})).map(([k,v])=>[k,v]);
 const ownerItems=Object.entries(caseRows.reduce((a,x)=>{const k=x.owner||'بدون مسئول';a[k]=(a[k]||0)+1;return a;},{})).map(([k,v])=>[k,v]).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const orgOptions='<option value="all" '+(orgScope==='all'?'selected':'')+'>کل هلدینگ</option><option value="HOLDING" '+(orgScope==='HOLDING'?'selected':'')+'>ستاد هلدینگ</option>'+((orgRegistry.deputies||[]).map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>'+esc(x.name||('معاونت '+fa(x.sequence)))+'</option>').join(''))+((orgRegistry.companies||[]).length?'<optgroup label="شرکت‌های تابعه">'+orgRegistry.companies.map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</optgroup>':'')+((orgRegistry.provincial_branch_managements||[]).length?'<optgroup label="مدیریت‌های استانی">'+orgRegistry.provincial_branch_managements.map(x=>'<option value="'+esc(x.organization_id)+'" '+(orgScope===x.organization_id?'selected':'')+'>مدیریت شعب استانی '+fa(x.sequence)+'</option>').join('')+'</optgroup>':'');
 const demoBanner=caseRows.some(x=>x.demo)?'<div class="lw-alert warn">۱۴ پرونده نمونه و پروفایل‌های متخصصان برای نمایش نمودارها و گردش کار درج شده‌اند؛ این داده‌ها واقعی نیستند و باید پیش از گزارش رسمی با داده‌های سازمان جایگزین شوند.</div>':'';
 return demoBanner+'<div class="lw-toolbar"><label class="lw-filter-label" for="legal-org-scope">دامنه گزارش</label><select id="legal-org-scope">'+orgOptions+'</select></div>'+
 '<div class="lw-metrics">'+metric('کل اطلاعات ثبت‌شده',total,'همه حوزه‌ها')+metric('کل پرونده‌ها',caseRows.length,'فعال و بایگانی‌شده')+metric('پرونده‌های فعال',activeCases,'در جریان رسیدگی')+metric('پرونده‌های مختومه',closedCases,'تعیین تکلیف شده')+metric('درخواست‌های باز',openRequests,'نیازمند رسیدگی')+metric('درخواست‌های پاسخ‌داده‌شده',closedRequests,'پاسخ یا اختتام')+metric('مهلت‌های معوق',overdue,'نیازمند اقدام فوری')+metric('میانگین پیشرفت پرونده‌ها',progressRows.length?avgProgress+'٪':'—','ثبت‌شده برای '+fa(progressRows.length)+' پرونده')+metric('نرخ نتیجه مطلوب',successRate===null?'—':successRate+'٪','از پرونده‌های مختومه دارای نتیجه')+metric('ارجاع‌های تخصصی',expertJobs.length,'کارهای واگذارشده')+metric('پرداخت متخصصان',fa(paidTotal),'تومان پرداخت‌شده')+metric('میانگین امتیاز متخصصان',avgScore===null?'—':fa(avgScore)+'٪','از ارزیابی‌های ثبت‌شده')+'</div>'+
 '<div class="lw-grid"><section class="lw-panel"><h3>عملکرد به تفکیک حوزه حقوقی</h3><p class="lw-muted">حجم ثبت‌شده در هر بخش از مرکز</p>'+(total?'<div class="lw-chart-bars">'+chart(counts,'column')+'</div>':'<div class="lw-empty"><strong>داده‌ای برای گزارش وجود ندارد</strong>با ثبت اطلاعات، شاخص‌ها و نمودارها تکمیل می‌شوند.</div>')+'</section><section class="lw-panel"><h3>وضعیت رسیدگی و تعیین تکلیف</h3><p class="lw-muted">تعداد درخواست‌ها، پرونده‌ها و مهلت‌ها در هر وضعیت</p>'+(status.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(status)+'</div>':'<div class="lw-empty"><strong>هنوز وضعیتی برای سنجش ثبت نشده است</strong></div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel"><h3>ترکیب نتایج پرونده‌های مختومه</h3><p class="lw-muted">نرخ نتیجه مطلوب فقط بر اساس پرونده‌های مختومه‌ای محاسبه می‌شود که نتیجه آن‌ها ثبت شده باشد.</p>'+(resolved.length?'<div class="lw-chart-bars">'+chart([['نتیجه مطلوب',positive.length],['نتیجه نامطلوب',resolved.length-positive.length]],'donut')+'</div>':'<div class="lw-empty">برای محاسبه نرخ موفقیت، نتیجه پرونده‌های مختومه را ثبت کنید.</div>')+'</section><section class="lw-panel"><h3>پیشرفت ثبت‌شده پرونده‌ها</h3><p class="lw-muted">درصد تکمیل ثبت‌شده توسط مسئول پرونده؛ شاخص تقریبی و قابل بازبینی است.</p>'+chart([['پیشرفت متوسط',avgProgress],['باقی‌مانده',100-avgProgress]],'donut')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel"><h3>تفکیک پرونده‌ها بر اساس موضوع</h3>'+ (caseTypeItems.length?'<div class="lw-chart-bars">'+chart(caseTypeItems,'column')+'</div>':'<div class="lw-empty">پرونده‌ای برای دسته‌بندی وجود ندارد.</div>')+'</section><section class="lw-panel"><h3>توزیع پرونده‌ها بر اساس مسئول پیگیری</h3>'+ (ownerItems.length?'<div class="lw-chart-bars">'+chart(ownerItems)+'</div>':'<div class="lw-empty">مسئولی برای پرونده‌ها ثبت نشده است.</div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel lw-wide"><h3>کارنامه متخصصان و ارجاع‌ها</h3><p class="lw-muted">تعداد مأموریت‌های ارجاع‌شده به هر متخصص</p>'+(scopeRows('experts').length?'<div class="lw-chart-bars">'+chart(scopeRows('experts').map(e=>[e.name,scopeRows('engagements').filter(j=>j.expertId===e.id).length]))+'</div>':'<div class="lw-empty">بانک متخصصان هنوز خالی است.</div>')+'</section></div>'+
 '<div class="lw-grid" style="margin-top:11px"><section class="lw-panel lw-wide"><h3>عملکرد معاونت‌ها و شرکت‌ها</h3><p class="lw-muted">تعداد کل اطلاعات حقوقی منتسب به هر واحد سازمانی</p>'+(orgItems.some(x=>x[1])?'<div class="lw-chart-bars">'+chart(orgItems,'column')+'</div>':'<div class="lw-empty"><strong>هنوز اطلاعاتی به واحدهای سازمانی منتسب نشده است</strong></div>')+'</section></div>'+
 '<div class="lw-panel"><h3>مبنای محاسبه شاخص‌ها</h3><p class="lw-muted">گزارش‌ها فقط از اطلاعات ثبت‌شده در مرکز ساخته می‌شوند. هیچ آمار نمونه‌ای به‌جای عملکرد واقعی نمایش داده نمی‌شود. برای دقیق‌تر شدن گزارش، هر رکورد باید واحد سازمانی، وضعیت و تاریخ‌های مربوط را داشته باشد.</p></div>';
}
function fieldHtml(f,value){
 const val=value??'',req=f.required?'required':'',full=f.full?' full':'';
 if(f.type==='textarea')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+(f.required?' *':'')+'</label><textarea name="'+f.name+'" '+req+'>'+esc(val)+'</textarea></div>';
 if(f.type==='select')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="'+f.name+'">'+(f.options||[]).map(x=>'<option '+(x===val?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
 if(f.type==='org')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="org">'+orgs().map(x=>'<option value="'+esc(x.id)+'" '+(x.id===val?'selected':'')+'>'+esc(x.label)+'</option>').join('')+'</select></div>';
 if(f.type==='expert')return '<div class="lw-field'+full+'"><label>'+esc(f.label)+'</label><select name="'+f.name+'"><option value="">انتخاب متخصص</option>'+rows('experts').map(x=>'<option value="'+esc(x.id)+'" '+(x.id===val?'selected':'')+'>'+esc(x.name)+' · '+esc(x.specialty||'')+'</option>').join('')+'</select></div>';
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
function caseTimeline(x){const parts=[['ثبت',x.filedDate],['حکم',x.judgmentDate],['شروع اجرا',x.executionStartDate],['پایان اجرا',x.executionEndDate],['اختتام',x.closedDate]].filter(p=>p[1]);return parts.map(p=>p[0]+' '+fmtDate(p[1])).join(' ← ')||'تاریخچه زمانی تکمیل نشده';}
function expertStats(id){const ex=rows('experts').find(e=>e.id===id);const cases=rows('cases').filter(x=>x.expertId===id||(!x.expertId&&ex&&x.lawyer===ex.name));const jobs=rows('engagements').filter(x=>x.expertId===id);const pays=rows('payments').filter(x=>x.expertId===id);const paid=pays.filter(x=>x.status==='پرداخت‌شده'&&(!x.currency||x.currency==='تومان')).reduce((s,x)=>s+(Number(x.amount)||0),0);const scores=jobs.map(x=>Number(x.score)).filter(x=>Number.isFinite(x)&&x>0);return {cases:cases.length,jobs:jobs.length,paid,score:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null};}
function tableHtml(key){
 const def=defs[key];let items=rows(key).filter(x=>!query||JSON.stringify(x).toLowerCase().includes(query.toLowerCase()));
 if(key==='cases'&&caseFilter==='active')items=items.filter(x=>x.status!=='مختومه');if(key==='cases'&&caseFilter==='archived')items=items.filter(x=>x.status==='مختومه');
 if(key==='experts')items.sort((a,b)=>(expertStats(b.id).score||0)-(expertStats(a.id).score||0));
 if(!items.length)return '<div class="lw-empty"><strong>موردی ثبت نشده است</strong></div>';
 const titleField=key==='experts'?'name':key==='payments'?'description':'title';
 const subField={requests:'serviceType',cases:'caseNumber',contracts:'contractNo',advice:'subject',arbitration:'method',employee:'serviceType',experts:'specialty',engagements:'mode',payments:'paymentType',sessions:'specialty',risks:'category',compliance:'category',knowledge:'docType'}[key];
 const statusField='status';
 const dateField={requests:'dueDate',cases:'nextDate',contracts:'endDate',advice:'dueDate',arbitration:'dueDate',employee:'dueDate',experts:'',engagements:'dueDate',payments:'paymentDate',sessions:'sessionDate',risks:'dueDate',compliance:'dueDate',knowledge:'reviewDate'}[key];
 return '<div class="lw-table-wrap"><table class="lw-table"><thead><tr><th>عنوان / شناسه</th><th>حوزه / مرجع</th><th>واحد / مسئول</th><th>وضعیت</th><th>تاریخ مهم</th><th>عملیات</th></tr></thead><tbody>'+items.map((x,i)=>'<tr><td><strong>'+(key==='experts'?'رتبه '+fa(i+1)+' · ':'')+esc(x[titleField])+'</strong><small>'+esc(x.id)+'</small></td><td>'+(key==='experts'?esc(x.specialty||'')+' · '+esc(x.source||'')+' · '+esc(x.country||'')+' · ظرفیت '+fa(x.capacity||0):esc(x[subField]||x.caseType||x.contractType||'—'))+'</td><td>'+(key==='experts'?(()=>{const s=expertStats(x.id);return fa(s.cases)+' پرونده · '+fa(s.jobs)+' ارجاع · پرداخت '+fa(s.paid)+' تومان · امتیاز '+(s.score===null?'—':fa(s.score))})():key==='cases'?esc(orgLabel(x.org)+' · '+(x.owner||'بدون مسئول')):(key==='engagements'||key==='payments')?esc(rows('experts').find(e=>e.id===x.expertId)?.name||'متخصص انتخاب‌نشده')+' · '+esc(x.caseId||'بدون پرونده مرتبط'):esc(x.org?orgLabel(x.org):(x.requester||x.owner||'—')))+'</td><td>'+badge(x[statusField])+(x.demo?'<small class="lw-demo-mark">نمونه نمایشی</small>':'')+'</td><td>'+fmtDate(x[dateField])+(key==='cases'?'<small>'+caseTimeline(x)+'</small>':'')+'</td><td><div class="lw-actions"><button data-action="view" data-key="'+key+'" data-id="'+esc(x.id)+'">نمایش</button><button data-action="edit" data-key="'+key+'" data-id="'+esc(x.id)+'">ویرایش</button><button class="delete" data-action="delete" data-key="'+key+'" data-id="'+esc(x.id)+'">حذف</button></div></td></tr>').join('')+'</tbody></table></div>';
}
function detailHtml(key,id){
 const item=rows(key).find(x=>x.id===id);if(!item)return '<div class="lw-empty">رکورد پیدا نشد.</div>';
 const def=defs[key],labels=Object.fromEntries((def?.fields||[]).map(f=>[f.name,f.label])),hidden=new Set(['id','createdAt','updatedAt','demo','attachments']);
 const entries=Object.entries(item).filter(([k,v])=>!hidden.has(k)&&v!==''&&v!==null&&v!==undefined).map(([k,v])=>{let value=Array.isArray(v)?v.join('، '):typeof v==='object'?JSON.stringify(v):String(v);if(/date$/i.test(k)||['filedDate','judgmentDate','executionStartDate','executionEndDate','closedDate','nextDate','paymentDate','sessionDate'].includes(k))value=fmtDate(value);if(k==='org')value=orgLabel(value);if(k==='expertId')value=rows('experts').find(x=>x.id===value)?.name||value;return '<div class="lw-detail-field"><small>'+esc(labels[k]||k)+'</small><div>'+esc(value)+'</div></div>';}).join('');
 const attachments=(item.attachments||[]).map(a=>'<div class="lw-attachment"><span>'+esc(a.name)+' · '+fa(Math.ceil((a.size||0)/1024))+' کیلوبایت</span><button class="lw-btn light" data-action="download-file" data-file="'+esc(a.id)+'">دریافت پیوست</button></div>').join('');
 return '<section class="lw-detail-wrap"><header><div><h3>نمایش کامل '+esc(def?.singular||'رکورد')+'</h3><small>'+esc(item.id)+(item.demo?' · نمونه نمایشی':'')+'</small></div><button class="lw-btn light" data-action="close-detail">بازگشت به فهرست</button></header><div class="lw-detail-grid">'+(entries||'<div class="lw-empty">جزئیاتی ثبت نشده است.</div>')+'</div>'+(attachments?'<div class="lw-detail-attachments"><h4>پیوست‌ها و مستندات</h4>'+attachments+'</div>':'')+'<div class="lw-form-actions"><button class="lw-btn" data-action="edit" data-key="'+key+'" data-id="'+esc(id)+'">ویرایش این رکورد</button><button class="lw-btn light" data-action="close-detail">بازگشت</button></div></section>';
}
function listView(key){
 const def=defs[key];
 return (key==='cases'?'<div class="lw-toolbar lw-case-filters"><button class="lw-btn '+(caseFilter==='all'?'':'light')+'" data-case-filter="all">همه پرونده‌ها</button><button class="lw-btn '+(caseFilter==='active'?'':'light')+'" data-case-filter="active">پرونده‌های جاری</button><button class="lw-btn '+(caseFilter==='archived'?'':'light')+'" data-case-filter="archived">آرشیو مختومه‌ها</button></div>':'')+'<div class="lw-toolbar"><input id="lw-search" type="search" placeholder="جست‌وجو در اطلاعات..." value="'+esc(query)+'"><span class="lw-spacer"></span><button class="lw-btn" data-action="new" data-key="'+key+'">＋ ثبت '+esc(def.singular)+'</button></div>'+tableHtml(key);
}
function backupView(){return '<div class="lw-alert">اطلاعات مرکز حقوقی در مخزن محلی همین مرورگر (IndexedDB) نگهداری می‌شود و برای ثبت و ویرایش به پایگاه داده هاست وابسته نیست. برای انتقال به دستگاه دیگر یا محافظت در برابر پاک‌شدن داده‌های مرورگر، فایل پشتیبان را جداگانه نگهداری کنید.</div><div id="lw-vault-stats" class="lw-metrics"><div class="lw-metric"><small>مخزن محلی</small><strong>در حال بررسی…</strong></div></div><div class="lw-grid"><section class="lw-panel"><h3>پشتیبان‌گیری</h3><p>خروجی رکوردها، پیوست‌ها و تاریخچه تغییرات مرکز حقوقی.</p><button class="lw-btn" data-action="export">دریافت فایل پشتیبان</button><button class="lw-btn light" data-action="export-folder">ذخیره در پوشه محلی انتخابی</button><button class="lw-btn light" data-action="snapshot" style="margin-inline-start:6px">ثبت نقطه بازیابی محلی</button></section><section class="lw-panel"><h3>بازیابی اطلاعات</h3><p>بازیابی از فایل JSON؛ پیش از جایگزینی، نسخه فعلی را پشتیبان بگیرید.</p><input id="lw-import-file" type="file" accept=".json,application/json"><label class="lw-import-mode-label" for="lw-import-mode">روش به‌روزرسانی آفلاین</label><select id="lw-import-mode"><option value="merge">ادغام و به‌روزرسانی رکوردهای هم‌شناسه</option><option value="replace">جایگزینی کامل اطلاعات این مرکز</option></select><div style="margin-top:9px"><button class="lw-btn gold" data-action="import">ورود و به‌روزرسانی اطلاعات</button></div></section></div><section class="lw-panel" style="margin-top:16px"><h3>نقاط بازیابی محلی</h3><div id="lw-local-snapshots">در حال بارگذاری…</div></section>';}
function render(){
 const title=tab==='overview'?'نمای کلی مرکز حقوقی':tab==='performance'?'گزارش عملکرد مرکز حقوقی':tab==='backup'?'پشتیبان‌گیری و بازیابی':defs[tab]?.label||'مرکز حقوقی';
 const localTabs=pageTabs.length>1?'<div class="lw-tabs">'+pageTabs.map(k=>'<button class="lw-tab '+(tab===k?'active':'')+'" data-tab="'+k+'">'+(k==='overview'?'نمای کلی':k==='backup'?'پشتیبان‌گیری':(defs[k]?.label||k))+'</button>').join('')+'</div>':'';
 app.innerHTML=localTabs+'<div class="lw-content"><div id="lw-status" class="lw-alert" hidden></div><h3 style="font-size:12px;color:#355b77;margin:0 0 11px">'+title+'</h3><div id="lw-view">'+(tab==='overview'?overview():tab==='performance'?performanceView():tab==='backup'?backupView():listView(tab))+'</div></div>';
 updateCenterNav();
 if(tab==='backup')renderBackupStats().catch(e=>console.warn(e));
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
 if(key==='cases'){
 if(record.progress!==''&&(Number(record.progress)<0||Number(record.progress)>100))throw new Error('درصد پیشرفت باید بین صفر تا ۱۰۰ باشد.');
 if(!record.filedDate)throw new Error('تاریخ ثبت / آغاز پرونده الزامی است.');
 if(record.judgmentDate&&record.judgmentDate<record.filedDate)throw new Error('تاریخ صدور حکم نمی‌تواند پیش از تاریخ ثبت پرونده باشد.');
 if(record.executionStartDate&&!record.judgmentDate)throw new Error('برای ثبت آغاز اجرای حکم، ابتدا تاریخ صدور رأی / حکم را وارد کنید.');
 if(record.executionEndDate&&!record.executionStartDate)throw new Error('برای ثبت پایان اجرای حکم، تاریخ آغاز اجرا الزامی است.');
 if(record.executionEndDate&&record.executionEndDate<record.executionStartDate)throw new Error('پایان اجرای حکم نمی‌تواند پیش از آغاز آن باشد.');
 if(record.closedDate&&record.executionEndDate&&record.closedDate<record.executionEndDate)throw new Error('تاریخ مختومه‌شدن نمی‌تواند پیش از پایان اجرای حکم باشد.');
 if(record.status==='صدور رأی / حکم'&&!record.judgmentDate)throw new Error('برای این مرحله، تاریخ صدور رأی / حکم را وارد کنید.');
 if(record.status==='اجرای حکم'&&(!record.judgmentDate||!record.executionStartDate))throw new Error('مرحله اجرای حکم به تاریخ صدور حکم و تاریخ آغاز اجرا نیاز دارد.');
 if(record.status==='مختومه'&&!record.closedDate)throw new Error('برای مختومه‌کردن پرونده، تاریخ مختومه‌شدن را ثبت کنید.');
 if(record.closedDate)record.status='مختومه';
 else if(record.executionStartDate&&record.status!=='متوقف')record.status='اجرای حکم';
 else if(record.judgmentDate&&!record.executionStartDate&&!['متوقف','در حال مذاکره / سازش'].includes(record.status))record.status='صدور رأی / حکم';
}
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
async function maybeLocalSnapshot(){
 const vault=window.HoldingLocalDataVault;if(!vault)return;
 const last=await vault.getMeta('legal-center-last-snapshot'),nowMs=Date.now();
 if(last&&nowMs-Number(last)<30*60*1000)return;
 await createLocalSnapshot();await vault.setMeta('legal-center-last-snapshot',String(nowMs));
}
async function createLocalSnapshot(){
 const vault=window.HoldingLocalDataVault;if(!vault)throw new Error('مخزن محلی در دسترس نیست.');
 const data=await vault.exportData(SCOPE),snapshots=await vault.all('holding-local-backups');
 const item={id:'LEGAL-SNAP-'+Date.now(),kind:'local-snapshot',title:'نقطه بازیابی مرکز حقوقی · '+fmtDate(today()),scope:'holding-local-backups',createdAt:now(),updatedAt:now(),sourceScope:SCOPE,recordCount:data.recordCount,byteSize:new Blob([JSON.stringify(data)]).size,payload:data};
 await vault.put('holding-local-backups',item);
 const all=await vault.all('holding-local-backups');for(const old of all.slice(12))await vault.remove(old.id);
 await vault.setMeta('legal-center-last-snapshot',String(Date.now()));
}
async function renderBackupStats(){
 const vault=window.HoldingLocalDataVault;if(!vault)return;
 const records=await vault.all(SCOPE),snaps=await vault.all('holding-local-backups'),bytes=new Blob([JSON.stringify(records.map(x=>({...x,file:undefined})))]).size+records.reduce((s,x)=>s+(x.file?.size||0),0);
 const stats=$('#lw-vault-stats');if(stats)stats.innerHTML='<div class="lw-metric"><small>رکوردهای مخزن حقوقی</small><strong>'+fa(records.filter(x=>x.kind!=='attachment').length)+'</strong></div><div class="lw-metric"><small>پیوست‌ها</small><strong>'+fa(records.filter(x=>x.kind==='attachment').length)+'</strong></div><div class="lw-metric"><small>حجم تقریبی رکوردها</small><strong>'+fa(Math.ceil(bytes/1024))+' KB</strong></div><div class="lw-metric"><small>نقاط بازیابی</small><strong>'+fa(snaps.length)+'</strong></div>';
 const list=$('#lw-local-snapshots');if(list)list.innerHTML=snaps.length?'<div class="lw-list">'+snaps.map(x=>'<div class="lw-row"><div><strong>'+esc(x.title)+'</strong><small>'+fa(x.recordCount)+' رکورد · '+fa(Math.ceil((x.byteSize||0)/1024))+' کیلوبایت</small></div><button class="lw-btn light" data-action="restore-snapshot" data-id="'+esc(x.id)+'">بازیابی</button></div>').join('')+'</div>':'<div class="lw-empty">هنوز نقطه بازیابی ثبت نشده است.</div>';
}
async function exportBackup(){
 if(window.HoldingLocalDataVault){const pack=await window.HoldingLocalDataVault.createBackup(SCOPE);downloadJson(pack.data,'holding-legal-center-backup-'+today()+'.json');}
 else downloadJson({format:'holding-legal-center',schemaVersion:1,state:db},'holding-legal-center-backup-'+today()+'.json');
}
async function exportBackupToFolder(){
 if(!window.showDirectoryPicker)throw new Error('ذخیره مستقیم پوشه در این مرورگر پشتیبانی نمی‌شود؛ از دریافت فایل پشتیبان استفاده کنید.');
 const folder=await window.showDirectoryPicker({id:'holding-legal-backups',mode:'readwrite'});
 const pack=window.HoldingLocalDataVault?await window.HoldingLocalDataVault.createBackup(SCOPE):{data:{format:'holding-legal-center',schemaVersion:1,state:db}};
 const target=await folder.getDirectoryHandle('backups',{create:true});
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const name='holding-legal-center-'+stamp+'.json';
 const file=await target.getFileHandle(name,{create:true}),writer=await file.createWritable();
 await writer.write(JSON.stringify(pack.data,null,2));await writer.close();
 toast('نسخه پشتیبان در پوشه backups ذخیره شد: '+folder.name);
}
function downloadJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function importBackup(){
 const input=$('#lw-import-file'),file=input?.files?.[0];if(!file)throw new Error('ابتدا فایل پشتیبان را انتخاب کنید.');
 const payload=JSON.parse(await file.text());
 const mode=$('#lw-import-mode')?.value||'merge';if(!confirm(mode==='replace'?'تمام اطلاعات فعلی مرکز حقوقی با محتوای فایل جایگزین می‌شود. ادامه می‌دهید؟':'رکوردهای هم‌شناسه به‌روزرسانی و رکوردهای جدید افزوده می‌شوند؛ رکوردهای دیگر حذف نمی‌شوند. ادامه می‌دهید؟'))return;
 if(payload.format==='holding-local-vault'&&window.HoldingLocalDataVault){if(mode==='replace')await createLocalSnapshot();await window.HoldingLocalDataVault.importData(payload,mode==='replace'?'replace-scope':'merge');}
 else if(payload.format==='holding-legal-center'&&payload.state){db=mode==='replace'?{...blank(),...payload.state}:{...db,...payload.state};await save();}
 else throw new Error('ساختار فایل پشتیبان معتبر نیست.');
 await load();render();toast('بازیابی اطلاعات مرکز حقوقی انجام شد.');
}
function updateCenterNav(){}
app.addEventListener('click',async e=>{
 const t=e.target.closest('[data-tab],[data-action],[data-case-filter],[data-org-scope]');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;query='';editing=null;render();return;}
 if(t.dataset.caseFilter){caseFilter=t.dataset.caseFilter;render();return;}
 if(t.dataset.orgScope){orgScope=t.dataset.orgScope;orgPickerOpen=false;orgPickerQuery='';render();return;}
 const action=t.dataset.action;
 if(action==='toggle-org-picker'){orgPickerOpen=!orgPickerOpen;orgPickerQuery='';render();$('#lw-org-search')?.focus();return;}
 if(action==='close-detail'){detailRecord=null;render();return;}
 try{
 if(action==='new')openForm(t.dataset.key);
 if(action==='edit')openForm(t.dataset.key,t.dataset.id);
 if(action==='view'){detailRecord={key:t.dataset.key,id:t.dataset.id};const v=$('#lw-view');if(v)v.innerHTML=detailHtml(t.dataset.key,t.dataset.id);}
 if(action==='cancel-form'){editing=null;render();}
 if(action==='delete'){const key=t.dataset.key,id=t.dataset.id;if(!confirm('این رکورد حذف شود؟'))return;const item=rows(key).find(x=>x.id===id);if(item?.attachments&&window.HoldingLocalDataVault)for(const a of item.attachments)await window.HoldingLocalDataVault.remove(a.id);db[key]=rows(key).filter(x=>x.id!==id);db.events.unshift({id:makeId('EVT'),at:now(),key,recordId:id,action:'حذف',title:item?.title||item?.name||''});await save();render();toast('رکورد حذف شد.');}
 if(action==='download-file')await downloadFile(t.dataset.file);
 if(action==='export')await exportBackup();
 if(action==='export-folder')await exportBackupToFolder();
 if(action==='snapshot'){await createLocalSnapshot();render();toast('نقطه بازیابی محلی ثبت شد.');}
 if(action==='restore-snapshot'){const snap=await window.HoldingLocalDataVault.get(t.dataset.id);if(!snap?.payload)throw new Error('نقطه بازیابی پیدا نشد.');if(!confirm('اطلاعات فعلی مرکز حقوقی با این نقطه بازیابی جایگزین شود؟'))return;await window.HoldingLocalDataVault.importData(snap.payload,'replace-scope');await load();render();toast('بازیابی از نقطه محلی انجام شد.');}
 if(action==='import')await importBackup();
 }catch(err){console.error(err);toast(err.message||'عملیات انجام نشد.','warn');}
});
app.addEventListener('submit',async e=>{if(e.target.id!=='lw-record-form')return;e.preventDefault();if(!e.target.reportValidity())return;const btn=e.target.querySelector('[type=submit]');btn.disabled=true;try{await saveForm(e.target)}catch(err){console.error(err);toast(err.message||'ذخیره اطلاعات انجام نشد.','warn');btn.disabled=false;}});
app.addEventListener('input',e=>{if(e.target.id==='lw-search'){query=e.target.value;const old=$('#lw-view');if(old)old.innerHTML=tableHtml(tab)}});
app.addEventListener('input',e=>{if(e.target.id==='lw-org-search'){orgPickerQuery=e.target.value;const v=$('#lw-view');if(v){v.innerHTML=overview();$('#lw-org-search')?.focus();}}});
document.addEventListener('click',e=>{if(orgPickerOpen&&!e.target.closest('.lw-org-picker')){orgPickerOpen=false;const v=$('#lw-view');if(v)v.innerHTML=overview();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&orgPickerOpen){orgPickerOpen=false;render();}});
(async()=>{await load();await seedDemoCases();await seedExtendedDemoData();try{await syncCalendar()}catch(e){console.warn('Calendar sync skipped',e)}render();})();
})();