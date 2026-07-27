export const ASSET_ROOT = "/assets/uploads/";

export const ASSET_ALIASES: Record<string, string> = {
  "2025/02/nosotros-2-1024x1024.webp": "2025/02/nosotros-2-600x600.webp",
  "2026/03/banner-la-sele-nuevo.webp": "2026/03/banner-la-sele-nuevo-600x156.webp",
};

export function localAsset(source: string | null) {
  if (!source) return `${ASSET_ROOT}2025/02/peluches-600x600.webp`;
  const relative = source
    .replace("https://regalarte.cr/wp-content/uploads/", "")
    .replace(/^\/assets\/uploads\//, "");
  return `${ASSET_ROOT}${ASSET_ALIASES[relative] ?? relative}`;
}
