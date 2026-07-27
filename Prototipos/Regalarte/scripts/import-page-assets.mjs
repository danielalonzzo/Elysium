import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const prefix = "https://regalarte.cr/wp-content/uploads/";
const manifests = process.argv.slice(2);
if (!manifests.length) throw new Error("Indique al menos un manifest.json exportado por pageAssets.");

let copied = 0;
for (const manifestPath of manifests) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const asset of manifest.assets || []) {
    if (!asset.url?.startsWith(prefix)) continue;
    const relative = decodeURIComponent(asset.url.slice(prefix.length).split("?")[0]);
    const destination = resolve(root, "public/assets/uploads", relative);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(asset.path, destination);
    copied += 1;
  }
}

console.log(JSON.stringify({ manifests: manifests.length, copied }));
