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

test("renderiza el rediseño Regalarte con noindex y módulos Elysium", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Regalarte \| Costa Rica, para llevar<\/title>/i);
  assert.match(html, /name="robots" content="noindex, nofollow[^\"]*"/i);
  assert.match(html, /Costa Rica/);
  assert.match(html, /Comprar al detalle/);
  assert.match(html, /Comprar al por mayor/);
  assert.match(html, /Clientes en/);
  assert.match(html, /Cobertura/);
  assert.match(html, /elysium-preloader\.js/);
  assert.match(html, /f22-system-settings\.js/);
  assert.match(html, /v1\.0\.0 beta/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("resuelve rutas representativas del sitio rediseñado", async () => {
  const routes = [
    ["/nosotros/", /Compromiso Ambiental/],
    ["/tienda/", /Tienda[\s\S]*?Regalarte/],
    ["/mayoreo/", /Hecho en Costa Rica/],
    ["/la-sele/", /Productos Oficiales de La Sele/],
    ["/blog/", /Tucanes de Costa Rica/],
    ["/contacto/", /Contacto/],
    ["/privacidad/", /Privacidad en este prototipo/],
    ["/sample-page/", /Sample Page/],
  ];
  for (const [path, expected] of routes) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected, path);
  }
});

test("las rutas inexistentes responden con el 404 rediseñado", async () => {
  const response = await render("/ruta-inexistente/");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Este sendero no existe/);
});

test("corrige privacidad y conserva la redirección segura de JetWooBuilder", async () => {
  const privacy = await render("/?page_id=3");
  assert.ok([301, 307, 308].includes(privacy.status));
  assert.equal(new URL(privacy.headers.get("location"), "http://localhost").pathname, "/privacidad/");

  const jetWoo = await render("/?jet-woo-builder=producto");
  assert.ok([301, 307, 308].includes(jetWoo.status));
  assert.equal(new URL(jetWoo.headers.get("location"), "http://localhost").pathname, "/");
});

test("el rediseño elimina incidencias editoriales aprobadas", async () => {
  const [shop, contact, product] = await Promise.all([
    render("/tienda/"),
    render("/contacto/"),
    render("/product/jacket-impermeable-cr/"),
  ]);
  const html = `${await shop.text()}${await contact.text()}${await product.text()}`;
  assert.doesNotMatch(html, />Eviar</);
  assert.doesNotMatch(html, /SKU: N\/D/);
  assert.doesNotMatch(html, />Jacket</);
});
