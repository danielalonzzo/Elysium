'use client';
import {useState} from 'react';
import {Heart, MousePointer2, PawPrint, ShieldCheck, Sparkles} from 'lucide-react';
import {PawBurst, playSound} from './fx';

const ANIMALS = [
  {id:'cat', es:'Gato', en:'Cat', esAction:'ronronea y salta', enAction:'purrs and pounces'},
  {id:'dog', es:'Perro', en:'Dog', esAction:'mueve las orejas', enAction:'wiggles its ears'},
  {id:'bird', es:'Ave', en:'Bird', esAction:'abre sus alas', enAction:'spreads its wings'},
  {id:'horse', es:'Caballo', en:'Horse', esAction:'sale al galope', enAction:'breaks into a gallop'},
] as const;

export default function HeroLogo({en=false}:{en?:boolean}) {
  const [active,setActive]=useState<string>(''),[burst,setBurst]=useState(0);
  const animal=ANIMALS.find(item=>item.id===active);
  function wake(id:string){setActive(id);setBurst(n=>n+1);playSound(id==='cat'?'toque-al-vacio':'click-en-boton');}
  return <div className={'hero-logo-scene '+(active?'is-awake':'')}>
    <div className="hero-aurora" aria-hidden="true"><i/><i/><i/></div>
    <div className="hero-orbit orbit-one" aria-hidden="true"/><div className="hero-orbit orbit-two" aria-hidden="true"/>
    {burst>0&&<PawBurst key={burst}/>} 
    <div className="logo-stage">
      <span className="stage-glow" aria-hidden="true"/>
      <div className="logo-grid" role="group" aria-label={en?'Interactive clinic logo':'Logo interactivo de la clínica'}>
        {ANIMALS.map((item,i)=><button type="button" key={item.id} className={'logo-animal '+item.id+(active===item.id?' active':'')} aria-pressed={active===item.id} aria-label={(en?'Animate ':'Animar ')+(en?item.en:item.es)} onClick={()=>wake(item.id)} style={{'--i':i} as React.CSSProperties}>
          <span className="animal-crop"><img src="/images/logo.jpg" alt="" draggable="false"/></span>
          <span className="animal-name">{en?item.en:item.es}</span>
          <Sparkles className="animal-spark"/>
        </button>)}
      </div>
      <div className="logo-core" aria-hidden="true"><Heart/></div>
    </div>
    <div className="logo-prompt"><MousePointer2/><span>{en?'Touch an animal':'Toque un animal'}</span></div>
    <div className={'logo-reaction '+(animal?'show':'')} aria-live="polite">
      <PawPrint/><div><small>{en?'YOU WOKE UP THE':'DESPERTASTE AL'}</small><strong>{animal?(en?animal.en:animal.es):'—'}</strong><span>{animal?(en?animal.enAction:animal.esAction):''}</span></div><ShieldCheck/>
    </div>
    <span className="scene-caption">DR. LUIS VALLADARES · HEREDIA, CR</span>
  </div>;
}
