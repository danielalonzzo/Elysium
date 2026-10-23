# Veterinaria Villalobos — prototipo

Nació como duplicado del prototipo de la Clínica Veterinaria Dr. Luis Valladares
(`Prototipos/Vet-Dr-Valladares/clinica/`) para Villalobos Servicios
Veterinarios: cuatro sedes en Heredia (Santa Cecilia, San Lorenzo, Santa Lucía y
San Francisco), WhatsApp +506 8663 3832, drs.villalobos@hotmail.com. **El
material es de la clínica real**, como en Valladares; no es una marca ficticia.

**Las dos clínicas son vecinas y competidoras: no pueden parecerse.** En octubre
de 2026 Villalobos se rediseñó entera como casa premium de cuatro sedes. Lo que
la separa de Valladares (crema, verde y azul, Georgia, tarjetas de colores,
píldoras, dock central) es deliberado; no se copia nada de allá sin rehacerlo.

Lo que no se ve abriéndolo:

1. **Los datos de la clínica viven en `src/core/config.ts`** (`SEDES`,
   `services`, contacto y redes). Solo se publica lo que la clínica publica: San
   Lorenzo y San Francisco no tienen dirección conocida y su enlace busca la sede
   en Google Maps; el único horario publicado (Google) es el de Santa Cecilia.
2. **`node_modules` es una carpeta real, no un enlace a `.nosync`.** Con el
   enlace, vinext carga dos veces sus módulos (ruta del enlace y ruta real), el
   layout pierde su contexto y la página sale en blanco sin ningún error. Para
   que iCloud no la sincronice lleva el atributo
   `xattr -w 'com.apple.fileprovider.ignore#P' 1 node_modules`. Tras un
   `npm ci` que la borre y la vuelva a crear, hay que ponérselo otra vez.
3. **La identidad vive en `app/villalobos.css`**, que va después de
   `globals.css` (la base heredada de Valladares, que aún usan herramientas,
   agenda y paneles). Noir y porcelana con el rojo y el grafito de los paneles
   del emblema; Cormorant Garamond y Jost, como las dos líneas del rótulo de su
   unidad móvil, autoalojadas en `app/fonts/` (licencia OFL) porque la CSP de
   Elysium no deja cargar nada de fuera; curvas contenidas (`--radius` y sus
   hermanas). El emblema en vector es `src/ui/Emblem.tsx`, sacado del trazado
   de `public/favicon.svg`.
4. **Emblema 3D y mascota salen de Blender**: `npm run logo3d:build` calca las
   dos siluetas de `public/images/logo-full.jpg` y `npm run mascot:build` genera
   la mascota: un Maine Coon gris atigrado (el gato del panel rojo del logo) que
   vive sobre el botón de atención directa y le da la vuelta como a un planeta
   (`src/ui/mascotEngine.js`; la rutina, en `src/core/mascot.js`). Sus gestos son
   de gato: asearse, perseguirse la cola, acechar y saltar, estirarse; nada de
   necesidades. Una prueba cruza lo que pide la rutina con las animaciones que
   graba el script. En el móvil el botón es un círculo y el gato se queda encima.
   Los `.py` están en el `.gitignore` de Elysium: se añaden con `git add -f`.
5. **El cursor es de la casa** (`src/core/magicMouse.ts`, decisiones puras en
   `cursor.mjs`): punto y aro en fusión «diferencia», que sobre lo que tenga
   `data-cursor="Ver"` se vuelve un disco rojo con la acción. Viene encendido y
   se apaga en Ajustes; no sale en pantallas táctiles ni con movimiento reducido.
6. **El service worker solo se registra en producción** y sirve las páginas
   desde la red (la caché, solo sin conexión). Antes servía primero lo cacheado:
   tras el rediseño, las páginas viejas pedían componentes que ya no existen. Si
   se vuelve a cambiar la estructura, sube `CACHE` en `public/sw.js`.
7. **Compilación estática para Elysium:**
   `NEXT_PUBLIC_STATIC_SITE=1 NEXT_PUBLIC_BASE_PATH=/Vet-Villalobos npm run build`.
   Igual que en Valladares, portal, CRM y citas abren en modo demostración y los
   formularios dejan el mensaje listo en WhatsApp. Todavía no hay script de
   publicación ni carpeta `/Vet-Villalobos/` en la raíz del sitio.
8. **En local**, el servidor de desarrollo va en el puerto 5174
   (`.claude/launch.json`), para no chocar con el de Valladares en el 5173.

---

# vinext-starter

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` only when the profile is unknown for the current checkout and environment. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
