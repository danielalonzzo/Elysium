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

Las rutas `/api/*` se reenvían al mismo `ELYSIUM_API_ORIGIN` configurado en
`wrangler.jsonc` (o a la variable de entorno homónima). De esta forma agenda,
correo y archivos R2 funcionan en localhost con la sesión real de Firebase.

Uso:  python3 scripts/serve-local.py [puerto]
"""
import fnmatch
import functools
import http.server
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
NATIONAL_LANGUAGES = {"es", "pt"}
TRANSLATION_LANGUAGES = {"en", "es", "pt"}
REGIONAL_LANDINGS = {
    "infraestructura-digital-pymes-costa-rica",
    "infraestructura-digital-pymes-espana",
    "infraestrutura-digital-pme-portugal",
}


def platform_api_origin():
    """Usa el mismo backend configurado para el Worker, sin duplicar secretos."""
    configured = os.environ.get("ELYSIUM_API_ORIGIN", "").strip().rstrip("/")
    if configured:
        return configured
    wrangler = ROOT / "wrangler.jsonc"
    if not wrangler.is_file():
        return ""
    match = re.search(
        r'"ELYSIUM_API_ORIGIN"\s*:\s*"(https://[^"/]+(?:/[^\"]*)?)"',
        wrangler.read_text(encoding="utf-8"),
    )
    return match.group(1).rstrip("/") if match else ""


API_ORIGIN = platform_api_origin()
HOP_BY_HOP_HEADERS = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "host", "content-length",
}


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
    def do_POST(self):
        self._proxy_api_or_404()

    def do_PATCH(self):
        self._proxy_api_or_404()

    def do_PUT(self):
        self._proxy_api_or_404()

    def do_OPTIONS(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api" or path.startswith("/api/"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "*"))
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key")
            self.send_header("Access-Control-Max-Age", "86400")
            self.send_header("Content-Length", "0")
            self.end_headers()
        else:
            self.send_response(204)
            self.send_header("Allow", "GET, HEAD, OPTIONS")
            self.send_header("Content-Length", "0")
            self.end_headers()

    def send_head(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        def local_target(target_path, updates=None, remove=()):
            updates = updates or {}
            pairs = [
                (key, value)
                for key, value in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
                if key not in updates and key not in remove
            ]
            pairs.extend((key, value) for key, value in updates.items())
            encoded = urllib.parse.urlencode(pairs)
            return target_path + (("?" + encoded) if encoded else "")

        if path == "/api" or path.startswith("/api/"):
            self._proxy_api_or_404()
            return None
        if path == "/__i18n":
            return self._serve_translation_source(query)
        if path == "/_national" or path.startswith("/_national/"):
            self.send_error(404, "Private national asset")
            return None

        national = query.get("national", [""])[0]
        slug = self._canonical_slug(path)

        # Igual que el Worker: estos aliases deben fijar inglés europeo antes
        # de volver a `/`, o una geolocalización posterior podría deshacer la
        # elección explícita del usuario.
        if not national and slug in {"en", "en/index"}:
            return self._redirect(local_target("/", {
                "lang": "en", "region": "EU", "override": "true"
            }))

        if slug in {"p", "es/p", "pt/p", "en/p"}:
            suffix = "/portfolio"
            if not national and slug.startswith(("es/", "pt/")):
                suffix = "/" + slug.split("/", 1)[0] + suffix
            requested_language = slug.split("/", 1)[0] if "/" in slug else ""
            updates = {}
            remove = ()
            if national and requested_language in TRANSLATION_LANGUAGES:
                if requested_language == national:
                    remove = ("lang",)
                else:
                    updates["lang"] = requested_language
            return self._redirect(local_target(suffix, updates, remove))
        if national in NATIONAL_LANGUAGES and slug == "prototype-selva-y-sal":
            return self._redirect(local_target("/portfolio"))

        landing = slug.rsplit("/", 1)[-1] if slug else ""
        if landing in REGIONAL_LANDINGS:
            if landing == "infraestructura-digital-pymes-costa-rica":
                if path.rstrip("/").startswith("/es/") and not national:
                    pass
                else:
                    return self._redirect(local_target("/es/" + landing, remove=("national", "lang")))
            else:
                target_national = "es" if landing.endswith("-espana") else "pt"
                return self._redirect(local_target("/", {"national": target_national}))

        # En preview, `?national=es|pt` representa el host nacional. Un prefijo
        # viejo se canoniza al mismo path y comunica el idioma por query, sin
        # saltar de región ni perder la página.
        if national in NATIONAL_LANGUAGES:
            prefixed = re.fullmatch(r"(en|es|pt)(?:/(.*))?", slug or "")
            if prefixed:
                requested_language, rest = prefixed.groups()
                target_path = "/" + (rest or "")
                if requested_language == national:
                    return self._redirect(local_target(target_path, remove=("lang",)))
                return self._redirect(local_target(target_path, {"lang": requested_language}))

        if national in NATIONAL_LANGUAGES:
            national_file = self._html_candidate(ROOT / "_national" / national, path)
            if national_file:
                return self._serve(national_file)
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

    @staticmethod
    def _canonical_slug(raw_path):
        decoded = urllib.parse.unquote(raw_path or "/")
        if "\\" in decoded or "\x00" in decoded:
            return None
        pieces = [piece for piece in decoded.split("/") if piece]
        if any(piece in {".", ".."} for piece in pieces):
            return None
        slug = "/".join(pieces)
        if slug.endswith(".html"):
            slug = slug[:-5]
        if slug == "index":
            slug = ""
        return slug.rstrip("/")

    @classmethod
    def _html_candidate(cls, base, raw_path):
        slug = cls._canonical_slug(raw_path)
        if slug is None:
            return None
        candidate = base / (slug + ".html" if slug else "index.html")
        try:
            candidate.resolve().relative_to(base.resolve())
        except ValueError:
            return None
        return candidate if candidate.is_file() else None

    def _serve_translation_source(self, query):
        language = query.get("lang", [""])[0]
        raw_path = query.get("path", [""])[0]
        if language not in TRANSLATION_LANGUAGES or not raw_path.startswith("/"):
            self.send_error(400, "Invalid translation request")
            return None

        slug = self._canonical_slug(raw_path)
        if slug is None:
            self.send_error(400, "Invalid translation path")
            return None
        if slug in REGIONAL_LANDINGS:
            self.send_error(404, "Regional landing has a canonical destination")
            return None

        base = ROOT if language == "en" else ROOT / language
        candidate = self._html_candidate(base, "/" + slug)
        if not candidate:
            self.send_error(404, "Translation source not found")
            return None
        return self._serve(candidate, content_type="text/html; charset=utf-8")

    def _proxy_api_or_404(self):
        path = urllib.parse.urlparse(self.path).path
        if path != "/api" and not path.startswith("/api/"):
            self.send_error(404, "API route not found")
            return
        if not API_ORIGIN:
            self.send_error(503, "ELYSIUM_API_ORIGIN is not configured")
            return

        content_length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(content_length) if content_length else None
        target = f"{API_ORIGIN}{self.path}"
        headers = {
            name: value for name, value in self.headers.items()
            if name.lower() not in HOP_BY_HOP_HEADERS
        }
        request = urllib.request.Request(target, data=body, headers=headers, method=self.command)
        try:
            upstream = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as error:
            upstream = error
        except Exception as error:
            self.send_error(502, f"Elysium API unavailable: {error}")
            return

        payload = b"" if self.command == "HEAD" else upstream.read()
        self.send_response(upstream.status)
        for name, value in upstream.headers.items():
            if name.lower() not in HOP_BY_HOP_HEADERS:
                self.send_header(name, value)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if payload:
            self.wfile.write(payload)

    def _redirect(self, location):
        self.send_response(307)
        self.send_header("Location", location)
        self.end_headers()
        return None

    def _serve(self, file_path, content_type=None):
        handle = open(file_path, "rb")
        self.send_response(200)
        self.send_header("Content-Type", content_type or self.guess_type(str(file_path)))
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
