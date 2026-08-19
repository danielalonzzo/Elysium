import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza la portada con noindex y módulos Elysium", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Selva y Sal \| Del volcán al mar<\/title>/i);
  assert.match(html, /name="robots" content="noindex, nofollow[^"]*"/i);
  assert.match(html, /Costa Rica/);
  assert.match(html, /Ver expediciones/);
  assert.match(html, /Entrar a la tienda/);
  assert.match(html, /Años/);
  assert.match(html, /elysium-preloader\.js/);
  assert.match(html, /f22-system-settings\.js/);
  assert.match(html, /v1\.0\.0 beta/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("resuelve rutas representativas del sitio", async () => {
  const routes = [
    ["/nosotros/", /Compromiso ambiental/],
    ["/tienda/", /Tienda[\s\S]*?Selva y Sal/],
    ["/mayoreo/", /Hecho en Costa Rica/],
    ["/expediciones/", /Nuestras expediciones/],
    ["/blog/", /La ruta del Arenal/],
    ["/contacto/", /Contacto/],
    ["/privacidad/", /Privacidad en este prototipo/],
    ["/terminos/", /Términos de uso/],
  ];
  for (const [path, expected] of routes) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected, path);
  }
});

test("las rutas inexistentes responden con el 404 propio", async () => {
  const response = await render("/ruta-inexistente/");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Este sendero no existe/);
});

/* La marca es ficticia a propósito: si algún día vuelve a colarse el nombre de
   un cliente en los datos, esta prueba es la que tiene que saltar. */
test("no queda rastro de ninguna marca de cliente", async () => {
  const [home, shop, about, article] = await Promise.all([
    render("/"),
    render("/tienda/"),
    render("/nosotros/"),
    render("/como-elegir-un-recuerdo-honesto/"),
  ]);
  const html = [await home.text(), await shop.text(), await about.text(), await article.text()].join("");
  assert.doesNotMatch(html, /regalarte/i);
  assert.doesNotMatch(html, /La Sele|Selección Nacional/i);
  assert.doesNotMatch(html, /assets\/uploads/i);
  assert.doesNotMatch(html, /wp-content|wa\.link|canva\.com/i);
});

test("la ficha de producto y los formularios quedan bien redactados", async () => {
  const [shop, contact, product] = await Promise.all([
    render("/tienda/"),
    render("/contacto/"),
    render("/product/expedicion-arenal-amanecer/"),
  ]);
  const html = `${await shop.text()}${await contact.text()}${await product.text()}`;
  assert.match(html, /Arenal al Amanecer/);
  assert.doesNotMatch(html, />Eviar</);
  assert.doesNotMatch(html, /SKU: N\/D/);
  assert.doesNotMatch(html, /Envió internacional/);
});
