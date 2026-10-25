import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const SOURCE = readFileSync(new URL('./magicMouse.ts', import.meta.url), 'utf8');

const POSITIONED_BY_ENGINE = [
  '.ely-cursor-paw',
  '.ely-cursor-comet',
];

const INDEPENDENT_TRANSFORMS = ['rotate', 'translate', 'scale'];

function ruleBodyFor(selector) {
  const index = SOURCE.indexOf(`${selector} {`);
  if (index === -1) return null;
  const open = SOURCE.indexOf('{', index);
  const close = SOURCE.indexOf('}', open);
  return SOURCE.slice(open + 1, close);
}

test('las capas que posiciona el motor no llevan transformaciones independientes en CSS', () => {
  for (const selector of POSITIONED_BY_ENGINE) {
    const body = ruleBodyFor(selector);
    if (body === null) continue;

    for (const property of INDEPENDENT_TRANSFORMS) {
      assert.doesNotMatch(
        body,
        new RegExp(`(^|[;{\\s])${property}\\s*:`),
        `${selector} declara "${property}:", lo que provocaría desvío de coordenadas respecto al puntero`,
      );
    }
  }
});

test('la inclinación de la patita vive dentro del SVG girando sobre su centro (12, 12)', () => {
  assert.match(
    SOURCE,
    /<g transform='rotate\(-?\d+(\.\d+)? 12 12\)'>/,
    'la patita debe inclinarse dentro del SVG girando sobre (12, 12)',
  );
});

test('el SVG de la patita veterinaria está bien formado y contiene las almohadillas y la cruz', () => {
  const start = SOURCE.indexOf("export const PAW_SVG =");
  const end = SOURCE.indexOf("';", start);
  const literal = SOURCE.slice(start, end);

  assert.ok(literal.includes('<svg'), 'debe contener etiqueta svg');
  assert.ok(literal.includes('</svg>'), 'debe cerrar etiqueta svg');
  assert.equal(
    (literal.match(/<ellipse/g) || []).length, 4,
    'la patita lleva cuatro almohadillas',
  );
  assert.ok(literal.includes('evenodd'), 'debe usar evenodd para calar la cruz médica en el corazón');
});

test('el movimiento reducido desactiva estrictamente ambas capas', () => {
  const mediaIndex = SOURCE.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(mediaIndex > -1, 'debe contener consulta prefers-reduced-motion');
  const media = SOURCE.slice(mediaIndex);
  assert.match(media, /\.ely-cursor\s*\{\s*display:\s*none\s*!important;/, 'el cursor debe ocultarse');
  assert.match(media, /\$\{TOUCH_SPLASH_CLASS\}\s*\{\s*display:\s*none\s*!important;/, 'el toque debe ocultarse');
});

test('la huella táctil filtra eventos y solo responde a pointerType === "touch"', () => {
  assert.match(
    SOURCE,
    /e\.pointerType\s*!==\s*'touch'/,
    'debe filtrar para no responder a ratón',
  );
});

test('el módulo exporta la API canónica y de inicialización', () => {
  assert.match(SOURCE, /export function initMagicMouse/, 'debe exportar initMagicMouse');
  assert.match(SOURCE, /export function setMagicMouseEnabled/, 'debe exportar setMagicMouseEnabled');
  assert.match(SOURCE, /export function isMagicMouseEnabled/, 'debe exportar isMagicMouseEnabled');
  assert.match(SOURCE, /\(?window(?:\s+as\s+any\)?)\.ElysiumMouse\s*=/, 'debe enlazar window.ElysiumMouse');
});
