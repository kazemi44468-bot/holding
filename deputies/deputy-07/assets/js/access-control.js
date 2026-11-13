/* Deputy 7 access-policy evaluator.
   This is a client-side policy helper for gradual module integration, not a security boundary. */
(()=>{"use strict";
const KEY="deputy7.identity-access.v1";
const technicalOnly=new Set(["manageUsers","manageSchema","manageBackup"]);
const read=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));return s&&s.version===1?s:null;}catch{return null;}};
function evaluate(userId,permission,resource={}){
 const s=read();if(!s)return {allowed:false,reason:"policy-store-unavailable"};
 const user=(s.users||[]).find(x=>x.id===userId);if(!user||user.status!=="active")return {allowed:false,reason:"inactive-or-missing-user"};
 const role=(s.roles||[]).find(x=>x.id===user.roleId);if(!role)return {allowed:false,reason:"role-not-found"};
 const departmentId=resource.departmentId==null?null:String(resource.departmentId);
 const operational=permission==="view"||permission==="create"||permission==="edit"||permission==="delete"||permission==="approve"||permission==="assign"||permission==="export"||permission==="viewSensitive";
 let grants=new Set(role.grants||[]),scope=role.scope||"assigned-departments";
 for(const groupId of (user.groupIds||[])){
  const group=(s.groups||[]).find(x=>x.id===groupId);if(!group)continue;
  if(departmentId!==null&&Array.isArray(group.departments)&&group.departments.length&&!group.departments.includes(departmentId))continue;
  const groupRole=(s.roles||[]).find(x=>x.id===group.roleId);if(groupRole)(groupRole.grants||[]).forEach(p=>grants.add(p));
 }
 if(!grants.has(permission))return {allowed:false,reason:"permission-not-granted"};
 if(scope==="technical-only"){
  if(!technicalOnly.has(permission)||resource.kind!=="configuration")return {allowed:false,reason:"technical-scope-only"};
  return {allowed:true,reason:"technical-administration"};
 }
 if(scope==="all")return {allowed:true,reason:"organization-wide"};
 const assigned=(user.departments||[]).map(String);
 if(!departmentId)return {allowed:false,reason:"department-scope-required"};
 if(!assigned.includes(departmentId))return {allowed:false,reason:"outside-assigned-departments"};
 if(operational&&resource.ownerUserId&&resource.ownerUserId!==user.id&&resource.scope==="own-records")return {allowed:false,reason:"not-record-owner"};
 return {allowed:true,reason:"assigned-department"};
}
window.Deputy7Access=Object.freeze({
 can:(userId,permission,resource={})=>evaluate(userId,permission,resource).allowed,
 explain:evaluate,
 user:userId=>(read()?.users||[]).find(x=>x.id===userId)||null,
 users:()=>read()?.users||[],
 roles:()=>read()?.roles||[],
 departments:()=>[{id:"1",name:"اداره اداری و پشتیبانی"},{id:"2",name:"اداره تحقیق و توسعه"},{id:"3",name:"اداره پارکبان و معبربانان"},{id:"4",name:"اداره تأسیسات فنی و امور نگهداری"},{id:"6",name:"اداره فاوا و خدمات فنی"},{id:"7",name:"اداره جمع‌آوری، نگهداری و بازیافت پسماند"},{id:"8",name:"اداره بازرسی و تحقیقات محلی"}],
 isReady:()=>!!read()
});
})();