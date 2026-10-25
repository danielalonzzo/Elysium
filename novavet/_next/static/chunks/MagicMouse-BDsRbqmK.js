import{r as e}from"./rolldown-runtime-CTIpnwa1.js";import{i as t}from"./framework-DsV52AgF.js";var n=e(t(),1),r=`ely-pref-cursor`,i=`ely-vet-magic-mouse-styles`,a=`vet-touch-splash`,o=`url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cg%20transform%3D'rotate(-10%2012%2012)'%3E%3Cellipse%20cx%3D'5.2'%20cy%3D'8.5'%20rx%3D'1.9'%20ry%3D'2.6'%20transform%3D'rotate(-20%205.2%208.5)'%2F%3E%3Cellipse%20cx%3D'9.6'%20cy%3D'5.6'%20rx%3D'1.85'%20ry%3D'2.8'%20transform%3D'rotate(-7%209.6%205.6)'%2F%3E%3Cellipse%20cx%3D'14.4'%20cy%3D'5.6'%20rx%3D'1.85'%20ry%3D'2.8'%20transform%3D'rotate(7%2014.4%205.6)'%2F%3E%3Cellipse%20cx%3D'18.8'%20cy%3D'8.5'%20rx%3D'1.9'%20ry%3D'2.6'%20transform%3D'rotate(20%2018.8%208.5)'%2F%3E%3Cpath%20fill-rule%3D'evenodd'%20d%3D'M12%2010.5%20C8%2010.5%205%2013.8%205%2017.5%20C5%2021%208.5%2023%2012%2023.2%20C15.5%2023%2019%2021%2019%2017.5%20C19%2013.8%2016%2010.5%2012%2010.5%20Z%20M10.8%2014.2%20H13.2%20V16.2%20H15.2%20V18.6%20H13.2%20V20.6%20H10.8%20V18.6%20H8.8%20V16.2%20H10.8%20Z'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,s=`
  -webkit-mask-image: ${o}; mask-image: ${o};
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center;  mask-position: center;
  -webkit-mask-size: contain;     mask-size: contain;
`,c=`
/* ── Ocultar cursor nativo sólo cuando la patita de marca esté activa ── */
html.ely-cursor-active,
html.ely-cursor-active body,
html.ely-cursor-active a,
html.ely-cursor-active button,
html.ely-cursor-active input,
html.ely-cursor-active select,
html.ely-cursor-active textarea,
html.ely-cursor-active dialog,
html.ely-cursor-active dialog *,
html.ely-cursor-active [role="button"],
html.ely-cursor-active *:hover {
  cursor: none !important;
}

/* El contenedor del cursor jamás intercepta eventos del ratón */
.ely-cursor,
.ely-cursor *,
.ely-cursor-paw,
.ely-cursor-comet,
.${a} {
  pointer-events: none !important;
}

/* Contenedor fijo en viewport + compatibilidad con Top Layer (popover) */
.ely-cursor:popover-open,
.ely-cursor {
  position: fixed;
  inset: unset;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  overflow: visible;
  z-index: 2147483647;
  opacity: 1;
  transition: opacity .25s ease;
  will-change: opacity;
}

.ely-cursor::backdrop {
  display: none !important;
  background: transparent !important;
}

/* Capas posicionales del motor */
.ely-cursor-paw,
.ely-cursor-comet {
  position: fixed;
  top: 0;
  left: 0;
  will-change: transform;
}

/* ── 1. La Patita de Marca (sigue inmediatamente al puntero) ── */
.ely-cursor-paw {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #4ade80 0%, #149447 55%, #0b592b 100%);
  filter: drop-shadow(0 2px 6px rgba(20, 148, 71, 0.45));
  z-index: 3;
  ${s}
  transition: width .25s cubic-bezier(.2, 1, .3, 1),
              height .25s cubic-bezier(.2, 1, .3, 1),
              background .25s ease,
              filter .25s ease,
              opacity .3s ease;
}

/* Modo oscuro: patita bioluminiscente esmeralda y reflejo champán */
:root[data-theme="dark"] .ely-cursor-paw {
  background: linear-gradient(135deg, #8be0b2 0%, #22c55e 60%, #15803d 100%);
  filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* ── 2. Aura-cometa cinemática (inercia etérea detrás de la patita) ── */
.ely-cursor-comet {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  z-index: 2;
  transition: width .28s cubic-bezier(.2, 1, .3, 1),
              height .28s cubic-bezier(.2, 1, .3, 1),
              opacity .35s ease,
              border-color .28s ease,
              background .28s ease;
}

.ely-cursor-comet-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  will-change: transform;
  transform-origin: center center;
  background: radial-gradient(circle at 50% 50%, rgba(20, 148, 71, 0.28) 0%, rgba(23, 63, 145, 0.14) 45%, rgba(139, 224, 178, 0.08) 65%, transparent 75%);
  transition: background .3s ease;
}

:root[data-theme="dark"] .ely-cursor-comet-core {
  background: radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.35) 0%, rgba(139, 224, 178, 0.16) 48%, transparent 75%);
}

/* ── 3. Estado de interacción (Hover sobre botones, enlaces y tarjetas) ── */
.ely-cursor.is-hovering .ely-cursor-paw {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #8be0b2 0%, #22c55e 60%, #149447 100%);
  filter: drop-shadow(0 0 14px rgba(139, 224, 178, 0.65)) drop-shadow(0 2px 8px rgba(20, 148, 71, 0.5));
}

.ely-cursor.is-hovering .ely-cursor-comet {
  width: 56px;
  height: 56px;
  opacity: .95;
  border: 1.5px solid rgba(139, 224, 178, 0.5);
  backdrop-filter: blur(2px);
  background: radial-gradient(circle, rgba(20, 148, 71, 0.22) 0%, rgba(139, 224, 178, 0.14) 50%, transparent 72%);
}

/* ── 4. Estado de reposo (Idle: el cometa se repliega y la patita late) ── */
.ely-cursor.is-idle .ely-cursor-comet {
  opacity: 0;
}

.ely-cursor.is-idle .ely-cursor-paw {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 0 16px rgba(139, 224, 178, 0.6)) drop-shadow(0 2px 10px rgba(20, 148, 71, 0.6));
  animation: vet-paw-heartbeat 2.8s ease-in-out infinite;
}

/* Latido vital auténtico de reposo (ritmo biológico lub-dub con fulgor) */
@keyframes vet-paw-heartbeat {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 2px 7px rgba(20, 148, 71, 0.45));
  }
  14% {
    transform: translate(-50%, -50%) scale(1.18);
    filter: drop-shadow(0 0 18px rgba(139, 224, 178, 0.65));
  }
  26% {
    transform: translate(-50%, -50%) scale(1.03);
  }
  38% {
    transform: translate(-50%, -50%) scale(1.12);
    filter: drop-shadow(0 0 12px rgba(20, 148, 71, 0.6));
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* ── 5. Onda de choque al hacer clic ("La Pisada") ── */
.ely-ripple {
  position: fixed;
  top: 0;
  left: 0;
  width: 38px;
  height: 38px;
  pointer-events: none !important;
  z-index: 2147483647;
  background: linear-gradient(135deg, #8be0b2 0%, #149447 100%);
  filter: drop-shadow(0 0 12px rgba(139, 224, 178, 0.6));
  ${s}
  animation: vet-paw-stamp .55s cubic-bezier(.16, 1, .3, 1) forwards;
}

@keyframes vet-paw-stamp {
  0% {
    transform: translate(-50%, -50%) scale(0.4) rotate(-16deg);
    opacity: 0.95;
    filter: drop-shadow(0 0 14px rgba(139, 224, 178, 0.65));
  }
  100% {
    transform: translate(-50%, -50%) scale(2.2) rotate(6deg);
    opacity: 0;
    filter: drop-shadow(0 0 24px rgba(20, 148, 71, 0));
  }
}

/* ── 6. Retroalimentación táctil al tocar pantalla (Mobile Splash) ── */
.${a} {
  position: fixed;
  z-index: 2147483647;
  width: 44px;
  height: 44px;
  margin-left: -22px;
  margin-top: -22px;
  pointer-events: none !important;
  will-change: transform, opacity;
  background: linear-gradient(135deg, #8be0b2 0%, #149447 100%);
  ${s}
  animation: vet-touch-stamp .55s cubic-bezier(.22, 1, .36, 1) forwards;
}
:root[data-theme="dark"] .${a} {
  background: linear-gradient(135deg, #8be0b2 0%, #22c55e 100%);
}

@keyframes vet-touch-stamp {
  0% {
    transform: scale(.38) rotate(-14deg);
    opacity: .95;
    filter: drop-shadow(0 0 12px rgba(139, 224, 178, 0.6));
  }
  100% {
    transform: scale(1.8) rotate(4deg);
    opacity: 0;
    filter: drop-shadow(0 0 24px rgba(20, 148, 71, 0));
  }
}

/* ── Accesibilidad: sin movimiento, apagado absoluto ── */
@media (prefers-reduced-motion: reduce) {
  html .ely-cursor { display: none !important; }
  .${a} { display: none !important; }
}
`;function l(){if(typeof document>`u`||document.getElementById(`ely-vet-magic-mouse-styles`))return;let e=document.createElement(`style`);e.id=i,e.textContent=c,document.head.appendChild(e)}function u(){if(typeof localStorage>`u`)return!0;try{return localStorage.getItem(r)!==`0`}catch{return!0}}function d(e){if(!(typeof localStorage>`u`))try{localStorage.setItem(r,e?`1`:`0`)}catch{}}function f(){return window.matchMedia(`(pointer: fine)`).matches}function p(){return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}var m=.32,h=.2,g=.016,_=.75,v=1200,y=!1,b=null,x=null,S=!1,C=!1,w=!0,T=0,E=0,D=0,O=0,k=0,A=0,j=null,M=null,N=null,P=null,F=null;function I(e,t){return`translate3d(${e}px, ${t}px, 0) translate(-50%, -50%)`}function L(){if(!(!j||typeof j.showPopover!=`function`))try{j.matches(`:popover-open`)&&j.hidePopover(),j.showPopover()}catch{}}function R(){typeof MutationObserver>`u`||typeof document>`u`||(F&&F.disconnect(),F=new MutationObserver(e=>{let t=!1;for(let n of e)if(n.type===`attributes`&&n.attributeName===`open`&&n.target.tagName===`DIALOG`||n.type===`childList`&&document.querySelector(`dialog[open]`)){t=!0;break}t&&L()}),F.observe(document.body,{attributes:!0,attributeFilter:[`open`],childList:!0,subtree:!0}))}function z(){if(j)return;j=document.createElement(`div`),j.className=`ely-cursor`,j.setAttribute(`aria-hidden`,`true`),N=document.createElement(`div`),N.className=`ely-cursor-comet`,P=document.createElement(`div`),P.className=`ely-cursor-comet-core`,N.appendChild(P),M=document.createElement(`div`),M.className=`ely-cursor-paw`,j.appendChild(N),j.appendChild(M),typeof j.showPopover==`function`&&j.setAttribute(`popover`,`manual`),document.body.appendChild(j),L(),R();let e=I(T,E);M.style.transform=e,N.style.transform=e}function B(){x&&clearTimeout(x),x=setTimeout(()=>{S=!0,j&&j.classList.add(`is-idle`)},v)}function V(e){T=e.clientX,E=e.clientY,j&&j.style.opacity===`0`&&(j.style.opacity=`1`);let t=I(T,E);M&&(M.style.transform=t),S&&(S=!1,j&&j.classList.remove(`is-idle`)),B()}function H(e){if(!y||p())return;let t=e.clientX,n=e.clientY;requestAnimationFrame(()=>{if(!j)return;let e=document.createElement(`div`);e.className=`ely-ripple`,e.style.transform=I(t,n),j.appendChild(e);let r=()=>{e.parentNode&&e.parentNode.removeChild(e)};e.addEventListener(`animationend`,r,{once:!0}),setTimeout(r,600)})}var ee=[`a`,`button`,`input`,`select`,`textarea`,`[role="button"]`,`.service-card`,`.myth-card`,`.bento-card`,`.pet-card`,`.logo-animal`,`.photo-card`,`.magic-dock button`,`.chip-row button`,`.diag-options button`,`.diag-scale button`,`.age-toggle button`,`.age-sizes button`,`[tabindex="0"]`].join(`,`);function U(e){let t=e.target;if(!t)return;let n=!!t.closest(ee);n!==C&&(C=n,j&&j.classList.toggle(`is-hovering`,C))}function W(){j&&(j.style.opacity=`0`)}function G(){j&&(j.style.opacity=`1`),document.querySelector(`dialog[open]`)&&L()}function K(e){let t=e.target;t&&t.tagName===`IMG`&&e.preventDefault()}function q(){if(!y)return;let e=D,t=O;D+=(T-D)*m,O+=(E-O)*m;let n=D-e,r=O-t,i=Math.sqrt(n*n+r*r);k+=(i-k)*h,i>.3&&(A=Math.atan2(r,n));let a=k*g;a>_&&(a=_),N&&P&&(N.style.transform=I(D,O),P.style.transform=`rotate(${A}rad) scale(${1+a}, ${1-a*.45})`),b=requestAnimationFrame(q)}function J(e,t){requestAnimationFrame(()=>{let n=document.createElement(`div`);n.className=a,n.setAttribute(`aria-hidden`,`true`),n.style.left=`${e}px`,n.style.top=`${t}px`;let r=document.querySelector(`dialog[open]`);r?r.appendChild(n):document.body.appendChild(n);let i=()=>{n.parentNode&&n.parentNode.removeChild(n)};n.addEventListener(`animationend`,i,{once:!0}),setTimeout(i,850)})}function Y(e){!w||e.pointerType!==`touch`||p()||document.documentElement.classList.contains(`ely-cursor-active`)||J(e.clientX,e.clientY)}function X(){p()||(w=!0,f()&&!y&&document.body&&(l(),z(),document.documentElement.classList.add(`ely-cursor-active`),document.addEventListener(`mousemove`,V,{passive:!0}),document.addEventListener(`mousedown`,H,{passive:!0}),document.addEventListener(`mouseover`,U,{passive:!0}),document.addEventListener(`mouseleave`,W,{passive:!0}),document.addEventListener(`mouseenter`,G,{passive:!0}),document.addEventListener(`dragstart`,K,{passive:!1}),y=!0,B(),b=requestAnimationFrame(q)))}function Z(){if(w=!1,F&&=(F.disconnect(),null),y){if(b&&=(cancelAnimationFrame(b),null),x&&=(clearTimeout(x),null),document.removeEventListener(`mousemove`,V),document.removeEventListener(`mousedown`,H),document.removeEventListener(`mouseover`,U),document.removeEventListener(`mouseleave`,W),document.removeEventListener(`mouseenter`,G),document.removeEventListener(`dragstart`,K),document.documentElement.classList.remove(`ely-cursor-active`),j){if(typeof j.hidePopover==`function`)try{j.matches(`:popover-open`)&&j.hidePopover()}catch{}j.parentNode&&j.parentNode.removeChild(j)}j=M=N=P=null,S=!1,C=!1,k=0,y=!1}}function Q(e){d(e),e?X():Z()}function $(){window.__vetPointerBound||(document.addEventListener(`pointerdown`,Y,{passive:!0}),window.__vetPointerBound=!0);let e=window.matchMedia(`(pointer: fine)`),t=window.matchMedia(`(prefers-reduced-motion: reduce)`),n=()=>{u()&&!p()?X():Z()};e.addEventListener?.(`change`,n),t.addEventListener?.(`change`,n),window.ElysiumMouse={enable:()=>Q(!0),disable:()=>Q(!1),isEnabled:()=>u()&&y,promote:L,version:`1.0.0-valladares`},window.initMagicMouse=$,u()?document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,X,{once:!0}):X():Z()}function te(){return(0,n.useEffect)(()=>{$()},[]),null}export{te as default};