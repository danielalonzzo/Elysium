'use client';
import {useEffect,useRef,useState} from 'react';
/**
 * El Maine Coon del botón de atención directa. El motor 3D (three.js) se pide
 * después del primer gesto de quien visita, no en el arranque. En el móvil el
 * botón es un círculo pequeño y el gato vive encima, sin darle la vuelta.
 */
export default function Mascot({en=false}:{en?:boolean}){const container=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null),engine=useRef<any>(null);const [armed,setArmed]=useState(false),[ready,setReady]=useState(false);
useEffect(()=>{const arm=()=>setArmed(true);const events=['pointermove','pointerdown','scroll','keydown'];events.forEach(e=>window.addEventListener(e,arm,{once:true,passive:true}));return()=>events.forEach(e=>window.removeEventListener(e,arm));},[]);
useEffect(()=>{if(!armed)return;let cancelled=false;import('./mascotEngine.js').then(({createMascot})=>{if(cancelled||!container.current)return;const dock=container.current.parentElement?.querySelector('.concierge-toggle') as HTMLElement;engine.current=createMascot({container:container.current,dock,button:button.current,calm:matchMedia('(prefers-reduced-motion: reduce)').matches,laps:!matchMedia('(max-width: 640px)').matches,onReady:()=>setReady(true)});engine.current.setActive(true);engine.current.ready.catch(()=>setReady(false));}).catch(()=>{});return()=>{cancelled=true;engine.current?.dispose();};},[armed]);
return <div ref={container} className={'mascot-stage '+(ready?'is-ready':'')}><button ref={button} className="mascot-hit" data-cursor={en?'Pet':'Mimos'} aria-label={en?'Pet the cat':'Acariciar al gato'} tabIndex={ready?0:-1} onClick={()=>engine.current?.trick()}/></div>;}
