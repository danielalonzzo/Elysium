#!/usr/bin/env python3
"""
Servidor local que reproduce cómo Cloudflare Workers sirve el sitio.

`python3 -m http.server` no vale para probar Elysium: sirve los ficheros tal
cual, así que /about le da un 404 mientras que en producción es la URL buena.
Esa diferencia es justo la que dejó pasar el problema de indexación — el sitio
se veía bien en local con enlaces .html que en producción redirigían.

Aquí se replican las reglas de `html_handling: auto-trailing-slash`:

    /about        →  about.html
    /es/          →  es/index.html
    /es           →  307 a /es/
    /about.html   →  307 a /about

También se aplica el fichero `_headers`, incluidas las dos reglas del formato
de Cloudflare que importan para la CSP: los valores repetidos se unen con coma
(dos CSP se aplican como intersección) y «! Cabecera» desprende la heredada de
un bloque anterior. Sin esto, la política se probaría en producción.

Uso:  python3 scripts/serve-local.py [puerto]
"""
import fnmatch
import functools
import http.server
import os
import pathlib
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


def load_headers_rules():
    """Lee `_headers` como [(patrón, [(cabecera, valor|None)])]. None = desprender."""
    path = ROOT / "_headers"
    if not path.is_file():
        return []
    rules, pattern, entries = [], None, []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line[0].isspace():
            if pattern is not None:
                rules.append((pattern, entries))
            pattern, entries = line.strip(), []
        elif line.strip().startswith("! "):
            entries.append((line.strip()[2:].strip(), None))
        elif ":" in line:
            name, value = line.split(":", 1)
            entries.append((name.strip(), value.strip()))
    if pattern is not None:
        rules.append((pattern, entries))
    return rules


HEADER_RULES = load_headers_rules()


def headers_for(url_path):
    """Aplica las reglas en orden, uniendo repetidos con coma como hace Cloudflare."""
    applied = {}
    for pattern, entries in HEADER_RULES:
        if not fnmatch.fnmatch(url_path, pattern):
            continue
        for name, value in entries:
            key = name.lower()
            if value is None:
                applied.pop(key, None)
            elif key in applied:
                applied[key] = (applied[key][0], applied[key][1] + ", " + value)
            else:
                applied[key] = (name, value)
    return list(applied.values())


class CloudflareAssetsHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = urllib.parse.urlparse(self.path).path
        rel = urllib.parse.unquote(path).lstrip("/")

        # /about.html → /about   (Cloudflare quita la extensión)
        if rel.endswith(".html") and not rel.endswith("/index.html"):
            return self._redirect("/" + rel[: -len(".html")])
        if rel.endswith("/index.html") or rel == "index.html":
            return self._redirect("/" + rel[: -len("index.html")])

        if path.endswith("/") or rel == "":
            candidate = ROOT / rel / "index.html"
            if candidate.is_file():
                return self._serve(candidate)
            return super().send_head()

        target = ROOT / rel
        if target.is_file():
            return self._serve(target)
        if (ROOT / (rel + ".html")).is_file():
            return self._serve(ROOT / (rel + ".html"))
        if (ROOT / rel / "index.html").is_file():
            return self._redirect("/" + rel + "/")
        return super().send_head()

    def _redirect(self, location):
        self.send_response(307)
        self.send_header("Location", location)
        self.end_headers()
        return None

    def _serve(self, file_path):
        handle = open(file_path, "rb")
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(file_path)))
        self.send_header("Content-Length", str(os.fstat(handle.fileno()).st_size))
        for name, value in headers_for(urllib.parse.urlparse(self.path).path):
            self.send_header(name, value)
        self.end_headers()
        return handle


if __name__ == "__main__":
    handler = functools.partial(CloudflareAssetsHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Elysium en http://localhost:{PORT}  (reglas de Cloudflare)")
        httpd.serve_forever()
