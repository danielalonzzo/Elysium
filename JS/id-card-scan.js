/**
 * Documento de identidad a PDF — el núcleo, sin DOM.
 *
 * Lo usa `admin-id-card.js` en el CRM y en tools.elysiumdr.eu, y lo prueba
 * `scripts/id-card.test.mjs` en Node: por eso trabaja con objetos
 * `{ width, height, data }` (RGBA de 8 bits, como `ImageData`) y no toca
 * `document` ni `canvas`.
 *
 * No es el «levantar el sujeto» de Fotos, aunque la idea sea la misma: ese
 * recorte deja la tarjeta torcida, con la perspectiva de la foto y con los
 * dedos que la sujetan. Esto hace lo que el escáner de documentos de un
 * teléfono: encuentra los cuatro lados, endereza la tarjeta y la devuelve
 * plana, a escala y con sus esquinas redondeadas sobre blanco.
 *
 * 1. En una copia pequeña (`DETECT_SIDE`) busca bordes con el gradiente de
 *    color (tensor de estructura de Di Zenzo: ve también una tarjeta clara
 *    sobre una mesa clara de otro tono) y los adelgaza.
 * 2. Una transformada de Hough que vota solo en la dirección de cada borde
 *    saca las rectas largas de la foto.
 * 3. Cada combinación de dos pares de rectas casi paralelas es un
 *    cuadrilátero candidato. Gana el que tiene borde a lo largo de sus cuatro
 *    lados, la proporción de una tarjeta ID-1 y más tamaño.
 * 4. En la foto grande, cada lado se ajusta al borde real con perfiles
 *    perpendiculares y una recta robusta: un dedo que tapa un trozo no la
 *    tuerce. Las esquinas son los cruces de esas rectas, la punta virtual de
 *    la esquina redondeada.
 * 5. Una homografía lleva el cuadrilátero a un rectángulo ID-1 y se le
 *    devuelven las esquinas redondeadas sobre blanco.
 */

/** ISO/IEC 7810 ID-1, en milímetros: cédulas, DNI, Cartão de Cidadão, permisos de conducir. */
export const ID1 = Object.freeze({ width: 85.6, height: 53.98, radius: 3.18 });
export const ID1_RATIO = ID1.width / ID1.height;

/**
 * Lo que se recorta del borde de la tarjeta, en milímetros. Medio píxel de
 * error en la esquina deja una raya de mesa a lo largo de todo el lado; tres
 * décimas de milímetro de tarjeta no las echa nadie de menos.
 */
export const CARD_INSET_MM = 0.3;

/** El lado mayor de la copia en la que se buscan los bordes. */
export const DETECT_SIDE = 640;

/**
 * Cuánto se tolera que la proporción de un candidato se aparte de la ID-1 (en
 * logaritmo): un 8 % pesa la mitad. Un folio A4 se aparta un 11 %; una carta,
 * un 18 %.
 */
const ASPECT_SIGMA = 0.09;

const DEG = Math.PI / 180;

/* ── Imágenes ────────────────────────────────────────────────────────────── */

export function createImage(width, height) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function spans(source, target) {
    const ratio = source / target;
    const result = [];
    for (let index = 0; index < target; index += 1) {
        const from = index * ratio;
        const to = Math.min(source, from + ratio);
        const start = Math.floor(from);
        const weights = [];
        for (let k = start; k < Math.ceil(to); k += 1) weights.push(Math.min(k + 1, to) - Math.max(k, from));
        result.push({ start, weights: Float32Array.from(weights), total: to - from });
    }
    return result;
}

/** Reduce por promedio de área hasta que el lado mayor mida `maxSide`. */
export function downscale(image, maxSide) {
    const { width, height, data } = image;
    const scale = maxSide / Math.max(width, height);
    if (scale >= 1) return image;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const columns = spans(width, w);
    const rows = spans(height, h);
    const temp = new Float32Array(w * height * 3);
    for (let y = 0; y < height; y += 1) {
        const row = y * width * 4;
        for (let x = 0; x < w; x += 1) {
            const { start, weights, total } = columns[x];
            let r = 0;
            let g = 0;
            let b = 0;
            for (let k = 0; k < weights.length; k += 1) {
                const index = row + (start + k) * 4;
                const weight = weights[k];
                r += data[index] * weight;
                g += data[index + 1] * weight;
                b += data[index + 2] * weight;
            }
            const out = (y * w + x) * 3;
            temp[out] = r / total;
            temp[out + 1] = g / total;
            temp[out + 2] = b / total;
        }
    }
    const result = createImage(w, h);
    for (let y = 0; y < h; y += 1) {
        const { start, weights, total } = rows[y];
        for (let x = 0; x < w; x += 1) {
            let r = 0;
            let g = 0;
            let b = 0;
            for (let k = 0; k < weights.length; k += 1) {
                const index = ((start + k) * w + x) * 3;
                const weight = weights[k];
                r += temp[index] * weight;
                g += temp[index + 1] * weight;
                b += temp[index + 2] * weight;
            }
            const out = (y * w + x) * 4;
            result.data[out] = r / total;
            result.data[out + 1] = g / total;
            result.data[out + 2] = b / total;
            result.data[out + 3] = 255;
        }
    }
    return result;
}

/** La mitad exacta, promediando cuadros de 2×2: un piso más de la pirámide. */
export function halve(image) {
    const { width, height, data } = image;
    const w = Math.max(1, width >> 1);
    const h = Math.max(1, height >> 1);
    const result = createImage(w, h);
    const out = result.data;
    for (let y = 0; y < h; y += 1) {
        const top = Math.min(height - 1, y * 2);
        const bottom = Math.min(height - 1, top + 1);
        for (let x = 0; x < w; x += 1) {
            const left = Math.min(width - 1, x * 2);
            const right = Math.min(width - 1, left + 1);
            const a = (top * width + left) * 4;
            const b = (top * width + right) * 4;
            const c = (bottom * width + left) * 4;
            const d = (bottom * width + right) * 4;
            const o = (y * w + x) * 4;
            out[o] = (data[a] + data[b] + data[c] + data[d] + 2) >> 2;
            out[o + 1] = (data[a + 1] + data[b + 1] + data[c + 1] + data[d + 1] + 2) >> 2;
            out[o + 2] = (data[a + 2] + data[b + 2] + data[c + 2] + data[d + 2] + 2) >> 2;
            out[o + 3] = 255;
        }
    }
    return result;
}

/**
 * La foto y sus mitades sucesivas. Al enderezar se lee del piso cuya tarjeta
 * mide entre una y dos veces la salida: leer de una foto mucho mayor que el
 * resultado produce aliasing (muaré en las tramas de seguridad).
 */
export function pyramid(image, minSide = 320) {
    const levels = [image];
    while (Math.min(levels.at(-1).width, levels.at(-1).height) >= minSide * 2) levels.push(halve(levels.at(-1)));
    return levels;
}

function gaussianKernel(sigma) {
    const radius = Math.max(1, Math.ceil(sigma * 3));
    const kernel = new Float32Array(radius * 2 + 1);
    let sum = 0;
    for (let k = -radius; k <= radius; k += 1) {
        const value = Math.exp(-(k * k) / (2 * sigma * sigma));
        kernel[k + radius] = value;
        sum += value;
    }
    for (let k = 0; k < kernel.length; k += 1) kernel[k] /= sum;
    return kernel;
}

/** Desenfoque gaussiano separable de un plano de floats, con bordes repetidos. */
function blurPlane(plane, width, height, kernel) {
    const radius = (kernel.length - 1) / 2;
    const line = new Float32Array(Math.max(width, height));
    for (let y = 0; y < height; y += 1) {
        const row = y * width;
        for (let x = 0; x < width; x += 1) line[x] = plane[row + x];
        for (let x = 0; x < width; x += 1) {
            let sum = 0;
            for (let k = -radius; k <= radius; k += 1) {
                const index = x + k < 0 ? 0 : x + k >= width ? width - 1 : x + k;
                sum += line[index] * kernel[k + radius];
            }
            plane[row + x] = sum;
        }
    }
    for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) line[y] = plane[y * width + x];
        for (let y = 0; y < height; y += 1) {
            let sum = 0;
            for (let k = -radius; k <= radius; k += 1) {
                const index = y + k < 0 ? 0 : y + k >= height ? height - 1 : y + k;
                sum += line[index] * kernel[k + radius];
            }
            plane[y * width + x] = sum;
        }
    }
}

function planesOf(image) {
    const { width, height, data } = image;
    const size = width * height;
    const planes = [new Float32Array(size), new Float32Array(size), new Float32Array(size)];
    for (let index = 0, pixel = 0; index < size; index += 1, pixel += 4) {
        planes[0][index] = data[pixel];
        planes[1][index] = data[pixel + 1];
        planes[2][index] = data[pixel + 2];
    }
    return planes;
}

/* ── 1. Bordes ───────────────────────────────────────────────────────────── */

function sampleFloat(plane, width, height, x, y) {
    if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return 0;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    const top = plane[y0 * width + x0] * (1 - fx) + plane[y0 * width + x1] * fx;
    const bottom = plane[y1 * width + x0] * (1 - fx) + plane[y1 * width + x1] * fx;
    return top * (1 - fy) + bottom * fy;
}

/**
 * Luminancia y crominancia, con la crominancia triplicada. Las tarjetas
 * llevan fondos de seguridad en tonos pastel y el folio o la mesa en los que
 * se apoyan son blancos o grises: en RGB esa diferencia de tono apenas se
 * nota, y es lo único que separa el canto cuando no hay sombra. La
 * luminancia se escala para que un borde gris mida lo mismo que en RGB.
 */
const CHROMA_WEIGHT = 3;

function toContrastPlanes(planes) {
    const [red, green, blue] = planes;
    for (let index = 0; index < red.length; index += 1) {
        const luma = 0.299 * red[index] + 0.587 * green[index] + 0.114 * blue[index];
        const cb = 0.564 * (blue[index] - luma);
        const cr = 0.713 * (red[index] - luma);
        red[index] = luma * 1.7;
        green[index] = cb * CHROMA_WEIGHT;
        blue[index] = cr * CHROMA_WEIGHT;
    }
    return planes;
}

/**
 * Bordes finos de la imagen: magnitud del gradiente de color (cero donde no
 * hay borde tras la supresión de no máximos) y su dirección normal, en
 * radianes entre −π/2 y π/2.
 */
export function edgeMap(image, sigma = 1.4) {
    const { width, height } = image;
    const planes = toContrastPlanes(planesOf(image));
    const kernel = gaussianKernel(sigma);
    for (const plane of planes) blurPlane(plane, width, height, kernel);
    const size = width * height;
    const magnitude = new Float32Array(size);
    const angle = new Float32Array(size);
    // Los bordes de la propia foto (viñeteo, una franja negra) no cuentan.
    const margin = 3;
    for (let y = margin; y < height - margin; y += 1) {
        for (let x = margin; x < width - margin; x += 1) {
            const i = y * width + x;
            const up = i - width;
            const down = i + width;
            let xx = 0;
            let yy = 0;
            let xy = 0;
            for (let channel = 0; channel < 3; channel += 1) {
                const p = planes[channel];
                const gx = (p[up + 1] + 2 * p[i + 1] + p[down + 1] - p[up - 1] - 2 * p[i - 1] - p[down - 1]) / 8;
                const gy = (p[down - 1] + 2 * p[down] + p[down + 1] - p[up - 1] - 2 * p[up] - p[up + 1]) / 8;
                xx += gx * gx;
                yy += gy * gy;
                xy += gx * gy;
            }
            const root = Math.sqrt((xx - yy) * (xx - yy) + 4 * xy * xy);
            magnitude[i] = Math.sqrt(Math.max(0, (xx + yy + root) / 2));
            angle[i] = 0.5 * Math.atan2(2 * xy, xx - yy);
        }
    }
    const edges = new Float32Array(size);
    for (let y = margin; y < height - margin; y += 1) {
        for (let x = margin; x < width - margin; x += 1) {
            const i = y * width + x;
            const value = magnitude[i];
            if (value <= 0) continue;
            const c = Math.cos(angle[i]);
            const s = Math.sin(angle[i]);
            const ahead = sampleFloat(magnitude, width, height, x + c, y + s);
            const behind = sampleFloat(magnitude, width, height, x - c, y - s);
            if (value >= ahead && value > behind) edges[i] = value;
        }
    }
    return { width, height, edges, angle, ...edgeLevels(edges) };
}

/**
 * Qué cuenta como borde. `floor` separa el ruido del sensor y de la
 * compresión; desde `full` un borde vota entero, para que mande la longitud
 * de una recta y no su contraste: el canto de una cédula blanca sobre una
 * mesa blanca es tenue, pero largo y continuo, y el texto impreso dentro es
 * muy contrastado, pero corto.
 */
function edgeLevels(edges) {
    const values = [];
    for (let index = 0; index < edges.length; index += 1) if (edges[index] > 0) values.push(edges[index]);
    if (!values.length) return { floor: Infinity, full: Infinity };
    values.sort((left, right) => left - right);
    const at = quantile => values[Math.min(values.length - 1, Math.floor(quantile * values.length))];
    const floor = Math.max(1.4, at(0.995) * 0.02);
    return { floor, full: Math.max(floor * 3, Math.min(at(0.8), floor * 6)) };
}

/* ── 2. Rectas ───────────────────────────────────────────────────────────── */

const THETA_BINS = 180;
const COS = Float64Array.from({ length: THETA_BINS }, (_, index) => Math.cos(index * DEG));
const SIN = Float64Array.from({ length: THETA_BINS }, (_, index) => Math.sin(index * DEG));

/**
 * Transformada de Hough orientada: cada borde vota solo por las rectas cuya
 * normal se parece a su gradiente (±6°, con menos peso cuanto más lejos: en
 * un canto tenue la sombra suave de al lado tuerce la dirección medida hasta
 * 10°). Devuelve como mucho `count` rectas `{ nx, ny, c, votes }` con
 * nx·x + ny·y = c en píxeles de la imagen.
 */
export function houghLines(map, count = 48) {
    const { width, height, edges, angle, floor, full } = map;
    const cx = width / 2;
    const cy = height / 2;
    const rhoMax = Math.ceil(Math.hypot(width, height) / 2) + 2;
    const rhoBins = rhoMax * 2 + 1;
    const accumulator = new Float32Array(THETA_BINS * rhoBins);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const i = y * width + x;
            const value = edges[i];
            if (value < floor) continue;
            const weight = Math.min(1, value / full);
            let theta = angle[i] / DEG;
            if (theta < 0) theta += 180;
            const center = Math.round(theta);
            const dx = x - cx;
            const dy = y - cy;
            for (let offset = -6; offset <= 6; offset += 1) {
                const nominal = center + offset;
                const vote = weight * (1 - Math.abs(theta - nominal) / 7.5);
                if (vote <= 0) continue;
                const bin = (nominal + THETA_BINS) % THETA_BINS;
                const rho = dx * COS[bin] + dy * SIN[bin] + rhoMax;
                const low = Math.floor(rho);
                const fraction = rho - low;
                const base = bin * rhoBins;
                accumulator[base + low] += vote * (1 - fraction);
                accumulator[base + low + 1] += vote * fraction;
            }
        }
    }

    // Máximos locales en 5×5. Al pasar de 179° a 0° la recta es la misma con
    // ρ cambiado de signo.
    const value = (bin, rho) => {
        let b = bin;
        let r = rho;
        if (b < 0 || b >= THETA_BINS) {
            b = (b + THETA_BINS) % THETA_BINS;
            r = rhoBins - 1 - r;
        }
        return r < 0 || r >= rhoBins ? 0 : accumulator[b * rhoBins + r];
    };
    const minimum = Math.max(8, Math.min(width, height) * 0.06);
    const peaks = [];
    for (let bin = 0; bin < THETA_BINS; bin += 1) {
        for (let rho = 0; rho < rhoBins; rho += 1) {
            const votes = accumulator[bin * rhoBins + rho];
            if (votes < minimum) continue;
            let best = true;
            for (let db = -2; db <= 2 && best; db += 1) {
                for (let dr = -2; dr <= 2; dr += 1) {
                    if (!db && !dr) continue;
                    const other = value(bin + db, rho + dr);
                    if (other > votes || (other === votes && (db < 0 || (db === 0 && dr < 0)))) {
                        best = false;
                        break;
                    }
                }
            }
            if (best) peaks.push({ bin, rho: rho - rhoMax, votes });
        }
    }
    peaks.sort((left, right) => right.votes - left.votes);

    // Dos rectas a menos de 3 px son la misma… salvo el canto de la tarjeta y
    // el de su sombra, que van pegados y hay que conservar los dos. Y una
    // sola orientación (las vetas de la madera, un mantel a cuadros) no puede
    // llevarse todos los puestos: lo que sobra espera al final de la lista.
    const chosen = [];
    const waiting = [];
    const line = peak => ({ nx: COS[peak.bin], ny: SIN[peak.bin], rho: peak.rho, c: peak.rho + COS[peak.bin] * cx + SIN[peak.bin] * cy, votes: peak.votes });
    for (const peak of peaks) {
        const candidate = line(peak);
        let duplicate = false;
        let sameWay = 0;
        for (const other of chosen) {
            const dot = other.nx * candidate.nx + other.ny * candidate.ny;
            if (Math.abs(dot) < Math.cos(3 * DEG)) continue;
            sameWay += 1;
            if (Math.abs(other.rho - Math.sign(dot) * candidate.rho) < 3) duplicate = true;
        }
        if (duplicate) continue;
        if (sameWay >= 12) waiting.push(candidate);
        else chosen.push(candidate);
        if (chosen.length >= count) break;
    }
    return [...chosen, ...waiting].slice(0, count);
}

/* ── 3. Cuadriláteros ────────────────────────────────────────────────────── */

export function intersect(first, second) {
    const det = first.nx * second.ny - first.ny * second.nx;
    if (Math.abs(det) < 1e-9) return null;
    return {
        x: (first.c * second.ny - first.ny * second.c) / det,
        y: (first.nx * second.c - first.c * second.nx) / det
    };
}

/** La recta que pasa por dos puntos. */
export function lineThrough(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    return { nx, ny, c: nx * a.x + ny * a.y };
}

function signedArea(points) {
    let sum = 0;
    for (let index = 0; index < points.length; index += 1) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        sum += a.x * b.y - b.x * a.y;
    }
    return sum / 2;
}

/**
 * Cuatro puntos en el orden de las agujas del reloj en pantalla, empezando
 * por el de arriba a la izquierda.
 */
export function orderCorners(points) {
    const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const sorted = [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    let start = 0;
    sorted.forEach((point, index) => {
        if (point.x + point.y < sorted[start].x + sorted[start].y) start = index;
    });
    return [...sorted.slice(start), ...sorted.slice(0, start)].map(point => ({ x: point.x, y: point.y }));
}

export function sideLengths(corners) {
    return corners.map((corner, index) => {
        const next = corners[(index + 1) % 4];
        return Math.hypot(next.x - corner.x, next.y - corner.y);
    });
}

/** Proporción aparente (lado largo / corto) a partir de los lados opuestos. */
export function apparentRatio(corners) {
    const [top, right, bottom, left] = sideLengths(corners);
    const across = (top + bottom) / 2;
    const down = (right + left) / 2;
    return Math.max(across, down) / Math.max(1e-6, Math.min(across, down));
}

const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * La proporción de verdad (lado largo / corto) del rectángulo que la foto ve
 * en perspectiva. Un folio A4 visto de lado puede aparentar la proporción de
 * una tarjeta; deshecha la perspectiva, no.
 *
 * Zhang y He (2007), con el centro óptico en el centro de la foto y la
 * distancia focal de la cámara principal de un teléfono (`0,8 ×` el lado
 * mayor). La condición de ángulo recto daría la focal exacta, pero con las
 * esquinas a un píxel de su sitio se dispara (hasta un 45 % de error en la
 * proporción); la supuesta se equivoca un 0,8 % de mediana y nunca más de un
 * 10 %, también con un teleobjetivo 2×. Probar todas las focales posibles
 * resultó peor: con mucha perspectiva cualquier rectángulo cabía.
 */
export function trueRatio(corners, width, height) {
    const [tl, tr, br, bl] = corners;
    const cx = width / 2;
    const cy = height / 2;
    const m1 = [tl.x - cx, tl.y - cy, 1];
    const m2 = [tr.x - cx, tr.y - cy, 1];
    const m3 = [bl.x - cx, bl.y - cy, 1];
    const m4 = [br.x - cx, br.y - cy, 1];
    const m14 = cross3(m1, m4);
    const k2 = dot3(m14, m3) / dot3(cross3(m2, m4), m3);
    const k3 = dot3(m14, m2) / dot3(cross3(m3, m4), m2);
    if (!Number.isFinite(k2) || !Number.isFinite(k3)) return apparentRatio(corners);
    const n2 = m2.map((value, index) => k2 * value - m1[index]);
    const n3 = m3.map((value, index) => k3 * value - m1[index]);
    const focal2 = (0.8 * Math.max(width, height)) ** 2;
    const across = n2[0] * n2[0] + n2[1] * n2[1] + focal2 * n2[2] * n2[2];
    const down = n3[0] * n3[0] + n3[1] * n3[1] + focal2 * n3[2] * n3[2];
    if (!(across > 0) || !(down > 0)) return apparentRatio(corners);
    const ratio = Math.sqrt(across / down);
    return ratio >= 1 ? ratio : 1 / ratio;
}

/** Cuánto se parece a una tarjeta ID-1 la proporción de un cuadrilátero, de 0 a 1. */
export function aspectScore(corners, width, height) {
    const distance = Math.log(trueRatio(corners, width, height) / ID1_RATIO);
    return Math.exp(-(distance * distance) / (2 * ASPECT_SIGMA * ASPECT_SIGMA));
}

function isConvex(corners) {
    let sign = 0;
    for (let index = 0; index < 4; index += 1) {
        const a = corners[index];
        const b = corners[(index + 1) % 4];
        const c = corners[(index + 2) % 4];
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(cross) < 1e-9) return false;
        if (!sign) sign = Math.sign(cross);
        else if (Math.sign(cross) !== sign) return false;
    }
    return true;
}

function cornerAngles(corners) {
    return corners.map((corner, index) => {
        const previous = corners[(index + 3) % 4];
        const next = corners[(index + 1) % 4];
        const ax = previous.x - corner.x;
        const ay = previous.y - corner.y;
        const bx = next.x - corner.x;
        const by = next.y - corner.y;
        const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
        return Math.acos(Math.max(-1, Math.min(1, cos))) / DEG;
    });
}

/**
 * Qué parte de un lado tiene borde debajo, entre 0 y 1. Se mira solo el 84 %
 * central: en las puntas la tarjeta es redonda y ahí no hay recta.
 */
function sideSupport(map, a, b, samples = 28, from = 0.08, to = 0.92) {
    const { width, height, edges, angle, floor, full } = map;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const tolerance = Math.cos(14 * DEG);
    let total = 0;
    for (let k = 0; k < samples; k += 1) {
        const t = from + ((to - from) * (k + 0.5)) / samples;
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        let best = 0;
        for (let offset = -2; offset <= 2; offset += 1) {
            const x = Math.round(px + nx * offset);
            const y = Math.round(py + ny * offset);
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const i = y * width + x;
            const value = edges[i];
            if (value < floor) continue;
            const along = Math.abs(Math.cos(angle[i]) * nx + Math.sin(angle[i]) * ny);
            if (along < tolerance) continue;
            best = Math.max(best, Math.min(1, value / full));
        }
        total += best;
    }
    return total / samples;
}

/**
 * Las `keep` tarjetas más probables entre las rectas de la foto, distintas
 * entre sí y de mejor a peor. Las esquinas van en coordenadas de `map`,
 * ordenadas con `orderCorners`.
 */
export function findCards(map, lines = houghLines(map), keep = 5) {
    const { width, height } = map;
    const shortSide = Math.min(width, height);
    const imageArea = width * height;
    const near = Math.hypot(width, height) * 0.03;
    const parallel = Math.cos(32 * DEG);
    const crossing = Math.cos(48 * DEG);
    const pairs = [];
    for (let i = 0; i < lines.length; i += 1) {
        for (let j = i + 1; j < lines.length; j += 1) {
            const a = lines[i];
            const b = lines[j];
            const dot = a.nx * b.nx + a.ny * b.ny;
            if (Math.abs(dot) < parallel) continue;
            if (Math.abs(a.rho - Math.sign(dot) * b.rho) < shortSide * 0.1) continue;
            const sign = Math.sign(dot);
            const nx = a.nx + sign * b.nx;
            const ny = a.ny + sign * b.ny;
            const norm = Math.hypot(nx, ny) || 1;
            pairs.push({ a, b, nx: nx / norm, ny: ny / norm });
        }
    }

    const top = [];
    const bar = () => (top.length < keep ? 0 : top[top.length - 1].score);
    for (let p = 0; p < pairs.length; p += 1) {
        for (let q = p + 1; q < pairs.length; q += 1) {
            const first = pairs[p];
            const second = pairs[q];
            if (Math.abs(first.nx * second.nx + first.ny * second.ny) > crossing) continue;
            if (first.a === second.a || first.a === second.b || first.b === second.a || first.b === second.b) continue;
            const points = [
                intersect(first.a, second.a),
                intersect(first.a, second.b),
                intersect(first.b, second.b),
                intersect(first.b, second.a)
            ];
            if (points.some(point => !point)) continue;
            if (points.some(point => point.x < -0.12 * width || point.x > 1.12 * width || point.y < -0.12 * height || point.y > 1.12 * height)) continue;
            let corners = signedArea(points) < 0 ? [...points].reverse() : points;
            if (!isConvex(corners)) continue;
            const area = Math.abs(signedArea(corners));
            if (area < imageArea * 0.025) continue;
            if (Math.min(...sideLengths(corners)) < shortSide * 0.1) continue;
            const angles = cornerAngles(corners);
            if (angles.some(value => value < 52 || value > 128)) continue;
            if (Math.abs(Math.log(apparentRatio(corners) / ID1_RATIO)) > 0.45) continue;
            corners = orderCorners(corners);
            const aspect = aspectScore(corners, width, height);
            if (aspect < 0.03) continue;
            const size = (area / imageArea) ** 0.25;
            if (aspect * size <= bar()) continue;
            const support = corners.map((corner, index) => sideSupport(map, corner, corners[(index + 1) % 4]));
            const mean = support.reduce((sum, value) => sum + value, 0) / 4;
            const weakest = Math.min(...support);
            if (mean * Math.sqrt(weakest) * aspect * size <= bar()) continue;
            const score = mean * Math.sqrt(weakest) * aspect * size * overrunFactor(map, corners);
            if (score <= bar()) continue;
            const candidate = { corners, score, support, aspect, area: area / imageArea };
            const twin = top.findIndex(other => other.corners.every((corner, index) => Math.hypot(corner.x - corners[index].x, corner.y - corners[index].y) < near));
            if (twin >= 0) {
                if (top[twin].score >= score) continue;
                top.splice(twin, 1);
            }
            top.push(candidate);
            top.sort((left, right) => right.score - left.score);
            if (top.length > keep) top.pop();
        }
    }
    return top;
}

/** La tarjeta más probable, o `null`. */
export function findCard(map, lines = houghLines(map)) {
    return findCards(map, lines, 1)[0] ?? null;
}

/**
 * Castigo, de 1 (ninguno) hacia 0, por el borde que sigue más allá de las
 * esquinas. El canto de una tarjeta se acaba en su esquina; las líneas de un
 * mantel a cuadros, las juntas de las baldosas o el canto de un folio que
 * asoma por debajo siguen de largo.
 */
function overrunFactor(map, corners) {
    let total = 0;
    for (let index = 0; index < 4; index += 1) {
        const a = corners[index];
        const b = corners[(index + 1) % 4];
        total += sideSupport(map, a, b, 8, 1.04, 1.24) + sideSupport(map, a, b, 8, -0.24, -0.04);
    }
    return 1 - (0.85 * total) / 8;
}

/* ── 4. Ajuste fino ──────────────────────────────────────────────────────── */

function sampleRgb(image, x, y, out) {
    const { width, height, data } = image;
    const fx = Math.max(0, Math.min(width - 1, x - 0.5));
    const fy = Math.max(0, Math.min(height - 1, y - 0.5));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const ax = fx - x0;
    const ay = fy - y0;
    const i00 = (y0 * width + x0) * 4;
    const i10 = (y0 * width + x1) * 4;
    const i01 = (y1 * width + x0) * 4;
    const i11 = (y1 * width + x1) * 4;
    for (let c = 0; c < 3; c += 1) {
        const top = data[i00 + c] + (data[i10 + c] - data[i00 + c]) * ax;
        const bottom = data[i01 + c] + (data[i11 + c] - data[i01 + c]) * ax;
        out[c] = top + (bottom - top) * ay;
    }
}

/** Recta de mínimos cuadrados totales ponderada: `{ nx, ny, c }`. */
function fitLine(points) {
    let weight = 0;
    let mx = 0;
    let my = 0;
    for (const point of points) {
        weight += point.w;
        mx += point.x * point.w;
        my += point.y * point.w;
    }
    if (!weight) return null;
    mx /= weight;
    my /= weight;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const point of points) {
        const dx = point.x - mx;
        const dy = point.y - my;
        sxx += dx * dx * point.w;
        syy += dy * dy * point.w;
        sxy += dx * dy * point.w;
    }
    // La normal es el vector propio del menor valor propio de la covarianza.
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const nx = -Math.sin(theta);
    const ny = Math.cos(theta);
    return { nx, ny, c: nx * mx + ny * my };
}

/** Los saltos de color de un perfil más fuertes que el ruido, de mayor a menor. */
function profilePeaks(strength, size, keep) {
    const peaks = [];
    for (let s = 2; s <= size - 3; s += 1) {
        if (strength[s] < 2.5 || strength[s] <= strength[s - 1] || strength[s] < strength[s + 1]) continue;
        peaks.push(s);
    }
    return peaks.sort((left, right) => strength[right] - strength[left]).slice(0, keep);
}

/** El candidato de cada perfil que cae sobre `line`, si lo hay: el más fuerte. */
function onLine(profiles, line, tolerance) {
    const chosen = [];
    for (const candidates of profiles) {
        let best = null;
        for (const point of candidates) {
            if (Math.abs(line.nx * point.x + line.ny * point.y - line.c) > tolerance) continue;
            if (!best || point.w > best.w) best = point;
        }
        if (best) chosen.push(best);
    }
    return chosen;
}

/**
 * Ajusta un lado (de `a` a `b`) al borde de verdad. En `samples` perfiles
 * perpendiculares de ±`search` píxeles guarda los tres saltos de color más
 * fuertes, y gana la recta que encuentra salto en más perfiles y con más
 * fuerza (un RANSAC sin azar). El canto recorre el lado entero; un código de
 * barras pegado al borde, un dedo o una raya impresa solo ocupan un tramo, y
 * el borde exterior de la sombra es más suave que el canto. `null` si no hay
 * un borde claro, o si el que hay se aparta más de `shift` en el centro del
 * lado.
 */
export function fitSide(image, a, b, { search = 12, samples = 48, shift = search * 0.85 } = {}) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 8) return null;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const size = search * 2 + 1;
    const profile = new Float32Array(size * 3);
    const smooth = new Float32Array(size * 3);
    const strength = new Float32Array(size);
    const rgb = [0, 0, 0];
    const profiles = [];
    for (let k = 0; k < samples; k += 1) {
        const t = 0.1 + (0.8 * (k + 0.5)) / samples;
        const bx = a.x + dx * t;
        const by = a.y + dy * t;
        for (let s = 0; s < size; s += 1) {
            sampleRgb(image, bx + nx * (s - search), by + ny * (s - search), rgb);
            profile[s * 3] = rgb[0];
            profile[s * 3 + 1] = rgb[1];
            profile[s * 3 + 2] = rgb[2];
        }
        for (let s = 0; s < size; s += 1) {
            const before = Math.max(0, s - 1);
            const after = Math.min(size - 1, s + 1);
            for (let c = 0; c < 3; c += 1) smooth[s * 3 + c] = (profile[before * 3 + c] + 2 * profile[s * 3 + c] + profile[after * 3 + c]) / 4;
        }
        strength[0] = 0;
        strength[size - 1] = 0;
        for (let s = 1; s < size - 1; s += 1) {
            let sum = 0;
            for (let c = 0; c < 3; c += 1) {
                const derivative = (smooth[(s + 1) * 3 + c] - smooth[(s - 1) * 3 + c]) / 2;
                sum += derivative * derivative;
            }
            strength[s] = Math.sqrt(sum);
        }
        profiles.push(profilePeaks(strength, size, 3).map(peak => {
            const left = strength[peak - 1];
            const middle = strength[peak];
            const right = strength[peak + 1];
            const curvature = left - 2 * middle + right;
            const delta = curvature < 0 ? Math.max(-0.5, Math.min(0.5, (left - right) / (2 * curvature))) : 0;
            const offset = peak + delta - search;
            return { x: bx + nx * offset, y: by + ny * offset, w: middle };
        }));
    }

    // Hipótesis: rectas por dos saltos de perfiles alejados (un tercio del lado).
    const gap = Math.ceil(samples / 3);
    const turn = Math.cos(6 * DEG);
    let best = null;
    for (let i = 0; i + gap < samples; i += 1) {
        for (const p of profiles[i]) {
            for (let j = i + gap; j < samples; j += 1) {
                for (const q of profiles[j]) {
                    const line = lineThrough(p, q);
                    if (Math.abs(line.nx * nx + line.ny * ny) < turn) continue;
                    let score = 0;
                    for (const candidates of profiles) {
                        let w = 0;
                        for (const point of candidates) {
                            if (point.w > w && Math.abs(line.nx * point.x + line.ny * point.y - line.c) <= 1.2) w = point.w;
                        }
                        score += w;
                    }
                    if (!best || score > best.score) best = { line, score };
                }
            }
        }
    }
    if (!best) return null;
    let inliers = onLine(profiles, best.line, 1.5);
    if (inliers.length < samples * 0.4) return null;
    let line = fitLine(inliers);
    if (!line) return null;
    inliers = onLine(profiles, line, 1.2);
    if (inliers.length < samples * 0.4) return null;
    line = fitLine(inliers) || line;
    if (inliers.reduce((sum, point) => sum + point.w, 0) / inliers.length < 3) return null;
    // Un ajuste que gira la recta o se va lejos encontró otra cosa.
    if (Math.abs(line.nx * nx + line.ny * ny) < Math.cos(5 * DEG)) return null;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    if (Math.abs(line.nx * midX + line.ny * midY - line.c) > shift) return null;
    return { ...line, inliers: inliers.length / samples };
}

/**
 * Las esquinas ajustadas al borde real: cada lado se reajusta por separado y
 * las esquinas son los cruces de lados vecinos. Un lado sin borde claro se
 * queda donde estaba.
 */
export function fitQuad(image, corners, options = {}) {
    const fits = corners.map((corner, index) => fitSide(image, corner, corners[(index + 1) % 4], options));
    const support = fits.map(fit => fit?.inliers ?? 0);
    const lines = fits.map((fit, index) => fit || lineThrough(corners[index], corners[(index + 1) % 4]));
    const refined = lines.map((line, index) => intersect(lines[(index + 3) % 4], line));
    if (refined.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))) return { corners, support };
    // Si el ajuste deforma el cuadrilátero, vale más el de partida.
    const limit = Math.max(4, (options.search ?? 12) * 1.5);
    if (refined.some((point, index) => Math.hypot(point.x - corners[index].x, point.y - corners[index].y) > limit)) return { corners, support };
    return { corners: refined, support };
}

export function refineCorners(image, corners, options = {}) {
    return fitQuad(image, corners, options).corners;
}

/**
 * Busca la tarjeta en `image` (cualquier tamaño). Devuelve las esquinas en
 * píxeles de `image`, ordenadas en el sentido de las agujas del reloj desde
 * arriba a la izquierda, y si se encontró de verdad (`found`) o son las de
 * reserva: un rectángulo ID-1 centrado para colocar a mano.
 */
export function detectCard(image) {
    const small = downscale(image, DETECT_SIDE);
    const scale = image.width / small.width;
    const card = findCard(edgeMap(small));
    const found = Boolean(card && card.score >= 0.12 && Math.min(...card.support) >= 0.3);
    if (!found) return { found: false, corners: fallbackCorners(image.width, image.height), score: card?.score ?? 0 };
    let corners = card.corners.map(point => ({ x: point.x * scale, y: point.y * scale }));
    // En la copia pequeña el canto y su sombra se funden en un solo borde
    // ancho, y la recta puede caer en la sombra: primero se busca con margen
    // y luego una ventana corta lo centra en el canto.
    corners = refineCorners(image, corners, { search: Math.max(8, Math.round(scale * 4.5 + 6)) });
    corners = refineCorners(image, corners, { search: Math.max(5, Math.round(scale * 1.5 + 3)) });
    return { found: true, corners, score: card.score, support: card.support };
}

/** Un rectángulo ID-1 centrado que ocupa el 70 % del lado útil. */
export function fallbackCorners(width, height) {
    let w = width * 0.7;
    let h = w / ID1_RATIO;
    if (h > height * 0.7) {
        h = height * 0.7;
        w = h * ID1_RATIO;
    }
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
}

/** ¿Alguna esquina cae fuera de la foto? Falta un trozo de tarjeta. */
export function isCut(corners, width, height) {
    const margin = Math.min(width, height) * 0.01;
    return corners.some(point => point.x < -margin || point.y < -margin || point.x > width + margin || point.y > height + margin);
}

/* ── 5. Enderezar ────────────────────────────────────────────────────────── */

/**
 * Homografía del cuadrado unidad al cuadrilátero (Heckbert, 1989):
 * (0,0)→p0, (1,0)→p1, (1,1)→p2, (0,1)→p3.
 */
export function squareToQuad([p0, p1, p2, p3]) {
    const sx = p0.x - p1.x + p2.x - p3.x;
    const sy = p0.y - p1.y + p2.y - p3.y;
    if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
        return { a: p1.x - p0.x, b: p2.x - p1.x, c: p0.x, d: p1.y - p0.y, e: p2.y - p1.y, f: p0.y, g: 0, h: 0 };
    }
    const dx1 = p1.x - p2.x;
    const dx2 = p3.x - p2.x;
    const dy1 = p1.y - p2.y;
    const dy2 = p3.y - p2.y;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (sx * dy2 - dx2 * sy) / den;
    const h = (dx1 * sy - sx * dy1) / den;
    return {
        a: p1.x - p0.x + g * p1.x,
        b: p3.x - p0.x + h * p3.x,
        c: p0.x,
        d: p1.y - p0.y + g * p1.y,
        e: p3.y - p0.y + h * p3.y,
        f: p0.y,
        g,
        h
    };
}

export function mapPoint(matrix, u, v) {
    const w = matrix.g * u + matrix.h * v + 1;
    return { x: (matrix.a * u + matrix.b * v + matrix.c) / w, y: (matrix.d * u + matrix.e * v + matrix.f) / w };
}

/** Gira el orden de las esquinas `turns` cuartos de vuelta en sentido horario. */
export function rotateCorners(corners, turns) {
    const shift = ((turns % 4) + 4) % 4;
    return corners.map((_, index) => corners[(index - shift + 4) % 4]);
}

/**
 * El orden de esquinas que deja la tarjeta como se ve impresa: tumbada (el
 * lado largo arriba) y girada `turns` cuartos de vuelta a mano. Una tarjeta
 * fotografiada de pie se tumba girándola un cuarto en sentido horario; si
 * era hacia el otro lado, el botón de girar lo corrige.
 */
export function orientCorners(corners, turns = 0) {
    const [top, right, bottom, left] = sideLengths(corners);
    const upright = top + bottom < right + left;
    return rotateCorners(corners, turns + (upright ? 1 : 0));
}

/** ¿Las esquinas, en este orden, describen una tarjeta de pie? */
export function isPortrait(corners) {
    const [top, right, bottom, left] = sideLengths(corners);
    return top + bottom < right + left;
}

/**
 * La tarjeta enderezada: `width`×`height` píxeles que cubren la tarjeta
 * menos `inset` (fracción de su ancho y de su alto) por cada lado. `levels`
 * es la pirámide de la foto; `corners`, en píxeles del piso 0 y en el orden
 * de salida (arriba a la izquierda primero).
 */
export function warpCard(levels, corners, { width, height, insetX = 0, insetY = 0 }) {
    const [top, , bottom] = sideLengths(corners);
    const across = (top + bottom) / 2;
    let level = 0;
    while (level + 1 < levels.length && across / 2 ** (level + 1) >= width) level += 1;
    const source = levels[level];
    const factor = levels[0].width / source.width;
    const quad = corners.map(point => ({ x: point.x / factor, y: point.y / factor }));
    const matrix = squareToQuad(quad);
    const sourceAcross = across / factor;
    // Si aún queda más de un 30 % de reducción, cada píxel promedia 2×2 muestras.
    const grid = sourceAcross / width > 1.3 ? 2 : 1;
    const result = createImage(width, height);
    const out = result.data;
    const rgb = [0, 0, 0];
    const spanU = 1 - insetX * 2;
    const spanV = 1 - insetY * 2;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            let r = 0;
            let g = 0;
            let b = 0;
            for (let sy = 0; sy < grid; sy += 1) {
                const v = insetY + (spanV * (y + (sy + 0.5) / grid)) / height;
                for (let sx = 0; sx < grid; sx += 1) {
                    const u = insetX + (spanU * (x + (sx + 0.5) / grid)) / width;
                    const point = mapPoint(matrix, u, v);
                    if (point.x < 0 || point.y < 0 || point.x > source.width || point.y > source.height) {
                        // Fuera de la foto (una tarjeta cortada): papel blanco.
                        r += 255;
                        g += 255;
                        b += 255;
                        continue;
                    }
                    sampleRgb(source, point.x, point.y, rgb);
                    r += rgb[0];
                    g += rgb[1];
                    b += rgb[2];
                }
            }
            const samples = grid * grid;
            const index = (y * width + x) * 4;
            out[index] = r / samples;
            out[index + 1] = g / samples;
            out[index + 2] = b / samples;
            out[index + 3] = 255;
        }
    }
    return result;
}

/* ── Luz, color y forma ──────────────────────────────────────────────────── */

function percentile(histogram, total, fraction) {
    const target = total * fraction;
    let sum = 0;
    for (let value = 0; value < 256; value += 1) {
        sum += histogram[value];
        if (sum >= target) return value;
    }
    return 255;
}

/**
 * Corrige la luz como un escáner: quita parte del tinte de la bombilla
 * (equilibrio de blancos con las zonas claras de la propia tarjeta) y estira
 * el contraste sin quemar los blancos. Moderado a propósito: los fondos de
 * seguridad de las tarjetas tienen color y no se quiere borrarlo.
 */
export function correctLight(image) {
    const { data } = image;
    const pixels = data.length / 4;
    const histogram = new Uint32Array(256);
    for (let index = 0; index < data.length; index += 4) {
        histogram[(data[index] * 77 + data[index + 1] * 150 + data[index + 2] * 29) >> 8] += 1;
    }
    const bright = percentile(histogram, pixels, 0.88);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let index = 0; index < data.length; index += 4) {
        const luma = (data[index] * 77 + data[index + 1] * 150 + data[index + 2] * 29) >> 8;
        if (luma < bright || Math.max(data[index], data[index + 1], data[index + 2]) > 251) continue;
        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
        count += 1;
    }
    const gains = [1, 1, 1];
    if (count > pixels * 0.01) {
        const means = [r / count, g / count, b / count];
        const gray = (means[0] + means[1] + means[2]) / 3;
        for (let c = 0; c < 3; c += 1) {
            const full = gray / Math.max(1, means[c]);
            gains[c] = Math.max(0.85, Math.min(1.18, 1 + (full - 1) * 0.6));
        }
    }
    const low = percentile(histogram, pixels, 0.005);
    const high = Math.max(low + 1, percentile(histogram, pixels, 0.995));
    const targetLow = low * 0.55;
    const targetHigh = Math.max(Math.min(high, 252), 246);
    const gain = Math.min(1.8, (targetHigh - targetLow) / (high - low));
    for (let index = 0; index < data.length; index += 4) {
        for (let c = 0; c < 3; c += 1) {
            data[index + c] = (data[index + c] * gains[c] - low) * gain + targetLow;
        }
    }
    return image;
}

export function toGrayscale(image) {
    const { data } = image;
    for (let index = 0; index < data.length; index += 4) {
        const luma = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
        data[index] = luma;
        data[index + 1] = luma;
        data[index + 2] = luma;
    }
    return image;
}

/** Máscara de enfoque suave: devuelve la nitidez que quita el remuestreo. */
export function sharpen(image, amount = 0.45, sigma = 0.9) {
    const { width, height, data } = image;
    const planes = planesOf(image);
    const kernel = gaussianKernel(sigma);
    for (const plane of planes) blurPlane(plane, width, height, kernel);
    for (let index = 0, pixel = 0; pixel < data.length; index += 1, pixel += 4) {
        for (let c = 0; c < 3; c += 1) {
            const value = data[pixel + c];
            data[pixel + c] = value + (value - planes[c][index]) * amount;
        }
    }
    return image;
}

/**
 * Redondea las esquinas (radio en píxeles) dejando blanco fuera, con borde
 * suavizado: así la tarjeta se puede poner sobre la hoja sin transparencias.
 */
export function roundCorners(image, radius) {
    const { width, height, data } = image;
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    if (!r) return image;
    const span = Math.ceil(r) + 1;
    const blend = (x, y) => {
        const px = x + 0.5;
        const py = y + 0.5;
        const cx = px < r ? r : px > width - r ? width - r : px;
        const cy = py < r ? r : py > height - r ? height - r : py;
        const distance = Math.hypot(px - cx, py - cy);
        const alpha = Math.max(0, Math.min(1, r - distance + 0.5));
        if (alpha >= 1) return;
        const index = (y * width + x) * 4;
        for (let c = 0; c < 3; c += 1) data[index + c] = data[index + c] * alpha + 255 * (1 - alpha);
    };
    for (let y = 0; y < Math.min(span, height); y += 1) {
        for (let x = 0; x < Math.min(span, width); x += 1) {
            blend(x, y);
            blend(width - 1 - x, y);
            blend(x, height - 1 - y);
            blend(width - 1 - x, height - 1 - y);
        }
    }
    return image;
}

/**
 * La tarjeta lista para la hoja. `pxPerMm` fija la resolución; `turns` son
 * los cuartos de vuelta que pidió quien la sube. Devuelve la imagen y su
 * tamaño en milímetros (la tarjeta menos `CARD_INSET_MM` por lado).
 */
export function renderCard(levels, corners, { pxPerMm, turns = 0, light = true, grayscale = false, crisp = true }) {
    const ordered = orientCorners(corners, turns);
    const portrait = isPortrait(ordered);
    const card = portrait ? { width: ID1.height, height: ID1.width } : { width: ID1.width, height: ID1.height };
    const mm = { width: card.width - CARD_INSET_MM * 2, height: card.height - CARD_INSET_MM * 2 };
    const width = Math.max(8, Math.round(mm.width * pxPerMm));
    const height = Math.max(8, Math.round(mm.height * pxPerMm));
    // Las esquinas ya están en el orden de salida: arriba a la izquierda,
    // arriba a la derecha… de la tarjeta tal como se va a ver.
    const image = warpCard(levels, ordered, {
        width,
        height,
        insetX: CARD_INSET_MM / card.width,
        insetY: CARD_INSET_MM / card.height
    });
    if (light) correctLight(image);
    if (grayscale) toGrayscale(image);
    if (crisp && pxPerMm >= 6) sharpen(image);
    roundCorners(image, (ID1.radius - CARD_INSET_MM) * pxPerMm);
    return { image, mm, portrait };
}

/* ── La hoja ─────────────────────────────────────────────────────────────── */

export const MM_TO_PT = 72 / 25.4;

/** Tamaños de hoja en puntos PDF. */
export const SHEETS = Object.freeze({
    a4: Object.freeze({ width: 595.28, height: 841.89 }),
    letter: Object.freeze({ width: 612, height: 792 })
});

/**
 * Dónde va cada cara en la hoja, en puntos y con el origen abajo a la
 * izquierda, como en PDF. Una sobre otra, centradas, a tamaño real (o al
 * `scale` pedido) y separadas como en una fotocopia de las dos caras. Si a
 * ese tamaño no caben con márgenes de 15 mm, se reducen.
 */
export function sheetLayout({ sheet = 'a4', scale = 1, cards }) {
    const page = SHEETS[sheet] || SHEETS.a4;
    const margin = 15 * MM_TO_PT;
    const sizes = cards.map(card => ({ width: card.mm.width * MM_TO_PT * scale, height: card.mm.height * MM_TO_PT * scale }));
    const gap = 14 * MM_TO_PT * scale;
    const stack = sizes.reduce((sum, size) => sum + size.height, 0) + gap * Math.max(0, sizes.length - 1);
    const widest = Math.max(0, ...sizes.map(size => size.width));
    const fit = Math.min(1, (page.height - margin * 2) / (stack || 1), (page.width - margin * 2) / (widest || 1));
    let top = (page.height + stack * fit) / 2;
    const boxes = sizes.map(size => {
        const width = size.width * fit;
        const height = size.height * fit;
        const box = { x: (page.width - width) / 2, y: top - height, width, height };
        top -= height + gap * fit;
        return box;
    });
    return { width: page.width, height: page.height, boxes, scale: scale * fit };
}

/** Lo que WinAnsi tiene fuera de Latin-1: comillas, rayas, euro, Œ… */
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
/** Letras sin forma descompuesta que tienen una latina evidente. */
const LOOKALIKE = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', ı: 'i', Ŧ: 'T', ŧ: 't' };

/**
 * El texto que puede escribir la fuente estándar de un PDF (Helvetica, con
 * codificación WinAnsi): una letra con un acento que no tiene se queda sin
 * él, y lo que no tiene equivalente (emojis, otros alfabetos) se quita.
 */
export function pdfSafeText(text) {
    return String(text || '')
        .normalize('NFC')
        .replace(/[^\u0020-\u007E\u00A0-\u00FF]/gu, character => {
            if (WIN_ANSI_EXTRA.includes(character)) return character;
            if (LOOKALIKE[character]) return LOOKALIKE[character];
            const plain = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return /^[\u0020-\u007E\u00A0-\u00FF]+$/.test(plain) ? plain : '';
        })
        .replace(/\s+/g, ' ')
        .trim();
}
