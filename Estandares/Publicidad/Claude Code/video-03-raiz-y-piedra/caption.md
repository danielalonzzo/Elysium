# Texto del post · Raíz y Piedra

Para las tres piezas. Cuenta: @elysium.dr

**Ángulo:** el mismo que en `../video-02-selva-y-sal/caption.md`. No es el
lanzamiento de un cliente —«Raíz y Piedra» no existe— sino un diseño del
catálogo de Elysium, disponible para adquirir y adaptar dentro de una
suscripción y sin coste de desarrollo. Ahí la ficción deja de ser un pero y pasa
a ser el argumento: el diseño está vacío de marca *a propósito*, para que entre
la del cliente.

Lo que distingue a esta pieza de la de Selva y Sal es el **3D generado por
código**: no hay ni un modelo ni una textura en disco. El árbol, la esfera y las
ochenta cartas se construyen en el navegador. Es lo más difícil de copiar y por
tanto lo que conviene decir primero.

---

## Versión principal

Adaptada de la de Selva y Sal, conservando sus cinco tiempos: presentación,
quién lo hizo y qué es, por qué la marca está inventada, cómo se contrata y el
enlace.

Presenting "Raíz y Piedra": available to adopt.

Designed and developed by @elysium.dr, this is a complete brand build: a
scroll-driven cinematic in four acts, a twelve-piece collection with search,
filters and product pages, light and dark, and a procedural 3D world — a
guanacaste tree, a Diquís stone sphere and the eighty cards that scatter out of
it — rendered live in the browser. No models, no textures: not one 3D file on
disk.

The brand on screen is invented on purpose. Names, prices and artwork are ours,
so the whole thing is yours to rebrand: the content lives as data and gets
replaced without touching the interface.

It comes on subscription, with no development cost. You pay a monthly fee and we
build it, launch it, host it and keep improving it.

Explore the full project: https://elysiumdr.eu/Demo-arbol/

#webdesign #uxui #websitedesign #webdevelopment #creativecoding #threejs
#reactthreefiber #nextjs #generativeart #3dweb #costarica #elysiumlambda

---

## Versión en español

Presentamos «Raíz y Piedra»: listo para adoptar.

Diseñado y desarrollado por @elysium.dr: una cinemática de cuatro actos movida
por el scroll, una colección de doce piezas con buscador, filtros y fichas de
producto, modo claro y oscuro, y un mundo 3D generado por código —un guanacaste,
una esfera de piedra del Diquís y las ochenta cartas que salen de ella— dibujado
en el navegador. Ni un modelo ni una textura: ningún archivo 3D en disco.

La marca que se ve está inventada a propósito. Los nombres, los precios y las
ilustraciones son nuestros, así que todo está listo para revestirse: el
contenido vive como datos y se sustituye sin tocar la interfaz.

Va por suscripción y sin coste de desarrollo. Se paga una cuota y nosotros lo
construimos, lo publicamos, lo alojamos y lo seguimos mejorando.

El proyecto completo: https://elysiumdr.eu/Demo-arbol/

---

## Qué cambió respecto al texto de Selva y Sal, y por qué

| Selva y Sal | Raíz y Piedra | Motivo |
|---|---|---|
| «complete commerce build» | «complete brand build» | aquí no hay comercio: los pedidos salen por WhatsApp |
| «88-product catalogue» | «twelve-piece collection» | son doce productos |
| «cart and checkout» | *fuera* | no existen, ni simulados |
| «separate journeys for retail, wholesale and expeditions» | «a scroll-driven cinematic in four acts» | es lo que esta pieza tiene y aquella no |
| «a procedural 3D coast» | «a procedural 3D world… not one 3D file on disk» | el argumento más fuerte de esta demo, y conviene decirlo explícito |
| «blog, forms» | *fuera* | no los lleva |

## Variante corta (Stories)

Raíz y Piedra — a design you can take.

A tree, a stone sphere and eighty cards, all generated in the browser. Not one
3D file on disk. The brand is invented so yours fits in its place.

On subscription. No development cost. Built by @elysium.dr

---

## Tres cosas que hay que resolver antes de publicar

**1 · El enlace.** La demo se sirve en `elysiumdr.eu/Demo-arbol/`, pero está
marcada `noindex, nofollow` por cuatro vías —metadata, `public/robots.txt`, el
`Disallow` del `robots.txt` de la raíz y la cabecera `X-Robots-Tag` del bloque
`/Demo-arbol/*` de `_headers`—. La dirección funciona si se pega, así que sirve
para una story con enlace; lo que no conviene es escribirla como reclamo en un
pie que se indexa. Si esta pieza va a tener enlace permanente, lo suyo es una
página pública del tipo `elysiumdr.eu/disenos/raiz-y-piedra`, como se apuntó
para Selva y Sal.

Además, «Demo-arbol» es un nombre de carpeta heredado, no un nombre de producto,
y en este repositorio la carpeta **es** la dirección: renombrarla cambia la URL
pública y arrastra `_headers`, `robots.txt`, `.gitattributes`, el script de
publicación y la tarjeta de `admin.html`.

**2 · Aquí no hay checkout, y no debe insinuarse.** Selva y Sal al menos
simulaba carrito y checkout. Esta demo no: los pedidos salen por WhatsApp y no
hay carrito ni pasarela. Por eso el texto dice «tienda con buscador, filtros y
fichas» y en ningún momento «comercio electrónico», «carrito» ni «pagos». Si se
adopta y se le conecta comercio, ese día cambia la frase.

**3 · Ningún plan publicado se puede nombrar.** Igual que en Selva y Sal: la
Cláusula 3 del contrato de suscripción describe planes en términos de agenda y
profesionales, no de catálogo. El texto dice «por suscripción, sin coste de
desarrollo» y no nombra plan a propósito.

---

## Lo que NO se puede decir

- Que «Raíz y Piedra» sea un cliente, un caso real o un proyecto entregado.
- Que los productos, precios o contactos existan. Ninguno es real y todos los
  enlaces cuelgan de `raizypiedra.cr`, un dominio ficticio que no resuelve.
- Que haya comercio electrónico, carrito o pagos.

Lo que **sí** es cierto y conviene mantener exacto, porque es patrimonio real:
el guanacaste (*Enterolobium cyclocarpum*) es el árbol nacional de Costa Rica
desde 1959, las esferas del Diquís son de gabro y son Patrimonio Mundial desde
2014, y Finca 6 —cuyas coordenadas aparecen en pantalla, 8.9436° N · 83.4939° O—
es el sitio arqueológico donde están en su alineación original.
