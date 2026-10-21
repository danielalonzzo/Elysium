var e=`ely-pref-cursor`,t=`ely-vet-magic-mouse-styles`,n=`vet-touch-splash`,r=`url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%3E%3Cg%20transform%3D'rotate(-10%2012%2012)'%3E%3Cellipse%20cx%3D'5.2'%20cy%3D'8.5'%20rx%3D'1.9'%20ry%3D'2.6'%20transform%3D'rotate(-20%205.2%208.5)'%2F%3E%3Cellipse%20cx%3D'9.6'%20cy%3D'5.6'%20rx%3D'1.85'%20ry%3D'2.8'%20transform%3D'rotate(-7%209.6%205.6)'%2F%3E%3Cellipse%20cx%3D'14.4'%20cy%3D'5.6'%20rx%3D'1.85'%20ry%3D'2.8'%20transform%3D'rotate(7%2014.4%205.6)'%2F%3E%3Cellipse%20cx%3D'18.8'%20cy%3D'8.5'%20rx%3D'1.9'%20ry%3D'2.6'%20transform%3D'rotate(20%2018.8%208.5)'%2F%3E%3Cpath%20fill-rule%3D'evenodd'%20d%3D'M12%2010.5%20C8%2010.5%205%2013.8%205%2017.5%20C5%2021%208.5%2023%2012%2023.2%20C15.5%2023%2019%2021%2019%2017.5%20C19%2013.8%2016%2010.5%2012%2010.5%20Z%20M10.8%2014.2%20H13.2%20V16.2%20H15.2%20V18.6%20H13.2%20V20.6%20H10.8%20V18.6%20H8.8%20V16.2%20H10.8%20Z'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,i=`
  -webkit-mask-image: ${r}; mask-image: ${r};
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center;  mask-position: center;
  -webkit-mask-size: contain;     mask-size: contain;
`,a=`
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
.${n} {
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
  ${i}
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
  ${i}
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
.${n} {
  position: fixed;
  z-index: 2147483647;
  width: 44px;
  height: 44px;
  margin-left: -22px;
  margin-top: -22px;
  pointer-events: none !important;
  will-change: transform, opacity;
  background: linear-gradient(135deg, #8be0b2 0%, #149447 100%);
  ${i}
  animation: vet-touch-stamp .55s cubic-bezier(.22, 1, .36, 1) forwards;
}
:root[data-theme="dark"] .${n} {
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
  .${n} { display: none !important; }
}
`;function o(){if(typeof document>`u`||document.getElementById(`ely-vet-magic-mouse-styles`))return;let e=document.createElement(`style`);e.id=t,e.textContent=a,document.head.appendChild(e)}function s(){if(typeof localStorage>`u`)return!0;try{return localStorage.getItem(e)!==`0`}catch{return!0}}function c(t){if(!(typeof localStorage>`u`))try{localStorage.setItem(e,t?`1`:`0`)}catch{}}function l(){return window.matchMedia(`(pointer: fine)`).matches}function u(){return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}var d=.32,f=.2,p=.016,m=.75,h=1200,g=!1,_=null,v=null,y=!1,b=!1,x=!0,S=0,C=0,w=0,T=0,E=0,D=0,O=null,k=null,A=null,j=null,M=null;function N(e,t){return`translate3d(${e}px, ${t}px, 0) translate(-50%, -50%)`}function P(){if(!(!O||typeof O.showPopover!=`function`))try{O.matches(`:popover-open`)&&O.hidePopover(),O.showPopover()}catch{}}function F(){typeof MutationObserver>`u`||typeof document>`u`||(M&&M.disconnect(),M=new MutationObserver(e=>{let t=!1;for(let n of e)if(n.type===`attributes`&&n.attributeName===`open`&&n.target.tagName===`DIALOG`||n.type===`childList`&&document.querySelector(`dialog[open]`)){t=!0;break}t&&P()}),M.observe(document.body,{attributes:!0,attributeFilter:[`open`],childList:!0,subtree:!0}))}function I(){if(O)return;O=document.createElement(`div`),O.className=`ely-cursor`,O.setAttribute(`aria-hidden`,`true`),A=document.createElement(`div`),A.className=`ely-cursor-comet`,j=document.createElement(`div`),j.className=`ely-cursor-comet-core`,A.appendChild(j),k=document.createElement(`div`),k.className=`ely-cursor-paw`,O.appendChild(A),O.appendChild(k),typeof O.showPopover==`function`&&O.setAttribute(`popover`,`manual`),document.body.appendChild(O),P(),F();let e=N(S,C);k.style.transform=e,A.style.transform=e}function L(){v&&clearTimeout(v),v=setTimeout(()=>{y=!0,O&&O.classList.add(`is-idle`)},h)}function R(e){S=e.clientX,C=e.clientY,O&&O.style.opacity===`0`&&(O.style.opacity=`1`);let t=N(S,C);k&&(k.style.transform=t),y&&(y=!1,O&&O.classList.remove(`is-idle`)),L()}function z(e){if(!g||u())return;let t=e.clientX,n=e.clientY;requestAnimationFrame(()=>{if(!O)return;let e=document.createElement(`div`);e.className=`ely-ripple`,e.style.transform=N(t,n),O.appendChild(e);let r=()=>{e.parentNode&&e.parentNode.removeChild(e)};e.addEventListener(`animationend`,r,{once:!0}),setTimeout(r,600)})}var B=[`a`,`button`,`input`,`select`,`textarea`,`[role="button"]`,`.service-card`,`.myth-card`,`.bento-card`,`.pet-card`,`.logo-animal`,`.photo-card`,`.magic-dock button`,`.chip-row button`,`.diag-options button`,`.diag-scale button`,`.age-toggle button`,`.age-sizes button`,`[tabindex="0"]`].join(`,`);function V(e){let t=e.target;if(!t)return;let n=!!t.closest(B);n!==b&&(b=n,O&&O.classList.toggle(`is-hovering`,b))}function H(){O&&(O.style.opacity=`0`)}function U(){O&&(O.style.opacity=`1`),document.querySelector(`dialog[open]`)&&P()}function W(e){let t=e.target;t&&t.tagName===`IMG`&&e.preventDefault()}function G(){if(!g)return;let e=w,t=T;w+=(S-w)*d,T+=(C-T)*d;let n=w-e,r=T-t,i=Math.sqrt(n*n+r*r);E+=(i-E)*f,i>.3&&(D=Math.atan2(r,n));let a=E*p;a>m&&(a=m),A&&j&&(A.style.transform=N(w,T),j.style.transform=`rotate(${D}rad) scale(${1+a}, ${1-a*.45})`),_=requestAnimationFrame(G)}function K(e,t){requestAnimationFrame(()=>{let r=document.createElement(`div`);r.className=n,r.setAttribute(`aria-hidden`,`true`),r.style.left=`${e}px`,r.style.top=`${t}px`;let i=document.querySelector(`dialog[open]`);i?i.appendChild(r):document.body.appendChild(r);let a=()=>{r.parentNode&&r.parentNode.removeChild(r)};r.addEventListener(`animationend`,a,{once:!0}),setTimeout(a,850)})}function q(e){!x||e.pointerType!==`touch`||u()||document.documentElement.classList.contains(`ely-cursor-active`)||K(e.clientX,e.clientY)}function J(){u()||(x=!0,l()&&!g&&document.body&&(o(),I(),document.documentElement.classList.add(`ely-cursor-active`),document.addEventListener(`mousemove`,R,{passive:!0}),document.addEventListener(`mousedown`,z,{passive:!0}),document.addEventListener(`mouseover`,V,{passive:!0}),document.addEventListener(`mouseleave`,H,{passive:!0}),document.addEventListener(`mouseenter`,U,{passive:!0}),document.addEventListener(`dragstart`,W,{passive:!1}),g=!0,L(),_=requestAnimationFrame(G)))}function Y(){if(x=!1,M&&=(M.disconnect(),null),g){if(_&&=(cancelAnimationFrame(_),null),v&&=(clearTimeout(v),null),document.removeEventListener(`mousemove`,R),document.removeEventListener(`mousedown`,z),document.removeEventListener(`mouseover`,V),document.removeEventListener(`mouseleave`,H),document.removeEventListener(`mouseenter`,U),document.removeEventListener(`dragstart`,W),document.documentElement.classList.remove(`ely-cursor-active`),O){if(typeof O.hidePopover==`function`)try{O.matches(`:popover-open`)&&O.hidePopover()}catch{}O.parentNode&&O.parentNode.removeChild(O)}O=k=A=j=null,y=!1,b=!1,E=0,g=!1}}function X(e){c(e),e?J():Y()}function Z(){return s()}function Q(){window.__vetPointerBound||(document.addEventListener(`pointerdown`,q,{passive:!0}),window.__vetPointerBound=!0);let e=window.matchMedia(`(pointer: fine)`),t=window.matchMedia(`(prefers-reduced-motion: reduce)`),n=()=>{s()&&!u()?J():Y()};e.addEventListener?.(`change`,n),t.addEventListener?.(`change`,n),window.ElysiumMouse={enable:()=>X(!0),disable:()=>X(!1),isEnabled:()=>s()&&g,promote:P,version:`1.0.0-valladares`},window.initMagicMouse=Q,s()?document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,J,{once:!0}):J():Y()}export{Z as n,X as r,Q as t};