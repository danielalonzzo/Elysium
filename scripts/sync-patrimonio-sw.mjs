/**
 * Calcula la versión del service worker de Elysium Patrimonio.
 *
 * `Gestor-Patrimonios/sw.js` guarda el armazón de la app en una caché con el
 * nombre de su versión y lo sirve de ahí. Si se edita un archivo y la versión
 * no cambia, los teléfonos siguen con el código viejo para siempre y nada
 * avisa. Por eso la versión no la escribe una persona: es una huella (SHA-256)
 * de todo lo que el service worker precarga, y este script la actualiza.
 *
 * Uso:  node scripts/sync-patrimonio-sw.mjs          (escribe la versión)
 *       node scripts/sync-patrimonio-sw.mjs --check  (falla si está vieja)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SW = join(ROOT, 'Gestor-Patrimonios', 'sw.js');
const BASE = '/Gestor-Patrimonios/';

/** Rutas que precarga el service worker, tal como las declara. */
export function precacheList(source = readFileSync(SW, 'utf8')) {
    const block = source.match(/const PRECACHE = \[([\s\S]*?)\];/);
    if (!block) throw new Error('sw.js no declara PRECACHE');
    return [...block[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
}

/** Huella de lo precargado: ruta y contenido de cada archivo (la raíz cuenta como su index.html). */
export function shellHash() {
    const hash = createHash('sha256');
    for (const path of precacheList().sort()) {
        const file = path === BASE ? 'index.html' : path.slice(BASE.length);
        const full = join(ROOT, 'Gestor-Patrimonios', file);
        if (!existsSync(full)) throw new Error(`sw.js precarga algo que no existe: ${path}`);
        hash.update(`${path}\0`).update(readFileSync(full)).update('\0');
    }
    return hash.digest('hex').slice(0, 8);
}

export function expectedVersion() {
    return `patrimonio-${shellHash()}`;
}

export function currentVersion(source = readFileSync(SW, 'utf8')) {
    return source.match(/const VERSION = '([^']+)'/)?.[1] || null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const expected = expectedVersion();
    const current = currentVersion();
    if (process.argv.includes('--check')) {
        if (current !== expected) {
            console.error(`sw.js tiene la versión ${current} y debería ser ${expected}: ejecute node scripts/sync-patrimonio-sw.mjs`);
            process.exit(1);
        }
        console.log(`sw.js está al día (${current})`);
    } else if (current === expected) {
        console.log(`sw.js ya estaba al día (${current})`);
    } else {
        writeFileSync(SW, readFileSync(SW, 'utf8').replace(/const VERSION = '[^']+'/, `const VERSION = '${expected}'`));
        console.log(`sw.js: ${current} → ${expected}`);
    }
}
