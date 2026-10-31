/**
 * Pruebas de «Documento de identidad» (JS/id-card-scan.js y su sitio en el
 * CRM y en tools.elysiumdr.eu).
 *
 * Lo que no se ve abriendo la herramienta:
 *
 * 1. Que encuentre la tarjeta. Se fabrican fotos sintéticas deterministas —
 *    una tarjeta con banda, foto y renglones, vista por una cámara de
 *    teléfono con inclinación y giro, sobre mesas claras, oscuras y de
 *    madera, con sombra y ruido— y se mide el error de las esquinas. Si un
 *    cambio en el detector empeora esto, falla aquí antes que en la mano de
 *    alguien con su cédula.
 * 2. Que la endereza sin espejar ni girar: se recorta con las esquinas
 *    verdaderas y el resultado tiene que parecerse a la tarjeta original.
 * 3. Que la hoja salga a tamaño real (85,6 × 54 mm menos el margen de
 *    recorte), centrada, y que lo que no cabe se reduzca.
 * 4. Que las páginas públicas y el CRM la lleven traducida y bien cableada.
 *
 * Al ajustar el detector se midió con 200 fotos sintéticas más realistas
 * (texto, chip, hologramas, dedos, reflejos y JPEG): 85 % con menos de un
 * 0,6 % de error, casi todos por debajo de una décima de píxel; los fallos
 * eran sobre todo tarjetas cortadas por el borde de la foto, tarjetas claras
 * sobre un folio blanco y manteles a cuadros. Para eso están las esquinas a
 * mano.
 *
 * Uso:  node --test scripts/id-card.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(ROOT, path), 'utf8');
const scan = await import(pathToFileURL(join(ROOT, 'JS', 'id-card-scan.js')));
const { buildSite } = await import(pathToFileURL(join(ROOT, 'scripts', 'build-tools.mjs')));

/* ── Fotos sintéticas ────────────────────────────────────────────────────── */

function random(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const CARD_PX = 8; // píxeles por milímetro de la tarjeta de muestra

/** Una tarjeta ID-1 de muestra: fondo claro, banda de color, foto y renglones. */
function cardTexture(rng) {
    const width = Math.round(scan.ID1.width * CARD_PX);
    const height = Math.round(scan.ID1.height * CARD_PX);
    const image = scan.createImage(width, height);
    const tint = [[236, 242, 250], [246, 238, 226], [232, 244, 236], [70, 98, 150]][Math.floor(rng() * 4)];
    const band = [[30, 70, 140], [150, 32, 44], [24, 110, 78]][Math.floor(rng() * 3)];
    const dark = tint[0] < 128;
    const set = (x, y, color) => {
        const index = (y * width + x) * 4;
        image.data[index] = color[0];
        image.data[index + 1] = color[1];
        image.data[index + 2] = color[2];
        image.data[index + 3] = 255;
    };
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const shade = 1 - 0.06 * (x / width) + 0.02 * Math.sin(x / 9 + y / 23);
            set(x, y, tint.map(value => value * shade));
        }
    }
    const fill = (x0, y0, x1, y1, color) => {
        for (let y = Math.round(y0 * height); y < Math.round(y1 * height); y += 1) {
            for (let x = Math.round(x0 * width); x < Math.round(x1 * width); x += 1) set(x, y, color);
        }
    };
    fill(0, 0, 1, 0.15, band);
    fill(0.05, 0.25, 0.32, 0.86, [160, 176, 192]);
    // Una cara: un óvalo de piel bajo un óvalo de pelo.
    for (let y = Math.round(0.3 * height); y < Math.round(0.8 * height); y += 1) {
        for (let x = Math.round(0.08 * width); x < Math.round(0.29 * width); x += 1) {
            const fx = (x / width - 0.185) / 0.085;
            const fy = (y / height - 0.55) / 0.2;
            if (fx * fx + fy * fy < 1) set(x, y, fy < -0.35 ? [40, 30, 26] : [222, 182, 150]);
        }
    }
    const ink = dark ? [236, 240, 248] : [28, 32, 46];
    for (let row = 0; row < 5; row += 1) {
        const top = 0.3 + row * 0.11;
        let x = 0.38;
        while (x < 0.9) {
            const word = 0.03 + rng() * 0.08;
            fill(x, top, Math.min(0.92, x + word), top + 0.045, ink);
            x += word + 0.015;
        }
    }
    return image;
}

function invert(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h;
    const B = -(d * i - f * g);
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map(value => value / det);
}

/**
 * Una foto de la tarjeta: cámara de teléfono (focal 0,8 × el lado mayor),
 * tarjeta inclinada y girada, sombra suave, fondo de `kind` y ruido. Devuelve
 * la imagen y las cuatro esquinas verdaderas.
 */
function photo(seed, kind) {
    const rng = random(seed);
    const portrait = rng() < 0.4;
    const width = portrait ? 900 : 1200;
    const height = portrait ? 1200 : 900;
    const image = scan.createImage(width, height);
    const base = { light: [222, 218, 210], dark: [38, 40, 46], wood: [128, 84, 50] }[kind];
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let factor = 1 - 0.12 * (y / height);
            if (kind === 'wood') factor *= 0.82 + 0.18 * Math.sin(y / 5.5 + 2.2 * Math.sin(x / 140));
            const index = (y * width + x) * 4;
            for (let c = 0; c < 3; c += 1) image.data[index + c] = base[c] * factor;
            image.data[index + 3] = 255;
        }
    }
    // La tarjeta en 3D, vista por una cámara de teléfono.
    const focal = 0.8 * Math.max(width, height);
    const roll = (rng() - 0.5) * 0.8;
    const pitch = (rng() - 0.5) * 0.7;
    const yaw = (rng() - 0.5) * 0.6;
    const share = 0.45 + rng() * 0.3;
    const distance = (focal * scan.ID1.width) / (share * width);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
        let x = (sx * scan.ID1.width) / 2;
        let y = (sy * scan.ID1.height) / 2;
        let z = 0;
        [x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
        [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
        [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
        z += distance;
        return { x: width / 2 + (focal * x) / z, y: height / 2 + (focal * y) / z };
    });
    const card = cardTexture(rng);
    const h = scan.squareToQuad(corners);
    const inverse = invert([h.a, h.b, h.c, h.d, h.e, h.f, h.g, h.h, 1]);
    const toCard = (x, y) => {
        const w = inverse[6] * x + inverse[7] * y + inverse[8];
        return [(inverse[0] * x + inverse[1] * y + inverse[2]) / w, (inverse[3] * x + inverse[4] * y + inverse[5]) / w];
    };
    const radius = scan.ID1.radius / scan.ID1.width;
    const ratio = scan.ID1_RATIO;
    const inside = (u, v) => {
        if (u < 0 || v < 0 || u > 1 || v > 1) return false;
        const px = u;
        const py = v / ratio;
        const cx = Math.min(Math.max(px, radius), 1 - radius);
        const cy = Math.min(Math.max(py, radius), 1 / ratio - radius);
        return (px - cx) ** 2 + (py - cy) ** 2 <= radius * radius;
    };
    const xs = corners.map(point => point.x);
    const ys = corners.map(point => point.y);
    const bounds = [Math.floor(Math.min(...xs)) - 30, Math.floor(Math.min(...ys)) - 30, Math.ceil(Math.max(...xs)) + 30, Math.ceil(Math.max(...ys)) + 30];
    // Sombra: la tarjeta desplazada y difuminada oscurece la mesa.
    const offset = [6 + rng() * 10, 8 + rng() * 12];
    for (let y = Math.max(0, bounds[1]); y < Math.min(height, bounds[3]); y += 1) {
        for (let x = Math.max(0, bounds[0]); x < Math.min(width, bounds[2]); x += 1) {
            let cover = 0;
            for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6], [0, 0]]) {
                const [u, v] = toCard(x - offset[0] + dx, y - offset[1] + dy);
                if (inside(u, v)) cover += 0.2;
            }
            const index = (y * width + x) * 4;
            for (let c = 0; c < 3; c += 1) image.data[index + c] *= 1 - 0.35 * cover;
        }
    }
    // La tarjeta, con 2×2 muestras por píxel para que el canto sea suave.
    const sample = [0, 0, 0];
    for (let y = Math.max(0, bounds[1]); y < Math.min(height, bounds[3]); y += 1) {
        for (let x = Math.max(0, bounds[0]); x < Math.min(width, bounds[2]); x += 1) {
            let r = 0;
            let g = 0;
            let b = 0;
            let cover = 0;
            for (const [sx, sy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
                const [u, v] = toCard(x + sx, y + sy);
                if (!inside(u, v)) continue;
                const index = (Math.min(card.height - 1, Math.floor(v * card.height)) * card.width + Math.min(card.width - 1, Math.floor(u * card.width))) * 4;
                sample[0] = card.data[index];
                sample[1] = card.data[index + 1];
                sample[2] = card.data[index + 2];
                r += sample[0];
                g += sample[1];
                b += sample[2];
                cover += 1;
            }
            if (!cover) continue;
            const index = (y * width + x) * 4;
            const alpha = cover / 4;
            image.data[index] = image.data[index] * (1 - alpha) + (r / cover) * alpha;
            image.data[index + 1] = image.data[index + 1] * (1 - alpha) + (g / cover) * alpha;
            image.data[index + 2] = image.data[index + 2] * (1 - alpha) + (b / cover) * alpha;
        }
    }
    for (let index = 0; index < image.data.length; index += 4) {
        const noise = (rng() + rng() + rng() - 1.5) * 9;
        for (let c = 0; c < 3; c += 1) image.data[index + c] += noise;
    }
    return { image, corners, card };
}

/** El mayor error de esquina, admitiendo cualquier giro del orden. */
function cornerError(found, truth) {
    let best = Infinity;
    for (let shift = 0; shift < 4; shift += 1) {
        best = Math.min(best, Math.max(...found.map((point, index) => {
            const other = truth[(index + shift) % 4];
            return Math.hypot(point.x - other.x, point.y - other.y);
        })));
    }
    return best;
}

/* ── 1. Encontrar la tarjeta ─────────────────────────────────────────────── */

test('encuentra la tarjeta en fotos de teléfono sobre mesas claras, oscuras y de madera', () => {
    const results = [];
    for (const kind of ['light', 'dark', 'wood']) {
        for (let seed = 1; seed <= 4; seed += 1) {
            const { image, corners } = photo(seed * 7919 + kind.length, kind);
            const result = scan.detectCard(image);
            const width = Math.max(...scan.sideLengths(corners));
            results.push({ kind, seed, found: result.found, error: (cornerError(result.corners, corners) / width) * 100 });
        }
    }
    const report = results.map(item => `${item.kind}#${item.seed}: ${item.found ? `${item.error.toFixed(2)} %` : 'no encontrada'}`).join(', ');
    // Una esquina a menos del 0,5 % del ancho de la tarjeta (≈ 0,4 mm) no deja
    // ni una raya de mesa: se recortan 0,3 mm de canto.
    const precise = results.filter(item => item.found && item.error < 0.5).length;
    assert.ok(precise >= 11, `solo ${precise} de 12 con precisión: ${report}`);
    assert.ok(results.every(item => item.found), `alguna no se encontró: ${report}`);
});

test('sin tarjeta en la foto, no se inventa una: propone un rectángulo ID-1 centrado', () => {
    const image = scan.createImage(800, 600);
    const rng = random(42);
    for (let index = 0; index < image.data.length; index += 4) {
        const value = 120 + (rng() - 0.5) * 30;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = 255;
    }
    const result = scan.detectCard(image);
    assert.equal(result.found, false);
    assert.ok(Math.abs(scan.apparentRatio(result.corners) - scan.ID1_RATIO) < 0.01);
    assert.equal(scan.isCut(result.corners, 800, 600), false);
});

test('una esquina fuera de la foto se avisa como tarjeta cortada', () => {
    const corners = [{ x: -40, y: 10 }, { x: 500, y: 20 }, { x: 510, y: 360 }, { x: -30, y: 350 }];
    assert.equal(scan.isCut(corners, 800, 600), true);
    assert.equal(scan.isCut(corners.map(point => ({ x: point.x + 60, y: point.y })), 800, 600), false);
});

/* ── 2. Enderezar ────────────────────────────────────────────────────────── */

test('la homografía lleva las esquinas del cuadrado a las del cuadrilátero', () => {
    const quad = [{ x: 103, y: 87 }, { x: 611, y: 140 }, { x: 590, y: 470 }, { x: 80, y: 402 }];
    const matrix = scan.squareToQuad(quad);
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, v], index) => {
        const point = scan.mapPoint(matrix, u, v);
        assert.ok(Math.hypot(point.x - quad[index].x, point.y - quad[index].y) < 1e-6, `esquina ${index}`);
    });
});

test('el orden de las esquinas: agujas del reloj desde arriba a la izquierda, y de pie se tumba', () => {
    const shuffled = [{ x: 400, y: 300 }, { x: 10, y: 20 }, { x: 15, y: 290 }, { x: 420, y: 30 }];
    assert.deepEqual(scan.orderCorners(shuffled), [{ x: 10, y: 20 }, { x: 420, y: 30 }, { x: 400, y: 300 }, { x: 15, y: 290 }]);
    // Una tarjeta fotografiada de pie sale tumbada…
    const upright = [{ x: 100, y: 50 }, { x: 260, y: 50 }, { x: 260, y: 304 }, { x: 100, y: 304 }];
    assert.equal(scan.isPortrait(upright), true);
    assert.equal(scan.isPortrait(scan.orientCorners(upright)), false);
    // …y cada cuarto de vuelta pedido la gira 90° en el sentido de las agujas.
    assert.equal(scan.isPortrait(scan.orientCorners(upright, 1)), true);
    assert.deepEqual(scan.rotateCorners(upright, 1), [upright[3], upright[0], upright[1], upright[2]]);
    assert.deepEqual(scan.rotateCorners(upright, 4), upright);
});

test('recortada con sus esquinas, la tarjeta sale derecha, sin espejo ni giro', () => {
    const { image, corners, card } = photo(2024, 'dark');
    const rendered = scan.renderCard(scan.pyramid(image), corners, { pxPerMm: CARD_PX, light: false, crisp: false });
    assert.equal(rendered.portrait, false);
    assert.deepEqual(rendered.mm, { width: scan.ID1.width - 2 * scan.CARD_INSET_MM, height: scan.ID1.height - 2 * scan.CARD_INSET_MM });
    const out = rendered.image;
    // Se compara el centro (lejos de las esquinas redondeadas) con la tarjeta
    // original, que solo difiere en el recorte de 0,3 mm por lado.
    const inset = scan.CARD_INSET_MM * CARD_PX;
    let difference = 0;
    let count = 0;
    for (let y = Math.round(out.height * 0.1); y < out.height * 0.9; y += 3) {
        for (let x = Math.round(out.width * 0.1); x < out.width * 0.9; x += 3) {
            const source = (Math.round(y + inset) * card.width + Math.round(x + inset)) * 4;
            const target = (y * out.width + x) * 4;
            for (let c = 0; c < 3; c += 1) difference += Math.abs(out.data[target + c] - card.data[source + c]);
            count += 3;
        }
    }
    const mean = difference / count;
    assert.ok(mean < 22, `diferencia media ${mean.toFixed(1)} por canal`);
    // Las esquinas redondeadas quedan en blanco y el centro, no.
    assert.deepEqual([...out.data.slice(0, 3)], [255, 255, 255]);
    const middle = (Math.floor(out.height / 2) * out.width + Math.floor(out.width / 2)) * 4;
    assert.notDeepEqual([...out.data.slice(middle, middle + 3)], [255, 255, 255]);
});

test('corregir la luz quita el tinte de una bombilla cálida sin quemar los blancos', () => {
    const image = scan.createImage(64, 40);
    for (let index = 0; index < image.data.length; index += 4) {
        const light = index % 32 < 24;
        image.data.set(light ? [236, 214, 170, 255] : [60, 50, 40, 255], index);
    }
    scan.correctLight(image);
    const [r, g, b] = image.data;
    assert.ok(r - b < 66 * 0.6, `tinte rojo-azul que queda: ${r - b}`);
    assert.ok(Math.max(r, g, b) <= 255 && Math.min(r, g, b) > 150);
});

/* ── 3. La hoja ──────────────────────────────────────────────────────────── */

test('la hoja: A4 o carta, tamaño real, centrada, y reducida si no cabe', () => {
    const mm = { width: scan.ID1.width - 0.6, height: scan.ID1.height - 0.6 };
    const pt = value => value * scan.MM_TO_PT;
    const a4 = scan.sheetLayout({ sheet: 'a4', cards: [{ mm }, { mm }] });
    assert.equal(a4.width, 595.28);
    assert.equal(a4.scale, 1);
    for (const box of a4.boxes) {
        assert.ok(Math.abs(box.width - pt(mm.width)) < 1e-6 && Math.abs(box.height - pt(mm.height)) < 1e-6);
        assert.ok(Math.abs(box.x + box.width / 2 - a4.width / 2) < 1e-6, 'centrada');
    }
    // El frente arriba (en PDF, y mayor) y entre las dos, 14 mm.
    assert.ok(a4.boxes[0].y > a4.boxes[1].y);
    assert.ok(Math.abs(a4.boxes[0].y - (a4.boxes[1].y + a4.boxes[1].height) - pt(14)) < 1e-6);
    const middle = (a4.boxes[0].y + a4.boxes[0].height + a4.boxes[1].y) / 2;
    assert.ok(Math.abs(middle - a4.height / 2) < 1e-6, 'el par, centrado en vertical');
    const letter = scan.sheetLayout({ sheet: 'letter', scale: 1.5, cards: [{ mm }] });
    assert.deepEqual([letter.width, letter.height], [612, 792]);
    assert.ok(Math.abs(letter.boxes[0].width - pt(mm.width) * 1.5) < 1e-6);
    // Dos caras de pie y ampliadas no caben en una carta: se reducen.
    const tall = { width: mm.height, height: mm.width };
    const squeezed = scan.sheetLayout({ sheet: 'letter', scale: 1.5, cards: [{ mm: tall }, { mm: tall }] });
    assert.ok(squeezed.scale < 1.5);
    assert.ok(squeezed.boxes[1].y >= pt(15) - 1e-6 && squeezed.boxes[0].y + squeezed.boxes[0].height <= 792 - pt(15) + 1e-6);
});

test('la marca de agua solo lleva lo que la fuente estándar del PDF puede escribir', () => {
    assert.equal(scan.pdfSafeText('  Solo para  la solicitud  '), 'Solo para la solicitud');
    assert.equal(scan.pdfSafeText('Candidatura à função — São Tomé ç ñ €'), 'Candidatura à função — São Tomé ç ñ €');
    assert.equal(scan.pdfSafeText('Łódź “Kraków” 🎉'), 'Lódz “Kraków”');
    assert.equal(scan.pdfSafeText('Только для Œuvre'), 'Œuvre');
});

/* ── 4. Dónde vive: el CRM y tools.elysiumdr.eu ──────────────────────────── */

const FILES = buildSite();
const ID_PAGES = ['tools/id-card-to-pdf/index.html', 'tools/es/cedula-dni-pdf/index.html', 'tools/pt/cartao-de-cidadao-pdf/index.html'];

test('las páginas públicas de la cédula abren con su herramienta, sin esperar al JS', () => {
    for (const file of ID_PAGES) {
        const html = FILES.get(file);
        assert.ok(html, `falta ${file}`);
        assert.match(html, /id="pdf-mode-idcard" aria-selected="true"/, file);
        assert.match(html, /<div class="pdf-mode-panel" id="pdf-edit" role="tabpanel" aria-labelledby="pdf-mode-edit" hidden>/, file);
        assert.match(html, /<div class="pdf-mode-panel idcard" id="idcard" role="tabpanel" aria-labelledby="pdf-mode-idcard">/, file);
        assert.match(html, /<script type="module" src="\/JS\/admin-id-card\.js\?v=[0-9a-f]{10}"><\/script>/, file);
        assert.match(html, /data-mode="idcard"/, file);
        // Ni el FAQ de subir PDF ni el de la conversión a Word: aquí no se sube nada.
        assert.ok(!/Word/.test(html.match(/<section class="ts-block" aria-labelledby="faq">[\s\S]*?<\/section>/)[0]), `${file}: FAQ ajeno`);
    }
    // Las demás páginas de PDF llevan las dos herramientas, con el editor delante.
    const merge = FILES.get('tools/es/unir-pdf/index.html');
    assert.match(merge, /id="pdf-mode-edit" aria-selected="true"/);
    assert.match(merge, /admin-id-card\.js/);
});

test('las páginas en español y portugués llevan la herramienta traducida', () => {
    const english = ['Both sides of your ID on one page', 'Drop the photo of the front here', 'Choose photo', 'Preview of the page', 'Fix light and contrast', 'ID card to PDF</span>', 'aria-label="PDF tools"'];
    for (const file of ID_PAGES.slice(1)) {
        for (const text of english) assert.ok(!FILES.get(file).includes(text), `${file}: «${text}»`);
    }
    assert.match(FILES.get('tools/es/cedula-dni-pdf/index.html'), /Suelta aquí la foto del frente/);
    assert.match(FILES.get('tools/pt/cartao-de-cidadao-pdf/index.html'), /Largue aqui a fotografia da frente/);
});

test('el CRM la carga, y las fotos nunca se pintan con URL blob: (la CSP del CRM no las deja)', () => {
    const admin = read('admin.html');
    assert.match(admin, /<script type="module" src="JS\/admin-id-card\.js\?v=\d+"><\/script>/);
    const module = read('JS/admin-id-card.js');
    assert.ok(!/\.src\s*=\s*URL\.createObjectURL/.test(module), 'una <img> con URL blob: no pasa img-src del CRM');
    // Ni servidor ni Turnstile: es la promesa de la página pública.
    assert.ok(!/fetch\(|tools-public|humanToken/.test(module));
    assert.ok(!/fetch\(/.test(read('JS/id-card-scan.js')));
    // Y que la CSP pública siga permitiendo lo que usa: data: para la <img> de reserva.
    assert.match(read('_headers'), /^\/tools\/\*\n\s+! Content-Security-Policy\n\s+Content-Security-Policy: [^\n]*img-src 'self' data: blob:/m);
});
