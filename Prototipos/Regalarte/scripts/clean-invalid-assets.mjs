import { readFile, readdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../public/assets/uploads");
const removed = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else {
      const bytes = await readFile(path);
      const prefix = bytes.subarray(0, 256).toString("utf8").toLowerCase();
      if (prefix.includes("<html") && prefix.includes("sgcaptcha")) {
        await unlink(path);
        removed.push(path.slice(root.length + 1));
      }
    }
  }
}

await walk(root);
console.log(JSON.stringify({ removedCount: removed.length, removed }, null, 2));
