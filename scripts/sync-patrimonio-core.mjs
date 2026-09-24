/**
 * Copia la lógica pura de Elysium Patrimonio al backend.
 *
 * Los correos de alertas los calcula `backend/patrimonio-alerts.js` con las
 * mismas reglas que la app (`Gestor-Patrimonios/js/core/*` y `model.js`), para
 * que un correo nunca diga algo distinto de lo que se ve en pantalla. Cloud
 * Run despliega solo `backend/`, así que el código no se puede importar desde
 * fuera: se copia a `backend/patrimonio-core/`, con una cabecera que prohíbe
 * editarlo allí y un `package.json` que lo declara módulo ES.
 *
 * Copiar tiene un riesgo —que la copia se quede vieja sin que nada avise—, y
 * por eso existe `--check`, que usa `scripts/patrimonio.test.mjs`.
 *
 * Uso:  node scripts/sync-patrimonio-core.mjs          (copia)
 *       node scripts/sync-patrimonio-core.mjs --check  (falla si difiere)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = join(ROOT, 'Gestor-Patrimonios', 'js');
const TARGET = join(ROOT, 'backend', 'patrimonio-core');

const header = file => `// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/${file}.\n// No se edita aquí: se edita el original y se vuelve a ejecutar el script.\n`;

/** Pares [ruta relativa, contenido esperado] de todo lo que debe existir en el destino. */
export function expectedFiles() {
    const files = [['package.json', `${JSON.stringify({ type: 'module', private: true }, null, 2)}\n`]];
    files.push(['model.js', header('model.js') + readFileSync(join(SOURCE, 'model.js'), 'utf8')]);
    for (const name of readdirSync(join(SOURCE, 'core')).filter(file => file.endsWith('.js')).sort()) {
        files.push([`core/${name}`, header(`core/${name}`) + readFileSync(join(SOURCE, 'core', name), 'utf8')]);
    }
    return files;
}

/** Diferencias entre lo que hay y lo que debería haber. */
export function drift() {
    const problems = [];
    const expected = expectedFiles();
    for (const [relative, content] of expected) {
        const path = join(TARGET, relative);
        if (!existsSync(path)) problems.push(`falta ${relative}`);
        else if (readFileSync(path, 'utf8') !== content) problems.push(`desactualizado ${relative}`);
    }
    if (existsSync(join(TARGET, 'core'))) {
        const known = new Set(expected.map(([relative]) => relative));
        for (const name of readdirSync(join(TARGET, 'core'))) {
            if (!known.has(`core/${name}`)) problems.push(`sobra core/${name}`);
        }
    }
    return problems;
}

function sync() {
    mkdirSync(join(TARGET, 'core'), { recursive: true });
    const expected = expectedFiles();
    const known = new Set(expected.map(([relative]) => relative));
    for (const name of readdirSync(join(TARGET, 'core'))) {
        if (!known.has(`core/${name}`)) rmSync(join(TARGET, 'core', name));
    }
    for (const [relative, content] of expected) writeFileSync(join(TARGET, relative), content);
    return expected.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    if (process.argv.includes('--check')) {
        const problems = drift();
        if (problems.length) {
            console.error(`backend/patrimonio-core no coincide con Gestor-Patrimonios/js:\n  ${problems.join('\n  ')}\nEjecute: node scripts/sync-patrimonio-core.mjs`);
            process.exit(1);
        }
        console.log('backend/patrimonio-core al día.');
    } else {
        console.log(`Copiados ${sync()} archivos a backend/patrimonio-core.`);
    }
}
