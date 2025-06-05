(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2105],{1323:function(e,t,r){Promise.resolve().then(r.bind(r,26427))},26427:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return p}});var o=r(99891),a=r(56952),s=r.n(a),n=r(20955),i=r(24033),c=r(13077),l=r(21822),d=r(5925),u=r(26705);function p(){var e,t=(0,i.useRouter)(),r=(0,i.useSearchParams)(),a=null==r?void 0:r.get("token"),p=(0,n.useState)(""),f=p[0],m=p[1],b=(0,n.useState)(""),y=b[0],g=b[1],h=(0,n.useState)(!1),x=h[0],v=h[1];if(!a)return(0,u.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,u.jsxs)("div",{className:"bg-white p-8 rounded-lg shadow-md max-w-md w-full",children:[(0,u.jsx)("h1",{className:"text-2xl font-semibold text-red-600 mb-4",children:"Invalid Reset Link"}),(0,u.jsx)("p",{className:"text-gray-600 mb-6",children:"This password reset link is invalid or has expired. Please request a new password reset."}),(0,u.jsx)(c.z,{variant:"primary",onClick:function(){return t.push("/admin/login")},className:"w-full",children:"Return to Login"})]})});var w=(e=(0,o.Z)(s().mark(function e(r){return s().wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(r.preventDefault(),!(f!==y)){e.next=4;break}return d.Am.error("Passwords do not match"),e.abrupt("return");case 4:return v(!0),e.prev=5,e.next=8,fetch("/api/admin/users/reset-password/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:a,password:f})});case 8:if(e.sent.ok){e.next=11;break}throw Error("Failed to reset password");case 11:d.Am.success("Password reset successfully"),t.push("/admin/login"),e.next=19;break;case 15:e.prev=15,e.t0=e.catch(5),console.error("Error resetting password:",e.t0),d.Am.error("Failed to reset password");case 19:return e.prev=19,v(!1),e.finish(19);case 22:case"end":return e.stop()}},e,null,[[5,15,19,22]])})),function(t){return e.apply(this,arguments)});return(0,u.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,u.jsxs)("div",{className:"bg-white p-8 rounded-lg shadow-md max-w-md w-full",children:[(0,u.jsx)("h1",{className:"text-2xl font-semibold text-gray-900 mb-6",children:"Reset Password"}),(0,u.jsxs)("form",{onSubmit:w,className:"space-y-4",children:[(0,u.jsxs)("div",{children:[(0,u.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"New Password"}),(0,u.jsx)(l.I,{type:"password",value:f,onChange:function(e){return m(e.target.value)},required:!0,minLength:8,placeholder:"••••••••"})]}),(0,u.jsxs)("div",{children:[(0,u.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Confirm Password"}),(0,u.jsx)(l.I,{type:"password",value:y,onChange:function(e){return g(e.target.value)},required:!0,minLength:8,placeholder:"••••••••"})]}),(0,u.jsx)(c.z,{type:"submit",variant:"primary",className:"w-full",loading:x,children:"Reset Password"})]})]})})}},13077:function(e,t,r){"use strict";r.d(t,{z:function(){return d}});var o=r(87022),a=r(92184),s=r(74769),n=r(26705),i=["children","variant","size","fullWidth","loading","className"];function c(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,o)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?c(Object(r),!0).forEach(function(t){(0,o.Z)(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):c(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function d(e){var t=e.children,r=e.variant,o=e.size,c=e.fullWidth,d=e.loading,u=void 0!==d&&d,p=e.className,f=(0,a.Z)(e,i);return(0,n.jsx)("button",l(l({className:(0,s.m6)("inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",{primary:"bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",secondary:"bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",danger:"bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"}[void 0===r?"primary":r],{sm:"px-3 py-1.5 text-sm",md:"px-4 py-2 text-base",lg:"px-6 py-3 text-lg"}[void 0===o?"md":o],void 0!==c&&c?"w-full":"",p),disabled:u||f.disabled},f),{},{children:u?(0,n.jsxs)("span",{className:"flex items-center",children:[(0,n.jsxs)("svg",{className:"animate-spin -ml-1 mr-2 h-4 w-4 text-white",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[(0,n.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,n.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),t]}):t}))}},21822:function(e,t,r){"use strict";r.d(t,{I:function(){return l}});var o=r(87022),a=r(92184),s=r(20955),n=r(26705),i=["className","error"];function c(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,o)}return r}var l=(0,s.forwardRef)(function(e,t){var r=e.className,s=void 0===r?"":r,l=e.error,d=(0,a.Z)(e,i);return(0,n.jsx)("input",function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?c(Object(r),!0).forEach(function(t){(0,o.Z)(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):c(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}({ref:t,className:"block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ".concat(l?"border-red-500":""," ").concat(s)},d))});l.displayName="Input"},69991:function(e,t,r){"use strict";/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var o=r(20955),a=Symbol.for("react.element"),s=Symbol.for("react.fragment"),n=Object.prototype.hasOwnProperty,i=o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,c={key:!0,ref:!0,__self:!0,__source:!0};function l(e,t,r){var o,s={},l=null,d=null;for(o in void 0!==r&&(l=""+r),void 0!==t.key&&(l=""+t.key),void 0!==t.ref&&(d=t.ref),t)n.call(t,o)&&!c.hasOwnProperty(o)&&(s[o]=t[o]);if(e&&e.defaultProps)for(o in t=e.defaultProps)void 0===s[o]&&(s[o]=t[o]);return{$$typeof:a,type:e,key:l,ref:d,props:s,_owner:i.current}}t.Fragment=s,t.jsx=l,t.jsxs=l},26705:function(e,t,r){"use strict";e.exports=r(69991)},24033:function(e,t,r){e.exports=r(65367)},99891:function(e,t,r){"use strict";function o(e,t,r,o,a,s,n){try{var i=e[s](n),c=i.value}catch(e){r(e);return}i.done?t(c):Promise.resolve(c).then(o,a)}function a(e){return function(){var t=this,r=arguments;return new Promise(function(a,s){var n=e.apply(t,r);function i(e){o(n,a,s,i,c,"next",e)}function c(e){o(n,a,s,i,c,"throw",e)}i(void 0)})}}r.d(t,{Z:function(){return a}})},92184:function(e,t,r){"use strict";function o(e,t){if(null==e)return{};var r,o,a=function(e,t){if(null==e)return{};var r,o,a={},s=Object.keys(e);for(o=0;o<s.length;o++)r=s[o],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(o=0;o<s.length;o++)r=s[o],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}r.d(t,{Z:function(){return o}})},5925:function(e,t,r){"use strict";let o,a;r.d(t,{Am:function(){return D}});var s,n=r(20955);let i={data:""},c=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||i,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,p=(e,t)=>{let r="",o="",a="";for(let s in e){let n=e[s];"@"==s[0]?"i"==s[1]?r=s+" "+n+";":o+="f"==s[1]?p(n,s):s+"{"+p(n,"k"==s[1]?"":t)+"}":"object"==typeof n?o+=p(n,t?t.replace(/([^,])+/g,e=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s):null!=n&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=p.p?p.p(s,n):s+":"+n+";")}return r+(t&&a?t+"{"+a+"}":a)+o},f={},m=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+m(e[r]);return t}return e},b=(e,t,r,o,a)=>{var s;let n=m(e),i=f[n]||(f[n]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(n));if(!f[i]){let t=n!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(d,""));)t[4]?o.shift():t[3]?(r=t[3].replace(u," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(u," ").trim();return o[0]})(e);f[i]=p(a?{["@keyframes "+i]:t}:t,r?"":"."+i)}let c=r&&f.g?f.g:null;return r&&(f.g=f[i]),s=f[i],c?t.data=t.data.replace(c,s):-1===t.data.indexOf(s)&&(t.data=o?s+t.data:t.data+s),i},y=(e,t,r)=>e.reduce((e,o,a)=>{let s=t[a];if(s&&s.call){let e=s(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;s=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+o+(null==s?"":s)},"");function g(e){let t=this||{},r=e.call?e(t.p):e;return b(r.unshift?r.raw?y(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,c(t.target),t.g,t.o,t.k)}g.bind({g:1});let h,x,v,w=g.bind({k:1});function j(e,t){let r=this||{};return function(){let o=arguments;function a(s,n){let i=Object.assign({},s),c=i.className||a.className;r.p=Object.assign({theme:x&&x()},i),r.o=/ *go\d+/.test(c),i.className=g.apply(r,o)+(c?" "+c:""),t&&(i.ref=n);let l=e;return e[0]&&(l=i.as||e,delete i.as),v&&l[0]&&v(i),h(l,i)}return t?t(a):a}}var O=e=>"function"==typeof e,k=(e,t)=>O(e)?e(t):e,N=(o=0,()=>(++o).toString()),P=()=>{if(void 0===a&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");a=!e||e.matches}return a},E=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return E(e,{type:e.toasts.find(e=>e.id===r.id)?1:0,toast:r});case 3:let{toastId:o}=t;return{...e,toasts:e.toasts.map(e=>e.id===o||void 0===o?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+a}))}}},_=[],S={toasts:[],pausedAt:void 0},$=e=>{S=E(S,e),_.forEach(e=>{e(S)})},C=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||N()}),z=e=>(t,r)=>{let o=C(t,e,r);return $({type:2,toast:o}),o.id},D=(e,t)=>z("blank")(e,t);D.error=z("error"),D.success=z("success"),D.loading=z("loading"),D.custom=z("custom"),D.dismiss=e=>{$({type:3,toastId:e})},D.remove=e=>$({type:4,toastId:e}),D.promise=(e,t,r)=>{let o=D.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let a=t.success?k(t.success,e):void 0;return a?D.success(a,{id:o,...r,...null==r?void 0:r.success}):D.dismiss(o),e}).catch(e=>{let a=t.error?k(t.error,e):void 0;a?D.error(a,{id:o,...r,...null==r?void 0:r.error}):D.dismiss(o)}),e};var I=j("div")`
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
`,A=j("div")`
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
`,R=j("div")`
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
`,F=j("div")`
  position: absolute;
`,L=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,T=j("div")`
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
`,Z=({toast:e})=>{let{icon:t,type:r,iconTheme:o}=e;return void 0!==t?"string"==typeof t?n.createElement(T,null,t):t:"blank"===r?null:n.createElement(L,null,n.createElement(A,{...o}),"loading"!==r&&n.createElement(F,null,"error"===r?n.createElement(I,{...o}):n.createElement(R,{...o})))},q=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,W=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,M=j("div")`
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
`,B=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,H=(e,t)=>{let r=e.includes("top")?1:-1,[o,a]=P()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[q(r),W(r)];return{animation:t?`${w(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};n.memo(({toast:e,position:t,style:r,children:o})=>{let a=e.height?H(e.position||t||"top-center",e.visible):{opacity:0},s=n.createElement(Z,{toast:e}),i=n.createElement(B,{...e.ariaProps},k(e.message,e));return n.createElement(M,{className:e.className,style:{...a,...r,...e.style}},"function"==typeof o?o({icon:s,message:i}):n.createElement(n.Fragment,null,s,i))}),s=n.createElement,p.p=void 0,h=s,x=void 0,v=void 0,g`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[2571,4121,6531,1744],function(){return e(e.s=1323)}),_N_E=e.O()}]);