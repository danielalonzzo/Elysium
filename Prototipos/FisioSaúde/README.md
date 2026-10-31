# FisioSaúde — protótipo

Website estático em português de Portugal, adaptado do projeto de referência autorizado, em modo de leitura:

`/Users/danielalonzzo/Library/Mobile Documents/com~apple~CloudDocs/λ/Paulo Morais/paulo-morais`

## Adaptação e reutilização

A composição `.hero-split`, as classes do cabeçalho e da navegação móvel, os tokens CSS, a tipografia Patron e os botões derivam da estrutura da referência. Os padrões de navegação móvel, estado do cabeçalho ao deslocar, revelação por IntersectionObserver e abertura/fecho de lightbox foram adaptados de `js/script.js`. Os diálogos nativos acrescentam gestão de foco e fecho por Escape. Não foram importados Firebase, contas, avaliações ou informação comercial de Paulo Morais.

## Executar

Sem dependências externas. Node.js serve e prepara a versão estática.

```sh
npm run dev
npm run check
npm run build
npm run preview
```

Porta por defeito: 4173. Para evitar conflitos de outros projetos, utilizar `PORT=4287 npm run preview`.

## Conteúdo e funcionamento

- A morada principal é Rua de Vale D’Álvaro, 30, 5300-274 Bragança. A antiga morada aparece apenas como histórico da mudança. As coordenadas da antiga morada não são usadas no mapa.
- Foram utilizados os contactos e horários fornecidos no pedido inicial. Os materiais têm horários diferentes; o horário deve ser confirmado pela clínica antes da publicação pública.
- Os quatro acordos do resumo inicial são apresentados com confirmação de cobertura. Saúde Global, Unisaúde e Ageas/Ocidental aparecem num painel de consulta, sem confirmação automática de convenção. As referências a Fisinor não foram usadas como identificação fiscal ou contacto da FisioSaúde.
- Os nomes e funções da equipa foram transcritos dos cartazes IMG_1223, IMG_1224, IMG_1225 e IMG_1226. Os retratos e o símbolo foram recortados desses materiais, sem imagens de pessoas geradas.
- A fotografia da entrada deriva de IMG_1212; o comunicado de mudança deriva de IMG_1222. Os originais permanecem na pasta e ficam fora do pacote `dist/`.
- Os serviços abrem painéis de informação. As marcações abrem um diálogo com telefone e email, com o serviço já selecionado. O email é preparado na aplicação do visitante; não existe confirmação automática de consulta, envio no servidor ou agenda clínica integrada.
- Não são utilizados cookies, analytics ou pedidos a serviços externos ao carregar a página. O mapa é uma ligação externa.
- O protótipo contém `noindex` no HTML, em `robots.txt` e nos cabeçalhos. A pasta `dist/` contém apenas os ficheiros necessários ao site.

## Publicação

A tentativa de criação de uma vista privada no serviço Sites devolveu erro interno. A consulta de Sites existentes não devolveu um projeto FisioSaúde; não foi repetida a criação nem foi publicado um URL fictício. Não existe identificador de Site ou configuração de produção associada a este protótipo.
