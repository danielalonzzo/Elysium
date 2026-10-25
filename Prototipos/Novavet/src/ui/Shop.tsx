'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  MapPin,
  MessageCircle,
  Minus,
  Pill,
  Plus,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
  ShieldCheck,
  Truck,
  Tractor,
} from 'lucide-react';
import {CATEGORIES, KITS, PRODUCTS, findProduct, kitValue, money, priceOf, type Product} from '../content/shop';
import {addLine, setQty, useCart, type Line} from '../core/cart';
import {WHATSAPP, url, PHONE, ADDRESS_STREET, ADDRESS_CITY, ADDRESS_POSTAL, DGAV_LICENSE} from '../core/config';
import ProductArt from './ProductArt';
import {playSound} from './fx';

const COPY = {
  es: {
    eyebrow: `DISTRIBUIÇÃO VETERINÁRIA & AGROPECUÁRIA · REGISTO DGAV ${DGAV_LICENSE}`,
    title: ['Catálogo Técnico de Produtos,', 'Medicamentos & Nutrição Clínica.'],
    body: 'Mais de 30.000 referências farmacêuticas, rações clínicas, nutrição de ruminantes, biossegurança e dispositivos médicos selecionados pelo Dr. Luís Afonso e pela equipa da Novavet. Prepare a sua lista e confirme por WhatsApp.',
    browse: 'Explorar catálogo',
    advice: 'Aconselhamento por WhatsApp',
    tagKit: 'PACK SANIDADE',
    perks: [
      ['Seleção Médico-Veterinária', 'Produtos e rações selecionados com rigor clínico pelo Dr. Luís Afonso.'],
      ['Levantamento em Bragança', `${ADDRESS_STREET}, ${ADDRESS_CITY} (junto ao centro histórico).`],
      ['Validação Rápida de Stock', 'A equipa da Novavet valida a disponibilidade de stock antes de preparar o pedido.'],
      ['Apoio Técnico ao Produtor', 'Orientação zootécnica e sanitária para animais de companhia e explorações pecuárias.'],
    ],
    catalogEyebrow: 'CATÁLOGO DE PRODUTOS',
    catalogTitle: ['Tudo para a saúde animal,', 'num único lugar.'],
    catalogBody: 'Filtre por categoria ou por espécie animal. O formato ou embalagem escolhe-se diretamente em cada produto.',
    categories: 'Categorias',
    speciesName: 'Espécie',
    species: {all: 'Todas as espécies', dog: 'Cães', cat: 'Gatos', sheep: 'Ovinos & Caprinos', cattle: 'Bovinos', horse: 'Equinos'} as Record<string, string>,
    both: 'Várias espécies',
    sort: 'Ordenar por',
    sorts: {featured: 'Destaques Novavet', low: 'Preço: mais baixo primeiro', high: 'Preço: mais alto primeiro'} as Record<string, string>,
    results: '{n} produtos disponíveis',
    result: '1 produto disponível',
    empty: 'Não foram encontrados produtos com estes filtros.',
    reset: 'Ver todo o catálogo',
    badges: {pick: 'Recomendado', new: 'Novidade', grainfree: 'Sem Cereais', dgav: 'Registo DGAV'} as Record<string, string>,
    add: 'Adicionar',
    added: 'Adicionado',
    quick: 'Vista rápida',
    size: 'Formato / Peso',
    qty: 'Quantidade',
    addToOrder: 'Adicionar ao pedido',
    pickupNote: `Levantamento em ${ADDRESS_CITY} · Confirmação por WhatsApp ou Telefone`,
    kitsEyebrow: 'PACKS NOVAVET',
    kitsTitle: ['Pensados para cada necessidade,', 'prontos a levar.'],
    kitsBody: 'Combinações técnicas preparadas pela nossa equipa, com preço vantajoso face à aquisição individual.',
    includes: 'Inclui:',
    save: 'Poupa {n}',
    addKit: 'Adicionar pack',
    medsEyebrow: `MEDICAMENTOS VETERINÁRIOS · REGISTO DGAV ${DGAV_LICENSE}`,
    medsTitle: 'Procura medicamentos veterinários, vacinas ou desparasitantes?',
    medsBody: 'A dispensa de medicamentos veterinários regulados obedece ao Decreto-Lei nº 184/2009 e requer aconselhamento ou prescrição médico-veterinária. Consulte a nossa equipa no consultório na Rua do Loreto ou através do WhatsApp oficial.',
    medsCta: 'Ligar para o Consultório',
    medsAlt: 'Consultar por WhatsApp',
    bag: 'A sua encomenda',
    items: '{n} artigos',
    item: '1 artigo',
    open: 'Ver encomenda',
    close: 'Fechar',
    emptyBag: 'A sua lista de encomenda está vazia.',
    emptyBagBody: 'Consulte o catálogo da Novavet e adicione os produtos ou packs que necessita.',
    keep: 'Explorar o catálogo',
    total: 'Total de referência',
    remove: 'Remover',
    less: 'Menos um',
    more: 'Mais um',
    name: 'O seu nome ou exploração',
    namePh: 'Ex.: Nome e apelido ou Nome da Exploração Pecuária',
    pickup: 'Modo de Entrega / Levantamento',
    pickups: {
      clinic: `Levantamento no Consultório (${ADDRESS_STREET}, Bragança)`,
      home: 'Entrega na Exploração Pecuária (Trás-os-Montes - a coordenar)',
    } as Record<string, string>,
    note: 'Nota para a Novavet',
    notePh: 'Ex.: nome do animal, exploração, urgência ou horário preferencial de levantamento…',
    optional: '(opcional)',
    send: 'Enviar encomenda por WhatsApp',
    clear: 'Limpar pedido',
    fine: `Catálogo de referência com preços em Euros (€), IVA incluído. A Novavet confirma a disponibilidade física e o total antes do levantamento: nenhum pagamento é cobrado diretamente online sem validação prévia. Registo DGAV: ${DGAV_LICENSE}.`,
    sentTitle: 'A sua encomenda está pronta no WhatsApp.',
    sentBody: 'Envie a mensagem gerada para a Novavet. A nossa equipa responderá com a confirmação de stock e o horário de levantamento.',
    back: 'Voltar ao pedido',
  },
  en: {
    eyebrow: `VETERINARY & AGRO DISTRIBUTION · DGAV LICENSE ${DGAV_LICENSE}`,
    title: ['Technical Product Catalogue,', 'Pharmaceuticals & Nutrition.'],
    body: 'Over 30,000 veterinary references, clinical pet feeds, livestock nutrition, biosecurity and medical devices selected by Dr. Luís Afonso and the Novavet team. Prepare your list and submit via WhatsApp.',
    browse: 'Browse catalogue',
    advice: 'Ask on WhatsApp',
    tagKit: 'HEALTH PACK',
    perks: [
      ['Veterinary Selection', 'Products and feeds chosen with strict clinical criteria by Dr. Luís Afonso.'],
      ['Collect in Bragança', `${ADDRESS_STREET}, ${ADDRESS_CITY} (near historic centre).`],
      ['Fast Stock Confirmation', 'The Novavet team verifies stock availability before preparing your order.'],
      ['Technical Advisory', 'Professional guidance for companion animals and livestock operations.'],
    ],
    catalogEyebrow: 'PRODUCT CATALOGUE',
    catalogTitle: ['Everything for animal health,', 'in one place.'],
    catalogBody: 'Filter by category or species. Packaging size is selected directly on each product.',
    categories: 'Categories',
    speciesName: 'Species',
    species: {all: 'All species', dog: 'Dogs', cat: 'Cats', sheep: 'Sheep & Goats', cattle: 'Cattle', horse: 'Horses'} as Record<string, string>,
    both: 'Multiple species',
    sort: 'Sort by',
    sorts: {featured: 'Featured items', low: 'Price: lowest first', high: 'Price: highest first'} as Record<string, string>,
    results: '{n} products available',
    result: '1 product available',
    empty: 'No products found matching these filters.',
    reset: 'View all products',
    badges: {pick: 'Recommended', new: 'New', grainfree: 'Grain-Free', dgav: 'DGAV License'} as Record<string, string>,
    add: 'Add',
    added: 'Added',
    quick: 'Quick view',
    size: 'Packaging / Weight',
    qty: 'Quantity',
    addToOrder: 'Add to order',
    pickupNote: `Pickup in ${ADDRESS_CITY} · WhatsApp or Phone confirmation`,
    kitsEyebrow: 'NOVAVET BUNDLES',
    kitsTitle: ['Tailored for every need,', 'ready to collect.'],
    kitsBody: 'Technical combinations prepared by our team with bundle savings compared to individual purchases.',
    includes: 'Includes:',
    save: 'Save {n}',
    addKit: 'Add pack',
    medsEyebrow: `VETERINARY MEDICINES · DGAV REGISTRATION ${DGAV_LICENSE}`,
    medsTitle: 'Looking for veterinary prescription medicines or vaccines?',
    medsBody: 'Dispensation of regulated veterinary medicinal products complies with Decree-Law 184/2009 and requires clinical advisory or veterinary prescription. Please contact our clinic in Bragança or via official WhatsApp.',
    medsCta: 'Call Clinic',
    medsAlt: 'WhatsApp Advisory',
    bag: 'Your order list',
    items: '{n} items',
    item: '1 item',
    open: 'View order list',
    close: 'Close',
    emptyBag: 'Your order list is empty.',
    emptyBagBody: 'Browse the Novavet catalogue and add products or packs you need.',
    keep: 'Explore catalogue',
    total: 'Reference total',
    remove: 'Remove',
    less: 'Decrease',
    more: 'Increase',
    name: 'Your name or farm name',
    namePh: 'e.g., Full name or Livestock Farm name',
    pickup: 'Delivery or Pickup mode',
    pickups: {
      clinic: `Collect at Clinic (${ADDRESS_STREET}, Bragança)`,
      home: 'Farm delivery (Trás-os-Montes - to be scheduled)',
    } as Record<string, string>,
    note: 'Order note',
    notePh: 'e.g., animal name, farm, urgency or preferred pickup time…',
    optional: '(optional)',
    send: 'Send order via WhatsApp',
    clear: 'Clear list',
    fine: `Reference catalogue with prices in Euros (€), VAT included. Novavet validates physical stock and final total before pickup: no direct online payment is processed without confirmation. DGAV License: ${DGAV_LICENSE}.`,
    sentTitle: 'Your order is ready on WhatsApp.',
    sentBody: 'Send the generated message to Novavet. Our team will promptly reply with stock confirmation and pickup details.',
    back: 'Return to order',
  },
};

const fill = (str: string, val: string | number) => str.replace('{n}', String(val));
const tone = (p: Product) => ({'--tone': p.tone, '--accent': p.accent, '--color': p.color} as React.CSSProperties);

export default function Shop({en = false}: {en?: boolean}) {
  const c = en ? COPY.en : COPY.es;
  const [cat, setCat] = useState<string>('all');
  const [species, setSpecies] = useState<string>('all');
  const [sort, setSort] = useState<string>('featured');
  const [quick, setQuick] = useState<{p: Product, size: string, qty: number} | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [cart, setCart] = useCart();
  const [name, setName] = useState('');
  const [pickup, setPickup] = useState('clinic');
  const [note, setNote] = useState('');
  const [just, setJust] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [bump, setBump] = useState(0);
  const [announce, setAnnounce] = useState('');
  const quickRef = useRef<HTMLDialogElement>(null);
  const bagRef = useRef<HTMLDialogElement>(null);

  const nameOf = (p: Product) => (en ? p.en.name : p.es.name);
  const catOf = (p: Product) => {
    const entry = CATEGORIES.find(([k]) => k === p.cat);
    return entry ? (en ? entry[2] : entry[1]) : '';
  };
  const speciesOf = (p: Product) => {
    if (p.species.includes('all') || p.species.length > 2) return c.both;
    return p.species.map(s => c.species[s] || s).join(', ');
  };

  const list = useMemo(() => {
    let out = PRODUCTS.filter(p => {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (species !== 'all' && !p.species.includes(species as any) && !p.species.includes('all')) return false;
      return true;
    });
    if (sort === 'low') out = [...out].sort((a, b) => a.sizes[0].price - b.sizes[0].price);
    else if (sort === 'high') out = [...out].sort((a, b) => b.sizes[0].price - a.sizes[0].price);
    else out = [...out].sort((a, b) => (a.featured || 99) - (b.featured || 99));
    return out;
  }, [cat, species, sort]);

  const rows = useMemo(() => {
    return cart
      .map(line => {
        const p = findProduct(line.id);
        return p ? {line, p} : null;
      })
      .filter(Boolean) as {line: Line, p: Product}[];
  }, [cart]);

  const total = useMemo(
    () => rows.reduce((acc, {line, p}) => acc + priceOf(p, line.size) * line.qty, 0),
    [rows]
  );
  const count = useMemo(() => cart.reduce((acc, l) => acc + l.qty, 0), [cart]);

  const add = (p: Product, size: string, qty = 1) => {
    setCart(addLine(cart, {id: p.id, size: size || p.sizes[0].label, qty}));
    setJust(p.id);
    setBump(b => b + 1);
    setAnnounce(`${nameOf(p)} ${c.added}`);
    playSound('anadir-al-carrito');
    setTimeout(() => setJust(null), 1400);
  };

  const openQuick = (p: Product, size?: string) => {
    setQuick({p, size: size || p.sizes[0].label, qty: 1});
    playSound('abrir-modal');
  };
  const closeQuick = () => {
    setQuick(null);
    playSound('cerrar-modal');
  };

  const openBag = () => {
    setBagOpen(true);
    setSent(false);
    playSound('abrir-modal');
  };
  const closeBag = () => {
    setBagOpen(false);
    playSound('cerrar-modal');
  };

  useEffect(() => {
    const d = quickRef.current;
    if (!d) return;
    if (quick && !d.open) d.showModal();
    else if (!quick && d.open) d.close();
  }, [quick]);

  useEffect(() => {
    const d = bagRef.current;
    if (!d) return;
    if (bagOpen && !d.open) d.showModal();
    else if (!bagOpen && d.open) d.close();
  }, [bagOpen]);

  const outside = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) (e.currentTarget as HTMLDialogElement).close();
  };

  const countText = count === 1 ? c.item : fill(c.items, count);

  // Mensagem gerada para WhatsApp enviada em Português
  const order = [
    'Olá! Gostaria de efetuar este pedido através do site da Novavet Bragança:',
    '',
    ...rows.map(({line, p}) => `• ${line.qty} × ${p.es.name}${line.size ? ` (${line.size})` : ''} — ${money(priceOf(p, line.size) * line.qty)}`),
    '',
    `Total de referência: ${money(total)}`,
    ...(name.trim() ? [`Cliente: ${name.trim()}`] : []),
    `Entrega/Levantamento: ${COPY.es.pickups[pickup] || pickup}`,
    ...(note.trim() ? [`Observações: ${note.trim()}`] : []),
    '',
    'Poderiam confirmar a disponibilidade de stock e o total final? Muito obrigado!',
  ].join('\n');

  return (
    <div className="novavet-shop-page">
      {/* HERO DO CATÁLOGO DE PRODUTOS */}
      <section className="page-hero shop-hero">
        <div className="shop-hero-copy">
          <span className="eyebrow">
            <ShieldCheck size={15} />
            {c.eyebrow}
          </span>
          <h1>
            {c.title[0]}
            <br />
            <span>{c.title[1]}</span>
          </h1>
          <p>{c.body}</p>
          <div className="shop-hero-actions">
            <a className="button" href="#catalogo">
              {c.browse}
              <ArrowDown size={17} />
            </a>
            <a className="button outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={17} />
              {c.advice}
            </a>
          </div>
        </div>

        {/* VITRINE VISUAL DE PRODUTOS REAIS */}
        <div className="shop-hero-visual" aria-hidden="true">
          <div className="shop-hero-showcase">
            <div className="hero-product-pill pill-1">
              <img src={url('/images/products/cao-adulto-cordeiro.jpg')} alt="Alimento Cão" />
              <div className="hero-product-meta">
                <strong>Alimento Clínico Cão</strong>
                <span>Fórmula Veterinária</span>
              </div>
            </div>
            <div className="hero-product-pill pill-2">
              <img src={url('/images/products/alimento-borregos-crescimento.jpg')} alt="Ração Borregos" />
              <div className="hero-product-meta">
                <strong>Ração para Borregos</strong>
                <span>Saco 25 kg Pecuária</span>
              </div>
            </div>
            <div className="hero-product-pill pill-3">
              <img src={url('/images/products/desinfetante-instalacoes-pecuarias.jpg')} alt="Desinfetante DGAV" />
              <div className="hero-product-meta">
                <strong>Desinfetante Virucida</strong>
                <span>Registo Oficial DGAV</span>
              </div>
            </div>
            <div className="hero-badge-cert">
              <ShieldCheck size={18} />
              <span>PT 1 0124 CN · Distribuição Oficial</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 PILARES DE SERVIÇO TÉCNICO */}
      <ul className="shop-perks">
        {c.perks.map(([title, text], i) => {
          const Icon = [Stethoscope, MapPin, Truck, Sparkles][i];
          return (
            <li key={title}>
              <span>
                <Icon size={20} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* SECÇÃO PRINCIPAL DO CATÁLOGO INTERATIVO */}
      <section className="section shop-catalog" id="catalogo">
        <div className="section-title">
          <div>
            <span className="eyebrow">{c.catalogEyebrow}</span>
            <h2>
              {c.catalogTitle[0]}
              <br />
              <span>{c.catalogTitle[1]}</span>
            </h2>
          </div>
          <p>{c.catalogBody}</p>
        </div>

        {/* BARRA DE FERRAMENTAS E FILTROS */}
        <div className="shop-toolbar">
          <div className="shop-cats" role="group" aria-label={c.categories}>
            {CATEGORIES.map(([key, es, english]) => {
              const n = key === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === key).length;
              return (
                <button
                  type="button"
                  key={key}
                  className={cat === key ? 'active' : ''}
                  aria-pressed={cat === key}
                  onClick={() => setCat(key)}
                >
                  {en ? english : es}
                  <small>{n}</small>
                </button>
              );
            })}
          </div>

          <div className="shop-tools">
            <div className="shop-species" role="group" aria-label={c.speciesName}>
              {['all', 'dog', 'cat', 'sheep', 'cattle', 'horse'].map(s => (
                <button
                  type="button"
                  key={s}
                  className={species === s ? 'active' : ''}
                  aria-pressed={species === s}
                  onClick={() => setSpecies(s)}
                >
                  {c.species[s] || s}
                </button>
              ))}
            </div>
            <label className="shop-sort">
              <span>{c.sort}</span>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {Object.entries(c.sorts).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>

        <p className="shop-count" aria-live="polite">
          {list.length === 1 ? c.result : fill(c.results, list.length)}
        </p>

        {/* GRELHA DE PRODUTOS PROFISSIONAL */}
        {list.length ? (
          <div className="shop-grid">
            {list.map(p => (
              <Card
                key={p.id}
                p={p}
                c={c}
                en={en}
                cat={catOf(p)}
                species={speciesOf(p)}
                done={just === p.id}
                onAdd={add}
                onQuick={openQuick}
              />
            ))}
          </div>
        ) : (
          <div className="shop-none">
            <ShoppingBag size={48} />
            <p>{c.empty}</p>
            <button
              className="button outline small"
              onClick={() => {
                setCat('all');
                setSpecies('all');
              }}
            >
              {c.reset}
            </button>
          </div>
        )}
      </section>

      {/* SECÇÃO DOS KITS / PACKS TÉCNICOS */}
      <section className="shop-kits">
        <div className="shop-kits-head">
          <span className="eyebrow">{c.kitsEyebrow}</span>
          <h2>
            {c.kitsTitle[0]} <em>{c.kitsTitle[1]}</em>
          </h2>
          <p>{c.kitsBody}</p>
        </div>
        <div className="shop-kits-grid">
          {KITS.map(k => {
            const t = en ? k.en : k.es;
            const value = kitValue(k);
            const price = k.sizes[0].price;
            return (
              <article className="kit-card" key={k.id}>
                <div className="kit-media">
                  <div className="kit-products-preview">
                    {(k.includes || []).map(([id], idx) => {
                      const p = findProduct(id);
                      if (!p || !p.image) return null;
                      return (
                        <div key={id} className={`kit-preview-thumb thumb-${idx}`}>
                          <img src={url(p.image)} alt={nameOf(p)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="kit-body">
                  <span className="eyebrow">{t.short}</span>
                  <h3>{t.name}</h3>
                  <p>{t.text}</p>
                  <h4>{c.includes}</h4>
                  <ul>
                    {(k.includes || []).map(([id, size]) => {
                      const pr = findProduct(id);
                      if (!pr) return null;
                      return (
                        <li key={id}>
                          <Check size={14} />
                          <span>{nameOf(pr)}</span>
                          <small>{size}</small>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="kit-foot">
                    <div className="kit-price">
                      <s>{money(value)}</s>
                      <strong>{money(price)}</strong>
                      <span>{fill(c.save, money(value - price))}</span>
                    </div>
                    <button
                      className={'button' + (just === k.id ? ' done' : '')}
                      onClick={() => add(k, '')}
                    >
                      {just === k.id ? (
                        <>
                          <Check size={17} />
                          {c.added}
                        </>
                      ) : (
                        <>
                          {c.addKit}
                          <Plus size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* REGULAÇÃO E INFORMAÇÃO DGAV DE MEDICAMENTOS VETERINÁRIOS */}
      <section className="section shop-meds">
        <span className="shop-meds-icon">
          <Pill size={32} />
        </span>
        <div>
          <span className="eyebrow">{c.medsEyebrow}</span>
          <h2>{c.medsTitle}</h2>
          <p>{c.medsBody}</p>
        </div>
        <div className="shop-meds-actions">
          <a className="button" href={`tel:${PHONE}`}>
            <CalendarDays size={17} />
            {c.medsCta}
          </a>
          <a className="button outline" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            {c.medsAlt}
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      {/* BOTÃO FLUTUANTE DO CARRINHO */}
      {count > 0 && (
        <button
          key={bump}
          className={'shop-fab' + (bump ? ' bump' : '')}
          onClick={openBag}
          aria-label={`${c.open} · ${countText}`}
        >
          <ShoppingBag size={20} />
          <span>
            {c.bag} · {money(total)}
          </span>
          <b>{count}</b>
        </button>
      )}

      <p className="sr-only" role="status">
        {announce}
      </p>

      {/* DIÁLOGO MODAL DE VISTA RÁPIDA */}
      <dialog
        ref={quickRef}
        className="modal shop-quick"
        onClose={() => setQuick(null)}
        onClick={outside}
        aria-label={quick ? nameOf(quick.p) : c.quick}
      >
        {quick && (
          <QuickView
            quick={quick}
            c={c}
            en={en}
            cat={catOf(quick.p)}
            species={speciesOf(quick.p)}
            done={just === quick.p.id}
            onChange={setQuick}
            onAdd={add}
            onClose={closeQuick}
          />
        )}
      </dialog>

      {/* MODAL / DRAWER DA ENCOMENDA PARA WHATSAPP */}
      <dialog
        ref={bagRef}
        className="modal shop-bag"
        onClose={() => setBagOpen(false)}
        onClick={outside}
        aria-label={c.bag}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">{c.bag}</span>
            <h2>{countText}</h2>
          </div>
          <button className="modal-close icon-button" onClick={closeBag} aria-label={c.close}>
            <X />
          </button>
        </div>

        {sent ? (
          <div className="shop-sent">
            <span className="shop-sent-check">
              <Check size={32} />
            </span>
            <h3>{c.sentTitle}</h3>
            <p>{c.sentBody}</p>
            <button className="button outline" onClick={() => setSent(false)}>
              {c.back}
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="shop-empty">
            <ShoppingBag size={48} />
            <h3>{c.emptyBag}</h3>
            <p>{c.emptyBagBody}</p>
            <button className="button" onClick={closeBag}>
              {c.keep}
            </button>
          </div>
        ) : (
          <>
            <ul className="shop-lines">
              {rows.map(({line, p}) => (
                <li key={line.id + line.size}>
                  <span className="shop-line-art">
                    {p.image ? (
                      <img src={url(p.image)} alt={nameOf(p)} className="shop-line-img" />
                    ) : (
                      <ProductArt art={p.art} color={p.color} accent={p.accent} label={(en ? p.en : p.es).label} />
                    )}
                  </span>
                  <div>
                    <strong>{nameOf(p)}</strong>
                    {line.size && <small>{line.size}</small>}
                    <Stepper qty={line.qty} c={c} set={n => setCart(setQty(cart, line, n))} />
                  </div>
                  <div className="shop-line-end">
                    <strong>{money(priceOf(p, line.size) * line.qty)}</strong>
                    <button onClick={() => setCart(setQty(cart, line, 0))} aria-label={`${c.remove}: ${nameOf(p)}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shop-checkout">
              <div className="shop-total">
                <span>{c.total}</span>
                <strong>{money(total)}</strong>
              </div>
              <label className="shop-field">
                <span>
                  {c.name} <small>{c.optional}</small>
                </span>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={c.namePh}
                  autoComplete="name"
                  maxLength={80}
                />
              </label>
              <fieldset className="shop-field">
                <legend>{c.pickup}</legend>
                <div className="shop-pickups">
                  {Object.entries(c.pickups).map(([k, v]) => (
                    <button type="button" key={k} aria-pressed={pickup === k} onClick={() => setPickup(k)}>
                      {v}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="shop-field">
                <span>
                  {c.note} <small>{c.optional}</small>
                </span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={c.notePh}
                  maxLength={300}
                />
              </label>

              <a
                className="button full"
                href={`${WHATSAPP}?text=${encodeURIComponent(order)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setTimeout(() => setSent(true), 60);
                  playSound('enviado-con-exito');
                }}
              >
                <MessageCircle size={18} />
                {c.send}
              </a>
              <button className="text-button shop-clear" onClick={() => setCart([])}>
                {c.clear}
              </button>
              <p className="micro">{c.fine}</p>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

function Card({p, c, en, cat, species, done, onAdd, onQuick}: {
  p: Product;
  c: typeof COPY.es;
  en: boolean;
  cat: string;
  species: string;
  done: boolean;
  onAdd: (p: Product, size: string) => void;
  onQuick: (p: Product, size: string) => void;
}) {
  const [size, setSize] = useState<string>(p.sizes[0].label);
  const t = en ? p.en : p.es;
  const price = priceOf(p, size);

  return (
    <article className="shop-card">
      <div className="shop-media" onClick={() => onQuick(p, size)}>
        {p.image ? (
          <img src={url(p.image)} alt={t.name} className="shop-card-img" loading="lazy" />
        ) : (
          <ProductArt art={p.art} color={p.color} accent={p.accent} label={t.label} />
        )}
        {p.badge && <span className={'shop-badge ' + p.badge}>{c.badges[p.badge]}</span>}
        <button
          className="shop-quick-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuick(p, size);
          }}
          aria-label={`${c.quick}: ${t.name}`}
        >
          <Eye size={15} />
          {c.quick}
        </button>
      </div>

      <div className="shop-card-body">
        <div className="shop-meta">
          <span>{cat}</span>
          <i>·</i>
          <span>{species}</span>
        </div>
        <h3 onClick={() => onQuick(p, size)} style={{cursor: 'pointer'}}>{t.name}</h3>
        <p className="shop-desc">{t.short}</p>

        {p.sizes.length > 1 && (
          <div className="shop-sizes" role="group" aria-label={c.size}>
            {p.sizes.map(s => (
              <button
                type="button"
                key={s.label}
                aria-pressed={size === s.label}
                onClick={(e) => {
                  e.stopPropagation();
                  setSize(s.label);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="shop-card-foot">
          <div className="shop-price-wrap">
            <span className="shop-price">{money(price)}</span>
            <small className="shop-vat">IVA inc.</small>
          </div>
          <button
            type="button"
            className={'shop-add-btn' + (done ? ' done' : '')}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(p, size);
            }}
            aria-label={`${c.add} ${t.name}`}
          >
            {done ? (
              <>
                <Check size={16} />
                <span>{c.added}</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>{c.add}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function QuickView({quick, c, en, cat, species, done, onChange, onAdd, onClose}: {
  quick: {p: Product, size: string, qty: number};
  c: typeof COPY.es;
  en: boolean;
  cat: string;
  species: string;
  done: boolean;
  onChange: (q: {p: Product, size: string, qty: number}) => void;
  onAdd: (p: Product, size: string, qty: number) => void;
  onClose: () => void;
}) {
  const {p, size, qty} = quick;
  const t = en ? p.en : p.es;
  const price = priceOf(p, size);

  return (
    <div className="shop-quick-grid">
      <button className="modal-close icon-button" onClick={onClose} aria-label={c.close}>
        <X />
      </button>
      <div className="shop-quick-media">
        {p.image ? (
          <img src={url(p.image)} alt={t.name} className="shop-quick-img" />
        ) : (
          <ProductArt art={p.art} color={p.color} accent={p.accent} label={t.label} />
        )}
        {p.badge && <span className={'shop-badge ' + p.badge}>{c.badges[p.badge]}</span>}
      </div>
      <div className="shop-quick-body">
        <span className="eyebrow">
          {cat} · {species}
        </span>
        <h2>{t.name}</h2>
        <p className="shop-quick-lead">{t.text}</p>
        <ul className="shop-points">
          {t.points.map((pt, i) => (
            <li key={i}>
              <Check size={14} />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        {p.sizes.length > 1 && (
          <div className="shop-quick-sizes">
            <span className="field-label">{c.size}</span>
            <div className="shop-sizes">
              {p.sizes.map(s => (
                <button
                  type="button"
                  key={s.label}
                  aria-pressed={size === s.label}
                  onClick={() => onChange({...quick, size: s.label})}
                >
                  {s.label} · {money(s.price)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="shop-quick-buy">
          <Stepper qty={qty} c={c} set={n => onChange({...quick, qty: Math.max(1, n)})} />
          <strong className="shop-quick-price">{money(price * qty)}</strong>
          <button
            type="button"
            className={'button full' + (done ? ' done' : '')}
            onClick={() => {
              onAdd(p, size, qty);
              setTimeout(onClose, 450);
            }}
          >
            {done ? (
              <>
                <Check size={18} />
                {c.added}
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                {c.addToOrder}
              </>
            )}
          </button>
        </div>
        <p className="micro">{c.pickupNote}</p>
      </div>
    </div>
  );
}

function Stepper({qty, c, set}: {qty: number, c: typeof COPY.es, set: (n: number) => void}) {
  return (
    <div className="stepper" role="group" aria-label={c.qty}>
      <button onClick={() => set(Math.max(1, qty - 1))} aria-label={c.less} disabled={qty <= 1}>
        <Minus size={13} />
      </button>
      <span aria-live="polite">{qty}</span>
      <button onClick={() => set(qty + 1)} aria-label={c.more}>
        <Plus size={13} />
      </button>
    </div>
  );
}
