import {useId} from 'react';
import type {Art} from '../content/shop';

/**
 * Ilustraciones de producto de la tienda, dibujadas en SVG: no hay fotografías
 * del inventario real, y una foto de catálogo ajena sería de otra marca.
 *
 * Todas comparten lienzo (200 × 200, el suelo en y = 186), sombra y brillo, y se
 * colorean con `color` (envase) y `accent` (etiqueta, tapa o detalle). Los ids
 * de los degradados van por instancia: hay varias en la misma página.
 */
const mix = (hex: string, to: string, a: number) => {
  const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = rgb(hex), [R, G, B] = rgb(to);
  return '#' + [r + (R - r) * a, g + (G - g) * a, b + (B - b) * a].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
};
const dark = (h: string, a: number) => mix(h, '#000000', a), light = (h: string, a: number) => mix(h, '#ffffff', a);

function Paw({x, y, s = 1, fill, opacity = 1}: {x: number, y: number, s?: number, fill: string, opacity?: number}) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} opacity={opacity}><ellipse cx="0" cy="3" rx="4.2" ry="3.4"/><ellipse cx="-5.2" cy="-2.4" rx="1.8" ry="2.4"/><ellipse cx="-1.8" cy="-5.6" rx="1.7" ry="2.3"/><ellipse cx="1.8" cy="-5.6" rx="1.7" ry="2.3"/><ellipse cx="5.2" cy="-2.4" rx="1.8" ry="2.4"/></g>;
}

export default function ProductArt({art, color, accent, label = '', className = ''}: {art: Art, color: string, accent: string, label?: string, className?: string}) {
  const id = 'pa' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const G = `url(#${id}g)`, V = `url(#${id}v)`;
  return <svg className={'product-art ' + className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={id + 's'}><stop offset="0" stopColor="#0b1f17" stopOpacity=".32"/><stop offset="1" stopColor="#0b1f17" stopOpacity="0"/></radialGradient>
      <linearGradient id={id + 'g'} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".36"/><stop offset=".2" stopColor="#fff" stopOpacity=".08"/><stop offset=".55" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".2"/></linearGradient>
      <linearGradient id={id + 'v'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".4"/><stop offset=".3" stopColor="#fff" stopOpacity=".05"/><stop offset="1" stopColor="#000" stopOpacity=".18"/></linearGradient>
      <radialGradient id={id + 'o'} cx=".36" cy=".3" r=".8"><stop offset="0" stopColor="#fff" stopOpacity=".42"/><stop offset=".45" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".32"/></radialGradient>
      <radialGradient id={id + 'r'} cx=".36" cy=".3" r=".78"><stop offset="0" stopColor={light(color, .38)}/><stop offset=".55" stopColor={color}/><stop offset="1" stopColor={dark(color, .4)}/></radialGradient>
    </defs>
    <ellipse className="art-shadow" cx="100" cy="186" rx="64" ry="8" fill={`url(#${id}s)`}/>
    <g className="art-body">{draw(art, color, accent, label, id, G, V)}</g>
  </svg>;
}

function draw(art: Art, color: string, accent: string, label: string, id: string, G: string, V: string) {
  const small = label.length > 6;
  switch (art) {
    case 'pouch': {
      const body = 'M62 54 L138 54 C141 92 147 140 151 174 Q152 184 142 184 L58 184 Q48 184 49 174 C53 140 59 92 62 54 Z';
      let seal = 'M60 36'; for (let i = 0; i < 20; i++) seal += ' l2 -4 l2 4'; seal += ' V56 H60 Z';
      return <>
        <clipPath id={id + 'c'}><path d={body}/></clipPath>
        <path d={body} fill={color}/>
        <path d={seal} fill={dark(color, .14)}/>
        <rect x="60" y="50" width="80" height="1.6" fill="#000" opacity=".14"/>
        <ellipse cx="100" cy="43" rx="8" ry="2.6" fill={dark(color, .5)}/>
        <g clipPath={`url(#${id}c)`}><rect x="40" y="160" width="120" height="5" fill="#dfb775"/><path d="M40 172 Q100 163 160 172" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="1.2"/></g>
        <rect x="71" y="78" width="58" height="72" rx="9" fill={accent}/>
        <Paw x={100} y={99} s={1.3} fill={color}/>
        <text x="100" y="125" textAnchor="middle" fontSize={small ? 7 : 8.4} fontWeight="800" letterSpacing="1.4" fill={color}>{label}</text>
        <path d="M88 133 H112" stroke={color} strokeOpacity=".35"/>
        <g fill={color} opacity=".45"><circle cx="94" cy="141" r="1.3"/><circle cx="100" cy="141" r="1.3"/><circle cx="106" cy="141" r="1.3"/></g>
        <path d={body} fill={G}/>
      </>;
    }
    case 'can': {
      const can = (cx: number, top: number, w: number, h: number, text: boolean) => {
        const l = cx - w / 2, rx = w / 2, ry = w * .17, shell = `M${l} ${top} V${top + h} A${rx} ${ry} 0 0 0 ${l + w} ${top + h} V${top} Z`;
        return <g>
          <path d={shell} fill={color}/>
          <path d={`M${l} ${top + h * .2} A${rx} ${ry} 0 0 0 ${l + w} ${top + h * .2} V${top + h * .8} A${rx} ${ry} 0 0 1 ${l} ${top + h * .8} Z`} fill={accent}/>
          <Paw x={cx} y={top + h * .46} s={text ? 1.3 : 1.1} fill={color}/>
          {text && <text x={cx} y={top + h * .68} textAnchor="middle" fontSize="8.6" fontWeight="800" letterSpacing="1.6" fill={color}>{label}</text>}
          <path d={shell} fill={G}/>
          <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="#dde0dc"/>
          <ellipse cx={cx} cy={top} rx={rx - 4} ry={ry - 1.6} fill="none" stroke="#a9aea9" strokeWidth="1.4"/>
          <ellipse cx={cx} cy={top + .8} rx={rx - 10} ry={ry - 4.4} fill="#c7ccc7"/>
          <rect x={cx - 9} y={top - 4.5} width="18" height="7" rx="3.5" fill="#b4bab4"/>
        </g>;
      };
      return <>{can(74, 88, 62, 74, false)}{can(116, 90, 76, 80, true)}</>;
    }
    case 'jar': {
      const jar = <rect x="62" y="70" width="76" height="114" rx="20"/>;
      const treats = Array.from({length: 26}, (_, i) => {
        const row = Math.floor(i / 6), x = 70 + (i % 6) * 12 + (row % 2) * 6, y = 174 - row * 10;
        return <ellipse key={i} cx={x} cy={y} rx="6.4" ry="4.6" transform={`rotate(${(i * 37) % 60 - 30} ${x} ${y})`} fill={i % 3 ? accent : dark(accent, .16)}/>;
      });
      return <>
        <clipPath id={id + 'c'}>{jar}</clipPath>
        <rect x="62" y="70" width="76" height="114" rx="20" fill="#fff" fillOpacity=".55"/>
        <g clipPath={`url(#${id}c)`}>{treats}</g>
        <rect x="68" y="96" width="64" height="40" rx="7" fill={color}/>
        <Paw x={100} y={108} s={.95} fill="#f7f1e3"/>
        <text x="100" y="127" textAnchor="middle" fontSize={small ? 6.6 : 8} fontWeight="800" letterSpacing="1.4" fill="#f7f1e3">{label}</text>
        <rect x="70" y="80" width="7" height="92" rx="3.5" fill="#fff" opacity=".6"/>
        <rect x="62" y="70" width="76" height="114" rx="20" fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="2"/>
        <rect x="68" y="64" width="64" height="8" rx="2" fill={dark(color, .2)}/>
        <rect x="65" y="46" width="70" height="22" rx="6" fill={color}/>
        <g stroke="#000" strokeOpacity=".14">{Array.from({length: 13}, (_, i) => <path key={i} d={`M${70 + i * 5} 50 V64`}/>)}</g>
        <rect x="65" y="46" width="70" height="22" rx="6" fill={G}/>
      </>;
    }
    case 'bottle': case 'pump': {
      const body = 'M72 76 Q72 64 84 62 H116 Q128 64 128 76 L132 168 Q132 184 116 184 H84 Q68 184 68 168 Z';
      return <>
        <path d={body} fill={color}/>
        <rect x="79" y="94" width="42" height="62" rx="6" fill={accent}/>
        <Paw x={100} y={112} s={1.1} fill={color}/>
        <text x="100" y="134" textAnchor="middle" fontSize={small ? 5.6 : 7} fontWeight="800" letterSpacing="1.2" fill={color}>{label}</text>
        <path d="M90 142 H110" stroke={color} strokeOpacity=".4"/>
        <path d={body} fill={G}/>
        <rect x="88" y="50" width="24" height="14" fill={dark(color, .1)}/>
        {art === 'bottle' ? <>
          <path d="M82 54 V38 Q82 30 90 30 H110 Q118 30 118 38 V54 Z" fill={accent}/>
          <rect x="82" y="45" width="36" height="1.6" fill="#000" opacity=".25"/>
          <path d="M82 54 V38 Q82 30 90 30 H110 Q118 30 118 38 V54 Z" fill={G}/>
        </> : <>
          <rect x="84" y="46" width="32" height="12" rx="2" fill={accent}/>
          <rect x="96" y="30" width="8" height="18" fill="#e6e0d4"/>
          <rect x="82" y="20" width="36" height="12" rx="4" fill={accent}/>
          <rect x="114" y="22" width="26" height="6" rx="3" fill={accent}/>
          <rect x="82" y="20" width="36" height="12" rx="4" fill={V}/>
        </>}
      </>;
    }
    case 'spray':
      return <>
        <path d="M78 80 Q78 66 92 64 H108 Q122 66 122 80 V172 Q122 184 110 184 H90 Q78 184 78 172 Z" fill={color}/>
        <rect x="84" y="98" width="32" height="64" rx="4" fill="#fbf8f2"/>
        <path d="M100 152 V112" stroke={accent} strokeWidth="1.2"/>
        <g fill={dark(color, .25)}>{[0, 1, 2, 3, 4, 5].map(i => <ellipse key={i} cx={100 + (i % 2 ? 3 : -3)} cy={114 + i * 5.5} rx="2.6" ry="1.6" transform={`rotate(${i % 2 ? 30 : -30} ${100 + (i % 2 ? 3 : -3)} ${114 + i * 5.5})`}/>)}</g>
        <path d="M100 152 Q92 150 90 144 M100 146 Q108 144 110 138" stroke={accent} strokeWidth="1" fill="none"/>
        <path d="M78 80 Q78 66 92 64 H108 Q122 66 122 80 V172 Q122 184 110 184 H90 Q78 184 78 172 Z" fill={G}/>
        <rect x="90" y="50" width="20" height="16" rx="2" fill="#cfd3cf"/>
        <rect x="90" y="50" width="20" height="16" rx="2" fill={G}/>
        <rect x="87" y="30" width="26" height="22" rx="6" fill={accent}/>
        <circle cx="112" cy="39" r="2" fill={dark(accent, .5)}/>
        <rect x="87" y="30" width="26" height="22" rx="6" fill={G}/>
      </>;
    case 'wipes': {
      const body = 'M38 112 Q38 98 54 97 Q100 92 146 97 Q162 98 162 112 V160 Q162 174 146 175 Q100 180 54 175 Q38 174 38 160 Z';
      return <>
        <path d={body} fill={color}/>
        <path d="M46 104 V168 M154 104 V168" stroke="#000" strokeOpacity=".1" strokeDasharray="2 2" strokeWidth="5"/>
        <rect x="70" y="106" width="60" height="32" rx="16" fill={accent}/>
        <ellipse cx="100" cy="122" rx="19" ry="6" fill={dark(accent, .4)}/>
        <path d="M88 122 Q92 98 104 100 Q114 104 112 122 Z" fill="#fff" stroke="#dfe7e2" strokeWidth="1"/>
        <path d="M62 160 Q66 146 76 144 Q74 156 62 160 Z M64 162 Q78 154 88 160 Q76 166 64 162 Z" fill={accent} opacity=".8"/>
        <text x="112" y="161" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2" fill={accent}>{label}</text>
        <path d={body} fill={V}/>
      </>;
    }
    case 'rope': {
      // Las rayas del patrón no siguen la curva: cruzadas en diagonal, se leen como hebras trenzadas.
      const rope = 'M44 132 C70 76 128 170 156 108', braid = `url(#${id}p)`, shine = `url(#${id}o)`;
      const tassel = (x: number, y: number, from: number) => <g strokeWidth="2.8" strokeLinecap="round" fill="none">{Array.from({length: 9}, (_, i) => {
        const a = (from + i * 11) * Math.PI / 180, len = 44 + (i % 3) * 5, ex = x + len * Math.cos(a), ey = y + len * Math.sin(a), bend = i % 2 ? 5 : -5;
        return <path key={i} d={`M${x} ${y} Q${(x + ex) / 2 - bend * Math.sin(a)} ${(y + ey) / 2 + bend * Math.cos(a)} ${ex} ${ey}`} stroke={i % 2 ? accent : light(color, .12)}/>;
      })}</g>;
      const knot = (x: number, y: number) => <g><circle cx={x} cy={y} r="20" fill={braid}/><circle cx={x} cy={y} r="20" fill={shine}/><circle cx={x} cy={y} r="19.5" fill="none" stroke={dark(color, .3)} strokeOpacity=".5"/></g>;
      return <>
        <pattern id={id + 'p'} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(42)"><rect width="9" height="9" fill={color}/><rect width="4.5" height="9" fill={accent}/></pattern>
        {tassel(44, 132, 108)}{tassel(156, 108, -68)}
        <path d={rope} stroke={dark(color, .35)} strokeWidth="22" strokeLinecap="round" fill="none" transform="translate(0 3)" opacity=".5"/>
        <path d={rope} stroke={braid} strokeWidth="21" strokeLinecap="round" fill="none"/>
        <path d={rope} stroke="#fff" strokeOpacity=".3" strokeWidth="4" strokeLinecap="round" fill="none" transform="translate(-1 -6)"/>
        {knot(44, 132)}{knot(156, 108)}
      </>;
    }
    case 'ball':
      return <>
        <circle cx="100" cy="122" r="62" fill={`url(#${id}r)`}/>
        <path d="M58 76 C84 100 84 146 58 170 M142 76 C116 100 116 146 142 170" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round"/>
        <ellipse cx="100" cy="124" rx="11" ry="8" fill={dark(color, .62)}/>
        <path d="M89 123 A11 8 0 0 1 111 123" stroke={light(color, .3)} strokeWidth="1.2" fill="none"/>
        <ellipse cx="80" cy="88" rx="15" ry="8" transform="rotate(-32 80 88)" fill="#fff" opacity=".32"/>
      </>;
    case 'wand': {
      const feather = (r: number, fill: string) => <g transform={`translate(140 100) rotate(${r}) scale(1.3)`}><path d="M0 0 C-10 14 -9 40 0 60 C9 40 10 14 0 0 Z" fill={fill}/><path d="M0 2 V58" stroke="#fff" strokeOpacity=".7" strokeWidth="1"/><path d="M0 18 L-6 26 M0 30 L-7 38 M0 42 L-5 50 M0 18 L6 26 M0 30 L7 38 M0 42 L5 50" stroke="#fff" strokeOpacity=".35" strokeWidth=".8"/></g>;
      return <>
        <path d="M56 182 L118 52" stroke="#c9a46a" strokeWidth="6" strokeLinecap="round"/>
        <g fill={dark('#c9a46a', .3)}><circle cx="77" cy="138" r="3.4"/><circle cx="97" cy="96" r="3.4"/></g>
        <path d="M56 182 L67 159" stroke={color} strokeWidth="9" strokeLinecap="round"/>
        <path d="M118 52 Q146 54 140 98" stroke="#8c8c8c" strokeWidth="1.4" fill="none"/>
        {feather(34, light(color, .35))}{feather(-30, accent)}{feather(2, color)}
        <circle cx="140" cy="100" r="4.6" fill={accent}/>
      </>;
    }
    case 'plush':
      return <>
        <ellipse cx="72" cy="176" rx="17" ry="9" fill={dark(color, .12)}/>
        <ellipse cx="128" cy="176" rx="17" ry="9" fill={dark(color, .12)}/>
        <ellipse cx="100" cy="140" rx="50" ry="42" fill={color}/>
        <ellipse cx="100" cy="140" rx="50" ry="42" fill={G}/>
        <circle cx="100" cy="88" r="40" fill={color}/>
        <path d="M84 54 q4 -6 8 0 M98 50 q4 -6 8 0 M110 56 q4 -6 8 0" stroke={light(color, .25)} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <ellipse cx="100" cy="94" rx="31" ry="24" fill={accent}/>
        <ellipse cx="86" cy="92" rx="11.5" ry="6.5" transform="rotate(22 86 92)" fill={dark(color, .45)}/>
        <ellipse cx="114" cy="92" rx="11.5" ry="6.5" transform="rotate(-22 114 92)" fill={dark(color, .45)}/>
        <circle cx="87" cy="92" r="2.8" fill="#1b1410"/><circle cx="113" cy="92" r="2.8" fill="#1b1410"/>
        <circle cx="88" cy="91" r=".9" fill="#fff"/><circle cx="114" cy="91" r=".9" fill="#fff"/>
        <ellipse cx="100" cy="103" rx="4.6" ry="3.2" fill="#3a2a20"/>
        <path d="M93 109 Q100 114 107 109" stroke="#3a2a20" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <circle cx="100" cy="88" r="40" fill={G} opacity=".7"/>
        <path d="M54 126 Q66 158 104 150" stroke={dark(color, .14)} strokeWidth="16" strokeLinecap="round" fill="none"/>
        <path d="M146 126 Q134 158 96 150" stroke={dark(color, .08)} strokeWidth="16" strokeLinecap="round" fill="none"/>
        <path d="M100 144 l6 3 M98 150 l7 1 M100 156 l6 -2" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
        <rect x="140" y="148" width="12" height="16" rx="2" fill="#dfb775" transform="rotate(14 146 156)"/>
      </>;
    case 'mouse': {
      const body = 'M48 162 C44 124 92 104 136 128 Q156 140 162 156 Q164 166 150 168 L60 170 Q48 170 48 162 Z';
      return <>
        <path d="M50 164 C28 162 20 142 32 132 C42 124 54 134 46 144" stroke={dark(color, .3)} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
        <circle cx="110" cy="112" r="11" fill={dark(color, .14)}/>
        <path d={body} fill={color}/>
        <path d="M62 152 C70 130 104 120 132 132" stroke={light(color, .5)} strokeWidth="1.4" strokeDasharray="3 3" fill="none"/>
        <path d={body} fill={G}/>
        <circle cx="126" cy="116" r="13" fill={color}/>
        <circle cx="126" cy="116" r="7.5" fill={accent}/>
        <circle cx="146" cy="144" r="2.6" fill="#2a211c"/>
        <circle cx="162" cy="158" r="3.6" fill={accent}/>
        <path d="M158 154 L180 148 M158 157 L182 156 M157 160 L178 164" stroke="#6b5f57" strokeWidth=".9"/>
        <path d="M30 184 q10 -16 26 -8 q-12 12 -26 8 Z" fill="#6f9b62"/>
        <path d="M32 183 q12 -6 22 -7" stroke="#4d7a42" strokeWidth=".8" fill="none"/>
      </>;
    }
    case 'collar': {
      const at = (deg: number) => [100 + 62 * Math.cos(deg * Math.PI / 180), 112 + 38 * Math.sin(deg * Math.PI / 180)];
      const [bx, by] = at(150);
      return <>
        <path d="M38 112 A62 38 0 0 1 162 112" stroke={dark(color, .32)} strokeWidth="18" fill="none"/>
        <path d="M38 112 A62 38 0 0 0 162 112" stroke={color} strokeWidth="18" fill="none"/>
        <path d="M38 107 A62 38 0 0 0 162 107 M38 117 A62 38 0 0 0 162 117" stroke={accent} strokeOpacity=".7" strokeDasharray="3 3" fill="none"/>
        <path d="M38 112 A62 38 0 0 0 162 112" stroke="#fff" strokeOpacity=".14" strokeWidth="5" fill="none" transform="translate(0 -4)"/>
        {[18, 32, 46].map(d => { const [x, y] = at(d); return <circle key={d} cx={x} cy={y} r="2.3" fill={dark(color, .55)}/>; })}
        <rect x={bx - 11} y={by - 14} width="22" height="28" rx="5" fill="none" stroke={accent} strokeWidth="4" transform={`rotate(-42 ${bx} ${by})`}/>
        <path d={`M${bx - 9} ${by + 1} L${bx + 9} ${by - 1}`} stroke={accent} strokeWidth="3" strokeLinecap="round"/>
        <path d="M92 152 Q100 166 108 152" stroke={accent} strokeWidth="3" fill="none"/>
        <circle cx="100" cy="171" r="13" fill={accent}/>
        <circle cx="100" cy="171" r="13" fill={`url(#${id}r)`} opacity=".25"/>
        <Paw x={100} y={171} s={1.05} fill={dark(accent, .35)}/>
      </>;
    }
    case 'bowl': {
      const kibble: [number, number][] = [[80, 115], [90, 111], [101, 114], [112, 111], [122, 115], [86, 119], [97, 119], [109, 118], [118, 120], [94, 108], [106, 108]];
      return <>
        <clipPath id={id + 'c'}><ellipse cx="100" cy="113" rx="50" ry="12"/></clipPath>
        <path d="M66 170 Q100 184 134 170 L132 178 Q100 190 68 178 Z" fill={dark(color, .3)}/>
        <path d="M42 112 Q46 172 100 178 Q154 172 158 112 Z" fill={color}/>
        <Paw x={100} y={148} s={1.8} fill={accent} opacity={.55}/>
        <path d="M42 112 Q46 172 100 178 Q154 172 158 112 Z" fill={G}/>
        <ellipse cx="100" cy="112" rx="58" ry="16" fill={light(color, .18)}/>
        <ellipse cx="100" cy="113" rx="50" ry="12" fill={accent}/>
        <g clipPath={`url(#${id}c)`}><ellipse cx="100" cy="109" rx="52" ry="8" fill="#000" opacity=".08"/>{kibble.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.4" fill={i % 2 ? '#8f5a2f' : '#b0743f'}/>)}</g>
      </>;
    }
    case 'bed':
      return <>
        <rect x="22" y="110" width="156" height="72" rx="36" fill={dark(color, .16)}/>
        <rect x="24" y="96" width="152" height="76" rx="38" fill={color}/>
        <rect x="24" y="96" width="152" height="76" rx="38" fill={V}/>
        <ellipse cx="100" cy="132" rx="60" ry="22" fill={dark(color, .2)}/>
        <ellipse cx="100" cy="137" rx="56" ry="19" fill={accent}/>
        <path d="M58 136 Q100 124 142 136" stroke={dark(accent, .08)} strokeWidth="2" fill="none"/>
        <rect x="30" y="102" width="140" height="64" rx="32" fill="none" stroke="#fff" strokeOpacity=".6" strokeDasharray="3 4"/>
        <rect x="158" y="140" width="10" height="15" rx="2" fill="#dfb775"/>
      </>;
    case 'brush': {
      const dots: [number, number][] = [];
      for (let y = 50; y <= 112; y += 7) for (let x = 72 + ((y / 7) % 2) * 3.5; x <= 128; x += 7) if (((x - 100) / 25) ** 2 + ((y - 80) / 34) ** 2 < 1) dots.push([x, y]);
      return <g transform="rotate(-28 100 112)">
        <rect x="90" y="112" width="20" height="76" rx="10" fill={dark(color, .1)}/>
        <rect x="90" y="112" width="20" height="76" rx="10" fill={G}/>
        <circle cx="100" cy="176" r="4" fill={dark(color, .45)}/>
        <ellipse cx="100" cy="80" rx="38" ry="48" fill={color}/>
        <ellipse cx="100" cy="80" rx="29" ry="38" fill={accent}/>
        <g fill="#e9e1d3">{dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8"/>)}</g>
        <ellipse cx="100" cy="80" rx="38" ry="48" fill={G} opacity=".8"/>
      </g>;
    }
    case 'dropper':
      return <>
        <path d="M72 96 Q72 76 90 74 H110 Q128 76 128 96 V170 Q128 184 114 184 H86 Q72 184 72 170 Z" fill={color}/>
        <rect x="78" y="106" width="44" height="58" rx="5" fill={accent}/>
        <path d="M100 116 C95 123 94 128 100 132 C106 128 105 123 100 116 Z" fill={color}/>
        <text x="100" y="146" textAnchor="middle" fontSize="6.6" fontWeight="800" letterSpacing=".8" fill={dark(color, .4)}>{label}</text>
        <path d="M90 153 H110" stroke={color} strokeOpacity=".5"/>
        <path d="M72 96 Q72 76 90 74 H110 Q128 76 128 96 V170 Q128 184 114 184 H86 Q72 184 72 170 Z" fill={G}/>
        <rect x="85" y="58" width="30" height="18" rx="3" fill="#1f2a24"/>
        <g stroke="#fff" strokeOpacity=".14">{[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${89 + i * 5.5} 61 V73`}/>)}</g>
        <path d="M90 60 V40 Q90 24 100 24 Q110 24 110 40 V60 Z" fill="#2b3530"/>
        <path d="M90 60 V40 Q90 24 100 24 Q110 24 110 40 V60 Z" fill={G}/>
        <path d="M150 146 C144 156 143 162 150 166 C157 162 156 156 150 146 Z M164 164 C160 170 160 174 164 176 C168 174 168 170 164 164 Z" fill={light(color, .2)}/>
      </>;
    case 'tube':
      return <>
        <g transform="rotate(-16 100 116)">
          <rect x="28" y="96" width="14" height="42" rx="2" fill={dark(color, .1)}/>
          <g stroke="#000" strokeOpacity=".1">{[0, 1, 2, 3].map(i => <path key={i} d={`M31 ${100 + i * 10} H40`}/>)}</g>
          <path d="M42 98 L136 104 Q142 105 142 112 V124 Q142 131 136 132 L42 138 Z" fill={color}/>
          <path d="M62 99.3 L82 100.6 V135.4 L62 136.7 Z" fill={accent}/>
          <text x="114" y="121" textAnchor="middle" fontSize="8" fontWeight="800" letterSpacing="1.4" fill={accent}>{label}</text>
          <path d="M42 98 L136 104 Q142 105 142 112 V124 Q142 131 136 132 L42 138 Z" fill={V}/>
          <rect x="142" y="107" width="8" height="22" fill={dark(color, .08)}/>
          <rect x="150" y="104" width="22" height="28" rx="5" fill={accent}/>
          <rect x="150" y="104" width="22" height="28" rx="5" fill={V}/>
        </g>
        <path d="M110 182 V164 Q110 152 122 152 H132 Q144 152 144 164 V182 Z" fill={light(accent, .62)}/>
        <g fill={accent}>{[0, 1, 2, 3].map(i => <circle key={i} cx={117 + i * 7} cy="160" r="2"/>)}{[0, 1, 2].map(i => <circle key={i} cx={120.5 + i * 7} cy="167" r="2"/>)}</g>
      </>;
    case 'kit':
      return <>
        <rect x="44" y="100" width="112" height="84" rx="6" fill={color}/>
        <rect x="44" y="100" width="112" height="84" rx="6" fill={G}/>
        <rect x="44" y="104" width="112" height="6" fill="#000" opacity=".16"/>
        <Paw x={68} y={146} s={1.7} fill={accent} opacity={.85}/>
        <rect x="92" y="84" width="16" height="100" fill={accent}/>
        <rect x="38" y="82" width="124" height="24" rx="5" fill={light(color, .1)}/>
        <rect x="92" y="82" width="16" height="24" fill={accent}/>
        <rect x="38" y="82" width="124" height="24" rx="5" fill={V}/>
        <path d="M100 82 C86 56 60 62 70 78 C76 87 92 85 100 82 Z" fill={accent}/>
        <path d="M100 82 C114 56 140 62 130 78 C124 87 108 85 100 82 Z" fill={dark(accent, .08)}/>
        <ellipse cx="100" cy="81" rx="7" ry="5.4" fill={dark(accent, .18)}/>
        <path d="M106 88 Q124 100 130 122" stroke={accent} strokeWidth="1.2" fill="none"/>
        <rect x="120" y="120" width="24" height="15" rx="3" fill="#fbf6ec" transform="rotate(16 132 127)"/>
        <circle cx="124" cy="124" r="1.6" fill={accent}/>
      </>;
  }
}
