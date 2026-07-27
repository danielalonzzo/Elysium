/** Minimal Cloudflare bindings used by the local Vinext worker.
 * The platform replaces these declarations with its generated runtime types
 * when the prototype is connected to a Cloudflare environment.
 */
interface Fetcher {
  fetch(input: Request): Promise<Response>;
}

interface D1Database {
  readonly __d1PrototypeBinding?: unique symbol;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };
}
