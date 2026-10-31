# Tools: implementation and launch status

Prepared on 29 October 2026. Changes are local; production publication and Google indexing have not been verified.

## Public routes

| Language | Catalogue | Video downloader | PDF placeholder |
|---|---|---|---|
| English | `/tools/` | `/tools/video-downloader/` | `/tools/pdf-editor/` |
| Spanish | `/es/tools/` | `/es/tools/video-downloader/` | `/es/tools/pdf-editor/` |
| Portuguese | `/pt/tools/` | `/pt/tools/video-downloader/` | `/pt/tools/pdf-editor/` |

The canonical origin is `https://elysiumdr.eu`. National domains redirect Tools to the matching language on that origin. Pages render their complete text in HTML without JavaScript. Each page supplies a canonical URL, reciprocal language alternates, title, description, social metadata and breadcrumb structured data. The catalogue uses CollectionPage and ItemList. No operational SoftwareApplication or fabricated ratings are published.

Tools links appear in the existing main navigation and footer across the regional site. The catalogue also links to future tools without creating empty URLs.

## Verified capability boundaries

The video engine analyses links, lists source formats, downloads MP4 video and MP3/M4A audio, selects individual videos from collections, reports progress and queue position, and supports cancellation. All valid source resolutions from 64 through 4320 pixels on the short side are now offered, replacing the previous four-resolution cap. No upscaling is claimed. Default limits are 1 GB per file, two concurrent downloads and 15-minute file availability, subject to earlier removal when storage is full. Platform compatibility depends on the source and server conditions.

The downloader currently uses administrator authentication. Public anonymous access is not implemented or enabled by these changes. The local Worker configuration has no `ELYSIUM_TOOLS_ORIGIN`; the configured API will return `tools_not_configured` until that service origin is supplied. `backend/tools/README.md` documents the existing private service deployment.

The PDF editor is only a disabled CRM tab. Its public page is `noindex, follow`, is excluded from the sitemap and makes no claims about editing, merging, compression or conversion. Remove that exclusion only when a functional public editor exists.

The user requested a free public service without advertisements. Pages identify that as the intended public offering while clearly recording the current access restriction. Do not change the copy to claim anonymous availability until the access path actually works.

## Discovery

The root sitemap includes the six indexable Tools routes with reciprocal language alternates. Existing robots rules allow the pages for Google and the configured AI crawlers; no additional Allow rules are needed. Root, localized and regional `llms.txt`/`llms-full.txt` files state verified functions, limits and availability. The existing AI catalogue links to Tools. The site's existing read-only MCP discovers the pages from the sitemap and can search the added corpus. Tools pages support `Accept: text/markdown` and `Vary: Accept`.

`llms.txt` is supplemental. Google does not require a special AI file or special structured data for its AI features. Neither sitemap submission nor valid metadata guarantees crawling, indexing or a particular ranking.

## Remaining launch work

1. Resolve public access policy before changing the private downloader's authentication. Opening the existing general-purpose extractor directly to anonymous users would require a separate bounded public interface, abuse controls and stronger network isolation; the private engine currently relies partly on administrator-only access for its threat model.
2. Deploy and verify the tools service, configure its Worker origin, and test authorised real platform links. The automated HTTP tests use a fixture engine and do not establish live YouTube or Instagram compatibility.
3. Publish the site using the existing Cloudflare deployment workflow after reviewing the unrelated local changes already present. No production deployment was performed by this task.
4. In a verified Google Search Console property for `elysiumdr.eu`, submit `https://elysiumdr.eu/sitemap.xml` and inspect the six indexable Tools URLs above. Request indexing after the public pages return 200 and their canonical URLs are confirmed. Search Console access was not available during this task.
5. Monitor indexing, canonical selection and search performance in Search Console. Keep the PDF placeholder excluded until usable; then update its content, sitemap and application metadata together.

## Maintenance and validation

Edit `tools/content.json`, then run `python3 scripts/build-tools.py` to regenerate the nine pages and their sitemap/LLM sections. Keep the catalogue's access status consistent with the deployed backend. Add a verified tool to the catalogue, translations, navigation, structured data and discovery content together.

Run `node --test scripts/tools.test.mjs scripts/routing.test.mjs scripts/agents.test.mjs scripts/admin-i18n.test.mjs backend/tools/video.test.js backend/tools/server.test.js`. HTTP backend tests require permission to bind local ports. No real media is fetched by those tests.

Sources: [Google Search Essentials](https://developers.google.com/search/docs/essentials), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [AI features and websites](https://developers.google.com/search/docs/appearance/ai-features).

## Verification result

All 148 automated tests passed, including the fixture-based downloader HTTP flow, existing routing/agent/i18n checks and the five new Tools tests. Sitemap XML parsed successfully, its canonical URLs are unique, and all links from the nine Tools pages resolve to local files. `git diff --check` passed. The browser could not reach the local preview; visual review remains unverified. The owned preview server was stopped.
