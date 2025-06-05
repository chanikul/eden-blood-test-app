(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9674],{65531:function(e,t,r){"use strict";r.d(t,{Z:function(){return p}});var a=r(20955);/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),i=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,t,r)=>r?r.toUpperCase():t.toLowerCase()),n=e=>{let t=i(e);return t.charAt(0).toUpperCase()+t.slice(1)},o=(...e)=>e.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim(),c=e=>{for(let t in e)if(t.startsWith("aria-")||"role"===t||"title"===t)return!0};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var l={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let d=(0,a.forwardRef)(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:s,className:i="",children:n,iconNode:d,...p},u)=>(0,a.createElement)("svg",{ref:u,...l,width:t,height:t,stroke:e,strokeWidth:s?24*Number(r)/Number(t):r,className:o("lucide",i),...!n&&!c(p)&&{"aria-hidden":"true"},...p},[...d.map(([e,t])=>(0,a.createElement)(e,t)),...Array.isArray(n)?n:[n]])),p=(e,t)=>{let r=(0,a.forwardRef)(({className:r,...i},c)=>(0,a.createElement)(d,{ref:c,iconNode:t,className:o(`lucide-${s(n(e))}`,`lucide-${e}`,r),...i}));return r.displayName=n(e),r}},97008:function(e,t,r){Promise.resolve().then(r.bind(r,2294))},2294:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return m}});var a=r(87022),s=r(99891),i=r(56952),n=r.n(i),o=r(20955),c=r(77415),l=r(5925),d=r(26705);function p(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,a)}return r}function u(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?p(Object(r),!0).forEach(function(t){(0,a.Z)(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):p(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function m(){var e,t,r,a=(0,o.useState)([]),i=a[0],p=a[1],m=(0,o.useState)(!0),x=m[0],f=m[1],h=(0,o.useState)(!1),g=h[0],y=h[1],b=(0,o.useState)(!1),v=(b[0],b[1]),w=(0,o.useState)(!1),j=(w[0],w[1]),N=(0,o.useState)(null),k=(N[0],N[1]),E=(0,o.useState)({email:"",name:"",role:"ADMIN",password:""}),A=E[0],O=E[1];(0,o.useEffect)(function(){C()},[]);var C=(e=(0,s.Z)(n().mark(function e(){var t;return n().wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,fetch("/api/admin/users");case 3:if((t=e.sent).ok){e.next=6;break}throw Error("Failed to fetch users");case 6:return e.next=8,t.json();case 8:p(e.sent),e.next=16;break;case 12:e.prev=12,e.t0=e.catch(0),l.Am.error("Failed to load users"),console.error("Error fetching users:",e.t0);case 16:return e.prev=16,f(!1),e.finish(16);case 19:case"end":return e.stop()}},e,null,[[0,12,16,19]])})),function(){return e.apply(this,arguments)}),$=(t=(0,s.Z)(n().mark(function e(t){return n().wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return t.preventDefault(),e.prev=1,e.next=4,fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(A)});case 4:if(e.sent.ok){e.next=7;break}throw Error("Failed to add user");case 7:l.Am.success("User added successfully"),y(!1),O({email:"",name:"",role:"ADMIN",password:""}),C(),e.next=17;break;case 13:e.prev=13,e.t0=e.catch(1),l.Am.error("Failed to add user"),console.error("Error adding user:",e.t0);case 17:case"end":return e.stop()}},e,null,[[1,13]])})),function(e){return t.apply(this,arguments)}),S=(r=(0,s.Z)(n().mark(function e(t,r){return n().wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,fetch("/api/admin/users/".concat(t),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:r})});case 3:if(e.sent.ok){e.next=6;break}throw Error("Failed to update user");case 6:l.Am.success("User ".concat(r?"activated":"deactivated"," successfully")),C(),e.next=14;break;case 10:e.prev=10,e.t0=e.catch(0),l.Am.error("Failed to update user"),console.error("Error updating user:",e.t0);case 14:case"end":return e.stop()}},e,null,[[0,10]])})),function(e,t){return r.apply(this,arguments)}),z=function(e){k(e),v(!0)},P=function(e){k(e),j(!0)};return(0,d.jsxs)("div",{className:"p-6",children:[(0,d.jsxs)("div",{className:"flex justify-between items-center mb-8",children:[(0,d.jsx)("h1",{className:"text-3xl font-semibold text-gray-800",children:"Users"}),(0,d.jsx)(c.zx,{onClick:function(){return y(!0)},variant:"primary",children:"Add User"})]}),x?(0,d.jsx)("div",{className:"bg-white shadow-sm rounded-lg p-8 text-center",children:(0,d.jsx)("p",{className:"text-gray-600 text-lg",children:"Loading users..."})}):i.length>0?(0,d.jsx)("div",{className:"bg-white shadow-sm rounded-lg overflow-hidden",children:(0,d.jsxs)("table",{className:"min-w-full divide-y divide-gray-200",children:[(0,d.jsx)("thead",{className:"bg-gray-50",children:(0,d.jsxs)("tr",{children:[(0,d.jsx)("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Name"}),(0,d.jsx)("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Email"}),(0,d.jsx)("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Role"}),(0,d.jsx)("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Status"}),(0,d.jsx)("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Last Login"}),(0,d.jsx)("th",{className:"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),(0,d.jsx)("tbody",{className:"bg-white divide-y divide-gray-200",children:i.map(function(e){return(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{className:"px-6 py-4 whitespace-nowrap",children:(0,d.jsx)("div",{className:"text-sm font-medium text-gray-900",children:e.name})}),(0,d.jsx)("td",{className:"px-6 py-4 whitespace-nowrap",children:(0,d.jsx)("div",{className:"text-sm text-gray-500",children:e.email})}),(0,d.jsx)("td",{className:"px-6 py-4 whitespace-nowrap",children:(0,d.jsx)("div",{className:"text-sm text-gray-500",children:e.role})}),(0,d.jsx)("td",{className:"px-6 py-4 whitespace-nowrap",children:(0,d.jsx)("span",{className:"px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(e.active?"bg-green-100 text-green-800":"bg-red-100 text-red-800"),children:e.active?"Active":"Inactive"})}),(0,d.jsx)("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:e.lastLogin?new Date(e.lastLogin).toLocaleString("en-GB",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Never"}),(0,d.jsxs)("td",{className:"px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2",children:[(0,d.jsx)(c.zx,{variant:"secondary",size:"sm",onClick:function(){return z(e)},children:"Edit"}),(0,d.jsx)(c.zx,{variant:"secondary",size:"sm",onClick:function(){return P(e)},children:"Reset Password"}),(0,d.jsx)(c.zx,{variant:e.active?"secondary":"primary",size:"sm",onClick:function(){return S(e.id,!e.active)},children:e.active?"Deactivate":"Activate"})]})]},e.id)})})]})}):(0,d.jsx)("div",{className:"bg-white shadow-sm rounded-lg p-8 text-center",children:(0,d.jsx)("p",{className:"text-gray-600 text-lg",children:"No users found."})}),g&&(0,d.jsx)(c.Vq,{open:g,onClose:function(){return y(!1)},children:(0,d.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50",children:(0,d.jsxs)("div",{className:"bg-white rounded-lg shadow-xl max-w-md w-full p-6",children:[(0,d.jsx)("h2",{className:"text-2xl font-semibold mb-4",children:"Add New User"}),(0,d.jsxs)("form",{onSubmit:$,className:"space-y-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Name"}),(0,d.jsx)(c.II,{type:"text",value:A.name,onChange:function(e){return O(u(u({},A),{},{name:e.target.value}))},required:!0,minLength:2})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),(0,d.jsx)(c.II,{type:"email",value:A.email,onChange:function(e){return O(u(u({},A),{},{email:e.target.value}))},required:!0})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Role"}),(0,d.jsxs)(c.Ph,{value:A.role,onChange:function(e){return O(u(u({},A),{},{role:e.target.value}))},required:!0,children:[(0,d.jsx)("option",{value:"ADMIN",children:"Admin"}),(0,d.jsx)("option",{value:"SUPER_ADMIN",children:"Super Admin"})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Password"}),(0,d.jsx)(c.II,{type:"password",value:A.password,onChange:function(e){return O(u(u({},A),{},{password:e.target.value}))},required:!0,minLength:8,placeholder:"••••••••"})]}),(0,d.jsxs)("div",{className:"flex justify-end space-x-3 mt-6",children:[(0,d.jsx)(c.zx,{type:"button",variant:"secondary",onClick:function(){return y(!1)},children:"Cancel"}),(0,d.jsx)(c.zx,{type:"submit",variant:"primary",children:"Add User"})]})]})]})})})]})}},5925:function(e,t,r){"use strict";let a,s;r.d(t,{Am:function(){return I}});var i,n=r(20955);let o={data:""},c=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||o,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,p=/\n+/g,u=(e,t)=>{let r="",a="",s="";for(let i in e){let n=e[i];"@"==i[0]?"i"==i[1]?r=i+" "+n+";":a+="f"==i[1]?u(n,i):i+"{"+u(n,"k"==i[1]?"":t)+"}":"object"==typeof n?a+=u(n,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=n&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=u.p?u.p(i,n):i+":"+n+";")}return r+(t&&s?t+"{"+s+"}":s)+a},m={},x=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+x(e[r]);return t}return e},f=(e,t,r,a,s)=>{var i;let n=x(e),o=m[n]||(m[n]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(n));if(!m[o]){let t=n!==e?e:(e=>{let t,r,a=[{}];for(;t=l.exec(e.replace(d,""));)t[4]?a.shift():t[3]?(r=t[3].replace(p," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(p," ").trim();return a[0]})(e);m[o]=u(s?{["@keyframes "+o]:t}:t,r?"":"."+o)}let c=r&&m.g?m.g:null;return r&&(m.g=m[o]),i=m[o],c?t.data=t.data.replace(c,i):-1===t.data.indexOf(i)&&(t.data=a?i+t.data:t.data+i),o},h=(e,t,r)=>e.reduce((e,a,s)=>{let i=t[s];if(i&&i.call){let e=i(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":u(e,""):!1===e?"":e}return e+a+(null==i?"":i)},"");function g(e){let t=this||{},r=e.call?e(t.p):e;return f(r.unshift?r.raw?h(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,c(t.target),t.g,t.o,t.k)}g.bind({g:1});let y,b,v,w=g.bind({k:1});function j(e,t){let r=this||{};return function(){let a=arguments;function s(i,n){let o=Object.assign({},i),c=o.className||s.className;r.p=Object.assign({theme:b&&b()},o),r.o=/ *go\d+/.test(c),o.className=g.apply(r,a)+(c?" "+c:""),t&&(o.ref=n);let l=e;return e[0]&&(l=o.as||e,delete o.as),v&&l[0]&&v(o),y(l,o)}return t?t(s):s}}var N=e=>"function"==typeof e,k=(e,t)=>N(e)?e(t):e,E=(a=0,()=>(++a).toString()),A=()=>{if(void 0===s&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");s=!e||e.matches}return s},O=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return O(e,{type:e.toasts.find(e=>e.id===r.id)?1:0,toast:r});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},C=[],$={toasts:[],pausedAt:void 0},S=e=>{$=O($,e),C.forEach(e=>{e($)})},z=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||E()}),P=e=>(t,r)=>{let a=z(t,e,r);return S({type:2,toast:a}),a.id},I=(e,t)=>P("blank")(e,t);I.error=P("error"),I.success=P("success"),I.loading=P("loading"),I.custom=P("custom"),I.dismiss=e=>{S({type:3,toastId:e})},I.remove=e=>S({type:4,toastId:e}),I.promise=(e,t,r)=>{let a=I.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?k(t.success,e):void 0;return s?I.success(s,{id:a,...r,...null==r?void 0:r.success}):I.dismiss(a),e}).catch(e=>{let s=t.error?k(t.error,e):void 0;s?I.error(s,{id:a,...r,...null==r?void 0:r.error}):I.dismiss(a)}),e};var D=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,L=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`} 1s linear infinite;
`,F=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,_=j("div")`
  position: absolute;
`,U=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Z=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,q=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return void 0!==t?"string"==typeof t?n.createElement(Z,null,t):t:"blank"===r?null:n.createElement(U,null,n.createElement(L,{...a}),"loading"!==r&&n.createElement(_,null,"error"===r?n.createElement(D,{...a}):n.createElement(F,{...a})))},M=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,R=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,T=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,W=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,B=(e,t)=>{let r=e.includes("top")?1:-1,[a,s]=A()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[M(r),R(r)];return{animation:t?`${w(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};n.memo(({toast:e,position:t,style:r,children:a})=>{let s=e.height?B(e.position||t||"top-center",e.visible):{opacity:0},i=n.createElement(q,{toast:e}),o=n.createElement(W,{...e.ariaProps},k(e.message,e));return n.createElement(T,{className:e.className,style:{...s,...r,...e.style}},"function"==typeof a?a({icon:i,message:o}):n.createElement(n.Fragment,null,i,o))}),i=n.createElement,u.p=void 0,y=i,b=void 0,v=void 0,g`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[8218,5350,2571,7973,8329,7415,4121,6531,1744],function(){return e(e.s=97008)}),_N_E=e.O()}]);