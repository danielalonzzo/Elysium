# 3VET Saúde Animal (`Vet-3VET`)

Protótipo (web pública PWA, agenda online, área do tutor e CRM de demonstração)
preparado por Elysium para oferecer os seus serviços à **3VET Saúde Animal**: o
Centro Veterinário Dr. Nuno Morais (Macedo de Cavaleiros) e a Clínica
Veterinária de Mirandela.

## De onde sai cada dado

Nada da web pública se inventa. Cada facto vem do material da própria clínica:

| Dado | Fonte |
|---|---|
| Três veterinários e a linha de cada um (Dr. Nuno Morais 963 057 504, Dra. Ália Santos 917 788 992, Dr. Francisco Morais 961 544 749) | Cartão da clínica, publicação do Instagram de 21/09/2025 |
| Urgências 24 h e as três linhas | Cartel da fachada de Mirandela (`public/images/3vet/banner-mirandela.jpg`) |
| Duas moradas e as espécies 🐕🐈🐄🐖🐑🐐 | Biografia do Instagram `@3vet_macedo.mirandela` |
| Horário de Mirandela, coordenadas, 4,8 ★ (28 críticas) e a crítica citada | Ficha do Google Maps (consultada a 18/11/2026) |
| Macedo verde com gato, Mirandela laranja com cão | Foto de perfil do Instagram |

**Por confirmar com a clínica antes de publicar** (em `src/core/config.ts` estão a
`null` e a web não os mostra): número de registo DGAV, razão social, NIF, correio
eletrónico, web própria e o horário de Macedo de Cavaleiros. Os serviços são os
gerais de uma clínica mista; não se prometem técnicas que a 3VET não publica.

A versão anterior deste protótipo era uma cópia da Novavet (Bragança) com outro
nome: inventava um registo DGAV, uma «Lda.», um correio, o Cheque Veterinário
OMV e citava o Dr. Luís Afonso. Isso foi retirado dos textos públicos, das
ferramentas, do CRM de demonstração, do manifesto e do `llms.txt`.

## Identidade

- **O «3»**: três tramos — naranja (#ef7d1f) em cima, o ponto amarelo de união
  (#f2d21b) e verde petróleo (#11a9a0 → #13a3cf) em baixo. Na web, cada tramo é um
  veterinário (pela ordem do cartão).
- **VET**: amarelo → mostarda (#f6c312 → #b98f10), terminais redondos.
- **Gato e cão de traço** em amarelo ouro (#e7ac12).
- **Cartel**: laranja #f39323 com rotulação condensada em branco.
- **Degradado do perfil e do cartão**: verde #79b843 → amarelo → laranja #f08b24.
- Tipografia: **Nunito** (redonda, como VET) e **Barlow Semi Condensed** (a
  rotulação do cartel e do cartão; «Saúde Animal» é tipo DIN).
- Tom: próximo, de bairro e de quinta, sem pompa. Português de Portugal, de você.

## Emblema 3D (Blender)

Mesmo método que o protótipo da Clínica Valladares, com geometria e gestos
próprios:

```bash
npm run logo3d:build
```

`scripts/logo3d/build_logo.py` calca o cartel com marching squares (o «3» separa-se
em três peças por cor, V-E-T por letra, o gato e o cão nas suas peças: cabeça,
olhos, focinho, bigodes), compõe «Saúde Animal» em DIN Alternate Bold no espaço
exato do cartel, tira a cor de cada vértice do próprio cartel e escreve:

- `public/models/3vet-logo-3d.glb` e `.json` (peças, centros, caixas e contornos);
- `public/images/3vet/3vet-{lockup,wordmark,mark,pets}.svg` (o mesmo calco em vetor:
  cabeçalho, favicon, ícones);
- `scripts/logo3d/3vet-logo-3d.blend` e o render de controlo.

`src/ui/heroLogoEngine.js` monta-o com three.js. Gestos: o «3» separa os seus três
tramos (três veterinários), VET bate duas vezes com um eletrocardiograma
(urgências 24 h), o gato pisca e mexe os bigodes, o cão sorri e ladra. Com os
quatro, o gato e o cão aproximam-se e sobe um coração com o degradado da marca.

Ícones PWA (`public/icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`) saem de
`3vet-mark.svg`.

## Mascote da dock

O cão de traço do logótipo, em 3D, vive na dock (o botão mágico) e passeia pelo
seu contorno: come, bebe, senta-se, dorme e faz truques quando lhe tocam. Corpo
branco-nata, orelhas caídas e ponta da cauda em ouro, contorno em ouro como o
desenho e coleira laranja com a chapa tricolor do «3».

```bash
npm run mascot:build -- --preview /tmp/3vet-dog
```

`scripts/mascot/build_mascot.py` gera `public/mascot/3vet-dog.glb` (esqueleto e
18 animações). O método, o motor (`src/ui/mascotEngine.js`) e o diretor de
comportamento (`src/core/mascot.js`, com testes: `node --test src/core/mascot.test.js`)
vêm da mascote de Pura Vida Pets, também de Elysium; o cão é outro. O motor só se
carrega com a primeira interação do visitante (`src/ui/DockMascot.tsx`).

## Módulos

1. **Web pública** (`/` e `/en`): equipa, cartel de urgências, duas clínicas,
   serviços, ferramentas (orientador de sintomas, check-up, mitos) e contacto.
2. **Agenda online** (`/citas`), fuso `Europe/Lisbon`.
3. **Área do tutor** (`/portal`) e **CRM** (`/crm`): demonstração com dados fictícios.

## Arranque

```bash
npm run dev
```
