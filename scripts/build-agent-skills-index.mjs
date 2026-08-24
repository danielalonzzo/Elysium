/**
 * Regenera `.well-known/agent-skills/index.json` a partir de los SKILL.md.
 *
 * El índice publica un `sha256` de cada skill para que un agente pueda
 * comprobar que lo que descarga es lo que el sitio anunció. Ese digest se queda
 * obsoleto en cuanto se edita una coma del SKILL.md, y nada avisa: el fichero
 * sigue sirviéndose igual y solo falla la verificación, en el cliente. Por eso
 * el índice no se escribe a mano — se genera.
 *
 * El `description` sale del frontmatter YAML del propio SKILL.md, así que la
 * descripción que ve el agente en el índice y la que lee al abrirlo no pueden
 * discrepar.
 *
 * Uso:  node scripts/build-agent-skills-index.mjs
 *       node scripts/build-agent-skills-index.mjs --check   (no escribe; falla
 *       con código 1 si el índice publicado no coincide — para CI)
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, '.well-known', 'agent-skills');
const INDEX = join(SKILLS_DIR, 'index.json');
const BASE = 'https://elysiumdr.eu/.well-known/agent-skills';

/** Lee `name:` y `description:` del frontmatter, sin dependencias de YAML. */
function frontmatter(text) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    if (!match) throw new Error('SKILL.md sin frontmatter');
    const fields = {};
    for (const line of match[1].split(/\r?\n/)) {
        const field = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
        if (field) fields[field[1]] = field[2].trim().replace(/^["']|["']$/g, '');
    }
    return fields;
}

const skills = readdirSync(SKILLS_DIR)
    .filter(entry => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .sort()
    .map(slug => {
        const path = join(SKILLS_DIR, slug, 'SKILL.md');
        const source = readFileSync(path);
        const fields = frontmatter(source.toString('utf8'));
        if (fields.name !== slug) {
            throw new Error(`${slug}/SKILL.md declara name: ${fields.name}`);
        }
        return {
            name: fields.name,
            type: 'skill',
            description: fields.description,
            url: `${BASE}/${slug}/SKILL.md`,
            sha256: createHash('sha256').update(source).digest('hex')
        };
    });

const index = {
    $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
    version: '0.2.0',
    name: 'Elysium λ Development & Research',
    description: 'Skills for working with elysiumdr.eu: answering questions about the company and its subscription tiers, and handing over a project enquiry.',
    homepage: 'https://elysiumdr.eu',
    skills
};

const serialized = JSON.stringify(index, null, 2) + '\n';

if (process.argv.includes('--check')) {
    const published = readFileSync(INDEX, 'utf8');
    if (published !== serialized) {
        console.error('El índice de skills está desactualizado: node scripts/build-agent-skills-index.mjs');
        process.exit(1);
    }
    console.log(`Índice al día (${skills.length} skills).`);
} else {
    writeFileSync(INDEX, serialized);
    console.log(`Escrito ${INDEX} (${skills.length} skills).`);
}
