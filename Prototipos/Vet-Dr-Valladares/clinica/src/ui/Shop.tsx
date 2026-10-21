'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronDown, Eye, MapPin, MessageCircle, Minus, Pill, Plus, ShoppingBag, Sparkles, Stethoscope, Trash2, X} from 'lucide-react';
import {CATEGORIES, KITS, PRODUCTS, findProduct, kitValue, money, priceOf, type Product} from '../content/shop';
import {addLine, setQty, useCart, type Line} from '../core/cart';
import {WHATSAPP, url} from '../core/config';
import ProductArt from './ProductArt';
import {FloatingPaws, PawBurst, playSound} from './fx';

const COPY = {
  es: {
    eyebrow: 'TIENDA ONLINE · SELECCIÓN VETERINARIA', title: ['Lo mejor para ellos,', 'elegido con criterio.'],
    body: 'Alimentos, juguetes, champús y accesorios seleccionados por el equipo de la clínica. Arme su pedido en línea y retírelo en Heredia centro.',
    browse: 'Ver el catálogo', advice: 'Pedir consejo por WhatsApp', tagKit: 'KIT BIENVENIDA',
    perks: [['Selección veterinaria', 'Productos que el equipo conoce y recomienda.'], ['Retiro en la clínica', 'Heredia centro, 25 m al norte de los cajeros del Hospital Viejo.'], ['Confirmación por WhatsApp', 'La clínica confirma disponibilidad y total antes de prepararlo.'], ['Asesoría sin costo', 'Le ayudamos a elegir según su edad, tamaño y salud.']],
    catalogEyebrow: 'EL CATÁLOGO', catalogTitle: ['Todo lo que necesita,', 'en un solo lugar.'], catalogBody: 'Filtre por categoría o por especie. El tamaño se elige en cada producto.',
    categories: 'Categorías', speciesName: 'Especie', species: {all: 'Todos', dog: 'Perros', cat: 'Gatos'} as Record<string, string>, both: 'Perros y gatos',
    sort: 'Ordenar', sorts: {featured: 'Destacados', low: 'Precio: de menor a mayor', high: 'Precio: de mayor a menor'} as Record<string, string>,
    results: '{n} productos', result: '1 producto', empty: 'No hay productos con estos filtros.', reset: 'Ver todo el catálogo',
    badges: {pick: 'Recomendado', new: 'Nuevo', grainfree: 'Sin cereales'} as Record<string, string>,
    add: 'Añadir', added: 'Añadido', quick: 'Vista rápida', size: 'Tamaño', qty: 'Cantidad', addToOrder: 'Añadir al pedido', pickupNote: 'Retiro en Heredia centro · confirmación por WhatsApp',
    kitsEyebrow: 'KITS DE LA CLÍNICA', kitsTitle: ['Pensados para cada momento,', 'listos para llevar.'], kitsBody: 'Combinaciones que el equipo arma a menudo, con un precio especial frente a comprar cada producto por separado.',
    includes: 'Incluye', save: 'Ahorra {n}', addKit: 'Añadir el kit',
    medsEyebrow: 'MEDICAMENTOS', medsTitle: '¿Busca medicamentos o antiparasitarios?', medsBody: 'Se entregan tras la valoración veterinaria, con la dosis adecuada para su mascota. Consúltelos en su cita o por WhatsApp.', medsCta: 'Agendar una cita', medsAlt: 'Consultar por WhatsApp',
    bag: 'Su pedido', items: '{n} artículos', item: '1 artículo', open: 'Ver su pedido', close: 'Cerrar',
    emptyBag: 'Su pedido está vacío.', emptyBagBody: 'Explore el catálogo y añada lo que su mascota necesita.', keep: 'Explorar el catálogo',
    total: 'Total de referencia', remove: 'Quitar', less: 'Uno menos', more: 'Uno más',
    name: 'Su nombre', namePh: 'Nombre y apellido', pickup: 'Entrega', pickups: {clinic: 'Retiro en la clínica', home: 'A domicilio (a coordinar)'} as Record<string, string>,
    note: 'Nota para la clínica', notePh: 'Opcional: nombre de su mascota, horario de retiro…', optional: '(opcional)',
    send: 'Enviar pedido por WhatsApp', clear: 'Vaciar el pedido',
    fine: 'Catálogo de muestra con precios de referencia en colones, IVA incluido. La clínica confirma disponibilidad y total antes de preparar su pedido: no se cobra nada en línea.',
    sentTitle: 'Su pedido está listo en WhatsApp.', sentBody: 'Envíelo desde WhatsApp para que llegue a la clínica. Le confirmarán la disponibilidad y el total.', back: 'Volver al pedido',
  },
  en: {
    eyebrow: 'ONLINE SHOP · VETERINARY SELECTION', title: ['The best for them,', 'chosen with care.'],
    body: 'Food, toys, shampoos and accessories selected by the clinic’s team. Put your order together online and collect it in central Heredia.',
    browse: 'Browse the catalogue', advice: 'Ask for advice on WhatsApp', tagKit: 'WELCOME KIT',
    perks: [['Veterinary selection', 'Products the team knows and recommends.'], ['Collect at the clinic', 'Central Heredia, 25 m north of the Hospital Viejo cash machines.'], ['Confirmed on WhatsApp', 'The clinic confirms availability and total before preparing it.'], ['Free advice', 'We help you choose for their age, size and health.']],
    catalogEyebrow: 'THE CATALOGUE', catalogTitle: ['Everything they need,', 'in one place.'], catalogBody: 'Filter by category or by species. Choose the size on each product.',
    categories: 'Categories', speciesName: 'Species', species: {all: 'All', dog: 'Dogs', cat: 'Cats'} as Record<string, string>, both: 'Dogs and cats',
    sort: 'Sort', sorts: {featured: 'Featured', low: 'Price: low to high', high: 'Price: high to low'} as Record<string, string>,
    results: '{n} products', result: '1 product', empty: 'No products match these filters.', reset: 'See the whole catalogue',
    badges: {pick: 'Clinic pick', new: 'New', grainfree: 'Grain free'} as Record<string, string>,
    add: 'Add', added: 'Added', quick: 'Quick view', size: 'Size', qty: 'Quantity', addToOrder: 'Add to order', pickupNote: 'Collect in central Heredia · confirmed on WhatsApp',
    kitsEyebrow: 'CLINIC KITS', kitsTitle: ['Made for every moment,', 'ready to take home.'], kitsBody: 'Combinations the team often puts together, at a special price compared with buying each product separately.',
    includes: 'Includes', save: 'Save {n}', addKit: 'Add the kit',
    medsEyebrow: 'MEDICATION', medsTitle: 'Looking for medication or parasite control?', medsBody: 'They are supplied after a veterinary assessment, with the right dose for your pet. Ask during your visit or on WhatsApp.', medsCta: 'Book a visit', medsAlt: 'Ask on WhatsApp',
    bag: 'Your order', items: '{n} items', item: '1 item', open: 'View your order', close: 'Close',
    emptyBag: 'Your order is empty.', emptyBagBody: 'Browse the catalogue and add what your pet needs.', keep: 'Browse the catalogue',
    total: 'Reference total', remove: 'Remove', less: 'One less', more: 'One more',
    name: 'Your name', namePh: 'First and last name', pickup: 'Delivery', pickups: {clinic: 'Collect at the clinic', home: 'Home delivery (to arrange)'} as Record<string, string>,
    note: 'Note for the clinic', notePh: 'Optional: your pet’s name, collection time…', optional: '(optional)',
    send: 'Send order on WhatsApp', clear: 'Empty the order',
    fine: 'Sample catalogue with reference prices in colones, VAT included. The clinic confirms availability and total before preparing your order: nothing is charged online.',
    sentTitle: 'Your order is ready in WhatsApp.', sentBody: 'Send it from WhatsApp so it reaches the clinic. They will confirm availability and the total.', back: 'Back to the order',
  },
};
type Copy = typeof COPY.es;
const fill = (text: string, n: string | number) => text.replace('{n}', String(n));
const tone = (p: Product) => ({'--tone': p.tone} as React.CSSProperties);

// «Destacados»: primero los marcados y después el resto alternando categorías, para que la primera fila no sea solo comida.
const FEATURED = (() => {
  const rest = PRODUCTS.filter(p => !p.featured), groups = CATEGORIES.slice(1).map(([k]) => rest.filter(p => p.cat === k)), mixed: Product[] = [];
  for (let i = 0; i < Math.max(...groups.map(g => g.length)); i++) groups.forEach(g => g[i] && mixed.push(g[i]));
  return [...PRODUCTS.filter(p => p.featured).sort((a, b) => a.featured! - b.featured!), ...mixed];
})();

export default function Shop({en = false}: {en?: boolean}) {
  const c = en ? COPY.en : COPY.es;
  const [cart, setCart] = useCart();
  const [cat, setCat] = useState('all'), [species, setSpecies] = useState('all'), [sort, setSort] = useState('featured');
  const [quick, setQuick] = useState<Quick | null>(null);
  const [just, setJust] = useState(''), [bump, setBump] = useState(0), [announce, setAnnounce] = useState('');
  const [name, setName] = useState(''), [pickup, setPickup] = useState('clinic'), [note, setNote] = useState(''), [sent, setSent] = useState(false);
  const quickRef = useRef<HTMLDialogElement>(null), drawer = useRef<HTMLDialogElement>(null), timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const list = useMemo(() => {
    const base = sort === 'featured' ? FEATURED : [...PRODUCTS].sort((a, b) => (a.sizes[0].price - b.sizes[0].price) * (sort === 'low' ? 1 : -1));
    return base.filter(p => (cat === 'all' || p.cat === cat) && (species === 'all' || (p.species as string[]).includes(species)));
  }, [cat, species, sort]);
  const rows = cart.map(line => ({line, p: findProduct(line.id)})).filter((r): r is {line: Line, p: Product} => !!r.p);
  const count = rows.reduce((n, r) => n + r.line.qty, 0), total = rows.reduce((n, r) => n + priceOf(r.p, r.line.size) * r.line.qty, 0);
  const countText = count === 1 ? c.item : fill(c.items, count);
  const nameOf = (p: Product) => (en ? p.en : p.es).name;
  const catOf = (p: Product) => CATEGORIES.find(([k]) => k === p.cat)?.[en ? 2 : 1] || '';
  const speciesOf = (p: Product) => p.species.length > 1 ? c.both : c.species[p.species[0]];

  useEffect(() => () => clearTimeout(timer.current), []);
  function show(d: HTMLDialogElement | null) { if (d && !d.open) { d.showModal(); (window as Window & {ElysiumMouse?: {promote?: () => void}}).ElysiumMouse?.promote?.(); } }
  // Solo el fondo cierra: un clic en el hueco del propio diálogo también tiene como destino el <dialog>.
  function outside(e: React.MouseEvent<HTMLDialogElement>) {
    const d = e.currentTarget, r = d.getBoundingClientRect();
    if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) d.close();
  }
  function add(p: Product, size: string, qty = 1) {
    setCart(addLine(cart, p.id, size, qty));
    setJust(p.id); setBump(b => b + 1); setAnnounce(`${nameOf(p)} · ${c.added}`);
    clearTimeout(timer.current); timer.current = setTimeout(() => setJust(''), 1600);
  }
  function closeQuick() { quickRef.current?.close(); }
  function openQuick(p: Product, size: string) { setQuick({p, size, qty: 1}); requestAnimationFrame(() => show(quickRef.current)); }
  function openBag() { setSent(false); show(drawer.current); }
  function toCatalog() { drawer.current?.close(); document.getElementById('catalogo')?.scrollIntoView({behavior: 'smooth'}); }

  // Lo que llega a la clínica va siempre en español, como el resto de formularios.
  const order = [
    'Hola, quisiera hacer este pedido en la tienda de la clínica:', '',
    ...rows.map(({line, p}) => `• ${line.qty} × ${p.es.name}${line.size ? ` (${line.size})` : ''} — ${money(priceOf(p, line.size) * line.qty)}`), '',
    `Total de referencia: ${money(total)}`, ...(name.trim() ? [`Nombre: ${name.trim()}`] : []), `Entrega: ${COPY.es.pickups[pickup]}`, ...(note.trim() ? [`Nota: ${note.trim()}`] : []), '',
    '¿Me confirman la disponibilidad y el total? ¡Gracias!',
  ].join('\n');

  const hero = ['champu-avena', 'adulto-pollo', 'pelota-dispensadora'].map(id => findProduct(id)!);
  return <>
    <section className="page-hero shop-hero">
      <FloatingPaws/>
      <div className="shop-hero-copy">
        <span className="eyebrow"><span className="status-dot"/>{c.eyebrow}</span>
        <h1>{c.title[0]}<br/><em>{c.title[1]}</em></h1>
        <p>{c.body}</p>
        <div className="shop-hero-actions"><a className="button" href="#catalogo">{c.browse}<ArrowDown size={17}/></a><a className="text-link" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>{c.advice}</a></div>
      </div>
      <div className="shop-hero-visual" aria-hidden="true">
        <div className="shop-arch"/>
        {hero.map((p, i) => <ProductArt key={p.id} className={'hv hv-' + i} art={p.art} color={p.color} accent={p.accent} label={(en ? p.en : p.es).label}/>)}
        <div className="shop-shelf"/>
        <div className="hv-tag"><small>{c.tagKit}</small><strong>{money(KITS[0].sizes[0].price)}</strong></div>
        <div className="hv-chip"><Sparkles size={14}/>{c.perks[0][0]}</div>
      </div>
    </section>

    <ul className="shop-perks">{c.perks.map(([title, text], i) => { const Icon = [Stethoscope, MapPin, MessageCircle, Sparkles][i]; return <li key={title}><span><Icon size={18}/></span><div><strong>{title}</strong><p>{text}</p></div></li>; })}</ul>

    <section className="section shop-catalog" id="catalogo">
      <div className="section-title"><div><span className="eyebrow">{c.catalogEyebrow}</span><h2>{c.catalogTitle[0]}<br/><span>{c.catalogTitle[1]}</span></h2></div><p>{c.catalogBody}</p></div>
      <div className="shop-toolbar">
        <div className="shop-cats" role="group" aria-label={c.categories}>{CATEGORIES.map(([key, es, english]) => {
          const n = key === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === key).length;
          return <button key={key} aria-pressed={cat === key} onClick={() => setCat(key)}>{en ? english : es}<small>{n}</small></button>;
        })}</div>
        <div className="shop-tools">
          <div className="shop-species" role="group" aria-label={c.speciesName}>{['all', 'dog', 'cat'].map(s => <button key={s} aria-pressed={species === s} onClick={() => setSpecies(s)}>{c.species[s]}</button>)}</div>
          <label className="shop-sort"><span>{c.sort}</span><select value={sort} onChange={e => setSort(e.target.value)}>{Object.entries(c.sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><ChevronDown size={14}/></label>
        </div>
      </div>
      <p className="shop-count" aria-live="polite">{list.length === 1 ? c.result : fill(c.results, list.length)}</p>
      {list.length ? <div className="shop-grid">{list.map(p => <Card key={p.id} p={p} c={c} en={en} cat={catOf(p)} species={speciesOf(p)} done={just === p.id} onAdd={add} onQuick={openQuick}/>)}</div>
        : <div className="shop-none"><ShoppingBag/><p>{c.empty}</p><button className="button outline small" onClick={() => { setCat('all'); setSpecies('all'); }}>{c.reset}</button></div>}
    </section>

    <section className="shop-kits">
      <FloatingPaws/>
      <div className="shop-kits-head"><span className="eyebrow">{c.kitsEyebrow}</span><h2>{c.kitsTitle[0]} <em>{c.kitsTitle[1]}</em></h2><p>{c.kitsBody}</p></div>
      <div className="shop-kits-grid">{KITS.map(k => {
        const t = en ? k.en : k.es, value = kitValue(k), price = k.sizes[0].price;
        return <article className="kit-card" key={k.id}>
          <div className="kit-media" style={tone(k)}>
            <ProductArt art={k.art} color={k.color} accent={k.accent}/>
            <div className="kit-minis">{(k.includes || []).map(([id]) => { const p = findProduct(id)!; return <span key={id} style={tone(p)}><ProductArt art={p.art} color={p.color} accent={p.accent}/></span>; })}</div>
          </div>
          <div className="kit-body">
            <span className="eyebrow">{t.short}</span><h3>{t.name}</h3><p>{t.text}</p>
            <h4>{c.includes}</h4>
            <ul>{(k.includes || []).map(([id, size]) => <li key={id}><Check size={14}/>{nameOf(findProduct(id)!)}<small>{size}</small></li>)}</ul>
            <div className="kit-foot">
              <div className="kit-price"><s>{money(value)}</s><strong>{money(price)}</strong><span>{fill(c.save, money(value - price))}</span></div>
              <button className={'button' + (just === k.id ? ' done' : '')} onClick={() => add(k, '')}>{just === k.id ? <><Check size={17}/>{c.added}</> : <>{c.addKit}<Plus size={17}/></>}</button>
            </div>
          </div>
        </article>;
      })}</div>
    </section>

    <section className="section shop-meds">
      <span className="shop-meds-icon"><Pill/></span>
      <div><span className="eyebrow">{c.medsEyebrow}</span><h2>{c.medsTitle}</h2><p>{c.medsBody}</p></div>
      <div className="shop-meds-actions"><a className="button" href={url('/citas')}><CalendarDays size={17}/>{c.medsCta}</a><a className="button outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">{c.medsAlt}<ArrowUpRight size={17}/></a></div>
    </section>

    {count > 0 && <button key={bump} className={'shop-fab' + (bump ? ' bump' : '')} onClick={openBag} aria-label={`${c.open} · ${countText}`}><ShoppingBag size={20}/><span>{c.bag} · {money(total)}</span><b>{count}</b></button>}
    <p className="sr-only" role="status">{announce}</p>

    <dialog ref={quickRef} className="modal shop-quick" onClose={() => setQuick(null)} onClick={outside} aria-label={quick ? nameOf(quick.p) : c.quick}>
      {quick && <QuickView quick={quick} c={c} en={en} cat={catOf(quick.p)} species={speciesOf(quick.p)} done={just === quick.p.id} onChange={setQuick} onAdd={add} onClose={closeQuick}/>}
    </dialog>

    <dialog ref={drawer} className="shop-drawer" onClick={outside} aria-labelledby="shop-drawer-title">
      <header className="shop-drawer-head"><div><h2 id="shop-drawer-title">{c.bag}</h2><small>{countText}</small></div><button className="icon-button" onClick={() => drawer.current?.close()} aria-label={c.close}><X/></button></header>
      {sent ? <div className="shop-sent"><PawBurst/><span className="sent-icon"><MessageCircle/></span><h3>{c.sentTitle}</h3><p>{c.sentBody}</p><button className="button outline small" onClick={() => setSent(false)}>{c.back}</button></div>
        : !rows.length ? <div className="shop-empty"><span><ShoppingBag/></span><h3>{c.emptyBag}</h3><p>{c.emptyBagBody}</p><button className="button small" onClick={toCatalog}>{c.keep}</button></div>
        : <>
          <ul className="shop-lines">{rows.map(({line, p}) => <li key={line.id + line.size}>
            <span className="shop-line-art" style={tone(p)}><ProductArt art={p.art} color={p.color} accent={p.accent} label={(en ? p.en : p.es).label}/></span>
            <div><strong>{nameOf(p)}</strong>{line.size && <small>{line.size}</small>}<Stepper qty={line.qty} c={c} set={n => setCart(setQty(cart, line, n))}/></div>
            <div className="shop-line-end"><strong>{money(priceOf(p, line.size) * line.qty)}</strong><button onClick={() => setCart(setQty(cart, line, 0))} aria-label={`${c.remove}: ${nameOf(p)}`}><Trash2 size={15}/></button></div>
          </li>)}</ul>
          <div className="shop-checkout">
            <div className="shop-total"><span>{c.total}</span><strong>{money(total)}</strong></div>
            <label className="shop-field"><span>{c.name} <small>{c.optional}</small></span><input value={name} onChange={e => setName(e.target.value)} placeholder={c.namePh} autoComplete="name" maxLength={80}/></label>
            <fieldset className="shop-field"><legend>{c.pickup}</legend><div className="shop-pickups">{Object.entries(c.pickups).map(([k, v]) => <button type="button" key={k} aria-pressed={pickup === k} onClick={() => setPickup(k)}>{v}</button>)}</div></fieldset>
            <label className="shop-field"><span>{c.note} <small>{c.optional}</small></span><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder={c.notePh} maxLength={300}/></label>
            {/* «Enviado» se pinta después del clic: si el enlace desapareciera antes, el navegador ya no lo seguiría. */}
            <a className="button full" href={`${WHATSAPP}?text=${encodeURIComponent(order)}`} target="_blank" rel="noopener noreferrer" onClick={() => { setTimeout(() => setSent(true), 60); playSound('enviado-con-exito'); }}><MessageCircle size={18}/>{c.send}</a>
            <button className="text-button shop-clear" onClick={() => setCart([])}>{c.clear}</button>
            <p className="micro">{c.fine}</p>
          </div>
        </>}
    </dialog>
  </>;
}

type Quick = {p: Product, size: string, qty: number};
function QuickView({quick, c, en, cat, species, done, onChange, onAdd, onClose}: {quick: Quick, c: Copy, en: boolean, cat: string, species: string, done: boolean, onChange: (q: Quick) => void, onAdd: (p: Product, size: string, qty: number) => void, onClose: () => void}) {
  const {p, size, qty} = quick, t = en ? p.en : p.es;
  return <>
    <button className="modal-close icon-button" onClick={onClose} aria-label={c.close}><X/></button>
    <div className="shop-quick-media" style={tone(p)}>{p.badge && <span className={'shop-badge ' + p.badge}>{c.badges[p.badge]}</span>}<ProductArt art={p.art} color={p.color} accent={p.accent} label={t.label}/></div>
    <div className="shop-quick-body">
      <span className="eyebrow">{cat} · {species}</span>
      <h2>{t.name}</h2>
      <strong className="shop-price">{money(priceOf(p, size) * qty)}</strong>
      <p>{t.text}</p>
      <ul className="shop-points">{t.points.map(x => <li key={x}><Check size={15}/>{x}</li>)}</ul>
      <div className="shop-quick-row">
        <div><span className="shop-label">{c.size}</span><div className="shop-sizes" role="group" aria-label={c.size}>{p.sizes.map(s => <button key={s.label} aria-pressed={size === s.label} onClick={() => onChange({...quick, size: s.label})}>{s.label}</button>)}</div></div>
        <div><span className="shop-label">{c.qty}</span><Stepper qty={qty} c={c} set={n => onChange({...quick, qty: Math.max(1, Math.min(99, n))})}/></div>
      </div>
      <button className={'button full' + (done ? ' done' : '')} onClick={() => onAdd(p, size, qty)}>{done ? <><Check size={17}/>{c.added}</> : <><ShoppingBag size={17}/>{c.addToOrder} · {money(priceOf(p, size) * qty)}</>}</button>
      <p className="micro shop-pickup"><MapPin size={13}/>{c.pickupNote}</p>
    </div>
  </>;
}

function Card({p, c, en, cat, species, done, onAdd, onQuick}: {p: Product, c: Copy, en: boolean, cat: string, species: string, done: boolean, onAdd: (p: Product, size: string) => void, onQuick: (p: Product, size: string) => void}) {
  const [size, setSize] = useState(p.sizes[0].label), t = en ? p.en : p.es;
  return <article className="shop-card" style={tone(p)}>
    <button className="shop-media" onClick={() => onQuick(p, size)} aria-label={`${c.quick}: ${t.name}`}>
      {p.badge && <span className={'shop-badge ' + p.badge}>{c.badges[p.badge]}</span>}
      <ProductArt art={p.art} color={p.color} accent={p.accent} label={t.label}/>
      <span className="shop-quick-hint"><Eye size={14}/>{c.quick}</span>
    </button>
    <div className="shop-card-body">
      <span className="shop-meta">{cat} · {species}</span>
      <h3>{t.name}</h3>
      <p>{t.short}</p>
      {p.sizes.length > 1
        ? <div className="shop-sizes" role="group" aria-label={c.size}>{p.sizes.map(s => <button key={s.label} aria-pressed={size === s.label} onClick={() => setSize(s.label)}>{s.label}</button>)}</div>
        : <span className="shop-size-one">{p.sizes[0].label}</span>}
      <div className="shop-card-foot">
        <strong className="shop-price">{money(priceOf(p, size))}</strong>
        <button className={'shop-add' + (done ? ' done' : '')} onClick={() => onAdd(p, size)} aria-label={`${c.add}: ${t.name}, ${size}`}>{done ? <Check size={17}/> : <Plus size={17}/>}<span>{done ? c.added : c.add}</span></button>
      </div>
    </div>
  </article>;
}

function Stepper({qty, set, c}: {qty: number, set: (n: number) => void, c: Copy}) {
  return <div className="shop-stepper"><button onClick={() => set(qty - 1)} aria-label={c.less}><Minus size={14}/></button><span aria-live="polite">{qty}</span><button onClick={() => set(qty + 1)} aria-label={c.more}><Plus size={14}/></button></div>;
}
