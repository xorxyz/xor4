import{f as d,k as _,l as a,n as w,u as D,m as g,h as x,q as H,s as q,v as c}from"./entry.BOW7OJZK.js";import S from"./ContentRenderer.D1xcJi4P.js";import b from"./ContentQuery.nSWH6n4N.js";import"./ContentRendererMarkdown.vue.DebHg-RM.js";import"./index.BsYmvPZw.js";import"./preview.CWnHYQzF.js";import"./query.Bs763X1X.js";const y=(p,s=a())=>{const e=d(p),f=g();_(()=>d(p),(n=e)=>{if(!s.path||!n)return;const t=Object.assign({},(n==null?void 0:n.head)||{});t.meta=[...t.meta||[]],t.link=[...t.link||[]];const r=t.title||(n==null?void 0:n.title);r&&(t.title=r),f.public.content.host;const u=(t==null?void 0:t.description)||(n==null?void 0:n.description);u&&t.meta.filter(l=>l.name==="description").length===0&&t.meta.push({name:"description",content:u}),t!=null&&t.image||(n==null||n.image),w(()=>D(t))},{immediate:!0})},k=x({name:"ContentDoc",props:{tag:{type:String,required:!1,default:"div"},excerpt:{type:Boolean,default:!1},path:{type:String,required:!1,default:void 0},query:{type:Object,required:!1,default:void 0},head:{type:Boolean,required:!1,default:void 0}},render(p){const{contentHead:s}=g().public.content,e=H(),{tag:f,excerpt:m,path:n,query:t,head:r}=p,u=r===void 0?s:r,l={...t||{},path:n||(t==null?void 0:t.path)||q(a().path),find:"one"},C=(o,i)=>c("pre",null,JSON.stringify({message:"You should use slots with <ContentDoc>",slot:o,data:i},null,2));return c(b,l,{default:e!=null&&e.default?({data:o,refresh:i,isPartial:v})=>{var h;return u&&y(o),(h=e.default)==null?void 0:h.call(e,{doc:o,refresh:i,isPartial:v,excerpt:m,...this.$attrs})}:({data:o})=>(u&&y(o),c(S,{value:o,excerpt:m,tag:f,...this.$attrs},{empty:i=>e!=null&&e.empty?e.empty(i):C("default",o)})),empty:o=>{var i;return((i=e==null?void 0:e.empty)==null?void 0:i.call(e,o))||c("p",null,"Document is empty, overwrite this content with #empty slot in <ContentDoc>.")},"not-found":o=>{var i;return((i=e==null?void 0:e["not-found"])==null?void 0:i.call(e,o))||c("p",null,"Document not found, overwrite this content with #not-found slot in <ContentDoc>.")}})}}),j=k,I=j;export{I as default};
