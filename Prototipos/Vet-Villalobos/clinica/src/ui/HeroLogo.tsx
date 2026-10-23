'use client';
import {useEffect,useRef,useState} from 'react';
import {playBark, playSound} from './fx';
import {url} from '../core/config';

type Engine={play:(id:string)=>void;finale:()=>void;focus:(id:string)=>void;destroy:()=>void};
// Cada gesto lleva un dato cierto: el emblema enseña algo mientras se juega con él.
const ANIMALS=[
 {id:'cat',es:'Gato',en:'Cat',esTitle:'Mirada nocturna',enTitle:'Night vision',esText:'Le basta una sexta parte de la luz que necesitamos nosotros para ver.',enText:'It needs only a sixth of the light we do to see.'},
 {id:'dog',es:'Perro',en:'Dog',esTitle:'Ladrido',enTitle:'Bark',esText:'El ladrido es su forma de comunicarse: avisa, saluda y expresa cómo se siente.',enText:'A bark is their way of communicating: alerting, greeting and expressing how they feel.'},
] as const;

export default function HeroLogo({en=false}:{en?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<Engine|null>(null),found=useRef(new Set<string>()),celebrated=useRef(false),timers=useRef<number[]>([]),onPick=useRef<(id:string)=>void>(()=>{});
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[hover,setHover]=useState(''),[woken,setWoken]=useState<string[]>([]),[card,setCard]=useState<{kicker:string;title:string;text:string}|null>(null);
 const later=(ms:number,fn:()=>void)=>{timers.current.push(window.setTimeout(fn,ms))};

 useEffect(()=>{
  let alive=true;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  (async()=>{
   try{
    const {mountHeroLogo}=await import('./heroLogoEngine.js');
    if(!alive||!canvas.current)return;
    const e=await mountHeroLogo(canvas.current,{onSelect:(id:string)=>onPick.current(id),onHover:setHover,reducedMotion});
    if(!alive){e.destroy();return}
    engine.current=e;setReady(true);
   }catch(err){console.error('mountHeroLogo error:',err);if(alive)setFailed(true)}
  })();
  return()=>{alive=false;timers.current.forEach(clearTimeout);engine.current?.destroy();engine.current=null};
 },[]);

 function wake(id:string){
  const a=ANIMALS.find(x=>x.id===id);if(!a)return;
  engine.current?.play(id);
  if(id==='dog')playBark();else playSound('click-en-boton');
  found.current.add(id);setWoken([...found.current]);
  setCard({kicker:en?a.en:a.es,title:en?a.enTitle:a.esTitle,text:en?a.enText:a.esText});
  timers.current.forEach(clearTimeout);timers.current=[];
  if(found.current.size===ANIMALS.length&&!celebrated.current){
   celebrated.current=true;
   later(2600,()=>{engine.current?.finale();playSound('enviado-con-exito');setCard({kicker:en?'Both':'Los dos',title:en?'One circle':'Un mismo círculo',text:en?'A cat and a dog, each in its own window: one standard of care at all four clinics.':'Un gato y un perro, cada uno en su ventana: un mismo cuidado en las cuatro sedes.'})});
   later(9800,()=>setCard(null));
  }else later(6200,()=>setCard(null));
 }

 useEffect(()=>{onPick.current=wake});
 const hovered=ANIMALS.find(a=>a.id===hover);
 const kicker=hovered?`${en?hovered.en:hovered.es} · ${en?hovered.enTitle:hovered.esTitle}`:woken.length===ANIMALS.length?(en?'Tap either animal again':'Vuelva a tocar cualquiera de los dos'):(en?'Touch the cat and the dog':'Toque al gato y al perro');
 return <div className={'hero-logo-scene emblem-vitrine'+(ready?' is-ready':'')} data-cursor={hovered?(en?'Touch':'Tocar'):undefined}>
  <canvas ref={canvas} className="emblem-canvas" aria-hidden="true"/>
  {!ready&&!failed&&<div className="emblem-loading" aria-hidden="true"><i/></div>}
  {/* eslint-disable-next-line @next/next/no-img-element -- respaldo sin WebGL: el logotipo plano tal cual */}
  {failed&&<img className="emblem-fallback" src={url('/images/logo.jpg')} alt={en?'Villalobos emblem':'Emblema de Villalobos'}/>}
  <div className="emblem-head" aria-hidden="true"><span className="emblem-kicker" key={kicker}>{kicker}</span><span className="emblem-pips">{ANIMALS.map(a=><i key={a.id} className={woken.includes(a.id)?'on':''}/>)}</span></div>
  <div className="emblem-keys" role="group" aria-label={en?'Living emblem: wake each animal':'Emblema vivo: despierte a cada animal'}>{ANIMALS.map(a=><button type="button" key={a.id} onClick={()=>wake(a.id)} onFocus={()=>engine.current?.focus(a.id)} onBlur={()=>engine.current?.focus('')}>{(en?'Wake the ':'Despertar al ')+(en?a.en.toLowerCase():a.es.toLowerCase())}</button>)}</div>
  <div className={'emblem-card'+(card?' show':'')} aria-live="polite">{card&&<><small>{card.kicker}</small><strong>{card.title}</strong><span>{card.text}</span></>}</div>
  <span className="emblem-sign" aria-hidden="true">{en?'Sculpted in Blender':'Esculpido en Blender'} · Heredia, CR</span>
 </div>;
}
